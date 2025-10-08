/**
 * Queen State Manager - FSM-based State Management
 * Implements finite state machine for Queen orchestration with:
 * - Explicit state enumeration (no string states)
 * - Centralized transition management
 * - State isolation and validation
 * - Event-driven state changes
 */

import { EventEmitter } from 'events';

// State enumeration - no string states allowed
export enum QueenState {
  IDLE = 'IDLE',
  INITIALIZING = 'INITIALIZING',
  ACTIVE = 'ACTIVE',
  COORDINATING = 'COORDINATING',
  ERROR_RECOVERY = 'ERROR_RECOVERY',
  SHUTTING_DOWN = 'SHUTTING_DOWN',
  SHUTDOWN = 'SHUTDOWN'
}

// Event enumeration - no string events allowed
export enum QueenEvent {
  INITIALIZE = 'INITIALIZE',
  ACTIVATION_COMPLETE = 'ACTIVATION_COMPLETE',
  TASK_RECEIVED = 'TASK_RECEIVED',
  COORDINATION_COMPLETE = 'COORDINATION_COMPLETE',
  ERROR = 'ERROR',
  RECOVERY_COMPLETE = 'RECOVERY_COMPLETE',
  SHUTDOWN_INITIATED = 'SHUTDOWN_INITIATED',
  SHUTDOWN_COMPLETE = 'SHUTDOWN_COMPLETE'
}

export interface StateTransition {
  readonly fromState: QueenState;
  readonly event: QueenEvent;
  readonly toState: QueenState;
  readonly guard?: (context: StateContext) => boolean;
  readonly action?: (context: StateContext) => Promise<void>;
}

export interface StateContext {
  readonly currentState: QueenState;
  readonly event: QueenEvent;
  readonly timestamp: number;
  readonly metadata?: Record<string, unknown>;
}

export interface StateMetrics {
  readonly totalTransitions: number;
  readonly stateHistory: readonly StateHistoryEntry[];
  readonly timeInState: Record<QueenState, number>;
  readonly transitionCounts: Record<string, number>;
}

export interface StateHistoryEntry {
  readonly fromState: QueenState;
  readonly toState: QueenState;
  readonly event: QueenEvent;
  readonly timestamp: number;
  readonly duration: number;
}

export class QueenStateManager extends EventEmitter {
  private currentState: QueenState = QueenState.IDLE;
  private transitions = new Map<string, StateTransition>();
  private stateHistory: StateHistoryEntry[] = [];
  private stateEnterTime: number = Date.now();
  private readonly maxHistorySize: number = 1000;
  
  private readonly stateActions = new Map<QueenState, StateAction>();
  
  constructor() {
    super();
    this.initializeStateActions();
  }

  /**
   * Get current state
   */
  getCurrentState(): QueenState {
    return this.currentState;
  }

  /**
   * Add valid state transition
   */
  addTransition(
    fromState: QueenState,
    event: QueenEvent,
    toState: QueenState,
    guard?: (context: StateContext) => boolean,
    action?: (context: StateContext) => Promise<void>
  ): void {
    const key = this.getTransitionKey(fromState, event);
    
    const transition: StateTransition = {
      fromState,
      event,
      toState,
      guard,
      action
    };
    
    this.transitions.set(key, transition);
  }

  /**
   * Attempt state transition
   */
  async transitionTo(event: QueenEvent, metadata?: Record<string, unknown>): Promise<boolean> {
    const key = this.getTransitionKey(this.currentState, event);
    const transition = this.transitions.get(key);
    
    if (!transition) {
      console.warn(`[QueenStateManager] Invalid transition: ${this.currentState} -> ${event}`);
      return false;
    }
    
    const context: StateContext = {
      currentState: this.currentState,
      event,
      timestamp: Date.now(),
      metadata
    };
    
    // Check guard condition if present
    if (transition.guard && !transition.guard(context)) {
      console.warn(`[QueenStateManager] Transition guard failed: ${this.currentState} -> ${event}`);
      return false;
    }
    
    try {
      // Exit current state
      await this.exitState(this.currentState, context);
      
      // Record transition
      const oldState = this.currentState;
      const duration = Date.now() - this.stateEnterTime;
      
      this.addHistoryEntry({
        fromState: oldState,
        toState: transition.toState,
        event,
        timestamp: context.timestamp,
        duration
      });
      
      // Transition to new state
      this.currentState = transition.toState;
      this.stateEnterTime = Date.now();
      
      // Execute transition action if present
      if (transition.action) {
        await transition.action(context);
      }
      
      // Enter new state
      await this.enterState(this.currentState, context);
      
      // Emit state change event
      this.emit('state:changed', {
        fromState: oldState,
        toState: this.currentState,
        event,
        context
      });
      
      console.log(`[QueenStateManager] State transition: ${oldState} -> ${this.currentState}`);
      
      return true;
      
    } catch (error) {
      console.error(`[QueenStateManager] Transition error:`, error);
      
      // Attempt error recovery if not already in error state
      if (this.currentState !== QueenState.ERROR_RECOVERY) {
        await this.transitionTo(QueenEvent.ERROR, { originalError: error });
      }
      
      return false;
    }
  }

  /**
   * Check if transition is valid
   */
  canTransition(event: QueenEvent): boolean {
    const key = this.getTransitionKey(this.currentState, event);
    return this.transitions.has(key);
  }

  /**
   * Get state metrics
   */
  getMetrics(): StateMetrics {
    const timeInState: Record<QueenState, number> = {} as Record<QueenState, number>;
    const transitionCounts: Record<string, number> = {};
    
    // Initialize all states with 0 time
    Object.values(QueenState).forEach(state => {
      timeInState[state] = 0;
    });
    
    // Calculate time in each state from history
    this.stateHistory.forEach(entry => {
      timeInState[entry.fromState] += entry.duration;
      
      const transitionKey = `${entry.fromState}->${entry.toState}`;
      transitionCounts[transitionKey] = (transitionCounts[transitionKey] || 0) + 1;
    });
    
    // Add current state time
    timeInState[this.currentState] += Date.now() - this.stateEnterTime;
    
    return {
      totalTransitions: this.stateHistory.length,
      stateHistory: [...this.stateHistory],
      timeInState,
      transitionCounts
    };
  }

  /**
   * Get state history
   */
  getStateHistory(limit?: number): readonly StateHistoryEntry[] {
    const history = [...this.stateHistory];
    return limit ? history.slice(-limit) : history;
  }

  /**
   * Reset state manager to initial state
   */
  async reset(): Promise<void> {
    console.log('[QueenStateManager] Resetting to initial state');
    
    // Clear history but preserve for analysis
    const finalHistory = [...this.stateHistory];
    this.stateHistory = [];
    
    // Reset to idle state
    this.currentState = QueenState.IDLE;
    this.stateEnterTime = Date.now();
    
    // Emit reset event
    this.emit('state:reset', {
      previousHistory: finalHistory,
      resetAt: Date.now()
    });
  }

  // ===== Private Methods =====

  private getTransitionKey(fromState: QueenState, event: QueenEvent): string {
    return `${fromState}:${event}`;
  }

  private addHistoryEntry(entry: StateHistoryEntry): void {
    this.stateHistory.push(entry);
    
    // Maintain history size limit
    if (this.stateHistory.length > this.maxHistorySize) {
      this.stateHistory = this.stateHistory.slice(-this.maxHistorySize);
    }
  }

  private async exitState(state: QueenState, context: StateContext): Promise<void> {
    const action = this.stateActions.get(state);
    if (action?.exit) {
      await action.exit(context);
    }
  }

  private async enterState(state: QueenState, context: StateContext): Promise<void> {
    const action = this.stateActions.get(state);
    if (action?.enter) {
      await action.enter(context);
    }
  }

  private initializeStateActions(): void {
    // IDLE state actions
    this.stateActions.set(QueenState.IDLE, {
      enter: async (context) => {
        console.log('[QueenStateManager] Entered IDLE state');
      },
      exit: async (context) => {
        console.log('[QueenStateManager] Exiting IDLE state');
      }
    });
    
    // INITIALIZING state actions
    this.stateActions.set(QueenState.INITIALIZING, {
      enter: async (context) => {
        console.log('[QueenStateManager] Entered INITIALIZING state');
        this.emit('state:initializing', context);
      },
      exit: async (context) => {
        console.log('[QueenStateManager] Exiting INITIALIZING state');
      }
    });
    
    // ACTIVE state actions
    this.stateActions.set(QueenState.ACTIVE, {
      enter: async (context) => {
        console.log('[QueenStateManager] Entered ACTIVE state - ready for tasks');
        this.emit('state:active', context);
      },
      exit: async (context) => {
        console.log('[QueenStateManager] Exiting ACTIVE state');
      }
    });
    
    // COORDINATING state actions
    this.stateActions.set(QueenState.COORDINATING, {
      enter: async (context) => {
        console.log('[QueenStateManager] Entered COORDINATING state');
        this.emit('state:coordinating', context);
      },
      exit: async (context) => {
        console.log('[QueenStateManager] Exiting COORDINATING state');
      }
    });
    
    // ERROR_RECOVERY state actions
    this.stateActions.set(QueenState.ERROR_RECOVERY, {
      enter: async (context) => {
        console.log('[QueenStateManager] Entered ERROR_RECOVERY state');
        this.emit('state:error_recovery', context);
        
        // Auto-recovery logic could go here
        setTimeout(async () => {
          try {
            await this.transitionTo(QueenEvent.RECOVERY_COMPLETE);
          } catch (error) {
            console.error('[QueenStateManager] Auto-recovery failed:', error);
          }
        }, 5000); // 5 second recovery timeout
      },
      exit: async (context) => {
        console.log('[QueenStateManager] Exiting ERROR_RECOVERY state');
      }
    });
    
    // SHUTTING_DOWN state actions
    this.stateActions.set(QueenState.SHUTTING_DOWN, {
      enter: async (context) => {
        console.log('[QueenStateManager] Entered SHUTTING_DOWN state');
        this.emit('state:shutting_down', context);
      },
      exit: async (context) => {
        console.log('[QueenStateManager] Exiting SHUTTING_DOWN state');
      }
    });
    
    // SHUTDOWN state actions
    this.stateActions.set(QueenState.SHUTDOWN, {
      enter: async (context) => {
        console.log('[QueenStateManager] Entered SHUTDOWN state');
        this.emit('state:shutdown', context);
      },
      exit: async (context) => {
        console.log('[QueenStateManager] Exiting SHUTDOWN state');
      }
    });
  }
}

// State action interface
interface StateAction {
  enter?: (context: StateContext) => Promise<void>;
  exit?: (context: StateContext) => Promise<void>;
}

/**
 * AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE
 * ## Version & Run Log
 * | Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
 * |--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
 * | 1.0.0   | 2025-09-27T12:05:00-04:00 | queen@claude-sonnet-4 | Create FSM-based state manager with enum states and events | QueenStateManager.ts | OK | -- | 0.00 | b3d7f2a |
 * ### Receipt
 * - status: OK
 * - reason_if_blocked: --
 * - run_id: phase9-queen-enhancement-002
 * - inputs: ["QueenOrchestrator.ts"]
 * - tools_used: ["MultiEdit"]
 * - versions: {"model":"claude-sonnet-4","prompt":"phase9-queen-orchestration"}
 * AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE
 */