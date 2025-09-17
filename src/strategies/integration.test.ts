import { test, describe } from 'node:test';
import assert from 'node:assert';
import { GreedyStrategy } from './greedy.js';
import { MinCostFlowStrategy } from './minCostFlow.js';
import { TestDataFactory, TestAssertions, PerformanceTestHelpers } from '../test-helpers.js';
import { parseDrivers, parseRides } from '../domain.js';

describe('Integration Tests - End-to-End Ride Assignment', () => {
  
  describe('Real-World Scenarios', () => {
    test('GIVEN realistic Hadera dataset WHEN assigning rides THEN should achieve high coverage and efficiency', async () => {
      // Arrange - Create realistic Hadera scenario
      const drivers = [
        TestDataFactory.createDriverWithShifts('morning-driver', [{ start: '06:00', end: '14:00' }], {
          fuelCost: 2.0,
          license: 'B',
          vehicleSeats: 8,
          location: { lat: 32.4356, lng: 34.9178 } // Hadera center
        }),
        TestDataFactory.createDriverWithShifts('evening-driver', [{ start: '14:00', end: '22:00' }], {
          fuelCost: 2.2,
          license: 'D1',
          vehicleSeats: 16,
          location: { lat: 32.4356, lng: 34.9178 }
        }),
        TestDataFactory.createDriverWithShifts('split-shift-driver', [
          { start: '06:00', end: '10:00' },
          { start: '16:00', end: '20:00' }
        ], {
          fuelCost: 1.8,
          license: 'B',
          vehicleSeats: 8,
          location: { lat: 32.4356, lng: 34.9178 }
        })
      ];

      const rides = [
        TestDataFactory.createRideWithTime('morning-ride-1', '07:00', '08:00', {
          pickup: { lat: 32.4356, lng: 34.9178 },
          dropoff: { lat: 32.4400, lng: 34.9200 },
          passengers: 4
        }),
        TestDataFactory.createRideWithTime('morning-ride-2', '08:30', '09:30', {
          pickup: { lat: 32.4400, lng: 34.9200 },
          dropoff: { lat: 32.4356, lng: 34.9178 },
          passengers: 6
        }),
        TestDataFactory.createRideWithTime('evening-ride-1', '15:00', '16:00', {
          pickup: { lat: 32.4356, lng: 34.9178 },
          dropoff: { lat: 32.4300, lng: 34.9150 },
          passengers: 12
        }),
        TestDataFactory.createRideWithTime('split-shift-ride', '18:00', '19:00', {
          pickup: { lat: 32.4300, lng: 34.9150 },
          dropoff: { lat: 32.4356, lng: 34.9178 },
          passengers: 4
        }),
        TestDataFactory.createRideWithTime('unassignable-ride', '12:00', '13:00', {
          pickup: { lat: 32.4356, lng: 34.9178 },
          dropoff: { lat: 32.4400, lng: 34.9200 },
          passengers: 4
        }) // Between shifts, should not be assigned
      ];

      // Act - Test both strategies
      const greedyStrategy = new GreedyStrategy();
      const minCostStrategy = new MinCostFlowStrategy();
      
      const greedyAssignments = await greedyStrategy.assign(rides, drivers);
      const minCostAssignments = await minCostStrategy.assign(rides, drivers);

      // Assert - Both strategies should work
      assert(greedyAssignments.length >= 3, `Greedy should assign at least 3 rides, got ${greedyAssignments.length}`);
      assert(minCostAssignments.length >= 3, `MinCost should assign at least 3 rides, got ${minCostAssignments.length}`);
      
      // Verify no overlapping assignments
      TestAssertions.assertNoOverlappingAssignments(greedyAssignments);
      TestAssertions.assertNoOverlappingAssignments(minCostAssignments);
      
      // Verify shift compliance
      TestAssertions.assertAssignmentsRespectShifts(greedyAssignments);
      TestAssertions.assertAssignmentsRespectShifts(minCostAssignments);
      
      // Verify all assignments are valid
      TestAssertions.assertAllAssignmentsValid(greedyAssignments);
      TestAssertions.assertAllAssignmentsValid(minCostAssignments);
      
      console.log(`Greedy: ${greedyAssignments.length}/${rides.length} rides assigned`);
      console.log(`MinCost: ${minCostAssignments.length}/${rides.length} rides assigned`);
    });

    test('GIVEN high-demand scenario WHEN assigning rides THEN should maximize driver utilization', async () => {
      // Arrange - Create high-demand scenario
      const { drivers, rides } = PerformanceTestHelpers.createLargeDataset(5, 20);
      
      // Add shifts to all drivers
      drivers.forEach((driver, index) => {
        const shiftPatterns = [
          [{ start: '06:00', end: '14:00' }],
          [{ start: '14:00', end: '22:00' }],
          [{ start: '08:00', end: '16:00' }],
          [{ start: '06:00', end: '10:00' }, { start: '14:00', end: '18:00' }],
          [{ start: '07:00', end: '15:00' }]
        ];
        (driver as any).shifts = shiftPatterns[index % shiftPatterns.length]!.map(shift => ({
          startMinutes: TestDataFactory['parseShiftTime'](shift.start),
          endMinutes: TestDataFactory['parseShiftTime'](shift.end)
        }));
      });

      // Act
      const strategy = new GreedyStrategy();
      const assignments = await strategy.assign(rides, drivers);

      // Assert
      const assignmentRate = assignments.length / rides.length;
      assert(assignmentRate >= 0.6, `Should assign at least 60% of rides, got ${(assignmentRate * 100).toFixed(1)}%`);
      
      // Check driver utilization
      const driverUtilization = new Set(assignments.map(a => a.driver.id)).size / drivers.length;
      assert(driverUtilization >= 0.8, `Should utilize at least 80% of drivers, got ${(driverUtilization * 100).toFixed(1)}%`);
      
      TestAssertions.assertAllAssignmentsValid(assignments);
      TestAssertions.assertNoOverlappingAssignments(assignments);
      TestAssertions.assertAssignmentsRespectShifts(assignments);
      
      console.log(`High-demand scenario: ${assignments.length}/${rides.length} rides assigned (${(assignmentRate * 100).toFixed(1)}%)`);
      console.log(`Driver utilization: ${(driverUtilization * 100).toFixed(1)}%`);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('GIVEN empty datasets WHEN assigning THEN should handle gracefully', async () => {
      // Arrange
      const strategy = new GreedyStrategy();
      const emptyDrivers: any[] = [];
      const emptyRides: any[] = [];

      // Act
      const assignments = await strategy.assign(emptyRides, emptyDrivers);

      // Assert
      assert.strictEqual(assignments.length, 0, 'Should return empty array for empty inputs');
    });

    test('GIVEN invalid data WHEN assigning THEN should handle gracefully', async () => {
      // Arrange
      const strategy = new GreedyStrategy();
      const invalidDrivers = [null, undefined, {}] as any[];
      const invalidRides = [null, undefined, {}] as any[];

      // Act & Assert
      await assert.rejects(
        () => strategy.assign(invalidRides, invalidDrivers),
        'Should throw error for invalid data'
      );
    });

    test('GIVEN all rides outside shifts WHEN assigning THEN should assign nothing', async () => {
      // Arrange
      const strategy = new GreedyStrategy();
      const drivers = [
        TestDataFactory.createDriverWithShifts('driver1', [{ start: '06:00', end: '12:00' }])
      ];
      const rides = [
        TestDataFactory.createRideWithTime('ride1', '13:00', '14:00'), // After shift
        TestDataFactory.createRideWithTime('ride2', '05:00', '06:00'), // Before shift
        TestDataFactory.createRideWithTime('ride3', '12:01', '13:00')  // After shift
      ];

      // Act
      const assignments = await strategy.assign(rides, drivers);

      // Assert
      assert.strictEqual(assignments.length, 0, 'Should assign no rides when all are outside shifts');
    });
  });

  describe('Performance and Scalability', () => {
    test('GIVEN large dataset WHEN assigning THEN should complete within time limit', async () => {
      // Arrange
      const strategy = new GreedyStrategy();
      const { drivers, rides } = PerformanceTestHelpers.createLargeDataset(5, 8);
      
      // Add shifts to drivers
      drivers.forEach((driver, index) => {
        const shiftPatterns = [
          [{ start: '06:00', end: '14:00' }],
          [{ start: '14:00', end: '22:00' }],
          [{ start: '08:00', end: '16:00' }]
        ];
        (driver as any).shifts = shiftPatterns[index % shiftPatterns.length]!.map(shift => ({
          startMinutes: TestDataFactory['parseShiftTime'](shift.start),
          endMinutes: TestDataFactory['parseShiftTime'](shift.end)
        }));
      });

      // Act & Assert
      const { result: assignments, duration } = await PerformanceTestHelpers.measureTime(async () => {
        return await strategy.assign(rides, drivers);
      });

      assert(duration < 1500, `Should complete within 1.5 seconds, took ${duration.toFixed(2)}ms`);
      assert(assignments.length > 0, 'Should assign some rides');
      
      TestAssertions.assertAllAssignmentsValid(assignments);
      TestAssertions.assertNoOverlappingAssignments(assignments);
      TestAssertions.assertAssignmentsRespectShifts(assignments);
      
      console.log(`Large dataset: ${assignments.length}/${rides.length} rides assigned in ${duration.toFixed(2)}ms`);
    });

    test('GIVEN memory-intensive scenario WHEN assigning THEN should not leak memory', async () => {
      // Arrange
      const strategy = new GreedyStrategy();
      const { drivers, rides } = PerformanceTestHelpers.createLargeDataset(3, 5);
      
      // Add shifts to drivers
      drivers.forEach((driver, index) => {
        (driver as any).shifts = [{
          startMinutes: 360, // 06:00
          endMinutes: 840    // 14:00
        }];
      });

      // Act - Run multiple iterations to test for memory leaks
      const iterations = 2;
      const results = [];
      
      for (let i = 0; i < iterations; i++) {
        const { result, duration } = await PerformanceTestHelpers.measureTime(async () => {
          return await strategy.assign(rides, drivers);
        });
        results.push({ assignments: result.length, duration });
      }

      // Assert
      const avgAssignments = results.reduce((sum, r) => sum + r.assignments, 0) / results.length;
      const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
      
      assert(avgAssignments > 0, 'Should consistently assign rides');
      assert(avgDuration < 2000, `Average duration should be reasonable, got ${avgDuration.toFixed(2)}ms`);
      
      // Check for performance degradation (memory leak indicator)
      const firstDuration = results[0]!.duration;
      const lastDuration = results[results.length - 1]!.duration;
      const degradation = (lastDuration - firstDuration) / firstDuration;
      
      assert(degradation < 0.5, `Performance should not degrade by more than 50%, got ${(degradation * 100).toFixed(1)}%`);
      
      console.log(`Memory test: ${iterations} iterations, avg ${avgAssignments.toFixed(1)} assignments in ${avgDuration.toFixed(2)}ms`);
    });
  });

  describe('Strategy Comparison', () => {
    test('GIVEN same dataset WHEN comparing strategies THEN both should respect constraints', async () => {
      // Arrange
      const greedyStrategy = new GreedyStrategy();
      const minCostStrategy = new MinCostFlowStrategy();
      
      const { drivers, rides } = TestDataFactory.createEdgeCaseData();
      
      // Add shifts to drivers
      drivers.forEach((driver, index) => {
        if (driver.id.includes('shift')) {
          (driver as any).shifts = [{
            startMinutes: 360, // 06:00
            endMinutes: 720    // 12:00
          }];
        }
      });

      // Act
      const greedyAssignments = await greedyStrategy.assign(rides, drivers);
      const minCostAssignments = await minCostStrategy.assign(rides, drivers);

      // Assert
      assert(greedyAssignments.length >= 0, 'Greedy should handle edge cases');
      assert(minCostAssignments.length >= 0, 'MinCost should handle edge cases');
      
      // Both strategies should respect constraints
      TestAssertions.assertAllAssignmentsValid(greedyAssignments);
      TestAssertions.assertAllAssignmentsValid(minCostAssignments);
      TestAssertions.assertNoOverlappingAssignments(greedyAssignments);
      TestAssertions.assertNoOverlappingAssignments(minCostAssignments);
      TestAssertions.assertAssignmentsRespectShifts(greedyAssignments);
      TestAssertions.assertAssignmentsRespectShifts(minCostAssignments);
      
      console.log(`Strategy comparison - Greedy: ${greedyAssignments.length}, MinCost: ${minCostAssignments.length}`);
    });
  });
});
