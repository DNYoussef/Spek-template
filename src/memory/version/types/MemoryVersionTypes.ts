/**
 * Memory Version System Types
 * NASA Rule 10 Compliant: Clean type definitions
 */

export interface VersionInfo {
  id: string;
  version: number;
  timestamp: number;
  checksum: string;
  size: number;
  author: string;
  changeDescription?: string;
  parentVersion?: number;
}

export interface VersionSnapshot {
  key: string;
  partitionId: string;
  versions: VersionInfo[];
  currentVersion: number;
  totalVersions: number;
  firstVersion: number;
  lastModified: number;
}

export interface VersionDiff {
  key: string;
  fromVersion: number;
  toVersion: number;
  changeType: 'created' | 'modified' | 'deleted' | 'moved';
  sizeDelta: number;
  fieldChanges?: Array<{
    field: string;
    oldValue: any;
    newValue: any;
    changeType: 'added' | 'removed' | 'modified';
  }>;
}

export interface VersionControlConfig {
  maxVersionsPerKey: number;
  enableSnapshots: boolean;
  snapshotInterval: number;
  retentionPeriod: number;
  enableCompression: boolean;
  enableDelta: boolean;
}

export interface VersionMetrics {
  totalVersions: number;
  totalSnapshots: number;
  storageUsed: number;
  compressionRatio: number;
  oldestVersion: number;
  newestVersion: number;
}

export enum VersionState {
  INITIALIZING = 'INITIALIZING',
  VERSIONING = 'VERSIONING',
  STORING = 'STORING',
  CLEANING = 'CLEANING',
  SNAPSHOTTING = 'SNAPSHOTTING',
  ERROR = 'ERROR'
}

export enum VersionEvent {
  START = 'START',
  CREATE_VERSION = 'CREATE_VERSION',
  STORE_VERSION = 'STORE_VERSION',
  CLEANUP_REQUESTED = 'CLEANUP_REQUESTED',
  SNAPSHOT_REQUESTED = 'SNAPSHOT_REQUESTED',
  ERROR_OCCURRED = 'ERROR_OCCURRED',
  RESET = 'RESET'
}

export interface VersionContext {
  config: VersionControlConfig;
  metrics: VersionMetrics;
  currentOperation?: string;
  error?: Error;
}

<!-- AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE -->
## Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
|--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
| 1.0.0 | 2025-09-28T19:15:42-04:00 | mega-agent-103@claude-sonnet-4 | Memory version types with FSM enums | MemoryVersionTypes.ts | OK | Clean type extraction from god object | 0.00 | a1b2c3d |

### Receipt
- status: OK
- reason_if_blocked: --
- run_id: memory-terminator-001
- inputs: ["MemoryVersionController.ts"]
- tools_used: ["Write"]
- versions: {"model":"claude-sonnet-4","prompt":"FSM-First-v1.0"}
<!-- AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE -->