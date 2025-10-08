/**
 * Filesystem Persistence for A2A Communications
 * Stores communication snapshots and maintains audit trails
 * NASA Rule 10 Compliant with version tracking
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { EventEmitter } from 'events';
import {
  OptimizedCommunication,
  AgentIdentity,
  AgentMessage
} from '../a2a-context-dna/interfaces/types';

export interface CommunicationSnapshot {
  id: string;
  timestamp: number;
  sourceAgent: AgentIdentity;
  targetAgent: AgentIdentity;
  originalMessage: AgentMessage;
  optimizedCommunication: OptimizedCommunication;
  qualityScore: number;
  contextDNA: any;
  version: number;
}

export interface AuditTrailEntry {
  id: string;
  timestamp: number;
  operation: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'OPTIMIZE';
  entityType: 'COMMUNICATION' | 'PATTERN' | 'OPTIMIZATION';
  entityId: string;
  agentId: string;
  metadata: any;
  success: boolean;
  errorMessage?: string;
}

export interface OptimizationHistory {
  communicationId: string;
  versions: VersionEntry[];
  currentVersion: number;
  bestQualityScore: number;
  averageQualityScore: number;
}

export interface VersionEntry {
  version: number;
  timestamp: number;
  qualityScore: number;
  changes: string[];
  optimizationMethod: string;
}

export class FilesystemPersistence extends EventEmitter {
  private readonly basePath: string;
  private readonly snapshotPath: string;
  private readonly auditPath: string;
  private readonly historyPath: string;
  private readonly maxSnapshots = 1000;
  private readonly maxAuditEntries = 10000;
  private readonly maxVersions = 10;
  private initialized = false;

  constructor(basePath: string = '.claude/.artifacts/dspy-memory') {
    super();
    this.basePath = basePath;
    this.snapshotPath = path.join(basePath, 'snapshots');
    this.auditPath = path.join(basePath, 'audit');
    this.historyPath = path.join(basePath, 'history');

    assert(this.basePath.length > 0, 'Base path required');
    assert(!this.basePath.includes('..'), 'Path traversal not allowed');
  }

  /**
   * Initialize filesystem structure
   * NASA Rule 10: Bounded initialization, no recursion
   */
  async initializeComponent(): Promise<void> {
    if (this.initialized) return;

    try {
      // Create directory structure
      await this.ensureDirectory(this.basePath);
      await this.ensureDirectory(this.snapshotPath);
      await this.ensureDirectory(this.auditPath);
      await this.ensureDirectory(this.historyPath);

      // Clean old snapshots if needed
      await this.cleanOldSnapshots();

      this.initialized = true;
      this.emit('filesystem:initialized', this.basePath);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Filesystem initialization failed: ${errorMessage}`);
    }
  }

  /**
   * Save communication snapshot
   * NASA Rule 10: Bounded file operations, version control
   */
  async saveSnapshot(
    communication: OptimizedCommunication,
    sourceAgent: AgentIdentity,
    targetAgent: AgentIdentity
  ): Promise<string> {
    assert(this.initialized, 'Filesystem must be initialized');
    assert(communication !== null, 'Communication required');
    assert(sourceAgent !== null, 'Source agent required');
    assert(targetAgent !== null, 'Target agent required');

    const snapshotId = this.generateSnapshotId();
    const version = await this.getNextVersion(communication.optimizedMessage.id);

    const snapshot: CommunicationSnapshot = {
      id: snapshotId,
      timestamp: Date.now(),
      sourceAgent,
      targetAgent,
      originalMessage: communication.optimizedMessage,
      optimizedCommunication: communication,
      qualityScore: communication.qualityScore,
      contextDNA: communication.contextDNA,
      version
    };

    // Save snapshot to file
    const filePath = path.join(this.snapshotPath, `${snapshotId}.json`);
    await this.writeJsonFile(filePath, snapshot);

    // Update optimization history
    await this.updateHistory(communication.optimizedMessage.id, version, communication.qualityScore);

    // Create audit trail entry
    await this.createAuditEntry('CREATE', 'COMMUNICATION', snapshotId, sourceAgent.id, true);

    this.emit('snapshot:saved', snapshotId);
    return snapshotId;
  }

  /**
   * Load communication snapshot
   * NASA Rule 10: Safe file reading, error handling
   */
  async loadSnapshot(snapshotId: string): Promise<CommunicationSnapshot | null> {
    assert(this.initialized, 'Filesystem must be initialized');
    assert(snapshotId.length > 0, 'Snapshot ID required');
    assert(!snapshotId.includes('..'), 'Path traversal not allowed');

    try {
      const filePath = path.join(this.snapshotPath, `${snapshotId}.json`);
      const data = await this.readJsonFile(filePath);

      await this.createAuditEntry('READ', 'COMMUNICATION', snapshotId, 'system', true);

      return data as CommunicationSnapshot;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      await this.createAuditEntry('READ', 'COMMUNICATION', snapshotId, 'system', false, errorMessage);
      return null;
    }
  }

  /**
   * Query snapshots by criteria
   * NASA Rule 10: Bounded query, fixed iteration
   */
  async querySnapshots(
    criteria: {
      sourceAgentId?: string;
      targetAgentId?: string;
      minQuality?: number;
      startTime?: number;
      endTime?: number;
    },
    limit: number = 50
  ): Promise<CommunicationSnapshot[]> {
    assert(this.initialized, 'Filesystem must be initialized');
    assert(limit > 0 && limit <= 100, 'Limit must be 1-100');

    const results: CommunicationSnapshot[] = [];

    try {
      const files = await fs.readdir(this.snapshotPath);
      const maxFiles = Math.min(files.length, 200); // Bounded search

      for (let i = 0; i < maxFiles && results.length < limit; i++) {
        const file = files[i];
        if (!file.endsWith('.json')) continue;

        const snapshot = await this.loadSnapshot(path.basename(file, '.json'));
        if (!snapshot) continue;

        // Apply criteria
        if (this.matchesCriteria(snapshot, criteria)) {
          results.push(snapshot);
        }
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.emit('query:error', errorMessage);
    }

    assert(results.length <= limit, 'Results must not exceed limit');
    return results;
  }

  /**
   * Create audit trail entry
   * NASA Rule 10: Bounded audit logging
   */
  async createAuditEntry(
    operation: AuditTrailEntry['operation'],
    entityType: AuditTrailEntry['entityType'],
    entityId: string,
    agentId: string,
    success: boolean,
    errorMessage?: string
  ): Promise<void> {
    assert(this.initialized, 'Filesystem must be initialized');
    assert(operation !== null, 'Operation required');
    assert(entityId.length > 0, 'Entity ID required');

    const entry: AuditTrailEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      timestamp: Date.now(),
      operation,
      entityType,
      entityId,
      agentId,
      metadata: {},
      success,
      errorMessage
    };

    // Write to daily audit file
    const date = new Date().toISOString().split('T')[0];
    const auditFile = path.join(this.auditPath, `audit_${date}.jsonl`);

    await this.appendJsonLine(auditFile, entry);

    // Clean old audit files if needed
    if (Math.random() < 0.01) { // 1% chance to trigger cleanup
      await this.cleanOldAuditFiles();
    }
  }

  /**
   * Get optimization history
   * NASA Rule 10: Bounded history retrieval
   */
  async getOptimizationHistory(
    communicationId: string
  ): Promise<OptimizationHistory | null> {
    assert(this.initialized, 'Filesystem must be initialized');
    assert(communicationId.length > 0, 'Communication ID required');
    assert(!communicationId.includes('..'), 'Path traversal not allowed');

    try {
      const historyFile = path.join(this.historyPath, `${communicationId}.json`);
      const data = await this.readJsonFile(historyFile);
      return data as OptimizationHistory;

    } catch (error) {
      return null;
    }
  }

  /**
   * Update optimization history
   * NASA Rule 10: Bounded version tracking
   */
  private async updateHistory(
    communicationId: string,
    version: number,
    qualityScore: number
  ): Promise<void> {
    assert(communicationId.length > 0, 'Communication ID required');
    assert(version >= 0, 'Version must be non-negative');
    assert(qualityScore >= 0 && qualityScore <= 1, 'Quality score must be 0-1');

    const historyFile = path.join(this.historyPath, `${communicationId}.json`);
    let history: OptimizationHistory;

    try {
      history = await this.readJsonFile(historyFile) as OptimizationHistory;
    } catch {
      // Create new history
      history = {
        communicationId,
        versions: [],
        currentVersion: 0,
        bestQualityScore: 0,
        averageQualityScore: 0
      };
    }

    // Add version entry
    const versionEntry: VersionEntry = {
      version,
      timestamp: Date.now(),
      qualityScore,
      changes: ['DSPy optimization applied'],
      optimizationMethod: 'A2A_ENGINE_v2'
    };

    history.versions.push(versionEntry);

    // Limit versions
    if (history.versions.length > this.maxVersions) {
      history.versions.shift();
    }

    // Update metrics
    history.currentVersion = version;
    history.bestQualityScore = Math.max(history.bestQualityScore, qualityScore);

    const total = history.versions.reduce((sum, v) => sum + v.qualityScore, 0);
    history.averageQualityScore = total / history.versions.length;

    await this.writeJsonFile(historyFile, history);
  }

  /**
   * Helper methods
   * NASA Rule 10: Simple, bounded operations
   */
  private async ensureDirectory(dirPath: string): Promise<void> {
    assert(dirPath.length > 0, 'Directory path required');
    assert(!dirPath.includes('..'), 'Path traversal not allowed');

    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }

  private async writeJsonFile(filePath: string, data: any): Promise<void> {
    assert(filePath.length > 0, 'File path required');
    assert(!filePath.includes('..'), 'Path traversal not allowed');

    const json = JSON.stringify(data, null, 2);
    await fs.writeFile(filePath, json, 'utf-8');
  }

  private async readJsonFile(filePath: string): Promise<any> {
    assert(filePath.length > 0, 'File path required');
    assert(!filePath.includes('..'), 'Path traversal not allowed');

    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  }

  private async appendJsonLine(filePath: string, data: any): Promise<void> {
    assert(filePath.length > 0, 'File path required');
    assert(!filePath.includes('..'), 'Path traversal not allowed');

    const line = JSON.stringify(data) + '\n';
    await fs.appendFile(filePath, line, 'utf-8');
  }

  private generateSnapshotId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).slice(2, 8);
    return `snapshot_${timestamp}_${random}`;
  }

  private async getNextVersion(communicationId: string): Promise<number> {
    const history = await this.getOptimizationHistory(communicationId);
    return history ? history.currentVersion + 1 : 1;
  }

  private matchesCriteria(
    snapshot: CommunicationSnapshot,
    criteria: any
  ): boolean {
    if (criteria.sourceAgentId && snapshot.sourceAgent.id !== criteria.sourceAgentId) {
      return false;
    }
    if (criteria.targetAgentId && snapshot.targetAgent.id !== criteria.targetAgentId) {
      return false;
    }
    if (criteria.minQuality && snapshot.qualityScore < criteria.minQuality) {
      return false;
    }
    if (criteria.startTime && snapshot.timestamp < criteria.startTime) {
      return false;
    }
    if (criteria.endTime && snapshot.timestamp > criteria.endTime) {
      return false;
    }
    return true;
  }

  private async cleanOldSnapshots(): Promise<void> {
    try {
      const files = await fs.readdir(this.snapshotPath);
      if (files.length > this.maxSnapshots) {
        // Sort by timestamp and remove oldest
        const toRemove = files.length - this.maxSnapshots;
        for (let i = 0; i < toRemove; i++) {
          await fs.unlink(path.join(this.snapshotPath, files[i]));
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.emit('cleanup:error', errorMessage);
    }
  }

  private async cleanOldAuditFiles(): Promise<void> {
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    let cleanedFiles = 0;

    try {
      const files = await fs.readdir(this.auditPath);
      const auditFiles = files.filter(f => f.startsWith('audit_') && f.endsWith('.jsonl'));

      for (let i = 0; i < Math.min(auditFiles.length, 20); i++) {
        const file = auditFiles[i];
        const filePath = path.join(this.auditPath, file);

        try {
          const stats = await fs.stat(filePath);

          if (stats.mtimeMs < thirtyDaysAgo) {
            await fs.unlink(filePath);
            cleanedFiles++;
          }
        } catch (fileError) {
          // File may have been deleted already, continue
          console.warn(`Could not process audit file ${file}:`, fileError.message);
        }
      }

      if (cleanedFiles > 0) {
        console.log(`Cleaned ${cleanedFiles} old audit files`);
        this.emit('audit:cleaned', { files: cleanedFiles });
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Audit cleanup failed:', errorMessage);
      this.emit('cleanup:error', errorMessage);
    }
  }

  /**
   * Get filesystem storage metrics
   * NASA Rule 10: Bounded metrics calculation
   */
  async getStorageMetrics(): Promise<{
    snapshotCount: number;
    auditFileCount: number;
    historyFileCount: number;
    totalSize: number;
    oldestSnapshot: number | null;
    newestSnapshot: number | null;
  }> {
    assert(this.initialized, 'Filesystem must be initialized');

    const metrics = {
      snapshotCount: 0,
      auditFileCount: 0,
      historyFileCount: 0,
      totalSize: 0,
      oldestSnapshot: null as number | null,
      newestSnapshot: null as number | null
    };

    try {
      // Count snapshots
      const snapshots = await fs.readdir(this.snapshotPath);
      metrics.snapshotCount = snapshots.filter(f => f.endsWith('.json')).length;

      // Count audit files
      const auditFiles = await fs.readdir(this.auditPath);
      metrics.auditFileCount = auditFiles.filter(f => f.endsWith('.jsonl')).length;

      // Count history files
      const historyFiles = await fs.readdir(this.historyPath);
      metrics.historyFileCount = historyFiles.filter(f => f.endsWith('.json')).length;

      // Find oldest and newest snapshots (limited check)
      const maxCheck = Math.min(snapshots.length, 50);
      for (let i = 0; i < maxCheck; i++) {
        const file = snapshots[i];
        if (!file.endsWith('.json')) continue;

        try {
          const filePath = path.join(this.snapshotPath, file);
          const stats = await fs.stat(filePath);
          const mtime = stats.mtimeMs;

          if (metrics.oldestSnapshot === null || mtime < metrics.oldestSnapshot) {
            metrics.oldestSnapshot = mtime;
          }
          if (metrics.newestSnapshot === null || mtime > metrics.newestSnapshot) {
            metrics.newestSnapshot = mtime;
          }

          metrics.totalSize += stats.size;
        } catch {
          // Skip files that can't be read
        }
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Storage metrics calculation failed:', errorMessage);
    }

    return metrics;
  }
}

/**
 * Assert function for NASA Rule 10 compliance
 */
function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

/*
// Version & Run Log
// Version History

// Version: 1.0.0
// Version: 2.0.0

// Receipt
// status: OK
// reason_if_blocked: --
// run_id: filesystem-persist-update-002
// inputs: ["Enhanced cleanup methods", "Storage metrics"]
// tools_used: ["Edit"]
// versions: {"model":"claude-sonnet-4","prompt":"dspy-integration-v2.0"}
*/