#!/usr/bin/env python3
"""
Batch syntax error fixer - fixes common patterns systematically.
"""

import ast
import json
import re
from pathlib import Path
from collections import defaultdict

def fix_unterminated_string_pattern_1(file_path):
    """Fix pattern: docstring missing opening quotes at file start."""
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()

        lines = content.split('\n')

        # Pattern: starts with import, then description without opening quotes
        if len(lines) >= 3:
            first_line = lines[0].strip()
            second_line = lines[1].strip()
            third_line = lines[2].strip()

            # If first line is import, second is empty, third looks like description
            if (first_line.startswith(('from ', 'import ')) and
                not second_line and
                third_line and not third_line.startswith(('"""', "'''", '#', 'import', 'from'))):

                # Add opening quotes after first import
                lines[2] = '"""' + lines[2]

                # Find where to add closing quotes (before next import/class/def)
                for i in range(3, len(lines)):
                    line = lines[i].strip()
                    if line.startswith(('import ', 'from ', 'class ', 'def ', '@')):
                        # Add closing quotes before this line
                        lines.insert(i, '"""')
                        break

                fixed_content = '\n'.join(lines)

                # Test fix
                try:
                    ast.parse(fixed_content)
                    with open(file_path, 'w', encoding='utf-8') as f:
                        f.write(fixed_content)
                    return True, "Fixed unterminated docstring pattern 1"
                except SyntaxError:
                    return False, "Fix validation failed"

    except Exception as e:
        return False, f"Error: {e}"

    return False, "Pattern not matched"

def fix_try_except_pattern(file_path):
    """Fix pattern: try block without except/finally."""
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()

        lines = content.split('\n')
        fixed_lines = []
        i = 0

        while i < len(lines):
            line = lines[i]
            fixed_lines.append(line)

            # Look for try: followed by indented code but no except/finally
            if line.strip().endswith('try:'):
                indent = len(line) - len(line.lstrip())
                j = i + 1
                found_except_or_finally = False

                # Skip indented lines after try
                while j < len(lines):
                    next_line = lines[j]
                    next_indent = len(next_line) - len(next_line.lstrip()) if next_line.strip() else 0

                    if next_line.strip():
                        if next_indent <= indent:  # Back to same or less indentation
                            if next_line.strip().startswith(('except', 'finally')):
                                found_except_or_finally = True
                            break
                    j += 1

                # If no except/finally found, add a pass except
                if not found_except_or_finally:
                    # Find end of try block
                    k = i + 1
                    while k < len(lines) and lines[k].strip():
                        if lines[k].strip() and (len(lines[k]) - len(lines[k].lstrip())) > indent:
                            k += 1
                        else:
                            break

                    # Insert except pass
                    except_line = ' ' * indent + 'except:'
                    pass_line = ' ' * (indent + 4) + 'pass'
                    fixed_lines.extend([except_line, pass_line])

            i += 1

        fixed_content = '\n'.join(fixed_lines)

        # Test fix
        try:
            ast.parse(fixed_content)
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(fixed_content)
            return True, "Fixed try/except pattern"
        except SyntaxError:
            return False, "Fix validation failed"

    except Exception as e:
        return False, f"Error: {e}"

def fix_invalid_syntax_patterns(file_path):
    """Fix common invalid syntax patterns."""
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()

        original_content = content

        # Fix pattern: f.write('{'ci_mock": true, "results": []}"),
        content = re.sub(r"f\.write\('(\{.*\})\"\),", r'f.write(\'\1\')', content)

        # Fix unmatched quotes in JSON-like strings
        content = re.sub(r"'(\{[^}]*\"[^}]*\})'", r'\'{\1}\'', content)

        # Fix other common patterns
        content = re.sub(r'(\w+)\s*=\s*(\w+)\s*(\w+)', r'\1 = \2_\3', content)

        if content != original_content:
            # Test fix
            try:
                ast.parse(content)
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(content)
                return True, "Fixed invalid syntax patterns"
            except SyntaxError:
                return False, "Fix validation failed"

    except Exception as e:
        return False, f"Error: {e}"

    return False, "No patterns matched"

def fix_indentation_patterns(file_path):
    """Fix common indentation errors."""
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()

        lines = content.split('\n')
        fixed_lines = []

        for i, line in enumerate(lines):
            # Pattern: Method definition incorrectly indented (from god object decomposition)
            if (line.strip().startswith('def ') and
                line.startswith('    ') and
                i > 0 and
                not lines[i-1].strip().endswith(':')):

                # Check if we should remove indentation
                in_class = False
                for j in range(i-1, -1, -1):
                    prev_line = lines[j].strip()
                    if prev_line.startswith('class '):
                        in_class = True
                        break
                    elif prev_line.startswith('def ') and not lines[j].startswith('    '):
                        break

                if not in_class:
                    line = line[4:]  # Remove 4 spaces of indentation

            fixed_lines.append(line)

        fixed_content = '\n'.join(fixed_lines)

        # Test fix
        try:
            ast.parse(fixed_content)
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(fixed_content)
            return True, "Fixed indentation patterns"
        except SyntaxError:
            return False, "Fix validation failed"

    except Exception as e:
        return False, f"Error: {e}"

def main():
    # Load current scan results
    with open('syntax_error_scan_results.json', 'r') as f:
        scan_results = json.load(f)

    # Filter real source files only
    real_errors = [e for e in scan_results['all_errors']
                   if not any(p in e['file'] for p in ['--output-dir', '.backup_', '__pycache__'])]

    print(f"Processing {len(real_errors)} real source file errors...")

    fixes_applied = defaultdict(list)
    total_fixed = 0

    # Group by error type and apply appropriate fixes
    for error in real_errors:
        file_path = error['file']
        message = error['message'].lower()

        success = False
        fix_type = None

        if 'unterminated' in message:
            success, result = fix_unterminated_string_pattern_1(file_path)
            fix_type = 'unterminated_strings'
        elif 'expected' in message and 'except' in message:
            success, result = fix_try_except_pattern(file_path)
            fix_type = 'try_except_blocks'
        elif 'invalid syntax' in message:
            success, result = fix_invalid_syntax_patterns(file_path)
            fix_type = 'invalid_syntax'
        elif 'unexpected indent' in message:
            success, result = fix_indentation_patterns(file_path)
            fix_type = 'indentation'

        if success and fix_type:
            fixes_applied[fix_type].append({
                'file': file_path,
                'error': error['message'],
                'result': result
            })
            total_fixed += 1
            print(f"[OK] Fixed {file_path}: {result}")
        else:
            print(f"[FAIL] Failed {file_path}: {result if 'result' in locals() else 'No fix attempted'}")

    print(f"\nBATCH FIX SUMMARY:")
    print(f"Total files fixed: {total_fixed}")
    print(f"Fixes by type:")
    for fix_type, fixes in fixes_applied.items():
        print(f"  {fix_type}: {len(fixes)}")

    # Save report
    report = {
        'total_fixed': total_fixed,
        'fixes_by_type': {k: len(v) for k, v in fixes_applied.items()},
        'detailed_fixes': dict(fixes_applied)
    }

    with open('batch_fix_report.json', 'w') as f:
        json.dump(report, f, indent=2)

    print(f"\nDetailed report saved to: batch_fix_report.json")

if __name__ == "__main__":
    main()