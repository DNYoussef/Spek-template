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

<!-- AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE -->
## Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
|--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
| 1.0.0   | 2025-09-28T14:50:00-04:00 | agent@God-Object-Terminator | Created executor pool for managing multiple benchmarks | ExecutorPool.ts | OK | Pool management extracted from god object | 0.00 | d9e2f5a |
<!-- AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE -->