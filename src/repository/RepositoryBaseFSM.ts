/**
 * RepositoryBaseFSM.ts
 * Unified Repository Base with FSM integration
 * Coordinates all repository operations through component delegation
 */

import { EventEmitter } from 'events';
import { RepositoryTransitionHub, RepositoryState, RepositoryEvent, RepositoryContext } from './fsm/RepositoryTransitionHub';
import { DataAccessLayer, DataSource, QueryOperation, QueryResult } from './core/DataAccessLayer';
import { QueryEngine, QueryPlan } from './core/QueryEngine';
import { CacheManager, CacheConfig } from './core/CacheManager';
import { TransactionHandler, TransactionConfig, IsolationLevel } from './core/TransactionHandler';

export interface RepositoryConfig {
  dataSource: DataSource;
  cache?: Partial<CacheConfig>;
  transaction?: Partial<TransactionConfig>;
  enableMetrics?: boolean;
  enableAudit?: boolean;
}

export interface RepositoryMetrics {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  avgResponseTime: number;
  cacheHitRate: number;
  activeTransactions: number;
}

/**
 * Unified Repository Base with FSM coordination
 * All repository operations flow through this FSM
 */
export class RepositoryBaseFSM extends EventEmitter {
  private transitionHub: RepositoryTransitionHub;
  private dataAccess: DataAccessLayer;
  private queryEngine: QueryEngine;
  private cacheManager: CacheManager;
  private transactionHandler: TransactionHandler;

  private config: RepositoryConfig;
  private connectionId?: string;
  private metrics: RepositoryMetrics = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    avgResponseTime: 0,
    cacheHitRate: 0,
    activeTransactions: 0
  };

  constructor(config: RepositoryConfig) {
    super();
    this.config = config;

    // Initialize FSM components
    this.transitionHub = new RepositoryTransitionHub();
    this.dataAccess = new DataAccessLayer(this.transitionHub);
    this.queryEngine = new QueryEngine(this.transitionHub);
    this.cacheManager = new CacheManager(this.transitionHub, config.cache);
    this.transactionHandler = new TransactionHandler(this.transitionHub);

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    // FSM event handlers
    this.transitionHub.on('stateChanged', (event) => {
      this.emit('stateChanged', event);
      this.updateMetrics(event);
    });

    this.transitionHub.on('transitionError', (event) => {
      this.emit('error', event.error);
      this.metrics.failedOperations++;
    });

    // Component event handlers
    this.dataAccess.on('connectionEstablished', (event) => {
      this.connectionId = event.connectionId;
      this.emit('connected', event);
    });

    this.queryEngine.on('queryPlanExecuted', (event) => {
      this.metrics.successfulOperations++;
      this.emit('queryExecuted', event);
    });

    this.cacheManager.on('cacheHit', () => {
      this.updateCacheMetrics();
    });

    this.transactionHandler.on('transactionStarted', () => {
      this.metrics.activeTransactions++;
    });

    this.transactionHandler.on('transactionCommitted', () => {
      this.metrics.activeTransactions--;
    });

    this.transactionHandler.on('transactionRolledBack', () => {
      this.metrics.activeTransactions--;
    });
  }

  async initializeComponent(): Promise<void> {
    if (!this.transitionHub.canConnect()) {
      throw new Error('Repository already initialized');
    }

    try {
      this.connectionId = await this.dataAccess.connect(this.config.dataSource);
      this.emit('initialized', { connectionId: this.connectionId });
    } catch (error) {
      this.emit('initializationFailed', { error });
      throw error;
    }
  }

  async read<T>(query: string | object, parameters?: any[], useCache: boolean = true): Promise<T[]> {
    return this.executeOperation<T[]>({
      id: this.generateOperationId('read'),
      type: 'read',
      query,
      parameters
    }, useCache);
  }

  async write<T>(data: T, query?: string | object): Promise<{ id: string; data: T }> {
    return this.executeOperation<{ id: string; data: T }>({
      id: this.generateOperationId('write'),
      type: 'write',
      query: query || data,
      parameters: []
    }, false);
  }

  async update<T>(query: string | object, data: Partial<T>, parameters?: any[]): Promise<{ updated: boolean; rows: number }> {
    return this.executeOperation<{ updated: boolean; rows: number }>({
      id: this.generateOperationId('update'),
      type: 'update',
      query,
      parameters: [...(parameters || []), data]
    }, false);
  }

  async delete(query: string | object, parameters?: any[]): Promise<{ deleted: boolean; rows: number }> {
    return this.executeOperation<{ deleted: boolean; rows: number }>({
      id: this.generateOperationId('delete'),
      type: 'delete',
      query,
      parameters
    }, false);
  }

  private async executeOperation<T>(operation: QueryOperation, useCache: boolean): Promise<T> {
    const startTime = Date.now();
    this.metrics.totalOperations++;

    try {
      // Check cache first for read operations
      if (useCache && operation.type === 'read') {
        const cacheKey = this.generateCacheKey(operation);
        const cachedResult = await this.cacheManager.get<T>(cacheKey);

        if (cachedResult !== null) {
          this.updateResponseTime(Date.now() - startTime);
          return cachedResult;
        }
      }

      // Create and execute query plan
      const plan = await this.queryEngine.createQueryPlan(operation);
      const result = await this.queryEngine.executeQueryPlan(plan);

      // Cache read results
      if (useCache && operation.type === 'read' && result.data) {
        const cacheKey = this.generateCacheKey(operation);
        await this.cacheManager.set(cacheKey, result.data, {
          ttl: 300000, // 5 minutes
          tags: [operation.type, 'query_result']
        });
      }

      this.updateResponseTime(Date.now() - startTime);
      return result.data;
    } catch (error) {
      this.metrics.failedOperations++;
      this.updateResponseTime(Date.now() - startTime);
      throw error;
    }
  }

  // Transaction methods
  async withTransaction<T>(
    operations: (txn: TransactionContext) => Promise<T>,
    config?: Partial<TransactionConfig>
  ): Promise<T> {
    const transactionId = await this.transactionHandler.beginTransaction(config);
    const context = new TransactionContext(transactionId, this.transactionHandler, this.queryEngine);

    try {
      const result = await operations(context);
      await this.transactionHandler.commitTransaction(transactionId);
      return result;
    } catch (error) {
      await this.transactionHandler.rollbackTransaction(transactionId, `Operation failed: ${error}`);
      throw error;
    }
  }

  async beginTransaction(config?: Partial<TransactionConfig>): Promise<string> {
    return this.transactionHandler.beginTransaction(config);
  }

  async commitTransaction(transactionId: string): Promise<void> {
    return this.transactionHandler.commitTransaction(transactionId);
  }

  async rollbackTransaction(transactionId: string, reason?: string): Promise<void> {
    return this.transactionHandler.rollbackTransaction(transactionId, reason);
  }

  // Cache methods
  async clearCache(pattern?: string): Promise<void> {
    if (pattern) {
      const keys = await this.cacheManager.keys();
      const matchingKeys = keys.filter(key => key.includes(pattern));

      for (const key of matchingKeys) {
        await this.cacheManager.delete(key);
      }
    } else {
      await this.cacheManager.clear();
    }
  }

  async warmupCache(entries: Array<{ query: QueryOperation; data: any }>): Promise<void> {
    const cacheEntries = entries.map(entry => ({
      key: this.generateCacheKey(entry.query),
      value: entry.data,
      options: { ttl: 300000, tags: ['warmup'] }
    }));

    await this.cacheManager.warmup(cacheEntries);
  }

  // Utility methods
  getCurrentState(): RepositoryState {
    return this.transitionHub.getCurrentState();
  }

  getMetrics(): RepositoryMetrics {
    return {
      ...this.metrics,
      cacheHitRate: this.cacheManager.getStats().hitRate,
      activeTransactions: this.transactionHandler.getActiveTransactions().length
    };
  }

  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    components: Record<string, boolean>;
    metrics: RepositoryMetrics;
  }> {
    const components = {
      fsm: !this.transitionHub.isInErrorState(),
      connection: !!this.connectionId,
      cache: this.cacheManager.getStats().size >= 0,
      transactions: this.transactionHandler.getActiveTransactions().length < 100
    };

    const healthy = Object.values(components).every(status => status);
    const degraded = Object.values(components).some(status => !status);

    return {
      status: healthy ? 'healthy' : degraded ? 'degraded' : 'unhealthy',
      components,
      metrics: this.getMetrics()
    };
  }

  async reset(): Promise<void> {
    // Rollback all active transactions
    const activeTransactions = this.transactionHandler.getActiveTransactions();
    for (const transaction of activeTransactions) {
      await this.transactionHandler.rollbackTransaction(transaction.id, 'Repository reset');
    }

    // Clear cache
    await this.cacheManager.clear();

    // Close connections
    await this.dataAccess.closeAllConnections();

    // Reset FSM
    this.transitionHub.reset();

    // Reset metrics
    this.metrics = {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      avgResponseTime: 0,
      cacheHitRate: 0,
      activeTransactions: 0
    };

    this.connectionId = undefined;
    this.emit('reset');
  }

  async destroy(): Promise<void> {
    await this.reset();
    this.cacheManager.destroy();
    this.removeAllListeners();
  }

  private generateOperationId(type: string): string {
    return `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateCacheKey(operation: QueryOperation): string {
    const queryStr = JSON.stringify(operation.query);
    const paramsStr = JSON.stringify(operation.parameters || []);
    return `${operation.type}_${Buffer.from(queryStr + paramsStr).toString('base64').substr(0, 32)}`;
  }

  private updateMetrics(event: any): void {
    // Update metrics based on FSM events
    if (event.to === RepositoryState.ERROR) {
      this.metrics.failedOperations++;
    }
  }

  private updateResponseTime(responseTime: number): void {
    this.metrics.avgResponseTime =
      (this.metrics.avgResponseTime * (this.metrics.totalOperations - 1) + responseTime) /
      this.metrics.totalOperations;
  }

  private updateCacheMetrics(): void {
    this.metrics.cacheHitRate = this.cacheManager.getStats().hitRate;
  }
}

/**
 * Transaction context for scoped operations
 */
export class TransactionContext {
  constructor(
    private transactionId: string,
    private transactionHandler: TransactionHandler,
    private queryEngine: QueryEngine
  ) {}

  async read<T>(query: string | object, parameters?: any[]): Promise<T[]> {
    const operation: QueryOperation = {
      id: this.generateOperationId('read'),
      type: 'read',
      query,
      parameters
    };

    const operationId = await this.transactionHandler.addOperation(this.transactionId, operation);
    const result = await this.transactionHandler.executeOperation(this.transactionId, operationId);
    return result.data;
  }

  async write<T>(data: T, query?: string | object): Promise<{ id: string; data: T }> {
    const operation: QueryOperation = {
      id: this.generateOperationId('write'),
      type: 'write',
      query: query || data,
      parameters: []
    };

    const operationId = await this.transactionHandler.addOperation(this.transactionId, operation);
    const result = await this.transactionHandler.executeOperation(this.transactionId, operationId);
    return result.data;
  }

  async createSavepoint(name: string): Promise<string> {
    return this.transactionHandler.createSavepoint(this.transactionId, name);
  }

  async rollbackToSavepoint(name: string): Promise<void> {
    return this.transactionHandler.rollbackToSavepoint(this.transactionId, name);
  }

  private generateOperationId(type: string): string {
    return `txn_${this.transactionId}_${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}