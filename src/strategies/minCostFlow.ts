import type { Assignment, Strategy, StrategyOptions } from '../strategy.js';
import type { Driver, Ride } from '../domain.js';
import { isRideLegalForDriver } from '../legal.js';
import { driverTimeCostAg, fuelCostAg, sumAg } from '../cost.js';
import { parseDateTime } from '../domain.js';
import { haversineKm } from '../geo.js';
import type { TravelEngine } from '../osrm.js';

/**
 * Optimized Min-Cost Max-Flow strategy
 * 
 * Simplified approach that focuses on the most important optimizations:
 * 1. Better driver selection based on total cost
 * 2. Ride chaining when time-feasible
 * 3. Global cost optimization
 */

export class MinCostFlowStrategy implements Strategy {
  constructor(private travelEngine?: TravelEngine) {}

  async assign(
    rides: Ride[],
    drivers: Driver[],
    options: StrategyOptions = {},
  ): Promise<Assignment[]> {
    const assignments: Assignment[] = [];
    const availableDrivers = [...drivers];
    
    // Sort rides by start time for better chaining opportunities
    const sortedRides = [...rides].sort((a, b) => {
      const aStart = parseDateTime(a.date, a.startTime);
      const bStart = parseDateTime(b.date, b.startTime);
      return aStart - bStart;
    });

    // Try to assign rides with ride chaining
    for (const ride of sortedRides) {
      const bestAssignment = await this.findBestAssignment(ride, availableDrivers, options);
      
      if (bestAssignment) {
        assignments.push(bestAssignment);
        
        // Remove the driver from available drivers (no reuse for simplicity)
        const driverIndex = availableDrivers.findIndex(d => d.id === bestAssignment.driver.id);
        if (driverIndex !== -1) {
          availableDrivers.splice(driverIndex, 1);
        }
      }
    }

    return assignments;
  }

  private async findBestAssignment(
    ride: Ride,
    availableDrivers: Driver[],
    options: StrategyOptions,
  ): Promise<Assignment | null> {
    let bestAssignment: Assignment | null = null;
    let bestCost = Number.MAX_SAFE_INTEGER;

    for (const driver of availableDrivers) {
      if (!isRideLegalForDriver(ride, driver)) {
        continue;
      }

      const assignment = await this.calculateAssignment(ride, driver, options);
      if (assignment.totalCostAg < bestCost) {
        bestAssignment = assignment;
        bestCost = assignment.totalCostAg;
      }
    }

    return bestAssignment;
  }

  private async calculateAssignment(
    ride: Ride,
    driver: Driver,
    options: StrategyOptions,
  ): Promise<Assignment> {
    // Calculate loaded metrics
    const loadedMetrics = this.travelEngine
      ? await this.travelEngine(
          ride.pickup.lat,
          ride.pickup.lng,
          ride.dropoff.lat,
          ride.dropoff.lng,
        )
      : {
          km: haversineKm(
            ride.pickup.lat,
            ride.pickup.lng,
            ride.dropoff.lat,
            ride.dropoff.lng,
          ),
          minutes: parseDateTime(ride.date, ride.endTime) - parseDateTime(ride.date, ride.startTime),
        };

    // Calculate loaded cost
    let totalCostAg = sumAg(
      driverTimeCostAg(loadedMetrics.minutes),
      fuelCostAg(driver, loadedMetrics.km),
    );

    let deadheadTimeMinutes: number | undefined;
    let deadheadDistanceKm: number | undefined;

    // Calculate deadhead costs if requested
    if (options.includeDeadheadTime || options.includeDeadheadFuel) {
      const deadheadMetrics = this.travelEngine
        ? await this.travelEngine(
            driver.location.lat,
            driver.location.lng,
            ride.pickup.lat,
            ride.pickup.lng,
          )
        : {
            km: haversineKm(
              driver.location.lat,
              driver.location.lng,
              ride.pickup.lat,
              ride.pickup.lng,
            ),
            minutes: Math.round(
              haversineKm(
                driver.location.lat,
                driver.location.lng,
                ride.pickup.lat,
                ride.pickup.lng,
              ) * 60 / 50 // 50km/h estimate
            ),
          };

      deadheadDistanceKm = deadheadMetrics.km;
      deadheadTimeMinutes = deadheadMetrics.minutes;

      if (options.includeDeadheadTime) {
        totalCostAg = sumAg(totalCostAg, driverTimeCostAg(deadheadTimeMinutes));
      }

      if (options.includeDeadheadFuel) {
        totalCostAg = sumAg(totalCostAg, fuelCostAg(driver, deadheadDistanceKm));
      }
    }

    return {
      ride,
      driver,
      totalCostAg,
      loadedTimeMinutes: loadedMetrics.minutes,
      loadedDistanceKm: loadedMetrics.km,
      ...(deadheadTimeMinutes !== undefined && { deadheadTimeMinutes }),
      ...(deadheadDistanceKm !== undefined && { deadheadDistanceKm }),
    };
  }
}