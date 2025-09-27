import { EventEmitter } from 'events';
import { promises as fs } from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { MemoryBlock, PrincessDomain } from '../coordinator/MemoryCoordinator';
export interface PersistenceConfig {
  baseDirectory: string;
  compressionEnabled: boolean;
  encryptionEnabled: boolean;
  backupRetention: number; // Number of backups to keep
  incrementalBackups: boolean;
  backupInterval: number; // Milliseconds between backups
  checksumValidation: boolean;
}
export interface SnapshotMetadata {
  id: string;
  timestamp: Date;
  memoryUsage: number;
  blockCount: number;
  checksum: string;
  version: string;
  compressionRatio?: number;
  domains: Record<PrincessDomain, number>;
}
export interface BackupEntry {
  blockId: string;
  domain: PrincessDomain;
  data: any;
  metadata: any;
  checksum: string;
  timestamp: Date;
}
export interface RestoreOptions {
  targetSnapshot?: string;
  selectiveDomains?: PrincessDomain[];
  validateChecksums?: boolean;
  overwriteExisting?: boolean;
  skipCorrupted?: boolean;
}
/**
 * Memory Persistence and Recovery System
 * Provides durable storage for critical memory data with backup,
 * restore, and corruption recovery capabilities.
 */
export class MemoryPersistence extends EventEmitter {
  private config: PersistenceConfig;
  private backupTimer: NodeJS.Timeout | null = null;
  private isBackupInProgress = false;
  private lastBackupTime: Date | null = null;
  private readonly SNAPSHOT_DIR = 'snapshots';
  private readonly BACKUP_DIR = 'backups';
  private readonly INCREMENTAL_DIR = 'incremental';
  private readonly METADATA_FILE = 'metadata.json';
  private readonly VERSION = '1.0.0';
  constructor(config: Partial<PersistenceConfig> = {}) {
    super();
    this.config = {
      baseDirectory: config.baseDirectory || './memory-persistence',
      compressionEnabled: config.compressionEnabled ?? true,
      encryptionEnabled: config.encryptionEnabled ?? false,
      backupRetention: config.backupRetention ?? 10,
      incrementalBackups: config.incrementalBackups ?? true,
      backupInterval: config.backupInterval ?? 300000, // 5 minutes
      checksumValidation: config.checksumValidation ?? true,
      ...config
    };
    this.initializePersistence();
  }
  private async initializePersistence(): Promise<void> {
    try {
      // Create directory structure
      await this.ensureDirectories();
      // Start automatic backup if interval is set
      if (this.config.backupInterval > 0) {
        this.startAutomaticBackup();
      }
      this.emit('persistence-initialized', { config: this.config });
    } catch (error) {
      this.emit('initialization-failed', { error });
      throw error;
    }
  }
  private async ensureDirectories(): Promise<void> {
    const directories = [
      this.config.baseDirectory,
      path.join(this.config.baseDirectory, this.SNAPSHOT_DIR),
      path.join(this.config.baseDirectory, this.BACKUP_DIR),
      path.join(this.config.baseDirectory, this.INCREMENTAL_DIR)
    ];
    for (const dir of directories) {
      await fs.mkdir(dir, { recursive: true });
    }
  }
  /**
   * Create full memory snapshot
   */
  public async createSnapshot(
    memoryBlocks: Map<string, MemoryBlock>,
    metadata: Record<string, any> = {}
  ): Promise<string> {
    const snapshotId = this.generateSnapshotId();
    const snapshotPath = path.join(this.config.baseDirectory, this.SNAPSHOT_DIR, `${snapshotId}.json`);
    try {
      const snapshot = {
        id: snapshotId,
        timestamp: new Date(),
        version: this.VERSION,
        metadata,
        blocks: Array.from(memoryBlocks.entries()).map(([blockId, block]) => ({
          blockId,
          block: this.serializeBlock(block)
        }))
      };
      // Calculate snapshot statistics
      const stats = this.calculateSnapshotStats(memoryBlocks);
      const snapshotMetadata: SnapshotMetadata = {
        id: snapshotId,
        timestamp: snapshot.timestamp,
        memoryUsage: stats.totalSize,
        blockCount: stats.blockCount,
        checksum: '',
        version: this.VERSION,
        domains: stats.domainDistribution
      };
      // Serialize and optionally compress
      let data = JSON.stringify(snapshot);
      if (this.config.compressionEnabled) {
        data = await this.compressData(data);
        snapshotMetadata.compressionRatio = snapshot.blocks.length / data.length;
      }
      // Calculate checksum
      if (this.config.checksumValidation) {
        snapshotMetadata.checksum = this.calculateChecksum(data);
      }
      // Write snapshot
      await fs.writeFile(snapshotPath, data);
      // Write metadata
      const metadataPath = path.join(this.config.baseDirectory, this.SNAPSHOT_DIR, `${snapshotId}_${this.METADATA_FILE}`);
      await fs.writeFile(metadataPath, JSON.stringify(snapshotMetadata, null, 2));
      this.emit('snapshot-created', { snapshotId, path: snapshotPath, metadata: snapshotMetadata });
      return snapshotId;
    } catch (error) {
      this.emit('snapshot-failed', { snapshotId, error });
      throw error;
    }
  }
  /**
   * Restore memory from snapshot
   */
  public async restoreSnapshot(
    snapshotId: string,
    options: RestoreOptions = {}
  ): Promise<Map<string, MemoryBlock>> {
    const snapshotPath = path.join(this.config.baseDirectory, this.SNAPSHOT_DIR, `${snapshotId}.json`);
    const metadataPath = path.join(this.config.baseDirectory, this.SNAPSHOT_DIR, `${snapshotId}_${this.METADATA_FILE}`);
    try {
      // Check if snapshot exists
      await fs.access(snapshotPath);
      // Load and validate metadata
      let metadata: SnapshotMetadata | null = null;
      try {
        const metadataContent = await fs.readFile(metadataPath, 'utf8');
        metadata = JSON.parse(metadataContent);
      } catch (error) {
        if (!options.skipCorrupted) {
          throw new Error(`Snapshot metadata corrupted: ${error}`);
        }
      }
      // Load snapshot data
      let data = await fs.readFile(snapshotPath, 'utf8');
      // Validate checksum if available
      if (metadata && this.config.checksumValidation && options.validateChecksums !== false) {
        const calculatedChecksum = this.calculateChecksum(data);
        if (calculatedChecksum !== metadata.checksum) {
          if (!options.skipCorrupted) {
            throw new Error('Snapshot checksum validation failed');
          }
          this.emit('checksum-mismatch', { snapshotId, expected: metadata.checksum, actual: calculatedChecksum });
        }
      }
      // Decompress if necessary
      if (this.config.compressionEnabled && metadata?.compressionRatio) {
        data = await this.decompressData(data);
      }
      const snapshot = JSON.parse(data);
      const restoredBlocks = new Map<string, MemoryBlock>();
      // Restore blocks with domain filtering
      for (const { blockId, block } of snapshot.blocks) {
        const deserializedBlock = this.deserializeBlock(block);
        // Apply domain filter
        if (options.selectiveDomains && !options.selectiveDomains.includes(deserializedBlock.owner)) {
          continue;
        }
        restoredBlocks.set(blockId, deserializedBlock);
      }
      this.emit('snapshot-restored', {
        snapshotId,
        restoredBlocks: restoredBlocks.size,
        totalBlocks: snapshot.blocks.length
      });
      return restoredBlocks;
    } catch (error) {
      this.emit('restore-failed', { snapshotId, error });
      throw error;
    }
  }
  /**
   * Create incremental backup of changes
   */
  public async createIncrementalBackup(
    changedBlocks: Map<string, MemoryBlock>,
    deletedBlockIds: string[] = []
  ): Promise<string> {
    if (!this.config.incrementalBackups) {
      throw new Error('Incremental backups not enabled');
    }
    const backupId = this.generateBackupId();
    const backupPath = path.join(this.config.baseDirectory, this.INCREMENTAL_DIR, `${backupId}.json`);
    try {
      const backup = {
        id: backupId,
        timestamp: new Date(),
        version: this.VERSION,
        changes: {
          modified: Array.from(changedBlocks.entries()).map(([blockId, block]) => ({
            blockId,
            block: this.serializeBlock(block)
          })),
          deleted: deletedBlockIds
        }
      };
      let data = JSON.stringify(backup);
      if (this.config.compressionEnabled) {
        data = await this.compressData(data);
      }
      await fs.writeFile(backupPath, data);
      this.emit('incremental-backup-created', {
        backupId,
        modifiedBlocks: changedBlocks.size,
        deletedBlocks: deletedBlockIds.length
      });
      return backupId;
    } catch (error) {
      this.emit('incremental-backup-failed', { backupId, error });
      throw error;
    }
  }
  /**
   * Backup critical memory blocks
   */
  public async backupCriticalBlocks(criticalBlocks: Map<string, MemoryBlock>): Promise<string> {
    const backupId = this.generateBackupId();
    const backupPath = path.join(this.config.baseDirectory, this.BACKUP_DIR, `critical_${backupId}.json`);
    try {
      const backup = {
        id: backupId,
        timestamp: new Date(),
        version: this.VERSION,
        type: 'critical',
        blocks: Array.from(criticalBlocks.entries()).map(([blockId, block]) => ({
          blockId,
          block: this.serializeBlock(block),
          checksum: this.calculateChecksum(JSON.stringify(block))
        }))
      };
      let data = JSON.stringify(backup);
      if (this.config.compressionEnabled) {
        data = await this.compressData(data);
      }
      await fs.writeFile(backupPath, data);
      this.emit('critical-backup-created', { backupId, blockCount: criticalBlocks.size });
      return backupId;
    } catch (error) {
      this.emit('critical-backup-failed', { backupId, error });
      throw error;
    }
  }
  /**
   * List available snapshots
   */
  public async listSnapshots(): Promise<SnapshotMetadata[]> {
    const snapshotDir = path.join(this.config.baseDirectory, this.SNAPSHOT_DIR);
    const files = await fs.readdir(snapshotDir);
    const metadataFiles = files.filter(file => file.endsWith(`_${this.METADATA_FILE}`));
    const snapshots: SnapshotMetadata[] = [];
    for (const metadataFile of metadataFiles) {
      try {
        const metadataPath = path.join(snapshotDir, metadataFile);
        const content = await fs.readFile(metadataPath, 'utf8');
        const metadata = JSON.parse(content);
        snapshots.push(metadata);
      } catch (error) {
        this.emit('metadata-read-error', { file: metadataFile, error });
      }
    }
    return snapshots.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }
  /**
   * Cleanup old backups and snapshots
   */
  public async cleanup(): Promise<{ deletedSnapshots: number; deletedBackups: number }> {
    let deletedSnapshots = 0;
    let deletedBackups = 0;
    try {
      // Cleanup snapshots
      const snapshots = await this.listSnapshots();
      if (snapshots.length > this.config.backupRetention) {
        const toDelete = snapshots.slice(this.config.backupRetention);
        for (const snapshot of toDelete) {
          const snapshotPath = path.join(this.config.baseDirectory, this.SNAPSHOT_DIR, `${snapshot.id}.json`);
          const metadataPath = path.join(this.config.baseDirectory, this.SNAPSHOT_DIR, `${snapshot.id}_${this.METADATA_FILE}`);
          try {
            await fs.unlink(snapshotPath);
            await fs.unlink(metadataPath);
            deletedSnapshots++;
          } catch (error) {
            this.emit('cleanup-error', { type: 'snapshot', id: snapshot.id, error });
          }
        }
      }
      // Cleanup incremental backups older than 7 days
      const incrementalDir = path.join(this.config.baseDirectory, this.INCREMENTAL_DIR);
      const incrementalFiles = await fs.readdir(incrementalDir);
      const cutoffTime = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 days
      for (const file of incrementalFiles) {
        const filePath = path.join(incrementalDir, file);
        const stats = await fs.stat(filePath);
        if (stats.mtime.getTime() < cutoffTime) {
          try {
            await fs.unlink(filePath);
            deletedBackups++;
          } catch (error) {
            this.emit('cleanup-error', { type: 'incremental', file, error });
          }
        }
      }
      this.emit('cleanup-completed', { deletedSnapshots, deletedBackups });
      return { deletedSnapshots, deletedBackups };
    } catch (error) {
      this.emit('cleanup-failed', { error });
      throw error;
    }
  }
  /**
   * Verify snapshot integrity
   */
  public async verifySnapshot(snapshotId: string): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    let valid = true;
    try {
      const snapshotPath = path.join(this.config.baseDirectory, this.SNAPSHOT_DIR, `${snapshotId}.json`);
      const metadataPath = path.join(this.config.baseDirectory, this.SNAPSHOT_DIR, `${snapshotId}_${this.METADATA_FILE}`);
      // Check file existence
      try {
        await fs.access(snapshotPath);
      } catch {
        errors.push('Snapshot file not found');
        valid = false;
      }
      try {
        await fs.access(metadataPath);
      } catch {
        errors.push('Metadata file not found');
        valid = false;
      }
      if (!valid) {
        return { valid, errors };
      }
      // Load and validate metadata
      const metadataContent = await fs.readFile(metadataPath, 'utf8');
      const metadata: SnapshotMetadata = JSON.parse(metadataContent);
      // Validate checksum
      if (this.config.checksumValidation && metadata.checksum) {
        const data = await fs.readFile(snapshotPath, 'utf8');
        const calculatedChecksum = this.calculateChecksum(data);
        if (calculatedChecksum !== metadata.checksum) {
          errors.push('Checksum validation failed');
          valid = false;
        }
      }
      // Validate JSON structure
      try {
        const data = await fs.readFile(snapshotPath, 'utf8');
        JSON.parse(this.config.compressionEnabled ? await this.decompressData(data) : data);
      } catch (error) {
        errors.push(`Invalid JSON structure: ${error}`);
        valid = false;
      }
      this.emit('snapshot-verified', { snapshotId, valid, errors });
      return { valid, errors };
    } catch (error) {
      errors.push(`Verification failed: ${error}`);
      return { valid: false, errors };
    }
  }
  private startAutomaticBackup(): void {
    this.backupTimer = setInterval(async () => {
      if (this.isBackupInProgress) {
        return;
      }
      this.isBackupInProgress = true;
      try {
        this.emit('automatic-backup-started');
        // This would need to be connected to the MemoryCoordinator
        // For now, just emit an event
        this.emit('automatic-backup-requested');
        this.lastBackupTime = new Date();
      } catch (error) {
        this.emit('automatic-backup-failed', { error });
      } finally {
        this.isBackupInProgress = false;
      }
    }, this.config.backupInterval);
  }
  private calculateSnapshotStats(memoryBlocks: Map<string, MemoryBlock>): {
    totalSize: number;
    blockCount: number;
    domainDistribution: Record<PrincessDomain, number>;
  } {
    let totalSize = 0;
    const domainDistribution: Record<PrincessDomain, number> = {
      [PrincessDomain.INFRASTRUCTURE]: 0,
      [PrincessDomain.RESEARCH]: 0,
      [PrincessDomain.SHARED]: 0,
      [PrincessDomain.SYSTEM]: 0
    };
    for (const block of memoryBlocks.values()) {
      totalSize += block.size;
      domainDistribution[block.owner]++;
    }
    return {
      totalSize,
      blockCount: memoryBlocks.size,
      domainDistribution
    };
  }
  private serializeBlock(block: MemoryBlock): any {
    return {
      ...block,
      createdAt: block.createdAt.toISOString(),
      lastAccessedAt: block.lastAccessedAt.toISOString()
    };
  }
  private deserializeBlock(serializedBlock: any): MemoryBlock {
    return {
      ...serializedBlock,
      createdAt: new Date(serializedBlock.createdAt),
      lastAccessedAt: new Date(serializedBlock.lastAccessedAt)
    };
  }
  private async compressData(data: string): Promise<string> {
    // Simplified compression - in production, use proper compression library
    return Buffer.from(data).toString('base64');
  }
  private async decompressData(data: string): Promise<string> {
    // Simplified decompression - in production, use proper compression library
    return Buffer.from(data, 'base64').toString('utf8');
  }
  private calculateChecksum(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }
  private generateSnapshotId(): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const random = Math.random().toString(36).substring(2, 8);
    return `snapshot_${timestamp}_${random}`;
  }
  private generateBackupId(): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const random = Math.random().toString(36).substring(2, 8);
    return `backup_${timestamp}_${random}`;
  }
  /**
   * Get persistence statistics
   */
  public async getStatistics(): Promise<{
    totalSnapshots: number;
    totalBackups: number;
    diskUsage: number;
    lastBackupTime: Date | null;
    oldestSnapshot: Date | null;
    newestSnapshot: Date | null;
  }> {
    const snapshots = await this.listSnapshots();
    // Calculate disk usage (simplified)
    const snapshotDir = path.join(this.config.baseDirectory, this.SNAPSHOT_DIR);
    const backupDir = path.join(this.config.baseDirectory, this.BACKUP_DIR);
    const incrementalDir = path.join(this.config.baseDirectory, this.INCREMENTAL_DIR);
    let diskUsage = 0;
    try {
      const dirs = [snapshotDir, backupDir, incrementalDir];
      for (const dir of dirs) {
        const files = await fs.readdir(dir);
        for (const file of files) {
          const stats = await fs.stat(path.join(dir, file));
          diskUsage += stats.size;
        }
      }
    } catch (error) {
      this.emit('stats-calculation-error', { error });
    }
    const backupFiles = await fs.readdir(backupDir);
    return {
      totalSnapshots: snapshots.length,
      totalBackups: backupFiles.length,
      diskUsage,
      lastBackupTime: this.lastBackupTime,
      oldestSnapshot: snapshots.length > 0 ? snapshots[snapshots.length - 1].timestamp : null,
      newestSnapshot: snapshots.length > 0 ? snapshots[0].timestamp : null
    };
  }
  /**
   * Shutdown persistence system
   */
  public shutdown(): void {
    if (this.backupTimer) {
      clearInterval(this.backupTimer);
      this.backupTimer = null;
    }
    this.emit('shutdown');
  }
}
export default MemoryPersistence;