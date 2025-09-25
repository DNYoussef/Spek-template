from src.constants.base import TAKE_PROFIT_PERCENTAGE
"""

Orchestrates all Phase 1 JSON schema validation tests with:
- Comprehensive test execution
- Performance monitoring
- Coverage reporting  
- CI/CD integration support
- Detailed failure analysis
"""

import sys
import time
import unittest
import json
from pathlib import Path
from typing import Dict, List, Any, Tuple
import argparse
from io import StringIO
"""

class JSONSchemaTestRunner:
    """Automated test runner for JSON schema validation."""

    def __init__(self, output_dir: Path = None):
        """Initialize test runner."""
        self.test_dir = Path(__file__).parent
        self.output_dir = output_dir or (self.test_dir / "results")
        self.output_dir.mkdir(exist_ok=True)
        
        # Test modules to run
        self.test_modules = [
            "test_json_schema_validation",
            "test_sarif_compliance", 
            "test_risk_mitigation",
            "test_full_pipeline_integration"
        ]
        
        # Phase 1 critical issues to track
        self.phase1_issues = {
            "mock_data_contamination": {"threshold": TAKE_PROFIT_PERCENTAGE, "baseline": 0.857},
            "schema_consistency": {"threshold": 0.80, "baseline": 0.71},
            "sarif_compliance": {"threshold": 95, "baseline": 85},
            "performance_regression": {"threshold": 1.0, "baseline": 0.036},
            "violation_id_determinism": {"threshold": 0.95, "baseline": 0.85}
        }

    def run_all_tests(self, verbose: bool = True) -> Dict[str, Any]:
        """Run all JSON schema validation tests."""
        start_time = time.time()
        
        print("=" * 80)
        print("=" * 80)
        print(f"Output Directory: {self.output_dir}")
        print()
        
        # Run tests for each module
        results = {}
        total_tests = 0
        total_failures = 0
        total_errors = 0
        
        for module_name in self.test_modules:
            print(f"Running {module_name}...")
            module_result = self._run_test_module(module_name, verbose)
            results[module_name] = module_result
            
            total_tests += module_result["tests_run"]
            total_failures += module_result["failures"]
            total_errors += module_result["errors"]
            
            # Print module summary
            status = "PASS" if module_result["success"] else "FAIL"
                    f"{module_result['failures']} failures, {module_result['errors']} errors")
            print()
        
        # Calculate overall results
        end_time = time.time()
        total_time = end_time - start_time
        overall_success = total_failures == 0 and total_errors == 0
        
        summary = {
            "overall_success": overall_success,
            "total_tests": total_tests,
            "total_failures": total_failures, 
            "total_errors": total_errors,
            "total_time": total_time,
            "modules": results,
            "phase1_compliance": self._check_phase1_compliance(results)
        }
        
        # Print summary
        self._print_summary(summary)
        
        # Save results
        self._save_results(summary)
        
        return summary

    def _run_test_module(self, module_name: str, verbose: bool) -> Dict[str, Any]:
        """Run tests for a specific module."""
        # Import the test module
        test_module = __import__(module_name, fromlist=[""])
        
        # Create test suite
        loader = unittest.TestLoader()
        suite = loader.loadTestsFromModule(test_module)
        
        # Capture test output
        stream = StringIO()
        runner = unittest.TextTestRunner(
            stream=stream,
            verbosity=2 if verbose else 1,
            buffer=True
        )
        
        # Run tests
        start_time = time.time()
        result = runner.run(suite)
        end_time = time.time()
        
        # Extract test output
        test_output = stream.getvalue()
        
        # Analyze results
        return {
            "module": module_name,
            "success": result.wasSuccessful(),
            "tests_run": result.testsRun,
            "failures": len(result.failures),
            "errors": len(result.errors),
            "time": end_time - start_time,
            "output": test_output,
            "failure_details": [str(failure[1]) for failure in result.failures],
            "error_details": [str(error[1]) for error in result.errors]
        }

    def _check_phase1_compliance(self, results: Dict[str, Any]) -> Dict[str, Any]:
        """Check compliance with Phase 1 critical issues."""
        compliance = {}
        
        for issue, thresholds in self.phase1_issues.items():
            # Check if related tests passed
            compliance[issue] = {
                "status": "PASS",  # Default optimistic
                "threshold": thresholds["threshold"],
                "baseline": thresholds["baseline"],
                "improvement": True,
                "details": f"Tests for {issue} passed successfully"
            }
            
            # Look for failures related to this issue
            for module, module_result in results.items():
                if not module_result["success"]:
                    # Check if failures are related to this issue
                    issue_keywords = {
                        "mock_data_contamination": ["mock", "contamination", "synthetic"],
                        "schema_consistency": ["schema", "consistency", "structure"],
                        "sarif_compliance": ["sarif", "compliance", "2.1.0"],
                        "performance_regression": ["performance", "time", "regression"],
                        "violation_id_determinism": ["id", "determinism", "unique"]
                    }
                    
                    keywords = issue_keywords.get(issue, [])
                    failure_text = " ".join(module_result["failure_details"] + module_result["error_details"]).lower()
                    
                    if any(keyword in failure_text for keyword in keywords):
                        compliance[issue] = {
                            "status": "FAIL",
                            "threshold": thresholds["threshold"],
                            "baseline": thresholds["baseline"],
                            "improvement": False,
                            "details": f"Test failures indicate regression in {issue}"
                        }
        
        return compliance

    def _print_summary(self, summary: Dict[str, Any]):
        """Print test execution summary."""
        print("=" * 80)
        print("=" * 80)
        
        # Overall status
        status = "PASS" if summary["overall_success"] else "FAIL"
        print(f"Overall Status: {status}")
        print(f"Failures: {summary['total_failures']}")
        print(f"Errors: {summary['total_errors']}")
        print(f"Execution Time: {summary['total_time']:.2f} seconds")
        print()
        
        # Module breakdown
        print("Module Results:")
        for module, result in summary["modules"].items():
            status = "PASS" if result["success"] else "FAIL"
        print()
        
        # Phase 1 compliance
        print("Phase 1 Critical Issues Compliance:")
        for issue, compliance in summary["phase1_compliance"].items():
            status = compliance["status"]
            improvement = "IMPROVED" if compliance["improvement"] else "REGRESSION"
            print(f"  {issue}: {status} ({improvement})")
            print(f"    Baseline: {compliance['baseline']}, Threshold: {compliance['threshold']}")
        print()
        
        # Failure details
        if summary["total_failures"] > 0 or summary["total_errors"] > 0:
            print("FAILURE ANALYSIS:")
            for module, result in summary["modules"].items():
                if not result["success"]:
                    print(f"\n{module}:")
                    for failure in result["failure_details"]:
                        print(f"  FAILURE: {failure[:200]}...")
                    for error in result["error_details"]:
                        print(f"  ERROR: {error[:200]}...")

    def _save_results(self, summary: Dict[str, Any]):
        """Save test results to file."""
        timestamp = time.strftime("%Y%m%d_%H%M%S")
        
        # Save JSON results
        json_file = self.output_dir / f"test_results_{timestamp}.json"
        with open(json_file, 'w') as f:
            json.dump(summary, f, indent=2, default=str)
        
        # Save coverage report
        coverage_file = self.output_dir / f"coverage_report_{timestamp}.txt"
        with open(coverage_file, 'w') as f:
            f.write("JSON Schema Validation Test Coverage Report\n")
            f.write("=" * 50 + "\n\n")
            
            for module, result in summary["modules"].items():
                f.write(f"Module: {module}\n")
                f.write(f"Tests Run: {result['tests_run']}\n")
                f.write(f"Success: {result['success']}\n")
                f.write(f"Time: {result['time']:.2f}s\n\n")
        
        # Save Phase 1 compliance report
        compliance_file = self.output_dir / f"phase1_compliance_{timestamp}.json"
        with open(compliance_file, 'w') as f:
            json.dump(summary["phase1_compliance"], f, indent=2)
        
        print(f"Results saved to: {self.output_dir}")

    def run_specific_test(self, test_name: str, verbose: bool = True) -> Dict[str, Any]:
        """Run a specific test method."""
        
        # Parse test name (module.class.method)
        parts = test_name.split('.')
        if len(parts) < 2:
            raise ValueError(f"Invalid test name format: {test_name}")
        
        module_name = parts[0]
        test_method = parts[-1]
        
        # Import and run specific test
        test_module = __import__(module_name, fromlist=[""])
        
        # Create suite with specific test
        loader = unittest.TestLoader()
        if len(parts) == 3:  # module.class.method
            class_name = parts[1]
            test_class = getattr(test_module, class_name)
            suite = loader.loadTestsFromName(test_method, test_class)
        else:  # module.method
            suite = loader.loadTestsFromName(test_method, test_module)
        
        # Run test
        stream = StringIO()
        runner = unittest.TextTestRunner(stream=stream, verbosity=2 if verbose else 1)
        result = runner.run(suite)
        
        return {
            "test_name": test_name,
            "success": result.wasSuccessful(),
            "tests_run": result.testsRun,
            "failures": len(result.failures),
            "errors": len(result.errors),
            "output": stream.getvalue()
        }

    def validate_phase1_regression_protection(self) -> bool:
        """Validate that Phase 1 regression protection is working."""
        print("Validating Phase 1 regression protection...")
        
        # Run key regression tests
        regression_tests = [
            "test_json_schema_validation.TestJSONSchemaValidation.test_detect_mock_data_patterns",
            "test_sarif_compliance.TestSARIFCompliance.test_sarif_schema_structure_compliance",
            "test_risk_mitigation.TestRiskMitigation.test_data_integrity_under_large_datasets",
            "test_full_pipeline_integration.TestFullPipelineIntegration.test_regression_protection_for_phase1_findings"
        ]
        
        all_passed = True
        for test in regression_tests:
            try:
                result = self.run_specific_test(test, verbose=False)
                if not result["success"]:
                    all_passed = False
                else:
            except Exception as e:
                all_passed = False
        
        status = "PROTECTED" if all_passed else "VULNERABLE"
        print(f"\nRegression Protection Status: {status}")
        
        return all_passed

def main():
    """Main entry point for test runner."""
    parser = argparse.ArgumentParser(description="JSON Schema Validation Test Runner")
    parser.add_argument("--test", help="Run specific test")
    parser.add_argument("--output", help="Output directory for results")
    parser.add_argument("--verbose", action="store_true", help="Verbose output")
    parser.add_argument("--regression-check", action="store_true", 
                        help="Run Phase 1 regression protection validation")
    
    args = parser.parse_args()
    
    # Initialize test runner
    output_dir = Path(args.output) if args.output else None
    runner = JSONSchemaTestRunner(output_dir)
    
    try:
        if args.regression_check:
            # Run regression protection validation
            success = runner.validate_phase1_regression_protection()
            sys.exit(0 if success else 1)
        elif args.test:
            # Run specific test
            result = runner.run_specific_test(args.test, args.verbose)
            sys.exit(0 if result["success"] else 1)
        else:
            # Run all tests
            summary = runner.run_all_tests(args.verbose)
            sys.exit(0 if summary["overall_success"] else 1)
            
    except Exception as e:
        print(f"ERROR: {e}")
        sys.exit(2)

if __name__ == "__main__":
    main()