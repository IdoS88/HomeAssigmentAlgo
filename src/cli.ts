import { readFileSync, writeFileSync } from "node:fs";
import { basename } from "node:path";
import { autoStrategy } from "./strategies/auto.js";
import { greedyStrategy } from "./strategies/greedy.js";
import { mincostStrategy } from "./strategies/mincost.js";
import { ProblemInput, Strategy, Assignment } from "./strategies/types.js";

function parseArgs(argv: string[]) {
  const args: Record<string, string | boolean> = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a && a.startsWith("--")) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (!next || next.startsWith("--")) args[key] = true;
      else { args[key] = next; i++; }
    }
  }
  return args;
}
const loadJson = (p: string) => JSON.parse(readFileSync(p, "utf8"));

const strategies: Record<string, Strategy> = {
  auto: autoStrategy,
  greedy: greedyStrategy,
  mincost: mincostStrategy
};

async function main() {
  const args = parseArgs(process.argv);
  const driversPath = (args["drivers"] as string) ?? "data/drivers.json";
  const ridesPath   = (args["rides"] as string)   ?? "data/rides.json";
  const strategyKey = (args["strategy"] as string) ?? "auto";
  const outPath     = (args["out"] as string) ?? `out/result-${basename(driversPath)}.json`;

  const input: ProblemInput = {
    drivers: loadJson(driversPath), rides: loadJson(ridesPath)
  };

  const strategy = strategies[strategyKey];
  if (!strategy) {
    console.error(`Unknown strategy "${strategyKey}". Valid: ${Object.keys(strategies).join(", ")}`);
    process.exit(2);
  }

  const result = await strategy.solve(input);
  
  // Transform to expected output format
  const output = {
    assignments: result.assignments.reduce((acc: Array<{driverId: string; rideIds: string[]}>, assignment: Assignment) => {
      const existingDriver = acc.find(a => a.driverId === assignment.driver.id);
      if (existingDriver) {
        existingDriver.rideIds.push(assignment.ride.id);
      } else {
        acc.push({
          driverId: assignment.driver.id,
          rideIds: [assignment.ride.id]
        });
      }
      return acc;
    }, [] as Array<{driverId: string; rideIds: string[]}>),
    totalCost: result.objective
  };

  // Output in expected format
  console.log(JSON.stringify(output, null, 2));

  try {
    writeFileSync(outPath, JSON.stringify(output, null, 2));
    console.error(`Saved to ${outPath}`);
  } catch { /* ignore if out/ missing */ }
}

main().catch(err => { console.error(err); process.exit(1); });