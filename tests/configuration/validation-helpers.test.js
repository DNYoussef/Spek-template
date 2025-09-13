
const {
  ConfigSchemaValidator,
  ConfigFileUtils,
  EnvVarUtils,
  ConfigMerger,
  PerformanceUtils,
  TestDataGenerator
} = require('./validation-helpers');

describe('Configuration Helper Utilities', () => {
  test('ConfigSchemaValidator should be instantiable', () => {
    const validator = new ConfigSchemaValidator();
    expect(validator).toBeDefined();
    expect(validator.validate).toBeInstanceOf(Function);
  });

  test('ConfigFileUtils should have required methods', () => {
    expect(ConfigFileUtils.loadYamlFile).toBeInstanceOf(Function);
    expect(ConfigFileUtils.validateFileExists).toBeInstanceOf(Function);
    expect(ConfigFileUtils.createTempConfigFile).toBeInstanceOf(Function);
  });

  test('EnvVarUtils should handle environment variables', () => {
    const config = { test: '${TEST_VAR}' };
    const result = EnvVarUtils.substituteEnvironmentVariables(config, { TEST_VAR: 'replaced' });
    expect(result.test).toBe('replaced');
  });

  test('ConfigMerger should merge configurations', () => {
    const base = { a: 1, b: { c: 2 } };
    const override = { b: { d: 3 } };
    const result = ConfigMerger.deepMerge(base, override);
    expect(result.b.c).toBe(2);
    expect(result.b.d).toBe(3);
  });

  test('PerformanceUtils should measure execution time', () => {
    const result = PerformanceUtils.measureExecutionTime(() => {
      return 'test';
    });
    expect(result.result).toBe('test');
    expect(result.executionTimeMs).toBeGreaterThan(0);
  });

  test('TestDataGenerator should generate valid configs', () => {
    const config = TestDataGenerator.generateValidEnterpriseConfig();
    expect(config.schema).toBeDefined();
    expect(config.enterprise).toBeDefined();
    expect(config.security).toBeDefined();
  });
});
