import type { Driver, Ride } from './domain.js';

// Israel license legality rules
const LICENSE_PASSENGER_LIMITS = {
  B: 8,   // B license: up to 8 passengers
  D1: 16, // D1 license: up to 16 passengers
  D: 17,  // D license: 17+ passengers
} as const;

/**
 * Check if a driver can drive (has valid license and vehicle capacity)
 */
export function canDrive(driver: Driver): boolean {
  const maxPassengers = LICENSE_PASSENGER_LIMITS[driver.license];
  return driver.vehicleSeats >= maxPassengers;
}

/**
 * Check if a ride is legal for a specific driver
 * - Driver must have appropriate license for passenger count
 * - Vehicle must have enough seats
 */
export function isRideLegalForDriver(ride: Ride, driver: Driver): boolean {
  // Check license capacity
  const maxPassengers = LICENSE_PASSENGER_LIMITS[driver.license];
  if (ride.passengers > maxPassengers) {
    return false;
  }

  // Check vehicle capacity
  if (ride.passengers > driver.vehicleSeats) {
    return false;
  }

  return true;
}
