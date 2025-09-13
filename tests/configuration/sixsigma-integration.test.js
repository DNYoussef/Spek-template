/**
 * Six Sigma Integration Testing Suite
 * 
 * Tests integration between enterprise configuration and Six Sigma quality gates,
 * ensuring proper configuration alignment, DPMO calculations, and RTY validation.
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

describe('Six Sigma Integration Testing', () => {
  let enterpriseConfig;
  let checksConfig;
  let sixSigmaConfig;
  
  const enterpriseConfigPath = path.join(process.cwd(), 'config', 'enterprise_config.yaml');
  const checksConfigPath = path.join(process.cwd(), 'config', 'checks.yaml');

  beforeAll(() => {
    try {
      const enterpriseConfigContent = fs.readFileSync(enterpriseConfigPath, 'utf8');
      enterpriseConfig = yaml.load(enterpriseConfigContent);
      
      const checksConfigContent = fs.readFileSync(checksConfigPath, 'utf8');
      checksConfig = yaml.load(checksConfigContent);
      
      sixSigmaConfig = checksConfig.quality_gates.six_sigma;
    } catch (error) {
      throw new Error(`Failed to load configuration files: ${error.message}`);
    }
  });

  describe('Configuration Integration Validation', () => {
    test('should have compatible quality gate configurations', () => {
      // Enterprise config should have quality gates enabled
      expect(enterpriseConfig.governance.quality_gates.enabled).toBe(true);
      
      // Six Sigma config should be enabled in checks.yaml
      expect(sixSigmaConfig.enabled).toBe(true);
      
      // Both should have compatible NASA compliance settings
      const enterpriseNASA = enterpriseConfig.governance.quality_gates.nasa_compliance;
      expect(enterpriseNASA.enabled).toBe(true);
      expect(enterpriseNASA.minimum_score).toBeGreaterThanOrEqual(0.95);
      expect(sixSigmaConfig.target_sigma_level).toBeGreaterThanOrEqual(4.0);
    });

    test('should align enterprise features with Six Sigma requirements', () => {
      // Advanced analytics should be enabled for Six Sigma metrics
      expect(enterpriseConfig.enterprise.features.advanced_analytics).toBe(true);
      expect(enterpriseConfig.enterprise.features.performance_monitoring).toBe(true);
      expect(enterpriseConfig.enterprise.features.compliance_reporting).toBe(true);
      
      // Six Sigma should have compatible telemetry settings
      expect(checksConfig.telemetry.collection_interval).toBeDefined();
      expect(checksConfig.telemetry.retention_days).toBeGreaterThanOrEqual(90);
    });

    test('should have consistent artifact generation settings', () => {
      // Enterprise config should support Six Sigma artifacts
      const enterpriseAnalytics = enterpriseConfig.analytics;
      expect(enterpriseAnalytics.enabled).toBe(true);
      expect(enterpriseAnalytics.custom_dashboards).toBe(true);
      expect(enterpriseAnalytics.scheduled_reports).toBe(true);
      
      // Six Sigma config should specify artifact outputs
      const artifacts = checksConfig.artifacts;
      expect(artifacts.output_directory).toBe('.claude/.artifacts/sixsigma');
      expect(artifacts.formats).toContain('json');
      expect(artifacts.formats).toContain('csv');
      expect(artifacts.formats).toContain('html');
    });
  });

  describe('Six Sigma Quality Gate Integration', () => {
    test('should integrate enterprise NASA compliance with Six Sigma levels', () => {
      const enterpriseNASA = enterpriseConfig.governance.quality_gates.nasa_compliance;
      const sixSigmaLevels = sixSigmaConfig;
      
      // NASA compliance minimum score should align with sigma levels
      expect(enterpriseNASA.minimum_score).toBe(0.95);
      expect(sixSigmaLevels.target_sigma_level).toBe(4.0);
      expect(sixSigmaLevels.minimum_sigma_level).toBe(3.0);
      
      // Critical violations should be zero for both
      expect(enterpriseNASA.critical_violations_allowed).toBe(0);
      expect(sixSigmaLevels.defect_categories.critical.threshold).toBe(0);
    });

    test('should map enterprise custom gates to Six Sigma defect categories', () => {
      const customGates = enterpriseConfig.governance.quality_gates.custom_gates;
      const defectCategories = sixSigmaConfig.defect_categories;
      
      // Code coverage should map to defect detection
      expect(customGates.code_coverage).toBe(0.80);
      expect(defectCategories.major.threshold).toBeLessThanOrEqual(2);
      
      // Security requirements should map to critical defects
      expect(customGates.security_scan_required).toBe(true);
      expect(defectCategories.critical.threshold).toBe(0);
      
      // Performance regression should map to major defects
      expect(customGates.performance_regression_threshold).toBe(0.05);
      expect(defectCategories.major.examples).toContain('performance_degradation');
    });

    test('should validate DPMO calculation alignment with enterprise metrics', () => {
      const dpmoCalc = sixSigmaConfig.dpmo_calculation;
      const enterpriseMetrics = enterpriseConfig.monitoring.metrics;
      
      expect(enterpriseMetrics.enabled).toBe(true);
      expect(enterpriseMetrics.custom_metrics).toBe(true);
      
      // DPMO calculation should include enterprise-relevant opportunities
      expect(dpmoCalc.opportunity_definitions.code_review).toBeDefined();
      expect(dpmoCalc.opportunity_definitions.test_coverage).toBeDefined();
      expect(dpmoCalc.opportunity_definitions.integration_points).toBeDefined();
      
      // Opportunities should have reasonable rates
      Object.values(dpmoCalc.opportunity_definitions).forEach(def => {
        expect(def.opportunities_per_unit).toBeGreaterThan(0);
        expect(def.opportunities_per_unit).toBeLessThan(10);
      });
    });
  });

  describe('Process Stage Integration', () => {
    test('should align enterprise governance with Six Sigma process stages', () => {
      const processStages = sixSigmaConfig.process_stages;
      const enterpriseGovernance = enterpriseConfig.governance;
      
      // Specification stage should align with requirements
      expect(processStages.specification.target_yield).toBe(0.95);
      expect(processStages.specification.opportunities).toContain('requirement_completeness');
      
      // Implementation stage should align with code standards
      expect(processStages.implementation.target_yield).toBe(0.90);
      expect(processStages.implementation.opportunities).toContain('code_review');
      
      // Enterprise governance should enforce these stages
      expect(enterpriseGovernance.policies.code_standards).toBe('enterprise');
      expect(enterpriseGovernance.policies.review_requirements.min_approvers).toBeGreaterThanOrEqual(2);
    });

    test('should calculate RTY based on enterprise configuration', () => {
      const rtyThresholds = sixSigmaConfig.rty_thresholds;
      const enterpriseQuality = enterpriseConfig.governance.quality_gates;
      
      // RTY thresholds should support enterprise quality requirements
      expect(rtyThresholds.excellent).toBe(0.95);
      expect(rtyThresholds.good).toBe(0.90);
      expect(rtyThresholds.acceptable).toBe(0.80);
      
      // Enterprise blocking gates should align with RTY requirements
      expect(enterpriseQuality.enforce_blocking).toBe(true);
      
      // Calculate combined RTY for enterprise process
      const calculateRTY = (stages) => {
        return Object.values(stages).reduce((rty, stage) => {
          return rty * stage.target_yield;
        }, 1.0);
      };
      
      const combinedRTY = calculateRTY(sixSigmaConfig.process_stages);
      expect(combinedRTY).toBeGreaterThan(rtyThresholds.acceptable);
    });
  });

  describe('Theater Detection Integration', () => {
    test('should align enterprise monitoring with theater detection', () => {
      const theaterDetection = sixSigmaConfig.theater_detection;
      const enterpriseMonitoring = enterpriseConfig.monitoring;
      
      // Enterprise should monitor reality metrics, not vanity metrics
      const realityMetrics = theaterDetection.reality_metrics;
      expect(realityMetrics).toContain('defect_escape_rate');
      expect(realityMetrics).toContain('customer_satisfaction');
      expect(realityMetrics).toContain('mean_time_to_recovery');
      
      // Enterprise monitoring should support these metrics
      expect(enterpriseMonitoring.metrics.enabled).toBe(true);
      expect(enterpriseMonitoring.alerts.enabled).toBe(true);
      
      // Alert thresholds should detect theater
      expect(theaterDetection.correlation_threshold).toBe(0.7);
      expect(enterpriseMonitoring.alerts.thresholds.error_rate).toBeLessThanOrEqual(0.05);
    });

    test('should prevent vanity metric gaming', () => {
      const vanityMetrics = sixSigmaConfig.theater_detection.vanity_metrics;
      const enterpriseFeatures = enterpriseConfig.enterprise.features;
      
      // Vanity metrics should be identified
      expect(vanityMetrics).toContain('lines_of_code');
      expect(vanityMetrics).toContain('commit_frequency');
      expect(vanityMetrics).toContain('meeting_attendance');
      
      // Enterprise should focus on outcomes, not outputs
      expect(enterpriseFeatures.ml_insights).toBe(true);
      expect(enterpriseFeatures.risk_assessment).toBe(true);
      expect(enterpriseFeatures.compliance_reporting).toBe(true);
    });
  });

  describe('Continuous Improvement Integration', () => {
    test('should align enterprise analytics with Six Sigma improvement triggers', () => {
      const improvementTriggers = sixSigmaConfig.improvement_triggers;
      const enterpriseAnalytics = enterpriseConfig.analytics;
      
      // Enterprise analytics should support trend analysis
      expect(enterpriseAnalytics.trend_analysis).toBe(true);
      expect(enterpriseAnalytics.predictive_insights).toBe(true);
      expect(enterpriseAnalytics.machine_learning.anomaly_detection).toBe(true);
      
      // Improvement triggers should have reasonable thresholds
      expect(improvementTriggers.sigma_degradation.threshold).toBe(-0.5);
      expect(improvementTriggers.dpmo_increase.threshold).toBe(1000);
      expect(improvementTriggers.rty_decline.threshold).toBe(-0.05);
    });

    test('should integrate with enterprise notification system', () => {
      const enterpriseNotifications = enterpriseConfig.notifications;
      const sixSigmaAlerts = checksConfig.telemetry.metrics;
      
      // Enterprise notifications should be enabled
      expect(enterpriseNotifications.enabled).toBe(true);
      expect(enterpriseNotifications.escalation.enabled).toBe(true);
      
      // Six Sigma alerts should have proper thresholds
      expect(sixSigmaAlerts.dpmo.alerts).toBeDefined();
      expect(sixSigmaAlerts.rty.alerts).toBeDefined();
      expect(sixSigmaAlerts.sigma_level.alerts).toBeDefined();
      
      // Alert severities should align
      const dpmoAlerts = sixSigmaAlerts.dpmo.alerts;
      expect(dpmoAlerts.some(alert => alert.severity === 'warning')).toBe(true);
      expect(dpmoAlerts.some(alert => alert.severity === 'critical')).toBe(true);
    });
  });

  describe('Data Collection and Reporting Integration', () => {
    test('should integrate enterprise data retention with Six Sigma telemetry', () => {
      const enterpriseAnalytics = enterpriseConfig.analytics;
      const sixSigmaTelemetry = checksConfig.telemetry;
      
      // Data retention should be compatible
      expect(enterpriseAnalytics.data_retention_days).toBe(730);
      expect(sixSigmaTelemetry.retention_days).toBe(90);
      
      // Enterprise should retain longer for trend analysis
      expect(enterpriseAnalytics.data_retention_days).toBeGreaterThan(sixSigmaTelemetry.retention_days);
      
      // Collection intervals should be reasonable
      expect(sixSigmaTelemetry.collection_interval).toBe(300); // 5 minutes
    });

    test('should align enterprise reporting with Six Sigma artifacts', () => {
      const enterpriseAnalytics = enterpriseConfig.analytics;
      const sixSigmaArtifacts = checksConfig.artifacts;
      
      // Enterprise should support Six Sigma export formats
      const enterpriseFormats = enterpriseAnalytics.export_formats;
      const sixSigmaFormats = sixSigmaArtifacts.formats;
      
      expect(enterpriseFormats).toContain('json');
      expect(enterpriseFormats).toContain('csv');
      expect(sixSigmaFormats).toContain('json');
      expect(sixSigmaFormats).toContain('csv');
      
      // Scheduled reporting should align
      expect(enterpriseAnalytics.scheduled_reports).toBe(true);
      expect(sixSigmaArtifacts.reports.daily_summary.enabled).toBe(true);
      expect(sixSigmaArtifacts.reports.weekly_analysis.enabled).toBe(true);
    });
  });

  describe('Security and Compliance Integration', () => {
    test('should ensure Six Sigma data security aligns with enterprise security', () => {
      const enterpriseSecurity = enterpriseConfig.security;
      const sixSigmaConfig = checksConfig.quality_gates.six_sigma;
      
      // Enterprise security should protect Six Sigma data
      expect(enterpriseSecurity.encryption.at_rest).toBe(true);
      expect(enterpriseSecurity.encryption.in_transit).toBe(true);
      expect(enterpriseSecurity.audit.enabled).toBe(true);
      
      // Six Sigma artifacts should be in secure location
      expect(checksConfig.artifacts.output_directory).toBe('.claude/.artifacts/sixsigma');
    });

    test('should align audit requirements with Six Sigma compliance', () => {
      const enterpriseAudit = enterpriseConfig.security.audit;
      const enterpriseCompliance = enterpriseConfig.enterprise.compliance_level;
      
      expect(enterpriseAudit.enabled).toBe(true);
      expect(enterpriseAudit.retention_days).toBe(365);
      expect(enterpriseCompliance).toBe('nasa-pot10');
      
      // Six Sigma should support compliance requirements
      expect(sixSigmaConfig.target_sigma_level).toBeGreaterThanOrEqual(4.0);
      expect(sixSigmaConfig.defect_categories.critical.threshold).toBe(0);
    });
  });

  describe('Performance Integration', () => {
    test('should ensure Six Sigma calculations do not impact enterprise performance', () => {
      const enterprisePerformance = enterpriseConfig.performance;
      const sixSigmaTelemetry = checksConfig.telemetry;
      
      // Enterprise performance settings should be reasonable
      expect(enterprisePerformance.resource_limits.max_memory_mb).toBe(8192);
      expect(enterprisePerformance.resource_limits.max_analysis_time_seconds).toBe(3600);
      
      // Six Sigma collection should not be too frequent
      expect(sixSigmaTelemetry.collection_interval).toBeGreaterThanOrEqual(300); // At least 5 minutes
      
      // Caching should be enabled to support frequent calculations
      expect(enterprisePerformance.caching.enabled).toBe(true);
      expect(enterprisePerformance.caching.provider).toBe('redis');
    });
  });

  describe('Integration Validation Tests', () => {
    test('should validate combined configuration consistency', () => {
      // Create a mock integration validator
      const validateIntegration = (enterpriseConfig, sixSigmaConfig) => {
        const issues = [];
        
        // Check quality gate alignment
        if (!enterpriseConfig.governance.quality_gates.enabled && sixSigmaConfig.enabled) {
          issues.push('Six Sigma enabled but enterprise quality gates disabled');
        }
        
        // Check NASA compliance alignment
        const nasaMin = enterpriseConfig.governance.quality_gates.nasa_compliance.minimum_score;
        const sigmaLevel = sixSigmaConfig.target_sigma_level;
        
        if (nasaMin >= 0.95 && sigmaLevel < 4.0) {
          issues.push('NASA compliance requires higher sigma level');
        }
        
        // Check monitoring alignment
        if (!enterpriseConfig.monitoring.metrics.enabled && sixSigmaConfig.enabled) {
          issues.push('Six Sigma requires metrics monitoring to be enabled');
        }
        
        return {
          valid: issues.length === 0,
          issues
        };
      };
      
      const validation = validateIntegration(enterpriseConfig, sixSigmaConfig);
      expect(validation.valid).toBe(true);
      expect(validation.issues).toHaveLength(0);
    });

    test('should validate end-to-end quality pipeline', () => {
      // Simulate a complete quality pipeline from enterprise config to Six Sigma output
      const simulateQualityPipeline = () => {
        const pipeline = {
          // 1. Enterprise quality gates configuration
          qualityGatesEnabled: enterpriseConfig.governance.quality_gates.enabled,
          nasaComplianceEnabled: enterpriseConfig.governance.quality_gates.nasa_compliance.enabled,
          
          // 2. Six Sigma configuration
          sixSigmaEnabled: sixSigmaConfig.enabled,
          targetSigmaLevel: sixSigmaConfig.target_sigma_level,
          
          // 3. Monitoring and analytics
          monitoringEnabled: enterpriseConfig.monitoring.metrics.enabled,
          analyticsEnabled: enterpriseConfig.analytics.enabled,
          
          // 4. Artifact generation
          artifactsEnabled: !!checksConfig.artifacts.output_directory,
          reportingEnabled: checksConfig.artifacts.reports.daily_summary.enabled
        };
        
        // All components should be enabled for full pipeline
        const allEnabled = Object.values(pipeline).every(enabled => enabled === true);
        
        return {
          pipeline,
          fullyConfigured: allEnabled
        };
      };
      
      const pipelineTest = simulateQualityPipeline();
      expect(pipelineTest.fullyConfigured).toBe(true);
      expect(pipelineTest.pipeline.qualityGatesEnabled).toBe(true);
      expect(pipelineTest.pipeline.sixSigmaEnabled).toBe(true);
      expect(pipelineTest.pipeline.monitoringEnabled).toBe(true);
      expect(pipelineTest.pipeline.analyticsEnabled).toBe(true);
    });
  });
});