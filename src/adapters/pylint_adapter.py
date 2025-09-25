"""Pylint linter adapter implementation."""

from typing import List, Dict, Any
import json

from src.adapters.base_adapter import BaseLinterAdapter
from src.models.linter_models import (
    LinterConfig, LinterViolation, StandardSeverity, ViolationType
)

class PylintAdapter(BaseLinterAdapter):
    """Adapter for pylint Python linter."""
    
def __init__(self, config: LinterConfig):
        super().__init__(config)
        self.tool_name = "pylint"
    
def get_command_args(self, target_paths: List[str]) -> List[str]:
        """Build pylint command arguments."""
        cmd = self.config.get_command_base()
        
        # Add JSON output format
        cmd.extend(['--output-format', 'json'])
        
        # Add config file if specified
        if self.config.config_file:
            cmd.extend(['--rcfile', self.config.config_file])
        
        # Disable some verbose output for cleaner parsing
        cmd.extend(['--reports', 'no'])
        
        # Add target paths
        cmd.extend(target_paths)
        
        return cmd
    
def parse_output(self, raw_output: str, stderr: str = "") -> List[LinterViolation]:
        """Parse pylint JSON output into standardized violations."""
        violations = []
        
        if not raw_output.strip():
            return violations
        
        # Parse JSON output
        json_data = self.safe_json_parse(raw_output)
        
        for item in json_data:
            if not isinstance(item, dict):
                continue
            
            # Extract violation data
            rule_id = item.get('symbol', item.get('message-id', ''))
            if not rule_id or not self.is_rule_enabled(rule_id):
                continue
            
            # Get message and type information
            message = item.get('message', '')
            msg_type = item.get('type', '')
            category = item.get('category', msg_type)
            
            # Extract position information
            line = item.get('line', 0)
            column = item.get('column', 0)
            end_line = item.get('endLine')
            end_column = item.get('endColumn')
            
            # Create violation
            violation = self.create_violation(
                rule_id=rule_id,
                message=message,
                file_path=item.get('path', ''),
                line=line,
                column=column,
                end_line=end_line,
                end_column=end_column,
                severity_raw=msg_type,
                category=category,
                confidence=item.get('confidence', ''),
                rule_description=item.get('obj', ''),  # Object/context info
                raw_data=item
            )
            violations.append(violation)
        
        return violations
    
def normalize_severity(self, tool_severity: str, rule_id: str = "") -> StandardSeverity:
        """Convert pylint message type to standard severity."""
        # Apply user overrides first
        if rule_id:
            override = self.apply_severity_overrides(rule_id, None)
            if override:
                return override
        
        # Pylint message type mapping
        severity_map = {
            'fatal': StandardSeverity.FATAL,
            'error': StandardSeverity.ERROR,
            'warning': StandardSeverity.WARNING,
            'refactor': StandardSeverity.INFO,
            'convention': StandardSeverity.INFO,
            'information': StandardSeverity.INFO,
            # Single letter codes
            'F': StandardSeverity.FATAL,
            'E': StandardSeverity.ERROR,
            'W': StandardSeverity.WARNING,
            'R': StandardSeverity.INFO,
            'C': StandardSeverity.INFO,
            'I': StandardSeverity.INFO
        }
        
        return severity_map.get(tool_severity.lower(), StandardSeverity.WARNING)
    
def get_violation_type(self, rule_id: str, category: str = "") -> ViolationType:
        """Determine violation type from pylint rule ID and category."""
        if not rule_id:
            return ViolationType.STYLE
        
        # Pylint rule ID patterns
        if rule_id.startswith('C'):
            return ViolationType.CONVENTION
        elif rule_id.startswith('R'):
            return ViolationType.REFACTOR
        elif rule_id.startswith('W'):
            return ViolationType.STYLE
        elif rule_id.startswith('E'):
            return ViolationType.LOGIC
        elif rule_id.startswith('F'):
            return ViolationType.SYNTAX
        
        # Category-based mapping
        category_map = {
            'typecheck': ViolationType.TYPE,
            'basic': ViolationType.LOGIC,
            'classes': ViolationType.LOGIC,
            'design': ViolationType.REFACTOR,
            'exceptions': ViolationType.LOGIC,
            'format': ViolationType.STYLE,
            'imports': ViolationType.IMPORT,
            'logging': ViolationType.LOGIC,
            'miscellaneous': ViolationType.STYLE,
            'newstyle': ViolationType.CONVENTION,
            'raw_metrics': ViolationType.COMPLEXITY,
            'refactoring': ViolationType.REFACTOR,
            'similarities': ViolationType.REFACTOR,
            'spelling': ViolationType.CONVENTION,
            'stdlib': ViolationType.LOGIC,
            'string': ViolationType.LOGIC,
            'variables': ViolationType.LOGIC,
        }
        
        return category_map.get(category.lower(), ViolationType.STYLE)
    
def _get_confidence_level(self, confidence: str) -> str:
        """Normalize pylint confidence levels."""
        confidence_map = {
            'HIGH': 'high',
            'INFERENCE': 'medium',
            'INFERENCE_FAILURE': 'low',
            'UNDEFINED': 'unknown'
        }
        return confidence_map.get(confidence.upper(), confidence.lower())