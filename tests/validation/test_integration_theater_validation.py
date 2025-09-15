"""
Integration Tests for Theater Detection and Validation
End-to-end testing of the complete theater detection pipeline.
"""

import pytest
import json
import tempfile
import os
from datetime import datetime, timezone
from unittest.mock import Mock, patch

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'src'))

from validation.enterprise_theater_detector import EnterpriseTheaterDetector, QualityMetrics
from validation.reality_validation_engine import RealityValidationEngine, CodeMetrics
from validation.defense_evidence_collector import DefenseEvidenceCollector
from validation.enterprise_detector_modules import EnterpriseDetectorOrchestrator

class TestTheaterDetectionIntegration:
    """Integration tests for complete theater detection pipeline."""

    @pytest.fixture
    def temp_evidence_dir(self):
        """Create temporary directory for evidence storage."""
        with tempfile.TemporaryDirectory() as temp_dir:
            yield temp_dir

    @pytest.fixture
    def theater_detector(self):
        """Theater detector instance."""
        return EnterpriseTheaterDetector()

    @pytest.fixture
    def validation_engine(self):
        """Reality validation engine instance."""
        return RealityValidationEngine()

    @pytest.fixture
    def evidence_collector(self, temp_evidence_dir):
        """Evidence collector with temporary storage."""
        config = {
            'evidence_storage': temp_evidence_dir,
            'evidence_db_path': os.path.join(temp_evidence_dir, 'evidence.db')
        }
        return DefenseEvidenceCollector(config)

    @pytest.fixture
    def detector_orchestrator(self):
        """Detector module orchestrator."""
        return EnterpriseDetectorOrchestrator()

    def test_genuine_improvement_pipeline(self, theater_detector, validation_engine, evidence_collector, detector_orchestrator):
        """Test complete pipeline with genuine improvements."""

        # Define genuine improvement scenario
        before_metrics = QualityMetrics(
            cyclomatic_complexity=20.0,
            code_coverage=0.6,
            test_count=30,
            performance_score=60.0,
            security_score=70.0,
            maintainability_index=60.0,
            technical_debt_ratio=0.4
        )

        after_metrics = QualityMetrics(
            cyclomatic_complexity=15.0,
            code_coverage=0.8,
            test_count=40,
            performance_score=80.0,
            security_score=85.0,
            maintainability_index=75.0,
            technical_debt_ratio=0.25
        )

        genuine_changes = [
            {
                'file_path': 'src/core/algorithm.py',
                'diff': '''
- def inefficient_search(data, target):
-     for i, item in enumerate(data):
-         if item == target:
-             return i
-     return -1

+ def binary_search(data, target):
+     left, right = 0, len(data) - 1
+     while left <= right:
+         mid = (left + right) // 2
+         if data[mid] == target:
+             return mid
+         elif data[mid] < target:
+             left = mid + 1
+         else:
+             right = mid - 1
+     return -1
                ''',
                'lines_added': 9,
                'lines_removed': 4
            }
        ]

        code_data = {
            'files_changed': genuine_changes,
            'total_changes': len(genuine_changes)
        }

        metrics_data = {
            'complexity_before': before_metrics.cyclomatic_complexity,
            'complexity_after': after_metrics.cyclomatic_complexity,
            'coverage_before': before_metrics.code_coverage,
            'coverage_after': after_metrics.code_coverage,
            'performance_before': {'execution_time': 100.0},
            'performance_after': {'execution_time': 60.0}
        }

        # Step 1: Theater detection
        theater_patterns = theater_detector.analyze_change_set(
            before_metrics,
            after_metrics,
            genuine_changes,
            'genuine_module'
        )

        # Step 2: Detector modules
        detector_results = detector_orchestrator.run_all_detectors(code_data, metrics_data)

        # Step 3: Reality validation
        reality_before = self._convert_to_code_metrics(before_metrics)
        reality_after = self._convert_to_code_metrics(after_metrics)

        validation_result = validation_engine.validate_completion_claim(
            reality_before,
            reality_after,
            "Improved search algorithm efficiency",
            genuine_changes,
            ["performance improvement", "algorithmic optimization"]
        )

        # Step 4: Evidence collection
        change_evidence = evidence_collector.collect_code_change_evidence(
            {
                'files': genuine_changes,
                'change_type': 'algorithmic_improvement',
                'lines_changed': 13
            },
            'commit_abc123',
            'genuine_module'
        )

        metric_evidence = evidence_collector.collect_metric_improvement_evidence(
            before_metrics.__dict__,
            after_metrics.__dict__,
            {'improvement_type': 'algorithmic', 'confidence': 0.9},
            'genuine_module'
        )

        # Assertions for genuine improvements
        # Theater detection should find minimal issues
        high_severity_patterns = [p for p in theater_patterns if p.severity >= 0.8]
        assert len(high_severity_patterns) == 0, f"Genuine improvements should not trigger high-severity theater patterns: {[p.pattern_type for p in high_severity_patterns]}"

        # Detector modules should not flag as theater
        assert detector_results['overall_theater_detected'] is False, "Detector modules should not flag genuine improvements as theater"
        assert detector_results['overall_confidence'] < 0.7, f"Theater detection confidence should be low: {detector_results['overall_confidence']}"

        # Reality validation should pass
        assert validation_result.is_genuine is True, "Reality validation should pass for genuine improvements"
        assert validation_result.confidence >= 0.7, f"Validation confidence should be high: {validation_result.confidence}"

        # Evidence should be properly collected
        assert change_evidence.verification_status == 'pending', "Evidence should be collected"
        assert metric_evidence.verification_status == 'pending', "Metric evidence should be collected"

        return {
            'theater_patterns': len(theater_patterns),
            'detector_theater': detector_results['overall_theater_detected'],
            'validation_genuine': validation_result.is_genuine,
            'validation_confidence': validation_result.confidence
        }

    def test_theater_detection_pipeline(self, theater_detector, validation_engine, evidence_collector, detector_orchestrator):
        """Test complete pipeline with performance theater."""

        # Define theater scenario - minimal changes with massive metric improvements
        before_metrics = QualityMetrics(
            cyclomatic_complexity=15.0,
            code_coverage=0.65,
            test_count=25,
            performance_score=70.0,
            security_score=80.0,
            maintainability_index=65.0,
            technical_debt_ratio=0.3
        )

        theater_after_metrics = QualityMetrics(
            cyclomatic_complexity=8.0,  # Unrealistic reduction
            code_coverage=0.95,  # Massive improvement
            test_count=26,  # Minimal test addition
            performance_score=95.0,  # Unrealistic improvement
            security_score=98.0,  # Near-perfect score
            maintainability_index=90.0,  # Massive improvement
            technical_debt_ratio=0.1  # Massive reduction
        )

        theater_changes = [
            {
                'file_path': 'src/utils/helpers.py',
                'diff': '''
- # Helper functions
- def old_function(data):
+ # Enhanced helper functions with improved documentation
+ # This module provides comprehensive utility functions
+ def new_function_name(data):
                ''',
                'lines_added': 3,
                'lines_removed': 2
            },
            {
                'file_path': 'tests/test_trivial.py',
                'diff': '''
+ def test_always_passes():
+     assert True
+
+ def test_simple_addition():
+     assert 1 + 1 == 2
                ''',
                'lines_added': 5,
                'lines_removed': 0
            }
        ]

        code_data = {
            'files_changed': theater_changes,
            'total_changes': len(theater_changes)
        }

        metrics_data = {
            'complexity_before': before_metrics.cyclomatic_complexity,
            'complexity_after': theater_after_metrics.cyclomatic_complexity,
            'coverage_before': before_metrics.code_coverage,
            'coverage_after': theater_after_metrics.code_coverage,
            'performance_before': {'execution_time': 100.0},
            'performance_after': {'execution_time': 95.0}  # Minimal actual improvement
        }

        # Step 1: Theater detection
        theater_patterns = theater_detector.analyze_change_set(
            before_metrics,
            theater_after_metrics,
            theater_changes,
            'theater_module'
        )

        # Step 2: Detector modules
        detector_results = detector_orchestrator.run_all_detectors(code_data, metrics_data)

        # Step 3: Reality validation
        reality_before = self._convert_to_code_metrics(before_metrics)
        reality_after = self._convert_to_code_metrics(theater_after_metrics)

        validation_result = validation_engine.validate_completion_claim(
            reality_before,
            reality_after,
            "Improved code quality and test coverage",
            theater_changes,
            ["code quality improvement", "test coverage enhancement", "performance optimization"]
        )

        # Step 4: Evidence collection
        change_evidence = evidence_collector.collect_code_change_evidence(
            {
                'files': theater_changes,
                'change_type': 'superficial_changes',
                'lines_changed': 8
            },
            'commit_theater123',
            'theater_module'
        )

        # Assertions for theater detection
        # Theater detection should find multiple issues
        assert len(theater_patterns) >= 2, f"Theater scenario should trigger multiple patterns: {len(theater_patterns)}"

        pattern_types = [p.pattern_type for p in theater_patterns]
        assert any('metric' in pt or 'correlation' in pt for pt in pattern_types), "Should detect metric-related theater patterns"

        # High severity patterns should be detected
        high_severity_patterns = [p for p in theater_patterns if p.severity >= 0.7]
        assert len(high_severity_patterns) >= 1, f"Should detect high-severity theater patterns: {[p.pattern_type for p in high_severity_patterns]}"

        # Detector modules should flag as theater
        assert detector_results['overall_theater_detected'] is True, "Detector modules should flag theater"
        assert detector_results['overall_confidence'] >= 0.6, f"Theater detection confidence should be reasonable: {detector_results['overall_confidence']}"

        # Reality validation should fail
        assert validation_result.is_genuine is False, "Reality validation should reject theater"
        assert validation_result.confidence < 0.7, f"Validation confidence should be low for theater: {validation_result.confidence}"

        # Evidence should still be collected but flagged
        assert change_evidence.verification_status == 'pending', "Evidence should be collected even for theater"

        return {
            'theater_patterns': len(theater_patterns),
            'high_severity_patterns': len(high_severity_patterns),
            'detector_theater': detector_results['overall_theater_detected'],
            'validation_genuine': validation_result.is_genuine,
            'validation_confidence': validation_result.confidence
        }

    def test_mixed_scenario_pipeline(self, theater_detector, validation_engine, evidence_collector):
        """Test pipeline with mixed genuine and theater elements."""

        # Mixed scenario: some genuine improvements + some theater
        before_metrics = QualityMetrics(
            cyclomatic_complexity=18.0,
            code_coverage=0.7,
            test_count=35,
            performance_score=70.0,
            security_score=75.0,
            maintainability_index=65.0,
            technical_debt_ratio=0.35
        )

        mixed_after_metrics = QualityMetrics(
            cyclomatic_complexity=15.0,  # Reasonable improvement
            code_coverage=0.85,  # Good improvement
            test_count=38,  # Reasonable test addition
            performance_score=80.0,  # Reasonable improvement
            security_score=85.0,  # Good improvement
            maintainability_index=85.0,  # Suspiciously high improvement
            technical_debt_ratio=0.25  # Good improvement
        )

        mixed_changes = [
            {
                'file_path': 'src/core/processor.py',
                'diff': '''
- def process_items(items):
-     result = []
-     for item in items:
-         if validate_item(item):
-             result.append(transform_item(item))
-     return result

+ def process_items(items):
+     return [transform_item(item) for item in items if validate_item(item)]
                ''',
                'lines_added': 2,
                'lines_removed': 6
            },
            {
                'file_path': 'src/utils/helpers.py',
                'diff': '''
+ # Comprehensive documentation for utility functions
+ # This module provides essential helper functions
+ # All functions are thoroughly tested and documented
+
  def existing_function():
+     # This function performs important operations
      pass
                ''',
                'lines_added': 6,
                'lines_removed': 0
            }
        ]

        # Step 1: Theater detection
        theater_patterns = theater_detector.analyze_change_set(
            before_metrics,
            mixed_after_metrics,
            mixed_changes,
            'mixed_module'
        )

        # Step 2: Reality validation
        reality_before = self._convert_to_code_metrics(before_metrics)
        reality_after = self._convert_to_code_metrics(mixed_after_metrics)

        validation_result = validation_engine.validate_completion_claim(
            reality_before,
            reality_after,
            "Code optimization and documentation enhancement",
            mixed_changes,
            ["code quality improvement", "documentation enhancement", "performance optimization"]
        )

        # Assertions for mixed scenario
        # Should detect some theater but not high severity
        assert len(theater_patterns) >= 1, "Mixed scenario should detect some theater patterns"

        # Should have moderate confidence scores
        theater_report = theater_detector.generate_theater_report(theater_patterns)
        assert theater_report['status'] in ['LOW_THEATER_RISK', 'MODERATE_THEATER_RISK'], "Mixed scenario should show moderate risk"

        # Reality validation might be borderline
        assert validation_result.confidence >= 0.4, "Mixed scenario should have moderate confidence"

        return {
            'theater_patterns': len(theater_patterns),
            'theater_risk': theater_report['status'],
            'validation_confidence': validation_result.confidence
        }

    def test_comprehensive_audit_package_creation(self, evidence_collector):
        """Test creation of comprehensive audit package."""

        # Create multiple evidence items
        evidence_items = []

        # Code change evidence
        code_evidence = evidence_collector.collect_code_change_evidence(
            {
                'files': [{'file_path': 'src/test.py', 'diff': 'test diff'}],
                'change_type': 'improvement',
                'lines_changed': 10
            },
            'commit_123',
            'test_module'
        )
        evidence_items.append(code_evidence)

        # Metric improvement evidence
        metric_evidence = evidence_collector.collect_metric_improvement_evidence(
            {'complexity': 15.0, 'coverage': 0.7},
            {'complexity': 12.0, 'coverage': 0.85},
            {'improvement_type': 'genuine', 'confidence': 0.8},
            'test_module'
        )
        evidence_items.append(metric_evidence)

        # Test result evidence
        test_evidence = evidence_collector.collect_test_result_evidence(
            {
                'total': 50,
                'passed': 48,
                'failed': 2,
                'framework': 'pytest',
                'execution_time': 5.2
            },
            {
                'percentage': 85.0,
                'lines_covered': 850,
                'lines_total': 1000
            },
            'test_module'
        )
        evidence_items.append(test_evidence)

        # Security scan evidence
        security_evidence = evidence_collector.collect_security_scan_evidence(
            {
                'vulnerabilities': [],
                'security_score': 90,
                'tool_version': 'semgrep-1.0.0'
            },
            'semgrep',
            'test_module'
        )
        evidence_items.append(security_evidence)

        # Create audit package
        audit_package = evidence_collector.create_audit_package(
            evidence_items,
            'Integration Test Audit',
            {
                'overall_quality': 85.0,
                'test_coverage': 85.0,
                'security_score': 90.0,
                'maintainability': 80.0
            },
            {
                'theater_detected': False,
                'validation_passed': True,
                'confidence': 0.85
            }
        )

        # Verify audit package
        assert audit_package.package_id is not None, "Audit package should have ID"
        assert len(audit_package.evidence_items) == 4, "Should include all evidence items"
        assert len(audit_package.compliance_certifications) > 0, "Should include compliance certifications"
        assert audit_package.digital_signature is not None, "Should be digitally signed"

        # Verify chain integrity
        assert audit_package.chain_verification['meets_threshold'] is True, "Chain integrity should meet threshold"

        # Check compliance assessments
        nasa_compliance = next(
            (cert for cert in audit_package.compliance_certifications if cert['standard'] == 'NASA-POT10'),
            None
        )
        assert nasa_compliance is not None, "Should include NASA POT10 compliance assessment"
        assert nasa_compliance['score'] > 0.5, f"NASA compliance score should be reasonable: {nasa_compliance['score']}"

        return audit_package

    def test_defense_readiness_validation(self, evidence_collector):
        """Test validation of defense industry readiness."""

        # Create audit package with high-quality evidence
        evidence_items = []

        # Comprehensive evidence collection
        for i in range(6):  # Exceed minimum evidence requirements
            evidence = evidence_collector.collect_code_change_evidence(
                {
                    'files': [{'file_path': f'src/module_{i}.py', 'diff': f'improvement {i}'}],
                    'change_type': 'structural_improvement',
                    'lines_changed': 20 + i
                },
                f'commit_{i}',
                f'module_{i}'
            )
            evidence_items.append(evidence)

        # High-quality metrics
        quality_metrics = {
            'maintainability_index': 85.0,
            'test_coverage': 90.0,
            'security_score': 95.0,
            'code_quality': 88.0,
            'performance_score': 85.0
        }

        validation_results = {
            'theater_detected': False,
            'validation_passed': True,
            'confidence': 0.95,
            'performance_validated': True,
            'security_validated': True,
            'input_validation_tested': True
        }

        audit_package = evidence_collector.create_audit_package(
            evidence_items,
            'Defense Readiness Validation',
            quality_metrics,
            validation_results
        )

        # Generate compliance report
        compliance_report = evidence_collector.generate_compliance_report(audit_package.package_id)

        # Verify defense readiness
        overall_compliance = compliance_report['overall_compliance']
        assert overall_compliance['defense_ready'] is True, "Should be defense ready"
        assert overall_compliance['overall_score'] >= 0.8, f"Overall compliance score should be high: {overall_compliance['overall_score']}"

        # Check specific standards
        nasa_status = overall_compliance['standards_status'].get('NASA-POT10', {})
        assert nasa_status.get('score', 0) >= 0.8, f"NASA POT10 score should be high: {nasa_status.get('score', 0)}"

        # Verify risk assessment
        risk_assessment = compliance_report['risk_assessment']
        assert risk_assessment['deployment_recommendation'] == 'APPROVE', f"Should approve deployment: {risk_assessment['deployment_recommendation']}"

        return compliance_report

    def test_pipeline_accuracy_measurement(self, theater_detector, validation_engine, detector_orchestrator):
        """Test overall pipeline accuracy on diverse scenarios."""

        test_scenarios = [
            {
                'name': 'genuine_algorithmic_improvement',
                'expected_theater': False,
                'theater_severity_threshold': 0.6
            },
            {
                'name': 'comment_inflation_theater',
                'expected_theater': True,
                'theater_severity_threshold': 0.7
            },
            {
                'name': 'test_padding_theater',
                'expected_theater': True,
                'theater_severity_threshold': 0.8
            },
            {
                'name': 'mixed_improvement_with_theater',
                'expected_theater': True,
                'theater_severity_threshold': 0.5
            }
        ]

        results = []

        for scenario in test_scenarios:
            # Generate appropriate test data for each scenario
            test_data = self._generate_scenario_data(scenario['name'])

            # Run complete pipeline
            theater_patterns = theater_detector.analyze_change_set(
                test_data['before_metrics'],
                test_data['after_metrics'],
                test_data['changes'],
                scenario['name']
            )

            detector_results = detector_orchestrator.run_all_detectors(
                test_data['code_data'],
                test_data['metrics_data']
            )

            reality_result = validation_engine.validate_completion_claim(
                self._convert_to_code_metrics(test_data['before_metrics']),
                self._convert_to_code_metrics(test_data['after_metrics']),
                test_data['description'],
                test_data['changes'],
                test_data['claims']
            )

            # Determine if theater was detected
            theater_detected = (
                len([p for p in theater_patterns if p.severity >= scenario['theater_severity_threshold']]) > 0 or
                detector_results['overall_theater_detected'] or
                not reality_result.is_genuine
            )

            correct = theater_detected == scenario['expected_theater']

            results.append({
                'scenario': scenario['name'],
                'expected_theater': scenario['expected_theater'],
                'detected_theater': theater_detected,
                'correct': correct,
                'theater_patterns': len(theater_patterns),
                'validation_confidence': reality_result.confidence
            })

        # Calculate overall accuracy
        correct_count = sum(1 for r in results if r['correct'])
        accuracy = correct_count / len(results)

        # Should achieve >90% accuracy target
        assert accuracy >= 0.9, f"Pipeline accuracy {accuracy:.1%} below 90% target. Results: {results}"

        return accuracy, results

    def _convert_to_code_metrics(self, quality_metrics: QualityMetrics) -> CodeMetrics:
        """Convert QualityMetrics to CodeMetrics for validation engine."""
        return CodeMetrics(
            lines_of_code=1000,  # Default value
            cyclomatic_complexity=quality_metrics.cyclomatic_complexity,
            cognitive_complexity=quality_metrics.cyclomatic_complexity * 1.2,
            maintainability_index=quality_metrics.maintainability_index,
            halstead_metrics={},
            code_coverage=quality_metrics.code_coverage,
            test_coverage_quality=quality_metrics.code_coverage,
            performance_metrics={'score': quality_metrics.performance_score},
            security_score=quality_metrics.security_score,
            documentation_ratio=0.2
        )

    def _generate_scenario_data(self, scenario_name: str) -> dict:
        """Generate test data for specific scenarios."""

        if scenario_name == 'genuine_algorithmic_improvement':
            return {
                'before_metrics': QualityMetrics(20.0, 0.6, 30, 60.0, 70.0, 60.0, 0.4),
                'after_metrics': QualityMetrics(15.0, 0.8, 35, 80.0, 85.0, 75.0, 0.3),
                'changes': [
                    {
                        'file_path': 'src/algorithm.py',
                        'diff': 'replaced inefficient algorithm with optimized version',
                        'lines_added': 10,
                        'lines_removed': 15
                    }
                ],
                'code_data': {'files_changed': [{}], 'total_changes': 1},
                'metrics_data': {'complexity_before': 20.0, 'complexity_after': 15.0},
                'description': 'Optimized core algorithm for better performance',
                'claims': ['performance improvement', 'algorithmic optimization']
            }

        elif scenario_name == 'comment_inflation_theater':
            return {
                'before_metrics': QualityMetrics(15.0, 0.7, 25, 70.0, 80.0, 65.0, 0.3),
                'after_metrics': QualityMetrics(15.0, 0.7, 25, 70.0, 80.0, 90.0, 0.3),
                'changes': [
                    {
                        'file_path': 'src/utils.py',
                        'diff': '''
+ # This is a comprehensive comment
+ # explaining the obvious functionality
+ # of this simple function
  def simple_function():
      pass
                        ''',
                        'lines_added': 3,
                        'lines_removed': 0
                    }
                ],
                'code_data': {'files_changed': [{}], 'total_changes': 1},
                'metrics_data': {'complexity_before': 15.0, 'complexity_after': 15.0},
                'description': 'Enhanced documentation and code clarity',
                'claims': ['maintainability improvement', 'documentation enhancement']
            }

        elif scenario_name == 'test_padding_theater':
            return {
                'before_metrics': QualityMetrics(15.0, 0.6, 20, 70.0, 80.0, 65.0, 0.3),
                'after_metrics': QualityMetrics(15.0, 0.9, 25, 70.0, 80.0, 65.0, 0.3),
                'changes': [
                    {
                        'file_path': 'tests/test_padding.py',
                        'diff': '''
+ def test_trivial_1():
+     assert True
+
+ def test_trivial_2():
+     assert 1 == 1
                        ''',
                        'lines_added': 5,
                        'lines_removed': 0
                    }
                ],
                'code_data': {'files_changed': [{}], 'total_changes': 1},
                'metrics_data': {'coverage_before': 0.6, 'coverage_after': 0.9},
                'description': 'Improved test coverage with additional tests',
                'claims': ['test coverage improvement']
            }

        else:  # mixed_improvement_with_theater
            return {
                'before_metrics': QualityMetrics(18.0, 0.65, 30, 65.0, 75.0, 60.0, 0.35),
                'after_metrics': QualityMetrics(15.0, 0.85, 32, 75.0, 85.0, 85.0, 0.25),
                'changes': [
                    {
                        'file_path': 'src/improvement.py',
                        'diff': 'genuine algorithmic improvement',
                        'lines_added': 5,
                        'lines_removed': 8
                    },
                    {
                        'file_path': 'src/theater.py',
                        'diff': 'superficial renaming and comments',
                        'lines_added': 10,
                        'lines_removed': 2
                    }
                ],
                'code_data': {'files_changed': [{}, {}], 'total_changes': 2},
                'metrics_data': {'complexity_before': 18.0, 'complexity_after': 15.0},
                'description': 'Mixed genuine improvements and cosmetic changes',
                'claims': ['performance improvement', 'code quality enhancement']
            }

if __name__ == '__main__':
    # Run integration accuracy test
    test_instance = TestTheaterDetectionIntegration()

    try:
        # Create test instances
        detector = EnterpriseTheaterDetector()
        engine = RealityValidationEngine()
        orchestrator = EnterpriseDetectorOrchestrator()

        accuracy, results = test_instance.test_pipeline_accuracy_measurement(detector, engine, orchestrator)
        print(f"\nIntegration Pipeline Accuracy: {accuracy:.1%}")
        print("\nDetailed Results:")
        for result in results:
            status = "CORRECT" if result['correct'] else "INCORRECT"
            print(f"  {result['scenario']}: Expected Theater={result['expected_theater']}, "
                  f"Detected={result['detected_theater']}, Status={status}")

        # Overall system validation
        if accuracy >= 0.9:
            print(f"\n[SUCCESS] Theater detection system achieves {accuracy:.1%} accuracy (>90% target)")
        else:
            print(f"\n[FAILURE] Theater detection system only achieves {accuracy:.1%} accuracy (<90% target)")

    except Exception as e:
        print(f"Integration test failed: {e}")

    # Run full test suite
    pytest.main([__file__, '-v'])