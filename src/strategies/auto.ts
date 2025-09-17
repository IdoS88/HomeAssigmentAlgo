import { Strategy, ProblemInput, SolveResult } from "./types.js";
import { greedyStrategy } from "./greedy.js";
import { mincostStrategy } from "./mincost.js";

const candidates: Strategy[] = [mincostStrategy, greedyStrategy];

function better(a: SolveResult, b: SolveResult): boolean {
  if (a.served !== b.served) return a.served > b.served;
  if (a.objective !== b.objective) return a.objective < b.objective;
  return a.meta.timeMs < b.meta.timeMs;
}

export const autoStrategy: Strategy = {
  name: "auto",
  async solve(input: ProblemInput): Promise<SolveResult> {
    const perCandidateBudget = 5000;
    let best: SolveResult | null = null;

    for (const s of candidates) {
      const run = async (): Promise<SolveResult> => Promise.resolve(s.solve(input));
      const result = await Promise.race([
        run(),
        new Promise<SolveResult>((_, rej) =>
          setTimeout(() => rej(new Error(`${s.name} timed out`)), perCandidateBudget)
        )
      ]).catch(err => ({
        assignments: [],
        served: -1,
        objective: Number.POSITIVE_INFINITY,
        meta: { name: `${s.name} (failed: ${String(err)})`, timeMs: perCandidateBudget }
      } as SolveResult));

      if (!best || better(result, best)) best = result;
    }

    if (!best) throw new Error("No strategy produced a result");
    return best;
  }
};
