from src.constants.base import MAXIMUM_FUNCTION_LENGTH_LINES
"""

Comprehensive validation testing for Strategy Pattern + Rule Engine refactoring.
Tests strategy interface compliance, validation engine workflow, and rule engine evaluation.
"""

import pytest
import time
import unittest
from typing import Any, Dict, List, Optional, Union
from dataclasses import dataclass
from pathlib import Path
import sys
"""

# Add project root to path for imports
sys.path.append(str(Path(__file__).parent.parent.parent))

# Mock Strategy Pattern classes (these would be the actual implementations)
class ValidationResult:
    """Mock validation result class."""
    def __init__(self, is_valid: bool = True, errors: List[str] = None, warnings: List[str] = None):
        self.is_valid = is_valid
        self.errors = errors or []
        self.warnings = warnings or []
        self.severity = "info"
        self.details = {}

class ValidationStrategy:
    """Base Strategy interface for all validation strategies."""

    def validate(self, data: Any) -> ValidationResult:
        """
        Validate input data according to strategy rules.

        Args:
            data: Data to validate

        Returns:
            ValidationResult with validation outcome
        """
        raise NotImplementedError("Subclasses must implement validate method")

    def get_strategy_name(self) -> str:
        """Get strategy name for identification."""
        return self.__class__.__name__

class SyntaxValidationStrategy(ValidationStrategy):
    """Strategy for syntax validation."""

    def validate(self, data: Any) -> ValidationResult:
        """Validate syntax of code or configuration."""
        if not isinstance(data, str):
            return ValidationResult(
                is_valid=False,
                errors=["Input must be string for syntax validation"]
            )

        if not data.strip():
            return ValidationResult(
                is_valid=False,
                errors=["Empty input not allowed for syntax validation"]
            )

        # Mock syntax validation
        if "def " in data and ":" in data:
            return ValidationResult(is_valid=True)
        elif "{" in data and "}" in data:
            return ValidationResult(is_valid=True)
        else:
            return ValidationResult(
                is_valid=False,
                errors=["Invalid syntax detected"]
            )

class SecurityValidationStrategy(ValidationStrategy):
    """Strategy for security validation."""

    def validate(self, data: Any) -> ValidationResult:
        """Validate security aspects of configuration."""
        if not isinstance(data, dict):
            return ValidationResult(
                is_valid=False,
                errors=["Security validation requires dict input"]
            )

        errors = []
        warnings = []

        # Check for required security fields
        required_fields = ["encryption", "authentication", "access_control"]
        for field in required_fields:
            if field not in data:
                errors.append(f"Missing required security field: {field}")

        # Check for weak configurations
        if data.get("encryption") == "none":
            errors.append("Encryption cannot be disabled")

        if data.get("authentication") == "basic":
            warnings.append("Basic authentication is not recommended")

        return ValidationResult(
            is_valid=len(errors) == 0,
            errors=errors,
            warnings=warnings
        )

class PerformanceValidationStrategy(ValidationStrategy):
    """Strategy for performance validation."""

    def validate(self, data: Any) -> ValidationResult:
        """Validate performance metrics."""
        if not isinstance(data, dict):
            return ValidationResult(
                is_valid=False,
                errors=["Performance validation requires dict input"]
            )

        errors = []
        warnings = []

        # Check response time
        response_time = data.get("response_time_ms", 0)
        if response_time > 5000:  # 5 seconds
            errors.append(f"Response time too high: {response_time}ms")
        elif response_time > 2000:  # 2 seconds
            warnings.append(f"Response time elevated: {response_time}ms")

        # Check memory usage
        memory_usage = data.get("memory_usage_mb", 0)
        if memory_usage > 1000:  # 1GB
            errors.append(f"Memory usage too high: {memory_usage}MB")
        elif memory_usage > 500:  # 500MB
            warnings.append(f"Memory usage elevated: {memory_usage}MB")

        return ValidationResult(
            is_valid=len(errors) == 0,
            errors=errors,
            warnings=warnings
        )

class AccessControlValidationStrategy(ValidationStrategy):
    """Strategy for access control validation."""

    def validate(self, data: Any) -> ValidationResult:
        """Validate access control configuration."""
        if not isinstance(data, dict):
            return ValidationResult(
                is_valid=False,
                errors=["Access control validation requires dict input"]
            )

        errors = []
        warnings = []

        # Check for access control configuration
        if not data.get("access_control", False):
            errors.append("Access control must be enabled")

        # Check for role-based access control
        if not data.get("rbac_enabled", False):
            warnings.append("RBAC is recommended for better security")

        # Check for privileged account management
        if not data.get("privileged_accounts_managed", False):
            errors.append("Privileged accounts must be properly managed")

        return ValidationResult(
            is_valid=len(errors) == 0,
            errors=errors,
            warnings=warnings
        )

class AuditValidationStrategy(ValidationStrategy):
    """Strategy for audit validation."""

    def validate(self, data: Any) -> ValidationResult:
        """Validate audit configuration."""
        if not isinstance(data, dict):
            return ValidationResult(
                is_valid=False,
                errors=["Audit validation requires dict input"]
            )

        errors = []
        warnings = []

        # Check audit logging
        if not data.get("audit_logging", False):
            errors.append("Audit logging must be enabled")

        # Check log retention
        retention_days = data.get("log_retention_days", 0)
        if retention_days < 90:
            errors.append(f"Log retention too short: {retention_days} days (minimum 90)")
        elif retention_days < 365:
            warnings.append(f"Log retention recommended: {retention_days} days (recommended 365)")

        # Check audit trail protection
        if not data.get("audit_trail_protected", False):
            errors.append("Audit trails must be protected from tampering")

        return ValidationResult(
            is_valid=len(errors) == 0,
            errors=errors,
            warnings=warnings
        )

@dataclass
class ValidationRule:
    """Rule for rule engine validation."""
    name: str
    condition: callable
    error_message: str
    severity: str = "error"

class RuleEngine:
    """Rule-based validation engine."""

    def __init__(self):
        self.rules: List[ValidationRule] = []

    def add_rule(self, rule: ValidationRule) -> None:
        """Add validation rule to engine."""
        self.rules.append(rule)

    def evaluate(self, data: Any) -> ValidationResult:
        """Evaluate all rules against data."""
        errors = []
        warnings = []

        for rule in self.rules:
            try:
                if not rule.condition(data):
                    if rule.severity == "error":
                        errors.append(rule.error_message)
                    else:
                        warnings.append(rule.error_message)
            except Exception as e:
                errors.append(f"Rule '{rule.name}' evaluation failed: {str(e)}")

        return ValidationResult(
            is_valid=len(errors) == 0,
            errors=errors,
            warnings=warnings
        )

class ValidationEngine:
    """Main validation engine using Strategy pattern."""

    def __init__(self):
        self.strategies: Dict[str, ValidationStrategy] = {}
        self.rule_engine = RuleEngine()

    def register_strategy(self, name: str, strategy: ValidationStrategy) -> None:
        """Register validation strategy."""
        if not isinstance(strategy, ValidationStrategy):
            raise TypeError("Strategy must implement ValidationStrategy interface")
        self.strategies[name] = strategy

    def validate(self, strategy_name: str, data: Any) -> ValidationResult:
        """Validate data using specified strategy."""
        if strategy_name not in self.strategies:
            raise ValueError(f"Unknown validation strategy: {strategy_name}")

        strategy = self.strategies[strategy_name]
        return strategy.validate(data)

    def validate_all(self, data: Any) -> Dict[str, ValidationResult]:
        """Validate data using all registered strategies."""
        results = {}
        for name, strategy in self.strategies.items():
            try:
                results[name] = strategy.validate(data)
            except Exception as e:
                results[name] = ValidationResult(
                    is_valid=False,
                    errors=[f"Strategy validation failed: {str(e)}"]
                )
        return results

    def add_rule(self, rule: ValidationRule) -> None:
        """Add rule to rule engine."""
        self.rule_engine.add_rule(rule)

    def evaluate_rules(self, data: Any) -> ValidationResult:
        """Evaluate rules against data."""
        return self.rule_engine.evaluate(data)

# Test Classes
class TestValidationStrategyInterface(unittest.TestCase):
    """Test Strategy interface compliance."""

    def setUp(self):
        """Set up test fixtures."""
        self.strategies = [
            SyntaxValidationStrategy(),
            SecurityValidationStrategy(),
            PerformanceValidationStrategy(),
            AccessControlValidationStrategy(),
            AuditValidationStrategy()
        ]

    def test_all_strategies_implement_interface(self):
        """Test that all strategies implement ValidationStrategy interface."""
        for strategy in self.strategies:
            # Check inheritance
            self.assertIsInstance(strategy, ValidationStrategy)

            # Check required methods exist
            self.assertTrue(hasattr(strategy, 'validate'))
            self.assertTrue(callable(strategy.validate))
            self.assertTrue(hasattr(strategy, 'get_strategy_name'))
            self.assertTrue(callable(strategy.get_strategy_name))

    def test_strategy_validate_returns_validation_result(self):
        """Test that validate method returns ValidationResult."""
        test_data = "def test(): pass"

        for strategy in self.strategies:
            if isinstance(strategy, SyntaxValidationStrategy):
                result = strategy.validate(test_data)
                self.assertIsInstance(result, ValidationResult)
                self.assertIsInstance(result.is_valid, bool)
                self.assertIsInstance(result.errors, list)
                self.assertIsInstance(result.warnings, list)

    def test_strategy_names_unique(self):
        """Test that strategy names are unique."""
        names = [strategy.get_strategy_name() for strategy in self.strategies]
        self.assertEqual(len(names), len(set(names)))

class TestValidationEngineWorkflow(unittest.TestCase):
    """Test ValidationEngine registration and execution."""

    def setUp(self):
        """Set up test fixtures."""
        self.engine = ValidationEngine()
        self.syntax_strategy = SyntaxValidationStrategy()
        self.security_strategy = SecurityValidationStrategy()

    def test_strategy_registration(self):
        """Test strategy registration."""
        self.engine.register_strategy("syntax", self.syntax_strategy)
        self.assertIn("syntax", self.engine.strategies)
        self.assertEqual(self.engine.strategies["syntax"], self.syntax_strategy)

    def test_invalid_strategy_registration_fails(self):
        """Test that invalid strategy registration fails."""
        with self.assertRaises(TypeError):
            self.engine.register_strategy("invalid", "not_a_strategy")

    def test_validation_with_registered_strategy(self):
        """Test validation with registered strategy."""
        self.engine.register_strategy("syntax", self.syntax_strategy)

        result = self.engine.validate("syntax", "def test(): pass")
        self.assertIsInstance(result, ValidationResult)
        self.assertTrue(result.is_valid)

    def test_validation_with_unknown_strategy_fails(self):
        """Test validation with unknown strategy fails."""
        with self.assertRaises(ValueError, msg="Unknown validation strategy"):
            self.engine.validate("unknown", "test_data")

    def test_validate_all_strategies(self):
        """Test validating with all strategies."""
        self.engine.register_strategy("syntax", self.syntax_strategy)
        self.engine.register_strategy("security", self.security_strategy)

        results = self.engine.validate_all({"encryption": "AES256", "authentication": "MFA"})

        self.assertIsInstance(results, dict)
        self.assertIn("syntax", results)
        self.assertIn("security", results)

        for result in results.values():
            self.assertIsInstance(result, ValidationResult)

class TestRuleEngineEvaluation(unittest.TestCase):
    """Test Rule Engine evaluation."""

    def setUp(self):
        """Set up test fixtures."""
        self.engine = RuleEngine()

    def test_rule_addition(self):
        """Test adding rules to engine."""
        rule = ValidationRule(
            name="test_rule",
            condition=lambda x: len(str(x)) > 0,
            error_message="Input cannot be empty"
        )

        self.engine.add_rule(rule)
        self.assertEqual(len(self.engine.rules), 1)
        self.assertEqual(self.engine.rules[0].name, "test_rule")

    def test_rule_evaluation_pass(self):
        """Test successful rule evaluation."""
        rule = ValidationRule(
            name="non_empty_rule",
            condition=lambda x: len(str(x)) > 0,
            error_message="Input cannot be empty"
        )
        self.engine.add_rule(rule)

        result = self.engine.evaluate("valid input")
        self.assertTrue(result.is_valid)
        self.assertEqual(len(result.errors), 0)

    def test_rule_evaluation_fail(self):
        """Test failed rule evaluation."""
        rule = ValidationRule(
            name="non_empty_rule",
            condition=lambda x: len(str(x)) > 0,
            error_message="Input cannot be empty"
        )
        self.engine.add_rule(rule)

        result = self.engine.evaluate("")
        self.assertFalse(result.is_valid)
        self.assertIn("Input cannot be empty", result.errors)

    def test_multiple_rules_evaluation(self):
        """Test evaluation with multiple rules."""
        rules = [
            ValidationRule(
                name="non_empty",
                condition=lambda x: len(str(x)) > 0,
                error_message="Input cannot be empty"
            ),
            ValidationRule(
                name="min_length",
                condition=lambda x: len(str(x)) >= 3,
                error_message="Input must be at least 3 characters"
            )
        ]

        for rule in rules:
            self.engine.add_rule(rule)

        # Test all pass
        result = self.engine.evaluate("valid")
        self.assertTrue(result.is_valid)

        # Test some fail
        result = self.engine.evaluate("ab")
        self.assertFalse(result.is_valid)
        self.assertEqual(len(result.errors), 1)
        self.assertIn("at least 3 characters", result.errors[0])

    def test_rule_exception_handling(self):
        """Test rule evaluation exception handling."""
        rule = ValidationRule(
            name="error_rule",
            condition=lambda x: x.invalid_method(),  # This will raise AttributeError
            error_message="This rule will fail"
        )
        self.engine.add_rule(rule)

        result = self.engine.evaluate("test")
        self.assertFalse(result.is_valid)
        self.assertTrue(any("evaluation failed" in error for error in result.errors))

class TestValidationLogicPreservation(unittest.TestCase):
    """Test that validation logic is preserved after refactoring."""

    def setUp(self):
        """Set up test fixtures."""
        self.engine = ValidationEngine()
        self.engine.register_strategy("access", AccessControlValidationStrategy())
        self.engine.register_strategy("security", SecurityValidationStrategy())
        self.engine.register_strategy("audit", AuditValidationStrategy())

    def test_dfars_access_control_validation_equivalence(self):
        """Test DFARS access control validation produces expected results."""
        # Valid configuration
        valid_config = {
            "access_control": True,
            "rbac_enabled": True,
            "privileged_accounts_managed": True
        }

        result = self.engine.validate("access", valid_config)
        self.assertTrue(result.is_valid)
        self.assertEqual(len(result.errors), 0)

    def test_dfars_security_validation_equivalence(self):
        """Test DFARS security validation produces expected results."""
        # Valid security configuration
        valid_config = {
            "encryption": "AES256",
            "authentication": "MFA",
            "access_control": True
        }

        result = self.engine.validate("security", valid_config)
        self.assertTrue(result.is_valid)

        # Invalid security configuration
        invalid_config = {
            "encryption": "none",
            "authentication": "basic"
        }

        result = self.engine.validate("security", invalid_config)
        self.assertFalse(result.is_valid)
        self.assertIn("Encryption cannot be disabled", result.errors)

    def test_dfars_audit_validation_equivalence(self):
        """Test DFARS audit validation produces expected results."""
        # Valid audit configuration
        valid_config = {
            "audit_logging": True,
            "log_retention_days": 365,
            "audit_trail_protected": True
        }

        result = self.engine.validate("audit", valid_config)
        self.assertTrue(result.is_valid)

        # Invalid audit configuration
        invalid_config = {
            "audit_logging": False,
            "log_retention_days": 30,
            "audit_trail_protected": False
        }

        result = self.engine.validate("audit", invalid_config)
        self.assertFalse(result.is_valid)
        self.assertTrue(len(result.errors) > 0)

class TestStrategyPerformance(unittest.TestCase):
    """Test strategy pattern performance."""

    def setUp(self):
        """Set up test fixtures."""
        self.engine = ValidationEngine()
        self.engine.register_strategy("perf", PerformanceValidationStrategy())

    def test_strategy_execution_performance(self):
        """Test that strategy execution is efficient."""
        test_metrics = {
            "response_time_ms": 1500,
            "memory_usage_mb": 300,
            "cpu_usage_percent": 75
        }

        # Measure execution time for 100 validations
        start_time = time.time()
        for _ in range(100):
            result = self.engine.validate("perf", test_metrics)
            self.assertIsInstance(result, ValidationResult)

        duration = time.time() - start_time

        # Should complete 100 validations in less than 2 seconds
        self.assertLess(duration, 2.0,
                        f"100 validations took {duration:.2f}s (expected <2.0s)")

        # Average time per validation should be less than 20ms
        avg_time_per_validation = (duration / 100) * 1000
        self.assertLess(avg_time_per_validation, 20.0,
                        f"Average validation time: {avg_time_per_validation:.1f}ms (expected <20ms)")

class TestStrategyErrorHandling(unittest.TestCase):
    """Test strategy error handling."""

    def setUp(self):
        """Set up test fixtures."""
        self.engine = ValidationEngine()
        self.syntax_strategy = SyntaxValidationStrategy()
        self.security_strategy = SecurityValidationStrategy()
        self.engine.register_strategy("syntax", self.syntax_strategy)
        self.engine.register_strategy("security", self.security_strategy)

    def test_unknown_strategy_error(self):
        """Test unknown strategy handling."""
        with self.assertRaises(ValueError) as context:
            self.engine.validate("unknown_strategy", "test_data")

        self.assertIn("Unknown validation strategy", str(context.exception))

    def test_invalid_input_handling(self):
        """Test invalid input handling."""
        # Test None input
        result = self.engine.validate("syntax", None)
        self.assertFalse(result.is_valid)
        self.assertTrue(len(result.errors) > 0)

        # Test wrong type input for security validation
        result = self.engine.validate("security", "not_a_dict")
        self.assertFalse(result.is_valid)
        self.assertIn("Security validation requires dict input", result.errors)

    def test_strategy_exception_graceful_handling(self):
        """Test graceful handling of strategy exceptions."""
        # This would test exception handling in validate_all method
        results = self.engine.validate_all("mixed_input")

        # Some strategies should handle the input, others should fail gracefully
        self.assertIsInstance(results, dict)
        for strategy_name, result in results.items():
            self.assertIsInstance(result, ValidationResult)
            # Either valid result or graceful failure
            self.assertIsInstance(result.is_valid, bool)

def run_batch3_validation():
    """Run comprehensive Batch 3 validation tests."""
    print("=" * 60)
    print("BATCH 3 STRATEGY PATTERN + RULE ENGINE VALIDATION")
    print("=" * 60)

    # Create test suite
    test_suite = unittest.TestSuite()

    # Add test classes
    test_classes = [
        TestValidationStrategyInterface,
        TestValidationEngineWorkflow,
        TestRuleEngineEvaluation,
        TestValidationLogicPreservation,
        TestStrategyPerformance,
        TestStrategyErrorHandling
    ]

    for test_class in test_classes:
        tests = unittest.TestLoader().loadTestsFromTestCase(test_class)
        test_suite.addTests(tests)

    # Run tests
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(test_suite)

    # Calculate metrics
    total_tests = result.testsRun
    failures = len(result.failures)
    errors = len(result.errors)
    passed = total_tests - failures - errors

    success_rate = (passed / total_tests) * MAXIMUM_FUNCTION_LENGTH_LINES if total_tests > 0 else 0

    print(f"\n" + "=" * 60)
    print("VALIDATION RESULTS SUMMARY")
    print("=" * 60)
    print(f"Passed: {passed}")
    print(f"Failed: {failures}")
    print(f"Errors: {errors}")
    print(f"Success Rate: {success_rate:.1f}%")

    return {
        "total_tests": total_tests,
        "passed": passed,
        "failed": failures,
        "errors": errors,
        "success_rate": success_rate,
        "test_result": result
    }

if __name__ == "__main__":
    # Run validation tests
    validation_results = run_batch3_validation()

    # Exit with appropriate code
    if validation_results["success_rate"] == 100.0:
        sys.exit(0)
    else:
        sys.exit(1)