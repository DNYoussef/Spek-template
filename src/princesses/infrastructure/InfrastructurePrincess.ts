import { EventEmitter } from 'events';
import LangroidMemoryBackend from './memory/LangroidMemoryBackend';
import MemoryMetrics from './memory/MemoryMetrics';
import InfrastructureTaskManager from '../../api/infrastructure/InfrastructureTaskManager';
import QueenToInfrastructureAdapter from './adapters/QueenToInfrastructureAdapter';
import InfrastructureReporting from './reporting/InfrastructureReporting';
import TaskPriorityManager from './scheduling/TaskPriorityManager';
import ResourceAllocation from './scheduling/ResourceAllocation';

/**
 * Infrastructure Princess - Main Integration
 * Complete Infrastructure Princess implementation with 10MB Langroid Memory,
 * Queen-Princess-Drone coordination, and enterprise-grade infrastructure management.
 */
export interface InfrastructurePrincessConfig {
  memory: {
    enabled: boolean;
    persistenceEnabled: boolean;
    persistencePath?: string;
    metricsEnabled: boolean;
    metricsInterval?: number;
  };
  taskManagement: {
    maxConcurrentTasks: number;
    maxQueueSize: number;
    defaultRetries: number;
  };
  reporting: {
    enabled: boolean;
    autoReportInterval: number;
    queenEndpoint?: string;
  };
  resourceManagement: {
    enableOptimization: boolean;
    optimizationInterval: number;
  };
}

export interface PrincessStatus {
  status: 'initializing' | 'ready' | 'busy' | 'degraded' | 'offline';
  uptime: number;
  memoryStatus: {
    usedPercent: number;
    entryCount: number;
    hitRate: number;
  };
  taskStatus: {
    activeTasks: number;
    queuedTasks: number;
    completedTasks: number;
    failedTasks: number;
  };
  healthScore: number;
  lastUpdate: number;
}

export class InfrastructurePrincess extends EventEmitter {
  private static readonly DEFAULT_CONFIG: InfrastructurePrincessConfig = {
    memory: {
      enabled: true,
      persistenceEnabled: true,
      metricsEnabled: true,
      metricsInterval: 10000
    },
    taskManagement: {
      maxConcurrentTasks: 10,
      maxQueueSize: 1000,
      defaultRetries: 3
    },
    reporting: {
      enabled: true,
      autoReportInterval: 300000 // 5 minutes
    },
    resourceManagement: {
      enableOptimization: true,
      optimizationInterval: 600000 // 10 minutes
    }
  };

  private config: InfrastructurePrincessConfig;

  // Core components
  private memoryBackend: LangroidMemoryBackend;
  private memoryMetrics: MemoryMetrics;
  private taskManager: InfrastructureTaskManager;
  private adapter: QueenToInfrastructureAdapter;
  private reporting: InfrastructureReporting;
  private priorityManager: TaskPriorityManager;
  private resourceAllocation: ResourceAllocation;

  private status: PrincessStatus;
  private startTime: number;
  private isInitialized: boolean = false;

  constructor(config?: Partial<InfrastructurePrincessConfig>) {
    super();

    this.config = {
      ...InfrastructurePrincess.DEFAULT_CONFIG,
      ...config
    };

    this.status = this.initializeStatus();
    this.startTime = Date.now();

    // Initialize components will be called in initialize()
  }

  /**
   * Initialize Infrastructure Princess
   */
  public async initialize(): Promise<void> {
    try {
      this.status.status = 'initializing';
      this.emit('status-changed', this.status);

      // Initialize memory backend
      this.memoryBackend = new LangroidMemoryBackend(
        {
          enabled: this.config.memory.persistenceEnabled,
          path: this.config.memory.persistencePath
        },
        {
          enabled: this.config.memory.metricsEnabled,
          interval: this.config.memory.metricsInterval
        }
      );

      // Initialize memory metrics
      this.memoryMetrics = new MemoryMetrics(
        this.memoryBackend,
        {
          enabled: this.config.memory.metricsEnabled,
          interval: this.config.memory.metricsInterval
        }
      );

      // Initialize task manager
      this.taskManager = new InfrastructureTaskManager({
        maxConcurrentTasks: this.config.taskManagement.maxConcurrentTasks,
        maxQueueSize: this.config.taskManagement.maxQueueSize
      });

      // Initialize adapter
      this.adapter = new QueenToInfrastructureAdapter(
        this.memoryBackend,
        this.taskManager
      );

      // Initialize reporting
      this.reporting = new InfrastructureReporting(
        this.memoryBackend,
        this.memoryMetrics,
        this.taskManager,
        this.adapter,
        {
          enabled: this.config.reporting.enabled,
          autoReportInterval: this.config.reporting.autoReportInterval,
          queenEndpoint: this.config.reporting.queenEndpoint
        }
      );

      // Initialize priority manager
      this.priorityManager = new TaskPriorityManager({
        agingEnabled: true,
        resourceAwareness: true,
        starvationPrevention: true
      });

      // Initialize resource allocation
      this.resourceAllocation = new ResourceAllocation();

      // Setup event listeners
      this.setupEventListeners();

      // Start optimization if enabled
      if (this.config.resourceManagement.enableOptimization) {
        this.startOptimization();
      }

      this.isInitialized = true;
      this.status.status = 'ready';
      this.updateStatus();

      this.emit('initialized');
      this.emit('status-changed', this.status);

    } catch (error) {
      this.status.status = 'offline';
      this.emit('initialization-failed', error);
      throw error;
    }
  }

  /**
   * Get current status
   */
  public getStatus(): PrincessStatus {
    this.updateStatus();
    return { ...this.status };
  }

  /**
   * Get memory backend instance
   */
  public getMemoryBackend(): LangroidMemoryBackend {
    this.ensureInitialized();
    return this.memoryBackend;
  }

  /**
   * Get task manager instance
   */
  public getTaskManager(): InfrastructureTaskManager {
    this.ensureInitialized();
    return this.taskManager;
  }

  /**
   * Get adapter instance
   */
  public getAdapter(): QueenToInfrastructureAdapter {
    this.ensureInitialized();
    return this.adapter;
  }

  /**
   * Get reporting instance
   */
  public getReporting(): InfrastructureReporting {
    this.ensureInitialized();
    return this.reporting;
  }

  /**
   * Get priority manager instance
   */
  public getPriorityManager(): TaskPriorityManager {
    this.ensureInitialized();
    return this.priorityManager;
  }

  /**
   * Get resource allocation instance
   */
  public getResourceAllocation(): ResourceAllocation {
    this.ensureInitialized();
    return this.resourceAllocation;
  }

  /**
   * Health check
   */
  public async healthCheck(): Promise<{
    overall: 'healthy' | 'degraded' | 'critical';
    components: Record<string, 'healthy' | 'degraded' | 'critical'>;
    details: Record<string, any>;
  }> {
    this.ensureInitialized();

    const results = {
      overall: 'healthy' as const,
      components: {} as Record<string, 'healthy' | 'degraded' | 'critical'>,
      details: {} as Record<string, any>
    };

    try {
      // Check memory backend
      const memoryStats = this.memoryBackend.getStats();
      const memoryUsage = (memoryStats.usedSize / memoryStats.totalSize) * 100;

      results.components.memory = memoryUsage > 90 ? 'critical' :
                                 memoryUsage > 75 ? 'degraded' : 'healthy';
      results.details.memory = {
        usagePercent: memoryUsage,
        hitRate: memoryStats.hitRate,
        entryCount: memoryStats.entryCount
      };

      // Check task manager
      const taskStats = this.taskManager.getStats();
      const errorRate = taskStats.failedTasks / (taskStats.completedTasks + taskStats.failedTasks || 1);

      results.components.taskManager = errorRate > 0.2 ? 'critical' :
                                      errorRate > 0.1 ? 'degraded' : 'healthy';
      results.details.taskManager = {
        activeTasks: taskStats.activeTasks,
        queuedTasks: taskStats.queuedTasks,
        errorRate: errorRate * 100
      };

      // Check resource allocation
      const resourceStats = this.resourceAllocation.getResourceStats();
      const avgUtilization = Array.from(resourceStats.utilizationByType.values())
        .reduce((sum, util) => sum + util, 0) / resourceStats.utilizationByType.size;

      results.components.resourceAllocation = avgUtilization > 90 ? 'critical' :
                                             avgUtilization > 75 ? 'degraded' : 'healthy';
      results.details.resourceAllocation = {
        averageUtilization: avgUtilization,
        activeAllocations: resourceStats.activeAllocations
      };

      // Determine overall health
      const componentStatuses = Object.values(results.components);
      if (componentStatuses.includes('critical')) {
        results.overall = 'critical';
      } else if (componentStatuses.includes('degraded')) {
        results.overall = 'degraded';
      }

      this.emit('health-check-completed', results);

      return results;

    } catch (error) {
      this.emit('health-check-failed', error);
      return {
        overall: 'critical',
        components: { error: 'critical' },
        details: { error: error instanceof Error ? error.message : String(error) }
      };
    }
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<InfrastructurePrincessConfig>): void {
    this.config = { ...this.config, ...newConfig };

    // Apply configuration changes to components
    if (newConfig.memory && this.memoryMetrics) {
      this.memoryMetrics.updateConfig({
        enabled: newConfig.memory.metricsEnabled,
        interval: newConfig.memory.metricsInterval
      });
    }

    if (newConfig.reporting && this.reporting) {
      this.reporting.updateConfig({
        enabled: newConfig.reporting.enabled,
        autoReportInterval: newConfig.reporting.autoReportInterval,
        queenEndpoint: newConfig.reporting.queenEndpoint
      });
    }

    this.emit('config-updated', this.config);
  }

  /**
   * Generate comprehensive status report
   */
  public async generateStatusReport(): Promise<any> {
    this.ensureInitialized();

    return await this.reporting.generateStatusReport();
  }

  /**
   * Process Queen command
   */
  public async processQueenCommand(command: any): Promise<any> {
    this.ensureInitialized();

    this.status.status = 'busy';
    this.emit('status-changed', this.status);

    try {
      const result = await this.adapter.processCommand(command);

      this.status.status = 'ready';
      this.emit('status-changed', this.status);

      return result;

    } catch (error) {
      this.status.status = 'degraded';
      this.emit('status-changed', this.status);
      throw error;
    }
  }

  /**
   * Optimize system resources
   */
  public async optimize(): Promise<void> {
    this.ensureInitialized();

    try {
      // Optimize memory
      await this.memoryBackend.optimize();

      // Optimize task priorities
      this.priorityManager.updateAllPriorities();

      // Optimize resource allocation
      await this.resourceAllocation.optimizeAllocations();

      this.emit('optimization-completed');

    } catch (error) {
      this.emit('optimization-failed', error);
      throw error;
    }
  }

  /**
   * Graceful shutdown
   */
  public async shutdown(): Promise<void> {
    try {
      this.status.status = 'offline';
      this.emit('status-changed', this.status);

      // Shutdown all components
      if (this.reporting) {
        await this.reporting.shutdown();
      }

      if (this.adapter) {
        await this.adapter.shutdown();
      }

      if (this.taskManager) {
        await this.taskManager.shutdown();
      }

      if (this.priorityManager) {
        this.priorityManager.shutdown();
      }

      if (this.resourceAllocation) {
        await this.resourceAllocation.shutdown();
      }

      if (this.memoryMetrics) {
        this.memoryMetrics.shutdown();
      }

      if (this.memoryBackend) {
        await this.memoryBackend.shutdown();
      }

      this.removeAllListeners();
      this.emit('shutdown');

    } catch (error) {
      this.emit('shutdown-error', error);
      throw error;
    }
  }

  // Private methods

  private initializeStatus(): PrincessStatus {
    return {
      status: 'initializing',
      uptime: 0,
      memoryStatus: {
        usedPercent: 0,
        entryCount: 0,
        hitRate: 0
      },
      taskStatus: {
        activeTasks: 0,
        queuedTasks: 0,
        completedTasks: 0,
        failedTasks: 0
      },
      healthScore: 100,
      lastUpdate: Date.now()
    };
  }

  private updateStatus(): void {
    if (!this.isInitialized) return;

    this.status.uptime = Date.now() - this.startTime;
    this.status.lastUpdate = Date.now();

    // Update memory status
    const memoryStats = this.memoryBackend.getStats();
    this.status.memoryStatus = {
      usedPercent: (memoryStats.usedSize / memoryStats.totalSize) * 100,
      entryCount: memoryStats.entryCount,
      hitRate: memoryStats.hitRate * 100
    };

    // Update task status
    const taskStats = this.taskManager.getStats();
    this.status.taskStatus = {
      activeTasks: taskStats.activeTasks,
      queuedTasks: taskStats.queuedTasks,
      completedTasks: taskStats.completedTasks,
      failedTasks: taskStats.failedTasks
    };

    // Calculate health score
    this.status.healthScore = this.calculateHealthScore();
  }

  private calculateHealthScore(): number {
    let score = 100;

    // Memory health impact
    if (this.status.memoryStatus.usedPercent > 90) {
      score -= 30;
    } else if (this.status.memoryStatus.usedPercent > 75) {
      score -= 15;
    }

    if (this.status.memoryStatus.hitRate < 70) {
      score -= 20;
    }

    // Task health impact
    const errorRate = this.status.taskStatus.failedTasks /
      (this.status.taskStatus.completedTasks + this.status.taskStatus.failedTasks || 1);

    if (errorRate > 0.2) {
      score -= 25;
    } else if (errorRate > 0.1) {
      score -= 10;
    }

    if (this.status.taskStatus.queuedTasks > 50) {
      score -= 15;
    }

    return Math.max(0, score);
  }

  private setupEventListeners(): void {
    // Memory backend events
    this.memoryBackend.on('error', (error) => {
      this.emit('component-error', { component: 'memory', error });
    });

    // Task manager events
    this.taskManager.on('error', (error) => {
      this.emit('component-error', { component: 'taskManager', error });
    });

    // Adapter events
    this.adapter.on('command-completed', (result) => {
      this.emit('command-completed', result);
    });

    this.adapter.on('command-failed', (error) => {
      this.emit('command-failed', error);
    });

    // Reporting events
    this.reporting.on('report-generated', (report) => {
      this.emit('report-generated', report);
    });

    // Resource allocation events
    this.resourceAllocation.on('allocation-successful', (allocation) => {
      this.emit('resource-allocated', allocation);
    });

    // Update status on significant events
    this.on('command-completed', () => this.updateStatus());
    this.on('command-failed', () => this.updateStatus());
    this.on('resource-allocated', () => this.updateStatus());
  }

  private startOptimization(): void {
    setInterval(async () => {
      try {
        await this.optimize();
      } catch (error) {
        this.emit('optimization-error', error);
      }
    }, this.config.resourceManagement.optimizationInterval);
  }

  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('Infrastructure Princess not initialized. Call initialize() first.');
    }
  }
}

export default InfrastructurePrincess;