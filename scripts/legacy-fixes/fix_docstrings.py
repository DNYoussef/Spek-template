#!/usr/bin/env python3
"""
Fix unterminated docstrings in Python files caused by Unicode removal.
This script finds files where docstrings start without triple quotes and fixes them.
"""

import os
import re
import sys

def fix_unterminated_docstrings(directory):
    """Fix unterminated docstrings in all Python files in the directory."""
    fixed_files = []

    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith('.py'):
                file_path = os.path.join(root, file)
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        lines = f.readlines()

                    fixed = False
                    new_lines = []

                    for i, line in enumerate(lines):
                        # Look for the pattern: import line followed by blank line, then text, then """
                        if (i < len(lines) - 3 and
                            line.strip().startswith('from ') and
                            i + 1 < len(lines) and lines[i + 1].strip() == '' and
                            i + 2 < len(lines) and lines[i + 2].strip() != '' and
                            not lines[i + 2].strip().startswith('"""') and
                            not lines[i + 2].strip().startswith('#') and
                            i + 3 < len(lines) and '"""' in lines[i + 3:i + 6]):

                            # Found the pattern - add opening triple quotes
                            new_lines.append(line)  # import line
                            new_lines.append('\n')  # blank line
                            new_lines.append('"""\n')  # opening triple quotes
                            fixed = True
                            print(f"Fixed docstring in {file_path} at line {i + 3}")
                        else:
                            new_lines.append(line)

                    if fixed:
                        with open(file_path, 'w', encoding='utf-8') as f:
                            f.writelines(new_lines)
                        fixed_files.append(file_path)

                except Exception as e:
                    print(f"Error processing {file_path}: {e}")
                    continue

    return fixed_files

if __name__ == "__main__":
    analyzer_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'analyzer')
    print(f"Fixing docstrings in: {analyzer_dir}")

    fixed_files = fix_unterminated_docstrings(analyzer_dir)
    print(f"\nFixed {len(fixed_files)} files:")
    for file_path in fixed_files:
        print(f"  - {file_path}")