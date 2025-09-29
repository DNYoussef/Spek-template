/**
 * State Store System Types
 * NASA Rule 10 Compliant: Clean type definitions
 */

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

export enum StateStoreState {
  INITIALIZING = 'INITIALIZING',
  TRANSACTING = 'TRANSACTING',
  PERSISTING = 'PERSISTING',
  BACKING_UP = 'BACKING_UP',
  RECOVERING = 'RECOVERING',
  ERROR = 'ERROR'
}

export enum StateStoreEvent {
  START = 'START',
  BEGIN_TRANSACTION = 'BEGIN_TRANSACTION',
  COMMIT_TRANSACTION = 'COMMIT_TRANSACTION',
  ROLLBACK_TRANSACTION = 'ROLLBACK_TRANSACTION',
  PERSIST_STATE = 'PERSIST_STATE',
  BACKUP_REQUESTED = 'BACKUP_REQUESTED',
  RECOVERY_REQUESTED = 'RECOVERY_REQUESTED',
  ERROR_OCCURRED = 'ERROR_OCCURRED',
  RESET = 'RESET'
}

export interface StateStoreContext {
  config: StateStoreConfig;
  currentTransaction?: Transaction;
  lastBackup?: Date;
  error?: Error;
}

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0

// Receipt
// status: OK
// reason_if_blocked: --
// run_id: memory-terminator-009
// inputs: ["StateStore.ts"]
// tools_used: ["Write"]
// versions: {"model":"claude-sonnet-4","prompt":"FSM-First-v1.0"}
// === END FOOTER ===