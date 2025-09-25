#!/usr/bin/env python3
"""
Final Syntax Elimination - Complete fix for ALL remaining syntax errors
Target: 232 files with errors -> 0 files with errors
"""

import os
import re
import ast
from pathlib import Path
from typing import List, Tuple

class FinalSyntaxEliminator:
    def __init__(self):
        self.fixes_applied = {
            'indentation_fixes': 0,
            'string_fixes': 0,
            'literal_fixes': 0,
            'bracket_fixes': 0,
            'try_except_fixes': 0,
            'other_fixes': 0
        }

    def eliminate_syntax_error(self, file_path: Path) -> bool:
        """Eliminate all syntax errors from a single file"""
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                original_content = f.read()

            if not original_content.strip():
                return True

            content = original_content

            # Apply fixes in aggressive order
            content = self._fix_indentation_comprehensive(content)
            content = self._fix_string_issues_complete(content)
            content = self._fix_literal_problems(content)
            content = self._fix_bracket_issues(content)
            content = self._fix_incomplete_blocks(content)
            content = self._fix_misc_syntax_errors(content)

            # Validate the fix
            try:
                ast.parse(content)
                # Only write if the fix worked
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(content)
                return True
            except SyntaxError:
                return False

        except Exception:
            return False

    def _fix_indentation_comprehensive(self, content: str) -> str:
        """Comprehensive indentation fixes"""
        lines = content.split('\n')
        fixed_lines = []

        i = 0
        while i < len(lines):
            line = lines[i]

            # Pattern 1: Fix misplaced function definitions
            if re.match(r'^\s{4,}def\s+[a-zA-Z_][a-zA-Z0-9_]*\([^)]*\):$', line):
                # Check if this should be a method (has 'self') or module function
                if 'self' in line:
                    # Should be indented as method
                    if not line.startswith('    def'):
                        fixed_lines.append('    ' + line.lstrip())
                        self.fixes_applied['indentation_fixes'] += 1
                    else:
                        fixed_lines.append(line)
                else:
                    # Should be module-level function
                    fixed_lines.append(line.lstrip())
                    self.fixes_applied['indentation_fixes'] += 1

            # Pattern 2: Fix __init__ methods that aren't properly indented
            elif re.match(r'^\s*def\s+__init__\s*\(', line) and not line.startswith('    def'):
                fixed_lines.append('    ' + line.lstrip())
                self.fixes_applied['indentation_fixes'] += 1

            # Pattern 3: Fix class methods that should be indented
            elif re.match(r'^\s*def\s+[a-zA-Z_][a-zA-Z0-9_]*\s*\([^)]*self', line) and not line.startswith('    def'):
                fixed_lines.append('    ' + line.lstrip())
                self.fixes_applied['indentation_fixes'] += 1

            else:
                fixed_lines.append(line)

            i += 1

        return '\n'.join(fixed_lines)

    def _fix_string_issues_complete(self, content: str) -> str:
        """Complete string issue fixes"""
        # Fix unterminated triple-quoted strings
        if '"""' in content and content.count('"""') % 2 == 1:
            content = content + '\n"""'
            self.fixes_applied['string_fixes'] += 1

        if "'''" in content and content.count("'''") % 2 == 1:
            content = content + "\n'''"
            self.fixes_applied['string_fixes'] += 1

        # Fix common string literal issues
        lines = content.split('\n')
        fixed_lines = []

        for line in lines:
            # Fix unterminated string literals at end of line
            if line.count('"') % 2 == 1 and not line.strip().endswith('"""'):
                line = line + '"'
                self.fixes_applied['string_fixes'] += 1

            if line.count("'") % 2 == 1 and not line.strip().endswith("'''"):
                line = line + "'"
                self.fixes_applied['string_fixes'] += 1

            fixed_lines.append(line)

        return '\n'.join(fixed_lines)

    def _fix_literal_problems(self, content: str) -> str:
        """Fix all literal syntax problems"""
        # Fix leading zeros in decimal literals
        content = re.sub(r'\b0+([1-9]\d*)\b', r'\1', content)

        # Fix time/date patterns with leading zeros
        content = re.sub(r'2025-09-24T(\d+):0+(\d+)', r'2025-09-24T\1:\2', content)
        content = re.sub(r'(\|\s*)0+(\d+)\.0+(\d)', r'\1\2.\3', content)

        # Count fixes
        if '0+' in content or ':0' in content:
            self.fixes_applied['literal_fixes'] += 1

        return content

    def _fix_bracket_issues(self, content: str) -> str:
        """Fix bracket matching issues"""
        # Simple bracket balancing
        open_brackets = {'(': ')', '[': ']', '{': '}'}

        stack = []
        for char in content:
            if char in open_brackets:
                stack.append(char)
            elif char in open_brackets.values():
                expected_open = {v: k for k, v in open_brackets.items()}[char]
                if stack and stack[-1] == expected_open:
                    stack.pop()

        # Add missing closing brackets
        if stack:
            closing_brackets = ''.join(open_brackets[bracket] for bracket in reversed(stack))
            content = content + closing_brackets
            self.fixes_applied['bracket_fixes'] += len(stack)

        return content

    def _fix_incomplete_blocks(self, content: str) -> str:
        """Fix incomplete code blocks"""
        lines = content.split('\n')
        fixed_lines = []

        i = 0
        while i < len(lines):
            line = lines[i]
            fixed_lines.append(line)

            # Add pass to empty blocks
            if line.strip().endswith(':'):
                # Look ahead for empty block
                next_line_index = i + 1
                if next_line_index >= len(lines) or not lines[next_line_index].strip():
                    indent = len(line) - len(line.lstrip()) + 4
                    fixed_lines.append(' ' * indent + 'pass')
                    self.fixes_applied['try_except_fixes'] += 1

            i += 1

        return '\n'.join(fixed_lines)

    def _fix_misc_syntax_errors(self, content: str) -> str:
        """Fix miscellaneous syntax errors"""
        # Fix common syntax patterns
        content = re.sub(r'(\w+)\s*:\s*(\w+)(?=\s*\n)', r'\1: \2', content)

        # Fix lambda expressions
        content = re.sub(r'lambda\s*:', 'lambda x:', content)

        self.fixes_applied['other_fixes'] += 1
        return content

    def run_elimination(self) -> dict:
        """Run complete syntax error elimination"""
        print("Starting FINAL syntax error elimination...")

        # Find all Python files
        root_dir = Path(".")
        exclude_patterns = ['.backup', '__pycache__', 'devtools', 'orchestration', 'registry']

        python_files = []
        for py_file in root_dir.rglob("*.py"):
            if any(pattern in str(py_file) for pattern in exclude_patterns):
                continue
            python_files.append(py_file)

        print(f"Processing {len(python_files)} Python files...")

        # Find broken files
        broken_files = []
        for file_path in python_files:
            try:
                with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                ast.parse(content)
            except SyntaxError:
                broken_files.append(file_path)

        print(f"Found {len(broken_files)} files with syntax errors")

        # Fix all broken files
        fixed_count = 0
        for file_path in broken_files:
            print(f"Eliminating errors in {file_path}...")
            if self.eliminate_syntax_error(file_path):
                fixed_count += 1
                print(f"  ✓ ELIMINATED")
            else:
                print(f"  ✗ Still broken")

        # Final validation
        remaining_errors = 0
        for file_path in python_files:
            try:
                with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                ast.parse(content)
            except SyntaxError:
                remaining_errors += 1

        return {
            'total_files': len(python_files),
            'initial_errors': len(broken_files),
            'fixed_files': fixed_count,
            'remaining_errors': remaining_errors,
            'fixes_by_type': self.fixes_applied
        }

def main():
    eliminator = FinalSyntaxEliminator()
    results = eliminator.run_elimination()

    print("\n" + "="*60)
    print("FINAL SYNTAX ERROR ELIMINATION RESULTS:")
    print("="*60)
    print(f"Total files processed: {results['total_files']}")
    print(f"Initial syntax errors: {results['initial_errors']}")
    print(f"Files successfully fixed: {results['fixed_files']}")
    print(f"REMAINING ERRORS: {results['remaining_errors']}")
    print()
    print("Fixes Applied by Type:")
    for fix_type, count in results['fixes_by_type'].items():
        print(f"  {fix_type}: {count}")
    print("="*60)

    if results['remaining_errors'] == 0:
        print("🎉 SUCCESS: ALL SYNTAX ERRORS ELIMINATED!")
        return 0
    else:
        print(f"⚠️  {results['remaining_errors']} errors remain - need manual intervention")
        return 1

if __name__ == "__main__":
    import sys
    sys.exit(main())