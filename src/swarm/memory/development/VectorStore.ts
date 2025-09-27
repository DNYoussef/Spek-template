/**
 * Vector Store for Development Princess
 * Optimized storage and retrieval of code embeddings
 */

import { EventEmitter } from 'events';
import { Logger } from '../../../utils/logger';
import { MemoryEntry, SearchResult } from './LangroidMemory';

export interface VectorIndex {
  id: string;
  embedding: Float32Array;
  metadata: IndexMetadata;
}

export interface IndexMetadata {
  entryId: string;
  category: string;
  priority: number;
  lastAccessed: Date;
}

export interface SearchOptions {
  category?: string;
  minPriority?: number;
  maxResults?: number;
  threshold?: number;
  boost?: Record<string, number>;
}

export class VectorStore extends EventEmitter {
  private logger: Logger;
  private vectors: Map<string, VectorIndex>;
  private categoryIndex: Map<string, Set<string>>;
  private dimension: number = 384;
  private maxVectors: number = 1000; // Limit to stay within 10MB

  constructor() {
    super();
    this.logger = new Logger('DevelopmentVectorStore');
    this.vectors = new Map();
    this.categoryIndex = new Map();
    this.initializeCategories();
  }

  /**
   * Initialize category mappings
   */
  private initializeCategories(): void {
    const categories = [
      'react-component',
      'typescript-interface',
      'api-endpoint',
      'database-query',
      'utility-function',
      'error-handling',
      'authentication',
      'testing-pattern',
      'configuration',
      'performance-optimization'
    ];

    categories.forEach(category => {
      this.categoryIndex.set(category, new Set());
    });
  }

  /**
   * Add vector to store
   */
  async addVector(
    id: string,
    embedding: Float32Array,
    category: string,
    priority: number = 50
  ): Promise<void> {
    // Check capacity
    if (this.vectors.size >= this.maxVectors) {
      await this.evictLeastUsed();
    }

    const vectorIndex: VectorIndex = {
      id,
      embedding: new Float32Array(embedding), // Copy to avoid mutations
      metadata: {
        entryId: id,
        category,
        priority,
        lastAccessed: new Date()
      }
    };

    this.vectors.set(id, vectorIndex);

    // Update category index
    if (!this.categoryIndex.has(category)) {
      this.categoryIndex.set(category, new Set());
    }
    this.categoryIndex.get(category)!.add(id);

    this.emit('vector-added', { id, category, vectorCount: this.vectors.size });
    this.logger.debug(`Added vector ${id} to category ${category}`);
  }

  /**
   * Search vectors by similarity
   */
  async searchSimilar(
    queryEmbedding: Float32Array,
    options: SearchOptions = {}
  ): Promise<{ id: string; similarity: number; metadata: IndexMetadata }[]> {
    const {
      category,
      minPriority = 0,
      maxResults = 10,
      threshold = 0.7,
      boost = {}
    } = options;

    const candidates = category
      ? Array.from(this.categoryIndex.get(category) || [])
      : Array.from(this.vectors.keys());

    const results: { id: string; similarity: number; metadata: IndexMetadata }[] = [];

    for (const id of candidates) {
      const vector = this.vectors.get(id);
      if (!vector || vector.metadata.priority < minPriority) {
        continue;
      }

      const similarity = this.cosineSimilarity(queryEmbedding, vector.embedding);
      
      if (similarity >= threshold) {
        let boostedSimilarity = similarity;
        
        // Apply category boost
        if (boost[vector.metadata.category]) {
          boostedSimilarity *= boost[vector.metadata.category];
        }

        results.push({
          id,
          similarity: boostedSimilarity,
          metadata: vector.metadata
        });

        // Update access time
        vector.metadata.lastAccessed = new Date();
      }
    }

    // Sort by similarity and limit results
    results.sort((a, b) => b.similarity - a.similarity);
    return results.slice(0, maxResults);
  }

  /**
   * Calculate cosine similarity
   */
  private cosineSimilarity(a: Float32Array, b: Float32Array): number {
    if (a.length !== b.length) {
      throw new Error('Vector dimensions must match');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Evict least recently used vectors
   */
  private async evictLeastUsed(): Promise<void> {
    const vectors = Array.from(this.vectors.entries())
      .sort((a, b) => a[1].metadata.lastAccessed.getTime() - b[1].metadata.lastAccessed.getTime());

    const toEvict = vectors.slice(0, Math.floor(this.maxVectors * 0.1)); // Evict 10%

    for (const [id, vector] of toEvict) {
      this.vectors.delete(id);
      
      // Remove from category index
      const categorySet = this.categoryIndex.get(vector.metadata.category);
      if (categorySet) {
        categorySet.delete(id);
      }
    }

    this.logger.info(`Evicted ${toEvict.length} least recently used vectors`);
  }

  /**
   * Get vector by ID
   */
  getVector(id: string): VectorIndex | undefined {
    const vector = this.vectors.get(id);
    if (vector) {
      vector.metadata.lastAccessed = new Date();
    }
    return vector;
  }

  /**
   * Remove vector by ID
   */
  removeVector(id: string): boolean {
    const vector = this.vectors.get(id);
    if (!vector) {
      return false;
    }

    this.vectors.delete(id);
    
    // Remove from category index
    const categorySet = this.categoryIndex.get(vector.metadata.category);
    if (categorySet) {
      categorySet.delete(id);
    }

    this.emit('vector-removed', { id, category: vector.metadata.category });
    return true;
  }

  /**
   * Update vector priority
   */
  updatePriority(id: string, priority: number): boolean {
    const vector = this.vectors.get(id);
    if (!vector) {
      return false;
    }

    vector.metadata.priority = priority;
    vector.metadata.lastAccessed = new Date();
    return true;
  }

  /**
   * Get vectors by category
   */
  getVectorsByCategory(category: string): VectorIndex[] {
    const ids = this.categoryIndex.get(category) || new Set();
    return Array.from(ids)
      .map(id => this.vectors.get(id)!)
      .filter(Boolean);
  }

  /**
   * Get all categories
   */
  getCategories(): string[] {
    return Array.from(this.categoryIndex.keys());
  }

  /**
   * Get category statistics
   */
  getCategoryStats(): Record<string, number> {
    const stats: Record<string, number> = {};
    
    this.categoryIndex.forEach((ids, category) => {
      stats[category] = ids.size;
    });

    return stats;
  }

  /**
   * Compact and reorganize vectors
   */
  async compact(): Promise<void> {
    // Remove empty categories
    const emptyCategories: string[] = [];
    this.categoryIndex.forEach((ids, category) => {
      if (ids.size === 0) {
        emptyCategories.push(category);
      }
    });

    emptyCategories.forEach(category => {
      this.categoryIndex.delete(category);
    });

    // Clean up orphaned vectors
    const validIds = new Set(
      Array.from(this.categoryIndex.values())
        .flatMap(idSet => Array.from(idSet))
    );

    const orphanedIds: string[] = [];
    this.vectors.forEach((_, id) => {
      if (!validIds.has(id)) {
        orphanedIds.push(id);
      }
    });

    orphanedIds.forEach(id => {
      this.vectors.delete(id);
    });

    this.logger.info(
      `Compaction complete: removed ${emptyCategories.length} empty categories, ` +
      `${orphanedIds.length} orphaned vectors`
    );
  }

  /**
   * Get store statistics
   */
  getStats(): any {
    const memoryUsage = this.vectors.size * (this.dimension * 4 + 200); // Rough estimate
    
    return {
      vectorCount: this.vectors.size,
      maxVectors: this.maxVectors,
      categoryCount: this.categoryIndex.size,
      dimension: this.dimension,
      memoryUsage: `${(memoryUsage / 1024 / 1024).toFixed(2)}MB`,
      utilizationPercent: (this.vectors.size / this.maxVectors) * 100
    };
  }

  /**
   * Clear all vectors
   */
  clear(): void {
    this.vectors.clear();
    this.categoryIndex.clear();
    this.initializeCategories();
    this.logger.info('Cleared all vectors from store');
  }
}

export default VectorStore;"