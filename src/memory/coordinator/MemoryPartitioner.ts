import { EventEmitter } from 'events';
import { PrincessDomain } from './MemoryCoordinator';
export interface PartitionConfig {
  domain: PrincessDomain;
  allocated: number;
  limit: number;
  percentage: number;
  isFlexible: boolean;
  priority: number;
}
export interface PartitionMetrics {
  domain: PrincessDomain;
  utilization: number;
  fragmentation: number;
  averageBlockSize: number;
  allocationCount: number;
  recentGrowth: number;
}
export interface RebalanceResult {
  domain: PrincessDomain;
  oldLimit: number;
  newLimit: number;
  freedMemory: number;
  reason: string;
}
/**
 * Dynamic Memory Partitioner for Princess Domains
 * Manages memory allocation between different Princess domains with
 * dynamic rebalancing based on usage patterns and priority.
 */
export class MemoryPartitioner extends EventEmitter {
  private partitions: Map<PrincessDomain, PartitionConfig> = new Map();
  private metrics: Map<PrincessDomain, PartitionMetrics> = new Map();
  private usageHistory: Map<PrincessDomain, number[]> = new Map();
  private totalMemorySize: number;
  private readonly REBALANCE_INTERVAL = 60000; // 1 minute
  private readonly HISTORY_LENGTH = 100;
  private readonly UTILIZATION_THRESHOLD = 0.8; // 80%
  private readonly FRAGMENTATION_THRESHOLD = 0.3; // 30%
  private rebalanceTimer: NodeJS.Timeout | null = null;
  private isShutdown = false;
  constructor(
    allocationMap: Record<PrincessDomain, number>,
    totalMemorySize: number
  ) {
    super();
    this.totalMemorySize = totalMemorySize;
    this.initializePartitions(allocationMap);
    this.startRebalanceTimer();
  }
  private initializePartitions(allocationMap: Record<PrincessDomain, number>): void {
    let priorityCounter = 0;
    for (const [domain, percentage] of Object.entries(allocationMap)) {
      const limit = Math.floor(this.totalMemorySize * percentage);
      const config: PartitionConfig = {
        domain: domain as PrincessDomain,
        allocated: 0,
        limit,
        percentage,
        isFlexible: domain !== PrincessDomain.SYSTEM, // System partition is not flexible
        priority: priorityCounter++
      };
      this.partitions.set(domain as PrincessDomain, config);
      // Initialize metrics
      const metrics: PartitionMetrics = {
        domain: domain as PrincessDomain,
        utilization: 0,
        fragmentation: 0,
        averageBlockSize: 0,
        allocationCount: 0,
        recentGrowth: 0
      };
      this.metrics.set(domain as PrincessDomain, metrics);
      this.usageHistory.set(domain as PrincessDomain, []);
    }
    this.emit('partitions-initialized', { partitions: Array.from(this.partitions.values()) });
  }
  /**
   * Allocate memory to a domain partition
   */
  public allocateToPartition(domain: PrincessDomain, size: number): boolean {
    const partition = this.partitions.get(domain);
    if (!partition) {
      return false;
    }
    // Check if allocation would exceed limit
    if (partition.allocated + size > partition.limit) {
      // Try dynamic rebalancing if partition is under pressure
      if (this.shouldTriggerRebalance(domain)) {
        const rebalanced = this.tryRebalance(domain, size);
        if (!rebalanced) {
          this.emit('allocation-failed', { domain, size, reason: 'limit-exceeded' });
          return false;
        }
      } else {
        return false;
      }
    }
    // Perform allocation
    partition.allocated += size;
    this.updateMetrics(domain, size, 'allocate');
    this.recordUsage(domain);
    this.emit('memory-allocated-to-partition', { domain, size, newAllocated: partition.allocated });
    return true;
  }
  /**
   * Deallocate memory from a domain partition
   */
  public deallocateFromPartition(domain: PrincessDomain, size: number): boolean {
    const partition = this.partitions.get(domain);
    if (!partition || partition.allocated < size) {
      return false;
    }
    partition.allocated -= size;
    this.updateMetrics(domain, size, 'deallocate');
    this.recordUsage(domain);
    this.emit('memory-deallocated-from-partition', { domain, size, newAllocated: partition.allocated });
    return true;
  }
  /**
   * Get partition configuration for a domain
   */
  public getPartitionConfig(domain: PrincessDomain): PartitionConfig | null {
    return this.partitions.get(domain) || null;
  }
  /**
   * Get all partition configurations
   */
  public getAllPartitions(): PartitionConfig[] {
    return Array.from(this.partitions.values());
  }
  /**
   * Get partition metrics for analysis
   */
  public getPartitionMetrics(domain?: PrincessDomain): PartitionMetrics[] {
    if (domain) {
      const metrics = this.metrics.get(domain);
      return metrics ? [metrics] : [];
    }
    return Array.from(this.metrics.values());
  }
  /**
   * Manual rebalancing of partitions
   */
  public async rebalancePartitions(): Promise<RebalanceResult[]> {
    const results: RebalanceResult[] = [];
    // Analyze current usage patterns
    const analysis = this.analyzeUsagePatterns();
    // Identify over-utilized and under-utilized partitions
    const overUtilized = analysis.filter(a => a.utilization > this.UTILIZATION_THRESHOLD);
    const underUtilized = analysis.filter(a => a.utilization < 0.3 && a.domain !== PrincessDomain.SYSTEM);
    // Perform rebalancing
    for (const over of overUtilized) {
      const overPartition = this.partitions.get(over.domain);
      if (!overPartition || !overPartition.isFlexible) continue;
      // Find donors (under-utilized partitions)
      for (const under of underUtilized) {
        const underPartition = this.partitions.get(under.domain);
        if (!underPartition || !underPartition.isFlexible) continue;
        // Calculate memory transfer
        const availableFromDonor = underPartition.limit - underPartition.allocated;
        const neededByReceiver = (overPartition.allocated * 1.2) - overPartition.limit; // 20% buffer
        const transferAmount = Math.min(availableFromDonor * 0.5, neededByReceiver);
        if (transferAmount > 1024) { // Minimum 1KB transfer
          // Perform transfer
          const oldReceiverLimit = overPartition.limit;
          const oldDonorLimit = underPartition.limit;
          overPartition.limit += transferAmount;
          underPartition.limit -= transferAmount;
          // Update percentages
          overPartition.percentage = overPartition.limit / this.totalMemorySize;
          underPartition.percentage = underPartition.limit / this.totalMemorySize;
          results.push({
            domain: over.domain,
            oldLimit: oldReceiverLimit,
            newLimit: overPartition.limit,
            freedMemory: transferAmount,
            reason: 'high-utilization'
          });
          results.push({
            domain: under.domain,
            oldLimit: oldDonorLimit,
            newLimit: underPartition.limit,
            freedMemory: -transferAmount,
            reason: 'donated-to-high-utilization'
          });
          this.emit('partition-rebalanced', {
            receiver: over.domain,
            donor: under.domain,
            amount: transferAmount
          });
          break; // Only one transfer per over-utilized partition per cycle
        }
      }
    }
    this.emit('rebalance-completed', { results });
    return results;
  }
  /**
   * Set partition limit (administrative function)
   */
  public setPartitionLimit(domain: PrincessDomain, newLimit: number): boolean {
    const partition = this.partitions.get(domain);
    if (!partition) {
      return false;
    }
    const oldLimit = partition.limit;
    // Validate new limit
    if (newLimit < partition.allocated) {
      this.emit('limit-change-failed', { domain, newLimit, reason: 'below-current-allocation' });
      return false;
    }
    // Check total memory constraints
    const totalOtherLimits = Array.from(this.partitions.values())
      .filter(p => p.domain !== domain)
      .reduce((sum, p) => sum + p.limit, 0);
    if (totalOtherLimits + newLimit > this.totalMemorySize) {
      this.emit('limit-change-failed', { domain, newLimit, reason: 'exceeds-total-memory' });
      return false;
    }
    partition.limit = newLimit;
    partition.percentage = newLimit / this.totalMemorySize;
    this.emit('partition-limit-changed', { domain, oldLimit, newLimit });
    return true;
  }
  /**
   * Get comprehensive partitioning statistics
   */
  public getPartitioningStatistics(): {
    totalMemory: number;
    totalAllocated: number;
    totalAvailable: number;
    efficiency: number;
    fragmentation: number;
    partitions: (PartitionConfig & PartitionMetrics)[];
  } {
    const totalAllocated = Array.from(this.partitions.values())
      .reduce((sum, p) => sum + p.allocated, 0);
    const totalAvailable = this.totalMemorySize - totalAllocated;
    const efficiency = (totalAllocated / this.totalMemorySize) * 100;
    const averageFragmentation = Array.from(this.metrics.values())
      .reduce((sum, m) => sum + m.fragmentation, 0) / this.metrics.size;
    const partitions = Array.from(this.partitions.values()).map(partition => {
      const metrics = this.metrics.get(partition.domain)!;
      return { ...partition, ...metrics };
    });
    return {
      totalMemory: this.totalMemorySize,
      totalAllocated,
      totalAvailable,
      efficiency,
      fragmentation: averageFragmentation,
      partitions
    };
  }
  private shouldTriggerRebalance(domain: PrincessDomain): boolean {
    const partition = this.partitions.get(domain);
    const metrics = this.metrics.get(domain);
    if (!partition || !metrics || !partition.isFlexible) {
      return false;
    }
    // Trigger rebalance if utilization is high and growing
    return metrics.utilization > this.UTILIZATION_THRESHOLD && metrics.recentGrowth > 0.1;
  }
  private tryRebalance(domain: PrincessDomain, additionalSize: number): boolean {
    const partition = this.partitions.get(domain);
    if (!partition) return false;
    // Find available memory from other flexible partitions
    let availableMemory = 0;
    const donors: { domain: PrincessDomain; available: number }[] = [];
    for (const [otherDomain, otherPartition] of this.partitions) {
      if (otherDomain !== domain && otherPartition.isFlexible) {
        const available = otherPartition.limit - otherPartition.allocated;
        if (available > 1024) { // At least 1KB available
          availableMemory += available * 0.3; // Only use 30% of available
          donors.push({ domain: otherDomain, available: available * 0.3 });
        }
      }
    }
    const neededMemory = (partition.allocated + additionalSize) - partition.limit;
    if (availableMemory >= neededMemory) {
      // Redistribute memory
      let remaining = neededMemory;
      for (const donor of donors) {
        if (remaining <= 0) break;
        const takeAmount = Math.min(donor.available, remaining);
        const donorPartition = this.partitions.get(donor.domain)!;
        // Transfer memory
        partition.limit += takeAmount;
        donorPartition.limit -= takeAmount;
        // Update percentages
        partition.percentage = partition.limit / this.totalMemorySize;
        donorPartition.percentage = donorPartition.limit / this.totalMemorySize;
        remaining -= takeAmount;
        this.emit('emergency-rebalance', {
          receiver: domain,
          donor: donor.domain,
          amount: takeAmount
        });
      }
      return remaining <= 0;
    }
    return false;
  }
  private updateMetrics(domain: PrincessDomain, size: number, operation: 'allocate' | 'deallocate'): void {
    const partition = this.partitions.get(domain);
    const metrics = this.metrics.get(domain);
    if (!partition || !metrics) return;
    metrics.utilization = partition.allocated / partition.limit;
    if (operation === 'allocate') {
      metrics.allocationCount++;
      metrics.averageBlockSize = partition.allocated / metrics.allocationCount;
    }
    // Update recent growth
    const history = this.usageHistory.get(domain) || [];
    if (history.length >= 2) {
      const recent = history.slice(-10);
      const older = history.slice(-20, -10);
      const recentAvg = recent.reduce((sum, val) => sum + val, 0) / recent.length;
      const olderAvg = older.length > 0 ? older.reduce((sum, val) => sum + val, 0) / older.length : recentAvg;
      metrics.recentGrowth = (recentAvg - olderAvg) / olderAvg;
    }
    // Simple fragmentation calculation
    metrics.fragmentation = metrics.allocationCount > 0 ?
      1 - (metrics.averageBlockSize / (partition.limit / metrics.allocationCount)) : 0;
  }
  private recordUsage(domain: PrincessDomain): void {
    const partition = this.partitions.get(domain);
    if (!partition) return;
    const history = this.usageHistory.get(domain) || [];
    history.push(partition.allocated);
    // Keep only recent history
    if (history.length > this.HISTORY_LENGTH) {
      history.splice(0, history.length - this.HISTORY_LENGTH);
    }
    this.usageHistory.set(domain, history);
  }
  private analyzeUsagePatterns(): Array<{ domain: PrincessDomain; utilization: number; trend: number }> {
    const analysis: Array<{ domain: PrincessDomain; utilization: number; trend: number }> = [];
    for (const [domain, partition] of this.partitions) {
      const metrics = this.metrics.get(domain);
      const history = this.usageHistory.get(domain) || [];
      if (!metrics) continue;
      let trend = 0;
      if (history.length >= 10) {
        const recent = history.slice(-5);
        const older = history.slice(-10, -5);
        const recentAvg = recent.reduce((sum, val) => sum + val, 0) / recent.length;
        const olderAvg = older.reduce((sum, val) => sum + val, 0) / older.length;
        trend = olderAvg > 0 ? (recentAvg - olderAvg) / olderAvg : 0;
      }
      analysis.push({
        domain,
        utilization: metrics.utilization,
        trend
      });
    }
    return analysis;
  }
  private startRebalanceTimer(): void {
    if (this.isShutdown) return;
    this.rebalanceTimer = setInterval(async () => {
      const analysis = this.analyzeUsagePatterns();
      const needsRebalance = analysis.some(a =>
        a.utilization > this.UTILIZATION_THRESHOLD || a.trend > 0.2
      );
      if (needsRebalance) {
        await this.rebalancePartitions();
      }
    }, this.REBALANCE_INTERVAL);
  }
  /**
   * Shutdown partitioner
   */
  public shutdown(): void {
    this.isShutdown = true;
    if (this.rebalanceTimer) {
      clearInterval(this.rebalanceTimer);
      this.rebalanceTimer = null;
    }
    this.partitions.clear();
    this.metrics.clear();
    this.usageHistory.clear();
    this.emit('shutdown');
  }
}
export default MemoryPartitioner;