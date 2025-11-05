// MongoDB initialization script for car data
db = db.getSiblingDB('cardata');

// Create collections
db.createCollection('car_data');
db.createCollection('car_commands');

// Create indexes for better performance
db.car_data.createIndex({ "licensePlate": 1, "timestamp": -1 });
db.car_data.createIndex({ "timestamp": -1 });
db.car_data.createIndex({ "licensePlate": 1 });

db.car_commands.createIndex({ "licensePlate": 1, "timestamp": -1 });
db.car_commands.createIndex({ "timestamp": -1 });

// Insert sample data
db.car_data.insertMany([
  {
    licensePlate: "ABC-123",
    indoorTemp: 22.5,
    outdoorTemp: 15.2,
    gps: {
      lat: 60.1699,
      lng: 24.9384
    },
    speed: 0,
    engineStatus: "off",
    timestamp: new Date("2024-11-04T10:00:00Z")
  },
  {
    licensePlate: "XYZ-789", 
    indoorTemp: 18.0,
    outdoorTemp: 12.8,
    gps: {
      lat: 60.1733,
      lng: 24.9410
    },
    speed: 0,
    engineStatus: "off",
    timestamp: new Date("2024-11-04T10:00:00Z")
  },
  {
    licensePlate: "DEF-456",
    indoorTemp: 25.1,
    outdoorTemp: 8.5,
    gps: {
      lat: 60.1681,
      lng: 24.9342
    },
    speed: 0,
    engineStatus: "off",
    timestamp: new Date("2024-11-04T10:00:00Z")
  }
]);

// Insert sample commands
db.car_commands.insertMany([
  {
    licensePlate: "ABC-123",
    command: "start_heating",
    status: "executed",
    timestamp: new Date("2024-11-04T09:30:00Z")
  },
  {
    licensePlate: "XYZ-789",
    command: "service_mode",
    status: "pending",
    timestamp: new Date("2024-11-04T09:45:00Z")
  }
]);

print("MongoDB initialization completed for car data database");
print("Collections created: car_data, car_commands");
print("Indexes created for performance optimization");
print("Sample data inserted for testing");