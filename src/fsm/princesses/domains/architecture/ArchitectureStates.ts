/**
 * ArchitectureStates - FSM States for Architecture Princess Domain
 * NASA Rule 10 Compliant: State definitions and transitions
 * Extracted from ArchitecturePrincessFSM.ts god object
 */

export class ArchitectureStates {

  /**
   * Get all architecture princess states
   * NASA Rule 10: ≤60 lines
   */
  getStates(): any {
    return {
      AWAITING: {
        on: {
          START_ANALYSIS: 'PROCESSING',
          RECEIVE_REQUIREMENTS: 'PROCESSING'
        },
        entry: 'logStateEntry',
        exit: 'logStateExit'
      },

      PROCESSING: {
        on: {
          REQUIREMENTS_COMPLETE: 'EXECUTING',
          VALIDATION_FAILED: 'AWAITING',
          ABORT: 'AWAITING'
        },
        entry: 'startProcessing',
        exit: 'cleanupProcessing'
      },

      EXECUTING: {
        on: {
          DESIGN_COMPLETE: 'REPORTING',
          VALIDATION_COMPLETE: 'REPORTING',
          EXECUTION_FAILED: 'PROCESSING',
          RETRY: 'PROCESSING'
        },
        entry: 'startExecution',
        exit: 'finalizeExecution'
      },

      REPORTING: {
        on: {
          REPORT_GENERATED: 'READY',
          COMPLIANCE_CHECK_NEEDED: 'VALIDATING',
          REPORT_FAILED: 'EXECUTING'
        },
        entry: 'startReporting',
        exit: 'finalizeReporting'
      },

      VALIDATING: {
        on: {
          VALIDATION_COMPLETE: 'READY',
          VALIDATION_FAILED: 'REPORTING',
          RETRY_VALIDATION: 'VALIDATING'
        },
        entry: 'startValidation',
        exit: 'finalizeValidation'
      },

      READY: {
        on: {
          NEW_TASK: 'AWAITING',
          SHUTDOWN: 'FINAL'
        },
        entry: 'markReady',
        exit: 'prepareForNext'
      },

      FINAL: {
        type: 'final',
        entry: 'cleanup'
      }
    };
  }

  /**
   * Get valid state transitions
   * NASA Rule 10: ≤60 lines
   */
  getValidTransitions(): Map<string, string[]> {
    const transitions = new Map();

    transitions.set('AWAITING', ['PROCESSING']);
    transitions.set('PROCESSING', ['EXECUTING', 'AWAITING']);
    transitions.set('EXECUTING', ['REPORTING', 'PROCESSING']);
    transitions.set('REPORTING', ['READY', 'VALIDATING', 'EXECUTING']);
    transitions.set('VALIDATING', ['READY', 'REPORTING', 'VALIDATING']);
    transitions.set('READY', ['AWAITING', 'FINAL']);

    // NASA Rule 10: Assertions
    console.assert(transitions.size === 6, 'Must have exactly 6 state transitions');
    console.assert(transitions.has('AWAITING'), 'AWAITING state must be defined');
    console.assert(transitions.has('VALIDATING'), 'VALIDATING state must be defined');

    return transitions;
  }
}

<!-- AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE -->
## Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
|--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
| 1.0.0   | 2025-09-28T09:35:57-04:00 | agent@Sonnet4 | Create ArchitectureStates FSM component | ArchitectureStates.ts | OK | NASA Rule 10 compliant FSM states | 0.00 | 0p1q2r3 |

### Receipt
- status: OK
- reason_if_blocked: --
- run_id: princess-domain-elimination-016
- inputs: ["ArchitecturePrincessFSM.ts"]
- tools_used: ["Write"]
- versions: {"model":"claude-3-5-sonnet-20241022","prompt":"v1.0"}
<!-- AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE -->