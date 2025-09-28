/**
 * Rolling Back State Handler - NASA Rule 10 Compliant
 * Manages rollback operations for failed migrations
 */

import { Logger } from '../../../utils/Logger';
import { StateHandler, MigrationContext, MigrationEvent, RollbackAction } from '../types/MigrationFSMTypes';

export class RollingBackState implements StateHandler {
  private logger: Logger;
  private rollbackStartTime: Date;
  private currentActionIndex: number;

  constructor() {
    this.logger = new Logger('RollingBackState');
    this.rollbackStartTime = new Date();
    this.currentActionIndex = 0;
  }

  /**
   * Initialize rollback process
   * NASA Rule 10: Keep function under 60 lines
   */
  async onEnter(context: MigrationContext): Promise<void> {
    this.rollbackStartTime = new Date();
    this.currentActionIndex = 0;

    this.logger.info('Entering rollback state', {
      executionId: context.executionId,
      errorMessage: context.error?.message
    });

    // Prepare rollback strategy
    await this.prepareRollbackStrategy(context);

    // Initialize rollback execution
    this.initializeRollbackExecution(context);

    // Start rollback process
    await this.startRollbackProcess(context);
  }

  /**
   * Cleanup rollback state
   * NASA Rule 10: Keep function under 60 lines
   */
  async onExit(context: MigrationContext): Promise<void> {
    this.logger.info('Exiting rollback state', {
      executionId: context.executionId,
      rollbackDuration: Date.now() - this.rollbackStartTime.getTime()
    });

    // Record rollback completion
    this.recordRollbackCompletion(context);

    // Cleanup rollback data
    this.cleanupRollbackData(context);
  }

  /**
   * Process rollback execution tick
   * NASA Rule 10: Keep function under 60 lines
   */
  async tick(context: MigrationContext): Promise<MigrationEvent | null> {
    if (!context.rollbackData) {
      return MigrationEvent.ROLLBACK_COMPLETED;
    }

    // Check for rollback timeout
    if (this.isRollbackTimeout(context)) {
      this.logger.error('Rollback timeout exceeded', {
        executionId: context.executionId,
        elapsed: Date.now() - this.rollbackStartTime.getTime()
      });
      return MigrationEvent.EXECUTION_FAILED;
    }

    // Check if all rollback actions are completed
    if (this.areAllActionsCompleted(context)) {
      return MigrationEvent.ROLLBACK_COMPLETED;
    }

    // Process next rollback action
    await this.processNextAction(context);

    return null;
  }

  /**
   * Check if can exit rollback state
   * NASA Rule 10: Keep function under 60 lines
   */
  canExit(context: MigrationContext): boolean {
    if (!context.rollbackData) {
      return true;
    }

    // Can exit if all actions are processed
    return this.currentActionIndex >= context.rollbackData.rollbackActions.length;
  }

  /**
   * Prepare rollback strategy based on current state
   * NASA Rule 10: Keep function under 60 lines
   */
  private async prepareRollbackStrategy(context: MigrationContext): Promise<void> {
    if (context.rollbackData) {
      this.logger.debug('Using existing rollback data', {
        executionId: context.executionId,
        actionCount: context.rollbackData.rollbackActions.length
      });
      return;
    }

    // Create rollback strategy from completed steps
    const rollbackActions = this.createRollbackActions(context);

    context.rollbackData = {
      rollbackType: this.determineRollbackType(context),
      rollbackActions,
      preservedState: this.preserveCurrentState(context),
      dependencies: this.extractDependencies(context)
    };

    this.logger.info('Rollback strategy prepared', {
      executionId: context.executionId,
      rollbackType: context.rollbackData.rollbackType,
      actionCount: rollbackActions.length
    });
  }

  /**
   * Create rollback actions from completed steps
   * NASA Rule 10: Keep function under 60 lines
   */
  private createRollbackActions(context: MigrationContext): RollbackAction[] {
    const rollbackActions: RollbackAction[] = [];

    // Get successful step results in reverse order
    const successfulSteps = context.stepResults
      .filter(r => r.success)
      .reverse();

    for (let i = 0; i < successfulSteps.length; i++) {
      const stepResult = successfulSteps[i];
      const step = this.findStepById(context, stepResult.stepId);

      if (step?.rollbackAction) {
        rollbackActions.push({
          id: `rollback_${step.id}`,
          type: 'revert',
          action: step.rollbackAction,
          parameters: step.parameters,
          order: i,
          timeout: step.timeout,
          critical: this.isStepCritical(step)
        });
      }
    }

    return rollbackActions;
  }

  /**
   * Find step by ID in migration plan
   * NASA Rule 10: Keep function under 60 lines
   */
  private findStepById(context: MigrationContext, stepId: string): any {
    for (const phase of context.plan.phases) {
      const step = phase.steps.find(s => s.id === stepId);
      if (step) {
        return step;
      }
    }
    return null;
  }

  /**
   * Determine rollback type based on failure point
   * NASA Rule 10: Keep function under 60 lines
   */
  private determineRollbackType(context: MigrationContext): 'step' | 'phase' | 'full' {
    const completedPhases = context.phaseResults.size;
    const totalPhases = context.plan.phases.length;

    if (completedPhases === 0) {
      return 'step';
    } else if (completedPhases < totalPhases / 2) {
      return 'phase';
    } else {
      return 'full';
    }
  }

  /**
   * Preserve current state for rollback
   * NASA Rule 10: Keep function under 60 lines
   */
  private preserveCurrentState(context: MigrationContext): any {
    return {
      phaseIndex: context.currentPhaseIndex,
      stepIndex: context.currentStepIndex,
      phaseResults: Array.from(context.phaseResults.entries()),
      stepResults: [...context.stepResults],
      errorContext: {
        message: context.error?.message,
        stack: context.error?.stack,
        timestamp: new Date()
      }
    };
  }

  /**
   * Extract dependencies for rollback
   * NASA Rule 10: Keep function under 60 lines
   */
  private extractDependencies(context: MigrationContext): string[] {
    const dependencies: string[] = [];

    // Add completed phases as dependencies
    for (const [phaseId] of context.phaseResults) {
      dependencies.push(phaseId);
    }

    return dependencies;
  }

  /**
   * Initialize rollback execution state
   * NASA Rule 10: Keep function under 60 lines
   */
  private initializeRollbackExecution(context: MigrationContext): void {
    this.currentActionIndex = 0;

    // Set rollback start time in global context
    context.globalContext.set('rollback_start_time', this.rollbackStartTime);

    // Initialize rollback metrics
    context.globalContext.set('rollback_metrics', {
      actionsTotal: context.rollbackData?.rollbackActions.length || 0,
      actionsCompleted: 0,
      actionsFailed: 0
    });

    this.logger.debug('Rollback execution initialized', {
      executionId: context.executionId,
      totalActions: context.rollbackData?.rollbackActions.length || 0
    });
  }

  /**
   * Start rollback process
   * NASA Rule 10: Keep function under 60 lines
   */
  private async startRollbackProcess(context: MigrationContext): Promise<void> {
    if (!context.rollbackData || context.rollbackData.rollbackActions.length === 0) {
      this.logger.info('No rollback actions to execute', {
        executionId: context.executionId
      });
      return;
    }

    this.logger.info('Starting rollback process', {
      executionId: context.executionId,
      actionCount: context.rollbackData.rollbackActions.length,
      rollbackType: context.rollbackData.rollbackType
    });

    // Process first action
    await this.processNextAction(context);
  }

  /**
   * Process next rollback action
   * NASA Rule 10: Keep function under 60 lines
   */
  private async processNextAction(context: MigrationContext): Promise<void> {
    if (!context.rollbackData || this.currentActionIndex >= context.rollbackData.rollbackActions.length) {
      return;
    }

    const action = context.rollbackData.rollbackActions[this.currentActionIndex];

    this.logger.info('Executing rollback action', {
      executionId: context.executionId,
      actionId: action.id,
      actionType: action.type,
      actionIndex: this.currentActionIndex
    });

    try {
      await this.executeRollbackAction(action, context);
      this.recordActionSuccess(context, action);

    } catch (error) {
      this.logger.error('Rollback action failed', {
        executionId: context.executionId,
        actionId: action.id,
        error: error.message
      });

      this.recordActionFailure(context, action, error);

      if (action.critical) {
        throw new Error(`Critical rollback action failed: ${action.id}`);
      }
    } finally {
      this.currentActionIndex++;
    }
  }

  /**
   * Execute individual rollback action
   * NASA Rule 10: Keep function under 60 lines
   */
  private async executeRollbackAction(action: RollbackAction, context: MigrationContext): Promise<void> {
    // Get rollback executor (would be injected in real implementation)
    const executor = this.getRollbackExecutor(action.type);

    // Execute with timeout
    const executePromise = executor.execute(action, context);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Rollback action timeout')), action.timeout)
    );

    await Promise.race([executePromise, timeoutPromise]);
  }

  /**
   * Get rollback executor for action type
   * NASA Rule 10: Keep function under 60 lines
   */
  private getRollbackExecutor(actionType: string): any {
    // In real implementation, this would be injected
    return {
      execute: async (action: RollbackAction, context: MigrationContext) => {
        // Simulate rollback execution
        await new Promise(resolve => setTimeout(resolve, 100));
        return { result: 'rollback_success', action: action.action };
      }
    };
  }

  /**
   * Record successful action completion
   * NASA Rule 10: Keep function under 60 lines
   */
  private recordActionSuccess(context: MigrationContext, action: RollbackAction): void {
    const metrics = context.globalContext.get('rollback_metrics') || {};
    metrics.actionsCompleted = (metrics.actionsCompleted || 0) + 1;
    context.globalContext.set('rollback_metrics', metrics);

    this.logger.debug('Rollback action completed', {
      executionId: context.executionId,
      actionId: action.id,
      progress: `${metrics.actionsCompleted}/${metrics.actionsTotal}`
    });
  }

  /**
   * Record failed action
   * NASA Rule 10: Keep function under 60 lines
   */
  private recordActionFailure(context: MigrationContext, action: RollbackAction, error: Error): void {
    const metrics = context.globalContext.get('rollback_metrics') || {};
    metrics.actionsFailed = (metrics.actionsFailed || 0) + 1;
    context.globalContext.set('rollback_metrics', metrics);

    // Store failure details
    context.globalContext.set(`rollback_failure_${action.id}`, {
      actionId: action.id,
      error: error.message,
      timestamp: new Date(),
      critical: action.critical
    });
  }

  /**
   * Check if rollback has timed out
   * NASA Rule 10: Keep function under 60 lines
   */
  private isRollbackTimeout(context: MigrationContext): boolean {
    const maxRollbackTime = 30 * 60 * 1000; // 30 minutes
    const elapsed = Date.now() - this.rollbackStartTime.getTime();
    return elapsed > maxRollbackTime;
  }

  /**
   * Check if all rollback actions are completed
   * NASA Rule 10: Keep function under 60 lines
   */
  private areAllActionsCompleted(context: MigrationContext): boolean {
    if (!context.rollbackData) {
      return true;
    }

    return this.currentActionIndex >= context.rollbackData.rollbackActions.length;
  }

  /**
   * Check if step is critical for rollback
   * NASA Rule 10: Keep function under 60 lines
   */
  private isStepCritical(step: any): boolean {
    // Consider backup and deployment steps as critical
    const criticalActions = ['backup', 'deploy', 'cutover'];
    return criticalActions.some(action => step.action.includes(action));
  }

  /**
   * Record rollback completion metrics
   * NASA Rule 10: Keep function under 60 lines
   */
  private recordRollbackCompletion(context: MigrationContext): void {
    const duration = Date.now() - this.rollbackStartTime.getTime();
    const metrics = context.globalContext.get('rollback_metrics') || {};

    const completionRecord = {
      duration,
      actionsTotal: metrics.actionsTotal || 0,
      actionsCompleted: metrics.actionsCompleted || 0,
      actionsFailed: metrics.actionsFailed || 0,
      successRate: metrics.actionsTotal > 0 ?
        ((metrics.actionsCompleted || 0) / metrics.actionsTotal) * 100 : 100
    };

    context.globalContext.set('rollback_completion', completionRecord);

    this.logger.info('Rollback completion recorded', {
      executionId: context.executionId,
      ...completionRecord
    });
  }

  /**
   * Cleanup rollback data
   * NASA Rule 10: Keep function under 60 lines
   */
  private cleanupRollbackData(context: MigrationContext): void {
    // Remove temporary rollback data from global context
    const keysToRemove: string[] = [];
    const rollbackPrefix = 'temp_rollback_';

    for (const [key] of context.globalContext) {
      if (key.startsWith(rollbackPrefix)) {
        keysToRemove.push(key);
      }
    }

    for (const key of keysToRemove) {
      context.globalContext.delete(key);
    }

    this.logger.debug('Rollback data cleaned up', {
      executionId: context.executionId,
      removedKeys: keysToRemove.length
    });
  }
}