/**
 * StateStoreTypes.ts - State Storage Type Definitions
 * @stub true
 * @architecture State persistence and management type system
 */

// State store configuration
export interface StateStoreConfig {
  readonly type: 'memory' | 'disk' | 'distributed';
  readonly persistent: boolean;
  readonly maxSize?: number;
  readonly ttl?: number; // time to live in milliseconds
}

// State entry
export interface StateEntry<T = unknown> {
  readonly key: string;
  readonly value: T;
  readonly metadata: StateEntryMetadata;
}

// State entry metadata
export interface StateEntryMetadata {
  readonly createdAt: number;
  readonly updatedAt: number;
  readonly version: number;
  readonly ttl?: number;
  readonly tags?: readonly string[];
}

// State store operations
export interface StateStore<T = unknown> {
  get(key: string): Promise<StateEntry<T> | null>;
  set(key: string, value: T, metadata?: Partial<StateEntryMetadata>): Promise<void>;
  delete(key: string): Promise<boolean>;
  has(key: string): Promise<boolean>;
  keys(): Promise<readonly string[]>;
  clear(): Promise<void>;
  size(): Promise<number>;
}

// State snapshot
export interface StateSnapshot<T = unknown> {
  readonly timestamp: number;
  readonly entries: ReadonlyMap<string, StateEntry<T>>;
  readonly metadata: Record<string, unknown>;
  readonly id?: string; // Snapshot identifier
  readonly states?: ReadonlyMap<string, T>; // Direct state access (alternative to entries)
}

// State record (for persistence and transactions)
export interface StateRecord<T = unknown> {
  readonly key: string;
  readonly value: T;
  readonly version: number;
  readonly timestamp: number;
  readonly checksum?: string;
  readonly id?: string; // Record identifier
  readonly context?: Record<string, unknown>; // Execution context for record
}

// Transaction support
export interface Transaction {
  readonly id: string;
  readonly operations: readonly StateOperation[];
  readonly status: 'pending' | 'committed' | 'rolled_back';
  readonly startTime: number;
  readonly endTime?: number;
}

export interface StateOperation {
  readonly type: 'get' | 'set' | 'delete' | 'clear';
  readonly key?: string;
  readonly value?: unknown;
  readonly previousValue?: unknown;
  readonly timestamp: number;
}

// State store context (for FSM)
export interface StateStoreContext {
  readonly storeId?: string;
  readonly config?: StateStoreConfig;
  readonly activeTransactions?: readonly Transaction[];
  readonly recordCount?: number;
  readonly totalSize?: number;
  readonly lastOperation?: StateOperation;
  readonly errors?: readonly string[];
}

/**
 * AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE
 * ## Version & Run Log
 * | Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
 * |--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
 * | 1.0.0   | 2025-10-03T00:00:00-04:00 | coder@sonnet-4.5 | Create StateStoreTypes stub | StateStoreTypes.ts | OK | Initial stub creation | 0.00 | e1f2a3b |
 * | 1.1.0   | 2025-10-04T00:20:00-04:00 | coder@sonnet-4.5 | Add StateRecord, Transaction, StateOperation, StateStoreContext | StateStoreTypes.ts | OK | Type Consolidation Phase 3 - TS2305 fixes | 0.00 | d4e8c1f |
 * ### Receipt
 * - status: OK
 * - reason_if_blocked: --
 * - run_id: type-consolidation-phase3-statestore
 * - inputs: ["StateStoreTypes.ts"]
 * - tools_used: ["Read", "Edit"]
 * - versions: {"model":"claude-sonnet-4-5-20250929","prompt":"type-consolidation-ts2305-phase3"}
 * AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE
 */
