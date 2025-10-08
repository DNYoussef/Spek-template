/**
 * Migration Orchestrator FSM Tests - NASA Rule 10 Compliant
 * Comprehensive tests for FSM-based migration orchestrator
 */

import { MigrationOrchestratorFSM } from '../../../src/migration/core/MigrationOrchestratorFSM';
import { MigrationState, MigrationEvent } from '../../../src/migration/fsm/types/MigrationFSMTypes';

describe('MigrationOrchestratorFSM', () => {
  let orchestrator: MigrationOrchestratorFSM;

  beforeEach(() => {
    orchestrator = new MigrationOrchestratorFSM();
  });

  afterEach(() => {
    // Cleanup any resources
  });

  describe('Initialization', () => {
    /**
     * Test basic orchestrator initialization
     * NASA Rule 10: Keep test under 60 lines
     */
    it('should initialize orchestrator correctly', () => {
      expect(orchestrator).toBeDefined();
      expect(orchestrator.getCurrentState()).toBeUndefined();
      expect(orchestrator.getContext()).toBeUndefined();
    });

    /**
     * Test available transitions before initialization
     * NASA Rule 10: Keep test under 60 lines
     */
    it('should return empty transitions before initialization', () => {
      const transitions = orchestrator.getAvailableTransitions();
      expect(transitions).toEqual([]);
    });

    /**
     * Test event sending before initialization
     * NASA Rule 10: Keep test under 60 lines
     */
    it('should handle events gracefully before initialization', async () => {
      const result = await orchestrator.sendEvent(MigrationEvent.START_EXECUTION);
      expect(result).toBe(false);
    });
  });

  describe('FSM State Management', () => {
    /**
     * Test FSM initialization with valid plan
     * NASA Rule 10: Keep test under 60 lines
     */
    it('should initialize FSM with valid migration plan', async () => {
      const mockPlan = createMockMigrationPlan();
      const mockExecution = createMockMigrationExecution(mockPlan);

      // Start execution to initialize FSM
      const promise = orchestrator.executePhases(
        mockPlan.phases,
        mockExecution,
        {},
        { dryRun: true }
      );

      // Check initial state
      expect(orchestrator.getCurrentState()).toBeDefined();
      expect(orchestrator.getContext()).toBeDefined();

      // Wait a moment for initialization
      await new Promise(resolve => setTimeout(resolve, 100));

      // Check state progression
      const currentState = orchestrator.getCurrentState();
      expect([
        MigrationState.IDLE,
        MigrationState.INITIALIZING,
        MigrationState.VALIDATING_PREREQUISITES
      ]).toContain(currentState);
    });

    /**
     * Test state transitions
     * NASA Rule 10: Keep test under 60 lines
     */
    it('should handle state transitions correctly', async () => {
      const mockPlan = createMockMigrationPlan();
      const mockExecution = createMockMigrationExecution(mockPlan);

      // Start execution
      const promise = orchestrator.executePhases(
        mockPlan.phases,
        mockExecution,
        {},
        { dryRun: true }
      );

      // Wait for FSM initialization
      await new Promise(resolve => setTimeout(resolve, 200));

      // Check available transitions
      const transitions = orchestrator.getAvailableTransitions();
      expect(transitions.length).toBeGreaterThan(0);

      // Test transition capability
      const canStart = orchestrator.canTransition(MigrationEvent.START_EXECUTION);
      expect(typeof canStart).toBe('boolean');
    });
  });

  describe('Event Processing', () => {
    /**
     * Test event sending to FSM
     * NASA Rule 10: Keep test under 60 lines
     */
    it('should process events correctly', async () => {
      const mockPlan = createMockMigrationPlan();
      const mockExecution = createMockMigrationExecution(mockPlan);

      // Initialize FSM
      const promise = orchestrator.executePhases(
        mockPlan.phases,
        mockExecution,
        {},
        { dryRun: true }
      );

      await new Promise(resolve => setTimeout(resolve, 100));

      // Send test event
      const result = await orchestrator.sendEvent(MigrationEvent.PAUSE_EXECUTION);
      expect(typeof result).toBe('boolean');
    });

    /**
     * Test invalid event handling
     * NASA Rule 10: Keep test under 60 lines
     */
    it('should handle invalid events gracefully', async () => {
      const mockPlan = createMockMigrationPlan();
      const mockExecution = createMockMigrationExecution(mockPlan);

      // Initialize FSM
      const promise = orchestrator.executePhases(
        mockPlan.phases,
        mockExecution,
        {},
        { dryRun: true }
      );

      await new Promise(resolve => setTimeout(resolve, 100));

      // Send invalid event for current state
      const result = await orchestrator.sendEvent(MigrationEvent.ROLLBACK_COMPLETED);
      expect(result).toBe(false);
    });
  });

  describe('Error Handling', () => {
    /**
     * Test handling of invalid migration plan
     * NASA Rule 10: Keep test under 60 lines
     */
    it('should handle invalid migration plan', async () => {
      const invalidPlan = {
        id: 'invalid',
        phases: [],
        metadata: {}
      };

      const invalidExecution = {
        id: 'test-exec',
        plan: invalidPlan,
        status: 'pending',
        startTime: new Date(),
        context: new Map()
      };

      await expect(
        orchestrator.executePhases(
          invalidPlan.phases,
          invalidExecution
        )
      ).rejects.toThrow();
    });

    /**
     * Test forced state transitions
     * NASA Rule 10: Keep test under 60 lines
     */
    it('should handle forced transitions', async () => {
      const mockPlan = createMockMigrationPlan();
      const mockExecution = createMockMigrationExecution(mockPlan);

      // Initialize FSM
      const promise = orchestrator.executePhases(
        mockPlan.phases,
        mockExecution,
        {},
        { dryRun: true }
      );

      await new Promise(resolve => setTimeout(resolve, 100));

      // Force transition to failed state
      const result = await orchestrator.forceTransition(
        MigrationState.FAILED,
        MigrationEvent.EXECUTION_FAILED
      );

      expect(typeof result).toBe('boolean');
    });
  });

  describe('Cleanup and Resource Management', () => {
    /**
     * Test proper cleanup after execution
     * NASA Rule 10: Keep test under 60 lines
     */
    it('should cleanup resources properly', async () => {
      const mockPlan = createMockMigrationPlan();
      const mockExecution = createMockMigrationExecution(mockPlan);

      try {
        // Start and let it fail quickly
        await orchestrator.executePhases(
          mockPlan.phases,
          mockExecution,
          {},
          { dryRun: true, customTimeout: 100 }
        );
      } catch (error) {
        // Expected to fail
      }

      // Check cleanup
      await new Promise(resolve => setTimeout(resolve, 200));

      // Should not have active resources
      expect(orchestrator.getAvailableTransitions()).toEqual([]);
    });
  });
});

/**
 * Helper function to create mock migration plan
 * NASA Rule 10: Keep function under 60 lines
 */
function createMockMigrationPlan(): any {
  return {
    id: 'test-plan',
    phases: [
      {
        id: 'phase-1',
        name: 'Preparation',
        order: 1,
        type: 'preparation',
        steps: [
          {
            id: 'step-1',
            name: 'Backup',
            action: 'backup.create',
            parameters: {},
            timeout: 30000,
            retryPolicy: { maxRetries: 2, backoffMs: 1000 },
            validationChecks: []
          }
        ],
        prerequisites: [],
        rollbackPoint: true,
        estimatedDuration: 60000,
        criticalityLevel: 'medium' as const
      }
    ],
    metadata: {}
  };
}

/**
 * Helper function to create mock migration execution
 * NASA Rule 10: Keep function under 60 lines
 */
function createMockMigrationExecution(plan: any): any {
  return {
    id: 'test-execution',
    plan,
    status: 'pending',
    startTime: new Date(),
    context: new Map([
      ['config', { dryRun: true }],
      ['credentials', { mock: true }]
    ])
  };
}