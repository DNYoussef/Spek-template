#!/usr/bin/env python3
"""
Bracket Harmonizer - Fix mismatched brackets and parentheses.
Repairs {) patterns and reconstructs split function calls.
"""
import re
import sys
from pathlib import Path
from datetime import datetime
import json
import ast


def fix_mismatched_brackets(content: str) -> str:
    """Fix bracket type mismatches like {) instead of {}."""
    assert isinstance(content, str), "Content must be string"
    assert len(content) > 0, "Content cannot be empty"

    # Pattern: {) should be {}
    content = re.sub(r'\{\)', '{}', content)

    # Pattern: (} should be ()
    content = re.sub(r'\(\}', '()', content)

    # Pattern: [) should be []
    content = re.sub(r'\[\)', '[]', content)

    return content


def fix_split_function_calls(content: str) -> str:
    """Reconstruct function calls split across lines."""
    assert isinstance(content, str), "Content must be string"
    assert len(content) > 0, "Content cannot be empty"

    lines = content.split('\n')
    fixed_lines = []
    i = 0

    while i < len(lines):
        line = lines[i]

        # Pattern: function_name() \n args \n ( ) split
        if re.match(r'\s*\w+\(\)\s*$', line.strip()) and i + 2 < len(lines):
            next_line = lines[i + 1].strip()
            after_next = lines[i + 2].strip() if i + 2 < len(lines) else ""

            # Check if looks like split call
            if next_line and not next_line.startswith('#') and after_next in ['()', '( )']:
                # Reconstruct: function(args)
                func_match = re.match(r'(\s*)(\w+)\(\)', line)
                if func_match:
                    indent = func_match.group(1)
                    func_name = func_match.group(2)
                    fixed_lines.append(f'{indent}{func_name}({next_line})')
                    i += 3
                    continue

        fixed_lines.append(line)
        i += 1

    return '\n'.join(fixed_lines)


def balance_brackets(content: str) -> str:
    """Ensure bracket pairs are balanced."""
    assert isinstance(content, str), "Content must be string"
    assert len(content) > 0, "Content cannot be empty"

    bracket_pairs = {'(': ')', '[': ']', '{': '}'}
    stack = []
    result = []

    for char in content:
        if char in bracket_pairs:
            stack.append(char)
            result.append(char)
        elif char in bracket_pairs.values():
            if stack and bracket_pairs[stack[-1]] == char:
                stack.pop()
                result.append(char)
            else:
                # Skip mismatched closing bracket
                continue
        else:
            result.append(char)

    return ''.join(result)


def validate_syntax(filepath: Path) -> tuple[bool, str]:
    """Validate Python syntax using ast.parse."""
    assert filepath.exists(), f"File must exist: {filepath}"
    assert filepath.suffix == '.py', "File must be Python"

    try:
        content = filepath.read_text(encoding='utf-8')
        ast.parse(content)
        return True, "OK"
    except SyntaxError as e:
        return False, f"Line {e.lineno}: {e.msg}"
    except Exception as e:
        return False, str(e)


def process_file(filepath: Path) -> dict:
    """Process single file with bracket fixes."""
    assert filepath.exists(), f"File must exist: {filepath}"
    assert filepath.suffix == '.py', "File must be Python"

    try:
        content = filepath.read_text(encoding='utf-8')
        original_content = content

        # Apply fixes in sequence
        content = fix_mismatched_brackets(content)
        content = fix_split_function_calls(content)

        # Write if changed
        if content != original_content:
            filepath.write_text(content, encoding='utf-8')
            valid, msg = validate_syntax(filepath)
            return {
                'file': str(filepath),
                'status': 'fixed',
                'valid': valid,
                'message': msg
            }
        else:
            valid, msg = validate_syntax(filepath)
            return {
                'file': str(filepath),
                'status': 'unchanged',
                'valid': valid,
                'message': msg
            }
    except Exception as e:
        return {
            'file': str(filepath),
            'status': 'error',
            'valid': False,
            'message': str(e)
        }


def main():
    """Execute bracket harmonizer on batch validation tests."""
    assert len(sys.argv) > 1, "Usage: bracket-harmonizer.py <file1> [file2...]"

    # Wait for docstring stage completion
    docstring_complete = Path('.fixes/batchval/docstring-complete.json')
    assert docstring_complete.exists(), "Must run docstring-surgeon.py first"

    results = []
    files_fixed = 0
    files_remaining = 0

    for filepath_str in sys.argv[1:]:
        filepath = Path(filepath_str)
        if not filepath.exists():
            continue

        result = process_file(filepath)
        results.append(result)

        if result['status'] == 'fixed':
            files_fixed += 1
        if not result['valid']:
            files_remaining += 1

    # Write completion report
    completion = {
        'stage': 'bracket',
        'files_fixed': files_fixed,
        'files_remaining': files_remaining,
        'timestamp': datetime.utcnow().isoformat() + 'Z',
        'results': results
    }

    output_path = Path('.fixes/batchval/bracket-complete.json')
    output_path.write_text(json.dumps(completion, indent=2), encoding='utf-8')

    print(f"Bracket Harmonizer Complete: {files_fixed} fixed, {files_remaining} remaining")
    return 0 if files_remaining == 0 else 1


if __name__ == '__main__':
    sys.exit(main())
