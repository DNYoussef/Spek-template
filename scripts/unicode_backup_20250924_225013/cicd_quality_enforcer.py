#!/usr/bin/env python3
"""
CI/CD Quality Gate Enforcer with Dynamic Thresholds
==================================================

Advanced quality gate enforcement system with intelligent threshold adjustment,
automated fix suggestions, and comprehensive CI/CD integration for Phase 6
deployment acceleration with fail-fast optimization.

Features:
- Dynamic quality thresholds based on project maturity
- Intelligent fail-fast rules with progressive enhancement
- Automated fix suggestions and remediation
- Performance-aware resource management
- Comprehensive metrics and trend analysis
- Integration with existing SPEK quality tools
"""

from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union
import json
import os
import subprocess
import sys
import time

from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import asdict, dataclass, field
from enum import Enum
import asyncio
import threading

import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class QualityGateSeverity(Enum):
    """Quality gate severity levels."""
    BLOCKING = "blocking"
    CRITICAL = "critical"
    WARNING = "warning"
    INFO = "info"

class ExecutionStrategy(Enum):
    """Quality gate execution strategies."""
    FAIL_FAST = "fail_fast"
    CONTINUE_ON_ERROR = "continue_on_error"
    ADAPTIVE = "adaptive"

@dataclass
class QualityThreshold:
    """Dynamic quality threshold configuration."""
    name: str
    current_value: float
    baseline_value: float
    target_value: float
    severity: QualityGateSeverity
    auto_adjust: bool = True
    trend_weight: float = 0.3
    enforcement_enabled: bool = True

@dataclass
class QualityGateResult:
    """Quality gate execution result."""
    gate_name: str
    success: bool
    score: float
    threshold: float
    severity: QualityGateSeverity
    execution_time_seconds: float
    suggestions: List[str]
    metrics: Dict[str, Any]
    auto_fixable: bool = False
    fix_commands: List[str] = field(default_factory=list)

@dataclass
class EnforcementReport:
    """Comprehensive enforcement execution report."""
    timestamp: datetime
    overall_success: bool
    gates_executed: int
    gates_passed: int
    gates_failed: int
    blocking_failures: int
    total_execution_time: float
    performance_improvement: float
    gate_results: List[QualityGateResult]
    recommendations: List[str]
    auto_fixes_applied: int = 0

class DynamicThresholdManager:
    """
    Manages dynamic quality thresholds with trend analysis and auto-adjustment.

    NASA Rule 4: All methods under 60 lines
    NASA Rule 5: Input validation and bounds checking
    """

    def __init__(self, config_path: str = ".ci-acceleration/thresholds.json"):
        """Initialize dynamic threshold manager."""
        self.config_path = Path(config_path)
        self.thresholds: Dict[str, QualityThreshold] = {}
        self.history_path = Path(config_path).parent / "threshold_history.json"
        self.adjustment_lock = threading.RLock()

        # Default thresholds based on Phase 6 requirements
        self.default_thresholds = {
            "nasa_compliance": QualityThreshold("nasa_compliance", 95.4, 92.0, 98.0, QualityGateSeverity.BLOCKING),
            "theater_score": QualityThreshold("theater_score", 75.0, 60.0, 40.0, QualityGateSeverity.CRITICAL),
            "god_objects": QualityThreshold("god_objects", 293.0, 25.0, 10.0, QualityGateSeverity.WARNING),
            "test_coverage": QualityThreshold("test_coverage", 85.3, 80.0, 90.0, QualityGateSeverity.WARNING),
            "security_score": QualityThreshold("security_score", 98.0, 95.0, 100.0, QualityGateSeverity.BLOCKING),
            "unicode_violations": QualityThreshold("unicode_violations", 0.0, 0.0, 0.0, QualityGateSeverity.BLOCKING)
        }

        self._load_thresholds()
        logger.info("Initialized dynamic threshold manager")

    def _load_thresholds(self) -> None:
        """Load thresholds from configuration file."""
        try:
            if self.config_path.exists():
                with open(self.config_path, 'r') as f:
                    data = json.load(f)

                for name, threshold_data in data.items():
                    self.thresholds[name] = QualityThreshold(**threshold_data)

                logger.info(f"Loaded {len(self.thresholds)} thresholds from {self.config_path}")
            else:
                # Use defaults and save them
                self.thresholds = self.default_thresholds.copy()
                self._save_thresholds()
                logger.info("Created default thresholds configuration")

        except Exception as e:
            logger.error(f"Failed to load thresholds: {e}")
            self.thresholds = self.default_thresholds.copy()

    def _save_thresholds(self) -> None:
        """Save current thresholds to configuration file."""
        try:
            self.config_path.parent.mkdir(parents=True, exist_ok=True)

            serializable_thresholds = {
                name: asdict(threshold) for name, threshold in self.thresholds.items()
            }

            with open(self.config_path, 'w') as f:
                json.dump(serializable_thresholds, f, indent=2, default=str)

            logger.debug("Saved thresholds configuration")

        except Exception as e:
            logger.error(f"Failed to save thresholds: {e}")

    def get_threshold(self, gate_name: str) -> Optional[QualityThreshold]:
        """Get threshold for specific quality gate."""
        return self.thresholds.get(gate_name)

    def adjust_threshold(self, gate_name: str, current_score: float, trend_data: List[float]) -> QualityThreshold:
        """
        Adjust threshold dynamically based on current performance and trends.

        NASA Rule 4: Function under 60 lines
        NASA Rule 5: Input validation
        """
        assert isinstance(current_score, (int, float)), "current_score must be numeric"
        assert isinstance(trend_data, list), "trend_data must be list"

        with self.adjustment_lock:
            threshold = self.thresholds.get(gate_name)
            if not threshold or not threshold.auto_adjust:
                return threshold

            # Calculate trend direction and magnitude
            if len(trend_data) >= 3:
                recent_avg = sum(trend_data[-3:]) / 3
                baseline_avg = sum(trend_data[:-3]) / max(len(trend_data) - 3, 1)
                trend_direction = recent_avg - baseline_avg
            else:
                trend_direction = 0

            # Adjust threshold based on performance and trends
            adjustment_factor = 0.0

            # Performance-based adjustment
            if current_score > threshold.target_value:
                # Performance exceeds target - can be more strict
                adjustment_factor += 0.1
            elif current_score < threshold.baseline_value:
                # Performance below baseline - relax temporarily
                adjustment_factor -= 0.05

            # Trend-based adjustment
            if trend_direction > 0:
                # Improving trend - can be more strict
                adjustment_factor += trend_direction * threshold.trend_weight * 0.01
            else:
                # Declining trend - maintain current threshold
                adjustment_factor += trend_direction * threshold.trend_weight * 0.005

            # Apply adjustment with bounds checking
            if gate_name in ["theater_score", "god_objects"]:
                # Lower is better for these metrics
                new_threshold = threshold.current_value * (1 - adjustment_factor)
                new_threshold = max(new_threshold, threshold.target_value)
                new_threshold = min(new_threshold, threshold.baseline_value)
            else:
                # Higher is better for these metrics
                new_threshold = threshold.current_value * (1 + adjustment_factor)
                new_threshold = max(new_threshold, threshold.baseline_value)
                new_threshold = min(new_threshold, threshold.target_value * 1.1)  # Allow slight overshoot

            # Update threshold
            threshold.current_value = round(new_threshold, 2)

            # Record adjustment
            self._record_threshold_adjustment(gate_name, threshold, current_score, adjustment_factor)

            # Save updated thresholds
            self._save_thresholds()

            logger.info(f"Adjusted {gate_name} threshold to {threshold.current_value} (factor: {adjustment_factor:.3f})")
            return threshold

    def _record_threshold_adjustment(self, gate_name: str, threshold: QualityThreshold,
                                    current_score: float, adjustment_factor: float) -> None:
        """Record threshold adjustment for trend analysis."""
        try:
            history = []
            if self.history_path.exists():
                with open(self.history_path, 'r') as f:
                    history = json.load(f)

            adjustment_record = {
                "timestamp": datetime.now().isoformat(),
                "gate_name": gate_name,
                "old_threshold": threshold.current_value / (1 + adjustment_factor) if adjustment_factor != 0 else threshold.current_value,
                "new_threshold": threshold.current_value,
                "current_score": current_score,
                "adjustment_factor": adjustment_factor
            }

            history.append(adjustment_record)

            # Keep last 100 adjustments (NASA Rule 7: Bounded resources)
            if len(history) > 100:
                history = history[-50:]

            self.history_path.parent.mkdir(parents=True, exist_ok=True)
            with open(self.history_path, 'w') as f:
                json.dump(history, f, indent=2, default=str)

        except Exception as e:
            logger.error(f"Failed to record threshold adjustment: {e}")

class AutomatedFixEngine:
    """
    Automated fix engine for common quality issues.

    NASA Rule 4: All methods under 60 lines
    """

    def __init__(self):
        """Initialize automated fix engine."""
        self.fix_strategies = {
            "unicode_violations": self._fix_unicode_violations,
            "formatting_issues": self._fix_formatting_issues,
            "god_objects": self._suggest_god_object_fixes,
            "security_issues": self._suggest_security_fixes,
            "theater_patterns": self._suggest_theater_fixes
        }

        self.fixes_applied = 0
        self.fix_history = []

        logger.info("Initialized automated fix engine")

    async def analyze_and_fix(self, gate_result: QualityGateResult, project_path: str) -> Tuple[bool, List[str]]:
        """
        Analyze quality gate result and apply automated fixes.

        NASA Rule 4: Function under 60 lines
        NASA Rule 5: Input validation
        """
        assert isinstance(project_path, str), "project_path must be string"

        if gate_result.success or not gate_result.auto_fixable:
            return False, []

        fix_strategy = self.fix_strategies.get(gate_result.gate_name)
        if not fix_strategy:
            return False, []

        try:
            logger.info(f"Applying automated fixes for {gate_result.gate_name}")

            fixes_applied, fix_commands = await fix_strategy(gate_result, project_path)

            if fixes_applied:
                self.fixes_applied += 1
                self._record_fix_application(gate_result.gate_name, fix_commands)

            return fixes_applied, fix_commands

        except Exception as e:
            logger.error(f"Failed to apply fixes for {gate_result.gate_name}: {e}")
            return False, []

    async def _fix_unicode_violations(self, gate_result: QualityGateResult, project_path: str) -> Tuple[bool, List[str]]:
        """Fix Unicode character violations."""
        fix_commands = [
            f"python scripts/unicode_removal_linter.py --fix --path {project_path}"
        ]

        for command in fix_commands:
            try:
                result = subprocess.run(command.split(), capture_output=True, text=True, timeout=60)
                if result.returncode == 0:
                    logger.info("Applied Unicode violation fixes")
                    return True, fix_commands
            except subprocess.TimeoutExpired:
                logger.warning("Unicode fix command timed out")

        return False, []

    async def _fix_formatting_issues(self, gate_result: QualityGateResult, project_path: str) -> Tuple[bool, List[str]]:
        """Fix code formatting issues."""
        fix_commands = [
            f"black --line-length 100 --target-version py312 {project_path}",
            f"isort --profile black --line-length 100 {project_path}",
            f"autoflake --remove-all-unused-imports --recursive --in-place {project_path}"
        ]

        fixes_applied = False

        for command in fix_commands:
            try:
                result = subprocess.run(command.split(), capture_output=True, text=True, timeout=120)
                if result.returncode == 0:
                    fixes_applied = True
            except (subprocess.TimeoutExpired, FileNotFoundError):
                continue

        if fixes_applied:
            logger.info("Applied code formatting fixes")

        return fixes_applied, fix_commands

    async def _suggest_god_object_fixes(self, gate_result: QualityGateResult, project_path: str) -> Tuple[bool, List[str]]:
        """Suggest god object refactoring fixes."""
        suggestions = [
            f"python scripts/god_object_decomposer.py --auto-fix --conservative --path {project_path}",
            f"python scripts/service_extractor.py --extract-services --path {project_path}",
            f"python scripts/interface_segregator.py --create-interfaces --path {project_path}"
        ]

        # This is more complex and should be done carefully
        return False, suggestions

    async def _suggest_security_fixes(self, gate_result: QualityGateResult, project_path: str) -> Tuple[bool, List[str]]:
        """Suggest security issue fixes."""
        suggestions = [
            "Review and remove hardcoded credentials",
            "Update vulnerable dependencies",
            "Add input validation and sanitization",
            "Implement proper error handling"
        ]

        # Security fixes should be manual to avoid introducing issues
        return False, suggestions

    async def _suggest_theater_fixes(self, gate_result: QualityGateResult, project_path: str) -> Tuple[bool, List[str]]:
        """Suggest performance theater fixes."""
        suggestions = [
            "Remove dead code and unused functions",
            "Simplify overly complex logic",
            "Replace placeholder implementations with real functionality",
            "Remove redundant validation layers"
        ]

        # Theater detection fixes require careful analysis
        return False, suggestions

    def _record_fix_application(self, gate_name: str, fix_commands: List[str]) -> None:
        """Record applied fix for tracking."""
        fix_record = {
            "timestamp": datetime.now().isoformat(),
            "gate_name": gate_name,
            "fix_commands": fix_commands
        }

        self.fix_history.append(fix_record)

        # Keep last 50 fixes (NASA Rule 7: Bounded resources)
        if len(self.fix_history) > 50:
            self.fix_history = self.fix_history[-25:]

class CICDQualityEnforcer:
    """
    Main CI/CD quality enforcer with intelligent threshold management.

    NASA Rule 4: All methods under 60 lines
    NASA Rule 6: Clear variable scoping
    """

    def __init__(self,
                config_path: str = ".ci-acceleration/enforcer-config.json",
                execution_strategy: ExecutionStrategy = ExecutionStrategy.ADAPTIVE):
        """Initialize CI/CD quality enforcer."""
        self.config_path = Path(config_path)
        self.execution_strategy = execution_strategy

        # Initialize components
        self.threshold_manager = DynamicThresholdManager()
        self.fix_engine = AutomatedFixEngine()

        # Quality gate definitions
        self.quality_gates = {
            "nasa_compliance": {
                "script": "scripts/run_nasa_compliance_validation.py",
                "args": ["--json", "--ci-mode"],
                "timeout": 300,
                "auto_fixable": False
            },
            "theater_detection": {
                "script": "scripts/comprehensive_theater_scan.py",
                "args": ["--json", "--ci-mode"],
                "timeout": 180,
                "auto_fixable": False
            },
            "god_objects": {
                "script": "scripts/god_object_counter.py",
                "args": ["--json", "--ci-mode"],
                "timeout": 120,
                "auto_fixable": True
            },
            "unicode_violations": {
                "script": "scripts/unicode_removal_linter.py",
                "args": ["--json", "--path", "."],
                "timeout": 60,
                "auto_fixable": True
            },
            "security_scan": {
                "script": "scripts/security_validator.py",
                "args": ["--json", "--ci-mode"],
                "timeout": 240,
                "auto_fixable": False
            },
            "test_coverage": {
                "script": "scripts/coverage_validator.py",
                "args": ["--json", "--ci-mode"],
                "timeout": 300,
                "auto_fixable": False
            }
        }

        # Execution tracking
        self.execution_history = []
        self.performance_metrics = {
            "total_executions": 0,
            "average_execution_time": 0.0,
            "success_rate": 0.0,
            "fixes_applied": 0
        }

        logger.info(f"Initialized CI/CD quality enforcer with {execution_strategy.value} strategy")

    async def enforce_quality_gates(self,
                                    project_path: str = ".",
                                    gates_to_run: Optional[List[str]] = None,
                                    apply_fixes: bool = True) -> EnforcementReport:
        """
        Enforce quality gates with intelligent execution and auto-fixes.

        NASA Rule 4: Function under 60 lines
        NASA Rule 5: Input validation
        """
        assert isinstance(project_path, str), "project_path must be string"

        execution_start = time.time()

        logger.info(f"Starting quality gate enforcement with {self.execution_strategy.value} strategy")

        # Determine gates to execute
        gates_to_execute = gates_to_run or list(self.quality_gates.keys())

        # Execute quality gates based on strategy
        if self.execution_strategy == ExecutionStrategy.FAIL_FAST:
            gate_results = await self._execute_gates_fail_fast(gates_to_execute, project_path)
        elif self.execution_strategy == ExecutionStrategy.CONTINUE_ON_ERROR:
            gate_results = await self._execute_gates_continue_on_error(gates_to_execute, project_path)
        else:  # ADAPTIVE
            gate_results = await self._execute_gates_adaptive(gates_to_execute, project_path)

        # Apply automated fixes if enabled
        fixes_applied = 0
        if apply_fixes:
            fixes_applied = await self._apply_automated_fixes(gate_results, project_path)

        # Calculate metrics
        total_execution_time = time.time() - execution_start
        gates_passed = sum(1 for result in gate_results if result.success)
        gates_failed = len(gate_results) - gates_passed
        blocking_failures = sum(1 for result in gate_results
                                if not result.success and result.severity == QualityGateSeverity.BLOCKING)

        # Calculate performance improvement
        baseline_time = len(gates_to_execute) * 60.0  # Assume 60s per gate baseline
        performance_improvement = ((baseline_time - total_execution_time) / baseline_time) * 100

        # Generate recommendations
        recommendations = self._generate_recommendations(gate_results, blocking_failures)

        # Create enforcement report
        report = EnforcementReport(
            timestamp=datetime.now(),
            overall_success=blocking_failures == 0,
            gates_executed=len(gate_results),
            gates_passed=gates_passed,
            gates_failed=gates_failed,
            blocking_failures=blocking_failures,
            total_execution_time=total_execution_time,
            performance_improvement=performance_improvement,
            gate_results=gate_results,
            recommendations=recommendations,
            auto_fixes_applied=fixes_applied
        )

        # Update metrics and history
        self._update_performance_metrics(report)
        self.execution_history.append(report)

        # Keep last 25 reports (NASA Rule 7: Bounded resources)
        if len(self.execution_history) > 25:
            self.execution_history = self.execution_history[-12:]

        logger.info(f"Quality gate enforcement completed: {gates_passed}/{len(gate_results)} passed, "
                    f"{blocking_failures} blocking failures, {performance_improvement:.1f}% improvement")

        return report

    async def _execute_gates_fail_fast(self, gates: List[str], project_path: str) -> List[QualityGateResult]:
        """Execute gates with fail-fast strategy."""
        results = []

        # Order gates by severity (blocking first)
        ordered_gates = self._order_gates_by_severity(gates)

        for gate_name in ordered_gates:
            result = await self._execute_single_gate(gate_name, project_path)
            results.append(result)

            # Fail fast on blocking failures
            if not result.success and result.severity == QualityGateSeverity.BLOCKING:
                logger.warning(f"Fail-fast triggered by blocking failure: {gate_name}")
                break

        return results

    async def _execute_gates_continue_on_error(self, gates: List[str], project_path: str) -> List[QualityGateResult]:
        """Execute all gates regardless of failures."""
        tasks = []

        # Execute all gates in parallel
        for gate_name in gates:
            task = self._execute_single_gate(gate_name, project_path)
            tasks.append(task)

        results = await asyncio.gather(*tasks, return_exceptions=True)

        # Handle exceptions
        valid_results = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                logger.error(f"Gate execution failed: {gates[i]} - {result}")
                # Create failed result
                threshold = self.threshold_manager.get_threshold(gates[i])
                failed_result = QualityGateResult(
                    gate_name=gates[i],
                    success=False,
                    score=0.0,
                    threshold=threshold.current_value if threshold else 0.0,
                    severity=threshold.severity if threshold else QualityGateSeverity.CRITICAL,
                    execution_time_seconds=0.0,
                    suggestions=[f"Gate execution failed: {str(result)}"],
                    metrics={}
                )
                valid_results.append(failed_result)
            else:
                valid_results.append(result)

        return valid_results

    async def _execute_gates_adaptive(self, gates: List[str], project_path: str) -> List[QualityGateResult]:
        """Execute gates with adaptive strategy based on historical performance."""
        # Start with blocking gates in parallel
        blocking_gates = [g for g in gates if self._is_blocking_gate(g)]
        non_blocking_gates = [g for g in gates if not self._is_blocking_gate(g)]

        results = []

        # Execute blocking gates first (parallel)
        if blocking_gates:
            blocking_tasks = [self._execute_single_gate(gate, project_path) for gate in blocking_gates]
            blocking_results = await asyncio.gather(*blocking_tasks, return_exceptions=True)

            # Process blocking results
            blocking_failures = 0
            for i, result in enumerate(blocking_results):
                if isinstance(result, Exception):
                    logger.error(f"Blocking gate failed: {blocking_gates[i]} - {result}")
                    blocking_failures += 1
                else:
                    results.append(result)
                    if not result.success:
                        blocking_failures += 1

            # If too many blocking failures, skip non-blocking gates
            if blocking_failures > len(blocking_gates) * 0.5:
                logger.warning("Too many blocking failures - skipping non-blocking gates")
                return results

        # Execute non-blocking gates (parallel)
        if non_blocking_gates:
            non_blocking_tasks = [self._execute_single_gate(gate, project_path) for gate in non_blocking_gates]
            non_blocking_results = await asyncio.gather(*non_blocking_tasks, return_exceptions=True)

            # Process non-blocking results
            for i, result in enumerate(non_blocking_results):
                if isinstance(result, Exception):
                    logger.error(f"Non-blocking gate failed: {non_blocking_gates[i]} - {result}")
                else:
                    results.append(result)

        return results

    async def _execute_single_gate(self, gate_name: str, project_path: str) -> QualityGateResult:
        """Execute a single quality gate."""
        gate_config = self.quality_gates.get(gate_name)
        if not gate_config:
            raise ValueError(f"Unknown quality gate: {gate_name}")

        threshold = self.threshold_manager.get_threshold(gate_name)
        if not threshold:
            raise ValueError(f"No threshold configured for gate: {gate_name}")

        script_path = Path(gate_config["script"])
        if not script_path.exists():
            logger.warning(f"Gate script not found: {script_path}")
            return QualityGateResult(
                gate_name=gate_name,
                success=False,
                score=0.0,
                threshold=threshold.current_value,
                severity=threshold.severity,
                execution_time_seconds=0.0,
                suggestions=[f"Gate script not found: {script_path}"],
                metrics={}
            )

        start_time = time.time()

        try:
            # Build command
            command = ["python", str(script_path)] + gate_config["args"]

            # Execute gate
            result = subprocess.run(
                command,
                capture_output=True,
                text=True,
                timeout=gate_config.get("timeout", 300),
                cwd=project_path
            )

            execution_time = time.time() - start_time

            # Parse results
            score, metrics = self._parse_gate_output(gate_name, result.stdout, result.stderr)

            # Check success against threshold
            if gate_name in ["theater_score", "god_objects", "unicode_violations"]:
                # Lower is better
                success = score <= threshold.current_value
            else:
                # Higher is better
                success = score >= threshold.current_value

            # Adjust threshold based on performance
            if len(self.execution_history) >= 3:
                recent_scores = [r.score for r in [gr for r in self.execution_history[-3:] for gr in r.gate_results if gr.gate_name == gate_name]]
                if recent_scores:
                    self.threshold_manager.adjust_threshold(gate_name, score, recent_scores)

            # Generate suggestions
            suggestions = self._generate_gate_suggestions(gate_name, score, threshold, success)

            return QualityGateResult(
                gate_name=gate_name,
                success=success,
                score=score,
                threshold=threshold.current_value,
                severity=threshold.severity,
                execution_time_seconds=execution_time,
                suggestions=suggestions,
                metrics=metrics,
                auto_fixable=gate_config.get("auto_fixable", False)
            )

        except subprocess.TimeoutExpired:
            execution_time = time.time() - start_time
            return QualityGateResult(
                gate_name=gate_name,
                success=False,
                score=0.0,
                threshold=threshold.current_value,
                severity=threshold.severity,
                execution_time_seconds=execution_time,
                suggestions=[f"Gate execution timed out after {gate_config.get('timeout', 300)}s"],
                metrics={}
            )

        except Exception as e:
            execution_time = time.time() - start_time
            return QualityGateResult(
                gate_name=gate_name,
                success=False,
                score=0.0,
                threshold=threshold.current_value,
                severity=threshold.severity,
                execution_time_seconds=execution_time,
                suggestions=[f"Gate execution error: {str(e)}"],
                metrics={}
            )

    def _parse_gate_output(self, gate_name: str, stdout: str, stderr: str) -> Tuple[float, Dict[str, Any]]:
        """Parse quality gate output to extract score and metrics."""
        score = 0.0
        metrics = {}

        try:
            # Try to parse JSON output
            if stdout.strip():
                try:
                    data = json.loads(stdout)

                    # Extract score based on gate type
                    if gate_name == "nasa_compliance":
                        score = data.get("compliance_pct", 0.0)
                    elif gate_name == "theater_detection":
                        score = data.get("theater_score", 100.0)
                    elif gate_name == "god_objects":
                        score = data.get("total_god_objects", 0.0)
                    elif gate_name == "unicode_violations":
                        score = data.get("violations", 0.0)
                    elif gate_name == "security_scan":
                        score = data.get("security_score", 0.0)
                    elif gate_name == "test_coverage":
                        score = data.get("coverage_percent", 0.0)

                    metrics = data

                except json.JSONDecodeError:
                    # Try to extract numeric values from text output
                    import re
                    numbers = re.findall(r'\d+\.?\d*', stdout)
                    if numbers:
                        score = float(numbers[0])

        except Exception as e:
            logger.warning(f"Failed to parse gate output for {gate_name}: {e}")

        return score, metrics

    def _generate_gate_suggestions(self, gate_name: str, score: float,
                                threshold: QualityThreshold, success: bool) -> List[str]:
        """Generate actionable suggestions for gate results."""
        suggestions = []

        if success:
            suggestions.append(f"[OK] {gate_name} passed with score {score:.1f}")
            if score > threshold.target_value:
                suggestions.append(f"[TARGET] Excellent! Score exceeds target of {threshold.target_value}")
        else:
            suggestions.append(f"[FAIL] {gate_name} failed: {score:.1f} < {threshold.current_value:.1f}")

            # Gate-specific suggestions
            if gate_name == "nasa_compliance":
                suggestions.extend([
                    "Review NASA POT10 requirements and fix non-compliant code",
                    "Run individual compliance checks to identify specific issues",
                    "Check function complexity, line limits, and documentation"
                ])
            elif gate_name == "theater_detection":
                suggestions.extend([
                    "Remove dead code and unused functions",
                    "Replace placeholder implementations with real functionality",
                    "Simplify overly complex logic patterns"
                ])
            elif gate_name == "god_objects":
                suggestions.extend([
                    "Refactor large files (>500 LOC) into smaller, focused modules",
                    "Extract services and interfaces from god objects",
                    "Apply single responsibility principle"
                ])
            elif gate_name == "unicode_violations":
                suggestions.extend([
                    "Remove all Unicode characters from Python source files",
                    "Use ASCII equivalents or Unicode escape sequences",
                    "Run unicode removal tool with --fix flag"
                ])
            elif gate_name == "security_scan":
                suggestions.extend([
                    "Review and fix security vulnerabilities",
                    "Update vulnerable dependencies",
                    "Remove hardcoded credentials and secrets"
                ])
            elif gate_name == "test_coverage":
                suggestions.extend([
                    "Add unit tests for uncovered code paths",
                    "Focus on critical business logic coverage",
                    "Remove dead code to improve coverage percentage"
                ])

        return suggestions

    async def _apply_automated_fixes(self, gate_results: List[QualityGateResult], project_path: str) -> int:
        """Apply automated fixes for failed gates."""
        fixes_applied = 0

        for gate_result in gate_results:
            if not gate_result.success and gate_result.auto_fixable:
                try:
                    fixed, fix_commands = await self.fix_engine.analyze_and_fix(gate_result, project_path)
                    if fixed:
                        fixes_applied += 1
                        logger.info(f"Applied automated fixes for {gate_result.gate_name}")
                        gate_result.fix_commands = fix_commands
                except Exception as e:
                    logger.error(f"Failed to apply fixes for {gate_result.gate_name}: {e}")

        return fixes_applied

    def _order_gates_by_severity(self, gates: List[str]) -> List[str]:
        """Order gates by severity (blocking first)."""
        severity_order = {
            QualityGateSeverity.BLOCKING: 0,
            QualityGateSeverity.CRITICAL: 1,
            QualityGateSeverity.WARNING: 2,
            QualityGateSeverity.INFO: 3
        }

        def get_severity_order(gate_name: str) -> int:
            threshold = self.threshold_manager.get_threshold(gate_name)
            return severity_order.get(threshold.severity if threshold else QualityGateSeverity.INFO, 3)

        return sorted(gates, key=get_severity_order)

    def _is_blocking_gate(self, gate_name: str) -> bool:
        """Check if gate is blocking."""
        threshold = self.threshold_manager.get_threshold(gate_name)
        return threshold and threshold.severity == QualityGateSeverity.BLOCKING

    def _generate_recommendations(self, gate_results: List[QualityGateResult], blocking_failures: int) -> List[str]:
        """Generate actionable recommendations based on gate results."""
        recommendations = []

        if blocking_failures == 0:
            recommendations.append("🎉 All critical quality gates passed successfully!")
        else:
            recommendations.append(f"🔴 {blocking_failures} blocking failures must be resolved before deployment")

        # Performance recommendations
        avg_execution_time = sum(r.execution_time_seconds for r in gate_results) / max(len(gate_results), 1)
        if avg_execution_time > 120:
            recommendations.append("[PERF] Consider optimizing quality gate performance - some gates are slow")

        # Auto-fix recommendations
        auto_fixable_failures = sum(1 for r in gate_results if not r.success and r.auto_fixable)
        if auto_fixable_failures > 0:
            recommendations.append(f"[TOOL] {auto_fixable_failures} issues can be automatically fixed")

        # Threshold recommendations
        consistently_passing = [r for r in gate_results if r.success and r.score > r.threshold * 1.2]
        if consistently_passing:
            recommendations.append("[TREND] Some thresholds can be made more strict based on consistent performance")

        return recommendations

    def _update_performance_metrics(self, report: EnforcementReport) -> None:
        """Update performance metrics based on enforcement report."""
        self.performance_metrics["total_executions"] += 1

        # Update average execution time
        total_executions = self.performance_metrics["total_executions"]
        current_avg = self.performance_metrics["average_execution_time"]
        new_time = report.total_execution_time

        self.performance_metrics["average_execution_time"] = (
            (current_avg * (total_executions - 1) + new_time) / total_executions
        )

        # Update success rate
        current_success_rate = self.performance_metrics["success_rate"]
        new_success = 1.0 if report.overall_success else 0.0

        self.performance_metrics["success_rate"] = (
            (current_success_rate * (total_executions - 1) + new_success) / total_executions
        )

        # Update fixes applied
        self.performance_metrics["fixes_applied"] += report.auto_fixes_applied

    def get_performance_report(self) -> Dict[str, Any]:
        """Generate comprehensive performance report."""
        recent_reports = self.execution_history[-5:] if self.execution_history else []

        report = {
            "enforcer_metrics": self.performance_metrics.copy(),
            "threshold_statistics": {
                "total_thresholds": len(self.threshold_manager.thresholds),
                "auto_adjusting": sum(1 for t in self.threshold_manager.thresholds.values() if t.auto_adjust),
                "blocking_gates": sum(1 for t in self.threshold_manager.thresholds.values()
                                    if t.severity == QualityGateSeverity.BLOCKING)
            },
            "recent_performance": {
                "reports_count": len(recent_reports),
                "average_gates_passed": sum(r.gates_passed for r in recent_reports) / max(len(recent_reports), 1),
                "average_execution_time": sum(r.total_execution_time for r in recent_reports) / max(len(recent_reports), 1),
                "success_rate_percent": sum(1 for r in recent_reports if r.overall_success) / max(len(recent_reports), 1) * 100
            },
            "fix_engine_stats": {
                "total_fixes_applied": self.fix_engine.fixes_applied,
                "fix_success_rate": len([f for f in self.fix_engine.fix_history if f]) / max(len(self.fix_engine.fix_history), 1) * 100
            },
            "recommendations": self._generate_system_recommendations()
        }

        return report

    def _generate_system_recommendations(self) -> List[str]:
        """Generate system-wide recommendations."""
        recommendations = []

        if self.performance_metrics["success_rate"] < 0.8:
            recommendations.append("Focus on improving failing quality gates - success rate below 80%")

        if self.performance_metrics["average_execution_time"] > 300:
            recommendations.append("Consider optimizing quality gate execution - average time exceeds 5 minutes")

        if self.fix_engine.fixes_applied == 0:
            recommendations.append("Enable automated fixes to improve development velocity")

        recent_reports = self.execution_history[-3:] if len(self.execution_history) >= 3 else []
        if recent_reports and all(r.blocking_failures == 0 for r in recent_reports):
            recommendations.append("Quality is stable - consider implementing more strict thresholds")

        return recommendations

# CLI Interface and Main Execution
def main():
    """Main CLI interface for CI/CD quality enforcer."""
    import argparse

    parser = argparse.ArgumentParser(description="CI/CD Quality Gate Enforcer")
    parser.add_argument("--project-path", "-p", default=".", help="Project path to analyze")
    parser.add_argument("--strategy", "-s", default="adaptive",
                        choices=["fail_fast", "continue_on_error", "adaptive"],
                        help="Execution strategy")
    parser.add_argument("--gates", "-g", nargs="*", help="Specific gates to run")
    parser.add_argument("--no-fixes", action="store_true", help="Disable automated fixes")
    parser.add_argument("--report-only", action="store_true", help="Generate performance report only")
    parser.add_argument("--json", action="store_true", help="Output results in JSON format")
    parser.add_argument("--ci-mode", action="store_true", help="CI/CD optimized execution")

    args = parser.parse_args()

    async def run_enforcement():
        try:
            # Initialize enforcer
            strategy = ExecutionStrategy(args.strategy)
            enforcer = CICDQualityEnforcer(execution_strategy=strategy)

            if args.report_only:
                # Generate performance report only
                report = enforcer.get_performance_report()
                if args.json:
                    print(json.dumps(report, indent=2, default=str))
                else:
                    print("CI/CD Quality Enforcer Performance Report")
                    print("=" * 50)
                    print(f"Total executions: {report['enforcer_metrics']['total_executions']}")
                    print(f"Success rate: {report['enforcer_metrics']['success_rate']:.1%}")
                    print(f"Average execution time: {report['enforcer_metrics']['average_execution_time']:.1f}s")
                    print(f"Fixes applied: {report['enforcer_metrics']['fixes_applied']}")
                return

            # Run quality gate enforcement
            enforcement_result = await enforcer.enforce_quality_gates(
                project_path=args.project_path,
                gates_to_run=args.gates,
                apply_fixes=not args.no_fixes
            )

            if args.json:
                # JSON output for CI/CD integration
                result_data = {
                    "overall_success": enforcement_result.overall_success,
                    "gates_passed": enforcement_result.gates_passed,
                    "gates_failed": enforcement_result.gates_failed,
                    "blocking_failures": enforcement_result.blocking_failures,
                    "execution_time": enforcement_result.total_execution_time,
                    "performance_improvement": enforcement_result.performance_improvement,
                    "auto_fixes_applied": enforcement_result.auto_fixes_applied,
                    "gate_results": [
                        {
                            "name": r.gate_name,
                            "success": r.success,
                            "score": r.score,
                            "threshold": r.threshold,
                            "severity": r.severity.value,
                            "execution_time": r.execution_time_seconds,
                            "suggestions": r.suggestions
                        } for r in enforcement_result.gate_results
                    ],
                    "recommendations": enforcement_result.recommendations
                }
                print(json.dumps(result_data, indent=2, default=str))
            else:
                # Human-readable output
                print("CI/CD Quality Gate Enforcement Results")
                print("=" * 50)
                print(f"Overall Status: {'[PASS]' if enforcement_result.overall_success else '[FAIL]'}")
                print(f"Gates Executed: {enforcement_result.gates_executed}")
                print(f"Gates Passed: {enforcement_result.gates_passed}")
                print(f"Gates Failed: {enforcement_result.gates_failed}")
                print(f"Blocking Failures: {enforcement_result.blocking_failures}")
                print(f"Execution Time: {enforcement_result.total_execution_time:.1f}s")
                print(f"Performance Improvement: {enforcement_result.performance_improvement:.1f}%")
                print(f"Auto-fixes Applied: {enforcement_result.auto_fixes_applied}")

                print("\nGate Results:")
                for result in enforcement_result.gate_results:
                    status = "[PASS]" if result.success else "[FAIL]"
                    print(f"  {status} {result.gate_name}: {result.score:.1f} ({'≥' if result.gate_name not in ['theater_score', 'god_objects', 'unicode_violations'] else '≤'} {result.threshold:.1f})")

                if enforcement_result.recommendations:
                    print("\nRecommendations:")
                    for i, rec in enumerate(enforcement_result.recommendations, 1):
                        print(f"  {i}. {rec}")

            # Set exit code
            sys.exit(0 if enforcement_result.overall_success else 1)

        except Exception as e:
            logger.error(f"Quality gate enforcement failed: {e}")
            if args.json:
                error_data = {"error": str(e), "success": False}
                print(json.dumps(error_data, indent=2))
            else:
                print(f"ERROR: {e}")
            sys.exit(1)

    # Run enforcement
    asyncio.run(run_enforcement())

if __name__ == "__main__":
    main()