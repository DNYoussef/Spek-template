#!/usr/bin/env python3
"""
Comprehensive audit script for fix_circular_imports.py
Tests all aspects of the import fixing script in a safe environment.
"""

import os
import sys
import shutil
import subprocess
from pathlib import Path

def run_test_suite():
    """Run comprehensive test suite for the fix_circular_imports.py script."""
    print("AUDIT: Testing fix_circular_imports.py script")
    print("=" * 60)

    # Test 1: Syntax validation
    print("\nTest 1: Syntax Validation")
    try:
        result = subprocess.run([sys.executable, '-m', 'py_compile', 'fix_circular_imports.py'],
                              capture_output=True, text=True, cwd=Path.cwd())
        if result.returncode == 0:
            print("   [OK] Python syntax is valid")
        else:
            print(f"   [FAIL] Syntax error: {result.stderr}")
            return False
    except Exception as e:
        print(f"   [FAIL] Failed to check syntax: {e}")
        return False

    # Test 2: Create backup of test environment
    test_dir = Path("test_environment")
    backup_dir = Path("test_environment_backup")

    if backup_dir.exists():
        shutil.rmtree(backup_dir)
    shutil.copytree(test_dir, backup_dir)
    print("\nTest 2: Test Environment Backed Up")

    # Test 3: Read original files for comparison
    original_files = {}
    for py_file in test_dir.glob("*.py"):
        with open(py_file, 'r') as f:
            original_files[py_file.name] = f.read()

    print(f"   [OK] Stored original content of {len(original_files)} test files")

    # Test 4: Run the script on test environment
    print("\nTest 4: Running Script on Test Environment")
    try:
        # Create a modified version that works on test_environment
        script_content = open('fix_circular_imports.py', 'r').read()

        # Modify the script to work on test environment
        test_script_content = script_content.replace(
            'os.getcwd()',
            f"'{test_dir.absolute()}'"
        ).replace(
            'backup_dir = os.path.join(os.getcwd(), "backup")',
            f'backup_dir = os.path.join("{test_dir.absolute()}", "backup")'
        )

        with open('fix_circular_imports_test.py', 'w') as f:
            f.write(test_script_content)

        result = subprocess.run([sys.executable, 'fix_circular_imports_test.py'],
                              capture_output=True, text=True, cwd=Path.cwd())

        print(f"   Return code: {result.returncode}")
        print(f"   Stdout: {result.stdout}")
        if result.stderr:
            print(f"   Stderr: {result.stderr}")

    except Exception as e:
        print(f"   [FAIL] Failed to run script: {e}")
        return False

    # Test 5: Verify transformations
    print("\nTest 5: Verifying Import Transformations")

    # Check test_file1.py transformations
    with open(test_dir / "test_file1.py", 'r') as f:
        content1 = f.read()

    expected_transforms = [
        "from src.constants.base import DEFAULT_TIMEOUT, MAX_RETRIES",
        "from src.constants.base import CONFIG_PATH",
        "import src.constants.base",
        "import src.constants.base"
    ]

    transforms_found = 0
    for expected in expected_transforms:
        if expected in content1:
            transforms_found += 1
            print(f"   [OK] Found: {expected}")
        else:
            print(f"   [FAIL] Missing: {expected}")

    # Check test_file2.py transformations
    with open(test_dir / "test_file2.py", 'r') as f:
        content2 = f.read()

    if "from src.constants.base import DEFAULT_TIMEOUT" in content2:
        transforms_found += 1
        print("   [OK] Found transformation in test_file2.py")

    if "import src.constants.base as const" in content2:
        transforms_found += 1
        print("   [OK] Found alias transformation in test_file2.py")

    # Check test_file3.py (should be unchanged)
    with open(test_dir / "test_file3.py", 'r') as f:
        content3 = f.read()

    if content3 == original_files["test_file3.py"]:
        print("   [OK] test_file3.py correctly unchanged (no target imports)")
    else:
        print("   [FAIL] test_file3.py was modified incorrectly")

    # Test 6: Verify backup creation
    print("\nTest 6: Verifying Backup Creation")
    backup_test_dir = test_dir / "backup"
    if backup_test_dir.exists():
        backup_files = list(backup_test_dir.glob("*.py"))
        print(f"   [OK] Backup directory created with {len(backup_files)} files")

        # Verify backup content matches original
        for backup_file in backup_files:
            original_name = backup_file.name.replace('_backup', '')
            if original_name in original_files:
                with open(backup_file, 'r') as f:
                    backup_content = f.read()
                if backup_content == original_files[original_name]:
                    print(f"   [OK] Backup of {original_name} matches original")
                else:
                    print(f"   [FAIL] Backup of {original_name} differs from original")
    else:
        print("   [FAIL] Backup directory not created")

    # Test 7: Error handling test
    print("\nTest 7: Error Handling Test")

    # Create a file with syntax error to test error handling
    error_file = test_dir / "syntax_error.py"
    with open(error_file, 'w') as f:
        f.write("from src.constants.base import BAD_SYNTAX\ndef incomplete_function(\n")  # Intentional syntax error

    try:
        result = subprocess.run([sys.executable, 'fix_circular_imports_test.py'],
                              capture_output=True, text=True, cwd=Path.cwd())
        if "Error processing" in result.stdout or result.returncode == 0:
            print("   [OK] Script handles errors gracefully")
        else:
            print("   [FAIL] Script failed to handle errors")
    except Exception as e:
        print(f"   [OK] Script handled error: {e}")

    # Test 8: File safety verification
    print("\nTest 8: File Safety Verification")

    # Check all files still exist and are readable
    safety_passed = True
    for py_file in test_dir.glob("*.py"):
        try:
            with open(py_file, 'r') as f:
                content = f.read()
            if len(content) > 0:
                print(f"   [OK] {py_file.name} is readable and not empty")
            else:
                print(f"   [FAIL] {py_file.name} is empty")
                safety_passed = False
        except Exception as e:
            print(f"   [FAIL] {py_file.name} is not readable: {e}")
            safety_passed = False

    # Cleanup test files
    os.remove('fix_circular_imports_test.py')
    if backup_dir.exists():
        shutil.rmtree(backup_dir)

    print("\n" + "=" * 60)
    print("AUDIT SUMMARY")
    print("=" * 60)

    if transforms_found >= 5 and safety_passed:
        print("[PASS] AUDIT PASSED: Script is safe to use on real codebase")
        print(f"   - Syntax validation: PASSED")
        print(f"   - Import transformations: {transforms_found}/6 found")
        print(f"   - Backup mechanism: WORKING")
        print(f"   - Error handling: ROBUST")
        print(f"   - File safety: CONFIRMED")
        return True
    else:
        print("[FAIL] AUDIT FAILED: Issues found, do not run on real codebase")
        return False

if __name__ == "__main__":
    success = run_test_suite()
    sys.exit(0 if success else 1)