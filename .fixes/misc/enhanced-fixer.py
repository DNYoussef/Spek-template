#!/usr/bin/env python3
"""
Enhanced Fixer - Targeted fixes for miscellaneous test files
Addresses 3 primary error patterns:
1. Unterminated triple-quoted strings (17 files)
2. Invalid syntax (10 files)
3. Unexpected indent (10 files)
"""
import os
import ast
import json
import re
from datetime import datetime, timezone

MISC_DIRS = [
    "tests/safety", "tests/byzantium", "tests/cache_analyzer",
    "tests/cycles", "tests/debug", "tests/end_to_end", "tests/events",
    "tests/json_schema_validation", "tests/memory_integration",
    "tests/monitoring", "tests/nasa-compliance", "tests/performance",
    "tests/phase4", "tests/production", "tests/refactored",
    "tests/security", "tests/self-dogfooding", "tests/sixsigma",
    "tests/theater-detection", "tests/unit", "tests/version_log",
    "tests/workflow-validation"
]

def fix_unterminated_docstring(content, filepath, error_line):
    """Fix unterminated triple-quoted string"""
    assert isinstance(content, str), "Content must be string"
    assert isinstance(error_line, int), "Error line must be int"

    lines = content.split('\n')
    fixed = False

    # Check if line has opening """ without closing
    for i in range(min(30, len(lines))):
        line = lines[i]
        if '"""' in line:
            count = line.count('"""')
            if count % 2 != 0:
                # Odd number of """ - add closing at next logical point
                for j in range(i+1, min(i+20, len(lines))):
                    if lines[j].strip() and not lines[j].strip().startswith('"""'):
                        lines.insert(j, '"""')
                        fixed = True
                        break
                break

    if fixed:
        print(f"  Fixed unterminated docstring: {filepath}")
        return '\n'.join(lines), True

    return content, False

def fix_invalid_syntax_line3(content, filepath):
    """Fix invalid syntax at line 3 (common in refactored/batch2)"""
    assert isinstance(content, str), "Content must be string"

    lines = content.split('\n')
    if len(lines) > 3:
        line3 = lines[2].strip()
        # Pattern: missing opening quote
        if line3 and not line3.startswith(('"""', "'''", '#', 'import', 'from')):
            lines[2] = '"""\n' + lines[2]
            print(f"  Fixed line 3 syntax: {filepath}")
            return '\n'.join(lines), True

    return content, False

def fix_unexpected_indent_line2(content, filepath):
    """Fix unexpected indent at line 2-3"""
    assert isinstance(content, str), "Content must be string"

    lines = content.split('\n')
    fixed = False

    for i in range(1, min(5, len(lines))):
        if lines[i].startswith('    ') and i < 2:
            # Remove leading spaces from early lines
            lines[i] = lines[i].lstrip()
            fixed = True

    if fixed:
        print(f"  Fixed early indent: {filepath}")
        return '\n'.join(lines), True

    return content, False

def validate_syntax(content):
    """Check if content has valid Python syntax"""
    assert isinstance(content, str), "Content must be string"

    try:
        ast.parse(content)
        return True, None
    except SyntaxError as e:
        return False, f"{e.msg} (line {e.lineno})"
    except Exception as e:
        return False, f"{type(e).__name__}: {str(e)}"

def extract_error_line(error_msg):
    """Extract line number from error message"""
    match = re.search(r'line (\d+)', error_msg)
    if match:
        return int(match.group(1))
    return None

def process_files_by_error():
    """Process files grouped by error type"""
    # Load previous validation results
    with open('.fixes/misc/validate-complete.json', 'r') as f:
        validation = json.load(f)

    files_fixed = 0
    files_remaining = 0
    results = []

    for result in validation['results']:
        if result['status'] == 'valid':
            continue

        filepath = result['file']
        error = result.get('error', '')

        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()

            original = content
            was_fixed = False

            # Apply targeted fixes
            if 'unterminated triple-quoted' in error:
                error_line = extract_error_line(error)
                content, was_fixed = fix_unterminated_docstring(
                    content, filepath, error_line or 1
                )
            elif 'invalid syntax' in error and 'line 3' in error:
                content, was_fixed = fix_invalid_syntax_line3(
                    content, filepath
                )
            elif 'unexpected indent' in error and 'line 2' in error:
                content, was_fixed = fix_unexpected_indent_line2(
                    content, filepath
                )

            if was_fixed:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)

                valid, new_error = validate_syntax(content)
                if valid:
                    files_fixed += 1
                    results.append({
                        "file": filepath,
                        "status": "fixed",
                        "original_error": error
                    })
                else:
                    files_remaining += 1
                    results.append({
                        "file": filepath,
                        "status": "partial",
                        "original_error": error,
                        "new_error": new_error
                    })
            else:
                files_remaining += 1

        except Exception as e:
            print(f"Error processing {filepath}: {e}")
            files_remaining += 1

    return files_fixed, files_remaining, results

def main():
    """Execute enhanced fixer"""
    print("Enhanced Fixer - Targeted Error Pattern Fixes")
    print("=" * 60)

    files_fixed, files_remaining, results = process_files_by_error()

    completion = {
        "stage": "enhanced_fix",
        "files_fixed": files_fixed,
        "files_remaining": files_remaining,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "results": results
    }

    with open('.fixes/misc/enhanced-complete.json', 'w') as f:
        json.dump(completion, f, indent=2)

    print(f"\nFixed: {files_fixed} files")
    print(f"Remaining: {files_remaining} files")
    print(f"Completion: .fixes/misc/enhanced-complete.json")

if __name__ == '__main__':
    main()
