"""
Test-Specific Failure Analysis Module
Handles test failure correlation, prediction, and auto-repair suggestions.
"""

import logging
import re
from typing import Dict, List, Optional, Any
from collections import defaultdict, Counter
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass
class TestFailureCorrelationConfig:
    """Configuration for test failure correlation."""
    min_correlation_threshold: float = 0.3
    max_cascade_depth: int = 3
    enable_prediction: bool = True
    auto_repair_confidence: float = 0.8


class TestFailureCorrelator:
    """Correlates test failures across different test types and identifies patterns."""

    def __init__(self, config: TestFailureCorrelationConfig = None):
        self.config = config or TestFailureCorrelationConfig()
        self.correlation_history = []

    def correlate_failures(self, test_failures: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Find correlations between test failures."""
        correlations = {
            "cross_suite_patterns": [],
            "failure_clusters": [],
            "root_cause_candidates": [],
            "cascade_failures": []
        }

        # Group failures by pattern
        pattern_groups = defaultdict(list)
        for failure in test_failures:
            pattern = failure.get("failure_pattern", "unknown")
            pattern_groups[pattern].append(failure)

        # Find cross-suite patterns
        for pattern, failures in pattern_groups.items():
            if len(failures) > 1:
                suite_types = [f.get("test_type", "unknown") for f in failures]
                if len(set(suite_types)) > 1:
                    correlations["cross_suite_patterns"].append({
                        "pattern": pattern,
                        "affected_suites": [f["suite_name"] for f in failures],
                        "affected_types": list(set(suite_types)),
                        "severity": "high" if len(failures) > 3 else "medium"
                    })

        # Find failure clusters (failures with common causes)
        cause_groups = defaultdict(list)
        for failure in test_failures:
            for cause in failure.get("typical_causes", []):
                cause_groups[cause].append(failure)

        for cause, failures in cause_groups.items():
            if len(failures) > 2:
                correlations["failure_clusters"].append({
                    "root_cause": cause,
                    "affected_suites": [f["suite_name"] for f in failures],
                    "cluster_size": len(failures),
                    "confidence": min(sum(f.get("confidence", 0) for f in failures) / len(failures), 1.0)
                })

        # Identify cascade failures
        correlations["cascade_failures"] = self._identify_cascade_failures(test_failures)

        return correlations

    def _identify_cascade_failures(self, test_failures: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Identify failures that are likely caused by other failures."""
        cascade_failures = []

        unit_failures = [f for f in test_failures if f.get("test_type") == "unit"]
        integration_failures = [f for f in test_failures if f.get("test_type") == "integration"]

        # If unit tests fail, integration tests might fail as cascade
        if unit_failures and integration_failures:
            for int_failure in integration_failures:
                for unit_failure in unit_failures:
                    if self._are_related_failures(unit_failure, int_failure):
                        cascade_failures.append({
                            "primary_failure": unit_failure["suite_name"],
                            "cascade_failure": int_failure["suite_name"],
                            "relationship": "unit_to_integration",
                            "confidence": 0.8
                        })

        return cascade_failures

    def _are_related_failures(self, failure1: Dict[str, Any], failure2: Dict[str, Any]) -> bool:
        """Check if two failures are related."""
        # Simple heuristic: check if they share common causes
        causes1 = set(failure1.get("typical_causes", []))
        causes2 = set(failure2.get("typical_causes", []))

        return len(causes1.intersection(causes2)) > 0


class TestSuccessPredictor:
    """Predicts test success probability based on code changes and historical data."""

    def __init__(self):
        self.prediction_model = TestPredictionModel()

    def predict_test_success(self, change_context: Dict[str, Any], test_suite: str) -> Dict[str, Any]:
        """Predict success probability for a specific test suite."""
        features = self._extract_prediction_features(change_context, test_suite)
        probability = self.prediction_model.predict(features)

        return {
            "test_suite": test_suite,
            "success_probability": probability,
            "risk_factors": self._identify_risk_factors(features),
            "recommendations": self._generate_recommendations(features, probability)
        }

    def _extract_prediction_features(self, change_context: Dict[str, Any], test_suite: str) -> Dict[str, Any]:
        """Extract features for prediction model."""
        return {
            "change_size": len(change_context.get("affected_files", [])),
            "test_type": self._determine_test_type_from_suite(test_suite),
            "has_test_changes": any("test" in f for f in change_context.get("affected_files", [])),
            "complexity": change_context.get("complexity", "medium"),
            "recent_failure_rate": change_context.get("recent_failure_rate", 0.0),
            "historical_success_rate": change_context.get("historical_success_rate", 1.0)
        }

    def _determine_test_type_from_suite(self, test_suite: str) -> str:
        """Determine test type from suite name."""
        if "unit" in test_suite.lower():
            return "unit"
        elif "integration" in test_suite.lower():
            return "integration"
        elif "e2e" in test_suite.lower():
            return "e2e"
        else:
            return "other"

    def _identify_risk_factors(self, features: Dict[str, Any]) -> List[str]:
        """Identify risk factors that might cause test failures."""
        risk_factors = []

        if features["change_size"] > 5:
            risk_factors.append("large_change_set")

        if features["complexity"] == "high":
            risk_factors.append("high_complexity_changes")

        if features["recent_failure_rate"] > 0.2:
            risk_factors.append("recent_failure_history")

        if not features["has_test_changes"] and features["test_type"] in ["unit", "integration"]:
            risk_factors.append("no_corresponding_test_updates")

        return risk_factors

    def _generate_recommendations(self, features: Dict[str, Any], probability: float) -> List[str]:
        """Generate recommendations based on prediction."""
        recommendations = []

        if probability < 0.7:
            recommendations.append("Consider running tests locally before committing")

        if features["change_size"] > 5:
            recommendations.append("Break down large changes into smaller commits")

        if not features["has_test_changes"]:
            recommendations.append("Add or update tests for modified code")

        if features["recent_failure_rate"] > 0.2:
            recommendations.append("Review recent failure patterns before proceeding")

        return recommendations


class TestPredictionModel:
    """Simple prediction model for test success."""

    def predict(self, features: Dict[str, Any]) -> float:
        """Predict success probability using heuristics."""
        base_probability = features.get("historical_success_rate", 0.8)

        # Adjust based on change size
        if features["change_size"] > 10:
            base_probability *= 0.7
        elif features["change_size"] > 5:
            base_probability *= 0.85

        # Adjust based on complexity
        if features["complexity"] == "high":
            base_probability *= 0.8
        elif features["complexity"] == "low":
            base_probability *= 1.1

        # Adjust based on test changes
        if features["has_test_changes"]:
            base_probability *= 1.0o5

        # Adjust based on recent failures
        failure_rate = features.get("recent_failure_rate", 0.0)
        base_probability *= (1.0 - failure_rate * 0.5)

        return max(0.0, min(1.0, base_probability))


class TestAutoRepair:
    """Provides auto-repair suggestions for test failures."""

    def __init__(self):
        self.repair_strategies = self._initialize_repair_strategies()

    def _initialize_repair_strategies(self) -> Dict[str, Any]:
        """Initialize test-specific repair strategies."""
        return {
            "assertion_analysis": {
                "automated": False,
                "suggestions": [
                    "Review assertion logic and expected values",
                    "Check if test data matches expected format",
                    "Verify API response structure hasn't changed"
                ]
            },
            "dependency_repair": {
                "automated": True,
                "suggestions": [
                    "Install missing packages automatically",
                    "Update import paths",
                    "Fix test file organization"
                ]
            },
            "timeout_adjustment": {
                "automated": True,
                "suggestions": [
                    "Increase timeout values gradually",
                    "Add explicit waits",
                    "Optimize loading performance"
                ]
            },
            "config_repair": {
                "automated": True,
                "suggestions": [
                    "Set missing environment variables",
                    "Create default configuration files",
                    "Fix configuration syntax"
                ]
            },
            "selector_update": {
                "automated": False,
                "suggestions": [
                    "Update element selectors",
                    "Check for UI changes",
                    "Add more robust selectors"
                ]
            },
            "memory_optimization": {
                "automated": False,
                "suggestions": [
                    "Optimize memory usage",
                    "Add garbage collection hints",
                    "Reduce test data size"
                ]
            }
        }

    def suggest_repairs(self, test_failure: Dict[str, Any]) -> Dict[str, Any]:
        """Suggest repairs for a test failure."""
        strategy = test_failure.get("auto_repair_strategy", "manual")

        repair_info = self.repair_strategies.get(strategy, {
            "automated": False,
            "suggestions": ["Manual investigation required"]
        })

        return {
            "strategy": strategy,
            "automated_repair_available": repair_info["automated"],
            "repair_suggestions": repair_info["suggestions"],
            "confidence": test_failure.get("confidence", 0.0),
            "estimated_effort": self._estimate_repair_effort(test_failure)
        }

    def _estimate_repair_effort(self, test_failure: Dict[str, Any]) -> str:
        """Estimate effort required for repair."""
        difficulty = test_failure.get("fix_difficulty", "medium")

        if difficulty == "low":
            return "5-15 minutes"
        elif difficulty == "medium":
            return "30-60 minutes"
        else:
            return "2-4 hours"


class TestPatternAnalyzer:
    """Analyzes test-specific failure patterns."""

    def __init__(self):
        self.test_patterns = self._load_test_patterns()

    def _load_test_patterns(self) -> Dict[str, Dict[str, Any]]:
        """Load test-specific failure patterns and characteristics."""
        return {
            # Unit Test Patterns
            "unit_test_assertion_failure": {
                "patterns": [
                    r"AssertionError:",
                    r"assertion failed",
                    r"expected .* but got .*",
                    r"Test assertion failed"
                ],
                "category": "unit_testing",
                "test_type": "unit",
                "fix_difficulty": "medium",
                "typical_causes": ["logic_error", "data_mismatch", "API_change"],
                "auto_repair_strategy": "assertion_analysis"
            },

            "unit_test_import_failure": {
                "patterns": [
                    r"ModuleNotFoundError.*test",
                    r"ImportError.*test",
                    r"Cannot import.*test"
                ],
                "category": "unit_testing",
                "test_type": "unit",
                "fix_difficulty": "low",
                "typical_causes": ["missing_dependency", "import_path"],
                "auto_repair_strategy": "dependency_repair"
            },

            # Integration Test Patterns
            "integration_test_connection_failure": {
                "patterns": [
                    r"Connection.*refused",
                    r"Database.*unavailable",
                    r"Service.*timeout"
                ],
                "category": "integration_testing",
                "test_type": "integration",
                "fix_difficulty": "high",
                "typical_causes": ["service_down", "network_issue"],
                "auto_repair_strategy": "service_health_check"
            },

            # End-to-End Test Patterns
            "e2e_test_timeout": {
                "patterns": [
                    r"Test.*timeout",
                    r"Element.*not found.*timeout",
                    r"Page.*load.*timeout"
                ],
                "category": "e2e_testing",
                "test_type": "e2e",
                "fix_difficulty": "medium",
                "typical_causes": ["slow_response", "element_loading"],
                "auto_repair_strategy": "timeout_adjustment"
            },

            "e2e_test_element_not_found": {
                "patterns": [
                    r"Element.*not found",
                    r"Selector.*not found",
                    r"No such element"
                ],
                "category": "e2e_testing",
                "test_type": "e2e",
                "fix_difficulty": "medium",
                "typical_causes": ["ui_change", "selector_update"],
                "auto_repair_strategy": "selector_update"
            },

            # Performance Test Patterns
            "performance_test_memory_issue": {
                "patterns": [
                    r"OutOfMemoryError",
                    r"Memory.*exceeded",
                    r"Heap.*overflow"
                ],
                "category": "performance_testing",
                "test_type": "performance",
                "fix_difficulty": "high",
                "typical_causes": ["memory_leak", "large_dataset"],
                "auto_repair_strategy": "memory_optimization"
            }
        }

    def analyze_test_specific_failures(self, test_results: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Analyze test-specific failure patterns and provide targeted insights."""
        test_failures = []

        for suite_name, suite_result in test_results.get("detailed_results", {}).items():
            if isinstance(suite_result, dict) and not suite_result.get("success", True):
                failure_analysis = self._analyze_single_test_failure(suite_name, suite_result)
                if failure_analysis:
                    test_failures.append(failure_analysis)

        return test_failures

    def _analyze_single_test_failure(self, suite_name: str, suite_result: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Analyze a single test suite failure."""
        error_output = suite_result.get("error_output", "")
        failure_details = suite_result.get("failure_details", [])

        # Determine test type from suite name
        test_type = self._determine_test_type(suite_name)

        # Find matching test patterns
        matching_patterns = []
        for pattern_name, pattern_info in self.test_patterns.items():
            if pattern_info["test_type"] == test_type or test_type == "unknown":
                for pattern in pattern_info["patterns"]:
                    if re.search(pattern, error_output, re.IGNORECASE):
                        matching_patterns.append({
                            "pattern_name": pattern_name,
                            "pattern_info": pattern_info,
                            "confidence": self._calculate_pattern_confidence(pattern, error_output)
                        })

        if not matching_patterns:
            return None

        # Select best matching pattern
        best_pattern = max(matching_patterns, key=lambda x: x["confidence"])

        return {
            "suite_name": suite_name,
            "test_type": test_type,
            "failure_pattern": best_pattern["pattern_name"],
            "confidence": best_pattern["confidence"],
            "typical_causes": best_pattern["pattern_info"]["typical_causes"],
            "auto_repair_strategy": best_pattern["pattern_info"]["auto_repair_strategy"],
            "fix_difficulty": best_pattern["pattern_info"]["fix_difficulty"],
            "error_output": error_output,
            "failure_details": failure_details,
            "suggested_actions": self._generate_test_specific_actions(best_pattern["pattern_info"])
        }

    def _determine_test_type(self, suite_name: str) -> str:
        """Determine test type from suite name."""
        suite_lower = suite_name.lower()

        if "unit" in suite_lower:
            return "unit"
        elif "integration" in suite_lower:
            return "integration"
        elif "e2e" in suite_lower or "end_to_end" in suite_lower:
            return "e2e"
        elif "performance" in suite_lower:
            return "performance"
        else:
            return "unknown"

    def _calculate_pattern_confidence(self, pattern: str, error_output: str) -> float:
        """Calculate confidence score for pattern match."""
        matches = len(re.findall(pattern, error_output, re.IGNORECASE))
        total_lines = len(error_output.split('\n'))

        if total_lines == 0:
            return 0.0

        match_density = matches / total_lines
        confidence = min(match_density * 10, 1.0)  # Cap at 1.0

        # Boost confidence for exact matches
        if re.search(pattern, error_output):
            confidence = min(confidence + 0.3, 1.0)

        return confidence

    def _generate_test_specific_actions(self, pattern_info: Dict[str, Any]) -> List[str]:
        """Generate test-specific recommended actions."""
        strategy = pattern_info["auto_repair_strategy"]
        test_type = pattern_info["test_type"]

        actions = []

        if strategy == "assertion_analysis":
            actions.extend([
                "Review test assertions for correctness",
                "Check if expected values match actual implementation",
                "Verify test data setup and teardown"
            ])
        elif strategy == "dependency_repair":
            actions.extend([
                "Install missing test dependencies",
                "Check import paths and module structure",
                "Update package.json or requirements.txt"
            ])
        elif strategy == "timeout_adjustment":
            actions.extend([
                "Increase test timeout values",
                "Add explicit waits for dynamic content",
                "Review network latency issues"
            ])
        elif strategy == "selector_update":
            actions.extend([
                "Update element selectors",
                "Check for UI changes",
                "Add more robust element identification"
            ])

        # Add test-type specific actions
        if test_type == "unit":
            actions.append("Run tests in isolation to identify dependencies")
        elif test_type == "integration":
            actions.append("Verify test environment setup and data fixtures")
        elif test_type == "e2e":
            actions.append("Check UI element selectors and page structure")

        return actions


<!-- AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE -->
## Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
|--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
| 1.0.0   | 2025-9-24T15:12:0o3-0o4:0o0 | coder@Sonnet-4 | Created test failure analysis module | test_failure_analyzer.py | OK | Extracted from god object | 0.0o0 | c8d5f7b |

### Receipt
- status: OK
- reason_if_blocked: --
- run_id: phase3-test-analyzer-0o3
- inputs: ["failure_pattern_detector.py"]
- tools_used: ["Write"]
- versions: {"model":"Sonnet-4","prompt":"v1.0.0"}
<!-- AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE -->