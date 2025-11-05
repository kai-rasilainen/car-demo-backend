# B3 - Real-time Car Data Database

MongoDB database for storing real-time car sensor data, GPS locations, and command history.

## Features

- **Real-time Data Storage**: Temperature, GPS, speed, engine status
- **Command Tracking**: Store and track car commands
- **Efficient Indexing**: Optimized for time-series queries
- **Data Aggregation**: Statistics and analytics queries
- **Data Retention**: Automatic cleanup of old data
- **Docker Support**: Easy deployment with Docker Compose

## Setup

### Option 1: Docker (Recommended)

1. Start MongoDB with Docker Compose:
```bash
docker-compose up -d
```

2. Check if container is running:
```bash
docker-compose ps
```

3. View logs:
```bash
docker-compose logs mongodb
```

### Option 2: Local MongoDB

1. Install MongoDB locally
2. Start MongoDB service
3. Copy environment configuration:
```bash
cp .env.example .env
```

## Database Schema

### car_data Collection
```json
{
  "_id": ObjectId,
  "licensePlate": "ABC-123",
  "indoorTemp": 22.5,
  "outdoorTemp": 15.2,
  "gps": {
    "lat": 60.1699,
    "lng": 24.9384
  },
  "speed": 65.5,
  "engineStatus": "running",
  "timestamp": ISODate("2024-11-04T10:30:00Z")
}
```

### car_commands Collection
```json
{
  "_id": ObjectId,
  "licensePlate": "ABC-123",
  "command": "start_heating",
  "status": "executed",
  "source": "A2-app",
  "timestamp": ISODate("2024-11-04T10:30:00Z"),
  "updatedAt": ISODate("2024-11-04T10:31:00Z")
}
```

## Indexes

- `{ licensePlate: 1, timestamp: -1 }` - Efficient car data queries
- `{ timestamp: -1 }` - Time-based queries
- `{ licensePlate: 1 }` - Car-specific queries

## Usage

### Install Dependencies
```bash
npm install
```

### Test Database Connection
```bash
npm test
```

### Query Examples

```javascript
const CarDataQueries = require('./queries');
const queries = new CarDataQueries();

await queries.connect();

// Get latest data for a car
const latest = await queries.getLatestCarData('ABC-123');

// Get temperature statistics
const stats = await queries.getTemperatureStats('ABC-123', 24);

// Insert new data
await queries.insertCarData({
  licensePlate: 'ABC-123',
  indoorTemp: 22.5,
  outdoorTemp: 15.2,
  gps: { lat: 60.1699, lng: 24.9384 }
});

await queries.disconnect();
```

## Data Management

### Cleanup Old Data
```javascript
// Remove data older than 30 days
await queries.cleanOldData(30);
```

### Database Statistics
```javascript
const stats = await queries.getDatabaseStats();
console.log(`Total records: ${stats.carDataRecords}`);
```

## Connection Details

- **Host**: localhost
- **Port**: 27017
- **Database**: cardata
- **Collections**: car_data, car_commands

## Docker Commands

```bash
# Start database
docker-compose up -d

# Stop database
docker-compose down

# View logs
docker-compose logs -f mongodb

# Connect to MongoDB shell
docker exec -it car-data-mongodb mongosh cardata

# Remove all data and containers
docker-compose down -v
```

## Integration

This database is used by:
- **B1** - Web server API (read car data)
- **B2** - IoT gateway (write car data)
- **C1** - Cloud communication (read/write)

## Performance

- Indexes optimize queries by license plate and timestamp
- Data is automatically sharded by license plate for scalability
- Old data cleanup prevents unlimited growth
- Aggregation pipelines provide efficient analytics