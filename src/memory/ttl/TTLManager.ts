import { EventEmitter } from 'events';
import { MemoryPriority } from '../coordinator/MemoryCoordinator';
export interface TTLEntry {
  blockId: string;
  expiresAt: Date;
  priority: MemoryPriority;
  ttl: number;
  createdAt: Date;
  lastAccessedAt: Date;
  accessCount: number;
  isExtended: boolean;
}
export interface TTLPolicy {
  priority: MemoryPriority;
  baseTTL: number;
  maxExtensions: number;
  extensionMultiplier: number;
  accessThreshold: number;
}
/**
 * Advanced TTL Manager with Priority-Based Expiration
 * Manages time-to-live for memory blocks with intelligent expiration
 * policies and priority-based memory reclamation.
 */
export class TTLManager extends EventEmitter {
  private ttlEntries: Map<string, TTLEntry> = new Map();
  private expirationTimer: NodeJS.Timeout | null = null;
  private policies: Map<MemoryPriority, TTLPolicy> = new Map();
  private isShutdown = false;
  private readonly CHECK_INTERVAL = 5000; // 5 seconds
  private readonly GRACE_PERIOD = 1000; // 1 second grace period
  constructor() {
    super();
    this.initializePolicies();
    this.startExpirationTimer();
  }
  private initializePolicies(): void {
    // Define TTL policies for different priority levels
    this.policies.set(MemoryPriority.CRITICAL, {
      priority: MemoryPriority.CRITICAL,
      baseTTL: 0, // No expiration
      maxExtensions: 0,
      extensionMultiplier: 1,
      accessThreshold: 0
    });
    this.policies.set(MemoryPriority.HIGH, {
      priority: MemoryPriority.HIGH,
      baseTTL: 3600000, // 1 hour
      maxExtensions: 5,
      extensionMultiplier: 1.5,
      accessThreshold: 10
    });
    this.policies.set(MemoryPriority.MEDIUM, {
      priority: MemoryPriority.MEDIUM,
      baseTTL: 86400000, // 24 hours
      maxExtensions: 3,
      extensionMultiplier: 1.2,
      accessThreshold: 5
    });
    this.policies.set(MemoryPriority.LOW, {
      priority: MemoryPriority.LOW,
      baseTTL: 604800000, // 7 days
      maxExtensions: 2,
      extensionMultiplier: 1.1,
      accessThreshold: 2
    });
    this.policies.set(MemoryPriority.BACKGROUND, {
      priority: MemoryPriority.BACKGROUND,
      baseTTL: 3600000, // 1 hour
      maxExtensions: 1,
      extensionMultiplier: 1.0,
      accessThreshold: 1
    });
  }
  /**
   * Register a memory block for TTL management
   */
  public registerBlock(blockId: string, ttl: number, priority: MemoryPriority): void {
    if (this.isShutdown) {
      return;
    }
    const now = new Date();
    const policy = this.policies.get(priority);
    if (!policy) {
      throw new Error(`Invalid priority: ${priority}`);
    }
    // Use policy TTL if no specific TTL provided
    const effectiveTTL = ttl || policy.baseTTL;
    const expiresAt = effectiveTTL > 0 ? new Date(now.getTime() + effectiveTTL) : new Date(8640000000000000); // Max date for no expiration
    const entry: TTLEntry = {
      blockId,
      expiresAt,
      priority,
      ttl: effectiveTTL,
      createdAt: now,
      lastAccessedAt: now,
      accessCount: 0,
      isExtended: false
    };
    this.ttlEntries.set(blockId, entry);
    this.emit('block-registered', { blockId, entry });
  }
  /**
   * Unregister a memory block from TTL management
   */
  public unregisterBlock(blockId: string): boolean {
    if (this.ttlEntries.has(blockId)) {
      this.ttlEntries.delete(blockId);
      this.emit('block-unregistered', { blockId });
      return true;
    }
    return false;
  }
  /**
   * Update last access time for a memory block
   */
  public updateLastAccess(blockId: string): void {
    const entry = this.ttlEntries.get(blockId);
    if (!entry) {
      return;
    }
    entry.lastAccessedAt = new Date();
    entry.accessCount++;
    // Check if TTL should be extended based on access patterns
    this.checkTTLExtension(entry);
    this.emit('access-updated', { blockId, entry });
  }
  /**
   * Force expire memory blocks to free specified amount of memory
   */
  public async forceExpireLowestPriority(requiredMemory: number): Promise<string[]> {
    const expiredBlocks: string[] = [];
    let freedMemory = 0;
    // Sort entries by priority (highest priority number = lowest priority)
    const sortedEntries = Array.from(this.ttlEntries.values())
      .filter(entry => entry.priority !== MemoryPriority.CRITICAL)
      .sort((a, b) => {
        if (a.priority !== b.priority) {
          return b.priority - a.priority; // Higher priority number = lower priority
        }
        // Within same priority, expire least recently accessed first
        return a.lastAccessedAt.getTime() - b.lastAccessedAt.getTime();
      });
    for (const entry of sortedEntries) {
      if (freedMemory >= requiredMemory) {
        break;
      }
      this.expireBlock(entry.blockId);
      expiredBlocks.push(entry.blockId);
      // Estimate freed memory (this would need actual block size in real implementation)
      freedMemory += this.estimateBlockSize(entry.blockId);
    }
    this.emit('forced-expiration', { expiredBlocks, freedMemory });
    return expiredBlocks;
  }
  /**
   * Get TTL statistics and health metrics
   */
  public getTTLStatistics(): {
    totalBlocks: number;
    expiringWithin1Hour: number;
    expiringWithin24Hours: number;
    criticalBlocks: number;
    averageAccessCount: number;
    extendedBlocks: number;
    priorityDistribution: Record<MemoryPriority, number>;
  } {
    const now = new Date();
    const oneHour = new Date(now.getTime() + 3600000);
    const twentyFourHours = new Date(now.getTime() + 86400000);
    let expiringWithin1Hour = 0;
    let expiringWithin24Hours = 0;
    let criticalBlocks = 0;
    let totalAccessCount = 0;
    let extendedBlocks = 0;
    const priorityDistribution: Record<MemoryPriority, number> = {
      [MemoryPriority.CRITICAL]: 0,
      [MemoryPriority.HIGH]: 0,
      [MemoryPriority.MEDIUM]: 0,
      [MemoryPriority.LOW]: 0,
      [MemoryPriority.BACKGROUND]: 0
    };
    for (const entry of this.ttlEntries.values()) {
      if (entry.expiresAt <= oneHour && entry.ttl > 0) {
        expiringWithin1Hour++;
      }
      if (entry.expiresAt <= twentyFourHours && entry.ttl > 0) {
        expiringWithin24Hours++;
      }
      if (entry.priority === MemoryPriority.CRITICAL) {
        criticalBlocks++;
      }
      if (entry.isExtended) {
        extendedBlocks++;
      }
      totalAccessCount += entry.accessCount;
      priorityDistribution[entry.priority]++;
    }
    return {
      totalBlocks: this.ttlEntries.size,
      expiringWithin1Hour,
      expiringWithin24Hours,
      criticalBlocks,
      averageAccessCount: this.ttlEntries.size > 0 ? totalAccessCount / this.ttlEntries.size : 0,
      extendedBlocks,
      priorityDistribution
    };
  }
  /**
   * Extend TTL for a specific block
   */
  public extendTTL(blockId: string, extensionTime: number): boolean {
    const entry = this.ttlEntries.get(blockId);
    if (!entry || entry.ttl === 0) {
      return false; // Can't extend critical blocks or non-existent blocks
    }
    const policy = this.policies.get(entry.priority);
    if (!policy) {
      return false;
    }
    // Check if extension is allowed
    if (entry.isExtended && entry.accessCount < policy.accessThreshold) {
      return false;
    }
    entry.expiresAt = new Date(entry.expiresAt.getTime() + extensionTime);
    entry.isExtended = true;
    this.emit('ttl-extended', { blockId, extensionTime, newExpirationTime: entry.expiresAt });
    return true;
  }
  /**
   * Get blocks expiring within specified time
   */
  public getExpiringBlocks(withinMs: number): TTLEntry[] {
    const cutoffTime = new Date(Date.now() + withinMs);
    return Array.from(this.ttlEntries.values())
      .filter(entry => entry.expiresAt <= cutoffTime && entry.ttl > 0)
      .sort((a, b) => a.expiresAt.getTime() - b.expiresAt.getTime());
  }
  /**
   * Update TTL policy for a priority level
   */
  public updatePolicy(priority: MemoryPriority, policy: Partial<TTLPolicy>): void {
    const currentPolicy = this.policies.get(priority);
    if (!currentPolicy) {
      throw new Error(`No policy found for priority: ${priority}`);
    }
    const updatedPolicy = { ...currentPolicy, ...policy };
    this.policies.set(priority, updatedPolicy);
    this.emit('policy-updated', { priority, policy: updatedPolicy });
  }
  private startExpirationTimer(): void {
    if (this.isShutdown) {
      return;
    }
    this.expirationTimer = setInterval(() => {
      this.checkExpiredBlocks();
    }, this.CHECK_INTERVAL);
  }
  private checkExpiredBlocks(): void {
    const now = new Date();
    const expiredBlocks: string[] = [];
    for (const [blockId, entry] of this.ttlEntries) {
      if (entry.ttl > 0 && entry.expiresAt <= now) {
        expiredBlocks.push(blockId);
      }
    }
    // Process expired blocks
    expiredBlocks.forEach(blockId => {
      this.expireBlock(blockId);
    });
  }
  private expireBlock(blockId: string): void {
    const entry = this.ttlEntries.get(blockId);
    if (!entry) {
      return;
    }
    this.ttlEntries.delete(blockId);
    this.emit('expired', blockId);
    this.emit('block-expired', { blockId, entry });
  }
  private checkTTLExtension(entry: TTLEntry): void {
    if (entry.ttl === 0 || entry.isExtended) {
      return; // No extension for critical blocks or already extended blocks
    }
    const policy = this.policies.get(entry.priority);
    if (!policy || policy.maxExtensions === 0) {
      return;
    }
    // Check if access pattern warrants extension
    if (entry.accessCount >= policy.accessThreshold) {
      const extensionTime = entry.ttl * (policy.extensionMultiplier - 1);
      this.extendTTL(entry.blockId, extensionTime);
    }
  }
  private estimateBlockSize(blockId: string): number {
    // Get actual block size from MemoryCoordinator
    const block = this.getBlockFromCoordinator(blockId);
    if (!block) return 0;

    // Calculate actual memory usage:
    const jsonString = JSON.stringify(block.data || {});
    const dataSize = Buffer.byteLength(jsonString, 'utf8');
    const embeddingSize = block.metadata?.embedding ? block.metadata.embedding.length * 4 : 0; // 4 bytes per float32
    const metadataSize = JSON.stringify(block.metadata || {}).length * 2; // UTF-16 overhead

    return dataSize + embeddingSize + metadataSize;
  }

  /**
   * Get block from memory coordinator for size calculation
   */
  private getBlockFromCoordinator(blockId: string): any {
    // This would be injected via dependency injection in real implementation
    // For now, we'll use a simple lookup mechanism
    try {
      const MemoryCoordinator = require('../coordinator/MemoryCoordinator').MemoryCoordinator;
      const coordinator = MemoryCoordinator.getInstance();
      return coordinator.getBlock ? coordinator.getBlock(blockId) : null;
    } catch (error) {
      // Fallback to estimated size if coordinator unavailable
      return { size: 1024 }; // 1KB estimate
    }
  }
  /**
   * Shutdown TTL manager
   */
  public shutdown(): void {
    this.isShutdown = true;
    if (this.expirationTimer) {
      clearInterval(this.expirationTimer);
      this.expirationTimer = null;
    }
    this.ttlEntries.clear();
    this.emit('shutdown');
  }
}
export default TTLManager;