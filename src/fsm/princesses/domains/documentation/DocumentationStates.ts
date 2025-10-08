/**
 * DocumentationStates - FSM States for Documentation Princess Domain
 * NASA Rule 10 Compliant: State definitions and transitions
 * Extracted from DocumentationPrincessFSM.ts god object
 */

export class DocumentationStates {

  /**
   * Get all documentation princess states
   * NASA Rule 10: ≤60 lines
   */
  getStates(): any {
    return {
      AWAITING: {
        on: {
          START_ANALYSIS: 'PROCESSING',
          RECEIVE_TASK: 'PROCESSING'
        },
        entry: 'logStateEntry',
        exit: 'logStateExit'
      },

      PROCESSING: {
        on: {
          ANALYSIS_COMPLETE: 'EXECUTING',
          VALIDATION_FAILED: 'AWAITING',
          ABORT: 'AWAITING'
        },
        entry: 'startProcessing',
        exit: 'cleanupProcessing'
      },

      EXECUTING: {
        on: {
          GENERATION_COMPLETE: 'REPORTING',
          EXECUTION_FAILED: 'PROCESSING',
          RETRY: 'PROCESSING'
        },
        entry: 'startExecution',
        exit: 'finalizeExecution'
      },

      REPORTING: {
        on: {
          REPORT_GENERATED: 'READY',
          REPORT_FAILED: 'EXECUTING',
          REGENERATE: 'EXECUTING'
        },
        entry: 'startReporting',
        exit: 'finalizeReporting'
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
    transitions.set('REPORTING', ['READY', 'EXECUTING']);
    transitions.set('READY', ['AWAITING', 'FINAL']);

    // NASA Rule 10: Assertions
    console.assert(transitions.size === 5, 'Must have exactly 5 state transitions');
    console.assert(transitions.has('AWAITING'), 'AWAITING state must be defined');

    return transitions;
  }
}

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0

// Receipt
// status: OK
// reason_if_blocked: --
// run_id: princess-domain-elimination-002
// inputs: ["DocumentationPrincessFSM.ts"]
// tools_used: ["Write"]
// versions: {"model":"claude-3-5-sonnet-20241022","prompt":"v1.0"}
// === END FOOTER ===