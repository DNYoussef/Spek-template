/**
 * King Logic Adapter for SwarmQueen
 * Integrates meta-coordination patterns from AI Village King agent
 * without fog compute dependencies
 */

import { EventEmitter } from 'events';
import { Logger } from '../../utils/logger';
import { Task, TaskPriority } from '../types/task.types';
import { PrincessDomain } from '../hierarchy/types';

export interface KingMetaLogic {
  taskSharding: boolean;
  meceDistribution: boolean;
  intelligentRouting: boolean;
  adaptiveCoordination: boolean;
  multiAgentOrchestration: boolean;
}

export interface ShardedTask {
  originalTaskId: string;
  shardId: string;
  shardIndex: number;
  totalShards: number;
  domain: PrincessDomain;
  subtask: Task;
  dependencies: string[];
}

export class KingLogicAdapter extends EventEmitter {
  private logger: Logger;
  private metaLogicEnabled: KingMetaLogic;
  private shardingThreshold: number = 100; // Complexity threshold for sharding

  constructor() {
    super();
    this.logger = new Logger('KingLogicAdapter');

    // Enable King's meta-logic patterns
    this.metaLogicEnabled = {
      taskSharding: true,
      meceDistribution: true,
      intelligentRouting: true,
      adaptiveCoordination: true,
      multiAgentOrchestration: true
    };
  }

  /**
   * Analyze task complexity using King's meta-logic
   */
  analyzeTaskComplexity(task: Task): number {
    let complexity = 0;

    // File count complexity
    if (task.files && task.files.length > 0) {
      complexity += task.files.length * 10;
    }

    // Line count complexity
    if (task.estimatedLOC) {
      complexity += Math.floor(task.estimatedLOC / 50);
    }

    // Dependency complexity
    if (task.dependencies && task.dependencies.length > 0) {
      complexity += task.dependencies.length * 15;
    }

    // Priority modifier
    if (task.priority === TaskPriority.CRITICAL) {
      complexity *= 1.5;
    } else if (task.priority === TaskPriority.HIGH) {
      complexity *= 1.2;
    }

    // Domain complexity modifiers
    if (task.domain === PrincessDomain.SECURITY) {
      complexity *= 1.3; // Security tasks need more careful handling
    } else if (task.domain === PrincessDomain.DEPLOYMENT) {
      complexity *= 1.2; // Deployment tasks have environmental complexity
    }

    return Math.floor(complexity);
  }

  /**
   * Determine if task should be sharded based on King's logic
   */
  shouldShardTask(task: Task): boolean {
    if (!this.metaLogicEnabled.taskSharding) {
      return false;
    }

    const complexity = this.analyzeTaskComplexity(task);
    return complexity > this.shardingThreshold;
  }

  /**
   * Shard a complex task into smaller subtasks using King's patterns
   */
  shardTask(task: Task): ShardedTask[] {
    const shards: ShardedTask[] = [];
    const complexity = this.analyzeTaskComplexity(task);
    const numShards = Math.min(Math.ceil(complexity / this.shardingThreshold), 6); // Max 6 shards (one per Princess)

    this.logger.info(`Sharding task ${task.id} into ${numShards} shards`);

    // Distribute work across shards
    for (let i = 0; i < numShards; i++) {
      const shard: ShardedTask = {
        originalTaskId: task.id,
        shardId: `${task.id}-shard-${i}`,
        shardIndex: i,
        totalShards: numShards,
        domain: this.selectDomainForShard(task, i, numShards),
        subtask: this.createSubtask(task, i, numShards),
        dependencies: this.calculateShardDependencies(task, i, numShards)
      };

      shards.push(shard);
    }

    return shards;
  }

  /**
   * Select appropriate Princess domain for shard
   */
  private selectDomainForShard(task: Task, shardIndex: number, totalShards: number): PrincessDomain {
    // Intelligent domain routing based on shard characteristics
    const domains = [
      PrincessDomain.DEVELOPMENT,
      PrincessDomain.QUALITY,
      PrincessDomain.INFRASTRUCTURE,
      PrincessDomain.RESEARCH,
      PrincessDomain.DEPLOYMENT,
      PrincessDomain.SECURITY
    ];

    // First shard goes to primary domain
    if (shardIndex === 0) {
      return task.domain;
    }

    // Quality shard for testing
    if (shardIndex === totalShards - 1) {
      return PrincessDomain.QUALITY;
    }

    // Distribute remaining shards intelligently
    return domains[shardIndex % domains.length];
  }

  /**
   * Create subtask from parent task for specific shard
   */
  private createSubtask(task: Task, shardIndex: number, totalShards: number): Task {
    const filesPerShard = Math.ceil((task.files?.length || 0) / totalShards);
    const startIdx = shardIndex * filesPerShard;
    const endIdx = Math.min(startIdx + filesPerShard, task.files?.length || 0);

    return {
      ...task,
      id: `${task.id}-shard-${shardIndex}`,
      name: `${task.name} (Part ${shardIndex + 1}/${totalShards})`,
      files: task.files?.slice(startIdx, endIdx),
      estimatedLOC: Math.ceil((task.estimatedLOC || 0) / totalShards)
    };
  }

  /**
   * Calculate dependencies between shards
   */
  private calculateShardDependencies(task: Task, shardIndex: number, totalShards: number): string[] {
    const dependencies: string[] = [];

    // Each shard depends on previous shard (except first)
    if (shardIndex > 0) {
      dependencies.push(`${task.id}-shard-${shardIndex - 1}`);
    }

    // Original task dependencies apply to first shard
    if (shardIndex === 0 && task.dependencies) {
      dependencies.push(...task.dependencies);
    }

    return dependencies;
  }

  /**
   * Apply MECE (Mutually Exclusive, Collectively Exhaustive) validation
   */
  validateMECEDistribution(tasks: Task[]): {
    valid: boolean;
    overlaps: string[];
    gaps: string[];
  } {
    const overlaps: string[] = [];
    const gaps: string[] = [];
    const filesCovered = new Set<string>();
    const filesRequired = new Set<string>();

    // Collect all required files
    tasks.forEach(task => {
      task.files?.forEach(file => filesRequired.add(file));
    });

    // Check for overlaps and coverage
    tasks.forEach(task => {
      task.files?.forEach(file => {
        if (filesCovered.has(file)) {
          overlaps.push(`File ${file} assigned to multiple tasks`);
        }
        filesCovered.add(file);
      });
    });

    // Check for gaps
    filesRequired.forEach(file => {
      if (!filesCovered.has(file)) {
        gaps.push(`File ${file} not assigned to any task`);
      }
    });

    return {
      valid: overlaps.length === 0 && gaps.length === 0,
      overlaps,
      gaps
    };
  }

  /**
   * Apply King's intelligent routing logic
   */
  routeTaskToPrincess(task: Task): PrincessDomain {
    if (!this.metaLogicEnabled.intelligentRouting) {
      return task.domain;
    }

    // Analyze task characteristics
    const hasTests = task.files?.some(f => f.includes('.test.') || f.includes('.spec.'));
    const hasConfig = task.files?.some(f => f.includes('config') || f.includes('.json'));
    const hasDocs = task.files?.some(f => f.includes('.md') || f.includes('README'));
    const hasSecurity = task.description?.toLowerCase().includes('security') ||
                        task.description?.toLowerCase().includes('auth');

    // Intelligent routing based on content
    if (hasSecurity) {
      return PrincessDomain.SECURITY;
    } else if (hasTests) {
      return PrincessDomain.QUALITY;
    } else if (hasConfig) {
      return PrincessDomain.INFRASTRUCTURE;
    } else if (hasDocs) {
      return PrincessDomain.RESEARCH;
    }

    return task.domain;
  }

  /**
   * Coordinate multiple agents using King's patterns
   */
  async coordinateMultipleAgents(
    tasks: Task[],
    maxConcurrent: number = 3
  ): Promise<Map<PrincessDomain, Task[]>> {
    const distribution = new Map<PrincessDomain, Task[]>();

    // Initialize distribution map
    Object.values(PrincessDomain).forEach(domain => {
      distribution.set(domain as PrincessDomain, []);
    });

    // Apply intelligent routing
    for (const task of tasks) {
      const targetDomain = this.routeTaskToPrincess(task);
      const domainTasks = distribution.get(targetDomain) || [];

      // Check if task should be sharded
      if (this.shouldShardTask(task)) {
        const shards = this.shardTask(task);
        shards.forEach(shard => {
          const shardDomain = shard.domain;
          const shardTasks = distribution.get(shardDomain) || [];
          shardTasks.push(shard.subtask);
          distribution.set(shardDomain, shardTasks);
        });
      } else {
        domainTasks.push(task);
        distribution.set(targetDomain, domainTasks);
      }
    }

    // Validate MECE distribution
    const allDistributedTasks: Task[] = [];
    distribution.forEach(tasks => allDistributedTasks.push(...tasks));

    const meceValidation = this.validateMECEDistribution(allDistributedTasks);
    if (!meceValidation.valid) {
      this.logger.warn('MECE validation failed:', meceValidation);
      this.emit('mece-violation', meceValidation);
    }

    return distribution;
  }

  /**
   * Enable or disable specific King logic features
   */
  configureMetaLogic(config: Partial<KingMetaLogic>): void {
    this.metaLogicEnabled = {
      ...this.metaLogicEnabled,
      ...config
    };

    this.logger.info('King meta-logic configuration updated:', this.metaLogicEnabled);
  }

  /**
   * Get current meta-logic configuration
   */
  getMetaLogicStatus(): KingMetaLogic {
    return { ...this.metaLogicEnabled };
  }
}

export default KingLogicAdapter;