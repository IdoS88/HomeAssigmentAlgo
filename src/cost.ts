import type { Driver } from './domain.js';

const SHEKEL_TO_AGOROT = 100;

export function toAgorot(shekels: number): number {
  return Math.round(shekels * SHEKEL_TO_AGOROT);
}

export function fromAgorot(agorot: number): number {
  return agorot / SHEKEL_TO_AGOROT;
}

// 30₪/hour = 50 agorot/minute
export function driverTimeCostAg(minutes: number): number {
  return minutes * 50;
}

export function fuelCostAg(driver: Driver, km: number): number {
  return toAgorot(driver.fuelCost * km);
}

export function sumAg(...amounts: number[]): number {
  return amounts.reduce((sum, amount) => sum + amount, 0);
}
