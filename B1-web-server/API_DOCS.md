# B1 Web Server API Documentation

## Overview
B1 Web Server provides a REST API for accessing car data and sending commands to cars in the Car Demo System.

## Interactive API Documentation

**Swagger UI is available at:** `http://localhost:3001/api-docs`

The Swagger UI provides:
- Interactive API exploration
- Request/response examples
- "Try it out" functionality to test endpoints
- Complete API schema documentation

## Available Endpoints

### Health Check
- **GET** `/health` - Check server and database connection status

### Car Data
- **GET** `/api/cars` - Get list of all cars
- **GET** `/api/car/:licensePlate` - Get detailed data for a specific car

### Car Commands
- **POST** `/api/car/:licensePlate/command` - Send command to a car

## Quick Start

1. Start the B1 server:
   ```bash
   npm run dev
   ```

2. Open Swagger UI in your browser:
   ```
   http://localhost:3001/api-docs
   ```

3. Try the API endpoints:
   - Use the "Try it out" button on any endpoint
   - Enter parameters (e.g., license plate: `ABC-123`)
   - Click "Execute" to see the response

## Example Requests

### Get car data
```bash
curl http://localhost:3001/api/car/ABC-123
```

### Send command to car
```bash
curl -X POST http://localhost:3001/api/car/ABC-123/command \
  -H "Content-Type: application/json" \
  -d '{"command": "start_ac"}'
```

### Get all cars
```bash
curl http://localhost:3001/api/cars
```

## Available Commands

Commands that can be sent to cars:
- `start_ac` - Start air conditioning
- `stop_ac` - Stop air conditioning
- `lock_doors` - Lock all doors
- `unlock_doors` - Unlock all doors
- `start_engine` - Start engine remotely
- `stop_engine` - Stop engine

## Data Sources

The API combines data from multiple sources:
- **MongoDB** (B3) - Real-time sensor data (temperature, GPS)
- **PostgreSQL** (B4) - Static car information (owner, service history)
- **Redis** (C2) - Command message broker

## Response Format

All responses are in JSON format with appropriate HTTP status codes:
- `200` - Success
- `404` - Car not found
- `500` - Internal server error

## Technology Stack

- **OpenAPI 3.0** - API specification
- **Swagger UI** - Interactive documentation
- **swagger-jsdoc** - JSDoc to OpenAPI conversion
- **Express.js** - Web framework
