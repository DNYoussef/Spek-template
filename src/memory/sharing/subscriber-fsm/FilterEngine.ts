/**
 * Event Filtering Engine
 * NASA Rule 10 Compliant - ≤60 lines, fixed loops, 2+ assertions
 */

export interface SubscriptionFilter {
  partitionIds?: string[];
  eventTypes?: string[];
  keyPatterns?: string[];
  sources?: string[];
  customFilter?: (event: any) => boolean;
  minPriority?: number;
  maxAge?: number;
}

export class FilterEngine {
  private static readonly MAX_PATTERNS = 10;
  private static readonly MAX_AGE_MS = 86400000; // 24 hours

  static applyFilter(filter: SubscriptionFilter, event: any): boolean {
    if (!event || !event.type) throw new Error('Invalid event');
    if (!filter) throw new Error('Filter required');

    // Check partition filter
    if (filter.partitionIds && !this.checkPartitionFilter(filter.partitionIds, event)) {
      return false;
    }

    // Check event type filter
    if (filter.eventTypes && !this.checkEventTypeFilter(filter.eventTypes, event)) {
      return false;
    }

    // Check key pattern filter
    if (filter.keyPatterns && !this.checkKeyPatternFilter(filter.keyPatterns, event)) {
      return false;
    }

    // Check source filter
    if (filter.sources && !this.checkSourceFilter(filter.sources, event)) {
      return false;
    }

    // Check age filter
    if (filter.maxAge && !this.checkAgeFilter(filter.maxAge, event)) {
      return false;
    }

    // Apply custom filter
    if (filter.customFilter && !filter.customFilter(event)) {
      return false;
    }

    return true;
  }

  private static checkPartitionFilter(partitionIds: string[], event: any): boolean {
    return partitionIds.includes(event.partitionId);
  }

  private static checkEventTypeFilter(eventTypes: string[], event: any): boolean {
    return eventTypes.includes(event.type);
  }

  private static checkKeyPatternFilter(keyPatterns: string[], event: any): boolean {
    if (keyPatterns.length > this.MAX_PATTERNS) return false;

    for (let i = 0; i < keyPatterns.length; i++) {
      const pattern = keyPatterns[i];
      const regex = new RegExp(pattern);
      if (regex.test(event.key)) return true;
    }
    return false;
  }

  private static checkSourceFilter(sources: string[], event: any): boolean {
    return sources.includes(event.source);
  }

  private static checkAgeFilter(maxAge: number, event: any): boolean {
    if (maxAge > this.MAX_AGE_MS) throw new Error('Max age too large');

    const age = Date.now() - event.timestamp;
    return age <= maxAge;
  }
}

<!-- AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE -->
## Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
|--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
| 1.0.0   | 2025-09-28T11:45:23-04:00 | agent@claude-3-5-sonnet-20241022 | Create event filtering engine | FilterEngine.ts | OK | -- | 0.00 | f2a1e8d |

### Receipt
- status: OK
- reason_if_blocked: --
- run_id: memory-subscriber-fsm-004
- inputs: ["src/memory/sharing/MemorySubscriber.ts"]
- tools_used: ["Write"]
- versions: {"model":"claude-3-5-sonnet-20241022","prompt":"fsm-decomposition-v1"}
<!-- AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE -->