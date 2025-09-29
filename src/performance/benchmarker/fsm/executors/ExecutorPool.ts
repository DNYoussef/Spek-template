/**
 * Executor Pool - Manages multiple benchmark executors
 * Extracted from BenchmarkExecutor god object
 */

import { BenchmarkCore } from '../core/BenchmarkCore';
import { ExecutionConfig } from '../BenchmarkExecutorFSM';

export class ExecutorPool {
  private executors: Map<string, BenchmarkCore> = new Map();
  private activeExecutions: Set<string> = new Set();

  public async createExecutor(id: string, config: ExecutionConfig): Promise<BenchmarkCore> {
    const executor = new BenchmarkCore(config);
    this.executors.set(id, executor);
    return executor;
  }

  public getExecutor(id: string): BenchmarkCore | undefined {
    return this.executors.get(id);
  }

  public async executeAll(): Promise<void> {
    const promises = Array.from(this.executors.entries()).map(async ([id, executor]) => {
      this.activeExecutions.add(id);
      try {
        await executor.transition('start' as any);
      } finally {
        this.activeExecutions.delete(id);
      }
    });

    await Promise.all(promises);
  }

  public getActiveExecutions(): string[] {
    return Array.from(this.activeExecutions);
  }

  public cleanup(): void {
    this.executors.clear();
    this.activeExecutions.clear();
  }
}

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0
// === END FOOTER ===