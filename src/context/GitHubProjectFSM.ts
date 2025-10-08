/**
 * GitHub Project Integration State Machine - Truth Source FSM Controller
 * NASA Rule 10 compliant with connection and validation lifecycle management
 */

import { EventEmitter } from 'events';
import { GitHubProjectState as GitHubProjectStates } from '../github/projects/GitHubProjectStates';
import { GitHubProjectEvent as GitHubProjectEvents } from '../github/projects/GitHubProjectEvents';
// TODO(Phase 4): Create GitHubProjectTypes.ts - import { GitHubProjectContext } from '~types/GitHubProjectTypes';
// TODO(Phase 4): Implement state handler - import { ConnectionStateHandler } from './states/ConnectionStateHandler';
// TODO(Phase 4): Implement state handler - import { ValidationStateHandler } from './states/ValidationStateHandler';
// TODO(Phase 4): Implement state handler - import { SyncStateHandler } from './states/SyncStateHandler';
// TODO(Phase 4): Implement FSM core - import { GitHubErrorHandler } from './core/GitHubErrorHandler';
// TODO(Phase 4): Implement FSM core - import { GitHubTransitionGuard } from './core/GitHubTransitionGuard';

export class GitHubProjectFSM extends EventEmitter {
  private currentState: GitHubProjectStates = GitHubProjectStates.DISCONNECTED;
  private context: GitHubProjectContext;
  private stateHandlers: Map<GitHubProjectStates, any> = new Map();
  private errorHandler: GitHubErrorHandler;
  private transitionGuard: GitHubTransitionGuard;

  constructor(repository?: string, githubToken?: string) {
    super();

    this.context = {
      repository: repository || 'user/spek-template',
      githubToken,
      connectionHealth: {
        connected: false,
        lastSuccessfulCall: new Date(0),
        failureCount: 0,
        averageLatency: 0
      },
      cache: new Map(),
      degradationHistory: [],
      transferRecords: new Map(),
      maxRetries: 3,
      retryDelay: 1000,
      connectionTimeout: 5000,
      cacheTTL: 300000 // 5 minutes
    };

    this.initializeStateHandlers();
    this.errorHandler = new GitHubErrorHandler();
    this.transitionGuard = new GitHubTransitionGuard();
  }

  /**
   * Initialize state handlers (NASA Rule 10: ≤60 lines, 2+ assertions)
   */
  private initializeStateHandlers(): void {
    // Assertion 1: State handlers map exists
    if (!(this.stateHandlers instanceof Map)) {
      throw new Error('State handlers map must be initialized');
    }

    this.stateHandlers.set(GitHubProjectStates.DISCONNECTED, null);
    this.stateHandlers.set(GitHubProjectStates.CONNECTING, new ConnectionStateHandler());
    this.stateHandlers.set(GitHubProjectStates.CONNECTED, null);
    this.stateHandlers.set(GitHubProjectStates.VALIDATING, new ValidationStateHandler());
    this.stateHandlers.set(GitHubProjectStates.SYNCING, new SyncStateHandler());
    this.stateHandlers.set(GitHubProjectStates.ERROR, this.errorHandler);

    // Assertion 2: All required states have handlers or null (idle states)
    const requiredStates = Object.values(GitHubProjectStates);
    for (const state of requiredStates) {
      if (!this.stateHandlers.has(state)) {
        throw new Error(`Missing state handler for ${state}`);
      }
    }
  }

  /**
   * Transition to new state (NASA Rule 10: ≤60 lines, 2+ assertions)
   */
  async transition(event: GitHubProjectEvents, data?: any): Promise<boolean> {
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
  private getTargetState(currentState: GitHubProjectStates, event: GitHubProjectEvents): GitHubProjectStates | null {
    // Assertion 1: Valid current state
    if (!currentState || typeof currentState !== 'string') {
      throw new Error('Invalid current state provided');
    }

    const transitions: Record<GitHubProjectStates, Partial<Record<GitHubProjectEvents, GitHubProjectStates>>> = {
      [GitHubProjectStates.DISCONNECTED]: {
        [GitHubProjectEvents.CONNECT]: GitHubProjectStates.CONNECTING
      },
      [GitHubProjectStates.CONNECTING]: {
        [GitHubProjectEvents.CONNECTION_SUCCESS]: GitHubProjectStates.CONNECTED,
        [GitHubProjectEvents.CONNECTION_FAILED]: GitHubProjectStates.ERROR
      },
      [GitHubProjectStates.CONNECTED]: {
        [GitHubProjectEvents.VALIDATE_TRUTH]: GitHubProjectStates.VALIDATING,
        [GitHubProjectEvents.SYNC_DATA]: GitHubProjectStates.SYNCING,
        [GitHubProjectEvents.DISCONNECT]: GitHubProjectStates.DISCONNECTED
      },
      [GitHubProjectStates.VALIDATING]: {
        [GitHubProjectEvents.VALIDATION_COMPLETE]: GitHubProjectStates.CONNECTED,
        [GitHubProjectEvents.ERROR]: GitHubProjectStates.ERROR
      },
      [GitHubProjectStates.SYNCING]: {
        [GitHubProjectEvents.SYNC_COMPLETE]: GitHubProjectStates.CONNECTED,
        [GitHubProjectEvents.ERROR]: GitHubProjectStates.ERROR
      },
      [GitHubProjectStates.ERROR]: {
        [GitHubProjectEvents.RESET]: GitHubProjectStates.DISCONNECTED,
        [GitHubProjectEvents.RETRY]: GitHubProjectStates.CONNECTING
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
  async connect(): Promise<boolean> {
    return await this.transition(GitHubProjectEvents.CONNECT);
  }

  async validateTruth(contextSnapshot?: any): Promise<any> {
    const success = await this.transition(GitHubProjectEvents.VALIDATE_TRUTH, { contextSnapshot });
    return this.context.lastValidationResult;
  }

  async syncData(): Promise<boolean> {
    return await this.transition(GitHubProjectEvents.SYNC_DATA);
  }

  async disconnect(): Promise<void> {
    await this.transition(GitHubProjectEvents.DISCONNECT);
  }

  getCurrentState(): GitHubProjectStates {
    return this.currentState;
  }

  getContext(): GitHubProjectContext {
    return { ...this.context };
  }

  getConnectionHealth(): any {
    return { ...this.context.connectionHealth };
  }

  // State management helpers
  private async exitState(state: GitHubProjectStates): Promise<void> {
    const handler = this.stateHandlers.get(state);
    if (handler?.exit) {
      await handler.exit(this.context);
    }
  }

  private async enterState(state: GitHubProjectStates, data?: any): Promise<void> {
    const handler = this.stateHandlers.get(state);
    if (handler?.enter) {
      await handler.enter(this.context, data);
    }
  }

  private async handleTransitionError(error: Error, event: GitHubProjectEvents, data?: any): Promise<void> {
    this.context.lastError = error;
    this.currentState = GitHubProjectStates.ERROR;
    await this.enterState(GitHubProjectStates.ERROR, { error, event, data });
  }
}