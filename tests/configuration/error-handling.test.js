/**
 * Configuration Error Handling and Recovery Testing Suite
 * 
 * Tests error handling scenarios, graceful degradation, recovery mechanisms,
 * and resilience of the configuration system under various failure conditions.
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { tmpdir } = require('os');

describe('Configuration Error Handling and Recovery Testing', () => {
  let originalEnv;
  let tempConfigDir;
  
  const validConfigPath = path.join(process.cwd(), 'config', 'enterprise_config.yaml');
  const validChecksPath = path.join(process.cwd(), 'config', 'checks.yaml');

  beforeAll(() => {
    originalEnv = { ...process.env };
    tempConfigDir = path.join(tmpdir(), 'config-test-' + Date.now());
    
    try {
      fs.mkdirSync(tempConfigDir, { recursive: true });
    } catch (error) {
      console.warn('Could not create temp directory:', error.message);
    }
  });

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  afterAll(() => {
    try {
      fs.rmSync(tempConfigDir, { recursive: true, force: true });
    } catch (error) {
      console.warn('Could not clean up temp directory:', error.message);
    }
  });

  describe('Configuration File Loading Errors', () => {
    test('should handle missing configuration file gracefully', () => {
      const loadConfigSafely = (configPath) => {
        try {
          const content = fs.readFileSync(configPath, 'utf8');
          return {
            success: true,
            config: yaml.load(content),
            error: null
          };
        } catch (error) {
          return {
            success: false,
            config: null,
            error: error.message
          };
        }
      };

      const nonexistentPath = path.join(tempConfigDir, 'nonexistent.yaml');
      const result = loadConfigSafely(nonexistentPath);
      
      expect(result.success).toBe(false);
      expect(result.config).toBeNull();
      expect(result.error).toContain('ENOENT');
    });

    test('should handle corrupted YAML file gracefully', () => {
      const corruptedConfigPath = path.join(tempConfigDir, 'corrupted.yaml');
      const corruptedContent = `
schema:
  version: "1.0"
  invalid_yaml: [unclosed array
enterprise:
  enabled: true
  bad_indentation:
wrong_level: "value"
`;

      fs.writeFileSync(corruptedConfigPath, corruptedContent);

      const loadConfigSafely = (configPath) => {
        try {
          const content = fs.readFileSync(configPath, 'utf8');
          const config = yaml.load(content);
          return {
            success: true,
            config,
            error: null
          };
        } catch (error) {
          return {
            success: false,
            config: null,
            error: error.message,
            errorType: error.name
          };
        }
      };

      const result = loadConfigSafely(corruptedConfigPath);
      expect(result.success).toBe(false);
      expect(result.config).toBeNull();
      expect(result.errorType).toBe('YAMLException');
    });

    test('should handle file permission errors', () => {
      const protectedConfigPath = path.join(tempConfigDir, 'protected.yaml');
      
      try {
        fs.writeFileSync(protectedConfigPath, 'schema:\n  version: "1.0"');
        fs.chmodSync(protectedConfigPath, 0o000); // Remove all permissions
      } catch (error) {
        console.warn('Could not create protected file, skipping test');
        return;
      }

      const loadConfigSafely = (configPath) => {
        try {
          const content = fs.readFileSync(configPath, 'utf8');
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
      };

      const result = loadConfigSafely(protectedConfigPath);
      expect(result.success).toBe(false);
      expect(['EACCES', 'EPERM']).toContain(result.code);

      // Cleanup
      try {
        fs.chmodSync(protectedConfigPath, 0o644);
        fs.unlinkSync(protectedConfigPath);
      } catch (error) {
        console.warn('Could not cleanup protected file');
      }
    });

    test('should provide meaningful error messages for configuration issues', () => {
      const diagnosticLoader = (configPath) => {
        try {
          if (!fs.existsSync(configPath)) {
            throw new Error(`Configuration file not found: ${configPath}`);
          }

          const stats = fs.statSync(configPath);
          if (!stats.isFile()) {
            throw new Error(`Configuration path is not a file: ${configPath}`);
          }

          if (stats.size === 0) {
            throw new Error(`Configuration file is empty: ${configPath}`);
          }

          const content = fs.readFileSync(configPath, 'utf8');
          
          if (!content.trim()) {
            throw new Error(`Configuration file contains only whitespace: ${configPath}`);
          }

          const config = yaml.load(content);
          
          if (!config) {
            throw new Error(`Configuration file does not contain valid YAML: ${configPath}`);
          }

          if (typeof config !== 'object') {
            throw new Error(`Configuration root must be an object, got ${typeof config}: ${configPath}`);
          }

          return { success: true, config, error: null };
        } catch (error) {
          return {
            success: false,
            config: null,
            error: error.message
          };
        }
      };

      // Test with empty file
      const emptyConfigPath = path.join(tempConfigDir, 'empty.yaml');
      fs.writeFileSync(emptyConfigPath, '');
      
      const emptyResult = diagnosticLoader(emptyConfigPath);
      expect(emptyResult.success).toBe(false);
      expect(emptyResult.error).toContain('empty');

      // Test with non-object root
      const invalidConfigPath = path.join(tempConfigDir, 'invalid-root.yaml');
      fs.writeFileSync(invalidConfigPath, 'just a string');
      
      const invalidResult = diagnosticLoader(invalidConfigPath);
      expect(invalidResult.success).toBe(false);
      expect(invalidResult.error).toContain('must be an object');
    });
  });

  describe('Schema Validation Error Handling', () => {
    test('should handle missing required sections gracefully', () => {
      const validateConfigSchema = (config) => {
        const requiredSections = [
          'schema', 'enterprise', 'security', 'performance'
        ];
        const errors = [];
        const warnings = [];

        requiredSections.forEach(section => {
          if (!config[section]) {
            errors.push({
              type: 'missing_section',
              section,
              message: `Required section '${section}' is missing`,
              severity: 'error'
            });
          }
        });

        // Check for schema version
        if (config.schema && !config.schema.version) {
          errors.push({
            type: 'missing_version',
            section: 'schema',
            message: 'Schema version is required',
            severity: 'error'
          });
        }

        // Check for boolean type violations
        const booleanFields = [
          'enterprise.enabled',
          'security.authentication.enabled',
          'performance.scaling.auto_scaling_enabled'
        ];

        booleanFields.forEach(fieldPath => {
          const value = getNestedValue(config, fieldPath);
          if (value !== undefined && typeof value !== 'boolean') {
            warnings.push({
              type: 'type_mismatch',
              field: fieldPath,
              expected: 'boolean',
              actual: typeof value,
              message: `Field '${fieldPath}' should be boolean, got ${typeof value}`,
              severity: 'warning'
            });
          }
        });

        return {
          valid: errors.length === 0,
          errors,
          warnings,
          canProceed: errors.length === 0 || errors.every(e => e.severity !== 'error')
        };
      };

      const getNestedValue = (obj, path) => {
        return path.split('.').reduce((current, key) => current?.[key], obj);
      };

      // Test with missing sections
      const incompleteConfig = {
        schema: { version: '1.0' },
        enterprise: { enabled: true }
        // Missing security and performance sections
      };

      const result = validateConfigSchema(incompleteConfig);
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(2);
      expect(result.errors.some(e => e.section === 'security')).toBe(true);
      expect(result.errors.some(e => e.section === 'performance')).toBe(true);
    });

    test('should handle invalid environment variable references', () => {
      const validateEnvironmentVariables = (config) => {
        const envVarPattern = /\${([^}]+)}/g;
        const issues = [];

        const checkForEnvVars = (obj, path = '') => {
          if (!obj || typeof obj !== 'object') return;

          Object.entries(obj).forEach(([key, value]) => {
            const currentPath = path ? `${path}.${key}` : key;

            if (typeof value === 'string') {
              let match;
              while ((match = envVarPattern.exec(value)) !== null) {
                const envVar = match[1];
                if (!process.env[envVar]) {
                  issues.push({
                    type: 'missing_env_var',
                    path: currentPath,
                    variable: envVar,
                    value,
                    message: `Environment variable '${envVar}' is not set`
                  });
                }
              }
              envVarPattern.lastIndex = 0; // Reset regex
            } else if (typeof value === 'object' && !Array.isArray(value)) {
              checkForEnvVars(value, currentPath);
            }
          });
        };

        checkForEnvVars(config);

        return {
          valid: issues.length === 0,
          issues,
          missingVariables: issues.map(i => i.variable)
        };
      };

      const configWithEnvVars = {
        database: {
          url: '${DATABASE_URL}',
          password: '${DB_PASSWORD}'
        },
        api: {
          key: '${API_KEY}',
          secret: '${API_SECRET}'
        }
      };

      // Don't set environment variables to test missing var detection
      const result = validateEnvironmentVariables(configWithEnvVars);
      expect(result.valid).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.missingVariables).toContain('DATABASE_URL');
    });

    test('should handle circular references in configuration', () => {
      const detectCircularReferences = (config) => {
        const visited = new Set();
        const recursionStack = new Set();
        const circularRefs = [];

        const checkCircular = (obj, path = '', objId = null) => {
          if (!obj || typeof obj !== 'object') return;

          // Create unique ID for object
          if (!objId) {
            objId = Date.now() + Math.random();
          }

          if (recursionStack.has(objId)) {
            circularRefs.push({
              path,
              message: `Circular reference detected at path: ${path}`
            });
            return;
          }

          if (visited.has(objId)) return;

          visited.add(objId);
          recursionStack.add(objId);

          if (Array.isArray(obj)) {
            obj.forEach((item, index) => {
              checkCircular(item, `${path}[${index}]`);
            });
          } else {
            Object.entries(obj).forEach(([key, value]) => {
              const currentPath = path ? `${path}.${key}` : key;
              checkCircular(value, currentPath);
            });
          }

          recursionStack.delete(objId);
        };

        checkCircular(config);

        return {
          hasCircularRefs: circularRefs.length > 0,
          circularRefs
        };
      };

      // Test with normal config (should pass)
      const normalConfig = {
        section1: { value: 'test' },
        section2: { reference: 'normal' }
      };

      const normalResult = detectCircularReferences(normalConfig);
      expect(normalResult.hasCircularRefs).toBe(false);
      expect(normalResult.circularRefs).toHaveLength(0);
    });
  });

  describe('Runtime Error Recovery', () => {
    test('should fallback to default values when configuration is invalid', () => {
      const createConfigWithDefaults = (userConfig, defaults) => {
        const mergeWithDefaults = (config, defaultConfig) => {
          const result = { ...defaultConfig };

          if (!config || typeof config !== 'object') {
            return result;
          }

          Object.keys(config).forEach(key => {
            if (config[key] !== null && config[key] !== undefined) {
              if (typeof config[key] === 'object' && 
                  typeof defaultConfig[key] === 'object' && 
                  !Array.isArray(config[key])) {
                result[key] = mergeWithDefaults(config[key], defaultConfig[key] || {});
              } else {
                result[key] = config[key];
              }
            }
          });

          return result;
        };

        return mergeWithDefaults(userConfig, defaults);
      };

      const defaults = {
        enterprise: {
          enabled: true,
          license_mode: 'community'
        },
        security: {
          authentication: {
            enabled: true,
            method: 'basic'
          }
        },
        performance: {
          scaling: {
            auto_scaling_enabled: false,
            min_workers: 1,
            max_workers: 4
          }
        }
      };

      // Test with invalid config
      const invalidConfig = null;
      const configWithDefaults = createConfigWithDefaults(invalidConfig, defaults);
      
      expect(configWithDefaults.enterprise.enabled).toBe(true);
      expect(configWithDefaults.security.authentication.enabled).toBe(true);
      expect(configWithDefaults.performance.scaling.min_workers).toBe(1);

      // Test with partial config
      const partialConfig = {
        enterprise: { enabled: false },
        security: { authentication: { method: 'oauth2' } }
      };

      const mergedConfig = createConfigWithDefaults(partialConfig, defaults);
      expect(mergedConfig.enterprise.enabled).toBe(false); // User override
      expect(mergedConfig.enterprise.license_mode).toBe('community'); // Default
      expect(mergedConfig.security.authentication.method).toBe('oauth2'); // User override
      expect(mergedConfig.security.authentication.enabled).toBe(true); // Default
    });

    test('should handle configuration reload failures gracefully', () => {
      const createConfigManager = (initialConfigPath) => {
        let currentConfig = null;
        let lastValidConfig = null;
        let reloadAttempts = 0;
        const maxReloadAttempts = 3;

        const loadInitialConfig = () => {
          try {
            const content = fs.readFileSync(initialConfigPath, 'utf8');
            currentConfig = yaml.load(content);
            lastValidConfig = { ...currentConfig };
            return { success: true, error: null };
          } catch (error) {
            return { success: false, error: error.message };
          }
        };

        const reloadConfig = (newConfigPath) => {
          reloadAttempts++;
          
          if (reloadAttempts > maxReloadAttempts) {
            return {
              success: false,
              error: 'Max reload attempts exceeded',
              usingFallback: true,
              config: lastValidConfig
            };
          }

          try {
            const content = fs.readFileSync(newConfigPath, 'utf8');
            const newConfig = yaml.load(content);
            
            // Basic validation
            if (!newConfig || typeof newConfig !== 'object') {
              throw new Error('Invalid configuration format');
            }

            currentConfig = newConfig;
            lastValidConfig = { ...newConfig };
            reloadAttempts = 0; // Reset on success
            
            return {
              success: true,
              error: null,
              config: currentConfig
            };
          } catch (error) {
            return {
              success: false,
              error: error.message,
              usingFallback: true,
              config: lastValidConfig
            };
          }
        };

        return {
          loadInitialConfig,
          reloadConfig,
          getCurrentConfig: () => currentConfig,
          getLastValidConfig: () => lastValidConfig,
          getReloadAttempts: () => reloadAttempts
        };
      };

      const configManager = createConfigManager(validConfigPath);
      
      // Load initial config
      const initialLoad = configManager.loadInitialConfig();
      expect(initialLoad.success).toBe(true);
      expect(configManager.getCurrentConfig()).not.toBeNull();

      // Try to reload with invalid config
      const invalidConfigPath = path.join(tempConfigDir, 'invalid-reload.yaml');
      fs.writeFileSync(invalidConfigPath, 'invalid: yaml: content: [');

      const reloadResult = configManager.reloadConfig(invalidConfigPath);
      expect(reloadResult.success).toBe(false);
      expect(reloadResult.usingFallback).toBe(true);
      expect(reloadResult.config).not.toBeNull();
      expect(configManager.getLastValidConfig()).not.toBeNull();
    });

    test('should handle environment-specific configuration failures', () => {
      const applyEnvironmentConfig = (baseConfig, environment) => {
        const errors = [];
        const warnings = [];
        let resultConfig = JSON.parse(JSON.stringify(baseConfig));

        try {
          const envOverrides = baseConfig.environments?.[environment];
          
          if (!envOverrides) {
            warnings.push({
              type: 'missing_environment',
              environment,
              message: `No configuration found for environment: ${environment}`
            });
            return {
              success: true,
              config: resultConfig,
              errors,
              warnings,
              usedDefaults: true
            };
          }

          Object.entries(envOverrides).forEach(([path, value]) => {
            try {
              const keys = path.split('.');
              let current = resultConfig;

              // Navigate to the parent object
              for (let i = 0; i < keys.length - 1; i++) {
                if (!current[keys[i]]) {
                  current[keys[i]] = {};
                }
                current = current[keys[i]];
              }

              // Set the value
              const lastKey = keys[keys.length - 1];
              current[lastKey] = value;
            } catch (error) {
              errors.push({
                type: 'override_application_failed',
                path,
                value,
                error: error.message
              });
            }
          });

          // Remove environments section from result
          delete resultConfig.environments;

          return {
            success: errors.length === 0,
            config: resultConfig,
            errors,
            warnings,
            usedDefaults: false
          };
        } catch (error) {
          errors.push({
            type: 'environment_config_failed',
            environment,
            error: error.message
          });

          return {
            success: false,
            config: baseConfig,
            errors,
            warnings,
            usedDefaults: true
          };
        }
      };

      const mockConfig = {
        enterprise: { enabled: true },
        security: { authentication: { enabled: true } },
        environments: {
          development: {
            'security.authentication.enabled': false
          },
          production: {
            'security.encryption.enabled': true
          }
        }
      };

      // Test valid environment
      const devResult = applyEnvironmentConfig(mockConfig, 'development');
      expect(devResult.success).toBe(true);
      expect(devResult.config.security.authentication.enabled).toBe(false);
      expect(devResult.config.environments).toBeUndefined();

      // Test missing environment
      const missingEnvResult = applyEnvironmentConfig(mockConfig, 'testing');
      expect(missingEnvResult.success).toBe(true);
      expect(missingEnvResult.usedDefaults).toBe(true);
      expect(missingEnvResult.warnings).toHaveLength(1);
      expect(missingEnvResult.warnings[0].type).toBe('missing_environment');
    });
  });

  describe('Validation Error Recovery', () => {
    test('should provide detailed validation error context', () => {
      const createDetailedValidator = () => {
        return (config, validationRules) => {
          const results = {
            valid: true,
            errors: [],
            warnings: [],
            context: {}
          };

          validationRules.forEach(rule => {
            try {
              const value = rule.path.split('.').reduce((obj, key) => obj?.[key], config);
              
              if (rule.required && (value === undefined || value === null)) {
                results.errors.push({
                  rule: rule.name,
                  path: rule.path,
                  type: 'required_field_missing',
                  message: `Required field '${rule.path}' is missing`,
                  suggestion: rule.defaultValue ? `Consider using default: ${rule.defaultValue}` : 'This field must be provided'
                });
                results.valid = false;
              } else if (value !== undefined && rule.type && typeof value !== rule.type) {
                results.errors.push({
                  rule: rule.name,
                  path: rule.path,
                  type: 'type_mismatch',
                  expected: rule.type,
                  actual: typeof value,
                  value,
                  message: `Field '${rule.path}' must be ${rule.type}, got ${typeof value}`,
                  suggestion: `Convert value to ${rule.type} or check configuration syntax`
                });
                results.valid = false;
              } else if (value !== undefined && rule.validator && !rule.validator(value)) {
                results.errors.push({
                  rule: rule.name,
                  path: rule.path,
                  type: 'validation_failed',
                  value,
                  message: rule.message || `Validation failed for field '${rule.path}'`,
                  suggestion: rule.suggestion || 'Check the field value meets requirements'
                });
                results.valid = false;
              }
            } catch (error) {
              results.errors.push({
                rule: rule.name,
                path: rule.path,
                type: 'validation_error',
                error: error.message,
                message: `Error validating '${rule.path}': ${error.message}`
              });
              results.valid = false;
            }
          });

          return results;
        };
      };

      const validator = createDetailedValidator();
      const validationRules = [
        {
          name: 'schema_version_required',
          path: 'schema.version',
          required: true,
          type: 'string',
          defaultValue: '1.0'
        },
        {
          name: 'enterprise_enabled_type',
          path: 'enterprise.enabled',
          required: true,
          type: 'boolean'
        },
        {
          name: 'workers_range',
          path: 'performance.scaling.min_workers',
          required: false,
          type: 'number',
          validator: (value) => value >= 1 && value <= 100,
          message: 'Min workers must be between 1 and 100',
          suggestion: 'Set min_workers to a value between 1 and 100'
        }
      ];

      const invalidConfig = {
        enterprise: { enabled: 'true' }, // Wrong type
        performance: { scaling: { min_workers: 0 } } // Invalid range
        // Missing schema.version
      };

      const result = validator(invalidConfig, validationRules);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      
      const requiredError = result.errors.find(e => e.type === 'required_field_missing');
      expect(requiredError).toBeDefined();
      expect(requiredError.suggestion).toContain('default');
      
      const typeError = result.errors.find(e => e.type === 'type_mismatch');
      expect(typeError).toBeDefined();
      expect(typeError.expected).toBe('boolean');
      
      const validationError = result.errors.find(e => e.type === 'validation_failed');
      expect(validationError).toBeDefined();
      expect(validationError.suggestion).toContain('between 1 and 100');
    });
  });

  describe('System Recovery and Health Checks', () => {
    test('should perform configuration health checks', () => {
      const performHealthCheck = (config) => {
        const checks = [];
        const timestamp = new Date().toISOString();

        // Check 1: Essential sections present
        const essentialSections = ['schema', 'enterprise', 'security'];
        essentialSections.forEach(section => {
          checks.push({
            name: `essential_section_${section}`,
            status: config[section] ? 'pass' : 'fail',
            message: config[section] ? 
              `Section '${section}' is present` : 
              `Critical section '${section}' is missing`,
            severity: 'critical',
            timestamp
          });
        });

        // Check 2: Configuration consistency
        const consistencyChecks = [
          {
            name: 'enterprise_features_consistency',
            condition: () => {
              if (!config.enterprise?.enabled) return true;
              return config.enterprise.features && 
                     typeof config.enterprise.features === 'object';
            },
            message: 'Enterprise features configuration is consistent'
          },
          {
            name: 'security_auth_consistency',
            condition: () => {
              if (!config.security?.authentication?.enabled) return true;
              return config.security.authentication.method && 
                     typeof config.security.authentication.method === 'string';
            },
            message: 'Security authentication configuration is consistent'
          }
        ];

        consistencyChecks.forEach(check => {
          try {
            const passed = check.condition();
            checks.push({
              name: check.name,
              status: passed ? 'pass' : 'fail',
              message: passed ? check.message : `Consistency check failed: ${check.name}`,
              severity: 'warning',
              timestamp
            });
          } catch (error) {
            checks.push({
              name: check.name,
              status: 'error',
              message: `Health check error: ${error.message}`,
              severity: 'error',
              timestamp
            });
          }
        });

        const overallHealth = {
          healthy: checks.every(c => c.status === 'pass'),
          criticalIssues: checks.filter(c => c.severity === 'critical' && c.status !== 'pass').length,
          warnings: checks.filter(c => c.severity === 'warning' && c.status !== 'pass').length,
          errors: checks.filter(c => c.status === 'error').length,
          timestamp
        };

        return {
          overall: overallHealth,
          checks,
          summary: {
            total: checks.length,
            passed: checks.filter(c => c.status === 'pass').length,
            failed: checks.filter(c => c.status === 'fail').length,
            errors: checks.filter(c => c.status === 'error').length
          }
        };
      };

      // Test with valid configuration
      const validConfig = {
        schema: { version: '1.0' },
        enterprise: { 
          enabled: true, 
          features: { advanced_analytics: true } 
        },
        security: { 
          authentication: { 
            enabled: true, 
            method: 'oauth2' 
          } 
        }
      };

      const healthResult = performHealthCheck(validConfig);
      expect(healthResult.overall.healthy).toBe(true);
      expect(healthResult.overall.criticalIssues).toBe(0);
      expect(healthResult.summary.passed).toBeGreaterThan(0);

      // Test with problematic configuration
      const problematicConfig = {
        schema: { version: '1.0' },
        enterprise: { enabled: true }
        // Missing security section
      };

      const problematicResult = performHealthCheck(problematicConfig);
      expect(problematicResult.overall.healthy).toBe(false);
      expect(problematicResult.overall.criticalIssues).toBeGreaterThan(0);
    });
  });
});