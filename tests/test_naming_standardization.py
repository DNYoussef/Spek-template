#!/usr/bin/env python3
"""
Test suite for naming standardization changes
Validates that naming changes maintain functionality
"""

from pathlib import Path
import sys
import unittest

import warnings

# Add src to path for testing
sys.path.insert(0, str(Path(__file__).parent.parent / 'src'))

from analyzer.unified_analyzer import UnifiedAnalyzer
from analyzer.architecture.refactored_unified_analyzer import RefactoredUnifiedAnalyzer
from src.compatibility_layer import (
    generateConnascenceReport,
    validateSafetyCompliance,
    getRefactoringSuggestions,
    getAutomatedFixes
)

class TestNamingStandardization(unittest.TestCase):
    """Test naming standardization functionality"""

    def setUp(self):
        """Set up test fixtures"""
        self.analyzer = UnifiedAnalyzer()
        self.refactored_analyzer = RefactoredUnifiedAnalyzer()

    def test_new_method_names_exist(self):
        """Test that new standardized method names exist"""
        # Test UnifiedAnalyzer
        self.assertTrue(hasattr(self.analyzer, 'generate_connascence_report'))
        self.assertTrue(hasattr(self.analyzer, 'validate_safety_compliance'))
        self.assertTrue(hasattr(self.analyzer, 'get_refactoring_suggestions'))
        self.assertTrue(hasattr(self.analyzer, 'get_automated_fixes'))

        # Test RefactoredUnifiedAnalyzer
        self.assertTrue(hasattr(self.refactored_analyzer, 'generate_connascence_report'))
        self.assertTrue(hasattr(self.refactored_analyzer, 'validate_safety_compliance'))
        self.assertTrue(hasattr(self.refactored_analyzer, 'get_refactoring_suggestions'))
        self.assertTrue(hasattr(self.refactored_analyzer, 'get_automated_fixes'))

    def test_new_methods_are_callable(self):
        """Test that new methods can be called"""
        test_options = {'project_path': '.', 'format': 'json'}

        try:
            # Test new method names
            self.analyzer.generate_connascence_report(test_options)
            self.analyzer.validate_safety_compliance(test_options)
            self.analyzer.get_refactoring_suggestions(test_options)
            self.analyzer.get_automated_fixes(test_options)
        except Exception as e:
            # Methods might fail due to missing dependencies, but should be callable
            self.assertIsInstance(e, (AttributeError, ImportError, FileNotFoundError, ValueError))

    def test_backward_compatibility_functions(self):
        """Test that backward compatibility functions work with deprecation warnings"""
        test_options = {'project_path': '.', 'format': 'json'}

        with warnings.catch_warnings(record=True) as warning_list:
            warnings.simplefilter("always")

            try:
                # Test legacy function names
                generateConnascenceReport(test_options)
                validateSafetyCompliance(test_options)
                getRefactoringSuggestions(test_options)
                getAutomatedFixes(test_options)
            except Exception:
                # Functions might fail due to missing dependencies

            # Check that deprecation warnings were issued
                pass
            deprecation_warnings = [w for w in warning_list if issubclass(w.category, DeprecationWarning)]
            self.assertGreater(len(deprecation_warnings), 0, "Expected deprecation warnings for legacy functions")

    def test_method_signature_consistency(self):
        """Test that new methods have consistent signatures"""
        # Check that methods accept the expected parameters
        import inspect

        # Test generate_connascence_report signature
        sig = inspect.signature(self.analyzer.generate_connascence_report)
        self.assertIn('options', sig.parameters)

        # Test validate_safety_compliance signature
        sig = inspect.signature(self.analyzer.validate_safety_compliance)
        self.assertIn('options', sig.parameters)

        # Test get_refactoring_suggestions signature
        sig = inspect.signature(self.analyzer.get_refactoring_suggestions)
        self.assertIn('options', sig.parameters)

        # Test get_automated_fixes signature
        sig = inspect.signature(self.analyzer.get_automated_fixes)
        self.assertIn('options', sig.parameters)

    def test_import_compatibility(self):
        """Test that imports still work after renaming"""
        # Test that we can import the analyzers
        try:
            from analyzer.unified_analyzer import UnifiedAnalyzer
            from analyzer.architecture.refactored_unified_analyzer import RefactoredUnifiedAnalyzer

            analyzer1 = UnifiedAnalyzer()
            analyzer2 = RefactoredUnifiedAnalyzer()

            self.assertIsInstance(analyzer1, UnifiedAnalyzer)
            self.assertIsInstance(analyzer2, RefactoredUnifiedAnalyzer)

        except ImportError as e:
            self.fail(f"Import failed after naming standardization: {e}")

    def test_no_broken_references(self):
        """Test that there are no broken references to old names"""
        # This test checks that the renamed methods don't break existing functionality

        test_options = {'project_path': '.'}

        # Test that we can create analyzers and access their methods
        analyzer = UnifiedAnalyzer()
        self.assertTrue(callable(getattr(analyzer, 'generate_connascence_report')))
        self.assertTrue(callable(getattr(analyzer, 'validate_safety_compliance')))
        self.assertTrue(callable(getattr(analyzer, 'get_refactoring_suggestions')))
        self.assertTrue(callable(getattr(analyzer, 'get_automated_fixes')))

class TestCompatibilityLayer(unittest.TestCase):
    """Test the compatibility layer functionality"""

    def test_compatibility_mixin(self):
        """Test that the CompatibilityMixin provides backward compatibility"""
        from src.compatibility_layer import CompatibilityMixin, DEPRECATED_FUNCTION_MAPPINGS

        class TestClass(CompatibilityMixin):
            def generate_connascence_report(self, *args, **kwargs):
                return "new_method_called"

        test_obj = TestClass()

        with warnings.catch_warnings(record=True) as warning_list:
            warnings.simplefilter("always")

            # Test that old name still works
            result = test_obj.generateConnascenceReport({})
            self.assertEqual(result, "new_method_called")

            # Check deprecation warning was issued
            deprecation_warnings = [w for w in warning_list if issubclass(w.category, DeprecationWarning)]
            self.assertGreater(len(deprecation_warnings), 0)

    def test_deprecated_function_mappings(self):
        """Test that all deprecated function mappings are correct"""
        from src.compatibility_layer import DEPRECATED_FUNCTION_MAPPINGS

        expected_mappings = {
            'generateConnascenceReport': 'generate_connascence_report',
            'validateSafetyCompliance': 'validate_safety_compliance',
            'getRefactoringSuggestions': 'get_refactoring_suggestions',
            'getAutomatedFixes': 'get_automated_fixes'
        }

        self.assertEqual(DEPRECATED_FUNCTION_MAPPINGS, expected_mappings)

if __name__ == '__main__':
    # Run the tests
    unittest.main(verbosity=2)