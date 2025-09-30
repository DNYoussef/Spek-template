#!/usr/bin/env python3
"""
Bracket Harmonizer - Stage 2 of Miscellaneous Directory Agent
Fixes mismatched brackets: {), ()split across lines
WAITS for docstring-complete.json before executing
"""
import os
import ast
import json
import re
from datetime import datetime

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

def fix_bracket_mismatch(content, filepath):
    """Fix {) instead of {} and () split across lines"""
    assert isinstance(content, str), "Content must be string"
    assert len(filepath) > 0, "Filepath cannot be empty"

    fixes_made = 0
    original = content

    # Pattern 1: function() \n args \n ( )
    content = re.sub(
        r'([\w.]+)\(\)\s+([^)]+?)\s+\(\s+\)',
        r'\1(\n            \2\n        )',
        content,
        flags=re.MULTILINE | re.DOTALL
    )
    if content != original:
        fixes_made += 1
        original = content

    # Pattern 2: dict.append({) \n items \n ( })
    content = re.sub(
        r'\.append\(\{\)\s+([^}]+?)\s+\(\s+\}\)',
        r'.append({\n            \1\n        })',
        content,
        flags=re.MULTILINE | re.DOTALL
    )
    if content != original:
        fixes_made += 1
        original = content

    # Pattern 3: result = function() \n args \n ( )
    content = re.sub(
        r'=\s+([\w.]+)\(\)\s+([^)]+?)\s+\(\s+\)',
        r'= \1(\n            \2\n        )',
        content,
        flags=re.MULTILINE | re.DOTALL
    )
    if content != original:
        fixes_made += 1

    if fixes_made > 0:
        print(f"  Fixed {fixes_made} bracket issues: {filepath}")
        return content, True

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

def wait_for_previous_stage():
    """Wait for docstring-complete.json"""
    assert os.path.exists('.fixes/misc/docstring-complete.json'), \
        "Must complete docstring stage first"

def process_files():
    """Process all files with bracket issues"""
    files_fixed = 0
    files_remaining = 0
    results = []

    for test_dir in MISC_DIRS:
        if not os.path.exists(test_dir):
            continue

        for root, _, files in os.walk(test_dir):
            for filename in files:
                if not filename.endswith('.py'):
                    continue

                filepath = os.path.join(root, filename)

                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        original = f.read()

                    fixed, was_fixed = fix_bracket_mismatch(
                        original,
                        filepath
                    )

                    if was_fixed:
                        with open(filepath, 'w', encoding='utf-8') as f:
                            f.write(fixed)

                        valid, error = validate_syntax(fixed)
                        if valid:
                            files_fixed += 1
                            results.append({
                                "file": filepath,
                                "status": "fixed",
                                "validator": "bracket_harmonizer"
                            })
                        else:
                            files_remaining += 1
                            results.append({
                                "file": filepath,
                                "status": "partial",
                                "error": error
                            })
                    else:
                        valid, error = validate_syntax(original)
                        if not valid:
                            files_remaining += 1

                except Exception as e:
                    print(f"Error processing {filepath}: {e}")
                    files_remaining += 1

    return files_fixed, files_remaining, results

def main():
    """Execute bracket harmonizer stage"""
    print("Stage 2: Bracket Harmonizer")
    print("=" * 60)

    wait_for_previous_stage()

    files_fixed, files_remaining, results = process_files()

    completion = {
        "stage": "bracket",
        "files_fixed": files_fixed,
        "files_remaining": files_remaining,
        "timestamp": datetime.utcnow().isoformat(),
        "results": results
    }

    with open('.fixes/misc/bracket-complete.json', 'w') as f:
        json.dump(completion, f, indent=2)

    print(f"\nFixed: {files_fixed} files")
    print(f"Remaining: {files_remaining} files")
    print(f"Completion: .fixes/misc/bracket-complete.json")

if __name__ == '__main__':
    main()
