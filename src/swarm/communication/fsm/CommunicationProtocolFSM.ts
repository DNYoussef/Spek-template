/**
 * Communication Protocol FSM
 * Manages state transitions for Princess communication protocol
 * NASA Rule 10 Compliant with bounded state transitions
 */

export enum CommunicationState {
  IDLE = 'idle',
  ESTABLISHING_CHANNEL = 'establishing_channel',
  MESSAGE_SENDING = 'message_sending',
  AWAITING_RESPONSE = 'awaiting_response',
  CONSENSUS_REQUIRED = 'consensus_required',
  BROADCASTING = 'broadcasting',
  ERROR_HANDLING = 'error_handling',
  CHANNEL_MAINTENANCE = 'channel_maintenance'
}

export enum CommunicationEvent {
  SEND_MESSAGE = 'send_message',
  CHANNEL_ESTABLISHED = 'channel_established',
  MESSAGE_SENT = 'message_sent',
  RESPONSE_RECEIVED = 'response_received',
  CONSENSUS_NEEDED = 'consensus_needed',
  CONSENSUS_ACHIEVED = 'consensus_achieved',
  BROADCAST_REQUESTED = 'broadcast_requested',
  BROADCAST_COMPLETE = 'broadcast_complete',
  ERROR_OCCURRED = 'error_occurred',
  ERROR_RESOLVED = 'error_resolved',
  MAINTENANCE_REQUIRED = 'maintenance_required',
  MAINTENANCE_COMPLETE = 'maintenance_complete',
  TIMEOUT = 'timeout',
  RETRY_REQUIRED = 'retry_required'
}

export interface CommunicationContext {
  messageId?: string;
  channelId?: string;
  fromPrincess?: string;
  toPrincess?: string | string[];
  retryCount: number;
  consensusThreshold?: number;
  broadcastTargets?: string[];
  lastError?: Error;
  maintenanceType?: string;
}

export class CommunicationProtocolFSM {
  private currentState: CommunicationState = CommunicationState.IDLE;
  private context: CommunicationContext = { retryCount: 0 };

  private readonly MAX_RETRIES = 3;
  private readonly MAX_CONSENSUS_ATTEMPTS = 5;
  private readonly MAX_BROADCAST_TARGETS = 10;

  constructor() {
    this.validateStateTransitions();
  }

  public getCurrentState(): CommunicationState {
    return this.currentState;
  }

  public getContext(): CommunicationContext {
    return { ...this.context };
  }

  public transition(event: CommunicationEvent, newContext?: Partial<CommunicationContext>): CommunicationState {
    const previousState = this.currentState;

    if (newContext) {
      this.context = { ...this.context, ...newContext };
    }

    const nextState = this.getNextState(this.currentState, event);

    if (nextState === null) {
      throw new Error(`Invalid transition: ${this.currentState} -> ${event}`);
    }

    this.currentState = nextState;
    this.onStateEntry(nextState, previousState, event);

    return this.currentState;
  }

  private getNextState(currentState: CommunicationState, event: CommunicationEvent): CommunicationState | null {
    switch (currentState) {
      case CommunicationState.IDLE:
        switch (event) {
          case CommunicationEvent.SEND_MESSAGE:
            return CommunicationState.ESTABLISHING_CHANNEL;
          case CommunicationEvent.BROADCAST_REQUESTED:
            return CommunicationState.BROADCASTING;
          case CommunicationEvent.MAINTENANCE_REQUIRED:
            return CommunicationState.CHANNEL_MAINTENANCE;
          default:
            return null;
        }

      case CommunicationState.ESTABLISHING_CHANNEL:
        switch (event) {
          case CommunicationEvent.CHANNEL_ESTABLISHED:
            return CommunicationState.MESSAGE_SENDING;
          case CommunicationEvent.ERROR_OCCURRED:
            return CommunicationState.ERROR_HANDLING;
          case CommunicationEvent.TIMEOUT:
            return CommunicationState.ERROR_HANDLING;
          default:
            return null;
        }

      case CommunicationState.MESSAGE_SENDING:
        switch (event) {
          case CommunicationEvent.MESSAGE_SENT:
            return CommunicationState.AWAITING_RESPONSE;
          case CommunicationEvent.CONSENSUS_NEEDED:
            return CommunicationState.CONSENSUS_REQUIRED;
          case CommunicationEvent.ERROR_OCCURRED:
            return CommunicationState.ERROR_HANDLING;
          default:
            return null;
        }

      case CommunicationState.AWAITING_RESPONSE:
        switch (event) {
          case CommunicationEvent.RESPONSE_RECEIVED:
            return CommunicationState.IDLE;
          case CommunicationEvent.TIMEOUT:
            return CommunicationState.ERROR_HANDLING;
          case CommunicationEvent.CONSENSUS_NEEDED:
            return CommunicationState.CONSENSUS_REQUIRED;
          default:
            return null;
        }

      case CommunicationState.CONSENSUS_REQUIRED:
        switch (event) {
          case CommunicationEvent.CONSENSUS_ACHIEVED:
            return CommunicationState.IDLE;
          case CommunicationEvent.ERROR_OCCURRED:
            return CommunicationState.ERROR_HANDLING;
          case CommunicationEvent.TIMEOUT:
            return CommunicationState.ERROR_HANDLING;
          default:
            return null;
        }

      case CommunicationState.BROADCASTING:
        switch (event) {
          case CommunicationEvent.BROADCAST_COMPLETE:
            return CommunicationState.IDLE;
          case CommunicationEvent.ERROR_OCCURRED:
            return CommunicationState.ERROR_HANDLING;
          default:
            return null;
        }

      case CommunicationState.ERROR_HANDLING:
        switch (event) {
          case CommunicationEvent.ERROR_RESOLVED:
            return CommunicationState.IDLE;
          case CommunicationEvent.RETRY_REQUIRED:
            if (this.context.retryCount < this.MAX_RETRIES) {
              return CommunicationState.ESTABLISHING_CHANNEL;
            }
            return CommunicationState.IDLE;
          default:
            return null;
        }

      case CommunicationState.CHANNEL_MAINTENANCE:
        switch (event) {
          case CommunicationEvent.MAINTENANCE_COMPLETE:
            return CommunicationState.IDLE;
          case CommunicationEvent.ERROR_OCCURRED:
            return CommunicationState.ERROR_HANDLING;
          default:
            return null;
        }

      default:
        return null;
    }
  }

  private onStateEntry(newState: CommunicationState, previousState: CommunicationState, event: CommunicationEvent): void {
    switch (newState) {
      case CommunicationState.ESTABLISHING_CHANNEL:
        this.context.retryCount = (this.context.retryCount || 0) + 1;
        break;

      case CommunicationState.ERROR_HANDLING:
        // Log error and prepare for recovery
        break;

      case CommunicationState.IDLE:
        // Reset context for new operations
        this.context = { retryCount: 0 };
        break;
    }
  }

  private validateStateTransitions(): void {
    // Ensure all states have valid exit paths (NASA Rule 10)
    const stateExitPaths = new Map<CommunicationState, number>();

    Object.values(CommunicationState).forEach(state => {
      let exitCount = 0;
      Object.values(CommunicationEvent).forEach(event => {
        if (this.getNextState(state, event) !== null) {
          exitCount++;
        }
      });
      stateExitPaths.set(state, exitCount);
    });

    // Verify no dead-end states
    stateExitPaths.forEach((exitCount, state) => {
      if (exitCount === 0 && state !== CommunicationState.IDLE) {
        throw new Error(`Dead-end state detected: ${state}`);
      }
    });
  }

  public isValidTransition(event: CommunicationEvent): boolean {
    return this.getNextState(this.currentState, event) !== null;
  }

  public getAvailableEvents(): CommunicationEvent[] {
    const availableEvents: CommunicationEvent[] = [];

    Object.values(CommunicationEvent).forEach(event => {
      if (this.isValidTransition(event)) {
        availableEvents.push(event);
      }
    });

    return availableEvents;
  }
}