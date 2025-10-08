/**
 * Pool Transition Hub
 * Centralized state transition management for pool FSM
 * NASA Rule 10 Compliant - All functions ≤60 lines, 2+ assertions
 */

import { PoolState, PoolEvent, PoolContext, PoolTransition } from './PoolStates';

export class PoolTransitionHub {
  private transitions: Map<string, PoolTransition>;
  private currentState: PoolState;
  private context: PoolContext;

  constructor(initialContext: PoolContext) {
    console.assert(initialContext.poolId.length > 0, 'Pool ID required');
    console.assert(initialContext.totalCapacity > 0, 'Total capacity must be positive');

    this.transitions = new Map();
    this.currentState = PoolState.EMPTY;
    this.context = { ...initialContext };
    this.initializeTransitions();
  }

  /**
   * Initialize transition matrix
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  private initializeTransitions(): void {
    console.assert(this.transitions.size === 0, 'Transitions should be empty on init');

    const transitionDefs: PoolTransition[] = [
      // Empty state transitions
      { fromState: PoolState.EMPTY, event: PoolEvent.INITIALIZE, toState: PoolState.AVAILABLE },

      // Available state transitions
      { fromState: PoolState.AVAILABLE, event: PoolEvent.ALLOCATION_REQUEST, toState: PoolState.ALLOCATING },
      { fromState: PoolState.AVAILABLE, event: PoolEvent.CAPACITY_WARNING, toState: PoolState.DEGRADED },
      { fromState: PoolState.AVAILABLE, event: PoolEvent.MAINTENANCE_REQUIRED, toState: PoolState.MAINTENANCE },
      { fromState: PoolState.AVAILABLE, event: PoolEvent.ERROR_DETECTED, toState: PoolState.ERROR },

      // Allocating state transitions
      { fromState: PoolState.ALLOCATING, event: PoolEvent.ALLOCATION_COMPLETE, toState: PoolState.BUSY },
      { fromState: PoolState.ALLOCATING, event: PoolEvent.ERROR_DETECTED, toState: PoolState.ERROR },

      // Busy state transitions
      { fromState: PoolState.BUSY, event: PoolEvent.DEALLOCATION_REQUEST, toState: PoolState.DEALLOCATING },
      { fromState: PoolState.BUSY, event: PoolEvent.ALLOCATION_REQUEST, toState: PoolState.ALLOCATING,
        guard: (ctx) => ctx.availableCapacity > 0 },
      { fromState: PoolState.BUSY, event: PoolEvent.CAPACITY_WARNING, toState: PoolState.DEGRADED },
      { fromState: PoolState.BUSY, event: PoolEvent.ERROR_DETECTED, toState: PoolState.ERROR },

      // Deallocating state transitions
      { fromState: PoolState.DEALLOCATING, event: PoolEvent.DEALLOCATION_COMPLETE, toState: PoolState.AVAILABLE,
        guard: (ctx) => ctx.allocatedResources.size === 0 },
      { fromState: PoolState.DEALLOCATING, event: PoolEvent.DEALLOCATION_COMPLETE, toState: PoolState.BUSY,
        guard: (ctx) => ctx.allocatedResources.size > 0 },
      { fromState: PoolState.DEALLOCATING, event: PoolEvent.ERROR_DETECTED, toState: PoolState.ERROR },

      // Degraded state transitions
      { fromState: PoolState.DEGRADED, event: PoolEvent.CAPACITY_RESTORED, toState: PoolState.AVAILABLE },
      { fromState: PoolState.DEGRADED, event: PoolEvent.CAPACITY_CRITICAL, toState: PoolState.ERROR },
      { fromState: PoolState.DEGRADED, event: PoolEvent.MAINTENANCE_REQUIRED, toState: PoolState.MAINTENANCE },

      // Maintenance state transitions
      { fromState: PoolState.MAINTENANCE, event: PoolEvent.MAINTENANCE_COMPLETE, toState: PoolState.AVAILABLE },
      { fromState: PoolState.MAINTENANCE, event: PoolEvent.ERROR_DETECTED, toState: PoolState.ERROR },

      // Error state transitions
      { fromState: PoolState.ERROR, event: PoolEvent.ERROR_RESOLVED, toState: PoolState.AVAILABLE },
      { fromState: PoolState.ERROR, event: PoolEvent.RESET, toState: PoolState.EMPTY },

      // Universal reset
      { fromState: PoolState.AVAILABLE, event: PoolEvent.RESET, toState: PoolState.EMPTY },
      { fromState: PoolState.BUSY, event: PoolEvent.RESET, toState: PoolState.EMPTY },
      { fromState: PoolState.DEGRADED, event: PoolEvent.RESET, toState: PoolState.EMPTY },
      { fromState: PoolState.MAINTENANCE, event: PoolEvent.RESET, toState: PoolState.EMPTY }
    ];

    // Build transition map
    for (const transition of transitionDefs) {
      const key = `${transition.fromState}-${transition.event}`;
      this.transitions.set(key, transition);
    }

    console.assert(this.transitions.size > 0, 'Transitions must be populated');
  }

  /**
   * Execute state transition
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  public transition(event: PoolEvent): boolean {
    console.assert(event in PoolEvent, 'Event must be valid');
    console.assert(this.currentState in PoolState, 'Current state must be valid');

    const key = `${this.currentState}-${event}`;
    const transition = this.transitions.get(key);

    if (!transition) {
      console.warn(`No transition for ${this.currentState} + ${event}`);
      return false;
    }

    // Check guard condition
    if (transition.guard && !transition.guard(this.context)) {
      console.warn(`Guard failed for transition ${key}`);
      return false;
    }

    // Execute transition
    const oldState = this.currentState;
    this.currentState = transition.toState;

    if (transition.action) {
      transition.action(this.context);
    }

    console.log(`Pool ${this.context.poolId}: ${oldState} -> ${this.currentState} via ${event}`);
    return true;
  }

  public getCurrentState(): PoolState {
    return this.currentState;
  }

  public getContext(): PoolContext {
    return { ...this.context };
  }

  public updateContext(updates: Partial<PoolContext>): void {
    console.assert(typeof updates === 'object', 'Updates must be object');
    console.assert(updates.totalCapacity === undefined || updates.totalCapacity > 0, 'Total capacity must be positive');

    this.context = { ...this.context, ...updates };
  }
}

