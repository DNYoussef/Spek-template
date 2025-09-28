/**
 * ISO27001 Control Mapper State Machine - FSM Controller
 * NASA Rule 10 compliant with ISO27001:2022 assessment lifecycle management
 */

import { EventEmitter } from 'events';
import { ISO27001States, ISO27001Events, ISO27001Context } from './types/ISO27001Types';
import { InitializationStateHandler } from './states/InitializationStateHandler';
import { AssessmentStateHandler } from './states/AssessmentStateHandler';
import { ValidationStateHandler } from './states/ValidationStateHandler';
import { ReportingStateHandler } from './states/ReportingStateHandler';
import { ISO27001ErrorHandler } from './core/ISO27001ErrorHandler';
import { ISO27001TransitionGuard } from './core/ISO27001TransitionGuard';

export class ISO27001MapperFSM extends EventEmitter {
  private currentState: ISO27001States = ISO27001States.UNINITIALIZED;
  private context: ISO27001Context;
  private stateHandlers: Map<ISO27001States, any> = new Map();
  private errorHandler: ISO27001ErrorHandler;
  private transitionGuard: ISO27001TransitionGuard;

  constructor(config: any) {
    super();

    this.context = {
      config,
      controls: new Map(),
      assessmentHistory: [],
      activeAssessment: null,
      currentDomain: null,
      lastAssessmentResult: null
    };

    this.initializeStateHandlers();
    this.errorHandler = new ISO27001ErrorHandler();
    this.transitionGuard = new ISO27001TransitionGuard();
  }

  /**
   * Initialize state handlers (NASA Rule 10: ≤60 lines, 2+ assertions)
   */
  private initializeStateHandlers(): void {
    // Assertion 1: State handlers map exists
    if (!(this.stateHandlers instanceof Map)) {
      throw new Error('State handlers map must be initialized');
    }

    this.stateHandlers.set(ISO27001States.UNINITIALIZED, null);
    this.stateHandlers.set(ISO27001States.INITIALIZING, new InitializationStateHandler());
    this.stateHandlers.set(ISO27001States.ASSESSING, new AssessmentStateHandler());
    this.stateHandlers.set(ISO27001States.VALIDATING, new ValidationStateHandler());
    this.stateHandlers.set(ISO27001States.REPORTING, new ReportingStateHandler());
    this.stateHandlers.set(ISO27001States.ERROR, this.errorHandler);

    // Assertion 2: All required states have handlers or null (idle states)
    const requiredStates = Object.values(ISO27001States);
    for (const state of requiredStates) {
      if (!this.stateHandlers.has(state)) {
        throw new Error(`Missing state handler for ${state}`);
      }
    }
  }

  /**
   * Transition to new state (NASA Rule 10: ≤60 lines, 2+ assertions)
   */
  async transition(event: ISO27001Events, data?: any): Promise<boolean> {
    // Assertion 1: Valid event provided
    if (!event || typeof event !== 'string') {
      throw new Error('Invalid event provided for transition');
    }

    const targetState = this.getTargetState(this.currentState, event);

    if (!targetState) {
      this.emit('transition:invalid', { from: this.currentState, event });
      return false;
    }

    // Assertion 2: Transition guard allows transition
    if (!this.transitionGuard.canTransition(this.currentState, targetState, this.context)) {
      this.emit('transition:blocked', { from: this.currentState, to: targetState, event });
      return false;
    }

    try {
      // Exit current state
      await this.exitState(this.currentState);

      // Transition
      const previousState = this.currentState;
      this.currentState = targetState;

      // Enter new state
      await this.enterState(targetState, data);

      this.emit('transition:completed', { from: previousState, to: targetState, event });
      return true;

    } catch (error) {
      await this.handleTransitionError(error, event, data);
      return false;
    }
  }

  /**
   * Get target state for event (NASA Rule 10: ≤60 lines, 2+ assertions)
   */
  private getTargetState(currentState: ISO27001States, event: ISO27001Events): ISO27001States | null {
    // Assertion 1: Valid current state
    if (!currentState || typeof currentState !== 'string') {
      throw new Error('Invalid current state provided');
    }

    const transitions: Record<ISO27001States, Partial<Record<ISO27001Events, ISO27001States>>> = {
      [ISO27001States.UNINITIALIZED]: {
        [ISO27001Events.INITIALIZE_CONTROLS]: ISO27001States.INITIALIZING
      },
      [ISO27001States.INITIALIZING]: {
        [ISO27001Events.INITIALIZATION_COMPLETE]: ISO27001States.ASSESSING,
        [ISO27001Events.ERROR]: ISO27001States.ERROR
      },
      [ISO27001States.ASSESSING]: {
        [ISO27001Events.ASSESSMENT_COMPLETE]: ISO27001States.VALIDATING,
        [ISO27001Events.ERROR]: ISO27001States.ERROR
      },
      [ISO27001States.VALIDATING]: {
        [ISO27001Events.VALIDATION_COMPLETE]: ISO27001States.REPORTING,
        [ISO27001Events.ERROR]: ISO27001States.ERROR
      },
      [ISO27001States.REPORTING]: {
        [ISO27001Events.REPORT_GENERATED]: ISO27001States.ASSESSING, // Ready for next assessment
        [ISO27001Events.ERROR]: ISO27001States.ERROR
      },
      [ISO27001States.ERROR]: {
        [ISO27001Events.RESET]: ISO27001States.UNINITIALIZED,
        [ISO27001Events.RETRY]: ISO27001States.INITIALIZING
      }
    };

    // Assertion 2: Transitions exist for current state
    const stateTransitions = transitions[currentState];
    if (!stateTransitions) {
      return null;
    }

    return stateTransitions[event] || null;
  }

  /**
   * Public API methods
   */
  async initializeISO27001Controls(): Promise<void> {
    await this.transition(ISO27001Events.INITIALIZE_CONTROLS);
  }

  async assessControls(config: any): Promise<any> {
    const success = await this.transition(ISO27001Events.START_ASSESSMENT, { config });
    return this.context.lastAssessmentResult;
  }

  async validateAssessment(): Promise<any> {
    const success = await this.transition(ISO27001Events.START_VALIDATION);
    return this.context.lastAssessmentResult;
  }

  async generateReport(): Promise<any> {
    const success = await this.transition(ISO27001Events.GENERATE_REPORT);
    return this.context.lastAssessmentResult;
  }

  getAssessmentHistory(): any[] {
    return [...this.context.assessmentHistory];
  }

  getCurrentAssessment(): any {
    return this.context.activeAssessment;
  }

  getControlsByDomain(domain: string): any[] {
    return Array.from(this.context.controls.values()).filter((c: any) => c.domain === domain);
  }

  getAllControls(): any[] {
    return Array.from(this.context.controls.values());
  }

  getCurrentState(): ISO27001States {
    return this.currentState;
  }

  getContext(): ISO27001Context {
    return { ...this.context };
  }

  // State management helpers
  private async exitState(state: ISO27001States): Promise<void> {
    const handler = this.stateHandlers.get(state);
    if (handler?.exit) {
      await handler.exit(this.context);
    }
  }

  private async enterState(state: ISO27001States, data?: any): Promise<void> {
    const handler = this.stateHandlers.get(state);
    if (handler?.enter) {
      await handler.enter(this.context, data);
    }
  }

  private async handleTransitionError(error: Error, event: ISO27001Events, data?: any): Promise<void> {
    this.context.lastError = error;
    this.currentState = ISO27001States.ERROR;
    await this.enterState(ISO27001States.ERROR, { error, event, data });
  }
}