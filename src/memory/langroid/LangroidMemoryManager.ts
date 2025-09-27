import { EventEmitter } from 'events';
import { MemorySerializer } from './MemorySerializer';
import { MemoryCompressor } from './MemoryCompressor';
import { MemoryPersistence } from './MemoryPersistence';
import { MemoryPartitionController } from './MemoryPartitionController';
export interface MemoryEntry {
  id: string;
  data: any;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
  size: number;
  partitionId: string;
  version: number;
  ttl?: number;
}
export interface MemoryStats {
  totalSize: number;
  entryCount: number;
  hitRate: number;
  missRate: number;
  compressionRatio: number;
  partitionSizes: Record<string, number>;
}
export interface MemoryConfig {
  maxSizeBytes: number;
  compressionEnabled: boolean;
  persistenceEnabled: boolean;
  gcIntervalMs: number;
  maxEntryAge: number;
}
export class LangroidMemoryManager extends EventEmitter {
  private memory: Map<string, MemoryEntry> = new Map();
  private currentSize: number = 0;
  private readonly maxSize: number;
  private readonly serializer: MemorySerializer;
  private readonly compressor: MemoryCompressor;
  private readonly persistence: MemoryPersistence;
  private readonly partitionController: MemoryPartitionController;
  private stats: MemoryStats;
  private gcTimer?: NodeJS.Timeout;
  private readonly config: MemoryConfig;
  constructor(config: Partial<MemoryConfig> = {}) {
    super();
    this.config = {
      maxSizeBytes: 10 * 1024 * 1024, // 10MB default
      compressionEnabled: true,
      persistenceEnabled: true,
      gcIntervalMs: 30000, // 30 seconds
      maxEntryAge: 3600000, // 1 hour
      ...config
    };
    this.maxSize = this.config.maxSizeBytes;
    this.serializer = new MemorySerializer();
    this.compressor = new MemoryCompressor();
    this.persistence = new MemoryPersistence();
    this.partitionController = new MemoryPartitionController();
    this.stats = {
      totalSize: 0,
      entryCount: 0,
      hitRate: 0,
      missRate: 0,
      compressionRatio: 1,
      partitionSizes: {}
    };
    this.startGarbageCollection();
    this.loadFromPersistence();
  }
  /**
   * Store data in memory with automatic compression and partitioning
   */
  async store(key: string, data: any, partitionId: string = 'default', ttl?: number): Promise<boolean> {
    try {
      // Serialize and optionally compress data
      let serializedData = this.serializer.serialize(data);
      let finalData = serializedData;
      if (this.config.compressionEnabled) {
        const compressed = await this.compressor.compress(serializedData);
        if (compressed.length < serializedData.length) {
          finalData = compressed;
        }
      }
      const entrySize = this.calculateSize(finalData);
      const now = Date.now();
      // Check if we need to make space
      if (this.currentSize + entrySize > this.maxSize) {
        const spaceFreed = await this.evictEntries(entrySize);
        if (spaceFreed < entrySize) {
          this.emit('error', new Error(`Cannot store entry: insufficient space after eviction`));
          return false;
        }
      }
      // Remove existing entry if present
      if (this.memory.has(key)) {
        this.removeEntry(key);
      }
      // Create new entry
      const entry: MemoryEntry = {
        id: key,
        data: finalData,
        timestamp: now,
        accessCount: 0,
        lastAccessed: now,
        size: entrySize,
        partitionId,
        version: 1,
        ttl: ttl ? now + ttl : undefined
      };
      this.memory.set(key, entry);
      this.currentSize += entrySize;
      this.partitionController.addToPartition(partitionId, key, entrySize);
      // Persist if enabled
      if (this.config.persistenceEnabled) {
        await this.persistence.store(key, entry);
      }
      this.updateStats();
      this.emit('stored', { key, size: entrySize, partitionId });
      return true;
    } catch (error) {
      this.emit('error', error);
      return false;
    }
  }
  /**
   * Retrieve data from memory with automatic decompression
   */
  async retrieve(key: string): Promise<any | null> {
    try {
      const entry = this.memory.get(key);
      if (!entry) {
        this.stats.missRate++;
        this.emit('miss', { key });
        return null;
      }
      // Check TTL
      if (entry.ttl && Date.now() > entry.ttl) {
        this.removeEntry(key);
        this.stats.missRate++;
        return null;
      }
      // Update access statistics
      entry.accessCount++;
      entry.lastAccessed = Date.now();
      this.stats.hitRate++;
      // Decompress if needed
      let data = entry.data;
      if (this.config.compressionEnabled) {
        try {
          data = await this.compressor.decompress(data);
        } catch {
          // Data might not be compressed
        }
      }
      // Deserialize
      const result = this.serializer.deserialize(data);
      this.emit('retrieved', { key, accessCount: entry.accessCount });
      return result;
    } catch (error) {
      this.emit('error', error);
      return null;
    }
  }
  /**
   * Update existing entry
   */
  async update(key: string, data: any): Promise<boolean> {
    const entry = this.memory.get(key);
    if (!entry) {
      return false;
    }
    // Store as new version
    entry.version++;
    return await this.store(key, data, entry.partitionId);
  }
  /**
   * Remove entry from memory
   */
  remove(key: string): boolean {
    const entry = this.memory.get(key);
    if (!entry) {
      return false;
    }
    this.removeEntry(key);
    if (this.config.persistenceEnabled) {
      this.persistence.remove(key);
    }
    this.emit('removed', { key, size: entry.size });
    return true;
  }
  /**
   * Clear all entries from a partition
   */
  clearPartition(partitionId: string): number {
    const keysToRemove = Array.from(this.memory.entries())
      .filter(([_, entry]) => entry.partitionId === partitionId)
      .map(([key]) => key);
    keysToRemove.forEach(key => this.remove(key));
    this.partitionController.clearPartition(partitionId);
    return keysToRemove.length;
  }
  /**
   * Get memory statistics
   */
  getStats(): MemoryStats {
    this.updateStats();
    return { ...this.stats };
  }
  /**
   * Get partition information
   */
  getPartitionInfo(partitionId: string) {
    return this.partitionController.getPartitionInfo(partitionId);
  }
  /**
   * List all keys in memory
   */
  listKeys(partitionId?: string): string[] {
    if (partitionId) {
      return Array.from(this.memory.entries())
        .filter(([_, entry]) => entry.partitionId === partitionId)
        .map(([key]) => key);
    }
    return Array.from(this.memory.keys());
  }
  /**
   * Check if key exists
   */
  has(key: string): boolean {
    const entry = this.memory.get(key);
    if (!entry) return false;
    // Check TTL
    if (entry.ttl && Date.now() > entry.ttl) {
      this.removeEntry(key);
      return false;
    }
    return true;
  }
  /**
   * Force garbage collection
   */
  async gc(): Promise<number> {
    const now = Date.now();
    let removedCount = 0;
    for (const [key, entry] of this.memory.entries()) {
      // Remove expired entries
      if (entry.ttl && now > entry.ttl) {
        this.removeEntry(key);
        removedCount++;
        continue;
      }
      // Remove old entries that haven't been accessed
      if (now - entry.lastAccessed > this.config.maxEntryAge) {
        this.removeEntry(key);
        removedCount++;
      }
    }
    this.updateStats();
    this.emit('gc', { removedCount, currentSize: this.currentSize });
    return removedCount;
  }
  /**
   * Get memory usage percentage
   */
  getUsagePercentage(): number {
    return (this.currentSize / this.maxSize) * 100;
  }
  /**
   * Shutdown memory manager
   */
  async shutdown(): Promise<void> {
    if (this.gcTimer) {
      clearInterval(this.gcTimer);
    }
    if (this.config.persistenceEnabled) {
      await this.persistAllEntries();
      await this.persistence.close();
    }
    this.memory.clear();
    this.emit('shutdown');
  }
  private removeEntry(key: string): void {
    const entry = this.memory.get(key);
    if (entry) {
      this.memory.delete(key);
      this.currentSize -= entry.size;
      this.partitionController.removeFromPartition(entry.partitionId, key, entry.size);
    }
  }
  private calculateSize(data: any): number {
    if (Buffer.isBuffer(data)) {
      return data.length;
    }
    return Buffer.byteLength(JSON.stringify(data), 'utf8');
  }
  private async evictEntries(spaceNeeded: number): Promise<number> {
    let spaceFreed = 0;
    const entries = Array.from(this.memory.entries());
    // Sort by last accessed (LRU eviction)
    entries.sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed);
    for (const [key, entry] of entries) {
      if (spaceFreed >= spaceNeeded) break;
      this.removeEntry(key);
      spaceFreed += entry.size;
      this.emit('evicted', { key, size: entry.size, reason: 'space' });
    }
    return spaceFreed;
  }
  private updateStats(): void {
    this.stats.totalSize = this.currentSize;
    this.stats.entryCount = this.memory.size;
    this.stats.partitionSizes = this.partitionController.getPartitionSizes();
    // Calculate compression ratio
    if (this.config.compressionEnabled) {
      let originalSize = 0;
      let compressedSize = 0;
      for (const entry of this.memory.values()) {
        compressedSize += entry.size;
        // Estimate original size (this is approximate)
        originalSize += entry.size * 1.5;
      }
      this.stats.compressionRatio = originalSize > 0 ? originalSize / compressedSize : 1;
    }
  }
  private startGarbageCollection(): void {
    this.gcTimer = setInterval(() => {
      this.gc();
    }, this.config.gcIntervalMs);
  }
  private async loadFromPersistence(): Promise<void> {
    if (!this.config.persistenceEnabled) return;
    try {
      const entries = await this.persistence.loadAll();
      for (const entry of entries) {
        if (this.currentSize + entry.size <= this.maxSize) {
          this.memory.set(entry.id, entry);
          this.currentSize += entry.size;
          this.partitionController.addToPartition(entry.partitionId, entry.id, entry.size);
        }
      }
      this.emit('loaded', { entryCount: entries.length });
    } catch (error) {
      this.emit('error', error);
    }
  }
  private async persistAllEntries(): Promise<void> {
    if (!this.config.persistenceEnabled) return;
    for (const entry of this.memory.values()) {
      await this.persistence.store(entry.id, entry);
    }
  }
}
export default LangroidMemoryManager;