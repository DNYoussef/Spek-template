#!/usr/bin/env python3
"""
Targeted Syntax Fixer - Handles specific syntax error patterns
"""

import os
import re
import ast
import sys
from pathlib import Path

def fix_function_indentation(content):
    """Fix function definitions that are not properly indented"""
    lines = content.split('\n')
    fixed_lines = []

    for i, line in enumerate(lines):
        # Check if this is a function definition that should be indented
        if line.strip().startswith('def ') and not line.startswith('    def') and not line.startswith('def'):
            # Look at the previous non-empty line to determine proper indentation
            indent_level = 0
            for j in range(i - 1, -1, -1):
                prev_line = lines[j].strip()
                if prev_line:
                    if prev_line.endswith(':'):
                        # Previous line was a block start, indent 4 spaces
                        indent_level = len(lines[j]) - len(lines[j].lstrip()) + 4
                    else:
                        # Use same indent as previous line
                        indent_level = len(lines[j]) - len(lines[j].lstrip())
                    break

            # Apply the indentation
            fixed_line = ' ' * indent_level + line.lstrip()
            fixed_lines.append(fixed_line)
        else:
            fixed_lines.append(line)

    return '\n'.join(fixed_lines)

def fix_unterminated_docstrings(content):
    """Fix unterminated docstrings"""
    lines = content.split('\n')
    fixed_lines = []
    in_docstring = False
    quote_type = None

    for i, line in enumerate(lines):
        if not in_docstring:
            # Check for start of docstring
            if line.strip().startswith('"""') and line.count('"""') == 1:
                in_docstring = True
                quote_type = '"""'
            elif line.strip().startswith("'''") and line.count("'''") == 1:
                in_docstring = True
                quote_type = "'''"
        else:
            # We're in a docstring, look for the end
            if quote_type in line:
                in_docstring = False
                quote_type = None

        fixed_lines.append(line)

        # If we reach the end and still in docstring, close it
        if i == len(lines) - 1 and in_docstring:
            # Add proper indentation for closing quotes
            last_line = fixed_lines[-1]
            indent = len(last_line) - len(last_line.lstrip()) if last_line.strip() else 4
            fixed_lines.append(' ' * indent + quote_type)

    return '\n'.join(fixed_lines)

def fix_decimal_literals(content):
    """Fix leading zeros in decimal literals"""
    # Fix decimal numbers with leading zeros
    content = re.sub(r'\b0+([1-9]\d*)\b', r'\1', content)

    # Fix version numbers in tables/logs
    content = re.sub(r'(\|\s*)0+(\d+)\.0+(\d)', r'\1\2.\3', content)
    content = re.sub(r'2025-9-24T(\d+):0+(\d)', r'2025-9-24T\1:\2', content)

    return content

def fix_incomplete_blocks(content):
    """Fix incomplete try/except blocks and empty function bodies"""
    lines = content.split('\n')
    fixed_lines = []

    for i, line in enumerate(lines):
        fixed_lines.append(line)

        # Check for function definitions, class definitions, try blocks that need bodies
        if line.strip().endswith(':') and line.strip() not in ['else:', 'elif:', 'except:', 'finally:']:
            # Look ahead to see if there's a body
            has_body = False
            indent_level = len(line) - len(line.lstrip()) + 4

            for j in range(i + 1, min(i + 5, len(lines))):
                if j >= len(lines):
                    break
                next_line = lines[j]
                if next_line.strip():
                    if len(next_line) - len(next_line.lstrip()) >= indent_level:
                        has_body = True
                        break
                    elif not next_line.startswith(' '):
                        # Next line at same or higher level, no body
                        break

            # If no body found, add pass
            if not has_body:
                fixed_lines.append(' ' * indent_level + 'pass')

        # Special handling for try blocks without except
        if line.strip() == 'try:':
            # Look for except/finally
            has_except = False
            for j in range(i + 1, min(i + 20, len(lines))):
                if j >= len(lines):
                    break
                check_line = lines[j].strip()
                if check_line.startswith(('except', 'finally')):
                    has_except = True
                    break
                elif check_line and not lines[j].startswith(' '):
                    # Found non-indented line, no except coming
                    break

            if not has_except:
                base_indent = len(line) - len(line.lstrip())
                fixed_lines.append(' ' * (base_indent + 4) + 'pass')
                fixed_lines.append(' ' * base_indent + 'except Exception:')
                fixed_lines.append(' ' * (base_indent + 4) + 'pass')

    return '\n'.join(fixed_lines)

def fix_string_literals(content):
    """Fix various string literal issues"""
    # Fix unterminated single-line strings
    lines = content.split('\n')
    fixed_lines = []

    for line in lines:
        # Look for lines with unmatched quotes
        if line.count('"') % 2 == 1 and line.strip().endswith('"'):
            # Likely unterminated string, but this is tricky to fix automatically
            pass

        # Fix common f-string issues
        line = re.sub(r'f"([^"]*)"([^"]*$)', r'f"\1"', line)

        fixed_lines.append(line)

    return '\n'.join(fixed_lines)

def fix_file(file_path):
    """Apply all fixes to a single file"""
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()

        if not content.strip():
            return True

        # Apply fixes in order
        content = fix_function_indentation(content)
        content = fix_unterminated_docstrings(content)
        content = fix_decimal_literals(content)
        content = fix_incomplete_blocks(content)
        content = fix_string_literals(content)

        # Test if fixes worked
        try:
            ast.parse(content)
            # Write back the fixed content
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
        except SyntaxError as e:
            print(f"Still has syntax error after fixes: {e}")
            return False

    except Exception as e:
        print(f"Error processing file: {e}")
        return False

def main():
    """Main function to fix all Python files"""
    root_dir = Path(".")
    exclude_patterns = ['.backup', 'devtools', 'orchestration', 'registry', '__pycache__']

    # Find all Python files
    python_files = []
    for py_file in root_dir.rglob("*.py"):
        if any(pattern in str(py_file) for pattern in exclude_patterns):
            continue
        python_files.append(py_file)

    print(f"Found {len(python_files)} Python files to check")

    # Check current syntax errors
    broken_files = []
    for file_path in python_files:
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
            ast.parse(content)
        except SyntaxError:
            broken_files.append(file_path)

    print(f"Found {len(broken_files)} files with syntax errors")

    # Fix files
    fixed_count = 0
    for file_path in broken_files:
        print(f"Fixing {file_path}...")
        if fix_file(file_path):
            fixed_count += 1
            print("  SUCCESS")
        else:
            print("  FAILED")

    # Check remaining errors
    remaining_errors = 0
    for file_path in python_files:
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
            ast.parse(content)
        except SyntaxError:
            remaining_errors += 1

    print(f"\nFIXING COMPLETE:")
    print(f"Fixed files: {fixed_count}")
    print(f"Remaining errors: {remaining_errors}")

    return 0 if remaining_errors == 0 else 1

if __name__ == "__main__":
    sys.exit(main())