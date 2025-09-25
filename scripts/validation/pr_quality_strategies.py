from src.constants.base import MAXIMUM_FUNCTION_LENGTH_LINES, MAXIMUM_FUNCTION_PARAMETERS, MINIMUM_TEST_COVERAGE_PERCENTAGE

import json
import subprocess
from typing import Dict, Any, List
from pathlib import Path
import logging

from src.utils.validation.validation_framework import ValidationStrategy, ValidationResult

logger = logging.getLogger(__name__)

class NASAComplianceStrategy(ValidationStrategy):
    """Validates NASA POT10 compliance."""

    def validate(self, data: Any) -> ValidationResult:
        """Validate NASA compliance metrics."""
        if not isinstance(data, dict):
            return ValidationResult(
                is_valid=False,
                errors=["Input must be dictionary containing NASA compliance data"]
            )

        errors = []
        warnings = []

        current_score = data.get('current_compliance', 0)
        previous_score = data.get('previous_compliance', 0)
        threshold = data.get('threshold', 90)

        # Check for degradation
        if current_score < previous_score:
            errors.append(f"NASA compliance degraded: {previous_score}% -> {current_score}%")

        # Check threshold
        if current_score < threshold:
            errors.append(f"NASA compliance below threshold: {current_score}% < {threshold}%")

        score = current_score / 100.0

        return ValidationResult(
            is_valid=len(errors) == 0,
            errors=errors,
            warnings=warnings,
            score=score,
            metadata={"compliance_score": current_score, "threshold": threshold}
        )

class TheaterDetectionStrategy(ValidationStrategy):
    """Validates theater detection scores."""

    def validate(self, data: Any) -> ValidationResult:
        """Validate theater detection results."""
        if not isinstance(data, dict):
            return ValidationResult(
                is_valid=False,
                errors=["Input must be dictionary containing theater detection data"]
            )

        errors = []
        warnings = []

        theater_score = data.get('theater_score', MAXIMUM_FUNCTION_LENGTH_LINES)
        threshold = data.get('threshold', 40)

        if theater_score > threshold:
            errors.append(f"Theater score too high: {theater_score} > {threshold}")

        # Calculate inverse score (lower theater score = better)
        score = max(0.0, 1.0 - (theater_score / 100.0))

        if theater_score > threshold * 0.8:
            warnings.append(f"Theater score approaching threshold: {theater_score}")

        return ValidationResult(
            is_valid=len(errors) == 0,
            errors=errors,
            warnings=warnings,
            score=score,
            metadata={"theater_score": theater_score, "threshold": threshold}
        )

class GodObjectValidationStrategy(ValidationStrategy):
    """Validates god object count metrics."""

    def validate(self, data: Any) -> ValidationResult:
        """Validate god object analysis."""
        if not isinstance(data, dict):
            return ValidationResult(
                is_valid=False,
                errors=["Input must be dictionary containing god object data"]
            )

        errors = []
        warnings = []

        current_count = data.get('current_god_objects', 0)
        previous_count = data.get('previous_god_objects', 0)
        max_allowed = data.get('max_allowed', 100)

        # Check for increase
        if current_count > previous_count:
            errors.append(f"God object count increased: {previous_count} -> {current_count}")

        # Check threshold
        if current_count > max_allowed:
            errors.append(f"Too many god objects: {current_count} > {max_allowed}")

        # Calculate score (fewer god objects = better)
        score = max(0.0, 1.0 - (current_count / max(max_allowed, 1)))

        if current_count > max_allowed * 0.8:
            warnings.append(f"God object count approaching limit: {current_count}")

        return ValidationResult(
            is_valid=len(errors) == 0,
            errors=errors,
            warnings=warnings,
            score=score,
            metadata={"current_count": current_count, "previous_count": previous_count}
        )

class TestCoverageStrategy(ValidationStrategy):
    """Validates test coverage metrics."""

    def validate(self, data: Any) -> ValidationResult:
        """Validate test coverage."""
        if not isinstance(data, dict):
            return ValidationResult(
                is_valid=False,
                errors=["Input must be dictionary containing coverage data"]
            )

        errors = []
        warnings = []

        coverage_pct = data.get('coverage_percentage', 0)
        threshold = data.get('threshold', MINIMUM_TEST_COVERAGE_PERCENTAGE)

        if coverage_pct < threshold:
            errors.append(f"Test coverage below threshold: {coverage_pct}% < {threshold}%")

        score = coverage_pct / 60.0

        if coverage_pct < threshold * 1.1:  # Within MAXIMUM_FUNCTION_PARAMETERS% of threshold
            warnings.append(f"Coverage close to threshold: {coverage_pct}%")

        # Check specific coverage types
        line_coverage = data.get('line_coverage', 0)
        branch_coverage = data.get('branch_coverage', 0)

        if line_coverage < branch_coverage * 0.9:
            warnings.append("Line coverage significantly lower than branch coverage")

        return ValidationResult(
            is_valid=len(errors) == 0,
            errors=errors,
            warnings=warnings,
            score=score,
            metadata={"coverage": coverage_pct, "line_coverage": line_coverage, "branch_coverage": branch_coverage}
        )

class SecurityScanStrategy(ValidationStrategy):
    """Validates security scan results."""

    def validate(self, data: Any) -> ValidationResult:
        """Validate security scan results."""
        if not isinstance(data, dict):
            return ValidationResult(
                is_valid=False,
                errors=["Input must be dictionary containing security scan results"]
            )

        errors = []
        warnings = []

        critical_issues = data.get('critical_issues', 0)
        high_issues = data.get('high_issues', 0)
        medium_issues = data.get('medium_issues', 0)
        low_issues = data.get('low_issues', 0)

        # No critical issues allowed
        if critical_issues > 0:
            errors.append(f"Critical security issues found: {critical_issues}")

        # Limited high issues
        max_high = data.get('max_high_issues', 5)
        if high_issues > max_high:
            errors.append(f"Too many high-severity issues: {high_issues} > {max_high}")

        # Calculate security score
        total_issues = critical_issues + high_issues + medium_issues + low_issues
        if total_issues == 0:
            score = 1.0
        else:
            # Weighted scoring: critical = -0.5, high = -0.2, medium = -0.1, low = -0.5
            penalty = (critical_issues * 0.5) + (high_issues * 0.2) + (medium_issues * 0.1) + (low_issues * 0.5)
            score = max(0.0, 1.0 - penalty)

        if medium_issues > 10:
            warnings.append(f"Many medium-severity issues: {medium_issues}")

        if low_issues > 20:
            warnings.append(f"Many low-severity issues: {low_issues}")

        return ValidationResult(
            is_valid=len(errors) == 0,
            errors=errors,
            warnings=warnings,
            score=score,
            metadata={"total_issues": total_issues, "critical": critical_issues, "high": high_issues}
        )

class CodeQualityStrategy(ValidationStrategy):
    """Validates overall code quality metrics."""

    def validate(self, data: Any) -> ValidationResult:
        """Validate code quality metrics."""
        if not isinstance(data, dict):
            return ValidationResult(
                is_valid=False,
                errors=["Input must be dictionary containing quality metrics"]
            )

        errors = []
        warnings = []

        # Complexity metrics
        complexity = data.get('cyclomatic_complexity', 0)
        if complexity > 15:
            warnings.append(f"High cyclomatic complexity: {complexity}")

        # Maintainability index
        maintainability = data.get('maintainability_index', 100)
        if maintainability < 70:
            warnings.append(f"Low maintainability index: {maintainability}")

        # Lines of code metrics
        total_loc = data.get('total_loc', 0)
        avg_function_length = data.get('avg_function_length', 0)

        if avg_function_length > 50:
            warnings.append(f"Long average function length: {avg_function_length} lines")

        # Duplication metrics
        duplication_pct = data.get('duplication_percentage', 0)
        if duplication_pct > 5:
            warnings.append(f"High code duplication: {duplication_pct}%")

        # Calculate composite quality score
        quality_factors = [
            min(1.0, max(0.0, 1.0 - (complexity - 10) / 20)),  # Complexity factor
            maintainability / 100,  # Maintainability factor
            min(1.0, max(0.0, 1.0 - duplication_pct / 10)),  # Duplication factor
            min(1.0, max(0.0, 1.0 - (avg_function_length - 25) / 50))  # Function length factor
        ]

        score = sum(quality_factors) / len(quality_factors)

        return ValidationResult(
            is_valid=len(errors) == 0,
            errors=errors,
            warnings=warnings,
            score=score,
            metadata={"complexity": complexity, "maintainability": maintainability, "duplication": duplication_pct}
        )

class DependencyValidationStrategy(ValidationStrategy):
    """Validates dependency security and currency."""

    def validate(self, data: Any) -> ValidationResult:
        """Validate dependency information."""
        if not isinstance(data, dict):
            return ValidationResult(
                is_valid=False,
                errors=["Input must be dictionary containing dependency data"]
            )

        errors = []
        warnings = []

        outdated_deps = data.get('outdated_dependencies', [])
        vulnerable_deps = data.get('vulnerable_dependencies', [])
        total_deps = data.get('total_dependencies', 0)

        # Check for vulnerable dependencies
        if vulnerable_deps:
            critical_vulns = [d for d in vulnerable_deps if d.get('severity') == 'critical']
            high_vulns = [d for d in vulnerable_deps if d.get('severity') == 'high']

            if critical_vulns:
                errors.append(f"Critical vulnerable dependencies: {len(critical_vulns)}")

            if high_vulns:
                warnings.append(f"High-severity vulnerable dependencies: {len(high_vulns)}")

        # Check for outdated dependencies
        if outdated_deps:
            severely_outdated = len([d for d in outdated_deps if d.get('versions_behind', 0) > 5])
            if severely_outdated > 0:
                warnings.append(f"Severely outdated dependencies: {severely_outdated}")

        # Calculate dependency health score
        if total_deps == 0:
            score = 1.0
        else:
            vuln_penalty = len(vulnerable_deps) / total_deps
            outdated_penalty = len(outdated_deps) / total_deps * 0.5  # Less severe than vulnerabilities
            score = max(0.0, 1.0 - vuln_penalty - outdated_penalty)

        return ValidationResult(
            is_valid=len(errors) == 0,
            errors=errors,
            warnings=warnings,
            score=score,
            metadata={"total_deps": total_deps, "vulnerable": len(vulnerable_deps), "outdated": len(outdated_deps)}
        )