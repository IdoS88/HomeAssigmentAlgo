import type { ProblemInput } from './strategies/types.js';
import type { Assignment } from './strategy.js';
import { parseDrivers, parseRides } from './domain.js';
import { getFeasibleDrivers } from './constraints.js';
import { driverTimeCostAg, fuelCostAg, sumAg } from './cost.js';
import { parseDateTime } from './domain.js';
import { haversineKm } from './geo.js';

/**
 * Pure function solver for ride assignment problem
 * Takes raw JSON input and returns structured results
 */

export interface SolverResult {
  assignments: Array<{
    driverId: string;
    rideIds: string[];
  }>;
  served: number;
  objective: number;
}

/**
 * Pure function to solve ride assignment problem
 * @param input Raw JSON data containing drivers and rides
 * @returns Structured assignment results
 */
export function solve(input: ProblemInput): SolverResult {
  // Parse input data
  const drivers = parseDrivers(input.drivers);
  const rides = parseRides(input.rides);
  
  // Initialize driver schedules
  const driverSchedules = new Map<string, { 
    lastEndTime: number; 
    lastLocation: { lat: number; lng: number } 
  }>();
  
  drivers.forEach(driver => {
    driverSchedules.set(driver.id, {
      lastEndTime: 0, // Start of day
      lastLocation: driver.location
    });
  });
  
  // Sort rides chronologically
  const sortedRides = [...rides].sort((a, b) => {
    const aStart = parseDateTime(a.date, a.startTime);
    const bStart = parseDateTime(b.date, b.startTime);
    return aStart - bStart;
  });
  
  const assignments: Assignment[] = [];
  
  // Process each ride
  for (const ride of sortedRides) {
    const feasibleDrivers = getFeasibleDrivers(ride, drivers, driverSchedules);
    
    if (feasibleDrivers.length === 0) {
      continue; // Skip unassignable rides
    }
    
    // Find best driver for this ride
    const bestDriver = findBestDriver(ride, feasibleDrivers, driverSchedules);
    const assignment = calculateAssignment(ride, bestDriver);
    
    assignments.push(assignment);
    
    // Update driver schedule
    const schedule = driverSchedules.get(bestDriver.id)!;
    const rideEndTime = parseDateTime(ride.date, ride.endTime);
    schedule.lastEndTime = rideEndTime;
    schedule.lastLocation = ride.dropoff;
  }
  
  // Transform to output format
  const assignmentMap = new Map<string, string[]>();
  
  for (const assignment of assignments) {
    const driverId = assignment.driver.id;
    if (!assignmentMap.has(driverId)) {
      assignmentMap.set(driverId, []);
    }
    assignmentMap.get(driverId)!.push(assignment.ride.id);
  }
  
  const outputAssignments = Array.from(assignmentMap.entries()).map(([driverId, rideIds]) => ({
    driverId,
    rideIds
  }));
  
  return {
    assignments: outputAssignments,
    served: assignments.length,
    objective: assignments.reduce((sum, a) => sum + a.totalCostAg, 0)
  };
}

/**
 * Find the best driver for a ride based on minimum cost
 */
function findBestDriver(
  ride: any,
  feasibleDrivers: any[],
  driverSchedules: Map<string, { lastEndTime: number; lastLocation: { lat: number; lng: number } }>
): any {
  let bestDriver = feasibleDrivers[0]!;
  let bestCost = Number.MAX_SAFE_INTEGER;
  
  for (const driver of feasibleDrivers) {
    const assignment = calculateAssignment(ride, driver);
    if (assignment.totalCostAg < bestCost) {
      bestCost = assignment.totalCostAg;
      bestDriver = driver;
    }
  }
  
  return bestDriver;
}

/**
 * Calculate assignment cost for a driver-ride pair
 */
function calculateAssignment(ride: any, driver: any): Assignment {
  // Calculate loaded metrics (ride distance/time)
  const loadedDistanceKm = haversineKm(
    ride.pickup.lat,
    ride.pickup.lng,
    ride.dropoff.lat,
    ride.dropoff.lng
  );
  const loadedTimeMinutes = parseDateTime(ride.date, ride.endTime) - parseDateTime(ride.date, ride.startTime);
  
  // Calculate loaded cost
  let totalCostAg = sumAg(
    driverTimeCostAg(loadedTimeMinutes),
    fuelCostAg(driver, loadedDistanceKm)
  );
  
  // Calculate deadhead cost (travel to pickup)
  const deadheadDistanceKm = haversineKm(
    driver.location.lat,
    driver.location.lng,
    ride.pickup.lat,
    ride.pickup.lng
  );
  const deadheadTimeMinutes = Math.round(deadheadDistanceKm * 60 / 50); // 50km/h estimate
  
  totalCostAg = sumAg(
    totalCostAg,
    driverTimeCostAg(deadheadTimeMinutes),
    fuelCostAg(driver, deadheadDistanceKm)
  );
  
  return {
    ride,
    driver,
    totalCostAg,
    loadedTimeMinutes,
    loadedDistanceKm,
    deadheadTimeMinutes,
    deadheadDistanceKm
  };
}
