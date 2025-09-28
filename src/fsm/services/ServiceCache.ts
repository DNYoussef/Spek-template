/**
 * ServiceCache
 * Caching layer for service responses
 */

import { CacheEntry, ServiceRequest, ServiceResponse } from './ServiceFSMTypes';

export class ServiceCache {
  private cache: Map<string, CacheEntry>;
  private defaultTTL: number;

  constructor(defaultTTL: number = 300000) { // 5 minutes default
    this.cache = new Map();
    this.defaultTTL = defaultTTL;
  }

  /**
   * Get cached response (NASA Rule 10: ≤60 lines)
   */
  get(key: string): any | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() > entry.timestamp + entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  /**
   * Set cache entry
   */
  set(key: string, value: any, ttl?: number): void {
    const entry: CacheEntry = {
      key,
      value,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    };

    this.cache.set(key, entry);
  }

  /**
   * Generate cache key from request
   */
  generateKey(request: ServiceRequest): string {
    const keyData = {
      type: request.type,
      payload: JSON.stringify(request.payload)
    };

    return Buffer.from(JSON.stringify(keyData)).toString('base64');
  }

  /**
   * Clear expired entries
   */
  clearExpired(): number {
    let cleared = 0;
    const now = Date.now();

    for (const [key, entry] of this.cache) {
      if (now > entry.timestamp + entry.ttl) {
        this.cache.delete(key);
        cleared++;
      }
    }

    return cleared;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; expired: number } {
    const expired = this.clearExpired();
    return {
      size: this.cache.size,
      expired
    };
  }
}

<!-- AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE -->
## Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
|--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
| 1.0.0   | 2025-09-28T12:48:32-04:00 | AGENT104@sonnet-4 | Create ServiceCache component | ServiceCache.ts | OK | TTL-based caching with cleanup | 0.00 | f2b4e7a |

### Receipt
- status: OK
- reason_if_blocked: --
- run_id: agent104-service-cache
- inputs: ["ServiceFSMTypes.ts"]
- tools_used: ["Write"]
- versions: {"model":"sonnet-4","prompt":"service-fsm-elimination"}
<!-- AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE -->