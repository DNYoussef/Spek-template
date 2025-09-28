/**
 * Quality Princess States - FSM State Definitions
 * NASA Rule 10 Compliant: Each state isolated, ≤60 lines per function
 */

import { QualityState, QualityEvent, QualityContext, QualityTask } from './QualityPrincessTypes';

export abstract class BaseQualityState {
  abstract readonly name: QualityState;
  
  abstract init(context: QualityContext): Promise<void>;
  abstract update(context: QualityContext, event: QualityEvent): Promise<QualityState>;
  abstract shutdown(context: QualityContext): Promise<void>;
  abstract checkInvariants(context: QualityContext): boolean;
}

export class IdleState extends BaseQualityState {
  readonly name = QualityState.IDLE;

  async init(context: QualityContext): Promise<void> {
    // NASA Rule 10: Simple init with assertions
    if (!context) throw new Error('Context required');
    if (context.currentState !== QualityState.IDLE) {
      throw new Error('Invalid state transition to IDLE');
    }
    
    context.task = undefined;
    context.validations = [];
    context.agents = [];
    context.patterns = [];
  }

  async update(context: QualityContext, event: QualityEvent): Promise<QualityState> {
    // NASA Rule 10: Fixed transitions, no recursion
    if (!context) throw new Error('Context required');
    if (!event) throw new Error('Event required');

    switch (event) {
      case QualityEvent.INITIALIZE:
        return QualityState.INITIALIZING;
      case QualityEvent.ERROR_OCCURRED:
        return QualityState.ERROR;
      default:
        return QualityState.IDLE;
    }
  }

  async shutdown(context: QualityContext): Promise<void> {
    // NASA Rule 10: Simple cleanup
    if (!context) throw new Error('Context required');
    // No cleanup needed in IDLE state
  }

  checkInvariants(context: QualityContext): boolean {
    // NASA Rule 10: State validation
    if (!context) return false;
    return context.currentState === QualityState.IDLE && 
           !context.task;
  }
}

export class InitializingState extends BaseQualityState {
  readonly name = QualityState.INITIALIZING;

  async init(context: QualityContext): Promise<void> {
    // NASA Rule 10: Initialization logic
    if (!context) throw new Error('Context required');
    if (context.currentState !== QualityState.INITIALIZING) {
      throw new Error('Invalid state transition to INITIALIZING');
    }
    
    context.errorCount = 0;
    context.lastError = undefined;
  }

  async update(context: QualityContext, event: QualityEvent): Promise<QualityState> {
    // NASA Rule 10: Fixed transitions
    if (!context) throw new Error('Context required');
    if (!event) throw new Error('Event required');

    switch (event) {
      case QualityEvent.ANALYZE_TASK:
        return QualityState.ANALYZING;
      case QualityEvent.ERROR_OCCURRED:
        return QualityState.ERROR;
      case QualityEvent.RESET:
        return QualityState.IDLE;
      default:
        return QualityState.INITIALIZING;
    }
  }

  async shutdown(context: QualityContext): Promise<void> {
    // NASA Rule 10: Simple cleanup
    if (!context) throw new Error('Context required');
    // State transition cleanup handled by next state
  }

  checkInvariants(context: QualityContext): boolean {
    // NASA Rule 10: State validation
    if (!context) return false;
    return context.currentState === QualityState.INITIALIZING;
  }
}

export class AnalyzingState extends BaseQualityState {
  readonly name = QualityState.ANALYZING;

  async init(context: QualityContext): Promise<void> {
    // NASA Rule 10: Analysis preparation
    if (!context) throw new Error('Context required');
    if (!context.task) throw new Error('Task required for analysis');
    
    context.patterns = [];
  }

  async update(context: QualityContext, event: QualityEvent): Promise<QualityState> {
    // NASA Rule 10: Fixed transitions
    if (!context) throw new Error('Context required');
    if (!event) throw new Error('Event required');

    switch (event) {
      case QualityEvent.BEGIN_VALIDATION:
        return QualityState.VALIDATING;
      case QualityEvent.ERROR_OCCURRED:
        return QualityState.ERROR;
      case QualityEvent.RESET:
        return QualityState.IDLE;
      default:
        return QualityState.ANALYZING;
    }
  }

  async shutdown(context: QualityContext): Promise<void> {
    // NASA Rule 10: Simple cleanup
    if (!context) throw new Error('Context required');
    // Analysis results preserved in context
  }

  checkInvariants(context: QualityContext): boolean {
    // NASA Rule 10: State validation
    if (!context) return false;
    return context.currentState === QualityState.ANALYZING && 
           !!context.task;
  }
}

export class ValidatingState extends BaseQualityState {
  readonly name = QualityState.VALIDATING;

  async init(context: QualityContext): Promise<void> {
    // NASA Rule 10: Validation preparation
    if (!context) throw new Error('Context required');
    if (!context.task) throw new Error('Task required for validation');
    
    context.validations = [];
    context.agents = [];
  }

  async update(context: QualityContext, event: QualityEvent): Promise<QualityState> {
    // NASA Rule 10: Fixed transitions
    if (!context) throw new Error('Context required');
    if (!event) throw new Error('Event required');

    switch (event) {
      case QualityEvent.COORDINATE_AGENTS:
        return QualityState.COORDINATING;
      case QualityEvent.ERROR_OCCURRED:
        return QualityState.ERROR;
      case QualityEvent.RESET:
        return QualityState.IDLE;
      default:
        return QualityState.VALIDATING;
    }
  }

  async shutdown(context: QualityContext): Promise<void> {
    // NASA Rule 10: Simple cleanup
    if (!context) throw new Error('Context required');
    // Validation results preserved
  }

  checkInvariants(context: QualityContext): boolean {
    // NASA Rule 10: State validation
    if (!context) return false;
    return context.currentState === QualityState.VALIDATING && 
           !!context.task;
  }
}

export class CoordinatingState extends BaseQualityState {
  readonly name = QualityState.COORDINATING;

  async init(context: QualityContext): Promise<void> {
    // NASA Rule 10: Coordination setup
    if (!context) throw new Error('Context required');
    if (context.validations.length === 0) {
      throw new Error('Validations required for coordination');
    }
  }

  async update(context: QualityContext, event: QualityEvent): Promise<QualityState> {
    // NASA Rule 10: Fixed transitions
    if (!context) throw new Error('Context required');
    if (!event) throw new Error('Event required');

    switch (event) {
      case QualityEvent.GENERATE_REPORT:
        return QualityState.REPORTING;
      case QualityEvent.ERROR_OCCURRED:
        return QualityState.ERROR;
      case QualityEvent.RESET:
        return QualityState.IDLE;
      default:
        return QualityState.COORDINATING;
    }
  }

  async shutdown(context: QualityContext): Promise<void> {
    // NASA Rule 10: Simple cleanup
    if (!context) throw new Error('Context required');
    // Coordination results preserved
  }

  checkInvariants(context: QualityContext): boolean {
    // NASA Rule 10: State validation
    if (!context) return false;
    return context.currentState === QualityState.COORDINATING && 
           context.validations.length > 0;
  }
}

export class ReportingState extends BaseQualityState {
  readonly name = QualityState.REPORTING;

  async init(context: QualityContext): Promise<void> {
    // NASA Rule 10: Report preparation
    if (!context) throw new Error('Context required');
    if (context.validations.length === 0) {
      throw new Error('Validations required for reporting');
    }
  }

  async update(context: QualityContext, event: QualityEvent): Promise<QualityState> {
    // NASA Rule 10: Fixed transitions
    if (!context) throw new Error('Context required');
    if (!event) throw new Error('Event required');

    switch (event) {
      case QualityEvent.RESET:
        return QualityState.IDLE;
      case QualityEvent.ERROR_OCCURRED:
        return QualityState.ERROR;
      default:
        return QualityState.REPORTING;
    }
  }

  async shutdown(context: QualityContext): Promise<void> {
    // NASA Rule 10: Simple cleanup
    if (!context) throw new Error('Context required');
    // Report generated and preserved
  }

  checkInvariants(context: QualityContext): boolean {
    // NASA Rule 10: State validation
    if (!context) return false;
    return context.currentState === QualityState.REPORTING;
  }
}

export class ErrorState extends BaseQualityState {
  readonly name = QualityState.ERROR;

  async init(context: QualityContext): Promise<void> {
    // NASA Rule 10: Error handling
    if (!context) throw new Error('Context required');
    
    context.errorCount++;
    // Preserve error information for debugging
  }

  async update(context: QualityContext, event: QualityEvent): Promise<QualityState> {
    // NASA Rule 10: Fixed transitions from error
    if (!context) throw new Error('Context required');
    if (!event) throw new Error('Event required');

    switch (event) {
      case QualityEvent.RESET:
        return QualityState.IDLE;
      default:
        return QualityState.ERROR;
    }
  }

  async shutdown(context: QualityContext): Promise<void> {
    // NASA Rule 10: Error cleanup
    if (!context) throw new Error('Context required');
    // Error state cleanup minimal
  }

  checkInvariants(context: QualityContext): boolean {
    // NASA Rule 10: Error state validation
    if (!context) return false;
    return context.currentState === QualityState.ERROR;
  }
}

<!-- AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE -->
## Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
|--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
| 1.0.0   | 2025-09-27T17:31:45-04:00 | coder@sonnet-4 | Created QualityPrincessStates.ts with FSM state definitions | quality-states | OK | 7 states, NASA-compliant | 0.00 | c9f6d4e |

### Receipt
- status: OK
- reason_if_blocked: --
- run_id: quality-princess-fsm-refactor-003
- inputs: ["QualityPrincess.ts"]
- tools_used: ["claude-code", "filesystem"]
- versions: {"model":"sonnet-4","prompt":"quality-fsm-refactor-v1"}
<!-- AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE -->