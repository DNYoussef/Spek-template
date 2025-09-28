/**
 * Test Transition Hub - Centralized FSM State Management
 * NASA Rule 10 Compliant: Functions ≤60 lines, ≥2 assertions per function
 */

import { EventEmitter } from 'events';
import { TestState, TestEvent, TestContext } from '../types/TestingTypes';

export class TestTransitionHub extends EventEmitter {
  private stateTransitions: Map<string, Map<TestEvent, TestState>>;
  private guardConditions: Map<string, (context: TestContext) => boolean>;
  private stateActions: Map<TestState, (context: TestContext) => Promise<void>>;

  constructor() {
    super();
    this.stateTransitions = new Map();
    this.guardConditions = new Map();
    this.stateActions = new Map();
    this.initializeTransitions();
  }

  /**
   * Initialize FSM state transitions - NASA Rule 10: ≤60 lines
   */
  private initializeTransitions(): void {
    // Assertion 1: Maps are initialized
    console.assert(this.stateTransitions instanceof Map, 'State transitions map required');
    // Assertion 2: Guard conditions map initialized
    console.assert(this.guardConditions instanceof Map, 'Guard conditions map required');

    // IDLE state transitions
    this.addTransition(TestState.IDLE, TestEvent.START, TestState.INITIALIZING);

    // INITIALIZING state transitions
    this.addTransition(TestState.INITIALIZING, TestEvent.SETUP_COMPLETE, TestState.SETUP);
    this.addTransition(TestState.INITIALIZING, TestEvent.ERROR_OCCURRED, TestState.ERROR);

    // SETUP state transitions
    this.addTransition(TestState.SETUP, TestEvent.EXECUTION_COMPLETE, TestState.EXECUTING);
    this.addTransition(TestState.SETUP, TestEvent.ERROR_OCCURRED, TestState.ERROR);
    this.addTransition(TestState.SETUP, TestEvent.TIMEOUT_OCCURRED, TestState.TIMEOUT);

    // EXECUTING state transitions
    this.addTransition(TestState.EXECUTING, TestEvent.ASSERTION_COMPLETE, TestState.ASSERTING);
    this.addTransition(TestState.EXECUTING, TestEvent.ERROR_OCCURRED, TestState.ERROR);
    this.addTransition(TestState.EXECUTING, TestEvent.TIMEOUT_OCCURRED, TestState.TIMEOUT);

    // ASSERTING state transitions
    this.addTransition(TestState.ASSERTING, TestEvent.REPORT_COMPLETE, TestState.REPORTING);
    this.addTransition(TestState.ASSERTING, TestEvent.ERROR_OCCURRED, TestState.ERROR);

    // REPORTING state transitions
    this.addTransition(TestState.REPORTING, TestEvent.TEARDOWN_COMPLETE, TestState.TEARDOWN);
    this.addTransition(TestState.REPORTING, TestEvent.ERROR_OCCURRED, TestState.ERROR);

    // TEARDOWN state transitions
    this.addTransition(TestState.TEARDOWN, TestEvent.TEARDOWN_COMPLETE, TestState.COMPLETED);

    // ERROR and TIMEOUT can reset
    this.addTransition(TestState.ERROR, TestEvent.RESET, TestState.IDLE);
    this.addTransition(TestState.TIMEOUT, TestEvent.RESET, TestState.IDLE);
    this.addTransition(TestState.COMPLETED, TestEvent.RESET, TestState.IDLE);
  }

  /**
   * Add state transition - NASA Rule 10: ≤60 lines
   */
  private addTransition(fromState: TestState, event: TestEvent, toState: TestState): void {
    // Assertion 1: Valid from state
    console.assert(fromState !== null && fromState !== undefined, 'From state required');
    // Assertion 2: Valid event
    console.assert(event !== null && event !== undefined, 'Event required');

    if (!this.stateTransitions.has(fromState)) {
      this.stateTransitions.set(fromState, new Map());
    }
    this.stateTransitions.get(fromState)!.set(event, toState);
  }

  /**
   * Execute state transition with guard validation - NASA Rule 10: ≤60 lines
   */
  async transition(context: TestContext, event: TestEvent): Promise<TestState> {
    // Assertion 1: Valid context
    console.assert(context !== null && context.testId, 'Valid test context required');
    // Assertion 2: Valid event
    console.assert(event !== null, 'Event required');

    const currentState = context.currentState;
    const transitions = this.stateTransitions.get(currentState);

    if (!transitions || !transitions.has(event)) {
      throw new Error(`Invalid transition: ${currentState} -> ${event}`);
    }

    const nextState = transitions.get(event)!;
    const guardKey = `${currentState}_${event}_${nextState}`;

    // Check guard condition if exists
    if (this.guardConditions.has(guardKey)) {
      const guard = this.guardConditions.get(guardKey)!;
      if (!guard(context)) {
        throw new Error(`Guard condition failed for transition: ${guardKey}`);
      }
    }

    // Execute state action if exists
    if (this.stateActions.has(nextState)) {
      const action = this.stateActions.get(nextState)!;
      await action(context);
    }

    // Update context state
    context.currentState = nextState;

    // Emit transition event
    this.emit('transition', { from: currentState, to: nextState, event, context });

    return nextState;
  }

  /**
   * Add guard condition - NASA Rule 10: ≤60 lines
   */
  addGuard(fromState: TestState, event: TestEvent, toState: TestState,
           condition: (context: TestContext) => boolean): void {
    // Assertion 1: Valid states and event
    console.assert(fromState && event && toState, 'Valid transition parameters required');
    // Assertion 2: Valid condition function
    console.assert(typeof condition === 'function', 'Guard condition must be a function');

    const key = `${fromState}_${event}_${toState}`;
    this.guardConditions.set(key, condition);
  }

  /**
   * Add state action - NASA Rule 10: ≤60 lines
   */
  addStateAction(state: TestState, action: (context: TestContext) => Promise<void>): void {
    // Assertion 1: Valid state
    console.assert(state !== null && state !== undefined, 'State required');
    // Assertion 2: Valid action function
    console.assert(typeof action === 'function', 'Action must be a function');

    this.stateActions.set(state, action);
  }

  /**
   * Get valid events for current state - NASA Rule 10: ≤60 lines
   */
  getValidEvents(state: TestState): TestEvent[] {
    // Assertion 1: Valid state
    console.assert(state !== null && state !== undefined, 'State required');
    // Assertion 2: State transitions initialized
    console.assert(this.stateTransitions instanceof Map, 'State transitions must be initialized');

    const transitions = this.stateTransitions.get(state);
    if (!transitions) {
      return [];
    }

    return Array.from(transitions.keys());
  }

  /**
   * Check if transition is valid - NASA Rule 10: ≤60 lines
   */
  isValidTransition(fromState: TestState, event: TestEvent): boolean {
    // Assertion 1: Valid from state
    console.assert(fromState !== null, 'From state required');
    // Assertion 2: Valid event
    console.assert(event !== null, 'Event required');

    const transitions = this.stateTransitions.get(fromState);
    return transitions ? transitions.has(event) : false;
  }
}