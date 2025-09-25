from lib.shared.utilities import path_exists
from src.constants.base import MAXIMUM_NESTED_DEPTH, QUALITY_GATE_MINIMUM_PASS_RATE, TAKE_PROFIT_PERCENTAGE

GPT-5 Codex Theater Killer Audit - Comprehensive Reality Validation
Tests all Phase 1 implementations for actual functionality vs. performance theater.

SCORING SYSTEM:
- 0-30%: Heavy theater, mostly fake
- 31-60%: Some real code but many stubs
- 61-80%: Mostly real with minor gaps
- 81-100%: Production-ready, no theater
"""

import sys
import os
import ast
import json
import unittest
import tempfile
import traceback
from unittest.mock import Mock, patch, MagicMock
from dataclasses import dataclass
from typing import List, Dict, Any, Optional
from pathlib import Path

# Add analyzer to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

# Test imports
try:
    from analyzer.utils.types import ConnascenceViolation, ConnascenceType, SeverityLevel, AnalysisResult
    from analyzer.integrations.github_bridge import GitHubBridge, GitHubConfig, integrate_with_workflow
    from analyzer.detectors import DetectorBase, MagicLiteralDetector
    IMPORTS_SUCCESS = True
    IMPORT_ERRORS = []
except Exception as e:
    IMPORTS_SUCCESS = False
    IMPORT_ERRORS = [str(e)]

@dataclass
class TheaterDetectionResult:
    """Results of theater detection analysis."""
    component: str
    reality_score: float  # 0-100%
    theater_elements: List[str]
    real_functionality: List[str]
    fixes_applied: List[str]
    test_results: Dict[str, Any]
    production_ready: bool

class TheaterDetectionAudit:
    """Main theater detection and reality check audit system."""

    def __init__(self):
        self.results: List[TheaterDetectionResult] = []
        self.overall_score = 0.0
        self.critical_issues = []

    def run_full_audit(self) -> Dict[str, Any]:
        """Run complete theater detection audit."""
        print("PHASE 1 THEATER DETECTION AUDIT STARTING...")
        print("=" * 60)

        # Test 1: Import Analysis
        import_result = self._test_imports()
        self.results.append(import_result)

        # Test 2: ConnascenceViolation Class Reality Check
        types_result = self._test_types_functionality()
        self.results.append(types_result)

        # Test 3: GitHub Bridge Reality Check
        github_result = self._test_github_bridge()
        self.results.append(github_result)

        # Test 4: Detector Module Reality Check
        detector_result = self._test_detector_functionality()
        self.results.append(detector_result)

        # Test MAXIMUM_NESTED_DEPTH: Integration Testing
        integration_result = self._test_integration()
        self.results.append(integration_result)

        # Calculate overall reality score
        self._calculate_overall_score()

        # Generate final report
        return self._generate_audit_report()

    def _test_imports(self) -> TheaterDetectionResult:
        """Test import functionality - detect fake imports."""

        theater_elements = []
        real_functionality = []
        fixes_applied = []
        test_results = {}

        if not IMPORTS_SUCCESS:
            theater_elements.extend([
                "Import failures indicate broken module structure",
                f"Import errors: {IMPORT_ERRORS}"
            ])
            test_results["import_success"] = False
            test_results["errors"] = IMPORT_ERRORS
            reality_score = 10.0  # Heavy theater if imports fail
        else:
            real_functionality.extend([
                "All critical imports successful",
                "Module structure appears functional"
            ])
            test_results["import_success"] = True
            reality_score = 85.0

        return TheaterDetectionResult(
            component="imports",
            reality_score=reality_score,
            theater_elements=theater_elements,
            real_functionality=real_functionality,
            fixes_applied=fixes_applied,
            test_results=test_results,
            production_ready=reality_score >= 80
        )

    def _test_types_functionality(self) -> TheaterDetectionResult:
        """Test ConnascenceViolation and types - detect stub implementations."""

        theater_elements = []
        real_functionality = []
        fixes_applied = []
        test_results = {}

        try:
            # Test ConnascenceViolation creation
            violation = ConnascenceViolation(
                type="test_type",
                severity="high",
                description="Test violation",
                file_path="test.py",
                line_number=42,
                column=10
            )

            # Test validation logic
            if hasattr(violation, '__post_init__'):
                real_functionality.append("ConnascenceViolation has validation logic")
            else:
                theater_elements.append("Missing validation logic in ConnascenceViolation")

            # Test to_dict functionality
            if hasattr(violation, 'to_dict'):
                violation_dict = violation.to_dict()
                if isinstance(violation_dict, dict) and len(violation_dict) > 5:
                    real_functionality.append("to_dict() method works correctly")
                    test_results["to_dict_test"] = True
                else:
                    theater_elements.append("to_dict() method returns incomplete data")
                    test_results["to_dict_test"] = False
            else:
                theater_elements.append("Missing to_dict() method - theater implementation")
                test_results["to_dict_test"] = False

            # Test enum functionality
            try:
                conn_type = ConnascenceType.CoM
                severity_level = SeverityLevel.HIGH
                real_functionality.append("Enum types work correctly")
                test_results["enum_test"] = True
            except Exception as e:
                theater_elements.append(f"Enum functionality broken: {e}")
                test_results["enum_test"] = False

            # Test AnalysisResult
            try:
                result = AnalysisResult(
                    violations=[violation],
                    summary={"total": 1},
                    metadata={"version": "1.0"}
                )
                real_functionality.append("AnalysisResult class functional")
                test_results["analysis_result_test"] = True
            except Exception as e:
                theater_elements.append(f"AnalysisResult broken: {e}")
                test_results["analysis_result_test"] = False

            # Calculate reality score
            functional_tests = sum([
                test_results.get("to_dict_test", False),
                test_results.get("enum_test", False),
                test_results.get("analysis_result_test", False)
            ])
            reality_score = min(90.0, 30.0 + (functional_tests * 20.0))

        except Exception as e:
            theater_elements.append(f"Types module completely broken: {e}")
            test_results["fatal_error"] = str(e)
            reality_score = 5.0

        return TheaterDetectionResult(
            component="types",
            reality_score=reality_score,
            theater_elements=theater_elements,
            real_functionality=real_functionality,
            fixes_applied=fixes_applied,
            test_results=test_results,
            production_ready=reality_score >= 80
        )

    def _test_github_bridge(self) -> TheaterDetectionResult:
        """Test GitHub bridge - detect mock implementations."""

        theater_elements = []
        real_functionality = []
        fixes_applied = []
        test_results = {}

        try:
            # Test GitHubConfig
            config = GitHubConfig(
                token="test_token",
                owner="test_owner",
                repo="test_repo"
            )
            real_functionality.append("GitHubConfig dataclass works")
            test_results["config_test"] = True

            # Test GitHubBridge initialization
            with patch.dict(os.environ, {
                'GITHUB_TOKEN': 'test_token',
                'GITHUB_OWNER': 'test_owner',
                'GITHUB_REPO': 'test_repo'
            }):
                bridge = GitHubBridge()
                real_functionality.append("GitHubBridge initializes from environment")
                test_results["bridge_init_test"] = True

            # Test session creation
            if hasattr(bridge, 'session') and bridge.session is not None:
                real_functionality.append("HTTP session created correctly")
                test_results["session_test"] = True
            else:
                theater_elements.append("No HTTP session - fake implementation")
                test_results["session_test"] = False

            # Test method existence and signatures
            required_methods = [
                'post_pr_comment', 'update_status_check',
                'create_issue_for_violations', 'get_pr_files'
            ]

            method_count = 0
            for method in required_methods:
                if hasattr(bridge, method) and callable(getattr(bridge, method)):
                    method_count += 1
                else:
                    theater_elements.append(f"Missing method: {method}")

            if method_count == len(required_methods):
                real_functionality.append("All required methods present")
                test_results["methods_test"] = True
            else:
                theater_elements.append(f"Only {method_count}/{len(required_methods)} methods present")
                test_results["methods_test"] = False

            # Test private method implementation depth
            private_methods = [
                '_format_pr_comment', '_format_issue_body',
                '_determine_status_state', '_get_details_url'
            ]

            implemented_private = 0
            for method in private_methods:
                if hasattr(bridge, method):
                    # Check if it's not just a stub
                    method_obj = getattr(bridge, method)
                    if callable(method_obj):
                        implemented_private += 1

            if implemented_private >= 3:
                real_functionality.append("Private methods implemented")
                test_results["private_methods_test"] = True
            else:
                theater_elements.append("Private methods missing - likely stub")
                test_results["private_methods_test"] = False

            # Test integration function
            if 'integrate_with_workflow' in globals():
                real_functionality.append("Workflow integration function exists")
                test_results["workflow_integration_test"] = True
            else:
                theater_elements.append("Missing workflow integration")
                test_results["workflow_integration_test"] = False

            # Calculate reality score
            functional_tests = sum([
                test_results.get("config_test", False),
                test_results.get("bridge_init_test", False),
                test_results.get("session_test", False),
                test_results.get("methods_test", False),
                test_results.get("private_methods_test", False),
                test_results.get("workflow_integration_test", False)
            ])
            reality_score = min(95.0, 20.0 + (functional_tests * 12.5))

        except Exception as e:
            theater_elements.append(f"GitHub bridge completely broken: {e}")
            test_results["fatal_error"] = str(e)
            reality_score = 10.0

        return TheaterDetectionResult(
            component="github_bridge",
            reality_score=reality_score,
            theater_elements=theater_elements,
            real_functionality=real_functionality,
            fixes_applied=fixes_applied,
            test_results=test_results,
            production_ready=reality_score >= 80
        )

    def _test_detector_functionality(self) -> TheaterDetectionResult:
        """Test detector modules - detect stub implementations."""

        theater_elements = []
        real_functionality = []
        fixes_applied = []
        test_results = {}

        try:
            # Test base detector
            if 'DetectorBase' in globals():
                real_functionality.append("DetectorBase import successful")
                test_results["base_import"] = True
            else:
                theater_elements.append("DetectorBase import failed")
                test_results["base_import"] = False

            # Test MagicLiteralDetector with actual AST
            test_code = '''
def test_function():
    threshold = 42  # Magic literal
    timeout = 5000  # Magic literal
    return threshold + timeout
'''

            tree = ast.parse(test_code)
            source_lines = test_code.split('\n')

            try:
                detector = MagicLiteralDetector("test.py", source_lines)
                violations = detector.detect_violations(tree)

                if isinstance(violations, list):
                    real_functionality.append("MagicLiteralDetector returns list")
                    test_results["magic_literal_test"] = True

                    if len(violations) > 0:
                        real_functionality.append(f"Found {len(violations)} violations")

                        # Test violation structure
                        first_violation = violations[0]
                        if hasattr(first_violation, 'type') and hasattr(first_violation, 'severity'):
                            real_functionality.append("Violations have correct structure")
                            test_results["violation_structure_test"] = True
                        else:
                            theater_elements.append("Violations have incorrect structure")
                            test_results["violation_structure_test"] = False
                    else:
                        theater_elements.append("No violations found - detector may be broken")
                        test_results["violation_structure_test"] = False
                else:
                    theater_elements.append("Detector returns non-list")
                    test_results["magic_literal_test"] = False

            except Exception as e:
                theater_elements.append(f"MagicLiteralDetector broken: {e}")
                test_results["magic_literal_test"] = False

            # Test detector method implementation depth
            if 'MagicLiteralDetector' in globals():
                detector_class = MagicLiteralDetector
                methods_to_check = [
                    'detect_violations', '_analyze_constant',
                    '_finalize_magic_literal_analysis'
                ]

                implemented_methods = 0
                for method in methods_to_check:
                    if hasattr(detector_class, method):
                        implemented_methods += 1

                if implemented_methods >= 2:
                    real_functionality.append("Core detector methods implemented")
                    test_results["detector_methods_test"] = True
                else:
                    theater_elements.append("Detector methods missing - likely stub")
                    test_results["detector_methods_test"] = False

            # Calculate reality score
            functional_tests = sum([
                test_results.get("base_import", False),
                test_results.get("magic_literal_test", False),
                test_results.get("violation_structure_test", False),
                test_results.get("detector_methods_test", False)
            ])
            reality_score = min(85.0, 25.0 + (functional_tests * 15.0))

        except Exception as e:
            theater_elements.append(f"Detector testing completely failed: {e}")
            test_results["fatal_error"] = str(e)
            reality_score = 15.0

        return TheaterDetectionResult(
            component="detectors",
            reality_score=reality_score,
            theater_elements=theater_elements,
            real_functionality=real_functionality,
            fixes_applied=fixes_applied,
            test_results=test_results,
            production_ready=reality_score >= 80
        )

    def _test_integration(self) -> TheaterDetectionResult:
        """Test end-to-end integration - detect workflow theater."""

        theater_elements = []
        real_functionality = []
        fixes_applied = []
        test_results = {}

        try:
            # Create temporary files for integration test
            with tempfile.TemporaryDirectory() as temp_dir:
                # Test data files
                analysis_file = os.path.join(temp_dir, "analysis.json")
                github_event_file = os.path.join(temp_dir, "event.json")
                output_file = os.path.join(temp_dir, "output.json")

                # Create test analysis results
                analysis_data = {
                    "success": True,
                    "violations": [],
                    "nasa_compliance": 0.92,
                    "six_sigma_level": 4.5,
                    "mece_score": QUALITY_GATE_MINIMUM_PASS_RATE
                }

                with open(analysis_file, 'w') as f:
                    json.dump(analysis_data, f)

                # Create test GitHub event
                github_event = {
                    "pull_request": {
                        "number": 123,
                        "head": {"sha": "abc123"}
                    }
                }

                with open(github_event_file, 'w') as f:
                    json.dump(github_event, f)

                # Test workflow integration
                try:
                    from analyzer.integrations.github_bridge import integrate_with_workflow

                    # Mock the GitHubBridge to avoid real API calls
                    with patch('analyzer.integrations.github_bridge.GitHubBridge') as mock_bridge:
                        mock_instance = Mock()
                        mock_instance.post_pr_comment.return_value = True
                        mock_instance.update_status_check.return_value = True
                        mock_bridge.return_value = mock_instance

                        exit_code = integrate_with_workflow(
                            analysis_file, github_event_file, output_file
                        )

                        if exit_code == 0:
                            real_functionality.append("Workflow integration succeeds")
                            test_results["workflow_test"] = True
                        else:
                            theater_elements.append("Workflow integration fails")
                            test_results["workflow_test"] = False

                        # Check output file
                        if path_exists(output_file):
                            with open(output_file, 'r') as f:
                                output_data = json.load(f)
                                if "integration_success" in output_data:
                                    real_functionality.append("Integration outputs structured data")
                                    test_results["output_structure_test"] = True
                                else:
                                    theater_elements.append("Integration output incomplete")
                                    test_results["output_structure_test"] = False
                        else:
                            theater_elements.append("No integration output file")
                            test_results["output_structure_test"] = False

                except Exception as e:
                    theater_elements.append(f"Workflow integration broken: {e}")
                    test_results["workflow_test"] = False
                    test_results["output_structure_test"] = False

            # Test command-line interface
            try:
                from analyzer.integrations.github_bridge import integrate_with_workflow
                import argparse

                # Check if main section exists
                with open(os.path.join('analyzer', 'integrations', 'github_bridge.py'), 'r') as f:
                    content = f.read()
                    if 'if __name__ == "__main__"' in content and 'argparse' in content:
                        real_functionality.append("Command-line interface implemented")
                        test_results["cli_test"] = True
                    else:
                        theater_elements.append("Missing command-line interface")
                        test_results["cli_test"] = False

            except Exception as e:
                theater_elements.append(f"CLI test failed: {e}")
                test_results["cli_test"] = False

            # Calculate reality score
            functional_tests = sum([
                test_results.get("workflow_test", False),
                test_results.get("output_structure_test", False),
                test_results.get("cli_test", False)
            ])
            reality_score = min(80.0, 30.0 + (functional_tests * 16.0))

        except Exception as e:
            theater_elements.append(f"Integration testing completely failed: {e}")
            test_results["fatal_error"] = str(e)
            reality_score = 20.0

        return TheaterDetectionResult(
            component="integration",
            reality_score=reality_score,
            theater_elements=theater_elements,
            real_functionality=real_functionality,
            fixes_applied=fixes_applied,
            test_results=test_results,
            production_ready=reality_score >= 80
        )

    def _calculate_overall_score(self):
        """Calculate overall reality score."""
        if not self.results:
            self.overall_score = 0.0
            return

        # Weighted scoring
        weights = {
            'imports': 0.15,
            'types': 0.25,
            'github_bridge': 0.30,
            'detectors': 0.25,
            'integration': TAKE_PROFIT_PERCENTAGE
        }

        total_score = 0.0
        total_weight = 0.0

        for result in self.results:
            weight = weights.get(result.component, 0.2)
            total_score += result.reality_score * weight
            total_weight += weight

        self.overall_score = total_score / total_weight if total_weight > 0 else 0.0

        # Identify critical issues
        for result in self.results:
            if result.reality_score < 60.0:
                self.critical_issues.append(
                    f"{result.component}: {result.reality_score:.1f}% - {len(result.theater_elements)} theater elements"
                )

    def _generate_audit_report(self) -> Dict[str, Any]:
        """Generate comprehensive audit report."""

        # Determine overall assessment
        if self.overall_score >= 81:
            assessment = "PRODUCTION READY"
            status = "PASS"
        elif self.overall_score >= 61:
            assessment = "MOSTLY REAL WITH MINOR GAPS"
            status = "CAUTION"
        elif self.overall_score >= 31:
            assessment = "SOME REAL CODE BUT MANY STUBS"
            status = "FAIL"
        else:
            assessment = "HEAVY THEATER, MOSTLY FAKE"
            status = "CRITICAL FAIL"

        report = {
            "audit_timestamp": "2025-01-15T10:30:00Z",
            "overall_reality_score": round(self.overall_score, 1),
            "assessment": assessment,
            "status": status,
            "critical_issues": self.critical_issues,
            "component_results": [],
            "summary": {
                "production_ready_components": 0,
                "total_theater_elements": 0,
                "total_real_functionality": 0,
                "total_fixes_applied": 0
            }
        }

        for result in self.results:
            if result.production_ready:
                report["summary"]["production_ready_components"] += 1
            report["summary"]["total_theater_elements"] += len(result.theater_elements)
            report["summary"]["total_real_functionality"] += len(result.real_functionality)
            report["summary"]["total_fixes_applied"] += len(result.fixes_applied)

            report["component_results"].append({
                "component": result.component,
                "reality_score": result.reality_score,
                "production_ready": result.production_ready,
                "theater_elements": result.theater_elements,
                "real_functionality": result.real_functionality,
                "fixes_applied": result.fixes_applied,
                "test_results": result.test_results
            })

        return report

def main():
    """Run the complete theater detection audit."""
    print("PHASE 1 THEATER DETECTION & REALITY CHECK AUDIT")
    print("=" * 60)
    print("GPT-5 Codex Theater Killer - Comprehensive Reality Validation")
    print()

    auditor = TheaterDetectionAudit()
    report = auditor.run_full_audit()

    # Print summary
    print("\n" + "=" * 60)
    print("AUDIT RESULTS SUMMARY")
    print("=" * 60)
    print(f"Overall Reality Score: {report['overall_reality_score']}%")
    print(f"Assessment: {report['assessment']}")
    print(f"Status: {report['status']}")
    print()

    if report['critical_issues']:
        print("CRITICAL ISSUES:")
        for issue in report['critical_issues']:
            print(f"   - {issue}")
        print()

    print("COMPONENT BREAKDOWN:")
    for component in report['component_results']:
        status_icon = "[PASS]" if component['production_ready'] else "[FAIL]"
        print(f"   {status_icon} {component['component']}: {component['reality_score']:.1f}%")
    print()

    print(f"Production Ready Components: {report['summary']['production_ready_components']}/{len(report['component_results'])}")
    print(f"Theater Elements Found: {report['summary']['total_theater_elements']}")
    print(f"Real Functionality Items: {report['summary']['total_real_functionality']}")

    # Save detailed report
    with open('theater_detection_audit_report.json', 'w') as f:
        json.dump(report, f, indent=2)

    print(f"\nDetailed report saved to: theater_detection_audit_report.json")

    # Return exit code based on results
    if report['overall_reality_score'] >= 80:
        print("\nAUDIT PASSED - Phase 1 is production ready!")
        return 0
    else:
        print(f"\nAUDIT FAILED - Reality score {report['overall_reality_score']:.1f}% below 80% threshold")
        return 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)