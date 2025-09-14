/**
 * Quality Validation Agent Test Suite
 * 
 * Comprehensive test suite for Quality Validation Domain (QV)
 * Tests all components and integration points.
 */

const { QualityValidationDomain, QualityValidationFactory } = require('../analyzer/enterprise/quality_validation');

class QualityValidationTestSuite {
  constructor() {
    this.testResults = [];
    this.testProject = {
      name: 'SPEK Test Project',
      files: [
        {
          path: 'src/test.js',
          content: `
            function exampleFunction() {
              // This is a test function with some complexity
              if (true) {
                for (let i = 0; i < 10; i++) {
                  console.log('Testing theater detection');
                }
              }
              return 'test';
            }
          `
        }
      ],
      claims: [
        {
          text: 'Improved performance by reducing response time',
          type: 'performance'
        },
        {
          text: 'Increased lines of code by 500 for better functionality',
          type: 'productivity'
        }
      ],
      evidence: {
        performance: {
          response_time_before: 200,
          response_time_after: 150,
          throughput: 1200
        },
        quality: {
          test_coverage: 85,
          code_quality_score: 90
        }
      }
    };
  }

  async runAllTests() {
    console.log('Starting Quality Validation Test Suite...');
    
    try {
      await this.testDomainInitialization();
      await this.testTheaterDetection();
      await this.testRealityValidation();
      await this.testQualityGateEnforcement();
      await this.testNASACompliance();
      await this.testDashboardGeneration();
      await this.testPerformanceTracking();
      await this.testIntegration();
      await this.testHealthCheck();
      await this.testComprehensiveValidation();
      
      this.printTestResults();
      
      return this.getTestSummary();
    } catch (error) {
      console.error('Test suite execution failed:', error);
      throw error;
    }
  }

  async testDomainInitialization() {
    console.log('Testing Quality Validation Domain initialization...');
    
    try {
      const qvDomain = new QualityValidationDomain({
        performanceTarget: 1.1,
        nasaComplianceTarget: 95.0,
        artifactsPath: '.claude/.artifacts/quality_validation_test/'
      });

      await qvDomain.initialize();
      
      this.addTestResult('Domain Initialization', true, 'Successfully initialized QV domain');
      
      // Test configuration
      const expectedConfig = qvDomain.config;
      this.assert(expectedConfig.performanceTarget === 1.1, 'Performance target configured correctly');
      this.assert(expectedConfig.nasaComplianceTarget === 95.0, 'NASA compliance target configured correctly');
      
      this.addTestResult('Configuration Validation', true, 'Configuration values set correctly');
      
    } catch (error) {
      this.addTestResult('Domain Initialization', false, error.message);
    }
  }

  async testTheaterDetection() {
    console.log('Testing theater detection engine...');
    
    try {
      const qvDomain = new QualityValidationDomain();
      await qvDomain.initialize();
      
      const theaterReport = await qvDomain.detectTheater(this.testProject, 'all');
      
      this.assert(theaterReport !== null, 'Theater detection returned results');
      this.assert(Array.isArray(theaterReport), 'Theater detection returned array');
      
      this.addTestResult('Theater Detection', true, `Detected ${theaterReport.length} potential theater patterns`);
      
      // Test specific pattern detection
      const theaterDetector = QualityValidationFactory.createTheaterDetector();
      const patterns = await theaterDetector.scanForTheater({
        codebase: this.testProject,
        domain: 'all',
        patterns: ['vanity-metrics', 'fake-complexity']
      });
      
      this.assert(Array.isArray(patterns), 'Pattern detection works correctly');
      this.addTestResult('Pattern Detection', true, 'Theater pattern detection functional');
      
    } catch (error) {
      this.addTestResult('Theater Detection', false, error.message);
    }
  }

  async testRealityValidation() {
    console.log('Testing reality validation system...');
    
    try {
      const qvDomain = new QualityValidationDomain();
      await qvDomain.initialize();
      
      const validationReport = await qvDomain.validateReality(
        this.testProject.claims,
        this.testProject.evidence
      );
      
      this.assert(validationReport !== null, 'Reality validation returned results');
      this.assert(validationReport.validated !== undefined, 'Validation results contain validated claims');
      this.assert(validationReport.rejected !== undefined, 'Validation results contain rejected claims');
      this.assert(validationReport.averageConfidence !== undefined, 'Average confidence calculated');
      
      this.addTestResult('Reality Validation', true, 
        `Validated ${validationReport.validated.length} claims, rejected ${validationReport.rejected.length} claims`);
      
      // Test vanity metric detection
      const vanityDetection = validationReport.vanityMetrics || [];
      this.addTestResult('Vanity Metric Detection', true, 
        `Detected ${vanityDetection.length} vanity metrics`);
      
    } catch (error) {
      this.addTestResult('Reality Validation', false, error.message);
    }
  }

  async testQualityGateEnforcement() {
    console.log('Testing quality gate enforcement...');
    
    try {
      const qvDomain = new QualityValidationDomain();
      await qvDomain.initialize();
      
      const gateResults = await qvDomain.enforceQualityGates(this.testProject);
      
      this.assert(gateResults !== null, 'Quality gate enforcement returned results');
      this.assert(Array.isArray(gateResults), 'Gate results is an array');
      
      let passedGates = 0;
      let failedGates = 0;
      
      for (const result of gateResults) {
        this.assert(result.gateName !== undefined, 'Gate result has name');
        this.assert(result.passed !== undefined, 'Gate result has pass status');
        this.assert(result.message !== undefined, 'Gate result has message');
        
        if (result.passed) {
          passedGates++;
        } else {
          failedGates++;
        }
      }
      
      this.addTestResult('Quality Gate Enforcement', true, 
        `${passedGates} gates passed, ${failedGates} gates failed`);
      
    } catch (error) {
      this.addTestResult('Quality Gate Enforcement', false, error.message);
    }
  }

  async testNASACompliance() {
    console.log('Testing NASA POT10 compliance monitoring...');
    
    try {
      const qvDomain = new QualityValidationDomain();
      await qvDomain.initialize();
      
      const complianceReport = await qvDomain.monitorCompliance(this.testProject);
      
      this.assert(complianceReport !== null, 'NASA compliance monitoring returned results');
      this.assert(complianceReport.overall !== undefined, 'Overall compliance score present');
      this.assert(complianceReport.categories !== undefined, 'Category scores present');
      this.assert(complianceReport.status !== undefined, 'Compliance status determined');
      
      this.addTestResult('NASA Compliance Monitoring', true, 
        `Compliance score: ${complianceReport.overall.toFixed(1)}%, Status: ${complianceReport.status}`);
      
      // Test compliance categories
      const categories = complianceReport.categories;
      const expectedCategories = ['Code Standards', 'Documentation', 'Testing', 'Security', 'Maintainability'];
      
      for (const category of expectedCategories) {
        this.assert(categories[category] !== undefined, `${category} score present`);
      }
      
      this.addTestResult('Compliance Categories', true, 'All required compliance categories assessed');
      
    } catch (error) {
      this.addTestResult('NASA Compliance Monitoring', false, error.message);
    }
  }

  async testDashboardGeneration() {
    console.log('Testing quality dashboard generation...');
    
    try {
      const qvDomain = new QualityValidationDomain();
      await qvDomain.initialize();
      
      const dashboardData = await qvDomain.generateDashboard();
      
      this.assert(dashboardData !== null, 'Dashboard generation returned results');
      this.assert(dashboardData.timestamp !== undefined, 'Dashboard has timestamp');
      this.assert(dashboardData.overview !== undefined, 'Dashboard has overview section');
      this.assert(dashboardData.widgets !== undefined, 'Dashboard has widgets');
      this.assert(dashboardData.charts !== undefined, 'Dashboard has charts');
      
      this.addTestResult('Dashboard Generation', true, 
        `Generated dashboard with ${dashboardData.widgets.length} widgets and ${dashboardData.charts.length} charts`);
      
      // Test specific dashboard components
      this.assert(Array.isArray(dashboardData.widgets), 'Widgets is an array');
      this.assert(Array.isArray(dashboardData.charts), 'Charts is an array');
      this.assert(Array.isArray(dashboardData.alerts), 'Alerts is an array');
      
      this.addTestResult('Dashboard Components', true, 'All dashboard components present');
      
    } catch (error) {
      this.addTestResult('Dashboard Generation', false, error.message);
    }
  }

  async testPerformanceTracking() {
    console.log('Testing performance tracking...');
    
    try {
      const performanceTracker = QualityValidationFactory.createPerformanceTracker(1.1);
      
      // Test performance session
      const sessionId = performanceTracker.start('test-operation');
      this.assert(sessionId !== undefined, 'Performance session started');
      
      // Simulate some work
      await this.sleep(10);
      
      const metrics = performanceTracker.end('test-operation', sessionId);
      this.assert(metrics !== null, 'Performance metrics captured');
      this.assert(metrics.duration > 0, 'Duration measured correctly');
      
      // Test overhead calculation
      const overhead = performanceTracker.getOverheadPercentage();
      this.assert(typeof overhead === 'number', 'Overhead percentage calculated');
      this.assert(overhead >= 0, 'Overhead percentage is non-negative');
      
      this.addTestResult('Performance Tracking', true, 
        `Performance overhead: ${overhead.toFixed(3)}%`);
      
      // Test performance report
      const report = performanceTracker.generateReport();
      this.assert(report.summary !== undefined, 'Performance report has summary');
      this.assert(report.metrics !== undefined, 'Performance report has metrics');
      
      this.addTestResult('Performance Reporting', true, 'Performance report generated successfully');
      
    } catch (error) {
      this.addTestResult('Performance Tracking', false, error.message);
    }
  }

  async testIntegration() {
    console.log('Testing integration capabilities...');
    
    try {
      const qvDomain = new QualityValidationDomain();
      await qvDomain.initialize();
      
      // Test integration with existing theater detection
      const existingConfig = {
        theaterPatterns: {
          customPattern: /custom.*pattern/i
        },
        thresholds: {
          confidence: 0.8
        },
        vanityMetrics: {
          customVanity: 'custom vanity metric'
        }
      };
      
      await qvDomain.integrateWithExistingTheaterDetection(existingConfig);
      
      this.addTestResult('Theater Detection Integration', true, 'Successfully integrated with existing configuration');
      
      // Test metrics retrieval
      const metrics = qvDomain.getMetrics();
      this.assert(metrics !== null, 'Quality metrics retrievable');
      
      const performanceMetrics = qvDomain.getPerformanceMetrics();
      this.assert(performanceMetrics !== null, 'Performance metrics retrievable');
      
      this.addTestResult('Metrics Integration', true, 'Metrics accessible through domain interface');
      
    } catch (error) {
      this.addTestResult('Integration', false, error.message);
    }
  }

  async testHealthCheck() {
    console.log('Testing health check functionality...');
    
    try {
      const qvDomain = new QualityValidationDomain();
      await qvDomain.initialize();
      
      const health = await qvDomain.healthCheck();
      
      this.assert(health !== null, 'Health check returned results');
      this.assert(health.status !== undefined, 'Health status present');
      this.assert(health.checks !== undefined, 'Health checks present');
      this.assert(health.timestamp !== undefined, 'Health check timestamp present');
      
      // Verify specific health checks
      this.assert(health.checks.initialization !== undefined, 'Initialization check present');
      this.assert(health.checks.performance !== undefined, 'Performance check present');
      this.assert(health.checks.components !== undefined, 'Components check present');
      
      this.addTestResult('Health Check', true, `System health: ${health.status}`);
      
      // Test component health
      const components = health.checks.components;
      const expectedComponents = ['theaterDetector', 'realityValidator', 'qualityGates', 'nasaMonitor', 'dashboard', 'alerting'];
      
      for (const component of expectedComponents) {
        this.assert(components[component] !== undefined, `${component} health check present`);
      }
      
      this.addTestResult('Component Health Checks', true, 'All component health checks present');
      
    } catch (error) {
      this.addTestResult('Health Check', false, error.message);
    }
  }

  async testComprehensiveValidation() {
    console.log('Testing comprehensive quality validation...');
    
    try {
      const qvDomain = new QualityValidationDomain();
      
      const validationReport = await qvDomain.validateQuality(this.testProject);
      
      this.assert(validationReport !== null, 'Comprehensive validation returned results');
      this.assert(validationReport.validationId !== undefined, 'Validation ID present');
      this.assert(validationReport.theaterDetection !== undefined, 'Theater detection results included');
      this.assert(validationReport.realityValidation !== undefined, 'Reality validation results included');
      this.assert(validationReport.qualityGates !== undefined, 'Quality gate results included');
      this.assert(validationReport.nasaCompliance !== undefined, 'NASA compliance results included');
      this.assert(validationReport.dashboard !== undefined, 'Dashboard results included');
      this.assert(validationReport.performanceMetrics !== undefined, 'Performance metrics included');
      this.assert(validationReport.overallStatus !== undefined, 'Overall status determined');
      
      this.addTestResult('Comprehensive Validation', true, 
        `Validation completed with status: ${validationReport.overallStatus}`);
      
      // Test report generation
      const report = await qvDomain.generateReport(this.testProject);
      this.assert(report !== null, 'Quality validation report generated');
      this.assert(report.domain === 'QV', 'Report domain correctly identified');
      
      this.addTestResult('Report Generation', true, 'Quality validation report generated successfully');
      
    } catch (error) {
      this.addTestResult('Comprehensive Validation', false, error.message);
    }
  }

  // Helper methods
  addTestResult(testName, passed, message) {
    this.testResults.push({
      test: testName,
      passed,
      message,
      timestamp: new Date().toISOString()
    });
  }

  assert(condition, message) {
    if (!condition) {
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  printTestResults() {
    console.log('\n=== Quality Validation Test Results ===');
    
    let passedCount = 0;
    let failedCount = 0;
    
    for (const result of this.testResults) {
      const status = result.passed ? '[OK] PASS' : '[FAIL] FAIL';
      console.log(`${status} ${result.test}: ${result.message}`);
      
      if (result.passed) {
        passedCount++;
      } else {
        failedCount++;
      }
    }
    
    console.log(`\nTotal Tests: ${this.testResults.length}`);
    console.log(`Passed: ${passedCount}`);
    console.log(`Failed: ${failedCount}`);
    console.log(`Success Rate: ${((passedCount / this.testResults.length) * 100).toFixed(1)}%`);
  }

  getTestSummary() {
    const passedCount = this.testResults.filter(r => r.passed).length;
    const totalCount = this.testResults.length;
    
    return {
      totalTests: totalCount,
      passedTests: passedCount,
      failedTests: totalCount - passedCount,
      successRate: (passedCount / totalCount) * 100,
      results: this.testResults,
      status: passedCount === totalCount ? 'ALL_PASSED' : 'SOME_FAILED'
    };
  }
}

// Export test suite
module.exports = QualityValidationTestSuite;

// Run tests if called directly
if (require.main === module) {
  const testSuite = new QualityValidationTestSuite();
  testSuite.runAllTests()
    .then(summary => {
      console.log('\nTest suite completed successfully!');
      process.exit(summary.status === 'ALL_PASSED' ? 0 : 1);
    })
    .catch(error => {
      console.error('Test suite failed:', error);
      process.exit(1);
    });
}