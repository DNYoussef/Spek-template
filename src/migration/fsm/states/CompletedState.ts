/**
 * Completed State Handler - NASA Rule 10 Compliant
 * Manages successful migration completion
 */

import { Logger } from '../../../utils/Logger';
import { StateHandler, MigrationContext, MigrationEvent } from '../types/MigrationFSMTypes';

export class CompletedState implements StateHandler {
  private logger: Logger;

  constructor() {
    this.logger = new Logger('CompletedState');
  }

  /**
   * Initialize completed state
   * NASA Rule 10: Keep function under 60 lines
   */
  async onEnter(context: MigrationContext): Promise<void> {
    this.logger.info('Entering completed state', {
      executionId: context.executionId,
      totalPhases: context.plan.phases.length,
      completedPhases: context.phaseResults.size
    });

    // Record completion metrics
    this.recordCompletionMetrics(context);

    // Generate completion report
    await this.generateCompletionReport(context);

    // Notify completion callbacks
    await this.notifyCompletion(context);

    // Cleanup temporary resources
    this.cleanupTemporaryResources(context);
  }

  /**
   * Cleanup on exit from completed state
   * NASA Rule 10: Keep function under 60 lines
   */
  async onExit(context: MigrationContext): Promise<void> {
    this.logger.info('Exiting completed state', {
      executionId: context.executionId
    });

    // Archive execution data
    this.archiveExecutionData(context);
  }

  /**
   * Completed state is terminal - no tick processing needed
   * NASA Rule 10: Simple function
   */
  async tick(context: MigrationContext): Promise<MigrationEvent | null> {
    return null;
  }

  /**
   * Allow exit for state transitions or restarts
   * NASA Rule 10: Simple function
   */
  canExit(context: MigrationContext): boolean {
    return true;
  }

  /**
   * Record comprehensive completion metrics
   * NASA Rule 10: Keep function under 60 lines
   */
  private recordCompletionMetrics(context: MigrationContext): void {
    const endTime = new Date();
    const totalDuration = endTime.getTime() - context.startTime.getTime();

    const metrics = {
      executionId: context.executionId,
      startTime: context.startTime,
      endTime,
      totalDuration,
      totalPhases: context.plan.phases.length,
      completedPhases: context.phaseResults.size,
      totalSteps: this.calculateTotalSteps(context),
      completedSteps: context.stepResults.length,
      successfulSteps: context.stepResults.filter(r => r.success).length,
      overallSuccessRate: this.calculateSuccessRate(context),
      phaseMetrics: this.aggregatePhaseMetrics(context)
    };

    context.globalContext.set('completion_metrics', metrics);

    this.logger.info('Completion metrics recorded', {
      executionId: context.executionId,
      duration: `${totalDuration}ms`,
      successRate: `${metrics.overallSuccessRate}%`
    });
  }

  /**
   * Calculate total steps across all phases
   * NASA Rule 10: Keep function under 60 lines
   */
  private calculateTotalSteps(context: MigrationContext): number {
    return context.plan.phases.reduce((total, phase) => total + phase.steps.length, 0);
  }

  /**
   * Calculate overall success rate
   * NASA Rule 10: Keep function under 60 lines
   */
  private calculateSuccessRate(context: MigrationContext): number {
    if (context.stepResults.length === 0) {
      return 100;
    }

    const successfulSteps = context.stepResults.filter(r => r.success).length;
    return Math.round((successfulSteps / context.stepResults.length) * 100);
  }

  /**
   * Aggregate metrics from all phases
   * NASA Rule 10: Keep function under 60 lines
   */
  private aggregatePhaseMetrics(context: MigrationContext): any {
    const phaseMetrics = {
      totalExecutionTime: 0,
      totalRetries: 0,
      totalErrors: 0,
      averageValidationScore: 0,
      phaseDurations: new Map<string, number>()
    };

    for (const [phaseId, result] of context.phaseResults) {
      phaseMetrics.totalExecutionTime += result.duration;
      phaseMetrics.totalRetries += result.metrics.retryCount;
      phaseMetrics.totalErrors += result.metrics.errorCount;
      phaseMetrics.phaseDurations.set(phaseId, result.duration);
    }

    // Calculate average validation score
    const allValidationScores = Array.from(context.phaseResults.values())
      .map(r => r.metrics.validationScore);

    if (allValidationScores.length > 0) {
      phaseMetrics.averageValidationScore = Math.round(
        allValidationScores.reduce((sum, score) => sum + score, 0) / allValidationScores.length
      );
    }

    return phaseMetrics;
  }

  /**
   * Generate comprehensive completion report
   * NASA Rule 10: Keep function under 60 lines
   */
  private async generateCompletionReport(context: MigrationContext): Promise<void> {
    const metrics = context.globalContext.get('completion_metrics');
    if (!metrics) {
      return;
    }

    const report = {
      summary: this.generateSummary(metrics),
      phaseResults: this.generatePhaseReport(context),
      stepResults: this.generateStepReport(context),
      artifacts: this.collectArtifacts(context),
      recommendations: this.generateRecommendations(context)
    };

    context.globalContext.set('completion_report', report);

    this.logger.info('Completion report generated', {
      executionId: context.executionId,
      reportSections: Object.keys(report).length
    });
  }

  /**
   * Generate execution summary
   * NASA Rule 10: Keep function under 60 lines
   */
  private generateSummary(metrics: any): any {
    return {
      status: 'COMPLETED',
      executionId: metrics.executionId,
      duration: this.formatDuration(metrics.totalDuration),
      phases: `${metrics.completedPhases}/${metrics.totalPhases}`,
      steps: `${metrics.successfulSteps}/${metrics.totalSteps}`,
      successRate: `${metrics.overallSuccessRate}%`,
      startTime: metrics.startTime.toISOString(),
      endTime: metrics.endTime.toISOString()
    };
  }

  /**
   * Generate phase-level report
   * NASA Rule 10: Keep function under 60 lines
   */
  private generatePhaseReport(context: MigrationContext): any[] {
    const phaseReports: any[] = [];

    for (const [phaseId, result] of context.phaseResults) {
      phaseReports.push({
        phaseId,
        success: result.success,
        duration: this.formatDuration(result.duration),
        stepsTotal: result.stepResults.length,
        stepsSuccessful: result.stepResults.filter(r => r.success).length,
        artifacts: result.artifacts.length,
        validationScore: result.metrics.validationScore,
        retries: result.metrics.retryCount,
        errors: result.metrics.errorCount
      });
    }

    return phaseReports;
  }

  /**
   * Generate step-level report
   * NASA Rule 10: Keep function under 60 lines
   */
  private generateStepReport(context: MigrationContext): any[] {
    return context.stepResults.map(result => ({
      stepId: result.stepId,
      success: result.success,
      duration: this.formatDuration(result.duration),
      retries: result.retryCount,
      validations: result.validationResults.length,
      validationsPassed: result.validationResults.filter(v => v.passed).length,
      artifacts: result.artifacts.length,
      error: result.error?.message
    }));
  }

  /**
   * Collect all execution artifacts
   * NASA Rule 10: Keep function under 60 lines
   */
  private collectArtifacts(context: MigrationContext): any[] {
    const allArtifacts: any[] = [];

    // Collect artifacts from phase results
    for (const result of context.phaseResults.values()) {
      allArtifacts.push(...result.artifacts);
    }

    // Collect artifacts from step results
    for (const result of context.stepResults) {
      allArtifacts.push(...result.artifacts);
    }

    return allArtifacts.map(artifact => ({
      type: artifact.type,
      name: artifact.name,
      path: artifact.path,
      checksum: artifact.checksum,
      size: artifact.metadata?.size || 'unknown',
      createdAt: artifact.createdAt.toISOString()
    }));
  }

  /**
   * Generate recommendations for future migrations
   * NASA Rule 10: Keep function under 60 lines
   */
  private generateRecommendations(context: MigrationContext): string[] {
    const recommendations: string[] = [];
    const metrics = context.globalContext.get('completion_metrics');

    if (!metrics) {
      return recommendations;
    }

    // Performance recommendations
    if (metrics.totalDuration > 60 * 60 * 1000) { // > 1 hour
      recommendations.push('Consider optimizing phase execution for better performance');
    }

    // Retry recommendations
    const avgRetries = metrics.phaseMetrics.totalRetries / metrics.completedPhases;
    if (avgRetries > 2) {
      recommendations.push('Review retry policies to reduce execution overhead');
    }

    // Validation recommendations
    if (metrics.phaseMetrics.averageValidationScore < 90) {
      recommendations.push('Improve validation checks to ensure higher quality');
    }

    // Success rate recommendations
    if (metrics.overallSuccessRate < 95) {
      recommendations.push('Investigate failed steps to improve future success rates');
    }

    return recommendations;
  }

  /**
   * Notify completion callbacks
   * NASA Rule 10: Keep function under 60 lines
   */
  private async notifyCompletion(context: MigrationContext): Promise<void> {
    try {
      // Emit completion event
      const completionEvent = {
        executionId: context.executionId,
        status: 'completed',
        timestamp: new Date(),
        summary: context.globalContext.get('completion_metrics')
      };

      // Store completion event for external consumption
      context.globalContext.set('completion_event', completionEvent);

      this.logger.info('Completion notification sent', {
        executionId: context.executionId
      });

    } catch (error) {
      this.logger.warn('Completion notification failed', {
        executionId: context.executionId,
        error: error.message
      });
    }
  }

  /**
   * Cleanup temporary resources
   * NASA Rule 10: Keep function under 60 lines
   */
  private cleanupTemporaryResources(context: MigrationContext): void {
    const keysToRemove: string[] = [];
    const tempPrefixes = ['temp_', 'cache_', 'buffer_'];

    for (const [key] of context.globalContext) {
      if (tempPrefixes.some(prefix => key.startsWith(prefix))) {
        keysToRemove.push(key);
      }
    }

    for (const key of keysToRemove) {
      context.globalContext.delete(key);
    }

    this.logger.debug('Temporary resources cleaned up', {
      executionId: context.executionId,
      removedKeys: keysToRemove.length
    });
  }

  /**
   * Archive execution data for historical analysis
   * NASA Rule 10: Keep function under 60 lines
   */
  private archiveExecutionData(context: MigrationContext): void {
    const archiveData = {
      executionId: context.executionId,
      plan: context.plan,
      metrics: context.globalContext.get('completion_metrics'),
      report: context.globalContext.get('completion_report'),
      archivedAt: new Date()
    };

    // Store in global context for external archival
    context.globalContext.set('archive_data', archiveData);

    this.logger.info('Execution data archived', {
      executionId: context.executionId,
      archiveSize: Object.keys(archiveData).length
    });
  }

  /**
   * Format duration in human-readable format
   * NASA Rule 10: Keep function under 60 lines
   */
  private formatDuration(milliseconds: number): string {
    if (milliseconds < 1000) {
      return `${milliseconds}ms`;
    }

    const seconds = Math.floor(milliseconds / 1000);
    if (seconds < 60) {
      return `${seconds}s`;
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes < 60) {
      return `${minutes}m ${remainingSeconds}s`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    return `${hours}h ${remainingMinutes}m ${remainingSeconds}s`;
  }
}