const request = require('supertest');
const express = require('express');

describe('B2 IoT Gateway Tests', () => {
  let app;

  beforeAll(() => {
    // Create a simple Express app for testing
    app = express();
    app.use(express.json());
    
    // Mock endpoints
    app.get('/health', (req, res) => {
      res.status(200).json({ status: 'healthy', service: 'B2-iot-gateway' });
    });
    
    app.post('/api/data', (req, res) => {
      const data = req.body;
      
      if (!data.licensePlate || !data.temperature || !data.gps) {
        return res.status(400).json({ error: 'Invalid data format' });
      }
      
      res.status(200).json({ 
        success: true,
        message: 'Data received',
        data: data
      });
    });
  });

  describe('Health Check', () => {
    test('GET /health should return service status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toBe('healthy');
      expect(response.body.service).toBe('B2-iot-gateway');
    });
  });

  describe('Data Reception', () => {
    test('POST /api/data should accept valid sensor data', async () => {
      const sensorData = {
        licensePlate: 'ABC-123',
        temperature: 22.5,
        gps: { lat: 60.1699, lng: 24.9384 }
      };

      const response = await request(app)
        .post('/api/data')
        .send(sensorData)
        .expect(200);

      expect(response.body).toHaveProperty('success');
      expect(response.body.success).toBe(true);
    });

    test('POST /api/data should reject invalid data', async () => {
      const invalidData = {
        licensePlate: 'ABC-123'
        // missing required fields
      };

      const response = await request(app)
        .post('/api/data')
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });
});
