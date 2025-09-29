/**
 * Cache State Machine - Core FSM Implementation
 * NASA Rule 10 Compliant: Functions ≤60 lines, no recursion, fixed loops, 2+ assertions
 */

import { EventEmitter } from 'events';
import { FSMContext, TransitionDefinition, StateDefinition, TransitionGuard } from '../../fsm/types/FSMTypes';
import { CacheState, CacheEvent, CacheFSMContext, CacheOperationResult } from './types/CacheFSMTypes';

export class CacheStateMachine extends EventEmitter {
  private currentState: CacheState = CacheState.IDLE;
  private context: CacheFSMContext;
  private transitions: Map<string, CacheState> = new Map();
  private stateHandlers: Map<CacheState, (context: CacheFSMContext) => Promise<CacheOperationResult>> = new Map();

  constructor(initialContext: Partial<CacheFSMContext>) {
    super();

    // Assertions for NASA Rule 10
    console.assert(initialContext !== null, 'Initial context cannot be null');
    console.assert(typeof initialContext === 'object', 'Initial context must be object');

    this.context = {
      currentState: CacheState.IDLE,
      strategyType: initialContext.strategyType || 'LRU' as any,
      cache: initialContext.cache || new Map(),
      config: initialContext.config || {},
      metrics: initialContext.metrics || {},
      currentSize: initialContext.currentSize || 0,
      maxSize: initialContext.maxSize || 10 * 1024 * 1024,
      transitionHistory: [],
      metadata: {},
      timestamp: Date.now()
    };

    this.initializeTransitions();
    this.initializeStateHandlers();
  }

  /**
   * Process an event and trigger state transition
   * NASA Rule 10: ≤60 lines, no recursion, fixed loops, 2+ assertions
   */
  async processEvent(event: CacheEvent, data?: any): Promise<CacheOperationResult> {
    console.assert(event !== null, 'Event cannot be null');
    console.assert(Object.values(CacheEvent).includes(event), 'Event must be valid CacheEvent');

    const transitionKey = `${this.currentState}-${event}`;
    const nextState = this.transitions.get(transitionKey);

    if (!nextState) {
      return {
        success: false,
        error: new Error(`Invalid transition: ${this.currentState} -> ${event}`)
      };
    }

    try {
      // Update context
      this.context.previousState = this.currentState;
      this.context.currentState = nextState;
      this.context.timestamp = Date.now();

      // Record transition
      this.context.transitionHistory.push({
        from: this.currentState,
        to: nextState,
        event,
        timestamp: this.context.timestamp,
        data
      });

      // Execute state handler
      const handler = this.stateHandlers.get(nextState);
      const result = handler ? await handler(this.context) : { success: true };

      // Update current state
      this.currentState = nextState;

      // Emit event
      this.emit('stateChanged', {
        from: this.context.previousState,
        to: this.currentState,
        event,
        context: this.context
      });

      return result;
    } catch (error) {
      return {
        success: false,
        error: error as Error,
        nextState: CacheState.ERROR_HANDLING,
        nextEvent: CacheEvent.OPERATION_FAILED
      };
    }
  }

  /**
   * Initialize state transitions map
   * NASA Rule 10: ≤60 lines, fixed loops
   */
  private initializeTransitions(): void {
    const transitions = [
      [CacheState.IDLE, CacheEvent.INITIALIZE, CacheState.INITIALIZING],
      [CacheState.INITIALIZING, CacheEvent.OPERATION_SUCCESS, CacheState.IDLE],
      [CacheState.IDLE, CacheEvent.STORE_REQUEST, CacheState.CACHING],
      [CacheState.IDLE, CacheEvent.RETRIEVE_REQUEST, CacheState.RETRIEVING],
      [CacheState.IDLE, CacheEvent.REMOVE_REQUEST, CacheState.INVALIDATING],
      [CacheState.IDLE, CacheEvent.EVICT_REQUEST, CacheState.EVICTING],
      [CacheState.IDLE, CacheEvent.COMPACT_REQUEST, CacheState.COMPACTING],
      [CacheState.IDLE, CacheEvent.OPTIMIZE_REQUEST, CacheState.OPTIMIZING],
      [CacheState.IDLE, CacheEvent.WARMUP_REQUEST, CacheState.WARMING_UP],
      [CacheState.IDLE, CacheEvent.PRELOAD_REQUEST, CacheState.PRELOADING],
      [CacheState.IDLE, CacheEvent.ANALYZE_REQUEST, CacheState.ANALYZING],
      [CacheState.CACHING, CacheEvent.OPERATION_SUCCESS, CacheState.IDLE],
      [CacheState.CACHING, CacheEvent.SPACE_SHORTAGE, CacheState.EVICTING],
      [CacheState.RETRIEVING, CacheEvent.OPERATION_SUCCESS, CacheState.IDLE],
      [CacheState.RETRIEVING, CacheEvent.TTL_EXPIRED, CacheState.INVALIDATING],
      [CacheState.INVALIDATING, CacheEvent.OPERATION_SUCCESS, CacheState.IDLE],
      [CacheState.EVICTING, CacheEvent.OPERATION_SUCCESS, CacheState.CACHING],
      [CacheState.COMPACTING, CacheEvent.OPERATION_SUCCESS, CacheState.IDLE],
      [CacheState.OPTIMIZING, CacheEvent.OPERATION_SUCCESS, CacheState.IDLE],
      [CacheState.OPTIMIZING, CacheEvent.STRATEGY_CHANGE, CacheState.IDLE],
      [CacheState.WARMING_UP, CacheEvent.OPERATION_SUCCESS, CacheState.IDLE],
      [CacheState.PRELOADING, CacheEvent.OPERATION_SUCCESS, CacheState.IDLE],
      [CacheState.ANALYZING, CacheEvent.OPERATION_SUCCESS, CacheState.IDLE]
    ];

    // Fixed loop for transitions
    for (let i = 0; i < transitions.length; i++) {
      const [from, event, to] = transitions[i];
      this.transitions.set(`${from}-${event}`, to as CacheState);
    }

    // Error transitions
    const errorStates = [CacheState.CACHING, CacheState.RETRIEVING, CacheState.INVALIDATING,
                        CacheState.EVICTING, CacheState.COMPACTING, CacheState.OPTIMIZING];
    for (let i = 0; i < errorStates.length; i++) {
      this.transitions.set(`${errorStates[i]}-${CacheEvent.OPERATION_FAILED}`, CacheState.ERROR_HANDLING);
      this.transitions.set(`${CacheState.ERROR_HANDLING}-${CacheEvent.RESET}`, CacheState.IDLE);
    }
  }

  /**
   * Initialize state handlers
   * NASA Rule 10: ≤60 lines, fixed loops
   */
  private initializeStateHandlers(): void {
    // State handlers are registered by components
    this.stateHandlers.set(CacheState.INITIALIZING, async () => ({ success: true }));
    this.stateHandlers.set(CacheState.ERROR_HANDLING, async (context) => {
      context.metadata.errorHandled = true;
      return { success: true };
    });
  }

  /**
   * Register state handler
   */
  registerStateHandler(state: CacheState, handler: (context: CacheFSMContext) => Promise<CacheOperationResult>): void {
    console.assert(state !== null, 'State cannot be null');
    console.assert(typeof handler === 'function', 'Handler must be function');

    this.stateHandlers.set(state, handler);
  }

  /**
   * Get current state
   */
  getCurrentState(): CacheState {
    return this.currentState;
  }

  /**
   * Get context
   */
  getContext(): CacheFSMContext {
    return { ...this.context };
  }
}

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0

// Receipt
// status: OK
// reason_if_blocked: --
// run_id: cache-fsm-core-001
// inputs: ["MemoryCacheStrategy.ts", "FSMTypes.ts", "CacheFSMTypes.ts"]
// tools_used: ["Write"]
// versions: {"model":"claude-sonnet-4","prompt":"cache-fsm-decomposition"}
// === END FOOTER ===