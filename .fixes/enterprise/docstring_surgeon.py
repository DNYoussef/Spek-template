"""
Docstring Surgeon - Fix unterminated triple-quoted strings in tests/enterprise/

Patterns detected:
1. Missing opening triple-quote before docstring text (lines 1-20)
2. Lines ending with triple-quote but no opening

NASA Rule 10 compliant: <=60 lines per function, >=2 assertions
"""

import ast
import re
from pathlib import Path
from datetime import datetime
import json


def fix_docstring_in_file(filepath):
    """Fix missing opening triple-quotes in docstring"""
    assert isinstance(filepath, Path), "filepath must be Path object"
    assert filepath.exists(), f"File must exist: {filepath}"

    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    fixed = False

    # Pattern 1: Missing opening """ before docstring text (lines 1-20)
    for i in range(min(20, len(lines))):
        line = lines[i]

        # Check if line has closing """ but previous lines don't have opening
        if '"""' in line and not line.strip().startswith('"""'):
            # Look backwards for opening """
            has_opening = False
            for j in range(i - 1, -1, -1):
                if '"""' in lines[j]:
                    has_opening = True
                    break

            # If no opening found, add it
            if not has_opening:
                # Find first line that looks like docstring text
                for k in range(max(0, i - 10), i):
                    if lines[k].strip() and not lines[k].strip().startswith('#'):
                        if not lines[k].strip().startswith('"""'):
                            lines[k] = '"""\n' + lines[k]
                            fixed = True
                            break

    if fixed:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.writelines(lines)

    return fixed


def validate_syntax(filepath):
    """Validate Python syntax using ast.parse"""
    assert isinstance(filepath, Path), "filepath must be Path object"
    assert filepath.exists(), f"File must exist: {filepath}"

    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            ast.parse(f.read())
        return True
    except SyntaxError:
        return False


def main():
    """Execute docstring surgery on all enterprise test files"""
    enterprise_dir = Path('tests/enterprise')
    assert enterprise_dir.exists(), "Enterprise test directory must exist"

    files = list(enterprise_dir.rglob('*.py'))
    assert len(files) > 0, "Must have Python files to process"

    fixed_count = 0
    remaining_errors = 0

    for filepath in files:
        was_fixed = fix_docstring_in_file(filepath)
        if was_fixed:
            fixed_count += 1

        if not validate_syntax(filepath):
            remaining_errors += 1

    result = {
        "stage": "docstring",
        "files_fixed": fixed_count,
        "files_remaining": remaining_errors,
        "timestamp": datetime.utcnow().isoformat()
    }

    with open('.fixes/enterprise/docstring-complete.json', 'w') as f:
        json.dump(result, f, indent=2)

    print(f"Docstring Surgeon Complete: {fixed_count} files fixed, {remaining_errors} errors remaining")
    return result


if __name__ == '__main__':
    main()
