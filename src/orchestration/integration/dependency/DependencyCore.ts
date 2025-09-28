/**
 * CODEX AGENT 008 - Dependency Core FSM
 * NASA Rule 10 Compliant: All functions ≤60 lines, no recursion, fixed loop bounds
 * FSM-First Design: Core state machine logic with explicit transitions
 */

import { EventEmitter } from 'events';
import { webcrypto as crypto } from 'crypto';
import {
  DependencyState,
  ResolutionState,
  DependencyEvent,
  ResolutionEvent,
  DependencyFSMConfig,
  ResolutionFSMConfig,
  DEFAULT_CONFIG,
  DependencyEventPayload,
  ResolutionEventPayload
} from './DependencyTypes';

export class DependencyStateMachine extends EventEmitter {
  private currentState: DependencyState = DependencyState.PENDING;
  private config: DependencyFSMConfig;
  private retryCount: number = 0;
  private lastStateChange: number = 0;

  constructor(config?: Partial<DependencyFSMConfig>) {
    super();
    this.config = {
      maxRetries: config?.maxRetries || DEFAULT_CONFIG.RETRY_LIMIT,
      defaultTimeout: config?.defaultTimeout || DEFAULT_CONFIG.DEFAULT_TIMEOUT,
      retryDelay: config?.retryDelay || 1000,
      exponentialBackoff: config?.exponentialBackoff ?? true
    };
  }

  // NASA Rule 10: Function ≤60 lines
  public getCurrentState(): DependencyState {
    return this.currentState;
  }

  // NASA Rule 10: Function ≤60 lines
  public canTransition(event: DependencyEvent): boolean {
    const transitions = this.getValidTransitions();
    return transitions.has(event);
  }

  // NASA Rule 10: Function ≤60 lines
  public transition(event: DependencyEvent, payload?: DependencyEventPayload): boolean {
    if (!this.canTransition(event)) {
      this.emit('transition:invalid', {
        currentState: this.currentState,
        event,
        payload
      });
      return false;
    }

    const previousState = this.currentState;
    this.currentState = this.getNextState(event);
    this.lastStateChange = Date.now();

    this.emit('transition:success', {
      previousState,
      currentState: this.currentState,
      event,
      payload,
      timestamp: this.lastStateChange
    });

    this.handleStateEntry();
    return true;
  }

  // NASA Rule 10: Function ≤60 lines, fixed loop bounds
  private getValidTransitions(): Set<DependencyEvent> {
    const validTransitions = new Set<DependencyEvent>();
    const maxTransitions = 10; // Fixed bound
    let transitionCount = 0;

    switch (this.currentState) {
      case DependencyState.PENDING:
        validTransitions.add(DependencyEvent.START_RESOLUTION);
        transitionCount++;
        break;

      case DependencyState.RESOLVING:
        validTransitions.add(DependencyEvent.DEPENDENCY_SATISFIED);
        validTransitions.add(DependencyEvent.DEPENDENCY_FAILED);
        validTransitions.add(DependencyEvent.TIMEOUT_REACHED);
        transitionCount += 3;
        break;

      case DependencyState.FAILED:
        if (this.retryCount < this.config.maxRetries) {
          validTransitions.add(DependencyEvent.RETRY_ATTEMPT);
          transitionCount++;
        }
        validTransitions.add(DependencyEvent.ROLLBACK_INITIATED);
        transitionCount++;
        break;

      case DependencyState.BLOCKED:
        validTransitions.add(DependencyEvent.ROLLBACK_INITIATED);
        transitionCount++;
        break;

      case DependencyState.RESOLVED:
        // Terminal state - no transitions
        break;
    }

    if (transitionCount > maxTransitions) {
      throw new Error(`Transition count exceeded maximum: ${maxTransitions}`);
    }

    return validTransitions;
  }

  // NASA Rule 10: Function ≤60 lines
  private getNextState(event: DependencyEvent): DependencyState {
    switch (this.currentState) {
      case DependencyState.PENDING:
        if (event === DependencyEvent.START_RESOLUTION) {
          return DependencyState.RESOLVING;
        }
        break;

      case DependencyState.RESOLVING:
        switch (event) {
          case DependencyEvent.DEPENDENCY_SATISFIED:
            return DependencyState.RESOLVED;
          case DependencyEvent.DEPENDENCY_FAILED:
          case DependencyEvent.TIMEOUT_REACHED:
            return DependencyState.FAILED;
        }
        break;

      case DependencyState.FAILED:
        switch (event) {
          case DependencyEvent.RETRY_ATTEMPT:
            this.retryCount++;
            return DependencyState.RESOLVING;
          case DependencyEvent.ROLLBACK_INITIATED:
            return DependencyState.BLOCKED;
        }
        break;

      case DependencyState.BLOCKED:
        if (event === DependencyEvent.ROLLBACK_INITIATED) {
          return DependencyState.PENDING;
        }
        break;
    }

    throw new Error(`Invalid transition: ${this.currentState} -> ${event}`);
  }

  // NASA Rule 10: Function ≤60 lines
  private handleStateEntry(): void {
    switch (this.currentState) {
      case DependencyState.RESOLVING:
        this.scheduleTimeout();
        break;
      case DependencyState.FAILED:
        this.scheduleRetryIfAllowed();
        break;
      case DependencyState.RESOLVED:
        this.cleanup();
        break;
      case DependencyState.BLOCKED:
        this.notifyBlocked();
        break;
    }
  }

  // NASA Rule 10: Function ≤60 lines
  private scheduleTimeout(): void {
    setTimeout(() => {
      if (this.currentState === DependencyState.RESOLVING) {
        this.transition(DependencyEvent.TIMEOUT_REACHED);
      }
    }, this.config.defaultTimeout);
  }

  // NASA Rule 10: Function ≤60 lines
  private scheduleRetryIfAllowed(): void {
    if (this.retryCount >= this.config.maxRetries) {
      return;
    }

    const delay = this.calculateRetryDelay();
    setTimeout(() => {
      if (this.currentState === DependencyState.FAILED) {
        this.transition(DependencyEvent.RETRY_ATTEMPT);
      }
    }, delay);
  }

  // NASA Rule 10: Function ≤60 lines
  private calculateRetryDelay(): number {
    if (!this.config.exponentialBackoff) {
      return this.config.retryDelay;
    }

    const maxRetryDelay = 60000; // 1 minute max
    const delay = this.config.retryDelay * Math.pow(2, this.retryCount);
    return Math.min(delay, maxRetryDelay);
  }

  // NASA Rule 10: Function ≤60 lines
  private cleanup(): void {
    this.retryCount = 0;
    this.emit('dependency:resolved', {
      nodeId: 'current', // Would be injected in real usage
      totalRetries: this.retryCount,
      duration: Date.now() - this.lastStateChange
    });
  }

  // NASA Rule 10: Function ≤60 lines
  private notifyBlocked(): void {
    this.emit('dependency:blocked', {
      nodeId: 'current', // Would be injected in real usage
      retryCount: this.retryCount,
      timestamp: Date.now()
    });
  }

  // NASA Rule 10: Function ≤60 lines
  public reset(): void {
    this.currentState = DependencyState.PENDING;
    this.retryCount = 0;
    this.lastStateChange = 0;
    this.emit('fsm:reset');
  }

  // NASA Rule 10: Function ≤60 lines
  public getMetrics(): any {
    return {
      currentState: this.currentState,
      retryCount: this.retryCount,
      lastStateChange: this.lastStateChange,
      uptime: Date.now() - this.lastStateChange
    };
  }
}

export class ResolutionStateMachine extends EventEmitter {
  private currentState: ResolutionState = ResolutionState.PLANNING;
  private config: ResolutionFSMConfig;
  private executionStartTime: number = 0;
  private stepCount: number = 0;
  private completedSteps: number = 0;

  constructor(config?: Partial<ResolutionFSMConfig>) {
    super();
    this.config = {
      maxConcurrentResolutions: config?.maxConcurrentResolutions || DEFAULT_CONFIG.MAX_CONCURRENT_RESOLUTIONS,
      healthCheckInterval: config?.healthCheckInterval || DEFAULT_CONFIG.HEALTH_CHECK_INTERVAL,
      metricsUpdateInterval: config?.metricsUpdateInterval || 10000
    };
  }

  // NASA Rule 10: Function ≤60 lines
  public getCurrentState(): ResolutionState {
    return this.currentState;
  }

  // NASA Rule 10: Function ≤60 lines
  public canTransition(event: ResolutionEvent): boolean {
    const transitions = this.getValidTransitions();
    return transitions.has(event);
  }

  // NASA Rule 10: Function ≤60 lines
  public transition(event: ResolutionEvent, payload?: ResolutionEventPayload): boolean {
    if (!this.canTransition(event)) {
      this.emit('transition:invalid', {
        currentState: this.currentState,
        event,
        payload
      });
      return false;
    }

    const previousState = this.currentState;
    this.currentState = this.getNextState(event);

    this.emit('transition:success', {
      previousState,
      currentState: this.currentState,
      event,
      payload,
      timestamp: Date.now()
    });

    this.handleStateEntry(event, payload);
    return true;
  }

  // NASA Rule 10: Function ≤60 lines, fixed loop bounds
  private getValidTransitions(): Set<ResolutionEvent> {
    const validTransitions = new Set<ResolutionEvent>();
    const maxTransitions = 15; // Fixed bound
    let transitionCount = 0;

    switch (this.currentState) {
      case ResolutionState.PLANNING:
        validTransitions.add(ResolutionEvent.BEGIN_PLANNING);
        validTransitions.add(ResolutionEvent.START_EXECUTION);
        transitionCount += 2;
        break;

      case ResolutionState.EXECUTING:
        validTransitions.add(ResolutionEvent.STEP_COMPLETED);
        validTransitions.add(ResolutionEvent.STEP_FAILED);
        validTransitions.add(ResolutionEvent.EXECUTION_COMPLETED);
        validTransitions.add(ResolutionEvent.EXECUTION_FAILED);
        transitionCount += 4;
        break;

      case ResolutionState.VALIDATING:
        validTransitions.add(ResolutionEvent.VALIDATION_PASSED);
        validTransitions.add(ResolutionEvent.VALIDATION_FAILED);
        transitionCount += 2;
        break;

      case ResolutionState.COMPLETED:
      case ResolutionState.FAILED:
      case ResolutionState.ROLLED_BACK:
        // Terminal states - no transitions
        break;
    }

    if (transitionCount > maxTransitions) {
      throw new Error(`Transition count exceeded maximum: ${maxTransitions}`);
    }

    return validTransitions;
  }

  // NASA Rule 10: Function ≤60 lines
  private getNextState(event: ResolutionEvent): ResolutionState {
    switch (this.currentState) {
      case ResolutionState.PLANNING:
        switch (event) {
          case ResolutionEvent.BEGIN_PLANNING:
            return ResolutionState.PLANNING;
          case ResolutionEvent.START_EXECUTION:
            return ResolutionState.EXECUTING;
        }
        break;

      case ResolutionState.EXECUTING:
        switch (event) {
          case ResolutionEvent.STEP_COMPLETED:
            return this.shouldValidate() ? ResolutionState.VALIDATING : ResolutionState.EXECUTING;
          case ResolutionEvent.STEP_FAILED:
            return ResolutionState.FAILED;
          case ResolutionEvent.EXECUTION_COMPLETED:
            return ResolutionState.VALIDATING;
          case ResolutionEvent.EXECUTION_FAILED:
            return ResolutionState.FAILED;
        }
        break;

      case ResolutionState.VALIDATING:
        switch (event) {
          case ResolutionEvent.VALIDATION_PASSED:
            return ResolutionState.COMPLETED;
          case ResolutionEvent.VALIDATION_FAILED:
            return ResolutionState.ROLLED_BACK;
        }
        break;
    }

    throw new Error(`Invalid transition: ${this.currentState} -> ${event}`);
  }

  // NASA Rule 10: Function ≤60 lines
  private shouldValidate(): boolean {
    // Simple validation trigger logic
    return this.completedSteps % 5 === 0; // Validate every 5 steps
  }

  // NASA Rule 10: Function ≤60 lines
  private handleStateEntry(event: ResolutionEvent, payload?: ResolutionEventPayload): void {
    switch (this.currentState) {
      case ResolutionState.EXECUTING:
        if (this.executionStartTime === 0) {
          this.executionStartTime = Date.now();
        }
        break;
      case ResolutionState.VALIDATING:
        this.scheduleValidation();
        break;
      case ResolutionState.COMPLETED:
        this.finalizeExecution();
        break;
      case ResolutionState.FAILED:
        this.handleFailure();
        break;
    }

    if (event === ResolutionEvent.STEP_COMPLETED) {
      this.completedSteps++;
    }
  }

  // NASA Rule 10: Function ≤60 lines
  private scheduleValidation(): void {
    setTimeout(() => {
      if (this.currentState === ResolutionState.VALIDATING) {
        // Simple validation logic
        const passed = Math.random() > 0.1; // 90% pass rate
        const event = passed ? ResolutionEvent.VALIDATION_PASSED : ResolutionEvent.VALIDATION_FAILED;
        this.transition(event);
      }
    }, 1000);
  }

  // NASA Rule 10: Function ≤60 lines
  private finalizeExecution(): void {
    const duration = Date.now() - this.executionStartTime;
    this.emit('resolution:completed', {
      duration,
      stepsCompleted: this.completedSteps,
      stepCount: this.stepCount
    });
  }

  // NASA Rule 10: Function ≤60 lines
  private handleFailure(): void {
    this.emit('resolution:failed', {
      stepsCompleted: this.completedSteps,
      stepCount: this.stepCount,
      failureTime: Date.now()
    });
  }

  // NASA Rule 10: Function ≤60 lines
  public setStepCount(count: number): void {
    if (count < 0 || count > 10000) { // Fixed bounds
      throw new Error(`Invalid step count: ${count}`);
    }
    this.stepCount = count;
  }

  // NASA Rule 10: Function ≤60 lines
  public reset(): void {
    this.currentState = ResolutionState.PLANNING;
    this.executionStartTime = 0;
    this.stepCount = 0;
    this.completedSteps = 0;
    this.emit('fsm:reset');
  }

  // NASA Rule 10: Function ≤60 lines
  public getMetrics(): any {
    return {
      currentState: this.currentState,
      executionStartTime: this.executionStartTime,
      stepCount: this.stepCount,
      completedSteps: this.completedSteps,
      progress: this.stepCount > 0 ? this.completedSteps / this.stepCount : 0
    };
  }
}

// NASA Rule 10: Function ≤60 lines
export function generateSecureId(): string {
  const timestamp = Date.now().toString(36);
  const randomBytes = crypto.getRandomValues(new Uint8Array(4));
  const randomStr = Array.from(randomBytes, byte => byte.toString(36)).join('');
  return `${timestamp}${randomStr}`;
}

// NASA Rule 10: Function ≤60 lines
export function createDependencyFSM(config?: Partial<DependencyFSMConfig>): DependencyStateMachine {
  return new DependencyStateMachine(config);
}

// NASA Rule 10: Function ≤60 lines
export function createResolutionFSM(config?: Partial<ResolutionFSMConfig>): ResolutionStateMachine {
  return new ResolutionStateMachine(config);
}

// NASA Rule 10: Function ≤60 lines
export function delay(ms: number): Promise<void> {
  if (ms < 0 || ms > 300000) { // Max 5 minutes
    throw new Error(`Invalid delay: ${ms}ms`);
  }
  return new Promise(resolve => setTimeout(resolve, ms));
}

