/**
 * Unified Orchestration Hub
 * Centralized task scheduling, resource management, and orchestrator coordination
 * Reduces duplication across all orchestrator implementations
 */

import { EventEmitter } from 'events';
import { OrchestratorTransitionHub } from './OrchestratorTransitionHub';
import { OrchestratorBase } from './OrchestratorBase';
import { OrchestratorState } from './OrchestratorStates';

export interface TaskRequest {
  readonly taskId: string;
  readonly type: string;
  readonly priority: number;
  readonly estimatedDuration: number;
  readonly requiredResources: string[];
  readonly payload: any;
}

export interface ResourceDefinition {
  readonly resourceId: string;
  readonly type: string;
  readonly capacity: number;
  readonly location?: string;
  readonly constraints?: Record<string, any>;
}

export interface SchedulingStrategy {
  readonly name: string;
  readonly algorithm: 'fifo' | 'priority' | 'shortest_job_first' | 'round_robin' | 'load_balanced';
  readonly parameters: Record<string, any>;
}

export interface OrchestrationMetrics {
  readonly totalOrchestrators: number;
  readonly activeOrchestrators: number;
  readonly totalTasks: number;
  readonly completedTasks: number;
  readonly failedTasks: number;
  readonly averageTaskTime: number;
  readonly resourceUtilization: number;
  readonly throughput: number;
}

export class OrchestrationHub extends EventEmitter {
  private readonly transitionHub = new OrchestratorTransitionHub();
  private readonly orchestrators = new Map<string, OrchestratorBase>();
  private readonly taskQueue: TaskRequest[] = [];
  private readonly resources = new Map<string, ResourceDefinition>();
  private readonly schedulingStrategy: SchedulingStrategy;

  private readonly taskHistory: TaskRequest[] = [];
  private readonly metrics = {
    totalTasks: 0,
    completedTasks: 0,
    failedTasks: 0,
    totalTaskTime: 0,
    startTime: Date.now()
  };

  constructor(strategy: SchedulingStrategy = { name: 'default', algorithm: 'priority', parameters: {} }) {
    super();
    this.schedulingStrategy = strategy;
    this.startMetricsCollection();
  }

  public registerOrchestrator(orchestrator: OrchestratorBase): void {
    const orchestratorId = orchestrator['config'].orchestratorId;
    this.orchestrators.set(orchestratorId, orchestrator);

    // Listen to orchestrator events
    orchestrator.on('taskCompleted', (task) => this.handleTaskCompleted(orchestratorId, task));
    orchestrator.on('taskFailed', (task) => this.handleTaskFailed(orchestratorId, task));
    orchestrator.on('resourceRequest', (request) => this.handleResourceRequest(orchestratorId, request));

    this.emit('orchestratorRegistered', orchestratorId);
  }

  public unregisterOrchestrator(orchestratorId: string): void {
    const orchestrator = this.orchestrators.get(orchestratorId);
    if (orchestrator) {
      orchestrator.dispose();
      this.orchestrators.delete(orchestratorId);
      this.emit('orchestratorUnregistered', orchestratorId);
    }
  }

  public submitTask(task: TaskRequest): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        this.taskQueue.push(task);
        this.taskHistory.push(task);
        this.metrics.totalTasks++;

        this.emit('taskSubmitted', task);
        this.scheduleNextTask();

        resolve(task.taskId);
      } catch (error) {
        reject(error);
      }
    });
  }

  private scheduleNextTask(): void {
    if (this.taskQueue.length === 0) {
      return;
    }

    const availableOrchestrator = this.findAvailableOrchestrator();
    if (!availableOrchestrator) {
      return; // No available orchestrators
    }

    const task = this.selectNextTask();
    if (!task) {
      return;
    }

    const taskIndex = this.taskQueue.indexOf(task);
    if (taskIndex > -1) {
      this.taskQueue.splice(taskIndex, 1);
    }

    this.assignTaskToOrchestrator(task, availableOrchestrator);
  }

  private selectNextTask(): TaskRequest | null {
    if (this.taskQueue.length === 0) {
      return null;
    }

    switch (this.schedulingStrategy.algorithm) {
      case 'priority':
        return this.taskQueue.reduce((highest, current) =>
          current.priority > highest.priority ? current : highest
        );

      case 'shortest_job_first':
        return this.taskQueue.reduce((shortest, current) =>
          current.estimatedDuration < shortest.estimatedDuration ? current : shortest
        );

      case 'fifo':
      default:
        return this.taskQueue[0];
    }
  }

  private findAvailableOrchestrator(): OrchestratorBase | null {
    for (const orchestrator of this.orchestrators.values()) {
      const state = this.transitionHub.getCurrentState(orchestrator['config'].orchestratorId);
      if (state === OrchestratorState.IDLE) {
        return orchestrator;
      }
    }
    return null;
  }

  private assignTaskToOrchestrator(task: TaskRequest, orchestrator: OrchestratorBase): void {
    const orchestratorId = orchestrator['config'].orchestratorId;

    // Check resource availability
    if (!this.areResourcesAvailable(task.requiredResources)) {
      // Put task back in queue
      this.taskQueue.push(task);
      return;
    }

    // Allocate resources
    this.allocateResources(task.requiredResources, orchestratorId);

    // Start orchestrator with task
    orchestrator.start(task).catch(error => {
      this.handleTaskFailed(orchestratorId, { ...task, error: error.message });
    });

    this.emit('taskAssigned', task, orchestratorId);
  }

  public registerResource(resource: ResourceDefinition): void {
    this.resources.set(resource.resourceId, resource);
    this.emit('resourceRegistered', resource);
  }

  public unregisterResource(resourceId: string): void {
    this.resources.delete(resourceId);
    this.emit('resourceUnregistered', resourceId);
  }

  private areResourcesAvailable(requiredResources: string[]): boolean {
    return requiredResources.every(resourceId => {
      const resource = this.resources.get(resourceId);
      return resource && resource.capacity > 0;
    });
  }

  private allocateResources(resourceIds: string[], orchestratorId: string): void {
    for (const resourceId of resourceIds) {
      const resource = this.resources.get(resourceId);
      if (resource) {
        // Reduce capacity by 1 (simple allocation model)
        const updatedResource = { ...resource, capacity: resource.capacity - 1 };
        this.resources.set(resourceId, updatedResource);
      }
    }
  }

  private releaseResources(resourceIds: string[], orchestratorId: string): void {
    for (const resourceId of resourceIds) {
      const resource = this.resources.get(resourceId);
      if (resource) {
        // Increase capacity by 1
        const updatedResource = { ...resource, capacity: resource.capacity + 1 };
        this.resources.set(resourceId, updatedResource);
      }
    }
  }

  private handleTaskCompleted(orchestratorId: string, task: any): void {
    this.metrics.completedTasks++;
    if (task.duration) {
      this.metrics.totalTaskTime += task.duration;
    }

    // Release resources
    if (task.requiredResources) {
      this.releaseResources(task.requiredResources, orchestratorId);
    }

    this.emit('taskCompleted', task, orchestratorId);
    this.scheduleNextTask(); // Try to schedule next task
  }

  private handleTaskFailed(orchestratorId: string, task: any): void {
    this.metrics.failedTasks++;

    // Release resources
    if (task.requiredResources) {
      this.releaseResources(task.requiredResources, orchestratorId);
    }

    this.emit('taskFailed', task, orchestratorId);
    this.scheduleNextTask(); // Try to schedule next task
  }

  private handleResourceRequest(orchestratorId: string, request: any): void {
    // Handle dynamic resource requests
    this.emit('resourceRequested', request, orchestratorId);
  }

  public getOrchestrationMetrics(): OrchestrationMetrics {
    const activeOrchestrators = Array.from(this.orchestrators.values())
      .filter(o => {
        const state = this.transitionHub.getCurrentState(o['config'].orchestratorId);
        return state !== OrchestratorState.IDLE && state !== OrchestratorState.ERROR;
      }).length;

    const averageTaskTime = this.metrics.completedTasks > 0
      ? this.metrics.totalTaskTime / this.metrics.completedTasks
      : 0;

    const totalCapacity = Array.from(this.resources.values())
      .reduce((sum, r) => sum + r.capacity, 0);
    const usedCapacity = Array.from(this.resources.values())
      .filter(r => r.capacity === 0).length;
    const resourceUtilization = totalCapacity > 0 ? usedCapacity / totalCapacity : 0;

    const elapsedTime = Date.now() - this.metrics.startTime;
    const throughput = elapsedTime > 0 ? (this.metrics.completedTasks / elapsedTime) * 1000 : 0;

    return {
      totalOrchestrators: this.orchestrators.size,
      activeOrchestrators,
      totalTasks: this.metrics.totalTasks,
      completedTasks: this.metrics.completedTasks,
      failedTasks: this.metrics.failedTasks,
      averageTaskTime,
      resourceUtilization,
      throughput
    };
  }

  public getQueueStatus(): {
    queueLength: number;
    tasksByPriority: Record<number, number>;
    estimatedWaitTime: number;
  } {
    const tasksByPriority: Record<number, number> = {};
    for (const task of this.taskQueue) {
      tasksByPriority[task.priority] = (tasksByPriority[task.priority] || 0) + 1;
    }

    const averageTaskTime = this.metrics.completedTasks > 0
      ? this.metrics.totalTaskTime / this.metrics.completedTasks
      : 60000; // Default 1 minute

    const estimatedWaitTime = this.taskQueue.length * averageTaskTime;

    return {
      queueLength: this.taskQueue.length,
      tasksByPriority,
      estimatedWaitTime
    };
  }

  public getOrchestratorStates(): Record<string, OrchestratorState> {
    return this.transitionHub.getAllStates();
  }

  private startMetricsCollection(): void {
    setInterval(() => {
      this.emit('metricsUpdate', this.getOrchestrationMetrics());
    }, 5000); // Every 5 seconds
  }

  public dispose(): void {
    for (const orchestrator of this.orchestrators.values()) {
      orchestrator.dispose();
    }
    this.orchestrators.clear();
    this.removeAllListeners();
  }
}