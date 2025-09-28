/**
 * Drift Detection Finite State Machine - NASA Rule 10 Compliant
 * Manages state transitions for compliance drift detection workflow
 * Each function <=60 lines
 */

import {
  DriftDetectionState,
  DriftDetectionEvent,
  DriftDetectionTransition,
  DriftDetectionContext
} from '../ComplianceDriftDetector-typed';

import { ComplianceStandard } from '../../types/domains/compliance-types';

export class DriftDetectionFSM {
  private currentState: DriftDetectionState = DriftDetectionState.IDLE;
  private transitions: Map<string, DriftDetectionTransition[]> = new Map();
  private context: DriftDetectionContext = {};

  // NASA Rule 10: <=60 lines
  public async initialize(): Promise<void> {
    this.setupTransitions();
    this.currentState = DriftDetectionState.IDLE;
    console.log('[DriftDetectionFSM] Initialized in IDLE state');
  }

  // NASA Rule 10: <=60 lines
  public async processEvent(event: DriftDetectionEvent, context: DriftDetectionContext): Promise<void> {
    const key = `${this.currentState}_${event}`;
    const possibleTransitions = this.transitions.get(key) || [];

    for (const transition of possibleTransitions) {
      if (this.isTransitionValid(transition, context)) {
        await this.executeTransition(transition, context);
        return;
      }
    }

    console.warn(`[DriftDetectionFSM] No valid transition from ${this.currentState} on ${event}`);
  }

  // NASA Rule 10: <=60 lines
  private setupTransitions(): void {
    this.addTransition({
      fromState: DriftDetectionState.IDLE,
      event: DriftDetectionEvent.START_SCAN,
      toState: DriftDetectionState.SCANNING,
      action: this.startScanning.bind(this)
    });

    this.addTransition({
      fromState: DriftDetectionState.SCANNING,
      event: DriftDetectionEvent.SCAN_COMPLETE,
      toState: DriftDetectionState.ANALYZING,
      action: this.startAnalyzing.bind(this)
    });

    this.addTransition({
      fromState: DriftDetectionState.ANALYZING,
      event: DriftDetectionEvent.DRIFT_DETECTED,
      toState: DriftDetectionState.ALERTING,
      action: this.startAlerting.bind(this)
    });

    this.addTransition({
      fromState: DriftDetectionState.ALERTING,
      event: DriftDetectionEvent.ALERT_SENT,
      toState: DriftDetectionState.REMEDIATING,
      guard: this.shouldRemediate.bind(this),
      action: this.startRemediation.bind(this)
    });

    this.addTransition({
      fromState: DriftDetectionState.ALERTING,
      event: DriftDetectionEvent.ROLLBACK_TRIGGERED,
      toState: DriftDetectionState.ROLLBACK,
      guard: this.shouldRollback.bind(this),
      action: this.startRollback.bind(this)
    });

    this.addErrorTransitions();
    this.addCompletionTransitions();
  }

  // NASA Rule 10: <=60 lines
  private addTransition(transition: DriftDetectionTransition): void {
    const key = `${transition.fromState}_${transition.event}`;
    const existing = this.transitions.get(key) || [];
    existing.push(transition);
    this.transitions.set(key, existing);
  }

  // NASA Rule 10: <=60 lines
  private addErrorTransitions(): void {
    for (const state of Object.values(DriftDetectionState)) {
      if (state !== DriftDetectionState.ERROR) {
        this.addTransition({
          fromState: state,
          event: DriftDetectionEvent.ERROR_OCCURRED,
          toState: DriftDetectionState.ERROR,
          action: this.handleError.bind(this)
        });
      }
    }
  }

  // NASA Rule 10: <=60 lines
  private addCompletionTransitions(): void {
    const completableStates = [
      DriftDetectionState.ANALYZING,
      DriftDetectionState.REMEDIATING,
      DriftDetectionState.ROLLBACK
    ];

    for (const state of completableStates) {
      this.addTransition({
        fromState: state,
        event: DriftDetectionEvent.PROCESS_COMPLETE,
        toState: DriftDetectionState.IDLE,
        action: this.completeProcess.bind(this)
      });
    }
  }

  // NASA Rule 10: <=60 lines
  private isTransitionValid(transition: DriftDetectionTransition, context: DriftDetectionContext): boolean {
    if (transition.guard) {
      return transition.guard({ ...this.context, ...context });
    }
    return true;
  }

  // NASA Rule 10: <=60 lines
  private async executeTransition(transition: DriftDetectionTransition, context: DriftDetectionContext): Promise<void> {
    console.log(`[DriftDetectionFSM] Transition: ${transition.fromState} -> ${transition.toState} (${transition.event})`);

    this.context = { ...this.context, ...context };
    this.currentState = transition.toState;

    if (transition.action) {
      await transition.action(this.context);
    }
  }

  // State action methods - NASA Rule 10: <=60 lines each

  private async startScanning(context: DriftDetectionContext): Promise<void> {
    console.log(`[DriftDetectionFSM] Starting scan for ${context.currentStandard}`);
    // Scanning logic would be delegated to scanner component
  }

  private async startAnalyzing(context: DriftDetectionContext): Promise<void> {
    console.log('[DriftDetectionFSM] Starting drift analysis');
    // Analysis logic would be delegated to analyzer component
  }

  private async startAlerting(context: DriftDetectionContext): Promise<void> {
    console.log('[DriftDetectionFSM] Starting alert process');
    // Alerting logic would be delegated to alert manager
  }

  private async startRemediation(context: DriftDetectionContext): Promise<void> {
    console.log('[DriftDetectionFSM] Starting remediation');
    // Remediation logic would be delegated to remediation manager
  }

  private async startRollback(context: DriftDetectionContext): Promise<void> {
    console.log('[DriftDetectionFSM] Starting rollback');
    // Rollback logic would be delegated to rollback manager
  }

  private async handleError(context: DriftDetectionContext): Promise<void> {
    console.error(`[DriftDetectionFSM] Error in state ${this.currentState}:`, context.error);
    // Error handling logic
  }

  private async completeProcess(context: DriftDetectionContext): Promise<void> {
    console.log(`[DriftDetectionFSM] Process completed from ${this.currentState}`);
    // Completion cleanup logic
  }

  // Guard methods - NASA Rule 10: <=60 lines each

  private shouldRemediate(context: DriftDetectionContext): boolean {
    return context.drift?.metadata?.remediation?.automated === true;
  }

  private shouldRollback(context: DriftDetectionContext): boolean {
    return context.drift?.driftPercentage !== undefined && context.drift.driftPercentage > 0.15;
  }

  // Public accessors

  public getCurrentState(): DriftDetectionState {
    return this.currentState;
  }

  public getContext(): DriftDetectionContext {
    return { ...this.context };
  }

  public async finalize(): Promise<void> {
    console.log('[DriftDetectionFSM] Finalizing FSM');
    this.currentState = DriftDetectionState.IDLE;
    this.context = {};
  }
}

<!-- AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE -->
## Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
|--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
| 1.0.0   | 2025-09-28T09:45:23-04:00 | agent@claude-sonnet-4 | Create FSM component for drift detection state management | DriftDetectionFSM.ts | OK | NASA Rule 10 compliant FSM with <=60 line functions | 0.00 | a7b8c9d |

### Receipt
- status: OK
- reason_if_blocked: --
- run_id: codex-020-fsm-refactor
- inputs: ["ComplianceDriftDetector-typed.ts"]
- tools_used: ["Write"]
- versions: {"model":"claude-sonnet-4","prompt":"fsm-nasa-rule-10"}
<!-- AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE -->