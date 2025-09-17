import { ProblemInput, SolveResult, Strategy } from "./types.js";
import { MinCostFlowStrategy } from "./mincost-legacy.js";
import { parseDrivers, parseRides } from "../domain.js";

export const mincostStrategy: Strategy = {
  name: "mincost",
  async solve(input: ProblemInput): Promise<SolveResult> {
    const t0 = performance.now();
    
    try {
      // Parse the input data
      const drivers = parseDrivers(input.drivers);
      const rides = parseRides(input.rides);
      
      // Create and run the min-cost flow strategy
      const strategy = new MinCostFlowStrategy();
      const assignments = await strategy.assign(rides, drivers);
      
      // Calculate metrics
      const served = assignments.length;
      const objective = assignments.reduce((sum, a) => sum + a.totalCostAg, 0);
      const timeMs = performance.now() - t0;
      
      return { 
        assignments, 
        served, 
        objective, 
        meta: { name: "mincost", timeMs } 
      };
    } catch (error) {
      const timeMs = performance.now() - t0;
      return {
        assignments: [],
        served: 0,
        objective: Number.POSITIVE_INFINITY,
        meta: { name: "mincost (failed)", timeMs }
      };
    }
  }
};
