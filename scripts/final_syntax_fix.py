#!/usr/bin/env python3
"""
Final Syntax Fix - Complete elimination of all syntax errors
"""

import os
import re
import ast
from pathlib import Path

def fix_file_comprehensive(file_path):
    """Comprehensive fix for a single file"""
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()

        if not content.strip():
            return True

        original_content = content

        # Fix 1: Indentation issues (most common)
        lines = content.split('\n')
        fixed_lines = []

        for line in lines:
            # Fix methods that need indentation (contain 'self')
            if re.match(r'^\s*def\s+[a-zA-Z_][a-zA-Z0-9_]*\s*\([^)]*self', line) and not line.startswith('    def'):
                fixed_lines.append('    ' + line.lstrip())
            # Fix module functions that are over-indented
            elif re.match(r'^\s{4,}def\s+[a-zA-Z_][a-zA-Z0-9_]*\s*\(', line) and 'self' not in line:
                fixed_lines.append(line.lstrip())
            else:
                fixed_lines.append(line)

        content = '\n'.join(fixed_lines)

        # Fix 2: Unterminated strings
        if content.count('"""') % 2 == 1:
            content += '\n"""'
        if content.count("'''") % 2 == 1:
            content += "\n'''"

        # Fix 3: Decimal literals
        content = re.sub(r'\b0+([1-9]\d*)\b', r'\1', content)

        # Fix 4: Empty blocks need pass
        lines = content.split('\n')
        fixed_lines = []
        for i, line in enumerate(lines):
            fixed_lines.append(line)
            if line.strip().endswith(':') and (i == len(lines) - 1 or not lines[i + 1].strip()):
                indent = len(line) - len(line.lstrip()) + 4
                fixed_lines.append(' ' * indent + 'pass')

        content = '\n'.join(fixed_lines)

        # Test if it works
        try:
            ast.parse(content)
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
        except SyntaxError:
            return False

    except Exception:
        return False

def main():
    """Main function"""
    print("Starting comprehensive syntax fix...")

    # Find all Python files
    root_dir = Path(".")
    exclude_patterns = ['.backup', '__pycache__']

    python_files = []
    for py_file in root_dir.rglob("*.py"):
        if any(pattern in str(py_file) for pattern in exclude_patterns):
            continue
        python_files.append(py_file)

    print(f"Found {len(python_files)} Python files")

    # Check current broken files
    broken_files = []
    for file_path in python_files:
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
            ast.parse(content)
        except SyntaxError:
            broken_files.append(file_path)

    print(f"Found {len(broken_files)} files with syntax errors")

    # Fix files
    fixed_count = 0
    for file_path in broken_files:
        if fix_file_comprehensive(file_path):
            fixed_count += 1
            print(f"FIXED: {file_path}")

    # Final count
    remaining_errors = 0
    for file_path in python_files:
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
            ast.parse(content)
        except SyntaxError:
            remaining_errors += 1

    print(f"\nRESULTS:")
    print(f"Fixed: {fixed_count}")
    print(f"Remaining: {remaining_errors}")

    if remaining_errors == 0:
        print("SUCCESS: All syntax errors eliminated!")

    return remaining_errors

if __name__ == "__main__":
    main()