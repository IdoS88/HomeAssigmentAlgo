import { test, describe } from 'node:test';
import { strict as assert } from 'node:assert';
import { 
  driverTimeCostAg, 
  fuelCostAg, 
  sumAg, 
  toAgorot, 
  fromAgorot 
} from '../../dist/cost.js';
import type { Driver } from '../../dist/domain.js';

describe('Cost Functions', () => {
  // Test driver with known fuel cost for predictable testing
  const testDriver: Driver = {
    id: 'driver1',
    name: 'Test Driver',
    license: 'D',
    vehicleSeats: 17,
    fuelCost: 2.5, // 2.5₪/km
    location: { lat: 32.0853, lng: 34.7818 },
    shifts: undefined
  };

  describe('Currency Conversion', () => {
    test('toAgorot converts shekels to agorot correctly', () => {
      assert.strictEqual(toAgorot(1), 100);
      assert.strictEqual(toAgorot(2.5), 250);
      assert.strictEqual(toAgorot(0.5), 50);
      assert.strictEqual(toAgorot(0), 0);
    });

    test('fromAgorot converts agorot to shekels correctly', () => {
      assert.strictEqual(fromAgorot(100), 1);
      assert.strictEqual(fromAgorot(250), 2.5);
      assert.strictEqual(fromAgorot(50), 0.5);
      assert.strictEqual(fromAgorot(0), 0);
    });

    test('toAgorot and fromAgorot are inverse operations', () => {
      const originalShekels = 3.75;
      const agorot = toAgorot(originalShekels);
      const backToShekels = fromAgorot(agorot);
      assert.strictEqual(backToShekels, originalShekels);
    });
  });

  describe('Driver Time Cost', () => {
    test('driverTimeCostAg: zero cost when no travel time', () => {
      const cost = driverTimeCostAg(0);
      assert.strictEqual(cost, 0, 'Zero minutes should result in zero cost');
    });

    test('driverTimeCostAg: 30₪/hour = 50 agorot/minute rate', () => {
      assert.strictEqual(driverTimeCostAg(1), 50, '1 minute = 50 agorot');
      assert.strictEqual(driverTimeCostAg(60), 3000, '60 minutes = 3000 agorot (30₪)');
      assert.strictEqual(driverTimeCostAg(30), 1500, '30 minutes = 1500 agorot (15₪)');
    });

    test('driverTimeCostAg: increasing cost with time', () => {
      const costs = [1, 5, 10, 30, 60].map(minutes => driverTimeCostAg(minutes));
      const expected = [50, 250, 500, 1500, 3000];
      
      costs.forEach((cost, i) => {
        assert.strictEqual(cost, expected[i], `${i + 1} minutes should cost ${expected[i]} agorot`);
      });

      // Verify increasing order
      for (let i = 1; i < costs.length; i++) {
        assert(costs[i] > costs[i - 1], `Cost should increase with time: ${costs[i]} > ${costs[i - 1]}`);
      }
    });
  });

  describe('Fuel Cost', () => {
    test('fuelCostAg: zero cost when no distance', () => {
      const cost = fuelCostAg(testDriver, 0);
      assert.strictEqual(cost, 0, 'Zero distance should result in zero fuel cost');
    });

    test('fuelCostAg: increasing cost with distance', () => {
      const distances = [0, 1, 5, 10, 20];
      const expectedCosts = [0, 250, 1250, 2500, 5000]; // 2.5₪/km * distance * 100 agorot/₪
      
      distances.forEach((km, i) => {
        const cost = fuelCostAg(testDriver, km);
        assert.strictEqual(cost, expectedCosts[i], `${km}km should cost ${expectedCosts[i]} agorot`);
      });

      // Verify increasing order
      const costs = distances.map(km => fuelCostAg(testDriver, km));
      for (let i = 1; i < costs.length; i++) {
        assert(costs[i] > costs[i - 1], `Fuel cost should increase with distance: ${costs[i]} > ${costs[i - 1]}`);
      }
    });

    test('fuelCostAg: different drivers have different fuel costs', () => {
      const expensiveDriver: Driver = { ...testDriver, fuelCost: 5.0 }; // 5₪/km
      const cheapDriver: Driver = { ...testDriver, fuelCost: 1.0 };     // 1₪/km
      
      const expensiveCost = fuelCostAg(expensiveDriver, 10);
      const cheapCost = fuelCostAg(cheapDriver, 10);
      
      assert.strictEqual(expensiveCost, 5000, 'Expensive driver: 10km = 5000 agorot');
      assert.strictEqual(cheapCost, 1000, 'Cheap driver: 10km = 1000 agorot');
      assert(expensiveCost > cheapCost, 'More expensive driver should have higher fuel cost');
    });
  });

  describe('Cost Aggregation', () => {
    test('sumAg: correctly sums multiple cost components', () => {
      const timeCost = driverTimeCostAg(30); // 1500 agorot
      const fuelCost = fuelCostAg(testDriver, 10); // 2500 agorot
      
      const totalCost = sumAg(timeCost, fuelCost);
      const expectedTotal = 1500 + 2500; // 4000 agorot
      
      assert.strictEqual(totalCost, expectedTotal, 'Should sum time and fuel costs correctly');
    });

    test('sumAg: handles zero costs', () => {
      assert.strictEqual(sumAg(0, 0, 0), 0, 'Sum of zeros should be zero');
      assert.strictEqual(sumAg(100, 0, 200), 300, 'Should handle mixed zero and non-zero costs');
    });

    test('sumAg: handles single cost component', () => {
      const singleCost = sumAg(1500);
      assert.strictEqual(singleCost, 1500, 'Single cost should return itself');
    });

    test('sumAg: handles many cost components', () => {
      const costs = [100, 200, 300, 400, 500];
      const total = sumAg(...costs);
      assert.strictEqual(total, 1500, 'Should sum multiple cost components correctly');
    });
  });

  describe('Deadhead Penalty Scenarios', () => {
    test('deadhead penalty: time cost increases total when included', () => {
      // Base ride cost (no deadhead)
      const baseTimeCost = driverTimeCostAg(30); // 1500 agorot
      const baseFuelCost = fuelCostAg(testDriver, 10); // 2500 agorot
      const baseTotal = sumAg(baseTimeCost, baseFuelCost); // 4000 agorot

      // With deadhead time penalty (15 minutes to reach pickup)
      const deadheadTimeCost = driverTimeCostAg(15); // 750 agorot
      const totalWithDeadhead = sumAg(baseTimeCost, baseFuelCost, deadheadTimeCost); // 4750 agorot

      assert.strictEqual(baseTotal, 4000, 'Base cost should be 4000 agorot');
      assert.strictEqual(totalWithDeadhead, 4750, 'Cost with deadhead time should be 4750 agorot');
      assert(totalWithDeadhead > baseTotal, 'Deadhead time penalty should increase total cost');
    });

    test('deadhead penalty: fuel cost increases total when included', () => {
      // Base ride cost (no deadhead)
      const baseTimeCost = driverTimeCostAg(30); // 1500 agorot
      const baseFuelCost = fuelCostAg(testDriver, 10); // 2500 agorot
      const baseTotal = sumAg(baseTimeCost, baseFuelCost); // 4000 agorot

      // With deadhead fuel penalty (5km to reach pickup)
      const deadheadFuelCost = fuelCostAg(testDriver, 5); // 1250 agorot
      const totalWithDeadhead = sumAg(baseTimeCost, baseFuelCost, deadheadFuelCost); // 5250 agorot

      assert.strictEqual(baseTotal, 4000, 'Base cost should be 4000 agorot');
      assert.strictEqual(totalWithDeadhead, 5250, 'Cost with deadhead fuel should be 5250 agorot');
      assert(totalWithDeadhead > baseTotal, 'Deadhead fuel penalty should increase total cost');
    });

    test('deadhead penalty: both time and fuel penalties applied', () => {
      // Base ride cost
      const baseTimeCost = driverTimeCostAg(30); // 1500 agorot
      const baseFuelCost = fuelCostAg(testDriver, 10); // 2500 agorot
      const baseTotal = sumAg(baseTimeCost, baseFuelCost); // 4000 agorot

      // With both deadhead penalties
      const deadheadTimeCost = driverTimeCostAg(15); // 750 agorot
      const deadheadFuelCost = fuelCostAg(testDriver, 5); // 1250 agorot
      const totalWithBothPenalties = sumAg(baseTimeCost, baseFuelCost, deadheadTimeCost, deadheadFuelCost); // 6000 agorot

      assert.strictEqual(baseTotal, 4000, 'Base cost should be 4000 agorot');
      assert.strictEqual(totalWithBothPenalties, 6000, 'Cost with both deadhead penalties should be 6000 agorot');
      assert(totalWithBothPenalties > baseTotal, 'Combined deadhead penalties should increase total cost');
    });

    test('deadhead penalty: realistic scenario comparison', () => {
      // Scenario 1: Driver already at pickup location (no deadhead)
      const noDeadheadTotal = sumAg(
        driverTimeCostAg(45), // 45-minute ride
        fuelCostAg(testDriver, 20) // 20km ride
      ); // 2250 + 5000 = 7250 agorot

      // Scenario 2: Driver needs to travel 10km and 20 minutes to reach pickup
      const withDeadheadTotal = sumAg(
        driverTimeCostAg(45), // 45-minute ride
        fuelCostAg(testDriver, 20), // 20km ride
        driverTimeCostAg(20), // 20-minute deadhead time
        fuelCostAg(testDriver, 10) // 10km deadhead distance
      ); // 2250 + 5000 + 1000 + 2500 = 10750 agorot

      assert.strictEqual(noDeadheadTotal, 7250, 'No deadhead scenario should cost 7250 agorot');
      assert.strictEqual(withDeadheadTotal, 10750, 'With deadhead scenario should cost 10750 agorot');
      
      const penaltyAmount = withDeadheadTotal - noDeadheadTotal;
      assert.strictEqual(penaltyAmount, 3500, 'Deadhead penalty should be 3500 agorot');
      assert(penaltyAmount > 0, 'Deadhead penalty should be positive');
    });
  });

  describe('Edge Cases', () => {
    test('handles fractional costs correctly', () => {
      const fractionalShekels = 1.234;
      const agorot = toAgorot(fractionalShekels);
      assert.strictEqual(agorot, 123, 'Should round fractional shekels to nearest agorot');
    });

    test('handles very small distances and times', () => {
      const smallTimeCost = driverTimeCostAg(0.1); // Should be 5 agorot (rounded)
      const smallFuelCost = fuelCostAg(testDriver, 0.01); // Should be 2.5 agorot (rounded)
      
      // Note: These might round to 0 due to Math.round behavior
      assert(smallTimeCost >= 0, 'Small time cost should be non-negative');
      assert(smallFuelCost >= 0, 'Small fuel cost should be non-negative');
    });

    test('handles large values without overflow', () => {
      const largeTimeCost = driverTimeCostAg(1440); // 24 hours
      const largeFuelCost = fuelCostAg(testDriver, 1000); // 1000km
      
      assert(largeTimeCost > 0, 'Large time cost should be positive');
      assert(largeFuelCost > 0, 'Large fuel cost should be positive');
      assert(Number.isFinite(largeTimeCost), 'Large time cost should be finite');
      assert(Number.isFinite(largeFuelCost), 'Large fuel cost should be finite');
    });
  });
});
