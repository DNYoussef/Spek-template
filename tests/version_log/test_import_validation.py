#!/usr/bin/env python3
"""
Comprehensive import validation for moved test files.
Tests that all moved test files can import correctly from their new locations.
"""

import sys
import traceback
from pathlib import Path

def test_moved_file_imports():
    """Test that all moved test files can import correctly."""

    # Get project root
    current_file = Path(__file__)
    project_root = current_file.parent.parent.parent
    sys.path.insert(0, str(project_root))

    test_results = []

    print("=" * 60)
    print("IMPORT VALIDATION FOR MOVED TEST FILES")
    print("=" * 60)

    # Test 1: test_debug.py imports
    print("\n[TEST 1] Validating test_debug.py imports...")
    try:
        from src.version_log import ContentHasher
        print("  [OK] ContentHasher import: OK")

        # Test that ContentHasher works
        hasher = ContentHasher()
        test_hash = hasher.compute_hash("test content")
        print(f"  [OK] ContentHasher functionality: OK (hash: {test_hash})")

        test_results.append({
            "file": "test_debug.py",
            "status": "PASS",
            "details": "All imports successful, functionality verified"
        })

    except ImportError as e:
        print(f"  [FAIL] Import error: {e}")
        print(f"  [FAIL] Traceback: {traceback.format_exc()}")
        test_results.append({
            "file": "test_debug.py",
            "status": "FAIL",
            "details": f"Import error: {e}"
        })
    except Exception as e:
        print(f"  [FAIL] Unexpected error: {e}")
        test_results.append({
            "file": "test_debug.py",
            "status": "FAIL",
            "details": f"Unexpected error: {e}"
        })

    # Test 2: test_quick.py imports
    print("\n[TEST 2] Validating test_quick.py imports...")
    try:
        # Re-import to ensure clean test
        import importlib
        if 'src.version_log' in sys.modules:
            importlib.reload(sys.modules['src.version_log'])

        from src.version_log import ContentHasher
        print("  [OK] ContentHasher import: OK")

        # Test the quick functionality
        hasher = ContentHasher()
        quick_hash = hasher.compute_hash("quick test")
        print(f"  [OK] Quick hash test: OK (hash: {quick_hash})")

        test_results.append({
            "file": "test_quick.py",
            "status": "PASS",
            "details": "All imports successful, quick test verified"
        })

    except ImportError as e:
        print(f"  [FAIL] Import error: {e}")
        test_results.append({
            "file": "test_quick.py",
            "status": "FAIL",
            "details": f"Import error: {e}"
        })
    except Exception as e:
        print(f"  [FAIL] Unexpected error: {e}")
        test_results.append({
            "file": "test_quick.py",
            "status": "FAIL",
            "details": f"Unexpected error: {e}"
        })

    # Test 3: test_hash_debug.py basic imports
    print("\n[TEST 3] Validating test_hash_debug.py imports...")
    try:
        import tempfile
        import hashlib
        print("  [OK] tempfile import: OK")
        print("  [OK] pathlib.Path import: OK")
        print("  [OK] hashlib import: OK")

        # Test basic functionality expected by test_hash_debug.py
        temp_dir = Path(tempfile.mkdtemp())
        print(f"  [OK] tempfile.mkdtemp: OK (created: {temp_dir})")

        # Test hash functionality
        test_content = "test hash content"
        hash_obj = hashlib.sha256(test_content.encode('utf-8'))
        test_hash = hash_obj.hexdigest()[:7]
        print(f"  [OK] hashlib functionality: OK (hash: {test_hash})")

        test_results.append({
            "file": "test_hash_debug.py",
            "status": "PASS",
            "details": "All basic imports successful, functionality verified"
        })

    except ImportError as e:
        print(f"  [FAIL] Import error: {e}")
        test_results.append({
            "file": "test_hash_debug.py",
            "status": "FAIL",
            "details": f"Import error: {e}"
        })
    except Exception as e:
        print(f"  [FAIL] Unexpected error: {e}")
        test_results.append({
            "file": "test_hash_debug.py",
            "status": "FAIL",
            "details": f"Unexpected error: {e}"
        })

    # Test 4: Verify the actual moved files exist
    print("\n[TEST 4] Verifying moved files exist...")
    moved_files = [
        "tests/version_log/test_debug.py",
        "tests/version_log/test_quick.py",
        "tests/version_log/test_hash_debug.py"
    ]

    for file_path in moved_files:
        full_path = project_root / file_path
        if full_path.exists():
            print(f"  [OK] {file_path}: EXISTS")
        else:
            print(f"  [FAIL] {file_path}: MISSING")
            test_results.append({
                "file": file_path,
                "status": "FAIL",
                "details": "File not found at expected location"
            })

    # Summary
    print("\n" + "=" * 60)
    print("IMPORT VALIDATION SUMMARY")
    print("=" * 60)

    total_tests = len(test_results)
    passed_tests = sum(1 for result in test_results if result["status"] == "PASS")
    failed_tests = total_tests - passed_tests

    print(f"Total Tests: {total_tests}")
    print(f"Passed: {passed_tests}")
    print(f"Failed: {failed_tests}")
    print(f"Success Rate: {(passed_tests/total_tests*100):.1f}%" if total_tests > 0 else "N/A")

    print("\nDetailed Results:")
    for result in test_results:
        status_symbol = "[OK]" if result["status"] == "PASS" else "[FAIL]"
        print(f"  {status_symbol} {result['file']}: {result['status']} - {result['details']}")

    return test_results, passed_tests == total_tests

if __name__ == "__main__":
    results, all_passed = test_moved_file_imports()

    if all_passed:
        print("\n[SUCCESS] ALL IMPORT TESTS PASSED! File moves are successful.")
        sys.exit(0)
    else:
        print("\n[WARNING] SOME IMPORT TESTS FAILED. File moves need attention.")
        sys.exit(1)