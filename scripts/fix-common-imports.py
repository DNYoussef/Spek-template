#!/usr/bin/env python3
"""
Automated Common Import Fixer
Adds frequently missing imports (Path, typing, dataclasses) to Python files.

Usage:
    python scripts/fix-common-imports.py [--dry-run] [--path PATH]
"""

import os
import sys
import re
import argparse
from pathlib import Path
from typing import List, Tuple, Set

# Common import patterns to detect and fix
IMPORT_PATTERNS = {
    'Path': {
        'usage_patterns': [r'\bPath\b', r'Path\('],
        'import_statement': 'from pathlib import Path',
        'check_existing': r'from pathlib import.*Path'
    },
    'Dict': {
        'usage_patterns': [r'\bDict\[', r':\s*Dict\b'],
        'import_statement': 'from typing import Dict',
        'check_existing': r'from typing import.*Dict'
    },
    'List': {
        'usage_patterns': [r'\bList\[', r':\s*List\b'],
        'import_statement': 'from typing import List',
        'check_existing': r'from typing import.*List'
    },
    'Any': {
        'usage_patterns': [r'\bAny\b', r':\s*Any\b'],
        'import_statement': 'from typing import Any',
        'check_existing': r'from typing import.*Any'
    },
    'Optional': {
        'usage_patterns': [r'\bOptional\[', r':\s*Optional\b'],
        'import_statement': 'from typing import Optional',
        'check_existing': r'from typing import.*Optional'
    },
    'Tuple': {
        'usage_patterns': [r'\bTuple\[', r':\s*Tuple\b'],
        'import_statement': 'from typing import Tuple',
        'check_existing': r'from typing import.*Tuple'
    },
    'Set': {
        'usage_patterns': [r'\bSet\[', r':\s*Set\b'],
        'import_statement': 'from typing import Set',
        'check_existing': r'from typing import.*Set'
    },
    'Callable': {
        'usage_patterns': [r'\bCallable\[', r':\s*Callable\b'],
        'import_statement': 'from typing import Callable',
        'check_existing': r'from typing import.*Callable'
    },
    'dataclass': {
        'usage_patterns': [r'@dataclass\b'],
        'import_statement': 'from dataclasses import dataclass',
        'check_existing': r'from dataclasses import.*dataclass'
    },
    'field': {
        'usage_patterns': [r'\bfield\('],
        'import_statement': 'from dataclasses import field',
        'check_existing': r'from dataclasses import.*field'
    },
    'asdict': {
        'usage_patterns': [r'\basdict\('],
        'import_statement': 'from dataclasses import asdict',
        'check_existing': r'from dataclasses import.*asdict'
    },
}

def needs_import(content: str, import_name: str) -> bool:
    """Check if file needs a specific import."""
    pattern_info = IMPORT_PATTERNS[import_name]

    # Check if any usage pattern is found
    uses_import = any(
        re.search(pattern, content)
        for pattern in pattern_info['usage_patterns']
    )

    if not uses_import:
        return False

    # Check if import already exists
    has_import = bool(re.search(pattern_info['check_existing'], content, re.MULTILINE))

    return not has_import

def find_import_position(lines: List[str]) -> int:
    """Find the best position to insert imports."""
    insert_position = 0
    in_docstring = False
    docstring_char = None
    last_import_line = -1

    for i, line in enumerate(lines):
        stripped = line.strip()

        # Skip shebang
        if i == 0 and stripped.startswith('#!'):
            insert_position = i + 1
            continue

        # Skip encoding declaration
        if stripped.startswith('#') and 'coding' in stripped:
            insert_position = i + 1
            continue

        # Track docstrings
        if stripped.startswith('"""') or stripped.startswith("'''"):
            if not in_docstring:
                in_docstring = True
                docstring_char = '"""' if '"""' in stripped else "'''"
                if stripped.count(docstring_char) >= 2:  # Single-line docstring
                    in_docstring = False
                    insert_position = i + 1
            elif docstring_char in stripped:
                in_docstring = False
                insert_position = i + 1
            continue

        if in_docstring:
            continue

        # Track imports
        if stripped.startswith('import ') or stripped.startswith('from '):
            last_import_line = i
            continue

        # If we've seen imports and hit non-import, insert after last import
        if last_import_line >= 0 and stripped and not stripped.startswith('#'):
            return last_import_line + 1

        # No imports yet, insert before first code
        if stripped and not stripped.startswith('#'):
            return i

    # Default to end of file if nothing found
    return last_import_line + 1 if last_import_line >= 0 else insert_position

def consolidate_typing_imports(lines: List[str], new_imports: Set[str]) -> List[str]:
    """Consolidate typing imports into a single line if possible."""
    typing_imports = [imp for imp in new_imports if imp.startswith('from typing import')]

    if len(typing_imports) <= 1:
        return lines

    # Extract all typing names
    typing_names = []
    for imp in typing_imports:
        match = re.search(r'from typing import (.+)', imp)
        if match:
            typing_names.extend([name.strip() for name in match.group(1).split(',')])

    # Check if there's already a typing import line
    for i, line in enumerate(lines):
        if re.match(r'^\s*from typing import', line):
            # Found existing typing import, extend it
            match = re.search(r'from typing import (.+)', line)
            if match:
                existing_names = [name.strip() for name in match.group(1).split(',')]
                all_names = sorted(set(existing_names + typing_names))
                lines[i] = f"from typing import {', '.join(all_names)}"
                # Remove the new typing imports since we merged them
                return lines

    # No existing typing import, create consolidated one
    consolidated = f"from typing import {', '.join(sorted(set(typing_names)))}"

    # Replace first typing import with consolidated, remove others
    first_typing = None
    for imp in typing_imports:
        if first_typing is None:
            first_typing = imp

    new_imports_list = [imp for imp in new_imports if not imp.startswith('from typing import')]
    new_imports_list.append(consolidated)

    return lines

def fix_file(file_path: Path, dry_run: bool = False) -> Tuple[bool, str]:
    """Fix common imports in a single file."""
    try:
        content = file_path.read_text(encoding='utf-8')
    except Exception as e:
        return False, f"Failed to read: {e}"

    # Find which imports are needed
    needed_imports = set()
    for import_name in IMPORT_PATTERNS.keys():
        if needs_import(content, import_name):
            needed_imports.add(IMPORT_PATTERNS[import_name]['import_statement'])

    if not needed_imports:
        return False, "No imports needed"

    lines = content.split('\n')
    insert_position = find_import_position(lines)

    # Consolidate typing imports
    typing_imports = {imp for imp in needed_imports if imp.startswith('from typing import')}
    other_imports = {imp for imp in needed_imports if not imp.startswith('from typing import')}

    if len(typing_imports) > 1:
        # Consolidate typing imports
        typing_names = []
        for imp in typing_imports:
            match = re.search(r'from typing import (.+)', imp)
            if match:
                typing_names.append(match.group(1))
        consolidated_typing = f"from typing import {', '.join(sorted(typing_names))}"
        import_lines = sorted(other_imports) + [consolidated_typing]
    else:
        import_lines = sorted(needed_imports)

    # Insert imports
    for import_line in reversed(import_lines):
        lines.insert(insert_position, import_line)

    # Add blank line after imports if needed
    if insert_position < len(lines) and lines[insert_position + len(import_lines)].strip():
        lines.insert(insert_position + len(import_lines), '')

    new_content = '\n'.join(lines)

    if dry_run:
        return True, f"Would add {len(needed_imports)} imports at line {insert_position}"

    try:
        file_path.write_text(new_content, encoding='utf-8')
        import_summary = ', '.join([imp.split()[-1] for imp in sorted(needed_imports)])
        return True, f"Added imports: {import_summary}"
    except Exception as e:
        return False, f"Failed to write: {e}"

def find_python_files(root_path: Path) -> List[Path]:
    """Find all Python files in directory tree."""
    python_files = []
    for py_file in root_path.rglob('*.py'):
        if any(part in py_file.parts for part in ['.venv', 'venv', '__pycache__', '.git', 'node_modules']):
            continue
        python_files.append(py_file)
    return python_files

def main():
    parser = argparse.ArgumentParser(description='Fix common missing imports in Python files')
    parser.add_argument('--dry-run', action='store_true', help='Show changes without modifying')
    parser.add_argument('--path', type=str, default='analyzer', help='Path to scan (default: analyzer)')
    parser.add_argument('--verbose', '-v', action='store_true', help='Show all files')

    args = parser.parse_args()

    root_path = Path(args.path)
    if not root_path.exists():
        print(f"Error: Path '{args.path}' does not exist")
        return 1

    print(f"Scanning Python files in: {root_path}")
    if args.dry_run:
        print("DRY RUN MODE - No files will be modified\n")

    python_files = find_python_files(root_path)
    print(f"Found {len(python_files)} Python files\n")

    fixed_count = 0
    skipped_count = 0
    failed_count = 0

    for py_file in python_files:
        success, message = fix_file(py_file, dry_run=args.dry_run)

        if success:
            fixed_count += 1
            print(f"[FIXED] {py_file.relative_to(root_path)}: {message}")
        elif "No imports needed" in message:
            skipped_count += 1
            if args.verbose:
                print(f"[SKIP] {py_file.relative_to(root_path)}: {message}")
        else:
            failed_count += 1
            print(f"[FAIL] {py_file.relative_to(root_path)}: {message}")

    print(f"\n{'='*60}")
    print(f"Summary:")
    print(f"  Fixed: {fixed_count}")
    print(f"  Skipped: {skipped_count}")
    print(f"  Failed: {failed_count}")
    print(f"  Total: {len(python_files)}")
    print(f"{'='*60}")

    if args.dry_run and fixed_count > 0:
        print(f"\nRe-run without --dry-run to apply changes")

    return 0 if failed_count == 0 else 1

if __name__ == '__main__':
    sys.exit(main())
