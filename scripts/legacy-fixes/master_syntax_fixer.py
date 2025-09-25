#!/usr/bin/env python3
"""
Master Syntax Fixer - Comprehensive solution for all 308 files with syntax errors
Fixes all patterns identified from Unicode removal damage
"""

import os
import re
import sys
import ast
import shutil
from pathlib import Path
from collections import defaultdict
from datetime import datetime

class MasterSyntaxFixer:
    """Comprehensive fixer for all syntax error patterns"""

    def __init__(self, root_dir='.', backup=True):
        self.root_dir = Path(root_dir)
        self.backup = backup
        self.backup_dir = self.root_dir / f'.backup_{datetime.now().strftime("%Y%m%d_%H%M%S")}'
        self.fixed_files = []
        self.error_files = []
        self.fix_counts = defaultdict(int)

    def backup_file(self, filepath):
        """Create backup before fixing"""
        if self.backup:
            backup_path = self.backup_dir / filepath.relative_to(self.root_dir)
            backup_path.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(filepath, backup_path)

    def validate_syntax(self, filepath):
        """Check if file has valid Python syntax"""
        try:
            with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
            ast.parse(content)
            return True, None
        except SyntaxError as e:
            return False, e

    def fix_unterminated_triple_quotes(self, filepath):
        """Fix unterminated triple-quoted string literals"""
        fixed = False
        try:
            with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                lines = f.readlines()

            # Check for syntax error first
            valid, error = self.validate_syntax(filepath)
            if valid:
                return False

            if error and 'unterminated triple-quoted string' in str(error):
                # Pattern 1: Missing opening """ after imports
                new_lines = []
                for i, line in enumerate(lines):
                    new_lines.append(line)

                    # Check if this is an import line followed by text without """
                    if (line.strip().startswith(('from ', 'import ')) and
                        i + 1 < len(lines) and lines[i + 1].strip() == '' and
                        i + 2 < len(lines) and lines[i + 2].strip() and
                        not lines[i + 2].strip().startswith('"""')):

                        # Look ahead to see if there's a closing """
                        has_closing = False
                        for j in range(i + 3, min(i + 10, len(lines))):
                            if '"""' in lines[j]:
                                has_closing = True
                                break

                        if has_closing:
                            new_lines.append('"""\n')
                            fixed = True
                            self.fix_counts['missing_opening_quotes'] += 1

                # Pattern 2: Fix at specific error line
                if error.lineno and not fixed:
                    line_idx = error.lineno - 1
                    if line_idx > 0 and line_idx < len(new_lines):
                        # Check if previous line should have triple quotes
                        if (line_idx > 0 and
                            not new_lines[line_idx].strip().startswith('"""') and
                            new_lines[line_idx].strip()):
                            new_lines.insert(line_idx, '"""\n')
                            fixed = True
                            self.fix_counts['inserted_quotes_at_error'] += 1

                if fixed:
                    with open(filepath, 'w', encoding='utf-8') as f:
                        f.writelines(new_lines)

        except Exception as e:
            print(f"Error fixing triple quotes in {filepath}: {e}")

        return fixed

    def fix_indentation_issues(self, filepath):
        """Fix unexpected indent and missing indented blocks"""
        fixed = False
        try:
            with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                lines = f.readlines()

            new_lines = []
            i = 0
            while i < len(lines):
                line = lines[i]

                # Fix unexpected indent - remove extra indentation
                if line.startswith('        ') and i > 0:
                    prev_line = lines[i-1].strip()
                    # If previous line doesn't end with : it shouldn't be indented
                    if prev_line and not prev_line.endswith(':'):
                        # Check if this looks like it should be module level
                        if line.strip().startswith('def ') or line.strip().startswith('class '):
                            new_lines.append(line[4:] if line.startswith('    ') else line)
                            fixed = True
                            self.fix_counts['fixed_unexpected_indent'] += 1
                        else:
                            new_lines.append(line)
                    else:
                        new_lines.append(line)
                else:
                    new_lines.append(line)

                # Add pass for empty blocks
                if line.rstrip().endswith(':') and i + 1 < len(lines):
                    next_line = lines[i + 1]
                    # Check if next line is not properly indented (empty block)
                    if (not next_line.strip() or
                        (next_line.strip() and not next_line.startswith((' ', '\t')))):

                        # Check what type of block this is
                        if any(keyword in line for keyword in ['except', 'finally', 'else', 'elif']):
                            indent = len(line) - len(line.lstrip()) + 4
                            new_lines.append(' ' * indent + 'pass\n')
                            fixed = True
                            self.fix_counts['added_pass_statement'] += 1
                        elif any(keyword in line for keyword in ['def ', 'class ', 'if ', 'for ', 'while ', 'with ']):
                            indent = len(line) - len(line.lstrip()) + 4
                            new_lines.append(' ' * indent + 'pass\n')
                            fixed = True
                            self.fix_counts['added_pass_statement'] += 1

                i += 1

            if fixed:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.writelines(new_lines)

        except Exception as e:
            print(f"Error fixing indentation in {filepath}: {e}")

        return fixed

    def fix_decimal_literals(self, filepath):
        """Fix invalid decimal literals like 3.compliance"""
        fixed = False
        try:
            with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()

            # Pattern: number.word should be number, word
            pattern = r'(\d+)\.([a-zA-Z_]\w*)'

            def replace_decimal(match):
                nonlocal fixed
                fixed = True
                self.fix_counts['fixed_decimal_literal'] += 1
                return f"{match.group(1)}, {match.group(2)}"

            new_content = re.sub(pattern, replace_decimal, content)

            if fixed:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(new_content)

        except Exception as e:
            print(f"Error fixing decimal literals in {filepath}: {e}")

        return fixed

    def fix_leading_zeros(self, filepath):
        """Fix leading zeros in decimal literals"""
        fixed = False
        try:
            with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()

            # Pattern: numbers with leading zeros (not 0x, 0o, 0b)
            pattern = r'\b0+(\d+)\b'

            def replace_zeros(match):
                nonlocal fixed
                num = match.group(1)
                if num:  # If there's a number after zeros
                    fixed = True
                    self.fix_counts['fixed_leading_zeros'] += 1
                    # Convert to octal notation if it looks like octal
                    if all(c in '1234567' for c in num):
                        return f"0o{num}"
                    else:
                        return num
                return match.group(0)

            new_content = re.sub(pattern, replace_zeros, content)

            if fixed:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(new_content)

        except Exception as e:
            print(f"Error fixing leading zeros in {filepath}: {e}")

        return fixed

    def fix_string_literals(self, filepath):
        """Fix unterminated string literals"""
        fixed = False
        try:
            with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                lines = f.readlines()

            valid, error = self.validate_syntax(filepath)
            if valid:
                return False

            if error and 'unterminated string literal' in str(error):
                line_idx = error.lineno - 1 if error.lineno else None

                if line_idx and 0 <= line_idx < len(lines):
                    line = lines[line_idx]

                    # Count quotes
                    single_quotes = line.count("'") - line.count("\\'")
                    double_quotes = line.count('"') - line.count('\\"')

                    # Add missing closing quote
                    if single_quotes % 2 != 0:
                        lines[line_idx] = line.rstrip() + "'\n"
                        fixed = True
                        self.fix_counts['fixed_string_literal'] += 1
                    elif double_quotes % 2 != 0:
                        lines[line_idx] = line.rstrip() + '"\n'
                        fixed = True
                        self.fix_counts['fixed_string_literal'] += 1

                if fixed:
                    with open(filepath, 'w', encoding='utf-8') as f:
                        f.writelines(lines)

        except Exception as e:
            print(f"Error fixing string literals in {filepath}: {e}")

        return fixed

    def fix_missing_commas(self, filepath):
        """Fix missing commas in lists and dicts"""
        fixed = False
        try:
            valid, error = self.validate_syntax(filepath)
            if valid:
                return False

            if error and 'Perhaps you forgot a comma' in str(error.msg):
                with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                    lines = f.readlines()

                line_idx = error.lineno - 1 if error.lineno else None

                if line_idx and 0 <= line_idx < len(lines):
                    line = lines[line_idx]

                    # Simple heuristic: add comma before newline in lists/dicts
                    if any(char in line for char in '[{'):
                        if not line.rstrip().endswith(',') and not line.rstrip().endswith(('[', '{')):
                            lines[line_idx] = line.rstrip() + ',\n'
                            fixed = True
                            self.fix_counts['added_missing_comma'] += 1

                if fixed:
                    with open(filepath, 'w', encoding='utf-8') as f:
                        f.writelines(lines)

        except Exception as e:
            print(f"Error fixing missing commas in {filepath}: {e}")

        return fixed

    def fix_file(self, filepath):
        """Apply all fixes to a single file"""
        filepath = Path(filepath)

        # Check initial syntax
        valid, error = self.validate_syntax(filepath)
        if valid:
            return True  # File is already valid

        print(f"Fixing {filepath.name}: {error.msg if error else 'Unknown error'}")

        # Backup file
        self.backup_file(filepath)

        # Apply fixes in order of priority
        fixes_applied = False

        # 1. Fix unterminated triple quotes (most common)
        if 'unterminated triple-quoted string' in str(error):
            if self.fix_unterminated_triple_quotes(filepath):
                fixes_applied = True

        # 2. Fix unterminated string literals
        if 'unterminated string literal' in str(error):
            if self.fix_string_literals(filepath):
                fixes_applied = True

        # 3. Fix indentation issues
        if 'unexpected indent' in str(error) or 'expected an indented block' in str(error):
            if self.fix_indentation_issues(filepath):
                fixes_applied = True

        # 4. Fix decimal literals
        if 'invalid decimal literal' in str(error):
            if self.fix_decimal_literals(filepath):
                fixes_applied = True

        # 5. Fix leading zeros
        if 'leading zeros' in str(error):
            if self.fix_leading_zeros(filepath):
                fixes_applied = True

        # 6. Fix missing commas
        if 'Perhaps you forgot a comma' in str(error):
            if self.fix_missing_commas(filepath):
                fixes_applied = True

        # 7. Try generic indentation fix for remaining issues
        if not fixes_applied:
            if self.fix_indentation_issues(filepath):
                fixes_applied = True

        # Validate after fixes
        valid, error = self.validate_syntax(filepath)

        if valid:
            self.fixed_files.append(filepath)
            return True
        else:
            self.error_files.append((filepath, str(error)))
            return False

    def fix_all_files(self, batch_size=50):
        """Fix all Python files with syntax errors"""
        print(f"\nStarting Master Syntax Fixer")
        print(f"Root directory: {self.root_dir}")
        print(f"Backup directory: {self.backup_dir}")
        print("="*60)

        # Collect all Python files with errors
        error_files = []
        total_files = 0

        for root, dirs, files in os.walk(self.root_dir):
            # Skip certain directories
            if any(skip in root for skip in ['__pycache__', '.git', 'node_modules', '.venv', '.backup']):
                continue

            for file in files:
                if file.endswith('.py'):
                    total_files += 1
                    filepath = Path(root) / file
                    valid, error = self.validate_syntax(filepath)
                    if not valid:
                        error_files.append(filepath)

        print(f"Found {len(error_files)} files with syntax errors out of {total_files} total Python files")

        # Process in batches
        for i in range(0, len(error_files), batch_size):
            batch = error_files[i:i+batch_size]
            print(f"\nProcessing batch {i//batch_size + 1} ({len(batch)} files)...")

            for filepath in batch:
                self.fix_file(filepath)

            print(f"  Fixed: {len(self.fixed_files) - (i if i > 0 else 0)}")
            print(f"  Still have errors: {len(self.error_files)}")

        # Print summary
        self.print_summary()

        return len(self.fixed_files), len(self.error_files)

    def print_summary(self):
        """Print detailed summary of fixes"""
        print("\n" + "="*60)
        print("FIX SUMMARY")
        print("="*60)

        print(f"\nFiles fixed successfully: {len(self.fixed_files)}")
        print(f"Files still with errors: {len(self.error_files)}")

        print("\nFix counts by type:")
        for fix_type, count in sorted(self.fix_counts.items()):
            print(f"  {fix_type}: {count}")

        if self.error_files:
            print(f"\nFiles still needing manual fixes ({len(self.error_files)}):")
            for filepath, error in self.error_files[:10]:
                print(f"  - {filepath.name}: {error}")
            if len(self.error_files) > 10:
                print(f"  ... and {len(self.error_files) - 10} more")

        print("\nBackup created at:", self.backup_dir)

def main():
    """Main entry point"""
    import argparse

    parser = argparse.ArgumentParser(description='Master Syntax Fixer for Unicode Removal Damage')
    parser.add_argument('--directory', default='.', help='Root directory to fix (default: current)')
    parser.add_argument('--batch-size', type=int, default=50, help='Files to process per batch')
    parser.add_argument('--no-backup', action='store_true', help='Skip creating backups')
    parser.add_argument('--validate-only', action='store_true', help='Only validate, don\'t fix')

    args = parser.parse_args()

    if args.validate_only:
        # Just report on current state
        error_count = 0
        total_count = 0

        for root, dirs, files in os.walk(args.directory):
            if any(skip in root for skip in ['__pycache__', '.git', 'node_modules', '.venv']):
                continue

            for file in files:
                if file.endswith('.py'):
                    total_count += 1
                    filepath = Path(root) / file
                    try:
                        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                            ast.parse(f.read())
                    except SyntaxError:
                        error_count += 1

        print(f"Validation Results:")
        print(f"  Total Python files: {total_count}")
        print(f"  Files with syntax errors: {error_count}")
        print(f"  Files without errors: {total_count - error_count}")
        print(f"  Error rate: {error_count/total_count*100:.1f}%")

    else:
        # Run the fixer
        fixer = MasterSyntaxFixer(args.directory, backup=not args.no_backup)
        fixed, errors = fixer.fix_all_files(batch_size=args.batch_size)

        # Return exit code based on success
        sys.exit(0 if errors == 0 else 1)

if __name__ == "__main__":
    main()