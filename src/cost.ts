import type { Driver } from './domain.js';

// Money handling with integer agorot (1₪ = 100 agorot)
const SHEKEL_TO_AGOROT = 100;

/**
 * Convert shekels to agorot (integer)
 */
export function toAgorot(shekels: number): number {
  return Math.round(shekels * SHEKEL_TO_AGOROT);
}

/**
 * Convert agorot to shekels
 */
export function fromAgorot(agorot: number): number {
  return agorot / SHEKEL_TO_AGOROT;
}

/**
 * Calculate driver time cost in agorot
 * Rate: 30₪/hour = 3000 agorot/hour = 50 agorot/minute
 */
export function driverTimeCostAg(minutes: number): number {
  const RATE_AGOROT_PER_MINUTE = 50; // 30₪/hour = 50 agorot/minute
  return minutes * RATE_AGOROT_PER_MINUTE;
}

/**
 * Calculate fuel cost in agorot
 * Cost: driver.fuelCost ₪/km
 */
export function fuelCostAg(driver: Driver, kilometers: number): number {
  return toAgorot(driver.fuelCost * kilometers);
}

/**
 * Sum multiple agorot values
 */
export function sumAg(...amounts: number[]): number {
  return amounts.reduce((sum, amount) => sum + amount, 0);
}
