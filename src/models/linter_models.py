"""Unified data models for linter violations and results."""

from pathlib import Path
from typing import Dict, List, Optional, Any, Union
import json

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from enum import Enum

class StandardSeverity(Enum):
    """Standardized severity levels across all linters."""
    FATAL = "fatal"
    ERROR = "error"
    WARNING = "warning"
    INFO = "info"
    NOTE = "note"

class ViolationType(Enum):
    """Categories of linter violations."""
    SYNTAX = "syntax"
    STYLE = "style"
    LOGIC = "logic"
    SECURITY = "security"
    TYPE = "type"
    CONVENTION = "convention"
    REFACTOR = "refactor"
    IMPORT = "import"
    COMPLEXITY = "complexity"
    PERFORMANCE = "performance"

@dataclass
class Position:
    """Position information for a violation."""
    line: int
    column: Optional[int] = None
    end_line: Optional[int] = None
    end_column: Optional[int] = None

@dataclass
class LinterViolation:
    """Standardized representation of a linter violation."""
    # Core identification
    tool: str
    rule_id: str
    message: str
    severity: StandardSeverity
    violation_type: ViolationType
    
    # Location information
    file_path: str
    position: Position
    
    # Additional context
    rule_description: Optional[str] = None
    fix_suggestion: Optional[str] = None
    confidence: Optional[str] = None
    category: Optional[str] = None
    cwe_id: Optional[str] = None  # For security violations
    
    # Tool-specific data
    raw_data: Dict[str, Any] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert violation to dictionary format."""
        return {
            "tool": self.tool,
            "rule_id": self.rule_id,
            "message": self.message,
            "severity": self.severity.value,
            "violation_type": self.violation_type.value,
            "file_path": self.file_path,
            "position": {
                "line": self.position.line,
                "column": self.position.column,
                "end_line": self.position.end_line,
                "end_column": self.position.end_column,
            },
            "rule_description": self.rule_description,
            "fix_suggestion": self.fix_suggestion,
            "confidence": self.confidence,
            "category": self.category,
            "cwe_id": self.cwe_id,
            "raw_data": self.raw_data,
        }

@dataclass
class LinterResult:
    """Complete result from a linter execution."""
    tool: str
    exit_code: int
    violations: List[LinterViolation]
    execution_time: float
    files_analyzed: List[str]
    config_used: Optional[str] = None
    version: Optional[str] = None
    error_output: Optional[str] = None
    
    @property
    def has_violations(self) -> bool:
        """Check if any violations were found."""
        return len(self.violations) > 0
    
    @property
    def violation_count_by_severity(self) -> Dict[StandardSeverity, int]:
        """Count violations by severity."""
        counts = {severity: 0 for severity in StandardSeverity}
        for violation in self.violations:
            counts[violation.severity] += 1
        return counts
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert result to dictionary format."""
        return {
            "tool": self.tool,
            "exit_code": self.exit_code,
            "violations": [v.to_dict() for v in self.violations],
            "execution_time": self.execution_time,
            "files_analyzed": self.files_analyzed,
            "config_used": self.config_used,
            "version": self.version,
            "error_output": self.error_output,
            "violation_counts": {
                severity.value: count 
                for severity, count in self.violation_count_by_severity.items()
            }
        }

@dataclass
class LinterConfig:
    """Configuration for a specific linter tool."""
    tool_name: str
    executable_path: Optional[str] = None
    config_file: Optional[str] = None
    extra_args: List[str] = field(default_factory=list)
    enabled_rules: Optional[List[str]] = None
    disabled_rules: Optional[List[str]] = None
    severity_overrides: Dict[str, StandardSeverity] = field(default_factory=dict)
    timeout: int = 300  # seconds
    
    def get_command_base(self) -> List[str]:
        """Get base command for the linter."""
        cmd = [self.executable_path or self.tool_name]
        if self.config_file:
            # Tool-specific config file flags will be added by adapters
            pass
        cmd.extend(self.extra_args)
        return cmd

class LinterAdapter(ABC):
    """Abstract base class for all linter adapters."""
    
    def __init__(self, config: LinterConfig):
        self.config = config
        self.tool_name = config.tool_name
    
    @abstractmethod
    async def run_linter(self, target_paths: List[str]) -> LinterResult:
        """Execute the linter on specified paths."""
    
    @abstractmethod
    def parse_output(self, raw_output: str, stderr: str = "") -> List[LinterViolation]:
        """Parse raw linter output into standardized violations."""
    
    @abstractmethod
    def get_command_args(self, target_paths: List[str]) -> List[str]:
        """Get command line arguments for the linter."""
    
    @abstractmethod
    def normalize_severity(self, tool_severity: str, rule_id: str = "") -> StandardSeverity:
        """Convert tool-specific severity to standard severity."""
    
    @abstractmethod
    def get_violation_type(self, rule_id: str, category: str = "") -> ViolationType:
        """Determine violation type from rule ID and category."""
    
    def validate_config(self) -> bool:
        """Validate the adapter configuration."""
        # Check if executable exists
        import shutil
        if self.config.executable_path:
            return shutil.which(self.config.executable_path) is not None
        return shutil.which(self.tool_name) is not None