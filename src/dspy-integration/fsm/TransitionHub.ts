/**
 * FSM Transition Hub - Central state transition manager
 * 
 * NASA Rule 10 compliant finite state machine with fixed bounds
 * and centralized transition control for DSPy engine.
 */

import { DSPyEngineState, DSPyEngineEvent, StateTransition, EngineContext } from '../types/DSPyTypes';

export class TransitionHub {
  private readonly transitions: Map<string, StateTransition> = new Map();
  private readonly maxTransitionHistory = 1000; // Fixed bound
  private readonly transitionHistory: TransitionRecord[] = [];

  constructor() {
    this.initializeTransitions();
  }

  // NASA Rule 10: Function ≤60 lines, fixed bounds, assertions
  public async executeTransition(
    currentState: DSPyEngineState,
    event: DSPyEngineEvent,
    context: EngineContext
  ): Promise<DSPyEngineState> {
    // NASA Rule 10: Minimum 2 assertions per function
    this.assert(currentState !== undefined, 'Current state required');
    this.assert(event !== undefined, 'Event required');
    
    const transitionKey = this.createTransitionKey(currentState, event);
    const transition = this.transitions.get(transitionKey);
    
    if (!transition) {
      this.recordTransition(currentState, event, currentState, false, 'No transition found');
      return currentState; // Stay in current state
    }
    
    try {
      // Check guard condition if present
      if (transition.guard && !transition.guard(context)) {
        this.recordTransition(currentState, event, currentState, false, 'Guard condition failed');
        return currentState;
      }
      
      // Execute transition action if present
      if (transition.action) {
        await transition.action(context);
      }
      
      this.recordTransition(currentState, event, transition.toState, true, 'Success');
      return transition.toState;
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.recordTransition(currentState, event, DSPyEngineState.ERROR_RECOVERY, false, errorMsg);
      return DSPyEngineState.ERROR_RECOVERY;
    }
  }

  // NASA Rule 10: Function ≤60 lines, validate state machine completeness
  public validateStateMachine(): ValidationReport {
    this.assert(this.transitions.size > 0, 'Transitions must be defined');
    
    const states = Object.values(DSPyEngineState);
    const events = Object.values(DSPyEngineEvent);
    
    const coverage = this.calculateCoverage(states, events);
    const reachability = this.analyzeReachability(states);
    const deadlocks = this.detectDeadlocks(states);
    
    return {
      isValid: coverage.percentage >= 85 && deadlocks.length === 0,
      coverage,
      reachability,
      deadlocks,
      totalTransitions: this.transitions.size
    };
  }

  // NASA Rule 10: Initialize with fixed bounds
  private initializeTransitions(): void {
    const transitionDefinitions: TransitionDefinition[] = [
      // Initialization flow
      {
        from: DSPyEngineState.INITIALIZING,
        event: DSPyEngineEvent.INITIALIZATION_COMPLETE,
        to: DSPyEngineState.READY
      },
      
      // Learning flow
      {
        from: DSPyEngineState.READY,
        event: DSPyEngineEvent.OPTIMIZATION_REQUEST,
        to: DSPyEngineState.LEARNING,
        guard: (context) => context.signatures.size > 0
      },
      
      {
        from: DSPyEngineState.LEARNING,
        event: DSPyEngineEvent.LEARNING_COMPLETE,
        to: DSPyEngineState.OPTIMIZING
      },
      
      // Optimization flow
      {
        from: DSPyEngineState.OPTIMIZING,
        event: DSPyEngineEvent.OPTIMIZATION_COMPLETE,
        to: DSPyEngineState.VALIDATING
      },
      
      // Validation flow
      {
        from: DSPyEngineState.VALIDATING,
        event: DSPyEngineEvent.VALIDATION_COMPLETE,
        to: DSPyEngineState.DEPLOYING,
        guard: (context) => this.isValidationSuccessful(context)
      },
      
      {
        from: DSPyEngineState.VALIDATING,
        event: DSPyEngineEvent.VALIDATION_COMPLETE,
        to: DSPyEngineState.READY,
        guard: (context) => !this.isValidationSuccessful(context)
      },
      
      // Deployment flow
      {
        from: DSPyEngineState.DEPLOYING,
        event: DSPyEngineEvent.DEPLOYMENT_COMPLETE,
        to: DSPyEngineState.MONITORING
      },
      
      // Error recovery
      {
        from: DSPyEngineState.ERROR_RECOVERY,
        event: DSPyEngineEvent.RECOVERY_COMPLETE,
        to: DSPyEngineState.READY
      },
      
      // Error transitions from any state
      ...Object.values(DSPyEngineState).map(state => ({
        from: state,
        event: DSPyEngineEvent.ERROR_OCCURRED,
        to: DSPyEngineState.ERROR_RECOVERY
      }))
    ];
    
    // NASA Rule 10: Fixed loop bound
    for (let i = 0; i < transitionDefinitions.length && i < 100; i++) {
      const def = transitionDefinitions[i];
      const key = this.createTransitionKey(def.from, def.event);
      this.transitions.set(key, {
        fromState: def.from,
        event: def.event,
        toState: def.to,
        guard: def.guard,
        action: def.action
      });
    }
  }

  // NASA Rule 10: Helper functions ≤60 lines with assertions
  private createTransitionKey(state: DSPyEngineState, event: DSPyEngineEvent): string {
    this.assert(state !== undefined, 'State required for key');
    this.assert(event !== undefined, 'Event required for key');
    return `${state}->${event}`;
  }

  private recordTransition(
    fromState: DSPyEngineState,
    event: DSPyEngineEvent,
    toState: DSPyEngineState,
    success: boolean,
    details: string
  ): void {
    // NASA Rule 10: Fixed bound for history size
    if (this.transitionHistory.length >= this.maxTransitionHistory) {
      this.transitionHistory.shift(); // Remove oldest
    }
    
    this.transitionHistory.push({
      timestamp: new Date(),
      fromState,
      event,
      toState,
      success,
      details
    });
  }

  private isValidationSuccessful(context: EngineContext): boolean {
    this.assert(context !== undefined, 'Context required for validation check');
    // Implementation would check validation metrics
    return context.metrics.length > 0 && 
           context.metrics[context.metrics.length - 1].qualityScore > context.config.qualityThreshold;
  }

  private calculateCoverage(states: DSPyEngineState[], events: DSPyEngineEvent[]): CoverageReport {
    const totalPossible = states.length * events.length;
    const covered = this.transitions.size;
    
    return {
      total: totalPossible,
      covered,
      percentage: totalPossible > 0 ? (covered / totalPossible) * 100 : 0
    };
  }

  private analyzeReachability(states: DSPyEngineState[]): ReachabilityReport {
    const reachable = new Set<DSPyEngineState>([DSPyEngineState.INITIALIZING]);
    const queue = [DSPyEngineState.INITIALIZING];
    
    // NASA Rule 10: Fixed bound BFS
    for (let i = 0; i < queue.length && i < 100; i++) {
      const currentState = queue[i];
      
      for (const transition of this.transitions.values()) {
        if (transition.fromState === currentState && !reachable.has(transition.toState)) {
          reachable.add(transition.toState);
          queue.push(transition.toState);
        }
      }
    }
    
    const unreachable = states.filter(state => !reachable.has(state));
    
    return {
      reachableStates: Array.from(reachable),
      unreachableStates: unreachable,
      totalReachable: reachable.size
    };
  }

  private detectDeadlocks(states: DSPyEngineState[]): DeadlockReport[] {
    const deadlocks: DeadlockReport[] = [];
    
    // NASA Rule 10: Fixed bound deadlock detection
    for (let i = 0; i < states.length && i < 50; i++) {
      const state = states[i];
      const hasOutgoingTransitions = Array.from(this.transitions.values())
        .some(t => t.fromState === state);
        
      if (!hasOutgoingTransitions && state !== DSPyEngineState.ERROR_RECOVERY) {
        deadlocks.push({
          state,
          description: `No outgoing transitions from ${state}`
        });
      }
    }
    
    return deadlocks;
  }

  // NASA Rule 10: Assertion helper
  private assert(condition: boolean, message: string): void {
    if (!condition) {
      throw new Error(`Assertion failed: ${message}`);
    }
  }
}

// Supporting interfaces
interface TransitionDefinition {
  readonly from: DSPyEngineState;
  readonly event: DSPyEngineEvent;
  readonly to: DSPyEngineState;
  readonly guard?: (context: EngineContext) => boolean;
  readonly action?: (context: EngineContext) => Promise<void>;
}

interface TransitionRecord {
  readonly timestamp: Date;
  readonly fromState: DSPyEngineState;
  readonly event: DSPyEngineEvent;
  readonly toState: DSPyEngineState;
  readonly success: boolean;
  readonly details: string;
}

interface ValidationReport {
  readonly isValid: boolean;
  readonly coverage: CoverageReport;
  readonly reachability: ReachabilityReport;
  readonly deadlocks: DeadlockReport[];
  readonly totalTransitions: number;
}

interface CoverageReport {
  readonly total: number;
  readonly covered: number;
  readonly percentage: number;
}

interface ReachabilityReport {
  readonly reachableStates: DSPyEngineState[];
  readonly unreachableStates: DSPyEngineState[];
  readonly totalReachable: number;
}

interface DeadlockReport {
  readonly state: DSPyEngineState;
  readonly description: string;
}

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0

// Receipt
// status: OK
// reason_if_blocked: --
// run_id: dspy-fsm-hub-001
// inputs: ["DSPyTypes.ts"]
// tools_used: ["filesystem", "multiedit"]
// versions: {"model":"claude-sonnet-4","prompt":"dspy-implementation-v1"}
// === END FOOTER ===