/**
 * Unified Configuration Manager
 * Integration patterns with existing configuration manager
 * Provides seamless integration between enterprise and analyzer configurations
 */

import { EventEmitter } from 'events';
import fs from 'fs/promises';
import path from 'path';
import yaml from 'js-yaml';
import { z } from 'zod';
import { EnterpriseConfigValidator, EnterpriseConfig, ValidationResult } from './schema-validator';
import { BackwardCompatibilityManager, LegacyDetectorConfig, LegacyAnalysisConfig, MigrationResult } from './backward-compatibility';

// Configuration manager options
export interface ConfigManagerOptions {
  configPath?: string;
  legacyDetectorPath?: string;
  legacyAnalysisPath?: string;
  environment?: string;
  enableHotReload?: boolean;
  validateOnLoad?: boolean;
  preserveLegacyConfigs?: boolean;
  conflictResolution?: 'legacy_wins' | 'enterprise_wins' | 'merge';
  backupEnabled?: boolean;
  auditLogging?: boolean;
}

// Configuration change events
export interface ConfigChangeEvent {
  type: 'loaded' | 'updated' | 'migrated' | 'validated' | 'error';
  path?: string;
  oldValue?: any;
  newValue?: any;
  timestamp: Date;
  source: 'file' | 'environment' | 'api' | 'migration';
  metadata?: Record<string, any>;
}

// Configuration load result
export interface ConfigLoadResult {
  success: boolean;
  config?: EnterpriseConfig;
  validation?: ValidationResult;
  migration?: MigrationResult;
  errors: string[];
  warnings: string[];
  appliedOverrides: string[];
}

// Configuration sources
export interface ConfigurationSources {
  enterprise: EnterpriseConfig | null;
  legacyDetector: LegacyDetectorConfig | null;
  legacyAnalysis: LegacyAnalysisConfig | null;
  environmentOverrides: Record<string, any>;
  merged: EnterpriseConfig | null;
}

/**
 * Unified Configuration Manager
 * Handles loading, validation, and integration of all configuration sources
 */
export class ConfigurationManager extends EventEmitter {
  private validator: EnterpriseConfigValidator;
  private compatibilityManager: BackwardCompatibilityManager;
  private currentConfig: EnterpriseConfig | null = null;
  private sources: ConfigurationSources;
  private options: Required<ConfigManagerOptions>;
  private watchHandlers: Map<string, any> = new Map();
  private lastLoadTime: Date | null = null;
  private configHash: string = '';

  constructor(options: ConfigManagerOptions = {}) {
    super();
    
    this.options = {
      configPath: options.configPath || 'config/enterprise_config.yaml',
      legacyDetectorPath: options.legacyDetectorPath || 'analyzer/config/detector_config.yaml',
      legacyAnalysisPath: options.legacyAnalysisPath || 'analyzer/config/analysis_config.yaml',
      environment: options.environment || process.env.NODE_ENV || 'development',
      enableHotReload: options.enableHotReload ?? true,
      validateOnLoad: options.validateOnLoad ?? true,
      preserveLegacyConfigs: options.preserveLegacyConfigs ?? true,
      conflictResolution: options.conflictResolution || 'merge',
      backupEnabled: options.backupEnabled ?? true,
      auditLogging: options.auditLogging ?? true
    };

    this.validator = new EnterpriseConfigValidator();
    this.compatibilityManager = new BackwardCompatibilityManager();
    
    this.sources = {
      enterprise: null,
      legacyDetector: null,
      legacyAnalysis: null,
      environmentOverrides: {},
      merged: null
    };
  }

  /**
   * Initialize the configuration manager
   */
  async initialize(): Promise<ConfigLoadResult> {
    try {
      this.emit('config_change', {
        type: 'loaded',
        timestamp: new Date(),
        source: 'file',
        metadata: { environment: this.options.environment }
      } as ConfigChangeEvent);

      // Load all configuration sources
      const loadResult = await this.loadAllSources();
      
      // Set up hot reload if enabled
      if (this.options.enableHotReload) {
        await this.setupHotReload();
      }

      // Log audit event
      if (this.options.auditLogging) {
        this.logAuditEvent('configuration_initialized', {
          environment: this.options.environment,
          success: loadResult.success,
          sourcesLoaded: Object.entries(this.sources)
            .filter(([, value]) => value !== null)
            .map(([key]) => key)
        });
      }

      this.lastLoadTime = new Date();
      return loadResult;

    } catch (error) {
      const errorResult: ConfigLoadResult = {
        success: false,
        errors: [`Initialization failed: ${error.message}`],
        warnings: [],
        appliedOverrides: []
      };

      this.emit('config_change', {
        type: 'error',
        timestamp: new Date(),
        source: 'file',
        metadata: { error: error.message }
      } as ConfigChangeEvent);

      return errorResult;
    }
  }

  /**
   * Load all configuration sources and merge them
   */
  private async loadAllSources(): Promise<ConfigLoadResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const appliedOverrides: string[] = [];
    let validation: ValidationResult | undefined;
    let migration: MigrationResult | undefined;

    try {
      // 1. Load enterprise configuration
      try {
        const enterpriseContent = await fs.readFile(this.options.configPath, 'utf-8');
        this.sources.enterprise = yaml.load(enterpriseContent) as EnterpriseConfig;
      } catch (error) {
        if (error.code !== 'ENOENT') {
          errors.push(`Failed to load enterprise config: ${error.message}`);
        } else {
          warnings.push('Enterprise configuration file not found, using defaults');
          this.sources.enterprise = this.createDefaultEnterpriseConfig();
        }
      }

      // 2. Load legacy configurations if preservation is enabled
      if (this.options.preserveLegacyConfigs) {
        try {
          const legacyConfigs = await this.compatibilityManager.loadLegacyConfigs(
            this.options.legacyDetectorPath,
            this.options.legacyAnalysisPath
          );
          
          this.sources.legacyDetector = legacyConfigs.detector;
          this.sources.legacyAnalysis = legacyConfigs.analysis;

          // Migrate legacy configuration if enterprise config doesn't exist
          if (!this.sources.enterprise) {
            const migrationResult = await this.compatibilityManager.migrateLegacyConfig(
              legacyConfigs,
              this.options.conflictResolution
            );
            
            migration = migrationResult;
            if (migrationResult.success) {
              this.sources.enterprise = migrationResult.migratedConfig as EnterpriseConfig;
              warnings.push('Generated enterprise config from legacy configuration');
            } else {
              errors.push('Failed to migrate legacy configuration');
            }
          }
        } catch (error) {
          warnings.push(`Could not load legacy configurations: ${error.message}`);
        }
      }

      // 3. Apply environment variable overrides
      this.sources.environmentOverrides = this.loadEnvironmentOverrides();
      if (Object.keys(this.sources.environmentOverrides).length > 0) {
        appliedOverrides.push(...Object.keys(this.sources.environmentOverrides));
      }

      // 4. Merge all sources
      if (this.sources.enterprise) {
        this.sources.merged = await this.mergeAllSources();
        
        // Apply environment-specific overrides from config
        if (this.sources.merged.environments?.[this.options.environment]) {
          this.applyEnvironmentSpecificOverrides(
            this.sources.merged,
            this.sources.merged.environments[this.options.environment]
          );
          appliedOverrides.push(`environment.${this.options.environment}`);
        }
      }

      // 5. Validate the final merged configuration
      if (this.options.validateOnLoad && this.sources.merged) {
        validation = this.validator.validateConfigObject(
          this.sources.merged,
          this.options.environment
        );
        
        if (!validation.isValid) {
          errors.push(...validation.errors.map(e => `${e.path}: ${e.message}`));
        }
        
        warnings.push(...validation.warnings.map(w => `${w.path}: ${w.message}`));
      }

      // 6. Set as current configuration if valid
      if (this.sources.merged && (!validation || validation.isValid)) {
        this.currentConfig = this.sources.merged;
        this.configHash = this.calculateConfigHash(this.currentConfig);
      }

      return {
        success: errors.length === 0,
        config: this.currentConfig || undefined,
        validation,
        migration,
        errors,
        warnings,
        appliedOverrides
      };

    } catch (error) {
      return {
        success: false,
        errors: [`Configuration loading failed: ${error.message}`],
        warnings,
        appliedOverrides
      };
    }
  }

  /**
   * Merge all configuration sources according to priority
   */
  private async mergeAllSources(): Promise<EnterpriseConfig> {
    if (!this.sources.enterprise) {
      throw new Error('Enterprise configuration is required for merging');
    }

    let mergedConfig = JSON.parse(JSON.stringify(this.sources.enterprise)) as EnterpriseConfig;

    // 1. Apply legacy configuration compatibility if enabled
    if (this.options.preserveLegacyConfigs && 
        (this.sources.legacyDetector || this.sources.legacyAnalysis)) {
      
      const { mergedConfig: legacyMerged } = await this.compatibilityManager.mergeWithLegacyConfig(
        mergedConfig,
        {
          detector: this.sources.legacyDetector,
          analysis: this.sources.legacyAnalysis
        },
        this.options.conflictResolution
      );
      
      mergedConfig = legacyMerged;
    }

    // 2. Apply environment variable overrides (highest priority)
    this.applyEnvironmentOverrides(mergedConfig, this.sources.environmentOverrides);

    return mergedConfig;
  }

  /**
   * Load environment variable overrides
   */
  private loadEnvironmentOverrides(): Record<string, any> {
    const overrides: Record<string, any> = {};
    const envPrefix = 'ENTERPRISE_CONFIG_';

    for (const [key, value] of Object.entries(process.env)) {
      if (key.startsWith(envPrefix)) {
        const configPath = key
          .substring(envPrefix.length)
          .toLowerCase()
          .replace(/_/g, '.');
        
        overrides[configPath] = this.parseEnvironmentValue(value!);
      }
    }

    return overrides;
  }

  /**
   * Parse environment variable value to appropriate type
   */
  private parseEnvironmentValue(value: string): any {
    // Boolean values
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;
    
    // Numeric values
    if (/^\d+$/.test(value)) return parseInt(value, 10);
    if (/^\d+\.\d+$/.test(value)) return parseFloat(value);
    
    // JSON values (for complex objects)
    if (value.startsWith('{') || value.startsWith('[')) {
      try {
        return JSON.parse(value);
      } catch {
        // Fall back to string if JSON parsing fails
      }
    }
    
    return value;
  }

  /**
   * Apply environment variable overrides to configuration
   */
  private applyEnvironmentOverrides(config: any, overrides: Record<string, any>): void {
    for (const [path, value] of Object.entries(overrides)) {
      this.setNestedProperty(config, path, value);
    }
  }

  /**
   * Apply environment-specific configuration overrides
   */
  private applyEnvironmentSpecificOverrides(config: any, overrides: Record<string, any>): void {
    for (const [path, value] of Object.entries(overrides)) {
      this.setNestedProperty(config, path, value);
    }
  }

  /**
   * Set up hot reload for configuration files
   */
  private async setupHotReload(): Promise<void> {
    const watchPaths = [
      this.options.configPath,
      this.options.legacyDetectorPath,
      this.options.legacyAnalysisPath
    ];

    for (const watchPath of watchPaths) {
      try {
        const { watch } = await import('chokidar');
        const watcher = watch(watchPath, { 
          ignored: /(^|[\/\\])\../, 
          persistent: true 
        });

        watcher.on('change', async (changedPath) => {
          try {
            await this.reloadConfiguration();
            
            this.emit('config_change', {
              type: 'updated',
              path: changedPath,
              timestamp: new Date(),
              source: 'file',
              metadata: { trigger: 'file_change' }
            } as ConfigChangeEvent);
            
          } catch (error) {
            this.emit('config_change', {
              type: 'error',
              path: changedPath,
              timestamp: new Date(),
              source: 'file',
              metadata: { error: error.message, trigger: 'hot_reload' }
            } as ConfigChangeEvent);
          }
        });

        this.watchHandlers.set(watchPath, watcher);
      } catch (error) {
        console.warn(`Could not set up hot reload for ${watchPath}:`, error.message);
      }
    }
  }

  /**
   * Reload configuration from all sources
   */
  async reloadConfiguration(): Promise<ConfigLoadResult> {
    const oldConfig = this.currentConfig;
    const oldHash = this.configHash;
    
    const result = await this.loadAllSources();
    
    if (result.success && this.configHash !== oldHash) {
      this.emit('config_change', {
        type: 'updated',
        oldValue: oldConfig,
        newValue: this.currentConfig,
        timestamp: new Date(),
        source: 'file',
        metadata: { 
          oldHash, 
          newHash: this.configHash,
          trigger: 'reload'
        }
      } as ConfigChangeEvent);

      if (this.options.auditLogging) {
        this.logAuditEvent('configuration_reloaded', {
          environment: this.options.environment,
          oldHash,
          newHash: this.configHash,
          success: result.success
        });
      }
    }
    
    return result;
  }

  /**
   * Get current configuration
   */
  getConfig(): EnterpriseConfig | null {
    return this.currentConfig;
  }

  /**
   * Get configuration sources
   */
  getConfigurationSources(): ConfigurationSources {
    return { ...this.sources };
  }

  /**
   * Get specific configuration value by path
   */
  getConfigValue<T = any>(path: string, defaultValue?: T): T {
    if (!this.currentConfig) {
      return defaultValue as T;
    }
    
    const value = this.getNestedProperty(this.currentConfig, path);
    return value !== undefined ? value : defaultValue;
  }

  /**
   * Update configuration value
   */
  async updateConfigValue(path: string, value: any, persist: boolean = true): Promise<boolean> {
    if (!this.currentConfig) {
      throw new Error('No configuration loaded');
    }
    
    const oldValue = this.getNestedProperty(this.currentConfig, path);
    this.setNestedProperty(this.currentConfig, path, value);
    
    // Validate updated configuration
    if (this.options.validateOnLoad) {
      const validation = this.validator.validateConfigObject(
        this.currentConfig,
        this.options.environment
      );
      
      if (!validation.isValid) {
        // Rollback on validation failure
        this.setNestedProperty(this.currentConfig, path, oldValue);
        throw new Error(`Configuration update failed validation: ${validation.errors.map(e => e.message).join(', ')}`);
      }
    }
    
    // Persist to file if requested
    if (persist) {
      try {
        await this.persistConfiguration();
      } catch (error) {
        // Rollback on persistence failure
        this.setNestedProperty(this.currentConfig, path, oldValue);
        throw new Error(`Failed to persist configuration: ${error.message}`);
      }
    }
    
    // Update hash and emit change event
    this.configHash = this.calculateConfigHash(this.currentConfig);
    
    this.emit('config_change', {
      type: 'updated',
      path,
      oldValue,
      newValue: value,
      timestamp: new Date(),
      source: 'api',
      metadata: { persisted: persist }
    } as ConfigChangeEvent);
    
    if (this.options.auditLogging) {
      this.logAuditEvent('configuration_updated', {
        path,
        oldValue,
        newValue: value,
        persisted: persist,
        environment: this.options.environment
      });
    }
    
    return true;
  }

  /**
   * Persist current configuration to file
   */
  async persistConfiguration(): Promise<void> {
    if (!this.currentConfig) {
      throw new Error('No configuration to persist');
    }

    // Create backup if enabled
    if (this.options.backupEnabled) {
      try {
        const backupPath = await this.createConfigBackup();
        console.log(`Configuration backup created: ${backupPath}`);
      } catch (error) {
        console.warn(`Failed to create backup: ${error.message}`);
      }
    }

    // Write configuration to file
    const configContent = yaml.dump(this.currentConfig, {
      indent: 2,
      lineWidth: 120,
      noRefs: true
    });

    await fs.writeFile(this.options.configPath, configContent, 'utf-8');
  }

  /**
   * Create a backup of the current configuration
   */
  private async createConfigBackup(): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = 'config/backups';
    const backupPath = path.join(backupDir, `enterprise_config_${timestamp}.yaml`);
    
    await fs.mkdir(backupDir, { recursive: true });
    
    const currentContent = await fs.readFile(this.options.configPath, 'utf-8');
    await fs.writeFile(backupPath, currentContent);
    
    return backupPath;
  }

  /**
   * Create default enterprise configuration
   */
  private createDefaultEnterpriseConfig(): EnterpriseConfig {
    return {
      schema: {
        version: "1.0",
        format_version: "2024.1",
        compatibility_level: "backward",
        migration_required: false
      },
      enterprise: {
        enabled: true,
        license_mode: "community",
        compliance_level: "standard",
        features: {
          advanced_analytics: false,
          multi_tenant_support: false,
          enterprise_security: false,
          audit_logging: false,
          performance_monitoring: true,
          custom_detectors: true,
          integration_platform: false,
          governance_framework: true,
          compliance_reporting: false,
          advanced_visualization: false,
          ml_insights: false,
          risk_assessment: false,
          automated_remediation: false,
          multi_environment_sync: false,
          enterprise_apis: false
        }
      },
      security: {
        authentication: {
          enabled: false,
          method: "basic",
          session_timeout: 3600,
          max_concurrent_sessions: 5,
          password_policy: {
            min_length: 8,
            require_uppercase: true,
            require_lowercase: true,
            require_numbers: true,
            require_special_chars: false,
            expiry_days: 90
          }
        },
        authorization: {
          rbac_enabled: false,
          default_role: "viewer",
          roles: {
            viewer: { permissions: ["read"] },
            developer: { permissions: ["read", "execute"] },
            admin: { permissions: ["read", "write", "execute", "admin"] }
          }
        },
        audit: {
          enabled: false,
          log_level: "basic",
          retention_days: 90,
          export_format: "json",
          real_time_monitoring: false,
          anomaly_detection: false
        },
        encryption: {
          at_rest: false,
          in_transit: false,
          algorithm: "AES-256-GCM",
          key_rotation_days: 90
        }
      },
      multi_tenancy: {
        enabled: false,
        isolation_level: "basic",
        tenant_specific_config: false,
        resource_quotas: {
          max_users_per_tenant: 100,
          max_projects_per_tenant: 10,
          max_analysis_jobs_per_day: 1000,
          storage_limit_gb: 10
        },
        default_tenant: {
          name: "default",
          admin_email: "admin@example.com",
          compliance_profile: "standard"
        }
      },
      performance: {
        scaling: {
          auto_scaling_enabled: false,
          min_workers: 1,
          max_workers: 4,
          scale_up_threshold: 0.8,
          scale_down_threshold: 0.3,
          cooldown_period: 300
        },
        resource_limits: {
          max_memory_mb: 4096,
          max_cpu_cores: 4,
          max_file_size_mb: 10,
          max_analysis_time_seconds: 300,
          max_concurrent_analyses: 5
        },
        caching: {
          enabled: true,
          provider: "memory",
          ttl_seconds: 3600,
          max_cache_size_mb: 512,
          cache_compression: false
        },
        database: {
          connection_pool_size: 10,
          query_timeout_seconds: 30,
          read_replica_enabled: false,
          indexing_strategy: "basic"
        }
      },
      integrations: {
        api: {
          enabled: true,
          version: "v1",
          rate_limiting: {
            enabled: false,
            requests_per_minute: 100,
            burst_limit: 10
          },
          authentication_required: false,
          cors_enabled: true,
          swagger_ui_enabled: true
        },
        webhooks: {
          enabled: false,
          max_endpoints: 10,
          timeout_seconds: 30,
          retry_attempts: 3,
          signature_verification: false
        },
        external_systems: {
          github: {
            enabled: false
          }
        },
        ci_cd: {
          github_actions: {
            enabled: false
          }
        }
      },
      monitoring: {
        metrics: {
          enabled: true,
          provider: "prometheus",
          collection_interval: 30,
          retention_days: 7,
          custom_metrics: false
        },
        logging: {
          enabled: true,
          level: "info",
          format: "text",
          output: ["console"],
          file_rotation: false,
          max_file_size_mb: 100,
          max_files: 5
        },
        tracing: {
          enabled: false,
          sampling_rate: 0.1,
          provider: "jaeger"
        },
        alerts: {
          enabled: false,
          channels: [],
          thresholds: {
            error_rate: 0.05,
            response_time_p95: 5000,
            memory_usage: 0.85,
            cpu_usage: 0.90
          }
        }
      },
      analytics: {
        enabled: false,
        data_retention_days: 30,
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
        export_formats: ["json"],
        real_time_streaming: false
      },
      governance: {
        quality_gates: {
          enabled: true,
          enforce_blocking: false,
          custom_rules: false,
          nasa_compliance: {
            enabled: false,
            minimum_score: 0.75,
            critical_violations_allowed: 0,
            high_violations_allowed: 5,
            automated_remediation_suggestions: false
          },
          custom_gates: {}
        },
        policies: {
          code_standards: "standard",
          security_requirements: "basic",
          documentation_mandatory: false,
          review_requirements: {
            min_approvers: 1,
            security_review_required: false,
            architecture_review_threshold: 100
          }
        }
      },
      notifications: {
        enabled: false,
        channels: {},
        templates: {},
        escalation: {
          enabled: false,
          levels: []
        }
      },
      legacy_integration: {
        preserve_existing_configs: true,
        migration_warnings: true,
        detector_config_path: "analyzer/config/detector_config.yaml",
        analysis_config_path: "analyzer/config/analysis_config.yaml",
        conflict_resolution: "merge"
      },
      extensions: {
        custom_detectors: {
          enabled: true,
          directory: "extensions/detectors",
          auto_discovery: true
        },
        custom_reporters: {
          enabled: true,
          directory: "extensions/reporters",
          formats: ["json"]
        },
        plugins: {
          enabled: false,
          directory: "extensions/plugins",
          sandboxing: true,
          security_scanning: true
        }
      },
      backup: {
        enabled: false,
        schedule: "0 2 * * *",
        retention_days: 30,
        encryption: false,
        offsite_storage: false,
        disaster_recovery: {
          enabled: false,
          rpo_minutes: 60,
          rto_minutes: 240,
          failover_testing: false,
          automated_failover: false
        }
      },
      validation: {
        schema_validation: true,
        runtime_validation: false,
        configuration_drift_detection: false,
        rules: []
      }
    } as EnterpriseConfig;
  }

  /**
   * Calculate configuration hash for change detection
   */
  private calculateConfigHash(config: any): string {
    const crypto = require('crypto');
    const configString = JSON.stringify(config, Object.keys(config).sort());
    return crypto.createHash('sha256').update(configString).digest('hex');
  }

  /**
   * Get nested property using dot notation
   */
  private getNestedProperty(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Set nested property using dot notation
   */
  private setNestedProperty(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    let current = obj;
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!(keys[i] in current)) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
  }

  /**
   * Log audit event
   */
  private logAuditEvent(event: string, metadata: Record<string, any>): void {
    const auditEntry = {
      timestamp: new Date().toISOString(),
      event,
      metadata,
      environment: this.options.environment,
      configHash: this.configHash
    };
    
    // In production, this would go to a proper audit logging system
    console.log('[AUDIT]', JSON.stringify(auditEntry));
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    // Close file watchers
    for (const [path, watcher] of this.watchHandlers.entries()) {
      try {
        await watcher.close();
      } catch (error) {
        console.warn(`Failed to close watcher for ${path}:`, error.message);
      }
    }
    
    this.watchHandlers.clear();
    this.removeAllListeners();
  }

  /**
   * Get configuration manager status
   */
  getStatus(): {
    initialized: boolean;
    configLoaded: boolean;
    lastLoadTime: Date | null;
    hotReloadEnabled: boolean;
    watchedFiles: string[];
    environment: string;
    configHash: string;
  } {
    return {
      initialized: this.currentConfig !== null,
      configLoaded: this.currentConfig !== null,
      lastLoadTime: this.lastLoadTime,
      hotReloadEnabled: this.options.enableHotReload,
      watchedFiles: Array.from(this.watchHandlers.keys()),
      environment: this.options.environment,
      configHash: this.configHash
    };
  }
}

export default ConfigurationManager;