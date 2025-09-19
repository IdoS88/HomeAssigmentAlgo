import type { Driver, Ride } from '../domain.js';
import type { Assignment as LegacyAssignment } from '../strategy.js';

export type ProblemInput = { drivers: unknown[]; rides: unknown[] };
export type Assignment = LegacyAssignment;

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
