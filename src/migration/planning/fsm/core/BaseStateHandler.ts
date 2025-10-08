/**
 * Base State Handler for Analysis State Machine
 * NASA Rule 10 compliant: Functions <=60 lines, explicit assertions
 * Provides common functionality for all state handlers
 */

import { Logger } from '../../../../utils/Logger';
import {
  MigrationAnalysisContext,
  MigrationAnalysisEvent,
  StateHandler
} from '../types/AnalysisTypes';

function assert(condition: any, message: string): asserts condition {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

/**
 * Abstract base class for all analysis state handlers
 * Provides common logging, phase tracking, and lifecycle management
 */
export abstract class BaseStateHandler implements StateHandler {
  protected logger: Logger;
  private readonly stateName: string;
  private phaseStartTimes: Map<string, number>;

  constructor(stateName: string) {
    assert(stateName && stateName.length > 0, 'State name required');
    this.stateName = stateName;
    this.logger = new Logger(`${stateName}State`);
    this.phaseStartTimes = new Map();
  }

  /**
   * Enter state lifecycle hook
   * NASA Rule 10: <=60 lines
   */
  async enter(context: MigrationAnalysisContext): Promise<void> {
    assert(context, 'Context required for state entry');
    assert(context.analysisId, 'Analysis ID required');

    this.logger.info('Entering state', {
      state: this.stateName,
      analysisId: context.analysisId
    });

    await this.onEnter(context);

    this.logger.debug('State entry complete', {
      state: this.stateName,
      analysisId: context.analysisId
    });
  }

  /**
   * Process event in current state
   * NASA Rule 10: <=60 lines
   */
  async handleEvent(
    event: MigrationAnalysisEvent,
    context: MigrationAnalysisContext
  ): Promise<MigrationAnalysisEvent | null> {
    assert(event, 'Event required');
    assert(context, 'Context required');

    this.logger.debug('Processing event', {
      state: this.stateName,
      event,
      analysisId: context.analysisId
    });

    const result = await this.processEvent(event, context);

    if (result) {
      this.logger.debug('Event produced transition', {
        state: this.stateName,
        event,
        nextEvent: result,
        analysisId: context.analysisId
      });
    }

    return result;
  }

  /**
   * Exit state lifecycle hook
   * NASA Rule 10: <=60 lines
   */
  async exit(context: MigrationAnalysisContext): Promise<void> {
    assert(context, 'Context required for state exit');

    this.logger.info('Exiting state', {
      state: this.stateName,
      analysisId: context.analysisId
    });

    await this.onExit(context);

    this.logger.debug('State exit complete', {
      state: this.stateName,
      analysisId: context.analysisId
    });
  }

  /**
   * Record phase start time for duration tracking
   * NASA Rule 10: <=60 lines
   */
  protected recordPhaseStart(phase: string, context: MigrationAnalysisContext): void {
    assert(phase && phase.length > 0, 'Phase name required');
    assert(context, 'Context required');

    const startTime = Date.now();
    this.phaseStartTimes.set(phase, startTime);

    this.logger.debug('Phase started', {
      phase,
      startTime,
      analysisId: context.analysisId
    });
  }

  /**
   * Record phase completion and calculate duration
   * NASA Rule 10: <=60 lines
   */
  protected recordPhaseComplete(phase: string, context: MigrationAnalysisContext): void {
    assert(phase && phase.length > 0, 'Phase name required');
    assert(context, 'Context required');

    const startTime = this.phaseStartTimes.get(phase);
    if (startTime) {
      const duration = Date.now() - startTime;
      this.logger.info('Phase completed', {
        phase,
        duration: `${duration}ms`,
        analysisId: context.analysisId
      });
      this.phaseStartTimes.delete(phase);
    }
  }

  /**
   * Get state name
   * NASA Rule 10: Simple getter
   */
  getStateName(): string {
    return this.stateName;
  }

  /**
   * Subclasses must implement state entry logic
   * NASA Rule 10: <=60 lines per implementation
   */
  protected abstract onEnter(context: MigrationAnalysisContext): Promise<void>;

  /**
   * Subclasses must implement event processing logic
   * NASA Rule 10: <=60 lines per implementation
   */
  protected abstract processEvent(
    event: MigrationAnalysisEvent,
    context: MigrationAnalysisContext
  ): Promise<MigrationAnalysisEvent | null>;

  /**
   * Subclasses can override state exit logic
   * NASA Rule 10: <=60 lines per implementation
   */
  protected async onExit(context: MigrationAnalysisContext): Promise<void> {
    // Default: no-op
  }
}
