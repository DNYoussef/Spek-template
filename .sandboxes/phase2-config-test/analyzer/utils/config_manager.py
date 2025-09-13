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
    Centralized configuration manager that eliminates magic values
    and reduces Connascence of Values across the analyzer system.
    """
    
    def __init__(self, config_dir: Optional[str] = None):
        """Initialize configuration manager."""
        self.config_dir = Path(config_dir) if config_dir else self._get_default_config_dir()
        self._detector_config: Optional[Dict] = None
        self._analysis_config: Optional[Dict] = None
        self._load_configurations()
    
    def _get_default_config_dir(self) -> Path:
        """Get default configuration directory."""
        return Path(__file__).parent.parent / "config"
    
    def _load_configurations(self) -> None:
        """Load all configuration files."""
        try:
            # Load detector configuration
            detector_config_path = self.config_dir / "detector_config.yaml"
            if detector_config_path.exists():
                with open(detector_config_path, 'r') as f:
                    self._detector_config = yaml.safe_load(f)
            else:
                logger.warning(f"Detector config not found: {detector_config_path}")
                self._detector_config = self._get_default_detector_config()
            
            # Load analysis configuration  
            analysis_config_path = self.config_dir / "analysis_config.yaml"
            if analysis_config_path.exists():
                with open(analysis_config_path, 'r') as f:
                    self._analysis_config = yaml.safe_load(f)
            else:
                logger.warning(f"Analysis config not found: {analysis_config_path}")
                self._analysis_config = self._get_default_analysis_config()
                
        except Exception as e:
            logger.error(f"Failed to load configurations: {e}")
            # Fall back to defaults
            self._detector_config = self._get_default_detector_config()
            self._analysis_config = self._get_default_analysis_config()
    
    def get_detector_config(self, detector_name: str) -> DetectorConfig:
        """
        Get configuration for a specific detector.
        
        Args:
            detector_name: Name of the detector (e.g., 'values_detector')
            
        Returns:
            DetectorConfig object with settings
        """
        config_data = self._detector_config.get(detector_name, {})
        
        return DetectorConfig(
            config_keywords=config_data.get('config_keywords', []),
            thresholds=config_data.get('thresholds', {}),
            exclusions=config_data.get('exclusions', {}),
            severity_mapping=config_data.get('severity_mapping')
        )
    
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
        Get enterprise module configuration.
        
        Returns:
            Enterprise configuration dictionary
        """
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
        """Get default detector configuration as fallback.""" 
        return {
            'values_detector': {
                'config_keywords': ['config', 'setting', 'option', 'param'],
                'thresholds': {'duplicate_literal_minimum': 3},
                'exclusions': {'common_strings': ['', ' ', '\n'], 'common_numbers': [0, 1, -1]}
            },
            'position_detector': {
                'max_positional_params': 3,
                'severity_mapping': {'4-6': 'medium', '7-10': 'high', '11+': 'critical'}
            },
            'algorithm_detector': {
                'minimum_function_lines': 3,
                'duplicate_threshold': 2
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
    
    def reload_configurations(self) -> None:
        """Reload all configuration files."""
        self._load_configurations()
        logger.info("Configuration reloaded successfully")
    
    def validate_configuration(self) -> List[str]:
        """
        Validate configuration completeness and correctness.
        
        Returns:
            List of validation issues found
        """
        issues = []
        
        # Check detector config
        if not self._detector_config:
            issues.append("Detector configuration is missing")
        
        # Check analysis config
        if not self._analysis_config:
            issues.append("Analysis configuration is missing")
        else:
            analysis_config = self.get_analysis_config()
            if analysis_config.parallel_workers < 1:
                issues.append("Parallel workers must be at least 1")
            if analysis_config.max_file_size_mb < 1:
                issues.append("Max file size must be at least 1 MB")
        
        # Check quality gates
        quality_gates = self.get_quality_gates()
        if not (0.0 <= quality_gates.overall_quality_threshold <= 1.0):
            issues.append("Quality threshold must be between 0.0 and 1.0")
        
        return issues


# Global configuration manager instance
_config_manager: Optional[ConfigurationManager] = None


def get_config_manager() -> ConfigurationManager:
    """Get the global configuration manager instance."""
    global _config_manager
    if _config_manager is None:
        _config_manager = ConfigurationManager()
    return _config_manager


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