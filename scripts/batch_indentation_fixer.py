#!/usr/bin/env python3
"""
Batch Indentation Fixer - Fix function/class indentation issues globally
"""

import os
import re
import ast
from pathlib import Path

def fix_function_indentation_global(content):
    """Fix all function indentation issues in content"""
    lines = content.split('\n')
    fixed_lines = []

    for line in lines:
        # Fix functions that are over-indented (should be at module level)
        if re.match(r'^\s{4,}def\s+[a-zA-Z_][a-zA-Z0-9_]*\s*\(', line):
            # Check if this is a method inside a class or a misplaced function
            function_name = re.search(r'def\s+([a-zA-Z_][a-zA-Z0-9_]*)', line).group(1)

            # If function name starts with _ and is heavily indented, make it module-level
            if function_name.startswith('_') and len(line) - len(line.lstrip()) > 4:
                fixed_lines.append(line.lstrip())
                continue

        # Fix class definitions that are over-indented
        if re.match(r'^\s{4,}class\s+[a-zA-Z_][a-zA-Z0-9_]*', line):
            class_name = re.search(r'class\s+([a-zA-Z_][a-zA-Z0-9_]*)', line).group(1)
            # Make top-level classes module-level
            if not class_name.startswith('_'):
                fixed_lines.append(line.lstrip())
                continue

        fixed_lines.append(line)

    return '\n'.join(fixed_lines)

def fix_file_batch(file_path):
    """Fix a single file's indentation issues"""
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()

        if not content.strip():
            return True

        original_content = content
        content = fix_function_indentation_global(content)

        # Only apply if it actually fixes syntax
        try:
            ast.parse(content)
            if content != original_content:
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(content)
                return True
        except SyntaxError:
            return False

    except Exception:
        return False

    return False

def main():
    """Fix all Python files with indentation issues"""
    root_dir = Path(".")
    exclude_patterns = ['.backup', '__pycache__', 'devtools', 'orchestration', 'registry']

    # Find all Python files
    python_files = []
    for py_file in root_dir.rglob("*.py"):
        if any(pattern in str(py_file) for pattern in exclude_patterns):
            continue
        python_files.append(py_file)

    print(f"Processing {len(python_files)} Python files for indentation fixes...")

    # Check which files currently have syntax errors
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
        if fix_file_batch(file_path):
            fixed_count += 1
            print(f"Fixed indentation in {file_path}")

    # Check remaining errors
    remaining_errors = 0
    for file_path in python_files:
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
            ast.parse(content)
        except SyntaxError:
            remaining_errors += 1

    print(f"\nBatch indentation fix results:")
    print(f"Files fixed: {fixed_count}")
    print(f"Remaining syntax errors: {remaining_errors}")

    return 0 if remaining_errors < 100 else 1

if __name__ == "__main__":
    main()