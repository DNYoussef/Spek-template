import * as sqlite3 from 'sqlite3';
import * as path from 'path';
import * as fs from 'fs/promises';
import { MemoryEntry } from './LangroidMemoryManager';
export interface PersistenceConfig {
  dbPath: string;
  maxDbSize: number;
  batchSize: number;
  flushInterval: number;
  enableWAL: boolean;
  enableSync: boolean;
}
export interface StorageMetrics {
  totalEntries: number;
  totalSize: number;
  dbSize: number;
  lastFlush: number;
  pendingWrites: number;
}
export class MemoryPersistence {
  private db?: sqlite3.Database;
  private writeQueue: Map<string, MemoryEntry> = new Map();
  private flushTimer?: NodeJS.Timeout;
  private readonly config: PersistenceConfig;
  private isInitialized = false;
  private metrics: StorageMetrics;
  constructor(config: Partial<PersistenceConfig> = {}) {
    this.config = {
      dbPath: path.join(process.cwd(), '.memory', 'langroid.db'),
      maxDbSize: 100 * 1024 * 1024, // 100MB max DB size
      batchSize: 100,
      flushInterval: 5000, // 5 seconds
      enableWAL: true,
      enableSync: false,
      ...config
    };
    this.metrics = {
      totalEntries: 0,
      totalSize: 0,
      dbSize: 0,
      lastFlush: 0,
      pendingWrites: 0
    };
  }
  /**
   * Initialize the persistence layer
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    try {
      // Ensure directory exists
      const dbDir = path.dirname(this.config.dbPath);
      await fs.mkdir(dbDir, { recursive: true });
      // Initialize SQLite database
      await this.initializeDatabase();
      // Start flush timer
      this.startFlushTimer();
      this.isInitialized = true;
    } catch (error) {
      throw new Error(`Failed to initialize persistence: ${error.message}`);
    }
  }
  /**
   * Store a memory entry
   */
  async store(key: string, entry: MemoryEntry): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    // Add to write queue for batch processing
    this.writeQueue.set(key, entry);
    this.metrics.pendingWrites = this.writeQueue.size;
    // Immediate flush if queue is full
    if (this.writeQueue.size >= this.config.batchSize) {
      await this.flush();
    }
  }
  /**
   * Retrieve a memory entry
   */
  async retrieve(key: string): Promise<MemoryEntry | null> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    // Check write queue first
    const queuedEntry = this.writeQueue.get(key);
    if (queuedEntry) {
      return queuedEntry;
    }
    return new Promise((resolve, reject) => {
      const stmt = this.db!.prepare(`
        SELECT id, data, timestamp, access_count, last_accessed, size, partition_id, version, ttl
        FROM memory_entries
        WHERE id = ?
      `);
      stmt.get([key], (err: Error | null, row: any) => {
        if (err) {
          reject(new Error(`Failed to retrieve entry: ${err.message}`));
          return;
        }
        if (!row) {
          resolve(null);
          return;
        }
        try {
          const entry: MemoryEntry = {
            id: row.id,
            data: Buffer.from(row.data, 'base64'),
            timestamp: row.timestamp,
            accessCount: row.access_count,
            lastAccessed: row.last_accessed,
            size: row.size,
            partitionId: row.partition_id,
            version: row.version,
            ttl: row.ttl
          };
          resolve(entry);
        } catch (parseError) {
          reject(new Error(`Failed to parse entry: ${parseError.message}`));
        }
      });
      stmt.finalize();
    });
  }
  /**
   * Remove a memory entry
   */
  async remove(key: string): Promise<boolean> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    // Remove from write queue
    this.writeQueue.delete(key);
    return new Promise((resolve, reject) => {
      const stmt = this.db!.prepare(`DELETE FROM memory_entries WHERE id = ?`);
      stmt.run([key], function(err: Error | null) {
        if (err) {
          reject(new Error(`Failed to remove entry: ${err.message}`));
          return;
        }
        resolve(this.changes > 0);
      });
      stmt.finalize();
    });
  }
  /**
   * Load all entries from storage
   */
  async loadAll(): Promise<MemoryEntry[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    return new Promise((resolve, reject) => {
      const entries: MemoryEntry[] = [];
      this.db!.each(`
        SELECT id, data, timestamp, access_count, last_accessed, size, partition_id, version, ttl
        FROM memory_entries
        ORDER BY last_accessed DESC
      `, (err: Error | null, row: any) => {
        if (err) {
          reject(new Error(`Failed to load entries: ${err.message}`));
          return;
        }
        try {
          const entry: MemoryEntry = {
            id: row.id,
            data: Buffer.from(row.data, 'base64'),
            timestamp: row.timestamp,
            accessCount: row.access_count,
            lastAccessed: row.last_accessed,
            size: row.size,
            partitionId: row.partition_id,
            version: row.version,
            ttl: row.ttl
          };
          entries.push(entry);
        } catch (parseError) {
          // Skip corrupted entries
          console.warn(`Skipping corrupted entry ${row.id}: ${parseError.message}`);
        }
      }, (err: Error | null) => {
        if (err) {
          reject(new Error(`Failed to complete loading: ${err.message}`));
        } else {
          resolve(entries);
        }
      });
    });
  }
  /**
   * Clear all entries
   */
  async clear(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    this.writeQueue.clear();
    return new Promise((resolve, reject) => {
      this.db!.run(`DELETE FROM memory_entries`, (err: Error | null) => {
        if (err) {
          reject(new Error(`Failed to clear entries: ${err.message}`));
        } else {
          resolve();
        }
      });
    });
  }
  /**
   * Get storage statistics
   */
  async getMetrics(): Promise<StorageMetrics> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    return new Promise((resolve, reject) => {
      this.db!.get(`
        SELECT
          COUNT(*) as count,
          SUM(size) as total_size
        FROM memory_entries
      `, (err: Error | null, row: any) => {
        if (err) {
          reject(new Error(`Failed to get metrics: ${err.message}`));
          return;
        }
        this.metrics.totalEntries = row.count || 0;
        this.metrics.totalSize = row.total_size || 0;
        this.metrics.pendingWrites = this.writeQueue.size;
        // Get database file size
        this.getDatabaseSize().then(dbSize => {
          this.metrics.dbSize = dbSize;
          resolve({ ...this.metrics });
        }).catch(reject);
      });
    });
  }
  /**
   * Optimize database (VACUUM and analyze)
   */
  async optimize(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    return new Promise((resolve, reject) => {
      this.db!.run(`VACUUM`, (err: Error | null) => {
        if (err) {
          reject(new Error(`Failed to vacuum database: ${err.message}`));
          return;
        }
        this.db!.run(`ANALYZE`, (analyzeErr: Error | null) => {
          if (analyzeErr) {
            reject(new Error(`Failed to analyze database: ${analyzeErr.message}`));
          } else {
            resolve();
          }
        });
      });
    });
  }
  /**
   * Clean up expired entries
   */
  async cleanup(): Promise<number> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    const now = Date.now();
    return new Promise((resolve, reject) => {
      const stmt = this.db!.prepare(`
        DELETE FROM memory_entries
        WHERE ttl IS NOT NULL AND ttl < ?
      `);
      stmt.run([now], function(err: Error | null) {
        if (err) {
          reject(new Error(`Failed to cleanup expired entries: ${err.message}`));
          return;
        }
        resolve(this.changes);
      });
      stmt.finalize();
    });
  }
  /**
   * Force flush pending writes
   */
  async flush(): Promise<void> {
    if (this.writeQueue.size === 0) return;
    const entries = Array.from(this.writeQueue.entries());
    this.writeQueue.clear();
    return new Promise((resolve, reject) => {
      this.db!.run('BEGIN TRANSACTION', (err: Error | null) => {
        if (err) {
          reject(new Error(`Failed to begin transaction: ${err.message}`));
          return;
        }
        const stmt = this.db!.prepare(`
          INSERT OR REPLACE INTO memory_entries
          (id, data, timestamp, access_count, last_accessed, size, partition_id, version, ttl)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        let completed = 0;
        let hasError = false;
        for (const [key, entry] of entries) {
          const dataBase64 = Buffer.isBuffer(entry.data) ?
            entry.data.toString('base64') :
            Buffer.from(entry.data).toString('base64');
          stmt.run([
            entry.id,
            dataBase64,
            entry.timestamp,
            entry.accessCount,
            entry.lastAccessed,
            entry.size,
            entry.partitionId,
            entry.version,
            entry.ttl
          ], (runErr: Error | null) => {
            if (runErr && !hasError) {
              hasError = true;
              stmt.finalize();
              this.db!.run('ROLLBACK', () => {
                reject(new Error(`Failed to insert entry: ${runErr.message}`));
              });
              return;
            }
            completed++;
            if (completed === entries.length && !hasError) {
              stmt.finalize();
              this.db!.run('COMMIT', (commitErr: Error | null) => {
                if (commitErr) {
                  reject(new Error(`Failed to commit transaction: ${commitErr.message}`));
                } else {
                  this.metrics.lastFlush = Date.now();
                  this.metrics.pendingWrites = this.writeQueue.size;
                  resolve();
                }
              });
            }
          });
        }
      });
    });
  }
  /**
   * Close the persistence layer
   */
  async close(): Promise<void> {
    if (!this.isInitialized) return;
    // Stop flush timer
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    // Flush pending writes
    await this.flush();
    // Close database
    return new Promise((resolve) => {
      if (this.db) {
        this.db.close(() => {
          this.isInitialized = false;
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
  private async initializeDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.config.dbPath, (err: Error | null) => {
        if (err) {
          reject(new Error(`Failed to open database: ${err.message}`));
          return;
        }
        // Configure database
        const configurations = [
          `PRAGMA journal_mode = ${this.config.enableWAL ? 'WAL' : 'DELETE'}`,
          `PRAGMA synchronous = ${this.config.enableSync ? 'FULL' : 'NORMAL'}`,
          `PRAGMA cache_size = 10000`,
          `PRAGMA temp_store = memory`,
          `PRAGMA mmap_size = 268435456` // 256MB
        ];
        let configIndex = 0;
        const runConfig = () => {
          if (configIndex >= configurations.length) {
            this.createTables(resolve, reject);
            return;
          }
          this.db!.run(configurations[configIndex], (configErr: Error | null) => {
            if (configErr) {
              console.warn(`Warning: ${configurations[configIndex]} failed: ${configErr.message}`);
            }
            configIndex++;
            runConfig();
          });
        };
        runConfig();
      });
    });
  }
  private createTables(resolve: () => void, reject: (error: Error) => void): void {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS memory_entries (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        access_count INTEGER NOT NULL DEFAULT 0,
        last_accessed INTEGER NOT NULL,
        size INTEGER NOT NULL,
        partition_id TEXT NOT NULL DEFAULT 'default',
        version INTEGER NOT NULL DEFAULT 1,
        ttl INTEGER,
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `;
    this.db!.run(createTableSQL, (err: Error | null) => {
      if (err) {
        reject(new Error(`Failed to create table: ${err.message}`));
        return;
      }
      // Create indexes
      const indexes = [
        `CREATE INDEX IF NOT EXISTS idx_partition_id ON memory_entries(partition_id)`,
        `CREATE INDEX IF NOT EXISTS idx_last_accessed ON memory_entries(last_accessed)`,
        `CREATE INDEX IF NOT EXISTS idx_ttl ON memory_entries(ttl)`,
        `CREATE INDEX IF NOT EXISTS idx_size ON memory_entries(size)`
      ];
      let indexCount = 0;
      const createIndex = () => {
        if (indexCount >= indexes.length) {
          resolve();
          return;
        }
        this.db!.run(indexes[indexCount], (indexErr: Error | null) => {
          if (indexErr) {
            console.warn(`Warning: Failed to create index: ${indexErr.message}`);
          }
          indexCount++;
          createIndex();
        });
      };
      createIndex();
    });
  }
  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flush().catch(err => {
        console.error('Auto-flush failed:', err.message);
      });
    }, this.config.flushInterval);
  }
  private async getDatabaseSize(): Promise<number> {
    try {
      const stats = await fs.stat(this.config.dbPath);
      return stats.size;
    } catch {
      return 0;
    }
  }
}
export default MemoryPersistence;