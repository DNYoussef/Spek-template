#!/usr/bin/env python3
"""
Comprehensive syntax error fixer for SPEK template codebase.
Applies targeted fixes for each category of syntax errors.
"""

import ast
import os
import re
import json
from pathlib import Path
from collections import defaultdict

class SyntaxErrorFixer:
    def __init__(self, scan_results_file):
        """Initialize with scan results from previous scan."""
        with open(scan_results_file, 'r') as f:
            self.scan_results = json.load(f)

        self.fixes_applied = defaultdict(list)
        self.failed_fixes = []

    def fix_unterminated_strings(self, file_path, content):
        """Fix unterminated string literals."""
        lines = content.split('\n')
        fixed_lines = []
        in_triple_quote = False
        triple_quote_type = None

        for i, line in enumerate(lines):
            original_line = line

            # Handle triple-quoted strings
            if '"""' in line or "'''" in line:
                # Find all triple quote occurrences
                for quote_type in ['"""', "'''"]:
                    count = line.count(quote_type)
                    if count > 0:
                        if not in_triple_quote:
                            if count % 2 == 1:
                                in_triple_quote = True
                                triple_quote_type = quote_type
                        else:
                            if quote_type == triple_quote_type and count % 2 == 1:
                                in_triple_quote = False
                                triple_quote_type = None

            # If we're at the end and still in a triple quote, close it
            if i == len(lines) - 1 and in_triple_quote:
                line = line + '\n' + triple_quote_type

            fixed_lines.append(line)

        return '\n'.join(fixed_lines)

    def fix_indentation_errors(self, file_path, content):
        """Fix unexpected indentation errors."""
        lines = content.split('\n')
        fixed_lines = []

        for i, line in enumerate(lines):
            # Remove leading whitespace that might be causing issues
            if line.strip() and line.startswith('    ') and i > 0:
                prev_line = lines[i-1].strip() if i > 0 else ""

                # If previous line doesn't end with colon, this might be wrong indentation
                if prev_line and not prev_line.endswith(':') and not prev_line.endswith('\\'):
                    # Check if this should be at module level
                    if line.strip().startswith(('def ', 'class ', 'import ', 'from ')):
                        line = line.lstrip()

            fixed_lines.append(line)

        return '\n'.join(fixed_lines)

    def fix_missing_indentation(self, file_path, content):
        """Fix missing indented blocks by adding pass statements."""
        lines = content.split('\n')
        fixed_lines = []

        for i, line in enumerate(lines):
            fixed_lines.append(line)

            # If line ends with colon and next line isn't indented, add pass
            if line.strip().endswith(':'):
                next_line_idx = i + 1
                # Skip empty lines
                while next_line_idx < len(lines) and not lines[next_line_idx].strip():
                    next_line_idx += 1

                if next_line_idx < len(lines):
                    next_line = lines[next_line_idx]
                    # If next line isn't indented relative to current line
                    current_indent = len(line) - len(line.lstrip())
                    next_indent = len(next_line) - len(next_line.lstrip()) if next_line.strip() else 0

                    if next_line.strip() and next_indent <= current_indent:
                        # Add pass statement with proper indentation
                        pass_indent = ' ' * (current_indent + 4)
                        fixed_lines.append(pass_indent + 'pass')
                elif next_line_idx >= len(lines):
                    # End of file, add pass
                    current_indent = len(line) - len(line.lstrip())
                    pass_indent = ' ' * (current_indent + 4)
                    fixed_lines.append(pass_indent + 'pass')

        return '\n'.join(fixed_lines)

    def fix_invalid_literals(self, file_path, content):
        """Fix invalid decimal literals and tokens."""
        # Fix leading zeros in numbers
        content = re.sub(r'\b0+(\d+)', r'\1', content)

        # Fix invalid tokens that might be from Unicode removal
        # Common patterns after Unicode character removal
        content = re.sub(r'[^\x00-\x7F]+', '', content)  # Remove any remaining non-ASCII

        # Fix common token issues
        content = re.sub(r'([a-zA-Z_]\w*)\s*([a-zA-Z_]\w*)\s*=', r'\1_\2 =', content)

        return content

    def fix_bracket_errors(self, file_path, content):
        """Fix unmatched brackets and parentheses."""
        # Simple bracket matching and fixing
        stack = []
        bracket_map = {'(': ')', '[': ']', '{': '}'}
        reverse_map = {v: k for k, v in bracket_map.items()}

        lines = content.split('\n')
        fixed_lines = []

        for line in lines:
            fixed_line = line

            # Count brackets in line
            for char in line:
                if char in bracket_map:
                    stack.append(char)
                elif char in reverse_map:
                    if stack and stack[-1] == reverse_map[char]:
                        stack.pop()

            fixed_lines.append(fixed_line)

        # Add missing closing brackets at the end if needed
        while stack:
            bracket = stack.pop()
            closing = bracket_map[bracket]
            fixed_lines.append(closing)

        return '\n'.join(fixed_lines)

    def fix_other_syntax_errors(self, file_path, content):
        """Fix miscellaneous syntax errors."""
        # Fix common comma issues in dictionaries
        content = re.sub(r"(\{[^}]*)'(\w+[^}]*\})", r'\1"\2', content)

        # Fix malformed f-strings and JSON-like strings
        content = re.sub(r"f'(\{[^}]*)'", r'f"\1"', content)
        content = re.sub(r'f"(\{[^}]*)"([^,\)\]\}])', r'f"\1"\2', content)

        # Fix specific JSON string issues like: f.write('{'ci_mock": true, "results": []}"),
        content = re.sub(r"f\.write\('(\{[^}]*\})\"\),", r'f.write(\'{\1"}\')', content)
        content = re.sub(r"f\.write\('(\{[^}]*)'\"", r'f.write(\'{\1}\'', content)

        # Fix escaped quotes in strings
        content = re.sub(r'\'(\{[^}]*)"([^}]*)\}\'', r'\'{\1"\2}\'', content)

        return content

    def fix_file(self, error_info):
        """Apply appropriate fix to a file based on error type."""
        file_path = error_info['file']

        # Skip --output-dir files as they seem to be temporary
        if '--output-dir' in file_path:
            return False, "Skipped temporary output directory file"

        try:
            # Read current file content
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()

            original_content = content

            # Apply fixes based on error message
            error_msg = error_info['message'].lower()

            if 'unterminated' in error_msg and 'string' in error_msg:
                content = self.fix_unterminated_strings(file_path, content)
                fix_type = 'unterminated_strings'
            elif 'unexpected indent' in error_msg:
                content = self.fix_indentation_errors(file_path, content)
                fix_type = 'indentation_errors'
            elif 'expected an indented block' in error_msg:
                content = self.fix_missing_indentation(file_path, content)
                fix_type = 'missing_indentation'
            elif 'invalid decimal literal' in error_msg or 'invalid token' in error_msg:
                content = self.fix_invalid_literals(file_path, content)
                fix_type = 'invalid_literals'
            elif 'unmatched' in error_msg or 'closing' in error_msg:
                content = self.fix_bracket_errors(file_path, content)
                fix_type = 'bracket_errors'
            else:
                content = self.fix_other_syntax_errors(file_path, content)
                fix_type = 'other_syntax_errors'

            # Validate the fix by trying to parse
            try:
                ast.parse(content)
                # Fix successful, write back to file
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(content)

                self.fixes_applied[fix_type].append({
                    'file': file_path,
                    'error': error_info['message'],
                    'line': error_info.get('line'),
                    'status': 'fixed'
                })
                return True, f"Fixed {fix_type}"

            except SyntaxError as e:
                # Fix didn't work, revert
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(original_content)
                return False, f"Fix validation failed: {e}"

        except Exception as e:
            return False, f"Error processing file: {e}"

    def fix_all_errors(self):
        """Fix all errors from scan results."""
        print(f"Starting to fix {len(self.scan_results['all_errors'])} syntax errors...")

        # Process errors by category for better success rate
        categories = [
            'unterminated_strings',  # Usually easy to fix
            'missing_indentation',   # Add pass statements
            'invalid_literals',      # Number format issues
            'bracket_errors',        # Matching issues
            'indentation_errors',    # More complex
            'other_syntax_errors'    # Miscellaneous
        ]

        total_fixed = 0
        total_failed = 0

        for category in categories:
            category_errors = [e for e in self.scan_results['all_errors']
                             if self.categorize_error(e['message']) == category]

            if category_errors:
                print(f"\nFixing {len(category_errors)} {category} errors...")

                for i, error in enumerate(category_errors, 1):
                    if i % 25 == 0:
                        print(f"  Progress: {i}/{len(category_errors)}")

                    success, message = self.fix_file(error)
                    if success:
                        total_fixed += 1
                    else:
                        total_failed += 1
                        self.failed_fixes.append({
                            'file': error['file'],
                            'error': error['message'],
                            'fix_attempt': message
                        })

        return total_fixed, total_failed

    def categorize_error(self, message):
        """Categorize error message into fix category."""
        msg = message.lower()
        if 'unterminated' in msg and 'string' in msg:
            return 'unterminated_strings'
        elif 'unexpected indent' in msg:
            return 'indentation_errors'
        elif 'expected an indented block' in msg:
            return 'missing_indentation'
        elif 'invalid decimal literal' in msg or 'invalid token' in msg:
            return 'invalid_literals'
        elif 'unmatched' in msg or 'closing' in msg:
            return 'bracket_errors'
        else:
            return 'other_syntax_errors'

    def save_fix_report(self, output_file):
        """Save comprehensive fix report."""
        report = {
            'fixes_applied': dict(self.fixes_applied),
            'failed_fixes': self.failed_fixes,
            'summary': {
                'total_fixes_attempted': sum(len(fixes) for fixes in self.fixes_applied.values()) + len(self.failed_fixes),
                'total_successful_fixes': sum(len(fixes) for fixes in self.fixes_applied.values()),
                'total_failed_fixes': len(self.failed_fixes),
                'success_rate': sum(len(fixes) for fixes in self.fixes_applied.values()) /
                              (sum(len(fixes) for fixes in self.fixes_applied.values()) + len(self.failed_fixes)) * 100
                              if (sum(len(fixes) for fixes in self.fixes_applied.values()) + len(self.failed_fixes)) > 0 else 0
            }
        }

        with open(output_file, 'w') as f:
            json.dump(report, f, indent=2)

        return report

def main():
    fixer = SyntaxErrorFixer('syntax_error_scan_results.json')

    print("COMPREHENSIVE SYNTAX ERROR FIXING")
    print("="*50)

    fixed, failed = fixer.fix_all_errors()

    print(f"\nFIX SUMMARY:")
    print(f"Total fixed: {fixed}")
    print(f"Total failed: {failed}")
    print(f"Success rate: {fixed/(fixed+failed)*100:.1f}%" if (fixed+failed) > 0 else "No fixes attempted")

    # Save detailed report
    report = fixer.save_fix_report('syntax_fix_report.json')
    print(f"\nDetailed report saved to: syntax_fix_report.json")

    # Print category summaries
    print(f"\nFixes by category:")
    for category, fixes in fixer.fixes_applied.items():
        print(f"  {category}: {len(fixes)} fixes")

if __name__ == "__main__":
    main()