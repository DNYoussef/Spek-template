from src.constants.base import DAYS_RETENTION_PERIOD, MAXIMUM_FUNCTION_LENGTH_LINES, MAXIMUM_GOD_OBJECTS_ALLOWED, MAXIMUM_RETRY_ATTEMPTS, TAKE_PROFIT_PERCENTAGE

This module provides comprehensive risk assessment capabilities for NASA POT10
compliance violations, enabling data-driven prioritization of remediation efforts
based on safety criticality, business impact, and technical complexity.

Key Features:
- Multi-dimensional risk scoring (safety, business, technical, temporal)
- Defense industry prioritization algorithms
- Resource optimization for remediation planning
- Compliance risk trending and forecasting
- Executive dashboard reporting

Usage:
    python -m src.compliance.risk_assessment_matrix --project path/to/project
    python -m src.compliance.risk_assessment_matrix --assess-violations violations.json
"""

import json
from lib.shared.utilities import get_logger
logger = get_logger(__name__)

@dataclass
class RiskDimension:
    """Represents a risk assessment dimension."""
    name: str
    weight: float
    score: float  # 0.0 to 1.0
    description: str
    evidence: List[str]

@dataclass
class ViolationRiskProfile:
    """Comprehensive risk profile for a NASA POT10 violation."""
    violation_id: str
    violation_type: str
    nasa_rule: str
    file_path: str
    line_number: int

    # Risk dimensions
    safety_risk: RiskDimension
    business_risk: RiskDimension
    technical_risk: RiskDimension
    temporal_risk: RiskDimension

    # Calculated metrics
    overall_risk_score: float
    priority_level: str  # "critical", "high", "medium", "low"
    remediation_urgency: int  # 1-30 days
    estimated_effort: str  # "small", "medium", "large", "extra-large"

    # Defense industry specific
    defense_criticality: str  # "mission_critical", "operational", "administrative"
    certification_blocker: bool
    audit_priority: int  # 1-10 ranking

@dataclass
class RemediationPlan:
    """Detailed remediation plan for addressing violations."""
    plan_id: str
    target_violations: List[str]  # violation IDs
    strategy: str
    estimated_timeline: int  # days
    required_resources: List[str]
    success_probability: float
    risk_reduction_potential: float
    cost_benefit_ratio: float

@dataclass
class RiskAssessmentSummary:
    """Executive summary of risk assessment results."""
    assessment_timestamp: datetime
    total_violations: int
    risk_distribution: Dict[str, int]
    top_10_risks: List[ViolationRiskProfile]
    remediation_recommendations: List[RemediationPlan]
    estimated_total_effort: int  # person-days
    compliance_forecast: Dict[str, float]
    executive_summary: str

class SafetyRiskAnalyzer:
    """Analyzes safety criticality of NASA POT10 violations."""

    # NASA Rule safety criticality mapping
    RULE_SAFETY_WEIGHTS = {
        'rule_1_control_flow': 1.0,     # Maximum safety impact
        'rule_2_loop_bounds': 0.95,     # Near-maximum safety impact
        'rule_3_memory_mgmt': 1.0,      # Maximum safety impact
        'rule_4_function_size': 0.6,    # Medium safety impact
        'rule_5_assertions': 0.8,       # High safety impact
        'rule_6_variable_scope': 0.4,   # Lower safety impact
        'rule_7_return_values': 0.7,    # Medium-high safety impact
        'rule_8_macros': 0.3,           # Lower safety impact
        'rule_9_pointers': 0.5,         # Medium safety impact
        'rule_10_warnings': 0.2         # Lowest safety impact
    }

    def assess_safety_risk(self, violation: ConnascenceViolation) -> RiskDimension:
        """Assess safety risk dimension for a violation."""
        assert violation is not None, "Violation cannot be None"

        # Base safety score from NASA rule
        nasa_rule = self._map_violation_to_rule(violation)
        base_score = self.RULE_SAFETY_WEIGHTS.get(nasa_rule, 0.5)

        # Modifiers based on violation characteristics
        severity_multiplier = self._get_severity_multiplier(violation.severity)
        context_multiplier = self._get_context_multiplier(violation)

        # Calculate final safety score
        safety_score = min(1.0, base_score * severity_multiplier * context_multiplier)

        # Generate evidence
        evidence = self._generate_safety_evidence(violation, nasa_rule, safety_score)

        return RiskDimension(
            name="safety_risk",
            weight=0.4,  # 40% of overall risk
            score=safety_score,
            description=f"Safety criticality based on NASA {nasa_rule} violation",
            evidence=evidence
        )

    def _map_violation_to_rule(self, violation: ConnascenceViolation) -> str:
        """Map violation to NASA rule for safety assessment."""
        type_lower = violation.type.lower()

        if any(pattern in type_lower for pattern in ['memory', 'allocation', 'heap']):
            return 'rule_3_memory_mgmt'
        elif any(pattern in type_lower for pattern in ['function', 'size', 'large']):
            return 'rule_4_function_size'
        elif any(pattern in type_lower for pattern in ['assert', 'precondition', 'postcondition']):
            return 'rule_5_assertions'
        elif any(pattern in type_lower for pattern in ['loop', 'bound', 'infinite']):
            return 'rule_2_loop_bounds'
        elif any(pattern in type_lower for pattern in ['control', 'flow', 'recursion']):
            return 'rule_1_control_flow'
        elif any(pattern in type_lower for pattern in ['return', 'value', 'check']):
            return 'rule_7_return_values'
        else:
            return 'rule_10_warnings'

    def _get_severity_multiplier(self, severity: str) -> float:
        """Get multiplier based on violation severity."""
        severity_multipliers = {
            'critical': 1.0,
            'high': 0.8,
            'medium': 0.6,
            'low': 0.4
        }
        return severity_multipliers.get(severity, 0.5)

    def _get_context_multiplier(self, violation: ConnascenceViolation) -> float:
        """Get context-based risk multiplier."""
        multiplier = 1.0

        # File path context
        file_path = violation.file_path.lower()
        if any(pattern in file_path for pattern in ['critical', 'core', 'engine', 'security']):
            multiplier += 0.2
        elif any(pattern in file_path for pattern in ['test', 'mock', 'example']):
            multiplier -= 0.3

        # Description context
        description = violation.description.lower()
        if any(pattern in description for pattern in ['safety', 'critical', 'crash', 'hang']):
            multiplier += 0.3

        return max(0.1, min(2.0, multiplier))

    def _generate_safety_evidence(self, violation: ConnascenceViolation, rule: str, score: float) -> List[str]:
        """Generate evidence for safety risk assessment."""
        evidence = [
            f"NASA {rule} violation in safety-critical software",
            f"Severity level: {violation.severity}",
            f"Safety risk score: {score:.2f}"
        ]

        if score >= 0.8:
            evidence.append("High safety risk - immediate attention required")
        elif score >= 0.6:
            evidence.append("Moderate safety risk - priority remediation needed")

        return evidence

class BusinessRiskAnalyzer:
    """Analyzes business impact of NASA POT10 violations."""

    def assess_business_risk(self, violation: ConnascenceViolation) -> RiskDimension:
        """Assess business risk dimension for a violation."""
        assert violation is not None, "Violation cannot be None"

        # Calculate business impact factors
        compliance_impact = self._assess_compliance_impact(violation)
        certification_impact = self._assess_certification_impact(violation)
        reputation_impact = self._assess_reputation_impact(violation)
        operational_impact = self._assess_operational_impact(violation)

        # Weighted business risk score
        business_score = (
            compliance_impact * 0.2 +
            certification_impact * 0.3 +
            reputation_impact * 0.2 +
            operational_impact * 0.2
        )

        evidence = self._generate_business_evidence(
            violation, compliance_impact, certification_impact, business_score
        )

        return RiskDimension(
            name="business_risk",
            weight=0.25,  # MAXIMUM_GOD_OBJECTS_ALLOWED% of overall risk
            score=business_score,
            description="Business impact including compliance and certification risks",
            evidence=evidence
        )

    def _assess_compliance_impact(self, violation: ConnascenceViolation) -> float:
        """Assess impact on regulatory compliance."""
        # Critical NASA rules have high compliance impact
        critical_rules = ['rule_1_control_flow', 'rule_2_loop_bounds', 'rule_3_memory_mgmt']
        rule = self._map_violation_to_rule(violation)

        if rule in critical_rules:
            return 1.0
        elif violation.severity == 'critical':
            return 0.9
        elif violation.severity == 'high':
            return 0.7
        else:
            return 0.4

    def _assess_certification_impact(self, violation: ConnascenceViolation) -> float:
        """Assess impact on defense industry certification."""
        # All violations affect certification, but some more than others
        rule = self._map_violation_to_rule(violation)

        certification_weights = {
            'rule_1_control_flow': 1.0,
            'rule_2_loop_bounds': 1.0,
            'rule_3_memory_mgmt': 1.0,
            'rule_4_function_size': 0.6,
            'rule_5_assertions': 0.8,
            'rule_7_return_values': 0.7
        }

        return certification_weights.get(rule, 0.5)

    def _assess_reputation_impact(self, violation: ConnascenceViolation) -> float:
        """Assess reputational risk from violation."""
        # Higher severity violations pose greater reputational risk
        severity_impact = {
            'critical': 0.9,
            'high': 0.7,
            'medium': 0.4,
            'low': 0.2
        }

        return severity_impact.get(violation.severity, 0.3)

    def _assess_operational_impact(self, violation: ConnascenceViolation) -> float:
        """Assess operational impact of violation."""
        # Some violations directly impact operations
        operational_keywords = ['crash', 'hang', 'memory', 'performance', 'deadlock']
        description = violation.description.lower()

        if any(keyword in description for keyword in operational_keywords):
            return 0.8
        else:
            return 0.3

    def _map_violation_to_rule(self, violation: ConnascenceViolation) -> str:
        """Map violation to NASA rule (same logic as SafetyRiskAnalyzer)."""
        # Reuse mapping logic from SafetyRiskAnalyzer
        analyzer = SafetyRiskAnalyzer()
        return analyzer._map_violation_to_rule(violation)

    def _generate_business_evidence(self, violation: ConnascenceViolation,
                                    compliance_impact: float, certification_impact: float,
                                    business_score: float) -> List[str]:
        """Generate evidence for business risk assessment."""
        evidence = [
            f"Compliance impact score: {compliance_impact:.2f}",
            f"Certification impact score: {certification_impact:.2f}",
            f"Overall business risk: {business_score:.2f}"
        ]

        if business_score >= 0.8:
            evidence.append("High business risk - may block contract opportunities")
        elif business_score >= 0.6:
            evidence.append("Moderate business risk - affects competitive positioning")

        return evidence

class TechnicalRiskAnalyzer:
    """Analyzes technical complexity and remediation difficulty."""

    def assess_technical_risk(self, violation: ConnascenceViolation) -> RiskDimension:
        """Assess technical risk dimension for a violation."""
        assert violation is not None, "Violation cannot be None"

        # Technical risk factors
        complexity_score = self._assess_remediation_complexity(violation)
        dependency_score = self._assess_dependency_impact(violation)
        testing_score = self._assess_testing_complexity(violation)
        stability_score = self._assess_code_stability_risk(violation)

        # Weighted technical risk
        technical_score = (
            complexity_score * 0.4 +
            dependency_score * 0.2 +
            testing_score * 0.2 +
            stability_score * 0.2
        )

        evidence = self._generate_technical_evidence(violation, technical_score, complexity_score)

        return RiskDimension(
            name="technical_risk",
            weight=0.2,  # 20% of overall risk
            score=technical_score,
            description="Technical complexity of remediation and implementation risk",
            evidence=evidence
        )

    def _assess_remediation_complexity(self, violation: ConnascenceViolation) -> float:
        """Assess how complex the remediation will be."""
        complexity_map = {
            'function_too_large': 0.4,  # Extract method - moderate complexity
            'memory_allocation': 0.8,   # Memory patterns - high complexity
            'insufficient_assertions': 0.3,  # Add assertions - low complexity
            'unbounded_loop': 0.6,      # Add bounds - moderate complexity
            'recursion_detected': 0.9,  # Convert to iteration - high complexity
            'unchecked_return': 0.2     # Add checks - low complexity
        }

        for pattern, complexity in complexity_map.items():
            if pattern in violation.type.lower():
                return complexity

        # Default based on severity
        return {'critical': 0.9, 'high': 0.7, 'medium': 0.5, 'low': 0.3}.get(violation.severity, 0.5)

    def _assess_dependency_impact(self, violation: ConnascenceViolation) -> float:
        """Assess impact on other code components."""
        # Core files have higher dependency impact
        file_path = violation.file_path.lower()

        if any(pattern in file_path for pattern in ['core', 'base', 'engine', 'manager']):
            return 0.8
        elif any(pattern in file_path for pattern in ['util', 'helper', 'common']):
            return 0.6
        elif any(pattern in file_path for pattern in ['test', 'mock', 'example']):
            return 0.2
        else:
            return 0.4

    def _assess_testing_complexity(self, violation: ConnascenceViolation) -> float:
        """Assess testing effort required for remediation."""
        # Some violations require more extensive testing
        high_testing_patterns = ['memory', 'concurrency', 'recursion', 'loop']
        description = violation.description.lower()

        if any(pattern in description for pattern in high_testing_patterns):
            return 0.7
        else:
            return 0.3

    def _assess_code_stability_risk(self, violation: ConnascenceViolation) -> float:
        """Assess risk of introducing instability during remediation."""
        risk_factors = {
            'critical': 0.8,  # Critical violations may require significant changes
            'high': 0.6,
            'medium': 0.4,
            'low': 0.2
        }

        return risk_factors.get(violation.severity, 0.4)

    def _generate_technical_evidence(self, violation: ConnascenceViolation,
                                    technical_score: float, complexity_score: float) -> List[str]:
        """Generate evidence for technical risk assessment."""
        evidence = [
            f"Remediation complexity score: {complexity_score:.2f}",
            f"Overall technical risk: {technical_score:.2f}"
        ]

        if technical_score >= 0.8:
            evidence.append("High technical risk - requires expert-level remediation")
            evidence.append("Extensive testing and validation required")
        elif technical_score >= 0.6:
            evidence.append("Moderate technical risk - careful implementation needed")

        return evidence

class TemporalRiskAnalyzer:
    """Analyzes time-sensitive aspects of violations."""

    def assess_temporal_risk(self, violation: ConnascenceViolation) -> RiskDimension:
        """Assess temporal risk dimension for a violation."""
        assert violation is not None, "Violation cannot be None"

        # Temporal risk factors
        urgency_score = self._assess_remediation_urgency(violation)
        degradation_score = self._assess_degradation_risk(violation)
        opportunity_score = self._assess_opportunity_cost(violation)

        # Weighted temporal risk
        temporal_score = (
            urgency_score * 0.5 +
            degradation_score * 0.3 +
            opportunity_score * 0.2
        )

        evidence = self._generate_temporal_evidence(violation, temporal_score, urgency_score)

        return RiskDimension(
            name="temporal_risk",
            weight=TAKE_PROFIT_PERCENTAGE,  # 15% of overall risk
            score=temporal_score,
            description="Time-sensitive aspects including urgency and degradation risk",
            evidence=evidence
        )

    def _assess_remediation_urgency(self, violation: ConnascenceViolation) -> float:
        """Assess how urgently the violation needs to be addressed."""
        # Critical violations need immediate attention
        urgency_map = {
            'critical': 1.0,  # Immediate action required
            'high': 0.8,      # Action required within days
            'medium': 0.5,    # Action required within weeks
            'low': 0.2        # Can be scheduled for later
        }

        base_urgency = urgency_map.get(violation.severity, 0.5)

        # Modifier based on violation type
        urgent_types = ['memory_leak', 'infinite_loop', 'security_vulnerability']
        if any(urgent_type in violation.type.lower() for urgent_type in urgent_types):
            base_urgency = min(1.0, base_urgency + 0.3)

        return base_urgency

    def _assess_degradation_risk(self, violation: ConnascenceViolation) -> float:
        """Assess risk of violation getting worse over time."""
        # Some violations tend to proliferate or worsen
        degradation_patterns = ['code_duplication', 'technical_debt', 'architectural_violation']
        description = violation.description.lower()

        if any(pattern in description for pattern in degradation_patterns):
            return 0.8
        else:
            return 0.3

    def _assess_opportunity_cost(self, violation: ConnascenceViolation) -> float:
        """Assess cost of delaying remediation."""
        # Higher severity violations have higher opportunity cost
        return {'critical': 0.9, 'high': 0.7, 'medium': 0.4, 'low': 0.2}.get(violation.severity, 0.3)

    def _generate_temporal_evidence(self, violation: ConnascenceViolation,
                                    temporal_score: float, urgency_score: float) -> List[str]:
        """Generate evidence for temporal risk assessment."""
        evidence = [
            f"Remediation urgency score: {urgency_score:.2f}",
            f"Overall temporal risk: {temporal_score:.2f}"
        ]

        if temporal_score >= 0.8:
            evidence.append("High temporal risk - delay increases impact significantly")
        elif temporal_score >= 0.6:
            evidence.append("Moderate temporal risk - timely remediation recommended")

        return evidence

class RiskAssessmentEngine:
    """
    Comprehensive NASA POT10 compliance risk assessment engine.

    Provides multi-dimensional risk analysis to support data-driven
    prioritization of remediation efforts.
    """

    def __init__(self):
        self.safety_analyzer = SafetyRiskAnalyzer()
        self.business_analyzer = BusinessRiskAnalyzer()
        self.technical_analyzer = TechnicalRiskAnalyzer()
        self.temporal_analyzer = TemporalRiskAnalyzer()
        self.logger = logging.getLogger(f"{__name__}.{self.__class__.__name__}")

    def assess_violation_risk(self, violation: ConnascenceViolation) -> ViolationRiskProfile:
        """Perform comprehensive risk assessment for a single violation."""
        assert violation is not None, "Violation cannot be None"

        # Generate unique violation ID
        violation_id = self._generate_violation_id(violation)

        # Assess all risk dimensions
        safety_risk = self.safety_analyzer.assess_safety_risk(violation)
        business_risk = self.business_analyzer.assess_business_risk(violation)
        technical_risk = self.technical_analyzer.assess_technical_risk(violation)
        temporal_risk = self.temporal_analyzer.assess_temporal_risk(violation)

        # Calculate overall risk score
        overall_score = (
            safety_risk.score * safety_risk.weight +
            business_risk.score * business_risk.weight +
            technical_risk.score * technical_risk.weight +
            temporal_risk.score * temporal_risk.weight
        )

        # Determine priority level and other metrics
        priority_level = self._determine_priority_level(overall_score)
        urgency_days = self._calculate_remediation_urgency(overall_score, temporal_risk.score)
        effort_estimate = self._estimate_remediation_effort(technical_risk.score)
        defense_criticality = self._assess_defense_criticality(safety_risk.score, business_risk.score)
        certification_blocker = self._is_certification_blocker(violation, overall_score)
        audit_priority = self._calculate_audit_priority(overall_score)

        return ViolationRiskProfile(
            violation_id=violation_id,
            violation_type=violation.type,
            nasa_rule=self._map_violation_to_nasa_rule(violation),
            file_path=violation.file_path,
            line_number=violation.line_number,
            safety_risk=safety_risk,
            business_risk=business_risk,
            technical_risk=technical_risk,
            temporal_risk=temporal_risk,
            overall_risk_score=overall_score,
            priority_level=priority_level,
            remediation_urgency=urgency_days,
            estimated_effort=effort_estimate,
            defense_criticality=defense_criticality,
            certification_blocker=certification_blocker,
            audit_priority=audit_priority
        )

    def assess_project_risk(self, violations: List[ConnascenceViolation]) -> RiskAssessmentSummary:
        """Perform comprehensive risk assessment for entire project."""
        assert violations is not None, "Violations list cannot be None"

        self.logger.info(f"Starting risk assessment for {len(violations)} violations")

        # Assess individual violations
        risk_profiles = []
        MAX_VIOLATIONS = 1000  # NASA Rule 2 bounds

        for violation in violations[:MAX_VIOLATIONS]:
            try:
                profile = self.assess_violation_risk(violation)
                risk_profiles.append(profile)
            except Exception as e:
                self.logger.error(f"Failed to assess risk for violation: {str(e)}")
                continue

        # Generate summary analytics
        risk_distribution = self._calculate_risk_distribution(risk_profiles)
        top_10_risks = self._identify_top_risks(risk_profiles, 10)
        remediation_plans = self._generate_remediation_plans(risk_profiles)
        total_effort = self._estimate_total_effort(risk_profiles)
        compliance_forecast = self._forecast_compliance_improvement(risk_profiles, remediation_plans)
        executive_summary = self._generate_executive_summary(risk_profiles, risk_distribution)

        summary = RiskAssessmentSummary(
            assessment_timestamp=datetime.now(),
            total_violations=len(violations),
            risk_distribution=risk_distribution,
            top_10_risks=top_10_risks,
            remediation_recommendations=remediation_plans,
            estimated_total_effort=total_effort,
            compliance_forecast=compliance_forecast,
            executive_summary=executive_summary
        )

        self.logger.info(f"Risk assessment complete. Top priority: {top_10_risks[0].priority_level if top_10_risks else 'None'}")

        return summary

    def _generate_violation_id(self, violation: ConnascenceViolation) -> str:
        """Generate unique identifier for violation."""
        # Create ID based on file path, line number, and violation type
        file_hash = hash(violation.file_path) % 10000
        return f"{violation.type}_{file_hash}_{violation.line_number}"

    def _determine_priority_level(self, overall_score: float) -> str:
        """Determine priority level based on overall risk score."""
        if overall_score >= 0.8:
            return "critical"
        elif overall_score >= 0.6:
            return "high"
        elif overall_score >= 0.4:
            return "medium"
        else:
            return "low"

    def _calculate_remediation_urgency(self, overall_score: float, temporal_score: float) -> int:
        """Calculate urgency in days for remediation."""
        # Combine overall risk with temporal factors
        urgency_factor = (overall_score * 0.7) + (temporal_score * 0.3)

        if urgency_factor >= 0.9:
            return 1  # Same day
        elif urgency_factor >= 0.8:
            return 3  # Within 3 days
        elif urgency_factor >= 0.6:
            return 7  # Within 1 week
        elif urgency_factor >= 0.4:
            return 14  # Within 2 weeks
        else:
            return 30  # Within 1 month

    def _estimate_remediation_effort(self, technical_score: float) -> str:
        """Estimate remediation effort based on technical complexity."""
        if technical_score >= 0.8:
            return "extra-large"  # Multiple sprints
        elif technical_score >= 0.6:
            return "large"        # 1-2 sprints
        elif technical_score >= 0.4:
            return "medium"       # 3-5 days
        else:
            return "small"        # 1-2 days

    def _assess_defense_criticality(self, safety_score: float, business_score: float) -> str:
        """Assess defense industry criticality level."""
        combined_score = max(safety_score, business_score)

        if combined_score >= 0.8:
            return "mission_critical"
        elif combined_score >= 0.6:
            return "operational"
        else:
            return "administrative"

    def _is_certification_blocker(self, violation: ConnascenceViolation, overall_score: float) -> bool:
        """Determine if violation blocks defense industry certification."""
        # Critical NASA rules always block certification
        critical_patterns = ['rule_1', 'rule_2', 'rule_3']
        rule = self._map_violation_to_nasa_rule(violation)

        return any(pattern in rule for pattern in critical_patterns) or overall_score >= 0.9

    def _calculate_audit_priority(self, overall_score: float) -> int:
        """Calculate audit priority ranking (1-10)."""
        return min(10, max(1, int(overall_score * 10)))

    def _map_violation_to_nasa_rule(self, violation: ConnascenceViolation) -> str:
        """Map violation to NASA rule (reuse existing logic)."""
        return self.safety_analyzer._map_violation_to_rule(violation)

    def _calculate_risk_distribution(self, profiles: List[ViolationRiskProfile]) -> Dict[str, int]:
        """Calculate distribution of violations by risk level."""
        distribution = defaultdict(int)

        for profile in profiles:
            distribution[profile.priority_level] += 1

        return dict(distribution)

    def _identify_top_risks(self, profiles: List[ViolationRiskProfile], count: int) -> List[ViolationRiskProfile]:
        """Identify top N highest risk violations."""
        # Sort by overall risk score descending
        sorted_profiles = sorted(profiles, key=lambda p: p.overall_risk_score, reverse=True)
        return sorted_profiles[:count]

    def _generate_remediation_plans(self, profiles: List[ViolationRiskProfile]) -> List[RemediationPlan]:
        """Generate optimized remediation plans."""
        plans = []

        # Group violations by type and priority for batch remediation
        violation_groups = defaultdict(list)

        for profile in profiles:
            if profile.priority_level in ['critical', 'high']:
                group_key = f"{profile.nasa_rule}_{profile.priority_level}"
                violation_groups[group_key].append(profile.violation_id)

        # Create remediation plans for each group
        plan_id = 1
        for group_key, violation_ids in violation_groups.items():
            if len(violation_ids) >= 3:  # Only create plans for groups with 3+ violations
                rule_name, priority = group_key.split('_', 1)

                plan = RemediationPlan(
                    plan_id=f"PLAN_{plan_id:03d}",
                    target_violations=violation_ids,
                    strategy=self._get_remediation_strategy(rule_name),
                    estimated_timeline=self._estimate_plan_timeline(len(violation_ids), rule_name),
                    required_resources=self._determine_required_resources(rule_name),
                    success_probability=self._estimate_success_probability(rule_name),
                    risk_reduction_potential=self._estimate_risk_reduction(len(violation_ids), rule_name),
                    cost_benefit_ratio=self._calculate_cost_benefit_ratio(len(violation_ids), rule_name)
                )

                plans.append(plan)
                plan_id += 1

        return plans

    def _get_remediation_strategy(self, rule_name: str) -> str:
        """Get remediation strategy for NASA rule."""
        strategies = {
            'rule_1_control_flow': 'Automated recursion elimination and control flow simplification',
            'rule_2_loop_bounds': 'Automated loop bounds injection and validation',
            'rule_3_memory_mgmt': 'Dynamic to static allocation conversion using memory analyzer',
            'rule_4_function_size': 'Automated function refactoring using extract method patterns',
            'rule_5_assertions': 'Systematic assertion injection for defensive programming'
        }

        return strategies.get(rule_name, 'Manual code review and remediation')

    def _estimate_plan_timeline(self, violation_count: int, rule_name: str) -> int:
        """Estimate timeline for remediation plan in days."""
        # Base effort per violation type
        base_effort_days = {
            'rule_1_control_flow': 3,
            'rule_2_loop_bounds': 2,
            'rule_3_memory_mgmt': 4,
            'rule_4_function_size': 1,
            'rule_5_assertions': 1
        }

        base_days = base_effort_days.get(rule_name, 2)
        total_days = base_days * violation_count

        # Apply efficiency gains for batch processing
        if violation_count >= 10:
            total_days = int(total_days * 0.8)  # 20% efficiency gain
        elif violation_count >= 5:
            total_days = int(total_days * 0.9)  # 10% efficiency gain

        return max(1, total_days)

    def _determine_required_resources(self, rule_name: str) -> List[str]:
        """Determine required resources for remediation."""
        resource_map = {
            'rule_1_control_flow': ['Senior Developer', 'Code Reviewer', 'Testing Team'],
            'rule_2_loop_bounds': ['Developer', 'Static Analysis Tools', 'Testing Team'],
            'rule_3_memory_mgmt': ['Senior Developer', 'Memory Profiling Tools', 'Performance Testing'],
            'rule_4_function_size': ['Developer', 'Refactoring Tools', 'Code Reviewer'],
            'rule_5_assertions': ['Developer', 'Assertion Framework', 'Unit Testing']
        }

        return resource_map.get(rule_name, ['Developer', 'Code Reviewer'])

    def _estimate_success_probability(self, rule_name: str) -> float:
        """Estimate probability of successful remediation."""
        # Based on historical data and tool maturity
        success_rates = {
            'rule_1_control_flow': 0.75,  # Moderate complexity
            'rule_2_loop_bounds': 0.85,   # Well-understood patterns
            'rule_3_memory_mgmt': 0.70,   # High complexity
            'rule_4_function_size': 0.90, # Automated tooling available
            'rule_5_assertions': 0.95     # Straightforward implementation
        }

        return success_rates.get(rule_name, 0.80)

    def _estimate_risk_reduction(self, violation_count: int, rule_name: str) -> float:
        """Estimate risk reduction from successful remediation."""
        # Rule weights for risk reduction
        rule_weights = {
            'rule_1_control_flow': 0.9,
            'rule_2_loop_bounds': 0.85,
            'rule_3_memory_mgmt': 0.9,
            'rule_4_function_size': 0.6,
            'rule_5_assertions': 0.7
        }

        base_reduction = rule_weights.get(rule_name, 0.5)

        # Scale by number of violations (with diminishing returns)
        scale_factor = min(1.0, math.log(violation_count + 1) / 5.0)

        return base_reduction * scale_factor

    def _calculate_cost_benefit_ratio(self, violation_count: int, rule_name: str) -> float:
        """Calculate cost-benefit ratio for remediation plan."""
        # Estimate cost (person-days)
        cost = self._estimate_plan_timeline(violation_count, rule_name)

        # Estimate benefit (risk reduction value)
        risk_reduction = self._estimate_risk_reduction(violation_count, rule_name)
        benefit = risk_reduction * violation_count * 100  # Scale to monetary equivalent

        return benefit / max(cost, 1)

    def _estimate_total_effort(self, profiles: List[ViolationRiskProfile]) -> int:
        """Estimate total effort in person-days."""
        effort_map = {
            'small': 1,
            'medium': 3,
            'large': 8,
            'extra-large': 15
        }

        total_days = 0
        for profile in profiles:
            if profile.priority_level in ['critical', 'high']:
                days = effort_map.get(profile.estimated_effort, 3)
                total_days += days

        return total_days

    def _forecast_compliance_improvement(self, profiles: List[ViolationRiskProfile],
                                        plans: List[RemediationPlan]) -> Dict[str, float]:
        """Forecast compliance improvement from remediation plans."""
        current_violations = len(profiles)

        # Estimate violations resolved by plans
        planned_resolution = sum(len(plan.target_violations) * plan.success_probability for plan in plans)

        # Current compliance estimate (assuming 1000 total checkpoints)
        current_compliance = max(0.0, (1000 - current_violations) / 1000 * 100)

        # Projected compliance after remediation
        remaining_violations = current_violations - planned_resolution
        projected_compliance = (1000 - remaining_violations) / 1000 * MAXIMUM_FUNCTION_LENGTH_LINES

        return {
            'current_compliance_pct': current_compliance,
            'projected_compliance_pct': projected_compliance,
            'improvement_pct': projected_compliance - current_compliance,
            'violations_to_resolve': int(planned_resolution),
            'remaining_violations': int(remaining_violations)
        }

    def _generate_executive_summary(self, profiles: List[ViolationRiskProfile],
                                    distribution: Dict[str, int]) -> str:
        """Generate executive summary of risk assessment."""
        total_violations = len(profiles)
        critical_count = distribution.get('critical', 0)
        high_count = distribution.get('high', 0)

        # Calculate key metrics
        high_risk_pct = ((critical_count + high_count) / max(total_violations, 1)) * 100
        avg_risk_score = sum(p.overall_risk_score for p in profiles) / max(len(profiles), 1)

        # Generate narrative
        summary = f"""
EXECUTIVE RISK ASSESSMENT SUMMARY

Total NASA POT10 Violations: {total_violations}

RISK DISTRIBUTION:
- Critical Priority: {critical_count} violations ({critical_count/max(total_violations, 1)*100:.1f}%)
- High Priority: {high_count} violations ({high_count/max(total_violations, 1)*100:.1f}%)
- Medium/Low Priority: {total_violations - critical_count - high_count} violations

KEY FINDINGS:
- {high_risk_pct:.1f}% of violations require immediate attention
- Average risk score: {avg_risk_score:.2f} (scale 0.0-1.0)
- Defense industry certification: {'BLOCKED' if critical_count > 0 else 'AT RISK' if high_count > 10 else 'ACHIEVABLE'}

RECOMMENDATIONS:
1. Address all {critical_count} critical violations immediately
2. Implement systematic remediation plans for high-priority violations
3. Establish continuous monitoring to prevent regression
4. Allocate resources for {self._estimate_total_effort(profiles)} person-days of remediation work

STRATEGIC IMPACT:
Successful remediation will improve NASA POT10 compliance and enable defense industry certification,
opening new contract opportunities and reducing operational risk.
        """.strip()

        return summary

    def export_risk_matrix(self, summary: RiskAssessmentSummary, output_path: str) -> str:
        """Export comprehensive risk assessment to JSON file."""
        assert summary is not None, "Risk assessment summary cannot be None"
        assert output_path, "Output path cannot be empty"

        # Convert dataclasses to dictionaries for JSON serialization
        export_data = {
            'metadata': {
                'assessment_timestamp': summary.assessment_timestamp.isoformat(),
                'total_violations': summary.total_violations,
                'nasa_pot10_version': '2006',
                'assessment_tool_version': '1.0.0'
            },
            'risk_distribution': summary.risk_distribution,
            'top_risks': [asdict(profile) for profile in summary.top_10_risks],
            'remediation_plans': [asdict(plan) for plan in summary.remediation_recommendations],
            'effort_estimate': {
                'total_person_days': summary.estimated_total_effort,
                'estimated_cost_usd': summary.estimated_total_effort * 1000,  # $1000/day estimate
                'estimated_timeline_weeks': max(1, summary.estimated_total_effort // 5)
            },
            'compliance_forecast': summary.compliance_forecast,
            'executive_summary': summary.executive_summary
        }

        # Write to file
        output_file = Path(output_path)
        output_file.write_text(json.dumps(export_data, indent=2, default=str))

        self.logger.info(f"Risk assessment matrix exported to {output_path}")

        return output_path

def main():
    """Command-line interface for risk assessment matrix."""
    import argparse

    parser = argparse.ArgumentParser(description="NASA POT10 Risk Assessment Matrix")
    parser.add_argument("--project", help="Project directory to assess")
    parser.add_argument("--violations-file", help="JSON file containing violations")
    parser.add_argument("--output", help="Output path for risk matrix")
    parser.add_argument("--top-risks", type=int, default=10, help="Number of top risks to highlight")
    parser.add_argument("--verbose", action="store_true", help="Enable verbose output")

    args = parser.parse_args()

    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)

    engine = RiskAssessmentEngine()

    try:
        if args.violations_file:
            # Load violations from JSON file
            violations_path = Path(args.violations_file)
            if not violations_path.exists():
                print(f"Error: Violations file not found: {violations_path}")
                return 1

            violations_data = json.loads(violations_path.read_text())

            # Convert to ConnascenceViolation objects
            violations = []
            for v_data in violations_data.get('violations', []):
                violation = ConnascenceViolation(
                    type=v_data.get('type', 'unknown'),
                    severity=v_data.get('severity', 'medium'),
                    file_path=v_data.get('file_path', ''),
                    line_number=v_data.get('line_number', 0),
                    description=v_data.get('description', '')
                )
                violations.append(violation)

            print(f"Loaded {len(violations)} violations from {args.violations_file}")

        elif args.project:
            # For project assessment, we'd need to integrate with other compliance tools
            print(f"Project-wide risk assessment for {args.project} not yet implemented")
            print("Use --violations-file with output from compliance tools")
            return 1

        else:
            print("Error: Must specify either --project or --violations-file")
            return 1

        # Perform risk assessment
        summary = engine.assess_project_risk(violations)

        # Display key results
        print("\\n" + "="*60)
        print("NASA POT10 RISK ASSESSMENT RESULTS")
        print("="*60)
        print(summary.executive_summary)

        print(f"\\nTOP {args.top_risks} HIGHEST RISK VIOLATIONS:")
        for i, profile in enumerate(summary.top_10_risks[:args.top_risks], 1):
            print(f"{i:2d}. {profile.violation_type} (Risk: {profile.overall_risk_score:.2f})")
            print(f"    File: {profile.file_path}:{profile.line_number}")
            print(f"    Priority: {profile.priority_level.upper()}, Urgency: {profile.remediation_urgency} days")

        print(f"\\nREMEDIATION PLANS ({len(summary.remediation_recommendations)} plans):")
        for plan in summary.remediation_recommendations:
            print(f"- {plan.plan_id}: {plan.strategy}")
            print(f"  Timeline: {plan.estimated_timeline} days, Success Rate: {plan.success_probability:.1%}")

        # Export detailed results
        if args.output:
            output_path = engine.export_risk_matrix(summary, args.output)
            print(f"\\nDetailed risk matrix exported to: {output_path}")

    except Exception as e:
        print(f"Error during risk assessment: {str(e)}")
        return 1

    return 0

if __name__ == "__main__":
    sys.exit(main())