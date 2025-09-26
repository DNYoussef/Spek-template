/**
 * Sharding Coordinator for distributed task execution
 * Implements King's sharding patterns without fog compute
 */

import { EventEmitter } from 'events';
import { Logger } from '../../utils/logger';
import { Task, TaskStatus } from '../types/task.types';
import { PrincessDomain } from '../hierarchy/types';

export interface ShardExecutionPlan {
  taskId: string;
  shards: ShardDefinition[];
  executionOrder: string[][];  // Array of parallel execution groups
  aggregationStrategy: AggregationStrategy;
  failureStrategy: FailureStrategy;
}

export interface ShardDefinition {
  shardId: string;
  domain: PrincessDomain;
  workload: ShardWorkload;
  dependencies: string[];
  priority: number;
  estimatedDuration: number;
}

export interface ShardWorkload {
  files: string[];
  operations: string[];
  complexity: number;
  memory: number; // MB
}

export interface ShardResult {
  shardId: string;
  status: TaskStatus;
  output: any;
  errors: Error[];
  duration: number;
  memoryUsed: number;
}

export enum AggregationStrategy {
  SEQUENTIAL = 'sequential',
  PARALLEL = 'parallel',
  REDUCE = 'reduce',
  MERGE = 'merge',
  CUSTOM = 'custom'
}

export enum FailureStrategy {
  FAIL_FAST = 'fail_fast',
  CONTINUE = 'continue',
  RETRY = 'retry',
  COMPENSATE = 'compensate'
}

export class ShardingCoordinator extends EventEmitter {
  private logger: Logger;
  private activePlans: Map<string, ShardExecutionPlan>;
  private shardResults: Map<string, ShardResult[]>;
  private maxParallelShards: number = 3;
  private shardTimeout: number = 30000; // 30 seconds

  constructor() {
    super();
    this.logger = new Logger('ShardingCoordinator');
    this.activePlans = new Map();
    this.shardResults = new Map();
  }

  /**
   * Create execution plan for sharded task
   */
  createExecutionPlan(
    task: Task,
    shardCount: number
  ): ShardExecutionPlan {
    const shards: ShardDefinition[] = [];
    const workloadPerShard = this.calculateWorkloadDistribution(task, shardCount);

    // Create shard definitions
    for (let i = 0; i < shardCount; i++) {
      const shard: ShardDefinition = {
        shardId: `${task.id}-shard-${i}`,
        domain: this.selectShardDomain(task, i, shardCount),
        workload: workloadPerShard[i],
        dependencies: this.calculateShardDependencies(i, shardCount, task.id),
        priority: this.calculateShardPriority(task, i, shardCount),
        estimatedDuration: this.estimateShardDuration(workloadPerShard[i])
      };
      shards.push(shard);
    }

    // Determine execution order based on dependencies
    const executionOrder = this.determineExecutionOrder(shards);

    const plan: ShardExecutionPlan = {
      taskId: task.id,
      shards,
      executionOrder,
      aggregationStrategy: this.selectAggregationStrategy(task),
      failureStrategy: this.selectFailureStrategy(task)
    };

    this.activePlans.set(task.id, plan);
    this.logger.info(`Created execution plan for task ${task.id} with ${shardCount} shards`);

    return plan;
  }

  /**
   * Calculate workload distribution across shards
   */
  private calculateWorkloadDistribution(
    task: Task,
    shardCount: number
  ): ShardWorkload[] {
    const workloads: ShardWorkload[] = [];
    const files = task.files || [];
    const filesPerShard = Math.ceil(files.length / shardCount);

    for (let i = 0; i < shardCount; i++) {
      const startIdx = i * filesPerShard;
      const endIdx = Math.min(startIdx + filesPerShard, files.length);
      const shardFiles = files.slice(startIdx, endIdx);

      workloads.push({
        files: shardFiles,
        operations: this.identifyOperations(task, shardFiles),
        complexity: this.calculateComplexity(shardFiles),
        memory: this.estimateMemoryUsage(shardFiles)
      });
    }

    return workloads;
  }

  /**
   * Identify operations for shard files
   */
  private identifyOperations(task: Task, files: string[]): string[] {
    const operations: string[] = [];

    files.forEach(file => {
      if (file.endsWith('.ts') || file.endsWith('.js')) {
        operations.push('compile', 'analyze', 'lint');
      }
      if (file.includes('.test.') || file.includes('.spec.')) {
        operations.push('test', 'coverage');
      }
      if (file.endsWith('.md')) {
        operations.push('document', 'validate');
      }
    });

    return [...new Set(operations)]; // Unique operations
  }

  /**
   * Calculate complexity score for files
   */
  private calculateComplexity(files: string[]): number {
    let complexity = 0;

    files.forEach(file => {
      if (file.includes('.test.')) complexity += 20;
      else if (file.includes('.spec.')) complexity += 20;
      else if (file.endsWith('.ts')) complexity += 15;
      else if (file.endsWith('.js')) complexity += 10;
      else if (file.endsWith('.md')) complexity += 5;
      else complexity += 8;
    });

    return complexity;
  }

  /**
   * Estimate memory usage for files
   */
  private estimateMemoryUsage(files: string[]): number {
    // Rough estimate: 0.5MB per file + overhead
    return Math.ceil(files.length * 0.5 + 2);
  }

  /**
   * Select domain for shard based on workload
   */
  private selectShardDomain(
    task: Task,
    shardIndex: number,
    totalShards: number
  ): PrincessDomain {
    // Primary shard uses task domain
    if (shardIndex === 0) {
      return task.domain;
    }

    // Last shard goes to Quality for validation
    if (shardIndex === totalShards - 1) {
      return PrincessDomain.QUALITY;
    }

    // Distribute others based on workload characteristics
    const domains = [
      PrincessDomain.DEVELOPMENT,
      PrincessDomain.INFRASTRUCTURE,
      PrincessDomain.RESEARCH
    ];

    return domains[shardIndex % domains.length];
  }

  /**
   * Calculate dependencies between shards
   */
  private calculateShardDependencies(
    shardIndex: number,
    totalShards: number,
    taskId: string
  ): string[] {
    const dependencies: string[] = [];

    // Linear dependency chain for now
    if (shardIndex > 0) {
      dependencies.push(`${taskId}-shard-${shardIndex - 1}`);
    }

    return dependencies;
  }

  /**
   * Calculate priority for shard execution
   */
  private calculateShardPriority(
    task: Task,
    shardIndex: number,
    totalShards: number
  ): number {
    let basePriority = 50;

    // First shard has higher priority
    if (shardIndex === 0) basePriority += 20;

    // Critical tasks have higher priority
    if (task.priority === TaskPriority.CRITICAL) basePriority += 30;
    else if (task.priority === TaskPriority.HIGH) basePriority += 15;

    return Math.min(basePriority, 100);
  }

  /**
   * Estimate duration for shard execution
   */
  private estimateShardDuration(workload: ShardWorkload): number {
    // Base estimate: 1 second per file + complexity factor
    return (workload.files.length * 1000) + (workload.complexity * 100);
  }

  /**
   * Determine execution order based on dependencies
   */
  private determineExecutionOrder(shards: ShardDefinition[]): string[][] {
    const order: string[][] = [];
    const executed = new Set<string>();
    const remaining = new Set(shards.map(s => s.shardId));

    while (remaining.size > 0) {
      const batch: string[] = [];

      for (const shardId of remaining) {
        const shard = shards.find(s => s.shardId === shardId)!;
        const depsExecuted = shard.dependencies.every(dep => executed.has(dep));

        if (depsExecuted) {
          batch.push(shardId);
        }
      }

      if (batch.length === 0) {
        this.logger.error('Circular dependency detected in shard execution plan');
        break;
      }

      order.push(batch);
      batch.forEach(id => {
        executed.add(id);
        remaining.delete(id);
      });
    }

    return order;
  }

  /**
   * Select aggregation strategy based on task type
   */
  private selectAggregationStrategy(task: Task): AggregationStrategy {
    if (task.type === 'analysis') {
      return AggregationStrategy.MERGE;
    } else if (task.type === 'build') {
      return AggregationStrategy.SEQUENTIAL;
    } else if (task.type === 'test') {
      return AggregationStrategy.PARALLEL;
    }

    return AggregationStrategy.REDUCE;
  }

  /**
   * Select failure strategy based on task priority
   */
  private selectFailureStrategy(task: Task): FailureStrategy {
    if (task.priority === TaskPriority.CRITICAL) {
      return FailureStrategy.FAIL_FAST;
    } else if (task.priority === TaskPriority.LOW) {
      return FailureStrategy.CONTINUE;
    }

    return FailureStrategy.RETRY;
  }

  /**
   * Execute shards according to plan
   */
  async executeShards(taskId: string): Promise<any> {
    const plan = this.activePlans.get(taskId);
    if (!plan) {
      throw new Error(`No execution plan found for task ${taskId}`);
    }

    const results: ShardResult[] = [];

    try {
      // Execute shards in order
      for (const batch of plan.executionOrder) {
        const batchPromises = batch.map(shardId =>
          this.executeShard(plan.shards.find(s => s.shardId === shardId)!)
        );

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);

        // Check failure strategy
        const hasFailure = batchResults.some(r => r.status === TaskStatus.FAILED);
        if (hasFailure && plan.failureStrategy === FailureStrategy.FAIL_FAST) {
          throw new Error('Shard execution failed - fail fast strategy');
        }
      }

      // Store results
      this.shardResults.set(taskId, results);

      // Aggregate results
      return this.aggregateResults(results, plan.aggregationStrategy);

    } catch (error) {
      this.logger.error(`Shard execution failed for task ${taskId}:`, error);
      this.emit('shard-execution-failed', { taskId, error, results });
      throw error;
    }
  }

  /**
   * Execute individual shard
   */
  private async executeShard(shard: ShardDefinition): Promise<ShardResult> {
    const startTime = Date.now();

    try {
      this.emit('shard-execution-started', shard);

      // Simulate shard execution (would call Princess in real implementation)
      await this.simulateShardExecution(shard);

      const result: ShardResult = {
        shardId: shard.shardId,
        status: TaskStatus.COMPLETED,
        output: `Processed ${shard.workload.files.length} files`,
        errors: [],
        duration: Date.now() - startTime,
        memoryUsed: shard.workload.memory
      };

      this.emit('shard-execution-completed', result);
      return result;

    } catch (error) {
      const result: ShardResult = {
        shardId: shard.shardId,
        status: TaskStatus.FAILED,
        output: null,
        errors: [error as Error],
        duration: Date.now() - startTime,
        memoryUsed: 0
      };

      this.emit('shard-execution-failed', result);
      return result;
    }
  }

  /**
   * Simulate shard execution for testing
   */
  private async simulateShardExecution(shard: ShardDefinition): Promise<void> {
    // Simulate processing time
    await new Promise(resolve =>
      setTimeout(resolve, Math.min(shard.estimatedDuration / 10, 1000))
    );
  }

  /**
   * Aggregate shard results based on strategy
   */
  private aggregateResults(
    results: ShardResult[],
    strategy: AggregationStrategy
  ): any {
    switch (strategy) {
      case AggregationStrategy.MERGE:
        return results.map(r => r.output).filter(Boolean);

      case AggregationStrategy.REDUCE:
        return results.reduce((acc, r) => {
          if (r.output) {
            return { ...acc, ...r.output };
          }
          return acc;
        }, {});

      case AggregationStrategy.SEQUENTIAL:
        return results[results.length - 1]?.output;

      case AggregationStrategy.PARALLEL:
        return {
          successful: results.filter(r => r.status === TaskStatus.COMPLETED).length,
          failed: results.filter(r => r.status === TaskStatus.FAILED).length,
          outputs: results.map(r => r.output)
        };

      default:
        return results;
    }
  }

  /**
   * Get shard results for task
   */
  getShardResults(taskId: string): ShardResult[] | undefined {
    return this.shardResults.get(taskId);
  }

  /**
   * Clean up completed task data
   */
  cleanupTask(taskId: string): void {
    this.activePlans.delete(taskId);
    this.shardResults.delete(taskId);
    this.logger.info(`Cleaned up data for task ${taskId}`);
  }
}

export default ShardingCoordinator;