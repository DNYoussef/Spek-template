#!/usr/bin/env python3
"""
Comprehensive Syntax Fixer for Python Files
===========================================
Fixes indentation issues and syntax errors across the codebase.
Targets the 70 files with indentation problems blocking validation.
"""

from pathlib import Path
from typing import List, Tuple, Optional
import os
import re
import sys
import tempfile

import py_compile

class SyntaxFixer:
    """Fix common Python syntax issues, especially indentation."""

def __init__(self):
        self.fixed_count = 0
        self.error_count = 0
        self.files_processed = []

def fix_file(self, filepath: str) -> bool:
        """Fix syntax issues in a single file."""
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()

            original_content = content

            # Fix various indentation issues
            content = self.fix_indentation(content)
            content = self.fix_triple_quotes(content)

            # Only write if changes were made
            if content != original_content:
                # Validate the fixed content
                if self.validate_python(content, filepath):
                    with open(filepath, 'w', encoding='utf-8') as f:
                        f.write(content)
                    self.fixed_count += 1
                    print(f"[FIXED] {filepath}")
                    return True
                else:
                    print(f"[FAILED] Could not auto-fix: {filepath} (manual intervention needed)")
                    self.error_count += 1
                    return False
            else:
                # Check if file compiles as-is
                if self.validate_file(filepath):
                    return True
                else:
                    print(f"[ERROR] Syntax error in: {filepath}")
                    self.error_count += 1
                    return False

        except Exception as e:
            print(f"[ERROR] Processing {filepath}: {e}")
            self.error_count += 1
            return False

def fix_indentation(self, content: str) -> str:
        """Fix the specific indentation issue where everything is indented after docstring."""
        lines = content.split('\n')
        fixed_lines = []
        
        # Look for the pattern where everything after docstring is indented
        in_docstring = False
        docstring_end_found = False
        base_indent = 0
        
        for i, line in enumerate(lines):
            # Handle docstring detection
            if '"""' in line and line.strip().startswith('"""'):
                if not in_docstring:
                    in_docstring = True
                    fixed_lines.append(line)
                    if line.count('"""') == 2:  # Single line docstring
                        in_docstring = False
                        docstring_end_found = True
                else:
                    in_docstring = False
                    docstring_end_found = True
                    fixed_lines.append(line)
            elif in_docstring:
                fixed_lines.append(line)
            elif docstring_end_found and line.strip():
                # After docstring, unindent everything that was incorrectly indented
                stripped = line.strip()
                if stripped.startswith(('import ', 'from ', 'class ', 'def ', '@')):
                    # These should be at module level
                    fixed_lines.append(stripped)
                elif stripped.startswith('class ') and '(Enum)' in stripped:
                    # Enum classes at module level
                    fixed_lines.append(stripped)
                else:
                    fixed_lines.append(line)
            else:
                fixed_lines.append(line)
                
        return '\n'.join(fixed_lines)

def fix_triple_quotes(self, content: str) -> str:
        """Fix malformed triple quotes."""
        # Fix quadruple quotes (common issue found)
        content = content.replace('"""', '"""')
        content = content.replace("'''", "'''")
        return content

def validate_python(self, content: str, filepath: str) -> bool:
        """Validate Python syntax without writing to disk."""
        try:
            compile(content, filepath, 'exec')
            return True
        except SyntaxError:
            return False

def validate_file(self, filepath: str) -> bool:
        """Validate a Python file."""
        try:
            py_compile.compile(filepath, doraise=True)
            return True
        except py_compile.PyCompileError:
            return False

def process_directory(self, directory: str):
        """Process all Python files in a directory."""
        path = Path(directory)
        files = list(path.rglob("*.py"))

        print(f"\nProcessing {len(files)} Python files in {directory}...")
        print("=" * 60)

        for filepath in files:
            self.files_processed.append(str(filepath))
            self.fix_file(str(filepath))

        print("\n" + "=" * 60)
        print(f"SUMMARY:")
        print(f"  Files processed: {len(self.files_processed)}")
        print(f"  Files fixed: {self.fixed_count}")
        print(f"  Files with errors: {self.error_count}")

def main():
    """Main entry point."""
    fixer = SyntaxFixer()

    # Priority files with known issues
    priority_files = [
        "analyzer/performance/ci_cd_accelerator.py",
        "scripts/performance_monitor.py",
        "scripts/unicode_removal_linter.py"
    ]

    # First fix priority files
    print("Fixing priority files with known syntax issues...")
    for filepath in priority_files:
        if os.path.exists(filepath):
            fixer.fix_file(filepath)

    # Then process all directories
    fixer.process_directory("analyzer")
    fixer.process_directory("src")
    fixer.process_directory("scripts")

    return 0 if fixer.error_count == 0 else 1

if __name__ == "__main__":
    sys.exit(main())
