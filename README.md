# Car Demo System - Backend Services

Backend services and databases for the car demo system.

## Components

- **B1-web-server**: Express.js REST API server
- **B2-iot-gateway**: Node.js IoT gateway and microserver
- **B3-realtime-database**: MongoDB setup and queries
- **B4-static-database**: PostgreSQL setup and queries

## Quick Start

```bash
# Start databases
docker-compose up -d

# Install dependencies
npm run install-all

# Start all services
npm run dev-all
```

## Services

| Service | Port | Description |
|---------|------|-------------|
| B1 Web Server | 3001 | REST API for frontend apps |
| B2 IoT Gateway | 3002, 8080 | WebSocket & HTTP gateway |
| MongoDB (B3) | 27017 | Real-time car data |
| PostgreSQL (B4) | 5432 | Static car information |
