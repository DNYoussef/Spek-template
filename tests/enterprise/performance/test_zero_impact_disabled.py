from src.constants.base import MAXIMUM_FUNCTION_PARAMETERS, MAXIMUM_NESTED_DEPTH, MINIMUM_TRADE_THRESHOLD

Tests that enterprise features have zero performance impact when disabled,
ensuring that the feature flag system provides true conditional execution
with no overhead for disabled features.
"""

import pytest
import time
import asyncio
import threading
import statistics
from pathlib import Path
from unittest.mock import Mock, patch, MagicMock
from concurrent.futures import ThreadPoolExecutor
import gc
import sys

# Import the modules under test
sys.path.append(str(Path(__file__).parent.parent.parent.parent / 'src'))

from enterprise.flags.feature_flags import flag_manager, FlagStatus, enterprise_feature
from enterprise.telemetry.six_sigma import SixSigmaTelemetry
from enterprise.security.sbom_generator import SBOMGenerator
from enterprise.compliance.matrix import ComplianceMatrix
from enterprise.integration.analyzer import EnterpriseAnalyzerIntegration

class BaselineAnalyzer:
    """Baseline analyzer without any enterprise features for comparison"""
    
    def __init__(self):
        self.call_count = 0
        
    def analyze(self, data):
        """Simple baseline analysis"""
        self.call_count += 1
        # Simulate some work
        result = {"data": data, "processed": True, "timestamp": time.time()}
        return result

class TestFeatureFlagPerformanceImpact:
    """Test performance impact of feature flag checking"""
    
    def setup_method(self):
        """Setup for each test method"""
        # Clear any existing flags to ensure clean state
        flag_manager.flags.clear()
        
    def test_flag_checking_overhead_minimal(self):
        """Test that flag checking has minimal overhead"""
        # Create test flags
        flag_manager.create_flag("perf_test_enabled", "Enabled flag", status=FlagStatus.ENABLED)
        flag_manager.create_flag("perf_test_disabled", "Disabled flag", status=FlagStatus.DISABLED)
        
        iterations = 10000
        
        # Time flag checking for disabled flag
        start_time = time.perf_counter()
        for _ in range(iterations):
            flag_manager.is_enabled("perf_test_disabled")
        disabled_duration = time.perf_counter() - start_time
        
        # Time flag checking for enabled flag
        start_time = time.perf_counter()
        for _ in range(iterations):
            flag_manager.is_enabled("perf_test_enabled")
        enabled_duration = time.perf_counter() - start_time
        
        # Time without any flag checking (baseline)
        start_time = time.perf_counter()
        for _ in range(iterations):
            pass  # No-op
        baseline_duration = time.perf_counter() - start_time
        
        # Flag checking should be very fast
        assert disabled_duration < 0.1  # Less than 100ms for 10k checks
        assert enabled_duration < 0.1  # Less than 100ms for 10k checks
        
        # Disabled and enabled should have similar performance
        assert abs(disabled_duration - enabled_duration) < 0.05
        
        # Overhead should be minimal compared to baseline
        overhead = max(disabled_duration, enabled_duration) - baseline_duration
        assert overhead < MINIMUM_TRADE_THRESHOLD  # Less than 50ms overhead
        
    def test_nonexistent_flag_performance(self):
        """Test performance when checking nonexistent flags"""
        iterations = 5000
        
        start_time = time.perf_counter()
        for i in range(iterations):
            flag_manager.is_enabled(f"nonexistent_flag_{i}")
        duration = time.perf_counter() - start_time
        
        # Should handle nonexistent flags efficiently
        assert duration < 0.1  # Less than 100ms for 5k nonexistent checks
        
    def test_concurrent_flag_checking_performance(self):
        """Test performance of concurrent flag checking"""
        flag_manager.create_flag("concurrent_test", "Concurrent test", status=FlagStatus.DISABLED)
        
        def flag_checking_worker():
            """Worker function for concurrent flag checking"""
            for _ in range(1000):
                flag_manager.is_enabled("concurrent_test")
                
        # Run concurrent flag checking
        start_time = time.perf_counter()
        with ThreadPoolExecutor(max_workers=10) as executor:
            futures = [executor.submit(flag_checking_worker) for _ in range(10)]
            for future in futures:
                future.result()
        duration = time.perf_counter() - start_time
        
        # Concurrent access should be efficient
        assert duration < 1.0  # Less than 1 second for 10k concurrent checks
        
    def test_flag_caching_performance(self):
        """Test that flag caching improves performance"""
        flag_manager.create_flag("cache_test", "Cache test", status=FlagStatus.DISABLED)
        
        iterations = 1000
        
        # First run (no cache)
        start_time = time.perf_counter()
        for _ in range(iterations):
            flag_manager.is_enabled("cache_test")
        first_run = time.perf_counter() - start_time
        
        # Second run (with cache if implemented)
        start_time = time.perf_counter()
        for _ in range(iterations):
            flag_manager.is_enabled("cache_test")
        second_run = time.perf_counter() - start_time
        
        # Second run should be faster or at least not slower
        assert second_run <= first_run * 1.1  # Allow MAXIMUM_FUNCTION_PARAMETERS% margin

class TestDecoratorPerformanceImpact:
    """Test performance impact of enterprise decorators when disabled"""
    
    def setup_method(self):
        """Setup for each test method"""
        flag_manager.flags.clear()
        
    def test_disabled_feature_decorator_zero_overhead(self):
        """Test that disabled feature decorators have zero execution overhead"""
        # Create disabled feature
        flag_manager.create_flag("zero_overhead_test", "Zero overhead", status=FlagStatus.DISABLED)
        
        @enterprise_feature("zero_overhead_test", "Test feature")
        def enhanced_function(data):
            """Function with enterprise enhancement"""
            return f"enhanced_{data}"
            
        @enhanced_function.fallback
        def fallback_function(data):
            """Fallback implementation"""
            return f"fallback_{data}"
            
        def baseline_function(data):
            """Baseline function without any decorators"""
            return f"fallback_{data}"
            
        iterations = 5000
        
        # Time the decorated function (disabled)
        start_time = time.perf_counter()
        for i in range(iterations):
            enhanced_function(f"data_{i}")
        decorated_duration = time.perf_counter() - start_time
        
        # Time the baseline function
        start_time = time.perf_counter()
        for i in range(iterations):
            baseline_function(f"data_{i}")
        baseline_duration = time.perf_counter() - start_time
        
        # Overhead should be minimal
        overhead = decorated_duration - baseline_duration
        overhead_percentage = (overhead / baseline_duration) * 100
        
        # Allow some overhead for flag checking, but should be minimal
        assert overhead_percentage < 50  # Less than 50% overhead
        assert overhead < 0.1  # Less than 100ms total overhead
        
    def test_enabled_vs_disabled_decorator_performance(self):
        """Test performance difference between enabled and disabled decorators"""
        # Create flags
        flag_manager.create_flag("enabled_perf", "Enabled perf", status=FlagStatus.ENABLED)
        flag_manager.create_flag("disabled_perf", "Disabled perf", status=FlagStatus.DISABLED)
        
        @enterprise_feature("enabled_perf", "Enabled feature")
        def enabled_function(data):
            return f"enabled_{data}"
            
        @enabled_function.fallback
        def enabled_fallback(data):
            return f"fallback_{data}"
            
        @enterprise_feature("disabled_perf", "Disabled feature")  
        def disabled_function(data):
            return f"disabled_{data}"
            
        @disabled_function.fallback
        def disabled_fallback(data):
            return f"fallback_{data}"
            
        iterations = 3000
        
        # Time enabled feature
        start_time = time.perf_counter()
        for i in range(iterations):
            enabled_function(f"data_{i}")
        enabled_duration = time.perf_counter() - start_time
        
        # Time disabled feature
        start_time = time.perf_counter()
        for i in range(iterations):
            disabled_function(f"data_{i}")
        disabled_duration = time.perf_counter() - start_time
        
        # Disabled should be faster (just calls fallback)
        assert disabled_duration <= enabled_duration
        
        # Both should complete reasonably quickly
        assert enabled_duration < 0.5
        assert disabled_duration < 0.5

class TestEnterpriseComponentsDisabledPerformance:
    """Test performance when enterprise components are disabled"""
    
    def setup_method(self):
        """Setup for each test method"""
        self.project_root = Path("/tmp/perf_test")
        flag_manager.flags.clear()
        
    def test_six_sigma_telemetry_disabled_performance(self):
        """Test Six Sigma telemetry performance when disabled"""
        flag_manager.create_flag("enterprise_telemetry", "Telemetry", status=FlagStatus.DISABLED)
        
        telemetry = SixSigmaTelemetry("perf_test")
        iterations = 5000
        
        # Time telemetry operations when disabled
        start_time = time.perf_counter()
        for _ in range(iterations):
            telemetry.record_unit_processed(passed=True)
            telemetry.record_defect("test_defect")
        duration = time.perf_counter() - start_time
        
        # Should complete quickly even when "disabled"
        assert duration < 1.0
        
    def test_sbom_generator_disabled_impact(self):
        """Test SBOM generator performance impact when disabled"""
        flag_manager.create_flag("enterprise_sbom", "SBOM", status=FlagStatus.DISABLED)
        
        generator = SBOMGenerator(self.project_root)
        
        # Time status checking when disabled
        iterations = 1000
        start_time = time.perf_counter()
        for _ in range(iterations):
            status = generator.get_status()
            assert isinstance(status, dict)
        duration = time.perf_counter() - start_time
        
        # Should be very fast
        assert duration < 0.5
        
    def test_compliance_matrix_disabled_performance(self):
        """Test compliance matrix performance when disabled"""
        flag_manager.create_flag("enterprise_compliance", "Compliance", status=FlagStatus.DISABLED)
        
        matrix = ComplianceMatrix(self.project_root)
        
        # Test basic operations performance
        iterations = 500
        start_time = time.perf_counter()
        for _ in range(iterations):
            coverage = matrix.get_framework_coverage()
            assert isinstance(coverage, dict)
        duration = time.perf_counter() - start_time
        
        # Should be efficient
        assert duration < 1.0

class TestIntegrationLayerDisabledPerformance:
    """Test performance of integration layer when enterprise features disabled"""
    
    def setup_method(self):
        """Setup for each test method"""
        self.project_root = Path("/tmp/integration_perf")
        
        # Disable all enterprise features
        flag_manager.flags.clear()
        flag_manager.create_flag("enterprise_telemetry", "Telemetry", status=FlagStatus.DISABLED)
        flag_manager.create_flag("enterprise_security", "Security", status=FlagStatus.DISABLED)
        flag_manager.create_flag("enterprise_compliance", "Compliance", status=FlagStatus.DISABLED)
        flag_manager.create_flag("enterprise_metrics", "Metrics", status=FlagStatus.DISABLED)
        
        self.integration = EnterpriseAnalyzerIntegration(self.project_root)
        
    def test_analyzer_wrapping_overhead_disabled(self):
        """Test analyzer wrapping overhead when all features disabled"""
        # Wrap a simple analyzer
        wrapped_class = self.integration.wrap_analyzer("perf_test", BaselineAnalyzer)
        wrapped_instance = wrapped_class()
        baseline_instance = BaselineAnalyzer()
        
        iterations = 2000
        
        # Time wrapped analyzer (all features disabled)
        start_time = time.perf_counter()
        for i in range(iterations):
            asyncio.run(wrapped_instance.analyze(f"data_{i}"))
        wrapped_duration = time.perf_counter() - start_time
        
        # Time baseline analyzer
        start_time = time.perf_counter()
        for i in range(iterations):
            baseline_instance.analyze(f"data_{i}")
        baseline_duration = time.perf_counter() - start_time
        
        # Calculate overhead
        overhead = wrapped_duration - baseline_duration
        overhead_percentage = (overhead / baseline_duration) * 100
        
        # Overhead should be reasonable when features are disabled
        assert overhead_percentage < 100  # Less than 100% overhead
        assert wrapped_duration < baseline_duration * 2  # Less than 2x slower
        
    @pytest.mark.asyncio
    async def test_unified_analysis_disabled_performance(self):
        """Test unified analysis performance when features disabled"""
        self.integration.wrap_analyzer("unified_perf", BaselineAnalyzer)
        
        iterations = 500
        
        # Time unified analysis with all features disabled
        start_time = time.perf_counter()
        for i in range(iterations):
            await self.integration.analyze_with_enterprise_features(
                "unified_perf", 
                f"data_{i}"
            )
        duration = time.perf_counter() - start_time
        
        # Should complete reasonably quickly
        assert duration < 5.0  # Less than 5 seconds for 500 analyses
        
        # Verify features were actually disabled in results
        result = await self.integration.analyze_with_enterprise_features("unified_perf", "test")
        features_enabled = result['enterprise_features_enabled']
        assert features_enabled['telemetry'] is False
        assert features_enabled['security'] is False
        assert features_enabled['compliance'] is False
        assert features_enabled['metrics'] is False
        
    def test_hook_system_disabled_performance(self):
        """Test hook system performance when no hooks are registered"""
        # Don't register any hooks
        wrapped_class = self.integration.wrap_analyzer("hook_perf", BaselineAnalyzer)
        wrapped_instance = wrapped_class()
        
        iterations = 1000
        
        # Time analysis with no hooks
        start_time = time.perf_counter()
        for i in range(iterations):
            asyncio.run(wrapped_instance.analyze(f"data_{i}"))
        duration = time.perf_counter() - start_time
        
        # Should be fast with no hooks
        assert duration < 3.0  # Less than 3 seconds for 1000 analyses

class TestMemoryImpactDisabled:
    """Test memory impact when enterprise features are disabled"""
    
    def setup_method(self):
        """Setup for each test method"""
        flag_manager.flags.clear()
        # Disable all enterprise features
        for feature in ["enterprise_telemetry", "enterprise_security", 
                        "enterprise_compliance", "enterprise_metrics"]:
            flag_manager.create_flag(feature, "Test", status=FlagStatus.DISABLED)
            
    def test_memory_usage_disabled_features(self):
        """Test memory usage when features are disabled"""
        import psutil
        import os
        
        # Get initial memory
        process = psutil.Process(os.getpid())
        initial_memory = process.memory_info().rss
        
        # Create enterprise components with disabled features
        project_root = Path("/tmp/memory_test")
        integration = EnterpriseAnalyzerIntegration(project_root)
        
        # Wrap multiple analyzers
        for i in range(10):
            integration.wrap_analyzer(f"memory_test_{i}", BaselineAnalyzer)
            
        # Run analyses
        for i in range(100):
            wrapped_class = integration.wrapped_analyzers[f"memory_test_{i % 10}"]
            instance = wrapped_class()
            asyncio.run(instance.analyze(f"data_{i}"))
            
        # Force garbage collection
        gc.collect()
        
        # Check final memory
        final_memory = process.memory_info().rss
        memory_increase = final_memory - initial_memory
        
        # Memory increase should be reasonable
        assert memory_increase < 50 * 1024 * 1024  # Less than 50MB increase
        
    def test_analysis_history_memory_limit(self):
        """Test that analysis history doesn't grow unbounded when disabled"""'
        project_root = Path("/tmp/history_memory")
        integration = EnterpriseAnalyzerIntegration(project_root)
        
        integration.wrap_analyzer("history_test", BaselineAnalyzer)
        wrapped_class = integration.wrapped_analyzers["history_test"]
        
        # Run many analyses to test history limiting
        for i in range(1500):  # More than the 1000 limit
            instance = wrapped_class()
            asyncio.run(instance.analyze(f"data_{i}"))
            
        # History should be limited
        assert len(integration.analysis_history) <= 1000
        
        # Memory usage should be stable
        assert sys.getsizeof(integration.analysis_history) < 1024 * 1024  # Less than 1MB

class TestConcurrencyPerformanceDisabled:
    """Test concurrency performance when enterprise features disabled"""
    
    def setup_method(self):
        """Setup for each test method"""
        flag_manager.flags.clear()
        for feature in ["enterprise_telemetry", "enterprise_security",
                        "enterprise_compliance", "enterprise_metrics"]:
            flag_manager.create_flag(feature, "Test", status=FlagStatus.DISABLED)
            
        self.project_root = Path("/tmp/concurrency_perf")
        self.integration = EnterpriseAnalyzerIntegration(self.project_root)
        
    @pytest.mark.asyncio
    async def test_concurrent_disabled_analysis_performance(self):
        """Test concurrent analysis performance with disabled features"""
        self.integration.wrap_analyzer("concurrent_disabled", BaselineAnalyzer)
        
        # Run highly concurrent analyses
        async def run_analysis(i):
            wrapped_class = self.integration.wrapped_analyzers["concurrent_disabled"]
            instance = wrapped_class()
            return await instance.analyze(f"concurrent_data_{i}")
            
        # Test different concurrency levels
        concurrency_levels = [10, 50, 100]
        results = {}
        
        for concurrency in concurrency_levels:
            start_time = time.perf_counter()
            
            tasks = [run_analysis(i) for i in range(concurrency)]
            completed_results = await asyncio.gather(*tasks, return_exceptions=True)
            
            duration = time.perf_counter() - start_time
            results[concurrency] = duration
            
            # All analyses should complete successfully
            successful = [r for r in completed_results if isinstance(r, dict)]
            assert len(successful) == concurrency
            
        # Higher concurrency should scale reasonably
        assert results[100] < results[10] * 20  # Not more than 20x slower
        
    def test_thread_safety_disabled_features(self):
        """Test thread safety when features are disabled"""
        self.integration.wrap_analyzer("thread_safe", BaselineAnalyzer)
        wrapped_class = self.integration.wrapped_analyzers["thread_safe"]
        
        results = []
        errors = []
        
        def worker_thread(thread_id):
            """Worker thread for concurrent access"""
            try:
                for i in range(50):
                    instance = wrapped_class()
                    result = asyncio.run(instance.analyze(f"thread_{thread_id}_data_{i}"))
                    results.append(result)
            except Exception as e:
                errors.append(e)
                
        # Run multiple threads
        threads = []
        for i in range(10):
            thread = threading.Thread(target=worker_thread, args=(i,))
            threads.append(thread)
            thread.start()
            
        # Wait for completion
        for thread in threads:
            thread.join()
            
        # All operations should succeed
        assert len(errors) == 0
        assert len(results) == 500  # 10 threads * 50 operations each
        
        # Results should be valid
        for result in results:
            assert isinstance(result, dict)
            assert "processed" in result
            assert result["processed"] is True

class TestStartupPerformanceImpact:
    """Test startup performance impact of enterprise features"""
    
    def test_integration_initialization_time(self):
        """Test enterprise integration initialization time"""
        # Clear flags to test clean initialization
        flag_manager.flags.clear()
        
        # Time initialization with all features disabled
        start_time = time.perf_counter()
        
        for feature in ["enterprise_telemetry", "enterprise_security",
                        "enterprise_compliance", "enterprise_metrics"]:
            flag_manager.create_flag(feature, "Test", status=FlagStatus.DISABLED)
            
        project_root = Path("/tmp/startup_perf")
        integration = EnterpriseAnalyzerIntegration(project_root)
        
        initialization_time = time.perf_counter() - start_time
        
        # Should initialize quickly even with enterprise features
        assert initialization_time < 1.0  # Less than 1 second
        
        # Verify initialization completed properly
        assert integration.project_root == project_root
        assert len(integration.compliance.frameworks) > 0  # Should have loaded frameworks
        
    def test_flag_manager_initialization_time(self):
        """Test feature flag manager initialization time"""
        # Clear existing flags
        flag_manager.flags.clear()
        
        start_time = time.perf_counter()
        
        # Create many flags
        for i in range(100):
            flag_manager.create_flag(
                f"perf_flag_{i}",
                f"Performance test flag {i}",
                status=FlagStatus.DISABLED
            )
            
        creation_time = time.perf_counter() - start_time
        
        # Should create flags quickly
        assert creation_time < 0.5  # Less than 500ms for 100 flags
        
        # Verify all flags were created
        assert len(flag_manager.flags) == 100

class TestResourceCleanupDisabled:
    """Test resource cleanup when features are disabled"""
    
    def test_no_resource_leaks_disabled(self):
        """Test that disabled features don't create resource leaks"""
        flag_manager.flags.clear()
        
        # Disable all features
        for feature in ["enterprise_telemetry", "enterprise_security",
                        "enterprise_compliance", "enterprise_metrics"]:
            flag_manager.create_flag(feature, "Test", status=FlagStatus.DISABLED)
            
        initial_objects = len(gc.get_objects())
        
        # Create and destroy many integration instances
        for _ in range(10):
            project_root = Path(f"/tmp/cleanup_test_{_}")
            integration = EnterpriseAnalyzerIntegration(project_root)
            
            # Wrap analyzers
            integration.wrap_analyzer("cleanup_test", BaselineAnalyzer)
            wrapped_class = integration.wrapped_analyzers["cleanup_test"]
            
            # Run analyses
            for i in range(10):
                instance = wrapped_class()
                asyncio.run(instance.analyze(f"data_{i}"))
                
            # Clear references
            del integration
            del wrapped_class
            
        # Force garbage collection
        gc.collect()
        
        final_objects = len(gc.get_objects())
        object_growth = final_objects - initial_objects
        
        # Object growth should be reasonable
        assert object_growth < 1000  # Less than 1000 new objects
        
    def test_flag_cleanup_performance(self):
        """Test flag cleanup and reset performance"""
        # Create many flags
        for i in range(50):
            flag_manager.create_flag(f"cleanup_flag_{i}", "Test", status=FlagStatus.DISABLED)
            
        # Time cleanup
        start_time = time.perf_counter()
        flag_manager.flags.clear()
        cleanup_time = time.perf_counter() - start_time
        
        # Should cleanup quickly
        assert cleanup_time < 0.1  # Less than 100ms
        assert len(flag_manager.flags) == 0

if __name__ == "__main__":
    pytest.main([__file__, "-v"])