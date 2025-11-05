# B1 - Web Server API

Express.js REST API server providing car data endpoints for frontend applications (A1, A2).

## Features

- REST API for car data retrieval by license plate
- Integration with MongoDB (B3) for real-time data
- Integration with PostgreSQL (B4) for static car information
- Redis communication for sending commands to cars
- Mock data fallback for demo purposes
- Health check endpoint
- CORS enabled for frontend access

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy environment configuration:
```bash
cp .env.example .env
```

3. Start the databases (see B3 and B4 README files)

4. Start the server:
```bash
npm start
# or for development with auto-reload:
npm run dev
```

5. Server will be available at http://localhost:3001

## API Endpoints

### GET /api/car/{licensePlate}
Get car data by license plate number.

**Response:**
```json
{
  "licensePlate": "ABC-123",
  "owner": "John Doe",
  "lastService": "2024-10-15",
  "indoorTemp": 22.5,
  "outdoorTemp": 15.2,
  "gps": {
    "lat": 60.1699,
    "lng": 24.9384
  },
  "lastUpdated": "2024-11-04T10:30:00.000Z"
}
```

### POST /api/car/{licensePlate}/command
Send command to a car.

**Request body:**
```json
{
  "command": "start_heating"
}
```

### GET /api/cars
Get list of all cars (for staff dashboard).

### GET /health
Health check endpoint showing database connection status.

## Dependencies

- **B3** (MongoDB) - Real-time car data
- **B4** (PostgreSQL) - Static car information
- **C2** (Redis) - Command communication

## Mock Data

If databases are not available, the server uses mock data for these license plates:
- ABC-123 (John Doe)
- XYZ-789 (Jane Smith)
- DEF-456 (Mike Johnson)

## Environment Variables

See `.env.example` for required environment variables.