/**
 * Cache Retriever Component - Handles retrieval operations
 * NASA Rule 10 Compliant: Functions ≤60 lines, no recursion, fixed loops, 2+ assertions
 */

import { CacheEntry } from '../CacheFSMFacade';
import { CacheFSMContext, CacheOperationResult } from '../types/CacheFSMTypes';

export class CacheRetriever {
  /**
   * Retrieve entry from cache
   * NASA Rule 10: ≤60 lines, no recursion, 2+ assertions
   */
  async retrieveEntry(context: CacheFSMContext, key: string): Promise<CacheOperationResult> {
    console.assert(context !== null, 'Context cannot be null');
    console.assert(typeof key === 'string' && key.length > 0, 'Key must be non-empty string');

    try {
      const startTime = performance.now();
      const entry = context.cache.get(key);

      if (!entry) {
        this.updateMissMetrics(context);
        return {
          success: false,
          error: new Error('Cache miss'),
          metadata: {
            operation: 'retrieve',
            key,
            hit: false,
            accessTime: performance.now() - startTime
          }
        };
      }

      // Check TTL expiration
      if (this.isExpired(entry)) {
        context.cache.delete(key);
        context.currentSize -= entry.size;
        this.updateMissMetrics(context);

        return {
          success: false,
          error: new Error('Entry expired'),
          metadata: {
            operation: 'retrieve',
            key,
            hit: false,
            expired: true,
            accessTime: performance.now() - startTime
          }
        };
      }

      // Update access statistics
      this.updateAccessStats(entry);
      this.updateHitMetrics(context);

      const accessTime = performance.now() - startTime;
      this.updateAverageAccessTime(context, accessTime);

      return {
        success: true,
        data: entry.value,
        metadata: {
          operation: 'retrieve',
          key,
          hit: true,
          accessTime,
          accessCount: entry.accessCount
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error as Error,
        metadata: { operation: 'retrieve', key }
      };
    }
  }

  /**
   * Check if entry is expired
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  private isExpired(entry: CacheEntry): boolean {
    console.assert(entry !== null, 'Entry cannot be null');
    console.assert(typeof entry.ttl === 'number' || entry.ttl === undefined, 'TTL must be number or undefined');

    return entry.ttl ? Date.now() > entry.ttl : false;
  }

  /**
   * Update access statistics for entry
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  private updateAccessStats(entry: CacheEntry): void {
    console.assert(entry !== null, 'Entry cannot be null');
    console.assert(typeof entry.accessCount === 'number', 'accessCount must be number');

    entry.lastAccessed = Date.now();
    entry.accessCount++;

    // Recalculate frequency
    const ageInMinutes = (Date.now() - entry.lastAccessed) / 60000;
    entry.frequency = entry.accessCount / Math.max(ageInMinutes, 1);
  }

  /**
   * Update hit metrics
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  private updateHitMetrics(context: CacheFSMContext): void {
    console.assert(context !== null, 'Context cannot be null');
    console.assert(context.metrics !== null, 'Metrics cannot be null');

    if (!context.metrics.hitRate) {
      context.metrics.hitRate = 0;
    }
    context.metrics.hitRate++;
  }

  /**
   * Update miss metrics
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  private updateMissMetrics(context: CacheFSMContext): void {
    console.assert(context !== null, 'Context cannot be null');
    console.assert(context.metrics !== null, 'Metrics cannot be null');

    if (!context.metrics.missRate) {
      context.metrics.missRate = 0;
    }
    context.metrics.missRate++;
  }

  /**
   * Update average access time
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  private updateAverageAccessTime(context: CacheFSMContext, accessTime: number): void {
    console.assert(context !== null, 'Context cannot be null');
    console.assert(accessTime >= 0, 'Access time must be non-negative');

    const alpha = 0.1; // Exponential moving average factor
    if (!context.metrics.averageAccessTime) {
      context.metrics.averageAccessTime = accessTime;
    } else {
      context.metrics.averageAccessTime =
        context.metrics.averageAccessTime * (1 - alpha) + accessTime * alpha;
    }
  }
}

<!-- AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE -->
## Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
|--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
| 1.0.0   | 2025-09-28T15:37:35-04:00 | agent@Claude | Created cache retriever component | CacheRetriever.ts | OK | NASA Rule 10 compliant, focused retrieval operations | 0.00 | g8h9i0j |

### Receipt
- status: OK
- reason_if_blocked: --
- run_id: cache-retriever-component-001
- inputs: ["CacheFSMTypes.ts", "MemoryCacheStrategy.ts"]
- tools_used: ["Write"]
- versions: {"model":"claude-sonnet-4","prompt":"cache-operations-decomposition"}
<!-- AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE -->