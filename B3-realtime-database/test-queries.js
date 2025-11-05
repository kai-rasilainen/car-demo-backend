const CarDataQueries = require('./queries');

async function testQueries() {
  const queries = new CarDataQueries();
  
  try {
    await queries.connect();
    
    console.log('=== Testing Car Data Queries ===\n');
    
    // Test 1: Get latest data for a car
    console.log('1. Getting latest data for ABC-123:');
    const latest = await queries.getLatestCarData('ABC-123');
    console.log(latest);
    console.log();
    
    // Test 2: Insert new data
    console.log('2. Inserting new test data:');
    const newData = {
      licensePlate: 'TEST-001',
      indoorTemp: 23.5,
      outdoorTemp: 16.8,
      gps: {
        lat: 60.1700,
        lng: 24.9400
      },
      speed: 0,
      engineStatus: 'off'
    };
    const insertResult = await queries.insertCarData(newData);
    console.log('Inserted with ID:', insertResult.insertedId);
    console.log();
    
    // Test 3: Get history
    console.log('3. Getting history for ABC-123 (last 5 records):');
    const history = await queries.getCarDataHistory('ABC-123', 5);
    console.log(`Found ${history.length} records`);
    history.forEach((record, index) => {
      console.log(`  ${index + 1}. ${record.timestamp}: Indoor=${record.indoorTemp}°C, Outdoor=${record.outdoorTemp}°C`);
    });
    console.log();
    
    // Test 4: Temperature statistics
    console.log('4. Getting temperature statistics for ABC-123:');
    const stats = await queries.getTemperatureStats('ABC-123');
    if (stats) {
      console.log(`  Indoor temp: avg=${stats.avgIndoorTemp?.toFixed(1)}°C, min=${stats.minIndoorTemp}°C, max=${stats.maxIndoorTemp}°C`);
      console.log(`  Outdoor temp: avg=${stats.avgOutdoorTemp?.toFixed(1)}°C, min=${stats.minOutdoorTemp}°C, max=${stats.maxOutdoorTemp}°C`);
      console.log(`  Data points: ${stats.dataPoints}`);
    }
    console.log();
    
    // Test 5: All cars latest data
    console.log('5. Getting latest data for all cars:');
    const allCars = await queries.getAllCarsLatestData();
    console.log(`Found ${allCars.length} cars:`);
    allCars.forEach(car => {
      console.log(`  ${car.licensePlate}: Indoor=${car.indoorTemp}°C, Outdoor=${car.outdoorTemp}°C`);
    });
    console.log();
    
    // Test 6: Insert and query commands
    console.log('6. Testing command operations:');
    const commandData = {
      licensePlate: 'ABC-123',
      command: 'start_heating',
      source: 'test'
    };
    const commandResult = await queries.insertCommand(commandData);
    console.log('Command inserted with ID:', commandResult.insertedId);
    
    const commands = await queries.getCommandHistory('ABC-123', 3);
    console.log(`Command history (last 3):`);
    commands.forEach((cmd, index) => {
      console.log(`  ${index + 1}. ${cmd.command} - ${cmd.status} (${cmd.timestamp})`);
    });
    console.log();
    
    // Test 7: Database statistics
    console.log('7. Database statistics:');
    const dbStats = await queries.getDatabaseStats();
    console.log(`  Car data records: ${dbStats.carDataRecords}`);
    console.log(`  Command records: ${dbStats.commandRecords}`);
    console.log(`  Unique cars: ${dbStats.uniqueCars}`);
    console.log(`  Car list: ${dbStats.carList.join(', ')}`);
    console.log(`  Database size: ${(dbStats.databaseSize / 1024).toFixed(2)} KB`);
    console.log();
    
    console.log('=== All tests completed successfully! ===');
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await queries.disconnect();
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testQueries();
}

module.exports = testQueries;