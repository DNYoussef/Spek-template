#!/usr/bin/env python3
"""
Surgical Fix for Malformed NASA Rule 10 Assertions
Removes inline console.assert() statements that broke TypeScript syntax
"""

import re
import os
import sys
from pathlib import Path

# Regex patterns for malformed assertions
PATTERNS = [
    # Pattern 1: After function signatures/constructors
    (
        r'\)\s*console\.assert\([^;]+\);\s*console\.assert\(Date\.now\(\)\s*>\s*0[^;]+\);\s*\{',
        ') {'
    ),
    # Pattern 2: After control structures (for, while, if)
    (
        r'(for|while|if)\s*\([^)]+\)\s*console\.assert\([^;]+\);\s*console\.assert\(Date\.now\(\)\s*>\s*0[^;]+\);\s*\{',
        r'\1 (\2) {'
    ),
    # Pattern 3: Constructor default parameters with WARNING comment
    (
        r'=\s*\{[^}]*\/\/\s*WARNING:[^}]+\}\)\s*console\.assert\([^;]+\);\s*console\.assert\(Date\.now\(\)[^;]+\);\s*\{',
        '= {}) {'
    ),
]

def fix_file(file_path):
    """Fix malformed assertions in a single file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        original_content = content
        total_fixes = 0

        # Apply each pattern
        for pattern, replacement in PATTERNS:
            matches = re.findall(pattern, content)
            if matches:
                fix_count = len(matches)
                total_fixes += fix_count
                content = re.sub(pattern, replacement, content)

        # Write back if changes were made
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            return total_fixes

        return 0

    except Exception as e:
        print(f"Error processing {file_path}: {e}", file=sys.stderr)
        return 0

def main():
    print("=== Malformed Assertion Surgical Fix ===\n")

    # Find all TypeScript files (exclude node_modules)
    src_dir = Path("src")
    if not src_dir.exists():
        print("Error: src/ directory not found")
        sys.exit(1)

    ts_files = list(src_dir.rglob("*.ts"))
    ts_files = [f for f in ts_files if "node_modules" not in str(f)]

    print(f"Found {len(ts_files)} TypeScript files\n")

    total_fixes = 0
    files_modified = 0

    # Process files with progress updates
    for i, file_path in enumerate(ts_files, 1):
        fixes = fix_file(file_path)
        if fixes > 0:
            files_modified += 1
            total_fixes += fixes
            print(f"✓ {file_path}: {fixes} fixes")

        # Progress update every 100 files
        if i % 100 == 0:
            print(f"\nProgress: {i}/{len(ts_files)} files processed\n")

    print(f"\n=== Fix Complete ===")
    print(f"Files scanned: {len(ts_files)}")
    print(f"Files modified: {files_modified}")
    print(f"Total fixes applied: {total_fixes}")
    print(f"\nRun 'npx tsc --noEmit' to verify error reduction")

if __name__ == "__main__":
    main()