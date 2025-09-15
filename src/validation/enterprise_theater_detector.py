"""
Enterprise Theater Detection System
Advanced pattern detection for performance theater with ML-based validation.
"""

import ast
import json
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional, Any
from dataclasses import dataclass
from sklearn.ensemble import IsolationForest, RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import classification_report
import logging

@dataclass
class TheaterPattern:
    """Represents a detected theater pattern."""
    pattern_type: str
    severity: float  # 0.0 to 1.0
    confidence: float  # 0.0 to 1.0
    evidence: List[str]
    location: str
    timestamp: datetime
    metadata: Dict[str, Any]

@dataclass
class QualityMetrics:
    """Quality improvement metrics."""
    cyclomatic_complexity: float
    code_coverage: float
    test_count: int
    performance_score: float
    security_score: float
    maintainability_index: float
    technical_debt_ratio: float

class EnterpriseTheaterDetector:
    """
    Advanced theater detection for enterprise modules.
    Validates genuine quality improvements vs performance theater.
    """

    def __init__(self, config: Optional[Dict] = None):
        self.config = config or self._get_default_config()
        self.logger = self._setup_logging()
        self.ml_models = self._initialize_ml_models()
        self.pattern_history = []
        self.baseline_metrics = {}

    def _get_default_config(self) -> Dict:
        """Default configuration for theater detection."""
        return {
            'sensitivity_threshold': 0.75,
            'evidence_requirement': 3,
            'historical_window_days': 30,
            'ml_confidence_threshold': 0.8,
            'theater_patterns': {
                'superficial_refactoring': {
                    'weight': 0.9,
                    'indicators': [
                        'variable_renaming_only',
                        'comment_additions_only',
                        'whitespace_changes_only',
                        'import_reordering_only'
                    ]
                },
                'metric_gaming': {
                    'weight': 0.95,
                    'indicators': [
                        'coverage_inflation',
                        'test_count_padding',
                        'complexity_hiding',
                        'dead_code_removal_only'
                    ]
                },
                'documentation_theater': {
                    'weight': 0.7,
                    'indicators': [
                        'docstring_additions_only',
                        'readme_updates_only',
                        'comment_inflation',
                        'type_hint_additions_only'
                    ]
                },
                'performance_theater': {
                    'weight': 1.0,
                    'indicators': [
                        'micro_optimizations_only',
                        'premature_optimization',
                        'benchmark_gaming',
                        'cache_over_engineering'
                    ]
                }
            }
        }

    def _setup_logging(self) -> logging.Logger:
        """Setup logging for theater detection."""
        logger = logging.getLogger('EnterpriseTheaterDetector')
        logger.setLevel(logging.INFO)

        if not logger.handlers:
            handler = logging.StreamHandler()
            formatter = logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
            )
            handler.setFormatter(formatter)
            logger.addHandler(handler)

        return logger

    def _initialize_ml_models(self) -> Dict:
        """Initialize machine learning models for theater detection."""
        return {
            'anomaly_detector': IsolationForest(
                contamination=0.1,
                random_state=42
            ),
            'pattern_classifier': RandomForestClassifier(
                n_estimators=100,
                random_state=42
            ),
            'scaler': StandardScaler()
        }

    def analyze_change_set(self,
                          before_metrics: QualityMetrics,
                          after_metrics: QualityMetrics,
                          code_changes: List[Dict],
                          module_name: str) -> List[TheaterPattern]:
        """
        Analyze a change set for theater patterns.

        Args:
            before_metrics: Quality metrics before changes
            after_metrics: Quality metrics after changes
            code_changes: List of code changes with diff information
            module_name: Name of the module being analyzed

        Returns:
            List of detected theater patterns
        """
        patterns = []

        # 1. Analyze metric improvements
        metric_patterns = self._analyze_metric_improvements(
            before_metrics, after_metrics, module_name
        )
        patterns.extend(metric_patterns)

        # 2. Analyze code changes
        change_patterns = self._analyze_code_changes(code_changes, module_name)
        patterns.extend(change_patterns)

        # 3. Cross-correlation analysis
        correlation_patterns = self._analyze_cross_correlations(
            metric_patterns, change_patterns, module_name
        )
        patterns.extend(correlation_patterns)

        # 4. ML-based validation
        ml_patterns = self._ml_validate_patterns(patterns, module_name)
        patterns.extend(ml_patterns)

        # 5. Filter and rank patterns
        filtered_patterns = self._filter_and_rank_patterns(patterns)

        # Store for historical analysis
        self.pattern_history.extend(filtered_patterns)

        return filtered_patterns

    def _analyze_metric_improvements(self,
                                   before: QualityMetrics,
                                   after: QualityMetrics,
                                   module_name: str) -> List[TheaterPattern]:
        """Analyze quality metric improvements for theater patterns."""
        patterns = []

        # Calculate improvement ratios
        improvements = {
            'complexity': (before.cyclomatic_complexity - after.cyclomatic_complexity) / before.cyclomatic_complexity if before.cyclomatic_complexity > 0 else 0,
            'coverage': (after.code_coverage - before.code_coverage) / before.code_coverage if before.code_coverage > 0 else 0,
            'performance': (after.performance_score - before.performance_score) / before.performance_score if before.performance_score > 0 else 0,
            'maintainability': (after.maintainability_index - before.maintainability_index) / before.maintainability_index if before.maintainability_index > 0 else 0,
            'debt_reduction': (before.technical_debt_ratio - after.technical_debt_ratio) / before.technical_debt_ratio if before.technical_debt_ratio > 0 else 0
        }

        # Detect suspicious metric patterns

        # 1. Coverage inflation without meaningful test additions
        if improvements['coverage'] > 0.2 and (after.test_count - before.test_count) < 2:
            patterns.append(TheaterPattern(
                pattern_type='metric_gaming',
                severity=0.8,
                confidence=0.9,
                evidence=[
                    f"Coverage increased by {improvements['coverage']:.1%}",
                    f"Test count only increased by {after.test_count - before.test_count}",
                    "Possible coverage inflation through trivial tests"
                ],
                location=module_name,
                timestamp=datetime.now(),
                metadata={'improvement_ratio': improvements['coverage']}
            ))

        # 2. Complexity reduction without structural changes
        if improvements['complexity'] > 0.3:
            patterns.append(TheaterPattern(
                pattern_type='superficial_refactoring',
                severity=0.7,
                confidence=0.8,
                evidence=[
                    f"Complexity reduced by {improvements['complexity']:.1%}",
                    "Requires validation of structural changes"
                ],
                location=module_name,
                timestamp=datetime.now(),
                metadata={'complexity_reduction': improvements['complexity']}
            ))

        # 3. Performance improvements without algorithmic changes
        if improvements['performance'] > 0.5:
            patterns.append(TheaterPattern(
                pattern_type='performance_theater',
                severity=0.9,
                confidence=0.7,
                evidence=[
                    f"Performance improved by {improvements['performance']:.1%}",
                    "Requires validation of algorithmic changes"
                ],
                location=module_name,
                timestamp=datetime.now(),
                metadata={'performance_improvement': improvements['performance']}
            ))

        return patterns

    def _analyze_code_changes(self,
                            code_changes: List[Dict],
                            module_name: str) -> List[TheaterPattern]:
        """Analyze code changes for theater indicators."""
        patterns = []

        total_changes = len(code_changes)
        if total_changes == 0:
            return patterns

        # Categorize changes
        change_categories = {
            'renaming': 0,
            'comments': 0,
            'whitespace': 0,
            'imports': 0,
            'docstrings': 0,
            'type_hints': 0,
            'structural': 0,
            'algorithmic': 0
        }

        for change in code_changes:
            change_type = self._categorize_change(change)
            if change_type in change_categories:
                change_categories[change_type] += 1

        # Calculate ratios
        superficial_ratio = (
            change_categories['renaming'] +
            change_categories['comments'] +
            change_categories['whitespace'] +
            change_categories['imports']
        ) / total_changes

        documentation_ratio = (
            change_categories['docstrings'] +
            change_categories['type_hints']
        ) / total_changes

        meaningful_ratio = (
            change_categories['structural'] +
            change_categories['algorithmic']
        ) / total_changes

        # Detect theater patterns

        # 1. Superficial refactoring
        if superficial_ratio > 0.7:
            patterns.append(TheaterPattern(
                pattern_type='superficial_refactoring',
                severity=0.8,
                confidence=0.9,
                evidence=[
                    f"{superficial_ratio:.1%} of changes are superficial",
                    f"Only {meaningful_ratio:.1%} are structural/algorithmic",
                    f"Total changes: {total_changes}"
                ],
                location=module_name,
                timestamp=datetime.now(),
                metadata={
                    'superficial_ratio': superficial_ratio,
                    'change_breakdown': change_categories
                }
            ))

        # 2. Documentation theater
        if documentation_ratio > 0.8 and meaningful_ratio < 0.1:
            patterns.append(TheaterPattern(
                pattern_type='documentation_theater',
                severity=0.6,
                confidence=0.8,
                evidence=[
                    f"{documentation_ratio:.1%} of changes are documentation",
                    f"Only {meaningful_ratio:.1%} are meaningful code changes",
                    "High documentation-to-code ratio"
                ],
                location=module_name,
                timestamp=datetime.now(),
                metadata={
                    'documentation_ratio': documentation_ratio,
                    'change_breakdown': change_categories
                }
            ))

        return patterns

    def _categorize_change(self, change: Dict) -> str:
        """Categorize a code change."""
        diff_text = change.get('diff', '').lower()

        # Simple heuristics for change categorization
        if any(keyword in diff_text for keyword in ['import ', 'from ']):
            return 'imports'
        elif any(keyword in diff_text for keyword in ['"""', "'''"]):
            return 'docstrings'
        elif any(keyword in diff_text for keyword in [': str', ': int', ': list', ': dict']):
            return 'type_hints'
        elif any(keyword in diff_text for keyword in ['# ', '##']):
            return 'comments'
        elif len(diff_text.strip()) == 0 or diff_text.isspace():
            return 'whitespace'
        elif any(keyword in diff_text for keyword in ['def ', 'class ', 'if ', 'for ', 'while ']):
            return 'structural'
        elif any(keyword in diff_text for keyword in ['algorithm', 'optimize', 'performance']):
            return 'algorithmic'
        else:
            # Check for variable renaming
            if '-' in diff_text and '+' in diff_text:
                return 'renaming'
            return 'structural'

    def _analyze_cross_correlations(self,
                                  metric_patterns: List[TheaterPattern],
                                  change_patterns: List[TheaterPattern],
                                  module_name: str) -> List[TheaterPattern]:
        """Analyze cross-correlations between metrics and changes."""
        patterns = []

        # Check for mismatched improvements
        has_metric_improvement = any(
            p.pattern_type == 'metric_gaming' for p in metric_patterns
        )
        has_superficial_changes = any(
            p.pattern_type == 'superficial_refactoring' for p in change_patterns
        )

        if has_metric_improvement and has_superficial_changes:
            patterns.append(TheaterPattern(
                pattern_type='correlation_mismatch',
                severity=0.95,
                confidence=0.9,
                evidence=[
                    "Significant metric improvements detected",
                    "But changes are predominantly superficial",
                    "High likelihood of performance theater"
                ],
                location=module_name,
                timestamp=datetime.now(),
                metadata={
                    'metric_patterns': len(metric_patterns),
                    'change_patterns': len(change_patterns)
                }
            ))

        return patterns

    def _ml_validate_patterns(self,
                            patterns: List[TheaterPattern],
                            module_name: str) -> List[TheaterPattern]:
        """Use ML models to validate theater patterns."""
        if not patterns:
            return []

        # Extract features for ML analysis
        features = []
        for pattern in patterns:
            feature_vector = [
                pattern.severity,
                pattern.confidence,
                len(pattern.evidence),
                hash(pattern.pattern_type) % 1000 / 1000,  # Normalize hash
                len(pattern.metadata)
            ]
            features.append(feature_vector)

        if len(features) < 2:
            return []

        try:
            # Anomaly detection
            features_scaled = self.ml_models['scaler'].fit_transform(features)
            anomaly_scores = self.ml_models['anomaly_detector'].fit_predict(features_scaled)

            ml_patterns = []
            for i, score in enumerate(anomaly_scores):
                if score == -1:  # Anomaly detected
                    ml_patterns.append(TheaterPattern(
                        pattern_type='ml_anomaly',
                        severity=0.8,
                        confidence=0.85,
                        evidence=[
                            "ML anomaly detection flagged unusual pattern",
                            f"Original pattern: {patterns[i].pattern_type}",
                            "Requires manual review"
                        ],
                        location=module_name,
                        timestamp=datetime.now(),
                        metadata={
                            'original_pattern': patterns[i].pattern_type,
                            'anomaly_score': float(score)
                        }
                    ))

            return ml_patterns

        except Exception as e:
            self.logger.warning(f"ML validation failed: {e}")
            return []

    def _filter_and_rank_patterns(self, patterns: List[TheaterPattern]) -> List[TheaterPattern]:
        """Filter and rank patterns by severity and confidence."""
        # Filter by confidence threshold
        filtered = [
            p for p in patterns
            if p.confidence >= self.config['ml_confidence_threshold']
        ]

        # Sort by combined severity and confidence score
        filtered.sort(
            key=lambda p: p.severity * p.confidence,
            reverse=True
        )

        return filtered

    def generate_theater_report(self, patterns: List[TheaterPattern]) -> Dict:
        """Generate comprehensive theater detection report."""
        if not patterns:
            return {
                'status': 'CLEAN',
                'theater_detected': False,
                'confidence': 1.0,
                'summary': 'No theater patterns detected',
                'patterns': []
            }

        # Calculate overall theater score
        total_score = sum(p.severity * p.confidence for p in patterns)
        avg_confidence = sum(p.confidence for p in patterns) / len(patterns)

        # Determine status
        if total_score > 2.0:
            status = 'HIGH_THEATER_RISK'
        elif total_score > 1.0:
            status = 'MODERATE_THEATER_RISK'
        else:
            status = 'LOW_THEATER_RISK'

        # Group patterns by type
        pattern_summary = {}
        for pattern in patterns:
            if pattern.pattern_type not in pattern_summary:
                pattern_summary[pattern.pattern_type] = []
            pattern_summary[pattern.pattern_type].append({
                'severity': pattern.severity,
                'confidence': pattern.confidence,
                'evidence': pattern.evidence,
                'location': pattern.location
            })

        return {
            'status': status,
            'theater_detected': total_score > 0.5,
            'overall_score': total_score,
            'confidence': avg_confidence,
            'pattern_count': len(patterns),
            'summary': f"Detected {len(patterns)} theater patterns with score {total_score:.2f}",
            'patterns': pattern_summary,
            'recommendations': self._generate_recommendations(patterns),
            'timestamp': datetime.now().isoformat()
        }

    def _generate_recommendations(self, patterns: List[TheaterPattern]) -> List[str]:
        """Generate recommendations based on detected patterns."""
        recommendations = []

        pattern_types = set(p.pattern_type for p in patterns)

        if 'superficial_refactoring' in pattern_types:
            recommendations.append(
                "Focus on structural improvements rather than cosmetic changes"
            )

        if 'metric_gaming' in pattern_types:
            recommendations.append(
                "Add meaningful tests that validate actual functionality"
            )

        if 'performance_theater' in pattern_types:
            recommendations.append(
                "Implement algorithmic improvements instead of micro-optimizations"
            )

        if 'documentation_theater' in pattern_types:
            recommendations.append(
                "Balance documentation with actual code improvements"
            )

        if 'correlation_mismatch' in pattern_types:
            recommendations.append(
                "Ensure metric improvements align with actual code changes"
            )

        return recommendations

    def cross_module_analysis(self, module_reports: List[Dict]) -> Dict:
        """Perform cross-module theater correlation analysis."""
        if not module_reports:
            return {'status': 'NO_DATA', 'correlations': []}

        # Analyze patterns across modules
        all_patterns = []
        for report in module_reports:
            for pattern_type, pattern_list in report.get('patterns', {}).items():
                for pattern in pattern_list:
                    all_patterns.append({
                        'type': pattern_type,
                        'module': pattern['location'],
                        'severity': pattern['severity'],
                        'confidence': pattern['confidence']
                    })

        # Find correlations
        correlations = []
        pattern_by_type = {}
        for pattern in all_patterns:
            pattern_type = pattern['type']
            if pattern_type not in pattern_by_type:
                pattern_by_type[pattern_type] = []
            pattern_by_type[pattern_type].append(pattern)

        # Detect systematic theater across modules
        for pattern_type, patterns in pattern_by_type.items():
            if len(patterns) >= 3:  # Pattern appears in 3+ modules
                avg_severity = sum(p['severity'] for p in patterns) / len(patterns)
                avg_confidence = sum(p['confidence'] for p in patterns) / len(patterns)

                correlations.append({
                    'pattern_type': pattern_type,
                    'affected_modules': len(patterns),
                    'avg_severity': avg_severity,
                    'avg_confidence': avg_confidence,
                    'risk_level': 'HIGH' if avg_severity > 0.7 else 'MEDIUM',
                    'modules': [p['module'] for p in patterns]
                })

        # Overall assessment
        total_risk_score = sum(c['avg_severity'] for c in correlations)

        return {
            'status': 'SYSTEMATIC_THEATER' if total_risk_score > 2.0 else 'LOCALIZED_ISSUES',
            'total_risk_score': total_risk_score,
            'correlations': correlations,
            'recommendations': self._generate_cross_module_recommendations(correlations),
            'timestamp': datetime.now().isoformat()
        }

    def _generate_cross_module_recommendations(self, correlations: List[Dict]) -> List[str]:
        """Generate recommendations for cross-module theater patterns."""
        recommendations = []

        high_risk_patterns = [c for c in correlations if c['risk_level'] == 'HIGH']

        if high_risk_patterns:
            recommendations.append(
                "Systematic theater detected across multiple modules - implement organization-wide quality standards"
            )

        pattern_counts = {}
        for correlation in correlations:
            pattern_type = correlation['pattern_type']
            pattern_counts[pattern_type] = pattern_counts.get(pattern_type, 0) + 1

        most_common = max(pattern_counts.items(), key=lambda x: x[1]) if pattern_counts else None

        if most_common and most_common[1] >= 3:
            recommendations.append(
                f"Address systematic {most_common[0]} patterns across {most_common[1]} modules"
            )

        return recommendations