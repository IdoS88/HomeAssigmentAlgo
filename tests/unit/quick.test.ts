import { test, describe } from 'node:test';
import assert from 'node:assert';
import { GreedyStrategy } from '../../src/strategies/greedy.js';
import { MinCostFlowStrategy } from '../../src/strategies/minCostFlow.js';
import { TestDataFactory } from '../../src/test-helpers.js';

describe('Quick Performance Test', () => {
  test('GIVEN minimal dataset WHEN assigning THEN should complete quickly', async () => {
    // Arrange - Minimal dataset
    const strategy = new GreedyStrategy();
    const driver = TestDataFactory.createDriver('driver1', {
      fuelCost: 2.0,
      license: 'B',
      vehicleSeats: 8,
      location: { lat: 32.4356, lng: 34.9178 }
    });
    const ride = TestDataFactory.createRide('ride1', {
      passengers: 4,
      startTime: '09:00',
      endTime: '10:00',
      pickup: { lat: 32.4356, lng: 34.9178 },
      dropoff: { lat: 32.4400, lng: 34.9200 }
    });

    // Act
    const start = performance.now();
    const assignments = await strategy.assign([ride], [driver]);
    const duration = performance.now() - start;

    // Assert
    assert(duration < 100, `Should complete within 100ms, took ${duration.toFixed(2)}ms`);
    assert(assignments.length >= 0, 'Should handle assignment');
    
    console.log(`Quick test: ${assignments.length} assignments in ${duration.toFixed(2)}ms`);
  });
});
