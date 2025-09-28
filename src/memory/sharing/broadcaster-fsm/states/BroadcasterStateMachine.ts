import { 
  BroadcasterState, 
  BroadcasterEvent, 
  StateContext, 
  BroadcasterStateMachine,
  StateHandler 
} from '../types/BroadcasterTypes';
import { IdleStateHandler } from './IdleStateHandler';
import { PreparingBroadcastStateHandler } from './PreparingBroadcastStateHandler';
import { BroadcastingStateHandler } from './BroadcastingStateHandler';
import { ConfirmingDeliveryStateHandler } from './ConfirmingDeliveryStateHandler';
import { HandlingFailuresStateHandler } from './HandlingFailuresStateHandler';
import { InitializingStateHandler } from './InitializingStateHandler';
import { ShuttingDownStateHandler } from './ShuttingDownStateHandler';
import { ErrorStateHandler } from './ErrorStateHandler';

/**
 * Centralized FSM TransitionHub for MemoryBroadcaster
 * NASA Rule 10: ≤60 lines, 2+ assertions, no recursion
 */
export class BroadcasterStateMachineImpl implements BroadcasterStateMachine {
  private static readonly VALID_STATES = Object.values(BroadcasterState);
  private static readonly VALID_EVENTS = Object.values(BroadcasterEvent);
  
  private readonly stateHandlers: Map<BroadcasterState, StateHandler>;
  private _currentState: BroadcasterState;
  private _context: StateContext;

  constructor(initialContext: StateContext) {
    // Assertions for NASA Rule 10 compliance
    console.assert(initialContext !== null, 'Initial context is required');
    console.assert(initialContext.channels instanceof Map, 'Invalid channels in context');
    
    this._context = initialContext;
    this._currentState = BroadcasterState.INITIALIZING;
    this.stateHandlers = this.initializeStateHandlers();
  }

  /**
   * Get current state
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  getState(): BroadcasterState {
    // Assertions for NASA Rule 10 compliance
    console.assert(this._currentState !== null, 'Current state is null');
    console.assert(BroadcasterStateMachineImpl.VALID_STATES.includes(this._currentState), 
      'Invalid current state');
    
    return this._currentState;
  }

  /**
   * Get state context
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  getContext(): StateContext {
    // Assertions for NASA Rule 10 compliance
    console.assert(this._context !== null, 'Context is null');
    console.assert(this._context.channels instanceof Map, 'Invalid context channels');
    
    return this._context;
  }

  /**
   * Transition to new state based on event
   * NASA Rule 10: ≤60 lines, 2+ assertions, no recursion
   */
  async transition(event: BroadcasterEvent, payload?: any): Promise<void> {
    // Assertions for NASA Rule 10 compliance
    console.assert(BroadcasterStateMachineImpl.VALID_EVENTS.includes(event), 
      'Invalid event type');
    console.assert(this.stateHandlers.has(this._currentState), 
      'No handler for current state');

    const currentHandler = this.stateHandlers.get(this._currentState)!;
    
    try {
      // Handle the event and get next state
      const nextState = await currentHandler.handle(this._context, event, payload);
      
      if (nextState && nextState !== this._currentState) {
        await this.changeState(nextState, event);
      }
      
    } catch (error) {
      console.error(`Transition error in state ${this._currentState}:`, error);
      await this.changeState(BroadcasterState.ERROR, BroadcasterEvent.ERROR_OCCURRED);
    }
  }

  /**
   * Change to new state with proper lifecycle
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  private async changeState(newState: BroadcasterState, event: BroadcasterEvent): Promise<void> {
    // Assertions for NASA Rule 10 compliance
    console.assert(BroadcasterStateMachineImpl.VALID_STATES.includes(newState), 
      'Invalid new state');
    console.assert(this.stateHandlers.has(newState), 'No handler for new state');

    const oldHandler = this.stateHandlers.get(this._currentState)!;
    const newHandler = this.stateHandlers.get(newState)!;
    
    // Exit current state
    await oldHandler.exit(this._context, event);
    
    // Update state
    this._currentState = newState;
    
    // Enter new state
    await newHandler.enter(this._context, event);
  }

  /**
   * Initialize state handlers map
   * NASA Rule 10: ≤60 lines, 2+ assertions, fixed loop
   */
  private initializeStateHandlers(): Map<BroadcasterState, StateHandler> {
    // Assertions for NASA Rule 10 compliance
    console.assert(this._context !== null, 'Context required for handlers');
    console.assert(BroadcasterStateMachineImpl.VALID_STATES.length > 0, 
      'No valid states defined');

    const handlers = new Map<BroadcasterState, StateHandler>();
    
    // Fixed mapping for NASA Rule 10 compliance
    const handlerMappings = [
      [BroadcasterState.INITIALIZING, new InitializingStateHandler()],
      [BroadcasterState.IDLE, new IdleStateHandler()],
      [BroadcasterState.PREPARING_BROADCAST, new PreparingBroadcastStateHandler()],
      [BroadcasterState.BROADCASTING, new BroadcastingStateHandler()],
      [BroadcasterState.CONFIRMING_DELIVERY, new ConfirmingDeliveryStateHandler()],
      [BroadcasterState.HANDLING_FAILURES, new HandlingFailuresStateHandler()],
      [BroadcasterState.SHUTTING_DOWN, new ShuttingDownStateHandler()],
      [BroadcasterState.ERROR, new ErrorStateHandler()]
    ] as const;

    // Fixed loop for handler registration
    for (let i = 0; i < handlerMappings.length; i++) {
      const [state, handler] = handlerMappings[i];
      handlers.set(state, handler);
    }
    
    return handlers;
  }
}

<!-- AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE -->
## Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
|--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
| 1.0.0 | 2025-09-28T19:11:52-04:00 | coder@claude-sonnet-4 | Implemented FSM TransitionHub with centralized state management | BroadcasterStateMachine.ts | OK | No recursion, fixed loops, 2+ assertions | 0.00 | mno6789 |

### Receipt
- status: OK
- reason_if_blocked: --
- run_id: broadcaster-fsm-decomp-005
- inputs: ["BroadcasterTypes.ts"]
- tools_used: ["MultiEdit"]
- versions: {"model":"claude-sonnet-4","prompt":"v1"}
<!-- AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE -->
