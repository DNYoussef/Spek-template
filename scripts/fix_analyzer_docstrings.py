#!/usr/bin/env python3
"""
Fix missing docstring quotes in analyzer module.
The Unicode removal corrupted many docstrings by removing the opening quotes.
"""

import os
import re
import ast

class DocstringFixer:
    def __init__(self):
        self.fixed_files = 0
        self.total_files = 0
        self.errors = []

    def fix_file(self, filepath):
        """Fix docstring issues in a file."""
        try:
            with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                lines = f.readlines()

            if len(lines) < 3:
                return False

            modified = False

            # Pattern 1: Missing opening """ on line 3
            # If line 3 doesn't start with """ but looks like docstring content
            if len(lines) > 2:
                line3 = lines[2].strip()
                if (line3 and
                    not line3.startswith('"""') and
                    not line3.startswith('#') and
                    not line3.startswith('import ') and
                    not line3.startswith('from ') and
                    not line3.startswith('class ') and
                    not line3.startswith('def ') and
                    not line3.startswith('if ') and
                    not line3.startswith('try:') and
                    not line3.startswith('return ') and
                    not line3.startswith('@')):

                    # Check if it looks like prose (docstring content)
                    if any(word in line3.lower() for word in ['module', 'class', 'function', 'provides', 'handles', 'manages', 'main', 'this', 'the']):
                        lines[2] = '"""' + lines[2]
                        modified = True

            # Pattern 2: Fix decimal literals (e.g., 3.compliance should be 3, compliance)
            for i, line in enumerate(lines):
                if re.search(r'\b\d+\.[a-zA-Z]', line):
                    # Replace patterns like "3.compliance" with "3, compliance"
                    lines[i] = re.sub(r'(\d+)\.([a-zA-Z])', r'\1, \2', line)
                    modified = True

            # Pattern 3: Fix unterminated strings at specific known locations
            content = ''.join(lines)

            # Check for unterminated triple quotes
            triple_count = content.count('"""')
            if triple_count % 2 == 1:
                # Find the last """ and add a closing one
                last_triple = content.rfind('"""')
                if last_triple != -1:
                    # Find the next good place to close it
                    next_newline = content.find('\n\n', last_triple)
                    if next_newline != -1:
                        lines = content[:next_newline].split('\n')
                        lines.append('    """')
                        lines.extend(content[next_newline:].split('\n'))
                        modified = True

            if modified:
                # Verify the fix is valid Python
                try:
                    ast.parse(''.join(lines))
                    with open(filepath, 'w', encoding='utf-8') as f:
                        f.writelines(lines)
                    self.fixed_files += 1
                    return True
                except SyntaxError as e:
                    self.errors.append((filepath, str(e)))
                    return False

            return False

        except Exception as e:
            self.errors.append((filepath, str(e)))
            return False

    def fix_directory(self, directory):
        """Process all Python files in directory."""
        for root, dirs, files in os.walk(directory):
            if '__pycache__' in root:
                continue

            for file in files:
                if file.endswith('.py'):
                    filepath = os.path.join(root, file)
                    self.total_files += 1

                    # Check if file has syntax errors
                    try:
                        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                            ast.parse(f.read())
                    except SyntaxError:
                        rel_path = os.path.relpath(filepath, directory)
                        if self.fix_file(filepath):
                            print(f"[FIXED] {rel_path}")
                        else:
                            print(f"[FAIL]  {rel_path}")

def main():
    analyzer_path = r'C:\Users\17175\Desktop\spek template\analyzer'

    print("Fixing analyzer docstrings and syntax errors...")
    print("="*60)

    fixer = DocstringFixer()
    fixer.fix_directory(analyzer_path)

    print("="*60)
    print(f"Total files scanned: {fixer.total_files}")
    print(f"Files fixed: {fixer.fixed_files}")
    print(f"Errors: {len(fixer.errors)}")

    if fixer.errors:
        print("\nRemaining errors:")
        for filepath, error in fixer.errors[:10]:
            print(f"  {os.path.basename(filepath)}: {error}")

if __name__ == "__main__":
    main()