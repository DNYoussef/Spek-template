#!/usr/bin/env python3
"""Fix indentation and syntax errors in ci_cd_accelerator.py"""

import re

def fix_file():
    """Fix the ci_cd_accelerator.py file."""
    filepath = "analyzer/performance/ci_cd_accelerator.py"

    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    fixed_lines = []
    in_class = False
    in_method = False
    base_indent = 0

    for i, line in enumerate(lines):
        # Remove any leading spaces before class definitions
        if line.strip().startswith('class ') and not in_class:
            fixed_lines.append(line.lstrip())
            in_class = True
            base_indent = 0
        # Fix enum entries with wrong indentation
        elif line.strip() and not line[0].isspace() and in_class and '=' in line:
            # This is likely an enum entry that lost indentation
            fixed_lines.append('    ' + line.lstrip())
        # Fix method definitions
        elif line.strip().startswith('def '):
            # Count current indentation
            current_indent = len(line) - len(line.lstrip())
            if in_class and current_indent < 4:
                # Method inside class needs at least 4 spaces
                fixed_lines.append('    ' + line.lstrip())
                in_method = True
            else:
                fixed_lines.append(line)
                in_method = current_indent > 0
        # Fix docstrings
        elif line.strip().startswith('"""'):
            if in_method:
                fixed_lines.append('        ' + line.lstrip())
            elif in_class:
                fixed_lines.append('    ' + line.lstrip())
            else:
                fixed_lines.append(line)
        # Normal line
        else:
            fixed_lines.append(line)

        # Reset in_class if we hit a top-level definition
        if line.strip() and not line[0].isspace() and not line.strip().startswith('#'):
            if not line.strip().startswith('class '):
                in_class = False

    # Write fixed content
    with open(filepath, 'w', encoding='utf-8') as f:
        f.writelines(fixed_lines)

    print(f"Fixed {filepath}")
    return True

if __name__ == "__main__":
    fix_file()