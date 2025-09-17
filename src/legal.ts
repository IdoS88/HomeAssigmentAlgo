import type { Driver, Ride } from './domain.js';

const LICENSE_LIMITS = {
  B: 8,
  D1: 16,
  D: 17,
} as const;

export function canDrive(driver: Driver): boolean {
  const max = LICENSE_LIMITS[driver.license];
  return driver.vehicleSeats >= max;
}

export function isRideLegalForDriver(ride: Ride, driver: Driver): boolean {
  const max = LICENSE_LIMITS[driver.license];
  if (ride.passengers > max) return false;
  if (ride.passengers > driver.vehicleSeats) return false;
  return true;
}
