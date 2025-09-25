"""Test Pattern Builder - Builder Pattern Implementation"""

from typing import Dict, List, Any, Callable, Optional

from dataclasses import dataclass

@dataclass
class TestPatternConfig:
    """Configuration for test patterns."""
    pattern_type: str
    patterns: List[str]
    category: str
    test_type: str
    fix_difficulty: str
    typical_causes: List[str]
    auto_repair_strategy: str

class TestPatternBuilder:
    """Builder for test pattern configurations."""

    def __init__(self):
        self._patterns: List[str] = []
        self._category: str = ""
        self._test_type: str = ""
        self._typical_causes: List[str] = []
        self._validators: List[Callable] = []
        self._error_handler: Optional[Callable] = None

    def with_patterns(self, patterns: List[str]) -> 'TestPatternBuilder':
        """Add regex patterns."""
        self._patterns = patterns
        return self

    def with_category(self, category: str, test_type: str) -> 'TestPatternBuilder':
        """Set category and test type."""
        self._category = category
        self._test_type = test_type
        return self

    def with_causes(self, causes: List[str]) -> 'TestPatternBuilder':
        """Add typical causes."""
        self._typical_causes = causes
        return self

    def add_validator(self, validator: Callable) -> 'TestPatternBuilder':
        """Add validation function."""
        self._validators.append(validator)
        return self

    def with_error_handler(self, handler: Callable) -> 'TestPatternBuilder':
        """Set error handler."""
        self._error_handler = handler
        return self

    def build(self, pattern_name: str, fix_difficulty: str, repair_strategy: str) -> TestPatternConfig:
        """Build test pattern configuration."""
        # Validate required fields
        if not self._patterns:
            raise ValueError("Patterns are required")
        if not self._category:
            raise ValueError("Category is required")

        # Apply validators
        for validator in self._validators:
            validator(self)

        return TestPatternConfig(
            pattern_type=pattern_name,
            patterns=self._patterns,
            category=self._category,
            test_type=self._test_type,
            fix_difficulty=fix_difficulty,
            typical_causes=self._typical_causes,
            auto_repair_strategy=repair_strategy
        )

def _load_test_patterns() -> Dict[str, TestPatternConfig]:
    """Load test-specific failure patterns using builder."""
    patterns = {}

    # Unit test assertion failure
    patterns["unit_test_assertion_failure"] = (
        TestPatternBuilder()
        .with_patterns([
            r"AssertionError:",
            r"assertion failed",
            r"expected .* but got .*"
        ])
        .with_category("unit_testing", "unit")
        .with_causes(["logic_error", "data_mismatch", "API_change"])
        .build("unit_test_assertion_failure", "medium", "assertion_analysis")
    )

    # Integration test connection failure
    patterns["integration_test_connection_failure"] = (
        TestPatternBuilder()
        .with_patterns([
            r"Connection.*refused",
            r"Database.*unavailable",
            r"Service.*timeout"
        ])
        .with_category("integration_testing", "integration")
        .with_causes(["service_down", "network_issue", "configuration_error"])
        .build("integration_test_connection_failure", "high", "service_health_check")
    )

    return patterns