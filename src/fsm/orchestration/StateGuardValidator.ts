/**
 * StateGuardValidator - Validates State Transitions
 * Implements guard conditions and validation logic for FSM transitions
 */

import { FSMContext, TransitionGuard, SystemState, SystemEvent } from '../types/FSMTypes';

export interface ValidationResult {
  valid: boolean;
  reason?: string;
  guardsFailed?: string[];
  timestamp: number;
}

export interface GuardRegistry {
  [key: string]: TransitionGuard;
}

export class StateGuardValidator {
  private initialized = false;
  private guards: GuardRegistry = {};
  private validationHistory: ValidationResult[] = [];
  private maxHistorySize = 1000;

  constructor() {
    this.initializeDefaultGuards();
  }

  /**
   * Initialize the guard validator
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    this.log('Initializing StateGuardValidator');
    this.initializeDefaultGuards();
    this.validationHistory = [];
    this.initialized = true;
  }

  /**
   * Initialize default system guards
   */
  private initializeDefaultGuards(): void {
    // System state guards
    this.guards['canInitialize'] = {
      name: 'canInitialize',
      condition: (context: FSMContext) => {
        return context.currentState === SystemState.IDLE && 
               !context.data.initialized;
      },
      errorMessage: 'System must be in IDLE state and not already initialized'
    };

    this.guards['canSuspend'] = {
      name: 'canSuspend',
      condition: (context: FSMContext) => {
        return context.currentState === SystemState.ACTIVE &&
               !context.data.criticalOperation;
      },
      errorMessage: 'Cannot suspend during critical operations'
    };

    this.guards['canResume'] = {
      name: 'canResume',
      condition: (context: FSMContext) => {
        return context.currentState === SystemState.SUSPENDED &&
               context.data.initialized;
      },
      errorMessage: 'System must be suspended and initialized to resume'
    };

    this.guards['canShutdown'] = {
      name: 'canShutdown',
      condition: (context: FSMContext) => {
        return [SystemState.ACTIVE, SystemState.SUSPENDED, SystemState.ERROR]
          .includes(context.currentState);
      },
      errorMessage: 'Cannot shutdown from current state'
    };

    this.guards['canRecover'] = {
      name: 'canRecover',
      condition: (context: FSMContext) => {
        return context.currentState === SystemState.ERROR &&
               (context.data.recoveryAttempts || 0) < 3 &&
               !context.data.criticalError;
      },
      errorMessage: 'Recovery not possible - too many attempts or critical error'
    };

    // Princess-specific guards
    this.guards['hasRequiredDependencies'] = {
      name: 'hasRequiredDependencies',
      condition: (context: FSMContext) => {
        const requiredDeps = context.metadata.requiredDependencies || [];
        const availableDeps = context.data.availableDependencies || [];
        return requiredDeps.every(dep => availableDeps.includes(dep));
      },
      errorMessage: 'Required dependencies not available'
    };

    this.guards['withinResourceLimits'] = {
      name: 'withinResourceLimits',
      condition: (context: FSMContext) => {
        const cpuUsage = context.data.cpuUsage || 0;
        const memoryUsage = context.data.memoryUsage || 0;
        return cpuUsage < 80 && memoryUsage < 85;
      },
      errorMessage: 'Resource usage too high (CPU > 80% or Memory > 85%)'
    };

    this.guards['hasValidConfiguration'] = {
      name: 'hasValidConfiguration',
      condition: (context: FSMContext) => {
        return context.metadata.configuration &&
               context.metadata.configuration.version &&
               context.metadata.configuration.valid === true;
      },
      errorMessage: 'Invalid or missing configuration'
    };

    this.guards['timeoutNotExceeded'] = {
      name: 'timeoutNotExceeded',
      condition: (context: FSMContext) => {
        const startTime = context.data.operationStartTime;
        const timeout = context.metadata.operationTimeout || 30000; // 30 seconds default
        return !startTime || (Date.now() - startTime) < timeout;
      },
      errorMessage: 'Operation timeout exceeded'
    };

    // Quality gates
    this.guards['qualityGatesPassed'] = {
      name: 'qualityGatesPassed',
      condition: (context: FSMContext) => {
        const qualityScore = context.data.qualityScore || 0;
        const threshold = context.metadata.qualityThreshold || 80;
        return qualityScore >= threshold;
      },
      errorMessage: 'Quality gates not met'
    };

    this.guards['noSecurityViolations'] = {
      name: 'noSecurityViolations',
      condition: (context: FSMContext) => {
        const securityIssues = context.data.securityIssues || [];
        const criticalIssues = securityIssues.filter(issue => issue.severity === 'critical');
        return criticalIssues.length === 0;
      },
      errorMessage: 'Critical security violations detected'
    };
  }

  /**
   * Validate a state transition
   */
  validateTransition(
    fromState: any,
    toState: any,
    event: any,
    context: FSMContext
  ): boolean {
    const result = this.validateTransitionWithReason(fromState, toState, event, context);
    return result.valid;
  }

  /**
   * Validate transition with detailed reason
   */
  validateTransitionWithReason(
    fromState: any,
    toState: any,
    event: any,
    context: FSMContext
  ): ValidationResult {
    const startTime = Date.now();
    
    try {
      // Check basic transition validity
      if (!this.isValidTransition(fromState, toState, event)) {
        return this.createFailureResult(
          `Invalid transition: ${fromState} -> ${toState} on ${event}`,
          startTime
        );
      }

      // Get applicable guards for this transition
      const applicableGuards = this.getApplicableGuards(fromState, toState, event);
      const failedGuards: string[] = [];

      // Evaluate each guard
      for (const guard of applicableGuards) {
        if (!this.evaluateGuard(guard, context)) {
          failedGuards.push(guard.name);
        }
      }

      if (failedGuards.length > 0) {
        return this.createFailureResult(
          `Guards failed: ${failedGuards.join(', ')}`,
          startTime,
          failedGuards
        );
      }

      // All validations passed
      const result: ValidationResult = {
        valid: true,
        timestamp: startTime
      };

      this.addToHistory(result);
      return result;

    } catch (error) {
      this.logError('Validation error', error);
      return this.createFailureResult(
        `Validation error: ${error.message}`,
        startTime
      );
    }
  }

  /**
   * Validate an event for current state
   */
  validateEvent(currentState: any, event: any, context: FSMContext): boolean {
    const validEvents = this.getValidEventsForState(currentState);
    return validEvents.includes(event);
  }

  /**
   * Get valid events for a state
   */
  private getValidEventsForState(state: any): any[] {
    const validEvents: Record<string, any[]> = {
      [SystemState.IDLE]: [SystemEvent.INITIALIZE],
      [SystemState.INITIALIZING]: [SystemEvent.ERROR_OCCURRED],
      [SystemState.ACTIVE]: [
        SystemEvent.PAUSE,
        SystemEvent.STOP,
        SystemEvent.ERROR_OCCURRED,
        SystemEvent.HEALTH_CHECK
      ],
      [SystemState.SUSPENDED]: [
        SystemEvent.RESUME,
        SystemEvent.STOP
      ],
      [SystemState.ERROR]: [
        SystemEvent.RECOVERY_COMPLETE,
        SystemEvent.FORCE_SHUTDOWN
      ],
      [SystemState.RECOVERING]: [
        SystemEvent.RECOVERY_COMPLETE,
        SystemEvent.ERROR_OCCURRED
      ],
      [SystemState.SHUTDOWN]: [] // Final state - no events
    };

    return validEvents[state] || [];
  }

  /**
   * Check if transition is valid
   */
  private isValidTransition(fromState: any, toState: any, event: any): boolean {
    // Define valid transitions
    const validTransitions: Record<string, Record<string, any[]>> = {
      [SystemState.IDLE]: {
        [SystemEvent.INITIALIZE]: [SystemState.INITIALIZING]
      },
      [SystemState.INITIALIZING]: {
        [SystemEvent.TRANSITION_COMPLETE]: [SystemState.ACTIVE],
        [SystemEvent.ERROR_OCCURRED]: [SystemState.ERROR]
      },
      [SystemState.ACTIVE]: {
        [SystemEvent.PAUSE]: [SystemState.SUSPENDED],
        [SystemEvent.STOP]: [SystemState.SHUTDOWN],
        [SystemEvent.ERROR_OCCURRED]: [SystemState.ERROR]
      },
      [SystemState.SUSPENDED]: {
        [SystemEvent.RESUME]: [SystemState.ACTIVE],
        [SystemEvent.STOP]: [SystemState.SHUTDOWN]
      },
      [SystemState.ERROR]: {
        [SystemEvent.RECOVERY_COMPLETE]: [SystemState.ACTIVE],
        [SystemEvent.FORCE_SHUTDOWN]: [SystemState.SHUTDOWN]
      },
      [SystemState.RECOVERING]: {
        [SystemEvent.RECOVERY_COMPLETE]: [SystemState.ACTIVE],
        [SystemEvent.ERROR_OCCURRED]: [SystemState.ERROR]
      }
    };

    const stateTransitions = validTransitions[fromState];
    if (!stateTransitions) {
      return false;
    }

    const eventTransitions = stateTransitions[event];
    if (!eventTransitions) {
      return false;
    }

    return eventTransitions.includes(toState);
  }

  /**
   * Get applicable guards for transition
   */
  private getApplicableGuards(fromState: any, toState: any, event: any): TransitionGuard[] {
    const guards: TransitionGuard[] = [];
    
    // Add state-specific guards
    switch (event) {
      case SystemEvent.INITIALIZE:
        guards.push(this.guards['canInitialize']);
        break;
      case SystemEvent.PAUSE:
        guards.push(this.guards['canSuspend']);
        break;
      case SystemEvent.RESUME:
        guards.push(this.guards['canResume']);
        break;
      case SystemEvent.STOP:
        guards.push(this.guards['canShutdown']);
        break;
      case SystemEvent.RECOVERY_COMPLETE:
        guards.push(this.guards['canRecover']);
        break;
    }

    // Add common guards for all transitions
    guards.push(this.guards['hasValidConfiguration']);
    guards.push(this.guards['timeoutNotExceeded']);
    
    // Add resource guards for resource-intensive operations
    if ([SystemEvent.INITIALIZE, SystemEvent.RECOVERY_COMPLETE].includes(event)) {
      guards.push(this.guards['withinResourceLimits']);
    }

    return guards.filter(guard => guard !== undefined);
  }

  /**
   * Evaluate a single guard
   */
  private evaluateGuard(guard: TransitionGuard, context: FSMContext): boolean {
    try {
      return guard.condition(context);
    } catch (error) {
      this.logError(`Guard evaluation failed: ${guard.name}`, error);
      return false;
    }
  }

  /**
   * Register a custom guard
   */
  registerGuard(guard: TransitionGuard): void {
    this.guards[guard.name] = guard;
    this.log(`Guard registered: ${guard.name}`);
  }

  /**
   * Remove a guard
   */
  removeGuard(name: string): void {
    delete this.guards[name];
    this.log(`Guard removed: ${name}`);
  }

  /**
   * Get all registered guards
   */
  getRegisteredGuards(): string[] {
    return Object.keys(this.guards);
  }

  /**
   * Create failure result
   */
  private createFailureResult(
    reason: string,
    timestamp: number,
    guardsFailed?: string[]
  ): ValidationResult {
    const result: ValidationResult = {
      valid: false,
      reason,
      guardsFailed,
      timestamp
    };

    this.addToHistory(result);
    return result;
  }

  /**
   * Add result to validation history
   */
  private addToHistory(result: ValidationResult): void {
    this.validationHistory.push(result);
    
    // Maintain history size limit
    if (this.validationHistory.length > this.maxHistorySize) {
      this.validationHistory = this.validationHistory.slice(-this.maxHistorySize);
    }
  }

  /**
   * Get validation history
   */
  getValidationHistory(): ValidationResult[] {
    return [...this.validationHistory];
  }

  /**
   * Get validation statistics
   */
  getValidationStats(): {
    totalValidations: number;
    successRate: number;
    failureRate: number;
    commonFailures: { reason: string; count: number }[];
  } {
    const total = this.validationHistory.length;
    const successful = this.validationHistory.filter(r => r.valid).length;
    const failed = total - successful;
    
    // Count failure reasons
    const failureReasons = this.validationHistory
      .filter(r => !r.valid && r.reason)
      .map(r => r.reason!);
    
    const reasonCounts: Record<string, number> = {};
    failureReasons.forEach(reason => {
      reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
    });
    
    const commonFailures = Object.entries(reasonCounts)
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Top 5 failure reasons
    
    return {
      totalValidations: total,
      successRate: total > 0 ? successful / total : 0,
      failureRate: total > 0 ? failed / total : 0,
      commonFailures
    };
  }

  /**
   * Shutdown the guard validator
   */
  async shutdown(): Promise<void> {
    if (!this.initialized) {
      return;
    }

    this.log('Shutting down StateGuardValidator');
    this.validationHistory = [];
    this.initialized = false;
    this.log('StateGuardValidator shutdown complete');
  }

  /**
   * Log message
   */
  private log(message: string, data?: any): void {
    console.log(`[StateGuardValidator] ${message}`, data || '');
  }

  /**
   * Log error
   */
  private logError(message: string, error?: any): void {
    console.error(`[StateGuardValidator] ERROR: ${message}`, error || '');
  }
}
