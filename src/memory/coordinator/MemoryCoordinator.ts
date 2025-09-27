import { EventEmitter } from 'events';
import { TTLManager } from '../ttl/TTLManager';
import { MemoryPartitioner } from './MemoryPartitioner';
import { MemoryMetrics } from '../monitoring/MemoryMetrics';
import { MemoryOptimizer } from '../optimization/MemoryOptimizer';
import { MemoryEncryption } from '../security/MemoryEncryption';
import { RealLangroidMemoryManager } from './RealLangroidMemoryManager';
import { RealMemoryCompressor } from '../langroid/RealMemoryCompressor';
export interface MemoryBlock {
  id: string;
  data: any;
  size: number;
  owner: PrincessDomain;
  priority: MemoryPriority;
  createdAt: Date;
  lastAccessedAt: Date;
  ttl: number;
  encrypted: boolean;
  compressed: boolean;
  metadata: Record<string, any>;
}
export enum PrincessDomain {
  INFRASTRUCTURE = 'infrastructure',
  RESEARCH = 'research',
  SHARED = 'shared',
  SYSTEM = 'system'
}
export enum MemoryPriority {
  CRITICAL = 0,
  HIGH = 1,
  MEDIUM = 2,
  LOW = 3,
  BACKGROUND = 4
}
export interface MemoryAllocationRequest {
  size: number;
  domain: PrincessDomain;
  priority: MemoryPriority;
  ttl?: number;
  requireEncryption?: boolean;
  allowCompression?: boolean;
  metadata?: Record<string, any>;
}
export interface MemoryPool {
  totalSize: number;
  usedSize: number;
  availableSize: number;
  fragmentation: number;
  blocks: Map<string, MemoryBlock>;
  allocatedByDomain: Map<PrincessDomain, number>;
}
/**
 * Central Memory Coordinator for 10MB Princess Memory Management
 * Manages memory allocation across Infrastructure and Research Princesses
 * with sophisticated TTL management and performance optimization.
 */
export class MemoryCoordinator extends EventEmitter {
  private static instance: MemoryCoordinator;
  private readonly TOTAL_MEMORY_SIZE = 10 * 1024 * 1024; // 10MB
  private readonly ALLOCATION_MAP = {
    [PrincessDomain.INFRASTRUCTURE]: 0.40, // 4MB
    [PrincessDomain.RESEARCH]: 0.40,       // 4MB
    [PrincessDomain.SHARED]: 0.15,         // 1.5MB
    [PrincessDomain.SYSTEM]: 0.05          // 0.5MB
  };
  private memoryPool: MemoryPool;
  private ttlManager: TTLManager;
  private partitioner: MemoryPartitioner;
  private metrics: MemoryMetrics;
  private optimizer: MemoryOptimizer;
  private encryption: MemoryEncryption;
  private langroidManager: RealLangroidMemoryManager;
  private compressor: RealMemoryCompressor;
  private allocationHistory: Map<string, Date> = new Map();
  private accessPatterns: Map<string, number[]> = new Map();
  private isInitialized = false;
  private constructor() {
    super();
    this.initializeMemoryPool();
    this.initializeComponents();
  }
  public static getInstance(): MemoryCoordinator {
    if (!MemoryCoordinator.instance) {
      MemoryCoordinator.instance = new MemoryCoordinator();
    }
    return MemoryCoordinator.instance;
  }
  private initializeMemoryPool(): void {
    this.memoryPool = {
      totalSize: this.TOTAL_MEMORY_SIZE,
      usedSize: 0,
      availableSize: this.TOTAL_MEMORY_SIZE,
      fragmentation: 0,
      blocks: new Map(),
      allocatedByDomain: new Map(Object.values(PrincessDomain).map(domain => [domain, 0]))
    };
  }
  private initializeComponents(): void {
    this.ttlManager = new TTLManager();
    this.partitioner = new MemoryPartitioner(this.ALLOCATION_MAP, this.TOTAL_MEMORY_SIZE);
    this.metrics = new MemoryMetrics();
    this.optimizer = new MemoryOptimizer();
    this.encryption = new MemoryEncryption();
    this.langroidManager = new RealLangroidMemoryManager();
    this.compressor = new RealMemoryCompressor();
    // Set up TTL expiration handler
    this.ttlManager.on('expired', (blockId: string) => {
      this.deallocateMemory(blockId);
    });
    // Set up optimization schedule
    setInterval(() => this.runOptimization(), 30000); // Every 30 seconds
    this.isInitialized = true;
    this.emit('initialized');
  }
  /**
   * Allocate memory block for Princess domain
   */
  public async allocateMemory(request: MemoryAllocationRequest): Promise<string | null> {
    if (!this.isInitialized) {
      throw new Error('MemoryCoordinator not initialized');
    }
    // Check domain allocation limits
    const domainLimit = this.TOTAL_MEMORY_SIZE * this.ALLOCATION_MAP[request.domain];
    const currentDomainUsage = this.memoryPool.allocatedByDomain.get(request.domain) || 0;
    if (currentDomainUsage + request.size > domainLimit) {
      // Try to free memory through optimization
      await this.optimizer.optimizeDomain(request.domain, this.memoryPool);
      // Check again after optimization
      const newDomainUsage = this.memoryPool.allocatedByDomain.get(request.domain) || 0;
      if (newDomainUsage + request.size > domainLimit) {
        this.emit('allocation-failed', { request, reason: 'domain-limit-exceeded' });
        return null;
      }
    }
    // Check total memory availability
    if (this.memoryPool.availableSize < request.size) {
      // Try to free memory through TTL expiration
      await this.ttlManager.forceExpireLowestPriority(request.size);
      if (this.memoryPool.availableSize < request.size) {
        this.emit('allocation-failed', { request, reason: 'insufficient-memory' });
        return null;
      }
    }
    // Create memory block
    const blockId = this.generateBlockId(request.domain);
    const block: MemoryBlock = {
      id: blockId,
      data: null, // Data will be set separately
      size: request.size,
      owner: request.domain,
      priority: request.priority,
      createdAt: new Date(),
      lastAccessedAt: new Date(),
      ttl: request.ttl || this.getDefaultTTL(request.priority),
      encrypted: request.requireEncryption || false,
      compressed: request.allowCompression || false,
      metadata: request.metadata || {}
    };
    // Update memory pool
    this.memoryPool.blocks.set(blockId, block);
    this.memoryPool.usedSize += request.size;
    this.memoryPool.availableSize -= request.size;
    this.memoryPool.allocatedByDomain.set(
      request.domain,
      (this.memoryPool.allocatedByDomain.get(request.domain) || 0) + request.size
    );
    // Register with TTL manager
    this.ttlManager.registerBlock(blockId, block.ttl, request.priority);
    // Update metrics
    this.metrics.recordAllocation(blockId, request);
    this.allocationHistory.set(blockId, new Date());
    // Update fragmentation
    this.updateFragmentation();
    this.emit('memory-allocated', { blockId, block, request });
    return blockId;
  }
  /**
   * Store data in allocated memory block
   */
  public async storeData(blockId: string, data: any): Promise<boolean> {
    const block = this.memoryPool.blocks.get(blockId);
    if (!block) {
      return false;
    }
    let processedData = data;
    // Apply real LZ4 compression if enabled
    if (block.compressed) {
      if (this.compressor.shouldCompress(data)) {
        const compressed = await this.compressor.compressMemoryBlock(data);
        processedData = compressed.compressed;
        block.metadata = {
          ...block.metadata,
          compressionStats: compressed.metadata
        };
      } else {
        processedData = data;
        block.compressed = false; // Don't compress small data
      }
    }
    // Apply encryption if enabled
    if (block.encrypted) {
      processedData = await this.encryption.encrypt(processedData);
    }
    // Verify size constraints
    const dataSize = this.calculateDataSize(processedData);
    if (dataSize > block.size) {
      this.emit('storage-failed', { blockId, reason: 'data-too-large', dataSize, blockSize: block.size });
      return false;
    }
    block.data = processedData;
    block.lastAccessedAt = new Date();
    // Update access patterns
    this.recordAccess(blockId);
    this.emit('data-stored', { blockId, dataSize });
    return true;
  }
  /**
   * Retrieve data from memory block
   */
  public async retrieveData(blockId: string): Promise<any | null> {
    const block = this.memoryPool.blocks.get(blockId);
    if (!block || !block.data) {
      return null;
    }
    block.lastAccessedAt = new Date();
    this.recordAccess(blockId);
    let data = block.data;
    // Decrypt if necessary
    if (block.encrypted) {
      data = await this.encryption.decrypt(data);
    }
    // Decompress if necessary using real LZ4
    if (block.compressed && Buffer.isBuffer(data)) {
      data = await this.compressor.decompressMemoryBlock(data);
    }
    // Update TTL based on access
    this.ttlManager.updateLastAccess(blockId);
    this.emit('data-retrieved', { blockId });
    return data;
  }
  /**
   * Deallocate memory block
   */
  public deallocateMemory(blockId: string): boolean {
    const block = this.memoryPool.blocks.get(blockId);
    if (!block) {
      return false;
    }
    // Update memory pool
    this.memoryPool.blocks.delete(blockId);
    this.memoryPool.usedSize -= block.size;
    this.memoryPool.availableSize += block.size;
    const currentDomainUsage = this.memoryPool.allocatedByDomain.get(block.owner) || 0;
    this.memoryPool.allocatedByDomain.set(block.owner, currentDomainUsage - block.size);
    // Unregister from TTL manager
    this.ttlManager.unregisterBlock(blockId);
    // Update metrics
    this.metrics.recordDeallocation(blockId, block);
    this.allocationHistory.delete(blockId);
    this.accessPatterns.delete(blockId);
    // Update fragmentation
    this.updateFragmentation();
    this.emit('memory-deallocated', { blockId, block });
    return true;
  }
  /**
   * Get memory usage statistics
   */
  public getMemoryStatus(): MemoryPool & {
    efficiency: number;
    compressionRatio: number;
    domainDistribution: Record<PrincessDomain, { allocated: number; percentage: number }>;
  } {
    const compressionRatio = this.optimizer.getCompressionRatio();
    const efficiency = (this.memoryPool.usedSize / this.TOTAL_MEMORY_SIZE) * 100;
    const domainDistribution: Record<PrincessDomain, { allocated: number; percentage: number }> = {} as any;
    for (const [domain, allocated] of this.memoryPool.allocatedByDomain) {
      domainDistribution[domain] = {
        allocated,
        percentage: (allocated / this.TOTAL_MEMORY_SIZE) * 100
      };
    }
    return {
      ...this.memoryPool,
      efficiency,
      compressionRatio,
      domainDistribution
    };
  }
  /**
   * Force garbage collection and optimization
   */
  public async forceOptimization(): Promise<{ freedMemory: number; optimizations: string[] }> {
    const beforeSize = this.memoryPool.usedSize;
    const optimizations = await this.optimizer.runFullOptimization(this.memoryPool);
    const afterSize = this.memoryPool.usedSize;
    const freedMemory = beforeSize - afterSize;
    this.updateFragmentation();
    this.emit('optimization-completed', { freedMemory, optimizations });
    return { freedMemory, optimizations };
  }
  /**
   * Get access patterns for analytics
   */
  public getAccessPatterns(): Map<string, { blockId: string; accessCount: number; lastAccess: Date }> {
    const patterns = new Map();
    for (const [blockId, accesses] of this.accessPatterns) {
      const block = this.memoryPool.blocks.get(blockId);
      if (block) {
        patterns.set(blockId, {
          blockId,
          accessCount: accesses.length,
          lastAccess: block.lastAccessedAt
        });
      }
    }
    return patterns;
  }
  private generateBlockId(domain: PrincessDomain): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${domain}_${timestamp}_${random}`;
  }
  private getDefaultTTL(priority: MemoryPriority): number {
    const ttlMap = {
      [MemoryPriority.CRITICAL]: 0, // No TTL
      [MemoryPriority.HIGH]: 3600000, // 1 hour
      [MemoryPriority.MEDIUM]: 86400000, // 24 hours
      [MemoryPriority.LOW]: 604800000, // 7 days
      [MemoryPriority.BACKGROUND]: 3600000 // 1 hour
    };
    return ttlMap[priority];
  }
  private calculateDataSize(data: any): number {
    // Calculate actual memory usage instead of rough estimate
    const jsonString = JSON.stringify(data);
    const stringSize = Buffer.byteLength(jsonString, 'utf8');

    // Add overhead for object structure and metadata
    const overhead = 128; // Base overhead per block

    return stringSize + overhead;
  }
  private recordAccess(blockId: string): void {
    const accesses = this.accessPatterns.get(blockId) || [];
    accesses.push(Date.now());
    // Keep only last 100 accesses
    if (accesses.length > 100) {
      accesses.splice(0, accesses.length - 100);
    }
    this.accessPatterns.set(blockId, accesses);
  }
  private updateFragmentation(): void {
    // Simple fragmentation calculation
    const totalBlocks = this.memoryPool.blocks.size;
    const averageBlockSize = totalBlocks > 0 ? this.memoryPool.usedSize / totalBlocks : 0;
    const fragmentationScore = totalBlocks > 0 ? 1 - (averageBlockSize / (this.TOTAL_MEMORY_SIZE / 100)) : 0;
    this.memoryPool.fragmentation = Math.max(0, Math.min(1, fragmentationScore));
  }
  private async runOptimization(): Promise<void> {
    if (this.memoryPool.fragmentation > 0.3 || this.memoryPool.availableSize < this.TOTAL_MEMORY_SIZE * 0.1) {
      await this.optimizer.runOptimization(this.memoryPool);
      this.updateFragmentation();
    }
  }
  /**
   * Shutdown memory coordinator
   */
  public async shutdown(): Promise<void> {
    this.ttlManager.shutdown();
    await this.optimizer.shutdown();
    this.memoryPool.blocks.clear();
    this.allocationHistory.clear();
    this.accessPatterns.clear();
    this.isInitialized = false;
    this.emit('shutdown');
  }
}
export default MemoryCoordinator;