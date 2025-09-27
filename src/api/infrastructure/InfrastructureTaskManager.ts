import { EventEmitter } from 'events';
import { MemoryPriority } from '../../princesses/infrastructure/memory/LangroidMemoryBackend';

/**
 * Infrastructure Task Manager
 * Manages infrastructure tasks with priority-based scheduling,
 * resource allocation, and comprehensive task lifecycle management.
 */
export interface InfrastructureTask {
  id: string;
  type: 'deployment' | 'monitoring' | 'scaling' | 'maintenance' | 'backup';
  priority: MemoryPriority;
  payload: any;
  metadata: Record<string, any>;
  ttl?: number;
  tags: string[];
  submittedAt: number;
  estimatedStartTime?: number;
  startTime?: number;
  endTime?: number;
  status: TaskStatus;
  progress: number;
  result?: any;
  error?: string;
  retryCount: number;
  maxRetries: number;
}

export enum TaskStatus {
  PENDING = 'pending',
  QUEUED = 'queued',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired'
}

export interface TaskManagerStats {
  activeTasks: number;
  queuedTasks: number;
  completedTasks: number;
  failedTasks: number;
  cancelledTasks: number;
  throughputPerHour: number;
  averageExecutionTime: number;
  queueWaitTime: number;
}

export interface ResourceLimits {
  maxConcurrentTasks: number;
  maxQueueSize: number;
  maxMemoryUsage: number;
  maxCpuUsage: number;
}

export interface TaskExecutor {
  canExecute(task: InfrastructureTask): boolean;
  execute(task: InfrastructureTask): Promise<any>;
  getEstimatedDuration(task: InfrastructureTask): number;
  getResourceRequirements(task: InfrastructureTask): { memory: number; cpu: number };
}

export class InfrastructureTaskManager extends EventEmitter {
  private static readonly DEFAULT_MAX_CONCURRENT = 10;
  private static readonly DEFAULT_MAX_QUEUE_SIZE = 1000;
  private static readonly DEFAULT_MAX_RETRIES = 3;
  private static readonly CLEANUP_INTERVAL = 30 * 60 * 1000; // 30 minutes

  private tasks: Map<string, InfrastructureTask> = new Map();
  private taskQueue: InfrastructureTask[] = [];
  private runningTasks: Map<string, InfrastructureTask> = new Map();
  private completedTasks: Map<string, InfrastructureTask> = new Map();
  private failedTasks: Map<string, InfrastructureTask> = new Map();

  private executors: Map<string, TaskExecutor> = new Map();
  private resourceLimits: ResourceLimits;

  private startTime: number;
  private totalExecutedTasks: number = 0;
  private cleanupTimer?: NodeJS.Timeout;

  private currentResourceUsage = {
    memory: 0,
    cpu: 0
  };

  constructor(resourceLimits?: Partial<ResourceLimits>) {
    super();

    this.resourceLimits = {
      maxConcurrentTasks: resourceLimits?.maxConcurrentTasks ?? InfrastructureTaskManager.DEFAULT_MAX_CONCURRENT,
      maxQueueSize: resourceLimits?.maxQueueSize ?? InfrastructureTaskManager.DEFAULT_MAX_QUEUE_SIZE,
      maxMemoryUsage: resourceLimits?.maxMemoryUsage ?? 80, // 80% of available memory
      maxCpuUsage: resourceLimits?.maxCpuUsage ?? 70 // 70% of available CPU
    };

    this.startTime = Date.now();
    this.initializeExecutors();
    this.startCleanupTimer();
    this.startTaskProcessor();
  }

  /**
   * Submit a new infrastructure task
   */
  public async submitTask(taskData: Omit<InfrastructureTask, 'submittedAt' | 'status' | 'progress' | 'retryCount' | 'maxRetries'>): Promise<InfrastructureTask> {
    try {
      const task: InfrastructureTask = {
        ...taskData,
        submittedAt: Date.now(),
        status: TaskStatus.PENDING,
        progress: 0,
        retryCount: 0,
        maxRetries: InfrastructureTaskManager.DEFAULT_MAX_RETRIES
      };

      // Check queue size limit
      if (this.taskQueue.length >= this.resourceLimits.maxQueueSize) {
        throw new Error('Task queue is full. Please try again later.');
      }

      // Validate task
      this.validateTask(task);

      // Calculate estimated start time
      task.estimatedStartTime = this.calculateEstimatedStartTime(task);

      // Store task
      this.tasks.set(task.id, task);

      // Add to queue based on priority
      this.addToQueue(task);

      this.emit('task-submitted', task);

      return task;

    } catch (error) {
      this.emit('task-submission-failed', { taskData, error });
      throw error;
    }
  }

  /**
   * Get task status
   */
  public async getTaskStatus(taskId: string): Promise<InfrastructureTask | null> {
    return this.tasks.get(taskId) || null;
  }

  /**
   * Cancel a task
   */
  public async cancelTask(taskId: string): Promise<boolean> {
    try {
      const task = this.tasks.get(taskId);
      if (!task) return false;

      if (task.status === TaskStatus.COMPLETED ||
          task.status === TaskStatus.FAILED ||
          task.status === TaskStatus.CANCELLED) {
        return false; // Cannot cancel completed/failed/cancelled tasks
      }

      if (task.status === TaskStatus.RUNNING) {
        // Task is running, attempt graceful cancellation
        task.status = TaskStatus.CANCELLED;
        task.endTime = Date.now();
        this.runningTasks.delete(taskId);
        this.emit('task-cancelled', task);
      } else {
        // Task is queued, remove from queue
        task.status = TaskStatus.CANCELLED;
        task.endTime = Date.now();
        this.removeFromQueue(taskId);
        this.emit('task-cancelled', task);
      }

      return true;

    } catch (error) {
      this.emit('error', { operation: 'cancelTask', taskId, error });
      return false;
    }
  }

  /**
   * Get task manager statistics
   */
  public getStats(): TaskManagerStats {
    const now = Date.now();
    const uptimeHours = (now - this.startTime) / (1000 * 60 * 60);

    const completedTasksArray = Array.from(this.completedTasks.values());
    const averageExecutionTime = completedTasksArray.length > 0
      ? completedTasksArray.reduce((sum, task) => {
          return sum + ((task.endTime || now) - (task.startTime || task.submittedAt));
        }, 0) / completedTasksArray.length
      : 0;

    const queuedTasksArray = this.taskQueue.filter(task => task.status === TaskStatus.QUEUED);
    const queueWaitTime = queuedTasksArray.length > 0
      ? queuedTasksArray.reduce((sum, task) => {
          return sum + (now - task.submittedAt);
        }, 0) / queuedTasksArray.length
      : 0;

    return {
      activeTasks: this.runningTasks.size,
      queuedTasks: this.taskQueue.length,
      completedTasks: this.completedTasks.size,
      failedTasks: this.failedTasks.size,
      cancelledTasks: Array.from(this.tasks.values()).filter(t => t.status === TaskStatus.CANCELLED).length,
      throughputPerHour: uptimeHours > 0 ? this.totalExecutedTasks / uptimeHours : 0,
      averageExecutionTime,
      queueWaitTime
    };
  }

  /**
   * Clean up completed tasks
   */
  public async cleanupCompletedTasks(olderThanMs: number = 24 * 60 * 60 * 1000): Promise<number> {
    try {
      const cutoffTime = Date.now() - olderThanMs;
      let cleanedCount = 0;

      // Clean completed tasks
      for (const [taskId, task] of this.completedTasks) {
        if ((task.endTime || task.submittedAt) < cutoffTime) {
          this.completedTasks.delete(taskId);
          this.tasks.delete(taskId);
          cleanedCount++;
        }
      }

      // Clean failed tasks
      for (const [taskId, task] of this.failedTasks) {
        if ((task.endTime || task.submittedAt) < cutoffTime) {
          this.failedTasks.delete(taskId);
          this.tasks.delete(taskId);
          cleanedCount++;
        }
      }

      this.emit('cleanup-completed', { cleanedCount });
      return cleanedCount;

    } catch (error) {
      this.emit('error', { operation: 'cleanupCompletedTasks', error });
      return 0;
    }
  }

  /**
   * Register task executor
   */
  public registerExecutor(taskType: string, executor: TaskExecutor): void {
    this.executors.set(taskType, executor);
    this.emit('executor-registered', { taskType });
  }

  /**
   * Get uptime in milliseconds
   */
  public getUptimeMs(): number {
    return Date.now() - this.startTime;
  }

  /**
   * Update resource usage
   */
  public updateResourceUsage(memory: number, cpu: number): void {
    this.currentResourceUsage = { memory, cpu };
    this.emit('resource-usage-updated', this.currentResourceUsage);
  }

  /**
   * Shutdown task manager
   */
  public async shutdown(): Promise<void> {
    try {
      if (this.cleanupTimer) {
        clearInterval(this.cleanupTimer);
      }

      // Cancel all running tasks
      for (const task of this.runningTasks.values()) {
        await this.cancelTask(task.id);
      }

      // Clear queued tasks
      for (const task of this.taskQueue) {
        task.status = TaskStatus.CANCELLED;
        task.endTime = Date.now();
      }

      this.emit('shutdown');

    } catch (error) {
      this.emit('error', { operation: 'shutdown', error });
    }
  }

  // Private methods

  private validateTask(task: InfrastructureTask): void {
    if (!task.id || !task.type || !task.payload) {
      throw new Error('Task must have id, type, and payload');
    }

    if (!this.executors.has(task.type)) {
      throw new Error(`No executor registered for task type: ${task.type}`);
    }

    const executor = this.executors.get(task.type)!;
    if (!executor.canExecute(task)) {
      throw new Error(`Task cannot be executed: ${task.type}`);
    }
  }

  private calculateEstimatedStartTime(task: InfrastructureTask): number {
    const executor = this.executors.get(task.type);
    if (!executor) return Date.now();

    // Calculate based on queue position and estimated execution times
    let estimatedWaitTime = 0;
    let position = 0;

    // Count higher priority tasks
    for (const queuedTask of this.taskQueue) {
      if (queuedTask.priority >= task.priority) {
        const taskExecutor = this.executors.get(queuedTask.type);
        if (taskExecutor) {
          estimatedWaitTime += taskExecutor.getEstimatedDuration(queuedTask);
          position++;
        }
      }
    }

    // Add running tasks completion time
    for (const runningTask of this.runningTasks.values()) {
      const taskExecutor = this.executors.get(runningTask.type);
      if (taskExecutor) {
        const estimatedRemaining = taskExecutor.getEstimatedDuration(runningTask) * (1 - runningTask.progress / 100);
        estimatedWaitTime += Math.max(0, estimatedRemaining);
      }
    }

    return Date.now() + estimatedWaitTime;
  }

  private addToQueue(task: InfrastructureTask): void {
    task.status = TaskStatus.QUEUED;

    // Insert based on priority
    let insertIndex = this.taskQueue.length;
    for (let i = 0; i < this.taskQueue.length; i++) {
      if (this.taskQueue[i].priority < task.priority) {
        insertIndex = i;
        break;
      }
    }

    this.taskQueue.splice(insertIndex, 0, task);
    this.emit('task-queued', { task, position: insertIndex });
  }

  private removeFromQueue(taskId: string): void {
    const index = this.taskQueue.findIndex(task => task.id === taskId);
    if (index !== -1) {
      this.taskQueue.splice(index, 1);
    }
  }

  private startTaskProcessor(): void {
    setInterval(async () => {
      await this.processQueue();
    }, 1000); // Check every second
  }

  private async processQueue(): Promise<void> {
    try {
      // Check if we can start more tasks
      if (this.runningTasks.size >= this.resourceLimits.maxConcurrentTasks) {
        return;
      }

      // Check resource constraints
      if (this.currentResourceUsage.memory > this.resourceLimits.maxMemoryUsage ||
          this.currentResourceUsage.cpu > this.resourceLimits.maxCpuUsage) {
        return;
      }

      // Get next task from queue
      const nextTask = this.getNextExecutableTask();
      if (!nextTask) return;

      // Start executing the task
      await this.executeTask(nextTask);

    } catch (error) {
      this.emit('error', { operation: 'processQueue', error });
    }
  }

  private getNextExecutableTask(): InfrastructureTask | null {
    for (let i = 0; i < this.taskQueue.length; i++) {
      const task = this.taskQueue[i];
      const executor = this.executors.get(task.type);

      if (executor && executor.canExecute(task)) {
        // Check resource requirements
        const requirements = executor.getResourceRequirements(task);
        if (this.currentResourceUsage.memory + requirements.memory <= this.resourceLimits.maxMemoryUsage &&
            this.currentResourceUsage.cpu + requirements.cpu <= this.resourceLimits.maxCpuUsage) {

          // Remove from queue and return
          this.taskQueue.splice(i, 1);
          return task;
        }
      }
    }

    return null;
  }

  private async executeTask(task: InfrastructureTask): Promise<void> {
    try {
      const executor = this.executors.get(task.type)!;

      // Update task status
      task.status = TaskStatus.RUNNING;
      task.startTime = Date.now();
      this.runningTasks.set(task.id, task);

      this.emit('task-started', task);

      // Execute the task
      const result = await executor.execute(task);

      // Task completed successfully
      task.status = TaskStatus.COMPLETED;
      task.endTime = Date.now();
      task.progress = 100;
      task.result = result;

      this.runningTasks.delete(task.id);
      this.completedTasks.set(task.id, task);
      this.totalExecutedTasks++;

      this.emit('task-completed', task);

    } catch (error) {
      // Task failed
      task.status = TaskStatus.FAILED;
      task.endTime = Date.now();
      task.error = error instanceof Error ? error.message : String(error);
      task.retryCount++;

      this.runningTasks.delete(task.id);

      // Retry if possible
      if (task.retryCount < task.maxRetries) {
        task.status = TaskStatus.PENDING;
        this.addToQueue(task);
        this.emit('task-retry', task);
      } else {
        this.failedTasks.set(task.id, task);
        this.emit('task-failed', task);
      }
    }
  }

  private initializeExecutors(): void {
    // Register default executors for each task type
    this.registerExecutor('deployment', new DefaultTaskExecutor('deployment'));
    this.registerExecutor('monitoring', new DefaultTaskExecutor('monitoring'));
    this.registerExecutor('scaling', new DefaultTaskExecutor('scaling'));
    this.registerExecutor('maintenance', new DefaultTaskExecutor('maintenance'));
    this.registerExecutor('backup', new DefaultTaskExecutor('backup'));
  }

  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(async () => {
      await this.cleanupCompletedTasks();
    }, InfrastructureTaskManager.CLEANUP_INTERVAL);
  }
}

/**
 * Default task executor implementation
 */
class DefaultTaskExecutor implements TaskExecutor {
  constructor(private taskType: string) {}

  canExecute(task: InfrastructureTask): boolean {
    return task.type === this.taskType && task.payload !== null;
  }

  async execute(task: InfrastructureTask): Promise<any> {
    // Simulate task execution
    const duration = this.getEstimatedDuration(task);

    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          taskId: task.id,
          type: task.type,
          executedAt: Date.now(),
          duration,
          result: `${task.type} task completed successfully`
        });
      }, duration);
    });
  }

  getEstimatedDuration(task: InfrastructureTask): number {
    // Base duration by task type
    const baseDurations = {
      deployment: 30000,  // 30 seconds
      monitoring: 5000,   // 5 seconds
      scaling: 15000,     // 15 seconds
      maintenance: 60000, // 1 minute
      backup: 120000      // 2 minutes
    };

    const base = baseDurations[task.type as keyof typeof baseDurations] || 10000;

    // Adjust based on priority
    const priorityMultiplier = task.priority === MemoryPriority.CRITICAL ? 0.5 : 1.0;

    return Math.floor(base * priorityMultiplier);
  }

  getResourceRequirements(task: InfrastructureTask): { memory: number; cpu: number } {
    const baseRequirements = {
      deployment: { memory: 15, cpu: 20 },
      monitoring: { memory: 5, cpu: 10 },
      scaling: { memory: 10, cpu: 15 },
      maintenance: { memory: 20, cpu: 25 },
      backup: { memory: 25, cpu: 30 }
    };

    return baseRequirements[task.type as keyof typeof baseRequirements] || { memory: 10, cpu: 15 };
  }
}

export default InfrastructureTaskManager;