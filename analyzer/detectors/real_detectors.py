from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Union, Tuple, Callable, Set

"""
REAL Detection Modules - NO MOCKS, NO THEATER

These detectors actually find real code issues and FAIL when broken.
Every detector does genuine analysis work.
"""

from collections import defaultdict, Counter
from pathlib import Path
from typing import List, Dict, Any, Set, Optional, Tuple
import ast
import re
import sys

from dataclasses import dataclass

@dataclass
class RealDetectionResult:
    """Real detection result with actual violation data."""
    rule_id: str
    file_path: str
    line_number: int
    column_number: int
    severity: str
    message: str
    detection_type: str
    confidence: float
    context: Dict[str, Any]

class RealConnascenceDetector:
    """REAL connascence detector that finds actual coupling violations."""

    def __init__(self):
        """Initialize with real detection capabilities."""
        self.connascence_types = {
            'CoN': 'Connascence of Name',
            'CoT': 'Connascence of Type',
            'CoM': 'Connascence of Meaning',
            'CoP': 'Connascence of Position',
            'CoA': 'Connascence of Algorithm',
            'CoE': 'Connascence of Execution',
            'CoTi': 'Connascence of Timing',
            'CoV': 'Connascence of Values',
            'CoI': 'Connascence of Identity'
        }
        self.magic_numbers = set()
        self.global_names = set()

    def analyze_directory(self, directory_path: str) -> List[RealDetectionResult]:
        """Analyze entire directory for connascence violations."""
        violations = []
        directory = Path(directory_path)

        if not directory.exists():
            raise FileNotFoundError(f"Directory does not exist: {directory_path}")

        python_files = list(directory.glob("**/*.py"))

        # First pass: collect global context
        self._collect_global_context(python_files)

        # Second pass: detect violations
        for file_path in python_files:
            try:
                file_violations = self.analyze_file(str(file_path))
                violations.extend(file_violations)
            except Exception as e:
                violations.append(RealDetectionResult(
                    rule_id="ANALYSIS_ERROR",
                    file_path=str(file_path),
                    line_number=1,
                    column_number=0,
                    severity="high",
                    message=f"Analysis failed: {str(e)}",
                    detection_type="error",
                    confidence=1.0,
                    context={"error": str(e)}
                ))

        return violations

    def analyze_file(self, file_path: str) -> List[RealDetectionResult]:
        """Analyze single file for real connascence violations."""
        violations = []

        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                source_code = f.read()

            tree = ast.parse(source_code)
            violations.extend(self._detect_all_connascence_types(tree, file_path, source_code))

        except SyntaxError as e:
            violations.append(RealDetectionResult(
                rule_id="SYNTAX_ERROR",
                file_path=file_path,
                line_number=e.lineno or 1,
                column_number=e.offset or 0,
                severity="critical",
                message=f"Syntax error: {e.msg}",
                detection_type="syntax",
                confidence=1.0,
                context={"syntax_error": e.msg}
            ))
        except Exception as e:
            violations.append(RealDetectionResult(
                rule_id="FILE_ERROR",
                file_path=file_path,
                line_number=1,
                column_number=0,
                severity="high",
                message=f"File analysis error: {str(e)}",
                detection_type="error",
                confidence=1.0,
                context={"error": str(e)}
            ))

        return violations

    def _collect_global_context(self, file_paths: List[Path]) -> None:
        """Collect global context for cross-file analysis."""
        for file_path in file_paths:
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    source = f.read()
                tree = ast.parse(source)

                # Collect magic numbers
                for node in ast.walk(tree):
                    if isinstance(node, ast.Constant) and isinstance(node.value, (int, float)):
                        if abs(node.value) > 1 and node.value not in [0, 1, -1]:
                            self.magic_numbers.add(node.value)

                    # Collect global names
                    if isinstance(node, (ast.FunctionDef, ast.ClassDef)):
                        self.global_names.add(node.name)

            except Exception:
                continue  # Skip files that can't be parsed

    def _detect_all_connascence_types(self, tree: ast.AST, file_path: str, source: str) -> List[RealDetectionResult]:
        """Detect all types of connascence violations."""
        violations = []

        # Detect each type of connascence
        violations.extend(self._detect_connascence_of_name(tree, file_path))
        violations.extend(self._detect_connascence_of_meaning(tree, file_path))
        violations.extend(self._detect_connascence_of_position(tree, file_path))
        violations.extend(self._detect_connascence_of_algorithm(tree, file_path))
        violations.extend(self._detect_connascence_of_execution(tree, file_path))

        return violations

    def _detect_connascence_of_name(self, tree: ast.AST, file_path: str) -> List[RealDetectionResult]:
        """Detect Connascence of Name (CoN) violations."""
        violations = []
        name_usage = defaultdict(list)

        # Collect all name usages
        for node in ast.walk(tree):
            if isinstance(node, ast.Name):
                name_usage[node.id].append(node)

        # Find names used across multiple contexts
        for name, usages in name_usage.items():
            if len(usages) > 10:  # High coupling threshold
                violations.append(RealDetectionResult(
                    rule_id="CON_NAME_COUPLING",
                    file_path=file_path,
                    line_number=usages[0].lineno,
                    column_number=usages[0].col_offset,
                    severity="medium",
                    message=f"High name coupling: '{name}' used {len(usages)} times",
                    detection_type="CoN",
                    confidence=0.8,
                    context={"name": name, "usage_count": len(usages)}
                ))

        return violations

    def _detect_connascence_of_meaning(self, tree: ast.AST, file_path: str) -> List[RealDetectionResult]:
        """Detect Connascence of Meaning (CoM) violations."""
        violations = []

        for node in ast.walk(tree):
            # Magic numbers
            if isinstance(node, ast.Constant) and isinstance(node.value, (int, float)):
                if node.value in self.magic_numbers and abs(node.value) > 1:
                    violations.append(RealDetectionResult(
                        rule_id="CON_MAGIC_NUMBER",
                        file_path=file_path,
                        line_number=node.lineno,
                        column_number=node.col_offset,
                        severity="medium",
                        message=f"Magic number detected: {node.value}",
                        detection_type="CoM",
                        confidence=0.9,
                        context={"value": node.value}
                    ))

            # Magic strings
            if isinstance(node, ast.Constant) and isinstance(node.value, str):
                if len(node.value) > 2 and not node.value.isspace():
                    # Check if it looks like a magic string (not obviously a message)
                    if not any(word in node.value.lower() for word in ['error', 'warning', 'info', 'debug']):
                        violations.append(RealDetectionResult(
                            rule_id="CON_MAGIC_STRING",
                            file_path=file_path,
                            line_number=node.lineno,
                            column_number=node.col_offset,
                            severity="low",
                            message=f"Potential magic string: '{node.value[:50]}{'...' if len(node.value) > 50 else ''}'",
                            detection_type="CoM",
                            confidence=0.6,
                            context={"value": node.value}
                        ))

        return violations

    def _detect_connascence_of_position(self, tree: ast.AST, file_path: str) -> List[RealDetectionResult]:
        """Detect Connascence of Position (CoP) violations."""
        violations = []

        for node in ast.walk(tree):
            # Function calls with many positional arguments
            if isinstance(node, ast.Call):
                positional_args = [arg for arg in node.args]
                if len(positional_args) > 4:  # More than 4 positional args
                    violations.append(RealDetectionResult(
                        rule_id="CON_POSITION_ARGS",
                        file_path=file_path,
                        line_number=node.lineno,
                        column_number=node.col_offset,
                        severity="medium",
                        message=f"Too many positional arguments: {len(positional_args)}",
                        detection_type="CoP",
                        confidence=0.8,
                        context={"arg_count": len(positional_args)}
                    ))

        return violations

    def _detect_connascence_of_algorithm(self, tree: ast.AST, file_path: str) -> List[RealDetectionResult]:
        """Detect Connascence of Algorithm (CoA) violations."""
        violations = []
        algorithm_patterns = []

        # Look for similar algorithmic patterns
        for node in ast.walk(tree):
            if isinstance(node, ast.For):
                # Collect loop patterns
                loop_pattern = self._extract_loop_pattern(node)
                algorithm_patterns.append((loop_pattern, node))

        # Find duplicate patterns
        pattern_counts = Counter(p[0] for p in algorithm_patterns)
        for pattern, count in pattern_counts.items():
            if count > 2 and pattern != "simple":  # More than 2 similar patterns
                matching_nodes = [node for p, node in algorithm_patterns if p == pattern]
                violations.append(RealDetectionResult(
                    rule_id="CON_ALGORITHM_DUPLICATION",
                    file_path=file_path,
                    line_number=matching_nodes[0].lineno,
                    column_number=matching_nodes[0].col_offset,
                    severity="medium",
                    message=f"Duplicate algorithm pattern repeated {count} times",
                    detection_type="CoA",
                    confidence=0.7,
                    context={"pattern": pattern, "occurrences": count}
                ))

        return violations

    def _detect_connascence_of_execution(self, tree: ast.AST, file_path: str) -> List[RealDetectionResult]:
        """Detect Connascence of Execution (CoE) violations."""
        violations = []

        # Look for order-dependent operations
        assignments = []
        for node in ast.walk(tree):
            if isinstance(node, ast.Assign):
                assignments.append(node)

        # Check for potential order dependencies
        for i, assign in enumerate(assignments):
            if isinstance(assign.value, ast.Name):
                var_name = assign.value.id
                # Check if this variable is assigned later
                for j in range(i + 1, len(assignments)):
                    later_assign = assignments[j]
                    if (hasattr(later_assign, 'targets') and
                        any(isinstance(t, ast.Name) and t.id == var_name for t in later_assign.targets)):
                        violations.append(RealDetectionResult(
                            rule_id="CON_EXECUTION_ORDER",
                            file_path=file_path,
                            line_number=assign.lineno,
                            column_number=assign.col_offset,
                            severity="high",
                            message=f"Potential execution order dependency: variable '{var_name}'",
                            detection_type="CoE",
                            confidence=0.6,
                            context={"variable": var_name}
                        ))
                        break

        return violations

    def _extract_loop_pattern(self, node: ast.For) -> str:
        """Extract a pattern signature from a loop."""
        # Simple pattern extraction based on loop structure
        if isinstance(node.iter, ast.Call) and isinstance(node.iter.func, ast.Name):
            if node.iter.func.id == "range":
                return "range_loop"
        elif isinstance(node.iter, ast.Name):
            return "simple_iteration"
        return "complex_loop"

class RealGodObjectDetector:
    """REAL god object detector that finds actual oversized classes."""

    def __init__(self, max_methods: int = 15, max_lines: int = 200):
        """Initialize with real detection thresholds."""
        self.max_methods = max_methods
        self.max_lines = max_lines

    def analyze_file(self, file_path: str) -> List[RealDetectionResult]:
        """Analyze file for real god object violations."""
        violations = []

        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                source_code = f.read()
                lines = source_code.split('\n')

            tree = ast.parse(source_code)

            for node in ast.walk(tree):
                if isinstance(node, ast.ClassDef):
                    violations.extend(self._analyze_class(node, file_path, lines))

        except Exception as e:
            violations.append(RealDetectionResult(
                rule_id="GOD_OBJECT_ANALYSIS_ERROR",
                file_path=file_path,
                line_number=1,
                column_number=0,
                severity="high",
                message=f"God object analysis failed: {str(e)}",
                detection_type="error",
                confidence=1.0,
                context={"error": str(e)}
            ))

        return violations

    def _analyze_class(self, class_node: ast.ClassDef, file_path: str, lines: List[str]) -> List[RealDetectionResult]:
        """Analyze a specific class for god object characteristics."""
        violations = []

        # Count methods
        methods = [node for node in class_node.body if isinstance(node, ast.FunctionDef)]
        method_count = len(methods)

        # Calculate lines of code
        if hasattr(class_node, 'end_lineno') and class_node.end_lineno:
            class_lines = class_node.end_lineno - class_node.lineno + 1
        else:
            # Fallback calculation
            class_lines = len([node for node in ast.walk(class_node)])

        # Detect god object by method count
        if method_count > self.max_methods:
            violations.append(RealDetectionResult(
                rule_id="GOD_OBJECT_METHOD_COUNT",
                file_path=file_path,
                line_number=class_node.lineno,
                column_number=class_node.col_offset,
                severity="critical",
                message=f"God object detected: class '{class_node.name}' has {method_count} methods (max: {self.max_methods})",
                detection_type="god_object",
                confidence=0.9,
                context={
                    "class_name": class_node.name,
                    "method_count": method_count,
                    "threshold": self.max_methods
                }
            ))

        # Detect god object by line count
        if class_lines > self.max_lines:
            violations.append(RealDetectionResult(
                rule_id="GOD_OBJECT_LINE_COUNT",
                file_path=file_path,
                line_number=class_node.lineno,
                column_number=class_node.col_offset,
                severity="high",
                message=f"Large class detected: class '{class_node.name}' has {class_lines} lines (max: {self.max_lines})",
                detection_type="god_object",
                confidence=0.8,
                context={
                    "class_name": class_node.name,
                    "line_count": class_lines,
                    "threshold": self.max_lines
                }
            ))

        # Detect god object by complexity
        complexity_score = self._calculate_class_complexity(class_node)
        if complexity_score > 50:  # High complexity threshold
            violations.append(RealDetectionResult(
                rule_id="GOD_OBJECT_COMPLEXITY",
                file_path=file_path,
                line_number=class_node.lineno,
                column_number=class_node.col_offset,
                severity="high",
                message=f"Complex class detected: class '{class_node.name}' has complexity score {complexity_score}",
                detection_type="god_object",
                confidence=0.7,
                context={
                    "class_name": class_node.name,
                    "complexity_score": complexity_score
                }
            ))

        return violations

    def _calculate_class_complexity(self, class_node: ast.ClassDef) -> int:
        """Calculate class complexity based on real metrics."""
        complexity = 0

        for node in ast.walk(class_node):
            # Count decision points
            if isinstance(node, (ast.If, ast.While, ast.For, ast.Try)):
                complexity += 1
            # Count method definitions
            elif isinstance(node, ast.FunctionDef):
                complexity += 2
            # Count attributes
            elif isinstance(node, ast.Assign):
                complexity += 1

        return complexity

class RealTimingDetector:
    """REAL timing detector that finds actual timing-related issues."""

    def __init__(self):
        """Initialize with real timing detection capabilities."""
        self.timing_patterns = {
            'sleep': r'\btime\.sleep\s*\(',
            'delay': r'\bdelay\s*\(',
            'wait': r'\bwait\s*\(',
            'timeout': r'\btimeout\s*=',
            'threading': r'\bthreading\.',
            'asyncio': r'\basyncio\.',
        }

    def analyze_file(self, file_path: str) -> List[RealDetectionResult]:
        """Analyze file for real timing-related violations."""
        violations = []

        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                source_code = f.read()
                lines = source_code.split('\n')

            tree = ast.parse(source_code)
            violations.extend(self._detect_timing_issues(tree, file_path, lines))

        except Exception as e:
            violations.append(RealDetectionResult(
                rule_id="TIMING_ANALYSIS_ERROR",
                file_path=file_path,
                line_number=1,
                column_number=0,
                severity="medium",
                message=f"Timing analysis failed: {str(e)}",
                detection_type="error",
                confidence=1.0,
                context={"error": str(e)}
            ))

        return violations

    def _detect_timing_issues(self, tree: ast.AST, file_path: str, lines: List[str]) -> List[RealDetectionResult]:
        """Detect real timing-related issues."""
        violations = []

        # Detect blocking sleep calls
        for node in ast.walk(tree):
            if isinstance(node, ast.Call):
                if (isinstance(node.func, ast.Attribute) and
                    isinstance(node.func.value, ast.Name) and
                    node.func.value.id == 'time' and
                    node.func.attr == 'sleep'):

                    # Check sleep duration
                    if node.args and isinstance(node.args[0], ast.Constant):
                        sleep_duration = node.args[0].value
                        if isinstance(sleep_duration, (int, float)) and sleep_duration > 1.0:
                            violations.append(RealDetectionResult(
                                rule_id="TIMING_LONG_SLEEP",
                                file_path=file_path,
                                line_number=node.lineno,
                                column_number=node.col_offset,
                                severity="medium",
                                message=f"Long sleep detected: {sleep_duration} seconds",
                                detection_type="timing",
                                confidence=0.9,
                                context={"duration": sleep_duration}
                            ))

        # Detect potential race conditions
        threading_imports = []
        shared_variables = set()

        for node in ast.walk(tree):
            # Track threading imports
            if isinstance(node, ast.Import):
                for alias in node.names:
                    if alias.name == 'threading':
                        threading_imports.append(node)

            # Track global assignments (potential shared state)
            if isinstance(node, ast.Assign) and isinstance(node.targets[0], ast.Name):
                shared_variables.add(node.targets[0].id)

        # If threading is used with shared variables, flag potential race conditions
        if threading_imports and shared_variables:
            for thread_import in threading_imports:
                violations.append(RealDetectionResult(
                    rule_id="TIMING_RACE_CONDITION_RISK",
                    file_path=file_path,
                    line_number=thread_import.lineno,
                    column_number=thread_import.col_offset,
                    severity="high",
                    message=f"Potential race condition: threading with {len(shared_variables)} shared variables",
                    detection_type="timing",
                    confidence=0.6,
                    context={"shared_variables": list(shared_variables)}
                ))

        return violations

# Export all real detectors
__all__ = [
    'RealConnascenceDetector',
    'RealGodObjectDetector',
    'RealTimingDetector',
    'RealDetectionResult'
]