import type { Assignment, Strategy, StrategyOptions } from '../strategy.js';
import type { Driver, Ride } from '../domain.js';
import { isRideLegalForDriver } from '../legal.js';
import { driverTimeCostAg, fuelCostAg, sumAg } from '../cost.js';
import { parseDateTime, isDriverAvailableForRide } from '../domain.js';
import { haversineKm } from '../geo.js';
import type { TravelEngine } from '../osrm.js';

// Optimal with ride chaining - finds best assignments, enables driver reuse
export class MinCostFlowStrategy implements Strategy {
  constructor(private travelEngine?: TravelEngine) {}

  async assign(
    rides: Ride[],
    drivers: Driver[],
    options: StrategyOptions = {},
  ): Promise<Assignment[]> {
    const assignments: Assignment[] = [];
    const driverSchedules = new Map<string, { lastEndTime: number; lastLocation: { lat: number; lng: number } }>();

    // Initialize driver schedules with their starting locations
    drivers.forEach(driver => {
      driverSchedules.set(driver.id, {
        lastEndTime: 0, // Start of day
        lastLocation: driver.location
      });
    });
    
    const sortedRides = [...rides].sort((a, b) => {
      const aStart = parseDateTime(a.date, a.startTime);
      const bStart = parseDateTime(b.date, b.startTime);
      return aStart - bStart;
    });

    for (const ride of sortedRides) {
      const rideStartTime = parseDateTime(ride.date, ride.startTime);
      const rideEndTime = parseDateTime(ride.date, ride.endTime);
      
      // Find feasible drivers (legal + available + can reach pickup in time + within shifts)
      const feasibleDrivers = drivers.filter(driver => {
        if (!isRideLegalForDriver(ride, driver)) return false;
        
        const schedule = driverSchedules.get(driver.id)!;
        const timeToReach = this.calculateTravelTime(schedule.lastLocation, ride.pickup);
        const arrivalTime = schedule.lastEndTime + timeToReach;
        
        // Can reach pickup before ride starts
        if (arrivalTime > rideStartTime) return false;
        
        // Check if driver is available within their shifts
        return isDriverAvailableForRide(driver, rideStartTime, rideEndTime, timeToReach);
      });

      if (feasibleDrivers.length === 0) {
        continue;
      }

      const bestAssignment = await this.findBestAssignment(ride, feasibleDrivers, options);
      
      if (bestAssignment) {
        assignments.push(bestAssignment);
        
        // Update driver schedule
        const schedule = driverSchedules.get(bestAssignment.driver.id)!;
        schedule.lastEndTime = rideEndTime;
        schedule.lastLocation = ride.dropoff;
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

    let totalCostAg = sumAg(
      driverTimeCostAg(loadedMetrics.minutes),
      fuelCostAg(driver, loadedMetrics.km),
    );

    let deadheadTimeMinutes: number | undefined;
    let deadheadDistanceKm: number | undefined;

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

  private calculateTravelTime(from: { lat: number; lng: number }, to: { lat: number; lng: number }): number {
    // Simple estimation: 50km/h average speed
    const distance = haversineKm(from.lat, from.lng, to.lat, to.lng);
    return Math.round(distance * 60 / 50); // Convert to minutes
  }
}
