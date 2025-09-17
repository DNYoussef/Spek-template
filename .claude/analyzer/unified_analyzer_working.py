"""
Working Unified Analyzer - Minimal Reality Implementation
========================================================

This is a working implementation that eliminates import theater and provides
real violation detection capabilities for sandbox testing.

NO THEATER - ONLY REALITY:
- Working imports (no relative import failures)
- Real violation detection (finds actual code issues)
- ASCII-only output (Windows terminal compatible)
- Genuine component integration
"""

import ast
import os
import sys
from pathlib import Path
from typing import List, Dict, Any, Optional
import logging

# Import fixed types
try:
    from analyzer.analyzer_types import (
        Violation, ViolationType, Severity, UnifiedAnalysisResult
    )
except ImportError:
    # Fallback if types not available
    from dataclasses import dataclass
    from enum import Enum

    class ViolationType(Enum):
        GOD_OBJECT = "god_object"
        MAGIC_LITERAL = "magic_literal"
        POSITION = "position"

    class Severity(Enum):
        HIGH = "high"
        MEDIUM = "medium"
        LOW = "low"

    @dataclass
    class Violation:
        type: ViolationType
        severity: Severity
        file_path: str
        line_number: int
        description: str
        suggestion: Optional[str] = None

    @dataclass
    class UnifiedAnalysisResult:
        total_violations: int
        violations: List[Violation]
        metrics: Dict[str, Any]
        execution_time: float


logger = logging.getLogger(__name__)


class WorkingUnifiedAnalyzer:
    """
    Minimal working analyzer that ACTUALLY detects violations.

    NO THEATER - This implementation:
    1. Actually parses Python files
    2. Actually detects god objects (>20 methods)
    3. Actually detects magic literals (numeric constants)
    4. Actually detects position violations (>5 parameters)
    5. Returns real violation objects
    """

    def __init__(self):
        """Initialize working analyzer."""
        self.detectors = {
            'god_object': self._detect_god_objects,
            'magic_literal': self._detect_magic_literals,
            'position': self._detect_position_violations
        }
        logger.info("WorkingUnifiedAnalyzer initialized with real detectors")

    def analyze_file(self, file_path: str) -> List[Violation]:
        """Analyze a single file and return real violations."""
        violations = []

        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()

            # Parse AST
            tree = ast.parse(content)

            # Run all detectors
            for detector_name, detector_func in self.detectors.items():
                try:
                    detector_violations = detector_func(tree, file_path)
                    violations.extend(detector_violations)
                except Exception as e:
                    logger.warning(f"Detector {detector_name} failed: {e}")

            logger.info(f"Found {len(violations)} violations in {file_path}")

        except Exception as e:
            logger.error(f"Failed to analyze {file_path}: {e}")

        return violations

    def analyze_project(self, project_path: str) -> List[Violation]:
        """Analyze entire project and return all violations."""
        all_violations = []

        project_dir = Path(project_path)
        python_files = list(project_dir.glob("**/*.py"))

        for py_file in python_files:
            file_violations = self.analyze_file(str(py_file))
            all_violations.extend(file_violations)

        logger.info(f"Project analysis complete: {len(all_violations)} total violations")
        return all_violations

    def _detect_god_objects(self, tree: ast.AST, file_path: str) -> List[Violation]:
        """Detect classes with too many methods (god objects)."""
        violations = []

        for node in ast.walk(tree):
            if isinstance(node, ast.ClassDef):
                method_count = sum(1 for child in node.body
                                 if isinstance(child, ast.FunctionDef))

                if method_count > 20:  # God object threshold
                    violation = Violation(
                        type=ViolationType.GOD_OBJECT,
                        severity=Severity.HIGH,
                        file_path=file_path,
                        line_number=node.lineno,
                        description=f"Class '{node.name}' has {method_count} methods (>20 threshold)",
                        suggestion="Consider breaking this class into smaller, focused classes"
                    )
                    violations.append(violation)

        return violations

    def _detect_magic_literals(self, tree: ast.AST, file_path: str) -> List[Violation]:
        """Detect magic number literals."""
        violations = []

        for node in ast.walk(tree):
            if isinstance(node, ast.Num):  # Python < 3.8
                if isinstance(node.n, (int, float)) and abs(node.n) > 1:
                    violation = Violation(
                        type=ViolationType.MAGIC_LITERAL,
                        severity=Severity.MEDIUM,
                        file_path=file_path,
                        line_number=node.lineno,
                        description=f"Magic literal found: {node.n}",
                        suggestion="Consider defining this as a named constant"
                    )
                    violations.append(violation)
            elif isinstance(node, ast.Constant):  # Python >= 3.8
                if isinstance(node.value, (int, float)) and abs(node.value) > 1:
                    violation = Violation(
                        type=ViolationType.MAGIC_LITERAL,
                        severity=Severity.MEDIUM,
                        file_path=file_path,
                        line_number=node.lineno,
                        description=f"Magic literal found: {node.value}",
                        suggestion="Consider defining this as a named constant"
                    )
                    violations.append(violation)

        return violations

    def _detect_position_violations(self, tree: ast.AST, file_path: str) -> List[Violation]:
        """Detect functions with too many parameters."""
        violations = []

        for node in ast.walk(tree):
            if isinstance(node, ast.FunctionDef):
                param_count = len(node.args.args)

                if param_count > 5:  # Too many parameters threshold
                    violation = Violation(
                        type=ViolationType.POSITION,
                        severity=Severity.MEDIUM,
                        file_path=file_path,
                        line_number=node.lineno,
                        description=f"Function '{node.name}' has {param_count} parameters (>5 threshold)",
                        suggestion="Consider grouping parameters into objects or reducing complexity"
                    )
                    violations.append(violation)

        return violations


# Alias for compatibility
UnifiedAnalyzer = WorkingUnifiedAnalyzer
UnifiedConnascenceAnalyzer = WorkingUnifiedAnalyzer
