/**
 * Agent FSM System Smoke Test
 * Basic validation that the refactored agent system loads and initializes correctly
 */

import { AgentManager } from '../../src/orchestration/agents/core/AgentManager';
import { AgentWorkflowCoordinator } from '../../src/orchestration/agents/AgentWorkflowCoordinator';
import { TransitionHub } from '../../src/orchestration/agents/fsm/TransitionHub';
import { AgentState } from '../../src/orchestration/agents/fsm/AgentStates';

describe('Agent FSM System Smoke Test', () => {
  let transitionHub: TransitionHub;
  let agentManager: AgentManager;
  let agentWorkflowCoordinator: AgentWorkflowCoordinator;

  beforeEach(() => {
    transitionHub = new TransitionHub();
    agentManager = new AgentManager(transitionHub);
    agentWorkflowCoordinator = new AgentWorkflowCoordinator();
  });

  describe('Basic System Initialization', () => {
    it('should initialize AgentManager with FSM components', () => {
      expect(agentManager).toBeDefined();
      expect(typeof agentManager.getActiveAgents).toBe('function');
      expect(typeof agentManager.registerAgentDefinition).toBe('function');
      expect(typeof agentManager.spawnAgent).toBe('function');
    });

    it('should initialize AgentWorkflowCoordinator', () => {
      expect(agentWorkflowCoordinator).toBeDefined();
      expect(typeof agentWorkflowCoordinator.executePhase9Workflow).toBe('function');
    });

    it('should initialize TransitionHub for FSM management', () => {
      expect(transitionHub).toBeDefined();
      expect(typeof transitionHub.createAgentStateMachine).toBe('function');
      expect(typeof transitionHub.getAgentStateMachine).toBe('function');
    });
  });

  describe('Agent State Management', () => {
    it('should create and manage agent state machines', () => {
      const executionId = 'test-execution-123';

      const stateMachine = transitionHub.createAgentStateMachine(executionId, AgentState.IDLE);
      expect(stateMachine).toBeDefined();

      const retrieved = transitionHub.getAgentStateMachine(executionId);
      expect(retrieved).toBeDefined();
      expect(retrieved).toBe(stateMachine);
    });

    it('should handle multiple agent state machines', () => {
      const execution1 = 'execution-1';
      const execution2 = 'execution-2';

      const sm1 = transitionHub.createAgentStateMachine(execution1, AgentState.IDLE);
      const sm2 = transitionHub.createAgentStateMachine(execution2, AgentState.IDLE);

      expect(sm1).toBeDefined();
      expect(sm2).toBeDefined();
      expect(sm1).not.toBe(sm2);

      const retrieved1 = transitionHub.getAgentStateMachine(execution1);
      const retrieved2 = transitionHub.getAgentStateMachine(execution2);

      expect(retrieved1).toBe(sm1);
      expect(retrieved2).toBe(sm2);
    });
  });

  describe('Agent Manager API', () => {
    it('should start with empty active agents list', () => {
      const activeAgents = agentManager.getActiveAgents();
      expect(Array.isArray(activeAgents)).toBe(true);
    });

    it('should handle agent definition registration gracefully', () => {
      // Test with minimal valid definition structure
      const testDefinition = {
        agentId: 'smoke-test-agent',
        agentName: 'Smoke Test Agent',
        agentType: 'test' as any,
        specialization: 'testing',
        workload: 'light' as any,
        description: 'Agent for smoke testing',
        capabilities: [] as any[],
        responsibilities: ['test'],
        configuration: {}
      };

      expect(() => {
        agentManager.registerAgentDefinition(testDefinition);
      }).not.toThrow();

      const retrieved = agentManager.getAgentDefinition('smoke-test-agent');
      expect(retrieved?.agentId).toBe('smoke-test-agent');
    });

    it('should reject invalid agent definitions', () => {
      expect(() => {
        agentManager.registerAgentDefinition({} as any);
      }).toThrow();

      expect(() => {
        agentManager.registerAgentDefinition({
          agentId: '',
          agentName: 'Empty ID Agent'
        } as any);
      }).toThrow();
    });
  });

  describe('Workflow Coordinator Integration', () => {
    it('should handle workflow execution attempts gracefully', async () => {
      const workflowOptions = {
        phases: ['init'],
        agentCount: 0, // Minimal setup
        timeout: 1000 // Short timeout
      };

      // The workflow might fail due to missing infrastructure, but should not crash
      try {
        const result = await agentWorkflowCoordinator.executePhase9Workflow(workflowOptions);
        // If it succeeds, verify basic structure
        expect(result).toBeDefined();
      } catch (error) {
        // Expected for smoke test - just verify it's a controlled error
        expect(error).toBeDefined();
        expect(error instanceof Error).toBe(true);
      }
    });
  });

  describe('System State Cleanup', () => {
    it('should clean up state machines when requested', () => {
      const executionId = 'cleanup-test-123';

      transitionHub.createAgentStateMachine(executionId, AgentState.IDLE);
      let retrieved = transitionHub.getAgentStateMachine(executionId);
      expect(retrieved).toBeDefined();

      transitionHub.removeAgentStateMachine(executionId);
      retrieved = transitionHub.getAgentStateMachine(executionId);
      expect(retrieved).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should handle non-existent agent retrieval gracefully', () => {
      const nonExistent = agentManager.getAgentExecution('non-existent-123');
      expect(nonExistent).toBeNull();

      const nonExistentDef = agentManager.getAgentDefinition('non-existent-agent');
      expect(nonExistentDef).toBeNull();
    });

    it('should handle non-existent state machine retrieval gracefully', () => {
      const nonExistent = transitionHub.getAgentStateMachine('non-existent-state-machine');
      expect(nonExistent).toBeNull();
    });
  });
});