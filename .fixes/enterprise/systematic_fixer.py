"""
Systematic Python Test Fixer for tests/enterprise/

Fixes all common patterns in one pass with NASA Rule 10 compliance
"""

import re
import ast
from pathlib import Path
from datetime import datetime
import json


def fix_file_comprehensive(filepath):
    """Apply all fixes to a single file"""
    assert isinstance(filepath, Path), "Must be Path object"
    assert filepath.exists(), f"File must exist: {filepath}"

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content

    # Fix 1: Missing opening triple-quote before docstring
    lines = content.split('\n')
    if len(lines) > 3:
        # Check lines 1-3 for pattern: import ... \n\n docstring_text
        if (lines[0].startswith('from ') and
            lines[1] == '' and
            not lines[2].startswith('"""') and
            '"""' in lines[3:10]):
            lines.insert(2, '"""')
            content = '\n'.join(lines)

    # Fix 2: Bracket mismatches - () instead of {}
    content = re.sub(r'import\s+\(\s*\)\s*\n\s*([A-Za-z_,\s]+)\s*\n\s*\(\s*\)',
                     r'import (\1)', content)

    # Fix 3: Split function calls - func()\n  args\n()
    content = re.sub(r'(\w+)\(\s*\)\s*\n\s+([^)]+)\s*\n\s*\(\s*\)',
                     r'\1(\2)', content)

    # Fix 4: Dict brackets - {) should be {}
    content = re.sub(r'\{\s*\)', '{}', content)
    content = re.sub(r'\(\s*\}', '()', content)

    # Fix 5: Mismatched dict closing - (  }) should be })
    content = re.sub(r'\(\s+\}', '}', content)

    fixed = content != original

    if fixed:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)

    return fixed


def validate_syntax(filepath):
    """Validate file syntax"""
    assert isinstance(filepath, Path), "Must be Path object"

    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            ast.parse(f.read())
        return True, None
    except SyntaxError as e:
        return False, f"{e.lineno}:{e.msg}"


def main():
    """Fix all enterprise test files systematically"""
    enterprise_dir = Path('tests/enterprise')
    assert enterprise_dir.exists(), "Enterprise dir must exist"

    files = list(enterprise_dir.rglob('*.py'))
    assert len(files) > 0, "Must have files to process"

    fixes_applied = 0
    passing = []
    failing = []

    for filepath in files:
        was_fixed = fix_file_comprehensive(filepath)
        if was_fixed:
            fixes_applied += 1

        valid, error = validate_syntax(filepath)
        if valid:
            passing.append(filepath.name)
        else:
            failing.append({'file': filepath.name, 'error': error})

    result = {
        'stage': 'systematic_fix',
        'files_processed': len(files),
        'fixes_applied': fixes_applied,
        'files_passing': len(passing),
        'files_failing': len(failing),
        'passing': passing,
        'failures': [f"{f['file']}:{f['error']}" for f in failing],
        'timestamp': datetime.now().isoformat()
    }

    with open('.fixes/enterprise/systematic-complete.json', 'w') as f:
        json.dump(result, f, indent=2)

    print(f"Systematic Fix Complete:")
    print(f"  Processed: {len(files)} files")
    print(f"  Fixed: {fixes_applied} files")
    print(f"  Passing: {len(passing)}/{len(files)}")

    return result


if __name__ == '__main__':
    main()
