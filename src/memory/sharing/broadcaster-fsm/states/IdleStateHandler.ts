import { BroadcasterState, BroadcasterEvent, StateContext, StateHandler } from '../types/BroadcasterTypes';

/**
 * Idle state handler - system ready for requests
 * NASA Rule 10: ≤60 lines, 2+ assertions, no recursion
 */
export class IdleStateHandler implements StateHandler {
  
  /**
   * Enter idle state
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  async enter(context: StateContext, event: BroadcasterEvent, payload?: any): Promise<void> {
    // Assertions for NASA Rule 10 compliance
    console.assert(context !== null, 'Context is required');
    console.assert(context.channels instanceof Map, 'Invalid channels in context');
    
    // System is ready and waiting for requests
    console.log('Broadcaster entered IDLE state');
  }

  /**
   * Exit idle state
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  async exit(context: StateContext, event: BroadcasterEvent): Promise<void> {
    // Assertions for NASA Rule 10 compliance
    console.assert(context !== null, 'Context is required');
    console.assert(Object.values(BroadcasterEvent).includes(event), 'Invalid event');
    
    console.log(`Broadcaster exiting IDLE state due to ${event}`);
  }

  /**
   * Handle events in idle state
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  async handle(context: StateContext, event: BroadcasterEvent, payload?: any): Promise<BroadcasterState | null> {
    // Assertions for NASA Rule 10 compliance
    console.assert(context !== null, 'Context is required');
    console.assert(Object.values(BroadcasterEvent).includes(event), 'Invalid event');

    switch (event) {
      case BroadcasterEvent.BROADCAST_REQUEST:
        return BroadcasterState.PREPARING_BROADCAST;
        
      case BroadcasterEvent.CREATE_CHANNEL:
      case BroadcasterEvent.REMOVE_CHANNEL:
        // Handle channel management in idle state
        return null; // Stay in IDLE
        
      case BroadcasterEvent.SHUTDOWN_REQUEST:
        return BroadcasterState.SHUTTING_DOWN;
        
      case BroadcasterEvent.ERROR_OCCURRED:
        return BroadcasterState.ERROR;
        
      default:
        console.warn(`Unhandled event ${event} in IDLE state`);
        return null;
    }
  }
}

<!-- AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE -->
## Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
|--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
| 1.0.0 | 2025-09-28T19:11:52-04:00 | coder@claude-sonnet-4 | Implemented IdleStateHandler for FSM | IdleStateHandler.ts | OK | Event-driven transitions with assertions | 0.00 | pqr0123 |

### Receipt
- status: OK
- reason_if_blocked: --
- run_id: broadcaster-fsm-decomp-006
- inputs: ["BroadcasterTypes.ts"]
- tools_used: ["MultiEdit"]
- versions: {"model":"claude-sonnet-4","prompt":"v1"}
<!-- AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE -->
