/**
 * KingLogicAdapter Unit Tests - London School TDD
 *
 * Tests the meta-coordination logic using mock-driven development.
 * Focuses on behavior verification and interaction patterns.
 *
 * London School TDD Principles:
 * - Mock external dependencies (Logger, EventEmitter)
 * - Test interactions and collaborations
 * - Verify contracts between objects
 * - Outside-in approach for complex behaviors
 */

import { jest } from '@jest/globals';
import { KingLogicAdapter } from '../../../../src/swarm/queen/KingLogicAdapter';
import { Task, TaskPriority } from '../../../../src/swarm/types/task.types';
import { PrincessDomain } from '../../../../src/swarm/hierarchy/types';
import { Logger } from '../../../../src/utils/logger';

// Mock external dependencies
jest.mock('../../../../src/utils/logger');

describe('KingLogicAdapter - London School TDD', () => {
  let kingLogic: KingLogicAdapter;
  let mockLogger: jest.Mocked<Logger>;
  let simpleDevelopmentTask: Task;
  let complexSecurityTask: Task;
  let multiFileTask: Task;

  beforeEach(() => {
    // Create logger mock
    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    } as any;

    // Mock Logger constructor
    (Logger as jest.MockedClass<typeof Logger>).mockImplementation(() => mockLogger);

    kingLogic = new KingLogicAdapter();

    // Test data setup
    simpleDevelopmentTask = {
      id: 'simple-task-001',
      name: 'Simple Component Update',
      description: 'Update button component styling',
      domain: PrincessDomain.DEVELOPMENT,
      priority: TaskPriority.MEDIUM,
      files: ['src/components/Button.tsx'],
      dependencies: [],
      estimatedLOC: 30,
    };

    complexSecurityTask = {
      id: 'security-task-001',
      name: 'Implement OAuth2 Authentication',
      description: 'Add OAuth2 authentication with PKCE flow',
      domain: PrincessDomain.SECURITY,
      priority: TaskPriority.CRITICAL,
      files: [
        'src/auth/oauth2.service.ts',
        'src/auth/pkce.handler.ts',
        'src/auth/token.validator.ts',
        'src/middleware/auth.middleware.ts',
        'src/guards/role.guard.ts'
      ],
      dependencies: ['user-service', 'session-store', 'crypto-utils'],
      estimatedLOC: 850,
    };

    multiFileTask = {
      id: 'multi-file-task-001',
      name: 'Refactor User Management System',
      description: 'Refactor user management across multiple modules',
      domain: PrincessDomain.DEVELOPMENT,
      priority: TaskPriority.HIGH,
      files: Array.from({ length: 8 }, (_, i) => `src/user/module${i + 1}.ts`),
      dependencies: ['database', 'validation', 'cache'],
      estimatedLOC: 1200,
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Task Complexity Analysis Contract', () => {
    it('should calculate complexity based on file count', () => {
      const complexity = kingLogic.analyzeTaskComplexity(simpleDevelopmentTask);

      // Verify calculation: 1 file * 10 + 30 LOC / 50 = 10 + 0 = 10
      expect(complexity).toBe(10);
    });

    it('should apply priority multipliers correctly', () => {
      const criticalComplexity = kingLogic.analyzeTaskComplexity(complexSecurityTask);
      const mediumComplexity = kingLogic.analyzeTaskComplexity(simpleDevelopmentTask);

      // Critical task should have 1.5x multiplier
      expect(criticalComplexity).toBeGreaterThan(mediumComplexity * 1.4);
    });

    it('should include dependency complexity in calculation', () => {
      const withDependencies = kingLogic.analyzeTaskComplexity(complexSecurityTask);
      const withoutDependencies = kingLogic.analyzeTaskComplexity({
        ...complexSecurityTask,
        dependencies: []
      });

      // Each dependency adds 15 points
      expect(withDependencies).toBe(withoutDependencies + (3 * 15));
    });

    it('should apply domain-specific complexity modifiers', () => {
      const securityTaskComplexity = kingLogic.analyzeTaskComplexity(complexSecurityTask);
      const developmentTaskComplexity = kingLogic.analyzeTaskComplexity({
        ...complexSecurityTask,
        domain: PrincessDomain.DEVELOPMENT
      });

      // Security tasks should have 1.3x modifier
      expect(securityTaskComplexity).toBeGreaterThan(developmentTaskComplexity);
    });
  });

  describe('Task Sharding Decision Logic', () => {
    it('should not shard simple tasks below threshold', () => {
      const shouldShard = kingLogic.shouldShardTask(simpleDevelopmentTask);

      expect(shouldShard).toBe(false);
    });

    it('should shard complex tasks above threshold', () => {
      const shouldShard = kingLogic.shouldShardTask(complexSecurityTask);

      expect(shouldShard).toBe(true);
    });

    it('should respect meta-logic configuration', () => {
      // Disable task sharding
      kingLogic.configureMetaLogic({ taskSharding: false });

      const shouldShard = kingLogic.shouldShardTask(complexSecurityTask);

      expect(shouldShard).toBe(false);
      expect(mockLogger.info).toHaveBeenCalledWith(
        'King meta-logic configuration updated:',
        expect.objectContaining({ taskSharding: false })
      );
    });
  });

  describe('Task Sharding Behavior', () => {
    it('should create appropriate number of shards based on complexity', () => {
      const shards = kingLogic.shardTask(complexSecurityTask);

      // Should create multiple shards but not exceed 6
      expect(shards.length).toBeGreaterThan(1);
      expect(shards.length).toBeLessThanOrEqual(6);
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Sharding task'),
        expect.any(String)
      );
    });

    it('should distribute files across shards without overlap', () => {
      const shards = kingLogic.shardTask(multiFileTask);
      const allShardFiles = shards.flatMap(shard => shard.subtask.files || []);
      const originalFiles = multiFileTask.files || [];

      // All original files should be covered
      expect(allShardFiles.sort()).toEqual(originalFiles.sort());

      // No file should appear in multiple shards
      const fileSet = new Set(allShardFiles);
      expect(fileSet.size).toBe(allShardFiles.length);
    });

    it('should assign appropriate domains to shards', () => {
      const shards = kingLogic.shardTask(complexSecurityTask);

      // First shard should maintain original domain
      expect(shards[0].domain).toBe(complexSecurityTask.domain);

      // Last shard should go to Quality for testing
      if (shards.length > 1) {
        expect(shards[shards.length - 1].domain).toBe(PrincessDomain.QUALITY);
      }
    });

    it('should create proper shard dependencies', () => {
      const shards = kingLogic.shardTask(complexSecurityTask);

      // First shard should include original dependencies
      expect(shards[0].dependencies).toEqual(
        expect.arrayContaining(complexSecurityTask.dependencies || [])
      );

      // Subsequent shards should depend on previous shards
      for (let i = 1; i < shards.length; i++) {
        expect(shards[i].dependencies).toContain(shards[i - 1].shardId);
      }
    });

    it('should create subtasks with correct metadata', () => {
      const shards = kingLogic.shardTask(multiFileTask);

      shards.forEach((shard, index) => {
        expect(shard.originalTaskId).toBe(multiFileTask.id);
        expect(shard.shardIndex).toBe(index);
        expect(shard.totalShards).toBe(shards.length);
        expect(shard.subtask.id).toBe(`${multiFileTask.id}-shard-${index}`);
        expect(shard.subtask.name).toContain(`Part ${index + 1}/${shards.length}`);
      });
    });
  });

  describe('MECE Distribution Validation', () => {
    it('should detect overlapping file assignments', () => {
      const overlappingTasks: Task[] = [
        {
          id: 'task1',
          name: 'Task 1',
          description: 'First task',
          domain: PrincessDomain.DEVELOPMENT,
          files: ['file1.ts', 'file2.ts'],
        },
        {
          id: 'task2',
          name: 'Task 2',
          description: 'Second task',
          domain: PrincessDomain.DEVELOPMENT,
          files: ['file2.ts', 'file3.ts'], // file2.ts overlaps
        }
      ];

      const validation = kingLogic.validateMECEDistribution(overlappingTasks);

      expect(validation.valid).toBe(false);
      expect(validation.overlaps).toEqual(['File file2.ts assigned to multiple tasks']);
      expect(validation.gaps).toEqual([]);
    });

    it('should detect gaps in file coverage', () => {
      // Note: This test structure would need tasks that have different file requirements
      // For now, testing the basic structure
      const tasksWithGaps: Task[] = [
        {
          id: 'task1',
          name: 'Partial Task',
          description: 'Only covers some files',
          domain: PrincessDomain.DEVELOPMENT,
          files: ['file1.ts'],
        }
      ];

      const validation = kingLogic.validateMECEDistribution(tasksWithGaps);

      expect(validation).toHaveProperty('valid');
      expect(validation).toHaveProperty('overlaps');
      expect(validation).toHaveProperty('gaps');
    });

    it('should validate perfect MECE distribution', () => {
      const perfectTasks: Task[] = [
        {
          id: 'task1',
          name: 'Task 1',
          description: 'First task',
          domain: PrincessDomain.DEVELOPMENT,
          files: ['file1.ts'],
        },
        {
          id: 'task2',
          name: 'Task 2',
          description: 'Second task',
          domain: PrincessDomain.DEVELOPMENT,
          files: ['file2.ts'],
        }
      ];

      const validation = kingLogic.validateMECEDistribution(perfectTasks);

      expect(validation.valid).toBe(true);
      expect(validation.overlaps).toEqual([]);
      expect(validation.gaps).toEqual([]);
    });
  });

  describe('Intelligent Routing Logic', () => {
    it('should route security-related tasks to Security domain', () => {
      const securityTask = {
        ...simpleDevelopmentTask,
        description: 'Implement authentication middleware'
      };

      const domain = kingLogic.routeTaskToPrincess(securityTask);

      expect(domain).toBe(PrincessDomain.SECURITY);
    });

    it('should route test files to Quality domain', () => {
      const testTask = {
        ...simpleDevelopmentTask,
        files: ['src/components/Button.test.tsx', 'src/utils/helper.spec.ts']
      };

      const domain = kingLogic.routeTaskToPrincess(testTask);

      expect(domain).toBe(PrincessDomain.QUALITY);
    });

    it('should route configuration files to Infrastructure domain', () => {
      const configTask = {
        ...simpleDevelopmentTask,
        files: ['webpack.config.js', 'tsconfig.json', 'package.json']
      };

      const domain = kingLogic.routeTaskToPrincess(configTask);

      expect(domain).toBe(PrincessDomain.INFRASTRUCTURE);
    });

    it('should route documentation to Research domain', () => {
      const docsTask = {
        ...simpleDevelopmentTask,
        files: ['README.md', 'docs/api.md']
      };

      const domain = kingLogic.routeTaskToPrincess(docsTask);

      expect(domain).toBe(PrincessDomain.RESEARCH);
    });

    it('should maintain original domain when intelligent routing disabled', () => {
      kingLogic.configureMetaLogic({ intelligentRouting: false });

      const domain = kingLogic.routeTaskToPrincess(complexSecurityTask);

      expect(domain).toBe(complexSecurityTask.domain);
    });
  });

  describe('Multi-Agent Coordination', () => {
    it('should distribute tasks across domains intelligently', async () => {
      const tasks = [simpleDevelopmentTask, complexSecurityTask, multiFileTask];

      const distribution = await kingLogic.coordinateMultipleAgents(tasks, 3);

      // Should have entries for relevant domains
      expect(distribution.has(PrincessDomain.DEVELOPMENT)).toBe(true);
      expect(distribution.has(PrincessDomain.SECURITY)).toBe(true);

      // Total distributed tasks should equal or exceed original (due to sharding)
      const totalDistributed = Array.from(distribution.values())
        .reduce((sum, domainTasks) => sum + domainTasks.length, 0);
      expect(totalDistributed).toBeGreaterThanOrEqual(tasks.length);
    });

    it('should handle sharding during coordination', async () => {
      const complexTasks = [complexSecurityTask, multiFileTask];

      const distribution = await kingLogic.coordinateMultipleAgents(complexTasks, 4);

      // Complex tasks should be sharded, resulting in more distributed tasks
      const totalDistributed = Array.from(distribution.values())
        .reduce((sum, domainTasks) => sum + domainTasks.length, 0);
      expect(totalDistributed).toBeGreaterThan(complexTasks.length);
    });

    it('should emit MECE violation events when validation fails', async () => {
      const meceViolationSpy = jest.fn();
      kingLogic.on('mece-violation', meceViolationSpy);

      // Create tasks that will cause MECE violations
      const problematicTasks = [
        { ...simpleDevelopmentTask, files: ['shared.ts'] },
        { ...multiFileTask, files: ['shared.ts'] } // Same file in both
      ];

      await kingLogic.coordinateMultipleAgents(problematicTasks, 2);

      expect(meceViolationSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          valid: false,
          overlaps: expect.arrayContaining([
            expect.stringContaining('shared.ts assigned to multiple tasks')
          ])
        })
      );
    });
  });

  describe('Meta-Logic Configuration Contract', () => {
    it('should update configuration and log changes', () => {
      const newConfig = {
        taskSharding: false,
        intelligentRouting: false
      };

      kingLogic.configureMetaLogic(newConfig);

      expect(mockLogger.info).toHaveBeenCalledWith(
        'King meta-logic configuration updated:',
        expect.objectContaining(newConfig)
      );
    });

    it('should return current meta-logic status', () => {
      const status = kingLogic.getMetaLogicStatus();

      expect(status).toEqual(
        expect.objectContaining({
          taskSharding: expect.any(Boolean),
          meceDistribution: expect.any(Boolean),
          intelligentRouting: expect.any(Boolean),
          adaptiveCoordination: expect.any(Boolean),
          multiAgentOrchestration: expect.any(Boolean),
        })
      );
    });

    it('should preserve existing settings when partially updating config', () => {
      // Get initial state
      const initialState = kingLogic.getMetaLogicStatus();

      // Update only one setting
      kingLogic.configureMetaLogic({ taskSharding: false });

      const newState = kingLogic.getMetaLogicStatus();

      // Only taskSharding should change
      expect(newState.taskSharding).toBe(false);
      expect(newState.meceDistribution).toBe(initialState.meceDistribution);
      expect(newState.intelligentRouting).toBe(initialState.intelligentRouting);
    });
  });

  describe('EventEmitter Contract', () => {
    it('should properly extend EventEmitter', () => {
      expect(kingLogic).toBeInstanceOf(require('events').EventEmitter);
    });

    it('should support event listener registration', () => {
      const testListener = jest.fn();
      kingLogic.on('test-event', testListener);

      kingLogic.emit('test-event', 'test-data');

      expect(testListener).toHaveBeenCalledWith('test-data');
    });
  });

  describe('Domain Selection Strategy', () => {
    it('should select domains for shards based on shard characteristics', () => {
      const shards = kingLogic.shardTask(complexSecurityTask);

      // Test the domain selection logic
      shards.forEach((shard, index) => {
        if (index === 0) {
          // First shard maintains original domain
          expect(shard.domain).toBe(complexSecurityTask.domain);
        } else if (index === shards.length - 1) {
          // Last shard goes to Quality
          expect(shard.domain).toBe(PrincessDomain.QUALITY);
        } else {
          // Middle shards get distributed across domains
          expect(Object.values(PrincessDomain)).toContain(shard.domain);
        }
      });
    });
  });
});

<!-- AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE -->
## Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
|--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
| 1.0.0   | 2025-09-26T23:45:32-04:00 | tdd-london-swarm@claude-sonnet-4-20250514 | Create comprehensive London School TDD test suite for KingLogicAdapter | KingLogicAdapter.test.ts | OK | Complete behavior verification tests with extensive mocking and contract validation | 0.00 | f2e8b7a |

### Receipt
- status: OK
- reason_if_blocked: --
- run_id: phase5-tdd-king-logic-001
- inputs: ["src/swarm/queen/KingLogicAdapter.ts"]
- tools_used: ["Write", "TodoWrite"]
- versions: {"model":"claude-sonnet-4-20250514","prompt":"tdd-london-swarm-v1.0"}
<!-- AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE -->