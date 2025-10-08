/**
 * MemoryVersionTypes.ts - Memory Versioning Type Definitions
 * @stub true
 * @architecture Memory state versioning type system
 */

// Memory version
export interface MemoryVersion {
  readonly version: number;
  readonly timestamp: number;
  readonly checksum: string;
  readonly size: number; // bytes
  readonly metadata: Record<string, unknown>;
}

// Memory snapshot
export interface MemorySnapshot<T = unknown> {
  readonly version: MemoryVersion;
  readonly data: T;
  readonly parent?: number; // parent version number
}

// Memory diff
export interface MemoryDiff {
  readonly fromVersion: number;
  readonly toVersion: number;
  readonly changes: readonly MemoryChange[];
  readonly timestamp: number;
}

// Memory change
export interface MemoryChange {
  readonly type: 'add' | 'update' | 'delete';
  readonly path: string; // JSON path
  readonly oldValue?: unknown;
  readonly newValue?: unknown;
}

// Memory version history
export interface MemoryVersionHistory<T = unknown> {
  readonly versions: readonly MemoryVersion[];
  readonly current: number;
  readonly snapshots: ReadonlyMap<number, MemorySnapshot<T>>;
}

// Additional exports for version control
export interface VersionInfo {
  readonly id: string;
  readonly number: number;
  readonly timestamp: number;
  readonly author: string;
  readonly message: string;
  readonly tags: readonly string[];
}

export interface VersionContext {
  readonly currentVersion: number;
  readonly totalVersions: number;
  readonly latestVersion: VersionInfo;
  readonly history: readonly VersionInfo[];
  readonly config?: Record<string, unknown>;
  readonly metrics?: Record<string, number>;
  readonly error?: Error | string;
}

export enum VersionState {
  DRAFT = 'DRAFT',
  COMMITTED = 'COMMITTED',
  TAGGED = 'TAGGED',
  ARCHIVED = 'ARCHIVED',
  DELETED = 'DELETED'
}

export interface VersionSnapshot<T = unknown> {
  readonly version: VersionInfo;
  readonly state: VersionState;
  readonly data: T;
  readonly checksum: string;
}

export interface VersionDiff {
  readonly fromVersion: number;
  readonly toVersion: number;
  readonly changes: readonly MemoryChange[];
  readonly summary: string;
  readonly timestamp: number;
}

export interface VersionEvent {
  readonly type: 'created' | 'updated' | 'deleted' | 'reverted';
  readonly version: number;
  readonly timestamp: number;
  readonly metadata: Record<string, unknown>;
}

export interface VersionMetrics {
  readonly totalVersions: number;
  readonly totalSize: number; // bytes
  readonly averageSize: number;
  readonly changeFrequency: number; // changes per hour
  readonly retentionDays: number;
}

export interface VersionControlConfig {
  readonly enabled: boolean;
  readonly maxVersions: number;
  readonly retentionDays: number;
  readonly compressionEnabled: boolean;
  readonly autoSnapshot: boolean;
}

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0
// === END FOOTER ===
