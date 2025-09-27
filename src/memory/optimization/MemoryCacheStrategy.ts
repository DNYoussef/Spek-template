import { MemoryEntry } from '../langroid/LangroidMemoryManager';
export interface CacheEntry<T = any> {
  key: string;
  value: T;
  size: number;
  accessCount: number;
  lastAccessed: number;
  frequency: number;
  priority: number;
  ttl?: number;
  metadata?: Record<string, any>;
}
export interface CacheStrategy {
  name: string;
  description: string;
  evict: (entries: CacheEntry[], requiredSpace: number) => CacheEntry[];
  updateOnAccess: (entry: CacheEntry) => void;
  updateOnStore: (entry: CacheEntry) => void;
  calculatePriority: (entry: CacheEntry) => number;
}
export interface CacheConfig {
  maxSize: number;
  defaultTTL: number;
  strategyName: string;
  enableAdaptiveStrategy: boolean;
  performanceThreshold: number;
  hitRateThreshold: number;
}
export interface CacheMetrics {
  hitRate: number;
  missRate: number;
  evictionRate: number;
  averageAccessTime: number;
  memoryUtilization: number;
  fragmentationRatio: number;
  strategySwitches: number;
}
export class MemoryCacheStrategy {
  private strategies: Map<string, CacheStrategy> = new Map();
  private cache: Map<string, CacheEntry> = new Map();
  private currentStrategy: string;
  private config: CacheConfig;
  private metrics: CacheMetrics;
  private performanceHistory: number[] = [];
  private currentSize = 0;
  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      maxSize: 10 * 1024 * 1024, // 10MB
      defaultTTL: 3600000, // 1 hour
      strategyName: 'adaptive-lru',
      enableAdaptiveStrategy: true,
      performanceThreshold: 0.8,
      hitRateThreshold: 0.7,
      ...config
    };
    this.currentStrategy = this.config.strategyName;
    this.metrics = {
      hitRate: 0,
      missRate: 0,
      evictionRate: 0,
      averageAccessTime: 0,
      memoryUtilization: 0,
      fragmentationRatio: 0,
      strategySwitches: 0
    };
    this.initializeStrategies();
  }
  /**
   * Store an entry in the cache
   */
  async store(key: string, value: any, size: number, ttl?: number): Promise<boolean> {
    const now = Date.now();
    const strategy = this.getStrategy(this.currentStrategy);
    // Check if we need to evict entries
    if (this.currentSize + size > this.config.maxSize) {
      const requiredSpace = this.currentSize + size - this.config.maxSize;
      const evicted = this.evictEntries(requiredSpace);
      if (this.currentSize + size > this.config.maxSize) {
        // Still not enough space after eviction
        return false;
      }
    }
    // Remove existing entry if present
    if (this.cache.has(key)) {
      const existing = this.cache.get(key)!;
      this.currentSize -= existing.size;
    }
    const entry: CacheEntry = {
      key,
      value,
      size,
      accessCount: 0,
      lastAccessed: now,
      frequency: 1,
      priority: strategy.calculatePriority({ key, value, size, accessCount: 0, lastAccessed: now, frequency: 1, priority: 0 }),
      ttl: ttl ? now + ttl : now + this.config.defaultTTL
    };
    strategy.updateOnStore(entry);
    this.cache.set(key, entry);
    this.currentSize += size;
    this.updateMetrics();
    return true;
  }
  /**
   * Retrieve an entry from the cache
   */
  async retrieve(key: string): Promise<any | null> {
    const startTime = performance.now();
    const entry = this.cache.get(key);
    if (!entry) {
      this.metrics.missRate++;
      return null;
    }
    // Check TTL
    if (entry.ttl && Date.now() > entry.ttl) {
      this.remove(key);
      this.metrics.missRate++;
      return null;
    }
    // Update access statistics
    const strategy = this.getStrategy(this.currentStrategy);
    strategy.updateOnAccess(entry);
    this.metrics.hitRate++;
    const accessTime = performance.now() - startTime;
    this.updateAverageAccessTime(accessTime);
    return entry.value;
  }
  /**
   * Remove an entry from the cache
   */
  remove(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) {
      return false;
    }
    this.cache.delete(key);
    this.currentSize -= entry.size;
    this.updateMetrics();
    return true;
  }
  /**
   * Clear all entries from the cache
   */\n  clear(): void {\n    this.cache.clear();\n    this.currentSize = 0;\n    this.updateMetrics();\n  }\n  /**\n   * Get cache statistics\n   */\n  getMetrics(): CacheMetrics {\n    this.updateMetrics();\n    return { ...this.metrics };\n  }\n  /**\n   * Switch to a different caching strategy\n   */\n  switchStrategy(strategyName: string): boolean {\n    if (!this.strategies.has(strategyName)) {\n      return false;\n    }\n    this.currentStrategy = strategyName;\n    this.metrics.strategySwitches++;\n    // Recalculate priorities for all entries\n    const strategy = this.getStrategy(strategyName);\n    for (const entry of this.cache.values()) {\n      entry.priority = strategy.calculatePriority(entry);\n    }\n    return true;\n  }\n  /**\n   * Optimize cache performance by switching strategies if needed\n   */\n  optimizeStrategy(): string | null {\n    if (!this.config.enableAdaptiveStrategy) {\n      return null;\n    }\n    const currentPerformance = this.calculatePerformanceScore();\n    this.performanceHistory.push(currentPerformance);\n    // Keep only last 10 performance scores\n    if (this.performanceHistory.length > 10) {\n      this.performanceHistory.shift();\n    }\n    // Check if performance is below threshold\n    if (currentPerformance < this.config.performanceThreshold) {\n      const bestStrategy = this.findBestStrategy();\n      if (bestStrategy !== this.currentStrategy) {\n        this.switchStrategy(bestStrategy);\n        return bestStrategy;\n      }\n    }\n    return null;\n  }\n  /**\n   * Preload entries based on access patterns\n   */\n  async preload(keys: string[], predictor?: (key: string) => any): Promise<void> {\n    for (const key of keys) {\n      if (!this.cache.has(key) && predictor) {\n        const value = predictor(key);\n        if (value !== undefined) {\n          const size = this.estimateSize(value);\n          await this.store(key, value, size);\n        }\n      }\n    }\n  }\n  /**\n   * Warm up cache with frequently accessed entries\n   */\n  async warmup(entries: Array<{ key: string; value: any; priority?: number }>): Promise<void> {\n    // Sort by priority (higher first)\n    const sortedEntries = entries.sort((a, b) => (b.priority || 0) - (a.priority || 0));\n    for (const { key, value, priority } of sortedEntries) {\n      const size = this.estimateSize(value);\n      const success = await this.store(key, value, size);\n      if (success && priority) {\n        const entry = this.cache.get(key);\n        if (entry) {\n          entry.priority = priority;\n        }\n      }\n    }\n  }\n  /**\n   * Compact the cache by removing expired entries\n   */\n  compact(): number {\n    const now = Date.now();\n    let removedCount = 0;\n    const keysToRemove: string[] = [];\n    for (const [key, entry] of this.cache.entries()) {\n      if (entry.ttl && now > entry.ttl) {\n        keysToRemove.push(key);\n      }\n    }\n    for (const key of keysToRemove) {\n      this.remove(key);\n      removedCount++;\n    }\n    return removedCount;\n  }\n  /**\n   * Analyze cache access patterns\n   */\n  analyzeAccessPatterns(): {\n    topAccessed: CacheEntry[];\n    leastAccessed: CacheEntry[];\n    averageAccessCount: number;\n    accessDistribution: Record<string, number>;\n  } {\n    const entries = Array.from(this.cache.values());\n    const sorted = entries.sort((a, b) => b.accessCount - a.accessCount);\n    const totalAccess = entries.reduce((sum, entry) => sum + entry.accessCount, 0);\n    const averageAccessCount = entries.length > 0 ? totalAccess / entries.length : 0;\n    // Create access distribution buckets\n    const distribution: Record<string, number> = {\n      '0-10': 0,\n      '11-50': 0,\n      '51-100': 0,\n      '101-500': 0,\n      '500+': 0\n    };\n    for (const entry of entries) {\n      if (entry.accessCount <= 10) distribution['0-10']++;\n      else if (entry.accessCount <= 50) distribution['11-50']++;\n      else if (entry.accessCount <= 100) distribution['51-100']++;\n      else if (entry.accessCount <= 500) distribution['101-500']++;\n      else distribution['500+']++;\n    }\n    return {\n      topAccessed: sorted.slice(0, 10),\n      leastAccessed: sorted.slice(-10),\n      averageAccessCount,\n      accessDistribution: distribution\n    };\n  }\n  private initializeStrategies(): void {\n    // Least Recently Used (LRU)\n    this.strategies.set('lru', {\n      name: 'lru',\n      description: 'Evict least recently used entries',\n      evict: (entries, requiredSpace) => {\n        const sorted = entries.sort((a, b) => a.lastAccessed - b.lastAccessed);\n        const toEvict: CacheEntry[] = [];\n        let freedSpace = 0;\n        for (const entry of sorted) {\n          toEvict.push(entry);\n          freedSpace += entry.size;\n          if (freedSpace >= requiredSpace) break;\n        }\n        return toEvict;\n      },\n      updateOnAccess: (entry) => {\n        entry.lastAccessed = Date.now();\n        entry.accessCount++;\n      },\n      updateOnStore: (entry) => {\n        entry.lastAccessed = Date.now();\n      },\n      calculatePriority: (entry) => {\n        return entry.lastAccessed;\n      }\n    });\n    // Least Frequently Used (LFU)\n    this.strategies.set('lfu', {\n      name: 'lfu',\n      description: 'Evict least frequently used entries',\n      evict: (entries, requiredSpace) => {\n        const sorted = entries.sort((a, b) => a.frequency - b.frequency);\n        const toEvict: CacheEntry[] = [];\n        let freedSpace = 0;\n        for (const entry of sorted) {\n          toEvict.push(entry);\n          freedSpace += entry.size;\n          if (freedSpace >= requiredSpace) break;\n        }\n        return toEvict;\n      },\n      updateOnAccess: (entry) => {\n        entry.lastAccessed = Date.now();\n        entry.accessCount++;\n        entry.frequency = this.calculateFrequency(entry);\n      },\n      updateOnStore: (entry) => {\n        entry.frequency = 1;\n      },\n      calculatePriority: (entry) => {\n        return entry.frequency;\n      }\n    });\n    // Adaptive Replacement Cache (ARC-like)\n    this.strategies.set('adaptive-lru', {\n      name: 'adaptive-lru',\n      description: 'Adaptive strategy combining LRU and LFU',\n      evict: (entries, requiredSpace) => {\n        const sorted = entries.sort((a, b) => {\n          const aPriority = this.calculateAdaptivePriority(a);\n          const bPriority = this.calculateAdaptivePriority(b);\n          return aPriority - bPriority;\n        });\n        const toEvict: CacheEntry[] = [];\n        let freedSpace = 0;\n        for (const entry of sorted) {\n          toEvict.push(entry);\n          freedSpace += entry.size;\n          if (freedSpace >= requiredSpace) break;\n        }\n        return toEvict;\n      },\n      updateOnAccess: (entry) => {\n        entry.lastAccessed = Date.now();\n        entry.accessCount++;\n        entry.frequency = this.calculateFrequency(entry);\n        entry.priority = this.calculateAdaptivePriority(entry);\n      },\n      updateOnStore: (entry) => {\n        entry.lastAccessed = Date.now();\n        entry.frequency = 1;\n        entry.priority = this.calculateAdaptivePriority(entry);\n      },\n      calculatePriority: (entry) => {\n        return this.calculateAdaptivePriority(entry);\n      }\n    });\n    // Time-To-Live based eviction\n    this.strategies.set('ttl', {\n      name: 'ttl',\n      description: 'Evict entries closest to expiration',\n      evict: (entries, requiredSpace) => {\n        const now = Date.now();\n        const sorted = entries.sort((a, b) => {\n          const aExpiry = a.ttl || Number.MAX_SAFE_INTEGER;\n          const bExpiry = b.ttl || Number.MAX_SAFE_INTEGER;\n          return aExpiry - bExpiry;\n        });\n        const toEvict: CacheEntry[] = [];\n        let freedSpace = 0;\n        for (const entry of sorted) {\n          toEvict.push(entry);\n          freedSpace += entry.size;\n          if (freedSpace >= requiredSpace) break;\n        }\n        return toEvict;\n      },\n      updateOnAccess: (entry) => {\n        entry.lastAccessed = Date.now();\n        entry.accessCount++;\n      },\n      updateOnStore: (entry) => {\n        entry.lastAccessed = Date.now();\n      },\n      calculatePriority: (entry) => {\n        const now = Date.now();\n        return entry.ttl ? entry.ttl - now : Number.MAX_SAFE_INTEGER;\n      }\n    });\n    // Size-based eviction (largest first)\n    this.strategies.set('largest-first', {\n      name: 'largest-first',\n      description: 'Evict largest entries first',\n      evict: (entries, requiredSpace) => {\n        const sorted = entries.sort((a, b) => b.size - a.size);\n        const toEvict: CacheEntry[] = [];\n        let freedSpace = 0;\n        for (const entry of sorted) {\n          toEvict.push(entry);\n          freedSpace += entry.size;\n          if (freedSpace >= requiredSpace) break;\n        }\n        return toEvict;\n      },\n      updateOnAccess: (entry) => {\n        entry.lastAccessed = Date.now();\n        entry.accessCount++;\n      },\n      updateOnStore: (entry) => {\n        entry.lastAccessed = Date.now();\n      },\n      calculatePriority: (entry) => {\n        return -entry.size; // Negative so larger entries have lower priority\n      }\n    });\n  }\n  private evictEntries(requiredSpace: number): CacheEntry[] {\n    const strategy = this.getStrategy(this.currentStrategy);\n    const entries = Array.from(this.cache.values());\n    const toEvict = strategy.evict(entries, requiredSpace);\n    for (const entry of toEvict) {\n      this.cache.delete(entry.key);\n      this.currentSize -= entry.size;\n    }\n    this.metrics.evictionRate += toEvict.length;\n    return toEvict;\n  }\n  private getStrategy(name: string): CacheStrategy {\n    const strategy = this.strategies.get(name);\n    if (!strategy) {\n      throw new Error(`Unknown cache strategy: ${name}`);\n    }\n    return strategy;\n  }\n  private calculateFrequency(entry: CacheEntry): number {\n    const ageInMinutes = (Date.now() - entry.lastAccessed) / 60000;\n    return entry.accessCount / Math.max(ageInMinutes, 1);\n  }\n  private calculateAdaptivePriority(entry: CacheEntry): number {\n    const recency = Date.now() - entry.lastAccessed;\n    const frequency = this.calculateFrequency(entry);\n    const hitRate = this.metrics.hitRate / Math.max(this.metrics.hitRate + this.metrics.missRate, 1);\n    // Adapt weight based on current hit rate\n    const recencyWeight = hitRate > this.config.hitRateThreshold ? 0.3 : 0.7;\n    const frequencyWeight = 1 - recencyWeight;\n    return recency * recencyWeight + (1 / frequency) * frequencyWeight;\n  }\n  private calculatePerformanceScore(): number {\n    const hitRate = this.metrics.hitRate / Math.max(this.metrics.hitRate + this.metrics.missRate, 1);\n    const utilizationScore = Math.min(this.metrics.memoryUtilization / 0.8, 1); // Target 80% utilization\n    const accessTimeScore = Math.max(0, 1 - this.metrics.averageAccessTime / 10); // Target <10ms\n    return (hitRate * 0.5) + (utilizationScore * 0.3) + (accessTimeScore * 0.2);\n  }\n  private findBestStrategy(): string {\n    // Simple strategy selection based on current metrics\n    const hitRate = this.metrics.hitRate / Math.max(this.metrics.hitRate + this.metrics.missRate, 1);\n    const evictionRate = this.metrics.evictionRate;\n    if (hitRate < 0.5) {\n      return 'adaptive-lru'; // Poor hit rate, use adaptive strategy\n    } else if (evictionRate > this.cache.size * 0.1) {\n      return 'lfu'; // High eviction rate, use frequency-based\n    } else {\n      return 'lru'; // Default to LRU\n    }\n  }\n  private estimateSize(value: any): number {\n    if (typeof value === 'string') {\n      return value.length * 2; // Rough estimate for UTF-16\n    } else if (typeof value === 'object') {\n      return JSON.stringify(value).length * 2;\n    } else {\n      return 8; // Rough estimate for primitives\n    }\n  }\n  private updateMetrics(): void {\n    this.metrics.memoryUtilization = (this.currentSize / this.config.maxSize) * 100;\n    // Calculate fragmentation ratio (simplified)\n    const entryCount = this.cache.size;\n    const averageEntrySize = entryCount > 0 ? this.currentSize / entryCount : 0;\n    const theoreticalOptimalSize = entryCount * averageEntrySize;\n    this.metrics.fragmentationRatio = theoreticalOptimalSize > 0 ? \n      this.currentSize / theoreticalOptimalSize : 1;\n  }\n  private updateAverageAccessTime(accessTime: number): void {\n    // Simple exponential moving average\n    const alpha = 0.1;\n    this.metrics.averageAccessTime = \n      this.metrics.averageAccessTime * (1 - alpha) + accessTime * alpha;\n  }\n}\nexport default MemoryCacheStrategy;"