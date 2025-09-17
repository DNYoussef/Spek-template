from lib.shared.utilities import path_exists
#!/usr/bin/env python3
"""
Theater Detection System - Validates that analyzer fix is real work
"""

import sys
import time
import ast
from pathlib import Path
from collections import Counter

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

def run_theater_detection():
    """Run comprehensive theater detection on analyzer fix."""

    print("=== THEATER DETECTION SYSTEM ===")
    print("Validating analyzer fix is real work, not performance theater...\n")

    results = []

    # Test 1: Verify the stub was actually changed
    print("Test 1: Checking if stub implementation was replaced...")
    analyzer_file = Path("analyzer/detectors/connascence_ast_analyzer.py")
    with open(analyzer_file, 'r') as f:
        content = f.read()
        lines = content.split('\n')

        # Check for the old stub pattern
        stub_found = False
        for i, line in enumerate(lines[20:35]):  # Check around line 28
            if 'return []' in line and 'detect_violations' in lines[i+20-5:i+20+5]:
                if 'FIXED' not in content[max(0, content.find('detect_violations')):]:
                    stub_found = True
                    results.append(("FAIL", f"Stub still returns empty list at line {i+21}"))
                    break

        if not stub_found:
            # Check that real detection logic exists
            if 'detectors_to_run' in content and 'MagicLiteral' in content:
                results.append(("PASS", "Stub implementation has been replaced with real detection logic"))
            else:
                results.append(("WARN", "Stub removed but detection logic unclear"))

    # Test 2: Verify actual detection is happening
    print("\nTest 2: Testing detection on known violations...")
    from analyzer.detectors.connascence_ast_analyzer import ConnascenceASTAnalyzer
    analyzer = ConnascenceASTAnalyzer()

    # Create a test case with known violations
    test_code = """
def bad_function(a, b, c, d, e, f, g):  # Too many parameters
    magic_value = 86400  # Magic number
    another_magic = 3600  # Another magic number
    if isinstance(obj, str):  # Type checking
        return 42  # Magic number
"""

    tree = ast.parse(test_code)
    analyzer.file_path = 'test.py'
    analyzer.source_lines = test_code.split('\n')

    violations = analyzer.detect_violations(tree)
    if len(violations) > 0:
        results.append(("PASS", f"Test code produced {len(violations)} violations"))
    else:
        results.append(("FAIL", "Test code produced 0 violations - detection not working"))

    # Test 3: Verify violations are diverse and realistic
    print("\nTest 3: Checking violation diversity...")
    test_file = 'src/security/dfars_compliance_engine.py'
    if path_exists(test_file):
        file_violations = analyzer.analyze_file(test_file)
        types = Counter(v.type for v in file_violations)

        if len(types) >= 2:
            results.append(("PASS", f"Found {len(types)} different violation types"))
        elif len(types) == 1:
            results.append(("WARN", "Only one violation type detected"))
        else:
            results.append(("FAIL", "No violation types detected"))

    # Test 4: Performance test
    print("\nTest 4: Performance validation...")
    start = time.time()
    src_violations = analyzer.analyze_directory('src')
    duration = time.time() - start

    if duration < 0.01:
        results.append(("FAIL", f"Analysis too fast ({duration:.3f}s) - likely fake"))
    elif duration > 60:
        results.append(("WARN", f"Analysis very slow ({duration:.1f}s) - may have issues"))
    else:
        results.append(("PASS", f"Analysis took {duration:.2f}s - realistic processing time"))

    # Test 5: Verify violation count is realistic
    print("\nTest 5: Violation count validation...")
    violation_count = len(src_violations)

    if violation_count == 0:
        results.append(("FAIL", "0 violations detected - analyzer not working"))
    elif violation_count < 100:
        results.append(("WARN", f"Only {violation_count} violations - seems low"))
    elif violation_count > 10000:
        results.append(("WARN", f"{violation_count} violations - seems excessive"))
    else:
        results.append(("PASS", f"{violation_count} violations detected - realistic count"))

    # Print results summary
    print("\n" + "="*60)
    print("THEATER DETECTION RESULTS:")
    print("="*60)

    pass_count = sum(1 for r in results if r[0] == "PASS")
    fail_count = sum(1 for r in results if r[0] == "FAIL")
    warn_count = sum(1 for r in results if r[0] == "WARN")

    for status, message in results:
        if status == "PASS":
            print(f"[PASS] {message}")
        elif status == "FAIL":
            print(f"[FAIL] {message}")
        else:
            print(f"[WARN] {message}")

    print("\n" + "="*60)
    print(f"Summary: {pass_count} PASS, {fail_count} FAIL, {warn_count} WARN")

    # Final verdict
    if fail_count == 0 and pass_count >= 3:
        print("\nVERDICT: REAL WORK - The analyzer fix is genuine and functional")
        print(f"Evidence: Detecting {violation_count} violations across multiple types")
        return True
    elif fail_count > 2:
        print("\nVERDICT: THEATER DETECTED - The fix appears to be superficial")
        return False
    else:
        print("\nVERDICT: PARTIAL WORK - Some improvements but issues remain")
        return None

if __name__ == "__main__":
    result = run_theater_detection()

    # Exit code for CI/CD integration
    if result is True:
        sys.exit(0)  # Success
    elif result is False:
        sys.exit(1)  # Theater detected
    else:
        sys.exit(2)  # Partial/unclear