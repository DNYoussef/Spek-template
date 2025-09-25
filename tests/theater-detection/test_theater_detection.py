from src.constants.base import MAXIMUM_FUNCTION_LENGTH_LINES, NASA_POT10_TARGET_COMPLIANCE_THRESHOLD, TAKE_PROFIT_PERCENTAGE

import unittest
import json
import tempfile
import shutil
from datetime import datetime, timedelta
from pathlib import Path
from unittest.mock import Mock, patch
import sys
import os

# Add src directory to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'src'))

from theater_detection.theater_detector import TheaterDetector, TheaterPattern, RealityValidationResult
from theater_detection.continuous_monitor import ContinuousTheaterMonitor, MonitoringAlert, StakeholderUpdate
from theater_detection.reality_validator import RealityValidationSystem, RealityAssessment, EvidenceItem

class TestTheaterDetector(unittest.TestCase):
    """Test theater detection functionality"""
    
    def setUp(self):
        self.temp_dir = tempfile.mkdtemp()
        self.detector = TheaterDetector(self.temp_dir)
    
    def tearDown(self):
        shutil.rmtree(self.temp_dir)
    
    def test_performance_theater_detection(self):
        """Test detection of performance theater patterns"""
        # Mock metrics with suspicious performance improvements
        current_metrics = {
            "benchmark_results": {
                "test_1": MAXIMUM_FUNCTION_LENGTH_LINES,
                "test_2": 101,
                "test_3": 102
            },
            "cache_performance": {
                "hit_rate": 0.99,  # Suspiciously high
                "efficiency": 0.98
            },
            "execution_times": {
                "operation_1": 10,  # Significant improvement from baseline
                "operation_2": 8
            }
        }
        
        # Create fake baseline
        baseline = {
            "benchmark_results": {
                "test_1": 200,
                "test_2": 201,
                "test_3": 202
            },
            "execution_times": {
                "operation_1": 50,  # 80% improvement - suspicious
                "operation_2": 20
            }
        }
        
        self.detector._save_baseline_metrics("performance", baseline)
        
        patterns = self.detector.detect_performance_theater(current_metrics)
        
        # Should detect suspicious patterns
        self.assertGreater(len(patterns), 0)
        pattern_types = [p.pattern_type for p in patterns]
        self.assertIn("artificial_cache_inflation", pattern_types)
        self.assertIn("baseline_manipulation", pattern_types)
    
    def test_quality_theater_detection(self):
        """Test detection of quality theater patterns"""
        current_metrics = {
            "test_coverage": {
                "line_coverage": NASA_POT10_TARGET_COMPLIANCE_THRESHOLD,  # High coverage increase
                "test_count": 157  # Minimal test increase
            },
            "complexity_metrics": {
                "cyclomatic": 3.8,
                "cognitive": 3.6,
                "maintainability": 0.80
            }
        }
        
        baseline = {
            "test_coverage": {
                "line_coverage": 0.80,  # 15% increase with only 2 new tests
                "test_count": 155
            },
            "complexity_metrics": {
                "cyclomatic": 4.0,
                "cognitive": 3.8,
                "maintainability": 0.78
            }
        }
        
        self.detector._save_baseline_metrics("quality", baseline)
        
        patterns = self.detector.detect_quality_theater(current_metrics)
        
        # Should detect shallow test coverage pattern
        pattern_types = [p.pattern_type for p in patterns]
        self.assertIn("shallow_test_coverage", pattern_types)
    
    def test_reality_validation(self):
        """Test reality validation system"""
        category = "performance"
        current_metrics = {
            "execution_times": {"test": 80},
            "memory_usage": 450,
            "benchmark_results": {"speed": 1.2, "efficiency": 1.1, "throughput": 1.3}
        }
        
        baseline = {
            "execution_times": {"test": 100},
            "memory_usage": 512,
            "benchmark_results": {"speed": 1.0, "efficiency": 1.0, "throughput": 1.0}
        }
        
        self.detector._save_baseline_metrics(category, baseline)
        
        validation = self.detector.validate_reality(category, current_metrics)
        
        self.assertIsInstance(validation, RealityValidationResult)
        self.assertEqual(validation.category, category)
        self.assertGreaterEqual(validation.validation_score, 0.0)
        self.assertLessEqual(validation.validation_score, 1.0)
    
    def test_comprehensive_theater_detection(self):
        """Test comprehensive theater detection across all categories"""
        # This is an integration test
        result = self.detector.run_comprehensive_theater_detection()
        
        self.assertIn("theater_detection_deployment", result)
        self.assertIn("continuous_monitoring", result)
        self.assertIn("reality_validation_evidence", result)
        
        # Verify deployment status
        deployment = result["theater_detection_deployment"]
        self.assertEqual(deployment["system_status"], "deployed")
        self.assertEqual(deployment["detection_categories"], 5)
        self.assertEqual(deployment["monitoring_coverage"], "100%")
        
        # Verify monitoring is active for all categories
        monitoring = result["continuous_monitoring"]
        for category in ["performance", "quality", "security", "compliance", "architecture"]:
            self.assertEqual(monitoring[f"{category}_monitoring"], "active")

class TestContinuousMonitor(unittest.TestCase):
    """Test continuous theater monitoring system"""
    
    def setUp(self):
        self.temp_dir = tempfile.mkdtemp()
        self.monitor = ContinuousTheaterMonitor(self.temp_dir)
    
    def tearDown(self):
        shutil.rmtree(self.temp_dir)
    
    def test_monitoring_configuration(self):
        """Test monitoring configuration setup"""
        config = self.monitor.config
        
        # Verify all categories are configured
        categories = ["performance", "quality", "security", "compliance", "architecture"]
        for category in categories:
            self.assertIn(category, config["monitoring_intervals"])
            self.assertGreater(config["monitoring_intervals"][category], 0)
        
        # Verify alert thresholds are set
        self.assertIn("theater_patterns_detected", config["alert_thresholds"])
        self.assertIn("critical_theater_patterns", config["alert_thresholds"])
    
    def test_alert_processing(self):
        """Test alert processing functionality"""
        # Create mock theater patterns
        from theater_detector import TheaterPattern
        patterns = [
            TheaterPattern(
                category="performance",
                pattern_type="critical_theater_pattern",
                confidence=0.90,
                severity="critical",
                evidence=["Test evidence"],
                baseline_comparison={},
                recommendation="Test recommendation",
                detected_at=datetime.now()
            )
        ]
        
        # Create mock reality validation
        reality_validation = RealityValidationResult(
            category="performance",
            genuine_improvement=False,
            improvement_magnitude=0.10,
            validation_score=0.45,  # Low score
            evidence_quality=0.60,
            theater_risk=0.50,  # High risk
            validation_details={}
        )
        
        initial_alert_count = len(self.monitor.alerts)
        self.monitor._process_category_alerts("performance", patterns, reality_validation)
        
        # Should generate multiple alerts
        self.assertGreater(len(self.monitor.alerts), initial_alert_count)
        
        # Verify critical alert was generated
        critical_alerts = [a for a in self.monitor.alerts if a.severity == "critical"]
        self.assertGreater(len(critical_alerts), 0)
    
    def test_stakeholder_update_generation(self):
        """Test stakeholder update generation"""
        initial_update_count = len(self.monitor.stakeholder_updates)
        
        # Generate weekly update
        self.monitor._generate_weekly_stakeholder_update()
        
        # Verify update was created
        self.assertGreater(len(self.monitor.stakeholder_updates), initial_update_count)
        
        latest_update = self.monitor.stakeholder_updates[-1]
        self.assertEqual(latest_update.update_type, "weekly")
        self.assertIn(latest_update.confidence_level, ["high", "medium", "low"])

class TestRealityValidator(unittest.TestCase):
    """Test reality validation system"""
    
    def setUp(self):
        self.temp_dir = tempfile.mkdtemp()
        self.validator = RealityValidationSystem(self.temp_dir)
    
    def tearDown(self):
        shutil.rmtree(self.temp_dir)
    
    def test_phase_1_validation(self):
        """Test Phase 1 file consolidation validation"""
        evidence = {
            "file_consolidation": {
                "before_count": 75,
                "after_count": 65,
                "reduction_percentage": 0.13,
                "maintainability_improvement": 0.12
            },
            "test_validation": {
                "all_tests_pass": True,
                "test_failures": 0
            },
            "architecture_metrics": {
                "coupling_improvement": 0.8,
                "cohesion_improvement": 0.10
            }
        }
        
        assessment = self.validator._validate_phase_1_file_consolidation(evidence)
        
        self.assertIsInstance(assessment, RealityAssessment)
        self.assertEqual(assessment.claim_id, "phase_1_consolidation")
        self.assertEqual(assessment.category, "architecture")
        self.assertIn(assessment.validation_verdict, ["GENUINE", "MOSTLY_GENUINE", "INCONCLUSIVE", "LIKELY_THEATER", "THEATER"])
    
    def test_phase_3_validation(self):
        """Test Phase 3 god object decomposition validation"""
        evidence = {
            "nasa_compliance": {
                "current_score": NASA_POT10_TARGET_COMPLIANCE_THRESHOLD,
                "baseline_score": 0.78,
                "improvement_score": 0.17,
                "rules_implemented": 3
            },
            "god_object_analysis": {
                "before_count": 42,
                "after_count": 25,
                "reduction_percentage": 0.40,
                "complexity_improvement": 0.25
            },
            "refactoring_operations": {
                "operations": [{"type": "extract_method"}, {"type": "extract_class"}],
                "syntax_only_changes": 0
            },
            "code_quality_metrics": {
                "overall_improvement": 0.20,
                "before_after": {"maintainability": {"before": 0.65, "after": 0.80}}
            }
        }
        
        assessment = self.validator._validate_phase_3_god_object_decomposition(evidence)
        
        self.assertEqual(assessment.claim_id, "phase_3_decomposition")
        self.assertEqual(assessment.category, "compliance")
        self.assertGreaterEqual(assessment.reality_score, 0.7)  # Should be high for good evidence
        self.assertEqual(assessment.validation_verdict, "GENUINE")
    
    def test_theater_risk_identification(self):
        """Test theater risk factor identification"""
        evidence = {
            "god_object_analysis": {
                "reduction_percentage": 0.50,  # High reduction
                "complexity_improvement": 0.2,  # Low complexity improvement - theater risk
                "coupling_increase": TAKE_PROFIT_PERCENTAGE  # Coupling got worse - theater risk
            },
            "nasa_compliance": {
                "improvement_score": TAKE_PROFIT_PERCENTAGE,  # High improvement
                "rules_implemented": 1  # Low rule implementation - theater risk
            }
        }
        
        risks = self.validator._identify_decomposition_theater_risks(evidence)
        
        # Should identify theater risks
        self.assertGreater(len(risks), 0)
        risk_text = " ".join(risks).lower()
        self.assertIn("theater", risk_text)
    
    def test_system_wide_validation(self):
        """Test comprehensive system-wide validation"""
        # Create mock evidence files
        phase1_evidence = {
            "consolidation_metrics": {"files_before": 75, "files_after": 65, "reduction_percentage": 0.13},
            "quality_improvements": {"maintainability_delta": 0.12},
            "validation_results": {"all_tests_passed": True, "test_failures": 0},
            "architecture_improvements": {"coupling_improvement": 0.8}
        }
        
        phase3_evidence = {
            "quantified_benefits": {
                "nasa_compliance": {"overall_compliance_score": 0.98, "rule_2_violations_eliminated": 2},
                "code_quality": {"overall_improvement": 0.25}
            },
            "metrics_before_vs_after": {
                "unified_analyzer_py": {
                    "after": {"god_object_score": 6}
                }
            },
            "refactoring_operations_executed": [
                {"operation_id": "extract_method_1"},
                {"operation_id": "extract_class_1"}
            ]
        }
        
        # Save mock evidence files
        artifacts_dir = Path(self.temp_dir)
        with open(artifacts_dir / "phase1-surgical-elimination-evidence.json", 'w') as f:
            json.dump(phase1_evidence, f)
        
        with open(artifacts_dir / "phase3_god_object_decomposition_complete.json", 'w') as f:
            json.dump(phase3_evidence, f)
        
        # Run system-wide validation
        result = self.validator.validate_system_wide_reality()
        
        # Verify comprehensive results
        self.assertIn("system_reality_assessment", result)
        self.assertIn("phase_assessments", result)
        self.assertIn("success_criteria_assessment", result)
        self.assertIn("stakeholder_confidence", result)
        
        # Verify system verdict
        system_assessment = result["system_reality_assessment"]
        self.assertIn("system_verdict", system_assessment)
        self.assertGreaterEqual(system_assessment["overall_reality_score"], 0.0)
        self.assertLessEqual(system_assessment["overall_reality_score"], 1.0)

class TestIntegration(unittest.TestCase):
    """Integration tests for complete theater detection system"""
    
    def setUp(self):
        self.temp_dir = tempfile.mkdtemp()
    
    def tearDown(self):
        shutil.rmtree(self.temp_dir)
    
    def test_complete_loop_3_deployment(self):
        """Test complete Loop 3 theater detection deployment"""
        # Initialize all components
        detector = TheaterDetector(self.temp_dir)
        monitor = ContinuousTheaterMonitor(self.temp_dir)
        validator = RealityValidationSystem(self.temp_dir)
        
        # Test theater detection
        theater_results = detector.run_comprehensive_theater_detection()
        self.assertEqual(theater_results["theater_detection_deployment"]["system_status"], "deployed")
        
        # Test monitoring system status
        monitor_status = monitor.get_monitoring_status()
        self.assertIn("system_active", monitor_status)
        self.assertEqual(monitor_status["categories_monitored"], 5)
        
        # Test reality validation
        validation_results = validator.validate_system_wide_reality()
        self.assertIn("system_verdict", validation_results["system_reality_assessment"])
        
        # Verify Loop 3 success criteria
        success_criteria = validation_results["success_criteria_assessment"]
        self.assertTrue(success_criteria["all_categories_deployed"])
        self.assertTrue(success_criteria["stakeholder_transparency"])
        
        # Verify theater detection summary
        theater_summary = validation_results["theater_detection_summary"]
        self.assertIn("theater_patterns_detected", theater_summary)
        self.assertIn("reality_validation_success", theater_summary)
    
    def test_stakeholder_transparency(self):
        """Test stakeholder transparency and confidence reporting"""
        validator = RealityValidationSystem(self.temp_dir)
        
        # Run system validation to generate stakeholder reports
        results = validator.validate_system_wide_reality()
        
        # Verify stakeholder confidence assessment
        confidence = results["stakeholder_confidence"]
        self.assertIn(confidence, ["high", "medium", "low"])
        
        # Verify transparency elements are present
        self.assertIn("recommendations", results)
        self.assertIn("evidence_quality_assessment", results)
        self.assertGreater(len(results["recommendations"]), 0)
    
    def test_continuous_monitoring_readiness(self):
        """Test continuous monitoring system readiness"""
        validator = RealityValidationSystem(self.temp_dir)
        results = validator.validate_system_wide_reality()
        
        monitoring_readiness = results["continuous_monitoring_readiness"]
        
        # Verify all monitoring components are ready
        self.assertTrue(monitoring_readiness["baseline_established"])
        self.assertTrue(monitoring_readiness["monitoring_thresholds_set"])
        self.assertTrue(monitoring_readiness["alert_system_active"])
        self.assertTrue(monitoring_readiness["stakeholder_reporting_enabled"])

if __name__ == "__main__":
    # Run all tests
    unittest.main(verbosity=2)