"""
Tests for Reality Validation Engine
Comprehensive test suite for statistical analysis and validation.
"""

import pytest
import json
import numpy as np
from datetime import datetime, timedelta
from unittest.mock import Mock, patch

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'src'))

from validation.reality_validation_engine import (
    RealityValidationEngine,
    ValidationResult,
    CodeMetrics
)

class TestRealityValidationEngine:
    """Test suite for RealityValidationEngine."""

    @pytest.fixture
    def engine(self):
        """Create validation engine for testing."""
        config = {
            'significance_threshold': 0.05,
            'minimum_effect_size': 0.2,
            'evidence_weight_threshold': 0.7
        }
        return RealityValidationEngine(config)

    @pytest.fixture
    def genuine_before_metrics(self):
        """Genuine before metrics for testing."""
        return CodeMetrics(
            lines_of_code=1000,
            cyclomatic_complexity=15.0,
            cognitive_complexity=20.0,
            maintainability_index=65.0,
            halstead_metrics={'difficulty': 12.0, 'effort': 1000.0},
            code_coverage=0.65,
            test_coverage_quality=0.7,
            performance_metrics={'execution_time': 100.0, 'memory_usage': 50.0},
            security_score=80.0,
            documentation_ratio=0.2
        )

    @pytest.fixture
    def genuine_after_metrics(self):
        """Genuine after metrics showing real improvements."""
        return CodeMetrics(
            lines_of_code=950,
            cyclomatic_complexity=12.0,
            cognitive_complexity=16.0,
            maintainability_index=75.0,
            halstead_metrics={'difficulty': 10.0, 'effort': 800.0},
            code_coverage=0.85,
            test_coverage_quality=0.85,
            performance_metrics={'execution_time': 80.0, 'memory_usage': 45.0},
            security_score=90.0,
            documentation_ratio=0.25
        )

    @pytest.fixture
    def superficial_after_metrics(self):
        """Superficial after metrics with suspicious improvements."""
        return CodeMetrics(
            lines_of_code=1000,  # No real change
            cyclomatic_complexity=15.0,  # No real change
            cognitive_complexity=20.0,  # No real change
            maintainability_index=90.0,  # Unrealistic improvement
            halstead_metrics={'difficulty': 12.0, 'effort': 1000.0},  # No change
            code_coverage=0.95,  # Massive improvement
            test_coverage_quality=0.95,  # Massive improvement
            performance_metrics={'execution_time': 100.0, 'memory_usage': 50.0},  # No change
            security_score=100.0,  # Perfect score
            documentation_ratio=0.8  # Massive increase
        )

    @pytest.fixture
    def genuine_code_changes(self):
        """Genuine structural code changes."""
        return [
            {
                'file_path': 'src/algorithm.py',
                'diff': '''
- def bubble_sort(arr):
-     n = len(arr)
-     for i in range(n):
-         for j in range(0, n-i-1):
-             if arr[j] > arr[j+1]:
-                 arr[j], arr[j+1] = arr[j+1], arr[j]
-     return arr

+ def quick_sort(arr):
+     if len(arr) <= 1:
+         return arr
+     pivot = arr[len(arr) // 2]
+     left = [x for x in arr if x < pivot]
+     middle = [x for x in arr if x == pivot]
+     right = [x for x in arr if x > pivot]
+     return quick_sort(left) + middle + quick_sort(right)
                ''',
                'change_type': 'algorithmic_improvement'
            },
            {
                'file_path': 'src/validator.py',
                'diff': '''
+ def validate_email(email):
+     import re
+     pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
+     return bool(re.match(pattern, email))
+
+ def validate_phone(phone):
+     import re
+     pattern = r'^\+?1?\d{9,15}$'
+     return bool(re.match(pattern, phone))
                ''',
                'change_type': 'functional_addition'
            }
        ]

    @pytest.fixture
    def superficial_code_changes(self):
        """Superficial code changes that look like theater."""
        return [
            {
                'file_path': 'src/utils.py',
                'diff': '''
- # Utility functions
- def helper_func(data):
+ # Enhanced utility functions for data processing
+ # This module provides comprehensive data handling capabilities
+ def data_helper_function(data):
                ''',
                'change_type': 'cosmetic'
            },
            {
                'file_path': 'src/models.py',
                'diff': '''
+ # Data model definitions
+ # These models represent the core data structures
+
  class User:
+     # User model for authentication and profile management
      def __init__(self, name, email):
+         # Initialize user with name and email
          self.name = name
+         # Store email address
          self.email = email
                ''',
                'change_type': 'documentation'
            }
        ]

    def test_genuine_improvements_validation(self, engine, genuine_before_metrics, genuine_after_metrics, genuine_code_changes):
        """Test validation of genuine improvements."""

        result = engine.validate_completion_claim(
            genuine_before_metrics,
            genuine_after_metrics,
            "Improved algorithm efficiency and added input validation",
            genuine_code_changes,
            ["performance improvement", "code quality enhancement", "security hardening"]
        )

        assert result.is_genuine is True, "Genuine improvements should be validated as genuine"
        assert result.confidence >= 0.7, f"Confidence should be high for genuine improvements: {result.confidence}"
        assert result.evidence_score >= 0.6, f"Evidence score should be good for genuine improvements: {result.evidence_score}"
        assert result.statistical_significance <= 0.05, f"Should be statistically significant: {result.statistical_significance}"

    def test_superficial_changes_rejection(self, engine, genuine_before_metrics, superficial_after_metrics, superficial_code_changes):
        """Test rejection of superficial changes."""

        result = engine.validate_completion_claim(
            genuine_before_metrics,
            superficial_after_metrics,
            "Enhanced code quality and documentation",
            superficial_code_changes,
            ["code quality improvement", "documentation enhancement", "maintainability boost"]
        )

        assert result.is_genuine is False, "Superficial changes should be rejected"
        assert result.confidence < 0.7, f"Confidence should be low for superficial changes: {result.confidence}"

        # Check for specific validation issues
        validation_details = result.validation_details
        assert 'genuineness' in validation_details, "Should include genuineness analysis"

        genuineness_result = validation_details['genuineness']
        assert genuineness_result['genuineness_level'] in ['questionable', 'likely_superficial'], "Should flag as questionable or superficial"

    def test_statistical_significance_analysis(self, engine, genuine_before_metrics, genuine_after_metrics):
        """Test statistical significance analysis."""

        # Test with metrics that should be statistically significant
        result = engine._analyze_statistical_significance(genuine_before_metrics, genuine_after_metrics)

        assert 'is_significant' in result, "Should include significance determination"
        assert 'p_value' in result, "Should include p-value"
        assert 'effect_size' in result, "Should include effect size"
        assert 'confidence' in result, "Should include confidence score"

        # For genuine improvements, should be significant
        assert result['p_value'] <= 0.05, f"P-value should indicate significance: {result['p_value']}"
        assert abs(result['effect_size']) >= 0.2, f"Effect size should be meaningful: {result['effect_size']}"

    def test_evidence_quality_assessment(self, engine, genuine_code_changes, superficial_code_changes):
        """Test evidence quality assessment."""

        # Test genuine evidence
        genuine_result = engine._assess_evidence_quality(
            genuine_code_changes,
            ["performance improvement", "security enhancement"]
        )

        assert genuine_result['evidence_score'] >= 0.6, f"Genuine evidence should score well: {genuine_result['evidence_score']}"
        assert genuine_result['quality_assessment'] in ['high_quality', 'moderate_quality'], "Should assess as good quality"

        # Test superficial evidence
        superficial_result = engine._assess_evidence_quality(
            superficial_code_changes,
            ["code quality improvement", "documentation enhancement"]
        )

        assert superficial_result['evidence_score'] < 0.6, f"Superficial evidence should score poorly: {superficial_result['evidence_score']}"
        assert superficial_result['quality_assessment'] in ['low_quality', 'insufficient_evidence'], "Should assess as poor quality"

    def test_change_categorization(self, engine, genuine_code_changes, superficial_code_changes):
        """Test categorization of code changes."""

        # Test genuine changes
        genuine_analysis = engine._categorize_code_changes(genuine_code_changes)

        assert genuine_analysis['meaningful_count'] > 0, "Should identify meaningful changes"
        assert genuine_analysis['avg_significance'] > 0.5, "Average significance should be high"

        # Should have high ratios of structural/algorithmic changes
        ratios = genuine_analysis['ratios']
        meaningful_ratio = ratios.get('structural_ratio', 0) + ratios.get('algorithmic_ratio', 0)
        assert meaningful_ratio > 0.3, f"Should have meaningful change ratio > 30%: {meaningful_ratio}"

        # Test superficial changes
        superficial_analysis = engine._categorize_code_changes(superficial_code_changes)

        assert superficial_analysis['superficial_count'] > superficial_analysis['meaningful_count'], "Should identify more superficial than meaningful changes"

        # Should have high ratios of cosmetic/documentation changes
        superficial_ratios = superficial_analysis['ratios']
        superficial_ratio = superficial_ratios.get('cosmetic_ratio', 0) + superficial_ratios.get('documentation_ratio', 0)
        assert superficial_ratio > 0.5, f"Should have high superficial ratio: {superficial_ratio}"

    def test_improvement_claim_validation(self, engine):
        """Test validation of specific improvement claims."""

        # Test performance claim validation
        performance_change_analysis = {
            'ratios': {
                'algorithmic_ratio': 0.8,
                'structural_ratio': 0.2,
                'cosmetic_ratio': 0.0
            }
        }

        assert engine._validate_improvement_claim("performance optimization", performance_change_analysis) is True, "Performance claim should be validated with algorithmic changes"

        # Test invalid performance claim
        cosmetic_change_analysis = {
            'ratios': {
                'algorithmic_ratio': 0.0,
                'structural_ratio': 0.1,
                'cosmetic_ratio': 0.9
            }
        }

        assert engine._validate_improvement_claim("performance optimization", cosmetic_change_analysis) is False, "Performance claim should not be validated with cosmetic changes"

    def test_genuineness_score_calculation(self, engine, genuine_before_metrics, genuine_after_metrics, superficial_after_metrics, genuine_code_changes, superficial_code_changes):
        """Test genuineness score calculation."""

        # Test genuine changes
        genuine_result = engine._analyze_change_genuineness(
            genuine_before_metrics,
            genuine_after_metrics,
            genuine_code_changes
        )

        assert genuine_result['genuineness_score'] >= 0.6, f"Genuine changes should score well: {genuine_result['genuineness_score']}"
        assert genuine_result['genuineness_level'] in ['highly_genuine', 'moderately_genuine'], "Should be classified as genuine"

        # Test superficial changes
        superficial_result = engine._analyze_change_genuineness(
            genuine_before_metrics,
            superficial_after_metrics,
            superficial_code_changes
        )

        assert superficial_result['genuineness_score'] < 0.6, f"Superficial changes should score poorly: {superficial_result['genuineness_score']}"
        assert superficial_result['genuineness_level'] in ['questionable', 'likely_superficial'], "Should be classified as questionable"

    def test_superficial_indicator_detection(self, engine, superficial_code_changes):
        """Test detection of superficial change indicators."""

        # Create mock metric deltas that suggest gaming
        metric_deltas = {
            'complexity_delta': 5.0,  # Large complexity reduction
            'maintainability_delta': 25.0,  # Large maintainability increase
            'coverage_delta': 0.3,  # Large coverage increase
            'security_delta': 20.0  # Large security improvement
        }

        indicators = engine._detect_superficial_indicators(superficial_code_changes, metric_deltas)

        assert len(indicators) > 0, "Should detect superficial indicators"

        # Should detect disproportionate improvement
        assert 'disproportionate_improvement' in indicators, "Should detect disproportionate improvement"

    def test_behavioral_validation(self, engine, genuine_before_metrics, genuine_after_metrics):
        """Test behavioral change validation."""

        # Test performance claim
        performance_description = "Optimized algorithm to improve execution speed and reduce memory usage"

        result = engine._validate_behavioral_changes(
            genuine_before_metrics,
            genuine_after_metrics,
            performance_description
        )

        assert result['behavioral_score'] > 0.0, "Should validate behavioral claims"
        assert 'performance' in result['validated_claims'], "Should validate performance claim"

    def test_historical_cross_validation(self, engine):
        """Test cross-validation with historical data."""

        # Add some historical data
        engine.historical_data = [
            {
                'before_metrics': {
                    'cyclomatic_complexity': 15.0,
                    'maintainability_index': 65.0
                },
                'after_metrics': {
                    'cyclomatic_complexity': 12.0,
                    'maintainability_index': 75.0
                },
                'claimed_improvements': ['performance', 'maintainability'],
                'validation_outcome': True
            },
            {
                'before_metrics': {
                    'cyclomatic_complexity': 14.0,
                    'maintainability_index': 70.0
                },
                'after_metrics': {
                    'cyclomatic_complexity': 11.0,
                    'maintainability_index': 80.0
                },
                'claimed_improvements': ['performance', 'maintainability'],
                'validation_outcome': True
            }
        ]

        # Test similar case
        before_metrics = CodeMetrics(
            lines_of_code=1000,
            cyclomatic_complexity=16.0,
            cognitive_complexity=20.0,
            maintainability_index=68.0,
            halstead_metrics={},
            code_coverage=0.7,
            test_coverage_quality=0.7,
            performance_metrics={},
            security_score=80.0,
            documentation_ratio=0.2
        )

        after_metrics = CodeMetrics(
            lines_of_code=950,
            cyclomatic_complexity=13.0,
            cognitive_complexity=18.0,
            maintainability_index=78.0,
            halstead_metrics={},
            code_coverage=0.8,
            test_coverage_quality=0.8,
            performance_metrics={},
            security_score=85.0,
            documentation_ratio=0.25
        )

        result = engine._cross_validate_with_history(
            before_metrics,
            after_metrics,
            ['performance', 'maintainability']
        )

        assert result['similar_cases'] > 0, "Should find similar historical cases"
        assert result['historical_confidence'] > 0.5, "Should have reasonable historical confidence"

    def test_validation_result_combination(self, engine, genuine_before_metrics, genuine_after_metrics, genuine_code_changes):
        """Test combination of validation results."""

        # Create mock individual results
        statistical_result = {
            'is_significant': True,
            'p_value': 0.02,
            'effect_size': 0.5,
            'confidence': 0.8
        }

        evidence_result = {
            'evidence_score': 0.8,
            'quality_assessment': 'high_quality',
            'confidence': 0.85
        }

        genuineness_result = {
            'genuineness_score': 0.7,
            'genuineness_level': 'moderately_genuine',
            'confidence': 0.7
        }

        behavioral_result = {
            'behavioral_score': 0.8,
            'confidence': 0.8
        }

        historical_result = {
            'historical_confidence': 0.7,
            'similar_cases': 2
        }

        # Combine results
        final_result = engine._combine_validation_results([
            statistical_result,
            evidence_result,
            genuineness_result,
            behavioral_result,
            historical_result
        ])

        assert isinstance(final_result, ValidationResult), "Should return ValidationResult"
        assert final_result.is_genuine is True, "Should validate as genuine"
        assert final_result.confidence >= 0.7, f"Should have high confidence: {final_result.confidence}"
        assert len(final_result.recommendations) > 0, "Should include recommendations"

    def test_cache_functionality(self, engine, genuine_before_metrics, genuine_after_metrics, genuine_code_changes):
        """Test validation result caching."""

        initial_cache_size = len(engine.validation_cache)

        # First validation
        result1 = engine.validate_completion_claim(
            genuine_before_metrics,
            genuine_after_metrics,
            "Test improvement",
            genuine_code_changes,
            ["test improvement"]
        )

        # Cache should be updated
        assert len(engine.validation_cache) > initial_cache_size, "Cache should be updated after validation"

    def test_recommendation_generation(self, engine):
        """Test generation of validation recommendations."""

        # Test for failed validation
        failed_results = [
            {'is_significant': False, 'confidence': 0.3},
            {'evidence_score': 0.4, 'confidence': 0.4},
            {'genuineness_score': 0.3, 'superficial_indicators': ['high_cosmetic_ratio'], 'confidence': 0.3},
            {'behavioral_score': 0.2, 'confidence': 0.2},
            {'historical_confidence': 0.3}
        ]

        recommendations = engine._generate_validation_recommendations(failed_results, False)

        assert len(recommendations) > 0, "Should generate recommendations for failed validation"

        # Check for specific recommendation types
        recommendation_text = ' '.join(recommendations).lower()
        assert any(keyword in recommendation_text for keyword in ['evidence', 'improvements', 'changes']), "Should include improvement recommendations"

    def test_edge_cases(self, engine):
        """Test edge cases and error handling."""

        # Test with empty metrics
        empty_before = CodeMetrics(0, 0, 0, 0, {}, 0, 0, {}, 0, 0)
        empty_after = CodeMetrics(0, 0, 0, 0, {}, 0, 0, {}, 0, 0)

        result = engine.validate_completion_claim(
            empty_before,
            empty_after,
            "Empty improvement",
            [],
            []
        )

        assert isinstance(result, ValidationResult), "Should handle empty metrics gracefully"
        assert result.confidence == 0.0 or result.confidence > 0, "Should provide valid confidence score"

    def test_accuracy_on_test_cases(self, engine):
        """Test validation accuracy on known test cases."""

        test_cases = [
            {
                'name': 'genuine_algorithmic_improvement',
                'expected_genuine': True,
                'before': CodeMetrics(1000, 20.0, 25.0, 60.0, {}, 0.6, 0.6, {'execution_time': 200.0}, 75.0, 0.15),
                'after': CodeMetrics(800, 15.0, 18.0, 75.0, {}, 0.8, 0.8, {'execution_time': 120.0}, 85.0, 0.25),
                'changes': [
                    {
                        'file_path': 'src/algorithm.py',
                        'diff': 'replaced O(n^2) with O(n log n) algorithm',
                        'change_type': 'algorithmic'
                    }
                ],
                'claims': ['performance improvement', 'code quality enhancement']
            },
            {
                'name': 'superficial_documentation_theater',
                'expected_genuine': False,
                'before': CodeMetrics(1000, 15.0, 20.0, 65.0, {}, 0.7, 0.7, {'execution_time': 100.0}, 80.0, 0.2),
                'after': CodeMetrics(1000, 15.0, 20.0, 90.0, {}, 0.95, 0.95, {'execution_time': 100.0}, 95.0, 0.8),
                'changes': [
                    {
                        'file_path': 'src/utils.py',
                        'diff': 'added extensive comments and docstrings',
                        'change_type': 'documentation'
                    }
                ],
                'claims': ['maintainability improvement', 'code quality enhancement']
            },
            {
                'name': 'test_padding_theater',
                'expected_genuine': False,
                'before': CodeMetrics(1000, 15.0, 20.0, 65.0, {}, 0.6, 0.6, {}, 80.0, 0.2),
                'after': CodeMetrics(1000, 15.0, 20.0, 65.0, {}, 0.95, 0.95, {}, 80.0, 0.2),
                'changes': [
                    {
                        'file_path': 'tests/test_trivial.py',
                        'diff': 'added trivial tests that always pass',
                        'change_type': 'test'
                    }
                ],
                'claims': ['test coverage improvement']
            }
        ]

        # Run validation on all test cases
        results = []
        for case in test_cases:
            result = engine.validate_completion_claim(
                case['before'],
                case['after'],
                f"Improvements for {case['name']}",
                case['changes'],
                case['claims']
            )

            correct = result.is_genuine == case['expected_genuine']
            results.append({
                'name': case['name'],
                'expected': case['expected_genuine'],
                'actual': result.is_genuine,
                'correct': correct,
                'confidence': result.confidence
            })

        # Calculate accuracy
        correct_count = sum(1 for r in results if r['correct'])
        accuracy = correct_count / len(results)

        # Should achieve >90% accuracy
        assert accuracy >= 0.9, f"Validation accuracy {accuracy:.1%} below 90% target. Results: {results}"

        return accuracy, results

if __name__ == '__main__':
    # Run specific accuracy test
    engine = RealityValidationEngine()
    test_instance = TestRealityValidationEngine()

    try:
        accuracy, results = test_instance.test_accuracy_on_test_cases(engine)
        print(f"\nReality Validation Accuracy: {accuracy:.1%}")
        print("\nDetailed Results:")
        for result in results:
            status = "CORRECT" if result['correct'] else "INCORRECT"
            print(f"  {result['name']}: Expected={result['expected']}, "
                  f"Actual={result['actual']}, Confidence={result['confidence']:.2f}, Status={status}")
    except Exception as e:
        print(f"Accuracy test failed: {e}")

    # Run full test suite
    pytest.main([__file__, '-v'])