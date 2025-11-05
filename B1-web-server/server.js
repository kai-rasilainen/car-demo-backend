const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
const { Client } = require('pg');
const redis = require('redis');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Database connections
let mongoClient, pgClient, redisClient;

// MongoDB connection (B3 - Real-time data)
const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017';
const MONGO_DB = 'cardata';

// PostgreSQL connection (B4 - Static data)
const PG_CONFIG = {
  user: process.env.PG_USER || 'postgres',
  host: process.env.PG_HOST || 'localhost',
  database: process.env.PG_DB || 'carinfo',
  password: process.env.PG_PASSWORD || 'password',
  port: process.env.PG_PORT || 5432,
};

// Redis connection (C2 communication)
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Initialize database connections
async function initDatabases() {
  try {
    // MongoDB
    mongoClient = new MongoClient(MONGO_URL);
    await mongoClient.connect();
    console.log('Connected to MongoDB');

    // PostgreSQL
    pgClient = new Client(PG_CONFIG);
    await pgClient.connect();
    console.log('Connected to PostgreSQL');

    // Redis
    redisClient = redis.createClient({ url: REDIS_URL });
    await redisClient.connect();
    console.log('Connected to Redis');

  } catch (error) {
    console.error('Database connection error:', error);
    // Continue without databases for demo purposes
  }
}

// Mock data for demo when databases are not available
const mockCarData = {
  'ABC-123': {
    licensePlate: 'ABC-123',
    owner: 'John Doe',
    lastService: '2024-10-15',
    indoorTemp: 22.5,
    outdoorTemp: 15.2,
    gps: { lat: 60.1699, lng: 24.9384 }, // Helsinki
    lastUpdated: new Date().toISOString()
  },
  'XYZ-789': {
    licensePlate: 'XYZ-789',
    owner: 'Jane Smith',
    lastService: '2024-09-20',
    indoorTemp: 18.0,
    outdoorTemp: 12.8,
    gps: { lat: 60.1733, lng: 24.9410 },
    lastUpdated: new Date().toISOString()
  },
  'DEF-456': {
    licensePlate: 'DEF-456',
    owner: 'Mike Johnson',
    lastService: '2024-11-01',
    indoorTemp: 25.1,
    outdoorTemp: 8.5,
    gps: { lat: 60.1681, lng: 24.9342 },
    lastUpdated: new Date().toISOString()
  }
};

// Get car data by license plate
app.get('/api/car/:licensePlate', async (req, res) => {
  try {
    const { licensePlate } = req.params;
    console.log(`Fetching data for license plate: ${licensePlate}`);

    let carData = null;

    if (mongoClient && pgClient) {
      // Get real-time data from MongoDB (B3)
      const db = mongoClient.db(MONGO_DB);
      const realtimeData = await db.collection('car_data').findOne(
        { licensePlate },
        { sort: { timestamp: -1 } }
      );

      // Get static data from PostgreSQL (B4)
      const staticResult = await pgClient.query(
        'SELECT * FROM cars WHERE license_plate = $1',
        [licensePlate]
      );

      if (realtimeData && staticResult.rows.length > 0) {
        const staticData = staticResult.rows[0];
        carData = {
          licensePlate,
          owner: staticData.owner_name,
          lastService: staticData.last_service,
          indoorTemp: realtimeData.indoorTemp,
          outdoorTemp: realtimeData.outdoorTemp,
          gps: realtimeData.gps,
          lastUpdated: realtimeData.timestamp
        };
      }
    }

    // Fallback to mock data if databases not available or no data found
    if (!carData) {
      carData = mockCarData[licensePlate.toUpperCase()];
      if (carData) {
        // Add some random variation to temperatures for demo
        carData = {
          ...carData,
          indoorTemp: carData.indoorTemp + (Math.random() - 0.5) * 2,
          outdoorTemp: carData.outdoorTemp + (Math.random() - 0.5) * 3,
          lastUpdated: new Date().toISOString()
        };
      }
    }

    if (!carData) {
      return res.status(404).json({ error: 'Car not found' });
    }

    res.json(carData);
  } catch (error) {
    console.error('Error fetching car data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Send command to car
app.post('/api/car/:licensePlate/command', async (req, res) => {
  try {
    const { licensePlate } = req.params;
    const { command } = req.body;

    console.log(`Sending command "${command}" to car ${licensePlate}`);

    // Try to send command via Redis (C2)
    if (redisClient) {
      const commandData = {
        licensePlate,
        command,
        timestamp: new Date().toISOString()
      };
      
      await redisClient.publish(`car:${licensePlate}:commands`, JSON.stringify(commandData));
      console.log('Command sent via Redis');
    }

    // For demo purposes, always return success
    res.json({ 
      success: true, 
      message: `Command "${command}" sent to car ${licensePlate}`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error sending command:', error);
    res.status(500).json({ error: 'Failed to send command' });
  }
});

// Get all cars (for staff dashboard)
app.get('/api/cars', async (req, res) => {
  try {
    let cars = [];

    if (pgClient) {
      const result = await pgClient.query('SELECT * FROM cars');
      cars = result.rows.map(row => ({
        licensePlate: row.license_plate,
        owner: row.owner_name,
        lastService: row.last_service
      }));
    } else {
      // Fallback to mock data
      cars = Object.values(mockCarData).map(car => ({
        licensePlate: car.licensePlate,
        owner: car.owner,
        lastService: car.lastService
      }));
    }

    res.json(cars);
  } catch (error) {
    console.error('Error fetching cars:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  const status = {
    server: 'ok',
    mongodb: mongoClient ? 'connected' : 'disconnected',
    postgresql: pgClient ? 'connected' : 'disconnected',
    redis: redisClient ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  };
  res.json(status);
});

// Start server
async function startServer() {
  await initDatabases();
  
  app.listen(PORT, () => {
    console.log(`B1 Web Server API running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`Car data endpoint: http://localhost:${PORT}/api/car/{licensePlate}`);
  });
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down server...');
  if (mongoClient) await mongoClient.close();
  if (pgClient) await pgClient.end();
  if (redisClient) await redisClient.quit();
  process.exit(0);
});

startServer().catch(console.error);