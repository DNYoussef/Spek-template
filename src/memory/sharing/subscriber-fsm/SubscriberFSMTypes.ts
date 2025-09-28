/**
 * FSM Types for Memory Subscriber
 * NASA Rule 10 Compliant - Type definitions for state management
 */

export enum SubscriberStates {
  INIT = 'INIT',
  SUBSCRIBING = 'SUBSCRIBING',
  LISTENING = 'LISTENING',
  PROCESSING_UPDATES = 'PROCESSING_UPDATES',
  BUFFERING = 'BUFFERING',
  ERROR_HANDLING = 'ERROR_HANDLING',
  RECONNECTING = 'RECONNECTING',
  PAUSED = 'PAUSED',
  SHUTDOWN = 'SHUTDOWN'
}

export enum SubscriberEvents {
  START = 'START',
  SUBSCRIBE_REQUEST = 'SUBSCRIBE_REQUEST',
  SUBSCRIPTION_CREATED = 'SUBSCRIPTION_CREATED',
  EVENT_RECEIVED = 'EVENT_RECEIVED',
  PROCESS_BATCH = 'PROCESS_BATCH',
  BUFFER_FULL = 'BUFFER_FULL',
  ERROR_OCCURRED = 'ERROR_OCCURRED',
  RECONNECT = 'RECONNECT',
  PAUSE = 'PAUSE',
  RESUME = 'RESUME',
  SHUTDOWN_REQUEST = 'SHUTDOWN_REQUEST'
}

export interface SubscriberContext {
  subscriptions: Map<string, any>;
  eventBuffer: any[];
  metrics: any;
  config: any;
  isProcessing: boolean;
  timers: {
    processing?: NodeJS.Timeout;
    batch?: NodeJS.Timeout;
  };
}

export interface StateTransition {
  from: SubscriberStates;
  event: SubscriberEvents;
  to: SubscriberStates;
  guard?: (context: SubscriberContext) => boolean;
  action?: (context: SubscriberContext, payload?: any) => void;
}

export interface SubscriberStateMachine {
  currentState: SubscriberStates;
  context: SubscriberContext;
  transitions: StateTransition[];
}

<!-- AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE -->
## Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
|--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
| 1.0.0   | 2025-09-28T11:45:23-04:00 | agent@claude-3-5-sonnet-20241022 | Create FSM types for MemorySubscriber | SubscriberFSMTypes.ts | OK | -- | 0.00 | a7b9c2f |

### Receipt
- status: OK
- reason_if_blocked: --
- run_id: memory-subscriber-fsm-001
- inputs: ["src/memory/sharing/MemorySubscriber.ts"]
- tools_used: ["Write"]
- versions: {"model":"claude-3-5-sonnet-20241022","prompt":"fsm-decomposition-v1"}
<!-- AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE -->