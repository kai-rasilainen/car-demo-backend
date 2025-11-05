// Test client for B2 IoT Gateway
const WebSocket = require('ws');

const WS_URL = 'ws://localhost:8080';

class CarSimulator {
  constructor(licensePlate) {
    this.licensePlate = licensePlate;
    this.ws = null;
    this.connected = false;
  }

  connect() {
    this.ws = new WebSocket(WS_URL);

    this.ws.on('open', () => {
      console.log(`Car ${this.licensePlate} connected to IoT Gateway`);
      this.connected = true;
      this.startSendingData();
    });

    this.ws.on('message', (data) => {
      const message = JSON.parse(data.toString());
      console.log(`Car ${this.licensePlate} received:`, message);
      
      if (message.type === 'command') {
        this.handleCommand(message.command);
      }
    });

    this.ws.on('close', () => {
      console.log(`Car ${this.licensePlate} disconnected`);
      this.connected = false;
    });

    this.ws.on('error', (error) => {
      console.error(`Car ${this.licensePlate} error:`, error);
    });
  }

  startSendingData() {
    // Send data every 5 seconds for demo
    setInterval(() => {
      if (this.connected) {
        const data = {
          licensePlate: this.licensePlate,
          indoorTemp: 20 + Math.random() * 10,
          outdoorTemp: 10 + Math.random() * 15,
          gps: {
            lat: 60.1699 + (Math.random() - 0.5) * 0.01,
            lng: 24.9384 + (Math.random() - 0.5) * 0.01
          },
          timestamp: new Date().toISOString()
        };

        this.ws.send(JSON.stringify(data));
        console.log(`Car ${this.licensePlate} sent data`);
      }
    }, 5000);
  }

  handleCommand(command) {
    console.log(`Car ${this.licensePlate} executing command: ${command}`);
    
    // Simulate command execution
    switch (command) {
      case 'start_heating':
        console.log(`Car ${this.licensePlate}: Starting heating system`);
        break;
      case 'service_mode':
        console.log(`Car ${this.licensePlate}: Entering service mode`);
        break;
      default:
        console.log(`Car ${this.licensePlate}: Unknown command: ${command}`);
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
    }
  }
}

// Create test cars
const cars = [
  new CarSimulator('ABC-123'),
  new CarSimulator('XYZ-789'),
  new CarSimulator('DEF-456')
];

// Connect all cars
cars.forEach(car => car.connect());

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Disconnecting test cars...');
  cars.forEach(car => car.disconnect());
  process.exit(0);
});

console.log('Car simulators started. Press Ctrl+C to stop.');