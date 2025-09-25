"""Flake8 linter adapter implementation."""

from typing import List, Dict, Any
import json
import re

from src.adapters.base_adapter import BaseLinterAdapter
from src.models.linter_models import (
    LinterConfig, LinterViolation, StandardSeverity, ViolationType
)

class Flake8Adapter(BaseLinterAdapter):
    """Adapter for flake8 Python linter."""
    
def __init__(self, config: LinterConfig):
        super().__init__(config)
        self.tool_name = "flake8"
    
def get_command_args(self, target_paths: List[str]) -> List[str]:
        """Build flake8 command arguments."""
        cmd = self.config.get_command_base()
        
        # Add JSON format for structured output
        cmd.extend(['--format', '{"file":"%(path)s","line":%(row)d,"column":%(col)d,"code":"%(code)s","text":"%(text)s"}'])
        
        # Add config file if specified
        if self.config.config_file:
            cmd.extend(['--config', self.config.config_file])
        
        # Add target paths
        cmd.extend(target_paths)
        
        return cmd
    
def parse_output(self, raw_output: str, stderr: str = "") -> List[LinterViolation]:
        """Parse flake8 output into standardized violations."""
        violations = []
        
        if not raw_output.strip():
            return violations
        
        # Try JSON parsing first (structured format)
        json_violations = self._parse_json_output(raw_output)
        if json_violations:
            return json_violations
        
        # Fall back to text parsing
        return self._parse_text_output(raw_output)
    
def _parse_json_output(self, output: str) -> List[LinterViolation]:
        """Parse JSON-formatted flake8 output."""
        violations = []
        
        for line in output.strip().split('\n'):
            if not line.strip():
                continue
                
            try:
                data = json.loads(line)
                
                rule_id = data.get('code', '')
                if not self.is_rule_enabled(rule_id):
                    continue
                
                violation = self.create_violation(
                    rule_id=rule_id,
                    message=data.get('text', ''),
                    file_path=data.get('file', ''),
                    line=data.get('line', 0),
                    column=data.get('column', 0),
                    severity_raw=self._get_severity_from_code(rule_id),
                    category=self._get_category_from_code(rule_id),
                    raw_data=data
                )
                violations.append(violation)
                
            except json.JSONDecodeError:
                # Skip malformed JSON lines
                continue
        
        return violations
    
def _parse_text_output(self, output: str) -> List[LinterViolation]:
        """Parse standard flake8 text output."""
        violations = []
        
        # Pattern: filename:line:column: code message
        pattern = r'^(.+?):(\d+):(\d+): (\w\d+) (.+)$'
        
        for line in output.strip().split('\n'):
            match = re.match(pattern, line)
            if not match:
                continue
            
            file_path, line_num, column, code, message = match.groups()
            
            if not self.is_rule_enabled(code):
                continue
            
            violation = self.create_violation(
                rule_id=code,
                message=message,
                file_path=file_path,
                line=int(line_num),
                column=int(column),
                severity_raw=self._get_severity_from_code(code),
                category=self._get_category_from_code(code),
                raw_data={'raw_line': line}
            )
            violations.append(violation)
        
        return violations
    
def normalize_severity(self, tool_severity: str, rule_id: str = "") -> StandardSeverity:
        """Convert flake8 severity to standard severity."""
        # Apply user overrides first
        if rule_id:
            override = self.apply_severity_overrides(rule_id, None)
            if override:
                return override
        
        # Flake8 uses code prefixes to indicate severity
        if rule_id:
            first_char = rule_id[0].upper()
            if first_char == 'F':  # Flake8/PyFlakes errors
                return StandardSeverity.ERROR
            elif first_char == 'E':  # PEP8 errors
                return StandardSeverity.ERROR
            elif first_char == 'W':  # PEP8 warnings
                return StandardSeverity.WARNING
            elif first_char == 'C':  # Complexity/McCabe
                return StandardSeverity.WARNING
            elif first_char == 'N':  # Naming conventions
                return StandardSeverity.WARNING
        
        # Default based on tool_severity string
        severity_map = {
            'error': StandardSeverity.ERROR,
            'warning': StandardSeverity.WARNING,
            'fatal': StandardSeverity.FATAL,
        }
        
        return severity_map.get(tool_severity.lower(), StandardSeverity.WARNING)
    
def get_violation_type(self, rule_id: str, category: str = "") -> ViolationType:
        """Determine violation type from flake8 rule ID."""
        if not rule_id:
            return ViolationType.STYLE
        
        first_char = rule_id[0].upper()
        
        # Flake8 code categories
        type_map = {
            'F': ViolationType.LOGIC,      # PyFlakes - undefined names, imports, etc.
            'E': ViolationType.STYLE,      # PEP8 errors - formatting, syntax
            'W': ViolationType.STYLE,      # PEP8 warnings - style issues
            'C': ViolationType.COMPLEXITY, # McCabe complexity
            'N': ViolationType.CONVENTION, # Naming conventions
            'B': ViolationType.LOGIC,      # Bugbear - likely bugs
            'S': ViolationType.SECURITY,   # Security issues
            'I': ViolationType.IMPORT,     # Import issues
            'D': ViolationType.CONVENTION, # Docstring conventions
            'T': ViolationType.TYPE,       # Type annotations
            'P': ViolationType.PERFORMANCE # Performance issues
        }
        
        return type_map.get(first_char, ViolationType.STYLE)
    
def _get_severity_from_code(self, code: str) -> str:
        """Extract severity indication from error code."""
        if not code:
            return "warning"
        
        first_char = code[0].upper()
        if first_char in ['F', 'E']:
            return "error"
        else:
            return "warning"
    
def _get_category_from_code(self, code: str) -> str:
        """Get descriptive category from error code."""
        if not code:
            return "unknown"
        
        first_char = code[0].upper()
        categories = {
            'F': 'PyFlakes',
            'E': 'PEP8 Error',
            'W': 'PEP8 Warning',
            'C': 'Complexity',
            'N': 'Naming',
            'B': 'Bugbear',
            'S': 'Security',
            'I': 'Import',
            'D': 'Docstring',
            'T': 'Type Hint',
            'P': 'Performance'
        }
        
        return categories.get(first_char, f'Unknown ({first_char})')