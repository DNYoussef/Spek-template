#!/usr/bin/env python3
"""
Manual Critical Fixes - Fix the most critical syntax errors by pattern
"""

import os
import re
import ast
from pathlib import Path

def fix_critical_files():
    """Fix critical files manually"""
    fixes_applied = 0

    # Fix analyzer/core.py - indentation issue
    core_path = Path("analyzer/core.py")
    if core_path.exists():
        with open(core_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Fix the indentation of the function at line 43
        lines = content.split('\n')
        for i, line in enumerate(lines):
            if line.strip().startswith('def log_import(') and not line.startswith('        def'):
                lines[i] = '        ' + line.lstrip()
            elif line.strip().startswith('def get_stats(') and not line.startswith('        def'):
                lines[i] = '        ' + line.lstrip()
            elif line.strip().startswith('def get_availability_summary(') and not line.startswith('        def'):
                lines[i] = '        ' + line.lstrip()

        content = '\n'.join(lines)

        try:
            ast.parse(content)
            with open(core_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Fixed {core_path}")
            fixes_applied += 1
        except SyntaxError as e:
            print(f"Could not fix {core_path}: {e}")

    # Fix decimal literal issues globally
    root_dir = Path(".")
    files_with_decimal_issues = []

    for py_file in root_dir.rglob("*.py"):
        if any(pattern in str(py_file) for pattern in ['.backup', '__pycache__']):
            continue

        try:
            with open(py_file, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()

            # Check if file has decimal literal issues
            if re.search(r'\b0+[1-9]', content):
                files_with_decimal_issues.append(py_file)

        except Exception:
            continue

    # Fix decimal literals
    for file_path in files_with_decimal_issues:
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()

            # Fix leading zeros in numbers
            content = re.sub(r'\b0+([1-9]\d*)\b', r'\1', content)

            # Fix specific date/time patterns
            content = re.sub(r'2025-9-24T(\d+):0+(\d+):0+(\d+)', r'2025-9-24T\1:\2:\3', content)
            content = re.sub(r'(\|\s*)0+(\d+)\.0+(\d)', r'\1\2.\3', content)

            try:
                # Only write if it parses correctly now
                ast.parse(content)
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f"Fixed decimal literals in {file_path}")
                fixes_applied += 1
            except SyntaxError:
                # If still broken, don't write
                pass

        except Exception as e:
            print(f"Error fixing {file_path}: {e}")

    # Fix unterminated triple quotes
    for py_file in root_dir.rglob("*.py"):
        if any(pattern in str(py_file) for pattern in ['.backup', '__pycache__']):
            continue

        try:
            with open(py_file, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()

            # Quick check for syntax error
            try:
                ast.parse(content)
                continue  # Already valid
            except SyntaxError as e:
                if 'unterminated triple-quoted string' not in str(e):
                    continue  # Different error

            # Try to fix unterminated triple quotes
            lines = content.split('\n')
            in_triple = False
            quote_char = None

            for i, line in enumerate(lines):
                if not in_triple:
                    if '"""' in line and line.count('"""') % 2 == 1:
                        in_triple = True
                        quote_char = '"""'
                    elif "'''" in line and line.count("'''") % 2 == 1:
                        in_triple = True
                        quote_char = "'''"
                else:
                    if quote_char in line:
                        in_triple = False
                        quote_char = None

            # If still in triple quote at end, close it
            if in_triple and quote_char:
                lines.append(quote_char)
                content = '\n'.join(lines)

                try:
                    ast.parse(content)
                    with open(py_file, 'w', encoding='utf-8') as f:
                        f.write(content)
                    print(f"Fixed unterminated triple quote in {py_file}")
                    fixes_applied += 1
                except SyntaxError:
                    pass

        except Exception:
            continue

    return fixes_applied

def main():
    print("Applying critical syntax fixes...")
    fixes = fix_critical_files()
    print(f"Applied {fixes} fixes")

    # Check remaining errors
    root_dir = Path(".")
    remaining_errors = 0

    for py_file in root_dir.rglob("*.py"):
        if any(pattern in str(py_file) for pattern in ['.backup', '__pycache__']):
            continue

        try:
            with open(py_file, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
            ast.parse(content)
        except SyntaxError:
            remaining_errors += 1

    print(f"Remaining syntax errors: {remaining_errors}")

if __name__ == "__main__":
    main()