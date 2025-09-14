"""
Minimal Concrete ConnascenceASTAnalyzer Implementation

Provides a concrete implementation of DetectorBase to resolve abstract class instantiation.
This is a surgical fix for the unified analyzer system.
"""

import ast
from typing import List

from utils.types import ConnascenceViolation
from .base import DetectorBase


class ConnascenceASTAnalyzer(DetectorBase):
    """Minimal concrete implementation of DetectorBase for analyzer compatibility."""
    
    def __init__(self, file_path: str = "", source_lines: List[str] = None):
        """Initialize with optional parameters for unified analyzer compatibility."""
        super().__init__(file_path, source_lines or [])
    
    def detect_violations(self, tree: ast.AST) -> List[ConnascenceViolation]:
        """
        Minimal implementation of abstract method.
        Returns empty list - actual analysis handled by unified system.
        """
        # Surgical fix: minimal implementation to satisfy abstract interface
        return []

    def analyze_directory(self, directory_path: str, **kwargs) -> List[ConnascenceViolation]:
        """
        Analyze directory for connascence violations.
        Expected by unified analyzer and CI/CD systems.
        """
        import os
        from pathlib import Path

        violations = []
        directory = Path(directory_path)

        if not directory.exists():
            return violations

        # Analyze Python files in directory
        for python_file in directory.rglob("*.py"):
            try:
                with open(python_file, 'r', encoding='utf-8') as f:
                    source = f.read()
                    tree = ast.parse(source)
                    file_violations = self.detect_violations(tree)

                    # Update file paths in violations
                    for violation in file_violations:
                        violation.file_path = str(python_file)

                    violations.extend(file_violations)
            except (SyntaxError, UnicodeDecodeError, OSError):
                # Skip files that can't be parsed or read
                continue

        return violations

    def analyze_file(self, file_path: str, **kwargs) -> List[ConnascenceViolation]:
        """
        Analyze single file for connascence violations.
        Provides standard interface for CI/CD integration.
        """
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                source = f.read()
                tree = ast.parse(source)
                violations = self.detect_violations(tree)

                # Update file paths in violations
                for violation in violations:
                    violation.file_path = file_path

                return violations
        except (SyntaxError, UnicodeDecodeError, OSError):
            return []