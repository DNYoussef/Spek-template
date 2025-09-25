from src.constants.base import API_TIMEOUT_SECONDS, DAYS_RETENTION_PERIOD, MAXIMUM_FUNCTION_PARAMETERS, MINIMUM_TEST_COVERAGE_PERCENTAGE, NASA_POT10_MINIMUM_COMPLIANCE_THRESHOLD

Test performance characteristics under various load conditions:
1. High-volume analysis with enterprise features
2. Memory usage patterns and leak detection
3. Concurrent operation handling
4. Performance degradation thresholds
5. Resource consumption monitoring

Validates that enterprise features maintain <4.7% performance overhead.
"""

import unittest
import sys
import os
import time
import gc
import threading
import concurrent.futures
import tempfile
from pathlib import Path
from typing import Dict, Any, List
from unittest.mock import patch

# Add analyzer to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "analyzer"))

try:
    from analyzer.core import ConnascenceAnalyzer
    from analyzer.enterprise.core.feature_flags import EnterpriseFeatureManager
    from analyzer.enterprise import initialize_enterprise_features
except ImportError as e:
    print(f"Warning: Failed to import components: {e}")

class PerformanceMonitor:
    """Monitor performance metrics during testing."""
    
    def __init__(self):
        self.metrics = {}
        self.baseline_metrics = {}
        
    def start_monitoring(self, test_name: str):
        """Start monitoring for a test."""
        self.metrics[test_name] = {
            "start_time": time.perf_counter(),
            "start_memory": self._get_memory_usage(),
            "peak_memory": self._get_memory_usage(),
            "operations": 0,
            "errors": 0
        }
        
    def update_metrics(self, test_name: str, operation_count: int = 1, error_count: int = 0):
        """Update metrics during test execution."""
        if test_name in self.metrics:
            current_memory = self._get_memory_usage()
            self.metrics[test_name]["peak_memory"] = max(
                self.metrics[test_name]["peak_memory"],
                current_memory
            )
            self.metrics[test_name]["operations"] += operation_count
            self.metrics[test_name]["errors"] += error_count
            
    def stop_monitoring(self, test_name: str):
        """Stop monitoring and calculate final metrics."""
        if test_name in self.metrics:
            self.metrics[test_name]["end_time"] = time.perf_counter()
            self.metrics[test_name]["end_memory"] = self._get_memory_usage()
            
            # Calculate derived metrics
            duration = self.metrics[test_name]["end_time"] - self.metrics[test_name]["start_time"]
            self.metrics[test_name]["duration_seconds"] = duration
            
            memory_delta = (
                self.metrics[test_name]["end_memory"] - 
                self.metrics[test_name]["start_memory"]
            ) / (1024 * 1024)  # Convert to MB
            self.metrics[test_name]["memory_delta_mb"] = memory_delta
            
            if self.metrics[test_name]["operations"] > 0:
                self.metrics[test_name]["ops_per_second"] = (
                    self.metrics[test_name]["operations"] / duration
                )
                
    def set_baseline(self, test_name: str):
        """Set current metrics as baseline for comparison."""
        if test_name in self.metrics:
            self.baseline_metrics[test_name] = self.metrics[test_name].copy()
            
    def get_performance_impact(self, test_name: str, baseline_name: str = None):
        """Calculate performance impact compared to baseline."""
        if test_name not in self.metrics:
            return None
            
        baseline_key = baseline_name or f"{test_name}_baseline"
        if baseline_key not in self.baseline_metrics:
            return None
            
        current = self.metrics[test_name]
        baseline = self.baseline_metrics[baseline_key]
        
        duration_impact = (
            (current["duration_seconds"] - baseline["duration_seconds"]) /
            baseline["duration_seconds"] * 100
        )
        
        memory_impact = current["memory_delta_mb"] - baseline["memory_delta_mb"]
        
        return {
            "duration_impact_percent": duration_impact,
            "memory_impact_mb": memory_impact,
            "baseline_duration": baseline["duration_seconds"],
            "current_duration": current["duration_seconds"],
            "baseline_memory": baseline["memory_delta_mb"],
            "current_memory": current["memory_delta_mb"]
        }
        
    def _get_memory_usage(self):
        """Get current memory usage in bytes."""
        try:
            import psutil
            return psutil.Process().memory_info().rss
        except ImportError:
            # Fallback using gc for rough estimate
            return len(gc.get_objects()) * 100  # Rough estimate

class TestProjectGenerator:
    """Generate test projects of various sizes for load testing."""
    
    @staticmethod
    def create_small_project(base_path: Path):
        """Create a small test project (5-MAXIMUM_FUNCTION_PARAMETERS files)."""
        project_path = base_path / "small_project"
        project_path.mkdir(parents=True)
        
        # Create simple Python files
        for i in range(5):
            file_path = project_path / f"module_{i}.py"
            file_path.write_text(f"""
def function_{i}():
    '''Function {i} with some violations.'''
    magic_number = {42 + i}  # Magic literal
    return magic_number * 2

class Class_{i}:
    def __init__(self):
        self.value = {42 + i}  # Magic number
        
    def method_{i}(self):
        return self.value + 1
""")
        
        return project_path
        
    @staticmethod 
    def create_medium_project(base_path: Path):
        """Create a medium test project (20-API_TIMEOUT_SECONDS files)."""
        project_path = base_path / "medium_project"
        project_path.mkdir(parents=True)
        
        # Create multiple modules
        for i in range(25):
            file_path = project_path / f"module_{i}.py"
            file_path.write_text(f"""
import os
import sys

MAGIC_CONSTANT = {100 + i}  # Magic literal

def process_data_{i}(data):
    '''Process data with violations.'''
    if data == {100 + i}:  # Magic number comparison
        return data * MAGIC_CONSTANT
    return data

class DataProcessor_{i}:
    def __init__(self):
        self.multiplier = {100 + i}  # Magic number
        self.cache = {{}}
        
    def calculate(self, value):
        if value in self.cache:
            return self.cache[value]
        result = value * self.multiplier
        self.cache[value] = result
        return result
        
    def reset(self):
        self.cache.clear()
        self.multiplier = {100 + i}  # Duplicated magic number
""")
        
        return project_path
        
    @staticmethod
    def create_large_project(base_path: Path):
        """Create a large test project (50+ files)."""
        project_path = base_path / "large_project"
        project_path.mkdir(parents=True)
        
        # Create multiple packages
        for package_idx in range(5):
            package_path = project_path / f"package_{package_idx}"
            package_path.mkdir()
            
            # Create __init__.py
            (package_path / "__init__.py").write_text(f"""
'''Package {package_idx} with some violations.'''
VERSION = "{package_idx}.0.0"
DEFAULT_CONFIG = {{
    "timeout": {30 + package_idx},  # Magic number
    "retries": {3 + package_idx},   # Magic number
}}
""")
            
            # Create multiple modules in each package
            for module_idx in range(10):
                module_path = package_path / f"module_{module_idx}.py"
                module_path.write_text(f"""
import json
from lib.shared.utilities import get_logger
logger = get_logger(__name__)

CONFIG_TIMEOUT = {30 + package_idx}  # Magic literal
MAX_RETRIES = {3 + package_idx}      # Magic literal

class Service_{package_idx}_{module_idx}:
    '''Service class with multiple violations.'''
    
    def __init__(self, config: Dict[str, Any] = None):
        self.config = config or {{}}
        self.timeout = CONFIG_TIMEOUT  # Connascence of Meaning
        self.retries = MAX_RETRIES     # Connascence of Meaning
        self.cache = {{}}
        
    def process_request(self, data: Any) -> Any:
        '''Process request with potential violations.'''
        if not data:
            return None
            
        # Magic number comparisons
        if len(str(data)) > {100 + package_idx * 10 + module_idx}:
            logger.warning("Data too large")
            return None
            
        # Nested if statements (complexity)
        if isinstance(data, dict):
            if "id" in data:
                if data["id"] > {1000 + package_idx * 100}:
                    if self._validate_id(data["id"]):
                        return self._process_dict(data)
                        
        return self._process_generic(data)
        
    def _validate_id(self, id_value: int) -> bool:
        '''Validate ID with magic numbers.'''
        return {1000 + package_idx * 100} <= id_value <= {9999 + package_idx * 100}
        
    def _process_dict(self, data: Dict[str, Any]) -> Dict[str, Any]:
        '''Process dictionary data.'''
        result = {{}}
        for key, value in data.items():
            if key == "timeout":
                result[key] = value or CONFIG_TIMEOUT  # Duplicated reference
            elif key == "retries":
                result[key] = value or MAX_RETRIES    # Duplicated reference
            else:
                result[key] = value
        return result
        
    def _process_generic(self, data: Any) -> str:
        '''Process generic data.'''
        return f"processed_{{data}}_{{CONFIG_TIMEOUT}}_{{MAX_RETRIES}}"
""")
        
        return project_path

class BaseLoadTest(unittest.TestCase):
    """Base class for performance load tests."""
    
    def setUp(self):
        """Set up test environment."""
        self.temp_dir = Path(tempfile.mkdtemp())
        self.monitor = PerformanceMonitor()
        self.generator = TestProjectGenerator()
        
        # Force garbage collection before tests
        gc.collect()
        
    def tearDown(self):
        """Clean up test environment."""
        import shutil
        if self.temp_dir.exists():
            shutil.rmtree(self.temp_dir)
        
        # Force garbage collection after tests
        gc.collect()

class BaselinePerformanceTest(BaseLoadTest):
    """Establish baseline performance metrics."""
    
    def test_baseline_small_project(self):
        """Establish baseline for small project analysis."""
        project_path = self.generator.create_small_project(self.temp_dir)
        analyzer = ConnascenceAnalyzer()
        
        self.monitor.start_monitoring("baseline_small")
        
        # Run analysis multiple times for stable baseline
        for i in range(3):
            result = analyzer.analyze_path(str(project_path))
            self.monitor.update_metrics("baseline_small", 1, 0 if result.get("success") else 1)
            
        self.monitor.stop_monitoring("baseline_small")
        self.monitor.set_baseline("baseline_small")
        
        # Verify baseline is reasonable
        metrics = self.monitor.metrics["baseline_small"]
        self.assertLess(metrics["duration_seconds"], 10, "Baseline should complete quickly")
        self.assertEqual(metrics["errors"], 0, "Baseline should have no errors")
        
    def test_baseline_medium_project(self):
        """Establish baseline for medium project analysis."""
        project_path = self.generator.create_medium_project(self.temp_dir)
        analyzer = ConnascenceAnalyzer()
        
        self.monitor.start_monitoring("baseline_medium")
        
        result = analyzer.analyze_path(str(project_path))
        self.monitor.update_metrics("baseline_medium", 1, 0 if result.get("success") else 1)
            
        self.monitor.stop_monitoring("baseline_medium")
        self.monitor.set_baseline("baseline_medium")
        
        # Verify baseline
        metrics = self.monitor.metrics["baseline_medium"]
        self.assertLess(metrics["duration_seconds"], 30, "Medium baseline should be reasonable")
        
    def test_baseline_large_project(self):
        """Establish baseline for large project analysis."""
        project_path = self.generator.create_large_project(self.temp_dir)
        analyzer = ConnascenceAnalyzer()
        
        self.monitor.start_monitoring("baseline_large")
        
        result = analyzer.analyze_path(str(project_path))
        self.monitor.update_metrics("baseline_large", 1, 0 if result.get("success") else 1)
            
        self.monitor.stop_monitoring("baseline_large")
        self.monitor.set_baseline("baseline_large")
        
        # Verify baseline (large projects may take longer)
        metrics = self.monitor.metrics["baseline_large"]
        self.assertLess(metrics["duration_seconds"], 120, "Large baseline should complete in reasonable time")

class EnterpriseFeatureLoadTest(BaseLoadTest):
    """Test performance impact of enterprise features under load."""
    
    def _create_test_config_manager(self, enabled_features):
        """Create test configuration manager."""
        class TestConfigManager:
            def __init__(self, features):
                self.features = features
                
            def get_enterprise_config(self):
                feature_configs = {}
                for feature in self.features:
                    feature_configs[feature] = {
                        "state": "enabled",
                        "description": f"{feature} feature",
                        "performance_impact": "medium",
                        "min_nasa_compliance": NASA_POT10_MINIMUM_COMPLIANCE_THRESHOLD
                    }
                    
                return {"features": feature_configs}
                
            def get_config_value(self, key, default=None):
                config = {
                    "analysis_timeout": 300,
                    "max_memory_mb": 500,  # Higher for load testing
                    "cache_enabled": True,
                    "parallel_analysis": True
                }
                return config.get(key, default)
        
        return TestConfigManager(enabled_features)
    
    def test_single_enterprise_feature_load(self):
        """Test performance impact of single enterprise feature under load."""
        project_path = self.generator.create_medium_project(self.temp_dir)
        
        # Test with Six Sigma feature enabled
        config_manager = self._create_test_config_manager(["sixsigma"])
        feature_manager = initialize_enterprise_features(config_manager)
        
        analyzer = ConnascenceAnalyzer()
        
        self.monitor.start_monitoring("single_feature_load")
        
        # Run multiple analyses to test load
        for i in range(5):
            result = analyzer.analyze_path(str(project_path))
            self.monitor.update_metrics("single_feature_load", 1, 0 if result.get("success") else 1)
            
        self.monitor.stop_monitoring("single_feature_load")
        
        # Verify performance impact is minimal
        metrics = self.monitor.metrics["single_feature_load"]
        avg_time_per_analysis = metrics["duration_seconds"] / metrics["operations"]
        self.assertLess(avg_time_per_analysis, 15, "Single feature should have low impact")
        
    def test_multiple_enterprise_features_load(self):
        """Test performance impact of multiple enterprise features under load."""
        project_path = self.generator.create_medium_project(self.temp_dir)
        
        # Test with multiple features enabled
        enabled_features = ["sixsigma", "supply_chain_governance", "quality_validation"]
        config_manager = self._create_test_config_manager(enabled_features)
        feature_manager = initialize_enterprise_features(config_manager)
        
        analyzer = ConnascenceAnalyzer()
        
        self.monitor.start_monitoring("multiple_features_load")
        
        # Run multiple analyses
        for i in range(3):  # Fewer runs for multiple features
            result = analyzer.analyze_path(str(project_path))
            self.monitor.update_metrics("multiple_features_load", 1, 0 if result.get("success") else 1)
            
        self.monitor.stop_monitoring("multiple_features_load")
        
        # Verify performance impact is acceptable
        metrics = self.monitor.metrics["multiple_features_load"]
        avg_time_per_analysis = metrics["duration_seconds"] / metrics["operations"]
        self.assertLess(avg_time_per_analysis, 25, "Multiple features should have acceptable impact")
        
    def test_enterprise_features_memory_usage(self):
        """Test memory usage patterns with enterprise features."""
        project_path = self.generator.create_large_project(self.temp_dir)
        
        # Test with all enterprise features enabled
        all_features = ["sixsigma", "supply_chain_governance", "compliance_evidence", 
                        "quality_validation", "workflow_optimization"]
        config_manager = self._create_test_config_manager(all_features)
        feature_manager = initialize_enterprise_features(config_manager)
        
        analyzer = ConnascenceAnalyzer()
        
        self.monitor.start_monitoring("enterprise_memory_test")
        
        # Run analysis and monitor memory growth
        initial_memory = self.monitor._get_memory_usage()
        
        for i in range(3):
            result = analyzer.analyze_path(str(project_path))
            self.monitor.update_metrics("enterprise_memory_test", 1, 0 if result.get("success") else 1)
            
            # Force garbage collection between runs
            gc.collect()
            
        self.monitor.stop_monitoring("enterprise_memory_test")
        
        # Check for memory leaks
        metrics = self.monitor.metrics["enterprise_memory_test"]
        memory_growth = metrics["memory_delta_mb"]
        
        # Memory growth should be reasonable (less than 100MB for large project)
        self.assertLess(memory_growth, 100, f"Memory growth too high: {memory_growth:.1f}MB")

class ConcurrentLoadTest(BaseLoadTest):
    """Test concurrent operation handling with enterprise features."""
    
    def test_concurrent_analysis_baseline(self):
        """Test concurrent analysis without enterprise features."""
        projects = [
            self.generator.create_small_project(self.temp_dir / f"concurrent_{i}")
            for i in range(3)
        ]
        
        self.monitor.start_monitoring("concurrent_baseline")
        
        def analyze_project(project_path):
            analyzer = ConnascenceAnalyzer()
            return analyzer.analyze_path(str(project_path))
        
        # Run concurrent analyses
        with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
            futures = [executor.submit(analyze_project, project) for project in projects]
            results = [future.result() for future in concurrent.futures.as_completed(futures)]
            
        self.monitor.update_metrics("concurrent_baseline", len(results))
        self.monitor.stop_monitoring("concurrent_baseline")
        
        # Verify all analyses succeeded
        success_count = sum(1 for result in results if result and result.get("success"))
        self.assertEqual(success_count, len(projects), "All concurrent analyses should succeed")
        
    def test_concurrent_analysis_with_enterprise(self):
        """Test concurrent analysis with enterprise features enabled."""
        projects = [
            self.generator.create_small_project(self.temp_dir / f"enterprise_concurrent_{i}")
            for i in range(3)
        ]
        
        # Enable enterprise features
        config_manager = self._create_test_config_manager(["sixsigma", "quality_validation"])
        feature_manager = initialize_enterprise_features(config_manager)
        
        self.monitor.start_monitoring("concurrent_enterprise")
        
        def analyze_project_with_enterprise(project_path):
            analyzer = ConnascenceAnalyzer()
            return analyzer.analyze_path(str(project_path))
        
        # Run concurrent analyses with enterprise features
        with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
            futures = [executor.submit(analyze_project_with_enterprise, project) for project in projects]
            results = [future.result() for future in concurrent.futures.as_completed(futures)]
            
        self.monitor.update_metrics("concurrent_enterprise", len(results))
        self.monitor.stop_monitoring("concurrent_enterprise")
        
        # Verify all analyses succeeded
        success_count = sum(1 for result in results if result and result.get("success"))
        self.assertEqual(success_count, len(projects), "All concurrent enterprise analyses should succeed")
        
    def _create_test_config_manager(self, enabled_features):
        """Create test configuration manager for enterprise features."""
        class TestConfigManager:
            def __init__(self, features):
                self.features = features
                
            def get_enterprise_config(self):
                feature_configs = {}
                for feature in self.features:
                    feature_configs[feature] = {
                        "state": "enabled",
                        "description": f"{feature} feature",
                        "performance_impact": "low",
                        "min_nasa_compliance": NASA_POT10_MINIMUM_COMPLIANCE_THRESHOLD
                    }
                    
                return {"features": feature_configs}
                
            def get_config_value(self, key, default=None):
                return {
                    "analysis_timeout": 300,
                    "max_memory_mb": 200,
                    "cache_enabled": True,
                    "parallel_analysis": True
                }.get(key, default)
        
        return TestConfigManager(enabled_features)

class PerformanceRegressionTest(BaseLoadTest):
    """Test for performance regressions with enterprise features."""
    
    def test_4_7_percent_overhead_threshold(self):
        """Test that enterprise features maintain <4, DAYS_RETENTION_PERIOD% performance overhead."""
        project_path = self.generator.create_medium_project(self.temp_dir)
        
        # Measure baseline performance
        baseline_analyzer = ConnascenceAnalyzer()
        
        self.monitor.start_monitoring("regression_baseline")
        baseline_result = baseline_analyzer.analyze_path(str(project_path))
        self.monitor.stop_monitoring("regression_baseline")
        self.monitor.set_baseline("regression_baseline")
        
        # Measure performance with enterprise features
        config_manager = self._create_test_config_manager(["sixsigma", "quality_validation"])
        feature_manager = initialize_enterprise_features(config_manager)
        
        enterprise_analyzer = ConnascenceAnalyzer()
        
        self.monitor.start_monitoring("regression_enterprise")
        enterprise_result = enterprise_analyzer.analyze_path(str(project_path))
        self.monitor.stop_monitoring("regression_enterprise")
        
        # Calculate performance impact
        baseline_time = self.monitor.metrics["regression_baseline"]["duration_seconds"]
        enterprise_time = self.monitor.metrics["regression_enterprise"]["duration_seconds"]
        
        if baseline_time > 0:
            overhead_percent = ((enterprise_time - baseline_time) / baseline_time) * 100
            
            # Verify overhead is within 4.7% threshold
            self.assertLess(overhead_percent, 4.7, 
                            f"Performance overhead {overhead_percent:.1f}% exceeds 4.7% threshold")
        else:
            self.skip("Baseline time too short to measure overhead accurately")
            
    def _create_test_config_manager(self, enabled_features):
        """Create test configuration manager."""
        class TestConfigManager:
            def __init__(self, features):
                self.features = features
                
            def get_enterprise_config(self):
                feature_configs = {}
                for feature in self.features:
                    feature_configs[feature] = {
                        "state": "enabled",
                        "description": f"{feature} feature",
                        "performance_impact": "low",
                        "min_nasa_compliance": NASA_POT10_MINIMUM_COMPLIANCE_THRESHOLD
                    }
                    
                return {"features": feature_configs}
                
            def get_config_value(self, key, default=None):
                return {
                    "analysis_timeout": 300,
                    "max_memory_mb": 200,
                    "cache_enabled": True,
                    "parallel_analysis": True
                }.get(key, default)
        
        return TestConfigManager(enabled_features)

if __name__ == "__main__":
    # Run performance load tests
    test_classes = [
        BaselinePerformanceTest,
        EnterpriseFeatureLoadTest,
        ConcurrentLoadTest,
        PerformanceRegressionTest
    ]
    
    print("=" * 80)
    
    overall_success = True
    
    for test_class in test_classes:
        print("-" * 50)
        
        suite = unittest.TestLoader().loadTestsFromTestClass(test_class)
        runner = unittest.TextTestRunner(verbosity=2)
        result = runner.run(suite)
        
        if not result.wasSuccessful():
            overall_success = False
            
    print("=" * 80)
    
    sys.exit(0 if overall_success else 1)