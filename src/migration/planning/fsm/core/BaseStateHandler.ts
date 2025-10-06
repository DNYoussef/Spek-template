/**
 * Base state handler providing common functionality for all states.
 * NASA Rule 10 compliant: Functions ≤60 lines, explicit assertions.
 */

import { Logger } from '../../../../utils/Logger';
import {
  StateHandler,
  MigrationAnalysisContext,
  MigrationAnalysisEvent,
  MigrationAnalysisState
} from '../types/AnalysisTypes';

// Type aliases for backward compatibility
type AnalysisEvent = MigrationAnalysisEvent;
type AnalysisState = MigrationAnalysisState;
const AnalysisEvent = MigrationAnalysisEvent;
const AnalysisState = MigrationAnalysisState;

function assert(condition: any, message: string): asserts condition {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

/**
 * Abstract base class for all analysis state handlers.
 * Provides common functionality and enforces state handler contract.
 */
export abstract class BaseStateHandler implements StateHandler {
  protected logger: Logger;
  protected readonly stateName: string;

  constructor(stateName: string) {
    assert(stateName, 'State name required for handler');
    this.stateName = stateName;
    this.logger = new Logger(`${stateName}StateHandler`);
  }

  /**
   * Initialize state with context validation.
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  async init(context: MigrationAnalysisContext): Promise<void> {
    assert(context, 'Context required for state initialization');
    assert(context.analysisId, 'Analysis ID required in context');

    this.logger.info('Entering state', {
      analysisId: context.analysisId,
      state: this.stateName,
      timestamp: new Date().toISOString()
    });

    await this.onEnter(context);

    // Validate state invariants after initialization
    if (!this.checkInvariants(context)) {
      throw new Error(`State invariants violated after entering ${this.stateName}`);
    }
  }

  /**
   * Process event and determine next action.
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  async update(event: AnalysisEvent, context: MigrationAnalysisContext): Promise<AnalysisEvent | null> {
    assert(context, 'Context required for state update');
    assert(Object.values(AnalysisEvent).includes(event), 'Valid event required');

    this.logger.debug('Processing event', {
      analysisId: context.analysisId,
      state: this.stateName,
      event
    });

    // Check pre-conditions
    if (!this.checkInvariants(context)) {
      throw new Error(`State invariants violated in ${this.stateName}`);
    }

    try {
      const nextEvent = await this.processEvent(event, context);

      // Validate result
      if (nextEvent !== null) {
        assert(Object.values(AnalysisEvent).includes(nextEvent), 'Valid next event required');
      }

      return nextEvent;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Event processing failed', {
        analysisId: context.analysisId,
        state: this.stateName,
        event,
        error: errorMessage
      });
      throw error;
    }
  }

  /**
   * Clean up state before transition.
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  async shutdown(context: MigrationAnalysisContext): Promise<void> {
    assert(context, 'Context required for state shutdown');

    this.logger.info('Exiting state', {
      analysisId: context.analysisId,
      state: this.stateName,
      timestamp: new Date().toISOString()
    });

    await this.onExit(context);

    assert(this.isCleanupComplete(context), 'State cleanup must be complete');
  }

  /**
   * Validate state-specific invariants.
   * Must be implemented by concrete state handlers.
   */
  abstract checkInvariants(context: MigrationAnalysisContext): boolean;

  /**
   * Handle state entry logic.
   * Override in concrete implementations.
   */
  protected async onEnter(context: MigrationAnalysisContext): Promise<void> {
    // Default implementation - no-op
  }

  /**
   * Handle state exit logic.
   * Override in concrete implementations.
   */
  protected async onExit(context: MigrationAnalysisContext): Promise<void> {
    // Default implementation - no-op
  }

  /**
   * Process state-specific events.
   * Must be implemented by concrete state handlers.
   */
  protected abstract processEvent(
    event: AnalysisEvent,
    context: MigrationAnalysisContext
  ): Promise<AnalysisEvent | null>;

  /**
   * Check if cleanup is complete before state exit.
   * Override in concrete implementations if needed.
   */
  protected isCleanupComplete(context: MigrationAnalysisContext): boolean {
    return true; // Default - assume cleanup is complete
  }

  /**
   * Record phase timing information.
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  protected recordPhaseStart(phase: string, context: MigrationAnalysisContext): void {
    assert(phase, 'Phase name required');
    assert(context, 'Context required');

    context.phaseTimings.set(phase, {
      startTime: new Date(),
      success: false
    });

    this.logger.debug('Phase started', {
      analysisId: context.analysisId,
      phase,
      startTime: new Date().toISOString()
    });
  }

  /**
   * Complete phase timing and mark as successful.
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  protected recordPhaseComplete(phase: string, context: MigrationAnalysisContext): void {
    assert(phase, 'Phase name required');
    assert(context, 'Context required');

    const timing = context.phaseTimings.get(phase);
    if (timing) {
      timing.endTime = new Date();
      timing.duration = timing.endTime.getTime() - timing.startTime.getTime();
      timing.success = true;

      this.logger.info('Phase completed', {
        analysisId: context.analysisId,
        phase,
        duration: timing.duration
      });
    }
  }

  /**
   * Add error to context with recovery information.
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  protected addError(
    error: Error,
    context: MigrationAnalysisContext,
    recoverable: boolean = false
  ): void {
    assert(error instanceof Error, 'Error must be Error instance');
    assert(context, 'Context required');

    const analysisError = {
      phase: this.stateName,
      error,
      timestamp: new Date(),
      recoverable,
      retryAttempts: context.retryCount
    };

    context.errors.push(analysisError);

    this.logger.error('Error added to context', {
      analysisId: context.analysisId,
      phase: this.stateName,
      error: error.message,
      recoverable
    });
  }
}

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0

// Receipt
// status: OK
// reason_if_blocked: --
// run_id: fsm-refactor-003
// inputs: ["AnalysisStateMachine.ts"]
// tools_used: ["filesystem"]
// versions: {"model":"claude-sonnet-4","prompt":"v1.0"}
// === END FOOTER ===