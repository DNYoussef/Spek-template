/**
 * FSM Validation Tests
 * Comprehensive validation of the Quality Gate State Machine
 * Tests all transitions, state invariants, and guards
 */

import QualityGateStateMachine, {
  QualityGateState,
  QualityGateEvent,
  StateMachineContext,
  StateHandler,
  TransitionGuard
} from '../../../src/orchestration/quality/QualityGateStateMachine';

describe('QualityGateStateMachine - FSM Validation', () => {
  let stateMachine: QualityGateStateMachine;
  let mockStateHandler: StateHandler;

  beforeEach(() => {
    stateMachine = new QualityGateStateMachine({
      sequenceId: 'test-sequence',
      executionId: 'test-execution'
    });

    // Mock state handler for testing
    mockStateHandler = {
      onEnter: jest.fn().mockResolvedValue(undefined),
      onExit: jest.fn().mockResolvedValue(undefined),
      update: jest.fn().mockResolvedValue(undefined),
      canHandle: jest.fn().mockReturnValue(true),
      checkInvariants: jest.fn().mockReturnValue(true)
    };
  });

  afterEach(() => {
    stateMachine.destroy();
  });

  describe('State Transition Coverage', () => {
    /**
     * Test all valid transitions from each state
     * This verifies 100% transition coverage as required
     */

    test('IDLE state transitions', async () => {
      expect(stateMachine.getCurrentState()).toBe(QualityGateState.IDLE);

      // Valid transitions from IDLE
      expect(await stateMachine.processEvent(QualityGateEvent.PLAN_SEQUENCE)).toBe(true);
      expect(stateMachine.getCurrentState()).toBe(QualityGateState.PLANNED);

      // Reset for next test
      await stateMachine.reset();
      expect(await stateMachine.processEvent(QualityGateEvent.EMERGENCY_STOP)).toBe(true);
      expect(stateMachine.getCurrentState()).toBe(QualityGateState.FAILED);
    });

    test('PLANNED state transitions', async () => {
      await stateMachine.processEvent(QualityGateEvent.PLAN_SEQUENCE);
      expect(stateMachine.getCurrentState()).toBe(QualityGateState.PLANNED);

      // Test START_EXECUTION
      expect(await stateMachine.processEvent(QualityGateEvent.START_EXECUTION)).toBe(true);
      expect(stateMachine.getCurrentState()).toBe(QualityGateState.EXECUTING);

      // Reset and test CANCEL_EXECUTION
      await stateMachine.reset();
      await stateMachine.processEvent(QualityGateEvent.PLAN_SEQUENCE);
      expect(await stateMachine.processEvent(QualityGateEvent.CANCEL_EXECUTION)).toBe(true);
      expect(stateMachine.getCurrentState()).toBe(QualityGateState.IDLE);

      // Reset and test HANDLE_FAILURE
      await stateMachine.reset();
      await stateMachine.processEvent(QualityGateEvent.PLAN_SEQUENCE);
      expect(await stateMachine.processEvent(QualityGateEvent.HANDLE_FAILURE)).toBe(true);
      expect(stateMachine.getCurrentState()).toBe(QualityGateState.FAILED);
    });

    test('EXECUTING state transitions', async () => {
      await stateMachine.processEvent(QualityGateEvent.PLAN_SEQUENCE);
      await stateMachine.processEvent(QualityGateEvent.START_EXECUTION);
      expect(stateMachine.getCurrentState()).toBe(QualityGateState.EXECUTING);

      // Test SYNCHRONIZE_GATES
      expect(await stateMachine.processEvent(QualityGateEvent.SYNCHRONIZE_GATES)).toBe(true);
      expect(stateMachine.getCurrentState()).toBe(QualityGateState.SYNCHRONIZING);

      // Reset and test MEASURE_CRITERIA
      await stateMachine.reset();
      await stateMachine.processEvent(QualityGateEvent.PLAN_SEQUENCE);
      await stateMachine.processEvent(QualityGateEvent.START_EXECUTION);
      expect(await stateMachine.processEvent(QualityGateEvent.MEASURE_CRITERIA)).toBe(true);
      expect(stateMachine.getCurrentState()).toBe(QualityGateState.MEASURING);

      // Reset and test HANDLE_FAILURE
      await stateMachine.reset();
      await stateMachine.processEvent(QualityGateEvent.PLAN_SEQUENCE);
      await stateMachine.processEvent(QualityGateEvent.START_EXECUTION);
      expect(await stateMachine.processEvent(QualityGateEvent.HANDLE_FAILURE)).toBe(true);
      expect(stateMachine.getCurrentState()).toBe(QualityGateState.FAILED);

      // Reset and test INITIATE_ROLLBACK
      await stateMachine.reset();
      await stateMachine.processEvent(QualityGateEvent.PLAN_SEQUENCE);
      await stateMachine.processEvent(QualityGateEvent.START_EXECUTION);
      expect(await stateMachine.processEvent(QualityGateEvent.INITIATE_ROLLBACK)).toBe(true);
      expect(stateMachine.getCurrentState()).toBe(QualityGateState.ROLLING_BACK);

      // Reset and test EMERGENCY_STOP
      await stateMachine.reset();
      await stateMachine.processEvent(QualityGateEvent.PLAN_SEQUENCE);
      await stateMachine.processEvent(QualityGateEvent.START_EXECUTION);
      expect(await stateMachine.processEvent(QualityGateEvent.EMERGENCY_STOP)).toBe(true);
      expect(stateMachine.getCurrentState()).toBe(QualityGateState.FAILED);
    });

    test('SYNCHRONIZING state transitions', async () => {
      await stateMachine.processEvent(QualityGateEvent.PLAN_SEQUENCE);
      await stateMachine.processEvent(QualityGateEvent.START_EXECUTION);
      await stateMachine.processEvent(QualityGateEvent.SYNCHRONIZE_GATES);
      expect(stateMachine.getCurrentState()).toBe(QualityGateState.SYNCHRONIZING);

      // Test MEASURE_CRITERIA
      expect(await stateMachine.processEvent(QualityGateEvent.MEASURE_CRITERIA)).toBe(true);
      expect(stateMachine.getCurrentState()).toBe(QualityGateState.MEASURING);

      // Reset and test RETRY_OPERATION
      await stateMachine.reset();
      await stateMachine.processEvent(QualityGateEvent.PLAN_SEQUENCE);
      await stateMachine.processEvent(QualityGateEvent.START_EXECUTION);
      await stateMachine.processEvent(QualityGateEvent.SYNCHRONIZE_GATES);
      expect(await stateMachine.processEvent(QualityGateEvent.RETRY_OPERATION)).toBe(true);
      expect(stateMachine.getCurrentState()).toBe(QualityGateState.EXECUTING);

      // Reset and test HANDLE_FAILURE
      await stateMachine.reset();
      await stateMachine.processEvent(QualityGateEvent.PLAN_SEQUENCE);
      await stateMachine.processEvent(QualityGateEvent.START_EXECUTION);
      await stateMachine.processEvent(QualityGateEvent.SYNCHRONIZE_GATES);
      expect(await stateMachine.processEvent(QualityGateEvent.HANDLE_FAILURE)).toBe(true);
      expect(stateMachine.getCurrentState()).toBe(QualityGateState.FAILED);

      // Reset and test EMERGENCY_STOP
      await stateMachine.reset();
      await stateMachine.processEvent(QualityGateEvent.PLAN_SEQUENCE);
      await stateMachine.processEvent(QualityGateEvent.START_EXECUTION);
      await stateMachine.processEvent(QualityGateEvent.SYNCHRONIZE_GATES);
      expect(await stateMachine.processEvent(QualityGateEvent.EMERGENCY_STOP)).toBe(true);
      expect(stateMachine.getCurrentState()).toBe(QualityGateState.FAILED);
    });

    test('MEASURING state transitions', async () => {
      await stateMachine.processEvent(QualityGateEvent.PLAN_SEQUENCE);
      await stateMachine.processEvent(QualityGateEvent.START_EXECUTION);
      await stateMachine.processEvent(QualityGateEvent.MEASURE_CRITERIA);
      expect(stateMachine.getCurrentState()).toBe(QualityGateState.MEASURING);

      // Test ANALYZE_RESULTS
      expect(await stateMachine.processEvent(QualityGateEvent.ANALYZE_RESULTS)).toBe(true);
      expect(stateMachine.getCurrentState()).toBe(QualityGateState.ANALYZING);

      // Reset and test RETRY_OPERATION
      await stateMachine.reset();
      await stateMachine.processEvent(QualityGateEvent.PLAN_SEQUENCE);
      await stateMachine.processEvent(QualityGateEvent.START_EXECUTION);
      await stateMachine.processEvent(QualityGateEvent.MEASURE_CRITERIA);
      expect(await stateMachine.processEvent(QualityGateEvent.RETRY_OPERATION)).toBe(true);
      expect(stateMachine.getCurrentState()).toBe(QualityGateState.EXECUTING);

      // Reset and test HANDLE_FAILURE
      await stateMachine.reset();
      await stateMachine.processEvent(QualityGateEvent.PLAN_SEQUENCE);
      await stateMachine.processEvent(QualityGateEvent.START_EXECUTION);
      await stateMachine.processEvent(QualityGateEvent.MEASURE_CRITERIA);
      expect(await stateMachine.processEvent(QualityGateEvent.HANDLE_FAILURE)).toBe(true);
      expect(stateMachine.getCurrentState()).toBe(QualityGateState.FAILED);

      // Reset and test EMERGENCY_STOP
      await stateMachine.reset();
      await stateMachine.processEvent(QualityGateEvent.PLAN_SEQUENCE);
      await stateMachine.processEvent(QualityGateEvent.START_EXECUTION);
      await stateMachine.processEvent(QualityGateEvent.MEASURE_CRITERIA);
      expect(await stateMachine.processEvent(QualityGateEvent.EMERGENCY_STOP)).toBe(true);
      expect(stateMachine.getCurrentState()).toBe(QualityGateState.FAILED);
    });

    test('ANALYZING state transitions', async () => {
      await stateMachine.processEvent(QualityGateEvent.PLAN_SEQUENCE);
      await stateMachine.processEvent(QualityGateEvent.START_EXECUTION);
      await stateMachine.processEvent(QualityGateEvent.MEASURE_CRITERIA);
      await stateMachine.processEvent(QualityGateEvent.ANALYZE_RESULTS);
      expect(stateMachine.getCurrentState()).toBe(QualityGateState.ANALYZING);

      // Test GENERATE_REPORTS
      expect(await stateMachine.processEvent(QualityGateEvent.GENERATE_REPORTS)).toBe(true);
      expect(stateMachine.getCurrentState()).toBe(QualityGateState.REPORTING);

      // Reset and test COMPLETE_SUCCESS with progress = 1.0
      await stateMachine.reset();
      await stateMachine.processEvent(QualityGateEvent.PLAN_SEQUENCE);
      await stateMachine.processEvent(QualityGateEvent.START_EXECUTION);
      await stateMachine.processEvent(QualityGateEvent.MEASURE_CRITERIA);
      await stateMachine.processEvent(QualityGateEvent.ANALYZE_RESULTS);
      stateMachine.updateContext({ progress: 1.0 });
      expect(await stateMachine.processEvent(QualityGateEvent.COMPLETE_SUCCESS)).toBe(true);
      expect(stateMachine.getCurrentState()).toBe(QualityGateState.COMPLETED);

      // Reset and test HANDLE_FAILURE
      await stateMachine.reset();
      await stateMachine.processEvent(QualityGateEvent.PLAN_SEQUENCE);
      await stateMachine.processEvent(QualityGateEvent.START_EXECUTION);
      await stateMachine.processEvent(QualityGateEvent.MEASURE_CRITERIA);
      await stateMachine.processEvent(QualityGateEvent.ANALYZE_RESULTS);
      expect(await stateMachine.processEvent(QualityGateEvent.HANDLE_FAILURE)).toBe(true);
      expect(stateMachine.getCurrentState()).toBe(QualityGateState.FAILED);

      // Reset and test RETRY_OPERATION
      await stateMachine.reset();
      await stateMachine.processEvent(QualityGateEvent.PLAN_SEQUENCE);
      await stateMachine.processEvent(QualityGateEvent.START_EXECUTION);
      await stateMachine.processEvent(QualityGateEvent.MEASURE_CRITERIA);
      await stateMachine.processEvent(QualityGateEvent.ANALYZE_RESULTS);
      expect(await stateMachine.processEvent(QualityGateEvent.RETRY_OPERATION)).toBe(true);
      expect(stateMachine.getCurrentState()).toBe(QualityGateState.MEASURING);

      // Reset and test EMERGENCY_STOP
      await stateMachine.reset();
      await stateMachine.processEvent(QualityGateEvent.PLAN_SEQUENCE);
      await stateMachine.processEvent(QualityGateEvent.START_EXECUTION);
      await stateMachine.processEvent(QualityGateEvent.MEASURE_CRITERIA);
      await stateMachine.processEvent(QualityGateEvent.ANALYZE_RESULTS);
      expect(await stateMachine.processEvent(QualityGateEvent.EMERGENCY_STOP)).toBe(true);
      expect(stateMachine.getCurrentState()).toBe(QualityGateState.FAILED);
    });

    test('REPORTING state transitions', async () => {
      await stateMachine.processEvent(QualityGateEvent.PLAN_SEQUENCE);
      await stateMachine.processEvent(QualityGateEvent.START_EXECUTION);
      await stateMachine.processEvent(QualityGateEvent.MEASURE_CRITERIA);
      await stateMachine.processEvent(QualityGateEvent.ANALYZE_RESULTS);
      await stateMachine.processEvent(QualityGateEvent.GENERATE_REPORTS);
      expect(stateMachine.getCurrentState()).toBe(QualityGateState.REPORTING);

      // Test COMPLETE_SUCCESS with progress = 1.0
      stateMachine.updateContext({ progress: 1.0 });
      expect(await stateMachine.processEvent(QualityGateEvent.COMPLETE_SUCCESS)).toBe(true);
      expect(stateMachine.getCurrentState()).toBe(QualityGateState.COMPLETED);

      // Reset and test HANDLE_FAILURE
      await stateMachine.reset();
      await stateMachine.processEvent(QualityGateEvent.PLAN_SEQUENCE);
      await stateMachine.processEvent(QualityGateEvent.START_EXECUTION);
      await stateMachine.processEvent(QualityGateEvent.MEASURE_CRITERIA);
      await stateMachine.processEvent(QualityGateEvent.ANALYZE_RESULTS);
      await stateMachine.processEvent(QualityGateEvent.GENERATE_REPORTS);
      expect(await stateMachine.processEvent(QualityGateEvent.HANDLE_FAILURE)).toBe(true);
      expect(stateMachine.getCurrentState()).toBe(QualityGateState.FAILED);

      // Reset and test EMERGENCY_STOP
      await stateMachine.reset();
      await stateMachine.processEvent(QualityGateEvent.PLAN_SEQUENCE);
      await stateMachine.processEvent(QualityGateEvent.START_EXECUTION);
      await stateMachine.processEvent(QualityGateEvent.MEASURE_CRITERIA);
      await stateMachine.processEvent(QualityGateEvent.ANALYZE_RESULTS);
      await stateMachine.processEvent(QualityGateEvent.GENERATE_REPORTS);
      expect(await stateMachine.processEvent(QualityGateEvent.EMERGENCY_STOP)).toBe(true);
      expect(stateMachine.getCurrentState()).toBe(QualityGateState.FAILED);
    });

    test('FAILED state transitions', async () => {
      await stateMachine.processEvent(QualityGateEvent.PLAN_SEQUENCE);
      await stateMachine.processEvent(QualityGateEvent.HANDLE_FAILURE);
      expect(stateMachine.getCurrentState()).toBe(QualityGateState.FAILED);

      // Test INITIATE_ROLLBACK
      expect(await stateMachine.processEvent(QualityGateEvent.INITIATE_ROLLBACK)).toBe(true);
      expect(stateMachine.getCurrentState()).toBe(QualityGateState.ROLLING_BACK);

      // Reset and test RETRY_OPERATION
      await stateMachine.reset();
      await stateMachine.processEvent(QualityGateEvent.PLAN_SEQUENCE);
      await stateMachine.processEvent(QualityGateEvent.HANDLE_FAILURE);
      expect(await stateMachine.processEvent(QualityGateEvent.RETRY_OPERATION)).toBe(true);
      expect(stateMachine.getCurrentState()).toBe(QualityGateState.EXECUTING);

      // Reset and test RESET_STATE
      await stateMachine.reset();
      await stateMachine.processEvent(QualityGateEvent.PLAN_SEQUENCE);
      await stateMachine.processEvent(QualityGateEvent.HANDLE_FAILURE);
      expect(await stateMachine.processEvent(QualityGateEvent.RESET_STATE)).toBe(true);
      expect(stateMachine.getCurrentState()).toBe(QualityGateState.IDLE);

      // Reset and test APPROVE_OVERRIDE
      await stateMachine.reset();
      await stateMachine.processEvent(QualityGateEvent.PLAN_SEQUENCE);
      await stateMachine.processEvent(QualityGateEvent.HANDLE_FAILURE);
      expect(await stateMachine.processEvent(QualityGateEvent.APPROVE_OVERRIDE)).toBe(true);
      expect(stateMachine.getCurrentState()).toBe(QualityGateState.COMPLETED);
    });

    test('ROLLING_BACK state transitions', async () => {
      await stateMachine.processEvent(QualityGateEvent.PLAN_SEQUENCE);
      await stateMachine.processEvent(QualityGateEvent.START_EXECUTION);
      await stateMachine.processEvent(QualityGateEvent.INITIATE_ROLLBACK);
      expect(stateMachine.getCurrentState()).toBe(QualityGateState.ROLLING_BACK);

      // Test RESET_STATE
      expect(await stateMachine.processEvent(QualityGateEvent.RESET_STATE)).toBe(true);
      expect(stateMachine.getCurrentState()).toBe(QualityGateState.IDLE);

      // Reset and test HANDLE_FAILURE
      await stateMachine.reset();
      await stateMachine.processEvent(QualityGateEvent.PLAN_SEQUENCE);
      await stateMachine.processEvent(QualityGateEvent.START_EXECUTION);
      await stateMachine.processEvent(QualityGateEvent.INITIATE_ROLLBACK);
      expect(await stateMachine.processEvent(QualityGateEvent.HANDLE_FAILURE)).toBe(true);
      expect(stateMachine.getCurrentState()).toBe(QualityGateState.FAILED);
    });

    test('COMPLETED state transitions', async () => {
      await stateMachine.processEvent(QualityGateEvent.PLAN_SEQUENCE);
      await stateMachine.processEvent(QualityGateEvent.START_EXECUTION);
      await stateMachine.processEvent(QualityGateEvent.MEASURE_CRITERIA);
      await stateMachine.processEvent(QualityGateEvent.ANALYZE_RESULTS);
      stateMachine.updateContext({ progress: 1.0 });
      await stateMachine.processEvent(QualityGateEvent.COMPLETE_SUCCESS);
      expect(stateMachine.getCurrentState()).toBe(QualityGateState.COMPLETED);

      // Test RESET_STATE
      expect(await stateMachine.processEvent(QualityGateEvent.RESET_STATE)).toBe(true);
      expect(stateMachine.getCurrentState()).toBe(QualityGateState.IDLE);
    });
  });

  describe('Invalid Transition Handling', () => {
    test('should reject invalid transitions', async () => {
      expect(stateMachine.getCurrentState()).toBe(QualityGateState.IDLE);

      // Invalid transition from IDLE
      expect(await stateMachine.processEvent(QualityGateEvent.MEASURE_CRITERIA)).toBe(false);
      expect(stateMachine.getCurrentState()).toBe(QualityGateState.IDLE); // State unchanged

      // Invalid transition from COMPLETED
      await stateMachine.processEvent(QualityGateEvent.PLAN_SEQUENCE);
      await stateMachine.processEvent(QualityGateEvent.START_EXECUTION);
      await stateMachine.processEvent(QualityGateEvent.MEASURE_CRITERIA);
      await stateMachine.processEvent(QualityGateEvent.ANALYZE_RESULTS);
      stateMachine.updateContext({ progress: 1.0 });
      await stateMachine.processEvent(QualityGateEvent.COMPLETE_SUCCESS);
      expect(stateMachine.getCurrentState()).toBe(QualityGateState.COMPLETED);

      expect(await stateMachine.processEvent(QualityGateEvent.START_EXECUTION)).toBe(false);
      expect(stateMachine.getCurrentState()).toBe(QualityGateState.COMPLETED); // State unchanged
    });
  });

  describe('Guard Validation', () => {
    test('retry limit guard', async () => {
      await stateMachine.processEvent(QualityGateEvent.PLAN_SEQUENCE);
      await stateMachine.processEvent(QualityGateEvent.START_EXECUTION);
      await stateMachine.processEvent(QualityGateEvent.HANDLE_FAILURE);

      // Should allow retries up to limit
      for (let i = 0; i < 3; i++) {
        expect(await stateMachine.processEvent(QualityGateEvent.RETRY_OPERATION)).toBe(true);
        await stateMachine.processEvent(QualityGateEvent.HANDLE_FAILURE);
      }

      // Should block retry after limit
      expect(await stateMachine.processEvent(QualityGateEvent.RETRY_OPERATION)).toBe(false);
    });

    test('progress completion guard', async () => {
      await stateMachine.processEvent(QualityGateEvent.PLAN_SEQUENCE);
      await stateMachine.processEvent(QualityGateEvent.START_EXECUTION);
      await stateMachine.processEvent(QualityGateEvent.MEASURE_CRITERIA);
      await stateMachine.processEvent(QualityGateEvent.ANALYZE_RESULTS);

      // Should block completion when progress < 1.0
      stateMachine.updateContext({ progress: 0.5 });
      expect(await stateMachine.processEvent(QualityGateEvent.COMPLETE_SUCCESS)).toBe(false);

      // Should allow completion when progress >= 1.0
      stateMachine.updateContext({ progress: 1.0 });
      expect(await stateMachine.processEvent(QualityGateEvent.COMPLETE_SUCCESS)).toBe(true);
    });

    test('error threshold guard', async () => {
      await stateMachine.processEvent(QualityGateEvent.PLAN_SEQUENCE);

      // Artificially set high error count
      stateMachine.updateContext({ errorCount: 6 });

      // Should still allow failure transitions
      expect(await stateMachine.processEvent(QualityGateEvent.HANDLE_FAILURE)).toBe(true);

      // Should block non-failure transitions when error count is high
      await stateMachine.processEvent(QualityGateEvent.RESET_STATE);
      stateMachine.updateContext({ errorCount: 6 });
      expect(await stateMachine.processEvent(QualityGateEvent.PLAN_SEQUENCE)).toBe(false);
    });
  });

  describe('State Handler Integration', () => {
    test('should call state handlers during transitions', async () => {
      stateMachine.registerStateHandler(QualityGateState.PLANNED, mockStateHandler);
      stateMachine.registerStateHandler(QualityGateState.EXECUTING, mockStateHandler);

      await stateMachine.processEvent(QualityGateEvent.PLAN_SEQUENCE);

      // Should call onEnter for PLANNED state
      expect(mockStateHandler.onEnter).toHaveBeenCalled();

      await stateMachine.processEvent(QualityGateEvent.START_EXECUTION);

      // Should call onExit for PLANNED and onEnter for EXECUTING
      expect(mockStateHandler.onExit).toHaveBeenCalled();
      expect(mockStateHandler.onEnter).toHaveBeenCalledTimes(2);
    });

    test('should check invariants periodically', (done) => {
      const mockHandler = {
        ...mockStateHandler,
        checkInvariants: jest.fn().mockReturnValue(false)
      };

      stateMachine.registerStateHandler(QualityGateState.IDLE, mockHandler);

      // Should eventually trigger invariant violation
      stateMachine.on('invariant:violation', () => {
        expect(mockHandler.checkInvariants).toHaveBeenCalled();
        done();
      });
    });
  });

  describe('Context Management', () => {
    test('should update context during transitions', async () => {
      const initialContext = stateMachine.getContext();
      expect(initialContext.retryCount).toBe(0);
      expect(initialContext.errorCount).toBe(0);

      await stateMachine.processEvent(QualityGateEvent.PLAN_SEQUENCE);
      await stateMachine.processEvent(QualityGateEvent.START_EXECUTION);
      await stateMachine.processEvent(QualityGateEvent.HANDLE_FAILURE);

      const contextAfterFailure = stateMachine.getContext();
      expect(contextAfterFailure.errorCount).toBe(1);

      await stateMachine.processEvent(QualityGateEvent.RETRY_OPERATION);

      const contextAfterRetry = stateMachine.getContext();
      expect(contextAfterRetry.retryCount).toBe(1);
    });

    test('should allow context updates', () => {
      const updates = { currentGate: 'test-gate', progress: 0.5 };
      stateMachine.updateContext(updates);

      const context = stateMachine.getContext();
      expect(context.currentGate).toBe('test-gate');
      expect(context.progress).toBe(0.5);
    });
  });

  describe('Event Validation', () => {
    test('should return valid events for current state', () => {
      expect(stateMachine.getCurrentState()).toBe(QualityGateState.IDLE);

      const validEvents = stateMachine.getValidEvents();
      expect(validEvents).toContain(QualityGateEvent.PLAN_SEQUENCE);
      expect(validEvents).toContain(QualityGateEvent.EMERGENCY_STOP);
    });

    test('should check if events can be handled', () => {
      expect(stateMachine.canHandleEvent(QualityGateEvent.PLAN_SEQUENCE)).toBe(true);
      expect(stateMachine.canHandleEvent(QualityGateEvent.START_EXECUTION)).toBe(false);
    });
  });

  describe('Metrics and History', () => {
    test('should track transition history', async () => {
      await stateMachine.processEvent(QualityGateEvent.PLAN_SEQUENCE);
      await stateMachine.processEvent(QualityGateEvent.START_EXECUTION);

      const history = stateMachine.getTransitionHistory();
      expect(history).toHaveLength(2);
      expect(history[0].from).toBe(QualityGateState.IDLE);
      expect(history[0].to).toBe(QualityGateState.PLANNED);
      expect(history[0].event).toBe(QualityGateEvent.PLAN_SEQUENCE);
      expect(history[0].success).toBe(true);
    });

    test('should provide metrics', async () => {
      await stateMachine.processEvent(QualityGateEvent.PLAN_SEQUENCE);
      await stateMachine.processEvent(QualityGateEvent.START_EXECUTION);

      const metrics = stateMachine.getMetrics();
      expect(metrics.currentState).toBe(QualityGateState.EXECUTING);
      expect(metrics.totalTransitions).toBe(2);
      expect(metrics.successfulTransitions).toBe(2);
      expect(metrics.failedTransitions).toBe(0);
      expect(metrics.successRate).toBe(1.0);
    });
  });

  describe('Emergency Handling', () => {
    test('should handle forced state changes', () => {
      stateMachine.forceState(QualityGateState.FAILED, 'Emergency intervention');
      expect(stateMachine.getCurrentState()).toBe(QualityGateState.FAILED);
    });

    test('should handle reset operations', async () => {
      await stateMachine.processEvent(QualityGateEvent.PLAN_SEQUENCE);
      await stateMachine.processEvent(QualityGateEvent.START_EXECUTION);

      await stateMachine.reset();

      expect(stateMachine.getCurrentState()).toBe(QualityGateState.IDLE);
      const context = stateMachine.getContext();
      expect(context.progress).toBe(0);
      expect(context.errorCount).toBe(0);
      expect(context.retryCount).toBe(0);
    });
  });

  describe('Error Handling', () => {
    test('should handle state handler errors gracefully', async () => {
      const errorHandler = {
        ...mockStateHandler,
        onEnter: jest.fn().mockRejectedValue(new Error('Handler error'))
      };

      stateMachine.registerStateHandler(QualityGateState.PLANNED, errorHandler);

      const result = await stateMachine.processEvent(QualityGateEvent.PLAN_SEQUENCE);
      expect(result).toBe(false);

      const history = stateMachine.getTransitionHistory();
      const lastTransition = history[history.length - 1];
      expect(lastTransition.success).toBe(false);
    });

    test('should handle transition timeouts', (done) => {
      const slowHandler = {
        ...mockStateHandler,
        onEnter: jest.fn().mockImplementation(() => new Promise(() => {})) // Never resolves
      };

      stateMachine.registerStateHandler(QualityGateState.PLANNED, slowHandler);

      stateMachine.on('transition:timeout', () => {
        done();
      });

      stateMachine.processEvent(QualityGateEvent.PLAN_SEQUENCE);
    }, 35000); // Increase timeout to 35 seconds
  });

  describe('Complete State Matrix Validation', () => {
    test('exhaustive state-event matrix test', async () => {
      const states = Object.values(QualityGateState);
      const events = Object.values(QualityGateEvent);
      const results: Array<{state: QualityGateState, event: QualityGateEvent, success: boolean}> = [];

      for (const state of states) {
        for (const event of events) {
          // Reset to known state for each test
          await stateMachine.reset();

          // Navigate to target state if not IDLE
          if (state !== QualityGateState.IDLE) {
            await navigateToState(stateMachine, state);
          }

          // Test the event
          const success = await stateMachine.processEvent(event);
          results.push({ state, event, success });
        }
      }

      // Analyze results for coverage
      const successfulTransitions = results.filter(r => r.success);
      const failedTransitions = results.filter(r => !r.success);

      console.log(`Total state-event combinations tested: ${results.length}`);
      console.log(`Successful transitions: ${successfulTransitions.length}`);
      console.log(`Failed/blocked transitions: ${failedTransitions.length}`);

      // Should have at least one valid transition from each state
      for (const state of states) {
        const stateTransitions = results.filter(r => r.state === state && r.success);
        expect(stateTransitions.length).toBeGreaterThan(0);
      }
    });
  });
});

/**
 * Helper function to navigate to a specific state
 */
async function navigateToState(sm: QualityGateStateMachine, targetState: QualityGateState): Promise<void> {
  switch (targetState) {
    case QualityGateState.PLANNED:
      await sm.processEvent(QualityGateEvent.PLAN_SEQUENCE);
      break;
    case QualityGateState.EXECUTING:
      await sm.processEvent(QualityGateEvent.PLAN_SEQUENCE);
      await sm.processEvent(QualityGateEvent.START_EXECUTION);
      break;
    case QualityGateState.SYNCHRONIZING:
      await sm.processEvent(QualityGateEvent.PLAN_SEQUENCE);
      await sm.processEvent(QualityGateEvent.START_EXECUTION);
      await sm.processEvent(QualityGateEvent.SYNCHRONIZE_GATES);
      break;
    case QualityGateState.MEASURING:
      await sm.processEvent(QualityGateEvent.PLAN_SEQUENCE);
      await sm.processEvent(QualityGateEvent.START_EXECUTION);
      await sm.processEvent(QualityGateEvent.MEASURE_CRITERIA);
      break;
    case QualityGateState.ANALYZING:
      await sm.processEvent(QualityGateEvent.PLAN_SEQUENCE);
      await sm.processEvent(QualityGateEvent.START_EXECUTION);
      await sm.processEvent(QualityGateEvent.MEASURE_CRITERIA);
      await sm.processEvent(QualityGateEvent.ANALYZE_RESULTS);
      break;
    case QualityGateState.REPORTING:
      await sm.processEvent(QualityGateEvent.PLAN_SEQUENCE);
      await sm.processEvent(QualityGateEvent.START_EXECUTION);
      await sm.processEvent(QualityGateEvent.MEASURE_CRITERIA);
      await sm.processEvent(QualityGateEvent.ANALYZE_RESULTS);
      await sm.processEvent(QualityGateEvent.GENERATE_REPORTS);
      break;
    case QualityGateState.COMPLETED:
      await sm.processEvent(QualityGateEvent.PLAN_SEQUENCE);
      await sm.processEvent(QualityGateEvent.START_EXECUTION);
      await sm.processEvent(QualityGateEvent.MEASURE_CRITERIA);
      await sm.processEvent(QualityGateEvent.ANALYZE_RESULTS);
      sm.updateContext({ progress: 1.0 });
      await sm.processEvent(QualityGateEvent.COMPLETE_SUCCESS);
      break;
    case QualityGateState.FAILED:
      await sm.processEvent(QualityGateEvent.PLAN_SEQUENCE);
      await sm.processEvent(QualityGateEvent.HANDLE_FAILURE);
      break;
    case QualityGateState.ROLLING_BACK:
      await sm.processEvent(QualityGateEvent.PLAN_SEQUENCE);
      await sm.processEvent(QualityGateEvent.START_EXECUTION);
      await sm.processEvent(QualityGateEvent.INITIATE_ROLLBACK);
      break;
    case QualityGateState.IDLE:
    default:
      // Already in IDLE state
      break;
  }
}

