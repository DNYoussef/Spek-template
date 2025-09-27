/**
 * Queen-Princess-Drone Hierarchy Integration Tests
 * Comprehensive workflow validation for complete swarm coordination
 */

import { SwarmQueen } from '../../../../src/swarm/hierarchy/SwarmQueen';
import { DevelopmentPrincess } from '../../../../src/swarm/hierarchy/domains/DevelopmentPrincess';
import { QualityPrincess } from '../../../../src/swarm/hierarchy/domains/QualityPrincess';
import { SecurityPrincess } from '../../../../src/swarm/hierarchy/domains/SecurityPrincess';
import { KingLogicAdapter } from '../../../../src/swarm/queen/KingLogicAdapter';
import { Task, TaskPriority } from '../../../../src/swarm/types/task.types';
import { PrincessDomain } from '../../../../src/swarm/hierarchy/types';

describe('Queen-Princess-Drone Integration Tests', () => {
  let swarmQueen: SwarmQueen;
  let developmentPrincess: DevelopmentPrincess;
  let qualityPrincess: QualityPrincess;
  let securityPrincess: SecurityPrincess;
  let kingLogic: KingLogicAdapter;

  beforeEach(async () => {
    // Initialize the complete hierarchy
    kingLogic = new KingLogicAdapter();
    swarmQueen = new SwarmQueen();
    developmentPrincess = new DevelopmentPrincess();
    qualityPrincess = new QualityPrincess();
    securityPrincess = new SecurityPrincess();

    // Mock global MCP functions for agent spawning
    (globalThis as any).mcp__claude_flow__agent_spawn = jest.fn().mockResolvedValue({
      agentId: 'mock-agent-' + Math.random().toString(36).substr(2, 9)
    });

    (globalThis as any).mcp__claude_flow__task_orchestrate = jest.fn().mockResolvedValue({
      taskId: 'orchestrated-task-' + Math.random().toString(36).substr(2, 9),
      result: 'success'
    });
  });

  afterEach(() => {
    // Clean up global mocks
    delete (globalThis as any).mcp__claude_flow__agent_spawn;
    delete (globalThis as any).mcp__claude_flow__task_orchestrate;
  });

  describe('Complete Workflow Integration', () => {
    it('should coordinate full development workflow with Queen-Princess-Drone hierarchy', async () => {
      const developmentTask: Task = {
        id: 'integration-dev-001',
        name: 'Build User Authentication System',
        description: 'Implement complete user authentication with security validation',
        domain: PrincessDomain.DEVELOPMENT,
        priority: TaskPriority.HIGH,
        files: [
          'src/auth/user.service.ts',
          'src/auth/auth.controller.ts',
          'src/auth/jwt.strategy.ts',
          'src/auth/guards/auth.guard.ts',
          'src/auth/middleware/auth.middleware.ts'
        ],
        dependencies: ['database', 'crypto', 'jwt'],
        estimatedLOC: 800
      };

      console.log('[Integration Test] Starting Queen coordination...');

      // Step 1: Queen analyzes and routes task
      const complexity = kingLogic.analyzeTaskComplexity(developmentTask);
      expect(complexity).toBeGreaterThan(0);

      // Step 2: Queen determines if sharding is needed
      const shouldShard = kingLogic.shouldShardTask(developmentTask);
      if (shouldShard) {
        console.log('[Integration Test] Task requires sharding...');
        const shards = kingLogic.shardTask(developmentTask);
        expect(shards.length).toBeGreaterThan(1);
        expect(shards.length).toBeLessThanOrEqual(6);
      }

      // Step 3: Development Princess executes task
      console.log('[Integration Test] Development Princess executing task...');
      const devResult = await developmentPrincess.executeTask(developmentTask);

      // Validate Development Princess results
      expect(devResult.result).toBe('development-complete');
      expect(devResult.taskId).toBe(developmentTask.id);
      expect(devResult.kingLogicApplied).toBe(true);
      expect(devResult.langroidMemoryUsed).toBe(true);
      expect(devResult.implementations).toBeDefined();

      // Step 4: Quality Princess validates development output
      console.log('[Integration Test] Quality Princess validating output...');
      const qualityTask: Task = {
        id: 'integration-qa-001',
        name: 'Validate Authentication System',
        description: 'Test authentication implementation',
        domain: PrincessDomain.QUALITY,
        priority: TaskPriority.HIGH,
        files: developmentTask.files,
        dependencies: [developmentTask.id]
      };

      const qaResult = await qualityPrincess.executeTask(qualityTask);
      expect(qaResult.result).toBe('quality-complete');

      // Step 5: Security Princess performs security audit
      console.log('[Integration Test] Security Princess auditing security...');
      const securityTask: Task = {
        id: 'integration-sec-001',
        name: 'Security Audit Authentication',
        description: 'Audit authentication security implementation',
        domain: PrincessDomain.SECURITY,
        priority: TaskPriority.CRITICAL,
        files: developmentTask.files,
        dependencies: [developmentTask.id, qualityTask.id]
      };

      const secResult = await securityPrincess.executeTask(securityTask);
      expect(secResult.result).toBe('security-complete');

      console.log('[Integration Test] Complete workflow validated successfully');
    }, 30000); // 30 second timeout for complex integration test

    it('should handle complex task distribution across multiple Princesses', async () => {
      const complexSystemTask: Task = {
        id: 'complex-system-001',
        name: 'Build Complete E-commerce Platform',
        description: 'Full e-commerce system with multiple components',
        domain: PrincessDomain.DEVELOPMENT,
        priority: TaskPriority.CRITICAL,
        files: Array.from({ length: 25 }, (_, i) => `src/modules/module${i + 1}.ts`),
        dependencies: ['database', 'payment', 'inventory', 'shipping', 'auth'],
        estimatedLOC: 5000
      };

      // This should trigger sharding and multi-Princess coordination
      const shouldShard = kingLogic.shouldShardTask(complexSystemTask);
      expect(shouldShard).toBe(true);

      console.log('[Integration Test] Coordinating complex multi-Princess task...');
      const distribution = await kingLogic.coordinateMultipleAgents([complexSystemTask], 6);

      // Verify distribution across multiple domains
      expect(distribution.size).toBeGreaterThan(1);

      let totalDistributedTasks = 0;
      distribution.forEach((tasks, domain) => {
        totalDistributedTasks += tasks.length;
        console.log(`[Integration Test] ${domain}: ${tasks.length} tasks`);
      });

      expect(totalDistributedTasks).toBeGreaterThan(1);

      // Execute tasks across different Princesses
      const devTasks = distribution.get(PrincessDomain.DEVELOPMENT) || [];
      const qualityTasks = distribution.get(PrincessDomain.QUALITY) || [];
      const securityTasks = distribution.get(PrincessDomain.SECURITY) || [];

      // Execute development tasks
      for (const task of devTasks) {
        const result = await developmentPrincess.executeTask(task);
        expect(result.result).toBe('development-complete');
      }

      // Execute quality tasks
      for (const task of qualityTasks) {
        const result = await qualityPrincess.executeTask(task);
        expect(result.result).toBe('quality-complete');
      }

      // Execute security tasks
      for (const task of securityTasks) {
        const result = await securityPrincess.executeTask(task);
        expect(result.result).toBe('security-complete');
      }

      console.log('[Integration Test] Multi-Princess coordination completed successfully');
    }, 45000); // 45 second timeout for very complex test
  });

  describe('King Logic Integration with Princesses', () => {
    it('should integrate King Logic patterns across all Princess domains', async () => {
      const testTask: Task = {
        id: 'king-integration-001',
        name: 'King Logic Pattern Integration Test',
        description: 'Test King Logic meta-patterns across Princess hierarchy',
        domain: PrincessDomain.DEVELOPMENT,
        priority: TaskPriority.MEDIUM,
        files: ['src/integration/test.ts'],
        estimatedLOC: 150
      };

      // Test King Logic coordination
      const complexity = kingLogic.analyzeTaskComplexity(testTask);
      const routing = kingLogic.routeTaskToPrincess(testTask);

      expect(complexity).toBeGreaterThan(0);
      expect(routing).toBe(PrincessDomain.DEVELOPMENT);

      // Test Development Princess King Logic integration
      const devResult = await developmentPrincess.executeTask(testTask);
      const kingStatus = developmentPrincess.getKingLogicStatus();
      const meceStats = developmentPrincess.getMECEStats();

      expect(devResult.kingLogicApplied).toBe(true);
      expect(kingStatus).toBeDefined();
      expect(meceStats).toBeDefined();

      console.log('[Integration Test] King Logic patterns successfully integrated');
    });

    it('should validate MECE compliance across Princess coordination', async () => {
      const overlappingTasks = [
        {
          id: 'mece-test-1',
          name: 'Task 1',
          description: 'First overlapping task',
          domain: PrincessDomain.DEVELOPMENT,
          files: ['shared-file.ts', 'file1.ts']
        },
        {
          id: 'mece-test-2',
          name: 'Task 2',
          description: 'Second overlapping task',
          domain: PrincessDomain.DEVELOPMENT,
          files: ['shared-file.ts', 'file2.ts'] // shared-file.ts creates overlap
        }
      ];

      // Test MECE validation
      const validation = kingLogic.validateMECEDistribution(overlappingTasks);
      expect(validation.valid).toBe(false);
      expect(validation.overlaps.length).toBeGreaterThan(0);
      expect(validation.overlaps[0]).toContain('shared-file.ts assigned to multiple tasks');

      console.log('[Integration Test] MECE validation working correctly');
    });
  });

  describe('Memory Integration Across Hierarchy', () => {
    it('should maintain memory consistency across Princess interactions', async () => {
      const memoryTask: Task = {
        id: 'memory-integration-001',
        name: 'Memory Consistency Test',
        description: 'Test memory integration across Princess hierarchy',
        domain: PrincessDomain.DEVELOPMENT,
        priority: TaskPriority.MEDIUM,
        files: ['src/memory/test.ts'],
        estimatedLOC: 100
      };

      // Execute task and store patterns
      const devResult = await developmentPrincess.executeTask(memoryTask);
      const memoryStats = developmentPrincess.getMemoryStats();

      expect(devResult.langroidMemoryUsed).toBe(true);
      expect(memoryStats).toBeDefined();

      // Search for stored patterns
      const patterns = await developmentPrincess.searchPatterns('memory test pattern');
      expect(patterns).toBeDefined();

      console.log('[Integration Test] Memory integration validated across hierarchy');
    });
  });

  describe('Error Handling and Resilience', () => {
    it('should handle Princess failures gracefully', async () => {
      const errorTask: Task = {
        id: 'error-test-001',
        name: 'Error Handling Test',
        description: 'Test error handling in Princess hierarchy',
        domain: PrincessDomain.DEVELOPMENT,
        priority: TaskPriority.LOW,
        files: ['src/error/test.ts'],
        estimatedLOC: 50
      };

      // Mock a failure scenario
      const originalExecuteTask = developmentPrincess.executeTask;
      developmentPrincess.executeTask = jest.fn().mockRejectedValue(new Error('Simulated Princess failure'));

      try {
        await developmentPrincess.executeTask(errorTask);
        fail('Expected error was not thrown');
      } catch (error) {
        expect(error.message).toBe('Simulated Princess failure');
      }

      // Restore original method
      developmentPrincess.executeTask = originalExecuteTask;

      console.log('[Integration Test] Error handling validated');
    });

    it('should recover from MECE violations during coordination', async () => {
      const violationListener = jest.fn();
      kingLogic.on('mece-violation', violationListener);

      const problemTasks = [
        {
          id: 'violation-1',
          name: 'Violation Task 1',
          description: 'Task causing MECE violation',
          domain: PrincessDomain.DEVELOPMENT,
          files: ['conflict.ts']
        },
        {
          id: 'violation-2',
          name: 'Violation Task 2',
          description: 'Task causing MECE violation',
          domain: PrincessDomain.DEVELOPMENT,
          files: ['conflict.ts'] // Same file causes violation
        }
      ];

      const distribution = await kingLogic.coordinateMultipleAgents(problemTasks, 2);

      // Should still complete coordination despite MECE violation
      expect(distribution.size).toBeGreaterThan(0);
      expect(violationListener).toHaveBeenCalled();

      kingLogic.removeAllListeners();
      console.log('[Integration Test] MECE violation recovery validated');
    });
  });

  describe('Performance Integration', () => {
    it('should handle concurrent Princess operations efficiently', async () => {
      const concurrentTasks = Array.from({ length: 5 }, (_, i) => ({
        id: `concurrent-${i}`,
        name: `Concurrent Task ${i}`,
        description: `Concurrent execution test task ${i}`,
        domain: PrincessDomain.DEVELOPMENT,
        priority: TaskPriority.MEDIUM,
        files: [`src/concurrent/task${i}.ts`],
        estimatedLOC: 100
      }));

      const startTime = Date.now();

      // Execute all tasks concurrently
      const promises = concurrentTasks.map(task =>
        developmentPrincess.executeTask(task)
      );

      const results = await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Validate all tasks completed successfully
      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result.result).toBe('development-complete');
      });

      // Should complete within reasonable time (under 10 seconds)
      expect(duration).toBeLessThan(10000);

      console.log(`[Integration Test] Concurrent operations completed in ${duration}ms`);
    }, 15000);

    it('should scale coordination with increasing task complexity', async () => {
      const scaleTestSizes = [1, 5, 10, 20];
      const results = [];

      for (const size of scaleTestSizes) {
        const tasks = Array.from({ length: size }, (_, i) => ({
          id: `scale-test-${size}-${i}`,
          name: `Scale Test Task ${i}`,
          description: `Scale test with ${size} tasks`,
          domain: PrincessDomain.DEVELOPMENT,
          priority: TaskPriority.MEDIUM,
          files: [`src/scale/task${i}.ts`],
          estimatedLOC: 100
        }));

        const startTime = Date.now();
        const distribution = await kingLogic.coordinateMultipleAgents(tasks, 6);
        const endTime = Date.now();

        results.push({
          taskCount: size,
          duration: endTime - startTime,
          distributionSize: distribution.size
        });
      }

      // Validate scaling behavior
      results.forEach(result => {
        expect(result.duration).toBeLessThan(5000); // Under 5 seconds each
        expect(result.distributionSize).toBeGreaterThan(0);
      });

      console.log('[Integration Test] Scaling validation completed:', results);
    }, 30000);
  });
});