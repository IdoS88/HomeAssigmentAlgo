import { Strategy, ProblemInput, SolveResult } from "./types.js";
import { greedyStrategy } from "./greedy.js";
import { mincostStrategy } from "./mincost.js";

const candidates: Strategy[] = [mincostStrategy, greedyStrategy];

/**
 * Compare two solve results using the priority:
 * 1. served DESC (more rides served is better)
 * 2. objective ASC (lower cost is better) 
 * 3. time ASC (faster execution is better)
 */
function better(a: SolveResult, b: SolveResult): boolean {
  // Priority 1: More rides served is better
  if (a.served !== b.served) return a.served > b.served;
  
  // Priority 2: Lower objective cost is better
  if (a.objective !== b.objective) return a.objective < b.objective;
  
  // Priority 3: Faster execution is better
  return a.meta.timeMs < b.meta.timeMs;
}

/**
 * Auto strategy that runs multiple algorithms and picks the best result
 * Each algorithm gets a 5-second budget to complete
 */
export const autoStrategy: Strategy = {
  name: "auto",
  async solve(input: ProblemInput): Promise<SolveResult> {
    const perCandidateBudget = 5000; // 5 seconds per algorithm
    const results: SolveResult[] = [];
    let best: SolveResult | null = null;

    console.log(`🚀 Auto Strategy: Running ${candidates.length} algorithms with ${perCandidateBudget}ms budget each`);
    console.log('─'.repeat(60));

    for (const strategy of candidates) {
      const startTime = performance.now();
      
      try {
        console.log(`⚡ Running ${strategy.name} strategy...`);
        
        // Race between strategy execution and timeout
        const result = await Promise.race([
          strategy.solve(input),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error(`${strategy.name} timed out after ${perCandidateBudget}ms`)), perCandidateBudget)
          )
        ]);
        
        const endTime = performance.now();
        const actualTime = endTime - startTime;
        
        // Update the result with actual timing
        result.meta.timeMs = actualTime;
        results.push(result);
        
        console.log(`✅ ${strategy.name}: ${result.served} rides served, ${result.objective} agorot cost, ${actualTime.toFixed(0)}ms`);
        
        // Check if this is the best result so far
        if (!best || better(result, best)) {
          best = result;
          console.log(`🏆 ${strategy.name} is currently the best result`);
        }
        
      } catch (error) {
        const endTime = performance.now();
        const actualTime = endTime - startTime;
        
        const failedResult: SolveResult = {
          assignments: [],
          served: 0,
          objective: Number.POSITIVE_INFINITY,
          meta: { 
            name: `${strategy.name} (failed: ${String(error)})`, 
            timeMs: actualTime 
          }
        };
        
        results.push(failedResult);
        console.log(`❌ ${strategy.name}: Failed after ${actualTime.toFixed(0)}ms - ${String(error)}`);
      }
    }

    if (!best) {
      throw new Error("No strategy produced a successful result");
    }

    console.log('─'.repeat(60));
    console.log(`🎯 Final Selection: ${best.meta.name}`);
    console.log(`📊 Best Result: ${best.served} rides served, ${best.objective} agorot cost, ${best.meta.timeMs.toFixed(0)}ms`);
    console.log('');

    return best;
  }
};
