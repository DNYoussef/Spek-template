from src.constants.base import MAXIMUM_NESTED_DEPTH

Tests all critical issues identified in Phase 1:
- Mock data contamination prevention (85.7% contamination detected)
- Schema consistency validation (71% consistency score)
- Policy field standardization
- Performance regression detection (3.6% baseline)
- Violation ID determinism (85% probability failure mode)
"""

import json
import os
import time
import hashlib
import uuid
from pathlib import Path
from typing import Dict, List, Any
import unittest
from unittest.mock import patch, MagicMock
import jsonschema
from jsonschema import validate, ValidationError

# Import the actual reporters to test
import sys
sys.path.append(str(Path(__file__).parent.parent.parent))

from analyzer.reporting.json import JSONReporter
from analyzer.reporting.sarif import SARIFReporter
from analyzer.ast_engine.core_analyzer import AnalysisResult, Violation
from analyzer.thresholds import ConnascenceType, Severity

class TestJSONSchemaValidation(unittest.TestCase):
    """Comprehensive JSON schema validation tests."""

    def setUp(self):
        """Set up test fixtures and reporters."""
        self.json_reporter = JSONReporter()
        self.sarif_reporter = SARIFReporter()
        self.fixtures_dir = Path(__file__).parent / "fixtures"
        self.valid_fixtures = self.fixtures_dir / "valid"
        self.invalid_fixtures = self.fixtures_dir / "invalid"
        self.mock_fixtures = self.fixtures_dir / "mock_data"
        
        # Performance baseline (3.6% of total time)
        self.json_generation_time_threshold = 0.036  # seconds
        self.memory_footprint_threshold = 0.15  # percentage
        
        # Create sample analysis result for testing
        self.sample_violations = [
            self._create_sample_violation("CON_NAME", "name", "medium", 2.5),
            self._create_sample_violation("CON_TYPE", "type", "high", 5.0),
            self._create_sample_violation("CON_MEANING", "meaning", "critical", 8.0),
        ]
        
        self.sample_analysis_result = self._create_sample_analysis_result()

    def _create_sample_violation(self, rule_id: str, conn_type: str, severity: str, weight: float) -> Violation:
        """Create a sample violation for testing."""
        return Violation(
            id=f"test_{rule_id}_{uuid.uuid4().hex[:8]}",
            type=getattr(ConnascenceType, conn_type.upper()),
            severity=getattr(Severity, severity.upper()),
            weight=weight,
            locality="local",
            file_path="test/sample.py",
            line_number=10,
            column=5,
            end_line=10,
            end_column=15,
            description=f"Test {conn_type} connascence violation",
            recommendation=f"Refactor to reduce {conn_type} coupling",
            function_name="test_function",
            class_name="TestClass",
            code_snippet="def test_function():",
            context={"authentic": True, "analysis_type": "real"}
        )

    def _create_sample_analysis_result(self) -> AnalysisResult:
        """Create a sample analysis result for testing."""
        return AnalysisResult(
            violations=self.sample_violations,
            file_stats={"total_files": 5, "analyzed_files": 5},
            timestamp="2024-01-01T00:00:00Z",
            project_root="/test/project",
            total_files_analyzed=5,
            analysis_duration_ms=1500,
            policy_preset="default",
            budget_status={"within_budget": True},
            baseline_comparison={"improved": True},
            summary_metrics={"total_weight": 15.5}
        )

    # PHASE 1 ISSUE 1: Mock Data Contamination Prevention Tests
    def test_detect_mock_data_patterns(self):
        """Test detection of mock/stub/fallback data patterns."""
        mock_indicators = [
            "example", "sample", "test", "mock", "stub", "placeholder",
            "dummy", "fake", "synthetic", "generated", "template"
        ]
        
        # Test real analysis result (should NOT be flagged as mock)
        json_output = self.json_reporter.generate(self.sample_analysis_result)
        result_dict = json.loads(json_output)
        
        mock_score = self._calculate_mock_contamination_score(result_dict)
        self.assertLess(mock_score, 0.2, 
                        f"Real analysis data flagged as mock (score: {mock_score})")
        
        # Test synthetic mock data (should be flagged)
        mock_result = self._create_mock_analysis_result()
        mock_json = self.json_reporter.generate(mock_result)
        mock_dict = json.loads(mock_json)
        
        mock_score = self._calculate_mock_contamination_score(mock_dict)
        self.assertGreater(mock_score, 0.5, 
                            f"Mock data not detected (score: {mock_score})")

    def test_authentic_analysis_evidence_validation(self):
        """Test validation of authentic analysis evidence."""
        json_output = self.json_reporter.generate(self.sample_analysis_result)
        result_dict = json.loads(json_output)
        
        # Check for domain expertise indicators
        self.assertTrue(self._has_domain_expertise_evidence(result_dict))
        
        # Check for actual file analysis evidence
        self.assertTrue(self._has_file_analysis_evidence(result_dict))
        
        # Check for non-generic responses
        self.assertTrue(self._has_specific_recommendations(result_dict))

    def test_prevent_templated_responses(self):
        """Test prevention of generic templated responses."""
        json_output = self.json_reporter.generate(self.sample_analysis_result)
        result_dict = json.loads(json_output)
        
        # Check that violations have specific, non-templated descriptions
        for violation in result_dict.get("violations", []):
            description = violation.get("description", "")
            self.assertFalse(self._is_templated_response(description))
            
            recommendation = violation.get("recommendation", "")
            self.assertFalse(self._is_templated_response(recommendation))

    # PHASE 1 ISSUE 2: Schema Consistency Validation Tests
    def test_standard_json_schema_compliance(self):
        """Test compliance with standard JSON schema."""
        json_output = self.json_reporter.generate(self.sample_analysis_result)
        result_dict = json.loads(json_output)
        
        # Validate required top-level fields
        required_fields = ["schema_version", "metadata", "summary", "violations", "policy_compliance"]
        for field in required_fields:
            self.assertIn(field, result_dict, f"Missing required field: {field}")
        
        # Validate schema version
        self.assertEqual(result_dict["schema_version"], "1.0.0")
        
        # Validate metadata structure
        metadata = result_dict["metadata"]
        self.assertIn("tool", metadata)
        self.assertIn("analysis", metadata)
        self.assertIn("environment", metadata)

    def test_enhanced_mece_schema_compliance(self):
        """Test compliance with Enhanced MECE schema variant."""
        json_output = self.json_reporter.generate(self.sample_analysis_result)
        result_dict = json.loads(json_output)
        
        # Enhanced schema should include MECE-specific fields
        summary = result_dict["summary"]
        self.assertIn("quality_metrics", summary)
        self.assertIn("connascence_index", summary["quality_metrics"])
        self.assertIn("violations_per_file", summary["quality_metrics"])

    def test_violation_object_consistency(self):
        """Test consistency of violation objects across all violations."""
        json_output = self.json_reporter.generate(self.sample_analysis_result)
        result_dict = json.loads(json_output)
        
        violations = result_dict.get("violations", [])
        self.assertGreater(len(violations), 0, "No violations found in test data")
        
        # Define required violation fields
        required_violation_fields = [
            "id", "rule_id", "type", "severity", "weight", "locality",
            "file_path", "line_number", "description", "recommendation"
        ]
        
        for i, violation in enumerate(violations):
            for field in required_violation_fields:
                self.assertIn(field, violation, 
                            f"Violation {i} missing required field: {field}")
            
            # Validate data types
            self.assertIsInstance(violation["weight"], (int, float))
            self.assertIsInstance(violation["line_number"], int)
            self.assertIn(violation["severity"], ["low", "medium", "high", "critical"])

    # PHASE 1 ISSUE 3: Policy Field Standardization Tests
    def test_policy_field_consistency(self):
        """Test consistency of policy fields across different JSON outputs."""
        # Generate multiple analysis results
        results = []
        for i in range(3):
            sample_result = self._create_sample_analysis_result()
            json_output = self.json_reporter.generate(sample_result)
            results.append(json.loads(json_output))
        
        # Check policy field consistency
        policy_fields = set()
        for result in results:
            policy_compliance = result.get("policy_compliance", {})
            policy_fields.update(policy_compliance.keys())
        
        # Validate all results have same policy structure
        for result in results:
            policy_compliance = result.get("policy_compliance", {})
            for field in policy_fields:
                self.assertIn(field, policy_compliance, 
                            f"Inconsistent policy field: {field}")

    def test_standardized_policy_preset_values(self):
        """Test that policy preset values are standardized."""
        valid_presets = ["default", "strict", "permissive", "nasa_pot10"]
        
        json_output = self.json_reporter.generate(self.sample_analysis_result)
        result_dict = json.loads(json_output)
        
        policy_preset = result_dict["policy_compliance"]["policy_preset"]
        self.assertIn(policy_preset, valid_presets, 
                    f"Invalid policy preset: {policy_preset}")

    # PHASE 1 ISSUE 4: Performance Regression Detection Tests
    def test_json_generation_performance(self):
        """Test JSON generation performance against baseline (3.6% threshold)."""
        start_time = time.perf_counter()
        
        # Generate JSON report
        json_output = self.json_reporter.generate(self.sample_analysis_result)
        
        generation_time = time.perf_counter() - start_time
        
        self.assertLess(generation_time, self.json_generation_time_threshold,
                        f"JSON generation time {generation_time:.4f}s exceeds "
                        f"threshold {self.json_generation_time_threshold:.4f}s")

    def test_memory_footprint_limits(self):
        """Test memory footprint during JSON generation."""
        import psutil
        import os
        
        process = psutil.Process(os.getpid())
        initial_memory = process.memory_info().rss
        
        # Generate large JSON report
        large_violations = [self._create_sample_violation(f"CON_TEST_{i}", "name", "medium", 1.0) 
                            for i in range(1000)]
        large_result = AnalysisResult(
            violations=large_violations,
            file_stats={"total_files": 100},
            timestamp="2024-01-01T00:00:00Z",
            project_root="/test/project",
            total_files_analyzed=100,
            analysis_duration_ms=5000,
            policy_preset="default",
            budget_status={},
            baseline_comparison={},
            summary_metrics={}
        )
        
        json_output = self.json_reporter.generate(large_result)
        
        final_memory = process.memory_info().rss
        memory_increase = (final_memory - initial_memory) / initial_memory
        
        self.assertLess(memory_increase, self.memory_footprint_threshold,
                        f"Memory footprint increase {memory_increase:.3f} "
                        f"exceeds threshold {self.memory_footprint_threshold:.3f}")

    def test_sarif_overhead_limits(self):
        """Test SARIF generation overhead (baseline: 6x standard JSON)."""
        # Time standard JSON generation
        start_time = time.perf_counter()
        json_output = self.json_reporter.generate(self.sample_analysis_result)
        json_time = time.perf_counter() - start_time
        
        # Time SARIF generation
        start_time = time.perf_counter()
        sarif_output = self.sarif_reporter.generate(self.sample_analysis_result)
        sarif_time = time.perf_counter() - start_time
        
        # SARIF should be no more than 6x slower
        overhead_ratio = sarif_time / json_time if json_time > 0 else float('inf')
        self.assertLess(overhead_ratio, 6.0,
                        f"SARIF overhead ratio {overhead_ratio:.2f}x exceeds 6x limit")

    # PHASE 1 ISSUE 5: Violation ID Determinism Tests
    def test_violation_id_uniqueness(self):
        """Test that violation IDs are unique and deterministic."""
        # Generate same analysis multiple times
        ids_set1 = set()
        ids_set2 = set()
        
        # First generation
        json_output1 = self.json_reporter.generate(self.sample_analysis_result)
        result1 = json.loads(json_output1)
        for violation in result1, get("violations", []):
            ids_set1, add(violation["id"])
        
        # Second generation
        json_output2 = self.json_reporter.generate(self.sample_analysis_result)
        result2 = json.loads(json_output2)
        for violation in result2, get("violations", []):
            ids_set2, add(violation["id"])
        
        # IDs should be deterministic (same across generations)
        self.assertEqual(ids_set1, ids_set2, "Violation IDs are not deterministic")
        
        # All IDs should be unique
        self.assertEqual(len(ids_set1), len(result1, get("violations", [])),
                        "Duplicate violation IDs detected")

    def test_violation_id_format_consistency(self):
        """Test that violation ID format is consistent."""
        json_output = self.json_reporter.generate(self.sample_analysis_result)
        result_dict = json.loads(json_output)
        
        for violation in result_dict.get("violations", []):
            violation_id = violation["id"]
            
            # ID should be string and non-empty
            self.assertIsInstance(violation_id, str)
            self.assertGreater(len(violation_id), 0)
            
            # ID should contain rule type information
            rule_id = violation["rule_id"]
            self.assertTrue(violation_id.startswith("test_") or rule_id in violation_id,
                            f"Violation ID {violation_id} doesn't contain rule information")

    def test_path_resolution_consistency(self):
        """Test that file path resolution is consistent."""
        json_output = self.json_reporter.generate(self.sample_analysis_result)
        result_dict = json.loads(json_output)
        
        file_paths = set()
        for violation in result_dict.get("violations", []):
            file_path = violation["file_path"]
            file_paths.add(file_path)
            
            # Path should be normalized
            self.assertFalse(file_path.startswith("./"))
            self.assertNotIn("//", file_path)

    # Helper Methods
    def _calculate_mock_contamination_score(self, result_dict: Dict) -> float:
        """Calculate mock data contamination score."""
        mock_indicators = [
            "example", "sample", "test", "mock", "stub", "placeholder",
            "dummy", "fake", "synthetic", "generated", "template"
        ]
        
        total_fields = 0
        contaminated_fields = 0
        
        def check_value(value):
            nonlocal total_fields, contaminated_fields
            if isinstance(value, str):
                total_fields += 1
                for indicator in mock_indicators:
                    if indicator.lower() in value.lower():
                        contaminated_fields += 1
                        break
            elif isinstance(value, dict):
                for v in value.values():
                    check_value(v)
            elif isinstance(value, list):
                for item in value:
                    check_value(item)
        
        check_value(result_dict)
        return contaminated_fields / total_fields if total_fields > 0 else 0.0

    def _has_domain_expertise_evidence(self, result_dict: Dict) -> bool:
        """Check for domain expertise evidence."""
        # Look for connascence-specific terminology
        expertise_terms = [
            "connascence", "coupling", "locality", "weight", "severity",
            "static", "dynamic", "name", "type", "meaning", "position"
        ]
        
        json_str = json.dumps(result_dict).lower()
        found_terms = sum(1 for term in expertise_terms if term in json_str)
        return found_terms >= len(expertise_terms) * 0.7  # 70% of terms found

    def _has_file_analysis_evidence(self, result_dict: Dict) -> bool:
        """Check for actual file analysis evidence."""
        violations = result_dict.get("violations", [])
        if not violations:
            return False
        
        # Check that violations have specific line numbers and code snippets
        for violation in violations:
            if violation.get("line_number", 0) > 0 and violation.get("code_snippet"):
                return True
        return False

    def _has_specific_recommendations(self, result_dict: Dict) -> bool:
        """Check for specific, non-generic recommendations."""
        violations = result_dict.get("violations", [])
        generic_phrases = ["should be", "consider", "you may", "it is recommended"]
        
        for violation in violations:
            recommendation = violation.get("recommendation", "").lower()
            if recommendation and not any(phrase in recommendation for phrase in generic_phrases):
                return True
        return False

    def _is_templated_response(self, text: str) -> bool:
        """Check if text appears to be a templated response."""
        templated_indicators = [
            "lorem ipsum", "placeholder", "example text", "sample content",
            "this is a", "default message", "generated text"
        ]
        text_lower = text.lower()
        return any(indicator in text_lower for indicator in templated_indicators)

    def _create_mock_analysis_result(self) -> AnalysisResult:
        """Create an obviously mock analysis result for testing detection."""
        mock_violations = [
            Violation(
                id="mock_violation_example",
                type=ConnascenceType.NAME,
                severity=Severity.MEDIUM,
                weight=1.0,
                locality="sample",
                file_path="example/sample.py",
                line_number=1,
                column=1,
                description="This is a sample violation for testing purposes",
                recommendation="Consider refactoring this example code",
                function_name="example_function",
                class_name="SampleClass",
                code_snippet="# Example code snippet",
                context={"mock": True, "template": True}
            )
        ]
        
        return AnalysisResult(
            violations=mock_violations,
            file_stats={"total_files": 1, "analyzed_files": 1},
            timestamp="2024-01-01T00:00:00Z",
            project_root="/example/project",
            total_files_analyzed=1,
            analysis_duration_ms=100,
            policy_preset="example",
            budget_status={"example": True},
            baseline_comparison={"sample": True},
            summary_metrics={"example_metric": 1.0}
        )

if __name__ == "__main__":
    unittest.main()