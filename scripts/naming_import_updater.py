#!/usr/bin/env python3
"""
Naming Import Updater for Phase 5 Day 9
Updates imports and references after naming standardization
"""

from pathlib import Path
from typing import Dict, List, Set, Tuple
import ast
import json
import os
import re

from dataclasses import dataclass

@dataclass
class ImportUpdate:
    """Represents an import statement update"""
    file_path: str
    old_import: str
    new_import: str
    line_number: int
    update_type: str  # 'function_import', 'class_import', 'attribute_access'

class NamingImportUpdater:
    """Updates imports and references after naming standardization"""

    def __init__(self, summary_path: str):
        self.summary_path = summary_path
        self.summary = self._load_summary()
        self.import_updates: List[ImportUpdate] = []
        self.reference_updates: Dict[str, List[str]] = {}

    def _load_summary(self) -> Dict:
        """Load naming standardization summary"""
        with open(self.summary_path, 'r') as f:
            return json.load(f)

    def update_imports_and_references(self, dry_run: bool = False) -> Dict:
        """Update imports and references after naming changes"""
        print(f"Updating imports and references {'(DRY RUN)' if dry_run else ''}...")

        # Build mapping of old names to new names
        name_mappings = self._build_name_mappings()
        print(f"Found {len(name_mappings)} name mappings to update")

        # Find all Python files that might need updates
        python_files = self._find_python_files()
        print(f"Scanning {len(python_files)} Python files for references")

        # Process each file
        for file_path in python_files:
            self._update_file_references(file_path, name_mappings, dry_run)

        return self._generate_update_summary()

    def _build_name_mappings(self) -> Dict[str, str]:
        """Build mapping of old names to new names from standardization summary"""
        mappings = {}

        for change in self.summary.get('changes_applied', []):
            old_name = change['old_name']
            new_name = change['new_name']
            mappings[old_name] = new_name

        return mappings

    def _find_python_files(self) -> List[Path]:
        """Find all Python files that might contain references to renamed items"""
        python_files = []

        # Get all Python files in the project
        for py_file in Path('.').rglob('*.py'):
            # Skip certain directories
            if any(skip in str(py_file) for skip in [
                '__pycache__', '.git', 'dist', 'build', '--output-dir',
                '.naming_standardization_backup'
            ]):
                continue

            python_files.append(py_file)

        return python_files

    def _update_file_references(self, file_path: Path, name_mappings: Dict[str, str], dry_run: bool):
        """Update references in a single file"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()

            original_content = content
            lines = content.split('\n')
            modified_lines = []
            updates_made = 0

            for i, line in enumerate(lines):
                original_line = line
                updated_line = line

                # Update function calls and method references
                for old_name, new_name in name_mappings.items():
                    # Function calls: old_name(
                    if re.search(rf'\b{re.escape(old_name)}\s*\(', updated_line):
                        updated_line = re.sub(rf'\b{re.escape(old_name)}\s*\(',
                                            f'{new_name}(', updated_line)

                    # Attribute access: .old_name
                    if re.search(rf'\.{re.escape(old_name)}\b', updated_line):
                        updated_line = re.sub(rf'\.{re.escape(old_name)}\b',
                                            f'.{new_name}', updated_line)

                    # Import statements: from module import old_name
                    if re.search(rf'\bfrom\s+[\w.]+\s+import\s+[^,\n]*\b{re.escape(old_name)}\b', updated_line):
                        updated_line = re.sub(rf'\b{re.escape(old_name)}\b', new_name, updated_line)

                if updated_line != original_line:
                    updates_made += 1
                    self.import_updates.append(ImportUpdate(
                        file_path=str(file_path),
                        old_import=original_line.strip(),
                        new_import=updated_line.strip(),
                        line_number=i + 1,
                        update_type='reference_update'
                    ))

                modified_lines.append(updated_line)

            # Write updated content if changes were made
            if updates_made > 0 and not dry_run:
                updated_content = '\n'.join(modified_lines)
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(updated_content)

                print(f"Updated {updates_made} references in {file_path}")

        except Exception as e:
            print(f"Error updating {file_path}: {e}")

    def _generate_update_summary(self) -> Dict:
        """Generate summary of import and reference updates"""
        files_updated = len(set(update.file_path for update in self.import_updates))

        updates_by_type = {}
        for update in self.import_updates:
            updates_by_type[update.update_type] = updates_by_type.get(update.update_type, 0) + 1

        return {
            'total_updates': len(self.import_updates),
            'files_updated': files_updated,
            'updates_by_type': updates_by_type,
            'updates_applied': [
                {
                    'file_path': update.file_path,
                    'old_import': update.old_import,
                    'new_import': update.new_import,
                    'line_number': update.line_number,
                    'update_type': update.update_type
                }
                for update in self.import_updates
            ]
        }

    def validate_updates(self) -> Dict:
        """Validate that import updates don't break syntax"""
        validation_results = {
            'syntax_errors': [],
            'valid_files': 0,
            'total_files_checked': 0
        }

        # Check Python files for syntax errors
        python_files = set(update.file_path for update in self.import_updates
                            if update.file_path.endswith('.py'))

        for file_path in python_files:
            validation_results['total_files_checked'] += 1
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                ast.parse(content)
                validation_results['valid_files'] += 1
            except SyntaxError as e:
                validation_results['syntax_errors'].append({
                    'file': file_path,
                    'error': str(e),
                    'line': e.lineno
                })
            except Exception as e:
                validation_results['syntax_errors'].append({
                    'file': file_path,
                    'error': str(e),
                    'line': 0
                })

        return validation_results

def main():
    """Main execution function"""
    import argparse

    parser = argparse.ArgumentParser(description='Update imports and references after naming standardization')
    parser.add_argument('--dry-run', action='store_true', help='Show what would be updated')
    parser.add_argument('--summary', default='docs/naming_standardization_summary.json',
                        help='Path to naming standardization summary')

    args = parser.parse_args()

    updater = NamingImportUpdater(args.summary)
    summary = updater.update_imports_and_references(dry_run=args.dry_run)

    # Save update summary
    output_file = 'docs/naming_import_updates_summary.json'
    with open(output_file, 'w') as f:
        json.dump(summary, f, indent=2)

    print(f"\nImport update summary saved to: {output_file}")

    # Print summary
    print(f"\n=== IMPORT AND REFERENCE UPDATE SUMMARY ===")
    print(f"Total updates: {summary['total_updates']}")
    print(f"Files updated: {summary['files_updated']}")

    if summary['updates_by_type']:
        print("\nUpdates by type:")
        for update_type, count in summary['updates_by_type'].items():
            print(f"  {update_type}: {count}")

    # Validate updates if not dry run
    if not args.dry_run and summary['total_updates'] > 0:
        print("\nValidating updates...")
        validation = updater.validate_updates()

        if validation['syntax_errors']:
            print(f"WARNING: {len(validation['syntax_errors'])} syntax errors found!")
            for error in validation['syntax_errors'][:5]:  # Show first 5
                print(f"  {error['file']}:{error['line']} - {error['error']}")
        else:
            print(f"[OK] All {validation['valid_files']} updated files have valid syntax")

    # Show some example updates
    if summary['updates_applied']:
        print(f"\nExample updates applied:")
        for update in summary['updates_applied'][:3]:
            print(f"  {Path(update['file_path']).name}:{update['line_number']}")
            print(f"    OLD: {update['old_import']}")
            print(f"    NEW: {update['new_import']}")

if __name__ == "__main__":
    main()