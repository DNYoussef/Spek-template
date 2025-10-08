#!/usr/bin/env python3
"""
Python Test Syntax Fixer - NASA Rule 10 Compliant
Batch fixes for pytest collection errors
NO TODOs, production-ready
ASCII ONLY

Version: 1.0.0
"""

import re
import os
import sys
from pathlib import Path
from typing import Tuple, List, Dict


class PythonTestFixer:
    """Fix common Python test syntax errors."""

    def __init__(self, project_root: str):
        """Initialize fixer with project root."""
        assert project_root, "Project root required"
        assert os.path.exists(project_root), "Project root must exist"

        self.project_root = Path(project_root)
        self.stats = {
            'strings_fixed': 0,
            'imports_added': 0,
            'literals_fixed': 0,
            'parens_fixed': 0,
            'files_processed': 0,
            'files_skipped': 0,
            'errors': 0
        }
        self.fixed_files: List[Path] = []

    def fix_file(self, file_path: Path) -> bool:
        """Apply all fixes to a single file."""
        assert file_path.exists(), f"File must exist: {file_path}"

        try:
            content = file_path.read_text(encoding='utf-8')
            original = content

            # Apply fixes in order
            content = self.fix_unterminated_strings(content)
            content = self.add_missing_pytest_imports(content)
            content = self.fix_leading_zeros(content)
            content = self.fix_unbalanced_parentheses(content)
            content = self.fix_invalid_escape_sequences(content)

            if content != original:
                # Backup original
                backup_path = file_path.with_suffix('.py.bak')
                backup_path.write_text(original, encoding='utf-8')

                # Write fixed content
                file_path.write_text(content, encoding='utf-8')
                self.stats['files_processed'] += 1
                self.fixed_files.append(file_path)
                return True

            self.stats['files_skipped'] += 1
            return False

        except Exception as e:
            print(f"[ERROR] Failed to fix {file_path}: {e}")
            self.stats['errors'] += 1
            return False

    def fix_unterminated_strings(self, content: str) -> str:
        """Fix unterminated triple-quoted strings."""
        assert isinstance(content, str), "Content must be string"

        lines = content.split('\n')
        fixed_lines = []
        in_triple_quote = False
        triple_quote_type = None
        quote_start_line = -1

        for i, line in enumerate(lines):
            # Count triple quotes in line
            double_triple = line.count('"""')
            single_triple = line.count("'''")

            # Handle triple quotes
            if not in_triple_quote:
                if double_triple % 2 == 1:
                    in_triple_quote = True
                    triple_quote_type = '"""'
                    quote_start_line = i
                elif single_triple % 2 == 1:
                    in_triple_quote = True
                    triple_quote_type = "'''"
                    quote_start_line = i
            else:
                # Check if this line closes the quote
                if (triple_quote_type == '"""' and double_triple > 0) or \
                   (triple_quote_type == "'''" and single_triple > 0):
                    in_triple_quote = False
                    triple_quote_type = None

            fixed_lines.append(line)

        # If still in triple quote at end, close it
        if in_triple_quote and triple_quote_type:
            # Add closing quote before last function/class or at end
            closing_added = False
            for i in range(len(fixed_lines) - 1, quote_start_line, -1):
                line = fixed_lines[i]
                if line.strip().startswith(('def ', 'class ', '@')):
                    fixed_lines.insert(i, triple_quote_type)
                    closing_added = True
                    self.stats['strings_fixed'] += 1
                    break

            if not closing_added:
                fixed_lines.append(triple_quote_type)
                self.stats['strings_fixed'] += 1

        return '\n'.join(fixed_lines)

    def add_missing_pytest_imports(self, content: str) -> str:
        """Add missing pytest imports."""
        assert isinstance(content, str), "Content must be string"

        # Check if file has test functions but no pytest import
        has_test_functions = bool(re.search(r'\ndef test_', content))
        has_pytest_import = 'import pytest' in content or 'from pytest' in content

        if has_test_functions and not has_pytest_import:
            # Find where to insert import
            lines = content.split('\n')
            insert_pos = 0

            # Find last import or docstring
            in_docstring = False
            for i, line in enumerate(lines):
                stripped = line.strip()

                # Skip module docstring
                if i == 0 and (stripped.startswith('"""') or stripped.startswith("'''")):
                    in_docstring = True
                    continue

                if in_docstring:
                    if '"""' in line or "'''" in line:
                        in_docstring = False
                        insert_pos = i + 1
                    continue

                # Track imports
                if stripped.startswith(('import ', 'from ')):
                    insert_pos = i + 1
                elif stripped and not stripped.startswith('#'):
                    # Found first non-import, non-comment line
                    break

            # Insert pytest import
            lines.insert(insert_pos, 'import pytest')
            if insert_pos < len(lines) - 1 and lines[insert_pos + 1].strip():
                lines.insert(insert_pos + 1, '')

            self.stats['imports_added'] += 1
            return '\n'.join(lines)

        return content

    def fix_leading_zeros(self, content: str) -> str:
        """Fix leading zero decimal literals (old octal syntax)."""
        assert isinstance(content, str), "Content must be string"

        # Pattern: 0755, 0644, etc. (octal literals)
        pattern = r'\b0([0-7]{3,4})\b'

        def replace_octal(match):
            self.stats['literals_fixed'] += 1
            return f"0o{match.group(1)}"

        fixed_content = re.sub(pattern, replace_octal, content)
        return fixed_content

    def fix_unbalanced_parentheses(self, content: str) -> str:
        """Fix unbalanced parentheses in function calls."""
        assert isinstance(content, str), "Content must be string"

        lines = content.split('\n')
        fixed_lines = []

        for line in lines:
            # Only fix if line has unbalanced parens
            open_count = line.count('(')
            close_count = line.count(')')

            if open_count != close_count:
                # Simple case: missing closing parens at end of line
                if open_count > close_count and not line.rstrip().endswith('\\'):
                    line = line.rstrip() + ')' * (open_count - close_count)
                    self.stats['parens_fixed'] += 1
                # Missing opening parens (less common)
                elif close_count > open_count:
                    line = '(' * (close_count - open_count) + line
                    self.stats['parens_fixed'] += 1

            fixed_lines.append(line)

        return '\n'.join(fixed_lines)

    def fix_invalid_escape_sequences(self, content: str) -> str:
        """Fix invalid escape sequences in strings."""
        assert isinstance(content, str), "Content must be string"

        # Common invalid escapes: \s, \d, \w in non-raw strings
        # Convert to raw strings or double backslash
        lines = content.split('\n')
        fixed_lines = []

        for line in lines:
            # Check for invalid escapes in string literals
            if '\\' in line and not line.strip().startswith('#'):
                # Pattern: string with invalid escape
                fixed_line = re.sub(
                    r'(["\'])([^"\']*\\[sdwSDW][^"\']*)\1',
                    r'r\1\2\1',
                    line
                )
                if fixed_line != line:
                    line = fixed_line

            fixed_lines.append(line)

        return '\n'.join(fixed_lines)

    def process_test_directory(self) -> Dict[str, int]:
        """Process all Python test files."""
        assert self.project_root.exists(), "Project root must exist"

        test_dir = self.project_root / 'tests'

        if not test_dir.exists():
            print(f"[WARN] Test directory not found: {test_dir}")
            return self.stats

        # Find all Python test files
        test_files = list(test_dir.rglob('*.py'))
        total_files = len(test_files)

        print(f"[INFO] Found {total_files} test files to process")

        for test_file in test_files:
            rel_path = test_file.relative_to(self.project_root)

            if self.fix_file(test_file):
                print(f"[FIXED] {rel_path}")
            else:
                print(f"[SKIP] {rel_path}")

        return self.stats

    def cleanup_backups(self):
        """Remove backup files after successful fixes."""
        test_dir = self.project_root / 'tests'
        backup_files = list(test_dir.rglob('*.py.bak'))

        for backup in backup_files:
            try:
                backup.unlink()
            except Exception as e:
                print(f"[WARN] Failed to remove backup {backup}: {e}")


def main():
    """Main execution function."""
    project_root = r"C:\Users\17175\Desktop\spek template"

    assert os.path.exists(project_root), "Project root must exist"

    fixer = PythonTestFixer(project_root)

    print("=" * 60)
    print("PYTHON TEST SYNTAX FIXER")
    print("=" * 60)
    print(f"Project: {project_root}")
    print()

    # Process all test files
    stats = fixer.process_test_directory()

    # Print summary
    print()
    print("=" * 60)
    print("FIX SUMMARY")
    print("=" * 60)
    print(f"Files processed:     {stats['files_processed']}")
    print(f"Files skipped:       {stats['files_skipped']}")
    print(f"Errors encountered:  {stats['errors']}")
    print()
    print(f"Strings fixed:       {stats['strings_fixed']}")
    print(f"Imports added:       {stats['imports_added']}")
    print(f"Literals fixed:      {stats['literals_fixed']}")
    print(f"Parentheses fixed:   {stats['parens_fixed']}")
    print("=" * 60)

    # Cleanup backups on success
    if stats['files_processed'] > 0 and stats['errors'] == 0:
        print()
        print("[INFO] Cleaning up backup files...")
        fixer.cleanup_backups()
        print("[SUCCESS] All fixes applied successfully!")
        return 0
    elif stats['errors'] > 0:
        print()
        print("[WARN] Some errors occurred. Backup files retained.")
        return 1
    else:
        print()
        print("[INFO] No fixes needed.")
        return 0


if __name__ == '__main__':
    sys.exit(main())
