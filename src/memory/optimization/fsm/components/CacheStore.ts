/**
 * Cache Store Component - Handles storage operations
 * NASA Rule 10 Compliant: Functions ≤60 lines, no recursion, fixed loops, 2+ assertions
 */

import { CacheEntry } from '../CacheFSMFacade';
import { CacheFSMContext, CacheOperationResult } from '../types/CacheFSMTypes';

export class CacheStore {
  /**
   * Store entry in cache
   * NASA Rule 10: ≤60 lines, no recursion, 2+ assertions
   */
  async storeEntry(
    context: CacheFSMContext,
    key: string,
    value: any,
    size: number,
    ttl?: number
  ): Promise<CacheOperationResult> {
    console.assert(context !== null, 'Context cannot be null');
    console.assert(typeof key === 'string' && key.length > 0, 'Key must be non-empty string');

    try {
      const now = Date.now();

      // Remove existing entry if present
      if (context.cache.has(key)) {
        const existing = context.cache.get(key)!;
        context.currentSize -= existing.size;
      }

      // Create new entry
      const entry: CacheEntry = {
        key,
        value,
        size,
        accessCount: 0,
        lastAccessed: now,
        frequency: 1,
        priority: 0,
        ttl: ttl ? now + ttl : now + (context.config.defaultTTL || 3600000)
      };

      // Store entry
      context.cache.set(key, entry);
      context.currentSize += size;

      return {
        success: true,
        data: entry,
        metadata: {
          operation: 'store',
          key,
          size,
          totalSize: context.currentSize
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error as Error,
        metadata: { operation: 'store', key }
      };
    }
  }

  /**
   * Estimate size of value
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  estimateSize(value: any): number {
    console.assert(value !== null && value !== undefined, 'Value cannot be null or undefined');
    console.assert(typeof value !== 'function', 'Cannot cache functions');

    if (typeof value === 'string') {
      return value.length * 2; // UTF-16 estimate
    } else if (typeof value === 'object') {
      return JSON.stringify(value).length * 2;
    } else {
      return 8; // Primitive estimate
    }
  }

  /**
   * Check if storage is possible
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  canStore(context: CacheFSMContext, size: number): boolean {
    console.assert(context !== null, 'Context cannot be null');
    console.assert(size > 0, 'Size must be positive');

    return context.currentSize + size <= context.maxSize;
  }

  /**
   * Calculate required space for storage
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  calculateRequiredSpace(context: CacheFSMContext, size: number): number {
    console.assert(context !== null, 'Context cannot be null');
    console.assert(size > 0, 'Size must be positive');

    const available = context.maxSize - context.currentSize;
    return size > available ? size - available : 0;
  }
}

<!-- AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE -->
## Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
|--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
| 1.0.0   | 2025-09-28T15:36:30-04:00 | agent@Claude | Created cache store component | CacheStore.ts | OK | NASA Rule 10 compliant, focused storage operations | 0.00 | f7g8h9i |

### Receipt
- status: OK
- reason_if_blocked: --
- run_id: cache-store-component-001
- inputs: ["CacheFSMTypes.ts", "MemoryCacheStrategy.ts"]
- tools_used: ["Write"]
- versions: {"model":"claude-sonnet-4","prompt":"cache-operations-decomposition"}
<!-- AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE -->