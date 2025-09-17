"""
Configuration Manager - Eliminates Connascence of Values
========================================================

Centralized configuration management that eliminates hardcoded values
and magic constants throughout the analyzer system.
"""

import os
import yaml
from pathlib import Path
from typing import Any, Dict, List, Optional
from dataclasses import dataclass
import logging

logger = logging.getLogger(__name__)


@dataclass
class DetectorConfig:
    """Configuration for individual detector settings."""
    config_keywords: List[str]
    thresholds: Dict[str, Any] 
    exclusions: Dict[str, List[Any]]
    severity_mapping: Optional[Dict[str, str]] = None
    

@dataclass 
class AnalysisConfig:
    """Main analysis configuration settings."""
    default_policy: str
    max_file_size_mb: int
    max_analysis_time_seconds: int
    parallel_workers: int
    cache_enabled: bool
    

@dataclass
class QualityGates:
    """Quality gate thresholds and limits.""" 
    overall_quality_threshold: float
    critical_violation_limit: int
    high_violation_limit: int
    policies: Dict[str, Dict[str, Any]]


class ConfigurationManager:
    """
    REAL Configuration Manager that actually loads YAML and validates settings.
    Eliminates theater by ensuring all configuration settings affect analyzer behavior.
    """

    def __init__(self, config_dir: Optional[str] = None):
        """Initialize configuration manager with YAML validation."""
        self.config_dir = Path(config_dir) if config_dir else self._get_default_config_dir()
        self._detector_config: Optional[Dict] = None
        self._analysis_config: Optional[Dict] = None
        self._enterprise_config: Optional[Dict] = None
        self._validation_errors: List[str] = []
        self._load_configurations()
        self._validate_all_configurations()
    
    def _get_default_config_dir(self) -> Path:
        """Get default configuration directory."""
        return Path(__file__).parent.parent / "config"
    
    def _load_configurations(self) -> None:
        """Load all configuration files with REAL YAML loading."""
        try:
            # Load detector configuration
            detector_config_path = self.config_dir / "detector_config.yaml"
            if detector_config_path.exists():
                with open(detector_config_path, 'r') as f:
                    self._detector_config = yaml.safe_load(f)
                logger.info(f"Loaded detector config from {detector_config_path}")
            else:
                logger.warning(f"Detector config not found: {detector_config_path}")
                self._detector_config = self._get_default_detector_config()

            # Load analysis configuration
            analysis_config_path = self.config_dir / "analysis_config.yaml"
            if analysis_config_path.exists():
                with open(analysis_config_path, 'r') as f:
                    self._analysis_config = yaml.safe_load(f)
                logger.info(f"Loaded analysis config from {analysis_config_path}")
            else:
                logger.warning(f"Analysis config not found: {analysis_config_path}")
                self._analysis_config = self._get_default_analysis_config()

            # Load enterprise configuration (NEW - was missing!)
            enterprise_config_path = self.config_dir / "enterprise_config.yaml"
            if enterprise_config_path.exists():
                with open(enterprise_config_path, 'r') as f:
                    self._enterprise_config = yaml.safe_load(f)
                logger.info(f"Loaded enterprise config from {enterprise_config_path}")
            else:
                logger.warning(f"Enterprise config not found: {enterprise_config_path}")
                self._enterprise_config = self._get_default_enterprise_config()

        except Exception as e:
            logger.error(f"Failed to load configurations: {e}")
            # Fall back to defaults
            self._detector_config = self._get_default_detector_config()
            self._analysis_config = self._get_default_analysis_config()
            self._enterprise_config = self._get_default_enterprise_config()
    
    def get_detector_config(self, detector_name: str) -> DetectorConfig:
        """
        Get configuration for a specific detector with REAL YAML loading.

        Args:
            detector_name: Name of the detector (e.g., 'position_detector')

        Returns:
            DetectorConfig object with settings loaded from YAML
        """
        # Ensure configurations are loaded
        if self._detector_config is None:
            self._load_configurations()

        config_data = self._detector_config.get(detector_name, {})

        # Debug: Log configuration access for verification
        print(f"DEBUG: Loading config for {detector_name}: {config_data}")

        return DetectorConfig(
            config_keywords=config_data.get('config_keywords', []),
            thresholds=config_data.get('thresholds', {}),
            exclusions=config_data.get('exclusions', {}),
            severity_mapping=config_data.get('severity_mapping')
        )

    def get_nested(self, path: str, default_value: Any = None) -> Any:
        """
        Get nested configuration value using dot notation.
        Enables ConfigurableDetectorMixin.get_threshold() to work with nested paths.

        Args:
            path: Dot-separated path (e.g., 'detectors.position.thresholds.max_parameters')
            default_value: Default value if path not found

        Returns:
            Configuration value or default
        """
        parts = path.split('.')
        current = {
            'detector_config': self._detector_config,
            'analysis_config': self._analysis_config,
            'enterprise_config': self._enterprise_config
        }

        for part in parts:
            if isinstance(current, dict) and part in current:
                current = current[part]
            else:
                return default_value

        return current if current is not None else default_value
    
    def get_analysis_config(self) -> AnalysisConfig:
        """Get main analysis configuration."""
        analysis_data = self._analysis_config.get('analysis', {})
        
        return AnalysisConfig(
            default_policy=analysis_data.get('default_policy', 'standard'),
            max_file_size_mb=analysis_data.get('max_file_size_mb', 10),
            max_analysis_time_seconds=analysis_data.get('max_analysis_time_seconds', 300),
            parallel_workers=analysis_data.get('parallel_workers', 4), 
            cache_enabled=analysis_data.get('cache_enabled', True)
        )
    
    def get_quality_gates(self) -> QualityGates:
        """Get quality gate configuration."""
        quality_data = self._analysis_config.get('quality_gates', {})
        
        return QualityGates(
            overall_quality_threshold=quality_data.get('overall_quality_threshold', 0.75),
            critical_violation_limit=quality_data.get('critical_violation_limit', 0),
            high_violation_limit=quality_data.get('high_violation_limit', 5),
            policies=quality_data.get('policies', {})
        )
    
    def get_connascence_weights(self) -> Dict[str, float]:
        """Get connascence type weights for scoring."""
        connascence_data = self._analysis_config.get('connascence', {})
        return connascence_data.get('type_weights', {
            'connascence_of_name': 1.0,
            'connascence_of_type': 1.5, 
            'connascence_of_meaning': 2.0,
            'connascence_of_position': 2.5,
            'connascence_of_algorithm': 3.0,
            'connascence_of_execution': 4.0,
            'connascence_of_timing': 5.0,
            'connascence_of_values': 2.0,
            'connascence_of_identity': 3.5
        })
    
    def get_severity_multipliers(self) -> Dict[str, float]:
        """Get severity multipliers for scoring."""
        connascence_data = self._analysis_config.get('connascence', {})
        return connascence_data.get('severity_multipliers', {
            'critical': 10.0,
            'high': 5.0,
            'medium': 2.0,
            'low': 1.0
        })
    
    def get_file_processing_config(self) -> Dict[str, Any]:
        """Get file processing configuration."""
        return self._analysis_config.get('file_processing', {
            'supported_extensions': ['.py', '.pyx', '.pyi'],
            'exclusion_patterns': ['__pycache__', '.git', '.pytest_cache'],
            'max_recursion_depth': 10,
            'follow_symlinks': False
        })
    
    def get_error_handling_config(self) -> Dict[str, Any]:
        """Get error handling configuration."""
        return self._analysis_config.get('error_handling', {
            'continue_on_syntax_error': True,
            'log_all_errors': True,
            'graceful_degradation': True,
            'max_retry_attempts': 3
        })
    
    def get_reporting_config(self) -> Dict[str, Any]:
        """Get reporting and output configuration.""" 
        return self._analysis_config.get('reporting', {
            'default_format': 'text',
            'include_recommendations': True,
            'include_context': True,
            'max_code_snippet_lines': 5
        })
        
    def get_integration_config(self, integration_name: str) -> Dict[str, Any]:
        """
        Get configuration for a specific integration.
        
        Args:
            integration_name: Name of integration ('mcp', 'vscode', 'cli')
            
        Returns:
            Integration-specific configuration
        """
        integrations = self._analysis_config.get('integrations', {})
        return integrations.get(integration_name, {})
    
    def get_policy_config(self, policy_name: str) -> Dict[str, Any]:
        """
        Get configuration for a specific policy.
        
        Args:
            policy_name: Policy name (e.g., 'nasa-compliance', 'strict')
            
        Returns:
            Policy-specific configuration
        """
        quality_gates = self.get_quality_gates()
        return quality_gates.policies.get(policy_name, {
            'quality_threshold': 0.75,
            'violation_limits': {
                'critical': 0,
                'high': 5,
                'medium': 20,
                'low': 50
            }
        })
    
    def get_enterprise_config(self) -> Dict[str, Any]:
        """
        Get enterprise module configuration from REAL YAML loading.

        Returns:
            Enterprise configuration dictionary loaded from enterprise_config.yaml
        """
        if self._enterprise_config:
            return self._enterprise_config

        # Fallback to analysis config enterprise section
        return self._analysis_config.get('enterprise', {
            'features': {
                'sixsigma': {
                    'state': 'disabled',
                    'description': 'Six Sigma quality analysis and DMAIC methodology',
                    'performance_impact': 'low',
                    'min_nasa_compliance': 0.92,
                    'dependencies': []
                },
                'dfars_compliance': {
                    'state': 'disabled', 
                    'description': 'DFARS 252.204-7012 compliance checking',
                    'performance_impact': 'medium',
                    'min_nasa_compliance': 0.95,
                    'dependencies': []
                },
                'supply_chain_governance': {
                    'state': 'disabled',
                    'description': 'Supply chain security and SBOM analysis',
                    'performance_impact': 'medium',
                    'min_nasa_compliance': 0.92,
                    'dependencies': []
                }
            },
            'modules': {
                'sixsigma': {
                    'dmaic_enabled': True,
                    'statistical_thresholds': {
                        'cpk_minimum': 1.33,
                        'sigma_level_target': 6.0,
                        'defect_density_target': 3.4e-6  # 3.4 per million
                    },
                    'quality_gates': {
                        'sigma_level_minimum': 4.0,
                        'cpk_minimum': 1.33,
                        'defect_density_maximum': 0.34  # per 100 LOC
                    }
                },
                'compliance': {
                    'dfars_level': 'basic',  # basic, enhanced, full
                    'cmmi_target_level': 3,
                    'audit_retention_days': 2555,  # 7 years
                    'nist_controls': [
                        '3.1.1',  # Access Control
                        '3.1.2',  # Access Control  
                        '3.3.1',  # Audit and Accountability
                        '3.4.1'   # Configuration Management
                    ],
                    'security_requirements': {
                        'encryption_required': True,
                        'access_logging_required': True,
                        'vulnerability_scanning': True
                    }
                },
                'supply_chain': {
                    'sbom_enabled': True,
                    'vulnerability_scanning': True,
                    'provenance_tracking': True,
                    'risk_thresholds': {
                        'max_dependencies': 100,
                        'max_vulnerability_score': 7.0,
                        'required_license_types': ['MIT', 'Apache-2.0', 'BSD-3-Clause']
                    },
                    'compliance_frameworks': ['NTIA', 'SPDX']
                }
            },
            'performance': {
                'monitoring_enabled': True,
                'performance_alerts': {
                    'max_execution_time': 0.5,  # 500ms
                    'max_memory_increase': 50   # 50MB
                },
                'optimization': {
                    'caching_enabled': True,
                    'lazy_loading': True,
                    'early_returns': True
                }
            }
        })
    
    def _get_default_detector_config(self) -> Dict[str, Any]:
        """Get default detector configuration as fallback - MUST match YAML structure."""
        return {
            'values_detector': {
                'config_keywords': ['config', 'setting', 'option', 'param'],
                'thresholds': {'duplicate_literal_minimum': 3},
                'exclusions': {'common_strings': ['', ' ', '\n'], 'common_numbers': [0, 1, -1]}
            },
            'position_detector': {
                'thresholds': {'max_positional_params': 3},
                'severity_mapping': {'4-6': 'medium', '7-10': 'high', '11+': 'critical'}
            },
            'magic_literal_detector': {
                'thresholds': {
                    'number_repetition': 3,
                    'string_repetition': 2
                },
                'severity_rules': {
                    'in_conditionals': 'high',
                    'large_numbers': 'medium',
                    'string_literals': 'low'
                }
            },
            'god_object_detector': {
                'thresholds': {
                    'method_threshold': 20,
                    'loc_threshold': 500,
                    'parameter_threshold': 10
                }
            },
            'algorithm_detector': {
                'thresholds': {
                    'minimum_function_lines': 3,
                    'duplicate_threshold': 2
                },
                'normalization': {
                    'ignore_variable_names': True,
                    'ignore_comments': True,
                    'focus_on_structure': True
                }
            }
        }
    
    def _get_default_analysis_config(self) -> Dict[str, Any]:
        """Get default analysis configuration as fallback."""
        return {
            'analysis': {
                'default_policy': 'standard',
                'max_file_size_mb': 10,
                'max_analysis_time_seconds': 300,
                'parallel_workers': 4,
                'cache_enabled': True
            },
            'quality_gates': {
                'overall_quality_threshold': 0.75,
                'critical_violation_limit': 0,
                'high_violation_limit': 5,
                'policies': {
                    'standard': {
                        'quality_threshold': 0.75,
                        'violation_limits': {'critical': 0, 'high': 5, 'medium': 20, 'low': 50}
                    }
                }
            }
        }

    def _get_default_enterprise_config(self) -> Dict[str, Any]:
        """Get default enterprise configuration as fallback."""
        return {
            'sixSigma': {
                'targetSigma': 4.0,
                'sigmaShift': 1.5,
                'performanceThreshold': 1.2,
                'maxExecutionTime': 5000,
                'maxMemoryUsage': 100
            },
            'quality': {
                'targetSigma': 4.0,
                'sigmaShift': 1.5,
                'nasaPOT10Target': 95,
                'auditTrailEnabled': True
            },
            'performance': {
                'maxOverhead': 1.2,
                'maxExecutionTime': 5000,
                'maxMemoryUsage': 100,
                'monitoringEnabled': True
            },
            'compliance': {
                'nasaPOT10': 95,
                'auditTrailEnabled': True,
                'evidenceRequirements': {
                    'ctqCalculations': True,
                    'spcCharts': True,
                    'dpmoAnalysis': True,
                    'theaterDetection': True
                }
            },
            'theater': {
                'enableDetection': True,
                'riskThresholds': {
                    'low': 0.3,
                    'medium': 0.6,
                    'high': 0.8
                }
            },
            'artifacts': {
                'outputPath': '.claude/.artifacts/sixsigma/',
                'reportFormats': ['executive', 'detailed', 'technical', 'dashboard']
            }
        }
    
    def reload_configurations(self) -> None:
        """Reload all configuration files."""
        self._load_configurations()
        logger.info("Configuration reloaded successfully")
    
    def _validate_all_configurations(self) -> None:
        """Validate all loaded configurations and store errors."""
        self._validation_errors = []

        # Validate detector configuration
        if self._detector_config:
            self._validate_detector_config()

        # Validate analysis configuration
        if self._analysis_config:
            self._validate_analysis_config()

        # Validate enterprise configuration
        if self._enterprise_config:
            self._validate_enterprise_config()

        if self._validation_errors:
            logger.warning(f"Configuration validation found {len(self._validation_errors)} issues")
            for error in self._validation_errors:
                logger.warning(f"  - {error}")

    def _validate_detector_config(self) -> None:
        """Validate detector configuration settings."""
        # Iterate through all detector configurations (not just nested under 'detectors')
        for detector_name, config in self._detector_config.items():
            if not isinstance(config, dict):
                continue

            thresholds = config.get('thresholds', {})

            # Validate position detector thresholds
            if detector_name == 'position_detector':
                max_params = thresholds.get('max_positional_params')
                if max_params is not None and max_params < 1:
                    self._validation_errors.append(f"Position detector max_positional_params must be >= 1, got {max_params}")

            # Validate magic literal detector thresholds
            elif detector_name == 'magic_literal_detector':
                number_repetition = thresholds.get('number_repetition')
                if number_repetition is not None and number_repetition < 1:
                    self._validation_errors.append(f"Magic literal number_repetition must be >= 1, got {number_repetition}")

                string_repetition = thresholds.get('string_repetition')
                if string_repetition is not None and string_repetition < 1:
                    self._validation_errors.append(f"Magic literal string_repetition must be >= 1, got {string_repetition}")

            # Validate god object detector thresholds
            elif detector_name == 'god_object_detector':
                method_threshold = thresholds.get('method_threshold')
                if method_threshold is not None and method_threshold < 1:
                    self._validation_errors.append(f"God object method_threshold must be >= 1, got {method_threshold}")

                loc_threshold = thresholds.get('loc_threshold')
                if loc_threshold is not None and loc_threshold < 1:
                    self._validation_errors.append(f"God object loc_threshold must be >= 1, got {loc_threshold}")

    def _validate_analysis_config(self) -> None:
        """Validate analysis configuration settings."""
        analysis = self._analysis_config.get('analysis', {})

        # Validate parallel workers
        workers = analysis.get('parallel_workers')
        if workers is not None and workers < 1:
            self._validation_errors.append(f"Parallel workers must be >= 1, got {workers}")

        # Validate file size limit
        file_size = analysis.get('max_file_size_mb')
        if file_size is not None and file_size < 1:
            self._validation_errors.append(f"Max file size must be >= 1 MB, got {file_size}")

        # Validate quality gates
        quality_gates = self._analysis_config.get('quality_gates', {})
        threshold = quality_gates.get('overall_quality_threshold')
        if threshold is not None and not (0.0 <= threshold <= 1.0):
            self._validation_errors.append(f"Quality threshold must be between 0.0 and 1.0, got {threshold}")

    def _validate_enterprise_config(self) -> None:
        """Validate enterprise configuration settings."""
        if 'sixSigma' in self._enterprise_config:
            six_sigma = self._enterprise_config['sixSigma']
            target_sigma = six_sigma.get('targetSigma')
            if target_sigma is not None and not (1.0 <= target_sigma <= 6.0):
                self._validation_errors.append(f"Six Sigma target must be between 1.0 and 6.0, got {target_sigma}")

        if 'compliance' in self._enterprise_config:
            compliance = self._enterprise_config['compliance']
            nasa_target = compliance.get('nasaPOT10')
            if nasa_target is not None and not (0 <= nasa_target <= 100):
                self._validation_errors.append(f"NASA POT10 target must be between 0 and 100, got {nasa_target}")

    def validate_configuration(self) -> List[str]:
        """
        Validate configuration completeness and correctness.

        Returns:
            List of validation issues found
        """
        issues = []

        # Return cached validation errors
        issues.extend(self._validation_errors)

        # Check detector config
        if not self._detector_config:
            issues.append("Detector configuration is missing")

        # Check analysis config
        if not self._analysis_config:
            issues.append("Analysis configuration is missing")

        # Check enterprise config
        if not self._enterprise_config:
            issues.append("Enterprise configuration is missing")

        return issues


# Global configuration manager instance with REAL initialization
_config_manager: Optional[ConfigurationManager] = None


def get_config_manager() -> ConfigurationManager:
    """Get the global configuration manager instance with REAL YAML loading."""
    global _config_manager
    if _config_manager is None:
        print("DEBUG: Initializing ConfigurationManager with YAML loading")
        _config_manager = ConfigurationManager()
        # Verify that configuration loaded successfully
        validation_issues = _config_manager.validate_configuration()
        if validation_issues:
            print(f"DEBUG: Configuration validation issues: {validation_issues}")
        else:
            print("DEBUG: Configuration validation successful")
    return _config_manager


def reset_config_manager():
    """Reset the global configuration manager (for testing)."""
    global _config_manager
    _config_manager = None


def initialize_config_manager(config_dir: Optional[str] = None) -> ConfigurationManager:
    """Initialize the global configuration manager with custom directory."""
    global _config_manager
    _config_manager = ConfigurationManager(config_dir)
    return _config_manager


# Convenience functions for common configuration access
def get_detector_config(detector_name: str) -> DetectorConfig:
    """Convenience function to get detector configuration."""
    return get_config_manager().get_detector_config(detector_name)


def get_analysis_config() -> AnalysisConfig:
    """Convenience function to get analysis configuration."""
    return get_config_manager().get_analysis_config()


def get_quality_gates() -> QualityGates:
    """Convenience function to get quality gates."""
    return get_config_manager().get_quality_gates()