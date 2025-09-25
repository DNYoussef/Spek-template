"""Ruff linter adapter implementation."""

from typing import List, Dict, Any, Optional
import json

from src.adapters.base_adapter import BaseLinterAdapter
from src.models.linter_models import (
    LinterConfig, LinterViolation, StandardSeverity, ViolationType
)

class RuffAdapter(BaseLinterAdapter):
    """Adapter for Ruff Python linter and formatter."""
    
def __init__(self, config: LinterConfig):
        super().__init__(config)
        self.tool_name = "ruff"
    
def get_command_args(self, target_paths: List[str]) -> List[str]:
        """Build ruff command arguments."""
        cmd = self.config.get_command_base()
        
        # Add check subcommand
        cmd.append('check')
        
        # Add JSON output format
        cmd.extend(['--format', 'json'])
        
        # Add config file if specified
        if self.config.config_file:
            cmd.extend(['--config', self.config.config_file])
        
        # Add target paths
        cmd.extend(target_paths)
        
        return cmd
    
def parse_output(self, raw_output: str, stderr: str = "") -> List[LinterViolation]:
        """Parse ruff JSON output into standardized violations."""
        violations = []
        
        if not raw_output.strip():
            return violations
        
        # Parse JSON output
        json_data = self.safe_json_parse(raw_output)
        
        for item in json_data:
            if not isinstance(item, dict):
                continue
            
            # Extract violation data
            rule_id = item.get('code', '')
            if not rule_id or not self.is_rule_enabled(rule_id):
                continue
            
            # Get message and location
            message = item.get('message', '')
            filename = item.get('filename', '')
            
            # Extract location information
            location = item.get('location', {})
            line = location.get('row', 0)
            column = location.get('column', 0)
            
            # Extract end location if available
            end_location = item.get('end_location', {})
            end_line = end_location.get('row') if end_location else None
            end_column = end_location.get('column') if end_location else None
            
            # Extract fix suggestion if available
            fix_suggestion = None
            if 'fix' in item:
                fix_data = item['fix']
                if isinstance(fix_data, dict) and 'applicability' in fix_data:
                    # Ruff provides structured fix data
                    applicability = fix_data.get('applicability', '')
                    if applicability in ['automatic', 'suggested']:
                        # Extract fix message or edits
                        edits = fix_data.get('edits', [])
                        if edits:
                            fix_suggestion = f"Automatic fix available ({len(edits)} edits)"
            
            # Determine URL for rule documentation
            rule_url = self._get_rule_url(rule_id)
            
            # Create violation
            violation = self.create_violation(
                rule_id=rule_id,
                message=message,
                file_path=filename,
                line=line,
                column=column,
                end_line=end_line,
                end_column=end_column,
                severity_raw=self._get_severity_from_rule(rule_id),
                category=self._get_category_from_rule(rule_id),
                fix_suggestion=fix_suggestion,
                rule_description=rule_url,
                raw_data=item
            )
            violations.append(violation)
        
        return violations
    
def normalize_severity(self, tool_severity: str, rule_id: str = "") -> StandardSeverity:
        """Convert ruff severity to standard severity."""
        # Apply user overrides first
        if rule_id:
            override = self.apply_severity_overrides(rule_id, None)
            if override:
                return override
        
        # Ruff severity based on rule categories
        if rule_id:
            # High severity rules
            if (rule_id.startswith('F') or  # PyFlakes errors
                rule_id.startswith('E9') or  # Syntax errors
                rule_id.startswith('B0') or  # Likely bugs
                rule_id.startswith('S1')):   # Security issues
                return StandardSeverity.ERROR
            
            # Medium severity rules
            elif (rule_id.startswith('E') or  # pycodestyle errors
                    rule_id.startswith('W') or  # pycodestyle warnings
                    rule_id.startswith('B') or  # flake8-bugbear
                    rule_id.startswith('C4')):  # flake8-comprehensions
                return StandardSeverity.WARNING
            
            # Lower severity rules
            else:
                return StandardSeverity.INFO
        
        # Default mapping
        severity_map = {
            'error': StandardSeverity.ERROR,
            'warning': StandardSeverity.WARNING,
            'info': StandardSeverity.INFO,
        }
        
        return severity_map.get(tool_severity.lower(), StandardSeverity.WARNING)
    
def get_violation_type(self, rule_id: str, category: str = "") -> ViolationType:
        """Determine violation type from ruff rule ID."""
        if not rule_id:
            return ViolationType.STYLE
        
        # Ruff rule prefixes and their types
        if rule_id.startswith('F'):
            return ViolationType.LOGIC  # PyFlakes
        elif rule_id.startswith('E') or rule_id.startswith('W'):
            return ViolationType.STYLE  # pycodestyle
        elif rule_id.startswith('C'):
            if rule_id.startswith('C9'):
                return ViolationType.COMPLEXITY  # mccabe
            else:
                return ViolationType.LOGIC  # flake8-comprehensions
        elif rule_id.startswith('N'):
            return ViolationType.CONVENTION  # pep8-naming
        elif rule_id.startswith('D'):
            return ViolationType.CONVENTION  # pydocstyle
        elif rule_id.startswith('S'):
            return ViolationType.SECURITY  # flake8-bandit
        elif rule_id.startswith('B'):
            return ViolationType.LOGIC  # flake8-bugbear
        elif rule_id.startswith('A'):
            return ViolationType.LOGIC  # flake8-builtins
        elif rule_id.startswith('COM'):
            return ViolationType.STYLE  # flake8-commas
        elif rule_id.startswith('T'):
            if rule_id.startswith('T20'):
                return ViolationType.LOGIC  # flake8-print
            else:
                return ViolationType.TYPE  # Type-related rules
        elif rule_id.startswith('I'):
            return ViolationType.IMPORT  # isort
        elif rule_id.startswith('UP'):
            return ViolationType.REFACTOR  # pyupgrade
        elif rule_id.startswith('YTT'):
            return ViolationType.LOGIC  # flake8-2020
        elif rule_id.startswith('ASYNC'):
            return ViolationType.LOGIC  # flake8-async
        elif rule_id.startswith('TRIO'):
            return ViolationType.LOGIC  # flake8-trio
        elif rule_id.startswith('PERF'):
            return ViolationType.PERFORMANCE  # perflint
        elif rule_id.startswith('RUF'):
            return ViolationType.LOGIC  # Ruff-specific rules
        
        return ViolationType.STYLE
    
def _get_severity_from_rule(self, rule_id: str) -> str:
        """Get severity string based on rule type."""
        if rule_id.startswith(('F', 'E9', 'B0', 'S1')):
            return "error"
        elif rule_id.startswith(('E', 'W', 'B', 'C4')):
            return "warning"
        else:
            return "info"
    
def _get_category_from_rule(self, rule_id: str) -> str:
        """Get category description from rule ID."""
        category_map = {
            'F': 'PyFlakes',
            'E': 'pycodestyle (Error)',
            'W': 'pycodestyle (Warning)',
            'C9': 'mccabe (Complexity)',
            'C4': 'flake8-comprehensions',
            'N': 'pep8-naming',
            'D': 'pydocstyle',
            'S': 'flake8-bandit (Security)',
            'B': 'flake8-bugbear',
            'A': 'flake8-builtins',
            'COM': 'flake8-commas',
            'T20': 'flake8-print',
            'I': 'isort',
            'UP': 'pyupgrade',
            'YTT': 'flake8-2020',
            'ASYNC': 'flake8-async',
            'TRIO': 'flake8-trio',
            'PERF': 'perflint',
            'RUF': 'Ruff-specific',
        }
        
        # Find the matching prefix
        for prefix, name in category_map.items():
            if rule_id.startswith(prefix):
                return name
        
        return 'Unknown'
    
def _get_rule_url(self, rule_id: str) -> Optional[str]:
        """Get documentation URL for a rule."""
        if rule_id:
            # Ruff documentation URLs
            return f"https://docs.astral.sh/ruff/rules/{rule_id.lower()}/"
        return None