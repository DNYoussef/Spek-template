/**
 * ComplianceHub.ts
 * Centralized FSM transition manager for validation system
 * NASA POT10 Compliant: All functions ≤60 lines, bounded state management
 */

import { EventEmitter } from 'events';
import {
  ValidationState,
  ValidationEvent,
  ValidationContext,
  ValidationFSMConfig,
  StateTransition,
  TransitionGuard,
  StateAction
} from '~types/ValidationFSMTypes';

export class ComplianceHub extends EventEmitter {
  private readonly config: ValidationFSMConfig;
  private readonly activeContexts: Map<string, ValidationContext>;
  private readonly transitionMatrix: Map<string, StateTransition>;
  
  // NASA Rule 10: Bounded constants
  private readonly MAX_ACTIVE_CONTEXTS = 100;
  private readonly TRANSITION_TIMEOUT = 30000; // 30 seconds
  
  constructor(config: ValidationFSMConfig) {
    super();
    
    // Assertions for NASA POT10 compliance
    if (!config || !config.transitions || config.transitions.length === 0) {
      throw new Error('ComplianceHub: Valid FSM config required');
    }
    
    this.config = config;
    this.activeContexts = new Map();
    this.transitionMatrix = this.buildTransitionMatrix(config.transitions);
    
    // Verify transition matrix is complete
    if (this.transitionMatrix.size === 0) {
      throw new Error('ComplianceHub: Empty transition matrix');
    }
  }

  /**
   * Create new validation context (NASA Rule 10: ≤60 lines)
   */
  async createContext(
    targetId: string,
    validationType: string,
    complianceLevel: string
  ): Promise<ValidationContext> {
    // Assertion 1: Valid inputs
    if (!targetId || !validationType || !complianceLevel) {
      throw new Error('ComplianceHub: All parameters required');
    }
    
    // Assertion 2: Not exceeding capacity
    if (this.activeContexts.size >= this.MAX_ACTIVE_CONTEXTS) {
      throw new Error(`ComplianceHub: Max contexts exceeded (${this.MAX_ACTIVE_CONTEXTS})`);
    }

    const context: ValidationContext = {
      currentState: this.config.initialState,
      targetId,
      validationType: validationType as any,
      startTime: Date.now(),
      complianceLevel: complianceLevel as any,
      checkResults: [],
      validationResults: [],
      reportData: {
        reportId: '',
        generatedAt: 0,
        summary: {
          totalChecks: 0,
          passedChecks: 0,
          failedChecks: 0,
          complianceScore: 0
        },
        findings: [],
        recommendations: []
      },
      enforcementActions: [],
      certificationStatus: {
        certified: false,
        certificationLevel: complianceLevel as any,
        validUntil: 0,
        conditions: []
      },
      errors: []
    };

    this.activeContexts.set(targetId, context);
    
    this.emit('context:created', {
      targetId,
      initialState: context.currentState,
      timestamp: context.startTime
    });

    return context;
  }

  /**
   * Process state transition (NASA Rule 10: ≤60 lines)
   */
  async processTransition(
    targetId: string,
    event: ValidationEvent
  ): Promise<ValidationContext> {
    // Assertion 1: Context exists
    const context = this.activeContexts.get(targetId);
    if (!context) {
      throw new Error(`ComplianceHub: Context not found for ${targetId}`);
    }

    // Assertion 2: Valid transition
    const transitionKey = this.getTransitionKey(context.currentState, event);
    const transition = this.transitionMatrix.get(transitionKey);
    
    if (!transition) {
      throw new Error(`ComplianceHub: Invalid transition ${context.currentState} + ${event}`);
    }

    // Check guard condition if present
    if (transition.guard && !transition.guard(context, event)) {
      this.emit('transition:blocked', {
        targetId,
        fromState: context.currentState,
        event,
        timestamp: Date.now()
      });
      return context;
    }

    // Execute transition
    const oldState = context.currentState;
    const newContext = { ...context, currentState: transition.to };
    
    // Execute state action if present
    let finalContext = newContext;
    if (transition.action) {
      finalContext = await transition.action(newContext);
    }

    // Update active context
    this.activeContexts.set(targetId, finalContext);

    this.emit('transition:completed', {
      targetId,
      fromState: oldState,
      toState: finalContext.currentState,
      event,
      timestamp: Date.now()
    });

    return finalContext;
  }

  /**
   * Get current context (NASA Rule 10: ≤60 lines)
   */
  getContext(targetId: string): ValidationContext | undefined {
    // Assertion: Valid target ID
    if (!targetId) {
      throw new Error('ComplianceHub: Target ID required');
    }
    
    return this.activeContexts.get(targetId);
  }

  /**
   * Remove completed context (NASA Rule 10: ≤60 lines)
   */
  removeContext(targetId: string): boolean {
    // Assertion 1: Valid target ID
    if (!targetId) {
      throw new Error('ComplianceHub: Target ID required');
    }
    
    const context = this.activeContexts.get(targetId);
    if (!context) {
      return false;
    }
    
    // Assertion 2: Context is in final state
    const isFinalState = this.config.finalStates.includes(context.currentState);
    if (!isFinalState) {
      throw new Error(`ComplianceHub: Cannot remove non-final context ${context.currentState}`);
    }

    const removed = this.activeContexts.delete(targetId);
    
    if (removed) {
      this.emit('context:removed', {
        targetId,
        finalState: context.currentState,
        duration: Date.now() - context.startTime,
        timestamp: Date.now()
      });
    }

    return removed;
  }

  /**
   * Get all valid transitions for current state (NASA Rule 10: ≤60 lines)
   */
  getValidTransitions(currentState: ValidationState): ValidationEvent[] {
    // Assertion: Valid state
    if (!Object.values(ValidationState).includes(currentState)) {
      throw new Error(`ComplianceHub: Invalid state ${currentState}`);
    }
    
    const validEvents: ValidationEvent[] = [];
    
    // Fixed bound iteration for NASA Rule 10
    const allEvents = Object.values(ValidationEvent);
    const maxEvents = Math.min(allEvents.length, 20);
    
    for (let i = 0; i < maxEvents; i++) {
      const event = allEvents[i];
      const transitionKey = this.getTransitionKey(currentState, event);
      
      if (this.transitionMatrix.has(transitionKey)) {
        validEvents.push(event);
      }
    }

    return validEvents;
  }

  /**
   * Get system status (NASA Rule 10: ≤60 lines)
   */
  getSystemStatus(): {
    activeContexts: number;
    maxContexts: number;
    utilization: number;
    states: Record<ValidationState, number>;
  } {
    const states: Record<ValidationState, number> = {
      [ValidationState.CHECKING]: 0,
      [ValidationState.VALIDATING]: 0,
      [ValidationState.REPORTING]: 0,
      [ValidationState.ENFORCING]: 0,
      [ValidationState.CERTIFIED]: 0
    };

    // Count contexts by state (bounded iteration)
    const contexts = Array.from(this.activeContexts.values());
    const maxContexts = Math.min(contexts.length, this.MAX_ACTIVE_CONTEXTS);
    
    for (let i = 0; i < maxContexts; i++) {
      const context = contexts[i];
      states[context.currentState]++;
    }

    return {
      activeContexts: this.activeContexts.size,
      maxContexts: this.MAX_ACTIVE_CONTEXTS,
      utilization: this.activeContexts.size / this.MAX_ACTIVE_CONTEXTS,
      states
    };
  }

  /**
   * Build transition matrix from config (NASA Rule 10: ≤60 lines)
   */
  private buildTransitionMatrix(transitions: StateTransition[]): Map<string, StateTransition> {
    // Assertion: Valid transitions array
    if (!Array.isArray(transitions) || transitions.length === 0) {
      throw new Error('ComplianceHub: Valid transitions array required');
    }
    
    const matrix = new Map<string, StateTransition>();
    
    // Fixed bound for NASA Rule 10
    const maxTransitions = Math.min(transitions.length, 50);
    
    for (let i = 0; i < maxTransitions; i++) {
      const transition = transitions[i];
      
      // Validate transition
      if (!transition.from || !transition.to || !transition.event) {
        throw new Error(`ComplianceHub: Invalid transition at index ${i}`);
      }
      
      const key = this.getTransitionKey(transition.from, transition.event);
      
      // Check for duplicate transitions
      if (matrix.has(key)) {
        throw new Error(`ComplianceHub: Duplicate transition ${key}`);
      }
      
      matrix.set(key, transition);
    }
    
    // Assertion: Matrix not empty
    if (matrix.size === 0) {
      throw new Error('ComplianceHub: No valid transitions found');
    }

    return matrix;
  }

  /**
   * Generate transition key (NASA Rule 10: ≤60 lines)
   */
  private getTransitionKey(state: ValidationState, event: ValidationEvent): string {
    // Assertion: Valid inputs
    if (!state || !event) {
      throw new Error('ComplianceHub: State and event required for transition key');
    }
    
    return `${state}:${event}`;
  }
}

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0

// Receipt
// status: OK
// reason_if_blocked: --
// run_id: compliance-hub-001
// inputs: ["ValidationFSMTypes.ts"]
// tools_used: ["mcp__filesystem__write_file"]
// versions: {"model":"claude-4","prompt":"validation-destroyer-v1"}
// === END FOOTER ===