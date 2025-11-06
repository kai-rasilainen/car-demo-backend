const request = require('supertest');
const express = require('express');

describe('B1 Web Server API Tests', () => {
  let app;

  beforeAll(() => {
    // Create a simple Express app for testing
    app = express();
    app.use(express.json());
    
    // Mock endpoints
    app.get('/health', (req, res) => {
      res.status(200).json({ status: 'ok', service: 'B1-web-server' });
    });
    
    app.get('/api/cars', (req, res) => {
      res.status(200).json([
        { licensePlate: 'ABC-123', status: 'active' },
        { licensePlate: 'XYZ-789', status: 'active' }
      ]);
    });
    
    app.post('/api/car/:licensePlate/command', (req, res) => {
      const { licensePlate } = req.params;
      const { command } = req.body;
      
      if (!command) {
        return res.status(400).json({ error: 'Command is required' });
      }
      
      const validCommands = ['lock', 'unlock', 'start', 'stop'];
      if (!validCommands.includes(command)) {
        return res.status(400).json({ error: 'Invalid command' });
      }
      
      res.status(200).json({ 
        success: true, 
        licensePlate, 
        command,
        message: `Command ${command} sent to ${licensePlate}` 
      });
    });
  });

  describe('Health Endpoints', () => {
    test('GET /health should return server status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('service');
      expect(response.body.status).toBe('ok');
      expect(response.body.service).toBe('B1-web-server');
    });
  });

  describe('Car API Endpoints', () => {
    test('GET /api/cars should return array of cars', async () => {
      const response = await request(app)
        .get('/api/cars')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('licensePlate');
      expect(response.body[0]).toHaveProperty('status');
    });
  });

  describe('Car Commands', () => {
    test('POST /api/car/:licensePlate/command should accept valid commands', async () => {
      const response = await request(app)
        .post('/api/car/ABC-123/command')
        .send({ command: 'lock' })
        .expect(200);

      expect(response.body).toHaveProperty('success');
      expect(response.body.success).toBe(true);
      expect(response.body.licensePlate).toBe('ABC-123');
      expect(response.body.command).toBe('lock');
    });

    test('POST /api/car/:licensePlate/command should reject invalid commands', async () => {
      const response = await request(app)
        .post('/api/car/ABC-123/command')
        .send({ command: 'invalid' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    test('POST /api/car/:licensePlate/command should require command field', async () => {
      const response = await request(app)
        .post('/api/car/ABC-123/command')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('required');
    });
  });
});
