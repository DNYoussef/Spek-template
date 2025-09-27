import { EventEmitter } from 'events';
import { DocumentationPattern, PatternMetadata, StorageResult } from '../types/PatternTypes';
import { VectorEmbeddings } from '../storage/VectorEmbeddings';
import { SearchIndex } from '../storage/SearchIndex';
import { CacheManager } from '../storage/CacheManager';

/**
 * Efficient storage and retrieval system for documentation patterns.
 * Provides high-performance pattern management with caching and indexing.
 */
export class DocumentationStore extends EventEmitter {
  private vectorEmbeddings: VectorEmbeddings;
  private searchIndex: SearchIndex;
  private cache: CacheManager;
  private patterns: Map<string, DocumentationPattern>;
  private metadata: Map<string, PatternMetadata>;
  private storageMetrics: {
    totalPatterns: number;
    cacheHitRate: number;
    averageRetrievalTime: number;
    storageSize: number;
  };

  constructor() {
    super();
    this.vectorEmbeddings = new VectorEmbeddings();
    this.searchIndex = new SearchIndex();
    this.cache = new CacheManager({
      maxSize: 1000,
      ttl: 3600000 // 1 hour
    });
    this.patterns = new Map();
    this.metadata = new Map();
    this.storageMetrics = {
      totalPatterns: 0,
      cacheHitRate: 0,
      averageRetrievalTime: 0,
      storageSize: 0
    };
  }

  /**
   * Initialize storage system with indices and cache
   */
  async initialize(): Promise<void> {
    await this.vectorEmbeddings.initialize();
    await this.searchIndex.initialize();
    await this.loadExistingPatterns();
    this.emit('initialized');
  }

  /**
   * Store a documentation pattern with automatic indexing
   */
  async storePattern(pattern: DocumentationPattern): Promise<StorageResult> {
    const startTime = Date.now();
    
    try {
      // Validate pattern
      this.validatePattern(pattern);
      
      // Generate vector embeddings
      const embeddings = await this.vectorEmbeddings.generateEmbeddings(pattern.content);
      
      // Store in main collection
      this.patterns.set(pattern.id, pattern);
      
      // Update metadata
      const metadata: PatternMetadata = {
        ...pattern.metadata,
        storedAt: new Date(),
        lastAccessed: new Date(),
        accessCount: 0,
        storageSize: this.calculatePatternSize(pattern)
      };
      this.metadata.set(pattern.id, metadata);
      
      // Index for vector similarity search
      await this.vectorEmbeddings.store(pattern.id, embeddings, metadata);
      
      // Index for full-text search
      await this.searchIndex.addDocument({
        id: pattern.id,
        content: pattern.content,
        type: pattern.type,
        tags: pattern.metadata?.tags || [],
        title: pattern.metadata?.title || ''
      });
      
      // Update cache
      this.cache.set(pattern.id, pattern);
      
      // Update metrics
      this.updateStorageMetrics(Date.now() - startTime);
      
      this.emit('patternStored', { patternId: pattern.id, metadata });
      
      return {
        success: true,
        patternId: pattern.id,
        processingTime: Date.now() - startTime
      };
      
    } catch (error) {
      this.emit('error', { operation: 'storePattern', error, patternId: pattern.id });
      return {
        success: false,
        error: error.message,
        processingTime: Date.now() - startTime
      };
    }
  }

  /**
   * Retrieve a pattern by ID with caching
   */
  async getPattern(patternId: string): Promise<DocumentationPattern | null> {
    const startTime = Date.now();
    
    // Check cache first
    const cached = this.cache.get(patternId);
    if (cached) {
      this.updateCacheHitRate(true);
      this.updateAccessMetadata(patternId);
      return cached;
    }
    
    // Retrieve from storage
    const pattern = this.patterns.get(patternId);
    if (pattern) {
      // Update cache
      this.cache.set(patternId, pattern);
      this.updateAccessMetadata(patternId);
      this.updateCacheHitRate(false);
      
      const retrievalTime = Date.now() - startTime;
      this.updateRetrievalMetrics(retrievalTime);
      
      return pattern;
    }
    
    return null;
  }

  /**
   * Search patterns by content similarity
   */
  async searchSimilarPatterns(
    query: string,
    threshold: number = 0.7,
    limit: number = 10
  ): Promise<DocumentationPattern[]> {
    const startTime = Date.now();
    
    try {
      // Generate query embeddings
      const queryEmbeddings = await this.vectorEmbeddings.generateEmbeddings(query);
      
      // Find similar patterns
      const similar = await this.vectorEmbeddings.findSimilar(
        queryEmbeddings,
        threshold,
        limit
      );
      
      // Retrieve full patterns
      const patterns: DocumentationPattern[] = [];
      for (const item of similar) {
        const pattern = await this.getPattern(item.id);
        if (pattern) {
          patterns.push(pattern);
        }
      }
      
      const searchTime = Date.now() - startTime;
      this.emit('searchCompleted', { query, resultCount: patterns.length, searchTime });
      
      return patterns;
      
    } catch (error) {
      this.emit('error', { operation: 'searchSimilar', error, query });
      return [];
    }
  }

  /**
   * Full-text search across patterns
   */
  async searchPatterns(
    query: string,
    filters: {
      type?: string;
      tags?: string[];
      dateRange?: { start: Date; end: Date };
    } = {},
    limit: number = 20
  ): Promise<DocumentationPattern[]> {
    const startTime = Date.now();
    
    try {
      // Perform full-text search
      const searchResults = await this.searchIndex.search(query, {
        filters,
        limit
      });
      
      // Retrieve full patterns
      const patterns: DocumentationPattern[] = [];
      for (const result of searchResults) {
        const pattern = await this.getPattern(result.id);
        if (pattern) {
          patterns.push(pattern);
        }
      }
      
      const searchTime = Date.now() - startTime;
      this.emit('searchCompleted', { query, filters, resultCount: patterns.length, searchTime });
      
      return patterns;
      
    } catch (error) {
      this.emit('error', { operation: 'searchPatterns', error, query });
      return [];
    }
  }

  /**
   * Update an existing pattern
   */
  async updatePattern(
    patternId: string,
    updates: Partial<DocumentationPattern>
  ): Promise<StorageResult> {
    const startTime = Date.now();
    
    try {
      const existingPattern = this.patterns.get(patternId);
      if (!existingPattern) {
        throw new Error(`Pattern ${patternId} not found`);
      }
      
      // Merge updates
      const updatedPattern = { ...existingPattern, ...updates };
      
      // Validate updated pattern
      this.validatePattern(updatedPattern);
      
      // Update storage
      this.patterns.set(patternId, updatedPattern);
      
      // Update metadata
      const metadata = this.metadata.get(patternId);
      if (metadata) {
        metadata.lastModified = new Date();
        metadata.version = (metadata.version || 1) + 1;
        this.metadata.set(patternId, metadata);
      }
      
      // Update vector embeddings if content changed
      if (updates.content) {
        const embeddings = await this.vectorEmbeddings.generateEmbeddings(updates.content);
        await this.vectorEmbeddings.update(patternId, embeddings);
      }
      
      // Update search index
      await this.searchIndex.updateDocument({
        id: patternId,
        content: updatedPattern.content,
        type: updatedPattern.type,
        tags: updatedPattern.metadata?.tags || [],
        title: updatedPattern.metadata?.title || ''
      });
      
      // Update cache
      this.cache.set(patternId, updatedPattern);
      
      this.emit('patternUpdated', { patternId, updates });
      
      return {
        success: true,
        patternId,
        processingTime: Date.now() - startTime
      };
      
    } catch (error) {
      this.emit('error', { operation: 'updatePattern', error, patternId });
      return {
        success: false,
        error: error.message,
        processingTime: Date.now() - startTime
      };
    }
  }

  /**
   * Delete a pattern and clean up indices
   */
  async deletePattern(patternId: string): Promise<StorageResult> {
    const startTime = Date.now();
    
    try {
      // Check if pattern exists
      if (!this.patterns.has(patternId)) {
        throw new Error(`Pattern ${patternId} not found`);
      }
      
      // Remove from storage
      this.patterns.delete(patternId);
      this.metadata.delete(patternId);
      
      // Remove from indices
      await this.vectorEmbeddings.delete(patternId);
      await this.searchIndex.removeDocument(patternId);
      
      // Remove from cache
      this.cache.delete(patternId);
      
      // Update metrics
      this.storageMetrics.totalPatterns--;
      
      this.emit('patternDeleted', { patternId });
      
      return {
        success: true,
        patternId,
        processingTime: Date.now() - startTime
      };
      
    } catch (error) {
      this.emit('error', { operation: 'deletePattern', error, patternId });
      return {
        success: false,
        error: error.message,
        processingTime: Date.now() - startTime
      };
    }
  }

  /**
   * Get patterns by type
   */
  async getPatternsByType(type: string): Promise<DocumentationPattern[]> {
    const patterns: DocumentationPattern[] = [];
    
    for (const [id, pattern] of this.patterns) {
      if (pattern.type === type) {
        patterns.push(pattern);
      }
    }
    
    return patterns;
  }

  /**
   * Get patterns by tags
   */
  async getPatternsByTags(tags: string[]): Promise<DocumentationPattern[]> {
    const patterns: DocumentationPattern[] = [];
    
    for (const [id, pattern] of this.patterns) {
      const patternTags = pattern.metadata?.tags || [];
      if (tags.some(tag => patternTags.includes(tag))) {
        patterns.push(pattern);
      }
    }
    
    return patterns;
  }

  /**
   * Get storage analytics
   */
  getStorageAnalytics(): {
    totalPatterns: number;
    patternsByType: Map<string, number>;
    cacheHitRate: number;
    averageRetrievalTime: number;
    storageSize: number;
    topAccessedPatterns: Array<{ id: string; accessCount: number }>;
  } {
    const patternsByType = new Map<string, number>();
    const accessCounts: Array<{ id: string; accessCount: number }> = [];
    
    for (const [id, pattern] of this.patterns) {
      // Count by type
      const count = patternsByType.get(pattern.type) || 0;
      patternsByType.set(pattern.type, count + 1);
      
      // Collect access counts
      const metadata = this.metadata.get(id);
      if (metadata) {
        accessCounts.push({ id, accessCount: metadata.accessCount || 0 });
      }
    }
    
    // Sort by access count
    const topAccessedPatterns = accessCounts
      .sort((a, b) => b.accessCount - a.accessCount)
      .slice(0, 10);
    
    return {
      ...this.storageMetrics,
      patternsByType,
      topAccessedPatterns
    };
  }

  /**
   * Optimize storage performance
   */
  async optimizeStorage(): Promise<void> {
    // Clean up unused cache entries
    this.cache.cleanup();
    
    // Optimize vector embeddings
    await this.vectorEmbeddings.optimize();
    
    // Rebuild search index if needed
    await this.searchIndex.optimize();
    
    // Update storage metrics
    this.updateStorageSize();
    
    this.emit('storageOptimized');
  }

  /**
   * Export patterns for backup
   */
  async exportPatterns(): Promise<{
    patterns: DocumentationPattern[];
    metadata: PatternMetadata[];
    exportedAt: Date;
  }> {
    const patterns = Array.from(this.patterns.values());
    const metadata = Array.from(this.metadata.values());
    
    return {
      patterns,
      metadata,
      exportedAt: new Date()
    };
  }

  /**
   * Import patterns from backup
   */
  async importPatterns(data: {
    patterns: DocumentationPattern[];
    metadata: PatternMetadata[];
  }): Promise<StorageResult> {
    const startTime = Date.now();
    
    try {
      let importedCount = 0;
      
      for (const pattern of data.patterns) {
        const result = await this.storePattern(pattern);
        if (result.success) {
          importedCount++;
        }
      }
      
      this.emit('patternsImported', { importedCount, totalCount: data.patterns.length });
      
      return {
        success: true,
        processingTime: Date.now() - startTime,
        importedCount
      };
      
    } catch (error) {
      this.emit('error', { operation: 'importPatterns', error });
      return {
        success: false,
        error: error.message,
        processingTime: Date.now() - startTime
      };
    }
  }

  private validatePattern(pattern: DocumentationPattern): void {
    if (!pattern.id) {
      throw new Error('Pattern ID is required');
    }
    if (!pattern.type) {
      throw new Error('Pattern type is required');
    }
    if (!pattern.content) {
      throw new Error('Pattern content is required');
    }
  }

  private calculatePatternSize(pattern: DocumentationPattern): number {
    return JSON.stringify(pattern).length;
  }

  private updateStorageMetrics(processingTime: number): void {
    this.storageMetrics.totalPatterns = this.patterns.size;
    // Update other metrics as needed
  }

  private updateCacheHitRate(hit: boolean): void {
    // Implement cache hit rate calculation
    // This is a simplified version
  }

  private updateRetrievalMetrics(retrievalTime: number): void {
    // Update average retrieval time
    const current = this.storageMetrics.averageRetrievalTime;
    this.storageMetrics.averageRetrievalTime = (current + retrievalTime) / 2;
  }

  private updateAccessMetadata(patternId: string): void {
    const metadata = this.metadata.get(patternId);
    if (metadata) {
      metadata.lastAccessed = new Date();
      metadata.accessCount = (metadata.accessCount || 0) + 1;
      this.metadata.set(patternId, metadata);
    }
  }

  private updateStorageSize(): void {
    let totalSize = 0;
    for (const pattern of this.patterns.values()) {
      totalSize += this.calculatePatternSize(pattern);
    }
    this.storageMetrics.storageSize = totalSize;
  }

  private async loadExistingPatterns(): Promise<void> {
    // Load patterns from persistent storage
    // This would be implemented based on the storage backend
    this.emit('patternsLoaded');
  }
}

export default DocumentationStore;