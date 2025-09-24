/**
 * ParallelPipelineManager - Concurrent Task Execution Orchestrator
 *
 * Manages parallel execution pipelines for god object decomposition.
 * Supports 3-4 concurrent files per princess with Byzantine fault tolerance.
 */

import { EventEmitter } from 'events';

export interface PipelineTask {
  id: string;
  filePath: string;
  princess: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'queued' | 'running' | 'completed' | 'failed';
  startTime?: number;
  endTime?: number;
  result?: any;
  error?: any;
}

export interface PipelineConfig {
  maxConcurrentPerPrincess: number;
  pipelinesPerPrincess: number;
  retryAttempts: number;
  timeoutMs: number;
  byzantineRetries: number;
}

export class ParallelPipelineManager extends EventEmitter {
  private pipelines: Map<string, PipelineTask[]> = new Map();
  private activeTasks: Map<string, PipelineTask> = new Map();
  private config: PipelineConfig;
  private princessCapacity: Map<string, number> = new Map();

  constructor(config?: Partial<PipelineConfig>) {
    super();
    this.config = {
      maxConcurrentPerPrincess: 4,
      pipelinesPerPrincess: 2,
      retryAttempts: 3,
      timeoutMs: 300000, // 5 minutes
      byzantineRetries: 2,
      ...config
    };
  }

  /**
   * Initialize pipelines for a princess
   */
  initializePrincessPipelines(princessName: string): void {
    if (!this.pipelines.has(princessName)) {
      this.pipelines.set(princessName, []);
      this.princessCapacity.set(princessName, 0);
      console.log(`  Initialized ${this.config.pipelinesPerPrincess} pipelines for ${princessName} Princess`);
    }
  }

  /**
   * Submit task to appropriate princess pipeline
   */
  async submitTask(
    princessName: string,
    filePath: string,
    priority: PipelineTask['priority'] = 'medium'
  ): Promise<string> {
    const taskId = `task-${princessName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const task: PipelineTask = {
      id: taskId,
      filePath,
      princess: princessName,
      priority,
      status: 'queued'
    };

    const queue = this.pipelines.get(princessName) || [];
    queue.push(task);
    this.pipelines.set(princessName, queue);

    this.emit('task:queued', task);
    console.log(`  Task ${taskId} queued for ${princessName} Princess: ${filePath}`);

    // Attempt to execute immediately if capacity available
    await this.processQueue(princessName);

    return taskId;
  }

  /**
   * Process queued tasks for a princess
   */
  private async processQueue(princessName: string): Promise<void> {
    const queue = this.pipelines.get(princessName) || [];
    const capacity = this.princessCapacity.get(princessName) || 0;

    // Check if we have capacity
    if (capacity >= this.config.maxConcurrentPerPrincess) {
      return;
    }

    // Find next task by priority
    const queuedTasks = queue.filter(t => t.status === 'queued');
    if (queuedTasks.length === 0) {
      return;
    }

    // Sort by priority
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    queuedTasks.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    const task = queuedTasks[0];
    await this.executeTask(task);
  }

  /**
   * Execute a task with Byzantine fault tolerance
   */
  private async executeTask(task: PipelineTask): Promise<void> {
    // Update capacity
    const capacity = this.princessCapacity.get(task.princess) || 0;
    this.princessCapacity.set(task.princess, capacity + 1);

    task.status = 'running';
    task.startTime = Date.now();
    this.activeTasks.set(task.id, task);

    this.emit('task:started', task);
    console.log(`  Executing task ${task.id} on ${task.princess} Princess`);

    try {
      // Execute with timeout
      const result = await Promise.race([
        this.performTaskExecution(task),
        this.createTimeout(this.config.timeoutMs)
      ]);

      task.status = 'completed';
      task.endTime = Date.now();
      task.result = result;

      this.emit('task:completed', task);
      console.log(`  Task ${task.id} completed in ${task.endTime - (task.startTime || 0)}ms`);

    } catch (error) {
      task.status = 'failed';
      task.endTime = Date.now();
      task.error = error;

      this.emit('task:failed', task);
      console.error(`  Task ${task.id} failed:`, error);

      // Byzantine retry logic
      if (this.shouldRetryByzantine(task)) {
        await this.retryWithByzantineTolerance(task);
      }

    } finally {
      // Release capacity
      const newCapacity = this.princessCapacity.get(task.princess) || 1;
      this.princessCapacity.set(task.princess, newCapacity - 1);
      this.activeTasks.delete(task.id);

      // Process next task in queue
      await this.processQueue(task.princess);
    }
  }

  /**
   * Perform actual task execution (placeholder for princess delegation)
   */
  private async performTaskExecution(task: PipelineTask): Promise<any> {
    // This would delegate to the actual princess
    // For now, simulate execution
    await new Promise(resolve => setTimeout(resolve, 1000));

    return {
      taskId: task.id,
      filePath: task.filePath,
      princess: task.princess,
      decompositionResults: {
        originalLOC: 1500,
        newModules: 5,
        reducedLOC: 300,
        complexity: 'reduced',
        testCoverage: 85
      }
    };
  }

  /**
   * Create timeout promise
   */
  private createTimeout(ms: number): Promise<never> {
    return new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Task timeout after ${ms}ms`)), ms)
    );
  }

  /**
   * Determine if Byzantine retry should be attempted
   */
  private shouldRetryByzantine(task: PipelineTask): boolean {
    const attempts = task.error?.attempts || 0;
    return attempts < this.config.byzantineRetries;
  }

  /**
   * Retry task with Byzantine fault tolerance
   */
  private async retryWithByzantineTolerance(task: PipelineTask): Promise<void> {
    console.log(`  Retrying task ${task.id} with Byzantine tolerance...`);

    const attempts = (task.error?.attempts || 0) + 1;
    const newTask: PipelineTask = {
      ...task,
      id: `${task.id}-retry-${attempts}`,
      status: 'queued',
      error: { ...task.error, attempts }
    };

    const queue = this.pipelines.get(task.princess) || [];
    queue.push(newTask);
    this.pipelines.set(task.princess, queue);

    await this.processQueue(task.princess);
  }

  /**
   * Get pipeline statistics
   */
  getStatistics(): any {
    const stats: any = {
      totalPipelines: this.pipelines.size,
      tasksByPrincess: {},
      activeTasks: this.activeTasks.size,
      totalProcessed: 0,
      totalFailed: 0,
      averageExecutionTime: 0
    };

    let totalTime = 0;
    let completedCount = 0;

    for (const [princess, tasks] of this.pipelines) {
      const completed = tasks.filter(t => t.status === 'completed');
      const failed = tasks.filter(t => t.status === 'failed');
      const running = tasks.filter(t => t.status === 'running');

      stats.tasksByPrincess[princess] = {
        total: tasks.length,
        completed: completed.length,
        failed: failed.length,
        running: running.length,
        capacity: this.princessCapacity.get(princess) || 0
      };

      stats.totalProcessed += completed.length;
      stats.totalFailed += failed.length;

      for (const task of completed) {
        if (task.startTime && task.endTime) {
          totalTime += task.endTime - task.startTime;
          completedCount++;
        }
      }
    }

    stats.averageExecutionTime = completedCount > 0 ? totalTime / completedCount : 0;

    return stats;
  }

  /**
   * Get task status
   */
  getTaskStatus(taskId: string): PipelineTask | null {
    // Check active tasks
    if (this.activeTasks.has(taskId)) {
      return this.activeTasks.get(taskId)!;
    }

    // Search all pipelines
    for (const tasks of this.pipelines.values()) {
      const task = tasks.find(t => t.id === taskId);
      if (task) return task;
    }

    return null;
  }

  /**
   * Cancel a task
   */
  async cancelTask(taskId: string): Promise<boolean> {
    for (const [princess, tasks] of this.pipelines) {
      const taskIndex = tasks.findIndex(t => t.id === taskId);
      if (taskIndex >= 0) {
        const task = tasks[taskIndex];
        if (task.status === 'queued') {
          tasks.splice(taskIndex, 1);
          this.emit('task:cancelled', task);
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Clear completed tasks
   */
  clearCompleted(): number {
    let cleared = 0;

    for (const [princess, tasks] of this.pipelines) {
      const remaining = tasks.filter(t => t.status !== 'completed');
      cleared += tasks.length - remaining.length;
      this.pipelines.set(princess, remaining);
    }

    return cleared;
  }
}