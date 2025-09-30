#!/usr/bin/env python3
"""
Docstring Surgeon - Stage 1 of Miscellaneous Directory Agent
Fixes unterminated triple-quoted strings in test files
"""
import os
import ast
import json
import re
from pathlib import Path
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

def fix_missing_docstring_opener(content, filepath):
    """Fix missing opening triple-quote for module docstring"""
    assert isinstance(content, str), "Content must be string"
    assert len(filepath) > 0, "Filepath cannot be empty"

    lines = content.split('\n')

    for i in range(min(20, len(lines))):
        line = lines[i].strip()

        if not line or line.startswith('import ') or \
           line.startswith('from ') or line.startswith('#'):
            continue

        if not line.startswith('"""') and not line.startswith("'''"):
            for j in range(i + 1, min(i + 15, len(lines))):
                if lines[j].strip() == '"""':
                    lines[i] = '"""\n' + lines[i]
                    print(f"  Fixed docstring at line {i+1}: {filepath}")
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

def process_files():
    """Process all miscellaneous test files"""
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

                    fixed, was_fixed = fix_missing_docstring_opener(
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
                                "validator": "docstring_surgeon"
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
                            results.append({
                                "file": filepath,
                                "status": "unchanged",
                                "error": error
                            })

                except Exception as e:
                    print(f"Error processing {filepath}: {e}")
                    files_remaining += 1

    return files_fixed, files_remaining, results

def main():
    """Execute docstring surgeon stage"""
    print("Stage 1: Docstring Surgeon")
    print("=" * 60)

    files_fixed, files_remaining, results = process_files()

    completion = {
        "stage": "docstring",
        "files_fixed": files_fixed,
        "files_remaining": files_remaining,
        "timestamp": datetime.utcnow().isoformat(),
        "results": results
    }

    os.makedirs('.fixes/misc', exist_ok=True)
    with open('.fixes/misc/docstring-complete.json', 'w') as f:
        json.dump(completion, f, indent=2)

    print(f"\nFixed: {files_fixed} files")
    print(f"Remaining: {files_remaining} files")
    print(f"Completion: .fixes/misc/docstring-complete.json")

if __name__ == '__main__':
    main()
