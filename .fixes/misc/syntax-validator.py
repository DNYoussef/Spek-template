#!/usr/bin/env python3
"""
Syntax Validator - Stage 4 of Miscellaneous Directory Agent
Validates all files with ast.parse() and fixes edge cases
WAITS for indent-complete.json before executing
"""
import os
import ast
import json
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
    """Wait for indent-complete.json"""
    assert os.path.exists('.fixes/misc/indent-complete.json'), \
        "Must complete indent stage first"

def validate_all_files():
    """Validate all files and report results"""
    success_count = 0
    failure_count = 0
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
                        content = f.read()

                    valid, error = validate_syntax(content)

                    if valid:
                        success_count += 1
                        results.append({
                            "file": filepath,
                            "status": "valid"
                        })
                        print(f"  VALID: {filepath}")
                    else:
                        failure_count += 1
                        results.append({
                            "file": filepath,
                            "status": "invalid",
                            "error": error
                        })
                        print(f"  INVALID: {filepath}")
                        print(f"    Error: {error}")

                except Exception as e:
                    failure_count += 1
                    print(f"Error reading {filepath}: {e}")

    return success_count, failure_count, results

def main():
    """Execute syntax validator stage"""
    print("Stage 4: Syntax Validator")
    print("=" * 60)

    wait_for_previous_stage()

    success, failure, results = validate_all_files()

    completion = {
        "stage": "validate",
        "files_valid": success,
        "files_invalid": failure,
        "timestamp": datetime.utcnow().isoformat(),
        "results": results
    }

    with open('.fixes/misc/validate-complete.json', 'w') as f:
        json.dump(completion, f, indent=2)

    print(f"\n{'=' * 60}")
    print(f"FINAL RESULTS:")
    print(f"  Valid files: {success}")
    print(f"  Invalid files: {failure}")
    print(f"  Success rate: {success/(success+failure)*100:.1f}%")
    print(f"\nCompletion: .fixes/misc/validate-complete.json")

if __name__ == '__main__':
    main()
