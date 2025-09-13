/**
 * Configuration Migration Testing Suite
 * 
 * Tests migration from existing analyzer configuration files to the new
 * enterprise configuration system, ensuring backward compatibility and
 * proper data transformation.
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

describe('Configuration Migration Testing', () => {
  let legacyDetectorConfig;
  let legacyAnalysisConfig;
  let enterpriseConfig;
  
  const detectorConfigPath = path.join(process.cwd(), 'analyzer', 'config', 'detector_config.yaml');
  const analysisConfigPath = path.join(process.cwd(), 'analyzer', 'config', 'analysis_config.yaml');
  const enterpriseConfigPath = path.join(process.cwd(), 'config', 'enterprise_config.yaml');

  beforeAll(() => {
    try {
      // Load existing configuration files
      legacyDetectorConfig = yaml.load(fs.readFileSync(detectorConfigPath, 'utf8'));
      legacyAnalysisConfig = yaml.load(fs.readFileSync(analysisConfigPath, 'utf8'));
      enterpriseConfig = yaml.load(fs.readFileSync(enterpriseConfigPath, 'utf8'));
    } catch (error) {
      throw new Error(`Failed to load configuration files: ${error.message}`);
    }
  });

  describe('Legacy Configuration Preservation', () => {
    test('should preserve legacy detector configuration paths', () => {
      const legacyIntegration = enterpriseConfig.legacy_integration;
      expect(legacyIntegration).toBeDefined();
      expect(legacyIntegration.preserve_existing_configs).toBe(true);
      expect(legacyIntegration.detector_config_path).toBe('analyzer/config/detector_config.yaml');
      expect(legacyIntegration.analysis_config_path).toBe('analyzer/config/analysis_config.yaml');
    });

    test('should have valid conflict resolution strategy', () => {
      const conflictResolution = enterpriseConfig.legacy_integration.conflict_resolution;
      expect(['legacy_wins', 'enterprise_wins', 'merge']).toContain(conflictResolution);
    });

    test('should enable migration warnings', () => {
      expect(enterpriseConfig.legacy_integration.migration_warnings).toBe(true);
    });
  });

  describe('Detector Configuration Migration', () => {
    test('should migrate values detector thresholds', () => {
      const legacyThresholds = legacyDetectorConfig.values_detector.thresholds;
      expect(legacyThresholds).toBeDefined();
      expect(typeof legacyThresholds.duplicate_literal_minimum).toBe('number');
      expect(typeof legacyThresholds.configuration_coupling_limit).toBe('number');
      expect(typeof legacyThresholds.configuration_line_spread).toBe('number');
      
      // Verify thresholds are within reasonable ranges
      expect(legacyThresholds.duplicate_literal_minimum).toBeGreaterThan(0);
      expect(legacyThresholds.configuration_coupling_limit).toBeGreaterThan(0);
      expect(legacyThresholds.configuration_line_spread).toBeGreaterThan(0);
    });

    test('should migrate position detector configuration', () => {
      const positionConfig = legacyDetectorConfig.position_detector;
      expect(positionConfig).toBeDefined();
      expect(typeof positionConfig.max_positional_params).toBe('number');
      expect(positionConfig.max_positional_params).toBeGreaterThan(0);
      
      const severityMapping = positionConfig.severity_mapping;
      expect(severityMapping).toBeDefined();
      Object.entries(severityMapping).forEach(([range, severity]) => {
        expect(['low', 'medium', 'high', 'critical']).toContain(severity);
      });
    });

    test('should migrate god object detector thresholds', () => {
      const godObjectConfig = legacyDetectorConfig.god_object_detector;
      expect(godObjectConfig).toBeDefined();
      expect(typeof godObjectConfig.method_threshold).toBe('number');
      expect(typeof godObjectConfig.loc_threshold).toBe('number');
      expect(typeof godObjectConfig.parameter_threshold).toBe('number');
      
      // Verify thresholds are sensible
      expect(godObjectConfig.method_threshold).toBeGreaterThan(5);
      expect(godObjectConfig.loc_threshold).toBeGreaterThan(100);
      expect(godObjectConfig.parameter_threshold).toBeGreaterThan(3);
    });

    test('should migrate magic literal detector configuration', () => {
      const magicLiteralConfig = legacyDetectorConfig.magic_literal_detector;
      expect(magicLiteralConfig).toBeDefined();
      expect(magicLiteralConfig.severity_rules).toBeDefined();
      expect(magicLiteralConfig.thresholds).toBeDefined();
      
      const severityRules = magicLiteralConfig.severity_rules;
      Object.values(severityRules).forEach(severity => {
        expect(['low', 'medium', 'high', 'critical']).toContain(severity);
      });
    });

    test('should migrate algorithm detector settings', () => {
      const algorithmConfig = legacyDetectorConfig.algorithm_detector;
      expect(algorithmConfig).toBeDefined();
      expect(typeof algorithmConfig.minimum_function_lines).toBe('number');
      expect(typeof algorithmConfig.duplicate_threshold).toBe('number');
      expect(algorithmConfig.normalization).toBeDefined();
      
      const normalization = algorithmConfig.normalization;
      expect(typeof normalization.ignore_variable_names).toBe('boolean');
      expect(typeof normalization.ignore_comments).toBe('boolean');
      expect(typeof normalization.focus_on_structure).toBe('boolean');
    });
  });

  describe('Analysis Configuration Migration', () => {
    test('should migrate global analysis settings', () => {
      const analysisSettings = legacyAnalysisConfig.analysis;
      expect(analysisSettings).toBeDefined();
      expect(['standard', 'strict', 'lenient', 'nasa-compliance']).toContain(
        analysisSettings.default_policy
      );
      expect(typeof analysisSettings.max_file_size_mb).toBe('number');
      expect(typeof analysisSettings.max_analysis_time_seconds).toBe('number');
      expect(typeof analysisSettings.parallel_workers).toBe('number');
    });

    test('should migrate quality gate thresholds', () => {
      const qualityGates = legacyAnalysisConfig.quality_gates;
      expect(qualityGates).toBeDefined();
      expect(typeof qualityGates.overall_quality_threshold).toBe('number');
      expect(qualityGates.overall_quality_threshold).toBeGreaterThan(0);
      expect(qualityGates.overall_quality_threshold).toBeLessThanOrEqual(1);
      
      // Check policy-specific thresholds
      expect(qualityGates.policies).toBeDefined();
      Object.entries(qualityGates.policies).forEach(([policy, config]) => {
        expect(typeof config.quality_threshold).toBe('number');
        expect(config.violation_limits).toBeDefined();
      });
    });

    test('should migrate connascence weights and scoring', () => {
      const connascence = legacyAnalysisConfig.connascence;
      expect(connascence).toBeDefined();
      expect(connascence.type_weights).toBeDefined();
      expect(connascence.severity_multipliers).toBeDefined();
      
      // Verify all connascence types have weights
      const expectedTypes = [
        'connascence_of_name', 'connascence_of_type', 'connascence_of_meaning',
        'connascence_of_position', 'connascence_of_algorithm', 'connascence_of_execution',
        'connascence_of_timing', 'connascence_of_values', 'connascence_of_identity'
      ];
      
      expectedTypes.forEach(type => {
        expect(connascence.type_weights).toHaveProperty(type);
        expect(typeof connascence.type_weights[type]).toBe('number');
        expect(connascence.type_weights[type]).toBeGreaterThan(0);
      });
    });

    test('should migrate file processing configuration', () => {
      const fileProcessing = legacyAnalysisConfig.file_processing;
      expect(fileProcessing).toBeDefined();
      expect(Array.isArray(fileProcessing.supported_extensions)).toBe(true);
      expect(Array.isArray(fileProcessing.exclusion_patterns)).toBe(true);
      expect(typeof fileProcessing.max_recursion_depth).toBe('number');
      expect(typeof fileProcessing.follow_symlinks).toBe('boolean');
    });

    test('should migrate error handling configuration', () => {
      const errorHandling = legacyAnalysisConfig.error_handling;
      expect(errorHandling).toBeDefined();
      expect(typeof errorHandling.continue_on_syntax_error).toBe('boolean');
      expect(typeof errorHandling.log_all_errors).toBe('boolean');
      expect(typeof errorHandling.graceful_degradation).toBe('boolean');
      expect(typeof errorHandling.max_retry_attempts).toBe('number');
    });

    test('should migrate reporting configuration', () => {
      const reporting = legacyAnalysisConfig.reporting;
      expect(reporting).toBeDefined();
      expect(['text', 'json', 'sarif', 'markdown']).toContain(reporting.default_format);
      expect(typeof reporting.include_recommendations).toBe('boolean');
      expect(typeof reporting.include_context).toBe('boolean');
      expect(typeof reporting.max_code_snippet_lines).toBe('number');
    });
  });

  describe('Migration Compatibility Tests', () => {
    test('should maintain backward compatibility for detector thresholds', () => {
      // Test that legacy detector thresholds are still accessible
      const legacyGodObjectThreshold = legacyDetectorConfig.god_object_detector.method_threshold;
      expect(legacyGodObjectThreshold).toBe(20);
      
      const legacyLOCThreshold = legacyDetectorConfig.god_object_detector.loc_threshold;
      expect(legacyLOCThreshold).toBe(500);
      
      const legacyPositionThreshold = legacyDetectorConfig.position_detector.max_positional_params;
      expect(legacyPositionThreshold).toBe(3);
    });

    test('should maintain backward compatibility for analysis policies', () => {
      // Test that legacy analysis policies are preserved
      const policies = legacyAnalysisConfig.quality_gates.policies;
      expect(policies['nasa-compliance']).toBeDefined();
      expect(policies['nasa-compliance'].quality_threshold).toBe(0.95);
      expect(policies.standard).toBeDefined();
      expect(policies.strict).toBeDefined();
      expect(policies.lenient).toBeDefined();
    });

    test('should preserve legacy file processing settings', () => {
      const extensions = legacyAnalysisConfig.file_processing.supported_extensions;
      expect(extensions).toContain('.py');
      expect(extensions).toContain('.pyx');
      expect(extensions).toContain('.pyi');
      
      const exclusions = legacyAnalysisConfig.file_processing.exclusion_patterns;
      expect(exclusions).toContain('__pycache__');
      expect(exclusions).toContain('.git');
      expect(exclusions).toContain('node_modules');
    });

    test('should preserve legacy integration settings', () => {
      const integrations = legacyAnalysisConfig.integrations;
      expect(integrations).toBeDefined();
      expect(integrations.mcp).toBeDefined();
      expect(integrations.vscode).toBeDefined();
      expect(integrations.cli).toBeDefined();
      
      // Check that timeout and rate limiting settings are preserved
      expect(typeof integrations.mcp.timeout_seconds).toBe('number');
      expect(typeof integrations.mcp.rate_limit_requests_per_minute).toBe('number');
    });
  });

  describe('Enterprise Configuration Enhancement', () => {
    test('should enhance legacy configuration with enterprise features', () => {
      // Verify that enterprise features are additive, not replacing legacy config
      expect(enterpriseConfig.enterprise.features.advanced_analytics).toBe(true);
      expect(enterpriseConfig.enterprise.features.enterprise_security).toBe(true);
      expect(enterpriseConfig.enterprise.features.performance_monitoring).toBe(true);
      
      // Verify legacy integration is preserved
      expect(enterpriseConfig.legacy_integration.preserve_existing_configs).toBe(true);
    });

    test('should provide enterprise-level quality gates', () => {
      const enterpriseGates = enterpriseConfig.governance.quality_gates;
      expect(enterpriseGates.enabled).toBe(true);
      expect(enterpriseGates.nasa_compliance.enabled).toBe(true);
      expect(enterpriseGates.nasa_compliance.minimum_score).toBe(0.95);
      
      // Verify compatibility with legacy NASA compliance
      const legacyNASA = legacyAnalysisConfig.quality_gates.policies['nasa-compliance'];
      expect(enterpriseGates.nasa_compliance.minimum_score).toBe(legacyNASA.quality_threshold);
    });

    test('should enhance performance monitoring capabilities', () => {
      const monitoring = enterpriseConfig.monitoring;
      expect(monitoring.metrics.enabled).toBe(true);
      expect(monitoring.logging.enabled).toBe(true);
      expect(monitoring.alerts.enabled).toBe(true);
      
      // Verify these are enhancements to legacy capabilities
      const legacyIntegrations = legacyAnalysisConfig.integrations;
      expect(legacyIntegrations.mcp.timeout_seconds).toBeDefined();
      expect(monitoring.alerts.thresholds.response_time_p95).toBeDefined();
    });
  });

  describe('Migration Path Validation', () => {
    test('should provide clear migration indicators', () => {
      expect(enterpriseConfig.schema.migration_required).toBe(false);
      expect(enterpriseConfig.schema.compatibility_level).toBe('backward');
      expect(enterpriseConfig.legacy_integration.migration_warnings).toBe(true);
    });

    test('should maintain version consistency', () => {
      const schemaVersion = enterpriseConfig.schema.version;
      expect(schemaVersion).toBe('1.0');
      
      const formatVersion = enterpriseConfig.schema.format_version;
      expect(formatVersion).toBe('2024.1');
    });

    test('should validate migration conflict resolution', () => {
      const conflictResolution = enterpriseConfig.legacy_integration.conflict_resolution;
      expect(conflictResolution).toBe('enterprise_wins');
      
      // In case of conflicts, enterprise settings should take precedence
      // while preserving legacy functionality
      expect(enterpriseConfig.governance.quality_gates.enforce_blocking).toBeDefined();
    });
  });

  describe('Data Integrity During Migration', () => {
    test('should preserve all legacy threshold values', () => {
      // Create a mapping of important legacy values that must be preserved
      const criticalLegacyValues = {
        god_object_method_threshold: legacyDetectorConfig.god_object_detector.method_threshold,
        god_object_loc_threshold: legacyDetectorConfig.god_object_detector.loc_threshold,
        nasa_quality_threshold: legacyAnalysisConfig.quality_gates.policies['nasa-compliance'].quality_threshold,
        max_file_size: legacyAnalysisConfig.analysis.max_file_size_mb,
        parallel_workers: legacyAnalysisConfig.analysis.parallel_workers
      };
      
      // Verify these values are preserved (either directly or mapped)
      expect(criticalLegacyValues.god_object_method_threshold).toBe(20);
      expect(criticalLegacyValues.god_object_loc_threshold).toBe(500);
      expect(criticalLegacyValues.nasa_quality_threshold).toBe(0.95);
      expect(criticalLegacyValues.max_file_size).toBe(10);
      expect(criticalLegacyValues.parallel_workers).toBe(4);
    });

    test('should preserve exclusion patterns and file types', () => {
      const exclusionPatterns = legacyAnalysisConfig.file_processing.exclusion_patterns;
      const supportedExtensions = legacyAnalysisConfig.file_processing.supported_extensions;
      
      // These critical patterns must be preserved
      expect(exclusionPatterns).toContain('__pycache__');
      expect(exclusionPatterns).toContain('.pytest_cache');
      expect(exclusionPatterns).toContain('node_modules');
      
      expect(supportedExtensions).toContain('.py');
      expect(supportedExtensions).toContain('.pyx');
      expect(supportedExtensions).toContain('.pyi');
    });
  });
});