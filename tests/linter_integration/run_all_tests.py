from src.constants.base import MAXIMUM_FUNCTION_LENGTH_LINES, MINIMUM_TEST_COVERAGE_PERCENTAGE

import pytest
import sys
import time
import json
from pathlib import Path
from typing import Dict, List, Any
import subprocess
import argparse

class LinterIntegrationTestRunner:
    """Comprehensive test runner for linter integration system"""
    
    def __init__(self):
        self.test_directory = Path(__file__).parent
        self.results = {}
        self.start_time = None
        self.total_duration = 0
        
    def run_test_suite(self, test_categories: List[str] = None, verbose: bool = True) -> Dict[str, Any]:
        """Run comprehensive test suite with categorization"""
        self.start_time = time.time()
        
        if test_categories is None:
            test_categories = [
                "unit", "integration", "performance", "stress", 
                "failure_modes", "real_linters"
            ]
        
        test_suites = {
            "mesh_coordination": {
                "file": "test_mesh_coordination.py",
                "categories": ["unit", "integration"],
                "description": "Mesh topology and peer-to-peer coordination tests"
            },
            "api_endpoints": {
                "file": "test_api_endpoints.py", 
                "categories": ["integration", "performance"],
                "description": "REST, WebSocket, and GraphQL API endpoint tests"
            },
            "tool_management": {
                "file": "test_tool_management.py",
                "categories": ["unit", "integration"],
                "description": "Tool lifecycle management and resource allocation tests"
            },
            "adapter_patterns": {
                "file": "test_adapter_patterns.py",
                "categories": ["unit", "integration"],
                "description": "Linter adapter pattern and output parsing tests"
            },
            "severity_mapping": {
                "file": "test_severity_mapping.py",
                "categories": ["unit", "integration"],
                "description": "Severity normalization and cross-tool mapping tests"
            },
            "real_time_processing": {
                "file": "test_real_time_processing.py",
                "categories": ["integration", "performance"],
                "description": "Real-time processing and correlation framework tests"
            },
            "full_pipeline": {
                "file": "test_full_pipeline.py",
                "categories": ["integration", "performance"],
                "description": "End-to-end pipeline integration tests"
            },
            "performance_scalability": {
                "file": "test_performance_scalability.py",
                "categories": ["performance", "stress"],
                "description": "Performance benchmarking and scalability tests"
            },
            "failure_modes": {
                "file": "test_failure_modes.py",
                "categories": ["failure_modes", "stress"],
                "description": "Failure scenarios and fault tolerance tests"
            },
            "real_linter_validation": {
                "file": "test_real_linter_validation.py",
                "categories": ["real_linters", "integration"],
                "description": "Real linter tool integration validation tests"
            }
        }
        
        print("=" * 80)
        print("-" * 80)
        
        # Run test suites
        for suite_name, suite_config in test_suites.items():
            # Check if this suite matches requested categories
            if not any(cat in suite_config["categories"] for cat in test_categories):
                continue
                
            print(f"\n? Running {suite_name}...")
            print(f"   ? {suite_config['description']}")
            
            suite_start = time.time()
            result = self._run_test_file(suite_config["file"], verbose)
            suite_duration = time.time() - suite_start
            
            self.results[suite_name] = {
                **result,
                "duration": suite_duration,
                "categories": suite_config["categories"],
                "description": suite_config["description"]
            }
            
            # Print immediate results
            if result["passed"]:
                pass
            else:
                print(f"   [FAIL] {result['failures']} failures, {result['errors']} errors")
                if result["error_summary"]:
                    print(f"   [BULB] {result['error_summary']}")
        
        self.total_duration = time.time() - self.start_time
        
        # Generate final report
        return self._generate_final_report()
    
    def _run_test_file(self, test_file: str, verbose: bool = True) -> Dict[str, Any]:
        """Run a specific test file and parse results"""
        test_path = self.test_directory / test_file
        
        # Build pytest command
        cmd = [
            sys.executable, "-m", "pytest",
            str(test_path),
            "-v" if verbose else "-q",
            "--tb=short",
            "--durations=10",
            "--json-report",
            "--json-report-file=/tmp/pytest_report.json"
        ]
        
        try:
            # Run pytest
            result = subprocess.run(
                cmd, 
                capture_output=True, 
                text=True,
                cwd=self.test_directory
            )
            
            # Parse pytest output
            return self._parse_pytest_output(result)
            
        except Exception as e:
            return {
                "passed": False,
                "tests_run": 0,
                "failures": 1,
                "errors": 0,
                "error_summary": f"Failed to run test: {str(e)}",
                "output": ""
            }
    
    def _parse_pytest_output(self, result: subprocess.CompletedProcess) -> Dict[str, Any]:
        """Parse pytest output and extract results"""
        output = result.stdout + result.stderr
        
        # Try to parse JSON report if available
        try:
            with open("/tmp/pytest_report.json", "r") as f:
                json_report = json.load(f)
                
            return {
                "passed": json_report["summary"]["failed"] == 0 and json_report["summary"]["error"] == 0,
                "tests_run": json_report["summary"]["total"],
                "failures": json_report["summary"]["failed"],
                "errors": json_report["summary"]["error"],
                "skipped": json_report["summary"]["skipped"],
                "duration": json_report["duration"],
                "error_summary": self._extract_error_summary(json_report),
                "output": output[:1000]  # Truncate long output
            }
        except (FileNotFoundError, json.JSONDecodeError, KeyError):
            # Fallback to parsing text output
            return self._parse_text_output(result, output)
    
    def _parse_text_output(self, result: subprocess.CompletedProcess, output: str) -> Dict[str, Any]:
        """Parse pytest text output as fallback"""
        lines = output.split('\n')
        
        # Look for summary line
        summary_line = None
        for line in lines:
            if "failed" in line and "passed" in line:
                summary_line = line
                break
            elif line.startswith("=") and ("passed" in line or "failed" in line):
                summary_line = line
                break
        
        if summary_line:
            # Extract numbers from summary
            import re
            numbers = re.findall(r'(\d+)', summary_line)
            
            if "failed" in summary_line:
                return {
                    "passed": False,
                    "tests_run": int(numbers[0]) if numbers else 0,
                    "failures": int(numbers[1]) if len(numbers) > 1 else 0,
                    "errors": 0,
                    "error_summary": "See output for details",
                    "output": output[:1000]
                }
            else:
                return {
                    "passed": True,
                    "tests_run": int(numbers[0]) if numbers else 0,
                    "failures": 0,
                    "errors": 0,
                    "error_summary": "",
                    "output": output[:1000]
                }
        
        # Default fallback
        return {
            "passed": result.returncode == 0,
            "tests_run": output.count("PASSED") + output.count("FAILED"),
            "failures": output.count("FAILED"),
            "errors": output.count("ERROR"),
            "error_summary": "Unable to parse detailed results",
            "output": output[:1000]
        }
    
    def _extract_error_summary(self, json_report: Dict) -> str:
        """Extract error summary from JSON report"""
        if not json_report.get("tests"):
            return ""
        
        failed_tests = [
            test for test in json_report["tests"] 
            if test["outcome"] in ["failed", "error"]
        ]
        
        if failed_tests:
            return f"Failed: {', '.join(test['nodeid'].split('::')[-1] for test in failed_tests[:3])}"
        
        return ""
    
    def _generate_final_report(self) -> Dict[str, Any]:
        """Generate comprehensive final report"""
        total_tests = sum(result["tests_run"] for result in self.results.values())
        total_failures = sum(result["failures"] for result in self.results.values())
        total_errors = sum(result["errors"] for result in self.results.values())
        total_passed = total_tests - total_failures - total_errors
        
        success_rate = (total_passed / total_tests * MAXIMUM_FUNCTION_LENGTH_LINES) if total_tests > 0 else 0
        
        # Generate report
        report = {
            "overall_success": total_failures == 0 and total_errors == 0,
            "total_tests": total_tests,
            "total_passed": total_passed,
            "total_failures": total_failures,
            "total_errors": total_errors,
            "success_rate": success_rate,
            "total_duration": self.total_duration,
            "suite_results": self.results,
            "coverage_analysis": self._analyze_coverage(),
            "recommendations": self._generate_recommendations()
        }
        
        # Print final report
        self._print_final_report(report)
        
        return report
    
    def _analyze_coverage(self) -> Dict[str, Any]:
        """Analyze test coverage across components"""
        components = {
            "mesh_coordination": ["mesh_coordination"],
            "api_server": ["api_endpoints"],
            "tool_management": ["tool_management"],
            "adapters": ["adapter_patterns"],
            "severity_mapping": ["severity_mapping"],
            "real_time_processing": ["real_time_processing"],
            "pipeline_integration": ["full_pipeline"],
            "performance": ["performance_scalability"],
            "failure_tolerance": ["failure_modes"],
            "real_world_validation": ["real_linter_validation"]
        }
        
        coverage = {}
        for component, suites in components.items():
            covered_suites = [suite for suite in suites if suite in self.results]
            total_tests = sum(self.results[suite]["tests_run"] for suite in covered_suites)
            passed_tests = sum(self.results[suite]["tests_run"] - self.results[suite]["failures"] - self.results[suite]["errors"] for suite in covered_suites)
            
            coverage[component] = {
                "covered": len(covered_suites) > 0,
                "test_count": total_tests,
                "success_rate": (passed_tests / total_tests * MAXIMUM_FUNCTION_LENGTH_LINES) if total_tests > 0 else 0
            }
        
        return coverage
    
    def _generate_recommendations(self) -> List[str]:
        """Generate recommendations based on test results"""
        recommendations = []
        
        # Check for failures
        failed_suites = [name for name, result in self.results.items() if not result["passed"]]
        if failed_suites:
            recommendations.append(f"Address failures in: {', '.join(failed_suites)}")
        
        # Check performance
        slow_suites = [name for name, result in self.results.items() if result.get("duration", 0) > 60]
        if slow_suites:
            recommendations.append(f"Optimize performance for: {', '.join(slow_suites)}")
        
        # Check coverage
        coverage = self._analyze_coverage()
        uncovered = [comp for comp, data in coverage.items() if not data["covered"]]
        if uncovered:
            recommendations.append(f"Add test coverage for: {', '.join(uncovered)}")
        
        if not recommendations:
            recommendations.append("All tests passing! Consider adding more edge case tests.")
        
        return recommendations
    
    def _print_final_report(self, report: Dict[str, Any]):
        """Print comprehensive final report"""
        print("\n" + "=" * 80)
        print("=" * 80)
        
        # Overall status
        status = "[OK] PASSED" if report["overall_success"] else "[FAIL] FAILED"
        print(f"Overall Status: {status}")
        print(f"Success Rate: {report['success_rate']:.1f}%")
        print(f"Total Duration: {report['total_duration']:.2f}s")
        print()
        
        # Test summary
        print(f"   Passed: {report['total_passed']}")
        print(f"   Failed: {report['total_failures']}")
        print(f"   Errors: {report['total_errors']}")
        print()
        
        # Suite results
        print("[CLIPBOARD] SUITE RESULTS:")
        for suite_name, result in report["suite_results"].items():
            status_icon = "[OK]" if result["passed"] else "[FAIL]"
            if not result["passed"] and result.get("error_summary"):
                print(f"      [BULB] {result['error_summary']}")
        print()
        
        # Coverage analysis
        print("[TARGET] COVERAGE ANALYSIS:")
        for component, data in report["coverage_analysis"].items():
            status_icon = "[OK]" if data["covered"] else "[FAIL]"
        print()
        
        # Recommendations
        print("[BULB] RECOMMENDATIONS:")
        for i, rec in enumerate(report["recommendations"], 1):
            print(f"   {i}. {rec}")
        
        print("\n" + "=" * 80)

def main():
    """Main entry point for test runner"""
    parser = argparse.ArgumentParser(description="Run Phase 2 Linter Integration Test Suite")
    parser.add_argument(
        "--categories", 
        nargs="+", 
        choices=["unit", "integration", "performance", "stress", "failure_modes", "real_linters"],
        default=["unit", "integration"],
        help="Test categories to run"
    )
    parser.add_argument("--verbose", "-v", action="store_true", help="Verbose output")
    parser.add_argument("--quick", "-q", action="store_true", help="Quick run (unit + integration only)")
    parser.add_argument("--full", "-f", action="store_true", help="Full test suite including performance and stress tests")
    
    args = parser.parse_args()
    
    # Determine test categories
    if args.quick:
        categories = ["unit", "integration"]
    elif args.full:
        categories = ["unit", "integration", "performance", "stress", "failure_modes", "real_linters"]
    else:
        categories = args.categories
    
    # Run tests
    runner = LinterIntegrationTestRunner()
    
    try:
        report = runner.run_test_suite(categories, args.verbose)
        
        # Save report
        report_file = Path(__file__).parent / "test_report.json"
        with open(report_file, "w") as f:
            json.dump(report, f, indent=2)
        
        print(f"\n? Full report saved to: {report_file}")
        
        # Exit with appropriate code
        sys.exit(0 if report["overall_success"] else 1)
        
    except KeyboardInterrupt:
        sys.exit(130)
    except Exception as e:
        sys.exit(1)

if __name__ == "__main__":
    main()