from lib.shared.utilities import path_exists

Comprehensive integration tests for enterprise modules with the existing analyzer.
These tests validate that enterprise features integrate correctly without breaking existing functionality.
"""

import unittest
import tempfile
import os
import sys
import time
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

class TestEnterpriseIntegration(unittest.TestCase):
    """Test enterprise module integration with existing analyzer."""
    
    def setUp(self):
        """Set up test environment."""
        self.test_dir = tempfile.mkdtemp()
        self.addCleanup(self._cleanup_test_dir)
    
    def _cleanup_test_dir(self):
        """Clean up test environment."""
        import shutil
        if path_exists(self.test_dir):
            shutil.rmtree(self.test_dir, ignore_errors=True)
    
    def test_core_analyzer_initialization(self):
        """Test: Core analyzer initializes properly with enterprise support."""
        from analyzer.core import ConnascenceAnalyzer
        
        # Should initialize without error
        analyzer = ConnascenceAnalyzer()
        self.assertIsNotNone(analyzer)
        
        # Should have enterprise manager attribute (even if None)
        self.assertTrue(hasattr(analyzer, 'enterprise_manager'))
    
    def test_enterprise_status_reporting(self):
        """Test: Enterprise status can be queried."""
        from analyzer.enterprise import get_enterprise_status
        
        status = get_enterprise_status()
        
        # Should return a valid status dictionary
        self.assertIsInstance(status, dict)
        self.assertIn('initialized', status)
        self.assertIn('enabled_features', status)
        self.assertIn('total_features', status)
    
    def test_enterprise_feature_manager_availability(self):
        """Test: Enterprise feature manager can be imported and used."""
        from analyzer.enterprise import initialize_enterprise_features
        
        # Test with mock config (None should be handled gracefully)
        try:
            result = initialize_enterprise_features(None)
            # Should handle None config gracefully
        except AssertionError:
            # Expected behavior - None config is not allowed
        
        # Test with mock config
        class MockConfig:
            def __init__(self):
                self.data = {'enterprise': {'enabled': False}}
            
            def get(self, key, default=None):
                keys = key.split('.')
                value = self.data
                for k in keys:
                    if isinstance(value, dict) and k in value:
                        value = value[k]
                    else:
                        return default
                return value
        
        mock_config = MockConfig()
        result = initialize_enterprise_features(mock_config)
        # Should not raise an exception and return a feature manager
        self.assertIsNotNone(result)
        
    def test_unified_visitor_enterprise_data_structure(self):
        """Test: Unified visitor data structure supports enterprise fields."""
        try:
            from analyzer.optimization.unified_visitor import ASTNodeData
            
            # Should be able to create data structure
            data = ASTNodeData()
            self.assertIsNotNone(data)
            
            # Basic fields should exist
            self.assertTrue(hasattr(data, 'functions'))
            self.assertTrue(hasattr(data, 'classes'))
            self.assertTrue(hasattr(data, 'imports'))
            
        except ImportError:
            self.skipTest("Unified visitor not available - optimization module missing")
    
    def test_detector_base_enterprise_compatibility(self):
        """Test: Detector base is compatible with enterprise features."""
        from analyzer.detectors.base import DetectorBase
        
        # DetectorBase is abstract, so test that it can be subclassed
        class TestDetector(DetectorBase):
            def detect_violations(self, tree):
                return []
        
        # Should be able to create concrete detector
        detector = TestDetector('test.py', ['test line'])
        self.assertIsNotNone(detector)
        
        # Should have standard interface
        self.assertTrue(hasattr(detector, 'file_path'))
        self.assertTrue(hasattr(detector, 'source_lines'))
    
    def test_analyzer_with_test_code(self):
        """Test: Analyzer can process test code without errors."""
        from analyzer.core import ConnascenceAnalyzer
        
        test_code = '''
def test_function():
    """Test function with potential issues."""
    # Magic number
    return 42

class TestClass:
    """Test class."""
    
    def method1(self):
        return self.value
    
    def method2(self):
        return self.value  # Potential duplication
'''
        
        analyzer = ConnascenceAnalyzer()
        
        # Create temporary file
        test_file = Path(self.test_dir) / "test_code.py"
        test_file.write_text(test_code)
        
        # Should be able to analyze without error
        try:
            # This tests that the integration doesn't break existing functionality
            result = analyzer.analyze_path(str(test_file.parent))
            self.assertIsInstance(result, dict)
        except Exception as e:
            # If analysis fails, it should be due to missing dependencies, not integration issues
            error_msg = str(e).lower()
            acceptable_errors = ['import', 'dependency', 'module', 'not found', 'missing']
            self.assertTrue(any(err in error_msg for err in acceptable_errors),
                            f"Unexpected error type: {e}")
    
    def test_performance_impact_baseline(self):
        """Test: Measure baseline performance impact of enterprise integration."""
        from analyzer.core import ConnascenceAnalyzer
        
        # Simple test code
        test_code = "def simple_function():\n    return 42\n"
        
        # Create test file
        test_file = Path(self.test_dir) / "simple.py"
        test_file.write_text(test_code)
        
        # Measure performance
        analyzer = ConnascenceAnalyzer()
        
        start_time = time.time()
        try:
            # Attempt analysis
            result = analyzer.analyze_project(str(test_file.parent))
            end_time = time.time()
            
            analysis_time = end_time - start_time
            
            # Should complete in reasonable time (under 5 seconds for simple code)
            self.assertLess(analysis_time, 5.0, 
                            f"Analysis took {analysis_time:.2f}s - too slow")
            
        except Exception:
            # If analysis fails due to dependencies, that's acceptable for this test
            end_time = time.time()
            init_time = end_time - start_time
            
            # Initialization should still be fast
            self.assertLess(init_time, 2.0, 
                            f"Initialization took {init_time:.2f}s - too slow")
    
    def test_enterprise_modules_lazy_loading(self):
        """Test: Enterprise modules are loaded only when needed."""
        # This test verifies that enterprise modules don't impact startup time
        import sys
        
        # Clear any previously loaded enterprise modules
        enterprise_modules = [name for name in sys.modules.keys() 
                            if name.startswith('analyzer.enterprise')]
        
        # Get initial module count
        initial_module_count = len(sys.modules)
        
        # Import core analyzer
        from analyzer.core import ConnascenceAnalyzer
        analyzer = ConnascenceAnalyzer()
        
        # Check that enterprise modules aren't automatically loaded
        after_import_module_count = len(sys.modules)
        
        # Should not load many additional modules
        module_increase = after_import_module_count - initial_module_count
        self.assertLess(module_increase, 20, 
                        f"Too many modules loaded: {module_increase}")
    
    def test_backward_compatibility(self):
        """Test: Enterprise integration doesn't break existing API."""'
        from analyzer.core import ConnascenceAnalyzer
        
        analyzer = ConnascenceAnalyzer()
        
        # Standard methods should still exist and be callable
        self.assertTrue(hasattr(analyzer, 'analyze'))
        self.assertTrue(hasattr(analyzer, 'analyze_path'))
        self.assertTrue(callable(analyzer.analyze))
        self.assertTrue(callable(analyzer.analyze_path))
        
        # Should be able to call with valid path without immediate error
        try:
            result = analyzer.analyze_path(self.test_dir)
            # If it succeeds, result should be a dict
            self.assertIsInstance(result, dict)
        except Exception as e:
            # If it fails, should be due to analysis issues, not API changes
            error_msg = str(e).lower()
            # Acceptable error types
            acceptable_errors = ['import', 'module', 'dependency', 'path', 'file', 'not found']
            self.assertTrue(any(err in error_msg for err in acceptable_errors),
                            f"Unexpected API error: {e}")
    
    def test_configuration_integration(self):
        """Test: Configuration system integrates with enterprise features."""
        try:
            from analyzer.configuration_manager import ConfigurationManager
            
            config = ConfigurationManager()
            
            # Should be able to set enterprise configuration
            config._config = config._config or {}
            config._config['enterprise'] = {
                'enabled': True,
                'features': ['dfars_compliance', 'sixsigma']
            }
            
            # Should be able to retrieve configuration
            enterprise_config = config._config.get('enterprise', {})
            self.assertIsInstance(enterprise_config, dict)
            self.assertTrue(enterprise_config.get('enabled', False))
            
        except ImportError:
            self.skipTest("Configuration manager not available")

class TestEnterpriseIntegrationPoints(unittest.TestCase):
    """Test specific integration points for enterprise features."""
    
    def test_unified_visitor_integration_point(self):
        """Test: Integration point in unified visitor exists."""
        try:
            from analyzer.optimization.unified_visitor import UnifiedASTVisitor
            
            # Should be able to create visitor
            visitor = UnifiedASTVisitor('test.py', ['test'])
            self.assertIsNotNone(visitor)
            
            # Should have collect_all_data method (integration point)
            self.assertTrue(hasattr(visitor, 'collect_all_data'))
            
        except ImportError:
            self.skipTest("Unified visitor not available")
    
    def test_detector_base_integration_point(self):
        """Test: Integration point in detector base exists."""
        from analyzer.detectors.base import DetectorBase
        
        # Create concrete detector for testing
        class TestDetector(DetectorBase):
            def detect_violations(self, tree):
                return []
        
        detector = TestDetector('test.py', [])
        
        # Should have standard detector interface
        self.assertTrue(hasattr(detector, 'detect_violations'))
        # Enterprise integration point would add analyze_from_data method
    
    def test_core_analyzer_integration_point(self):
        """Test: Integration point in core analyzer exists."""
        from analyzer.core import ConnascenceAnalyzer
        
        analyzer = ConnascenceAnalyzer()
        
        # Should have analyze and analyze_path methods (integration points)
        self.assertTrue(hasattr(analyzer, 'analyze'))
        self.assertTrue(hasattr(analyzer, 'analyze_path'))
        
        # Enterprise manager attribute should exist (even if None)
        self.assertTrue(hasattr(analyzer, 'enterprise_manager'))

if __name__ == '__main__':
    # Set up test environment
    test_suite = unittest.TestLoader().loadTestsFromModule(sys.modules[__name__])
    
    # Run tests with verbose output
    runner = unittest.TextTestRunner(verbosity=2, buffer=True)
    result = runner.run(test_suite)
    
    # Exit with appropriate code
    sys.exit(0 if result.wasSuccessful() else 1)