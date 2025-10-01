/**
 * Cache Evictor Component - Handles eviction operations
 * NASA Rule 10 Compliant: Functions ≤60 lines, no recursion, fixed loops, 2+ assertions
 */

import { CacheEntry } from '../CacheFSMFacade';
import { CacheFSMContext, CacheOperationResult, CacheStrategyDefinition } from '~types/CacheFSMTypes';

export class CacheEvictor {
  private strategies: Map<string, CacheStrategyDefinition> = new Map();

  /**
   * Register eviction strategy
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  registerStrategy(strategy: CacheStrategyDefinition): void {
    console.assert(strategy !== null, 'Strategy cannot be null');
    console.assert(typeof strategy.name === 'string', 'Strategy name must be string');

    this.strategies.set(strategy.name, strategy);
  }

  /**
   * Evict entries to free required space
   * NASA Rule 10: ≤60 lines, no recursion, fixed loops, 2+ assertions
   */
  async evictEntries(context: CacheFSMContext, requiredSpace: number): Promise<CacheOperationResult> {
    console.assert(context !== null, 'Context cannot be null');
    console.assert(requiredSpace > 0, 'Required space must be positive');

    try {
      const strategyName = this.getStrategyName(context);
      const strategy = this.strategies.get(strategyName);

      if (!strategy) {
        return {
          success: false,
          error: new Error(`Unknown eviction strategy: ${strategyName}`)
        };
      }

      const entries = Array.from(context.cache.values());
      const toEvict = strategy.evictEntries(entries, requiredSpace);
      let freedSpace = 0;

      // Fixed loop for eviction
      for (let i = 0; i < toEvict.length; i++) {
        const entry = toEvict[i];
        context.cache.delete(entry.key);
        context.currentSize -= entry.size;
        freedSpace += entry.size;
      }

      this.updateEvictionMetrics(context, toEvict.length);

      return {
        success: true,
        data: toEvict,
        metadata: {
          operation: 'evict',
          strategy: strategyName,
          evictedCount: toEvict.length,
          freedSpace,
          requiredSpace
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error as Error,
        metadata: { operation: 'evict', requiredSpace }
      };
    }
  }

  /**
   * Compact cache by removing expired entries
   * NASA Rule 10: ≤60 lines, fixed loops, 2+ assertions
   */
  async compactCache(context: CacheFSMContext): Promise<CacheOperationResult> {
    console.assert(context !== null, 'Context cannot be null');
    console.assert(context.cache !== null, 'Cache cannot be null');

    try {
      const now = Date.now();
      const keysToRemove: string[] = [];
      let freedSpace = 0;

      // Fixed loop to find expired entries
      for (const [key, entry] of context.cache.entries()) {
        if (entry.ttl && now > entry.ttl) {
          keysToRemove.push(key);
          freedSpace += entry.size;
        }
      }

      // Fixed loop to remove expired entries
      for (let i = 0; i < keysToRemove.length; i++) {
        const key = keysToRemove[i];
        const entry = context.cache.get(key);
        if (entry) {
          context.cache.delete(key);
          context.currentSize -= entry.size;
        }
      }

      return {
        success: true,
        data: keysToRemove,
        metadata: {
          operation: 'compact',
          removedCount: keysToRemove.length,
          freedSpace
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error as Error,
        metadata: { operation: 'compact' }
      };
    }
  }

  /**
   * Get strategy name from context
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  private getStrategyName(context: CacheFSMContext): string {
    console.assert(context !== null, 'Context cannot be null');
    console.assert(context.strategyType !== null, 'Strategy type cannot be null');

    return context.strategyType.toLowerCase();
  }

  /**
   * Update eviction metrics
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  private updateEvictionMetrics(context: CacheFSMContext, evictedCount: number): void {
    console.assert(context !== null, 'Context cannot be null');
    console.assert(evictedCount >= 0, 'Evicted count must be non-negative');

    if (!context.metrics.evictionRate) {
      context.metrics.evictionRate = 0;
    }
    context.metrics.evictionRate += evictedCount;
  }
}

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0

// Receipt
// status: OK
// reason_if_blocked: --
// run_id: cache-evictor-component-001
// inputs: ["CacheFSMTypes.ts", "MemoryCacheStrategy.ts"]
// tools_used: ["Write"]
// versions: {"model":"claude-sonnet-4","prompt":"cache-operations-decomposition"}
// === END FOOTER ===