#!/usr/bin/env python3
"""
Fix all remaining EventEmitter initialize/cleanup conflicts across the codebase.
Renames initialize() -> initializeComponent() and cleanup() -> destroy() in all affected classes.
"""

import re
import subprocess
from pathlib import Path
from typing import List, Tuple

PROJECT_ROOT = Path(__file__).parent.parent

def get_ts2425_files() -> List[str]:
    """Get list of files with TS2425 EventEmitter conflicts."""
    result = subprocess.run(
        ['cmd', '/c', 'npm', 'run', 'typecheck'],
        capture_output=True,
        text=True,
        timeout=120,
        cwd=PROJECT_ROOT
    )

    output = result.stdout + result.stderr
    files = set()

    # Extract unique file paths
    pattern = r'(src/[^(]+\.ts)\(\d+,\d+\): error TS2425:'
    for match in re.finditer(pattern, output):
        file_path = match.group(1).strip()
        files.add(file_path)

    return sorted(files)

def fix_initialize_method(content: str) -> Tuple[str, int]:
    """Fix initialize() method conflicts. Returns (fixed_content, change_count)."""
    changes = 0

    # Pattern 1: async initialize() method declarations
    pattern1 = r'(\s+)(async\s+)?initialize\s*\('
    def replace1(m):
        nonlocal changes
        changes += 1
        indent = m.group(1)
        async_kw = m.group(2) or ''
        return f'{indent}{async_kw}initializeComponent('

    content = re.sub(pattern1, replace1, content)

    return content, changes

def fix_cleanup_method(content: str) -> Tuple[str, int]:
    """Fix cleanup() method conflicts. Returns (fixed_content, change_count)."""
    changes = 0

    # Pattern: async cleanup() method declarations
    pattern = r'(\s+)(async\s+)?cleanup\s*\('
    def replace(m):
        nonlocal changes
        changes += 1
        indent = m.group(1)
        async_kw = m.group(2) or ''
        return f'{indent}{async_kw}destroy('

    content = re.sub(pattern, replace, content)

    return content, changes

def fix_file(file_path: str) -> Tuple[int, int]:
    """Fix EventEmitter conflicts in a single file. Returns (init_fixes, cleanup_fixes)."""
    full_path = PROJECT_ROOT / file_path

    if not full_path.exists():
        print(f'SKIP: {file_path} (not found)')
        return 0, 0

    try:
        content = full_path.read_text(encoding='utf-8')
    except Exception as e:
        print(f'ERROR reading {file_path}: {e}')
        return 0, 0

    original = content

    # Fix initialize() conflicts
    content, init_fixes = fix_initialize_method(content)

    # Fix cleanup() conflicts
    content, cleanup_fixes = fix_cleanup_method(content)

    if content != original:
        try:
            full_path.write_text(content, encoding='utf-8')
            print(f'FIXED: {file_path} (initialize: {init_fixes}, cleanup: {cleanup_fixes})')
        except Exception as e:
            print(f'ERROR writing {file_path}: {e}')
            return 0, 0
    else:
        print(f'NO CHANGES: {file_path}')

    return init_fixes, cleanup_fixes

def main():
    """Main execution."""
    print('=' * 80)
    print('EventEmitter Conflict Fixer')
    print('=' * 80)

    print('\n[1/3] Finding files with TS2425 errors...')
    files = get_ts2425_files()
    print(f'Found {len(files)} files with EventEmitter conflicts')

    if not files:
        print('\nNo TS2425 conflicts found!')
        return

    print('\n[2/3] Fixing conflicts...')
    total_init = 0
    total_cleanup = 0

    for file_path in files:
        init_fixes, cleanup_fixes = fix_file(file_path)
        total_init += init_fixes
        total_cleanup += cleanup_fixes

    print(f'\n[3/3] Summary')
    print(f'Files processed: {len(files)}')
    print(f'initialize() renamed: {total_init}')
    print(f'cleanup() renamed: {total_cleanup}')
    print(f'Total fixes: {total_init + total_cleanup}')

    print('\n[DONE] Re-run npm run typecheck to verify fixes')

if __name__ == '__main__':
    main()