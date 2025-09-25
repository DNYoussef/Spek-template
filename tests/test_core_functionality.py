"""
Test Core System Functionality

Tests that core analyzer components actually work instead of just being architectural theater.
"""

from pathlib import Path
import sys

import pytest

# Add analyzer to path
sys.path.append(str(Path(__file__).parent.parent / "analyzer"))
sys.path.append(str(Path(__file__).parent.parent / "src"))

class TestConnascenceAnalyzer:
    """Test connascence analyzer actually functions"""

    def test_analyzer_imports(self):
        """Test that analyzer can be imported without errors"""
        try:
            from analyzer.connascence_analyzer import ConnascenceAnalyzer
            analyzer = ConnascenceAnalyzer()
            assert analyzer is not None
        except ImportError as e:
            pytest.fail(f"Failed to import ConnascenceAnalyzer: {e}")

    def test_analyzer_basic_functionality(self):
        """Test that analyzer can perform basic analysis"""
        from analyzer.connascence_analyzer import ConnascenceAnalyzer

        analyzer = ConnascenceAnalyzer()

        # Test with a non-existent directory (should handle gracefully)
        result = analyzer.analyze_directory("nonexistent")

        assert isinstance(result, dict)
        assert "overall_score" in result
        assert "violations" in result
        assert "nasa_compliance" in result
        assert isinstance(result["violations"], list)

class TestNASAAnalyzer:
    """Test NASA analyzer actually functions"""

    def test_nasa_imports(self):
        """Test that NASA analyzer can be imported"""
        try:
            from analyzer.nasa_engine.nasa_analyzer import NASAAnalyzer
            analyzer = NASAAnalyzer()
            assert analyzer is not None
        except ImportError as e:
            pytest.fail(f"Failed to import NASAAnalyzer: {e}")

    def test_nasa_basic_analysis(self):
        """Test that NASA analyzer can analyze simple code"""
        from analyzer.nasa_engine.nasa_analyzer import NASAAnalyzer

        analyzer = NASAAnalyzer()

        # Create a simple test file content
        test_code = '''
def simple_function():
    """A simple test function"""
    return True

def long_function():
    """A function that might be too long"""
    line1 = 1
    line2 = 2
    line3 = 3
    line4 = 4
    line5 = 5
    return line1 + line2 + line3 + line4 + line5
'''

        # Test analysis with content
        violations = analyzer.analyze_file("test.py", content=test_code)

        assert isinstance(violations, list)
        # Should be able to analyze without crashing

class TestConstants:
    """Test that constants are reasonable and usable"""

    def test_constants_import(self):
        """Test that constants can be imported"""
        try:
            from src.constants import (
                DEFAULT_TIMEOUT, MAX_RETRIES, NASA_MAX_FUNCTION_LENGTH,
                MIN_TEST_COVERAGE, SUCCESS, FAILURE
            )
            assert DEFAULT_TIMEOUT > 0
            assert MAX_RETRIES > 0
            assert NASA_MAX_FUNCTION_LENGTH > 0
            assert MIN_TEST_COVERAGE > 0
            assert SUCCESS == 0
            assert FAILURE == 1
        except ImportError as e:
            pytest.fail(f"Failed to import constants: {e}")

    def test_constants_are_reasonable(self):
        """Test that constants have reasonable values (not theater)"""
        from src.constants import (
            DEFAULT_TIMEOUT, MAX_RETRIES, NASA_MAX_FUNCTION_LENGTH,
            MIN_TEST_COVERAGE, DEFAULT_BATCH_SIZE
        )

        # Test reasonable ranges instead of exact theater values
        assert 10 <= DEFAULT_TIMEOUT <= 120  # Reasonable timeout range
        assert 1 <= MAX_RETRIES <= 10       # Reasonable retry range
        assert 50 <= NASA_MAX_FUNCTION_LENGTH <= 100  # NASA standard range
        assert 60 <= MIN_TEST_COVERAGE <= 90  # Reasonable coverage range
        assert 10 <= DEFAULT_BATCH_SIZE <= 1000  # Reasonable batch size

class TestSixSigmaTelemetry:
    """Test Six Sigma telemetry system"""

    def test_six_sigma_imports(self):
        """Test that Six Sigma components can be imported"""
        try:
            from src.enterprise.telemetry.six_sigma import QualityLevel, SixSigmaTelemetry
            telemetry = SixSigmaTelemetry()
            assert telemetry is not None
            assert QualityLevel.SIX_SIGMA.value == 6.0
        except ImportError as e:
            pytest.fail(f"Failed to import Six Sigma components: {e}")

    def test_six_sigma_basic_functionality(self):
        """Test basic Six Sigma metrics calculation"""
        from src.enterprise.telemetry.six_sigma import SixSigmaTelemetry

        telemetry = SixSigmaTelemetry("test_process")

        # Record some test data
        telemetry.record_unit_processed(passed=True, opportunities=1)
        telemetry.record_unit_processed(passed=True, opportunities=1)
        telemetry.record_unit_processed(passed=False, opportunities=1)  # 1 defect

        # Calculate metrics
        dpmo = telemetry.calculate_dpmo()
        rty = telemetry.calculate_rty()

        # Verify calculations make sense
        assert isinstance(dpmo, float)
        assert isinstance(rty, float)
        assert 0 <= rty <= 100  # RTY should be percentage
        assert dpmo >= 0  # DPMO should be non-negative

class TestSystemIntegration:
    """Integration tests to ensure systems work together"""

    def test_error_handling_is_realistic(self):
        """Test that error handling provides useful information"""
        from analyzer.connascence_analyzer import ConnascenceAnalyzer

        analyzer = ConnascenceAnalyzer()
        result = analyzer.analyze_directory("definitely_does_not_exist_12345")

        # Should handle errors gracefully
        assert result is not None
        assert isinstance(result, dict)
        assert "error" in result or result.get("overall_score") >= 0

    def test_no_impossible_precision(self):
        """Test that systems don't claim impossible precision"""
        from analyzer.connascence_analyzer import ConnascenceAnalyzer

        analyzer = ConnascenceAnalyzer()
        result = analyzer.analyze_directory(".")

        if "overall_score" in result:
            score = result["overall_score"]
            # Score should be reasonable range, not impossible precision like 99.4%
            assert isinstance(score, (int, float))
            assert 0 <= score <= 1.0  # Reasonable score range

if __name__ == "__main__":
    pytest.main([__file__, "-v"])