#!/usr/bin/env python3
"""
Indentation Reconstructor - Fix indentation errors after bracket fixes.
Restores 4-space indentation levels systematically.
"""
import re
import sys
from pathlib import Path
from datetime import datetime
import json
import ast


def calculate_expected_indent(line: str, prev_indent: int, prev_line: str) -> int:
    """Calculate expected indentation level for line."""
    assert isinstance(line, str), "Line must be string"
    assert isinstance(prev_indent, int), "Previous indent must be int"
    assert prev_indent >= 0, "Previous indent cannot be negative"

    stripped = line.strip()

    # Empty line keeps previous indent
    if not stripped:
        return prev_indent

    # Dedent patterns
    if stripped.startswith(('return', 'break', 'continue', 'pass', 'raise')):
        return prev_indent

    if stripped.startswith(('except', 'finally', 'elif', 'else')):
        return max(0, prev_indent - 4)

    # Indent patterns from previous line
    if prev_line.rstrip().endswith(':'):
        return prev_indent + 4

    # Continuation line patterns
    if prev_line.rstrip().endswith(('(', '[', '{')):
        return prev_indent + 4

    if stripped.startswith(('}', ']', ')')):
        return max(0, prev_indent - 4)

    return prev_indent


def fix_indentation(content: str) -> str:
    """Fix indentation to 4-space levels."""
    assert isinstance(content, str), "Content must be string"
    assert len(content) > 0, "Content cannot be empty"

    lines = content.split('\n')
    fixed_lines = []
    current_indent = 0

    for i, line in enumerate(lines):
        if not line.strip():
            fixed_lines.append('')
            continue

        prev_line = lines[i - 1] if i > 0 else ""
        expected = calculate_expected_indent(line, current_indent, prev_line)

        # Apply expected indentation
        stripped = line.lstrip()
        fixed_line = ' ' * expected + stripped
        fixed_lines.append(fixed_line)

        # Update current indent for next line
        current_indent = expected

    return '\n'.join(fixed_lines)


def fix_class_and_function_indent(content: str) -> str:
    """Ensure class and function definitions have correct indentation."""
    assert isinstance(content, str), "Content must be string"
    assert len(content) > 0, "Content cannot be empty"

    lines = content.split('\n')
    fixed_lines = []
    class_indent = 0

    for line in lines:
        stripped = line.strip()

        # Class definitions at module level
        if stripped.startswith('class ') and ':' in stripped:
            fixed_lines.append(stripped)
            class_indent = 0
            continue

        # Function definitions
        if stripped.startswith('def ') and ':' in stripped:
            if class_indent == 0:
                # Module-level function
                fixed_lines.append(stripped)
            else:
                # Class method
                fixed_lines.append('    ' + stripped)
            continue

        fixed_lines.append(line)

    return '\n'.join(fixed_lines)


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
    """Process single file with indentation fixes."""
    assert filepath.exists(), f"File must exist: {filepath}"
    assert filepath.suffix == '.py', "File must be Python"

    try:
        content = filepath.read_text(encoding='utf-8')
        original_content = content

        # Apply fixes
        content = fix_class_and_function_indent(content)
        content = fix_indentation(content)

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
    """Execute indentation reconstructor on batch validation tests."""
    assert len(sys.argv) > 1, "Usage: indent-reconstructor.py <file1> [file2...]"

    # Wait for bracket stage completion
    bracket_complete = Path('.fixes/batchval/bracket-complete.json')
    assert bracket_complete.exists(), "Must run bracket-harmonizer.py first"

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
        'stage': 'indent',
        'files_fixed': files_fixed,
        'files_remaining': files_remaining,
        'timestamp': datetime.utcnow().isoformat() + 'Z',
        'results': results
    }

    output_path = Path('.fixes/batchval/indent-complete.json')
    output_path.write_text(json.dumps(completion, indent=2), encoding='utf-8')

    print(f"Indentation Reconstructor Complete: {files_fixed} fixed, {files_remaining} remaining")
    return 0 if files_remaining == 0 else 1


if __name__ == '__main__':
    sys.exit(main())
