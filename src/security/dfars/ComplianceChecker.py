from src.constants.base import DAYS_RETENTION_PERIOD, MAXIMUM_FUNCTION_LENGTH_LINES

import json
from typing import Dict, List, Optional, Tuple, Any, Set
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
import logging

logger = logging.getLogger(__name__)

class ComplianceLevel(Enum):
    """DFARS compliance levels."""
    BASIC = "basic"
    MODERATE = "moderate"
    HIGH = "high"
    CONTROLLED = "controlled_unclassified"

class ComplianceStatus(Enum):
    """Compliance check status."""
    COMPLIANT = "compliant"
    NON_COMPLIANT = "non_compliant"
    PARTIAL = "partial"
    PENDING = "pending"
    NOT_APPLICABLE = "not_applicable"

@dataclass
class ComplianceRule:
    """Represents a DFARS compliance rule."""
    rule_id: str
    clause: str
    description: str
    level: ComplianceLevel
    category: str
    requirements: List[str]
    verification_methods: List[str]
    mandatory: bool = True

@dataclass
class ComplianceCheck:
    """Results of a compliance check."""
    rule_id: str
    status: ComplianceStatus
    evidence: List[str]
    gaps: List[str]
    recommendations: List[str]
    checked_at: datetime
    confidence: float

class ComplianceChecker:
    """
    Handles DFARS compliance rule validation and checking.

    Extracted from dfars_compliance_validation_system (1, 54 LOC -> ~250 LOC component).
    Handles:
    - Compliance rule management
    - Validation execution
    - Evidence collection
    - Gap analysis
    - Compliance scoring
    """

def __init__(self):
        """Initialize the compliance checker."""
        self.compliance_rules: Dict[str, ComplianceRule] = {}
        self.check_results: Dict[str, ComplianceCheck] = {}
        self.evidence_store: Dict[str, List[str]] = {}

        # Load DFARS compliance rules
        self._load_dfars_rules()

def _load_dfars_rules(self) -> None:
        """Load DFARS compliance rules and requirements."""
        # Key DFARS clauses for cybersecurity
        rules = [
            ComplianceRule(
                rule_id="DFARS-252.204-7012",
                clause="252.204-7012",
                description="Safeguarding Covered Defense Information and Cyber Incident Reporting",
                level=ComplianceLevel.HIGH,
                category="Cybersecurity",
                requirements=[
                    "Implement NIST SP 800-171 security requirements",
                    "Report cyber incidents within 72 hours",
                    "Preserve and protect images of affected systems",
                    "Provide malicious software to DoD Cyber Crime Center"
                ],
                verification_methods=["documentation_review", "technical_scan", "audit"],
                mandatory=True
            ),
            ComplianceRule(
                rule_id="DFARS-252.204-7019",
                clause="252.204-7019",
                description="Notice of NIST SP 800-171 DoD Assessment Requirements",
                level=ComplianceLevel.HIGH,
                category="Assessment",
                requirements=[
                    "Complete Basic DoD Assessment",
                    "Medium or High NIST SP 800-171 DoD Assessments as required",
                    "Maintain assessment documentation"
                ],
                verification_methods=["assessment_review", "documentation_check"],
                mandatory=True
            ),
            ComplianceRule(
                rule_id="DFARS-252.204-7020",
                clause="252.204-7020",
                description="NIST SP 800-171 DoD Assessment Requirements",
                level=ComplianceLevel.HIGH,
                category="Assessment",
                requirements=[
                    "Provide access to facilities and systems",
                    "Complete assessment within required timeframe",
                    "Remediate findings"
                ],
                verification_methods=["assessment_completion", "remediation_tracking"],
                mandatory=True
            ),
            ComplianceRule(
                rule_id="DFARS-252.204-7021",
                clause="252.204-7021",
                description="Cybersecurity Maturity Model Certification Requirements",
                level=ComplianceLevel.CONTROLLED,
                category="CMMC",
                requirements=[
                    "Achieve required CMMC level certification",
                    "Maintain certification status",
                    "Flow down requirements to subcontractors"
                ],
                verification_methods=["certification_check", "subcontractor_verification"],
                mandatory=True
            )
        ]

        for rule in rules:
            self.compliance_rules[rule.rule_id] = rule

def check_compliance(self,
                        rule_id: str,
                        evidence: List[str],
                        system_data: Optional[Dict[str, Any]] = None) -> ComplianceCheck:
        """Check compliance for a specific rule."""
        rule = self.compliance_rules.get(rule_id)
        if not rule:
            raise ValueError(f"Unknown compliance rule: {rule_id}")

        # Evaluate compliance based on evidence
        status, gaps, confidence = self._evaluate_compliance(rule, evidence, system_data)

        # Generate recommendations
        recommendations = self._generate_recommendations(rule, gaps)

        # Create compliance check result
        check = ComplianceCheck(
            rule_id=rule_id,
            status=status,
            evidence=evidence,
            gaps=gaps,
            recommendations=recommendations,
            checked_at=datetime.now(),
            confidence=confidence
        )

        # Store result
        self.check_results[rule_id] = check
        self.evidence_store[rule_id] = evidence

        return check

def _evaluate_compliance(self,
                            rule: ComplianceRule,
                            evidence: List[str],
                            system_data: Optional[Dict[str, Any]]) -> Tuple[ComplianceStatus, List[str], float]:
        """Evaluate compliance status based on evidence."""
        gaps = []
        met_requirements = 0
        total_requirements = len(rule.requirements)

        for requirement in rule.requirements:
            if self._is_requirement_met(requirement, evidence, system_data):
                met_requirements += 1
            else:
                gaps.append(requirement)

        # Calculate compliance percentage
        compliance_percentage = (met_requirements / total_requirements) if total_requirements > 0 else 0

        # Determine status
        if compliance_percentage == 1.0:
            status = ComplianceStatus.COMPLIANT
        elif compliance_percentage >= 0.7:
            status = ComplianceStatus.PARTIAL
        elif compliance_percentage == 0:
            status = ComplianceStatus.NOT_APPLICABLE if not rule.mandatory else ComplianceStatus.NON_COMPLIANT
        else:
            status = ComplianceStatus.NON_COMPLIANT

        # Calculate confidence based on evidence quality
        confidence = self._calculate_confidence(evidence, rule.verification_methods)

        return status, gaps, confidence

def _is_requirement_met(self,
                            requirement: str,
                            evidence: List[str],
                            system_data: Optional[Dict[str, Any]]) -> bool:
        """Check if a specific requirement is met."""
        # Simplified check - in production would be more sophisticated
        requirement_lower = requirement.lower()

        # Check evidence
        for item in evidence:
            if any(keyword in item.lower() for keyword in ["implemented", "configured", "enabled"]):
                if any(req_word in item.lower() for req_word in requirement_lower.split()[:3]):
                    return True

        # Check system data
        if system_data:
            if "nist_controls" in system_data and "NIST SP 800-171" in requirement:
                return system_data.get("nist_compliance", False)
            if "cmmc" in requirement_lower and "cmmc_level" in system_data:
                return system_data.get("cmmc_certified", False)

        return False

def _calculate_confidence(self, evidence: List[str], verification_methods: List[str]) -> float:
        """Calculate confidence score based on evidence quality."""
        if not evidence:
            return 0.1

        confidence = 0.5  # Base confidence

        # Boost for multiple evidence sources
        if len(evidence) > 3:
            confidence += 0.2

        # Boost for automated verification
        if "technical_scan" in verification_methods:
            confidence += 0.15

        # Boost for recent evidence
        for item in evidence:
            if "2024" in item or "2025" in item:
                confidence += 0.1
                break

        return min(confidence, 0.95)

def _generate_recommendations(self, rule: ComplianceRule, gaps: List[str]) -> List[str]:
        """Generate recommendations for closing compliance gaps."""
        recommendations = []

        for gap in gaps:
            if "NIST SP 800-171" in gap:
                recommendations.append("Implement missing NIST SP 800-171 controls")
                recommendations.append("Conduct gap assessment against NIST requirements")
            elif "cyber incident" in gap.lower():
                recommendations.append("Establish incident reporting procedures")
                recommendations.append("Create incident response plan")
            elif "assessment" in gap.lower():
                recommendations.append("Schedule DoD assessment")
                recommendations.append("Prepare assessment documentation")
            elif "CMMC" in gap:
                recommendations.append("Engage CMMC Third Party Assessor Organization (C3PAO)")
                recommendations.append("Complete CMMC readiness assessment")

        return recommendations

def batch_check(self, evidence_map: Dict[str, List[str]]) -> Dict[str, ComplianceCheck]:
        """Perform batch compliance checking."""
        results = {}

        for rule_id in self.compliance_rules:
            evidence = evidence_map.get(rule_id, [])
            results[rule_id] = self.check_compliance(rule_id, evidence)

        return results

def get_compliance_score(self) -> Dict[str, Any]:
        """Calculate overall compliance score."""
        if not self.check_results:
            return {"score": 0, "status": "not_assessed"}

        compliant_count = sum(
            1 for check in self.check_results.values()
            if check.status == ComplianceStatus.COMPLIANT
        )
        partial_count = sum(
            1 for check in self.check_results.values()
            if check.status == ComplianceStatus.PARTIAL
        )

        total_rules = len(self.check_results)

        # Calculate weighted score
        score = ((compliant_count * 1.0) + (partial_count * 0.5)) / total_rules if total_rules > 0 else 0

        return {
            "score": score * MAXIMUM_FUNCTION_LENGTH_LINES,
            "compliant": compliant_count,
            "partial": partial_count,
            "non_compliant": total_rules - compliant_count - partial_count,
            "total_rules": total_rules,
            "status": self._get_overall_status(score)
        }

def _get_overall_status(self, score: float) -> str:
        """Determine overall compliance status."""
        if score >= 0.95:
            return "fully_compliant"
        elif score >= 0.80:
            return "substantially_compliant"
        elif score >= 0.60:
            return "partially_compliant"
        else:
            return "non_compliant"

def get_critical_gaps(self) -> List[Dict[str, Any]]:
        """Get critical compliance gaps requiring immediate attention."""
        critical_gaps = []

        for rule_id, check in self.check_results.items():
            if check.status == ComplianceStatus.NON_COMPLIANT:
                rule = self.compliance_rules[rule_id]
                if rule.level in [ComplianceLevel.HIGH, ComplianceLevel.CONTROLLED]:
                    critical_gaps.append({
                        "rule_id": rule_id,
                        "clause": rule.clause,
                        "gaps": check.gaps,
                        "recommendations": check.recommendations,
                        "priority": "critical" if rule.level == ComplianceLevel.CONTROLLED else "high"
                    })

        return critical_gaps