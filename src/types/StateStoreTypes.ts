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
}

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0
// === END FOOTER ===
