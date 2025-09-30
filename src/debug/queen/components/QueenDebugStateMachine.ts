/**
 * Queen Debug State Machine - FSM Implementation
 * Part of QueenDebugOrchestrator decomposition
 * NASA Rule 10 compliant - all functions ≤60 lines, 2+ assertions
 */

import { EventEmitter } from 'events';
import {
  DebugState,
  DebugEvent,
  DebugTarget,
  DebugSession,
  DebugProgress
} from './QueenDebugTypes';

export interface StateTransition {
  fromState: DebugState;
  event: DebugEvent;
  toState: DebugState;
  guard?: (context: DebugSessionContext) => boolean;
  action?: (context: DebugSessionContext) => Promise<void>;
}

export interface DebugSessionContext {
  sessionId: string;
  target: DebugTarget;
  currentState: DebugState;
  progress: DebugProgress;
  startTime: number;
  errors: string[];
  metadata: Record<string, any>;
}

export class QueenDebugStateMachine extends EventEmitter {
  private transitions: Map<string, StateTransition[]> = new Map();
  private currentState: DebugState = DebugState.INITIALIZED;
  private context: DebugSessionContext;
  private session: DebugSession;

  constructor(target: DebugTarget) {
    super();

    // NASA Rule 10: 2+ assertions
    console.assert(target, 'Debug target is required');
    console.assert(target.id, 'Target ID is required');

    this.context = {
      sessionId: `debug-${target.id}-${Date.now()}`,
      target,
      currentState: DebugState.INITIALIZED,
      progress: {
        currentStage: 0,
        totalStages: 9,
        percentage: 0,
        estimatedCompletion: Date.now() + 300000, // 5 minutes estimate
        bottlenecks: []
      },
      startTime: Date.now(),
      errors: [],
      metadata: {}
    };

    this.session = {
      id: this.context.sessionId,
      target,
      startTime: Date.now() as Timestamp,
      status: 'active',
      assignedPrincess: '',
      deployedDrones: [],
      progress: this.context.progress,
      events: []
    };

    this.initializeTransitions();
  }

  /**
   * Initialize valid FSM transitions
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  private initializeTransitions(): void {
    const transitions: StateTransition[] = [
      { fromState: DebugState.INITIALIZED, event: DebugEvent.START_DEBUG, toState: DebugState.TARGET_ANALYSIS },
      { fromState: DebugState.TARGET_ANALYSIS, event: DebugEvent.TARGET_ANALYZED, toState: DebugState.PRINCESS_ASSIGNMENT },
      { fromState: DebugState.TARGET_ANALYSIS, event: DebugEvent.ANALYSIS_FAILED, toState: DebugState.FAILED },
      { fromState: DebugState.PRINCESS_ASSIGNMENT, event: DebugEvent.PRINCESS_ASSIGNED, toState: DebugState.DRONE_DEPLOYMENT },
      { fromState: DebugState.PRINCESS_ASSIGNMENT, event: DebugEvent.ASSIGNMENT_FAILED, toState: DebugState.FAILED },
      { fromState: DebugState.DRONE_DEPLOYMENT, event: DebugEvent.DRONES_DEPLOYED, toState: DebugState.SWARM_EXECUTION },
      { fromState: DebugState.DRONE_DEPLOYMENT, event: DebugEvent.DEPLOYMENT_FAILED, toState: DebugState.FAILED },
      { fromState: DebugState.SWARM_EXECUTION, event: DebugEvent.EXECUTION_COMPLETED, toState: DebugState.AUDIT_PIPELINE },
      { fromState: DebugState.SWARM_EXECUTION, event: DebugEvent.EXECUTION_FAILED, toState: DebugState.FAILED },
      { fromState: DebugState.AUDIT_PIPELINE, event: DebugEvent.AUDIT_PASSED, toState: DebugState.QUALITY_VALIDATION },
      { fromState: DebugState.AUDIT_PIPELINE, event: DebugEvent.AUDIT_FAILED, toState: DebugState.FAILED },
      { fromState: DebugState.QUALITY_VALIDATION, event: DebugEvent.VALIDATION_PASSED, toState: DebugState.EVIDENCE_COLLECTION },
      { fromState: DebugState.QUALITY_VALIDATION, event: DebugEvent.VALIDATION_FAILED, toState: DebugState.FAILED },
      { fromState: DebugState.EVIDENCE_COLLECTION, event: DebugEvent.EVIDENCE_COLLECTED, toState: DebugState.GITHUB_INTEGRATION },
      { fromState: DebugState.EVIDENCE_COLLECTION, event: DebugEvent.COLLECTION_FAILED, toState: DebugState.FAILED },
      { fromState: DebugState.GITHUB_INTEGRATION, event: DebugEvent.GITHUB_INTEGRATED, toState: DebugState.COMPLETED },
      { fromState: DebugState.GITHUB_INTEGRATION, event: DebugEvent.INTEGRATION_FAILED, toState: DebugState.FAILED },
      { fromState: DebugState.FAILED, event: DebugEvent.RETRY_DEBUG, toState: DebugState.INITIALIZED }
    ];

    // Group transitions by state
    transitions.forEach(transition => {
      const key = transition.fromState;
      if (!this.transitions.has(key)) {
        this.transitions.set(key, []);
      }
      this.transitions.get(key)!.push(transition);
    });

    // NASA Rule 10: 2+ assertions
    console.assert(this.transitions.size > 0, 'Transitions must be initialized');
    console.assert(this.transitions.has(DebugState.INITIALIZED), 'Must have initial state transitions');
  }

  /**
   * Process FSM event with validation
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  async processEvent(event: DebugEvent, eventData?: Record<string, any>): Promise<boolean> {
    // NASA Rule 10: 2+ assertions
    console.assert(event, 'Event is required');
    console.assert(Object.values(DebugEvent).includes(event), 'Event must be valid');

    const availableTransitions = this.transitions.get(this.currentState) || [];
    const validTransition = availableTransitions.find(t => t.event === event);

    if (!validTransition) {
      this.context.errors.push(`Invalid transition: ${this.currentState} -> ${event}`);
      return false;
    }

    // Check guard condition if present
    if (validTransition.guard && !validTransition.guard(this.context)) {
      this.context.errors.push(`Guard condition failed for transition: ${this.currentState} -> ${event}`);
      return false;
    }

    // Execute transition action if present
    if (validTransition.action) {
      try {
        await validTransition.action(this.context);
      } catch (error) {
        this.context.errors.push(`Action failed for transition: ${error}`);
        return false;
      }
    }

    // Record transition
    this.recordTransition(validTransition, eventData);

    // Update state
    const previousState = this.currentState;
    this.currentState = validTransition.toState;
    this.context.currentState = this.currentState;

    // Update progress
    this.updateProgress();

    this.emit('stateTransition', {
      from: previousState,
      to: this.currentState,
      event,
      context: this.context,
      session: this.session
    });

    return true;
  }

  /**
   * Record state transition
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  private recordTransition(transition: StateTransition, eventData?: Record<string, any>): void {
    // NASA Rule 10: 2+ assertions
    console.assert(transition, 'Transition is required');
    console.assert(transition.fromState && transition.toState, 'Transition states must be defined');

    const transitionRecord = {
      timestamp: Date.now(),
      from: transition.fromState,
      to: transition.toState,
      event: transition.event,
      data: eventData || {}
    };

    this.session.events.push(transition.event);

    // Update session status based on new state
    if (transition.toState === DebugState.COMPLETED) {
      this.session.status = 'completed';
      this.session.endTime = Date.now();
    } else if (transition.toState === DebugState.FAILED) {
      this.session.status = 'failed';
      this.session.endTime = Date.now();
    } else if (transition.toState === DebugState.CANCELLED) {
      this.session.status = 'cancelled';
      this.session.endTime = Date.now();
    }

    if (eventData) {
      this.context.metadata = { ...this.context.metadata, ...eventData };
    }

    this.emit('transitionRecorded', transitionRecord);
  }

  /**
   * Update progress percentage and stage
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  private updateProgress(): void {
    // NASA Rule 10: 2+ assertions
    console.assert(this.currentState, 'Current state must exist');
    console.assert(this.context.progress, 'Progress object must exist');

    const stageMap: Record<DebugState, number> = {
      [DebugState.INITIALIZED]: 0,
      [DebugState.TARGET_ANALYSIS]: 1,
      [DebugState.PRINCESS_ASSIGNMENT]: 2,
      [DebugState.DRONE_DEPLOYMENT]: 3,
      [DebugState.SWARM_EXECUTION]: 4,
      [DebugState.AUDIT_PIPELINE]: 5,
      [DebugState.QUALITY_VALIDATION]: 6,
      [DebugState.EVIDENCE_COLLECTION]: 7,
      [DebugState.GITHUB_INTEGRATION]: 8,
      [DebugState.COMPLETED]: 9,
      [DebugState.FAILED]: 0,
      [DebugState.CANCELLED]: 0
    };

    const currentStage = stageMap[this.currentState];
    const totalStages = this.context.progress.totalStages;

    this.context.progress.currentStage = currentStage;
    this.context.progress.percentage = (currentStage / totalStages) * 100;

    // Update estimated completion based on progress
    const elapsed = Date.now() - this.context.startTime;
    const progressRatio = this.context.progress.percentage / 100;
    const estimatedTotal = progressRatio > 0 ? elapsed / progressRatio : elapsed * 2;
    this.context.progress.estimatedCompletion = this.context.startTime + estimatedTotal;

    // Update session progress
    this.session.progress = { ...this.context.progress };
  }

  /**
   * Get current state
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  getCurrentState(): DebugState {
    // NASA Rule 10: 2+ assertions
    console.assert(this.currentState, 'Current state must exist');
    console.assert(Object.values(DebugState).includes(this.currentState), 'State must be valid');

    return this.currentState;
  }

  /**
   * Get session context
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  getContext(): DebugSessionContext {
    // NASA Rule 10: 2+ assertions
    console.assert(this.context, 'Context must exist');
    console.assert(this.context.sessionId, 'Context must have session ID');

    return { ...this.context };
  }

  /**
   * Get debug session
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  getSession(): DebugSession {
    // NASA Rule 10: 2+ assertions
    console.assert(this.session, 'Session must exist');
    console.assert(this.session.id, 'Session must have ID');

    return { ...this.session };
  }

  /**
   * Update assigned princess
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  updateAssignedPrincess(princessName: string): void {
    // NASA Rule 10: 2+ assertions
    console.assert(princessName, 'Princess name is required');
    console.assert(princessName.length > 0, 'Princess name must be non-empty');

    this.session.assignedPrincess = princessName;
    this.context.metadata.assignedPrincess = princessName;

    this.emit('princessAssigned', {
      sessionId: this.context.sessionId,
      princess: princessName
    });
  }

  /**
   * Update deployed drones
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  updateDeployedDrones(droneIds: string[]): void {
    // NASA Rule 10: 2+ assertions
    console.assert(droneIds, 'Drone IDs array is required');
    console.assert(Array.isArray(droneIds), 'Drone IDs must be array');

    this.session.deployedDrones = [...droneIds];
    this.context.metadata.deployedDrones = [...droneIds];

    this.emit('dronesDeployed', {
      sessionId: this.context.sessionId,
      droneCount: droneIds.length,
      droneIds
    });
  }

  /**
   * Add bottleneck to progress tracking
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  addBottleneck(bottleneck: string): void {
    // NASA Rule 10: 2+ assertions
    console.assert(bottleneck, 'Bottleneck description is required');
    console.assert(this.context.progress, 'Progress must exist');

    if (!this.context.progress.bottlenecks.includes(bottleneck)) {
      this.context.progress.bottlenecks.push(bottleneck);
      this.session.progress = { ...this.context.progress };

      this.emit('bottleneckDetected', {
        sessionId: this.context.sessionId,
        bottleneck
      });
    }
  }

  /**
   * Check if debug session is complete
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  isComplete(): boolean {
    // NASA Rule 10: 2+ assertions
    console.assert(this.currentState, 'Current state must exist');
    console.assert(this.session, 'Session must exist');

    return this.currentState === DebugState.COMPLETED ||
           this.currentState === DebugState.FAILED ||
           this.currentState === DebugState.CANCELLED;
  }

  /**
   * Check if debug session failed
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  hasFailed(): boolean {
    // NASA Rule 10: 2+ assertions
    console.assert(this.currentState, 'Current state must exist');
    console.assert(this.context.errors, 'Errors array must exist');

    return this.currentState === DebugState.FAILED || this.context.errors.length > 0;
  }

  /**
   * Get available events for current state
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  getAvailableEvents(): DebugEvent[] {
    // NASA Rule 10: 2+ assertions
    console.assert(this.currentState, 'Current state required');
    console.assert(this.transitions.has(this.currentState), 'State must have transitions');

    const transitions = this.transitions.get(this.currentState) || [];
    return transitions.map(t => t.event);
  }

  /**
   * Cancel debug session
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  async cancel(): Promise<boolean> {
    // NASA Rule 10: 2+ assertions
    console.assert(this.currentState !== DebugState.COMPLETED, 'Cannot cancel completed session');
    console.assert(this.currentState !== DebugState.FAILED, 'Cannot cancel failed session');

    try {
      await this.processEvent(DebugEvent.CANCEL_DEBUG);
      this.emit('debugCancelled', {
        sessionId: this.context.sessionId,
        reason: 'User requested cancellation'
      });
      return true;
    } catch (error) {
      this.context.errors.push(`Cancellation failed: ${error}`);
      return false;
    }
  }
}