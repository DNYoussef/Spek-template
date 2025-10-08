/**
 * DevelopmentPrincess Unit Tests - London School TDD
 * Tests focusing on behavior verification and object interactions.
 * Uses mocks extensively to isolate the unit under test and define contracts.
 * London School TDD Principles Applied:
 * - Mock-driven development for dependencies
 * - Outside-in testing approach
 * - Behavior verification over state verification
 * - Contract testing between objects
 */

import { jest } from '@jest/globals';
import { DevelopmentPrincess } from '../../../../../src/swarm/hierarchy/domains/DevelopmentPrincess';
import { LangroidMemory } from '../../../../../src/swarm/memory/development/LangroidMemory';
import { KingLogicAdapter } from '../../../../../src/swarm/queen/KingLogicAdapter';
import { MECEDistributor } from '../../../../../src/swarm/queen/MECEDistributor';
import { Task, TaskPriority } from '../../../../../src/swarm/types/task.types';
import { PrincessDomain } from '../../../../../src/swarm/hierarchy/types';

// Mock all dependencies - London School approach
jest.mock('../../../../../src/swarm/memory/development/LangroidMemory');
jest.mock('../../../../../src/swarm/queen/KingLogicAdapter');
jest.mock('../../../../../src/swarm/queen/MECEDistributor');

describe('DevelopmentPrincess - London School TDD', () => {
  let developmentPrincess: DevelopmentPrincess;
  let mockLangroidMemory: jest.Mocked<LangroidMemory>;
  let mockKingLogic: jest.Mocked<KingLogicAdapter>;
  let mockMECEDistributor: jest.Mocked<MECEDistributor>;
  let mockTask: Task;

  beforeEach(() => {
    // Create mocks with expected behaviors
    mockLangroidMemory = {
      searchSimilar: jest.fn(),
      executeTask: jest.fn(),
      storePattern: jest.fn(),
      getStats: jest.fn(),
    } as any;

    mockKingLogic = {
      analyzeTaskComplexity: jest.fn(),
      shouldShardTask: jest.fn(),
      shardTask: jest.fn(),
      coordinateMultipleAgents: jest.fn(),
      getMetaLogicStatus: jest.fn(),
      configureMetaLogic: jest.fn(),
    } as any;

    mockMECEDistributor = {
      distributeTasks: jest.fn(),
      validateDistribution: jest.fn(),
      getDistributionStats: jest.fn(),
      configureStrategy: jest.fn(),
    } as any;

    // Mock constructors to return our mocks
    (LangroidMemory as jest.MockedClass<typeof LangroidMemory>).mockImplementation(() => mockLangroidMemory);
    (KingLogicAdapter as jest.MockedClass<typeof KingLogicAdapter>).mockImplementation(() => mockKingLogic);
    (MECEDistributor as jest.MockedClass<typeof MECEDistributor>).mockImplementation(() => mockMECEDistributor);

    // Create test data
    mockTask = {
      id: 'dev-task-123',
      name: 'Implement User Authentication',
      description: 'Create authentication system with JWT tokens',
      domain: PrincessDomain.DEVELOPMENT,
      priority: TaskPriority.HIGH,
      files: ['src/auth/auth.service.ts', 'src/auth/jwt.middleware.ts'],
      dependencies: ['user-service'],
      estimatedLOC: 250,
    };

    developmentPrincess = new DevelopmentPrincess();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization Contract', () => {
    it('should configure KingLogic with correct meta-logic settings', () => {
      // Verify the contract with KingLogicAdapter
      expect(mockKingLogic.configureMetaLogic).toHaveBeenCalledWith({
        taskSharding: true,
        meceDistribution: true,
        intelligentRouting: true,
        adaptiveCoordination: true,
        multiAgentOrchestration: true,
      });
    });

    it('should configure MECEDistributor with development strategy', () => {
      // Verify the contract with MECEDistributor
      expect(mockMECEDistributor.configureStrategy).toHaveBeenCalledWith({
        allowRedundancy: false,
        enforceCompleteness: true,
        optimizeBalance: true,
        prioritizeDomainExpertise: true,
      });
    });

    it('should initialize LangroidMemory with development domain', () => {
      // Verify LangroidMemory is created with correct domain
      expect(LangroidMemory).toHaveBeenCalledWith('development-princess');
    });
  });

  describe('Task Execution Workflow - Outside-In Behavior', () => {
    beforeEach(() => {
      // Setup mock behaviors for successful execution
      mockKingLogic.analyzeTaskComplexity.mockReturnValue(75);
      mockKingLogic.shouldShardTask.mockReturnValue(false);
      mockMECEDistributor.distributeTasks.mockReturnValue(new Map([
        [PrincessDomain.DEVELOPMENT, [mockTask]]
      ]));
      mockLangroidMemory.searchSimilar.mockResolvedValue([
        {
          entry: { content: 'Similar auth implementation pattern...' },
          similarity: 0.85
        }
      ]);
      mockLangroidMemory.executeTask.mockResolvedValue({
        success: true,
        result: 'Task executed successfully'
      });
      mockMECEDistributor.validateDistribution.mockReturnValue({
        valid: true,
        overlaps: [],
        gaps: []
      });

      // Mock global MCP functions
      global.globalThis = {
        mcp__claude_flow__agent_spawn: jest.fn().mockResolvedValue({
          agentId: 'agent-123'
        })
      } as any;
    });

    it('should orchestrate complete task execution workflow', async () => {
      const result = await developmentPrincess.executeTask(mockTask);

      // Verify the complete interaction sequence
      expect(mockKingLogic.analyzeTaskComplexity).toHaveBeenCalledWith(mockTask);
      expect(mockKingLogic.shouldShardTask).toHaveBeenCalledWith(mockTask);
      expect(mockMECEDistributor.distributeTasks).toHaveBeenCalledWith([mockTask]);
      expect(mockLangroidMemory.searchSimilar).toHaveBeenCalledWith(
        expect.stringContaining(mockTask.description),
        3,
        0.7
      );

      // Verify result structure matches contract
      expect(result).toEqual(
        expect.objectContaining({
          result: 'development-complete',
          taskId: mockTask.id,
          complexity: 75,
          sharded: false,
          kingLogicApplied: true,
          langroidMemoryUsed: true,
          meceCompliant: true,
        })
      );
    });

    it('should handle task sharding when complexity threshold exceeded', async () => {
      // Setup for sharding scenario
      mockKingLogic.analyzeTaskComplexity.mockReturnValue(150);
      mockKingLogic.shouldShardTask.mockReturnValue(true);
      mockKingLogic.shardTask.mockReturnValue([
        {
          originalTaskId: mockTask.id,
          shardId: 'shard-1',
          shardIndex: 0,
          totalShards: 2,
          domain: PrincessDomain.DEVELOPMENT,
          subtask: { ...mockTask, id: 'shard-1' },
          dependencies: []
        },
        {
          originalTaskId: mockTask.id,
          shardId: 'shard-2',
          shardIndex: 1,
          totalShards: 2,
          domain: PrincessDomain.QUALITY,
          subtask: { ...mockTask, id: 'shard-2' },
          dependencies: ['shard-1']
        }
      ]);

      const result = await developmentPrincess.executeTask(mockTask);

      // Verify sharding workflow
      expect(mockKingLogic.shardTask).toHaveBeenCalledWith(mockTask);
      expect(result.sharded).toBe(true);
      expect(result.complexity).toBe(150);
    });

    it('should search and apply patterns from Langroid memory', async () => {
      const mockPatterns = [
        { entry: { content: 'JWT implementation pattern' }, similarity: 0.9 },
        { entry: { content: 'Auth middleware pattern' }, similarity: 0.8 }
      ];
      mockLangroidMemory.searchSimilar.mockResolvedValue(mockPatterns);

      await developmentPrincess.executeTask(mockTask);

      // Verify pattern search behavior
      expect(mockLangroidMemory.searchSimilar).toHaveBeenCalledWith(
        `${mockTask.description} ${mockTask.files?.join(' ')}`,
        3,
        0.7
      );

      // Verify Langroid execution with pattern guidance
      expect(mockLangroidMemory.executeTask).toHaveBeenCalledWith(
        `implement-${mockTask.id}`,
        expect.stringContaining('Pattern-guided: JWT implementation pattern')
      );
    });

    it('should validate MECE compliance and handle violations', async () => {
      // Setup MECE validation failure
      mockMECEDistributor.validateDistribution.mockReturnValue({
        valid: false,
        overlaps: ['file1.ts assigned to multiple tasks'],
        gaps: ['file2.ts not assigned to any task']
      });

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const result = await developmentPrincess.executeTask(mockTask);

      // Verify MECE validation is called
      expect(mockMECEDistributor.validateDistribution).toHaveBeenCalled();
      expect(result.meceCompliant).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        '[Development] MECE validation failed:',
        expect.objectContaining({ valid: false })
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Pattern Storage Contract', () => {
    it('should store successful patterns in Langroid memory', async () => {
      // Setup successful implementation
      mockKingLogic.analyzeTaskComplexity.mockReturnValue(50);
      mockKingLogic.shouldShardTask.mockReturnValue(false);
      mockMECEDistributor.distributeTasks.mockReturnValue(new Map([
        [PrincessDomain.DEVELOPMENT, [mockTask]]
      ]));
      mockLangroidMemory.searchSimilar.mockResolvedValue([]);
      mockLangroidMemory.executeTask.mockResolvedValue({ success: true });
      mockMECEDistributor.validateDistribution.mockReturnValue({ valid: true });

      await developmentPrincess.executeTask(mockTask);

      // Verify pattern storage contract
      expect(mockLangroidMemory.storePattern).toHaveBeenCalledWith(
        expect.stringContaining(`Task: ${mockTask.description}`),
        expect.objectContaining({
          fileType: 'implementation',
          language: 'typescript',
          framework: 'spek',
          tags: expect.arrayContaining(['successful', 'development']),
          successRate: 1.0
        })
      );
    });

    it('should not store patterns for failed implementations', async () => {
      // Setup failed build
      mockKingLogic.analyzeTaskComplexity.mockReturnValue(50);
      mockKingLogic.shouldShardTask.mockReturnValue(false);
      mockMECEDistributor.distributeTasks.mockReturnValue(new Map([
        [PrincessDomain.DEVELOPMENT, [mockTask]]
      ]));
      mockLangroidMemory.searchSimilar.mockResolvedValue([]);

      // Mock implementation with failed build
      jest.spyOn(developmentPrincess as any, 'buildAndTest').mockResolvedValue({
        buildSuccess: false,
        testsRun: 10,
        testsPassed: 8
      });

      await developmentPrincess.executeTask(mockTask);

      // Verify no pattern storage for failures
      expect(mockLangroidMemory.storePattern).not.toHaveBeenCalled();
    });
  });

  describe('Agent Spawning Behavior', () => {
    it('should spawn development agents with correct capabilities', async () => {
      // Setup mocks
      mockKingLogic.analyzeTaskComplexity.mockReturnValue(50);
      mockKingLogic.shouldShardTask.mockReturnValue(false);
      mockMECEDistributor.distributeTasks.mockReturnValue(new Map([
        [PrincessDomain.DEVELOPMENT, [mockTask]]
      ]));

      const mockSpawn = jest.fn().mockResolvedValue({ agentId: 'agent-123' });
      global.globalThis = { mcp__claude_flow__agent_spawn: mockSpawn } as any;

      await developmentPrincess.executeTask(mockTask);

      // Verify agent spawning behavior
      expect(mockSpawn).toHaveBeenCalledWith({
        type: 'sparc-coder',
        capabilities: ['clean-code', 'modular-design', 'TDD']
      });

      expect(mockSpawn).toHaveBeenCalledWith({
        type: 'backend-dev',
        capabilities: ['API-development', 'database-design', 'microservices']
      });

      expect(mockSpawn).toHaveBeenCalledWith({
        type: 'frontend-developer',
        capabilities: ['UI-implementation', 'state-management', 'responsive-design']
      });

      expect(mockSpawn).toHaveBeenCalledWith({
        type: 'mobile-dev',
        capabilities: ['cross-platform', 'native-features', 'performance-optimization']
      });
    });
  });

  describe('Error Handling Contracts', () => {
    it('should handle and propagate King Logic analysis errors', async () => {
      const analysisError = new Error('King Logic analysis failed');
      mockKingLogic.analyzeTaskComplexity.mockImplementation(() => {
        throw analysisError;
      });

      await expect(developmentPrincess.executeTask(mockTask)).rejects.toThrow(analysisError);
    });

    it('should handle Langroid memory search failures gracefully', async () => {
      mockKingLogic.analyzeTaskComplexity.mockReturnValue(50);
      mockKingLogic.shouldShardTask.mockReturnValue(false);
      mockMECEDistributor.distributeTasks.mockReturnValue(new Map([
        [PrincessDomain.DEVELOPMENT, [mockTask]]
      ]));

      const memoryError = new Error('Memory search failed');
      mockLangroidMemory.searchSimilar.mockRejectedValue(memoryError);

      await expect(developmentPrincess.executeTask(mockTask)).rejects.toThrow(memoryError);
    });
  });

  describe('Information Query Contracts', () => {
    it('should delegate memory stats to LangroidMemory', () => {
      const mockStats = { totalPatterns: 150, memoryUsage: '8.5MB' };
      mockLangroidMemory.getStats.mockReturnValue(mockStats);

      const result = developmentPrincess.getMemoryStats();

      expect(mockLangroidMemory.getStats).toHaveBeenCalled();
      expect(result).toBe(mockStats);
    });

    it('should delegate King Logic status to KingLogicAdapter', () => {
      const mockStatus = { taskSharding: true, meceDistribution: true };
      mockKingLogic.getMetaLogicStatus.mockReturnValue(mockStatus);

      const result = developmentPrincess.getKingLogicStatus();

      expect(mockKingLogic.getMetaLogicStatus).toHaveBeenCalled();
      expect(result).toBe(mockStatus);
    });

    it('should delegate MECE stats to MECEDistributor', () => {
      const mockStats = { distributionEfficiency: 0.92, taskBalance: 0.85 };
      mockMECEDistributor.getDistributionStats.mockReturnValue(mockStats);

      const result = developmentPrincess.getMECEStats();

      expect(mockMECEDistributor.getDistributionStats).toHaveBeenCalled();
      expect(result).toBe(mockStats);
    });

    it('should delegate pattern search to LangroidMemory', async () => {
      const mockPatterns = [{ entry: { content: 'pattern1' } }];
      mockLangroidMemory.searchSimilar.mockResolvedValue(mockPatterns);

      const result = await developmentPrincess.searchPatterns('auth patterns');

      expect(mockLangroidMemory.searchSimilar).toHaveBeenCalledWith('auth patterns', 5, 0.6);
      expect(result).toBe(mockPatterns);
    });
  });

  describe('Domain-Specific Critical Keys Contract', () => {
    it('should return comprehensive list of domain-specific keys', () => {
      const keys = (developmentPrincess as any).getDomainSpecificCriticalKeys();

      expect(keys).toEqual(
        expect.arrayContaining([
          // Base development keys
          'codeFiles', 'dependencies', 'tests', 'buildStatus',
          'compilationResult', 'testCoverage', 'runtimeMetrics',
          'implementationNotes',
          // King Logic additions
          'taskComplexity', 'shardingApplied', 'meceCompliance',
          // Langroid additions
          'patternsUsed', 'memoryStats', 'langroidIntegration'
        ])
      );
    });
  });
});

/**
 * AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE
 * ## Version & Run Log
 * | Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
 * |--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
 * | 1.0.0   | 2025-09-26T23:39:15-04:00 | tdd-london-swarm@claude-sonnet-4-20250514 | Create comprehensive London School TDD test suite for DevelopmentPrincess | DevelopmentPrincess.test.ts | OK | Complete outside-in testing with mock-driven behavior verification | 0.00 | a7b4c1e |
 * ### Receipt
 * - status: OK
 * - reason_if_blocked: --
 * - run_id: phase5-tdd-dev-princess-001
 * - inputs: ["src/swarm/hierarchy/domains/DevelopmentPrincess.ts", "src/swarm/queen/KingLogicAdapter.ts"]
 * - tools_used: ["Write", "TodoWrite", "Bash", "Read"]
 * - versions: {"model":"claude-sonnet-4-20250514","prompt":"tdd-london-swarm-v1.0"}
 * AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE
 */