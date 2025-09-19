import type { Assignment, Strategy, StrategyOptions } from '../strategy.js';
import type { Driver, Ride } from '../domain.js';
import { getFeasibleDrivers } from '../constraints.js';
import { haversineKm } from '../geo.js';
import { driverTimeCostAg, fuelCostAg, sumAg } from '../cost.js';
import { parseDateTime } from '../domain.js';
import type { TravelEngine } from '../osrm.js';

/**
 * Greedy strategy with detailed decision tracing for debugging and analysis
 */
export class GreedyTraceStrategy implements Strategy {
  private traceEnabled = false;
  private stepCount = 0;

  constructor(private travelEngine?: TravelEngine, traceEnabled = false) {
    this.traceEnabled = traceEnabled;
  }

  async assign(
    rides: Ride[],
    drivers: Driver[],
    options: StrategyOptions = {},
  ): Promise<Assignment[]> {
    this.traceEnabled = true;
    this.stepCount = 0;
    
    console.log('\n🚀 GREEDY STRATEGY DECISION TRACE');
    console.log('=====================================');
    console.log(`📊 Dataset: ${rides.length} rides, ${drivers.length} drivers`);
    console.log(`⚙️  Options:`, options);
    console.log('');

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

    console.log('📅 RIDES IN CHRONOLOGICAL ORDER:');
    sortedRides.forEach((ride, i) => {
      console.log(`  ${i + 1}. ${ride.id} (${ride.startTime}-${ride.endTime}) ${ride.passengers} passengers`);
    });
    console.log('');

    for (const ride of sortedRides) {
      this.stepCount++;
      const rideStartTime = parseDateTime(ride.date, ride.startTime);
      const rideEndTime = parseDateTime(ride.date, ride.endTime);
      
      console.log(`\n🎯 STEP ${this.stepCount}: Processing ride ${ride.id}`);
      console.log('─'.repeat(50));
      console.log(`📋 Ride Details:`);
      console.log(`   ID: ${ride.id}`);
      console.log(`   Time: ${ride.startTime} - ${ride.endTime} (${rideEndTime - rideStartTime} min)`);
      console.log(`   Passengers: ${ride.passengers}`);
      console.log(`   Pickup: (${ride.pickup.lat.toFixed(4)}, ${ride.pickup.lng.toFixed(4)})`);
      console.log(`   Dropoff: (${ride.dropoff.lat.toFixed(4)}, ${ride.dropoff.lng.toFixed(4)})`);
      
      // Find feasible drivers using centralized constraint checking
      const feasibleDrivers = getFeasibleDrivers(ride, drivers, driverSchedules);
      
      console.log(`\n🔍 FEASIBLE DRIVERS: ${feasibleDrivers.length}/${drivers.length}`);
      if (feasibleDrivers.length === 0) {
        console.log('❌ No feasible drivers found - skipping ride');
        continue;
      }

      // Show candidate drivers and their current status
      console.log('\n👥 CANDIDATE DRIVERS:');
      feasibleDrivers.forEach((driver, i) => {
        const schedule = driverSchedules.get(driver.id)!;
        const timeToReach = this.calculateTravelTime(schedule.lastLocation, ride.pickup);
        const arrivalTime = schedule.lastEndTime + timeToReach;
        
        console.log(`   ${i + 1}. ${driver.id} (${driver.name})`);
        console.log(`      License: ${driver.license}, Seats: ${driver.vehicleSeats}, Fuel: ${driver.fuelCost}₪/km`);
        console.log(`      Current location: (${schedule.lastLocation.lat.toFixed(4)}, ${schedule.lastLocation.lng.toFixed(4)})`);
        console.log(`      Last end time: ${schedule.lastEndTime} min`);
        console.log(`      Travel time to pickup: ${timeToReach} min`);
        console.log(`      Arrival time: ${arrivalTime} min (deadline: ${rideStartTime} min)`);
        console.log('');
      });

      // Pick cheapest driver considering total cost
      console.log('💰 COST CALCULATION:');
      const chosenDriver = await this.findBestDriverWithTrace(ride, feasibleDrivers, driverSchedules, options);

      const assignment = await this.calculateAssignment(ride, chosenDriver, options);
      assignments.push(assignment);

      console.log(`\n🏆 WINNER: ${chosenDriver.id} (${chosenDriver.name})`);
      console.log(`   Total cost: ${assignment.totalCostAg} agorot (${(assignment.totalCostAg / 100).toFixed(2)}₪)`);
      console.log(`   Loaded time: ${assignment.loadedTimeMinutes} min`);
      console.log(`   Loaded distance: ${assignment.loadedDistanceKm.toFixed(2)} km`);
      if (assignment.deadheadTimeMinutes) {
        console.log(`   Deadhead time: ${assignment.deadheadTimeMinutes} min`);
        console.log(`   Deadhead distance: ${assignment.deadheadDistanceKm?.toFixed(2)} km`);
      }

      // Update driver schedule
      const schedule = driverSchedules.get(chosenDriver.id)!;
      schedule.lastEndTime = rideEndTime;
      schedule.lastLocation = ride.dropoff;
      
      console.log(`   Updated schedule: end time ${rideEndTime} min, location (${ride.dropoff.lat.toFixed(4)}, ${ride.dropoff.lng.toFixed(4)})`);
    }

    console.log('\n✅ GREEDY STRATEGY COMPLETE');
    console.log('============================');
    console.log(`📈 Results: ${assignments.length}/${rides.length} rides assigned`);
    console.log(`💰 Total cost: ${assignments.reduce((sum, a) => sum + a.totalCostAg, 0)} agorot`);
    console.log('');

    return assignments;
  }

  private async findBestDriverWithTrace(
    ride: Ride,
    feasibleDrivers: Driver[],
    driverSchedules: Map<string, { lastEndTime: number; lastLocation: { lat: number; lng: number } }>,
    options: StrategyOptions
  ): Promise<Driver> {
    let bestDriver = feasibleDrivers[0]!;
    let bestCost = Number.MAX_SAFE_INTEGER;

    console.log('   Driver ID    | Loaded Cost | Deadhead Cost | Total Cost | Winner');
    console.log('   -------------|-------------|---------------|------------|-------');

    for (const driver of feasibleDrivers) {
      const assignment = await this.calculateAssignment(ride, driver, options);
      const loadedCost = driverTimeCostAg(assignment.loadedTimeMinutes) + fuelCostAg(driver, assignment.loadedDistanceKm);
      const deadheadCost = assignment.totalCostAg - loadedCost;
      
      const isWinner = assignment.totalCostAg < bestCost;
      if (isWinner) {
        bestCost = assignment.totalCostAg;
        bestDriver = driver;
      }

      const winnerMark = isWinner ? '🏆' : '  ';
      console.log(`   ${driver.id.padEnd(12)} | ${(loadedCost/100).toFixed(2).padStart(10)}₪ | ${(deadheadCost/100).toFixed(2).padStart(12)}₪ | ${(assignment.totalCostAg/100).toFixed(2).padStart(9)}₪ | ${winnerMark}`);

      // Detailed cost breakdown for winner
      if (isWinner) {
        console.log(`\n   💡 Cost breakdown for winner ${driver.id}:`);
        console.log(`      Loaded time cost: ${driverTimeCostAg(assignment.loadedTimeMinutes)} agorot (${assignment.loadedTimeMinutes} min × 50 agorot/min)`);
        console.log(`      Loaded fuel cost: ${fuelCostAg(driver, assignment.loadedDistanceKm)} agorot (${assignment.loadedDistanceKm.toFixed(2)} km × ${driver.fuelCost}₪/km)`);
        if (assignment.deadheadTimeMinutes) {
          console.log(`      Deadhead time cost: ${driverTimeCostAg(assignment.deadheadTimeMinutes)} agorot (${assignment.deadheadTimeMinutes} min × 50 agorot/min)`);
          console.log(`      Deadhead fuel cost: ${fuelCostAg(driver, assignment.deadheadDistanceKm!)} agorot (${assignment.deadheadDistanceKm?.toFixed(2)} km × ${driver.fuelCost}₪/km)`);
        }
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
    return Math.round(distance * 60 / 50);
  }
}
