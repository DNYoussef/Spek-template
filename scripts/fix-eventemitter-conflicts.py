#!/usr/bin/env python3
"""
Fix EventEmitter Property/Method Conflicts (TS2425)
Systematic fix for all cleanup() and initialize() conflicts
"""

import subprocess
import re
from pathlib import Path
from typing import List, Tuple, Set
import sys

def get_eventemitter_conflicts() -> List[Tuple[str, str, str]]:
    """Extract all TS2425 errors from typecheck output."""
    print("[1/5] Running typecheck to identify conflicts...")

    try:
        # Use cmd /c on Windows to find npm
        result = subprocess.run(
            ['cmd', '/c', 'npm', 'run', 'typecheck'],
            capture_output=True,
            text=True,
            timeout=120,
            cwd=str(Path(__file__).parent.parent)
        )

        output = result.stdout + result.stderr
        conflicts = []

        # Pattern: file.ts(line,col): error TS2425: ... 'methodName' ...
        pattern = r"([^(]+)\((\d+),\d+\): error TS2425:.*'(\w+)'"

        for match in re.finditer(pattern, output):
            file_path = match.group(1).strip()
            line_num = match.group(2)
            method_name = match.group(3)

            # Filter to only cleanup and initialize
            if method_name in ['cleanup', 'initialize']:
                conflicts.append((file_path, line_num, method_name))

        return conflicts
    except Exception as e:
        print(f"Error running typecheck: {e}")
        return []

def fix_method_conflict(file_path: str, method_name: str) -> bool:
    """Fix a single method conflict in a file."""
    try:
        path = Path(file_path)
        if not path.exists():
            print(f"  WARNING: File not found: {file_path}")
            return False

        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()

        original_content = content

        # Determine replacement name
        new_method_name = f"{method_name}Component"

        # Pattern 1: async method definition
        # async initialize(...args): Promise<void>
        pattern1 = rf'async\s+{method_name}\s*\('
        replacement1 = f'async {new_method_name}('
        content = re.sub(pattern1, replacement1, content)

        # Pattern 2: regular method definition
        # initialize(): void
        pattern2 = rf'(\s+){method_name}\s*\('
        replacement2 = rf'\1{new_method_name}('
        content = re.sub(pattern2, replacement2, content)

        # Pattern 3: decorator references
        # @nasaCompliant('FSMValidationSuite.initialize')
        pattern3 = rf"@nasaCompliant\('([^']+)\.{method_name}'\)"
        replacement3 = rf"@nasaCompliant('\1.{new_method_name}')"
        content = re.sub(pattern3, replacement3, content)

        # Pattern 4: method calls
        # this.initialize() or facade.initialize()
        pattern4 = rf'(\w+)\.{method_name}\s*\('
        replacement4 = rf'\1.{new_method_name}('
        content = re.sub(pattern4, replacement4, content)

        if content != original_content:
            with open(path, 'w', encoding='utf-8') as f:
                f.write(content)
            return True

        return False

    except Exception as e:
        print(f"  ERROR: Error fixing {file_path}: {e}")
        return False

def main():
    """Fix all EventEmitter conflicts systematically."""
    print("=" * 60)
    print("EventEmitter Conflict Fixer - TIER 0.1 ROOT CAUSE FIX")
    print("=" * 60)

    # Get all conflicts
    conflicts = get_eventemitter_conflicts()

    if not conflicts:
        print("\nSUCCESS: No TS2425 conflicts found!")
        return 0

    print(f"\n[2/5] Found {len(conflicts)} EventEmitter conflicts")

    # Group by file
    files_to_fix = {}
    for file_path, line_num, method_name in conflicts:
        if file_path not in files_to_fix:
            files_to_fix[file_path] = set()
        files_to_fix[file_path].add(method_name)

    print(f"[3/5] Conflicts in {len(files_to_fix)} unique files")

    # Count by method type
    cleanup_count = sum(1 for _, _, m in conflicts if m == 'cleanup')
    initialize_count = sum(1 for _, _, m in conflicts if m == 'initialize')
    print(f"  - cleanup: {cleanup_count} conflicts")
    print(f"  - initialize: {initialize_count} conflicts")

    # Fix each file
    print(f"\n[4/5] Fixing conflicts...")
    fixed_files = 0
    fixed_methods = 0

    for file_path, methods in files_to_fix.items():
        rel_path = Path(file_path).name
        print(f"\n  {rel_path}")

        file_fixed = False
        for method in methods:
            if fix_method_conflict(file_path, method):
                print(f"    FIXED: {method}() -> {method}Component()")
                fixed_methods += 1
                file_fixed = True
            else:
                print(f"    WARNING: Could not fix {method}()")

        if file_fixed:
            fixed_files += 1

    print(f"\n[5/5] Summary:")
    print(f"  Files fixed: {fixed_files}/{len(files_to_fix)}")
    print(f"  Methods fixed: {fixed_methods}/{len(conflicts)}")

    if fixed_files == len(files_to_fix):
        print("\nSUCCESS: All EventEmitter conflicts fixed!")
        return 0
    else:
        print(f"\nWARNING: {len(files_to_fix) - fixed_files} files still need manual fixes")
        return 1

if __name__ == '__main__':
    sys.exit(main())