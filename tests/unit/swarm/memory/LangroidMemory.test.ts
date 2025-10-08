/**
 * LangroidMemory Unit Tests - London School TDD
 * Tests the Langroid memory system using mock-driven development.
 * Focuses on behavior verification and interaction patterns with external dependencies.
 * London School TDD Principles:
 * - Mock external dependencies (LangroidAdapter, Logger)
 * - Test memory management behaviors
 * - Verify embedding and search contracts
 * - Focus on interaction patterns rather than implementation details
 */

import { jest } from '@jest/globals';
import { LangroidMemory, MemoryEntry, SearchResult } from '../../../../src/swarm/memory/development/LangroidMemory';
import { LangroidAdapter } from '../../../../src/swarm/memory/langroid/LangroidAdapter';
import { Logger } from '../../../../src/utils/logger';

// Mock external dependencies
jest.mock('../../../../src/swarm/memory/langroid/LangroidAdapter');
jest.mock('../../../../src/utils/logger');

describe('LangroidMemory - London School TDD', () => {
  let langroidMemory: LangroidMemory;
  let mockLangroidAdapter: jest.Mocked<LangroidAdapter>;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    // Create mocks with expected behaviors
    mockLangroidAdapter = {
      createAgent: jest.fn(),
      executeTask: jest.fn(),
      getVectorStoreStats: jest.fn(),
      getStats: jest.fn(),
      removeAgent: jest.fn(),
      getAgent: jest.fn(),
    } as any;

    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    } as any;

    // Mock constructors
    (LangroidAdapter as jest.MockedClass<typeof LangroidAdapter>).mockImplementation(() => mockLangroidAdapter);
    (Logger as jest.MockedClass<typeof Logger>).mockImplementation(() => mockLogger);

    // Setup default mock behaviors
    mockLangroidAdapter.executeTask.mockResolvedValue('Task completed successfully');
    mockLangroidAdapter.getVectorStoreStats.mockReturnValue({
      collections: 1,
      totalVectors: 0,
      memoryUsage: '0MB'
    });
    mockLangroidAdapter.getStats.mockReturnValue({
      tasksExecuted: 0,
      successRate: 1.0,
      averageResponseTime: 100
    });
    mockLangroidAdapter.getAgent.mockReturnValue({
      name: 'DevelopmentPrincess',
      systemMessage: 'Test agent',
      llmProvider: 'openai'
    });

    langroidMemory = new LangroidMemory('test-agent');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization Contract', () => {
    it('should create LangroidAdapter with correct configuration', () => {
      expect(LangroidAdapter).toHaveBeenCalled();
      expect(mockLangroidAdapter.createAgent).toHaveBeenCalledWith(
        'test-agent',
        'DEVELOPMENT',
        expect.objectContaining({
          name: 'DevelopmentPrincess',
          systemMessage: expect.stringContaining('development specialist'),
          llmProvider: 'openai',
          vectorStore: expect.objectContaining({
            type: 'lancedb',
            collectionName: 'development_patterns',
            maxMemoryMB: 10
          }),
          tools: expect.arrayContaining(['code_editor', 'compiler', 'debugger', 'git', 'pattern_matcher'])
        })
      );
    });

    it('should initialize with correct memory limits', () => {
      const stats = langroidMemory.getStats();

      expect(stats.memoryLimit).toBe('10MB');
      expect(stats.totalEntries).toBe(0);
      expect(stats.utilizationPercent).toBe(0);
    });

    it('should setup logger with correct identifier', () => {
      expect(Logger).toHaveBeenCalledWith('DevelopmentLangroidMemory');
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Initializing Development Princess Langroid Memory (10MB limit)'
      );
    });
  });

  describe('Pattern Storage Behavior', () => {
    it('should store patterns with correct metadata structure', async () => {
      const content = 'function authenticate(user) { return jwt.sign(user); }';
      const metadata = {
        fileType: 'implementation',
        language: 'javascript',
        framework: 'node',
        tags: ['auth', 'jwt'],
        useCount: 0,
        successRate: 1.0
      };

      const patternId = await langroidMemory.storePattern(content, metadata);

      // Verify pattern ID generation
      expect(patternId).toMatch(/^dev-\d+-[a-f0-9]+$/);

      // Verify Langroid adapter interaction
      expect(mockLangroidAdapter.executeTask).toHaveBeenCalledWith(
        `store-pattern-${patternId}`,
        expect.stringContaining('Store code pattern')
      );
    });

    it('should emit pattern-stored event with correct data', async () => {
      const eventSpy = jest.fn();
      langroidMemory.on('pattern-stored', eventSpy);

      const content = 'const result = await api.call();';
      await langroidMemory.storePattern(content, {
        fileType: 'snippet',
        language: 'typescript'
      });

      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          id: expect.stringMatching(/^dev-\d+-[a-f0-9]+$/),
          size: expect.any(Number),
          langroidStored: true
        })
      );
    });

    it('should handle Langroid storage failures gracefully', async () => {
      mockLangroidAdapter.executeTask.mockRejectedValueOnce(new Error('LanceDB connection failed'));

      const content = 'test pattern';
      const patternId = await langroidMemory.storePattern(content, { fileType: 'test' });

      expect(patternId).toBeDefined();
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Langroid storage failed, using fallback:',
        expect.any(Error)
      );
    });

    it('should enforce 10MB memory limit by evicting old entries', async () => {
      // Mock a large content that would exceed memory
      const largeContent = 'x'.repeat(5 * 1024 * 1024); // 5MB content

      // Store first pattern
      await langroidMemory.storePattern(largeContent, { fileType: 'large' });

      // Store second pattern (should trigger eviction)
      await langroidMemory.storePattern(largeContent, { fileType: 'large2' });

      // Verify eviction logging
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Evicted')
      );
    });
  });

  describe('Pattern Search Behavior', () => {
    beforeEach(async () => {
      // Setup test patterns
      await langroidMemory.storePattern(
        'function login(username, password) { /* auth logic */ }',
        { fileType: 'function', language: 'javascript', tags: ['auth', 'login'] }
      );
      await langroidMemory.storePattern(
        'const authMiddleware = (req, res, next) => { /* middleware */ }',
        { fileType: 'middleware', language: 'javascript', tags: ['auth', 'express'] }
      );
      await langroidMemory.storePattern(
        'class UserService { validate() { /* validation */ } }',
        { fileType: 'class', language: 'typescript', tags: ['user', 'service'] }
      );
    });

    it('should search patterns using similarity threshold', async () => {
      const results = await langroidMemory.searchSimilar('authentication function', 3, 0.1);

      expect(results).toBeInstanceOf(Array);
      expect(results.length).toBeGreaterThan(0);

      // Verify result structure
      results.forEach(result => {
        expect(result).toHaveProperty('entry');
        expect(result).toHaveProperty('similarity');
        expect(result).toHaveProperty('relevance');
        expect(result.similarity).toBeGreaterThanOrEqual(0.1);
      });
    });

    it('should sort results by relevance', async () => {
      const results = await langroidMemory.searchSimilar('auth pattern', 5, 0.0);

      // Verify descending relevance order
      for (let i = 0; i < results.length - 1; i++) {
        expect(results[i].relevance).toBeGreaterThanOrEqual(results[i + 1].relevance);
      }
    });

    it('should update use counts when patterns are retrieved', async () => {
      // Search twice to verify use count increment
      await langroidMemory.searchSimilar('auth', 2, 0.0);
      const secondResults = await langroidMemory.searchSimilar('auth', 2, 0.0);

      // Use counts should be incremented
      secondResults.forEach(result => {
        expect(result.entry.metadata.useCount).toBeGreaterThan(0);
      });
    });

    it('should enhance search results using Langroid agent', async () => {
      await langroidMemory.searchSimilar('authentication patterns', 3, 0.5);

      expect(mockLangroidAdapter.executeTask).toHaveBeenCalledWith(
        expect.stringMatching(/^search-patterns-\d+$/),
        'Find similar code patterns: authentication patterns'
      );
    });

    it('should handle Langroid search enhancement failures gracefully', async () => {
      mockLangroidAdapter.executeTask.mockRejectedValueOnce(new Error('Search failed'));

      const results = await langroidMemory.searchSimilar('test query', 3, 0.5);

      expect(results).toBeDefined();
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Langroid search enhancement failed:',
        expect.any(Error)
      );
    });

    it('should respect search limit parameter', async () => {
      const results = await langroidMemory.searchSimilar('pattern', 2, 0.0);

      expect(results.length).toBeLessThanOrEqual(2);
    });
  });

  describe('Memory Management Contracts', () => {
    it('should provide accurate memory statistics', () => {
      const stats = langroidMemory.getStats();

      expect(stats).toEqual(
        expect.objectContaining({
          totalEntries: expect.any(Number),
          memoryUsed: expect.stringMatching(/^\d+\.\d{2}MB$/),
          memoryLimit: '10MB',
          utilizationPercent: expect.any(Number),
          langroidIntegration: expect.objectContaining({
            enabled: true,
            agentId: 'test-agent',
            vectorStore: expect.any(Object)
          }),
          adapterStats: expect.any(Object)
        })
      );
    });

    it('should clear all memories and cleanup Langroid agent', () => {
      langroidMemory.clear();

      expect(mockLangroidAdapter.removeAgent).toHaveBeenCalledWith('test-agent');
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Cleared all Development Princess memories and Langroid agent'
      );

      const stats = langroidMemory.getStats();
      expect(stats.totalEntries).toBe(0);
      expect(stats.utilizationPercent).toBe(0);
    });

    it('should handle Langroid cleanup failures gracefully', () => {
      mockLangroidAdapter.removeAgent.mockImplementation(() => {
        throw new Error('Cleanup failed');
      });

      langroidMemory.clear();

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Failed to clean up Langroid agent:',
        expect.any(Error)
      );
    });

    it('should persist memory state', async () => {
      await langroidMemory.persistMemory();

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Persisting')
      );
    });
  });

  describe('Langroid Agent Integration', () => {
    it('should provide access to Langroid agent configuration', () => {
      const agent = langroidMemory.getLangroidAgent();

      expect(mockLangroidAdapter.getAgent).toHaveBeenCalledWith('test-agent');
      expect(agent).toEqual(
        expect.objectContaining({
          name: 'DevelopmentPrincess',
          systemMessage: expect.any(String),
          llmProvider: 'openai'
        })
      );
    });

    it('should execute tasks through Langroid agent', async () => {
      const taskName = 'implement-feature';
      const message = 'Create user authentication system';

      const result = await langroidMemory.executeTask(taskName, message);

      expect(mockLangroidAdapter.executeTask).toHaveBeenCalledWith(
        'test-agent-implement-feature',
        message
      );
      expect(result).toBe('Task completed successfully');
    });

    it('should propagate Langroid task execution errors', async () => {
      const taskError = new Error('Task execution failed');
      mockLangroidAdapter.executeTask.mockRejectedValueOnce(taskError);

      await expect(langroidMemory.executeTask('failing-task', 'test message'))
        .rejects.toThrow('Task execution failed');
    });
  });

  describe('Embedding and Similarity Calculations', () => {
    it('should generate consistent embeddings for identical content', async () => {
      const content = 'const value = 42;';

      // Store same content twice
      const id1 = await langroidMemory.storePattern(content, { fileType: 'test' });
      const id2 = await langroidMemory.storePattern(content, { fileType: 'test' });

      // Search should find both with identical similarity
      const results = await langroidMemory.searchSimilar(content, 5, 0.0);

      expect(results.length).toBeGreaterThanOrEqual(2);

      // Find our stored patterns
      const storedResults = results.filter(r =>
        r.entry.id === id1 || r.entry.id === id2
      );

      expect(storedResults.length).toBe(2);
      expect(storedResults[0].similarity).toBeCloseTo(storedResults[1].similarity, 6);
    });

    it('should calculate relevance based on multiple factors', async () => {
      // Store pattern with high success rate
      await langroidMemory.storePattern(
        'function highQuality() { return "perfect"; }',
        {
          fileType: 'function',
          successRate: 1.0,
          useCount: 5
        }
      );

      // Store pattern with low success rate
      await langroidMemory.storePattern(
        'function lowQuality() { return "buggy"; }',
        {
          fileType: 'function',
          successRate: 0.3,
          useCount: 1
        }
      );

      const results = await langroidMemory.searchSimilar('function quality', 5, 0.0);

      // High quality pattern should have higher relevance
      if (results.length >= 2) {
        const highQualityResult = results.find(r => r.entry.content.includes('highQuality'));
        const lowQualityResult = results.find(r => r.entry.content.includes('lowQuality'));

        if (highQualityResult && lowQualityResult) {
          expect(highQualityResult.relevance).toBeGreaterThan(lowQualityResult.relevance);
        }
      }
    });
  });

  describe('EventEmitter Contract', () => {
    it('should properly extend EventEmitter', () => {
      expect(langroidMemory).toBeInstanceOf(require('events').EventEmitter);
    });

    it('should support custom event listeners', () => {
      const testListener = jest.fn();
      langroidMemory.on('test-event', testListener);

      langroidMemory.emit('test-event', 'test-data');

      expect(testListener).toHaveBeenCalledWith('test-data');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle empty search queries', async () => {
      const results = await langroidMemory.searchSimilar('', 5, 0.5);

      expect(results).toBeInstanceOf(Array);
      expect(results.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle invalid similarity thresholds', async () => {
      // Should not crash with extreme thresholds
      const results1 = await langroidMemory.searchSimilar('test', 5, -1.0);
      const results2 = await langroidMemory.searchSimilar('test', 5, 2.0);

      expect(results1).toBeInstanceOf(Array);
      expect(results2).toBeInstanceOf(Array);
    });

    it('should handle zero search limit', async () => {
      const results = await langroidMemory.searchSimilar('test', 0, 0.5);

      expect(results).toBeInstanceOf(Array);
      expect(results.length).toBe(0);
    });

    it('should handle very large pattern storage attempts', async () => {
      const hugeContent = 'x'.repeat(20 * 1024 * 1024); // 20MB (exceeds limit)

      // Should still store but trigger eviction
      const patternId = await langroidMemory.storePattern(hugeContent, { fileType: 'huge' });

      expect(patternId).toBeDefined();
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Evicted')
      );
    });
  });
});

/**
 * AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE
 * ## Version & Run Log
 * | Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
 * |--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
 * | 1.0.0   | 2025-09-27T00:02:45-04:00 | tdd-london-swarm@claude-sonnet-4-20250514 | Create comprehensive London School TDD test suite for LangroidMemory system | LangroidMemory.test.ts | OK | Complete memory system testing with embedding, search, and Langroid integration verification | 0.00 | 8c3f2e1 |
 * ### Receipt
 * - status: OK
 * - reason_if_blocked: --
 * - run_id: phase5-tdd-memory-001
 * - inputs: ["src/swarm/memory/development/LangroidMemory.ts", "src/swarm/types/task.types.ts", "src/swarm/hierarchy/types.ts"]
 * - tools_used: ["Write", "Bash", "Read"]
 * - versions: {"model":"claude-sonnet-4-20250514","prompt":"tdd-london-swarm-v1.0"}
 * AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE
 */