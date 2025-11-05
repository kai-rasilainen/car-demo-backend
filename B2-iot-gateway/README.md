# B2 - IoT Gateway & Microserver

Node.js microserver that acts as a gateway between cars and the backend systems. Handles real-time data collection, command relay, and communication with multiple protocols.

## Features

- **WebSocket Server**: Real-time communication with cars
- **MQTT Support**: Cloud communication integration
- **Redis Integration**: Message passing with C2 central broker
- **MongoDB Storage**: Stores car data to B3 database
- **Command Relay**: Forwards commands from B1/A2 to cars
- **Multi-protocol**: Supports WebSocket, MQTT, and Redis
- **Connection Management**: Tracks connected cars

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy environment configuration:
```bash
cp .env.example .env
```

3. Start required services:
   - MongoDB (B3)
   - Redis (C2)
   - MQTT broker (optional)

4. Start the IoT gateway:
```bash
npm start
# or for development:
npm run dev
```

5. Server will be available at:
   - HTTP API: http://localhost:3002
   - WebSocket: ws://localhost:8080

## Testing

Run the test client to simulate cars:
```bash
node test-client.js
```

This will simulate 3 cars (ABC-123, XYZ-789, DEF-456) connecting and sending data.

## API Endpoints

### GET /api/connected-cars
Get list of currently connected cars.

### GET /api/car/{licensePlate}/history
Get historical data for a specific car.

**Query parameters:**
- `limit`: Number of records to return (default: 100)

### POST /api/car/{licensePlate}/command
Send command to a specific car.

**Request body:**
```json
{
  "command": "start_heating"
}
```

### GET /health
Health check and connection status.

## Communication Protocols

### WebSocket (Cars → B2)
Cars connect via WebSocket and send data:
```json
{
  "licensePlate": "ABC-123",
  "indoorTemp": 22.5,
  "outdoorTemp": 15.2,
  "gps": {
    "lat": 60.1699,
    "lng": 24.9384
  },
  "timestamp": "2024-11-04T10:30:00.000Z"
}
```

### Redis (B2 ↔ C2)
- Publishes car data to `car:{licensePlate}:data`
- Subscribes to commands on `car:*:commands`
- Subscribes to sensor data on `sensors:*`

### MQTT (B2 ↔ Cloud)
- Subscribes to `car/+/data` for cloud commands
- Publishes car data to cloud endpoints

## Data Flow

1. **C5** sensors → **C2** → **B2** (via Redis)
2. **Cars** → **B2** (via WebSocket) → **B3** (MongoDB)
3. **B1** commands → **B2** (via Redis) → **Cars** (via WebSocket)
4. **Cloud** → **B2** (via MQTT) → **Cars** (via WebSocket)

## Dependencies

- **B3** (MongoDB) - Data storage
- **C2** (Redis) - Message broker
- **MQTT Broker** - Cloud communication (optional)

## Environment Variables

See `.env.example` for configuration options.