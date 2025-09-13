/**
 * Schema Validation Test Suite for Enterprise Configuration System
 * 
 * Tests schema validation, type checking, required fields, and constraint validation
 * for the enterprise_config.yaml configuration system.
 * 
 * @requires yaml - For parsing YAML configuration files
 * @requires joi - For schema validation (if available)
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

describe('Enterprise Configuration Schema Validation', () => {
  let enterpriseConfig;
  let checksConfig;
  const configPath = path.join(process.cwd(), 'config', 'enterprise_config.yaml');
  const checksPath = path.join(process.cwd(), 'config', 'checks.yaml');

  beforeAll(() => {
    // Load configuration files
    try {
      const enterpriseConfigContent = fs.readFileSync(configPath, 'utf8');
      enterpriseConfig = yaml.load(enterpriseConfigContent);
      
      const checksConfigContent = fs.readFileSync(checksPath, 'utf8');
      checksConfig = yaml.load(checksConfigContent);
    } catch (error) {
      throw new Error(`Failed to load configuration files: ${error.message}`);
    }
  });

  describe('Schema Metadata Validation', () => {
    test('should have valid schema metadata', () => {
      expect(enterpriseConfig.schema).toBeDefined();
      expect(enterpriseConfig.schema.version).toBe('1.0');
      expect(enterpriseConfig.schema.format_version).toBe('2024.1');
      expect(enterpriseConfig.schema.compatibility_level).toBe('backward');
      expect(typeof enterpriseConfig.schema.migration_required).toBe('boolean');
    });

    test('should have valid version format', () => {
      const versionPattern = /^\d+\.\d+$/;
      expect(enterpriseConfig.schema.version).toMatch(versionPattern);
      
      const formatVersionPattern = /^\d{4}\.\d+$/;
      expect(enterpriseConfig.schema.format_version).toMatch(formatVersionPattern);
    });
  });

  describe('Enterprise Feature Configuration', () => {
    test('should have valid enterprise section', () => {
      expect(enterpriseConfig.enterprise).toBeDefined();
      expect(typeof enterpriseConfig.enterprise.enabled).toBe('boolean');
      expect(['community', 'professional', 'enterprise']).toContain(
        enterpriseConfig.enterprise.license_mode
      );
      expect(['standard', 'strict', 'nasa-pot10', 'defense']).toContain(
        enterpriseConfig.enterprise.compliance_level
      );
    });

    test('should have valid feature flags', () => {
      const features = enterpriseConfig.enterprise.features;
      expect(features).toBeDefined();
      
      // All feature flags should be boolean
      Object.entries(features).forEach(([key, value]) => {
        expect(typeof value).toBe('boolean');
      });

      // Critical features should be present
      const requiredFeatures = [
        'advanced_analytics', 'enterprise_security', 'audit_logging',
        'performance_monitoring', 'compliance_reporting'
      ];
      
      requiredFeatures.forEach(feature => {
        expect(features).toHaveProperty(feature);
      });
    });
  });

  describe('Security Configuration Validation', () => {
    test('should have valid authentication settings', () => {
      const auth = enterpriseConfig.security.authentication;
      expect(auth).toBeDefined();
      expect(typeof auth.enabled).toBe('boolean');
      expect(['basic', 'oauth2', 'saml', 'ldap', 'multi_factor']).toContain(auth.method);
      expect(typeof auth.session_timeout).toBe('number');
      expect(auth.session_timeout).toBeGreaterThan(0);
    });

    test('should have valid password policy', () => {
      const policy = enterpriseConfig.security.authentication.password_policy;
      expect(policy).toBeDefined();
      expect(typeof policy.min_length).toBe('number');
      expect(policy.min_length).toBeGreaterThanOrEqual(8);
      expect(typeof policy.require_uppercase).toBe('boolean');
      expect(typeof policy.require_lowercase).toBe('boolean');
      expect(typeof policy.require_numbers).toBe('boolean');
      expect(typeof policy.require_special_chars).toBe('boolean');
      expect(typeof policy.expiry_days).toBe('number');
      expect(policy.expiry_days).toBeGreaterThan(0);
    });

    test('should have valid authorization settings', () => {
      const auth = enterpriseConfig.security.authorization;
      expect(auth).toBeDefined();
      expect(typeof auth.rbac_enabled).toBe('boolean');
      expect(typeof auth.default_role).toBe('string');
      expect(auth.roles).toBeDefined();
      
      // Validate role structure
      Object.entries(auth.roles).forEach(([roleName, roleConfig]) => {
        expect(Array.isArray(roleConfig.permissions)).toBe(true);
        expect(roleConfig.permissions.length).toBeGreaterThan(0);
      });
    });

    test('should have valid encryption settings', () => {
      const encryption = enterpriseConfig.security.encryption;
      expect(encryption).toBeDefined();
      expect(typeof encryption.at_rest).toBe('boolean');
      expect(typeof encryption.in_transit).toBe('boolean');
      expect(typeof encryption.algorithm).toBe('string');
      expect(encryption.algorithm).toMatch(/AES-\d+-/);
      expect(typeof encryption.key_rotation_days).toBe('number');
      expect(encryption.key_rotation_days).toBeGreaterThan(0);
    });
  });

  describe('Performance Configuration Validation', () => {
    test('should have valid scaling configuration', () => {
      const scaling = enterpriseConfig.performance.scaling;
      expect(scaling).toBeDefined();
      expect(typeof scaling.auto_scaling_enabled).toBe('boolean');
      expect(typeof scaling.min_workers).toBe('number');
      expect(typeof scaling.max_workers).toBe('number');
      expect(scaling.min_workers).toBeLessThanOrEqual(scaling.max_workers);
      expect(scaling.scale_up_threshold).toBeGreaterThan(0);
      expect(scaling.scale_up_threshold).toBeLessThanOrEqual(1);
      expect(scaling.scale_down_threshold).toBeGreaterThan(0);
      expect(scaling.scale_down_threshold).toBeLessThan(scaling.scale_up_threshold);
    });

    test('should have valid resource limits', () => {
      const limits = enterpriseConfig.performance.resource_limits;
      expect(limits).toBeDefined();
      expect(typeof limits.max_memory_mb).toBe('number');
      expect(limits.max_memory_mb).toBeGreaterThan(0);
      expect(typeof limits.max_cpu_cores).toBe('number');
      expect(limits.max_cpu_cores).toBeGreaterThan(0);
      expect(typeof limits.max_file_size_mb).toBe('number');
      expect(limits.max_file_size_mb).toBeGreaterThan(0);
    });

    test('should have valid caching configuration', () => {
      const caching = enterpriseConfig.performance.caching;
      expect(caching).toBeDefined();
      expect(typeof caching.enabled).toBe('boolean');
      expect(['memory', 'redis', 'memcached']).toContain(caching.provider);
      expect(typeof caching.ttl_seconds).toBe('number');
      expect(caching.ttl_seconds).toBeGreaterThan(0);
    });
  });

  describe('Multi-tenancy Configuration Validation', () => {
    test('should have valid multi-tenancy settings', () => {
      const multiTenancy = enterpriseConfig.multi_tenancy;
      expect(multiTenancy).toBeDefined();
      expect(typeof multiTenancy.enabled).toBe('boolean');
      expect(['basic', 'enhanced', 'complete']).toContain(multiTenancy.isolation_level);
      expect(typeof multiTenancy.tenant_specific_config).toBe('boolean');
    });

    test('should have valid resource quotas', () => {
      const quotas = enterpriseConfig.multi_tenancy.resource_quotas;
      expect(quotas).toBeDefined();
      expect(typeof quotas.max_users_per_tenant).toBe('number');
      expect(quotas.max_users_per_tenant).toBeGreaterThan(0);
      expect(typeof quotas.max_projects_per_tenant).toBe('number');
      expect(quotas.max_projects_per_tenant).toBeGreaterThan(0);
    });
  });

  describe('Monitoring Configuration Validation', () => {
    test('should have valid metrics configuration', () => {
      const metrics = enterpriseConfig.monitoring.metrics;
      expect(metrics).toBeDefined();
      expect(typeof metrics.enabled).toBe('boolean');
      expect(['prometheus', 'datadog', 'new_relic']).toContain(metrics.provider);
      expect(typeof metrics.collection_interval).toBe('number');
      expect(metrics.collection_interval).toBeGreaterThan(0);
    });

    test('should have valid logging configuration', () => {
      const logging = enterpriseConfig.monitoring.logging;
      expect(logging).toBeDefined();
      expect(typeof logging.enabled).toBe('boolean');
      expect(['debug', 'info', 'warn', 'error']).toContain(logging.level);
      expect(['text', 'json', 'structured']).toContain(logging.format);
      expect(Array.isArray(logging.output)).toBe(true);
    });

    test('should have valid alert thresholds', () => {
      const thresholds = enterpriseConfig.monitoring.alerts.thresholds;
      expect(thresholds).toBeDefined();
      expect(typeof thresholds.error_rate).toBe('number');
      expect(thresholds.error_rate).toBeGreaterThan(0);
      expect(thresholds.error_rate).toBeLessThanOrEqual(1);
      expect(typeof thresholds.response_time_p95).toBe('number');
      expect(thresholds.response_time_p95).toBeGreaterThan(0);
    });
  });

  describe('Quality Gates Configuration Validation', () => {
    test('should have valid quality gates settings', () => {
      const qualityGates = enterpriseConfig.governance.quality_gates;
      expect(qualityGates).toBeDefined();
      expect(typeof qualityGates.enabled).toBe('boolean');
      expect(typeof qualityGates.enforce_blocking).toBe('boolean');
      expect(typeof qualityGates.custom_rules).toBe('boolean');
    });

    test('should have valid NASA compliance settings', () => {
      const nasa = enterpriseConfig.governance.quality_gates.nasa_compliance;
      expect(nasa).toBeDefined();
      expect(typeof nasa.enabled).toBe('boolean');
      expect(typeof nasa.minimum_score).toBe('number');
      expect(nasa.minimum_score).toBeGreaterThan(0);
      expect(nasa.minimum_score).toBeLessThanOrEqual(1);
      expect(typeof nasa.critical_violations_allowed).toBe('number');
      expect(nasa.critical_violations_allowed).toBeGreaterThanOrEqual(0);
    });

    test('should have valid custom gates', () => {
      const customGates = enterpriseConfig.governance.quality_gates.custom_gates;
      expect(customGates).toBeDefined();
      expect(typeof customGates.code_coverage).toBe('number');
      expect(customGates.code_coverage).toBeGreaterThan(0);
      expect(customGates.code_coverage).toBeLessThanOrEqual(1);
      expect(typeof customGates.documentation_coverage).toBe('number');
      expect(customGates.documentation_coverage).toBeGreaterThan(0);
      expect(customGates.documentation_coverage).toBeLessThanOrEqual(1);
    });
  });

  describe('Environment-specific Overrides Validation', () => {
    test('should have valid environment configurations', () => {
      const environments = enterpriseConfig.environments;
      expect(environments).toBeDefined();
      
      const requiredEnvs = ['development', 'staging', 'production'];
      requiredEnvs.forEach(env => {
        expect(environments).toHaveProperty(env);
        expect(typeof environments[env]).toBe('object');
      });
    });

    test('should have consistent override paths', () => {
      const environments = enterpriseConfig.environments;
      
      Object.entries(environments).forEach(([envName, envConfig]) => {
        Object.keys(envConfig).forEach(key => {
          // Override keys should use dot notation for nested properties
          expect(key).toMatch(/^[a-z_]+(\.[a-z_]+)*$/);
        });
      });
    });
  });

  describe('Validation Rules Configuration', () => {
    test('should have valid validation rules', () => {
      const validation = enterpriseConfig.validation;
      expect(validation).toBeDefined();
      expect(typeof validation.schema_validation).toBe('boolean');
      expect(typeof validation.runtime_validation).toBe('boolean');
      expect(typeof validation.configuration_drift_detection).toBe('boolean');
    });

    test('should have well-formed validation rules', () => {
      const rules = enterpriseConfig.validation.rules;
      expect(Array.isArray(rules)).toBe(true);
      
      rules.forEach(rule => {
        expect(rule).toHaveProperty('name');
        expect(rule).toHaveProperty('condition');
        expect(rule).toHaveProperty('severity');
        expect(['error', 'warning', 'info']).toContain(rule.severity);
        expect(typeof rule.name).toBe('string');
        expect(typeof rule.condition).toBe('string');
      });
    });
  });

  describe('Integration with Six Sigma Configuration', () => {
    test('should have compatible Six Sigma configuration', () => {
      expect(checksConfig.quality_gates).toBeDefined();
      expect(checksConfig.quality_gates.six_sigma).toBeDefined();
      expect(checksConfig.quality_gates.six_sigma.enabled).toBe(true);
    });

    test('should have valid DPMO calculation parameters', () => {
      const dpmo = checksConfig.quality_gates.six_sigma.dpmo_calculation;
      expect(dpmo).toBeDefined();
      expect(dpmo.opportunity_definitions).toBeDefined();
      
      Object.entries(dpmo.opportunity_definitions).forEach(([key, config]) => {
        expect(config).toHaveProperty('unit');
        expect(config).toHaveProperty('opportunities_per_unit');
        expect(typeof config.opportunities_per_unit).toBe('number');
        expect(config.opportunities_per_unit).toBeGreaterThan(0);
      });
    });

    test('should have valid RTY thresholds', () => {
      const rty = checksConfig.quality_gates.six_sigma.rty_thresholds;
      expect(rty).toBeDefined();
      expect(typeof rty.excellent).toBe('number');
      expect(typeof rty.good).toBe('number');
      expect(typeof rty.acceptable).toBe('number');
      expect(rty.excellent).toBeGreaterThan(rty.good);
      expect(rty.good).toBeGreaterThan(rty.acceptable);
    });
  });

  describe('Configuration Completeness', () => {
    test('should have all required top-level sections', () => {
      const requiredSections = [
        'schema', 'enterprise', 'security', 'multi_tenancy', 
        'performance', 'integrations', 'monitoring', 'analytics',
        'governance', 'notifications', 'environments', 'validation'
      ];
      
      requiredSections.forEach(section => {
        expect(enterpriseConfig).toHaveProperty(section);
        expect(enterpriseConfig[section]).not.toBeNull();
        expect(enterpriseConfig[section]).not.toBeUndefined();
      });
    });

    test('should have consistent boolean values', () => {
      const checkBooleans = (obj, path = '') => {
        Object.entries(obj).forEach(([key, value]) => {
          const fullPath = path ? `${path}.${key}` : key;
          if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            checkBooleans(value, fullPath);
          } else if (key.includes('enabled') || key.includes('required')) {
            expect(typeof value).toBe('boolean');
          }
        });
      };
      
      checkBooleans(enterpriseConfig);
    });
  });

  describe('Configuration Security Validation', () => {
    test('should not contain hardcoded secrets', () => {
      const configString = JSON.stringify(enterpriseConfig);
      
      // Check for common patterns that might indicate hardcoded secrets
      const suspiciousPatterns = [
        /password['"]\s*:\s*['"]\w+/i,
        /secret['"]\s*:\s*['"]\w{10,}/i,
        /api[_-]?key['"]\s*:\s*['"]\w{10,}/i,
        /token['"]\s*:\s*['"]\w{10,}/i
      ];
      
      suspiciousPatterns.forEach(pattern => {
        expect(configString).not.toMatch(pattern);
      });
    });

    test('should use environment variable placeholders for sensitive values', () => {
      const sensitiveFields = [
        'integrations.external_systems.github.webhook_secret',
        'integrations.external_systems.slack.webhook_url',
        'integrations.external_systems.teams.webhook_url',
        'notifications.channels.email.smtp_server'
      ];
      
      const getValue = (obj, path) => {
        return path.split('.').reduce((current, key) => current?.[key], obj);
      };
      
      sensitiveFields.forEach(field => {
        const value = getValue(enterpriseConfig, field);
        if (value && typeof value === 'string') {
          expect(value).toMatch(/^\${[A-Z_]+}$/);
        }
      });
    });
  });
});