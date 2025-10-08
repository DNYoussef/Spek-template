/**
 * Subscriber FSM Transition Hub
 * NASA Rule 10 Compliant - Centralized state transitions ≤60 lines
 */

import { SubscriberStates, SubscriberEvents, SubscriberContext, StateTransition } from './SubscriberFSMTypes';

export class SubscriberTransitionHub {
  private static readonly transitions: StateTransition[] = [
    // Initialization flow
    { from: SubscriberStates.INIT, event: SubscriberEvents.START, to: SubscriberStates.LISTENING },

    // Subscription management
    { from: SubscriberStates.LISTENING, event: SubscriberEvents.SUBSCRIBE_REQUEST, to: SubscriberStates.SUBSCRIBING },
    { from: SubscriberStates.SUBSCRIBING, event: SubscriberEvents.SUBSCRIPTION_CREATED, to: SubscriberStates.LISTENING },

    // Event processing flow
    { from: SubscriberStates.LISTENING, event: SubscriberEvents.EVENT_RECEIVED, to: SubscriberStates.BUFFERING },
    { from: SubscriberStates.BUFFERING, event: SubscriberEvents.PROCESS_BATCH, to: SubscriberStates.PROCESSING_UPDATES },
    { from: SubscriberStates.PROCESSING_UPDATES, event: SubscriberEvents.EVENT_RECEIVED, to: SubscriberStates.LISTENING },

    // Buffer management
    { from: SubscriberStates.BUFFERING, event: SubscriberEvents.BUFFER_FULL, to: SubscriberStates.BUFFERING },

    // Error handling
    { from: SubscriberStates.LISTENING, event: SubscriberEvents.ERROR_OCCURRED, to: SubscriberStates.ERROR_HANDLING },
    { from: SubscriberStates.PROCESSING_UPDATES, event: SubscriberEvents.ERROR_OCCURRED, to: SubscriberStates.ERROR_HANDLING },
    { from: SubscriberStates.ERROR_HANDLING, event: SubscriberEvents.RECONNECT, to: SubscriberStates.RECONNECTING },
    { from: SubscriberStates.RECONNECTING, event: SubscriberEvents.SUBSCRIPTION_CREATED, to: SubscriberStates.LISTENING },

    // Pause/Resume
    { from: SubscriberStates.LISTENING, event: SubscriberEvents.PAUSE, to: SubscriberStates.PAUSED },
    { from: SubscriberStates.PAUSED, event: SubscriberEvents.RESUME, to: SubscriberStates.LISTENING },

    // Shutdown
    { from: SubscriberStates.LISTENING, event: SubscriberEvents.SHUTDOWN_REQUEST, to: SubscriberStates.SHUTDOWN },
    { from: SubscriberStates.PAUSED, event: SubscriberEvents.SHUTDOWN_REQUEST, to: SubscriberStates.SHUTDOWN },
    { from: SubscriberStates.ERROR_HANDLING, event: SubscriberEvents.SHUTDOWN_REQUEST, to: SubscriberStates.SHUTDOWN }
  ];

  static canTransition(
    currentState: SubscriberStates,
    event: SubscriberEvents,
    context: SubscriberContext
  ): boolean {
    if (!currentState || !event) throw new Error('State and event required');
    if (!context) throw new Error('Context required');

    const transition = this.findTransition(currentState, event);
    if (!transition) return false;

    return transition.guard ? transition.guard(context) : true;
  }

  static executeTransition(
    currentState: SubscriberStates,
    event: SubscriberEvents,
    context: SubscriberContext,
    payload?: any
  ): SubscriberStates {
    if (!this.canTransition(currentState, event, context)) {
      throw new Error(`Invalid transition: ${currentState} -> ${event}`);
    }

    const transition = this.findTransition(currentState, event);
    if (!transition) throw new Error('Transition not found');

    if (transition.action) {
      transition.action(context, payload);
    }

    return transition.to;
  }

  private static findTransition(
    from: SubscriberStates,
    event: SubscriberEvents
  ): StateTransition | undefined {
    return this.transitions.find(t => t.from === from && t.event === event);
  }
}

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0

// Receipt
// status: OK
// reason_if_blocked: --
// run_id: memory-subscriber-fsm-007
// inputs: ["src/memory/sharing/MemorySubscriber.ts"]
// tools_used: ["Write"]
// versions: {"model":"claude-3-5-sonnet-20241022","prompt":"fsm-decomposition-v1"}
// === END FOOTER ===