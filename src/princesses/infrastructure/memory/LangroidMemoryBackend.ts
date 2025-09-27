import { EventEmitter } from 'events';
import { MemoryMetrics } from './MemoryMetrics';
import { TTLManager } from './TTLManager';
import { MemoryPersistence } from './MemoryPersistence';

/**
 * Langroid Memory Backend for Infrastructure Princess
 * Provides 10MB memory capacity with efficient storage, retrieval,
 * and automatic TTL-based cleanup for infrastructure operations.
 */
export interface MemoryEntry {
  id: string;
  content: any;
  size: number;
  timestamp: number;
  ttl?: number;
  priority: MemoryPriority;
  tags: string[];
  metadata: Record<string, any>;
}

export enum MemoryPriority {
  CRITICAL = 5,
  HIGH = 4,
  MEDIUM = 3,
  LOW = 2,
  CACHE = 1
}

export interface MemoryStats {
  totalSize: number;
  usedSize: number;
  availableSize: number;
  entryCount: number;
  hitRate: number;
  evictionCount: number;
}

export interface MemoryQuery {
  tags?: string[];
  priority?: MemoryPriority;
  timeRange?: { start: number; end: number };
  contentPattern?: string;
  limit?: number;
}

export class LangroidMemoryBackend extends EventEmitter {
  private static readonly MAX_MEMORY_SIZE = 10 * 1024 * 1024; // 10MB
  private static readonly DEFAULT_TTL = 24 * 60 * 60 * 1000; // 24 hours
  private static readonly CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes

  private memory: Map<string, MemoryEntry> = new Map();
  private indexByTags: Map<string, Set<string>> = new Map();
  private indexByPriority: Map<MemoryPriority, Set<string>> = new Map();

  private currentSize: number = 0;
  private hitCount: number = 0;
  private missCount: number = 0;
  private evictionCount: number = 0;

  private ttlManager: TTLManager;
  private persistence: MemoryPersistence;
  private metrics: MemoryMetrics;
  private cleanupTimer?: NodeJS.Timeout;

  constructor(
    persistenceConfig?: { enabled: boolean; path?: string },
    metricsConfig?: { enabled: boolean; interval?: number }
  ) {
    super();

    this.ttlManager = new TTLManager(this.handleExpiration.bind(this));
    this.persistence = new MemoryPersistence(persistenceConfig);
    this.metrics = new MemoryMetrics(this, metricsConfig);

    this.initializeIndexes();
    this.startCleanupTimer();

    // Load persisted data
    this.loadPersistedData();
  }

  /**
   * Store entry in memory with automatic size management
   */
  public async store(
    id: string,
    content: any,
    options: {
      ttl?: number;
      priority?: MemoryPriority;
      tags?: string[];
      metadata?: Record<string, any>;
    } = {}
  ): Promise<boolean> {
    try {
      const entry: MemoryEntry = {
        id,
        content,
        size: this.calculateSize(content),
        timestamp: Date.now(),
        ttl: options.ttl || LangroidMemoryBackend.DEFAULT_TTL,
        priority: options.priority || MemoryPriority.MEDIUM,
        tags: options.tags || [],
        metadata: options.metadata || {}
      };

      // Check if we need to evict entries
      if (this.currentSize + entry.size > LangroidMemoryBackend.MAX_MEMORY_SIZE) {
        await this.evictToMakeSpace(entry.size);
      }

      // Remove existing entry if updating
      if (this.memory.has(id)) {
        this.removeFromIndexes(id);
        const oldEntry = this.memory.get(id)!;
        this.currentSize -= oldEntry.size;
      }

      // Store the entry
      this.memory.set(id, entry);
      this.currentSize += entry.size;

      // Update indexes
      this.updateIndexes(entry);

      // Set TTL
      if (entry.ttl) {
        this.ttlManager.setTTL(id, entry.ttl);
      }

      // Persist if enabled
      await this.persistence.persistEntry(entry);

      this.emit('stored', { id, size: entry.size });
      return true;

    } catch (error) {
      this.emit('error', { operation: 'store', id, error });
      return false;
    }
  }

  /**
   * Retrieve entry from memory
   */
  public async retrieve(id: string): Promise<MemoryEntry | null> {
    try {
      const entry = this.memory.get(id);

      if (entry) {
        this.hitCount++;
        // Update access timestamp
        entry.metadata.lastAccessed = Date.now();
        this.emit('retrieved', { id, hit: true });
        return { ...entry }; // Return copy
      } else {
        this.missCount++;
        this.emit('retrieved', { id, hit: false });
        return null;
      }
    } catch (error) {
      this.emit('error', { operation: 'retrieve', id, error });
      return null;
    }
  }

  /**
   * Query entries based on criteria
   */
  public async query(query: MemoryQuery): Promise<MemoryEntry[]> {
    try {
      let candidates = new Set<string>();

      // Filter by tags
      if (query.tags && query.tags.length > 0) {
        const tagMatches = query.tags.map(tag =>
          this.indexByTags.get(tag) || new Set()
        );
        candidates = this.intersectSets(tagMatches);
      } else {
        candidates = new Set(this.memory.keys());
      }

      // Filter by priority
      if (query.priority !== undefined) {
        const priorityMatches = this.indexByPriority.get(query.priority) || new Set();
        candidates = this.intersectSets([candidates, priorityMatches]);
      }

      // Apply additional filters
      const results: MemoryEntry[] = [];
      for (const id of candidates) {
        const entry = this.memory.get(id);
        if (!entry) continue;

        // Time range filter
        if (query.timeRange) {
          if (entry.timestamp < query.timeRange.start ||
              entry.timestamp > query.timeRange.end) {
            continue;
          }
        }

        // Content pattern filter
        if (query.contentPattern) {
          const contentStr = JSON.stringify(entry.content).toLowerCase();
          if (!contentStr.includes(query.contentPattern.toLowerCase())) {
            continue;
          }
        }

        results.push({ ...entry });
      }

      // Sort by priority and timestamp
      results.sort((a, b) => {
        if (a.priority !== b.priority) {
          return b.priority - a.priority;
        }
        return b.timestamp - a.timestamp;
      });

      // Apply limit
      if (query.limit && query.limit > 0) {
        return results.slice(0, query.limit);
      }

      return results;

    } catch (error) {
      this.emit('error', { operation: 'query', query, error });
      return [];
    }
  }

  /**
   * Remove entry from memory
   */
  public async remove(id: string): Promise<boolean> {
    try {
      const entry = this.memory.get(id);
      if (!entry) return false;

      this.memory.delete(id);
      this.currentSize -= entry.size;
      this.removeFromIndexes(id);
      this.ttlManager.clearTTL(id);

      await this.persistence.removeEntry(id);

      this.emit('removed', { id, size: entry.size });
      return true;

    } catch (error) {
      this.emit('error', { operation: 'remove', id, error });
      return false;
    }
  }

  /**
   * Clear all memory entries
   */
  public async clear(): Promise<void> {
    try {
      const entryCount = this.memory.size;

      this.memory.clear();
      this.currentSize = 0;
      this.clearIndexes();
      this.ttlManager.clearAll();

      await this.persistence.clearAll();

      this.emit('cleared', { entryCount });

    } catch (error) {
      this.emit('error', { operation: 'clear', error });
    }
  }

  /**
   * Get memory statistics
   */
  public getStats(): MemoryStats {
    const hitRate = this.hitCount + this.missCount > 0
      ? this.hitCount / (this.hitCount + this.missCount)
      : 0;

    return {
      totalSize: LangroidMemoryBackend.MAX_MEMORY_SIZE,
      usedSize: this.currentSize,
      availableSize: LangroidMemoryBackend.MAX_MEMORY_SIZE - this.currentSize,
      entryCount: this.memory.size,
      hitRate,
      evictionCount: this.evictionCount
    };
  }

  /**
   * Optimize memory usage
   */
  public async optimize(): Promise<void> {
    try {
      // Remove expired entries
      await this.ttlManager.cleanupExpired();

      // Compact storage if needed
      if (this.currentSize > LangroidMemoryBackend.MAX_MEMORY_SIZE * 0.8) {
        await this.evictLowPriorityEntries();
      }

      this.emit('optimized', this.getStats());

    } catch (error) {
      this.emit('error', { operation: 'optimize', error });
    }
  }

  /**
   * Graceful shutdown
   */
  public async shutdown(): Promise<void> {
    try {
      if (this.cleanupTimer) {
        clearInterval(this.cleanupTimer);
      }

      await this.persistence.flush();
      this.ttlManager.shutdown();
      this.metrics.shutdown();

      this.emit('shutdown');

    } catch (error) {
      this.emit('error', { operation: 'shutdown', error });
    }
  }

  // Private methods

  private calculateSize(content: any): number {
    return Buffer.byteLength(JSON.stringify(content), 'utf8');
  }

  private initializeIndexes(): void {
    for (const priority of Object.values(MemoryPriority)) {
      if (typeof priority === 'number') {
        this.indexByPriority.set(priority, new Set());
      }
    }
  }

  private clearIndexes(): void {
    this.indexByTags.clear();
    this.indexByPriority.clear();
    this.initializeIndexes();
  }

  private updateIndexes(entry: MemoryEntry): void {
    // Update tag index
    for (const tag of entry.tags) {
      if (!this.indexByTags.has(tag)) {
        this.indexByTags.set(tag, new Set());
      }
      this.indexByTags.get(tag)!.add(entry.id);
    }

    // Update priority index
    this.indexByPriority.get(entry.priority)!.add(entry.id);
  }

  private removeFromIndexes(id: string): void {
    const entry = this.memory.get(id);
    if (!entry) return;

    // Remove from tag indexes
    for (const tag of entry.tags) {
      const tagSet = this.indexByTags.get(tag);
      if (tagSet) {
        tagSet.delete(id);
        if (tagSet.size === 0) {
          this.indexByTags.delete(tag);
        }
      }
    }

    // Remove from priority index
    this.indexByPriority.get(entry.priority)!.delete(id);
  }

  private intersectSets(sets: Set<string>[]): Set<string> {
    if (sets.length === 0) return new Set();
    if (sets.length === 1) return sets[0];

    const result = new Set(sets[0]);
    for (let i = 1; i < sets.length; i++) {
      for (const item of result) {
        if (!sets[i].has(item)) {
          result.delete(item);
        }
      }
    }
    return result;
  }

  private async evictToMakeSpace(requiredSize: number): Promise<void> {
    const targetSize = this.currentSize + requiredSize - LangroidMemoryBackend.MAX_MEMORY_SIZE;
    let evictedSize = 0;

    // Evict by priority (lowest first)
    const priorities = [
      MemoryPriority.CACHE,
      MemoryPriority.LOW,
      MemoryPriority.MEDIUM
    ];

    for (const priority of priorities) {
      if (evictedSize >= targetSize) break;

      const prioritySet = this.indexByPriority.get(priority)!;
      const entries = Array.from(prioritySet)
        .map(id => this.memory.get(id)!)
        .filter(entry => entry)
        .sort((a, b) => a.timestamp - b.timestamp); // Oldest first

      for (const entry of entries) {
        if (evictedSize >= targetSize) break;

        await this.remove(entry.id);
        evictedSize += entry.size;
        this.evictionCount++;
      }
    }
  }

  private async evictLowPriorityEntries(): Promise<void> {
    const lowPriorityEntries = Array.from(this.indexByPriority.get(MemoryPriority.CACHE)!)
      .concat(Array.from(this.indexByPriority.get(MemoryPriority.LOW)!))
      .map(id => this.memory.get(id)!)
      .filter(entry => entry)
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(0, Math.floor(this.memory.size * 0.1)); // Remove 10%

    for (const entry of lowPriorityEntries) {
      await this.remove(entry.id);
      this.evictionCount++;
    }
  }

  private handleExpiration(id: string): void {
    this.remove(id);
    this.emit('expired', { id });
  }

  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(async () => {
      await this.optimize();
    }, LangroidMemoryBackend.CLEANUP_INTERVAL);
  }

  private async loadPersistedData(): Promise<void> {
    try {
      const persistedEntries = await this.persistence.loadAll();

      for (const entry of persistedEntries) {
        if (this.currentSize + entry.size <= LangroidMemoryBackend.MAX_MEMORY_SIZE) {
          this.memory.set(entry.id, entry);
          this.currentSize += entry.size;
          this.updateIndexes(entry);

          if (entry.ttl) {
            const remainingTTL = entry.ttl - (Date.now() - entry.timestamp);
            if (remainingTTL > 0) {
              this.ttlManager.setTTL(entry.id, remainingTTL);
            } else {
              await this.remove(entry.id);
            }
          }
        }
      }

      this.emit('loaded', { entryCount: persistedEntries.length });

    } catch (error) {
      this.emit('error', { operation: 'load', error });
    }
  }
}

export default LangroidMemoryBackend;