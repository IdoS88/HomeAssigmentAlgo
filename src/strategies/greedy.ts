import type { Assignment, Strategy, StrategyOptions } from '../strategy.js';
import type { Driver, Ride } from '../domain.js';
import { isRideLegalForDriver } from '../legal.js';
import { haversineKm } from '../geo.js';
import { driverTimeCostAg, fuelCostAg, sumAg } from '../cost.js';
import { parseDateTime } from '../domain.js';
import type { TravelEngine } from '../osrm.js';

// Simple greedy: pick cheapest driver for each ride
export class GreedyStrategy implements Strategy {
  constructor(private travelEngine?: TravelEngine) {}

  async assign(
    rides: Ride[],
    drivers: Driver[],
    options: StrategyOptions = {},
  ): Promise<Assignment[]> {
    const assignments: Assignment[] = [];
    const availableDrivers = [...drivers];

    // Sort by time
    const sortedRides = [...rides].sort((a, b) => {
      const aStart = parseDateTime(a.date, a.startTime);
      const bStart = parseDateTime(b.date, b.startTime);
      return aStart - bStart;
    });

    for (const ride of sortedRides) {
      const feasibleDrivers = availableDrivers.filter(driver =>
        isRideLegalForDriver(ride, driver),
      );

      if (feasibleDrivers.length === 0) {
        continue;
      }

      // Pick cheapest driver
      const chosenDriver = feasibleDrivers.sort((a, b) => {
        if (a.fuelCost !== b.fuelCost) {
          return a.fuelCost - b.fuelCost;
        }
        return a.id.localeCompare(b.id);
      })[0]!;

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
        fuelCostAg(chosenDriver, loadedDistanceKm),
      );

      let deadheadTimeMinutes: number | undefined;
      let deadheadDistanceKm: number | undefined;

      if (options.includeDeadheadTime || options.includeDeadheadFuel) {
        const deadheadMetrics = this.travelEngine
          ? await this.travelEngine(
              chosenDriver.location.lat,
              chosenDriver.location.lng,
              ride.pickup.lat,
              ride.pickup.lng,
            )
          : {
              km: haversineKm(
                chosenDriver.location.lat,
                chosenDriver.location.lng,
                ride.pickup.lat,
                ride.pickup.lng,
              ),
              minutes: Math.round(
                haversineKm(
                  chosenDriver.location.lat,
                  chosenDriver.location.lng,
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
          totalCostAg = sumAg(totalCostAg, fuelCostAg(chosenDriver, deadheadDistanceKm));
        }
      }

      const assignment: Assignment = {
        ride,
        driver: chosenDriver,
        totalCostAg,
        loadedTimeMinutes,
        loadedDistanceKm,
        ...(deadheadTimeMinutes !== undefined && { deadheadTimeMinutes }),
        ...(deadheadDistanceKm !== undefined && { deadheadDistanceKm }),
      };

      assignments.push(assignment);

      const driverIndex = availableDrivers.findIndex(d => d.id === chosenDriver.id);
      if (driverIndex !== -1) {
        availableDrivers.splice(driverIndex, 1);
      }
    }

    return assignments;
  }
}
