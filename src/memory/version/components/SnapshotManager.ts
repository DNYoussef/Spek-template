/**
 * Snapshot Manager Component
 * NASA Rule 10 Compliant: Bounded snapshot operations
 */

import { EventEmitter } from 'events';
import { VersionSnapshot } from '../types/MemoryVersionTypes';

export interface SnapshotRecord {
  id: string;
  timestamp: number;
  description?: string;
  versions: Map<string, VersionSnapshot>;
  size: number;
  checksum: string;
}

export class SnapshotManager extends EventEmitter {
  private snapshots: Map<string, SnapshotRecord> = new Map();
  private maxSnapshots: number;
  private maxSnapshotSize: number;

  constructor(
    maxSnapshots: number = 10,
    maxSnapshotSize: number = 50 * 1024 * 1024 // 50MB
  ) {
    super();
    console.assert(maxSnapshots > 0, 'Max snapshots must be positive');
    console.assert(maxSnapshotSize > 0, 'Max snapshot size must be positive');

    this.maxSnapshots = maxSnapshots;
    this.maxSnapshotSize = maxSnapshotSize;
  }

  async createSnapshot(
    versions: Map<string, VersionSnapshot>,
    description?: string
  ): Promise<string> {
    console.assert(versions != null, 'Versions map required');

    const snapshotId = this.generateSnapshotId();
    const size = this.calculateSnapshotSize(versions);

    if (size > this.maxSnapshotSize) {
      this.emit('snapshot_too_large', { id: snapshotId, size, maxSize: this.maxSnapshotSize });
      throw new Error(`Snapshot size ${size} exceeds limit ${this.maxSnapshotSize}`);
    }

    const snapshot: SnapshotRecord = {
      id: snapshotId,
      timestamp: Date.now(),
      description,
      versions: new Map(versions),
      size,
      checksum: this.calculateChecksum(versions)
    };

    this.snapshots.set(snapshotId, snapshot);
    await this.enforceSnapshotLimits();

    this.emit('snapshot_created', { id: snapshotId, size, description });
    return snapshotId;
  }

  async restoreSnapshot(snapshotId: string): Promise<Map<string, VersionSnapshot> | null> {
    console.assert(snapshotId != null, 'Snapshot ID required');

    const snapshot = this.snapshots.get(snapshotId);
    if (!snapshot) {
      this.emit('snapshot_not_found', { id: snapshotId });
      return null;
    }

    // Verify snapshot integrity
    const currentChecksum = this.calculateChecksum(snapshot.versions);
    if (currentChecksum !== snapshot.checksum) {
      this.emit('snapshot_corrupted', { id: snapshotId });
      return null;
    }

    this.emit('snapshot_restored', { id: snapshotId, size: snapshot.size });
    return new Map(snapshot.versions);
  }

  getSnapshot(snapshotId: string): SnapshotRecord | null {
    console.assert(snapshotId != null, 'Snapshot ID required');
    const snapshot = this.snapshots.get(snapshotId);
    return snapshot ? { ...snapshot } : null;
  }

  listSnapshots(): Array<Omit<SnapshotRecord, 'versions'>> {
    return Array.from(this.snapshots.values()).map(snapshot => ({
      id: snapshot.id,
      timestamp: snapshot.timestamp,
      description: snapshot.description,
      size: snapshot.size,
      checksum: snapshot.checksum
    }));
  }

  deleteSnapshot(snapshotId: string): boolean {
    console.assert(snapshotId != null, 'Snapshot ID required');

    const deleted = this.snapshots.delete(snapshotId);
    if (deleted) {
      this.emit('snapshot_deleted', { id: snapshotId });
    }
    return deleted;
  }

  private calculateSnapshotSize(versions: Map<string, VersionSnapshot>): number {
    console.assert(versions != null, 'Versions map required');

    let totalSize = 0;
    for (const snapshot of versions.values()) {
      // Estimate size based on version count and data
      totalSize += snapshot.versions.length * 1024; // Rough estimate
    }
    return totalSize;
  }

  private calculateChecksum(versions: Map<string, VersionSnapshot>): string {
    console.assert(versions != null, 'Versions map required');

    const data = JSON.stringify(Array.from(versions.entries()));
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }

  private async enforceSnapshotLimits(): Promise<void> {
    if (this.snapshots.size <= this.maxSnapshots) {
      return;
    }

    // Remove oldest snapshots (NASA Rule 10: Bounded operations)
    const sortedSnapshots = Array.from(this.snapshots.entries())
      .sort(([, a], [, b]) => a.timestamp - b.timestamp);

    const toRemove = sortedSnapshots.slice(0, this.snapshots.size - this.maxSnapshots);
    for (const [id] of toRemove) {
      this.snapshots.delete(id);
      this.emit('snapshot_removed', { id, reason: 'limit_exceeded' });
    }
  }

  private generateSnapshotId(): string {
    return `snap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

<!-- AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE -->
## Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
|--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
| 1.0.0 | 2025-09-28T19:15:43-04:00 | mega-agent-103@claude-sonnet-4 | Snapshot manager with bounded operations | SnapshotManager.ts | OK | NASA Rule 10: Bounded snapshot size/count | 0.00 | u7v8w9x |

### Receipt
- status: OK
- reason_if_blocked: --
- run_id: memory-terminator-006
- inputs: ["VersionSnapshot", "maxSnapshots"]
- tools_used: ["Write"]
- versions: {"model":"claude-sonnet-4","prompt":"FSM-First-v1.0"}
<!-- AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE -->