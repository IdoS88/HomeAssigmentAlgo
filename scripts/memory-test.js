#!/usr/bin/env node

import { GreedyStrategy } from './src/strategies/greedy.js';
import { MinCostFlowStrategy } from './src/strategies/minCostFlow.js';
import { TestDataFactory } from './src/test-helpers.js';

console.log('🔍 Comprehensive Memory Leak Test\n');

// Create a more substantial dataset
const drivers = TestDataFactory.createLargeDataset(10, 20).drivers;
const rides = TestDataFactory.createLargeDataset(10, 20).rides;

// Add shifts to drivers
drivers.forEach(driver => {
  driver.shifts = [{
    startMinutes: 360, // 06:00
    endMinutes: 840    // 14:00
  }];
});

console.log(`Testing with ${drivers.length} drivers and ${rides.length} rides`);

// Test both strategies
const strategies = [
  { name: 'GreedyStrategy', instance: new GreedyStrategy() },
  { name: 'MinCostFlowStrategy', instance: new MinCostFlowStrategy() }
];

for (const { name, instance } of strategies) {
  console.log(`\n📊 Testing ${name}:`);
  
  const iterations = 10;
  const results = [];
  
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    const assignments = await instance.assign(rides, drivers);
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
    
    console.log(`  Iteration ${i + 1}: ${assignments.length} assignments in ${duration.toFixed(2)}ms`);
  }
  
  // Analyze results
  const durations = results.map(r => r.duration);
  const firstDuration = durations[0];
  const lastDuration = durations[durations.length - 1];
  const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
  const degradation = (lastDuration - firstDuration) / firstDuration;
  
  console.log(`\n  📈 Analysis:`);
  console.log(`    First iteration: ${firstDuration.toFixed(2)}ms`);
  console.log(`    Last iteration:  ${lastDuration.toFixed(2)}ms`);
  console.log(`    Average:         ${avgDuration.toFixed(2)}ms`);
  console.log(`    Degradation:     ${(degradation * 100).toFixed(1)}%`);
  
  // Check for memory leak indicators
  const isLeaking = degradation > 0.5; // 50% threshold
  const isImproving = degradation < -0.2; // 20% improvement
  
  if (isLeaking) {
    console.log(`    ⚠️  POTENTIAL MEMORY LEAK: Performance degraded by ${(degradation * 100).toFixed(1)}%`);
  } else if (isImproving) {
    console.log(`    ✅ PERFORMANCE IMPROVING: ${(degradation * 100).toFixed(1)}% (JIT optimization)`);
  } else {
    console.log(`    ✅ STABLE PERFORMANCE: ${(degradation * 100).toFixed(1)}% change`);
  }
}

console.log('\n🏁 Memory leak test completed!');