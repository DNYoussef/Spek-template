from src.constants.base import MAXIMUM_FUNCTION_LENGTH_LINES, MAXIMUM_NESTED_DEPTH

from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass
from enum import Enum
import json
import yaml
from pathlib import Path

class UnifiedSeverity(Enum):
    """Unified severity levels across all linting tools"""
    CRITICAL = "critical"    # Blocks deployment, immediate fix required
    HIGH = "high"           # Major issues, fix before merge
    MEDIUM = "medium"       # Should fix, non-blocking
    LOW = "low"            # Nice to fix, style/minor issues
    INFO = "info"          # Informational, no action required

class ViolationCategory(Enum):
    """Unified violation categories"""
    SECURITY = "security"
    CORRECTNESS = "correctness"
    PERFORMANCE = "performance"
    MAINTAINABILITY = "maintainability"
    STYLE = "style"
    DOCUMENTATION = "documentation"
    TESTING = "testing"
    COMPLEXITY = "complexity"

@dataclass
class SeverityRule:
    """Rule for mapping tool-specific violations to unified severity"""
    tool_name: str
    rule_pattern: str
    rule_codes: List[str]
    unified_severity: UnifiedSeverity
    category: ViolationCategory
    description: str
    rationale: str
    examples: List[str]
    
class UnifiedSeverityMapper:
    """
    Maps tool-specific severity levels and rule codes to unified severity system.
    Provides consistent violation classification across flake8, pylint, ruff, mypy, bandit.
    """
    
def __init__(self, config_path: Optional[str] = None):
        self.severity_rules: Dict[str, List[SeverityRule]] = {}
        self.tool_mappings: Dict[str, Dict[str, UnifiedSeverity]] = {}
        self.category_mappings: Dict[str, Dict[str, ViolationCategory]] = {}
        self.config_path = config_path
        
        # Load default mappings
        self._load_default_mappings()
        
        # Load custom config if provided
        if config_path:
            self._load_custom_config(config_path)
            
def _load_default_mappings(self) -> None:
        """Load default severity mappings for all supported tools"""
        
        # Flake8 mappings
        self.tool_mappings["flake8"] = {
            # Syntax/Parse errors - CRITICAL
            "E9": UnifiedSeverity.CRITICAL,
            "F821": UnifiedSeverity.CRITICAL,  # undefined name
            "F822": UnifiedSeverity.CRITICAL,  # undefined name in __all__
            "F823": UnifiedSeverity.CRITICAL,  # local variable referenced before assignment
            
            # Import errors - HIGH
            "F401": UnifiedSeverity.MEDIUM,    # imported but unused
            "F403": UnifiedSeverity.HIGH,      # star import
            "F405": UnifiedSeverity.HIGH,      # name may be undefined from star import
            
            # Logic errors - HIGH
            "F631": UnifiedSeverity.HIGH,      # assertion test is a tuple
            "F632": UnifiedSeverity.HIGH,      # use ==/!= to compare constant literals
            "F841": UnifiedSeverity.MEDIUM,    # local variable assigned but never used
            
            # Style issues - LOW to MEDIUM
            "E1": UnifiedSeverity.LOW,         # indentation
            "E2": UnifiedSeverity.LOW,         # whitespace
            "E3": UnifiedSeverity.LOW,         # blank line
            "E4": UnifiedSeverity.LOW,         # import
            "E5": UnifiedSeverity.LOW,         # line length
            "E7": UnifiedSeverity.LOW,         # statement
            "W1": UnifiedSeverity.LOW,         # indentation warning
            "W2": UnifiedSeverity.LOW,         # whitespace warning
            "W3": UnifiedSeverity.LOW,         # blank line warning
            "W5": UnifiedSeverity.LOW,         # line break warning
            "W6": UnifiedSeverity.LOW,         # deprecation warning
        }
        
        # Pylint mappings
        self.tool_mappings["pylint"] = {
            # Fatal errors - CRITICAL
            "F": UnifiedSeverity.CRITICAL,
            
            # Errors - HIGH  
            "E": UnifiedSeverity.HIGH,
            
            # Warnings - MEDIUM
            "W": UnifiedSeverity.MEDIUM,
            
            # Refactoring suggestions - LOW
            "R": UnifiedSeverity.LOW,
            
            # Convention violations - LOW
            "C": UnifiedSeverity.LOW,
            
            # Information - INFO
            "I": UnifiedSeverity.INFO,
        }
        
        # Ruff mappings (similar to flake8 but more comprehensive)
        self.tool_mappings["ruff"] = {
            # Security issues - CRITICAL/HIGH
            "S": UnifiedSeverity.HIGH,         # bandit rules
            "B": UnifiedSeverity.HIGH,         # flake8-bugbear
            
            # Type checking - HIGH
            "T": UnifiedSeverity.HIGH,         # type checking
            
            # Import sorting - MEDIUM
            "I": UnifiedSeverity.MEDIUM,       # isort
            
            # Code quality - MEDIUM
            "C": UnifiedSeverity.MEDIUM,       # complexity
            "N": UnifiedSeverity.MEDIUM,       # naming
            
            # Style - LOW
            "E": UnifiedSeverity.LOW,          # pycodestyle errors
            "W": UnifiedSeverity.LOW,          # pycodestyle warnings
            "D": UnifiedSeverity.LOW,          # pydocstyle
            
            # Performance - MEDIUM
            "PERF": UnifiedSeverity.MEDIUM,    # performance
            
            # Async - HIGH
            "ASYNC": UnifiedSeverity.HIGH,     # async issues
        }
        
        # MyPy mappings
        self.tool_mappings["mypy"] = {
            "error": UnifiedSeverity.HIGH,
            "warning": UnifiedSeverity.MEDIUM,
            "note": UnifiedSeverity.INFO,
        }
        
        # Bandit mappings
        self.tool_mappings["bandit"] = {
            "HIGH": UnifiedSeverity.CRITICAL,
            "MEDIUM": UnifiedSeverity.HIGH,
            "LOW": UnifiedSeverity.MEDIUM,
        }
        
def _load_custom_config(self, config_path: str) -> None:
        """Load custom severity mappings from configuration file"""
        try:
            path = Path(config_path)
            if not path.exists():
                return
                
            with open(path, 'r') as f:
                if path.suffix.lower() == '.yaml' or path.suffix.lower() == '.yml':
                    config = yaml.safe_load(f)
                else:
                    config = json.load(f)
                    
            # Override default mappings with custom ones
            for tool, mappings in config.get('tool_mappings', {}).items():
                if tool not in self.tool_mappings:
                    self.tool_mappings[tool] = {}
                    
                for pattern, severity in mappings.items():
                    self.tool_mappings[tool][pattern] = UnifiedSeverity(severity)
                    
        except Exception as e:
            print(f"Warning: Could not load custom config from {config_path}: {e}")
            
def map_severity(self, tool_name: str, rule_code: str, tool_severity: str = None) -> UnifiedSeverity:
        """
        Map tool-specific rule code and severity to unified severity.
        
        Args:
            tool_name: Name of the linting tool
            rule_code: Tool-specific rule code (e.g., "E501", "W292")
            tool_severity: Tool-specific severity level (optional)
            
        Returns:
            Unified severity level
        """
        tool_name = tool_name.lower()
        
        if tool_name not in self.tool_mappings:
            return UnifiedSeverity.MEDIUM  # Default fallback
            
        mappings = self.tool_mappings[tool_name]
        
        # Try exact rule code match first
        if rule_code in mappings:
            return mappings[rule_code]
            
        # Try pattern matching (e.g., "E5" matches "E501")
        for pattern, severity in mappings.items():
            if rule_code.startswith(pattern):
                return severity
                
        # Try tool severity if available
        if tool_severity and tool_severity.upper() in mappings:
            return mappings[tool_severity.upper()]
            
        # Default fallback
        return UnifiedSeverity.MEDIUM
        
def categorize_violation(self, tool_name: str, rule_code: str, message: str) -> ViolationCategory:
        """
        Categorize violation based on tool, rule code, and message content.
        
        Args:
            tool_name: Name of the linting tool
            rule_code: Tool-specific rule code
            message: Violation message
            
        Returns:
            Violation category
        """
        tool_name = tool_name.lower()
        rule_code = rule_code.upper()
        message_lower = message.lower()
        
        # Security patterns
        if (tool_name == "bandit" or 
            any(keyword in message_lower for keyword in 
                ['security', 'vulnerability', 'injection', 'crypto', 'password', 'hash'])):
            return ViolationCategory.SECURITY
            
        # Correctness patterns
        if (rule_code.startswith(('F', 'E9')) or
            any(keyword in message_lower for keyword in 
                ['undefined', 'syntax', 'error', 'exception', 'bug'])):
            return ViolationCategory.CORRECTNESS
            
        # Performance patterns
        if (rule_code.startswith('PERF') or
            any(keyword in message_lower for keyword in 
                ['performance', 'slow', 'inefficient', 'optimization'])):
            return ViolationCategory.PERFORMANCE
            
        # Complexity patterns
        if (rule_code.startswith(('C', 'R')) or
            any(keyword in message_lower for keyword in 
                ['complex', 'cognitive', 'cyclomatic', 'nested'])):
            return ViolationCategory.COMPLEXITY
            
        # Documentation patterns
        if (rule_code.startswith('D') or
            any(keyword in message_lower for keyword in 
                ['docstring', 'documentation', 'comment'])):
            return ViolationCategory.DOCUMENTATION
            
        # Testing patterns
        if any(keyword in message_lower for keyword in 
                ['test', 'assert', 'mock', 'fixture']):
            return ViolationCategory.TESTING
            
        # Style patterns (default for many simple violations)
        if (rule_code.startswith(('E', 'W')) or
            any(keyword in message_lower for keyword in 
                ['style', 'format', 'whitespace', 'indent', 'naming'])):
            return ViolationCategory.STYLE
            
        # Maintainability (default fallback)
        return ViolationCategory.MAINTAINABILITY
        
def get_severity_distribution(self, violations: List[Dict[str, Any]]) -> Dict[str, int]:
        """Get distribution of violations by unified severity level"""
        distribution = {severity.value: 0 for severity in UnifiedSeverity}
        
        for violation in violations:
            severity = self.map_severity(
                violation.get('tool_name', ''),
                violation.get('rule_code', ''),
                violation.get('tool_severity', '')
            )
            distribution[severity.value] += 1
            
        return distribution
        
def get_category_distribution(self, violations: List[Dict[str, Any]]) -> Dict[str, int]:
        """Get distribution of violations by category"""
        distribution = {category.value: 0 for category in ViolationCategory}
        
        for violation in violations:
            category = self.categorize_violation(
                violation.get('tool_name', ''),
                violation.get('rule_code', ''),
                violation.get('message', '')
            )
            distribution[category.value] += 1
            
        return distribution
        
def calculate_quality_score(self, violations: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Calculate overall code quality score based on violations.
        
        Returns:
            Quality metrics including score, severity breakdown, and recommendations
        """
        if not violations:
            return {
                "quality_score": 100.0,
                "grade": "A",
                "severity_distribution": {s.value: 0 for s in UnifiedSeverity},
                "category_distribution": {c.value: 0 for c in ViolationCategory},
                "recommendations": []
            }
            
        severity_dist = self.get_severity_distribution(violations)
        category_dist = self.get_category_distribution(violations)
        
        # Calculate weighted score
        severity_weights = {
            UnifiedSeverity.CRITICAL.value: 10,
            UnifiedSeverity.HIGH.value: 5,
            UnifiedSeverity.MEDIUM.value: 2,
            UnifiedSeverity.LOW.value: 1,
            UnifiedSeverity.INFO.value: 0
        }
        
        total_weight = sum(severity_dist[severity] * weight 
                            for severity, weight in severity_weights.items())
        
        # Base score starts at MAXIMUM_FUNCTION_LENGTH_LINES, deduct based on weighted violations
        base_score = 60.0
        deduction = min(total_weight * 0.5, 95)  # Cap at 95% deduction
        quality_score = max(base_score - deduction, 5.0)  # Minimum score of MAXIMUM_NESTED_DEPTH
        
        # Assign grade
        if quality_score >= 90:
            grade = "A"
        elif quality_score >= 80:
            grade = "B"
        elif quality_score >= 70:
            grade = "C"
        elif quality_score >= 60:
            grade = "D"
        else:
            grade = "F"
            
        # Generate recommendations
        recommendations = self._generate_recommendations(severity_dist, category_dist)
        
        return {
            "quality_score": round(quality_score, 1),
            "grade": grade,
            "total_violations": len(violations),
            "severity_distribution": severity_dist,
            "category_distribution": category_dist,
            "recommendations": recommendations
        }
        
def _generate_recommendations(self, severity_dist: Dict[str, int],
                                category_dist: Dict[str, int]) -> List[str]:
        """Generate actionable recommendations based on violation patterns"""
        recommendations = []
        
        if severity_dist[UnifiedSeverity.CRITICAL.value] > 0:
            recommendations.append(
                f"URGENT: Fix {severity_dist[UnifiedSeverity.CRITICAL.value]} critical issues immediately"
            )
            
        if severity_dist[UnifiedSeverity.HIGH.value] > 5:
            recommendations.append(
                f"Address {severity_dist[UnifiedSeverity.HIGH.value]} high-severity issues before merge"
            )
            
        # Category-specific recommendations
        if category_dist[ViolationCategory.SECURITY.value] > 0:
            recommendations.append("Review security violations - consider security audit")
            
        if category_dist[ViolationCategory.COMPLEXITY.value] > 10:
            recommendations.append("High complexity detected - consider refactoring")
            
        if category_dist[ViolationCategory.STYLE.value] > 20:
            recommendations.append("Many style issues - run auto-formatter")
            
        if category_dist[ViolationCategory.DOCUMENTATION.value] > 5:
            recommendations.append("Improve documentation coverage")
            
        return recommendations
        
def export_config(self, output_path: str, format_type: str = "yaml") -> None:
        """Export current mappings to configuration file"""
        config_data = {
            "tool_mappings": {
                tool: {pattern: severity.value for pattern, severity in mappings.items()}
                for tool, mappings in self.tool_mappings.items()
            }
        }
        
        with open(output_path, 'w') as f:
            if format_type.lower() == "yaml":
                yaml.dump(config_data, f, default_flow_style=False)
            else:
                json.dump(config_data, f, indent=2)

# Global instance for easy access
unified_mapper = UnifiedSeverityMapper()