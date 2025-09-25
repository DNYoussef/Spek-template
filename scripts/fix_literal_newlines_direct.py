#!/usr/bin/env python3
"""Fix quadruple quotes and indentation in Python files."""

from pathlib import Path
import os
import sys

def fix_file(filepath):
    """Fix a single file's indentation issues."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        # Fix quadruple quotes first
        fixed = content.replace('""""', '"""')
        
        # If changes were made, save the file
        if fixed != content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(fixed)
            print(f"[FIXED] Quadruple quotes in {filepath}")
            return True
        return False
    except Exception as e:
        print(f"[ERROR] {filepath}: {e}")
        return False

def main():
    """Fix all Python files."""
    files_to_fix = [
        "analyzer/performance/ci_cd_accelerator.py",
        "scripts/performance_monitor.py",
        "scripts/unicode_removal_linter.py"
    ]
    
    fixed_count = 0
    for filepath in files_to_fix:
        if os.path.exists(filepath):
            if fix_file(filepath):
                fixed_count += 1
    
    print(f"\nFixed {fixed_count} files")
    return 0

if __name__ == "__main__":
    sys.exit(main())
