/**
 * Executing Phase State Handler - NASA Rule 10 Compliant
 * Manages phase execution lifecycle
 */

import { Logger } from '../../../utils/Logger';
import { StateHandler, MigrationContext, MigrationEvent } from '../types/MigrationFSMTypes';

export class ExecutingPhaseState implements StateHandler {
  private logger: Logger;
  private phaseStartTime: Date;

  constructor() {
    this.logger = new Logger('ExecutingPhaseState');
    this.phaseStartTime = new Date();
  }

  /**
   * Initialize phase execution
   * NASA Rule 10: Keep function under 60 lines
   */
  async onEnter(context: MigrationContext): Promise<void> {
    this.phaseStartTime = new Date();

    this.logger.info('Entering phase execution state', {
      executionId: context.executionId,
      phaseIndex: context.currentPhaseIndex
    });

    // Set current phase
    this.setCurrentPhase(context);

    // Validate phase prerequisites
    await this.validatePhasePrerequisites(context);

    // Initialize phase execution
    this.initializePhaseExecution(context);

    // Notify callbacks
    await this.notifyPhaseStart(context);
  }

  /**
   * Cleanup phase execution state
   * NASA Rule 10: Keep function under 60 lines
   */
  async onExit(context: MigrationContext): Promise<void> {
    this.logger.info('Exiting phase execution state', {
      executionId: context.executionId,
      phaseId: context.currentPhase?.id
    });

    // Record phase completion metrics
    this.recordPhaseMetrics(context);

    // Cleanup phase-specific data
    this.cleanupPhaseData(context);
  }

  /**
   * Process phase execution tick
   * NASA Rule 10: Keep function under 60 lines
   */
  async tick(context: MigrationContext): Promise<MigrationEvent | null> {
    if (!context.currentPhase) {
      return MigrationEvent.PHASE_FAILED;
    }

    // Check for phase timeout
    if (this.isPhaseTimeout(context)) {
      context.error = new Error('Phase execution timeout');
      return MigrationEvent.PHASE_FAILED;
    }

    // Check if all steps are completed
    if (this.areAllStepsCompleted(context)) {
      return MigrationEvent.PHASE_COMPLETED;
    }

    // Check if next step is ready
    if (this.isNextStepReady(context)) {
      return MigrationEvent.STEP_STARTED;
    }

    return null;
  }

  /**
   * Check if can exit phase execution
   * NASA Rule 10: Keep function under 60 lines
   */
  canExit(context: MigrationContext): boolean {
    // Can exit if phase is completed or failed
    if (!context.currentPhase) {
      return true;
    }

    // Check if all steps have results
    const totalSteps = context.currentPhase.steps.length;
    const completedSteps = context.stepResults.filter(r =>
      context.currentPhase!.steps.some(s => s.id === r.stepId)
    ).length;

    return completedSteps === totalSteps;
  }

  /**
   * Set current phase from context
   * NASA Rule 10: Keep function under 60 lines
   */
  private setCurrentPhase(context: MigrationContext): void {
    if (context.currentPhaseIndex >= context.plan.phases.length) {
      throw new Error('Phase index out of bounds');
    }

    context.currentPhase = context.plan.phases[context.currentPhaseIndex];
    context.currentStepIndex = 0;

    this.logger.debug('Current phase set', {
      executionId: context.executionId,
      phaseId: context.currentPhase.id,
      phaseIndex: context.currentPhaseIndex
    });
  }

  /**
   * Validate phase prerequisites
   * NASA Rule 10: Keep function under 60 lines
   */
  private async validatePhasePrerequisites(context: MigrationContext): Promise<void> {
    if (!context.currentPhase) {
      throw new Error('Current phase not set');
    }

    for (const prerequisite of context.currentPhase.prerequisites) {
      const prerequisiteResult = context.phaseResults.get(prerequisite);

      if (!prerequisiteResult) {
        throw new Error(`Prerequisite phase ${prerequisite} not found`);
      }

      if (!prerequisiteResult.success) {
        throw new Error(`Prerequisite phase ${prerequisite} not completed successfully`);
      }
    }

    this.logger.debug('Phase prerequisites validated', {
      executionId: context.executionId,
      phaseId: context.currentPhase.id,
      prerequisites: context.currentPhase.prerequisites.length
    });
  }

  /**
   * Initialize phase execution state
   * NASA Rule 10: Keep function under 60 lines
   */
  private initializePhaseExecution(context: MigrationContext): void {
    if (!context.currentPhase) {
      throw new Error('Current phase not set');
    }

    // Reset step index
    context.currentStepIndex = 0;

    // Clear previous step results for this phase
    context.stepResults = context.stepResults.filter(r =>
      !context.currentPhase!.steps.some(s => s.id === r.stepId)
    );

    // Set phase start time in global context
    context.globalContext.set(`phase_${context.currentPhase.id}_start`, this.phaseStartTime);

    this.logger.debug('Phase execution initialized', {
      executionId: context.executionId,
      phaseId: context.currentPhase.id,
      stepsCount: context.currentPhase.steps.length
    });
  }

  /**
   * Notify phase start callbacks
   * NASA Rule 10: Keep function under 60 lines
   */
  private async notifyPhaseStart(context: MigrationContext): Promise<void> {
    if (!context.currentPhase || !context.callbacks.onPhaseStart) {
      return;
    }

    try {
      await context.callbacks.onPhaseStart(context.currentPhase, context);

      this.logger.debug('Phase start callback completed', {
        executionId: context.executionId,
        phaseId: context.currentPhase.id
      });

    } catch (error) {
      this.logger.warn('Phase start callback failed', {
        executionId: context.executionId,
        phaseId: context.currentPhase.id,
        error: error.message
      });
    }
  }

  /**
   * Check if phase has timed out
   * NASA Rule 10: Keep function under 60 lines
   */
  private isPhaseTimeout(context: MigrationContext): boolean {
    if (!context.currentPhase) {
      return false;
    }

    const elapsed = Date.now() - this.phaseStartTime.getTime();
    const timeout = context.currentPhase.estimatedDuration * 2; // 200% buffer

    return elapsed > timeout;
  }

  /**
   * Check if all steps in phase are completed
   * NASA Rule 10: Keep function under 60 lines
   */
  private areAllStepsCompleted(context: MigrationContext): boolean {
    if (!context.currentPhase) {
      return false;
    }

    const totalSteps = context.currentPhase.steps.length;
    const completedSteps = context.stepResults.filter(r =>
      context.currentPhase!.steps.some(s => s.id === r.stepId)
    ).length;

    return completedSteps === totalSteps;
  }

  /**
   * Check if next step is ready for execution
   * NASA Rule 10: Keep function under 60 lines
   */
  private isNextStepReady(context: MigrationContext): boolean {
    if (!context.currentPhase) {
      return false;
    }

    // Check if we have more steps to execute
    if (context.currentStepIndex >= context.currentPhase.steps.length) {
      return false;
    }

    const nextStep = context.currentPhase.steps[context.currentStepIndex];

    // Check if step is already completed
    const stepResult = context.stepResults.find(r => r.stepId === nextStep.id);
    if (stepResult) {
      context.currentStepIndex++;
      return this.isNextStepReady(context);
    }

    // Check step dependencies
    return this.areStepDependenciesMet(nextStep, context);
  }

  /**
   * Check if step dependencies are satisfied
   * NASA Rule 10: Keep function under 60 lines
   */
  private areStepDependenciesMet(step: any, context: MigrationContext): boolean {
    if (!step.dependsOn || step.dependsOn.length === 0) {
      return true;
    }

    for (const dependency of step.dependsOn) {
      const dependencyResult = context.stepResults.find(r => r.stepId === dependency);

      if (!dependencyResult || !dependencyResult.success) {
        return false;
      }
    }

    return true;
  }

  /**
   * Record phase execution metrics
   * NASA Rule 10: Keep function under 60 lines
   */
  private recordPhaseMetrics(context: MigrationContext): void {
    if (!context.currentPhase) {
      return;
    }

    const elapsed = Date.now() - this.phaseStartTime.getTime();
    const phaseSteps = context.stepResults.filter(r =>
      context.currentPhase!.steps.some(s => s.id === r.stepId)
    );

    const metrics = {
      executionTime: elapsed,
      completedSteps: phaseSteps.length,
      successfulSteps: phaseSteps.filter(r => r.success).length,
      totalSteps: context.currentPhase.steps.length
    };

    context.globalContext.set(`phase_${context.currentPhase.id}_metrics`, metrics);

    this.logger.info('Phase metrics recorded', {
      executionId: context.executionId,
      phaseId: context.currentPhase.id,
      ...metrics
    });
  }

  /**
   * Cleanup phase-specific data
   * NASA Rule 10: Keep function under 60 lines
   */
  private cleanupPhaseData(context: MigrationContext): void {
    if (!context.currentPhase) {
      return;
    }

    // Remove temporary phase data from global context
    const keysToRemove: string[] = [];
    const phasePrefix = `temp_phase_${context.currentPhase.id}_`;

    for (const [key] of context.globalContext) {
      if (key.startsWith(phasePrefix)) {
        keysToRemove.push(key);
      }
    }

    for (const key of keysToRemove) {
      context.globalContext.delete(key);
    }

    this.logger.debug('Phase data cleaned up', {
      executionId: context.executionId,
      phaseId: context.currentPhase.id,
      removedKeys: keysToRemove.length
    });
  }
}