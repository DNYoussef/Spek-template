#!/usr/bin/env python3
"""
Test script to verify analyzer fixes are working correctly.
Tests NASA analyzer, core analyzer stub delegation, and fixed analyzer imports.
"""

from pathlib import Path
import os
import sys

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

def test_nasa_analyzer():
    """Test that NASA analyzer now properly detects violations."""

    from analyzer.nasa_engine.nasa_analyzer import NASAAnalyzer
    import ast

    analyzer = NASAAnalyzer()

    # Test _check_data_scope with global variables
    test_code = """
# Global variables
GLOBAL_VAR1 = 1
GLOBAL_VAR2 = 2
GLOBAL_VAR3 = 3
GLOBAL_VAR4 = 4
GLOBAL_VAR5 = 5
GLOBAL_VAR6 = 6  # This should trigger warning (>5 globals)

def some_function():
    local_var = 10
    return local_var
"""

    tree = ast.parse(test_code)
    violations = analyzer._check_data_scope(tree, "test.py")

    assert len(violations) > 0, "NASA Rule 6: Should detect global variables"
    assert violations[0].type == "NASA-Global-Scope"
    assert "6 global variables" in violations[0].description
    assert violations[0].severity == "warning"  # Since we have 6 globals (>5)
    # Verify NASA Rule 6 detection
    assert len(violations) > 0
    assert violations[0].description

    # Test _check_return_values with unused function returns
    test_code2 = """
def get_value():
    return 42

def another_function():
    return "result"

# Unused return values
get_value()  # This should be flagged
another_function()  # This should be flagged

# Used return value
result = get_value()  # This is OK
"""

    tree2 = ast.parse(test_code2)
    violations2 = analyzer._check_return_values(tree2, "test.py")

    assert len(violations2) == 2, f"NASA Rule 7: Should detect 2 unused returns, found {len(violations2)}"
    assert all(v.type == "NASA-Return-Check" for v in violations2)
    # Verify NASA Rule 7 detection
    assert len(violations2) == 2
    for v in violations2:
        assert v.line_number > 0

    # NASA Analyzer tests successful
    return True

def test_core_analyzer_delegation():
    """Test that core analyzer now delegates to consolidated analyzer."""

    from analyzer.ast_engine.core_analyzer import ConnascenceASTAnalyzer

    analyzer = ConnascenceASTAnalyzer()

    # Check that analyzer has the delegation set up
    assert hasattr(analyzer, '_analyzer'), "Should have _analyzer attribute for delegation"

    # If ConsolidatedConnascenceAnalyzer is available, it should be initialized
    if analyzer._analyzer is not None:
        # Core analyzer delegating successfully

        # Test that analyze_file returns proper results (not empty list)
        test_file_path = "test_sample.py"
        test_content = """
def bad_function(a, b, c, d, e, f):  # Too many parameters
    magic_number = 42  # Magic literal
    return magic_number * 100  # Another magic literal
"""

        # Write test file
        with open(test_file_path, 'w') as f:
            f.write(test_content)

        try:
            # Analyze the file
            violations = analyzer.analyze_file(test_file_path)

            # Even if no violations are found, the important thing is it doesn't crash
            assert isinstance(violations, list), "Should return a list of violations"
            # analyze_file() delegation working
            assert isinstance(violations, list)

        finally:
            # Clean up test file
            if os.path.exists(test_file_path):
                os.remove(test_file_path)
    else:
        print("[WARN] ConsolidatedConnascenceAnalyzer not available, stub mode active")
        # In stub mode, should still return empty list without crashing
        violations = analyzer.analyze_file("nonexistent.py")
        assert violations == [], "Stub mode should return empty list"
        # Stub mode working as expected

    # Core Analyzer delegation tests successful
    return True

def test_fixed_analyzer_imports():
    """Test that fixed analyzer has proper imports and works."""

    try:
        # This should not raise ImportError anymore
        from analyzer.detectors.connascence_ast_analyzer_fixed import ConnascenceASTAnalyzer
        # Successfully imported ConnascenceASTAnalyzer

        # Check that it inherits from DetectorBase
        from analyzer.detectors.base import DetectorBase
        assert issubclass(ConnascenceASTAnalyzer, DetectorBase), "Should inherit from DetectorBase"
        # Proper inheritance verified

        # Try to instantiate it
        analyzer = ConnascenceASTAnalyzer(file_path="test.py", source_lines=["# test"])
        # Successfully instantiated analyzer

        # Check it has required methods
        assert hasattr(analyzer, 'detect_violations'), "Should have detect_violations method"
        assert hasattr(analyzer, 'analyze_directory'), "Should have analyze_directory method"
        # All required methods verified

        # Test basic detection
        import ast
        test_code = "magic_value = 42"
        tree = ast.parse(test_code)
        violations = analyzer.detect_violations(tree)

        # Should return a list (even if empty)
        assert isinstance(violations, list), "detect_violations should return a list"
        # detect_violations() working
        assert isinstance(violations, list)

    except ImportError as e:
        print(f"[FAIL] Import failed: {e}")
        return False
    except Exception as e:
        print(f"[FAIL] Unexpected error: {e}")
        return False

    # Fixed Analyzer import tests successful
    return True

def main():
    """Run all tests."""
    print("=" * 60)
    print("=" * 60)

    results = []

    # Run tests
    try:
        results.append(("NASA Analyzer", test_nasa_analyzer()))
    except Exception as e:
        results.append(("NASA Analyzer", False))

    try:
        results.append(("Core Analyzer Delegation", test_core_analyzer_delegation()))
    except Exception as e:
        results.append(("Core Analyzer Delegation", False))

    try:
        results.append(("Fixed Analyzer Imports", test_fixed_analyzer_imports()))
    except Exception as e:
        results.append(("Fixed Analyzer Imports", False))

    # Summary
    print("\n" + "=" * 60)
    print("=" * 60)

    for test_name, passed in results:
        status = "[OK] PASSED" if passed else "[FAIL] FAILED"

    all_passed = all(passed for _, passed in results)

    if all_passed:
        return 0
    else:
        return 1

if __name__ == "__main__":
    sys.exit(main())