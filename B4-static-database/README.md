# B4 - Static Car Information Database

PostgreSQL database for storing non-realtime car information including owner details, service history, insurance, and rental information.

## Features

- **Car Information**: Owner details, make/model, VIN numbers
- **Service Records**: Maintenance history and scheduled services
- **Insurance Tracking**: Policy information and expiration dates
- **Rental Management**: Availability and current rental status
- **Advanced Queries**: Search, filtering, and analytics
- **Data Integrity**: Foreign keys, triggers, and constraints
- **Docker Support**: Easy deployment with Docker Compose

## Setup

### Option 1: Docker (Recommended)

1. Start PostgreSQL with Docker Compose:
```bash
docker-compose up -d
```

2. Check if container is running:
```bash
docker-compose ps
```

3. View logs:
```bash
docker-compose logs postgres
```

### Option 2: Local PostgreSQL

1. Install PostgreSQL locally
2. Create database and run init-db.sql
3. Copy environment configuration:
```bash
cp .env.example .env
```

## Database Schema

### Tables

#### cars
- Primary car information (license plate, owner, make/model, year)
- Unique constraints on license_plate and VIN

#### service_records
- Maintenance and service history
- Links to cars via license_plate
- Tracks costs, mileage, and next service dates

#### insurance
- Insurance policy information
- Coverage types and expiration dates

#### rental_info
- Rental rates and availability
- Current renter information
- Total rental days tracking

### Views

#### car_summary
Complete car overview combining all related information.

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
const CarInfoQueries = require('./queries');
const queries = new CarInfoQueries();

await queries.connect();

// Get car information
const car = await queries.getCarInfo('ABC-123');

// Get complete summary
const summary = await queries.getCarSummary('ABC-123');

// Get service history
const services = await queries.getServiceHistory('ABC-123');

// Search cars
const results = await queries.searchCars({ 
  make: 'Toyota', 
  available: true 
});

await queries.disconnect();
```

## API Methods

### Car Information
- `getCarInfo(licensePlate)` - Basic car details
- `getCarSummary(licensePlate)` - Complete overview
- `getAllCarsSummary()` - All cars with summaries
- `addCar(carData)` - Add new car
- `updateCarOwner(licensePlate, ownerData)` - Update owner info

### Service Management
- `getServiceHistory(licensePlate, limit)` - Service records
- `addServiceRecord(serviceData)` - Add service record
- `getCarsDueForService(daysAhead)` - Upcoming services

### Rental Management
- `getRentalInfo(licensePlate)` - Rental details
- `getAvailableCars()` - Cars available for rent
- `updateRentalAvailability(licensePlate, isAvailable, renterData)` - Update rental status

### Insurance
- `getExpiringInsurance(daysAhead)` - Expiring policies

### Search & Analytics
- `searchCars(criteria)` - Search with filters
- `getDatabaseStats()` - Database statistics

## Sample Data

The database includes sample data for:
- 5 cars (ABC-123, XYZ-789, DEF-456, GHI-789, JKL-012)
- Service records for each car
- Insurance policies
- Rental information

## Connection Details

- **Host**: localhost
- **Port**: 5432
- **Database**: carinfo
- **User**: postgres
- **Password**: password

## Docker Commands

```bash
# Start database
docker-compose up -d

# Stop database
docker-compose down

# View logs
docker-compose logs -f postgres

# Connect to PostgreSQL shell
docker exec -it car-info-postgres psql -U postgres -d carinfo

# Backup database
docker exec car-info-postgres pg_dump -U postgres carinfo > backup.sql

# Remove all data and containers
docker-compose down -v
```

## Integration

This database is used by:
- **B1** - Web server API (read car owner and service info)
- **A2** - Rental staff app (manage rentals and services)

## Performance

- Indexes on license_plate, service_date, availability
- Efficient joins with foreign key relationships
- Optimized queries for common use cases
- Automatic timestamp updates with triggers