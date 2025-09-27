/**
 * Comprehensive Test Suite for VectorStore
 * Testing 722 lines of real mathematical vector operations
 */

import { VectorStore, VectorIndex, SearchOptions } from '../../../../../src/swarm/memory/development/VectorStore';
import { Logger } from '../../../../../src/utils/logger';

// Mock Logger
jest.mock('../../../../../src/utils/logger');

describe('VectorStore - Mathematical Validation Tests', () => {
  let vectorStore: VectorStore;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    mockLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    } as any;

    (Logger as jest.MockedClass<typeof Logger>).mockImplementation(() => mockLogger);

    vectorStore = new VectorStore();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization and Basic Operations', () => {
    it('should initialize with proper default categories', () => {
      const categories = vectorStore.getCategories();

      expect(categories).toContain('react-component');
      expect(categories).toContain('typescript-interface');
      expect(categories).toContain('api-endpoint');
      expect(categories).toContain('database-query');
      expect(categories).toContain('utility-function');
      expect(categories).toContain('error-handling');
      expect(categories).toContain('authentication');
      expect(categories).toContain('testing-pattern');
      expect(categories).toContain('configuration');
      expect(categories).toContain('performance-optimization');

      expect(categories.length).toBe(10);
    });

    it('should start with empty vectors but initialized categories', () => {
      const stats = vectorStore.getStats();

      expect(stats.vectorCount).toBe(0);
      expect(stats.categoryCount).toBe(10);
      expect(stats.dimension).toBe(384);
      expect(stats.maxVectors).toBe(1000);
      expect(stats.utilizationPercent).toBe(0);
    });

    it('should emit events properly', () => {
      expect(vectorStore).toBeInstanceOf(require('events').EventEmitter);
    });
  });

  describe('Vector Addition and Storage', () => {
    it('should add vector with proper metadata', async () => {
      const testEmbedding = new Float32Array([0.1, 0.2, 0.3, 0.4]);
      const eventSpy = jest.fn();
      vectorStore.on('vector-added', eventSpy);

      await vectorStore.addVector('test-001', testEmbedding, 'react-component', 75);

      // Verify vector was added
      const retrieved = vectorStore.getVector('test-001');
      expect(retrieved).toBeDefined();
      expect(retrieved!.id).toBe('test-001');
      expect(retrieved!.metadata.category).toBe('react-component');
      expect(retrieved!.metadata.priority).toBe(75);
      expect(retrieved!.metadata.entryId).toBe('test-001');
      expect(retrieved!.metadata.lastAccessed).toBeInstanceOf(Date);

      // Verify embedding is properly copied
      expect(retrieved!.embedding).toEqual(testEmbedding);
      expect(retrieved!.embedding).not.toBe(testEmbedding); // Should be a copy

      // Verify event emission
      expect(eventSpy).toHaveBeenCalledWith({
        id: 'test-001',
        category: 'react-component',
        vectorCount: 1
      });

      // Verify category indexing
      const categoryVectors = vectorStore.getVectorsByCategory('react-component');
      expect(categoryVectors).toHaveLength(1);
      expect(categoryVectors[0].id).toBe('test-001');
    });

    it('should handle new categories dynamically', async () => {
      const testEmbedding = new Float32Array([0.1, 0.2, 0.3]);

      await vectorStore.addVector('test-new-cat', testEmbedding, 'custom-category', 60);

      const categories = vectorStore.getCategories();
      expect(categories).toContain('custom-category');

      const categoryVectors = vectorStore.getVectorsByCategory('custom-category');
      expect(categoryVectors).toHaveLength(1);
    });

    it('should evict least used vectors when at capacity', async () => {
      // Mock maxVectors to be small for testing
      (vectorStore as any).maxVectors = 5;

      // Add vectors until capacity
      for (let i = 0; i < 6; i++) {
        const embedding = new Float32Array([i * 0.1, i * 0.2, i * 0.3]);
        await vectorStore.addVector(`test-${i}`, embedding, 'test-category', 50);

        // Add small delay to ensure different lastAccessed times
        if (i < 5) {
          await new Promise(resolve => setTimeout(resolve, 1));
        }
      }

      const stats = vectorStore.getStats();
      expect(stats.vectorCount).toBeLessThanOrEqual(5); // Should have evicted oldest

      // First vector should be evicted
      expect(vectorStore.getVector('test-0')).toBeUndefined();

      // Last vector should still exist
      expect(vectorStore.getVector('test-5')).toBeDefined();

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Evicted')
      );
    });
  });

  describe('Cosine Similarity Mathematical Validation', () => {
    it('should calculate perfect similarity for identical vectors', async () => {
      const vector1 = new Float32Array([1.0, 0.0, 0.0]);
      const vector2 = new Float32Array([1.0, 0.0, 0.0]);

      await vectorStore.addVector('identical-1', vector1, 'test', 50);

      const results = await vectorStore.searchSimilar(vector2, { threshold: 0.0 });

      expect(results).toHaveLength(1);
      expect(results[0].similarity).toBeCloseTo(1.0, 5);
    });

    it('should calculate zero similarity for orthogonal vectors', async () => {
      const vector1 = new Float32Array([1.0, 0.0, 0.0]);
      const vector2 = new Float32Array([0.0, 1.0, 0.0]);

      await vectorStore.addVector('orthogonal-1', vector1, 'test', 50);

      const results = await vectorStore.searchSimilar(vector2, { threshold: 0.0 });

      if (results.length > 0) {
        expect(results[0].similarity).toBeCloseTo(0.0, 5);
      }
    });

    it('should handle negative correlations correctly', async () => {
      const vector1 = new Float32Array([1.0, 0.0, 0.0]);
      const vector2 = new Float32Array([-1.0, 0.0, 0.0]);

      await vectorStore.addVector('negative-1', vector1, 'test', 50);

      const results = await vectorStore.searchSimilar(vector2, { threshold: -1.0 });

      expect(results).toHaveLength(1);
      expect(results[0].similarity).toBeCloseTo(-1.0, 5);
    });

    it('should calculate similarity for normalized vectors correctly', async () => {
      // Create normalized vectors at 45-degree angle
      const vector1 = new Float32Array([1/Math.sqrt(2), 1/Math.sqrt(2), 0]);
      const vector2 = new Float32Array([1.0, 0.0, 0.0]);

      await vectorStore.addVector('normalized-1', vector1, 'test', 50);

      const results = await vectorStore.searchSimilar(vector2, { threshold: 0.0 });

      expect(results).toHaveLength(1);
      // Cosine of 45 degrees should be approximately 0.707
      expect(results[0].similarity).toBeCloseTo(1/Math.sqrt(2), 5);
    });

    it('should handle zero vectors gracefully', async () => {
      const zeroVector = new Float32Array([0.0, 0.0, 0.0]);
      const nonZeroVector = new Float32Array([1.0, 0.0, 0.0]);

      await vectorStore.addVector('zero-vector', zeroVector, 'test', 50);

      const results = await vectorStore.searchSimilar(nonZeroVector, { threshold: 0.0 });

      if (results.length > 0) {
        expect(results[0].similarity).toBe(0.0);
      }
    });

    it('should throw error for mismatched vector dimensions', async () => {
      const vector3d = new Float32Array([1.0, 0.0, 0.0]);
      const vector4d = new Float32Array([1.0, 0.0, 0.0, 0.0]);

      await vectorStore.addVector('3d-vector', vector3d, 'test', 50);

      await expect(
        vectorStore.searchSimilar(vector4d, { threshold: 0.0 })
      ).rejects.toThrow('Vector dimensions must match');
    });
  });

  describe('Advanced Search Functionality', () => {
    beforeEach(async () => {
      // Add test vectors with various categories and priorities
      const testVectors = [
        { id: 'react-1', category: 'react-component', priority: 80, embedding: [0.8, 0.6, 0.0] },
        { id: 'react-2', category: 'react-component', priority: 60, embedding: [0.7, 0.7, 0.1] },
        { id: 'api-1', category: 'api-endpoint', priority: 90, embedding: [0.6, 0.8, 0.0] },
        { id: 'api-2', category: 'api-endpoint', priority: 40, embedding: [0.5, 0.5, 0.7] },
        { id: 'low-priority', category: 'utility-function', priority: 20, embedding: [0.9, 0.4, 0.1] }
      ];

      for (const vector of testVectors) {
        await vectorStore.addVector(
          vector.id,
          new Float32Array(vector.embedding),
          vector.category,
          vector.priority
        );
      }
    });

    it('should filter by category correctly', async () => {
      const queryVector = new Float32Array([0.8, 0.6, 0.0]);

      const results = await vectorStore.searchSimilar(queryVector, {
        category: 'react-component',
        threshold: 0.0
      });

      expect(results).toHaveLength(2);
      expect(results.every(r => r.metadata.category === 'react-component')).toBe(true);
    });

    it('should filter by minimum priority', async () => {
      const queryVector = new Float32Array([0.8, 0.6, 0.0]);

      const results = await vectorStore.searchSimilar(queryVector, {
        minPriority: 50,
        threshold: 0.0
      });

      expect(results.every(r => r.metadata.priority >= 50)).toBe(true);
      expect(results.some(r => r.id === 'low-priority')).toBe(false);
    });

    it('should limit results correctly', async () => {
      const queryVector = new Float32Array([0.8, 0.6, 0.0]);

      const results = await vectorStore.searchSimilar(queryVector, {
        maxResults: 2,
        threshold: 0.0
      });

      expect(results).toHaveLength(2);
    });

    it('should apply similarity threshold', async () => {
      const queryVector = new Float32Array([1.0, 0.0, 0.0]);

      const results = await vectorStore.searchSimilar(queryVector, {
        threshold: 0.9
      });

      expect(results.every(r => r.similarity >= 0.9)).toBe(true);
    });

    it('should apply category boost correctly', async () => {
      const queryVector = new Float32Array([0.8, 0.6, 0.0]);

      const resultsWithBoost = await vectorStore.searchSimilar(queryVector, {
        threshold: 0.0,
        boost: { 'api-endpoint': 2.0 }
      });

      const resultsWithoutBoost = await vectorStore.searchSimilar(queryVector, {
        threshold: 0.0
      });

      // API endpoints should rank higher with boost
      const apiWithBoost = resultsWithBoost.find(r => r.metadata.category === 'api-endpoint');
      const apiWithoutBoost = resultsWithoutBoost.find(r => r.metadata.category === 'api-endpoint');

      if (apiWithBoost && apiWithoutBoost) {
        expect(apiWithBoost.similarity).toBeGreaterThan(apiWithoutBoost.similarity);
      }
    });

    it('should sort results by similarity score', async () => {
      const queryVector = new Float32Array([0.8, 0.6, 0.0]);

      const results = await vectorStore.searchSimilar(queryVector, {
        threshold: 0.0
      });

      for (let i = 1; i < results.length; i++) {
        expect(results[i - 1].similarity).toBeGreaterThanOrEqual(results[i].similarity);
      }
    });

    it('should update last accessed time on search', async () => {
      const queryVector = new Float32Array([0.8, 0.6, 0.0]);
      const beforeTime = new Date();

      await vectorStore.searchSimilar(queryVector, { threshold: 0.0 });

      const vector = vectorStore.getVector('react-1');
      expect(vector!.metadata.lastAccessed.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
    });
  });

  describe('Vector Management Operations', () => {
    beforeEach(async () => {
      await vectorStore.addVector('test-1', new Float32Array([1, 0, 0]), 'test-category', 50);
      await vectorStore.addVector('test-2', new Float32Array([0, 1, 0]), 'test-category', 75);
    });

    it('should retrieve vector by ID and update access time', () => {
      const beforeTime = new Date();
      const vector = vectorStore.getVector('test-1');

      expect(vector).toBeDefined();
      expect(vector!.id).toBe('test-1');
      expect(vector!.metadata.lastAccessed.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
    });

    it('should return undefined for non-existent vector', () => {
      const vector = vectorStore.getVector('non-existent');
      expect(vector).toBeUndefined();
    });

    it('should remove vector and emit event', () => {
      const eventSpy = jest.fn();
      vectorStore.on('vector-removed', eventSpy);

      const removed = vectorStore.removeVector('test-1');

      expect(removed).toBe(true);
      expect(vectorStore.getVector('test-1')).toBeUndefined();
      expect(eventSpy).toHaveBeenCalledWith({
        id: 'test-1',
        category: 'test-category'
      });

      // Should also remove from category index
      const categoryVectors = vectorStore.getVectorsByCategory('test-category');
      expect(categoryVectors.some(v => v.id === 'test-1')).toBe(false);
    });

    it('should return false when removing non-existent vector', () => {
      const removed = vectorStore.removeVector('non-existent');
      expect(removed).toBe(false);
    });

    it('should update vector priority', () => {
      const beforeTime = new Date();
      const updated = vectorStore.updatePriority('test-1', 95);

      expect(updated).toBe(true);

      const vector = vectorStore.getVector('test-1');
      expect(vector!.metadata.priority).toBe(95);
      expect(vector!.metadata.lastAccessed.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
    });

    it('should return false when updating priority of non-existent vector', () => {
      const updated = vectorStore.updatePriority('non-existent', 95);
      expect(updated).toBe(false);
    });

    it('should get vectors by category', () => {
      const categoryVectors = vectorStore.getVectorsByCategory('test-category');

      expect(categoryVectors).toHaveLength(2);
      expect(categoryVectors.map(v => v.id).sort()).toEqual(['test-1', 'test-2']);
    });

    it('should return empty array for non-existent category', () => {
      const categoryVectors = vectorStore.getVectorsByCategory('non-existent');
      expect(categoryVectors).toEqual([]);
    });
  });

  describe('Statistics and Analytics', () => {
    beforeEach(async () => {
      await vectorStore.addVector('stats-1', new Float32Array([1, 0, 0]), 'react-component', 50);
      await vectorStore.addVector('stats-2', new Float32Array([0, 1, 0]), 'api-endpoint', 75);
      await vectorStore.addVector('stats-3', new Float32Array([0, 0, 1]), 'react-component', 25);
    });

    it('should provide accurate statistics', () => {
      const stats = vectorStore.getStats();

      expect(stats.vectorCount).toBe(3);
      expect(stats.maxVectors).toBe(1000);
      expect(stats.categoryCount).toBe(10); // Initial categories
      expect(stats.dimension).toBe(384);
      expect(stats.utilizationPercent).toBe(0.3); // 3/1000 * 100
      expect(stats.memoryUsage).toMatch(/\d+\.\d+MB/);
    });

    it('should provide category statistics', () => {
      const categoryStats = vectorStore.getCategoryStats();

      expect(categoryStats['react-component']).toBe(2);
      expect(categoryStats['api-endpoint']).toBe(1);
      expect(categoryStats['utility-function']).toBe(0);
    });

    it('should list all categories', () => {
      const categories = vectorStore.getCategories();
      expect(categories).toContain('react-component');
      expect(categories).toContain('api-endpoint');
      expect(categories.length).toBeGreaterThanOrEqual(10);
    });
  });

  describe('Maintenance Operations', () => {
    beforeEach(async () => {
      await vectorStore.addVector('comp-1', new Float32Array([1, 0]), 'react-component', 50);
      await vectorStore.addVector('comp-2', new Float32Array([0, 1]), 'api-endpoint', 75);
    });

    it('should compact and clean up empty categories', async () => {
      // Remove all vectors from a category
      vectorStore.removeVector('comp-1');

      // Add a vector to a new category then remove it
      await vectorStore.addVector('temp', new Float32Array([1, 1]), 'temp-category', 50);
      vectorStore.removeVector('temp');

      await vectorStore.compact();

      // Category with no vectors should be removed
      const categories = vectorStore.getCategories();
      expect(categories).not.toContain('temp-category');

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Compaction complete')
      );
    });

    it('should clear all vectors', () => {
      vectorStore.clear();

      const stats = vectorStore.getStats();
      expect(stats.vectorCount).toBe(0);
      expect(stats.categoryCount).toBe(10); // Should reinitialize default categories

      const categories = vectorStore.getCategories();
      expect(categories).toHaveLength(10);

      expect(mockLogger.info).toHaveBeenCalledWith('Cleared all vectors from store');
    });
  });

  describe('Performance and Memory Management', () => {
    it('should handle large-scale vector operations efficiently', async () => {
      const startTime = Date.now();

      // Add many vectors
      const promises = [];
      for (let i = 0; i < 100; i++) {
        const embedding = new Float32Array([
          Math.random(),
          Math.random(),
          Math.random()
        ]);
        promises.push(
          vectorStore.addVector(`perf-${i}`, embedding, 'performance-test', 50)
        );
      }

      await Promise.all(promises);

      const addTime = Date.now() - startTime;
      expect(addTime).toBeLessThan(1000); // Should complete in under 1 second

      // Test search performance
      const searchStart = Date.now();
      const queryVector = new Float32Array([0.5, 0.5, 0.5]);

      const searchPromises = [];
      for (let i = 0; i < 20; i++) {
        searchPromises.push(
          vectorStore.searchSimilar(queryVector, { maxResults: 10, threshold: 0.0 })
        );
      }

      await Promise.all(searchPromises);

      const searchTime = Date.now() - searchStart;
      expect(searchTime).toBeLessThan(500); // 20 searches in under 500ms
    });

    it('should maintain memory bounds under load', async () => {
      // Mock a smaller capacity for testing
      (vectorStore as any).maxVectors = 10;

      // Add more vectors than capacity
      for (let i = 0; i < 15; i++) {
        const embedding = new Float32Array([i * 0.1, i * 0.05, i * 0.02]);
        await vectorStore.addVector(`memory-${i}`, embedding, 'memory-test', 50);
      }

      const stats = vectorStore.getStats();
      expect(stats.vectorCount).toBeLessThanOrEqual(10);
    });

    it('should handle concurrent operations safely', async () => {
      const concurrentOperations = [];

      // Concurrent additions
      for (let i = 0; i < 10; i++) {
        concurrentOperations.push(
          vectorStore.addVector(
            `concurrent-${i}`,
            new Float32Array([i * 0.1, i * 0.2, i * 0.3]),
            'concurrent-test',
            50
          )
        );
      }

      // Concurrent searches
      const queryVector = new Float32Array([0.5, 0.5, 0.5]);
      for (let i = 0; i < 5; i++) {
        concurrentOperations.push(
          vectorStore.searchSimilar(queryVector, { threshold: 0.0 })
        );
      }

      // Should complete without errors
      await expect(Promise.all(concurrentOperations)).resolves.toBeDefined();

      const stats = vectorStore.getStats();
      expect(stats.vectorCount).toBe(10);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty embeddings', async () => {
      const emptyEmbedding = new Float32Array([]);

      await expect(
        vectorStore.addVector('empty', emptyEmbedding, 'test', 50)
      ).resolves.not.toThrow();

      // Search with empty embedding should not crash
      await expect(
        vectorStore.searchSimilar(emptyEmbedding, { threshold: 0.0 })
      ).resolves.toBeDefined();
    });

    it('should handle very large embeddings', async () => {
      const largeEmbedding = new Float32Array(1000).fill(0.1);

      await expect(
        vectorStore.addVector('large', largeEmbedding, 'test', 50)
      ).resolves.not.toThrow();
    });

    it('should handle extreme similarity values gracefully', async () => {
      // Vector that could cause numerical instability
      const extremeVector = new Float32Array([1e10, 1e-10, 0]);

      await vectorStore.addVector('extreme', extremeVector, 'test', 50);

      const results = await vectorStore.searchSimilar(extremeVector, { threshold: 0.0 });
      expect(results[0].similarity).toBeCloseTo(1.0, 5);
    });

    it('should handle invalid search options gracefully', async () => {
      await vectorStore.addVector('test', new Float32Array([1, 0, 0]), 'test', 50);

      const queryVector = new Float32Array([1, 0, 0]);

      // Negative threshold
      const negativeResults = await vectorStore.searchSimilar(queryVector, {
        threshold: -2.0
      });
      expect(negativeResults).toBeDefined();

      // Zero max results
      const zeroResults = await vectorStore.searchSimilar(queryVector, {
        maxResults: 0
      });
      expect(zeroResults).toHaveLength(0);

      // Very high threshold
      const highThresholdResults = await vectorStore.searchSimilar(queryVector, {
        threshold: 2.0
      });
      expect(highThresholdResults).toHaveLength(0);
    });
  });
});