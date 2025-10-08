from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Union, Tuple, Callable, Set

"""
Type definitions for the connascence analyzer ecosystem.
Provides canonical types used across all analyzer modules.
"""

from typing import Any, Dict, List, Optional, Union

from dataclasses import dataclass
from enum import Enum

class ConnascenceType(Enum):
    """Connascence types with NASA POT10 rule alignment."""
    CoM = "CoM"  # Connascence of Meaning (magic literals) - NASA Rule 8
    CoP = "CoP"  # Connascence of Position - NASA Rule 6  
    CoA = "CoA"  # Connascence of Algorithm - NASA Rule 1
    CoT = "CoT"  # Connascence of Type - NASA Rule 9
    CoV = "CoV"  # Connascence of Values - NASA Rule 5
    CoE = "CoE"  # Connascence of Execution - NASA Rule 4
    CoI = "CoI"  # Connascence of Identity - NASA Rule 7
    CoN = "CoN"  # Connascence of Naming - NASA Rule 2
    CoC = "CoC"  # Connascence of Convention - NASA Rule 10

class SeverityLevel(Enum):
    """Severity levels for connascence violations."""
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"

@dataclass
class ConnascenceViolation:
    """
    Canonical violation type representing a connascence violation.
    Used throughout the analyzer ecosystem for consistent violation reporting.
    """
    type: str = ""
    severity: str = "medium"
    description: str = ""
    file_path: str = ""
    line_number: int = 0
    column: int = 0
    id: Optional[str] = None

    # FIXED: Add missing fields used by detector interface
    recommendation: Optional[str] = None
    code_snippet: Optional[str] = None
    context: Optional[Dict[str, Any]] = None

    # Extended fields for enhanced analysis
    rule_id: Optional[str] = None
    connascence_type: Optional[Union[str, ConnascenceType]] = None
    weight: float = 1.0
    nasa_rule: Optional[str] = None
    defense_criticality: Optional[str] = None

    # Context information
    function_name: Optional[str] = None
    class_name: Optional[str] = None
    module_name: Optional[str] = None
    
    def __post_init__(self):
        """Ensure severity is valid."""
        if self.severity not in ["critical", "high", "medium", "low"]:
            self.severity = "medium"
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert violation to dictionary for JSON serialization."""
        return {
            "id": self.id,
            "type": self.type,
            "severity": self.severity,
            "description": self.description,
            "file_path": self.file_path,
            "line_number": self.line_number,
            "column": self.column,
            "rule_id": self.rule_id,
            "connascence_type": str(self.connascence_type) if self.connascence_type else None,
            "weight": self.weight,
            "nasa_rule": self.nasa_rule,
            "defense_criticality": self.defense_criticality,
            "function_name": self.function_name,
            "class_name": self.class_name,
            "module_name": self.module_name
        }

@dataclass
class AnalysisResult:
    """Container for analysis results."""
    violations: List[ConnascenceViolation]
    summary: Dict[str, Any]
    metadata: Dict[str, Any]
    
    def __post_init__(self):
        if not self.violations:
            self.violations = []
        if not self.summary:
            self.summary = {}
        if not self.metadata:
            self.metadata = {}

# Type aliases for backward compatibility
Violation = ConnascenceViolation