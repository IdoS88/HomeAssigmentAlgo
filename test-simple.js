#!/usr/bin/env node

// Simple test to check if basic functionality works
import { greedyStrategy } from './dist/strategies/greedy.js';
import { mincostStrategy } from './dist/strategies/mincost.js';
import { autoStrategy } from './dist/strategies/auto.js';

console.log('🧪 Simple Test - Checking if strategies work...\n');

const testData = {
  drivers: [
    {
      driverId: "driver1",
      firstName: "John",
      lastName: "Doe",
      city: "Tel Aviv",
      mainPhone: "0501111111",
      status: "active",
      licenceDegree: ["B"],
      numberOfSeats: 8,
      fuelCost: 2.0,
      city_coords: [32.0853, 34.7818]
    }
  ],
  rides: [
    {
      _id: "ride1",
      date: "2025-03-10",
      startTime: "08:00",
      endTime: "08:30",
      startPoint: "Tel Aviv",
      endPoint: "Jerusalem",
      numberOfSeats: 4,
      startPoint_coords: [32.0853, 34.7818],
      endPoint_coords: [31.7683, 35.2137]
    }
  ]
};

try {
  console.log('Testing Greedy Strategy...');
  const greedyResult = await greedyStrategy.solve(testData);
  
  // Transform to expected output format
  const greedyOutput = {
    assignments: greedyResult.assignments.reduce((acc, assignment) => {
      const existingDriver = acc.find(a => a.driverId === assignment.driver.id);
      if (existingDriver) {
        existingDriver.rideIds.push(assignment.ride.id);
      } else {
        acc.push({
          driverId: assignment.driver.id,
          rideIds: [assignment.ride.id]
        });
      }
      return acc;
    }, []),
    totalCost: greedyResult.objective
  };
  
  console.log('✅ Greedy Result:');
  console.log(JSON.stringify(greedyOutput, null, 2));

  console.log('\nTesting MinCost Strategy...');
  const mincostResult = await mincostStrategy.solve(testData);
  
  const mincostOutput = {
    assignments: mincostResult.assignments.reduce((acc, assignment) => {
      const existingDriver = acc.find(a => a.driverId === assignment.driver.id);
      if (existingDriver) {
        existingDriver.rideIds.push(assignment.ride.id);
      } else {
        acc.push({
          driverId: assignment.driver.id,
          rideIds: [assignment.ride.id]
        });
      }
      return acc;
    }, []),
    totalCost: mincostResult.objective
  };
  
  console.log('✅ MinCost Result:');
  console.log(JSON.stringify(mincostOutput, null, 2));

  console.log('\nTesting Auto Strategy...');
  const autoResult = await autoStrategy.solve(testData);
  
  const autoOutput = {
    assignments: autoResult.assignments.reduce((acc, assignment) => {
      const existingDriver = acc.find(a => a.driverId === assignment.driver.id);
      if (existingDriver) {
        existingDriver.rideIds.push(assignment.ride.id);
      } else {
        acc.push({
          driverId: assignment.driver.id,
          rideIds: [assignment.ride.id]
        });
      }
      return acc;
    }, []),
    totalCost: autoResult.objective
  };
  
  console.log('✅ Auto Result:');
  console.log(JSON.stringify(autoOutput, null, 2));
  console.log(`   Selected: ${autoResult.meta.name}`);

  console.log('\n🎉 All strategies working correctly!');
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
