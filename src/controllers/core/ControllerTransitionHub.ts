/**
 * Unified Controller Transition Hub
 * Centralized state management for all FSM-based controllers
 *
 * Eliminates controller god objects by providing shared transition logic
 */

import { EventEmitter } from 'events';
import {
  UnifiedControllerState,
  UnifiedControllerEvent,
  ControllerContext,
  StateTransition,
  StateHandler,
  ControllerError
} from './ControllerFSMTypes';

export class ControllerTransitionHub extends EventEmitter {
  private transitions: Map<string, StateTransition[]> = new Map();
  private stateHandlers: Map<UnifiedControllerState, StateHandler> = new Map();
  private activeContexts: Map<string, ControllerContext> = new Map();

  constructor() {
    super();
    this.initializeBaseTransitions();
  }

  /**
   * Initialize base state transitions common to all controllers
   */
  private initializeBaseTransitions(): void {
    const baseTransitions: StateTransition[] = [
      // IDLE transitions
      {
        from: UnifiedControllerState.IDLE,
        to: UnifiedControllerState.VALIDATING,
        event: UnifiedControllerEvent.START
      },

      // VALIDATING transitions
      {
        from: UnifiedControllerState.VALIDATING,
        to: UnifiedControllerState.PROCESSING,
        event: UnifiedControllerEvent.VALIDATE,
        guard: (context) => context.errors.length === 0
      },
      {
        from: UnifiedControllerState.VALIDATING,
        to: UnifiedControllerState.ERROR,
        event: UnifiedControllerEvent.ERROR,
        guard: (context) => context.errors.length > 0
      },

      // PROCESSING transitions
      {
        from: UnifiedControllerState.PROCESSING,
        to: UnifiedControllerState.RESPONDING,
        event: UnifiedControllerEvent.PROCESS
      },
      {
        from: UnifiedControllerState.PROCESSING,
        to: UnifiedControllerState.ERROR,
        event: UnifiedControllerEvent.ERROR
      },

      // RESPONDING transitions
      {
        from: UnifiedControllerState.RESPONDING,
        to: UnifiedControllerState.LOGGING,
        event: UnifiedControllerEvent.RESPOND
      },
      {
        from: UnifiedControllerState.RESPONDING,
        to: UnifiedControllerState.ERROR,
        event: UnifiedControllerEvent.ERROR
      },

      // LOGGING transitions
      {
        from: UnifiedControllerState.LOGGING,
        to: UnifiedControllerState.COMPLETE,
        event: UnifiedControllerEvent.LOG
      },

      // ERROR transitions
      {
        from: UnifiedControllerState.ERROR,
        to: UnifiedControllerState.RECOVERING,
        event: UnifiedControllerEvent.RECOVER
      },
      {
        from: UnifiedControllerState.ERROR,
        to: UnifiedControllerState.COMPLETE,
        event: UnifiedControllerEvent.COMPLETE
      },

      // RECOVERING transitions
      {
        from: UnifiedControllerState.RECOVERING,
        to: UnifiedControllerState.PROCESSING,
        event: UnifiedControllerEvent.PROCESS
      },
      {
        from: UnifiedControllerState.RECOVERING,
        to: UnifiedControllerState.ERROR,
        event: UnifiedControllerEvent.ERROR
      },

      // Reset from any state
      {
        from: UnifiedControllerState.COMPLETE,
        to: UnifiedControllerState.IDLE,
        event: UnifiedControllerEvent.RESET
      },
      {
        from: UnifiedControllerState.ERROR,
        to: UnifiedControllerState.IDLE,
        event: UnifiedControllerEvent.RESET
      }
    ];

    baseTransitions.forEach(transition => {
      this.addTransition(transition);
    });
  }

  /**
   * Add a state transition
   */
  addTransition(transition: StateTransition): void {
    const key = `${transition.from}`;
    if (!this.transitions.has(key)) {
      this.transitions.set(key, []);
    }
    this.transitions.get(key)!.push(transition);
  }

  /**
   * Register a state handler
   */
  registerStateHandler(handler: StateHandler): void {
    this.stateHandlers.set(handler.state, handler);
  }

  /**
   * Create a new controller context
   */
  createContext(requestId: string, initialData?: Partial<ControllerContext>): ControllerContext {
    const context: ControllerContext = {
      requestId,
      currentState: UnifiedControllerState.IDLE,
      errors: [],
      startTime: new Date(),
      metadata: {},
      ...initialData
    };

    this.activeContexts.set(requestId, context);
    this.emit('contextCreated', context);
    return context;
  }

  /**
   * Transition to a new state
   */
  async transition(requestId: string, event: UnifiedControllerEvent): Promise<boolean> {
    const context = this.activeContexts.get(requestId);
    if (!context) {
      throw new Error(`No context found for request ${requestId}`);
    }

    const transitions = this.transitions.get(context.currentState) || [];
    const validTransition = transitions.find(t =>
      t.event === event && (!t.guard || t.guard(context))
    );

    if (!validTransition) {
      const error: ControllerError = {
        code: 'INVALID_TRANSITION',
        message: `Invalid transition from ${context.currentState} with event ${event}`
      };
      context.errors.push(error);
      this.emit('transitionFailed', { context, event, error });
      return false;
    }

    // Execute exit handler for current state
    const currentHandler = this.stateHandlers.get(context.currentState);
    if (currentHandler?.onExit) {
      await currentHandler.onExit(context);
    }

    // Update state
    context.previousState = context.currentState;
    context.currentState = validTransition.to;

    // Execute action if defined
    if (validTransition.action) {
      try {
        await validTransition.action(context);
      } catch (error) {
        const controllerError: ControllerError = {
          code: 'TRANSITION_ACTION_FAILED',
          message: `Transition action failed: ${error.message}`,
          details: { error }
        };
        context.errors.push(controllerError);
        context.currentState = UnifiedControllerState.ERROR;
      }
    }

    // Execute entry handler for new state
    const newHandler = this.stateHandlers.get(context.currentState);
    if (newHandler?.onEntry) {
      try {
        await newHandler.onEntry(context);
      } catch (error) {
        const controllerError: ControllerError = {
          code: 'STATE_ENTRY_FAILED',
          message: `State entry failed: ${error.message}`,
          details: { error }
        };
        context.errors.push(controllerError);
        context.currentState = UnifiedControllerState.ERROR;
      }
    }

    this.emit('stateChanged', {
      requestId,
      from: context.previousState,
      to: context.currentState,
      event
    });

    return true;
  }

  /**
   * Handle an event in the current state
   */
  async handleEvent(requestId: string, event: UnifiedControllerEvent): Promise<void> {
    const context = this.activeContexts.get(requestId);
    if (!context) {
      throw new Error(`No context found for request ${requestId}`);
    }

    const handler = this.stateHandlers.get(context.currentState);
    if (handler) {
      try {
        const nextState = await handler.handleEvent(event, context);
        if (nextState !== context.currentState) {
          await this.transition(requestId, event);
        }
      } catch (error) {
        const controllerError: ControllerError = {
          code: 'EVENT_HANDLING_FAILED',
          message: `Event handling failed: ${error.message}`,
          details: { error }
        };
        context.errors.push(controllerError);
        await this.transition(requestId, UnifiedControllerEvent.ERROR);
      }
    }
  }

  /**
   * Get context for a request
   */
  getContext(requestId: string): ControllerContext | undefined {
    return this.activeContexts.get(requestId);
  }

  /**
   * Clean up completed context
   */
  cleanupContext(requestId: string): void {
    this.activeContexts.delete(requestId);
    this.emit('contextCleaned', requestId);
  }

  /**
   * Get all active contexts
   */
  getActiveContexts(): ControllerContext[] {
    return Array.from(this.activeContexts.values());
  }

  /**
   * Force transition to error state
   */
  async forceError(requestId: string, error: ControllerError): Promise<void> {
    const context = this.activeContexts.get(requestId);
    if (context) {
      context.errors.push(error);
      await this.transition(requestId, UnifiedControllerEvent.ERROR);
    }
  }
}