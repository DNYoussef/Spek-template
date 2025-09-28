/**
 * GitHub FSM Transition Hub
 * Centralized state transition management for all GitHub operations
 * NASA Rule 10 Compliant - max 60 lines per function
 */

import { GitHubFSMState, GitHubFSMEvent, GitHubFSMTransition, GitHubOperationContext } from './GitHubSharedTypes';

export class GitHubTransitionHub {
  private transitions: Map<string, GitHubFSMTransition> = new Map();
  private stateListeners: Map<GitHubFSMState, Array<(context: GitHubOperationContext) => void>> = new Map();

  constructor() {
    this.initializeCommonTransitions();
  }

  /**
   * Initialize common GitHub operation transitions
   */
  private initializeCommonTransitions(): void {
    this.addTransition({
      fromState: GitHubFSMState.IDLE,
      event: GitHubFSMEvent.START,
      toState: GitHubFSMState.AUTHENTICATING
    });

    this.addTransition({
      fromState: GitHubFSMState.AUTHENTICATING,
      event: GitHubFSMEvent.AUTHENTICATE,
      toState: GitHubFSMState.FETCHING
    });

    this.addTransition({
      fromState: GitHubFSMState.FETCHING,
      event: GitHubFSMEvent.FETCH_DATA,
      toState: GitHubFSMState.PROCESSING
    });

    this.addTransition({
      fromState: GitHubFSMState.PROCESSING,
      event: GitHubFSMEvent.PROCESS_DATA,
      toState: GitHubFSMState.SYNCING
    });

    this.addTransition({
      fromState: GitHubFSMState.SYNCING,
      event: GitHubFSMEvent.SYNC_CHANGES,
      toState: GitHubFSMState.VALIDATING
    });

    this.addTransition({
      fromState: GitHubFSMState.VALIDATING,
      event: GitHubFSMEvent.VALIDATE_RESULT,
      toState: GitHubFSMState.COMPLETE
    });

    // Error transitions from any state
    Object.values(GitHubFSMState).forEach(state => {
      if (state !== GitHubFSMState.ERROR) {
        this.addTransition({
          fromState: state,
          event: GitHubFSMEvent.ERROR_OCCURRED,
          toState: GitHubFSMState.ERROR
        });
      }
    });

    // Reset transitions
    this.addTransition({
      fromState: GitHubFSMState.ERROR,
      event: GitHubFSMEvent.RESET,
      toState: GitHubFSMState.IDLE
    });

    this.addTransition({
      fromState: GitHubFSMState.COMPLETE,
      event: GitHubFSMEvent.RESET,
      toState: GitHubFSMState.IDLE
    });
  }

  /**
   * Add a new transition to the hub
   */
  addTransition(transition: GitHubFSMTransition): void {
    const key = `${transition.fromState}:${transition.event}`;
    this.transitions.set(key, transition);
  }

  /**
   * Execute a state transition
   */
  async executeTransition(
    currentState: GitHubFSMState,
    event: GitHubFSMEvent,
    context: GitHubOperationContext
  ): Promise<GitHubFSMState> {
    const key = `${currentState}:${event}`;
    const transition = this.transitions.get(key);

    if (!transition) {
      throw new Error(`No transition defined for ${currentState} + ${event}`);
    }

    // Check guard condition
    if (transition.guard && !transition.guard()) {
      throw new Error(`Transition guard failed for ${currentState} + ${event}`);
    }

    // Execute transition action
    if (transition.action) {
      await transition.action(context);
    }

    // Notify state listeners
    this.notifyStateListeners(transition.toState, context);

    return transition.toState;
  }

  /**
   * Add state change listener
   */
  addStateListener(state: GitHubFSMState, listener: (context: GitHubOperationContext) => void): void {
    if (!this.stateListeners.has(state)) {
      this.stateListeners.set(state, []);
    }
    this.stateListeners.get(state)!.push(listener);
  }

  /**
   * Notify all listeners for a state
   */
  private notifyStateListeners(state: GitHubFSMState, context: GitHubOperationContext): void {
    const listeners = this.stateListeners.get(state);
    if (listeners) {
      listeners.forEach(listener => listener(context));
    }
  }

  /**
   * Check if transition is valid
   */
  isValidTransition(currentState: GitHubFSMState, event: GitHubFSMEvent): boolean {
    const key = `${currentState}:${event}`;
    return this.transitions.has(key);
  }

  /**
   * Get all valid events for current state
   */
  getValidEvents(currentState: GitHubFSMState): GitHubFSMEvent[] {
    const validEvents: GitHubFSMEvent[] = [];

    for (const [key, transition] of this.transitions) {
      if (transition.fromState === currentState) {
        validEvents.push(transition.event);
      }
    }

    return validEvents;
  }
}

/* AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE */
/* Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
|--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
| 1.0.0   | 2025-09-28T10:48:45-04:00 | MEGA-086@Claude-Sonnet-4 | Created centralized GitHub FSM transition hub | GitHubTransitionHub.ts | OK | Shared transition management for all GitHub FSMs | 0.00 | 8c3f9d1 |

Receipt:
- status: OK
- reason_if_blocked: --
- run_id: mega-086-github-transition-hub
- inputs: ["GitHubSharedTypes.ts"]
- tools_used: ["Write"]
- versions: {"model":"claude-sonnet-4","prompt":"github-fsm-hub-v1"}
*/
/* AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE */