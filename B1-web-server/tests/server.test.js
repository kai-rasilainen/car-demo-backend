const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { MongoClient } = require('mongodb');

// Mock the server file to avoid actual database connections during import
jest.mock('mongodb', () => ({
  MongoClient: {
    connect: jest.fn(),
  },
}));

jest.mock('pg', () => ({
  Client: jest.fn().mockImplementation(() => ({
    connect: jest.fn(),
    end: jest.fn(),
    query: jest.fn(),
  })),
}));

jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
  })),
}));

describe('B1 Web Server API Tests', () => {
  let app;
  let mongoServer;
  let mongoClient;

  beforeAll(async () => {
    // Start in-memory MongoDB
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // Set test environment variables
    process.env.MONGO_URL = mongoUri;
    process.env.PG_HOST = 'localhost';
    process.env.PG_PORT = '5432';
    process.env.PG_DB = 'test_carinfo';
    process.env.PG_USER = 'test';
    process.env.PG_PASSWORD = 'test';
    process.env.REDIS_URL = 'redis://localhost:6379';

    // Import app after setting environment variables
    app = require('../B1-web-server/server');
  });

  afterAll(async () => {
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  describe('Health Endpoints', () => {
    test('GET /health should return server status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('server');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body.server).toBe('ok');
    });

    test('GET /health should include database status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('mongodb');
      expect(response.body).toHaveProperty('postgresql');
      expect(response.body).toHaveProperty('redis');
    });
  });

  describe('Car API Endpoints', () => {
    test('GET /api/car/:licensePlate should return car data', async () => {
      const licensePlate = 'ABC-123';
      const response = await request(app)
        .get(`/api/car/${licensePlate}`)
        .expect(200);

      expect(response.body).toHaveProperty('licensePlate', licensePlate);
      expect(response.body).toHaveProperty('owner');
      expect(response.body).toHaveProperty('indoorTemp');
      expect(response.body).toHaveProperty('outdoorTemp');
      expect(response.body).toHaveProperty('gps');
      expect(response.body.gps).toHaveProperty('lat');
      expect(response.body.gps).toHaveProperty('lng');
    });

    test('GET /api/car/:licensePlate should return 404 for unknown car', async () => {
      const response = await request(app)
        .get('/api/car/UNKNOWN-123')
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    test('GET /api/cars should return array of cars', async () => {
      const response = await request(app)
        .get('/api/cars')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      if (response.body.length > 0) {
        expect(response.body[0]).toHaveProperty('licensePlate');
        expect(response.body[0]).toHaveProperty('owner');
      }
    });
  });

  describe('Car Commands', () => {
    test('POST /api/car/:licensePlate/command should accept valid commands', async () => {
      const licensePlate = 'ABC-123';
      const command = { command: 'start_heating' };

      const response = await request(app)
        .post(`/api/car/${licensePlate}/command`)
        .send(command)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('licensePlate', licensePlate);
      expect(response.body).toHaveProperty('command', 'start_heating');
    });

    test('POST /api/car/:licensePlate/command should reject invalid commands', async () => {
      const licensePlate = 'ABC-123';
      const command = { command: 'invalid_command' };

      const response = await request(app)
        .post(`/api/car/${licensePlate}/command`)
        .send(command)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    test('POST /api/car/:licensePlate/command should require command field', async () => {
      const licensePlate = 'ABC-123';

      const response = await request(app)
        .post(`/api/car/${licensePlate}/command`)
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Input Validation', () => {
    test('Should handle invalid license plate format', async () => {
      const response = await request(app)
        .get('/api/car/INVALID@PLATE')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    test('Should handle SQL injection attempts', async () => {
      const response = await request(app)
        .get('/api/car/ABC-123; DROP TABLE cars;--')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Error Handling', () => {
    test('Should handle database connection errors gracefully', async () => {
      // This test would require mocking database failures
      // Implementation depends on actual error handling in the server
    });

    test('Should return proper content-type headers', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.headers['content-type']).toMatch(/application\/json/);
    });
  });

  describe('CORS', () => {
    test('Should include CORS headers', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.headers).toHaveProperty('access-control-allow-origin');
    });
  });
});