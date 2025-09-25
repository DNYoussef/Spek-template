#!/usr/bin/env python3
"""
Fix method indentation in Python files that should be class methods.
This script finds methods that start at column 0 after a class definition and indents them.
"""

import os
import re
import sys

def fix_method_indentation(file_path):
    """Fix method indentation in a single file."""
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    fixed_lines = []
    in_class = False
    class_indent = 0
    fixed = False

    for i, line in enumerate(lines):
        # Detect class definitions
        if line.strip().startswith('class ') and line.rstrip().endswith(':'):
            in_class = True
            class_indent = len(line) - len(line.lstrip())
            fixed_lines.append(line)
            continue

        # If we're in a class and find a method at column 0, indent it
        if (in_class and
            line.startswith('def ') and
            not line.startswith('    def ')):  # Not already indented

            # Add proper indentation (4 spaces for method)
            fixed_lines.append('    ' + line)
            fixed = True
            print(f"Fixed method indentation in {file_path} at line {i + 1}: {line.strip()}")
            continue

        # If we encounter another class or top-level function, exit class context
        if ((line.startswith('class ') and line.rstrip().endswith(':')) or
            (line.startswith('def ') and not line.startswith('    def '))):
            if not line.startswith('class '):
                in_class = False

        # If we encounter a line with content at column 0 that's not a comment or import
        # and we're in a class, we might be out of the class now
        if (in_class and
            line.strip() and
            not line.startswith(' ') and
            not line.startswith('#') and
            not line.startswith('from ') and
            not line.startswith('import ') and
            not line.startswith('def ') and
            not line.startswith('class ')):
            in_class = False

        fixed_lines.append(line)

    if fixed:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.writelines(fixed_lines)
        return True
    return False

def fix_indentation_in_directory(directory):
    """Fix indentation in all Python files in the directory."""
    fixed_files = []

    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith('.py'):
                file_path = os.path.join(root, file)
                try:
                    if fix_method_indentation(file_path):
                        fixed_files.append(file_path)
                except Exception as e:
                    print(f"Error processing {file_path}: {e}")
                    continue

    return fixed_files

if __name__ == "__main__":
    analyzer_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'analyzer')
    print(f"Fixing method indentation in: {analyzer_dir}")

    fixed_files = fix_indentation_in_directory(analyzer_dir)
    print(f"\nFixed indentation in {len(fixed_files)} files:")
    for file_path in fixed_files:
        print(f"  - {file_path}")