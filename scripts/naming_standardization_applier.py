#!/usr/bin/env python3
"""
Naming Standardization Applier for Phase 5 Day 9
Applies naming convention standardization based on analysis report
"""

from pathlib import Path
from typing import Dict, List, Set, Tuple, Optional
import ast
import hashlib
import json
import os
import re
import shutil

from dataclasses import dataclass
import importlib.util

@dataclass
class AppliedChange:
    """Tracks applied naming changes"""
    file_path: str
    old_name: str
    new_name: str
    change_type: str
    line_number: int
    success: bool
    error_message: Optional[str] = None

class NamingStandardizationApplier:
    """Applies naming standardization changes to codebase"""

    def __init__(self, report_path: str, root_path: str = '.'):
        self.root_path = Path(root_path)
        self.report_path = report_path
        self.report = self._load_report()
        self.applied_changes: List[AppliedChange] = []
        self.backup_dir = Path('.naming_backup')
        self.compatibility_shims: Dict[str, str] = {}

    def _load_report(self) -> Dict:
        """Load the naming standardization report"""
        with open(self.report_path, 'r') as f:
            return json.load(f)

    def apply_standardization(self, dry_run: bool = False) -> Dict:
        """Apply naming standardization changes"""
        print(f"Applying naming standardization {'(DRY RUN)' if dry_run else ''}...")

        if not dry_run:
            self._create_backup()

        # Group changes by file for efficient processing
        changes_by_file = self._group_changes_by_file()

        # Apply changes file by file
        for file_path, changes in changes_by_file.items():
            self._apply_file_changes(file_path, changes, dry_run)

        # Create backward compatibility shims
        if not dry_run:
            self._create_compatibility_shims()

        return self._generate_application_report()

    def _create_backup(self):
        """Create backup of files before applying changes"""
        print("Creating backup...")

        if self.backup_dir.exists():
            shutil.rmtree(self.backup_dir)

        self.backup_dir.mkdir(exist_ok=True)

        # Get all files that will be modified
        files_to_backup = set()
        for renaming in self.report['renaming_map']:
            for file_path in renaming['files_affected']:
                files_to_backup.add(file_path)

        # Copy files to backup directory
        for file_path in files_to_backup:
            src_path = Path(file_path)
            if src_path.exists():
                # Maintain directory structure in backup
                backup_path = self.backup_dir / src_path.relative_to(self.root_path)
                backup_path.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(src_path, backup_path)

        print(f"Backed up {len(files_to_backup)} files to {self.backup_dir}")

    def _group_changes_by_file(self) -> Dict[str, List[Dict]]:
        """Group renaming changes by file for efficient processing"""
        changes_by_file = {}

        for renaming in self.report['renaming_map']:
            for file_path in renaming['files_affected']:
                if file_path not in changes_by_file:
                    changes_by_file[file_path] = []
                changes_by_file[file_path].append(renaming)

        return changes_by_file

    def _apply_file_changes(self, file_path: str, changes: List[Dict], dry_run: bool):
        """Apply all naming changes to a single file"""
        try:
            file_path_obj = Path(file_path)
            if not file_path_obj.exists():
                print(f"Warning: File not found: {file_path}")
                return

            with open(file_path_obj, 'r', encoding='utf-8') as f:
                original_content = f.read()

            modified_content = original_content
            changes_applied = 0

            # Sort changes by old_name length (longest first) to avoid partial matches
            sorted_changes = sorted(changes, key=lambda x: len(x['old_name']), reverse=True)

            for change in sorted_changes:
                old_name = change['old_name']
                new_name = change['new_name']
                language = change['language']

                # Apply language-specific renaming
                if language == 'python':
                    modified_content, count = self._apply_python_renaming(
                        modified_content, old_name, new_name, change['name_type']
                    )
                else:  # javascript/typescript
                    modified_content, count = self._apply_js_renaming(
                        modified_content, old_name, new_name, change['name_type']
                    )

                if count > 0:
                    changes_applied += count
                    self.applied_changes.append(AppliedChange(
                        file_path=file_path,
                        old_name=old_name,
                        new_name=new_name,
                        change_type=change['name_type'],
                        line_number=0,  # Will be updated with actual line numbers
                        success=True
                    ))

            # Save modified file
            if not dry_run and modified_content != original_content:
                with open(file_path_obj, 'w', encoding='utf-8') as f:
                    f.write(modified_content)

            print(f"{'[DRY RUN] ' if dry_run else ''}Applied {changes_applied} changes to {file_path}")

        except Exception as e:
            error_msg = f"Error processing {file_path}: {e}"
            print(f"ERROR: {error_msg}")

            for change in changes:
                self.applied_changes.append(AppliedChange(
                    file_path=file_path,
                    old_name=change['old_name'],
                    new_name=change['new_name'],
                    change_type=change['name_type'],
                    line_number=0,
                    success=False,
                    error_message=str(e)
                ))

    def _apply_python_renaming(self, content: str, old_name: str, new_name: str, name_type: str) -> Tuple[str, int]:
        """Apply Python-specific renaming with proper context awareness"""
        changes_count = 0

        if name_type == 'class':
            # Class definitions
            pattern = rf'\bclass\s+{re.escape(old_name)}\b'
            replacement = f'class {new_name}'
            content, count = re.subn(pattern, replacement, content)
            changes_count += count

            # Class instantiations and references
            pattern = rf'\b{re.escape(old_name)}\s*\('
            replacement = f'{new_name}('
            content, count = re.subn(pattern, replacement, content)
            changes_count += count

        elif name_type == 'function':
            # Function definitions
            pattern = rf'\bdef\s+{re.escape(old_name)}\s*\('
            replacement = f'def {new_name}('
            content, count = re.subn(pattern, replacement, content)
            changes_count += count

            # Function calls
            pattern = rf'\b{re.escape(old_name)}\s*\('
            replacement = f'{new_name}('
            content, count = re.subn(pattern, replacement, content)
            changes_count += count

        elif name_type == 'constant':
            # Constant definitions and references
            pattern = rf'\b{re.escape(old_name)}\b'
            replacement = new_name
            content, count = re.subn(pattern, replacement, content)
            changes_count += count

        # Handle imports
        self._update_python_imports(content, old_name, new_name)

        return content, changes_count

    def _apply_js_renaming(self, content: str, old_name: str, new_name: str, name_type: str) -> Tuple[str, int]:
        """Apply JavaScript/TypeScript-specific renaming"""
        changes_count = 0

        if name_type == 'class':
            # Class definitions
            pattern = rf'\bclass\s+{re.escape(old_name)}\b'
            replacement = f'class {new_name}'
            content, count = re.subn(pattern, replacement, content)
            changes_count += count

            # Class references
            pattern = rf'\bnew\s+{re.escape(old_name)}\s*\('
            replacement = f'new {new_name}('
            content, count = re.subn(pattern, replacement, content)
            changes_count += count

        elif name_type == 'function':
            # Function definitions
            pattern = rf'\bfunction\s+{re.escape(old_name)}\s*\('
            replacement = f'function {new_name}('
            content, count = re.subn(pattern, replacement, content)
            changes_count += count

            # Function calls
            pattern = rf'\b{re.escape(old_name)}\s*\('
            replacement = f'{new_name}('
            content, count = re.subn(pattern, replacement, content)
            changes_count += count

        elif name_type == 'interface':
            # Interface definitions
            pattern = rf'\binterface\s+{re.escape(old_name)}\b'
            replacement = f'interface {new_name}'
            content, count = re.subn(pattern, replacement, content)
            changes_count += count

            # Type references
            pattern = rf':\s*{re.escape(old_name)}\b'
            replacement = f': {new_name}'
            content, count = re.subn(pattern, replacement, content)
            changes_count += count

        return content, changes_count

    def _update_python_imports(self, content: str, old_name: str, new_name: str) -> str:
        """Update Python import statements"""
        # Handle "from module import OldName" patterns
        pattern = rf'\bfrom\s+[\w.]+\s+import\s+([^,\n]*\b{re.escape(old_name)}\b[^,\n]*)'

        def replace_import(match):
            import_list = match.group(1)
            updated_list = re.sub(rf'\b{re.escape(old_name)}\b', new_name, import_list)
            return match.group(0).replace(import_list, updated_list)

        return re.sub(pattern, replace_import, content)

    def _create_compatibility_shims(self):
        """Create backward compatibility shims for public APIs"""
        print("Creating backward compatibility shims...")

        compatibility_items = [r for r in self.report['renaming_map'] if r['backward_compatible']]

        if not compatibility_items:
            print("No backward compatibility shims needed.")
            return

        # Group by language
        python_items = [item for item in compatibility_items if item['language'] == 'python']
        js_items = [item for item in compatibility_items if item['language'] in ['javascript', 'typescript']]

        # Create Python compatibility module
        if python_items:
            self._create_python_compatibility_shim(python_items)

        # Create JavaScript compatibility module
        if js_items:
            self._create_js_compatibility_shim(js_items)

    def _create_python_compatibility_shim(self, items: List[Dict]):
        """Create Python backward compatibility shim"""
        shim_content = '''"""
Backward Compatibility Shim for Naming Standardization
Auto-generated - DO NOT EDIT MANUALLY

This module provides backward compatibility for renamed items.
Import the new names directly instead of using this shim.
"""

import warnings
from typing import Any

# Deprecated name mappings
_DEPRECATED_MAPPINGS = {
'''

        for item in items:
            old_name = item['old_name']
            new_name = item['new_name']
            shim_content += f'    "{old_name}": "{new_name}",\n'

        shim_content += '''
}

def __getattr__(name: str) -> Any:
    """Provide backward compatibility for renamed items"""
    if name in _DEPRECATED_MAPPINGS:
        new_name = _DEPRECATED_MAPPINGS[name]
        warnings.warn(
            f"{name} is deprecated. Use {new_name} instead.",
            DeprecationWarning,
            stacklevel=2
        )
        # Import and return the new item
        return globals().get(new_name)

    raise AttributeError(f"module has no attribute '{name}'")
'''

        # Save shim file
        shim_path = self.root_path / 'src' / 'compatibility_shim.py'
        shim_path.parent.mkdir(parents=True, exist_ok=True)

        with open(shim_path, 'w') as f:
            f.write(shim_content)

        print(f"Created Python compatibility shim: {shim_path}")

    def _create_js_compatibility_shim(self, items: List[Dict]):
        """Create JavaScript/TypeScript backward compatibility shim"""
        shim_content = '''/**
* Backward Compatibility Shim for Naming Standardization
* Auto-generated - DO NOT EDIT MANUALLY
*
* This module provides backward compatibility for renamed items.
* Import the new names directly instead of using this shim.
*/

const deprecatedMappings = {
'''

        for item in items:
            old_name = item['old_name']
            new_name = item['new_name']
            shim_content += f'  {old_name}: "{new_name}",\n'

        shim_content += '''
};

// Create proxy for backward compatibility
const compatibilityShim = new Proxy({}, {
    get(target, prop) {
    if (prop in deprecatedMappings) {
        const newName = deprecatedMappings[prop];
        console.warn(`${prop} is deprecated. Use ${newName} instead.`);
        // Return reference to new item (simplified - actual implementation
        // would need to dynamically import/reference the new items)
        return target[newName];
    }
    return target[prop];
    }
});

export default compatibilityShim;
'''

        # Save shim file
        shim_path = self.root_path / 'src' / 'compatibility-shim.js'
        shim_path.parent.mkdir(parents=True, exist_ok=True)

        with open(shim_path, 'w') as f:
            f.write(shim_content)

        print(f"Created JavaScript compatibility shim: {shim_path}")

    def _generate_application_report(self) -> Dict:
        """Generate report of applied changes"""
        successful_changes = [c for c in self.applied_changes if c.success]
        failed_changes = [c for c in self.applied_changes if not c.success]

        files_modified = len(set(c.file_path for c in successful_changes))
        total_renamings = len(successful_changes)

        return {
            'summary': {
                'total_changes_attempted': len(self.applied_changes),
                'successful_changes': len(successful_changes),
                'failed_changes': len(failed_changes),
                'files_modified': files_modified,
                'backup_location': str(self.backup_dir) if self.backup_dir.exists() else None
            },
            'successful_changes': [
                {
                    'file_path': c.file_path,
                    'old_name': c.old_name,
                    'new_name': c.new_name,
                    'change_type': c.change_type
                } for c in successful_changes
            ],
            'failed_changes': [
                {
                    'file_path': c.file_path,
                    'old_name': c.old_name,
                    'new_name': c.new_name,
                    'change_type': c.change_type,
                    'error': c.error_message
                } for c in failed_changes
            ]
        }

    def rollback_changes(self):
        """Rollback changes using backup"""
        if not self.backup_dir.exists():
            print("No backup found. Cannot rollback.")
            return False

        print("Rolling back changes...")

        try:
            # Restore files from backup
            for backup_file in self.backup_dir.rglob('*'):
                if backup_file.is_file():
                    relative_path = backup_file.relative_to(self.backup_dir)
                    original_path = self.root_path / relative_path

                    # Restore file
                    original_path.parent.mkdir(parents=True, exist_ok=True)
                    shutil.copy2(backup_file, original_path)

            print("Rollback completed successfully.")
            return True

        except Exception as e:
            print(f"Error during rollback: {e}")
            return False

    def validate_changes(self) -> Dict:
        """Validate that applied changes don't break functionality"""
        print("Validating applied changes...")

        validation_results = {
            'syntax_errors': [],
            'import_errors': [],
            'test_results': {}
        }

        # Check for Python syntax errors
        python_files = [c.file_path for c in self.applied_changes
                        if c.success and c.file_path.endswith('.py')]

        for file_path in set(python_files):
            try:
                with open(file_path, 'r') as f:
                    ast.parse(f.read())
            except SyntaxError as e:
                validation_results['syntax_errors'].append({
                    'file': file_path,
                    'error': str(e)
                })

        # TODO: Add more comprehensive validation

        return validation_results

def main():
    """Main execution function"""
    import argparse

    parser = argparse.ArgumentParser(description='Apply naming standardization changes')
    parser.add_argument('report', help='Path to naming standardization report JSON')
    parser.add_argument('--dry-run', action='store_true', help='Show what would be changed without applying')
    parser.add_argument('--rollback', action='store_true', help='Rollback previous changes')

    args = parser.parse_args()

    applier = NamingStandardizationApplier(args.report)

    if args.rollback:
        applier.rollback_changes()
        return

    # Apply changes
    result = applier.apply_standardization(dry_run=args.dry_run)

    # Save application report
    report_path = 'docs/naming_standardization_application_report.json'
    with open(report_path, 'w') as f:
        json.dump(result, f, indent=2)

    print(f"\nApplication report saved to: {report_path}")

    # Print summary
    print("\n=== NAMING STANDARDIZATION APPLICATION SUMMARY ===")
    print(f"Changes attempted: {result['summary']['total_changes_attempted']}")
    print(f"Successful changes: {result['summary']['successful_changes']}")
    print(f"Failed changes: {result['summary']['failed_changes']}")
    print(f"Files modified: {result['summary']['files_modified']}")

    if result['summary']['backup_location']:
        print(f"Backup created at: {result['summary']['backup_location']}")

    # Validate changes
    if not args.dry_run and result['summary']['successful_changes'] > 0:
        validation = applier.validate_changes()
        if validation['syntax_errors']:
            print(f"\nWARNING: {len(validation['syntax_errors'])} syntax errors detected!")
            for error in validation['syntax_errors']:
                print(f"  {error['file']}: {error['error']}")

if __name__ == "__main__":
    main()