/**
 * LFU (Least Frequently Used) Cache Strategy
 * NASA Rule 10 Compliant: Functions ≤60 lines, no recursion, fixed loops, 2+ assertions
 */

import { CacheStrategyDefinition, CacheStrategyType } from '../types/CacheFSMTypes';
import { CacheEntry } from '../CacheFSMFacade';

export class LFUStrategy implements CacheStrategyDefinition {
  public readonly type = CacheStrategyType.LFU;
  public readonly name = 'lfu';
  public readonly description = 'Evict least frequently used entries';

  /**
   * Evict entries based on LFU policy
   * NASA Rule 10: ≤60 lines, no recursion, fixed loops, 2+ assertions
   */
  evictEntries(entries: CacheEntry[], requiredSpace: number): CacheEntry[] {
    console.assert(entries !== null, 'Entries cannot be null');
    console.assert(requiredSpace > 0, 'Required space must be positive');

    const sorted = entries.sort((a, b) => a.frequency - b.frequency);
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
    console.assert(typeof entry.accessCount === 'number', 'accessCount must be number');

    entry.lastAccessed = Date.now();
    entry.accessCount++;
    entry.frequency = this.calculateFrequency(entry);
  }

  /**
   * Update entry on store
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  updateOnStore(entry: CacheEntry): void {
    console.assert(entry !== null, 'Entry cannot be null');
    console.assert(typeof entry.frequency === 'number', 'frequency must be number');

    entry.frequency = 1;
  }

  /**
   * Calculate priority for entry
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  calculatePriority(entry: CacheEntry): number {
    console.assert(entry !== null, 'Entry cannot be null');
    console.assert(typeof entry.frequency === 'number', 'frequency must be number');

    return entry.frequency;
  }

  /**
   * Calculate frequency based on access count and age
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  private calculateFrequency(entry: CacheEntry): number {
    console.assert(entry !== null, 'Entry cannot be null');
    console.assert(typeof entry.accessCount === 'number', 'accessCount must be number');

    const ageInMinutes = (Date.now() - entry.lastAccessed) / 60000;
    return entry.accessCount / Math.max(ageInMinutes, 1);
  }
}

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0

// Receipt
// status: OK
// reason_if_blocked: --
// run_id: cache-lfu-strategy-001
// inputs: ["CacheFSMTypes.ts", "MemoryCacheStrategy.ts"]
// tools_used: ["Write"]
// versions: {"model":"claude-sonnet-4","prompt":"cache-strategy-decomposition"}
// === END FOOTER ===