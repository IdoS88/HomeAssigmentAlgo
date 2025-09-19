import { test, describe } from 'node:test';
import { strict as assert } from 'node:assert';
import { solve } from '../../dist/solver.js';

describe('Solver Pure Function - Hadera/Netanya Locations', () => {
  // Real locations from sample data
  const LOCATIONS = {
    HADERA_SHLOMO: [32.4323641, 34.9142005], // Driver base
    HADERA_GIVAT_BILU: [32.4440992, 34.9240281], // Ride pickup
    HADERA_YOSEFTAL: [32.4367737, 34.9270303], // Ride dropoff
    HADERA_BRANDEIS: [32.4245037, 34.9221828], // Ride pickup
    HADERA_BIALIK: [32.4329799, 34.9103811], // Ride dropoff
    NETANYA_ALON: [32.3217, 34.8584], // Driver base
    NETANYA_CENTER: [32.3321, 34.8600], // Ride pickup
  };

  describe('Single Driver, Single Ride Tests', () => {
    test('Hadera driver serves Hadera ride - perfect match', () => {
      const input = {
        drivers: [
          {
            driverId: 'driver1',
            firstName: 'John',
            lastName: 'Doe',
            city: 'Shlomo, Hadera',
            mainPhone: '0501111111',
            status: 'active',
            licenceDegree: ['D'],
            numberOfSeats: 17,
            fuelCost: 2.5,
            city_coords: LOCATIONS.HADERA_SHLOMO,
            shifts: [{ start: '06:00', end: '18:00' }]
          }
        ],
        rides: [
          {
            _id: 'ride1',
            date: '2025-03-10',
            startTime: '06:45',
            endTime: '07:05',
            startPoint: 'Givat Bilu, Hadera',
            endPoint: 'Yoseftal, Hadera',
            numberOfSeats: 4,
            startPoint_coords: LOCATIONS.HADERA_GIVAT_BILU,
            endPoint_coords: LOCATIONS.HADERA_YOSEFTAL
          }
        ]
      };

      const result = solve(input);

      assert.strictEqual(result.served, 1, 'Should serve 1 ride');
      assert.strictEqual(result.assignments.length, 1, 'Should have 1 assignment');
      assert.strictEqual(result.assignments[0].driverId, 'driver1', 'Should assign to driver1');
      assert.strictEqual(result.assignments[0].rideIds[0], 'ride1', 'Should assign ride1');
      assert(result.objective > 0, 'Should have positive cost');
      
      // Cost should include: 20min ride time + ~1.5km distance + deadhead travel
      assert(result.objective >= 1000, 'Should cost at least 1000 agorot (20min × 50)');
    });

    test('Netanya driver serves Hadera ride - longer deadhead', () => {
      const input = {
        drivers: [
          {
            driverId: 'driver2',
            firstName: 'Jane',
            lastName: 'Smith',
            city: 'Alon, Netanya',
            mainPhone: '0502222222',
            status: 'active',
            licenceDegree: ['D'],
            numberOfSeats: 17,
            fuelCost: 3.0,
            city_coords: LOCATIONS.NETANYA_ALON,
            shifts: [{ start: '06:00', end: '18:00' }]
          }
        ],
        rides: [
          {
            _id: 'ride1',
            date: '2025-03-10',
            startTime: '06:45',
            endTime: '07:05',
            startPoint: 'Givat Bilu, Hadera',
            endPoint: 'Yoseftal, Hadera',
            numberOfSeats: 4,
            startPoint_coords: LOCATIONS.HADERA_GIVAT_BILU,
            endPoint_coords: LOCATIONS.HADERA_YOSEFTAL
          }
        ]
      };

      const result = solve(input);

      assert.strictEqual(result.served, 1, 'Should serve 1 ride');
      assert.strictEqual(result.assignments.length, 1, 'Should have 1 assignment');
      assert.strictEqual(result.assignments[0].driverId, 'driver2', 'Should assign to driver2');
      
      // Netanya to Hadera is ~12km, so deadhead cost should be significant
      assert(result.objective > 1500, 'Should cost more due to longer deadhead from Netanya');
    });

    test('capacity mismatch - B license cannot serve 10 passengers', () => {
      const input = {
        drivers: [
          {
            driverId: 'driver1',
            firstName: 'John',
            lastName: 'Doe',
            city: 'Shlomo, Hadera',
            mainPhone: '0501111111',
            status: 'active',
            licenceDegree: ['B'], // Max 8 passengers
            numberOfSeats: 8,
            fuelCost: 2.5,
            city_coords: LOCATIONS.HADERA_SHLOMO,
            shifts: [{ start: '06:00', end: '18:00' }]
          }
        ],
        rides: [
          {
            _id: 'ride1',
            date: '2025-03-10',
            startTime: '06:45',
            endTime: '07:05',
            startPoint: 'Givat Bilu, Hadera',
            endPoint: 'Yoseftal, Hadera',
            numberOfSeats: 10, // Too many for B license
            startPoint_coords: LOCATIONS.HADERA_GIVAT_BILU,
            endPoint_coords: LOCATIONS.HADERA_YOSEFTAL
          }
        ]
      };

      const result = solve(input);

      assert.strictEqual(result.served, 0, 'Should serve 0 rides (capacity mismatch)');
      assert.strictEqual(result.assignments.length, 0, 'Should have 0 assignments');
      assert.strictEqual(result.objective, 0, 'Should have 0 cost');
    });

    test('time window mismatch - ride before shift starts', () => {
      const input = {
        drivers: [
          {
            driverId: 'driver1',
            firstName: 'John',
            lastName: 'Doe',
            city: 'Shlomo, Hadera',
            mainPhone: '0501111111',
            status: 'active',
            licenceDegree: ['D'],
            numberOfSeats: 17,
            fuelCost: 2.5,
            city_coords: LOCATIONS.HADERA_SHLOMO,
            shifts: [{ start: '07:00', end: '18:00' }] // Starts after ride
          }
        ],
        rides: [
          {
            _id: 'ride1',
            date: '2025-03-10',
            startTime: '06:45', // Before shift starts
            endTime: '07:05',
            startPoint: 'Givat Bilu, Hadera',
            endPoint: 'Yoseftal, Hadera',
            numberOfSeats: 4,
            startPoint_coords: LOCATIONS.HADERA_GIVAT_BILU,
            endPoint_coords: LOCATIONS.HADERA_YOSEFTAL
          }
        ]
      };

      const result = solve(input);

      assert.strictEqual(result.served, 0, 'Should serve 0 rides (time window mismatch)');
      assert.strictEqual(result.assignments.length, 0, 'Should have 0 assignments');
      assert.strictEqual(result.objective, 0, 'Should have 0 cost');
    });
  });

  describe('Multiple Drivers, Single Ride Tests', () => {
    test('Hadera vs Netanya driver - should pick Hadera (lower deadhead)', () => {
      const input = {
        drivers: [
          {
            driverId: 'driver1',
            firstName: 'John',
            lastName: 'Doe',
            city: 'Shlomo, Hadera',
            mainPhone: '0501111111',
            status: 'active',
            licenceDegree: ['D'],
            numberOfSeats: 17,
            fuelCost: 2.5,
            city_coords: LOCATIONS.HADERA_SHLOMO,
            shifts: [{ start: '06:00', end: '18:00' }]
          },
          {
            driverId: 'driver2',
            firstName: 'Jane',
            lastName: 'Smith',
            city: 'Alon, Netanya',
            mainPhone: '0502222222',
            status: 'active',
            licenceDegree: ['D'],
            numberOfSeats: 17,
            fuelCost: 3.0,
            city_coords: LOCATIONS.NETANYA_ALON,
            shifts: [{ start: '06:00', end: '18:00' }]
          }
        ],
        rides: [
          {
            _id: 'ride1',
            date: '2025-03-10',
            startTime: '06:45',
            endTime: '07:05',
            startPoint: 'Givat Bilu, Hadera',
            endPoint: 'Yoseftal, Hadera',
            numberOfSeats: 4,
            startPoint_coords: LOCATIONS.HADERA_GIVAT_BILU,
            endPoint_coords: LOCATIONS.HADERA_YOSEFTAL
          }
        ]
      };

      const result = solve(input);

      assert.strictEqual(result.served, 1, 'Should serve 1 ride');
      assert.strictEqual(result.assignments.length, 1, 'Should have 1 assignment');
      assert.strictEqual(result.assignments[0].driverId, 'driver1', 'Should pick Hadera driver (lower deadhead)');
      
      // Hadera driver should be cheaper due to proximity
      assert(result.objective < 2000, 'Should cost less than Netanya driver');
    });

    test('fuel cost comparison - expensive vs cheap driver', () => {
      const input = {
        drivers: [
          {
            driverId: 'driver1',
            firstName: 'John',
            lastName: 'Doe',
            city: 'Shlomo, Hadera',
            mainPhone: '0501111111',
            status: 'active',
            licenceDegree: ['D'],
            numberOfSeats: 17,
            fuelCost: 5.0, // Expensive fuel
            city_coords: LOCATIONS.HADERA_SHLOMO,
            shifts: [{ start: '06:00', end: '18:00' }]
          },
          {
            driverId: 'driver2',
            firstName: 'Jane',
            lastName: 'Smith',
            city: 'Shlomo, Hadera',
            mainPhone: '0502222222',
            status: 'active',
            licenceDegree: ['D'],
            numberOfSeats: 17,
            fuelCost: 1.5, // Cheap fuel
            city_coords: LOCATIONS.HADERA_SHLOMO,
            shifts: [{ start: '06:00', end: '18:00' }]
          }
        ],
        rides: [
          {
            _id: 'ride1',
            date: '2025-03-10',
            startTime: '06:45',
            endTime: '07:05',
            startPoint: 'Givat Bilu, Hadera',
            endPoint: 'Yoseftal, Hadera',
            numberOfSeats: 4,
            startPoint_coords: LOCATIONS.HADERA_GIVAT_BILU,
            endPoint_coords: LOCATIONS.HADERA_YOSEFTAL
          }
        ]
      };

      const result = solve(input);

      assert.strictEqual(result.served, 1, 'Should serve 1 ride');
      assert.strictEqual(result.assignments[0].driverId, 'driver2', 'Should pick cheap fuel driver');
    });
  });

  describe('Single Driver, Multiple Rides Tests', () => {
    test('Hadera driver serves multiple Hadera rides - chronological order', () => {
      const input = {
        drivers: [
          {
            driverId: 'driver1',
            firstName: 'John',
            lastName: 'Doe',
            city: 'Shlomo, Hadera',
            mainPhone: '0501111111',
            status: 'active',
            licenceDegree: ['D'],
            numberOfSeats: 17,
            fuelCost: 2.5,
            city_coords: LOCATIONS.HADERA_SHLOMO,
            shifts: [{ start: '06:00', end: '18:00' }]
          }
        ],
        rides: [
          {
            _id: 'ride2',
            date: '2025-03-10',
            startTime: '07:10', // Later ride
            endTime: '07:35',
            startPoint: 'Brandeis, Hadera',
            endPoint: 'Bialik, Hadera',
            numberOfSeats: 6,
            startPoint_coords: LOCATIONS.HADERA_BRANDEIS,
            endPoint_coords: LOCATIONS.HADERA_BIALIK
          },
          {
            _id: 'ride1',
            date: '2025-03-10',
            startTime: '06:45', // Earlier ride
            endTime: '07:05',
            startPoint: 'Givat Bilu, Hadera',
            endPoint: 'Yoseftal, Hadera',
            numberOfSeats: 4,
            startPoint_coords: LOCATIONS.HADERA_GIVAT_BILU,
            endPoint_coords: LOCATIONS.HADERA_YOSEFTAL
          }
        ]
      };

      const result = solve(input);

      assert.strictEqual(result.served, 2, 'Should serve 2 rides');
      assert.strictEqual(result.assignments.length, 1, 'Should have 1 assignment (same driver)');
      assert.strictEqual(result.assignments[0].driverId, 'driver1', 'Should assign to driver1');
      assert.strictEqual(result.assignments[0].rideIds.length, 2, 'Should assign 2 rides');
      assert.strictEqual(result.assignments[0].rideIds[0], 'ride1', 'First should be ride1 (earlier)');
      assert.strictEqual(result.assignments[0].rideIds[1], 'ride2', 'Second should be ride2 (later)');
    });

    test('time conflict - overlapping rides cannot both be served', () => {
      const input = {
        drivers: [
          {
            driverId: 'driver1',
            firstName: 'John',
            lastName: 'Doe',
            city: 'Shlomo, Hadera',
            mainPhone: '0501111111',
            status: 'active',
            licenceDegree: ['D'],
            numberOfSeats: 17,
            fuelCost: 2.5,
            city_coords: LOCATIONS.HADERA_SHLOMO,
            shifts: [{ start: '06:00', end: '18:00' }]
          }
        ],
        rides: [
          {
            _id: 'ride1',
            date: '2025-03-10',
            startTime: '06:45',
            endTime: '07:15', // Overlaps with ride2
            startPoint: 'Givat Bilu, Hadera',
            endPoint: 'Yoseftal, Hadera',
            numberOfSeats: 4,
            startPoint_coords: LOCATIONS.HADERA_GIVAT_BILU,
            endPoint_coords: LOCATIONS.HADERA_YOSEFTAL
          },
          {
            _id: 'ride2',
            date: '2025-03-10',
            startTime: '07:00', // Conflicts with ride1
            endTime: '07:30',
            startPoint: 'Brandeis, Hadera',
            endPoint: 'Bialik, Hadera',
            numberOfSeats: 6,
            startPoint_coords: LOCATIONS.HADERA_BRANDEIS,
            endPoint_coords: LOCATIONS.HADERA_BIALIK
          }
        ]
      };

      const result = solve(input);

      assert.strictEqual(result.served, 1, 'Should serve only 1 ride (time conflict)');
      assert.strictEqual(result.assignments[0].rideIds.length, 1, 'Should assign only 1 ride');
      assert.strictEqual(result.assignments[0].rideIds[0], 'ride1', 'Should assign first ride (chronological)');
    });
  });

  describe('Cross-City Travel Tests', () => {
    test('Hadera to Netanya ride - longer distance and time', () => {
      const input = {
        drivers: [
          {
            driverId: 'driver1',
            firstName: 'John',
            lastName: 'Doe',
            city: 'Shlomo, Hadera',
            mainPhone: '0501111111',
            status: 'active',
            licenceDegree: ['D'],
            numberOfSeats: 17,
            fuelCost: 2.5,
            city_coords: LOCATIONS.HADERA_SHLOMO,
            shifts: [{ start: '06:00', end: '18:00' }]
          }
        ],
        rides: [
          {
            _id: 'ride1',
            date: '2025-03-10',
            startTime: '06:45',
            endTime: '07:45', // 60 minutes for cross-city travel
            startPoint: 'Givat Bilu, Hadera',
            endPoint: 'Center, Netanya',
            numberOfSeats: 4,
            startPoint_coords: LOCATIONS.HADERA_GIVAT_BILU,
            endPoint_coords: LOCATIONS.NETANYA_CENTER
          }
        ]
      };

      const result = solve(input);

      assert.strictEqual(result.served, 1, 'Should serve 1 ride');
      assert.strictEqual(result.assignments[0].driverId, 'driver1', 'Should assign to driver1');
      
      // Cross-city should cost significantly more (60min + ~12km)
      assert(result.objective >= 3000, 'Should cost at least 3000 agorot (60min × 50)');
    });
  });

  describe('Edge Cases', () => {
    test('empty input', () => {
      const input = { drivers: [], rides: [] };
      const result = solve(input);

      assert.strictEqual(result.served, 0, 'Should serve 0 rides');
      assert.strictEqual(result.assignments.length, 0, 'Should have 0 assignments');
      assert.strictEqual(result.objective, 0, 'Should have 0 cost');
    });

    test('drivers but no rides', () => {
      const input = {
        drivers: [
          {
            driverId: 'driver1',
            firstName: 'John',
            lastName: 'Doe',
            city: 'Shlomo, Hadera',
            mainPhone: '0501111111',
            status: 'active',
            licenceDegree: ['D'],
            numberOfSeats: 17,
            fuelCost: 2.5,
            city_coords: LOCATIONS.HADERA_SHLOMO,
            shifts: [{ start: '06:00', end: '18:00' }]
          }
        ],
        rides: []
      };

      const result = solve(input);

      assert.strictEqual(result.served, 0, 'Should serve 0 rides');
      assert.strictEqual(result.assignments.length, 0, 'Should have 0 assignments');
      assert.strictEqual(result.objective, 0, 'Should have 0 cost');
    });

    test('rides but no drivers', () => {
      const input = {
        drivers: [],
        rides: [
          {
            _id: 'ride1',
            date: '2025-03-10',
            startTime: '06:45',
            endTime: '07:05',
            startPoint: 'Givat Bilu, Hadera',
            endPoint: 'Yoseftal, Hadera',
            numberOfSeats: 4,
            startPoint_coords: LOCATIONS.HADERA_GIVAT_BILU,
            endPoint_coords: LOCATIONS.HADERA_YOSEFTAL
          }
        ]
      };

      const result = solve(input);

      assert.strictEqual(result.served, 0, 'Should serve 0 rides');
      assert.strictEqual(result.assignments.length, 0, 'Should have 0 assignments');
      assert.strictEqual(result.objective, 0, 'Should have 0 cost');
    });
  });

  describe('Output Format Validation', () => {
    test('result structure matches expected format', () => {
      const input = {
        drivers: [
          {
            driverId: 'driver1',
            firstName: 'John',
            lastName: 'Doe',
            city: 'Shlomo, Hadera',
            mainPhone: '0501111111',
            status: 'active',
            licenceDegree: ['D'],
            numberOfSeats: 17,
            fuelCost: 2.5,
            city_coords: LOCATIONS.HADERA_SHLOMO,
            shifts: [{ start: '06:00', end: '18:00' }]
          }
        ],
        rides: [
          {
            _id: 'ride1',
            date: '2025-03-10',
            startTime: '06:45',
            endTime: '07:05',
            startPoint: 'Givat Bilu, Hadera',
            endPoint: 'Yoseftal, Hadera',
            numberOfSeats: 4,
            startPoint_coords: LOCATIONS.HADERA_GIVAT_BILU,
            endPoint_coords: LOCATIONS.HADERA_YOSEFTAL
          }
        ]
      };

      const result = solve(input);

      // Check structure
      assert(typeof result === 'object', 'Result should be an object');
      assert(Array.isArray(result.assignments), 'assignments should be an array');
      assert(typeof result.served === 'number', 'served should be a number');
      assert(typeof result.objective === 'number', 'objective should be a number');

      // Check assignment structure
      if (result.assignments.length > 0) {
        const assignment = result.assignments[0];
        assert(typeof assignment.driverId === 'string', 'driverId should be a string');
        assert(Array.isArray(assignment.rideIds), 'rideIds should be an array');
        assert(assignment.rideIds.every(id => typeof id === 'string'), 'rideIds should contain strings');
      }

      // Check non-negative values
      assert(result.served >= 0, 'served should be non-negative');
      assert(result.objective >= 0, 'objective should be non-negative');
    });
  });
});
