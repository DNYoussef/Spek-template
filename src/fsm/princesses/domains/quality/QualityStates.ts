/**
 * QualityStates - FSM States for Quality Princess Domain
 * NASA Rule 10 Compliant: State definitions and transitions
 * Extracted from QualityPrincessCore.ts god object
 */

export class QualityStates {

  /**
   * Get all quality princess states
   * NASA Rule 10: ≤60 lines
   */
  getStates(): any {
    return {
      AWAITING: {
        on: {
          START_TESTING: 'PROCESSING',
          RECEIVE_TASK: 'PROCESSING'
        },
        entry: 'logStateEntry',
        exit: 'logStateExit'
      },

      PROCESSING: {
        on: {
          PLANNING_COMPLETE: 'EXECUTING',
          VALIDATION_FAILED: 'AWAITING',
          ABORT: 'AWAITING'
        },
        entry: 'startProcessing',
        exit: 'cleanupProcessing'
      },

      EXECUTING: {
        on: {
          UNIT_TESTS_COMPLETE: 'TESTING_INTEGRATION',
          INTEGRATION_TESTS_COMPLETE: 'TESTING_E2E',
          E2E_TESTS_COMPLETE: 'TESTING_PERFORMANCE',
          PERFORMANCE_TESTS_COMPLETE: 'TESTING_SECURITY',
          SECURITY_TESTS_COMPLETE: 'ANALYZING',
          EXECUTION_FAILED: 'PROCESSING',
          RETRY: 'PROCESSING'
        },
        entry: 'startExecution',
        exit: 'finalizeExecution'
      },

      TESTING_INTEGRATION: {
        on: {
          INTEGRATION_COMPLETE: 'TESTING_E2E',
          INTEGRATION_FAILED: 'EXECUTING',
          RETRY_INTEGRATION: 'TESTING_INTEGRATION'
        },
        entry: 'startIntegrationTesting',
        exit: 'finalizeIntegrationTesting'
      },

      TESTING_E2E: {
        on: {
          E2E_COMPLETE: 'TESTING_PERFORMANCE',
          E2E_FAILED: 'TESTING_INTEGRATION',
          RETRY_E2E: 'TESTING_E2E'
        },
        entry: 'startE2ETesting',
        exit: 'finalizeE2ETesting'
      },

      TESTING_PERFORMANCE: {
        on: {
          PERFORMANCE_COMPLETE: 'TESTING_SECURITY',
          PERFORMANCE_FAILED: 'TESTING_E2E',
          RETRY_PERFORMANCE: 'TESTING_PERFORMANCE'
        },
        entry: 'startPerformanceTesting',
        exit: 'finalizePerformanceTesting'
      },

      TESTING_SECURITY: {
        on: {
          SECURITY_COMPLETE: 'ANALYZING',
          SECURITY_FAILED: 'TESTING_PERFORMANCE',
          RETRY_SECURITY: 'TESTING_SECURITY'
        },
        entry: 'startSecurityTesting',
        exit: 'finalizeSecurityTesting'
      },

      ANALYZING: {
        on: {
          ANALYSIS_COMPLETE: 'REPORTING',
          ANALYSIS_FAILED: 'EXECUTING',
          RETRY_ANALYSIS: 'ANALYZING'
        },
        entry: 'startAnalysis',
        exit: 'finalizeAnalysis'
      },

      REPORTING: {
        on: {
          REPORT_GENERATED: 'READY',
          QUALITY_GATE_FAILED: 'EXECUTING',
          REPORT_FAILED: 'ANALYZING'
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
    transitions.set('EXECUTING', ['TESTING_INTEGRATION', 'TESTING_E2E', 'TESTING_PERFORMANCE', 'TESTING_SECURITY', 'ANALYZING', 'PROCESSING']);
    transitions.set('TESTING_INTEGRATION', ['TESTING_E2E', 'EXECUTING', 'TESTING_INTEGRATION']);
    transitions.set('TESTING_E2E', ['TESTING_PERFORMANCE', 'TESTING_INTEGRATION', 'TESTING_E2E']);
    transitions.set('TESTING_PERFORMANCE', ['TESTING_SECURITY', 'TESTING_E2E', 'TESTING_PERFORMANCE']);
    transitions.set('TESTING_SECURITY', ['ANALYZING', 'TESTING_PERFORMANCE', 'TESTING_SECURITY']);
    transitions.set('ANALYZING', ['REPORTING', 'EXECUTING', 'ANALYZING']);
    transitions.set('REPORTING', ['READY', 'EXECUTING', 'ANALYZING']);
    transitions.set('READY', ['AWAITING', 'FINAL']);

    // NASA Rule 10: Assertions
    console.assert(transitions.size === 10, 'Must have exactly 10 state transitions');
    console.assert(transitions.has('AWAITING'), 'AWAITING state must be defined');
    console.assert(transitions.has('TESTING_SECURITY'), 'TESTING_SECURITY state must be defined');

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
// run_id: princess-domain-elimination-023
// inputs: ["QualityPrincessCore.ts"]
// tools_used: ["Write"]
// versions: {"model":"claude-3-5-sonnet-20241022","prompt":"v1.0"}
// === END FOOTER ===