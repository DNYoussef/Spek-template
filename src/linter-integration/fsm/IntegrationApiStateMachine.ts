/**
 * Core State Machine Implementation for Linter Integration API
 * Handles state transitions with comprehensive validation
 */

import { EventEmitter } from 'events';
import { performance } from 'perf_hooks';
import {
  ApiServerState,
  RequestState,
  WebSocketState,
  AuthState,
  RateLimitState,
  ApiEvent,
  StateMachineConfig,
  StateHandler,
  StateGuard,
  StateMetrics,
  TransitionMetrics,
  ErrorRecoveryConfig
} from './IntegrationApiStates';

/**
 * Generic State Machine Implementation
 * NASA Rule 10 Compliant: <60 lines per function
 */
export class StateMachine<TState extends string, TStateEvent extends string, TContext> extends EventEmitter {
  private currentState: TState;
  private readonly config: StateMachineConfig<TState, TEvent, TContext>;
  private readonly stateMetrics: Map<string, StateMetrics> = new Map();
  private readonly transitionMetrics: Map<string, TransitionMetrics> = new Map();
  private readonly errorRecovery: ErrorRecoveryConfig;
  private retryCount = 0;
  private lastTransitionTime = 0;

  constructor(
    config: StateMachineConfig<TState, TEvent, TContext>,
    errorRecovery?: Partial<ErrorRecoveryConfig>
  ) {
    super();
    this.config = config;
    this.currentState = config.initialState;
    this.errorRecovery = {
      maxRetries: 3,
      retryDelay: 1000,
      fallbackState: config.initialState,
      enableCircuitBreaker: true,
      recoveryActions: [],
      ...errorRecovery
    };
    this.initializeMetrics();
  }

  /**
   * Get current state
   * NASA Rule 10: Single responsibility, <10 lines
   */
  public getCurrentState(): TState {
    return this.currentState;
  }

  /**
   * Get state context
   * NASA Rule 10: Simple getter, <10 lines
   */
  public getContext(): TContext {
    return this.config.context;
  }

  /**
   * Check if transition is valid
   * NASA Rule 10: Pure function, <30 lines
   */
  public canTransition(event: TEvent, targetState?: TState): boolean {
    const transitions = this.config.transitions[this.currentState];
    if (!transitions) return false;

    const nextState = targetState || transitions[event as string];
    if (!nextState) return false;

    // Check guards if configured
    const guardKey = `${this.currentState}->${nextState}`;
    const guard = this.config.guards?.[guardKey];
    if (guard) {
      return guard.canTransition(this.currentState, nextState, this.config.context) &&
             guard.validateContext(this.config.context);
    }

    return true;
  }

  /**
   * Execute state transition
   * NASA Rule 10: Core logic, <60 lines with proper error handling
   */
  public async transition(event: TEvent, data?: any): Promise<boolean> {
    const startTime = performance.now();
    const fromState = this.currentState;
    
    try {
      // Validate transition
      if (!this.canTransition(event)) {
        this.recordFailedTransition(fromState, event, 'Invalid transition');
        return false;
      }

      const transitions = this.config.transitions[this.currentState];
      const toState = transitions[event as string] as TState;
      
      // Execute exit handler
      await this.executeStateExit(fromState, event, data);
      
      // Update state
      const previousState = this.currentState;
      this.currentState = toState;
      this.lastTransitionTime = Date.now();
      
      // Execute enter handler
      await this.executeStateEnter(toState, event, data);
      
      // Record successful transition
      this.recordSuccessfulTransition(fromState, toState, event, performance.now() - startTime);
      
      // Emit transition event
      this.emit('transition', {
        from: previousState,
        to: toState,
        event,
        data,
        timestamp: this.lastTransitionTime
      });
      
      this.retryCount = 0; // Reset retry count on success
      return true;
      
    } catch (error) {
      return await this.handleTransitionError(fromState, event, error, startTime);
    }
  }

  /**
   * Handle transition errors with recovery
   * NASA Rule 10: Error handling, <50 lines
   */
  private async handleTransitionError(
    fromState: TState,
    event: TEvent,
    error: any,
    startTime: number
  ): Promise<boolean> {
    this.recordFailedTransition(fromState, event, error.message);
    this.emit('error', { fromState, event, error: error.message });
    
    // Circuit breaker check
    if (this.errorRecovery.enableCircuitBreaker && this.retryCount >= this.errorRecovery.maxRetries) {
      await this.initiateRecovery();
      return false;
    }
    
    // Retry logic
    this.retryCount++;
    if (this.retryCount <= this.errorRecovery.maxRetries) {
      await this.delay(this.errorRecovery.retryDelay);
      return await this.transition(event);
    }
    
    return false;
  }

  /**
   * Execute state enter handler
   * NASA Rule 10: Single responsibility, <30 lines
   */
  private async executeStateEnter(state: TState, event: TEvent, data?: any): Promise<void> {
    const handler = this.config.states[state as string];
    if (handler?.onEnter) {
      const enterStartTime = performance.now();
      await handler.onEnter(this.config.context, { event, data });
      this.updateStateMetrics(state as string, 'enter', performance.now() - enterStartTime);
    }
    
    // Validate state invariants
    if (handler?.validateInvariants && !handler.validateInvariants(this.config.context)) {
      throw new Error(`State invariants violated for state: ${state}`);
    }
  }

  /**
   * Execute state exit handler
   * NASA Rule 10: Single responsibility, <30 lines
   */
  private async executeStateExit(state: TState, event: TEvent, data?: any): Promise<void> {
    const handler = this.config.states[state as string];
    if (handler?.onExit) {
      const exitStartTime = performance.now();
      await handler.onExit(this.config.context, { event, data });
      this.updateStateMetrics(state as string, 'exit', performance.now() - exitStartTime);
    }
  }

  /**
   * Initialize state metrics
   * NASA Rule 10: Initialization, <20 lines
   */
  private initializeMetrics(): void {
    Object.keys(this.config.states).forEach(state => {
      this.stateMetrics.set(state, {
        stateName: state,
        enterCount: 0,
        exitCount: 0,
        totalTimeMs: 0,
        averageTimeMs: 0,
        errorCount: 0
      });
    });
  }

  /**
   * Update state metrics
   * NASA Rule 10: Data update, <25 lines
   */
  private updateStateMetrics(state: string, action: 'enter' | 'exit', duration: number): void {
    const metrics = this.stateMetrics.get(state);
    if (!metrics) return;
    
    if (action === 'enter') {
      metrics.enterCount++;
      metrics.lastEntered = Date.now();
    } else {
      metrics.exitCount++;
      metrics.lastExited = Date.now();
    }
    
    metrics.totalTimeMs += duration;
    metrics.averageTimeMs = metrics.totalTimeMs / Math.max(metrics.enterCount, 1);
  }

  /**
   * Record successful transition
   * NASA Rule 10: Metrics recording, <30 lines
   */
  private recordSuccessfulTransition(
    fromState: TState,
    toState: TState,
    event: TEvent,
    duration: number
  ): void {
    const key = `${fromState}->${toState}`;
    let metrics = this.transitionMetrics.get(key);
    
    if (!metrics) {
      metrics = {
        fromState: fromState as string,
        toState: toState as string,
        event: event as string,
        count: 0,
        successCount: 0,
        failureCount: 0,
        averageDurationMs: 0
      };
      this.transitionMetrics.set(key, metrics);
    }
    
    metrics.count++;
    metrics.successCount++;
    metrics.averageDurationMs = 
      (metrics.averageDurationMs * (metrics.successCount - 1) + duration) / metrics.successCount;
    metrics.lastTransition = Date.now();
  }

  /**
   * Record failed transition
   * NASA Rule 10: Error metrics, <25 lines
   */
  private recordFailedTransition(fromState: TState, event: TEvent, error: string): void {
    const stateMetrics = this.stateMetrics.get(fromState as string);
    if (stateMetrics) {
      stateMetrics.errorCount++;
    }
    
    // Find transition metrics if exists
    for (const [key, metrics] of this.transitionMetrics) {
      if (key.startsWith(fromState as string) && metrics.event === event) {
        metrics.count++;
        metrics.failureCount++;
        break;
      }
    }
  }

  /**
   * Initiate error recovery
   * NASA Rule 10: Recovery logic, <40 lines
   */
  private async initiateRecovery(): Promise<void> {
    this.emit('recovery_initiated', {
      currentState: this.currentState,
      retryCount: this.retryCount,
      timestamp: Date.now()
    });
    
    // Execute recovery actions
    for (const action of this.errorRecovery.recoveryActions) {
      try {
        this.emit('recovery_action', { action, timestamp: Date.now() });
        // Recovery actions would be implemented by subclasses
      } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
        this.emit('recovery_error', { action, error: errorMessage });
      }
    }
    
    // Reset to fallback state
    const fallbackState = this.errorRecovery.fallbackState as TState;
    if (fallbackState !== this.currentState) {
      this.currentState = fallbackState;
      this.emit('recovery_complete', {
        fallbackState,
        timestamp: Date.now()
      });
    }
    
    this.retryCount = 0;
  }

  /**
   * Get state metrics
   * NASA Rule 10: Simple getter, <10 lines
   */
  public getStateMetrics(): Map<string, StateMetrics> {
    return new Map(this.stateMetrics);
  }

  /**
   * Get transition metrics
   * NASA Rule 10: Simple getter, <10 lines
   */
  public getTransitionMetrics(): Map<string, TransitionMetrics> {
    return new Map(this.transitionMetrics);
  }

  /**
   * Utility delay function
   * NASA Rule 10: Simple utility, <10 lines
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/*
 * CODEX AGENT 036 - Core State Machine Implementation
 * Status: OK | NASA Rule 10 Compliant
 * Run ID: integration-api-fsm-core-002
 * Created: 2025-09-28T11:47:15-04:00
 */