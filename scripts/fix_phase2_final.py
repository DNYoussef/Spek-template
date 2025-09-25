#!/usr/bin/env python3
"""
Phase 2 Final Fix Script - Achieve 100% Compilation
Fixes all remaining syntax and indentation errors in Python files.
"""

from pathlib import Path
from typing import List, Tuple
import os
import re
import sys
import tempfile

import py_compile

def fix_method_body_indentation(lines: List[str]) -> List[str]:
    """Fix extra indentation in method bodies, especially after docstrings."""
    fixed_lines = []
    in_class = False
    in_method = False
    method_indent = 0

    for i, line in enumerate(lines):
        stripped = line.strip()

        # Track class definitions
        if stripped.startswith('class '):
            in_class = True
            in_method = False
            fixed_lines.append(line)
            continue

        # Track method definitions
        if in_class and (stripped.startswith('def ') or
                        (len(line) > 4 and line[4:].strip().startswith('def '))):
            in_method = True
            # Ensure proper method indentation (4 spaces for class methods)
            if stripped.startswith('def '):
                fixed_lines.append('    ' + stripped + '\n')
                method_indent = 8  # Body should be indented 8 spaces
            else:
                fixed_lines.append(line)
                method_indent = len(line) - len(line.lstrip()) + 4
            continue

        # Fix method body indentation
        if in_method and stripped and not stripped.startswith('"""') and not stripped.startswith("'''"):
            # Check if this line has extra indentation
            current_indent = len(line) - len(line.lstrip())

            # Special handling for lines that should be at method body level
            if current_indent > method_indent and i > 0:
                # Check if previous line was a docstring end
                prev_stripped = lines[i-1].strip()
                if (prev_stripped.endswith('"""') or prev_stripped.endswith("'''")) and len(prev_stripped) > 3:
                    # This line should be at method_indent level
                    fixed_lines.append(' ' * method_indent + stripped + '\n')
                    continue
                elif current_indent == method_indent + 4:
                    # Likely over-indented, bring back one level
                    fixed_lines.append(' ' * method_indent + stripped + '\n')
                    continue

        fixed_lines.append(line)

    return fixed_lines

def fix_compliance_module_pattern(content: str) -> str:
    """Fix specific pattern in compliance modules where __init__ body is over-indented."""
    lines = content.split('\n')
    fixed_lines = []

    for i, line in enumerate(lines):
        # Look for __init__ method
        if 'def __init__' in line:
            fixed_lines.append(line)
            # Process the method body
            base_indent = len(line) - len(line.lstrip())
            body_indent = base_indent + 4

            j = i + 1
            while j < len(lines):
                next_line = lines[j]
                if next_line.strip() == '':
                    fixed_lines.append(next_line)
                elif next_line.strip() and not next_line[0].isspace():
                    # Hit a non-indented line, end of method
                    fixed_lines.extend(lines[j:])
                    break
                else:
                    # Check for over-indentation
                    current_indent = len(next_line) - len(next_line.lstrip())
                    if current_indent > body_indent + 4:
                        # Too much indentation, reduce it
                        stripped = next_line.strip()
                        fixed_lines.append(' ' * body_indent + stripped)
                    elif current_indent == body_indent + 4:
                        # Check if this should be at body_indent level
                        stripped = next_line.strip()
                        if (stripped.startswith('self.') or stripped.startswith('logger') or
                            stripped.startswith('result =') or stripped.startswith('#')):
                            fixed_lines.append(' ' * body_indent + stripped)
                        else:
                            fixed_lines.append(next_line)
                    else:
                        fixed_lines.append(next_line)
                j += 1

            # Skip the lines we've already processed
            return '\n'.join(fixed_lines[:len(fixed_lines)])
        else:
            fixed_lines.append(line)

    return '\n'.join(fixed_lines)

def fix_quadruple_quotes(content: str) -> str:
    """Replace quadruple quotes with triple quotes."""
    content = content.replace('""""', '"""')
    content = content.replace("''''", "'''")
    return content

def validate_indentation(content: str) -> str:
    """Ensure consistent 4-space indentation throughout."""
    lines = content.split('\n')
    fixed_lines = []

    for line in lines:
        if line.startswith('\t'):
            # Convert tabs to 4 spaces
            spaces_count = 0
            for char in line:
                if char == '\t':
                    spaces_count += 4
                else:
                    break
            stripped = line.lstrip('\t')
            fixed_lines.append(' ' * spaces_count + stripped)
        else:
            fixed_lines.append(line)

    return '\n'.join(fixed_lines)

def fix_file(file_path: str) -> Tuple[bool, str]:
    """Fix syntax issues in a single file."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        original = content

        # Apply fixes in order
        content = fix_quadruple_quotes(content)
        content = validate_indentation(content)

        # Special handling for compliance modules
        if 'compliance' in file_path:
            content = fix_compliance_module_pattern(content)
        else:
            lines = content.split('\n')
            fixed_lines = fix_method_body_indentation(lines)
            content = ''.join(fixed_lines)

        # Only write if changed
        if content != original:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)

        # Validate the fix
        try:
            py_compile.compile(file_path, doraise=True)
            return True, "Fixed and compiled successfully"
        except py_compile.PyCompileError as e:
            return False, f"Still has compilation errors: {e}"

    except Exception as e:
        return False, f"Error processing file: {e}"

def main():
    """Main execution."""
    print("Phase 2 Final Fix - Achieving 100% Compilation\n")
    print("=" * 60)

    # Collect all Python files with errors
    error_files = []
    total_files = 0

    for root, dirs, files in os.walk('.'):
        # Skip virtual environments and cache
        dirs[:] = [d for d in dirs if d not in ['venv', '__pycache__', '.git', 'node_modules', '.venv']]

        for file in files:
            if file.endswith('.py'):
                total_files += 1
                file_path = os.path.join(root, file)
                try:
                    py_compile.compile(file_path, doraise=True)
                except py_compile.PyCompileError:
                    error_files.append(file_path)

    print(f"Total Python files: {total_files}")
    print(f"Files with errors: {len(error_files)}")
    print(f"Current compilation rate: {((total_files - len(error_files)) / total_files * 100):.1f}%\n")

    if not error_files:
        print("[SUCCESS] All files compile successfully!")
        return 0

    print("Fixing files with errors...")
    print("-" * 60)

    fixed_count = 0
    still_broken = []

    for file_path in error_files:
        print(f"Processing: {file_path}")
        success, message = fix_file(file_path)
        if success:
            fixed_count += 1
            print(f"  [FIXED] {message}")
        else:
            still_broken.append((file_path, message))
            print(f"  [ERROR] {message}")

    print("\n" + "=" * 60)
    print("FINAL RESULTS")
    print("=" * 60)
    print(f"Total files processed: {len(error_files)}")
    print(f"Successfully fixed: {fixed_count}")
    print(f"Still have errors: {len(still_broken)}")

    # Final validation
    remaining_errors = 0
    for root, dirs, files in os.walk('.'):
        dirs[:] = [d for d in dirs if d not in ['venv', '__pycache__', '.git', 'node_modules', '.venv']]
        for file in files:
            if file.endswith('.py'):
                file_path = os.path.join(root, file)
                try:
                    py_compile.compile(file_path, doraise=True)
                except py_compile.PyCompileError:
                    remaining_errors += 1

    final_rate = ((total_files - remaining_errors) / total_files * 100)
    print(f"\nFinal compilation rate: {final_rate:.1f}%")

    if remaining_errors == 0:
        print("\n[SUCCESS] 100% COMPILATION ACHIEVED!")
        print("Phase 2 is now complete. Ready for Phase 3 handoff.")
    else:
        print(f"\n[WARNING] {remaining_errors} files still have compilation errors.")
        print("\nFiles still broken:")
        for file_path, error in still_broken[:10]:  # Show first 10
            print(f"  - {file_path}")

    return 0 if remaining_errors == 0 else 1

if __name__ == "__main__":
    sys.exit(main())