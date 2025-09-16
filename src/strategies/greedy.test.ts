import { test, describe } from 'node:test';
import assert from 'node:assert';
import { GreedyStrategy } from './greedy.js';
import type { Driver, Ride } from '../domain.js';

describe('GreedyStrategy', () => {
  const createDriver = (id: string, fuelCost: number, license: 'B' | 'D1' | 'D' = 'B', vehicleSeats: number = 8): Driver => ({
    id,
    name: `Driver ${id}`,
    license,
    vehicleSeats,
    fuelCost,
    location: { lat: 32.0853, lng: 34.7818 }, // Tel Aviv
  });

  const createRide = (id: string, passengers: number, startTime: string = '09:00', endTime: string = '10:00'): Ride => ({
    id,
    date: '2024-01-01',
    startTime,
    endTime,
    pickup: { lat: 32.0853, lng: 34.7818 }, // Tel Aviv
    dropoff: { lat: 32.1093, lng: 34.8555 }, // Petah Tikva
    passengers,
  });

  test('should assign rides to drivers with lowest fuel cost', async () => {
    const strategy = new GreedyStrategy();
    
    const drivers = [
      createDriver('driver1', 2.5), // Higher fuel cost
      createDriver('driver2', 2.0), // Lower fuel cost
    ];
    
    const rides = [createRide('ride1', 4)];
    
    const assignments = await strategy.assign(rides, drivers);
    
    assert.strictEqual(assignments.length, 1);
    assert.strictEqual(assignments[0]!.driver.id, 'driver2');
    assert.strictEqual(assignments[0]!.ride.id, 'ride1');
  });

  test('should respect license limitations', async () => {
    const strategy = new GreedyStrategy();
    
    const drivers = [
      createDriver('driver1', 2.0, 'B', 8), // B license: max 8 passengers
      createDriver('driver2', 2.5, 'D1', 16), // D1 license: max 16 passengers
    ];
    
    const rides = [createRide('ride1', 10)]; // 10 passengers
    
    const assignments = await strategy.assign(rides, drivers);
    
    assert.strictEqual(assignments.length, 1);
    assert.strictEqual(assignments[0]!.driver.id, 'driver2'); // Only D1 driver can handle 10 passengers
  });

  test('should respect vehicle seat capacity', async () => {
    const strategy = new GreedyStrategy();
    
    const drivers = [
      createDriver('driver1', 2.0, 'B', 6), // Only 6 seats
      createDriver('driver2', 2.5, 'B', 8), // 8 seats
    ];
    
    const rides = [createRide('ride1', 7)]; // 7 passengers
    
    const assignments = await strategy.assign(rides, drivers);
    
    assert.strictEqual(assignments.length, 1);
    assert.strictEqual(assignments[0]!.driver.id, 'driver2'); // Only driver2 has enough seats
  });

  test('should sort rides by start time', async () => {
    const strategy = new GreedyStrategy();
    
    const drivers = [
      createDriver('driver1', 2.0),
      createDriver('driver2', 2.0),
    ];
    
    const rides = [
      createRide('ride2', 4, '10:00', '11:00'),
      createRide('ride1', 4, '09:00', '10:00'),
    ];
    
    const assignments = await strategy.assign(rides, drivers);
    
    assert.strictEqual(assignments.length, 2);
    assert.strictEqual(assignments[0]!.ride.id, 'ride1'); // Earlier ride first
    assert.strictEqual(assignments[1]!.ride.id, 'ride2');
  });

  test('should use stable ID sorting for tie-breaking', async () => {
    const strategy = new GreedyStrategy();
    
    const drivers = [
      createDriver('driver2', 2.0), // Same fuel cost, higher ID
      createDriver('driver1', 2.0), // Same fuel cost, lower ID
    ];
    
    const rides = [createRide('ride1', 4)];
    
    const assignments = await strategy.assign(rides, drivers);
    
    assert.strictEqual(assignments.length, 1);
    assert.strictEqual(assignments[0]!.driver.id, 'driver1'); // Lower ID wins
  });

  test('should skip rides with no feasible drivers', async () => {
    const strategy = new GreedyStrategy();
    
    const drivers = [createDriver('driver1', 2.0, 'B', 8)]; // B license: max 8 passengers
    
    const rides = [
      createRide('ride1', 4), // Feasible
      createRide('ride2', 10), // Not feasible (too many passengers)
    ];
    
    const assignments = await strategy.assign(rides, drivers);
    
    assert.strictEqual(assignments.length, 1);
    assert.strictEqual(assignments[0]!.ride.id, 'ride1');
  });

  test('should calculate costs correctly', async () => {
    const strategy = new GreedyStrategy();
    
    const drivers = [createDriver('driver1', 2.0)]; // 2₪/km
    const rides = [createRide('ride1', 4, '09:00', '10:00')]; // 1 hour = 60 minutes
    
    const assignments = await strategy.assign(rides, drivers);
    
    assert.strictEqual(assignments.length, 1);
    const assignment = assignments[0]!;
    
    // Time cost: 60 minutes * 50 agorot/minute = 3000 agorot
    // Fuel cost: distance * 2₪/km * 100 agorot/₪ = distance * 200 agorot/km
    assert.strictEqual(assignment.loadedTimeMinutes, 60);
    assert(assignment.totalCostAg > 0);
  });

  test('should include deadhead costs when requested', async () => {
    const strategy = new GreedyStrategy();
    
    const drivers = [{
      ...createDriver('driver1', 2.0),
      location: { lat: 31.7683, lng: 35.2137 }, // Jerusalem (different from pickup)
    }];
    const rides = [createRide('ride1', 4)];
    
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
  });
});
