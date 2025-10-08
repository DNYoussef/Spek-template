/**
 * Comprehensive Test Suite for DevelopmentPrincess
 * Full coverage of 309-line development domain specialist
 */

import { DevelopmentPrincess } from '../../../../../src/swarm/hierarchy/domains/DevelopmentPrincess';
import { LangroidMemory } from '../../../../../src/swarm/memory/development/LangroidMemory';
import { KingLogicAdapter } from '../../../../../src/swarm/queen/KingLogicAdapter';
import { MECEDistributor } from '../../../../../src/swarm/queen/MECEDistributor';
import { Task, TaskPriority } from '../../../../../src/swarm/types/task.types';
import { PrincessDomain } from '../../../../../src/swarm/hierarchy/types';

// Mock external dependencies
jest.mock('../../../../../src/swarm/memory/development/LangroidMemory');
jest.mock('../../../../../src/swarm/queen/KingLogicAdapter');
jest.mock('../../../../../src/swarm/queen/MECEDistributor');

describe('DevelopmentPrincess Comprehensive Tests', () => {
  let developmentPrincess: DevelopmentPrincess;
  let mockLangroidMemory: jest.Mocked<LangroidMemory>;
  let mockKingLogic: jest.Mocked<KingLogicAdapter>;
  let mockMeceDistributor: jest.Mocked<MECEDistributor>;
  let sampleTask: Task;

  beforeEach(() => {
    // Setup mocks
    mockLangroidMemory = {
      searchSimilar: jest.fn(),
      storePattern: jest.fn(),
      executeTask: jest.fn(),
      getStats: jest.fn()
    } as any;

    mockKingLogic = {
      configureMetaLogic: jest.fn(),
      analyzeTaskComplexity: jest.fn(),
      shouldShardTask: jest.fn(),
      shardTask: jest.fn(),
      coordinateMultipleAgents: jest.fn(),
      getMetaLogicStatus: jest.fn()
    } as any;

    mockMeceDistributor = {
      configureStrategy: jest.fn(),
      distributeTasks: jest.fn(),
      validateDistribution: jest.fn(),
      getDistributionStats: jest.fn()
    } as any;

    // Mock constructors
    (LangroidMemory as jest.MockedClass<typeof LangroidMemory>).mockImplementation(() => mockLangroidMemory);
    (KingLogicAdapter as jest.MockedClass<typeof KingLogicAdapter>).mockImplementation(() => mockKingLogic);
    (MECEDistributor as jest.MockedClass<typeof MECEDistributor>).mockImplementation(() => mockMeceDistributor);

    // Mock global MCP functions
    (globalThis as any).mcp__claude_flow__agent_spawn = jest.fn().mockResolvedValue({
      agentId: 'mock-agent-' + Math.random().toString(36).substr(2, 9)
    });

    developmentPrincess = new DevelopmentPrincess();

    sampleTask = {
      id: 'dev-task-001',
      name: 'Implement User Service',
      description: 'Create user management service with authentication',
      domain: PrincessDomain.DEVELOPMENT,
      priority: TaskPriority.HIGH,
      files: ['src/services/user.service.ts', 'src/auth/auth.module.ts'],
      dependencies: ['database', 'auth'],
      estimatedLOC: 400
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete (globalThis as any).mcp__claude_flow__agent_spawn;
  });

  describe('Initialization', () => {
    it('should initialize with King Logic and Langroid Memory integration', () => {
      expect(LangroidMemory).toHaveBeenCalledWith('development-princess');
      expect(KingLogicAdapter).toHaveBeenCalled();
      expect(MECEDistributor).toHaveBeenCalled();
    });

    it('should configure King Logic meta-logic for development domain', () => {
      expect(mockKingLogic.configureMetaLogic).toHaveBeenCalledWith({
        taskSharding: true,
        meceDistribution: true,
        intelligentRouting: true,
        adaptiveCoordination: true,
        multiAgentOrchestration: true
      });
    });

    it('should configure MECE distributor strategy', () => {
      expect(mockMeceDistributor.configureStrategy).toHaveBeenCalledWith({
        allowRedundancy: false,
        enforceCompleteness: true,
        optimizeBalance: true,
        prioritizeDomainExpertise: true
      });
    });

    it('should handle duplicate initialization gracefully', async () => {
      // Call executeTask twice to test initialization protection
      mockKingLogic.analyzeTaskComplexity.mockReturnValue(50);
      mockKingLogic.shouldShardTask.mockReturnValue(false);
      mockLangroidMemory.searchSimilar.mockResolvedValue([]);
      mockMeceDistributor.distributeTasks.mockReturnValue(new Map([[PrincessDomain.DEVELOPMENT, [sampleTask]]]));
      mockMeceDistributor.validateDistribution.mockReturnValue({ valid: true, overlaps: [], gaps: [] });
      mockLangroidMemory.executeTask.mockResolvedValue({ status: 'completed', result: 'success' });

      await developmentPrincess.executeTask(sampleTask);
      await developmentPrincess.executeTask(sampleTask);

      // Should only initialize once
      expect(mockKingLogic.configureMetaLogic).toHaveBeenCalledTimes(1);
    });
  });

  describe('Task Execution Workflow', () => {
    beforeEach(() => {
      // Setup default mock behaviors
      mockKingLogic.analyzeTaskComplexity.mockReturnValue(50);
      mockKingLogic.shouldShardTask.mockReturnValue(false);
      mockLangroidMemory.searchSimilar.mockResolvedValue([]);
      mockMeceDistributor.distributeTasks.mockReturnValue(new Map([[PrincessDomain.DEVELOPMENT, [sampleTask]]]));
      mockMeceDistributor.validateDistribution.mockReturnValue({ valid: true, overlaps: [], gaps: [] });
      mockLangroidMemory.executeTask.mockResolvedValue({ status: 'completed', result: 'success' });
    });

    it('should analyze task complexity using King Logic', async () => {
      await developmentPrincess.executeTask(sampleTask);

      expect(mockKingLogic.analyzeTaskComplexity).toHaveBeenCalledWith(sampleTask);
    });

    it('should determine if task sharding is needed', async () => {
      await developmentPrincess.executeTask(sampleTask);

      expect(mockKingLogic.shouldShardTask).toHaveBeenCalledWith(sampleTask);
    });

    it('should handle task sharding when needed', async () => {
      const shardedSubtasks = [
        { subtask: { ...sampleTask, id: 'shard-1', files: ['src/services/user.service.ts'] } },
        { subtask: { ...sampleTask, id: 'shard-2', files: ['src/auth/auth.module.ts'] } }
      ];

      mockKingLogic.shouldShardTask.mockReturnValue(true);
      mockKingLogic.shardTask.mockReturnValue(shardedSubtasks as any);
      mockMeceDistributor.distributeTasks.mockReturnValue(new Map([[PrincessDomain.DEVELOPMENT, shardedSubtasks.map(s => s.subtask)]]));

      const result = await developmentPrincess.executeTask(sampleTask);

      expect(mockKingLogic.shardTask).toHaveBeenCalledWith(sampleTask);
      expect(result.sharded).toBe(true);
    });

    it('should search for similar patterns in Langroid memory', async () => {
      await developmentPrincess.executeTask(sampleTask);

      expect(mockLangroidMemory.searchSimilar).toHaveBeenCalledWith(
        `${sampleTask.description} ${sampleTask.files?.join(' ')}`,
        3,
        0.7
      );
    });

    it('should apply MECE distribution to tasks', async () => {
      await developmentPrincess.executeTask(sampleTask);

      expect(mockMeceDistributor.distributeTasks).toHaveBeenCalled();
    });

    it('should validate MECE compliance', async () => {
      await developmentPrincess.executeTask(sampleTask);

      expect(mockMeceDistributor.validateDistribution).toHaveBeenCalled();
    });

    it('should return comprehensive execution result', async () => {
      const result = await developmentPrincess.executeTask(sampleTask);

      expect(result).toEqual({
        result: 'development-complete',
        taskId: sampleTask.id,
        complexity: 50,
        sharded: false,
        implementations: expect.any(Array),
        patternsUsed: 0,
        meceCompliant: true,
        kingLogicApplied: true,
        langroidMemoryUsed: true
      });
    });
  });

  describe('Pattern-Guided Implementation', () => {
    it('should execute with pattern guidance when patterns found', async () => {
      const mockPatterns = [
        {
          entry: {
            content: 'Previous successful user service implementation with best practices'
          }
        }
      ];

      mockLangroidMemory.searchSimilar.mockResolvedValue(mockPatterns);
      mockKingLogic.analyzeTaskComplexity.mockReturnValue(50);
      mockKingLogic.shouldShardTask.mockReturnValue(false);
      mockMeceDistributor.distributeTasks.mockReturnValue(new Map([[PrincessDomain.DEVELOPMENT, [sampleTask]]]));
      mockMeceDistributor.validateDistribution.mockReturnValue({ valid: true, overlaps: [], gaps: [] });
      mockLangroidMemory.executeTask.mockResolvedValue({ status: 'completed', result: 'success' });

      const result = await developmentPrincess.executeTask(sampleTask);

      expect(result.patternsUsed).toBe(1);
      expect(mockLangroidMemory.executeTask).toHaveBeenCalledWith(
        `implement-${sampleTask.id}`,
        expect.stringContaining('Pattern-guided:')
      );
    });

    it('should store successful patterns in memory', async () => {
      mockKingLogic.analyzeTaskComplexity.mockReturnValue(50);
      mockKingLogic.shouldShardTask.mockReturnValue(false);
      mockLangroidMemory.searchSimilar.mockResolvedValue([]);
      mockMeceDistributor.distributeTasks.mockReturnValue(new Map([[PrincessDomain.DEVELOPMENT, [sampleTask]]]));
      mockMeceDistributor.validateDistribution.mockReturnValue({ valid: true, overlaps: [], gaps: [] });
      mockLangroidMemory.executeTask.mockResolvedValue({ status: 'completed', result: 'success' });

      await developmentPrincess.executeTask(sampleTask);

      expect(mockLangroidMemory.storePattern).toHaveBeenCalledWith(
        expect.stringContaining('Task:'),
        expect.objectContaining({
          fileType: 'implementation',
          language: 'typescript',
          framework: 'spek',
          tags: expect.arrayContaining(['successful', 'development']),
          useCount: 0,
          successRate: 1.0
        })
      );
    });
  });

  describe('Agent Spawning and Coordination', () => {
    it('should spawn development-specific agents', async () => {
      mockKingLogic.analyzeTaskComplexity.mockReturnValue(50);
      mockKingLogic.shouldShardTask.mockReturnValue(false);
      mockLangroidMemory.searchSimilar.mockResolvedValue([]);
      mockMeceDistributor.distributeTasks.mockReturnValue(new Map([[PrincessDomain.DEVELOPMENT, [sampleTask]]]));
      mockMeceDistributor.validateDistribution.mockReturnValue({ valid: true, overlaps: [], gaps: [] });
      mockLangroidMemory.executeTask.mockResolvedValue({ status: 'completed', result: 'success' });
      mockKingLogic.coordinateMultipleAgents.mockResolvedValue(new Map());

      await developmentPrincess.executeTask(sampleTask);

      // Should spawn development agents
      expect((globalThis as any).mcp__claude_flow__agent_spawn).toHaveBeenCalledWith({
        type: 'sparc-coder',
        capabilities: ['clean-code', 'modular-design', 'TDD']
      });

      expect((globalThis as any).mcp__claude_flow__agent_spawn).toHaveBeenCalledWith({
        type: 'backend-dev',
        capabilities: ['API-development', 'database-design', 'microservices']
      });
    });

    it('should handle agent spawning failures gracefully', async () => {
      (globalThis as any).mcp__claude_flow__agent_spawn = jest.fn().mockRejectedValue(new Error('Agent spawn failed'));

      mockKingLogic.analyzeTaskComplexity.mockReturnValue(50);
      mockKingLogic.shouldShardTask.mockReturnValue(false);
      mockLangroidMemory.searchSimilar.mockResolvedValue([]);
      mockMeceDistributor.distributeTasks.mockReturnValue(new Map([[PrincessDomain.DEVELOPMENT, [sampleTask]]]));
      mockMeceDistributor.validateDistribution.mockReturnValue({ valid: true, overlaps: [], gaps: [] });
      mockLangroidMemory.executeTask.mockResolvedValue({ status: 'completed', result: 'success' });

      // Should not throw error despite agent spawn failure
      const result = await developmentPrincess.executeTask(sampleTask);
      expect(result.result).toBe('development-complete');
    });

    it('should coordinate implementation with multiple agents', async () => {
      mockKingLogic.analyzeTaskComplexity.mockReturnValue(50);
      mockKingLogic.shouldShardTask.mockReturnValue(false);
      mockLangroidMemory.searchSimilar.mockResolvedValue([]);
      mockMeceDistributor.distributeTasks.mockReturnValue(new Map([[PrincessDomain.DEVELOPMENT, [sampleTask]]]));
      mockMeceDistributor.validateDistribution.mockReturnValue({ valid: true, overlaps: [], gaps: [] });
      mockLangroidMemory.executeTask.mockResolvedValue({ status: 'completed', result: 'success' });

      const mockDistribution = new Map([
        [PrincessDomain.DEVELOPMENT, [sampleTask]]
      ]);
      mockKingLogic.coordinateMultipleAgents.mockResolvedValue(mockDistribution);

      await developmentPrincess.executeTask(sampleTask);

      expect(mockKingLogic.coordinateMultipleAgents).toHaveBeenCalledWith(
        [sampleTask],
        expect.any(Number)
      );
    });
  });

  describe('Domain-Specific Critical Keys', () => {
    it('should return development-specific critical keys', () => {
      const criticalKeys = (developmentPrincess as any).getDomainSpecificCriticalKeys();

      expect(criticalKeys).toEqual([
        'codeFiles',
        'dependencies',
        'tests',
        'buildStatus',
        'compilationResult',
        'testCoverage',
        'runtimeMetrics',
        'implementationNotes',
        // King Logic additions
        'taskComplexity',
        'shardingApplied',
        'meceCompliance',
        // Langroid additions
        'patternsUsed',
        'memoryStats',
        'langroidIntegration'
      ]);
    });
  });

  describe('Statistics and Status Methods', () => {
    it('should return memory statistics', () => {
      const mockStats = { patterns: 100, totalMemory: '50MB' };
      mockLangroidMemory.getStats.mockReturnValue(mockStats);

      const stats = developmentPrincess.getMemoryStats();

      expect(stats).toBe(mockStats);
      expect(mockLangroidMemory.getStats).toHaveBeenCalled();
    });

    it('should return King Logic status', () => {
      const mockStatus = { taskSharding: true, meceDistribution: true };
      mockKingLogic.getMetaLogicStatus.mockReturnValue(mockStatus as any);

      const status = developmentPrincess.getKingLogicStatus();

      expect(status).toBe(mockStatus);
      expect(mockKingLogic.getMetaLogicStatus).toHaveBeenCalled();
    });

    it('should return MECE distribution statistics', () => {
      const mockStats = { distributionEfficiency: 0.95, taskBalance: 0.87 };
      mockMeceDistributor.getDistributionStats.mockReturnValue(mockStats);

      const stats = developmentPrincess.getMECEStats();

      expect(stats).toBe(mockStats);
      expect(mockMeceDistributor.getDistributionStats).toHaveBeenCalled();
    });

    it('should search patterns in memory', async () => {
      const mockPatterns = [{ id: 'pattern1' }, { id: 'pattern2' }];
      mockLangroidMemory.searchSimilar.mockResolvedValue(mockPatterns);

      const patterns = await developmentPrincess.searchPatterns('user authentication');

      expect(patterns).toBe(mockPatterns);
      expect(mockLangroidMemory.searchSimilar).toHaveBeenCalledWith('user authentication', 5, 0.6);
    });
  });

  describe('Error Handling', () => {
    it('should handle King Logic failures gracefully', async () => {
      mockKingLogic.analyzeTaskComplexity.mockImplementation(() => {
        throw new Error('King Logic failure');
      });

      await expect(developmentPrincess.executeTask(sampleTask)).rejects.toThrow('King Logic failure');
    });

    it('should handle Langroid Memory failures', async () => {
      mockKingLogic.analyzeTaskComplexity.mockReturnValue(50);
      mockKingLogic.shouldShardTask.mockReturnValue(false);
      mockLangroidMemory.searchSimilar.mockRejectedValue(new Error('Memory search failed'));

      await expect(developmentPrincess.executeTask(sampleTask)).rejects.toThrow('Memory search failed');
    });

    it('should handle MECE validation failures', async () => {
      mockKingLogic.analyzeTaskComplexity.mockReturnValue(50);
      mockKingLogic.shouldShardTask.mockReturnValue(false);
      mockLangroidMemory.searchSimilar.mockResolvedValue([]);
      mockMeceDistributor.distributeTasks.mockReturnValue(new Map([[PrincessDomain.DEVELOPMENT, [sampleTask]]]));
      mockMeceDistributor.validateDistribution.mockReturnValue({
        valid: false,
        overlaps: ['file overlap detected'],
        gaps: ['missing coverage']
      });
      mockLangroidMemory.executeTask.mockResolvedValue({ status: 'completed', result: 'success' });

      const result = await developmentPrincess.executeTask(sampleTask);

      // Should complete despite MECE validation failure but flag it
      expect(result.meceCompliant).toBe(false);
    });
  });

  describe('Performance and Efficiency', () => {
    it('should handle large file lists efficiently', async () => {
      const largeTask = {
        ...sampleTask,
        files: Array.from({ length: 100 }, (_, i) => `src/file${i}.ts`),
        estimatedLOC: 10000
      };

      mockKingLogic.analyzeTaskComplexity.mockReturnValue(200);
      mockKingLogic.shouldShardTask.mockReturnValue(true);
      mockKingLogic.shardTask.mockReturnValue([
        { subtask: { ...largeTask, id: 'shard-1' } },
        { subtask: { ...largeTask, id: 'shard-2' } }
      ] as any);
      mockLangroidMemory.searchSimilar.mockResolvedValue([]);
      mockMeceDistributor.distributeTasks.mockReturnValue(new Map([[PrincessDomain.DEVELOPMENT, [largeTask]]]));
      mockMeceDistributor.validateDistribution.mockReturnValue({ valid: true, overlaps: [], gaps: [] });
      mockLangroidMemory.executeTask.mockResolvedValue({ status: 'completed', result: 'success' });

      const startTime = Date.now();
      const result = await developmentPrincess.executeTask(largeTask);
      const endTime = Date.now();

      expect(result.result).toBe('development-complete');
      expect(endTime - startTime).toBeLessThan(1000); // Should complete quickly
    });

    it('should cache initialization state correctly', async () => {
      mockKingLogic.analyzeTaskComplexity.mockReturnValue(50);
      mockKingLogic.shouldShardTask.mockReturnValue(false);
      mockLangroidMemory.searchSimilar.mockResolvedValue([]);
      mockMeceDistributor.distributeTasks.mockReturnValue(new Map([[PrincessDomain.DEVELOPMENT, [sampleTask]]]));
      mockMeceDistributor.validateDistribution.mockReturnValue({ valid: true, overlaps: [], gaps: [] });
      mockLangroidMemory.executeTask.mockResolvedValue({ status: 'completed', result: 'success' });

      // Execute multiple tasks
      await developmentPrincess.executeTask(sampleTask);
      await developmentPrincess.executeTask({ ...sampleTask, id: 'task-2' });

      // Initialization should only happen once
      expect(mockKingLogic.configureMetaLogic).toHaveBeenCalledTimes(1);
      expect(mockMeceDistributor.configureStrategy).toHaveBeenCalledTimes(1);
    });
  });
});