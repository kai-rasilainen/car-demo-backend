# Environment Configuration

## Setup

Each service uses environment variables for configuration. To set up:

1. **B1 Web Server:**
   ```bash
   cd B1-web-server
   cp .env.example .env
   # Edit .env with your configuration
   ```

2. **B2 IoT Gateway:**
   ```bash
   cd B2-iot-gateway
   cp .env.example .env
   # Edit .env with your configuration
   ```

## Configuration Variables

### B1 Web Server

- `PORT` - HTTP server port (default: 3001)
- `MONGO_URL` - MongoDB connection string with credentials
- `MONGO_DB` - MongoDB database name (default: cardata)
- `PG_USER` - PostgreSQL username
- `PG_PASSWORD` - PostgreSQL password
- `PG_HOST` - PostgreSQL host
- `PG_DB` - PostgreSQL database name
- `PG_PORT` - PostgreSQL port (default: 5432)
- `REDIS_URL` - Redis connection URL

### B2 IoT Gateway

- `PORT` - HTTP server port (default: 3002)
- `WS_PORT` - WebSocket port (default: 8081)
- `MONGO_URL` - MongoDB connection string with credentials
- `MONGO_DB` - MongoDB database name (default: cardata)
- `REDIS_URL` - Redis connection URL
- `MQTT_BROKER` - MQTT broker URL

## Security Notes

- `.env` files are git-ignored and should **never** be committed
- Use `.env.example` as a template (safe to commit)
- For production, use proper secrets management (e.g., AWS Secrets Manager, Azure Key Vault)
- Change default passwords in production environments

## Docker Configuration

When using Docker, you can:
1. Mount `.env` files as volumes
2. Use `env_file` in docker-compose.yml
3. Set environment variables directly in docker-compose.yml
