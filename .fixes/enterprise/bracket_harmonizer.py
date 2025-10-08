"""
Bracket Harmonizer - Fix mismatched brackets in tests/enterprise/

Patterns detected:
1. {) instead of {}
2. () split across lines with content between
3. Mismatched opening/closing bracket types

NASA Rule 10 compliant: <=60 lines per function, >=2 assertions
"""

import ast
import re
from pathlib import Path
from datetime import datetime
import json


def fix_bracket_mismatch(filepath):
    """Fix bracket type mismatches"""
    assert isinstance(filepath, Path), "filepath must be Path object"
    assert filepath.exists(), f"File must exist: {filepath}"

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content

    # Pattern 1: {) should be {}
    content = re.sub(r'\{\s*\)', '{}', content)

    # Pattern 2: (} should be ()
    content = re.sub(r'\(\s*\}', '()', content)

    # Pattern 3: Reconstruct split function calls like:
    # from feature_flags import ()
    #     FeatureState, FeatureFlag
    # ()
    # Should be: from feature_flags import (FeatureState, FeatureFlag)
    content = re.sub(
        r'import\s+\(\s*\)\s*\n\s*([A-Za-z_,\s]+)\s*\n\s*\(\s*\)',
        r'import (\1)',
        content
    )

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
        return True
    except SyntaxError:
        return False


def main():
    """Execute bracket harmonization on all enterprise test files"""
    enterprise_dir = Path('tests/enterprise')
    assert enterprise_dir.exists(), "Enterprise test directory must exist"

    # Wait for docstring stage completion
    docstring_complete = Path('.fixes/enterprise/docstring-complete.json')
    assert docstring_complete.exists(), "Docstring stage must complete first"

    files = list(enterprise_dir.rglob('*.py'))
    assert len(files) > 0, "Must have Python files to process"

    fixed_count = 0
    remaining_errors = 0

    for filepath in files:
        was_fixed = fix_bracket_mismatch(filepath)
        if was_fixed:
            fixed_count += 1

        if not validate_syntax(filepath):
            remaining_errors += 1

    result = {
        "stage": "bracket",
        "files_fixed": fixed_count,
        "files_remaining": remaining_errors,
        "timestamp": datetime.utcnow().isoformat()
    }

    with open('.fixes/enterprise/bracket-complete.json', 'w') as f:
        json.dump(result, f, indent=2)

    print(f"Bracket Harmonizer Complete: {fixed_count} files fixed, {remaining_errors} errors remaining")
    return result


if __name__ == '__main__':
    main()
