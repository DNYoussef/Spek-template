from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Union, Tuple, Callable, Set

"""
Pattern Detector ML Module
Detects code patterns and anti-patterns using machine learning.
"""

from typing import List, Dict, Any, Optional, Tuple, Set
import ast
import json
import os
import re

from dataclasses import dataclass
from enum import Enum
import numpy as np

class PatternType(Enum):
    """Types of code patterns that can be detected."""
    DESIGN_PATTERN = "design_pattern"
    ANTI_PATTERN = "anti_pattern"
    SECURITY_PATTERN = "security_pattern"
    PERFORMANCE_PATTERN = "performance_pattern"
    ARCHITECTURAL_PATTERN = "architectural_pattern"
    REFACTORING_OPPORTUNITY = "refactoring_opportunity"

class PatternSeverity(Enum):
    """Severity levels for detected patterns."""
    INFO = "info"
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

@dataclass
class CodePattern:
    """Represents a detected code pattern."""
    pattern_type: PatternType
    pattern_name: str
    severity: PatternSeverity
    confidence: float
    file_path: str
    line_number: int
    description: str
    evidence: Dict[str, Any]
    recommendation: str
    impact: str

class PatternDetector:
    """ML-based code pattern detection engine."""

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}
        self.pattern_definitions = self._initialize_pattern_definitions()
        self.detection_algorithms = self._initialize_detection_algorithms()

    def _initialize_pattern_definitions(self) -> Dict[str, Dict[str, Any]]:
        """Initialize pattern definitions with detection criteria."""
        return {
            # Design Patterns
            "singleton": {
                "type": PatternType.DESIGN_PATTERN,
                "severity": PatternSeverity.INFO,
                "indicators": [
                    r'class\s+\w+.*:.*\n.*_instance\s*=\s*None',
                    r'def\s+__new__\s*\(',
                    r'if\s+cls\._instance\s+is\s+None'
                ],
                "description": "Singleton pattern implementation",
                "recommendation": "Consider dependency injection instead"
            },

            "factory": {
                "type": PatternType.DESIGN_PATTERN,
                "severity": PatternSeverity.INFO,
                "indicators": [
                    r'def\s+create_\w+\(',
                    r'factory',
                    r'if\s+\w+_type\s*==.*:\s*return\s+\w+\('
                ],
                "description": "Factory pattern implementation",
                "recommendation": "Good use of creational pattern"
            },

            "observer": {
                "type": PatternType.DESIGN_PATTERN,
                "severity": PatternSeverity.INFO,
                "indicators": [
                    r'def\s+subscribe\(',
                    r'def\s+notify\(',
                    r'observers\s*=\s*\[\]',
                    r'for\s+observer\s+in\s+.*observers'
                ],
                "description": "Observer pattern implementation",
                "recommendation": "Consider using event system or signals"
            },

            # Anti-Patterns
            "god_object": {
                "type": PatternType.ANTI_PATTERN,
                "severity": PatternSeverity.HIGH,
                "indicators": [
                    # Detected by large class size and method count
                ],
                "description": "God object anti-pattern - class doing too much",
                "recommendation": "Break down into smaller, focused classes"
            },

            "long_parameter_list": {
                "type": PatternType.ANTI_PATTERN,
                "severity": PatternSeverity.MEDIUM,
                "indicators": [
                    # Detected by parameter count analysis
                ],
                "description": "Long parameter list anti-pattern",
                "recommendation": "Use parameter object or builder pattern"
            },

            "copy_paste_code": {
                "type": PatternType.ANTI_PATTERN,
                "severity": PatternSeverity.MEDIUM,
                "indicators": [
                    # Detected by duplicate code analysis
                ],
                "description": "Copy-paste programming anti-pattern",
                "recommendation": "Extract common functionality into methods"
            },

            # Security Patterns
            "input_validation": {
                "type": PatternType.SECURITY_PATTERN,
                "severity": PatternSeverity.INFO,
                "indicators": [
                    r'validate\(',
                    r'sanitize\(',
                    r'isinstance\s*\(',
                    r'len\s*\(.*\)\s*[<>]=?\s*\d+'
                ],
                "description": "Input validation security pattern",
                "recommendation": "Good security practice"
            },

            "sql_injection_risk": {
                "type": PatternType.SECURITY_PATTERN,
                "severity": PatternSeverity.CRITICAL,
                "indicators": [
                    r'execute\s*\(\s*["\'].*\%.*["\']',
                    r'query\s*=\s*["\'].*\+.*["\']',
                    r'SELECT.*\+.*FROM'
                ],
                "description": "SQL injection vulnerability pattern",
                "recommendation": "Use parameterized queries"
            },

            "hardcoded_credentials": {
                "type": PatternType.SECURITY_PATTERN,
                "severity": PatternSeverity.CRITICAL,
                "indicators": [
                    r'password\s*=\s*["\'][^"\']+["\']',
                    r'api_key\s*=\s*["\'][^"\']+["\']',
                    r'secret\s*=\s*["\'][^"\']+["\']'
                ],
                "description": "Hardcoded credentials security anti-pattern",
                "recommendation": "Use environment variables or secure vault"
            },

            # Performance Patterns
            "caching_pattern": {
                "type": PatternType.PERFORMANCE_PATTERN,
                "severity": PatternSeverity.INFO,
                "indicators": [
                    r'@lru_cache',
                    r'@cache',
                    r'cache\[',
                    r'memoize'
                ],
                "description": "Caching performance pattern",
                "recommendation": "Good performance optimization"
            },

            "n_plus_one_query": {
                "type": PatternType.PERFORMANCE_PATTERN,
                "severity": PatternSeverity.HIGH,
                "indicators": [
                    r'for\s+\w+\s+in\s+.*:\s*\n.*\.query\(',
                    r'for\s+\w+\s+in\s+.*:\s*\n.*\.get\('
                ],
                "description": "N+1 query anti-pattern",
                "recommendation": "Use batch queries or prefetching"
            },

            "inefficient_loop": {
                "type": PatternType.PERFORMANCE_PATTERN,
                "severity": PatternSeverity.MEDIUM,
                "indicators": [
                    r'for.*in.*:\s*\n\s*for.*in.*:',  # Nested loops
                    r'while\s+True:.*break',  # Inefficient while loops
                ],
                "description": "Inefficient loop pattern",
                "recommendation": "Consider algorithmic optimization"
            }
        }

    def _initialize_detection_algorithms(self) -> Dict[str, callable]:
        """Initialize pattern detection algorithms."""
        return {
            "regex_based": self._detect_regex_patterns,
            "ast_based": self._detect_ast_patterns,
            "structural": self._detect_structural_patterns,
            "complexity": self._detect_complexity_patterns,
            "duplication": self._detect_duplication_patterns
        }

    def detect_patterns_in_file(self, file_path: str) -> List[CodePattern]:
        """Detect all patterns in a single file."""
        if not path_exists(file_path):
            return []

        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
        except Exception:
            return []

        all_patterns = []

        # Run all detection algorithms
        for algorithm_name, algorithm in self.detection_algorithms.items():
            try:
                patterns = algorithm(file_path, content)
                all_patterns.extend(patterns)
            except Exception as e:
                # Log error but continue with other algorithms
                continue

        return all_patterns

    def _detect_regex_patterns(self, file_path: str, content: str) -> List[CodePattern]:
        """Detect patterns using regex matching."""
        patterns = []

        for pattern_name, definition in self.pattern_definitions.items():
            if "indicators" not in definition:
                continue

            pattern_found = False
            evidence = {}

            for indicator in definition["indicators"]:
                matches = list(re.finditer(indicator, content, re.MULTILINE))
                if matches:
                    pattern_found = True
                    evidence[indicator] = len(matches)

                    # Use first match for line number
                    if "line_number" not in evidence:
                        evidence["line_number"] = content[:matches[0].start()].count('\n') + 1

            if pattern_found:
                patterns.append(CodePattern(
                    pattern_type=definition["type"],
                    pattern_name=pattern_name,
                    severity=definition["severity"],
                    confidence=self._calculate_regex_confidence(evidence),
                    file_path=file_path,
                    line_number=evidence.get("line_number", 1),
                    description=definition["description"],
                    evidence=evidence,
                    recommendation=definition["recommendation"],
                    impact=self._calculate_pattern_impact(definition["type"], definition["severity"])
                ))

        return patterns

    def _detect_ast_patterns(self, file_path: str, content: str) -> List[CodePattern]:
        """Detect patterns using AST analysis."""
        patterns = []

        try:
            tree = ast.parse(content)
        except SyntaxError:
            return patterns

        # Detect god object pattern
        patterns.extend(self._detect_god_object(file_path, tree))

        # Detect long parameter lists
        patterns.extend(self._detect_long_parameter_lists(file_path, tree))

        # Detect complex methods
        patterns.extend(self._detect_complex_methods(file_path, tree))

        return patterns

    def _detect_structural_patterns(self, file_path: str, content: str) -> List[CodePattern]:
        """Detect structural anti-patterns."""
        patterns = []

        # Large file pattern
        lines = content.split('\n')
        if len(lines) > 1000:
            patterns.append(CodePattern(
                pattern_type=PatternType.ANTI_PATTERN,
                pattern_name="large_file",
                severity=PatternSeverity.MEDIUM,
                confidence=0.9,
                file_path=file_path,
                line_number=1,
                description=f"Large file with {len(lines)} lines",
                evidence={"line_count": len(lines)},
                recommendation="Consider breaking down into smaller modules",
                impact="Reduced maintainability and readability"
            ))

        # Deep nesting pattern
        max_indent = 0
        for line in lines:
            if line.strip():
                indent = len(line) - len(line.lstrip())
                max_indent = max(max_indent, indent)

        if max_indent > 20:  # More than 5 levels of nesting (assuming 4 spaces)
            patterns.append(CodePattern(
                pattern_type=PatternType.ANTI_PATTERN,
                pattern_name="deep_nesting",
                severity=PatternSeverity.MEDIUM,
                confidence=0.8,
                file_path=file_path,
                line_number=1,
                description=f"Deep nesting with {max_indent // 4} levels",
                evidence={"max_nesting_level": max_indent // 4},
                recommendation="Reduce nesting by extracting methods",
                impact="Reduced code readability and complexity"
            ))

        return patterns

    def _detect_complexity_patterns(self, file_path: str, content: str) -> List[CodePattern]:
        """Detect complexity-related patterns."""
        patterns = []

        try:
            tree = ast.parse(content)

            # Calculate cyclomatic complexity for functions
            for node in ast.walk(tree):
                if isinstance(node, ast.FunctionDef):
                    complexity = self._calculate_cyclomatic_complexity(node)
                    if complexity > 10:  # High complexity threshold
                        patterns.append(CodePattern(
                            pattern_type=PatternType.REFACTORING_OPPORTUNITY,
                            pattern_name="high_complexity_method",
                            severity=PatternSeverity.HIGH if complexity > 20 else PatternSeverity.MEDIUM,
                            confidence=0.9,
                            file_path=file_path,
                            line_number=node.lineno,
                            description=f"Method '{node.name}' has high cyclomatic complexity ({complexity})",
                            evidence={"complexity": complexity, "method_name": node.name},
                            recommendation="Break down method into smaller functions",
                            impact="High complexity reduces maintainability"
                        ))

        except SyntaxError:
            pass

        return patterns

    def _detect_duplication_patterns(self, file_path: str, content: str) -> List[CodePattern]:
        """Detect code duplication patterns."""
        patterns = []

        lines = content.split('\n')
        line_hashes = {}

        # Simple line-based duplication detection
        for i, line in enumerate(lines):
            stripped_line = line.strip()
            if len(stripped_line) > 10 and not stripped_line.startswith('#'):
                if stripped_line in line_hashes:
                    line_hashes[stripped_line].append(i + 1)
                else:
                    line_hashes[stripped_line] = [i + 1]

        # Find duplicated lines
        duplicated_lines = {line: line_nums for line, line_nums in line_hashes.items()
                            if len(line_nums) > 2}

        if duplicated_lines:
            total_duplicated = sum(len(line_nums) for line_nums in duplicated_lines.values())
            duplication_ratio = total_duplicated / len(lines)

            if duplication_ratio > 0.1:  # More than 10% duplication
                patterns.append(CodePattern(
                    pattern_type=PatternType.ANTI_PATTERN,
                    pattern_name="code_duplication",
                    severity=PatternSeverity.MEDIUM,
                    confidence=0.8,
                    file_path=file_path,
                    line_number=1,
                    description=f"Code duplication detected ({duplication_ratio:.1%} of lines)",
                    evidence={
                        "duplication_ratio": duplication_ratio,
                        "duplicated_lines": len(duplicated_lines)
                    },
                    recommendation="Extract common code into reusable functions",
                    impact="Increased maintenance burden and bug risk"
                ))

        return patterns

    def _detect_god_object(self, file_path: str, tree: ast.AST) -> List[CodePattern]:
        """Detect god object anti-pattern."""
        patterns = []

        for node in ast.walk(tree):
            if isinstance(node, ast.ClassDef):
                # Count methods and attributes
                methods = [n for n in node.body if isinstance(n, ast.FunctionDef)]
                attributes = [n for n in node.body if isinstance(n, ast.Assign)]

                method_count = len(methods)
                attribute_count = len(attributes)

                # Calculate total lines in class
                if hasattr(node, 'end_lineno') and hasattr(node, 'lineno'):
                    class_lines = node.end_lineno - node.lineno
                else:
                    class_lines = len(methods) * 10  # Estimate

                # God object thresholds
                if method_count > 20 or attribute_count > 15 or class_lines > 500:
                    severity = PatternSeverity.HIGH if method_count > 30 else PatternSeverity.MEDIUM

                    patterns.append(CodePattern(
                        pattern_type=PatternType.ANTI_PATTERN,
                        pattern_name="god_object",
                        severity=severity,
                        confidence=0.8,
                        file_path=file_path,
                        line_number=node.lineno,
                        description=f"God object: class '{node.name}' with {method_count} methods",
                        evidence={
                            "class_name": node.name,
                            "method_count": method_count,
                            "attribute_count": attribute_count,
                            "estimated_lines": class_lines
                        },
                        recommendation="Split class into smaller, focused classes",
                        impact="Violates single responsibility principle"
                    ))

        return patterns

    def _detect_long_parameter_lists(self, file_path: str, tree: ast.AST) -> List[CodePattern]:
        """Detect long parameter list anti-pattern."""
        patterns = []

        for node in ast.walk(tree):
            if isinstance(node, ast.FunctionDef):
                param_count = len(node.args.args)

                if param_count > 5:  # More than 5 parameters
                    severity = PatternSeverity.HIGH if param_count > 8 else PatternSeverity.MEDIUM

                    patterns.append(CodePattern(
                        pattern_type=PatternType.ANTI_PATTERN,
                        pattern_name="long_parameter_list",
                        severity=severity,
                        confidence=0.9,
                        file_path=file_path,
                        line_number=node.lineno,
                        description=f"Function '{node.name}' has {param_count} parameters",
                        evidence={
                            "function_name": node.name,
                            "parameter_count": param_count,
                            "parameters": [arg.arg for arg in node.args.args]
                        },
                        recommendation="Use parameter object or reduce dependencies",
                        impact="Reduced function usability and testability"
                    ))

        return patterns

    def _detect_complex_methods(self, file_path: str, tree: ast.AST) -> List[CodePattern]:
        """Detect overly complex methods."""
        patterns = []

        for node in ast.walk(tree):
            if isinstance(node, ast.FunctionDef):
                # Calculate method length
                method_lines = len(node.body)

                if method_lines > 50:  # Long method threshold
                    patterns.append(CodePattern(
                        pattern_type=PatternType.REFACTORING_OPPORTUNITY,
                        pattern_name="long_method",
                        severity=PatternSeverity.MEDIUM,
                        confidence=0.8,
                        file_path=file_path,
                        line_number=node.lineno,
                        description=f"Long method '{node.name}' with {method_lines} statements",
                        evidence={
                            "method_name": node.name,
                            "statement_count": method_lines
                        },
                        recommendation="Break down into smaller methods",
                        impact="Reduced readability and maintainability"
                    ))

        return patterns

    def _calculate_cyclomatic_complexity(self, function_node: ast.FunctionDef) -> int:
        """Calculate cyclomatic complexity of a function."""
        complexity = 1  # Base complexity

        for node in ast.walk(function_node):
            if isinstance(node, (ast.If, ast.While, ast.For, ast.AsyncFor)):
                complexity += 1
            elif isinstance(node, ast.ExceptHandler):
                complexity += 1
            elif isinstance(node, ast.With):
                complexity += 1
            elif isinstance(node, ast.Assert):
                complexity += 1
            elif isinstance(node, ast.BoolOp):
                # And/Or operations add complexity
                complexity += len(node.values) - 1

        return complexity

    def _calculate_regex_confidence(self, evidence: Dict[str, Any]) -> float:
        """Calculate confidence for regex-based pattern detection."""
        # Simple confidence based on number of matching indicators
        indicator_count = sum(1 for key, value in evidence.items()
                            if key != "line_number" and value > 0)

        # Base confidence increases with more indicators
        confidence = min(0.9, 0.3 + (indicator_count * 0.2))
        return confidence

    def _calculate_pattern_impact(self, pattern_type: PatternType, severity: PatternSeverity) -> str:
        """Calculate impact description for a pattern."""
        impact_matrix = {
            (PatternType.ANTI_PATTERN, PatternSeverity.CRITICAL): "Severe impact on code quality and maintainability",
            (PatternType.ANTI_PATTERN, PatternSeverity.HIGH): "High impact on code maintainability",
            (PatternType.ANTI_PATTERN, PatternSeverity.MEDIUM): "Moderate impact on code quality",
            (PatternType.SECURITY_PATTERN, PatternSeverity.CRITICAL): "Critical security vulnerability",
            (PatternType.SECURITY_PATTERN, PatternSeverity.HIGH): "High security risk",
            (PatternType.PERFORMANCE_PATTERN, PatternSeverity.HIGH): "Significant performance impact",
            (PatternType.DESIGN_PATTERN, PatternSeverity.INFO): "Good design practice",
        }

        return impact_matrix.get((pattern_type, severity), "Impact assessment needed")

    def analyze_directory_patterns(self, directory: str) -> Dict[str, Any]:
        """Analyze patterns across an entire directory."""
        results = {
            "total_files": 0,
            "patterns_by_type": {pt.value: 0 for pt in PatternType},
            "patterns_by_severity": {ps.value: 0 for ps in PatternSeverity},
            "top_issues": [],
            "recommendations": [],
            "summary": {}
        }

        all_patterns = []

        for root, dirs, files in os.walk(directory):
            for file in files:
                if file.endswith('.py'):
                    file_path = os.path.join(root, file)
                    results["total_files"] += 1

                    patterns = self.detect_patterns_in_file(file_path)
                    all_patterns.extend(patterns)

                    # Count by type and severity
                    for pattern in patterns:
                        results["patterns_by_type"][pattern.pattern_type.value] += 1
                        results["patterns_by_severity"][pattern.severity.value] += 1

        # Identify top issues
        critical_patterns = [p for p in all_patterns if p.severity == PatternSeverity.CRITICAL]
        high_patterns = [p for p in all_patterns if p.severity == PatternSeverity.HIGH]

        results["top_issues"] = sorted(
            critical_patterns + high_patterns,
            key=lambda p: (p.severity.value, p.confidence),
            reverse=True
        )[:10]

        # Generate recommendations
        pattern_counts = {}
        for pattern in all_patterns:
            pattern_counts[pattern.pattern_name] = pattern_counts.get(pattern.pattern_name, 0) + 1

        most_common_patterns = sorted(pattern_counts.items(), key=lambda x: x[1], reverse=True)[:5]

        for pattern_name, count in most_common_patterns:
            if pattern_name in self.pattern_definitions:
                recommendation = self.pattern_definitions[pattern_name]["recommendation"]
                results["recommendations"].append(f"Address {pattern_name} ({count} instances): {recommendation}")

        # Summary
        results["summary"] = {
            "total_patterns": len(all_patterns),
            "critical_issues": len(critical_patterns),
            "high_issues": len(high_patterns),
            "most_common_issue": most_common_patterns[0][0] if most_common_patterns else None,
            "pattern_density": len(all_patterns) / max(1, results["total_files"])
        }

        return results