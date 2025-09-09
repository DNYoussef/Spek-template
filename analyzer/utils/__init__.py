"""
Analyzer utilities package.
Provides common utilities, types, and patterns for the connascence analyzer.
"""

from .types import (
    ConnascenceViolation,
    ConnascenceType,
    SeverityLevel,
    AnalysisResult,
    Violation
)

__all__ = [
    "ConnascenceViolation",
    "ConnascenceType", 
    "SeverityLevel",
    "AnalysisResult",
    "Violation"
]