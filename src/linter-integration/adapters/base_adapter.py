from src.constants.base import MAXIMUM_FUNCTION_PARAMETERS

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Dict, List, Any, Optional, Union
from enum import Enum
import json
import subprocess
import asyncio

class SeverityLevel(Enum):
    """Unified severity levels across all linters"""
    CRITICAL = "critical"
    HIGH = "high" 
    MEDIUM = "medium"
    LOW = "low"
    INFO = "info"

class ViolationType(Enum):
    """Unified violation types"""
    SYNTAX_ERROR = "syntax_error"
    TYPE_ERROR = "type_error"
    STYLE_VIOLATION = "style_violation"
    SECURITY_ISSUE = "security_issue"
    CODE_QUALITY = "code_quality"
    COMPLEXITY = "complexity"
    DUPLICATION = "duplication"
    MAINTAINABILITY = "maintainability"

@dataclass
class LinterViolation:
    """Unified violation format across all linters"""
    file_path: str
    line_number: int
    column_number: int
    rule_id: str
    rule_name: str
    message: str
    severity: SeverityLevel
    violation_type: ViolationType
    source_tool: str
    context: Optional[str] = None
    fix_suggestion: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "file_path": self.file_path,
            "line_number": self.line_number,
            "column_number": self.column_number,
            "rule_id": self.rule_id,
            "rule_name": self.rule_name,
            "message": self.message,
            "severity": self.severity.value,
            "violation_type": self.violation_type.value,
            "source_tool": self.source_tool,
            "context": self.context,
            "fix_suggestion": self.fix_suggestion
        }

@dataclass
class LinterResult:
    """Unified result format for linter execution"""
    tool_name: str
    execution_time: float
    exit_code: int
    violations: List[LinterViolation]
    files_analyzed: int
    total_violations: int
    violations_by_severity: Dict[str, int]
    raw_output: str
    error_output: str = ""
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "tool_name": self.tool_name,
            "execution_time": self.execution_time,
            "exit_code": self.exit_code,
            "violations": [v.to_dict() for v in self.violations],
            "files_analyzed": self.files_analyzed,
            "total_violations": self.total_violations,
            "violations_by_severity": self.violations_by_severity,
            "raw_output": self.raw_output,
            "error_output": self.error_output
        }

class BaseLinterAdapter(ABC):
    """
    Abstract base class for all linter adapters.
    Provides common interface and functionality for linter integration.
    """
    
    def __init__(self, tool_name: str, config_path: Optional[str] = None):
        self.tool_name = tool_name
        self.config_path = config_path
        self.severity_mapping = self._get_severity_mapping()
        self.violation_type_mapping = self._get_violation_type_mapping()
        
    @abstractmethod
    def _get_severity_mapping(self) -> Dict[str, SeverityLevel]:
        """Get tool-specific severity mapping to unified levels"""
        
    @abstractmethod
    def _get_violation_type_mapping(self) -> Dict[str, ViolationType]:
        """Get tool-specific violation type mapping"""
        
    @abstractmethod
    def _build_command(self, target_path: str, **kwargs) -> List[str]:
        """Build command line arguments for the linter"""
        
    @abstractmethod
    def _parse_output(self, stdout: str, stderr: str) -> List[LinterViolation]:
        """Parse linter output into unified violation format"""
        
    async def run_analysis(self, target_path: str, **kwargs) -> LinterResult:
        """
        Run linter analysis on target path and return unified results.
        
        Args:
            target_path: Path to analyze (file or directory)
            **kwargs: Additional tool-specific options
            
        Returns:
            LinterResult with unified violation format
        """
        import time
        start_time = time.time()
        
        try:
            # Build command
            command = self._build_command(target_path, **kwargs)
            
            # Execute linter
            process = await asyncio.create_subprocess_exec(
                *command,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            stdout, stderr = await process.communicate()
            execution_time = time.time() - start_time
            
            # Parse output
            violations = self._parse_output(
                stdout.decode('utf-8', errors='ignore'),
                stderr.decode('utf-8', errors='ignore')
            )
            
            # Calculate metrics
            violations_by_severity = self._count_violations_by_severity(violations)
            
            return LinterResult(
                tool_name=self.tool_name,
                execution_time=execution_time,
                exit_code=process.returncode,
                violations=violations,
                files_analyzed=self._count_analyzed_files(violations),
                total_violations=len(violations),
                violations_by_severity=violations_by_severity,
                raw_output=stdout.decode('utf-8', errors='ignore'),
                error_output=stderr.decode('utf-8', errors='ignore')
            )
            
        except Exception as e:
            execution_time = time.time() - start_time
            return LinterResult(
                tool_name=self.tool_name,
                execution_time=execution_time,
                exit_code=-1,
                violations=[],
                files_analyzed=0,
                total_violations=0,
                violations_by_severity={},
                raw_output="",
                error_output=str(e)
            )
            
    def _count_violations_by_severity(self, violations: List[LinterViolation]) -> Dict[str, int]:
        """Count violations by severity level"""
        counts = {severity.value: 0 for severity in SeverityLevel}
        for violation in violations:
            counts[violation.severity.value] += 1
        return counts
        
    def _count_analyzed_files(self, violations: List[LinterViolation]) -> int:
        """Count unique files that were analyzed"""
        return len(set(v.file_path for v in violations))
        
    def map_severity(self, tool_severity: str) -> SeverityLevel:
        """Map tool-specific severity to unified severity level"""
        return self.severity_mapping.get(tool_severity.lower(), SeverityLevel.MEDIUM)
        
    def map_violation_type(self, rule_id: str, rule_name: str = "") -> ViolationType:
        """Map rule ID to unified violation type"""
        rule_key = rule_id.lower()
        
        # Check direct mapping first
        if rule_key in self.violation_type_mapping:
            return self.violation_type_mapping[rule_key]
            
        # Fallback to pattern matching
        if any(pattern in rule_key for pattern in ['syntax', 'parse']):
            return ViolationType.SYNTAX_ERROR
        elif any(pattern in rule_key for pattern in ['type', 'annotation']):
            return ViolationType.TYPE_ERROR
        elif any(pattern in rule_key for pattern in ['style', 'format', 'naming']):
            return ViolationType.STYLE_VIOLATION
        elif any(pattern in rule_key for pattern in ['security', 'vulnerability', 'injection']):
            return ViolationType.SECURITY_ISSUE
        elif any(pattern in rule_key for pattern in ['complex', 'cognitive']):
            return ViolationType.COMPLEXITY
        elif any(pattern in rule_key for pattern in ['duplicate', 'copy']):
            return ViolationType.DUPLICATION
        else:
            return ViolationType.CODE_QUALITY
            
    def validate_tool_availability(self) -> bool:
        """Check if the linter tool is available in the system"""
        try:
            result = subprocess.run(
                [self.tool_name, '--version'],
                capture_output=True,
                timeout=MAXIMUM_FUNCTION_PARAMETERS
            )
            return result.returncode == 0
        except (subprocess.TimeoutExpired, FileNotFoundError):
            return False
            
    def get_tool_info(self) -> Dict[str, Any]:
        """Get information about the linter tool"""
        try:
            result = subprocess.run(
                [self.tool_name, '--version'],
                capture_output=True,
                timeout=MAXIMUM_FUNCTION_PARAMETERS
            )
            if result.returncode == 0:
                version_output = result.stdout.decode('utf-8', errors='ignore')
                return {
                    "tool_name": self.tool_name,
                    "available": True,
                    "version_info": version_output.strip(),
                    "config_path": self.config_path
                }
        except (subprocess.TimeoutExpired, FileNotFoundError):
            pass
            
        return {
            "tool_name": self.tool_name,
            "available": False,
            "version_info": None,
            "config_path": self.config_path
        }