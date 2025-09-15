#!/usr/bin/env python3
"""
Test script to verify connascence detection is working
"""

import ast
import sys
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

def manual_connascence_check(file_path):
    """Manually check for obvious connascence issues"""
    issues = []

    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
        lines = content.split('\n')

    # Check for magic numbers (Connascence of Meaning)
    for i, line in enumerate(lines, 1):
        # Look for numeric literals that aren't 0, 1, or -1
        if any(num in line for num in ['86400', '3600', '1000', '10000', '60', '100']):
            if not line.strip().startswith('#'):
                issues.append(f"CoM (Magic Number): Line {i}: {line.strip()[:50]}")

    # Check for position-dependent function calls (Connascence of Position)
    try:
        tree = ast.parse(content)
        for node in ast.walk(tree):
            if isinstance(node, ast.Call):
                # Check for calls with many positional arguments
                if len(node.args) > 3:
                    issues.append(f"CoP (Position): Line {node.lineno}: Function call with {len(node.args)} positional args")
    except:
        pass

    # Check for string literals used as type indicators (Connascence of Type)
    for i, line in enumerate(lines, 1):
        if 'isinstance(' in line or 'type(' in line:
            issues.append(f"CoT (Type): Line {i}: Type checking detected")

    # Check for hardcoded values (Connascence of Value)
    for i, line in enumerate(lines, 1):
        if any(val in line for val in ['"localhost"', '"127.0.0.1"', '"admin"', '"password"']):
            issues.append(f"CoV (Value): Line {i}: Hardcoded value")

    return issues

def scan_directory(directory):
    """Scan all Python files in directory"""
    dir_path = Path(directory)
    total_issues = 0
    file_count = 0

    print(f"\nScanning {directory} for connascence issues...")
    print("=" * 60)

    for py_file in dir_path.rglob("*.py"):
        if '__pycache__' in str(py_file):
            continue

        file_count += 1
        issues = manual_connascence_check(py_file)

        if issues:
            try:
                rel_path = py_file.relative_to(project_root)
            except:
                rel_path = py_file
            print(f"\n{rel_path}:")
            for issue in issues[:5]:  # Show first 5 issues per file
                print(f"  - {issue}")
            if len(issues) > 5:
                print(f"  ... and {len(issues) - 5} more issues")
            total_issues += len(issues)

    print("\n" + "=" * 60)
    print(f"Summary: Found {total_issues} connascence issues in {file_count} files")
    print(f"Average: {total_issues/file_count:.1f} issues per file")

    return total_issues

if __name__ == "__main__":
    # Test on src directory
    src_issues = scan_directory("src")

    # Test on analyzer directory
    analyzer_issues = scan_directory("analyzer")

    print(f"\nTOTAL CONNASCENCE ISSUES FOUND: {src_issues + analyzer_issues}")
    print("\nWARNING: This is a simplified check. The full analyzer should find many more issues!")
    print("    Types checked: CoM (Magic Numbers), CoP (Position), CoT (Type), CoV (Value)")
    print("    Not checked: CoN (Name), CoA (Algorithm), CoE (Execution), CoI (Identity), CoC (Convention)")