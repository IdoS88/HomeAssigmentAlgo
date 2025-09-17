import { test, describe } from 'node:test';
import assert from 'node:assert';
import { GreedyStrategy } from './greedy.js';
import { MinCostFlowStrategy } from './minCostFlow.js';
import { parseDrivers, parseRides } from '../domain.js';

describe('Algorithm Comparison', () => {
  test('should compare greedy vs min-cost flow performance', async () => {
    // Sample data for testing
    const driversData = [
      {
        driverId: "driver1",
        firstName: "John",
        lastName: "Doe",
        city: "Tel Aviv",
        mainPhone: "0501111111",
        status: "active",
        licenceDegree: ["B"],
        numberOfSeats: 8,
        fuelCost: 2.0,
        city_coords: [32.0853, 34.7818]
      },
      {
        driverId: "driver2",
        firstName: "Jane",
        lastName: "Smith",
        city: "Jerusalem",
        mainPhone: "0502222222",
        status: "active",
        licenceDegree: ["D"],
        numberOfSeats: 50,
        fuelCost: 3.0,
        city_coords: [31.7683, 35.2137]
      }
    ];

    const ridesData = [
      {
        _id: "ride1",
        date: "2025-03-10",
        startTime: "08:00",
        endTime: "08:30",
        startPoint: "Tel Aviv",
        endPoint: "Jerusalem",
        numberOfSeats: 4,
        startPoint_coords: [32.0853, 34.7818],
        endPoint_coords: [31.7683, 35.2137]
      },
      {
        _id: "ride2",
        date: "2025-03-10",
        startTime: "09:00",
        endTime: "09:30",
        startPoint: "Jerusalem",
        endPoint: "Tel Aviv",
        numberOfSeats: 4,
        startPoint_coords: [31.7683, 35.2137],
        endPoint_coords: [32.0853, 34.7818]
      }
    ];

    const drivers = parseDrivers(driversData);
    const rides = parseRides(ridesData);

    // Test greedy strategy
    const greedyStrategy = new GreedyStrategy();
    const greedyAssignments = await greedyStrategy.assign(rides, drivers, {
      includeDeadheadTime: true,
      includeDeadheadFuel: true,
    });

    // Test min-cost flow strategy
    const minCostStrategy = new MinCostFlowStrategy();
    const minCostAssignments = await minCostStrategy.assign(rides, drivers, {
      includeDeadheadTime: true,
      includeDeadheadFuel: true,
    });

    console.log('Greedy assignments:', greedyAssignments.length);
    console.log('Min-cost flow assignments:', minCostAssignments.length);

    const greedyTotalCost = greedyAssignments.reduce((sum, a) => sum + a.totalCostAg, 0);
    const minCostTotalCost = minCostAssignments.reduce((sum, a) => sum + a.totalCostAg, 0);

    console.log('Greedy total cost:', greedyTotalCost);
    console.log('Min-cost flow total cost:', minCostTotalCost);

    // Min-cost flow should find optimal or better solutions
    assert(minCostAssignments.length >= greedyAssignments.length, 
      'Min-cost flow should assign at least as many rides as greedy');
    
    // Both should assign some rides
    assert(greedyAssignments.length > 0, 'Greedy should assign at least one ride');
    assert(minCostAssignments.length > 0, 'Min-cost flow should assign at least one ride');
  });
});
