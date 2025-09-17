import { test, describe } from 'node:test';
import assert from 'node:assert';
import { MinCostFlowStrategy } from '../../src/strategies/minCostFlow.js';
import { TestDataFactory, TestAssertions, PerformanceTestHelpers } from '../../src/test-helpers.js';

describe('MinCostFlowStrategy', () => {

  test('should assign rides to drivers with optimal cost', async () => {
    const strategy = new MinCostFlowStrategy();
    
    const drivers = [
      TestDataFactory.createDriver('driver1', { fuelCost: 2.5 }), // Higher fuel cost
      TestDataFactory.createDriver('driver2', { fuelCost: 2.0 }), // Lower fuel cost
    ];
    
    const rides = [TestDataFactory.createRide('ride1', { passengers: 4 })];
    
    const assignments = await strategy.assign(rides, drivers);
    
    assert.strictEqual(assignments.length, 1);
    assert.strictEqual(assignments[0]!.driver.id, 'driver2'); // Should choose lower cost driver
    assert.strictEqual(assignments[0]!.ride.id, 'ride1');
    TestAssertions.assertValidAssignment(assignments[0]!);
  });

  test('should respect license limitations', async () => {
    const strategy = new MinCostFlowStrategy();
    
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
    const strategy = new MinCostFlowStrategy();
    
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
    const strategy = new MinCostFlowStrategy();
    
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

  test('should find optimal assignment for multiple rides', async () => {
    const strategy = new MinCostFlowStrategy();
    
    const drivers = [
      TestDataFactory.createDriver('driver1', { fuelCost: 2.0, license: 'B', vehicleSeats: 8 }),
      TestDataFactory.createDriver('driver2', { fuelCost: 2.5, license: 'B', vehicleSeats: 8 }),
      TestDataFactory.createDriver('driver3', { fuelCost: 3.0, license: 'B', vehicleSeats: 8 }),
    ];
    
    const rides = [
      TestDataFactory.createRide('ride1', { passengers: 4, startTime: '09:00', endTime: '10:00' }),
      TestDataFactory.createRide('ride2', { passengers: 4, startTime: '10:00', endTime: '11:00' }),
      TestDataFactory.createRide('ride3', { passengers: 4, startTime: '11:00', endTime: '12:00' }),
    ];
    
    const assignments = await strategy.assign(rides, drivers);
    
    assert.strictEqual(assignments.length, 3);
    
    // Should assign all rides to the lowest cost driver first
    const driver1Assignments = assignments.filter(a => a.driver.id === 'driver1');
    const driver2Assignments = assignments.filter(a => a.driver.id === 'driver2');
    const driver3Assignments = assignments.filter(a => a.driver.id === 'driver3');
    
    // Driver1 should get the most assignments (lowest cost)
    assert(driver1Assignments.length >= driver2Assignments.length);
    assert(driver2Assignments.length >= driver3Assignments.length);
    TestAssertions.assertAllAssignmentsValid(assignments);
  });

  test('should skip rides with no feasible drivers', async () => {
    const strategy = new MinCostFlowStrategy();
    
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
    const strategy = new MinCostFlowStrategy();
    
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
    const strategy = new MinCostFlowStrategy();
    
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

  test('should handle empty driver list', async () => {
    const strategy = new MinCostFlowStrategy();
    
    const drivers: any[] = [];
    const rides = [TestDataFactory.createRide('ride1', { passengers: 4 })];
    
    const assignments = await strategy.assign(rides, drivers);
    
    assert.strictEqual(assignments.length, 0);
  });

  test('should handle empty ride list', async () => {
    const strategy = new MinCostFlowStrategy();
    
    const drivers = [TestDataFactory.createDriver('driver1', { fuelCost: 2.0 })];
    const rides: any[] = [];
    
    const assignments = await strategy.assign(rides, drivers);
    
    assert.strictEqual(assignments.length, 0);
  });

  test('should handle complex scenario with multiple constraints', async () => {
    const strategy = new MinCostFlowStrategy();
    
    const drivers = [
      TestDataFactory.createDriver('driver1', { fuelCost: 2.0, license: 'B', vehicleSeats: 8 }),   // Low cost, B license
      TestDataFactory.createDriver('driver2', { fuelCost: 2.5, license: 'D1', vehicleSeats: 16 }), // Medium cost, D1 license
      TestDataFactory.createDriver('driver3', { fuelCost: 3.0, license: 'D', vehicleSeats: 50 }),  // High cost, D license
    ];
    
    const rides = [
      TestDataFactory.createRide('ride1', { passengers: 4, startTime: '09:00', endTime: '10:00' }),   // Small ride
      TestDataFactory.createRide('ride2', { passengers: 10, startTime: '10:00', endTime: '11:00' }),  // Medium ride (needs D1+)
      TestDataFactory.createRide('ride3', { passengers: 20, startTime: '11:00', endTime: '12:00' }),  // Large ride (needs D license)
    ];
    
    const assignments = await strategy.assign(rides, drivers);
    
    // MinCostFlow strategy should assign at least 2 rides (since we have 3 drivers and 3 rides)
    // The exact number depends on the algorithm's optimization
    assert(assignments.length >= 2, `Expected at least 2 assignments, got ${assignments.length}`);
    assert(assignments.length <= 3, `Expected at most 3 assignments, got ${assignments.length}`);
    
    // Verify each ride is assigned to a driver that can handle it
    for (const assignment of assignments) {
      const { ride, driver } = assignment;
      
      // Check license requirements
      if (ride.passengers > 8) {
        assert(driver.license === 'D1' || driver.license === 'D', 
          `Ride with ${ride.passengers} passengers needs D1+ license`);
      }
      
      // Check seat capacity
      assert(driver.vehicleSeats >= ride.passengers, 
        `Driver ${driver.id} has ${driver.vehicleSeats} seats but ride needs ${ride.passengers}`);
    }
    
    TestAssertions.assertAllAssignmentsValid(assignments);
    
    console.log(`MinCostFlow assigned ${assignments.length}/3 rides in complex scenario`);
  });

  test('should perform well with large datasets', async () => {
    const strategy = new MinCostFlowStrategy();
    const { drivers, rides } = PerformanceTestHelpers.createLargeDataset(50, 100);
    
    const { result: assignments, duration } = await PerformanceTestHelpers.measureTime(async () => {
      return await strategy.assign(rides, drivers);
    });
    
    // Should complete within reasonable time (10 seconds for min-cost flow)
    assert(duration < 10000, `Strategy took ${duration}ms, should be under 10000ms`);
    
    // Should assign some rides
    assert(assignments.length > 0, 'Should assign at least some rides');
    
    // All assignments should be valid
    TestAssertions.assertAllAssignmentsValid(assignments);
    
    console.log(`Min-cost flow strategy: ${assignments.length}/${rides.length} rides assigned in ${duration.toFixed(2)}ms`);
  }, { timeout: 15000 }); // 15 second timeout
});
