/**
 * Phase 1 Integration Tests: King Logic Adapter
 * Tests King's meta-logic patterns integration
 */

import { KingLogicAdapter, ShardedTask } from '../../../src/swarm/queen/KingLogicAdapter';
import { MECEDistributor } from '../../../src/swarm/queen/MECEDistributor';
import { Task, TaskPriority } from '../../../src/swarm/types/task.types';
import { PrincessDomain } from '../../../src/swarm/hierarchy/types';
*ndescribe('King Logic Integration Tests', () => {
  let kingLogic: KingLogicAdapter;
  let meceDistributor: MECEDistributor;

  beforeEach(() => {
    kingLogic = new KingLogicAdapter();
    meceDistributor = new MECEDistributor();
  });

  describe('Task Complexity Analysis', () => {
    it('should calculate complexity correctly for simple tasks', () => {
      const task: Task = {
        id: 'simple-task',
        name: 'Simple feature',
        description: 'Add a button',
        domain: PrincessDomain.DEVELOPMENT,
        files: ['src/button.tsx'],
        estimatedLOC: 50,
        priority: TaskPriority.LOW
      };

      const complexity = kingLogic.analyzeTaskComplexity(task);
      expect(complexity).toBeLessThan(100); // Should be below sharding threshold
    });

    it('should calculate high complexity for complex tasks', () => {
      const task: Task = {
        id: 'complex-task',
        name: 'Complex feature',
        description: 'Build entire authentication system',
        domain: PrincessDomain.SECURITY,
        files: [
          'src/auth/login.tsx',
          'src/auth/register.tsx',
          'src/auth/middleware.ts',
          'src/auth/tokens.ts',
          'src/auth/validation.ts'
        ],
        estimatedLOC: 2000,
        dependencies: ['jwt', 'bcrypt', 'redis'],
        priority: TaskPriority.CRITICAL
      };

      const complexity = kingLogic.analyzeTaskComplexity(task);
      expect(complexity).toBeGreaterThan(100); // Should exceed sharding threshold
    });
  });

  describe('Task Sharding', () => {
    it('should determine sharding necessity correctly', () => {
      const simpleTask: Task = {
        id: 'simple',
        name: 'Simple task',
        description: 'Small change',
        domain: PrincessDomain.DEVELOPMENT,
        files: ['src/component.tsx'],
        estimatedLOC: 30
      };

      const complexTask: Task = {
        id: 'complex',
        name: 'Complex task',
        description: 'Major feature',
        domain: PrincessDomain.DEVELOPMENT,
        files: Array.from({ length: 10 }, (_, i) => `src/file${i}.tsx`),
        estimatedLOC: 1500,
        dependencies: ['dep1', 'dep2', 'dep3']
      };

      expect(kingLogic.shouldShardTask(simpleTask)).toBe(false);
      expect(kingLogic.shouldShardTask(complexTask)).toBe(true);
    });

    it('should create appropriate shards for complex tasks', () => {
      const task: Task = {
        id: 'shardable-task',
        name: 'Large feature',
        description: 'Multi-component feature',
        domain: PrincessDomain.DEVELOPMENT,
        files: [
          'src/components/Header.tsx',
          'src/components/Footer.tsx',
          'src/components/Sidebar.tsx',
          'src/services/api.ts',
          'src/services/auth.ts',
          'src/utils/helpers.ts'
        ],
        estimatedLOC: 1200,
        dependencies: ['react', 'axios']
      };

      const shards = kingLogic.shardTask(task);

      expect(shards.length).toBeGreaterThan(1);
      expect(shards.length).toBeLessThanOrEqual(6); // Max 6 shards (one per Princess)

      // Verify shard structure
      shards.forEach((shard, index) => {
        expect(shard.originalTaskId).toBe(task.id);
        expect(shard.shardId).toBe(`${task.id}-shard-${index}`);
        expect(shard.shardIndex).toBe(index);
        expect(shard.totalShards).toBe(shards.length);
        expect(Object.values(PrincessDomain)).toContain(shard.domain);
      });

      // Verify all files are covered
      const allShardFiles = shards.flatMap(shard => shard.subtask.files || []);
      expect(allShardFiles.sort()).toEqual(task.files!.sort());
    });
  });

  describe('Intelligent Routing', () => {
    it('should route tasks to appropriate domains based on content', () => {
      const testTask: Task = {
        id: 'test-task',
        name: 'Testing task',
        description: 'Add unit tests for authentication',
        domain: PrincessDomain.DEVELOPMENT,
        files: ['src/auth.test.ts', 'src/auth.spec.ts']
      };

      const configTask: Task = {
        id: 'config-task',
        name: 'Configuration task',
        description: 'Update deployment configuration',
        domain: PrincessDomain.DEVELOPMENT,
        files: ['config/deploy.json', 'docker-compose.yml']
      };

      const securityTask: Task = {
        id: 'security-task',
        name: 'Security task',
        description: 'Implement authentication middleware',
        domain: PrincessDomain.DEVELOPMENT,
        files: ['src/middleware/auth.ts']
      };

      expect(kingLogic.routeTaskToPrincess(testTask)).toBe(PrincessDomain.QUALITY);
      expect(kingLogic.routeTaskToPrincess(configTask)).toBe(PrincessDomain.INFRASTRUCTURE);
      expect(kingLogic.routeTaskToPrincess(securityTask)).toBe(PrincessDomain.SECURITY);
    });
  });

  describe('Multi-Agent Coordination', () => {
    it('should distribute tasks across Princess domains', async () => {
      const tasks: Task[] = [
        {
          id: 'dev-task',
          name: 'Development',
          description: 'Build component',
          domain: PrincessDomain.DEVELOPMENT,
          files: ['src/component.tsx']
        },
        {
          id: 'test-task',
          name: 'Testing',
          description: 'Test component',
          domain: PrincessDomain.QUALITY,
          files: ['src/component.test.ts']
        },
        {
          id: 'doc-task',
          name: 'Documentation',
          description: 'Document API',
          domain: PrincessDomain.RESEARCH,
          files: ['docs/api.md']
        }
      ];

      const distribution = await kingLogic.coordinateMultipleAgents(tasks, 3);

      expect(distribution.size).toBeGreaterThan(0);
      expect(distribution.has(PrincessDomain.DEVELOPMENT)).toBe(true);
      expect(distribution.has(PrincessDomain.QUALITY)).toBe(true);
      expect(distribution.has(PrincessDomain.RESEARCH)).toBe(true);

      // Verify all tasks are distributed
      let totalDistributedTasks = 0;
      distribution.forEach(domainTasks => {
        totalDistributedTasks += domainTasks.length;
      });
      expect(totalDistributedTasks).toBeGreaterThanOrEqual(tasks.length);
    });
  });

  describe('MECE Validation', () => {
    it('should validate mutually exclusive tasks', () => {
      const tasks: Task[] = [
        {
          id: 'task1',
          name: 'Task 1',
          description: 'Edit file A',
          domain: PrincessDomain.DEVELOPMENT,
          files: ['src/fileA.ts']
        },
        {
          id: 'task2',
          name: 'Task 2',
          description: 'Edit file B',
          domain: PrincessDomain.DEVELOPMENT,
          files: ['src/fileB.ts']
        }
      ];

      const validation = kingLogic.validateMECEDistribution(tasks);
      expect(validation.valid).toBe(true);
      expect(validation.overlaps).toHaveLength(0);
      expect(validation.gaps).toHaveLength(0);
    });

    it('should detect overlapping tasks', () => {
      const tasks: Task[] = [
        {
          id: 'task1',
          name: 'Task 1',
          description: 'Edit shared file',
          domain: PrincessDomain.DEVELOPMENT,
          files: ['src/shared.ts']
        },
        {
          id: 'task2',
          name: 'Task 2',
          description: 'Also edit shared file',
          domain: PrincessDomain.QUALITY,
          files: ['src/shared.ts'] // Overlap!
        }
      ];

      const validation = kingLogic.validateMECEDistribution(tasks);
      expect(validation.valid).toBe(false);
      expect(validation.overlaps.length).toBeGreaterThan(0);
      expect(validation.overlaps[0]).toContain('src/shared.ts');
    });
  });

  describe('Meta-Logic Configuration', () => {
    it('should allow configuration of meta-logic features', () => {
      const initialStatus = kingLogic.getMetaLogicStatus();
      expect(initialStatus.taskSharding).toBe(true);

      kingLogic.configureMetaLogic({
        taskSharding: false,
        adaptiveCoordination: false
      });

      const updatedStatus = kingLogic.getMetaLogicStatus();
      expect(updatedStatus.taskSharding).toBe(false);
      expect(updatedStatus.adaptiveCoordination).toBe(false);
      expect(updatedStatus.meceDistribution).toBe(true); // Should remain unchanged
    });

    it('should respect disabled features', () => {
      kingLogic.configureMetaLogic({ taskSharding: false });

      const complexTask: Task = {
        id: 'complex',
        name: 'Complex task',
        description: 'Should not be sharded',
        domain: PrincessDomain.DEVELOPMENT,
        files: Array.from({ length: 20 }, (_, i) => `file${i}.ts`),
        estimatedLOC: 5000
      };

      expect(kingLogic.shouldShardTask(complexTask)).toBe(false);
    });
  });

  describe('Integration with MECE Distributor', () => {
    it('should work with MECE distributor for comprehensive coverage', () => {
      const tasks: Task[] = [
        {
          id: 'frontend',
          name: 'Frontend task',
          description: 'UI components',
          domain: PrincessDomain.DEVELOPMENT,
          files: ['src/components/Button.tsx', 'src/components/Form.tsx']
        },
        {
          id: 'backend',
          name: 'Backend task',
          description: 'API endpoints',
          domain: PrincessDomain.DEVELOPMENT,
          files: ['src/api/auth.ts', 'src/api/users.ts']
        }
      ];

      const distribution = meceDistributor.distributeTasks(tasks);
      expect(distribution.size).toBeGreaterThan(0);

      const stats = meceDistributor.getDistributionStats();
      expect(stats.totalTasks).toBe(tasks.length);
      expect(stats.totalResources).toBeGreaterThan(0);
    });
  });

  describe('Performance', () => {
    it('should handle large task sets efficiently', async () => {
      const largeTasks = Array.from({ length: 100 }, (_, i) => ({
        id: `task-${i}`,
        name: `Task ${i}`,
        description: `Description for task ${i}`,
        domain: PrincessDomain.DEVELOPMENT,
        files: [`src/file${i}.ts`],
        estimatedLOC: Math.floor(Math.random() * 500) + 50
      }));

      const startTime = Date.now();
      const distribution = await kingLogic.coordinateMultipleAgents(largeTasks, 6);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(5000); // Should complete in under 5 seconds
      expect(distribution.size).toBeGreaterThan(0);
    });
  });
});

// Version & Run Log Footer
/** AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE */
/** Version & Run Log
*| Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
*|--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
*| 1.0.0   | 2025-09-26T15:45:12-04:00 | claude@sonnet-4 | Created Phase 1 King Logic integration tests | tests/integration/phase1/king-logic.test.ts | OK | Complete test coverage | 0.00 | 7a8b9c2 |
*nReceipt:
*- status: OK
*- reason_if_blocked: --
*- run_id: phase1-king-logic-tests
*- inputs: [\"KingLogicAdapter\", \"MECEDistributor\", \"Task types\"]
*- tools_used: [\"claude-code\"]
*- versions: {\"claude\":\"sonnet-4\",\"framework\":\"jest\"}
**/
/** AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE */"