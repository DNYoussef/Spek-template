"""
Reality Validation Engine
Statistical analysis and automated detection of superficial changes.
"""

import ast
import json
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional, Any, Union
from dataclasses import dataclass, asdict
from scipy import stats
from sklearn.cluster import DBSCAN
from sklearn.preprocessing import StandardScaler
import logging
import hashlib
import re

@dataclass
class ValidationResult:
    """Result of reality validation check."""
    is_genuine: bool
    confidence: float  # 0.0 to 1.0
    evidence_score: float  # 0.0 to 1.0
    statistical_significance: float  # p-value
    validation_details: Dict[str, Any]
    recommendations: List[str]
    timestamp: datetime

@dataclass
class CodeMetrics:
    """Comprehensive code metrics for validation."""
    lines_of_code: int
    cyclomatic_complexity: float
    cognitive_complexity: float
    maintainability_index: float
    halstead_metrics: Dict[str, float]
    code_coverage: float
    test_coverage_quality: float
    performance_metrics: Dict[str, float]
    security_score: float
    documentation_ratio: float

class RealityValidationEngine:
    """
    Engine for validating genuine quality improvements vs superficial changes.
    Uses statistical analysis and pattern recognition.
    """

    def __init__(self, config: Optional[Dict] = None):
        self.config = config or self._get_default_config()
        self.logger = self._setup_logging()
        self.historical_data = []
        self.baseline_statistics = {}
        self.validation_cache = {}

    def _get_default_config(self) -> Dict:
        """Default configuration for reality validation."""
        return {
            'significance_threshold': 0.05,  # p-value threshold
            'minimum_effect_size': 0.2,     # Cohen's d threshold
            'evidence_weight_threshold': 0.7,
            'historical_window_days': 90,
            'validation_criteria': {
                'code_quality': {
                    'weight': 0.3,
                    'metrics': ['complexity', 'maintainability', 'coverage']
                },
                'structural_changes': {
                    'weight': 0.4,
                    'metrics': ['architecture', 'patterns', 'dependencies']
                },
                'behavioral_changes': {
                    'weight': 0.3,
                    'metrics': ['performance', 'functionality', 'reliability']
                }
            },
            'superficial_indicators': {
                'cosmetic_changes_ratio_threshold': 0.6,
                'comment_to_code_ratio_threshold': 0.8,
                'variable_rename_ratio_threshold': 0.5,
                'whitespace_change_ratio_threshold': 0.7
            }
        }

    def _setup_logging(self) -> logging.Logger:
        """Setup logging for reality validation."""
        logger = logging.getLogger('RealityValidationEngine')
        logger.setLevel(logging.INFO)

        if not logger.handlers:
            handler = logging.StreamHandler()
            formatter = logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
            )
            handler.setFormatter(formatter)
            logger.addHandler(handler)

        return logger

    def validate_completion_claim(self,
                                before_metrics: CodeMetrics,
                                after_metrics: CodeMetrics,
                                change_description: str,
                                code_changes: List[Dict],
                                claimed_improvements: List[str]) -> ValidationResult:
        """
        Validate a completion claim against actual evidence.

        Args:
            before_metrics: Metrics before changes
            after_metrics: Metrics after changes
            change_description: Description of what was changed
            code_changes: Actual code changes made
            claimed_improvements: List of claimed improvements

        Returns:
            ValidationResult with validation outcome
        """

        # 1. Statistical significance analysis
        statistical_result = self._analyze_statistical_significance(
            before_metrics, after_metrics
        )

        # 2. Evidence quality assessment
        evidence_result = self._assess_evidence_quality(
            code_changes, claimed_improvements
        )

        # 3. Change genuineness analysis
        genuineness_result = self._analyze_change_genuineness(
            before_metrics, after_metrics, code_changes
        )

        # 4. Behavioral validation
        behavioral_result = self._validate_behavioral_changes(
            before_metrics, after_metrics, change_description
        )

        # 5. Cross-validation with historical data
        historical_result = self._cross_validate_with_history(
            before_metrics, after_metrics, claimed_improvements
        )

        # Combine results
        final_result = self._combine_validation_results([
            statistical_result,
            evidence_result,
            genuineness_result,
            behavioral_result,
            historical_result
        ])

        # Cache result for future reference
        cache_key = self._generate_cache_key(before_metrics, after_metrics, code_changes)
        self.validation_cache[cache_key] = final_result

        return final_result

    def _analyze_statistical_significance(self,
                                        before: CodeMetrics,
                                        after: CodeMetrics) -> Dict[str, Any]:
        """Analyze statistical significance of metric changes."""

        # Extract metric values for comparison
        before_values = [
            before.cyclomatic_complexity,
            before.cognitive_complexity,
            before.maintainability_index,
            before.code_coverage,
            before.security_score
        ]

        after_values = [
            after.cyclomatic_complexity,
            after.cognitive_complexity,
            after.maintainability_index,
            after.code_coverage,
            after.security_score
        ]

        # Perform statistical tests
        try:
            # Paired t-test for before/after comparison
            t_stat, p_value = stats.ttest_rel(before_values, after_values)

            # Effect size (Cohen's d)
            pooled_std = np.sqrt(
                (np.var(before_values, ddof=1) + np.var(after_values, ddof=1)) / 2
            )
            cohens_d = (np.mean(after_values) - np.mean(before_values)) / pooled_std if pooled_std > 0 else 0

            # Wilcoxon signed-rank test (non-parametric)
            wilcoxon_stat, wilcoxon_p = stats.wilcoxon(before_values, after_values)

        except Exception as e:
            self.logger.warning(f"Statistical analysis failed: {e}")
            return {
                'is_significant': False,
                'p_value': 1.0,
                'effect_size': 0.0,
                'confidence': 0.0
            }

        # Determine significance
        is_significant = (
            p_value < self.config['significance_threshold'] and
            abs(cohens_d) >= self.config['minimum_effect_size']
        )

        # Calculate confidence based on multiple factors
        confidence = self._calculate_statistical_confidence(
            p_value, cohens_d, wilcoxon_p
        )

        return {
            'is_significant': is_significant,
            'p_value': p_value,
            'effect_size': cohens_d,
            'wilcoxon_p': wilcoxon_p,
            'confidence': confidence,
            'details': {
                't_statistic': t_stat,
                'before_mean': np.mean(before_values),
                'after_mean': np.mean(after_values),
                'improvement_direction': 'positive' if cohens_d > 0 else 'negative'
            }
        }

    def _assess_evidence_quality(self,
                               code_changes: List[Dict],
                               claimed_improvements: List[str]) -> Dict[str, Any]:
        """Assess the quality and relevance of evidence."""

        if not code_changes:
            return {
                'evidence_score': 0.0,
                'quality_assessment': 'no_evidence',
                'confidence': 0.0
            }

        # Categorize changes
        change_analysis = self._categorize_code_changes(code_changes)

        # Analyze claimed vs actual improvements
        claim_analysis = self._analyze_improvement_claims(
            claimed_improvements, change_analysis
        )

        # Calculate evidence quality score
        evidence_score = self._calculate_evidence_score(
            change_analysis, claim_analysis
        )

        # Determine quality assessment
        if evidence_score >= 0.8:
            quality_assessment = 'high_quality'
        elif evidence_score >= 0.6:
            quality_assessment = 'moderate_quality'
        elif evidence_score >= 0.4:
            quality_assessment = 'low_quality'
        else:
            quality_assessment = 'insufficient_evidence'

        confidence = min(evidence_score, 1.0)

        return {
            'evidence_score': evidence_score,
            'quality_assessment': quality_assessment,
            'confidence': confidence,
            'change_analysis': change_analysis,
            'claim_analysis': claim_analysis,
            'details': {
                'total_changes': len(code_changes),
                'meaningful_changes': change_analysis.get('meaningful_count', 0),
                'superficial_changes': change_analysis.get('superficial_count', 0)
            }
        }

    def _categorize_code_changes(self, code_changes: List[Dict]) -> Dict[str, Any]:
        """Categorize code changes by type and significance."""

        categories = {
            'structural': 0,      # Class/function definitions, control flow
            'algorithmic': 0,     # Logic changes, algorithm improvements
            'cosmetic': 0,        # Formatting, naming, comments
            'configuration': 0,   # Config files, settings
            'documentation': 0,   # Docs, comments, type hints
            'test': 0,           # Test code changes
            'dependency': 0,     # Import changes, requirements
            'refactoring': 0     # Code reorganization
        }

        significance_scores = []

        for change in code_changes:
            diff_content = change.get('diff', '')
            file_path = change.get('file_path', '')

            # Analyze the change
            category, significance = self._analyze_individual_change(
                diff_content, file_path
            )

            categories[category] += 1
            significance_scores.append(significance)

        total_changes = len(code_changes)
        meaningful_count = sum(1 for score in significance_scores if score > 0.5)
        superficial_count = total_changes - meaningful_count

        # Calculate ratios
        ratios = {
            f"{cat}_ratio": count / total_changes if total_changes > 0 else 0
            for cat, count in categories.items()
        }

        return {
            'categories': categories,
            'ratios': ratios,
            'meaningful_count': meaningful_count,
            'superficial_count': superficial_count,
            'avg_significance': np.mean(significance_scores) if significance_scores else 0,
            'significance_scores': significance_scores
        }

    def _analyze_individual_change(self, diff_content: str, file_path: str) -> Tuple[str, float]:
        """Analyze an individual code change."""

        diff_lower = diff_content.lower()

        # File type analysis
        if file_path.endswith(('.md', '.txt', '.rst')):
            return 'documentation', 0.2
        elif file_path.endswith(('.json', '.yaml', '.yml', '.toml', '.ini')):
            return 'configuration', 0.4
        elif 'test' in file_path or file_path.endswith('_test.py'):
            return 'test', 0.6

        # Content analysis
        structural_indicators = [
            'def ', 'class ', 'if ', 'for ', 'while ', 'try:', 'except:'
        ]
        algorithmic_indicators = [
            'algorithm', 'optimize', 'performance', 'complexity', 'efficient'
        ]
        cosmetic_indicators = [
            'rename', 'format', 'style', 'whitespace', '# '
        ]

        # Count indicators
        structural_count = sum(1 for indicator in structural_indicators if indicator in diff_lower)
        algorithmic_count = sum(1 for indicator in algorithmic_indicators if indicator in diff_lower)
        cosmetic_count = sum(1 for indicator in cosmetic_indicators if indicator in diff_lower)

        # Determine category and significance
        if algorithmic_count > 0:
            return 'algorithmic', 0.9
        elif structural_count > cosmetic_count and structural_count > 2:
            return 'structural', 0.8
        elif cosmetic_count > structural_count:
            return 'cosmetic', 0.2
        elif 'import ' in diff_lower or 'from ' in diff_lower:
            return 'dependency', 0.3
        elif '"""' in diff_content or "'''" in diff_content:
            return 'documentation', 0.3
        else:
            # Default to refactoring with moderate significance
            return 'refactoring', 0.6

    def _analyze_improvement_claims(self,
                                  claimed_improvements: List[str],
                                  change_analysis: Dict) -> Dict[str, Any]:
        """Analyze claimed improvements against actual changes."""

        if not claimed_improvements:
            return {
                'alignment_score': 0.0,
                'supported_claims': [],
                'unsupported_claims': [],
                'credibility': 'no_claims'
            }

        supported_claims = []
        unsupported_claims = []

        for claim in claimed_improvements:
            is_supported = self._validate_improvement_claim(claim, change_analysis)

            if is_supported:
                supported_claims.append(claim)
            else:
                unsupported_claims.append(claim)

        total_claims = len(claimed_improvements)
        alignment_score = len(supported_claims) / total_claims if total_claims > 0 else 0

        # Determine credibility
        if alignment_score >= 0.8:
            credibility = 'high'
        elif alignment_score >= 0.6:
            credibility = 'moderate'
        elif alignment_score >= 0.4:
            credibility = 'low'
        else:
            credibility = 'poor'

        return {
            'alignment_score': alignment_score,
            'supported_claims': supported_claims,
            'unsupported_claims': unsupported_claims,
            'credibility': credibility,
            'total_claims': total_claims
        }

    def _validate_improvement_claim(self, claim: str, change_analysis: Dict) -> bool:
        """Validate a specific improvement claim against changes."""

        claim_lower = claim.lower()
        ratios = change_analysis.get('ratios', {})

        # Performance claims
        if any(keyword in claim_lower for keyword in ['performance', 'speed', 'optimize']):
            return ratios.get('algorithmic_ratio', 0) > 0.3

        # Code quality claims
        if any(keyword in claim_lower for keyword in ['quality', 'maintainability', 'clean']):
            return ratios.get('structural_ratio', 0) > 0.4

        # Documentation claims
        if any(keyword in claim_lower for keyword in ['document', 'comment', 'clarity']):
            return ratios.get('documentation_ratio', 0) > 0.2

        # Refactoring claims
        if any(keyword in claim_lower for keyword in ['refactor', 'restructure', 'organize']):
            return ratios.get('refactoring_ratio', 0) > 0.3

        # Security claims
        if any(keyword in claim_lower for keyword in ['security', 'secure', 'vulnerability']):
            return ratios.get('structural_ratio', 0) > 0.2

        # Default: require meaningful changes
        return change_analysis.get('meaningful_count', 0) > 0

    def _analyze_change_genuineness(self,
                                  before: CodeMetrics,
                                  after: CodeMetrics,
                                  code_changes: List[Dict]) -> Dict[str, Any]:
        """Analyze the genuineness of changes."""

        # Calculate metric deltas
        metric_deltas = {
            'complexity_delta': before.cyclomatic_complexity - after.cyclomatic_complexity,
            'maintainability_delta': after.maintainability_index - before.maintainability_index,
            'coverage_delta': after.code_coverage - before.code_coverage,
            'security_delta': after.security_score - before.security_score
        }

        # Analyze change-to-improvement ratio
        change_count = len(code_changes)
        improvement_magnitude = sum(abs(delta) for delta in metric_deltas.values())

        # Red flags for superficial changes
        superficial_indicators = self._detect_superficial_indicators(
            code_changes, metric_deltas
        )

        # Calculate genuineness score
        genuineness_score = self._calculate_genuineness_score(
            metric_deltas, change_count, superficial_indicators
        )

        # Determine genuineness level
        if genuineness_score >= 0.8:
            genuineness_level = 'highly_genuine'
        elif genuineness_score >= 0.6:
            genuineness_level = 'moderately_genuine'
        elif genuineness_score >= 0.4:
            genuineness_level = 'questionable'
        else:
            genuineness_level = 'likely_superficial'

        return {
            'genuineness_score': genuineness_score,
            'genuineness_level': genuineness_level,
            'confidence': min(genuineness_score, 1.0),
            'metric_deltas': metric_deltas,
            'superficial_indicators': superficial_indicators,
            'details': {
                'change_count': change_count,
                'improvement_magnitude': improvement_magnitude,
                'change_efficiency': improvement_magnitude / change_count if change_count > 0 else 0
            }
        }

    def _detect_superficial_indicators(self,
                                     code_changes: List[Dict],
                                     metric_deltas: Dict[str, float]) -> List[str]:
        """Detect indicators of superficial changes."""

        indicators = []
        total_changes = len(code_changes)

        if total_changes == 0:
            return indicators

        # Analyze change patterns
        cosmetic_count = 0
        whitespace_count = 0
        rename_count = 0
        comment_count = 0

        for change in code_changes:
            diff_content = change.get('diff', '')

            if self._is_cosmetic_change(diff_content):
                cosmetic_count += 1
            if self._is_whitespace_change(diff_content):
                whitespace_count += 1
            if self._is_rename_change(diff_content):
                rename_count += 1
            if self._is_comment_change(diff_content):
                comment_count += 1

        # Check thresholds
        thresholds = self.config['superficial_indicators']

        if cosmetic_count / total_changes > thresholds['cosmetic_changes_ratio_threshold']:
            indicators.append('high_cosmetic_ratio')

        if whitespace_count / total_changes > thresholds['whitespace_change_ratio_threshold']:
            indicators.append('high_whitespace_ratio')

        if rename_count / total_changes > thresholds['variable_rename_ratio_threshold']:
            indicators.append('high_rename_ratio')

        if comment_count / total_changes > thresholds['comment_to_code_ratio_threshold']:
            indicators.append('high_comment_ratio')

        # Check for disproportionate improvements
        total_improvement = sum(abs(delta) for delta in metric_deltas.values())
        if total_improvement > 1.0 and total_changes < 5:
            indicators.append('disproportionate_improvement')

        return indicators

    def _is_cosmetic_change(self, diff_content: str) -> bool:
        """Check if a change is purely cosmetic."""
        lines = diff_content.split('\n')
        substantive_changes = 0

        for line in lines:
            if line.startswith(('+', '-')) and len(line.strip()) > 1:
                # Check if line contains substantive code
                if any(keyword in line for keyword in ['def ', 'class ', 'if ', 'for ', 'return']):
                    substantive_changes += 1

        return substantive_changes == 0

    def _is_whitespace_change(self, diff_content: str) -> bool:
        """Check if a change is primarily whitespace."""
        # Remove whitespace and compare
        original_lines = []
        modified_lines = []

        for line in diff_content.split('\n'):
            if line.startswith('-'):
                original_lines.append(re.sub(r'\s+', '', line[1:]))
            elif line.startswith('+'):
                modified_lines.append(re.sub(r'\s+', '', line[1:]))

        return original_lines == modified_lines

    def _is_rename_change(self, diff_content: str) -> bool:
        """Check if a change is primarily variable/function renaming."""
        # Simple heuristic: look for common rename patterns
        rename_patterns = [
            r'-\s*(\w+)\s*=',
            r'\+\s*(\w+)\s*=',
            r'-\s*def\s+(\w+)',
            r'\+\s*def\s+(\w+)',
            r'-\s*class\s+(\w+)',
            r'\+\s*class\s+(\w+)'
        ]

        old_names = set()
        new_names = set()

        for pattern in rename_patterns:
            matches = re.findall(pattern, diff_content)
            for match in matches:
                if pattern.startswith('-'):
                    old_names.add(match)
                else:
                    new_names.add(match)

        # If we have same number of old and new names, likely a rename
        return len(old_names) > 0 and len(old_names) == len(new_names)

    def _is_comment_change(self, diff_content: str) -> bool:
        """Check if a change is primarily comments."""
        comment_lines = 0
        total_lines = 0

        for line in diff_content.split('\n'):
            if line.startswith(('+', '-')):
                total_lines += 1
                if '#' in line or '"""' in line or "'''" in line:
                    comment_lines += 1

        return total_lines > 0 and comment_lines / total_lines > 0.7

    def _calculate_evidence_score(self,
                                change_analysis: Dict,
                                claim_analysis: Dict) -> float:
        """Calculate overall evidence quality score."""

        # Weight factors
        weights = {
            'meaningful_ratio': 0.4,
            'claim_alignment': 0.3,
            'significance': 0.3
        }

        # Calculate component scores
        meaningful_ratio = (
            change_analysis.get('meaningful_count', 0) /
            max(len(change_analysis.get('significance_scores', [1])), 1)
        )

        claim_alignment = claim_analysis.get('alignment_score', 0)
        significance = change_analysis.get('avg_significance', 0)

        # Weighted combination
        evidence_score = (
            weights['meaningful_ratio'] * meaningful_ratio +
            weights['claim_alignment'] * claim_alignment +
            weights['significance'] * significance
        )

        return min(evidence_score, 1.0)

    def _calculate_genuineness_score(self,
                                   metric_deltas: Dict[str, float],
                                   change_count: int,
                                   superficial_indicators: List[str]) -> float:
        """Calculate genuineness score based on multiple factors."""

        # Base score from metric improvements
        positive_deltas = sum(1 for delta in metric_deltas.values() if delta > 0)
        metric_score = positive_deltas / len(metric_deltas)

        # Efficiency score (improvement per change)
        total_improvement = sum(abs(delta) for delta in metric_deltas.values())
        efficiency_score = min(total_improvement / max(change_count, 1), 1.0)

        # Penalty for superficial indicators
        superficial_penalty = len(superficial_indicators) * 0.15

        # Combined score
        genuineness_score = (0.4 * metric_score + 0.6 * efficiency_score) - superficial_penalty

        return max(genuineness_score, 0.0)

    def _calculate_statistical_confidence(self,
                                        p_value: float,
                                        effect_size: float,
                                        wilcoxon_p: float) -> float:
        """Calculate statistical confidence score."""

        # P-value component (lower is better)
        p_component = max(0, 1 - p_value / self.config['significance_threshold'])

        # Effect size component
        effect_component = min(abs(effect_size) / self.config['minimum_effect_size'], 1.0)

        # Non-parametric confirmation
        np_component = max(0, 1 - wilcoxon_p / self.config['significance_threshold'])

        # Combined confidence
        confidence = (0.4 * p_component + 0.4 * effect_component + 0.2 * np_component)

        return min(confidence, 1.0)

    def _validate_behavioral_changes(self,
                                   before: CodeMetrics,
                                   after: CodeMetrics,
                                   change_description: str) -> Dict[str, Any]:
        """Validate behavioral changes claimed in description."""

        # Extract behavioral claims from description
        behavioral_claims = self._extract_behavioral_claims(change_description)

        # Validate against metrics
        validated_claims = []
        for claim in behavioral_claims:
            if self._validate_behavioral_claim(claim, before, after):
                validated_claims.append(claim)

        # Calculate behavioral validation score
        total_claims = len(behavioral_claims)
        validation_score = len(validated_claims) / total_claims if total_claims > 0 else 1.0

        return {
            'behavioral_score': validation_score,
            'total_claims': total_claims,
            'validated_claims': validated_claims,
            'confidence': validation_score,
            'details': {
                'performance_validated': 'performance' in validated_claims,
                'reliability_validated': 'reliability' in validated_claims,
                'maintainability_validated': 'maintainability' in validated_claims
            }
        }

    def _extract_behavioral_claims(self, description: str) -> List[str]:
        """Extract behavioral improvement claims from description."""
        claims = []
        description_lower = description.lower()

        if any(keyword in description_lower for keyword in ['performance', 'faster', 'speed']):
            claims.append('performance')

        if any(keyword in description_lower for keyword in ['reliable', 'stable', 'robust']):
            claims.append('reliability')

        if any(keyword in description_lower for keyword in ['maintainable', 'readable', 'clean']):
            claims.append('maintainability')

        if any(keyword in description_lower for keyword in ['secure', 'safety', 'vulnerability']):
            claims.append('security')

        return claims

    def _validate_behavioral_claim(self, claim: str, before: CodeMetrics, after: CodeMetrics) -> bool:
        """Validate a specific behavioral claim."""

        if claim == 'performance':
            return any(
                after.performance_metrics.get(key, 0) > before.performance_metrics.get(key, 0)
                for key in ['execution_time', 'memory_efficiency', 'cpu_usage']
            )

        elif claim == 'reliability':
            return (
                after.test_coverage_quality > before.test_coverage_quality and
                after.code_coverage > before.code_coverage
            )

        elif claim == 'maintainability':
            return (
                after.maintainability_index > before.maintainability_index and
                after.cyclomatic_complexity <= before.cyclomatic_complexity
            )

        elif claim == 'security':
            return after.security_score > before.security_score

        return False

    def _cross_validate_with_history(self,
                                    before: CodeMetrics,
                                    after: CodeMetrics,
                                    claimed_improvements: List[str]) -> Dict[str, Any]:
        """Cross-validate results with historical data."""

        if not self.historical_data:
            return {
                'historical_confidence': 0.5,
                'similar_cases': 0,
                'pattern_match': False
            }

        # Find similar historical cases
        similar_cases = self._find_similar_cases(before, after, claimed_improvements)

        if not similar_cases:
            return {
                'historical_confidence': 0.5,
                'similar_cases': 0,
                'pattern_match': False
            }

        # Analyze outcomes of similar cases
        successful_cases = sum(1 for case in similar_cases if case.get('validation_outcome', False))
        success_rate = successful_cases / len(similar_cases)

        # Pattern matching
        pattern_match = self._detect_historical_patterns(similar_cases, claimed_improvements)

        return {
            'historical_confidence': success_rate,
            'similar_cases': len(similar_cases),
            'pattern_match': pattern_match,
            'success_rate': success_rate,
            'details': {
                'successful_cases': successful_cases,
                'total_similar': len(similar_cases)
            }
        }

    def _find_similar_cases(self,
                          before: CodeMetrics,
                          after: CodeMetrics,
                          claimed_improvements: List[str]) -> List[Dict]:
        """Find similar historical validation cases."""

        similar_cases = []

        for historical_case in self.historical_data:
            similarity_score = self._calculate_case_similarity(
                before, after, claimed_improvements, historical_case
            )

            if similarity_score > 0.7:  # High similarity threshold
                similar_cases.append(historical_case)

        return similar_cases

    def _calculate_case_similarity(self,
                                 before: CodeMetrics,
                                 after: CodeMetrics,
                                 claimed_improvements: List[str],
                                 historical_case: Dict) -> float:
        """Calculate similarity between current and historical case."""

        # Metric similarity
        hist_before = historical_case.get('before_metrics', {})
        hist_after = historical_case.get('after_metrics', {})

        metric_similarity = self._calculate_metric_similarity(
            [before, after], [hist_before, hist_after]
        )

        # Claim similarity
        hist_claims = historical_case.get('claimed_improvements', [])
        claim_similarity = len(set(claimed_improvements) & set(hist_claims)) / max(
            len(set(claimed_improvements) | set(hist_claims)), 1
        )

        # Combined similarity
        return 0.6 * metric_similarity + 0.4 * claim_similarity

    def _calculate_metric_similarity(self, current_metrics: List, historical_metrics: List) -> float:
        """Calculate similarity between metric sets."""

        try:
            # Simple euclidean distance approach
            current_vector = np.array([
                current_metrics[0].cyclomatic_complexity,
                current_metrics[0].maintainability_index,
                current_metrics[1].cyclomatic_complexity,
                current_metrics[1].maintainability_index
            ])

            historical_vector = np.array([
                historical_metrics[0].get('cyclomatic_complexity', 0),
                historical_metrics[0].get('maintainability_index', 0),
                historical_metrics[1].get('cyclomatic_complexity', 0),
                historical_metrics[1].get('maintainability_index', 0)
            ])

            distance = np.linalg.norm(current_vector - historical_vector)

            # Convert distance to similarity (0-1 scale)
            max_possible_distance = np.linalg.norm(current_vector) + np.linalg.norm(historical_vector)
            similarity = 1 - (distance / max_possible_distance) if max_possible_distance > 0 else 0

            return max(similarity, 0)

        except Exception:
            return 0.5  # Default moderate similarity

    def _detect_historical_patterns(self,
                                  similar_cases: List[Dict],
                                  claimed_improvements: List[str]) -> bool:
        """Detect patterns in historical similar cases."""

        if len(similar_cases) < 3:
            return False

        # Check for consistent outcomes with similar claims
        outcomes = [case.get('validation_outcome', False) for case in similar_cases]

        # If most similar cases succeeded, pattern is positive
        success_rate = sum(outcomes) / len(outcomes)

        return success_rate > 0.7

    def _combine_validation_results(self, results: List[Dict[str, Any]]) -> ValidationResult:
        """Combine multiple validation results into final assessment."""

        # Extract key metrics from each result
        statistical_result = results[0]
        evidence_result = results[1]
        genuineness_result = results[2]
        behavioral_result = results[3]
        historical_result = results[4]

        # Calculate weighted final scores
        weights = self.config['validation_criteria']

        final_confidence = (
            weights['code_quality']['weight'] * statistical_result.get('confidence', 0) +
            weights['structural_changes']['weight'] * evidence_result.get('confidence', 0) +
            weights['behavioral_changes']['weight'] * genuineness_result.get('confidence', 0)
        )

        # Evidence score
        evidence_score = evidence_result.get('evidence_score', 0)

        # Statistical significance
        statistical_significance = statistical_result.get('p_value', 1.0)

        # Determine if validation passes
        is_genuine = (
            final_confidence >= self.config['evidence_weight_threshold'] and
            statistical_result.get('is_significant', False) and
            evidence_score >= 0.6 and
            genuineness_result.get('genuineness_score', 0) >= 0.5
        )

        # Generate recommendations
        recommendations = self._generate_validation_recommendations(results, is_genuine)

        return ValidationResult(
            is_genuine=is_genuine,
            confidence=final_confidence,
            evidence_score=evidence_score,
            statistical_significance=statistical_significance,
            validation_details={
                'statistical': statistical_result,
                'evidence': evidence_result,
                'genuineness': genuineness_result,
                'behavioral': behavioral_result,
                'historical': historical_result
            },
            recommendations=recommendations,
            timestamp=datetime.now()
        )

    def _generate_validation_recommendations(self,
                                           results: List[Dict[str, Any]],
                                           is_genuine: bool) -> List[str]:
        """Generate recommendations based on validation results."""

        recommendations = []

        if not is_genuine:
            recommendations.append("Validation failed - improvements appear superficial")

        # Statistical recommendations
        statistical_result = results[0]
        if not statistical_result.get('is_significant', False):
            recommendations.append("Increase sample size or effect size for statistical significance")

        # Evidence recommendations
        evidence_result = results[1]
        if evidence_result.get('evidence_score', 0) < 0.6:
            recommendations.append("Provide more substantial evidence of improvements")

        # Genuineness recommendations
        genuineness_result = results[2]
        superficial_indicators = genuineness_result.get('superficial_indicators', [])
        if superficial_indicators:
            recommendations.append(f"Address superficial change indicators: {', '.join(superficial_indicators)}")

        # Behavioral recommendations
        behavioral_result = results[3]
        if behavioral_result.get('behavioral_score', 0) < 0.7:
            recommendations.append("Align behavioral claims with measurable improvements")

        # General recommendations
        if is_genuine:
            recommendations.append("Validation passed - improvements appear genuine and well-supported")
        else:
            recommendations.append("Focus on structural and algorithmic improvements rather than cosmetic changes")

        return recommendations

    def _generate_cache_key(self,
                          before_metrics: CodeMetrics,
                          after_metrics: CodeMetrics,
                          code_changes: List[Dict]) -> str:
        """Generate cache key for validation result."""

        # Create hash from key parameters
        key_data = {
            'before_complexity': before_metrics.cyclomatic_complexity,
            'after_complexity': after_metrics.cyclomatic_complexity,
            'before_maintainability': before_metrics.maintainability_index,
            'after_maintainability': after_metrics.maintainability_index,
            'change_count': len(code_changes)
        }

        key_string = json.dumps(key_data, sort_keys=True)
        return hashlib.md5(key_string.encode()).hexdigest()

    def add_to_history(self, validation_result: ValidationResult, context: Dict[str, Any]):
        """Add validation result to historical data for future reference."""

        historical_entry = {
            'timestamp': validation_result.timestamp.isoformat(),
            'is_genuine': validation_result.is_genuine,
            'confidence': validation_result.confidence,
            'evidence_score': validation_result.evidence_score,
            'validation_outcome': validation_result.is_genuine,
            'context': context
        }

        # Add metrics if available
        if 'before_metrics' in context:
            historical_entry['before_metrics'] = asdict(context['before_metrics'])
        if 'after_metrics' in context:
            historical_entry['after_metrics'] = asdict(context['after_metrics'])
        if 'claimed_improvements' in context:
            historical_entry['claimed_improvements'] = context['claimed_improvements']

        self.historical_data.append(historical_entry)

        # Limit historical data size
        if len(self.historical_data) > 1000:
            self.historical_data = self.historical_data[-1000:]

    def generate_validation_report(self, validation_result: ValidationResult) -> Dict[str, Any]:
        """Generate comprehensive validation report."""

        return {
            'validation_summary': {
                'is_genuine': validation_result.is_genuine,
                'confidence': validation_result.confidence,
                'evidence_score': validation_result.evidence_score,
                'statistical_significance': validation_result.statistical_significance,
                'overall_assessment': 'GENUINE' if validation_result.is_genuine else 'QUESTIONABLE'
            },
            'detailed_analysis': validation_result.validation_details,
            'recommendations': validation_result.recommendations,
            'metadata': {
                'validation_timestamp': validation_result.timestamp.isoformat(),
                'validator_version': '1.0.0',
                'configuration': self.config
            }
        }