import type { Driver, Ride } from './domain.js';
import { isRideLegalForDriver } from './legal.js';
import { isDriverAvailableForRide } from './domain.js';
import { haversineKm } from './geo.js';

/**
 * Centralized constraint checking system for ride assignments
 * Consolidates all validation logic: legal, capacity, time windows, and deadhead constraints
 */

export interface ConstraintViolation {
  type: 'legal' | 'capacity' | 'time_window' | 'deadhead' | 'shift';
  message: string;
  driverId: string;
  rideId: string;
}

export interface ConstraintResult {
  isFeasible: boolean;
  violations: ConstraintViolation[];
}

/**
 * Calculate travel time between two locations (simplified estimation)
 * Used for deadhead time calculations
 */
function calculateTravelTime(from: { lat: number; lng: number }, to: { lat: number; lng: number }): number {
  // Simple estimation: 50km/h average speed
  const distance = haversineKm(from.lat, from.lng, to.lat, to.lng);
  return Math.round(distance * 60 / 50); // Convert to minutes
}

/**
 * Check if a driver can legally serve a ride (license and capacity constraints)
 */
export function checkLegalConstraints(ride: Ride, driver: Driver): ConstraintResult {
  const violations: ConstraintViolation[] = [];
  
  if (!isRideLegalForDriver(ride, driver)) {
    violations.push({
      type: 'legal',
      message: `Driver ${driver.id} cannot legally serve ${ride.passengers} passengers (license: ${driver.license}, vehicle seats: ${driver.vehicleSeats})`,
      driverId: driver.id,
      rideId: ride.id
    });
  }
  
  return {
    isFeasible: violations.length === 0,
    violations
  };
}

/**
 * Check if a driver can reach the pickup location in time
 */
export function checkDeadheadConstraints(
  ride: Ride, 
  driver: Driver, 
  driverLastLocation: { lat: number; lng: number },
  driverLastEndTime: number
): ConstraintResult {
  const violations: ConstraintViolation[] = [];
  
  const timeToReach = calculateTravelTime(driverLastLocation, ride.pickup);
  const arrivalTime = driverLastEndTime + timeToReach;
  const rideStartTime = parseDateTime(ride.date, ride.startTime);
  
  if (arrivalTime > rideStartTime) {
    violations.push({
      type: 'deadhead',
      message: `Driver ${driver.id} cannot reach pickup in time (arrival: ${arrivalTime}, ride start: ${rideStartTime})`,
      driverId: driver.id,
      rideId: ride.id
    });
  }
  
  return {
    isFeasible: violations.length === 0,
    violations
  };
}

/**
 * Check if a driver is available during the ride time window (shift constraints)
 */
export function checkShiftConstraints(
  ride: Ride,
  driver: Driver,
  deadheadTimeMinutes: number
): ConstraintResult {
  const violations: ConstraintViolation[] = [];
  
  const rideStartTime = parseDateTime(ride.date, ride.startTime);
  const rideEndTime = parseDateTime(ride.date, ride.endTime);
  
  if (!isDriverAvailableForRide(driver, rideStartTime, rideEndTime, deadheadTimeMinutes)) {
    violations.push({
      type: 'shift',
      message: `Driver ${driver.id} is not available during ride time window (${ride.startTime}-${ride.endTime}) including deadhead time`,
      driverId: driver.id,
      rideId: ride.id
    });
  }
  
  return {
    isFeasible: violations.length === 0,
    violations
  };
}

/**
 * Comprehensive constraint check for a driver-ride assignment
 * Combines all constraint types into a single validation
 */
export function checkAllConstraints(
  ride: Ride,
  driver: Driver,
  driverLastLocation: { lat: number; lng: number },
  driverLastEndTime: number
): ConstraintResult {
  const allViolations: ConstraintViolation[] = [];
  
  // Check legal constraints (license and capacity)
  const legalResult = checkLegalConstraints(ride, driver);
  allViolations.push(...legalResult.violations);
  
  // Check deadhead constraints (can reach pickup in time)
  const deadheadResult = checkDeadheadConstraints(ride, driver, driverLastLocation, driverLastEndTime);
  allViolations.push(...deadheadResult.violations);
  
  // Check shift constraints (available during ride time)
  const timeToReach = calculateTravelTime(driverLastLocation, ride.pickup);
  const shiftResult = checkShiftConstraints(ride, driver, timeToReach);
  allViolations.push(...shiftResult.violations);
  
  return {
    isFeasible: allViolations.length === 0,
    violations: allViolations
  };
}

/**
 * Filter drivers to only those that can feasibly serve a ride
 * Centralized version of the driver filtering logic used in both strategies
 */
export function getFeasibleDrivers(
  ride: Ride,
  drivers: Driver[],
  driverSchedules: Map<string, { lastEndTime: number; lastLocation: { lat: number; lng: number } }>
): Driver[] {
  return drivers.filter(driver => {
    const schedule = driverSchedules.get(driver.id);
    if (!schedule) return false;
    
    const result = checkAllConstraints(ride, driver, schedule.lastLocation, schedule.lastEndTime);
    return result.isFeasible;
  });
}

/**
 * Validate that all assignments in a solution respect all constraints
 * Useful for testing and solution verification
 */
export function validateAllAssignments(assignments: Array<{ ride: Ride; driver: Driver }>): ConstraintResult {
  const allViolations: ConstraintViolation[] = [];
  
  for (const assignment of assignments) {
    // For validation, assume driver starts from their home location
    const result = checkAllConstraints(
      assignment.ride,
      assignment.driver,
      assignment.driver.location,
      0 // Start of day
    );
    
    allViolations.push(...result.violations);
  }
  
  return {
    isFeasible: allViolations.length === 0,
    violations: allViolations
  };
}

/**
 * Helper function to parse date and time to minutes since day start
 * Duplicated from domain.ts to avoid circular imports
 */
function parseDateTime(date: string, time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return (hours ?? 0) * 60 + (minutes ?? 0);
}
