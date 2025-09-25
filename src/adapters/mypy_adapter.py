"""MyPy type checker adapter implementation."""

from typing import List, Dict, Any
import json
import re

from src.adapters.base_adapter import BaseLinterAdapter
from src.models.linter_models import (
    LinterConfig, LinterViolation, StandardSeverity, ViolationType
)

class MypyAdapter(BaseLinterAdapter):
    """Adapter for MyPy static type checker."""
    
def __init__(self, config: LinterConfig):
        super().__init__(config)
        self.tool_name = "mypy"
    
def get_command_args(self, target_paths: List[str]) -> List[str]:
        """Build mypy command arguments."""
        cmd = self.config.get_command_base()
        
        # Add structured output options
        cmd.extend([
            '--show-error-codes',
            '--show-column-numbers',
            '--show-error-context',
            '--error-format',
            'json'  # Request JSON format if supported
        ])
        
        # Add config file if specified
        if self.config.config_file:
            cmd.extend(['--config-file', self.config.config_file])
        
        # Add target paths
        cmd.extend(target_paths)
        
        return cmd
    
def parse_output(self, raw_output: str, stderr: str = "") -> List[LinterViolation]:
        """Parse mypy output into standardized violations."""
        violations = []
        
        if not raw_output.strip():
            return violations
        
        # Try JSON parsing first
        json_violations = self._parse_json_output(raw_output)
        if json_violations:
            return json_violations
        
        # Fall back to text parsing
        return self._parse_text_output(raw_output)
    
def _parse_json_output(self, output: str) -> List[LinterViolation]:
        """Parse JSON-formatted mypy output."""
        violations = []
        
        # Check if output looks like JSON
        if not output.strip().startswith('[') and not output.strip().startswith('{'):
            return []
        
        json_data = self.safe_json_parse(output)
        
        for item in json_data:
            if not isinstance(item, dict):
                continue
            
            # Extract violation data
            rule_id = item.get('code', item.get('error_code', ''))
            message = item.get('message', '')
            filename = item.get('file', item.get('filename', ''))
            
            line = item.get('line', 0)
            column = item.get('column', 0)
            severity = item.get('severity', 'error')
            
            # Create violation
            violation = self.create_violation(
                rule_id=rule_id,
                message=message,
                file_path=filename,
                line=line,
                column=column,
                severity_raw=severity,
                category='type-check',
                raw_data=item
            )
            violations.append(violation)
        
        return violations
    
def _parse_text_output(self, output: str) -> List[LinterViolation]:
        """Parse standard mypy text output."""
        violations = []
        
        # Pattern: filename:line:column: severity: message [error-code]
        pattern = r'^(.+?):(\d+):(?:(\d+):)?\s*(error|warning|note):\s*(.+?)(?:\s+\[([^\]]+)\])?$'
        
        for line in output.strip().split('\n'):
            if not line.strip():
                continue
            
            match = re.match(pattern, line)
            if not match:
                # Try simplified pattern without column
                simple_pattern = r'^(.+?):(\d+):\s*(error|warning|note):\s*(.+?)(?:\s+\[([^\]]+)\])?$'
                match = re.match(simple_pattern, line)
                if match:
                    file_path, line_num, severity, message, error_code = match.groups()
                    column = None
                else:
                    continue
            else:
                file_path, line_num, column_str, severity, message, error_code = match.groups()
                column = int(column_str) if column_str else None
            
            # Use error code as rule ID, or generate one from message
            rule_id = error_code or self._extract_rule_from_message(message)
            
            if not self.is_rule_enabled(rule_id):
                continue
            
            violation = self.create_violation(
                rule_id=rule_id,
                message=message,
                file_path=file_path,
                line=int(line_num),
                column=column,
                severity_raw=severity,
                category='type-check',
                raw_data={'raw_line': line}
            )
            violations.append(violation)
        
        return violations
    
def normalize_severity(self, tool_severity: str, rule_id: str = "") -> StandardSeverity:
        """Convert mypy severity to standard severity."""
        # Apply user overrides first
        if rule_id:
            override = self.apply_severity_overrides(rule_id, None)
            if override:
                return override
        
        # MyPy severity mapping
        severity_map = {
            'error': StandardSeverity.ERROR,
            'warning': StandardSeverity.WARNING,
            'note': StandardSeverity.INFO,
        }
        
        return severity_map.get(tool_severity.lower(), StandardSeverity.ERROR)
    
def get_violation_type(self, rule_id: str, category: str = "") -> ViolationType:
        """Determine violation type from mypy rule ID."""
        # All mypy violations are type-related
        return ViolationType.TYPE
    
def _extract_rule_from_message(self, message: str) -> str:
        """Extract or generate rule ID from error message."""
        # Common mypy error patterns
        patterns = {
            r"Name '.*' is not defined": "name-defined",
            r".*has no attribute.*": "attr-defined",
            r"Incompatible types in assignment": "assignment",
            r"Argument .* has incompatible type": "arg-type",
            r".*cannot be applied to.*": "operator",
            r"Missing return statement": "return-value",
            r"Function is missing a type annotation": "no-untyped-def",
            r"Call to untyped function": "no-untyped-call",
            r"Module .* has no attribute": "attr-defined",
            r"Cannot determine type of": "misc",
            r".*is not subscriptable": "misc",
            r"Item .* of .* has incompatible type": "list-item",
            r"Dict entry .* has incompatible type": "dict-item",
        }
        
        for pattern, rule_id in patterns.items():
            if re.search(pattern, message, re.IGNORECASE):
                return rule_id
        
        # Generate generic rule ID
        if "incompatible type" in message.lower():
            return "type-mismatch"
        elif "not defined" in message.lower():
            return "name-error"
        elif "no attribute" in message.lower():
            return "attr-error"
        else:
            return "misc"