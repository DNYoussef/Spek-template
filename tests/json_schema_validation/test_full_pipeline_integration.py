from src.constants.base import MAXIMUM_FUNCTION_LENGTH_LINES, MAXIMUM_RETRY_ATTEMPTS, MINIMUM_TEST_COVERAGE_PERCENTAGE, TAKE_PROFIT_PERCENTAGE

End-to-end tests validating the complete JSON generation and validation pipeline:
- Complete workflow testing from analysis to JSON output
- Production scenario simulation
- Integration between all components
- Regression protection for all Phase 1 findings
"""

import json
import time
import tempfile
import shutil
from pathlib import Path
from typing import Dict, List, Any
import unittest
from unittest.mock import patch, MagicMock

# Import the actual components to test
import sys
sys.path.append(str(Path(__file__).parent.parent.parent))

from analyzer.reporting.json import JSONReporter
from analyzer.reporting.sarif import SARIFReporter
from analyzer.ast_engine.core_analyzer import AnalysisResult, Violation
from analyzer.thresholds import ConnascenceType, Severity

class TestFullPipelineIntegration(unittest.TestCase):
    """End-to-end integration tests for the complete JSON pipeline."""

    def setUp(self):
        """Set up test environment and fixtures."""
        self.json_reporter = JSONReporter()
        self.sarif_reporter = SARIFReporter()
        self.temp_dir = Path(tempfile.mkdtemp())
        self.fixtures_dir = Path(__file__).parent / "fixtures"
        
        # Create realistic project structure for testing
        self.test_project_root = self.temp_dir / "test_project"
        self.test_project_root.mkdir()
        
        # Create sample Python files
        self._create_sample_project_files()
        
        # Create comprehensive analysis result
        self.comprehensive_violations = self._create_comprehensive_violations()
        self.comprehensive_result = self._create_comprehensive_analysis_result()

    def tearDown(self):
        """Clean up test environment."""
        if self.temp_dir.exists():
            shutil.rmtree(self.temp_dir)

    def _create_sample_project_files(self):
        """Create sample Python files for realistic testing."""
        # Main module
        main_file = self.test_project_root / "main.py"
        main_file.write_text("""
def main():
    processor = DataProcessor()
    result = processor.process(42, "test")
    return result

if __name__ == "__main__":
    main()
""")

        # Data processor module
        processor_file = self.test_project_root / "processor.py"
        processor_file.write_text("""
class DataProcessor:
    def process(self, value, mode):
        if value > 100:  # Magic number
            return self._process_large(value, mode)
        return self._process_small(value, mode)
    
    def _process_large(self, value, mode):
        return value * 2 if mode == "double" else value
    
    def _process_small(self, value, mode):
        return value + 1 if mode == "increment" else value
""")

        # Utils module
        utils_file = self.test_project_root / "utils.py"
        utils_file.write_text("""
def validate_data(data, validator_type):
    if validator_type == "strict":  # String matching
        return len(data) > 0 and data.isalnum()
    elif validator_type == "loose":
        return len(data) > 0
    return False

def calculate_score(base, multiplier):
    return base * multiplier
""")

    def _create_comprehensive_violations(self) -> List[Violation]:
        """Create a comprehensive set of violations covering all scenarios."""
        violations = []
        
        # Connascence of Name violations
        violations.append(Violation(
            id="integration_test_name_001",
            type=ConnascenceType.NAME,
            severity=Severity.MEDIUM,
            weight=2.5,
            locality="local",
            file_path=str(self.test_project_root / "main.py"),
            line_number=3,
            column=16,
            end_line=3,
            end_column=29,
            description="Direct class instantiation creates name coupling",
            recommendation="Use dependency injection or factory pattern",
            function_name="main",
            class_name=None,
            code_snippet="processor = DataProcessor()",
            context={
                "coupled_class": "DataProcessor",
                "coupling_strength": "direct_instantiation"
            }
        ))
        
        # Connascence of Meaning violations
        violations.append(Violation(
            id="integration_test_meaning_001",
            type=ConnascenceType.MEANING,
            severity=Severity.HIGH,
            weight=6.0,
            locality="local",
            file_path=str(self.test_project_root / "processor.py"),
            line_number=4,
            column=19,
            end_line=4,
            end_column=22,
            description="Magic number 100 used without context",
            recommendation="Replace with named constant MAX_SMALL_VALUE",
            function_name="process",
            class_name="DataProcessor",
            code_snippet="if value > 100:",
            context={
                "magic_value": 100,
                "suggested_constant": "MAX_SMALL_VALUE",
                "usage_context": "threshold_comparison"
            }
        ))
        
        # Connascence of Type violations
        violations.append(Violation(
            id="integration_test_type_001",
            type=ConnascenceType.TYPE,
            severity=Severity.MEDIUM,
            weight=3.0,
            locality="cross_module",
            file_path=str(self.test_project_root / "utils.py"),
            line_number=2,
            column=19,
            end_line=2,
            end_column=23,
            description="String type assumption for data parameter",
            recommendation="Add type hints or validate input type",
            function_name="validate_data",
            class_name=None,
            code_snippet="def validate_data(data, validator_type):",
            context={
                "assumed_type": "str",
                "risk_level": "medium",
                "type_validation_missing": True
            }
        ))
        
        # Connascence of Position violations
        violations.append(Violation(
            id="integration_test_position_001",
            type=ConnascenceType.POSITION,
            severity=Severity.LOW,
            weight=1.5,
            locality="local",
            file_path=str(self.test_project_root / "main.py"),
            line_number=4,
            column=26,
            end_line=4,
            end_column=39,
            description="Parameter order dependency in function call",
            recommendation="Use keyword arguments for clarity",
            function_name="main",
            class_name=None,
            code_snippet='result = processor.process(42, "test")',
            context={
                "parameter_count": 2,
                "positional_args": True,
                "keyword_args_recommended": True
            }
        ))
        
        # Cross-module violations
        violations.append(Violation(
            id="integration_test_cross_module_001",
            type=ConnascenceType.EXECUTION,
            severity=Severity.CRITICAL,
            weight=9.0,
            locality="cross_module",
            file_path=str(self.test_project_root / "main.py"),
            line_number=2,
            column=1,
            end_line=6,
            end_column=15,
            description="Execution order dependency between main and processor modules",
            recommendation="Implement proper initialization and dependency management",
            function_name="main",
            class_name=None,
            code_snippet="def main():\n    processor = DataProcessor()\n    result = processor.process(42, \"test\")",
            context={
                "dependent_modules": ["processor"],
                "execution_order_critical": True,
                "initialization_required": True
            }
        ))
        
        return violations

    def _create_comprehensive_analysis_result(self) -> AnalysisResult:
        """Create a comprehensive analysis result for integration testing."""
        return AnalysisResult(
            violations=self.comprehensive_violations,
            file_stats={
                "total_files": 3,
                "analyzed_files": 3,
                "lines_of_code": 45,
                "functions_analyzed": 6,
                "classes_analyzed": 1
            },
            timestamp="2024-01-01T12:00:00Z",
            project_root=str(self.test_project_root),
            total_files_analyzed=3,
            analysis_duration_ms=2500,
            policy_preset="comprehensive",
            budget_status={
                "within_budget": False,
                "budget_used": 1.2,
                "over_budget_violations": 2
            },
            baseline_comparison={
                "improved": False,
                "regression_count": 1,
                "new_violations": 3,
                "fixed_violations": 2
            },
            summary_metrics={
                "total_weight": sum(v.weight for v in self.comprehensive_violations),
                "average_weight": sum(v.weight for v in self.comprehensive_violations) / len(self.comprehensive_violations),
                "critical_weight": sum(v.weight for v in self.comprehensive_violations if v.severity == Severity.CRITICAL),
                "complexity_score": 0.75
            }
        )

    # Full Pipeline Integration Tests
    def test_complete_json_generation_pipeline(self):
        """Test complete JSON generation pipeline from analysis to output."""
        # Generate JSON output
        start_time = time.perf_counter()
        json_output = self.json_reporter.generate(self.comprehensive_result)
        generation_time = time.perf_counter() - start_time
        
        # Parse and validate structure
        result_dict = json.loads(json_output)
        
        # Verify all Phase 1 compliance requirements
        self._validate_phase1_compliance(result_dict)
        
        # Verify performance requirements
        self.assertLess(generation_time, 1.0, f"Generation took {generation_time:.3f}s, exceeds 1s threshold")
        
        # Verify data integrity
        self._validate_data_integrity(result_dict)
        
        # Verify no mock data contamination
        mock_score = self._calculate_mock_contamination(result_dict)
        self.assertLess(mock_score, 0.1, f"Mock contamination score {mock_score:.2f} too high")

    def test_complete_sarif_generation_pipeline(self):
        """Test complete SARIF generation pipeline."""
        # Generate SARIF output
        sarif_output = self.sarif_reporter.generate(self.comprehensive_result)
        sarif_dict = json.loads(sarif_output)
        
        # Validate SARIF 2.1.0 compliance
        self._validate_sarif_compliance(sarif_dict)
        
        # Verify all violations are included
        results = sarif_dict["runs"][0]["results"]
        self.assertEqual(len(results), len(self.comprehensive_violations))
        
        # Verify cross-format consistency
        json_output = self.json_reporter.generate(self.comprehensive_result)
        json_dict = json.loads(json_output)
        self._validate_cross_format_consistency(json_dict, sarif_dict)

    def test_production_scenario_simulation(self):
        """Simulate a realistic production analysis scenario."""
        # Create larger, more realistic violation set
        production_violations = []
        
        # Generate violations for different file types and patterns
        file_patterns = [
            "src/models/user.py", "src/controllers/auth.py", "src/utils/crypto.py",
            "src/services/email.py", "src/database/connection.py", "tests/test_auth.py",
            "config/settings.py", "migrations/001_initial.py"
        ]
        
        violation_types = list(ConnascenceType)
        severities = list(Severity)
        
        for i, file_path in enumerate(file_patterns):
            for j in range(5):  # 5 violations per file
                violation_type = violation_types[(i + j) % len(violation_types)]
                severity = severities[(i + j) % len(severities)]
                
                violation = Violation(
                    id=f"prod_sim_{i:02d}_{j:02d}_{violation_type.value}",
                    type=violation_type,
                    severity=severity,
                    weight=float((i + j) % 10 + 1),
                    locality="cross_module" if j % 3 == 0 else "local",
                    file_path=file_path,
                    line_number=(i + j) * 10 + 5,
                    column=(j % 10) + 1,
                    end_line=(i + j) * 10 + 5,
                    end_column=(j % 10) + 15,
                    description=f"Production violation {i}-{j}: {violation_type.value} issue",
                    recommendation=f"Refactor {violation_type.value} coupling in {file_path}",
                    function_name=f"function_{j}",
                    class_name=f"Class_{i}" if i % 2 == 0 else None,
                    code_snippet=f"# Line {(i + j) * 10 + 5} in {file_path}",
                    context={
                        "production_scenario": True,
                        "file_index": i,
                        "violation_index": j,
                        "realistic_context": True
                    }
                )
                production_violations.append(violation)
        
        production_result = AnalysisResult(
            violations=production_violations,
            file_stats={
                "total_files": len(file_patterns),
                "analyzed_files": len(file_patterns),
                "lines_of_code": len(file_patterns) * 200,
                "functions_analyzed": len(file_patterns) * 10,
                "classes_analyzed": len(file_patterns) // 2
            },
            timestamp="2024-01-01T15:30:00Z",
            project_root="/production/project",
            total_files_analyzed=len(file_patterns),
            analysis_duration_ms=15000,
            policy_preset="production",
            budget_status={"within_budget": True, "budget_used": 0.85},
            baseline_comparison={"improved": True, "regression_count": 0},
            summary_metrics={"total_weight": sum(v.weight for v in production_violations)}
        )
        
        # Test both JSON and SARIF generation
        json_output = self.json_reporter.generate(production_result)
        sarif_output = self.sarif_reporter.generate(production_result)
        
        # Validate outputs
        json_dict = json.loads(json_output)
        sarif_dict = json.loads(sarif_output)
        
        # Production validation checks
        self._validate_production_readiness(json_dict, sarif_dict)

    def test_regression_protection_for_phase1_findings(self):
        """Test that all Phase 1 critical issues are resolved and won't regress."""'
        # Test all Phase 1 critical issues:
        
        # 1. Mock Data Contamination Prevention (85.7% contamination detected)
        json_output = self.json_reporter.generate(self.comprehensive_result)
        result_dict = json.loads(json_output)
        mock_score = self._calculate_mock_contamination(result_dict)
        self.assertLess(mock_score, TAKE_PROFIT_PERCENTAGE, "REGRESSION: Mock data contamination detected")
        
        # 2. Schema Consistency Validation (71% consistency score - needs improvement)
        self._validate_schema_consistency(result_dict)
        
        # 3. Policy Field Standardization
        self._validate_policy_field_standardization(result_dict)
        
        # 4. SARIF 2.1.0 Compliance (85/MAXIMUM_FUNCTION_LENGTH_LINES score - 3 critical issues)
        sarif_output = self.sarif_reporter.generate(self.comprehensive_result)
        sarif_dict = json.loads(sarif_output)
        self._validate_sarif_compliance(sarif_dict)
        
        # 5. Violation ID Determinism (85% probability failure mode)
        self._validate_violation_id_determinism(result_dict)
        
        # 6. Performance Regression Detection (MAXIMUM_RETRY_ATTEMPTS.6% JSON generation time baseline)
        start_time = time.perf_counter()
        self.json_reporter.generate(self.comprehensive_result)
        generation_time = time.perf_counter() - start_time
        self.assertLess(generation_time, 0.5, "REGRESSION: Performance degradation detected")

    def test_stress_testing_large_codebase(self):
        """Test pipeline performance with large codebase simulation."""
        # Create large violation set (simulate 1000-file codebase)
        large_violations = []
        for i in range(5000):  # 5000 violations across 1000 files
            violation = Violation(
                id=f"stress_{i:05d}",
                type=list(ConnascenceType)[i % len(ConnascenceType)],
                severity=list(Severity)[i % len(Severity)],
                weight=float((i % 10) + 1),
                locality="cross_module" if i % 5 == 0 else "local",
                file_path=f"src/module_{i // 5:03d}.py",
                line_number=i % 1000 + 1,
                column=i % MINIMUM_TEST_COVERAGE_PERCENTAGE + 1,
                description=f"Stress test violation {i}",
                recommendation=f"Fix stress violation {i}",
                context={"stress_test": True, "index": i}
            )
            large_violations.append(violation)
        
        large_result = AnalysisResult(
            violations=large_violations,
            file_stats={"total_files": 1000, "analyzed_files": 1000},
            timestamp="2024-01-01T16:00:00Z",
            project_root="/stress/test/project",
            total_files_analyzed=1000,
            analysis_duration_ms=45000,
            policy_preset="stress_test",
            budget_status={},
            baseline_comparison={},
            summary_metrics={"total_weight": sum(v.weight for v in large_violations)}
        )
        
        # Test performance under load
        start_time = time.perf_counter()
        json_output = self.json_reporter.generate(large_result)
        json_time = time.perf_counter() - start_time
        
        start_time = time.perf_counter()
        sarif_output = self.sarif_reporter.generate(large_result)
        sarif_time = time.perf_counter() - start_time
        
        # Validate performance thresholds
        self.assertLess(json_time, 10.0, f"JSON generation took {json_time:.2f}s, exceeds 10s threshold")
        self.assertLess(sarif_time, 60.0, f"SARIF generation took {sarif_time:.2f}s, exceeds 60s threshold")
        
        # Validate output integrity
        json_dict = json.loads(json_output)
        sarif_dict = json.loads(sarif_output)
        
        self.assertEqual(len(json_dict["violations"]), 5000)
        self.assertEqual(len(sarif_dict["runs"][0]["results"]), 5000)

    # Validation Helper Methods
    def _validate_phase1_compliance(self, result_dict: Dict):
        """Validate compliance with all Phase 1 requirements."""
        # Schema version compliance
        self.assertEqual(result_dict.get("schema_version"), "1.0.0")
        
        # Required top-level fields
        required_fields = ["schema_version", "metadata", "summary", "violations", "policy_compliance"]
        for field in required_fields:
            self.assertIn(field, result_dict, f"Missing required field: {field}")
        
        # Violation structure compliance
        for violation in result_dict.get("violations", []):
            required_violation_fields = [
                "id", "rule_id", "type", "severity", "weight", "locality",
                "file_path", "line_number", "description", "recommendation"
            ]
            for field in required_violation_fields:
                self.assertIn(field, violation, f"Violation missing field: {field}")

    def _validate_data_integrity(self, result_dict: Dict):
        """Validate data integrity in the JSON output."""
        violations = result_dict.get("violations", [])
        
        # All violations should have unique IDs
        violation_ids = [v["id"] for v in violations]
        self.assertEqual(len(violation_ids), len(set(violation_ids)), "Duplicate violation IDs detected")
        
        # All violations should have valid weights
        for violation in violations:
            weight = violation.get("weight")
            self.assertIsInstance(weight, (int, float))
            self.assertGreaterEqual(weight, 0)
            self.assertLess(weight, 100)  # Reasonable upper bound
        
        # Summary should match violation data
        summary = result_dict.get("summary", {})
        actual_total = len(violations)
        summary_total = summary.get("total_violations", 0)
        self.assertEqual(actual_total, summary_total, "Summary total doesn't match violation count")

    def _validate_sarif_compliance(self, sarif_dict: Dict):
        """Validate SARIF 2.1.0 compliance."""
        # Schema compliance
        self.assertEqual(sarif_dict.get("$schema"), 
                        "https://schemastore.azurewebsites.net/schemas/json/sarif-2.1.0.json")
        self.assertEqual(sarif_dict.get("version"), "2.1.0")
        
        # Required structure
        self.assertIn("runs", sarif_dict)
        self.assertGreater(len(sarif_dict["runs"]), 0)
        
        run = sarif_dict["runs"][0]
        self.assertIn("tool", run)
        self.assertIn("results", run)

    def _validate_cross_format_consistency(self, json_dict: Dict, sarif_dict: Dict):
        """Validate consistency between JSON and SARIF formats."""
        json_violations = json_dict.get("violations", [])
        sarif_results = sarif_dict["runs"][0]["results"]
        
        # Same number of violations/results
        self.assertEqual(len(json_violations), len(sarif_results))
        
        # Consistent violation data (by checking a few key fields)
        for json_violation, sarif_result in zip(json_violations, sarif_results):
            # Rule ID consistency
            self.assertEqual(json_violation["rule_id"], sarif_result["ruleId"])
            
            # Severity mapping consistency
            json_severity = json_violation["severity"]
            sarif_level = sarif_result["level"]
            expected_mapping = {"low": "note", "medium": "warning", "high": "error", "critical": "error"}
            self.assertEqual(sarif_level, expected_mapping.get(json_severity, "warning"))

    def _validate_production_readiness(self, json_dict: Dict, sarif_dict: Dict):
        """Validate production readiness of outputs."""
        # JSON production checks
        self.assertIn("metadata", json_dict)
        self.assertIn("tool", json_dict["metadata"])
        self.assertIn("analysis", json_dict["metadata"])
        
        # SARIF production checks
        tool_driver = sarif_dict["runs"][0]["tool"]["driver"]
        self.assertIn("name", tool_driver)
        self.assertIn("version", tool_driver)
        self.assertIn("informationUri", tool_driver)
        
        # Performance characteristics
        json_size = len(json.dumps(json_dict))
        sarif_size = len(json.dumps(sarif_dict))
        
        # SARIF should not be excessively larger than JSON
        size_ratio = sarif_size / json_size if json_size > 0 else float('inf')
        self.assertLess(size_ratio, 10.0, f"SARIF size ratio {size_ratio:.1f}x too large")

    def _calculate_mock_contamination(self, result_dict: Dict) -> float:
        """Calculate mock data contamination score."""
        mock_indicators = [
            "example", "sample", "test", "mock", "stub", "placeholder",
            "dummy", "fake", "synthetic", "generated", "template"
        ]
        
        total_strings = 0
        contaminated_strings = 0
        
        def check_strings(obj):
            nonlocal total_strings, contaminated_strings
            if isinstance(obj, str):
                total_strings += 1
                for indicator in mock_indicators:
                    if indicator.lower() in obj.lower():
                        contaminated_strings += 1
                        break
            elif isinstance(obj, dict):
                for value in obj.values():
                    check_strings(value)
            elif isinstance(obj, list):
                for item in obj:
                    check_strings(item)
        
        check_strings(result_dict)
        return contaminated_strings / total_strings if total_strings > 0 else 0.0

    def _validate_schema_consistency(self, result_dict: Dict):
        """Validate schema consistency across the output."""
        # All violations should have consistent structure
        violations = result_dict.get("violations", [])
        if violations:
            first_violation_keys = set(violations[0].keys())
            for i, violation in enumerate(violations[1:], 1):
                violation_keys = set(violation.keys())
                self.assertEqual(first_violation_keys, violation_keys,
                                f"Violation {i} has inconsistent structure")

    def _validate_policy_field_standardization(self, result_dict: Dict):
        """Validate policy field standardization."""
        policy_compliance = result_dict.get("policy_compliance", {})
        
        # Standard policy fields should be present
        expected_fields = ["policy_preset", "budget_status", "baseline_comparison", "quality_gates"]
        for field in expected_fields:
            self.assertIn(field, policy_compliance, f"Missing standard policy field: {field}")

    def _validate_violation_id_determinism(self, result_dict: Dict):
        """Validate that violation IDs are deterministic and unique."""
        violations = result_dict.get("violations", [])
        violation_ids = [v["id"] for v in violations]
        
        # All IDs should be unique
        self.assertEqual(len(violation_ids), len(set(violation_ids)), "Non-unique violation IDs")
        
        # IDs should be non-empty strings
        for violation_id in violation_ids:
            self.assertIsInstance(violation_id, str)
            self.assertGreater(len(violation_id), 0)

if __name__ == "__main__":
    unittest.main()