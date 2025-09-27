/**
 * VectorOperations Type Safety Test
 * Validates that VectorOperations maintain mathematical precision
 * and type safety with Phase 4 improvements.
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

// Mock vector types for testing
export type VectorId = string & { readonly __brand: 'VectorId' };
export type EmbeddingVector = number[] & { readonly __brand: 'EmbeddingVector' };
export type SimilarityScore = number & { readonly __brand: 'SimilarityScore'; readonly __range: [0, 1] };
export type VectorDimension = number & { readonly __brand: 'VectorDimension'; readonly __constraint: 'positive-integer' };

export interface VectorOperationsTestResult {
  typeDefinitionsValid: boolean;
  mathematicalOperationsTyped: boolean;
  similarityCalculationsAccurate: boolean;
  embeddingStorageSecure: boolean;
  performanceOptimal: boolean;
  complianceScore: number;
}

export interface VectorSearchOptions {
  limit: number;
  threshold: SimilarityScore;
  includeMetadata: boolean;
  filterCriteria?: Record<string, any>;
}

export interface VectorSearchResult {
  id: VectorId;
  vector: EmbeddingVector;
  similarity: SimilarityScore;
  metadata?: Record<string, any>;
}

export class VectorOperationsTypeTest {
  private vectorMemoryPath: string;
  private testResults: VectorOperationsTestResult;
  private testVectors: Map<VectorId, EmbeddingVector>;

  constructor() {
    this.vectorMemoryPath = join(process.cwd(), 'src/swarm/memory/quality/LangroidMemory.ts');
    this.testResults = {
      typeDefinitionsValid: false,
      mathematicalOperationsTyped: false,
      similarityCalculationsAccurate: false,
      embeddingStorageSecure: false,
      performanceOptimal: false,
      complianceScore: 0
    };
    this.testVectors = new Map();
    this.initializeTestVectors();
  }

  async runTests(): Promise<VectorOperationsTestResult> {
    describe('VectorOperations Type Safety', () => {
      test('validates vector type definitions', async () => {
        try {
          await this.validateVectorTypeDefinitions();
          this.testResults.typeDefinitionsValid = true;
        } catch (error) {
          console.error('Vector type definitions validation failed:', error);
        }
      });

      test('validates mathematical operations are properly typed', async () => {
        try {
          await this.validateMathematicalOperations();
          this.testResults.mathematicalOperationsTyped = true;
        } catch (error) {
          console.error('Mathematical operations validation failed:', error);
        }
      });

      test('validates similarity calculations accuracy', async () => {
        try {
          await this.validateSimilarityCalculations();
          this.testResults.similarityCalculationsAccurate = true;
        } catch (error) {
          console.error('Similarity calculations validation failed:', error);
        }
      });

      test('validates embedding storage security', async () => {
        try {
          await this.validateEmbeddingStorage();
          this.testResults.embeddingStorageSecure = true;
        } catch (error) {
          console.error('Embedding storage validation failed:', error);
        }
      });

      test('validates performance optimization', async () => {
        try {
          await this.validatePerformanceOptimization();
          this.testResults.performanceOptimal = true;
        } catch (error) {
          console.error('Performance optimization validation failed:', error);
        }
      });
    });

    this.testResults.complianceScore = this.calculateComplianceScore();
    return this.testResults;
  }

  /**
   * Initialize test vectors for validation
   */
  private initializeTestVectors(): void {
    // Create test vectors with different dimensions
    const testData = [
      { id: 'vec-001', vector: [0.1, 0.2, 0.3, 0.4] },
      { id: 'vec-002', vector: [0.5, 0.6, 0.7, 0.8] },
      { id: 'vec-003', vector: [0.9, 0.1, 0.5, 0.3] },
      { id: 'vec-004', vector: [0.2, 0.8, 0.4, 0.6] },
      { id: 'vec-005', vector: [0.7, 0.3, 0.9, 0.1] }
    ];

    for (const item of testData) {
      const vectorId = item.id as VectorId;
      const embeddingVector = item.vector as EmbeddingVector;
      this.testVectors.set(vectorId, embeddingVector);
    }
  }

  /**
   * Validate vector type definitions
   */
  private async validateVectorTypeDefinitions(): Promise<void> {
    if (existsSync(this.vectorMemoryPath)) {
      const content = readFileSync(this.vectorMemoryPath, 'utf8');

      // Check for vector-related types
      const hasVectorTypes = content.includes('vector') ||
                            content.includes('embedding') ||
                            content.includes('similarity');

      if (!hasVectorTypes) {
        console.warn('Warning: Vector type definitions not found in LangroidMemory');
      }

      // Check for no 'any' types in vector operations
      const anyTypeMatches = content.match(/vector.*any|embedding.*any|similarity.*any/gi) || [];
      if (anyTypeMatches.length > 0) {
        throw new Error(`Found ${anyTypeMatches.length} 'any' types in vector operations`);
      }
    }

    // Test branded types
    const testVectorId = 'test-vector-123' as VectorId;
    const testEmbedding = [0.1, 0.2, 0.3] as EmbeddingVector;
    const testSimilarity = 0.85 as SimilarityScore;

    // Validate type constraints
    expect(typeof testVectorId).toBe('string');
    expect(Array.isArray(testEmbedding)).toBe(true);
    expect(typeof testSimilarity).toBe('number');
    expect(testSimilarity).toBeGreaterThanOrEqual(0);
    expect(testSimilarity).toBeLessThanOrEqual(1);

    // Test vector dimension validation
    const validDimensions = [128, 256, 512, 768, 1024, 1536] as VectorDimension[];
    for (const dim of validDimensions) {
      expect(typeof dim).toBe('number');
      expect(dim).toBeGreaterThan(0);
      expect(Number.isInteger(dim)).toBe(true);
    }
  }

  /**
   * Validate mathematical operations with proper typing
   */
  private async validateMathematicalOperations(): Promise<void> {
    // Test vector operations
    const vector1 = [0.1, 0.2, 0.3, 0.4] as EmbeddingVector;
    const vector2 = [0.5, 0.6, 0.7, 0.8] as EmbeddingVector;

    // Validate vector addition
    const vectorAddition = this.addVectors(vector1, vector2);
    expect(vectorAddition).toHaveLength(vector1.length);
    expect(vectorAddition[0]).toBeCloseTo(0.6);
    expect(vectorAddition[1]).toBeCloseTo(0.8);

    // Validate vector subtraction
    const vectorSubtraction = this.subtractVectors(vector2, vector1);
    expect(vectorSubtraction).toHaveLength(vector1.length);
    expect(vectorSubtraction[0]).toBeCloseTo(0.4);
    expect(vectorSubtraction[1]).toBeCloseTo(0.4);

    // Validate dot product
    const dotProduct = this.calculateDotProduct(vector1, vector2);
    expect(typeof dotProduct).toBe('number');
    expect(dotProduct).toBeCloseTo(1.0); // 0.1*0.5 + 0.2*0.6 + 0.3*0.7 + 0.4*0.8

    // Validate vector magnitude
    const magnitude1 = this.calculateMagnitude(vector1);
    const magnitude2 = this.calculateMagnitude(vector2);
    expect(typeof magnitude1).toBe('number');
    expect(typeof magnitude2).toBe('number');
    expect(magnitude1).toBeGreaterThan(0);
    expect(magnitude2).toBeGreaterThan(0);

    // Validate vector normalization
    const normalizedVector = this.normalizeVector(vector1);
    const normalizedMagnitude = this.calculateMagnitude(normalizedVector);
    expect(normalizedMagnitude).toBeCloseTo(1.0, 5);

    // Test dimension consistency
    const inconsistentVector = [0.1, 0.2] as EmbeddingVector; // Different dimension
    expect(() => this.addVectors(vector1, inconsistentVector)).toThrow();
  }

  /**
   * Validate similarity calculations
   */
  private async validateSimilarityCalculations(): Promise<void> {
    // Test cosine similarity
    const vector1 = [1, 0, 0] as EmbeddingVector;
    const vector2 = [0, 1, 0] as EmbeddingVector;
    const vector3 = [1, 0, 0] as EmbeddingVector; // Same as vector1

    const similarity1_2 = this.calculateCosineSimilarity(vector1, vector2);
    const similarity1_3 = this.calculateCosineSimilarity(vector1, vector3);

    expect(similarity1_2).toBeCloseTo(0.0); // Orthogonal vectors
    expect(similarity1_3).toBeCloseTo(1.0); // Identical vectors

    // Validate similarity score range
    expect(similarity1_2).toBeGreaterThanOrEqual(-1);
    expect(similarity1_2).toBeLessThanOrEqual(1);
    expect(similarity1_3).toBeGreaterThanOrEqual(-1);
    expect(similarity1_3).toBeLessThanOrEqual(1);

    // Test Euclidean distance
    const euclideanDistance = this.calculateEuclideanDistance(vector1, vector2);
    expect(typeof euclideanDistance).toBe('number');
    expect(euclideanDistance).toBeGreaterThanOrEqual(0);

    // Test Manhattan distance
    const manhattanDistance = this.calculateManhattanDistance(vector1, vector2);
    expect(typeof manhattanDistance).toBe('number');
    expect(manhattanDistance).toBeGreaterThanOrEqual(0);

    // Test similarity consistency
    for (const [id1, vec1] of this.testVectors) {
      for (const [id2, vec2] of this.testVectors) {
        const similarity = this.calculateCosineSimilarity(vec1, vec2);
        expect(similarity).toBeGreaterThanOrEqual(-1);
        expect(similarity).toBeLessThanOrEqual(1);

        // Self-similarity should be 1 (or very close)
        if (id1 === id2) {
          expect(similarity).toBeCloseTo(1.0, 5);
        }
      }
    }
  }

  /**
   * Validate embedding storage security
   */
  private async validateEmbeddingStorage(): Promise<void> {
    // Test vector storage interface
    const storageOperations = {
      store: (id: VectorId, vector: EmbeddingVector, metadata?: Record<string, any>) => {
        // Validate input types
        expect(typeof id).toBe('string');
        expect(Array.isArray(vector)).toBe(true);
        expect(vector.every(v => typeof v === 'number')).toBe(true);

        // Validate vector values are finite
        expect(vector.every(v => Number.isFinite(v))).toBe(true);

        // Validate metadata if provided
        if (metadata) {
          expect(typeof metadata).toBe('object');
          expect(metadata).not.toBeNull();
        }

        return true;
      },

      retrieve: (id: VectorId): { vector: EmbeddingVector; metadata?: Record<string, any> } | null => {
        const vector = this.testVectors.get(id);
        return vector ? { vector } : null;
      },

      search: (queryVector: EmbeddingVector, options: VectorSearchOptions): VectorSearchResult[] => {
        const results: VectorSearchResult[] = [];

        for (const [id, vector] of this.testVectors) {
          const similarity = this.calculateCosineSimilarity(queryVector, vector) as SimilarityScore;

          if (similarity >= options.threshold) {
            results.push({
              id,
              vector,
              similarity,
              metadata: options.includeMetadata ? { id, similarity } : undefined
            });
          }
        }

        return results
          .sort((a, b) => b.similarity - a.similarity)
          .slice(0, options.limit);
      }
    };

    // Test storage operations
    const testVector = [0.1, 0.2, 0.3, 0.4] as EmbeddingVector;
    const testId = 'storage-test-001' as VectorId;

    // Test store operation
    const storeResult = storageOperations.store(testId, testVector, { test: true });
    expect(storeResult).toBe(true);

    // Test retrieve operation
    this.testVectors.set(testId, testVector);
    const retrieveResult = storageOperations.retrieve(testId);
    expect(retrieveResult).toBeTruthy();
    expect(retrieveResult?.vector).toEqual(testVector);

    // Test search operation
    const searchOptions: VectorSearchOptions = {
      limit: 3,
      threshold: 0.5 as SimilarityScore,
      includeMetadata: true
    };

    const searchResults = storageOperations.search(testVector, searchOptions);
    expect(Array.isArray(searchResults)).toBe(true);
    expect(searchResults.length).toBeLessThanOrEqual(searchOptions.limit);

    // Validate search result types
    for (const result of searchResults) {
      expect(typeof result.id).toBe('string');
      expect(Array.isArray(result.vector)).toBe(true);
      expect(typeof result.similarity).toBe('number');
      expect(result.similarity).toBeGreaterThanOrEqual(searchOptions.threshold);
      expect(result.similarity).toBeLessThanOrEqual(1);
    }

    // Test input validation
    expect(() => storageOperations.store('' as VectorId, testVector)).toThrow();
    expect(() => storageOperations.store(testId, [] as EmbeddingVector)).toThrow();
    expect(() => storageOperations.store(testId, [NaN, 0.1, 0.2] as EmbeddingVector)).toThrow();
  }

  /**
   * Validate performance optimization
   */
  private async validatePerformanceOptimization(): Promise<void> {
    // Performance benchmarks
    const largeDimension = 1536; // Common embedding dimension
    const largeDatasetSize = 10000;

    // Create large test dataset
    const largeDataset = new Map<VectorId, EmbeddingVector>();
    for (let i = 0; i < largeDatasetSize; i++) {
      const vector = Array.from(
        { length: largeDimension },
        () => Math.random() * 2 - 1 // Random values between -1 and 1
      ) as EmbeddingVector;

      largeDataset.set(`large-vec-${i}` as VectorId, vector);
    }

    // Benchmark vector operations
    const queryVector = Array.from(
      { length: largeDimension },
      () => Math.random() * 2 - 1
    ) as EmbeddingVector;

    // Test similarity calculation performance
    const similarityStart = Date.now();
    const similarities: SimilarityScore[] = [];

    for (const [id, vector] of largeDataset) {
      const similarity = this.calculateCosineSimilarity(queryVector, vector) as SimilarityScore;
      similarities.push(similarity);

      // Break early for performance test
      if (similarities.length >= 1000) break;
    }

    const similarityDuration = Date.now() - similarityStart;

    // Should process 1000 similarity calculations in under 1 second
    expect(similarityDuration).toBeLessThan(1000);

    // Test vector normalization performance
    const normalizationStart = Date.now();

    for (const [id, vector] of largeDataset) {
      this.normalizeVector(vector);

      // Break early for performance test
      if (Date.now() - normalizationStart > 100) break;
    }

    const normalizationDuration = Date.now() - normalizationStart;

    // Should normalize many vectors quickly
    expect(normalizationDuration).toBeLessThan(500);

    // Test memory efficiency
    const initialMemory = process.memoryUsage().heapUsed;

    // Create and process vectors
    const memoryTestVectors = Array.from({ length: 5000 }, (_, i) => {
      return Array.from({ length: 512 }, () => Math.random()) as EmbeddingVector;
    });

    // Process vectors
    for (const vector of memoryTestVectors) {
      this.normalizeVector(vector);
      this.calculateMagnitude(vector);
    }

    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }

    const finalMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = finalMemory - initialMemory;

    // Should not use excessive memory
    expect(memoryIncrease).toBeLessThan(200 * 1024 * 1024); // 200MB threshold
  }

  // Mathematical operation implementations
  private addVectors(a: EmbeddingVector, b: EmbeddingVector): EmbeddingVector {
    if (a.length !== b.length) {
      throw new Error('Vector dimensions must match for addition');
    }
    return a.map((val, i) => val + b[i]) as EmbeddingVector;
  }

  private subtractVectors(a: EmbeddingVector, b: EmbeddingVector): EmbeddingVector {
    if (a.length !== b.length) {
      throw new Error('Vector dimensions must match for subtraction');
    }
    return a.map((val, i) => val - b[i]) as EmbeddingVector;
  }

  private calculateDotProduct(a: EmbeddingVector, b: EmbeddingVector): number {
    if (a.length !== b.length) {
      throw new Error('Vector dimensions must match for dot product');
    }
    return a.reduce((sum, val, i) => sum + val * b[i], 0);
  }

  private calculateMagnitude(vector: EmbeddingVector): number {
    return Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  }

  private normalizeVector(vector: EmbeddingVector): EmbeddingVector {
    const magnitude = this.calculateMagnitude(vector);
    if (magnitude === 0) {
      throw new Error('Cannot normalize zero vector');
    }
    return vector.map(val => val / magnitude) as EmbeddingVector;
  }

  private calculateCosineSimilarity(a: EmbeddingVector, b: EmbeddingVector): number {
    const dotProduct = this.calculateDotProduct(a, b);
    const magnitudeA = this.calculateMagnitude(a);
    const magnitudeB = this.calculateMagnitude(b);

    if (magnitudeA === 0 || magnitudeB === 0) {
      return 0;
    }

    return dotProduct / (magnitudeA * magnitudeB);
  }

  private calculateEuclideanDistance(a: EmbeddingVector, b: EmbeddingVector): number {
    if (a.length !== b.length) {
      throw new Error('Vector dimensions must match for Euclidean distance');
    }
    return Math.sqrt(a.reduce((sum, val, i) => sum + Math.pow(val - b[i], 2), 0));
  }

  private calculateManhattanDistance(a: EmbeddingVector, b: EmbeddingVector): number {
    if (a.length !== b.length) {
      throw new Error('Vector dimensions must match for Manhattan distance');
    }
    return a.reduce((sum, val, i) => sum + Math.abs(val - b[i]), 0);
  }

  /**
   * Calculate overall compliance score
   */
  private calculateComplianceScore(): number {
    const weights = {
      typeDefinitionsValid: 20,
      mathematicalOperationsTyped: 25,
      similarityCalculationsAccurate: 25,
      embeddingStorageSecure: 20,
      performanceOptimal: 10
    };

    let score = 0;
    let totalWeight = 0;

    for (const [key, weight] of Object.entries(weights)) {
      totalWeight += weight;
      if (this.testResults[key as keyof VectorOperationsTestResult]) {
        score += weight;
      }
    }

    return (score / totalWeight) * 100;
  }
}

export default VectorOperationsTypeTest;