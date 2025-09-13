/**
 * Mock Configuration Test Fixtures
 * 
 * Provides mock configuration data, test fixtures, and sample configurations
 * for testing various scenarios in the configuration system.
 */

const path = require('path');

/**
 * Valid Mock Configurations
 */
const validConfigs = {
  minimal: {
    schema: {
      version: '1.0',
      format_version: '2024.1',
      compatibility_level: 'backward',
      migration_required: false
    },
    enterprise: {
      enabled: true,
      license_mode: 'community',
      compliance_level: 'standard'
    },
    security: {
      authentication: {
        enabled: false
      }
    },
    performance: {
      scaling: {
        auto_scaling_enabled: false,
        min_workers: 1,
        max_workers: 4
      }
    }
  },

  enterprise: {
    schema: {
      version: '1.0',
      format_version: '2024.1',
      compatibility_level: 'backward',
      migration_required: false
    },
    enterprise: {
      enabled: true,
      license_mode: 'enterprise',
      compliance_level: 'nasa-pot10',
      features: {
        advanced_analytics: true,
        multi_tenant_support: true,
        enterprise_security: true,
        audit_logging: true,
        performance_monitoring: true,
        custom_detectors: true,
        integration_platform: true,
        governance_framework: true,
        compliance_reporting: true,
        advanced_visualization: true,
        ml_insights: true,
        risk_assessment: true,
        automated_remediation: false,
        multi_environment_sync: true,
        enterprise_apis: true
      }
    },
    security: {
      authentication: {
        enabled: true,
        method: 'oauth2',
        session_timeout: 3600,
        max_concurrent_sessions: 5,
        password_policy: {
          min_length: 12,
          require_uppercase: true,
          require_lowercase: true,
          require_numbers: true,
          require_special_chars: true,
          expiry_days: 90
        }
      },
      authorization: {
        rbac_enabled: true,
        default_role: 'viewer',
        roles: {
          viewer: {
            permissions: ['read']
          },
          developer: {
            permissions: ['read', 'execute', 'create_reports']
          },
          admin: {
            permissions: ['read', 'write', 'execute', 'admin', 'manage_users']
          },
          security_officer: {
            permissions: ['read', 'audit', 'compliance', 'security_config']
          }
        }
      },
      audit: {
        enabled: true,
        log_level: 'detailed',
        retention_days: 365,
        export_format: 'json',
        real_time_monitoring: true,
        anomaly_detection: true
      },
      encryption: {
        at_rest: true,
        in_transit: true,
        algorithm: 'AES-256-GCM',
        key_rotation_days: 90
      }
    },
    multi_tenancy: {
      enabled: true,
      isolation_level: 'complete',
      tenant_specific_config: true,
      resource_quotas: {
        max_users_per_tenant: 1000,
        max_projects_per_tenant: 100,
        max_analysis_jobs_per_day: 10000,
        storage_limit_gb: 1000
      },
      default_tenant: {
        name: 'default',
        admin_email: 'admin@company.com',
        compliance_profile: 'standard'
      }
    },
    performance: {
      scaling: {
        auto_scaling_enabled: true,
        min_workers: 2,
        max_workers: 20,
        scale_up_threshold: 0.8,
        scale_down_threshold: 0.3,
        cooldown_period: 300
      },
      resource_limits: {
        max_memory_mb: 8192,
        max_cpu_cores: 8,
        max_file_size_mb: 100,
        max_analysis_time_seconds: 3600,
        max_concurrent_analyses: 10
      },
      caching: {
        enabled: true,
        provider: 'redis',
        ttl_seconds: 3600,
        max_cache_size_mb: 1024,
        cache_compression: true
      },
      database: {
        connection_pool_size: 20,
        query_timeout_seconds: 30,
        read_replica_enabled: true,
        indexing_strategy: 'optimized'
      }
    },
    monitoring: {
      metrics: {
        enabled: true,
        provider: 'prometheus',
        collection_interval: 30,
        retention_days: 30,
        custom_metrics: true
      },
      logging: {
        enabled: true,
        level: 'info',
        format: 'json',
        output: ['console', 'file'],
        file_rotation: true,
        max_file_size_mb: 100,
        max_files: 10
      },
      tracing: {
        enabled: true,
        sampling_rate: 0.1,
        provider: 'jaeger'
      },
      alerts: {
        enabled: true,
        channels: ['email', 'slack'],
        thresholds: {
          error_rate: 0.05,
          response_time_p95: 2000,
          memory_usage: 0.85,
          cpu_usage: 0.90
        }
      }
    },
    governance: {
      quality_gates: {
        enabled: true,
        enforce_blocking: true,
        custom_rules: true,
        nasa_compliance: {
          enabled: true,
          minimum_score: 0.95,
          critical_violations_allowed: 0,
          high_violations_allowed: 0,
          automated_remediation_suggestions: true
        },
        custom_gates: {
          code_coverage: 0.80,
          documentation_coverage: 0.70,
          security_scan_required: true,
          performance_regression_threshold: 0.05
        }
      }
    },
    environments: {
      development: {
        'security.authentication.enabled': false,
        'monitoring.logging.level': 'debug',
        'performance.caching.enabled': false,
        'governance.quality_gates.enforce_blocking': false
      },
      staging: {
        'security.authentication.method': 'oauth2',
        'monitoring.tracing.sampling_rate': 1.0,
        'governance.quality_gates.enforce_blocking': true
      },
      production: {
        'security.encryption.at_rest': true,
        'security.audit.enabled': true,
        'monitoring.alerts.enabled': true,
        'performance.scaling.auto_scaling_enabled': true,
        'governance.quality_gates.enforce_blocking': true
      }
    }
  }
};

/**
 * Invalid Mock Configurations for Error Testing
 */
const invalidConfigs = {
  missingSchema: {
    enterprise: {
      enabled: true,
      license_mode: 'enterprise'
    },
    security: {
      authentication: {
        enabled: true
      }
    }
  },

  invalidTypes: {
    schema: {
      version: 1.0, // Should be string
      format_version: 2024, // Should be string
      migration_required: 'false' // Should be boolean
    },
    enterprise: {
      enabled: 'true', // Should be boolean
      license_mode: 123, // Should be string
      compliance_level: null // Should be string
    },
    security: {
      authentication: {
        enabled: 1, // Should be boolean
        session_timeout: '3600' // Should be number
      }
    }
  },

  invalidEnums: {
    schema: {
      version: '1.0',
      compatibility_level: 'invalid_level'
    },
    enterprise: {
      enabled: true,
      license_mode: 'invalid_license',
      compliance_level: 'invalid_compliance'
    },
    security: {
      authentication: {
        enabled: true,
        method: 'invalid_auth_method'
      }
    }
  },

  constraintViolations: {
    schema: {
      version: '1.0'
    },
    enterprise: {
      enabled: true,
      license_mode: 'enterprise'
    },
    performance: {
      scaling: {
        min_workers: 10,
        max_workers: 5, // min > max violation
        scale_up_threshold: 0.3,
        scale_down_threshold: 0.8 // scale_up <= scale_down violation
      }
    },
    security: {
      authentication: {
        session_timeout: 100, // Below minimum 300
        password_policy: {
          min_length: 4, // Below recommended minimum
          expiry_days: -30 // Negative value
        }
      }
    }
  },

  circularReference: {
    schema: { version: '1.0' },
    enterprise: { enabled: true },
    circular: null // Will be set to create circular reference
  },

  malformedEnvironmentOverrides: {
    schema: { version: '1.0' },
    enterprise: { enabled: true },
    environments: {
      development: {
        'invalid path without dots': false,
        'security..double.dot': true,
        'security.': 'ends with dot',
        '.starts.with.dot': true,
        123: 'numeric key',
        'security.authentication.enabled': false
      }
    }
  }
};

// Create circular reference for testing
invalidConfigs.circularReference.circular = invalidConfigs.circularReference;

/**
 * Six Sigma Mock Configuration
 */
const sixSigmaMockConfig = {
  quality_gates: {
    six_sigma: {
      enabled: true,
      target_sigma_level: 4.0,
      minimum_sigma_level: 3.0,
      defect_categories: {
        critical: {
          weight: 10.0,
          examples: ['security_vulnerability', 'data_loss', 'system_crash'],
          threshold: 0
        },
        major: {
          weight: 5.0,
          examples: ['functional_failure', 'performance_degradation', 'integration_break'],
          threshold: 2
        },
        minor: {
          weight: 2.0,
          examples: ['ui_inconsistency', 'documentation_gap', 'style_violation'],
          threshold: 10
        },
        cosmetic: {
          weight: 1.0,
          examples: ['formatting', 'typos', 'color_scheme'],
          threshold: 50
        }
      },
      process_stages: {
        specification: {
          opportunities: ['requirement_completeness', 'acceptance_criteria', 'edge_cases'],
          target_yield: 0.95
        },
        design: {
          opportunities: ['architecture_review', 'pattern_compliance', 'scalability'],
          target_yield: 0.92
        },
        implementation: {
          opportunities: ['code_review', 'test_coverage', 'style_compliance'],
          target_yield: 0.90
        },
        testing: {
          opportunities: ['unit_tests', 'integration_tests', 'e2e_tests'],
          target_yield: 0.95
        },
        deployment: {
          opportunities: ['build_success', 'security_scan', 'performance_check'],
          target_yield: 0.98
        }
      },
      theater_detection: {
        vanity_metrics: ['lines_of_code', 'commit_frequency', 'meeting_attendance'],
        reality_metrics: ['defect_escape_rate', 'customer_satisfaction', 'mean_time_to_recovery', 'process_capability'],
        correlation_threshold: 0.7
      },
      dpmo_calculation: {
        opportunity_definitions: {
          code_review: {
            unit: 'lines_of_code',
            opportunities_per_unit: 0.1
          },
          test_coverage: {
            unit: 'testable_units',
            opportunities_per_unit: 1.0
          },
          integration_points: {
            unit: 'api_endpoints',
            opportunities_per_unit: 3.0
          },
          user_stories: {
            unit: 'acceptance_criteria',
            opportunities_per_unit: 1.0
          }
        }
      },
      rty_thresholds: {
        excellent: 0.95,
        good: 0.90,
        acceptable: 0.80,
        poor: 0.70,
        unacceptable: 0.70
      },
      improvement_triggers: {
        sigma_degradation: {
          threshold: -0.5,
          action: 'root_cause_analysis'
        },
        dpmo_increase: {
          threshold: 1000,
          action: 'process_review'
        },
        rty_decline: {
          threshold: -0.05,
          action: 'stage_analysis'
        }
      }
    }
  },
  telemetry: {
    collection_interval: 300,
    retention_days: 90,
    metrics: {
      dpmo: {
        enabled: true,
        aggregation: ['hourly', 'daily', 'weekly'],
        alerts: [
          {
            threshold: 10000,
            severity: 'warning'
          },
          {
            threshold: 50000,
            severity: 'critical'
          }
        ]
      },
      rty: {
        enabled: true,
        aggregation: ['daily', 'weekly', 'monthly'],
        alerts: [
          {
            threshold: 0.85,
            severity: 'warning',
            direction: 'below'
          },
          {
            threshold: 0.75,
            severity: 'critical',
            direction: 'below'
          }
        ]
      },
      sigma_level: {
        enabled: true,
        aggregation: ['daily', 'weekly'],
        target: 4.0,
        alerts: [
          {
            threshold: 3.5,
            severity: 'warning',
            direction: 'below'
          },
          {
            threshold: 3.0,
            severity: 'critical',
            direction: 'below'
          }
        ]
      }
    }
  },
  artifacts: {
    output_directory: '.claude/.artifacts/sixsigma',
    formats: ['json', 'csv', 'html'],
    reports: {
      daily_summary: {
        enabled: true,
        schedule: '0 9 * * *',
        includes: ['dpmo', 'rty', 'sigma_level', 'defect_analysis']
      },
      weekly_analysis: {
        enabled: true,
        schedule: '0 9 * * 1',
        includes: ['trend_analysis', 'process_capability', 'improvement_recommendations']
      },
      monthly_review: {
        enabled: true,
        schedule: '0 9 1 * *',
        includes: ['executive_summary', 'roi_analysis', 'benchmark_comparison']
      }
    }
  }
};

/**
 * Legacy Configuration Mock Data
 */
const legacyConfigs = {
  detectorConfig: {
    values_detector: {
      config_keywords: ['config', 'setting', 'option', 'param', 'default', 'threshold', 'timeout', 'limit'],
      thresholds: {
        duplicate_literal_minimum: 3,
        configuration_coupling_limit: 10,
        configuration_line_spread: 5
      },
      exclusions: {
        common_strings: ['', ' ', '\n', '\t', 'utf-8', 'ascii'],
        common_numbers: [0, 1, -1, 2, 10, 100]
      }
    },
    position_detector: {
      max_positional_params: 3,
      severity_mapping: {
        '4-6': 'medium',
        '7-10': 'high',
        '11+': 'critical'
      }
    },
    god_object_detector: {
      method_threshold: 20,
      loc_threshold: 500,
      parameter_threshold: 10
    },
    magic_literal_detector: {
      severity_rules: {
        in_conditionals: 'high',
        large_numbers: 'medium',
        string_literals: 'low'
      },
      thresholds: {
        number_repetition: 3,
        string_repetition: 2
      }
    }
  },

  analysisConfig: {
    analysis: {
      default_policy: 'standard',
      max_file_size_mb: 10,
      max_analysis_time_seconds: 300,
      parallel_workers: 4,
      cache_enabled: true
    },
    quality_gates: {
      overall_quality_threshold: 0.75,
      critical_violation_limit: 0,
      high_violation_limit: 5,
      policies: {
        'nasa-compliance': {
          quality_threshold: 0.95,
          violation_limits: {
            critical: 0,
            high: 0,
            medium: 2,
            low: 5
          }
        },
        strict: {
          quality_threshold: 0.85,
          violation_limits: {
            critical: 0,
            high: 2,
            medium: 10,
            low: 20
          }
        },
        standard: {
          quality_threshold: 0.75,
          violation_limits: {
            critical: 0,
            high: 5,
            medium: 20,
            low: 50
          }
        }
      }
    },
    connascence: {
      type_weights: {
        connascence_of_name: 1.0,
        connascence_of_type: 1.5,
        connascence_of_meaning: 2.0,
        connascence_of_position: 2.5,
        connascence_of_algorithm: 3.0,
        connascence_of_execution: 4.0,
        connascence_of_timing: 5.0,
        connascence_of_values: 2.0,
        connascence_of_identity: 3.5
      },
      severity_multipliers: {
        critical: 10.0,
        high: 5.0,
        medium: 2.0,
        low: 1.0
      }
    }
  }
};

/**
 * Environment Variable Test Data
 */
const environmentVariableTestData = {
  valid: {
    GITHUB_WEBHOOK_SECRET: 'gh_webhook_secret_abc123',
    SLACK_WEBHOOK_URL: 'https://hooks.slack.com/services/T123/B456/xyz789',
    TEAMS_WEBHOOK_URL: 'https://outlook.office.com/webhook/123-456-789',
    SMTP_SERVER: 'smtp.company.com',
    DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
    API_KEY: 'api_key_123456789',
    ENCRYPTION_KEY: 'encryption_key_abcdef123456'
  },
  invalid: {
    GITHUB_WEBHOOK_SECRET: '', // Empty value
    SLACK_WEBHOOK_URL: 'not-a-url',
    TEAMS_WEBHOOK_URL: 'ftp://invalid-protocol.com',
    SMTP_SERVER: 'server with spaces',
    DATABASE_URL: 'invalid-database-url',
    API_KEY: null,
    ENCRYPTION_KEY: undefined
  },
  missing: [
    'MISSING_REQUIRED_VAR',
    'UNDEFINED_WEBHOOK_SECRET',
    'NONEXISTENT_API_KEY'
  ]
};

/**
 * Performance Test Data
 */
const performanceTestData = {
  largeConfig: {
    // Base configuration
    ...validConfigs.enterprise,
    // Add many sections to test performance with large configs
    large_sections: Array.from({ length: 100 }, (_, i) => ({
      id: `section_${i}`,
      enabled: i % 2 === 0,
      settings: Array.from({ length: 50 }, (_, j) => ({
        key: `setting_${j}`,
        value: `value_${j}`,
        metadata: {
          created: new Date().toISOString(),
          version: '1.0.0',
          description: `Test setting ${j} for section ${i}`
        }
      }))
    })),
    complex_nested: {
      level1: {
        level2: {
          level3: {
            level4: {
              level5: {
                deep_settings: Array.from({ length: 1000 }, (_, k) => ({
                  id: k,
                  data: `deep_data_${k}`,
                  enabled: k % 3 === 0
                }))
              }
            }
          }
        }
      }
    }
  },

  stressTestOperations: {
    simple_access: () => validConfigs.enterprise.enterprise.enabled,
    nested_access: () => validConfigs.enterprise.security.authentication.password_policy.min_length,
    environment_merge: () => {
      const config = JSON.parse(JSON.stringify(validConfigs.enterprise));
      const envOverrides = config.environments.production;
      return { config, envOverrides };
    },
    deep_clone: () => JSON.parse(JSON.stringify(validConfigs.enterprise)),
    validation: () => {
      const config = validConfigs.enterprise;
      return !!(config.schema && config.enterprise && config.security);
    }
  }
};

/**
 * Error Simulation Test Data
 */
const errorSimulationData = {
  corruptedYaml: `
schema:
  version: "1.0"
  invalid_yaml: [unclosed array
enterprise:
  enabled: true
  bad_indentation:
wrong_level: "value"
`,

  emptyFile: '',

  nonObjectRoot: 'just a string value',

  invalidUnicode: 'schema:\n  version: "1.0"\n  invalid: "\uFFFE"',

  hugeLine: 'schema:\n  version: "1.0"\n  huge_value: "' + 'x'.repeat(100000) + '"',

  deeplyNested: (() => {
    let nested = 'value';
    for (let i = 0; i < 1000; i++) {
      nested = `{ level_${i}: ${nested} }`;
    }
    return `schema:\n  version: "1.0"\n  deep: ${nested}`;
  })(),

  missingClosingBrace: '{\n  "schema": {\n    "version": "1.0"\n  \n  "enterprise": {\n    "enabled": true\n  }',

  duplicateKeys: `
schema:
  version: "1.0"
  version: "2.0"
enterprise:
  enabled: true
  enabled: false
`
};

module.exports = {
  validConfigs,
  invalidConfigs,
  sixSigmaMockConfig,
  legacyConfigs,
  environmentVariableTestData,
  performanceTestData,
  errorSimulationData
};