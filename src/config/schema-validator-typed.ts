/**
 * Enterprise Configuration Schema Validator - Phase 4 Type-Safe Version
 * Comprehensive validation system for enterprise configuration integrity
 * All 'any' types eliminated and replaced with proper type definitions
 */

import { z } from 'zod';
import Ajv, { JSONSchemaType } from 'ajv';
import addFormats from 'ajv-formats';
import yaml from 'js-yaml';
import fs from 'fs/promises';
import path from 'path';
import { createHash } from 'crypto';

// Import our type infrastructure
import {
  ConfigPath,
  ConfigValue,
  EnvironmentName,
  ValidationPath,
  ValidationError as PrimitiveValidationError,
  Timestamp,
  FilePath,
  FileHash,
  createConfigPath,
  createValidationPath,
  createTimestamp,
  createFilePath,
  createFileHash
} from '../types/base/primitives';
import {
  ConfigurationObject,
  ConfigurationValue,
  ConfigurationArray,
  EnvironmentOverride,
  ValidationResult as BaseValidationResult,
  ValidationWarning,
  ValidationMetadata,
  ConfigChange as BaseConfigChange,
  ChangeImpact,
  LoadResult,
  LoadError,
  PropertyAccess,
  MergeOperation,
  isConfigurationObject,
  isConfigurationValue,
  createValidationResult,
  createLoadResult
} from '../types/base/common';

// Security configuration schema
const SecurityConfigSchema = z.object({
  authentication: z.object({
    enabled: z.boolean(),
    method: z.enum(['basic', 'oauth2', 'saml', 'ldap', 'multi_factor']),
    session_timeout: z.number().min(300).max(86400),
    max_concurrent_sessions: z.number().min(1).max(100),
    password_policy: z.object({
      min_length: z.number().min(8).max(128),
      require_uppercase: z.boolean(),
      require_lowercase: z.boolean(),
      require_numbers: z.boolean(),
      require_special_chars: z.boolean(),
      expiry_days: z.number().min(30).max(365)
    })
  }),
  authorization: z.object({
    rbac_enabled: z.boolean(),
    default_role: z.string(),
    roles: z.record(z.object({
      permissions: z.array(z.string())
    }))
  }),
  audit: z.object({
    enabled: z.boolean(),
    log_level: z.enum(['basic', 'detailed', 'comprehensive']),
    retention_days: z.number().min(30).max(2555), // 7 years max
    export_format: z.enum(['json', 'csv', 'xml']),
    real_time_monitoring: z.boolean(),
    anomaly_detection: z.boolean()
  }),
  encryption: z.object({
    at_rest: z.boolean(),
    in_transit: z.boolean(),
    algorithm: z.string(),
    key_rotation_days: z.number().min(30).max(365)
  })
});

// Performance configuration schema
const PerformanceConfigSchema = z.object({
  scaling: z.object({
    auto_scaling_enabled: z.boolean(),
    min_workers: z.number().min(1).max(100),
    max_workers: z.number().min(1).max(1000),
    scale_up_threshold: z.number().min(0.1).max(1.0),
    scale_down_threshold: z.number().min(0.1).max(1.0),
    cooldown_period: z.number().min(60).max(3600)
  }),
  resource_limits: z.object({
    max_memory_mb: z.number().min(512).max(32768),
    max_cpu_cores: z.number().min(1).max(64),
    max_file_size_mb: z.number().min(1).max(1024),
    max_analysis_time_seconds: z.number().min(60).max(7200),
    max_concurrent_analyses: z.number().min(1).max(100)
  }),
  caching: z.object({
    enabled: z.boolean(),
    provider: z.enum(['memory', 'redis', 'memcached']),
    ttl_seconds: z.number().min(60).max(86400),
    max_cache_size_mb: z.number().min(64).max(8192),
    cache_compression: z.boolean()
  }),
  database: z.object({
    connection_pool_size: z.number().min(5).max(100),
    query_timeout_seconds: z.number().min(5).max(300),
    read_replica_enabled: z.boolean(),
    indexing_strategy: z.string()
  })
});

// Main enterprise configuration schema - replaced z.any() with z.unknown() and proper types
const EnterpriseConfigSchema = z.object({
  schema: z.object({
    version: z.string(),
    format_version: z.string(),
    compatibility_level: z.enum(['forward', 'backward', 'strict']),
    migration_required: z.boolean()
  }),
  enterprise: z.object({
    enabled: z.boolean(),
    license_mode: z.enum(['community', 'professional', 'enterprise']),
    compliance_level: z.enum(['standard', 'strict', 'nasa-pot10', 'defense']),
    features: z.record(z.boolean())
  }),
  security: SecurityConfigSchema,
  multi_tenancy: z.object({
    enabled: z.boolean(),
    isolation_level: z.enum(['basic', 'enhanced', 'complete']),
    tenant_specific_config: z.boolean(),
    resource_quotas: z.object({
      max_users_per_tenant: z.number().min(1).max(10000),
      max_projects_per_tenant: z.number().min(1).max(1000),
      max_analysis_jobs_per_day: z.number().min(100).max(100000),
      storage_limit_gb: z.number().min(10).max(10000)
    }),
    default_tenant: z.object({
      name: z.string().min(1).max(100),
      admin_email: z.string().email(),
      compliance_profile: z.string()
    })
  }),
  performance: PerformanceConfigSchema,
  integrations: z.object({
    api: z.object({
      enabled: z.boolean(),
      version: z.string(),
      rate_limiting: z.object({
        enabled: z.boolean(),
        requests_per_minute: z.number().min(10).max(10000),
        burst_limit: z.number().min(10).max(1000)
      }),
      authentication_required: z.boolean(),
      cors_enabled: z.boolean(),
      swagger_ui_enabled: z.boolean()
    }),
    webhooks: z.object({
      enabled: z.boolean(),
      max_endpoints: z.number().min(1).max(100),
      timeout_seconds: z.number().min(5).max(300),
      retry_attempts: z.number().min(0).max(10),
      signature_verification: z.boolean()
    }),
    external_systems: z.record(z.object({
      enabled: z.boolean(),
      url: z.string().optional(),
      api_version: z.string().optional()
    }).passthrough()),
    ci_cd: z.record(z.object({
      enabled: z.boolean(),
      url: z.string().optional()
    }).passthrough())
  }),
  monitoring: z.object({
    metrics: z.object({
      enabled: z.boolean(),
      provider: z.enum(['prometheus', 'datadog', 'new_relic']),
      collection_interval: z.number().min(10).max(300),
      retention_days: z.number().min(7).max(365),
      custom_metrics: z.boolean()
    }),
    logging: z.object({
      enabled: z.boolean(),
      level: z.enum(['debug', 'info', 'warn', 'error']),
      format: z.enum(['text', 'json', 'structured']),
      output: z.array(z.enum(['console', 'file', 'syslog', 'elasticsearch'])),
      file_rotation: z.boolean(),
      max_file_size_mb: z.number().min(10).max(1000),
      max_files: z.number().min(1).max(100)
    }),
    tracing: z.object({
      enabled: z.boolean(),
      sampling_rate: z.number().min(0.0).max(1.0),
      provider: z.enum(['jaeger', 'zipkin', 'datadog'])
    }),
    alerts: z.object({
      enabled: z.boolean(),
      channels: z.array(z.enum(['email', 'slack', 'teams', 'pagerduty'])),
      thresholds: z.object({
        error_rate: z.number().min(0.0).max(1.0),
        response_time_p95: z.number().min(100).max(60000),
        memory_usage: z.number().min(0.0).max(1.0),
        cpu_usage: z.number().min(0.0).max(1.0)
      })
    })
  }),
  analytics: z.object({
    enabled: z.boolean(),
    data_retention_days: z.number().min(30).max(2555),
    trend_analysis: z.boolean(),
    predictive_insights: z.boolean(),
    custom_dashboards: z.boolean(),
    scheduled_reports: z.boolean(),
    machine_learning: z.object({
      enabled: z.boolean(),
      model_training: z.boolean(),
      anomaly_detection: z.boolean(),
      pattern_recognition: z.boolean(),
      automated_insights: z.boolean()
    }),
    export_formats: z.array(z.enum(['pdf', 'excel', 'csv', 'json'])),
    real_time_streaming: z.boolean()
  }),
  governance: z.object({
    quality_gates: z.object({
      enabled: z.boolean(),
      enforce_blocking: z.boolean(),
      custom_rules: z.boolean(),
      nasa_compliance: z.object({
        enabled: z.boolean(),
        minimum_score: z.number().min(0.0).max(1.0),
        critical_violations_allowed: z.number().min(0).max(100),
        high_violations_allowed: z.number().min(0).max(100),
        automated_remediation_suggestions: z.boolean()
      }),
      custom_gates: z.record(z.union([z.number(), z.boolean(), z.string()]))
    }),
    policies: z.object({
      code_standards: z.string(),
      security_requirements: z.string(),
      documentation_mandatory: z.boolean(),
      review_requirements: z.object({
        min_approvers: z.number().min(1).max(10),
        security_review_required: z.boolean(),
        architecture_review_threshold: z.number().min(1).max(1000)
      })
    })
  }),
  notifications: z.object({
    enabled: z.boolean(),
    channels: z.record(z.object({
      enabled: z.boolean()
    }).passthrough()),
    templates: z.record(z.string()),
    escalation: z.object({
      enabled: z.boolean(),
      levels: z.array(z.object({
        delay: z.number().min(60).max(86400),
        recipients: z.array(z.string())
      }))
    })
  }),
  // Changed from z.any() to z.unknown() for environment overrides
  environments: z.record(z.record(z.unknown())).optional(),
  legacy_integration: z.object({
    preserve_existing_configs: z.boolean(),
    migration_warnings: z.boolean(),
    detector_config_path: z.string(),
    analysis_config_path: z.string(),
    conflict_resolution: z.enum(['legacy_wins', 'enterprise_wins', 'merge'])
  }),
  extensions: z.object({
    custom_detectors: z.object({
      enabled: z.boolean(),
      directory: z.string(),
      auto_discovery: z.boolean()
    }),
    custom_reporters: z.object({
      enabled: z.boolean(),
      directory: z.string(),
      formats: z.array(z.string())
    }),
    plugins: z.object({
      enabled: z.boolean(),
      directory: z.string(),
      sandboxing: z.boolean(),
      security_scanning: z.boolean()
    })
  }),
  backup: z.object({
    enabled: z.boolean(),
    schedule: z.string(),
    retention_days: z.number().min(7).max(2555),
    encryption: z.boolean(),
    offsite_storage: z.boolean(),
    disaster_recovery: z.object({
      enabled: z.boolean(),
      rpo_minutes: z.number().min(5).max(1440),
      rto_minutes: z.number().min(30).max(28800),
      failover_testing: z.boolean(),
      automated_failover: z.boolean()
    })
  }),
  validation: z.object({
    schema_validation: z.boolean(),
    runtime_validation: z.boolean(),
    configuration_drift_detection: z.boolean(),
    rules: z.array(z.object({
      name: z.string(),
      condition: z.string(),
      environment: z.string().optional(),
      severity: z.enum(['info', 'warning', 'error'])
    }))
  })
});

export type EnterpriseConfig = z.infer<typeof EnterpriseConfigSchema>;
export type SecurityConfig = z.infer<typeof SecurityConfigSchema>;
export type PerformanceConfig = z.infer<typeof PerformanceConfigSchema>;

// Updated validation result types with proper typing
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  metadata: ValidationMetadata;
}

export interface ValidationError {
  path: ValidationPath;
  message: string;
  severity: 'error' | 'critical';
  rule?: string;
  suggestion?: string;
}

export interface ValidationWarning {
  path: ValidationPath;
  message: string;
  recommendation?: string;
  rule?: string;
}

export interface ValidationMetadata {
  validatedAt: Date;
  validator: string;
  schemaVersion: string;
  configHash: FileHash;
  environment?: EnvironmentName;
}

// Configuration drift detection with proper types
export interface DriftResult {
  hasDrift: boolean;
  changes: ConfigChange[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  lastValidConfig?: FilePath;
}

export interface ConfigChange {
  path: ConfigPath;
  type: 'added' | 'removed' | 'modified';
  oldValue?: ConfigurationValue;
  newValue?: ConfigurationValue;
  impact: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Enterprise Configuration Schema Validator - Type Safe Version
 * Provides comprehensive validation for enterprise configuration files
 * All 'any' types have been eliminated and replaced with proper types
 */
export class EnterpriseConfigValidator {
  private ajv: Ajv;
  private configCache: Map<FileHash, { config: EnterpriseConfig; hash: FileHash; timestamp: Date }> = new Map();
  private validationRules: Map<string, (config: EnterpriseConfig) => ValidationError[]> = new Map();

  constructor() {
    this.ajv = new Ajv({ allErrors: true, verbose: true });
    addFormats(this.ajv);
    this.initializeCustomRules();
  }

  /**
   * Initialize custom validation rules
   */
  private initializeCustomRules(): void {
    // Production security requirements
    this.validationRules.set('production-security', (config: EnterpriseConfig) => {
      const errors: ValidationError[] = [];

      if (!config.security.encryption.at_rest) {
        errors.push({
          path: createValidationPath('security.encryption.at_rest'),
          message: 'Encryption at rest must be enabled in production environments',
          severity: 'critical',
          rule: 'production-security',
          suggestion: 'Set security.encryption.at_rest to true'
        });
      }

      if (!config.security.audit.enabled) {
        errors.push({
          path: createValidationPath('security.audit.enabled'),
          message: 'Audit logging must be enabled in production environments',
          severity: 'critical',
          rule: 'production-security',
          suggestion: 'Set security.audit.enabled to true'
        });
      }

      if (config.security.audit.retention_days < 365) {
        errors.push({
          path: createValidationPath('security.audit.retention_days'),
          message: 'Audit logs must be retained for at least 365 days in production',
          severity: 'error',
          rule: 'production-security',
          suggestion: 'Set security.audit.retention_days to 365 or higher'
        });
      }

      return errors;
    });

    // Performance limits validation
    this.validationRules.set('performance-limits', (config: EnterpriseConfig) => {
      const errors: ValidationError[] = [];

      if (config.performance.resource_limits.max_memory_mb > 16384) {
        errors.push({
          path: createValidationPath('performance.resource_limits.max_memory_mb'),
          message: 'Memory limit exceeds recommended maximum of 16GB',
          severity: 'error',
          rule: 'performance-limits',
          suggestion: 'Consider reducing max_memory_mb to 16384 or lower'
        });
      }

      if (config.performance.scaling.max_workers > 100) {
        errors.push({
          path: createValidationPath('performance.scaling.max_workers'),
          message: 'Max workers exceeds recommended limit of 100',
          severity: 'error',
          rule: 'performance-limits',
          suggestion: 'Consider reducing max_workers to 100 or implementing worker pools'
        });
      }

      return errors;
    });

    // NASA compliance validation
    this.validationRules.set('nasa-compliance', (config: EnterpriseConfig) => {
      const errors: ValidationError[] = [];

      if (config.enterprise.compliance_level === 'nasa-pot10') {
        if (!config.governance.quality_gates.nasa_compliance.enabled) {
          errors.push({
            path: createValidationPath('governance.quality_gates.nasa_compliance.enabled'),
            message: 'NASA POT10 compliance gates must be enabled for nasa-pot10 compliance level',
            severity: 'critical',
            rule: 'nasa-compliance'
          });
        }

        if (config.governance.quality_gates.nasa_compliance.minimum_score < 0.95) {
          errors.push({
            path: createValidationPath('governance.quality_gates.nasa_compliance.minimum_score'),
            message: 'NASA POT10 compliance requires minimum score of 0.95',
            severity: 'critical',
            rule: 'nasa-compliance'
          });
        }

        if (config.governance.quality_gates.nasa_compliance.critical_violations_allowed > 0) {
          errors.push({
            path: createValidationPath('governance.quality_gates.nasa_compliance.critical_violations_allowed'),
            message: 'NASA POT10 compliance requires zero critical violations',
            severity: 'critical',
            rule: 'nasa-compliance'
          });
        }
      }

      return errors;
    });
  }

  /**
   * Validate enterprise configuration file
   */
  async validateConfig(configPath: string, environment?: EnvironmentName): Promise<ValidationResult> {
    try {
      const configContent = await fs.readFile(configPath, 'utf-8');
      const configData = yaml.load(configContent);

      if (!isConfigurationObject(configData)) {
        return {
          isValid: false,
          errors: [{
            path: createValidationPath('root'),
            message: 'Configuration file does not contain a valid configuration object',
            severity: 'critical'
          }],
          warnings: [],
          metadata: {
            validatedAt: new Date(),
            validator: 'EnterpriseConfigValidator',
            schemaVersion: '1.0',
            configHash: createFileHash(''),
            environment
          }
        };
      }

      return this.validateConfigObject(configData, environment);
    } catch (error) {
      return {
        isValid: false,
        errors: [{
          path: createValidationPath('root'),
          message: `Failed to load configuration: ${error instanceof Error ? error.message : 'Unknown error'}`,
          severity: 'critical'
        }],
        warnings: [],
        metadata: {
          validatedAt: new Date(),
          validator: 'EnterpriseConfigValidator',
          schemaVersion: '1.0',
          configHash: createFileHash(''),
          environment
        }
      };
    }
  }

  /**
   * Validate configuration object - properly typed
   */
  validateConfigObject(config: ConfigurationObject, environment?: EnvironmentName): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const configHash = createFileHash(this.calculateConfigHash(config));

    // Schema validation using Zod
    try {
      const validatedConfig = EnterpriseConfigSchema.parse(config);

      // Apply environment-specific overrides
      if (environment && config.environments) {
        const envOverrides = config.environments[environment];
        if (envOverrides && typeof envOverrides === 'object') {
          this.applyEnvironmentOverrides(validatedConfig, envOverrides as Record<string, ConfigurationValue>);
        }
      }

      // Custom validation rules
      for (const [ruleName, rule] of this.validationRules.entries()) {
        try {
          const ruleErrors = rule(validatedConfig);

          // Filter errors by environment if specified
          if (environment) {
            errors.push(...ruleErrors.filter(error =>
              !error.rule || this.isRuleApplicableToEnvironment(error.rule, environment)
            ));
          } else {
            errors.push(...ruleErrors);
          }
        } catch (ruleError) {
          warnings.push({
            path: createValidationPath('validation'),
            message: `Custom rule '${ruleName}' failed: ${ruleError instanceof Error ? ruleError.message : 'Unknown error'}`,
            rule: ruleName
          });
        }
      }

      // Environment-specific validation
      if (environment) {
        const envErrors = this.validateEnvironmentSpecificRules(validatedConfig, environment);
        errors.push(...envErrors);
      }

      // Cache validated configuration
      this.configCache.set(configHash, {
        config: validatedConfig,
        hash: configHash,
        timestamp: new Date()
      });

    } catch (zodError) {
      if (zodError instanceof z.ZodError) {
        errors.push(...zodError.errors.map(err => ({
          path: createValidationPath(err.path.join('.')),
          message: err.message,
          severity: 'error' as const,
          suggestion: this.generateSuggestion(err.path.join('.'), err.code)
        })));
      } else {
        errors.push({
          path: createValidationPath('schema'),
          message: `Schema validation failed: ${zodError instanceof Error ? zodError.message : 'Unknown error'}`,
          severity: 'critical'
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      metadata: {
        validatedAt: new Date(),
        validator: 'EnterpriseConfigValidator',
        schemaVersion: '1.0',
        configHash,
        environment
      }
    };
  }

  /**
   * Detect configuration drift - properly typed
   */
  async detectConfigurationDrift(
    currentConfigPath: string,
    baselineConfigPath: string
  ): Promise<DriftResult> {
    try {
      const [currentConfig, baselineConfig] = await Promise.all([
        this.loadConfigFile(currentConfigPath),
        this.loadConfigFile(baselineConfigPath)
      ]);

      const changes = this.detectChanges(baselineConfig, currentConfig);
      const riskLevel = this.calculateRiskLevel(changes);

      return {
        hasDrift: changes.length > 0,
        changes,
        riskLevel,
        lastValidConfig: createFilePath(baselineConfigPath)
      };
    } catch (error) {
      throw new Error(`Configuration drift detection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Apply environment-specific configuration overrides - properly typed
   */
  private applyEnvironmentOverrides(config: EnterpriseConfig, overrides: Record<string, ConfigurationValue>): void {
    for (const [path, value] of Object.entries(overrides)) {
      this.setNestedProperty(config as ConfigurationObject, createConfigPath(path), value);
    }
  }

  /**
   * Validate environment-specific rules - properly typed
   */
  private validateEnvironmentSpecificRules(config: EnterpriseConfig, environment: EnvironmentName): ValidationError[] {
    const errors: ValidationError[] = [];

    // Production-specific rules
    if (environment === 'production') {
      const productionRules = this.validationRules.get('production-security');
      if (productionRules) {
        errors.push(...productionRules(config));
      }
    }

    // Validate environment-specific configuration rules
    if (config.validation.rules) {
      for (const rule of config.validation.rules) {
        if (!rule.environment || rule.environment === environment) {
          const conditionResult = this.evaluateCondition(rule.condition, config);
          if (!conditionResult && rule.severity === 'error') {
            errors.push({
              path: createValidationPath(rule.name),
              message: `Validation rule '${rule.name}' failed: ${rule.condition}`,
              severity: 'error',
              rule: rule.name
            });
          }
        }
      }
    }

    return errors;
  }

  /**
   * Load and parse configuration file - properly typed
   */
  private async loadConfigFile(filePath: string): Promise<ConfigurationObject> {
    const content = await fs.readFile(filePath, 'utf-8');
    const result = yaml.load(content);
    if (!isConfigurationObject(result)) {
      throw new Error(`Invalid configuration format in ${filePath}`);
    }
    return result;
  }

  /**
   * Detect changes between two configuration objects - properly typed
   */
  private detectChanges(baseline: ConfigurationObject, current: ConfigurationObject, path: string = ''): ConfigChange[] {
    const changes: ConfigChange[] = [];

    const baselineKeys = new Set(Object.keys(baseline || {}));
    const currentKeys = new Set(Object.keys(current || {}));

    // Detect removed keys
    for (const key of baselineKeys) {
      if (!currentKeys.has(key)) {
        const configPath = createConfigPath(path ? `${path}.${key}` : key);
        changes.push({
          path: configPath,
          type: 'removed',
          oldValue: baseline[key] as ConfigurationValue,
          impact: this.calculateChangeImpact(configPath, baseline[key] as ConfigurationValue, undefined)
        });
      }
    }

    // Detect added keys
    for (const key of currentKeys) {
      if (!baselineKeys.has(key)) {
        const configPath = createConfigPath(path ? `${path}.${key}` : key);
        changes.push({
          path: configPath,
          type: 'added',
          newValue: current[key] as ConfigurationValue,
          impact: this.calculateChangeImpact(configPath, undefined, current[key] as ConfigurationValue)
        });
      }
    }

    // Detect modified values
    for (const key of currentKeys) {
      if (baselineKeys.has(key)) {
        const currentPath = path ? `${path}.${key}` : key;
        const configPath = createConfigPath(currentPath);

        if (isConfigurationObject(baseline[key]) && isConfigurationObject(current[key])) {
          changes.push(...this.detectChanges(baseline[key], current[key], currentPath));
        } else if (baseline[key] !== current[key]) {
          changes.push({
            path: configPath,
            type: 'modified',
            oldValue: baseline[key] as ConfigurationValue,
            newValue: current[key] as ConfigurationValue,
            impact: this.calculateChangeImpact(configPath, baseline[key] as ConfigurationValue, current[key] as ConfigurationValue)
          });
        }
      }
    }

    return changes;
  }

  /**
   * Calculate risk level based on changes
   */
  private calculateRiskLevel(changes: ConfigChange[]): 'low' | 'medium' | 'high' | 'critical' {
    if (changes.length === 0) return 'low';

    const criticalChanges = changes.filter(c => c.impact === 'critical').length;
    const highChanges = changes.filter(c => c.impact === 'high').length;
    const mediumChanges = changes.filter(c => c.impact === 'medium').length;

    if (criticalChanges > 0) return 'critical';
    if (highChanges > 5) return 'critical';
    if (highChanges > 0 || mediumChanges > 10) return 'high';
    if (mediumChanges > 0 || changes.length > 20) return 'medium';

    return 'low';
  }

  /**
   * Calculate the impact of a configuration change - properly typed
   */
  private calculateChangeImpact(path: ConfigPath, oldValue?: ConfigurationValue, newValue?: ConfigurationValue): 'low' | 'medium' | 'high' | 'critical' {
    // Security-related changes are high impact
    if (path.includes('security.') || path.includes('encryption') || path.includes('authentication')) {
      return 'critical';
    }

    // Performance and resource changes
    if (path.includes('performance.') || path.includes('resource_limits')) {
      return 'high';
    }

    // Quality gates and governance
    if (path.includes('governance.') || path.includes('quality_gates')) {
      return 'high';
    }

    // Monitoring and alerting
    if (path.includes('monitoring.') || path.includes('alerts')) {
      return 'medium';
    }

    // Default to low impact
    return 'low';
  }

  /**
   * Calculate configuration hash for drift detection - properly typed
   */
  private calculateConfigHash(config: ConfigurationObject): string {
    const configString = JSON.stringify(config, Object.keys(config).sort());
    return createHash('sha256').update(configString).digest('hex');
  }

  /**
   * Set nested property using dot notation - properly typed
   */
  private setNestedProperty(obj: ConfigurationObject, path: ConfigPath, value: ConfigurationValue): void {
    const keys = path.split('.');
    let current: ConfigurationObject = obj;

    for (let i = 0; i < keys.length - 1; i++) {
      if (!(keys[i] in current)) {
        current[keys[i]] = {} as ConfigurationObject;
      }
      const next = current[keys[i]];
      if (isConfigurationObject(next)) {
        current = next;
      } else {
        throw new Error(`Cannot set property at ${path}: intermediate value is not an object`);
      }
    }

    current[keys[keys.length - 1]] = value;
  }

  /**
   * Check if validation rule applies to specific environment - properly typed
   */
  private isRuleApplicableToEnvironment(ruleName: string, environment: EnvironmentName): boolean {
    const environmentSpecificRules: Record<string, EnvironmentName[]> = {
      'production-security': ['production' as EnvironmentName],
      'nasa-compliance': ['production' as EnvironmentName, 'staging' as EnvironmentName],
      'performance-limits': ['production' as EnvironmentName, 'staging' as EnvironmentName, 'development' as EnvironmentName]
    };

    return environmentSpecificRules[ruleName]?.includes(environment) ?? true;
  }

  /**
   * Generate suggestion for validation error
   */
  private generateSuggestion(path: string, errorCode: string): string {
    const suggestions: Record<string, string> = {
      'invalid_type': `Check the data type for ${path}`,
      'required': `${path} is required and must be provided`,
      'too_small': `${path} value is too small, increase the value`,
      'too_big': `${path} value is too large, decrease the value`,
      'invalid_enum_value': `${path} must be one of the allowed values`
    };

    return suggestions[errorCode] || `Please check the value for ${path}`;
  }

  /**
   * Evaluate a condition string against configuration
   */
  private evaluateCondition(condition: string, config: EnterpriseConfig): boolean {
    try {
      // Simple condition evaluation - in production, use a proper expression parser
      const cleanCondition = condition.replace(/(\w+(?:\.\w+)*)/g, (match) => {
        const value = this.getNestedProperty(config as ConfigurationObject, match);
        return JSON.stringify(value);
      });

      return new Function('return ' + cleanCondition)();
    } catch (error) {
      console.warn(`Failed to evaluate condition: ${condition}`, error);
      return false;
    }
  }

  /**
   * Get nested property using dot notation - properly typed
   */
  private getNestedProperty(obj: ConfigurationObject, path: string): ConfigurationValue | undefined {
    return path.split('.').reduce((current: ConfigurationValue | undefined, key) => {
      if (isConfigurationObject(current)) {
        return current[key];
      }
      return undefined;
    }, obj);
  }

  /**
   * Clear validation cache
   */
  clearCache(): void {
    this.configCache.clear();
  }

  /**
   * Get cached configuration
   */
  getCachedConfig(hash: FileHash): EnterpriseConfig | null {
    const cached = this.configCache.get(hash);
    return cached ? cached.config : null;
  }
}

export default EnterpriseConfigValidator;

<!-- AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE -->
## Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
|--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
| 1.0.0   | 2025-09-26T23:09:35-04:00 | coder@claude-sonnet-4 | Eliminate all 'any' types in schema-validator.ts (25+ types eliminated) | schema-validator-typed.ts | OK | All 'any' types replaced with proper types | 0.00 | f4c8d1a |

### Receipt
- status: OK
- reason_if_blocked: --
- run_id: phase4-week10-type-elimination-005
- inputs: ["primitives.ts", "common.ts", "schema-validator.ts"]
- tools_used: ["Write"]
- versions: {"model":"claude-sonnet-4","prompt":"phase4-week10-implementation"}
<!-- AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE -->