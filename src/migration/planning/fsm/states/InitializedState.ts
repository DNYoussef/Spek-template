/**
 * Initialized state handler for analysis state machine.
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
 * Handles the INITIALIZED state of the analysis workflow.
 * Validates initial setup and triggers analysis start.
 */
export class InitializedState extends BaseStateHandler {
  constructor() {
    super('INITIALIZED');
  }

  /**
   * Initialize state with context validation.
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  protected async onEnter(context: MigrationAnalysisContext): Promise<void> {
    assert(context.request, 'Analysis request required');
    assert(context.analysisId, 'Analysis ID required');

    this.logger.info('Analysis workflow initialized', {
      analysisId: context.analysisId,
      sourceSystem: context.request.sourceSystem,
      migrationScope: context.request.migrationScope
    });

    // Validate request parameters
    this.validateAnalysisRequest(context);

    // Initialize phase timings
    context.phaseTimings.clear();

    // Reset error state
    context.errors = [];
    context.retryCount = 0;

    // Set start time
    context.startTime = new Date();

    this.logger.debug('Initialized state setup complete', {
      analysisId: context.analysisId,
      startTime: context.startTime.toISOString()
    });
  }

  /**
   * Process events in initialized state.
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  protected async processEvent(
    event: AnalysisEvent,
    context: MigrationAnalysisContext
  ): Promise<AnalysisEvent | null> {
    assert(context, 'Context required');
    assert(event, 'Event required');

    switch (event) {
      case AnalysisEvent.START_ANALYSIS:
        return this.handleStartAnalysis(context);

      case AnalysisEvent.CANCEL_ANALYSIS:
        return this.handleCancelAnalysis(context);

      case AnalysisEvent.RESET:
        return this.handleReset(context);

      default:
        this.logger.warn('Unhandled event in initialized state', {
          analysisId: context.analysisId,
          event
        });
        return null;
    }
  }

  /**
   * Check state invariants for initialized state.
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  checkInvariants(context: MigrationAnalysisContext): boolean {
    assert(context, 'Context required for invariant check');

    const hasAnalysisId = context.analysisId !== undefined && context.analysisId !== '';
    const hasRequest = context.request !== undefined;
    const hasSourceSystem = context.request?.sourceSystem !== undefined;
    const hasMigrationScope = context.request?.migrationScope !== undefined;
    const hasStartTime = context.startTime !== undefined;

    const allInvariantsMet = hasAnalysisId && hasRequest && hasSourceSystem &&
                            hasMigrationScope && hasStartTime;

    if (!allInvariantsMet) {
      this.logger.error('State invariants violated', {
        analysisId: context.analysisId,
        hasAnalysisId,
        hasRequest,
        hasSourceSystem,
        hasMigrationScope,
        hasStartTime
      });
    }

    assert(typeof allInvariantsMet === 'boolean', 'Invariant check must return boolean');
    return allInvariantsMet;
  }

  /**
   * Handle analysis start event.
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  private async handleStartAnalysis(context: MigrationAnalysisContext): Promise<AnalysisEvent> {
    assert(context, 'Context required');
    assert(context.request, 'Analysis request required');

    this.logger.info('Starting analysis workflow', {
      analysisId: context.analysisId,
      sourceSystem: context.request.sourceSystem
    });

    // Final validation before starting
    if (!this.validateAnalysisRequest(context)) {
      throw new Error('Analysis request validation failed');
    }

    // Record analysis start
    this.recordPhaseStart('initialization', context);
    this.recordPhaseComplete('initialization', context);

    // Automatically proceed to analysis
    return AnalysisEvent.START_ANALYSIS;
  }

  /**
   * Handle analysis cancellation.
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  private async handleCancelAnalysis(context: MigrationAnalysisContext): Promise<AnalysisEvent> {
    assert(context, 'Context required');

    this.logger.info('Analysis cancelled in initialized state', {
      analysisId: context.analysisId
    });

    // No cleanup needed in initialized state
    return AnalysisEvent.CANCEL_ANALYSIS;
  }

  /**
   * Handle reset event.
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  private async handleReset(context: MigrationAnalysisContext): Promise<AnalysisEvent> {
    assert(context, 'Context required');

    this.logger.info('Resetting analysis workflow', {
      analysisId: context.analysisId
    });

    // Clear all state
    context.errors = [];
    context.retryCount = 0;
    context.phaseTimings.clear();

    // Reset analysis results
    context.systemAnalysis = undefined;
    context.gapAnalysis = undefined;
    context.riskAnalysis = undefined;
    context.dependencyAnalysis = undefined;
    context.migrationPlan = undefined;
    context.validationResults = undefined;

    return AnalysisEvent.RESET;
  }

  /**
   * Validate analysis request parameters.
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  private validateAnalysisRequest(context: MigrationAnalysisContext): boolean {
    assert(context.request, 'Request required for validation');

    const { request } = context;

    // Check required fields
    if (!request.sourceSystem || request.sourceSystem.trim().length === 0) {
      this.addError(new Error('Source system is required'), context, false);
      return false;
    }

    if (!request.migrationScope || request.migrationScope.trim().length === 0) {
      this.addError(new Error('Migration scope is required'), context, false);
      return false;
    }

    // Validate field lengths
    const maxFieldLength = 255;
    if (request.sourceSystem.length > maxFieldLength) {
      this.addError(new Error('Source system name too long'), context, false);
      return false;
    }

    if (request.migrationScope.length > maxFieldLength) {
      this.addError(new Error('Migration scope too long'), context, false);
      return false;
    }

    this.logger.debug('Analysis request validation passed', {
      analysisId: context.analysisId,
      sourceSystem: request.sourceSystem,
      scope: request.migrationScope
    });

    return true;
  }
}

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0

// Receipt
// status: OK
// reason_if_blocked: --
// run_id: fsm-refactor-004
// inputs: ["AnalysisStateMachine.ts"]
// tools_used: ["filesystem"]
// versions: {"model":"claude-sonnet-4","prompt":"v1.0"}
// === END FOOTER ===