/**
 * FSM State Machine for Distributed Memory Synchronization
 * States: INIT, CONNECTING, SYNCING, RESOLVING_CONFLICTS, BROADCASTING, ERROR_RECOVERY, SYNCHRONIZED
 * NASA Rule 10 Compliant: ≤60 lines per function, no recursion, fixed loops
 */

import { EventEmitter } from 'events';
import { SyncState, SyncEvent, SyncContext, SyncTransition } from './SyncTypes';
import { TransitionHub } from './TransitionHub';

export class SyncStateMachine extends EventEmitter {
  private currentState: SyncState = SyncState.INIT;
  private context: SyncContext;
  private transitionHub: TransitionHub;
  private stateHandlers = new Map<SyncState, any>();

  constructor(context: SyncContext) {
    super();
    this.context = context;
    this.transitionHub = new TransitionHub();
    this.initializeStateHandlers();
  }

  getCurrentState(): SyncState {
    return this.currentState;
  }

  getContext(): SyncContext {
    return { ...this.context };
  }

  async processEvent(event: SyncEvent, data?: any): Promise<boolean> {
    const transition = this.transitionHub.getTransition(this.currentState, event);
    if (!transition) {
      return false;
    }

    const oldState = this.currentState;
    const canTransition = await this.checkTransitionGuards(transition, data);
    
    if (!canTransition) {
      return false;
    }

    await this.exitCurrentState();
    this.currentState = transition.toState;
    await this.enterNewState(data);
    
    this.emit('state_changed', {
      from: oldState,
      to: this.currentState,
      event,
      data
    });

    return true;
  }

  private async checkTransitionGuards(transition: SyncTransition, data?: any): Promise<boolean> {
    if (!transition.guard) {
      return true;
    }
    return transition.guard(this.context, data);
  }

  private async exitCurrentState(): Promise<void> {
    const handler = this.stateHandlers.get(this.currentState);
    if (handler?.exit) {
      await handler.exit(this.context);
    }
  }

  private async enterNewState(data?: any): Promise<void> {
    const handler = this.stateHandlers.get(this.currentState);
    if (handler?.enter) {
      await handler.enter(this.context, data);
    }
  }

  private initializeStateHandlers(): void {
    // State handlers will be registered by individual state classes
    this.emit('handlers_initialized');
  }

  registerStateHandler(state: SyncState, handler: any): void {
    this.stateHandlers.set(state, handler);
  }

  async shutdown(): Promise<void> {
    await this.exitCurrentState();
    this.stateHandlers.clear();
    this.emit('shutdown');
  }
}

// Backward compatibility
export default SyncStateMachine;
