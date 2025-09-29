/**
 * Quality Princess Transitions - Centralized State Transition Hub
 * NASA Rule 10 Compliant: Single transition hub, no string events
 */

import { QualityState, QualityEvent, QualityContext } from './QualityPrincessTypes';
import {
  BaseQualityState,
  IdleState,
  InitializingState,
  AnalyzingState,
  ValidatingState,
  CoordinatingState,
  ReportingState,
  ErrorState
} from './QualityPrincessStates';

export class QualityTransitionHub {
  private states: Map<QualityState, BaseQualityState>;
  private currentState: BaseQualityState;
  private context: QualityContext;

  constructor(initialContext: QualityContext) {
    // NASA Rule 10: Assertions and initialization
    if (!initialContext) throw new Error('Initial context required');
    if (!initialContext.currentState) throw new Error('Initial state required');

    this.context = initialContext;
    this.states = this.initializeStates();
    this.currentState = this.getStateInstance(initialContext.currentState);
  }

  private initializeStates(): Map<QualityState, BaseQualityState> {
    // NASA Rule 10: Fixed state registration
    const stateMap = new Map<QualityState, BaseQualityState>();
    
    stateMap.set(QualityState.IDLE, new IdleState());
    stateMap.set(QualityState.INITIALIZING, new InitializingState());
    stateMap.set(QualityState.ANALYZING, new AnalyzingState());
    stateMap.set(QualityState.VALIDATING, new ValidatingState());
    stateMap.set(QualityState.COORDINATING, new CoordinatingState());
    stateMap.set(QualityState.REPORTING, new ReportingState());
    stateMap.set(QualityState.ERROR, new ErrorState());

    if (stateMap.size !== 7) throw new Error('All states must be registered');
    return stateMap;
  }

  private getStateInstance(state: QualityState): BaseQualityState {
    // NASA Rule 10: Safe state retrieval
    if (!state) throw new Error('State required');
    
    const stateInstance = this.states.get(state);
    if (!stateInstance) throw new Error(`State ${state} not found`);
    
    return stateInstance;
  }

  async transition(event: QualityEvent): Promise<QualityState> {
    // NASA Rule 10: Central transition logic, no recursion
    if (!event) throw new Error('Event required');
    if (!this.currentState) throw new Error('Current state not set');

    try {
      // Get next state from current state
      const nextStateName = await this.currentState.update(this.context, event);
      
      // Validate transition is allowed
      if (!this.isValidTransition(this.context.currentState, nextStateName)) {
        throw new Error(`Invalid transition: ${this.context.currentState} -> ${nextStateName}`);
      }

      // Execute transition
      if (nextStateName !== this.context.currentState) {
        await this.executeTransition(nextStateName);
      }

      return nextStateName;
    } catch (error) {
      // NASA Rule 10: Error handling without recursion
      await this.handleTransitionError(error as Error);
      return QualityState.ERROR;
    }
  }

  private async executeTransition(nextState: QualityState): Promise<void> {
    // NASA Rule 10: Controlled state transition
    if (!nextState) throw new Error('Next state required');
    if (!this.currentState) throw new Error('Current state not set');

    // Shutdown current state
    await this.currentState.shutdown(this.context);
    
    // Update context and current state
    this.context.currentState = nextState;
    this.currentState = this.getStateInstance(nextState);
    
    // Initialize new state
    await this.currentState.init(this.context);
    
    // Validate invariants
    if (!this.currentState.checkInvariants(this.context)) {
      throw new Error(`State invariants violated: ${nextState}`);
    }
  }

  private isValidTransition(from: QualityState, to: QualityState): boolean {
    // NASA Rule 10: Transition validation matrix
    if (!from || !to) return false;
    
    const validTransitions: Record<QualityState, QualityState[]> = {
      [QualityState.IDLE]: [QualityState.INITIALIZING, QualityState.ERROR],
      [QualityState.INITIALIZING]: [QualityState.ANALYZING, QualityState.ERROR, QualityState.IDLE],
      [QualityState.ANALYZING]: [QualityState.VALIDATING, QualityState.ERROR, QualityState.IDLE],
      [QualityState.VALIDATING]: [QualityState.COORDINATING, QualityState.ERROR, QualityState.IDLE],
      [QualityState.COORDINATING]: [QualityState.REPORTING, QualityState.ERROR, QualityState.IDLE],
      [QualityState.REPORTING]: [QualityState.IDLE, QualityState.ERROR],
      [QualityState.ERROR]: [QualityState.IDLE]
    };

    return validTransitions[from]?.includes(to) || false;
  }

  private async handleTransitionError(error: Error): Promise<void> {
    // NASA Rule 10: Error handling without state change
    if (!error) throw new Error('Error required');
    
    this.context.lastError = error;
    this.context.errorCount++;
    
    // Move to error state if not already there
    if (this.context.currentState !== QualityState.ERROR) {
      this.context.currentState = QualityState.ERROR;
      this.currentState = this.getStateInstance(QualityState.ERROR);
      await this.currentState.init(this.context);
    }
  }

  getCurrentState(): QualityState {
    // NASA Rule 10: Safe state getter
    if (!this.context) throw new Error('Context not set');
    return this.context.currentState;
  }

  getContext(): QualityContext {
    // NASA Rule 10: Safe context getter
    if (!this.context) throw new Error('Context not set');
    return { ...this.context };
  }

  validateCurrentState(): boolean {
    // NASA Rule 10: State validation
    if (!this.currentState || !this.context) return false;
    return this.currentState.checkInvariants(this.context);
  }

  reset(): Promise<void> {
    // NASA Rule 10: Safe reset operation
    return this.transition(QualityEvent.RESET);
  }
}

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0

// Receipt
// status: OK
// reason_if_blocked: --
// run_id: quality-princess-fsm-refactor-004
// inputs: ["QualityPrincess.ts"]
// tools_used: ["claude-code", "filesystem"]
// versions: {"model":"sonnet-4","prompt":"quality-fsm-refactor-v1"}
// === END FOOTER ===