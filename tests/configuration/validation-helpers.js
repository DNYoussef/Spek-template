/**
 * Configuration Validation Helper Utilities
 * 
 * Provides reusable validation functions, schema validators, and helper utilities
 * for testing configuration system components across different test suites.
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

/**
 * Configuration Schema Validator
 */
class ConfigSchemaValidator {
  constructor() {
    this.validationRules = new Map();
    this.setupDefaultRules();
  }

  setupDefaultRules() {
    // Enterprise section rules
    this.addRule('enterprise.enabled', {
      required: true,
      type: 'boolean',
      message: 'Enterprise feature flag must be a boolean'
    });

    this.addRule('enterprise.license_mode', {
      required: true,
      type: 'string',
      enum: ['community', 'professional', 'enterprise'],
      message: 'License mode must be one of: community, professional, enterprise'
    });

    this.addRule('enterprise.compliance_level', {
      required: true,
      type: 'string',
      enum: ['standard', 'strict', 'nasa-pot10', 'defense'],
      message: 'Compliance level must be one of: standard, strict, nasa-pot10, defense'
    });

    // Security section rules
    this.addRule('security.authentication.enabled', {
      required: true,
      type: 'boolean',
      message: 'Authentication enabled flag must be a boolean'
    });

    this.addRule('security.authentication.method', {
      required: false,
      type: 'string',
      enum: ['basic', 'oauth2', 'saml', 'ldap', 'multi_factor'],
      condition: (config) => config.security?.authentication?.enabled,
      message: 'Authentication method must be one of: basic, oauth2, saml, ldap, multi_factor'
    });

    this.addRule('security.authentication.session_timeout', {
      required: false,
      type: 'number',
      min: 300, // 5 minutes
      max: 86400, // 24 hours
      message: 'Session timeout must be between 300 and 86400 seconds'
    });

    // Performance section rules
    this.addRule('performance.scaling.min_workers', {
      required: false,
      type: 'number',
      min: 1,
      max: 100,
      message: 'Min workers must be between 1 and 100'
    });

    this.addRule('performance.scaling.max_workers', {
      required: false,
      type: 'number',
      min: 1,
      max: 1000,
      message: 'Max workers must be between 1 and 1000'
    });

    this.addRule('performance.scaling.scale_up_threshold', {
      required: false,
      type: 'number',
      min: 0.1,
      max: 1.0,
      message: 'Scale up threshold must be between 0.1 and 1.0'
    });
  }

  addRule(path, rule) {
    this.validationRules.set(path, rule);
  }

  validate(config) {
    const results = {
      valid: true,
      errors: [],
      warnings: [],
      info: []
    };

    for (const [path, rule] of this.validationRules.entries()) {
      const validation = this.validateField(config, path, rule);
      if (!validation.valid) {
        results.valid = false;
        results.errors.push(...validation.errors);
        results.warnings.push(...validation.warnings);
      } else {
        results.info.push(...validation.info);
      }
    }

    // Custom validation rules
    this.validateCrossFieldConstraints(config, results);

    return results;
  }

  validateField(config, path, rule) {
    const result = { valid: true, errors: [], warnings: [], info: [] };
    const value = this.getNestedValue(config, path);

    // Check condition
    if (rule.condition && !rule.condition(config)) {
      result.info.push({
        path,
        message: `Skipped validation for ${path} due to condition not met`
      });
      return result;
    }

    // Required field check
    if (rule.required && (value === undefined || value === null)) {
      result.valid = false;
      result.errors.push({
        path,
        type: 'required_field_missing',
        message: `Required field '${path}' is missing`,
        rule: rule.message
      });
      return result;
    }

    // Skip further validation if field is optional and not present
    if (!rule.required && (value === undefined || value === null)) {
      return result;
    }

    // Type validation
    if (rule.type && typeof value !== rule.type) {
      result.valid = false;
      result.errors.push({
        path,
        type: 'type_mismatch',
        expected: rule.type,
        actual: typeof value,
        value,
        message: `Field '${path}' must be ${rule.type}, got ${typeof value}`,
        rule: rule.message
      });
      return result;
    }

    // Enum validation
    if (rule.enum && !rule.enum.includes(value)) {
      result.valid = false;
      result.errors.push({
        path,
        type: 'invalid_enum_value',
        value,
        allowed: rule.enum,
        message: `Field '${path}' must be one of: ${rule.enum.join(', ')}`,
        rule: rule.message
      });
    }

    // Range validation for numbers
    if (rule.type === 'number' && typeof value === 'number') {
      if (rule.min !== undefined && value < rule.min) {
        result.valid = false;
        result.errors.push({
          path,
          type: 'value_below_minimum',
          value,
          minimum: rule.min,
          message: `Field '${path}' must be at least ${rule.min}, got ${value}`,
          rule: rule.message
        });
      }

      if (rule.max !== undefined && value > rule.max) {
        result.valid = false;
        result.errors.push({
          path,
          type: 'value_above_maximum',
          value,
          maximum: rule.max,
          message: `Field '${path}' must be at most ${rule.max}, got ${value}`,
          rule: rule.message
        });
      }
    }

    // Custom validator
    if (rule.validator && !rule.validator(value)) {
      result.valid = false;
      result.errors.push({
        path,
        type: 'custom_validation_failed',
        value,
        message: rule.message || `Custom validation failed for field '${path}'`
      });
    }

    return result;
  }

  validateCrossFieldConstraints(config, results) {
    // Min workers should be <= Max workers
    const minWorkers = this.getNestedValue(config, 'performance.scaling.min_workers');
    const maxWorkers = this.getNestedValue(config, 'performance.scaling.max_workers');

    if (minWorkers && maxWorkers && minWorkers > maxWorkers) {
      results.valid = false;
      results.errors.push({
        type: 'cross_field_constraint',
        fields: ['performance.scaling.min_workers', 'performance.scaling.max_workers'],
        message: 'Min workers cannot be greater than max workers',
        values: { min_workers: minWorkers, max_workers: maxWorkers }
      });
    }

    // Scale up threshold should be > Scale down threshold
    const scaleUpThreshold = this.getNestedValue(config, 'performance.scaling.scale_up_threshold');
    const scaleDownThreshold = this.getNestedValue(config, 'performance.scaling.scale_down_threshold');

    if (scaleUpThreshold && scaleDownThreshold && scaleUpThreshold <= scaleDownThreshold) {
      results.valid = false;
      results.errors.push({
        type: 'cross_field_constraint',
        fields: ['performance.scaling.scale_up_threshold', 'performance.scaling.scale_down_threshold'],
        message: 'Scale up threshold must be greater than scale down threshold',
        values: { scale_up: scaleUpThreshold, scale_down: scaleDownThreshold }
      });
    }
  }

  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
}

/**
 * Configuration File Utilities
 */
class ConfigFileUtils {
  static loadYamlFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      return {
        success: true,
        config: yaml.load(content),
        error: null
      };
    } catch (error) {
      return {
        success: false,
        config: null,
        error: error.message,
        code: error.code
      };
    }
  }

  static validateFileExists(filePath) {
    try {
      const stats = fs.statSync(filePath);
      return {
        exists: true,
        isFile: stats.isFile(),
        isDirectory: stats.isDirectory(),
        size: stats.size,
        lastModified: stats.mtime
      };
    } catch (error) {
      return {
        exists: false,
        error: error.message,
        code: error.code
      };
    }
  }

  static createTempConfigFile(content, filename = 'temp-config.yaml') {
    const tempDir = require('os').tmpdir();
    const tempPath = path.join(tempDir, filename);
    
    try {
      const yamlContent = typeof content === 'string' ? content : yaml.dump(content);
      fs.writeFileSync(tempPath, yamlContent);
      return {
        success: true,
        path: tempPath,
        cleanup: () => {
          try {
            fs.unlinkSync(tempPath);
          } catch (e) {
            console.warn('Failed to cleanup temp file:', e.message);
          }
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

/**
 * Environment Variable Utilities
 */
class EnvVarUtils {
  static substituteEnvironmentVariables(config, envVars = process.env) {
    const substitute = (obj) => {
      if (typeof obj === 'string') {
        return obj.replace(/\${([^}]+)}/g, (match, envVar) => {
          return envVars[envVar] || match;
        });
      } else if (Array.isArray(obj)) {
        return obj.map(substitute);
      } else if (obj && typeof obj === 'object') {
        const result = {};
        Object.entries(obj).forEach(([key, value]) => {
          result[key] = substitute(value);
        });
        return result;
      }
      return obj;
    };

    return substitute(config);
  }

  static findEnvironmentVariables(config) {
    const envVars = new Set();
    const envVarPattern = /\${([^}]+)}/g;

    const search = (obj) => {
      if (typeof obj === 'string') {
        let match;
        while ((match = envVarPattern.exec(obj)) !== null) {
          envVars.add(match[1]);
        }
        envVarPattern.lastIndex = 0; // Reset regex
      } else if (Array.isArray(obj)) {
        obj.forEach(search);
      } else if (obj && typeof obj === 'object') {
        Object.values(obj).forEach(search);
      }
    };

    search(config);
    return Array.from(envVars);
  }

  static validateEnvironmentVariables(requiredVars, envVars = process.env) {
    const missing = requiredVars.filter(varName => !envVars[varName]);
    const present = requiredVars.filter(varName => !!envVars[varName]);

    return {
      valid: missing.length === 0,
      missing,
      present,
      total: requiredVars.length
    };
  }
}

/**
 * Configuration Merger Utility
 */
class ConfigMerger {
  static deepMerge(base, override) {
    if (!override || typeof override !== 'object' || Array.isArray(override)) {
      return override !== undefined ? override : base;
    }

    if (!base || typeof base !== 'object' || Array.isArray(base)) {
      return override;
    }

    const result = { ...base };

    Object.keys(override).forEach(key => {
      result[key] = this.deepMerge(base[key], override[key]);
    });

    return result;
  }

  static applyEnvironmentOverrides(config, environment) {
    if (!config.environments || !config.environments[environment]) {
      return {
        config: { ...config },
        applied: false,
        overrides: {}
      };
    }

    const envOverrides = config.environments[environment];
    const result = JSON.parse(JSON.stringify(config));
    const appliedOverrides = {};

    Object.entries(envOverrides).forEach(([path, value]) => {
      const keys = path.split('.');
      let current = result;

      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }

      const lastKey = keys[keys.length - 1];
      appliedOverrides[path] = {
        oldValue: current[lastKey],
        newValue: value
      };
      current[lastKey] = value;
    });

    delete result.environments;

    return {
      config: result,
      applied: true,
      overrides: appliedOverrides
    };
  }
}

/**
 * Performance Testing Utilities
 */
class PerformanceUtils {
  static measureExecutionTime(fn) {
    const start = process.hrtime.bigint();
    const result = fn();
    const end = process.hrtime.bigint();
    
    return {
      result,
      executionTimeNs: Number(end - start),
      executionTimeMs: Number(end - start) / 1000000
    };
  }

  static measureMemoryUsage(fn) {
    const before = process.memoryUsage();
    const result = fn();
    const after = process.memoryUsage();

    return {
      result,
      memoryDelta: {
        heapUsed: after.heapUsed - before.heapUsed,
        heapTotal: after.heapTotal - before.heapTotal,
        external: after.external - before.external,
        arrayBuffers: after.arrayBuffers - before.arrayBuffers
      }
    };
  }

  static createPerformanceBenchmark(operations, iterations = 1000) {
    const results = {};

    Object.entries(operations).forEach(([name, operation]) => {
      const times = [];
      
      for (let i = 0; i < iterations; i++) {
        const measurement = this.measureExecutionTime(operation);
        times.push(measurement.executionTimeMs);
      }

      times.sort((a, b) => a - b);

      results[name] = {
        iterations,
        min: times[0],
        max: times[times.length - 1],
        median: times[Math.floor(times.length / 2)],
        mean: times.reduce((sum, time) => sum + time, 0) / times.length,
        p95: times[Math.floor(times.length * 0.95)],
        p99: times[Math.floor(times.length * 0.99)]
      };
    });

    return results;
  }
}

/**
 * Test Data Generators
 */
class TestDataGenerator {
  static generateValidEnterpriseConfig() {
    return {
      schema: {
        version: '1.0',
        format_version: '2024.1',
        compatibility_level: 'backward',
        migration_required: false
      },
      enterprise: {
        enabled: true,
        license_mode: 'enterprise',
        compliance_level: 'nasa-pot10',
        features: {
          advanced_analytics: true,
          enterprise_security: true,
          audit_logging: true,
          performance_monitoring: true
        }
      },
      security: {
        authentication: {
          enabled: true,
          method: 'oauth2',
          session_timeout: 3600
        },
        encryption: {
          at_rest: true,
          in_transit: true,
          algorithm: 'AES-256-GCM'
        }
      },
      performance: {
        scaling: {
          auto_scaling_enabled: true,
          min_workers: 2,
          max_workers: 20,
          scale_up_threshold: 0.8,
          scale_down_threshold: 0.3
        }
      },
      environments: {
        development: {
          'security.authentication.enabled': false,
          'performance.scaling.auto_scaling_enabled': false
        },
        production: {
          'security.encryption.at_rest': true,
          'security.audit.enabled': true
        }
      }
    };
  }

  static generateInvalidConfigs() {
    return {
      missing_required_fields: {
        enterprise: { enabled: true }
        // Missing schema section
      },
      wrong_types: {
        schema: { version: 1.0 }, // Should be string
        enterprise: { enabled: 'true' }, // Should be boolean
        security: {
          authentication: {
            session_timeout: '3600' // Should be number
          }
        }
      },
      invalid_enum_values: {
        schema: { version: '1.0' },
        enterprise: {
          enabled: true,
          license_mode: 'invalid_mode', // Invalid enum value
          compliance_level: 'invalid_compliance'
        }
      },
      constraint_violations: {
        schema: { version: '1.0' },
        enterprise: { enabled: true },
        performance: {
          scaling: {
            min_workers: 10,
            max_workers: 5, // Constraint violation: min > max
            scale_up_threshold: 0.3,
            scale_down_threshold: 0.8 // Constraint violation: scale_up <= scale_down
          }
        }
      }
    };
  }
}

module.exports = {
  ConfigSchemaValidator,
  ConfigFileUtils,
  EnvVarUtils,
  ConfigMerger,
  PerformanceUtils,
  TestDataGenerator
};