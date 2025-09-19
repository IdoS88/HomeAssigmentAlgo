import type { Assignment, Strategy, StrategyOptions } from '../strategy.js';
import type { Driver, Ride } from '../domain.js';
import { getFeasibleDrivers } from '../constraints.js';
import { haversineKm } from '../geo.js';
import { driverTimeCostAg, fuelCostAg, sumAg } from '../cost.js';
import { parseDateTime } from '../domain.js';
import type { TravelEngine } from '../osrm.js';

// Greedy with ride chaining: pick cheapest driver, enable driver reuse
export class GreedyStrategy implements Strategy {
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

    // Sort by time
    const sortedRides = [...rides].sort((a, b) => {
      const aStart = parseDateTime(a.date, a.startTime);
      const bStart = parseDateTime(b.date, b.startTime);
      return aStart - bStart;
    });

    for (const ride of sortedRides) {
      const rideStartTime = parseDateTime(ride.date, ride.startTime);
      const rideEndTime = parseDateTime(ride.date, ride.endTime);
      
      // Find feasible drivers using centralized constraint checking
      const feasibleDrivers = getFeasibleDrivers(ride, drivers, driverSchedules);

      if (feasibleDrivers.length === 0) {
        continue;
      }

      // Pick cheapest driver considering total cost
      const chosenDriver = await this.findBestDriver(ride, feasibleDrivers, driverSchedules, options);

      const assignment = await this.calculateAssignment(ride, chosenDriver, options);
      assignments.push(assignment);

      // Update driver schedule
      const schedule = driverSchedules.get(chosenDriver.id)!;
      schedule.lastEndTime = rideEndTime;
      schedule.lastLocation = ride.dropoff;
    }

    return assignments;
  }

  private async findBestDriver(
    ride: Ride,
    feasibleDrivers: Driver[],
    driverSchedules: Map<string, { lastEndTime: number; lastLocation: { lat: number; lng: number } }>,
    options: StrategyOptions
  ): Promise<Driver> {
    let bestDriver = feasibleDrivers[0]!;
    let bestCost = Number.MAX_SAFE_INTEGER;

    for (const driver of feasibleDrivers) {
      const assignment = await this.calculateAssignment(ride, driver, options);
      if (assignment.totalCostAg < bestCost) {
        bestCost = assignment.totalCostAg;
        bestDriver = driver;
      }
    }

    return bestDriver;
  }

  private async calculateAssignment(
    ride: Ride,
    driver: Driver,
    options: StrategyOptions
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

    const loadedDistanceKm = loadedMetrics.km;
    const loadedTimeMinutes = loadedMetrics.minutes;

    let totalCostAg = sumAg(
      driverTimeCostAg(loadedTimeMinutes),
      fuelCostAg(driver, loadedDistanceKm),
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
              ) * 60 / 50, // 50km/h estimate
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
      loadedTimeMinutes,
      loadedDistanceKm,
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
