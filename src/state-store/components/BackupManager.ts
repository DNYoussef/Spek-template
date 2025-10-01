/**
 * Backup Manager Component
 * NASA Rule 10 Compliant: Bounded backup operations
 */

import { EventEmitter } from 'events';
import { StateRecord, StateSnapshot } from '~types/StateStoreTypes';

export class BackupManager extends EventEmitter {
  private backupInterval: number;
  private maxBackupSize: number;
  private maxBackupCount: number;
  private backupTimer?: NodeJS.Timeout;
  private backupHistory: Map<string, StateSnapshot> = new Map();

  constructor(
    backupInterval: number = 300000, // 5 minutes
    maxBackupSize: number = 10 * 1024 * 1024, // 10MB
    maxBackupCount: number = 24 // Keep 24 backups (2 hours worth)
  ) {
    super();
    console.assert(backupInterval > 0, 'Backup interval must be positive');
    console.assert(maxBackupSize > 0, 'Max backup size must be positive');
    console.assert(maxBackupCount > 0, 'Max backup count must be positive');

    this.backupInterval = backupInterval;
    this.maxBackupSize = maxBackupSize;
    this.maxBackupCount = maxBackupCount;
  }

  startBackupSchedule(): void {
    if (this.backupTimer) {
      clearInterval(this.backupTimer);
    }

    this.backupTimer = setInterval(() => {
      this.emit('backup_scheduled');
    }, this.backupInterval);

    this.emit('backup_schedule_started', { interval: this.backupInterval });
  }

  stopBackupSchedule(): void {
    if (this.backupTimer) {
      clearInterval(this.backupTimer);
      this.backupTimer = undefined;
      this.emit('backup_schedule_stopped');
    }
  }

  async createBackup(states: Map<string, StateRecord>): Promise<string> {
    console.assert(states != null, 'States map required');

    const backupSize = this.calculateBackupSize(states);
    if (backupSize > this.maxBackupSize) {
      this.emit('backup_too_large', { size: backupSize, maxSize: this.maxBackupSize });
      throw new Error(`Backup size ${backupSize} exceeds limit ${this.maxBackupSize}`);
    }

    const backupId = this.generateBackupId();
    const snapshot: StateSnapshot = {
      id: backupId,
      timestamp: new Date(),
      states: new Map(states),
      metadata: {
        version: '1.0.0',
        checksum: this.calculateChecksum(states),
        totalStates: states.size
      }
    };

    this.backupHistory.set(backupId, snapshot);
    await this.enforceBackupLimits();

    this.emit('backup_created', {
      id: backupId,
      size: backupSize,
      stateCount: states.size
    });

    return backupId;
  }

  async restoreBackup(backupId: string): Promise<Map<string, StateRecord> | null> {
    console.assert(backupId != null, 'Backup ID required');

    const backup = this.backupHistory.get(backupId);
    if (!backup) {
      this.emit('backup_not_found', { id: backupId });
      return null;
    }

    // Verify backup integrity
    const currentChecksum = this.calculateChecksum(backup.states);
    if (currentChecksum !== backup.metadata.checksum) {
      this.emit('backup_corrupted', { id: backupId });
      return null;
    }

    this.emit('backup_restored', {
      id: backupId,
      stateCount: backup.states.size,
      timestamp: backup.timestamp
    });

    return new Map(backup.states);
  }

  getBackupInfo(backupId: string): Omit<StateSnapshot, 'states'> | null {
    console.assert(backupId != null, 'Backup ID required');

    const backup = this.backupHistory.get(backupId);
    if (!backup) return null;

    return {
      id: backup.id,
      timestamp: backup.timestamp,
      metadata: backup.metadata
    };
  }

  listBackups(): Array<Omit<StateSnapshot, 'states'>> {
    return Array.from(this.backupHistory.values()).map(backup => ({
      id: backup.id,
      timestamp: backup.timestamp,
      metadata: backup.metadata
    }));
  }

  deleteBackup(backupId: string): boolean {
    console.assert(backupId != null, 'Backup ID required');

    const deleted = this.backupHistory.delete(backupId);
    if (deleted) {
      this.emit('backup_deleted', { id: backupId });
    }
    return deleted;
  }

  private calculateBackupSize(states: Map<string, StateRecord>): number {
    console.assert(states != null, 'States map required');

    let totalSize = 0;
    for (const state of states.values()) {
      totalSize += JSON.stringify(state).length;
    }
    return totalSize;
  }

  private calculateChecksum(states: Map<string, StateRecord>): string {
    console.assert(states != null, 'States map required');

    const sortedStates = Array.from(states.entries()).sort(([a], [b]) => a.localeCompare(b));
    const data = JSON.stringify(sortedStates);

    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(16);
  }

  private async enforceBackupLimits(): Promise<void> {
    if (this.backupHistory.size <= this.maxBackupCount) {
      return;
    }

    // Remove oldest backups (NASA Rule 10: Bounded operations)
    const sortedBackups = Array.from(this.backupHistory.entries())
      .sort(([, a], [, b]) => a.timestamp.getTime() - b.timestamp.getTime());

    const toRemove = sortedBackups.slice(0, this.backupHistory.size - this.maxBackupCount);
    for (const [id] of toRemove) {
      this.backupHistory.delete(id);
      this.emit('backup_removed', { id, reason: 'limit_exceeded' });
    }
  }

  private generateBackupId(): string {
    return `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0

// Receipt
// status: OK
// reason_if_blocked: --
// run_id: memory-terminator-013
// inputs: ["StateSnapshot", "maxBackupSize"]
// tools_used: ["Write"]
// versions: {"model":"claude-sonnet-4","prompt":"FSM-First-v1.0"}
// === END FOOTER ===