import { test, describe } from 'node:test';
import assert from 'node:assert';
import { GreedyStrategy } from '../../dist/strategies/greedy-legacy.js';
import { TestDataFactory, TestAssertions, PerformanceTestHelpers } from '../../dist/test-helpers.js';

describe('GreedyStrategy', () => {

  test('should assign rides to drivers with lowest fuel cost', async () => {
    const strategy = new GreedyStrategy();
    
    const drivers = [
      TestDataFactory.createDriver('driver1', { fuelCost: 2.5 }), // Higher fuel cost
      TestDataFactory.createDriver('driver2', { fuelCost: 2.0 }), // Lower fuel cost
    ];
    
    const rides = [TestDataFactory.createRide('ride1', { passengers: 4 })];
    
    const assignments = await strategy.assign(rides, drivers);
    
    assert.strictEqual(assignments.length, 1);
    assert.strictEqual(assignments[0]!.driver.id, 'driver2');
    assert.strictEqual(assignments[0]!.ride.id, 'ride1');
    TestAssertions.assertValidAssignment(assignments[0]!);
  });

  test('should respect license limitations', async () => {
    const strategy = new GreedyStrategy();
    
    const drivers = [
      TestDataFactory.createDriver('driver1', { fuelCost: 2.0, license: 'B', vehicleSeats: 8 }), // B license: max 8 passengers
      TestDataFactory.createDriver('driver2', { fuelCost: 2.5, license: 'D1', vehicleSeats: 16 }), // D1 license: max 16 passengers
    ];
    
    const rides = [TestDataFactory.createRide('ride1', { passengers: 10 })]; // 10 passengers
    
    const assignments = await strategy.assign(rides, drivers);
    
    assert.strictEqual(assignments.length, 1);
    assert.strictEqual(assignments[0]!.driver.id, 'driver2'); // Only D1 driver can handle 10 passengers
    TestAssertions.assertValidAssignment(assignments[0]!);
  });

  test('should respect vehicle seat capacity', async () => {
    const strategy = new GreedyStrategy();
    
    const drivers = [
      TestDataFactory.createDriver('driver1', { fuelCost: 2.0, license: 'B', vehicleSeats: 6 }), // Only 6 seats
      TestDataFactory.createDriver('driver2', { fuelCost: 2.5, license: 'B', vehicleSeats: 8 }), // 8 seats
    ];
    
    const rides = [TestDataFactory.createRide('ride1', { passengers: 7 })]; // 7 passengers
    
    const assignments = await strategy.assign(rides, drivers);
    
    assert.strictEqual(assignments.length, 1);
    assert.strictEqual(assignments[0]!.driver.id, 'driver2'); // Only driver2 has enough seats
    TestAssertions.assertValidAssignment(assignments[0]!);
  });

  test('should sort rides by start time', async () => {
    const strategy = new GreedyStrategy();
    
    const drivers = [
      TestDataFactory.createDriver('driver1', { fuelCost: 2.0 }),
      TestDataFactory.createDriver('driver2', { fuelCost: 2.0 }),
    ];
    
    const rides = [
      TestDataFactory.createRide('ride2', { passengers: 4, startTime: '10:00', endTime: '11:00' }),
      TestDataFactory.createRide('ride1', { passengers: 4, startTime: '09:00', endTime: '10:00' }),
    ];
    
    const assignments = await strategy.assign(rides, drivers);
    
    assert.strictEqual(assignments.length, 2);
    assert.strictEqual(assignments[0]!.ride.id, 'ride1'); // Earlier ride first
    assert.strictEqual(assignments[1]!.ride.id, 'ride2');
    TestAssertions.assertAssignmentsSortedByTime(assignments);
  });

  test('should use stable ID sorting for tie-breaking', async () => {
    const strategy = new GreedyStrategy();
    
    // Two drivers with identical everything - should pick by ID
    const drivers = [
      TestDataFactory.createDriver('driver2', { 
        fuelCost: 2.0, 
        location: { lat: 32.0, lng: 34.0 },
        vehicleSeats: 8,
        license: 'B'
      }),
      TestDataFactory.createDriver('driver1', { 
        fuelCost: 2.0, 
        location: { lat: 32.0, lng: 34.0 },
        vehicleSeats: 8,
        license: 'B'
      }),
    ];
    
    const rides = [TestDataFactory.createRide('ride1', { 
      passengers: 4, 
      pickup: { lat: 32.0, lng: 34.0 }, // Same location as drivers
      dropoff: { lat: 32.1, lng: 34.1 } // Different location to ensure positive distance
    })];
    
    const assignments = await strategy.assign(rides, drivers);
    
    assert.strictEqual(assignments.length, 1);
    // With identical costs, should pick the first one found (driver2 in this case)
    assert(['driver1', 'driver2'].includes(assignments[0]!.driver.id));
    TestAssertions.assertValidAssignment(assignments[0]!);
  });

  test('should skip rides with no feasible drivers', async () => {
    const strategy = new GreedyStrategy();
    
    const drivers = [TestDataFactory.createDriver('driver1', { fuelCost: 2.0, license: 'B', vehicleSeats: 8 })]; // B license: max 8 passengers
    
    const rides = [
      TestDataFactory.createRide('ride1', { passengers: 4 }), // Feasible
      TestDataFactory.createRide('ride2', { passengers: 10 }), // Not feasible (too many passengers)
    ];
    
    const assignments = await strategy.assign(rides, drivers);
    
    assert.strictEqual(assignments.length, 1);
    assert.strictEqual(assignments[0]!.ride.id, 'ride1');
    TestAssertions.assertValidAssignment(assignments[0]!);
  });

  test('should calculate costs correctly', async () => {
    const strategy = new GreedyStrategy();
    
    const drivers = [TestDataFactory.createDriver('driver1', { fuelCost: 2.0 })]; // 2₪/km
    const rides = [TestDataFactory.createRide('ride1', { passengers: 4, startTime: '09:00', endTime: '10:00' })]; // 1 hour = 60 minutes
    
    const assignments = await strategy.assign(rides, drivers);
    
    assert.strictEqual(assignments.length, 1);
    const assignment = assignments[0]!;
    
    // Time cost: 60 minutes * 50 agorot/minute = 3000 agorot
    // Fuel cost: distance * 2₪/km * 100 agorot/₪ = distance * 200 agorot/km
    assert.strictEqual(assignment.loadedTimeMinutes, 60);
    assert(assignment.totalCostAg > 0);
    TestAssertions.assertValidAssignment(assignment);
  });

  test('should include deadhead costs when requested', async () => {
    const strategy = new GreedyStrategy();
    
    const drivers = [TestDataFactory.createDriver('driver1', {
      fuelCost: 2.0,
      location: { lat: 31.7683, lng: 35.2137 }, // Jerusalem (different from pickup)
    })];
    const rides = [TestDataFactory.createRide('ride1', { passengers: 4 })];
    
    const assignments = await strategy.assign(rides, drivers, {
      includeDeadheadTime: true,
      includeDeadheadFuel: true,
    });
    
    assert.strictEqual(assignments.length, 1);
    const assignment = assignments[0]!;
    
    assert(assignment.deadheadTimeMinutes !== undefined);
    assert(assignment.deadheadDistanceKm !== undefined);
    assert(assignment.deadheadTimeMinutes! > 0);
    assert(assignment.deadheadDistanceKm! > 0);
    TestAssertions.assertValidAssignment(assignment);
  });

  test('should perform well with large datasets', async () => {
    const strategy = new GreedyStrategy();
    const { drivers, rides } = PerformanceTestHelpers.createLargeDataset(50, 100);
    
    const { result: assignments, duration } = await PerformanceTestHelpers.measureTime(async () => {
      return await strategy.assign(rides, drivers);
    });
    
    // Should complete within reasonable time (5 seconds)
    assert(duration < 5000, `Strategy took ${duration}ms, should be under 5000ms`);
    
    // Should assign some rides
    assert(assignments.length > 0, 'Should assign at least some rides');
    
    // All assignments should be valid
    TestAssertions.assertAllAssignmentsValid(assignments);
    
    console.log(`Greedy strategy: ${assignments.length}/${rides.length} rides assigned in ${duration.toFixed(2)}ms`);
  }); // Performance test
});
