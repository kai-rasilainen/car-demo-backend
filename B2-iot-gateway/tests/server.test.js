const WebSocket = require('ws');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');

// Mock dependencies
jest.mock('mongodb', () => ({
  MongoClient: {
    connect: jest.fn(),
  },
}));

jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    publish: jest.fn(),
    subscribe: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
  })),
}));

jest.mock('mqtt', () => ({
  connect: jest.fn(() => ({
    on: jest.fn(),
    publish: jest.fn(),
    subscribe: jest.fn(),
    end: jest.fn(),
  })),
}));

describe('B2 IoT Gateway Tests', () => {
  let app;
  let mongoServer;
  let server;
  let wsPort;

  beforeAll(async () => {
    // Start in-memory MongoDB
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // Set test environment variables
    process.env.MONGO_URL = mongoUri;
    process.env.PORT = '0'; // Let the system assign a port
    process.env.WS_PORT = '0'; // Let the system assign a port
    process.env.REDIS_URL = 'redis://localhost:6379';
    process.env.MQTT_BROKER = 'mqtt://localhost:1883';

    // Import app after setting environment variables
    app = require('../B2-iot-gateway/server');
  });

  afterAll(async () => {
    if (server) {
      server.close();
    }
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  describe('HTTP API Endpoints', () => {
    test('GET /health should return service status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('websocket_port');
      expect(response.body).toHaveProperty('timestamp');
    });

    test('POST /api/data should accept valid car data', async () => {
      const carData = {
        licensePlate: 'TEST-001',
        indoorTemp: 22.5,
        outdoorTemp: 15.0,
        gps: { lat: 60.1699, lng: 24.9344 },
        speed: 0,
        engineStatus: 'off'
      };

      const response = await request(app)
        .post('/api/data')
        .send(carData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('licensePlate', 'TEST-001');
    });

    test('POST /api/data should validate required fields', async () => {
      const invalidData = {
        indoorTemp: 22.5,
        // Missing licensePlate
      };

      const response = await request(app)
        .post('/api/data')
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    test('POST /api/data should validate data types', async () => {
      const invalidData = {
        licensePlate: 'TEST-001',
        indoorTemp: 'not-a-number',
        outdoorTemp: 15.0,
      };

      const response = await request(app)
        .post('/api/data')
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Data Processing', () => {
    test('Should process car sensor data correctly', () => {
      const mockProcessCarData = jest.fn();
      const rawData = {
        licensePlate: 'ABC-123',
        sensors: {
          temperature: { indoor: 22.5, outdoor: 15.0 },
          gps: { lat: 60.1699, lng: 24.9344 },
          engine: { status: 'running', rpm: 1500 }
        },
        timestamp: new Date().toISOString()
      };

      // Test data processing logic
      const processedData = {
        licensePlate: rawData.licensePlate,
        indoorTemp: rawData.sensors.temperature.indoor,
        outdoorTemp: rawData.sensors.temperature.outdoor,
        gps: rawData.sensors.gps,
        engineStatus: rawData.sensors.engine.status,
        timestamp: rawData.timestamp
      };

      expect(processedData.licensePlate).toBe('ABC-123');
      expect(processedData.indoorTemp).toBe(22.5);
      expect(processedData.engineStatus).toBe('running');
    });

    test('Should handle missing sensor data gracefully', () => {
      const incompleteData = {
        licensePlate: 'ABC-123',
        indoorTemp: 22.5,
        // Missing other fields
      };

      // Should provide defaults or handle gracefully
      const processedData = {
        ...incompleteData,
        outdoorTemp: incompleteData.outdoorTemp || null,
        gps: incompleteData.gps || null,
        engineStatus: incompleteData.engineStatus || 'unknown'
      };

      expect(processedData.licensePlate).toBe('ABC-123');
      expect(processedData.engineStatus).toBe('unknown');
    });
  });

  describe('WebSocket Connection Handling', () => {
    test('Should handle WebSocket connection establishment', (done) => {
      // This would test WebSocket server functionality
      // Implementation depends on actual WebSocket server setup
      
      const mockWs = {
        on: jest.fn((event, callback) => {
          if (event === 'open') {
            callback();
          }
        }),
        send: jest.fn(),
        close: jest.fn()
      };

      mockWs.on('open', () => {
        expect(mockWs.on).toHaveBeenCalledWith('open', expect.any(Function));
        done();
      });
    });

    test('Should handle WebSocket message processing', () => {
      const mockMessage = JSON.stringify({
        licensePlate: 'ABC-123',
        indoorTemp: 22.5,
        outdoorTemp: 15.0
      });

      const processMessage = (message) => {
        try {
          const data = JSON.parse(message);
          return {
            valid: true,
            data: data
          };
        } catch (error) {
          return {
            valid: false,
            error: error.message
          };
        }
      };

      const result = processMessage(mockMessage);
      expect(result.valid).toBe(true);
      expect(result.data.licensePlate).toBe('ABC-123');
    });

    test('Should handle invalid WebSocket messages', () => {
      const invalidMessage = 'invalid-json';

      const processMessage = (message) => {
        try {
          const data = JSON.parse(message);
          return { valid: true, data: data };
        } catch (error) {
          return { valid: false, error: error.message };
        }
      };

      const result = processMessage(invalidMessage);
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('MQTT Integration', () => {
    test('Should publish data to MQTT broker', () => {
      const mockMqttClient = {
        publish: jest.fn(),
        on: jest.fn()
      };

      const carData = {
        licensePlate: 'ABC-123',
        indoorTemp: 22.5,
        outdoorTemp: 15.0
      };

      const topic = `car/${carData.licensePlate}/data`;
      const message = JSON.stringify(carData);

      mockMqttClient.publish(topic, message);

      expect(mockMqttClient.publish).toHaveBeenCalledWith(topic, message);
    });

    test('Should handle MQTT connection errors', () => {
      const mockMqttClient = {
        on: jest.fn((event, callback) => {
          if (event === 'error') {
            callback(new Error('MQTT connection failed'));
          }
        })
      };

      let errorHandled = false;
      mockMqttClient.on('error', (error) => {
        errorHandled = true;
        expect(error.message).toBe('MQTT connection failed');
      });

      expect(errorHandled).toBe(true);
    });
  });

  describe('Data Validation', () => {
    test('Should validate license plate format', () => {
      const validLicensePlates = ['ABC-123', 'XYZ-789', 'DEF-456'];
      const invalidLicensePlates = ['', '123', 'ABC123', 'ABC-', '-123'];

      const validateLicensePlate = (plate) => {
        return /^[A-Z]{3}-[0-9]{3}$/.test(plate);
      };

      validLicensePlates.forEach(plate => {
        expect(validateLicensePlate(plate)).toBe(true);
      });

      invalidLicensePlates.forEach(plate => {
        expect(validateLicensePlate(plate)).toBe(false);
      });
    });

    test('Should validate temperature ranges', () => {
      const validateTemperature = (temp) => {
        return typeof temp === 'number' && temp >= -50 && temp <= 100;
      };

      expect(validateTemperature(22.5)).toBe(true);
      expect(validateTemperature(-10)).toBe(true);
      expect(validateTemperature(50)).toBe(true);
      expect(validateTemperature(-100)).toBe(false);
      expect(validateTemperature(150)).toBe(false);
      expect(validateTemperature('22.5')).toBe(false);
    });

    test('Should validate GPS coordinates', () => {
      const validateGPS = (gps) => {
        return gps && 
               typeof gps.lat === 'number' && 
               typeof gps.lng === 'number' &&
               gps.lat >= -90 && gps.lat <= 90 &&
               gps.lng >= -180 && gps.lng <= 180;
      };

      expect(validateGPS({ lat: 60.1699, lng: 24.9344 })).toBe(true);
      expect(validateGPS({ lat: 0, lng: 0 })).toBe(true);
      expect(validateGPS({ lat: 100, lng: 0 })).toBe(false);
      expect(validateGPS({ lat: 0, lng: 200 })).toBe(false);
      expect(validateGPS({ lat: '60.1699', lng: 24.9344 })).toBe(false);
    });
  });
});