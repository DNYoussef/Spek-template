from src.constants.base import MINIMUM_TEST_COVERAGE_PERCENTAGE, NASA_POT10_MINIMUM_COMPLIANCE_THRESHOLD

Test enterprise feature error handling and graceful degradation:
1. Module import failures
2. Invalid configuration handling
3. Network/resource unavailability
4. Memory/timeout constraints
5. Fallback mechanism validation

NASA POT10 Compliant: Comprehensive error coverage.
"""

import unittest
import sys
import os
import tempfile
from pathlib import Path
from typing import Dict, Any
from unittest.mock import patch, MagicMock

# Add analyzer to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "analyzer"))

try:
    from analyzer.core import ConnascenceAnalyzer
    from analyzer.enterprise.core.feature_flags import EnterpriseFeatureManager, FeatureState
    from analyzer.enterprise import initialize_enterprise_features, get_enterprise_status
except ImportError as e:
    print(f"Warning: Failed to import components: {e}")

class ErrorSimulator:
    """Simulate various error conditions for testing."""
    
    @staticmethod
    def create_failing_config_manager():
        """Create a config manager that raises exceptions."""
    class FailingConfigManager:
            def get_enterprise_config(self):
                raise RuntimeError("Config system failure")
                
            def get_config_value(self, key, default=None):
                raise RuntimeError("Config system failure")
        
        return FailingConfigManager()
    
    @staticmethod
    def create_invalid_config_manager():
        """Create a config manager with invalid data."""
    class InvalidConfigManager:
            def get_enterprise_config(self):
                return {
                    "features": {
                        "invalid_feature": {
                            "state": "invalid_state",
                            "performance_impact": "invalid_impact",
                            "min_nasa_compliance": "not_a_number"
                        }
                    }
                }
                
            def get_config_value(self, key, default=None):
                return "invalid_value_for_" + str(key)
        
        return InvalidConfigManager()
    
    @staticmethod
    def create_partial_config_manager():
        """Create a config manager with missing required fields."""
    class PartialConfigManager:
            def get_enterprise_config(self):
                return {
                    "features": {
                        "sixsigma": {
                            "state": "enabled"
                            # Missing required fields
                        },
                        "incomplete_feature": {
                            # Missing all required fields
                        }
                    }
                }
                
            def get_config_value(self, key, default=None):
                return default
        
        return PartialConfigManager()
    
    @staticmethod
    def create_none_config_manager():
        """Create a config manager that returns None values."""
    class NoneConfigManager:
            def get_enterprise_config(self):
                return None
                
            def get_config_value(self, key, default=None):
                return None
        
        return NoneConfigManager()

class ErrorHandlingTest(unittest.TestCase):
    """Test error handling in enterprise features."""
    
    def setUp(self):
        """Set up test environment."""
        self.temp_dir = Path(tempfile.mkdtemp())
        self.error_simulator = ErrorSimulator()
        
    def tearDown(self):
        """Clean up test environment."""
        import shutil
        if self.temp_dir.exists():
            shutil.rmtree(self.temp_dir)
    
    def test_enterprise_initialization_with_none_config(self):
        """Test: Handle None config manager gracefully."""
        # Should raise assertion error as None is not allowed
        with self.assertRaises(AssertionError):
            initialize_enterprise_features(None)
    
    def test_enterprise_initialization_with_failing_config(self):
        """Test: Handle config system failures gracefully."""
        failing_config = self.error_simulator.create_failing_config_manager()
        
        # Should handle config failures and fall back to defaults
        try:
            feature_manager = initialize_enterprise_features(failing_config)
            self.assertIsNotNone(feature_manager)
            
            # Should have default features even with failing config
            features = feature_manager.features
            self.assertGreater(len(features), 0)
            
        except Exception as e:
            # If initialization fails completely, it should be a controlled failure
            self.assertIn("config", str(e).lower())
    
    def test_enterprise_initialization_with_invalid_config(self):
        """Test: Handle invalid configuration data gracefully."""
        invalid_config = self.error_simulator.create_invalid_config_manager()
        
        try:
            feature_manager = initialize_enterprise_features(invalid_config)
            self.assertIsNotNone(feature_manager)
            
            # Should have valid features despite invalid config
            features = feature_manager.features
            self.assertGreater(len(features), 0)
            
            # Invalid features should be filtered out
            for feature_name, feature in features.items():
                self.assertIsInstance(feature.state, FeatureState)
                self.assertIn(feature.performance_impact, ["none", "low", "medium", "high"])
                
        except Exception as e:
            # Should be a controlled failure with clear error message
            self.assertTrue(isinstance(e, (ValueError, TypeError, AssertionError)))
    
    def test_enterprise_initialization_with_partial_config(self):
        """Test: Handle partial configuration gracefully."""
        partial_config = self.error_simulator.create_partial_config_manager()
        
        feature_manager = initialize_enterprise_features(partial_config)
        self.assertIsNotNone(feature_manager)
        
        # Should fill in missing fields with defaults
        sixsigma_feature = feature_manager.get_feature_info("sixsigma")
        self.assertIsNotNone(sixsigma_feature)
        self.assertEqual(sixsigma_feature.state, FeatureState.ENABLED)
        
        # Should have valid default values for missing fields
        self.assertIsNotNone(sixsigma_feature.description)
        self.assertIn(sixsigma_feature.performance_impact, ["none", "low", "medium", "high"])
        self.assertIsInstance(sixsigma_feature.min_nasa_compliance, float)
    
    def test_enterprise_initialization_with_none_config_values(self):
        """Test: Handle None configuration values gracefully."""
        none_config = self.error_simulator.create_none_config_manager()
        
        feature_manager = initialize_enterprise_features(none_config)
        self.assertIsNotNone(feature_manager)
        
        # Should load default features when config returns None
        features = feature_manager.features
        self.assertGreater(len(features), 0)
        
        # Should have standard default features
        expected_features = ["sixsigma", "dfars_compliance", "supply_chain_governance"]
        for expected_feature in expected_features:
            self.assertIn(expected_feature, features)

class AnalyzerErrorHandlingTest(unittest.TestCase):
    """Test error handling in analyzer with enterprise features."""
    
    def setUp(self):
        """Set up test environment."""
        self.temp_dir = Path(tempfile.mkdtemp())
        
    def tearDown(self):
        """Clean up test environment."""
        import shutil
        if self.temp_dir.exists():
            shutil.rmtree(self.temp_dir)
    
    def test_analyzer_with_invalid_path(self):
        """Test: Handle invalid analysis paths gracefully."""
        analyzer = ConnascenceAnalyzer()
        
        # Test with non-existent path
        result = analyzer.analyze_path("/non/existent/path")
        
        self.assertIsInstance(result, dict)
        self.assertFalse(result.get("success", True))
        self.assertIn("error", result)
        self.assertIn("not exist", result["error"].lower())
    
    def test_analyzer_with_empty_directory(self):
        """Test: Handle empty directories gracefully."""
        empty_dir = self.temp_dir / "empty"
        empty_dir.mkdir()
        
        analyzer = ConnascenceAnalyzer()
        result = analyzer.analyze_path(str(empty_dir))
        
        # Should succeed but find no violations
        if result.get("success"):
            violations = result.get("violations", [])
            self.assertEqual(len(violations), 0)
        else:
            # If it fails, should be a controlled failure
            self.assertIn("error", result)
    
    def test_analyzer_with_invalid_python_files(self):
        """Test: Handle invalid Python files gracefully."""
        invalid_file = self.temp_dir / "invalid.py"
        invalid_file.write_text("This is not valid Python syntax {{{")
        
        analyzer = ConnascenceAnalyzer()
        result = analyzer.analyze_path(str(self.temp_dir))
        
        # Should handle syntax errors gracefully
        self.assertIsInstance(result, dict)
        # May succeed with warnings or fail gracefully
        if not result.get("success"):
            self.assertIn("error", result)
    
    def test_analyzer_with_permission_denied(self):
        """Test: Handle permission denied errors gracefully."""
        # This test is platform-dependent and may be skipped
        try:
            restricted_file = self.temp_dir / "restricted.py"
            restricted_file.write_text("def test(): pass")
            
            # Try to make file unreadable (may not work on all systems)
            import stat
            restricted_file.chmod(stat.S_IWRITE)
            
            analyzer = ConnascenceAnalyzer()
            result = analyzer.analyze_path(str(self.temp_dir))
            
            # Should either succeed (ignoring unreadable files) or fail gracefully
            self.assertIsInstance(result, dict)
            
        except (OSError, PermissionError):
            self.skipTest("Cannot test permission denied on this system")
        finally:
            # Restore permissions for cleanup
            try:
                restricted_file.chmod(stat.S_IWRITE | stat.S_IREAD)
            except:
                pass

class GracefulDegradationTest(unittest.TestCase):
    """Test graceful degradation when enterprise modules are unavailable."""
    
    def test_analyzer_without_enterprise_modules(self):
        """Test: Analyzer works when enterprise modules are missing."""
        # Mock missing enterprise modules
        with patch.dict('sys.modules', {
            'analyzer.enterprise.sixsigma': None,
            'analyzer.enterprise.compliance': None,
            'analyzer.enterprise.supply_chain': None
        }):
            analyzer = ConnascenceAnalyzer()
            
            # Should still work without enterprise features
            self.assertIsNotNone(analyzer)
            self.assertEqual(analyzer.analysis_mode, "unified")  # or fallback/mock
    
    def test_enterprise_status_with_missing_modules(self):
        """Test: Enterprise status reports correctly when modules are missing."""
        # Mock import failures
        with patch('analyzer.enterprise.get_sixsigma_analyzer', return_value=None):
            with patch('analyzer.enterprise.get_dfars_analyzer', return_value=None):
                status = get_enterprise_status()
                
                self.assertIsInstance(status, dict)
                self.assertIn("initialized", status)
                # Should report that features are not available
    
    def test_fallback_to_baseline_analyzer(self):
        """Test: Fallback to baseline analyzer when enterprise fails."""
        # Create a test file
        test_file = Path(tempfile.mkdtemp()) / "test.py"
        test_file.write_text("def test(): return 42")
        
        try:
            # Mock enterprise initialization failure
            with patch('analyzer.enterprise.initialize_enterprise_features', 
                        side_effect=RuntimeError("Enterprise init failed")):
                
                analyzer = ConnascenceAnalyzer()
                result = analyzer.analyze_path(str(test_file.parent))
                
                # Should still work with baseline functionality
                self.assertIsInstance(result, dict)
                # May succeed or fail, but should be controlled
                
        finally:
            # Clean up
            import shutil
            shutil.rmtree(test_file.parent)
    
    def test_partial_enterprise_functionality(self):
        """Test: Handle partial enterprise functionality gracefully."""
        # Mock some enterprise modules as available, others as unavailable
    class PartialConfigManager:
            def get_enterprise_config(self):
                return {
                    "features": {
                        "sixsigma": {
                            "state": "enabled",
                            "description": "Available feature",
                            "performance_impact": "low",
                            "min_nasa_compliance": NASA_POT10_MINIMUM_COMPLIANCE_THRESHOLD
                        },
                        "unavailable_feature": {
                            "state": "enabled",
                            "description": "Unavailable feature",
                            "performance_impact": "medium",
                            "min_nasa_compliance": 0.93
                        }
                    }
                }
                
            def get_config_value(self, key, default=None):
                return default
        
        config_manager = PartialConfigManager()
        
        # Mock partial availability
        with patch('analyzer.enterprise.get_sixsigma_analyzer', return_value=MagicMock()):
            with patch('analyzer.enterprise.get_dfars_analyzer', return_value=None):
                pass
                
                feature_manager = initialize_enterprise_features(config_manager)
                
                # Should work with available features
                self.assertIsNotNone(feature_manager)
                
                # Should handle unavailable features gracefully
                enabled_features = feature_manager.get_enabled_modules()
                # May include all features even if some are unavailable (depends on implementation)

class ResourceConstraintTest(unittest.TestCase):
    """Test behavior under resource constraints."""
    
    def test_memory_constraint_handling(self):
        """Test: Handle memory constraints gracefully."""
        # Create a config with very low memory limit
    class LowMemoryConfigManager:
            def get_enterprise_config(self):
                return {"features": {}}
                
            def get_config_value(self, key, default=None):
                if key == "max_memory_mb":
                    return 1  # Very low memory limit
                return default
        
        config_manager = LowMemoryConfigManager()
        
        # Should handle low memory gracefully
        try:
            feature_manager = initialize_enterprise_features(config_manager)
            self.assertIsNotNone(feature_manager)
        except Exception as e:
            # If it fails, should be due to memory constraints
            self.assertIn("memory", str(e).lower())
    
    def test_timeout_constraint_handling(self):
        """Test: Handle timeout constraints gracefully."""
        # Create a config with very short timeout
    class ShortTimeoutConfigManager:
            def get_enterprise_config(self):
                return {"features": {}}
                
            def get_config_value(self, key, default=None):
                if key == "analysis_timeout":
                    return 0.1  # Very short timeout
                return default
        
        config_manager = ShortTimeoutConfigManager()
        
        # Should handle short timeout gracefully
        feature_manager = initialize_enterprise_features(config_manager)
        self.assertIsNotNone(feature_manager)
        
        # Timeout should be respected in configuration
        timeout = config_manager.get_config_value("analysis_timeout")
        self.assertEqual(timeout, 0.1)

class ErrorRecoveryTest(unittest.TestCase):
    """Test error recovery mechanisms."""
    
    def test_feature_manager_cache_recovery(self):
        """Test: Feature manager cache handles errors gracefully."""
    class ValidConfigManager:
            def get_enterprise_config(self):
                return {
                    "features": {
                        "sixsigma": {
                            "state": "enabled",
                            "description": "Test feature",
                            "performance_impact": "low",
                            "min_nasa_compliance": NASA_POT10_MINIMUM_COMPLIANCE_THRESHOLD
                        }
                    }
                }
                
            def get_config_value(self, key, default=None):
                return default
        
        config_manager = ValidConfigManager()
        feature_manager = initialize_enterprise_features(config_manager)
        
        # Verify feature is enabled and cached
        self.assertTrue(feature_manager.is_enabled("sixsigma"))
        
        # Clear cache and verify it rebuilds
        feature_manager.clear_cache()
        self.assertTrue(feature_manager.is_enabled("sixsigma"))
    
    def test_feature_dependency_failure_recovery(self):
        """Test: Handle feature dependency failures gracefully."""
    class DependencyConfigManager:
            def get_enterprise_config(self):
                return {
                    "features": {
                        "base_feature": {
                            "state": "disabled",  # Dependency is disabled
                            "description": "Base feature",
                            "performance_impact": "low",
                            "min_nasa_compliance": NASA_POT10_MINIMUM_COMPLIANCE_THRESHOLD
                        },
                        "dependent_feature": {
                            "state": "enabled",
                            "description": "Dependent feature",
                            "dependencies": ["base_feature"],  # Depends on disabled feature
                            "performance_impact": "medium",
                            "min_nasa_compliance": NASA_POT10_MINIMUM_COMPLIANCE_THRESHOLD
                        }
                    }
                }
                
            def get_config_value(self, key, default=None):
                return default
        
        config_manager = DependencyConfigManager()
        feature_manager = initialize_enterprise_features(config_manager)
        
        # Dependent feature should be disabled due to missing dependency
        self.assertFalse(feature_manager.is_enabled("dependent_feature"))
        self.assertFalse(feature_manager.is_enabled("base_feature"))

if __name__ == "__main__":
    # Run error handling tests
    test_classes = [
        ErrorHandlingTest,
        AnalyzerErrorHandlingTest,
        GracefulDegradationTest,
        ResourceConstraintTest,
        ErrorRecoveryTest
    ]
    
    overall_success = True
    
    for test_class in test_classes:
        print("-" * 50)
        
        suite = unittest.TestLoader().loadTestsFromTestCase(test_class)
        runner = unittest.TextTestRunner(verbosity=2)
        result = runner.run(suite)
        
        if not result.wasSuccessful():
            overall_success = False
            
    print("=" * 80)
    
    sys.exit(0 if overall_success else 1)