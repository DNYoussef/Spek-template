/**
 * LRU (Least Recently Used) Cache Strategy
 * NASA Rule 10 Compliant: Functions ≤60 lines, no recursion, fixed loops, 2+ assertions
 */

import { CacheStrategyDefinition, CacheStrategyType } from '../types/CacheFSMTypes';
import { CacheEntry } from '../CacheFSMFacade';

export class LRUStrategy implements CacheStrategyDefinition {
  public readonly type = CacheStrategyType.LRU;
  public readonly name = 'lru';
  public readonly description = 'Evict least recently used entries';

  /**
   * Evict entries based on LRU policy
   * NASA Rule 10: ≤60 lines, no recursion, fixed loops, 2+ assertions
   */
  evictEntries(entries: CacheEntry[], requiredSpace: number): CacheEntry[] {
    console.assert(entries !== null, 'Entries cannot be null');
    console.assert(requiredSpace > 0, 'Required space must be positive');

    const sorted = entries.sort((a, b) => a.lastAccessed - b.lastAccessed);
    const toEvict: CacheEntry[] = [];
    let freedSpace = 0;

    // Fixed loop for eviction
    for (let i = 0; i < sorted.length && freedSpace < requiredSpace; i++) {
      const entry = sorted[i];
      toEvict.push(entry);
      freedSpace += entry.size;
    }

    return toEvict;
  }

  /**
   * Update entry on access
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  updateOnAccess(entry: CacheEntry): void {
    console.assert(entry !== null, 'Entry cannot be null');
    console.assert(typeof entry.lastAccessed === 'number', 'lastAccessed must be number');

    entry.lastAccessed = Date.now();
    entry.accessCount++;
  }

  /**
   * Update entry on store
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  updateOnStore(entry: CacheEntry): void {
    console.assert(entry !== null, 'Entry cannot be null');
    console.assert(typeof entry.lastAccessed === 'number', 'lastAccessed must be number');

    entry.lastAccessed = Date.now();
  }

  /**
   * Calculate priority for entry
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  calculatePriority(entry: CacheEntry): number {
    console.assert(entry !== null, 'Entry cannot be null');
    console.assert(typeof entry.lastAccessed === 'number', 'lastAccessed must be number');

    return entry.lastAccessed;
  }
}

<!-- AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE -->
## Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
|--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
| 1.0.0   | 2025-09-28T15:32:10-04:00 | agent@Claude | Created LRU strategy component | LRUStrategy.ts | OK | NASA Rule 10 compliant, focused single responsibility | 0.00 | b3c4d5e |

### Receipt
- status: OK
- reason_if_blocked: --
- run_id: cache-lru-strategy-001
- inputs: ["CacheFSMTypes.ts", "MemoryCacheStrategy.ts"]
- tools_used: ["Write"]
- versions: {"model":"claude-sonnet-4","prompt":"cache-strategy-decomposition"}
<!-- AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE -->