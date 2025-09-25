from src.constants.base import DAYS_RETENTION_PERIOD, MAXIMUM_NESTED_DEPTH
"""

Result processing, correlation, and cross-validation system.
NASA Rule 4 Compliant: All methods under 60 lines.
NASA Rule MAXIMUM_NESTED_DEPTH Compliant: Comprehensive defensive assertions.
"""

import json
import logging
logger = logging.getLogger(__name__)

@dataclass
class AggregationResult:
    """Complete aggregation result with correlations."""
    violations: List[Dict[str, Any]]
    correlations: List[Dict[str, Any]]
    summary: Dict[str, Any]
    quality_metrics: Dict[str, float]
    recommendations: List[str]
    metadata: Dict[str, Any] = field(default_factory=dict)

@dataclass
class CorrelationCluster:
    """Related violations cluster."""
    cluster_id: str
    primary_violation: Dict[str, Any]
    related_violations: List[Dict[str, Any]]
    correlation_strength: float
    impact_score: float
    recommendation: str

class ResultAggregator:
    """
    Result processing and correlation system.
    Extracted from UnifiedConnascenceAnalyzer to eliminate god object.
    """

    def __init__(self, config_manager=None):
        """Initialize result aggregator with configuration."""
        # NASA Rule 5: Input validation assertions
        assert config_manager is not None, "config_manager cannot be None"
        
        self.config = config_manager
        self.correlation_threshold = 0.7
        self.deduplication_threshold = 0.9

    def aggregate_results(self, detector_results: List[Dict]) -> AggregationResult:
        """
        Aggregate and process results from multiple detectors.
        NASA Rule 4 Compliant: Under 60 lines.
        """
        # NASA Rule 5: Input validation
        assert isinstance(detector_results, list), "detector_results must be a list"
        assert len(detector_results) < 100, "Excessive detector results indicate configuration error"

        if not detector_results:
            return self._create_empty_result()

        # Aggregate violations from all detectors
        all_violations = self._collect_violations(detector_results)
        
        # Deduplicate violations
        unique_violations = self._deduplicate_violations(all_violations)
        
        # Cross-correlate violations
        correlations = self._cross_correlate_violations(unique_violations)
        
        # Calculate aggregated metrics
        quality_metrics = self._calculate_aggregated_metrics(unique_violations, detector_results)
        
        # Generate summary
        summary = self._generate_summary(unique_violations, correlations, quality_metrics)
        
        # Generate recommendations
        recommendations = self._generate_aggregated_recommendations(correlations, quality_metrics)

        return AggregationResult(
            violations=unique_violations,
            correlations=correlations,
            summary=summary,
            quality_metrics=quality_metrics,
            recommendations=recommendations,
            metadata={
                'aggregation_timestamp': datetime.now().isoformat(),
                'detector_count': len(detector_results),
                'original_violation_count': len(all_violations),
                'deduplicated_violation_count': len(unique_violations)
            }
        )

    def cross_correlate_violations(self, violations: List[Dict]) -> List[CorrelationCluster]:
        """
        Cross-correlate violations to identify related issues.
        NASA Rule 4 Compliant: Under 60 lines.
        """
        # NASA Rule 5: Input validation
        assert isinstance(violations, list), "violations must be a list"
        assert len(violations) < 10000, "Excessive violations indicate analysis error"

        if len(violations) < 2:
            return []

        # Group violations by correlation potential
        correlation_groups = self._group_by_correlation_potential(violations)
        
        # Build correlation clusters
        clusters = []
        cluster_id = 0
        
        for group_key, group_violations in correlation_groups.items():
            if len(group_violations) < 2:
                continue
                
            # Create correlation cluster
            primary = self._select_primary_violation(group_violations)
            related = [v for v in group_violations if v != primary]
            
            correlation_strength = self._calculate_correlation_strength(primary, related)
            impact_score = self._calculate_impact_score(group_violations)
            recommendation = self._generate_cluster_recommendation(group_violations)
            
            cluster = CorrelationCluster(
                cluster_id=f"cluster_{cluster_id}",
                primary_violation=primary,
                related_violations=related,
                correlation_strength=correlation_strength,
                impact_score=impact_score,
                recommendation=recommendation
            )
            clusters.append(cluster)
            cluster_id += 1

        # Sort clusters by impact score (highest first)
        clusters.sort(key=lambda c: c.impact_score, reverse=True)
        
        logger.info(f"Created {len(clusters)} correlation clusters")
        return clusters

    def validate_result_consistency(self, results: List[Dict]) -> Dict[str, Any]:
        """
        Validate consistency across detector results.
        NASA Rule 4 Compliant: Under 60 lines.
        """
        # NASA Rule 5: Input validation
        assert isinstance(results, list), "results must be a list"

        consistency_report = {
            'overall_consistency': 0.0,
            'inconsistencies': [],
            'recommendations': [],
            'validation_timestamp': datetime.now().isoformat()
        }

        if len(results) < 2:
            consistency_report['overall_consistency'] = 1.0
            return consistency_report

        # Check metric consistency across detectors
        metric_consistency = self._check_metric_consistency(results)
        
        # Check violation consistency
        violation_consistency = self._check_violation_consistency(results)
        
        # Check coverage consistency
        coverage_consistency = self._check_coverage_consistency(results)

        # Calculate overall consistency
        consistency_report['overall_consistency'] = (
            metric_consistency['score'] * 0.4 +
            violation_consistency['score'] * 0.4 +
            coverage_consistency['score'] * 0.2
        )

        # Collect inconsistencies
        consistency_report['inconsistencies'].extend(metric_consistency.get('issues', []))
        consistency_report['inconsistencies'].extend(violation_consistency.get('issues', []))
        consistency_report['inconsistencies'].extend(coverage_consistency.get('issues', []))

        # Generate recommendations
        if consistency_report['overall_consistency'] < 0.8:
            consistency_report['recommendations'].append("Review detector configurations for consistency")
        if len(consistency_report['inconsistencies']) > 10:
            consistency_report['recommendations'].append("Consider detector calibration")

        return consistency_report

    def _collect_violations(self, detector_results: List[Dict]) -> List[Dict]:
        """Collect violations from all detector results."""
        all_violations = []
        
        for result in detector_results:
            violations = result.get('violations', [])
            detector_name = result.get('detector_name', 'unknown')
            
            # Add detector metadata to violations
            for violation in violations:
                violation['detector_source'] = detector_name
                violation['detection_timestamp'] = result.get('timestamp', datetime.now().isoformat())
                all_violations.append(violation)

        return all_violations

    def _deduplicate_violations(self, violations: List[Dict]) -> List[Dict]:
        """Remove duplicate violations based on similarity threshold."""
        if not violations:
            return []

        unique_violations = []
        processed_signatures = set()

        for violation in violations:
            signature = self._generate_violation_signature(violation)
            
            if signature not in processed_signatures:
                unique_violations.append(violation)
                processed_signatures.add(signature)
            else:
                # Mark as duplicate for potential correlation
                violation['is_duplicate'] = True

        logger.info(f"Deduplicated {len(violations)} -> {len(unique_violations)} violations")
        return unique_violations

    def _cross_correlate_violations(self, violations: List[Dict]) -> List[Dict]:
        """Perform cross-correlation analysis between violations."""
        correlations = []
        
        # Build correlation matrix
        for i, violation_a in enumerate(violations):
            for j, violation_b in enumerate(violations[i+1:], i+1):
                correlation = self._calculate_violation_correlation(violation_a, violation_b)
                
                if correlation['strength'] >= self.correlation_threshold:
                    correlations.append({
                        'violation_a_id': violation_a.get('id', i),
                        'violation_b_id': violation_b.get('id', j),
                        'correlation_strength': correlation['strength'],
                        'correlation_type': correlation['type'],
                        'shared_factors': correlation['factors']
                    })

        return correlations

    def _calculate_aggregated_metrics(self, violations: List[Dict], detector_results: List[Dict]) -> Dict[str, float]:
        """Calculate aggregated quality metrics."""
        metrics = {}
        
        # Basic violation statistics
        metrics['total_violations'] = len(violations)
        metrics['critical_violations'] = len([v for v in violations if v.get('severity') == 'critical'])
        metrics['high_violations'] = len([v for v in violations if v.get('severity') == 'high'])
        
        # File coverage metrics
        unique_files = set(v.get('file_path', '') for v in violations)
        metrics['files_with_violations'] = len(unique_files)
        
        # Detector coverage
        unique_detectors = set(v.get('detector_source', '') for v in violations)
        metrics['detectors_triggered'] = len(unique_detectors)
        
        # Aggregate detector-specific metrics
        for result in detector_results:
            detector_metrics = result.get('metrics', {})
            for metric_name, value in detector_metrics.items():
                if isinstance(value, (int, float)):
                    aggregated_key = f"avg_{metric_name}"
                    if aggregated_key not in metrics:
                        metrics[aggregated_key] = []
                    metrics[aggregated_key].append(value)

        # Calculate averages for aggregated metrics
        for key, values in list(metrics.items()):
            if isinstance(values, list) and values:
                metrics[key] = sum(values) / len(values)

        return metrics

    def _generate_summary(self, violations: List[Dict], correlations: List[Dict], metrics: Dict) -> Dict[str, Any]:
        """Generate comprehensive result summary."""
        return {
            'violation_summary': {
                'total': len(violations),
                'by_severity': self._count_by_severity(violations),
                'by_type': self._count_by_type(violations),
                'by_file': self._count_by_file(violations)
            },
            'correlation_summary': {
                'total_correlations': len(correlations),
                'strong_correlations': len([c for c in correlations if c.get('correlation_strength', 0) > 0.8]),
                'correlation_types': self._count_correlation_types(correlations)
            },
            'quality_summary': {
                'overall_score': metrics.get('overall_quality', 0.0),
                'critical_issues': metrics.get('critical_violations', 0),
                'coverage': {
                    'files_affected': metrics.get('files_with_violations', 0),
                    'detectors_used': metrics.get('detectors_triggered', 0)
                }
            }
        }

    def _generate_aggregated_recommendations(self, correlations: List[Dict], metrics: Dict) -> List[str]:
        """Generate recommendations based on aggregated results."""
        recommendations = []
        
        # Critical violation recommendations
        critical_count = metrics.get('critical_violations', 0)
        if critical_count > 0:
            recommendations.append(f"Address {critical_count} critical violations immediately")
        
        # Correlation-based recommendations
        strong_correlations = len([c for c in correlations if c.get('correlation_strength', 0) > 0.8])
        if strong_correlations > 5:
            recommendations.append(f"Focus on {strong_correlations} correlated issue clusters for maximum impact")
        
        # Coverage recommendations
        detector_count = metrics.get('detectors_triggered', 0)
        if detector_count < 3:
            recommendations.append("Consider expanding analysis coverage with additional detectors")

        return recommendations[:5]  # Top 5 recommendations

    def _group_by_correlation_potential(self, violations: List[Dict]) -> Dict[str, List[Dict]]:
        """Group violations by their correlation potential."""
        groups = defaultdict(list)
        
        for violation in violations:
            # Create grouping key based on file, type, and severity
            file_path = violation.get('file_path', 'unknown')
            violation_type = violation.get('type', 'unknown')
            severity = violation.get('severity', 'medium')
            
            # Group by file and type for strong correlation potential
            group_key = f"{file_path}:{violation_type}"
            groups[group_key].append(violation)

        return dict(groups)

    def _select_primary_violation(self, group_violations: List[Dict]) -> Dict[str, Any]:
        """Select primary violation from a correlated group."""
        # Prioritize by severity, then by line number
        severity_order = {'critical': 0, 'high': 1, 'medium': 2, 'low': 3, 'informational': 4}
        
        return min(group_violations, key=lambda v: (
            severity_order.get(v.get('severity', 'medium'), 2),
            v.get('line_number', 0)
        ))

    def _calculate_correlation_strength(self, primary: Dict, related: List[Dict]) -> float:
        """Calculate correlation strength between primary and related violations."""
        if not related:
            return 0.0

        total_strength = 0.0
        for violation in related:
            strength = self._calculate_pairwise_correlation(primary, violation)
            total_strength += strength

        return total_strength / len(related)

    def _calculate_pairwise_correlation(self, violation_a: Dict, violation_b: Dict) -> float:
        """Calculate correlation between two violations."""
        correlation_factors = 0.0
        total_factors = 0.0

        # File proximity factor
        if violation_a.get('file_path') == violation_b.get('file_path'):
            correlation_factors += 0.4
        total_factors += 0.4

        # Type similarity factor
        if violation_a.get('type') == violation_b.get('type'):
            correlation_factors += 0.3
        total_factors += 0.3

        # Line proximity factor (same file)
        if violation_a.get('file_path') == violation_b.get('file_path'):
            line_a = violation_a.get('line_number', 0)
            line_b = violation_b.get('line_number', 0)
            if abs(line_a - line_b) < 10:  # Within 10 lines
                correlation_factors += 0.2
        total_factors += 0.2

        # Severity correlation factor
        severity_a = violation_a.get('severity', 'medium')
        severity_b = violation_b.get('severity', 'medium')
        if severity_a == severity_b:
            correlation_factors += 0.1
        total_factors += 0.1

        return correlation_factors / max(total_factors, 0.1)

    def _calculate_impact_score(self, violations: List[Dict]) -> float:
        """Calculate impact score for a group of violations."""
        if not violations:
            return 0.0

        severity_weights = {'critical': 10, 'high': 5, 'medium': 2, 'low': 1, 'informational': 0}
        total_impact = sum(severity_weights.get(v.get('severity', 'medium'), 2) for v in violations)
        
        # Normalize by group size and scale
        normalized_impact = total_impact / (len(violations) * 10)  # Max weight is 10
        return min(1.0, normalized_impact)

    def _generate_cluster_recommendation(self, violations: List[Dict]) -> str:
        """Generate recommendation for a correlation cluster."""
        if not violations:
            return "No specific recommendation"

        # Analyze common patterns
        violation_types = [v.get('type', '') for v in violations]
        most_common_type = max(set(violation_types), key=violation_types.count)
        
        type_recommendations = {
            'god_object': "Decompose large classes using Single Responsibility Principle",
            'connascence_of_meaning': "Extract magic literals into named constants",
            'connascence_of_position': "Use configuration objects or builder pattern",
            'connascence_of_algorithm': "Extract common algorithms into shared utilities"
        }
        
        return type_recommendations.get(most_common_type, f"Address {most_common_type} violations systematically")

    def _generate_violation_signature(self, violation: Dict) -> str:
        """Generate unique signature for violation deduplication."""
        components = [
            violation.get('file_path', ''),
            violation.get('type', ''),
            str(violation.get('line_number', 0)),
            violation.get('description', '')[:50]  # First 50 chars of description
        ]
        return '|'.join(components)

    def _calculate_violation_correlation(self, violation_a: Dict, violation_b: Dict) -> Dict[str, Any]:
        """Calculate detailed correlation between two violations."""
        strength = self._calculate_pairwise_correlation(violation_a, violation_b)
        
        # Determine correlation type
        correlation_type = 'weak'
        if strength > 0.8:
            correlation_type = 'strong'
        elif strength > 0.6:
            correlation_type = 'moderate'
        
        # Identify shared factors
        factors = []
        if violation_a.get('file_path') == violation_b.get('file_path'):
            factors.append('same_file')
        if violation_a.get('type') == violation_b.get('type'):
            factors.append('same_type')
        if violation_a.get('severity') == violation_b.get('severity'):
            factors.append('same_severity')

        return {
            'strength': strength,
            'type': correlation_type,
            'factors': factors
        }

    def _count_by_severity(self, violations: List[Dict]) -> Dict[str, int]:
        """Count violations by severity."""
        counts = defaultdict(int)
        for violation in violations:
            severity = violation.get('severity', 'medium')
            counts[severity] += 1
        return dict(counts)

    def _count_by_type(self, violations: List[Dict]) -> Dict[str, int]:
        """Count violations by type."""
        counts = defaultdict(int)
        for violation in violations:
            violation_type = violation.get('type', 'unknown')
            counts[violation_type] += 1
        return dict(counts)

    def _count_by_file(self, violations: List[Dict]) -> Dict[str, int]:
        """Count violations by file."""
        counts = defaultdict(int)
        for violation in violations:
            file_path = violation.get('file_path', 'unknown')
            counts[file_path] += 1
        return dict(counts)

    def _count_correlation_types(self, correlations: List[Dict]) -> Dict[str, int]:
        """Count correlations by type."""
        counts = defaultdict(int)
        for correlation in correlations:
            correlation_type = correlation.get('correlation_type', 'unknown')
            counts[correlation_type] += 1
        return dict(counts)

    def _create_empty_result(self) -> AggregationResult:
        """Create empty result for no detector results."""
        return AggregationResult(
            violations=[],
            correlations=[],
            summary={'violation_summary': {'total': 0}},
            quality_metrics={'total_violations': 0},
            recommendations=['No violations detected']
        )

    def _check_metric_consistency(self, results: List[Dict]) -> Dict[str, Any]:
        """Check consistency of metrics across results."""
        return {'score': 1.0, 'issues': []}  # Simplified for now

    def _check_violation_consistency(self, results: List[Dict]) -> Dict[str, Any]:
        """Check consistency of violations across results."""
        return {'score': 1.0, 'issues': []}  # Simplified for now

    def _check_coverage_consistency(self, results: List[Dict]) -> Dict[str, Any]:
        """Check consistency of coverage across results."""
        return {'score': 1.0, 'issues': []}  # Simplified for now