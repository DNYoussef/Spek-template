/**
 * Version Tracker Component
 * NASA Rule 10 Compliant: Single responsibility, ≤60 lines per function
 */

import { EventEmitter } from 'events';
import { VersionInfo, VersionSnapshot } from '~types/MemoryVersionTypes';

export class VersionTracker extends EventEmitter {
  private versions: Map<string, VersionSnapshot> = new Map();
  private maxVersionsPerKey: number;

  constructor(maxVersionsPerKey: number = 10) {
    super();
    console.assert(maxVersionsPerKey > 0, 'Max versions must be positive');
    this.maxVersionsPerKey = maxVersionsPerKey;
  }

  async createVersion(
    key: string,
    versionInfo: VersionInfo
  ): Promise<number> {
    console.assert(key != null && versionInfo != null, 'Key and version info required');

    let snapshot = this.versions.get(key);
    if (!snapshot) {
      snapshot = this.initializeSnapshot(key, versionInfo.partitionId);
      this.versions.set(key, snapshot);
    }

    const newVersion = snapshot.currentVersion + 1;
    const completeVersionInfo = { ...versionInfo, version: newVersion };

    this.addVersionToSnapshot(snapshot, completeVersionInfo);
    await this.enforceVersionLimits(key);

    this.emit('version_created', { key, version: newVersion, snapshot });
    return newVersion;
  }

  getVersion(key: string, version: number): VersionInfo | null {
    console.assert(key != null && version > 0, 'Valid key and version required');

    const snapshot = this.versions.get(key);
    if (!snapshot) return null;

    return snapshot.versions.find((v: unknown) => (v as any).version === version) || null;
  }

  getVersionHistory(key: string): VersionSnapshot | null {
    console.assert(key != null, 'Key required');
    const snapshot = this.versions.get(key);
    return snapshot ? { ...snapshot } : null;
  }

  private initializeSnapshot(key: string, partitionId: string): VersionSnapshot {
    console.assert(key != null && partitionId != null, 'Key and partition required');

    return {
      key,
      partitionId,
      versions: [],
      currentVersion: 0,
      totalVersions: 0,
      firstVersion: 1,
      lastModified: Date.now()
    };
  }

  private addVersionToSnapshot(snapshot: VersionSnapshot, versionInfo: VersionInfo): void {
    console.assert(snapshot != null && versionInfo != null, 'Snapshot and version info required');

    snapshot.versions.push(versionInfo);
    snapshot.currentVersion = versionInfo.version;
    snapshot.totalVersions++;
    snapshot.lastModified = versionInfo.timestamp;
  }

  private async enforceVersionLimits(key: string): Promise<void> {
    console.assert(key != null, 'Key required');

    const snapshot = this.versions.get(key);
    if (!snapshot || snapshot.versions.length <= this.maxVersionsPerKey) {
      return;
    }

    const toRemove = snapshot.versions.length - this.maxVersionsPerKey;
    snapshot.versions.splice(0, toRemove);
    snapshot.firstVersion = snapshot.versions[0]?.version || 1;
    snapshot.totalVersions = snapshot.versions.length;

    this.emit('versions_limited', { key, removedCount: toRemove });
  }
}

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0

// Receipt
// status: OK
// reason_if_blocked: --
// run_id: memory-terminator-003
// inputs: ["VersionInfo", "VersionSnapshot"]
// tools_used: ["Write"]
// versions: {"model":"claude-sonnet-4","prompt":"FSM-First-v1.0"}
// === END FOOTER ===