from src.constants.base import MAXIMUM_FUNCTION_LENGTH_LINES, MAXIMUM_RETRY_ATTEMPTS
"""

Tests comprehensive Six Sigma calculations and enterprise quality monitoring
"""

import pytest
import math
import time
from datetime import datetime, timedelta
from unittest.mock import Mock, patch
"""

# Import the Six Sigma modules
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', '..', 'src', 'enterprise', 'telemetry'))
from six_sigma import SixSigmaTelemetry, QualityLevel, SixSigmaMetrics
"""

class TestSixSigmaTelemetry:
    """Test suite for Six Sigma telemetry system"""
    
    def setup_method(self):
        """Setup test fixture"""
        self.telemetry = SixSigmaTelemetry("test_process")
    
    def test_initialization(self):
        """Test telemetry system initialization"""
        assert self.telemetry.process_name == "test_process"
        assert len(self.telemetry.metrics_history) == 0
        assert self.telemetry.current_session_data['defects'] == 0
        assert self.telemetry.current_session_data['opportunities'] == 0
        assert self.telemetry.current_session_data['units_processed'] == 0
        assert self.telemetry.current_session_data['units_passed'] == 0
        
    def test_record_defect(self):
        """Test defect recording functionality"""
        self.telemetry.record_defect("syntax_error", 3)
        
        assert self.telemetry.current_session_data['defects'] == 1
        assert self.telemetry.current_session_data['opportunities'] == 3
        
        # Record another defect
        self.telemetry.record_defect("logic_error", 2)
        
        assert self.telemetry.current_session_data['defects'] == 2
        assert self.telemetry.current_session_data['opportunities'] == 5
    
    def test_record_unit_processed(self):
        """Test unit processing recording"""
        # Record passed unit
        self.telemetry.record_unit_processed(True, 2)
        assert self.telemetry.current_session_data['units_processed'] == 1
        assert self.telemetry.current_session_data['units_passed'] == 1
        assert self.telemetry.current_session_data['opportunities'] == 2
        assert self.telemetry.current_session_data['defects'] == 0
        
        # Record failed unit
        self.telemetry.record_unit_processed(False, 3)
        assert self.telemetry.current_session_data['units_processed'] == 2
        assert self.telemetry.current_session_data['units_passed'] == 1
        assert self.telemetry.current_session_data['opportunities'] == 5
        assert self.telemetry.current_session_data['defects'] == 1

class TestDPMOCalculations:
    """Test DPMO (Defects Per Million Opportunities) calculations"""
    
    def setup_method(self):
        self.telemetry = SixSigmaTelemetry()
    
    def test_basic_dpmo_calculation(self):
        """Test basic DPMO calculation"""
        # 5 defects, 1000 units, 4 opportunities per unit
        dpmo = self.telemetry.calculate_dpmo(5, 1000, 4)
        expected = (5 / (1000 * 4)) * 1_000_000
        assert dpmo == pytest.approx(expected, rel=1e-2)
    
    def test_zero_defects_dpmo(self):
        """Test DPMO with zero defects"""
        dpmo = self.telemetry.calculate_dpmo(0, 1000, 5)
        assert dpmo == 0.0
    
    def test_perfect_defect_rate_dpmo(self):
        """Test DPMO with 100% defect rate"""
        dpmo = self.telemetry.calculate_dpmo(1000, 1000, 1)
        assert dpmo == 1_000_000  # MAXIMUM_FUNCTION_LENGTH_LINES% defect rate
    
    def test_dpmo_with_current_session_data(self):
        """Test DPMO calculation using current session data"""
        self.telemetry.current_session_data['defects'] = 10
        self.telemetry.current_session_data['opportunities'] = 5000
        
        dpmo = self.telemetry.calculate_dpmo()
        expected = (10 / 5000) * 1_000_000
        assert dpmo == pytest.approx(expected, rel=1e-2)
    
    def test_dpmo_zero_opportunities(self):
        """Test DPMO with zero opportunities"""
        dpmo = self.telemetry.calculate_dpmo(5, 1000, 0)
        assert dpmo == 0.0  # Should handle gracefully
    
    def test_dpmo_precision(self):
        """Test DPMO calculation precision"""
        dpmo = self.telemetry.calculate_dpmo(3, 500, 12)
        # (3 / (500 * 12)) * 1, 000, 000 = 500
        assert dpmo == 500.0

class TestRTYCalculations:
    """Test RTY (Rolled Throughput Yield) calculations"""
    
    def setup_method(self):
        self.telemetry = SixSigmaTelemetry()
    
    def test_basic_rty_calculation(self):
        """Test basic RTY calculation"""
        self.telemetry.current_session_data['units_processed'] = 1000
        self.telemetry.current_session_data['units_passed'] = 950
        
        rty = self.telemetry.calculate_rty()
        assert rty == 95.0  # 950/1000 * 100
    
    def test_perfect_rty(self):
        """Test RTY with perfect yield"""
        rty = self.telemetry.calculate_rty(500, 500)
        assert rty == 100.0
    
    def test_zero_rty(self):
        """Test RTY with zero yield"""
        rty = self.telemetry.calculate_rty(100, 0)
        assert rty == 0.0
    
    def test_rty_zero_units(self):
        """Test RTY with zero units processed"""
        rty = self.telemetry.calculate_rty(0, 0)
        assert rty == 100.0  # Default to perfect when no units processed
    
    def test_rty_precision(self):
        """Test RTY calculation precision"""
        rty = self.telemetry.calculate_rty(333, 318)
        expected = (318 / 333) * 100
        assert rty == pytest.approx(expected, rel=1e-2)

class TestSigmaLevelCalculations:
    """Test Sigma Level calculations"""
    
    def setup_method(self):
        self.telemetry = SixSigmaTelemetry()
    
    def test_perfect_quality_sigma(self):
        """Test sigma level for perfect quality (0 DPMO)"""
        sigma = self.telemetry.calculate_sigma_level(0)
        assert sigma == 6.0
    
    def test_six_sigma_quality(self):
        """Test sigma level for Six Sigma quality (3.4 DPMO)"""
        sigma = self.telemetry.calculate_sigma_level(3.4)
        assert sigma >= 5.9  # Should be very close to 6 sigma
    
    def test_four_sigma_quality(self):
        """Test sigma level for Four Sigma quality (~6210 DPMO)"""
        sigma = self.telemetry.calculate_sigma_level(6210)
        assert 3.8 <= sigma <= 4.2  # Should be around 4 sigma
    
    def test_three_sigma_quality(self):
        """Test sigma level for Three Sigma quality (~66807 DPMO)"""
        sigma = self.telemetry.calculate_sigma_level(66807)
        assert 2.8 <= sigma <= MAXIMUM_RETRY_ATTEMPTS.2  # Should be around 3 sigma
    
    def test_poor_quality_sigma(self):
        """Test sigma level for very poor quality"""
        sigma = self.telemetry.calculate_sigma_level(1000000)  # 100% defects
        assert sigma <= 1.0
    
    @patch('sys.modules.get')
    def test_sigma_fallback_without_scipy(self, mock_modules):
        """Test sigma calculation fallback when scipy is not available"""
        # Mock scipy import failure
        mock_modules.return_value = None
        
        sigma = self.telemetry._approximate_sigma_level(3.4)
        assert sigma == 6.0  # Should fall back to quality level lookup

class TestQualityLevels:
    """Test quality level determination"""
    
    def setup_method(self):
        self.telemetry = SixSigmaTelemetry()
    
    def test_six_sigma_level(self):
        """Test Six Sigma quality level detection"""
        level = self.telemetry.get_quality_level(3.4)
        assert level == QualityLevel.SIX_SIGMA
    
    def test_five_sigma_level(self):
        """Test Five Sigma quality level detection"""
        level = self.telemetry.get_quality_level(233)
        assert level == QualityLevel.FIVE_SIGMA
    
    def test_four_sigma_level(self):
        """Test Four Sigma quality level detection"""
        level = self.telemetry.get_quality_level(6210)
        assert level == QualityLevel.FOUR_SIGMA
    
    def test_three_sigma_level(self):
        """Test Three Sigma quality level detection"""
        level = self.telemetry.get_quality_level(66807)
        assert level == QualityLevel.THREE_SIGMA
    
    def test_two_sigma_level(self):
        """Test Two Sigma quality level detection"""
        level = self.telemetry.get_quality_level(308537)
        assert level == QualityLevel.TWO_SIGMA
    
    def test_below_two_sigma_level(self):
        """Test below Two Sigma quality level"""
        level = self.telemetry.get_quality_level(500000)
        assert level == QualityLevel.TWO_SIGMA  # Default to lowest level

class TestProcessCapability:
    """Test process capability calculations"""
    
    def setup_method(self):
        self.telemetry = SixSigmaTelemetry()
    
    def test_basic_process_capability(self):
        """Test basic process capability calculation"""
        measurements = [9.8, 10.1, 9.9, 10.2, 10.0, 9.7, 10.3, 9.9, 10.1, 10.0]
        cp, cpk = self.telemetry.calculate_process_capability(measurements, 9.0, 11.0)
        
        assert cp > 0
        assert cpk > 0
        assert isinstance(cp, float)
        assert isinstance(cpk, float)
    
    def test_capable_process(self):
        """Test highly capable process (Cpk > 1.33)"""
        # Very consistent measurements within tight specs
        measurements = [10.0] * 10  # Perfect consistency
        cp, cpk = self.telemetry.calculate_process_capability(measurements, 9.0, 11.0)
        
        # With zero variation, capability should be infinite
        assert cp == float('inf')
        assert cpk == float('inf')
    
    def test_incapable_process(self):
        """Test incapable process with high variation"""
        measurements = [5, 15, 8, 12, 6, 14, 7, 13, 9, 11]
        cp, cpk = self.telemetry.calculate_process_capability(measurements, 9.5, 10.5)
        
        assert cp < 1.0  # Process variation exceeds specification width
        assert cpk < 1.0
    
    def test_empty_measurements(self):
        """Test process capability with empty measurements"""
        cp, cpk = self.telemetry.calculate_process_capability([], 9.0, 11.0)
        
        assert cp == 0.0
        assert cpk == 0.0
    
    def test_single_measurement(self):
        """Test process capability with single measurement"""
        cp, cpk = self.telemetry.calculate_process_capability([10.0], 9.0, 11.0)
        
        assert cp == 0.0  # Cannot calculate std dev with single point
        assert cpk == 0.0

class TestMetricsGeneration:
    """Test metrics snapshot generation"""
    
    def setup_method(self):
        self.telemetry = SixSigmaTelemetry("test_metrics")
    
    def test_generate_metrics_snapshot(self):
        """Test metrics snapshot generation"""
        # Set up some session data
        self.telemetry.current_session_data.update({
            'defects': 5,
            'opportunities': 1000,
            'units_processed': 200,
            'units_passed': 195
        })
        
        metrics = self.telemetry.generate_metrics_snapshot()
        
        assert isinstance(metrics, SixSigmaMetrics)
        assert metrics.process_name == "test_metrics"
        assert metrics.dpmo == 5000  # (5/1000) * 1, 000, 000
        assert metrics.rty == 97.5   # (195/200) * 100
        assert metrics.sigma_level > 0
        assert metrics.quality_level is not None
        assert metrics.sample_size == 200
        assert metrics.defect_count == 5
        assert metrics.opportunity_count == 1000
        assert isinstance(metrics.timestamp, datetime)
        
        # Verify it was added to history
        assert len(self.telemetry.metrics_history) == 1
        assert self.telemetry.metrics_history[0] == metrics
    
    def test_multiple_snapshots(self):
        """Test multiple metrics snapshots"""
        # Generate first snapshot
        self.telemetry.current_session_data['defects'] = 3
        self.telemetry.current_session_data['opportunities'] = 500
        snapshot1 = self.telemetry.generate_metrics_snapshot()
        
        # Reset and generate second snapshot
        self.telemetry.reset_session()
        self.telemetry.current_session_data['defects'] = 7
        self.telemetry.current_session_data['opportunities'] = 1000
        snapshot2 = self.telemetry.generate_metrics_snapshot()
        
        assert len(self.telemetry.metrics_history) == 2
        assert snapshot1.dpmo != snapshot2.dpmo
        assert snapshot1.timestamp != snapshot2.timestamp

class TestTrendAnalysis:
    """Test trend analysis functionality"""
    
    def setup_method(self):
        self.telemetry = SixSigmaTelemetry("trend_test")
    
    def test_empty_trend_analysis(self):
        """Test trend analysis with no data"""
        trends = self.telemetry.get_trend_analysis(30)
        
        assert "error" in trends
        assert trends["error"] == "No metrics data available for trend analysis"
    
    def test_trend_analysis_with_data(self):
        """Test trend analysis with historical data"""
        # Generate some historical metrics
        for i in range(10):
            self.telemetry.current_session_data['defects'] = i + 1
            self.telemetry.current_session_data['opportunities'] = 1000
            self.telemetry.current_session_data['units_processed'] = 100
            self.telemetry.current_session_data['units_passed'] = 98 - i  # Declining quality
            
            self.telemetry.generate_metrics_snapshot()
            self.telemetry.reset_session()
        
        trends = self.telemetry.get_trend_analysis(30)
        
        assert trends["period_days"] == 30
        assert trends["sample_count"] == 10
        assert "dpmo" in trends
        assert "rty" in trends
        assert "sigma_level" in trends
        
        # Check trend analysis structure
        for metric in ["dpmo", "rty", "sigma_level"]:
            assert "current" in trends[metric]
            assert "average" in trends[metric]
            assert "trend" in trends[metric]
            assert "best" in trends[metric]
            assert "worst" in trends[metric]
    
    def test_improving_trend_detection(self):
        """Test detection of improving quality trends"""
        # Generate improving trend (fewer defects over time)
        for i in range(5):
            self.telemetry.current_session_data['defects'] = 10 - i  # Decreasing defects
            self.telemetry.current_session_data['opportunities'] = 1000
            self.telemetry.generate_metrics_snapshot()
            self.telemetry.reset_session()
        
        trends = self.telemetry.get_trend_analysis(30)
        
        # DPMO should be improving (decreasing)
        assert trends["dpmo"]["trend"] == "improving"
    
    def test_declining_trend_detection(self):
        """Test detection of declining quality trends"""
        # Generate declining trend (more defects over time)
        for i in range(5):
            self.telemetry.current_session_data['defects'] = i + 1  # Increasing defects
            self.telemetry.current_session_data['opportunities'] = 1000
            self.telemetry.generate_metrics_snapshot()
            self.telemetry.reset_session()
        
        trends = self.telemetry.get_trend_analysis(30)
        
        # DPMO should be declining (increasing)
        assert trends["dpmo"]["trend"] == "declining"

class TestDataExport:
    """Test data export functionality"""
    
    def setup_method(self):
        self.telemetry = SixSigmaTelemetry("export_test")
    
    def test_export_empty_metrics(self):
        """Test export with no metrics data"""
        export_data = self.telemetry.export_metrics()
        
        assert export_data["process_name"] == "export_test"
        assert len(export_data["metrics_history"]) == 0
        assert "current_session" in export_data
    
    def test_export_with_data(self):
        """Test export with metrics data"""
        # Generate some metrics
        self.telemetry.current_session_data.update({
            'defects': 5,
            'opportunities': 1000,
            'units_processed': 100,
            'units_passed': 95
        })
        
        self.telemetry.generate_metrics_snapshot()
        
        export_data = self.telemetry.export_metrics()
        
        assert export_data["process_name"] == "export_test"
        assert len(export_data["metrics_history"]) == 1
        
        metric_data = export_data["metrics_history"][0]
        assert metric_data["dpmo"] == 5000
        assert metric_data["rty"] == 95.0
        assert metric_data["sample_size"] == 100
        assert metric_data["defect_count"] == 5
        assert metric_data["opportunity_count"] == 1000
        assert "timestamp" in metric_data
        assert "quality_level" in metric_data

class TestSessionManagement:
    """Test session management functionality"""
    
    def setup_method(self):
        self.telemetry = SixSigmaTelemetry()
    
    def test_session_reset(self):
        """Test session data reset"""
        # Add some data
        self.telemetry.current_session_data.update({
            'defects': 10,
            'opportunities': 500,
            'units_processed': 100,
            'units_passed': 90
        })
        
        # Reset session
        self.telemetry.reset_session()
        
        # Verify reset
        assert self.telemetry.current_session_data['defects'] == 0
        assert self.telemetry.current_session_data['opportunities'] == 0
        assert self.telemetry.current_session_data['units_processed'] == 0
        assert self.telemetry.current_session_data['units_passed'] == 0
        assert 'start_time' in self.telemetry.current_session_data
    
    def test_session_timing(self):
        """Test session timing functionality"""
        start_time = self.telemetry.current_session_data['start_time']
        time.sleep(0.1)  # Small delay
        
        # Session start time should remain constant until reset
        assert self.telemetry.current_session_data['start_time'] == start_time
        
        # Reset should update start time
        self.telemetry.reset_session()
        new_start_time = self.telemetry.current_session_data['start_time']
        assert new_start_time > start_time

class TestPerformanceAndMemory:
    """Test performance and memory efficiency"""
    
    def setup_method(self):
        self.telemetry = SixSigmaTelemetry("performance_test")
    
    def test_large_dataset_performance(self):
        """Test performance with large datasets"""
        start_time = time.time()
        
        # Generate large number of metrics
        for i in range(1000):
            self.telemetry.current_session_data['defects'] = i % 10
            self.telemetry.current_session_data['opportunities'] = 1000
            self.telemetry.generate_metrics_snapshot()
            self.telemetry.reset_session()
        
        duration = time.time() - start_time
        
        assert len(self.telemetry.metrics_history) == 1000
        assert duration < 2.0  # Should complete within 2 seconds
    
    def test_calculation_efficiency(self):
        """Test calculation efficiency with repeated operations"""
        start_time = time.time()
        
        # Perform many calculations
        for i in range(10000):
            self.telemetry.calculate_dpmo(i % 100, 1000, 5)
            self.telemetry.calculate_rty(500, 450 + i % 50)
            self.telemetry.calculate_sigma_level(1000 + i)
        
        duration = time.time() - start_time
        
        assert duration < 1.0  # Should be very fast
    
    def test_memory_usage_stability(self):
        """Test memory usage remains stable"""
        import gc
        import sys
        
        # Get initial memory usage
        gc.collect()
        initial_objects = len(gc.get_objects())
        
        # Perform operations that might create objects
        for i in range(100):
            self.telemetry.generate_metrics_snapshot()
            trend = self.telemetry.get_trend_analysis(30)
            export = self.telemetry.export_metrics()
            self.telemetry.reset_session()
        
        # Force garbage collection
        gc.collect()
        final_objects = len(gc.get_objects())
        
        # Object count should not grow excessively
        object_growth = final_objects - initial_objects
        assert object_growth < 1000  # Reasonable growth limit

class TestErrorHandling:
    """Test error handling and edge cases"""
    
    def setup_method(self):
        self.telemetry = SixSigmaTelemetry()
    
    def test_invalid_input_handling(self):
        """Test handling of invalid inputs"""
        # These should not crash the system
        assert self.telemetry.calculate_dpmo(None, 100, 5) == 0.0
        assert self.telemetry.calculate_rty(None, None) == 100.0
        
        # Negative values
        dpmo = self.telemetry.calculate_dpmo(-1, 100, 5)
        assert dpmo <= 0
    
    def test_extreme_values(self):
        """Test handling of extreme values"""
        # Very large values
        large_dpmo = self.telemetry.calculate_dpmo(1000000, 1, 1)
        assert large_dpmo == 1000000000000  # Very large DPMO
        
        # Very small values
        small_dpmo = self.telemetry.calculate_dpmo(1, 1000000000, 1)
        assert small_dpmo == 0.001
    
    def test_mathematical_edge_cases(self):
        """Test mathematical edge cases"""
        # Division by zero scenarios are handled gracefully
        assert self.telemetry.calculate_dpmo(5, 0, 5) == 0.0  # Handled gracefully
        assert self.telemetry.calculate_rty(0, 0) == 100.0    # Default to perfect
        
        # Infinity and NaN handling
        cp, cpk = self.telemetry.calculate_process_capability([float('inf')], 0, 10)
        assert cp == 0.0
        assert cpk == 0.0