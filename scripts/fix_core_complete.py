#!/usr/bin/env python3
"""Complete fix for analyzer/core.py"""

import re

def fix_core_complete():
    """Fix ALL indentation issues in analyzer/core.py"""
    file_path = "analyzer/core.py"

    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Fix ALL method indentation issues by ensuring:
    # 1. Methods with 'self' parameter are indented (part of class)
    # 2. Functions without 'self' are at module level (not indented)

    lines = content.split('\n')
    fixed_lines = []

    for line in lines:
        # Fix methods that should be indented (contain 'self' parameter)
        if re.match(r'^\s*def\s+[a-zA-Z_][a-zA-Z0-9_]*\([^)]*self', line) and not line.startswith('    def'):
            fixed_lines.append('    ' + line.lstrip())
        # Fix module-level functions that are over-indented
        elif re.match(r'^\s{4,}def\s+[a-zA-Z_][a-zA-Z0-9_]*\(', line) and 'self' not in line:
            fixed_lines.append(line.lstrip())
        else:
            fixed_lines.append(line)

    content = '\n'.join(fixed_lines)

    # Write back
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

    print("Fixed all indentation issues in analyzer/core.py")

if __name__ == "__main__":
    fix_core_complete()