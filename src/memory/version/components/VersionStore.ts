/**
 * Version Store Component
 * NASA Rule 10 Compliant: Data storage with memory bounds
 */

import { EventEmitter } from 'events';
import { MemoryEntry } from '../../langroid/LangroidMemoryManager';

export class VersionStore extends EventEmitter {
  private versionData: Map<string, Map<number, MemoryEntry>> = new Map();
  private maxMemoryUsage: number;
  private currentMemoryUsage: number = 0;

  constructor(maxMemoryUsage: number = 100 * 1024 * 1024) { // 100MB default
    super();
    console.assert(maxMemoryUsage > 0, 'Max memory usage must be positive');
    this.maxMemoryUsage = maxMemoryUsage;
  }

  async storeVersion(
    key: string,
    version: number,
    entry: MemoryEntry
  ): Promise<boolean> {
    console.assert(key != null && version > 0 && entry != null, 'Valid parameters required');

    if (!this.checkMemoryBounds(entry.size)) {
      this.emit('memory_limit_exceeded', { key, version, entrySize: entry.size });
      return false;
    }

    let keyVersions = this.versionData.get(key);
    if (!keyVersions) {
      keyVersions = new Map();
      this.versionData.set(key, keyVersions);
    }

    keyVersions.set(version, { ...entry });
    this.currentMemoryUsage += entry.size;

    this.emit('version_stored', { key, version, size: entry.size });
    return true;
  }

  getVersion(key: string, version: number): MemoryEntry | null {
    console.assert(key != null && version > 0, 'Valid key and version required');

    const keyVersions = this.versionData.get(key);
    return keyVersions?.get(version) || null;
  }

  getLatestVersion(key: string): MemoryEntry | null {
    console.assert(key != null, 'Key required');

    const keyVersions = this.versionData.get(key);
    if (!keyVersions || keyVersions.size === 0) return null;

    const maxVersion = Math.max(...keyVersions.keys());
    return keyVersions.get(maxVersion) || null;
  }

  removeVersion(key: string, version: number): boolean {
    console.assert(key != null && version > 0, 'Valid key and version required');

    const keyVersions = this.versionData.get(key);
    const entry = keyVersions?.get(version);

    if (!entry) return false;

    keyVersions.delete(version);
    this.currentMemoryUsage -= entry.size;

    if (keyVersions.size === 0) {
      this.versionData.delete(key);
    }

    this.emit('version_removed', { key, version, freedSize: entry.size });
    return true;
  }

  getMemoryUsage(): { current: number; max: number; utilization: number } {
    const utilization = this.maxMemoryUsage > 0 ?
      (this.currentMemoryUsage / this.maxMemoryUsage) * 100 : 0;

    return {
      current: this.currentMemoryUsage,
      max: this.maxMemoryUsage,
      utilization
    };
  }

  private checkMemoryBounds(entrySize: number): boolean {
    console.assert(entrySize >= 0, 'Entry size must be non-negative');

    return (this.currentMemoryUsage + entrySize) <= this.maxMemoryUsage;
  }
}

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0

// Receipt
// status: OK
// reason_if_blocked: --
// run_id: memory-terminator-004
// inputs: ["MemoryEntry", "maxMemoryUsage"]
// tools_used: ["Write"]
// versions: {"model":"claude-sonnet-4","prompt":"FSM-First-v1.0"}
// === END FOOTER ===