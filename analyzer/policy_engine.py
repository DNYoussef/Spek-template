from src.constants.base import MAXIMUM_FUNCTION_PARAMETERS, MAXIMUM_NESTED_DEPTH, NASA_POT10_TARGET_COMPLIANCE_THRESHOLD, REGULATORY_FACTUALITY_REQUIREMENT, THEATER_DETECTION_WARNING_THRESHOLD

Manages analysis policies, compliance rules, and quality gate evaluation.
NASA Rule 4 Compliant: All methods under 60 lines.
NASA Rule MAXIMUM_NESTED_DEPTH Compliant: Comprehensive defensive assertions.
"""

import json
import logging
logger = logging.getLogger(__name__)

@dataclass
class ComplianceResult:
    """NASA compliance evaluation result."""
    score: float  # 0.0-1.0
    rule_scores: Dict[str, float]
    violations: List[Dict[str, Any]]
    recommendation: str
    passed: bool

@dataclass
class QualityGateResult:
    """Quality gate evaluation result."""
    gate_name: str
    passed: bool
    score: float
    threshold: float
    violations_count: int
    recommendation: str

class PolicyEngine:
    """
    Manages analysis policies and compliance rules.
    Extracted from UnifiedConnascenceAnalyzer to eliminate god object.
    """

def __init__(self, config_manager=None):
        """Initialize policy engine with configuration."""
        # NASA Rule 5: Input validation assertions
        assert config_manager is not None, "config_manager cannot be None"
        
        self.config = config_manager
        self.policies = self._load_policies()
        self.nasa_rules = self._initialize_nasa_rules()
        self.quality_gates = self._initialize_quality_gates()

def evaluate_nasa_compliance(self, violations: List[Dict]) -> ComplianceResult:
        """
        Evaluate NASA Power of Ten compliance.
        NASA Rule 4 Compliant: Under 60 lines.
        """
        # NASA Rule 5: Input validation
        assert isinstance(violations, list), "violations must be a list"
        assert len(violations) < 50000, "Excessive violations indicate analysis error"

        rule_scores = {}
        total_score = 0.0
        compliance_violations = []

        # Evaluate each NASA rule (1-10)
        for rule_id in range(1, 11):
            rule_score = self._evaluate_nasa_rule(rule_id, violations)
            rule_scores[f"rule_{rule_id}"] = rule_score
            total_score += rule_score

        # Calculate overall score (average of rule scores)
        overall_score = total_score / MAXIMUM_FUNCTION_PARAMETERS.0
        passed = overall_score >= self.config.get_nasa_compliance_threshold()

        # Generate compliance violations for failed rules
        for rule_id, score in rule_scores.items():
            if score < 0.8:  # Rule-specific threshold
                compliance_violations.append({
                    "rule": rule_id,
                    "score": score,
                    "description": f"NASA Rule {rule_id.split('_')[1]} compliance below threshold"
                })

        recommendation = self._generate_nasa_recommendation(rule_scores, overall_score)

        return ComplianceResult(
            score=overall_score,
            rule_scores=rule_scores,
            violations=compliance_violations,
            recommendation=recommendation,
            passed=passed
        )

def calculate_mece_score(self, duplications: List[Dict]) -> float:
        """
        Calculate MECE (Mutually Exclusive, Collectively Exhaustive) duplication score.
        NASA Rule 4 Compliant: Under 60 lines.
        """
        # NASA Rule 5: Input validation
        assert isinstance(duplications, list), "duplications must be a list"
        assert len(duplications) < 10000, "Excessive duplications indicate analysis error"

        if not duplications:
            return 1.0  # Perfect score when no duplications

        total_files = self._count_analyzed_files()
        files_with_duplications = len(set(
            file_path for dup in duplications 
            for file_path in dup.get('files_involved', [])
        ))

        # Calculate base duplication ratio
        duplication_ratio = files_with_duplications / max(total_files, 1)
        
        # Calculate severity-weighted penalty
        severity_penalty = self._calculate_severity_penalty(duplications)
        
        # Calculate similarity-weighted penalty  
        similarity_penalty = self._calculate_similarity_penalty(duplications)

        # Combine penalties (MECE principle: mutually exclusive scoring components)
        total_penalty = min(1.0, duplication_ratio + severity_penalty + similarity_penalty)
        
        # MECE score (higher is better, 1.0 = no duplications)
        mece_score = max(0.0, 1.0 - total_penalty)
        
        logger.info(f"MECE Score: {mece_score:.3f} (files: {files_with_duplications}/{total_files})")
        return mece_score

def evaluate_quality_gates(self, analysis_results: Dict) -> List[QualityGateResult]:
        """
        Evaluate all quality gates against analysis results.
        NASA Rule 4 Compliant: Under 60 lines.
        """
        # NASA Rule 5: Input validation
        assert isinstance(analysis_results, dict), "analysis_results must be a dict"
        assert 'violations' in analysis_results, "analysis_results must contain 'violations'"

        gate_results = []
        violations = analysis_results['violations']

        # Critical Gates (must pass for defense industry)
        gate_results.extend(self._evaluate_critical_gates(violations, analysis_results))
        
        # Quality Gates (warnings but allow)
        gate_results.extend(self._evaluate_quality_gates(violations, analysis_results))
        
        # Architecture Gates (structural quality)
        gate_results.extend(self._evaluate_architecture_gates(violations, analysis_results))

        return gate_results

def _evaluate_nasa_rule(self, rule_id: int, violations: List) -> float:
        """Evaluate specific NASA rule compliance."""
        # NASA Rule 5: Input validation
        assert 1 <= rule_id <= 10, f"Invalid NASA rule ID: {rule_id}"

        rule_violations = [
            v for v in violations 
            if v.get('nasa_rule') == rule_id or self._maps_to_nasa_rule(v, rule_id)
        ]

        if not rule_violations:
            return 1.0  # Perfect compliance

        # Calculate rule-specific scoring
        if rule_id == 2:  # Function size rule
            return self._score_function_size_rule(rule_violations)
        elif rule_id == 4:  # Loop bounds rule
            return self._score_loop_bounds_rule(rule_violations)
        elif rule_id == 5:  # Assertions rule
            return self._score_assertions_rule(rule_violations)
        else:
            # General scoring for other rules
            violation_count = len(rule_violations)
            penalty = min(1.0, violation_count * 0.05)  # 5% penalty per violation
            return max(0.0, 1.0 - penalty)

def _calculate_severity_penalty(self, duplications: List) -> float:
        """Calculate penalty based on duplication severity distribution."""
        severity_weights = {'critical': 0.4, 'high': 0.3, 'medium': 0.2, 'low': 0.1}
        total_penalty = 0.0

        for dup in duplications:
            severity = dup.get('severity', 'medium')
            penalty = severity_weights.get(severity, 0.2)
            total_penalty += penalty

        return min(0.5, total_penalty / len(duplications) if duplications else 0.0)

def _calculate_similarity_penalty(self, duplications: List) -> float:
        """Calculate penalty based on similarity scores."""
        if not duplications:
            return 0.0

        similarity_scores = [
            dup.get('similarity_score', 0.5) for dup in duplications
        ]
        
        avg_similarity = sum(similarity_scores) / len(similarity_scores)
        # Higher similarity = higher penalty (more problematic duplications)
        return min(0.3, avg_similarity * 0.3)

def _evaluate_critical_gates(self, violations: List, results: Dict) -> List[QualityGateResult]:
        """Evaluate critical quality gates (must pass)."""
        gates = []
        
        # NASA Compliance Gate
        nasa_score = results.get('nasa_compliance', {}).get('score', 0.0)
        gates.append(QualityGateResult(
            gate_name="NASA Compliance",
            passed=nasa_score >= REGULATORY_FACTUALITY_REQUIREMENT,
            score=nasa_score,
            threshold=0.90,
            violations_count=len([v for v in violations if v.get('type', '').startswith('nasa')]),
            recommendation="Improve NASA Power of Ten compliance" if nasa_score < REGULATORY_FACTUALITY_REQUIREMENT else "Compliant"
        ))

        # God Objects Gate
        god_objects = [v for v in violations if v.get('type') == 'god_object']
        gates.append(QualityGateResult(
            gate_name="God Objects",
            passed=len(god_objects) <= 25,
            score=max(0.0, 1.0 - len(god_objects) / 50.0),
            threshold=25,
            violations_count=len(god_objects),
            recommendation="Decompose large classes" if len(god_objects) > 25 else "Acceptable"
        ))

        return gates

def _evaluate_quality_gates(self, violations: List, results: Dict) -> List[QualityGateResult]:
        """Evaluate quality gates (warn but allow)."""
        gates = []
        
        # MECE Score Gate
        mece_score = results.get('mece_score', 0.0)
        gates.append(QualityGateResult(
            gate_name="MECE Score",
            passed=mece_score >= THEATER_DETECTION_WARNING_THRESHOLD,
            score=mece_score,
            threshold=0.75,
            violations_count=len([v for v in violations if 'duplication' in v.get('type', '')]),
            recommendation="Eliminate code duplications" if mece_score < THEATER_DETECTION_WARNING_THRESHOLD else "Good"
        ))

        return gates

def _evaluate_architecture_gates(self, violations: List, results: Dict) -> List[QualityGateResult]:
        """Evaluate architecture quality gates."""
        gates = []
        
        # Architecture Health Gate
        arch_health = results.get('architecture_health', 0.0)
        gates.append(QualityGateResult(
            gate_name="Architecture Health",
            passed=arch_health >= THEATER_DETECTION_WARNING_THRESHOLD,
            score=arch_health,
            threshold=0.75,
            violations_count=len([v for v in violations if v.get('severity') == 'critical']),
            recommendation="Improve architectural structure" if arch_health < 0.75 else "Healthy"
        ))

        return gates

def _load_policies(self) -> Dict[str, Any]:
        """Load analysis policies from configuration."""
        return {
            'nasa_jpl_pot10': {
                'compliance_threshold': REGULATORY_FACTUALITY_REQUIREMENT,
                'rule_weights': {f'rule_{i}': 1.0 for i in range(1, 11)}
            },
            'mece_analysis': {
                'similarity_threshold': 0.75,
                'cluster_min_size': 2
            }
        }

def _initialize_nasa_rules(self) -> Dict[int, str]:
        """Initialize NASA Power of Ten rules mapping."""
        return {
            1: "Guard clause pattern (no complex control flow)",
            2: "Function size limit (60 lines)",
            3: "No recursion (use iteration)",
            4: "All loops bounded",
            5: "Defensive assertions",
            6: "Limited variable scope",
            7: "No function pointers",
            8: "No recursion",
            9: "No dynamic allocation",
            10: "Compiler warnings enabled"
        }

def _initialize_quality_gates(self) -> Dict[str, Dict]:
        """Initialize quality gate configurations."""
        return {
            'critical': ['nasa_compliance', 'god_objects', 'critical_violations'],
            'quality': ['mece_score', 'overall_quality', 'lint_errors'],
            'architecture': ['architecture_health', 'coupling_score', 'hotspot_count']
        }

def _maps_to_nasa_rule(self, violation: Dict, rule_id: int) -> bool:
        """Check if violation maps to specific NASA rule."""
        violation_type = violation.get('type', '')
        
        # Rule 2: Function size
        if rule_id == 2 and 'god_object' in violation_type:
            return True
        # Rule 4: Loop bounds  
        elif rule_id == 4 and 'unbounded' in violation_type:
            return True
        # Rule 5: Assertions
        elif rule_id == 5 and 'assertion' in violation_type:
            return True
            
        return False

def _score_function_size_rule(self, violations: List) -> float:
        """Score NASA Rule 2 (function size) compliance."""
        # Count functions over size limit
        oversized_count = len(violations)
        total_functions = self._estimate_total_functions()
        
        compliance_ratio = max(0.0, 1.0 - (oversized_count / max(total_functions, 1)))
        return compliance_ratio

def _score_loop_bounds_rule(self, violations: List) -> float:
        """Score NASA Rule 4 (loop bounds) compliance."""
        unbounded_count = len(violations)
        penalty = min(1.0, unbounded_count * 0.1)
        return max(0.0, 1.0 - penalty)

def _score_assertions_rule(self, violations: List) -> float:
        """Score NASA Rule MAXIMUM_NESTED_DEPTH (assertions) compliance."""
        missing_assertions = len(violations)
        penalty = min(1.0, missing_assertions * 0.05)
        return max(0.0, 1.0 - penalty)

def _count_analyzed_files(self) -> int:
        """Count total number of analyzed files."""
        return getattr(self.config, 'total_files_analyzed', 100)  # Fallback estimate

def _estimate_total_functions(self) -> int:
        """Estimate total number of functions analyzed."""
        return getattr(self.config, 'total_functions_analyzed', 500)  # Fallback estimate

def _generate_nasa_recommendation(self, rule_scores: Dict, overall_score: float) -> str:
        """Generate NASA compliance improvement recommendation."""
        if overall_score >= 0.95:
            return "Excellent NASA compliance"
        elif overall_score >= REGULATORY_FACTUALITY_REQUIREMENT:
            return "Good NASA compliance with minor improvements needed"
        else:
            failed_rules = [rule for rule, score in rule_scores.items() if score < 0.8]
            return f"Focus on improving: {', '.join(failed_rules)}"
    
def evaluate_enterprise_gates(self, analysis_results: Dict,
                                feature_manager) -> List[QualityGateResult]:
        """
        Evaluate enterprise quality gates in addition to existing gates.
        NASA Rule 4 Compliant: Under 60 lines.
        """
        # NASA Rule 5: Input validation
        assert isinstance(analysis_results, dict), "analysis_results must be a dict"
        assert feature_manager is not None, "feature_manager cannot be None"
        
        enterprise_gates = []
        
        # Six Sigma Quality Gates
        if feature_manager.is_enabled('sixsigma'):
            enterprise_gates.extend(self._evaluate_sixsigma_gates(analysis_results))
        
        # DFARS Compliance Gates
        if feature_manager.is_enabled('dfars_compliance'):
            enterprise_gates.extend(self._evaluate_dfars_gates(analysis_results))
        
        # Supply Chain Security Gates
        if feature_manager.is_enabled('supply_chain_governance'):
            enterprise_gates.extend(self._evaluate_supply_chain_gates(analysis_results))
        
        return enterprise_gates
    
def _evaluate_sixsigma_gates(self, analysis_results: Dict) -> List[QualityGateResult]:
        """Evaluate Six Sigma quality gates."""
        gates = []
        sixsigma_results = analysis_results.get('sixsigma', {})
        
        # Sigma Level Gate
        sigma_level = sixsigma_results.get('sigma_level', 0.0)
        gates.append(QualityGateResult(
            gate_name="Six Sigma Level",
            passed=sigma_level >= 4.0,  # Minimum 4-sigma requirement
            score=sigma_level / 6.0,  # Normalize to 0.0-1.0
            threshold=4.0,
            violations_count=len(analysis_results.get('violations', [])),
            recommendation="Improve process to achieve 6-sigma quality" if sigma_level < 6.0 else "Excellent"
        ))
        
        # Process Capability Gate
        cpk_value = sixsigma_results.get('cpk_value', 0.0)
        gates.append(QualityGateResult(
            gate_name="Process Capability (Cpk)",
            passed=cpk_value >= 1.33,
            score=min(1.0, cpk_value / 2.0),
            threshold=1.33,
            violations_count=0,
            recommendation="Improve process capability" if cpk_value < 1.33 else "Capable process"
        ))
        
        return gates
    
def _evaluate_dfars_gates(self, analysis_results: Dict) -> List[QualityGateResult]:
        """Evaluate DFARS compliance gates."""
        gates = []
        dfars_results = analysis_results.get('dfars_compliance', {})
        
        # Overall DFARS Compliance Gate
        compliance_score = dfars_results.get('overall_compliance', 0.0)
        failed_requirements = dfars_results.get('requirements_failed', [])
        
        gates.append(QualityGateResult(
            gate_name="DFARS Compliance",
            passed=compliance_score >= NASA_POT10_TARGET_COMPLIANCE_THRESHOLD,  # 95% compliance required
            score=compliance_score,
            threshold=0.95,
            violations_count=len(failed_requirements),
            recommendation="Address DFARS compliance gaps" if compliance_score < NASA_POT10_TARGET_COMPLIANCE_THRESHOLD else "Compliant"
        ))
        
        return gates
    
def _evaluate_supply_chain_gates(self, analysis_results: Dict) -> List[QualityGateResult]:
        """Evaluate supply chain security gates."""
        gates = []
        supply_chain_results = analysis_results.get('supply_chain', {})
        
        # Supply Chain Risk Gate
        risk_score = supply_chain_results.get('supply_chain_risk', 0.0)
        vulnerabilities = supply_chain_results.get('vulnerabilities_found', 0)
        
        gates.append(QualityGateResult(
            gate_name="Supply Chain Risk",
            passed=risk_score <= 0.3 and vulnerabilities == 0,
            score=max(0.0, 1.0 - risk_score),
            threshold=0.3,
            violations_count=vulnerabilities,
            recommendation="Address supply chain vulnerabilities" if vulnerabilities > 0 else "Low risk"
        ))
        
        return gates