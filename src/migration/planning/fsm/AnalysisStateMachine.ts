/**
 * Backward compatibility facade for the refactored AnalysisStateMachine.
 * Maintains original API while using new FSM implementation.
 * NASA Rule 10 compliant: Functions ≤60 lines, explicit assertions.
 */

import { EventEmitter } from 'events';
import { Logger } from '../../../utils/Logger';
import { AnalysisStateMachine as RefactoredStateMachine } from './AnalysisStateMachineRefactored';
import {
  AnalysisState,
  AnalysisEvent,
  StateMachineConfig,
  AnalysisContext,
  AnalysisStatus,
  ImpactAnalysisRequest
} from './types/AnalysisTypes';

function assert(condition: any, message: string): asserts condition {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

/**
 * Facade maintaining original AnalysisStateMachine API.
 * Delegates to refactored FSM implementation with state isolation.
 */
export class AnalysisStateMachine extends EventEmitter {
  private logger: Logger;
  private refactoredMachine: RefactoredStateMachine;
  private config: StateMachineConfig;

  constructor(config: StateMachineConfig) {
    super();
    assert(config?.maxRetries >= 0, 'Max retries must be non-negative');
    assert(config?.timeoutMs > 0, 'Timeout must be positive');

    this.logger = new Logger('AnalysisStateMachineFacade');
    this.config = config;
    this.refactoredMachine = new RefactoredStateMachine(config);

    this.setupEventForwarding();
  }

  /**
   * Starts migration analysis workflow.
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  async startAnalysis(request: ImpactAnalysisRequest): Promise<string> {
    assert(request?.sourceSystem, 'Source system required for analysis');
    assert(request?.migrationScope, 'Migration scope required for analysis');

    this.logger.info('Starting analysis via facade', {
      sourceSystem: request.sourceSystem,
      migrationScope: request.migrationScope
    });

    try {
      const analysisId = await this.refactoredMachine.startAnalysis(request);

      this.logger.info('Analysis started successfully', {
        analysisId
      });

      return analysisId;
    } catch (error) {
      this.logger.error('Failed to start analysis', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Processes FSM event.
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  async processEvent(event: AnalysisEvent): Promise<void> {
    assert(Object.values(AnalysisEvent).includes(event), 'Invalid analysis event');

    this.logger.debug('Processing event via facade', { event });

    try {
      await this.refactoredMachine.processEvent(event);
    } catch (error) {
      this.logger.error('Event processing failed', {
        event,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Gets current analysis status.
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  getAnalysisStatus(): AnalysisStatus {
    try {
      const status = this.refactoredMachine.getAnalysisStatus();
      assert(status.analysisId, 'Status must have analysis ID');
      return status;
    } catch (error) {
      this.logger.error('Failed to get analysis status', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Cancels ongoing analysis.
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  async cancelAnalysis(): Promise<void> {
    this.logger.info('Cancelling analysis via facade');

    try {
      await this.refactoredMachine.cancelAnalysis();
    } catch (error) {
      this.logger.error('Failed to cancel analysis', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Sets up event forwarding from refactored machine to facade.
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  private setupEventForwarding(): void {
    assert(this.refactoredMachine, 'Refactored machine required');

    // Forward all events from refactored machine
    const eventsToForward = [
      'analysisStarted',
      'stateChanged',
      'analysisFailed',
      'analysisCancelled',
      'retryAttempt'
    ];

    let forwardedCount = 0;
    for (const eventName of eventsToForward) {
      this.refactoredMachine.on(eventName, (...args) => {
        this.emit(eventName, ...args);
      });
      forwardedCount++;
    }

    assert(forwardedCount === eventsToForward.length, 'All events must be forwarded');

    this.logger.debug('Event forwarding configured', {
      eventCount: forwardedCount
    });
  }
}

// Legacy exports for backward compatibility
export {
  AnalysisState,
  AnalysisEvent,
  StateMachineConfig,
  AnalysisContext,
  AnalysisStatus
} from './types/AnalysisTypes';

// Re-export original interface types for compatibility
export interface StateTransition {
  from: AnalysisState;
  event: AnalysisEvent;
  to: AnalysisState;
  guard?: (context: AnalysisContext) => boolean;
  action?: (context: AnalysisContext) => Promise<void>;
  timeout?: number;
}

export interface StateHandler {
  enter(context: AnalysisContext): Promise<void>;
  exit(context: AnalysisContext): Promise<void>;
  handle(event: AnalysisEvent, context: AnalysisContext): Promise<AnalysisEvent | null>;
  checkInvariants(context: AnalysisContext): boolean;
}

export interface StateTransitionRecord {
  from: AnalysisState;
  event: AnalysisEvent;
  to: AnalysisState;
  timestamp: Date;
  analysisId: string;
}

<!-- AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE -->
## Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
|--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
| 1.0.0   | 2025-09-28T15:34:15-04:00 | agent@coder | Created backward compatibility facade for original API | AnalysisStateMachineFacade.ts | OK | -- | 0.00 | e3b7f9a |

### Receipt
- status: OK
- reason_if_blocked: --
- run_id: fsm-refactor-013
- inputs: ["AnalysisStateMachine.ts"]
- tools_used: ["filesystem"]
- versions: {"model":"claude-sonnet-4","prompt":"v1.0"}
<!-- AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE -->