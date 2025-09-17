/**
 * Test helper utilities for creating test data and common test operations
 */

import type { Driver, Ride } from './domain.js';
import type { Assignment } from './strategy.js';

// Common test locations
export const TEST_LOCATIONS = {
  TEL_AVIV: { lat: 32.0853, lng: 34.7818 },
  JERUSALEM: { lat: 31.7683, lng: 35.2137 },
  PETAH_TIKVA: { lat: 32.1093, lng: 34.8555 },
  HAIFA: { lat: 32.7940, lng: 34.9896 },
  BEER_SHEVA: { lat: 31.2518, lng: 34.7915 },
} as const;

// Test data factories
export class TestDataFactory {
  /**
   * Create a test driver with sensible defaults
   */
  static createDriver(
    id: string,
    overrides: Partial<Driver> = {}
  ): Driver {
    return {
      id,
      name: `Driver ${id}`,
      license: 'B',
      vehicleSeats: 8,
      fuelCost: 2.0,
      location: TEST_LOCATIONS.TEL_AVIV,
      ...overrides,
    };
  }

  /**
   * Create a test ride with sensible defaults
   */
  static createRide(
    id: string,
    overrides: Partial<Ride> = {}
  ): Ride {
    return {
      id,
      date: '2024-01-01',
      startTime: '09:00',
      endTime: '10:00',
      pickup: TEST_LOCATIONS.TEL_AVIV,
      dropoff: TEST_LOCATIONS.PETAH_TIKVA,
      passengers: 4,
      ...overrides,
    };
  }

  /**
   * Create multiple drivers with different characteristics
   */
  static createDriverSet(): Driver[] {
    return [
      this.createDriver('driver1', { fuelCost: 2.0, license: 'B', vehicleSeats: 8 }),
      this.createDriver('driver2', { fuelCost: 2.5, license: 'D1', vehicleSeats: 16 }),
      this.createDriver('driver3', { fuelCost: 3.0, license: 'D', vehicleSeats: 50 }),
      this.createDriver('driver4', { fuelCost: 1.8, license: 'B', vehicleSeats: 6 }),
    ];
  }

  /**
   * Create multiple rides with different characteristics
   */
  static createRideSet(): Ride[] {
    return [
      this.createRide('ride1', { passengers: 4, startTime: '09:00', endTime: '10:00' }),
      this.createRide('ride2', { passengers: 8, startTime: '10:00', endTime: '11:00' }),
      this.createRide('ride3', { passengers: 12, startTime: '11:00', endTime: '12:00' }),
      this.createRide('ride4', { passengers: 2, startTime: '12:00', endTime: '13:00' }),
    ];
  }

  /**
   * Create a driver that can handle a specific ride
   */
  static createCompatibleDriver(ride: Ride, overrides: Partial<Driver> = {}): Driver {
    const minSeats = ride.passengers;
    const license = ride.passengers > 8 ? (ride.passengers > 16 ? 'D' : 'D1') : 'B';
    
    return this.createDriver('compatible-driver', {
      license,
      vehicleSeats: Math.max(minSeats, 8),
      ...overrides,
    });
  }

  /**
   * Create a driver that cannot handle a specific ride
   */
  static createIncompatibleDriver(ride: Ride, overrides: Partial<Driver> = {}): Driver {
    const insufficientSeats = Math.max(1, ride.passengers - 1);
    const wrongLicense = ride.passengers > 8 ? 'B' : 'D';
    
    return this.createDriver('incompatible-driver', {
      license: wrongLicense,
      vehicleSeats: insufficientSeats,
      ...overrides,
    });
  }

  /**
   * Create a driver with specific shift patterns
   */
  static createDriverWithShifts(
    id: string, 
    shifts: Array<{ start: string; end: string }>, 
    overrides: Partial<Driver> = {}
  ): Driver {
    return this.createDriver(id, {
      ...overrides,
      shifts: shifts.map(shift => ({
        startMinutes: this.parseShiftTime(shift.start),
        endMinutes: this.parseShiftTime(shift.end),
      })),
    });
  }

  /**
   * Create a ride with specific time constraints
   */
  static createRideWithTime(
    id: string,
    startTime: string,
    endTime: string,
    overrides: Partial<Ride> = {}
  ): Ride {
    return this.createRide(id, {
      startTime,
      endTime,
      ...overrides,
    });
  }

  /**
   * Create edge case test data
   */
  static createEdgeCaseData(): { drivers: Driver[]; rides: Ride[] } {
    return {
      drivers: [
        // Driver with no shifts (backward compatibility)
        this.createDriver('no-shifts-driver', { fuelCost: 2.0 }),
        
        // Driver with single shift
        this.createDriverWithShifts('single-shift-driver', [{ start: '06:00', end: '12:00' }]),
        
        // Driver with multiple shifts
        this.createDriverWithShifts('multi-shift-driver', [
          { start: '06:00', end: '10:00' },
          { start: '14:00', end: '18:00' }
        ]),
        
        // Driver with overlapping shifts (edge case)
        this.createDriverWithShifts('overlapping-shift-driver', [
          { start: '06:00', end: '12:00' },
          { start: '11:00', end: '17:00' }
        ]),
      ],
      rides: [
        // Ride at exact shift boundary
        this.createRideWithTime('boundary-ride', '06:00', '12:00'),
        
        // Ride 1 minute before shift
        this.createRideWithTime('before-shift-ride', '05:59', '06:30'),
        
        // Ride 1 minute after shift
        this.createRideWithTime('after-shift-ride', '12:01', '12:30'),
        
        // Ride between shifts
        this.createRideWithTime('between-shifts-ride', '12:00', '14:00'),
        
        // Very short ride
        this.createRideWithTime('short-ride', '08:00', '08:01'),
        
        // Very long ride
        this.createRideWithTime('long-ride', '07:00', '11:00'),
      ]
    };
  }

  private static parseShiftTime(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return (hours ?? 0) * 60 + (minutes ?? 0);
  }
}

// Test assertion helpers
export class TestAssertions {
  /**
   * Assert that an assignment is valid
   */
  static assertValidAssignment(assignment: Assignment): void {
    if (!assignment) {
      throw new Error('Assignment should not be null or undefined');
    }
    
    if (!assignment.driver) {
      throw new Error('Assignment should have a driver');
    }
    
    if (!assignment.ride) {
      throw new Error('Assignment should have a ride');
    }
    
    if (assignment.totalCostAg <= 0) {
      throw new Error('Assignment should have a positive total cost');
    }
    
    if (assignment.loadedTimeMinutes <= 0) {
      throw new Error('Assignment should have positive loaded time');
    }
    
    if (assignment.loadedDistanceKm <= 0) {
      throw new Error('Assignment should have positive loaded distance');
    }
  }

  /**
   * Assert that all assignments are valid
   */
  static assertAllAssignmentsValid(assignments: Assignment[]): void {
    if (!Array.isArray(assignments)) {
      throw new Error('Assignments must be an array');
    }
    
    assignments.forEach((assignment, index) => {
      try {
        this.assertValidAssignment(assignment);
      } catch (error) {
        throw new Error(`Assignment at index ${index} is invalid: ${error}`);
      }
    });
  }

  /**
   * Assert that no driver is assigned multiple rides at the same time
   */
  static assertNoOverlappingAssignments(assignments: Assignment[]): void {
    const driverSchedules = new Map<string, Array<{ start: number; end: number; rideId: string }>>();
    
    for (const assignment of assignments) {
      const driverId = assignment.driver.id;
      const rideStart = this.parseTime(assignment.ride.startTime);
      const rideEnd = this.parseTime(assignment.ride.endTime);
      
      if (!driverSchedules.has(driverId)) {
        driverSchedules.set(driverId, []);
      }
      
      const schedule = driverSchedules.get(driverId)!;
      
      // Check for overlaps
      for (const existing of schedule) {
        const hasOverlap = !(rideEnd <= existing.start || rideStart >= existing.end);
        if (hasOverlap) {
          throw new Error(
            `Driver ${driverId} has overlapping assignments: ride ${assignment.ride.id} (${assignment.ride.startTime}-${assignment.ride.endTime}) overlaps with ride ${existing.rideId}`
          );
        }
      }
      
      schedule.push({ start: rideStart, end: rideEnd, rideId: assignment.ride.id });
    }
  }

  /**
   * Assert that all assignments respect driver shifts
   */
  static assertAssignmentsRespectShifts(assignments: Assignment[]): void {
    for (const assignment of assignments) {
      const driver = assignment.driver;
      if (driver.shifts && driver.shifts.length > 0) {
        const rideStart = this.parseTime(assignment.ride.startTime);
        const rideEnd = this.parseTime(assignment.ride.endTime);
        
        const isWithinShift = driver.shifts.some((shift: { startMinutes: number; endMinutes: number }) => 
          rideStart >= shift.startMinutes && rideEnd <= shift.endMinutes
        );
        
        if (!isWithinShift) {
          throw new Error(
            `Assignment of ride ${assignment.ride.id} to driver ${driver.id} is outside driver's shifts`
          );
        }
      }
    }
  }

  /**
   * Assert that a driver can handle a ride
   */
  static assertDriverCanHandleRide(driver: Driver, ride: Ride): void {
    if (driver.vehicleSeats < ride.passengers) {
      throw new Error(
        `Driver ${driver.id} has ${driver.vehicleSeats} seats but ride needs ${ride.passengers}`
      );
    }
    
    const maxPassengers = this.getMaxPassengersForLicense(driver.license);
    if (maxPassengers < ride.passengers) {
      throw new Error(
        `Driver ${driver.id} has ${driver.license} license (max ${maxPassengers}) but ride needs ${ride.passengers}`
      );
    }
  }

  /**
   * Assert that assignments are sorted by ride start time
   */
  static assertAssignmentsSortedByTime(assignments: Assignment[]): void {
    for (let i = 1; i < assignments.length; i++) {
      const prevStart = this.parseTime(assignments[i - 1]!.ride.startTime);
      const currStart = this.parseTime(assignments[i]!.ride.startTime);
      
      if (prevStart > currStart) {
        throw new Error(
          `Assignments not sorted by time: ${assignments[i - 1]!.ride.id} (${assignments[i - 1]!.ride.startTime}) > ${assignments[i]!.ride.id} (${assignments[i]!.ride.startTime})`
        );
      }
    }
  }

  /**
   * Assert that all rides are assigned to feasible drivers
   */
  static assertAllAssignmentsFeasible(assignments: Assignment[]): void {
    for (const assignment of assignments) {
      this.assertValidAssignment(assignment);
      this.assertDriverCanHandleRide(assignment.driver, assignment.ride);
    }
  }

  private static getMaxPassengersForLicense(license: string): number {
    switch (license) {
      case 'B': return 8;
      case 'D1': return 16;
      case 'D': return 50;
      default: return 0;
    }
  }

  private static parseTime(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return (hours ?? 0) * 60 + (minutes ?? 0);
  }
}

// Performance testing helpers
export class PerformanceTestHelpers {
  /**
   * Measure execution time of a function
   */
  static async measureTime<T>(fn: () => Promise<T>): Promise<{ result: T; duration: number }> {
    const start = performance.now();
    const result = await fn();
    const duration = performance.now() - start;
    return { result, duration };
  }

  /**
   * Create a large dataset for performance testing
   */
  static createLargeDataset(driverCount: number = 100, rideCount: number = 200): {
    drivers: Driver[];
    rides: Ride[];
  } {
    const drivers: Driver[] = [];
    const rides: Ride[] = [];

    // Create drivers with varied characteristics
    for (let i = 0; i < driverCount; i++) {
      const fuelCost = 1.5 + Math.random() * 2; // 1.5-3.5
      const license = ['B', 'D1', 'D'][Math.floor(Math.random() * 3)] as 'B' | 'D1' | 'D';
      const seats = license === 'B' ? 8 : license === 'D1' ? 16 : 50;
      
      drivers.push(TestDataFactory.createDriver(`driver${i}`, {
        fuelCost,
        license,
        vehicleSeats: seats,
        location: {
          lat: TEST_LOCATIONS.TEL_AVIV.lat + (Math.random() - 0.5) * 0.1,
          lng: TEST_LOCATIONS.TEL_AVIV.lng + (Math.random() - 0.5) * 0.1,
        },
      }));
    }

    // Create rides with varied characteristics
    for (let i = 0; i < rideCount; i++) {
      const passengers = Math.floor(Math.random() * 20) + 1; // 1-20
      const hour = Math.floor(Math.random() * 12) + 8; // 8-19
      const minute = Math.floor(Math.random() * 60);
      const startTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      const endTime = `${hour.toString().padStart(2, '0')}:${(minute + 30).toString().padStart(2, '0')}`;
      
      rides.push(TestDataFactory.createRide(`ride${i}`, {
        passengers,
        startTime,
        endTime,
        pickup: {
          lat: TEST_LOCATIONS.TEL_AVIV.lat + (Math.random() - 0.5) * 0.1,
          lng: TEST_LOCATIONS.TEL_AVIV.lng + (Math.random() - 0.5) * 0.1,
        },
        dropoff: {
          lat: TEST_LOCATIONS.PETAH_TIKVA.lat + (Math.random() - 0.5) * 0.1,
          lng: TEST_LOCATIONS.PETAH_TIKVA.lng + (Math.random() - 0.5) * 0.1,
        },
      }));
    }

    return { drivers, rides };
  }
}
