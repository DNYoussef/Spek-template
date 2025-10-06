#!/usr/bin/env python3
"""
Automated Logger Import Fixer
Adds 'import logging' and 'logger = logging.getLogger(__name__)' to Python files
missing the logger definition.

Usage:
    python scripts/fix-logger-imports.py [--dry-run] [--path PATH]
"""

import os
import sys
import re
import argparse
from pathlib import Path
from typing import List, Tuple

def has_logging_import(content: str) -> bool:
    """Check if file already imports logging module."""
    return bool(re.search(r'^\s*import\s+logging', content, re.MULTILINE))

def has_logger_definition(content: str) -> bool:
    """Check if file already defines logger."""
    return bool(re.search(r'^\s*logger\s*=', content, re.MULTILINE))

def needs_fix(content: str) -> bool:
    """Check if file needs logger import fix."""
    # File uses logger but doesn't have proper setup
    uses_logger = bool(re.search(r'\blogger\b', content))
    has_proper_setup = has_logging_import(content) and has_logger_definition(content)
    return uses_logger and not has_proper_setup

def fix_file(file_path: Path, dry_run: bool = False) -> Tuple[bool, str]:
    """
    Fix logger imports in a single file.

    Returns:
        (success: bool, message: str)
    """
    try:
        content = file_path.read_text(encoding='utf-8')
    except Exception as e:
        return False, f"Failed to read: {e}"

    if not needs_fix(content):
        return False, "No fix needed"

    # Find the right place to insert imports
    lines = content.split('\n')
    insert_position = 0

    # Skip shebang, encoding, docstring
    in_docstring = False
    docstring_char = None

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

        # Stop at first import or code
        if stripped and not stripped.startswith('#'):
            if stripped.startswith('import ') or stripped.startswith('from '):
                # Insert after last import
                for j in range(i, len(lines)):
                    next_line = lines[j].strip()
                    if next_line and not next_line.startswith('import ') and not next_line.startswith('from ') and not next_line.startswith('#'):
                        insert_position = j
                        break
                else:
                    insert_position = i + 1
                break
            else:
                # No imports yet, insert here
                insert_position = i
                break

    # Build fix
    fix_lines = []

    if not has_logging_import(content):
        fix_lines.append('import logging')

    if not has_logger_definition(content):
        if fix_lines:
            fix_lines.append('')  # Blank line after imports
        fix_lines.append('logger = logging.getLogger(__name__)')
        fix_lines.append('')  # Blank line after logger

    # Insert fix
    lines.insert(insert_position, '\n'.join(fix_lines))
    new_content = '\n'.join(lines)

    if dry_run:
        return True, f"Would add logger import at line {insert_position}"

    try:
        file_path.write_text(new_content, encoding='utf-8')
        return True, f"Added logger import at line {insert_position}"
    except Exception as e:
        return False, f"Failed to write: {e}"

def find_python_files(root_path: Path) -> List[Path]:
    """Find all Python files in directory tree."""
    python_files = []

    for py_file in root_path.rglob('*.py'):
        # Skip virtual environments and build directories
        if any(part in py_file.parts for part in ['.venv', 'venv', '__pycache__', '.git', 'node_modules', 'build', 'dist']):
            continue
        python_files.append(py_file)

    return python_files

def main():
    parser = argparse.ArgumentParser(description='Fix logger imports in Python files')
    parser.add_argument('--dry-run', action='store_true', help='Show what would be changed without modifying files')
    parser.add_argument('--path', type=str, default='analyzer', help='Path to scan (default: analyzer)')
    parser.add_argument('--verbose', '-v', action='store_true', help='Show all files checked')

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
        elif "No fix needed" in message:
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
