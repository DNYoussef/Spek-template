/**
 * LangGraphEngine - Core LangGraph Integration and State Machine Runtime
 * Provides the foundational runtime for LangGraph state machine execution,
 * supporting complex workflows with parallel execution, conditional branching,
 * and enterprise-grade reliability features.
 */

import { EventEmitter } from 'events';
import { StateGraph, StateNode, StateTransition } from './StateGraph';
import { WorkflowDefinition, WorkflowExecution, ExecutionContext } from './types/workflow.types';
import { PrincessStateMachine } from './state-machines/PrincessStateMachine';
import { StateStore } from './StateStore';
import { StateValidator } from './StateValidator';

export interface LangGraphConfig {
  maxConcurrentWorkflows: number;
  stateTransitionTimeout: number;
  persistenceEnabled: boolean;
  validationMode: 'strict' | 'permissive';
  recoveryStrategy: 'rollback' | 'forward' | 'manual';
}

export interface ExecutionMetrics {
  workflowId: string;
  startTime: Date;
  endTime?: Date;
  stateTransitions: number;
  errors: number;
  currentState: string;
  performance: {
    averageTransitionTime: number;
    totalExecutionTime: number;
    memoryUsage: number;
  };
}

export class LangGraphEngine extends EventEmitter {
  private config: LangGraphConfig;
  private stateStore: StateStore;
  private validator: StateValidator;
  private runningWorkflows: Map<string, WorkflowExecution>;
  private stateMachines: Map<string, PrincessStateMachine>;
  private metrics: Map<string, ExecutionMetrics>;

  constructor(config: Partial<LangGraphConfig> = {}) {
    super();
    this.config = {
      maxConcurrentWorkflows: 50,
      stateTransitionTimeout: 30000, // 30 seconds
      persistenceEnabled: true,
      validationMode: 'strict',
      recoveryStrategy: 'rollback',
      ...config
    };

    this.stateStore = new StateStore({
      persistenceEnabled: this.config.persistenceEnabled
    });
    this.validator = new StateValidator(this.config.validationMode);
    this.runningWorkflows = new Map();
    this.stateMachines = new Map();
    this.metrics = new Map();

    this.setupEventHandlers();
  }

  /**
   * Register a Princess state machine with the engine
   */
  async registerStateMachine(
    princessId: string,
    stateMachine: PrincessStateMachine
  ): Promise<void> {
    if (this.stateMachines.has(princessId)) {
      throw new Error(`State machine already registered for Princess: ${princessId}`);
    }

    // Validate state machine definition
    const validation = await this.validator.validateStateMachine(stateMachine);
    if (!validation.isValid) {
      throw new Error(`Invalid state machine: ${validation.errors.join(', ')}`);
    }

    this.stateMachines.set(princessId, stateMachine);

    // Initialize state machine state
    await this.stateStore.initializeState(princessId, stateMachine.getInitialState());

    // Setup state machine event handlers
    stateMachine.on('stateChanged', (oldState, newState) => {
      this.handleStateChange(princessId, oldState, newState);
    });

    stateMachine.on('error', (error) => {
      this.handleStateMachineError(princessId, error);
    });

    this.emit('stateMachineRegistered', princessId, stateMachine);
  }

  /**
   * Execute a workflow definition
   */
  async executeWorkflow(
    workflowDefinition: WorkflowDefinition,
    context: ExecutionContext = {}
  ): Promise<string> {
    // Check concurrent workflow limit
    if (this.runningWorkflows.size >= this.config.maxConcurrentWorkflows) {
      throw new Error('Maximum concurrent workflows reached');
    }

    const workflowId = this.generateWorkflowId();
    const execution: WorkflowExecution = {
      id: workflowId,
      definition: workflowDefinition,
      context,
      status: 'initializing',
      currentState: workflowDefinition.initialState,
      startTime: new Date(),
      stateHistory: []
    };

    // Initialize metrics
    this.metrics.set(workflowId, {
      workflowId,
      startTime: execution.startTime,
      stateTransitions: 0,
      errors: 0,
      currentState: execution.currentState,
      performance: {
        averageTransitionTime: 0,
        totalExecutionTime: 0,
        memoryUsage: process.memoryUsage().heapUsed
      }
    });

    this.runningWorkflows.set(workflowId, execution);

    try {
      // Validate workflow definition
      const validation = await this.validator.validateWorkflow(workflowDefinition);
      if (!validation.isValid) {
        throw new Error(`Invalid workflow: ${validation.errors.join(', ')}`);
      }

      // Start workflow execution
      execution.status = 'running';
      await this.executeWorkflowStep(workflowId, execution.currentState);

      this.emit('workflowStarted', workflowId, workflowDefinition);
      return workflowId;

    } catch (error) {
      execution.status = 'failed';
      execution.error = error;
      this.emit('workflowFailed', workflowId, error);
      throw error;
    }
  }

  /**
   * Execute a single workflow step
   */
  private async executeWorkflowStep(
    workflowId: string,
    stateName: string
  ): Promise<void> {
    const execution = this.runningWorkflows.get(workflowId);
    if (!execution) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    const state = execution.definition.states.find(s => s.name === stateName);
    if (!state) {
      throw new Error(`State not found: ${stateName}`);
    }

    const startTime = Date.now();

    try {
      // Execute state logic
      const result = await this.executeStateLogic(workflowId, state, execution.context);

      // Update metrics
      const metrics = this.metrics.get(workflowId)!;
      metrics.stateTransitions++;
      const transitionTime = Date.now() - startTime;
      metrics.performance.averageTransitionTime =
        (metrics.performance.averageTransitionTime * (metrics.stateTransitions - 1) + transitionTime)
        / metrics.stateTransitions;

      // Record state transition
      execution.stateHistory.push({
        state: stateName,
        timestamp: new Date(),
        duration: transitionTime,
        result
      });

      // Determine next state
      const nextState = await this.determineNextState(state, result, execution.definition);

      if (nextState) {
        execution.currentState = nextState;
        metrics.currentState = nextState;

        // Continue execution
        await this.executeWorkflowStep(workflowId, nextState);
      } else {
        // Workflow completed
        execution.status = 'completed';
        execution.endTime = new Date();
        metrics.endTime = execution.endTime;
        metrics.performance.totalExecutionTime =
          execution.endTime.getTime() - execution.startTime.getTime();

        this.emit('workflowCompleted', workflowId, execution);
        this.runningWorkflows.delete(workflowId);
      }

    } catch (error) {
      metrics.errors++;
      await this.handleWorkflowError(workflowId, error);
    }
  }

  /**
   * Execute the logic for a specific state
   */
  private async executeStateLogic(
    workflowId: string,
    state: any,
    context: ExecutionContext
  ): Promise<any> {
    switch (state.type) {
      case 'princess':
        return await this.executePrincessState(workflowId, state, context);
      case 'parallel':
        return await this.executeParallelState(workflowId, state, context);
      case 'conditional':
        return await this.executeConditionalState(workflowId, state, context);
      case 'wait':
        return await this.executeWaitState(workflowId, state, context);
      default:
        throw new Error(`Unknown state type: ${state.type}`);
    }
  }

  /**
   * Execute a Princess-specific state
   */
  private async executePrincessState(
    workflowId: string,
    state: any,
    context: ExecutionContext
  ): Promise<any> {
    const princessId = state.princess;
    const stateMachine = this.stateMachines.get(princessId);

    if (!stateMachine) {
      throw new Error(`Princess state machine not found: ${princessId}`);
    }

    // Create timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`State transition timeout for Princess: ${princessId}`));
      }, this.config.stateTransitionTimeout);
    });

    // Execute Princess task
    const executionPromise = stateMachine.executeTask(state.task, context);

    try {
      return await Promise.race([executionPromise, timeoutPromise]);
    } catch (error) {
      await this.handleStateExecutionError(workflowId, princessId, error);
      throw error;
    }
  }

  /**
   * Execute parallel states
   */
  private async executeParallelState(
    workflowId: string,
    state: any,
    context: ExecutionContext
  ): Promise<any> {
    const parallelExecutions = state.parallel.map(async (parallelState: any) => {
      return await this.executeStateLogic(workflowId, parallelState, context);
    });

    return await Promise.all(parallelExecutions);
  }

  /**
   * Execute conditional state
   */
  private async executeConditionalState(
    workflowId: string,
    state: any,
    context: ExecutionContext
  ): Promise<any> {
    const condition = state.condition;
    const conditionResult = await this.evaluateCondition(condition, context);

    const targetState = conditionResult ? state.onTrue : state.onFalse;
    if (targetState) {
      return await this.executeStateLogic(workflowId, targetState, context);
    }

    return { conditionResult };
  }

  /**
   * Execute wait state
   */
  private async executeWaitState(
    workflowId: string,
    state: any,
    context: ExecutionContext
  ): Promise<any> {
    const duration = state.duration || 1000;
    await new Promise(resolve => setTimeout(resolve, duration));
    return { waited: duration };
  }

  /**
   * Determine the next state based on current state result and workflow definition
   */
  private async determineNextState(
    currentState: any,
    result: any,
    workflow: WorkflowDefinition
  ): Promise<string | null> {
    if (currentState.next) {
      if (typeof currentState.next === 'string') {
        return currentState.next;
      } else if (typeof currentState.next === 'object') {
        // Conditional next state
        for (const [condition, nextState] of Object.entries(currentState.next)) {
          if (await this.evaluateCondition(condition, { result })) {
            return nextState as string;
          }
        }
      }
    }

    return null; // End of workflow
  }

  /**
   * Evaluate a condition expression
   */
  private async evaluateCondition(condition: string, context: any): Promise<boolean> {
    // Simple condition evaluation - in production, use a proper expression evaluator
    try {
      const func = new Function('context', `return ${condition}`);
      return func(context);
    } catch (error) {
      console.warn(`Failed to evaluate condition: ${condition}`, error);
      return false;
    }
  }

  /**
   * Get workflow execution status
   */
  getWorkflowStatus(workflowId: string): WorkflowExecution | null {
    return this.runningWorkflows.get(workflowId) || null;
  }

  /**
   * Get workflow metrics
   */
  getWorkflowMetrics(workflowId: string): ExecutionMetrics | null {
    return this.metrics.get(workflowId) || null;
  }

  /**
   * Get all running workflows
   */
  getRunningWorkflows(): WorkflowExecution[] {
    return Array.from(this.runningWorkflows.values());
  }

  /**
   * Cancel a running workflow
   */
  async cancelWorkflow(workflowId: string): Promise<void> {
    const execution = this.runningWorkflows.get(workflowId);
    if (!execution) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    execution.status = 'cancelled';
    execution.endTime = new Date();

    this.emit('workflowCancelled', workflowId);
    this.runningWorkflows.delete(workflowId);
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    this.on('error', (error) => {
      console.error('LangGraph Engine Error:', error);
    });

    // Cleanup completed workflows periodically
    setInterval(() => {
      this.cleanupCompletedWorkflows();
    }, 60000); // Every minute
  }

  /**
   * Handle state changes in Princess state machines
   */
  private async handleStateChange(
    princessId: string,
    oldState: string,
    newState: string
  ): Promise<void> {
    await this.stateStore.updateState(princessId, newState);
    this.emit('princessStateChanged', princessId, oldState, newState);
  }

  /**
   * Handle state machine errors
   */
  private async handleStateMachineError(
    princessId: string,
    error: Error
  ): Promise<void> {
    this.emit('stateMachineError', princessId, error);

    // Implement recovery strategy
    switch (this.config.recoveryStrategy) {
      case 'rollback':
        await this.rollbackStateMachine(princessId);
        break;
      case 'forward':
        await this.forwardRecovery(princessId, error);
        break;
      case 'manual':
        // Emit event for manual intervention
        this.emit('manualRecoveryRequired', princessId, error);
        break;
    }
  }

  /**
   * Handle workflow errors
   */
  private async handleWorkflowError(workflowId: string, error: Error): Promise<void> {
    const execution = this.runningWorkflows.get(workflowId);
    if (execution) {
      execution.status = 'failed';
      execution.error = error;
      execution.endTime = new Date();
    }

    this.emit('workflowError', workflowId, error);
  }

  /**
   * Handle state execution errors
   */
  private async handleStateExecutionError(
    workflowId: string,
    princessId: string,
    error: Error
  ): Promise<void> {
    this.emit('stateExecutionError', workflowId, princessId, error);
  }

  /**
   * Rollback state machine to previous valid state
   */
  private async rollbackStateMachine(princessId: string): Promise<void> {
    const previousState = await this.stateStore.getPreviousState(princessId);
    if (previousState) {
      const stateMachine = this.stateMachines.get(princessId);
      if (stateMachine) {
        await stateMachine.setState(previousState);
      }
    }
  }

  /**
   * Forward recovery for state machine errors
   */
  private async forwardRecovery(princessId: string, error: Error): Promise<void> {
    const stateMachine = this.stateMachines.get(princessId);
    if (stateMachine) {
      await stateMachine.recoverFromError(error);
    }
  }

  /**
   * Generate unique workflow ID
   */
  private generateWorkflowId(): string {
    return `workflow_${Date.now()}_${randomUUID()}`;
  }

  /**
   * Cleanup completed workflows from memory
   */
  private cleanupCompletedWorkflows(): void {
    const completedWorkflows = Array.from(this.runningWorkflows.entries())
      .filter(([_, execution]) =>
        execution.status === 'completed' ||
        execution.status === 'failed' ||
        execution.status === 'cancelled'
      );

    for (const [workflowId] of completedWorkflows) {
      this.runningWorkflows.delete(workflowId);
    }
  }

  /**
   * Shutdown the engine gracefully
   */
  async shutdown(): Promise<void> {
    // Cancel all running workflows
    const runningWorkflowIds = Array.from(this.runningWorkflows.keys());
    await Promise.all(
      runningWorkflowIds.map(id => this.cancelWorkflow(id))
    );

    // Shutdown state store
    await this.stateStore.shutdown();

    this.emit('shutdown');
  }
}

export default LangGraphEngine;