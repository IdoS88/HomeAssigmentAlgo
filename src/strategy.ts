import type { Driver, Ride } from './domain.js';

export interface Assignment {
  ride: Ride;
  driver: Driver;
  totalCostAg: number;
  loadedTimeMinutes: number;
  loadedDistanceKm: number;
  deadheadTimeMinutes?: number;
  deadheadDistanceKm?: number;
}

export interface Strategy {
  assign(
    rides: Ride[],
    drivers: Driver[],
    options?: StrategyOptions,
  ): Assignment[] | Promise<Assignment[]>;
}

export interface StrategyOptions {
  includeDeadheadTime?: boolean;
  includeDeadheadFuel?: boolean;
  useOSRM?: boolean;
}
