const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017';
const DB_NAME = 'cardata';

class CarDataQueries {
  constructor() {
    this.client = null;
    this.db = null;
  }

  async connect() {
    this.client = new MongoClient(MONGO_URL);
    await this.client.connect();
    this.db = this.client.db(DB_NAME);
    console.log('Connected to MongoDB');
  }

  async disconnect() {
    if (this.client) {
      await this.client.close();
      console.log('Disconnected from MongoDB');
    }
  }

  // Insert new car data
  async insertCarData(carData) {
    const collection = this.db.collection('car_data');
    const document = {
      ...carData,
      timestamp: new Date()
    };
    const result = await collection.insertOne(document);
    return result;
  }

  // Get latest data for a car
  async getLatestCarData(licensePlate) {
    const collection = this.db.collection('car_data');
    const result = await collection.findOne(
      { licensePlate },
      { sort: { timestamp: -1 } }
    );
    return result;
  }

  // Get car data history
  async getCarDataHistory(licensePlate, limit = 100) {
    const collection = this.db.collection('car_data');
    const results = await collection
      .find({ licensePlate })
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();
    return results;
  }

  // Get data within time range
  async getCarDataByTimeRange(licensePlate, startTime, endTime) {
    const collection = this.db.collection('car_data');
    const results = await collection
      .find({
        licensePlate,
        timestamp: {
          $gte: new Date(startTime),
          $lte: new Date(endTime)
        }
      })
      .sort({ timestamp: -1 })
      .toArray();
    return results;
  }

  // Get temperature statistics
  async getTemperatureStats(licensePlate, hours = 24) {
    const collection = this.db.collection('car_data');
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    const pipeline = [
      {
        $match: {
          licensePlate,
          timestamp: { $gte: cutoffTime }
        }
      },
      {
        $group: {
          _id: null,
          avgIndoorTemp: { $avg: "$indoorTemp" },
          maxIndoorTemp: { $max: "$indoorTemp" },
          minIndoorTemp: { $min: "$indoorTemp" },
          avgOutdoorTemp: { $avg: "$outdoorTemp" },
          maxOutdoorTemp: { $max: "$outdoorTemp" },
          minOutdoorTemp: { $min: "$outdoorTemp" },
          dataPoints: { $sum: 1 }
        }
      }
    ];

    const results = await collection.aggregate(pipeline).toArray();
    return results[0] || null;
  }

  // Get all cars with latest data
  async getAllCarsLatestData() {
    const collection = this.db.collection('car_data');
    const pipeline = [
      {
        $sort: { timestamp: -1 }
      },
      {
        $group: {
          _id: "$licensePlate",
          latestData: { $first: "$$ROOT" }
        }
      },
      {
        $replaceRoot: { newRoot: "$latestData" }
      }
    ];

    const results = await collection.aggregate(pipeline).toArray();
    return results;
  }

  // Insert command
  async insertCommand(commandData) {
    const collection = this.db.collection('car_commands');
    const document = {
      ...commandData,
      timestamp: new Date(),
      status: commandData.status || 'pending'
    };
    const result = await collection.insertOne(document);
    return result;
  }

  // Get command history
  async getCommandHistory(licensePlate, limit = 50) {
    const collection = this.db.collection('car_commands');
    const results = await collection
      .find({ licensePlate })
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();
    return results;
  }

  // Update command status
  async updateCommandStatus(commandId, status) {
    const collection = this.db.collection('car_commands');
    const result = await collection.updateOne(
      { _id: commandId },
      { $set: { status, updatedAt: new Date() } }
    );
    return result;
  }

  // Clean old data (older than specified days)
  async cleanOldData(daysToKeep = 30) {
    const collection = this.db.collection('car_data');
    const cutoffTime = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
    
    const result = await collection.deleteMany({
      timestamp: { $lt: cutoffTime }
    });
    
    console.log(`Deleted ${result.deletedCount} old records`);
    return result;
  }

  // Get database statistics
  async getDatabaseStats() {
    const carDataCount = await this.db.collection('car_data').countDocuments();
    const commandsCount = await this.db.collection('car_commands').countDocuments();
    const uniqueCars = await this.db.collection('car_data').distinct('licensePlate');
    
    const stats = await this.db.stats();
    
    return {
      carDataRecords: carDataCount,
      commandRecords: commandsCount,
      uniqueCars: uniqueCars.length,
      carList: uniqueCars,
      databaseSize: stats.dataSize,
      storageSize: stats.storageSize
    };
  }
}

module.exports = CarDataQueries;