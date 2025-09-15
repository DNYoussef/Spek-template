"""
Tests for Enterprise Theater Detector
Comprehensive test suite validating theater detection accuracy.
"""

import pytest
import json
import numpy as np
from datetime import datetime, timedelta
from unittest.mock import Mock, patch, MagicMock

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'src'))

from validation.enterprise_theater_detector import (
    EnterpriseTheaterDetector,
    TheaterPattern,
    QualityMetrics
)

class TestEnterpriseTheaterDetector:
    """Test suite for EnterpriseTheaterDetector."""

    @pytest.fixture
    def detector(self):
        """Create detector instance for testing."""
        config = {
            'sensitivity_threshold': 0.75,
            'evidence_requirement': 3,
            'ml_confidence_threshold': 0.8
        }
        return EnterpriseTheaterDetector(config)

    @pytest.fixture
    def sample_before_metrics(self):
        """Sample before metrics for testing."""
        return QualityMetrics(
            cyclomatic_complexity=15.0,
            code_coverage=0.65,
            test_count=25,
            performance_score=70.0,
            security_score=80.0,
            maintainability_index=65.0,
            technical_debt_ratio=0.3
        )

    @pytest.fixture
    def sample_after_metrics(self):
        """Sample after metrics for testing."""
        return QualityMetrics(
            cyclomatic_complexity=12.0,
            code_coverage=0.85,
            test_count=27,
            performance_score=75.0,
            security_score=85.0,
            maintainability_index=70.0,
            technical_debt_ratio=0.25
        )

    @pytest.fixture
    def genuine_code_changes(self):
        """Sample genuine code changes."""
        return [
            {
                'file_path': 'src/core/algorithm.py',
                'diff': '''
- def slow_algorithm(data):
-     result = []
-     for i in range(len(data)):
-         for j in range(len(data)):
-             if condition(data[i], data[j]):
-                 result.append(process(data[i], data[j]))
-     return result

+ def fast_algorithm(data):
+     result = []
+     data_map = {item.key: item for item in data}
+     for item in data:
+         if item.key in data_map:
+             result.append(process_optimized(item, data_map[item.key]))
+     return result
                ''',
                'lines_added': 6,
                'lines_removed': 7
            },
            {
                'file_path': 'src/core/validator.py',
                'diff': '''
+ def validate_input(data):
+     if not isinstance(data, dict):
+         raise ValueError("Data must be a dictionary")
+
+     required_fields = ['id', 'name', 'type']
+     for field in required_fields:
+         if field not in data:
+             raise ValueError(f"Missing required field: {field}")
+
+     return True
                ''',
                'lines_added': 8,
                'lines_removed': 0
            }
        ]

    @pytest.fixture
    def superficial_code_changes(self):
        """Sample superficial code changes (theater)."""
        return [
            {
                'file_path': 'src/utils/helpers.py',
                'diff': '''
- # Helper function for data processing
- def process_data(input_data):
+ # Helper function for data processing and transformation
+ # This function handles various data formats
+ def process_user_data(input_data):
                ''',
                'lines_added': 3,
                'lines_removed': 2
            },
            {
                'file_path': 'src/models/user.py',
                'diff': '''
- user_name = data.get('name')
- user_email = data.get('email')
- user_age = data.get('age')

+ username = data.get('name')  # Extract username
+ user_email_address = data.get('email')  # Extract email
+ user_age_years = data.get('age')  # Extract age in years
                ''',
                'lines_added': 3,
                'lines_removed': 3
            },
            {
                'file_path': 'src/config/settings.py',
                'diff': '''
+ # Configuration settings for the application
+ # These settings control various aspects of behavior
+
  DEBUG = True

+ # Database configuration
  DATABASE_URL = 'sqlite:///app.db'
                ''',
                'lines_added': 4,
                'lines_removed': 0
            }
        ]

    def test_genuine_improvements_not_flagged(self, detector, sample_before_metrics, sample_after_metrics, genuine_code_changes):
        """Test that genuine improvements are not flagged as theater."""

        patterns = detector.analyze_change_set(
            sample_before_metrics,
            sample_after_metrics,
            genuine_code_changes,
            'core_module'
        )

        # Should detect minimal or no theater patterns
        assert len(patterns) <= 1, f"Genuine improvements incorrectly flagged: {[p.pattern_type for p in patterns]}"

        if patterns:
            # If any patterns detected, they should be low severity
            for pattern in patterns:
                assert pattern.severity < 0.6, f"High severity pattern detected for genuine improvements: {pattern.pattern_type}"

    def test_superficial_changes_detected(self, detector, sample_before_metrics, superficial_code_changes):
        """Test that superficial changes are correctly detected as theater."""

        # Create metrics with disproportionate improvements
        theater_after_metrics = QualityMetrics(
            cyclomatic_complexity=8.0,  # Significant reduction
            code_coverage=0.92,  # Large improvement
            test_count=26,  # Minimal test addition
            performance_score=85.0,  # Large improvement
            security_score=90.0,  # Large improvement
            maintainability_index=80.0,  # Large improvement
            technical_debt_ratio=0.15  # Large reduction
        )

        patterns = detector.analyze_change_set(
            sample_before_metrics,
            theater_after_metrics,
            superficial_code_changes,
            'theater_module'
        )

        # Should detect multiple theater patterns
        assert len(patterns) >= 2, f"Expected multiple theater patterns, got {len(patterns)}"

        # Check for specific theater types
        pattern_types = [p.pattern_type for p in patterns]
        assert 'superficial_refactoring' in pattern_types, "Should detect superficial refactoring"
        assert any('correlation' in pt or 'metric' in pt for pt in pattern_types), "Should detect metric/correlation issues"

    def test_metric_gaming_detection(self, detector, sample_before_metrics, genuine_code_changes):
        """Test detection of metric gaming patterns."""

        # Create suspicious metric improvements
        gaming_after_metrics = QualityMetrics(
            cyclomatic_complexity=sample_before_metrics.cyclomatic_complexity,  # No change
            code_coverage=0.95,  # Massive improvement
            test_count=26,  # Only 1 new test
            performance_score=sample_before_metrics.performance_score,  # No change
            security_score=sample_before_metrics.security_score,  # No change
            maintainability_index=sample_before_metrics.maintainability_index,  # No change
            technical_debt_ratio=sample_before_metrics.technical_debt_ratio  # No change
        )

        patterns = detector.analyze_change_set(
            sample_before_metrics,
            gaming_after_metrics,
            genuine_code_changes,
            'gaming_module'
        )

        # Should detect metric gaming
        pattern_types = [p.pattern_type for p in patterns]
        assert 'metric_gaming' in pattern_types, "Should detect metric gaming pattern"

        # Find the metric gaming pattern
        gaming_pattern = next(p for p in patterns if p.pattern_type == 'metric_gaming')
        assert gaming_pattern.severity >= 0.7, "Metric gaming should be high severity"
        assert gaming_pattern.confidence >= 0.8, "Metric gaming confidence should be high"

    def test_performance_theater_detection(self, detector, sample_before_metrics, sample_after_metrics):
        """Test detection of performance theater."""

        # Create performance theater scenario
        performance_theater_after = QualityMetrics(
            cyclomatic_complexity=sample_before_metrics.cyclomatic_complexity,
            code_coverage=sample_before_metrics.code_coverage,
            test_count=sample_before_metrics.test_count,
            performance_score=95.0,  # Massive performance improvement
            security_score=sample_before_metrics.security_score,
            maintainability_index=sample_before_metrics.maintainability_index,
            technical_debt_ratio=sample_before_metrics.technical_debt_ratio
        )

        # Micro-optimization changes
        micro_changes = [
            {
                'file_path': 'src/optimization.py',
                'diff': '''
- for i in range(len(items)):
+ for i, item in enumerate(items):
                ''',
                'lines_added': 1,
                'lines_removed': 1
            }
        ]

        patterns = detector.analyze_change_set(
            sample_before_metrics,
            performance_theater_after,
            micro_changes,
            'performance_module'
        )

        pattern_types = [p.pattern_type for p in patterns]
        assert 'performance_theater' in pattern_types, "Should detect performance theater"

    def test_cross_module_analysis(self, detector, sample_before_metrics, sample_after_metrics):
        """Test cross-module theater correlation analysis."""

        # Create multiple module reports with similar theater patterns
        module_reports = [
            {
                'module_name': 'module_a',
                'patterns': {
                    'superficial_refactoring': [
                        {
                            'severity': 0.8,
                            'confidence': 0.9,
                            'evidence': ['Variable renaming'],
                            'location': 'module_a'
                        }
                    ]
                }
            },
            {
                'module_name': 'module_b',
                'patterns': {
                    'superficial_refactoring': [
                        {
                            'severity': 0.7,
                            'confidence': 0.8,
                            'evidence': ['Comment additions'],
                            'location': 'module_b'
                        }
                    ]
                }
            },
            {
                'module_name': 'module_c',
                'patterns': {
                    'superficial_refactoring': [
                        {
                            'severity': 0.9,
                            'confidence': 0.85,
                            'evidence': ['Whitespace changes'],
                            'location': 'module_c'
                        }
                    ]
                }
            }
        ]

        result = detector.cross_module_analysis(module_reports)

        assert result['status'] == 'SYSTEMATIC_THEATER', "Should detect systematic theater"
        assert len(result['correlations']) > 0, "Should find correlations"

        # Check for superficial_refactoring correlation
        refactoring_correlation = next(
            (c for c in result['correlations'] if c['pattern_type'] == 'superficial_refactoring'),
            None
        )
        assert refactoring_correlation is not None, "Should find superficial refactoring correlation"
        assert refactoring_correlation['affected_modules'] == 3, "Should affect all 3 modules"

    def test_generate_theater_report(self, detector):
        """Test theater report generation."""

        # Create test patterns
        patterns = [
            TheaterPattern(
                pattern_type='superficial_refactoring',
                severity=0.8,
                confidence=0.9,
                evidence=['Variable renaming', 'Comment additions'],
                location='test_module',
                timestamp=datetime.now(),
                metadata={'test': True}
            ),
            TheaterPattern(
                pattern_type='metric_gaming',
                severity=0.9,
                confidence=0.85,
                evidence=['Coverage inflation', 'Trivial tests'],
                location='test_module',
                timestamp=datetime.now(),
                metadata={'test': True}
            )
        ]

        report = detector.generate_theater_report(patterns)

        assert report['theater_detected'] is True, "Should detect theater"
        assert report['status'] in ['HIGH_THEATER_RISK', 'MODERATE_THEATER_RISK'], "Should indicate risk"
        assert report['pattern_count'] == 2, "Should count patterns correctly"
        assert len(report['recommendations']) > 0, "Should provide recommendations"

        # Check pattern grouping
        assert 'superficial_refactoring' in report['patterns'], "Should group patterns by type"
        assert 'metric_gaming' in report['patterns'], "Should group patterns by type"

    def test_ml_validation_with_anomalies(self, detector, sample_before_metrics, sample_after_metrics):
        """Test ML-based validation with anomalous patterns."""

        # Create patterns that should trigger ML anomaly detection
        anomalous_changes = [
            {
                'file_path': 'src/anomaly.py',
                'diff': '''
+ # This is a comment
+ # Another comment
+ # Yet another comment
+ # More comments
+ # Even more comments
                ''',
                'lines_added': 5,
                'lines_removed': 0
            }
        ]

        # Create extreme metric improvements
        extreme_after_metrics = QualityMetrics(
            cyclomatic_complexity=1.0,  # Extreme reduction
            code_coverage=1.0,  # Perfect coverage
            test_count=26,  # Minimal test addition
            performance_score=100.0,  # Perfect performance
            security_score=100.0,  # Perfect security
            maintainability_index=100.0,  # Perfect maintainability
            technical_debt_ratio=0.0  # No debt
        )

        patterns = detector.analyze_change_set(
            sample_before_metrics,
            extreme_after_metrics,
            anomalous_changes,
            'anomaly_module'
        )

        # Should detect multiple patterns including potential ML anomalies
        assert len(patterns) >= 2, f"Expected multiple patterns for anomalous data, got {len(patterns)}"

        # Check for high severity patterns
        high_severity_patterns = [p for p in patterns if p.severity >= 0.8]
        assert len(high_severity_patterns) >= 1, "Should detect high severity patterns for anomalous data"

    def test_empty_change_set_handling(self, detector, sample_before_metrics, sample_after_metrics):
        """Test handling of empty change sets."""

        patterns = detector.analyze_change_set(
            sample_before_metrics,
            sample_after_metrics,
            [],  # Empty changes
            'empty_module'
        )

        # Should handle empty changes gracefully
        assert isinstance(patterns, list), "Should return list for empty changes"

        # May detect metric improvements without code changes (suspicious)
        if patterns:
            pattern_types = [p.pattern_type for p in patterns]
            # Should be flagged as suspicious if metrics improved without changes
            assert any('metric' in pt for pt in pattern_types), "Should be suspicious of metrics improvement without changes"

    def test_configuration_impact(self):
        """Test impact of different configuration settings."""

        # Strict configuration
        strict_config = {
            'sensitivity_threshold': 0.5,  # More sensitive
            'evidence_requirement': 2,     # Less evidence needed
            'ml_confidence_threshold': 0.6  # Lower threshold
        }

        # Lenient configuration
        lenient_config = {
            'sensitivity_threshold': 0.9,  # Less sensitive
            'evidence_requirement': 5,     # More evidence needed
            'ml_confidence_threshold': 0.95  # Higher threshold
        }

        strict_detector = EnterpriseTheaterDetector(strict_config)
        lenient_detector = EnterpriseTheaterDetector(lenient_config)

        # Test with borderline theater case
        borderline_metrics_before = QualityMetrics(
            cyclomatic_complexity=10.0,
            code_coverage=0.7,
            test_count=20,
            performance_score=75.0,
            security_score=80.0,
            maintainability_index=70.0,
            technical_debt_ratio=0.25
        )

        borderline_metrics_after = QualityMetrics(
            cyclomatic_complexity=9.0,
            code_coverage=0.8,
            test_count=21,
            performance_score=78.0,
            security_score=82.0,
            maintainability_index=72.0,
            technical_debt_ratio=0.23
        )

        borderline_changes = [
            {
                'file_path': 'src/borderline.py',
                'diff': '''
- old_variable = value
+ new_variable = value  # Renamed for clarity
                ''',
                'lines_added': 1,
                'lines_removed': 1
            }
        ]

        strict_patterns = strict_detector.analyze_change_set(
            borderline_metrics_before,
            borderline_metrics_after,
            borderline_changes,
            'borderline_module'
        )

        lenient_patterns = lenient_detector.analyze_change_set(
            borderline_metrics_before,
            borderline_metrics_after,
            borderline_changes,
            'borderline_module'
        )

        # Strict detector should be more likely to flag issues
        strict_theater_count = len([p for p in strict_patterns if p.confidence > 0.5])
        lenient_theater_count = len([p for p in lenient_patterns if p.confidence > 0.5])

        assert strict_theater_count >= lenient_theater_count, "Strict detector should flag more issues"

    def test_pattern_history_tracking(self, detector, sample_before_metrics, sample_after_metrics, superficial_code_changes):
        """Test that pattern history is tracked correctly."""

        initial_history_length = len(detector.pattern_history)

        # Analyze changes to generate patterns
        patterns = detector.analyze_change_set(
            sample_before_metrics,
            sample_after_metrics,
            superficial_code_changes,
            'history_module'
        )

        # History should be updated
        assert len(detector.pattern_history) > initial_history_length, "Pattern history should be updated"

        # History should contain the generated patterns
        new_patterns = detector.pattern_history[initial_history_length:]
        assert len(new_patterns) == len(patterns), "All patterns should be added to history"

    def test_accuracy_measurement(self, detector):
        """Test measurement of detection accuracy against known cases."""

        # Create test cases with known outcomes
        test_cases = [
            {
                'name': 'genuine_improvement',
                'expected_theater': False,
                'before_metrics': QualityMetrics(20.0, 0.6, 20, 60.0, 70.0, 60.0, 0.4),
                'after_metrics': QualityMetrics(15.0, 0.8, 25, 75.0, 85.0, 75.0, 0.3),
                'changes': [
                    {
                        'file_path': 'src/genuine.py',
                        'diff': '''
- def inefficient_function(data):
-     result = []
-     for item in data:
-         if complex_condition(item):
-             result.append(expensive_operation(item))
-     return result

+ def efficient_function(data):
+     return [optimized_operation(item) for item in data if improved_condition(item)]
                        ''',
                        'lines_added': 2,
                        'lines_removed': 6
                    }
                ]
            },
            {
                'name': 'superficial_theater',
                'expected_theater': True,
                'before_metrics': QualityMetrics(15.0, 0.65, 25, 70.0, 80.0, 65.0, 0.3),
                'after_metrics': QualityMetrics(8.0, 0.9, 26, 90.0, 95.0, 85.0, 0.15),
                'changes': [
                    {
                        'file_path': 'src/theater.py',
                        'diff': '''
- old_var = data
+ new_var = data  # Renamed for better readability
                        ''',
                        'lines_added': 1,
                        'lines_removed': 1
                    }
                ]
            },
            {
                'name': 'metric_gaming',
                'expected_theater': True,
                'before_metrics': QualityMetrics(15.0, 0.6, 20, 70.0, 80.0, 65.0, 0.3),
                'after_metrics': QualityMetrics(15.0, 0.95, 21, 70.0, 80.0, 65.0, 0.3),
                'changes': [
                    {
                        'file_path': 'tests/padding.py',
                        'diff': '''
+ def test_trivial():
+     assert True
                        ''',
                        'lines_added': 2,
                        'lines_removed': 0
                    }
                ]
            }
        ]

        # Run detection on all test cases
        results = []
        for case in test_cases:
            patterns = detector.analyze_change_set(
                case['before_metrics'],
                case['after_metrics'],
                case['changes'],
                case['name']
            )

            # Determine if theater was detected
            theater_detected = len(patterns) > 0 and any(p.confidence > 0.6 for p in patterns)

            # Check accuracy
            correct_detection = theater_detected == case['expected_theater']
            results.append({
                'name': case['name'],
                'expected': case['expected_theater'],
                'detected': theater_detected,
                'correct': correct_detection,
                'patterns': len(patterns)
            })

        # Calculate accuracy
        correct_count = sum(1 for r in results if r['correct'])
        accuracy = correct_count / len(results)

        # Should achieve >90% accuracy target
        assert accuracy >= 0.9, f"Detection accuracy {accuracy:.1%} below 90% target. Results: {results}"

        return accuracy, results

class TestTheaterPatternDataClass:
    """Test the TheaterPattern data class."""

    def test_theater_pattern_creation(self):
        """Test creation of TheaterPattern instances."""

        pattern = TheaterPattern(
            pattern_type='test_pattern',
            severity=0.8,
            confidence=0.9,
            evidence=['Evidence 1', 'Evidence 2'],
            location='test_location',
            timestamp=datetime.now(),
            metadata={'test': True}
        )

        assert pattern.pattern_type == 'test_pattern'
        assert pattern.severity == 0.8
        assert pattern.confidence == 0.9
        assert len(pattern.evidence) == 2
        assert pattern.metadata['test'] is True

class TestQualityMetricsDataClass:
    """Test the QualityMetrics data class."""

    def test_quality_metrics_creation(self):
        """Test creation of QualityMetrics instances."""

        metrics = QualityMetrics(
            cyclomatic_complexity=10.0,
            code_coverage=0.85,
            test_count=50,
            performance_score=90.0,
            security_score=95.0,
            maintainability_index=80.0,
            technical_debt_ratio=0.2
        )

        assert metrics.cyclomatic_complexity == 10.0
        assert metrics.code_coverage == 0.85
        assert metrics.test_count == 50
        assert metrics.performance_score == 90.0
        assert metrics.security_score == 95.0
        assert metrics.maintainability_index == 80.0
        assert metrics.technical_debt_ratio == 0.2

if __name__ == '__main__':
    # Run specific accuracy test
    detector = EnterpriseTheaterDetector()
    test_instance = TestEnterpriseTheaterDetector()

    try:
        accuracy, results = test_instance.test_accuracy_measurement(detector)
        print(f"\nTheater Detection Accuracy: {accuracy:.1%}")
        print("\nDetailed Results:")
        for result in results:
            status = "CORRECT" if result['correct'] else "INCORRECT"
            print(f"  {result['name']}: Expected={result['expected']}, "
                  f"Detected={result['detected']}, Status={status}")
    except Exception as e:
        print(f"Accuracy test failed: {e}")

    # Run full test suite
    pytest.main([__file__, '-v'])