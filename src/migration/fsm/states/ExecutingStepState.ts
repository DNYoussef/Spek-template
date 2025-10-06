/**
 * Executing Step State Handler - NASA Rule 10 Compliant
 * Manages individual migration step execution
 */

import { Logger } from '../../../utils/Logger';
// TODO(Phase 4): Implement state handler - import { StateHandler, MigrationContext, MigrationEvent, MigrationStep } from '~types/MigrationFSMTypes';

export class ExecutingStepState implements StateHandler {
  private logger: Logger;
  private stepStartTime: Date;
  private retryCount: number;

  constructor() {
    this.logger = new Logger('ExecutingStepState');
    this.stepStartTime = new Date();
    this.retryCount = 0;
  }

  /**
   * Initialize step execution
   * NASA Rule 10: Keep function under 60 lines
   */
  async onEnter(context: MigrationContext): Promise<void> {
    this.stepStartTime = new Date();
    this.retryCount = 0;

    this.logger.info('Entering step execution state', {
      executionId: context.executionId,
      stepIndex: context.currentStepIndex
    });

    // Set current step
    this.setCurrentStep(context);

    // Initialize step execution
    this.initializeStepExecution(context);

    // Notify callbacks
    await this.notifyStepStart(context);

    // Start step execution
    await this.executeCurrentStep(context);
  }

  /**
   * Cleanup step execution state
   * NASA Rule 10: Keep function under 60 lines
   */
  async onExit(context: MigrationContext): Promise<void> {
    this.logger.info('Exiting step execution state', {
      executionId: context.executionId,
      stepId: context.currentStep?.id
    });

    // Record step completion
    this.recordStepCompletion(context);

    // Advance to next step
    this.advanceStepIndex(context);
  }

  /**
   * Process step execution tick
   * NASA Rule 10: Keep function under 60 lines
   */
  async tick(context: MigrationContext): Promise<MigrationEvent | null> {
    if (!context.currentStep) {
      return MigrationEvent.STEP_FAILED;
    }

    // Check for step timeout
    if (this.isStepTimeout(context)) {
      if (this.canRetryStep(context)) {
        await this.retryStep(context);
        return null;
      } else {
        context.error = new Error('Step execution timeout');
        return MigrationEvent.STEP_FAILED;
      }
    }

    // Check if step execution is complete
    const stepResult = this.getStepResult(context);
    if (stepResult) {
      if (stepResult.success) {
        return MigrationEvent.STEP_COMPLETED;
      } else {
        if (this.canRetryStep(context)) {
          await this.retryStep(context);
          return null;
        } else {
          return MigrationEvent.STEP_FAILED;
        }
      }
    }

    return null;
  }

  /**
   * Check if can exit step execution
   * NASA Rule 10: Keep function under 60 lines
   */
  canExit(context: MigrationContext): boolean {
    if (!context.currentStep) {
      return true;
    }

    // Can exit if step has a result
    const stepResult = this.getStepResult(context);
    return stepResult !== undefined;
  }

  /**
   * Set current step from context
   * NASA Rule 10: Keep function under 60 lines
   */
  private setCurrentStep(context: MigrationContext): void {
    if (!context.currentPhase) {
      throw new Error('Current phase not set');
    }

    if (context.currentStepIndex >= context.currentPhase.steps.length) {
      throw new Error('Step index out of bounds');
    }

    context.currentStep = context.currentPhase.steps[context.currentStepIndex];

    this.logger.debug('Current step set', {
      executionId: context.executionId,
      stepId: context.currentStep.id,
      stepIndex: context.currentStepIndex
    });
  }

  /**
   * Initialize step execution state
   * NASA Rule 10: Keep function under 60 lines
   */
  private initializeStepExecution(context: MigrationContext): void {
    if (!context.currentStep) {
      throw new Error('Current step not set');
    }

    // Set step start time in global context
    context.globalContext.set(`step_${context.currentStep.id}_start`, this.stepStartTime);

    // Initialize retry count
    context.globalContext.set(`step_${context.currentStep.id}_retries`, 0);

    this.logger.debug('Step execution initialized', {
      executionId: context.executionId,
      stepId: context.currentStep.id,
      action: context.currentStep.action
    });
  }

  /**
   * Notify step start callbacks
   * NASA Rule 10: Keep function under 60 lines
   */
  private async notifyStepStart(context: MigrationContext): Promise<void> {
    if (!context.currentStep || !context.callbacks.onStepStart) {
      return;
    }

    try {
      await context.callbacks.onStepStart(context.currentStep, context);

      this.logger.debug('Step start callback completed', {
        executionId: context.executionId,
        stepId: context.currentStep.id
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.warn('Step start callback failed', {
        executionId: context.executionId,
        stepId: context.currentStep.id,
        error: errorMessage
      });
    }
  }

  /**
   * Execute current step
   * NASA Rule 10: Keep function under 60 lines
   */
  private async executeCurrentStep(context: MigrationContext): Promise<void> {
    if (!context.currentStep) {
      throw new Error('Current step not set');
    }

    try {
      // Get step executor (would be injected in real implementation)
      const executor = this.getStepExecutor(context.currentStep.action);

      // Execute step with timeout
      const output = await this.executeWithTimeout(executor, context);

      // Create successful step result
      this.createStepResult(context, true, output);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Step execution failed', {
        executionId: context.executionId,
        stepId: context.currentStep.id,
        error: errorMessage,
        retryCount: this.retryCount
      });

      // Create failed step result
      this.createStepResult(context, false, null, error);
    }
  }

  /**
   * Get step executor for action
   * NASA Rule 10: Keep function under 60 lines
   */
  private getStepExecutor(action: string): any {
    // In real implementation, this would be injected
    return {
      execute: async (step: MigrationStep, context: MigrationContext) => {
        // Simulate step execution
        await new Promise(resolve => setTimeout(resolve, 100));
        return { result: 'success', action };
      }
    };
  }

  /**
   * Execute step with timeout protection
   * NASA Rule 10: Keep function under 60 lines
   */
  private async executeWithTimeout(executor: any, context: MigrationContext): Promise<any> {
    if (!context.currentStep) {
      throw new Error('Current step not set');
    }

    const executePromise = executor.execute(context.currentStep, context);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Step execution timeout')), context.currentStep!.timeout)
    );

    return Promise.race([executePromise, timeoutPromise]);
  }

  /**
   * Create step result record
   * NASA Rule 10: Keep function under 60 lines
   */
  private createStepResult(
    context: MigrationContext,
    success: boolean,
    output: any,
    error?: Error
  ): void {
    if (!context.currentStep) {
      throw new Error('Current step not set');
    }

    const stepEndTime = new Date();
    const duration = stepEndTime.getTime() - this.stepStartTime.getTime();

    const stepResult = {
      stepId: context.currentStep.id,
      success,
      startTime: this.stepStartTime,
      endTime: stepEndTime,
      duration,
      output,
      error,
      retryCount: this.retryCount,
      validationResults: [],
      artifacts: []
    };

    // Replace or add step result
    const existingIndex = context.stepResults.findIndex(r => r.stepId === context.currentStep!.id);
    if (existingIndex >= 0) {
      context.stepResults[existingIndex] = stepResult;
    } else {
      context.stepResults.push(stepResult);
    }

    this.logger.debug('Step result created', {
      executionId: context.executionId,
      stepId: context.currentStep.id,
      success,
      duration
    });
  }

  /**
   * Get step result if available
   * NASA Rule 10: Keep function under 60 lines
   */
  private getStepResult(context: MigrationContext): any {
    if (!context.currentStep) {
      return undefined;
    }

    return context.stepResults.find(r => r.stepId === context.currentStep!.id);
  }

  /**
   * Check if step has timed out
   * NASA Rule 10: Keep function under 60 lines
   */
  private isStepTimeout(context: MigrationContext): boolean {
    if (!context.currentStep) {
      return false;
    }

    const elapsed = Date.now() - this.stepStartTime.getTime();
    return elapsed > context.currentStep.timeout;
  }

  /**
   * Check if step can be retried
   * NASA Rule 10: Keep function under 60 lines
   */
  private canRetryStep(context: MigrationContext): boolean {
    if (!context.currentStep) {
      return false;
    }

    return this.retryCount < context.currentStep.retryPolicy.maxRetries;
  }

  /**
   * Retry step execution
   * NASA Rule 10: Keep function under 60 lines
   */
  private async retryStep(context: MigrationContext): Promise<void> {
    if (!context.currentStep) {
      throw new Error('Current step not set');
    }

    this.retryCount++;
    this.stepStartTime = new Date();

    this.logger.info('Retrying step', {
      executionId: context.executionId,
      stepId: context.currentStep.id,
      retryCount: this.retryCount,
      maxRetries: context.currentStep.retryPolicy.maxRetries
    });

    // Calculate backoff delay
    const backoffDelay = this.calculateBackoffDelay(context.currentStep.retryPolicy);
    await new Promise(resolve => setTimeout(resolve, backoffDelay));

    // Re-execute step
    await this.executeCurrentStep(context);
  }

  /**
   * Calculate backoff delay for retries
   * NASA Rule 10: Keep function under 60 lines
   */
  private calculateBackoffDelay(retryPolicy: any): number {
    const baseDelay = retryPolicy.backoffMs;
    const multiplier = retryPolicy.backoffMultiplier || 2;
    return baseDelay * Math.pow(multiplier, this.retryCount - 1);
  }

  /**
   * Record step completion metrics
   * NASA Rule 10: Keep function under 60 lines
   */
  private recordStepCompletion(context: MigrationContext): void {
    if (!context.currentStep) {
      return;
    }

    const stepResult = this.getStepResult(context);
    if (!stepResult) {
      return;
    }

    const metrics = {
      duration: stepResult.duration,
      retryCount: stepResult.retryCount,
      success: stepResult.success
    };

    context.globalContext.set(`step_${context.currentStep.id}_metrics`, metrics);

    this.logger.debug('Step completion recorded', {
      executionId: context.executionId,
      stepId: context.currentStep.id,
      ...metrics
    });
  }

  /**
   * Advance to next step index
   * NASA Rule 10: Keep function under 60 lines
   */
  private advanceStepIndex(context: MigrationContext): void {
    context.currentStepIndex++;
    context.currentStep = undefined;

    this.logger.debug('Advanced to next step', {
      executionId: context.executionId,
      newStepIndex: context.currentStepIndex
    });
  }
}