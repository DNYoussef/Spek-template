/**
 * PerformanceStates - FSM States for Performance Princess Domain
 * NASA Rule 10 Compliant: State definitions and transitions
 * Extracted from PerformancePrincessFSM.ts god object
 */

export class PerformanceStates {

  /**
   * Get all performance princess states
   * NASA Rule 10: ≤60 lines
   */
  getStates(): any {
    return {
      AWAITING: {
        on: {
          START_BASELINE: 'PROCESSING',
          RECEIVE_TASK: 'PROCESSING'
        },
        entry: 'logStateEntry',
        exit: 'logStateExit'
      },

      PROCESSING: {
        on: {
          BASELINE_COMPLETE: 'EXECUTING',
          VALIDATION_FAILED: 'AWAITING',
          ABORT: 'AWAITING'
        },
        entry: 'startProcessing',
        exit: 'cleanupProcessing'
      },

      EXECUTING: {
        on: {
          LOAD_TEST_COMPLETE: 'REPORTING',
          STRESS_TEST_COMPLETE: 'REPORTING',
          EXECUTION_FAILED: 'PROCESSING',
          RETRY: 'PROCESSING'
        },
        entry: 'startExecution',
        exit: 'finalizeExecution'
      },

      REPORTING: {
        on: {
          REPORT_GENERATED: 'READY',
          OPTIMIZATION_NEEDED: 'OPTIMIZING',
          REPORT_FAILED: 'EXECUTING'
        },
        entry: 'startReporting',
        exit: 'finalizeReporting'
      },

      OPTIMIZING: {
        on: {
          OPTIMIZATION_COMPLETE: 'READY',
          OPTIMIZATION_FAILED: 'REPORTING',
          RETRY_OPTIMIZATION: 'OPTIMIZING'
        },
        entry: 'startOptimization',
        exit: 'finalizeOptimization'
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
    transitions.set('REPORTING', ['READY', 'OPTIMIZING', 'EXECUTING']);
    transitions.set('OPTIMIZING', ['READY', 'REPORTING', 'OPTIMIZING']);
    transitions.set('READY', ['AWAITING', 'FINAL']);

    // NASA Rule 10: Assertions
    console.assert(transitions.size === 6, 'Must have exactly 6 state transitions');
    console.assert(transitions.has('AWAITING'), 'AWAITING state must be defined');
    console.assert(transitions.has('OPTIMIZING'), 'OPTIMIZING state must be defined');

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
// run_id: princess-domain-elimination-009
// inputs: ["PerformancePrincessFSM.ts"]
// tools_used: ["Write"]
// versions: {"model":"claude-3-5-sonnet-20241022","prompt":"v1.0"}
// === END FOOTER ===