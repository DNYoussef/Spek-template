/**
 * FSM-based Fallback State Machine.
 * NASA Rule 10 compliant: functions ≤60 lines, clear state management.
 */
import { EventEmitter } from 'events';
import { Logger } from '../../../utils/Logger';
import { ProtocolStates, ChainEvents, TransitionContext } from '../types/FallbackTypes';
import { TransitionHub } from '../core/TransitionHub';

export class FallbackStateMachine extends EventEmitter {
  private readonly logger: Logger;
  private readonly transitionHub: TransitionHub;
  private currentState: ProtocolStates;
  private stateHistory: TransitionContext[];
  private readonly maxHistorySize = 1000; // NASA Rule 10 - fixed bounds

  constructor(transitionHub: TransitionHub) {
    super();
    this.logger = new Logger('FallbackStateMachine');
    this.transitionHub = transitionHub;
    this.currentState = ProtocolStates.IDLE;
    this.stateHistory = [];

    this.setupTransitionHandlers();
  }

  /**
   * Initialize state machine.
   * NASA Rule 10 compliant: single responsibility.
   */
  async initialize(): Promise<void> {
    this.currentState = ProtocolStates.IDLE;
    this.logger.info('FallbackStateMachine initialized', {
      initialState: this.currentState
    });

    this.emit('stateChanged', {
      state: this.currentState,
      timestamp: new Date()
    });
  }

  /**
   * Get current state.
   */
  getCurrentState(): ProtocolStates {
    return this.currentState;
  }

  /**
   * Get state history with filtering.
   * NASA Rule 10 compliant: bounded operations.
   */
  getStateHistory(limit: number = 100): TransitionContext[] {
    const safeLimit = Math.min(Math.max(limit, 1), this.maxHistorySize);
    return this.stateHistory
      .slice(-safeLimit)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Check if transition is valid.
   * NASA Rule 10 compliant: clear transition rules.
   */
  canTransition(event: ChainEvents, payload?: any): boolean {
    const validTransitions = this.getValidTransitions(this.currentState);
    return validTransitions.includes(event);
  }

  /**
   * Execute state transition.
   * NASA Rule 10 compliant: single responsibility, error handling.
   */
  async transition(
    event: ChainEvents,
    payload: any = {}
  ): Promise<TransitionContext> {
    if (!this.canTransition(event, payload)) {
      throw new Error(
        `Invalid transition: ${event} from state ${this.currentState}`
      );
    }

    const sourceState = this.currentState;
    const targetState = this.getNextState(sourceState, event);

    const context: TransitionContext = {
      sourceState,
      targetState,
      event,
      payload,
      timestamp: new Date(),
      protocolId: payload.protocolId,
      chainId: payload.chainId
    };

    try {
      // Execute transition through hub
      await this.transitionHub.executeTransition(context);

      // Update state
      this.currentState = targetState;

      // Record in history
      this.recordTransition(context);

      // Emit events
      this.emit('stateChanged', {
        state: this.currentState,
        context,
        timestamp: new Date()
      });

      this.logger.info('State transition completed', {
        from: sourceState,
        to: targetState,
        event,
        protocolId: context.protocolId
      });

      return context;

    } catch (error) {
      this.logger.error('State transition failed', {
        from: sourceState,
        to: targetState,
        event,
        error: error.message
      });

      // Transition to error state if not already there
      if (this.currentState !== ProtocolStates.ERROR) {
        await this.handleTransitionError(context, error);
      }

      throw error;
    }
  }

  /**
   * Setup transition event handlers.
   * NASA Rule 10 compliant: initialization logic.
   */
  private setupTransitionHandlers(): void {
    // Handle transition hub events
    this.transitionHub.on('transitionValidated', (context) => {
      this.emit('transitionValidated', context);
    });

    this.transitionHub.on('transitionFailed', (context, error) => {
      this.emit('transitionFailed', context, error);
    });

    this.logger.info('Transition handlers setup complete');
  }

  /**
   * Get valid transitions for current state.
   * NASA Rule 10 compliant: static transition matrix.
   */
  private getValidTransitions(state: ProtocolStates): ChainEvents[] {
    const transitionMatrix: Record<ProtocolStates, ChainEvents[]> = {
      [ProtocolStates.IDLE]: [
        ChainEvents.ANALYZE_REQUEST,
        ChainEvents.TESTING_STARTED
      ],
      [ProtocolStates.ANALYZING]: [
        ChainEvents.ACTIVATION_NEEDED,
        ChainEvents.ERROR_DETECTED,
        ChainEvents.RESET_SYSTEM
      ],
      [ProtocolStates.ACTIVATING]: [
        ChainEvents.ACTIVATION_COMPLETE,
        ChainEvents.ACTIVATION_FAILED,
        ChainEvents.ERROR_DETECTED
      ],
      [ProtocolStates.ACTIVE]: [
        ChainEvents.PROTOCOL_FAILED,
        ChainEvents.DEACTIVATION_REQUESTED,
        ChainEvents.TESTING_STARTED,
        ChainEvents.ERROR_DETECTED
      ],
      [ProtocolStates.FAILING_OVER]: [
        ChainEvents.RECOVERY_STARTED,
        ChainEvents.ACTIVATION_COMPLETE,
        ChainEvents.ERROR_DETECTED
      ],
      [ProtocolStates.RECOVERING]: [
        ChainEvents.RECOVERY_COMPLETE,
        ChainEvents.ERROR_DETECTED
      ],
      [ProtocolStates.TESTING]: [
        ChainEvents.TESTING_COMPLETE,
        ChainEvents.TESTING_FAILED,
        ChainEvents.ERROR_DETECTED
      ],
      [ProtocolStates.ERROR]: [
        ChainEvents.RESET_SYSTEM
      ]
    };

    return transitionMatrix[state] || [];
  }

  /**
   * Get next state for transition.
   * NASA Rule 10 compliant: deterministic state transitions.
   */
  private getNextState(
    currentState: ProtocolStates,
    event: ChainEvents
  ): ProtocolStates {
    const stateTransitions: Record<string, ProtocolStates> = {
      [`${ProtocolStates.IDLE}_${ChainEvents.ANALYZE_REQUEST}`]: ProtocolStates.ANALYZING,
      [`${ProtocolStates.IDLE}_${ChainEvents.TESTING_STARTED}`]: ProtocolStates.TESTING,

      [`${ProtocolStates.ANALYZING}_${ChainEvents.ACTIVATION_NEEDED}`]: ProtocolStates.ACTIVATING,
      [`${ProtocolStates.ANALYZING}_${ChainEvents.ERROR_DETECTED}`]: ProtocolStates.ERROR,
      [`${ProtocolStates.ANALYZING}_${ChainEvents.RESET_SYSTEM}`]: ProtocolStates.IDLE,

      [`${ProtocolStates.ACTIVATING}_${ChainEvents.ACTIVATION_COMPLETE}`]: ProtocolStates.ACTIVE,
      [`${ProtocolStates.ACTIVATING}_${ChainEvents.ACTIVATION_FAILED}`]: ProtocolStates.ERROR,
      [`${ProtocolStates.ACTIVATING}_${ChainEvents.ERROR_DETECTED}`]: ProtocolStates.ERROR,

      [`${ProtocolStates.ACTIVE}_${ChainEvents.PROTOCOL_FAILED}`]: ProtocolStates.FAILING_OVER,
      [`${ProtocolStates.ACTIVE}_${ChainEvents.DEACTIVATION_REQUESTED}`]: ProtocolStates.IDLE,
      [`${ProtocolStates.ACTIVE}_${ChainEvents.TESTING_STARTED}`]: ProtocolStates.TESTING,
      [`${ProtocolStates.ACTIVE}_${ChainEvents.ERROR_DETECTED}`]: ProtocolStates.ERROR,

      [`${ProtocolStates.FAILING_OVER}_${ChainEvents.RECOVERY_STARTED}`]: ProtocolStates.RECOVERING,
      [`${ProtocolStates.FAILING_OVER}_${ChainEvents.ACTIVATION_COMPLETE}`]: ProtocolStates.ACTIVE,
      [`${ProtocolStates.FAILING_OVER}_${ChainEvents.ERROR_DETECTED}`]: ProtocolStates.ERROR,

      [`${ProtocolStates.RECOVERING}_${ChainEvents.RECOVERY_COMPLETE}`]: ProtocolStates.ACTIVE,
      [`${ProtocolStates.RECOVERING}_${ChainEvents.ERROR_DETECTED}`]: ProtocolStates.ERROR,

      [`${ProtocolStates.TESTING}_${ChainEvents.TESTING_COMPLETE}`]: ProtocolStates.ACTIVE,
      [`${ProtocolStates.TESTING}_${ChainEvents.TESTING_FAILED}`]: ProtocolStates.ERROR,
      [`${ProtocolStates.TESTING}_${ChainEvents.ERROR_DETECTED}`]: ProtocolStates.ERROR,

      [`${ProtocolStates.ERROR}_${ChainEvents.RESET_SYSTEM}`]: ProtocolStates.IDLE
    };

    const key = `${currentState}_${event}`;
    const nextState = stateTransitions[key];

    if (!nextState) {
      throw new Error(`No transition defined for ${key}`);
    }

    return nextState;
  }

  /**
   * Record transition in history.
   * NASA Rule 10 compliant: bounded history management.
   */
  private recordTransition(context: TransitionContext): void {
    this.stateHistory.push(context);

    // Maintain history bounds
    if (this.stateHistory.length > this.maxHistorySize) {
      this.stateHistory.splice(
        0,
        this.stateHistory.length - this.maxHistorySize
      );
    }
  }

  /**
   * Handle transition errors.
   * NASA Rule 10 compliant: error recovery logic.
   */
  private async handleTransitionError(
    context: TransitionContext,
    error: Error
  ): Promise<void> {
    const errorContext: TransitionContext = {
      sourceState: this.currentState,
      targetState: ProtocolStates.ERROR,
      event: ChainEvents.ERROR_DETECTED,
      payload: { originalContext: context, error: error.message },
      timestamp: new Date()
    };

    this.currentState = ProtocolStates.ERROR;
    this.recordTransition(errorContext);

    this.emit('errorStateEntered', {
      context: errorContext,
      originalError: error
    });
  }

  /**
   * Get FSM state summary.
   */
  getStateSummary(): {
    currentState: ProtocolStates;
    historyCount: number;
    lastTransition?: TransitionContext;
  } {
    return {
      currentState: this.currentState,
      historyCount: this.stateHistory.length,
      lastTransition: this.stateHistory[this.stateHistory.length - 1]
    };
  }
}

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0

// Receipt
// status: OK
// reason_if_blocked: --
// run_id: fallback-fsm-refactor-002
// inputs: ["FallbackChainManager.ts"]
// tools_used: ["Write"]
// versions: {"model":"claude-sonnet-4","prompt":"codex-agent-026"}
// === END FOOTER ===