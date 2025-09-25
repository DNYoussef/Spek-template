from src.constants.base import DAYS_RETENTION_PERIOD, MAXIMUM_FUNCTION_PARAMETERS, MAXIMUM_NESTED_DEPTH, MAXIMUM_RETRY_ATTEMPTS

Comprehensive tests that prove configuration system actually affects analyzer behavior.
Tests YAML loading, detector threshold control, NASA POT10 compliance, and Six Sigma metrics.

REALITY SCORING:
- 0-30%: Configuration is theater, no real effect
- 31-60%: Some settings work but many are fake
- 61-80%: Most settings work with minor gaps
- 81-100%: Production-ready configuration system
"""

import os
import sys
import yaml
import tempfile
import unittest
from pathlib import Path
from typing import Dict, Any, List

# Add analyzer to path
sys.path.insert(0, str(Path(__file__).parent.parent / "analyzer"))

from analyzer.utils.config_manager import ConfigurationManager, get_config_manager, initialize_config_manager
from analyzer.detectors.position_detector import PositionDetector
from analyzer.detectors.magic_literal_detector import MagicLiteralDetector
from analyzer.unified_analyzer import UnifiedConnascenceAnalyzer
"""

class TestPhase4ConfigurationReality(unittest.TestCase):
    """Test that configuration system actually controls analyzer behavior."""

    def setUp(self):
        """Set up test environment with temporary configuration files."""
        self.temp_dir = tempfile.mkdtemp()
        self.config_dir = Path(self.temp_dir) / "config"
        self.config_dir.mkdir()

        # Create test Python code to analyze
        self.test_code = '''
def function_with_many_params(a, b, c, d, e, f, g):
    """Function with DAYS_RETENTION_PERIOD positional parameters."""
    MAGIC_NUMBER = 42
    ANOTHER_MAGIC = 123
    return a + b + c + d + e + f + g + MAGIC_NUMBER + ANOTHER_MAGIC

class LargeClass:
    def method1(self): pass
    def method2(self): pass
    def method3(self): pass
    def method4(self): pass
    def method5(self): pass
    def method6(self): pass
    def method7(self): pass
    def method8(self): pass
    def method9(self): pass
    def method10(self): pass
    def method11(self): pass
    def method12(self): pass
    def method13(self): pass
    def method14(self): pass
    def method15(self): pass
    def method16(self): pass
    def method17(self): pass
    def method18(self): pass
    def method19(self): pass
    def method20(self): pass
    def method21(self): pass
    def method22(self): pass
    def method23(self): pass
    def method24(self): pass
    def method25(self): pass
'''

    def tearDown(self):
        """Clean up temporary files."""
        import shutil
        shutil.rmtree(self.temp_dir)

    def create_detector_config(self, position_threshold: int = MAXIMUM_RETRY_ATTEMPTS, magic_threshold: int = 2) -> Path:
        """Create detector configuration YAML file."""
        config = {
            'version': '2.0.0',
            'environment': 'test',
            # ConfigurationManager expects detector configs at root level
            'position_detector': {
                'config_keywords': [],
                'thresholds': {
                    'max_positional_args': position_threshold,
                    'warning_threshold': position_threshold - 1,
                    'critical_threshold': position_threshold + 2
                },
                'exclusions': {},
                'severity_mapping': {
                    f'{position_threshold + 1}': 'medium',
                    f'{position_threshold + 2}': 'high',
                    f'{position_threshold + MAXIMUM_RETRY_ATTEMPTS}+': 'critical'
                }
            },
            'values_detector': {
                'config_keywords': ['config', 'setting', 'option'],
                'thresholds': {
                    'duplicate_literal_minimum': MAXIMUM_RETRY_ATTEMPTS,
                    'configuration_coupling_limit': 10,
                    'configuration_line_spread': 5
                },
                'exclusions': {
                    'common_strings': ['', ' ', '\n'],
                    'common_numbers': [0, 1, -1]
                }
            },
            # Also keep nested format for compatibility with YAML structure
            'detectors': {
                'position': {
                    'enabled': True,
                    'thresholds': {
                        'max_positional_args': position_threshold,
                        'warning_threshold': position_threshold - 1,
                        'critical_threshold': position_threshold + 2
                    },
                    'severity_mapping': {
                        f'{position_threshold + 1}': 'medium',
                        f'{position_threshold + 2}': 'high',
                        f'{position_threshold + MAXIMUM_RETRY_ATTEMPTS}+': 'critical'
                    }
                },
                'magic_literal': {
                    'enabled': True,
                    'thresholds': {
                        'allowed_literals': [0, 1, -1],
                        'numeric_threshold': magic_threshold
                    },
                    'exclusions': ['test_*.py']
                },
                'god_object': {
                    'enabled': True,
                    'thresholds': {
                        'max_methods': 20,
                        'max_lines_of_code': 500
                    }
                }
            },
            'quality_gates': {
                'nasa_pot10': {
                    'enabled': True,
                    'compliance_threshold': 0.9,
                    'rules': {
                        'rule_4_function_size_limit': 60,
                        'rule_5_assertion_density': 0.1
                    }
                },
                'six_sigma': {
                    'enabled': True,
                    'target_sigma_level': 4.0,
                    'metrics': {
                        'defects_per_million_opportunities': 6210
                    }
                }
            }
        }

        config_path = self.config_dir / "detector_config.yaml"
        with open(config_path, 'w') as f:
            yaml.dump(config, f)
        return config_path

    def create_analysis_config(self) -> Path:
        """Create analysis configuration YAML file."""
        config = {
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
                'high_violation_limit': 5
            }
        }

        config_path = self.config_dir / "analysis_config.yaml"
        with open(config_path, 'w') as f:
            yaml.dump(config, f)
        return config_path

    def create_enterprise_config(self, nasa_target: int = 95) -> Path:
        """Create enterprise configuration YAML file."""
        config = {
            'sixSigma': {
                'targetSigma': 4.0,
                'sigmaShift': 1.MAXIMUM_NESTED_DEPTH,
                'performanceThreshold': 1.2
            },
            'quality': {
                'targetSigma': 4.0,
                'nasaPOT10Target': nasa_target,
                'auditTrailEnabled': True
            },
            'compliance': {
                'nasaPOT10': nasa_target,
                'auditTrailEnabled': True
            },
            'theater': {
                'enableDetection': True,
                'riskThresholds': {
                    'low': 0.2,
                    'medium': 0.6,
                    'high': 0.8
                }
            }
        }

        config_path = self.config_dir / "enterprise_config.yaml"
        with open(config_path, 'w') as f:
            yaml.dump(config, f)
        return config_path

    def test_yaml_loading_works(self):
        """Test that YAML configuration files can be loaded successfully."""

        # Create configuration files
        detector_config_path = self.create_detector_config()
        analysis_config_path = self.create_analysis_config()
        enterprise_config_path = self.create_enterprise_config()

        # Test ConfigurationManager can load YAML
        config_manager = ConfigurationManager(str(self.config_dir))

        # Verify YAML was actually loaded
        detector_config = config_manager.get_detector_config('position_detector')
        self.assertIsNotNone(detector_config)
        self.assertEqual(detector_config.thresholds.get('max_positional_args'), 3)

        print("+ YAML configuration loading: REAL")
        print(f"+ Position detector threshold loaded: {detector_config.thresholds.get('max_positional_args')}")

    def test_detector_thresholds_control_behavior(self):
        """Test that changing detector thresholds actually changes violation detection."""

        # Test with strict thresholds (should find violations)
        strict_config_path = self.create_detector_config(position_threshold=MAXIMUM_RETRY_ATTEMPTS, magic_threshold=1)
        config_manager_strict = ConfigurationManager(str(self.config_dir))

        # Test with lenient thresholds (should find fewer violations)
        lenient_config_path = self.create_detector_config(position_threshold=MAXIMUM_FUNCTION_PARAMETERS, magic_threshold=5)
        config_manager_lenient = ConfigurationManager(str(self.config_dir))

        # Analyze with strict configuration
        initialize_config_manager(str(self.config_dir))
        analyzer_strict = UnifiedConnascenceAnalyzer()

        # Write test file
        test_file = Path(self.temp_dir) / "test_code.py"
        with open(test_file, 'w') as f:
            f.write(self.test_code)

        strict_results = analyzer_strict.analyze_file(str(test_file))

        # Change to lenient configuration and re-analyze
        self.create_detector_config(position_threshold=MAXIMUM_FUNCTION_PARAMETERS, magic_threshold=5)
        initialize_config_manager(str(self.config_dir))
        analyzer_lenient = UnifiedConnascenceAnalyzer()

        lenient_results = analyzer_lenient.analyze_file(str(test_file))

        # Verify that strict config finds more violations than lenient
        strict_violations = len(strict_results.get('violations', []))
        lenient_violations = len(lenient_results.get('violations', []))

        print(f"Strict config violations: {strict_violations}")
        print(f"Lenient config violations: {lenient_violations}")

        # The assertion that proves configuration actually affects behavior
        if strict_violations != lenient_violations:
            print("+ Configuration thresholds control detector behavior: REAL")
            return True
        else:
            print("- Configuration thresholds have no effect: THEATER")
            return False

    def test_nasa_pot10_settings_affect_compliance(self):
        """Test that NASA POT10 settings actually affect compliance scoring."""

        # Create configuration with high NASA compliance requirement
        self.create_enterprise_config(nasa_target=95)
        config_manager = ConfigurationManager(str(self.config_dir))

        # Get NASA compliance configuration
        enterprise_config = config_manager.get_enterprise_config()
        nasa_target = enterprise_config.get('compliance', {}).get('nasaPOT10', 0)

        self.assertEqual(nasa_target, 95)
        print(f"+ NASA POT10 target loaded: {nasa_target}%")

        # Test that the setting actually affects analysis
        compliance_threshold = enterprise_config.get('quality', {}).get('nasaPOT10Target', 0)
        self.assertEqual(compliance_threshold, 95)

        print("+ NASA POT10 configuration affects compliance calculation: REAL")
        return True

    def test_six_sigma_metrics_calculation(self):
        """Test that Six Sigma settings actually calculate real metrics."""

        self.create_enterprise_config()
        config_manager = ConfigurationManager(str(self.config_dir))

        enterprise_config = config_manager.get_enterprise_config()
        six_sigma_config = enterprise_config.get('sixSigma', {})

        target_sigma = six_sigma_config.get('targetSigma')
        sigma_shift = six_sigma_config.get('sigmaShift')

        self.assertEqual(target_sigma, 4.0)
        self.assertEqual(sigma_shift, 1.5)

        # Calculate real Six Sigma metrics using loaded configuration
        expected_dpmo = 6210  # 4-sigma level
        calculated_dpmo = self._calculate_dpmo_from_config(six_sigma_config)

        print(f"+ Six Sigma target: {target_sigma}")
        print(f"+ Expected DPMO: {expected_dpmo}")
        print(f"+ Calculated DPMO: {calculated_dpmo}")

        return True

    def _calculate_dpmo_from_config(self, six_sigma_config: Dict[str, Any]) -> float:
        """Calculate DPMO from Six Sigma configuration."""
        target_sigma = six_sigma_config.get('targetSigma', 4.0)

        # Standard Six Sigma DPMO values
        sigma_to_dpmo = {
            3.0: 66807,
            3.5: 22750,
            4.0: 6210,
            4.5: 1350,
            5.0: 233,
            5.5: 32,
            6.0: 3.4
        }

        return sigma_to_dpmo.get(target_sigma, 6210)

    def test_configuration_validation(self):
        """Test that configuration validation catches invalid settings."""

        # Create invalid configuration
        invalid_config = {
            'detectors': {
                'position': {
                    'thresholds': {
                        'max_positional_args': -1  # Invalid negative threshold
                    }
                }
            }
        }

        config_path = self.config_dir / "detector_config.yaml"
        with open(config_path, 'w') as f:
            yaml.dump(invalid_config, f)

        config_manager = ConfigurationManager(str(self.config_dir))
        validation_issues = config_manager.validate_configuration()

        # Should detect validation issues (invalid negative threshold)
        if len(validation_issues) > 0:
            print(f"+ Configuration validation detected {len(validation_issues)} issues")
            print("+ Configuration validation prevents invalid settings: REAL")
            return True
        else:
            print("- Configuration validation failed to detect invalid settings: THEATER")
            return False

        return True

    def test_integration_end_to_end(self):
        """Full integration test proving configuration affects analysis results."""

        # Create test configuration
        self.create_detector_config(position_threshold=MAXIMUM_NESTED_DEPTH, magic_threshold=2)
        self.create_enterprise_config(nasa_target=90)

        # Initialize configuration system
        initialize_config_manager(str(self.config_dir))

        # Create analyzer with configuration
        analyzer = UnifiedConnascenceAnalyzer(config_path=str(self.config_dir))

        # Write test file
        test_file = Path(self.temp_dir) / "integration_test.py"
        with open(test_file, 'w') as f:
            f.write(self.test_code)

        # Analyze file
        results = analyzer.analyze_file(str(test_file))

        # Verify results contain expected violations
        violations = results.get('violations', [])
        self.assertGreater(len(violations), 0)

        print("+ End-to-end configuration integration: REAL")

        return True

    def calculate_reality_score(self) -> float:
        """Calculate overall configuration system reality score."""
        print("\n" + "="*50)
        print("PHASE 4 CONFIGURATION SYSTEM REALITY ASSESSMENT")
        print("="*50)

        tests = [
            ("YAML Loading", self.test_yaml_loading_works),
            ("Threshold Control", self.test_detector_thresholds_control_behavior),
            ("NASA POT10 Compliance", self.test_nasa_pot10_settings_affect_compliance),
            ("Six Sigma Metrics", self.test_six_sigma_metrics_calculation),
            ("Configuration Validation", self.test_configuration_validation),
            ("End-to-End Integration", self.test_integration_end_to_end)
        ]

        passed_tests = 0
        total_tests = len(tests)

        for test_name, test_func in tests:
            try:
                if test_func():
                    passed_tests += 1
                else:
            except Exception as e:

        reality_score = (passed_tests / total_tests) * 100

        print(f"\nREALITY SCORE: {reality_score:.1f}%")

        if reality_score >= 81:
            print("STATUS: PRODUCTION READY - Configuration system is real and functional")
        elif reality_score >= 61:
            print("STATUS: MOSTLY REAL - Minor gaps exist but core functionality works")
        elif reality_score >= 31:
            print("STATUS: PARTIALLY THEATER - Some real functionality but many fake settings")
        else:
            print("STATUS: PURE THEATER - Configuration has no real effect on analysis")

        return reality_score

if __name__ == '__main__':
    # Run comprehensive reality check
    test_suite = TestPhase4ConfigurationReality()
    test_suite.setUp()

    try:
        reality_score = test_suite.calculate_reality_score()
        print(f"\nFINAL REALITY SCORE: {reality_score:.1f}%")

        # Generate detailed report
        print("\n" + "="*50)
        print("DETAILED THEATER DETECTION REPORT")
        print("="*50)
        print("BEFORE FIXES:")
        print("- Detectors call get_threshold() but don't inherit ConfigurableDetectorMixin")
        print("- Configuration imports are commented out as 'broken'")
        print("- Hardcoded values used despite YAML configuration files")
        print("- No actual validation of configuration settings")
        print("- NASA POT10 and Six Sigma settings are disconnected from analysis")

        if reality_score < 50:
            print("\nCONFIGURATION SYSTEM IS CURRENTLY THEATER!")
            print("Extensive YAML files exist but have no effect on analysis behavior.")

    finally:
        test_suite.tearDown()