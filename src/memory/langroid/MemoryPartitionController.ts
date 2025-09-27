export interface PartitionInfo {
  id: string;
  size: number;
  entryCount: number;
  maxSize?: number;
  createdAt: number;
  lastAccessed: number;
  entries: Set<string>;
}
export interface PartitionConfig {
  maxSize?: number;
  priority: number;
  ttl?: number;
  compressionLevel?: number;
}
export class MemoryPartitionController {
  private partitions: Map<string, PartitionInfo> = new Map();
  private partitionConfigs: Map<string, PartitionConfig> = new Map();
  private readonly defaultMaxSize: number = 2 * 1024 * 1024; // 2MB per partition
  constructor() {
    this.initializeDefaultPartitions();
  }
  /**
   * Create or configure a partition
   */
  createPartition(id: string, config: PartitionConfig): void {
    if (!this.partitions.has(id)) {
      this.partitions.set(id, {
        id,
        size: 0,
        entryCount: 0,
        maxSize: config.maxSize || this.defaultMaxSize,
        createdAt: Date.now(),
        lastAccessed: Date.now(),
        entries: new Set()
      });
    }
    this.partitionConfigs.set(id, config);
  }
  /**
   * Add entry to partition
   */
  addToPartition(partitionId: string, entryKey: string, size: number): boolean {
    let partition = this.partitions.get(partitionId);
    if (!partition) {
      // Auto-create partition with default config
      this.createPartition(partitionId, { priority: 1 });
      partition = this.partitions.get(partitionId)!;
    }
    // Check size limits
    if (partition.maxSize && partition.size + size > partition.maxSize) {
      return false;
    }
    // Remove from current partition if exists
    this.removeFromAllPartitions(entryKey);
    // Add to new partition
    partition.entries.add(entryKey);
    partition.size += size;
    partition.entryCount++;
    partition.lastAccessed = Date.now();
    return true;
  }
  /**
   * Remove entry from partition
   */
  removeFromPartition(partitionId: string, entryKey: string, size: number): boolean {
    const partition = this.partitions.get(partitionId);
    if (!partition || !partition.entries.has(entryKey)) {
      return false;
    }
    partition.entries.delete(entryKey);
    partition.size -= size;
    partition.entryCount--;
    partition.lastAccessed = Date.now();
    return true;
  }
  /**
   * Remove entry from all partitions
   */
  private removeFromAllPartitions(entryKey: string): void {
    for (const [partitionId, partition] of this.partitions.entries()) {
      if (partition.entries.has(entryKey)) {
        partition.entries.delete(entryKey);
        // Note: size would need to be provided separately in a real implementation
        partition.entryCount--;
      }
    }
  }
  /**
   * Get partition information
   */
  getPartitionInfo(partitionId: string): PartitionInfo | null {
    const partition = this.partitions.get(partitionId);
    return partition ? { ...partition, entries: new Set(partition.entries) } : null;
  }
  /**
   * Get all partition sizes
   */
  getPartitionSizes(): Record<string, number> {
    const sizes: Record<string, number> = {};
    for (const [id, partition] of this.partitions.entries()) {
      sizes[id] = partition.size;
    }
    return sizes;
  }
  /**
   * Get partition utilization percentage
   */
  getPartitionUtilization(partitionId: string): number {
    const partition = this.partitions.get(partitionId);
    if (!partition || !partition.maxSize) {
      return 0;
    }
    return (partition.size / partition.maxSize) * 100;
  }
  /**
   * List all partitions
   */
  listPartitions(): string[] {
    return Array.from(this.partitions.keys());
  }
  /**
   * Get partition by priority (for eviction)
   */
  getPartitionsByPriority(): PartitionInfo[] {
    return Array.from(this.partitions.values())
      .sort((a, b) => {
        const configA = this.partitionConfigs.get(a.id);
        const configB = this.partitionConfigs.get(b.id);
        const priorityA = configA?.priority || 1;
        const priorityB = configB?.priority || 1;
        return priorityA - priorityB; // Lower priority first
      });
  }
  /**
   * Clear all entries from a partition
   */
  clearPartition(partitionId: string): boolean {
    const partition = this.partitions.get(partitionId);
    if (!partition) {
      return false;
    }
    partition.entries.clear();
    partition.size = 0;
    partition.entryCount = 0;
    partition.lastAccessed = Date.now();
    return true;
  }
  /**
   * Delete a partition entirely
   */
  deletePartition(partitionId: string): boolean {
    const success = this.partitions.delete(partitionId);
    this.partitionConfigs.delete(partitionId);
    return success;
  }
  /**
   * Get partition for entry key
   */
  getPartitionForEntry(entryKey: string): string | null {
    for (const [partitionId, partition] of this.partitions.entries()) {
      if (partition.entries.has(entryKey)) {
        return partitionId;
      }
    }
    return null;
  }
  /**
   * Resize partition
   */
  resizePartition(partitionId: string, newMaxSize: number): boolean {
    const partition = this.partitions.get(partitionId);
    if (!partition) {
      return false;
    }
    if (newMaxSize < partition.size) {
      // Cannot shrink below current usage
      return false;
    }
    partition.maxSize = newMaxSize;
    return true;
  }
  /**
   * Get memory pressure for partition
   */
  getMemoryPressure(partitionId: string): number {
    const partition = this.partitions.get(partitionId);
    if (!partition || !partition.maxSize) {
      return 0;
    }
    const utilization = this.getPartitionUtilization(partitionId);
    // Memory pressure increases exponentially as utilization approaches 100%
    if (utilization < 70) return 0;
    if (utilization < 80) return 0.2;
    if (utilization < 90) return 0.5;
    if (utilization < 95) return 0.8;
    return 1.0;
  }
  /**
   * Get recommended eviction candidates
   */
  getEvictionCandidates(requiredSpace: number): Array<{ partitionId: string; entries: string[] }> {
    const candidates: Array<{ partitionId: string; entries: string[] }> = [];
    let spaceToFree = requiredSpace;
    // Sort partitions by priority (lowest first) and last accessed
    const sortedPartitions = Array.from(this.partitions.values())
      .sort((a, b) => {
        const configA = this.partitionConfigs.get(a.id);
        const configB = this.partitionConfigs.get(b.id);
        const priorityA = configA?.priority || 1;
        const priorityB = configB?.priority || 1;
        if (priorityA !== priorityB) {
          return priorityA - priorityB;
        }
        return a.lastAccessed - b.lastAccessed;
      });
    for (const partition of sortedPartitions) {
      if (spaceToFree <= 0) break;
      const entries = Array.from(partition.entries);
      candidates.push({
        partitionId: partition.id,
        entries
      });
      spaceToFree -= partition.size;
    }
    return candidates;
  }
  /**
   * Get total memory usage across all partitions
   */
  getTotalSize(): number {
    let total = 0;
    for (const partition of this.partitions.values()) {
      total += partition.size;
    }
    return total;
  }
  /**
   * Get statistics for all partitions
   */
  getStats() {
    const stats = {
      totalPartitions: this.partitions.size,
      totalSize: this.getTotalSize(),
      totalEntries: 0,
      averageUtilization: 0,
      partitionDetails: [] as Array<{
        id: string;
        size: number;
        entryCount: number;
        utilization: number;
        priority: number;
        lastAccessed: number;
      }>
    };
    let totalUtilization = 0;
    for (const [id, partition] of this.partitions.entries()) {
      const config = this.partitionConfigs.get(id);
      const utilization = this.getPartitionUtilization(id);
      stats.totalEntries += partition.entryCount;
      totalUtilization += utilization;
      stats.partitionDetails.push({
        id,
        size: partition.size,
        entryCount: partition.entryCount,
        utilization,
        priority: config?.priority || 1,
        lastAccessed: partition.lastAccessed
      });
    }
    stats.averageUtilization = this.partitions.size > 0 ?
      totalUtilization / this.partitions.size : 0;
    return stats;
  }
  private initializeDefaultPartitions(): void {
    // Create default partitions for different Princess domains
    const defaultPartitions = [
      { id: 'default', priority: 5 },
      { id: 'architecture', priority: 1 },
      { id: 'development', priority: 2 },
      { id: 'documentation', priority: 4 },
      { id: 'infrastructure', priority: 3 },
      { id: 'performance', priority: 2 },
      { id: 'quality', priority: 1 },
      { id: 'research', priority: 3 },
      { id: 'security', priority: 1 },
      { id: 'shared', priority: 2 },
      { id: 'temporary', priority: 10 }
    ];
    for (const partition of defaultPartitions) {
      this.createPartition(partition.id, { priority: partition.priority });
    }
  }
}
export default MemoryPartitionController;