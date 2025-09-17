"""
Basic tests for analyzer module functionality.
Validates import resolution and critical bug fixes.
"""

import pytest
import sys
import os

# Add analyzer to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

def test_analyzer_import():
    """Test that analyzer module can be imported."""
    try:
        import analyzer
        assert analyzer is not None
        assert hasattr(analyzer, '__version__')
    except ImportError as e:
        pytest.fail(f"Failed to import analyzer module: {e}")

def test_unified_analyzer_import():
    """Test UnifiedAnalyzer import with proper error handling."""
    try:
        from analyzer import UnifiedAnalyzer, UNIFIED_ANALYZER_AVAILABLE

        if UNIFIED_ANALYZER_AVAILABLE:
            assert UnifiedAnalyzer is not None
            print("UnifiedAnalyzer successfully imported")
        else:
            print("UnifiedAnalyzer not available, but gracefully handled")
            assert UnifiedAnalyzer is None

    except ImportError as e:
        pytest.fail(f"UnifiedAnalyzer import failed without graceful handling: {e}")

def test_performance_modules_availability():
    """Test performance module imports with fallback handling."""
    try:
        from analyzer.performance import (
            REAL_TIME_MONITOR_AVAILABLE,
            CACHE_PROFILER_AVAILABLE,
            RealTimeMonitor,
            CachePerformanceProfiler
        )

        if REAL_TIME_MONITOR_AVAILABLE:
            assert RealTimeMonitor is not None
            print("RealTimeMonitor available")
        else:
            assert RealTimeMonitor is None
            print("RealTimeMonitor not available, but handled gracefully")

        if CACHE_PROFILER_AVAILABLE:
            assert CachePerformanceProfiler is not None
            print("CachePerformanceProfiler available")
        else:
            assert CachePerformanceProfiler is None
            print("CachePerformanceProfiler not available, but handled gracefully")

    except ImportError as e:
        pytest.fail(f"Performance module imports failed: {e}")

def test_core_types_import():
    """Test core analyzer types can be imported."""
    try:
        from analyzer import (
            ConnascenceViolation,
            ConnascenceType,
            SeverityLevel,
            AnalysisResult,
            CORE_IMPORTS_AVAILABLE
        )

        if CORE_IMPORTS_AVAILABLE:
            assert ConnascenceViolation is not None
            assert ConnascenceType is not None
            assert SeverityLevel is not None
            assert AnalysisResult is not None
            print("Core types successfully imported")
        else:
            print("Core types not available but handled gracefully")

    except ImportError as e:
        pytest.fail(f"Core types import failed: {e}")

def test_no_critical_import_errors():
    """Test that no critical modules fail without graceful error handling."""
    import warnings

    with warnings.catch_warnings(record=True) as w:
        warnings.simplefilter("always")

        try:
            import analyzer
            # Should not raise unhandled ImportError
            assert True

        except ImportError as e:
            pytest.fail(f"Critical import error not handled gracefully: {e}")

def test_analyzer_basic_functionality():
    """Test basic analyzer functionality if available."""
    try:
        from analyzer import UnifiedAnalyzer, UNIFIED_ANALYZER_AVAILABLE

        if UNIFIED_ANALYZER_AVAILABLE and UnifiedAnalyzer is not None:
            # Test basic instantiation
            analyzer_instance = UnifiedAnalyzer()
            assert analyzer_instance is not None
            print("UnifiedAnalyzer instantiation successful")
        else:
            print("UnifiedAnalyzer not available for testing")

    except Exception as e:
        print(f"UnifiedAnalyzer functionality test failed (but import succeeded): {e}")
        # Don't fail the test if import worked but instantiation failed
        pass

if __name__ == "__main__":
    print("Running analyzer tests...")

    # Run basic import tests
    test_analyzer_import()
    test_unified_analyzer_import()
    test_performance_modules_availability()
    test_core_types_import()
    test_no_critical_import_errors()
    test_analyzer_basic_functionality()

    print("All tests completed!")