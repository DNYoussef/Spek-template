/**
 * ServiceTransitionHub
 * Centralized state management for all service FSMs
 */

import { ServiceState, ServiceEvent, ServiceContext } from './ServiceFSMTypes';

export class ServiceTransitionHub {
  private static instance: ServiceTransitionHub;
  private transitions: Map<string, (event: ServiceEvent, context: ServiceContext) => ServiceState>;

  private constructor() {
    this.transitions = new Map();
    this.initializeTransitions();
  }

  static getInstance(): ServiceTransitionHub {
    if (!ServiceTransitionHub.instance) {
      ServiceTransitionHub.instance = new ServiceTransitionHub();
    }
    return ServiceTransitionHub.instance;
  }

  /**
   * Initialize FSM transitions according to NASA Rule 10
   */
  private initializeTransitions(): void {
    // IDLE state transitions
    this.addTransition('IDLE:REQUEST_RECEIVED', ServiceState.PROCESSING);
    this.addTransition('IDLE:RESET', ServiceState.IDLE);

    // PROCESSING state transitions
    this.addTransition('PROCESSING:PROCESSING_COMPLETE', ServiceState.RESPONDING);
    this.addTransition('PROCESSING:ERROR_OCCURRED', ServiceState.ERROR);
    this.addTransition('PROCESSING:RESET', ServiceState.IDLE);

    // RESPONDING state transitions
    this.addTransition('RESPONDING:RESPONSE_READY', ServiceState.CACHING);
    this.addTransition('RESPONDING:ERROR_OCCURRED', ServiceState.ERROR);
    this.addTransition('RESPONDING:RESET', ServiceState.IDLE);

    // CACHING state transitions
    this.addTransition('CACHING:CACHE_UPDATED', ServiceState.COMPLETE);
    this.addTransition('CACHING:ERROR_OCCURRED', ServiceState.ERROR);
    this.addTransition('CACHING:RESET', ServiceState.IDLE);

    // COMPLETE state transitions
    this.addTransition('COMPLETE:OPERATION_COMPLETE', ServiceState.IDLE);
    this.addTransition('COMPLETE:RESET', ServiceState.IDLE);

    // ERROR state transitions
    this.addTransition('ERROR:RESET', ServiceState.IDLE);
  }

  /**
   * Add transition mapping (≤60 lines NASA Rule 10)
   */
  private addTransition(key: string, targetState: ServiceState): void {
    this.transitions.set(key, () => targetState);
  }

  /**
   * Execute state transition with guards
   */
  transition(
    currentState: ServiceState,
    event: ServiceEvent,
    context: ServiceContext
  ): ServiceState {
    const transitionKey = `${currentState}:${event}`;
    const transitionFn = this.transitions.get(transitionKey);

    if (!transitionFn) {
      throw new Error(`Invalid transition: ${transitionKey}`);
    }

    const nextState = transitionFn(event, context);

    // Validate transition with guards
    if (!this.validateTransition(currentState, nextState, context)) {
      throw new Error(`Transition guard failed: ${transitionKey}`);
    }

    return nextState;
  }

  /**
   * Validate transition guards
   */
  private validateTransition(
    from: ServiceState,
    to: ServiceState,
    context: ServiceContext
  ): boolean {
    switch (to) {
      case ServiceState.PROCESSING:
        return context.request != null;

      case ServiceState.RESPONDING:
        return context.processing != null;

      case ServiceState.CACHING:
        return context.response != null;

      case ServiceState.COMPLETE:
        return context.response?.success === true;

      default:
        return true;
    }
  }

  /**
   * Get valid events for current state
   */
  getValidEvents(state: ServiceState): ServiceEvent[] {
    const validEvents: ServiceEvent[] = [];

    for (const [key] of this.transitions) {
      const [stateStr] = key.split(':');
      if (stateStr === state) {
        const [, eventStr] = key.split(':');
        validEvents.push(eventStr as ServiceEvent);
      }
    }

    return validEvents;
  }
}

<!-- AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE -->
## Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
|--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
| 1.0.0   | 2025-09-28T12:46:03-04:00 | AGENT104@sonnet-4 | Create ServiceTransitionHub | ServiceTransitionHub.ts | OK | Centralized state management <60 lines per function | 0.00 | e3f7a1b |

### Receipt
- status: OK
- reason_if_blocked: --
- run_id: agent104-transition-hub
- inputs: ["ServiceFSMTypes.ts"]
- tools_used: ["Write"]
- versions: {"model":"sonnet-4","prompt":"service-fsm-elimination"}
<!-- AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE -->