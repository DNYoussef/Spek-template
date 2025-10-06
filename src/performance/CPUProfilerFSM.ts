/**
 * CPU Profiler State Machine - Core FSM Controller
 * Manages profiling lifecycle with state-based transitions
 */

import { EventEmitter } from 'events';
import { CPUProfilerStates, CPUProfilerEvents, CPUProfilerContext } from '~types/CPUProfilerTypes';
// TODO(Phase 4): Implement state handler - import { ProfilingStateHandler } from './states/ProfilingStateHandler';
// TODO(Phase 4): Implement state handler - import { AnalysisStateHandler } from './states/AnalysisStateHandler';
// TODO(Phase 4): Implement state handler - import { ReportingStateHandler } from './states/ReportingStateHandler';
// TODO(Phase 4): Implement FSM core - import { ProfilerErrorHandler } from './core/ProfilerErrorHandler';
// TODO(Phase 4): Implement FSM core - import { ProfilerTransitionGuard } from './core/ProfilerTransitionGuard';

export class CPUProfilerFSM extends EventEmitter {
  private currentState: CPUProfilerStates = CPUProfilerStates.IDLE;
  private context: CPUProfilerContext;
  private stateHandlers: Map<CPUProfilerStates, any> = new Map();
  private errorHandler: ProfilerErrorHandler;
  private transitionGuard: ProfilerTransitionGuard;

  constructor(outputDir: string = './cpu-profiles') {
    super();

    this.context = {
      outputDir,
      isProfileActive: false,
      samples: [],
      startTime: 0,
      sampleInterval: null,
      baselineCPU: null,
      v8ProfilePath: null,
      profile: null
    };

    this.initializeStateHandlers();
    this.errorHandler = new ProfilerErrorHandler();
    this.transitionGuard = new ProfilerTransitionGuard();
  }

  /**
   * Initialize state handlers (NASA Rule 10: ≤60 lines)
   */
  private initializeStateHandlers(): void {
    this.stateHandlers.set(CPUProfilerStates.IDLE, null);
    this.stateHandlers.set(CPUProfilerStates.PROFILING, new ProfilingStateHandler());
    this.stateHandlers.set(CPUProfilerStates.ANALYZING, new AnalysisStateHandler());
    this.stateHandlers.set(CPUProfilerStates.REPORTING, new ReportingStateHandler());
    this.stateHandlers.set(CPUProfilerStates.ERROR, this.errorHandler);
  }

  /**
   * Transition to new state (NASA Rule 10: ≤60 lines)
   */
  async transition(event: CPUProfilerEvents, data?: any): Promise<boolean> {
    const targetState = this.getTargetState(this.currentState, event);

    if (!targetState) {
      this.emit('transition:invalid', { from: this.currentState, event });
      return false;
    }

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
   * Get target state for event (NASA Rule 10: ≤60 lines)
   */
  private getTargetState(currentState: CPUProfilerStates, event: CPUProfilerEvents): CPUProfilerStates | null {
    const transitions: Record<CPUProfilerStates, Partial<Record<CPUProfilerEvents, CPUProfilerStates>>> = {
      [CPUProfilerStates.IDLE]: {
        [CPUProfilerEvents.START_PROFILING]: CPUProfilerStates.PROFILING
      },
      [CPUProfilerStates.PROFILING]: {
        [CPUProfilerEvents.STOP_PROFILING]: CPUProfilerStates.ANALYZING,
        [CPUProfilerEvents.ERROR]: CPUProfilerStates.ERROR
      },
      [CPUProfilerStates.ANALYZING]: {
        [CPUProfilerEvents.ANALYSIS_COMPLETE]: CPUProfilerStates.REPORTING,
        [CPUProfilerEvents.ERROR]: CPUProfilerStates.ERROR
      },
      [CPUProfilerStates.REPORTING]: {
        [CPUProfilerEvents.REPORT_COMPLETE]: CPUProfilerStates.IDLE,
        [CPUProfilerEvents.ERROR]: CPUProfilerStates.ERROR
      },
      [CPUProfilerStates.ERROR]: {
        [CPUProfilerEvents.RESET]: CPUProfilerStates.IDLE
      }
    };

    return transitions[currentState]?.[event] || null;
  }

  /**
   * Public API methods
   */
  async startProfiling(intervalMs: number = 100): Promise<void> {
    await this.transition(CPUProfilerEvents.START_PROFILING, { intervalMs });
  }

  async stopProfiling(): Promise<any> {
    await this.transition(CPUProfilerEvents.STOP_PROFILING);
    return this.context.profile;
  }

  /**
   * Get current state
   */
  getCurrentState(): CPUProfilerStates {
    return this.currentState;
  }

  /**
   * Get context data
   */
  getContext(): CPUProfilerContext {
    return { ...this.context };
  }

  // Additional state management methods with proper bounds...
  private async exitState(state: CPUProfilerStates): Promise<void> {
    const handler = this.stateHandlers.get(state);
    if (handler?.exit) {
      await handler.exit(this.context);
    }
  }

  private async enterState(state: CPUProfilerStates, data?: any): Promise<void> {
    const handler = this.stateHandlers.get(state);
    if (handler?.enter) {
      await handler.enter(this.context, data);
    }
  }

  private async handleTransitionError(error: Error, event: CPUProfilerEvents, data?: any): Promise<void> {
    this.context.lastError = error;
    this.currentState = CPUProfilerStates.ERROR;
    await this.enterState(CPUProfilerStates.ERROR, { error, event, data });
  }
}