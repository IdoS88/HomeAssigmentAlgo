import type { Assignment, Strategy, StrategyOptions } from '../strategy.js';
import type { Driver, Ride } from '../domain.js';
import { GreedyStrategy } from './greedy.js';

/**
 * Min-cost flow strategy (temporary stub)
 * Currently delegates to greedy strategy
 * TODO: Implement proper min-cost flow algorithm
 */
export class MinCostFlowStrategy implements Strategy {
  private greedyStrategy = new GreedyStrategy();

  async assign(
    rides: Ride[],
    drivers: Driver[],
    options: StrategyOptions = {},
  ): Promise<Assignment[]> {
    // TODO: Implement min-cost flow algorithm
    // For now, delegate to greedy strategy
    return await this.greedyStrategy.assign(rides, drivers, options);
  }
}
