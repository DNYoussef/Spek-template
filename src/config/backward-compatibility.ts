/**
 * Backward Compatibility Layer
 * Preserves existing analyzer configuration while integrating with enterprise features
 * Provides seamless migration path and conflict resolution strategies
 */

import yaml from 'js-yaml';
import fs from 'fs/promises';
import path from 'path';
import { z } from 'zod';
import { EnterpriseConfig } from './schema-validator';

// Legacy configuration schemas (based on existing analyzer configs)
const LegacyDetectorConfigSchema = z.object({
  values_detector: z.object({
    config_keywords: z.array(z.string()),
    thresholds: z.object({
      duplicate_literal_minimum: z.number(),
      configuration_coupling_limit: z.number(),
      configuration_line_spread: z.number()
    }),
    exclusions: z.object({
      common_strings: z.array(z.string()),
      common_numbers: z.array(z.union([z.number(), z.string()]))
    })
  }),
  position_detector: z.object({
    max_positional_params: z.number(),
    severity_mapping: z.record(z.string())
  }),
  algorithm_detector: z.object({
    minimum_function_lines: z.number(),
    duplicate_threshold: z.number(),
    normalization: z.object({
      ignore_variable_names: z.boolean(),
      ignore_comments: z.boolean(),
      focus_on_structure: z.boolean()
    })
  }),
  magic_literal_detector: z.object({
    severity_rules: z.record(z.string()),
    thresholds: z.object({
      number_repetition: z.number(),
      string_repetition: z.number()
    })
  }),
  god_object_detector: z.object({
    method_threshold: z.number(),
    loc_threshold: z.number(),
    parameter_threshold: z.number()
  }),
  timing_detector: z.object({
    sleep_detection: z.boolean(),
    timeout_patterns: z.array(z.string()),
    severity: z.string()
  }),
  convention_detector: z.object({
    naming_patterns: z.record(z.string())
  }),
  execution_detector: z.object({
    dangerous_functions: z.array(z.string()),
    subprocess_patterns: z.array(z.string())
  })
});

const LegacyAnalysisConfigSchema = z.object({
  analysis: z.object({
    default_policy: z.string(),
    max_file_size_mb: z.number(),
    max_analysis_time_seconds: z.number(),
    parallel_workers: z.number(),
    cache_enabled: z.boolean()
  }),
  quality_gates: z.object({
    overall_quality_threshold: z.number(),
    critical_violation_limit: z.number(),
    high_violation_limit: z.number(),
    policies: z.record(z.object({
      quality_threshold: z.number(),
      violation_limits: z.record(z.number())
    }))
  }),
  connascence: z.object({
    type_weights: z.record(z.number()),
    severity_multipliers: z.record(z.number())
  }),
  file_processing: z.object({
    supported_extensions: z.array(z.string()),
    exclusion_patterns: z.array(z.string()),
    max_recursion_depth: z.number(),
    follow_symlinks: z.boolean()
  }),
  error_handling: z.object({
    continue_on_syntax_error: z.boolean(),
    log_all_errors: z.boolean(),
    graceful_degradation: z.boolean(),
    max_retry_attempts: z.number()
  }),
  reporting: z.object({
    default_format: z.string(),
    include_recommendations: z.boolean(),
    include_context: z.boolean(),
    max_code_snippet_lines: z.number(),
    formats: z.record(z.record(z.union([z.boolean(), z.string()])))
  }),
  integrations: z.object({
    mcp: z.object({
      timeout_seconds: z.number(),
      max_request_size_mb: z.number(),
      rate_limit_requests_per_minute: z.number()
    }),
    vscode: z.object({
      live_analysis: z.boolean(),
      max_diagnostics: z.number(),
      debounce_ms: z.number()
    }),
    cli: z.object({
      colored_output: z.boolean(),
      progress_bar: z.boolean(),
      verbose_default: z.boolean()
    })
  })
});

export type LegacyDetectorConfig = z.infer<typeof LegacyDetectorConfigSchema>;
export type LegacyAnalysisConfig = z.infer<typeof LegacyAnalysisConfigSchema>;

// Migration result types
export interface MigrationResult {
  success: boolean;
  migratedConfig: Partial<EnterpriseConfig>;
  conflicts: ConfigConflict[];
  warnings: MigrationWarning[];
  preservedLegacyConfig: boolean;
  backupPath?: string;
}

export interface ConfigConflict {
  path: string;
  legacyValue: any;
  enterpriseValue: any;
  resolution: 'legacy_wins' | 'enterprise_wins' | 'merge' | 'manual_required';
  rationale: string;
}

export interface MigrationWarning {
  path: string;
  message: string;
  severity: 'info' | 'warning' | 'error';
  recommendation?: string;
}

export interface CompatibilityMapping {
  legacyPath: string;
  enterprisePath: string;
  transformer?: (value: any) => any;
  validator?: (value: any) => boolean;
  conflicts?: 'prefer_legacy' | 'prefer_enterprise' | 'merge';
}

/**
 * Backward Compatibility Manager
 * Handles migration and preservation of existing analyzer configuration
 */
export class BackwardCompatibilityManager {
  private legacyDetectorConfig: LegacyDetectorConfig | null = null;
  private legacyAnalysisConfig: LegacyAnalysisConfig | null = null;
  private migrationMappings: CompatibilityMapping[] = [];

  constructor() {
    this.initializeMigrationMappings();
  }

  /**
   * Initialize mapping between legacy and enterprise configuration paths
   */
  private initializeMigrationMappings(): void {
    this.migrationMappings = [
      // Analysis configuration mappings
      {
        legacyPath: 'analysis.max_file_size_mb',
        enterprisePath: 'performance.resource_limits.max_file_size_mb'
      },
      {
        legacyPath: 'analysis.max_analysis_time_seconds',
        enterprisePath: 'performance.resource_limits.max_analysis_time_seconds'
      },
      {
        legacyPath: 'analysis.parallel_workers',
        enterprisePath: 'performance.scaling.max_workers'
      },
      {
        legacyPath: 'analysis.cache_enabled',
        enterprisePath: 'performance.caching.enabled'
      },

      // Quality gates mappings
      {
        legacyPath: 'quality_gates.overall_quality_threshold',
        enterprisePath: 'governance.quality_gates.custom_gates.overall_threshold',
        transformer: (value: number) => value
      },
      {
        legacyPath: 'quality_gates.critical_violation_limit',
        enterprisePath: 'governance.quality_gates.nasa_compliance.critical_violations_allowed'
      },
      {
        legacyPath: 'quality_gates.high_violation_limit',
        enterprisePath: 'governance.quality_gates.nasa_compliance.high_violations_allowed'
      },

      // NASA compliance mapping
      {
        legacyPath: 'quality_gates.policies.nasa-compliance',
        enterprisePath: 'governance.quality_gates.nasa_compliance',
        transformer: (policy: any) => ({
          enabled: true,
          minimum_score: policy.quality_threshold,
          critical_violations_allowed: policy.violation_limits.critical || 0,
          high_violations_allowed: policy.violation_limits.high || 0,
          automated_remediation_suggestions: true
        })
      },

      // File processing mappings
      {
        legacyPath: 'file_processing.supported_extensions',
        enterprisePath: 'governance.policies.supported_file_types',
        transformer: (extensions: string[]) => extensions
      },
      {
        legacyPath: 'file_processing.exclusion_patterns',
        enterprisePath: 'governance.policies.exclusion_patterns'
      },

      // Reporting mappings
      {
        legacyPath: 'reporting.default_format',
        enterprisePath: 'analytics.export_formats',
        transformer: (format: string) => [format]
      },
      {
        legacyPath: 'reporting.include_recommendations',
        enterprisePath: 'analytics.predictive_insights'
      },

      // Integration mappings
      {
        legacyPath: 'integrations.mcp.timeout_seconds',
        enterprisePath: 'integrations.api.rate_limiting.timeout_seconds',
        transformer: (timeout: number) => timeout
      },
      {
        legacyPath: 'integrations.mcp.rate_limit_requests_per_minute',
        enterprisePath: 'integrations.api.rate_limiting.requests_per_minute'
      },
      {
        legacyPath: 'integrations.vscode.live_analysis',
        enterprisePath: 'monitoring.metrics.enabled'
      },

      // Detector configuration mappings
      {
        legacyPath: 'god_object_detector.method_threshold',
        enterprisePath: 'governance.quality_gates.custom_gates.god_object_method_threshold'
      },
      {
        legacyPath: 'god_object_detector.loc_threshold',
        enterprisePath: 'governance.quality_gates.custom_gates.god_object_loc_threshold'
      },
      {
        legacyPath: 'magic_literal_detector.thresholds',
        enterprisePath: 'governance.quality_gates.custom_gates.magic_literal_thresholds',
        transformer: (thresholds: any) => thresholds
      }
    ];
  }

  /**
   * Load existing legacy configuration files
   */
  async loadLegacyConfigs(
    detectorConfigPath?: string,
    analysisConfigPath?: string
  ): Promise<{ detector: LegacyDetectorConfig | null; analysis: LegacyAnalysisConfig | null }> {
    const detectorPath = detectorConfigPath || 'analyzer/config/detector_config.yaml';
    const analysisPath = analysisConfigPath || 'analyzer/config/analysis_config.yaml';

    try {
      const [detectorContent, analysisContent] = await Promise.allSettled([
        this.loadYamlFile(detectorPath),
        this.loadYamlFile(analysisPath)
      ]);

      let detectorConfig: LegacyDetectorConfig | null = null;
      let analysisConfig: LegacyAnalysisConfig | null = null;

      if (detectorContent.status === 'fulfilled') {
        try {
          detectorConfig = LegacyDetectorConfigSchema.parse(detectorContent.value);
          this.legacyDetectorConfig = detectorConfig;
        } catch (error) {
          console.warn('Failed to parse detector config, using as-is:', error.message);
          detectorConfig = detectorContent.value as LegacyDetectorConfig;
        }
      }

      if (analysisContent.status === 'fulfilled') {
        try {
          analysisConfig = LegacyAnalysisConfigSchema.parse(analysisContent.value);
          this.legacyAnalysisConfig = analysisConfig;
        } catch (error) {
          console.warn('Failed to parse analysis config, using as-is:', error.message);
          analysisConfig = analysisContent.value as LegacyAnalysisConfig;
        }
      }

      return { detector: detectorConfig, analysis: analysisConfig };
    } catch (error) {
      throw new Error(`Failed to load legacy configurations: ${error.message}`);
    }
  }

  /**
   * Migrate legacy configuration to enterprise format
   */
  async migrateLegacyConfig(
    legacyConfigs: { detector: LegacyDetectorConfig | null; analysis: LegacyAnalysisConfig | null },
    conflictResolution: 'legacy_wins' | 'enterprise_wins' | 'merge' = 'merge'
  ): Promise<MigrationResult> {
    const conflicts: ConfigConflict[] = [];
    const warnings: MigrationWarning[] = [];
    const migratedConfig: Partial<EnterpriseConfig> = {};

    try {
      // Create backup of legacy configs
      const backupPath = await this.createLegacyBackup(legacyConfigs);

      // Migrate analysis configuration
      if (legacyConfigs.analysis) {
        const analysisResult = this.migrateAnalysisConfig(
          legacyConfigs.analysis,
          conflictResolution
        );
        Object.assign(migratedConfig, analysisResult.config);
        conflicts.push(...analysisResult.conflicts);
        warnings.push(...analysisResult.warnings);
      }

      // Migrate detector configuration
      if (legacyConfigs.detector) {
        const detectorResult = this.migrateDetectorConfig(
          legacyConfigs.detector,
          conflictResolution
        );
        Object.assign(migratedConfig, detectorResult.config);
        conflicts.push(...detectorResult.conflicts);
        warnings.push(...detectorResult.warnings);
      }

      // Add compatibility layer configuration
      this.addCompatibilityLayerConfig(migratedConfig);

      return {
        success: true,
        migratedConfig,
        conflicts,
        warnings,
        preservedLegacyConfig: conflictResolution !== 'enterprise_wins',
        backupPath
      };

    } catch (error) {
      return {
        success: false,
        migratedConfig: {},
        conflicts,
        warnings: [...warnings, {
          path: 'migration',
          message: `Migration failed: ${error.message}`,
          severity: 'error'
        }],
        preservedLegacyConfig: false
      };
    }
  }

  /**
   * Migrate analysis configuration
   */
  private migrateAnalysisConfig(
    analysisConfig: LegacyAnalysisConfig,
    conflictResolution: 'legacy_wins' | 'enterprise_wins' | 'merge'
  ): { config: Partial<EnterpriseConfig>; conflicts: ConfigConflict[]; warnings: MigrationWarning[] } {
    const config: Partial<EnterpriseConfig> = {
      performance: {
        resource_limits: {
          max_file_size_mb: analysisConfig.analysis.max_file_size_mb,
          max_analysis_time_seconds: analysisConfig.analysis.max_analysis_time_seconds,
          max_memory_mb: 8192, // default
          max_cpu_cores: 8, // default
          max_concurrent_analyses: analysisConfig.analysis.parallel_workers
        },
        scaling: {
          auto_scaling_enabled: false,
          min_workers: 1,
          max_workers: analysisConfig.analysis.parallel_workers,
          scale_up_threshold: 0.8,
          scale_down_threshold: 0.3,
          cooldown_period: 300
        },
        caching: {
          enabled: analysisConfig.analysis.cache_enabled,
          provider: 'memory' as const,
          ttl_seconds: 3600,
          max_cache_size_mb: 1024,
          cache_compression: false
        },
        database: {
          connection_pool_size: 20,
          query_timeout_seconds: 30,
          read_replica_enabled: false,
          indexing_strategy: 'optimized'
        }
      },
      governance: {
        quality_gates: {
          enabled: true,
          enforce_blocking: true,
          custom_rules: true,
          nasa_compliance: {
            enabled: analysisConfig.quality_gates.policies?.['nasa-compliance']?.quality_threshold >= 0.95 || false,
            minimum_score: analysisConfig.quality_gates.policies?.['nasa-compliance']?.quality_threshold || 0.75,
            critical_violations_allowed: analysisConfig.quality_gates.policies?.['nasa-compliance']?.violation_limits?.critical || 0,
            high_violations_allowed: analysisConfig.quality_gates.policies?.['nasa-compliance']?.violation_limits?.high || 5,
            automated_remediation_suggestions: true
          },
          custom_gates: {
            overall_threshold: analysisConfig.quality_gates.overall_quality_threshold,
            critical_violation_limit: analysisConfig.quality_gates.critical_violation_limit,
            high_violation_limit: analysisConfig.quality_gates.high_violation_limit
          }
        },
        policies: {
          code_standards: analysisConfig.analysis.default_policy,
          security_requirements: 'standard',
          documentation_mandatory: analysisConfig.reporting.include_context,
          review_requirements: {
            min_approvers: 2,
            security_review_required: true,
            architecture_review_threshold: 100
          }
        }
      },
      analytics: {
        enabled: true,
        data_retention_days: 365,
        trend_analysis: analysisConfig.reporting.include_recommendations,
        predictive_insights: analysisConfig.reporting.include_recommendations,
        custom_dashboards: true,
        scheduled_reports: false,
        machine_learning: {
          enabled: false,
          model_training: false,
          anomaly_detection: false,
          pattern_recognition: false,
          automated_insights: false
        },
        export_formats: [analysisConfig.reporting.default_format as any],
        real_time_streaming: false
      }
    };

    const conflicts: ConfigConflict[] = [];
    const warnings: MigrationWarning[] = [];

    // Check for potential conflicts and add warnings
    if (analysisConfig.analysis.parallel_workers > 20) {
      warnings.push({
        path: 'performance.scaling.max_workers',
        message: `Legacy parallel_workers (${analysisConfig.analysis.parallel_workers}) exceeds recommended limit`,
        severity: 'warning',
        recommendation: 'Consider reducing to 20 or implementing worker pools'
      });
    }

    if (analysisConfig.quality_gates.overall_quality_threshold < 0.75) {
      warnings.push({
        path: 'governance.quality_gates.custom_gates.overall_threshold',
        message: 'Legacy quality threshold is below enterprise standard',
        severity: 'warning',
        recommendation: 'Consider increasing to 0.75 or higher'
      });
    }

    return { config, conflicts, warnings };
  }

  /**
   * Migrate detector configuration
   */
  private migrateDetectorConfig(
    detectorConfig: LegacyDetectorConfig,
    conflictResolution: 'legacy_wins' | 'enterprise_wins' | 'merge'
  ): { config: Partial<EnterpriseConfig>; conflicts: ConfigConflict[]; warnings: MigrationWarning[] } {
    const config: Partial<EnterpriseConfig> = {};
    const conflicts: ConfigConflict[] = [];
    const warnings: MigrationWarning[] = [];

    // Migrate god object detector settings to quality gates
    if (!config.governance) {
      config.governance = {
        quality_gates: {
          enabled: true,
          enforce_blocking: true,
          custom_rules: true,
          nasa_compliance: {
            enabled: false,
            minimum_score: 0.75,
            critical_violations_allowed: 0,
            high_violations_allowed: 5,
            automated_remediation_suggestions: true
          },
          custom_gates: {}
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
    }

    // Migrate god object thresholds
    if (config.governance?.quality_gates?.custom_gates) {
      config.governance.quality_gates.custom_gates.god_object_method_threshold = 
        detectorConfig.god_object_detector.method_threshold;
      config.governance.quality_gates.custom_gates.god_object_loc_threshold = 
        detectorConfig.god_object_detector.loc_threshold;
      config.governance.quality_gates.custom_gates.god_object_parameter_threshold = 
        detectorConfig.god_object_detector.parameter_threshold;
    }

    // Migrate magic literal thresholds
    if (config.governance?.quality_gates?.custom_gates) {
      config.governance.quality_gates.custom_gates.magic_literal_number_repetition = 
        detectorConfig.magic_literal_detector.thresholds.number_repetition;
      config.governance.quality_gates.custom_gates.magic_literal_string_repetition = 
        detectorConfig.magic_literal_detector.thresholds.string_repetition;
    }

    // Store detector-specific configuration for extensions
    if (!config.extensions) {
      config.extensions = {
        custom_detectors: {
          enabled: true,
          directory: 'extensions/detectors',
          auto_discovery: true
        },
        custom_reporters: {
          enabled: true,
          directory: 'extensions/reporters',
          formats: ['custom_json']
        },
        plugins: {
          enabled: true,
          directory: 'extensions/plugins',
          sandboxing: true,
          security_scanning: true
        }
      };
    }

    warnings.push({
      path: 'extensions.custom_detectors',
      message: 'Detector-specific configuration preserved in extensions section',
      severity: 'info',
      recommendation: 'Review custom detector settings in extensions configuration'
    });

    return { config, conflicts, warnings };
  }

  /**
   * Add compatibility layer configuration
   */
  private addCompatibilityLayerConfig(config: Partial<EnterpriseConfig>): void {
    if (!config.legacy_integration) {
      config.legacy_integration = {
        preserve_existing_configs: true,
        migration_warnings: true,
        detector_config_path: 'analyzer/config/detector_config.yaml',
        analysis_config_path: 'analyzer/config/analysis_config.yaml',
        conflict_resolution: 'merge'
      };
    }
  }

  /**
   * Merge enterprise config with legacy settings
   */
  async mergeWithLegacyConfig(
    enterpriseConfig: EnterpriseConfig,
    legacyConfigs: { detector: LegacyDetectorConfig | null; analysis: LegacyAnalysisConfig | null },
    conflictResolution: 'legacy_wins' | 'enterprise_wins' | 'merge' = 'merge'
  ): Promise<{ mergedConfig: EnterpriseConfig; conflicts: ConfigConflict[] }> {
    const mergedConfig = JSON.parse(JSON.stringify(enterpriseConfig)) as EnterpriseConfig;
    const conflicts: ConfigConflict[] = [];

    // Apply legacy mappings based on conflict resolution strategy
    for (const mapping of this.migrationMappings) {
      const legacyValue = this.getNestedProperty(legacyConfigs.analysis || {}, mapping.legacyPath);
      const enterpriseValue = this.getNestedProperty(mergedConfig, mapping.enterprisePath);

      if (legacyValue !== undefined && enterpriseValue !== undefined && legacyValue !== enterpriseValue) {
        const conflict: ConfigConflict = {
          path: mapping.enterprisePath,
          legacyValue,
          enterpriseValue,
          resolution: mapping.conflicts || conflictResolution,
          rationale: `Legacy value differs from enterprise default`
        };

        conflicts.push(conflict);

        // Apply resolution strategy
        switch (conflict.resolution) {
          case 'legacy_wins':
            this.setNestedProperty(mergedConfig, mapping.enterprisePath, 
              mapping.transformer ? mapping.transformer(legacyValue) : legacyValue);
            break;
          case 'enterprise_wins':
            // Keep enterprise value (no change needed)
            break;
          case 'merge':
            if (typeof legacyValue === 'object' && typeof enterpriseValue === 'object') {
              const merged = { ...enterpriseValue, ...legacyValue };
              this.setNestedProperty(mergedConfig, mapping.enterprisePath, merged);
            } else {
              // For non-objects, prefer legacy value in merge mode
              this.setNestedProperty(mergedConfig, mapping.enterprisePath,
                mapping.transformer ? mapping.transformer(legacyValue) : legacyValue);
            }
            break;
        }
      }
    }

    return { mergedConfig, conflicts };
  }

  /**
   * Create backup of legacy configuration files
   */
  private async createLegacyBackup(
    legacyConfigs: { detector: LegacyDetectorConfig | null; analysis: LegacyAnalysisConfig | null }
  ): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = `config/backups/legacy-${timestamp}`;

    try {
      await fs.mkdir(backupDir, { recursive: true });

      if (legacyConfigs.detector) {
        await fs.writeFile(
          path.join(backupDir, 'detector_config.yaml'),
          yaml.dump(legacyConfigs.detector)
        );
      }

      if (legacyConfigs.analysis) {
        await fs.writeFile(
          path.join(backupDir, 'analysis_config.yaml'),
          yaml.dump(legacyConfigs.analysis)
        );
      }

      return backupDir;
    } catch (error) {
      throw new Error(`Failed to create legacy backup: ${error.message}`);
    }
  }

  /**
   * Load YAML file
   */
  private async loadYamlFile(filePath: string): Promise<any> {
    const content = await fs.readFile(filePath, 'utf-8');
    return yaml.load(content);
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
   * Validate backward compatibility
   */
  async validateBackwardCompatibility(
    enterpriseConfig: EnterpriseConfig,
    legacyConfigPaths: { detector?: string; analysis?: string }
  ): Promise<{ isCompatible: boolean; issues: string[] }> {
    const issues: string[] = [];
    let isCompatible = true;

    try {
      const legacyConfigs = await this.loadLegacyConfigs(
        legacyConfigPaths.detector,
        legacyConfigPaths.analysis
      );

      // Check if enterprise settings conflict with critical legacy settings
      if (legacyConfigs.analysis) {
        // Check file size limits
        const legacyMaxSize = legacyConfigs.analysis.analysis.max_file_size_mb;
        const enterpriseMaxSize = enterpriseConfig.performance.resource_limits.max_file_size_mb;
        
        if (enterpriseMaxSize < legacyMaxSize) {
          issues.push(`Enterprise max file size (${enterpriseMaxSize}MB) is smaller than legacy setting (${legacyMaxSize}MB)`);
          isCompatible = false;
        }

        // Check analysis timeout
        const legacyTimeout = legacyConfigs.analysis.analysis.max_analysis_time_seconds;
        const enterpriseTimeout = enterpriseConfig.performance.resource_limits.max_analysis_time_seconds;
        
        if (enterpriseTimeout < legacyTimeout) {
          issues.push(`Enterprise analysis timeout (${enterpriseTimeout}s) is shorter than legacy setting (${legacyTimeout}s)`);
          isCompatible = false;
        }
      }

      // Check if legacy integration settings are preserved
      if (!enterpriseConfig.legacy_integration?.preserve_existing_configs) {
        issues.push('Legacy configuration preservation is disabled');
        isCompatible = false;
      }

    } catch (error) {
      issues.push(`Failed to validate backward compatibility: ${error.message}`);
      isCompatible = false;
    }

    return { isCompatible, issues };
  }

  /**
   * Get migration status summary
   */
  getMigrationStatus(): {
    legacyConfigsLoaded: boolean;
    detectorConfigValid: boolean;
    analysisConfigValid: boolean;
    migrationMappingsCount: number;
  } {
    return {
      legacyConfigsLoaded: this.legacyDetectorConfig !== null || this.legacyAnalysisConfig !== null,
      detectorConfigValid: this.legacyDetectorConfig !== null,
      analysisConfigValid: this.legacyAnalysisConfig !== null,
      migrationMappingsCount: this.migrationMappings.length
    };
  }
}

export default BackwardCompatibilityManager;