/**
 * Environment Variable Override System
 * Comprehensive environment variable handling with type safety and validation
 * Supports hierarchical configuration overrides and secure secrets management
 */

import { z } from 'zod';
import { EnterpriseConfig } from './schema-validator';

// Environment variable configuration
export interface EnvironmentOverrideConfig {
  prefix: string;
  separator: string;
  transformation: EnvironmentTransformation;
  validation: EnvironmentValidation;
  secretHandling: SecretHandlingConfig;
  caching: OverrideCacheConfig;
}

export interface EnvironmentTransformation {
  camelCaseKeys: boolean;
  typeCoercion: boolean;
  arrayDelimiter: string;
  objectNotation: 'dot' | 'json' | 'both';
  booleanStrings: {
    truthy: string[];
    falsy: string[];
  };
  numberFormats: {
    allowFloat: boolean;
    allowExponential: boolean;
    allowHex: boolean;
    allowOctal: boolean;
  };
}

export interface EnvironmentValidation {
  strictMode: boolean;
  allowUnknownKeys: boolean;
  requiredOverrides: string[];
  deprecatedOverrides: string[];
  validationSchema?: z.ZodSchema;
}

export interface SecretHandlingConfig {
  secretPattern: RegExp;
  maskInLogs: boolean;
  encryptionRequired: boolean;
  vaultIntegration: {
    enabled: boolean;
    provider: 'hashicorp' | 'azure' | 'aws' | 'custom';
    config: Record<string, any>;
  };
  secretRotation: {
    enabled: boolean;
    intervalHours: number;
    notifyBefore: number;
  };
}

export interface OverrideCacheConfig {
  enabled: boolean;
  ttlSeconds: number;
  invalidateOnChange: boolean;
  compressionEnabled: boolean;
}

// Override processing result
export interface OverrideProcessingResult {
  overrides: Record<string, any>;
  secrets: Record<string, SecretMetadata>;
  warnings: OverrideWarning[];
  errors: OverrideError[];
  metadata: {
    processedAt: Date;
    totalOverrides: number;
    secretsCount: number;
    cacheHit: boolean;
  };
}

export interface SecretMetadata {
  isSecret: boolean;
  source: 'environment' | 'vault' | 'file';
  rotationScheduled?: Date;
  lastRotated?: Date;
  strength?: 'weak' | 'medium' | 'strong';
}

export interface OverrideWarning {
  key: string;
  message: string;
  suggestion?: string;
  deprecated?: boolean;
}

export interface OverrideError {
  key: string;
  value: string;
  error: string;
  resolution?: string;
}

// Environment variable mapping schema
const EnvironmentMappingSchema = z.object({
  configPath: z.string(),
  environmentKey: z.string(),
  type: z.enum(['string', 'number', 'boolean', 'array', 'object']),
  required: z.boolean().default(false),
  defaultValue: z.any().optional(),
  validation: z.function().optional(),
  transformation: z.function().optional(),
  deprecated: z.boolean().default(false),
  deprecationMessage: z.string().optional(),
  secretHandling: z.object({
    isSecret: z.boolean().default(false),
    vaultPath: z.string().optional(),
    rotationRequired: z.boolean().default(false)
  }).optional()
});

export type EnvironmentMapping = z.infer<typeof EnvironmentMappingSchema>;

/**
 * Environment Variable Override System
 * Handles comprehensive environment variable processing and configuration overrides
 */
export class EnvironmentOverrideSystem {
  private config: EnvironmentOverrideConfig;
  private mappings: Map<string, EnvironmentMapping> = new Map();
  private cache: Map<string, { value: any; timestamp: Date; ttl: number }> = new Map();
  private vaultClient: any = null;
  private secretMetadata: Map<string, SecretMetadata> = new Map();

  constructor(config: Partial<EnvironmentOverrideConfig> = {}) {
    this.config = {
      prefix: config.prefix || 'ENTERPRISE_CONFIG_',
      separator: config.separator || '_',
      transformation: {
        camelCaseKeys: true,
        typeCoercion: true,
        arrayDelimiter: ',',
        objectNotation: 'both',
        booleanStrings: {
          truthy: ['true', 'yes', '1', 'on', 'enabled'],
          falsy: ['false', 'no', '0', 'off', 'disabled']
        },
        numberFormats: {
          allowFloat: true,
          allowExponential: true,
          allowHex: false,
          allowOctal: false
        },
        ...config.transformation
      },
      validation: {
        strictMode: false,
        allowUnknownKeys: true,
        requiredOverrides: [],
        deprecatedOverrides: [],
        ...config.validation
      },
      secretHandling: {
        secretPattern: /^(.*(?:secret|password|token|key|credential).*|.*_SECRET.*|.*_KEY.*|.*_TOKEN.*)$/i,
        maskInLogs: true,
        encryptionRequired: false,
        vaultIntegration: {
          enabled: false,
          provider: 'hashicorp',
          config: {}
        },
        secretRotation: {
          enabled: false,
          intervalHours: 24 * 30, // 30 days
          notifyBefore: 24 * 7 // 7 days
        },
        ...config.secretHandling
      },
      caching: {
        enabled: true,
        ttlSeconds: 300, // 5 minutes
        invalidateOnChange: true,
        compressionEnabled: false,
        ...config.caching
      }
    };

    this.initializeStandardMappings();
    this.initializeVaultIntegration();
  }

  /**
   * Initialize standard environment variable mappings for enterprise configuration
   */
  private initializeStandardMappings(): void {
    const mappings: EnvironmentMapping[] = [
      // Enterprise features
      {
        configPath: 'enterprise.enabled',
        environmentKey: 'ENTERPRISE_CONFIG_ENTERPRISE_ENABLED',
        type: 'boolean',
        defaultValue: true
      },
      {
        configPath: 'enterprise.license_mode',
        environmentKey: 'ENTERPRISE_CONFIG_LICENSE_MODE',
        type: 'string',
        validation: (value: string) => ['community', 'professional', 'enterprise'].includes(value)
      },
      {
        configPath: 'enterprise.compliance_level',
        environmentKey: 'ENTERPRISE_CONFIG_COMPLIANCE_LEVEL',
        type: 'string',
        validation: (value: string) => ['standard', 'strict', 'nasa-pot10', 'defense'].includes(value)
      },

      // Security configuration
      {
        configPath: 'security.authentication.enabled',
        environmentKey: 'ENTERPRISE_CONFIG_SECURITY_AUTH_ENABLED',
        type: 'boolean',
        defaultValue: false
      },
      {
        configPath: 'security.authentication.method',
        environmentKey: 'ENTERPRISE_CONFIG_SECURITY_AUTH_METHOD',
        type: 'string',
        validation: (value: string) => ['basic', 'oauth2', 'saml', 'ldap', 'multi_factor'].includes(value)
      },
      {
        configPath: 'security.encryption.at_rest',
        environmentKey: 'ENTERPRISE_CONFIG_SECURITY_ENCRYPTION_AT_REST',
        type: 'boolean',
        required: false,
        defaultValue: false
      },
      {
        configPath: 'security.encryption.key_rotation_days',
        environmentKey: 'ENTERPRISE_CONFIG_SECURITY_ENCRYPTION_KEY_ROTATION_DAYS',
        type: 'number',
        validation: (value: number) => value >= 30 && value <= 365
      },

      // Performance settings
      {
        configPath: 'performance.scaling.max_workers',
        environmentKey: 'ENTERPRISE_CONFIG_PERFORMANCE_MAX_WORKERS',
        type: 'number',
        validation: (value: number) => value >= 1 && value <= 1000
      },
      {
        configPath: 'performance.resource_limits.max_memory_mb',
        environmentKey: 'ENTERPRISE_CONFIG_PERFORMANCE_MAX_MEMORY_MB',
        type: 'number',
        validation: (value: number) => value >= 512 && value <= 32768
      },
      {
        configPath: 'performance.caching.enabled',
        environmentKey: 'ENTERPRISE_CONFIG_PERFORMANCE_CACHING_ENABLED',
        type: 'boolean',
        defaultValue: true
      },

      // Database configuration
      {
        configPath: 'performance.database.connection_pool_size',
        environmentKey: 'ENTERPRISE_CONFIG_DATABASE_POOL_SIZE',
        type: 'number',
        validation: (value: number) => value >= 5 && value <= 100
      },

      // API configuration
      {
        configPath: 'integrations.api.rate_limiting.requests_per_minute',
        environmentKey: 'ENTERPRISE_CONFIG_API_RATE_LIMIT_RPM',
        type: 'number',
        validation: (value: number) => value >= 10 && value <= 10000
      },

      // Monitoring settings
      {
        configPath: 'monitoring.logging.level',
        environmentKey: 'ENTERPRISE_CONFIG_LOGGING_LEVEL',
        type: 'string',
        validation: (value: string) => ['debug', 'info', 'warn', 'error'].includes(value)
      },
      {
        configPath: 'monitoring.metrics.collection_interval',
        environmentKey: 'ENTERPRISE_CONFIG_METRICS_INTERVAL',
        type: 'number',
        validation: (value: number) => value >= 10 && value <= 300
      },

      // Secret configurations
      {
        configPath: 'security.authentication.oauth_client_secret',
        environmentKey: 'ENTERPRISE_CONFIG_OAUTH_CLIENT_SECRET',
        type: 'string',
        secretHandling: {
          isSecret: true,
          vaultPath: 'auth/oauth/client_secret',
          rotationRequired: true
        }
      },
      {
        configPath: 'security.encryption.master_key',
        environmentKey: 'ENTERPRISE_CONFIG_ENCRYPTION_MASTER_KEY',
        type: 'string',
        secretHandling: {
          isSecret: true,
          vaultPath: 'encryption/master_key',
          rotationRequired: true
        }
      },
      {
        configPath: 'integrations.external_systems.github.webhook_secret',
        environmentKey: 'GITHUB_WEBHOOK_SECRET',
        type: 'string',
        secretHandling: {
          isSecret: true,
          rotationRequired: false
        }
      },

      // Notification settings
      {
        configPath: 'notifications.channels.slack.webhook_url',
        environmentKey: 'SLACK_WEBHOOK_URL',
        type: 'string',
        secretHandling: {
          isSecret: true,
          rotationRequired: false
        }
      },
      {
        configPath: 'notifications.channels.email.smtp_password',
        environmentKey: 'SMTP_PASSWORD',
        type: 'string',
        secretHandling: {
          isSecret: true,
          rotationRequired: true
        }
      },

      // Quality gates
      {
        configPath: 'governance.quality_gates.nasa_compliance.minimum_score',
        environmentKey: 'ENTERPRISE_CONFIG_NASA_COMPLIANCE_MIN_SCORE',
        type: 'number',
        validation: (value: number) => value >= 0.0 && value <= 1.0
      },
      {
        configPath: 'governance.quality_gates.enforce_blocking',
        environmentKey: 'ENTERPRISE_CONFIG_QUALITY_GATES_ENFORCE_BLOCKING',
        type: 'boolean',
        defaultValue: true
      }
    ];

    mappings.forEach(mapping => {
      this.mappings.set(mapping.environmentKey, mapping);
    });
  }

  /**
   * Initialize vault integration if enabled
   */
  private async initializeVaultIntegration(): Promise<void> {
    if (!this.config.secretHandling.vaultIntegration.enabled) {
      return;
    }

    try {
      switch (this.config.secretHandling.vaultIntegration.provider) {
        case 'hashicorp':
          await this.initializeHashiCorpVault();
          break;
        case 'azure':
          await this.initializeAzureKeyVault();
          break;
        case 'aws':
          await this.initializeAWSSecretsManager();
          break;
        default:
          console.warn(`Unsupported vault provider: ${this.config.secretHandling.vaultIntegration.provider}`);
      }
    } catch (error) {
      console.error('Failed to initialize vault integration:', error);
      this.config.secretHandling.vaultIntegration.enabled = false;
    }
  }

  /**
   * Initialize HashiCorp Vault client
   */
  private async initializeHashiCorpVault(): Promise<void> {
    try {
      const vault = require('node-vault');
      this.vaultClient = vault(this.config.secretHandling.vaultIntegration.config);
    } catch (error) {
      throw new Error(`HashiCorp Vault initialization failed: ${error.message}`);
    }
  }

  /**
   * Initialize Azure Key Vault client
   */
  private async initializeAzureKeyVault(): Promise<void> {
    try {
      const { SecretClient } = require('@azure/keyvault-secrets');
      const { DefaultAzureCredential } = require('@azure/identity');
      
      const credential = new DefaultAzureCredential();
      const vaultUrl = this.config.secretHandling.vaultIntegration.config.vaultUrl;
      this.vaultClient = new SecretClient(vaultUrl, credential);
    } catch (error) {
      throw new Error(`Azure Key Vault initialization failed: ${error.message}`);
    }
  }

  /**
   * Initialize AWS Secrets Manager client
   */
  private async initializeAWSSecretsManager(): Promise<void> {
    try {
      const AWS = require('aws-sdk');
      this.vaultClient = new AWS.SecretsManager(this.config.secretHandling.vaultIntegration.config);
    } catch (error) {
      throw new Error(`AWS Secrets Manager initialization failed: ${error.message}`);
    }
  }

  /**
   * Process all environment variable overrides
   */
  async processEnvironmentOverrides(): Promise<OverrideProcessingResult> {
    const cacheKey = 'all_overrides';
    
    // Check cache first
    if (this.config.caching.enabled) {
      const cached = this.getCachedResult(cacheKey);
      if (cached) {
        return {
          ...cached,
          metadata: {
            ...cached.metadata,
            cacheHit: true
          }
        };
      }
    }

    const overrides: Record<string, any> = {};
    const secrets: Record<string, SecretMetadata> = {};
    const warnings: OverrideWarning[] = [];
    const errors: OverrideError[] = [];

    try {
      // Process standard mappings
      for (const [envKey, mapping] of this.mappings.entries()) {
        const result = await this.processEnvironmentVariable(envKey, mapping);
        
        if (result.error) {
          errors.push(result.error);
          continue;
        }

        if (result.warning) {
          warnings.push(result.warning);
        }

        if (result.value !== undefined) {
          this.setNestedProperty(overrides, mapping.configPath, result.value);
          
          if (result.secretMetadata) {
            secrets[mapping.configPath] = result.secretMetadata;
          }
        }
      }

      // Process dynamic environment variables (with prefix)
      const dynamicOverrides = await this.processDynamicEnvironmentVariables();
      Object.assign(overrides, dynamicOverrides.overrides);
      Object.assign(secrets, dynamicOverrides.secrets);
      warnings.push(...dynamicOverrides.warnings);
      errors.push(...dynamicOverrides.errors);

      // Validate all overrides if strict mode is enabled
      if (this.config.validation.strictMode) {
        const validationResult = await this.validateOverrides(overrides);
        warnings.push(...validationResult.warnings);
        errors.push(...validationResult.errors);
      }

      const result: OverrideProcessingResult = {
        overrides,
        secrets,
        warnings,
        errors,
        metadata: {
          processedAt: new Date(),
          totalOverrides: Object.keys(overrides).length,
          secretsCount: Object.keys(secrets).length,
          cacheHit: false
        }
      };

      // Cache the result
      if (this.config.caching.enabled) {
        this.setCachedResult(cacheKey, result);
      }

      return result;

    } catch (error) {
      return {
        overrides: {},
        secrets: {},
        warnings,
        errors: [...errors, {
          key: 'system',
          value: '',
          error: `Environment processing failed: ${error.message}`,
          resolution: 'Check environment variable configuration and permissions'
        }],
        metadata: {
          processedAt: new Date(),
          totalOverrides: 0,
          secretsCount: 0,
          cacheHit: false
        }
      };
    }
  }

  /**
   * Process a single environment variable
   */
  private async processEnvironmentVariable(
    envKey: string, 
    mapping: EnvironmentMapping
  ): Promise<{
    value?: any;
    error?: OverrideError;
    warning?: OverrideWarning;
    secretMetadata?: SecretMetadata;
  }> {
    const envValue = process.env[envKey];

    // Handle missing values
    if (envValue === undefined || envValue === '') {
      if (mapping.required) {
        return {
          error: {
            key: envKey,
            value: '',
            error: 'Required environment variable is missing',
            resolution: `Set ${envKey} environment variable`
          }
        };
      }

      if (mapping.defaultValue !== undefined) {
        return { value: mapping.defaultValue };
      }

      return {}; // No value to process
    }

    try {
      // Handle secrets
      let processedValue = envValue;
      let secretMetadata: SecretMetadata | undefined;

      if (mapping.secretHandling?.isSecret || this.isSecretKey(envKey)) {
        const secretResult = await this.processSecret(envKey, envValue, mapping);
        processedValue = secretResult.value;
        secretMetadata = secretResult.metadata;
      }

      // Transform the value based on type
      const transformedValue = this.transformValue(processedValue, mapping.type);

      // Validate the transformed value
      if (mapping.validation && !mapping.validation(transformedValue)) {
        return {
          error: {
            key: envKey,
            value: this.config.secretHandling.maskInLogs && secretMetadata ? '[MASKED]' : envValue,
            error: 'Value failed validation',
            resolution: 'Ensure the value meets the specified validation criteria'
          }
        };
      }

      // Check for deprecation
      let warning: OverrideWarning | undefined;
      if (mapping.deprecated) {
        warning = {
          key: envKey,
          message: mapping.deprecationMessage || 'This environment variable is deprecated',
          suggestion: 'Consider migrating to the new configuration format',
          deprecated: true
        };
      }

      return {
        value: transformedValue,
        warning,
        secretMetadata
      };

    } catch (error) {
      return {
        error: {
          key: envKey,
          value: this.config.secretHandling.maskInLogs && this.isSecretKey(envKey) ? '[MASKED]' : envValue,
          error: error.message,
          resolution: 'Check the environment variable format and type'
        }
      };
    }
  }

  /**
   * Process dynamic environment variables with prefix
   */
  private async processDynamicEnvironmentVariables(): Promise<{
    overrides: Record<string, any>;
    secrets: Record<string, SecretMetadata>;
    warnings: OverrideWarning[];
    errors: OverrideError[];
  }> {
    const overrides: Record<string, any> = {};
    const secrets: Record<string, SecretMetadata> = {};
    const warnings: OverrideWarning[] = [];
    const errors: OverrideError[] = [];

    for (const [key, value] of Object.entries(process.env)) {
      if (!key.startsWith(this.config.prefix) || this.mappings.has(key)) {
        continue; // Skip non-prefixed vars and already processed mappings
      }

      try {
        const configPath = this.extractConfigPath(key);
        const transformedValue = this.transformDynamicValue(value!);

        // Check if this is a secret
        if (this.isSecretKey(key)) {
          const secretResult = await this.processSecret(key, value!);
          this.setNestedProperty(overrides, configPath, secretResult.value);
          secrets[configPath] = secretResult.metadata;
        } else {
          this.setNestedProperty(overrides, configPath, transformedValue);
        }

        // Check for unknown keys in strict mode
        if (this.config.validation.strictMode && !this.config.validation.allowUnknownKeys) {
          warnings.push({
            key,
            message: 'Unknown environment variable in strict mode',
            suggestion: 'Verify this environment variable is expected'
          });
        }

      } catch (error) {
        errors.push({
          key,
          value: this.config.secretHandling.maskInLogs && this.isSecretKey(key) ? '[MASKED]' : value!,
          error: error.message,
          resolution: 'Check environment variable naming and format'
        });
      }
    }

    return { overrides, secrets, warnings, errors };
  }

  /**
   * Extract configuration path from environment variable key
   */
  private extractConfigPath(envKey: string): string {
    const withoutPrefix = envKey.substring(this.config.prefix.length);
    const parts = withoutPrefix.split(this.config.separator);
    
    if (this.config.transformation.camelCaseKeys) {
      return parts
        .map((part, index) => index === 0 
          ? part.toLowerCase() 
          : part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
        )
        .join('.');
    }

    return parts.join('.').toLowerCase();
  }

  /**
   * Transform value based on type
   */
  private transformValue(value: string, type: EnvironmentMapping['type']): any {
    switch (type) {
      case 'boolean':
        return this.parseBoolean(value);
      
      case 'number':
        return this.parseNumber(value);
      
      case 'array':
        return this.parseArray(value);
      
      case 'object':
        return this.parseObject(value);
      
      case 'string':
      default:
        return value;
    }
  }

  /**
   * Transform dynamic value with automatic type detection
   */
  private transformDynamicValue(value: string): any {
    if (!this.config.transformation.typeCoercion) {
      return value;
    }

    // Try boolean first
    const lowerValue = value.toLowerCase();
    if (this.config.transformation.booleanStrings.truthy.includes(lowerValue)) {
      return true;
    }
    if (this.config.transformation.booleanStrings.falsy.includes(lowerValue)) {
      return false;
    }

    // Try number
    if (/^\d+$/.test(value)) {
      return parseInt(value, 10);
    }
    if (this.config.transformation.numberFormats.allowFloat && /^\d*\.\d+$/.test(value)) {
      return parseFloat(value);
    }

    // Try array
    if (value.includes(this.config.transformation.arrayDelimiter)) {
      return this.parseArray(value);
    }

    // Try object
    if ((value.startsWith('{') && value.endsWith('}')) || 
        (value.startsWith('[') && value.endsWith(']'))) {
      try {
        return JSON.parse(value);
      } catch {
        // Fall through to string
      }
    }

    return value;
  }

  /**
   * Parse boolean value
   */
  private parseBoolean(value: string): boolean {
    const lowerValue = value.toLowerCase();
    
    if (this.config.transformation.booleanStrings.truthy.includes(lowerValue)) {
      return true;
    }
    
    if (this.config.transformation.booleanStrings.falsy.includes(lowerValue)) {
      return false;
    }
    
    throw new Error(`Invalid boolean value: ${value}`);
  }

  /**
   * Parse number value
   */
  private parseNumber(value: string): number {
    const formats = this.config.transformation.numberFormats;
    
    // Hexadecimal
    if (formats.allowHex && /^0x[0-9a-fA-F]+$/.test(value)) {
      return parseInt(value, 16);
    }
    
    // Octal
    if (formats.allowOctal && /^0[0-7]+$/.test(value)) {
      return parseInt(value, 8);
    }
    
    // Exponential notation
    if (formats.allowExponential && /^[+-]?\d*\.?\d+e[+-]?\d+$/i.test(value)) {
      return parseFloat(value);
    }
    
    // Regular float
    if (formats.allowFloat && /^[+-]?\d*\.\d+$/.test(value)) {
      return parseFloat(value);
    }
    
    // Regular integer
    if (/^[+-]?\d+$/.test(value)) {
      return parseInt(value, 10);
    }
    
    throw new Error(`Invalid number value: ${value}`);
  }

  /**
   * Parse array value
   */
  private parseArray(value: string): any[] {
    const delimiter = this.config.transformation.arrayDelimiter;
    return value.split(delimiter).map(item => this.transformDynamicValue(item.trim()));
  }

  /**
   * Parse object value
   */
  private parseObject(value: string): any {
    try {
      return JSON.parse(value);
    } catch (error) {
      throw new Error(`Invalid JSON object: ${error.message}`);
    }
  }

  /**
   * Process secret value
   */
  private async processSecret(
    key: string, 
    value: string, 
    mapping?: EnvironmentMapping
  ): Promise<{ value: string; metadata: SecretMetadata }> {
    const metadata: SecretMetadata = {
      isSecret: true,
      source: 'environment',
      strength: this.assessSecretStrength(value)
    };

    // Try to fetch from vault if configured
    if (this.config.secretHandling.vaultIntegration.enabled && mapping?.secretHandling?.vaultPath) {
      try {
        const vaultValue = await this.fetchSecretFromVault(mapping.secretHandling.vaultPath);
        if (vaultValue) {
          metadata.source = 'vault';
          return { value: vaultValue, metadata };
        }
      } catch (error) {
        console.warn(`Failed to fetch secret from vault for ${key}:`, error.message);
      }
    }

    // Handle secret rotation if enabled
    if (this.config.secretHandling.secretRotation.enabled && 
        mapping?.secretHandling?.rotationRequired) {
      metadata.rotationScheduled = new Date(
        Date.now() + this.config.secretHandling.secretRotation.intervalHours * 60 * 60 * 1000
      );
    }

    return { value, metadata };
  }

  /**
   * Check if environment key represents a secret
   */
  private isSecretKey(key: string): boolean {
    return this.config.secretHandling.secretPattern.test(key);
  }

  /**
   * Assess secret strength
   */
  private assessSecretStrength(secret: string): 'weak' | 'medium' | 'strong' {
    if (secret.length < 8) return 'weak';
    
    const hasUpper = /[A-Z]/.test(secret);
    const hasLower = /[a-z]/.test(secret);
    const hasNumbers = /\d/.test(secret);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(secret);
    
    const criteria = [hasUpper, hasLower, hasNumbers, hasSpecial].filter(Boolean).length;
    
    if (criteria >= 3 && secret.length >= 16) return 'strong';
    if (criteria >= 2 && secret.length >= 12) return 'medium';
    return 'weak';
  }

  /**
   * Fetch secret from vault
   */
  private async fetchSecretFromVault(vaultPath: string): Promise<string | null> {
    if (!this.vaultClient) {
      return null;
    }

    try {
      switch (this.config.secretHandling.vaultIntegration.provider) {
        case 'hashicorp':
          const result = await this.vaultClient.read(vaultPath);
          return result.data.value;
        
        case 'azure':
          const secret = await this.vaultClient.getSecret(vaultPath);
          return secret.value;
        
        case 'aws':
          const response = await this.vaultClient.getSecretValue({ SecretId: vaultPath }).promise();
          return response.SecretString;
        
        default:
          return null;
      }
    } catch (error) {
      throw new Error(`Vault secret retrieval failed: ${error.message}`);
    }
  }

  /**
   * Validate all overrides
   */
  private async validateOverrides(overrides: Record<string, any>): Promise<{
    warnings: OverrideWarning[];
    errors: OverrideError[];
  }> {
    const warnings: OverrideWarning[] = [];
    const errors: OverrideError[] = [];

    // Check required overrides
    for (const requiredKey of this.config.validation.requiredOverrides) {
      if (!this.getNestedProperty(overrides, requiredKey)) {
        errors.push({
          key: requiredKey,
          value: '',
          error: 'Required configuration override is missing',
          resolution: `Set the corresponding environment variable for ${requiredKey}`
        });
      }
    }

    // Check deprecated overrides
    for (const deprecatedKey of this.config.validation.deprecatedOverrides) {
      if (this.getNestedProperty(overrides, deprecatedKey)) {
        warnings.push({
          key: deprecatedKey,
          message: 'Using deprecated configuration override',
          suggestion: 'Migrate to the new configuration format',
          deprecated: true
        });
      }
    }

    // Apply custom validation schema if provided
    if (this.config.validation.validationSchema) {
      try {
        this.config.validation.validationSchema.parse(overrides);
      } catch (error) {
        if (error instanceof z.ZodError) {
          errors.push(...error.errors.map(err => ({
            key: err.path.join('.'),
            value: String(err.input || ''),
            error: err.message,
            resolution: 'Fix the validation error in the environment variable'
          })));
        }
      }
    }

    return { warnings, errors };
  }

  /**
   * Apply overrides to enterprise configuration
   */
  applyOverridesToConfig(config: EnterpriseConfig, overrides: Record<string, any>): EnterpriseConfig {
    const updatedConfig = JSON.parse(JSON.stringify(config)) as EnterpriseConfig;
    
    for (const [path, value] of Object.entries(overrides)) {
      this.setNestedProperty(updatedConfig, path, value);
    }
    
    return updatedConfig;
  }

  /**
   * Get cached result
   */
  private getCachedResult(key: string): OverrideProcessingResult | null {
    if (!this.config.caching.enabled) {
      return null;
    }

    const cached = this.cache.get(key);
    if (!cached) {
      return null;
    }

    const now = new Date();
    const age = (now.getTime() - cached.timestamp.getTime()) / 1000;
    
    if (age > cached.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.value;
  }

  /**
   * Set cached result
   */
  private setCachedResult(key: string, result: OverrideProcessingResult): void {
    if (!this.config.caching.enabled) {
      return;
    }

    this.cache.set(key, {
      value: result,
      timestamp: new Date(),
      ttl: this.config.caching.ttlSeconds
    });
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
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get system status
   */
  getStatus(): {
    vaultEnabled: boolean;
    vaultConnected: boolean;
    cachingEnabled: boolean;
    cacheSize: number;
    mappingsCount: number;
    secretsCount: number;
  } {
    return {
      vaultEnabled: this.config.secretHandling.vaultIntegration.enabled,
      vaultConnected: this.vaultClient !== null,
      cachingEnabled: this.config.caching.enabled,
      cacheSize: this.cache.size,
      mappingsCount: this.mappings.size,
      secretsCount: this.secretMetadata.size
    };
  }
}

export default EnvironmentOverrideSystem;