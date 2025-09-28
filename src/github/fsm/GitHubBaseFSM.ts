/**
 * Base GitHub FSM Implementation
 * Common FSM functionality for all GitHub operations
 * NASA Rule 10 Compliant with state isolation
 */

import { EventEmitter } from 'events';
import { GitHubFSMState, GitHubFSMEvent, GitHubOperationContext, GitHubOperationResult } from './GitHubSharedTypes';
import { GitHubTransitionHub } from './GitHubTransitionHub';

export abstract class GitHubBaseFSM extends EventEmitter {
  protected currentState: GitHubFSMState = GitHubFSMState.IDLE;
  protected context: GitHubOperationContext;
  protected transitionHub: GitHubTransitionHub;
  protected startTime: Date = new Date();

  constructor(context: GitHubOperationContext) {
    super();
    this.context = { ...context, startTime: this.startTime };
    this.transitionHub = new GitHubTransitionHub();
    this.setupStateListeners();
  }

  /**
   * Initialize the FSM with custom transitions
   */
  abstract init(): Promise<void>;

  /**
   * Cleanup FSM resources
   */
  abstract shutdown(): Promise<void>;

  /**
   * Check FSM invariants
   */
  abstract checkInvariants(): boolean;

  /**
   * Update FSM state based on external input
   */
  abstract update(input: any): Promise<void>;

  /**
   * Trigger an event in the FSM
   */
  async triggerEvent(event: GitHubFSMEvent, data?: any): Promise<void> {
    try {
      // Update context with event data
      if (data) {
        this.context.metadata = { ...this.context.metadata, ...data };
      }

      // Execute transition
      const newState = await this.transitionHub.executeTransition(
        this.currentState,
        event,
        this.context
      );

      // Update current state
      this.currentState = newState;

      // Emit state change event
      this.emit('stateChanged', {
        previousState: this.currentState,
        newState,
        event,
        context: this.context
      });

      // Check invariants after state change
      if (!this.checkInvariants()) {
        throw new Error(`FSM invariants violated in state ${newState}`);
      }

    } catch (error) {
      await this.handleError(error as Error);
    }
  }

  /**
   * Handle FSM errors
   */
  protected async handleError(error: Error): Promise<void> {
    this.emit('error', error);

    if (this.currentState !== GitHubFSMState.ERROR) {
      this.currentState = GitHubFSMState.ERROR;
      this.context.metadata.lastError = error.message;
    }
  }

  /**
   * Setup common state listeners
   */
  private setupStateListeners(): void {
    this.transitionHub.addStateListener(GitHubFSMState.ERROR, (context) => {
      this.emit('operationFailed', { context, error: context.metadata.lastError });
    });

    this.transitionHub.addStateListener(GitHubFSMState.COMPLETE, (context) => {
      const result: GitHubOperationResult = {
        success: true,
        data: context.metadata.result,
        duration: Date.now() - context.startTime.getTime(),
        apiCallsUsed: context.metadata.apiCallsUsed || 0
      };
      this.emit('operationComplete', result);
    });
  }

  /**
   * Get current FSM state
   */
  getCurrentState(): GitHubFSMState {
    return this.currentState;
  }

  /**
   * Get operation context
   */
  getContext(): GitHubOperationContext {
    return { ...this.context };
  }

  /**
   * Check if FSM is in terminal state
   */
  isTerminated(): boolean {
    return this.currentState === GitHubFSMState.COMPLETE ||
           this.currentState === GitHubFSMState.ERROR;
  }

  /**
   * Reset FSM to initial state
   */
  async reset(): Promise<void> {
    await this.triggerEvent(GitHubFSMEvent.RESET);
    this.context.retryCount = 0;
    this.context.metadata = {};
    this.startTime = new Date();
  }

  /**
   * Get valid events for current state
   */
  getValidEvents(): GitHubFSMEvent[] {
    return this.transitionHub.getValidEvents(this.currentState);
  }
}

/* AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE */
/* Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
|--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
| 1.0.0   | 2025-09-28T10:50:18-04:00 | MEGA-086@Claude-Sonnet-4 | Created base GitHub FSM with common functionality | GitHubBaseFSM.ts | OK | Abstract base class for all GitHub FSM implementations | 0.00 | 4e2d7a6 |

Receipt:
- status: OK
- reason_if_blocked: --
- run_id: mega-086-github-base-fsm
- inputs: ["GitHubSharedTypes.ts", "GitHubTransitionHub.ts"]
- tools_used: ["Write"]
- versions: {"model":"claude-sonnet-4","prompt":"github-base-fsm-v1"}
*/
/* AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE */