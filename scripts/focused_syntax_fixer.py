#!/usr/bin/env python3
"""
Focused syntax error fixer for SPEK template - ignores temporary files.
"""

import ast
import os
import re
import json
from pathlib import Path
from collections import defaultdict

class FocusedSyntaxFixer:
    def __init__(self, scan_results_file):
        """Initialize with scan results."""
        with open(scan_results_file, 'r') as f:
            self.scan_results = json.load(f)

        # Filter out temporary/generated files
        self.filtered_errors = []
        ignored_patterns = ['--output-dir', '.backup_', '__pycache__', '.git', 'node_modules']

        for error in self.scan_results['all_errors']:
            file_path = error['file']
            if not any(pattern in file_path for pattern in ignored_patterns):
                self.filtered_errors.append(error)

        print(f"Filtered from {len(self.scan_results['all_errors'])} to {len(self.filtered_errors)} real source files")

        self.fixes_applied = defaultdict(list)
        self.failed_fixes = []

    def fix_specific_patterns(self, file_path, content, error_info):
        """Apply specific fixes based on known patterns."""
        lines = content.split('\n')
        error_line = error_info.get('line', 0)
        error_msg = error_info['message'].lower()

        # Pattern 1: Unterminated triple quoted strings at end of file
        if 'unterminated string literal' in error_msg:
            # Find the last non-empty line and add closing quotes
            for i in range(len(lines) - 1, -1, -1):
                line = lines[i].strip()
                if line:
                    if line.count('"""') % 2 == 1:
                        lines.append('"""')
                        break
                    elif line.count("'''") % 2 == 1:
                        lines.append("'''")
                        break

        # Pattern 2: Methods without indentation (from God Object decomposition)
        elif 'unexpected indent' in error_msg and error_line > 0:
            error_line_idx = error_line - 1
            if error_line_idx < len(lines):
                line = lines[error_line_idx]
                # If it's a method definition that should be at class level
                if line.strip().startswith('def ') and line.startswith('    '):
                    # Check if we're inside a class
                    in_class = False
                    for i in range(error_line_idx - 1, -1, -1):
                        prev_line = lines[i].strip()
                        if prev_line.startswith('class '):
                            in_class = True
                            break
                        elif prev_line.startswith('def ') and not lines[i].startswith('    '):
                            break

                    if not in_class:
                        # Remove the indentation
                        lines[error_line_idx] = line[4:]

        # Pattern 3: Missing pass statements
        elif 'expected an indented block' in error_msg and error_line > 0:
            insert_line = error_line  # This is where we need to insert pass
            if insert_line <= len(lines):
                # Find the line with colon before this
                for i in range(error_line - 2, -1, -1):
                    if lines[i].rstrip().endswith(':'):
                        # Get indentation of the line with colon
                        indent = len(lines[i]) - len(lines[i].lstrip())
                        pass_statement = ' ' * (indent + 4) + 'pass'
                        lines.insert(insert_line - 1, pass_statement)
                        break

        # Pattern 4: Invalid syntax in strings (JSON-like patterns)
        elif 'invalid syntax' in error_msg:
            for i, line in enumerate(lines):
                # Fix pattern like f.write('{'ci_mock": true, "results": []}"),
                if 'f.write(' in line and '{' in line and '"' in line:
                    # Fix unescaped quotes in JSON strings
                    lines[i] = re.sub(r"f\.write\('(\{.*)'\"", r"f.write('{\1}'", line)
                    lines[i] = re.sub(r"'(\{.*\})\"\),", r"'{\1}')", lines[i])

        return '\n'.join(lines)

    def fix_file_targeted(self, error_info):
        """Apply targeted fix to a specific file."""
        file_path = error_info['file']

        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()

            original_content = content
            fixed_content = self.fix_specific_patterns(file_path, content, error_info)

            # Test if fix worked
            try:
                ast.parse(fixed_content)

                # Write the fix
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(fixed_content)

                error_type = self.categorize_error(error_info['message'])
                self.fixes_applied[error_type].append({
                    'file': file_path,
                    'error': error_info['message'],
                    'line': error_info.get('line'),
                    'status': 'fixed'
                })
                return True, "Fixed successfully"

            except SyntaxError as e:
                # Revert if fix didn't work
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(original_content)
                return False, f"Fix validation failed: {e}"

        except Exception as e:
            return False, f"Error processing: {e}"

    def categorize_error(self, message):
        """Categorize error for reporting."""
        msg = message.lower()
        if 'unterminated' in msg:
            return 'unterminated_strings'
        elif 'unexpected indent' in msg:
            return 'indentation_errors'
        elif 'expected an indented block' in msg:
            return 'missing_indentation'
        elif 'invalid syntax' in msg or 'invalid token' in msg:
            return 'other_syntax_errors'
        else:
            return 'miscellaneous'

    def fix_all_filtered_errors(self):
        """Fix all filtered (real source) errors."""
        print(f"Fixing {len(self.filtered_errors)} real source file errors...")

        fixed = 0
        failed = 0

        for i, error in enumerate(self.filtered_errors, 1):
            if i % 25 == 0:
                print(f"Progress: {i}/{len(self.filtered_errors)}")

            success, message = self.fix_file_targeted(error)
            if success:
                fixed += 1
            else:
                failed += 1
                self.failed_fixes.append({
                    'file': error['file'],
                    'error': error['message'],
                    'reason': message
                })

        return fixed, failed

    def save_report(self, filename):
        """Save fix report."""
        report = {
            'total_attempted': len(self.filtered_errors),
            'total_fixed': sum(len(fixes) for fixes in self.fixes_applied.values()),
            'total_failed': len(self.failed_fixes),
            'success_rate': sum(len(fixes) for fixes in self.fixes_applied.values()) /
                          len(self.filtered_errors) * 100 if self.filtered_errors else 0,
            'fixes_by_category': {cat: len(fixes) for cat, fixes in self.fixes_applied.items()},
            'fixes_applied': dict(self.fixes_applied),
            'failed_fixes': self.failed_fixes
        }

        with open(filename, 'w') as f:
            json.dump(report, f, indent=2)

        return report

def main():
    fixer = FocusedSyntaxFixer('syntax_error_scan_results.json')

    print("FOCUSED SYNTAX ERROR FIXING")
    print("="*40)

    fixed, failed = fixer.fix_all_filtered_errors()

    print(f"\nRESULTS:")
    print(f"Fixed: {fixed}")
    print(f"Failed: {failed}")
    print(f"Success rate: {fixed/(fixed+failed)*100:.1f}%" if (fixed+failed) > 0 else "No fixes attempted")

    report = fixer.save_report('focused_fix_report.json')
    print(f"\nReport saved to: focused_fix_report.json")

    print(f"\nFixes by category:")
    for category, count in report['fixes_by_category'].items():
        print(f"  {category}: {count}")

if __name__ == "__main__":
    main()