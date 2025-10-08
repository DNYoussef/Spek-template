from typing import Any, Dict, List, Optional, Union, Tuple, Callable, Set

"""
Fixed ConnascenceASTAnalyzer Implementation

Properly implements detection by delegating to all available detectors.
Replaces the stub implementation that was returning empty lists.
"""

from typing import List, Optional
import ast
import logging

# Import base classes and types
from .base import DetectorBase
from ..utils.types import ConnascenceViolation

logger = logging.getLogger(__name__)

class ConnascenceASTAnalyzer(DetectorBase):
    """Fixed implementation that actually performs connascence detection."""

    def __init__(self, file_path: str = "", source_lines: List[str] = None):
        """Initialize with optional parameters for unified analyzer compatibility."""
        super().__init__(file_path, source_lines or [])
        self.detectors = []
        self._initialize_detectors()

    def _initialize_detectors(self):
        """Initialize all available detectors."""
        detector_classes = []

        # Import all detector types
        try:
            from .magic_literal_detector import MagicLiteralDetector
            detector_classes.append(MagicLiteralDetector)
        except ImportError as e:
            logger.warning(f"Could not import MagicLiteralDetector: {e}")

        try:
            from .position_detector import PositionDetector
            detector_classes.append(PositionDetector)
        except ImportError as e:
            logger.warning(f"Could not import PositionDetector: {e}")

        try:
            from .algorithm_detector import AlgorithmDetector
            detector_classes.append(AlgorithmDetector)
        except ImportError as e:
            logger.warning(f"Could not import AlgorithmDetector: {e}")

        try:
            from .god_object_detector import GodObjectDetector
            detector_classes.append(GodObjectDetector)
        except ImportError as e:
            logger.warning(f"Could not import GodObjectDetector: {e}")

        try:
            from .convention_detector import ConventionDetector
            detector_classes.append(ConventionDetector)
        except ImportError as e:
            logger.warning(f"Could not import ConventionDetector: {e}")

        try:
            from .execution_detector import ExecutionDetector
            detector_classes.append(ExecutionDetector)
        except ImportError as e:
            logger.warning(f"Could not import ExecutionDetector: {e}")

        try:
            from .timing_detector import TimingDetector
            detector_classes.append(TimingDetector)
        except ImportError as e:
            logger.warning(f"Could not import TimingDetector: {e}")

        try:
            from .values_detector import ValuesDetector
            detector_classes.append(ValuesDetector)
        except ImportError as e:
            logger.warning(f"Could not import ValuesDetector: {e}")

        # Initialize detectors with proper parameters
        for detector_class in detector_classes:
            try:
                detector = detector_class(self.file_path, self.source_lines)
                self.detectors.append(detector)
            except Exception as e:
                logger.warning(f"Could not initialize {detector_class.__name__}: {e}")

    def detect_violations(self, tree: ast.AST) -> List[ConnascenceViolation]:
        """
        FIXED: Actually detect violations using all available detectors.
        This replaces the stub that was returning an empty list.
        """
        all_violations = []

        # Run each detector
        for detector in self.detectors:
            try:
                violations = detector.detect_violations(tree)
                if violations:
                    all_violations.extend(violations)
                    logger.debug(f"{detector.__class__.__name__} found {len(violations)} violations")
            except Exception as e:
                logger.error(f"Error running {detector.__class__.__name__}: {e}")

        # Also perform basic manual detection for common issues
        all_violations.extend(self._detect_basic_violations(tree))

        logger.info(f"Total violations detected: {len(all_violations)}")
        return all_violations

    def _detect_basic_violations(self, tree: ast.AST) -> List[ConnascenceViolation]:
        """Detect basic violations that might be missed by broken detectors."""
        violations = []

        for node in ast.walk(tree):
            # Detect magic numbers (Connascence of Meaning)
            if isinstance(node, ast.Constant):
                if isinstance(node.value, (int, float)):
                    # Ignore common constants
                    if node.value not in (0, 1, -1, 2, 10, 100, True, False, None):
                        violations.append(ConnascenceViolation(
                            type="Connascence of Meaning",
                            severity="warning",
                            file_path=self.file_path,
                            line_number=getattr(node, 'lineno', 0),
                            description=f"Magic number {node.value} should be a named constant"
                        ))

            # Detect long parameter lists (Connascence of Position)
            if isinstance(node, ast.FunctionDef):
                if len(node.args.args) > 3:
                    violations.append(ConnascenceViolation(
                        type="Connascence of Position",
                        severity="warning",
                        file_path=self.file_path,
                        line_number=getattr(node, 'lineno', 0),
                        description=f"Function '{node.name}' has {len(node.args.args)} parameters (max: 3)"
                    ))

            # Detect type checking (Connascence of Type)
            if isinstance(node, ast.Call):
                if isinstance(node.func, ast.Name):
                    if node.func.id in ('isinstance', 'type'):
                        violations.append(ConnascenceViolation(
                            type="Connascence of Type",
                            severity="info",
                            file_path=self.file_path,
                            line_number=getattr(node, 'lineno', 0),
                            description=f"Type checking with {node.func.id} creates type coupling"
                        ))

        return violations

    def analyze_directory(self, directory_path: str, **kwargs) -> List[ConnascenceViolation]:
        """
        Analyze directory for connascence violations.
        """
        import os
        from pathlib import Path

        all_violations = []
        directory = Path(directory_path)

        if not directory.exists():
            return all_violations

        # Analyze Python files in directory
        for python_file in directory.rglob("*.py"):
            if '__pycache__' in str(python_file):
                continue

            try:
                with open(python_file, 'r', encoding='utf-8') as f:
                    source = f.read()
                    source_lines = source.split('\n')
                    tree = ast.parse(source)

                    # Update file context
                    self.file_path = str(python_file)
                    self.source_lines = source_lines

                    # Reinitialize detectors with new context
                    self._initialize_detectors()

                    # Detect violations
                    file_violations = self.detect_violations(tree)
                    all_violations.extend(file_violations)

                    if file_violations:
                        logger.info(f"Found {len(file_violations)} violations in {python_file}")

            except SyntaxError as e:
                logger.warning(f"Syntax error in {python_file}: {e}")
            except Exception as e:
                logger.error(f"Error analyzing {python_file}: {e}")

        return all_violations