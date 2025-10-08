/**
 * PrincessStateValidator - Shared Validation Logic for Princess FSMs
 * NASA Rule 10 Compliant: Centralized validation patterns
 * Used by all Princess implementations for consistent state validation
 */

import { FSMContext, PrincessState } from '../../types/FSMTypes';
import { PrincessLogger } from './PrincessLogger';

export class PrincessStateValidator {
  constructor(private logger: PrincessLogger) {}

  /**
   * Check if Princess FSM is in healthy state
   */
  isHealthy(context: FSMContext): boolean {
    if (!context) {
      this.logger.error('Context is null or undefined');
      return false;
    }

    if (context.currentState === PrincessState.FAILED) {
      this.logger.error('Princess FSM is in failed state');
      return false;
    }

    if (!context.timestamp || this.isContextStale(context)) {
      this.logger.warn('Context appears stale');
      return false;
    }

    return true;
  }

  /**
   * Check if context is stale (older than 1 hour)
   */
  private isContextStale(context: FSMContext): boolean {
    const oneHour = 60 * 60 * 1000;
    return Date.now() - context.timestamp > oneHour;
  }

  /**
   * Validate if transition is allowed
   */
  canTransition(context: FSMContext, event: any): boolean {
    if (!this.isHealthy(context)) {
      return false;
    }

    // Prevent transitions from terminal states
    if (this.isTerminalState(context.currentState)) {
      this.logger.warn(`Cannot transition from terminal state: ${context.currentState}`);
      return false;
    }

    return true;
  }

  /**
   * Check if state is terminal
   */
  private isTerminalState(state: any): boolean {
    return state === PrincessState.COMPLETE || state === PrincessState.FAILED;
  }

  /**
   * Validate context data structure
   */
  validateContextStructure(context: FSMContext): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!context.currentState) {
      errors.push('Missing currentState');
    }

    if (!context.data) {
      errors.push('Missing data object');
    }

    if (!context.timestamp) {
      errors.push('Missing timestamp');
    }

    if (!context.metadata) {
      errors.push('Missing metadata');
    } else {
      if (!context.metadata.principessType) {
        errors.push('Missing principessType in metadata');
      }
      if (!context.metadata.workflowId) {
        errors.push('Missing workflowId in metadata');
      }
    }

    if (!Array.isArray(context.transitionHistory)) {
      errors.push('Invalid transitionHistory structure');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate specific Princess domain context
   */
  validateDomainContext(context: FSMContext, requiredFields: string[]): {
    valid: boolean;
    missingFields: string[];
  } {
    const missingFields: string[] = [];

    requiredFields.forEach(field => {
      if (!this.hasNestedProperty(context, field)) {
        missingFields.push(field);
      }
    });

    return {
      valid: missingFields.length === 0,
      missingFields
    };
  }

  /**
   * Check if object has nested property
   */
  private hasNestedProperty(obj: any, path: string): boolean {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined;
    }, obj) !== undefined;
  }

  /**
   * Validate workflow progress
   */
  validateProgress(context: FSMContext): {
    valid: boolean;
    progressPercentage: number;
    issues: string[];
  } {
    const issues: string[] = [];
    let progressPercentage = 0;

    if (!context.transitionHistory || context.transitionHistory.length === 0) {
      issues.push('No transition history available');
      return { valid: false, progressPercentage: 0, issues };
    }

    // Calculate progress based on transition history
    const totalSteps = this.estimateTotalSteps(context.metadata?.principessType);
    const completedSteps = context.transitionHistory.length;
    progressPercentage = Math.min((completedSteps / totalSteps) * 100, 100);

    // Check for stuck states
    const recentTransitions = context.transitionHistory.slice(-5);
    const uniqueStates = new Set(recentTransitions.map(t => t.to));
    if (uniqueStates.size <= 1 && recentTransitions.length >= 3) {
      issues.push('FSM appears stuck in same state');
    }

    // Check for infinite loops
    if (this.detectLoop(context.transitionHistory)) {
      issues.push('Potential infinite loop detected');
    }

    return {
      valid: issues.length === 0,
      progressPercentage,
      issues
    };
  }

  /**
   * Estimate total steps for different Princess types
   */
  private estimateTotalSteps(principessType: string = ''): number {
    const stepMap: Record<string, number> = {
      development: 8,
      deployment: 10,
      infrastructure: 9,
      research: 7,
      security: 8,
      quality: 6
    };

    return stepMap[principessType] || 8;
  }

  /**
   * Detect potential loops in transition history
   */
  private detectLoop(history: any[]): boolean {
    if (history.length < 6) return false;

    const recent = history.slice(-6);
    const pattern = recent.slice(0, 3);
    const next = recent.slice(3, 6);

    return pattern.every((transition, index) =>
      transition.from === next[index]?.from &&
      transition.to === next[index]?.to
    );
  }

  /**
   * Generate validation report
   */
  generateValidationReport(context: FSMContext): {
    healthy: boolean;
    structure: any;
    progress: any;
    recommendations: string[];
  } {
    const structure = this.validateContextStructure(context);
    const progress = this.validateProgress(context);
    const healthy = this.isHealthy(context);

    const recommendations: string[] = [];

    if (!healthy) {
      recommendations.push('Address health issues before proceeding');
    }

    if (!structure.valid) {
      recommendations.push('Fix context structure issues');
    }

    if (progress.issues.length > 0) {
      recommendations.push('Review workflow progress and resolve stuck states');
    }

    if (progress.progressPercentage < 50) {
      recommendations.push('Consider workflow optimization for better progress');
    }

    return {
      healthy,
      structure,
      progress,
      recommendations
    };
  }
}