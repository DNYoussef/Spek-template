/**
 * MegaTransitionHub - Centralized State Management for Mega File Decompositions
 *
 * Provides unified state transition management for all mega god object decompositions.
 * Enforces NASA Rule 10 compliance with fixed bounds and assertions.
 *
 * @version 1.0.0
 * @nasa_compliant true
 * @max_function_lines 60
 */

// NASA Rule 10: Fixed bounds constants
const MAX_TRANSITION_ATTEMPTS = 10;
const MAX_STATE_HISTORY = 100;
const MAX_ERROR_RECOVERY_CYCLES = 5;
const MAX_CONCURRENT_TRANSITIONS = 20;

export enum MegaState {
  IDLE = 'idle',
  INITIALIZING = 'initializing',
  PROCESSING = 'processing',
  VALIDATING = 'validating',
  COMPLETING = 'completing',
  ERROR = 'error',
  COMPLETE = 'complete'
}

export enum MegaEvent {
  INITIALIZE = 'initialize',
  START_PROCESSING = 'start_processing',
  PROCESSING_COMPLETE = 'processing_complete',
  VALIDATION_REQUESTED = 'validation_requested',
  VALIDATION_PASSED = 'validation_passed',
  VALIDATION_FAILED = 'validation_failed',
  COMPLETE_REQUESTED = 'complete_requested',
  ERROR_OCCURRED = 'error_occurred',
  RESET_REQUESTED = 'reset_requested'
}

export interface MegaStateContext {
  componentId: string;
  currentState: MegaState;
  previousState: MegaState | null;
  transitionCount: number;
  errorCount: number;
  metadata: Record<string, unknown>;
  timestamp: Date;
}

export interface StateTransition {
  from: MegaState;
  to: MegaState;
  event: MegaEvent;
  guard?: (context: MegaStateContext) => boolean;
  action?: (context: MegaStateContext) => void;
}

/**
 * MegaTransitionHub manages state transitions for mega file decompositions
 * NASA Rule 10: Functions ≤60 lines, no recursion, bounded operations
 */
export class MegaTransitionHub {
  private transitions: Map<string, StateTransition> = new Map();
  private stateHistory: Map<string, MegaStateContext[]> = new Map();
  private activeTransitions: Set<string> = new Set();

  constructor() {
    this.initializeTransitionMatrix();
    this.validateConfiguration();
  }

  /**
   * Initialize the transition matrix with valid state transitions
   * NASA Rule 10: Fixed bounds, no recursion
   */
  private initializeTransitionMatrix(): void {
    const validTransitions: StateTransition[] = [
      { from: MegaState.IDLE, to: MegaState.INITIALIZING, event: MegaEvent.INITIALIZE },
      { from: MegaState.INITIALIZING, to: MegaState.PROCESSING, event: MegaEvent.START_PROCESSING },
      { from: MegaState.PROCESSING, to: MegaState.VALIDATING, event: MegaEvent.PROCESSING_COMPLETE },
      { from: MegaState.VALIDATING, to: MegaState.COMPLETING, event: MegaEvent.VALIDATION_PASSED },
      { from: MegaState.VALIDATING, to: MegaState.ERROR, event: MegaEvent.VALIDATION_FAILED },
      { from: MegaState.COMPLETING, to: MegaState.COMPLETE, event: MegaEvent.COMPLETE_REQUESTED },
      { from: MegaState.ERROR, to: MegaState.PROCESSING, event: MegaEvent.RESET_REQUESTED },
      { from: MegaState.ERROR, to: MegaState.IDLE, event: MegaEvent.RESET_REQUESTED }
    ];

    // NASA Rule 10: Bounded loop with fixed maximum iterations
    for (let i = 0; i < Math.min(validTransitions.length, MAX_TRANSITION_ATTEMPTS); i++) {
      const transition = validTransitions[i];
      const key = this.getTransitionKey(transition.from, transition.event);
      this.transitions.set(key, transition);
    }

    // NASA Rule 10: Assertion
    console.assert(this.transitions.size > 0, 'Transition matrix must not be empty');
  }

  /**
   * Execute state transition with validation and bounds checking
   * NASA Rule 10: Fixed bounds, assertions for safety
   */
  public transition(componentId: string, event: MegaEvent, context: MegaStateContext): boolean {
    // NASA Rule 10: Input validation assertions
    console.assert(componentId.length > 0, 'Component ID cannot be empty');
    console.assert(this.activeTransitions.size < MAX_CONCURRENT_TRANSITIONS, 'Too many concurrent transitions');

    const transitionKey = this.getTransitionKey(context.currentState, event);
    const transition = this.transitions.get(transitionKey);

    if (!transition) {
      return false;
    }

    // Execute guard condition if present
    if (transition.guard && !transition.guard(context)) {
      return false;
    }

    // Update context with new state
    const newContext: MegaStateContext = {
      ...context,
      previousState: context.currentState,
      currentState: transition.to,
      transitionCount: context.transitionCount + 1,
      timestamp: new Date()
    };

    // Execute transition action if present
    if (transition.action) {
      transition.action(newContext);
    }

    // Record state history with bounds
    this.recordStateHistory(componentId, newContext);

    return true;
  }

  /**
   * Record state history with NASA Rule 10 bounds
   */
  private recordStateHistory(componentId: string, context: MegaStateContext): void {
    if (!this.stateHistory.has(componentId)) {
      this.stateHistory.set(componentId, []);
    }

    const history = this.stateHistory.get(componentId)!;
    history.push(context);

    // NASA Rule 10: Bounded array size
    if (history.length > MAX_STATE_HISTORY) {
      history.splice(0, history.length - MAX_STATE_HISTORY);
    }

    // NASA Rule 10: Assertion
    console.assert(history.length <= MAX_STATE_HISTORY, 'State history exceeds maximum size');
  }

  /**
   * Get transition key for lookup
   */
  private getTransitionKey(state: MegaState, event: MegaEvent): string {
    return `${state}:${event}`;
  }

  /**
   * Validate configuration with NASA Rule 10 assertions
   */
  private validateConfiguration(): void {
    console.assert(this.transitions.size > 0, 'Transition matrix cannot be empty');
    console.assert(MAX_TRANSITION_ATTEMPTS > 0, 'Maximum transition attempts must be positive');
    console.assert(MAX_STATE_HISTORY > 0, 'Maximum state history must be positive');
  }

  /**
   * Get current state for component
   */
  public getCurrentState(componentId: string): MegaState | null {
    const history = this.stateHistory.get(componentId);
    return history && history.length > 0 ? history[history.length - 1].currentState : null;
  }

  /**
   * Reset component state to IDLE
   */
  public reset(componentId: string): void {
    this.stateHistory.delete(componentId);
    this.activeTransitions.delete(componentId);
  }
}