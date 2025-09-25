"""Tests for Test Pattern Builder"""

from src.analysis.test_pattern_builder import (
import pytest

class TestTestPatternBuilder:
    """Test TestPatternBuilder class."""

    def test_builder_creates_valid_pattern(self):
        """Test builder creates valid test pattern."""
        from src.analysis.test_pattern_builder import TestPatternBuilder as TPB

        pattern = (
            TPB()
            .with_patterns(["error1", "error2"])
            .with_category("unit_testing", "unit")
            .with_causes(["cause1", "cause2"])
            .build("test_pattern", "medium", "strategy1")
        )

        assert pattern.pattern_type == "test_pattern"
        assert len(pattern.patterns) == 2
        assert pattern.category == "unit_testing"
        assert pattern.fix_difficulty == "medium"

    def test_builder_validates_required_fields(self):
        """Test builder validates required fields."""
        from src.analysis.test_pattern_builder import TestPatternBuilder as TPB

        builder = TPB()

        with pytest.raises(ValueError, match="Patterns are required"):
            builder.build("test", "low", "strategy")

    def test_builder_method_chaining(self):
        """Test builder supports method chaining."""
        from src.analysis.test_pattern_builder import TestPatternBuilder as TPB

        builder = TPB()

        result = (
            builder
            .with_patterns(["p1"])
            .with_category("test", "unit")
            .with_causes(["c1"])
        )

        assert result is builder

    def test_load_test_patterns_returns_dict(self):
        """Test _load_test_patterns returns valid dictionary."""
        patterns = _load_test_patterns()

        assert isinstance(patterns, dict)
        assert len(patterns) >= 2
        assert "unit_test_assertion_failure" in patterns
        assert "integration_test_connection_failure" in patterns

    def test_loaded_patterns_have_correct_structure(self):
        """Test loaded patterns have correct structure."""
        patterns = _load_test_patterns()

        for name, config in patterns.items():
            assert isinstance(config, TestPatternConfig)
            assert config.pattern_type
            assert len(config.patterns) > 0
            assert config.category
            assert config.fix_difficulty in ["low", "medium", "high"]

    def test_builder_with_validator(self):
        """Test builder with custom validator."""
        from src.analysis.test_pattern_builder import TestPatternBuilder as TPB

        def validate_patterns(builder):
            if len(builder._patterns) < 2:
                raise ValueError("Need at least 2 patterns")

        builder = (
            TPB()
            .with_patterns(["p1", "p2", "p3"])
            .with_category("test", "unit")
            .add_validator(validate_patterns)
        )

        config = builder.build("test", "low", "strategy")
        assert len(config.patterns) == 3

    def test_builder_with_error_handler(self):
        """Test builder with error handler."""
        from src.analysis.test_pattern_builder import TestPatternBuilder as TPB

        def error_handler(error):
            return f"Handled: {error}"

        builder = (
            TPB()
            .with_patterns(["p1"])
            .with_category("test", "unit")
            .with_error_handler(error_handler)
        )

        config = builder.build("test", "low", "strategy")
        assert config is not None

class TestIntegrationPatterns:
    """Test integration test patterns."""

    def test_integration_pattern_has_high_difficulty(self):
        """Test integration pattern has correct difficulty."""
        patterns = _load_test_patterns()
        pattern = patterns["integration_test_connection_failure"]

        assert pattern.fix_difficulty == "high"
        assert "service" in pattern.auto_repair_strategy.lower()

    def test_integration_pattern_has_service_causes(self):
        """Test integration pattern identifies service causes."""
        patterns = _load_test_patterns()
        pattern = patterns["integration_test_connection_failure"]

        assert "service_down" in pattern.typical_causes
        assert "network_issue" in pattern.typical_causes