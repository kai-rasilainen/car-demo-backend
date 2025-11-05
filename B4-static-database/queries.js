const { Client } = require('pg');
require('dotenv').config();

const dbConfig = {
  user: process.env.PG_USER || 'postgres',
  host: process.env.PG_HOST || 'localhost',
  database: process.env.PG_DB || 'carinfo',
  password: process.env.PG_PASSWORD || 'password',
  port: process.env.PG_PORT || 5432,
};

class CarInfoQueries {
  constructor() {
    this.client = null;
  }

  async connect() {
    this.client = new Client(dbConfig);
    await this.client.connect();
    console.log('Connected to PostgreSQL');
  }

  async disconnect() {
    if (this.client) {
      await this.client.end();
      console.log('Disconnected from PostgreSQL');
    }
  }

  // Get car basic information
  async getCarInfo(licensePlate) {
    const query = `
      SELECT license_plate, owner_name, owner_phone, owner_email, 
             make, model, year, color, vin
      FROM cars 
      WHERE license_plate = $1
    `;
    const result = await this.client.query(query, [licensePlate]);
    return result.rows[0] || null;
  }

  // Get complete car summary
  async getCarSummary(licensePlate) {
    const query = `
      SELECT * FROM car_summary 
      WHERE license_plate = $1
    `;
    const result = await this.client.query(query, [licensePlate]);
    return result.rows[0] || null;
  }

  // Get all cars with summary
  async getAllCarsSummary() {
    const query = `SELECT * FROM car_summary ORDER BY license_plate`;
    const result = await this.client.query(query);
    return result.rows;
  }

  // Get service history for a car
  async getServiceHistory(licensePlate, limit = 10) {
    const query = `
      SELECT service_date, service_type, description, mileage, 
             cost, service_provider, next_service_date
      FROM service_records 
      WHERE license_plate = $1 
      ORDER BY service_date DESC 
      LIMIT $2
    `;
    const result = await this.client.query(query, [licensePlate, limit]);
    return result.rows;
  }

  // Add new car
  async addCar(carData) {
    const query = `
      INSERT INTO cars (license_plate, owner_name, owner_phone, owner_email, 
                       make, model, year, color, vin)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    const values = [
      carData.licensePlate,
      carData.ownerName,
      carData.ownerPhone,
      carData.ownerEmail,
      carData.make,
      carData.model,
      carData.year,
      carData.color,
      carData.vin
    ];
    const result = await this.client.query(query, values);
    return result.rows[0];
  }

  // Add service record
  async addServiceRecord(serviceData) {
    const query = `
      INSERT INTO service_records (license_plate, service_date, service_type, 
                                 description, mileage, cost, service_provider, next_service_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    const values = [
      serviceData.licensePlate,
      serviceData.serviceDate,
      serviceData.serviceType,
      serviceData.description,
      serviceData.mileage,
      serviceData.cost,
      serviceData.serviceProvider,
      serviceData.nextServiceDate
    ];
    const result = await this.client.query(query, values);
    return result.rows[0];
  }

  // Update car owner information
  async updateCarOwner(licensePlate, ownerData) {
    const query = `
      UPDATE cars 
      SET owner_name = $2, owner_phone = $3, owner_email = $4, updated_at = CURRENT_TIMESTAMP
      WHERE license_plate = $1
      RETURNING *
    `;
    const values = [licensePlate, ownerData.name, ownerData.phone, ownerData.email];
    const result = await this.client.query(query, values);
    return result.rows[0];
  }

  // Get rental information
  async getRentalInfo(licensePlate) {
    const query = `
      SELECT * FROM rental_info 
      WHERE license_plate = $1
    `;
    const result = await this.client.query(query, [licensePlate]);
    return result.rows[0] || null;
  }

  // Update rental availability
  async updateRentalAvailability(licensePlate, isAvailable, renterData = null) {
    let query, values;
    
    if (isAvailable) {
      // Make car available
      query = `
        UPDATE rental_info 
        SET is_available = true, current_renter_name = NULL, 
            current_renter_phone = NULL, rental_start_date = NULL, 
            rental_end_date = NULL, updated_at = CURRENT_TIMESTAMP
        WHERE license_plate = $1
        RETURNING *
      `;
      values = [licensePlate];
    } else {
      // Rent out car
      query = `
        UPDATE rental_info 
        SET is_available = false, current_renter_name = $2, 
            current_renter_phone = $3, rental_start_date = $4, 
            rental_end_date = $5, updated_at = CURRENT_TIMESTAMP
        WHERE license_plate = $1
        RETURNING *
      `;
      values = [
        licensePlate,
        renterData.name,
        renterData.phone,
        renterData.startDate,
        renterData.endDate
      ];
    }
    
    const result = await this.client.query(query, values);
    return result.rows[0];
  }

  // Get cars due for service
  async getCarsDueForService(daysAhead = 30) {
    const query = `
      SELECT c.license_plate, c.owner_name, c.make, c.model,
             sr.next_service_date, sr.service_type
      FROM cars c
      JOIN (
        SELECT DISTINCT ON (license_plate) 
               license_plate, next_service_date, service_type
        FROM service_records 
        WHERE next_service_date IS NOT NULL
        ORDER BY license_plate, service_date DESC
      ) sr ON c.license_plate = sr.license_plate
      WHERE sr.next_service_date <= CURRENT_DATE + INTERVAL '${daysAhead} days'
      ORDER BY sr.next_service_date
    `;
    const result = await this.client.query(query);
    return result.rows;
  }

  // Get available cars for rental
  async getAvailableCars() {
    const query = `
      SELECT c.license_plate, c.make, c.model, c.year, c.color,
             r.daily_rate
      FROM cars c
      JOIN rental_info r ON c.license_plate = r.license_plate
      WHERE r.is_available = true
      ORDER BY r.daily_rate
    `;
    const result = await this.client.query(query);
    return result.rows;
  }

  // Get insurance expiring soon
  async getExpiringInsurance(daysAhead = 60) {
    const query = `
      SELECT c.license_plate, c.owner_name, c.owner_phone,
             i.insurance_company, i.end_date
      FROM cars c
      JOIN (
        SELECT DISTINCT ON (license_plate)
               license_plate, insurance_company, end_date
        FROM insurance
        ORDER BY license_plate, end_date DESC
      ) i ON c.license_plate = i.license_plate
      WHERE i.end_date <= CURRENT_DATE + INTERVAL '${daysAhead} days'
      ORDER BY i.end_date
    `;
    const result = await this.client.query(query);
    return result.rows;
  }

  // Get database statistics
  async getDatabaseStats() {
    const queries = [
      'SELECT COUNT(*) as car_count FROM cars',
      'SELECT COUNT(*) as service_count FROM service_records',
      'SELECT COUNT(*) as insurance_count FROM insurance',
      'SELECT COUNT(*) as available_cars FROM rental_info WHERE is_available = true',
      'SELECT COUNT(*) as rented_cars FROM rental_info WHERE is_available = false'
    ];

    const results = await Promise.all(
      queries.map(query => this.client.query(query))
    );

    return {
      totalCars: parseInt(results[0].rows[0].car_count),
      serviceRecords: parseInt(results[1].rows[0].service_count),
      insurancePolicies: parseInt(results[2].rows[0].insurance_count),
      availableCars: parseInt(results[3].rows[0].available_cars),
      rentedCars: parseInt(results[4].rows[0].rented_cars)
    };
  }

  // Search cars by various criteria
  async searchCars(criteria) {
    let query = 'SELECT * FROM car_summary WHERE 1=1';
    const values = [];
    let paramCount = 0;

    if (criteria.make) {
      paramCount++;
      query += ` AND LOWER(make) LIKE LOWER($${paramCount})`;
      values.push(`%${criteria.make}%`);
    }

    if (criteria.model) {
      paramCount++;
      query += ` AND LOWER(model) LIKE LOWER($${paramCount})`;
      values.push(`%${criteria.model}%`);
    }

    if (criteria.year) {
      paramCount++;
      query += ` AND year = $${paramCount}`;
      values.push(criteria.year);
    }

    if (criteria.ownerName) {
      paramCount++;
      query += ` AND LOWER(owner_name) LIKE LOWER($${paramCount})`;
      values.push(`%${criteria.ownerName}%`);
    }

    if (criteria.available !== undefined) {
      paramCount++;
      query += ` AND is_available = $${paramCount}`;
      values.push(criteria.available);
    }

    query += ' ORDER BY license_plate';

    const result = await this.client.query(query, values);
    return result.rows;
  }
}

module.exports = CarInfoQueries;