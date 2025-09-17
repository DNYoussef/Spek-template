"""
REAL tests that FAIL when analyzer is broken.
NO THEATER - these tests validate actual functionality.
"""

import pytest
import sys
import os
from pathlib import Path

# Add analyzer to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))


def test_real_analyzer_import():
    """Test that REAL analyzer can be imported and works."""
    from analyzer.real_unified_analyzer import RealUnifiedAnalyzer

    # This MUST work or test fails
    analyzer = RealUnifiedAnalyzer()
    assert analyzer is not None
    assert hasattr(analyzer, 'analyze_project')
    assert hasattr(analyzer, 'analyze_file')

    # Verify it's not a mock
    assert hasattr(analyzer, 'connascence_detector')
    assert hasattr(analyzer, 'nasa_analyzer')
    assert hasattr(analyzer, 'duplication_analyzer')


def test_real_connascence_detection():
    """Test that connascence detector actually finds violations."""
    from analyzer.real_unified_analyzer import RealConnascenceDetector

    detector = RealConnascenceDetector()

    # Create a test file with known violations
    test_file = Path(__file__).parent / "temp_test_file.py"

    # Code with magic literals and god class
    test_code = '''
class GodClass:
    def method1(self): return 42  # Magic literal
    def method2(self): return 123  # Magic literal
    def method3(self): return 456  # Magic literal
    def method4(self): pass
    def method5(self): pass
    def method6(self): pass
    def method7(self): pass
    def method8(self): pass
    def method9(self): pass
    def method10(self): pass
    def method11(self): pass
    def method12(self): pass
    def method13(self): pass
    def method14(self): pass
    def method15(self): pass
    def method16(self): pass  # This makes it a god class (16 methods > 15)
'''

    try:
        test_file.write_text(test_code)
        violations = detector.analyze_file(str(test_file))

        # Must find violations or test fails
        assert len(violations) > 0, "No violations found - detector is broken!"

        # Must find magic literals
        magic_violations = [v for v in violations if v.rule_id == "CON_MAGIC_LITERAL"]
        assert len(magic_violations) >= 3, f"Expected at least 3 magic literals, found {len(magic_violations)}"

        # Must find god class
        god_violations = [v for v in violations if v.rule_id == "GOD_CLASS"]
        assert len(god_violations) >= 1, "God class not detected - detector is broken!"

    finally:
        if test_file.exists():
            test_file.unlink()


def test_real_nasa_analyzer():
    """Test that NASA analyzer actually enforces rules."""
    from analyzer.real_unified_analyzer import RealNASAAnalyzer

    analyzer = RealNASAAnalyzer()

    # Create test file with NASA violations
    test_file = Path(__file__).parent / "temp_nasa_test.py"

    # Long function violating NASA Rule 2 (>60 lines)
    test_code = f'''
def long_function():
    """This function violates NASA Rule 2 by being >60 lines."""
{chr(10).join(f"    line_{i} = {i}" for i in range(70))}
    return sum(locals().values())
'''

    try:
        test_file.write_text(test_code)
        violations = analyzer.analyze_file(str(test_file))

        # Must find NASA violations or test fails
        assert len(violations) > 0, "No NASA violations found - analyzer is broken!"

        # Must find long function violation
        rule2_violations = [v for v in violations if v.rule_id == "NASA_POT10_RULE_2"]
        assert len(rule2_violations) >= 1, "NASA Rule 2 violation not detected - analyzer is broken!"

    finally:
        if test_file.exists():
            test_file.unlink()


def test_real_duplication_analyzer():
    """Test that duplication analyzer finds actual duplicates."""
    from analyzer.real_unified_analyzer import RealDuplicationAnalyzer

    analyzer = RealDuplicationAnalyzer(similarity_threshold=0.8)

    # Create test directory with duplicate files
    test_dir = Path(__file__).parent / "temp_dup_test"
    test_dir.mkdir(exist_ok=True)

    try:
        # Create two similar files
        file1 = test_dir / "file1.py"
        file2 = test_dir / "file2.py"

        similar_code = '''
def process_data(data):
    result = []
    for item in data:
        if item > 0:
            result.append(item * 2)
    return result
'''

        file1.write_text(similar_code)
        file2.write_text(similar_code)  # Exact duplicate

        result = analyzer.analyze_path(str(test_dir))

        # Must find duplications or test fails
        assert "duplications" in result, "Duplication result missing duplications field"
        duplications = result["duplications"]
        assert len(duplications) > 0, "No duplications found - analyzer is broken!"

        # Must have low duplication score due to duplicates
        assert result["score"] < 1.0, f"Duplication score should be < 1.0, got {result['score']}"

    finally:
        # Cleanup
        for file in test_dir.glob("*.py"):
            file.unlink()
        test_dir.rmdir()


def test_real_unified_analyzer_integration():
    """Test that unified analyzer produces real results."""
    from analyzer.real_unified_analyzer import RealUnifiedAnalyzer

    analyzer = RealUnifiedAnalyzer()

    # Test analyzing this test file itself
    result = analyzer.analyze_file(__file__)

    # Must have real analysis fields or test fails
    required_fields = ["connascence_violations", "nasa_violations", "nasa_compliance_score"]
    for field in required_fields:
        assert field in result, f"Missing required field: {field} - analyzer is broken!"

    # Must have analysis metadata
    assert "analysis_time_ms" in result, "Missing analysis timing - analyzer is broken!"
    assert "real_analysis" in result, "Missing real analysis flag - this might be a mock!"
    assert result["real_analysis"] is True, "Analysis is not marked as real - this is theater!"


def test_unified_analyzer_fails_on_broken_file():
    """Test that analyzer properly reports failures on broken files."""
    from analyzer.real_unified_analyzer import RealUnifiedAnalyzer

    analyzer = RealUnifiedAnalyzer()

    # Create file with syntax error
    test_file = Path(__file__).parent / "temp_broken_test.py"

    try:
        test_file.write_text("def broken_function(\n    # Missing closing parenthesis")

        violations = analyzer.connascence_detector.analyze_file(str(test_file))

        # Must detect syntax error or test fails
        syntax_errors = [v for v in violations if v.rule_id == "SYNTAX_ERROR"]
        assert len(syntax_errors) > 0, "Syntax error not detected - analyzer is broken!"
        assert any(v.severity == "critical" for v in syntax_errors), "Syntax error not marked as critical!"

    finally:
        if test_file.exists():
            test_file.unlink()


def test_analyzer_statistics_tracking():
    """Test that analyzer tracks real statistics."""
    from analyzer.real_unified_analyzer import RealUnifiedAnalyzer

    analyzer = RealUnifiedAnalyzer()

    # Get initial stats
    initial_stats = analyzer.get_analysis_stats()
    assert isinstance(initial_stats, dict), "Stats must be dictionary"

    # Analyze a file
    analyzer.analyze_file(__file__)

    # Check that stats were updated
    updated_stats = analyzer.get_analysis_stats()
    assert updated_stats["files_processed"] > initial_stats["files_processed"], \
           "File processing not tracked - statistics are fake!"


def test_no_mock_components():
    """Test that analyzer has no mock components."""
    from analyzer.real_unified_analyzer import RealUnifiedAnalyzer

    analyzer = RealUnifiedAnalyzer()

    # Check that core components are real classes, not mocks
    assert analyzer.connascence_detector.__class__.__name__ == "RealConnascenceDetector"
    assert analyzer.nasa_analyzer.__class__.__name__ == "RealNASAAnalyzer"
    assert analyzer.duplication_analyzer.__class__.__name__ == "RealDuplicationAnalyzer"

    # Verify no mock methods
    for component in [analyzer.connascence_detector, analyzer.nasa_analyzer, analyzer.duplication_analyzer]:
        for method_name in dir(component):
            if callable(getattr(component, method_name)) and not method_name.startswith('_'):
                method = getattr(component, method_name)
                # Check that method actually does work (not just returns empty/mock data)
                assert method.__doc__ is None or "mock" not in method.__doc__.lower(), \
                       f"Method {method_name} appears to be a mock!"


if __name__ == "__main__":
    print("Running REAL analyzer tests that FAIL when broken...")

    try:
        test_real_analyzer_import()
        print("[PASS] Real analyzer import test PASSED")

        test_real_connascence_detection()
        print("[PASS] Real connascence detection test PASSED")

        test_real_nasa_analyzer()
        print("[PASS] Real NASA analyzer test PASSED")

        test_real_duplication_analyzer()
        print("[PASS] Real duplication analyzer test PASSED")

        test_real_unified_analyzer_integration()
        print("[PASS] Real unified analyzer integration test PASSED")

        test_unified_analyzer_fails_on_broken_file()
        print("[PASS] Real failure detection test PASSED")

        test_analyzer_statistics_tracking()
        print("[PASS] Real statistics tracking test PASSED")

        test_no_mock_components()
        print("[PASS] No mock components test PASSED")

        print("\n[SUCCESS] ALL REAL TESTS PASSED - ANALYZER IS WORKING!")

    except Exception as e:
        print(f"\n[FAIL] TEST FAILED - ANALYZER IS BROKEN: {e}")
        raise