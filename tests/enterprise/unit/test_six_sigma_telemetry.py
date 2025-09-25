from src.constants.base import MAXIMUM_NESTED_DEPTH, MAXIMUM_RETRY_ATTEMPTS
"""

Tests all functionality of the Six Sigma quality monitoring system including:
- DPMO (Defects Per Million Opportunities) calculations
- RTY (Rolled Throughput Yield) calculations
- Sigma level determination and quality levels
- Process capability analysis (Cp, Cpk)
- Metrics tracking and trend analysis
- Performance and thread safety
"""

import pytest
import time
import statistics
import threading
from unittest.mock import Mock, patch
from datetime import datetime, timedelta
from concurrent.futures import ThreadPoolExecutor

# Import the modules under test
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent.parent.parent / 'src'))

from enterprise.telemetry.six_sigma import (
    SixSigmaTelemetry, SixSigmaMetrics, QualityLevel
)

class TestSixSigmaMetrics:
    """Test SixSigmaMetrics dataclass"""
    
    def test_metrics_creation(self):
        """Test basic metrics creation"""
        metrics = SixSigmaMetrics(
            dpmo=100.0,
            rty=95.5,
            sigma_level=4.5,
            process_capability=1.33
        )
        
        assert metrics.dpmo == 100.0
        assert metrics.rty == 95.5
        assert metrics.sigma_level == 4.5
        assert metrics.process_capability == 1.33
        assert metrics.quality_level is None  # Default
        assert isinstance(metrics.timestamp, datetime)
        
    def test_metrics_defaults(self):
        """Test default values"""
        metrics = SixSigmaMetrics()
        
        assert metrics.dpmo == 0.0
        assert metrics.rty == 0.0
        assert metrics.sigma_level == 0.0
        assert metrics.process_capability == 0.0
        assert metrics.quality_level is None
        assert metrics.process_name == ""
        assert metrics.sample_size == 0
        assert metrics.defect_count == 0
        assert metrics.opportunity_count == 0

class TestQualityLevel:
    """Test QualityLevel enum"""
    
    def test_quality_level_values(self):
        """Test quality level sigma values"""
        assert QualityLevel.TWO_SIGMA.value == 2.0
        assert QualityLevel.THREE_SIGMA.value == 3.0
        assert QualityLevel.FOUR_SIGMA.value == 4.0
        assert QualityLevel.FIVE_SIGMA.value == 5.0
        assert QualityLevel.SIX_SIGMA.value == 6.0
        
    def test_quality_level_ordering(self):
        """Test quality level ordering"""
        levels = list(QualityLevel)
        values = [level.value for level in levels]
        assert values == sorted(values)  # Should be in ascending order

class TestSixSigmaTelemetryBasic:
    """Test basic SixSigmaTelemetry functionality"""
    
    def setup_method(self):
        """Setup for each test method"""
        self.telemetry = SixSigmaTelemetry("test_process")
        
    def test_telemetry_initialization(self):
        """Test telemetry system initialization"""
        assert self.telemetry.process_name == "test_process"
        assert isinstance(self.telemetry.metrics_history, list)
        assert len(self.telemetry.metrics_history) == 0
        assert isinstance(self.telemetry.current_session_data, dict)
        assert self.telemetry.current_session_data['defects'] == 0
        assert self.telemetry.current_session_data['opportunities'] == 0
        
    def test_record_defect(self):
        """Test defect recording"""
        initial_defects = self.telemetry.current_session_data['defects']
        initial_opportunities = self.telemetry.current_session_data['opportunities']
        
        self.telemetry.record_defect("syntax_error", opportunities=2)
        
        assert self.telemetry.current_session_data['defects'] == initial_defects + 1
        assert self.telemetry.current_session_data['opportunities'] == initial_opportunities + 2
        
    def test_record_unit_processed_passed(self):
        """Test recording passed unit"""
        self.telemetry.record_unit_processed(passed=True, opportunities=3)
        
        assert self.telemetry.current_session_data['units_processed'] == 1
        assert self.telemetry.current_session_data['units_passed'] == 1
        assert self.telemetry.current_session_data['opportunities'] == 3
        assert self.telemetry.current_session_data['defects'] == 0
        
    def test_record_unit_processed_failed(self):
        """Test recording failed unit"""
        self.telemetry.record_unit_processed(passed=False, opportunities=2)
        
        assert self.telemetry.current_session_data['units_processed'] == 1
        assert self.telemetry.current_session_data['units_passed'] == 0
        assert self.telemetry.current_session_data['opportunities'] == 2
        assert self.telemetry.current_session_data['defects'] == 1
        
    def test_reset_session(self):
        """Test session reset"""
        # Add some data
        self.telemetry.record_defect("test")
        self.telemetry.record_unit_processed(passed=True)
        
        # Reset
        self.telemetry.reset_session()
        
        # All counters should be zero
        assert self.telemetry.current_session_data['defects'] == 0
        assert self.telemetry.current_session_data['opportunities'] == 0
        assert self.telemetry.current_session_data['units_processed'] == 0
        assert self.telemetry.current_session_data['units_passed'] == 0

class TestDPMOCalculations:
    """Test DPMO (Defects Per Million Opportunities) calculations"""
    
    def setup_method(self):
        """Setup for each test method"""
        self.telemetry = SixSigmaTelemetry("dpmo_test")
        
    def test_calculate_dpmo_zero_defects(self):
        """Test DPMO calculation with zero defects"""
        # No defects, 1000 opportunities
        self.telemetry.current_session_data['defects'] = 0
        self.telemetry.current_session_data['opportunities'] = 1000
        
        dpmo = self.telemetry.calculate_dpmo()
        assert dpmo == 0.0
        
    def test_calculate_dpmo_zero_opportunities(self):
        """Test DPMO calculation with zero opportunities"""
        # Should handle gracefully
        self.telemetry.current_session_data['defects'] = 5
        self.telemetry.current_session_data['opportunities'] = 0
        
        dpmo = self.telemetry.calculate_dpmo()
        assert dpmo == 0.0
        
    def test_calculate_dpmo_basic(self):
        """Test basic DPMO calculation"""
        # 1 defect in 1000 opportunities = 1000 DPMO
        self.telemetry.current_session_data['defects'] = 1
        self.telemetry.current_session_data['opportunities'] = 1000
        
        dpmo = self.telemetry.calculate_dpmo()
        assert dpmo == 1000.0
        
    def test_calculate_dpmo_fractional(self):
        """Test DPMO calculation with fractional result"""
        # 3 defects in 7000 opportunities ~= 428.57 DPMO
        self.telemetry.current_session_data['defects'] = 3
        self.telemetry.current_session_data['opportunities'] = 7000
        
        dpmo = self.telemetry.calculate_dpmo()
        expected = (3 / 7000) * 1_000_000
        assert abs(dpmo - expected) < 0.01
        
    def test_calculate_dpmo_with_parameters(self):
        """Test DPMO calculation with explicit parameters"""
        dpmo = self.telemetry.calculate_dpmo(defects=5, opportunities=10000)
        expected = (5 / 10000) * 1_000_000
        assert dpmo == expected
        
    def test_calculate_dpmo_six_sigma_level(self):
        """Test DPMO calculation for Six Sigma level"""
        # 3.4 defects per million opportunities (Six Sigma)
        dpmo = self.telemetry.calculate_dpmo(defects=34, opportunities=10_000_000)
        assert abs(dpmo - 3.4) < 0.1

class TestRTYCalculations:
    """Test RTY (Rolled Throughput Yield) calculations"""
    
    def setup_method(self):
        """Setup for each test method"""
        self.telemetry = SixSigmaTelemetry("rty_test")
        
    def test_calculate_rty_perfect_yield(self):
        """Test RTY calculation with perfect yield"""
        self.telemetry.current_session_data['units_processed'] = 1000
        self.telemetry.current_session_data['units_passed'] = 1000
        
        rty = self.telemetry.calculate_rty()
        assert rty == 100.0
        
    def test_calculate_rty_zero_processed(self):
        """Test RTY calculation with zero units processed"""
        self.telemetry.current_session_data['units_processed'] = 0
        self.telemetry.current_session_data['units_passed'] = 0
        
        rty = self.telemetry.calculate_rty()
        assert rty == 100.0  # Default to perfect when no data
        
    def test_calculate_rty_partial_yield(self):
        """Test RTY calculation with partial yield"""
        self.telemetry.current_session_data['units_processed'] = 1000
        self.telemetry.current_session_data['units_passed'] = 950
        
        rty = self.telemetry.calculate_rty()
        assert rty == 95.0
        
    def test_calculate_rty_with_parameters(self):
        """Test RTY calculation with explicit parameters"""
        rty = self.telemetry.calculate_rty(units_processed=500, units_passed=475)
        expected = (475 / 500) * 100
        assert rty == expected
        
    def test_calculate_rty_zero_yield(self):
        """Test RTY calculation with zero yield"""
        rty = self.telemetry.calculate_rty(units_processed=100, units_passed=0)
        assert rty == 0.0

class TestSigmaLevelCalculations:
    """Test sigma level calculations"""
    
    def setup_method(self):
        """Setup for each test method"""
        self.telemetry = SixSigmaTelemetry("sigma_test")
        
    def test_calculate_sigma_level_perfect_quality(self):
        """Test sigma level calculation with perfect quality (0 DPMO)"""
        sigma_level = self.telemetry.calculate_sigma_level(dpmo=0.0)
        assert sigma_level == 6.0  # Perfect quality
        
    def test_calculate_sigma_level_six_sigma(self):
        """Test sigma level calculation for Six Sigma (3.4 DPMO)"""
        sigma_level = self.telemetry.calculate_sigma_level(dpmo=3.4)
        # Should be close to 6.0 sigma
        assert sigma_level >= MAXIMUM_NESTED_DEPTH.9
        
    def test_calculate_sigma_level_fallback_method(self):
        """Test fallback sigma level calculation without scipy"""
        # Mock scipy import error to test fallback
        with patch('enterprise.telemetry.six_sigma.stats', side_effect=ImportError):
            sigma_level = self.telemetry.calculate_sigma_level(dpmo=233)  # Five sigma
            assert sigma_level >= 4.0  # Should use approximation
            
    def test_approximate_sigma_level(self):
        """Test approximate sigma level calculation"""
        # Test various DPMO values against known sigma levels
        test_cases = [
            (3.4, QualityLevel.SIX_SIGMA),
            (233, QualityLevel.FIVE_SIGMA), 
            (6210, QualityLevel.FOUR_SIGMA),
            (66807, QualityLevel.THREE_SIGMA),
            (308537, QualityLevel.TWO_SIGMA),
            (500000, 1.0)  # Below 2-sigma
        ]
        
        for dpmo, expected_level in test_cases:
            if isinstance(expected_level, QualityLevel):
                sigma_level = self.telemetry._approximate_sigma_level(dpmo)
                assert sigma_level == expected_level.value
            else:
                sigma_level = self.telemetry._approximate_sigma_level(dpmo)
                assert sigma_level == expected_level

class TestQualityLevelDetermination:
    """Test quality level determination"""
    
    def setup_method(self):
        """Setup for each test method"""
        self.telemetry = SixSigmaTelemetry("quality_test")
        
    def test_get_quality_level_six_sigma(self):
        """Test quality level for Six Sigma"""
        quality_level = self.telemetry.get_quality_level(dpmo=3.4)
        assert quality_level == QualityLevel.SIX_SIGMA
        
    def test_get_quality_level_five_sigma(self):
        """Test quality level for Five Sigma"""
        quality_level = self.telemetry.get_quality_level(dpmo=233)
        assert quality_level == QualityLevel.FIVE_SIGMA
        
    def test_get_quality_level_four_sigma(self):
        """Test quality level for Four Sigma"""
        quality_level = self.telemetry.get_quality_level(dpmo=6210)
        assert quality_level == QualityLevel.FOUR_SIGMA
        
    def test_get_quality_level_three_sigma(self):
        """Test quality level for Three Sigma"""
        quality_level = self.telemetry.get_quality_level(dpmo=66807)
        assert quality_level == QualityLevel.THREE_SIGMA
        
    def test_get_quality_level_two_sigma(self):
        """Test quality level for Two Sigma"""
        quality_level = self.telemetry.get_quality_level(dpmo=308537)
        assert quality_level == QualityLevel.TWO_SIGMA
        
    def test_get_quality_level_below_two_sigma(self):
        """Test quality level below Two Sigma"""
        quality_level = self.telemetry.get_quality_level(dpmo=500000)
        assert quality_level == QualityLevel.TWO_SIGMA  # Default to lowest

class TestProcessCapability:
    """Test process capability calculations (Cp, Cpk)"""
    
    def setup_method(self):
        """Setup for each test method"""
        self.telemetry = SixSigmaTelemetry("capability_test")
        
    def test_calculate_process_capability_basic(self):
        """Test basic process capability calculation"""
        measurements = [10.0, 10.1, 9.9, 10.2, 9.8, 10.0, 10.1, 9.9]
        lower_spec = 9.0
        upper_spec = 11.0
        
        cp, cpk = self.telemetry.calculate_process_capability(measurements, lower_spec, upper_spec)
        
        # Should have reasonable values
        assert cp > 0
        assert cpk > 0
        assert isinstance(cp, float)
        assert isinstance(cpk, float)
        
    def test_calculate_process_capability_perfect_centering(self):
        """Test process capability with perfect centering"""
        # Data perfectly centered between specs
        measurements = [10.0] * 10  # All measurements at center
        lower_spec = 9.0
        upper_spec = 11.0
        
        cp, cpk = self.telemetry.calculate_process_capability(measurements, lower_spec, upper_spec)
        
        # With zero variation, Cp and Cpk should be infinite
        assert cp == float('inf')
        assert cpk == float('inf')
        
    def test_calculate_process_capability_no_data(self):
        """Test process capability with no data"""
        cp, cpk = self.telemetry.calculate_process_capability([], 0, 10)
        assert cp == 0.0
        assert cpk == 0.0
        
    def test_calculate_process_capability_insufficient_data(self):
        """Test process capability with insufficient data"""
        cp, cpk = self.telemetry.calculate_process_capability([5.0], 0, 10)
        assert cp == 0.0
        assert cpk == 0.0
        
    def test_calculate_process_capability_off_center(self):
        """Test process capability with off-center process"""
        # Process mean shifted toward upper spec
        measurements = [10.8, 10.9, 11.0, 10.7, 10.8, 10.9]
        lower_spec = 9.0
        upper_spec = 11.0
        
        cp, cpk = self.telemetry.calculate_process_capability(measurements, lower_spec, upper_spec)
        
        # Cpk should be less than Cp due to off-centering
        assert cpk < cp
        assert cp > 0
        assert cpk > 0

class TestMetricsSnapshots:
    """Test metrics snapshot generation"""
    
    def setup_method(self):
        """Setup for each test method"""
        self.telemetry = SixSigmaTelemetry("snapshot_test")
        
    def test_generate_metrics_snapshot(self):
        """Test metrics snapshot generation"""
        # Add some test data
        self.telemetry.record_unit_processed(passed=True, opportunities=10)
        self.telemetry.record_unit_processed(passed=True, opportunities=10)
        self.telemetry.record_unit_processed(passed=False, opportunities=10)
        
        snapshot = self.telemetry.generate_metrics_snapshot()
        
        assert isinstance(snapshot, SixSigmaMetrics)
        assert snapshot.process_name == "snapshot_test"
        assert snapshot.sample_size == 3  # MAXIMUM_RETRY_ATTEMPTS units processed
        assert snapshot.defect_count == 1  # 1 failed unit
        assert snapshot.opportunity_count == 30  # 3 * 10 opportunities
        assert snapshot.dpmo > 0  # Should have calculated DPMO
        assert snapshot.rty > 0 and snapshot.rty <= 100  # Should have valid RTY
        assert snapshot.sigma_level >= 0  # Should have sigma level
        assert isinstance(snapshot.quality_level, QualityLevel)
        
        # Should be added to history
        assert len(self.telemetry.metrics_history) == 1
        assert self.telemetry.metrics_history[0] == snapshot
        
    def test_generate_multiple_snapshots(self):
        """Test generating multiple snapshots"""
        # Generate several snapshots
        for i in range(5):
            self.telemetry.record_unit_processed(passed=True)
            snapshot = self.telemetry.generate_metrics_snapshot()
            assert isinstance(snapshot, SixSigmaMetrics)
            
        assert len(self.telemetry.metrics_history) == 5

class TestTrendAnalysis:
    """Test trend analysis functionality"""
    
    def setup_method(self):
        """Setup for each test method"""
        self.telemetry = SixSigmaTelemetry("trend_test")
        
    def test_trend_analysis_no_data(self):
        """Test trend analysis with no historical data"""
        trend = self.telemetry.get_trend_analysis(days=30)
        
        assert "error" in trend
        assert "No metrics data available" in trend["error"]
        
    def test_trend_analysis_with_data(self):
        """Test trend analysis with historical data"""
        # Generate some historical data
        for i in range(10):
            self.telemetry.record_unit_processed(passed=True, opportunities=100)
            if i % 3 == 0:  # Add some defects occasionally
                self.telemetry.record_defect("test_defect")
            self.telemetry.generate_metrics_snapshot()
            
        trend = self.telemetry.get_trend_analysis(days=30)
        
        assert "error" not in trend
        assert trend["period_days"] == 30
        assert trend["sample_count"] == 10
        assert "dpmo" in trend
        assert "rty" in trend
        assert "sigma_level" in trend
        
        # Check DPMO trend data
        dpmo_trend = trend["dpmo"]
        assert "current" in dpmo_trend
        assert "average" in dpmo_trend
        assert "trend" in dpmo_trend
        assert "best" in dpmo_trend
        assert "worst" in dpmo_trend
        
        # Trend should be "improving" or "declining"
        assert dpmo_trend["trend"] in ["improving", "declining"]
        
    def test_trend_analysis_improving_trend(self):
        """Test trend analysis with improving quality"""
        # Create data that shows improvement over time
        defect_rates = [0.1, 0.08, 0.06, 0.04, 0.02]  # Decreasing defects
        
        for defect_rate in defect_rates:
            for _ in range(100):
                passed = True if hash(str(time.time())) % 100 > defect_rate * 100 else False
                self.telemetry.record_unit_processed(passed=passed)
            self.telemetry.generate_metrics_snapshot()
            time.sleep(0.001)  # Ensure different timestamps
            
        trend = self.telemetry.get_trend_analysis(days=30)
        
        # Should show improving trend in DPMO (lower is better)
        if trend["dpmo"]["current"] < trend["dpmo"]["best"]:
            assert trend["dpmo"]["trend"] == "improving"

class TestDataExport:
    """Test data export functionality"""
    
    def setup_method(self):
        """Setup for each test method"""
        self.telemetry = SixSigmaTelemetry("export_test")
        
    def test_export_metrics_empty(self):
        """Test exporting metrics with no data"""
        exported = self.telemetry.export_metrics()
        
        assert exported["process_name"] == "export_test"
        assert "current_session" in exported
        assert "metrics_history" in exported
        assert len(exported["metrics_history"]) == 0
        
    def test_export_metrics_with_data(self):
        """Test exporting metrics with data"""
        # Add some data
        self.telemetry.record_unit_processed(passed=True, opportunities=50)
        self.telemetry.record_defect("test_error", opportunities=25)
        snapshot = self.telemetry.generate_metrics_snapshot()
        
        exported = self.telemetry.export_metrics()
        
        assert exported["process_name"] == "export_test"
        
        # Check current session data
        session_data = exported["current_session"]
        assert session_data["defects"] == 1
        assert session_data["opportunities"] == 75  # 50 + 25
        assert session_data["units_processed"] == 1
        assert session_data["units_passed"] == 1
        
        # Check metrics history
        history = exported["metrics_history"]
        assert len(history) == 1
        
        metric_record = history[0]
        assert metric_record["dpmo"] == snapshot.dpmo
        assert metric_record["rty"] == snapshot.rty
        assert metric_record["sigma_level"] == snapshot.sigma_level
        assert metric_record["quality_level"] == snapshot.quality_level.name
        assert "timestamp" in metric_record
        assert metric_record["sample_size"] == snapshot.sample_size
        assert metric_record["defect_count"] == snapshot.defect_count
        assert metric_record["opportunity_count"] == snapshot.opportunity_count

class TestPerformanceAndConcurrency:
    """Test performance and concurrency aspects"""
    
    def setup_method(self):
        """Setup for each test method"""
        self.telemetry = SixSigmaTelemetry("performance_test")
        
    def test_performance_large_dataset(self):
        """Test performance with large dataset"""
        start_time = time.time()
        
        # Process large amount of data
        for _ in range(10000):
            self.telemetry.record_unit_processed(passed=True, opportunities=1)
            
        # Calculate metrics
        dpmo = self.telemetry.calculate_dpmo()
        rty = self.telemetry.calculate_rty()
        sigma_level = self.telemetry.calculate_sigma_level()
        
        duration = time.time() - start_time
        
        # Should complete reasonably quickly
        assert duration < 1.0  # Less than 1 second
        assert dpmo == 0.0  # No defects
        assert rty == 100.0  # Perfect yield
        assert sigma_level == 6.0  # Perfect quality
        
    def test_concurrent_recording(self):
        """Test concurrent defect recording"""
        results = []
        
        def record_worker(worker_id):
            for i in range(100):
                self.telemetry.record_defect(f"error_{worker_id}_{i}")
                self.telemetry.record_unit_processed(passed=i % 5 != 0)  # 20% failure rate
                
        # Run multiple threads
        with ThreadPoolExecutor(max_workers=5) as executor:
            futures = [executor.submit(record_worker, i) for i in range(5)]
            for future in futures:
                future.result()
                
        # Check final state
        assert self.telemetry.current_session_data['defects'] == 1000  # 5 * 100 defects + 5 * 20 failed units
        assert self.telemetry.current_session_data['units_processed'] == 500  # 5 * 100 units
        
        # Calculations should still work correctly
        dpmo = self.telemetry.calculate_dpmo()
        rty = self.telemetry.calculate_rty()
        assert dpmo > 0
        assert rty < 100  # Should show some failures
        
    def test_memory_efficiency_large_history(self):
        """Test memory efficiency with large metrics history"""
        import sys
        
        # Generate large history
        for i in range(1000):
            self.telemetry.record_unit_processed(passed=i % 10 != 0)  # 10% failure
            self.telemetry.generate_metrics_snapshot()
            
        # Get memory size of history
        history_size = sys.getsizeof(self.telemetry.metrics_history)
        
        # Should be reasonable size (less than 10MB for 1000 records)
        assert history_size < 10 * 1024 * 1024
        
        # Trend analysis should still work
        trend = self.telemetry.get_trend_analysis(days=30)
        assert "error" not in trend
        assert trend["sample_count"] == 1000
        
    def test_calculation_performance(self):
        """Test calculation performance"""
        # Add substantial data
        for _ in range(1000):
            self.telemetry.record_unit_processed(passed=True, opportunities=10)
        for _ in range(100):
            self.telemetry.record_defect("test")
            
        # Time the calculations
        start_time = time.time()
        
        for _ in range(1000):
            dpmo = self.telemetry.calculate_dpmo()
            rty = self.telemetry.calculate_rty() 
            sigma_level = self.telemetry.calculate_sigma_level()
            
        duration = time.time() - start_time
        
        # Should be very fast for repeated calculations
        assert duration < 0.1  # Less than 100ms for 1000 calculations

class TestErrorHandlingAndEdgeCases:
    """Test error handling and edge cases"""
    
    def setup_method(self):
        """Setup for each test method"""
        self.telemetry = SixSigmaTelemetry("error_test")
        
    def test_negative_values_handling(self):
        """Test handling of negative values"""
        # Recording negative defects should handle gracefully
        self.telemetry.current_session_data['defects'] = -1
        self.telemetry.current_session_data['opportunities'] = 1000
        
        dpmo = self.telemetry.calculate_dpmo()
        # Should handle gracefully (implementation dependent)
        assert isinstance(dpmo, (int, float))
        
    def test_extreme_dpmo_values(self):
        """Test handling of extreme DPMO values"""
        # Test with very high DPMO
        sigma_level = self.telemetry.calculate_sigma_level(dpmo=999999)
        assert isinstance(sigma_level, (int, float))
        assert sigma_level >= 0
        
        # Test with very low DPMO  
        sigma_level = self.telemetry.calculate_sigma_level(dpmo=0.001)
        assert isinstance(sigma_level, (int, float))
        assert sigma_level <= 6.0
        
    def test_process_capability_edge_cases(self):
        """Test process capability edge cases"""
        # Test with measurements outside spec limits
        measurements = [5.0, 15.0, 8.0, 12.0]  # Some outside 9-11 range
        lower_spec = 9.0
        upper_spec = 11.0
        
        cp, cpk = self.telemetry.calculate_process_capability(measurements, lower_spec, upper_spec)
        
        # Should still calculate values
        assert isinstance(cp, (int, float))
        assert isinstance(cpk, (int, float))
        # Cpk might be negative due to measurements outside specs
        
    def test_invalid_spec_limits(self):
        """Test process capability with invalid spec limits"""
        measurements = [10.0, 10.1, 9.9]
        
        # Lower spec higher than upper spec
        cp, cpk = self.telemetry.calculate_process_capability(measurements, 11.0, 9.0)
        
        # Should handle gracefully (negative Cp expected)
        assert isinstance(cp, (int, float))
        assert isinstance(cpk, (int, float))
        
    def test_trend_analysis_edge_dates(self):
        """Test trend analysis with edge date cases"""
        # Add data with very old timestamps
        old_metric = SixSigmaMetrics()
        old_metric.timestamp = datetime.now() - timedelta(days=100)
        self.telemetry.metrics_history.append(old_metric)
        
        # Add recent data
        self.telemetry.record_unit_processed(passed=True)
        self.telemetry.generate_metrics_snapshot()
        
        # Should only include recent data in trend
        trend = self.telemetry.get_trend_analysis(days=30)
        assert trend["sample_count"] == 1  # Only recent data
        
    def test_unicode_defect_types(self):
        """Test handling of unicode defect types"""
        unicode_defect = "__"
        
        # Should handle unicode defect types gracefully
        self.telemetry.record_defect(unicode_defect, opportunities=1)
        
        assert self.telemetry.current_session_data['defects'] == 1
        assert self.telemetry.current_session_data['opportunities'] == 1

if __name__ == "__main__":
    pytest.main([__file__, "-v"])