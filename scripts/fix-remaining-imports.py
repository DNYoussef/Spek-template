#!/usr/bin/env python3
"""Fix remaining type imports to use ~types path mapping"""

import os
import re
from pathlib import Path

def fix_imports_in_file(file_path):
    """Fix imports in a single file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        original = content

        # Fix all variations of relative types/ imports
        patterns = [
            (r"from\s+['\"]\.\.+/types/([^'\"]+)['\"]", r"from '~types/\1'"),
            (r"from\s+['\"]types/([^'\"]+)['\"]", r"from '~types/\1'"),
        ]

        for pattern, replacement in patterns:
            content = re.sub(pattern, replacement, content)

        if content != original:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            return True

    except Exception as e:
        print(f"Error in {file_path}: {e}")

    return False

def main():
    src_dir = Path('src')
    fixed_count = 0

    for ts_file in src_dir.rglob('*.ts'):
        if fix_imports_in_file(ts_file):
            fixed_count += 1
            print(f"Fixed: {ts_file}")

    print(f"\nTotal files fixed: {fixed_count}")

if __name__ == '__main__':
    main()
