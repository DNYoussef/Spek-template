from lib.shared.utilities import path_exists
from src.constants.base import MAXIMUM_FUNCTION_PARAMETERS, MAXIMUM_RETRY_ATTEMPTS

import unittest
import json
import tempfile
import shutil
from pathlib import Path
from datetime import datetime, timedelta
import sys
import os

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'src'))

from sixsigma.sixsigma_scorer import SixSigmaScorer, DefectRecord, ProcessStage, create_sample_data_scenario
from sixsigma.telemetry_config import TelemetryCollector, SixSigmaTelemetryManager, TelemetryDataPoint

class TestSixSigmaIntegration(unittest.TestCase):
    """Integration tests for Six Sigma components"""
    
    def setUp(self):
        """Set up test environment"""
        self.test_dir = tempfile.mkdtemp()
        self.scorer = create_sample_data_scenario()
        
    def tearDown(self):
        """Clean up test environment"""
        shutil.rmtree(self.test_dir, ignore_errors=True)
    
    def test_dpmo_calculation_realistic(self):
        """Test DPMO calculation with realistic scenario"""
        # Theater-free scenario: Real defects in real process
        scorer = SixSigmaScorer()
        
        # Add realistic process stages for web application
        scorer.add_process_stage("Requirements", opportunities=50, defects=2, target_yield=0.96)
        scorer.add_process_stage("Design", opportunities=100, defects=8, target_yield=0.92)
        scorer.add_process_stage("Implementation", opportunities=1000, defects=45, target_yield=0.90)
        scorer.add_process_stage("Testing", opportunities=200, defects=5, target_yield=0.95)
        scorer.add_process_stage("Deployment", opportunities=25, defects=0, target_yield=0.98)
        
        # Calculate DPMO
        dpmo = scorer.calculate_dpmo()
        
        # Expected: (2+8+45+5+0) * 1, 000, 000 / (50+100+1000+200+25) = 43, 636 DPMO
        expected_dpmo = (2+8+45+5+0) * 1_000_000 / (50+100+1000+200+25)
        
        self.assertAlmostEqual(dpmo, expected_dpmo, delta=100)
        self.assertGreater(dpmo, 0)
        self.assertLess(dpmo, 100000)  # Should be reasonable
        
        print(f"Realistic DPMO: {dpmo:,.0f} (Expected: {expected_dpmo:,.0f})")
    
    def test_rty_calculation_theater_free(self):
        """Test RTY calculation without theater metrics"""
        # Calculate RTY for sample scenario
        rty = self.scorer.calculate_rty()
        
        # RTY should be product of all stage yields
        expected_yields = []
        for stage in self.scorer.process_stages:
            expected_yields.append(stage.yield_rate)
        
        expected_rty = 1.0
        for yield_rate in expected_yields:
            expected_rty *= yield_rate
        
        self.assertAlmostEqual(rty, expected_rty, places=4)
        self.assertGreater(rty, 0)
        self.assertLessEqual(rty, 1.0)
        
        print(f"RTY: {rty:.2%} (Expected: {expected_rty:.2%})")
    
    def test_sigma_level_calculation(self):
        """Test sigma level calculation from DPMO"""
        test_cases = [
            (0, 6.0),      # Perfect quality
            (3.4, 6.0),    # 6-sigma (approx)
            (233, 5.0),    # 5-sigma (approx)
            (6210, 4.0),   # 4-sigma
            (66807, 3.0),  # 3-sigma
            (500000, 1.0), # 1-sigma (approx)
        ]
        
        scorer = SixSigmaScorer()
        
        for dpmo, expected_sigma in test_cases:
            sigma = scorer.calculate_sigma_level(dpmo)
            print(f"DPMO: {dpmo:,} -> Sigma: {sigma} (Expected: {expected_sigma})")
            
            # Allow some tolerance for approximation
            self.assertAlmostEqual(sigma, expected_sigma, delta=0.5)
    
    def test_comprehensive_metrics_integration(self):
        """Test complete metrics calculation integration"""
        metrics = self.scorer.calculate_comprehensive_metrics()
        
        # Verify all metrics are calculated
        self.assertIsNotNone(metrics.dpmo)
        self.assertIsNotNone(metrics.rty)
        self.assertIsNotNone(metrics.sigma_level)
        self.assertIsNotNone(metrics.process_capability)
        
        # Verify metric ranges
        self.assertGreaterEqual(metrics.dpmo, 0)
        self.assertGreaterEqual(metrics.rty, 0)
        self.assertLessEqual(metrics.rty, 1.0)
        self.assertGreaterEqual(metrics.sigma_level, 0)
        self.assertLessEqual(metrics.sigma_level, 6.0)
        
        # Verify data structures
        self.assertIsInstance(metrics.defect_categories, dict)
        self.assertIsInstance(metrics.stage_yields, dict)
        self.assertIsInstance(metrics.improvement_opportunities, list)
        
        print(f"Comprehensive Metrics:")
        print(f"  DPMO: {metrics.dpmo:,.0f}")
        print(f"  RTY: {metrics.rty:.2%}")
        print(f"  Sigma Level: {metrics.sigma_level}")
        print(f"  Process Capability: {metrics.process_capability}")
    
    def test_report_generation(self):
        """Test artifact generation"""
        report_file = self.scorer.generate_report(self.test_dir)
        
        # Verify files were created
        self.assertTrue(path_exists(report_file))
        
        # Verify JSON report content
        with open(report_file, 'r') as f:
            report_data = json.load(f)
        
        # Check required fields
        required_fields = ['dpmo', 'rty', 'sigma_level', 'process_capability', 
                            'defect_categories', 'stage_yields', 'improvement_opportunities']
        
        for field in required_fields:
            self.assertIn(field, report_data)
        
        # Verify CSV and HTML files exist
        base_name = Path(report_file).stem
        timestamp = base_name.split('_')[-1]
        
        csv_file = Path(self.test_dir) / f"sixsigma_summary_{timestamp}.csv"
        html_file = Path(self.test_dir) / f"sixsigma_report_{timestamp}.html"
        
        self.assertTrue(csv_file.exists())
        self.assertTrue(html_file.exists())
        
        print(f"Generated reports:")
        print(f"  JSON: {report_file}")
        print(f"  CSV: {csv_file}")
        print(f"  HTML: {html_file}")
    
    def test_theater_detection_integration(self):
        """Test theater detection with quality correlation"""
        # Create scenario with obvious theater
        theater_scorer = SixSigmaScorer()
        
        # High activity, low quality (theater indicators)
        theater_scorer.add_process_stage("Implementation", opportunities=1000, defects=200, target_yield=0.90)
        
        # Add many cosmetic defects (potential theater)
        for i in range(50):
            theater_scorer.add_defect("formatting", "cosmetic", "implementation", f"Style issue {i}")
        
        # Add critical defects (reality)
        theater_scorer.add_defect("security_vulnerability", "critical", "implementation", "SQL injection")
        theater_scorer.add_defect("data_loss", "critical", "implementation", "User data corruption")
        
        metrics = theater_scorer.calculate_comprehensive_metrics()
        
        # High defect count should result in poor sigma level
        self.assertLess(metrics.sigma_level, MAXIMUM_RETRY_ATTEMPTS.0)  # Below acceptable threshold
        self.assertGreater(len(metrics.improvement_opportunities), 0)
        
        # Should identify theater patterns
        cosmetic_count = metrics.defect_categories.get('cosmetic', 0)
        critical_count = metrics.defect_categories.get('critical', 0)
        
        self.assertGreater(cosmetic_count, critical_count * MAXIMUM_FUNCTION_PARAMETERS)  # Theater indicator
        
        print(f"Theater Detection Results:")
        print(f"  Cosmetic defects: {cosmetic_count}")
        print(f"  Critical defects: {critical_count}")
        print(f"  Sigma level: {metrics.sigma_level}")
        print(f"  Theater ratio: {cosmetic_count/max(critical_count, 1):.1f}")
    
    def test_telemetry_integration(self):
        """Test telemetry collection integration"""
        # Create telemetry collector
        collector = TelemetryCollector(self.scorer.config)
        
        # Collect some metrics
        collector.collect_metric("dpmo", 15000.0)
        collector.collect_metric("rty", 0.87)
        collector.collect_metric("sigma_level", 3.2)
        
        # Wait a moment for processing
        import time
        time.sleep(0.1)
        
        # Check data was collected
        self.assertGreater(len(collector.data_points), 0)
        
        # Test metrics summary
        summary = collector.get_metrics_summary(hours=1)
        
        self.assertIn("dpmo", summary)
        self.assertIn("rty", summary)
        self.assertIn("sigma_level", summary)
        
        print(f"Telemetry Summary: {summary}")
    
    def test_realistic_development_scenario(self):
        """Test realistic software development scenario"""
        # Simulate typical web application development
        dev_scorer = SixSigmaScorer()
        
        # Process stages based on SDLC
        dev_scorer.add_process_stage("Planning", opportunities=20, defects=1, target_yield=0.95)
        dev_scorer.add_process_stage("Analysis", opportunities=40, defects=3, target_yield=0.92)
        dev_scorer.add_process_stage("Design", opportunities=60, defects=8, target_yield=0.90)
        dev_scorer.add_process_stage("Coding", opportunities=800, defects=48, target_yield=0.88)
        dev_scorer.add_process_stage("Unit Testing", opportunities=150, defects=12, target_yield=0.92)
        dev_scorer.add_process_stage("Integration Testing", opportunities=100, defects=8, target_yield=0.90)
        dev_scorer.add_process_stage("System Testing", opportunities=80, defects=4, target_yield=0.95)
        dev_scorer.add_process_stage("UAT", opportunities=30, defects=1, target_yield=0.97)
        dev_scorer.add_process_stage("Deployment", opportunities=10, defects=0, target_yield=0.98)
        
        # Add realistic defects
        defects = [
            ("requirement_ambiguity", "major", "analysis", "Unclear user story acceptance criteria"),
            ("design_inconsistency", "minor", "design", "UI mockup doesn't match style guide"),
            ("logic_error", "major", "coding", "Incorrect calculation in price calculation"),
            ("null_pointer", "critical", "coding", "Unhandled null reference exception"),
            ("test_failure", "minor", "unit testing", "Edge case not covered in unit test"),
            ("integration_issue", "major", "integration testing", "API contract mismatch"),
            ("performance_issue", "major", "system testing", "Page load time exceeds 3 seconds"),
            ("usability_issue", "minor", "uat", "Confusing button placement"),
        ]
        
        for category, severity, stage, description in defects:
            dev_scorer.add_defect(category, severity, stage, description)
        
        # Calculate metrics
        metrics = dev_scorer.calculate_comprehensive_metrics()
        
        # Generate report
        report_file = dev_scorer.generate_report(self.test_dir)
        
        # Verify realistic results
        self.assertGreater(metrics.dpmo, 1000)  # Should have some defects
        self.assertLess(metrics.dpmo, 100000)   # But not too many
        self.assertGreater(metrics.rty, 0.5)    # RTY should be reasonable
        self.assertLess(metrics.rty, 1.0)       # But not perfect
        self.assertGreater(metrics.sigma_level, 1.0)  # Above minimum
        
        print(f"\nRealistic Development Scenario Results:")
        print(f"  DPMO: {metrics.dpmo:,.0f}")
        print(f"  RTY: {metrics.rty:.2%}")
        print(f"  Sigma Level: {metrics.sigma_level}")
        print(f"  Process Capability: {metrics.process_capability}")
        print(f"  Total Defects: {sum(metrics.defect_categories.values())}")
        print(f"  Improvement Opportunities: {len(metrics.improvement_opportunities)}")
        
        # Theater-free validation: Check if metrics correlate with reality
        total_defects = sum(metrics.defect_categories.values())
        total_opportunities = sum(stage.opportunities for stage in dev_scorer.process_stages)
        defect_rate = total_defects / total_opportunities
        
        # DPMO should correlate with actual defect rate
        expected_dpmo = defect_rate * 1_000_000
        dpmo_correlation = abs(metrics.dpmo - expected_dpmo) / expected_dpmo
        
        self.assertLess(dpmo_correlation, 0.1)  # Within MAXIMUM_FUNCTION_PARAMETERS% correlation
        
        print(f"  Theater-Free Validation:")
        print(f"    Defect Rate: {defect_rate:.4f}")
        print(f"    Expected DPMO: {expected_dpmo:,.0f}")
        print(f"    Actual DPMO: {metrics.dpmo:,.0f}")
        print(f"    Correlation: {(1-dpmo_correlation)*100:.1f}%")

class TestTelemetryIntegration(unittest.TestCase):
    """Test telemetry system integration"""
    
    def setUp(self):
        """Set up telemetry test environment"""
        self.test_dir = tempfile.mkdtemp()
        
    def tearDown(self):
        """Clean up test environment"""
        shutil.rmtree(self.test_dir, ignore_errors=True)
    
    def test_sixsigma_telemetry_manager(self):
        """Test Six Sigma telemetry manager"""
        manager = SixSigmaTelemetryManager()
        
        # Collect metrics
        manager.collect_sixsigma_metrics()
        
        # Check dashboard data
        dashboard_data = manager.get_dashboard_data()
        
        self.assertIn("metrics_summary", dashboard_data)
        self.assertIn("current_sixsigma", dashboard_data)
        
        print(f"Telemetry Dashboard Data Keys: {dashboard_data.keys()}")
    
    def test_alert_system(self):
        """Test alert system with Six Sigma thresholds"""
        collector = TelemetryCollector({})
        
        # Add alert rules
        collector.add_alert_rule("dpmo", 10000, "above", "warning")
        collector.add_alert_rule("rty", 0.85, "below", "warning")
        
        # Trigger alerts
        collector.collect_metric("dpmo", 15000.0)  # Should trigger alert
        collector.collect_metric("rty", 0.80)      # Should trigger alert
        
        # Process alerts
        collector._check_alerts()
        
        # Check alert history
        alerts = collector.get_recent_alerts()
        
        self.assertGreater(len(alerts), 0)
        
        print(f"Triggered alerts: {len(alerts)}")
        for alert in alerts:
            print(f"  {alert['metric_name']}: {alert['value']} {alert['direction']} {alert['threshold']}")

if __name__ == "__main__":
    # Run integration tests
    print("=" * 50)
    
    # Create test suite
    suite = unittest.TestSuite()
    
    # Add test cases
    suite.addTest(unittest.makeSuite(TestSixSigmaIntegration))
    suite.addTest(unittest.makeSuite(TestTelemetryIntegration))
    
    # Run tests
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    
    # Print summary
    print("\n" + "=" * 50)
    print(f"Failures: {len(result.failures)}")
    print(f"Errors: {len(result.errors)}")
    
    if result.wasSuccessful():
        print("\n[TARGET] Theater-Free Quality Validation: VERIFIED")
        print("[CHART] DPMO/RTY Calculations: WORKING")
        print("[TREND] Telemetry System: FUNCTIONAL")
        print("[ALERT] Alert System: OPERATIONAL")
    else: