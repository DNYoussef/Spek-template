import { MemoryEntry } from '../langroid/LangroidMemoryManager';
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
export class MemoryVersionController {
  private versions: Map<string, VersionSnapshot> = new Map();
  private versionData: Map<string, Map<number, MemoryEntry>> = new Map();
  private config: VersionControlConfig;
  private metrics: VersionMetrics;
  private cleanupTimer?: NodeJS.Timeout;
  constructor(config: Partial<VersionControlConfig> = {}) {
    this.config = {
      maxVersionsPerKey: 10,
      enableSnapshots: true,
      snapshotInterval: 300000, // 5 minutes
      retentionPeriod: 86400000, // 24 hours
      enableCompression: true,
      enableDelta: true,
      ...config
    };
    this.metrics = {
      totalVersions: 0,
      totalSnapshots: 0,
      storageUsed: 0,
      compressionRatio: 1.0,
      oldestVersion: 0,
      newestVersion: 0
    };
    this.startCleanupTimer();
  }
  /**
   * Create a new version of a memory entry
   */
  async createVersion(
    key: string,
    entry: MemoryEntry,
    author: string,
    changeDescription?: string
  ): Promise<number> {
    let snapshot = this.versions.get(key);
    if (!snapshot) {
      snapshot = {
        key,
        partitionId: entry.partitionId,
        versions: [],
        currentVersion: 0,
        totalVersions: 0,
        firstVersion: 1,
        lastModified: entry.timestamp
      };
      this.versions.set(key, snapshot);
      this.versionData.set(key, new Map());
    }
    const newVersion = snapshot.currentVersion + 1;
    const checksum = this.calculateChecksum(entry);
    const versionInfo: VersionInfo = {
      id: this.generateVersionId(key, newVersion),
      version: newVersion,
      timestamp: entry.timestamp,
      checksum,
      size: entry.size,
      author,
      changeDescription,
      parentVersion: snapshot.currentVersion > 0 ? snapshot.currentVersion : undefined
    };
    // Store version data
    const keyVersions = this.versionData.get(key)!;
    keyVersions.set(newVersion, { ...entry });
    // Update snapshot
    snapshot.versions.push(versionInfo);
    snapshot.currentVersion = newVersion;
    snapshot.totalVersions++;
    snapshot.lastModified = entry.timestamp;
    // Enforce version limits
    await this.enforceVersionLimits(key);
    this.updateMetrics();
    return newVersion;
  }
  /**
   * Get a specific version of an entry
   */
  getVersion(key: string, version: number): MemoryEntry | null {
    const keyVersions = this.versionData.get(key);
    if (!keyVersions) {
      return null;
    }
    return keyVersions.get(version) || null;
  }
  /**
   * Get the latest version of an entry
   */
  getLatestVersion(key: string): MemoryEntry | null {
    const snapshot = this.versions.get(key);
    if (!snapshot) {
      return null;
    }
    return this.getVersion(key, snapshot.currentVersion);
  }
  /**
   * Get version history for a key
   */
  getVersionHistory(key: string): VersionSnapshot | null {
    const snapshot = this.versions.get(key);
    return snapshot ? { ...snapshot } : null;
  }
  /**
   * Get differences between two versions
   */
  async getDiff(key: string, fromVersion: number, toVersion: number): Promise<VersionDiff | null> {
    const fromEntry = this.getVersion(key, fromVersion);
    const toEntry = this.getVersion(key, toVersion);
    if (!fromEntry || !toEntry) {
      return null;
    }
    const diff: VersionDiff = {
      key,
      fromVersion,
      toVersion,
      changeType: this.determineChangeType(fromEntry, toEntry),
      sizeDelta: toEntry.size - fromEntry.size
    };
    // Calculate field-level changes if data is object
    if (this.isObject(fromEntry.data) && this.isObject(toEntry.data)) {
      diff.fieldChanges = this.calculateFieldChanges(fromEntry.data, toEntry.data);
    }
    return diff;
  }
  /**
   * Rollback to a previous version
   */
  async rollback(key: string, targetVersion: number, author: string): Promise<boolean> {
    const targetEntry = this.getVersion(key, targetVersion);
    if (!targetEntry) {
      return false;
    }
    // Create new version with old data
    const newVersion = await this.createVersion(
      key,
      {
        ...targetEntry,
        timestamp: Date.now(),
        version: targetVersion // Keep original version reference
      },
      author,
      `Rollback to version ${targetVersion}`
    );
    return newVersion > 0;
  }
  /**
   * Create a snapshot of current state
   */
  async createSnapshot(description?: string): Promise<string> {
    const snapshotId = this.generateSnapshotId();
    const timestamp = Date.now();
    // Store current state of all versions
    const snapshotData = {
      id: snapshotId,
      timestamp,
      description,
      versions: new Map(this.versions),
      versionData: new Map(this.versionData)
    };
    // In a real implementation, you'd persist this to storage
    // For now, we'll just emit an event
    this.emit('snapshot_created', { snapshotId, timestamp, description });
    this.metrics.totalSnapshots++;
    return snapshotId;
  }
  /**
   * Restore from a snapshot
   */
  async restoreSnapshot(snapshotId: string): Promise<boolean> {
    // In a real implementation, you'd load from storage
    // For now, just emit an event
    this.emit('snapshot_restored', { snapshotId });
    return true;
  }
  /**
   * Compact version history by removing intermediate versions
   */
  async compactVersions(key: string, keepEveryNth: number = 3): Promise<number> {
    const snapshot = this.versions.get(key);
    const keyVersions = this.versionData.get(key);
    if (!snapshot || !keyVersions) {
      return 0;
    }
    const versionsToKeep = new Set<number>();
    // Always keep first and last versions
    versionsToKeep.add(snapshot.firstVersion);
    versionsToKeep.add(snapshot.currentVersion);
    // Keep every nth version
    for (let i = 0; i < snapshot.versions.length; i += keepEveryNth) {
      versionsToKeep.add(snapshot.versions[i].version);
    }
    // Remove versions not in keep set
    let removedCount = 0;
    const versionsToRemove: number[] = [];
    for (const version of keyVersions.keys()) {
      if (!versionsToKeep.has(version)) {
        versionsToRemove.push(version);
      }
    }
    for (const version of versionsToRemove) {
      keyVersions.delete(version);
      removedCount++;
    }
    // Update snapshot
    snapshot.versions = snapshot.versions.filter(v => versionsToKeep.has(v.version));
    snapshot.totalVersions = snapshot.versions.length;
    this.updateMetrics();
    this.emit('versions_compacted', { key, removedCount, keptCount: versionsToKeep.size });
    return removedCount;
  }
  /**
   * Get version metrics
   */
  getMetrics(): VersionMetrics {
    this.updateMetrics();
    return { ...this.metrics };
  }
  /**
   * Export version history for a key
   */
  exportVersionHistory(key: string): any {
    const snapshot = this.versions.get(key);
    const keyVersions = this.versionData.get(key);
    if (!snapshot || !keyVersions) {
      return null;
    }
    return {
      snapshot,
      versions: Object.fromEntries(keyVersions.entries())
    };
  }
  /**
   * Import version history for a key
   */
  async importVersionHistory(key: string, exportedData: any): Promise<boolean> {
    try {
      this.versions.set(key, exportedData.snapshot);
      this.versionData.set(key, new Map(Object.entries(exportedData.versions)));
      this.updateMetrics();
      this.emit('version_history_imported', { key });
      return true;
    } catch (error) {
      this.emit('import_error', { key, error });
      return false;
    }
  }
  /**
   * Clean up old versions
   */\n  async cleanup(): Promise<number> {\n    const now = Date.now();\n    let cleanedCount = 0;\n    for (const [key, snapshot] of this.versions.entries()) {\n      const keyVersions = this.versionData.get(key);\n      if (!keyVersions) continue;\n      const versionsToRemove: number[] = [];\n      for (const versionInfo of snapshot.versions) {\n        // Remove if older than retention period and not the latest\n        if (\n          now - versionInfo.timestamp > this.config.retentionPeriod &&\n          versionInfo.version !== snapshot.currentVersion\n        ) {\n          versionsToRemove.push(versionInfo.version);\n        }\n      }\n      // Remove old versions\n      for (const version of versionsToRemove) {\n        keyVersions.delete(version);\n        cleanedCount++;\n      }\n      // Update snapshot\n      snapshot.versions = snapshot.versions.filter(\n        v => !versionsToRemove.includes(v.version)\n      );\n      snapshot.totalVersions = snapshot.versions.length;\n      // If no versions left, remove the key entirely\n      if (snapshot.versions.length === 0) {\n        this.versions.delete(key);\n        this.versionData.delete(key);\n      }\n    }\n    this.updateMetrics();\n    this.emit('cleanup_completed', { cleanedCount });\n    return cleanedCount;\n  }\n  /**\n   * Shutdown version controller\n   */\n  async shutdown(): Promise<void> {\n    if (this.cleanupTimer) {\n      clearInterval(this.cleanupTimer);\n    }\n    // Perform final cleanup\n    await this.cleanup();\n    this.emit('shutdown');\n  }\n  private async enforceVersionLimits(key: string): Promise<void> {\n    const snapshot = this.versions.get(key);\n    const keyVersions = this.versionData.get(key);\n    if (!snapshot || !keyVersions || snapshot.versions.length <= this.config.maxVersionsPerKey) {\n      return;\n    }\n    // Remove oldest versions, but keep the latest\n    const versionsToRemove = snapshot.versions\n      .slice(0, snapshot.versions.length - this.config.maxVersionsPerKey)\n      .map(v => v.version);\n    for (const version of versionsToRemove) {\n      keyVersions.delete(version);\n    }\n    // Update snapshot\n    snapshot.versions = snapshot.versions.slice(-this.config.maxVersionsPerKey);\n    snapshot.totalVersions = snapshot.versions.length;\n    snapshot.firstVersion = snapshot.versions[0]?.version || 1;\n  }\n  private calculateChecksum(entry: MemoryEntry): string {\n    const data = JSON.stringify({\n      data: entry.data,\n      size: entry.size,\n      timestamp: entry.timestamp\n    });\n    // Simple hash function (in production, use crypto.createHash)\n    let hash = 0;\n    for (let i = 0; i < data.length; i++) {\n      const char = data.charCodeAt(i);\n      hash = ((hash << 5) - hash) + char;\n      hash = hash & hash; // Convert to 32-bit integer\n    }\n    return hash.toString(16);\n  }\n  private determineChangeType(fromEntry: MemoryEntry, toEntry: MemoryEntry): 'created' | 'modified' | 'deleted' | 'moved' {\n    if (fromEntry.partitionId !== toEntry.partitionId) {\n      return 'moved';\n    }\n    if (JSON.stringify(fromEntry.data) !== JSON.stringify(toEntry.data)) {\n      return 'modified';\n    }\n    return 'modified'; // Default\n  }\n  private calculateFieldChanges(oldData: any, newData: any): Array<{\n    field: string;\n    oldValue: any;\n    newValue: any;\n    changeType: 'added' | 'removed' | 'modified';\n  }> {\n    const changes: Array<{\n      field: string;\n      oldValue: any;\n      newValue: any;\n      changeType: 'added' | 'removed' | 'modified';\n    }> = [];\n    const allKeys = new Set([...Object.keys(oldData), ...Object.keys(newData)]);\n    for (const key of allKeys) {\n      const oldValue = oldData[key];\n      const newValue = newData[key];\n      if (!(key in oldData)) {\n        changes.push({ field: key, oldValue: undefined, newValue, changeType: 'added' });\n      } else if (!(key in newData)) {\n        changes.push({ field: key, oldValue, newValue: undefined, changeType: 'removed' });\n      } else if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {\n        changes.push({ field: key, oldValue, newValue, changeType: 'modified' });\n      }\n    }\n    return changes;\n  }\n  private isObject(value: any): boolean {\n    return value !== null && typeof value === 'object' && !Array.isArray(value);\n  }\n  private generateVersionId(key: string, version: number): string {\n    return `v_${key}_${version}_${Date.now()}`;\n  }\n  private generateSnapshotId(): string {\n    return `snap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;\n  }\n  private updateMetrics(): void {\n    let totalVersions = 0;\n    let storageUsed = 0;\n    let oldestVersion = Number.MAX_SAFE_INTEGER;\n    let newestVersion = 0;\n    for (const [, keyVersions] of this.versionData.entries()) {\n      totalVersions += keyVersions.size;\n      for (const [version, entry] of keyVersions.entries()) {\n        storageUsed += entry.size;\n        oldestVersion = Math.min(oldestVersion, version);\n        newestVersion = Math.max(newestVersion, version);\n      }\n    }\n    this.metrics.totalVersions = totalVersions;\n    this.metrics.storageUsed = storageUsed;\n    this.metrics.oldestVersion = oldestVersion === Number.MAX_SAFE_INTEGER ? 0 : oldestVersion;\n    this.metrics.newestVersion = newestVersion;\n  }\n  private startCleanupTimer(): void {\n    if (this.config.retentionPeriod > 0) {\n      this.cleanupTimer = setInterval(() => {\n        this.cleanup();\n      }, Math.min(this.config.retentionPeriod / 4, 3600000)); // Clean up every hour or 1/4 retention period\n    }\n  }\n  private emit(event: string, data?: any): void {\n    // Simple event emission - in a real implementation, this would use EventEmitter\n    console.log(`VersionController Event: ${event}`, data);\n  }\n}\nexport default MemoryVersionController;"