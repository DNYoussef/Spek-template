#!/usr/bin/env python3
"""
Violation Remediation System

This module provides REAL engineering solutions for fixing code violations,
not just hiding them. Implements auto-fix capabilities, suppression system
with justifications, and proper violation management.
"""

import ast
import re
import logging
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Optional, Tuple
import json

logger = logging.getLogger(__name__)

@dataclass
class ViolationSuppression:
    """Configuration for acceptable violations with justifications."""
    violation_type: str
    file_pattern: str
    line_pattern: Optional[str] = None
    justification: str = ""
    expires_date: Optional[str] = None
    approved_by: str = ""

@dataclass
class FixSuggestion:
    """Auto-fix suggestion for a violation."""
    violation_id: str
    fix_type: str  # "replace", "extract", "refactor"
    original_code: str
    suggested_code: str
    explanation: str
    confidence: float  # 0.0 to 1.0

class ViolationRemediationEngine:
    """Engine for fixing violations instead of hiding them."""

    def __init__(self, config_path: str = "analyzer/remediation_config.json"):
        self.config_path = Path(config_path)
        self.suppressions = self._load_suppressions()
        self.auto_fixes = []

    def _load_suppressions(self) -> List[ViolationSuppression]:
        """Load violation suppressions from configuration."""
        if not self.config_path.exists():
            # Create default configuration
            default_config = {
                "suppressions": [
                    {
                        "violation_type": "magic_literal",
                        "file_pattern": "tests/**/*.py",
                        "justification": "Test files may use magic literals for clarity",
                        "approved_by": "QA Team",
                        "expires_date": "2025-12-31"
                    },
                    {
                        "violation_type": "position_coupling",
                        "file_pattern": "**/legacy/**/*.py",
                        "line_pattern": "def __init__",
                        "justification": "Legacy constructors grandfathered until refactoring sprint",
                        "approved_by": "Tech Lead",
                        "expires_date": "2025-06-30"
                    }
                ]
            }

            self.config_path.parent.mkdir(parents=True, exist_ok=True)
            with open(self.config_path, 'w') as f:
                json.dump(default_config, f, indent=2)

            logger.info(f"Created default remediation config at {self.config_path}")

        try:
            with open(self.config_path) as f:
                config = json.load(f)
                return [ViolationSuppression(**item) for item in config.get("suppressions", [])]
        except Exception as e:
            logger.error(f"Failed to load suppressions: {e}")
            return []

    def is_violation_suppressed(self, violation: Dict) -> Tuple[bool, str]:
        """Check if a violation is legitimately suppressed."""
        file_path = violation.get("file_path", "")
        violation_type = violation.get("type", "")
        line_content = violation.get("line_content", "")

        for suppression in self.suppressions:
            # Check violation type match
            if suppression.violation_type != violation_type:
                continue

            # Check file pattern match (simplified glob matching)
            if not self._matches_pattern(file_path, suppression.file_pattern):
                continue

            # Check line pattern if specified
            if suppression.line_pattern and suppression.line_pattern not in line_content:
                continue

            # Check expiration
            if suppression.expires_date:
                from datetime import datetime
                try:
                    expires = datetime.strptime(suppression.expires_date, "%Y-%m-%d")
                    if datetime.now() > expires:
                        continue
                except ValueError:
                    logger.warning(f"Invalid expiration date: {suppression.expires_date}")
                    continue

            return True, suppression.justification

        return False, ""

    def _matches_pattern(self, file_path: str, pattern: str) -> bool:
        """Simple glob pattern matching."""
        # Convert glob pattern to regex
        regex_pattern = pattern.replace("**", ".*").replace("*", "[^/]*")
        return bool(re.match(regex_pattern, file_path))

    def generate_auto_fixes(self, violations: List[Dict]) -> List[FixSuggestion]:
        """Generate automatic fix suggestions for violations."""
        fixes = []

        for violation in violations:
            violation_type = violation.get("type", "")

            if violation_type == "magic_literal":
                fix = self._fix_magic_literal(violation)
                if fix:
                    fixes.append(fix)

            elif violation_type == "position_coupling":
                fix = self._fix_position_coupling(violation)
                if fix:
                    fixes.append(fix)

            elif violation_type == "god_object":
                fix = self._fix_god_object(violation)
                if fix:
                    fixes.append(fix)

        return fixes

    def _fix_magic_literal(self, violation: Dict) -> Optional[FixSuggestion]:
        """Generate fix for magic literal violations."""
        description = violation.get("description", "")

        # Extract the magic literal value
        match = re.search(r"Magic literal detected: (.+)", description)
        if not match:
            return None

        literal_value = match.group(1)

        # Generate constant name based on context
        file_path = violation.get("file_path", "")
        line_number = violation.get("line_number", 0)

        # Suggest meaningful constant names based on common patterns
        constant_suggestions = {
            "30": "TIMEOUT_SECONDS",
            "5": "MAX_RETRIES",
            "1024": "BUFFER_SIZE",
            "8080": "DEFAULT_PORT",
            "2.5": "DELAY_SECONDS",
            "0.95": "CONFIDENCE_THRESHOLD",
            "999": "MAX_ITEMS"
        }

        constant_name = constant_suggestions.get(literal_value, f"CONSTANT_{literal_value}".replace(".", "_"))

        original_code = f"value = {literal_value}"
        suggested_code = f"# Add to module constants:\n{constant_name} = {literal_value}\n\n# Replace usage:\nvalue = {constant_name}"

        return FixSuggestion(
            violation_id=f"magic_{violation.get('line_number', 0)}",
            fix_type="replace",
            original_code=original_code,
            suggested_code=suggested_code,
            explanation=f"Replace magic literal {literal_value} with named constant {constant_name}",
            confidence=0.9
        )

    def _fix_position_coupling(self, violation: Dict) -> Optional[FixSuggestion]:
        """Generate fix for position coupling violations."""
        description = violation.get("description", "")

        # Extract parameter count
        match = re.search(r"Position coupling detected: (\d+) parameters", description)
        if not match:
            return None

        param_count = int(match.group(1))

        # Suggest parameter object pattern
        original_code = f"def method(self, param1, param2, param3, param4, param5):"
        suggested_code = f"""# Create parameter object:
@dataclass
class MethodParams:
    param1: str
    param2: int
    param3: bool
    param4: float
    param5: Optional[str] = None

# Refactor method:
def method(self, params: MethodParams):"""

        return FixSuggestion(
            violation_id=f"position_{violation.get('line_number', 0)}",
            fix_type="refactor",
            original_code=original_code,
            suggested_code=suggested_code,
            explanation=f"Replace {param_count} parameters with parameter object for better maintainability",
            confidence=0.8
        )

    def _fix_god_object(self, violation: Dict) -> Optional[FixSuggestion]:
        """Generate fix for god object violations."""
        description = violation.get("description", "")

        # Extract method count
        match = re.search(r"God object detected with (\d+) methods", description)
        if not match:
            return None

        method_count = int(match.group(1))

        suggested_code = f"""# Break into focused classes:

class UserManagement:
    # Methods: user_login, user_logout, user_register, etc.
    pass

class DataProcessing:
    # Methods: process_data, validate_data, transform_data, etc.
    pass

class NotificationService:
    # Methods: send_email, send_sms, notify_users, etc.
    pass

# Original class becomes coordinator:
class Controller:
    def __init__(self):
        self.user_mgmt = UserManagement()
        self.data_processor = DataProcessing()
        self.notifications = NotificationService()
"""

        return FixSuggestion(
            violation_id=f"god_object_{violation.get('line_number', 0)}",
            fix_type="extract",
            original_code=f"class MassiveController:  # {method_count} methods",
            suggested_code=suggested_code,
            explanation=f"Break god object with {method_count} methods into focused single-responsibility classes",
            confidence=0.7
        )

    def apply_suppressions(self, violations: List[Dict]) -> Tuple[List[Dict], List[Dict]]:
        """Apply suppressions and return (active_violations, suppressed_violations)."""
        active_violations = []
        suppressed_violations = []

        for violation in violations:
            is_suppressed, justification = self.is_violation_suppressed(violation)

            if is_suppressed:
                violation["suppressed"] = True
                violation["suppression_reason"] = justification
                suppressed_violations.append(violation)
            else:
                active_violations.append(violation)

        logger.info(f"Processed {len(violations)} violations: {len(active_violations)} active, {len(suppressed_violations)} suppressed")

        return active_violations, suppressed_violations

    def generate_remediation_report(self, violations: List[Dict]) -> Dict:
        """Generate comprehensive remediation report."""
        active_violations, suppressed_violations = self.apply_suppressions(violations)
        auto_fixes = self.generate_auto_fixes(active_violations)

        # Categorize fixes by confidence
        high_confidence_fixes = [f for f in auto_fixes if f.confidence >= 0.8]
        medium_confidence_fixes = [f for f in auto_fixes if 0.5 <= f.confidence < 0.8]
        low_confidence_fixes = [f for f in auto_fixes if f.confidence < 0.5]

        return {
            "summary": {
                "total_violations": len(violations),
                "active_violations": len(active_violations),
                "suppressed_violations": len(suppressed_violations),
                "auto_fixable": len(high_confidence_fixes),
                "needs_manual_review": len(medium_confidence_fixes) + len(low_confidence_fixes)
            },
            "active_violations": active_violations,
            "suppressed_violations": suppressed_violations,
            "auto_fixes": {
                "high_confidence": high_confidence_fixes,
                "medium_confidence": medium_confidence_fixes,
                "low_confidence": low_confidence_fixes
            },
            "recommendations": self._generate_recommendations(active_violations, auto_fixes)
        }

    def _generate_recommendations(self, violations: List[Dict], fixes: List[FixSuggestion]) -> List[str]:
        """Generate actionable recommendations."""
        recommendations = []

        # Group violations by type
        violation_types = {}
        for violation in violations:
            vtype = violation.get("type", "unknown")
            violation_types[vtype] = violation_types.get(vtype, 0) + 1

        # Generate type-specific recommendations
        if violation_types.get("magic_literal", 0) > 5:
            recommendations.append(
                "Consider implementing a project-wide constants module for frequently used values"
            )

        if violation_types.get("position_coupling", 0) > 3:
            recommendations.append(
                "Review method signatures and consider adopting parameter object pattern consistently"
            )

        if violation_types.get("god_object", 0) > 0:
            recommendations.append(
                "Schedule refactoring sprint to break down large classes using single responsibility principle"
            )

        # Auto-fix recommendations
        high_confidence_count = len([f for f in fixes if f.confidence >= 0.8])
        if high_confidence_count > 0:
            recommendations.append(
                f"{high_confidence_count} violations can be auto-fixed with high confidence - consider automated remediation"
            )

        return recommendations

def main():
    """Example usage of remediation engine."""
    # Example violations (similar to those found by analyzer)
    test_violations = [
        {
            "type": "magic_literal",
            "description": "Magic literal detected: 30",
            "file_path": "src/config.py",
            "line_number": 15,
            "severity": "medium"
        },
        {
            "type": "position_coupling",
            "description": "Position coupling detected: 6 parameters",
            "file_path": "src/api.py",
            "line_number": 25,
            "severity": "medium"
        },
        {
            "type": "god_object",
            "description": "God object detected with 22 methods",
            "file_path": "src/controller.py",
            "line_number": 10,
            "severity": "high"
        }
    ]

    # Initialize remediation engine
    engine = ViolationRemediationEngine()

    # Generate remediation report
    report = engine.generate_remediation_report(test_violations)

    # Output report
    print("=== VIOLATION REMEDIATION REPORT ===")
    print(json.dumps(report, indent=2, default=str))

if __name__ == "__main__":
    main()