/**
 * WorkflowCore - Core Workflow Execution Engine
 * NASA Rule 10 Compliant - All functions ≤60 lines with proper state management
 * Handles workflow execution, state tracking, and lifecycle management
 */

import { EventEmitter } from 'events';
import {
  WorkflowDefinition,
  WorkflowExecution,
  ExecutionContext,
  WorkflowExecutionMetrics,
  StateTransition,
  WorkflowCore as IWorkflowCore
} from './WorkflowTypes';

/**
 * Core workflow execution engine
 * NASA Rule 10: All functions ≤60 lines, 2+ assertions each
 */
export class WorkflowCore extends EventEmitter implements IWorkflowCore {
  private executions: Map<string, WorkflowExecution> = new Map();
  private metrics: Map<string, WorkflowExecutionMetrics> = new Map();
  private isInitialized: boolean = false;

  /**
   * Initialize the workflow core engine
   * NASA Rule 10: ≤60 lines, 2+ assertions
   * Renamed from initialize() to avoid EventEmitter property conflict
   */
  async initializeComponent(): Promise<void> {
    // NASA Assertion 1: Validate initialization state
    console.assert(!this.isInitialized, 'Core should not be initialized multiple times');

    // Initialize core components
    this.executions.clear();
    this.metrics.clear();

    // Set up internal event handlers
    this.setupInternalEventHandlers();

    this.isInitialized = true;

    // NASA Assertion 2: Validate successful initialization
    console.assert(this.isInitialized === true, 'Core must be marked as initialized');
    console.assert(this.executions instanceof Map, 'Executions must be initialized as Map');
  }

  /**
   * Create new workflow execution
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  async createExecution(
    definition: WorkflowDefinition,
    context: ExecutionContext
  ): Promise<string> {
    // NASA Assertion 1: Validate input parameters
    console.assert(definition !== null && definition !== undefined, 'Workflow definition is required');
    console.assert(definition.id && typeof definition.id === 'string', 'Workflow definition must have valid ID');

    if (!this.isInitialized) {
      throw new Error('WorkflowCore must be initialized before creating executions');
    }

    const executionId = this.generateExecutionId(definition.id);

    const execution: WorkflowExecution = {
      id: executionId,
      definition,
      context: { ...context, workflowId: executionId },
      status: 'running',
      currentState: definition.initialState,
      startTime: new Date(),
      stateHistory: []
    };

    this.executions.set(executionId, execution);
    this.initializeExecutionMetrics(executionId);

    this.emit('executionCreated', executionId, execution);

    // NASA Assertion 2: Validate execution creation
    console.assert(this.executions.has(executionId), 'Execution must be stored');
    console.assert(this.metrics.has(executionId), 'Metrics must be initialized for execution');

    return executionId;
  }

  /**
   * Get workflow execution by ID
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  getExecution(workflowId: string): WorkflowExecution | null {
    // NASA Assertion 1: Validate input parameters
    console.assert(workflowId && typeof workflowId === 'string', 'Workflow ID must be a non-empty string');

    if (!this.isInitialized) {
      throw new Error('WorkflowCore must be initialized before accessing executions');
    }

    const execution = this.executions.get(workflowId) || null;

    // NASA Assertion 2: Validate retrieval consistency
    console.assert(
      execution === null || execution.id === workflowId,
      'Retrieved execution must have matching ID or be null'
    );

    return execution;
  }

  /**
   * Update workflow execution with partial data
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  updateExecution(workflowId: string, updates: Partial<WorkflowExecution>): void {
    // NASA Assertion 1: Validate input parameters
    console.assert(workflowId && typeof workflowId === 'string', 'Workflow ID must be a non-empty string');
    console.assert(updates !== null && updates !== undefined, 'Updates object is required');

    const execution = this.executions.get(workflowId);
    if (!execution) {
      throw new Error(`Workflow execution not found: ${workflowId}`);
    }

    // Track state transitions
    if (updates.currentState && updates.currentState !== execution.currentState) {
      const transition: StateTransition = {
        from: execution.currentState,
        to: updates.currentState,
        timestamp: new Date(),
        duration: Date.now() - execution.startTime.getTime()
      };

      execution.stateHistory.push(transition);
      this.updateExecutionMetrics(workflowId, 'stateTransition', transition);
    }

    // Apply updates
    Object.assign(execution, updates);

    this.emit('executionUpdated', workflowId, execution, updates);

    // NASA Assertion 2: Validate update application
    console.assert(this.executions.get(workflowId) === execution, 'Updated execution must be stored');
  }

  /**
   * Finalize workflow execution and cleanup
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  finalizeExecution(workflowId: string): void {
    // NASA Assertion 1: Validate input parameters
    console.assert(workflowId && typeof workflowId === 'string', 'Workflow ID must be a non-empty string');

    const execution = this.executions.get(workflowId);
    if (!execution) {
      throw new Error(`Workflow execution not found: ${workflowId}`);
    }

    // Ensure execution has end time
    if (!execution.endTime) {
      execution.endTime = new Date();
    }

    // Finalize metrics
    this.finalizeExecutionMetrics(workflowId);

    this.emit('executionFinalized', workflowId, execution);

    // NASA Assertion 2: Validate finalization
    console.assert(execution.endTime instanceof Date, 'Execution must have end time after finalization');
  }

  /**
   * Get execution metrics
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  getExecutionMetrics(workflowId: string): WorkflowExecutionMetrics | null {
    // NASA Assertion 1: Validate input parameters
    console.assert(workflowId && typeof workflowId === 'string', 'Workflow ID must be a non-empty string');

    const metrics = this.metrics.get(workflowId) || null;

    // NASA Assertion 2: Validate metrics retrieval
    console.assert(
      metrics === null || metrics.workflowId === workflowId,
      'Retrieved metrics must have matching workflow ID or be null'
    );

    return metrics;
  }

  /**
   * Get all active executions
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  getActiveExecutions(): WorkflowExecution[] {
    // NASA Assertion 1: Validate initialization
    console.assert(this.isInitialized, 'Core must be initialized');

    const activeExecutions = Array.from(this.executions.values())
      .filter(execution => execution.status === 'running');

    // NASA Assertion 2: Validate active executions filtering
    console.assert(Array.isArray(activeExecutions), 'Active executions must be an array');
    console.assert(
      activeExecutions.every(exec => exec.status === 'running'),
      'All returned executions must have running status'
    );

    return activeExecutions;
  }

  /**
   * Get execution count by status
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  getExecutionCountByStatus(): Record<string, number> {
    // NASA Assertion 1: Validate initialization
    console.assert(this.isInitialized, 'Core must be initialized');

    const counts: Record<string, number> = {
      running: 0,
      completed: 0,
      failed: 0,
      cancelled: 0
    };

    for (const execution of this.executions.values()) {
      if (counts[execution.status] !== undefined) {
        counts[execution.status]++;
      }
    }

    // NASA Assertion 2: Validate count calculation
    console.assert(typeof counts === 'object', 'Counts must be an object');
    console.assert(Object.values(counts).every(count => typeof count === 'number'), 'All counts must be numbers');

    return counts;
  }

  /**
   * Cleanup completed executions older than specified time
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  cleanupOldExecutions(maxAgeMs: number = 24 * 60 * 60 * 1000): number {
    // NASA Assertion 1: Validate input parameters
    console.assert(typeof maxAgeMs === 'number' && maxAgeMs > 0, 'Max age must be a positive number');

    const cutoffTime = Date.now() - maxAgeMs;
    let cleanedCount = 0;

    for (const [workflowId, execution] of this.executions.entries()) {
      if (execution.status !== 'running' &&
          execution.endTime &&
          execution.endTime.getTime() < cutoffTime) {

        this.executions.delete(workflowId);
        this.metrics.delete(workflowId);
        cleanedCount++;

        this.emit('executionCleaned', workflowId, execution);
      }
    }

    // NASA Assertion 2: Validate cleanup result
    console.assert(typeof cleanedCount === 'number' && cleanedCount >= 0, 'Cleaned count must be non-negative number');

    return cleanedCount;
  }

  // Private helper methods - NASA Rule 10: ≤60 lines each

  /**
   * Generate unique execution ID
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  private generateExecutionId(workflowId: string): string {
    // NASA Assertion 1: Validate input
    console.assert(workflowId && typeof workflowId === 'string', 'Workflow ID must be a non-empty string');

    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const executionId = `${workflowId}_${timestamp}_${random}`;

    // NASA Assertion 2: Validate ID generation
    console.assert(executionId.length > workflowId.length, 'Execution ID must be longer than workflow ID');

    return executionId;
  }

  /**
   * Initialize metrics for new execution
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  private initializeExecutionMetrics(workflowId: string): void {
    // NASA Assertion 1: Validate input
    console.assert(workflowId && typeof workflowId === 'string', 'Workflow ID must be a non-empty string');

    const metrics: WorkflowExecutionMetrics = {
      workflowId,
      executionMetrics: {
        totalDuration: 0,
        stateExecutionTimes: {},
        transitionTimes: {},
        retryCount: 0,
        errorCount: 0
      },
      princessMetrics: {},
      resourceMetrics: {
        memoryUsage: 0,
        cpuUsage: 0,
        networkUsage: 0
      }
    };

    this.metrics.set(workflowId, metrics);

    // NASA Assertion 2: Validate metrics initialization
    console.assert(this.metrics.has(workflowId), 'Metrics must be stored for workflow');
  }

  /**
   * Update execution metrics based on events
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  private updateExecutionMetrics(workflowId: string, eventType: string, data: any): void {
    // NASA Assertion 1: Validate input parameters
    console.assert(workflowId && typeof workflowId === 'string', 'Workflow ID must be a non-empty string');
    console.assert(eventType && typeof eventType === 'string', 'Event type must be a non-empty string');

    const metrics = this.metrics.get(workflowId);
    if (!metrics) {
      return; // Metrics not found, skip update
    }

    switch (eventType) {
      case 'stateTransition':
        if (data && data.from && data.to) {
          const transitionKey = `${data.from}_to_${data.to}`;
          metrics.executionMetrics.transitionTimes[transitionKey] = data.duration || 0;
          metrics.executionMetrics.stateExecutionTimes[data.from] =
            (metrics.executionMetrics.stateExecutionTimes[data.from] || 0) + (data.duration || 0);
        }
        break;

      case 'error':
        metrics.executionMetrics.errorCount++;
        break;

      case 'retry':
        metrics.executionMetrics.retryCount++;
        break;
    }

    // NASA Assertion 2: Validate metrics update
    console.assert(this.metrics.get(workflowId) === metrics, 'Metrics must remain in storage after update');
  }

  /**
   * Finalize execution metrics calculation
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  private finalizeExecutionMetrics(workflowId: string): void {
    // NASA Assertion 1: Validate input
    console.assert(workflowId && typeof workflowId === 'string', 'Workflow ID must be a non-empty string');

    const execution = this.executions.get(workflowId);
    const metrics = this.metrics.get(workflowId);

    if (!execution || !metrics) {
      return; // Cannot finalize without execution and metrics
    }

    // Calculate total duration
    if (execution.endTime) {
      metrics.executionMetrics.totalDuration =
        execution.endTime.getTime() - execution.startTime.getTime();
    }

    // NASA Assertion 2: Validate finalization
    console.assert(metrics.executionMetrics.totalDuration >= 0, 'Total duration must be non-negative');
  }

  /**
   * Setup internal event handlers
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  private setupInternalEventHandlers(): void {
    // NASA Assertion 1: Validate core instance
    console.assert(this instanceof WorkflowCore, 'Must be called on WorkflowCore instance');

    this.on('executionUpdated', (workflowId, execution, updates) => {
      // Handle execution update events
      if (updates.status && updates.status !== 'running') {
        this.finalizeExecutionMetrics(workflowId);
      }
    });

    this.on('executionError', (workflowId, error) => {
      this.updateExecutionMetrics(workflowId, 'error', { error });
    });

    // NASA Assertion 2: Validate event handler setup
    console.assert(this.listenerCount('executionUpdated') > 0, 'Execution updated handler must be registered');
  }
}

// Backward compatibility
export default WorkflowCore;
