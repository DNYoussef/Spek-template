#!/usr/bin/env python3
"""
Comprehensive Syntax Error Fixer
Systematically fixes all remaining Python syntax errors
"""

import os
import re
import ast
import sys
from pathlib import Path
from typing import List, Dict, Set, Tuple

class ComprehensiveSyntaxFixer:
    def __init__(self, root_dir: str):
        self.root_dir = Path(root_dir)
        self.fixed_files = 0
        self.total_errors = 0
        self.error_patterns = {
            'unterminated_string': 0,
            'invalid_literal': 0,
            'indentation': 0,
            'bracket_mismatch': 0,
            'incomplete_block': 0
        }

    def find_python_files(self) -> List[Path]:
        """Find all Python files excluding backup directories"""
        files = []
        exclude_patterns = ['.backup', 'devtools', 'orchestration', 'registry', '__pycache__']

        for py_file in self.root_dir.rglob("*.py"):
            if any(pattern in str(py_file) for pattern in exclude_patterns):
                continue
            files.append(py_file)
        return files

    def check_syntax(self, file_path: Path) -> Tuple[bool, str]:
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

    def fix_unterminated_strings(self, content: str) -> str:
        """Fix unterminated string literals"""
        lines = content.split('\n')
        fixed_lines = []
        in_multiline = False
        quote_type = None

        for i, line in enumerate(lines):
            if '"""' in line and not in_multiline:
                # Check if it's properly terminated
                quote_count = line.count('"""')
                if quote_count % 2 == 1:  # Odd number means unterminated
                    in_multiline = True
                    quote_type = '"""'
            elif "'''" in line and not in_multiline:
                quote_count = line.count("'''")
                if quote_count % 2 == 1:
                    in_multiline = True
                    quote_type = "'''"
            elif in_multiline and quote_type in line:
                in_multiline = False
                quote_type = None

            # Fix unterminated strings at end of file
            if i == len(lines) - 1 and in_multiline:
                line = line + '\n' + quote_type
                in_multiline = False

            fixed_lines.append(line)

        return '\n'.join(fixed_lines)

    def fix_invalid_literals(self, content: str) -> str:
        """Fix invalid number literals (leading zeros)"""
        # Fix decimal literals with leading zeros
        pattern = r'\b0+([1-9]\d*)\b'
        content = re.sub(pattern, r'\1', content)

        # Fix in markdown tables (version logs)
        pattern = r'\|\s*(\d+)\.0+(\d)\s*\|'
        content = re.sub(pattern, r'| \1.\2 |', content)

        return content

    def fix_indentation_errors(self, content: str) -> str:
        """Fix indentation and incomplete blocks"""
        lines = content.split('\n')
        fixed_lines = []

        for i, line in enumerate(lines):
            fixed_lines.append(line)

            # Add pass to empty blocks
            if line.strip().endswith(':') and (i == len(lines) - 1 or not lines[i + 1].strip()):
                if i + 1 < len(lines):
                    next_line = lines[i + 1] if i + 1 < len(lines) else ""
                    if not next_line.strip():
                        indent = len(line) - len(line.lstrip()) + 4
                        fixed_lines.append(' ' * indent + 'pass')

            # Fix try blocks without except
            if line.strip().startswith('try:'):
                found_except = False
                for j in range(i + 1, min(i + 20, len(lines))):
                    if lines[j].strip().startswith(('except', 'finally')):
                        found_except = True
                        break
                    elif lines[j].strip() and not lines[j].startswith(' '):
                        break

                if not found_except:
                    indent = len(line) - len(line.lstrip()) + 4
                    fixed_lines.append(' ' * indent + 'pass')
                    fixed_lines.append(' ' * (indent - 4) + 'except Exception:')
                    fixed_lines.append(' ' * indent + 'pass')

        return '\n'.join(fixed_lines)

    def fix_bracket_mismatch(self, content: str) -> str:
        """Fix bracket mismatches"""
        # Simple bracket balancing
        open_brackets = {'(': ')', '[': ']', '{': '}'}
        close_brackets = {v: k for k, v in open_brackets.items()}

        stack = []
        lines = content.split('\n')

        for line in lines:
            for char in line:
                if char in open_brackets:
                    stack.append(char)
                elif char in close_brackets:
                    if stack and stack[-1] == close_brackets[char]:
                        stack.pop()
                    else:
                        # Mismatched bracket - for now, just clear stack
                        stack = []

        # If stack not empty, add closing brackets at end
        if stack:
            closing = ''.join(open_brackets[b] for b in reversed(stack))
            content += closing

        return content

    def fix_file(self, file_path: Path) -> bool:
        """Fix a single Python file"""
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                original_content = f.read()

            # Skip empty files
            if not original_content.strip():
                return True

            content = original_content

            # Apply fixes in order
            content = self.fix_unterminated_strings(content)
            content = self.fix_invalid_literals(content)
            content = self.fix_indentation_errors(content)
            content = self.fix_bracket_mismatch(content)

            # Test if fix worked
            try:
                ast.parse(content)
                # Write fixed content
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(content)
                return True
            except SyntaxError:
                return False

        except Exception as e:
            print(f"Error processing {file_path}: {e}")
            return False

    def run_comprehensive_fix(self) -> Dict[str, int]:
        """Run comprehensive fix on all Python files"""
        print("Starting comprehensive syntax error fix...")

        files = self.find_python_files()
        print(f"Found {len(files)} Python files to check")

        broken_files = []
        for file_path in files:
            is_valid, error_msg = self.check_syntax(file_path)
            if not is_valid:
                broken_files.append((file_path, error_msg))
                self.total_errors += 1

        print(f"Found {len(broken_files)} files with syntax errors")

        # Fix files
        for file_path, error_msg in broken_files:
            print(f"Fixing {file_path}...")
            if self.fix_file(file_path):
                self.fixed_files += 1
                print(f"  ✓ Fixed!")
            else:
                print(f"  ✗ Could not fix automatically")

        # Final validation
        print("\nValidating fixes...")
        remaining_errors = 0
        for file_path in files:
            is_valid, _ = self.check_syntax(file_path)
            if not is_valid:
                remaining_errors += 1

        return {
            'total_files': len(files),
            'initial_errors': self.total_errors,
            'fixed_files': self.fixed_files,
            'remaining_errors': remaining_errors
        }

def main():
    if len(sys.argv) > 1:
        root_dir = sys.argv[1]
    else:
        root_dir = "."

    fixer = ComprehensiveSyntaxFixer(root_dir)
    results = fixer.run_comprehensive_fix()

    print("\n" + "="*50)
    print("COMPREHENSIVE FIX RESULTS:")
    print(f"Total files checked: {results['total_files']}")
    print(f"Initial errors: {results['initial_errors']}")
    print(f"Files fixed: {results['fixed_files']}")
    print(f"Remaining errors: {results['remaining_errors']}")
    print("="*50)

    if results['remaining_errors'] == 0:
        print("🎉 SUCCESS: All syntax errors fixed!")
        return 0
    else:
        print(f"⚠️  WARNING: {results['remaining_errors']} errors remain")
        return 1

if __name__ == "__main__":
    sys.exit(main())