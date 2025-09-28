/**
 * RepositoryTransitionHub.ts
 * Centralized state management for all repository operations
 * FSM States: IDLE -> CONNECTING -> QUERYING -> CACHING -> PERSISTING -> CLEANUP -> IDLE
 */

import { EventEmitter } from 'events';

export enum RepositoryState {
  IDLE = 'IDLE',
  CONNECTING = 'CONNECTING',
  QUERYING = 'QUERYING',
  CACHING = 'CACHING',
  PERSISTING = 'PERSISTING',
  CLEANUP = 'CLEANUP',
  ERROR = 'ERROR'
}

export enum RepositoryEvent {
  CONNECT = 'CONNECT',
  QUERY = 'QUERY',
  CACHE = 'CACHE',
  PERSIST = 'PERSIST',
  CLEANUP_START = 'CLEANUP_START',
  SUCCESS = 'SUCCESS',
  FAILURE = 'FAILURE',
  RESET = 'RESET'
}

export interface RepositoryContext {
  connectionId?: string;
  queryId?: string;
  data?: any;
  error?: Error;
  metrics?: {
    startTime: number;
    endTime?: number;
    duration?: number;
    cacheHit?: boolean;
  };
}

export interface StateTransition {
  from: RepositoryState;
  to: RepositoryState;
  event: RepositoryEvent;
  guard?: (context: RepositoryContext) => boolean;
  action?: (context: RepositoryContext) => Promise<void>;
}

/**
 * Centralized repository state machine hub
 * Coordinates all repository operations through FSM
 */
export class RepositoryTransitionHub extends EventEmitter {
  private currentState: RepositoryState = RepositoryState.IDLE;
  private context: RepositoryContext = {};
  private transitions: Map<string, StateTransition> = new Map();
  private stateHistory: Array<{ state: RepositoryState; timestamp: number }> = [];

  constructor() {
    super();
    this.initializeTransitions();
  }

  private initializeTransitions(): void {
    const transitions: StateTransition[] = [
      // Connection transitions
      {
        from: RepositoryState.IDLE,
        to: RepositoryState.CONNECTING,
        event: RepositoryEvent.CONNECT,
        guard: (ctx) => !ctx.connectionId
      },
      {
        from: RepositoryState.CONNECTING,
        to: RepositoryState.QUERYING,
        event: RepositoryEvent.SUCCESS
      },
      {
        from: RepositoryState.CONNECTING,
        to: RepositoryState.ERROR,
        event: RepositoryEvent.FAILURE
      },

      // Query transitions
      {
        from: RepositoryState.QUERYING,
        to: RepositoryState.CACHING,
        event: RepositoryEvent.CACHE,
        guard: (ctx) => !!ctx.data
      },
      {
        from: RepositoryState.QUERYING,
        to: RepositoryState.PERSISTING,
        event: RepositoryEvent.PERSIST,
        guard: (ctx) => !!ctx.data
      },
      {
        from: RepositoryState.QUERYING,
        to: RepositoryState.ERROR,
        event: RepositoryEvent.FAILURE
      },

      // Cache transitions
      {
        from: RepositoryState.CACHING,
        to: RepositoryState.PERSISTING,
        event: RepositoryEvent.PERSIST
      },
      {
        from: RepositoryState.CACHING,
        to: RepositoryState.CLEANUP,
        event: RepositoryEvent.CLEANUP_START
      },

      // Persist transitions
      {
        from: RepositoryState.PERSISTING,
        to: RepositoryState.CLEANUP,
        event: RepositoryEvent.SUCCESS
      },
      {
        from: RepositoryState.PERSISTING,
        to: RepositoryState.ERROR,
        event: RepositoryEvent.FAILURE
      },

      // Cleanup transitions
      {
        from: RepositoryState.CLEANUP,
        to: RepositoryState.IDLE,
        event: RepositoryEvent.SUCCESS
      },
      {
        from: RepositoryState.CLEANUP,
        to: RepositoryState.ERROR,
        event: RepositoryEvent.FAILURE
      },

      // Error recovery
      {
        from: RepositoryState.ERROR,
        to: RepositoryState.IDLE,
        event: RepositoryEvent.RESET
      }
    ];

    transitions.forEach(transition => {
      const key = `${transition.from}-${transition.event}`;
      this.transitions.set(key, transition);
    });
  }

  async transition(event: RepositoryEvent, newContext?: Partial<RepositoryContext>): Promise<boolean> {
    const key = `${this.currentState}-${event}`;
    const transition = this.transitions.get(key);

    if (!transition) {
      this.emit('invalidTransition', {
        from: this.currentState,
        event,
        timestamp: Date.now()
      });
      return false;
    }

    // Update context
    if (newContext) {
      this.context = { ...this.context, ...newContext };
    }

    // Check guard condition
    if (transition.guard && !transition.guard(this.context)) {
      this.emit('guardFailed', {
        from: this.currentState,
        to: transition.to,
        event,
        context: this.context
      });
      return false;
    }

    const previousState = this.currentState;

    try {
      // Execute transition action
      if (transition.action) {
        await transition.action(this.context);
      }

      // Update state
      this.currentState = transition.to;
      this.stateHistory.push({
        state: this.currentState,
        timestamp: Date.now()
      });

      this.emit('stateChanged', {
        from: previousState,
        to: this.currentState,
        event,
        context: this.context
      });

      return true;
    } catch (error) {
      this.emit('transitionError', {
        from: previousState,
        to: transition.to,
        event,
        error,
        context: this.context
      });

      // Auto-transition to error state
      this.currentState = RepositoryState.ERROR;
      this.context.error = error as Error;

      return false;
    }
  }

  getCurrentState(): RepositoryState {
    return this.currentState;
  }

  getContext(): RepositoryContext {
    return { ...this.context };
  }

  getStateHistory(): Array<{ state: RepositoryState; timestamp: number }> {
    return [...this.stateHistory];
  }

  reset(): void {
    this.currentState = RepositoryState.IDLE;
    this.context = {};
    this.stateHistory = [];
    this.emit('reset', { timestamp: Date.now() });
  }

  // Guard helpers
  canConnect(): boolean {
    return this.currentState === RepositoryState.IDLE;
  }

  canQuery(): boolean {
    return this.currentState === RepositoryState.CONNECTING;
  }

  canCache(): boolean {
    return this.currentState === RepositoryState.QUERYING && !!this.context.data;
  }

  canPersist(): boolean {
    return [RepositoryState.QUERYING, RepositoryState.CACHING].includes(this.currentState);
  }

  canCleanup(): boolean {
    return [RepositoryState.CACHING, RepositoryState.PERSISTING].includes(this.currentState);
  }

  isInErrorState(): boolean {
    return this.currentState === RepositoryState.ERROR;
  }

  isIdle(): boolean {
    return this.currentState === RepositoryState.IDLE;
  }
}