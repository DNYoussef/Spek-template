import { EventEmitter } from 'events';
import MemoryCoordinator, { MemoryAllocationRequest, MemoryPriority, PrincessDomain } from '../coordinator/MemoryCoordinator';
export interface InfrastructureMemoryContext {
  deploymentId: string;
  serviceType: 'kubernetes' | 'docker' | 'serverless' | 'vm' | 'container';
  environment: 'development' | 'staging' | 'production';
  region: string;
  clusterId?: string;
  namespace?: string;
}
export interface InfrastructureMemoryEntry {
  id: string;
  context: InfrastructureMemoryContext;
  data: any;
  size: number;
  priority: MemoryPriority;
  tags: string[];
  relationships: string[];
  lastUpdated: Date;
  accessPattern: 'sequential' | 'random' | 'bulk' | 'streaming';
}
export interface InfrastructureQueryOptions {
  deploymentId?: string;
  serviceType?: string;
  environment?: string;
  region?: string;
  tags?: string[];
  priority?: MemoryPriority;
  includeRelated?: boolean;
  maxResults?: number;
}
/**
 * Infrastructure Princess Memory Adapter
 * Specialized memory interface for Infrastructure Princess operations
 * including deployment data, service configurations, and resource state.
 */
export class InfrastructureMemoryAdapter extends EventEmitter {
  private memoryCoordinator: MemoryCoordinator;
  private memoryIndex: Map<string, string> = new Map(); // context -> blockId mapping
  private contextIndex: Map<string, InfrastructureMemoryContext[]> = new Map(); // deployment -> contexts
  private tagIndex: Map<string, string[]> = new Map(); // tag -> blockIds
  private relationshipGraph: Map<string, Set<string>> = new Map(); // blockId -> related blockIds
  private readonly DOMAIN = PrincessDomain.INFRASTRUCTURE;
  private readonly DEFAULT_TTL = 3600000; // 1 hour for infrastructure data
  constructor() {
    super();
    this.memoryCoordinator = MemoryCoordinator.getInstance();
  }
  /**
   * Store infrastructure deployment configuration
   */
  public async storeDeploymentConfig(
    context: InfrastructureMemoryContext,
    config: any,
    options: {
      priority?: MemoryPriority;
      ttl?: number;
      tags?: string[];
      relationships?: string[];
    } = {}
  ): Promise<string | null> {
    const size = this.calculateSize(config);
    const priority = options.priority || MemoryPriority.HIGH;
    const ttl = options.ttl || this.DEFAULT_TTL;
    const request: MemoryAllocationRequest = {
      size,
      domain: this.DOMAIN,
      priority,
      ttl,
      requireEncryption: context.environment === 'production',
      allowCompression: true,
      metadata: {
        type: 'deployment-config',
        context,
        tags: options.tags || [],
        relationships: options.relationships || []
      }
    };
    const blockId = await this.memoryCoordinator.allocateMemory(request);
    if (!blockId) {
      this.emit('storage-failed', { context, reason: 'allocation-failed' });
      return null;
    }
    // Create memory entry
    const entry: InfrastructureMemoryEntry = {
      id: blockId,
      context,
      data: config,
      size,
      priority,
      tags: options.tags || [],
      relationships: options.relationships || [],
      lastUpdated: new Date(),
      accessPattern: 'random'
    };
    // Store data
    const stored = await this.memoryCoordinator.storeData(blockId, entry);
    if (!stored) {
      await this.memoryCoordinator.deallocateMemory(blockId);
      this.emit('storage-failed', { context, reason: 'data-storage-failed' });
      return null;
    }
    // Update indexes
    this.updateIndexes(blockId, entry);
    this.emit('deployment-config-stored', { blockId, context, size });
    return blockId;
  }
  /**
   * Store service state information
   */
  public async storeServiceState(
    context: InfrastructureMemoryContext,
    state: any,
    options: {
      priority?: MemoryPriority;
      ttl?: number;
      tags?: string[];
    } = {}
  ): Promise<string | null> {
    const size = this.calculateSize(state);
    const priority = options.priority || MemoryPriority.MEDIUM;
    const ttl = options.ttl || (this.DEFAULT_TTL / 2); // Shorter TTL for state data
    const request: MemoryAllocationRequest = {
      size,
      domain: this.DOMAIN,
      priority,
      ttl,
      allowCompression: true,
      metadata: {
        type: 'service-state',
        context,
        tags: options.tags || []
      }
    };
    const blockId = await this.memoryCoordinator.allocateMemory(request);
    if (!blockId) {
      return null;
    }
    const entry: InfrastructureMemoryEntry = {
      id: blockId,
      context,
      data: state,
      size,
      priority,
      tags: options.tags || [],
      relationships: [],
      lastUpdated: new Date(),
      accessPattern: 'streaming'
    };
    const stored = await this.memoryCoordinator.storeData(blockId, entry);
    if (!stored) {
      await this.memoryCoordinator.deallocateMemory(blockId);
      return null;
    }
    this.updateIndexes(blockId, entry);
    this.emit('service-state-stored', { blockId, context, size });
    return blockId;
  }
  /**
   * Store resource monitoring data
   */
  public async storeResourceMetrics(
    context: InfrastructureMemoryContext,
    metrics: any,
    options: {
      batchSize?: number;
      retentionTime?: number;
    } = {}
  ): Promise<string | null> {
    const size = this.calculateSize(metrics);
    const priority = MemoryPriority.LOW; // Metrics are lower priority
    const ttl = options.retentionTime || (this.DEFAULT_TTL / 4); // 15 minutes default
    const request: MemoryAllocationRequest = {
      size,
      domain: this.DOMAIN,
      priority,
      ttl,
      allowCompression: true,
      metadata: {
        type: 'resource-metrics',
        context,
        batchSize: options.batchSize || 1
      }
    };
    const blockId = await this.memoryCoordinator.allocateMemory(request);
    if (!blockId) {
      return null;
    }
    const entry: InfrastructureMemoryEntry = {
      id: blockId,
      context,
      data: metrics,
      size,
      priority,
      tags: ['metrics', 'monitoring'],
      relationships: [],
      lastUpdated: new Date(),
      accessPattern: 'sequential'
    };
    const stored = await this.memoryCoordinator.storeData(blockId, entry);
    if (!stored) {
      await this.memoryCoordinator.deallocateMemory(blockId);
      return null;
    }
    this.updateIndexes(blockId, entry);
    this.emit('resource-metrics-stored', { blockId, context, size });
    return blockId;
  }
  /**
   * Retrieve infrastructure data by context
   */
  public async getByContext(context: Partial<InfrastructureMemoryContext>): Promise<InfrastructureMemoryEntry[]> {
    const results: InfrastructureMemoryEntry[] = [];
    for (const [contextKey, blockId] of this.memoryIndex) {
      const storedContext = JSON.parse(contextKey);
      if (this.matchesContext(storedContext, context)) {
        const entry = await this.getEntry(blockId);
        if (entry) {
          results.push(entry);
        }
      }
    }
    this.emit('context-query-executed', { context, resultCount: results.length });
    return results;
  }
  /**
   * Query infrastructure data with advanced options
   */
  public async query(options: InfrastructureQueryOptions): Promise<InfrastructureMemoryEntry[]> {
    let candidates: string[] = [];
    // Start with all blocks if no specific filters
    if (!options.deploymentId && !options.tags?.length) {
      candidates = Array.from(this.memoryIndex.values());
    }
    // Filter by deployment
    if (options.deploymentId) {
      const contexts = this.contextIndex.get(options.deploymentId) || [];
      candidates = contexts.map(ctx => this.memoryIndex.get(JSON.stringify(ctx))).filter(Boolean) as string[];
    }
    // Filter by tags
    if (options.tags?.length) {
      const tagResults = options.tags.map(tag => this.tagIndex.get(tag) || []);
      const intersection = tagResults.reduce((acc, tagBlocks) =>
        acc.filter(blockId => tagBlocks.includes(blockId)), tagResults[0] || []
      );
      candidates = candidates.length ? candidates.filter(id => intersection.includes(id)) : intersection;
    }
    // Retrieve and filter entries
    const results: InfrastructureMemoryEntry[] = [];
    for (const blockId of candidates) {
      const entry = await this.getEntry(blockId);
      if (!entry) continue;
      // Apply additional filters
      if (options.serviceType && entry.context.serviceType !== options.serviceType) continue;
      if (options.environment && entry.context.environment !== options.environment) continue;
      if (options.region && entry.context.region !== options.region) continue;
      if (options.priority !== undefined && entry.priority !== options.priority) continue;
      results.push(entry);
      // Include related entries if requested
      if (options.includeRelated) {
        const relatedIds = this.relationshipGraph.get(blockId) || new Set();
        for (const relatedId of relatedIds) {
          const relatedEntry = await this.getEntry(relatedId);
          if (relatedEntry && !results.some(r => r.id === relatedId)) {
            results.push(relatedEntry);
          }
        }
      }
      // Respect max results limit
      if (options.maxResults && results.length >= options.maxResults) {
        break;
      }
    }
    this.emit('advanced-query-executed', { options, resultCount: results.length });
    return results;
  }
  /**
   * Update existing infrastructure data
   */
  public async updateData(blockId: string, newData: any): Promise<boolean> {
    const entry = await this.getEntry(blockId);
    if (!entry) {
      return false;
    }
    const newSize = this.calculateSize(newData);
    // Check if new data fits in existing allocation
    if (newSize > entry.size) {
      // Need to reallocate
      const newBlockId = await this.storeDeploymentConfig(
        entry.context,
        newData,
        {
          priority: entry.priority,
          tags: entry.tags,
          relationships: entry.relationships
        }
      );
      if (newBlockId) {
        await this.removeData(blockId);
        this.emit('data-updated-with-reallocation', { oldBlockId: blockId, newBlockId });
        return true;
      }
      return false;
    }
    // Update in place
    entry.data = newData;
    entry.lastUpdated = new Date();
    const stored = await this.memoryCoordinator.storeData(blockId, entry);
    if (stored) {
      this.emit('data-updated-in-place', { blockId });
    }
    return stored;
  }
  /**
   * Remove infrastructure data
   */
  public async removeData(blockId: string): Promise<boolean> {
    const entry = await this.getEntry(blockId);
    if (!entry) {
      return false;
    }
    // Remove from indexes
    const contextKey = JSON.stringify(entry.context);
    this.memoryIndex.delete(contextKey);
    // Remove from context index
    const contexts = this.contextIndex.get(entry.context.deploymentId) || [];
    const updatedContexts = contexts.filter(ctx => JSON.stringify(ctx) !== contextKey);
    if (updatedContexts.length > 0) {
      this.contextIndex.set(entry.context.deploymentId, updatedContexts);
    } else {
      this.contextIndex.delete(entry.context.deploymentId);
    }
    // Remove from tag index
    for (const tag of entry.tags) {
      const taggedBlocks = this.tagIndex.get(tag) || [];
      const updatedTaggedBlocks = taggedBlocks.filter(id => id !== blockId);
      if (updatedTaggedBlocks.length > 0) {
        this.tagIndex.set(tag, updatedTaggedBlocks);
      } else {
        this.tagIndex.delete(tag);
      }
    }
    // Remove relationships
    this.relationshipGraph.delete(blockId);
    for (const [, relatedSet] of this.relationshipGraph) {
      relatedSet.delete(blockId);
    }
    // Deallocate memory
    const deallocated = this.memoryCoordinator.deallocateMemory(blockId);
    if (deallocated) {
      this.emit('data-removed', { blockId, context: entry.context });
    }
    return deallocated;
  }
  /**
   * Get infrastructure memory statistics
   */
  public getStatistics(): {
    totalEntries: number;
    deployments: number;
    totalSize: number;
    serviceTypes: Record<string, number>;
    environments: Record<string, number>;
    priorityDistribution: Record<MemoryPriority, number>;
    averageEntrySize: number;
  } {
    const stats = {
      totalEntries: this.memoryIndex.size,
      deployments: this.contextIndex.size,
      totalSize: 0,
      serviceTypes: {} as Record<string, number>,
      environments: {} as Record<string, number>,
      priorityDistribution: {} as Record<MemoryPriority, number>,
      averageEntrySize: 0
    };
    // This would need to be implemented with actual entry retrieval
    // For now, return basic statistics from indexes
    return stats;
  }
  private async getEntry(blockId: string): Promise<InfrastructureMemoryEntry | null> {
    const data = await this.memoryCoordinator.retrieveData(blockId);
    return data as InfrastructureMemoryEntry | null;
  }
  private updateIndexes(blockId: string, entry: InfrastructureMemoryEntry): void {
    // Update memory index
    const contextKey = JSON.stringify(entry.context);
    this.memoryIndex.set(contextKey, blockId);
    // Update context index
    const contexts = this.contextIndex.get(entry.context.deploymentId) || [];
    contexts.push(entry.context);
    this.contextIndex.set(entry.context.deploymentId, contexts);
    // Update tag index
    for (const tag of entry.tags) {
      const taggedBlocks = this.tagIndex.get(tag) || [];
      taggedBlocks.push(blockId);
      this.tagIndex.set(tag, taggedBlocks);
    }
    // Update relationship graph
    if (entry.relationships.length > 0) {
      const relatedSet = this.relationshipGraph.get(blockId) || new Set();
      for (const relatedId of entry.relationships) {
        relatedSet.add(relatedId);
      }
      this.relationshipGraph.set(blockId, relatedSet);
    }
  }
  private matchesContext(
    stored: InfrastructureMemoryContext,
    query: Partial<InfrastructureMemoryContext>
  ): boolean {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && stored[key as keyof InfrastructureMemoryContext] !== value) {
        return false;
      }
    }
    return true;
  }
  private calculateSize(data: any): number {
    return JSON.stringify(data).length * 2; // UTF-16 estimate
  }
}
export default InfrastructureMemoryAdapter;