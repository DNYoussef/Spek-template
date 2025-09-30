#!/usr/bin/env python3
"""
Syntax Validator - Final validation and edge case fixes.
Validates all files with ast.parse and reports results.
"""
import sys
from pathlib import Path
from datetime import datetime
import json
import ast


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
    """Validate single file syntax."""
    assert filepath.exists(), f"File must exist: {filepath}"
    assert filepath.suffix == '.py', "File must be Python"

    valid, msg = validate_syntax(filepath)

    return {
        'file': str(filepath),
        'valid': valid,
        'message': msg
    }


def main():
    """Execute syntax validator on batch validation tests."""
    assert len(sys.argv) > 1, "Usage: syntax-validator.py <file1> [file2...]"

    # Wait for indent stage completion
    indent_complete = Path('.fixes/batchval/indent-complete.json')
    assert indent_complete.exists(), "Must run indent-reconstructor.py first"

    results = []
    files_valid = 0
    files_invalid = 0

    for filepath_str in sys.argv[1:]:
        filepath = Path(filepath_str)
        if not filepath.exists():
            continue

        result = process_file(filepath)
        results.append(result)

        if result['valid']:
            files_valid += 1
        else:
            files_invalid += 1

    # Write completion report
    completion = {
        'stage': 'validate',
        'files_valid': files_valid,
        'files_invalid': files_invalid,
        'timestamp': datetime.utcnow().isoformat() + 'Z',
        'results': results
    }

    output_path = Path('.fixes/batchval/validate-complete.json')
    output_path.write_text(json.dumps(completion, indent=2), encoding='utf-8')

    print(f"\nSyntax Validator Complete:")
    print(f"  Valid: {files_valid}")
    print(f"  Invalid: {files_invalid}")

    if files_invalid > 0:
        print(f"\nRemaining errors:")
        for result in results:
            if not result['valid']:
                print(f"  {result['file']}: {result['message']}")

    return 0 if files_invalid == 0 else 1


if __name__ == '__main__':
    sys.exit(main())
