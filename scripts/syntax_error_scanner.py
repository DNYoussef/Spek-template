#!/usr/bin/env python3
"""
Comprehensive syntax error scanner for SPEK template codebase.
Identifies all Python files with syntax errors and categorizes error types.
"""

import ast
import os
import sys
import json
from pathlib import Path
from collections import defaultdict
import traceback

class SyntaxErrorScanner:
    def __init__(self, root_dir):
        self.root_dir = Path(root_dir)
        self.errors = []
        self.error_categories = defaultdict(list)
        self.valid_files = []
        self.total_files = 0

    def scan_file(self, file_path):
        """Scan a single Python file for syntax errors."""
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()

            # Try to parse with AST
            ast.parse(content, filename=str(file_path))
            self.valid_files.append(str(file_path))
            return None

        except SyntaxError as e:
            error_info = {
                'file': str(file_path),
                'error_type': type(e).__name__,
                'message': str(e.msg) if e.msg else 'Unknown syntax error',
                'line': e.lineno,
                'column': e.offset,
                'text': e.text.strip() if e.text else None
            }

            # Categorize error types
            msg = error_info['message'].lower()
            if 'unterminated' in msg and 'string' in msg:
                category = 'unterminated_strings'
            elif 'unexpected indent' in msg:
                category = 'indentation_errors'
            elif 'expected an indented block' in msg:
                category = 'missing_indentation'
            elif 'invalid decimal literal' in msg or 'invalid token' in msg:
                category = 'invalid_literals'
            elif 'unmatched' in msg or 'closing' in msg:
                category = 'bracket_errors'
            elif 'eof while scanning' in msg:
                category = 'incomplete_statements'
            else:
                category = 'other_syntax_errors'

            self.error_categories[category].append(error_info)
            self.errors.append(error_info)
            return error_info

        except Exception as e:
            # Non-syntax errors (encoding, etc.)
            return {
                'file': str(file_path),
                'error_type': 'ParseError',
                'message': str(e),
                'line': None,
                'column': None,
                'text': None
            }

    def scan_directory(self):
        """Scan entire directory tree for Python files."""
        python_files = list(self.root_dir.rglob("*.py"))
        self.total_files = len(python_files)

        print(f"Scanning {self.total_files} Python files...")

        for i, py_file in enumerate(python_files, 1):
            if i % 50 == 0:
                print(f"Progress: {i}/{self.total_files} files scanned...")

            error = self.scan_file(py_file)

        return self.get_summary()

    def get_summary(self):
        """Generate summary of scan results."""
        summary = {
            'total_files': self.total_files,
            'files_with_errors': len(self.errors),
            'valid_files': len(self.valid_files),
            'error_rate': len(self.errors) / self.total_files * 100 if self.total_files > 0 else 0,
            'categories': {cat: len(errors) for cat, errors in self.error_categories.items()},
            'all_errors': self.errors
        }
        return summary

    def save_results(self, output_file):
        """Save scan results to JSON file."""
        summary = self.get_summary()
        with open(output_file, 'w') as f:
            json.dump(summary, f, indent=2)
        return summary

def main():
    if len(sys.argv) > 1:
        root_dir = sys.argv[1]
    else:
        root_dir = "."

    scanner = SyntaxErrorScanner(root_dir)
    summary = scanner.scan_directory()

    # Save results
    output_file = "syntax_error_scan_results.json"
    scanner.save_results(output_file)

    # Print summary
    print(f"\n{'='*60}")
    print("SYNTAX ERROR SCAN COMPLETE")
    print(f"{'='*60}")
    print(f"Total Python files: {summary['total_files']}")
    print(f"Files with syntax errors: {summary['files_with_errors']}")
    print(f"Valid files: {summary['valid_files']}")
    print(f"Error rate: {summary['error_rate']:.1f}%")
    print(f"\nError categories:")
    for category, count in summary['categories'].items():
        print(f"  {category}: {count}")

    print(f"\nDetailed results saved to: {output_file}")

    if summary['files_with_errors'] > 0:
        print(f"\nFirst 10 files with errors:")
        for i, error in enumerate(summary['all_errors'][:10]):
            print(f"  {i+1}. {error['file']}: {error['message']}")

if __name__ == "__main__":
    main()