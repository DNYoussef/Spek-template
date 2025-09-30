#!/usr/bin/env python3
"""
Docstring Surgeon - Fix unterminated triple-quoted strings in batch validation tests.
Applies systematic regex patterns to repair docstring syntax errors.
"""
import re
import sys
from pathlib import Path
from datetime import datetime
import json
import ast


def has_unterminated_docstring(content: str) -> bool:
    """Check if content has unterminated docstring patterns."""
    assert isinstance(content, str), "Content must be string"
    assert len(content) > 0, "Content cannot be empty"

    lines = content.split('\n')
    triple_quote_count = 0

    for i, line in enumerate(lines[:30]):
        if '"""' in line:
            triple_quote_count += line.count('"""')

    return triple_quote_count % 2 != 0


def fix_docstring_opening(content: str) -> str:
    """Add missing opening triple quotes to docstrings."""
    assert isinstance(content, str), "Content must be string"
    assert len(content) > 0, "Content cannot be empty"

    lines = content.split('\n')
    fixed_lines = []
    in_docstring = False

    for i, line in enumerate(lines):
        stripped = line.strip()

        # Pattern: Line with closing """ but no opening
        if stripped.endswith('"""') and not stripped.startswith('"""'):
            if not in_docstring and i > 0:
                # Check if previous lines look like docstring content
                prev_line = lines[i-1].strip() if i > 0 else ""
                if prev_line and not prev_line.startswith('#'):
                    # Insert opening """ before docstring content
                    indent = len(line) - len(line.lstrip())
                    fixed_lines.append(' ' * indent + '"""')
                    in_docstring = True

        # Track docstring state
        if '"""' in line:
            quote_count = line.count('"""')
            in_docstring = not in_docstring if quote_count % 2 == 1 else in_docstring

        fixed_lines.append(line)

    return '\n'.join(fixed_lines)


def fix_missing_function_docstrings(content: str) -> str:
    """Add opening quotes to function docstrings missing them."""
    assert isinstance(content, str), "Content must be string"
    assert len(content) > 0, "Content cannot be empty"

    # Pattern: def function(): \n Description \n """
    pattern = r'(def\s+\w+\([^)]*\):)\s*\n(\s+)([A-Z][^\n]+)\n(\s+)"""'

    def replacer(match):
        func_def = match.group(1)
        indent1 = match.group(2)
        desc = match.group(3)
        indent2 = match.group(4)
        return f'{func_def}\n{indent1}"""{desc}\n{indent2}"""'

    return re.sub(pattern, replacer, content)


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
    """Process single file with docstring fixes."""
    assert filepath.exists(), f"File must exist: {filepath}"
    assert filepath.suffix == '.py', "File must be Python"

    try:
        content = filepath.read_text(encoding='utf-8')
        original_content = content

        # Apply fixes
        if has_unterminated_docstring(content):
            content = fix_docstring_opening(content)
            content = fix_missing_function_docstrings(content)

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
    """Execute docstring surgeon on batch validation tests."""
    assert len(sys.argv) > 1, "Usage: docstring-surgeon.py <file1> [file2...]"

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
        'stage': 'docstring',
        'files_fixed': files_fixed,
        'files_remaining': files_remaining,
        'timestamp': datetime.utcnow().isoformat() + 'Z',
        'results': results
    }

    output_path = Path('.fixes/batchval/docstring-complete.json')
    output_path.write_text(json.dumps(completion, indent=2), encoding='utf-8')

    print(f"Docstring Surgeon Complete: {files_fixed} fixed, {files_remaining} remaining")
    return 0 if files_remaining == 0 else 1


if __name__ == '__main__':
    sys.exit(main())
