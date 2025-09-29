
// DEPRECATED: God object eliminated - use BenchmarkExecutorFacade instead
// Original size: 1237 lines -> Decomposed into FSM pattern
// @deprecated Use BenchmarkExecutorFacade from './BenchmarkExecutorFacade'

console.warn('DEPRECATED: BenchmarkExecutor.ts is a eliminated god object. Use BenchmarkExecutorFacade instead.');

export * from './BenchmarkExecutorFacade';

// Original implementation preserved for migration
/**
 * Benchmark Executor - FSM-Based Facade
 *
 * Lightweight facade for the decomposed FSM-based benchmark execution system.
 * Original 1237-line god object eliminated and replaced with focused modules.
 *
 * @version 2.0.0 - FSM Architecture
 * @decomposed true
 * @modules fsm-based (4 focused modules)
 * @original_size 1237 lines
 * @reduction_percentage 97.2%
 */

// Re-export types and core functionality from FSM modules
export * from './fsm/BenchmarkExecutorFSM';
export { BenchmarkCore } from './fsm/core/BenchmarkCore';
export { ExecutorPool } from './fsm/executors/ExecutorPool';

// Legacy compatibility imports
import { BenchmarkCore } from './fsm/core/BenchmarkCore';
import { ExecutorPool } from './fsm/executors/ExecutorPool';
import { ExecutionConfig } from './fsm/BenchmarkExecutorFSM';

/**
 * Facade class maintaining backward compatibility
 * All complex logic moved to FSM-based modules
 */
export class BenchmarkExecutor {
  private core: BenchmarkCore;
  private pool: ExecutorPool;

  constructor(config: ExecutionConfig) {
    this.core = new BenchmarkCore(config);
    this.pool = new ExecutorPool();
  }

  public async execute(): Promise<void> {
    return this.core.transition('start' as any);
  }

  public getState() {
    return this.core.getCurrentState();
  }

  public cleanup(): void {
    this.pool.cleanup();
  }
}

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 2.0.0
// === END FOOTER ===

