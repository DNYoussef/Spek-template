/**
 * Semantic Drift Detector State Machine - FSM Controller
 * NASA Rule 10 compliant with semantic drift detection lifecycle management
 */

import { EventEmitter } from 'events';
import { DriftStates, DriftEvents, DriftContext } from '~types/SemanticDriftTypes';
import { CapturingStateHandler } from './states/CapturingStateHandler';
import { AnalyzingStateHandler } from './states/AnalyzingStateHandler';
import { AdaptingStateHandler } from './states/AdaptingStateHandler';
import { ReportingStateHandler } from './states/ReportingStateHandler';
import { DriftErrorHandler } from './core/DriftErrorHandler';
import { DriftTransitionGuard } from './core/DriftTransitionGuard';

export class SemanticDriftFSM extends EventEmitter {
  private currentState: DriftStates = DriftStates.IDLE;
  private context: DriftContext;
  private stateHandlers: Map<DriftStates, any> = new Map();
  private errorHandler: DriftErrorHandler;
  private transitionGuard: DriftTransitionGuard;

  // Constants (NASA Rule 10: Fixed bounds)
  private readonly MAX_SNAPSHOTS = 100;
  private readonly ANALYSIS_WINDOW = 10;
  private readonly UPDATE_INTERVAL = 5000;

  constructor() {
    super();

    this.context = {
      snapshots: [],
      tfidf: null, // Will be initialized in state handler
      adaptiveThresholds: new Map(),
      driftPatterns: [],
      maxSnapshots: this.MAX_SNAPSHOTS,
      analysisWindow: this.ANALYSIS_WINDOW,
      updateInterval: this.UPDATE_INTERVAL,
      currentSnapshot: null,
      lastAnalysisResult: null
    };

    this.initializeStateHandlers();
    this.errorHandler = new DriftErrorHandler();
    this.transitionGuard = new DriftTransitionGuard();
  }

  /**
   * Initialize state handlers (NASA Rule 10: ≤60 lines, 2+ assertions)
   */
  private initializeStateHandlers(): void {
    // Assertion 1: State handlers map exists
    if (!(this.stateHandlers instanceof Map)) {
      throw new Error('State handlers map must be initialized');
    }

    this.stateHandlers.set(DriftStates.IDLE, null);
    this.stateHandlers.set(DriftStates.CAPTURING, new CapturingStateHandler());
    this.stateHandlers.set(DriftStates.ANALYZING, new AnalyzingStateHandler());
    this.stateHandlers.set(DriftStates.ADAPTING, new AdaptingStateHandler());
    this.stateHandlers.set(DriftStates.REPORTING, new ReportingStateHandler());
    this.stateHandlers.set(DriftStates.ERROR, this.errorHandler);

    // Assertion 2: All required states have handlers or null (idle states)
    const requiredStates = Object.values(DriftStates);
    for (const state of requiredStates) {
      if (!this.stateHandlers.has(state)) {
        throw new Error(`Missing state handler for ${state}`);
      }
    }
  }

  /**
   * Transition to new state (NASA Rule 10: ≤60 lines, 2+ assertions)
   */
  async transition(event: DriftEvents, data?: any): Promise<boolean> {
    // Assertion 1: Valid event provided
    if (!event || typeof event !== 'string') {
      throw new Error('Invalid event provided for transition');
    }

    const targetState = this.getTargetState(this.currentState, event);

    if (!targetState) {
      this.emit('transition:invalid', { from: this.currentState, event });
      return false;
    }

    // Assertion 2: Transition guard allows transition
    if (!this.transitionGuard.canTransition(this.currentState, targetState, this.context)) {
      this.emit('transition:blocked', { from: this.currentState, to: targetState, event });
      return false;
    }

    try {
      // Exit current state
      await this.exitState(this.currentState);

      // Transition
      const previousState = this.currentState;
      this.currentState = targetState;

      // Enter new state
      await this.enterState(targetState, data);

      this.emit('transition:completed', { from: previousState, to: targetState, event });
      return true;

    } catch (error) {
      await this.handleTransitionError(error, event, data);
      return false;
    }
  }

  /**
   * Get target state for event (NASA Rule 10: ≤60 lines, 2+ assertions)
   */
  private getTargetState(currentState: DriftStates, event: DriftEvents): DriftStates | null {
    // Assertion 1: Valid current state
    if (!currentState || typeof currentState !== 'string') {
      throw new Error('Invalid current state provided');
    }

    const transitions: Record<DriftStates, Partial<Record<DriftEvents, DriftStates>>> = {
      [DriftStates.IDLE]: {
        [DriftEvents.CAPTURE_SNAPSHOT]: DriftStates.CAPTURING,
        [DriftEvents.ANALYZE_DRIFT]: DriftStates.ANALYZING
      },
      [DriftStates.CAPTURING]: {
        [DriftEvents.SNAPSHOT_CAPTURED]: DriftStates.ANALYZING,
        [DriftEvents.ERROR]: DriftStates.ERROR
      },
      [DriftStates.ANALYZING]: {
        [DriftEvents.ANALYSIS_COMPLETE]: DriftStates.ADAPTING,
        [DriftEvents.REPORT_DRIFT]: DriftStates.REPORTING,
        [DriftEvents.ERROR]: DriftStates.ERROR
      },
      [DriftStates.ADAPTING]: {
        [DriftEvents.ADAPTATION_COMPLETE]: DriftStates.IDLE,
        [DriftEvents.ERROR]: DriftStates.ERROR
      },
      [DriftStates.REPORTING]: {
        [DriftEvents.REPORT_GENERATED]: DriftStates.IDLE,
        [DriftEvents.ERROR]: DriftStates.ERROR
      },
      [DriftStates.ERROR]: {
        [DriftEvents.RESET]: DriftStates.IDLE,
        [DriftEvents.RETRY]: DriftStates.CAPTURING
      }
    };

    // Assertion 2: Transitions exist for current state
    const stateTransitions = transitions[currentState];
    if (!stateTransitions) {
      return null;
    }

    return stateTransitions[event] || null;
  }

  /**
   * Public API methods
   */
  async captureSnapshot(context: any, domain: string): Promise<any> {
    const success = await this.transition(DriftEvents.CAPTURE_SNAPSHOT, { context, domain });
    return this.context.currentSnapshot;
  }

  async detectDrift(): Promise<any> {
    const success = await this.transition(DriftEvents.ANALYZE_DRIFT);
    return this.context.lastAnalysisResult;
  }

  getThreshold(metric: string): any {
    const threshold = this.context.adaptiveThresholds.get(metric);
    return threshold || {
      metric,
      baseline: 0.5,
      current: 0.5,
      adaptation: 0,
      confidence: 0.5,
      lastUpdate: Date.now()
    };
  }

  getStatus(): any {
    return {
      snapshots: this.context.snapshots.length,
      maxSnapshots: this.context.maxSnapshots,
      analysisWindow: this.context.analysisWindow,
      thresholds: Object.fromEntries(this.context.adaptiveThresholds),
      recentPatterns: this.context.driftPatterns.slice(-5),
      lastAnalysis: this.context.snapshots.length > 0 ?
        this.context.snapshots[this.context.snapshots.length - 1].timestamp : null
    };
  }

  clear(): void {
    this.context.snapshots = [];
    this.context.driftPatterns = [];
    this.context.adaptiveThresholds.clear();
    this.context.currentSnapshot = null;
    this.context.lastAnalysisResult = null;
  }

  getCurrentState(): DriftStates {
    return this.currentState;
  }

  getContext(): DriftContext {
    return { ...this.context };
  }

  // State management helpers
  private async exitState(state: DriftStates): Promise<void> {
    const handler = this.stateHandlers.get(state);
    if (handler?.exit) {
      await handler.exit(this.context);
    }
  }

  private async enterState(state: DriftStates, data?: any): Promise<void> {
    const handler = this.stateHandlers.get(state);
    if (handler?.enter) {
      await handler.enter(this.context, data);
    }
  }

  private async handleTransitionError(error: Error, event: DriftEvents, data?: any): Promise<void> {
    this.context.lastError = error;
    this.currentState = DriftStates.ERROR;
    await this.enterState(DriftStates.ERROR, { error, event, data });
  }
}