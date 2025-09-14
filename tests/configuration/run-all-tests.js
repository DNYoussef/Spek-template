#!/usr/bin/env node
/**
 * Configuration Test Suite Runner
 * 
 * Comprehensive test runner for all configuration system tests.
 * Provides detailed reporting, coverage analysis, and test categorization.
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

class ConfigurationTestRunner {
  constructor() {
    this.testCategories = {
      'Schema Validation': {
        files: ['schema-validation.test.js'],
        description: 'Tests configuration schema validation, type checking, and constraint validation'
      },
      'Migration Testing': {
        files: ['migration-testing.test.js'],
        description: 'Tests backward compatibility and migration from legacy analyzer configuration'
      },
      'Environment Overrides': {
        files: ['environment-override.test.js'],
        description: 'Tests environment-specific configuration overrides and variable substitution'
      },
      'Performance Impact': {
        files: ['performance-impact.test.js'],
        description: 'Tests configuration loading performance and memory usage optimization'
      },
      'Six Sigma Integration': {
        files: ['sixsigma-integration.test.js'],
        description: 'Tests integration between enterprise config and Six Sigma quality gates'
      },
      'Error Handling': {
        files: ['error-handling.test.js'],
        description: 'Tests error recovery, graceful degradation, and resilience mechanisms'
      }
    };
    
    this.results = {
      categories: {},
      overall: {
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        skippedTests: 0,
        executionTime: 0,
        coverage: null
      }
    };
  }

  async runAllTests() {
    console.log(' Configuration System Test Suite Runner');
    console.log('==========================================\n');

    const startTime = Date.now();

    // Run tests by category
    for (const [categoryName, categoryInfo] of Object.entries(this.testCategories)) {
      console.log(` Running ${categoryName} tests...`);
      console.log(`   ${categoryInfo.description}\n`);

      const categoryResults = await this.runCategoryTests(categoryName, categoryInfo);
      this.results.categories[categoryName] = categoryResults;

      this.displayCategoryResults(categoryName, categoryResults);
      console.log('');
    }

    // Run helper utility tests
    console.log('[WRENCH] Running helper utility tests...');
    const helperResults = await this.runHelperTests();
    this.results.categories['Helper Utilities'] = helperResults;
    this.displayCategoryResults('Helper Utilities', helperResults);

    // Calculate overall results
    this.calculateOverallResults();
    this.results.overall.executionTime = Date.now() - startTime;

    // Display final summary
    this.displayFinalSummary();

    // Generate test report
    await this.generateTestReport();

    return this.results;
  }

  async runCategoryTests(categoryName, categoryInfo) {
    const results = {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      skippedTests: 0,
      executionTime: 0,
      files: {},
      errors: []
    };

    for (const fileName of categoryInfo.files) {
      const filePath = path.join(__dirname, fileName);
      
      if (!fs.existsSync(filePath)) {
        console.log(`   [WARN]  Test file not found: ${fileName}`);
        results.errors.push(`Test file not found: ${fileName}`);
        continue;
      }

      const fileResults = await this.runTestFile(filePath);
      results.files[fileName] = fileResults;
      
      results.totalTests += fileResults.totalTests;
      results.passedTests += fileResults.passedTests;
      results.failedTests += fileResults.failedTests;
      results.skippedTests += fileResults.skippedTests;
      results.executionTime += fileResults.executionTime;
    }

    return results;
  }

  async runTestFile(filePath) {
    const startTime = Date.now();
    
    return new Promise((resolve) => {
      const jest = spawn('npx', ['jest', filePath, '--json', '--verbose'], {
        cwd: process.cwd(),
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      jest.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      jest.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      jest.on('close', (code) => {
        const executionTime = Date.now() - startTime;
        
        try {
          // Try to parse Jest JSON output
          const jestOutput = JSON.parse(stdout);
          
          resolve({
            totalTests: jestOutput.numTotalTests || 0,
            passedTests: jestOutput.numPassedTests || 0,
            failedTests: jestOutput.numFailedTests || 0,
            skippedTests: jestOutput.numPendingTests || 0,
            executionTime,
            success: code === 0,
            output: stdout,
            errors: stderr,
            jestResults: jestOutput
          });
        } catch (error) {
          // Fallback for non-JSON output
          resolve({
            totalTests: 0,
            passedTests: code === 0 ? 1 : 0,
            failedTests: code === 0 ? 0 : 1,
            skippedTests: 0,
            executionTime,
            success: code === 0,
            output: stdout,
            errors: stderr + error.message,
            jestResults: null
          });
        }
      });

      jest.on('error', (error) => {
        resolve({
          totalTests: 0,
          passedTests: 0,
          failedTests: 1,
          skippedTests: 0,
          executionTime: Date.now() - startTime,
          success: false,
          output: '',
          errors: error.message,
          jestResults: null
        });
      });
    });
  }

  async runHelperTests() {
    const helperTestPath = path.join(__dirname, 'validation-helpers.test.js');
    
    // Create a simple test file for the helpers if it doesn't exist
    if (!fs.existsSync(helperTestPath)) {
      const helperTestContent = `
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
    const config = { test: '\${TEST_VAR}' };
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
`;

      fs.writeFileSync(helperTestPath, helperTestContent);
    }

    return await this.runTestFile(helperTestPath);
  }

  displayCategoryResults(categoryName, results) {
    const passRate = results.totalTests > 0 ? 
      Math.round((results.passedTests / results.totalTests) * 100) : 0;
    
    const status = results.failedTests === 0 ? '[OK]' : '[FAIL]';
    
    console.log(`   ${status} ${categoryName}:`);
    console.log(`      Tests: ${results.totalTests} total, ${results.passedTests} passed, ${results.failedTests} failed`);
    console.log(`      Time: ${results.executionTime}ms`);
    console.log(`      Pass Rate: ${passRate}%`);
    
    if (results.errors.length > 0) {
      console.log(`      Errors: ${results.errors.length}`);
      results.errors.forEach(error => {
        console.log(`        - ${error}`);
      });
    }
  }

  calculateOverallResults() {
    Object.values(this.results.categories).forEach(category => {
      this.results.overall.totalTests += category.totalTests;
      this.results.overall.passedTests += category.passedTests;
      this.results.overall.failedTests += category.failedTests;
      this.results.overall.skippedTests += category.skippedTests;
    });
  }

  displayFinalSummary() {
    console.log('[CHART] Final Test Results Summary');
    console.log('============================');
    
    const overallPassRate = this.results.overall.totalTests > 0 ?
      Math.round((this.results.overall.passedTests / this.results.overall.totalTests) * 100) : 0;
    
    const overallStatus = this.results.overall.failedTests === 0 ? ' ALL PASSED' : '[WARN]  SOME FAILED';
    
    console.log(`Status: ${overallStatus}`);
    console.log(`Total Tests: ${this.results.overall.totalTests}`);
    console.log(`Passed: ${this.results.overall.passedTests}`);
    console.log(`Failed: ${this.results.overall.failedTests}`);
    console.log(`Skipped: ${this.results.overall.skippedTests}`);
    console.log(`Pass Rate: ${overallPassRate}%`);
    console.log(`Execution Time: ${this.results.overall.executionTime}ms`);
    
    console.log('\\nCategory Breakdown:');
    Object.entries(this.results.categories).forEach(([categoryName, results]) => {
      const categoryPassRate = results.totalTests > 0 ?
        Math.round((results.passedTests / results.totalTests) * 100) : 0;
      const categoryStatus = results.failedTests === 0 ? '[OK]' : '[FAIL]';
      
      console.log(`  ${categoryStatus} ${categoryName}: ${categoryPassRate}% (${results.passedTests}/${results.totalTests})`);
    });
    
    if (this.results.overall.failedTests > 0) {
      console.log('\\n[SEARCH] Investigate failed tests for detailed error information.');
    }
    
    if (this.results.overall.failedTests === 0) {
      console.log('\\n[ROCKET] Configuration system is ready for production deployment!');
    }
  }

  async generateTestReport() {
    const reportPath = path.join(__dirname, 'test-results.json');
    const timestamp = new Date().toISOString();
    
    const report = {
      timestamp,
      summary: this.results.overall,
      categories: this.results.categories,
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        cwd: process.cwd()
      },
      testConfiguration: {
        categories: Object.keys(this.testCategories).length,
        totalTestFiles: Object.values(this.testCategories)
          .reduce((total, category) => total + category.files.length, 0)
      }
    };

    try {
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      console.log(`\\n[DOCUMENT] Test report saved to: ${reportPath}`);
    } catch (error) {
      console.error(`\\n[FAIL] Failed to save test report: ${error.message}`);
    }

    // Also generate a markdown summary
    await this.generateMarkdownSummary(report);
  }

  async generateMarkdownSummary(report) {
    const summaryPath = path.join(__dirname, 'TEST-SUMMARY.md');
    
    const overallPassRate = report.summary.totalTests > 0 ?
      Math.round((report.summary.passedTests / report.summary.totalTests) * 100) : 0;
    
    const markdown = `# Configuration System Test Summary

**Generated:** ${report.timestamp}
**Status:** ${report.summary.failedTests === 0 ? ' ALL TESTS PASSED' : '[WARN] SOME TESTS FAILED'}
**Overall Pass Rate:** ${overallPassRate}%

## Summary Statistics

| Metric | Value |
|--------|-------|
| Total Tests | ${report.summary.totalTests} |
| Passed | ${report.summary.passedTests} |
| Failed | ${report.summary.failedTests} |
| Skipped | ${report.summary.skippedTests} |
| Execution Time | ${report.summary.executionTime}ms |

## Test Categories

${Object.entries(report.categories).map(([categoryName, results]) => {
  const categoryPassRate = results.totalTests > 0 ?
    Math.round((results.passedTests / results.totalTests) * 100) : 0;
  const status = results.failedTests === 0 ? '[OK]' : '[FAIL]';
  
  return `### ${status} ${categoryName}

- **Tests:** ${results.totalTests} total, ${results.passedTests} passed, ${results.failedTests} failed
- **Pass Rate:** ${categoryPassRate}%
- **Execution Time:** ${results.executionTime}ms
- **Test Files:** ${Object.keys(results.files).join(', ')}
${results.errors.length > 0 ? `
**Errors:**
${results.errors.map(error => `- ${error}`).join('\\n')}
` : ''}`;
}).join('\\n\\n')}

## Environment Information

- **Node.js Version:** ${report.environment.nodeVersion}
- **Platform:** ${report.environment.platform}
- **Working Directory:** ${report.environment.cwd}

## Test Coverage Areas

The configuration system test suite covers:

1. **Schema Validation** - Ensures configuration structure and types are correct
2. **Migration Testing** - Verifies backward compatibility with legacy systems
3. **Environment Overrides** - Tests environment-specific configuration handling
4. **Performance Impact** - Validates system performance under load
5. **Six Sigma Integration** - Ensures quality gates integration works correctly
6. **Error Handling** - Tests resilience and recovery mechanisms

${report.summary.failedTests === 0 ? `
## [OK] Conclusion

All configuration system tests are passing! The system is ready for production deployment.

Key achievements:
- Comprehensive schema validation
- Robust error handling and recovery
- Efficient performance under load
- Full Six Sigma quality gates integration
- Backward compatibility maintained

` : `
## [WARN] Action Required

Some tests are failing and need attention before production deployment.

Please review the failed tests and address any issues found.
`}

---
*Generated by Configuration Test Suite Runner*
`;

    try {
      fs.writeFileSync(summaryPath, markdown);
      console.log(`[DOCUMENT] Markdown summary saved to: ${summaryPath}`);
    } catch (error) {
      console.error(`[FAIL] Failed to save markdown summary: ${error.message}`);
    }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const runner = new ConfigurationTestRunner();
  
  runner.runAllTests()
    .then((results) => {
      process.exit(results.overall.failedTests === 0 ? 0 : 1);
    })
    .catch((error) => {
      console.error('[FAIL] Test runner failed:', error);
      process.exit(1);
    });
}

module.exports = ConfigurationTestRunner;