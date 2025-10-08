#!/usr/bin/env python3
"""
Fix incorrect import paths for primitives and other type modules.
Corrects relative path depths based on actual file locations.
"""

import re
import subprocess
from pathlib import Path
from typing import List, Tuple, Dict

PROJECT_ROOT = Path(__file__).parent.parent

# Map of incorrect -> correct import paths
PATH_CORRECTIONS = {
    # Primitives imports from src/compliance/ (3 levels deep)
    r"from ['\"]\.\.\/\.\.\/types\/base\/primitives['\"]": "from '../../../types/base/primitives'",
    r"} from ['\"]\.\.\/\.\.\/types\/base\/primitives['\"]": "} from '../../../types/base/primitives'",

    # Compliance types imports from src/compliance/ (3 levels deep)
    r"from ['\"]\.\.\/\.\.\/types\/domains\/compliance-types['\"]": "from '../../../types/compliance-types'",
    r"} from ['\"]\.\.\/\.\.\/types\/domains\/compliance-types['\"]": "} from '../../../types/compliance-types'",
}

def get_ts2305_files() -> List[str]:
    """Get list of files with TS2305 import errors."""
    result = subprocess.run(
        ['cmd', '/c', 'npm', 'run', 'typecheck'],
        capture_output=True,
        text=True,
        timeout=120,
        cwd=PROJECT_ROOT
    )

    output = result.stdout + result.stderr
    files = set()

    # Extract unique file paths with TS2305 errors
    pattern = r'(src/[^(]+\.ts)\(\d+,\d+\): error TS2305:'
    for match in re.finditer(pattern, output):
        file_path = match.group(1).strip()
        files.add(file_path)

    return sorted(files)

def fix_import_paths(file_path: str) -> Tuple[int, Dict[str, int]]:
    """Fix import paths in a single file. Returns (total_fixes, fixes_by_pattern)."""
    full_path = PROJECT_ROOT / file_path

    if not full_path.exists():
        return 0, {}

    try:
        content = full_path.read_text(encoding='utf-8')
    except Exception as e:
        print(f'ERROR reading {file_path}: {e}')
        return 0, {}

    original = content
    fixes_by_pattern = {}

    # Apply all path corrections
    for pattern, replacement in PATH_CORRECTIONS.items():
        matches = len(re.findall(pattern, content))
        if matches > 0:
            content = re.sub(pattern, replacement, content)
            fixes_by_pattern[pattern] = matches

    total_fixes = sum(fixes_by_pattern.values())

    if content != original and total_fixes > 0:
        try:
            full_path.write_text(content, encoding='utf-8')
            print(f'FIXED: {file_path} ({total_fixes} import paths corrected)')
            for pattern, count in fixes_by_pattern.items():
                print(f'  - {count}x: {pattern[:50]}...')
        except Exception as e:
            print(f'ERROR writing {file_path}: {e}')
            return 0, {}
    elif total_fixes == 0:
        # File might have other TS2305 errors not covered by our patterns
        pass

    return total_fixes, fixes_by_pattern

def main():
    """Main execution."""
    print('=' * 80)
    print('Import Path Fixer')
    print('=' * 80)

    print('\n[1/3] Finding files with TS2305 import errors...')
    files = get_ts2305_files()
    print(f'Found {len(files)} files with import errors')

    if not files:
        print('\nNo TS2305 import errors found!')
        return

    print(f'\n[2/3] Fixing import paths in {len(files)} files...')
    total_fixes = 0
    files_fixed = 0

    for file_path in files:
        fixes, _ = fix_import_paths(file_path)
        if fixes > 0:
            total_fixes += fixes
            files_fixed += 1

    print(f'\n[3/3] Summary')
    print(f'Files scanned: {len(files)}')
    print(f'Files fixed: {files_fixed}')
    print(f'Total import paths corrected: {total_fixes}')

    print('\n[DONE] Re-run npm run typecheck to verify fixes')

if __name__ == '__main__':
    main()