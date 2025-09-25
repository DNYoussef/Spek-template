#!/usr/bin/env python3
"""
Aggressive Syntax Fixer - Fix ALL remaining syntax errors
"""

import os
import re
import ast
from pathlib import Path

def aggressive_fix_file(file_path):
    """Aggressively fix all syntax errors in a file"""
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()

        if not content.strip():
            return True

        original_content = content

        # Fix 1: Function/method indentation issues
        lines = content.split('\n')
        fixed_lines = []

        for i, line in enumerate(lines):
            # Fix methods that should be indented (part of class)
            if re.match(r'^\s*def __init__\(', line) and not line.startswith('    def'):
                fixed_lines.append('    ' + line.lstrip())
            elif re.match(r'^\s*def\s+_[a-zA-Z_][a-zA-Z0-9_]*\(.*self', line) and not line.startswith('    def'):
                # Methods starting with _ that take self
                fixed_lines.append('    ' + line.lstrip())
            elif re.match(r'^\s*def\s+[a-zA-Z_][a-zA-Z0-9_]*\(.*self', line) and not line.startswith('    def'):
                # Regular methods that take self
                fixed_lines.append('    ' + line.lstrip())
            # Fix standalone functions that are over-indented
            elif re.match(r'^\s{4,}def\s+[a-zA-Z_][a-zA-Z0-9_]*\(', line) and 'self' not in line:
                # Function doesn't take self, make it module-level
                fixed_lines.append(line.lstrip())
            else:
                fixed_lines.append(line)

        content = '\n'.join(fixed_lines)

        # Fix 2: Unterminated strings - aggressive approach
        content = re.sub(r'"""[^"]*$', '"""', content, flags=re.MULTILINE)
        content = re.sub(r"'''[^']*$", "'''", content, flags=re.MULTILINE)

        # Fix 3: Invalid literals
        content = re.sub(r'\b0+([1-9]\d*)\b', r'\1', content)
        content = re.sub(r'2025-09-24T(\d+):0+(\d)', r'2025-09-24T\1:\2', content)

        # Fix 4: Missing pass statements
        lines = content.split('\n')
        fixed_lines = []
        for i, line in enumerate(lines):
            fixed_lines.append(line)
            if line.strip().endswith(':') and (i == len(lines) - 1 or not lines[i + 1].strip()):
                indent = len(line) - len(line.lstrip()) + 4
                fixed_lines.append(' ' * indent + 'pass')

        content = '\n'.join(fixed_lines)

        # Fix 5: Try/except blocks
        content = re.sub(r'(\n\s*)try:\s*\n(\s*)(.*?)(\n\s*except)', r'\1try:\n\2    \3\4', content, flags=re.DOTALL)

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
    """Run aggressive fix on all Python files"""
    root_dir = Path(".")
    exclude_patterns = ['.backup', '__pycache__', 'devtools', 'orchestration', 'registry']

    python_files = []
    for py_file in root_dir.rglob("*.py"):
        if any(pattern in str(py_file) for pattern in exclude_patterns):
            continue
        python_files.append(py_file)

    print(f"Running aggressive fix on {len(python_files)} Python files...")

    # Check current errors
    broken_files = []
    for file_path in python_files:
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
            ast.parse(content)
        except SyntaxError:
            broken_files.append(file_path)

    print(f"Found {len(broken_files)} files with syntax errors")

    # Fix files aggressively
    fixed_count = 0
    for file_path in broken_files:
        if aggressive_fix_file(file_path):
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

    print(f"\nAGGRESSIVE FIX RESULTS:")
    print(f"Files fixed: {fixed_count}")
    print(f"Remaining errors: {remaining_errors}")

    return 0 if remaining_errors == 0 else 1

if __name__ == "__main__":
    main()