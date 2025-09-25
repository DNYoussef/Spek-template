from src.constants.base import NASA_POT10_MINIMUM_COMPLIANCE_THRESHOLD, NASA_POT10_TARGET_COMPLIANCE_THRESHOLD

Test incremental enablement of each enterprise domain:
- SR: Six Sigma and Statistical Process Control
- SC: Supply Chain Governance and SBOM
- CE: Compliance and Evidence collection
- QV: Quality Validation and NASA POT10
- WO: Workflow Optimization and Performance

NASA POT10 Compliant testing methodology.
"""

import unittest
import sys
import os
import time
import json
import tempfile
from pathlib import Path
from typing import Dict, Any, List
from unittest.mock import patch, MagicMock

# Add analyzer to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "analyzer"))

try:
    from analyzer.core import ConnascenceAnalyzer
    from analyzer.enterprise.core.feature_flags import EnterpriseFeatureManager, FeatureState, FeatureFlag
    from analyzer.enterprise import initialize_enterprise_features, get_enterprise_status
except ImportError as e:
    print(f"Warning: Failed to import components: {e}")

class TestConfigManager:
    """Test configuration manager for enterprise domain testing."""
    
    def __init__(self, enabled_features=None):
        self.enabled_features = enabled_features or []
        
    def get_enterprise_config(self):
        """Return enterprise configuration with specified features enabled."""
        features = {}
        
        # Six Sigma domain (SR)
        features["sixsigma"] = {
            "state": "enabled" if "sixsigma" in self.enabled_features else "disabled",
            "description": "Six Sigma quality analysis and DMAIC methodology",
            "performance_impact": "low",
            "min_nasa_compliance": 0.92
        }
        
        # Supply Chain domain (SC)
        features["supply_chain_governance"] = {
            "state": "enabled" if "supply_chain_governance" in self.enabled_features else "disabled",
            "description": "Supply chain security and SBOM analysis",
            "performance_impact": "medium",
            "min_nasa_compliance": 0.92
        }
        
        # Compliance and Evidence (CE)
        features["compliance_evidence"] = {
            "state": "enabled" if "compliance_evidence" in self.enabled_features else "disabled",
            "description": "Compliance framework and evidence collection",
            "performance_impact": "medium",
            "min_nasa_compliance": 0.93
        }
        
        # Quality Validation (QV)
        features["quality_validation"] = {
            "state": "enabled" if "quality_validation" in self.enabled_features else "disabled",
            "description": "Advanced quality validation and NASA POT10 enhancement",
            "performance_impact": "low",
            "min_nasa_compliance": NASA_POT10_TARGET_COMPLIANCE_THRESHOLD
        }
        
        # Workflow Optimization (WO)
        features["workflow_optimization"] = {
            "state": "enabled" if "workflow_optimization" in self.enabled_features else "disabled",
            "description": "Workflow optimization and performance monitoring",
            "performance_impact": "medium",
            "min_nasa_compliance": NASA_POT10_MINIMUM_COMPLIANCE_THRESHOLD
        }
        
        return {"features": features}
    
    def get_config_value(self, key, default=None):
        """Return configuration value."""
        config = {
            "analysis_timeout": 300,
            "max_memory_mb": 200,
            "cache_enabled": True,
            "parallel_analysis": True,
            "nasa_compliance_threshold": 0.92
        }
        return config.get(key, default)

class EnterprisePerformanceTracker:
    """Track performance metrics for enterprise domain testing."""
    
    def __init__(self):
        self.metrics = {}
        self.baseline_time = None
        
    def measure_operation(self, operation_name, func, *args, **kwargs):
        """Measure performance of an operation."""
        start_time = time.perf_counter()
        start_memory = self._get_memory_usage()
        
        try:
            result = func(*args, **kwargs)
            success = True
            error = None
        except Exception as e:
            result = None
            success = False
            error = str(e)
        
        end_time = time.perf_counter()
        end_memory = self._get_memory_usage()
        
        self.metrics[operation_name] = {
            "duration_ms": (end_time - start_time) * 1000,
            "memory_delta_mb": (end_memory - start_memory) / (1024 * 1024),
            "success": success,
            "error": error,
            "timestamp": time.time()
        }
        
        return result if success else None
    
    def set_baseline(self, operation_name):
        """Set baseline time for performance comparison."""
        if operation_name in self.metrics:
            self.baseline_time = self.metrics[operation_name]["duration_ms"]
    
    def get_performance_impact(self, operation_name):
        """Get performance impact compared to baseline."""
        if not self.baseline_time or operation_name not in self.metrics:
            return 0.0
        
        current_time = self.metrics[operation_name]["duration_ms"]
        return ((current_time - self.baseline_time) / self.baseline_time) * 100
    
    def _get_memory_usage(self):
        """Get current memory usage."""
        try:
            import psutil
            return psutil.Process().memory_info().rss
        except ImportError:
            return 0

class BaseDomainTest(unittest.TestCase):
    """Base class for enterprise domain tests."""
    
    def setUp(self):
        """Set up test environment."""
        self.temp_dir = Path(tempfile.mkdtemp())
        self.performance_tracker = EnterprisePerformanceTracker()
        
        # Create test project
        self.test_project = self.temp_dir / "test_project"
        self.test_project.mkdir(parents=True)
        
        # Create sample files for testing
        self._create_test_files()
        
    def tearDown(self):
        """Clean up test environment."""
        import shutil
        if self.temp_dir.exists():
            shutil.rmtree(self.temp_dir)
    
    def _create_test_files(self):
        """Create test files for analysis."""
        # Main module
        (self.test_project / "main.py").write_text("""
def main():
    '''Main function with some violations.'''
    magic_value = 42  # Magic literal
    result = process_data(magic_value)
    return result * 2

def process_data(value):
    '''Process data with potential issues.'''
    if value == 42:  # Magic number comparison
        return value + 10
    return value

class DataProcessor:
    def __init__(self):
        self.multiplier = 42  # Another magic number
        
    def calculate(self):
        return self.multiplier * 2  # Connascence of Meaning
""")
        
        # Test file
        (self.test_project / "test_main.py").write_text("""
import unittest
from main import DataProcessor
"""

class TestDataProcessor(unittest.TestCase):
    def test_calculate(self):
        processor = DataProcessor()
        result = processor.calculate()
        self.assertEqual(result, 84)
""")
        
        # Configuration file
        (self.test_project / "config.py").write_text("""
DATABASE_URL = "localhost:5432"  # Hardcoded connection
API_KEY = "abc123"  # Hardcoded API key
DEBUG = True
""")

class SixSigmaDomainTest(BaseDomainTest):
    """Test Six Sigma (SR) domain integration."""
    
    def test_sixsigma_domain_initialization(self):
        """Test SR domain initializes correctly."""
        config_manager = TestConfigManager(enabled_features=["sixsigma"])
        
        feature_manager = self.performance_tracker.measure_operation(
            "sixsigma_init",
            initialize_enterprise_features,
            config_manager
        )
        
        self.assertIsNotNone(feature_manager)
        self.assertTrue(feature_manager.is_enabled("sixsigma"))
        self.assertFalse(feature_manager.is_enabled("supply_chain_governance"))
        
        # Verify performance impact
        init_time = self.performance_tracker.metrics["sixsigma_init"]["duration_ms"]
        self.assertLess(init_time, 1000, "Six Sigma initialization should be fast")
        
    def test_sixsigma_analysis_integration(self):
        """Test SR domain analysis integration."""
        config_manager = TestConfigManager(enabled_features=["sixsigma"])
        feature_manager = initialize_enterprise_features(config_manager)
        
        # Test analysis with Six Sigma enabled
        analyzer = ConnascenceAnalyzer()
        
        result = self.performance_tracker.measure_operation(
            "sixsigma_analysis",
            analyzer.analyze_path,
            str(self.test_project)
        )
        
        self.assertIsNotNone(result)
        self.assertTrue(result.get("success", False))
        
        # Verify low performance impact
        analysis_time = self.performance_tracker.metrics["sixsigma_analysis"]["duration_ms"]
        self.assertLess(analysis_time, 5000, "Six Sigma analysis should have low impact")
        
    def test_sixsigma_quality_gates(self):
        """Test SR domain quality gate integration."""
        config_manager = TestConfigManager(enabled_features=["sixsigma"])
        feature_manager = initialize_enterprise_features(config_manager)
        
        # Verify NASA compliance requirements
        compliance_validation = feature_manager.validate_nasa_compliance(0.93)
        self.assertTrue(compliance_validation["overall_valid"])
        
        # Test with low compliance
        low_compliance_validation = feature_manager.validate_nasa_compliance(0.85)
        # Should pass since Six Sigma requires 0.92
        self.assertTrue(low_compliance_validation["overall_valid"])

class SupplyChainDomainTest(BaseDomainTest):
    """Test Supply Chain (SC) domain integration."""
    
    def test_supply_chain_domain_initialization(self):
        """Test SC domain initializes correctly."""
        config_manager = TestConfigManager(enabled_features=["supply_chain_governance"])
        
        feature_manager = self.performance_tracker.measure_operation(
            "supply_chain_init",
            initialize_enterprise_features,
            config_manager
        )
        
        self.assertIsNotNone(feature_manager)
        self.assertTrue(feature_manager.is_enabled("supply_chain_governance"))
        self.assertFalse(feature_manager.is_enabled("sixsigma"))
        
    def test_supply_chain_analysis_integration(self):
        """Test SC domain analysis integration."""
        config_manager = TestConfigManager(enabled_features=["supply_chain_governance"])
        feature_manager = initialize_enterprise_features(config_manager)
        
        analyzer = ConnascenceAnalyzer()
        
        result = self.performance_tracker.measure_operation(
            "supply_chain_analysis",
            analyzer.analyze_path,
            str(self.test_project)
        )
        
        self.assertIsNotNone(result)
        self.assertTrue(result.get("success", False))
        
        # Verify medium performance impact is acceptable
        analysis_time = self.performance_tracker.metrics["supply_chain_analysis"]["duration_ms"]
        self.assertLess(analysis_time, 8000, "Supply Chain analysis should have medium impact")
        
    def test_supply_chain_performance_impact(self):
        """Test SC domain performance impact validation."""
        config_manager = TestConfigManager(enabled_features=["supply_chain_governance"])
        feature_manager = initialize_enterprise_features(config_manager)
        
        impact_summary = feature_manager.get_performance_impact_summary()
        
        self.assertEqual(impact_summary["total_features"], 1)
        self.assertEqual(impact_summary["performance_impact"], "medium")

class ComplianceDomainTest(BaseDomainTest):
    """Test Compliance and Evidence (CE) domain integration."""
    
    def test_compliance_domain_initialization(self):
        """Test CE domain initializes correctly."""
        config_manager = TestConfigManager(enabled_features=["compliance_evidence"])
        
        feature_manager = self.performance_tracker.measure_operation(
            "compliance_init",
            initialize_enterprise_features,
            config_manager
        )
        
        self.assertIsNotNone(feature_manager)
        self.assertTrue(feature_manager.is_enabled("compliance_evidence"))
        
    def test_compliance_nasa_requirements(self):
        """Test CE domain NASA compliance requirements."""
        config_manager = TestConfigManager(enabled_features=["compliance_evidence"])
        feature_manager = initialize_enterprise_features(config_manager)
        
        # Compliance Evidence requires 0.93 NASA compliance
        validation = feature_manager.validate_nasa_compliance(0.92)
        # Should fail since requirement is 0.93
        self.assertFalse(validation["overall_valid"])
        
        # Should pass with adequate compliance
        adequate_validation = feature_manager.validate_nasa_compliance(0.94)
        self.assertTrue(adequate_validation["overall_valid"])

class QualityValidationDomainTest(BaseDomainTest):
    """Test Quality Validation (QV) domain integration."""
    
    def test_quality_validation_domain_initialization(self):
        """Test QV domain initializes correctly."""
        config_manager = TestConfigManager(enabled_features=["quality_validation"])
        
        feature_manager = self.performance_tracker.measure_operation(
            "quality_validation_init",
            initialize_enterprise_features,
            config_manager
        )
        
        self.assertIsNotNone(feature_manager)
        self.assertTrue(feature_manager.is_enabled("quality_validation"))
        
    def test_quality_validation_high_standards(self):
        """Test QV domain enforces high quality standards."""
        config_manager = TestConfigManager(enabled_features=["quality_validation"])
        feature_manager = initialize_enterprise_features(config_manager)
        
        # Quality Validation requires 0.95 NASA compliance (highest standard)
        validation = feature_manager.validate_nasa_compliance(0.94)
        self.assertFalse(validation["overall_valid"])
        
        # Should pass with high compliance
        high_validation = feature_manager.validate_nasa_compliance(0.96)
        self.assertTrue(high_validation["overall_valid"])

class WorkflowOptimizationDomainTest(BaseDomainTest):
    """Test Workflow Optimization (WO) domain integration."""
    
    def test_workflow_optimization_domain_initialization(self):
        """Test WO domain initializes correctly."""
        config_manager = TestConfigManager(enabled_features=["workflow_optimization"])
        
        feature_manager = self.performance_tracker.measure_operation(
            "workflow_optimization_init",
            initialize_enterprise_features,
            config_manager
        )
        
        self.assertIsNotNone(feature_manager)
        self.assertTrue(feature_manager.is_enabled("workflow_optimization"))
        
    def test_workflow_optimization_performance_impact(self):
        """Test WO domain performance characteristics."""
        config_manager = TestConfigManager(enabled_features=["workflow_optimization"])
        feature_manager = initialize_enterprise_features(config_manager)
        
        impact_summary = feature_manager.get_performance_impact_summary()
        
        self.assertEqual(impact_summary["total_features"], 1)
        self.assertEqual(impact_summary["performance_impact"], "medium")

class MultiDomainIntegrationTest(BaseDomainTest):
    """Test multiple enterprise domains working together."""
    
    def test_two_domain_integration(self):
        """Test two domains enabled simultaneously."""
        config_manager = TestConfigManager(enabled_features=["sixsigma", "supply_chain_governance"])
        
        feature_manager = self.performance_tracker.measure_operation(
            "two_domain_init",
            initialize_enterprise_features,
            config_manager
        )
        
        self.assertIsNotNone(feature_manager)
        self.assertTrue(feature_manager.is_enabled("sixsigma"))
        self.assertTrue(feature_manager.is_enabled("supply_chain_governance"))
        
        # Performance impact should be medium (max of low + medium)
        impact_summary = feature_manager.get_performance_impact_summary()
        self.assertEqual(impact_summary["total_features"], 2)
        self.assertEqual(impact_summary["performance_impact"], "medium")
        
    def test_three_domain_integration(self):
        """Test three domains enabled simultaneously."""
        enabled_features = ["sixsigma", "supply_chain_governance", "quality_validation"]
        config_manager = TestConfigManager(enabled_features=enabled_features)
        
        feature_manager = self.performance_tracker.measure_operation(
            "three_domain_init",
            initialize_enterprise_features,
            config_manager
        )
        
        self.assertIsNotNone(feature_manager)
        
        enabled_modules = feature_manager.get_enabled_modules()
        self.assertEqual(len(enabled_modules), 3)
        
        for feature in enabled_features:
            self.assertTrue(feature_manager.is_enabled(feature))
            
    def test_all_domains_integration(self):
        """Test all five domains enabled simultaneously."""
        all_features = [
            "sixsigma", 
            "supply_chain_governance", 
            "compliance_evidence",
            "quality_validation", 
            "workflow_optimization"
        ]
        config_manager = TestConfigManager(enabled_features=all_features)
        
        feature_manager = self.performance_tracker.measure_operation(
            "all_domains_init",
            initialize_enterprise_features,
            config_manager
        )
        
        self.assertIsNotNone(feature_manager)
        
        enabled_modules = feature_manager.get_enabled_modules()
        self.assertEqual(len(enabled_modules), 5)
        
        # Performance impact should be medium (multiple medium + low features)
        impact_summary = feature_manager.get_performance_impact_summary()
        self.assertEqual(impact_summary["total_features"], 5)
        self.assertIn(impact_summary["performance_impact"], ["medium", "high"])
        
    def test_nasa_compliance_with_multiple_domains(self):
        """Test NASA compliance validation with multiple domains."""
        # Enable domains with different compliance requirements
        enabled_features = ["sixsigma", "compliance_evidence", "quality_validation"]
        config_manager = TestConfigManager(enabled_features=enabled_features)
        feature_manager = initialize_enterprise_features(config_manager)
        
        # Should require 0.95 compliance (highest requirement from quality_validation)
        validation = feature_manager.validate_nasa_compliance(0.94)
        self.assertFalse(validation["overall_valid"])
        
        # Should find violations for quality_validation
        violations = validation["feature_violations"]
        quality_violation = next((v for v in violations if v["feature"] == "quality_validation"), None)
        self.assertIsNotNone(quality_violation)
        self.assertEqual(quality_violation["required_compliance"], 0.95)

class DomainPerformanceTest(BaseDomainTest):
    """Test performance characteristics of enterprise domains."""
    
    def test_domain_initialization_performance(self):
        """Test initialization performance for each domain."""
        domains = [
            "sixsigma",
            "supply_chain_governance", 
            "compliance_evidence",
            "quality_validation",
            "workflow_optimization"
        ]
        
        for domain in domains:
            with self.subTest(domain=domain):
                config_manager = TestConfigManager(enabled_features=[domain])
                
                start_time = time.perf_counter()
                feature_manager = initialize_enterprise_features(config_manager)
                end_time = time.perf_counter()
                
                init_time_ms = (end_time - start_time) * 1000
                
                self.assertIsNotNone(feature_manager)
                self.assertTrue(feature_manager.is_enabled(domain))
                
                # Each domain should initialize quickly
                self.assertLess(init_time_ms, 500, f"{domain} initialization too slow: {init_time_ms:.1f}ms")
                
    def test_cumulative_performance_impact(self):
        """Test cumulative performance impact as domains are added."""
        domains = ["sixsigma", "supply_chain_governance", "compliance_evidence"]
        
        for i in range(1, len(domains) + 1):
            enabled_features = domains[:i]
            
            with self.subTest(domain_count=i, domains=enabled_features):
                config_manager = TestConfigManager(enabled_features=enabled_features)
                
                start_time = time.perf_counter()
                feature_manager = initialize_enterprise_features(config_manager)
                end_time = time.perf_counter()
                
                init_time_ms = (end_time - start_time) * 1000
                
                # Performance should scale reasonably
                expected_max_time = 200 * i  # 200ms per domain
                self.assertLess(init_time_ms, expected_max_time, 
                                f"Performance degrades too much with {i} domains")

if __name__ == "__main__":
    # Create test suite
    test_classes = [
        SixSigmaDomainTest,
        SupplyChainDomainTest,
        ComplianceDomainTest,
        QualityValidationDomainTest,
        WorkflowOptimizationDomainTest,
        MultiDomainIntegrationTest,
        DomainPerformanceTest
    ]
    
    # Run all tests
    for test_class in test_classes:
        print(f"\n{'='*60}")
        print('='*60)
        
        suite = unittest.TestLoader().loadTestsFromTestCase(test_class)
        runner = unittest.TextTestRunner(verbosity=2)
        result = runner.run(suite)
        
        if not result.wasSuccessful():
            for failure in result.failures:
                print(f"  FAILURE: {failure[0]}")
            for error in result.errors:
                print(f"  ERROR: {error[0]}")
    
    print(f"\n{'='*60}")
    print('='*60)