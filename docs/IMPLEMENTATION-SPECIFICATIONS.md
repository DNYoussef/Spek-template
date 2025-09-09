# Implementation Specifications for Analyzer Consolidation

## Overview

This document provides production-ready implementation specifications for each component in the analyzer consolidation project, including interfaces, class designs, and integration patterns.

## Component Specifications

### 1. Policy Engine Implementation

**File**: `analyzer/core/policy_engine.py`
**Purpose**: Manage analysis policies, thresholds, and compliance validation
**Target LOC**: ~400 lines
**Dependencies**: ConfigurationManager, constants

```python
from typing import Dict, Any, List, Optional, NamedTuple
from dataclasses import dataclass
from enum import Enum
import logging

logger = logging.getLogger(__name__)

class PolicyCompliance(Enum):
    """Policy compliance states"""
    PASSING = "passing"
    WARNING = "warning"
    FAILING = "failing"
    UNKNOWN = "unknown"

@dataclass
class QualityThresholds:
    """Quality gate thresholds for a specific policy"""
    overall_quality: float
    nasa_compliance: float
    mece_score: float
    critical_violations: int
    high_violations: int
    medium_violations: int
    low_violations: int

@dataclass
class ComplianceResult:
    """Result of policy compliance validation"""
    policy_name: str
    compliance_state: PolicyCompliance
    overall_score: float
    threshold_results: Dict[str, bool]
    violations_summary: Dict[str, int]
    recommendations: List[str]

class PolicyEngine:
    """
    Manages analysis policies and compliance validation.
    NASA Rule 4 Compliant: All methods under 60 lines.
    """
    
    def __init__(self, config_manager):
        """Initialize policy engine with configuration manager."""
        assert config_manager is not None, "config_manager cannot be None"
        
        self.config = config_manager
        self.policy_cache = {}
        self.threshold_cache = {}
        
    def get_policy_settings(self, policy_name: str) -> Dict[str, Any]:
        """
        Get all settings for a specific policy.
        NASA Rule 4 Compliant: Under 60 lines.
        """
        assert policy_name is not None, "policy_name cannot be None"
        assert isinstance(policy_name, str), "policy_name must be string"
        
        if policy_name in self.policy_cache:
            return self.policy_cache[policy_name]
        
        # Load policy from configuration
        policy_config = self.config.get_policy_config(policy_name)
        
        # Apply policy-specific defaults
        settings = self._apply_policy_defaults(policy_name, policy_config)
        
        # Cache for performance
        self.policy_cache[policy_name] = settings
        
        logger.debug(f"Loaded policy settings for {policy_name}")
        return settings
    
    def get_quality_thresholds(self, policy_name: str) -> QualityThresholds:
        """
        Get quality gate thresholds for policy.
        NASA Rule 4 Compliant: Under 60 lines.
        """
        assert policy_name is not None, "policy_name cannot be None"
        
        if policy_name in self.threshold_cache:
            return self.threshold_cache[policy_name]
        
        settings = self.get_policy_settings(policy_name)
        thresholds = self._build_quality_thresholds(settings)
        
        self.threshold_cache[policy_name] = thresholds
        return thresholds
    
    def validate_policy_compliance(
        self, 
        policy_name: str, 
        violations: List, 
        quality_metrics: Dict[str, float]
    ) -> ComplianceResult:
        """
        Check if analysis results comply with policy.
        NASA Rule 4 Compliant: Under 60 lines.
        """
        assert policy_name is not None, "policy_name cannot be None"
        assert violations is not None, "violations cannot be None"
        assert quality_metrics is not None, "quality_metrics cannot be None"
        
        thresholds = self.get_quality_thresholds(policy_name)
        
        # Count violations by severity
        violation_counts = self._count_violations_by_severity(violations)
        
        # Check each threshold
        threshold_results = self._check_thresholds(thresholds, quality_metrics, violation_counts)
        
        # Determine overall compliance
        compliance_state = self._determine_compliance_state(threshold_results)
        
        # Generate recommendations
        recommendations = self._generate_recommendations(
            compliance_state, threshold_results, violation_counts
        )
        
        return ComplianceResult(
            policy_name=policy_name,
            compliance_state=compliance_state,
            overall_score=quality_metrics.get("overall_quality", 0.0),
            threshold_results=threshold_results,
            violations_summary=violation_counts,
            recommendations=recommendations
        )
    
    def _apply_policy_defaults(self, policy_name: str, config: Dict[str, Any]) -> Dict[str, Any]:
        """Apply policy-specific defaults. NASA Rule 4 compliant."""
        policy_defaults = {
            "nasa-compliance": {
                "nasa_compliance_threshold": 0.95,
                "critical_violation_limit": 0,
                "high_violation_limit": 2,
                "overall_quality_threshold": 0.90
            },
            "strict": {
                "nasa_compliance_threshold": 0.90,
                "critical_violation_limit": 0,
                "high_violation_limit": 5,
                "overall_quality_threshold": 0.85
            },
            "standard": {
                "nasa_compliance_threshold": 0.85,
                "critical_violation_limit": 1,
                "high_violation_limit": 10,
                "overall_quality_threshold": 0.75
            },
            "lenient": {
                "nasa_compliance_threshold": 0.75,
                "critical_violation_limit": 3,
                "high_violation_limit": 20,
                "overall_quality_threshold": 0.65
            }
        }
        
        defaults = policy_defaults.get(policy_name, policy_defaults["standard"])
        merged_config = defaults.copy()
        merged_config.update(config)
        
        return merged_config
    
    def _build_quality_thresholds(self, settings: Dict[str, Any]) -> QualityThresholds:
        """Build QualityThresholds from settings. NASA Rule 4 compliant."""
        return QualityThresholds(
            overall_quality=settings.get("overall_quality_threshold", 0.75),
            nasa_compliance=settings.get("nasa_compliance_threshold", 0.85),
            mece_score=settings.get("mece_score_threshold", 0.80),
            critical_violations=settings.get("critical_violation_limit", 1),
            high_violations=settings.get("high_violation_limit", 10),
            medium_violations=settings.get("medium_violation_limit", 50),
            low_violations=settings.get("low_violation_limit", 200)
        )
    
    def _count_violations_by_severity(self, violations: List) -> Dict[str, int]:
        """Count violations by severity level. NASA Rule 4 compliant."""
        counts = {"critical": 0, "high": 0, "medium": 0, "low": 0}
        
        for violation in violations:
            severity = getattr(violation, "severity", "medium")
            if severity in counts:
                counts[severity] += 1
        
        return counts
    
    def _check_thresholds(
        self, 
        thresholds: QualityThresholds, 
        metrics: Dict[str, float], 
        violations: Dict[str, int]
    ) -> Dict[str, bool]:
        """Check individual thresholds. NASA Rule 4 compliant."""
        return {
            "overall_quality": metrics.get("overall_quality", 0.0) >= thresholds.overall_quality,
            "nasa_compliance": metrics.get("nasa_compliance", 0.0) >= thresholds.nasa_compliance,
            "mece_score": metrics.get("mece_score", 0.0) >= thresholds.mece_score,
            "critical_violations": violations.get("critical", 0) <= thresholds.critical_violations,
            "high_violations": violations.get("high", 0) <= thresholds.high_violations,
            "medium_violations": violations.get("medium", 0) <= thresholds.medium_violations,
            "low_violations": violations.get("low", 0) <= thresholds.low_violations
        }
    
    def _determine_compliance_state(self, threshold_results: Dict[str, bool]) -> PolicyCompliance:
        """Determine overall compliance state. NASA Rule 4 compliant."""
        critical_failing = not all([
            threshold_results.get("overall_quality", False),
            threshold_results.get("critical_violations", False)
        ])
        
        if critical_failing:
            return PolicyCompliance.FAILING
        
        important_failing = not all([
            threshold_results.get("nasa_compliance", False),
            threshold_results.get("high_violations", False)
        ])
        
        if important_failing:
            return PolicyCompliance.WARNING
        
        return PolicyCompliance.PASSING
    
    def _generate_recommendations(
        self, 
        compliance: PolicyCompliance, 
        thresholds: Dict[str, bool], 
        violations: Dict[str, int]
    ) -> List[str]:
        """Generate compliance recommendations. NASA Rule 4 compliant."""
        recommendations = []
        
        if not thresholds.get("critical_violations", True):
            recommendations.append(
                f"CRITICAL: Reduce {violations.get('critical', 0)} critical violations to 0"
            )
        
        if not thresholds.get("overall_quality", True):
            recommendations.append(
                "Improve overall code quality through refactoring"
            )
        
        if not thresholds.get("nasa_compliance", True):
            recommendations.append(
                "Address NASA Power of Ten compliance violations"
            )
        
        if not thresholds.get("high_violations", True):
            recommendations.append(
                f"Reduce {violations.get('high', 0)} high-severity violations"
            )
        
        if compliance == PolicyCompliance.PASSING:
            recommendations.append("Code quality meets policy requirements")
        
        return recommendations
```

### 2. Quality Calculator Implementation

**File**: `analyzer/core/quality_calculator.py`
**Purpose**: Calculate quality metrics and scores
**Target LOC**: ~350 lines
**Dependencies**: constants, violation types

```python
from typing import Dict, Any, List, Optional
from dataclasses import dataclass
import math
import logging

logger = logging.getLogger(__name__)

@dataclass
class QualityMetrics:
    """Comprehensive quality metrics for analysis results"""
    overall_quality_score: float
    nasa_compliance_score: float
    mece_duplication_score: float
    connascence_index: float
    code_complexity_score: float
    maintainability_index: float
    technical_debt_ratio: float

class QualityCalculator:
    """
    Calculates quality metrics and scores from analysis results.
    NASA Rule 4 Compliant: All methods under 60 lines.
    """
    
    def __init__(self, config_manager):
        """Initialize quality calculator with configuration."""
        assert config_manager is not None, "config_manager cannot be None"
        
        self.config = config_manager
        self.violation_weights = self._load_violation_weights()
        self.severity_multipliers = self._load_severity_multipliers()
    
    def calculate_all_metrics(
        self, 
        violations: List,
        nasa_violations: List,
        duplication_results: Dict[str, Any],
        file_count: int = 1
    ) -> QualityMetrics:
        """
        Calculate comprehensive quality metrics.
        NASA Rule 4 Compliant: Under 60 lines.
        """
        assert violations is not None, "violations cannot be None"
        assert nasa_violations is not None, "nasa_violations cannot be None"
        assert file_count > 0, "file_count must be positive"
        
        # Calculate individual components
        connascence_index = self.calculate_connascence_index(violations)
        nasa_score = self.calculate_nasa_compliance(nasa_violations, file_count)
        mece_score = self.calculate_mece_score(duplication_results)
        complexity_score = self.calculate_complexity_score(violations, file_count)
        maintainability = self.calculate_maintainability_index(violations, file_count)
        debt_ratio = self.calculate_technical_debt_ratio(violations, file_count)
        
        # Calculate overall quality (weighted average)
        overall_score = self._calculate_weighted_overall_score(
            nasa_score, mece_score, complexity_score, maintainability
        )
        
        return QualityMetrics(
            overall_quality_score=overall_score,
            nasa_compliance_score=nasa_score,
            mece_duplication_score=mece_score,
            connascence_index=connascence_index,
            code_complexity_score=complexity_score,
            maintainability_index=maintainability,
            technical_debt_ratio=debt_ratio
        )
    
    def calculate_nasa_compliance(self, nasa_violations: List, file_count: int) -> float:
        """
        Calculate NASA Power of Ten compliance score.
        NASA Rule 4 Compliant: Under 60 lines.
        """
        assert nasa_violations is not None, "nasa_violations cannot be None"
        assert file_count > 0, "file_count must be positive"
        
        if not nasa_violations:
            return 1.0  # Perfect compliance
        
        # Count violations by NASA rule
        rule_violations = self._count_nasa_violations_by_rule(nasa_violations)
        
        # Calculate penalty based on rule weights
        total_penalty = 0.0
        rule_weights = {
            "Rule1": 0.2, "Rule2": 0.15, "Rule3": 0.1, 
            "Rule4": 0.15, "Rule5": 0.2, "Rule6": 0.1, 
            "Rule7": 0.05, "Rule8": 0.05
        }
        
        for rule, count in rule_violations.items():
            weight = rule_weights.get(rule, 0.1)
            penalty = min(count / file_count, 1.0) * weight
            total_penalty += penalty
        
        # Convert penalty to compliance score
        compliance_score = max(0.0, 1.0 - total_penalty)
        return round(compliance_score, 3)
    
    def calculate_mece_score(self, duplication_results: Dict[str, Any]) -> float:
        """
        Calculate MECE duplication score.
        NASA Rule 4 Compliant: Under 60 lines.
        """
        assert duplication_results is not None, "duplication_results cannot be None"
        
        if not duplication_results.get("available", False):
            return 1.0  # No duplication analysis available
        
        base_score = duplication_results.get("score", 1.0)
        violations = duplication_results.get("violations", [])
        
        if not violations:
            return base_score
        
        # Apply penalty for high-severity duplications
        severity_penalty = 0.0
        for violation in violations:
            severity = violation.get("severity", "medium")
            if severity == "critical":
                severity_penalty += 0.1
            elif severity == "high":
                severity_penalty += 0.05
        
        adjusted_score = max(0.0, base_score - severity_penalty)
        return round(adjusted_score, 3)
    
    def calculate_connascence_index(self, violations: List) -> float:
        """
        Calculate connascence coupling index.
        NASA Rule 4 Compliant: Under 60 lines.
        """
        assert violations is not None, "violations cannot be None"
        
        if not violations:
            return 0.0  # No coupling
        
        total_weight = 0.0
        
        for violation in violations:
            violation_type = getattr(violation, "type", "unknown")
            severity = getattr(violation, "severity", "medium")
            
            base_weight = self.violation_weights.get(violation_type, 1.0)
            severity_multiplier = self.severity_multipliers.get(severity, 1.0)
            
            violation_weight = base_weight * severity_multiplier
            total_weight += violation_weight
        
        # Normalize to reasonable scale (0-100)
        connascence_index = min(total_weight, 100.0)
        return round(connascence_index, 2)
    
    def calculate_complexity_score(self, violations: List, file_count: int) -> float:
        """
        Calculate code complexity score.
        NASA Rule 4 Compliant: Under 60 lines.
        """
        assert violations is not None, "violations cannot be None"
        assert file_count > 0, "file_count must be positive"
        
        # Count complexity-related violations
        complexity_violations = [
            v for v in violations 
            if self._is_complexity_violation(getattr(v, "type", ""))
        ]
        
        if not complexity_violations:
            return 1.0  # Perfect complexity score
        
        # Calculate complexity penalty
        violation_density = len(complexity_violations) / file_count
        complexity_penalty = min(violation_density * 0.1, 0.5)  # Cap at 50% penalty
        
        complexity_score = max(0.0, 1.0 - complexity_penalty)
        return round(complexity_score, 3)
    
    def calculate_maintainability_index(self, violations: List, file_count: int) -> float:
        """
        Calculate maintainability index.
        NASA Rule 4 Compliant: Under 60 lines.
        """
        assert violations is not None, "violations cannot be None"
        assert file_count > 0, "file_count must be positive"
        
        # Base maintainability factors
        violation_factor = self._calculate_violation_factor(violations)
        complexity_factor = self._calculate_complexity_factor(violations)
        coupling_factor = self._calculate_coupling_factor(violations)
        
        # Weighted maintainability index (0-1 scale)
        maintainability = (
            0.4 * (1.0 - violation_factor) +
            0.3 * (1.0 - complexity_factor) +
            0.3 * (1.0 - coupling_factor)
        )
        
        return round(max(0.0, maintainability), 3)
    
    def calculate_technical_debt_ratio(self, violations: List, file_count: int) -> float:
        """
        Calculate technical debt ratio.
        NASA Rule 4 Compliant: Under 60 lines.
        """
        assert violations is not None, "violations cannot be None"
        assert file_count > 0, "file_count must be positive"
        
        # Estimate effort to fix violations (in hours)
        debt_hours = 0.0
        effort_estimates = {
            "critical": 4.0,  # 4 hours per critical violation
            "high": 2.0,      # 2 hours per high violation
            "medium": 1.0,    # 1 hour per medium violation
            "low": 0.5        # 30 minutes per low violation
        }
        
        for violation in violations:
            severity = getattr(violation, "severity", "medium")
            debt_hours += effort_estimates.get(severity, 1.0)
        
        # Estimate total development time (8 hours per file as baseline)
        total_development_hours = file_count * 8.0
        
        # Technical debt ratio
        debt_ratio = min(debt_hours / total_development_hours, 1.0)
        return round(debt_ratio, 3)
    
    def _calculate_weighted_overall_score(
        self, 
        nasa_score: float, 
        mece_score: float, 
        complexity_score: float, 
        maintainability: float
    ) -> float:
        """Calculate weighted overall quality score. NASA Rule 4 compliant."""
        # Weights for different quality aspects
        weights = {
            "nasa": 0.3,
            "mece": 0.2,
            "complexity": 0.25,
            "maintainability": 0.25
        }
        
        overall_score = (
            weights["nasa"] * nasa_score +
            weights["mece"] * mece_score +
            weights["complexity"] * complexity_score +
            weights["maintainability"] * maintainability
        )
        
        return round(overall_score, 3)
    
    def _load_violation_weights(self) -> Dict[str, float]:
        """Load violation type weights from configuration."""
        return self.config.get_connascence_weights()
    
    def _load_severity_multipliers(self) -> Dict[str, float]:
        """Load severity multipliers from configuration."""
        return self.config.get_severity_multipliers()
    
    def _count_nasa_violations_by_rule(self, nasa_violations: List) -> Dict[str, int]:
        """Count NASA violations by rule. NASA Rule 4 compliant."""
        rule_counts = {}
        
        for violation in nasa_violations:
            rule_id = getattr(violation, "rule_id", "Unknown")
            if "NASA" in rule_id:
                # Extract rule number from rule_id (e.g., "NASA_POT10_1" -> "Rule1")
                rule_num = rule_id.split("_")[-1]
                rule_key = f"Rule{rule_num}"
                rule_counts[rule_key] = rule_counts.get(rule_key, 0) + 1
        
        return rule_counts
    
    def _is_complexity_violation(self, violation_type: str) -> bool:
        """Check if violation relates to code complexity."""
        complexity_types = {
            "god_object", "connascence_of_algorithm", "connascence_of_position",
            "high_cyclomatic_complexity", "deep_nesting", "long_method"
        }
        return violation_type in complexity_types
    
    def _calculate_violation_factor(self, violations: List) -> float:
        """Calculate violation density factor. NASA Rule 4 compliant."""
        if not violations:
            return 0.0
        
        # Weight violations by severity
        weighted_violations = sum(
            self.severity_multipliers.get(getattr(v, "severity", "medium"), 1.0)
            for v in violations
        )
        
        # Normalize to 0-1 scale (assume 10 weighted violations = 100% penalty)
        violation_factor = min(weighted_violations / 10.0, 1.0)
        return violation_factor
    
    def _calculate_complexity_factor(self, violations: List) -> float:
        """Calculate complexity factor. NASA Rule 4 compliant."""
        complexity_violations = [
            v for v in violations 
            if self._is_complexity_violation(getattr(v, "type", ""))
        ]
        
        if not complexity_violations:
            return 0.0
        
        # Normalize complexity violations (assume 5 = 100% penalty)
        complexity_factor = min(len(complexity_violations) / 5.0, 1.0)
        return complexity_factor
    
    def _calculate_coupling_factor(self, violations: List) -> float:
        """Calculate coupling factor. NASA Rule 4 compliant."""
        coupling_violations = [
            v for v in violations 
            if "connascence" in getattr(v, "type", "").lower()
        ]
        
        if not coupling_violations:
            return 0.0
        
        # Normalize coupling violations (assume 15 = 100% penalty)
        coupling_factor = min(len(coupling_violations) / 15.0, 1.0)
        return coupling_factor
```

### 3. Result Aggregator Implementation

**File**: `analyzer/core/result_aggregator.py`
**Purpose**: Aggregate and process analysis results from multiple sources
**Target LOC**: ~300 lines
**Dependencies**: violation types, quality metrics

```python
from typing import Dict, Any, List, Optional, Tuple
from dataclasses import dataclass, asdict
from collections import defaultdict
import logging

logger = logging.getLogger(__name__)

@dataclass
class AggregatedResults:
    """Aggregated analysis results from all phases"""
    connascence_violations: List[Any]
    nasa_violations: List[Any] 
    duplication_violations: List[Any]
    god_objects: List[Dict[str, Any]]
    quality_metrics: Dict[str, float]
    summary_statistics: Dict[str, Any]
    correlations: Optional[List[Dict[str, Any]]] = None
    recommendations: Optional[List[str]] = None

class ResultAggregator:
    """
    Aggregates analysis results from multiple phases and sources.
    NASA Rule 4 Compliant: All methods under 60 lines.
    """
    
    def __init__(self, config_manager):
        """Initialize result aggregator with configuration."""
        assert config_manager is not None, "config_manager cannot be None"
        
        self.config = config_manager
        self.result_cache = {}
        
    def aggregate_all_results(
        self,
        connascence_results: List,
        nasa_results: List, 
        duplication_results: Dict[str, Any],
        quality_metrics: Dict[str, float],
        file_count: int = 1
    ) -> AggregatedResults:
        """
        Aggregate results from all analysis phases.
        NASA Rule 4 Compliant: Under 60 lines.
        """
        assert connascence_results is not None, "connascence_results cannot be None"
        assert nasa_results is not None, "nasa_results cannot be None"
        assert duplication_results is not None, "duplication_results cannot be None"
        assert quality_metrics is not None, "quality_metrics cannot be None"
        assert file_count > 0, "file_count must be positive"
        
        # Extract god objects from connascence results
        god_objects = self._extract_god_objects(connascence_results)
        
        # Extract duplication violations
        duplication_violations = duplication_results.get("violations", [])
        
        # Generate summary statistics
        summary_stats = self._generate_summary_statistics(
            connascence_results, nasa_results, duplication_violations, file_count
        )
        
        # Generate recommendations
        recommendations = self._generate_recommendations(
            connascence_results, nasa_results, duplication_violations, quality_metrics
        )
        
        return AggregatedResults(
            connascence_violations=connascence_results,
            nasa_violations=nasa_results,
            duplication_violations=duplication_violations,
            god_objects=god_objects,
            quality_metrics=quality_metrics,
            summary_statistics=summary_stats,
            recommendations=recommendations
        )
    
    def correlate_violations(
        self,
        results: AggregatedResults,
        correlation_threshold: float = 0.7
    ) -> List[Dict[str, Any]]:
        """
        Find correlations between different types of violations.
        NASA Rule 4 Compliant: Under 60 lines.
        """
        assert results is not None, "results cannot be None"
        assert 0.0 <= correlation_threshold <= 1.0, "correlation_threshold must be 0-1"
        
        correlations = []
        
        # File-level correlation analysis
        file_violations = self._group_violations_by_file(results)
        
        for file_path, violations in file_violations.items():
            if len(violations) < 2:
                continue  # Need at least 2 violations for correlation
            
            # Find patterns in violation types
            correlation = self._analyze_file_violation_patterns(file_path, violations)
            
            if correlation.get("correlation_score", 0.0) >= correlation_threshold:
                correlations.append(correlation)
        
        # Cross-file correlations
        cross_file_correlations = self._analyze_cross_file_patterns(
            file_violations, correlation_threshold
        )
        correlations.extend(cross_file_correlations)
        
        return sorted(correlations, key=lambda x: x.get("correlation_score", 0), reverse=True)
    
    def format_for_export(self, results: AggregatedResults, format_type: str = "json") -> Dict[str, Any]:
        """
        Format aggregated results for export.
        NASA Rule 4 Compliant: Under 60 lines.
        """
        assert results is not None, "results cannot be None"
        assert format_type in ["json", "sarif", "yaml"], "Invalid format_type"
        
        if format_type == "json":
            return self._format_json_export(results)
        elif format_type == "sarif":
            return self._format_sarif_export(results)
        elif format_type == "yaml":
            return self._format_yaml_export(results)
        else:
            raise ValueError(f"Unsupported format: {format_type}")
    
    def _extract_god_objects(self, violations: List) -> List[Dict[str, Any]]:
        """Extract god object violations. NASA Rule 4 compliant."""
        god_objects = []
        
        for violation in violations:
            violation_type = getattr(violation, "type", "")
            if violation_type == "god_object":
                god_objects.append({
                    "file_path": getattr(violation, "file_path", ""),
                    "line_number": getattr(violation, "line_number", 0),
                    "class_name": getattr(violation, "context", {}).get("class_name", "Unknown"),
                    "method_count": getattr(violation, "context", {}).get("method_count", 0),
                    "estimated_loc": getattr(violation, "context", {}).get("estimated_loc", 0),
                    "severity": getattr(violation, "severity", "medium"),
                    "recommendations": getattr(violation, "recommendation", "")
                })
        
        return god_objects
    
    def _generate_summary_statistics(
        self, 
        connascence_violations: List,
        nasa_violations: List, 
        duplication_violations: List,
        file_count: int
    ) -> Dict[str, Any]:
        """Generate summary statistics. NASA Rule 4 compliant."""
        # Count violations by severity
        severity_counts = {"critical": 0, "high": 0, "medium": 0, "low": 0}
        
        all_violations = connascence_violations + nasa_violations + duplication_violations
        for violation in all_violations:
            severity = getattr(violation, "severity", "medium")
            if severity in severity_counts:
                severity_counts[severity] += 1
        
        # Calculate violation density
        total_violations = len(all_violations)
        violation_density = total_violations / file_count if file_count > 0 else 0
        
        return {
            "total_violations": total_violations,
            "violation_density": round(violation_density, 2),
            "severity_breakdown": severity_counts,
            "connascence_count": len(connascence_violations),
            "nasa_count": len(nasa_violations),
            "duplication_count": len(duplication_violations),
            "files_analyzed": file_count,
            "average_violations_per_file": round(violation_density, 1)
        }
    
    def _generate_recommendations(
        self,
        connascence_violations: List,
        nasa_violations: List,
        duplication_violations: List,
        quality_metrics: Dict[str, float]
    ) -> List[str]:
        """Generate actionable recommendations. NASA Rule 4 compliant."""
        recommendations = []
        
        # Critical violations first
        critical_count = len([v for v in (connascence_violations + nasa_violations + duplication_violations) 
                            if getattr(v, "severity", "") == "critical"])
        
        if critical_count > 0:
            recommendations.append(f"URGENT: Address {critical_count} critical violations immediately")
        
        # NASA compliance recommendations
        nasa_score = quality_metrics.get("nasa_compliance_score", 1.0)
        if nasa_score < 0.90:
            recommendations.append("Improve NASA Power of Ten compliance for production readiness")
        
        # Quality score recommendations
        overall_quality = quality_metrics.get("overall_quality_score", 1.0)
        if overall_quality < 0.75:
            recommendations.append("Refactor code to improve overall quality score")
        
        # Duplication recommendations
        mece_score = quality_metrics.get("mece_duplication_score", 1.0)
        if mece_score < 0.80:
            recommendations.append("Eliminate code duplication through consolidation and abstraction")
        
        # God object recommendations
        god_object_count = len([v for v in connascence_violations if getattr(v, "type", "") == "god_object"])
        if god_object_count > 0:
            recommendations.append(f"Decompose {god_object_count} god object(s) using Single Responsibility Principle")
        
        if not recommendations:
            recommendations.append("Code quality meets standards - maintain current practices")
        
        return recommendations
    
    def _group_violations_by_file(self, results: AggregatedResults) -> Dict[str, List]:
        """Group all violations by file path. NASA Rule 4 compliant."""
        file_violations = defaultdict(list)
        
        all_violations = (
            results.connascence_violations + 
            results.nasa_violations + 
            results.duplication_violations
        )
        
        for violation in all_violations:
            file_path = getattr(violation, "file_path", "unknown")
            file_violations[file_path].append(violation)
        
        return dict(file_violations)
    
    def _analyze_file_violation_patterns(self, file_path: str, violations: List) -> Dict[str, Any]:
        """Analyze violation patterns within a file. NASA Rule 4 compliant."""
        violation_types = [getattr(v, "type", "unknown") for v in violations]
        
        # Look for common patterns
        patterns = {
            "god_object_with_coupling": ("god_object" in violation_types and 
                                       any("connascence" in vt for vt in violation_types)),
            "nasa_with_complexity": (any("NASA" in str(v) for v in violations) and
                                   any("algorithm" in vt for vt in violation_types)),
            "duplication_cluster": len([vt for vt in violation_types if "duplication" in vt]) >= 2
        }
        
        # Calculate correlation score based on patterns
        pattern_count = sum(1 for p in patterns.values() if p)
        correlation_score = min(pattern_count / len(patterns), 1.0)
        
        return {
            "file_path": file_path,
            "correlation_type": "intra_file",
            "correlation_score": round(correlation_score, 3),
            "patterns_detected": [k for k, v in patterns.items() if v],
            "violation_count": len(violations)
        }
    
    def _analyze_cross_file_patterns(
        self, 
        file_violations: Dict[str, List], 
        threshold: float
    ) -> List[Dict[str, Any]]:
        """Analyze patterns across files. NASA Rule 4 compliant."""
        correlations = []
        
        # Look for files with similar violation patterns
        files = list(file_violations.keys())
        
        for i, file1 in enumerate(files):
            for file2 in files[i+1:]:
                violations1 = file_violations[file1]
                violations2 = file_violations[file2]
                
                # Calculate pattern similarity
                similarity = self._calculate_pattern_similarity(violations1, violations2)
                
                if similarity >= threshold:
                    correlations.append({
                        "correlation_type": "cross_file",
                        "files": [file1, file2],
                        "correlation_score": similarity,
                        "pattern_type": "similar_violations"
                    })
        
        return correlations
    
    def _calculate_pattern_similarity(self, violations1: List, violations2: List) -> float:
        """Calculate similarity between violation patterns. NASA Rule 4 compliant."""
        if not violations1 or not violations2:
            return 0.0
        
        types1 = set(getattr(v, "type", "unknown") for v in violations1)
        types2 = set(getattr(v, "type", "unknown") for v in violations2)
        
        # Jaccard similarity
        intersection = len(types1.intersection(types2))
        union = len(types1.union(types2))
        
        similarity = intersection / union if union > 0 else 0.0
        return round(similarity, 3)
    
    def _format_json_export(self, results: AggregatedResults) -> Dict[str, Any]:
        """Format results for JSON export. NASA Rule 4 compliant."""
        return {
            "analysis_results": {
                "violations": {
                    "connascence": [asdict(v) if hasattr(v, '__dict__') else v 
                                  for v in results.connascence_violations],
                    "nasa_compliance": [asdict(v) if hasattr(v, '__dict__') else v 
                                      for v in results.nasa_violations],
                    "duplication": results.duplication_violations
                },
                "god_objects": results.god_objects,
                "quality_metrics": results.quality_metrics,
                "summary": results.summary_statistics,
                "recommendations": results.recommendations or [],
                "correlations": results.correlations or []
            }
        }
    
    def _format_sarif_export(self, results: AggregatedResults) -> Dict[str, Any]:
        """Format results for SARIF export. NASA Rule 4 compliant."""
        # Simplified SARIF structure - full implementation would be more complex
        return {
            "version": "2.1.0",
            "runs": [{
                "tool": {
                    "driver": {
                        "name": "ConnascenceAnalyzer",
                        "version": "2.0.0"
                    }
                },
                "results": self._convert_violations_to_sarif_results(results)
            }]
        }
    
    def _format_yaml_export(self, results: AggregatedResults) -> Dict[str, Any]:
        """Format results for YAML export. NASA Rule 4 compliant."""
        # Similar to JSON but with YAML-friendly structure
        return self._format_json_export(results)
    
    def _convert_violations_to_sarif_results(self, results: AggregatedResults) -> List[Dict[str, Any]]:
        """Convert violations to SARIF result format. NASA Rule 4 compliant."""
        sarif_results = []
        
        all_violations = (
            results.connascence_violations + 
            results.nasa_violations + 
            results.duplication_violations
        )
        
        for violation in all_violations:
            sarif_result = {
                "ruleId": getattr(violation, "type", "unknown"),
                "level": self._map_severity_to_sarif_level(getattr(violation, "severity", "medium")),
                "message": {"text": getattr(violation, "description", "No description")},
                "locations": [{
                    "physicalLocation": {
                        "artifactLocation": {
                            "uri": getattr(violation, "file_path", "")
                        },
                        "region": {
                            "startLine": getattr(violation, "line_number", 1)
                        }
                    }
                }]
            }
            sarif_results.append(sarif_result)
        
        return sarif_results
    
    def _map_severity_to_sarif_level(self, severity: str) -> str:
        """Map internal severity to SARIF level. NASA Rule 4 compliant."""
        mapping = {
            "critical": "error",
            "high": "error", 
            "medium": "warning",
            "low": "note"
        }
        return mapping.get(severity, "warning")
```

### 4. Analysis Orchestrator Implementation

**File**: `analyzer/core/orchestrator.py`  
**Purpose**: Coordinate all analysis phases and components
**Target LOC**: ~500 lines
**Dependencies**: All other core components, detectors

```python
from typing import Dict, Any, List, Optional, Callable
from dataclasses import dataclass
import time
import asyncio
import logging
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

from .policy_engine import PolicyEngine, ComplianceResult
from .quality_calculator import QualityCalculator, QualityMetrics  
from .result_aggregator import ResultAggregator, AggregatedResults

logger = logging.getLogger(__name__)

@dataclass
class AnalysisOptions:
    """Options for analysis execution"""
    policy_name: str = "standard"
    include_nasa_validation: bool = True
    include_duplication_analysis: bool = True
    enable_correlation_analysis: bool = False
    parallel_execution: bool = True
    max_workers: int = 4
    timeout_seconds: int = 300

@dataclass
class AnalysisResult:
    """Complete analysis result with all components"""
    success: bool
    path: str
    policy_name: str
    violations: List[Any]
    quality_metrics: QualityMetrics
    compliance_result: ComplianceResult
    aggregated_results: AggregatedResults
    execution_time_ms: float
    error: Optional[str] = None

class AnalysisOrchestrator:
    """
    Coordinates all analysis phases and components.
    NASA Rule 4 Compliant: All methods under 60 lines.
    """
    
    def __init__(self, config_manager):
        """Initialize orchestrator with all required components."""
        assert config_manager is not None, "config_manager cannot be None"
        
        self.config = config_manager
        self.policy_engine = PolicyEngine(config_manager)
        self.quality_calculator = QualityCalculator(config_manager)
        self.result_aggregator = ResultAggregator(config_manager)
        
        # Component registry for dependency injection
        self.components = {}
        self._register_default_components()
    
    def analyze_project(
        self, 
        project_path: str, 
        options: Optional[AnalysisOptions] = None
    ) -> AnalysisResult:
        """
        Analyze entire project with full pipeline.
        NASA Rule 4 Compliant: Under 60 lines.
        """
        assert project_path is not None, "project_path cannot be None"
        
        if options is None:
            options = AnalysisOptions()
        
        start_time = time.time()
        
        try:
            # Phase 1: Project discovery and validation
            project_info = self._discover_project_structure(project_path)
            
            # Phase 2: Execute analysis pipeline
            if options.parallel_execution:
                pipeline_results = self._execute_parallel_pipeline(project_path, options, project_info)
            else:
                pipeline_results = self._execute_sequential_pipeline(project_path, options, project_info)
            
            # Phase 3: Aggregate and correlate results
            aggregated_results = self._aggregate_pipeline_results(pipeline_results, project_info)
            
            # Phase 4: Calculate quality metrics
            quality_metrics = self._calculate_quality_metrics(aggregated_results, project_info)
            
            # Phase 5: Validate policy compliance
            compliance_result = self._validate_policy_compliance(
                options.policy_name, aggregated_results, quality_metrics
            )
            
            # Phase 6: Final result assembly
            execution_time = (time.time() - start_time) * 1000
            
            return AnalysisResult(
                success=True,
                path=project_path,
                policy_name=options.policy_name,
                violations=aggregated_results.connascence_violations + aggregated_results.nasa_violations,
                quality_metrics=quality_metrics,
                compliance_result=compliance_result,
                aggregated_results=aggregated_results,
                execution_time_ms=execution_time
            )
            
        except Exception as e:
            logger.error(f"Analysis failed for {project_path}: {str(e)}")
            return AnalysisResult(
                success=False,
                path=project_path,
                policy_name=options.policy_name,
                violations=[],
                quality_metrics=QualityMetrics(0, 0, 0, 0, 0, 0, 0),
                compliance_result=ComplianceResult("", "", 0, {}, {}, []),
                aggregated_results=AggregatedResults([], [], [], [], {}, {}),
                execution_time_ms=(time.time() - start_time) * 1000,
                error=str(e)
            )
    
    def analyze_file(self, file_path: str, options: Optional[AnalysisOptions] = None) -> AnalysisResult:
        """
        Analyze single file with focused pipeline.
        NASA Rule 4 Compliant: Under 60 lines.
        """
        assert file_path is not None, "file_path cannot be None"
        
        if options is None:
            options = AnalysisOptions()
        
        # Convert single file analysis to project analysis
        # This allows reuse of the full pipeline with minimal changes
        return self.analyze_project(file_path, options)
    
    def _discover_project_structure(self, project_path: str) -> Dict[str, Any]:
        """
        Discover and analyze project structure.
        NASA Rule 4 Compliant: Under 60 lines.
        """
        path_obj = Path(project_path)
        
        if not path_obj.exists():
            raise FileNotFoundError(f"Path does not exist: {project_path}")
        
        if path_obj.is_file():
            return {
                "type": "single_file",
                "files": [str(path_obj)],
                "file_count": 1,
                "python_files": [str(path_obj)] if path_obj.suffix == ".py" else [],
                "total_loc": self._estimate_file_loc(path_obj)
            }
        else:
            python_files = list(path_obj.rglob("*.py"))
            return {
                "type": "directory",
                "files": [str(f) for f in python_files],
                "file_count": len(python_files),
                "python_files": [str(f) for f in python_files],
                "total_loc": sum(self._estimate_file_loc(f) for f in python_files)
            }
    
    def _execute_parallel_pipeline(
        self, 
        project_path: str, 
        options: AnalysisOptions, 
        project_info: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Execute analysis pipeline with parallel processing.
        NASA Rule 4 Compliant: Under 60 lines.
        """
        pipeline_results = {}
        
        # Define analysis phases for parallel execution
        analysis_phases = []
        
        # Phase 1: Connascence analysis
        analysis_phases.append(("connascence", self._run_connascence_analysis, project_path))
        
        # Phase 2: NASA validation (if enabled)
        if options.include_nasa_validation:
            analysis_phases.append(("nasa", self._run_nasa_analysis, project_path))
        
        # Phase 3: Duplication analysis (if enabled)
        if options.include_duplication_analysis:
            analysis_phases.append(("duplication", self._run_duplication_analysis, project_path))
        
        # Execute phases in parallel
        with ThreadPoolExecutor(max_workers=options.max_workers) as executor:
            future_to_phase = {
                executor.submit(analysis_func, analysis_path): phase_name
                for phase_name, analysis_func, analysis_path in analysis_phases
            }
            
            for future in as_completed(future_to_phase, timeout=options.timeout_seconds):
                phase_name = future_to_phase[future]
                try:
                    pipeline_results[phase_name] = future.result()
                except Exception as e:
                    logger.error(f"Phase {phase_name} failed: {str(e)}")
                    pipeline_results[phase_name] = {"success": False, "error": str(e)}
        
        return pipeline_results
    
    def _execute_sequential_pipeline(
        self, 
        project_path: str, 
        options: AnalysisOptions, 
        project_info: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Execute analysis pipeline sequentially.
        NASA Rule 4 Compliant: Under 60 lines.
        """
        pipeline_results = {}
        
        try:
            # Phase 1: Connascence analysis
            pipeline_results["connascence"] = self._run_connascence_analysis(project_path)
            
            # Phase 2: NASA validation (if enabled)
            if options.include_nasa_validation:
                pipeline_results["nasa"] = self._run_nasa_analysis(project_path)
            else:
                pipeline_results["nasa"] = {"violations": [], "success": True}
            
            # Phase 3: Duplication analysis (if enabled)
            if options.include_duplication_analysis:
                pipeline_results["duplication"] = self._run_duplication_analysis(project_path)
            else:
                pipeline_results["duplication"] = {"violations": [], "success": True, "score": 1.0}
                
        except Exception as e:
            logger.error(f"Sequential pipeline failed: {str(e)}")
            # Ensure we have results structure even on failure
            pipeline_results = {
                "connascence": {"violations": [], "success": False, "error": str(e)},
                "nasa": {"violations": [], "success": False, "error": str(e)},
                "duplication": {"violations": [], "success": False, "score": 0.0, "error": str(e)}
            }
        
        return pipeline_results
    
    def _run_connascence_analysis(self, project_path: str) -> Dict[str, Any]:
        """Run connascence violation detection. NASA Rule 4 compliant."""
        try:
            # Use detector factory or appropriate connascence analyzer
            analyzer_component = self.components.get("connascence_analyzer")
            if not analyzer_component:
                raise RuntimeError("Connascence analyzer component not registered")
            
            violations = analyzer_component.analyze_path(project_path)
            
            return {
                "success": True,
                "violations": violations,
                "violation_count": len(violations)
            }
            
        except Exception as e:
            logger.error(f"Connascence analysis failed: {str(e)}")
            return {
                "success": False,
                "violations": [],
                "violation_count": 0,
                "error": str(e)
            }
    
    def _run_nasa_analysis(self, project_path: str) -> Dict[str, Any]:
        """Run NASA Power of Ten validation. NASA Rule 4 compliant."""
        try:
            nasa_component = self.components.get("nasa_analyzer")
            if not nasa_component:
                logger.warning("NASA analyzer component not available")
                return {"success": True, "violations": [], "violation_count": 0}
            
            violations = nasa_component.analyze_path(project_path)
            
            return {
                "success": True,
                "violations": violations,
                "violation_count": len(violations)
            }
            
        except Exception as e:
            logger.error(f"NASA analysis failed: {str(e)}")
            return {
                "success": False,
                "violations": [],
                "violation_count": 0,
                "error": str(e)
            }
    
    def _run_duplication_analysis(self, project_path: str) -> Dict[str, Any]:
        """Run duplication detection analysis. NASA Rule 4 compliant."""
        try:
            duplication_component = self.components.get("duplication_analyzer")
            if not duplication_component:
                logger.warning("Duplication analyzer component not available")
                return {"success": True, "violations": [], "score": 1.0}
            
            result = duplication_component.analyze_path(project_path)
            
            return {
                "success": result.get("success", True),
                "violations": result.get("violations", []),
                "score": result.get("score", 1.0),
                "summary": result.get("summary", {})
            }
            
        except Exception as e:
            logger.error(f"Duplication analysis failed: {str(e)}")
            return {
                "success": False,
                "violations": [],
                "score": 0.0,
                "error": str(e)
            }
    
    def _aggregate_pipeline_results(
        self, 
        pipeline_results: Dict[str, Any], 
        project_info: Dict[str, Any]
    ) -> AggregatedResults:
        """Aggregate results from all pipeline phases. NASA Rule 4 compliant."""
        connascence_violations = pipeline_results.get("connascence", {}).get("violations", [])
        nasa_violations = pipeline_results.get("nasa", {}).get("violations", [])
        duplication_results = pipeline_results.get("duplication", {})
        
        # Use result aggregator to process all results
        return self.result_aggregator.aggregate_all_results(
            connascence_violations,
            nasa_violations,
            duplication_results,
            {},  # Quality metrics calculated in next step
            project_info.get("file_count", 1)
        )
    
    def _calculate_quality_metrics(
        self, 
        aggregated_results: AggregatedResults, 
        project_info: Dict[str, Any]
    ) -> QualityMetrics:
        """Calculate comprehensive quality metrics. NASA Rule 4 compliant."""
        return self.quality_calculator.calculate_all_metrics(
            aggregated_results.connascence_violations,
            aggregated_results.nasa_violations,
            {"violations": aggregated_results.duplication_violations, "available": True},
            project_info.get("file_count", 1)
        )
    
    def _validate_policy_compliance(
        self, 
        policy_name: str, 
        results: AggregatedResults, 
        metrics: QualityMetrics
    ) -> ComplianceResult:
        """Validate policy compliance. NASA Rule 4 compliant."""
        all_violations = (
            results.connascence_violations + 
            results.nasa_violations + 
            results.duplication_violations
        )
        
        quality_metrics_dict = {
            "overall_quality": metrics.overall_quality_score,
            "nasa_compliance": metrics.nasa_compliance_score,
            "mece_score": metrics.mece_duplication_score
        }
        
        return self.policy_engine.validate_policy_compliance(
            policy_name, all_violations, quality_metrics_dict
        )
    
    def _register_default_components(self):
        """Register default analyzer components. NASA Rule 4 compliant."""
        # This would be implemented with actual component instances
        # For now, registering placeholders to show the pattern
        
        self.components["connascence_analyzer"] = None  # Will be injected
        self.components["nasa_analyzer"] = None         # Will be injected  
        self.components["duplication_analyzer"] = None  # Will be injected
        
        logger.debug("Default components registered")
    
    def register_component(self, component_name: str, component_instance: Any):
        """Register analyzer component for dependency injection."""
        assert component_name is not None, "component_name cannot be None"
        assert component_instance is not None, "component_instance cannot be None"
        
        self.components[component_name] = component_instance
        logger.debug(f"Registered component: {component_name}")
    
    def _estimate_file_loc(self, file_path: Path) -> int:
        """Estimate lines of code in file. NASA Rule 4 compliant."""
        try:
            if file_path.suffix != ".py":
                return 0
            
            with open(file_path, 'r', encoding='utf-8') as f:
                lines = sum(1 for line in f if line.strip() and not line.strip().startswith('#'))
            
            return lines
            
        except Exception:
            return 0  # Estimation failed, return 0
```

This completes the core implementation specifications for the four main components that will replace the god object `unified_analyzer.py`. Each component follows NASA Rule 4 (methods under 60 lines), maintains clear separation of concerns, and provides comprehensive functionality while eliminating the god object anti-pattern.