import { EventEmitter } from 'events';
import { MemoryPriority } from '../memory/LangroidMemoryBackend';
import { InfrastructureTask, TaskStatus } from '../../../api/infrastructure/InfrastructureTaskManager';

/**
 * Task Priority Manager for Infrastructure Princess
 * Advanced priority-based scheduling with dynamic priority adjustment,
 * resource-aware scheduling, and intelligent queue management.
 */
export interface PriorityConfig {
  baseWeights: PriorityWeights;
  agingEnabled: boolean;
  agingFactor: number;
  resourceAwareness: boolean;
  deadlineAwareness: boolean;
  starvationPrevention: boolean;
  maxStarvationTime: number;
}

export interface PriorityWeights {
  critical: number;
  high: number;
  medium: number;
  low: number;
  cache: number;
}

export interface TaskPriorityInfo {
  taskId: string;
  originalPriority: MemoryPriority;
  currentPriority: number;
  submissionTime: number;
  lastPriorityUpdate: number;
  deadline?: number;
  resourceRequirements: ResourceRequirement;
  starvationScore: number;
  executionHistory: ExecutionHistory;
}

export interface ResourceRequirement {
  memory: number;
  cpu: number;
  disk: number;
  network: number;
  estimatedDuration: number;
}

export interface ExecutionHistory {
  averageExecutionTime: number;
  successRate: number;
  retryCount: number;
  lastExecutionTime?: number;
}

export interface SchedulingStats {
  totalTasks: number;
  tasksInQueue: Map<MemoryPriority, number>;
  averageWaitTime: Map<MemoryPriority, number>;
  starvationCount: number;
  priorityPromotions: number;
  resourceUtilization: ResourceUtilization;
}

export interface ResourceUtilization {
  memory: number;
  cpu: number;
  disk: number;
  network: number;
  timestamp: number;
}

export interface SchedulingDecision {
  selectedTask: TaskPriorityInfo;
  reason: string;
  alternatives: TaskPriorityInfo[];
  resourceImpact: ResourceImpact;
  schedulingScore: number;
}

export interface ResourceImpact {
  memoryDelta: number;
  cpuDelta: number;
  diskDelta: number;
  networkDelta: number;
  estimatedCompletionTime: number;
}

export class TaskPriorityManager extends EventEmitter {
  private static readonly DEFAULT_AGING_FACTOR = 0.1;
  private static readonly DEFAULT_MAX_STARVATION_TIME = 30 * 60 * 1000; // 30 minutes
  private static readonly PRIORITY_UPDATE_INTERVAL = 10 * 1000; // 10 seconds

  private static readonly DEFAULT_WEIGHTS: PriorityWeights = {
    critical: 100,
    high: 75,
    medium: 50,
    low: 25,
    cache: 10
  };

  private config: PriorityConfig;
  private taskPriorities: Map<string, TaskPriorityInfo> = new Map();
  private priorityQueues: Map<MemoryPriority, TaskPriorityInfo[]> = new Map();
  private currentResourceUsage: ResourceUtilization;

  private schedulingHistory: SchedulingDecision[] = [];
  private stats: SchedulingStats;

  private priorityUpdateTimer?: NodeJS.Timeout;
  private startTime: number;

  constructor(config?: Partial<PriorityConfig>) {
    super();

    this.config = {
      baseWeights: config?.baseWeights || TaskPriorityManager.DEFAULT_WEIGHTS,
      agingEnabled: config?.agingEnabled ?? true,
      agingFactor: config?.agingFactor ?? TaskPriorityManager.DEFAULT_AGING_FACTOR,
      resourceAwareness: config?.resourceAwareness ?? true,
      deadlineAwareness: config?.deadlineAwareness ?? true,
      starvationPrevention: config?.starvationPrevention ?? true,
      maxStarvationTime: config?.maxStarvationTime ?? TaskPriorityManager.DEFAULT_MAX_STARVATION_TIME
    };

    this.currentResourceUsage = {
      memory: 0,
      cpu: 0,
      disk: 0,
      network: 0,
      timestamp: Date.now()
    };

    this.stats = this.initializeStats();
    this.startTime = Date.now();

    this.initializePriorityQueues();
    this.startPriorityUpdateTimer();
  }

  /**
   * Add task to priority management
   */
  public addTask(task: InfrastructureTask, resourceRequirements: ResourceRequirement): void {
    try {
      const taskInfo: TaskPriorityInfo = {
        taskId: task.id,
        originalPriority: task.priority,
        currentPriority: this.calculateInitialPriority(task.priority),
        submissionTime: task.submittedAt,
        lastPriorityUpdate: Date.now(),
        deadline: this.calculateDeadline(task),
        resourceRequirements,
        starvationScore: 0,
        executionHistory: {
          averageExecutionTime: resourceRequirements.estimatedDuration,
          successRate: 1.0,
          retryCount: task.retryCount
        }
      };

      // Store task info
      this.taskPriorities.set(task.id, taskInfo);

      // Add to appropriate queue
      this.addToQueue(taskInfo);

      // Update stats
      this.updateStats();

      this.emit('task-added', { taskId: task.id, priority: task.priority });

    } catch (error) {
      this.emit('error', { operation: 'addTask', taskId: task.id, error });
    }
  }

  /**
   * Remove task from priority management
   */
  public removeTask(taskId: string): boolean {
    try {
      const taskInfo = this.taskPriorities.get(taskId);
      if (!taskInfo) return false;

      // Remove from queue
      this.removeFromQueue(taskInfo);

      // Remove from tracking
      this.taskPriorities.delete(taskId);

      // Update stats
      this.updateStats();

      this.emit('task-removed', { taskId });

      return true;

    } catch (error) {
      this.emit('error', { operation: 'removeTask', taskId, error });
      return false;
    }
  }

  /**
   * Get next task to execute based on priority and scheduling algorithm
   */
  public getNextTask(availableResources: ResourceUtilization): SchedulingDecision | null {
    try {
      const candidates = this.getCandidateTasks(availableResources);
      if (candidates.length === 0) return null;

      // Score all candidates
      const scoredCandidates = candidates.map(candidate => ({
        task: candidate,
        score: this.calculateSchedulingScore(candidate, availableResources)
      }));

      // Sort by score (highest first)
      scoredCandidates.sort((a, b) => b.score - a.score);

      const selectedTask = scoredCandidates[0].task;
      const alternatives = scoredCandidates.slice(1, 4).map(c => c.task); // Top 3 alternatives

      const decision: SchedulingDecision = {
        selectedTask,
        reason: this.generateSchedulingReason(selectedTask, scoredCandidates[0].score),
        alternatives,
        resourceImpact: this.calculateResourceImpact(selectedTask, availableResources),
        schedulingScore: scoredCandidates[0].score
      };

      // Record decision
      this.schedulingHistory.push(decision);
      if (this.schedulingHistory.length > 100) {
        this.schedulingHistory.shift();
      }

      this.emit('task-scheduled', decision);

      return decision;

    } catch (error) {
      this.emit('error', { operation: 'getNextTask', error });
      return null;
    }
  }

  /**
   * Update task execution result
   */
  public updateTaskResult(taskId: string, executionTime: number, success: boolean): void {
    try {
      const taskInfo = this.taskPriorities.get(taskId);
      if (!taskInfo) return;

      // Update execution history
      const history = taskInfo.executionHistory;
      history.lastExecutionTime = executionTime;
      history.averageExecutionTime = (history.averageExecutionTime + executionTime) / 2;

      if (success) {
        history.successRate = (history.successRate * 0.9) + (1.0 * 0.1); // Weighted average
      } else {
        history.successRate = (history.successRate * 0.9) + (0.0 * 0.1);
        history.retryCount++;
      }

      this.emit('task-result-updated', { taskId, executionTime, success });

    } catch (error) {
      this.emit('error', { operation: 'updateTaskResult', taskId, error });
    }
  }

  /**
   * Update current resource usage
   */
  public updateResourceUsage(usage: ResourceUtilization): void {
    this.currentResourceUsage = { ...usage, timestamp: Date.now() };
    this.emit('resource-usage-updated', usage);
  }

  /**
   * Get scheduling statistics
   */
  public getStats(): SchedulingStats {
    return { ...this.stats };
  }

  /**
   * Get task priority information
   */
  public getTaskInfo(taskId: string): TaskPriorityInfo | null {
    return this.taskPriorities.get(taskId) || null;
  }

  /**
   * Force priority update for all tasks
   */
  public updateAllPriorities(): void {
    try {
      const now = Date.now();

      for (const taskInfo of this.taskPriorities.values()) {
        this.updateTaskPriority(taskInfo, now);
      }

      // Reorder queues
      this.reorderQueues();

      this.emit('priorities-updated', { taskCount: this.taskPriorities.size });

    } catch (error) {
      this.emit('error', { operation: 'updateAllPriorities', error });
    }
  }

  /**
   * Get queue status
   */
  public getQueueStatus(): Map<MemoryPriority, number> {
    const status = new Map<MemoryPriority, number>();

    for (const [priority, queue] of this.priorityQueues) {
      status.set(priority, queue.length);
    }

    return status;
  }

  /**
   * Configure priority manager
   */
  public updateConfig(newConfig: Partial<PriorityConfig>): void {
    this.config = { ...this.config, ...newConfig };

    if (!this.config.agingEnabled && this.priorityUpdateTimer) {
      clearInterval(this.priorityUpdateTimer);
      this.priorityUpdateTimer = undefined;
    } else if (this.config.agingEnabled && !this.priorityUpdateTimer) {
      this.startPriorityUpdateTimer();
    }

    this.emit('config-updated', this.config);
  }

  /**
   * Shutdown priority manager
   */
  public shutdown(): void {
    if (this.priorityUpdateTimer) {
      clearInterval(this.priorityUpdateTimer);
    }

    this.taskPriorities.clear();
    this.priorityQueues.clear();
    this.schedulingHistory = [];

    this.emit('shutdown');
  }

  // Private methods

  private initializePriorityQueues(): void {
    for (const priority of Object.values(MemoryPriority)) {
      if (typeof priority === 'number') {
        this.priorityQueues.set(priority, []);
      }
    }
  }

  private initializeStats(): SchedulingStats {
    return {
      totalTasks: 0,
      tasksInQueue: new Map(),
      averageWaitTime: new Map(),
      starvationCount: 0,
      priorityPromotions: 0,
      resourceUtilization: this.currentResourceUsage
    };
  }

  private calculateInitialPriority(priority: MemoryPriority): number {
    return this.config.baseWeights[this.priorityToString(priority)] || 50;
  }

  private priorityToString(priority: MemoryPriority): keyof PriorityWeights {
    switch (priority) {
      case MemoryPriority.CRITICAL: return 'critical';
      case MemoryPriority.HIGH: return 'high';
      case MemoryPriority.MEDIUM: return 'medium';
      case MemoryPriority.LOW: return 'low';
      case MemoryPriority.CACHE: return 'cache';
      default: return 'medium';
    }
  }

  private calculateDeadline(task: InfrastructureTask): number | undefined {
    if (!this.config.deadlineAwareness) return undefined;

    // Calculate deadline based on task type and metadata
    const now = Date.now();
    const baseDeadline = {
      'deployment': 30 * 60 * 1000,   // 30 minutes
      'monitoring': 5 * 60 * 1000,    // 5 minutes
      'scaling': 15 * 60 * 1000,      // 15 minutes
      'maintenance': 60 * 60 * 1000,  // 1 hour
      'backup': 2 * 60 * 60 * 1000    // 2 hours
    };

    const deadline = baseDeadline[task.type] || (30 * 60 * 1000);
    return now + deadline;
  }

  private addToQueue(taskInfo: TaskPriorityInfo): void {
    const queue = this.priorityQueues.get(taskInfo.originalPriority);
    if (queue) {
      queue.push(taskInfo);
      this.sortQueue(taskInfo.originalPriority);
    }
  }

  private removeFromQueue(taskInfo: TaskPriorityInfo): void {
    const queue = this.priorityQueues.get(taskInfo.originalPriority);
    if (queue) {
      const index = queue.findIndex(t => t.taskId === taskInfo.taskId);
      if (index !== -1) {
        queue.splice(index, 1);
      }
    }
  }

  private sortQueue(priority: MemoryPriority): void {
    const queue = this.priorityQueues.get(priority);
    if (queue) {
      queue.sort((a, b) => b.currentPriority - a.currentPriority);
    }
  }

  private reorderQueues(): void {
    for (const priority of this.priorityQueues.keys()) {
      this.sortQueue(priority);
    }
  }

  private getCandidateTasks(availableResources: ResourceUtilization): TaskPriorityInfo[] {
    const candidates: TaskPriorityInfo[] = [];

    // Get tasks from all queues that can fit in available resources
    for (const queue of this.priorityQueues.values()) {
      for (const taskInfo of queue) {
        if (this.canExecuteWithResources(taskInfo, availableResources)) {
          candidates.push(taskInfo);
        }
      }
    }

    return candidates;
  }

  private canExecuteWithResources(taskInfo: TaskPriorityInfo, availableResources: ResourceUtilization): boolean {
    if (!this.config.resourceAwareness) return true;

    const req = taskInfo.resourceRequirements;
    const available = availableResources;

    return (
      available.memory >= req.memory &&
      available.cpu >= req.cpu &&
      available.disk >= req.disk &&
      available.network >= req.network
    );
  }

  private calculateSchedulingScore(taskInfo: TaskPriorityInfo, availableResources: ResourceUtilization): number {
    let score = taskInfo.currentPriority;

    // Age-based scoring
    if (this.config.agingEnabled) {
      const age = Date.now() - taskInfo.submissionTime;
      const agingBonus = (age / 1000) * this.config.agingFactor;
      score += agingBonus;
    }

    // Deadline-based scoring
    if (this.config.deadlineAwareness && taskInfo.deadline) {
      const timeToDeadline = taskInfo.deadline - Date.now();
      if (timeToDeadline < 60000) { // Less than 1 minute
        score += 50; // Urgency bonus
      } else if (timeToDeadline < 300000) { // Less than 5 minutes
        score += 25;
      }
    }

    // Starvation prevention
    if (this.config.starvationPrevention) {
      score += taskInfo.starvationScore;
    }

    // Resource efficiency bonus
    if (this.config.resourceAwareness) {
      const efficiency = this.calculateResourceEfficiency(taskInfo, availableResources);
      score += efficiency * 10;
    }

    // Success rate bonus
    score += taskInfo.executionHistory.successRate * 20;

    return Math.max(0, score);
  }

  private calculateResourceEfficiency(taskInfo: TaskPriorityInfo, availableResources: ResourceUtilization): number {
    const req = taskInfo.resourceRequirements;
    const available = availableResources;

    // Calculate utilization percentage
    const memoryUtil = req.memory / (available.memory || 1);
    const cpuUtil = req.cpu / (available.cpu || 1);
    const diskUtil = req.disk / (available.disk || 1);
    const networkUtil = req.network / (available.network || 1);

    // Prefer tasks that use resources efficiently (not too high, not too low)
    const avgUtil = (memoryUtil + cpuUtil + diskUtil + networkUtil) / 4;

    // Optimal utilization is around 60-80%
    if (avgUtil >= 0.6 && avgUtil <= 0.8) {
      return 1.0; // Perfect efficiency
    } else if (avgUtil < 0.6) {
      return avgUtil / 0.6; // Lower efficiency for underutilization
    } else {
      return 0.8 / avgUtil; // Lower efficiency for overutilization
    }
  }

  private calculateResourceImpact(taskInfo: TaskPriorityInfo, availableResources: ResourceUtilization): ResourceImpact {
    const req = taskInfo.resourceRequirements;

    return {
      memoryDelta: req.memory,
      cpuDelta: req.cpu,
      diskDelta: req.disk,
      networkDelta: req.network,
      estimatedCompletionTime: Date.now() + req.estimatedDuration
    };
  }

  private generateSchedulingReason(taskInfo: TaskPriorityInfo, score: number): string {
    const reasons: string[] = [];

    if (taskInfo.originalPriority === MemoryPriority.CRITICAL) {
      reasons.push('critical priority');
    }

    if (taskInfo.deadline && (taskInfo.deadline - Date.now()) < 300000) {
      reasons.push('approaching deadline');
    }

    if (taskInfo.starvationScore > 20) {
      reasons.push('starvation prevention');
    }

    if (taskInfo.executionHistory.successRate > 0.9) {
      reasons.push('high success rate');
    }

    if (reasons.length === 0) {
      reasons.push('highest combined score');
    }

    return `Selected due to: ${reasons.join(', ')} (score: ${score.toFixed(2)})`;
  }

  private updateTaskPriority(taskInfo: TaskPriorityInfo, now: number): void {
    let newPriority = taskInfo.currentPriority;

    // Age-based priority increase
    if (this.config.agingEnabled) {
      const age = now - taskInfo.submissionTime;
      const agingBonus = (age / 1000) * this.config.agingFactor;
      newPriority += agingBonus;
    }

    // Starvation detection and prevention
    if (this.config.starvationPrevention) {
      const waitTime = now - taskInfo.submissionTime;
      if (waitTime > this.config.maxStarvationTime) {
        taskInfo.starvationScore += 5; // Increase starvation score
        this.stats.starvationCount++;
      }
    }

    // Priority promotion for long-waiting tasks
    if (newPriority > taskInfo.currentPriority) {
      this.stats.priorityPromotions++;
    }

    taskInfo.currentPriority = newPriority;
    taskInfo.lastPriorityUpdate = now;
  }

  private updateStats(): void {
    this.stats.totalTasks = this.taskPriorities.size;

    // Update queue counts
    this.stats.tasksInQueue.clear();
    for (const [priority, queue] of this.priorityQueues) {
      this.stats.tasksInQueue.set(priority, queue.length);
    }

    // Calculate average wait times
    const now = Date.now();
    this.stats.averageWaitTime.clear();

    for (const [priority, queue] of this.priorityQueues) {
      if (queue.length > 0) {
        const totalWaitTime = queue.reduce((sum, task) => sum + (now - task.submissionTime), 0);
        this.stats.averageWaitTime.set(priority, totalWaitTime / queue.length);
      }
    }

    this.stats.resourceUtilization = this.currentResourceUsage;
  }

  private startPriorityUpdateTimer(): void {
    if (this.config.agingEnabled) {
      this.priorityUpdateTimer = setInterval(() => {
        this.updateAllPriorities();
      }, TaskPriorityManager.PRIORITY_UPDATE_INTERVAL);
    }
  }
}

export default TaskPriorityManager;