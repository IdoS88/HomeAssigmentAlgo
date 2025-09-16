import type { Assignment, Strategy, StrategyOptions } from '../strategy.js';
import type { Driver, Ride } from '../domain.js';
import { isRideLegalForDriver } from '../legal.js';
import { haversineKm } from '../geo.js';
import { driverTimeCostAg, fuelCostAg, sumAg } from '../cost.js';
import { parseDateTime } from '../domain.js';

/**
 * Greedy baseline strategy:
 * 1. Sort rides by start time
 * 2. For each ride, find feasible drivers
 * 3. Choose driver with lowest fuelCost (tie-breaker: stable IDs)
 */
export class GreedyStrategy implements Strategy {
  assign(
    rides: Ride[],
    drivers: Driver[],
    options: StrategyOptions = {},
  ): Assignment[] {
    const assignments: Assignment[] = [];
    const availableDrivers = [...drivers];

    // Sort rides by start time
    const sortedRides = [...rides].sort((a, b) => {
      const aStart = parseDateTime(a.date, a.startTime);
      const bStart = parseDateTime(b.date, b.startTime);
      return aStart - bStart;
    });

    for (const ride of sortedRides) {
      // Find feasible drivers (legal + available)
      const feasibleDrivers = availableDrivers.filter(driver =>
        isRideLegalForDriver(ride, driver),
      );

      if (feasibleDrivers.length === 0) {
        // No feasible driver found - skip this ride
        continue;
      }

      // Choose driver with lowest fuelCost, then by ID for stability
      const chosenDriver = feasibleDrivers.sort((a, b) => {
        if (a.fuelCost !== b.fuelCost) {
          return a.fuelCost - b.fuelCost;
        }
        return a.id.localeCompare(b.id);
      })[0];

      // Calculate costs
      const loadedDistanceKm = haversineKm(
        ride.pickup.lat,
        ride.pickup.lng,
        ride.dropoff.lat,
        ride.dropoff.lng,
      );

      const loadedTimeMinutes = parseDateTime(ride.date, ride.endTime) -
        parseDateTime(ride.date, ride.startTime);

      let totalCostAg = sumAg(
        driverTimeCostAg(loadedTimeMinutes),
        fuelCostAg(chosenDriver, loadedDistanceKm),
      );

      let deadheadTimeMinutes: number | undefined;
      let deadheadDistanceKm: number | undefined;

      if (options.includeDeadheadTime || options.includeDeadheadFuel) {
        deadheadDistanceKm = haversineKm(
          chosenDriver.location.lat,
          chosenDriver.location.lng,
          ride.pickup.lat,
          ride.pickup.lng,
        );

        // Rough estimate: assume 50km/h for deadhead
        deadheadTimeMinutes = Math.round(deadheadDistanceKm * 60 / 50);

        if (options.includeDeadheadTime) {
          totalCostAg = sumAg(totalCostAg, driverTimeCostAg(deadheadTimeMinutes));
        }

        if (options.includeDeadheadFuel) {
          totalCostAg = sumAg(totalCostAg, fuelCostAg(chosenDriver, deadheadDistanceKm));
        }
      }

      // Create assignment
      const assignment: Assignment = {
        ride,
        driver: chosenDriver,
        totalCostAg,
        loadedTimeMinutes,
        loadedDistanceKm,
        deadheadTimeMinutes,
        deadheadDistanceKm,
      };

      assignments.push(assignment);

      // Remove chosen driver from available drivers
      const driverIndex = availableDrivers.findIndex(d => d.id === chosenDriver.id);
      if (driverIndex !== -1) {
        availableDrivers.splice(driverIndex, 1);
      }
    }

    return assignments;
  }
}
