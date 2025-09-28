/**
 * MessageRouterStateMachine - FSM Core for Message Routing
 * Manages routing states with explicit transitions and guards
 */

import { EventEmitter } from 'events';
import {
  MessageRouterState,
  MessageRouterEvent,
  MessageRouterContext,
  Message,
  MessageResponse
} from '../types/MessageRouterTypes';

export class MessageRouterStateMachine extends EventEmitter {
  private currentState: MessageRouterState = MessageRouterState.IDLE;
  private context: MessageRouterContext | null = null;
  private stateHistory: Array<{ state: MessageRouterState; timestamp: Date }> = [];

  constructor() {
    super();
    this.recordStateChange(MessageRouterState.IDLE);
  }

  getCurrentState(): MessageRouterState {
    return this.currentState;
  }

  getContext(): MessageRouterContext | null {
    return this.context;
  }

  getStateHistory(): Array<{ state: MessageRouterState; timestamp: Date }> {
    return [...this.stateHistory];
  }

  async handleEvent(event: MessageRouterEvent, context?: Partial<MessageRouterContext>): Promise<void> {
    if (context) {
      this.updateContext(context);
    }

    const nextState = this.determineNextState(this.currentState, event);
    if (nextState !== this.currentState) {
      await this.transitionTo(nextState);
    }

    this.emit('eventHandled', event, this.currentState);
  }

  private determineNextState(currentState: MessageRouterState, event: MessageRouterEvent): MessageRouterState {
    const transitions = this.getValidTransitions();
    const transitionKey = `${currentState}-${event}`;
    return transitions.get(transitionKey) || currentState;
  }

  private getValidTransitions(): Map<string, MessageRouterState> {
    const transitions = new Map<string, MessageRouterState>();

    // From IDLE
    transitions.set(`${MessageRouterState.IDLE}-${MessageRouterEvent.MESSAGE_RECEIVED}`, MessageRouterState.EVALUATING);
    transitions.set(`${MessageRouterState.IDLE}-${MessageRouterEvent.MAINTENANCE_REQUESTED}`, MessageRouterState.MAINTENANCE);

    // From EVALUATING
    transitions.set(`${MessageRouterState.EVALUATING}-${MessageRouterEvent.EVALUATION_COMPLETE}`, MessageRouterState.ROUTING);
    transitions.set(`${MessageRouterState.EVALUATING}-${MessageRouterEvent.ERROR_OCCURRED}`, MessageRouterState.ERROR);

    // From ROUTING
    transitions.set(`${MessageRouterState.ROUTING}-${MessageRouterEvent.ROUTING_COMPLETE}`, MessageRouterState.QUEUING);
    transitions.set(`${MessageRouterState.ROUTING}-${MessageRouterEvent.ERROR_OCCURRED}`, MessageRouterState.ERROR);

    // From QUEUING
    transitions.set(`${MessageRouterState.QUEUING}-${MessageRouterEvent.QUEUING_COMPLETE}`, MessageRouterState.PROCESSING);
    transitions.set(`${MessageRouterState.QUEUING}-${MessageRouterEvent.ERROR_OCCURRED}`, MessageRouterState.ERROR);

    // From PROCESSING
    transitions.set(`${MessageRouterState.PROCESSING}-${MessageRouterEvent.PROCESSING_COMPLETE}`, MessageRouterState.WAITING_ACK);
    transitions.set(`${MessageRouterState.PROCESSING}-${MessageRouterEvent.ERROR_OCCURRED}`, MessageRouterState.ERROR);

    // From WAITING_ACK
    transitions.set(`${MessageRouterState.WAITING_ACK}-${MessageRouterEvent.ACK_RECEIVED}`, MessageRouterState.IDLE);
    transitions.set(`${MessageRouterState.WAITING_ACK}-${MessageRouterEvent.ERROR_OCCURRED}`, MessageRouterState.ERROR);

    // From ERROR
    transitions.set(`${MessageRouterState.ERROR}-${MessageRouterEvent.RETRY_REQUESTED}`, MessageRouterState.EVALUATING);
    transitions.set(`${MessageRouterState.ERROR}-${MessageRouterEvent.RESET_REQUESTED}`, MessageRouterState.IDLE);

    // From MAINTENANCE
    transitions.set(`${MessageRouterState.MAINTENANCE}-${MessageRouterEvent.RESET_REQUESTED}`, MessageRouterState.IDLE);

    return transitions;
  }

  private async transitionTo(newState: MessageRouterState): Promise<void> {
    const oldState = this.currentState;
    
    await this.exitState(oldState);
    this.currentState = newState;
    this.recordStateChange(newState);
    await this.enterState(newState);

    this.emit('stateChanged', oldState, newState);
  }

  private async exitState(state: MessageRouterState): Promise<void> {
    // State-specific cleanup logic
    switch (state) {
      case MessageRouterState.PROCESSING:
        this.emit('processingExited');
        break;
      case MessageRouterState.ERROR:
        this.emit('errorExited');
        break;
    }
  }

  private async enterState(state: MessageRouterState): Promise<void> {
    // State-specific initialization logic
    switch (state) {
      case MessageRouterState.IDLE:
        this.context = null;
        this.emit('idleEntered');
        break;
      case MessageRouterState.EVALUATING:
        this.emit('evaluatingEntered');
        break;
      case MessageRouterState.ERROR:
        this.emit('errorEntered', this.context?.error);
        break;
    }
  }

  private updateContext(update: Partial<MessageRouterContext>): void {
    if (!this.context && update.message) {
      this.context = {
        message: update.message,
        startTime: update.startTime || Date.now()
      };
    } else if (this.context) {
      Object.assign(this.context, update);
    }
  }

  private recordStateChange(state: MessageRouterState): void {
    this.stateHistory.push({ state, timestamp: new Date() });
    
    // Keep only last 100 state changes
    if (this.stateHistory.length > 100) {
      this.stateHistory.shift();
    }
  }

  reset(): void {
    this.currentState = MessageRouterState.IDLE;
    this.context = null;
    this.stateHistory = [{ state: MessageRouterState.IDLE, timestamp: new Date() }];
    this.emit('reset');
  }

  getStateInvariants(): Record<string, boolean> {
    return {
      hasValidState: Object.values(MessageRouterState).includes(this.currentState),
      contextMatchesState: this.validateContextForState(),
      historyNotEmpty: this.stateHistory.length > 0
    };
  }

  private validateContextForState(): boolean {
    switch (this.currentState) {
      case MessageRouterState.IDLE:
        return this.context === null;
      case MessageRouterState.EVALUATING:
      case MessageRouterState.ROUTING:
      case MessageRouterState.QUEUING:
      case MessageRouterState.PROCESSING:
      case MessageRouterState.WAITING_ACK:
        return this.context !== null && this.context.message !== undefined;
      default:
        return true;
    }
  }
}

