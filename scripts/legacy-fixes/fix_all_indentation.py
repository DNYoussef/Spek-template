#!/usr/bin/env python3
"""
More aggressive indentation fixer that handles standalone functions
that should be module-level but are incorrectly indented.
"""

import os
import re
import sys
import ast

def fix_module_level_functions(file_path):
    """Fix functions that should be at module level but are indented."""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    lines = content.splitlines()
    fixed_lines = []
    fixed = False

    for i, line in enumerate(lines):
        # Look for functions that start with 4+ spaces that might be module-level
        if (line.startswith('    def ') and
            not line.startswith('        def ') and  # Not already properly nested
            i > 0 and not any(  # Not actually a class method
                prev_line.strip().startswith('class ') and prev_line.rstrip().endswith(':')
                for j in range(max(0, i-10), i)  # Look back 10 lines
                if not lines[j].strip().startswith('#') and lines[j].strip()  # Ignore comments/empty
            )):

            # Remove the extra indentation
            fixed_lines.append(line[4:])
            fixed = True
            print(f"Fixed function indentation in {file_path} at line {i + 1}: {line.strip()}")
            continue

        fixed_lines.append(line)

    if fixed:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write('\n'.join(fixed_lines))
        return True
    return False

def validate_python_syntax(file_path):
    """Check if a Python file has valid syntax."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        ast.parse(content)
        return True, None
    except SyntaxError as e:
        return False, str(e)

def fix_all_indentation_in_directory(directory):
    """Fix indentation in all Python files in the directory."""
    fixed_files = []
    error_files = []

    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith('.py'):
                file_path = os.path.join(root, file)
                try:
                    # First check if syntax is valid
                    valid, error = validate_python_syntax(file_path)
                    if not valid:
                        print(f"Syntax error in {file_path}: {error}")
                        error_files.append((file_path, error))

                        # Try to fix it
                        if fix_module_level_functions(file_path):
                            fixed_files.append(file_path)

                            # Recheck syntax
                            valid, error = validate_python_syntax(file_path)
                            if valid:
                                print(f"  -> Fixed syntax error in {file_path}")
                            else:
                                print(f"  -> Still has syntax error: {error}")
                except Exception as e:
                    print(f"Error processing {file_path}: {e}")
                    error_files.append((file_path, str(e)))
                    continue

    return fixed_files, error_files

if __name__ == "__main__":
    analyzer_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'analyzer')
    print(f"Fixing all indentation issues in: {analyzer_dir}")

    fixed_files, error_files = fix_all_indentation_in_directory(analyzer_dir)

    print(f"\nFixed indentation in {len(fixed_files)} files:")
    for file_path in fixed_files:
        print(f"  - {file_path}")

    print(f"\nFiles with remaining errors ({len(error_files)}):")
    for file_path, error in error_files[:10]:  # Show first 10 errors
        print(f"  - {os.path.basename(file_path)}: {error}")

    if len(error_files) > 10:
        print(f"  ... and {len(error_files) - 10} more")