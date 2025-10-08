/**
 * DataAccessLayer.ts
 * Centralized data access abstraction with FSM integration
 * Handles database connections, query execution, and result processing
 */

import { EventEmitter } from 'events';
import { RepositoryTransitionHub, RepositoryEvent, RepositoryState } from '../fsm/RepositoryTransitionHub';

export interface DataSource {
  type: 'file' | 'database' | 'memory' | 'cache';
  connectionString?: string;
  options?: Record<string, any>;
}

export interface QueryOperation {
  id: string;
  type: 'read' | 'write' | 'update' | 'delete';
  query: string | object;
  parameters?: any[];
  timeout?: number;
}

export interface QueryResult<T = any> {
  data: T;
  metadata: {
    queryId: string;
    executionTime: number;
    rowCount?: number;
    fromCache: boolean;
  };
}

export interface ConnectionPool {
  size: number;
  available: number;
  active: number;
  pending: number;
}

/**
 * Centralized data access layer
 * Coordinates all database operations through FSM
 */
export class DataAccessLayer extends EventEmitter {
  private transitionHub: RepositoryTransitionHub;
  private connections: Map<string, any> = new Map();
  private activeQueries: Map<string, QueryOperation> = new Map();
  private connectionPool: ConnectionPool = {
    size: 10,
    available: 10,
    active: 0,
    pending: 0
  };

  constructor(transitionHub: RepositoryTransitionHub) {
    super();
    this.transitionHub = transitionHub;
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.transitionHub.on('stateChanged', (event) => {
      if (event.to === RepositoryState.CONNECTING) {
        this.handleConnecting(event.context);
      } else if (event.to === RepositoryState.QUERYING) {
        this.handleQuerying(event.context);
      } else if (event.to === RepositoryState.CLEANUP) {
        this.handleCleanup(event.context);
      }
    });
  }

  async connect(dataSource: DataSource): Promise<string> {
    if (!this.transitionHub.canConnect()) {
      throw new Error(`Cannot connect in state: ${this.transitionHub.getCurrentState()}`);
    }

    const connectionId = this.generateConnectionId();

    await this.transitionHub.transition(RepositoryEvent.CONNECT, {
      connectionId,
      metrics: { startTime: Date.now() }
    });

    try {
      const connection = await this.createConnection(dataSource);
      this.connections.set(connectionId, connection);

      this.connectionPool.available--;
      this.connectionPool.active++;

      await this.transitionHub.transition(RepositoryEvent.SUCCESS);

      this.emit('connectionEstablished', { connectionId, dataSource });
      return connectionId;
    } catch (error) {
      await this.transitionHub.transition(RepositoryEvent.FAILURE, { error: error as Error });
      throw error;
    }
  }

  async executeQuery<T>(operation: QueryOperation, connectionId?: string): Promise<QueryResult<T>> {
    if (!this.transitionHub.canQuery()) {
      throw new Error(`Cannot query in state: ${this.transitionHub.getCurrentState()}`);
    }

    const context = this.transitionHub.getContext();
    const activeConnectionId = connectionId || context.connectionId;

    if (!activeConnectionId || !this.connections.has(activeConnectionId)) {
      throw new Error('No active connection available');
    }

    this.activeQueries.set(operation.id, operation);
    const startTime = Date.now();

    try {
      const connection = this.connections.get(activeConnectionId);
      const rawResult = await this.executeRawQuery(connection, operation);

      const result: QueryResult<T> = {
        data: rawResult,
        metadata: {
          queryId: operation.id,
          executionTime: Date.now() - startTime,
          rowCount: Array.isArray(rawResult) ? rawResult.length : 1,
          fromCache: false
        }
      };

      await this.transitionHub.transition(RepositoryEvent.SUCCESS, {
        queryId: operation.id,
        data: result,
        metrics: {
          ...context.metrics,
          endTime: Date.now(),
          duration: Date.now() - startTime
        }
      });

      this.emit('queryExecuted', { operation, result });
      return result;
    } catch (error) {
      await this.transitionHub.transition(RepositoryEvent.FAILURE, { error: error as Error });
      throw error;
    } finally {
      this.activeQueries.delete(operation.id);
    }
  }

  private async createConnection(dataSource: DataSource): Promise<any> {
    // Connection creation based on data source type
    switch (dataSource.type) {
      case 'file':
        return this.createFileConnection(dataSource);
      case 'database':
        return this.createDatabaseConnection(dataSource);
      case 'memory':
        return this.createMemoryConnection(dataSource);
      case 'cache':
        return this.createCacheConnection(dataSource);
      default:
        throw new Error(`Unsupported data source type: ${dataSource.type}`);
    }
  }

  private async createFileConnection(dataSource: DataSource): Promise<any> {
    // File-based connection (JSON, YAML, etc.)
    return {
      type: 'file',
      path: dataSource.connectionString,
      options: dataSource.options
    };
  }

  private async createDatabaseConnection(dataSource: DataSource): Promise<any> {
    // Database connection (simulated)
    return {
      type: 'database',
      connectionString: dataSource.connectionString,
      options: dataSource.options,
      connected: true
    };
  }

  private async createMemoryConnection(dataSource: DataSource): Promise<any> {
    // In-memory connection
    return {
      type: 'memory',
      store: new Map(),
      options: dataSource.options
    };
  }

  private async createCacheConnection(dataSource: DataSource): Promise<any> {
    // Cache connection
    return {
      type: 'cache',
      cache: new Map(),
      options: dataSource.options
    };
  }

  private async executeRawQuery(connection: any, operation: QueryOperation): Promise<any> {
    // Query execution based on connection type
    switch (connection.type) {
      case 'file':
        return this.executeFileQuery(connection, operation);
      case 'database':
        return this.executeDatabaseQuery(connection, operation);
      case 'memory':
        return this.executeMemoryQuery(connection, operation);
      case 'cache':
        return this.executeCacheQuery(connection, operation);
      default:
        throw new Error(`Unsupported connection type: ${connection.type}`);
    }
  }

  private async executeFileQuery(connection: any, operation: QueryOperation): Promise<any> {
    // File query execution (simplified)
    const fs = await import('fs/promises');

    switch (operation.type) {
      case 'read':
        const content = await fs.readFile(connection.path, 'utf8');
        return JSON.parse(content);
      case 'write':
        await fs.writeFile(connection.path, JSON.stringify(operation.query, null, 2));
        return { success: true };
      default:
        throw new Error(`Unsupported file operation: ${operation.type}`);
    }
  }

  private async executeDatabaseQuery(connection: any, operation: QueryOperation): Promise<any> {
    // Database query execution (simulated)
    await new Promise(resolve => setTimeout(resolve, 10)); // Simulate query time

    switch (operation.type) {
      case 'read':
        return [{ id: 1, data: 'sample' }];
      case 'write':
        return { insertedId: Math.random().toString(36).substr(2, 9) };
      default:
        return { affected: 1 };
    }
  }

  private async executeMemoryQuery(connection: any, operation: QueryOperation): Promise<any> {
    // Memory query execution
    const store = connection.store;

    switch (operation.type) {
      case 'read':
        return Array.from(store.values());
      case 'write':
        const id = Math.random().toString(36).substr(2, 9);
        store.set(id, operation.query);
        return { id, data: operation.query };
      default:
        return { success: true };
    }
  }

  private async executeCacheQuery(connection: any, operation: QueryOperation): Promise<any> {
    // Cache query execution
    const cache = connection.cache;

    switch (operation.type) {
      case 'read':
        return cache.get(operation.query) || null;
      case 'write':
        cache.set(operation.parameters?.[0], operation.query);
        return { cached: true };
      default:
        return { success: true };
    }
  }

  private async handleConnecting(context: any): Promise<void> {
    this.emit('connecting', { connectionId: context.connectionId });
  }

  private async handleQuerying(context: any): Promise<void> {
    this.emit('queryStarted', { queryId: context.queryId });
  }

  private async handleCleanup(context: any): Promise<void> {
    // Close connections and cleanup resources
    const connectionId = context.connectionId;
    if (connectionId && this.connections.has(connectionId)) {
      const connection = this.connections.get(connectionId);
      await this.closeConnection(connection);
      this.connections.delete(connectionId);

      this.connectionPool.active--;
      this.connectionPool.available++;
    }

    // Clear active queries
    this.activeQueries.clear();

    this.emit('cleanupCompleted', { connectionId });
  }

  private async closeConnection(connection: any): Promise<void> {
    // Connection cleanup based on type
    switch (connection.type) {
      case 'database':
        // Close database connection
        connection.connected = false;
        break;
      case 'memory':
        // Clear memory store
        connection.store.clear();
        break;
      case 'cache':
        // Clear cache
        connection.cache.clear();
        break;
      // File connections don't need explicit closing
    }
  }

  private generateConnectionId(): string {
    return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getActiveConnections(): string[] {
    return Array.from(this.connections.keys());
  }

  getActiveQueries(): QueryOperation[] {
    return Array.from(this.activeQueries.values());
  }

  getConnectionPool(): ConnectionPool {
    return { ...this.connectionPool };
  }

  async closeAllConnections(): Promise<void> {
    const promises = Array.from(this.connections.values()).map(conn => this.closeConnection(conn));
    await Promise.all(promises);

    this.connections.clear();
    this.activeQueries.clear();

    this.connectionPool.active = 0;
    this.connectionPool.available = this.connectionPool.size;

    this.emit('allConnectionsClosed');
  }
}