import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { RealLangroidMemoryManager } from '../../src/memory/coordinator/RealLangroidMemoryManager';
import { RealLangroidAdapter } from '../../src/swarm/memory/langroid/RealLangroidAdapter';
import { RealMemoryCompressor } from '../../src/memory/langroid/RealMemoryCompressor';
import { MemoryCoordinator } from '../../src/memory/coordinator/MemoryCoordinator';

describe('Real Memory Integration Tests', () => {
  let memoryManager: RealLangroidMemoryManager;
  let langroidAdapter: RealLangroidAdapter;
  let compressor: RealMemoryCompressor;
  let coordinator: MemoryCoordinator;

  beforeEach(async () => {
    // Set up OpenAI API key for testing
    process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'test-key-placeholder';

    memoryManager = new RealLangroidMemoryManager();
    langroidAdapter = new RealLangroidAdapter();
    compressor = new RealMemoryCompressor();
    coordinator = MemoryCoordinator.getInstance();

    // Wait for initialization
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  afterEach(async () => {
    await memoryManager.shutdown();
    await langroidAdapter.shutdown();
    await coordinator.shutdown();
  });

  describe('RealLangroidMemoryManager', () => {
    test('should store and retrieve memory with real embeddings', async () => {
      if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'test-key-placeholder') {
        console.log('Skipping OpenAI integration test - no API key');
        return;
      }

      const content = 'Test memory content for vector storage';
      const agentId = 'test-agent';

      const memoryId = await memoryManager.storeMemory(agentId, content, {
        contentType: 'test',
        tags: ['integration', 'test']
      });

      expect(memoryId).toBeDefined();
      expect(memoryId).toContain(agentId);

      // Search for similar content
      const results = await memoryManager.searchSimilar(
        'Test memory content',
        agentId,
        5,
        0.5
      );

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].entry.content).toBe(content);
      expect(results[0].similarity).toBeGreaterThan(0.7);
    });

    test('should handle memory limits correctly', async () => {
      const agentId = 'memory-limit-test';
      const largeContent = 'x'.repeat(1024 * 1024); // 1MB content

      // Store multiple large entries to test 10MB limit
      const memoryIds = [];
      for (let i = 0; i < 12; i++) {
        try {
          const id = await memoryManager.storeMemory(agentId, `${largeContent}-${i}`, {
            contentType: 'large-test',
            tags: ['memory-limit']
          });
          memoryIds.push(id);
        } catch (error) {
          // Expected when memory limit is reached
          break;
        }
      }

      const stats = memoryManager.getMemoryStats();
      expect(stats.utilizationPercent).toBeLessThanOrEqual(100);
      expect(memoryIds.length).toBeGreaterThan(0);
      expect(memoryIds.length).toBeLessThan(12); // Should hit memory limit
    });

    test('should persist and load memory correctly', async () => {
      const agentId = 'persistence-test';
      const content = 'Content for persistence testing';

      const memoryId = await memoryManager.storeMemory(agentId, content, {
        contentType: 'persistence',
        tags: ['persist']
      });

      // Force persistence
      await memoryManager.persistMemory();

      // Create new instance and check if data loads
      const newManager = new RealLangroidMemoryManager();
      await new Promise(resolve => setTimeout(resolve, 200)); // Wait for loading

      const stats = newManager.getMemoryStats();
      expect(stats.totalEntries).toBeGreaterThan(0);

      await newManager.shutdown();
    });
  });

  describe('RealLangroidAdapter', () => {
    test('should create and execute tasks with vector memory', async () => {
      const agentId = 'task-test-agent';

      const agentConfig = langroidAdapter.createAgent(agentId, 'DEVELOPMENT', {
        name: 'TestAgent',
        systemMessage: 'You are a test agent',
        llmProvider: 'openai',
        vectorStore: {
          type: 'lancedb',
          collectionName: 'test_vectors',
          storagePath: './test_vectors',
          embeddingProvider: 'openai',
          maxMemoryMB: 10
        },
        tools: ['test']
      });

      expect(agentConfig.agentId).toBe(agentId);
      expect(agentConfig.vectorStoreConfig.type).toBe('lancedb');

      // Execute task
      const response = await langroidAdapter.executeTask(
        `${agentId}-test-task`,
        'Test task message'
      );

      expect(response).toBeDefined();
      expect(response).toContain('TestAgent response');

      // Check vector store stats
      const stats = langroidAdapter.getVectorStoreStats(agentId);
      expect(stats.type).toBe('lancedb');
      expect(stats.interactions).toBeGreaterThan(0);
    });

    test('should compress and decompress interaction data', async () => {
      const agentId = 'compression-test';

      langroidAdapter.createAgent(agentId, 'TEST', {
        name: 'CompressionTest',
        systemMessage: 'Test compression',
        llmProvider: 'openai',
        vectorStore: {
          type: 'lancedb',
          collectionName: 'compression_test',
          storagePath: './test_compression',
          embeddingProvider: 'openai',
          maxMemoryMB: 5
        },
        tools: []
      });

      // Execute some tasks to generate data
      await langroidAdapter.executeTask(`${agentId}-task1`, 'First test message');
      await langroidAdapter.executeTask(`${agentId}-task2`, 'Second test message');

      // Compress interaction data
      const compressed = await langroidAdapter.compressInteractionData(agentId);
      expect(Buffer.isBuffer(compressed)).toBe(true);
      expect(compressed.length).toBeGreaterThan(0);

      // Decompress and verify
      const decompressed = await langroidAdapter.decompressInteractionData(compressed);
      expect(decompressed.agentId).toBe(agentId);
      expect(decompressed.interactions).toBeDefined();
      expect(decompressed.interactions.length).toBeGreaterThan(0);
    });
  });

  describe('RealMemoryCompressor', () => {
    test('should compress and decompress data with LZ4', async () => {
      const testData = {
        message: 'This is test data for compression testing',
        numbers: [1, 2, 3, 4, 5],
        nested: {
          key: 'value',
          array: ['a', 'b', 'c']
        }
      };

      const result = await compressor.compressLZ4(testData);

      expect(result.algorithm).toBe('lz4');
      expect(result.originalSize).toBeGreaterThan(0);
      expect(result.compressedSize).toBeGreaterThan(0);
      expect(result.compressionRatio).toBeGreaterThan(0);
      expect(Buffer.isBuffer(result.compressedData)).toBe(true);

      // Decompress and verify
      const decompressed = await compressor.decompressLZ4(result.compressedData);
      expect(decompressed).toEqual(testData);
    });

    test('should make compression decisions correctly', () => {
      const smallData = { key: 'value' };
      const largeData = { content: 'x'.repeat(2048) };

      expect(compressor.shouldCompress(smallData)).toBe(false);
      expect(compressor.shouldCompress(largeData)).toBe(true);

      const smallRatio = compressor.estimateCompressionRatio(smallData);
      const largeRatio = compressor.estimateCompressionRatio(largeData);

      expect(smallRatio).toBeGreaterThan(0);
      expect(largeRatio).toBeGreaterThan(0);
      expect(smallRatio).toBeGreaterThan(largeRatio); // Small data compresses worse
    });

    test('should handle batch compression', async () => {
      const entries = [
        { id: 'entry1', data: { content: 'First entry content' } },
        { id: 'entry2', data: { content: 'x'.repeat(2048) } }, // Large entry
        { id: 'entry3', data: { content: 'Third entry content' } }
      ];

      const results = await compressor.batchCompress(entries);

      expect(results.length).toBe(entries.length);

      for (const result of results) {
        expect(result.id).toBeDefined();
        expect(Buffer.isBuffer(result.compressed)).toBe(true);
        expect(result.metadata).toBeDefined();
        expect(result.metadata.originalSize).toBeGreaterThan(0);
      }

      // Large entry should be compressed, small ones might not be
      const largeResult = results.find(r => r.id === 'entry2');
      expect(largeResult?.metadata.algorithm).toBe('lz4');
    });

    test('should track compression statistics', async () => {
      compressor.resetStats();

      const testData = { content: 'x'.repeat(1024) };

      await compressor.compressLZ4(testData);
      await compressor.compressLZ4(testData);

      const stats = compressor.getCompressionStats();

      expect(stats.totalCompressions).toBe(2);
      expect(stats.totalOriginalBytes).toBeGreaterThan(0);
      expect(stats.totalCompressedBytes).toBeGreaterThan(0);
      expect(stats.averageCompressionRatio).toBeGreaterThan(0);
      expect(stats.spaceSavingsPercent).toBeGreaterThan(0);
    });
  });

  describe('Memory Coordinator Integration', () => {
    test('should use real memory calculations', async () => {
      const request = {
        size: 1024,
        domain: 'research' as any,
        priority: 1 as any,
        allowCompression: true
      };

      const blockId = await coordinator.allocateMemory(request);
      expect(blockId).toBeDefined();

      const testData = { content: 'x'.repeat(2048) };
      const stored = await coordinator.storeData(blockId!, testData);
      expect(stored).toBe(true);

      const retrieved = await coordinator.retrieveData(blockId!);
      expect(retrieved).toEqual(testData);

      const status = coordinator.getMemoryStatus();
      expect(status.efficiency).toBeGreaterThan(0);
      expect(status.compressionRatio).toBeGreaterThan(0);
    });

    test('should handle memory optimization', async () => {
      // Force memory optimization
      const result = await coordinator.forceOptimization();

      expect(result.freedMemory).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(result.optimizations)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('should handle missing API key gracefully', async () => {
      const originalKey = process.env.OPENAI_API_KEY;
      delete process.env.OPENAI_API_KEY;

      try {
        const testManager = new RealLangroidMemoryManager();
        // Should either use fallback or throw appropriate error
      } catch (error) {
        expect(error.message).toContain('OPENAI_API_KEY');
      } finally {
        process.env.OPENAI_API_KEY = originalKey;
      }
    });

    test('should handle compression failures gracefully', async () => {
      const invalidData = { circular: null as any };
      invalidData.circular = invalidData; // Create circular reference

      try {
        await compressor.compressLZ4(invalidData);
        fail('Should have thrown error for circular reference');
      } catch (error) {
        expect(error.message).toContain('compression failed');
      }
    });
  });
});