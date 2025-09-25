#!/usr/bin/env python3
"""
Simple Syntax Error Fixer - No Unicode
Systematically fixes Python syntax errors
"""

import os
import re
import ast
import sys
from pathlib import Path

class SimpleSyntaxFixer:
    def __init__(self, root_dir: str):
        self.root_dir = Path(root_dir)
        self.fixed_files = 0
        self.total_errors = 0

    def find_python_files(self):
        """Find all Python files excluding backup directories"""
        files = []
        exclude_patterns = ['.backup', 'devtools', 'orchestration', 'registry', '__pycache__']

        for py_file in self.root_dir.rglob("*.py"):
            if any(pattern in str(py_file) for pattern in exclude_patterns):
                continue
            files.append(py_file)
        return files

    def check_syntax(self, file_path):
        """Check if file has valid Python syntax"""
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
            ast.parse(content)
            return True, ""
        except SyntaxError as e:
            return False, str(e)
        except Exception as e:
            return False, f"Other error: {str(e)}"

    def fix_unterminated_strings(self, content):
        """Fix unterminated string literals"""
        lines = content.split('\n')
        fixed_lines = []

        for i, line in enumerate(lines):
            # Simple fix for most common cases
            if line.strip().endswith('"""') and line.count('"""') == 1:
                # Check if it's actually unterminated by looking ahead
                found_end = False
                for j in range(i + 1, min(i + 10, len(lines))):
                    if '"""' in lines[j]:
                        found_end = True
                        break
                if not found_end and i < len(lines) - 1:
                    fixed_lines.append(line)
                    fixed_lines.append('    """')  # Add closing
                    continue

            fixed_lines.append(line)

        return '\n'.join(fixed_lines)

    def fix_invalid_literals(self, content):
        """Fix invalid number literals"""
        # Fix leading zeros in decimal literals
        content = re.sub(r'\b0+([1-9]\d*)\b', r'\1', content)

        # Fix in version numbers (common pattern)
        content = re.sub(r'(\|\s*)0+(\d)\.0+(\d)', r'\g<1>\2.\3', content)

        return content

    def fix_indentation_basic(self, content):
        """Basic indentation fixes"""
        lines = content.split('\n')
        fixed_lines = []

        for i, line in enumerate(lines):
            fixed_lines.append(line)

            # Add pass to functions/classes with no body
            if line.strip().endswith(':'):
                next_line = lines[i + 1] if i + 1 < len(lines) else ""
                if not next_line.strip():
                    indent = len(line) - len(line.lstrip()) + 4
                    fixed_lines.append(' ' * indent + 'pass')

        return '\n'.join(fixed_lines)

    def fix_file(self, file_path):
        """Fix a single Python file"""
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                original_content = f.read()

            if not original_content.strip():
                return True

            content = original_content
            content = self.fix_unterminated_strings(content)
            content = self.fix_invalid_literals(content)
            content = self.fix_indentation_basic(content)

            # Test if fix worked
            try:
                ast.parse(content)
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(content)
                return True
            except SyntaxError:
                return False

        except Exception as e:
            print(f"Error processing {file_path}: {e}")
            return False

    def run_fix(self):
        """Run fix on all Python files"""
        print("Starting syntax error fix...")

        files = self.find_python_files()
        print(f"Found {len(files)} Python files")

        # Count initial errors
        broken_files = []
        for file_path in files:
            is_valid, error_msg = self.check_syntax(file_path)
            if not is_valid:
                broken_files.append(file_path)
                self.total_errors += 1

        print(f"Found {len(broken_files)} files with syntax errors")

        # Fix files
        for file_path in broken_files:
            print(f"Fixing {file_path}...")
            if self.fix_file(file_path):
                self.fixed_files += 1
                print("  FIXED!")
            else:
                print("  FAILED")

        # Check remaining
        remaining = 0
        for file_path in files:
            is_valid, _ = self.check_syntax(file_path)
            if not is_valid:
                remaining += 1

        print(f"\nRESULTS:")
        print(f"Total files: {len(files)}")
        print(f"Initial errors: {self.total_errors}")
        print(f"Fixed: {self.fixed_files}")
        print(f"Remaining: {remaining}")

        return remaining == 0

def main():
    fixer = SimpleSyntaxFixer(".")
    success = fixer.run_fix()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())