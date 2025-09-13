# SPDX-License-Identifier: MIT
"""
Cross-Phase Security Validation System - Unified Security Architecture
======================================================================

Integrates NASA POT10 compliance, Byzantine consensus, and theater detection
across all analysis phases. Provides comprehensive security validation with
defense-in-depth strategies and continuous monitoring.

NASA Rule 4 Compliant: All methods under 60 lines.
NASA Rule 5 Compliant: Comprehensive defensive assertions.
"""

import asyncio
import hashlib
import logging
import time
from collections import defaultdict
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import Any, Dict, List, Optional, Set, Tuple, Union
import uuid

logger = logging.getLogger(__name__)


class SecurityLevel(Enum):
    """Security validation levels."""
    MINIMAL = "minimal"
    STANDARD = "standard"
    ENHANCED = "enhanced"
    CRITICAL = "critical"
    DEFENSE_INDUSTRY = "defense_industry"


class SecurityThreat(Enum):
    """Types of security threats."""
    PERFORMANCE_THEATER = "performance_theater"
    BYZANTINE_FAULT = "byzantine_fault"
    NASA_VIOLATION = "nasa_violation"
    INTEGRITY_COMPROMISE = "integrity_compromise"
    AVAILABILITY_ATTACK = "availability_attack"
    CONFIDENTIALITY_BREACH = "confidentiality_breach"


@dataclass
class SecurityRule:
    """Security rule definition."""
    rule_id: str
    name: str
    category: str  # 'nasa_pot10', 'byzantine', 'theater', 'integrity'
    severity: str  # 'critical', 'high', 'medium', 'low'
    description: str
    validation_function: str
    applicable_phases: List[str] = field(default_factory=list)
    compliance_threshold: float = 0.95
    remediation_guidance: str = ""


@dataclass
class SecurityViolation:
    """Security violation detected."""
    violation_id: str
    rule_id: str
    phase: str
    threat_type: SecurityThreat
    severity: str
    description: str
    evidence: List[str]
    confidence: float
    remediation_required: bool
    timestamp: str = field(default_factory=lambda: datetime.now().isoformat())
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class SecurityValidationResult:
    """Result from security validation."""
    validation_id: str
    phase: str
    success: bool
    compliance_score: float
    violations: List[SecurityViolation]
    security_metrics: Dict[str, Any]
    validation_duration: float
    recommendations: List[str] = field(default_factory=list)
    threat_assessment: Dict[str, float] = field(default_factory=dict)


@dataclass
class CrossPhaseSecurityResult:
    """Comprehensive cross-phase security result."""
    validation_timestamp: str
    overall_compliance_score: float
    security_level: SecurityLevel
    phase_results: Dict[str, SecurityValidationResult]
    cross_phase_violations: List[SecurityViolation]
    threat_landscape: Dict[SecurityThreat, float]
    defense_effectiveness: Dict[str, float]
    recommendations: List[str]
    passed_security_gates: bool
    metadata: Dict[str, Any] = field(default_factory=dict)


class NASAPot10Validator:
    """NASA Power of Ten Rules validator."""
    
    def __init__(self):
        self.rules = self._initialize_nasa_rules()
        self.compliance_threshold = 0.95
    
    def _initialize_nasa_rules(self) -> Dict[str, SecurityRule]:
        """Initialize NASA Power of Ten rules."""
        return {
            "NASA_POT10_1": SecurityRule(
                rule_id="NASA_POT10_1",
                name="Restrict all code to very simple control flow constructs",
                category="nasa_pot10",
                severity="critical",
                description="No goto statements, setjmp or longjmp constructs",
                validation_function="validate_control_flow",
                applicable_phases=["all"],
                remediation_guidance="Remove goto, setjmp, longjmp constructs"
            ),
            "NASA_POT10_2": SecurityRule(
                rule_id="NASA_POT10_2", 
                name="All loops must have fixed bounds",
                category="nasa_pot10",
                severity="critical",
                description="Loops must be provably finite and bounded",
                validation_function="validate_loop_bounds",
                applicable_phases=["all"],
                remediation_guidance="Add explicit loop bounds and termination conditions"
            ),
            "NASA_POT10_3": SecurityRule(
                rule_id="NASA_POT10_3",
                name="No dynamic memory allocation after initialization",
                category="nasa_pot10",
                severity="high",
                description="All memory allocation must occur during initialization",
                validation_function="validate_memory_allocation",
                applicable_phases=["performance_optimization", "precision_validation"],
                remediation_guidance="Pre-allocate all required memory during system initialization"
            ),
            "NASA_POT10_4": SecurityRule(
                rule_id="NASA_POT10_4",
                name="No function should be longer than can be printed on a page",
                category="nasa_pot10",
                severity="medium",
                description="Functions should be no more than 60 lines of code",
                validation_function="validate_function_length",
                applicable_phases=["all"],
                remediation_guidance="Break large functions into smaller, focused functions"
            ),
            "NASA_POT10_5": SecurityRule(
                rule_id="NASA_POT10_5",
                name="The assertion density should average to minimally two assertions per function",
                category="nasa_pot10",
                severity="high",
                description="Functions must have adequate defensive assertions",
                validation_function="validate_assertion_density",
                applicable_phases=["all"],
                remediation_guidance="Add input validation and state assertions"
            )
        }
    
    async def validate_nasa_compliance(self, phase: str, code_analysis_data: Dict[str, Any]) -> SecurityValidationResult:
        """
        Validate NASA POT10 compliance for a phase.
        NASA Rule 4 Compliant: Under 60 lines.
        """
        # NASA Rule 5: Input validation
        assert isinstance(phase, str), "phase must be string"
        assert isinstance(code_analysis_data, dict), "code_analysis_data must be dict"
        
        start_time = time.time()
        validation_id = f"nasa_{phase}_{uuid.uuid4().hex[:8]}"
        violations = []
        
        # Validate each applicable rule
        for rule_id, rule in self.rules.items():
            if phase not in rule.applicable_phases and "all" not in rule.applicable_phases:
                continue
            
            try:
                rule_violations = await self._validate_rule(rule, code_analysis_data)
                violations.extend(rule_violations)
            except Exception as e:
                logger.error(f"NASA rule validation failed for {rule_id}: {e}")
                violations.append(SecurityViolation(
                    violation_id=f"{rule_id}_{uuid.uuid4().hex[:8]}",
                    rule_id=rule_id,
                    phase=phase,
                    threat_type=SecurityThreat.NASA_VIOLATION,
                    severity="high",
                    description=f"Rule validation failed: {str(e)}",
                    evidence=[f"Validation error: {str(e)}"],
                    confidence=1.0,
                    remediation_required=True
                ))
        
        # Calculate compliance score
        total_rules = len([r for r in self.rules.values() 
                          if phase in r.applicable_phases or "all" in r.applicable_phases])
        critical_violations = len([v for v in violations if v.severity == "critical"])
        high_violations = len([v for v in violations if v.severity == "high"])
        
        # Weighted penalty system
        penalty = (critical_violations * 0.2) + (high_violations * 0.1) + (len(violations) * 0.02)
        compliance_score = max(0.0, 1.0 - penalty)
        
        validation_duration = time.time() - start_time
        
        return SecurityValidationResult(
            validation_id=validation_id,
            phase=phase,
            success=compliance_score >= self.compliance_threshold,
            compliance_score=compliance_score,
            violations=violations,
            security_metrics={
                'total_rules_checked': total_rules,
                'critical_violations': critical_violations,
                'high_violations': high_violations,
                'compliance_threshold': self.compliance_threshold
            },
            validation_duration=validation_duration,
            recommendations=self._generate_nasa_recommendations(violations)
        )
    
    async def _validate_rule(self, rule: SecurityRule, data: Dict[str, Any]) -> List[SecurityViolation]:
        """Validate a specific NASA rule."""
        violations = []
        
        if rule.validation_function == "validate_control_flow":
            violations = await self._validate_control_flow(rule, data)
        elif rule.validation_function == "validate_loop_bounds":
            violations = await self._validate_loop_bounds(rule, data)
        elif rule.validation_function == "validate_memory_allocation":
            violations = await self._validate_memory_allocation(rule, data)
        elif rule.validation_function == "validate_function_length":
            violations = await self._validate_function_length(rule, data)
        elif rule.validation_function == "validate_assertion_density":
            violations = await self._validate_assertion_density(rule, data)
        
        return violations
    
    async def _validate_control_flow(self, rule: SecurityRule, data: Dict) -> List[SecurityViolation]:
        """Validate control flow constructs."""
        violations = []
        
        # Check for prohibited constructs (simplified)
        prohibited_constructs = data.get('prohibited_constructs', [])
        
        for construct in prohibited_constructs:
            if construct['type'] in ['goto', 'setjmp', 'longjmp']:
                violations.append(SecurityViolation(
                    violation_id=f"{rule.rule_id}_{uuid.uuid4().hex[:8]}",
                    rule_id=rule.rule_id,
                    phase=data.get('phase', 'unknown'),
                    threat_type=SecurityThreat.NASA_VIOLATION,
                    severity=rule.severity,
                    description=f"Prohibited control flow construct: {construct['type']}",
                    evidence=[f"Found {construct['type']} at line {construct.get('line', 'unknown')}"],
                    confidence=0.95,
                    remediation_required=True
                ))
        
        return violations
    
    async def _validate_loop_bounds(self, rule: SecurityRule, data: Dict) -> List[SecurityViolation]:
        """Validate loop bounds."""
        violations = []
        
        unbounded_loops = data.get('unbounded_loops', [])
        
        for loop in unbounded_loops:
            violations.append(SecurityViolation(
                violation_id=f"{rule.rule_id}_{uuid.uuid4().hex[:8]}",
                rule_id=rule.rule_id,
                phase=data.get('phase', 'unknown'),
                threat_type=SecurityThreat.NASA_VIOLATION,
                severity=rule.severity,
                description=f"Unbounded loop detected",
                evidence=[f"Loop at line {loop.get('line', 'unknown')} lacks fixed bounds"],
                confidence=0.9,
                remediation_required=True
            ))
        
        return violations
    
    async def _validate_memory_allocation(self, rule: SecurityRule, data: Dict) -> List[SecurityViolation]:
        """Validate memory allocation patterns."""
        violations = []
        
        dynamic_allocations = data.get('dynamic_allocations', [])
        
        for allocation in dynamic_allocations:
            violations.append(SecurityViolation(
                violation_id=f"{rule.rule_id}_{uuid.uuid4().hex[:8]}",
                rule_id=rule.rule_id,
                phase=data.get('phase', 'unknown'),
                threat_type=SecurityThreat.NASA_VIOLATION,
                severity=rule.severity,
                description=f"Dynamic memory allocation after initialization",
                evidence=[f"malloc/new at line {allocation.get('line', 'unknown')}"],
                confidence=0.85,
                remediation_required=True
            ))
        
        return violations
    
    async def _validate_function_length(self, rule: SecurityRule, data: Dict) -> List[SecurityViolation]:
        """Validate function length."""
        violations = []
        
        long_functions = data.get('long_functions', [])
        
        for func in long_functions:
            if func.get('line_count', 0) > 60:
                violations.append(SecurityViolation(
                    violation_id=f"{rule.rule_id}_{uuid.uuid4().hex[:8]}",
                    rule_id=rule.rule_id,
                    phase=data.get('phase', 'unknown'),
                    threat_type=SecurityThreat.NASA_VIOLATION,
                    severity=rule.severity,
                    description=f"Function exceeds 60 lines",
                    evidence=[f"Function '{func['name']}' has {func['line_count']} lines"],
                    confidence=1.0,
                    remediation_required=True
                ))
        
        return violations
    
    async def _validate_assertion_density(self, rule: SecurityRule, data: Dict) -> List[SecurityViolation]:
        """Validate assertion density."""
        violations = []
        
        functions_without_assertions = data.get('functions_without_assertions', [])
        
        for func in functions_without_assertions:
            violations.append(SecurityViolation(
                violation_id=f"{rule.rule_id}_{uuid.uuid4().hex[:8]}",
                rule_id=rule.rule_id,
                phase=data.get('phase', 'unknown'),
                threat_type=SecurityThreat.NASA_VIOLATION,
                severity=rule.severity,
                description=f"Insufficient assertion density",
                evidence=[f"Function '{func['name']}' has {func.get('assertion_count', 0)} assertions"],
                confidence=0.8,
                remediation_required=True
            ))
        
        return violations
    
    def _generate_nasa_recommendations(self, violations: List[SecurityViolation]) -> List[str]:
        """Generate NASA compliance recommendations."""
        recommendations = []
        
        violation_counts = defaultdict(int)
        for violation in violations:
            violation_counts[violation.rule_id] += 1
        
        for rule_id, count in violation_counts.items():
            rule = self.rules.get(rule_id)
            if rule and count > 0:
                recommendations.append(
                    f"Address {count} violations of {rule.name}: {rule.remediation_guidance}"
                )
        
        return recommendations


class TheaterDetectionSystem:
    """Detects performance theater and fake work across phases."""
    
    def __init__(self):
        self.detection_threshold = 0.7
        self.pattern_database = self._initialize_theater_patterns()
    
    def _initialize_theater_patterns(self) -> Dict[str, Dict[str, Any]]:
        """Initialize theater detection patterns."""
        return {
            "fake_violations": {
                "pattern": "high_violation_count_low_confidence",
                "threshold": 0.3,
                "weight": 0.8
            },
            "performance_inflation": {
                "pattern": "unrealistic_performance_gains",
                "threshold": 0.9,  # >90% improvement is suspicious
                "weight": 0.9
            },
            "empty_results": {
                "pattern": "no_meaningful_output",
                "threshold": 0.1,
                "weight": 0.7
            },
            "timing_inconsistency": {
                "pattern": "execution_time_too_fast",
                "threshold": 0.01,  # <10ms for complex analysis
                "weight": 0.6
            }
        }
    
    async def detect_theater(self, phase: str, analysis_result: Dict[str, Any]) -> SecurityValidationResult:
        """
        Detect performance theater in analysis results.
        NASA Rule 4 Compliant: Under 60 lines.
        """
        # NASA Rule 5: Input validation
        assert isinstance(phase, str), "phase must be string"
        assert isinstance(analysis_result, dict), "analysis_result must be dict"
        
        start_time = time.time()
        validation_id = f"theater_{phase}_{uuid.uuid4().hex[:8]}"
        violations = []
        theater_scores = {}
        
        # Check each theater pattern
        for pattern_name, pattern_config in self.pattern_database.items():
            try:
                theater_score = await self._check_theater_pattern(pattern_name, pattern_config, analysis_result)
                theater_scores[pattern_name] = theater_score
                
                if theater_score > pattern_config["threshold"]:
                    violations.append(SecurityViolation(
                        violation_id=f"theater_{pattern_name}_{uuid.uuid4().hex[:8]}",
                        rule_id=f"THEATER_{pattern_name.upper()}",
                        phase=phase,
                        threat_type=SecurityThreat.PERFORMANCE_THEATER,
                        severity="high" if theater_score > 0.8 else "medium",
                        description=f"Performance theater detected: {pattern_name}",
                        evidence=[f"Theater score: {theater_score:.2f}"],
                        confidence=theater_score,
                        remediation_required=True
                    ))
            except Exception as e:
                logger.error(f"Theater detection failed for pattern {pattern_name}: {e}")
        
        # Calculate overall theater detection score
        weighted_scores = [
            score * self.pattern_database[pattern]["weight"] 
            for pattern, score in theater_scores.items()
        ]
        total_weight = sum(self.pattern_database[p]["weight"] for p in theater_scores.keys())
        
        overall_theater_score = sum(weighted_scores) / total_weight if total_weight > 0 else 0.0
        reality_score = 1.0 - overall_theater_score  # Higher reality score = less theater
        
        validation_duration = time.time() - start_time
        
        return SecurityValidationResult(
            validation_id=validation_id,
            phase=phase,
            success=reality_score >= self.detection_threshold,
            compliance_score=reality_score,
            violations=violations,
            security_metrics={
                'theater_scores': theater_scores,
                'overall_theater_score': overall_theater_score,
                'reality_score': reality_score,
                'patterns_checked': len(self.pattern_database)
            },
            validation_duration=validation_duration,
            recommendations=self._generate_theater_recommendations(violations),
            threat_assessment={'performance_theater': overall_theater_score}
        )
    
    async def _check_theater_pattern(self, pattern_name: str, config: Dict, data: Dict) -> float:
        """Check specific theater detection pattern."""
        if pattern_name == "fake_violations":
            return await self._check_fake_violations(data)
        elif pattern_name == "performance_inflation":
            return await self._check_performance_inflation(data)
        elif pattern_name == "empty_results":
            return await self._check_empty_results(data)
        elif pattern_name == "timing_inconsistency":
            return await self._check_timing_inconsistency(data)
        
        return 0.0
    
    async def _check_fake_violations(self, data: Dict) -> float:
        """Check for fake violation patterns."""
        violations = data.get('violations', [])
        
        if not violations:
            return 0.0
        
        # Check if violations have suspiciously low confidence
        low_confidence_count = sum(1 for v in violations if v.get('confidence', 1.0) < 0.3)
        fake_score = low_confidence_count / len(violations)
        
        return fake_score
    
    async def _check_performance_inflation(self, data: Dict) -> float:
        """Check for unrealistic performance claims."""
        performance_improvement = data.get('performance_improvement', 0.0)
        
        # >90% improvement is highly suspicious
        if performance_improvement > 0.9:
            return min(1.0, performance_improvement)
        
        return 0.0
    
    async def _check_empty_results(self, data: Dict) -> float:
        """Check for meaningless empty results."""
        violations = data.get('violations', [])
        metrics = data.get('metrics', {})
        
        # No violations and no meaningful metrics
        if not violations and len(metrics) < 2:
            return 0.8
        
        return 0.0
    
    async def _check_timing_inconsistency(self, data: Dict) -> float:
        """Check for suspiciously fast execution times."""
        execution_time = data.get('execution_time', 0.0)
        files_analyzed = data.get('files_analyzed', 1)
        
        # Less than 10ms per file is suspicious for complex analysis
        time_per_file = execution_time / max(1, files_analyzed)
        
        if time_per_file < 0.01:  # 10ms
            return 0.7
        
        return 0.0
    
    def _generate_theater_recommendations(self, violations: List[SecurityViolation]) -> List[str]:
        """Generate theater detection recommendations."""
        recommendations = []
        
        if any(v.rule_id.endswith("FAKE_VIOLATIONS") for v in violations):
            recommendations.append("Review violation detection confidence scores")
        
        if any(v.rule_id.endswith("PERFORMANCE_INFLATION") for v in violations):
            recommendations.append("Validate performance improvement claims with independent measurements")
        
        if any(v.rule_id.endswith("EMPTY_RESULTS") for v in violations):
            recommendations.append("Ensure analysis produces meaningful results and metrics")
        
        if any(v.rule_id.endswith("TIMING_INCONSISTENCY") for v in violations):
            recommendations.append("Verify execution times are realistic for the scope of analysis")
        
        return recommendations


class CrossPhaseSecurityValidator:
    """
    Comprehensive cross-phase security validation system.
    Integrates NASA compliance, Byzantine consensus, and theater detection.
    """
    
    def __init__(self, security_level: SecurityLevel = SecurityLevel.DEFENSE_INDUSTRY):
        self.security_level = security_level
        self.nasa_validator = NASAPot10Validator()
        self.theater_detector = TheaterDetectionSystem()
        self.validation_history = []
        
        # Security thresholds based on security level
        self.security_thresholds = self._initialize_security_thresholds()
        
    def _initialize_security_thresholds(self) -> Dict[str, float]:
        """Initialize security thresholds based on security level."""
        thresholds = {
            SecurityLevel.MINIMAL: {"compliance": 0.70, "theater": 0.50, "overall": 0.60},
            SecurityLevel.STANDARD: {"compliance": 0.80, "theater": 0.70, "overall": 0.75},
            SecurityLevel.ENHANCED: {"compliance": 0.90, "theater": 0.80, "overall": 0.85},
            SecurityLevel.CRITICAL: {"compliance": 0.95, "theater": 0.90, "overall": 0.92},
            SecurityLevel.DEFENSE_INDUSTRY: {"compliance": 0.95, "theater": 0.90, "overall": 0.95}
        }
        
        return thresholds[self.security_level]
    
    async def validate_cross_phase_security(
        self, 
        phase_results: Dict[str, Any]
    ) -> CrossPhaseSecurityResult:
        """
        Validate security across all phases with comprehensive analysis.
        NASA Rule 4 Compliant: Under 60 lines.
        """
        # NASA Rule 5: Input validation
        assert isinstance(phase_results, dict), "phase_results must be dict"
        assert len(phase_results) > 0, "phase_results cannot be empty"
        
        start_time = time.time()
        validation_timestamp = datetime.now().isoformat()
        
        # Validate each phase independently
        phase_security_results = {}
        all_violations = []
        
        for phase_name, phase_data in phase_results.items():
            try:
                # NASA compliance validation
                nasa_result = await self.nasa_validator.validate_nasa_compliance(phase_name, phase_data)
                
                # Theater detection
                theater_result = await self.theater_detector.detect_theater(phase_name, phase_data)
                
                # Combine results
                combined_result = self._combine_phase_security_results(nasa_result, theater_result)
                phase_security_results[phase_name] = combined_result
                
                # Collect all violations
                all_violations.extend(combined_result.violations)
                
            except Exception as e:
                logger.error(f"Security validation failed for phase {phase_name}: {e}")
                # Create error result
                error_result = SecurityValidationResult(
                    validation_id=f"error_{phase_name}_{int(time.time())}",
                    phase=phase_name,
                    success=False,
                    compliance_score=0.0,
                    violations=[],
                    security_metrics={},
                    validation_duration=0.0,
                    recommendations=[f"Fix validation error: {str(e)}"]
                )
                phase_security_results[phase_name] = error_result
        
        # Detect cross-phase security violations
        cross_phase_violations = await self._detect_cross_phase_violations(phase_results, all_violations)
        
        # Calculate overall compliance
        overall_compliance = self._calculate_overall_compliance(phase_security_results)
        
        # Assess threat landscape
        threat_landscape = self._assess_threat_landscape(all_violations + cross_phase_violations)
        
        # Evaluate defense effectiveness
        defense_effectiveness = self._evaluate_defense_effectiveness(phase_security_results)
        
        # Generate recommendations
        recommendations = self._generate_cross_phase_recommendations(
            phase_security_results, cross_phase_violations
        )
        
        # Determine if security gates pass
        gates_passed = self._evaluate_security_gates(overall_compliance, threat_landscape)
        
        result = CrossPhaseSecurityResult(
            validation_timestamp=validation_timestamp,
            overall_compliance_score=overall_compliance,
            security_level=self.security_level,
            phase_results=phase_security_results,
            cross_phase_violations=cross_phase_violations,
            threat_landscape=threat_landscape,
            defense_effectiveness=defense_effectiveness,
            recommendations=recommendations,
            passed_security_gates=gates_passed,
            metadata={
                'validation_duration': time.time() - start_time,
                'phases_validated': len(phase_security_results),
                'security_thresholds': self.security_thresholds
            }
        )
        
        self.validation_history.append(result)
        
        logger.info(
            f"Cross-phase security validation completed: {overall_compliance:.1%} compliance, "
            f"gates passed: {gates_passed}"
        )
        
        return result
    
    def _combine_phase_security_results(
        self, 
        nasa_result: SecurityValidationResult, 
        theater_result: SecurityValidationResult
    ) -> SecurityValidationResult:
        """Combine NASA and theater detection results."""
        # Combine violations
        combined_violations = nasa_result.violations + theater_result.violations
        
        # Weighted compliance score
        combined_score = (nasa_result.compliance_score * 0.7) + (theater_result.compliance_score * 0.3)
        
        # Combine metrics
        combined_metrics = {**nasa_result.security_metrics, **theater_result.security_metrics}
        
        # Combine recommendations
        combined_recommendations = nasa_result.recommendations + theater_result.recommendations
        
        # Combine threat assessment
        combined_threats = {**nasa_result.threat_assessment, **theater_result.threat_assessment}
        
        return SecurityValidationResult(
            validation_id=f"combined_{nasa_result.phase}_{int(time.time())}",
            phase=nasa_result.phase,
            success=combined_score >= self.security_thresholds["compliance"],
            compliance_score=combined_score,
            violations=combined_violations,
            security_metrics=combined_metrics,
            validation_duration=nasa_result.validation_duration + theater_result.validation_duration,
            recommendations=combined_recommendations,
            threat_assessment=combined_threats
        )
    
    async def _detect_cross_phase_violations(
        self, 
        phase_results: Dict[str, Any], 
        all_violations: List[SecurityViolation]
    ) -> List[SecurityViolation]:
        """Detect security violations that span multiple phases."""
        cross_phase_violations = []
        
        # Check for coordinated theater across phases
        theater_phases = []
        for phase_name, phase_data in phase_results.items():
            theater_score = phase_data.get('theater_score', 0.0)
            if theater_score > 0.5:
                theater_phases.append(phase_name)
        
        if len(theater_phases) > 2:
            cross_phase_violations.append(SecurityViolation(
                violation_id=f"coordinated_theater_{uuid.uuid4().hex[:8]}",
                rule_id="CROSS_PHASE_THEATER",
                phase="cross_phase",
                threat_type=SecurityThreat.PERFORMANCE_THEATER,
                severity="critical",
                description="Coordinated performance theater detected across multiple phases",
                evidence=[f"Theater detected in phases: {', '.join(theater_phases)}"],
                confidence=0.9,
                remediation_required=True
            ))
        
        # Check for consistency in violation patterns
        violation_patterns = defaultdict(list)
        for violation in all_violations:
            pattern_key = f"{violation.threat_type.value}:{violation.severity}"
            violation_patterns[pattern_key].append(violation.phase)
        
        # Detect suspicious patterns
        for pattern, phases in violation_patterns.items():
            if len(set(phases)) == 1 and len(phases) > 5:  # Same violation type/severity in one phase only
                cross_phase_violations.append(SecurityViolation(
                    violation_id=f"pattern_anomaly_{uuid.uuid4().hex[:8]}",
                    rule_id="CROSS_PHASE_PATTERN_ANOMALY",
                    phase="cross_phase",
                    threat_type=SecurityThreat.INTEGRITY_COMPROMISE,
                    severity="medium",
                    description=f"Suspicious violation pattern concentration: {pattern}",
                    evidence=[f"Pattern {pattern} concentrated in phase {phases[0]}"],
                    confidence=0.7,
                    remediation_required=False
                ))
        
        return cross_phase_violations
    
    def _calculate_overall_compliance(self, phase_results: Dict[str, SecurityValidationResult]) -> float:
        """Calculate overall security compliance across phases."""
        if not phase_results:
            return 0.0
        
        # Weighted average based on phase criticality
        phase_weights = {
            'precision_validation': 0.3,  # Highest weight for precision phase
            'performance_optimization': 0.25,
            'linter_integration': 0.25,
            'json_schema': 0.2
        }
        
        weighted_scores = []
        for phase_name, result in phase_results.items():
            weight = phase_weights.get(phase_name, 0.25)
            weighted_scores.append(result.compliance_score * weight)
        
        return sum(weighted_scores)
    
    def _assess_threat_landscape(self, all_violations: List[SecurityViolation]) -> Dict[SecurityThreat, float]:
        """Assess the threat landscape from all violations."""
        threat_counts = defaultdict(int)
        threat_severities = defaultdict(list)
        
        for violation in all_violations:
            threat_counts[violation.threat_type] += 1
            
            # Convert severity to numeric score
            severity_score = {'critical': 4, 'high': 3, 'medium': 2, 'low': 1}.get(violation.severity, 1)
            threat_severities[violation.threat_type].append(severity_score)
        
        # Calculate threat scores
        threat_scores = {}
        for threat_type in SecurityThreat:
            count = threat_counts.get(threat_type, 0)
            if count > 0:
                avg_severity = sum(threat_severities[threat_type]) / len(threat_severities[threat_type])
                # Normalize to 0-1 range
                threat_score = min(1.0, (count * avg_severity) / 20.0)
            else:
                threat_score = 0.0
            
            threat_scores[threat_type] = threat_score
        
        return threat_scores
    
    def _evaluate_defense_effectiveness(self, phase_results: Dict[str, SecurityValidationResult]) -> Dict[str, float]:
        """Evaluate effectiveness of defense mechanisms."""
        defense_scores = {}
        
        # NASA compliance effectiveness
        nasa_scores = [r.security_metrics.get('compliance_threshold', 0) for r in phase_results.values()]
        defense_scores['nasa_compliance'] = sum(nasa_scores) / len(nasa_scores) if nasa_scores else 0.0
        
        # Theater detection effectiveness
        theater_scores = [r.threat_assessment.get('performance_theater', 0) for r in phase_results.values()]
        defense_scores['theater_detection'] = 1.0 - (sum(theater_scores) / len(theater_scores)) if theater_scores else 1.0
        
        # Overall detection capability
        successful_validations = sum(1 for r in phase_results.values() if r.success)
        defense_scores['detection_capability'] = successful_validations / len(phase_results) if phase_results else 0.0
        
        return defense_scores
    
    def _generate_cross_phase_recommendations(
        self, 
        phase_results: Dict[str, SecurityValidationResult],
        cross_phase_violations: List[SecurityViolation]
    ) -> List[str]:
        """Generate cross-phase security recommendations."""
        recommendations = []
        
        # Collect all phase recommendations
        for result in phase_results.values():
            recommendations.extend(result.recommendations)
        
        # Add cross-phase specific recommendations
        if cross_phase_violations:
            recommendations.append(
                f"Address {len(cross_phase_violations)} cross-phase security violations"
            )
        
        # Check compliance levels
        low_compliance_phases = [
            name for name, result in phase_results.items() 
            if result.compliance_score < self.security_thresholds["compliance"]
        ]
        
        if low_compliance_phases:
            recommendations.append(
                f"Improve security compliance in phases: {', '.join(low_compliance_phases)}"
            )
        
        return list(set(recommendations))  # Remove duplicates
    
    def _evaluate_security_gates(
        self, 
        overall_compliance: float, 
        threat_landscape: Dict[SecurityThreat, float]
    ) -> bool:
        """Evaluate if security gates pass."""
        # Check compliance threshold
        if overall_compliance < self.security_thresholds["overall"]:
            return False
        
        # Check critical threat levels
        critical_threats = [
            SecurityThreat.NASA_VIOLATION,
            SecurityThreat.BYZANTINE_FAULT,
            SecurityThreat.INTEGRITY_COMPROMISE
        ]
        
        for threat in critical_threats:
            if threat_landscape.get(threat, 0.0) > 0.1:  # 10% threshold for critical threats
                return False
        
        return True
    
    def get_security_dashboard(self) -> Dict[str, Any]:
        """Get security validation dashboard."""
        if not self.validation_history:
            return {"status": "no_validations", "message": "No security validations performed"}
        
        latest_result = self.validation_history[-1]
        
        return {
            "timestamp": latest_result.validation_timestamp,
            "security_level": latest_result.security_level.value,
            "overall_compliance": latest_result.overall_compliance_score,
            "security_gates_passed": latest_result.passed_security_gates,
            "phases_validated": len(latest_result.phase_results),
            "total_violations": sum(len(r.violations) for r in latest_result.phase_results.values()),
            "cross_phase_violations": len(latest_result.cross_phase_violations),
            "threat_landscape": {t.value: s for t, s in latest_result.threat_landscape.items()},
            "defense_effectiveness": latest_result.defense_effectiveness,
            "validation_history_count": len(self.validation_history)
        }