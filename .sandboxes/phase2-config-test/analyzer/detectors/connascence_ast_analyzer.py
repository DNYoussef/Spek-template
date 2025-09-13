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