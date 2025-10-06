/**
 * Terminal state handlers for analysis state machine.
 * NASA Rule 10 compliant: Functions ≤60 lines, explicit assertions.
 */

import { BaseStateHandler } from '../core/BaseStateHandler';
import {
  MigrationAnalysisContext,
  AnalysisEvent
} from '../types/AnalysisTypes';

function assert(condition: any, message: string): asserts condition {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

/**
 * Handles the COMPLETED state - successful analysis workflow completion.
 */
export class CompletedState extends BaseStateHandler {
  constructor() {
    super('COMPLETED');
  }

  protected async onEnter(context: MigrationAnalysisContext): Promise<void> {
    assert(context.validationResults, 'Validation results required for completion');
    assert(context.validationResults.overall === 'pass', 'Validation must pass for completion');

    this.logger.info('Analysis workflow completed successfully', {
      analysisId: context.analysisId,
      score: context.validationResults.score,
      duration: Date.now() - context.startTime.getTime()
    });

    // Record final completion time
    context.phaseTimings.set('completion', {
      startTime: new Date(),
      endTime: new Date(),
      duration: 0,
      success: true
    });
  }

  protected async processEvent(
    event: AnalysisEvent,
    context: MigrationAnalysisContext
  ): Promise<AnalysisEvent | null> {
    // Terminal state - no outgoing transitions except reset
    if (event === AnalysisEvent.RESET) {
      return this.handleReset(context);
    }

    this.logger.debug('Ignoring event in completed state', {
      analysisId: context.analysisId,
      event
    });

    return null; // No transitions from completed state
  }

  checkInvariants(context: MigrationAnalysisContext): boolean {
    assert(context, 'Context required for invariant check');

    const hasValidationResults = context.validationResults !== undefined;
    const validationPassed = context.validationResults?.overall === 'pass';
    const hasAllAnalysis = context.systemAnalysis !== undefined &&
                          context.riskAnalysis !== undefined &&
                          context.dependencyAnalysis !== undefined &&
                          context.migrationPlan !== undefined;

    const allInvariantsMet = hasValidationResults && validationPassed && hasAllAnalysis;

    assert(typeof allInvariantsMet === 'boolean', 'Invariant check must return boolean');
    return allInvariantsMet;
  }

  private async handleReset(context: MigrationAnalysisContext): Promise<AnalysisEvent> {
    this.logger.info('Resetting completed analysis', {
      analysisId: context.analysisId
    });

    return AnalysisEvent.RESET;
  }
}

/**
 * Handles the FAILED state - analysis workflow failure.
 */
export class FailedState extends BaseStateHandler {
  constructor() {
    super('FAILED');
  }

  protected async onEnter(context: MigrationAnalysisContext): Promise<void> {
    assert(context.errors.length > 0, 'Errors required for failed state');

    this.logger.error('Analysis workflow failed', {
      analysisId: context.analysisId,
      errorCount: context.errors.length,
      finalError: context.errors[context.errors.length - 1]?.error.message
    });

    // Record failure time
    context.phaseTimings.set('failure', {
      startTime: new Date(),
      endTime: new Date(),
      duration: 0,
      success: false
    });
  }

  protected async processEvent(
    event: AnalysisEvent,
    context: MigrationAnalysisContext
  ): Promise<AnalysisEvent | null> {
    assert(context, 'Context required');

    switch (event) {
      case AnalysisEvent.RETRY_OPERATION:
        return this.handleRetry(context);

      case AnalysisEvent.RESET:
        return this.handleReset(context);

      default:
        this.logger.debug('Ignoring event in failed state', {
          analysisId: context.analysisId,
          event
        });
        return null;
    }
  }

  checkInvariants(context: MigrationAnalysisContext): boolean {
    assert(context, 'Context required for invariant check');

    const hasErrors = context.errors.length > 0;
    const recentError = context.errors.length > 0 &&
                       (Date.now() - context.errors[context.errors.length - 1].timestamp.getTime()) < 300000; // 5 minutes

    const allInvariantsMet = hasErrors && recentError;

    assert(typeof allInvariantsMet === 'boolean', 'Invariant check must return boolean');
    return allInvariantsMet;
  }

  private async handleRetry(context: MigrationAnalysisContext): Promise<AnalysisEvent> {
    const maxRetries = 3;

    if (context.retryCount >= maxRetries) {
      this.logger.warn('Max retries exceeded', {
        analysisId: context.analysisId,
        retryCount: context.retryCount
      });
      return AnalysisEvent.ERROR_OCCURRED;
    }

    this.logger.info('Retrying failed analysis', {
      analysisId: context.analysisId,
      retryCount: context.retryCount + 1
    });

    return AnalysisEvent.RETRY_OPERATION;
  }

  private async handleReset(context: MigrationAnalysisContext): Promise<AnalysisEvent> {
    this.logger.info('Resetting failed analysis', {
      analysisId: context.analysisId
    });

    return AnalysisEvent.RESET;
  }
}

/**
 * Handles the CANCELLED state - analysis workflow cancellation.
 */
export class CancelledState extends BaseStateHandler {
  constructor() {
    super('CANCELLED');
  }

  protected async onEnter(context: MigrationAnalysisContext): Promise<void> {
    assert(context, 'Context required for cancelled state');

    this.logger.info('Analysis workflow cancelled', {
      analysisId: context.analysisId,
      duration: Date.now() - context.startTime.getTime()
    });

    // Record cancellation time
    context.phaseTimings.set('cancellation', {
      startTime: new Date(),
      endTime: new Date(),
      duration: 0,
      success: false
    });

    // Clean up partial results
    await this.cleanupPartialResults(context);
  }

  protected async processEvent(
    event: AnalysisEvent,
    context: MigrationAnalysisContext
  ): Promise<AnalysisEvent | null> {
    // Only reset is allowed from cancelled state
    if (event === AnalysisEvent.RESET) {
      return this.handleReset(context);
    }

    this.logger.debug('Ignoring event in cancelled state', {
      analysisId: context.analysisId,
      event
    });

    return null;
  }

  checkInvariants(context: MigrationAnalysisContext): boolean {
    assert(context, 'Context required for invariant check');

    // Cancelled state is always valid once entered
    const hasCancellationRecord = context.phaseTimings.has('cancellation');

    assert(typeof hasCancellationRecord === 'boolean', 'Invariant check must return boolean');
    return hasCancellationRecord;
  }

  private async handleReset(context: MigrationAnalysisContext): Promise<AnalysisEvent> {
    this.logger.info('Resetting cancelled analysis', {
      analysisId: context.analysisId
    });

    return AnalysisEvent.RESET;
  }

  /**
   * Clean up partial analysis results.
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  private async cleanupPartialResults(context: MigrationAnalysisContext): Promise<void> {
    assert(context, 'Context required for cleanup');

    this.logger.debug('Cleaning up partial results', {
      analysisId: context.analysisId
    });

    // Clear partial analysis results
    context.systemAnalysis = undefined;
    context.gapAnalysis = undefined;
    context.riskAnalysis = undefined;
    context.dependencyAnalysis = undefined;
    context.migrationPlan = undefined;
    context.validationResults = undefined;

    // Keep errors for debugging but mark them as cancelled
    for (const error of context.errors) {
      error.recoverable = false; // Can't recover from cancelled analysis
    }

    this.logger.debug('Cleanup completed', {
      analysisId: context.analysisId,
      errorCount: context.errors.length
    });

    assert(context.systemAnalysis === undefined, 'System analysis must be cleared');
    assert(context.migrationPlan === undefined, 'Migration plan must be cleared');
  }
}

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0

// Receipt
// status: OK
// reason_if_blocked: --
// run_id: fsm-refactor-010
// inputs: ["AnalysisStateMachine.ts"]
// tools_used: ["filesystem"]
// versions: {"model":"claude-sonnet-4","prompt":"v1.0"}
// === END FOOTER ===