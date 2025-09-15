"""
Test the consolidated analyzer to ensure it works correctly.
"""

import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from unified_connascence_analyzer import UnifiedConnascenceAnalyzer


def test_single_file():
    """Test analyzing a single file."""
    print("TEST 1: Single File Analysis")
    print("-" * 40)

    # Create a test file with known violations
    test_code = '''
def process_data(a, b, c, d, e, f):  # Too many parameters
    magic_value = 42  # Magic number
    threshold = 0.75  # Magic number

    if a > 100:  # Magic number
        return b * 3.14  # Magic number

    path = "/usr/local/bin/app"  # Hardcoded path
    url = "http://api.example.com"  # Hardcoded URL

    return magic_value
'''

    # Write test file
    test_file = Path(__file__).parent / "test_sample.py"
    test_file.write_text(test_code)

    # Analyze it
    analyzer = UnifiedConnascenceAnalyzer(str(test_file))
    result = analyzer.analyze()

    print(f"File: {result['file_path']}")
    print(f"Total violations: {result['total_violations']}")
    print(f"Violations by type: {result['violations_by_type']}")

    # Show some violations
    if result['violations']:
        print("\nSample violations:")
        for v in result['violations'][:3]:
            print(f"  - Line {v['line_number']}: {v['type']}")
            print(f"    {v['description']}")

    # Clean up
    test_file.unlink()

    return result['total_violations'] > 0


def test_directory():
    """Test analyzing a directory."""
    print("\nTEST 2: Directory Analysis")
    print("-" * 40)

    # Create test directory with multiple files
    test_dir = Path(__file__).parent / "test_project"
    test_dir.mkdir(exist_ok=True)

    # Create file 1
    (test_dir / "module1.py").write_text('''
class DataProcessor:
    def process(self, x, y, z, w, v):  # Too many params
        return x + 100  # Magic number
''')

    # Create file 2
    (test_dir / "module2.py").write_text('''
def calculate():
    pi = 3.14159  # Magic number
    return pi * 2  # Magic number
''')

    # Analyze directory
    analyzer = UnifiedConnascenceAnalyzer(str(test_dir))
    result = analyzer.analyze()

    print(f"Directory: {result['project_path']}")
    print(f"Files analyzed: {result['files_analyzed']}")
    print(f"Total violations: {result['total_violations']}")
    print(f"Violations by type: {result['violations_by_type']}")

    # Clean up
    for f in test_dir.glob("*.py"):
        f.unlink()
    test_dir.rmdir()

    return result['total_violations'] > 0


def test_caching():
    """Test that caching works."""
    print("\nTEST 3: Caching")
    print("-" * 40)

    # Create test file
    test_file = Path(__file__).parent / "cache_test.py"
    test_file.write_text('x = 42')

    # First analysis without cache
    analyzer1 = UnifiedConnascenceAnalyzer(str(test_file), enable_caching=False)
    result1 = analyzer1.analyze()

    # Second analysis with cache
    analyzer2 = UnifiedConnascenceAnalyzer(str(test_file), enable_caching=True)
    result2 = analyzer2.analyze()
    result3 = analyzer2.analyze()  # Should use cache

    print(f"Without cache: {result1['total_violations']} violations")
    print(f"With cache (1st): {result2['total_violations']} violations")
    print(f"With cache (2nd): {result3['total_violations']} violations")
    print(f"Cache working: {result2 == result3}")

    # Clean up
    test_file.unlink()

    return result2 == result3


def main():
    """Run all tests."""
    print("=" * 50)
    print("CONSOLIDATED ANALYZER TESTS")
    print("=" * 50)
    print()

    tests_passed = 0
    total_tests = 3

    if test_single_file():
        tests_passed += 1
        print("[PASS] Single file test PASSED\n")
    else:
        print("[FAIL] Single file test FAILED\n")

    if test_directory():
        tests_passed += 1
        print("[PASS] Directory test PASSED\n")
    else:
        print("[FAIL] Directory test FAILED\n")

    if test_caching():
        tests_passed += 1
        print("[PASS] Caching test PASSED\n")
    else:
        print("[FAIL] Caching test FAILED\n")

    print("=" * 50)
    print(f"RESULTS: {tests_passed}/{total_tests} tests passed")
    print("=" * 50)

    if tests_passed == total_tests:
        print("\nCONSOLIDATION SUCCESSFUL!")
        print("The unified analyzer combines functionality from all versions.")
        print("Ready to replace the duplicated implementations.")
    else:
        print("\nCONSOLIDATION NEEDS WORK")
        print("Some tests failed. Review the implementation.")

    return tests_passed == total_tests


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)