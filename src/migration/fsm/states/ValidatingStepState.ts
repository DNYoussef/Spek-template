/**
 * Validating Step State Handler - NASA Rule 10 Compliant
 * Manages step validation after execution
 */

import { Logger } from '../../../utils/Logger';
import { StateHandler, MigrationContext, MigrationEvent } from '../types/MigrationFSMTypes';

export class ValidatingStepState implements StateHandler {
  private logger: Logger;
  private validationStartTime: Date;
  private currentValidationIndex: number;

  constructor() {
    this.logger = new Logger('ValidatingStepState');
    this.validationStartTime = new Date();
    this.currentValidationIndex = 0;
  }

  /**
   * Initialize step validation
   * NASA Rule 10: Keep function under 60 lines
   */
  async onEnter(context: MigrationContext): Promise<void> {
    this.validationStartTime = new Date();
    this.currentValidationIndex = 0;

    this.logger.info('Entering step validation state', {
      executionId: context.executionId,
      stepId: context.currentStep?.id
    });

    // Validate context state
    this.validateContextState(context);

    // Initialize validation process
    this.initializeValidation(context);

    // Start validation process
    await this.startValidationProcess(context);
  }

  /**
   * Cleanup validation state
   * NASA Rule 10: Keep function under 60 lines
   */
  async onExit(context: MigrationContext): Promise<void> {
    this.logger.info('Exiting step validation state', {
      executionId: context.executionId,
      stepId: context.currentStep?.id,
      validationDuration: Date.now() - this.validationStartTime.getTime()
    });

    // Record validation completion
    this.recordValidationCompletion(context);

    // Update step result with validation results
    this.updateStepResult(context);
  }

  /**
   * Process validation tick
   * NASA Rule 10: Keep function under 60 lines
   */
  async tick(context: MigrationContext): Promise<MigrationEvent | null> {
    if (!context.currentStep) {
      return MigrationEvent.VALIDATION_FAILED;
    }

    // Check for validation timeout
    if (this.isValidationTimeout(context)) {
      this.logger.error('Validation timeout exceeded', {
        executionId: context.executionId,
        stepId: context.currentStep.id
      });
      return MigrationEvent.VALIDATION_FAILED;
    }

    // Check if all validations are completed
    if (this.areAllValidationsCompleted(context)) {
      const allPassed = this.areAllValidationsPassed(context);
      return allPassed ? MigrationEvent.VALIDATION_PASSED : MigrationEvent.VALIDATION_FAILED;
    }

    // Process next validation
    await this.processNextValidation(context);

    return null;
  }

  /**
   * Check if can exit validation state
   * NASA Rule 10: Keep function under 60 lines
   */
  canExit(context: MigrationContext): boolean {
    if (!context.currentStep) {
      return true;
    }

    // Can exit if all validations are processed
    return this.currentValidationIndex >= context.currentStep.validationChecks.length;
  }

  /**
   * Validate context state for validation
   * NASA Rule 10: Keep function under 60 lines
   */
  private validateContextState(context: MigrationContext): void {
    if (!context.currentStep) {
      throw new Error('Current step not set for validation');
    }

    // Find the step result
    const stepResult = context.stepResults.find(r => r.stepId === context.currentStep!.id);
    if (!stepResult) {
      throw new Error('Step result not found for validation');
    }

    if (!stepResult.success) {
      throw new Error('Cannot validate failed step');
    }

    this.logger.debug('Context state validated for step validation', {
      executionId: context.executionId,
      stepId: context.currentStep.id
    });
  }

  /**
   * Initialize validation process
   * NASA Rule 10: Keep function under 60 lines
   */
  private initializeValidation(context: MigrationContext): void {
    if (!context.currentStep) {
      throw new Error('Current step not set');
    }

    this.currentValidationIndex = 0;

    // Set validation start time in global context
    context.globalContext.set(`validation_${context.currentStep.id}_start`, this.validationStartTime);

    // Initialize validation metrics
    context.globalContext.set(`validation_${context.currentStep.id}_metrics`, {
      totalChecks: context.currentStep.validationChecks.length,
      completedChecks: 0,
      passedChecks: 0,
      failedChecks: 0
    });

    this.logger.debug('Validation initialized', {
      executionId: context.executionId,
      stepId: context.currentStep.id,
      checkCount: context.currentStep.validationChecks.length
    });
  }

  /**
   * Start validation process
   * NASA Rule 10: Keep function under 60 lines
   */
  private async startValidationProcess(context: MigrationContext): Promise<void> {
    if (!context.currentStep || context.currentStep.validationChecks.length === 0) {
      this.logger.info('No validation checks to execute', {
        executionId: context.executionId,
        stepId: context.currentStep?.id
      });
      return;
    }

    this.logger.info('Starting validation process', {
      executionId: context.executionId,
      stepId: context.currentStep.id,
      checkCount: context.currentStep.validationChecks.length
    });

    // Process first validation
    await this.processNextValidation(context);
  }

  /**
   * Process next validation check
   * NASA Rule 10: Keep function under 60 lines
   */
  private async processNextValidation(context: MigrationContext): Promise<void> {
    if (!context.currentStep || this.currentValidationIndex >= context.currentStep.validationChecks.length) {
      return;
    }

    const validationCheck = context.currentStep.validationChecks[this.currentValidationIndex];

    this.logger.debug('Executing validation check', {
      executionId: context.executionId,
      stepId: context.currentStep.id,
      checkType: validationCheck.type,
      checkIndex: this.currentValidationIndex
    });

    try {
      const validationResult = await this.executeValidationCheck(validationCheck, context);
      this.recordValidationResult(context, validationResult);

    } catch (error) {
      this.logger.error('Validation check failed', {
        executionId: context.executionId,
        stepId: context.currentStep.id,
        checkType: validationCheck.type,
        error: error.message
      });

      this.recordValidationError(context, validationCheck, error);

    } finally {
      this.currentValidationIndex++;
    }
  }

  /**
   * Execute individual validation check
   * NASA Rule 10: Keep function under 60 lines
   */
  private async executeValidationCheck(validationCheck: any, context: MigrationContext): Promise<any> {
    if (!context.currentStep) {
      throw new Error('Current step not set');
    }

    // Get step result for validation
    const stepResult = context.stepResults.find(r => r.stepId === context.currentStep!.id);
    if (!stepResult) {
      throw new Error('Step result not found');
    }

    // Get validator for check type
    const validator = this.getValidator(validationCheck.type);

    // Execute validation with timeout
    const validatePromise = validator.validate(validationCheck, stepResult.output, context);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Validation timeout')), 30000)
    );

    return Promise.race([validatePromise, timeoutPromise]);
  }

  /**
   * Get validator for check type
   * NASA Rule 10: Keep function under 60 lines
   */
  private getValidator(checkType: string): any {
    // In real implementation, this would be injected
    return {
      validate: async (check: any, output: any, context: MigrationContext) => {
        // Simulate validation
        await new Promise(resolve => setTimeout(resolve, 50));

        return {
          checkId: check.type,
          passed: Math.random() > 0.1, // 90% pass rate for simulation
          value: Math.random() * 100,
          threshold: check.threshold,
          message: `Validation check ${check.type} completed`,
          severity: 'medium'
        };
      }
    };
  }

  /**
   * Record validation result
   * NASA Rule 10: Keep function under 60 lines
   */
  private recordValidationResult(context: MigrationContext, result: any): void {
    if (!context.currentStep) {
      return;
    }

    // Update step result with validation result
    const stepResult = context.stepResults.find(r => r.stepId === context.currentStep!.id);
    if (stepResult) {
      stepResult.validationResults.push(result);
    }

    // Update validation metrics
    const metrics = context.globalContext.get(`validation_${context.currentStep.id}_metrics`) || {};
    metrics.completedChecks = (metrics.completedChecks || 0) + 1;

    if (result.passed) {
      metrics.passedChecks = (metrics.passedChecks || 0) + 1;
    } else {
      metrics.failedChecks = (metrics.failedChecks || 0) + 1;
    }

    context.globalContext.set(`validation_${context.currentStep.id}_metrics`, metrics);

    this.logger.debug('Validation result recorded', {
      executionId: context.executionId,
      stepId: context.currentStep.id,
      checkId: result.checkId,
      passed: result.passed,
      progress: `${metrics.completedChecks}/${metrics.totalChecks}`
    });
  }

  /**
   * Record validation error
   * NASA Rule 10: Keep function under 60 lines
   */
  private recordValidationError(context: MigrationContext, check: any, error: Error): void {
    if (!context.currentStep) {
      return;
    }

    const errorResult = {
      checkId: check.type,
      passed: false,
      value: null,
      threshold: check.threshold,
      message: error.message,
      severity: 'critical'
    };

    this.recordValidationResult(context, errorResult);
  }

  /**
   * Check if validation has timed out
   * NASA Rule 10: Keep function under 60 lines
   */
  private isValidationTimeout(context: MigrationContext): boolean {
    const maxValidationTime = 5 * 60 * 1000; // 5 minutes
    const elapsed = Date.now() - this.validationStartTime.getTime();
    return elapsed > maxValidationTime;
  }

  /**
   * Check if all validations are completed
   * NASA Rule 10: Keep function under 60 lines
   */
  private areAllValidationsCompleted(context: MigrationContext): boolean {
    if (!context.currentStep) {
      return true;
    }

    return this.currentValidationIndex >= context.currentStep.validationChecks.length;
  }

  /**
   * Check if all validations passed
   * NASA Rule 10: Keep function under 60 lines
   */
  private areAllValidationsPassed(context: MigrationContext): boolean {
    if (!context.currentStep) {
      return true;
    }

    const stepResult = context.stepResults.find(r => r.stepId === context.currentStep!.id);
    if (!stepResult) {
      return false;
    }

    // Check critical validations first
    const criticalValidations = stepResult.validationResults.filter(v => v.severity === 'critical');
    const failedCritical = criticalValidations.filter(v => !v.passed);

    if (failedCritical.length > 0) {
      return false;
    }

    // Check overall pass rate
    const totalValidations = stepResult.validationResults.length;
    const passedValidations = stepResult.validationResults.filter(v => v.passed).length;
    const passRate = totalValidations > 0 ? (passedValidations / totalValidations) : 1;

    return passRate >= 0.8; // 80% pass rate required
  }

  /**
   * Record validation completion
   * NASA Rule 10: Keep function under 60 lines
   */
  private recordValidationCompletion(context: MigrationContext): void {
    if (!context.currentStep) {
      return;
    }

    const duration = Date.now() - this.validationStartTime.getTime();
    const metrics = context.globalContext.get(`validation_${context.currentStep.id}_metrics`) || {};

    const completionRecord = {
      duration,
      totalChecks: metrics.totalChecks || 0,
      completedChecks: metrics.completedChecks || 0,
      passedChecks: metrics.passedChecks || 0,
      failedChecks: metrics.failedChecks || 0,
      passRate: metrics.totalChecks > 0 ?
        ((metrics.passedChecks || 0) / metrics.totalChecks) * 100 : 100
    };

    context.globalContext.set(`validation_${context.currentStep.id}_completion`, completionRecord);

    this.logger.info('Validation completion recorded', {
      executionId: context.executionId,
      stepId: context.currentStep.id,
      ...completionRecord
    });
  }

  /**
   * Update step result with final validation status
   * NASA Rule 10: Keep function under 60 lines
   */
  private updateStepResult(context: MigrationContext): void {
    if (!context.currentStep) {
      return;
    }

    const stepResult = context.stepResults.find(r => r.stepId === context.currentStep!.id);
    if (!stepResult) {
      return;
    }

    const allPassed = this.areAllValidationsPassed(context);

    // Update step success based on validation results
    if (!allPassed && stepResult.success) {
      stepResult.success = false;
      stepResult.error = new Error('Step validation failed');

      this.logger.warn('Step marked as failed due to validation', {
        executionId: context.executionId,
        stepId: context.currentStep.id
      });
    }
  }
}