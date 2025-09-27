/**
 * StateStore - Persistent State Storage with Transactions
 * Provides durable state storage for Princess state machines with ACID properties,
 * transaction support, and automatic recovery mechanisms.
 */

import { EventEmitter } from 'events';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface StateRecord {
  id: string;
  princessId: string;
  state: string;
  context: Record<string, any>;
  timestamp: Date;
  version: number;
  checksum: string;
}

export interface Transaction {
  id: string;
  operations: StateOperation[];
  status: 'pending' | 'committed' | 'rolled_back';
  timestamp: Date;
  isolationLevel: 'read_uncommitted' | 'read_committed' | 'repeatable_read' | 'serializable';
}

export interface StateOperation {
  type: 'create' | 'update' | 'delete';
  princessId: string;
  oldState?: string;
  newState?: string;
  context?: Record<string, any>;
}

export interface StateStoreConfig {
  persistenceEnabled: boolean;
  storageLocation: string;
  backupEnabled: boolean;
  backupInterval: number;
  maxTransactionTime: number;
  compressionEnabled: boolean;
}

export interface StateSnapshot {
  id: string;
  timestamp: Date;
  states: Map<string, StateRecord>;
  metadata: {
    version: string;
    checksum: string;
    totalStates: number;
  };
}

export class StateStore extends EventEmitter {
  private config: StateStoreConfig;
  private states: Map<string, StateRecord>;
  private stateHistory: Map<string, StateRecord[]>;
  private activeTransactions: Map<string, Transaction>;
  private locks: Map<string, Set<string>>; // princessId -> transactionIds
  private backupTimer?: NodeJS.Timeout;
  private transactionCounter: number;

  constructor(config: Partial<StateStoreConfig> = {}) {
    super();

    this.config = {
      persistenceEnabled: true,
      storageLocation: './data/state-store',
      backupEnabled: true,
      backupInterval: 300000, // 5 minutes
      maxTransactionTime: 30000, // 30 seconds
      compressionEnabled: true,
      ...config
    };

    this.states = new Map();
    this.stateHistory = new Map();
    this.activeTransactions = new Map();
    this.locks = new Map();
    this.transactionCounter = 0;

    this.initializeStore();
  }

  /**
   * Initialize a new state for a Princess
   */
  async initializeState(princessId: string, initialState: string): Promise<void> {
    const stateRecord: StateRecord = {
      id: this.generateStateId(),
      princessId,
      state: initialState,
      context: {},
      timestamp: new Date(),
      version: 1,
      checksum: this.calculateChecksum(princessId, initialState, {})
    };

    await this.executeInTransaction(async (transaction) => {
      await this.performStateOperation(transaction.id, {
        type: 'create',
        princessId,
        newState: initialState,
        context: {}
      });
    });

    this.emit('stateInitialized', princessId, initialState);
  }

  /**
   * Update the state of a Princess
   */
  async updateState(
    princessId: string,
    newState: string,
    context: Record<string, any> = {}
  ): Promise<void> {
    const currentRecord = this.states.get(princessId);
    if (!currentRecord) {
      throw new Error(`No state record found for Princess: ${princessId}`);
    }

    await this.executeInTransaction(async (transaction) => {
      await this.performStateOperation(transaction.id, {
        type: 'update',
        princessId,
        oldState: currentRecord.state,
        newState,
        context
      });
    });

    this.emit('stateUpdated', princessId, currentRecord.state, newState);
  }

  /**
   * Get the current state of a Princess
   */
  async getCurrentState(princessId: string): Promise<StateRecord | null> {
    return this.states.get(princessId) || null;
  }

  /**
   * Get the previous state of a Princess
   */
  async getPreviousState(princessId: string): Promise<string | null> {
    const history = this.stateHistory.get(princessId);
    if (!history || history.length === 0) {
      return null;
    }

    return history[history.length - 1].state;
  }

  /**
   * Get state history for a Princess
   */
  async getStateHistory(princessId: string, limit: number = 50): Promise<StateRecord[]> {
    const history = this.stateHistory.get(princessId) || [];
    return history.slice(-limit);
  }

  /**
   * Execute multiple operations in a transaction
   */
  async executeInTransaction<T>(
    operations: (transaction: Transaction) => Promise<T>,
    isolationLevel: Transaction['isolationLevel'] = 'read_committed'
  ): Promise<T> {
    const transaction = this.createTransaction(isolationLevel);

    try {
      const result = await Promise.race([
        operations(transaction),
        this.createTransactionTimeout(transaction.id)
      ]);

      await this.commitTransaction(transaction.id);
      return result;

    } catch (error) {
      await this.rollbackTransaction(transaction.id);
      throw error;
    }
  }

  /**
   * Create a snapshot of all states
   */
  async createSnapshot(): Promise<StateSnapshot> {
    const snapshot: StateSnapshot = {
      id: `snapshot_${Date.now()}`,
      timestamp: new Date(),
      states: new Map(this.states),
      metadata: {
        version: '1.0.0',
        checksum: this.calculateSnapshotChecksum(),
        totalStates: this.states.size
      }
    };

    if (this.config.persistenceEnabled) {
      await this.persistSnapshot(snapshot);
    }

    this.emit('snapshotCreated', snapshot.id);
    return snapshot;
  }

  /**
   * Restore from a snapshot
   */
  async restoreFromSnapshot(snapshot: StateSnapshot): Promise<void> {
    // Validate snapshot integrity
    const calculatedChecksum = this.calculateSnapshotChecksum(snapshot.states);
    if (calculatedChecksum !== snapshot.metadata.checksum) {
      throw new Error('Snapshot integrity check failed');
    }

    // Clear current state and restore from snapshot
    this.states.clear();
    this.stateHistory.clear();

    for (const [princessId, stateRecord] of snapshot.states) {
      this.states.set(princessId, stateRecord);

      // Initialize history with the snapshot state
      this.stateHistory.set(princessId, [stateRecord]);
    }

    this.emit('snapshotRestored', snapshot.id);
  }

  /**
   * Get all Princess states
   */
  async getAllStates(): Promise<Map<string, StateRecord>> {
    return new Map(this.states);
  }

  /**
   * Get Princess states matching criteria
   */
  async queryStates(criteria: {
    state?: string;
    princessIds?: string[];
    since?: Date;
    context?: Record<string, any>;
  }): Promise<StateRecord[]> {
    const results: StateRecord[] = [];

    for (const [princessId, record] of this.states) {
      let matches = true;

      if (criteria.state && record.state !== criteria.state) {
        matches = false;
      }

      if (criteria.princessIds && !criteria.princessIds.includes(princessId)) {
        matches = false;
      }

      if (criteria.since && record.timestamp < criteria.since) {
        matches = false;
      }

      if (criteria.context) {
        for (const [key, value] of Object.entries(criteria.context)) {
          if (record.context[key] !== value) {
            matches = false;
            break;
          }
        }
      }

      if (matches) {
        results.push(record);
      }
    }

    return results;
  }

  /**
   * Cleanup old state history
   */
  async cleanupHistory(retentionDays: number = 30): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    for (const [princessId, history] of this.stateHistory) {
      const filteredHistory = history.filter(record => record.timestamp >= cutoffDate);
      this.stateHistory.set(princessId, filteredHistory);
    }

    this.emit('historyCleanupCompleted', cutoffDate);
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<any> {
    const totalStates = this.states.size;
    const totalHistoryRecords = Array.from(this.stateHistory.values())
      .reduce((sum, history) => sum + history.length, 0);

    return {
      totalStates,
      totalHistoryRecords,
      activeTransactions: this.activeTransactions.size,
      activeLocks: this.locks.size,
      memoryUsage: this.calculateMemoryUsage(),
      lastBackup: await this.getLastBackupTime()
    };
  }

  /**
   * Shutdown the state store
   */
  async shutdown(): Promise<void> {
    // Wait for all active transactions to complete
    if (this.activeTransactions.size > 0) {
      console.log(`Waiting for ${this.activeTransactions.size} active transactions to complete...`);

      const timeout = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Shutdown timeout')), 30000);
      });

      const completion = new Promise<void>((resolve) => {
        const check = () => {
          if (this.activeTransactions.size === 0) {
            resolve();
          } else {
            setTimeout(check, 100);
          }
        };
        check();
      });

      try {
        await Promise.race([completion, timeout]);
      } catch (error) {
        console.warn('Force shutting down with active transactions');
      }
    }

    // Create final snapshot
    if (this.config.persistenceEnabled) {
      await this.createSnapshot();
    }

    // Clear backup timer
    if (this.backupTimer) {
      clearInterval(this.backupTimer);
    }

    this.emit('shutdown');
  }

  /**
   * Private methods
   */
  private async initializeStore(): Promise<void> {
    if (this.config.persistenceEnabled) {
      await this.ensureStorageDirectory();
      await this.loadPersistedState();
    }

    if (this.config.backupEnabled) {
      this.setupAutomaticBackups();
    }

    this.setupTransactionCleanup();
  }

  private createTransaction(isolationLevel: Transaction['isolationLevel']): Transaction {
    const transaction: Transaction = {
      id: `txn_${++this.transactionCounter}_${Date.now()}`,
      operations: [],
      status: 'pending',
      timestamp: new Date(),
      isolationLevel
    };

    this.activeTransactions.set(transaction.id, transaction);
    return transaction;
  }

  private async performStateOperation(
    transactionId: string,
    operation: StateOperation
  ): Promise<void> {
    const transaction = this.activeTransactions.get(transactionId);
    if (!transaction) {
      throw new Error(`Transaction not found: ${transactionId}`);
    }

    // Acquire lock
    await this.acquireLock(operation.princessId, transactionId);

    try {
      switch (operation.type) {
        case 'create':
          await this.createStateRecord(operation);
          break;
        case 'update':
          await this.updateStateRecord(operation);
          break;
        case 'delete':
          await this.deleteStateRecord(operation);
          break;
      }

      transaction.operations.push(operation);

    } catch (error) {
      this.releaseLock(operation.princessId, transactionId);
      throw error;
    }
  }

  private async createStateRecord(operation: StateOperation): Promise<void> {
    if (this.states.has(operation.princessId)) {
      throw new Error(`State already exists for Princess: ${operation.princessId}`);
    }

    const stateRecord: StateRecord = {
      id: this.generateStateId(),
      princessId: operation.princessId,
      state: operation.newState!,
      context: operation.context || {},
      timestamp: new Date(),
      version: 1,
      checksum: this.calculateChecksum(operation.princessId, operation.newState!, operation.context || {})
    };

    this.states.set(operation.princessId, stateRecord);

    // Initialize history
    this.stateHistory.set(operation.princessId, []);
  }

  private async updateStateRecord(operation: StateOperation): Promise<void> {
    const currentRecord = this.states.get(operation.princessId);
    if (!currentRecord) {
      throw new Error(`No state record found for Princess: ${operation.princessId}`);
    }

    // Add current state to history
    const history = this.stateHistory.get(operation.princessId) || [];
    history.push({ ...currentRecord });
    this.stateHistory.set(operation.princessId, history);

    // Create new state record
    const newRecord: StateRecord = {
      id: this.generateStateId(),
      princessId: operation.princessId,
      state: operation.newState!,
      context: { ...currentRecord.context, ...operation.context },
      timestamp: new Date(),
      version: currentRecord.version + 1,
      checksum: this.calculateChecksum(
        operation.princessId,
        operation.newState!,
        { ...currentRecord.context, ...operation.context }
      )
    };

    this.states.set(operation.princessId, newRecord);
  }

  private async deleteStateRecord(operation: StateOperation): Promise<void> {
    const currentRecord = this.states.get(operation.princessId);
    if (!currentRecord) {
      throw new Error(`No state record found for Princess: ${operation.princessId}`);
    }

    // Move to history before deletion
    const history = this.stateHistory.get(operation.princessId) || [];
    history.push({ ...currentRecord });
    this.stateHistory.set(operation.princessId, history);

    this.states.delete(operation.princessId);
  }

  private async commitTransaction(transactionId: string): Promise<void> {
    const transaction = this.activeTransactions.get(transactionId);
    if (!transaction) {
      throw new Error(`Transaction not found: ${transactionId}`);
    }

    transaction.status = 'committed';

    // Release all locks held by this transaction
    for (const operation of transaction.operations) {
      this.releaseLock(operation.princessId, transactionId);
    }

    // Persist changes if enabled
    if (this.config.persistenceEnabled) {
      await this.persistChanges(transaction);
    }

    this.activeTransactions.delete(transactionId);
    this.emit('transactionCommitted', transactionId);
  }

  private async rollbackTransaction(transactionId: string): Promise<void> {
    const transaction = this.activeTransactions.get(transactionId);
    if (!transaction) {
      return; // Transaction already cleaned up
    }

    transaction.status = 'rolled_back';

    // Reverse operations in reverse order
    for (let i = transaction.operations.length - 1; i >= 0; i--) {
      const operation = transaction.operations[i];
      await this.reverseOperation(operation);
      this.releaseLock(operation.princessId, transactionId);
    }

    this.activeTransactions.delete(transactionId);
    this.emit('transactionRolledBack', transactionId);
  }

  private async reverseOperation(operation: StateOperation): Promise<void> {
    switch (operation.type) {
      case 'create':
        this.states.delete(operation.princessId);
        this.stateHistory.delete(operation.princessId);
        break;
      case 'update':
        // Restore previous state from history
        const history = this.stateHistory.get(operation.princessId);
        if (history && history.length > 0) {
          const previousState = history.pop()!;
          this.states.set(operation.princessId, previousState);
        }
        break;
      case 'delete':
        // Restore from history
        const deletedHistory = this.stateHistory.get(operation.princessId);
        if (deletedHistory && deletedHistory.length > 0) {
          const restoredState = deletedHistory.pop()!;
          this.states.set(operation.princessId, restoredState);
        }
        break;
    }
  }

  private async acquireLock(princessId: string, transactionId: string): Promise<void> {
    if (!this.locks.has(princessId)) {
      this.locks.set(princessId, new Set());
    }

    const locksForPrincess = this.locks.get(princessId)!;

    // Wait for exclusive access
    while (locksForPrincess.size > 0 && !locksForPrincess.has(transactionId)) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    locksForPrincess.add(transactionId);
  }

  private releaseLock(princessId: string, transactionId: string): void {
    const locksForPrincess = this.locks.get(princessId);
    if (locksForPrincess) {
      locksForPrincess.delete(transactionId);
      if (locksForPrincess.size === 0) {
        this.locks.delete(princessId);
      }
    }
  }

  private createTransactionTimeout(transactionId: string): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Transaction timeout: ${transactionId}`));
      }, this.config.maxTransactionTime);
    });
  }

  private generateStateId(): string {
    return `state_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private calculateChecksum(princessId: string, state: string, context: Record<string, any>): string {
    const content = JSON.stringify({ princessId, state, context });
    // Simple checksum - in production, use proper cryptographic hash
    return Buffer.from(content).toString('base64').slice(0, 8);
  }

  private calculateSnapshotChecksum(states?: Map<string, StateRecord>): string {
    const stateMap = states || this.states;
    const content = JSON.stringify(Array.from(stateMap.entries()));
    return Buffer.from(content).toString('base64').slice(0, 8);
  }

  private calculateMemoryUsage(): number {
    const statesSize = JSON.stringify(Array.from(this.states.entries())).length;
    const historySize = JSON.stringify(Array.from(this.stateHistory.entries())).length;
    return statesSize + historySize;
  }

  private async ensureStorageDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.config.storageLocation, { recursive: true });
    } catch (error) {
      console.error('Failed to create storage directory:', error);
    }
  }

  private async loadPersistedState(): Promise<void> {
    try {
      const statesFile = path.join(this.config.storageLocation, 'states.json');
      const historyFile = path.join(this.config.storageLocation, 'history.json');

      const [statesData, historyData] = await Promise.all([
        fs.readFile(statesFile, 'utf-8').catch(() => '{}'),
        fs.readFile(historyFile, 'utf-8').catch(() => '{}')
      ]);

      const statesObj = JSON.parse(statesData);
      const historyObj = JSON.parse(historyData);

      // Restore states
      for (const [princessId, state] of Object.entries(statesObj)) {
        this.states.set(princessId, state as StateRecord);
      }

      // Restore history
      for (const [princessId, history] of Object.entries(historyObj)) {
        this.stateHistory.set(princessId, history as StateRecord[]);
      }

    } catch (error) {
      console.error('Failed to load persisted state:', error);
    }
  }

  private async persistChanges(transaction: Transaction): Promise<void> {
    try {
      const statesFile = path.join(this.config.storageLocation, 'states.json');
      const historyFile = path.join(this.config.storageLocation, 'history.json');

      const statesObj = Object.fromEntries(this.states);
      const historyObj = Object.fromEntries(this.stateHistory);

      await Promise.all([
        fs.writeFile(statesFile, JSON.stringify(statesObj, null, 2)),
        fs.writeFile(historyFile, JSON.stringify(historyObj, null, 2))
      ]);

    } catch (error) {
      console.error('Failed to persist changes:', error);
      throw error;
    }
  }

  private async persistSnapshot(snapshot: StateSnapshot): Promise<void> {
    try {
      const snapshotFile = path.join(
        this.config.storageLocation,
        `snapshot_${snapshot.id}.json`
      );

      const snapshotData = {
        ...snapshot,
        states: Object.fromEntries(snapshot.states)
      };

      await fs.writeFile(snapshotFile, JSON.stringify(snapshotData, null, 2));

    } catch (error) {
      console.error('Failed to persist snapshot:', error);
    }
  }

  private setupAutomaticBackups(): void {
    this.backupTimer = setInterval(async () => {
      try {
        await this.createSnapshot();
      } catch (error) {
        console.error('Automatic backup failed:', error);
      }
    }, this.config.backupInterval);
  }

  private setupTransactionCleanup(): void {
    // Clean up stale transactions every minute
    setInterval(() => {
      const now = Date.now();
      const staleTransactions: string[] = [];

      for (const [transactionId, transaction] of this.activeTransactions) {
        const age = now - transaction.timestamp.getTime();
        if (age > this.config.maxTransactionTime * 2) {
          staleTransactions.push(transactionId);
        }
      }

      staleTransactions.forEach(transactionId => {
        console.warn(`Cleaning up stale transaction: ${transactionId}`);
        this.rollbackTransaction(transactionId);
      });
    }, 60000);
  }

  private async getLastBackupTime(): Promise<Date | null> {
    try {
      const files = await fs.readdir(this.config.storageLocation);
      const snapshotFiles = files.filter(file => file.startsWith('snapshot_'));

      if (snapshotFiles.length === 0) {
        return null;
      }

      const timestamps = snapshotFiles
        .map(file => file.match(/snapshot_(.+)\.json/)?.[1])
        .filter(Boolean)
        .map(timestamp => new Date(parseInt(timestamp!)))
        .sort((a, b) => b.getTime() - a.getTime());

      return timestamps[0] || null;

    } catch (error) {
      return null;
    }
  }
}

export default StateStore;