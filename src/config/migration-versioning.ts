/**
 * Configuration Migration and Versioning Strategy
 * Comprehensive migration system with version management and rollback capabilities
 * Supports semantic versioning, automated migrations, and compatibility tracking
 */

import fs from 'fs/promises';
import path from 'path';
import yaml from 'js-yaml';
import { z } from 'zod';
import { createHash } from 'crypto';
import { EnterpriseConfig } from './schema-validator';
import { BackwardCompatibilityManager } from './backward-compatibility';

// Version metadata schema
const VersionMetadataSchema = z.object({
  version: z.string(),
  timestamp: z.string(),
  description: z.string(),
  breaking_changes: z.array(z.string()),
  migration_required: z.boolean(),
  compatibility_level: z.enum(['major', 'minor', 'patch']),
  rollback_supported: z.boolean(),
  checksum: z.string(),
  size_bytes: z.number(),
  author: z.string().optional(),
  change_log: z.array(z.object({
    type: z.enum(['added', 'changed', 'deprecated', 'removed', 'fixed', 'security']),
    description: z.string(),
    impact: z.enum(['low', 'medium', 'high', 'critical']).optional()
  }))
});

export type VersionMetadata = z.infer<typeof VersionMetadataSchema>;

// Migration strategy configuration
export interface MigrationConfig {
  versionsDirectory: string;
  migrationsDirectory: string;
  backupDirectory: string;
  autoMigration: boolean;
  validationRequired: boolean;
  rollbackEnabled: boolean;
  maxVersionHistory: number;
  compressionEnabled: boolean;
  encryptionEnabled: boolean;
  notifications: {
    enabled: boolean;
    channels: string[];
    onSuccess: boolean;
    onFailure: boolean;
    onRollback: boolean;
  };
}

// Migration operation result
export interface MigrationResult {
  success: boolean;
  fromVersion: string;
  toVersion: string;
  executedMigrations: string[];
  duration: number;
  backupPath?: string;
  errors: MigrationError[];
  warnings: MigrationWarning[];
  rollbackInfo?: RollbackInfo;
  metadata: MigrationMetadata;
}

export interface MigrationError {
  migration: string;
  error: string;
  severity: 'error' | 'critical';
  resolution?: string;
  rollbackRequired: boolean;
}

export interface MigrationWarning {
  migration: string;
  message: string;
  recommendation?: string;
}

export interface RollbackInfo {
  availableVersions: string[];
  recommendedVersion?: string;
  rollbackPath?: string;
  estimatedDuration: number;
}

export interface MigrationMetadata {
  startTime: Date;
  endTime: Date;
  totalMigrations: number;
  skippedMigrations: number;
  configSizeBefore: number;
  configSizeAfter: number;
  performanceMetrics: {
    migrationTime: number;
    validationTime: number;
    backupTime: number;
    ioOperations: number;
  };
}

// Migration definition
export interface Migration {
  version: string;
  description: string;
  up: (config: any) => Promise<any>;
  down: (config: any) => Promise<any>;
  validate: (config: any) => Promise<boolean>;
  dependencies: string[];
  breaking: boolean;
  skipIf?: (config: any) => boolean;
}

/**
 * Configuration Migration and Versioning Manager
 * Handles configuration evolution, migrations, and version management
 */
export class ConfigurationMigrationManager {
  private config: MigrationConfig;
  private migrations: Map<string, Migration> = new Map();
  private compatibilityManager: BackwardCompatibilityManager;
  private versionHistory: VersionMetadata[] = [];
  private currentVersion: string = '1.0.0';

  constructor(config: Partial<MigrationConfig> = {}) {
    this.config = {
      versionsDirectory: config.versionsDirectory || 'config/versions',
      migrationsDirectory: config.migrationsDirectory || 'config/migrations',
      backupDirectory: config.backupDirectory || 'config/backups',
      autoMigration: config.autoMigration ?? true,
      validationRequired: config.validationRequired ?? true,
      rollbackEnabled: config.rollbackEnabled ?? true,
      maxVersionHistory: config.maxVersionHistory || 50,
      compressionEnabled: config.compressionEnabled ?? true,
      encryptionEnabled: config.encryptionEnabled ?? false,
      notifications: {
        enabled: config.notifications?.enabled ?? false,
        channels: config.notifications?.channels || [],
        onSuccess: config.notifications?.onSuccess ?? true,
        onFailure: config.notifications?.onFailure ?? true,
        onRollback: config.notifications?.onRollback ?? true
      }
    };

    this.compatibilityManager = new BackwardCompatibilityManager();
    this.initializeMigrations();
  }

  /**
   * Initialize built-in migrations
   */
  private initializeMigrations(): void {
    const migrations: Migration[] = [
      {
        version: '1.1.0',
        description: 'Add enterprise features support',
        breaking: false,
        dependencies: [],
        up: async (config: any) => {
          if (!config.enterprise) {
            config.enterprise = {
              enabled: false,
              license_mode: 'community',
              compliance_level: 'standard',
              features: {}
            };
          }
          return config;
        },
        down: async (config: any) => {
          delete config.enterprise;
          return config;
        },
        validate: async (config: any) => {
          return config.enterprise !== undefined;
        }
      },
      
      {
        version: '1.2.0',
        description: 'Add multi-tenancy support',
        breaking: false,
        dependencies: ['1.1.0'],
        up: async (config: any) => {
          if (!config.multi_tenancy) {
            config.multi_tenancy = {
              enabled: false,
              isolation_level: 'basic',
              tenant_specific_config: false,
              resource_quotas: {
                max_users_per_tenant: 100,
                max_projects_per_tenant: 10,
                max_analysis_jobs_per_day: 1000,
                storage_limit_gb: 10
              },
              default_tenant: {
                name: 'default',
                admin_email: 'admin@example.com',
                compliance_profile: 'standard'
              }
            };
          }
          return config;
        },
        down: async (config: any) => {
          delete config.multi_tenancy;
          return config;
        },
        validate: async (config: any) => {
          return config.multi_tenancy !== undefined;
        }
      },

      {
        version: '1.3.0',
        description: 'Enhanced security configuration',
        breaking: true,
        dependencies: ['1.2.0'],
        up: async (config: any) => {
          if (config.security) {
            // Migrate old security structure to new format
            if (config.security.auth && !config.security.authentication) {
              config.security.authentication = config.security.auth;
              delete config.security.auth;
            }
            
            // Add encryption section if missing
            if (!config.security.encryption) {
              config.security.encryption = {
                at_rest: false,
                in_transit: false,
                algorithm: 'AES-256-GCM',
                key_rotation_days: 90
              };
            }

            // Add audit section if missing
            if (!config.security.audit) {
              config.security.audit = {
                enabled: false,
                log_level: 'basic',
                retention_days: 90,
                export_format: 'json',
                real_time_monitoring: false,
                anomaly_detection: false
              };
            }
          }
          return config;
        },
        down: async (config: any) => {
          if (config.security?.authentication) {
            config.security.auth = config.security.authentication;
            delete config.security.authentication;
            delete config.security.encryption;
            delete config.security.audit;
          }
          return config;
        },
        validate: async (config: any) => {
          return config.security?.authentication !== undefined &&
                 config.security?.encryption !== undefined &&
                 config.security?.audit !== undefined;
        }
      },

      {
        version: '2.0.0',
        description: 'Major restructure for enterprise deployment',
        breaking: true,
        dependencies: ['1.3.0'],
        up: async (config: any) => {
          // Major restructure - move legacy settings to new structure
          const newConfig: any = {
            schema: {
              version: '2.0',
              format_version: '2024.1',
              compatibility_level: 'backward',
              migration_required: false
            },
            ...config
          };

          // Restructure quality gates
          if (config.quality_gates) {
            newConfig.governance = {
              quality_gates: {
                enabled: true,
                enforce_blocking: config.quality_gates.enforce_blocking || false,
                custom_rules: true,
                nasa_compliance: {
                  enabled: config.quality_gates.nasa_compliance?.enabled || false,
                  minimum_score: config.quality_gates.overall_quality_threshold || 0.75,
                  critical_violations_allowed: config.quality_gates.critical_violation_limit || 0,
                  high_violations_allowed: config.quality_gates.high_violation_limit || 5,
                  automated_remediation_suggestions: true
                },
                custom_gates: config.quality_gates.custom_gates || {}
              },
              policies: {
                code_standards: 'standard',
                security_requirements: 'standard',
                documentation_mandatory: false,
                review_requirements: {
                  min_approvers: 2,
                  security_review_required: true,
                  architecture_review_threshold: 100
                }
              }
            };
            delete newConfig.quality_gates;
          }

          return newConfig;
        },
        down: async (config: any) => {
          // Restore old structure
          if (config.governance?.quality_gates) {
            config.quality_gates = {
              overall_quality_threshold: config.governance.quality_gates.nasa_compliance.minimum_score,
              critical_violation_limit: config.governance.quality_gates.nasa_compliance.critical_violations_allowed,
              high_violation_limit: config.governance.quality_gates.nasa_compliance.high_violations_allowed,
              enforce_blocking: config.governance.quality_gates.enforce_blocking,
              custom_gates: config.governance.quality_gates.custom_gates
            };
            delete config.governance;
          }
          delete config.schema;
          return config;
        },
        validate: async (config: any) => {
          return config.schema?.version === '2.0' && config.governance !== undefined;
        }
      },

      {
        version: '2.1.0',
        description: 'Add advanced analytics and ML capabilities',
        breaking: false,
        dependencies: ['2.0.0'],
        up: async (config: any) => {
          if (!config.analytics) {
            config.analytics = {
              enabled: false,
              data_retention_days: 365,
              trend_analysis: false,
              predictive_insights: false,
              custom_dashboards: false,
              scheduled_reports: false,
              machine_learning: {
                enabled: false,
                model_training: false,
                anomaly_detection: false,
                pattern_recognition: false,
                automated_insights: false
              },
              export_formats: ['json'],
              real_time_streaming: false
            };
          }
          return config;
        },
        down: async (config: any) => {
          delete config.analytics;
          return config;
        },
        validate: async (config: any) => {
          return config.analytics !== undefined;
        }
      }
    ];

    migrations.forEach(migration => {
      this.migrations.set(migration.version, migration);
    });
  }

  /**
   * Initialize the migration system
   */
  async initialize(): Promise<void> {
    try {
      // Create necessary directories
      await this.createDirectories();
      
      // Load version history
      await this.loadVersionHistory();
      
      // Detect current version
      await this.detectCurrentVersion();
      
    } catch (error) {
      throw new Error(`Migration system initialization failed: ${error.message}`);
    }
  }

  /**
   * Create necessary directories
   */
  private async createDirectories(): Promise<void> {
    const directories = [
      this.config.versionsDirectory,
      this.config.migrationsDirectory,
      this.config.backupDirectory
    ];

    for (const dir of directories) {
      try {
        await fs.mkdir(dir, { recursive: true });
      } catch (error) {
        console.warn(`Failed to create directory ${dir}:`, error);
      }
    }
  }

  /**
   * Load version history from disk
   */
  private async loadVersionHistory(): Promise<void> {
    try {
      const historyPath = path.join(this.config.versionsDirectory, 'history.json');
      const historyContent = await fs.readFile(historyPath, 'utf-8');
      this.versionHistory = JSON.parse(historyContent);
    } catch (error) {
      // History file doesn't exist - start fresh
      this.versionHistory = [];
    }
  }

  /**
   * Save version history to disk
   */
  private async saveVersionHistory(): Promise<void> {
    const historyPath = path.join(this.config.versionsDirectory, 'history.json');
    await fs.writeFile(historyPath, JSON.stringify(this.versionHistory, null, 2));
  }

  /**
   * Detect current configuration version
   */
  private async detectCurrentVersion(): Promise<void> {
    try {
      const configPath = 'config/enterprise_config.yaml';
      const configContent = await fs.readFile(configPath, 'utf-8');
      const config = yaml.load(configContent) as any;
      
      this.currentVersion = config.schema?.version || '1.0.0';
    } catch (error) {
      // Configuration file doesn't exist or is invalid
      this.currentVersion = '1.0.0';
    }
  }

  /**
   * Get available migrations for a version range
   */
  getAvailableMigrations(fromVersion: string, toVersion: string): Migration[] {
    const availableMigrations: Migration[] = [];
    
    for (const [version, migration] of this.migrations.entries()) {
      if (this.isVersionInRange(version, fromVersion, toVersion)) {
        availableMigrations.push(migration);
      }
    }
    
    // Sort by semantic version
    return availableMigrations.sort((a, b) => this.compareVersions(a.version, b.version));
  }

  /**
   * Execute migration from current version to target version
   */
  async migrate(targetVersion?: string): Promise<MigrationResult> {
    const startTime = new Date();
    const fromVersion = this.currentVersion;
    const toVersion = targetVersion || this.getLatestVersion();
    
    const result: MigrationResult = {
      success: false,
      fromVersion,
      toVersion,
      executedMigrations: [],
      duration: 0,
      errors: [],
      warnings: [],
      metadata: {
        startTime,
        endTime: new Date(),
        totalMigrations: 0,
        skippedMigrations: 0,
        configSizeBefore: 0,
        configSizeAfter: 0,
        performanceMetrics: {
          migrationTime: 0,
          validationTime: 0,
          backupTime: 0,
          ioOperations: 0
        }
      }
    };

    try {
      // Load current configuration
      const configPath = 'config/enterprise_config.yaml';
      const configContent = await fs.readFile(configPath, 'utf-8');
      let currentConfig = yaml.load(configContent) as any;
      
      result.metadata.configSizeBefore = Buffer.byteLength(configContent, 'utf-8');

      // Create backup
      const backupStart = performance.now();
      result.backupPath = await this.createBackup(currentConfig, fromVersion);
      result.metadata.performanceMetrics.backupTime = performance.now() - backupStart;

      // Get required migrations
      const migrations = this.getAvailableMigrations(fromVersion, toVersion);
      result.metadata.totalMigrations = migrations.length;

      // Execute migrations in sequence
      const migrationStart = performance.now();
      for (const migration of migrations) {
        try {
          // Check if migration should be skipped
          if (migration.skipIf && migration.skipIf(currentConfig)) {
            result.metadata.skippedMigrations++;
            result.warnings.push({
              migration: migration.version,
              message: 'Migration skipped due to skip condition',
              recommendation: 'Review skip conditions if this is unexpected'
            });
            continue;
          }

          // Validate dependencies
          const dependenciesValid = await this.validateDependencies(migration, result.executedMigrations);
          if (!dependenciesValid) {
            result.errors.push({
              migration: migration.version,
              error: 'Migration dependencies not satisfied',
              severity: 'error',
              rollbackRequired: true
            });
            break;
          }

          // Execute migration
          currentConfig = await migration.up(currentConfig);
          
          // Validate result if required
          if (this.config.validationRequired) {
            const validationStart = performance.now();
            const isValid = await migration.validate(currentConfig);
            result.metadata.performanceMetrics.validationTime += performance.now() - validationStart;
            
            if (!isValid) {
              result.errors.push({
                migration: migration.version,
                error: 'Post-migration validation failed',
                severity: 'error',
                rollbackRequired: true
              });
              break;
            }
          }

          result.executedMigrations.push(migration.version);
          
          // Notify about breaking changes
          if (migration.breaking) {
            result.warnings.push({
              migration: migration.version,
              message: 'This migration contains breaking changes',
              recommendation: 'Review compatibility with existing configurations'
            });
          }

        } catch (error) {
          result.errors.push({
            migration: migration.version,
            error: error.message,
            severity: 'critical',
            rollbackRequired: true
          });
          break;
        }
      }

      result.metadata.performanceMetrics.migrationTime = performance.now() - migrationStart;

      // Handle migration failure
      if (result.errors.length > 0) {
        if (this.config.rollbackEnabled) {
          result.rollbackInfo = {
            availableVersions: this.getAvailableVersions(),
            recommendedVersion: fromVersion,
            rollbackPath: result.backupPath,
            estimatedDuration: result.metadata.performanceMetrics.migrationTime * 0.5
          };
        }
        
        result.success = false;
      } else {
        // Save migrated configuration
        const newConfigContent = yaml.dump(currentConfig, {
          indent: 2,
          lineWidth: 120,
          noRefs: true
        });
        
        await fs.writeFile(configPath, newConfigContent);
        result.metadata.performanceMetrics.ioOperations++;
        result.metadata.configSizeAfter = Buffer.byteLength(newConfigContent, 'utf-8');

        // Update current version
        this.currentVersion = toVersion;
        
        // Save version metadata
        await this.saveVersionMetadata(currentConfig, toVersion, result);
        
        result.success = true;
      }

    } catch (error) {
      result.errors.push({
        migration: 'system',
        error: `Migration system error: ${error.message}`,
        severity: 'critical',
        rollbackRequired: true
      });
    }

    // Calculate final metrics
    const endTime = new Date();
    result.metadata.endTime = endTime;
    result.duration = endTime.getTime() - startTime.getTime();

    // Send notifications
    if (this.config.notifications.enabled) {
      await this.sendNotification(result);
    }

    return result;
  }

  /**
   * Rollback to a specific version
   */
  async rollback(targetVersion: string): Promise<MigrationResult> {
    if (!this.config.rollbackEnabled) {
      throw new Error('Rollback is disabled in configuration');
    }

    const startTime = new Date();
    const fromVersion = this.currentVersion;
    
    const result: MigrationResult = {
      success: false,
      fromVersion,
      toVersion: targetVersion,
      executedMigrations: [],
      duration: 0,
      errors: [],
      warnings: [],
      metadata: {
        startTime,
        endTime: new Date(),
        totalMigrations: 0,
        skippedMigrations: 0,
        configSizeBefore: 0,
        configSizeAfter: 0,
        performanceMetrics: {
          migrationTime: 0,
          validationTime: 0,
          backupTime: 0,
          ioOperations: 0
        }
      }
    };

    try {
      // Load current configuration
      const configPath = 'config/enterprise_config.yaml';
      const configContent = await fs.readFile(configPath, 'utf-8');
      let currentConfig = yaml.load(configContent) as any;
      
      result.metadata.configSizeBefore = Buffer.byteLength(configContent, 'utf-8');

      // Create backup before rollback
      result.backupPath = await this.createBackup(currentConfig, fromVersion);

      // Get migrations to rollback (in reverse order)
      const migrations = this.getAvailableMigrations(targetVersion, fromVersion).reverse();
      result.metadata.totalMigrations = migrations.length;

      // Execute rollback migrations
      for (const migration of migrations) {
        try {
          currentConfig = await migration.down(currentConfig);
          result.executedMigrations.push(migration.version);
        } catch (error) {
          result.errors.push({
            migration: migration.version,
            error: `Rollback failed: ${error.message}`,
            severity: 'critical',
            rollbackRequired: false
          });
          break;
        }
      }

      if (result.errors.length === 0) {
        // Save rolled back configuration
        const newConfigContent = yaml.dump(currentConfig);
        await fs.writeFile(configPath, newConfigContent);
        
        this.currentVersion = targetVersion;
        result.success = true;
      }

    } catch (error) {
      result.errors.push({
        migration: 'system',
        error: `Rollback system error: ${error.message}`,
        severity: 'critical',
        rollbackRequired: false
      });
    }

    result.metadata.endTime = new Date();
    result.duration = result.metadata.endTime.getTime() - startTime.getTime();

    return result;
  }

  /**
   * Create configuration backup
   */
  private async createBackup(config: any, version: string): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `config-backup-${version}-${timestamp}.yaml`;
    const backupPath = path.join(this.config.backupDirectory, backupFileName);
    
    const configContent = yaml.dump(config);
    
    if (this.config.compressionEnabled) {
      const zlib = require('zlib');
      const compressed = zlib.gzipSync(configContent);
      await fs.writeFile(`${backupPath}.gz`, compressed);
      return `${backupPath}.gz`;
    } else {
      await fs.writeFile(backupPath, configContent);
      return backupPath;
    }
  }

  /**
   * Save version metadata
   */
  private async saveVersionMetadata(config: any, version: string, migrationResult: MigrationResult): Promise<void> {
    const configContent = yaml.dump(config);
    const checksum = createHash('sha256').update(configContent).digest('hex');
    
    const metadata: VersionMetadata = {
      version,
      timestamp: new Date().toISOString(),
      description: `Migration to version ${version}`,
      breaking_changes: migrationResult.errors.length > 0 ? ['Migration contained errors'] : [],
      migration_required: false,
      compatibility_level: this.getCompatibilityLevel(version),
      rollback_supported: this.config.rollbackEnabled,
      checksum,
      size_bytes: Buffer.byteLength(configContent, 'utf-8'),
      author: process.env.USER || 'system',
      change_log: migrationResult.executedMigrations.map(v => ({
        type: 'changed' as const,
        description: `Applied migration ${v}`,
        impact: 'medium' as const
      }))
    };

    // Add to history
    this.versionHistory.push(metadata);
    
    // Trim history if needed
    if (this.versionHistory.length > this.config.maxVersionHistory) {
      this.versionHistory = this.versionHistory.slice(-this.config.maxVersionHistory);
    }
    
    // Save to disk
    await this.saveVersionHistory();
    
    // Save individual version file
    const versionPath = path.join(this.config.versionsDirectory, `${version}.json`);
    await fs.writeFile(versionPath, JSON.stringify(metadata, null, 2));
  }

  /**
   * Validate migration dependencies
   */
  private async validateDependencies(migration: Migration, executedMigrations: string[]): Promise<boolean> {
    for (const dependency of migration.dependencies) {
      if (!executedMigrations.includes(dependency) && this.compareVersions(dependency, this.currentVersion) > 0) {
        return false;
      }
    }
    return true;
  }

  /**
   * Get compatibility level for version
   */
  private getCompatibilityLevel(version: string): 'major' | 'minor' | 'patch' {
    const [major, minor] = version.split('.').map(Number);
    const [currentMajor, currentMinor] = this.currentVersion.split('.').map(Number);
    
    if (major !== currentMajor) return 'major';
    if (minor !== currentMinor) return 'minor';
    return 'patch';
  }

  /**
   * Check if version is in range
   */
  private isVersionInRange(version: string, fromVersion: string, toVersion: string): boolean {
    return this.compareVersions(version, fromVersion) > 0 && 
           this.compareVersions(version, toVersion) <= 0;
  }

  /**
   * Compare semantic versions
   */
  private compareVersions(a: string, b: string): number {
    const [aMajor, aMinor, aPatch] = a.split('.').map(Number);
    const [bMajor, bMinor, bPatch] = b.split('.').map(Number);
    
    if (aMajor !== bMajor) return aMajor - bMajor;
    if (aMinor !== bMinor) return aMinor - bMinor;
    return aPatch - bPatch;
  }

  /**
   * Get latest available version
   */
  private getLatestVersion(): string {
    const versions = Array.from(this.migrations.keys()).sort(this.compareVersions.bind(this));
    return versions[versions.length - 1] || this.currentVersion;
  }

  /**
   * Get available versions for rollback
   */
  private getAvailableVersions(): string[] {
    return this.versionHistory
      .map(v => v.version)
      .filter(v => v !== this.currentVersion)
      .sort(this.compareVersions.bind(this));
  }

  /**
   * Send migration notification
   */
  private async sendNotification(result: MigrationResult): Promise<void> {
    const notificationData = {
      type: result.success ? 'migration_success' : 'migration_failure',
      fromVersion: result.fromVersion,
      toVersion: result.toVersion,
      duration: result.duration,
      errors: result.errors,
      warnings: result.warnings
    };

    // In production, this would integrate with actual notification systems
    console.log('[MIGRATION NOTIFICATION]', JSON.stringify(notificationData, null, 2));
  }

  /**
   * Get current version
   */
  getCurrentVersion(): string {
    return this.currentVersion;
  }

  /**
   * Get version history
   */
  getVersionHistory(): VersionMetadata[] {
    return [...this.versionHistory];
  }

  /**
   * Get available migrations
   */
  getAvailableMigrationsList(): { version: string; description: string; breaking: boolean }[] {
    return Array.from(this.migrations.values()).map(m => ({
      version: m.version,
      description: m.description,
      breaking: m.breaking
    }));
  }

  /**
   * Check if migration is needed
   */
  isMigrationNeeded(targetVersion?: string): boolean {
    const target = targetVersion || this.getLatestVersion();
    return this.compareVersions(target, this.currentVersion) > 0;
  }

  /**
   * Add custom migration
   */
  addMigration(migration: Migration): void {
    this.migrations.set(migration.version, migration);
  }

  /**
   * Remove migration
   */
  removeMigration(version: string): boolean {
    return this.migrations.delete(version);
  }

  /**
   * Get migration system status
   */
  getStatus(): {
    currentVersion: string;
    latestVersion: string;
    migrationNeeded: boolean;
    totalMigrations: number;
    versionHistoryCount: number;
    rollbackEnabled: boolean;
    autoMigrationEnabled: boolean;
  } {
    const latestVersion = this.getLatestVersion();
    
    return {
      currentVersion: this.currentVersion,
      latestVersion,
      migrationNeeded: this.isMigrationNeeded(latestVersion),
      totalMigrations: this.migrations.size,
      versionHistoryCount: this.versionHistory.length,
      rollbackEnabled: this.config.rollbackEnabled,
      autoMigrationEnabled: this.config.autoMigration
    };
  }
}

export default ConfigurationMigrationManager;