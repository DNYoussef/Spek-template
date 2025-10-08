/**
 * Cache Metrics Component - Handles metrics collection and analysis
 * NASA Rule 10 Compliant: Functions ≤60 lines, no recursion, fixed loops, 2+ assertions
 */

import { CacheEntry } from '../CacheFSMFacade';
import { CacheFSMContext, CacheOperationResult } from '~types/CacheFSMTypes';

export interface CacheAnalysisResult {
  topAccessed: CacheEntry[];
  leastAccessed: CacheEntry[];
  averageAccessCount: number;
  accessDistribution: Record<string, number>;
}

export class CacheMetrics {
  /**
   * Update cache metrics
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  updateMetrics(context: CacheFSMContext): void {
    console.assert(context !== null, 'Context cannot be null');
    console.assert(context.metrics !== null, 'Metrics cannot be null');

    // Update memory utilization
    context.metrics.memoryUtilization = (context.currentSize / context.maxSize) * 100;

    // Calculate fragmentation ratio
    const entryCount = context.cache.size;
    const averageEntrySize = entryCount > 0 ? context.currentSize / entryCount : 0;
    const theoreticalOptimalSize = entryCount * averageEntrySize;

    context.metrics.fragmentationRatio = theoreticalOptimalSize > 0 ?
      context.currentSize / theoreticalOptimalSize : 1;
  }

  /**
   * Get comprehensive metrics
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  getMetrics(context: CacheFSMContext): any {
    console.assert(context !== null, 'Context cannot be null');
    console.assert(context.metrics !== null, 'Metrics cannot be null');

    this.updateMetrics(context);
    return { ...context.metrics };
  }

  /**
   * Analyze access patterns
   * NASA Rule 10: ≤60 lines, fixed loops, 2+ assertions
   */
  analyzeAccessPatterns(context: CacheFSMContext): CacheAnalysisResult {
    console.assert(context !== null, 'Context cannot be null');
    console.assert(context.cache !== null, 'Cache cannot be null');

    const entries = Array.from(context.cache.values());
    const sorted = entries.sort((a, b) => b.accessCount - a.accessCount);

    let totalAccess = 0;
    // Fixed loop for total access calculation
    for (let i = 0; i < entries.length; i++) {
      totalAccess += entries[i].accessCount;
    }

    const averageAccessCount = entries.length > 0 ? totalAccess / entries.length : 0;

    // Create access distribution buckets
    const distribution = this.createDistribution(entries);

    return {
      topAccessed: sorted.slice(0, 10),
      leastAccessed: sorted.slice(-10),
      averageAccessCount,
      accessDistribution: distribution
    };
  }

  /**
   * Calculate performance score
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  calculatePerformanceScore(context: CacheFSMContext): number {
    console.assert(context !== null, 'Context cannot be null');
    console.assert(context.metrics !== null, 'Metrics cannot be null');

    const metrics = context.metrics;
    const totalRequests = metrics.hitRate + metrics.missRate;
    const hitRate = totalRequests > 0 ? metrics.hitRate / totalRequests : 0;

    const utilizationScore = Math.min(metrics.memoryUtilization / 80, 1); // Target 80%
    const accessTimeScore = Math.max(0, 1 - metrics.averageAccessTime / 10); // Target <10ms

    return (hitRate * 0.5) + (utilizationScore * 0.3) + (accessTimeScore * 0.2);
  }

  /**
   * Create access distribution buckets
   * NASA Rule 10: ≤60 lines, fixed loops, 2+ assertions
   */
  private createDistribution(entries: CacheEntry[]): Record<string, number> {
    console.assert(entries !== null, 'Entries cannot be null');
    console.assert(Array.isArray(entries), 'Entries must be array');

    const distribution: Record<string, number> = {
      '0-10': 0,
      '11-50': 0,
      '51-100': 0,
      '101-500': 0,
      '500+': 0
    };

    // Fixed loop for distribution calculation
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const count = entry.accessCount;

      if (count <= 10) distribution['0-10']++;
      else if (count <= 50) distribution['11-50']++;
      else if (count <= 100) distribution['51-100']++;
      else if (count <= 500) distribution['101-500']++;
      else distribution['500+']++;
    }

    return distribution;
  }

  /**
   * Find best strategy based on metrics
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  findBestStrategy(context: CacheFSMContext): string {
    console.assert(context !== null, 'Context cannot be null');
    console.assert(context.metrics !== null, 'Metrics cannot be null');

    const metrics = context.metrics;
    const totalRequests = metrics.hitRate + metrics.missRate;
    const hitRate = totalRequests > 0 ? metrics.hitRate / totalRequests : 0;
    const evictionRate = metrics.evictionRate;
    const cacheSize = context.cache.size;

    if (hitRate < 0.5) {
      return 'adaptive-lru'; // Poor hit rate
    } else if (evictionRate > cacheSize * 0.1) {
      return 'lfu'; // High eviction rate
    } else {
      return 'lru'; // Default
    }
  }
}

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0

// Receipt
// status: OK
// reason_if_blocked: --
// run_id: cache-metrics-component-001
// inputs: ["CacheFSMTypes.ts", "MemoryCacheStrategy.ts"]
// tools_used: ["Write"]
// versions: {"model":"claude-sonnet-4","prompt":"cache-operations-decomposition"}
// === END FOOTER ===