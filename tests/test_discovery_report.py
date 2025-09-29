#!/usr/bin/env python3
"""
Test Discovery Report Generator
Comprehensive analysis of pytest test discovery status
"""

import os
import subprocess
import sys
from pathlib import Path
from typing import Dict, List, Tuple

PROJECT_ROOT = Path(__file__).parent.parent.absolute()

def find_all_test_files() -> List[Path]:
    """Find all potential test files"""
    test_files = []
    tests_dir = PROJECT_ROOT / "tests"

    for root, dirs, files in os.walk(tests_dir):
        # Skip cache and git directories
        dirs[:] = [d for d in dirs if not d.startswith('.') and d != '__pycache__']

        for file in files:
            if file.endswith('.py') and (
                file.startswith('test_') or
                file.endswith('_test.py') or
                'test' in file.lower()
            ):
                test_files.append(Path(root) / file)

    return sorted(test_files)

def test_collection_status(test_file: Path) -> Dict:
    """Test if a file can be collected by pytest"""
    try:
        result = subprocess.run([
            sys.executable, '-m', 'pytest',
            str(test_file), '--collect-only', '-q'
        ], capture_output=True, text=True, timeout=15, cwd=PROJECT_ROOT)

        stdout = result.stdout.strip()
        stderr = result.stderr.strip()

        if result.returncode == 0 and 'collected' in stdout:
            # Extract number of collected tests
            for line in stdout.split('\n'):
                if 'collected' in line:
                    return {
                        'status': 'SUCCESS',
                        'message': line.strip(),
                        'collected_count': extract_number(line, 'collected'),
                        'errors': []
                    }

        # Parse errors
        errors = []
        if 'ERROR' in stdout or 'ERROR' in stderr:
            errors.extend(extract_errors(stdout + '\n' + stderr))

        return {
            'status': 'ERROR',
            'message': f"Collection failed: {result.returncode}",
            'collected_count': 0,
            'errors': errors
        }

    except subprocess.TimeoutExpired:
        return {
            'status': 'TIMEOUT',
            'message': 'Collection timed out after 15 seconds',
            'collected_count': 0,
            'errors': ['Timeout during collection']
        }
    except Exception as e:
        return {
            'status': 'EXCEPTION',
            'message': f'Exception: {e}',
            'collected_count': 0,
            'errors': [str(e)]
        }

def extract_number(text: str, keyword: str) -> int:
    """Extract number from text like '5 items collected'"""
    import re
    pattern = rf'(\d+)[^0-9]*{keyword}'
    match = re.search(pattern, text)
    return int(match.group(1)) if match else 0

def extract_errors(text: str) -> List[str]:
    """Extract error messages from pytest output"""
    errors = []
    lines = text.split('\n')

    for i, line in enumerate(lines):
        if 'ERROR' in line or 'FAILED' in line:
            errors.append(line.strip())
            # Include context
            if i + 1 < len(lines) and lines[i + 1].strip():
                errors.append(f"  {lines[i + 1].strip()}")

    return errors

def generate_report():
    """Generate comprehensive test discovery report"""
    print("=" * 80)
    print("SPEK Test Discovery Analysis Report")
    print("=" * 80)

    test_files = find_all_test_files()
    print(f"Total test files found: {len(test_files)}")
    print()

    # Test each file
    results = {}
    success_count = 0
    error_count = 0
    timeout_count = 0
    total_tests = 0

    print("Testing collection status...")
    for i, test_file in enumerate(test_files):
        relative_path = test_file.relative_to(PROJECT_ROOT)
        print(f"[{i+1:3d}/{len(test_files)}] {relative_path}", end=" ... ")

        result = test_collection_status(test_file)
        results[relative_path] = result

        if result['status'] == 'SUCCESS':
            success_count += 1
            total_tests += result['collected_count']
            print(f"OK ({result['collected_count']} tests)")
        elif result['status'] == 'TIMEOUT':
            timeout_count += 1
            print("TIMEOUT")
        else:
            error_count += 1
            print(f"ERROR {result['status']}")

    # Summary statistics
    print("\n" + "=" * 80)
    print("SUMMARY STATISTICS")
    print("=" * 80)

    total_files = len(test_files)
    success_rate = (success_count / total_files * 100) if total_files > 0 else 0

    print(f"Total test files: {total_files}")
    print(f"Successfully collected: {success_count}")
    print(f"Collection errors: {error_count}")
    print(f"Timeouts: {timeout_count}")
    print(f"Collection success rate: {success_rate:.1f}%")
    print(f"Total tests discovered: {total_tests}")
    print()

    # Status breakdown
    if success_rate >= 80:
        print("SUCCESS: Test discovery rate exceeds 80% target!")
    elif success_rate >= 60:
        print("WARNING: Test discovery rate is below 80% but above 60%")
    else:
        print("CRITICAL: Test discovery rate is below 60%")

    print()

    # Error analysis
    if error_count > 0:
        print("=" * 80)
        print("ERROR ANALYSIS")
        print("=" * 80)

        error_categories = {}
        for file_path, result in results.items():
            if result['status'] != 'SUCCESS':
                for error in result['errors']:
                    # Categorize errors
                    if 'ImportError' in error or 'ModuleNotFoundError' in error:
                        category = 'Import Errors'
                    elif 'SyntaxError' in error:
                        category = 'Syntax Errors'
                    elif 'UnicodeDecodeError' in error or 'UnicodeError' in error:
                        category = 'Encoding Errors'
                    elif 'TypeError' in error:
                        category = 'Type Errors'
                    else:
                        category = 'Other Errors'

                    if category not in error_categories:
                        error_categories[category] = []
                    error_categories[category].append((file_path, error))

        for category, errors in error_categories.items():
            print(f"\n{category} ({len(errors)} files):")
            for file_path, error in errors[:5]:  # Show first 5
                print(f"  - {file_path}: {error}")
            if len(errors) > 5:
                print(f"    ... and {len(errors) - 5} more")

    # Recommendations
    print("\n" + "=" * 80)
    print("RECOMMENDATIONS")
    print("=" * 80)

    if success_rate < 80:
        print("To improve test discovery:")
        print("1. Fix import errors by ensuring proper sys.path configuration")
        print("2. Address syntax errors in test files")
        print("3. Fix encoding issues (use UTF-8)")
        print("4. Review and fix type errors")
        print("5. Consider adding pytest markers for problematic tests")

    print(f"6. Run: python -m pytest --collect-only -q tests/ | grep 'collected'")
    print(f"7. Use: python -m pytest -k 'test_' --collect-only tests/")

    return success_rate >= 80

if __name__ == "__main__":
    success = generate_report()
    sys.exit(0 if success else 1)