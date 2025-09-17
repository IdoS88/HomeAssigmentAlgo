import { test, describe } from 'node:test';
import assert from 'node:assert';
import { GreedyStrategy } from './greedy.js';

describe('Debug Test', () => {
  test('GIVEN simple data WHEN assigning THEN should complete', async () => {
    console.log('Starting debug test...');
    
    const strategy = new GreedyStrategy();
    
    const driver = {
      id: 'driver1',
      name: 'Test Driver',
      license: 'B' as const,
      vehicleSeats: 8,
      fuelCost: 2.0,
      location: { lat: 32.4356, lng: 34.9178 }
    };
    
    const ride = {
      id: 'ride1',
      date: '2024-01-01',
      startTime: '09:00',
      endTime: '10:00',
      pickup: { lat: 32.4356, lng: 34.9178 },
      dropoff: { lat: 32.4400, lng: 34.9200 },
      passengers: 4
    };
    
    console.log('Calling strategy.assign...');
    const start = performance.now();
    
    try {
      const assignments = await strategy.assign([ride], [driver]);
      const duration = performance.now() - start;
      
      console.log(`Completed in ${duration.toFixed(2)}ms`);
      console.log(`Assignments: ${assignments.length}`);
      
      assert(duration < 1000, `Should complete within 1 second, took ${duration.toFixed(2)}ms`);
    } catch (error) {
      console.error('Error during assignment:', error);
      throw error;
    }
  });
});
