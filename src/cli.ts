#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';
import { parseDrivers, parseRides } from './domain.js';
import { GreedyStrategy } from './strategies/greedy.js';
import { MinCostFlowStrategy } from './strategies/minCostFlow.js';
import type { Strategy } from './strategy.js';
import { fromAgorot } from './cost.js';
import { createTravelEngine } from './osrm.js';

interface CLIOptions {
  drivers: string;
  rides: string;
  strategy: 'greedy' | 'mincost';
  includeDeadheadTime: boolean;
  includeDeadheadFuel: boolean;
  out?: string;
  osrm: boolean;
}

function parseArgs(): CLIOptions {
  const args = process.argv.slice(2);
  const options: Partial<CLIOptions> = {
    strategy: 'greedy',
    includeDeadheadTime: false,
    includeDeadheadFuel: false,
    osrm: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];

    switch (arg) {
      case '--drivers':
        if (!nextArg) {
          throw new Error('--drivers requires a file path');
        }
        options.drivers = nextArg;
        i++;
        break;
      case '--rides':
        if (!nextArg) {
          throw new Error('--rides requires a file path');
        }
        options.rides = nextArg;
        i++;
        break;
      case '--strategy':
        if (!nextArg || !['greedy', 'mincost'].includes(nextArg)) {
          throw new Error('--strategy must be "greedy" or "mincost"');
        }
        options.strategy = nextArg as 'greedy' | 'mincost';
        i++;
        break;
      case '--includeDeadheadTime':
        options.includeDeadheadTime = true;
        break;
      case '--includeDeadheadFuel':
        options.includeDeadheadFuel = true;
        break;
      case '--out':
        if (!nextArg) {
          throw new Error('--out requires a file path');
        }
        options.out = nextArg;
        i++;
        break;
      case '--osrm':
        options.osrm = true;
        break;
      case '--help':
        printHelp();
        process.exit(0);
        break;
      default:
        throw new Error(`Unknown option: ${arg}`);
    }
  }

  if (!options.drivers || !options.rides) {
    throw new Error('--drivers and --rides are required');
  }

  return options as CLIOptions;
}

function printHelp(): void {
  console.log(`
Usage: node cli.js [options]

Options:
  --drivers <file>           Path to drivers JSON file (required)
  --rides <file>             Path to rides JSON file (required)
  --strategy <strategy>      Assignment strategy: greedy|mincost (default: greedy)
  --includeDeadheadTime      Include deadhead time in cost calculation
  --includeDeadheadFuel      Include deadhead fuel cost in calculation
  --out <file>               Output file path (default: stdout)
  --osrm                     Use OSRM for routing (not yet implemented)
  --help                     Show this help message

Examples:
  node cli.js --drivers drivers.json --rides rides.json
  node cli.js --drivers drivers.json --rides rides.json --strategy mincost --includeDeadheadTime
`);
}

function createStrategy(strategyName: string, travelEngine?: any): Strategy {
  switch (strategyName) {
    case 'greedy':
      return new GreedyStrategy(travelEngine);
    case 'mincost':
      return new MinCostFlowStrategy();
    default:
      throw new Error(`Unknown strategy: ${strategyName}`);
  }
}

function formatOutput(assignments: any[]): string {
  const totalCost = assignments.reduce((sum, a) => sum + a.totalCostAg, 0);
  
  return JSON.stringify({
    assignments: assignments.map(a => ({
      rideId: a.ride.id,
      driverId: a.driver.id,
      totalCostShekels: fromAgorot(a.totalCostAg),
      loadedTimeMinutes: a.loadedTimeMinutes,
      loadedDistanceKm: a.loadedDistanceKm,
      deadheadTimeMinutes: a.deadheadTimeMinutes,
      deadheadDistanceKm: a.deadheadDistanceKm,
    })),
    summary: {
      totalAssignments: assignments.length,
      totalCostShekels: fromAgorot(totalCost),
    },
  }, null, 2);
}

async function main(): Promise<void> {
  try {
    const options = parseArgs();

    // Load and parse data
    const driversData = JSON.parse(readFileSync(options.drivers, 'utf-8'));
    const ridesData = JSON.parse(readFileSync(options.rides, 'utf-8'));

    const drivers = parseDrivers(driversData);
    const rides = parseRides(ridesData);

    // Create travel engine
    const travelEngine = createTravelEngine({ useOsrm: options.osrm });

    // Create strategy and run assignment
    const strategy = createStrategy(options.strategy, travelEngine);
    const assignments = await strategy.assign(rides, drivers, {
      includeDeadheadTime: options.includeDeadheadTime,
      includeDeadheadFuel: options.includeDeadheadFuel,
      useOSRM: options.osrm,
    });

    // Output results
    const output = formatOutput(assignments);
    
    if (options.out) {
      writeFileSync(options.out, output, 'utf-8');
      console.log(`Results written to ${options.out}`);
    } else {
      console.log(output);
    }

  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (import.meta.url.endsWith(process.argv[1] ?? '') || import.meta.url.includes('cli.ts')) {
  main();
}
