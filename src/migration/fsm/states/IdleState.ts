/**
 * Idle State Handler - NASA Rule 10 Compliant
 * Handles migration orchestrator when no execution is active
 */

import { Logger } from '../../../utils/Logger';
import { StateHandler, MigrationContext, MigrationEvent } from '~types/MigrationFSMTypes';

export class IdleState implements StateHandler {
  private logger: Logger;

  constructor() {
    this.logger = new Logger('IdleState');
  }

  /**
   * Initialize idle state
   * NASA Rule 10: Keep function under 60 lines
   */
  async onEnter(context: MigrationContext): Promise<void> {
    this.logger.info('Entering idle state', {
      executionId: context.executionId
    });

    // Reset execution state
    this.resetExecutionState(context);

    // Clear any temporary data
    this.clearTemporaryData(context);

    // Log idle state entry
    this.logStateEntry(context);
  }

  /**
   * Cleanup on exit from idle state
   * NASA Rule 10: Keep function under 60 lines
   */
  async onExit(context: MigrationContext): Promise<void> {
    this.logger.info('Exiting idle state', {
      executionId: context.executionId
    });

    // Validate context is ready for execution
    this.validateExecutionReadiness(context);
  }

  /**
   * Check for external events in idle state
   * NASA Rule 10: Keep function under 60 lines
   */
  async tick(context: MigrationContext): Promise<MigrationEvent | null> {
    // Check for pending executions
    const hasPendingExecution = this.checkPendingExecution(context);
    if (hasPendingExecution) {
      return MigrationEvent.START_EXECUTION;
    }

    // Check for maintenance tasks
    const needsMaintenance = this.checkMaintenanceNeeds(context);
    if (needsMaintenance) {
      await this.performMaintenance(context);
    }

    return null;
  }

  /**
   * Always allow exit from idle state
   * NASA Rule 10: Simple function
   */
  canExit(context: MigrationContext): boolean {
    return true;
  }

  /**
   * Reset execution state to defaults
   * NASA Rule 10: Keep function under 60 lines
   */
  private resetExecutionState(context: MigrationContext): void {
    context.currentPhaseIndex = 0;
    context.currentStepIndex = 0;
    context.currentPhase = undefined;
    context.currentStep = undefined;
    context.stepResults = [];
    context.error = undefined;
    context.rollbackData = undefined;

    this.logger.debug('Execution state reset', {
      executionId: context.executionId
    });
  }

  /**
   * Clear temporary execution data
   * NASA Rule 10: Keep function under 60 lines
   */
  private clearTemporaryData(context: MigrationContext): void {
    // Clear non-essential global context items
    const essentialKeys = ['config', 'credentials', 'registry'];
    const keysToRemove: string[] = [];

    for (const [key] of context.globalContext) {
      if (!essentialKeys.includes(key)) {
        keysToRemove.push(key);
      }
    }

    for (const key of keysToRemove) {
      context.globalContext.delete(key);
    }

    this.logger.debug('Temporary data cleared', {
      executionId: context.executionId,
      removedKeys: keysToRemove.length
    });
  }

  /**
   * Log idle state entry with metrics
   * NASA Rule 10: Keep function under 60 lines
   */
  private logStateEntry(context: MigrationContext): void {
    const now = new Date();
    const timeSinceStart = now.getTime() - context.startTime.getTime();

    this.logger.info('Idle state entered', {
      executionId: context.executionId,
      timeSinceStart: `${timeSinceStart}ms`,
      phaseResults: context.phaseResults.size,
      globalContextSize: context.globalContext.size
    });
  }

  /**
   * Validate context is ready for execution
   * NASA Rule 10: Keep function under 60 lines
   */
  private validateExecutionReadiness(context: MigrationContext): void {
    if (!context.plan) {
      throw new Error('Migration plan not set');
    }

    if (!context.plan.phases || context.plan.phases.length === 0) {
      throw new Error('No migration phases defined');
    }

    if (!context.executionId) {
      throw new Error('Execution ID not set');
    }

    this.logger.debug('Execution readiness validated', {
      executionId: context.executionId,
      phases: context.plan.phases.length
    });
  }

  /**
   * Check for pending executions
   * NASA Rule 10: Keep function under 60 lines
   */
  private checkPendingExecution(context: MigrationContext): boolean {
    // Check if plan has phases to execute
    if (!context.plan?.phases?.length) {
      return false;
    }

    // Check if all phases are already completed
    const completedPhases = context.phaseResults.size;
    const totalPhases = context.plan.phases.length;

    return completedPhases < totalPhases;
  }

  /**
   * Check if maintenance tasks are needed
   * NASA Rule 10: Keep function under 60 lines
   */
  private checkMaintenanceNeeds(context: MigrationContext): boolean {
    const now = new Date();
    const timeSinceStart = now.getTime() - context.startTime.getTime();
    const oneHour = 60 * 60 * 1000;

    // Perform maintenance after 1 hour of idle time
    return timeSinceStart > oneHour;
  }

  /**
   * Perform maintenance tasks
   * NASA Rule 10: Keep function under 60 lines
   */
  private async performMaintenance(context: MigrationContext): Promise<void> {
    this.logger.info('Performing maintenance tasks', {
      executionId: context.executionId
    });

    // Cleanup old phase results (keep last 10)
    this.cleanupOldResults(context);

    // Compact global context
    this.compactGlobalContext(context);

    this.logger.info('Maintenance completed', {
      executionId: context.executionId
    });
  }

  /**
   * Cleanup old phase results
   * NASA Rule 10: Keep function under 60 lines
   */
  private cleanupOldResults(context: MigrationContext): void {
    const maxResults = 10;
    const resultEntries = Array.from(context.phaseResults.entries());

    if (resultEntries.length > maxResults) {
      // Sort by end time and keep most recent
      const sortedResults = resultEntries.sort((a, b) =>
        b[1].endTime.getTime() - a[1].endTime.getTime()
      );

      const toKeep = sortedResults.slice(0, maxResults);
      context.phaseResults.clear();

      for (const [key, value] of toKeep) {
        context.phaseResults.set(key, value);
      }

      this.logger.debug('Phase results cleaned up', {
        executionId: context.executionId,
        before: resultEntries.length,
        after: context.phaseResults.size
      });
    }
  }

  /**
   * Compact global context by removing large objects
   * NASA Rule 10: Keep function under 60 lines
   */
  private compactGlobalContext(context: MigrationContext): void {
    const maxSize = 1000; // arbitrary size limit
    let removed = 0;

    for (const [key, value] of context.globalContext) {
      const serializedSize = JSON.stringify(value).length;

      if (serializedSize > maxSize) {
        context.globalContext.delete(key);
        removed++;
      }
    }

    if (removed > 0) {
      this.logger.debug('Global context compacted', {
        executionId: context.executionId,
        removedItems: removed
      });
    }
  }
}