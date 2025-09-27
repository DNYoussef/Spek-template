/**
 * PrincessStateMachine - Base State Machine Class for All Princesses
 * Provides the standardized interface and common functionality for all Princess
 * state machines, ensuring consistent behavior across the swarm hierarchy.
 */

import { EventEmitter } from 'events';
import { StateGraph, StateNode, StateTransition } from '../StateGraph';

export interface PrincessState {
  id: string;
  name: string;
  type: 'idle' | 'active' | 'busy' | 'error' | 'maintenance';
  context: Record<string, any>;
  metadata: {
    enteredAt: Date;
    duration?: number;
    retryCount?: number;
    lastError?: Error;
  };
}

export interface TaskDefinition {
  id: string;
  type: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  payload: any;
  metadata: {
    createdAt: Date;
    deadline?: Date;
    dependencies?: string[];
    requiredCapabilities?: string[];
  };
}

export interface TaskResult {
  taskId: string;
  status: 'completed' | 'failed' | 'partial';
  result: any;
  metadata: {
    startTime: Date;
    endTime: Date;
    resourcesUsed: Record<string, number>;
    errors?: Error[];
  };
}

export interface StateTransitionRule {
  fromState: string;
  toState: string;
  trigger: string;
  condition?: (context: any) => boolean;
  action?: (context: any) => Promise<any>;
  timeout?: number;
}

export interface PrincessCapability {
  id: string;
  name: string;
  type: 'core' | 'enhanced' | 'specialized';
  version: string;
  enabled: boolean;
  configuration: Record<string, any>;
}

export interface PrincessConfiguration {
  princessId: string;
  domain: string;
  capabilities: PrincessCapability[];
  stateDefinition: {
    states: StateNode[];
    transitions: StateTransition[];
    initialState: string;
    finalStates: string[];
  };
  policies: {
    maxConcurrentTasks: number;
    taskTimeout: number;
    retryPolicy: {
      maxRetries: number;
      backoffStrategy: 'linear' | 'exponential';
      baseDelay: number;
    };
    resourceLimits: Record<string, number>;
  };
}

export abstract class PrincessStateMachine extends EventEmitter {
  protected configuration: PrincessConfiguration;
  protected currentState: PrincessState;
  protected stateGraph: StateGraph;
  protected activeTasks: Map<string, TaskDefinition>;
  protected taskResults: Map<string, TaskResult>;
  protected stateHistory: PrincessState[];
  protected transitionRules: Map<string, StateTransitionRule>;
  private taskQueue: TaskDefinition[];
  private isProcessing: boolean;

  constructor(configuration: PrincessConfiguration) {
    super();
    this.configuration = configuration;
    this.activeTasks = new Map();
    this.taskResults = new Map();
    this.stateHistory = [];
    this.transitionRules = new Map();
    this.taskQueue = [];
    this.isProcessing = false;

    // Initialize state graph
    this.stateGraph = new StateGraph({
      id: configuration.princessId,
      name: `${configuration.domain} Princess State Machine`,
      nodes: configuration.stateDefinition.states,
      transitions: configuration.stateDefinition.transitions,
      initialState: configuration.stateDefinition.initialState,
      finalStates: configuration.stateDefinition.finalStates,
      metadata: {
        version: '1.0.0',
        created: new Date(),
        modified: new Date(),
        author: 'PrincessStateMachine'
      }
    });

    // Initialize current state
    this.currentState = {
      id: this.generateStateId(),
      name: configuration.stateDefinition.initialState,
      type: 'idle',
      context: {},
      metadata: {
        enteredAt: new Date()
      }
    };

    this.initializeTransitionRules();
    this.setupEventHandlers();
  }

  /**
   * Get the current state of the Princess
   */
  getCurrentState(): PrincessState {
    return { ...this.currentState };
  }

  /**
   * Get the initial state for the state machine
   */
  getInitialState(): string {
    return this.configuration.stateDefinition.initialState;
  }

  /**
   * Set the state directly (used for recovery scenarios)
   */
  async setState(stateName: string): Promise<void> {
    const targetState = this.stateGraph.getDefinition().nodes.find(n => n.name === stateName);
    if (!targetState) {
      throw new Error(`State '${stateName}' not found`);
    }

    const previousState = { ...this.currentState };

    // Update current state
    this.currentState = {
      id: this.generateStateId(),
      name: stateName,
      type: this.mapNodeTypeToStateType(targetState.type),
      context: { ...this.currentState.context },
      metadata: {
        enteredAt: new Date(),
        duration: previousState.metadata.enteredAt ?
          Date.now() - previousState.metadata.enteredAt.getTime() : undefined
      }
    };

    // Add to history
    this.stateHistory.push(previousState);
    if (this.stateHistory.length > 100) {
      this.stateHistory.shift(); // Keep only last 100 states
    }

    // Execute state entry action
    await this.executeStateEntry(stateName);

    this.emit('stateChanged', previousState.name, stateName);
  }

  /**
   * Transition to a new state
   */
  async transition(trigger: string, context: any = {}): Promise<void> {
    const ruleKey = `${this.currentState.name}:${trigger}`;
    const rule = this.transitionRules.get(ruleKey);

    if (!rule) {
      throw new Error(`No transition rule found for ${this.currentState.name} -> ${trigger}`);
    }

    // Check condition if specified
    if (rule.condition && !rule.condition({ ...this.currentState.context, ...context })) {
      throw new Error(`Transition condition failed for ${this.currentState.name} -> ${trigger}`);
    }

    // Execute transition action if specified
    if (rule.action) {
      try {
        const actionResult = await this.executeWithTimeout(
          rule.action({ ...this.currentState.context, ...context }),
          rule.timeout || 30000
        );

        // Merge action result into context
        if (actionResult && typeof actionResult === 'object') {
          Object.assign(context, actionResult);
        }
      } catch (error) {
        throw new Error(`Transition action failed: ${error.message}`);
      }
    }

    // Perform the state transition
    await this.setState(rule.toState);

    // Update context with transition data
    this.currentState.context = { ...this.currentState.context, ...context };
  }

  /**
   * Execute a task within the state machine
   */
  async executeTask(task: TaskDefinition, context: any = {}): Promise<TaskResult> {
    // Validate that the current state can handle this task
    if (!this.canHandleTask(task)) {
      throw new Error(`Current state '${this.currentState.name}' cannot handle task type '${task.type}'`);
    }

    // Check concurrent task limits
    if (this.activeTasks.size >= this.configuration.policies.maxConcurrentTasks) {
      // Queue the task
      this.taskQueue.push(task);
      throw new Error(`Task queued: maximum concurrent tasks (${this.configuration.policies.maxConcurrentTasks}) reached`);
    }

    // Add to active tasks
    this.activeTasks.set(task.id, task);

    const startTime = new Date();
    let result: TaskResult;

    try {
      // Transition to busy state if not already
      if (this.currentState.name !== 'busy' && this.currentState.type !== 'busy') {
        await this.transition('startTask', { taskId: task.id });
      }

      // Execute the task
      const taskResult = await this.executeWithTimeout(
        this.performTask(task, context),
        this.configuration.policies.taskTimeout
      );

      result = {
        taskId: task.id,
        status: 'completed',
        result: taskResult,
        metadata: {
          startTime,
          endTime: new Date(),
          resourcesUsed: await this.getResourceUsage()
        }
      };

    } catch (error) {
      result = {
        taskId: task.id,
        status: 'failed',
        result: null,
        metadata: {
          startTime,
          endTime: new Date(),
          resourcesUsed: await this.getResourceUsage(),
          errors: [error]
        }
      };

      // Handle task failure
      await this.handleTaskFailure(task, error);
    } finally {
      // Remove from active tasks
      this.activeTasks.delete(task.id);
      this.taskResults.set(task.id, result);

      // Process next queued task if available
      await this.processNextQueuedTask();

      // Transition back to idle if no more active tasks
      if (this.activeTasks.size === 0 && this.currentState.type === 'busy') {
        await this.transition('completeTask', { taskId: task.id });
      }
    }

    this.emit('taskCompleted', task.id, result);
    return result;
  }

  /**
   * Handle errors and recovery
   */
  async recoverFromError(error: Error): Promise<void> {
    this.currentState.metadata.lastError = error;
    this.currentState.metadata.retryCount = (this.currentState.metadata.retryCount || 0) + 1;

    const maxRetries = this.configuration.policies.retryPolicy.maxRetries;

    if (this.currentState.metadata.retryCount <= maxRetries) {
      // Apply backoff delay
      const delay = this.calculateBackoffDelay(this.currentState.metadata.retryCount);
      await new Promise(resolve => setTimeout(resolve, delay));

      // Attempt recovery
      await this.performRecovery(error);
    } else {
      // Maximum retries exceeded, transition to error state
      await this.setState('error');
      this.emit('maxRetriesExceeded', error);
    }
  }

  /**
   * Get the state graph for this Princess
   */
  getStateGraph(): StateGraph {
    return this.stateGraph;
  }

  /**
   * Get Princess capabilities
   */
  getCapabilities(): PrincessCapability[] {
    return [...this.configuration.capabilities];
  }

  /**
   * Get task execution history
   */
  getTaskHistory(limit: number = 50): TaskResult[] {
    return Array.from(this.taskResults.values())
      .sort((a, b) => b.metadata.endTime.getTime() - a.metadata.endTime.getTime())
      .slice(0, limit);
  }

  /**
   * Get Princess performance metrics
   */
  getPerformanceMetrics(): any {
    const completedTasks = Array.from(this.taskResults.values());
    const successfulTasks = completedTasks.filter(t => t.status === 'completed');

    return {
      totalTasks: completedTasks.length,
      successRate: completedTasks.length > 0 ? successfulTasks.length / completedTasks.length : 0,
      averageExecutionTime: this.calculateAverageExecutionTime(completedTasks),
      currentLoad: this.activeTasks.size,
      queueLength: this.taskQueue.length,
      stateTransitions: this.stateHistory.length,
      currentState: this.currentState.name,
      uptime: Date.now() - this.stateHistory[0]?.metadata.enteredAt.getTime() || 0
    };
  }

  /**
   * Abstract methods to be implemented by specific Princess classes
   */
  protected abstract performTask(task: TaskDefinition, context: any): Promise<any>;
  protected abstract canHandleTask(task: TaskDefinition): boolean;
  protected abstract getResourceUsage(): Promise<Record<string, number>>;
  protected abstract performRecovery(error: Error): Promise<void>;

  /**
   * Initialize transition rules specific to this Princess
   */
  protected abstract initializeTransitionRules(): void;

  /**
   * Execute state entry actions
   */
  protected async executeStateEntry(stateName: string): Promise<void> {
    // Default implementation - override in subclasses for specific behavior
    switch (stateName) {
      case 'idle':
        await this.onEnterIdle();
        break;
      case 'busy':
        await this.onEnterBusy();
        break;
      case 'error':
        await this.onEnterError();
        break;
      case 'maintenance':
        await this.onEnterMaintenance();
        break;
    }
  }

  /**
   * State entry handlers - can be overridden by subclasses
   */
  protected async onEnterIdle(): Promise<void> {
    // Process any queued tasks
    await this.processNextQueuedTask();
  }

  protected async onEnterBusy(): Promise<void> {
    // Track busy state metrics
    this.currentState.type = 'busy';
  }

  protected async onEnterError(): Promise<void> {
    // Log error state entry
    this.currentState.type = 'error';
    this.emit('errorState', this.currentState.metadata.lastError);
  }

  protected async onEnterMaintenance(): Promise<void> {
    // Pause task processing during maintenance
    this.currentState.type = 'maintenance';
    this.emit('maintenanceMode', true);
  }

  /**
   * Private helper methods
   */
  private generateStateId(): string {
    return `state_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private mapNodeTypeToStateType(nodeType: string): PrincessState['type'] {
    switch (nodeType) {
      case 'initial': return 'idle';
      case 'intermediate': return 'active';
      case 'final': return 'idle';
      case 'error': return 'error';
      default: return 'active';
    }
  }

  private async executeWithTimeout<T>(promise: Promise<T>, timeout: number): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Operation timeout')), timeout);
    });

    return Promise.race([promise, timeoutPromise]);
  }

  private async handleTaskFailure(task: TaskDefinition, error: Error): Promise<void> {
    // Implement retry logic based on task configuration
    if (task.metadata.retryCount === undefined) {
      task.metadata.retryCount = 0;
    }

    task.metadata.retryCount++;

    if (task.metadata.retryCount <= this.configuration.policies.retryPolicy.maxRetries) {
      // Re-queue task for retry
      this.taskQueue.unshift(task);
    } else {
      this.emit('taskFailed', task.id, error);
    }
  }

  private async processNextQueuedTask(): Promise<void> {
    if (this.isProcessing || this.taskQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      const nextTask = this.taskQueue.shift();
      if (nextTask && this.activeTasks.size < this.configuration.policies.maxConcurrentTasks) {
        await this.executeTask(nextTask);
      }
    } finally {
      this.isProcessing = false;
    }
  }

  private calculateBackoffDelay(retryCount: number): number {
    const baseDelay = this.configuration.policies.retryPolicy.baseDelay;

    switch (this.configuration.policies.retryPolicy.backoffStrategy) {
      case 'linear':
        return baseDelay * retryCount;
      case 'exponential':
        return baseDelay * Math.pow(2, retryCount - 1);
      default:
        return baseDelay;
    }
  }

  private calculateAverageExecutionTime(tasks: TaskResult[]): number {
    if (tasks.length === 0) return 0;

    const totalTime = tasks.reduce((sum, task) => {
      return sum + (task.metadata.endTime.getTime() - task.metadata.startTime.getTime());
    }, 0);

    return totalTime / tasks.length;
  }

  private setupEventHandlers(): void {
    this.on('error', (error) => {
      console.error(`Princess ${this.configuration.princessId} error:`, error);
    });

    // Automatic state monitoring
    setInterval(() => {
      this.checkStateHealth();
    }, 30000); // Every 30 seconds
  }

  private checkStateHealth(): void {
    const now = Date.now();
    const stateAge = now - this.currentState.metadata.enteredAt.getTime();

    // Check for stuck states
    if (stateAge > 300000) { // 5 minutes
      this.emit('stateTimeout', this.currentState.name, stateAge);
    }

    // Check resource usage
    this.getResourceUsage().then(usage => {
      const limits = this.configuration.policies.resourceLimits;
      for (const [resource, used] of Object.entries(usage)) {
        if (limits[resource] && used > limits[resource]) {
          this.emit('resourceLimitExceeded', resource, used, limits[resource]);
        }
      }
    });
  }
}

export default PrincessStateMachine;