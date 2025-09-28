/**
 * Migration FSM Transition Hub - NASA Rule 10 Compliant
 * Centralized state transition management
 */

import { Logger } from '../../../utils/Logger';
import {
  MigrationState,
  MigrationEvent,
  MigrationContext,
  MigrationEventData,
  StateTransition,
  GuardContext,
  MigrationFSMConfig,
  StateHandler
} from '../types/MigrationFSMTypes';

export class TransitionHub {
  private logger: Logger;
  private transitions: Map<string, StateTransition>;
  private currentState: MigrationState;
  private stateHandlers: Map<MigrationState, StateHandler>;
  private context: MigrationContext;

  constructor(config: MigrationFSMConfig) {
    this.logger = new Logger('MigrationTransitionHub');
    this.transitions = new Map();
    this.currentState = config.initialState;
    this.stateHandlers = config.states;
    this.context = config.context;

    this.initializeTransitions(config.transitions);
  }

  /**
   * Process a migration event and potentially transition state
   * NASA Rule 10: Keep function under 60 lines
   */
  async processEvent(event: MigrationEventData): Promise<boolean> {
    const transitionKey = this.createTransitionKey(this.currentState, event.type);
    const transition = this.transitions.get(transitionKey);

    if (!transition) {
      this.logger.warn('No transition found', {
        currentState: this.currentState,
        event: event.type,
        transitionKey
      });
      return false;
    }

    // Validate transition guard
    if (transition.guard && !this.validateGuard(transition, event)) {
      this.logger.warn('Transition guard failed', {
        currentState: this.currentState,
        event: event.type
      });
      return false;
    }

    return await this.executeTransition(transition, event);
  }

  /**
   * Execute state transition with proper lifecycle management
   * NASA Rule 10: Keep function under 60 lines
   */
  private async executeTransition(transition: StateTransition, event: MigrationEventData): Promise<boolean> {
    const previousState = this.currentState;

    try {
      // Exit current state
      await this.exitCurrentState();

      // Execute transition action
      if (transition.action) {
        await transition.action(this.context, event);
      }

      // Change state
      this.currentState = transition.toState;

      // Enter new state
      await this.enterNewState();

      this.logger.info('State transition completed', {
        from: previousState,
        to: this.currentState,
        event: event.type,
        executionId: this.context.executionId
      });

      return true;

    } catch (error) {
      this.logger.error('State transition failed', {
        from: previousState,
        to: transition.toState,
        event: event.type,
        error: error.message
      });

      // Rollback to previous state
      this.currentState = previousState;
      return false;
    }
  }

  /**
   * Validate transition guard conditions
   * NASA Rule 10: Keep function under 60 lines
   */
  private validateGuard(transition: StateTransition, event: MigrationEventData): boolean {
    if (!transition.guard) {
      return true;
    }

    try {
      const guardContext: GuardContext = {
        context: this.context,
        event
      };

      return transition.guard(guardContext);

    } catch (error) {
      this.logger.error('Guard validation failed', {
        error: error.message,
        transition: `${transition.fromState} -> ${transition.toState}`
      });
      return false;
    }
  }

  /**
   * Exit current state with lifecycle management
   * NASA Rule 10: Keep function under 60 lines
   */
  private async exitCurrentState(): Promise<void> {
    const stateHandler = this.stateHandlers.get(this.currentState);

    if (stateHandler?.canExit && !stateHandler.canExit(this.context)) {
      throw new Error(`Cannot exit state ${this.currentState}: preconditions not met`);
    }

    if (stateHandler?.onExit) {
      await stateHandler.onExit(this.context);
    }

    this.logger.debug('Exited state', { state: this.currentState });
  }

  /**
   * Enter new state with lifecycle management
   * NASA Rule 10: Keep function under 60 lines
   */
  private async enterNewState(): Promise<void> {
    const stateHandler = this.stateHandlers.get(this.currentState);

    if (stateHandler?.onEnter) {
      await stateHandler.onEnter(this.context);
    }

    this.logger.debug('Entered state', { state: this.currentState });
  }

  /**
   * Initialize transition mapping for O(1) lookup
   * NASA Rule 10: Keep function under 60 lines
   */
  private initializeTransitions(transitions: StateTransition[]): void {
    for (const transition of transitions) {
      const key = this.createTransitionKey(transition.fromState, transition.event);

      if (this.transitions.has(key)) {
        this.logger.warn('Duplicate transition found', {
          key,
          existing: this.transitions.get(key),
          new: transition
        });
      }

      this.transitions.set(key, transition);
    }

    this.logger.info('Initialized transitions', {
      totalTransitions: transitions.length,
      uniqueKeys: this.transitions.size
    });
  }

  /**
   * Create consistent transition key for mapping
   * NASA Rule 10: Keep function under 60 lines
   */
  private createTransitionKey(state: MigrationState, event: MigrationEvent): string {
    return `${state}:${event}`;
  }

  /**
   * Get current FSM state
   * NASA Rule 10: Simple getter
   */
  getCurrentState(): MigrationState {
    return this.currentState;
  }

  /**
   * Get migration context
   * NASA Rule 10: Simple getter
   */
  getContext(): MigrationContext {
    return this.context;
  }

  /**
   * Update context safely
   * NASA Rule 10: Keep function under 60 lines
   */
  updateContext(updates: Partial<MigrationContext>): void {
    Object.assign(this.context, updates);

    this.logger.debug('Context updated', {
      executionId: this.context.executionId,
      updatedFields: Object.keys(updates)
    });
  }

  /**
   * Check if transition is valid from current state
   * NASA Rule 10: Keep function under 60 lines
   */
  canTransition(event: MigrationEvent): boolean {
    const key = this.createTransitionKey(this.currentState, event);
    const transition = this.transitions.get(key);

    if (!transition) {
      return false;
    }

    if (transition.guard) {
      return this.validateGuard(transition, {
        type: event,
        timestamp: new Date(),
        source: 'validation'
      });
    }

    return true;
  }

  /**
   * Get available transitions from current state
   * NASA Rule 10: Keep function under 60 lines
   */
  getAvailableTransitions(): MigrationEvent[] {
    const availableEvents: MigrationEvent[] = [];

    for (const [key, transition] of this.transitions) {
      if (transition.fromState === this.currentState) {
        const event = key.split(':')[1] as MigrationEvent;

        if (this.canTransition(event)) {
          availableEvents.push(event);
        }
      }
    }

    return availableEvents;
  }

  /**
   * Get transition history for debugging
   * NASA Rule 10: Keep function under 60 lines
   */
  getTransitionMap(): Map<string, StateTransition> {
    return new Map(this.transitions);
  }
}