#!/usr/bin/env node

import { GreedyStrategy } from './src/strategies/greedy.js';

console.log('🔍 Simple Memory Leak Test\n');

// Create minimal test data
const drivers = [
  {
    id: 'driver1',
    name: 'Driver 1',
    license: 'B',
    vehicleSeats: 8,
    fuelCost: 2.0,
    location: { lat: 32.0, lng: 34.0 },
    shifts: [{ startMinutes: 360, endMinutes: 840 }] // 06:00-14:00
  }
];

const rides = [
  {
    id: 'ride1',
    date: '2025-03-10',
    startTime: '08:00',
    endTime: '09:00',
    pickup: { lat: 32.0, lng: 34.0 },
    dropoff: { lat: 32.1, lng: 34.1 },
    passengers: 4
  }
];

console.log('Testing with 1 driver and 1 ride');

const strategy = new GreedyStrategy();
const iterations = 20;
const results = [];

console.log('Running iterations...');

for (let i = 0; i < iterations; i++) {
  const start = performance.now();
  const assignments = await strategy.assign(rides, drivers);
  const duration = performance.now() - start;
  
  results.push({
    iteration: i + 1,
    assignments: assignments.length,
    duration: duration
  });
  
  // Force garbage collection if available
  if (global.gc) {
    global.gc();
  }
  
  if (i % 5 === 0) {
    console.log(`  Iteration ${i + 1}: ${assignments.length} assignments in ${duration.toFixed(3)}ms`);
  }
}

// Analyze results
const durations = results.map(r => r.duration);
const firstDuration = durations[0];
const lastDuration = durations[durations.length - 1];
const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
const degradation = (lastDuration - firstDuration) / firstDuration;

console.log(`\n📊 Analysis:`);
console.log(`  First iteration: ${firstDuration.toFixed(3)}ms`);
console.log(`  Last iteration:  ${lastDuration.toFixed(3)}ms`);
console.log(`  Average:         ${avgDuration.toFixed(3)}ms`);
console.log(`  Degradation:     ${(degradation * 100).toFixed(1)}%`);

// Check for patterns
const firstHalf = durations.slice(0, Math.floor(durations.length / 2));
const secondHalf = durations.slice(Math.floor(durations.length / 2));
const firstHalfAvg = firstHalf.reduce((sum, d) => sum + d, 0) / firstHalf.length;
const secondHalfAvg = secondHalf.reduce((sum, d) => sum + d, 0) / secondHalf.length;
const halfDegradation = (secondHalfAvg - firstHalfAvg) / firstHalfAvg;

console.log(`  First half avg:  ${firstHalfAvg.toFixed(3)}ms`);
console.log(`  Second half avg: ${secondHalfAvg.toFixed(3)}ms`);
console.log(`  Half degradation: ${(halfDegradation * 100).toFixed(1)}%`);

// Check for memory leak indicators
if (degradation > 0.5) {
  console.log(`\n⚠️  POTENTIAL MEMORY LEAK: Performance degraded by ${(degradation * 100).toFixed(1)}%`);
} else if (degradation < -0.2) {
  console.log(`\n✅ PERFORMANCE IMPROVING: ${(degradation * 100).toFixed(1)}% (JIT optimization)`);
} else {
  console.log(`\n✅ STABLE PERFORMANCE: ${(degradation * 100).toFixed(1)}% change`);
}

console.log('\n🏁 Simple memory test completed!');