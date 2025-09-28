/**
 * CacheManager.ts
 * Intelligent caching system with FSM integration
 * Handles cache operations, eviction policies, and performance optimization
 */

import { EventEmitter } from 'events';
import { RepositoryTransitionHub, RepositoryEvent, RepositoryState } from '../fsm/RepositoryTransitionHub';

export interface CacheEntry<T = any> {
  key: string;
  value: T;
  metadata: {
    createdAt: number;
    lastAccessed: number;
    accessCount: number;
    size: number;
    ttl?: number;
    tags?: string[];
  };
}

export interface CacheConfig {
  maxSize: number;
  maxAge: number;
  evictionPolicy: 'LRU' | 'LFU' | 'FIFO' | 'TTL';
  compressionEnabled: boolean;
  persistenceEnabled: boolean;
  segmentCount?: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  size: number;
  memoryUsage: number;
  hitRate: number;
}

export interface EvictionStrategy {
  name: string;
  shouldEvict: (entry: CacheEntry, stats: CacheStats) => boolean;
  priority: (entry: CacheEntry) => number;
}

/**
 * Intelligent cache management system
 * Coordinates caching operations through FSM
 */
export class CacheManager extends EventEmitter {
  private transitionHub: RepositoryTransitionHub;
  private cache: Map<string, CacheEntry> = new Map();
  private config: CacheConfig;
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    size: 0,
    memoryUsage: 0,
    hitRate: 0
  };
  private evictionStrategies: Map<string, EvictionStrategy> = new Map();
  private cleanupInterval?: NodeJS.Timeout;

  constructor(transitionHub: RepositoryTransitionHub, config: Partial<CacheConfig> = {}) {
    super();
    this.transitionHub = transitionHub;
    this.config = {
      maxSize: config.maxSize || 1000,
      maxAge: config.maxAge || 3600000, // 1 hour
      evictionPolicy: config.evictionPolicy || 'LRU',
      compressionEnabled: config.compressionEnabled || false,
      persistenceEnabled: config.persistenceEnabled || false,
      segmentCount: config.segmentCount || 1
    };

    this.initializeEvictionStrategies();
    this.setupEventHandlers();
    this.startCleanupProcess();
  }

  private initializeEvictionStrategies(): void {
    // LRU (Least Recently Used)
    this.evictionStrategies.set('LRU', {
      name: 'LRU',
      shouldEvict: (entry, stats) => stats.size >= this.config.maxSize,
      priority: (entry) => -entry.metadata.lastAccessed
    });

    // LFU (Least Frequently Used)
    this.evictionStrategies.set('LFU', {
      name: 'LFU',
      shouldEvict: (entry, stats) => stats.size >= this.config.maxSize,
      priority: (entry) => entry.metadata.accessCount
    });

    // FIFO (First In, First Out)
    this.evictionStrategies.set('FIFO', {
      name: 'FIFO',
      shouldEvict: (entry, stats) => stats.size >= this.config.maxSize,
      priority: (entry) => entry.metadata.createdAt
    });

    // TTL (Time To Live)
    this.evictionStrategies.set('TTL', {
      name: 'TTL',
      shouldEvict: (entry, stats) => {
        if (entry.metadata.ttl) {
          return Date.now() > entry.metadata.createdAt + entry.metadata.ttl;
        }
        return Date.now() > entry.metadata.createdAt + this.config.maxAge;
      },
      priority: (entry) => entry.metadata.createdAt + (entry.metadata.ttl || this.config.maxAge)
    });
  }

  private setupEventHandlers(): void {
    this.transitionHub.on('stateChanged', (event) => {
      if (event.to === RepositoryState.CACHING) {
        this.handleCaching(event.context);
      } else if (event.to === RepositoryState.CLEANUP) {
        this.handleCleanup(event.context);
      }
    });
  }

  async set<T>(key: string, value: T, options?: { ttl?: number; tags?: string[] }): Promise<boolean> {
    if (!this.transitionHub.canCache()) {
      this.emit('cacheOperationBlocked', { operation: 'set', key, state: this.transitionHub.getCurrentState() });
      return false;
    }

    await this.transitionHub.transition(RepositoryEvent.CACHE);

    try {
      // Check if eviction is needed
      if (this.cache.size >= this.config.maxSize) {
        await this.evictEntries();
      }

      const entry: CacheEntry<T> = {
        key,
        value,
        metadata: {
          createdAt: Date.now(),
          lastAccessed: Date.now(),
          accessCount: 0,
          size: this.calculateSize(value),
          ttl: options?.ttl,
          tags: options?.tags
        }
      };

      this.cache.set(key, entry);
      this.updateStats('set', entry);

      this.emit('cacheSet', { key, size: entry.metadata.size });

      await this.transitionHub.transition(RepositoryEvent.SUCCESS);
      return true;
    } catch (error) {
      await this.transitionHub.transition(RepositoryEvent.FAILURE, { error: error as Error });
      return false;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;

    if (!entry) {
      this.stats.misses++;
      this.updateHitRate();
      this.emit('cacheMiss', { key });
      return null;
    }

    // Check TTL
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      this.stats.misses++;
      this.updateHitRate();
      this.emit('cacheExpired', { key, expiredAt: Date.now() });
      return null;
    }

    // Update access metadata
    entry.metadata.lastAccessed = Date.now();
    entry.metadata.accessCount++;

    this.stats.hits++;
    this.updateHitRate();
    this.emit('cacheHit', { key, accessCount: entry.metadata.accessCount });

    return entry.value;
  }

  async delete(key: string): Promise<boolean> {
    const entry = this.cache.get(key);
    if (!entry) {
      return false;
    }

    this.cache.delete(key);
    this.updateStats('delete', entry);

    this.emit('cacheDelete', { key, size: entry.metadata.size });
    return true;
  }

  async clear(): Promise<void> {
    const size = this.cache.size;
    this.cache.clear();
    this.resetStats();

    this.emit('cacheCleared', { entriesCleared: size });
  }

  async has(key: string): Promise<boolean> {
    const entry = this.cache.get(key);
    if (!entry) {
      return false;
    }

    return !this.isExpired(entry);
  }

  async keys(): Promise<string[]> {
    const validKeys: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (!this.isExpired(entry)) {
        validKeys.push(key);
      } else {
        // Remove expired entries during traversal
        this.cache.delete(key);
        this.updateStats('delete', entry);
      }
    }

    return validKeys;
  }

  async getByTag(tag: string): Promise<Array<{ key: string; value: any }>> {
    const results: Array<{ key: string; value: any }> = [];

    for (const [key, entry] of this.cache.entries()) {
      if (entry.metadata.tags?.includes(tag) && !this.isExpired(entry)) {
        results.push({ key, value: entry.value });
      }
    }

    return results;
  }

  async deleteByTag(tag: string): Promise<number> {
    let deletedCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.metadata.tags?.includes(tag)) {
        this.cache.delete(key);
        this.updateStats('delete', entry);
        deletedCount++;
      }
    }

    if (deletedCount > 0) {
      this.emit('cacheDeleteByTag', { tag, deletedCount });
    }

    return deletedCount;
  }

  private async evictEntries(): Promise<void> {
    const strategy = this.evictionStrategies.get(this.config.evictionPolicy);
    if (!strategy) {
      throw new Error(`Unknown eviction policy: ${this.config.evictionPolicy}`);
    }

    const entries = Array.from(this.cache.entries()).map(([key, entry]) => entry);
    const toEvict = entries
      .filter(entry => strategy.shouldEvict(entry, this.stats))
      .sort((a, b) => strategy.priority(a) - strategy.priority(b));

    // Evict 25% of cache or at least 1 entry
    const evictCount = Math.max(1, Math.floor(this.config.maxSize * 0.25));
    const evicted = toEvict.slice(0, evictCount);

    for (const entry of evicted) {
      this.cache.delete(entry.key);
      this.stats.evictions++;
      this.updateStats('delete', entry);
      this.emit('cacheEvicted', { key: entry.key, policy: this.config.evictionPolicy });
    }
  }

  private async handleCaching(context: any): Promise<void> {
    this.emit('cachingStarted', { context });
  }

  private async handleCleanup(context: any): Promise<void> {
    await this.cleanupExpiredEntries();
    this.emit('cachingCleanupCompleted', { context });
  }

  private async cleanupExpiredEntries(): Promise<void> {
    let cleanedCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        this.cache.delete(key);
        this.updateStats('delete', entry);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      this.emit('expiredEntriesCleanup', { cleanedCount });
    }
  }

  private startCleanupProcess(): void {
    // Run cleanup every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredEntries();
    }, 5 * 60 * 1000);
  }

  private isExpired(entry: CacheEntry): boolean {
    const ttl = entry.metadata.ttl || this.config.maxAge;
    return Date.now() > entry.metadata.createdAt + ttl;
  }

  private calculateSize(value: any): number {
    // Simplified size calculation
    if (typeof value === 'string') {
      return value.length * 2; // UTF-16
    }
    if (typeof value === 'object') {
      return JSON.stringify(value).length * 2;
    }
    return 8; // Primitive types
  }

  private updateStats(operation: 'set' | 'delete', entry: CacheEntry): void {
    switch (operation) {
      case 'set':
        this.stats.size = this.cache.size;
        this.stats.memoryUsage += entry.metadata.size;
        break;
      case 'delete':
        this.stats.size = this.cache.size;
        this.stats.memoryUsage = Math.max(0, this.stats.memoryUsage - entry.metadata.size);
        break;
    }
  }

  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
  }

  private resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      size: 0,
      memoryUsage: 0,
      hitRate: 0
    };
  }

  getStats(): CacheStats {
    return { ...this.stats };
  }

  getConfig(): CacheConfig {
    return { ...this.config };
  }

  updateConfig(newConfig: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...newConfig };

    // Reinitialize if eviction policy changed
    if (newConfig.evictionPolicy) {
      this.initializeEvictionStrategies();
    }

    this.emit('configUpdated', { config: this.config });
  }

  async warmup(entries: Array<{ key: string; value: any; options?: { ttl?: number; tags?: string[] } }>): Promise<void> {
    for (const entry of entries) {
      await this.set(entry.key, entry.value, entry.options);
    }

    this.emit('cacheWarmedUp', { entriesLoaded: entries.length });
  }

  async export(): Promise<Array<{ key: string; value: any; metadata: any }>> {
    const exported: Array<{ key: string; value: any; metadata: any }> = [];

    for (const [key, entry] of this.cache.entries()) {
      if (!this.isExpired(entry)) {
        exported.push({
          key,
          value: entry.value,
          metadata: entry.metadata
        });
      }
    }

    return exported;
  }

  async import(data: Array<{ key: string; value: any; metadata: any }>): Promise<void> {
    for (const item of data) {
      const entry: CacheEntry = {
        key: item.key,
        value: item.value,
        metadata: {
          ...item.metadata,
          lastAccessed: Date.now() // Reset access time
        }
      };

      this.cache.set(item.key, entry);
    }

    this.emit('cacheImported', { entriesImported: data.length });
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.clear();
    this.removeAllListeners();
  }
}