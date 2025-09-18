#!/usr/bin/env python3
"""
NASA POT10 Compliance Calculator

Legitimate NASA compliance scoring system that provides honest assessment
of code quality based on weighted violation scoring, not metric gaming.
"""

import logging
from dataclasses import dataclass
from typing import Dict, List, Optional
import json
from pathlib import Path

logger = logging.getLogger(__name__)

@dataclass
class ComplianceConfig:
    """Configuration for NASA compliance scoring."""
    # Violation weights (how much each severity impacts score)
    critical_weight: float = 5.0
    high_weight: float = 3.0
    medium_weight: float = 1.0
    low_weight: float = 0.5

    # Thresholds for compliance levels
    excellent_threshold: float = 0.95  # 95%+
    good_threshold: float = 0.90       # 90%+
    acceptable_threshold: float = 0.80  # 80%+
    # Below 80% = Needs Improvement

    # Maximum violations before automatic failure
    max_critical_violations: int = 0
    max_high_violations: int = 3
    max_total_violations: int = 20

    # Bonus factors for good practices
    test_coverage_bonus: float = 0.05  # Up to 5% bonus for >95% coverage
    documentation_bonus: float = 0.03   # Up to 3% bonus for good docs

@dataclass
class ComplianceResult:
    """Result of NASA compliance calculation."""
    score: float
    level: str  # "Excellent", "Good", "Acceptable", "Needs Improvement"
    weighted_violations: float
    violation_breakdown: Dict[str, int]
    bonus_points: float
    recommendations: List[str]
    passes_gate: bool

class NASAComplianceCalculator:
    """Calculate legitimate NASA POT10 compliance scores."""

    def __init__(self, config_path: str = "analyzer/nasa_compliance_config.json"):
        self.config_path = Path(config_path)
        self.config = self._load_config()

    def _load_config(self) -> ComplianceConfig:
        """Load compliance configuration."""
        if not self.config_path.exists():
            # Create default configuration
            default_config = {
                "critical_weight": 5.0,
                "high_weight": 3.0,
                "medium_weight": 1.0,
                "low_weight": 0.5,
                "excellent_threshold": 0.95,
                "good_threshold": 0.90,
                "acceptable_threshold": 0.80,
                "max_critical_violations": 0,
                "max_high_violations": 3,
                "max_total_violations": 20,
                "test_coverage_bonus": 0.05,
                "documentation_bonus": 0.03
            }

            self.config_path.parent.mkdir(parents=True, exist_ok=True)
            with open(self.config_path, 'w') as f:
                json.dump(default_config, f, indent=2)

            logger.info(f"Created default NASA compliance config at {self.config_path}")

        try:
            with open(self.config_path) as f:
                config_data = json.load(f)
                return ComplianceConfig(**config_data)
        except Exception as e:
            logger.error(f"Failed to load compliance config: {e}")
            return ComplianceConfig()

    def calculate_compliance(
        self,
        violations: List[Dict],
        file_count: int = 1,
        test_coverage: Optional[float] = None,
        documentation_score: Optional[float] = None
    ) -> ComplianceResult:
        """Calculate NASA compliance score with proper weighting."""

        # Count violations by severity
        violation_counts = {
            "critical": 0,
            "high": 0,
            "medium": 0,
            "low": 0
        }

        for violation in violations:
            severity = violation.get("severity", "medium").lower()
            if severity in violation_counts:
                violation_counts[severity] += 1
            else:
                # Default unknown severities to medium
                violation_counts["medium"] += 1

        # Calculate weighted violation score
        weighted_violations = (
            violation_counts["critical"] * self.config.critical_weight +
            violation_counts["high"] * self.config.high_weight +
            violation_counts["medium"] * self.config.medium_weight +
            violation_counts["low"] * self.config.low_weight
        )

        # Base score calculation
        # Scale based on file count to account for project size
        violation_density = weighted_violations / max(file_count, 1)

        # Start with perfect score, deduct for violations
        # More violations = lower score, but not linear drop-off
        base_score = max(0.0, 1.0 - (violation_density / 10.0))

        # Apply hard failure conditions
        hard_failures = []
        if violation_counts["critical"] > self.config.max_critical_violations:
            hard_failures.append(f"Critical violations: {violation_counts['critical']} > {self.config.max_critical_violations}")

        if violation_counts["high"] > self.config.max_high_violations:
            hard_failures.append(f"High severity violations: {violation_counts['high']} > {self.config.max_high_violations}")

        total_violations = sum(violation_counts.values())
        if total_violations > self.config.max_total_violations:
            hard_failures.append(f"Total violations: {total_violations} > {self.config.max_total_violations}")

        # Hard failure overrides score
        if hard_failures:
            base_score = min(base_score, 0.70)  # Cap at 70% for hard failures

        # Calculate bonus points for good practices
        bonus_points = 0.0

        if test_coverage is not None and test_coverage > 0.95:
            bonus_points += self.config.test_coverage_bonus
        elif test_coverage is not None and test_coverage > 0.80:
            bonus_points += self.config.test_coverage_bonus * 0.5

        if documentation_score is not None and documentation_score > 0.90:
            bonus_points += self.config.documentation_bonus
        elif documentation_score is not None and documentation_score > 0.70:
            bonus_points += self.config.documentation_bonus * 0.5

        # Final score with bonuses (capped at 1.0)
        final_score = min(1.0, base_score + bonus_points)

        # Determine compliance level
        if final_score >= self.config.excellent_threshold:
            level = "Excellent"
        elif final_score >= self.config.good_threshold:
            level = "Good"
        elif final_score >= self.config.acceptable_threshold:
            level = "Acceptable"
        else:
            level = "Needs Improvement"

        # Gate pass/fail decision
        passes_gate = (
            final_score >= self.config.acceptable_threshold and
            not hard_failures
        )

        # Generate recommendations
        recommendations = self._generate_recommendations(
            violation_counts, final_score, hard_failures, test_coverage, documentation_score
        )

        return ComplianceResult(
            score=final_score,
            level=level,
            weighted_violations=weighted_violations,
            violation_breakdown=violation_counts,
            bonus_points=bonus_points,
            recommendations=recommendations,
            passes_gate=passes_gate
        )

    def _generate_recommendations(
        self,
        violation_counts: Dict[str, int],
        score: float,
        hard_failures: List[str],
        test_coverage: Optional[float],
        documentation_score: Optional[float]
    ) -> List[str]:
        """Generate specific recommendations for improvement."""
        recommendations = []

        # Hard failure recommendations
        if hard_failures:
            recommendations.append("CRITICAL: Address hard failure conditions immediately:")
            recommendations.extend([f"  - {failure}" for failure in hard_failures])

        # Violation-specific recommendations
        if violation_counts["critical"] > 0:
            recommendations.append(f"Fix all {violation_counts['critical']} critical violations before deployment")

        if violation_counts["high"] > 2:
            recommendations.append(f"Reduce high severity violations from {violation_counts['high']} to ≤2")

        if violation_counts["medium"] > 10:
            recommendations.append("Consider refactoring sprint to address medium severity violations")

        # Score-based recommendations
        if score < 0.80:
            recommendations.append("Code quality below NASA standards - comprehensive review required")
        elif score < 0.90:
            recommendations.append("Good progress - focus on reducing high severity violations")

        # Bonus opportunity recommendations
        if test_coverage is None:
            recommendations.append("Enable test coverage tracking for compliance bonus points")
        elif test_coverage < 0.80:
            recommendations.append(f"Increase test coverage from {test_coverage:.1%} to >80% for bonus points")

        if documentation_score is None:
            recommendations.append("Implement documentation scoring for compliance bonus points")
        elif documentation_score < 0.70:
            recommendations.append(f"Improve documentation score from {documentation_score:.1%} to >70%")

        return recommendations

    def generate_compliance_report(self, result: ComplianceResult) -> str:
        """Generate formatted compliance report."""
        report = f"""
NASA POT10 COMPLIANCE REPORT
============================

Overall Score: {result.score:.1%}
Compliance Level: {result.level}
Gate Status: {'PASS' if result.passes_gate else 'FAIL'}

VIOLATION BREAKDOWN:
- Critical: {result.violation_breakdown['critical']}
- High Severity: {result.violation_breakdown['high']}
- Medium Severity: {result.violation_breakdown['medium']}
- Low Severity: {result.violation_breakdown['low']}

Weighted Violation Score: {result.weighted_violations:.1f}
Bonus Points Earned: {result.bonus_points:.1%}

RECOMMENDATIONS:
"""
        for i, rec in enumerate(result.recommendations, 1):
            report += f"{i}. {rec}\n"

        return report

def main():
    """Example usage of NASA compliance calculator."""
    # Example violations from real analyzer output
    test_violations = [
        {"type": "god_object", "severity": "high", "description": "God object with 22 methods"},
        {"type": "magic_literal", "severity": "medium", "description": "Magic literal: 30"},
        {"type": "magic_literal", "severity": "medium", "description": "Magic literal: 5"},
        {"type": "magic_literal", "severity": "medium", "description": "Magic literal: 1024"},
        {"type": "magic_literal", "severity": "medium", "description": "Magic literal: 8080"},
        {"type": "magic_literal", "severity": "medium", "description": "Magic literal: 2.5"},
        {"type": "magic_literal", "severity": "medium", "description": "Magic literal: 0.95"},
        {"type": "magic_literal", "severity": "medium", "description": "Magic literal: 999"},
        {"type": "position_coupling", "severity": "medium", "description": "6 parameters"},
        {"type": "position_coupling", "severity": "medium", "description": "5 parameters"},
        {"type": "position_coupling", "severity": "medium", "description": "4 parameters"}
    ]

    calculator = NASAComplianceCalculator()

    # Test different scenarios
    scenarios = [
        {"name": "Current State", "violations": test_violations, "file_count": 3},
        {"name": "With High Coverage", "violations": test_violations, "file_count": 3, "test_coverage": 0.96},
        {"name": "After Critical Fix", "violations": [v for v in test_violations if v["severity"] != "critical"], "file_count": 3},
        {"name": "Production Ready", "violations": test_violations[:3], "file_count": 3, "test_coverage": 0.95, "documentation_score": 0.90}
    ]

    for scenario in scenarios:
        print(f"\n=== SCENARIO: {scenario['name']} ===")
        result = calculator.calculate_compliance(
            violations=scenario["violations"],
            file_count=scenario["file_count"],
            test_coverage=scenario.get("test_coverage"),
            documentation_score=scenario.get("documentation_score")
        )
        print(calculator.generate_compliance_report(result))

if __name__ == "__main__":
    main()