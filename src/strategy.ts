import type { Driver, Ride } from './domain.js';

/**
 * Assignment of a ride to a driver
 */
export interface Assignment {
  ride: Ride;
  driver: Driver;
  totalCostAg: number; // Total cost in agorot
  loadedTimeMinutes: number; // Time for the actual ride
  loadedDistanceKm: number; // Distance for the actual ride
  deadheadTimeMinutes?: number; // Time to get to pickup (if included)
  deadheadDistanceKm?: number; // Distance to get to pickup (if included)
}

/**
 * Strategy interface for ride assignment algorithms
 */
export interface Strategy {
  /**
   * Assign rides to drivers using the strategy
   * @param rides Array of rides to assign
   * @param drivers Array of available drivers
   * @param options Strategy-specific options
   * @returns Array of assignments
   */
  assign(
    rides: Ride[],
    drivers: Driver[],
    options?: StrategyOptions,
  ): Assignment[];
}

/**
 * Options for strategy execution
 */
export interface StrategyOptions {
  includeDeadheadTime?: boolean;
  includeDeadheadFuel?: boolean;
  useOSRM?: boolean;
}
