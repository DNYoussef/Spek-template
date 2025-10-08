/**
 * TTL (Time-To-Live) Cache Strategy
 * NASA Rule 10 Compliant: Functions ≤60 lines, no recursion, fixed loops, 2+ assertions
 */

import { CacheStrategyDefinition, CacheStrategyType } from '~types/CacheFSMTypes';
import { CacheEntry } from '../CacheFSMFacade';

export class TTLStrategy implements CacheStrategyDefinition {
  public readonly type = CacheStrategyType.TTL;
  public readonly name = 'ttl';
  public readonly description = 'Evict entries closest to expiration';

  /**
   * Evict entries based on TTL expiration time
   * NASA Rule 10: ≤60 lines, no recursion, fixed loops, 2+ assertions
   */
  evictEntries(entries: CacheEntry[], requiredSpace: number): CacheEntry[] {
    console.assert(entries !== null, 'Entries cannot be null');
    console.assert(requiredSpace > 0, 'Required space must be positive');

    const now = Date.now();
    const sorted = entries.sort((a, b) => {
      const aExpiry = a.ttl || Number.MAX_SAFE_INTEGER;
      const bExpiry = b.ttl || Number.MAX_SAFE_INTEGER;
      return aExpiry - bExpiry;
    });

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
   * Calculate priority for entry (time remaining until expiration)
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  calculatePriority(entry: CacheEntry): number {
    console.assert(entry !== null, 'Entry cannot be null');
    console.assert(typeof entry.ttl === 'number' || entry.ttl === undefined, 'ttl must be number or undefined');

    const now = Date.now();
    return entry.ttl ? entry.ttl - now : Number.MAX_SAFE_INTEGER;
  }

  /**
   * Check if entry is expired
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  isExpired(entry: CacheEntry): boolean {
    console.assert(entry !== null, 'Entry cannot be null');
    console.assert(typeof entry.ttl === 'number' || entry.ttl === undefined, 'ttl must be number or undefined');

    if (!entry.ttl) {
      return false;
    }

    return Date.now() > entry.ttl;
  }

  /**
   * Get expired entries from collection
   * NASA Rule 10: ≤60 lines, fixed loops, 2+ assertions
   */
  getExpiredEntries(entries: CacheEntry[]): CacheEntry[] {
    console.assert(entries !== null, 'Entries cannot be null');
    console.assert(Array.isArray(entries), 'Entries must be array');

    const expired: CacheEntry[] = [];
    const now = Date.now();

    // Fixed loop for expired check
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      if (entry.ttl && now > entry.ttl) {
        expired.push(entry);
      }
    }

    return expired;
  }
}

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0

// Receipt
// status: OK
// reason_if_blocked: --
// run_id: cache-ttl-strategy-001
// inputs: ["CacheFSMTypes.ts", "MemoryCacheStrategy.ts"]
// tools_used: ["Write"]
// versions: {"model":"claude-sonnet-4","prompt":"cache-strategy-decomposition"}
// === END FOOTER ===