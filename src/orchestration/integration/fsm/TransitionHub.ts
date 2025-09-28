/**
 * FSM TransitionHub - Centralized State Management
 * Handles all state transitions for SystemIntegrationOrchestrator
 * NASA Rule 10 Compliant - Single responsibility for state control
 */

import { EventEmitter } from 'events';
import {
  IntegrationState,
  IntegrationEvent,
  IntegrationEventData,
  IntegrationFSMContext,
  IntegrationTransition,
  IntegrationGuard,
  IntegrationAction
} from './types/IntegrationFSMTypes';

export class TransitionHub extends EventEmitter {
  private currentState: IntegrationState = IntegrationState.IDLE;
  private context: IntegrationFSMContext;
  private transitions: Map<string, IntegrationTransition> = new Map();
  private guards: Map<string, IntegrationGuard> = new Map();
  private actions: Map<string, IntegrationAction> = new Map();

  // Constants
  private readonly MAX_CONCURRENT_INTEGRATIONS = 3;
  private readonly CRITICAL_HEALTH_THRESHOLD = 0.6;

  constructor(initialContext: Partial<IntegrationFSMContext> = {}) {
    super();
    this.context = this.initializeContext(initialContext);
    this.initializeTransitions();
    this.initializeGuards();
    this.initializeActions();
  }

  /**
   * Process FSM event with strict transition validation
   */
  async processEvent<T extends IntegrationEvent>(
    event: T,
    data?: IntegrationEventData[T]
  ): Promise<boolean> {
    const transitionKey = this.getTransitionKey(this.currentState, event);
    const transition = this.transitions.get(transitionKey);

    if (!transition) {
      this.emit('transition:invalid', {
        from: this.currentState,
        event,
        reason: 'No valid transition found'
      });
      return false;
    }

    // Validate guard condition
    if (transition.guard && !transition.guard(this.context, data)) {
      this.emit('transition:blocked', {
        from: this.currentState,
        to: transition.to,
        event,
        reason: 'Guard condition failed'
      });
      return false;
    }

    const previousState = this.currentState;

    try {
      // Execute exit action for current state
      await this.executeStateExit(this.currentState);

      // Update state
      this.currentState = transition.to;

      // Execute transition action
      if (transition.action) {
        await transition.action(this.context, data);
      }

      // Execute entry action for new state
      await this.executeStateEntry(this.currentState);

      // Emit successful transition
      this.emit('transition:completed', {
        from: previousState,
        to: this.currentState,
        event,
        data
      });

      return true;

    } catch (error) {
      // Rollback state on failure
      this.currentState = previousState;
      this.emit('transition:failed', {
        from: previousState,
        to: transition.to,
        event,
        error: error.message
      });
      return false;
    }
  }

  /**
   * Get current FSM state
   */
  getCurrentState(): IntegrationState {
    return this.currentState;
  }

  /**
   * Get current FSM context
   */
  getContext(): IntegrationFSMContext {
    return { ...this.context };
  }

  /**
   * Update FSM context
   */
  updateContext(updates: Partial<IntegrationFSMContext>): void {
    this.context = { ...this.context, ...updates };
    this.emit('context:updated', updates);
  }

  /**
   * Check if event is valid for current state
   */
  canProcessEvent(event: IntegrationEvent): boolean {
    const transitionKey = this.getTransitionKey(this.currentState, event);
    const transition = this.transitions.get(transitionKey);

    if (!transition) return false;
    if (!transition.guard) return true;

    return transition.guard(this.context);
  }

  /**
   * Get valid events for current state
   */
  getValidEvents(): IntegrationEvent[] {
    const validEvents: IntegrationEvent[] = [];

    for (const event of Object.values(IntegrationEvent)) {
      if (this.canProcessEvent(event)) {
        validEvents.push(event);
      }
    }

    return validEvents;
  }

  private initializeContext(initial: Partial<IntegrationFSMContext>): IntegrationFSMContext {
    return {
      currentExecution: null,
      currentPlan: null,
      currentPhase: null,
      currentPhaseIndex: 0,
      totalPhases: 0,
      activeExecutions: new Map(),
      planValidated: false,
      qualityGatesPassed: false,
      rollbackInProgress: false,
      cancellationFlag: false,
      healthScore: 1.0,
      validationResult: null,
      rollbackResult: null,
      cleanupResult: null,
      errorLogged: false,
      allPhasesCompleted: false,
      ...initial
    };
  }

  private initializeTransitions(): void {
    const transitions: IntegrationTransition[] = [
      // IDLE -> PLANNING
      {
        from: IntegrationState.IDLE,
        to: IntegrationState.PLANNING,
        event: IntegrationEvent.START_INTEGRATION,
        guard: this.guards.get('canStartIntegration'),
        action: this.actions.get('initializeExecution')
      },

      // PLANNING -> VALIDATING_PLAN
      {
        from: IntegrationState.PLANNING,
        to: IntegrationState.VALIDATING_PLAN,
        event: IntegrationEvent.PLAN_CREATED,
        guard: this.guards.get('planExists'),
        action: this.actions.get('startValidation')
      },

      // VALIDATING_PLAN -> EXECUTING
      {
        from: IntegrationState.VALIDATING_PLAN,
        to: IntegrationState.EXECUTING,
        event: IntegrationEvent.PLAN_VALIDATED,
        guard: this.guards.get('validationPassed'),
        action: this.actions.get('beginExecution')
      },

      // VALIDATING_PLAN -> FAILED
      {
        from: IntegrationState.VALIDATING_PLAN,
        to: IntegrationState.FAILED,
        event: IntegrationEvent.PLAN_VALIDATION_FAILED,
        guard: this.guards.get('validationCritical'),
        action: this.actions.get('markValidationFailed')
      },

      // EXECUTING -> MONITORING
      {
        from: IntegrationState.EXECUTING,
        to: IntegrationState.MONITORING,
        event: IntegrationEvent.EXECUTION_STARTED,
        guard: this.guards.get('executionActive'),
        action: this.actions.get('enableMonitoring')
      },

      // MONITORING -> EXECUTING (next phase)
      {
        from: IntegrationState.MONITORING,
        to: IntegrationState.EXECUTING,
        event: IntegrationEvent.PHASE_COMPLETED,
        guard: this.guards.get('hasMorePhases'),
        action: this.actions.get('nextPhase')
      },

      // MONITORING -> VALIDATING_RESULTS (all phases complete)
      {
        from: IntegrationState.MONITORING,
        to: IntegrationState.VALIDATING_RESULTS,
        event: IntegrationEvent.PHASE_COMPLETED,
        guard: this.guards.get('allPhasesComplete'),
        action: this.actions.get('startResultValidation')
      },

      // EXECUTING -> ROLLBACK
      {
        from: IntegrationState.EXECUTING,
        to: IntegrationState.ROLLBACK,
        event: IntegrationEvent.PHASE_FAILED,
        guard: this.guards.get('rollbackRequired'),
        action: this.actions.get('initializeRollback')
      },

      // MONITORING -> ROLLBACK
      {
        from: IntegrationState.MONITORING,
        to: IntegrationState.ROLLBACK,
        event: IntegrationEvent.HEALTH_DEGRADED,
        guard: this.guards.get('healthCritical'),
        action: this.actions.get('emergencyRollback')
      },

      // VALIDATING_RESULTS -> COMPLETED
      {
        from: IntegrationState.VALIDATING_RESULTS,
        to: IntegrationState.COMPLETED,
        event: IntegrationEvent.QUALITY_GATE_PASSED,
        guard: this.guards.get('allGatesPassed'),
        action: this.actions.get('finalizeSuccess')
      },

      // VALIDATING_RESULTS -> ROLLBACK
      {
        from: IntegrationState.VALIDATING_RESULTS,
        to: IntegrationState.ROLLBACK,
        event: IntegrationEvent.QUALITY_GATE_FAILED,
        guard: this.guards.get('gateBlocking'),
        action: this.actions.get('qualityRollback')
      },

      // ROLLBACK -> FAILED
      {
        from: IntegrationState.ROLLBACK,
        to: IntegrationState.FAILED,
        event: IntegrationEvent.ROLLBACK_COMPLETED,
        guard: this.guards.get('rollbackSuccessful'),
        action: this.actions.get('markRollbackComplete')
      },

      // COMPLETED -> IDLE
      {
        from: IntegrationState.COMPLETED,
        to: IntegrationState.IDLE,
        event: IntegrationEvent.EXECUTION_ARCHIVED,
        guard: this.guards.get('executionArchived'),
        action: this.actions.get('resetToIdle')
      },

      // FAILED -> IDLE
      {
        from: IntegrationState.FAILED,
        to: IntegrationState.IDLE,
        event: IntegrationEvent.CLEANUP_COMPLETED,
        guard: this.guards.get('cleanupFinished'),
        action: this.actions.get('resetToIdle')
      }
    ];

    // Universal transitions (from any state)
    for (const state of Object.values(IntegrationState)) {
      transitions.push({
        from: state,
        to: IntegrationState.FAILED,
        event: IntegrationEvent.CANCEL_INTEGRATION,
        guard: this.guards.get('cancellationRequested'),
        action: this.actions.get('cancelAndCleanup')
      });
    }

    // Store transitions
    transitions.forEach(transition => {
      const key = this.getTransitionKey(transition.from, transition.event);
      this.transitions.set(key, transition);
    });
  }

  private initializeGuards(): void {
    this.guards.set('canStartIntegration', (context) =>
      context.activeExecutions.size < this.MAX_CONCURRENT_INTEGRATIONS);

    this.guards.set('planExists', (context) =>
      context.currentPlan !== null);

    this.guards.set('validationPassed', (context) =>
      context.validationResult?.passed === true);

    this.guards.set('validationCritical', (context) =>
      (context.validationResult?.criticalErrors.length || 0) > 0);

    this.guards.set('executionActive', (context) =>
      context.currentExecution?.status === 'executing');

    this.guards.set('hasMorePhases', (context) =>
      context.currentPhaseIndex < context.totalPhases - 1);

    this.guards.set('allPhasesComplete', (context) =>
      context.currentPhaseIndex === context.totalPhases - 1);

    this.guards.set('rollbackRequired', (context, eventData) =>
      eventData?.error?.severity === 'critical' || eventData?.error?.blocking === true);

    this.guards.set('healthCritical', (context) =>
      context.healthScore < this.CRITICAL_HEALTH_THRESHOLD);

    this.guards.set('allGatesPassed', (context) =>
      context.qualityGatesPassed === true);

    this.guards.set('gateBlocking', (context, eventData) =>
      eventData?.failure?.gateId && true); // Simplified for now

    this.guards.set('rollbackSuccessful', (context) =>
      context.rollbackResult?.success === true);

    this.guards.set('cancellationRequested', (context) =>
      context.cancellationFlag === true);

    this.guards.set('executionArchived', (context) =>
      context.currentExecution?.archived === true);

    this.guards.set('cleanupFinished', (context) =>
      context.cleanupResult?.completed === true);
  }

  private initializeActions(): void {
    // Action implementations will be delegated to components
    this.actions.set('initializeExecution', async (context, data) => {
      context.cancellationFlag = false;
      context.errorLogged = false;
    });

    this.actions.set('startValidation', async (context) => {
      context.planValidated = false;
    });

    this.actions.set('beginExecution', async (context) => {
      context.currentPhaseIndex = 0;
      context.allPhasesCompleted = false;
    });

    this.actions.set('enableMonitoring', async (context) => {
      // Monitoring will be enabled by MonitoringComponent
    });

    this.actions.set('nextPhase', async (context) => {
      context.currentPhaseIndex++;
    });

    this.actions.set('startResultValidation', async (context) => {
      context.allPhasesCompleted = true;
    });

    this.actions.set('initializeRollback', async (context) => {
      context.rollbackInProgress = true;
    });

    this.actions.set('emergencyRollback', async (context) => {
      context.rollbackInProgress = true;
    });

    this.actions.set('finalizeSuccess', async (context) => {
      context.qualityGatesPassed = true;
    });

    this.actions.set('qualityRollback', async (context) => {
      context.rollbackInProgress = true;
    });

    this.actions.set('markValidationFailed', async (context) => {
      context.errorLogged = true;
    });

    this.actions.set('markRollbackComplete', async (context) => {
      context.rollbackInProgress = false;
      context.errorLogged = true;
    });

    this.actions.set('cancelAndCleanup', async (context) => {
      context.cancellationFlag = true;
      context.errorLogged = true;
    });

    this.actions.set('resetToIdle', async (context) => {
      context.currentExecution = null;
      context.currentPlan = null;
      context.currentPhase = null;
      context.currentPhaseIndex = 0;
      context.totalPhases = 0;
      context.planValidated = false;
      context.qualityGatesPassed = false;
      context.rollbackInProgress = false;
      context.cancellationFlag = false;
      context.healthScore = 1.0;
      context.validationResult = null;
      context.rollbackResult = null;
      context.cleanupResult = null;
      context.errorLogged = false;
      context.allPhasesCompleted = false;
    });
  }

  private async executeStateEntry(state: IntegrationState): Promise<void> {
    this.emit('state:entry', { state, context: this.getContext() });
  }

  private async executeStateExit(state: IntegrationState): Promise<void> {
    this.emit('state:exit', { state, context: this.getContext() });
  }

  private getTransitionKey(from: IntegrationState, event: IntegrationEvent): string {
    return `${from}->${event}`;
  }
}

<!-- AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE -->
## Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
|--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
| 1.0.0   | 2025-09-27T18:02:14-04:00 | SystemIntegrationOrchestrator@refactor | Created centralized FSM TransitionHub with guards, actions, and strict state management | TransitionHub.ts | OK | Single responsibility state control | 0.00 | d9c4f1e |

### Receipt
- status: OK
- reason_if_blocked: --
- run_id: fsm-transition-hub-001
- inputs: ["IntegrationFSMTypes.ts", "IntegrationOrchestratorFSM.yaml"]
- tools_used: ["Write"]
- versions: {"model":"claude-sonnet-4","prompt":"fsm-first-refactor-v1"}
<!-- AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE -->