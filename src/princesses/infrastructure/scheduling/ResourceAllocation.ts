import { EventEmitter } from 'events';
import { MemoryPriority } from '../memory/LangroidMemoryBackend';

/**
 * Resource Allocation Manager for Infrastructure Princess
 * Dynamic resource management with intelligent allocation, monitoring,
 * and optimization for infrastructure operations and task execution.
 */
export interface ResourcePool {
  id: string;
  type: ResourceType;
  total: number;
  available: number;
  allocated: number;
  reserved: number;
  unit: string;
  tags: string[];
  constraints: ResourceConstraints;
  healthStatus: ResourceHealth;
}

export enum ResourceType {
  MEMORY = 'memory',
  CPU = 'cpu',
  DISK = 'disk',
  NETWORK = 'network',
  GPU = 'gpu',
  CUSTOM = 'custom'
}

export interface ResourceConstraints {
  minAvailable: number;
  maxUtilization: number;
  allowOvercommit: boolean;
  overcommitRatio: number;
  priorityWeights: Map<MemoryPriority, number>;
}

export enum ResourceHealth {
  HEALTHY = 'healthy',
  WARNING = 'warning',
  CRITICAL = 'critical',
  UNAVAILABLE = 'unavailable'
}

export interface ResourceAllocation {
  id: string;
  resourceType: ResourceType;
  amount: number;
  allocatedTo: string; // Task ID or component ID
  priority: MemoryPriority;
  startTime: number;
  endTime?: number;
  estimatedDuration: number;
  actualDuration?: number;
  tags: string[];
  metadata: Record<string, any>;
}

export interface AllocationRequest {
  requestId: string;
  resourceType: ResourceType;
  amount: number;
  requesterComponent: string;
  requesterId: string;
  priority: MemoryPriority;
  estimatedDuration: number;
  deadline?: number;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface AllocationResult {
  success: boolean;
  allocationId?: string;
  reason?: string;
  alternatives?: AlternativeAllocation[];
  estimatedWaitTime?: number;
}

export interface AlternativeAllocation {
  resourceType: ResourceType;
  amount: number;
  availableAt: number;
  reason: string;
}

export interface ResourceStats {
  totalPools: number;
  activeAllocations: number;
  utilizationByType: Map<ResourceType, number>;
  allocationsByPriority: Map<MemoryPriority, number>;
  averageAllocationDuration: number;
  successfulAllocations: number;
  failedAllocations: number;
  overcommitRatio: number;
}

export interface ResourceForecast {
  resourceType: ResourceType;
  timeHorizon: number; // in milliseconds
  predictedUsage: ForecastPoint[];
  bottlenecks: BottleneckPrediction[];
  recommendations: string[];
}

export interface ForecastPoint {
  timestamp: number;
  predictedUsage: number;
  confidence: number;
}

export interface BottleneckPrediction {
  timestamp: number;
  resourceType: ResourceType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  estimatedDuration: number;
  affectedTasks: string[];
}

export interface OptimizationStrategy {
  id: string;
  name: string;
  description: string;
  resourceType: ResourceType;
  enabled: boolean;
  parameters: Record<string, any>;
}

export class ResourceAllocation extends EventEmitter {
  private static readonly DEFAULT_OVERCOMMIT_RATIO = 1.2;
  private static readonly ALLOCATION_TIMEOUT = 30 * 1000; // 30 seconds
  private static readonly CLEANUP_INTERVAL = 60 * 1000; // 1 minute
  private static readonly FORECAST_HORIZON = 2 * 60 * 60 * 1000; // 2 hours

  private resourcePools: Map<ResourceType, ResourcePool> = new Map();
  private activeAllocations: Map<string, ResourceAllocation> = new Map();
  private allocationHistory: ResourceAllocation[] = [];
  private pendingRequests: Map<string, AllocationRequest> = new Map();

  private optimizationStrategies: Map<string, OptimizationStrategy> = new Map();
  private usageHistory: Map<ResourceType, number[]> = new Map();

  private stats: ResourceStats;
  private cleanupTimer?: NodeJS.Timeout;
  private monitoringTimer?: NodeJS.Timeout;

  private allocationCounter: number = 0;

  constructor() {
    super();

    this.stats = this.initializeStats();
    this.initializeDefaultResourcePools();
    this.initializeOptimizationStrategies();
    this.startMonitoring();
  }

  /**
   * Initialize resource pool
   */
  public initializeResourcePool(
    type: ResourceType,
    total: number,
    unit: string,
    constraints?: Partial<ResourceConstraints>
  ): void {
    try {
      const pool: ResourcePool = {
        id: `pool-${type}-${Date.now()}`,
        type,
        total,
        available: total,
        allocated: 0,
        reserved: 0,
        unit,
        tags: [],
        constraints: {
          minAvailable: constraints?.minAvailable ?? total * 0.1,
          maxUtilization: constraints?.maxUtilization ?? 0.9,
          allowOvercommit: constraints?.allowOvercommit ?? false,
          overcommitRatio: constraints?.overcommitRatio ?? ResourceAllocation.DEFAULT_OVERCOMMIT_RATIO,
          priorityWeights: constraints?.priorityWeights ?? this.getDefaultPriorityWeights()
        },
        healthStatus: ResourceHealth.HEALTHY
      };

      this.resourcePools.set(type, pool);
      this.usageHistory.set(type, []);

      this.emit('resource-pool-initialized', pool);

    } catch (error) {
      this.emit('error', { operation: 'initializeResourcePool', type, error });
      throw error;
    }
  }

  /**
   * Request resource allocation
   */
  public async requestAllocation(request: AllocationRequest): Promise<AllocationResult> {
    try {
      const pool = this.resourcePools.get(request.resourceType);
      if (!pool) {
        return {
          success: false,
          reason: `Resource pool not found for type: ${request.resourceType}`
        };
      }

      // Check immediate availability
      const immediateResult = this.checkImmediateAvailability(request, pool);
      if (immediateResult.success) {
        return immediateResult;
      }

      // Add to pending requests if immediate allocation fails
      this.pendingRequests.set(request.requestId, request);

      // Try to find alternatives or estimate wait time
      const alternatives = this.findAlternatives(request, pool);
      const estimatedWaitTime = this.estimateWaitTime(request, pool);

      return {
        success: false,
        reason: 'Resource not immediately available',
        alternatives,
        estimatedWaitTime
      };

    } catch (error) {
      this.emit('error', { operation: 'requestAllocation', requestId: request.requestId, error });
      return {
        success: false,
        reason: `Allocation request failed: ${error}`
      };
    }
  }

  /**
   * Release resource allocation
   */
  public async releaseAllocation(allocationId: string): Promise<boolean> {
    try {
      const allocation = this.activeAllocations.get(allocationId);
      if (!allocation) {
        return false;
      }

      const pool = this.resourcePools.get(allocation.resourceType);
      if (!pool) {
        return false;
      }

      // Release resources
      pool.allocated -= allocation.amount;
      pool.available += allocation.amount;

      // Mark allocation as completed
      allocation.endTime = Date.now();
      allocation.actualDuration = allocation.endTime - allocation.startTime;

      // Move to history
      this.activeAllocations.delete(allocationId);
      this.allocationHistory.push(allocation);

      // Trim history if needed
      if (this.allocationHistory.length > 1000) {
        this.allocationHistory = this.allocationHistory.slice(-1000);
      }

      // Update pool health
      this.updatePoolHealth(pool);

      // Process pending requests
      await this.processPendingRequests(allocation.resourceType);

      this.emit('allocation-released', { allocationId, allocation });

      return true;

    } catch (error) {
      this.emit('error', { operation: 'releaseAllocation', allocationId, error });
      return false;
    }
  }

  /**
   * Get current resource utilization
   */
  public getResourceUtilization(): Map<ResourceType, number> {
    const utilization = new Map<ResourceType, number>();

    for (const [type, pool] of this.resourcePools) {
      const utilizationPercent = (pool.allocated / pool.total) * 100;
      utilization.set(type, utilizationPercent);
    }

    return utilization;
  }

  /**
   * Get resource statistics
   */
  public getResourceStats(): ResourceStats {
    this.updateStats();
    return { ...this.stats };
  }

  /**
   * Generate resource forecast
   */
  public generateForecast(resourceType: ResourceType, timeHorizon?: number): ResourceForecast {
    try {
      const horizon = timeHorizon || ResourceAllocation.FORECAST_HORIZON;
      const pool = this.resourcePools.get(resourceType);

      if (!pool) {
        throw new Error(`Resource pool not found for type: ${resourceType}`);
      }

      const usage = this.usageHistory.get(resourceType) || [];
      const predictions = this.predictUsage(usage, horizon);
      const bottlenecks = this.identifyBottlenecks(predictions, pool);
      const recommendations = this.generateRecommendations(predictions, bottlenecks, pool);

      return {
        resourceType,
        timeHorizon: horizon,
        predictedUsage: predictions,
        bottlenecks,
        recommendations
      };

    } catch (error) {
      this.emit('error', { operation: 'generateForecast', resourceType, error });
      throw error;
    }
  }

  /**
   * Optimize resource allocation
   */
  public async optimizeAllocations(): Promise<void> {
    try {
      for (const [strategyId, strategy] of this.optimizationStrategies) {
        if (strategy.enabled) {
          await this.applyOptimizationStrategy(strategy);
        }
      }

      this.emit('optimization-completed');

    } catch (error) {
      this.emit('error', { operation: 'optimizeAllocations', error });
    }
  }

  /**
   * Configure optimization strategy
   */
  public configureOptimization(strategyId: string, parameters: Record<string, any>): void {
    const strategy = this.optimizationStrategies.get(strategyId);
    if (strategy) {
      strategy.parameters = { ...strategy.parameters, ...parameters };
      this.emit('optimization-configured', { strategyId, parameters });
    }
  }

  /**
   * Get active allocations
   */
  public getActiveAllocations(): ResourceAllocation[] {
    return Array.from(this.activeAllocations.values());
  }

  /**
   * Get allocation by ID
   */
  public getAllocation(allocationId: string): ResourceAllocation | null {
    return this.activeAllocations.get(allocationId) || null;
  }

  /**
   * Update resource pool constraints
   */
  public updatePoolConstraints(resourceType: ResourceType, constraints: Partial<ResourceConstraints>): void {
    const pool = this.resourcePools.get(resourceType);
    if (pool) {
      pool.constraints = { ...pool.constraints, ...constraints };
      this.emit('pool-constraints-updated', { resourceType, constraints });
    }
  }

  /**
   * Shutdown resource allocation manager
   */
  public async shutdown(): Promise<void> {
    try {
      if (this.cleanupTimer) {
        clearInterval(this.cleanupTimer);
      }

      if (this.monitoringTimer) {
        clearInterval(this.monitoringTimer);
      }

      // Release all active allocations
      for (const allocationId of this.activeAllocations.keys()) {
        await this.releaseAllocation(allocationId);
      }

      this.emit('shutdown');

    } catch (error) {
      this.emit('error', { operation: 'shutdown', error });
    }
  }

  // Private methods

  private initializeDefaultResourcePools(): void {
    // Initialize default pools based on system resources
    this.initializeResourcePool(ResourceType.MEMORY, 1024, 'MB');
    this.initializeResourcePool(ResourceType.CPU, 100, '%');
    this.initializeResourcePool(ResourceType.DISK, 1000, 'MB');
    this.initializeResourcePool(ResourceType.NETWORK, 100, 'MB/s');
  }

  private initializeOptimizationStrategies(): void {
    const strategies: OptimizationStrategy[] = [
      {
        id: 'priority-preemption',
        name: 'Priority-based Preemption',
        description: 'Preempt lower priority allocations for higher priority requests',
        resourceType: ResourceType.MEMORY,
        enabled: true,
        parameters: { preemptionThreshold: 0.9 }
      },
      {
        id: 'load-balancing',
        name: 'Load Balancing',
        description: 'Balance resource usage across available pools',
        resourceType: ResourceType.CPU,
        enabled: true,
        parameters: { balanceThreshold: 0.8 }
      },
      {
        id: 'defragmentation',
        name: 'Resource Defragmentation',
        description: 'Consolidate fragmented resource allocations',
        resourceType: ResourceType.MEMORY,
        enabled: false,
        parameters: { fragmentationThreshold: 0.3 }
      }
    ];

    for (const strategy of strategies) {
      this.optimizationStrategies.set(strategy.id, strategy);
    }
  }

  private initializeStats(): ResourceStats {
    return {
      totalPools: 0,
      activeAllocations: 0,
      utilizationByType: new Map(),
      allocationsByPriority: new Map(),
      averageAllocationDuration: 0,
      successfulAllocations: 0,
      failedAllocations: 0,
      overcommitRatio: 1.0
    };
  }

  private getDefaultPriorityWeights(): Map<MemoryPriority, number> {
    const weights = new Map<MemoryPriority, number>();
    weights.set(MemoryPriority.CRITICAL, 1.0);
    weights.set(MemoryPriority.HIGH, 0.8);
    weights.set(MemoryPriority.MEDIUM, 0.6);
    weights.set(MemoryPriority.LOW, 0.4);
    weights.set(MemoryPriority.CACHE, 0.2);
    return weights;
  }

  private checkImmediateAvailability(request: AllocationRequest, pool: ResourcePool): AllocationResult {
    // Check basic availability
    if (pool.available >= request.amount) {
      return this.allocateResources(request, pool);
    }

    // Check with overcommit if allowed
    if (pool.constraints.allowOvercommit) {
      const maxAllowedAllocation = pool.total * pool.constraints.overcommitRatio;
      if (pool.allocated + request.amount <= maxAllowedAllocation) {
        return this.allocateResources(request, pool);
      }
    }

    // Check if we can preempt lower priority allocations
    if (this.canPreemptForRequest(request, pool)) {
      return this.preemptAndAllocate(request, pool);
    }

    return {
      success: false,
      reason: 'Insufficient resources available'
    };
  }

  private allocateResources(request: AllocationRequest, pool: ResourcePool): AllocationResult {
    try {
      const allocationId = this.generateAllocationId();

      const allocation: ResourceAllocation = {
        id: allocationId,
        resourceType: request.resourceType,
        amount: request.amount,
        allocatedTo: request.requesterId,
        priority: request.priority,
        startTime: Date.now(),
        estimatedDuration: request.estimatedDuration,
        tags: request.tags || [],
        metadata: request.metadata || {}
      };

      // Update pool
      pool.allocated += request.amount;
      pool.available -= request.amount;

      // Store allocation
      this.activeAllocations.set(allocationId, allocation);

      // Update pool health
      this.updatePoolHealth(pool);

      // Remove from pending if it was there
      this.pendingRequests.delete(request.requestId);

      this.stats.successfulAllocations++;

      this.emit('allocation-successful', { allocationId, allocation });

      return {
        success: true,
        allocationId
      };

    } catch (error) {
      this.stats.failedAllocations++;
      this.emit('allocation-failed', { request, error });

      return {
        success: false,
        reason: `Allocation failed: ${error}`
      };
    }
  }

  private canPreemptForRequest(request: AllocationRequest, pool: ResourcePool): boolean {
    // Check if there are lower priority allocations that can be preempted
    const lowerPriorityAllocations = Array.from(this.activeAllocations.values())
      .filter(alloc =>
        alloc.resourceType === request.resourceType &&
        alloc.priority < request.priority
      );

    const preemptableAmount = lowerPriorityAllocations
      .reduce((sum, alloc) => sum + alloc.amount, 0);

    return preemptableAmount >= request.amount;
  }

  private preemptAndAllocate(request: AllocationRequest, pool: ResourcePool): AllocationResult {
    // Find allocations to preempt
    const toPreempt = Array.from(this.activeAllocations.values())
      .filter(alloc =>
        alloc.resourceType === request.resourceType &&
        alloc.priority < request.priority
      )
      .sort((a, b) => a.priority - b.priority); // Lowest priority first

    let preemptedAmount = 0;
    const preemptedAllocations: string[] = [];

    for (const allocation of toPreempt) {
      if (preemptedAmount >= request.amount) break;

      preemptedAmount += allocation.amount;
      preemptedAllocations.push(allocation.id);

      // Release the allocation
      this.releaseAllocation(allocation.id);
    }

    if (preemptedAmount >= request.amount) {
      const result = this.allocateResources(request, pool);
      this.emit('allocations-preempted', { preempted: preemptedAllocations, newAllocation: result.allocationId });
      return result;
    }

    return {
      success: false,
      reason: 'Insufficient resources even after preemption'
    };
  }

  private findAlternatives(request: AllocationRequest, pool: ResourcePool): AlternativeAllocation[] {
    const alternatives: AlternativeAllocation[] = [];

    // Check smaller allocation
    if (request.amount > pool.available && pool.available > 0) {
      alternatives.push({
        resourceType: request.resourceType,
        amount: pool.available,
        availableAt: Date.now(),
        reason: 'Partial allocation available immediately'
      });
    }

    // Check future availability based on scheduled releases
    const futureAvailability = this.calculateFutureAvailability(request.resourceType);
    for (const [timestamp, amount] of futureAvailability) {
      if (amount >= request.amount) {
        alternatives.push({
          resourceType: request.resourceType,
          amount: request.amount,
          availableAt: timestamp,
          reason: 'Full allocation available after scheduled releases'
        });
        break;
      }
    }

    return alternatives;
  }

  private estimateWaitTime(request: AllocationRequest, pool: ResourcePool): number {
    // Calculate based on current allocations and their estimated durations
    const relevantAllocations = Array.from(this.activeAllocations.values())
      .filter(alloc => alloc.resourceType === request.resourceType)
      .sort((a, b) => a.priority - b.priority);

    let cumulativeReleaseTime = Date.now();
    let availableAfterRelease = pool.available;

    for (const allocation of relevantAllocations) {
      const estimatedEndTime = allocation.startTime + allocation.estimatedDuration;
      if (estimatedEndTime > cumulativeReleaseTime) {
        cumulativeReleaseTime = estimatedEndTime;
        availableAfterRelease += allocation.amount;

        if (availableAfterRelease >= request.amount) {
          return cumulativeReleaseTime - Date.now();
        }
      }
    }

    return 0; // Unable to estimate
  }

  private calculateFutureAvailability(resourceType: ResourceType): Map<number, number> {
    const futureAvailability = new Map<number, number>();
    const pool = this.resourcePools.get(resourceType);

    if (!pool) return futureAvailability;

    let currentAvailable = pool.available;
    const scheduleEvents: Array<{ time: number; amount: number }> = [];

    // Add allocation end times
    for (const allocation of this.activeAllocations.values()) {
      if (allocation.resourceType === resourceType) {
        const endTime = allocation.startTime + allocation.estimatedDuration;
        scheduleEvents.push({ time: endTime, amount: allocation.amount });
      }
    }

    // Sort by time
    scheduleEvents.sort((a, b) => a.time - b.time);

    // Calculate availability at each point in time
    for (const event of scheduleEvents) {
      currentAvailable += event.amount;
      futureAvailability.set(event.time, currentAvailable);
    }

    return futureAvailability;
  }

  private updatePoolHealth(pool: ResourcePool): void {
    const utilizationPercent = (pool.allocated / pool.total) * 100;

    if (utilizationPercent > 95) {
      pool.healthStatus = ResourceHealth.CRITICAL;
    } else if (utilizationPercent > pool.constraints.maxUtilization * 100) {
      pool.healthStatus = ResourceHealth.WARNING;
    } else {
      pool.healthStatus = ResourceHealth.HEALTHY;
    }

    this.emit('pool-health-updated', { poolId: pool.id, status: pool.healthStatus });
  }

  private async processPendingRequests(resourceType: ResourceType): Promise<void> {
    const pendingForType = Array.from(this.pendingRequests.values())
      .filter(req => req.resourceType === resourceType)
      .sort((a, b) => b.priority - a.priority); // Highest priority first

    for (const request of pendingForType) {
      const result = await this.requestAllocation(request);
      if (result.success) {
        this.emit('pending-request-fulfilled', { requestId: request.requestId, allocationId: result.allocationId });
      }
    }
  }

  private predictUsage(historicalUsage: number[], timeHorizon: number): ForecastPoint[] {
    const predictions: ForecastPoint[] = [];
    const now = Date.now();
    const intervalMs = 5 * 60 * 1000; // 5-minute intervals

    // Simple linear regression for trend
    const trend = this.calculateTrend(historicalUsage);

    for (let t = now; t < now + timeHorizon; t += intervalMs) {
      const timeDelta = (t - now) / (60 * 60 * 1000); // hours
      const predictedUsage = Math.max(0, trend.slope * timeDelta + trend.intercept);
      const confidence = Math.max(0.1, 1.0 - (timeDelta / 24)); // Decrease confidence over time

      predictions.push({
        timestamp: t,
        predictedUsage,
        confidence
      });
    }

    return predictions;
  }

  private calculateTrend(data: number[]): { slope: number; intercept: number } {
    if (data.length < 2) {
      return { slope: 0, intercept: data[0] || 0 };
    }

    const n = data.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = data.reduce((sum, val) => sum + val, 0);
    const sumXY = data.reduce((sum, val, index) => sum + val * index, 0);
    const sumXX = (n * (n - 1) * (2 * n - 1)) / 6;

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return { slope, intercept };
  }

  private identifyBottlenecks(predictions: ForecastPoint[], pool: ResourcePool): BottleneckPrediction[] {
    const bottlenecks: BottleneckPrediction[] = [];
    const threshold = pool.total * pool.constraints.maxUtilization;

    for (let i = 0; i < predictions.length - 1; i++) {
      const current = predictions[i];
      const next = predictions[i + 1];

      if (current.predictedUsage > threshold && current.confidence > 0.7) {
        let severity: 'low' | 'medium' | 'high' | 'critical';

        if (current.predictedUsage > pool.total * 0.95) {
          severity = 'critical';
        } else if (current.predictedUsage > pool.total * 0.9) {
          severity = 'high';
        } else if (current.predictedUsage > pool.total * 0.85) {
          severity = 'medium';
        } else {
          severity = 'low';
        }

        // Calculate duration
        let duration = 0;
        for (let j = i; j < predictions.length && predictions[j].predictedUsage > threshold; j++) {
          duration += 5 * 60 * 1000; // 5-minute intervals
        }

        bottlenecks.push({
          timestamp: current.timestamp,
          resourceType: pool.type,
          severity,
          estimatedDuration: duration,
          affectedTasks: [] // Would be populated with actual task analysis
        });
      }
    }

    return bottlenecks;
  }

  private generateRecommendations(
    predictions: ForecastPoint[],
    bottlenecks: BottleneckPrediction[],
    pool: ResourcePool
  ): string[] {
    const recommendations: string[] = [];

    if (bottlenecks.length > 0) {
      recommendations.push(`${bottlenecks.length} potential bottlenecks detected for ${pool.type}`);

      const criticalBottlenecks = bottlenecks.filter(b => b.severity === 'critical').length;
      if (criticalBottlenecks > 0) {
        recommendations.push(`Consider immediate scaling for ${pool.type} resources`);
      }
    }

    const avgUtilization = predictions.reduce((sum, p) => sum + p.predictedUsage, 0) / predictions.length;
    if (avgUtilization > pool.total * 0.8) {
      recommendations.push(`High average utilization predicted for ${pool.type} - consider capacity planning`);
    }

    return recommendations;
  }

  private async applyOptimizationStrategy(strategy: OptimizationStrategy): Promise<void> {
    try {
      switch (strategy.id) {
        case 'priority-preemption':
          await this.optimizePriorityPreemption(strategy);
          break;
        case 'load-balancing':
          await this.optimizeLoadBalancing(strategy);
          break;
        case 'defragmentation':
          await this.optimizeDefragmentation(strategy);
          break;
      }
    } catch (error) {
      this.emit('optimization-error', { strategyId: strategy.id, error });
    }
  }

  private async optimizePriorityPreemption(strategy: OptimizationStrategy): Promise<void> {
    // Implementation would analyze current allocations and preempt if needed
    this.emit('optimization-applied', { strategyId: strategy.id, action: 'priority-preemption-checked' });
  }

  private async optimizeLoadBalancing(strategy: OptimizationStrategy): Promise<void> {
    // Implementation would balance load across pools
    this.emit('optimization-applied', { strategyId: strategy.id, action: 'load-balanced' });
  }

  private async optimizeDefragmentation(strategy: OptimizationStrategy): Promise<void> {
    // Implementation would consolidate fragmented allocations
    this.emit('optimization-applied', { strategyId: strategy.id, action: 'defragmented' });
  }

  private updateStats(): void {
    this.stats.totalPools = this.resourcePools.size;
    this.stats.activeAllocations = this.activeAllocations.size;

    // Update utilization by type
    this.stats.utilizationByType.clear();
    for (const [type, pool] of this.resourcePools) {
      const utilization = (pool.allocated / pool.total) * 100;
      this.stats.utilizationByType.set(type, utilization);
    }

    // Update allocations by priority
    this.stats.allocationsByPriority.clear();
    for (const allocation of this.activeAllocations.values()) {
      const current = this.stats.allocationsByPriority.get(allocation.priority) || 0;
      this.stats.allocationsByPriority.set(allocation.priority, current + 1);
    }

    // Calculate average allocation duration
    if (this.allocationHistory.length > 0) {
      const totalDuration = this.allocationHistory
        .filter(alloc => alloc.actualDuration)
        .reduce((sum, alloc) => sum + (alloc.actualDuration || 0), 0);
      const completedAllocations = this.allocationHistory.filter(alloc => alloc.actualDuration).length;

      this.stats.averageAllocationDuration = completedAllocations > 0
        ? totalDuration / completedAllocations
        : 0;
    }

    // Calculate overcommit ratio
    let totalAllocated = 0;
    let totalCapacity = 0;
    for (const pool of this.resourcePools.values()) {
      totalAllocated += pool.allocated;
      totalCapacity += pool.total;
    }
    this.stats.overcommitRatio = totalCapacity > 0 ? totalAllocated / totalCapacity : 0;
  }

  private startMonitoring(): void {
    // Start cleanup timer
    this.cleanupTimer = setInterval(() => {
      this.cleanupExpiredAllocations();
    }, ResourceAllocation.CLEANUP_INTERVAL);

    // Start monitoring timer
    this.monitoringTimer = setInterval(() => {
      this.recordUsageMetrics();
      this.updateStats();
    }, 30 * 1000); // Every 30 seconds
  }

  private cleanupExpiredAllocations(): void {
    const now = Date.now();
    const expiredAllocations: string[] = [];

    for (const [id, allocation] of this.activeAllocations) {
      const estimatedEndTime = allocation.startTime + allocation.estimatedDuration;
      if (now > estimatedEndTime + (5 * 60 * 1000)) { // 5 minutes grace period
        expiredAllocations.push(id);
      }
    }

    for (const id of expiredAllocations) {
      this.releaseAllocation(id);
      this.emit('allocation-expired', { allocationId: id });
    }
  }

  private recordUsageMetrics(): void {
    for (const [type, pool] of this.resourcePools) {
      const usage = (pool.allocated / pool.total) * 100;
      const history = this.usageHistory.get(type) || [];

      history.push(usage);

      // Keep only last 24 hours of data (assuming 30-second intervals)
      const maxEntries = (24 * 60 * 60) / 30;
      if (history.length > maxEntries) {
        history.splice(0, history.length - maxEntries);
      }

      this.usageHistory.set(type, history);
    }
  }

  private generateAllocationId(): string {
    this.allocationCounter++;
    return `alloc-${Date.now()}-${this.allocationCounter.toString().padStart(4, '0')}`;
  }
}

export default ResourceAllocation;