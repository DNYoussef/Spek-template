/**
 * Orchestrator Base Class with FSM Architecture
 * Provides common orchestration patterns with state isolation
 * All concrete orchestrators extend this class
 */

import { EventEmitter } from 'events';
import { OrchestratorTransitionHub, TransitionResult } from './OrchestratorTransitionHub';
import {
  OrchestratorState,
  OrchestratorEvent,
  OrchestratorContext,
  TaskInfo,
  ResourceInfo,
  MetricsInfo,
  ErrorInfo
} from './OrchestratorStates';

export interface OrchestratorConfig {
  readonly orchestratorId: string;
  readonly orchestrationType: string;
  readonly maxConcurrentTasks: number;
  readonly taskTimeout: number;
  readonly retryAttempts: number;
  readonly validationEnabled: boolean;
}

export abstract class OrchestratorBase extends EventEmitter {
  protected readonly config: OrchestratorConfig;
  protected readonly transitionHub: OrchestratorTransitionHub;
  protected readonly context: OrchestratorContext;

  private readonly tasks = new Map<string, TaskInfo>();
  private readonly resources = new Map<string, ResourceInfo>();
  private readonly errors: ErrorInfo[] = [];
  private readonly startTime = Date.now();

  constructor(config: OrchestratorConfig, transitionHub: OrchestratorTransitionHub) {
    super();
    this.config = config;
    this.transitionHub = transitionHub;

    this.context = {
      orchestratorId: config.orchestratorId,
      orchestrationType: config.orchestrationType,
      startTime: this.startTime,
      tasks: [],
      resources: [],
      metrics: this.calculateMetrics(),
      errors: this.errors
    };

    this.transitionHub.registerOrchestrator(config.orchestratorId);
    this.bindStateHandlers();
  }

  private bindStateHandlers(): void {
    this.transitionHub.on('stateChanged', (orchestratorId: string, result: TransitionResult) => {
      if (orchestratorId === this.config.orchestratorId) {
        this.handleStateChange(result);
      }
    });
  }

  protected async handleStateChange(result: TransitionResult): Promise<void> {
    if (!result.success) {
      this.addError('transition', result.error || 'State transition failed');
      return;
    }

    switch (result.toState) {
      case OrchestratorState.PLANNING:
        await this.onPlanningEntered();
        break;
      case OrchestratorState.ALLOCATING:
        await this.onAllocatingEntered();
        break;
      case OrchestratorState.EXECUTING:
        await this.onExecutingEntered();
        break;
      case OrchestratorState.MONITORING:
        await this.onMonitoringEntered();
        break;
      case OrchestratorState.VALIDATING:
        await this.onValidatingEntered();
        break;
      case OrchestratorState.COMPLETING:
        await this.onCompletingEntered();
        break;
      case OrchestratorState.ERROR:
        await this.onErrorEntered();
        break;
    }

    this.emit('stateChanged', result.toState, result.fromState);
  }

  // Abstract state handlers - must be implemented by concrete classes
  protected abstract onPlanningEntered(): Promise<void>;
  protected abstract onAllocatingEntered(): Promise<void>;
  protected abstract onExecutingEntered(): Promise<void>;
  protected abstract onMonitoringEntered(): Promise<void>;
  protected abstract onValidatingEntered(): Promise<void>;
  protected abstract onCompletingEntered(): Promise<void>;
  protected abstract onErrorEntered(): Promise<void>;

  // Abstract orchestration methods
  public abstract start(input: any): Promise<void>;
  public abstract cancel(): Promise<void>;
  public abstract getStatus(): Promise<any>;

  // Common orchestration utilities
  protected async transitionTo(event: OrchestratorEvent): Promise<TransitionResult> {
    const updatedContext = this.updateContext();
    return await this.transitionHub.transition(this.config.orchestratorId, event, updatedContext);
  }

  protected addTask(task: TaskInfo): void {
    this.tasks.set(task.taskId, task);
    this.emit('taskAdded', task);
  }

  protected updateTask(taskId: string, updates: Partial<TaskInfo>): void {
    const task = this.tasks.get(taskId);
    if (task) {
      const updatedTask = { ...task, ...updates };
      this.tasks.set(taskId, updatedTask);
      this.emit('taskUpdated', updatedTask);
    }
  }

  protected removeTask(taskId: string): void {
    const task = this.tasks.get(taskId);
    if (task) {
      this.tasks.delete(taskId);
      this.emit('taskRemoved', task);
    }
  }

  protected allocateResource(resource: ResourceInfo): void {
    this.resources.set(resource.resourceId, resource);
    this.emit('resourceAllocated', resource);
  }

  protected releaseResource(resourceId: string): void {
    const resource = this.resources.get(resourceId);
    if (resource) {
      this.resources.delete(resourceId);
      this.emit('resourceReleased', resource);
    }
  }

  protected addError(type: string, message: string, context?: Record<string, any>): void {
    const error: ErrorInfo = {
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      type,
      message,
      context: context || {},
      severity: 'medium'
    };

    this.errors.push(error);
    this.emit('errorAdded', error);

    // Trigger error state if in execution states
    const currentState = this.getCurrentState();
    if (currentState && [
      OrchestratorState.PLANNING,
      OrchestratorState.ALLOCATING,
      OrchestratorState.EXECUTING,
      OrchestratorState.MONITORING,
      OrchestratorState.VALIDATING
    ].includes(currentState)) {
      this.transitionTo(OrchestratorEvent.ERROR_OCCURRED);
    }
  }

  protected getCurrentState(): OrchestratorState | undefined {
    return this.transitionHub.getCurrentState(this.config.orchestratorId);
  }

  protected getValidTransitions(): OrchestratorEvent[] {
    return this.transitionHub.getValidTransitions(this.config.orchestratorId);
  }

  protected updateContext(): OrchestratorContext {
    return {
      ...this.context,
      tasks: Array.from(this.tasks.values()),
      resources: Array.from(this.resources.values()),
      metrics: this.calculateMetrics(),
      errors: [...this.errors]
    };
  }

  private calculateMetrics(): MetricsInfo {
    const tasks = Array.from(this.tasks.values());
    const completedTasks = tasks.filter(t => t.status === 'completed');
    const failedTasks = tasks.filter(t => t.status === 'failed');
    const runningTasks = tasks.filter(t => t.status === 'running');

    const completedTaskTimes = completedTasks
      .filter(t => t.startTime && t.endTime)
      .map(t => t.endTime! - t.startTime!);

    const averageTaskTime = completedTaskTimes.length > 0
      ? completedTaskTimes.reduce((sum, time) => sum + time, 0) / completedTaskTimes.length
      : 0;

    const resourceCapacity = Array.from(this.resources.values())
      .reduce((sum, r) => sum + r.capacity, 0);
    const resourceUsage = Array.from(this.resources.values())
      .reduce((sum, r) => sum + r.usage, 0);

    const resourceUtilization = resourceCapacity > 0 ? resourceUsage / resourceCapacity : 0;
    const successRate = tasks.length > 0 ? completedTasks.length / tasks.length : 0;

    return {
      tasksTotal: tasks.length,
      tasksCompleted: completedTasks.length,
      tasksFailed: failedTasks.length,
      averageTaskTime,
      resourceUtilization,
      successRate
    };
  }

  public getMetrics(): MetricsInfo {
    return this.calculateMetrics();
  }

  public getTasks(): readonly TaskInfo[] {
    return Array.from(this.tasks.values());
  }

  public getResources(): readonly ResourceInfo[] {
    return Array.from(this.resources.values());
  }

  public getErrors(): readonly ErrorInfo[] {
    return [...this.errors];
  }

  public getTransitionHistory(): readonly TransitionResult[] {
    return this.transitionHub.getTransitionHistory(this.config.orchestratorId);
  }

  public dispose(): void {
    this.transitionHub.removeOrchestrator(this.config.orchestratorId);
    this.removeAllListeners();
  }
}