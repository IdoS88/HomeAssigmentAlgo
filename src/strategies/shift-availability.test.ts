import { test, describe } from 'node:test';
import assert from 'node:assert';
import { GreedyStrategy } from './greedy.js';
import { MinCostFlowStrategy } from './minCostFlow.js';
import { TestDataFactory, TestAssertions, PerformanceTestHelpers } from '../test-helpers.js';
import { parseDrivers, parseRides } from '../domain.js';

describe('Shift Availability - Driver Assignment Logic', () => {
  
  describe('Happy Path Scenarios', () => {
    test('GIVEN driver with 06:00-12:00 shift AND ride at 06:30-07:00 WHEN assigning THEN should assign successfully', async () => {
      // Arrange
      const strategy = new GreedyStrategy();
      const driversData = [{
        driverId: "driver1",
        firstName: "John",
        lastName: "Doe",
        city: "Shlomo, Hadera",
        mainPhone: "0501111111",
        status: "active",
        licenceDegree: ["B"],
        numberOfSeats: 8,
        fuelCost: 2.0,
        city_coords: [32.4356, 34.9178],
        shifts: [{ start: "06:00", end: "12:00" }]
      }];
      const ridesData = [{
        _id: "ride1",
        date: "2025-03-10",
        startTime: "06:30",
        endTime: "07:00",
        startPoint: "Givat Bilu, Hadera",
        endPoint: "Yoseftal, Hadera",
        numberOfSeats: 4,
        startPoint_coords: [32.4356, 34.9178],
        endPoint_coords: [32.4400, 34.9200] // Different coordinates for distance
      }];

      // Act
      const drivers = parseDrivers(driversData);
      const rides = parseRides(ridesData);
      const assignments = await strategy.assign(rides, drivers);

      // Assert
      assert.strictEqual(assignments.length, 1, 'Should assign exactly one ride');
      assert.strictEqual(assignments[0]!.driver.id, 'driver1', 'Should assign to correct driver');
      assert.strictEqual(assignments[0]!.ride.id, 'ride1', 'Should assign correct ride');
      TestAssertions.assertValidAssignment(assignments[0]!);
    });

    test('GIVEN driver with multiple shifts AND rides within different shifts WHEN assigning THEN should assign both rides', async () => {
      // Arrange
      const strategy = new GreedyStrategy();
      const driversData = [{
        driverId: "driver1",
        firstName: "John",
        lastName: "Doe",
        city: "Shlomo, Hadera",
        mainPhone: "0501111111",
        status: "active",
        licenceDegree: ["B"],
        numberOfSeats: 8,
        fuelCost: 2.0,
        city_coords: [32.4356, 34.9178],
        shifts: [
          { start: "06:00", end: "10:00" },
          { start: "14:00", end: "18:00" }
        ]
      }];
      const ridesData = [
        {
          _id: "ride1",
          date: "2025-03-10",
          startTime: "08:00",
          endTime: "09:00",
          startPoint: "Givat Bilu, Hadera",
          endPoint: "Yoseftal, Hadera",
          numberOfSeats: 4,
          startPoint_coords: [32.4356, 34.9178],
          endPoint_coords: [32.4400, 34.9200] // Different coordinates for distance
        },
        {
          _id: "ride2",
          date: "2025-03-10",
          startTime: "15:00",
          endTime: "16:00",
          startPoint: "Givat Bilu, Hadera",
          endPoint: "Yoseftal, Hadera",
          numberOfSeats: 4,
          startPoint_coords: [32.4356, 34.9178],
          endPoint_coords: [32.4400, 34.9200] // Different coordinates for distance
        }
      ];

      // Act
      const drivers = parseDrivers(driversData);
      const rides = parseRides(ridesData);
      const assignments = await strategy.assign(rides, drivers);

      // Assert
      assert.strictEqual(assignments.length, 2, 'Should assign both rides');
      assert.strictEqual(assignments[0]!.ride.id, 'ride1', 'First ride should be assigned');
      assert.strictEqual(assignments[1]!.ride.id, 'ride2', 'Second ride should be assigned');
      TestAssertions.assertAllAssignmentsValid(assignments);
    });

    test('GIVEN driver without shifts WHEN assigning THEN should work with backward compatibility', async () => {
      // Arrange
      const strategy = new GreedyStrategy();
      const driversData = [{
        driverId: "driver1",
        firstName: "John",
        lastName: "Doe",
        city: "Shlomo, Hadera",
        mainPhone: "0501111111",
        status: "active",
        licenceDegree: ["B"],
        numberOfSeats: 8,
        fuelCost: 2.0,
        city_coords: [32.4356, 34.9178]
        // No shifts field - backward compatibility
      }];
      const ridesData = [{
        _id: "ride1",
        date: "2025-03-10",
        startTime: "06:30",
        endTime: "07:00",
        startPoint: "Givat Bilu, Hadera",
        endPoint: "Yoseftal, Hadera",
        numberOfSeats: 4,
        startPoint_coords: [32.4356, 34.9178],
        endPoint_coords: [32.4400, 34.9200] // Different coordinates for distance
      }];

      // Act
      const drivers = parseDrivers(driversData);
      const rides = parseRides(ridesData);
      const assignments = await strategy.assign(rides, drivers);

      // Assert
      assert.strictEqual(assignments.length, 1, 'Should assign ride despite no shifts');
      assert.strictEqual(assignments[0]!.driver.id, 'driver1', 'Should assign to correct driver');
      TestAssertions.assertValidAssignment(assignments[0]!);
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    test('GIVEN ride exactly at shift start AND end WHEN assigning THEN should assign successfully', async () => {
      // Arrange
      const strategy = new GreedyStrategy();
      const driversData = [{
        driverId: "driver1",
        firstName: "John",
        lastName: "Doe",
        city: "Shlomo, Hadera",
        mainPhone: "0501111111",
        status: "active",
        licenceDegree: ["B"],
        numberOfSeats: 8,
        fuelCost: 2.0,
        city_coords: [32.4356, 34.9178],
        shifts: [{ start: "06:00", end: "12:00" }]
      }];
      const ridesData = [{
        _id: "ride1",
        date: "2025-03-10",
        startTime: "06:00", // Exactly at shift start
        endTime: "12:00",   // Exactly at shift end
        startPoint: "Givat Bilu, Hadera",
        endPoint: "Yoseftal, Hadera",
        numberOfSeats: 4,
        startPoint_coords: [32.4356, 34.9178],
        endPoint_coords: [32.4400, 34.9200] // Different coordinates for distance
      }];

      // Act
      const drivers = parseDrivers(driversData);
      const rides = parseRides(ridesData);
      const assignments = await strategy.assign(rides, drivers);

      // Assert
      assert.strictEqual(assignments.length, 1, 'Should assign ride at exact boundaries');
      TestAssertions.assertValidAssignment(assignments[0]!);
    });

    test('GIVEN ride 1 minute before shift start WHEN assigning THEN should reject', async () => {
      // Arrange
      const strategy = new GreedyStrategy();
      const driversData = [{
        driverId: "driver1",
        firstName: "John",
        lastName: "Doe",
        city: "Shlomo, Hadera",
        mainPhone: "0501111111",
        status: "active",
        licenceDegree: ["B"],
        numberOfSeats: 8,
        fuelCost: 2.0,
        city_coords: [32.4356, 34.9178],
        shifts: [{ start: "07:00", end: "12:00" }]
      }];
      const ridesData = [{
        _id: "ride1",
        date: "2025-03-10",
        startTime: "06:59", // 1 minute before shift
        endTime: "07:30",
        startPoint: "Givat Bilu, Hadera",
        endPoint: "Yoseftal, Hadera",
        numberOfSeats: 4,
        startPoint_coords: [32.4356, 34.9178],
        endPoint_coords: [32.4400, 34.9200] // Different coordinates for distance
      }];

      // Act
      const drivers = parseDrivers(driversData);
      const rides = parseRides(ridesData);
      const assignments = await strategy.assign(rides, drivers);

      // Assert
      assert.strictEqual(assignments.length, 0, 'Should reject ride before shift starts');
    });

    test('GIVEN ride 1 minute after shift end WHEN assigning THEN should reject', async () => {
      // Arrange
      const strategy = new GreedyStrategy();
      const driversData = [{
        driverId: "driver1",
        firstName: "John",
        lastName: "Doe",
        city: "Shlomo, Hadera",
        mainPhone: "0501111111",
        status: "active",
        licenceDegree: ["B"],
        numberOfSeats: 8,
        fuelCost: 2.0,
        city_coords: [32.4356, 34.9178],
        shifts: [{ start: "06:00", end: "12:00" }]
      }];
      const ridesData = [{
        _id: "ride1",
        date: "2025-03-10",
        startTime: "12:01", // 1 minute after shift
        endTime: "13:00",
        startPoint: "Givat Bilu, Hadera",
        endPoint: "Yoseftal, Hadera",
        numberOfSeats: 4,
        startPoint_coords: [32.4356, 34.9178],
        endPoint_coords: [32.4400, 34.9200] // Different coordinates for distance
      }];

      // Act
      const drivers = parseDrivers(driversData);
      const rides = parseRides(ridesData);
      const assignments = await strategy.assign(rides, drivers);

      // Assert
      assert.strictEqual(assignments.length, 0, 'Should reject ride after shift ends');
    });
  });

  describe('Error Conditions and Negative Cases', () => {
    test('GIVEN ride outside driver shift WHEN assigning THEN should reject', async () => {
      // Arrange
      const strategy = new GreedyStrategy();
      const driversData = [{
        driverId: "driver1",
        firstName: "John",
        lastName: "Doe",
        city: "Shlomo, Hadera",
        mainPhone: "0501111111",
        status: "active",
        licenceDegree: ["B"],
        numberOfSeats: 8,
        fuelCost: 2.0,
        city_coords: [32.4356, 34.9178],
        shifts: [{ start: "07:00", end: "12:00" }] // Starts at 07:00
      }];
      const ridesData = [{
        _id: "ride1",
        date: "2025-03-10",
        startTime: "06:30", // Before shift starts
        endTime: "07:00",
        startPoint: "Givat Bilu, Hadera",
        endPoint: "Yoseftal, Hadera",
        numberOfSeats: 4,
        startPoint_coords: [32.4356, 34.9178],
        endPoint_coords: [32.4400, 34.9200] // Different coordinates for distance
      }];

      // Act
      const drivers = parseDrivers(driversData);
      const rides = parseRides(ridesData);
      const assignments = await strategy.assign(rides, drivers);

      // Assert
      assert.strictEqual(assignments.length, 0, 'Should reject ride outside shift');
    });

    test('GIVEN ride with deadhead time exceeding shift start WHEN assigning THEN should reject', async () => {
      // Arrange
      const strategy = new GreedyStrategy();
      const driversData = [{
        driverId: "driver1",
        firstName: "John",
        lastName: "Doe",
        city: "Shlomo, Hadera",
        mainPhone: "0501111111",
        status: "active",
        licenceDegree: ["B"],
        numberOfSeats: 8,
        fuelCost: 2.0,
        city_coords: [32.4356, 34.9178],
        shifts: [{ start: "07:00", end: "12:00" }] // Starts at 07:00
      }];
      const ridesData = [{
        _id: "ride1",
        date: "2025-03-10",
        startTime: "06:55", // 5 minutes before shift starts
        endTime: "07:30",
        startPoint: "Givat Bilu, Hadera",
        endPoint: "Yoseftal, Hadera",
        numberOfSeats: 4,
        startPoint_coords: [32.4356, 34.9178],
        endPoint_coords: [32.4400, 34.9200] // Different coordinates for distance
      }];

      // Act
      const drivers = parseDrivers(driversData);
      const rides = parseRides(ridesData);
      const assignments = await strategy.assign(rides, drivers);

      // Assert
      assert.strictEqual(assignments.length, 0, 'Should reject ride when deadhead exceeds shift start');
    });

    test('GIVEN ride between driver shifts WHEN assigning THEN should reject', async () => {
      // Arrange
      const strategy = new GreedyStrategy();
      const driversData = [{
        driverId: "driver1",
        firstName: "John",
        lastName: "Doe",
        city: "Shlomo, Hadera",
        mainPhone: "0501111111",
        status: "active",
        licenceDegree: ["B"],
        numberOfSeats: 8,
        fuelCost: 2.0,
        city_coords: [32.4356, 34.9178],
        shifts: [
          { start: "06:00", end: "10:00" },
          { start: "14:00", end: "18:00" }
        ]
      }];
      const ridesData = [{
        _id: "ride1",
        date: "2025-03-10",
        startTime: "12:00", // Between shifts
        endTime: "13:00",
        startPoint: "Givat Bilu, Hadera",
        endPoint: "Yoseftal, Hadera",
        numberOfSeats: 4,
        startPoint_coords: [32.4356, 34.9178],
        endPoint_coords: [32.4400, 34.9200] // Different coordinates for distance
      }];

      // Act
      const drivers = parseDrivers(driversData);
      const rides = parseRides(ridesData);
      const assignments = await strategy.assign(rides, drivers);

      // Assert
      assert.strictEqual(assignments.length, 0, 'Should reject ride between shifts');
    });
  });

  describe('Strategy Comparison', () => {
    test('GIVEN same data WHEN using Greedy vs MinCostFlow THEN both should respect shift constraints', async () => {
      // Arrange
      const greedyStrategy = new GreedyStrategy();
      const minCostStrategy = new MinCostFlowStrategy();
      
      const driversData = [{
        driverId: "driver1",
        firstName: "John",
        lastName: "Doe",
        city: "Shlomo, Hadera",
        mainPhone: "0501111111",
        status: "active",
        licenceDegree: ["B"],
        numberOfSeats: 8,
        fuelCost: 2.0,
        city_coords: [32.4356, 34.9178],
        shifts: [{ start: "06:00", end: "12:00" }]
      }];
      const ridesData = [{
        _id: "ride1",
        date: "2025-03-10",
        startTime: "06:30",
        endTime: "07:00",
        startPoint: "Givat Bilu, Hadera",
        endPoint: "Yoseftal, Hadera",
        numberOfSeats: 4,
        startPoint_coords: [32.4356, 34.9178],
        endPoint_coords: [32.4400, 34.9200] // Different coordinates for distance
      }];

      // Act
      const drivers = parseDrivers(driversData);
      const rides = parseRides(ridesData);
      const greedyAssignments = await greedyStrategy.assign(rides, drivers);
      const minCostAssignments = await minCostStrategy.assign(rides, drivers);

      // Assert
      assert.strictEqual(greedyAssignments.length, 1, 'Greedy should assign ride');
      assert.strictEqual(minCostAssignments.length, 1, 'MinCostFlow should assign ride');
      assert.strictEqual(greedyAssignments[0]!.driver.id, 'driver1', 'Greedy should assign to correct driver');
      assert.strictEqual(minCostAssignments[0]!.driver.id, 'driver1', 'MinCostFlow should assign to correct driver');
      TestAssertions.assertValidAssignment(greedyAssignments[0]!);
      TestAssertions.assertValidAssignment(minCostAssignments[0]!);
    });
  });

  describe('Performance and Load Testing', () => {
    test('GIVEN large dataset with shifts WHEN assigning THEN should complete within reasonable time', async () => {
      // Arrange
      const strategy = new GreedyStrategy();
      const { drivers, rides } = PerformanceTestHelpers.createLargeDataset(3, 5);
      
      // Add shifts to all drivers
      drivers.forEach((driver: any, index: number) => {
        const shifts = [
          [{ start: "06:00", end: "14:00" }],
          [{ start: "14:00", end: "22:00" }],
          [{ start: "08:00", end: "16:00" }],
          [{ start: "06:00", end: "10:00" }, { start: "14:00", end: "18:00" }],
          [{ start: "07:00", end: "15:00" }]
        ];
        driver.shifts = shifts[index % shifts.length]!.map(shift => ({
          startMinutes: parseShiftTime(shift.start),
          endMinutes: parseShiftTime(shift.end)
        }));
      });

      // Act & Assert
      const { result: assignments, duration } = await PerformanceTestHelpers.measureTime(async () => {
        return await strategy.assign(rides, drivers);
      });

      assert(duration < 2000, `Should complete within 2 seconds, took ${duration}ms`);
      assert(assignments.length > 0, 'Should assign some rides');
      TestAssertions.assertAllAssignmentsValid(assignments);
      
      console.log(`Shift-aware assignment: ${assignments.length}/${rides.length} rides assigned in ${duration.toFixed(2)}ms`);
    });
  });
});

// Helper function for shift time parsing
function parseShiftTime(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return (hours ?? 0) * 60 + (minutes ?? 0);
}