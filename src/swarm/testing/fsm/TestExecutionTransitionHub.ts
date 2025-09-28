/**
 * Test Execution Transition Hub
 * NASA Rule 10 Compliant - Functions ≤60 lines
 */

import { EventEmitter } from 'events';
import {
  TestExecutionState,
  TestExecutionEvent,
  TestExecutionContext,
  StateTransition,
  TEST_EXECUTION_TRANSITIONS
} from './TestExecutionStates';

export class TestExecutionTransitionHub extends EventEmitter {
  private transitions: Map<string, StateTransition> = new Map();
  private executionStates: Map<string, TestExecutionState> = new Map();
  private contexts: Map<string, TestExecutionContext> = new Map();

  constructor() {
    super();
    this.initializeTransitions();
  }

  /**
   * Initialize state transitions map
   */
  private initializeTransitions(): void {
    TEST_EXECUTION_TRANSITIONS.forEach(transition => {
      const key = this.createTransitionKey(transition.from, transition.event);
      this.transitions.set(key, transition);
    });
  }

  /**
   * Create unique key for state transition
   */
  private createTransitionKey(state: TestExecutionState, event: TestExecutionEvent): string {
    return `${state}:${event}`;
  }

  /**
   * Register execution context
   */
  registerExecution(context: TestExecutionContext): void {
    this.contexts.set(context.executionId, context);
    this.executionStates.set(context.executionId, TestExecutionState.IDLE);
    console.log(`Registered execution: ${context.executionId}`);
  }

  /**
   * Get current state of execution
   */
  getCurrentState(executionId: string): TestExecutionState | undefined {
    return this.executionStates.get(executionId);
  }

  /**
   * Get execution context
   */
  getContext(executionId: string): TestExecutionContext | undefined {
    return this.contexts.get(executionId);
  }

  /**
   * Handle state transition
   */
  async handleTransition(
    executionId: string,
    event: TestExecutionEvent
  ): Promise<boolean> {
    const currentState = this.executionStates.get(executionId);
    const context = this.contexts.get(executionId);

    if (!currentState || !context) {
      console.error(`Execution not found: ${executionId}`);
      return false;
    }

    return this.executeTransition(executionId, currentState, event, context);
  }

  /**
   * Execute state transition with validation
   */
  private async executeTransition(
    executionId: string,
    currentState: TestExecutionState,
    event: TestExecutionEvent,
    context: TestExecutionContext
  ): Promise<boolean> {
    const transitionKey = this.createTransitionKey(currentState, event);
    const transition = this.transitions.get(transitionKey);

    if (!transition) {
      console.warn(`No transition found: ${currentState} -> ${event}`);
      return false;
    }

    return this.performTransition(executionId, transition, context);
  }

  /**
   * Perform the actual state transition
   */
  private async performTransition(
    executionId: string,
    transition: StateTransition,
    context: TestExecutionContext
  ): Promise<boolean> {
    try {
      // Check guard condition if present
      if (transition.guard && !transition.guard(context)) {
        console.log(`Guard condition failed for transition: ${transition.from} -> ${transition.to}`);
        return false;
      }

      // Execute transition action if present
      if (transition.action) {
        await transition.action(context);
      }

      // Update state
      this.executionStates.set(executionId, transition.to);

      // Emit state change event
      this.emit('stateChanged', {
        executionId,
        from: transition.from,
        to: transition.to,
        event: transition.event
      });

      console.log(`State transition: ${transition.from} -> ${transition.to} (${executionId})`);
      return true;

    } catch (error) {
      console.error(`Transition failed: ${transition.from} -> ${transition.to}`, error);
      context.errors.push(error as Error);

      // Transition to failed state
      this.executionStates.set(executionId, TestExecutionState.FAILED);
      return false;
    }
  }

  /**
   * Clean up execution
   */
  cleanupExecution(executionId: string): void {
    this.contexts.delete(executionId);
    this.executionStates.delete(executionId);
    console.log(`Cleaned up execution: ${executionId}`);
  }

  /**
   * Get all active executions
   */
  getActiveExecutions(): string[] {
    return Array.from(this.executionStates.keys());
  }

  /**
   * Check if execution is in terminal state
   */
  isTerminalState(executionId: string): boolean {
    const state = this.executionStates.get(executionId);
    return state === TestExecutionState.COMPLETED ||
           state === TestExecutionState.FAILED ||
           state === TestExecutionState.CANCELLED;
  }
}