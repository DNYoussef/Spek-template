from src.constants.base import MAXIMUM_NESTED_DEPTH

import subprocess
import json
import os
import time
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any, Set
from dataclasses import dataclass, field
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

@dataclass
class TestResult:
    """Represents a single test execution result."""
    test_name: str
    status: str  # passed, failed, skipped, error
    duration: float
    error_message: Optional[str] = None
    stack_trace: Optional[str] = None
    file_path: Optional[str] = None
    line_number: Optional[int] = None

@dataclass
class TestSuite:
    """Represents a collection of test results."""
    suite_name: str
    total_tests: int
    passed: int
    failed: int
    skipped: int
    duration: float
    test_results: List[TestResult] = field(default_factory=list)
    coverage: Optional[float] = None

class TestCoordinator:
    """
    Coordinates test execution and failure analysis.

    Extracted from LoopOrchestrator god object (1, 323 LOC -> ~300 LOC component).
    Handles:
    - Test discovery and execution
    - Failure pattern analysis
    - Test prioritization
    - Parallel test execution
    - Test result aggregation
    """

    def __init__(self,
                project_root: str,
                test_framework: str = "jest",
                parallel_execution: bool = True,
                max_workers: int = 4):
        """Initialize the test coordinator."""
        self.project_root = Path(project_root)
        self.test_framework = test_framework
        self.parallel_execution = parallel_execution
        self.max_workers = max_workers

        # Test execution state
        self.test_suites: Dict[str, TestSuite] = {}
        self.failure_patterns: Dict[str, List[str]] = {}
        self.test_history: List[TestSuite] = []
        self.flaky_tests: Set[str] = set()

        # Framework configurations
        self.framework_configs = {
            "jest": {
                "command": "npm test",
                "coverage_command": "npm test -- --coverage",
                "parallel_flag": "--maxWorkers",
                "json_reporter": "--json",
                "output_file": "test-results.json"
            },
            "pytest": {
                "command": "pytest",
                "coverage_command": "pytest --cov",
                "parallel_flag": "-n",
                "json_reporter": "--json-report",
                "output_file": "pytest-report.json"
            },
            "mocha": {
                "command": "npm test",
                "coverage_command": "npm test -- --coverage",
                "parallel_flag": "--parallel",
                "json_reporter": "--reporter json",
                "output_file": "mocha-results.json"
            }
        }

    def discover_tests(self) -> List[str]:
        """Discover all available tests in the project."""
        test_files = []

        # Common test file patterns
        patterns = [
            "**/*.test.js",
            "**/*.test.ts",
            "**/*.spec.js",
            "**/*.spec.ts",
            "**/test_*.py",
            "**/*_test.py"
        ]

        for pattern in patterns:
            test_files.extend(self.project_root.glob(pattern))

        logger.info(f"Discovered {len(test_files)} test files")
        return [str(f.relative_to(self.project_root)) for f in test_files]

    def execute_tests(self,
                    test_files: Optional[List[str]] = None,
                    with_coverage: bool = False) -> TestSuite:
        """Execute tests and collect results."""
        config = self.framework_configs.get(self.test_framework, {})
        if not config:
            raise ValueError(f"Unsupported test framework: {self.test_framework}")

        # Build command
        if with_coverage:
            command = config["coverage_command"]
        else:
            command = config["command"]

        # Add parallel execution if enabled
        if self.parallel_execution and config.get("parallel_flag"):
            command += f" {config['parallel_flag']} {self.max_workers}"

        # Add JSON reporter for parsing results
        if config.get("json_reporter"):
            command += f" {config['json_reporter']}"

        # Add specific test files if provided
        if test_files:
            command += " " + " ".join(test_files)

        # Execute tests
        start_time = time.time()
        result = self._run_command(command)
        duration = time.time() - start_time

        # Parse results
        test_suite = self._parse_test_results(result, duration)

        # Store in history
        self.test_suites[test_suite.suite_name] = test_suite
        self.test_history.append(test_suite)

        # Analyze failures
        if test_suite.failed > 0:
            self._analyze_failures(test_suite)

        return test_suite

    def _run_command(self, command: str) -> subprocess.CompletedProcess:
        """Run a command and capture output."""
        try:
            import shlex
            cmd_list = shlex.split(command)
            result = subprocess.run(
                cmd_list,
                shell=False,
                capture_output=True,
                text=True,
                cwd=self.project_root,
                timeout=300  # MAXIMUM_NESTED_DEPTH minute timeout
            )
            return result
        except subprocess.TimeoutExpired:
            logger.error(f"Command timed out: {command}")
            raise
        except Exception as e:
            logger.error(f"Command failed: {command}, error: {e}")
            raise

    def _parse_test_results(self,
                            result: subprocess.CompletedProcess,
                            duration: float) -> TestSuite:
        """Parse test execution results."""
        # Try to parse JSON output if available
        output_file = self.framework_configs[self.test_framework].get("output_file")
        if output_file:
            output_path = self.project_root / output_file
            if output_path.exists():
                return self._parse_json_results(output_path, duration)

        # Fallback to parsing stdout
        return self._parse_stdout_results(result.stdout, duration)

    def _parse_json_results(self, output_path: Path, duration: float) -> TestSuite:
        """Parse JSON test results."""
        try:
            with open(output_path, 'r') as f:
                data = json.load(f)

            # Parse based on framework format
            if self.test_framework == "jest":
                return self._parse_jest_json(data, duration)
            elif self.test_framework == "pytest":
                return self._parse_pytest_json(data, duration)
            else:
                return self._parse_generic_json(data, duration)

        except Exception as e:
            logger.error(f"Failed to parse JSON results: {e}")
            return TestSuite(
                suite_name=f"suite_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
                total_tests=0,
                passed=0,
                failed=0,
                skipped=0,
                duration=duration
            )

    def _parse_stdout_results(self, stdout: str, duration: float) -> TestSuite:
        """Parse test results from stdout."""
        # Basic parsing for common patterns
        lines = stdout.split('\n')

        passed = failed = skipped = 0
        test_results = []

        for line in lines:
            if 'passed' in line.lower():
                # Extract passed count
                import re
                match = re.search(r'(\d+)\s+passed', line, re.IGNORECASE)
                if match:
                    passed = int(match.group(1))
            elif 'failed' in line.lower():
                match = re.search(r'(\d+)\s+failed', line, re.IGNORECASE)
                if match:
                    failed = int(match.group(1))
            elif 'skipped' in line.lower():
                match = re.search(r'(\d+)\s+skipped', line, re.IGNORECASE)
                if match:
                    skipped = int(match.group(1))

        return TestSuite(
            suite_name=f"suite_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            total_tests=passed + failed + skipped,
            passed=passed,
            failed=failed,
            skipped=skipped,
            duration=duration,
            test_results=test_results
        )

    def _analyze_failures(self, test_suite: TestSuite) -> None:
        """Analyze test failures for patterns."""
        for test_result in test_suite.test_results:
            if test_result.status == "failed":
                # Extract failure pattern
                pattern = self._extract_failure_pattern(test_result)

                # Group by pattern
                if pattern not in self.failure_patterns:
                    self.failure_patterns[pattern] = []
                self.failure_patterns[pattern].append(test_result.test_name)

                # Check for flaky tests
                if self._is_flaky(test_result.test_name):
                    self.flaky_tests.add(test_result.test_name)

    def _extract_failure_pattern(self, test_result: TestResult) -> str:
        """Extract a failure pattern from test result."""
        if test_result.error_message:
            # Simplify error message to pattern
            error = test_result.error_message

            # Common patterns
            if "timeout" in error.lower():
                return "timeout"
            elif "assertion" in error.lower():
                return "assertion_failure"
            elif "undefined" in error.lower():
                return "undefined_reference"
            elif "connection" in error.lower():
                return "connection_error"
            else:
                # Use first part of error as pattern
                return error.split('\n')[0][:50]
        return "unknown"

    def _is_flaky(self, test_name: str) -> bool:
        """Check if a test is flaky based on history."""
        # Look at last 5 runs
        recent_results = []
        for suite in self.test_history[-5:]:
            for result in suite.test_results:
                if result.test_name == test_name:
                    recent_results.append(result.status)

        # Test is flaky if it has both passed and failed recently
        return len(set(recent_results)) > 1

    def prioritize_tests(self, test_files: List[str]) -> List[str]:
        """Prioritize tests based on failure history and patterns."""
        # Score each test file
        scores = {}
        for test_file in test_files:
            score = 0

            # Higher score for recently failed tests
            for pattern, tests in self.failure_patterns.items():
                if any(test_file in test for test in tests):
                    score += 10

            # Lower score for flaky tests
            if any(test_file in test for test in self.flaky_tests):
                score -= 5

            scores[test_file] = score

        # Sort by score (highest first)
        return sorted(test_files, key=lambda x: scores.get(x, 0), reverse=True)

    def get_failure_summary(self) -> Dict[str, Any]:
        """Get a summary of test failures."""
        return {
            "total_failures": sum(
                suite.failed for suite in self.test_suites.values()
            ),
            "failure_patterns": {
                pattern: len(tests)
                for pattern, tests in self.failure_patterns.items()
            },
            "flaky_tests": list(self.flaky_tests),
            "most_recent_suite": (
                self.test_history[-1].__dict__
                if self.test_history else None
            )
        }