/**
 * Quality Validation Domain - Entry Point
 * 
 * Main entry point for the Quality Validation Agent (Domain QV)
 * Integrates all quality validation components and provides unified interface.
 */

const QualityValidator = require('./quality_validator');
const TheaterDetectionEngine = require('./engines/theater_detection_engine');
const RealityValidationSystem = require('./validators/reality_validation_system');
const QualityGateEnforcer = require('./validators/quality_gate_enforcer');
const NASAComplianceMonitor = require('./monitors/nasa_compliance_monitor');
const QualityDashboard = require('./dashboards/quality_dashboard');
const QualityAlerting = require('./monitors/quality_alerting');
const PerformanceTracker = require('./utils/performance_tracker');

/**
 * Quality Validation Domain Configuration
 */
const QV_CONFIG = {
  domain: 'QV',
  version: '1.0.0',
  performanceTarget: 1.1, // <1.1% overhead
  nasaComplianceTarget: 95.0, // 95%+ compliance
  artifactsPath: '.claude/.artifacts/quality_validation/',
  realTimeMonitoring: true,
  integrationMode: 'enterprise'
};

/**
 * Quality Validation Factory
 * Creates and configures quality validation components
 */
class QualityValidationFactory {
  static create(config = {}) {
    const finalConfig = { ...QV_CONFIG, ...config };
    
    return new QualityValidator(finalConfig);
  }

  static createTheaterDetector(config = {}) {
    return new TheaterDetectionEngine(config);
  }

  static createRealityValidator(config = {}) {
    return new RealityValidationSystem(config);
  }

  static createQualityGateEnforcer(config = {}) {
    return new QualityGateEnforcer(config);
  }

  static createNASAMonitor(targetScore = 95.0) {
    return new NASAComplianceMonitor(targetScore);
  }

  static createDashboard(artifactsPath = QV_CONFIG.artifactsPath) {
    return new QualityDashboard(artifactsPath);
  }

  static createAlertingSystem(config = {}) {
    return new QualityAlerting(config);
  }

  static createPerformanceTracker(overheadLimit = QV_CONFIG.performanceTarget) {
    return new PerformanceTracker(overheadLimit);
  }
}

/**
 * Quality Validation Domain Interface
 * Provides unified interface for all quality validation operations
 */
class QualityValidationDomain {
  constructor(config = {}) {
    this.config = { ...QV_CONFIG, ...config };
    this.validator = QualityValidationFactory.create(this.config);
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    console.log('Initializing Quality Validation Domain...');
    
    try {
      // Ensure artifacts directory exists
      await this.ensureArtifactsDirectory();
      
      // Initialize performance baseline
      this.validator.performanceTracker.setBaseline();
      
      console.log('Quality Validation Domain initialized successfully');
      console.log(`Performance target: <${this.config.performanceTarget}% overhead`);
      console.log(`NASA compliance target: ${this.config.nasaComplianceTarget}%`);
      console.log(`Artifacts path: ${this.config.artifactsPath}`);
      
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize Quality Validation Domain:', error.message);
      throw error;
    }
  }

  async ensureArtifactsDirectory() {
    const fs = require('fs').promises;
    const path = require('path');
    
    try {
      await fs.access(this.config.artifactsPath);
    } catch {
      await fs.mkdir(this.config.artifactsPath, { recursive: true });
      console.log(`Created artifacts directory: ${this.config.artifactsPath}`);
    }
  }

  /**
   * Run comprehensive quality validation
   */
  async validateQuality(project) {
    await this.initialize();
    return this.validator.runComprehensiveValidation(project);
  }

  /**
   * Detect theater patterns
   */
  async detectTheater(codebase, domain = 'all') {
    await this.initialize();
    return this.validator.detectTheater(codebase, domain);
  }

  /**
   * Validate reality of claims
   */
  async validateReality(claims, evidence) {
    await this.initialize();
    return this.validator.validateReality(claims, evidence);
  }

  /**
   * Enforce quality gates
   */
  async enforceQualityGates(project) {
    await this.initialize();
    return this.validator.enforceQualityGates(project);
  }

  /**
   * Monitor NASA compliance
   */
  async monitorCompliance(project) {
    await this.initialize();
    return this.validator.monitorNASACompliance(project);
  }

  /**
   * Generate quality dashboard
   */
  async generateDashboard() {
    await this.initialize();
    return this.validator.generateQualityDashboard();
  }

  /**
   * Get quality metrics
   */
  getMetrics() {
    if (!this.initialized) return null;
    return this.validator.validationMetrics;
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics() {
    if (!this.initialized) return null;
    return this.validator.performanceTracker.getMetrics();
  }

  /**
   * Integration with existing enterprise theater detection
   */
  async integrateWithExistingTheaterDetection(existingConfig) {
    console.log('Integrating with existing theater detection configuration...');
    
    // Merge theater detection patterns
    if (existingConfig.theaterPatterns) {
      this.validator.theaterDetector.patternLibrary = {
        ...this.validator.theaterDetector.patternLibrary,
        ...existingConfig.theaterPatterns
      };
    }

    // Merge detection thresholds
    if (existingConfig.thresholds) {
      this.validator.theaterDetector.confidenceThreshold = 
        existingConfig.thresholds.confidence || this.validator.theaterDetector.confidenceThreshold;
    }

    // Merge vanity metric detection rules
    if (existingConfig.vanityMetrics) {
      this.validator.realityValidator.vanityMetricDetector.rules = {
        ...this.validator.realityValidator.vanityMetricDetector.rules,
        ...existingConfig.vanityMetrics
      };
    }

    console.log('Integration with existing theater detection completed');
  }

  /**
   * Health check for the quality validation system
   */
  async healthCheck() {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      checks: {}
    };

    try {
      // Check initialization
      health.checks.initialization = this.initialized ? 'PASS' : 'FAIL';
      
      // Check performance overhead
      const performanceMetrics = this.getPerformanceMetrics();
      if (performanceMetrics) {
        const overhead = performanceMetrics.overheadPercentage;
        health.checks.performance = overhead <= this.config.performanceTarget ? 'PASS' : 'FAIL';
        health.performanceOverhead = overhead;
      } else {
        health.checks.performance = 'UNKNOWN';
      }

      // Check artifacts directory
      try {
        const fs = require('fs').promises;
        await fs.access(this.config.artifactsPath);
        health.checks.artifactsDirectory = 'PASS';
      } catch {
        health.checks.artifactsDirectory = 'FAIL';
      }

      // Check component health
      health.checks.components = {
        theaterDetector: this.validator.theaterDetector ? 'PASS' : 'FAIL',
        realityValidator: this.validator.realityValidator ? 'PASS' : 'FAIL',
        qualityGates: this.validator.qualityGates ? 'PASS' : 'FAIL',
        nasaMonitor: this.validator.nasaMonitor ? 'PASS' : 'FAIL',
        dashboard: this.validator.dashboard ? 'PASS' : 'FAIL',
        alerting: this.validator.alerting ? 'PASS' : 'FAIL'
      };

      // Determine overall health
      const failedChecks = Object.values(health.checks).filter(check => {
        if (typeof check === 'object') {
          return Object.values(check).some(subCheck => subCheck === 'FAIL');
        }
        return check === 'FAIL';
      });

      if (failedChecks.length > 0) {
        health.status = 'degraded';
      }

    } catch (error) {
      health.status = 'unhealthy';
      health.error = error.message;
    }

    return health;
  }

  /**
   * Generate quality validation report
   */
  async generateReport(project) {
    await this.initialize();
    
    const report = {
      domain: 'QV',
      timestamp: new Date().toISOString(),
      project: project.name || 'Unknown',
      config: this.config,
      results: {},
      metrics: this.getMetrics(),
      performance: this.getPerformanceMetrics(),
      health: await this.healthCheck()
    };

    try {
      // Run all validation components
      report.results = await this.validator.runComprehensiveValidation(project);
      
      // Save report
      await this.saveReport(report);
      
      console.log(`Quality validation report generated for project: ${project.name}`);
      
      return report;
    } catch (error) {
      report.error = error.message;
      report.status = 'FAILED';
      
      console.error(`Quality validation report generation failed: ${error.message}`);
      throw error;
    }
  }

  async saveReport(report) {
    const fs = require('fs').promises;
    const path = require('path');
    
    const reportPath = path.join(
      this.config.artifactsPath,
      `quality_validation_report_${Date.now()}.json`
    );
    
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    console.log(`Quality validation report saved: ${reportPath}`);
  }
}

// Export domain interface and factory
module.exports = {
  QualityValidationDomain,
  QualityValidationFactory,
  QualityValidator,
  TheaterDetectionEngine,
  RealityValidationSystem,
  QualityGateEnforcer,
  NASAComplianceMonitor,
  QualityDashboard,
  QualityAlerting,
  PerformanceTracker,
  QV_CONFIG
};