#!/usr/bin/env python3
"""
Fix Syntax Errors Script for Phase 5 Day 9
Fixes malformed constant references in Python files
"""

from pathlib import Path
from typing import List, Tuple, Dict
import os
import re

class SyntaxErrorFixer:
    """Fixes syntax errors in Python files"""

    def __init__(self):
        self.patterns_to_fix = [
            (r'0\.MINIMUM_TEST_COVERAGE_PERCENTAGE', '0.8'),  # 80%
            (r'0\.MAXIMUM_NESTED_DEPTH', '0.5'),             # 50%
            (r'0\.MAXIMUM_RETRY_ATTEMPTS', '0.2'),           # 20%
            (r'0\.NASA_POT10_TARGET_COMPLIANCE_THRESHOLD', '0.9'),  # 90%
            (r'0\.REGULATORY_FACTUALITY_REQUIREMENT', '0.9'),       # 90%
            (r'0\.THEATER_DETECTION_WARNING_THRESHOLD', '0.7'),     # 70%
            (r'0\.THEATER_DETECTION_FAILURE_THRESHOLD', '0.6'),     # 60%
            (r'MAXIMUM_FUNCTION_LENGTH_LINES\.0', '60.0'),          # Function length
            (r'MINIMUM_TEST_COVERAGE_PERCENTAGE\.0', '0.8'),        # Test coverage
        ]
        self.files_fixed = 0
        self.total_fixes = 0

    def fix_syntax_errors(self, root_path: str = '.') -> Dict[str, int]:
        """Fix syntax errors in all Python files"""
        print("Fixing syntax errors in Python files...")

        # Find all Python files
        python_files = list(Path(root_path).rglob('*.py'))
        print(f"Found {len(python_files)} Python files to check")

        # Process each file
        for file_path in python_files:
            if self._should_skip_file(file_path):
                continue

            fixes_made = self._fix_file_syntax_errors(file_path)
            if fixes_made > 0:
                self.files_fixed += 1
                self.total_fixes += fixes_made

        return {
            'files_processed': len(python_files),
            'files_fixed': self.files_fixed,
            'total_fixes': self.total_fixes
        }

    def _should_skip_file(self, file_path: Path) -> bool:
        """Check if file should be skipped"""
        skip_patterns = [
            '__pycache__', '.git', 'dist', 'build', '--output-dir',
            '.naming_standardization_backup', '.pytest_cache'
        ]

        return any(pattern in str(file_path) for pattern in skip_patterns)

    def _fix_file_syntax_errors(self, file_path: Path) -> int:
        """Fix syntax errors in a single file"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()

            original_content = content
            fixes_made = 0

            # Apply each pattern fix
            for pattern, replacement in self.patterns_to_fix:
                new_content, count = re.subn(pattern, replacement, content)
                if count > 0:
                    content = new_content
                    fixes_made += count

            # Save file if changes were made
            if fixes_made > 0:
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(content)

                print(f"Fixed {fixes_made} syntax errors in {file_path}")

            return fixes_made

        except Exception as e:
            print(f"Error processing {file_path}: {e}")
            return 0

def main():
    """Main execution function"""
    fixer = SyntaxErrorFixer()
    results = fixer.fix_syntax_errors()

    print(f"\n=== SYNTAX ERROR FIX SUMMARY ===")
    print(f"Files processed: {results['files_processed']}")
    print(f"Files fixed: {results['files_fixed']}")
    print(f"Total fixes applied: {results['total_fixes']}")

if __name__ == "__main__":
    main()