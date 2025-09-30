#!/usr/bin/env python3
"""
Indentation Reconstructor - Stage 3 of Miscellaneous Directory Agent
Fixes unexpected indent/unindent after bracket fixes
WAITS for bracket-complete.json before executing
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

def fix_indentation(content, filepath):
    """Restore 4-space indentation levels"""
    assert isinstance(content, str), "Content must be string"
    assert len(filepath) > 0, "Filepath cannot be empty"

    lines = content.split('\n')
    fixed_lines = []
    current_indent = 0
    fixes_made = 0

    for i, line in enumerate(lines):
        if not line.strip():
            fixed_lines.append(line)
            continue

        leading_spaces = len(line) - len(line.lstrip())

        # Detect indent level changes
        if line.strip().endswith(':'):
            # Line ends with colon, increase indent
            fixed_lines.append(' ' * current_indent + line.lstrip())
            current_indent += 4
        elif line.strip() in [')', '}', ']']:
            # Closing bracket, decrease indent
            current_indent = max(0, current_indent - 4)
            fixed_lines.append(' ' * current_indent + line.lstrip())
        elif leading_spaces % 4 != 0 and leading_spaces > 0:
            # Non-4-space indent, normalize
            normalized_indent = (leading_spaces // 4) * 4
            fixed_lines.append(' ' * normalized_indent + line.lstrip())
            fixes_made += 1
        else:
            fixed_lines.append(line)

    if fixes_made > 0:
        print(f"  Fixed {fixes_made} indentation issues: {filepath}")
        return '\n'.join(fixed_lines), True

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
    """Wait for bracket-complete.json"""
    assert os.path.exists('.fixes/misc/bracket-complete.json'), \
        "Must complete bracket stage first"

def process_files():
    """Process all files with indentation issues"""
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

                    fixed, was_fixed = fix_indentation(original, filepath)

                    if was_fixed:
                        with open(filepath, 'w', encoding='utf-8') as f:
                            f.write(fixed)

                        valid, error = validate_syntax(fixed)
                        if valid:
                            files_fixed += 1
                            results.append({
                                "file": filepath,
                                "status": "fixed",
                                "validator": "indent_reconstructor"
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
    """Execute indentation reconstructor stage"""
    print("Stage 3: Indentation Reconstructor")
    print("=" * 60)

    wait_for_previous_stage()

    files_fixed, files_remaining, results = process_files()

    completion = {
        "stage": "indent",
        "files_fixed": files_fixed,
        "files_remaining": files_remaining,
        "timestamp": datetime.utcnow().isoformat(),
        "results": results
    }

    with open('.fixes/misc/indent-complete.json', 'w') as f:
        json.dump(completion, f, indent=2)

    print(f"\nFixed: {files_fixed} files")
    print(f"Remaining: {files_remaining} files")
    print(f"Completion: .fixes/misc/indent-complete.json")

if __name__ == '__main__':
    main()
