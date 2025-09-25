#!/usr/bin/env python3
"""
Focused Naming Standardizer for Phase 5 Day 9
Applies only the most impactful naming standardization changes
"""

from pathlib import Path
from typing import Dict, List, Set, Tuple
import ast
import json
import re
import shutil

from dataclasses import dataclass

@dataclass
class StandardizationChange:
    """Represents a single naming standardization change"""
    file_path: str
    old_name: str
    new_name: str
    change_type: str
    line_numbers: List[int]
    context_lines: List[str]

class FocusedNamingStandardizer:
    """Applies focused naming standardization based on priority"""

    def __init__(self):
        self.changes_applied: List[StandardizationChange] = []
        self.backup_created = False

    def apply_priority_standardization(self, dry_run: bool = False) -> Dict:
        """Apply highest priority naming standardizations"""
        print(f"Applying focused naming standardization {'(DRY RUN)' if dry_run else ''}...")

        # Load reviewed violations
        with open('docs/naming_violation_review.json', 'r') as f:
            review = json.load(f)

        # Focus on most impactful changes
        priority_violations = self._select_priority_violations(review)

        print(f"Selected {len(priority_violations)} priority violations for standardization")

        if not dry_run:
            self._create_backup()

        # Apply changes
        for violation in priority_violations:
            self._apply_single_standardization(violation, dry_run)

        return self._generate_summary()

    def _select_priority_violations(self, review: Dict) -> List[Dict]:
        """Select the highest priority violations to fix"""
        priority_violations = []

        # Get important violations that are easy to fix
        important = review['priority_groups']['important']
        for violation in important:
            if violation.get('refactoring_difficulty') == 'easy':
                priority_violations.append(violation)

        # Add some nice-to-have violations if they're very easy
        nice_to_have = review['priority_groups']['nice_to_have']
        for violation in nice_to_have:
            if (violation.get('refactoring_difficulty') == 'easy' and
                violation.get('violation_type') == 'function'):
                priority_violations.append(violation)

        # Limit to reasonable number for this phase
        return priority_violations[:30]  # Top 30 most impactful changes

    def _create_backup(self):
        """Create backup of files that will be modified"""
        backup_dir = Path('.naming_standardization_backup')

        if backup_dir.exists():
            shutil.rmtree(backup_dir)

        backup_dir.mkdir(exist_ok=True)

        # Get unique files that will be modified
        files_to_backup = set()
        with open('docs/naming_violation_review.json', 'r') as f:
            review = json.load(f)

        for violation in review['actionable_violations'][:30]:
            files_to_backup.add(violation['file_path'])

        # Create backup
        for file_path in files_to_backup:
            src = Path(file_path)
            if src.exists():
                # Maintain directory structure
                rel_path = src.relative_to('.')
                backup_path = backup_dir / rel_path
                backup_path.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(src, backup_path)

        print(f"Created backup of {len(files_to_backup)} files in {backup_dir}")
        self.backup_created = True

    def _apply_single_standardization(self, violation: Dict, dry_run: bool):
        """Apply a single naming standardization"""
        file_path = violation['file_path']
        old_name = violation['current_name']
        new_name = violation['suggested_name']
        change_type = violation['violation_type']

        try:
            path_obj = Path(file_path)
            if not path_obj.exists():
                print(f"Warning: File not found: {file_path}")
                return

            with open(path_obj, 'r', encoding='utf-8') as f:
                content = f.read()

            # Apply the specific change based on type
            modified_content, changed_lines = self._apply_naming_change(
                content, old_name, new_name, change_type, file_path
            )

            if modified_content != content:
                if not dry_run:
                    with open(path_obj, 'w', encoding='utf-8') as f:
                        f.write(modified_content)

                change = StandardizationChange(
                    file_path=file_path,
                    old_name=old_name,
                    new_name=new_name,
                    change_type=change_type,
                    line_numbers=changed_lines,
                    context_lines=[]
                )
                self.changes_applied.append(change)

                print(f"{'[DRY RUN] ' if dry_run else ''}Standardized {old_name} -> {new_name} in {file_path}")

        except Exception as e:
            print(f"Error processing {file_path}: {e}")

    def _apply_naming_change(self, content: str, old_name: str, new_name: str,
                            change_type: str, file_path: str) -> Tuple[str, List[int]]:
        """Apply naming change with careful pattern matching"""
        lines = content.split('\n')
        modified_lines = []
        changed_line_numbers = []

        for i, line in enumerate(lines):
            original_line = line

            if change_type == 'function':
                # Function definition
                if re.search(rf'\bdef\s+{re.escape(old_name)}\s*\(', line):
                    line = re.sub(rf'\bdef\s+{re.escape(old_name)}\s*\(',
                                f'def {new_name}(', line)
                # Function calls - be more careful to avoid false matches
                elif re.search(rf'\b{re.escape(old_name)}\s*\(', line):
                    # Only replace if it's clearly a function call
                    line = re.sub(rf'\b{re.escape(old_name)}\s*\(',
                                f'{new_name}(', line)

            elif change_type == 'constant':
                # Constant assignments and references
                if re.search(rf'\b{re.escape(old_name)}\b', line):
                    line = re.sub(rf'\b{re.escape(old_name)}\b', new_name, line)

            elif change_type == 'class':
                # Class definitions
                if re.search(rf'\bclass\s+{re.escape(old_name)}\b', line):
                    line = re.sub(rf'\bclass\s+{re.escape(old_name)}\b',
                                f'class {new_name}', line)
                # Class instantiations
                elif re.search(rf'\b{re.escape(old_name)}\s*\(', line):
                    line = re.sub(rf'\b{re.escape(old_name)}\s*\(',
                                f'{new_name}(', line)

            if line != original_line:
                changed_line_numbers.append(i + 1)

            modified_lines.append(line)

        return '\n'.join(modified_lines), changed_line_numbers

    def _generate_summary(self) -> Dict:
        """Generate summary of applied changes"""
        files_modified = len(set(change.file_path for change in self.changes_applied))

        changes_by_type = {}
        for change in self.changes_applied:
            changes_by_type[change.change_type] = changes_by_type.get(change.change_type, 0) + 1

        return {
            'total_changes': len(self.changes_applied),
            'files_modified': files_modified,
            'changes_by_type': changes_by_type,
            'backup_created': self.backup_created,
            'changes_applied': [
                {
                    'file_path': change.file_path,
                    'old_name': change.old_name,
                    'new_name': change.new_name,
                    'change_type': change.change_type,
                    'line_numbers': change.line_numbers
                }
                for change in self.changes_applied
            ]
        }

    def validate_changes(self) -> Dict:
        """Validate that changes don't break syntax"""
        validation_results = {
            'syntax_errors': [],
            'valid_files': 0,
            'total_files_checked': 0
        }

        # Check Python files for syntax errors
        python_files = set(change.file_path for change in self.changes_applied
                            if change.file_path.endswith('.py'))

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

    parser = argparse.ArgumentParser(description='Apply focused naming standardization')
    parser.add_argument('--dry-run', action='store_true', help='Show what would be changed')
    args = parser.parse_args()

    standardizer = FocusedNamingStandardizer()
    summary = standardizer.apply_priority_standardization(dry_run=args.dry_run)

    # Save summary
    output_file = 'docs/naming_standardization_summary.json'
    with open(output_file, 'w') as f:
        json.dump(summary, f, indent=2)

    print(f"\nStandardization summary saved to: {output_file}")

    # Print summary
    print(f"\n=== FOCUSED NAMING STANDARDIZATION SUMMARY ===")
    print(f"Changes applied: {summary['total_changes']}")
    print(f"Files modified: {summary['files_modified']}")
    print(f"Backup created: {summary['backup_created']}")

    if summary['changes_by_type']:
        print("\nChanges by type:")
        for change_type, count in summary['changes_by_type'].items():
            print(f"  {change_type}: {count}")

    # Validate changes if not dry run
    if not args.dry_run and summary['total_changes'] > 0:
        print("\nValidating changes...")
        validation = standardizer.validate_changes()

        if validation['syntax_errors']:
            print(f"WARNING: {len(validation['syntax_errors'])} syntax errors found!")
            for error in validation['syntax_errors'][:5]:  # Show first 5
                print(f"  {error['file']}:{error['line']} - {error['error']}")
        else:
            print(f"[OK] All {validation['valid_files']} modified files have valid syntax")

    # Show some example changes
    if summary['changes_applied']:
        print(f"\nExample changes applied:")
        for change in summary['changes_applied'][:5]:
            print(f"  {change['old_name']} -> {change['new_name']} ({change['change_type']}) in {Path(change['file_path']).name}")

if __name__ == "__main__":
    main()