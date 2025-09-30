#!/usr/bin/env python3
"""
Surgical Fixer - Apply minimal targeted fixes to specific syntax errors.
Only fixes the exact lines reported by ast.parse errors.
"""
import sys
import re
from pathlib import Path
from datetime import datetime
import json
import ast


def fix_file_errors(filepath: Path, errors: dict) -> bool:
    """Apply surgical fixes based on known error patterns."""
    assert filepath.exists(), f"File must exist: {filepath}"
    assert filepath.suffix == '.py', "File must be Python"

    content = filepath.read_text(encoding='utf-8')
    lines = content.split('\n')
    modified = False

    file_key = str(filepath).replace('\\', '/')

    if 'batch2_validation/run_validation.py' in file_key:
        # Fix Line 178: expected indented block after else
        for i, line in enumerate(lines):
            if i == 177 and line.strip() == 'pass' and lines[i-1].strip().endswith('else:'):
                lines[i] = '                                    pass'
                modified = True
                break

    elif 'batch2_validation/test_builder_patterns.py' in file_key:
        # Fix Line 50: expected indented block after if
        for i, line in enumerate(lines):
            if i == 49 and line.strip() == 'continue' and 'if not setter_methods:' in lines[i-1]:
                lines[i] = '                        continue'
                modified = True
                break

    elif 'batch2_validation/test_regression.py' in file_key:
        # Fix Line 61: missing try before except
        for i, line in enumerate(lines):
            if i == 60 and line.strip().startswith('except ImportError:'):
                # Add try block before the check_compliance call
                for j in range(i-5, i):
                    if 'check_compliance()' in lines[j]:
                        lines[j] = lines[j].replace('engine.check_compliance()', 'try:\n                                engine.check_compliance()\n                            ')
                        modified = True
                        break
                break

    elif 'batch3_validation/run_validation.py' in file_key:
        # Fix Line 35: except with wrong indentation
        for i, line in enumerate(lines):
            if i == 34 and 'except Exception' in line:
                lines[i] = '        except Exception as e:'
                modified = True
                break

    elif 'batch3_validation/test_strategy_pattern_validation.py' in file_key:
        # Fix Line 612: unterminated triple-quoted string
        for i, line in enumerate(lines):
            if i == 611 and '"""Run comprehensive' in line and not line.strip().startswith('"""'):
                # Add opening triple quotes
                indent = len(line) - len(line.lstrip())
                lines[i] = ' ' * indent + '"""Run comprehensive Batch 3 validation tests."""'
                modified = True
                break

    elif 'batches_10_18_validation/batch_pattern_validators.py' in file_key:
        # Fix Line 97: unmatched )
        for i, line in enumerate(lines):
            if i == 96 and '):)' in line or '):' in line and line.count(')') > line.count('('):
                lines[i] = line.replace(':)', ':')
                modified = True
                break

    elif 'batches_10_18_validation/run_validation.py' in file_key:
        # Fix Line 64: expected indented block after for
        for i, line in enumerate(lines):
            if i == 63 and line.strip().startswith('print(') and 'for issue' in lines[i-1]:
                lines[i] = '                        print(f"      - {issue}")'
                modified = True
                break

    elif 'batches_10_18_validation/test_suite_orchestrator.py' in file_key:
        # Fix Line 854: invalid decimal literal (missing spaces in f-string)
        for i, line in enumerate(lines):
            if i == 853 and '{passed/max' in line:
                lines[i] = line.replace('{passed/max(1, total)*100', '{passed / max(1, total) * 100')
                lines[i] = lines[i].replace('{failed/max(1, total)*100', '{failed / max(1, total) * 100')
                lines[i] = lines[i].replace('{partial/max(1, total)*100', '{partial / max(1, total) * 100')
                modified = True

    if modified:
        filepath.write_text('\n'.join(lines), encoding='utf-8')
        return True

    return False


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


def main():
    """Execute surgical fixes on batch validation tests."""
    assert len(sys.argv) > 1, "Usage: surgical-fixer.py <file1> [file2...]"

    results = []
    files_fixed = 0
    files_remaining = 0

    errors_map = {}  # Store known errors

    for filepath_str in sys.argv[1:]:
        filepath = Path(filepath_str)
        if not filepath.exists():
            continue

        fixed = fix_file_errors(filepath, errors_map)
        valid, msg = validate_syntax(filepath)

        result = {
            'file': str(filepath),
            'fixed': fixed,
            'valid': valid,
            'message': msg
        }
        results.append(result)

        if fixed:
            files_fixed += 1
        if not valid:
            files_remaining += 1

    # Write completion report
    completion = {
        'stage': 'surgical',
        'files_fixed': files_fixed,
        'files_remaining': files_remaining,
        'timestamp': datetime.now().isoformat(),
        'results': results
    }

    output_path = Path('.fixes/batchval/surgical-complete.json')
    output_path.write_text(json.dumps(completion, indent=2), encoding='utf-8')

    print(f"\nSurgical Fixer Complete:")
    print(f"  Fixed: {files_fixed}")
    print(f"  Remaining: {files_remaining}")

    if files_remaining > 0:
        print(f"\nRemaining errors:")
        for result in results:
            if not result['valid']:
                print(f"  {result['file']}: {result['message']}")

    return 0 if files_remaining == 0 else 1


if __name__ == '__main__':
    sys.exit(main())
