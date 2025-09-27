import { EventEmitter } from 'events';
import { LangroidMemoryManager } from '../langroid/LangroidMemoryManager';
import { SharedMemoryBus } from '../sharing/SharedMemoryBus';
import { MemoryBroadcaster } from '../sharing/MemoryBroadcaster';
import { MemorySubscriber } from '../sharing/MemorySubscriber';
import { MemoryConflictResolver } from '../sharing/MemoryConflictResolver';
import { MemoryVersionController } from '../sharing/MemoryVersionController';
import { MemoryCacheStrategy } from '../optimization/MemoryCacheStrategy';
import { MemoryGarbageCollector } from '../optimization/MemoryGarbageCollector';
export interface PrincessMemoryConfig {
  principalId: string;
  domain: string;
  maxMemorySize: number;
  partitionIds: string[];
  priority: number;
  enableSharing: boolean;
  enableVersioning: boolean;
  cacheStrategy: string;
}
export interface CoordinatorConfig {
  totalMemoryLimit: number;
  princessMemoryLimit: number;
  sharedPoolSize: number;
  enableConflictResolution: boolean;
  enableLoadBalancing: boolean;
  syncInterval: number;
  healthCheckInterval: number;
}
export interface PrincessMemoryStatus {
  principalId: string;
  domain: string;
  memoryUsage: number;
  memoryLimit: number;
  utilizationPercentage: number;
  entryCount: number;
  isHealthy: boolean;
  lastSync: number;
  conflictCount: number;
  cacheHitRate: number;
}
export interface CoordinatorMetrics {
  totalMemoryUsed: number;
  totalMemoryLimit: number;
  activePrincesses: number;
  totalSyncOperations: number;
  totalConflicts: number;
  averageResponseTime: number;
  systemHealth: number;
}
export interface MemoryTransferRequest {
  fromPrincess: string;
  toPrincess: string;
  keys: string[];
  preserveOriginal: boolean;
  priority: number;
}
export interface SyncOperation {
  id: string;
  type: 'full' | 'incremental' | 'selective';
  principalIds: string[];
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime: number;
  endTime?: number;
  conflictsResolved: number;
  entriesSynced: number;
}
export class CrossPrincessMemoryCoordinator extends EventEmitter {
  private princesses: Map<string, {
    config: PrincessMemoryConfig;
    memoryManager: LangroidMemoryManager;
    cache: MemoryCacheStrategy;
    gc: MemoryGarbageCollector;
    subscriber: MemorySubscriber;
    status: PrincessMemoryStatus;
  }> = new Map();
  private sharedMemoryBus: SharedMemoryBus;
  private broadcaster: MemoryBroadcaster;
  private conflictResolver: MemoryConflictResolver;
  private versionController: MemoryVersionController;
  private config: CoordinatorConfig;
  private metrics: CoordinatorMetrics;
  private syncOperations: Map<string, SyncOperation> = new Map();
  private healthCheckTimer?: NodeJS.Timeout;
  private syncTimer?: NodeJS.Timeout;
  constructor(config: Partial<CoordinatorConfig> = {}) {
    super();
    this.config = {
      totalMemoryLimit: 60 * 1024 * 1024, // 60MB total (6 x 10MB)
      princessMemoryLimit: 10 * 1024 * 1024, // 10MB per Princess
      sharedPoolSize: 10 * 1024 * 1024, // 10MB shared pool
      enableConflictResolution: true,
      enableLoadBalancing: true,
      syncInterval: 30000, // 30 seconds
      healthCheckInterval: 10000, // 10 seconds
      ...config
    };
    this.metrics = {
      totalMemoryUsed: 0,
      totalMemoryLimit: this.config.totalMemoryLimit,
      activePrincesses: 0,
      totalSyncOperations: 0,
      totalConflicts: 0,
      averageResponseTime: 0,
      systemHealth: 1.0
    };
    // Initialize shared infrastructure
    const sharedMemoryManager = new LangroidMemoryManager({
      maxSizeBytes: this.config.sharedPoolSize
    });
    this.sharedMemoryBus = new SharedMemoryBus(sharedMemoryManager);
    this.broadcaster = new MemoryBroadcaster(this.sharedMemoryBus);
    this.conflictResolver = new MemoryConflictResolver();
    this.versionController = new MemoryVersionController();
    this.startHealthMonitoring();
    this.startSyncScheduler();
  }
  /**
   * Register a Princess with her memory system
   */
  async registerPrincess(config: PrincessMemoryConfig): Promise<void> {
    if (this.princesses.has(config.principalId)) {
      throw new Error(`Princess ${config.principalId} already registered`);
    }
    if (this.princesses.size >= 6) {
      throw new Error('Maximum number of Princesses (6) already registered');
    }
    // Create memory manager for this Princess
    const memoryManager = new LangroidMemoryManager({
      maxSizeBytes: config.maxMemorySize || this.config.princessMemoryLimit,
      compressionEnabled: true,
      persistenceEnabled: true
    });
    // Create cache strategy
    const cache = new MemoryCacheStrategy({
      maxSize: config.maxMemorySize || this.config.princessMemoryLimit,
      strategyName: config.cacheStrategy || 'adaptive-lru'
    });
    // Create garbage collector
    const gc = new MemoryGarbageCollector(memoryManager, {
      enabled: true,
      memoryPressureThreshold: 0.8
    });
    // Create subscriber for cross-Princess communication
    const subscriber = new MemorySubscriber(this.sharedMemoryBus);
    // Subscribe to relevant events
    if (config.enableSharing) {
      subscriber.subscribe({
        partitionIds: config.partitionIds,
        eventTypes: ['store', 'update', 'remove']
      }, (event) => {
        this.handleCrossPrincessEvent(config.principalId, event);
      });
    }
    const status: PrincessMemoryStatus = {
      principalId: config.principalId,
      domain: config.domain,
      memoryUsage: 0,
      memoryLimit: config.maxMemorySize || this.config.princessMemoryLimit,
      utilizationPercentage: 0,
      entryCount: 0,
      isHealthy: true,
      lastSync: Date.now(),
      conflictCount: 0,
      cacheHitRate: 0
    };
    this.princesses.set(config.principalId, {
      config,
      memoryManager,
      cache,
      gc,
      subscriber,
      status
    });
    this.updateMetrics();
    this.emit('princess_registered', { principalId: config.principalId, domain: config.domain });
  }
  /**
   * Unregister a Princess
   */
  async unregisterPrincess(principalId: string): Promise<void> {
    const princess = this.princesses.get(principalId);
    if (!princess) {
      throw new Error(`Princess ${principalId} not found`);
    }
    // Shutdown Princess memory systems
    await princess.memoryManager.shutdown();
    await princess.subscriber.shutdown();
    this.princesses.delete(principalId);
    this.updateMetrics();
    this.emit('princess_unregistered', { principalId });
  }
  /**
   * Store data in a Princess's memory
   */
  async store(principalId: string, key: string, data: any, partitionId?: string): Promise<boolean> {
    const princess = this.princesses.get(principalId);
    if (!princess) {
      throw new Error(`Princess ${principalId} not found`);
    }
    const startTime = Date.now();
    try {
      // Store in memory manager
      const success = await princess.memoryManager.store(
        key,
        data,
        partitionId || princess.config.domain
      );
      if (success) {
        // Store in cache for fast access
        const size = JSON.stringify(data).length;
        await princess.cache.store(key, data, size);
        // Create version if versioning is enabled
        if (princess.config.enableVersioning) {
          await this.versionController.createVersion(
            key,
            {
              id: key,
              data,
              timestamp: Date.now(),
              accessCount: 0,
              lastAccessed: Date.now(),
              size,
              partitionId: partitionId || princess.config.domain,
              version: 1
            },
            principalId
          );
        }
        // Broadcast to other Princesses if sharing is enabled
        if (princess.config.enableSharing) {
          await this.broadcaster.broadcastMemoryEvent({
            type: 'store',
            key,
            partitionId: partitionId || princess.config.domain,
            data,
            metadata: { source: principalId },
            timestamp: Date.now(),
            source: principalId,
            version: 1
          });
        }
        this.updatePrincessStatus(principalId);
        this.updateResponseTime(Date.now() - startTime);
      }
      return success;
    } catch (error) {
      this.emit('store_error', { principalId, key, error });
      return false;
    }
  }
  /**
   * Retrieve data from a Princess's memory
   */
  async retrieve(principalId: string, key: string): Promise<any | null> {
    const princess = this.princesses.get(principalId);
    if (!princess) {
      throw new Error(`Princess ${principalId} not found`);
    }
    const startTime = Date.now();
    try {
      // Try cache first
      let data = await princess.cache.retrieve(key);
      if (data === null) {
        // Cache miss, try memory manager
        data = await princess.memoryManager.retrieve(key);
        if (data !== null) {
          // Update cache
          const size = JSON.stringify(data).length;
          await princess.cache.store(key, data, size);
        }
      }
      this.updateResponseTime(Date.now() - startTime);
      return data;
    } catch (error) {
      this.emit('retrieve_error', { principalId, key, error });
      return null;
    }
  }
  /**
   * Transfer memory entries between Princesses
   */
  async transferMemory(request: MemoryTransferRequest): Promise<boolean> {
    const fromPrincess = this.princesses.get(request.fromPrincess);
    const toPrincess = this.princesses.get(request.toPrincess);
    if (!fromPrincess || !toPrincess) {
      throw new Error('Source or target Princess not found');
    }
    try {
      let transferredCount = 0;
      for (const key of request.keys) {
        const data = await fromPrincess.memoryManager.retrieve(key);
        if (data === null) continue;
        // Store in target Princess
        const success = await this.store(request.toPrincess, key, data);
        if (success) {
          transferredCount++;
          // Remove from source if not preserving
          if (!request.preserveOriginal) {
            fromPrincess.memoryManager.remove(key);
            fromPrincess.cache.remove(key);
          }
        }
      }
      this.emit('memory_transferred', {
        fromPrincess: request.fromPrincess,
        toPrincess: request.toPrincess,
        transferredCount,
        totalRequested: request.keys.length
      });
      return transferredCount > 0;
    } catch (error) {
      this.emit('transfer_error', { request, error });
      return false;
    }
  }
  /**
   * Synchronize memory across all Princesses
   */
  async synchronizeAll(type: 'full' | 'incremental' = 'incremental'): Promise<string> {
    const syncId = this.generateSyncId();
    const principalIds = Array.from(this.princesses.keys());
    const operation: SyncOperation = {
      id: syncId,
      type,
      principalIds,
      status: 'pending',
      startTime: Date.now(),
      conflictsResolved: 0,
      entriesSynced: 0
    };
    this.syncOperations.set(syncId, operation);
    this.emit('sync_started', { syncId, type, principalIds });
    try {
      operation.status = 'running';
      // Collect all unique keys from all Princesses
      const allKeys = new Set<string>();
      const keyToPrincess = new Map<string, string[]>();
      for (const [principalId, princess] of this.princesses.entries()) {
        const keys = princess.memoryManager.listKeys();
        for (const key of keys) {
          allKeys.add(key);
          if (!keyToPrincess.has(key)) {
            keyToPrincess.set(key, []);
          }
          keyToPrincess.get(key)!.push(principalId);
        }
      }
      // Resolve conflicts and sync
      for (const key of allKeys) {
        const owners = keyToPrincess.get(key) || [];
        if (owners.length > 1) {
          // Conflict detected - resolve
          await this.resolveKeyConflict(key, owners, operation);
        } else if (owners.length === 1) {
          // Single owner - propagate to others if needed
          await this.propagateKey(key, owners[0], principalIds, operation);
        }
      }
      operation.status = 'completed';
      operation.endTime = Date.now();
      this.metrics.totalSyncOperations++;
      this.emit('sync_completed', { syncId, operation });
    } catch (error) {
      operation.status = 'failed';
      operation.endTime = Date.now();
      this.emit('sync_failed', { syncId, error });
    }
    return syncId;
  }
  /**
   * Get status of all Princesses
   */
  getPrincessStatuses(): PrincessMemoryStatus[] {
    this.updateAllPrincessStatuses();
    return Array.from(this.princesses.values()).map(p => ({ ...p.status }));
  }
  /**
   * Get coordinator metrics
   */
  getMetrics(): CoordinatorMetrics {
    this.updateMetrics();
    return { ...this.metrics };
  }
  /**
   * Load balance memory across Princesses
   */
  async loadBalance(): Promise<void> {
    if (!this.config.enableLoadBalancing) {
      return;
    }
    const statuses = this.getPrincessStatuses();
    const overloaded = statuses.filter(s => s.utilizationPercentage > 90);
    const underutilized = statuses.filter(s => s.utilizationPercentage < 50);
    for (const overloadedPrincess of overloaded) {
      const targetPrincess = underutilized.find(p =>
        p.memoryLimit - p.memoryUsage > overloadedPrincess.memoryUsage * 0.2
      );
      if (targetPrincess) {
        // Transfer some entries from overloaded to underutilized
        const princess = this.princesses.get(overloadedPrincess.principalId)!;
        const keys = princess.memoryManager.listKeys().slice(0, 10); // Transfer 10 entries
        await this.transferMemory({
          fromPrincess: overloadedPrincess.principalId,
          toPrincess: targetPrincess.principalId,
          keys,
          preserveOriginal: false,
          priority: 1
        });
        this.emit('load_balanced', {
          from: overloadedPrincess.principalId,
          to: targetPrincess.principalId,
          entriesTransferred: keys.length
        });
      }
    }
  }
  /**
   * Shutdown the coordinator
   */
  async shutdown(): Promise<void> {
    // Stop timers
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }
    // Shutdown all Princess memory systems
    for (const [principalId, princess] of this.princesses.entries()) {
      await princess.memoryManager.shutdown();
      await princess.subscriber.shutdown();
    }
    // Shutdown shared infrastructure
    await this.sharedMemoryBus.shutdown();
    await this.broadcaster.shutdown();
    this.emit('shutdown');
  }
  private async handleCrossPrincessEvent(principalId: string, event: any): Promise<void> {
    // Handle memory events from other Princesses
    if (event.source === principalId) {
      return; // Ignore own events
    }
    const princess = this.princesses.get(principalId);
    if (!princess) return;
    try {
      switch (event.type) {
        case 'store':
        case 'update':
          // Check if we should replicate this data
          if (this.shouldReplicate(principalId, event)) {
            await princess.memoryManager.store(
              event.key,
              event.data,
              event.partitionId
            );
          }
          break;
        case 'remove':
          // Remove if exists
          princess.memoryManager.remove(event.key);
          break;
      }
    } catch (error) {
      this.emit('cross_princess_event_error', { principalId, event, error });
    }
  }
  private shouldReplicate(principalId: string, event: any): boolean {
    const princess = this.princesses.get(principalId);
    if (!princess) return false;
    // Only replicate if partition is relevant to this Princess
    return princess.config.partitionIds.includes(event.partitionId) ||
           event.partitionId === 'shared';
  }
  private async resolveKeyConflict(
    key: string,
    owners: string[],
    operation: SyncOperation
  ): Promise<void> {
    if (!this.config.enableConflictResolution || owners.length < 2) {
      return;
    }
    try {
      // Get all versions of the key
      const entries = await Promise.all(
        owners.map(async (ownerId) => {
          const princess = this.princesses.get(ownerId)!;
          const data = await princess.memoryManager.retrieve(key);
          return {
            ownerId,
            data,
            timestamp: Date.now() // Simplified
          };
        })
      );
      // Create memory entries for conflict resolution
      const memoryEntries = entries.map((entry, index) => ({
        id: key,
        data: entry.data,
        timestamp: entry.timestamp,
        accessCount: 0,
        lastAccessed: Date.now(),
        size: JSON.stringify(entry.data).length,
        partitionId: 'shared',
        version: index + 1
      }));
      if (memoryEntries.length >= 2) {
        const resolved = await this.conflictResolver.resolveConflict(
          memoryEntries[0],
          memoryEntries[1],
          'auto',
          { key, partitionId: 'shared', timestamp: Date.now() }
        );
        // Update all Princesses with resolved version
        for (const ownerId of owners) {
          const princess = this.princesses.get(ownerId)!;
          await princess.memoryManager.store(key, resolved.resolved.data, 'shared');
        }
        operation.conflictsResolved++;
        this.metrics.totalConflicts++;
      }
    } catch (error) {
      this.emit('conflict_resolution_error', { key, owners, error });
    }
  }
  private async propagateKey(
    key: string,
    ownerId: string,
    allPrincipalIds: string[],
    operation: SyncOperation
  ): Promise<void> {
    const ownerPrincess = this.princesses.get(ownerId);
    if (!ownerPrincess) return;
    try {
      const data = await ownerPrincess.memoryManager.retrieve(key);
      if (data === null) return;
      // Propagate to other Princesses that should have this data
      for (const principalId of allPrincipalIds) {
        if (principalId === ownerId) continue;
        const princess = this.princesses.get(principalId);
        if (!princess) continue;
        // Check if this Princess should have this data
        if (this.shouldReplicate(principalId, { partitionId: 'shared', key })) {
          await princess.memoryManager.store(key, data, 'shared');
          operation.entriesSynced++;
        }
      }
    } catch (error) {
      this.emit('propagation_error', { key, ownerId, error });
    }
  }
  private updatePrincessStatus(principalId: string): void {
    const princess = this.princesses.get(principalId);
    if (!princess) return;
    const memoryStats = princess.memoryManager.getStats();
    const cacheMetrics = princess.cache.getMetrics();
    princess.status.memoryUsage = memoryStats.totalSize;
    princess.status.utilizationPercentage =
      (memoryStats.totalSize / princess.status.memoryLimit) * 100;
    princess.status.entryCount = memoryStats.entryCount;
    princess.status.cacheHitRate = cacheMetrics.hitRate /
      Math.max(cacheMetrics.hitRate + cacheMetrics.missRate, 1);
    princess.status.isHealthy = princess.status.utilizationPercentage < 95;
  }
  private updateAllPrincessStatuses(): void {
    for (const principalId of this.princesses.keys()) {
      this.updatePrincessStatus(principalId);
    }
  }
  private updateMetrics(): void {
    let totalMemoryUsed = 0;
    let activePrincesses = 0;
    let totalEntries = 0;
    for (const princess of this.princesses.values()) {
      totalMemoryUsed += princess.status.memoryUsage;
      if (princess.status.isHealthy) {
        activePrincesses++;
      }
      totalEntries += princess.status.entryCount;
    }
    this.metrics.totalMemoryUsed = totalMemoryUsed;
    this.metrics.activePrincesses = activePrincesses;
    // Calculate system health
    const memoryHealth = 1 - (totalMemoryUsed / this.config.totalMemoryLimit);
    const princessHealth = activePrincesses / Math.max(this.princesses.size, 1);
    this.metrics.systemHealth = (memoryHealth + princessHealth) / 2;
  }
  private updateResponseTime(responseTime: number): void {
    // Simple exponential moving average
    const alpha = 0.1;
    this.metrics.averageResponseTime =
      this.metrics.averageResponseTime * (1 - alpha) + responseTime * alpha;
  }
  private startHealthMonitoring(): void {
    this.healthCheckTimer = setInterval(() => {
      this.updateAllPrincessStatuses();
      this.updateMetrics();
      // Check for unhealthy Princesses
      const unhealthyPrincesses = Array.from(this.princesses.values())
        .filter(p => !p.status.isHealthy);
      if (unhealthyPrincesses.length > 0) {
        this.emit('health_warning', {
          unhealthyPrincesses: unhealthyPrincesses.map(p => p.config.principalId)
        });
      }
      // Trigger load balancing if needed
      if (this.config.enableLoadBalancing) {
        this.loadBalance();
      }
    }, this.config.healthCheckInterval);
  }
  private startSyncScheduler(): void {
    this.syncTimer = setInterval(() => {
      // Auto-sync periodically
      this.synchronizeAll('incremental');
    }, this.config.syncInterval);
  }
  private generateSyncId(): string {
    return `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
export default CrossPrincessMemoryCoordinator;