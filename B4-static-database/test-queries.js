const CarInfoQueries = require('./queries');

async function testQueries() {
  const queries = new CarInfoQueries();
  
  try {
    await queries.connect();
    
    console.log('=== Testing Car Info Database Queries ===\n');
    
    // Test 1: Get car basic info
    console.log('1. Getting basic info for ABC-123:');
    const carInfo = await queries.getCarInfo('ABC-123');
    if (carInfo) {
      console.log(`  Owner: ${carInfo.owner_name}`);
      console.log(`  Car: ${carInfo.year} ${carInfo.make} ${carInfo.model}`);
      console.log(`  Color: ${carInfo.color}`);
      console.log(`  Phone: ${carInfo.owner_phone}`);
    }
    console.log();
    
    // Test 2: Get complete car summary
    console.log('2. Getting complete summary for ABC-123:');
    const summary = await queries.getCarSummary('ABC-123');
    if (summary) {
      console.log(`  Car: ${summary.year} ${summary.make} ${summary.model}`);
      console.log(`  Owner: ${summary.owner_name}`);
      console.log(`  Last Service: ${summary.last_service}`);
      console.log(`  Daily Rate: €${summary.daily_rate}`);
      console.log(`  Available: ${summary.is_available ? 'Yes' : 'No'}`);
      if (!summary.is_available) {
        console.log(`  Current Renter: ${summary.current_renter_name}`);
      }
    }
    console.log();
    
    // Test 3: Get service history
    console.log('3. Getting service history for ABC-123:');
    const serviceHistory = await queries.getServiceHistory('ABC-123', 3);
    serviceHistory.forEach((service, index) => {
      console.log(`  ${index + 1}. ${service.service_date}: ${service.service_type} - €${service.cost}`);
      if (service.description) {
        console.log(`     ${service.description}`);
      }
    });
    console.log();
    
    // Test 4: Get all cars summary
    console.log('4. Getting summary for all cars:');
    const allCars = await queries.getAllCarsSummary();
    console.log(`Found ${allCars.length} cars:`);
    allCars.forEach(car => {
      const status = car.is_available ? 'Available' : 'Rented';
      console.log(`  ${car.license_plate}: ${car.year} ${car.make} ${car.model} (${status})`);
    });
    console.log();
    
    // Test 5: Get available cars for rental
    console.log('5. Available cars for rental:');
    const availableCars = await queries.getAvailableCars();
    availableCars.forEach(car => {
      console.log(`  ${car.license_plate}: ${car.year} ${car.make} ${car.model} - €${car.daily_rate}/day`);
    });
    console.log();
    
    // Test 6: Cars due for service
    console.log('6. Cars due for service in next 30 days:');
    const serviceDue = await queries.getCarsDueForService(30);
    if (serviceDue.length > 0) {
      serviceDue.forEach(car => {
        console.log(`  ${car.license_plate} (${car.make} ${car.model}): ${car.next_service_date}`);
      });
    } else {
      console.log('  No cars due for service');
    }
    console.log();
    
    // Test 7: Insurance expiring soon
    console.log('7. Insurance expiring in next 60 days:');
    const expiringInsurance = await queries.getExpiringInsurance(60);
    if (expiringInsurance.length > 0) {
      expiringInsurance.forEach(car => {
        console.log(`  ${car.license_plate}: ${car.insurance_company} expires ${car.end_date}`);
      });
    } else {
      console.log('  No insurance expiring soon');
    }
    console.log();
    
    // Test 8: Database statistics
    console.log('8. Database statistics:');
    const stats = await queries.getDatabaseStats();
    console.log(`  Total cars: ${stats.totalCars}`);
    console.log(`  Service records: ${stats.serviceRecords}`);
    console.log(`  Insurance policies: ${stats.insurancePolicies}`);
    console.log(`  Available for rental: ${stats.availableCars}`);
    console.log(`  Currently rented: ${stats.rentedCars}`);
    console.log();
    
    // Test 9: Search functionality
    console.log('9. Search for Toyota cars:');
    const searchResults = await queries.searchCars({ make: 'Toyota' });
    searchResults.forEach(car => {
      console.log(`  ${car.license_plate}: ${car.year} ${car.make} ${car.model}`);
    });
    console.log();
    
    // Test 10: Rental information
    console.log('10. Rental info for XYZ-789:');
    const rentalInfo = await queries.getRentalInfo('XYZ-789');
    if (rentalInfo) {
      console.log(`  Daily rate: €${rentalInfo.daily_rate}`);
      console.log(`  Available: ${rentalInfo.is_available ? 'Yes' : 'No'}`);
      if (!rentalInfo.is_available) {
        console.log(`  Renter: ${rentalInfo.current_renter_name}`);
        console.log(`  Period: ${rentalInfo.rental_start_date} to ${rentalInfo.rental_end_date}`);
      }
    }
    console.log();
    
    console.log('=== All tests completed successfully! ===');
    
  } catch (error) {
    console.error('Test failed:', error);
    if (error.code === 'ECONNREFUSED') {
      console.log('\nNote: Make sure PostgreSQL is running (docker-compose up -d)');
    }
  } finally {
    await queries.disconnect();
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testQueries();
}

module.exports = testQueries;