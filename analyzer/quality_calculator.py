from src.constants.base import MAXIMUM_NESTED_DEPTH
"""

Quality metrics calculation and scoring system.
NASA Rule 4 Compliant: All methods under 60 lines.
NASA Rule MAXIMUM_NESTED_DEPTH Compliant: Comprehensive defensive assertions.
"""

import logging
logger = logging.getLogger(__name__)

@dataclass
class QualityMetrics:
    """Comprehensive quality metrics result."""
    overall_quality: float  # 0.0-1.0
    architecture_health: float  # 0.0-1.0
    coupling_score: float  # 0.0-1.0 (lower is better)
    maintainability_index: float  # 0.0-100.0
    technical_debt_ratio: float  # 0.0-1.0
    component_scores: Dict[str, float]
    recommendations: List[str]

@dataclass
class ArchitecturalMetrics:
    """Architectural health metrics."""
    coupling_score: float
    cohesion_score: float
    complexity_score: float
    modularity_score: float
    hotspot_count: int
    god_object_count: int

class QualityCalculator:
    """
    Quality metrics calculation and scoring system.
    Extracted from UnifiedConnascenceAnalyzer to eliminate god object.
    """

    def __init__(self, config_manager=None):
        """Initialize quality calculator with configuration."""
        # NASA Rule 5: Input validation assertions
        assert config_manager is not None, "config_manager cannot be None"
        
        self.config = config_manager
        self.violation_weights = self._initialize_violation_weights()
        self.quality_thresholds = self._initialize_quality_thresholds()

    def calculate_overall_quality(self, analysis_results: Dict) -> float:
        """
        Calculate overall quality score from analysis results.
        NASA Rule 4 Compliant: Under 60 lines.
        """
        # NASA Rule 5: Input validation
        assert isinstance(analysis_results, dict), "analysis_results must be a dict"
        assert 'violations' in analysis_results, "Must contain 'violations' key"

        violations = analysis_results['violations']
        total_files = analysis_results.get('total_files', 1)

        # Calculate weighted violation penalty
        violation_penalty = self._calculate_violation_penalty(violations)
        
        # Calculate distribution penalty (concentration of issues)
        distribution_penalty = self._calculate_distribution_penalty(violations, total_files)
        
        # Calculate complexity penalty
        complexity_penalty = self._calculate_complexity_penalty(analysis_results)
        
        # Combine penalties using weighted average
        total_penalty = (
            violation_penalty * 0.5 +
            distribution_penalty * 0.3 +
            complexity_penalty * 0.2
        )

        # Overall quality score (higher is better)
        quality_score = max(0.0, 1.0 - total_penalty)
        
        logger.info(f"Overall Quality: {quality_score:.3f} (penalty: {total_penalty:.3f})")
        return quality_score

    def calculate_architecture_health(self, violations: List[Dict]) -> float:
        """
        Calculate architecture health score.
        NASA Rule 4 Compliant: Under 60 lines.
        """
        # NASA Rule 5: Input validation
        assert isinstance(violations, list), "violations must be a list"
        assert len(violations) < 50000, "Excessive violations indicate analysis error"

        if not violations:
            return 1.0  # Perfect health with no violations

        # Calculate architectural violation impact
        arch_violations = self._filter_architectural_violations(violations)
        arch_penalty = self._calculate_architectural_penalty(arch_violations)

        # Calculate structural quality indicators
        coupling_penalty = self._calculate_coupling_penalty(violations)
        cohesion_penalty = self._calculate_cohesion_penalty(violations)
        modularity_penalty = self._calculate_modularity_penalty(violations)

        # Combine architectural health factors
        total_penalty = (
            arch_penalty * 0.4 +
            coupling_penalty * 0.3 +
            cohesion_penalty * 0.2 +
            modularity_penalty * 0.1
        )

        architecture_health = max(0.0, 1.0 - total_penalty)
        
        logger.info(f"Architecture Health: {architecture_health:.3f}")
        return architecture_health

    def calculate_coupling_score(self, violations: List[Dict]) -> float:
        """
        Calculate coupling score (lower is better).
        NASA Rule 4 Compliant: Under 60 lines.
        """
        # NASA Rule 5: Input validation
        assert isinstance(violations, list), "violations must be a list"

        coupling_violations = [
            v for v in violations 
            if v.get('type') in ['connascence_of_position', 'connascence_of_algorithm', 
                                'connascence_of_type', 'god_object']
        ]

        if not coupling_violations:
            return 0.0  # Perfect coupling (no coupling issues)

        # Calculate coupling density
        total_components = self._estimate_total_components(violations)
        coupling_density = len(coupling_violations) / max(total_components, 1)

        # Calculate severity-weighted coupling impact
        severity_impact = sum(
            self.violation_weights.get(v.get('severity', 'medium'), 2)
            for v in coupling_violations
        ) / len(coupling_violations)

        # Normalize severity impact (0.0-1.0)
        severity_factor = min(1.0, severity_impact / 10.0)  # Max weight is 10

        # Combine density and severity (higher is worse coupling)
        coupling_score = min(1.0, coupling_density + severity_factor * 0.3)
        
        logger.info(f"Coupling Score: {coupling_score:.3f} (lower is better)")
        return coupling_score

    def calculate_maintainability_index(self, analysis_results: Dict) -> float:
        """
        Calculate maintainability index (0-100 scale).
        NASA Rule 4 Compliant: Under 60 lines.
        """
        # NASA Rule 5: Input validation
        assert isinstance(analysis_results, dict), "analysis_results must be a dict"

        # Base maintainability factors
        overall_quality = self.calculate_overall_quality(analysis_results)
        arch_health = self.calculate_architecture_health(analysis_results.get('violations', []))
        coupling_score = self.calculate_coupling_score(analysis_results.get('violations', []))

        # Calculate complexity factor from violations
        complexity_factor = self._calculate_complexity_factor(analysis_results)
        
        # Calculate documentation factor (estimated)
        doc_factor = self._estimate_documentation_factor(analysis_results)

        # Maintainability index calculation (Microsoft-style formula adapted)
        base_score = (
            overall_quality * 40 +       # Overall quality impact
            arch_health * 30 +           # Architecture health impact  
            (1.0 - coupling_score) * 20 + # Coupling impact (inverted)
            complexity_factor * 10        # Complexity impact
        )

        maintainability_index = min(100.0, max(0.0, base_score))
        
        logger.info(f"Maintainability Index: {maintainability_index:.1f}/100")
        return maintainability_index

    def calculate_comprehensive_metrics(self, analysis_results: Dict) -> QualityMetrics:
        """
        Calculate comprehensive quality metrics.
        NASA Rule 4 Compliant: Under 60 lines.
        """
        # NASA Rule 5: Input validation
        assert isinstance(analysis_results, dict), "analysis_results must be a dict"

        violations = analysis_results.get('violations', [])

        # Calculate core metrics
        overall_quality = self.calculate_overall_quality(analysis_results)
        architecture_health = self.calculate_architecture_health(violations)
        coupling_score = self.calculate_coupling_score(violations)
        maintainability_index = self.calculate_maintainability_index(analysis_results)
        
        # Calculate technical debt ratio
        technical_debt_ratio = self._calculate_technical_debt_ratio(violations)

        # Calculate component-specific scores
        component_scores = self._calculate_component_scores(violations)
        
        # Generate recommendations
        recommendations = self._generate_quality_recommendations(
            overall_quality, architecture_health, coupling_score, violations
        )

        return QualityMetrics(
            overall_quality=overall_quality,
            architecture_health=architecture_health,
            coupling_score=coupling_score,
            maintainability_index=maintainability_index,
            technical_debt_ratio=technical_debt_ratio,
            component_scores=component_scores,
            recommendations=recommendations
        )

    def _calculate_violation_penalty(self, violations: List[Dict]) -> float:
        """Calculate penalty based on violation severity and count."""
        if not violations:
            return 0.0

        total_penalty = 0.0
        for violation in violations:
            severity = violation.get('severity', 'medium')
            weight = self.violation_weights.get(severity, 2)
            total_penalty += weight

        # Normalize by violation count and severity scale
        avg_penalty = total_penalty / len(violations)
        normalized_penalty = min(1.0, avg_penalty / 10.0)  # Max weight is 10
        
        return normalized_penalty

    def _calculate_distribution_penalty(self, violations: List[Dict], total_files: int) -> float:
        """Calculate penalty for violation distribution across files."""
        if not violations or total_files <= 0:
            return 0.0

        # Count violations per file
        file_violation_counts = {}
        for violation in violations:
            file_path = violation.get('file_path', 'unknown')
            file_violation_counts[file_path] = file_violation_counts.get(file_path, 0) + 1

        files_with_violations = len(file_violation_counts)
        
        # Calculate concentration penalty (issues concentrated in few files)
        concentration_ratio = files_with_violations / total_files
        concentration_penalty = max(0.0, 0.5 - concentration_ratio)  # Penalty if <50% files affected

        return concentration_penalty

    def _calculate_complexity_penalty(self, analysis_results: Dict) -> float:
        """Calculate penalty based on system complexity indicators."""
        violations = analysis_results.get('violations', [])
        
        # Count complexity-related violations
        complex_violations = [
            v for v in violations
            if v.get('type') in ['god_object', 'connascence_of_algorithm', 'connascence_of_position']
        ]

        if not complex_violations:
            return 0.0

        complexity_ratio = len(complex_violations) / max(len(violations), 1)
        return min(0.3, complexity_ratio)  # Cap at 30% penalty

    def _filter_architectural_violations(self, violations: List[Dict]) -> List[Dict]:
        """Filter violations that impact architectural health."""
        architectural_types = [
            'god_object', 'connascence_of_type', 'connascence_of_algorithm',
            'connascence_of_position', 'circular_dependency'
        ]
        
        return [
            v for v in violations
            if v.get('type') in architectural_types
        ]

    def _calculate_architectural_penalty(self, arch_violations: List[Dict]) -> float:
        """Calculate penalty from architectural violations."""
        if not arch_violations:
            return 0.0

        # Weight architectural violations more heavily
        total_impact = sum(
            self.violation_weights.get(v.get('severity', 'medium'), 2) * 1.5
            for v in arch_violations
        )

        penalty = min(1.0, total_impact / (len(arch_violations) * 15))  # Normalize
        return penalty

    def _calculate_coupling_penalty(self, violations: List[Dict]) -> float:
        """Calculate coupling-specific penalty."""
        coupling_types = ['connascence_of_position', 'connascence_of_type', 'connascence_of_algorithm']
        coupling_violations = [v for v in violations if v.get('type') in coupling_types]
        
        if not coupling_violations:
            return 0.0

        return min(0.4, len(coupling_violations) / 50.0)  # 50 violations = max penalty

    def _calculate_cohesion_penalty(self, violations: List[Dict]) -> float:
        """Calculate cohesion-specific penalty."""
        cohesion_violations = [v for v in violations if v.get('type') == 'god_object']
        return min(0.3, len(cohesion_violations) / 25.0)  # 25 god objects = max penalty

    def _calculate_modularity_penalty(self, violations: List[Dict]) -> float:
        """Calculate modularity-specific penalty."""
        modularity_violations = [
            v for v in violations 
            if 'circular' in v.get('type', '') or 'dependency' in v.get('type', '')
        ]
        return min(0.2, len(modularity_violations) / 20.0)

    def _calculate_technical_debt_ratio(self, violations: List[Dict]) -> float:
        """Calculate technical debt ratio estimate."""
        if not violations:
            return 0.0

        # Estimate effort to fix violations (in person-hours)
        effort_mapping = {'critical': 8, 'high': 4, 'medium': 2, 'low': 1}
        total_effort = sum(
            effort_mapping.get(v.get('severity', 'medium'), 2)
            for v in violations
        )

        # Estimate total development effort (rough heuristic)
        total_files = len(set(v.get('file_path', '') for v in violations))
        estimated_total_effort = total_files * 40  # 40 hours per file average

        debt_ratio = min(1.0, total_effort / max(estimated_total_effort, 1))
        return debt_ratio

    def _calculate_component_scores(self, violations: List[Dict]) -> Dict[str, float]:
        """Calculate quality scores for individual components."""
        component_violations = {}
        
        # Group violations by component/file
        for violation in violations:
            component = self._extract_component_name(violation.get('file_path', ''))
            if component not in component_violations:
                component_violations[component] = []
            component_violations[component].append(violation)

        # Calculate score for each component
        component_scores = {}
        for component, comp_violations in component_violations.items():
            penalty = self._calculate_violation_penalty(comp_violations)
            score = max(0.0, 1.0 - penalty)
            component_scores[component] = score

        return component_scores

    def _generate_quality_recommendations(
        self, overall_quality: float, arch_health: float, coupling_score: float, violations: List
    ) -> List[str]:
        """Generate actionable quality improvement recommendations."""
        recommendations = []

        if overall_quality < 0.7:
            recommendations.append("Focus on reducing high-severity violations first")
        
        if arch_health < 0.75:
            god_objects = [v for v in violations if v.get('type') == 'god_object']
            if god_objects:
                recommendations.append(f"Decompose {len(god_objects)} god objects using Single Responsibility Principle")
        
        if coupling_score > 0.5:
            recommendations.append("Reduce coupling through dependency injection and interface segregation")
            
        # Specific recommendations based on violation patterns
        violation_types = [v.get('type', '') for v in violations]
        if violation_types.count('connascence_of_position') > 10:
            recommendations.append("Replace parameter lists with configuration objects or builder pattern")
            
        if violation_types.count('connascence_of_meaning') > 20:
            recommendations.append("Extract magic literals into named constants or configuration")

        return recommendations[:5]  # Top 5 recommendations

    def _initialize_violation_weights(self) -> Dict[str, int]:
        """Initialize violation severity weights."""
        return {
            'critical': 10,
            'high': 5,
            'medium': 2,
            'low': 1,
            'informational': 0
        }

    def _initialize_quality_thresholds(self) -> Dict[str, float]:
        """Initialize quality assessment thresholds."""
        return {
            'excellent': 0.9,
            'good': 0.75,
            'acceptable': 0.6,
            'poor': 0.4
        }

    def _estimate_total_components(self, violations: List[Dict]) -> int:
        """Estimate total number of components from violations."""
        unique_files = set(v.get('file_path', '') for v in violations)
        return max(len(unique_files), 10)  # Minimum baseline

    def _calculate_complexity_factor(self, analysis_results: Dict) -> float:
        """Calculate complexity factor for maintainability index."""
        violations = analysis_results.get('violations', [])
        complex_violations = [
            v for v in violations
            if v.get('type') in ['god_object', 'connascence_of_algorithm', 'high_complexity']
        ]
        
        if not violations:
            return 1.0
            
        complexity_ratio = 1.0 - (len(complex_violations) / len(violations))
        return max(0.0, complexity_ratio)

    def _estimate_documentation_factor(self, analysis_results: Dict) -> float:
        """Estimate documentation quality factor."""
        # Placeholder - could be enhanced with actual documentation analysis
        return 0.7  # Assume moderate documentation

    def _extract_component_name(self, file_path: str) -> str:
        """Extract component name from file path."""
        if not file_path:
            return 'unknown'
            
        # Extract meaningful component name from path
        parts = file_path.replace('\\', '/').split('/')
        if len(parts) > 1:
            return f"{parts[-2]}/{parts[-1]}"  # directory/file
        return parts[-1]  # just filename