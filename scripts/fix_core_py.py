#!/usr/bin/env python3
"""Fix analyzer/core.py specifically"""

import re

def fix_core_py():
    """Fix all indented function definitions in core.py"""
    file_path = "analyzer/core.py"

    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Fix all function definitions that start with 4+ spaces
    content = re.sub(r'^    def (_[a-zA-Z_][a-zA-Z0-9_]*)\(', r'def \1(', content, flags=re.MULTILINE)

    # Write back
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

    print("Fixed function definitions in analyzer/core.py")

if __name__ == "__main__":
    fix_core_py()