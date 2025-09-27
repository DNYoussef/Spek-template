import { EventEmitter } from 'events';

/**
 * Time-to-Live Manager for Langroid Memory Backend
 * Efficiently manages TTL for memory entries with batch cleanup
 * and automatic expiration handling for optimal performance.
 */
export interface TTLEntry {
  id: string;
  expirationTime: number;
  ttl: number;
  createdAt: number;
}

export interface TTLStats {
  activeEntries: number;
  expiredEntries: number;
  averageTTL: number;
  nextExpirationTime: number | null;
  cleanupInterval: number;
}

export type ExpirationHandler = (id: string) => void;

export class TTLManager extends EventEmitter {
  private static readonly DEFAULT_CLEANUP_INTERVAL = 30 * 1000; // 30 seconds
  private static readonly BATCH_SIZE = 100;
  private static readonly MAX_IMMEDIATE_CLEANUP = 10;

  private ttlMap: Map<string, TTLEntry> = new Map();
  private expirationQueue: Map<number, Set<string>> = new Map();
  private sortedExpirationTimes: number[] = [];

  private cleanupTimer?: NodeJS.Timeout;
  private cleanupInterval: number;
  private expirationHandler: ExpirationHandler;

  private expiredCount: number = 0;
  private cleanupCount: number = 0;

  constructor(
    expirationHandler: ExpirationHandler,
    cleanupInterval: number = TTLManager.DEFAULT_CLEANUP_INTERVAL
  ) {
    super();

    this.expirationHandler = expirationHandler;
    this.cleanupInterval = cleanupInterval;

    this.startCleanupTimer();
  }

  /**
   * Set TTL for an entry
   */
  public setTTL(id: string, ttl: number): void {
    try {
      // Remove existing TTL if present
      this.clearTTL(id);

      const now = Date.now();
      const expirationTime = now + ttl;

      const entry: TTLEntry = {
        id,
        expirationTime,
        ttl,
        createdAt: now
      };

      // Add to TTL map
      this.ttlMap.set(id, entry);

      // Add to expiration queue
      if (!this.expirationQueue.has(expirationTime)) {
        this.expirationQueue.set(expirationTime, new Set());
        this.insertSorted(expirationTime);
      }
      this.expirationQueue.get(expirationTime)!.add(id);

      this.emit('ttl-set', { id, ttl, expirationTime });

    } catch (error) {
      this.emit('error', { operation: 'setTTL', id, ttl, error });
    }
  }

  /**
   * Clear TTL for an entry
   */
  public clearTTL(id: string): boolean {
    try {
      const entry = this.ttlMap.get(id);
      if (!entry) return false;

      this.ttlMap.delete(id);

      // Remove from expiration queue
      const expirationSet = this.expirationQueue.get(entry.expirationTime);
      if (expirationSet) {
        expirationSet.delete(id);
        if (expirationSet.size === 0) {
          this.expirationQueue.delete(entry.expirationTime);
          this.removeSorted(entry.expirationTime);
        }
      }

      this.emit('ttl-cleared', { id });
      return true;

    } catch (error) {
      this.emit('error', { operation: 'clearTTL', id, error });
      return false;
    }
  }

  /**
   * Update TTL for an entry (extend or reduce)
   */
  public updateTTL(id: string, newTTL: number): boolean {
    try {
      const entry = this.ttlMap.get(id);
      if (!entry) return false;

      this.clearTTL(id);
      this.setTTL(id, newTTL);

      this.emit('ttl-updated', { id, oldTTL: entry.ttl, newTTL });
      return true;

    } catch (error) {
      this.emit('error', { operation: 'updateTTL', id, newTTL, error });
      return false;
    }
  }

  /**
   * Get remaining TTL for an entry
   */
  public getRemainingTTL(id: string): number | null {
    const entry = this.ttlMap.get(id);
    if (!entry) return null;

    const remaining = entry.expirationTime - Date.now();
    return Math.max(0, remaining);
  }

  /**
   * Check if entry has expired
   */
  public isExpired(id: string): boolean {
    const remaining = this.getRemainingTTL(id);
    return remaining !== null && remaining <= 0;
  }

  /**
   * Get all TTL entries
   */
  public getAllTTLs(): Map<string, TTLEntry> {
    return new Map(this.ttlMap);
  }

  /**
   * Get entries expiring within a time window
   */
  public getExpiringEntries(withinMs: number): TTLEntry[] {
    const cutoffTime = Date.now() + withinMs;
    const expiring: TTLEntry[] = [];

    for (const entry of this.ttlMap.values()) {
      if (entry.expirationTime <= cutoffTime) {
        expiring.push({ ...entry });
      }
    }

    return expiring.sort((a, b) => a.expirationTime - b.expirationTime);
  }

  /**
   * Manual cleanup of expired entries
   */
  public async cleanupExpired(): Promise<number> {
    try {
      const now = Date.now();
      const expiredIds: string[] = [];

      // Find all expired entries
      for (const expirationTime of this.sortedExpirationTimes) {
        if (expirationTime > now) break;

        const expiredSet = this.expirationQueue.get(expirationTime);
        if (expiredSet) {
          expiredIds.push(...Array.from(expiredSet));
        }
      }

      // Process in batches to avoid blocking
      let processedCount = 0;
      for (let i = 0; i < expiredIds.length; i += TTLManager.BATCH_SIZE) {
        const batch = expiredIds.slice(i, i + TTLManager.BATCH_SIZE);

        for (const id of batch) {
          if (this.processExpiredEntry(id)) {
            processedCount++;
          }
        }

        // Yield control for large batches
        if (batch.length === TTLManager.BATCH_SIZE) {
          await this.sleep(1);
        }
      }

      this.cleanupCount++;
      this.emit('cleanup-completed', { expiredCount: processedCount });

      return processedCount;

    } catch (error) {
      this.emit('error', { operation: 'cleanupExpired', error });
      return 0;
    }
  }

  /**
   * Clear all TTL entries
   */
  public clearAll(): void {
    try {
      const clearedCount = this.ttlMap.size;

      this.ttlMap.clear();
      this.expirationQueue.clear();
      this.sortedExpirationTimes = [];

      this.emit('all-cleared', { clearedCount });

    } catch (error) {
      this.emit('error', { operation: 'clearAll', error });
    }
  }

  /**
   * Get TTL statistics
   */
  public getStats(): TTLStats {
    const activeEntries = this.ttlMap.size;
    const averageTTL = activeEntries > 0
      ? Array.from(this.ttlMap.values())
          .reduce((sum, entry) => sum + entry.ttl, 0) / activeEntries
      : 0;

    const nextExpirationTime = this.sortedExpirationTimes.length > 0
      ? this.sortedExpirationTimes[0]
      : null;

    return {
      activeEntries,
      expiredEntries: this.expiredCount,
      averageTTL,
      nextExpirationTime,
      cleanupInterval: this.cleanupInterval
    };
  }

  /**
   * Set cleanup interval
   */
  public setCleanupInterval(intervalMs: number): void {
    this.cleanupInterval = intervalMs;

    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.startCleanupTimer();
    }

    this.emit('cleanup-interval-changed', { interval: intervalMs });
  }

  /**
   * Force immediate cleanup of a specific number of oldest expired entries
   */
  public async forceImmediateCleanup(maxEntries: number = TTLManager.MAX_IMMEDIATE_CLEANUP): Promise<number> {
    try {
      const now = Date.now();
      let processedCount = 0;

      for (const expirationTime of this.sortedExpirationTimes) {
        if (expirationTime > now || processedCount >= maxEntries) break;

        const expiredSet = this.expirationQueue.get(expirationTime);
        if (expiredSet) {
          const entriesToProcess = Math.min(expiredSet.size, maxEntries - processedCount);
          const entryIds = Array.from(expiredSet).slice(0, entriesToProcess);

          for (const id of entryIds) {
            if (this.processExpiredEntry(id)) {
              processedCount++;
            }
          }
        }
      }

      this.emit('immediate-cleanup-completed', { processedCount });
      return processedCount;

    } catch (error) {
      this.emit('error', { operation: 'forceImmediateCleanup', error });
      return 0;
    }
  }

  /**
   * Shutdown TTL manager
   */
  public shutdown(): void {
    try {
      if (this.cleanupTimer) {
        clearInterval(this.cleanupTimer);
        this.cleanupTimer = undefined;
      }

      this.clearAll();
      this.emit('shutdown');

    } catch (error) {
      this.emit('error', { operation: 'shutdown', error });
    }
  }

  // Private methods

  private processExpiredEntry(id: string): boolean {
    try {
      const entry = this.ttlMap.get(id);
      if (!entry) return false;

      // Double-check expiration
      if (entry.expirationTime > Date.now()) return false;

      // Remove from internal structures
      this.clearTTL(id);

      // Call expiration handler
      this.expirationHandler(id);

      this.expiredCount++;
      this.emit('entry-expired', { id, entry });

      return true;

    } catch (error) {
      this.emit('error', { operation: 'processExpiredEntry', id, error });
      return false;
    }
  }

  private insertSorted(expirationTime: number): void {
    const index = this.binarySearchInsert(expirationTime);
    this.sortedExpirationTimes.splice(index, 0, expirationTime);
  }

  private removeSorted(expirationTime: number): void {
    const index = this.sortedExpirationTimes.indexOf(expirationTime);
    if (index !== -1) {
      this.sortedExpirationTimes.splice(index, 1);
    }
  }

  private binarySearchInsert(value: number): number {
    let left = 0;
    let right = this.sortedExpirationTimes.length;

    while (left < right) {
      const mid = Math.floor((left + right) / 2);
      if (this.sortedExpirationTimes[mid] < value) {
        left = mid + 1;
      } else {
        right = mid;
      }
    }

    return left;
  }

  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(async () => {
      await this.cleanupExpired();
    }, this.cleanupInterval);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default TTLManager;