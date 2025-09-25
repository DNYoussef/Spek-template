#!/usr/bin/env python3
"""
Targeted Syntax Fixer - Handle specific remaining issues from the master fixer
"""

import os
import re
import ast
from pathlib import Path

class TargetedSyntaxFixer:
    """Fix specific remaining syntax issues"""

    def __init__(self, root_dir='.'):
        self.root_dir = Path(root_dir)
        self.fixed_files = []
        self.error_files = []

    def validate_syntax(self, filepath):
        """Check if file has valid Python syntax"""
        try:
            with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
            ast.parse(content)
            return True, None
        except SyntaxError as e:
            return False, e

    def fix_orphaned_methods(self, filepath):
        """Fix methods with self parameter that aren't in classes"""
        fixed = False
        try:
            with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                lines = f.readlines()

            new_lines = []
            in_class = False
            added_dummy_class = False

            for i, line in enumerate(lines):
                # Check for class definitions
                if line.strip().startswith('class '):
                    in_class = True
                    new_lines.append(line)
                    continue

                # Check for top-level functions with self parameter
                if (line.startswith('def ') and '(self' in line and not in_class):
                    # Add a dummy class if we haven't already
                    if not added_dummy_class:
                        new_lines.append('\n')
                        new_lines.append('class ExtractedOperations:\n')
                        new_lines.append('    """Auto-generated class for extracted methods"""\n')
                        new_lines.append('\n')
                        added_dummy_class = True

                    # Indent the method
                    new_lines.append('    ' + line)
                    fixed = True
                elif (line.strip().startswith('def ') and '(self' in line and not in_class):
                    # Handle already indented orphaned methods
                    if not added_dummy_class:
                        new_lines.append('\n')
                        new_lines.append('class ExtractedOperations:\n')
                        new_lines.append('    """Auto-generated class for extracted methods"""\n')
                        new_lines.append('\n')
                        added_dummy_class = True

                    new_lines.append('    ' + line.lstrip())
                    fixed = True
                else:
                    # Check if we're leaving class scope
                    if in_class and line.strip() and not line.startswith(' ') and not line.startswith('\t'):
                        if not line.strip().startswith('#') and not line.strip().startswith('from ') and not line.strip().startswith('import '):
                            in_class = False

                    # If we added a dummy class and this looks like it belongs to it
                    if added_dummy_class and line.strip() and not line.startswith('class ') and not line.startswith('def '):
                        if not line.strip().startswith(('from ', 'import ', '#', '"""', "'''")):
                            # Check if it looks like it should be indented inside class
                            if any(keyword in line for keyword in ['return', 'self.', 'if ', 'for ', 'while ', 'try:']):
                                if not line.startswith(' '):
                                    new_lines.append('    ' + line)
                                    fixed = True
                                    continue

                    new_lines.append(line)

            if fixed:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.writelines(new_lines)
                return True

        except Exception as e:
            print(f"Error fixing orphaned methods in {filepath}: {e}")

        return False

    def fix_floating_docstrings(self, filepath):
        """Fix docstrings that are floating without functions"""
        fixed = False
        try:
            with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                lines = f.readlines()

            new_lines = []
            i = 0
            while i < len(lines):
                line = lines[i]

                # Check for floating docstrings (triple quotes not followed by function/class)
                if line.strip().startswith('"""') and not line.strip() == '"""':
                    # Look ahead to see if there's a function definition soon
                    next_def_line = None
                    for j in range(i + 1, min(i + 5, len(lines))):
                        if lines[j].strip().startswith('def '):
                            next_def_line = j
                            break

                    if next_def_line:
                        # Move the docstring to be inside the function
                        new_lines.append(line)  # Keep current line
                        # Skip to the function and add docstring after it
                        for k in range(i + 1, next_def_line):
                            if not lines[k].strip().startswith('"""'):
                                new_lines.append(lines[k])

                        # Add function definition
                        func_line = lines[next_def_line]
                        new_lines.append(func_line)

                        # Add the docstring inside function with proper indentation
                        func_indent = len(func_line) - len(func_line.lstrip())
                        docstring_indent = ' ' * (func_indent + 4)

                        # Skip the current docstring and look for the closing one
                        docstring_lines = [line]
                        for k in range(i + 1, len(lines)):
                            docstring_lines.append(lines[k])
                            if '"""' in lines[k] and k > i:
                                break

                        for doc_line in docstring_lines:
                            if doc_line.strip():
                                new_lines.append(docstring_indent + doc_line.lstrip())
                            else:
                                new_lines.append('\n')

                        i = k + 1
                        fixed = True
                        continue
                    else:
                        # No nearby function - convert to comment
                        comment_line = '# ' + line.strip().replace('"""', '').strip() + '\n'
                        new_lines.append(comment_line)
                        fixed = True

                new_lines.append(line)
                i += 1

            if fixed:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.writelines(new_lines)
                return True

        except Exception as e:
            print(f"Error fixing floating docstrings in {filepath}: {e}")

        return False

    def fix_simple_indent_errors(self, filepath):
        """Fix simple unexpected indent errors"""
        fixed = False
        try:
            with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                lines = f.readlines()

            new_lines = []
            for i, line in enumerate(lines):
                # Fix lines that start with excessive indentation at file start
                if i < 10 and line.startswith('        ') and not lines[max(0, i-1)].strip().endswith(':'):
                    # Remove 4 spaces of indentation
                    new_lines.append(line[4:] if len(line) > 4 else line)
                    fixed = True
                else:
                    new_lines.append(line)

            if fixed:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.writelines(new_lines)

        except Exception as e:
            print(f"Error fixing simple indents in {filepath}: {e}")

        return fixed

    def fix_file(self, filepath):
        """Apply targeted fixes to a single file"""
        filepath = Path(filepath)
        valid, error = self.validate_syntax(filepath)

        if valid:
            return True

        print(f"Targeted fix for {filepath.name}: {error.msg}")

        # Apply specific fixes based on error type
        fixes_applied = False

        if 'unexpected indent' in str(error.msg):
            if self.fix_orphaned_methods(filepath):
                fixes_applied = True
            if self.fix_simple_indent_errors(filepath):
                fixes_applied = True

        if 'invalid syntax' in str(error.msg) and 'self' in str(error):
            if self.fix_orphaned_methods(filepath):
                fixes_applied = True

        # Recheck after fixes
        valid, error = self.validate_syntax(filepath)

        if valid:
            self.fixed_files.append(filepath)
            print(f"  ✓ Fixed: {filepath.name}")
            return True
        else:
            self.error_files.append((filepath, str(error)))
            if fixes_applied:
                print(f"  ⚠ Partial fix: {filepath.name}")
            return False

    def fix_remaining_errors(self):
        """Fix remaining syntax errors after master fixer"""
        print("Running Targeted Syntax Fixer on remaining errors...")

        error_files = []
        for root, dirs, files in os.walk(self.root_dir):
            if any(skip in root for skip in ['__pycache__', '.git', 'node_modules', '.venv', '.backup']):
                continue

            for file in files:
                if file.endswith('.py'):
                    filepath = Path(root) / file
                    valid, error = self.validate_syntax(filepath)
                    if not valid:
                        error_files.append(filepath)

        print(f"Found {len(error_files)} files still with syntax errors")

        for filepath in error_files:
            self.fix_file(filepath)

        print(f"\nTargeted fixes complete:")
        print(f"  Files fixed: {len(self.fixed_files)}")
        print(f"  Files still with errors: {len(self.error_files)}")

        return len(self.fixed_files), len(self.error_files)

def main():
    fixer = TargetedSyntaxFixer()
    fixed, errors = fixer.fix_remaining_errors()

    # Final validation
    print("\nRunning final validation...")
    error_count = 0
    total_count = 0

    for root, dirs, files in os.walk('.'):
        if any(skip in root for skip in ['__pycache__', '.git', 'node_modules', '.venv', '.backup']):
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

    print(f"\nFinal Results:")
    print(f"  Total Python files: {total_count}")
    print(f"  Files with syntax errors: {error_count}")
    print(f"  Files without errors: {total_count - error_count}")
    print(f"  Error rate: {error_count/total_count*100:.1f}%")

if __name__ == "__main__":
    main()