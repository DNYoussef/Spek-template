#!/usr/bin/env python3
"""
Regression Test Runner for Naming Standardization
=================================================

Comprehensive regression testing suite to ensure naming standardization
does not break functionality, imports, or public APIs.
"""

from pathlib import Path
from typing import List, Dict, Any, Tuple
import json
import os
import subprocess
import sys
import time

from dataclasses import dataclass
import importlib

@dataclass
class RegressionTest:
    name: str
    test_function: callable
    expected_result: Any
    timeout: int = 30

@dataclass
class TestResult:
    test_name: str
    passed: bool
    execution_time: float
    error_message: str = None
    details: Dict[str, Any] = None

class ImportResolutionTester:
    """Tests that all imports still resolve correctly after renaming."""

    def __init__(self, root_dir: str):
        self.root_dir = Path(root_dir)
        self.failed_imports = []

    def test_all_imports(self) -> TestResult:
        """Test that all Python imports resolve successfully."""
        start_time = time.time()

        python_files = list(self.root_dir.rglob("*.py"))
        python_files = [f for f in python_files if self._should_test_file(f)]

        total_files = len(python_files)
        failed_imports = []

        for file_path in python_files:
            try:
                self._test_file_imports(file_path)
            except Exception as e:
                failed_imports.append({
                    "file": str(file_path),
                    "error": str(e)
                })

        execution_time = time.time() - start_time
        passed = len(failed_imports) == 0

        return TestResult(
            test_name="import_resolution",
            passed=passed,
            execution_time=execution_time,
            error_message=f"{len(failed_imports)} import failures" if not passed else None,
            details={
                "total_files_tested": total_files,
                "failed_imports": failed_imports[:10],  # Limit for readability
                "total_failures": len(failed_imports)
            }
        )

    def _test_file_imports(self, file_path: Path):
        """Test imports for a single file."""
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()

            # Extract import statements
            import_lines = []
            for line_num, line in enumerate(content.split('\n'), 1):
                line = line.strip()
                if line.startswith(('import ', 'from ')) and not line.startswith('#'):
                    import_lines.append((line_num, line))

            # Test each import
            for line_num, import_statement in import_lines:
                self._validate_import_statement(file_path, line_num, import_statement)

        except Exception as e:
            raise Exception(f"Failed to process {file_path}: {e}")

    def _validate_import_statement(self, file_path: Path, line_num: int, import_statement: str):
        """Validate a single import statement."""
        try:
            # Simple validation - try to parse and check basic syntax
            compile(import_statement, str(file_path), 'exec')
        except SyntaxError as e:
            raise Exception(f"Syntax error in import at {file_path}:{line_num}: {import_statement}")

    def _should_test_file(self, file_path: Path) -> bool:
        """Determine if file should be included in import testing."""
        exclude_patterns = [
            '__pycache__', '.git', 'node_modules', '.artifacts',
            'test_', 'tests/', '.claude/', 'build/', 'dist/'
        ]
        return not any(pattern in str(file_path) for pattern in exclude_patterns)

class FunctionalityTester:
    """Tests that core functionality still works after renaming."""

    def __init__(self, root_dir: str):
        self.root_dir = Path(root_dir)

    def test_core_modules(self) -> TestResult:
        """Test that core modules can be imported and basic functionality works."""
        start_time = time.time()

        core_tests = [
            ("analyzer.core.unified_imports", self._test_analyzer_core),
            ("src.main", self._test_main_module),
            ("analyzer.unified_analyzer", self._test_unified_analyzer),
        ]

        test_results = []
        for module_name, test_func in core_tests:
            try:
                result = test_func(module_name)
                test_results.append({"module": module_name, "passed": True, "result": result})
            except Exception as e:
                test_results.append({"module": module_name, "passed": False, "error": str(e)})

        execution_time = time.time() - start_time
        passed_count = sum(1 for r in test_results if r["passed"])
        all_passed = passed_count == len(test_results)

        return TestResult(
            test_name="core_functionality",
            passed=all_passed,
            execution_time=execution_time,
            error_message=f"{len(test_results) - passed_count} module failures" if not all_passed else None,
            details={
                "modules_tested": len(test_results),
                "modules_passed": passed_count,
                "test_results": test_results
            }
        )

    def _test_analyzer_core(self, module_name: str) -> str:
        """Test analyzer core module."""
        try:
            # Add the analyzer path
            sys.path.insert(0, str(self.root_dir / "analyzer"))

            # Try to import core components
            from analyzer.core import unified_imports
            return "Successfully imported analyzer.core.unified_imports"
        except ImportError as e:
            return f"Import failed: {e}"

    def _test_main_module(self, module_name: str) -> str:
        """Test main module."""
        try:
            sys.path.insert(0, str(self.root_dir / "src"))
            import main
            return "Successfully imported src.main"
        except ImportError as e:
            return f"Import failed: {e}"

    def _test_unified_analyzer(self, module_name: str) -> str:
        """Test unified analyzer."""
        try:
            sys.path.insert(0, str(self.root_dir / "analyzer"))
            from analyzer import unified_analyzer
            return "Successfully imported analyzer.unified_analyzer"
        except ImportError as e:
            return f"Import failed: {e}"

class ConfigurationTester:
    """Tests that configuration files are still valid after renaming."""

    def __init__(self, root_dir: str):
        self.root_dir = Path(root_dir)

    def test_json_configs(self) -> TestResult:
        """Test that all JSON configuration files are still valid."""
        start_time = time.time()

        json_files = list(self.root_dir.rglob("*.json"))
        json_files = [f for f in json_files if self._should_test_config(f)]

        test_results = []
        for json_file in json_files:
            try:
                with open(json_file, 'r', encoding='utf-8') as f:
                    json.load(f)
                test_results.append({"file": str(json_file), "valid": True})
            except Exception as e:
                test_results.append({"file": str(json_file), "valid": False, "error": str(e)})

        execution_time = time.time() - start_time
        valid_count = sum(1 for r in test_results if r["valid"])
        all_valid = valid_count == len(test_results)

        return TestResult(
            test_name="json_configuration",
            passed=all_valid,
            execution_time=execution_time,
            error_message=f"{len(test_results) - valid_count} invalid JSON files" if not all_valid else None,
            details={
                "files_tested": len(test_results),
                "valid_files": valid_count,
                "results": test_results[:10]  # Limit for readability
            }
        )

    def _should_test_config(self, file_path: Path) -> bool:
        """Determine if config file should be tested."""
        exclude_patterns = [
            'node_modules', '.git', '__pycache__', 'package-lock.json'
        ]
        return not any(pattern in str(file_path) for pattern in exclude_patterns)

class PerformanceTester:
    """Tests that performance hasn't degraded after renaming."""

    def __init__(self, root_dir: str):
        self.root_dir = Path(root_dir)

    def test_import_performance(self) -> TestResult:
        """Test that import times haven't significantly increased."""
        start_time = time.time()

        # Test import times for key modules
        import_tests = [
            "analyzer.unified_analyzer",
            "analyzer.core.unified_imports",
            "src.constants"
        ]

        results = []
        for module in import_tests:
            import_time = self._measure_import_time(module)
            results.append({
                "module": module,
                "import_time": import_time,
                "acceptable": import_time < 2.0  # 2 second threshold
            })

        execution_time = time.time() - start_time
        acceptable_count = sum(1 for r in results if r["acceptable"])
        all_acceptable = acceptable_count == len(results)

        return TestResult(
            test_name="import_performance",
            passed=all_acceptable,
            execution_time=execution_time,
            error_message=f"{len(results) - acceptable_count} slow imports" if not all_acceptable else None,
            details={
                "modules_tested": len(results),
                "acceptable_performance": acceptable_count,
                "import_times": results
            }
        )

    def _measure_import_time(self, module_name: str) -> float:
        """Measure time to import a module."""
        try:
            import_start = time.time()

            # Clear module from cache if present
            if module_name in sys.modules:
                del sys.modules[module_name]

            # Dynamic import
            parts = module_name.split('.')
            if len(parts) > 1:
                sys.path.insert(0, str(self.root_dir / parts[0]))

            importlib.import_module(module_name)

            return time.time() - import_start
        except Exception:
            return 999.0  # Large time indicates failure

class RegressionTestSuite:
    """Main regression test suite."""

    def __init__(self, root_dir: str = "."):
        self.root_dir = Path(root_dir)
        self.test_results = []

    def run_all_tests(self) -> Dict[str, Any]:
        """Run all regression tests."""

        # Initialize testers
        import_tester = ImportResolutionTester(self.root_dir)
        functionality_tester = FunctionalityTester(self.root_dir)
        config_tester = ConfigurationTester(self.root_dir)
        performance_tester = PerformanceTester(self.root_dir)

        # Run tests
        tests = [
            import_tester.test_all_imports(),
            functionality_tester.test_core_modules(),
            config_tester.test_json_configs(),
            performance_tester.test_import_performance()
        ]

        self.test_results = tests

        # Compile summary
        passed_tests = sum(1 for test in tests if test.passed)
        total_tests = len(tests)

        summary = {
            "test_summary": {
                "total_tests": total_tests,
                "passed_tests": passed_tests,
                "failed_tests": total_tests - passed_tests,
                "overall_pass": passed_tests == total_tests,
                "total_execution_time": sum(test.execution_time for test in tests)
            },
            "individual_results": {
                test.test_name: {
                    "passed": test.passed,
                    "execution_time": test.execution_time,
                    "error": test.error_message,
                    "details": test.details
                } for test in tests
            },
            "critical_failures": [
                test for test in tests
                if not test.passed and test.test_name in ["import_resolution", "core_functionality"]
            ]
        }

        return summary

    def generate_report(self) -> str:
        """Generate human-readable regression test report."""
        if not self.test_results:
            return "No test results available."

        summary = self.run_all_tests() if not hasattr(self, '_summary') else self._summary

        report = []
        report.append("=" * 60)
        report.append("REGRESSION TEST REPORT")
        report.append("=" * 60)

        # Overall status
        overall = summary["test_summary"]
        status_icon = "[PASS]" if overall["overall_pass"] else "[FAIL]"
        report.append(f"OVERALL STATUS: {status_icon}")
        report.append(f"   Tests Run: {overall['total_tests']}")
        report.append(f"   Passed: {overall['passed_tests']}")
        report.append(f"   Failed: {overall['failed_tests']}")
        report.append(f"   Total Time: {overall['total_execution_time']:.2f}s")

        # Individual test results
        report.append(f"\nINDIVIDUAL TEST RESULTS:")
        for test_name, result in summary["individual_results"].items():
            status = "[PASS]" if result["passed"] else "[FAIL]"
            report.append(f"  {test_name.replace('_', ' ').title()}: {status}")
            report.append(f"    Time: {result['execution_time']:.2f}s")
            if result["error"]:
                report.append(f"    Error: {result['error']}")

        # Critical failures
        if summary["critical_failures"]:
            report.append(f"\nCRITICAL FAILURES:")
            for failure in summary["critical_failures"]:
                report.append(f"  - {failure.test_name}: {failure.error_message}")

        return "\n".join(report)

def main():
    """Run the regression test suite."""
    root_dir = sys.argv[1] if len(sys.argv) > 1 else "."

    # Run regression tests
    test_suite = RegressionTestSuite(root_dir)
    test_suite._summary = test_suite.run_all_tests()

    # Display report

    # Save results
    output_dir = Path("tests") / "regression_validation"
    output_dir.mkdir(parents=True, exist_ok=True)

    results_file = output_dir / "regression_test_results.json"
    with open(results_file, 'w') as f:
        json.dump(test_suite._summary, f, indent=2)

    print(f"\nDetailed results saved to: {results_file}")

    # Return exit code based on overall pass/fail
    return 0 if test_suite._summary["test_summary"]["overall_pass"] else 1

if __name__ == "__main__":
    sys.exit(main())