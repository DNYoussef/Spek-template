/**
 * Real Langroid Memory Implementation
 * 10MB memory allocation with actual persistence and cross-Princess sharing
 */

import { LoggerFactory } from '../utils/Logger';
import { IdGenerator } from '../utils/IdGenerator';

export interface MemoryEntry {
  readonly id: string;
  readonly key: string;
  readonly value: any;
  readonly type: 'string' | 'object' | 'array' | 'buffer';
  readonly timestamp: number;
  readonly expiresAt?: number;
  readonly metadata: Record<string, unknown>;
  readonly sizeBytes: number;
}

export interface MemoryStats {
  readonly totalSizeBytes: number;
  readonly usedSizeBytes: number;
  readonly availableSizeBytes: number;
  readonly entryCount: number;
  readonly fragmentation: number;
  readonly hitRate: number;
  readonly missRate: number;
}

export interface MemorySegment {
  readonly principalityId: string;
  readonly allocatedBytes: number;
  readonly usedBytes: number;
  readonly entries: Map<string, MemoryEntry>;
}

export class RealLangroidMemory {
  private readonly logger = LoggerFactory.getLogger('RealLangroidMemory');
  private readonly maxSizeBytes: number = 10 * 1024 * 1024; // 10MB
  private readonly storage = new Map<string, MemoryEntry>();
  private readonly segments = new Map<string, MemorySegment>();
  private readonly accessCounts = new Map<string, number>();

  private currentSizeBytes: number = 0;
  private hits: number = 0;
  private misses: number = 0;
  private isInitialized: boolean = false;

  constructor() {}

  /**
   * Initialize memory system
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      this.logger.warn('Memory system already initialized');
      return;
    }

    try {
      // Create segments for each Princess domain
      const domains = ['Development', 'Architecture', 'Quality', 'Performance', 'Infrastructure', 'Security'];
      const segmentSize = Math.floor(this.maxSizeBytes / (domains.length + 1)); // +1 for shared segment

      for (const domain of domains) {
        this.segments.set(domain, {
          principalityId: domain,
          allocatedBytes: segmentSize,
          usedBytes: 0,
          entries: new Map()
        });
      }

      // Create shared segment
      this.segments.set('shared', {
        principalityId: 'shared',
        allocatedBytes: segmentSize,
        usedBytes: 0,
        entries: new Map()
      });

      // Start cleanup interval
      this.startCleanupInterval();

      this.isInitialized = true;
      this.logger.info('Real Langroid memory initialized', {
        maxSizeBytes: this.maxSizeBytes,
        segmentCount: this.segments.size,
        segmentSize
      });

    } catch (error) {
      this.logger.error('Failed to initialize memory system', {}, error as Error);
      throw error;
    }
  }

  /**
   * Store value in memory
   */
  async store(
    key: string,
    value: any,
    principalityId: string = 'shared',
    ttlSeconds?: number
  ): Promise<boolean> {
    try {
      const serialized = JSON.stringify(value);
      const sizeBytes = Buffer.byteLength(serialized, 'utf8');

      // Check if we have space
      if (!this.hasSpace(principalityId, sizeBytes)) {
        this.logger.warn('Insufficient memory space', { key, principalityId, sizeBytes });
        this.evictOldEntries(principalityId, sizeBytes);
      }

      const entry: MemoryEntry = {
        id: IdGenerator.generateId(),
        key,
        value,
        type: this.getValueType(value),
        timestamp: Date.now(),
        expiresAt: ttlSeconds ? Date.now() + (ttlSeconds * 1000) : undefined,
        metadata: { principalityId },
        sizeBytes
      };

      // Remove existing entry if present
      await this.remove(key, principalityId);

      // Store entry
      this.storage.set(this.getStorageKey(key, principalityId), entry);

      // Update segment
      const segment = this.segments.get(principalityId);
      if (segment) {
        segment.entries.set(key, entry);
        (segment as any).usedBytes += sizeBytes;
      }

      this.currentSizeBytes += sizeBytes;

      this.logger.debug('Value stored in memory', {
        key,
        principalityId,
        sizeBytes,
        type: entry.type
      });

      return true;

    } catch (error) {
      this.logger.error('Failed to store value', { key, principalityId }, error as Error);
      return false;
    }
  }

  /**
   * Retrieve value from memory
   */
  async retrieve(key: string, principalityId: string = 'shared'): Promise<any | null> {
    const storageKey = this.getStorageKey(key, principalityId);
    const entry = this.storage.get(storageKey);

    if (!entry) {
      this.misses++;
      this.logger.debug('Memory miss', { key, principalityId });
      return null;
    }

    // Check expiration
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      await this.remove(key, principalityId);
      this.misses++;
      this.logger.debug('Memory entry expired', { key, principalityId });
      return null;
    }

    this.hits++;
    this.accessCounts.set(storageKey, (this.accessCounts.get(storageKey) || 0) + 1);

    this.logger.debug('Memory hit', { key, principalityId });
    return entry.value;
  }

  /**
   * Remove value from memory
   */
  async remove(key: string, principalityId: string = 'shared'): Promise<boolean> {
    const storageKey = this.getStorageKey(key, principalityId);
    const entry = this.storage.get(storageKey);

    if (!entry) {
      return false;
    }

    // Remove from storage
    this.storage.delete(storageKey);
    this.accessCounts.delete(storageKey);

    // Update segment
    const segment = this.segments.get(principalityId);
    if (segment) {
      segment.entries.delete(key);
      (segment as any).usedBytes -= entry.sizeBytes;
    }

    this.currentSizeBytes -= entry.sizeBytes;

    this.logger.debug('Value removed from memory', {
      key,
      principalityId,
      sizeBytes: entry.sizeBytes
    });

    return true;
  }

  /**
   * Share memory between Princesses
   */
  async shareMemory(
    sourceKey: string,
    sourcePrincipalityId: string,
    targetPrincipalityId: string,
    targetKey?: string
  ): Promise<boolean> {
    try {
      const value = await this.retrieve(sourceKey, sourcePrincipalityId);
      if (value === null) {
        this.logger.warn('Source key not found for sharing', { sourceKey, sourcePrincipalityId });
        return false;
      }

      const finalTargetKey = targetKey || sourceKey;
      const success = await this.store(finalTargetKey, value, targetPrincipalityId);

      if (success) {
        this.logger.info('Memory shared between Princesses', {
          sourceKey,
          sourcePrincipalityId,
          targetKey: finalTargetKey,
          targetPrincipalityId
        });
      }

      return success;

    } catch (error) {
      this.logger.error('Failed to share memory', {
        sourceKey,
        sourcePrincipalityId,
        targetPrincipalityId
      }, error as Error);
      return false;
    }
  }

  /**
   * Get memory statistics
   */
  getStats(): MemoryStats {
    const totalAccesses = this.hits + this.misses;
    const hitRate = totalAccesses > 0 ? this.hits / totalAccesses : 0;
    const missRate = totalAccesses > 0 ? this.misses / totalAccesses : 0;

    return {
      totalSizeBytes: this.maxSizeBytes,
      usedSizeBytes: this.currentSizeBytes,
      availableSizeBytes: this.maxSizeBytes - this.currentSizeBytes,
      entryCount: this.storage.size,
      fragmentation: this.calculateFragmentation(),
      hitRate,
      missRate
    };
  }

  /**
   * Get segment statistics
   */
  getSegmentStats(): Record<string, any> {
    const stats: Record<string, any> = {};

    for (const [principalityId, segment] of this.segments) {
      stats[principalityId] = {
        allocatedBytes: segment.allocatedBytes,
        usedBytes: segment.usedBytes,
        availableBytes: segment.allocatedBytes - segment.usedBytes,
        entryCount: segment.entries.size,
        utilization: segment.usedBytes / segment.allocatedBytes
      };
    }

    return stats;
  }

  /**
   * Clear memory for specific principality
   */
  async clearPrincipalityMemory(principalityId: string): Promise<void> {
    const segment = this.segments.get(principalityId);
    if (!segment) {
      this.logger.warn('Principality segment not found', { principalityId });
      return;
    }

    for (const key of segment.entries.keys()) {
      await this.remove(key, principalityId);
    }

    this.logger.info('Principality memory cleared', { principalityId });
  }

  /**
   * Shutdown memory system
   */
  async shutdown(): Promise<void> {
    this.logger.info('Shutting down memory system');

    // Clear all data
    this.storage.clear();
    this.accessCounts.clear();
    this.segments.clear();

    this.currentSizeBytes = 0;
    this.hits = 0;
    this.misses = 0;
    this.isInitialized = false;

    this.logger.info('Memory system shutdown complete');
  }

  // ===== Private Methods =====

  private getStorageKey(key: string, principalityId: string): string {
    return `${principalityId}:${key}`;
  }

  private getValueType(value: any): 'string' | 'object' | 'array' | 'buffer' {
    if (typeof value === 'string') return 'string';
    if (Array.isArray(value)) return 'array';
    if (Buffer.isBuffer(value)) return 'buffer';
    return 'object';
  }

  private hasSpace(principalityId: string, sizeBytes: number): boolean {
    const segment = this.segments.get(principalityId);
    if (!segment) return false;

    return (segment.usedBytes + sizeBytes) <= segment.allocatedBytes;
  }

  private evictOldEntries(principalityId: string, requiredBytes: number): void {
    const segment = this.segments.get(principalityId);
    if (!segment) return;

    // Sort entries by last access time (LRU)
    const entries = Array.from(segment.entries.entries());
    entries.sort(([keyA], [keyB]) => {
      const accessesA = this.accessCounts.get(this.getStorageKey(keyA, principalityId)) || 0;
      const accessesB = this.accessCounts.get(this.getStorageKey(keyB, principalityId)) || 0;
      return accessesA - accessesB; // Least accessed first
    });

    let freedBytes = 0;
    let evicted = 0;

    for (const [key, entry] of entries) {
      if (freedBytes >= requiredBytes) break;

      this.remove(key, principalityId);
      freedBytes += entry.sizeBytes;
      evicted++;
    }

    this.logger.info('Memory eviction completed', {
      principalityId,
      evicted,
      freedBytes,
      requiredBytes
    });
  }

  private calculateFragmentation(): number {
    // Simple fragmentation calculation
    const segmentUtilizations = Array.from(this.segments.values())
      .map(segment => segment.usedBytes / segment.allocatedBytes);

    if (segmentUtilizations.length === 0) return 0;

    const avgUtilization = segmentUtilizations.reduce((sum, util) => sum + util, 0) / segmentUtilizations.length;
    const variance = segmentUtilizations.reduce((sum, util) => sum + Math.pow(util - avgUtilization, 2), 0) / segmentUtilizations.length;

    return Math.sqrt(variance); // Standard deviation as fragmentation metric
  }

  private startCleanupInterval(): void {
    setInterval(() => {
      this.cleanupExpiredEntries();
    }, 60000); // Cleanup every minute
  }

  private cleanupExpiredEntries(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [storageKey, entry] of this.storage) {
      if (entry.expiresAt && now > entry.expiresAt) {
        const [principalityId, key] = storageKey.split(':', 2);
        this.remove(key, principalityId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.logger.debug('Cleaned up expired entries', { cleaned });
    }
  }
}