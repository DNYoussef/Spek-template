#!/usr/bin/env python3
"""
Python Test Syntax Fixer v2 - Conservative Approach
Only fixes verified safe patterns
ASCII ONLY, NASA Rule 10 Compliant

Version: 2.0.0
"""

import re
import os
import sys
import ast
from pathlib import Path
from typing import Tuple, List, Dict


class ConservativePythonFixer:
    """Conservative Python syntax fixer with validation."""

    def __init__(self, project_root: str):
        """Initialize fixer."""
        assert project_root, "Project root required"
        assert os.path.exists(project_root), "Project root must exist"

        self.project_root = Path(project_root)
        self.stats = {
            'files_processed': 0,
            'files_skipped': 0,
            'validation_errors': 0,
            'backup_restored': 0
        }

    def validate_syntax(self, content: str) -> Tuple[bool, str]:
        """Validate Python syntax."""
        try:
            ast.parse(content)
            return True, ""
        except SyntaxError as e:
            return False, f"Line {e.lineno}: {e.msg}"
        except Exception as e:
            return False, str(e)

    def restore_from_backup(self, file_path: Path) -> bool:
        """Restore file from backup."""
        backup_path = file_path.with_suffix('.py.bak')

        if not backup_path.exists():
            return False

        try:
            content = backup_path.read_text(encoding='utf-8')
            file_path.write_text(content, encoding='utf-8')
            self.stats['backup_restored'] += 1
            return True
        except Exception as e:
            print(f"[ERROR] Failed to restore {file_path}: {e}")
            return False

    def fix_file_conservative(self, file_path: Path) -> bool:
        """Apply only safe, validated fixes."""
        assert file_path.exists(), f"File must exist: {file_path}"

        try:
            original_content = file_path.read_text(encoding='utf-8')

            # Validate original
            is_valid, error = self.validate_syntax(original_content)

            if is_valid:
                self.stats['files_skipped'] += 1
                return False

            # Backup original
            backup_path = file_path.with_suffix('.py.bak')
            backup_path.write_text(original_content, encoding='utf-8')

            # Try minimal fixes
            fixed_content = original_content

            # Fix 1: Add pytest import if missing
            fixed_content = self.add_pytest_import_safe(fixed_content)

            # Fix 2: Fix octal literals
            fixed_content = self.fix_octal_literals(fixed_content)

            # Validate after fixes
            is_valid, error = self.validate_syntax(fixed_content)

            if is_valid and fixed_content != original_content:
                file_path.write_text(fixed_content, encoding='utf-8')
                self.stats['files_processed'] += 1
                return True
            elif is_valid:
                self.stats['files_skipped'] += 1
                return False
            else:
                # Fixes didn't work, restore backup
                self.restore_from_backup(file_path)
                self.stats['validation_errors'] += 1
                print(f"[FAIL] Could not fix: {file_path.name}")
                print(f"       Error: {error}")
                return False

        except Exception as e:
            print(f"[ERROR] Failed to process {file_path}: {e}")
            self.restore_from_backup(file_path)
            return False

    def add_pytest_import_safe(self, content: str) -> str:
        """Safely add pytest import if needed."""
        assert isinstance(content, str), "Content must be string"

        # Check if file has test functions but no pytest import
        has_test_functions = bool(re.search(r'\ndef test_', content))
        has_pytest_import = 'import pytest' in content or 'from pytest' in content

        if not has_test_functions or has_pytest_import:
            return content

        lines = content.split('\n')
        insert_pos = 0

        # Find first non-comment, non-docstring line
        in_docstring = False
        for i, line in enumerate(lines):
            stripped = line.strip()

            # Skip shebang and encoding
            if i == 0 and (stripped.startswith('#!') or 'coding' in stripped):
                insert_pos = i + 1
                continue

            # Skip module docstring
            if i <= 2 and (stripped.startswith('"""') or stripped.startswith("'''")):
                in_docstring = True
                continue

            if in_docstring:
                if '"""' in line or "'''" in line:
                    in_docstring = False
                    insert_pos = i + 1
                continue

            # Track imports
            if stripped.startswith(('import ', 'from ')) and not stripped.startswith('from __future__'):
                insert_pos = i + 1
            elif stripped and not stripped.startswith('#'):
                break

        # Insert pytest import
        lines.insert(insert_pos, 'import pytest')
        if insert_pos < len(lines) - 1 and lines[insert_pos + 1].strip():
            lines.insert(insert_pos + 1, '')

        return '\n'.join(lines)

    def fix_octal_literals(self, content: str) -> str:
        """Fix old-style octal literals."""
        assert isinstance(content, str), "Content must be string"

        # Only fix obvious octal patterns: 0755, 0644, 0777
        pattern = r'\b0([0-7]{3})\b'
        return re.sub(pattern, r'0o\1', content)

    def process_directory(self, directory: Path) -> Dict[str, int]:
        """Process all Python files in directory."""
        assert directory.exists(), "Directory must exist"

        python_files = list(directory.rglob('*.py'))
        total_files = len(python_files)

        print(f"[INFO] Found {total_files} Python files")

        for py_file in python_files:
            rel_path = py_file.relative_to(self.project_root)

            if self.fix_file_conservative(py_file):
                print(f"[FIXED] {rel_path}")

        return self.stats

    def cleanup_backups(self):
        """Remove backup files."""
        test_dir = self.project_root / 'tests'
        backup_files = list(test_dir.rglob('*.py.bak'))

        for backup in backup_files:
            try:
                backup.unlink()
            except Exception:
                pass


def main():
    """Main execution."""
    project_root = r"C:\Users\17175\Desktop\spek template"

    assert os.path.exists(project_root), "Project root must exist"

    # First, restore all backups to clean state
    print("=" * 60)
    print("RESTORING FROM BACKUPS (Clean Start)")
    print("=" * 60)

    test_dir = Path(project_root) / 'tests'
    backup_files = list(test_dir.rglob('*.py.bak'))

    for backup in backup_files:
        original = backup.with_suffix('')
        try:
            content = backup.read_text(encoding='utf-8')
            original.write_text(content, encoding='utf-8')
            print(f"[RESTORED] {original.relative_to(project_root)}")
        except Exception as e:
            print(f"[ERROR] Failed to restore {original}: {e}")

    print()
    print("=" * 60)
    print("CONSERVATIVE PYTHON FIXER V2")
    print("=" * 60)

    fixer = ConservativePythonFixer(project_root)
    stats = fixer.process_directory(test_dir)

    print()
    print("=" * 60)
    print("FIX SUMMARY")
    print("=" * 60)
    print(f"Files processed:     {stats['files_processed']}")
    print(f"Files skipped:       {stats['files_skipped']}")
    print(f"Validation errors:   {stats['validation_errors']}")
    print(f"Backups restored:    {stats['backup_restored']}")
    print("=" * 60)

    if stats['validation_errors'] == 0:
        print()
        print("[INFO] Cleaning up backup files...")
        fixer.cleanup_backups()
        print("[SUCCESS] All fixes validated!")
        return 0
    else:
        print()
        print("[WARN] Some files could not be fixed automatically.")
        print("[INFO] Manual intervention required for remaining errors.")
        return 1


if __name__ == '__main__':
    sys.exit(main())
