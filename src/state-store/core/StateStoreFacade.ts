/**
 * State Store Facade
 * NASA Rule 10 Compliant: Orchestrates FSM and components
 */

import { EventEmitter } from 'events';
import { StateStoreFSM } from '../fsm/StateStoreFSM';
import { TransactionManager } from '../components/TransactionManager';
import { PersistenceEngine } from '../components/PersistenceEngine';
import { BackupManager } from '../components/BackupManager';
import {
  StateStoreConfig,
  StateRecord,
  Transaction,
  StateOperation,
  StateStoreContext,
  StateStoreState,
  StateStoreEvent
} from '~types/StateStoreTypes';

export class StateStoreFacade extends EventEmitter {
  private fsm: StateStoreFSM;
  private transactions: TransactionManager;
  private persistence: PersistenceEngine;
  private backup: BackupManager;
  private context: StateStoreContext;

  constructor(config: Partial<StateStoreConfig> = {}) {
    super();

    const fullConfig: StateStoreConfig = {
      persistenceEnabled: true,
      storageLocation: './data/state-store',
      backupEnabled: true,
      backupInterval: 300000,
      maxTransactionTime: 30000,
      compressionEnabled: true,
      ...config
    };

    this.context = {
      config: fullConfig
    };

    this.initializeComponents();
    this.wireComponents();
    this.start();
  }

  async initializeState(princessId: string, initialState: string): Promise<void> {
    console.assert(princessId != null && initialState != null, 'Princess ID and initial state required');

    const transactionId = await this.transactions.beginTransaction('read_committed');

    try {
      await this.persistence.initializeState(princessId, initialState);
      await this.transactions.commitTransaction(transactionId);

      this.emit('state_initialized', { princessId, initialState });
    } catch (error) {
      await this.transactions.rollbackTransaction(transactionId);
      throw error;
    }
  }

  async updateState(
    princessId: string,
    newState: string,
    context: Record<string, any> = {}
  ): Promise<void> {
    console.assert(princessId != null && newState != null, 'Princess ID and new state required');

    await this.fsm.transition(StateStoreEvent.BEGIN_TRANSACTION);

    const transactionId = await this.transactions.beginTransaction('read_committed');

    try {
      const operation: StateOperation = {
        type: 'update',
        princessId,
        newState,
        context
      };

      this.transactions.addOperation(transactionId, operation);
      await this.persistence.updateState(princessId, newState, context);
      await this.transactions.commitTransaction(transactionId);

      await this.fsm.transition(StateStoreEvent.COMMIT_TRANSACTION);
      this.emit('state_updated', { princessId, newState });
    } catch (error) {
      await this.transactions.rollbackTransaction(transactionId);
      await this.fsm.transition(StateStoreEvent.ROLLBACK_TRANSACTION);
      throw error;
    }
  }

  getState(princessId: string): StateRecord | null {
    console.assert(princessId != null, 'Princess ID required');
    return this.persistence.getState(princessId);
  }

  setState(princessId: string, state: any): void {
    console.assert(princessId != null && state != null, 'Princess ID and state required');
    this.persistence.setState(princessId, state);
  }

  getAllStates(): StateRecord[] {
    return this.persistence.getAllStates();
  }

  async deleteState(princessId: string): Promise<boolean> {
    console.assert(princessId != null, 'Princess ID required');

    const transactionId = await this.transactions.beginTransaction('read_committed');

    try {
      const deleted = await this.persistence.deleteState(princessId);
      await this.transactions.commitTransaction(transactionId);

      if (deleted) {
        this.emit('state_deleted', { princessId });
      }
      return deleted;
    } catch (error) {
      await this.transactions.rollbackTransaction(transactionId);
      throw error;
    }
  }

  async createBackup(): Promise<string> {
    await this.fsm.transition(StateStoreEvent.BACKUP_REQUESTED);

    const states = new Map<string, StateRecord>();
    const allStates = this.persistence.getAllStates();

    for (const state of allStates) {
      states.set(state.princessId, state);
    }

    const backupId = await this.backup.createBackup(states);
    this.emit('backup_created', { backupId });
    return backupId;
  }

  async restoreBackup(backupId: string): Promise<boolean> {
    console.assert(backupId != null, 'Backup ID required');

    await this.fsm.transition(StateStoreEvent.RECOVERY_REQUESTED);

    const states = await this.backup.restoreBackup(backupId);
    if (!states) {
      this.emit('backup_restore_failed', { backupId });
      return false;
    }

    // Restore states through persistence engine
    for (const [princessId, state] of states) {
      await this.persistence.initializeState(princessId, state.state);
    }

    this.emit('backup_restored', { backupId, stateCount: states.size });
    return true;
  }

  async persistAllStates(): Promise<number> {
    await this.fsm.transition(StateStoreEvent.PERSIST_STATE);
    return await this.persistence.persistAllStates();
  }

  getMetrics(): any {
    return {
      totalStates: this.persistence.getAllStates().length,
      activeTransactions: this.transactions.getActiveTransactions().length,
      totalBackups: this.backup.listBackups().length,
      config: this.context.config
    };
  }

  async shutdown(): Promise<void> {
    this.backup.stopBackupSchedule();
    await this.persistAllStates();
    this.removeAllListeners();
  }

  private initializeComponents(): void {
    this.fsm = new StateStoreFSM(this.context);
    this.transactions = new TransactionManager(
      this.context.config.maxTransactionTime,
      10 // max concurrent transactions
    );
    this.persistence = new PersistenceEngine(
      this.context.config.storageLocation,
      this.context.config.compressionEnabled
    );
    this.backup = new BackupManager(this.context.config.backupInterval);
  }

  private wireComponents(): void {
    console.assert(this.fsm != null && this.transactions != null, 'Components must be initialized');

    this.fsm.on('state_changed', (event) => this.emit('state_changed', event));
    this.transactions.on('transaction_committed', (event) => this.emit('transaction_committed', event));
    this.persistence.on('state_persisted', (event) => this.emit('state_persisted', event));
    this.backup.on('backup_created', (event) => this.emit('backup_created', event));

    if (this.context.config.backupEnabled) {
      this.backup.startBackupSchedule();
    }
  }

  private async start(): Promise<void> {
    await this.fsm.transition(StateStoreEvent.START);
  }
}

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0

// Receipt
// status: OK
// reason_if_blocked: --
// run_id: memory-terminator-014
// inputs: ["StateStoreConfig", "Components"]
// tools_used: ["Write"]
// versions: {"model":"claude-sonnet-4","prompt":"FSM-First-v1.0"}
// === END FOOTER ===