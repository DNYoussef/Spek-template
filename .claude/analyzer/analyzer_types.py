"""
Analyzer Types - Core type definitions for the unified analyzer system.
"""

from dataclasses import dataclass
from enum import Enum
from typing import Any, Dict, List, Optional, Union
import json


class ViolationType(Enum):
    """Types of connascence violations."""
    GOD_OBJECT = "god_object"
    MAGIC_LITERAL = "magic_literal"
    POSITION = "position"
    MEANING = "meaning"
    NAME = "name"
    TYPE = "type"
    ALGORITHM = "algorithm"
    EXECUTION = "execution"
    TIMING = "timing"


class Severity(Enum):
    """Violation severity levels."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


@dataclass
class Violation:
    """Represents a single code violation."""
    type: ViolationType
    severity: Severity
    file_path: str
    line_number: int
    description: str
    suggestion: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary representation."""
        return {
            "type": self.type.value,
            "severity": self.severity.value,
            "file_path": self.file_path,
            "line_number": self.line_number,
            "description": self.description,
            "suggestion": self.suggestion
        }


@dataclass
class UnifiedAnalysisResult:
    """Results from unified analysis."""
    total_violations: int
    violations: List[Violation]
    metrics: Dict[str, Any]
    execution_time: float

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary representation."""
        return {
            "total_violations": self.total_violations,
            "violations": [v.to_dict() for v in self.violations],
            "metrics": self.metrics,
            "execution_time": self.execution_time
        }


@dataclass
class StandardError:
    """Standard error format."""
    code: str
    message: str
    severity: str
    file_path: Optional[str] = None
    line_number: Optional[int] = None


# Error severity levels
ERROR_SEVERITY = {
    "LOW": "low",
    "MEDIUM": "medium",
    "HIGH": "high",
    "CRITICAL": "critical"
}

# Error code mapping
ERROR_CODE_MAPPING = {
    "GOD_OBJECT": "E001",
    "MAGIC_LITERAL": "E002",
    "POSITION": "E003",
    "MEANING": "E004",
    "NAME": "E005",
    "TYPE": "E006",
    "ALGORITHM": "E007",
    "EXECUTION": "E008",
    "TIMING": "E009"
}
