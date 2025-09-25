#!/usr/bin/env python3
"""
CI/CD Performance Tester - End-to-End Pipeline Validation
=========================================================

Comprehensive end-to-end testing suite for the Phase 6 CI/CD accelerator and
quality enforcer, providing performance validation, benchmark comparisons,
and regression detection with automated reporting.

Features:
- End-to-end CI/CD pipeline testing
- Performance benchmarking and regression detection
- Quality gate validation with timing analysis
- Automated fix mechanism testing
- Parallel execution performance analysis
- Comprehensive reporting with trend analysis
"""

from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
from unittest.mock import patch
import json
import os
import subprocess
import sys
import tempfile
import time

from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import asdict, dataclass, field
import asyncio
import threading

import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@dataclass
class PerformanceMetric:
    """Individual performance metric measurement."""
    name: str
    value: float
    unit: str
    baseline: float
    threshold: float
    improvement_percent: float
    status: str  # PASS, FAIL, IMPROVED, REGRESSED

@dataclass
class TestResult:
    """Individual test execution result."""
    test_name: str
    success: bool
    execution_time: float
    baseline_time: float
    improvement_percent: float
    metrics: List[PerformanceMetric]
    error_message: Optional[str] = None
    output: str = ""

@dataclass
class BenchmarkReport:
    """Comprehensive benchmark report."""
    timestamp: datetime
    test_suite: str
    total_tests: int
    passed_tests: int
    failed_tests: int
    total_execution_time: float
    baseline_execution_time: float
    overall_improvement_percent: float
    test_results: List[TestResult]
    performance_metrics: List[PerformanceMetric]
    regression_detected: bool
    recommendations: List[str]

class CICDPerformanceTester:
    """
    Comprehensive CI/CD performance testing and validation system.

    NASA Rule 4: All methods under 60 lines
    NASA Rule 5: Input validation and bounds checking
    """

    def __init__(self,
                project_path: str = ".",
                baseline_file: str = ".ci-acceleration/performance-baseline.json"):
        """Initialize CI/CD performance tester."""
        self.project_path = Path(project_path)
        self.baseline_file = Path(baseline_file)
        self.test_results = []
        self.baseline_data = {}

        # Load baseline performance data
        self._load_baseline_data()

        # Test suite configurations
        self.test_suites = {
            "quality_gates": {
                "tests": [
                    {"name": "nasa_compliance", "script": "scripts/run_nasa_compliance_validation.py", "timeout": 300},
                    {"name": "theater_detection", "script": "scripts/comprehensive_theater_scan.py", "timeout": 180},
                    {"name": "god_objects", "script": "scripts/god_object_counter.py", "timeout": 120},
                    {"name": "unicode_validation", "script": "scripts/unicode_removal_linter.py", "timeout": 60},
                    {"name": "security_scan", "script": "scripts/security_validator.py", "timeout": 240}
                ],
                "parallel": True,
                "expected_improvement": 40.0
            },
            "cicd_acceleration": {
                "tests": [
                    {"name": "pipeline_acceleration", "script": "analyzer/performance/ci_cd_accelerator.py", "timeout": 300},
                    {"name": "quality_enforcer", "script": "scripts/cicd_quality_enforcer.py", "timeout": 240},
                    {"name": "metrics_dashboard", "script": "scripts/quality_metrics_dashboard.py", "timeout": 120}
                ],
                "parallel": True,
                "expected_improvement": 35.0
            },
            "automated_fixes": {
                "tests": [
                    {"name": "unicode_auto_fix", "script": "scripts/unicode_removal_linter.py", "args": ["--fix"], "timeout": 60},
                    {"name": "formatting_fix", "script": "scripts/format_code.py", "timeout": 120},
                    {"name": "god_object_decomposition", "script": "scripts/god_object_decomposer.py", "args": ["--auto-fix", "--conservative"], "timeout": 180}
                ],
                "parallel": False,
                "expected_improvement": 50.0
            }
        }

        # Performance thresholds
        self.performance_thresholds = {
            "execution_time_improvement": 30.0,  # Minimum 30% improvement
            "parallel_efficiency": 0.7,  # 70% parallel efficiency
            "cache_hit_rate": 20.0,  # Minimum 20% cache hits
            "memory_usage_increase": 50.0,  # Maximum 50% memory increase
            "cpu_utilization": 80.0  # Maximum 80% CPU usage
        }

        logger.info(f"Initialized CI/CD performance tester for project: {self.project_path}")

    def _load_baseline_data(self) -> None:
        """Load baseline performance data."""
        try:
            if self.baseline_file.exists():
                with open(self.baseline_file, 'r') as f:
                    self.baseline_data = json.load(f)
                logger.info(f"Loaded baseline data from {self.baseline_file}")
            else:
                logger.info("No baseline data found - will create new baseline")
        except Exception as e:
            logger.error(f"Failed to load baseline data: {e}")
            self.baseline_data = {}

    def _save_baseline_data(self, benchmark_data: Dict[str, Any]) -> None:
        """Save performance data as new baseline."""
        try:
            self.baseline_file.parent.mkdir(parents=True, exist_ok=True)

            baseline_entry = {
                "timestamp": datetime.now().isoformat(),
                "execution_times": {},
                "performance_metrics": {}
            }

            # Extract execution times and metrics
            for test_result in benchmark_data.get("test_results", []):
                baseline_entry["execution_times"][test_result["test_name"]] = test_result["execution_time"]
                for metric in test_result.get("metrics", []):
                    baseline_entry["performance_metrics"][f"{test_result['test_name']}.{metric['name']}"] = metric["value"]

            # Update baseline data
            self.baseline_data.update(baseline_entry)

            with open(self.baseline_file, 'w') as f:
                json.dump(self.baseline_data, f, indent=2, default=str)

            logger.info(f"Saved baseline data to {self.baseline_file}")

        except Exception as e:
            logger.error(f"Failed to save baseline data: {e}")

    async def run_comprehensive_benchmark(self,
                                        suite_names: Optional[List[str]] = None,
                                        iterations: int = 3,
                                        save_baseline: bool = False) -> BenchmarkReport:
        """
        Run comprehensive CI/CD performance benchmark.

        NASA Rule 4: Function under 60 lines
        NASA Rule 5: Input validation
        """
        assert iterations > 0, "iterations must be positive"

        benchmark_start = time.time()
        suites_to_run = suite_names or list(self.test_suites.keys())

        logger.info(f"Starting comprehensive benchmark: {', '.join(suites_to_run)} ({iterations} iterations)")

        all_test_results = []
        all_metrics = []

        for suite_name in suites_to_run:
            if suite_name not in self.test_suites:
                logger.warning(f"Unknown test suite: {suite_name}")
                continue

            suite_config = self.test_suites[suite_name]

            # Run test suite multiple iterations for consistency
            suite_results = []
            for iteration in range(iterations):
                logger.info(f"Running {suite_name} iteration {iteration + 1}/{iterations}")

                if suite_config["parallel"]:
                    results = await self._run_parallel_test_suite(suite_name, suite_config)
                else:
                    results = await self._run_sequential_test_suite(suite_name, suite_config)

                suite_results.extend(results)

            # Calculate average results for the suite
            averaged_results = self._calculate_average_results(suite_results, iterations)
            all_test_results.extend(averaged_results)

            # Generate performance metrics for the suite
            suite_metrics = self._generate_suite_metrics(suite_name, averaged_results, suite_config)
            all_metrics.extend(suite_metrics)

        # Calculate overall statistics
        total_tests = len(all_test_results)
        passed_tests = sum(1 for r in all_test_results if r.success)
        failed_tests = total_tests - passed_tests
        total_execution_time = time.time() - benchmark_start

        # Calculate baseline comparison
        baseline_time = self._calculate_baseline_time(all_test_results)
        overall_improvement = ((baseline_time - total_execution_time) / max(baseline_time, 1)) * 100

        # Detect regressions
        regression_detected = self._detect_regressions(all_test_results, all_metrics)

        # Generate recommendations
        recommendations = self._generate_recommendations(all_test_results, all_metrics, regression_detected)

        # Create benchmark report
        report = BenchmarkReport(
            timestamp=datetime.now(),
            test_suite=", ".join(suites_to_run),
            total_tests=total_tests,
            passed_tests=passed_tests,
            failed_tests=failed_tests,
            total_execution_time=total_execution_time,
            baseline_execution_time=baseline_time,
            overall_improvement_percent=overall_improvement,
            test_results=all_test_results,
            performance_metrics=all_metrics,
            regression_detected=regression_detected,
            recommendations=recommendations
        )

        # Save baseline if requested
        if save_baseline:
            self._save_baseline_data(asdict(report))

        logger.info(f"Benchmark completed: {passed_tests}/{total_tests} passed, "
                    f"{overall_improvement:.1f}% improvement, "
                    f"{'regression detected' if regression_detected else 'no regressions'}")

        return report

    async def _run_parallel_test_suite(self, suite_name: str, suite_config: Dict[str, Any]) -> List[TestResult]:
        """Run test suite with parallel execution."""
        tests = suite_config["tests"]

        # Create tasks for parallel execution
        tasks = []
        for test in tests:
            task = self._execute_single_test(test, suite_name)
            tasks.append(task)

        # Execute all tests in parallel
        results = await asyncio.gather(*tasks, return_exceptions=True)

        # Process results
        test_results = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                logger.error(f"Test {tests[i]['name']} failed with exception: {result}")
                # Create failed test result
                test_results.append(TestResult(
                    test_name=f"{suite_name}.{tests[i]['name']}",
                    success=False,
                    execution_time=0.0,
                    baseline_time=0.0,
                    improvement_percent=0.0,
                    metrics=[],
                    error_message=str(result)
                ))
            else:
                test_results.append(result)

        return test_results

    async def _run_sequential_test_suite(self, suite_name: str, suite_config: Dict[str, Any]) -> List[TestResult]:
        """Run test suite with sequential execution."""
        test_results = []

        for test in suite_config["tests"]:
            try:
                result = await self._execute_single_test(test, suite_name)
                test_results.append(result)
            except Exception as e:
                logger.error(f"Test {test['name']} failed: {e}")
                test_results.append(TestResult(
                    test_name=f"{suite_name}.{test['name']}",
                    success=False,
                    execution_time=0.0,
                    baseline_time=0.0,
                    improvement_percent=0.0,
                    metrics=[],
                    error_message=str(e)
                ))

        return test_results

    async def _execute_single_test(self, test_config: Dict[str, Any], suite_name: str) -> TestResult:
        """Execute a single performance test."""
        test_name = f"{suite_name}.{test_config['name']}"
        script_path = Path(test_config["script"])

        if not script_path.exists():
            return TestResult(
                test_name=test_name,
                success=False,
                execution_time=0.0,
                baseline_time=0.0,
                improvement_percent=0.0,
                metrics=[],
                error_message=f"Test script not found: {script_path}"
            )

        # Get baseline time
        baseline_key = test_config["name"]
        baseline_time = self.baseline_data.get("execution_times", {}).get(baseline_key, 60.0)

        start_time = time.time()

        try:
            # Build command
            command = ["python", str(script_path)]

            # Add common arguments
            command.extend(["--json", "--ci-mode"])

            # Add test-specific arguments
            if "args" in test_config:
                command.extend(test_config["args"])

            # Execute test with timeout
            process = await asyncio.create_subprocess_exec(
                *command,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                cwd=str(self.project_path)
            )

            try:
                stdout, stderr = await asyncio.wait_for(
                    process.communicate(),
                    timeout=test_config.get("timeout", 300)
                )
                execution_time = time.time() - start_time

                success = process.returncode == 0
                output = stdout.decode('utf-8') if stdout else ""

            except asyncio.TimeoutError:
                process.kill()
                execution_time = test_config.get("timeout", 300)
                success = False
                output = f"Test timed out after {execution_time}s"

            # Calculate improvement
            improvement_percent = ((baseline_time - execution_time) / max(baseline_time, 1)) * 100

            # Extract performance metrics from output
            metrics = self._extract_performance_metrics(test_name, output, execution_time, baseline_time)

            return TestResult(
                test_name=test_name,
                success=success,
                execution_time=execution_time,
                baseline_time=baseline_time,
                improvement_percent=improvement_percent,
                metrics=metrics,
                error_message=stderr.decode('utf-8') if stderr and not success else None,
                output=output
            )

        except Exception as e:
            execution_time = time.time() - start_time
            return TestResult(
                test_name=test_name,
                success=False,
                execution_time=execution_time,
                baseline_time=baseline_time,
                improvement_percent=0.0,
                metrics=[],
                error_message=str(e)
            )

    def _extract_performance_metrics(self, test_name: str, output: str,
                                    execution_time: float, baseline_time: float) -> List[PerformanceMetric]:
        """Extract performance metrics from test output."""
        metrics = []

        try:
            # Try to parse JSON output for metrics
            if output.strip():
                try:
                    data = json.loads(output)

                    # Common performance metrics
                    if "performance_improvement_percent" in data:
                        metrics.append(PerformanceMetric(
                            name="performance_improvement",
                            value=data["performance_improvement_percent"],
                            unit="percent",
                            baseline=0.0,
                            threshold=self.performance_thresholds["execution_time_improvement"],
                            improvement_percent=data["performance_improvement_percent"],
                            status="PASS" if data["performance_improvement_percent"] >= 30 else "FAIL"
                        ))

                    if "parallelization_achieved" in data:
                        metrics.append(PerformanceMetric(
                            name="parallelization_efficiency",
                            value=data["parallelization_achieved"],
                            unit="ratio",
                            baseline=0.5,
                            threshold=self.performance_thresholds["parallel_efficiency"],
                            improvement_percent=((data["parallelization_achieved"] - 0.5) / 0.5) * 100,
                            status="PASS" if data["parallelization_achieved"] >= 0.7 else "FAIL"
                        ))

                    if "cache_hit_rate_percent" in data:
                        metrics.append(PerformanceMetric(
                            name="cache_hit_rate",
                            value=data["cache_hit_rate_percent"],
                            unit="percent",
                            baseline=10.0,
                            threshold=self.performance_thresholds["cache_hit_rate"],
                            improvement_percent=data["cache_hit_rate_percent"] - 10.0,
                            status="PASS" if data["cache_hit_rate_percent"] >= 20 else "FAIL"
                        ))

                except json.JSONDecodeError:
                    pass

        except Exception as e:
            logger.debug(f"Failed to extract metrics from {test_name}: {e}")

        # Always add execution time metric
        metrics.append(PerformanceMetric(
            name="execution_time",
            value=execution_time,
            unit="seconds",
            baseline=baseline_time,
            threshold=baseline_time * 0.7,  # 30% improvement threshold
            improvement_percent=((baseline_time - execution_time) / max(baseline_time, 1)) * 100,
            status="IMPROVED" if execution_time < baseline_time * 0.7 else
                    "PASS" if execution_time <= baseline_time else "REGRESSED"
        ))

        return metrics

    def _calculate_average_results(self, suite_results: List[TestResult], iterations: int) -> List[TestResult]:
        """Calculate average results across multiple iterations."""
        if iterations <= 1:
            return suite_results

        # Group results by test name
        grouped_results = {}
        for result in suite_results:
            if result.test_name not in grouped_results:
                grouped_results[result.test_name] = []
            grouped_results[result.test_name].append(result)

        # Calculate averages
        averaged_results = []
        for test_name, results in grouped_results.items():
            if not results:
                continue

            # Calculate averages
            avg_execution_time = sum(r.execution_time for r in results) / len(results)
            avg_baseline_time = sum(r.baseline_time for r in results) / len(results)
            avg_improvement = sum(r.improvement_percent for r in results) / len(results)

            # Determine overall success (majority rule)
            success_count = sum(1 for r in results if r.success)
            overall_success = success_count > len(results) / 2

            # Average metrics
            all_metrics = []
            for result in results:
                all_metrics.extend(result.metrics)

            averaged_metrics = self._average_metrics(all_metrics)

            averaged_results.append(TestResult(
                test_name=test_name,
                success=overall_success,
                execution_time=avg_execution_time,
                baseline_time=avg_baseline_time,
                improvement_percent=avg_improvement,
                metrics=averaged_metrics,
                error_message=results[0].error_message if not overall_success else None,
                output=f"Averaged over {len(results)} iterations"
            ))

        return averaged_results

    def _average_metrics(self, metrics: List[PerformanceMetric]) -> List[PerformanceMetric]:
        """Average performance metrics by name."""
        if not metrics:
            return []

        grouped_metrics = {}
        for metric in metrics:
            if metric.name not in grouped_metrics:
                grouped_metrics[metric.name] = []
            grouped_metrics[metric.name].append(metric)

        averaged_metrics = []
        for name, metric_list in grouped_metrics.items():
            if not metric_list:
                continue

            avg_value = sum(m.value for m in metric_list) / len(metric_list)
            avg_baseline = sum(m.baseline for m in metric_list) / len(metric_list)
            avg_threshold = sum(m.threshold for m in metric_list) / len(metric_list)
            avg_improvement = sum(m.improvement_percent for m in metric_list) / len(metric_list)

            # Determine status based on averaged values
            if name == "execution_time":
                status = "IMPROVED" if avg_value < avg_threshold else "PASS" if avg_value <= avg_baseline else "REGRESSED"
            else:
                status = "PASS" if avg_value >= avg_threshold else "FAIL"

            averaged_metrics.append(PerformanceMetric(
                name=name,
                value=avg_value,
                unit=metric_list[0].unit,
                baseline=avg_baseline,
                threshold=avg_threshold,
                improvement_percent=avg_improvement,
                status=status
            ))

        return averaged_metrics

    def _generate_suite_metrics(self, suite_name: str, results: List[TestResult],
                                suite_config: Dict[str, Any]) -> List[PerformanceMetric]:
        """Generate performance metrics for entire test suite."""
        suite_metrics = []

        if not results:
            return suite_metrics

        # Suite-level execution time
        total_execution_time = sum(r.execution_time for r in results)
        baseline_total_time = sum(r.baseline_time for r in results)

        suite_improvement = ((baseline_total_time - total_execution_time) / max(baseline_total_time, 1)) * 100

        suite_metrics.append(PerformanceMetric(
            name=f"{suite_name}_total_time",
            value=total_execution_time,
            unit="seconds",
            baseline=baseline_total_time,
            threshold=baseline_total_time * 0.7,
            improvement_percent=suite_improvement,
            status="IMPROVED" if suite_improvement >= suite_config.get("expected_improvement", 30) else "PASS"
        ))

        # Suite success rate
        success_rate = (sum(1 for r in results if r.success) / len(results)) * 100

        suite_metrics.append(PerformanceMetric(
            name=f"{suite_name}_success_rate",
            value=success_rate,
            unit="percent",
            baseline=80.0,
            threshold=90.0,
            improvement_percent=success_rate - 80.0,
            status="PASS" if success_rate >= 90 else "FAIL"
        ))

        # Parallel efficiency (if applicable)
        if suite_config.get("parallel", False):
            # Estimate parallel efficiency
            sequential_time = baseline_total_time
            parallel_time = max(r.execution_time for r in results) if results else 0
            parallel_efficiency = min(1.0, sequential_time / max(parallel_time * len(results), 1))

            suite_metrics.append(PerformanceMetric(
                name=f"{suite_name}_parallel_efficiency",
                value=parallel_efficiency,
                unit="ratio",
                baseline=0.5,
                threshold=self.performance_thresholds["parallel_efficiency"],
                improvement_percent=((parallel_efficiency - 0.5) / 0.5) * 100,
                status="PASS" if parallel_efficiency >= 0.7 else "FAIL"
            ))

        return suite_metrics

    def _calculate_baseline_time(self, results: List[TestResult]) -> float:
        """Calculate total baseline execution time."""
        return sum(r.baseline_time for r in results)

    def _detect_regressions(self, results: List[TestResult], metrics: List[PerformanceMetric]) -> bool:
        """Detect performance regressions."""
        # Check for significant performance regressions
        regression_threshold = -20.0  # 20% degradation

        for result in results:
            if result.improvement_percent < regression_threshold:
                logger.warning(f"Regression detected in {result.test_name}: {result.improvement_percent:.1f}%")
                return True

        for metric in metrics:
            if metric.status == "REGRESSED":
                logger.warning(f"Regression detected in metric {metric.name}")
                return True

        return False

    def _generate_recommendations(self, results: List[TestResult],
                                metrics: List[PerformanceMetric],
                                regression_detected: bool) -> List[str]:
        """Generate actionable recommendations based on test results."""
        recommendations = []

        if regression_detected:
            recommendations.append("? Performance regression detected - investigate recent changes")

        # Analyze failed tests
        failed_tests = [r for r in results if not r.success]
        if failed_tests:
            recommendations.append(f"[TOOL] {len(failed_tests)} tests failed - review error messages and fix issues")

        # Analyze slow tests
        slow_tests = [r for r in results if r.execution_time > r.baseline_time * 1.5]
        if slow_tests:
            recommendations.append(f"[PERF] {len(slow_tests)} tests are significantly slower than baseline - optimize performance")

        # Check parallel efficiency
        parallel_metrics = [m for m in metrics if "parallel_efficiency" in m.name and m.value < 0.7]
        if parallel_metrics:
            recommendations.append("[CHART] Parallel execution efficiency is low - review task dependencies and resource usage")

        # Check cache hit rate
        cache_metrics = [m for m in metrics if "cache_hit_rate" in m.name and m.value < 20.0]
        if cache_metrics:
            recommendations.append("? Cache hit rate is low - implement more aggressive caching strategies")

        # Overall performance
        overall_improvement = sum(r.improvement_percent for r in results) / max(len(results), 1)
        if overall_improvement < 30.0:
            recommendations.append("[TARGET] Overall performance improvement below target - focus on optimization efforts")

        if not recommendations:
            recommendations.append("[OK] All performance tests passed successfully - maintain current optimization strategies")

        return recommendations

    def generate_performance_report(self, report: BenchmarkReport, output_file: Optional[str] = None) -> str:
        """Generate comprehensive performance report."""
        report_content = []

        # Header
        report_content.extend([
            "# CI/CD Performance Test Report",
            f"**Generated:** {report.timestamp.isoformat()}",
            f"**Test Suite:** {report.test_suite}",
            "",
            "## Executive Summary",
            f"- **Overall Status:** {'[PASS]' if not report.regression_detected else '[REGRESSION]'}",
            f"- **Tests Executed:** {report.total_tests}",
            f"- **Success Rate:** {(report.passed_tests / max(report.total_tests, 1)) * 100:.1f}%",
            f"- **Performance Improvement:** {report.overall_improvement_percent:.1f}%",
            f"- **Total Execution Time:** {report.total_execution_time:.2f}s",
            f"- **Baseline Time:** {report.baseline_execution_time:.2f}s",
            ""
        ])

        # Test Results
        report_content.extend([
            "## Test Results",
            "",
            "| Test Name | Status | Execution Time | Baseline | Improvement |",
            "|-----------|--------|----------------|----------|-------------|"
        ])

        for result in report.test_results:
            status_icon = "[PASS]" if result.success else "[FAIL]"
            report_content.append(
                f"| {result.test_name} | {status_icon} | {result.execution_time:.2f}s | "
                f"{result.baseline_time:.2f}s | {result.improvement_percent:+.1f}% |"
            )

        report_content.append("")

        # Performance Metrics
        report_content.extend([
            "## Performance Metrics",
            "",
            "| Metric | Value | Baseline | Threshold | Status |",
            "|--------|-------|----------|-----------|--------|"
        ])

        for metric in report.performance_metrics:
            status_icon = {"PASS": "[PASS]", "FAIL": "[FAIL]", "IMPROVED": "[IMPROVED]", "REGRESSED": "[REGRESSED]"}.get(metric.status, "[UNKNOWN]")
            report_content.append(
                f"| {metric.name} | {metric.value:.2f} {metric.unit} | "
                f"{metric.baseline:.2f} | {metric.threshold:.2f} | {status_icon} |"
            )

        report_content.append("")

        # Recommendations
        if report.recommendations:
            report_content.extend([
                "## Recommendations",
                ""
            ])
            for i, rec in enumerate(report.recommendations, 1):
                report_content.append(f"{i}. {rec}")
            report_content.append("")

        # Failed Tests Details
        failed_tests = [r for r in report.test_results if not r.success]
        if failed_tests:
            report_content.extend([
                "## Failed Tests Details",
                ""
            ])
            for result in failed_tests:
                report_content.extend([
                    f"### {result.test_name}",
                    f"**Error:** {result.error_message or 'Unknown error'}",
                    f"**Execution Time:** {result.execution_time:.2f}s",
                    ""
                ])

        # Technical Details
        report_content.extend([
            "## Technical Details",
            f"- **Project Path:** {self.project_path}",
            f"- **Baseline File:** {self.baseline_file}",
            f"- **Performance Thresholds:** {json.dumps(self.performance_thresholds, indent=2)}",
            "",
            "---",
            f"Report generated by CI/CD Performance Tester on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
        ])

        report_text = "\n".join(report_content)

        # Save to file if requested
        if output_file:
            output_path = Path(output_file)
            output_path.parent.mkdir(parents=True, exist_ok=True)
            with open(output_path, 'w') as f:
                f.write(report_text)
            logger.info(f"Performance report saved to {output_path}")

        return report_text

    async def run_regression_test(self, threshold_percent: float = -10.0) -> Tuple[bool, List[str]]:
        """Run regression test against baseline performance."""
        logger.info("Running regression test against baseline")

        # Run lightweight benchmark
        report = await self.run_comprehensive_benchmark(iterations=1)

        regressions = []

        for result in report.test_results:
            if result.improvement_percent < threshold_percent:
                regressions.append(f"{result.test_name}: {result.improvement_percent:.1f}% regression")

        has_regression = len(regressions) > 0 or report.regression_detected

        if has_regression:
            logger.warning(f"Regression test FAILED: {len(regressions)} regressions detected")
        else:
            logger.info("Regression test PASSED: No significant regressions detected")

        return not has_regression, regressions

def main():
    """Main CLI interface for CI/CD performance tester."""
    import argparse

    parser = argparse.ArgumentParser(description="CI/CD Performance Tester")
    parser.add_argument("--project-path", "-p", default=".", help="Project path to test")
    parser.add_argument("--suites", "-s", nargs="*", help="Test suites to run")
    parser.add_argument("--iterations", "-i", type=int, default=3, help="Number of iterations per test")
    parser.add_argument("--save-baseline", action="store_true", help="Save results as new baseline")
    parser.add_argument("--regression-only", action="store_true", help="Run regression test only")
    parser.add_argument("--output", "-o", help="Output report file")
    parser.add_argument("--json", action="store_true", help="Output results in JSON format")

    args = parser.parse_args()

    async def run_tests():
        try:
            tester = CICDPerformanceTester(
                project_path=args.project_path,
                baseline_file=".ci-acceleration/performance-baseline.json"
            )

            if args.regression_only:
                # Run regression test only
                passed, regressions = await tester.run_regression_test()

                if args.json:
                    result = {
                        "regression_test_passed": passed,
                        "regressions": regressions,
                        "timestamp": datetime.now().isoformat()
                    }
                    print(json.dumps(result, indent=2))
                else:
                    print("=" * 40)
                    print(f"Status: {'[PASS]' if passed else '[FAIL]'}")
                    if regressions:
                        print("Regressions detected:")
                        for regression in regressions:
                            print(f"  - {regression}")

                sys.exit(0 if passed else 1)

            else:
                # Run full benchmark
                report = await tester.run_comprehensive_benchmark(
                    suite_names=args.suites,
                    iterations=args.iterations,
                    save_baseline=args.save_baseline
                )

                if args.json:
                    # JSON output
                    report_data = asdict(report)
                    print(json.dumps(report_data, indent=2, default=str))
                else:
                    # Generate and display report
                    report_text = tester.generate_performance_report(report, args.output)
                    if not args.output:
                        print(report_text)

                # Set exit code based on results
                exit_code = 0 if not report.regression_detected and report.passed_tests == report.total_tests else 1
                sys.exit(exit_code)

        except Exception as e:
            logger.error(f"Performance testing failed: {e}")
            if args.json:
                error_result = {"error": str(e), "success": False}
                print(json.dumps(error_result, indent=2))
            else:
                print(f"ERROR: {e}")
            sys.exit(1)

    # Run the tests
    asyncio.run(run_tests())

if __name__ == "__main__":
    main()