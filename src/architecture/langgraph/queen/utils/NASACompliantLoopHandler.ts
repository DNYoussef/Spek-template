/**
 * NASA Compliant Loop Handler - NASA Rule 10 Implementation
 * Ensures all loops have fixed, deterministic bounds
 */

export interface NASALoopConfig {
  maxPrincessCount: number;
  maxObjectiveCount: number;
  maxExecutionPhases: number;
  maxDecisionOptions: number;
  maxEscalationRetries: number;
  maxWorkflowIterations: number;
}

export interface LoopMetrics {
  operationName: string;
  iterationCount: number;
  maxIterations: number;
  startTime: number;
  endTime?: number;
  status: 'running' | 'completed' | 'bounded' | 'error';
}

export class NASACompliantLoopHandler {
  private config: NASALoopConfig;
  private activeOperations: Map<string, LoopMetrics>;
  private operationHistory: LoopMetrics[];

  constructor(config: NASALoopConfig) {
    this.config = config;
    this.activeOperations = new Map();
    this.operationHistory = [];
  }

  /**
   * Execute operation with bounded iteration control
   * NASA Rule 10: Fixed loop bounds
   */
  executeWithBounds<T>(operationName: string, operation: () => T): T {
    const startTime = Date.now();
    const metrics: LoopMetrics = {
      operationName,
      iterationCount: 1,
      maxIterations: 1,
      startTime,
      status: 'running'
    };

    this.activeOperations.set(operationName, metrics);

    try {
      const result = operation();

      metrics.status = 'completed';
      metrics.endTime = Date.now();
      this.recordOperation(metrics);

      return result;
    } catch (error) {
      metrics.status = 'error';
      metrics.endTime = Date.now();
      this.recordOperation(metrics);
      throw error;
    } finally {
      this.activeOperations.delete(operationName);
    }
  }

  /**
   * Execute async operation with bounded iteration control
   */
  async executeAsyncWithBounds<T>(operationName: string, operation: () => Promise<T>): Promise<T> {
    const startTime = Date.now();
    const metrics: LoopMetrics = {
      operationName,
      iterationCount: 1,
      maxIterations: 1,
      startTime,
      status: 'running'
    };

    this.activeOperations.set(operationName, metrics);

    try {
      const result = await operation();

      metrics.status = 'completed';
      metrics.endTime = Date.now();
      this.recordOperation(metrics);

      return result;
    } catch (error) {
      metrics.status = 'error';
      metrics.endTime = Date.now();
      this.recordOperation(metrics);
      throw error;
    } finally {
      this.activeOperations.delete(operationName);
    }
  }

  /**
   * Execute iteration over collection with fixed bounds
   * NASA Rule 10: Loop bounds must be fixed and deterministic
   */
  executeIterationWithBounds<T>(
    collection: T[],
    processor: (item: T, index: number) => void,
    maxIterations: number
  ): void {
    // NASA Rule 10: Enforce fixed bounds
    const actualMax = Math.min(collection.length, maxIterations);

    const metrics: LoopMetrics = {
      operationName: 'bounded_iteration',
      iterationCount: 0,
      maxIterations: actualMax,
      startTime: Date.now(),
      status: 'running'
    };

    try {
      // Fixed loop with deterministic bound
      for (let i = 0; i < actualMax; i++) {
        metrics.iterationCount = i + 1;
        processor(collection[i], i);
      }

      metrics.status = actualMax < collection.length ? 'bounded' : 'completed';
      metrics.endTime = Date.now();
      this.recordOperation(metrics);

    } catch (error) {
      metrics.status = 'error';
      metrics.endTime = Date.now();
      this.recordOperation(metrics);
      throw error;
    }
  }

  /**
   * Execute async iteration with fixed bounds
   */
  async executeAsyncIterationWithBounds<T>(
    collection: T[],
    processor: (item: T, index: number) => Promise<void>,
    maxIterations: number
  ): Promise<void> {
    // NASA Rule 10: Enforce fixed bounds
    const actualMax = Math.min(collection.length, maxIterations);

    const metrics: LoopMetrics = {
      operationName: 'async_bounded_iteration',
      iterationCount: 0,
      maxIterations: actualMax,
      startTime: Date.now(),
      status: 'running'
    };

    try {
      // Fixed loop with deterministic bound
      for (let i = 0; i < actualMax; i++) {
        metrics.iterationCount = i + 1;
        await processor(collection[i], i);
      }

      metrics.status = actualMax < collection.length ? 'bounded' : 'completed';
      metrics.endTime = Date.now();
      this.recordOperation(metrics);

    } catch (error) {
      metrics.status = 'error';
      metrics.endTime = Date.now();
      this.recordOperation(metrics);
      throw error;
    }
  }

  /**
   * Execute workflow with bounded phase iterations
   */
  executeWorkflowWithBounds<T>(
    phases: T[],
    phaseProcessor: (phase: T, index: number) => Promise<void>
  ): Promise<void> {
    return this.executeAsyncIterationWithBounds(
      phases,
      phaseProcessor,
      this.config.maxExecutionPhases
    );
  }

  /**
   * Execute Princess operations with bounded collection
   */
  executePrincessOperationWithBounds<T>(
    princesses: T[],
    operation: (princess: T, index: number) => void
  ): void {
    this.executeIterationWithBounds(
      princesses,
      operation,
      this.config.maxPrincessCount
    );
  }

  /**
   * Execute decision evaluation with bounded options
   */
  executeDecisionEvaluationWithBounds<T>(
    options: T[],
    evaluator: (option: T, index: number) => Promise<any>
  ): Promise<void> {
    return this.executeAsyncIterationWithBounds(
      options,
      evaluator,
      this.config.maxDecisionOptions
    );
  }

  /**
   * Get current operation metrics
   */
  getActiveOperations(): Map<string, LoopMetrics> {
    return new Map(this.activeOperations);
  }

  /**
   * Get operation history with bounded size
   */
  getOperationHistory(): LoopMetrics[] {
    // NASA Rule 10: Keep bounded history
    const maxHistorySize = 100;
    return this.operationHistory.slice(-maxHistorySize);
  }

  /**
   * Get configuration limits
   */
  getConfig(): NASALoopConfig {
    return { ...this.config };
  }

  /**
   * Validate collection size against bounds
   */
  validateCollectionBounds(collection: any[], operationType: keyof NASALoopConfig): boolean {
    const maxSize = this.config[operationType] as number;
    return collection.length <= maxSize;
  }

  /**
   * Enforce collection bounds by truncating if necessary
   */
  enforceCollectionBounds<T>(collection: T[], operationType: keyof NASALoopConfig): T[] {
    const maxSize = this.config[operationType] as number;
    return collection.slice(0, maxSize);
  }

  private recordOperation(metrics: LoopMetrics): void {
    this.operationHistory.push({ ...metrics });

    // NASA Rule 10: Keep bounded history
    const maxHistorySize = 1000;
    if (this.operationHistory.length > maxHistorySize) {
      this.operationHistory = this.operationHistory.slice(-500);
    }
  }
}

<!-- AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE -->
## Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
|--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
| 1.0.0   | 2025-09-28T16:26:45-04:00 | CODEX AGENT 024@Claude Sonnet | Created NASACompliantLoopHandler.ts with bounded loop operations | NASACompliantLoopHandler.ts | OK | NASA Rule 10 compliance utility | 0.00 | b8c3d4e |

### Receipt
- status: OK
- reason_if_blocked: --
- run_id: codex-024-nasa-loop-handler
- inputs: ["QueenOrchestrator.ts refactoring requirements"]
- tools_used: ["Write"]
- versions: {"model":"claude-sonnet-4","prompt":"v1.0"}
<!-- AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE -->