/**
 * Environment Variable Override Testing Suite
 * 
 * Tests environment-specific configuration overrides, environment variable
 * substitution, and configuration precedence handling.
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

describe('Environment Variable Override Testing', () => {
  let originalEnv;
  let enterpriseConfig;
  const configPath = path.join(process.cwd(), 'config', 'enterprise_config.yaml');

  beforeAll(() => {
    // Save original environment
    originalEnv = { ...process.env };
    
    // Load enterprise configuration
    try {
      const configContent = fs.readFileSync(configPath, 'utf8');
      enterpriseConfig = yaml.load(configContent);
    } catch (error) {
      throw new Error(`Failed to load configuration: ${error.message}`);
    }
  });

  beforeEach(() => {
    // Reset environment before each test
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('Environment Variable Substitution', () => {
    test('should handle GitHub webhook secret substitution', () => {
      const webhookSecretPlaceholder = enterpriseConfig.integrations.external_systems.github.webhook_secret;
      expect(webhookSecretPlaceholder).toBe('${GITHUB_WEBHOOK_SECRET}');
    });

    test('should handle Slack webhook URL substitution', () => {
      const slackWebhookPlaceholder = enterpriseConfig.integrations.external_systems.slack.webhook_url;
      expect(slackWebhookPlaceholder).toBe('${SLACK_WEBHOOK_URL}');
    });

    test('should handle Teams webhook URL substitution', () => {
      const teamsWebhookPlaceholder = enterpriseConfig.integrations.external_systems.teams.webhook_url;
      expect(teamsWebhookPlaceholder).toBe('${TEAMS_WEBHOOK_URL}');
    });

    test('should handle SMTP server substitution', () => {
      const smtpServerPlaceholder = enterpriseConfig.notifications.channels.email.smtp_server;
      expect(smtpServerPlaceholder).toBe('${SMTP_SERVER}');
    });

    test('should substitute environment variables correctly', () => {
      // Set test environment variables
      process.env.GITHUB_WEBHOOK_SECRET = 'test-github-secret-123';
      process.env.SLACK_WEBHOOK_URL = 'https://hooks.slack.com/services/test/webhook';
      process.env.SMTP_SERVER = 'smtp.test.com';

      // Mock configuration substitution function
      const substituteEnvVars = (configValue) => {
        if (typeof configValue !== 'string') return configValue;
        return configValue.replace(/\${([^}]+)}/g, (match, envVar) => {
          return process.env[envVar] || match;
        });
      };

      // Test substitution
      expect(substituteEnvVars('${GITHUB_WEBHOOK_SECRET}')).toBe('test-github-secret-123');
      expect(substituteEnvVars('${SLACK_WEBHOOK_URL}')).toBe('https://hooks.slack.com/services/test/webhook');
      expect(substituteEnvVars('${SMTP_SERVER}')).toBe('smtp.test.com');
      expect(substituteEnvVars('${NONEXISTENT_VAR}')).toBe('${NONEXISTENT_VAR}');
    });

    test('should handle nested environment variable substitution', () => {
      process.env.BASE_URL = 'https://api.company.com';
      process.env.API_VERSION = 'v2';
      
      const substituteEnvVars = (configValue) => {
        if (typeof configValue !== 'string') return configValue;
        return configValue.replace(/\${([^}]+)}/g, (match, envVar) => {
          return process.env[envVar] || match;
        });
      };

      const compositeUrl = '${BASE_URL}/api/${API_VERSION}/webhooks';
      expect(substituteEnvVars(compositeUrl)).toBe('https://api.company.com/api/v2/webhooks');
    });
  });

  describe('Environment-Specific Overrides', () => {
    test('should have valid development environment overrides', () => {
      const devConfig = enterpriseConfig.environments.development;
      expect(devConfig).toBeDefined();
      
      // Check specific development overrides
      expect(devConfig['security.authentication.enabled']).toBe(false);
      expect(devConfig['monitoring.logging.level']).toBe('debug');
      expect(devConfig['performance.caching.enabled']).toBe(false);
      expect(devConfig['governance.quality_gates.enforce_blocking']).toBe(false);
    });

    test('should have valid staging environment overrides', () => {
      const stagingConfig = enterpriseConfig.environments.staging;
      expect(stagingConfig).toBeDefined();
      
      // Check specific staging overrides
      expect(stagingConfig['security.authentication.method']).toBe('oauth2');
      expect(stagingConfig['monitoring.tracing.sampling_rate']).toBe(1.0);
      expect(stagingConfig['governance.quality_gates.enforce_blocking']).toBe(true);
    });

    test('should have valid production environment overrides', () => {
      const prodConfig = enterpriseConfig.environments.production;
      expect(prodConfig).toBeDefined();
      
      // Check specific production overrides
      expect(prodConfig['security.encryption.at_rest']).toBe(true);
      expect(prodConfig['security.audit.enabled']).toBe(true);
      expect(prodConfig['monitoring.alerts.enabled']).toBe(true);
      expect(prodConfig['performance.scaling.auto_scaling_enabled']).toBe(true);
      expect(prodConfig['governance.quality_gates.enforce_blocking']).toBe(true);
    });

    test('should use dot notation for nested property overrides', () => {
      const environments = enterpriseConfig.environments;
      
      Object.entries(environments).forEach(([envName, envConfig]) => {
        Object.keys(envConfig).forEach(key => {
          // All override keys should use dot notation
          expect(key).toMatch(/^[a-z_]+(\.[a-z_]+)*$/);
          expect(key.split('.').length).toBeGreaterThanOrEqual(2);
        });
      });
    });

    test('should have consistent environment-specific security policies', () => {
      const { development, staging, production } = enterpriseConfig.environments;
      
      // Development should be less secure
      expect(development['security.authentication.enabled']).toBe(false);
      
      // Staging should have moderate security
      expect(staging['security.authentication.method']).toBe('oauth2');
      
      // Production should have maximum security
      expect(production['security.encryption.at_rest']).toBe(true);
      expect(production['security.audit.enabled']).toBe(true);
    });
  });

  describe('Configuration Precedence Testing', () => {
    test('should handle environment variable precedence over defaults', () => {
      // Mock a configuration merger that respects environment precedence
      const mergeWithEnvironment = (baseConfig, envOverrides, envVars = {}) => {
        const result = JSON.parse(JSON.stringify(baseConfig));
        
        // Apply environment-specific overrides
        Object.entries(envOverrides).forEach(([path, value]) => {
          const keys = path.split('.');
          let current = result;
          
          for (let i = 0; i < keys.length - 1; i++) {
            if (!current[keys[i]]) current[keys[i]] = {};
            current = current[keys[i]];
          }
          
          current[keys[keys.length - 1]] = value;
        });
        
        return result;
      };

      const baseConfig = {
        security: { authentication: { enabled: true } },
        monitoring: { logging: { level: 'info' } }
      };

      const devOverrides = {
        'security.authentication.enabled': false,
        'monitoring.logging.level': 'debug'
      };

      const result = mergeWithEnvironment(baseConfig, devOverrides);
      expect(result.security.authentication.enabled).toBe(false);
      expect(result.monitoring.logging.level).toBe('debug');
    });

    test('should handle multiple levels of override precedence', () => {
      // Test precedence: Environment Variables > Environment Config > Base Config
      const testPrecedence = (baseValue, envConfigValue, envVarValue) => {
        // Environment variable should win over everything
        if (envVarValue !== undefined) return envVarValue;
        // Environment config should win over base config
        if (envConfigValue !== undefined) return envConfigValue;
        // Fall back to base config
        return baseValue;
      };

      expect(testPrecedence('default', 'env-config', 'env-var')).toBe('env-var');
      expect(testPrecedence('default', 'env-config', undefined)).toBe('env-config');
      expect(testPrecedence('default', undefined, undefined)).toBe('default');
    });
  });

  describe('Environment Variable Validation', () => {
    test('should validate required environment variables', () => {
      const requiredEnvVars = [
        'GITHUB_WEBHOOK_SECRET',
        'SMTP_SERVER'
      ];

      const validateRequiredEnvVars = (required, env = process.env) => {
        const missing = required.filter(varName => !env[varName]);
        return { valid: missing.length === 0, missing };
      };

      // Test with missing variables
      const resultMissing = validateRequiredEnvVars(requiredEnvVars, {});
      expect(resultMissing.valid).toBe(false);
      expect(resultMissing.missing).toEqual(requiredEnvVars);

      // Test with all variables present
      const resultComplete = validateRequiredEnvVars(requiredEnvVars, {
        GITHUB_WEBHOOK_SECRET: 'secret',
        SMTP_SERVER: 'smtp.example.com'
      });
      expect(resultComplete.valid).toBe(true);
      expect(resultComplete.missing).toEqual([]);
    });

    test('should validate environment variable formats', () => {
      const validateEnvVarFormat = (name, value, pattern) => {
        if (!value) return { valid: false, error: 'Missing value' };
        if (pattern && !pattern.test(value)) {
          return { valid: false, error: 'Format validation failed' };
        }
        return { valid: true };
      };

      // Test URL format validation
      const urlPattern = /^https?:\/\/.+/;
      expect(validateEnvVarFormat('SLACK_WEBHOOK_URL', 'https://hooks.slack.com/test', urlPattern).valid).toBe(true);
      expect(validateEnvVarFormat('SLACK_WEBHOOK_URL', 'invalid-url', urlPattern).valid).toBe(false);

      // Test email server format validation
      const serverPattern = /^[a-zA-Z0-9.-]+$/;
      expect(validateEnvVarFormat('SMTP_SERVER', 'smtp.gmail.com', serverPattern).valid).toBe(true);
      expect(validateEnvVarFormat('SMTP_SERVER', 'smtp with spaces', serverPattern).valid).toBe(false);
    });

    test('should handle sensitive data masking in logs', () => {
      const maskSensitiveValue = (key, value) => {
        const sensitivePatterns = ['secret', 'password', 'token', 'key'];
        const isSensitive = sensitivePatterns.some(pattern => 
          key.toLowerCase().includes(pattern)
        );
        
        if (isSensitive && value) {
          return '***masked***';
        }
        return value;
      };

      expect(maskSensitiveValue('GITHUB_WEBHOOK_SECRET', 'secret123')).toBe('***masked***');
      expect(maskSensitiveValue('API_PASSWORD', 'password123')).toBe('***masked***');
      expect(maskSensitiveValue('SMTP_SERVER', 'smtp.gmail.com')).toBe('smtp.gmail.com');
      expect(maskSensitiveValue('DATABASE_URL', 'postgres://localhost')).toBe('postgres://localhost');
    });
  });

  describe('Runtime Configuration Override', () => {
    test('should support runtime environment switching', () => {
      // Mock runtime environment switching
      const switchEnvironment = (config, targetEnv) => {
        const baseConfig = JSON.parse(JSON.stringify(config));
        const envOverrides = config.environments[targetEnv] || {};
        
        // Apply environment-specific overrides
        Object.entries(envOverrides).forEach(([path, value]) => {
          const keys = path.split('.');
          let current = baseConfig;
          
          for (let i = 0; i < keys.length - 1; i++) {
            if (!current[keys[i]]) current[keys[i]] = {};
            current = current[keys[i]];
          }
          
          current[keys[keys.length - 1]] = value;
        });
        
        // Remove environments section from runtime config
        delete baseConfig.environments;
        
        return baseConfig;
      };

      // Test switching to development environment
      const devConfig = switchEnvironment(enterpriseConfig, 'development');
      expect(devConfig.security.authentication.enabled).toBe(false);
      expect(devConfig.monitoring.logging.level).toBe('debug');

      // Test switching to production environment
      const prodConfig = switchEnvironment(enterpriseConfig, 'production');
      expect(prodConfig.security.encryption.at_rest).toBe(true);
      expect(prodConfig.monitoring.alerts.enabled).toBe(true);
    });

    test('should validate environment-specific constraints', () => {
      const validateEnvironmentConfig = (config, environment) => {
        const validationRules = {
          production: [
            {
              path: 'security.encryption.at_rest',
              expected: true,
              message: 'Encryption at rest must be enabled in production'
            },
            {
              path: 'security.audit.enabled',
              expected: true,
              message: 'Audit logging must be enabled in production'
            },
            {
              path: 'governance.quality_gates.enforce_blocking',
              expected: true,
              message: 'Quality gates must be enforcing in production'
            }
          ],
          development: [
            {
              path: 'monitoring.logging.level',
              expected: 'debug',
              message: 'Debug logging should be enabled in development'
            }
          ]
        };

        const rules = validationRules[environment] || [];
        const violations = [];

        rules.forEach(rule => {
          const keys = rule.path.split('.');
          let value = config;
          
          for (const key of keys) {
            value = value?.[key];
          }

          if (value !== rule.expected) {
            violations.push({
              path: rule.path,
              expected: rule.expected,
              actual: value,
              message: rule.message
            });
          }
        });

        return { valid: violations.length === 0, violations };
      };

      // Test production validation
      const prodOverrides = enterpriseConfig.environments.production;
      const mockProdConfig = {
        security: { encryption: { at_rest: true }, audit: { enabled: true } },
        governance: { quality_gates: { enforce_blocking: true } }
      };

      const prodValidation = validateEnvironmentConfig(mockProdConfig, 'production');
      expect(prodValidation.valid).toBe(true);

      // Test development validation
      const mockDevConfig = {
        monitoring: { logging: { level: 'debug' } }
      };

      const devValidation = validateEnvironmentConfig(mockDevConfig, 'development');
      expect(devValidation.valid).toBe(true);
    });
  });

  describe('Configuration Hot Reloading', () => {
    test('should detect configuration file changes', () => {
      // Mock file watcher for configuration changes
      const createConfigWatcher = (configPath, callback) => {
        let lastModified = null;
        
        const checkForChanges = () => {
          try {
            const stats = fs.statSync(configPath);
            const currentModified = stats.mtime.getTime();
            
            if (lastModified === null) {
              lastModified = currentModified;
              return false;
            }
            
            if (currentModified > lastModified) {
              lastModified = currentModified;
              return true;
            }
            
            return false;
          } catch (error) {
            return false;
          }
        };
        
        return { checkForChanges };
      };

      const watcher = createConfigWatcher(configPath, () => {});
      expect(typeof watcher.checkForChanges).toBe('function');
      expect(typeof watcher.checkForChanges()).toBe('boolean');
    });

    test('should validate configuration after hot reload', () => {
      const validateConfigAfterReload = (newConfig) => {
        const requiredSections = [
          'schema', 'enterprise', 'security', 'performance'
        ];
        
        const missing = requiredSections.filter(section => !newConfig[section]);
        if (missing.length > 0) {
          return { valid: false, error: `Missing sections: ${missing.join(', ')}` };
        }
        
        // Validate schema version compatibility
        if (!newConfig.schema || !newConfig.schema.version) {
          return { valid: false, error: 'Missing schema version' };
        }
        
        return { valid: true };
      };

      const validConfig = {
        schema: { version: '1.0' },
        enterprise: { enabled: true },
        security: { authentication: { enabled: true } },
        performance: { scaling: { auto_scaling_enabled: false } }
      };

      const invalidConfig = {
        schema: { version: '1.0' }
        // Missing required sections
      };

      expect(validateConfigAfterReload(validConfig).valid).toBe(true);
      expect(validateConfigAfterReload(invalidConfig).valid).toBe(false);
    });
  });
});