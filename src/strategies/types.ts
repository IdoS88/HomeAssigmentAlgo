export type ProblemInput = { drivers: any[]; rides: any[] };
export type Assignment = any;

export type SolveResult = {
  assignments: Assignment[];
  served: number;          // higher is better
  objective: number;       // lower is better
  meta: { name: string; timeMs: number };
};

export interface Strategy {
  name: string;
  solve(input: ProblemInput): Promise<SolveResult> | SolveResult;
}
