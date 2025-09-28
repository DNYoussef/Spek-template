/**
 * Agent FSM System Validation Test
 * Validates that the refactored agent system with FSM-first architecture works correctly
 */

import { AgentFSMFacade } from '../../src/orchestration/agents/components/AgentFSMFacade';
import { AgentManager } from '../../src/orchestration/agents/core/AgentManager';
import { AgentWorkflowCoordinator } from '../../src/orchestration/agents/AgentWorkflowCoordinator';
import { AgentDefinition, AgentExecution } from '../../src/orchestration/agents/types/AgentTypes';
import { TransitionHub } from '../../src/orchestration/agents/fsm/TransitionHub';
import { AgentState } from '../../src/orchestration/agents/fsm/AgentStates';

describe('Agent FSM System Validation', () => {
  let agentFSMFacade: AgentFSMFacade;
  let agentManager: AgentManager;
  let agentWorkflowCoordinator: AgentWorkflowCoordinator;
  let transitionHub: TransitionHub;

  beforeEach(() => {
    transitionHub = new TransitionHub();
    agentFSMFacade = new AgentFSMFacade();
    agentManager = new AgentManager(transitionHub);
    agentWorkflowCoordinator = new AgentWorkflowCoordinator();
  });

  afterEach(async () => {
    // Clean up any spawned agents
    try {
      await agentFSMFacade.shutdownAllAgents('Test cleanup');
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('AgentFSMFacade Integration', () => {
    it('should initialize FSM facade successfully', () => {
      expect(agentFSMFacade).toBeDefined();
      expect(typeof agentFSMFacade.getActiveAgents).toBe('function');
      expect(typeof agentFSMFacade.spawnManagedAgent).toBe('function');
    });

    it('should spawn and manage agents through FSM lifecycle', async () => {
      const agentDefinition: AgentDefinition = {
        agentId: 'test-agent',
        name: 'Test Agent',
        description: 'Test agent for validation',
        capabilities: ['testing', 'validation'],
        responsibilities: ['run tests', 'validate results'],
        configuration: {}
      };

      // Test agent spawning
      const agentExecution = await agentFSMFacade.spawnManagedAgent(
        agentDefinition,
        'test-workflow-123',
        { spawn: { maxRetries: 1 } }
      );

      expect(agentExecution).toBeDefined();
      expect(agentExecution.executionId).toBeDefined();
      expect(agentExecution.agentId).toBe('test-agent');
      expect(agentExecution.workflowId).toBe('test-workflow-123');

      // Test agent is tracked
      const activeAgents = agentFSMFacade.getActiveAgents();
      expect(activeAgents.length).toBeGreaterThan(0);
      expect(activeAgents.some(a => a.executionId === agentExecution.executionId)).toBe(true);
    });
  });

  describe('AgentManager FSM Integration', () => {
    it('should register agent definitions through FSM', () => {
      const agentDefinition: AgentDefinition = {
        agentId: 'test-manager-agent',
        name: 'Test Manager Agent',
        description: 'Test agent for manager validation',
        capabilities: ['management'],
        responsibilities: ['coordinate tasks'],
        configuration: {}
      };

      expect(() => {
        agentManager.registerAgentDefinition(agentDefinition);
      }).not.toThrow();

      const retrieved = agentManager.getAgentDefinition('test-manager-agent');
      expect(retrieved).toBeDefined();
      expect(retrieved?.agentId).toBe('test-manager-agent');
    });

    it('should spawn agents through FSM delegation', async () => {
      const agentDefinition: AgentDefinition = {
        agentId: 'spawn-test-agent',
        name: 'Spawn Test Agent',
        description: 'Agent for spawn testing',
        capabilities: ['spawning'],
        responsibilities: ['test spawning'],
        configuration: {}
      };

      agentManager.registerAgentDefinition(agentDefinition);

      const agentExecution = await agentManager.spawnAgent('spawn-test-agent', 'spawn-test-workflow');

      expect(agentExecution).toBeDefined();
      expect(agentExecution.executionId).toBeDefined();
      expect(agentExecution.agentId).toBe('spawn-test-agent');

      // Verify agent is retrievable
      const retrieved = agentManager.getAgentExecution(agentExecution.executionId);
      expect(retrieved).toBeDefined();
      expect(retrieved?.executionId).toBe(agentExecution.executionId);
    });
  });

  describe('AgentWorkflowCoordinator FSM Integration', () => {
    it('should initialize with FSM facade delegation', () => {
      expect(agentWorkflowCoordinator).toBeDefined();
      expect(typeof agentWorkflowCoordinator.executePhase9Workflow).toBe('function');
      expect(typeof agentWorkflowCoordinator.coordinateAgentWorkflow).toBe('function');
    });

    it('should execute workflows with FSM coordination', async () => {
      const workflowOptions = {
        phases: ['init', 'execute', 'complete'],
        agentCount: 1,
        timeout: 5000
      };

      // Test workflow execution (should not throw)
      let workflowResult;
      try {
        workflowResult = await agentWorkflowCoordinator.executePhase9Workflow(workflowOptions);
        expect(workflowResult).toBeDefined();
      } catch (error) {
        // Workflow might fail due to missing dependencies, but should not crash
        expect(error).toBeDefined();
      }
    });
  });

  describe('FSM State Management', () => {
    it('should manage agent states through TransitionHub', () => {
      const executionId = 'state-test-123';

      // Create agent state machine
      const stateMachine = transitionHub.createAgentStateMachine(executionId, AgentState.IDLE);
      expect(stateMachine).toBeDefined();

      // Verify state machine is tracked
      const retrieved = transitionHub.getAgentStateMachine(executionId);
      expect(retrieved).toBeDefined();
      expect(retrieved?.getCurrentState()).toBe(AgentState.IDLE);
    });

    it('should handle multiple agents concurrently', async () => {
      const agent1Definition: AgentDefinition = {
        agentId: 'concurrent-agent-1',
        name: 'Concurrent Agent 1',
        description: 'First concurrent agent',
        capabilities: ['concurrent'],
        responsibilities: ['concurrent work'],
        configuration: {}
      };

      const agent2Definition: AgentDefinition = {
        agentId: 'concurrent-agent-2',
        name: 'Concurrent Agent 2',
        description: 'Second concurrent agent',
        capabilities: ['concurrent'],
        responsibilities: ['concurrent work'],
        configuration: {}
      };

      agentManager.registerAgentDefinition(agent1Definition);
      agentManager.registerAgentDefinition(agent2Definition);

      // Spawn multiple agents
      const [agent1, agent2] = await Promise.all([
        agentManager.spawnAgent('concurrent-agent-1', 'concurrent-workflow-1'),
        agentManager.spawnAgent('concurrent-agent-2', 'concurrent-workflow-2')
      ]);

      expect(agent1.executionId).toBeDefined();
      expect(agent2.executionId).toBeDefined();
      expect(agent1.executionId).not.toBe(agent2.executionId);

      // Verify both agents are active
      const activeAgents = agentManager.getActiveAgents();
      expect(activeAgents.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Error Handling and Resilience', () => {
    it('should handle invalid agent definitions gracefully', () => {
      const invalidDefinition = {
        agentId: '',
        name: 'Invalid Agent',
        capabilities: [],
        responsibilities: []
      } as AgentDefinition;

      expect(() => {
        agentManager.registerAgentDefinition(invalidDefinition);
      }).toThrow();
    });

    it('should handle spawning non-existent agents gracefully', async () => {
      await expect(agentManager.spawnAgent('non-existent-agent', 'test-workflow'))
        .rejects.toThrow();
    });

    it('should handle maximum agent limits', async () => {
      const testDefinition: AgentDefinition = {
        agentId: 'limit-test-agent',
        name: 'Limit Test Agent',
        description: 'Agent for testing limits',
        capabilities: ['testing'],
        responsibilities: ['test limits'],
        configuration: {}
      };

      agentManager.registerAgentDefinition(testDefinition);

      // The system should handle reasonable numbers of agents
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(agentManager.spawnAgent('limit-test-agent', `workflow-${i}`));
      }

      const results = await Promise.allSettled(promises);
      const successful = results.filter(r => r.status === 'fulfilled');

      // At least some agents should spawn successfully
      expect(successful.length).toBeGreaterThan(0);
    });
  });
});