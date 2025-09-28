/**
 * Debug Transition Hub - Centralized FSM Control for Debug Orchestration
 * NASA Rule 10 Compliant: Fixed bounds on all loops and iterations
 */
import { EventEmitter } from 'events';
import { DebugState, DebugEvent, DebugStateContext, StateTransition } from '../types/DebugState';

export class DebugTransitionHub extends EventEmitter {
  private currentState: DebugState = DebugState.IDLE;
  private context: DebugStateContext;
  private transitions: Map<string, StateTransition> = new Map();
  private stateHistory: DebugState[] = [];
  private readonly MAX_HISTORY_SIZE = 100; // NASA Rule 10: Fixed bound
  private readonly MAX_TRANSITION_RETRIES = 3; // NASA Rule 10: Fixed bound

  constructor(initialContext: Partial<DebugStateContext>) {
    super();
    this.context = {
      swarmId: initialContext.swarmId || 'default',
      errorReports: initialContext.errorReports || [],
      assignments: initialContext.assignments || [],
      fixes: initialContext.fixes || [],
      validationResults: new Map(),
      integrationStatus: false,
      retryCount: 0,
      maxRetries: 3,
      ...initialContext
    };
    this.initializeTransitions();
  }

  /**
   * Initialize all valid state transitions with fixed bounds
   * NASA Rule 10: Fixed transition table size
   */
  private initializeTransitions(): void {
    const transitionConfigs: StateTransition[] = [
      // From IDLE
      {
        fromState: DebugState.IDLE,
        event: DebugEvent.START_ANALYSIS,
        toState: DebugState.ANALYZING_ERRORS,
        guard: (ctx) => ctx.errorReports.length > 0
      },
      
      // From ANALYZING_ERRORS
      {
        fromState: DebugState.ANALYZING_ERRORS,
        event: DebugEvent.ANALYSIS_COMPLETE,
        toState: DebugState.DISTRIBUTING_TO_EXPERTS,
        guard: (ctx) => ctx.analysis !== undefined
      },
      {
        fromState: DebugState.ANALYZING_ERRORS,
        event: DebugEvent.ERROR_OCCURRED,
        toState: DebugState.ERROR_RECOVERY
      },
      
      // From DISTRIBUTING_TO_EXPERTS
      {
        fromState: DebugState.DISTRIBUTING_TO_EXPERTS,
        event: DebugEvent.EXPERTS_ASSIGNED,
        toState: DebugState.COORDINATING_DEBUGGING,
        guard: (ctx) => ctx.assignments.length > 0
      },
      {
        fromState: DebugState.DISTRIBUTING_TO_EXPERTS,
        event: DebugEvent.ERROR_OCCURRED,
        toState: DebugState.ERROR_RECOVERY
      },
      
      // From COORDINATING_DEBUGGING
      {
        fromState: DebugState.COORDINATING_DEBUGGING,
        event: DebugEvent.DEBUGGING_STARTED,
        toState: DebugState.MONITORING_PROGRESS
      },
      {
        fromState: DebugState.COORDINATING_DEBUGGING,
        event: DebugEvent.ERROR_OCCURRED,
        toState: DebugState.ERROR_RECOVERY
      },
      
      // From MONITORING_PROGRESS
      {
        fromState: DebugState.MONITORING_PROGRESS,
        event: DebugEvent.FIXES_GENERATED,
        toState: DebugState.VALIDATING_FIXES,
        guard: (ctx) => ctx.fixes.length > 0
      },
      {
        fromState: DebugState.MONITORING_PROGRESS,
        event: DebugEvent.ERROR_OCCURRED,
        toState: DebugState.ERROR_RECOVERY
      },
      
      // From VALIDATING_FIXES
      {
        fromState: DebugState.VALIDATING_FIXES,
        event: DebugEvent.VALIDATION_REQUESTED,
        toState: DebugState.TESTING_INTEGRATION,
        guard: (ctx) => this.allFixesValidated(ctx)
      },
      {
        fromState: DebugState.VALIDATING_FIXES,
        event: DebugEvent.ERROR_OCCURRED,
        toState: DebugState.ERROR_RECOVERY
      },
      
      // From TESTING_INTEGRATION
      {
        fromState: DebugState.TESTING_INTEGRATION,
        event: DebugEvent.INTEGRATION_READY,
        toState: DebugState.DEPLOYING_FIXES,
        guard: (ctx) => ctx.integrationStatus === true
      },
      {
        fromState: DebugState.TESTING_INTEGRATION,
        event: DebugEvent.ERROR_OCCURRED,
        toState: DebugState.ERROR_RECOVERY
      },
      
      // From DEPLOYING_FIXES
      {
        fromState: DebugState.DEPLOYING_FIXES,
        event: DebugEvent.DEPLOYMENT_READY,
        toState: DebugState.COMPLETED
      },
      {
        fromState: DebugState.DEPLOYING_FIXES,
        event: DebugEvent.ERROR_OCCURRED,
        toState: DebugState.ERROR_RECOVERY
      },
      
      // From ERROR_RECOVERY
      {
        fromState: DebugState.ERROR_RECOVERY,
        event: DebugEvent.RECOVERY_COMPLETE,
        toState: DebugState.IDLE,
        guard: (ctx) => ctx.retryCount < ctx.maxRetries
      },
      {
        fromState: DebugState.ERROR_RECOVERY,
        event: DebugEvent.PROCESS_COMPLETE,
        toState: DebugState.COMPLETED
      },
      
      // Global reset from any state
      {
        fromState: DebugState.IDLE,
        event: DebugEvent.RESET_REQUESTED,
        toState: DebugState.IDLE
      },
      {
        fromState: DebugState.ANALYZING_ERRORS,
        event: DebugEvent.RESET_REQUESTED,
        toState: DebugState.IDLE
      },
      {
        fromState: DebugState.DISTRIBUTING_TO_EXPERTS,
        event: DebugEvent.RESET_REQUESTED,
        toState: DebugState.IDLE
      },
      {
        fromState: DebugState.COORDINATING_DEBUGGING,
        event: DebugEvent.RESET_REQUESTED,
        toState: DebugState.IDLE
      },
      {
        fromState: DebugState.MONITORING_PROGRESS,
        event: DebugEvent.RESET_REQUESTED,
        toState: DebugState.IDLE
      },
      {
        fromState: DebugState.VALIDATING_FIXES,
        event: DebugEvent.RESET_REQUESTED,
        toState: DebugState.IDLE
      },
      {
        fromState: DebugState.TESTING_INTEGRATION,
        event: DebugEvent.RESET_REQUESTED,
        toState: DebugState.IDLE
      },
      {
        fromState: DebugState.DEPLOYING_FIXES,
        event: DebugEvent.RESET_REQUESTED,
        toState: DebugState.IDLE
      },
      {
        fromState: DebugState.ERROR_RECOVERY,
        event: DebugEvent.RESET_REQUESTED,
        toState: DebugState.IDLE
      },
      {
        fromState: DebugState.COMPLETED,
        event: DebugEvent.RESET_REQUESTED,
        toState: DebugState.IDLE
      }
    ];

    // NASA Rule 10: Fixed bound on transition loading
    const MAX_TRANSITIONS = 50;
    const transitionsToLoad = Math.min(transitionConfigs.length, MAX_TRANSITIONS);
    
    for (let i = 0; i < transitionsToLoad; i++) {
      const transition = transitionConfigs[i];
      const key = this.getTransitionKey(transition.fromState, transition.event);
      this.transitions.set(key, transition);
    }
  }

  /**
   * Execute state transition with validation
   * NASA Rule 10: Fixed retry bounds
   */
  async transition(event: DebugEvent): Promise<boolean> {
    const key = this.getTransitionKey(this.currentState, event);
    const transition = this.transitions.get(key);

    if (!transition) {
      this.emit('transition:invalid', {
        from: this.currentState,
        event,
        timestamp: new Date()
      });
      return false;
    }

    // Check guard condition
    if (transition.guard && !transition.guard(this.context)) {
      this.emit('transition:blocked', {
        from: this.currentState,
        event,
        reason: 'Guard condition failed',
        timestamp: new Date()
      });
      return false;
    }

    // Execute transition with retry logic
    let retryCount = 0;
    const MAX_RETRIES = this.MAX_TRANSITION_RETRIES;
    
    while (retryCount < MAX_RETRIES) {
      try {
        // Execute transition action if present
        if (transition.action) {
          await transition.action(this.context);
        }

        // Update state
        const previousState = this.currentState;
        this.currentState = transition.toState;
        this.addToHistory(previousState);

        this.emit('transition:success', {
          from: previousState,
          to: this.currentState,
          event,
          timestamp: new Date()
        });

        return true;
      } catch (error) {
        retryCount++;
        this.emit('transition:error', {
          from: this.currentState,
          event,
          error: error.message,
          retryCount,
          timestamp: new Date()
        });

        if (retryCount >= MAX_RETRIES) {
          // Force transition to error recovery
          this.currentState = DebugState.ERROR_RECOVERY;
          this.context.errorMessage = error.message;
          this.context.retryCount = retryCount;
          return false;
        }

        // Exponential backoff for retries
        await this.delay(Math.pow(2, retryCount) * 1000);
      }
    }

    return false;
  }

  /**
   * Get current state
   */
  getCurrentState(): DebugState {
    return this.currentState;
  }

  /**
   * Get current context
   */
  getContext(): DebugStateContext {
    return { ...this.context };
  }

  /**
   * Update context
   */
  updateContext(updates: Partial<DebugStateContext>): void {
    this.context = { ...this.context, ...updates };
  }

  /**
   * Check if transition is valid
   */
  canTransition(event: DebugEvent): boolean {
    const key = this.getTransitionKey(this.currentState, event);
    const transition = this.transitions.get(key);
    
    if (!transition) return false;
    if (transition.guard) return transition.guard(this.context);
    return true;
  }

  /**
   * Get valid events from current state
   */
  getValidEvents(): DebugEvent[] {
    const validEvents: DebugEvent[] = [];
    const MAX_EVENTS_CHECK = 20; // NASA Rule 10: Fixed bound
    
    const allEvents = Object.values(DebugEvent);
    const eventsToCheck = Math.min(allEvents.length, MAX_EVENTS_CHECK);
    
    for (let i = 0; i < eventsToCheck; i++) {
      if (this.canTransition(allEvents[i])) {
        validEvents.push(allEvents[i]);
      }
    }
    
    return validEvents;
  }

  /**
   * Reset to initial state
   */
  reset(): void {
    this.currentState = DebugState.IDLE;
    this.context.retryCount = 0;
    this.context.errorMessage = undefined;
    this.stateHistory = [];
    this.emit('state:reset', { timestamp: new Date() });
  }

  /**
   * Validate state invariants
   */
  checkInvariants(): boolean {
    try {
      // Check context consistency
      if (this.context.retryCount > this.context.maxRetries) {
        return false;
      }

      // Check state-specific invariants
      switch (this.currentState) {
        case DebugState.ANALYZING_ERRORS:
          return this.context.errorReports.length > 0;
        
        case DebugState.DISTRIBUTING_TO_EXPERTS:
          return this.context.analysis !== undefined;
        
        case DebugState.COORDINATING_DEBUGGING:
          return this.context.assignments.length > 0;
        
        case DebugState.VALIDATING_FIXES:
          return this.context.fixes.length > 0;
        
        case DebugState.TESTING_INTEGRATION:
          return this.allFixesValidated(this.context);
        
        case DebugState.COMPLETED:
          return this.context.integrationStatus === true;
        
        default:
          return true;
      }
    } catch (error) {
      this.emit('invariant:violation', {
        state: this.currentState,
        error: error.message,
        timestamp: new Date()
      });
      return false;
    }
  }

  // Private helper methods
  
  private getTransitionKey(fromState: DebugState, event: DebugEvent): string {
    return `${fromState}:${event}`;
  }

  private addToHistory(state: DebugState): void {
    this.stateHistory.push(state);
    
    // NASA Rule 10: Fixed bound on history size
    if (this.stateHistory.length > this.MAX_HISTORY_SIZE) {
      this.stateHistory.shift();
    }
  }

  private allFixesValidated(context: DebugStateContext): boolean {
    if (context.fixes.length === 0) return false;
    
    // NASA Rule 10: Fixed bound on validation checks
    const MAX_FIXES_TO_CHECK = 100;
    const fixesToCheck = Math.min(context.fixes.length, MAX_FIXES_TO_CHECK);
    
    for (let i = 0; i < fixesToCheck; i++) {
      const fix = context.fixes[i];
      if (!context.validationResults.has(fix.fixId)) {
        return false;
      }
    }
    
    return true;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

<!-- AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE -->
## Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
|--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
| 1.0.0   | 2025-09-28T15:32:45-04:00 | codex@sonnet-4 | Create DebugTransitionHub with NASA Rule 10 compliance | DebugTransitionHub.ts | OK | FSM centralized control | 0.00 | b2c3d4e |

### Receipt
- status: OK
- reason_if_blocked: --
- run_id: debug-fsm-hub-001
- inputs: ["DebugState.ts"]
- tools_used: ["MultiEdit"]
- versions: {"model":"sonnet-4","prompt":"fsm-debug-v1"}
<!-- AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE -->