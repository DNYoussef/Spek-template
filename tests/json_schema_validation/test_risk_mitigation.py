from src.constants.base import MAXIMUM_FUNCTION_PARAMETERS, MAXIMUM_NESTED_DEPTH, MINIMUM_TEST_COVERAGE_PERCENTAGE
"""

Tests all failure modes and risk scenarios identified in Phase 1:
- Data integrity maintenance under edge conditions
- Cross-file consistency validation
- Failure mode prevention for critical paths
- Error recovery and graceful degradation
- Resource exhaustion protection
"""

import json
import time
import threading
import tempfile
import shutil
from pathlib import Path
from typing import Dict, List, Any
import unittest
from unittest.mock import patch, MagicMock
import concurrent.futures

# Import the actual reporters and analyzers to test
import sys
sys.path.append(str(Path(__file__).parent.parent.parent))

from analyzer.reporting.json import JSONReporter
from analyzer.reporting.sarif import SARIFReporter
from analyzer.ast_engine.core_analyzer import AnalysisResult, Violation
from analyzer.thresholds import ConnascenceType, Severity
"""

class TestRiskMitigation(unittest.TestCase):
    """Risk mitigation and failure mode prevention tests."""

    def setUp(self):
        """Set up test fixtures and reporters."""
        self.json_reporter = JSONReporter()
        self.sarif_reporter = SARIFReporter()
        self.temp_dir = Path(tempfile.mkdtemp())
        
        # Create sample data for stress testing
        self.sample_violations = self._create_large_violation_set(1000)
        self.sample_analysis_result = self._create_sample_analysis_result()

    def tearDown(self):
        """Clean up temporary test files."""
        if self.temp_dir.exists():
            shutil.rmtree(self.temp_dir)

    def _create_large_violation_set(self, count: int) -> List[Violation]:
        """Create a large set of violations for stress testing."""
        violations = []
        types = list(ConnascenceType)
        severities = list(Severity)
        
        for i in range(count):
            violation_type = types[i % len(types)]
            severity = severities[i % len(severities)]
            
            violation = Violation(
                id=f"stress_test_{violation_type.value}_{i:04d}",
                type=violation_type,
                severity=severity,
                weight=float(i % 10 + 1),
                locality="local" if i % 2 else "cross_module",
                file_path=f"test/file_{i % 50}.py",
                line_number=i % 1000 + 1,
                column=i % 80 + 1,
                end_line=i % 1000 + 1,
                end_column=i % MINIMUM_TEST_COVERAGE_PERCENTAGE + MAXIMUM_FUNCTION_PARAMETERS,
                description=f"Stress test violation {i}",
                recommendation=f"Fix violation {i}",
                function_name=f"function_{i % 100}",
                class_name=f"Class_{i % 50}",
                code_snippet=f"# Code snippet {i}",
                context={"stress_test": True, "index": i}
            )
            violations.append(violation)
        
        return violations

    def _create_sample_analysis_result(self) -> AnalysisResult:
        """Create a sample analysis result for testing."""
        return AnalysisResult(
            violations=self.sample_violations,
            file_stats={"total_files": 50, "analyzed_files": 50},
            timestamp="2024-01-01T12:00:00Z",
            project_root="/test/stress_project",
            total_files_analyzed=50,
            analysis_duration_ms=5000,
            policy_preset="stress_test",
            budget_status={"within_budget": True},
            baseline_comparison={"improved": False},
            summary_metrics={"total_weight": sum(v.weight for v in self.sample_violations)}
        )

    # Data Integrity Tests
    def test_data_integrity_under_large_datasets(self):
        """Test data integrity when processing large violation datasets."""
        # Generate JSON for large dataset
        json_output = self.json_reporter.generate(self.sample_analysis_result)
        result_dict = json.loads(json_output)
        
        # Verify all violations are present
        violations = result_dict.get("violations", [])
        self.assertEqual(len(violations), len(self.sample_violations),
                        "Lost violations during large dataset processing")
        
        # Verify data consistency
        for i, violation in enumerate(violations):
            self.assertIsInstance(violation["id"], str)
            self.assertGreater(len(violation["id"]), 0)
            self.assertIn("description", violation)
            self.assertIn("file_path", violation)
            self.assertIsInstance(violation["weight"], (int, float))

    def test_data_integrity_under_memory_pressure(self):
        """Test data integrity under memory pressure conditions."""
        # Create extremely large dataset
        large_violations = self._create_large_violation_set(10000)
        large_result = AnalysisResult(
            violations=large_violations,
            file_stats={"total_files": 1000},
            timestamp="2024-01-01T12:00:00Z",
            project_root="/test/large_project",
            total_files_analyzed=1000,
            analysis_duration_ms=30000,
            policy_preset="stress_test",
            budget_status={},
            baseline_comparison={},
            summary_metrics={}
        )
        
        # Generate JSON under memory pressure
        json_output = self.json_reporter.generate(large_result)
        result_dict = json.loads(json_output)
        
        # Verify no data corruption
        violations = result_dict.get("violations", [])
        self.assertEqual(len(violations), 10000, "Data loss under memory pressure")
        
        # Verify summary calculations are correct
        summary = result_dict.get("summary", {})
        self.assertEqual(summary.get("total_violations"), 10000)

    def test_json_structure_integrity_edge_cases(self):
        """Test JSON structure integrity with edge case data."""
        # Create violations with edge case data
        edge_case_violations = [
            Violation(
                id="edge_case_1",
                type=ConnascenceType.NAME,
                severity=Severity.LOW,
                weight=0.0,  # Zero weight
                locality="",  # Empty locality
                file_path="",  # Empty path
                line_number=0,  # Zero line number
                column=0,
                description="",  # Empty description
                recommendation="",
                context={}  # Empty context
            ),
            Violation(
                id="edge_case_2",
                type=ConnascenceType.MEANING,
                severity=Severity.CRITICAL,
                weight=float('inf'),  # Infinite weight (should be handled)
                locality="very_long_locality_string_" * 100,  # Very long string
                file_path="/" + "x" * 1000 + ".py",  # Very long path
                line_number=999999,  # Very large line number
                column=999999,
                description="x" * 10000,  # Very long description
                recommendation="y" * 5000,
                context={"key": "value" * 1000}  # Large context
            )
        ]
        
        edge_case_result = AnalysisResult(
            violations=edge_case_violations,
            file_stats={"total_files": 1},
            timestamp="2024-01-01T12:00:00Z",
            project_root="/test/edge_case",
            total_files_analyzed=1,
            analysis_duration_ms=100,
            policy_preset="edge_case",
            budget_status={},
            baseline_comparison={},
            summary_metrics={}
        )
        
        # Should not raise exceptions
        json_output = self.json_reporter.generate(edge_case_result)
        result_dict = json.loads(json_output)
        
        # Verify structure is still valid
        self.assertIn("violations", result_dict)
        self.assertIn("summary", result_dict)
        self.assertIn("metadata", result_dict)

    # Cross-File Consistency Tests
    def test_cross_file_violation_consistency(self):
        """Test consistency of violations across multiple files."""
        # Create violations referencing the same elements across files
        cross_file_violations = []
        for i in range(100):
            # Create violations that should be consistent across files
            violation = Violation(
                id=f"cross_file_{i}",
                type=ConnascenceType.NAME,
                severity=Severity.MEDIUM,
                weight=2.0,
                locality="cross_module",
                file_path=f"module_{i % 5}.py",  # 5 modules with cross-references
                line_number=10,
                column=5,
                description=f"Cross-module name dependency on shared_function",
                recommendation="Extract shared function to common module",
                function_name="shared_function",
                context={"shared_element": "shared_function", "module_id": i % 5}
            )
            cross_file_violations.append(violation)
        
        cross_file_result = AnalysisResult(
            violations=cross_file_violations,
            file_stats={"total_files": 5},
            timestamp="2024-01-01T12:00:00Z",
            project_root="/test/cross_file",
            total_files_analyzed=5,
            analysis_duration_ms=1000,
            policy_preset="cross_file",
            budget_status={},
            baseline_comparison={},
            summary_metrics={}
        )
        
        json_output = self.json_reporter.generate(cross_file_result)
        result_dict = json.loads(json_output)
        
        # Verify cross-file consistency
        violations = result_dict.get("violations", [])
        shared_function_violations = [v for v in violations 
                                    if v.get("function_name") == "shared_function"]
        
        # All violations for the same function should have consistent data
        for violation in shared_function_violations:
            self.assertEqual(violation["type"], "name")
            self.assertEqual(violation["severity"], "medium")
            self.assertEqual(violation["weight"], 2.0)

    def test_policy_field_consistency_across_files(self):
        """Test that policy fields remain consistent across multiple analysis runs."""
        results = []
        
        # Run analysis multiple times with slight variations
        for i in range(5):
            violations = [self._create_sample_violation(f"policy_test_{i}", i)]
            result = AnalysisResult(
                violations=violations,
                file_stats={"total_files": 1},
                timestamp=f"2024-01-0{i+1}T12:00:00Z",
                project_root=f"/test/policy_{i}",
                total_files_analyzed=1,
                analysis_duration_ms=100 + i * 10,
                policy_preset="consistent_policy",
                budget_status={"within_budget": True},
                baseline_comparison={"improved": True},
                summary_metrics={"total_weight": float(i + 1)}
            )
            
            json_output = self.json_reporter.generate(result)
            results.append(json.loads(json_output))
        
        # Verify policy consistency across all results
        policy_structures = [result.get("policy_compliance", {}) for result in results]
        
        # All policy structures should have the same keys
        first_policy_keys = set(policy_structures[0].keys())
        for i, policy in enumerate(policy_structures[1:], 1):
            policy_keys = set(policy.keys())
            self.assertEqual(first_policy_keys, policy_keys,
                            f"Policy structure inconsistent at result {i}")

    def _create_sample_violation(self, violation_id: str, index: int) -> Violation:
        """Create a sample violation with specified ID and index."""
        return Violation(
            id=violation_id,
            type=ConnascenceType.NAME,
            severity=Severity.MEDIUM,
            weight=float(index + 1),
            locality="local",
            file_path=f"test_{index}.py",
            line_number=index + 1,
            column=5,
            description=f"Test violation {index}",
            recommendation=f"Fix test violation {index}",
            context={"test_index": index}
        )

    # Failure Mode Prevention Tests
    def test_concurrent_access_safety(self):
        """Test thread safety during concurrent JSON generation."""
        results = []
        errors = []
        
        def generate_json(thread_id):
            try:
                json_output = self.json_reporter.generate(self.sample_analysis_result)
                result = json.loads(json_output)
                results.append((thread_id, result))
            except Exception as e:
                errors.append((thread_id, str(e)))
        
        # Run concurrent JSON generation
        threads = []
        for i in range(10):
            thread = threading.Thread(target=generate_json, args=(i,))
            threads.append(thread)
            thread.start()
        
        # Wait for all threads
        for thread in threads:
            thread.join()
        
        # Verify no errors occurred
        self.assertEqual(len(errors), 0, f"Concurrent access errors: {errors}")
        self.assertEqual(len(results), 10, "Missing results from concurrent access")
        
        # Verify all results are identical (deterministic)
        first_result = results[0][1]
        for thread_id, result in results[1:]:
            self.assertEqual(result, first_result, 
                            f"Non-deterministic result from thread {thread_id}")

    def test_resource_exhaustion_protection(self):
        """Test protection against resource exhaustion attacks."""
        # Test with extremely large violation description
        malicious_violation = Violation(
            id="resource_attack",
            type=ConnascenceType.MEANING,
            severity=Severity.HIGH,
            weight=5.0,
            locality="local",
            file_path="attack.py",
            line_number=1,
            column=1,
            description="x" * 1000000,  # 1MB description
            recommendation="y" * 1000000,  # 1MB recommendation
            code_snippet="z" * 100000,  # 100KB code snippet
            context={"attack": "a" * 100000}  # 100KB context
        )
        
        attack_result = AnalysisResult(
            violations=[malicious_violation],
            file_stats={"total_files": 1},
            timestamp="2024-01-01T12:00:00Z",
            project_root="/test/attack",
            total_files_analyzed=1,
            analysis_duration_ms=100,
            policy_preset="attack",
            budget_status={},
            baseline_comparison={},
            summary_metrics={}
        )
        
        # Should complete without memory errors (but may truncate)
        start_time = time.time()
        json_output = self.json_reporter.generate(attack_result)
        end_time = time.time()
        
        # Should not take too long (protection against DoS)
        self.assertLess(end_time - start_time, 10.0, "Resource exhaustion attack succeeded")
        
        # Should produce valid JSON
        result_dict = json.loads(json_output)
        self.assertIn("violations", result_dict)

    def test_invalid_input_handling(self):
        """Test handling of invalid or corrupted input data."""
        # Test with None violations
        try:
            invalid_result = AnalysisResult(
                violations=None,
                file_stats={},
                timestamp="2024-01-01T12:00:00Z",
                project_root="/test/invalid",
                total_files_analyzed=0,
                analysis_duration_ms=0,
                policy_preset="invalid",
                budget_status={},
                baseline_comparison={},
                summary_metrics={}
            )
            json_output = self.json_reporter.generate(invalid_result)
            result_dict = json.loads(json_output)
            
            # Should handle None violations gracefully
            violations = result_dict.get("violations", [])
            self.assertEqual(violations, [])
            
        except Exception as e:
            # If it raises an exception, it should be a controlled one
            self.assertIsInstance(e, (TypeError, ValueError))

    def test_circular_reference_protection(self):
        """Test protection against circular references in violation context."""
        # Create circular reference in context
        circular_context = {"self": None}
        circular_context["self"] = circular_context
        
        circular_violation = Violation(
            id="circular_test",
            type=ConnascenceType.VALUE,
            severity=Severity.MEDIUM,
            weight=3.0,
            locality="local",
            file_path="circular.py",
            line_number=10,
            column=MAXIMUM_NESTED_DEPTH,
            description="Circular reference test",
            recommendation="Fix circular reference",
            context=circular_context
        )
        
        circular_result = AnalysisResult(
            violations=[circular_violation],
            file_stats={"total_files": 1},
            timestamp="2024-01-01T12:00:00Z",
            project_root="/test/circular",
            total_files_analyzed=1,
            analysis_duration_ms=100,
            policy_preset="circular",
            budget_status={},
            baseline_comparison={},
            summary_metrics={}
        )
        
        # Should handle circular references without infinite recursion
        json_output = self.json_reporter.generate(circular_result)
        result_dict = json.loads(json_output)
        
        # Should produce valid output (context may be empty or truncated)
        self.assertIn("violations", result_dict)
        violations = result_dict["violations"]
        self.assertEqual(len(violations), 1)

    # Error Recovery Tests
    def test_graceful_degradation_on_partial_failures(self):
        """Test graceful degradation when some violations cannot be serialized."""
        # Mix of valid and problematic violations
        mixed_violations = [
            # Valid violation
            Violation(
                id="valid_1",
                type=ConnascenceType.NAME,
                severity=Severity.MEDIUM,
                weight=2.0,
                locality="local",
                file_path="valid.py",
                line_number=10,
                column=5,
                description="Valid violation",
                recommendation="Fix valid violation"
            ),
            # Violation with problematic data
            Violation(
                id="problematic_1",
                type=ConnascenceType.TYPE,
                severity=Severity.HIGH,
                weight=float('nan'),  # NaN weight
                locality="local",
                file_path="problematic.py",
                line_number=20,
                column=5,
                description="Problematic violation",
                recommendation="Fix problematic violation"
            ),
            # Another valid violation
            Violation(
                id="valid_2",
                type=ConnascenceType.MEANING,
                severity=Severity.LOW,
                weight=1.0,
                locality="local",
                file_path="valid2.py",
                line_number=30,
                column=5,
                description="Another valid violation",
                recommendation="Fix another valid violation"
            )
        ]
        
        mixed_result = AnalysisResult(
            violations=mixed_violations,
            file_stats={"total_files": 3},
            timestamp="2024-01-01T12:00:00Z",
            project_root="/test/mixed",
            total_files_analyzed=3,
            analysis_duration_ms=300,
            policy_preset="mixed",
            budget_status={},
            baseline_comparison={},
            summary_metrics={}
        )
        
        # Should complete and include valid violations
        json_output = self.json_reporter.generate(mixed_result)
        result_dict = json.loads(json_output)
        
        violations = result_dict.get("violations", [])
        
        # Should include at least the valid violations
        self.assertGreaterEqual(len(violations), 2, "Lost valid violations due to partial failures")
        
        # Valid violations should be present
        valid_ids = {v["id"] for v in violations}
        self.assertIn("valid_1", valid_ids)
        self.assertIn("valid_2", valid_ids)

if __name__ == "__main__":
    unittest.main()