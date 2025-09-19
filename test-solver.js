import { readFileSync } from 'node:fs';
import { solve } from './dist/solver.js';

// Test with tiny Hadera dataset
const tinyInput = {
  drivers: [
    {
      driverId: 'driver1',
      firstName: 'John',
      lastName: 'Doe',
      city: 'Shlomo, Hadera',
      mainPhone: '0501111111',
      status: 'active',
      licenceDegree: ['D'],
      numberOfSeats: 17,
      fuelCost: 2.5,
      city_coords: [32.4323641, 34.9142005], // Shlomo, Hadera
      shifts: [{ start: '06:00', end: '18:00' }]
    }
  ],
  rides: [
    {
      _id: 'ride1',
      date: '2025-03-10',
      startTime: '06:45',
      endTime: '07:05',
      startPoint: 'Givat Bilu, Hadera',
      endPoint: 'Yoseftal, Hadera',
      numberOfSeats: 4,
      startPoint_coords: [32.4440992, 34.9240281], // Givat Bilu, Hadera
      endPoint_coords: [32.4367737, 34.9270303]   // Yoseftal, Hadera
    }
  ]
};

console.log('🧪 Testing Pure Solver Function');
console.log('================================');
console.log('Input:');
console.log(`  Drivers: ${tinyInput.drivers.length}`);
console.log(`  Rides: ${tinyInput.rides.length}`);
console.log('');

try {
  const result = solve(tinyInput);
  
  console.log('✅ Result:');
  console.log(`  Served: ${result.served}/${tinyInput.rides.length} rides`);
  console.log(`  Assignments: ${result.assignments.length} driver assignments`);
  console.log(`  Total Cost: ${result.objective} agorot (${(result.objective/100).toFixed(2)}₪)`);
  console.log('');
  
  if (result.assignments.length > 0) {
    console.log('📋 Assignment Details:');
    result.assignments.forEach((assignment, i) => {
      console.log(`  ${i + 1}. Driver ${assignment.driverId}: rides [${assignment.rideIds.join(', ')}]`);
    });
  }
  
  console.log('');
  console.log('🎉 Solver test completed successfully!');
  
} catch (error) {
  console.error('❌ Solver test failed:', error);
  process.exit(1);
}
