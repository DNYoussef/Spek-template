#!/usr/bin/env python3
"""
Fix all syntax errors in the analyzer module.
Repairs:
- Try blocks without except/finally
- Unterminated triple-quoted strings
- Indentation issues
"""

import os
import re
import ast
from pathlib import Path
from typing import List, Tuple

class AnalyzerFixer:
    def __init__(self):
        self.fixed_count = 0
        self.error_count = 0
        self.files_processed = 0

    def fix_file(self, filepath: str) -> bool:
        """Fix syntax errors in a single file."""
        try:
            with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()

            original = content

            # Fix try blocks without except/finally
            content = self.fix_try_blocks(content)

            # Fix unterminated triple quotes
            content = self.fix_triple_quotes(content)

            # Fix indentation issues
            content = self.fix_indentation(content)

            # Only write if changes were made
            if content != original:
                # Validate the fixed content
                try:
                    ast.parse(content)
                    with open(filepath, 'w', encoding='utf-8') as f:
                        f.write(content)
                    self.fixed_count += 1
                    return True
                except SyntaxError as e:
                    print(f"  Still has errors after fix: {os.path.basename(filepath)} - {e}")
                    self.error_count += 1
                    return False

            return True

        except Exception as e:
            print(f"  Error processing {os.path.basename(filepath)}: {e}")
            self.error_count += 1
            return False

    def fix_try_blocks(self, content: str) -> str:
        """Add except blocks to incomplete try statements."""
        lines = content.split('\n')
        new_lines = []
        i = 0

        while i < len(lines):
            line = lines[i]
            new_lines.append(line)

            # Check if this is a try block
            if line.strip().startswith('try:'):
                indent_level = len(line) - len(line.lstrip())
                indent = ' ' * indent_level

                # Look ahead for except/finally
                has_handler = False
                j = i + 1

                while j < len(lines):
                    next_line = lines[j]
                    next_indent = len(next_line) - len(next_line.lstrip())

                    # If we hit a line at same or lower indent, break
                    if next_line.strip() and next_indent <= indent_level:
                        if next_line.strip().startswith(('except', 'finally')):
                            has_handler = True
                        break
                    j += 1

                # If no handler found, add a generic except block
                if not has_handler:
                    # Find where to insert the except block
                    insert_at = i + 1
                    while insert_at < len(lines):
                        if lines[insert_at].strip():
                            next_indent = len(lines[insert_at]) - len(lines[insert_at].lstrip())
                            if next_indent <= indent_level:
                                break
                        insert_at += 1

                    # Insert except block at the right position
                    if insert_at <= len(lines):
                        # Skip past the try block content
                        while i < insert_at - 1:
                            i += 1
                            if i < len(lines):
                                new_lines.append(lines[i])

                        # Add the except block
                        new_lines.append(f"{indent}except Exception as e:")
                        new_lines.append(f"{indent}    # Auto-generated handler")
                        new_lines.append(f"{indent}    pass")

            i += 1

        return '\n'.join(new_lines)

    def fix_triple_quotes(self, content: str) -> str:
        """Fix unterminated triple-quoted strings."""
        lines = content.split('\n')
        in_string = False
        string_char = None
        string_start = -1

        for i, line in enumerate(lines):
            # Count triple quotes
            if '"""' in line:
                count = line.count('"""')
                if count % 2 == 1:  # Odd number means state change
                    if not in_string:
                        in_string = True
                        string_char = '"""'
                        string_start = i
                    else:
                        in_string = False

            if "'''" in line:
                count = line.count("'''")
                if count % 2 == 1:  # Odd number means state change
                    if not in_string:
                        in_string = True
                        string_char = "'''"
                        string_start = i
                    else:
                        in_string = False

        # If we ended in a string, add closing quotes
        if in_string and string_start >= 0:
            # Find a good place to close the string
            # Usually it's the next line after indented content
            for i in range(string_start + 1, len(lines)):
                if lines[i].strip() and not lines[i][0].isspace():
                    # Insert closing quotes before this line
                    lines.insert(i, f'    {string_char}')
                    break
            else:
                # Add at the end if we didn't find a good spot
                lines.append(f'    {string_char}')

        return '\n'.join(lines)

    def fix_indentation(self, content: str) -> str:
        """Fix common indentation issues."""
        lines = content.split('\n')
        new_lines = []
        expected_indent = 0

        for line in lines:
            stripped = line.strip()

            # Skip empty lines
            if not stripped:
                new_lines.append(line)
                continue

            # Decrease indent for these keywords
            if stripped.startswith(('else:', 'elif ', 'except ', 'except:', 'finally:', 'case ')):
                expected_indent = max(0, expected_indent - 4)

            # Apply expected indentation
            if expected_indent > 0 and line[0].isspace():
                # Keep existing indentation if it looks reasonable
                current_indent = len(line) - len(line.lstrip())
                if abs(current_indent - expected_indent) <= 4:
                    new_lines.append(line)
                else:
                    new_lines.append(' ' * expected_indent + stripped)
            else:
                new_lines.append(line)

            # Increase indent after these
            if stripped.endswith(':') and not stripped.startswith('#'):
                expected_indent += 4
            elif stripped.startswith(('return', 'raise', 'break', 'continue', 'pass')):
                expected_indent = max(0, expected_indent - 4)

        return '\n'.join(new_lines)

    def process_directory(self, directory: str):
        """Process all Python files in a directory."""
        print(f"Processing analyzer directory: {directory}")

        for root, dirs, files in os.walk(directory):
            # Skip __pycache__ directories
            if '__pycache__' in root:
                continue

            for file in files:
                if file.endswith('.py'):
                    filepath = os.path.join(root, file)
                    self.files_processed += 1

                    # Check if file has syntax errors
                    try:
                        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                            ast.parse(f.read())
                    except SyntaxError:
                        print(f"Fixing: {os.path.relpath(filepath, directory)}")
                        self.fix_file(filepath)

def main():
    analyzer_path = r'C:\Users\17175\Desktop\spek template\analyzer'

    fixer = AnalyzerFixer()
    fixer.process_directory(analyzer_path)

    print("\n" + "="*60)
    print("ANALYZER FIX COMPLETE")
    print("="*60)
    print(f"Files processed: {fixer.files_processed}")
    print(f"Files fixed: {fixer.fixed_count}")
    print(f"Files with remaining errors: {fixer.error_count}")

    # Verify imports work
    print("\nVerifying analyzer imports...")
    try:
        import sys
        sys.path.insert(0, r'C:\Users\17175\Desktop\spek template')
        import analyzer
        print("[OK] Analyzer module imports successfully!")

        # Try importing key components
        from analyzer.comprehensive_analysis_engine import ComprehensiveAnalysisEngine
        from analyzer.unified_analyzer import UnifiedAnalyzer
        print("[OK] Key components import successfully!")

    except Exception as e:
        print(f"[ERROR] Import failed: {e}")
        return 1

    return 0

if __name__ == "__main__":
    exit(main())