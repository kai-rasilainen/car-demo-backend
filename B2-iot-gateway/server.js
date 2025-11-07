const express = require('express');
const WebSocket = require('ws');
const { MongoClient } = require('mongodb');
const redis = require('redis');
const mqtt = require('mqtt');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3002;
const WS_PORT = process.env.WS_PORT || 8081;

// Middleware
app.use(cors());
app.use(express.json());

// Database connections
let mongoClient, redisClient, mqttClient;

// MongoDB connection (B3 - Store data)
const MONGO_URL = process.env.MONGO_URL || 'mongodb://admin:password@localhost:27017';
const MONGO_DB = process.env.MONGO_DB || 'cardata';

// Redis connection (C2 - Communication)
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// MQTT connection (for cloud communication)
const MQTT_BROKER = process.env.MQTT_BROKER || 'mqtt://localhost:1883';

// WebSocket server for real-time communication
const wss = new WebSocket.Server({ port: WS_PORT });

// Connected cars storage
const connectedCars = new Map();

// Initialize connections
async function initConnections() {
  try {
    // MongoDB
    mongoClient = new MongoClient(MONGO_URL);
    await mongoClient.connect();
    console.log('Connected to MongoDB');

    // Redis
    redisClient = redis.createClient({ url: REDIS_URL });
    await redisClient.connect();
    console.log('Connected to Redis');

    // Subscribe to car commands
    await redisClient.subscribe('car:*:commands', (message, channel) => {
      console.log(`Received command on ${channel}: ${message}`);
      handleCarCommand(channel, message);
    });

    // MQTT
    mqttClient = mqtt.connect(MQTT_BROKER);
    mqttClient.on('connect', () => {
      console.log('Connected to MQTT broker');
      mqttClient.subscribe('car/+/data');
    });

    mqttClient.on('message', (topic, message) => {
      console.log(`MQTT message on ${topic}: ${message.toString()}`);
      handleMqttMessage(topic, message);
    });

  } catch (error) {
    console.error('Connection error:', error);
  }
}

// Handle WebSocket connections from cars
wss.on('connection', (ws, req) => {
  console.log('New car connected via WebSocket');

  ws.on('message', async (data) => {
    try {
      const carData = JSON.parse(data.toString());
      console.log('Received car data:', carData);

      // Store license plate for this connection
      if (carData.licensePlate) {
        connectedCars.set(ws, carData.licensePlate);
        ws.licensePlate = carData.licensePlate;
      }

      // Store data in MongoDB (B3)
      await storeCarData(carData);

      // Forward to Redis (C2) for other components
      if (redisClient && carData.licensePlate) {
        await redisClient.publish(
          `car:${carData.licensePlate}:data`, 
          JSON.stringify(carData)
        );
      }

    } catch (error) {
      console.error('Error processing car data:', error);
    }
  });

  ws.on('close', () => {
    const licensePlate = connectedCars.get(ws);
    if (licensePlate) {
      console.log(`Car ${licensePlate} disconnected`);
      connectedCars.delete(ws);
    }
  });

  // Send connection confirmation
  ws.send(JSON.stringify({ 
    type: 'connection_confirmed', 
    timestamp: new Date().toISOString() 
  }));
});

// Store car data in MongoDB
async function storeCarData(carData) {
  if (!mongoClient) return;

  try {
    const db = mongoClient.db(MONGO_DB);
    const collection = db.collection('car_data');

    const document = {
      ...carData,
      timestamp: new Date(),
      _id: undefined // Let MongoDB generate ID
    };

    await collection.insertOne(document);
    console.log(`Stored data for car ${carData.licensePlate}`);
  } catch (error) {
    console.error('Error storing car data:', error);
  }
}

// Handle commands from Redis
function handleCarCommand(channel, message) {
  try {
    const commandData = JSON.parse(message);
    const licensePlate = commandData.licensePlate;

    // Find WebSocket connection for this car
    for (const [ws, carLicense] of connectedCars.entries()) {
      if (carLicense === licensePlate && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'command',
          command: commandData.command,
          timestamp: commandData.timestamp
        }));
        console.log(`Sent command "${commandData.command}" to car ${licensePlate}`);
        break;
      }
    }
  } catch (error) {
    console.error('Error handling car command:', error);
  }
}

// Handle MQTT messages (cloud communication)
function handleMqttMessage(topic, message) {
  try {
    const topicParts = topic.split('/');
    const licensePlate = topicParts[1];
    const data = JSON.parse(message.toString());

    console.log(`Cloud data for car ${licensePlate}:`, data);

    // Forward cloud commands to car via WebSocket
    if (data.command) {
      for (const [ws, carLicense] of connectedCars.entries()) {
        if (carLicense === licensePlate && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'cloud_command',
            command: data.command,
            timestamp: new Date().toISOString()
          }));
          break;
        }
      }
    }
  } catch (error) {
    console.error('Error handling MQTT message:', error);
  }
}

// REST API endpoints

// Get connected cars
app.get('/api/connected-cars', (req, res) => {
  const cars = Array.from(connectedCars.values());
  res.json({ connectedCars: cars, count: cars.length });
});

// Get car data from MongoDB
app.get('/api/car/:licensePlate/history', async (req, res) => {
  try {
    const { licensePlate } = req.params;
    const limit = parseInt(req.query.limit) || 100;

    if (!mongoClient) {
      return res.status(503).json({ error: 'Database not available' });
    }

    const db = mongoClient.db(MONGO_DB);
    const collection = db.collection('car_data');

    const data = await collection
      .find({ licensePlate })
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();

    res.json(data);
  } catch (error) {
    console.error('Error fetching car history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Send command to car
app.post('/api/car/:licensePlate/command', async (req, res) => {
  try {
    const { licensePlate } = req.params;
    const { command } = req.body;

    // Send via Redis for B1 compatibility
    if (redisClient) {
      const commandData = {
        licensePlate,
        command,
        timestamp: new Date().toISOString()
      };
      
      await redisClient.publish(`car:${licensePlate}:commands`, JSON.stringify(commandData));
    }

    // Also send directly if car is connected
    let sent = false;
    for (const [ws, carLicense] of connectedCars.entries()) {
      if (carLicense === licensePlate && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'command',
          command,
          timestamp: new Date().toISOString()
        }));
        sent = true;
        break;
      }
    }

    res.json({ 
      success: true, 
      directSent: sent,
      message: `Command "${command}" sent to car ${licensePlate}` 
    });

  } catch (error) {
    console.error('Error sending command:', error);
    res.status(500).json({ error: 'Failed to send command' });
  }
});

// Health check
app.get('/health', (req, res) => {
  const status = {
    server: 'ok',
    websocket: 'ok',
    mongodb: mongoClient ? 'connected' : 'disconnected',
    redis: redisClient ? 'connected' : 'disconnected',
    mqtt: mqttClient?.connected ? 'connected' : 'disconnected',
    connectedCars: connectedCars.size,
    timestamp: new Date().toISOString()
  };
  res.json(status);
});

// Data processing from C2 (Redis subscriber)
async function processFromC2() {
  if (!redisClient) return;

  // Subscribe to sensor data from C2
  await redisClient.subscribe('sensors:*', async (message, channel) => {
    try {
      const sensorData = JSON.parse(message);
      console.log(`Received sensor data: ${channel}`, sensorData);
      
      // Store in MongoDB (B3)
      await storeCarData(sensorData);
      
    } catch (error) {
      console.error('Error processing C2 data:', error);
    }
  });
}

// Start server
async function startServer() {
  await initConnections();
  await processFromC2();
  
  app.listen(PORT, () => {
    console.log(`B2 IoT Gateway HTTP server running on port ${PORT}`);
    console.log(`WebSocket server running on port ${WS_PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
  });
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down IoT Gateway...');
  if (mongoClient) await mongoClient.close();
  if (redisClient) await redisClient.quit();
  if (mqttClient) mqttClient.end();
  wss.close();
  process.exit(0);
});

startServer().catch(console.error);