import * as fs from 'fs/promises';
import * as path from 'path';
import { MemoryEntry } from './LangroidMemoryBackend';
import { EventEmitter } from 'events';

/**
 * Memory Persistence for Langroid Memory Backend
 * Provides durable storage for memory entries with atomic writes,
 * compression, and efficient batch operations for enterprise reliability.
 */
export interface PersistenceConfig {
  enabled: boolean;
  path?: string;
  batchSize?: number;
  compressionEnabled?: boolean;
  autoFlushInterval?: number;
  maxFileSize?: number;
  backupCount?: number;
}

export interface PersistenceStats {
  totalEntries: number;
  fileSize: number;
  lastFlushTime: number;
  flushCount: number;
  errorCount: number;
  compressionRatio: number;
}

export interface PersistedData {
  version: string;
  timestamp: number;
  entries: MemoryEntry[];
  metadata: {
    totalSize: number;
    entryCount: number;
    checksum: string;
  };
}

export class MemoryPersistence extends EventEmitter {
  private static readonly DEFAULT_PATH = './data/infrastructure-memory';
  private static readonly DEFAULT_BATCH_SIZE = 50;
  private static readonly DEFAULT_FLUSH_INTERVAL = 60 * 1000; // 1 minute
  private static readonly DEFAULT_MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
  private static readonly DEFAULT_BACKUP_COUNT = 5;
  private static readonly DATA_VERSION = '1.0.0';

  private config: Required<PersistenceConfig>;
  private pendingEntries: Map<string, MemoryEntry> = new Map();
  private deletedEntries: Set<string> = new Set();

  private flushTimer?: NodeJS.Timeout;
  private isFlushInProgress: boolean = false;

  private stats: PersistenceStats = {
    totalEntries: 0,
    fileSize: 0,
    lastFlushTime: 0,
    flushCount: 0,
    errorCount: 0,
    compressionRatio: 1.0
  };

  constructor(config?: Partial<PersistenceConfig>) {
    super();

    this.config = {
      enabled: config?.enabled ?? true,
      path: config?.path ?? MemoryPersistence.DEFAULT_PATH,
      batchSize: config?.batchSize ?? MemoryPersistence.DEFAULT_BATCH_SIZE,
      compressionEnabled: config?.compressionEnabled ?? true,
      autoFlushInterval: config?.autoFlushInterval ?? MemoryPersistence.DEFAULT_FLUSH_INTERVAL,
      maxFileSize: config?.maxFileSize ?? MemoryPersistence.DEFAULT_MAX_FILE_SIZE,
      backupCount: config?.backupCount ?? MemoryPersistence.DEFAULT_BACKUP_COUNT
    };

    if (this.config.enabled) {
      this.initializePersistence();
    }
  }

  /**
   * Persist a single entry (batched)
   */
  public async persistEntry(entry: MemoryEntry): Promise<void> {
    if (!this.config.enabled) return;

    try {
      // Add to pending batch
      this.pendingEntries.set(entry.id, { ...entry });
      this.deletedEntries.delete(entry.id);

      // Flush if batch is full
      if (this.pendingEntries.size >= this.config.batchSize) {
        await this.flush();
      }

      this.emit('entry-queued', { id: entry.id, batchSize: this.pendingEntries.size });

    } catch (error) {
      this.stats.errorCount++;
      this.emit('error', { operation: 'persistEntry', entryId: entry.id, error });
      throw error;
    }
  }

  /**
   * Remove entry from persistence
   */
  public async removeEntry(id: string): Promise<void> {
    if (!this.config.enabled) return;

    try {
      // Remove from pending if present
      this.pendingEntries.delete(id);

      // Mark for deletion
      this.deletedEntries.add(id);

      // Flush if batch is full
      if (this.deletedEntries.size >= this.config.batchSize) {
        await this.flush();
      }

      this.emit('entry-removal-queued', { id, deletionQueueSize: this.deletedEntries.size });

    } catch (error) {
      this.stats.errorCount++;
      this.emit('error', { operation: 'removeEntry', entryId: id, error });
      throw error;
    }
  }

  /**
   * Load all persisted entries
   */
  public async loadAll(): Promise<MemoryEntry[]> {
    if (!this.config.enabled) return [];

    try {
      const dataFile = this.getDataFilePath();

      // Check if file exists
      try {
        await fs.access(dataFile);
      } catch {
        return []; // File doesn't exist, return empty array
      }

      // Read and parse data
      const rawData = await fs.readFile(dataFile, 'utf8');
      const data = this.deserializeData(rawData);

      // Validate data integrity
      this.validateData(data);

      this.stats.totalEntries = data.entries.length;
      this.stats.fileSize = rawData.length;

      this.emit('data-loaded', { entryCount: data.entries.length, fileSize: rawData.length });

      return data.entries;

    } catch (error) {
      this.stats.errorCount++;
      this.emit('error', { operation: 'loadAll', error });

      // Try to load from backup
      return await this.loadFromBackup();
    }
  }

  /**
   * Force flush all pending operations
   */
  public async flush(): Promise<void> {
    if (!this.config.enabled || this.isFlushInProgress) return;

    this.isFlushInProgress = true;

    try {
      // Load existing data
      const existingEntries = await this.loadExistingEntries();
      const entryMap = new Map(existingEntries.map(entry => [entry.id, entry]));

      // Apply pending updates
      for (const [id, entry] of this.pendingEntries) {
        entryMap.set(id, entry);
      }

      // Apply deletions
      for (const id of this.deletedEntries) {
        entryMap.delete(id);
      }

      // Prepare data for persistence
      const entries = Array.from(entryMap.values());
      const data: PersistedData = {
        version: MemoryPersistence.DATA_VERSION,
        timestamp: Date.now(),
        entries,
        metadata: {
          totalSize: entries.reduce((sum, entry) => sum + entry.size, 0),
          entryCount: entries.length,
          checksum: this.calculateChecksum(entries)
        }
      };

      // Serialize and write atomically
      await this.writeDataAtomic(data);

      // Clear pending operations
      this.pendingEntries.clear();
      this.deletedEntries.clear();

      // Update stats
      this.stats.lastFlushTime = Date.now();
      this.stats.flushCount++;
      this.stats.totalEntries = entries.length;

      this.emit('flush-completed', {
        entryCount: entries.length,
        flushCount: this.stats.flushCount
      });

    } catch (error) {
      this.stats.errorCount++;
      this.emit('error', { operation: 'flush', error });
      throw error;

    } finally {
      this.isFlushInProgress = false;
    }
  }

  /**
   * Clear all persisted data
   */
  public async clearAll(): Promise<void> {
    if (!this.config.enabled) return;

    try {
      const dataFile = this.getDataFilePath();

      // Remove main data file
      try {
        await fs.unlink(dataFile);
      } catch {
        // File might not exist, ignore
      }

      // Remove backups
      await this.clearBackups();

      // Clear pending operations
      this.pendingEntries.clear();
      this.deletedEntries.clear();

      // Reset stats
      this.stats.totalEntries = 0;
      this.stats.fileSize = 0;

      this.emit('all-cleared');

    } catch (error) {
      this.stats.errorCount++;
      this.emit('error', { operation: 'clearAll', error });
      throw error;
    }
  }

  /**
   * Get persistence statistics
   */
  public getStats(): PersistenceStats {
    return { ...this.stats };
  }

  /**
   * Create manual backup
   */
  public async createBackup(): Promise<string> {
    if (!this.config.enabled) throw new Error('Persistence not enabled');

    try {
      await this.flush(); // Ensure all data is persisted

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = path.join(this.config.path, `backup-${timestamp}.json`);
      const dataFile = this.getDataFilePath();

      await fs.copyFile(dataFile, backupPath);

      this.emit('backup-created', { backupPath });
      return backupPath;

    } catch (error) {
      this.stats.errorCount++;
      this.emit('error', { operation: 'createBackup', error });
      throw error;
    }
  }

  /**
   * Restore from specific backup
   */
  public async restoreFromBackup(backupPath: string): Promise<void> {
    if (!this.config.enabled) throw new Error('Persistence not enabled');

    try {
      const dataFile = this.getDataFilePath();

      // Validate backup file
      const backupData = await fs.readFile(backupPath, 'utf8');
      const data = this.deserializeData(backupData);
      this.validateData(data);

      // Create backup of current data
      await this.createBackup();

      // Restore backup
      await fs.copyFile(backupPath, dataFile);

      // Clear pending operations
      this.pendingEntries.clear();
      this.deletedEntries.clear();

      this.emit('backup-restored', { backupPath, entryCount: data.entries.length });

    } catch (error) {
      this.stats.errorCount++;
      this.emit('error', { operation: 'restoreFromBackup', backupPath, error });
      throw error;
    }
  }

  /**
   * Optimize storage (compact and cleanup)
   */
  public async optimize(): Promise<void> {
    if (!this.config.enabled) return;

    try {
      // Force flush pending operations
      await this.flush();

      // Rotate backups
      await this.rotateBackups();

      // Check if file size exceeds limit
      const stats = await this.getFileStats();
      if (stats.fileSize > this.config.maxFileSize) {
        await this.compactStorage();
      }

      this.emit('optimization-completed', { fileSize: stats.fileSize });

    } catch (error) {
      this.stats.errorCount++;
      this.emit('error', { operation: 'optimize', error });
      throw error;
    }
  }

  /**
   * Shutdown persistence
   */
  public async shutdown(): Promise<void> {
    try {
      if (this.flushTimer) {
        clearInterval(this.flushTimer);
        this.flushTimer = undefined;
      }

      // Final flush
      await this.flush();

      this.emit('shutdown');

    } catch (error) {
      this.emit('error', { operation: 'shutdown', error });
      throw error;
    }
  }

  // Private methods

  private async initializePersistence(): Promise<void> {
    try {
      // Ensure directory exists
      await fs.mkdir(this.config.path, { recursive: true });

      // Start auto-flush timer
      if (this.config.autoFlushInterval > 0) {
        this.flushTimer = setInterval(() => {
          this.flush().catch(error => {
            this.emit('error', { operation: 'auto-flush', error });
          });
        }, this.config.autoFlushInterval);
      }

      this.emit('persistence-initialized', { config: this.config });

    } catch (error) {
      this.stats.errorCount++;
      this.emit('error', { operation: 'initializePersistence', error });
      throw error;
    }
  }

  private getDataFilePath(): string {
    return path.join(this.config.path, 'memory-data.json');
  }

  private async loadExistingEntries(): Promise<MemoryEntry[]> {
    try {
      const dataFile = this.getDataFilePath();
      await fs.access(dataFile);
      const rawData = await fs.readFile(dataFile, 'utf8');
      const data = this.deserializeData(rawData);
      return data.entries;
    } catch {
      return []; // File doesn't exist or is corrupted
    }
  }

  private serializeData(data: PersistedData): string {
    if (this.config.compressionEnabled) {
      // Simple compression (in production, use zlib)
      const jsonStr = JSON.stringify(data);
      return jsonStr;
    }
    return JSON.stringify(data, null, 2);
  }

  private deserializeData(rawData: string): PersistedData {
    try {
      return JSON.parse(rawData);
    } catch (error) {
      throw new Error(`Failed to deserialize persistence data: ${error}`);
    }
  }

  private validateData(data: PersistedData): void {
    if (!data.version || !data.entries || !Array.isArray(data.entries)) {
      throw new Error('Invalid persistence data structure');
    }

    if (data.version !== MemoryPersistence.DATA_VERSION) {
      throw new Error(`Unsupported data version: ${data.version}`);
    }

    // Validate checksum
    const calculatedChecksum = this.calculateChecksum(data.entries);
    if (data.metadata.checksum !== calculatedChecksum) {
      throw new Error('Data integrity check failed: checksum mismatch');
    }
  }

  private calculateChecksum(entries: MemoryEntry[]): string {
    const dataStr = JSON.stringify(entries.map(e => ({ id: e.id, size: e.size, timestamp: e.timestamp })));

    // Simple checksum (in production, use crypto.createHash)
    let hash = 0;
    for (let i = 0; i < dataStr.length; i++) {
      const char = dataStr.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    return hash.toString(16);
  }

  private async writeDataAtomic(data: PersistedData): Promise<void> {
    const dataFile = this.getDataFilePath();
    const tempFile = `${dataFile}.tmp`;

    try {
      // Write to temporary file
      const serializedData = this.serializeData(data);
      await fs.writeFile(tempFile, serializedData, 'utf8');

      // Atomic move
      await fs.rename(tempFile, dataFile);

      // Update stats
      this.stats.fileSize = serializedData.length;

      if (this.config.compressionEnabled) {
        const uncompressedSize = JSON.stringify(data, null, 2).length;
        this.stats.compressionRatio = uncompressedSize / serializedData.length;
      }

    } catch (error) {
      // Clean up temp file on error
      try {
        await fs.unlink(tempFile);
      } catch {
        // Ignore cleanup errors
      }
      throw error;
    }
  }

  private async loadFromBackup(): Promise<MemoryEntry[]> {
    try {
      const backupFiles = await this.getBackupFiles();

      if (backupFiles.length === 0) {
        return [];
      }

      // Try most recent backup first
      for (const backupFile of backupFiles) {
        try {
          const rawData = await fs.readFile(backupFile, 'utf8');
          const data = this.deserializeData(rawData);
          this.validateData(data);

          this.emit('backup-loaded', { backupFile, entryCount: data.entries.length });
          return data.entries;

        } catch (error) {
          this.emit('backup-load-failed', { backupFile, error });
          continue;
        }
      }

      return [];

    } catch (error) {
      this.emit('error', { operation: 'loadFromBackup', error });
      return [];
    }
  }

  private async getBackupFiles(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.config.path);
      const backupFiles = files
        .filter(file => file.startsWith('backup-') && file.endsWith('.json'))
        .map(file => path.join(this.config.path, file))
        .sort()
        .reverse(); // Most recent first

      return backupFiles;

    } catch {
      return [];
    }
  }

  private async rotateBackups(): Promise<void> {
    const backupFiles = await this.getBackupFiles();

    // Remove excess backups
    if (backupFiles.length > this.config.backupCount) {
      const filesToRemove = backupFiles.slice(this.config.backupCount);

      for (const file of filesToRemove) {
        try {
          await fs.unlink(file);
        } catch {
          // Ignore errors
        }
      }
    }
  }

  private async clearBackups(): Promise<void> {
    const backupFiles = await this.getBackupFiles();

    for (const file of backupFiles) {
      try {
        await fs.unlink(file);
      } catch {
        // Ignore errors
      }
    }
  }

  private async getFileStats(): Promise<{ fileSize: number }> {
    try {
      const dataFile = this.getDataFilePath();
      const stats = await fs.stat(dataFile);
      return { fileSize: stats.size };
    } catch {
      return { fileSize: 0 };
    }
  }

  private async compactStorage(): Promise<void> {
    // In a real implementation, this would remove deleted entries,
    // compress data more aggressively, or split into multiple files
    await this.flush();
  }
}

export default MemoryPersistence;