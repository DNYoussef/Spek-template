from src.constants.base import MINIMUM_TEST_COVERAGE_PERCENTAGE

import pytest
from unittest.mock import patch, mock_open
from src.utils.validation.validation_framework import ValidationEngine, ValidationResult

class TestValidationFramework:
    """Test the core validation framework."""

    def test_validation_engine_registration(self):
        """Test strategy registration in validation engine."""
        from src.enterprise.integration.analyzer_validation_strategies import SyntaxValidationStrategy

        engine = ValidationEngine()
        strategy = SyntaxValidationStrategy()

        engine.register_strategy("syntax", strategy)
        strategies = engine.get_registered_strategies()

        assert "syntax" in strategies
        assert len(strategies) == 1

    def test_validation_engine_unknown_strategy(self):
        """Test validation with unknown strategy."""
        engine = ValidationEngine()

        result = engine.validate("unknown", "test data")

        assert not result.is_valid
        assert "Unknown validation strategy: unknown" in result.errors[0]

    def test_validation_result_immutability(self):
        """Test that ValidationResult is immutable."""
        result = ValidationResult(is_valid=True, errors=[], warnings=[])

        # Should not be able to modify after creation
        with pytest.raises(AttributeError):
            result.is_valid = False

class TestAnalyzerValidationStrategies:
    """Test analyzer validation strategies."""

    def test_syntax_validation_strategy_valid_code(self):
        """Test syntax validation with valid Python code."""
        from src.enterprise.integration.analyzer_validation_strategies import SyntaxValidationStrategy

        strategy = SyntaxValidationStrategy()
        valid_code = "def hello():\n    return 'world'"

        result = strategy.validate(valid_code)

        assert result.is_valid
        assert len(result.errors) == 0
        assert result.score == 1.0

    def test_syntax_validation_strategy_invalid_code(self):
        """Test syntax validation with invalid Python code."""
        from src.enterprise.integration.analyzer_validation_strategies import SyntaxValidationStrategy

        strategy = SyntaxValidationStrategy()
        invalid_code = "def hello(\n    return 'world'"

        result = strategy.validate(invalid_code)

        assert not result.is_valid
        assert len(result.errors) > 0
        assert "Syntax error" in result.errors[0]

    def test_syntax_validation_strategy_security_warnings(self):
        """Test syntax validation security warnings."""
        from src.enterprise.integration.analyzer_validation_strategies import SyntaxValidationStrategy

        strategy = SyntaxValidationStrategy()
        risky_code = "eval('1+1')\nexec('print(1)')"

        result = strategy.validate(risky_code)

        assert result.is_valid  # Syntax is valid
        assert len(result.warnings) > 0
        assert any("exec/eval detected" in warning for warning in result.warnings)

    def test_security_validation_strategy_patterns(self):
        """Test security validation pattern detection."""
        from src.enterprise.integration.analyzer_validation_strategies import SecurityValidationStrategy

        strategy = SecurityValidationStrategy()
        risky_code = "subprocess.call('ls', shell=True)\npassword = 'secret123'"

        result = strategy.validate(risky_code)

        assert not result.is_valid
        assert len(result.errors) >= 2
        assert result.score < 1.0

    def test_performance_validation_strategy_metrics(self):
        """Test performance validation with metrics."""
        from src.enterprise.integration.analyzer_validation_strategies import PerformanceValidationStrategy

        strategy = PerformanceValidationStrategy()
        metrics = {
            'execution_time_ms': 1000,
            'memory_usage_mb': 100,
            'cyclomatic_complexity': 10
        }

        result = strategy.validate(metrics)

        assert result.is_valid
        assert result.score > 0.5

    def test_performance_validation_strategy_high_metrics(self):
        """Test performance validation with high metrics."""
        from src.enterprise.integration.analyzer_validation_strategies import PerformanceValidationStrategy

        strategy = PerformanceValidationStrategy()
        metrics = {
            'execution_time_ms': 6000,  # > 5 seconds
            'memory_usage_mb': 600,     # > 500 MB
            'cyclomatic_complexity': 20  # > 15
        }

        result = strategy.validate(metrics)

        assert not result.is_valid
        assert len(result.errors) >= 2
        assert result.score < 0.5

    def test_compliance_validation_strategy_headers(self):
        """Test compliance validation for required headers."""
        from src.enterprise.integration.analyzer_validation_strategies import ComplianceValidationStrategy

        strategy = ComplianceValidationStrategy()
        code_with_headers = '# SPDX-License-Identifier: MIT\n# SPDX-FileCopyrightText: 2024\n"""\nModule docstring\n"""\ndef func():\n    """Function docstring"""\n    pass'

        result = strategy.validate(code_with_headers)

        assert result.is_valid
        assert result.score > 0.8

    def test_compliance_validation_strategy_missing_headers(self):
        """Test compliance validation with missing headers."""
        from src.enterprise.integration.analyzer_validation_strategies import ComplianceValidationStrategy

        strategy = ComplianceValidationStrategy()
        code_without_headers = 'def func():\n    pass'

        result = strategy.validate(code_without_headers)

        assert result.is_valid  # Warnings, not errors
        assert len(result.warnings) > 0
        assert result.score < 1.0

class TestDFARSValidationStrategies:
    """Test DFARS validation strategies."""

    def test_access_control_validation_strategy_patterns(self):
        """Test access control validation pattern detection."""
        from scripts.validation.dfars_validation_strategies import AccessControlValidationStrategy

        strategy = AccessControlValidationStrategy()
        code_with_access_control = "class PathSecurityValidator:\n    def authenticate(self):\n        pass\n    def authorize(self):\n        pass"

        result = strategy.validate(code_with_access_control)

        assert result.is_valid
        assert result.score > 0.5

    def test_access_control_validation_strategy_missing_patterns(self):
        """Test access control validation with missing patterns."""
        from scripts.validation.dfars_validation_strategies import AccessControlValidationStrategy

        strategy = AccessControlValidationStrategy()
        code_without_access_control = "def simple_function():\n    return 'hello'"

        result = strategy.validate(code_without_access_control)

        assert not result.is_valid
        assert "No access control mechanisms found" in result.errors[0]

    def test_audit_validation_strategy_requirements(self):
        """Test audit validation requirements."""
        from scripts.validation.dfars_validation_strategies import AuditValidationStrategy

        strategy = AuditValidationStrategy()
        audit_code = "class DFARSAuditTrailManager:\n    def __init__(self):\n        self.retention = 2555  # 7 years\n        self.integrity_hash = True"

        result = strategy.validate(audit_code)

        assert result.is_valid
        assert result.score > 0.5

    def test_encryption_validation_strategy_approved_algorithms(self):
        """Test encryption validation with approved algorithms."""
        from scripts.validation.dfars_validation_strategies import EncryptionValidationStrategy

        strategy = EncryptionValidationStrategy()
        crypto_code = "import hashlib\nSHA256().update(data)\nAES-256 encryption\nTLSv1_3"

        result = strategy.validate(crypto_code)

        assert result.is_valid
        assert result.score > 0.8

    def test_encryption_validation_strategy_deprecated_algorithms(self):
        """Test encryption validation with deprecated algorithms."""
        from scripts.validation.dfars_validation_strategies import EncryptionValidationStrategy

        strategy = EncryptionValidationStrategy()
        crypto_code = "import hashlib\nsha1_hash = hashlib.sha1(data)\nMD5 checksum"

        result = strategy.validate(crypto_code)

        assert not result.is_valid
        assert len(result.errors) >= 1
        assert result.score < 1.0

    def test_data_protection_validation_strategy_complete(self):
        """Test data protection validation with complete config."""
        from scripts.validation.dfars_validation_strategies import DataProtectionValidationStrategy

        strategy = DataProtectionValidationStrategy()
        protection_config = {
            'encryption_at_rest': True,
            'encryption_in_transit': True,
            'data_classification': 'confidential',
            'backup_encryption': True,
            'sanitization_procedures': True
        }

        result = strategy.validate(protection_config)

        assert result.is_valid
        assert result.score > 0.9

    def test_compliance_reporting_strategy_complete_report(self):
        """Test compliance reporting with complete report."""
        from scripts.validation.dfars_validation_strategies import ComplianceReportingStrategy

        strategy = ComplianceReportingStrategy()
        report = {
            'compliance_score': 0.92,
            'security_enhancements': {'crypto': True},
            'dfars_version': '252.204-7012',
            'assessment_date': '2024-9-14',
            'certification_ready': True
        }

        result = strategy.validate(report)

        assert result.is_valid
        assert result.score > 0.8

class TestPRQualityStrategies:
    """Test PR quality validation strategies."""

    def test_nasa_compliance_strategy_passing(self):
        """Test NASA compliance strategy with passing metrics."""
        from scripts.validation.pr_quality_strategies import NASAComplianceStrategy

        strategy = NASAComplianceStrategy()
        data = {
            'current_compliance': 95,
            'previous_compliance': 90,
            'threshold': 90
        }

        result = strategy.validate(data)

        assert result.is_valid
        assert result.score == 0.95

    def test_nasa_compliance_strategy_degradation(self):
        """Test NASA compliance strategy with degradation."""
        from scripts.validation.pr_quality_strategies import NASAComplianceStrategy

        strategy = NASAComplianceStrategy()
        data = {
            'current_compliance': 85,
            'previous_compliance': 90,
            'threshold': 90
        }

        result = strategy.validate(data)

        assert not result.is_valid
        assert "compliance degraded" in result.errors[0]

    def test_theater_detection_strategy_low_score(self):
        """Test theater detection with low (good) score."""
        from scripts.validation.pr_quality_strategies import TheaterDetectionStrategy

        strategy = TheaterDetectionStrategy()
        data = {'theater_score': 25, 'threshold': 40}

        result = strategy.validate(data)

        assert result.is_valid
        assert result.score == 0.75  # 1.0 - (25/100)

    def test_theater_detection_strategy_high_score(self):
        """Test theater detection with high (bad) score."""
        from scripts.validation.pr_quality_strategies import TheaterDetectionStrategy

        strategy = TheaterDetectionStrategy()
        data = {'theater_score': 50, 'threshold': 40}

        result = strategy.validate(data)

        assert not result.is_valid
        assert "Theater score too high" in result.errors[0]

    def test_god_object_validation_strategy_improvement(self):
        """Test god object validation with improvement."""
        from scripts.validation.pr_quality_strategies import GodObjectValidationStrategy

        strategy = GodObjectValidationStrategy()
        data = {
            'current_god_objects': 8,
            'previous_god_objects': 10,
            'max_allowed': 100
        }

        result = strategy.validate(data)

        assert result.is_valid
        assert result.score > 0.9

    def test_test_coverage_strategy_sufficient(self):
        """Test coverage validation with sufficient coverage."""
        from scripts.validation.pr_quality_strategies import TestCoverageStrategy

        strategy = TestCoverageStrategy()
        data = {
            'coverage_percentage': 85,
            'threshold': MINIMUM_TEST_COVERAGE_PERCENTAGE,
            'line_coverage': 83,
            'branch_coverage': 87
        }

        result = strategy.validate(data)

        assert result.is_valid
        assert result.score == 0.85

    def test_security_scan_strategy_no_issues(self):
        """Test security scan with no issues."""
        from scripts.validation.pr_quality_strategies import SecurityScanStrategy

        strategy = SecurityScanStrategy()
        data = {
            'critical_issues': 0,
            'high_issues': 2,
            'medium_issues': 5,
            'low_issues': 10
        }

        result = strategy.validate(data)

        assert result.is_valid
        assert result.score > 0.6

    def test_security_scan_strategy_critical_issues(self):
        """Test security scan with critical issues."""
        from scripts.validation.pr_quality_strategies import SecurityScanStrategy

        strategy = SecurityScanStrategy()
        data = {
            'critical_issues': 2,
            'high_issues': 3,
            'medium_issues': 5,
            'low_issues': 10
        }

        result = strategy.validate(data)

        assert not result.is_valid
        assert "Critical security issues found" in result.errors[0]

class TestArchitectureValidationStrategies:
    """Test architecture validation strategies."""

    def test_file_structure_strategy_reasonable_size(self):
        """Test file structure validation with reasonable project size."""
        from analyzer.architecture.validation_strategies import FileStructureStrategy

        strategy = FileStructureStrategy()
        data = {
            'total_files': 50,
            'python_files': [f"file_{i}.py" for i in range(40)]
        }

        result = strategy.validate(data)

        assert result.is_valid
        assert result.score == 0.5  # 50/100

    def test_complexity_analysis_strategy_low_complexity(self):
        """Test complexity analysis with low complexity."""
        from analyzer.architecture.validation_strategies import ComplexityAnalysisStrategy

        strategy = ComplexityAnalysisStrategy()
        data = {
            'total_loc': 5000,
            'avg_file_size': 200,
            'large_files': [{'lines_of_code': 600}, {'lines_of_code': 700}]
        }

        result = strategy.validate(data)

        assert result.is_valid
        assert result.score > 0.7

    def test_coupling_analysis_strategy_high_coupling(self):
        """Test coupling analysis with high coupling."""
        from analyzer.architecture.validation_strategies import CouplingAnalysisStrategy

        strategy = CouplingAnalysisStrategy()
        data = {
            'large_files': [{'lines_of_code': i} for i in range(600, 1500, 100)],
            'total_files': 30
        }

        result = strategy.validate(data)

        assert not result.is_valid
        assert result.score < 0.5

    def test_maintainability_strategy_good_maintainability(self):
        """Test maintainability with good metrics."""
        from analyzer.architecture.validation_strategies import MaintainabilityStrategy

        strategy = MaintainabilityStrategy()
        data = {
            'total_loc': 3000,
            'total_files': 20,
            'large_files': [{'lines_of_code': 600}]  # Only 1 large file
        }

        result = strategy.validate(data)

        assert result.is_valid
        assert result.score > 0.7

    def test_architectural_health_strategy_composite_score(self):
        """Test architectural health with composite scoring."""
        from analyzer.architecture.validation_strategies import ArchitecturalHealthStrategy

        strategy = ArchitecturalHealthStrategy()
        data = {
            'coupling_score': 0.3,      # Low coupling (good)
            'complexity_score': 0.4,    # Moderate complexity
            'maintainability_index': 0.8  # High maintainability
        }

        result = strategy.validate(data)

        assert result.is_valid
        assert result.score > 0.7

    def test_hotspot_detection_strategy_critical_hotspots(self):
        """Test hotspot detection with critical hotspots."""
        from analyzer.architecture.validation_strategies import HotspotDetectionStrategy

        strategy = HotspotDetectionStrategy()
        data = {
            'large_files': [
                {'lines_of_code': 1200},  # Critical
                {'lines_of_code': 1500},  # Critical
                {'lines_of_code': 800}    # Major
            ],
            'total_files': 50
        }

        result = strategy.validate(data)

        assert not result.is_valid
        assert "Critical hotspots detected" in result.errors[0]

class TestConfigValidationStrategies:
    """Test supply chain config validation strategies."""

    def test_path_security_strategy_secure_config(self):
        """Test path security with secure configuration."""
        from analyzer.enterprise.supply_chain.config_validation_strategies import PathSecurityStrategy

        strategy = PathSecurityStrategy()
        data = {
            'path_validation_enabled': True,
            'allowed_paths': ['/secure/path', '/another/secure/path']
        }

        result = strategy.validate(data)

        assert result.is_valid
        assert result.score == 1.0

    def test_path_security_strategy_insecure_paths(self):
        """Test path security with insecure paths."""
        from analyzer.enterprise.supply_chain.config_validation_strategies import PathSecurityStrategy

        strategy = PathSecurityStrategy()
        data = {
            'path_validation_enabled': True,
            'allowed_paths': ['/secure/path', '../../../etc/passwd']
        }

        result = strategy.validate(data)

        assert not result.is_valid
        assert "Insecure path pattern detected" in result.errors[0]

    def test_cryptographic_strategy_strong_algorithms(self):
        """Test cryptographic validation with strong algorithms."""
        from analyzer.enterprise.supply_chain.config_validation_strategies import CryptographicStrategy

        strategy = CryptographicStrategy()
        data = {
            'cryptographic_signing': {
                'enabled': True,
                'allowed_algorithms': ['RSA-SHA256', 'ECDSA-SHA256'],
                'min_key_size': 2048
            }
        }

        result = strategy.validate(data)

        assert result.is_valid
        assert result.score > 0.8

    def test_compliance_framework_strategy_dfars_compliant(self):
        """Test compliance framework with DFARS compliance."""
        from analyzer.enterprise.supply_chain.config_validation_strategies import ComplianceFrameworkStrategy

        strategy = ComplianceFrameworkStrategy()
        data = {
            'security_level': 'dfars_compliant',
            'audit_trail_enabled': True,
            'tls_min_version': '1.3',
            'data_protection_level': 'defense_grade'
        }

        result = strategy.validate(data)

        assert result.is_valid
        assert result.score > 0.9

class TestRuleEngine:
    """Test the rule engine functionality."""

    def test_security_rule_engine_dfars_compliance(self):
        """Test security rule engine with DFARS compliance."""
        from analyzer.enterprise.supply_chain.config_validation_strategies import SecurityRuleEngine

        rule_engine = SecurityRuleEngine()
        compliant_data = {
            'supply_chain': {
                'security_level': 'dfars_compliant',
                'audit_trail_enabled': True,
                'tls_min_version': '1.3',
                'require_crypto_validation': True,
                'cryptographic_signing': {
                    'min_key_size': 2048
                }
            }
        }

        result = rule_engine.evaluate(compliant_data)

        assert result.is_valid
        assert len(result.errors) == 0

    def test_security_rule_engine_non_compliant(self):
        """Test security rule engine with non-compliant data."""
        from analyzer.enterprise.supply_chain.config_validation_strategies import SecurityRuleEngine

        rule_engine = SecurityRuleEngine()
        non_compliant_data = {
            'supply_chain': {
                'security_level': 'basic',
                'audit_trail_enabled': False,
                'tls_min_version': '1.2',
                'cryptographic_signing': {
                    'min_key_size': 1024
                }
            }
        }

        result = rule_engine.evaluate(non_compliant_data)

        assert not result.is_valid
        assert len(result.errors) >= 2

if __name__ == "__main__":
    pytest.main([__file__, "-v"])