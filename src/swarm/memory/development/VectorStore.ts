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
    this.logger.debug(`Added vector ${id} to category ${category}`);\n  }\n\n  /**\n   * Search vectors by similarity\n   */\n  async searchSimilar(\n    queryEmbedding: Float32Array,\n    options: SearchOptions = {}\n  ): Promise<{ id: string; similarity: number; metadata: IndexMetadata }[]> {\n    const {\n      category,\n      minPriority = 0,\n      maxResults = 10,\n      threshold = 0.7,\n      boost = {}\n    } = options;\n\n    const candidates = category\n      ? Array.from(this.categoryIndex.get(category) || [])\n      : Array.from(this.vectors.keys());\n\n    const results: { id: string; similarity: number; metadata: IndexMetadata }[] = [];\n\n    for (const id of candidates) {\n      const vector = this.vectors.get(id);\n      if (!vector || vector.metadata.priority < minPriority) {\n        continue;\n      }\n\n      const similarity = this.cosineSimilarity(queryEmbedding, vector.embedding);\n      \n      if (similarity >= threshold) {\n        let boostedSimilarity = similarity;\n        \n        // Apply category boost\n        if (boost[vector.metadata.category]) {\n          boostedSimilarity *= boost[vector.metadata.category];\n        }\n\n        results.push({\n          id,\n          similarity: boostedSimilarity,\n          metadata: vector.metadata\n        });\n\n        // Update access time\n        vector.metadata.lastAccessed = new Date();\n      }\n    }\n\n    // Sort by similarity and limit results\n    results.sort((a, b) => b.similarity - a.similarity);\n    return results.slice(0, maxResults);\n  }\n\n  /**\n   * Calculate cosine similarity\n   */\n  private cosineSimilarity(a: Float32Array, b: Float32Array): number {\n    if (a.length !== b.length) {\n      throw new Error('Vector dimensions must match');\n    }\n\n    let dotProduct = 0;\n    let normA = 0;\n    let normB = 0;\n\n    for (let i = 0; i < a.length; i++) {\n      dotProduct += a[i] * b[i];\n      normA += a[i] * a[i];\n      normB += b[i] * b[i];\n    }\n\n    if (normA === 0 || normB === 0) {\n      return 0;\n    }\n\n    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));\n  }\n\n  /**\n   * Evict least recently used vectors\n   */\n  private async evictLeastUsed(): Promise<void> {\n    const vectors = Array.from(this.vectors.entries())\n      .sort((a, b) => a[1].metadata.lastAccessed.getTime() - b[1].metadata.lastAccessed.getTime());\n\n    const toEvict = vectors.slice(0, Math.floor(this.maxVectors * 0.1)); // Evict 10%\n\n    for (const [id, vector] of toEvict) {\n      this.vectors.delete(id);\n      \n      // Remove from category index\n      const categorySet = this.categoryIndex.get(vector.metadata.category);\n      if (categorySet) {\n        categorySet.delete(id);\n      }\n    }\n\n    this.logger.info(`Evicted ${toEvict.length} least recently used vectors`);\n  }\n\n  /**\n   * Get vector by ID\n   */\n  getVector(id: string): VectorIndex | undefined {\n    const vector = this.vectors.get(id);\n    if (vector) {\n      vector.metadata.lastAccessed = new Date();\n    }\n    return vector;\n  }\n\n  /**\n   * Remove vector by ID\n   */\n  removeVector(id: string): boolean {\n    const vector = this.vectors.get(id);\n    if (!vector) {\n      return false;\n    }\n\n    this.vectors.delete(id);\n    \n    // Remove from category index\n    const categorySet = this.categoryIndex.get(vector.metadata.category);\n    if (categorySet) {\n      categorySet.delete(id);\n    }\n\n    this.emit('vector-removed', { id, category: vector.metadata.category });\n    return true;\n  }\n\n  /**\n   * Update vector priority\n   */\n  updatePriority(id: string, priority: number): boolean {\n    const vector = this.vectors.get(id);\n    if (!vector) {\n      return false;\n    }\n\n    vector.metadata.priority = priority;\n    vector.metadata.lastAccessed = new Date();\n    return true;\n  }\n\n  /**\n   * Get vectors by category\n   */\n  getVectorsByCategory(category: string): VectorIndex[] {\n    const ids = this.categoryIndex.get(category) || new Set();\n    return Array.from(ids)\n      .map(id => this.vectors.get(id)!)\n      .filter(Boolean);\n  }\n\n  /**\n   * Get all categories\n   */\n  getCategories(): string[] {\n    return Array.from(this.categoryIndex.keys());\n  }\n\n  /**\n   * Get category statistics\n   */\n  getCategoryStats(): Record<string, number> {\n    const stats: Record<string, number> = {};\n    \n    this.categoryIndex.forEach((ids, category) => {\n      stats[category] = ids.size;\n    });\n\n    return stats;\n  }\n\n  /**\n   * Compact and reorganize vectors\n   */\n  async compact(): Promise<void> {\n    // Remove empty categories\n    const emptyCategories: string[] = [];\n    this.categoryIndex.forEach((ids, category) => {\n      if (ids.size === 0) {\n        emptyCategories.push(category);\n      }\n    });\n\n    emptyCategories.forEach(category => {\n      this.categoryIndex.delete(category);\n    });\n\n    // Clean up orphaned vectors\n    const validIds = new Set(\n      Array.from(this.categoryIndex.values())\n        .flatMap(idSet => Array.from(idSet))\n    );\n\n    const orphanedIds: string[] = [];\n    this.vectors.forEach((_, id) => {\n      if (!validIds.has(id)) {\n        orphanedIds.push(id);\n      }\n    });\n\n    orphanedIds.forEach(id => {\n      this.vectors.delete(id);\n    });\n\n    this.logger.info(\n      `Compaction complete: removed ${emptyCategories.length} empty categories, ` +\n      `${orphanedIds.length} orphaned vectors`\n    );\n  }\n\n  /**\n   * Get store statistics\n   */\n  getStats(): any {\n    const memoryUsage = this.vectors.size * (this.dimension * 4 + 200); // Rough estimate\n    \n    return {\n      vectorCount: this.vectors.size,\n      maxVectors: this.maxVectors,\n      categoryCount: this.categoryIndex.size,\n      dimension: this.dimension,\n      memoryUsage: `${(memoryUsage / 1024 / 1024).toFixed(2)}MB`,\n      utilizationPercent: (this.vectors.size / this.maxVectors) * 100\n    };\n  }\n\n  /**\n   * Clear all vectors\n   */\n  clear(): void {\n    this.vectors.clear();\n    this.categoryIndex.clear();\n    this.initializeCategories();\n    this.logger.info('Cleared all vectors from store');\n  }\n}\n\nexport default VectorStore;"