"""
Test consolidated detectors to ensure they work correctly.
"""

import ast
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from consolidated_detectors import (
    ConsolidatedMagicLiteralDetector,
    ConsolidatedPositionDetector,
    ConsolidatedGodObjectDetector,
    DetectorRegistry
)


def test_magic_literal_detector():
    """Test magic literal detection."""
    print("TEST 1: Magic Literal Detector")
    print("-" * 40)

    test_code = '''
x = 42  # Magic number
pi = 3.14159  # Magic number
threshold = 0.75  # Magic number

# These should be allowed
zero = 0
one = 1
hundred = 100

# Hardcoded paths
config_path = "/usr/local/config.json"
api_url = "https://api.example.com/v1"
'''

    tree = ast.parse(test_code)
    detector = ConsolidatedMagicLiteralDetector("test.py", test_code.splitlines())
    violations = detector.detect_violations(tree)

    print(f"Violations found: {len(violations)}")
    for v in violations[:5]:
        print(f"  - Line {v.line_number}: {v.type}")
        print(f"    {v.description}")

    # Should find magic numbers and hardcoded paths
    return len(violations) >= 5


def test_position_detector():
    """Test position detector."""
    print("\nTEST 2: Position Detector")
    print("-" * 40)

    test_code = '''
def good_function(a, b, c):
    pass

def bad_function(a, b, c, d, e, f, g):
    pass

def medium_function(a, b, c, d):
    pass
'''

    tree = ast.parse(test_code)
    detector = ConsolidatedPositionDetector("test.py", test_code.splitlines())
    violations = detector.detect_violations(tree)

    print(f"Violations found: {len(violations)}")
    for v in violations:
        print(f"  - Line {v.line_number}: {v.description}")
        print(f"    Severity: {v.severity}")

    # Should find 2 violations (bad_function and medium_function)
    return len(violations) == 2


def test_god_object_detector():
    """Test god object detector."""
    print("\nTEST 3: God Object Detector")
    print("-" * 40)

    test_code = '''
class GoodClass:
    def method1(self): pass
    def method2(self): pass
    def method3(self): pass

class GodClass:
    def method1(self): pass
    def method2(self): pass
    def method3(self): pass
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
    def method16(self): pass
    def method17(self): pass
'''

    tree = ast.parse(test_code)
    detector = ConsolidatedGodObjectDetector("test.py", test_code.splitlines())
    violations = detector.detect_violations(tree)

    print(f"Violations found: {len(violations)}")
    for v in violations:
        print(f"  - Line {v.line_number}: {v.description}")
        print(f"    Severity: {v.severity}")

    # Should find 1 violation (GodClass)
    return len(violations) == 1


def test_detector_registry():
    """Test detector registry."""
    print("\nTEST 4: Detector Registry")
    print("-" * 40)

    registry = DetectorRegistry()

    # Test getting individual detector
    detector = registry.get_detector('magic_literal', 'test.py', [])
    print(f"Got magic_literal detector: {detector is not None}")

    # Test getting all detectors
    all_detectors = registry.get_all_detectors('test.py', [])
    print(f"Got {len(all_detectors)} detectors from registry")

    # Test registration
    class CustomDetector(ConsolidatedMagicLiteralDetector):
        pass

    registry.register('custom', CustomDetector)
    custom = registry.get_detector('custom', 'test.py', [])
    print(f"Registered and got custom detector: {custom is not None}")

    return len(all_detectors) == 3 and custom is not None


def test_backwards_compatibility():
    """Test that aliases work."""
    print("\nTEST 5: Backwards Compatibility")
    print("-" * 40)

    # Import aliases
    from consolidated_detectors import (
        MagicLiteralDetector,
        PositionDetector,
        GodObjectDetector,
        DetectorBase
    )

    # Check they work
    detector1 = MagicLiteralDetector("test.py", [])
    detector2 = PositionDetector("test.py", [])
    detector3 = GodObjectDetector("test.py", [])

    print(f"MagicLiteralDetector alias works: {detector1 is not None}")
    print(f"PositionDetector alias works: {detector2 is not None}")
    print(f"GodObjectDetector alias works: {detector3 is not None}")
    print(f"DetectorBase alias works: {DetectorBase is not None}")

    return all([detector1, detector2, detector3, DetectorBase])


def main():
    """Run all tests."""
    print("=" * 50)
    print("CONSOLIDATED DETECTOR TESTS")
    print("=" * 50)
    print()

    tests_passed = 0
    total_tests = 5

    if test_magic_literal_detector():
        tests_passed += 1
        print("[PASS] Magic literal detector test\n")
    else:
        print("[FAIL] Magic literal detector test\n")

    if test_position_detector():
        tests_passed += 1
        print("[PASS] Position detector test\n")
    else:
        print("[FAIL] Position detector test\n")

    if test_god_object_detector():
        tests_passed += 1
        print("[PASS] God object detector test\n")
    else:
        print("[FAIL] God object detector test\n")

    if test_detector_registry():
        tests_passed += 1
        print("[PASS] Detector registry test\n")
    else:
        print("[FAIL] Detector registry test\n")

    if test_backwards_compatibility():
        tests_passed += 1
        print("[PASS] Backwards compatibility test\n")
    else:
        print("[FAIL] Backwards compatibility test\n")

    print("=" * 50)
    print(f"RESULTS: {tests_passed}/{total_tests} tests passed")
    print("=" * 50)

    if tests_passed == total_tests:
        print("\nDETECTOR CONSOLIDATION SUCCESSFUL!")
        print("All detectors working correctly.")
        print("Ready to replace duplicate implementations.")
    else:
        print("\nDETECTOR CONSOLIDATION NEEDS WORK")
        print("Some tests failed. Review implementation.")

    return tests_passed == total_tests


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)