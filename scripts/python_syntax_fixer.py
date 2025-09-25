#!/usr/bin/env python3
"""
Python Syntax Fixer - Fix indentation and syntax issues caused by unicode replacement
"""

from pathlib import Path
import ast
import os
import re

class PythonSyntaxFixer:
    def __init__(self, root_path):
        self.root_path = Path(root_path)
        self.stats = {'files_fixed': 0, 'total_fixes': 0}

    def fix_indentation(self, content):
        """Fix indentation issues"""
        lines = content.split('\n')
        fixed_lines = []

        for line in lines:
            # Convert any remaining unicode spaces to regular spaces
            line = line.replace('\u00a0', ' ')  # Non-breaking space
            line = line.replace('\u2000', ' ')  # En quad
            line = line.replace('\u2001', ' ')  # Em quad
            line = line.replace('\u2002', ' ')  # En space
            line = line.replace('\u2003', ' ')  # Em space
            line = line.replace('\u2004', ' ')  # Three-per-em space
            line = line.replace('\u2005', ' ')  # Four-per-em space
            line = line.replace('\u2006', ' ')  # Six-per-em space
            line = line.replace('\u2007', ' ')  # Figure space
            line = line.replace('\u2008', ' ')  # Punctuation space
            line = line.replace('\u2009', ' ')  # Thin space
            line = line.replace('\u200a', ' ')  # Hair space

            # Convert tabs to 4 spaces
            line = line.expandtabs(4)

            # Remove trailing whitespace
            line = line.rstrip()

            fixed_lines.append(line)

        return '\n'.join(fixed_lines)

    def fix_string_literals(self, content):
        """Fix string literal issues"""
        # Fix f-string issues
        content = re.sub(r'print\s*\(\s*f"([^"]*)"([^)]*)\)', r'print(f"\1"\2)', content)

        # Fix quote mismatches
        content = re.sub(r'(["\'])([^"\']*?)(["\'])', lambda m: m.group(1) + m.group(2) + m.group(1), content)

        return content

    def remove_remaining_unicode(self, content):
        """Remove any remaining unicode characters"""
        result = ""
        for char in content:
            if ord(char) > 127:
                if char.isspace():
                    result += " "
                else:
                    result += "_"  # Replace with underscore
            else:
                result += char
        return result

    def fix_file(self, file_path):
        """Fix a single Python file"""
        try:
            # Read with ASCII fallback
            with open(file_path, 'r', encoding='ascii', errors='replace') as f:
                content = f.read()
        except Exception:
            return False

        # Apply fixes
        original_content = content

        # Remove unicode
        content = self.remove_remaining_unicode(content)

        # Fix indentation
        content = self.fix_indentation(content)

        # Fix strings
        content = self.fix_string_literals(content)

        # Test if it parses
        try:
            ast.parse(content)
            syntax_ok = True
        except SyntaxError:
            syntax_ok = False

        # Write back if improved
        if content != original_content or not syntax_ok:
            try:
                with open(file_path, 'w', encoding='ascii', errors='replace') as f:
                    f.write(content)

                # Verify it now parses
                try:
                    ast.parse(content)
                    print(f"[FIXED] {file_path.name}: Syntax corrected")
                    self.stats['files_fixed'] += 1
                    return True
                except SyntaxError as e:
                    print(f"[PARTIAL] {file_path.name}: Still has syntax error at line {e.lineno}")
                    return False

            except Exception as e:
                print(f"[ERROR] Could not write {file_path}: {e}")
                return False

        return True

    def run(self):
        """Fix all problematic Python files"""
        print("=== PYTHON SYNTAX FIXER ===")

        problematic_files = [
            'cache_performance_profiler_operations.py',
            'cache_performance_profiler_utilities.py',
            'cache_performance_profiler_validation.py',
            'core_core.py',
            'core_operations.py',
            'core_validation.py',
            'cross_phase_learning_integration_operations.py',
            'incremental_analyzer_configuration.py'
        ]

        # Fix each problematic file
        for filename in problematic_files:
            matching_files = list(self.root_path.rglob(filename))
            for file_path in matching_files:
                self.fix_file(file_path)

        # Final validation
        print("\n=== FINAL VALIDATION ===")
        syntax_errors = 0
        total_checked = 0

        for filename in problematic_files:
            matching_files = list(self.root_path.rglob(filename))
            for file_path in matching_files:
                try:
                    with open(file_path, 'r', encoding='ascii', errors='replace') as f:
                        content = f.read()
                    ast.parse(content)
                    print(f"[OK] {filename}: Syntax valid")
                    total_checked += 1
                except SyntaxError as e:
                    print(f"[FAIL] {filename}: Line {e.lineno}: {e.msg}")
                    syntax_errors += 1
                    total_checked += 1
                except Exception as e:
                    print(f"[ERROR] {filename}: {e}")
                    total_checked += 1

        print(f"\nFiles checked: {total_checked}")
        print(f"Syntax errors: {syntax_errors}")
        print(f"Files fixed: {self.stats['files_fixed']}")

        return syntax_errors == 0

if __name__ == "__main__":
    import sys

    root_path = sys.argv[1] if len(sys.argv) > 1 else "."
    fixer = PythonSyntaxFixer(root_path)
    success = fixer.run()

    sys.exit(0 if success else 1)