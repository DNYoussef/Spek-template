#!/usr/bin/env python3
"""
Mass Import Update Script - Fix Circular Dependencies
=====================================================

This script updates all import statements to use the new src.constants.base module,
eliminating circular dependencies in the import system.

Usage: python fix_circular_imports.py
"""

import os
import re
import ast
from pathlib import Path
from typing import List, Tuple, Dict
import shutil
from datetime import datetime

class ImportFixer:
    def __init__(self):
        self.changes_made = []
        self.files_processed = 0
        self.files_changed = 0
        self.errors = []
        self.backup_dir = f"import_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

    def backup_file(self, filepath: str) -> None:
        """Create backup of file before modifying"""
        backup_path = Path(self.backup_dir) / Path(filepath).relative_to('.')
        backup_path.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(filepath, backup_path)

    def fix_imports_in_file(self, filepath: str) -> bool:
        """Fix imports in a single file"""
        try:
            with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                original_content = f.read()

            modified = False
            new_content = original_content

            # Pattern 1: from src.constants import X -> from src.constants.base import X
            pattern1 = r'from\s+src\.constants\s+import\s+([^(\n]+)'
            matches1 = re.findall(pattern1, original_content)
            if matches1:
                for match in matches1:
                    # Check if this is importing from a submodule (skip those)
                    if not any(sub in match for sub in ['.base', '.financial', '.quality', '.compliance', '.business']):
                        old_line = f'from src.constants import {match}'
                        new_line = f'from src.constants.base import {match}'
                        if old_line in new_content:
                            new_content = new_content.replace(old_line, new_line)
                            modified = True
                            self.changes_made.append((filepath, old_line.strip(), new_line.strip()))

            # Pattern 2: from analyzer.constants import X -> from src.constants.base import X
            pattern2 = r'from\s+analyzer\.constants\s+import\s+([^(\n]+)'
            matches2 = re.findall(pattern2, original_content)
            if matches2:
                for match in matches2:
                    old_line = f'from analyzer.constants import {match}'
                    new_line = f'from src.constants.base import {match}'
                    if old_line in new_content:
                        new_content = new_content.replace(old_line, new_line)
                        modified = True
                        self.changes_made.append((filepath, old_line.strip(), new_line.strip()))

            # Pattern 3: import src.constants -> import src.constants.base
            if 'import src.constants' in original_content and 'import src.constants.base' not in original_content:
                new_content = new_content.replace('import src.constants', 'import src.constants.base')
                modified = True
                self.changes_made.append((filepath, 'import src.constants', 'import src.constants.base'))

            # Pattern 4: import analyzer.constants -> import src.constants.base
            if 'import analyzer.constants' in original_content:
                new_content = new_content.replace('import analyzer.constants as', 'import src.constants.base as')
                new_content = new_content.replace('import analyzer.constants', 'import src.constants.base')
                modified = True
                self.changes_made.append((filepath, 'import analyzer.constants', 'import src.constants.base'))

            # Write changes if modified
            if modified:
                self.backup_file(filepath)
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                self.files_changed += 1
                return True

            return False

        except Exception as e:
            self.errors.append((filepath, str(e)))
            return False

    def fix_constants_init(self) -> None:
        """Fix src/constants/__init__.py specifically"""
        init_file = 'src/constants/__init__.py'
        if not os.path.exists(init_file):
            print(f"Warning: {init_file} not found")
            return

        try:
            with open(init_file, 'r', encoding='utf-8') as f:
                content = f.read()

            self.backup_file(init_file)

            # Remove the problematic analyzer.constants import
            new_content = content

            # Remove the analyzer import section
            new_content = re.sub(
                r'# Import from analyzer constants.*?globals\(\)\[attr_name\] = getattr\(analyzer_constants, attr_name\)',
                '# Import from base constants\nfrom .base import *',
                new_content,
                flags=re.DOTALL
            )

            # Also remove just the import line if it exists
            new_content = re.sub(r'import analyzer\.constants.*\n', '', new_content)

            # Add base import if not present
            if 'from .base import *' not in new_content:
                # Find the try block and add import there
                if 'except ImportError:' in new_content:
                    new_content = new_content.replace(
                        'try:',
                        'try:\n    from .base import *'
                    )
                else:
                    # Add at the beginning after docstring
                    lines = new_content.split('\n')
                    insert_idx = 0
                    for i, line in enumerate(lines):
                        if line.strip() and not line.startswith('#') and not line.startswith('"""'):
                            insert_idx = i
                            break
                    lines.insert(insert_idx, 'from .base import *\n')
                    new_content = '\n'.join(lines)

            with open(init_file, 'w', encoding='utf-8') as f:
                f.write(new_content)

            self.changes_made.append((init_file, 'import analyzer.constants', 'from .base import *'))
            print(f"[OK] Fixed {init_file}")

        except Exception as e:
            self.errors.append((init_file, str(e)))
            print(f"[ERROR] Error fixing {init_file}: {e}")

    def run(self) -> None:
        """Run the import fixing process"""
        print("=" * 60)
        print("MASS IMPORT UPDATE SCRIPT")
        print("=" * 60)
        print(f"Creating backup directory: {self.backup_dir}")
        os.makedirs(self.backup_dir, exist_ok=True)

        # First, fix the src/constants/__init__.py file
        print("\nStep 1: Fixing src/constants/__init__.py...")
        self.fix_constants_init()

        # Find all Python files
        print("\nStep 2: Finding all Python files...")
        python_files = []
        for root, dirs, files in os.walk('.'):
            # Skip backup directories and common exclusions
            if any(exclude in root for exclude in ['.git', '__pycache__', '.venv', 'venv', self.backup_dir, 'import_backup']):
                continue

            for file in files:
                if file.endswith('.py'):
                    filepath = os.path.join(root, file)
                    python_files.append(filepath)

        print(f"Found {len(python_files)} Python files")

        # Process each file
        print("\nStep 3: Processing files...")
        for i, filepath in enumerate(python_files, 1):
            if i % 50 == 0:
                print(f"  Processed {i}/{len(python_files)} files...")

            self.files_processed += 1
            self.fix_imports_in_file(filepath)

        # Print summary
        print("\n" + "=" * 60)
        print("IMPORT UPDATE SUMMARY")
        print("=" * 60)
        print(f"Files processed: {self.files_processed}")
        print(f"Files changed: {self.files_changed}")
        print(f"Total changes made: {len(self.changes_made)}")
        print(f"Errors encountered: {len(self.errors)}")
        print(f"Backup directory: {self.backup_dir}")

        # Show first 10 changes as examples
        if self.changes_made:
            print("\nExample changes made:")
            for filepath, old, new in self.changes_made[:10]:
                print(f"  {filepath}:")
                print(f"    OLD: {old}")
                print(f"    NEW: {new}")

            if len(self.changes_made) > 10:
                print(f"  ... and {len(self.changes_made) - 10} more changes")

        # Show errors if any
        if self.errors:
            print("\nErrors encountered:")
            for filepath, error in self.errors[:5]:
                print(f"  {filepath}: {error}")

        # Save detailed report
        report_file = 'import_update_report.txt'
        with open(report_file, 'w') as f:
            f.write("IMPORT UPDATE REPORT\n")
            f.write("=" * 60 + "\n")
            f.write(f"Timestamp: {datetime.now()}\n")
            f.write(f"Files processed: {self.files_processed}\n")
            f.write(f"Files changed: {self.files_changed}\n")
            f.write(f"Total changes: {len(self.changes_made)}\n")
            f.write(f"Backup directory: {self.backup_dir}\n\n")

            f.write("ALL CHANGES MADE:\n")
            f.write("-" * 60 + "\n")
            for filepath, old, new in self.changes_made:
                f.write(f"{filepath}:\n")
                f.write(f"  OLD: {old}\n")
                f.write(f"  NEW: {new}\n\n")

            if self.errors:
                f.write("\nERRORS:\n")
                f.write("-" * 60 + "\n")
                for filepath, error in self.errors:
                    f.write(f"{filepath}: {error}\n")

        print(f"\nDetailed report saved to: {report_file}")
        print("\nIMPORTANT: Test imports before deleting this script!")
        print("To restore backups if needed: copy files from", self.backup_dir)

if __name__ == "__main__":
    fixer = ImportFixer()
    fixer.run()