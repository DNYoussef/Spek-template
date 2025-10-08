"""
Syntax Validator - Final validation and edge case fixes for tests/enterprise/

Validates all files with ast.parse and fixes remaining edge cases

NASA Rule 10 compliant: <=60 lines per function, >=2 assertions
"""

import ast
import re
from pathlib import Path
from datetime import datetime
import json


def fix_edge_cases(filepath):
    """Fix remaining edge case syntax errors"""
    assert isinstance(filepath, Path), "filepath must be Path object"
    assert filepath.exists(), f"File must exist: {filepath}"

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content

    # Edge case 1: Unmatched closing parenthesis
    # Look for lines with unmatched )
    lines = content.split('\n')
    for i, line in enumerate(lines):
        # Count opening and closing parens on this line
        open_count = line.count('(')
        close_count = line.count(')')

        if close_count > open_count:
            # Remove excess closing parens
            diff = close_count - open_count
            lines[i] = line.replace(')', '', diff)

    content = '\n'.join(lines)
    fixed = content != original

    if fixed:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)

    return fixed


def validate_syntax(filepath):
    """Validate Python syntax using ast.parse"""
    assert isinstance(filepath, Path), "filepath must be Path object"
    assert filepath.exists(), f"File must exist: {filepath}"

    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            ast.parse(f.read())
        return True, None
    except SyntaxError as e:
        return False, f"{e.lineno}:{e.msg}"


def main():
    """Execute final validation on all enterprise test files"""
    enterprise_dir = Path('tests/enterprise')
    assert enterprise_dir.exists(), "Enterprise test directory must exist"

    # Wait for indent stage completion
    indent_complete = Path('.fixes/enterprise/indent-complete.json')
    assert indent_complete.exists(), "Indent stage must complete first"

    files = list(enterprise_dir.rglob('*.py'))
    assert len(files) > 0, "Must have Python files to process"

    fixed_count = 0
    success_count = 0
    failures = []

    for filepath in files:
        was_fixed = fix_edge_cases(filepath)
        if was_fixed:
            fixed_count += 1

        valid, error = validate_syntax(filepath)
        if valid:
            success_count += 1
        else:
            failures.append(f"{filepath.name}: {error}")

    result = {
        "stage": "validate",
        "files_fixed": fixed_count,
        "files_passing": success_count,
        "files_failing": len(failures),
        "failures": failures,
        "timestamp": datetime.utcnow().isoformat()
    }

    with open('.fixes/enterprise/validate-complete.json', 'w') as f:
        json.dump(result, f, indent=2)

    print(f"Syntax Validator Complete: {success_count}/{len(files)} passing")
    for failure in failures:
        print(f"  FAIL: {failure}")

    return result


if __name__ == '__main__':
    main()
