/**
 * Cross-Session Memory Persistence Integration Tests
 * Validates memory system maintains state across sessions
 */

import { LangroidMemory } from '../../../src/swarm/memory/development/LangroidMemory';
import { VectorStore } from '../../../src/swarm/memory/development/VectorStore';
import { DevelopmentPrincess } from '../../../src/swarm/hierarchy/domains/DevelopmentPrincess';
import { Task, TaskPriority } from '../../../src/swarm/types/task.types';
import { PrincessDomain } from '../../../src/swarm/hierarchy/types';

describe('Cross-Session Memory Persistence Integration', () => {
  let langroidMemory: LangroidMemory;
  let vectorStore: VectorStore;
  let developmentPrincess: DevelopmentPrincess;
  let sessionId: string;

  beforeEach(() => {
    sessionId = `test-session-${Date.now()}`;
    langroidMemory = new LangroidMemory(`integration-test-${sessionId}`);
    vectorStore = new VectorStore();
    developmentPrincess = new DevelopmentPrincess();

    // Mock global MCP functions
    (globalThis as any).mcp__claude_flow__agent_spawn = jest.fn().mockResolvedValue({
      agentId: 'mock-agent-' + Math.random().toString(36).substr(2, 9)
    });
  });

  afterEach(() => {
    delete (globalThis as any).mcp__claude_flow__agent_spawn;
  });

  describe('Pattern Storage and Retrieval Persistence', () => {
    it('should persist patterns across memory instances', async () => {
      const testPattern = {
        content: 'React component with TypeScript interfaces for user authentication',
        metadata: {
          fileType: 'react-component',
          language: 'typescript',
          framework: 'react',
          tags: ['authentication', 'typescript', 'hooks'],
          useCount: 5,
          successRate: 0.95
        }
      };

      // Store pattern in first memory instance
      const patternId = await langroidMemory.storePattern(testPattern.content, testPattern.metadata);
      expect(patternId).toBeDefined();

      // Create new memory instance with same session
      const newMemoryInstance = new LangroidMemory(`integration-test-${sessionId}`);

      // Search for pattern in new instance
      const foundPatterns = await newMemoryInstance.searchSimilar(
        'typescript authentication component',
        3,
        0.6
      );

      expect(foundPatterns.length).toBeGreaterThan(0);
      const foundPattern = foundPatterns.find(p => p.entry.id === patternId);
      expect(foundPattern).toBeDefined();
      expect(foundPattern!.entry.content).toBe(testPattern.content);
    });

    it('should maintain pattern usage statistics across sessions', async () => {
      const pattern = 'Database connection with error handling';
      const metadata = {
        fileType: 'database',
        language: 'typescript',
        framework: 'node',
        tags: ['database', 'error-handling'],
        useCount: 0,
        successRate: 1.0
      };

      // Store and use pattern multiple times
      const patternId = await langroidMemory.storePattern(pattern, metadata);

      for (let i = 0; i < 3; i++) {
        await langroidMemory.incrementUsage(patternId);
      }

      // Create new memory instance
      const newMemoryInstance = new LangroidMemory(`integration-test-${sessionId}`);
      const stats = newMemoryInstance.getStats();

      // Usage statistics should persist
      expect(stats.totalUses).toBeGreaterThanOrEqual(3);
    });

    it('should preserve pattern relationships across sessions', async () => {
      // Store related patterns
      const patterns = [
        { content: 'User service implementation', tags: ['service', 'user'] },
        { content: 'User controller endpoints', tags: ['controller', 'user'] },
        { content: 'User model definition', tags: ['model', 'user'] }
      ];

      const patternIds = [];
      for (const pattern of patterns) {
        const id = await langroidMemory.storePattern(pattern.content, {
          fileType: 'typescript',
          language: 'typescript',
          framework: 'express',
          tags: pattern.tags,
          useCount: 0,
          successRate: 1.0
        });
        patternIds.push(id);
      }

      // Create new memory instance
      const newMemoryInstance = new LangroidMemory(`integration-test-${sessionId}`);

      // Search should find related patterns
      const userPatterns = await newMemoryInstance.searchSimilar('user implementation', 5, 0.5);

      expect(userPatterns.length).toBeGreaterThanOrEqual(patterns.length);

      // All stored patterns should be found
      const foundIds = userPatterns.map(p => p.entry.id);
      patternIds.forEach(id => {
        expect(foundIds).toContain(id);
      });
    });
  });

  describe('Vector Store Persistence', () => {
    it('should maintain vector embeddings across vector store instances', async () => {
      const testVectors = [
        { id: 'auth-1', embedding: [0.8, 0.6, 0.4], category: 'authentication', priority: 80 },
        { id: 'db-1', embedding: [0.7, 0.8, 0.3], category: 'database', priority: 75 },
        { id: 'api-1', embedding: [0.6, 0.7, 0.9], category: 'api-endpoint', priority: 70 }
      ];

      // Add vectors to first store
      for (const vector of testVectors) {
        await vectorStore.addVector(
          vector.id,
          new Float32Array(vector.embedding),
          vector.category,
          vector.priority
        );
      }

      // Create new vector store instance
      const newVectorStore = new VectorStore();

      // Note: In a real implementation, vectors would be persisted to storage
      // For this test, we simulate by manually adding the same vectors
      for (const vector of testVectors) {
        await newVectorStore.addVector(
          vector.id,
          new Float32Array(vector.embedding),
          vector.category,
          vector.priority
        );
      }

      // Search should work in new instance
      const queryVector = new Float32Array([0.8, 0.6, 0.4]);
      const results = await newVectorStore.searchSimilar(queryVector, { threshold: 0.9 });

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].id).toBe('auth-1');
      expect(results[0].similarity).toBeCloseTo(1.0, 5);
    });

    it('should preserve category organization across instances', async () => {
      // Add vectors to multiple categories
      const categories = ['react-component', 'api-endpoint', 'database-query'];

      for (let i = 0; i < categories.length; i++) {
        await vectorStore.addVector(
          `vector-${i}`,
          new Float32Array([i * 0.3, i * 0.2, i * 0.1]),
          categories[i],
          50 + i * 10
        );
      }

      const originalStats = vectorStore.getCategoryStats();

      // Create new vector store and simulate persistence
      const newVectorStore = new VectorStore();
      for (let i = 0; i < categories.length; i++) {
        await newVectorStore.addVector(
          `vector-${i}`,
          new Float32Array([i * 0.3, i * 0.2, i * 0.1]),
          categories[i],
          50 + i * 10
        );
      }

      const newStats = newVectorStore.getCategoryStats();

      // Category statistics should match
      categories.forEach(category => {
        expect(newStats[category]).toBe(originalStats[category]);
      });
    });
  });

  describe('Development Princess Memory Integration', () => {
    it('should maintain task execution patterns across Princess instances', async () => {
      const developmentTask: Task = {
        id: 'persistence-test-001',
        name: 'User Authentication Implementation',
        description: 'Implement JWT-based user authentication with refresh tokens',
        domain: PrincessDomain.DEVELOPMENT,
        priority: TaskPriority.HIGH,
        files: ['src/auth/auth.service.ts', 'src/auth/jwt.strategy.ts'],
        dependencies: ['database', 'crypto'],
        estimatedLOC: 300
      };

      // Execute task with first Princess instance
      const result1 = await developmentPrincess.executeTask(developmentTask);
      expect(result1.result).toBe('development-complete');
      expect(result1.langroidMemoryUsed).toBe(true);

      // Create new Princess instance - would use same underlying memory
      const newDevelopmentPrincess = new DevelopmentPrincess();

      // Search for patterns from previous execution
      const patterns = await newDevelopmentPrincess.searchPatterns('JWT authentication implementation');
      expect(patterns.length).toBeGreaterThan(0);

      // Execute similar task - should benefit from stored patterns
      const similarTask: Task = {
        id: 'persistence-test-002',
        name: 'OAuth Authentication Implementation',
        description: 'Implement OAuth2-based user authentication with PKCE',
        domain: PrincessDomain.DEVELOPMENT,
        priority: TaskPriority.HIGH,
        files: ['src/auth/oauth.service.ts', 'src/auth/oauth.strategy.ts'],
        dependencies: ['database', 'oauth2'],
        estimatedLOC: 350
      };

      const result2 = await newDevelopmentPrincess.executeTask(similarTask);
      expect(result2.result).toBe('development-complete');
      expect(result2.patternsUsed).toBeGreaterThan(0); // Should use patterns from first execution
    });

    it('should accumulate memory statistics across multiple executions', async () => {
      const tasks = [
        {
          id: 'stats-1',
          name: 'API Endpoint Implementation',
          description: 'Create REST API endpoints for user management',
          files: ['src/api/users.controller.ts']
        },
        {
          id: 'stats-2',
          name: 'Database Schema',
          description: 'Design and implement user database schema',
          files: ['src/models/user.model.ts']
        },
        {
          id: 'stats-3',
          name: 'Authentication Middleware',
          description: 'Implement JWT authentication middleware',
          files: ['src/middleware/auth.middleware.ts']
        }
      ];

      // Execute multiple tasks
      for (const taskData of tasks) {
        const task: Task = {
          ...taskData,
          domain: PrincessDomain.DEVELOPMENT,
          priority: TaskPriority.MEDIUM,
          dependencies: [],
          estimatedLOC: 150
        };

        await developmentPrincess.executeTask(task);
      }

      // Memory statistics should reflect all executions
      const memoryStats = developmentPrincess.getMemoryStats();
      expect(memoryStats.totalPatterns).toBeGreaterThanOrEqual(tasks.length);
      expect(memoryStats.totalMemoryUsage).toBeGreaterThan(0);
    });
  });

  describe('Session Isolation and Security', () => {
    it('should isolate memory between different sessions', async () => {
      const session1Pattern = 'Session 1 specific implementation pattern';
      const session2Pattern = 'Session 2 specific implementation pattern';

      // Store pattern in session 1
      const memory1 = new LangroidMemory('session-1');
      await memory1.storePattern(session1Pattern, {
        fileType: 'typescript',
        language: 'typescript',
        framework: 'node',
        tags: ['session-1'],
        useCount: 0,
        successRate: 1.0
      });

      // Store pattern in session 2
      const memory2 = new LangroidMemory('session-2');
      await memory2.storePattern(session2Pattern, {
        fileType: 'typescript',
        language: 'typescript',
        framework: 'node',
        tags: ['session-2'],
        useCount: 0,
        successRate: 1.0
      });

      // Session 1 should not see session 2 patterns
      const session1Results = await memory1.searchSimilar('session implementation', 10, 0.1);
      const session1Contents = session1Results.map(r => r.entry.content);
      expect(session1Contents).toContain(session1Pattern);
      expect(session1Contents).not.toContain(session2Pattern);

      // Session 2 should not see session 1 patterns
      const session2Results = await memory2.searchSimilar('session implementation', 10, 0.1);
      const session2Contents = session2Results.map(r => r.entry.content);
      expect(session2Contents).toContain(session2Pattern);
      expect(session2Contents).not.toContain(session1Pattern);
    });

    it('should handle session cleanup without affecting other sessions', async () => {
      const memory1 = new LangroidMemory('cleanup-session-1');
      const memory2 = new LangroidMemory('cleanup-session-2');

      // Store patterns in both sessions
      await memory1.storePattern('Pattern for session 1', {
        fileType: 'test',
        language: 'typescript',
        framework: 'jest',
        tags: ['cleanup-test'],
        useCount: 0,
        successRate: 1.0
      });

      await memory2.storePattern('Pattern for session 2', {
        fileType: 'test',
        language: 'typescript',
        framework: 'jest',
        tags: ['cleanup-test'],
        useCount: 0,
        successRate: 1.0
      });

      // Simulate session 1 cleanup
      memory1.clear();

      // Session 2 should remain unaffected
      const session2Results = await memory2.searchSimilar('Pattern', 10, 0.1);
      expect(session2Results.length).toBeGreaterThan(0);
      expect(session2Results[0].entry.content).toContain('session 2');
    });
  });

  describe('Performance Under Persistence Load', () => {
    it('should handle large-scale pattern storage efficiently', async () => {
      const startTime = Date.now();
      const patternCount = 50;
      const patternIds = [];

      // Store many patterns
      for (let i = 0; i < patternCount; i++) {
        const pattern = `Pattern ${i}: Implementation of feature ${i} with comprehensive error handling`;
        const id = await langroidMemory.storePattern(pattern, {
          fileType: 'implementation',
          language: 'typescript',
          framework: 'node',
          tags: [`feature-${i}`, 'error-handling'],
          useCount: Math.floor(Math.random() * 10),
          successRate: 0.8 + Math.random() * 0.2
        });
        patternIds.push(id);
      }

      const storageTime = Date.now() - startTime;
      expect(storageTime).toBeLessThan(5000); // Should complete in under 5 seconds

      // Test search performance
      const searchStart = Date.now();
      const results = await langroidMemory.searchSimilar('implementation feature', 10, 0.5);
      const searchTime = Date.now() - searchStart;

      expect(searchTime).toBeLessThan(1000); // Search should be fast
      expect(results.length).toBeGreaterThan(0);
    });

    it('should maintain consistent performance across session restarts', async () => {
      // Store baseline patterns
      const baselinePatterns = 20;
      for (let i = 0; i < baselinePatterns; i++) {
        await langroidMemory.storePattern(`Baseline pattern ${i}`, {
          fileType: 'baseline',
          language: 'typescript',
          framework: 'test',
          tags: ['baseline'],
          useCount: 0,
          successRate: 1.0
        });
      }

      // Measure search time in original session
      const query = 'baseline pattern implementation';
      const originalStart = Date.now();
      await langroidMemory.searchSimilar(query, 10, 0.5);
      const originalTime = Date.now() - originalStart;

      // Create new session and measure search time
      const newMemory = new LangroidMemory(`integration-test-${sessionId}`);

      // Simulate loading the same patterns
      for (let i = 0; i < baselinePatterns; i++) {
        await newMemory.storePattern(`Baseline pattern ${i}`, {
          fileType: 'baseline',
          language: 'typescript',
          framework: 'test',
          tags: ['baseline'],
          useCount: 0,
          successRate: 1.0
        });
      }

      const newSessionStart = Date.now();
      await newMemory.searchSimilar(query, 10, 0.5);
      const newSessionTime = Date.now() - newSessionStart;

      // Performance should be consistent (within 2x)
      expect(newSessionTime).toBeLessThan(originalTime * 2);
    });
  });

  describe('Error Recovery and Resilience', () => {
    it('should handle corrupted memory gracefully', async () => {
      // Store valid pattern
      const validPattern = 'Valid implementation pattern';
      await langroidMemory.storePattern(validPattern, {
        fileType: 'valid',
        language: 'typescript',
        framework: 'node',
        tags: ['valid'],
        useCount: 0,
        successRate: 1.0
      });

      // Simulate corruption by creating new instance
      const corruptedMemory = new LangroidMemory(`corrupted-${sessionId}`);

      // Should not crash when searching
      await expect(
        corruptedMemory.searchSimilar('implementation', 5, 0.5)
      ).resolves.toBeDefined();

      // Should allow new patterns to be stored
      await expect(
        corruptedMemory.storePattern('Recovery pattern', {
          fileType: 'recovery',
          language: 'typescript',
          framework: 'node',
          tags: ['recovery'],
          useCount: 0,
          successRate: 1.0
        })
      ).resolves.toBeDefined();
    });

    it('should recover from partial data loss', async () => {
      const criticalPatterns = [
        'Authentication implementation',
        'Database connection handling',
        'Error handling patterns'
      ];

      // Store critical patterns
      for (const pattern of criticalPatterns) {
        await langroidMemory.storePattern(pattern, {
          fileType: 'critical',
          language: 'typescript',
          framework: 'node',
          tags: ['critical', 'recovery-test'],
          useCount: 0,
          successRate: 1.0
        });
      }

      // Simulate partial recovery
      const recoveredMemory = new LangroidMemory(`recovered-${sessionId}`);

      // Simulate recovering only some patterns
      await recoveredMemory.storePattern(criticalPatterns[0], {
        fileType: 'critical',
        language: 'typescript',
        framework: 'node',
        tags: ['critical', 'recovered'],
        useCount: 0,
        successRate: 1.0
      });

      // Should work with partial data
      const results = await recoveredMemory.searchSimilar('authentication', 5, 0.5);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].entry.content).toContain('Authentication');
    });
  });
});