"""
Indentation Reconstructor - Fix indentation errors in tests/enterprise/

Patterns detected:
1. Unexpected indent/unindent after bracket fixes
2. 4-space indentation standard restoration

NASA Rule 10 compliant: <=60 lines per function, >=2 assertions
"""

import ast
import re
from pathlib import Path
from datetime import datetime
import json


def fix_indentation(filepath):
    """Fix indentation issues in Python file"""
    assert isinstance(filepath, Path), "filepath must be Path object"
    assert filepath.exists(), f"File must exist: {filepath}"

    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    fixed = False

    # Pattern: Closing paren with wrong indentation
    # Look for lines like "(        })" which should be at proper level
    for i, line in enumerate(lines):
        # Find misaligned closing brackets
        if re.match(r'^\(?\s+[\}\)]', line):
            # Should be at same level as opening
            lines[i] = re.sub(r'^\(\s+', '', line)
            lines[i] = re.sub(r'^\s+\}', '}', lines[i])
            lines[i] = re.sub(r'^\s+\)', ')', lines[i])
            fixed = True

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
    """Execute indentation reconstruction on all enterprise test files"""
    enterprise_dir = Path('tests/enterprise')
    assert enterprise_dir.exists(), "Enterprise test directory must exist"

    # Wait for bracket stage completion
    bracket_complete = Path('.fixes/enterprise/bracket-complete.json')
    assert bracket_complete.exists(), "Bracket stage must complete first"

    files = list(enterprise_dir.rglob('*.py'))
    assert len(files) > 0, "Must have Python files to process"

    fixed_count = 0
    remaining_errors = 0

    for filepath in files:
        was_fixed = fix_indentation(filepath)
        if was_fixed:
            fixed_count += 1

        if not validate_syntax(filepath):
            remaining_errors += 1

    result = {
        "stage": "indent",
        "files_fixed": fixed_count,
        "files_remaining": remaining_errors,
        "timestamp": datetime.utcnow().isoformat()
    }

    with open('.fixes/enterprise/indent-complete.json', 'w') as f:
        json.dump(result, f, indent=2)

    print(f"Indentation Reconstructor Complete: {fixed_count} files fixed, {remaining_errors} errors remaining")
    return result


if __name__ == '__main__':
    main()
