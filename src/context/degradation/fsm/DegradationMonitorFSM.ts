/**
 * Degradation Monitor Finite State Machine
 * Core FSM implementation for degradation monitoring workflow
 */

import {
  MonitoringState,
  MonitoringEvent,
  FSMState,
  MonitoringContext,
  StateTransition
} from '../types/DegradationTypes';

export class DegradationMonitorFSM {
  private currentState: MonitoringState = MonitoringState.IDLE;
  private states: Map<MonitoringState, FSMState> = new Map();
  private transitions: StateTransition[] = [];
  private context: MonitoringContext;

  constructor(context: MonitoringContext) {
    this.context = context;
    this.initializeStates();
    this.defineTransitions();
  }

  private initializeStates(): void {
    // Register all state implementations
    this.states.set(MonitoringState.IDLE, new IdleState());
    this.states.set(MonitoringState.MONITORING, new MonitoringActiveState());
    this.states.set(MonitoringState.ALERT_GENERATED, new AlertGeneratedState());
    this.states.set(MonitoringState.RECOVERY_PENDING, new RecoveryPendingState());
    this.states.set(MonitoringState.RECOVERY_EXECUTING, new RecoveryExecutingState());
    this.states.set(MonitoringState.VALIDATION, new ValidationState());
    this.states.set(MonitoringState.ERROR, new ErrorState());
  }

  private defineTransitions(): void {
    this.transitions = [
      // From IDLE
      { from: MonitoringState.IDLE, event: MonitoringEvent.START_MONITORING, to: MonitoringState.MONITORING },
      
      // From MONITORING
      { from: MonitoringState.MONITORING, event: MonitoringEvent.STOP_MONITORING, to: MonitoringState.IDLE },
      { from: MonitoringState.MONITORING, event: MonitoringEvent.DRIFT_DETECTED, to: MonitoringState.ALERT_GENERATED },
      { from: MonitoringState.MONITORING, event: MonitoringEvent.ERROR_OCCURRED, to: MonitoringState.ERROR },
      
      // From ALERT_GENERATED
      { from: MonitoringState.ALERT_GENERATED, event: MonitoringEvent.RECOVERY_INITIATED, to: MonitoringState.RECOVERY_PENDING },
      { from: MonitoringState.ALERT_GENERATED, event: MonitoringEvent.STOP_MONITORING, to: MonitoringState.IDLE },
      
      // From RECOVERY_PENDING
      { from: MonitoringState.RECOVERY_PENDING, event: MonitoringEvent.RECOVERY_INITIATED, to: MonitoringState.RECOVERY_EXECUTING },
      { from: MonitoringState.RECOVERY_PENDING, event: MonitoringEvent.ERROR_OCCURRED, to: MonitoringState.ERROR },
      
      // From RECOVERY_EXECUTING
      { from: MonitoringState.RECOVERY_EXECUTING, event: MonitoringEvent.RECOVERY_COMPLETED, to: MonitoringState.VALIDATION },
      { from: MonitoringState.RECOVERY_EXECUTING, event: MonitoringEvent.ERROR_OCCURRED, to: MonitoringState.ERROR },
      
      // From VALIDATION
      { from: MonitoringState.VALIDATION, event: MonitoringEvent.VALIDATION_PASSED, to: MonitoringState.MONITORING },
      { from: MonitoringState.VALIDATION, event: MonitoringEvent.VALIDATION_FAILED, to: MonitoringState.RECOVERY_PENDING },
      
      // From ERROR
      { from: MonitoringState.ERROR, event: MonitoringEvent.RESET, to: MonitoringState.IDLE },
      
      // Global transitions
      { from: MonitoringState.MONITORING, event: MonitoringEvent.RESET, to: MonitoringState.IDLE },
      { from: MonitoringState.ALERT_GENERATED, event: MonitoringEvent.RESET, to: MonitoringState.IDLE },
      { from: MonitoringState.RECOVERY_PENDING, event: MonitoringEvent.RESET, to: MonitoringState.IDLE },
      { from: MonitoringState.VALIDATION, event: MonitoringEvent.RESET, to: MonitoringState.IDLE }
    ];
  }

  async processEvent(event: MonitoringEvent): Promise<boolean> {
    const currentStateImpl = this.states.get(this.currentState);
    if (!currentStateImpl) {
      throw new Error(`No implementation for state: ${this.currentState}`);
    }

    // Check if event is valid for current state
    if (!currentStateImpl.canTransition(event)) {
      console.warn(`Event ${event} not valid for state ${this.currentState}`);
      return false;
    }

    // Find transition
    const transition = this.findTransition(this.currentState, event);
    if (!transition) {
      console.warn(`No transition found for ${this.currentState} -> ${event}`);
      return false;
    }

    // Check guard condition
    if (transition.guard && !transition.guard(this.context)) {
      console.warn(`Guard condition failed for transition ${this.currentState} -> ${transition.to}`);
      return false;
    }

    // Execute transition
    await this.executeTransition(transition);
    return true;
  }

  private findTransition(from: MonitoringState, event: MonitoringEvent): StateTransition | null {
    return this.transitions.find(t => t.from === from && t.event === event) || null;
  }

  private async executeTransition(transition: StateTransition): Promise<void> {
    const fromState = this.states.get(transition.from);
    const toState = this.states.get(transition.to);

    if (!fromState || !toState) {
      throw new Error(`Invalid transition states: ${transition.from} -> ${transition.to}`);
    }

    // Exit current state
    await fromState.exit(this.context);

    // Update current state
    const previousState = this.currentState;
    this.currentState = transition.to;

    console.log(`FSM transition: ${previousState} -> ${this.currentState}`);

    // Enter new state
    await toState.enter(this.context);
  }

  async update(): Promise<void> {
    const currentStateImpl = this.states.get(this.currentState);
    if (!currentStateImpl) {
      throw new Error(`No implementation for state: ${this.currentState}`);
    }

    // Let state process and potentially trigger events
    const event = await currentStateImpl.update(this.context);
    if (event) {
      await this.processEvent(event);
    }
  }

  getCurrentState(): MonitoringState {
    return this.currentState;
  }

  getContext(): MonitoringContext {
    return this.context;
  }

  isActive(): boolean {
    return this.currentState !== MonitoringState.IDLE && this.currentState !== MonitoringState.ERROR;
  }
}

// Base State Implementation
abstract class BaseState implements FSMState {
  abstract readonly name: MonitoringState;

  async enter(context: MonitoringContext): Promise<void> {
    console.log(`Entering state: ${this.name}`);
  }

  abstract update(context: MonitoringContext): Promise<MonitoringEvent | null>;

  async exit(context: MonitoringContext): Promise<void> {
    console.log(`Exiting state: ${this.name}`);
  }

  abstract canTransition(event: MonitoringEvent): boolean;
}

// State Implementations
class IdleState extends BaseState {
  readonly name = MonitoringState.IDLE;

  async update(context: MonitoringContext): Promise<MonitoringEvent | null> {
    // Idle state - no automatic events
    return null;
  }

  canTransition(event: MonitoringEvent): boolean {
    return event === MonitoringEvent.START_MONITORING;
  }
}

class MonitoringActiveState extends BaseState {
  readonly name = MonitoringState.MONITORING;
  private monitoringInterval: NodeJS.Timeout | null = null;

  async enter(context: MonitoringContext): Promise<void> {
    await super.enter(context);
    // Start monitoring cycle
    this.monitoringInterval = setInterval(
      () => this.performMonitoringCycle(context),
      context.config.monitoringInterval
    );
  }

  async update(context: MonitoringContext): Promise<MonitoringEvent | null> {
    // Check if drift detected in current transfer
    if (context.currentTransfer) {
      const metrics = await this.checkCurrentTransfer(context);
      if (this.isDriftCritical(metrics, context.config)) {
        return MonitoringEvent.DRIFT_DETECTED;
      }
    }
    return null;
  }

  async exit(context: MonitoringContext): Promise<void> {
    await super.exit(context);
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  canTransition(event: MonitoringEvent): boolean {
    return [
      MonitoringEvent.STOP_MONITORING,
      MonitoringEvent.DRIFT_DETECTED,
      MonitoringEvent.ERROR_OCCURRED,
      MonitoringEvent.RESET
    ].includes(event);
  }

  private async performMonitoringCycle(context: MonitoringContext): Promise<void> {
    // Monitoring cycle implementation would go here
    // This would check drift history, trends, etc.
  }

  private async checkCurrentTransfer(context: MonitoringContext): Promise<any> {
    // Implementation for checking current transfer
    return { currentDrift: 0 };
  }

  private isDriftCritical(metrics: any, config: any): boolean {
    return metrics.currentDrift >= config.criticalDrift;
  }
}

class AlertGeneratedState extends BaseState {
  readonly name = MonitoringState.ALERT_GENERATED;

  async update(context: MonitoringContext): Promise<MonitoringEvent | null> {
    // Check if recovery is needed based on recent alerts
    const recentCriticalAlerts = context.alerts
      .filter(a => a.level === 'critical')
      .filter(a => Date.now() - a.timestamp < 60000); // Last minute
    
    if (recentCriticalAlerts.length > 0) {
      return MonitoringEvent.RECOVERY_INITIATED;
    }
    return null;
  }

  canTransition(event: MonitoringEvent): boolean {
    return [
      MonitoringEvent.RECOVERY_INITIATED,
      MonitoringEvent.STOP_MONITORING,
      MonitoringEvent.RESET
    ].includes(event);
  }
}

class RecoveryPendingState extends BaseState {
  readonly name = MonitoringState.RECOVERY_PENDING;

  async update(context: MonitoringContext): Promise<MonitoringEvent | null> {
    // Auto-initiate recovery for high-confidence actions
    const highConfidenceActions = context.recoveryActions
      .filter(a => a.confidence > 0.8);
    
    if (highConfidenceActions.length > 0) {
      return MonitoringEvent.RECOVERY_INITIATED;
    }
    return null;
  }

  canTransition(event: MonitoringEvent): boolean {
    return [
      MonitoringEvent.RECOVERY_INITIATED,
      MonitoringEvent.ERROR_OCCURRED,
      MonitoringEvent.RESET
    ].includes(event);
  }
}

class RecoveryExecutingState extends BaseState {
  readonly name = MonitoringState.RECOVERY_EXECUTING;

  async update(context: MonitoringContext): Promise<MonitoringEvent | null> {
    // This state would coordinate with RecoveryExecutor
    // For now, simulate completion
    return MonitoringEvent.RECOVERY_COMPLETED;
  }

  canTransition(event: MonitoringEvent): boolean {
    return [
      MonitoringEvent.RECOVERY_COMPLETED,
      MonitoringEvent.ERROR_OCCURRED
    ].includes(event);
  }
}

class ValidationState extends BaseState {
  readonly name = MonitoringState.VALIDATION;

  async update(context: MonitoringContext): Promise<MonitoringEvent | null> {
    // This state would coordinate with ValidationEngine
    // For now, simulate validation success
    return MonitoringEvent.VALIDATION_PASSED;
  }

  canTransition(event: MonitoringEvent): boolean {
    return [
      MonitoringEvent.VALIDATION_PASSED,
      MonitoringEvent.VALIDATION_FAILED,
      MonitoringEvent.RESET
    ].includes(event);
  }
}

class ErrorState extends BaseState {
  readonly name = MonitoringState.ERROR;

  async enter(context: MonitoringContext): Promise<void> {
    await super.enter(context);
    console.error('Degradation monitor entered error state:', context.error?.message);
  }

  async update(context: MonitoringContext): Promise<MonitoringEvent | null> {
    // Error state requires manual reset
    return null;
  }

  canTransition(event: MonitoringEvent): boolean {
    return event === MonitoringEvent.RESET;
  }
}

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0

// Receipt
// status: OK
// reason_if_blocked: --
// run_id: deg-fsm-001
// inputs: ["FSM design requirements"]
// tools_used: ["MultiEdit"]
// versions: {"model":"sonnet-4","prompt":"fsm-first-development"}
// === END FOOTER ===