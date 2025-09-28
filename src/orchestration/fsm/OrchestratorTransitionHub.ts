/**
 * Centralized Orchestrator Transition Hub
 * Manages all state transitions for FSM-based orchestrators
 * Enforces guards, executes actions, and maintains state consistency
 */

import { EventEmitter } from 'events';
import {
  OrchestratorState,
  OrchestratorEvent,
  OrchestratorContext,
  StateTransition,
  ORCHESTRATOR_TRANSITIONS
} from './OrchestratorStates';

export interface TransitionResult {
  readonly success: boolean;
  readonly fromState: OrchestratorState;
  readonly toState: OrchestratorState;
  readonly event: OrchestratorEvent;
  readonly timestamp: number;
  readonly error?: string;
}

export interface GuardContext {
  readonly context: OrchestratorContext;
  readonly event: OrchestratorEvent;
  readonly fromState: OrchestratorState;
  readonly toState: OrchestratorState;
}

export class OrchestratorTransitionHub extends EventEmitter {
  private readonly transitions = new Map<string, StateTransition>();
  private readonly currentStates = new Map<string, OrchestratorState>();
  private readonly transitionHistory = new Map<string, TransitionResult[]>();

  constructor() {
    super();
    this.initializeTransitions();
  }

  private initializeTransitions(): void {
    for (const transition of ORCHESTRATOR_TRANSITIONS) {
      const key = this.createTransitionKey(transition.fromState, transition.event);
      this.transitions.set(key, transition);
    }
  }

  private createTransitionKey(state: OrchestratorState, event: OrchestratorEvent): string {
    return `${state}:${event}`;
  }

  public registerOrchestrator(orchestratorId: string, initialState: OrchestratorState = OrchestratorState.IDLE): void {
    this.currentStates.set(orchestratorId, initialState);
    this.transitionHistory.set(orchestratorId, []);
  }

  public async transition(
    orchestratorId: string,
    event: OrchestratorEvent,
    context: OrchestratorContext
  ): Promise<TransitionResult> {
    const currentState = this.currentStates.get(orchestratorId);
    if (!currentState) {
      throw new Error(`Orchestrator ${orchestratorId} not registered`);
    }

    const transitionKey = this.createTransitionKey(currentState, event);
    const transition = this.transitions.get(transitionKey);

    if (!transition) {
      const result: TransitionResult = {
        success: false,
        fromState: currentState,
        toState: currentState,
        event,
        timestamp: Date.now(),
        error: `No transition defined for ${currentState} -> ${event}`
      };
      this.recordTransition(orchestratorId, result);
      return result;
    }

    // Check guard condition
    if (transition.guard && !transition.guard(context)) {
      const result: TransitionResult = {
        success: false,
        fromState: currentState,
        toState: currentState,
        event,
        timestamp: Date.now(),
        error: 'Guard condition failed'
      };
      this.recordTransition(orchestratorId, result);
      return result;
    }

    try {
      // Execute transition action
      if (transition.action) {
        await transition.action(context);
      }

      // Update state
      this.currentStates.set(orchestratorId, transition.toState);

      const result: TransitionResult = {
        success: true,
        fromState: currentState,
        toState: transition.toState,
        event,
        timestamp: Date.now()
      };

      this.recordTransition(orchestratorId, result);
      this.emit('stateChanged', orchestratorId, result);

      return result;
    } catch (error) {
      const result: TransitionResult = {
        success: false,
        fromState: currentState,
        toState: currentState,
        event,
        timestamp: Date.now(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      this.recordTransition(orchestratorId, result);
      return result;
    }
  }

  private recordTransition(orchestratorId: string, result: TransitionResult): void {
    const history = this.transitionHistory.get(orchestratorId) || [];
    history.push(result);

    // Keep only last 100 transitions
    if (history.length > 100) {
      history.shift();
    }

    this.transitionHistory.set(orchestratorId, history);
  }

  public getCurrentState(orchestratorId: string): OrchestratorState | undefined {
    return this.currentStates.get(orchestratorId);
  }

  public getTransitionHistory(orchestratorId: string): readonly TransitionResult[] {
    return this.transitionHistory.get(orchestratorId) || [];
  }

  public getValidTransitions(orchestratorId: string): OrchestratorEvent[] {
    const currentState = this.currentStates.get(orchestratorId);
    if (!currentState) {
      return [];
    }

    const validEvents: OrchestratorEvent[] = [];
    for (const [key, transition] of this.transitions) {
      if (transition.fromState === currentState) {
        validEvents.push(transition.event);
      }
    }

    return validEvents;
  }

  public addCustomTransition(transition: StateTransition): void {
    const key = this.createTransitionKey(transition.fromState, transition.event);
    this.transitions.set(key, transition);
  }

  public removeOrchestrator(orchestratorId: string): void {
    this.currentStates.delete(orchestratorId);
    this.transitionHistory.delete(orchestratorId);
  }

  public getAllStates(): Record<string, OrchestratorState> {
    return Object.fromEntries(this.currentStates);
  }

  public getStateStatistics(): Record<OrchestratorState, number> {
    const stats: Record<OrchestratorState, number> = {
      [OrchestratorState.IDLE]: 0,
      [OrchestratorState.PLANNING]: 0,
      [OrchestratorState.ALLOCATING]: 0,
      [OrchestratorState.EXECUTING]: 0,
      [OrchestratorState.MONITORING]: 0,
      [OrchestratorState.VALIDATING]: 0,
      [OrchestratorState.COMPLETING]: 0,
      [OrchestratorState.ERROR]: 0,
      [OrchestratorState.CANCELLED]: 0
    };

    for (const state of this.currentStates.values()) {
      stats[state]++;
    }

    return stats;
  }
}