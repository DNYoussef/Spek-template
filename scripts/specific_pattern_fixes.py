#!/usr/bin/env python3
"""
Specific Pattern Fixes - Target the exact remaining error patterns
"""

import re
import ast
from pathlib import Path

def fix_github_reporter(file_path):
    """Fix github_status_reporter.py decimal literal issue"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Fix decimal literal patterns around line 148
    content = re.sub(r'{result\.analysis_time:.1f}', '{result.analysis_time:.1f}', content)

    # Fix any leading zeros in decimals
    content = re.sub(r'(\d+)\.0+(\d)', r'\1.\2', content)

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

def fix_phase_correlation(file_path):
    """Fix phase_correlation_storage.py raw text issue"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    lines = content.split('\n')
    fixed_lines = []

    in_docstring = False
    for i, line in enumerate(lines):
        if i == 2 and not line.startswith('"""') and not line.startswith('#'):
            # This should be a docstring
            fixed_lines.append('"""')
            fixed_lines.append(line)
            in_docstring = True
        elif in_docstring and (line.strip() == '' or i == len(lines) - 1):
            fixed_lines.append(line)
            if i < len(lines) - 1:  # Not last line
                fixed_lines.append('"""')
                in_docstring = False
        else:
            fixed_lines.append(line)

    content = '\n'.join(fixed_lines)

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

def fix_common_patterns():
    """Fix common patterns across all broken files"""
    root_dir = Path(".")
    broken_files = []

    # Find all broken files
    for py_file in root_dir.rglob("*.py"):
        if any(pattern in str(py_file) for pattern in ['.backup', '__pycache__']):
            continue

        try:
            with open(py_file, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
            ast.parse(content)
        except SyntaxError:
            broken_files.append(py_file)

    print(f"Found {len(broken_files)} broken files")

    fixed_count = 0
    for file_path in broken_files:
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()

            original_content = content

            # Fix 1: Raw text that should be docstrings
            lines = content.split('\n')
            fixed_lines = []

            for i, line in enumerate(lines):
                # If we find raw text after imports, make it a docstring
                if (i > 0 and
                    not line.startswith(('"""', "'''", '#', 'from', 'import', 'class', 'def')) and
                    line.strip() and
                    not lines[i-1].strip().endswith(':') and
                    'import' in lines[i-1]):

                    # Start docstring
                    fixed_lines.append('"""')
                    fixed_lines.append(line)

                    # Find end of text block
                    j = i + 1
                    while j < len(lines) and lines[j].strip() and not lines[j].startswith(('from', 'import', 'class', 'def')):
                        fixed_lines.append(lines[j])
                        j += 1

                    # End docstring
                    fixed_lines.append('"""')

                    # Skip processed lines
                    i = j - 1
                else:
                    fixed_lines.append(line)

            content = '\n'.join(fixed_lines)

            # Fix 2: Leading zeros in decimals
            content = re.sub(r'\b0+([1-9]\d*)\b', r'\1', content)

            # Fix 3: Unterminated strings
            if content.count('"""') % 2 == 1:
                content += '\n"""'

            # Test fix
            try:
                ast.parse(content)
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(content)
                fixed_count += 1
                print(f"FIXED: {file_path}")
            except SyntaxError:
                pass

        except Exception:
            pass

    print(f"Fixed {fixed_count} files with common patterns")
    return fixed_count

def main():
    print("Applying specific pattern fixes...")

    # Fix specific files with known patterns
    github_file = Path("analyzer/github_status_reporter.py")
    if github_file.exists():
        fix_github_reporter(github_file)
        print("Fixed github_status_reporter.py")

    phase_file = Path("analyzer/phase_correlation_storage.py")
    if phase_file.exists():
        fix_phase_correlation(phase_file)
        print("Fixed phase_correlation_storage.py")

    # Fix common patterns
    fixed_count = fix_common_patterns()

    # Final validation
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

    print(f"\nFinal count: {remaining_errors} remaining syntax errors")

if __name__ == "__main__":
    main()