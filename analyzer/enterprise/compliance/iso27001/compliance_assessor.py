from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Union, Tuple, Callable, Set

"""
ISO27001 Compliance Assessment Module
Handles assessment, gap analysis, and risk evaluation for ISO27001 controls.
"""

import json
import logging
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, Optional
from dataclasses import dataclass

from .control_definitions import ISO27001Control, ISO27001ControlCatalog

logger = logging.getLogger(__name__)


@dataclass
class ControlAssessment:
    """Assessment result for a single ISO27001 control."""
    control_id: str
    implementation_status: str  # "not_implemented", "partially_implemented", "fully_implemented"
    effectiveness_score: float  # 0.0 to 1.0
    evidence_provided: List[str]
    gaps_identified: List[str]
    risk_level: str  # "low", "medium", "high", "critical"
    remediation_priority: int  # 1-5 scale
    estimated_effort_days: int
    responsible_party: str
    target_completion_date: Optional[str] = None


@dataclass
class ComplianceAssessmentConfig:
    """Configuration for compliance assessment."""
    assessment_scope: List[str] = None  # Control categories to assess
    evidence_path: str = ".claude/.artifacts/evidence"
    output_path: str = ".claude/.artifacts/iso27001"
    risk_tolerance: str = "medium"  # "low", "medium", "high"
    automation_threshold: float = 0.8  # Confidence threshold for automated assessments


class ISO27001ComplianceAssessor:
    """Manages ISO27001 compliance assessments and gap analysis."""

    def __init__(self, control_catalog: ISO27001ControlCatalog, config: ComplianceAssessmentConfig = None):
        self.control_catalog = control_catalog
        self.config = config or ComplianceAssessmentConfig()
        self.assessments: Dict[str, ControlAssessment] = {}

    def perform_full_assessment(self, evidence_data: Dict[str, Any] = None) -> Dict[str, Any]:
        """Perform comprehensive assessment of all applicable controls."""
        logger.info("Starting full ISO27001 compliance assessment...")

        evidence_data = evidence_data or {}
        assessment_results = {}

        # Assess each control
        for control_id, control in self.control_catalog.controls.items():
            if self._is_control_in_scope(control):
                assessment = self._assess_single_control(control, evidence_data.get(control_id, {}))
                self.assessments[control_id] = assessment
                assessment_results[control_id] = assessment

        # Generate compliance summary
        compliance_summary = self._generate_compliance_summary()

        # Perform gap analysis
        gap_analysis = self._perform_gap_analysis()

        # Generate risk assessment
        risk_assessment = self._perform_risk_assessment()

        return {
            "assessment_timestamp": datetime.now().isoformat(),
            "scope": self.config.assessment_scope,
            "control_assessments": {
                control_id: {
                    "control_id": assessment.control_id,
                    "implementation_status": assessment.implementation_status,
                    "effectiveness_score": assessment.effectiveness_score,
                    "evidence_provided": assessment.evidence_provided,
                    "gaps_identified": assessment.gaps_identified,
                    "risk_level": assessment.risk_level,
                    "remediation_priority": assessment.remediation_priority,
                    "estimated_effort_days": assessment.estimated_effort_days,
                    "responsible_party": assessment.responsible_party,
                    "target_completion_date": assessment.target_completion_date
                }
                for control_id, assessment in assessment_results.items()
            },
            "compliance_summary": compliance_summary,
            "gap_analysis": gap_analysis,
            "risk_assessment": risk_assessment,
            "recommendations": self._generate_recommendations(gap_analysis, risk_assessment)
        }

    def _is_control_in_scope(self, control: ISO27001Control) -> bool:
        """Check if control is in assessment scope."""
        if not self.config.assessment_scope:
            return control.applicable

        return control.applicable and control.category in self.config.assessment_scope

    def _assess_single_control(self, control: ISO27001Control, evidence: Dict[str, Any]) -> ControlAssessment:
        """Assess implementation status of a single control."""

        # Determine implementation status based on evidence
        implementation_status = self._determine_implementation_status(control, evidence)

        # Calculate effectiveness score
        effectiveness_score = self._calculate_effectiveness_score(control, evidence, implementation_status)

        # Identify gaps
        gaps = self._identify_control_gaps(control, evidence)

        # Assess risk level
        risk_level = self._assess_control_risk(control, implementation_status, gaps)

        # Determine remediation priority
        priority = self._calculate_remediation_priority(control, risk_level, implementation_status)

        # Estimate effort
        effort_days = self._estimate_remediation_effort(control, gaps, implementation_status)

        return ControlAssessment(
            control_id=control.control_id,
            implementation_status=implementation_status,
            effectiveness_score=effectiveness_score,
            evidence_provided=list(evidence.keys()) if evidence else [],
            gaps_identified=gaps,
            risk_level=risk_level,
            remediation_priority=priority,
            estimated_effort_days=effort_days,
            responsible_party=evidence.get("responsible_party", "TBD")
        )

    def _determine_implementation_status(self, control: ISO27001Control, evidence: Dict[str, Any]) -> str:
        """Determine implementation status based on available evidence."""
        if not evidence:
            return "not_implemented"

        required_evidence = set(control.evidence_required)
        provided_evidence = set(evidence.keys())

        evidence_coverage = len(provided_evidence.intersection(required_evidence)) / len(required_evidence)

        if evidence_coverage >= 0.8:
            return "fully_implemented"
        elif evidence_coverage >= 0.3:
            return "partially_implemented"
        else:
            return "not_implemented"

    def _calculate_effectiveness_score(self, control: ISO27001Control, evidence: Dict[str, Any],
                                     implementation_status: str) -> float:
        """Calculate control effectiveness score."""
        base_score = {
            "not_implemented": 0.0,
            "partially_implemented": 0.4,
            "fully_implemented": 0.8
        }.get(implementation_status, 0.0)

        # Adjust based on evidence quality
        if evidence:
            quality_indicators = ["documentation", "testing", "monitoring", "reviews"]
            quality_score = sum(1 for indicator in quality_indicators
                              if any(indicator in key.lower() for key in evidence.keys()))
            quality_adjustment = (quality_score / len(quality_indicators)) * 0.2
            base_score += quality_adjustment

        # Adjust for automation
        if control.automated and "automation" in str(evidence).lower():
            base_score += 0.1

        return min(1.0, base_score)

    def _identify_control_gaps(self, control: ISO27001Control, evidence: Dict[str, Any]) -> List[str]:
        """Identify gaps in control implementation."""
        gaps = []

        required_evidence = set(control.evidence_required)
        provided_evidence = set(evidence.keys())
        missing_evidence = required_evidence - provided_evidence

        for missing in missing_evidence:
            gaps.append(f"Missing evidence: {missing}")

        # Check implementation guidance
        for guidance in control.implementation_guidance:
            if guidance not in str(evidence).lower():
                gaps.append(f"Implementation gap: {guidance}")

        # Check automation potential
        if control.automated and not any("automat" in key.lower() for key in evidence.keys()):
            gaps.append("Automation opportunity not leveraged")

        return gaps

    def _assess_control_risk(self, control: ISO27001Control, implementation_status: str, gaps: List[str]) -> str:
        """Assess risk level for control based on implementation status and gaps."""
        base_risk = {
            "high": 3,
            "medium": 2,
            "low": 1
        }.get(control.priority, 2)

        status_adjustment = {
            "not_implemented": 2,
            "partially_implemented": 1,
            "fully_implemented": -1
        }.get(implementation_status, 0)

        gap_adjustment = min(len(gaps), 2)  # Cap at 2 for extreme cases

        total_risk_score = base_risk + status_adjustment + gap_adjustment

        if total_risk_score >= 5:
            return "critical"
        elif total_risk_score >= 4:
            return "high"
        elif total_risk_score >= 2:
            return "medium"
        else:
            return "low"

    def _calculate_remediation_priority(self, control: ISO27001Control, risk_level: str,
                                      implementation_status: str) -> int:
        """Calculate remediation priority (1=highest, 5=lowest)."""
        risk_priority = {
            "critical": 1,
            "high": 2,
            "medium": 3,
            "low": 4
        }.get(risk_level, 3)

        # Adjust for control priority
        if control.priority == "high":
            risk_priority = max(1, risk_priority - 1)
        elif control.priority == "low":
            risk_priority = min(5, risk_priority + 1)

        # Adjust for implementation status
        if implementation_status == "not_implemented":
            risk_priority = max(1, risk_priority - 1)

        return risk_priority

    def _estimate_remediation_effort(self, control: ISO27001Control, gaps: List[str],
                                   implementation_status: str) -> int:
        """Estimate remediation effort in days."""
        base_effort = {
            "not_implemented": 10,
            "partially_implemented": 5,
            "fully_implemented": 2
        }.get(implementation_status, 5)

        # Adjust for control complexity
        priority_multiplier = {
            "high": 1.5,
            "medium": 1.0,
            "low": 0.7
        }.get(control.priority, 1.0)

        # Adjust for number of gaps
        gap_adjustment = len(gaps) * 2

        # Adjust for automation potential
        if control.automated and implementation_status == "not_implemented":
            base_effort *= 1.3  # Initial automation setup

        total_effort = int((base_effort * priority_multiplier) + gap_adjustment)
        return max(1, min(30, total_effort))  # Cap between 1-30 days

    def _generate_compliance_summary(self) -> Dict[str, Any]:
        """Generate overall compliance summary."""
        if not self.assessments:
            return {"error": "No assessments available"}

        total_controls = len(self.assessments)
        fully_implemented = sum(1 for a in self.assessments.values()
                               if a.implementation_status == "fully_implemented")
        partially_implemented = sum(1 for a in self.assessments.values()
                                   if a.implementation_status == "partially_implemented")
        not_implemented = sum(1 for a in self.assessments.values()
                             if a.implementation_status == "not_implemented")

        # Calculate overall effectiveness
        avg_effectiveness = sum(a.effectiveness_score for a in self.assessments.values()) / total_controls

        # Risk distribution
        risk_distribution = {}
        for assessment in self.assessments.values():
            risk_distribution[assessment.risk_level] = risk_distribution.get(assessment.risk_level, 0) + 1

        return {
            "total_controls_assessed": total_controls,
            "implementation_status": {
                "fully_implemented": fully_implemented,
                "partially_implemented": partially_implemented,
                "not_implemented": not_implemented
            },
            "implementation_percentages": {
                "fully_implemented": (fully_implemented / total_controls) * 100,
                "partially_implemented": (partially_implemented / total_controls) * 100,
                "not_implemented": (not_implemented / total_controls) * 100
            },
            "overall_effectiveness_score": round(avg_effectiveness, 2),
            "compliance_level": self._determine_compliance_level(avg_effectiveness),
            "risk_distribution": risk_distribution
        }

    def _determine_compliance_level(self, effectiveness_score: float) -> str:
        """Determine overall compliance level based on effectiveness score."""
        if effectiveness_score >= 0.9:
            return "Excellent"
        elif effectiveness_score >= 0.8:
            return "Good"
        elif effectiveness_score >= 0.7:
            return "Satisfactory"
        elif effectiveness_score >= 0.5:
            return "Developing"
        else:
            return "Inadequate"

    def _perform_gap_analysis(self) -> Dict[str, Any]:
        """Perform comprehensive gap analysis."""
        all_gaps = []
        priority_gaps = {"critical": 0, "high": 0, "medium": 0, "low": 0}
        total_effort = 0

        for assessment in self.assessments.values():
            all_gaps.extend(assessment.gaps_identified)
            priority_gaps[assessment.risk_level] += len(assessment.gaps_identified)
            total_effort += assessment.estimated_effort_days

        # Categorize gaps
        gap_categories = self._categorize_gaps(all_gaps)

        return {
            "total_gaps": len(all_gaps),
            "gaps_by_priority": priority_gaps,
            "gap_categories": gap_categories,
            "remediation_estimate": {
                "total_days": total_effort,
                "total_weeks": round(total_effort / 5, 1),
                "estimated_cost_range": f"${total_effort * 800}-${total_effort * 1200}"  # Rough estimate
            },
            "most_common_gaps": self._get_most_common_gaps(all_gaps)
        }

    def _categorize_gaps(self, gaps: List[str]) -> Dict[str, int]:
        """Categorize gaps by type."""
        categories = {
            "documentation": 0,
            "process": 0,
            "technical": 0,
            "training": 0,
            "monitoring": 0,
            "automation": 0
        }

        for gap in gaps:
            gap_lower = gap.lower()
            if "documentation" in gap_lower or "policy" in gap_lower:
                categories["documentation"] += 1
            elif "process" in gap_lower or "procedure" in gap_lower:
                categories["process"] += 1
            elif "technical" in gap_lower or "system" in gap_lower:
                categories["technical"] += 1
            elif "training" in gap_lower or "awareness" in gap_lower:
                categories["training"] += 1
            elif "monitoring" in gap_lower or "logging" in gap_lower:
                categories["monitoring"] += 1
            elif "automation" in gap_lower:
                categories["automation"] += 1

        return categories

    def _get_most_common_gaps(self, gaps: List[str]) -> List[Dict[str, Any]]:
        """Get most common gaps with counts."""
        gap_counts = {}
        for gap in gaps:
            gap_counts[gap] = gap_counts.get(gap, 0) + 1

        return [{"gap": gap, "count": count}
                for gap, count in sorted(gap_counts.items(), key=lambda x: x[1], reverse=True)[:10]]

    def _perform_risk_assessment(self) -> Dict[str, Any]:
        """Perform risk assessment based on control gaps."""
        risk_summary = {"critical": 0, "high": 0, "medium": 0, "low": 0}
        high_risk_controls = []

        for control_id, assessment in self.assessments.items():
            risk_summary[assessment.risk_level] += 1

            if assessment.risk_level in ["critical", "high"]:
                control = self.control_catalog.get_control(control_id)
                high_risk_controls.append({
                    "control_id": control_id,
                    "title": control.title if control else "Unknown",
                    "risk_level": assessment.risk_level,
                    "implementation_status": assessment.implementation_status,
                    "remediation_priority": assessment.remediation_priority
                })

        return {
            "risk_distribution": risk_summary,
            "high_risk_controls": sorted(high_risk_controls, key=lambda x: x["remediation_priority"])[:10],
            "overall_risk_level": self._calculate_overall_risk_level(risk_summary),
            "risk_tolerance_alignment": self._assess_risk_tolerance_alignment(risk_summary)
        }

    def _calculate_overall_risk_level(self, risk_summary: Dict[str, int]) -> str:
        """Calculate overall organizational risk level."""
        if risk_summary["critical"] > 0:
            return "critical"
        elif risk_summary["high"] > 5:
            return "high"
        elif risk_summary["medium"] > 10:
            return "medium"
        else:
            return "low"

    def _assess_risk_tolerance_alignment(self, risk_summary: Dict[str, int]) -> Dict[str, Any]:
        """Assess alignment with organizational risk tolerance."""
        tolerance = self.config.risk_tolerance

        tolerance_thresholds = {
            "low": {"critical": 0, "high": 2, "medium": 5},
            "medium": {"critical": 1, "high": 5, "medium": 15},
            "high": {"critical": 3, "high": 10, "medium": 25}
        }

        thresholds = tolerance_thresholds.get(tolerance, tolerance_thresholds["medium"])

        exceedances = []
        for risk_level, count in risk_summary.items():
            if risk_level in thresholds and count > thresholds[risk_level]:
                exceedances.append(f"{risk_level}: {count} (threshold: {thresholds[risk_level]})")

        return {
            "aligned": len(exceedances) == 0,
            "tolerance_level": tolerance,
            "exceedances": exceedances
        }

    def _generate_recommendations(self, gap_analysis: Dict[str, Any],
                                risk_assessment: Dict[str, Any]) -> List[str]:
        """Generate actionable recommendations based on assessment results."""
        recommendations = []

        # Critical and high-risk recommendations
        critical_count = risk_assessment["risk_distribution"]["critical"]
        high_count = risk_assessment["risk_distribution"]["high"]

        if critical_count > 0:
            recommendations.append(f"URGENT: Address {critical_count} critical risk control(s) immediately")

        if high_count > 0:
            recommendations.append(f"HIGH PRIORITY: Implement {high_count} high-risk control(s)")

        # Gap-specific recommendations
        total_gaps = gap_analysis["total_gaps"]
        if total_gaps > 20:
            recommendations.append("Consider phased implementation approach due to high number of gaps")

        # Category-specific recommendations
        gap_categories = gap_analysis["gap_categories"]
        if gap_categories["documentation"] > 5:
            recommendations.append("Prioritize documentation and policy development")

        if gap_categories["automation"] > 3:
            recommendations.append("Implement automation to improve control effectiveness")

        # Effort-based recommendations
        total_effort = gap_analysis["remediation_estimate"]["total_days"]
        if total_effort > 60:
            recommendations.append("Allocate dedicated resources for compliance remediation")

        return recommendations


"""
<!-- AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE -->
## Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
|--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
| 1.0.0   | 2025-9-24T15:12:03-04:00 | coder@Sonnet-4 | Created ISO27001 compliance assessor module | compliance_assessor.py | OK | Assessment and gap analysis extracted | 0.00 | f7e8b1a |

### Receipt
- status: OK
- reason_if_blocked: --
- run_id: phase3-iso27001-assessor-02
- inputs: ["iso27001.py"]
- tools_used: ["Write"]
- versions: {"model":"Sonnet-4","prompt":"v1.0.0"}
<!-- AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE -->
"""