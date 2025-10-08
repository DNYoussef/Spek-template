/**
 * Version Cleaner Component
 * NASA Rule 10 Compliant: Bounded cleanup operations
 */

import { EventEmitter } from 'events';
import { VersionSnapshot } from '~types/MemoryVersionTypes';

export interface CleanupConfig {
  retentionPeriod: number;
  maxCleanupBatch: number;
  keepEveryNth: number;
}

export class VersionCleaner extends EventEmitter {
  private config: CleanupConfig;
  private cleanupInProgress: boolean = false;

  constructor(config: Partial<CleanupConfig> = {}) {
    super();
    this.config = {
      retentionPeriod: 86400000, // 24 hours
      maxCleanupBatch: 100, // Max 100 versions per cleanup
      keepEveryNth: 5,
      ...config
    };
  }

  async cleanupOldVersions(
    versions: Map<string, VersionSnapshot>,
    versionRemover: (key: string, version: number) => boolean
  ): Promise<number> {
    console.assert(versions != null && versionRemover != null, 'Parameters required');

    if (this.cleanupInProgress) {
      this.emit('cleanup_skipped', { reason: 'already_in_progress' });
      return 0;
    }

    this.cleanupInProgress = true;

    try {
      const cleanedCount = await this.performCleanup(versions, versionRemover);
      this.emit('cleanup_completed', { cleanedCount });
      return cleanedCount;
    } finally {
      this.cleanupInProgress = false;
    }
  }

  async compactVersions(
    key: string,
    snapshot: VersionSnapshot,
    versionRemover: (key: string, version: number) => boolean
  ): Promise<number> {
    console.assert(key != null && snapshot != null && versionRemover != null, 'Parameters required');

    const versionsToKeep = this.selectVersionsToKeep(snapshot);
    const versionsToRemove = snapshot.versions
      .filter((v: unknown) => !versionsToKeep.has((v as any).version))
      .slice(0, this.config.maxCleanupBatch);

    let removedCount = 0;
    for (const version of versionsToRemove) {
      if (versionRemover(key, version.version)) {
        removedCount++;
      }
    }

    this.emit('versions_compacted', { key, removedCount, keptCount: versionsToKeep.size });
    return removedCount;
  }

  private async performCleanup(
    versions: Map<string, VersionSnapshot>,
    versionRemover: (key: string, version: number) => boolean
  ): Promise<number> {
    console.assert(versions != null && versionRemover != null, 'Parameters required');

    const now = Date.now();
    let totalCleaned = 0;
    let processedInBatch = 0;

    for (const [key, snapshot] of versions.entries()) {
      if (processedInBatch >= this.config.maxCleanupBatch) {
        break; // NASA Rule 10: Bounded operations
      }

      const cleaned = await this.cleanupKeyVersions(key, snapshot, now, versionRemover);
      totalCleaned += cleaned;
      processedInBatch += cleaned;
    }

    return totalCleaned;
  }

  private async cleanupKeyVersions(
    key: string,
    snapshot: VersionSnapshot,
    now: number,
    versionRemover: (key: string, version: number) => boolean
  ): Promise<number> {
    console.assert(key != null && snapshot != null && versionRemover != null, 'Parameters required');

    const versionsToClean = snapshot.versions.filter((v: unknown) =>
      now - (v as any).timestamp > this.config.retentionPeriod &&
      (v as any).version !== snapshot.currentVersion
    );

    let cleanedCount = 0;
    for (const version of versionsToClean) {
      if (versionRemover(key, version.version)) {
        cleanedCount++;
      }
    }

    return cleanedCount;
  }

  private selectVersionsToKeep(snapshot: VersionSnapshot): Set<number> {
    console.assert(snapshot != null, 'Snapshot required');

    const versionsToKeep = new Set<number>();

    // Always keep first and last versions
    versionsToKeep.add(snapshot.firstVersion);
    versionsToKeep.add(snapshot.currentVersion);

    // Keep every nth version (bounded by config)
    for (let i = 0; i < snapshot.versions.length; i += this.config.keepEveryNth) {
      versionsToKeep.add(snapshot.versions[i].version);
    }

    return versionsToKeep;
  }
}

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0

// Receipt
// status: OK
// reason_if_blocked: --
// run_id: memory-terminator-005
// inputs: ["CleanupConfig", "VersionSnapshot"]
// tools_used: ["Write"]
// versions: {"model":"claude-sonnet-4","prompt":"FSM-First-v1.0"}
// === END FOOTER ===