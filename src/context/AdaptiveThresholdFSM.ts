/**
 * Adaptive Threshold Manager State Machine - Dynamic Threshold FSM Controller
 * NASA Rule 10 compliant with threshold adaptation lifecycle management
 */

import { EventEmitter } from 'events';
import { ThresholdStates, ThresholdEvents, ThresholdContext } from './types/AdaptiveThresholdTypes';
import { InitializationStateHandler } from './states/InitializationStateHandler';
import { MonitoringStateHandler } from './states/MonitoringStateHandler';
import { AdaptationStateHandler } from './states/AdaptationStateHandler';
import { ThresholdErrorHandler } from './core/ThresholdErrorHandler';
import { ThresholdTransitionGuard } from './core/ThresholdTransitionGuard';

export class AdaptiveThresholdFSM extends EventEmitter {
  private currentState: ThresholdStates = ThresholdStates.UNINITIALIZED;
  private context: ThresholdContext;
  private stateHandlers: Map<ThresholdStates, any> = new Map();
  private errorHandler: ThresholdErrorHandler;
  private transitionGuard: ThresholdTransitionGuard;

  // Constants (NASA Rule 10: Fixed bounds)
  private readonly MAX_HISTORY = 1000;
  private readonly MAX_CONDITIONS = 100;
  private readonly LEARNING_RATE = 0.1;
  private readonly CONFIDENCE_THRESHOLD = 0.7;

  constructor() {
    super();

    this.context = {
      thresholds: new Map(),
      rules: new Map(),
      history: [],
      conditions: [],
      maxHistory: this.MAX_HISTORY,
      maxConditions: this.MAX_CONDITIONS,
      learningRate: this.LEARNING_RATE,
      confidenceThreshold: this.CONFIDENCE_THRESHOLD,
      isAdaptationActive: false
    };

    this.initializeStateHandlers();
    this.errorHandler = new ThresholdErrorHandler();
    this.transitionGuard = new ThresholdTransitionGuard();
  }

  /**
   * Initialize state handlers (NASA Rule 10: ≤60 lines, 2+ assertions)
   */
  private initializeStateHandlers(): void {
    // Assertion 1: State handlers map exists
    if (!(this.stateHandlers instanceof Map)) {
      throw new Error('State handlers map must be initialized');
    }

    this.stateHandlers.set(ThresholdStates.UNINITIALIZED, null);
    this.stateHandlers.set(ThresholdStates.INITIALIZING, new InitializationStateHandler());
    this.stateHandlers.set(ThresholdStates.MONITORING, new MonitoringStateHandler());
    this.stateHandlers.set(ThresholdStates.ADAPTING, new AdaptationStateHandler());
    this.stateHandlers.set(ThresholdStates.ERROR, this.errorHandler);

    // Assertion 2: All required states have handlers or null (idle states)
    const requiredStates = Object.values(ThresholdStates);
    for (const state of requiredStates) {
      if (!this.stateHandlers.has(state)) {
        throw new Error(`Missing state handler for ${state}`);
      }
    }
  }

  /**
   * Transition to new state (NASA Rule 10: ≤60 lines, 2+ assertions)
   */
  async transition(event: ThresholdEvents, data?: any): Promise<boolean> {
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
  private getTargetState(currentState: ThresholdStates, event: ThresholdEvents): ThresholdStates | null {
    // Assertion 1: Valid current state
    if (!currentState || typeof currentState !== 'string') {
      throw new Error('Invalid current state provided');
    }

    const transitions: Record<ThresholdStates, Partial<Record<ThresholdEvents, ThresholdStates>>> = {
      [ThresholdStates.UNINITIALIZED]: {
        [ThresholdEvents.INITIALIZE]: ThresholdStates.INITIALIZING
      },
      [ThresholdStates.INITIALIZING]: {
        [ThresholdEvents.INITIALIZATION_COMPLETE]: ThresholdStates.MONITORING,
        [ThresholdEvents.ERROR]: ThresholdStates.ERROR
      },
      [ThresholdStates.MONITORING]: {
        [ThresholdEvents.CONDITIONS_UPDATED]: ThresholdStates.MONITORING, // Self-transition
        [ThresholdEvents.ADAPTATION_TRIGGERED]: ThresholdStates.ADAPTING,
        [ThresholdEvents.ERROR]: ThresholdStates.ERROR
      },
      [ThresholdStates.ADAPTING]: {
        [ThresholdEvents.ADAPTATION_COMPLETE]: ThresholdStates.MONITORING,
        [ThresholdEvents.ERROR]: ThresholdStates.ERROR
      },
      [ThresholdStates.ERROR]: {
        [ThresholdEvents.RESET]: ThresholdStates.UNINITIALIZED
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
  async initialize(): Promise<boolean> {
    return await this.transition(ThresholdEvents.INITIALIZE);
  }

  async updateSystemConditions(condition: any): Promise<void> {
    await this.transition(ThresholdEvents.CONDITIONS_UPDATED, { condition });
  }

  getThreshold(name: string): number | null {
    const threshold = this.context.thresholds.get(name);
    return threshold ? threshold.value : null;
  }

  setThreshold(name: string, value: number, reason: string = 'Manual override'): boolean {
    const threshold = this.context.thresholds.get(name);
    if (!threshold) return false;

    threshold.value = Math.max(threshold.min, Math.min(threshold.max, value));
    threshold.timestamp = Date.now();

    this.context.history.push({
      timestamp: Date.now(),
      threshold: name,
      oldValue: threshold.value,
      newValue: value,
      reason,
      confidence: 1.0 // Manual overrides have full confidence
    });

    return true;
  }

  getCurrentState(): ThresholdStates {
    return this.currentState;
  }

  getContext(): ThresholdContext {
    return { ...this.context };
  }

  getAllThresholds(): Record<string, any> {
    return Object.fromEntries(this.context.thresholds);
  }

  // State management helpers
  private async exitState(state: ThresholdStates): Promise<void> {
    const handler = this.stateHandlers.get(state);
    if (handler?.exit) {
      await handler.exit(this.context);
    }
  }

  private async enterState(state: ThresholdStates, data?: any): Promise<void> {
    const handler = this.stateHandlers.get(state);
    if (handler?.enter) {
      await handler.enter(this.context, data);
    }
  }

  private async handleTransitionError(error: Error, event: ThresholdEvents, data?: any): Promise<void> {
    this.context.lastError = error;
    this.currentState = ThresholdStates.ERROR;
    await this.enterState(ThresholdStates.ERROR, { error, event, data });
  }
}