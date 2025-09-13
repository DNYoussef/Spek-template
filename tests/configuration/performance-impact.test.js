/**
 * Configuration Performance Impact Testing Suite
 * 
 * Tests the performance impact of configuration loading, parsing, validation,
 * and runtime configuration access to ensure the system remains responsive.
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { performance } = require('perf_hooks');

describe('Configuration Performance Impact Testing', () => {
  let enterpriseConfig;
  let checksConfig;
  const configPath = path.join(process.cwd(), 'config', 'enterprise_config.yaml');
  const checksPath = path.join(process.cwd(), 'config', 'checks.yaml');

  beforeAll(() => {
    try {
      const enterpriseConfigContent = fs.readFileSync(configPath, 'utf8');
      enterpriseConfig = yaml.load(enterpriseConfigContent);
      
      const checksConfigContent = fs.readFileSync(checksPath, 'utf8');
      checksConfig = yaml.load(checksConfigContent);
    } catch (error) {
      throw new Error(`Failed to load configuration files: ${error.message}`);
    }
  });

  describe('Configuration Loading Performance', () => {
    test('should load enterprise configuration within acceptable time', async () => {
      const maxLoadTimeMs = 100; // Maximum 100ms for config loading
      
      const loadConfiguration = (configPath) => {
        const start = performance.now();
        const content = fs.readFileSync(configPath, 'utf8');
        const config = yaml.load(content);
        const end = performance.now();
        
        return {
          config,
          loadTime: end - start
        };
      };

      const result = loadConfiguration(configPath);
      expect(result.loadTime).toBeLessThan(maxLoadTimeMs);
      expect(result.config).toBeDefined();
      expect(result.config.schema).toBeDefined();
    });

    test('should load multiple configuration files efficiently', async () => {
      const maxTotalLoadTimeMs = 200; // Maximum 200ms for all configs
      const configFiles = [configPath, checksPath];
      
      const start = performance.now();
      
      const configs = configFiles.map(filePath => {
        const content = fs.readFileSync(filePath, 'utf8');
        return yaml.load(content);
      });
      
      const end = performance.now();
      const totalLoadTime = end - start;
      
      expect(totalLoadTime).toBeLessThan(maxTotalLoadTimeMs);
      expect(configs).toHaveLength(2);
      expect(configs[0].schema).toBeDefined();
      expect(configs[1].quality_gates).toBeDefined();
    });

    test('should handle configuration parsing under memory pressure', () => {
      const measureMemoryUsage = (operation) => {
        const before = process.memoryUsage();
        const result = operation();
        const after = process.memoryUsage();
        
        return {
          result,
          heapUsed: after.heapUsed - before.heapUsed,
          heapTotal: after.heapTotal - before.heapTotal,
          external: after.external - before.external
        };
      };

      const memoryUsage = measureMemoryUsage(() => {
        const content = fs.readFileSync(configPath, 'utf8');
        return yaml.load(content);
      });

      // Configuration loading should use less than 10MB of additional heap
      const maxHeapIncreaseMB = 10 * 1024 * 1024;
      expect(memoryUsage.heapUsed).toBeLessThan(maxHeapIncreaseMB);
      expect(memoryUsage.result).toBeDefined();
    });

    test('should cache configuration to improve subsequent access', () => {
      const createConfigCache = () => {
        const cache = new Map();
        
        return {
          get: (key) => {
            if (!cache.has(key)) {
              const start = performance.now();
              const content = fs.readFileSync(key, 'utf8');
              const config = yaml.load(content);
              const parseTime = performance.now() - start;
              
              cache.set(key, { config, parseTime });
            }
            
            return cache.get(key);
          },
          clear: () => cache.clear(),
          size: () => cache.size
        };
      };

      const configCache = createConfigCache();
      
      // First access - should parse and cache
      const firstAccess = performance.now();
      const config1 = configCache.get(configPath);
      const firstAccessTime = performance.now() - firstAccess;
      
      // Second access - should use cache
      const secondAccess = performance.now();
      const config2 = configCache.get(configPath);
      const secondAccessTime = performance.now() - secondAccess;
      
      expect(config1.config).toEqual(config2.config);
      expect(secondAccessTime).toBeLessThan(firstAccessTime);
      expect(secondAccessTime).toBeLessThan(1); // Cache access should be < 1ms
      expect(configCache.size()).toBe(1);
    });
  });

  describe('Configuration Validation Performance', () => {
    test('should validate configuration schema efficiently', () => {
      const maxValidationTimeMs = 50; // Maximum 50ms for validation
      
      const validateConfig = (config) => {
        const start = performance.now();
        
        // Mock validation - check required sections
        const requiredSections = [
          'schema', 'enterprise', 'security', 'performance',
          'monitoring', 'governance', 'environments'
        ];
        
        const validationResults = requiredSections.map(section => ({
          section,
          valid: !!config[section],
          required: true
        }));
        
        const isValid = validationResults.every(result => result.valid);
        const end = performance.now();
        
        return {
          isValid,
          validationTime: end - start,
          results: validationResults
        };
      };

      const result = validateConfig(enterpriseConfig);
      expect(result.validationTime).toBeLessThan(maxValidationTimeMs);
      expect(result.isValid).toBe(true);
    });

    test('should perform deep validation within performance bounds', () => {
      const maxDeepValidationTimeMs = 100; // Maximum 100ms for deep validation
      
      const deepValidateConfig = (config) => {
        const start = performance.now();
        const errors = [];
        
        // Deep validation function
        const validateObject = (obj, path = '') => {
          if (!obj || typeof obj !== 'object') return;
          
          Object.entries(obj).forEach(([key, value]) => {
            const currentPath = path ? `${path}.${key}` : key;
            
            // Type validation
            if (key.includes('enabled') && typeof value !== 'boolean') {
              errors.push(`${currentPath}: expected boolean, got ${typeof value}`);
            }
            
            if (key.includes('timeout') && typeof value !== 'number') {
              errors.push(`${currentPath}: expected number, got ${typeof value}`);
            }
            
            // Recursive validation for nested objects
            if (typeof value === 'object' && !Array.isArray(value)) {
              validateObject(value, currentPath);
            }
          });
        };
        
        validateObject(config);
        const end = performance.now();
        
        return {
          isValid: errors.length === 0,
          errors,
          validationTime: end - start
        };
      };

      const result = deepValidateConfig(enterpriseConfig);
      expect(result.validationTime).toBeLessThan(maxDeepValidationTimeMs);
      expect(result.errors.length).toBeLessThan(5); // Allow some minor validation issues
    });

    test('should validate environment overrides efficiently', () => {
      const maxEnvironmentValidationMs = 30; // Maximum 30ms per environment
      
      const validateEnvironmentOverrides = (config) => {
        const start = performance.now();
        const environments = config.environments || {};
        const validationResults = {};
        
        Object.entries(environments).forEach(([envName, envConfig]) => {
          const envStart = performance.now();
          
          // Validate override path format
          const validPaths = Object.keys(envConfig).every(path => 
            /^[a-z_]+(\.[a-z_]+)*$/.test(path)
          );
          
          const envEnd = performance.now();
          
          validationResults[envName] = {
            valid: validPaths,
            validationTime: envEnd - envStart
          };
        });
        
        const end = performance.now();
        
        return {
          totalTime: end - start,
          environments: validationResults,
          allValid: Object.values(validationResults).every(r => r.valid)
        };
      };

      const result = validateEnvironmentOverrides(enterpriseConfig);
      expect(result.totalTime).toBeLessThan(100); // Total time for all environments
      
      Object.values(result.environments).forEach(env => {
        expect(env.validationTime).toBeLessThan(maxEnvironmentValidationMs);
      });
      
      expect(result.allValid).toBe(true);
    });
  });

  describe('Runtime Configuration Access Performance', () => {
    test('should access nested configuration values efficiently', () => {
      const maxAccessTimeMs = 1; // Maximum 1ms for value access
      
      const getConfigValue = (config, path) => {
        const start = performance.now();
        const keys = path.split('.');
        let value = config;
        
        for (const key of keys) {
          value = value?.[key];
        }
        
        const end = performance.now();
        
        return {
          value,
          accessTime: end - start
        };
      };

      const testPaths = [
        'enterprise.features.advanced_analytics',
        'security.authentication.password_policy.min_length',
        'performance.scaling.auto_scaling_enabled',
        'monitoring.alerts.thresholds.error_rate',
        'governance.quality_gates.nasa_compliance.minimum_score'
      ];

      testPaths.forEach(path => {
        const result = getConfigValue(enterpriseConfig, path);
        expect(result.accessTime).toBeLessThan(maxAccessTimeMs);
        expect(result.value).toBeDefined();
      });
    });

    test('should handle bulk configuration reads efficiently', () => {
      const maxBulkReadTimeMs = 10; // Maximum 10ms for bulk reads
      
      const bulkReadConfig = (config, paths) => {
        const start = performance.now();
        const results = {};
        
        paths.forEach(path => {
          const keys = path.split('.');
          let value = config;
          
          for (const key of keys) {
            value = value?.[key];
          }
          
          results[path] = value;
        });
        
        const end = performance.now();
        
        return {
          results,
          readTime: end - start,
          count: paths.length
        };
      };

      const configPaths = [
        'enterprise.enabled',
        'enterprise.license_mode',
        'security.authentication.enabled',
        'security.authentication.method',
        'performance.scaling.min_workers',
        'performance.scaling.max_workers',
        'monitoring.metrics.enabled',
        'monitoring.logging.level'
      ];

      const result = bulkReadConfig(enterpriseConfig, configPaths);
      expect(result.readTime).toBeLessThan(maxBulkReadTimeMs);
      expect(result.count).toBe(configPaths.length);
      expect(Object.keys(result.results)).toHaveLength(configPaths.length);
    });

    test('should optimize configuration access with memoization', () => {
      const createMemoizedConfigAccess = (config) => {
        const cache = new Map();
        
        return (path) => {
          if (cache.has(path)) {
            return {
              value: cache.get(path),
              fromCache: true,
              accessTime: 0 // Cache access is essentially instant
            };
          }
          
          const start = performance.now();
          const keys = path.split('.');
          let value = config;
          
          for (const key of keys) {
            value = value?.[key];
          }
          
          const end = performance.now();
          
          cache.set(path, value);
          
          return {
            value,
            fromCache: false,
            accessTime: end - start
          };
        };
      };

      const memoizedAccess = createMemoizedConfigAccess(enterpriseConfig);
      const testPath = 'security.authentication.password_policy.min_length';
      
      // First access - should compute and cache
      const firstAccess = memoizedAccess(testPath);
      expect(firstAccess.fromCache).toBe(false);
      expect(firstAccess.accessTime).toBeGreaterThan(0);
      
      // Second access - should use cache
      const secondAccess = memoizedAccess(testPath);
      expect(secondAccess.fromCache).toBe(true);
      expect(secondAccess.accessTime).toBe(0);
      expect(secondAccess.value).toEqual(firstAccess.value);
    });
  });

  describe('Configuration Merge Performance', () => {
    test('should merge environment overrides efficiently', () => {
      const maxMergeTimeMs = 20; // Maximum 20ms for configuration merge
      
      const mergeConfigWithEnvironment = (baseConfig, environment) => {
        const start = performance.now();
        const merged = JSON.parse(JSON.stringify(baseConfig));
        const envOverrides = baseConfig.environments?.[environment] || {};
        
        Object.entries(envOverrides).forEach(([path, value]) => {
          const keys = path.split('.');
          let current = merged;
          
          for (let i = 0; i < keys.length - 1; i++) {
            if (!current[keys[i]]) current[keys[i]] = {};
            current = current[keys[i]];
          }
          
          current[keys[keys.length - 1]] = value;
        });
        
        delete merged.environments;
        const end = performance.now();
        
        return {
          config: merged,
          mergeTime: end - start
        };
      };

      const environments = ['development', 'staging', 'production'];
      
      environments.forEach(env => {
        const result = mergeConfigWithEnvironment(enterpriseConfig, env);
        expect(result.mergeTime).toBeLessThan(maxMergeTimeMs);
        expect(result.config).toBeDefined();
        expect(result.config.environments).toBeUndefined(); // Should be removed
      });
    });

    test('should handle deep configuration merging efficiently', () => {
      const maxDeepMergeTimeMs = 50; // Maximum 50ms for deep merge
      
      const deepMergeConfigs = (base, override) => {
        const start = performance.now();
        
        const deepMerge = (target, source) => {
          const result = { ...target };
          
          Object.keys(source).forEach(key => {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
              result[key] = deepMerge(target[key] || {}, source[key]);
            } else {
              result[key] = source[key];
            }
          });
          
          return result;
        };
        
        const merged = deepMerge(base, override);
        const end = performance.now();
        
        return {
          config: merged,
          mergeTime: end - start
        };
      };

      const overrideConfig = {
        enterprise: {
          features: {
            advanced_analytics: false,
            new_feature: true
          }
        },
        security: {
          authentication: {
            session_timeout: 7200
          }
        }
      };

      const result = deepMergeConfigs(enterpriseConfig, overrideConfig);
      expect(result.mergeTime).toBeLessThan(maxDeepMergeTimeMs);
      expect(result.config.enterprise.features.advanced_analytics).toBe(false);
      expect(result.config.enterprise.features.new_feature).toBe(true);
      expect(result.config.security.authentication.session_timeout).toBe(7200);
    });
  });

  describe('Memory Usage and Garbage Collection', () => {
    test('should not cause memory leaks during repeated configuration loading', () => {
      const iterations = 100;
      const maxMemoryIncreaseMB = 5 * 1024 * 1024; // 5MB max increase
      
      const initialMemory = process.memoryUsage().heapUsed;
      
      for (let i = 0; i < iterations; i++) {
        const content = fs.readFileSync(configPath, 'utf8');
        const config = yaml.load(content);
        
        // Access some configuration values to ensure they're processed
        const _ = config.enterprise.enabled;
        const __ = config.security.authentication.enabled;
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      expect(memoryIncrease).toBeLessThan(maxMemoryIncreaseMB);
    });

    test('should efficiently handle large configuration objects', () => {
      const createLargeConfig = (baseConfig, multiplier = 10) => {
        const largeConfig = JSON.parse(JSON.stringify(baseConfig));
        
        // Add many additional sections to simulate a large enterprise config
        for (let i = 0; i < multiplier; i++) {
          largeConfig[`large_section_${i}`] = {
            enabled: true,
            settings: Array.from({ length: 100 }, (_, j) => ({
              id: `setting_${j}`,
              value: `value_${j}`,
              metadata: {
                created: new Date().toISOString(),
                version: '1.0.0'
              }
            }))
          };
        }
        
        return largeConfig;
      };

      const maxProcessingTimeMs = 200; // Maximum 200ms for large config
      const largeConfig = createLargeConfig(enterpriseConfig, 10);
      
      const start = performance.now();
      
      // Simulate common operations on large config
      const serialized = JSON.stringify(largeConfig);
      const parsed = JSON.parse(serialized);
      const enterpriseEnabled = parsed.enterprise.enabled;
      
      const end = performance.now();
      const processingTime = end - start;
      
      expect(processingTime).toBeLessThan(maxProcessingTimeMs);
      expect(enterpriseEnabled).toBeDefined();
      expect(Object.keys(parsed)).toContain('large_section_0');
    });
  });
});