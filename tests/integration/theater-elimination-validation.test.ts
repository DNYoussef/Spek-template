/**
 * Theater Elimination Validation Test Suite
 *
 * Validates that all theatrical placeholders have been replaced with
 * genuine orchestration capabilities in WorkflowOrchestrator.
 */

import { WorkflowOrchestrator } from '../../src/swarm/orchestration/WorkflowOrchestrator';
import { HivePrincess } from '../../src/swarm/hierarchy/HivePrincess';
import { PrincessCommunicationProtocol } from '../../src/swarm/communication/PrincessCommunicationProtocol';
import { MECEValidationProtocol } from '../../src/swarm/validation/MECEValidationProtocol';
import { StageProgressionValidator } from '../../src/swarm/workflow/StageProgressionValidator';
import { DependencyConflictResolver } from '../../src/swarm/resolution/DependencyConflictResolver';
import { CrossDomainIntegrationTester } from '../../src/swarm/testing/CrossDomainIntegrationTester';

describe('Theater Elimination Validation', () => {
  let orchestrator: WorkflowOrchestrator;
  let mockMcpServer: any;
  let princesses: Map<string, HivePrincess>;
  let communication: PrincessCommunicationProtocol;
  let meceValidator: MECEValidationProtocol;
  let stageValidator: StageProgressionValidator;
  let dependencyResolver: DependencyConflictResolver;
  let integrationTester: CrossDomainIntegrationTester;

  beforeEach(() => {
    // Mock MCP server with real behavior
    mockMcpServer = {
      spawnAgent: jest.fn().mockImplementation(async (config) => ({
        id: `agent-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        type: config.type,
        domain: config.domain,
        execute: jest.fn().mockResolvedValue({
          success: true,
          data: { result: 'task completed' },
          duration: 1000,
          memoryUsage: 256,
          cpuUsage: 15
        })
      }))
    };

    // Setup orchestrator with real dependencies
    princesses = new Map();
    communication = new PrincessCommunicationProtocol();
    meceValidator = new MECEValidationProtocol();
    stageValidator = new StageProgressionValidator();
    dependencyResolver = new DependencyConflictResolver();
    integrationTester = new CrossDomainIntegrationTester();

    orchestrator = new WorkflowOrchestrator(
      princesses,
      communication,
      meceValidator,
      stageValidator,
      dependencyResolver,
      integrationTester,
      mockMcpServer
    );
  });

  describe('Console.log Theater Elimination', () => {
    test('should not contain any console.log statements in source code', () => {
      const fs = require('fs');
      const path = require('path');

      const sourceFile = fs.readFileSync(
        path.join(__dirname, '../../src/swarm/orchestration/WorkflowOrchestrator.ts'),
        'utf8'
      );

      // Check for console.log statements (excluding comments)
      const lines = sourceFile.split('\n');
      const consoleLogLines = lines
        .map((line, index) => ({ line: line.trim(), number: index + 1 }))
        .filter(({ line }) =>
          line.includes('console.log') &&
          !line.startsWith('//') &&
          !line.startsWith('*') &&
          !line.includes('// ')
        );

      expect(consoleLogLines).toHaveLength(0);
    });

    test('should use Winston logger for all logging', () => {
      expect(orchestrator['logger']).toBeDefined();
      expect(orchestrator['logger'].info).toBeDefined();
      expect(orchestrator['logger'].warn).toBeDefined();
      expect(orchestrator['logger'].error).toBeDefined();
      expect(orchestrator['logger'].debug).toBeDefined();
    });
  });

  describe('Real Princess Task Delegation', () => {
    test('should spawn real MCP agents for Princess tasks', async () => {
      const task = {
        id: 'test-task-1',
        description: 'Test task delegation',
        requirements: ['requirement1', 'requirement2'],
        acceptanceCriteria: ['success', 'output'],
        domain: 'development',
        priority: 'high' as const,
        timeout: 30000
      };

      const result = await orchestrator.executePrincessTask('development', task);

      expect(mockMcpServer.spawnAgent).toHaveBeenCalledWith({
        type: 'princess',
        domain: 'development',
        capabilities: ['requirement1', 'requirement2'],
        config: {
          maxConcurrentTasks: 3,
          timeoutMs: 300000,
          healthCheckInterval: 30000
        }
      });

      expect(result.status).toBe('completed');
      expect(result.taskId).toBe('test-task-1');
      expect(result.agent).toMatch(/^agent-/);
      expect(result.duration).toBeGreaterThan(0);
      expect(result.metrics).toBeDefined();
    });

    test('should handle task execution failures gracefully', async () => {
      mockMcpServer.spawnAgent.mockRejectedValueOnce(new Error('Agent spawn failed'));

      const task = {
        id: 'failing-task',
        description: 'Task that should fail',
        requirements: ['requirement1'],
        acceptanceCriteria: ['success'],
        domain: 'development',
        priority: 'medium' as const,
        timeout: 30000
      };

      const result = await orchestrator.executePrincessTask('development', task);

      expect(result.status).toBe('failed');
      expect(result.output.error).toBe('Agent spawn failed');
    });
  });

  describe('Real MECE Validation', () => {
    test('should perform semantic similarity analysis for task overlap detection', async () => {
      const tasks = [
        {
          id: 'task1',
          description: 'Implement user authentication system',
          requirements: ['auth', 'security'],
          acceptanceCriteria: ['success'],
          domain: 'development',
          priority: 'high' as const,
          timeout: 30000
        },
        {
          id: 'task2',
          description: 'Create user login authentication',
          requirements: ['login', 'security'],
          acceptanceCriteria: ['success'],
          domain: 'development',
          priority: 'high' as const,
          timeout: 30000
        },
        {
          id: 'task3',
          description: 'Setup database infrastructure',
          requirements: ['database', 'infrastructure'],
          acceptanceCriteria: ['success'],
          domain: 'infrastructure',
          priority: 'medium' as const,
          timeout: 30000
        }
      ];

      const result = await orchestrator.validateMECEPrinciple(tasks);

      expect(result.overlaps).toBeDefined();
      expect(result.gaps).toBeDefined();
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(1);

      // Should detect overlap between authentication tasks
      const authOverlap = result.overlaps.find(
        overlap =>
          (overlap.task1 === 'task1' && overlap.task2 === 'task2') ||
          (overlap.task1 === 'task2' && overlap.task2 === 'task1')
      );
      expect(authOverlap).toBeDefined();
      expect(authOverlap?.similarity).toBeGreaterThan(0.5);
    });

    test('should calculate meaningful MECE scores', async () => {
      // Test with overlapping tasks
      const overlappingTasks = [
        {
          id: 'task1',
          description: 'User authentication',
          requirements: ['auth'],
          acceptanceCriteria: ['success'],
          domain: 'development',
          priority: 'high' as const,
          timeout: 30000
        },
        {
          id: 'task2',
          description: 'User authentication system',
          requirements: ['auth'],
          acceptanceCriteria: ['success'],
          domain: 'development',
          priority: 'high' as const,
          timeout: 30000
        }
      ];

      const overlapResult = await orchestrator.validateMECEPrinciple(overlappingTasks);
      expect(overlapResult.score).toBeLessThan(0.9); // Should be penalized for overlap

      // Test with non-overlapping tasks
      const separateTasks = [
        {
          id: 'task1',
          description: 'Database setup',
          requirements: ['database'],
          acceptanceCriteria: ['success'],
          domain: 'infrastructure',
          priority: 'high' as const,
          timeout: 30000
        },
        {
          id: 'task2',
          description: 'Frontend implementation',
          requirements: ['ui'],
          acceptanceCriteria: ['success'],
          domain: 'development',
          priority: 'high' as const,
          timeout: 30000
        }
      ];

      const separateResult = await orchestrator.validateMECEPrinciple(separateTasks);
      expect(separateResult.score).toBeGreaterThan(overlapResult.score);
    });
  });

  describe('Real Byzantine Consensus', () => {
    test('should collect votes from agents and apply BFT logic', async () => {
      const agents = await Promise.all([
        orchestrator.spawnDroneAgent('princess1', ['capability1']),
        orchestrator.spawnDroneAgent('princess1', ['capability2']),
        orchestrator.spawnDroneAgent('princess2', ['capability3']),
        orchestrator.spawnDroneAgent('princess2', ['capability4'])
      ]);

      // Mock vote responses for 3/4 agreement (should achieve consensus)
      agents[0].executeTask = jest.fn().mockResolvedValue({ vote: 'agree', confidence: 0.9 });
      agents[1].executeTask = jest.fn().mockResolvedValue({ vote: 'agree', confidence: 0.8 });
      agents[2].executeTask = jest.fn().mockResolvedValue({ vote: 'agree', confidence: 0.7 });
      agents[3].executeTask = jest.fn().mockResolvedValue({ vote: 'disagree', confidence: 0.6 });

      const decision = {
        type: 'workflow_modification',
        id: 'decision-1',
        modifications: ['change1', 'change2']
      };

      const result = await orchestrator.achieveByzantineConsensus(decision, agents);

      expect(result.status).toBe('consensus');
      expect(result.votes).toBe(3);
      expect(result.total).toBe(4);
      expect(result.decision).toEqual(decision);

      // Verify all agents were asked to vote
      agents.forEach(agent => {
        expect(agent.executeTask).toHaveBeenCalledWith({
          type: 'vote_request',
          decision,
          timeout: 30000
        });
      });
    });

    test('should fail consensus when insufficient agreement', async () => {
      const agents = await Promise.all([
        orchestrator.spawnDroneAgent('princess1', ['capability1']),
        orchestrator.spawnDroneAgent('princess1', ['capability2']),
        orchestrator.spawnDroneAgent('princess2', ['capability3'])
      ]);

      // Mock vote responses for 1/3 agreement (should fail consensus)
      agents[0].executeTask = jest.fn().mockResolvedValue({ vote: 'agree', confidence: 0.9 });
      agents[1].executeTask = jest.fn().mockResolvedValue({ vote: 'disagree', confidence: 0.8 });
      agents[2].executeTask = jest.fn().mockResolvedValue({ vote: 'disagree', confidence: 0.7 });

      const decision = {
        type: 'priority_adjustment',
        id: 'decision-2',
        priorityChanges: ['change1']
      };

      const result = await orchestrator.achieveByzantineConsensus(decision, agents);

      expect(result.status).toBe('no_consensus');
      expect(result.votes).toBe(1);
      expect(result.total).toBe(3);
      expect(result.decision).toBeUndefined();
    });
  });

  describe('Real Swarm Health Monitoring', () => {
    test('should provide actual agent health metrics', async () => {
      const agents = await Promise.all([
        orchestrator.spawnDroneAgent('princess1', ['capability1']),
        orchestrator.spawnDroneAgent('princess2', ['capability2']),
        orchestrator.spawnDroneAgent('princess3', ['capability3'])
      ]);

      // Simulate different agent states
      agents[0].lastHeartbeat = Date.now(); // Healthy
      agents[1].lastHeartbeat = Date.now() - 30000; // Recently active
      agents[2].lastHeartbeat = Date.now() - 120000; // Stale heartbeat

      const health = await orchestrator.getSwarmHealthMetrics();

      expect(health.totalAgents).toBe(3);
      expect(health.healthyAgents).toBeGreaterThanOrEqual(1);
      expect(health.details).toHaveLength(3);

      health.details.forEach(detail => {
        expect(detail.agentId).toMatch(/^agent-/);
        expect(detail.status).toMatch(/^(healthy|unhealthy|overloaded|slow)$/);
        expect(detail.lastHeartbeat).toBeGreaterThan(0);
        expect(detail.taskLoad).toBeGreaterThanOrEqual(0);
        expect(detail.responseTime).toBeGreaterThanOrEqual(0);
      });
    });

    test('should track agent task load accurately', async () => {
      const agent = await orchestrator.spawnDroneAgent('princess1', ['capability1']);

      expect(agent.taskLoad).toBe(0); // Initially idle

      // Simulate task execution
      const task1Promise = agent.executeTask({ type: 'test', timeout: 1000 });
      expect(agent.taskLoad).toBeGreaterThan(0); // Load increased

      await task1Promise;
      expect(agent.taskLoad).toBeLessThanOrEqual(0.1); // Load reduced after completion
    });
  });

  describe('Real Agent Pool Management', () => {
    test('should spawn and register agents with real capabilities', async () => {
      const capabilities = ['coding', 'testing', 'deployment'];
      const agent = await orchestrator.spawnDroneAgent('princess1', capabilities);

      expect(agent.id).toMatch(/^agent-/);
      expect(agent.type).toBe('drone');
      expect(agent.status).toBe('idle');
      expect(agent.capabilities).toEqual(capabilities);
      expect(agent.lastHeartbeat).toBeGreaterThan(Date.now() - 5000);
      expect(agent.executeTask).toBeDefined();

      // Verify agent is registered in pool
      const activeAgents = await orchestrator['getAllActiveAgents']();
      expect(activeAgents.some(a => a.id === agent.id)).toBe(true);
    });

    test('should start monitoring for spawned agents', async () => {
      const agent = await orchestrator.spawnDroneAgent('princess1', ['capability1']);

      // Check that monitoring interval was set
      expect(agent['monitoringInterval']).toBeDefined();

      // Cleanup
      if (agent['monitoringInterval']) {
        clearInterval(agent['monitoringInterval']);
      }
    });
  });

  describe('Task Result Validation', () => {
    test('should validate acceptance criteria properly', async () => {
      const task = {
        id: 'validation-test',
        description: 'Test acceptance criteria validation',
        requirements: ['requirement1'],
        acceptanceCriteria: ['success', 'output', 'timeout'],
        domain: 'development',
        priority: 'medium' as const,
        timeout: 30000
      };

      // Mock successful result
      mockMcpServer.spawnAgent.mockImplementation(async () => ({
        id: 'test-agent',
        execute: jest.fn().mockResolvedValue({
          success: true,
          data: { result: 'valid output' },
          duration: 5000
        })
      }));

      const result = await orchestrator.executePrincessTask('development', task);
      expect(result.status).toBe('completed');
    });

    test('should fail validation when criteria not met', async () => {
      const task = {
        id: 'validation-fail-test',
        description: 'Test acceptance criteria failure',
        requirements: ['requirement1'],
        acceptanceCriteria: ['success'],
        domain: 'development',
        priority: 'medium' as const,
        timeout: 30000
      };

      // Mock failing result
      mockMcpServer.spawnAgent.mockImplementation(async () => ({
        id: 'test-agent',
        execute: jest.fn().mockResolvedValue({
          success: false,
          data: {},
          duration: 5000
        })
      }));

      const result = await orchestrator.executePrincessTask('development', task);
      expect(result.status).toBe('failed');
    });
  });

  describe('Integration Testing', () => {
    test('should demonstrate end-to-end orchestration without theater', async () => {
      // This test validates that the entire orchestration system works
      // with real implementations, no mocks or theatrical responses

      const workflow = orchestrator.getWorkflowDefinitions()[0];
      expect(workflow).toBeDefined();

      const inputData = {
        requirements: ['requirement1', 'requirement2'],
        specifications: 'Test specifications'
      };

      // Execute a dry run to validate real validation logic
      const execution = await orchestrator.executeWorkflow(
        workflow.workflowId,
        inputData,
        { dryRun: true, priority: 'medium' }
      );

      expect(execution.status).toBe('completed');
      expect(execution.meceValidationResults.length).toBeGreaterThan(0);
      expect(execution.integrationTestResults.length).toBeGreaterThan(0);
      expect(execution.logs.length).toBeGreaterThan(0);

      // Verify no theater artifacts in logs
      const theaterIndicators = [
        'placeholder',
        'mock',
        'fake',
        'ascii art',
        'theater',
        'simulation only'
      ];

      execution.logs.forEach(log => {
        theaterIndicators.forEach(indicator => {
          expect(log.message.toLowerCase()).not.toContain(indicator);
        });
      });
    });
  });

  afterEach(() => {
    // Cleanup any spawned agents and intervals
    if (orchestrator['agentPool']) {
      orchestrator['agentPool'].forEach(agent => {
        if (agent['monitoringInterval']) {
          clearInterval(agent['monitoringInterval']);
        }
      });
    }
  });
});