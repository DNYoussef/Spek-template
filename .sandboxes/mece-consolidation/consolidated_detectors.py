"""
Consolidated Detector Framework - MECE Compliant
Eliminates duplications across detector implementations.
"""

import ast
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from dataclasses import dataclass


@dataclass
class ViolationResult:
    """Standard violation result for all detectors."""
    type: str
    severity: str
    file_path: str
    line_number: int
    description: str
    column: int = 0
    nasa_rule: Optional[str] = None
    connascence_type: Optional[str] = None
    weight: float = 1.0

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return vars(self)


class BaseDetector(ABC):
    """
    Consolidated base detector replacing:
    - analyzer/detectors/base.py::DetectorBase
    - Multiple detector base classes

    Single source of truth for detector interface.
    """

    def __init__(self, file_path: str = "", source_lines: List[str] = None):
        """Initialize detector with file context."""
        self.file_path = file_path
        self.source_lines = source_lines or []

    @abstractmethod
    def detect_violations(self, tree: ast.AST) -> List[ViolationResult]:
        """Detect violations in AST - must be implemented by subclasses."""
        pass

    def get_line_content(self, line_number: int) -> str:
        """Get content of a specific line."""
        if 0 < line_number <= len(self.source_lines):
            return self.source_lines[line_number - 1]
        return ""


class ConsolidatedMagicLiteralDetector(BaseDetector):
    """
    Consolidated magic literal detector replacing:
    - analyzer/detectors/magic_literal_detector.py::MagicLiteralDetector
    - analyzer/formal_grammar.py::MagicLiteralDetector
    - Multiple other implementations
    """

    # Configuration constants
    ALLOWED_VALUES = {0, 1, -1, 2, 10, 100, 1000, True, False, None}
    PATH_INDICATORS = ['/', '\\', ':', '.com', '.org', 'http', 'https']

    def detect_violations(self, tree: ast.AST) -> List[ViolationResult]:
        """Detect magic literal violations."""
        violations = []

        for node in ast.walk(tree):
            if isinstance(node, ast.Constant):
                violation = self._check_constant(node)
                if violation:
                    violations.append(violation)

        return violations

    def _check_constant(self, node: ast.Constant) -> Optional[ViolationResult]:
        """Check a constant node for violations."""
        value = node.value

        # Check numeric literals
        if isinstance(value, (int, float)):
            if value not in self.ALLOWED_VALUES:
                return ViolationResult(
                    type='Connascence of Meaning',
                    severity=self._get_numeric_severity(value),
                    file_path=self.file_path,
                    line_number=getattr(node, 'lineno', 0),
                    column=getattr(node, 'col_offset', 0),
                    description=f'Magic literal {value} should be a named constant',
                    nasa_rule='Rule 8',
                    connascence_type='CoM',
                    weight=self._get_numeric_weight(value)
                )

        # Check string literals
        elif isinstance(value, str) and len(value) > 1:
            if self._is_hardcoded_path(value):
                return ViolationResult(
                    type='Connascence of Value',
                    severity='high',
                    file_path=self.file_path,
                    line_number=getattr(node, 'lineno', 0),
                    column=getattr(node, 'col_offset', 0),
                    description=f'Hardcoded path/URL should be configuration',
                    nasa_rule='Rule 5',
                    connascence_type='CoV',
                    weight=7.0
                )

        return None

    def _get_numeric_severity(self, value: float) -> str:
        """Determine severity based on numeric value."""
        if abs(value) > 1000:
            return 'high'
        elif abs(value) > 100:
            return 'medium'
        else:
            return 'low'

    def _get_numeric_weight(self, value: float) -> float:
        """Calculate weight based on numeric value."""
        if abs(value) > 1000:
            return 7.0
        elif abs(value) > 100:
            return 5.0
        else:
            return 3.0

    def _is_hardcoded_path(self, value: str) -> bool:
        """Check if string appears to be a hardcoded path or URL."""
        return any(indicator in value for indicator in self.PATH_INDICATORS)


class ConsolidatedPositionDetector(BaseDetector):
    """
    Consolidated position detector replacing:
    - analyzer/detectors/position_detector.py::PositionDetector
    - Multiple other implementations
    """

    MAX_PARAMETERS = 3
    MAX_PARAMETERS_WARNING = 5

    def detect_violations(self, tree: ast.AST) -> List[ViolationResult]:
        """Detect position-based connascence violations."""
        violations = []

        for node in ast.walk(tree):
            if isinstance(node, ast.FunctionDef):
                violation = self._check_function(node)
                if violation:
                    violations.append(violation)

        return violations

    def _check_function(self, node: ast.FunctionDef) -> Optional[ViolationResult]:
        """Check function for parameter list violations."""
        param_count = len(node.args.args)

        if param_count > self.MAX_PARAMETERS:
            severity = 'high' if param_count > self.MAX_PARAMETERS_WARNING else 'medium'
            weight = 6.0 if param_count > self.MAX_PARAMETERS_WARNING else 4.0

            return ViolationResult(
                type='Connascence of Position',
                severity=severity,
                file_path=self.file_path,
                line_number=getattr(node, 'lineno', 0),
                column=getattr(node, 'col_offset', 0),
                description=f"Function '{node.name}' has {param_count} parameters (max: {self.MAX_PARAMETERS})",
                nasa_rule='Rule 6',
                connascence_type='CoP',
                weight=weight
            )

        return None


class ConsolidatedGodObjectDetector(BaseDetector):
    """
    Consolidated god object detector replacing:
    - analyzer/detectors/god_object_detector.py::GodObjectDetector
    - analyzer/ast_engine/analyzer_orchestrator.py::GodObjectAnalyzer
    - Multiple other implementations
    """

    MAX_METHODS = 15
    MAX_FUNCTION_LINES = 60

    def detect_violations(self, tree: ast.AST) -> List[ViolationResult]:
        """Detect god object anti-pattern violations."""
        violations = []

        for node in ast.walk(tree):
            if isinstance(node, ast.ClassDef):
                violation = self._check_class(node)
                if violation:
                    violations.append(violation)

            elif isinstance(node, ast.FunctionDef):
                violation = self._check_function_length(node)
                if violation:
                    violations.append(violation)

        return violations

    def _check_class(self, node: ast.ClassDef) -> Optional[ViolationResult]:
        """Check class for god object pattern."""
        methods = [n for n in node.body if isinstance(n, ast.FunctionDef)]

        if len(methods) > self.MAX_METHODS:
            return ViolationResult(
                type='God Object',
                severity='critical',
                file_path=self.file_path,
                line_number=getattr(node, 'lineno', 0),
                column=getattr(node, 'col_offset', 0),
                description=f"Class '{node.name}' has {len(methods)} methods (max: {self.MAX_METHODS})",
                nasa_rule='Rule 4',
                weight=9.0
            )

        return None

    def _check_function_length(self, node: ast.FunctionDef) -> Optional[ViolationResult]:
        """Check function length."""
        if hasattr(node, 'end_lineno') and hasattr(node, 'lineno'):
            lines = node.end_lineno - node.lineno

            if lines > self.MAX_FUNCTION_LINES:
                return ViolationResult(
                    type='God Object',
                    severity='high',
                    file_path=self.file_path,
                    line_number=getattr(node, 'lineno', 0),
                    column=getattr(node, 'col_offset', 0),
                    description=f"Function '{node.name}' exceeds {self.MAX_FUNCTION_LINES} lines ({lines} lines)",
                    nasa_rule='Rule 4',
                    weight=8.0
                )

        return None


class DetectorRegistry:
    """
    Central registry for all detectors.
    Replaces multiple detector factory implementations.
    """

    def __init__(self):
        """Initialize with default detectors."""
        self.detectors = {
            'magic_literal': ConsolidatedMagicLiteralDetector,
            'position': ConsolidatedPositionDetector,
            'god_object': ConsolidatedGodObjectDetector,
        }

    def register(self, name: str, detector_class):
        """Register a new detector."""
        self.detectors[name] = detector_class

    def get_detector(self, name: str, file_path: str = "", source_lines: List[str] = None):
        """Get an instance of a detector."""
        if name in self.detectors:
            return self.detectors[name](file_path, source_lines)
        return None

    def get_all_detectors(self, file_path: str = "", source_lines: List[str] = None):
        """Get instances of all registered detectors."""
        return [
            detector_class(file_path, source_lines)
            for detector_class in self.detectors.values()
        ]


# Aliases for backwards compatibility
MagicLiteralDetector = ConsolidatedMagicLiteralDetector
PositionDetector = ConsolidatedPositionDetector
GodObjectDetector = ConsolidatedGodObjectDetector
DetectorBase = BaseDetector