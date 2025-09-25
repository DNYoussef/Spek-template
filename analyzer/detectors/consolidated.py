from src.constants.base import DAYS_RETENTION_PERIOD

import ast
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from dataclasses import dataclass

# Import the base violation type
try:
    from ..utils.types import ConnascenceViolation
except ImportError:
    # Fallback definition if import fails
    @dataclass
    class ConnascenceViolation:
        type: str = ""
        severity: str = "medium"
        file_path: str = ""
        line_number: int = 0
        description: str = ""
        column: int = 0
        nasa_rule: Optional[str] = None
        connascence_type: Optional[str] = None
        weight: float = 1.0

class ConsolidatedDetectorBase(ABC):
    """
    Single base class for all detectors.
    Replaces DetectorBase, DetectorInterface, and other base classes.
    """

    def __init__(self, file_path: str = "", source_lines: List[str] = None):
        """Initialize with file context."""
        self.file_path = file_path
        self.source_lines = source_lines or []
        self.violations = []

    @abstractmethod
    def detect_violations(self, tree: ast.AST) -> List[ConnascenceViolation]:
        """Must be implemented by all detectors."""

    def get_line_content(self, line_number: int) -> str:
        """Get content of a specific line."""
        if 0 < line_number <= len(self.source_lines):
            return self.source_lines[line_number - 1]
        return ""

    def get_code_snippet(self, node: ast.AST, context: int = 2) -> str:
        """Get code snippet around a node."""
        if hasattr(node, 'lineno'):
            start = max(1, node.lineno - context)
            end = min(len(self.source_lines), node.lineno + context)
            return '\n'.join(self.source_lines[start-1:end])
        return ""

class ConsolidatedMagicLiteralDetector(ConsolidatedDetectorBase):
    """
    Consolidated magic literal detector.
    Replaces all MagicLiteralDetector implementations.
    """

    ALLOWED_VALUES = {0, 1, -1, 2, 10, 100, 1000, True, False, None}
    PATH_INDICATORS = ['/', '\\', ':', '.com', '.org', 'http', 'https', '.json', '.xml', '.yaml']

    def detect_violations(self, tree: ast.AST) -> List[ConnascenceViolation]:
        """Detect magic literals in AST."""
        self.violations = []

        for node in ast.walk(tree):
            if isinstance(node, ast.Constant):
                self._check_constant(node)

        return self.violations

    def _check_constant(self, node: ast.Constant):
        """Check a constant for violations."""
        value = node.value

        # Numeric literals
        if isinstance(value, (int, float)):
            if value not in self.ALLOWED_VALUES:
                self.violations.append(ConnascenceViolation(
                    type='Connascence of Meaning',
                    severity=self._get_numeric_severity(value),
                    file_path=self.file_path,
                    line_number=getattr(node, 'lineno', 0),
                    column=getattr(node, 'col_offset', 0),
                    description=f'Magic literal {value} should be a named constant',
                    nasa_rule='Rule 8',
                    connascence_type='CoM',
                    weight=self._get_numeric_weight(value)
                ))

        # String literals
        elif isinstance(value, str) and len(value) > 1:
            # Skip docstrings and common strings
            if value in ('__main__', '__init__', '__name__', 'utf-8'):
                return

            if self._is_hardcoded_path(value):
                self.violations.append(ConnascenceViolation(
                    type='Connascence of Value',
                    severity='high',
                    file_path=self.file_path,
                    line_number=getattr(node, 'lineno', 0),
                    column=getattr(node, 'col_offset', 0),
                    description='Hardcoded path/URL should be configuration',
                    nasa_rule='Rule 5',
                    connascence_type='CoV',
                    weight=7.0
                ))

    def _get_numeric_severity(self, value: float) -> str:
        """Determine severity based on value."""
        abs_val = abs(value)
        if abs_val > 10000:
            return 'critical'
        elif abs_val > 1000:
            return 'high'
        elif abs_val > 100:
            return 'medium'
        else:
            return 'low'

    def _get_numeric_weight(self, value: float) -> float:
        """Calculate weight based on value."""
        abs_val = abs(value)
        if abs_val > 10000:
            return 9.0
        elif abs_val > 1000:
            return 7.0
        elif abs_val > 100:
            return 5.0
        else:
            return 3.0

    def _is_hardcoded_path(self, value: str) -> bool:
        """Check if string is a hardcoded path or URL."""
        return any(indicator in value for indicator in self.PATH_INDICATORS)

class ConsolidatedPositionDetector(ConsolidatedDetectorBase):
    """
    Consolidated position detector.
    Replaces all PositionDetector implementations.
    """

    MAX_PARAMETERS = 3
    WARNING_THRESHOLD = 5
    CRITICAL_THRESHOLD = DAYS_RETENTION_PERIOD

    def detect_violations(self, tree: ast.AST) -> List[ConnascenceViolation]:
        """Detect position-based violations."""
        self.violations = []

        for node in ast.walk(tree):
            if isinstance(node, ast.FunctionDef):
                self._check_function(node)
            elif isinstance(node, ast.Call):
                self._check_call(node)

        return self.violations

    def _check_function(self, node: ast.FunctionDef):
        """Check function parameter list."""
        param_count = len(node.args.args)

        if param_count > self.MAX_PARAMETERS:
            if param_count >= self.CRITICAL_THRESHOLD:
                severity = 'critical'
                weight = 8.0
            elif param_count >= self.WARNING_THRESHOLD:
                severity = 'high'
                weight = 6.0
            else:
                severity = 'medium'
                weight = 4.0

            self.violations.append(ConnascenceViolation(
                type='Connascence of Position',
                severity=severity,
                file_path=self.file_path,
                line_number=getattr(node, 'lineno', 0),
                column=getattr(node, 'col_offset', 0),
                description=f"Function '{node.name}' has {param_count} parameters (max: {self.MAX_PARAMETERS})",
                nasa_rule='Rule 6',
                connascence_type='CoP',
                weight=weight
            ))

    def _check_call(self, node: ast.Call):
        """Check function calls for too many arguments."""
        arg_count = len(node.args)

        if arg_count > self.WARNING_THRESHOLD:
            self.violations.append(ConnascenceViolation(
                type='Connascence of Position',
                severity='medium',
                file_path=self.file_path,
                line_number=getattr(node, 'lineno', 0),
                column=getattr(node, 'col_offset', 0),
                description=f'Function call with {arg_count} positional arguments',
                nasa_rule='Rule 6',
                connascence_type='CoP',
                weight=5.0
            ))

class ConsolidatedGodObjectDetector(ConsolidatedDetectorBase):
    """
    Consolidated god object detector.
    Replaces all GodObjectDetector and GodObjectAnalyzer implementations.
    """

    MAX_METHODS = 15
    MAX_ATTRIBUTES = 20
    MAX_FUNCTION_LINES = 60
    MAX_CLASS_LINES = 300

    def detect_violations(self, tree: ast.AST) -> List[ConnascenceViolation]:
        """Detect god object anti-pattern."""
        self.violations = []

        for node in ast.walk(tree):
            if isinstance(node, ast.ClassDef):
                self._check_class(node)
            elif isinstance(node, ast.FunctionDef):
                self._check_function(node)

        return self.violations

    def _check_class(self, node: ast.ClassDef):
        """Check class for god object characteristics."""
        methods = []
        attributes = []

        for item in node.body:
            if isinstance(item, ast.FunctionDef):
                methods.append(item)
            elif isinstance(item, ast.Assign):
                attributes.extend(item.targets)

        # Check method count
        if len(methods) > self.MAX_METHODS:
            self.violations.append(ConnascenceViolation(
                type='God Object',
                severity='critical',
                file_path=self.file_path,
                line_number=getattr(node, 'lineno', 0),
                column=getattr(node, 'col_offset', 0),
                description=f"Class '{node.name}' has {len(methods)} methods (max: {self.MAX_METHODS})",
                nasa_rule='Rule 4',
                weight=9.0
            ))

        # Check attribute count
        if len(attributes) > self.MAX_ATTRIBUTES:
            self.violations.append(ConnascenceViolation(
                type='God Object',
                severity='high',
                file_path=self.file_path,
                line_number=getattr(node, 'lineno', 0),
                column=getattr(node, 'col_offset', 0),
                description=f"Class '{node.name}' has {len(attributes)} attributes (max: {self.MAX_ATTRIBUTES})",
                nasa_rule='Rule 4',
                weight=8.0
            ))

        # Check class length
        if hasattr(node, 'end_lineno') and hasattr(node, 'lineno'):
            lines = node.end_lineno - node.lineno
            if lines > self.MAX_CLASS_LINES:
                self.violations.append(ConnascenceViolation(
                    type='God Object',
                    severity='high',
                    file_path=self.file_path,
                    line_number=getattr(node, 'lineno', 0),
                    column=getattr(node, 'col_offset', 0),
                    description=f"Class '{node.name}' exceeds {self.MAX_CLASS_LINES} lines ({lines} lines)",
                    nasa_rule='Rule 4',
                    weight=8.0
                ))

    def _check_function(self, node: ast.FunctionDef):
        """Check function length."""
        if hasattr(node, 'end_lineno') and hasattr(node, 'lineno'):
            lines = node.end_lineno - node.lineno

            if lines > self.MAX_FUNCTION_LINES:
                self.violations.append(ConnascenceViolation(
                    type='God Object',
                    severity='high',
                    file_path=self.file_path,
                    line_number=getattr(node, 'lineno', 0),
                    column=getattr(node, 'col_offset', 0),
                    description=f"Function '{node.name}' exceeds {self.MAX_FUNCTION_LINES} lines ({lines} lines)",
                    nasa_rule='Rule 4',
                    weight=7.0
                ))

# Backwards compatibility aliases
MagicLiteralDetector = ConsolidatedMagicLiteralDetector
PositionDetector = ConsolidatedPositionDetector
GodObjectDetector = ConsolidatedGodObjectDetector
DetectorBase = ConsolidatedDetectorBase
DetectorInterface = ConsolidatedDetectorBase  # For interface compatibility

# Export all consolidated detectors
__all__ = [
    'ConsolidatedDetectorBase',
    'ConsolidatedMagicLiteralDetector',
    'ConsolidatedPositionDetector',
    'ConsolidatedGodObjectDetector',
    # Aliases
    'MagicLiteralDetector',
    'PositionDetector',
    'GodObjectDetector',
    'DetectorBase',
    'DetectorInterface',
]