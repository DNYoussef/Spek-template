from src.constants.base import API_TIMEOUT_SECONDS, MAXIMUM_FUNCTION_LENGTH_LINES, MAXIMUM_RETRY_ATTEMPTS

import os
import re
import json
import subprocess
import ast
from typing import List, Dict, Any, Optional, Tuple, Union
from dataclasses import dataclass
from datetime import datetime
from enum import Enum

class ValidationLevel(Enum):
    """Levels of validation rigor."""
    BASIC = "basic"
    STANDARD = "standard"
    RIGOROUS = "rigorous"
    FORENSIC = "forensic"

class ValidationType(Enum):
    """Types of reality validation."""
    METRICS_REALITY = "metrics_reality"
    IMPLEMENTATION_REALITY = "implementation_reality"
    TEST_REALITY = "test_reality"
    PERFORMANCE_REALITY = "performance_reality"
    SECURITY_REALITY = "security_reality"

@dataclass
class ValidationResult:
    """Result of a reality validation check."""
    validation_type: ValidationType
    is_genuine: bool
    confidence: float
    evidence: Dict[str, Any]
    issues_found: List[str]
    recommendations: List[str]
    score: float  # 0-100, higher is more genuine

@dataclass
class QualityGate:
    """Quality gate with reality validation."""
    name: str
    threshold: float
    actual_value: float
    claimed_value: float
    passes_reality_check: bool
    validation_evidence: Dict[str, Any]

@dataclass
class RealityCheck:
    """Complete reality validation assessment."""
    target: str
    timestamp: str
    overall_genuine: bool
    reality_score: float
    validation_results: List[ValidationResult]
    quality_gates: List[QualityGate]
    summary: Dict[str, Any]

class RealityValidationEngine:
    """Main reality validation engine."""

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}

    def validate_test_reality(self, directory: str) -> ValidationResult:
        """Validate that test metrics represent real testing."""
        evidence = {}
        issues = []
        recommendations = []

        # Count test files and functions
        test_files = []
        total_test_functions = 0
        empty_tests = 0
        meaningful_assertions = 0

        for root, dirs, files in os.walk(directory):
            for file in files:
                if 'test' in file and file.endswith('.py'):
                    file_path = os.path.join(root, file)
                    test_files.append(file_path)

                    try:
                        with open(file_path, 'r', encoding='utf-8') as f:
                            content = f.read()

                        # Analyze test structure
                        file_tests, file_empty, file_assertions = self._analyze_test_file(content)
                        total_test_functions += file_tests
                        empty_tests += file_empty
                        meaningful_assertions += file_assertions

                    except Exception:
                        continue

        evidence.update({
            "test_files_count": len(test_files),
            "total_test_functions": total_test_functions,
            "empty_tests": empty_tests,
            "meaningful_assertions": meaningful_assertions,
            "empty_test_ratio": empty_tests / max(1, total_test_functions)
        })

        # Reality checks
        if empty_tests > meaningful_assertions:
            issues.append("More empty tests than meaningful tests")
            recommendations.append("Replace empty tests with actual validation logic")

        if total_test_functions > 0 and meaningful_assertions == 0:
            issues.append("Tests exist but contain no meaningful assertions")
            recommendations.append("Add proper assertions to validate behavior")

        # Check for actual test execution
        try:
            # Try to run tests and capture output
            result = subprocess.run(
                ["python", "-m", "pytest", "--collect-only", "-q"],
                cwd=directory,
                capture_output=True,
                text=True,
                timeout=30
            )

            if result.returncode == 0:
                # Parse collection output
                lines = result.stdout.split('\n')
                collected_tests = [line for line in lines if 'collected' in line.lower()]
                evidence["pytest_collection"] = collected_tests
            else:
                issues.append("Tests fail to collect properly")
                evidence["collection_error"] = result.stderr

        except Exception as e:
            issues.append(f"Could not execute test collection: {str(e)}")

        # Calculate reality score
        score = self._calculate_test_reality_score(evidence)

        return ValidationResult(
            validation_type=ValidationType.TEST_REALITY,
            is_genuine=score >= 70,
            confidence=0.8,
            evidence=evidence,
            issues_found=issues,
            recommendations=recommendations,
            score=score
        )

    def validate_metrics_reality(self, metrics: Dict[str, Any]) -> ValidationResult:
        """Validate that metrics represent genuine measurements."""
        evidence = {}
        issues = []
        recommendations = []

        # Check for suspiciously perfect values
        perfect_values = [100, 100.0, 1.0, "perfect", "excellent", "A+"]
        suspicious_metrics = []

        for metric_name, value in metrics.items():
            if value in perfect_values:
                suspicious_metrics.append(metric_name)
                issues.append(f"Perfect value for {metric_name}: {value}")

        evidence["suspicious_perfect_metrics"] = suspicious_metrics

        # Check for impossible combinations
        if ("test_coverage" in metrics and "bug_count" in metrics):
            coverage = float(metrics.get("test_coverage", 0))
            bugs = int(metrics.get("bug_count", 0))

            if coverage == MAXIMUM_FUNCTION_LENGTH_LINES and bugs == 0:
                issues.append("100% coverage with 0 bugs is statistically unlikely")
                recommendations.append("Verify test quality and bug tracking accuracy")

        # Check for rounded values (potential gaming)
        rounded_metrics = []
        for metric_name, value in metrics.items():
            if isinstance(value, (int, float)):
                if value == round(value) and value > 10:
                    rounded_metrics.append(metric_name)

        if len(rounded_metrics) > len(metrics) * 0.8:  # More than 80% rounded
            issues.append("Too many metrics are perfectly rounded numbers")
            evidence["rounded_metrics"] = rounded_metrics

        # Calculate reality score
        score = self._calculate_metrics_reality_score(metrics, len(issues))

        return ValidationResult(
            validation_type=ValidationType.METRICS_REALITY,
            is_genuine=len(issues) <= 2,
            confidence=0.7,
            evidence=evidence,
            issues_found=issues,
            recommendations=recommendations,
            score=score
        )

    def validate_implementation_reality(self, directory: str) -> ValidationResult:
        """Validate that implementation represents real functional changes."""
        evidence = {}
        issues = []
        recommendations = []

        # Analyze code changes
        try:
            # Get git diff statistics
            result = subprocess.run(
                ["git", "diff", "--stat", "HEAD~1", "HEAD"],
                cwd=directory,
                capture_output=True,
                text=True,
                timeout=30
            )

            if result.returncode == 0:
                diff_stats = self._parse_git_diff_stats(result.stdout)
                evidence.update(diff_stats)

                # Get detailed diff
                result = subprocess.run(
                    ["git", "diff", "HEAD~1", "HEAD"],
                    cwd=directory,
                    capture_output=True,
                    text=True,
                    timeout=30
                )

                if result.returncode == 0:
                    change_analysis = self._analyze_code_changes(result.stdout)
                    evidence.update(change_analysis)

                    # Reality checks
                    if change_analysis.get("cosmetic_changes", 0) > change_analysis.get("functional_changes", 0) * 2:
                        issues.append("Changes appear mostly cosmetic")
                        recommendations.append("Focus on functional improvements")

        except Exception as e:
            issues.append(f"Could not analyze implementation changes: {str(e)}")

        # Check for actual functionality
        python_files = []
        for root, dirs, files in os.walk(directory):
            for file in files:
                if file.endswith('.py'):
                    python_files.append(os.path.join(root, file))

        functional_indicators = 0
        for file_path in python_files[:10]:  # Sample first 10 files
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()

                # Look for functional code patterns
                if self._has_functional_code(content):
                    functional_indicators += 1

            except Exception:
                continue

        evidence["functional_file_ratio"] = functional_indicators / max(1, len(python_files[:10]))

        score = self._calculate_implementation_reality_score(evidence)

        return ValidationResult(
            validation_type=ValidationType.IMPLEMENTATION_REALITY,
            is_genuine=score >= 60,
            confidence=0.75,
            evidence=evidence,
            issues_found=issues,
            recommendations=recommendations,
            score=score
        )

    def validate_performance_reality(self, directory: str, claims: Dict[str, Any]) -> ValidationResult:
        """Validate performance improvement claims."""
        evidence = {}
        issues = []
        recommendations = []

        # Check for performance measurement evidence
        perf_files = []
        for root, dirs, files in os.walk(directory):
            for file in files:
                if any(keyword in file.lower() for keyword in ['benchmark', 'performance', 'perf', 'timing']):
                    perf_files.append(os.path.join(root, file))

        evidence["performance_files_found"] = len(perf_files)

        # Analyze performance claims
        claimed_improvements = claims.get("performance_improvements", {})
        for metric, improvement in claimed_improvements.items():
            if isinstance(improvement, (int, float)):
                if improvement > 1000:  # >1000% improvement
                    issues.append(f"Claimed {improvement}% improvement in {metric} seems unrealistic")
                elif improvement == round(improvement):  # Perfectly rounded
                    issues.append(f"Performance improvement of exactly {improvement}% seems suspicious")

        evidence["performance_claims"] = claimed_improvements

        # Look for actual performance code
        has_performance_code = False
        for file_path in perf_files:
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()

                if self._has_performance_measurement_code(content):
                    has_performance_code = True
                    break

            except Exception:
                continue

        evidence["has_performance_measurement"] = has_performance_code

        if not has_performance_code and claimed_improvements:
            issues.append("Performance improvements claimed but no measurement code found")
            recommendations.append("Add performance benchmarks to validate claims")

        score = self._calculate_performance_reality_score(evidence, len(issues))

        return ValidationResult(
            validation_type=ValidationType.PERFORMANCE_REALITY,
            is_genuine=score >= 70,
            confidence=0.8,
            evidence=evidence,
            issues_found=issues,
            recommendations=recommendations,
            score=score
        )

    def comprehensive_reality_check(self, target: str, claims: Optional[Dict[str, Any]] = None) -> RealityCheck:
        """Perform comprehensive reality validation."""
        claims = claims or {}
        validation_results = []

        # Run all validation types
        validation_results.append(self.validate_test_reality(target))
        validation_results.append(self.validate_implementation_reality(target))

        if claims.get("metrics"):
            validation_results.append(self.validate_metrics_reality(claims["metrics"]))

        if claims.get("performance_improvements"):
            validation_results.append(self.validate_performance_reality(target, claims))

        # Calculate overall reality score
        total_score = sum(result.score for result in validation_results)
        avg_score = total_score / len(validation_results) if validation_results else 0

        # Determine overall genuineness
        genuine_count = sum(1 for result in validation_results if result.is_genuine)
        overall_genuine = genuine_count >= len(validation_results) * 0.75

        # Generate quality gates
        quality_gates = self._generate_quality_gates(validation_results, claims)

        # Summary
        summary = {
            "total_validations": len(validation_results),
            "genuine_validations": genuine_count,
            "average_score": avg_score,
            "overall_genuine": overall_genuine,
            "key_issues": [issue for result in validation_results for issue in result.issues_found[:2]],
            "key_recommendations": [rec for result in validation_results for rec in result.recommendations[:2]]
        }

        return RealityCheck(
            target=target,
            timestamp=datetime.now().isoformat(),
            overall_genuine=overall_genuine,
            reality_score=avg_score,
            validation_results=validation_results,
            quality_gates=quality_gates,
            summary=summary
        )

    def _analyze_test_file(self, content: str) -> Tuple[int, int, int]:
        """Analyze test file for functions, empty tests, and assertions."""
        test_functions = 0
        empty_tests = 0
        meaningful_assertions = 0

        try:
            tree = ast.parse(content)

            for node in ast.walk(tree):
                if isinstance(node, ast.FunctionDef) and node.name.startswith('test_'):
                    test_functions += 1

                    # Check if empty
                    if len(node.body) == 1 and isinstance(node.body[0], ast.Pass):
                        empty_tests += 1

                    # Count meaningful assertions
                    for stmt in ast.walk(node):
                        if isinstance(stmt, ast.Assert):
                            # Check if it's not a trivial assertion
                            if not (isinstance(stmt.test, ast.Constant) and stmt.test.value is True):
                                meaningful_assertions += 1

        except SyntaxError:
            # Fall back to regex analysis
            test_functions = len(re.findall(r'def\s+test_\w+', content))
            empty_tests = len(re.findall(r'def\s+test_\w+[^:]*:\s*pass', content, re.MULTILINE))
            meaningful_assertions = len(re.findall(r'assert\s+(?!True\s*$)(?!1\s*==\s*1)', content))

        return test_functions, empty_tests, meaningful_assertions

    def _parse_git_diff_stats(self, diff_output: str) -> Dict[str, Any]:
        """Parse git diff --stat output."""
        stats = {
            "files_changed": 0,
            "insertions": 0,
            "deletions": 0
        }

        for line in diff_output.split('\n'):
            if 'files changed' in line:
                # Parse line like "5 files changed, 123 insertions(+), 45 deletions(-)"
                parts = line.split(',')
                for part in parts:
                    if 'files changed' in part:
                        stats["files_changed"] = int(re.search(r'(\d+)', part).group(1))
                    elif 'insertion' in part:
                        match = re.search(r'(\d+)', part)
                        if match:
                            stats["insertions"] = int(match.group(1))
                    elif 'deletion' in part:
                        match = re.search(r'(\d+)', part)
                        if match:
                            stats["deletions"] = int(match.group(1))

        return stats

    def _analyze_code_changes(self, diff_content: str) -> Dict[str, Any]:
        """Analyze git diff content for change types."""
        analysis = {
            "cosmetic_changes": 0,
            "functional_changes": 0,
            "comment_changes": 0,
            "whitespace_changes": 0
        }

        for line in diff_content.split('\n'):
            if line.startswith('+') and not line.startswith('+++'):
                line = line[1:].strip()

                if not line:  # Empty line
                    analysis["whitespace_changes"] += 1
                elif line.startswith('#') or line.startswith('//'):  # Comment
                    analysis["comment_changes"] += 1
                elif any(keyword in line for keyword in ['def ', 'class ', 'if ', 'for ', 'while ', 'try:']):
                    analysis["functional_changes"] += 1
                else:
                    analysis["cosmetic_changes"] += 1

        return analysis

    def _has_functional_code(self, content: str) -> bool:
        """Check if content contains functional code patterns."""
        functional_patterns = [
            r'def\s+\w+\s*\([^)]*\):',  # Function definitions
            r'class\s+\w+',  # Class definitions
            r'if\s+\w+',  # Conditional logic
            r'for\s+\w+\s+in',  # Loops
            r'while\s+\w+',  # While loops
            r'try\s*:',  # Error handling
            r'import\s+\w+',  # Imports
        ]

        functional_count = 0
        for pattern in functional_patterns:
            functional_count += len(re.findall(pattern, content))

        return functional_count >= MAXIMUM_RETRY_ATTEMPTS  # Threshold for functional code

    def _has_performance_measurement_code(self, content: str) -> bool:
        """Check if content contains performance measurement code."""
        perf_patterns = [
            r'time\.time\(\)',
            r'timeit\.',
            r'perf_counter',
            r'benchmark',
            r'profile',
            r'timing',
            r'duration',
            r'elapsed'
        ]

        for pattern in perf_patterns:
            if re.search(pattern, content, re.IGNORECASE):
                return True

        return False

    def _calculate_test_reality_score(self, evidence: Dict[str, Any]) -> float:
        """Calculate test reality score (0-100)."""
        score = 100.0

        # Penalty for empty tests
        empty_ratio = evidence.get("empty_test_ratio", 0)
        score -= empty_ratio * 50

        # Penalty for no meaningful assertions
        if evidence.get("meaningful_assertions", 0) == 0 and evidence.get("total_test_functions", 0) > 0:
            score -= 40

        # Bonus for having test files
        if evidence.get("test_files_count", 0) > 0:
            score += 10

        return max(0, score)

    def _calculate_metrics_reality_score(self, metrics: Dict[str, Any], issue_count: int) -> float:
        """Calculate metrics reality score (0-100)."""
        score = 100.0

        # Penalty per issue
        score -= issue_count * 20

        # Penalty for too many perfect values
        perfect_count = sum(1 for value in metrics.values() if value in [100, 100.0, 1.0])
        if perfect_count > len(metrics) * 0.5:
            score -= 30

        return max(0, score)

    def _calculate_implementation_reality_score(self, evidence: Dict[str, Any]) -> float:
        """Calculate implementation reality score (0-100)."""
        score = 100.0

        # Check functional file ratio
        func_ratio = evidence.get("functional_file_ratio", 0)
        score = func_ratio * 60  # Base score from functional code

        # Bonus for balanced changes
        cosmetic = evidence.get("cosmetic_changes", 0)
        functional = evidence.get("functional_changes", 0)

        if functional > 0:
            if cosmetic / max(1, functional) < 2:  # Less than 2:1 cosmetic to functional
                score += API_TIMEOUT_SECONDS
            else:
                score -= 20

        return max(0, min(100, score))

    def _calculate_performance_reality_score(self, evidence: Dict[str, Any], issue_count: int) -> float:
        """Calculate performance reality score (0-100)."""
        score = 100.0

        # Penalty per issue
        score -= issue_count * 25

        # Bonus for having performance measurement code
        if evidence.get("has_performance_measurement", False):
            score += 20
        else:
            score -= 30

        return max(0, score)

    def _generate_quality_gates(self, validation_results: List[ValidationResult], claims: Dict[str, Any]) -> List[QualityGate]:
        """Generate quality gates based on validation results."""
        gates = []

        for result in validation_results:
            gate = QualityGate(
                name=f"{result.validation_type.value}_gate",
                threshold=70.0,
                actual_value=result.score,
                claimed_value=claims.get(f"{result.validation_type.value}_score", result.score),
                passes_reality_check=result.is_genuine,
                validation_evidence=result.evidence
            )
            gates.append(gate)

        return gates