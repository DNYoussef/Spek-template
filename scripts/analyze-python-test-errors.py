#!/usr/bin/env python3
"""
Comprehensive analysis of Python test syntax errors
Identifies patterns and groups files for systematic fixing
"""
import os
import ast
import sys
from pathlib import Path
from collections import defaultdict

def analyze_test_files(test_dir='tests'):
    """Analyze all test files for syntax errors"""
    errors = {}
    error_details = {}

    for root, dirs, files in os.walk(test_dir):
        # Skip __pycache__ and hidden directories
        dirs[:] = [d for d in dirs if not d.startswith('.') and d != '__pycache__']

        for file in files:
            if not file.endswith('.py'):
                continue

            filepath = os.path.join(root, file)
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
                    ast.parse(content)
            except SyntaxError as e:
                error_key = f"{e.msg} (line {e.lineno})"
                errors[filepath] = error_key
                error_details[filepath] = {
                    'msg': e.msg,
                    'lineno': e.lineno,
                    'offset': e.offset,
                    'text': e.text
                }
            except Exception as e:
                error_key = f"{type(e).__name__}"
                errors[filepath] = error_key
                error_details[filepath] = {
                    'msg': str(e),
                    'lineno': 0,
                    'offset': 0,
                    'text': ''
                }

    return errors, error_details

def group_by_pattern(errors):
    """Group errors by pattern"""
    grouped = defaultdict(list)
    for path, error in errors.items():
        grouped[error].append(path)
    return grouped

def identify_fix_strategies(grouped_errors, error_details):
    """Identify fix strategies for each error pattern"""
    strategies = {}

    for error_pattern, files in grouped_errors.items():
        # Check first file to identify pattern
        first_file = files[0]
        details = error_details[first_file]

        if 'unterminated' in details['msg'].lower() and details['lineno'] <= 15:
            strategies[error_pattern] = {
                'strategy': 'missing_docstring_opener',
                'description': 'Missing opening triple-quote for module docstring',
                'line_range': (1, 15),
                'fix': 'Add """ before docstring text'
            }
        elif 'unexpected indent' in details['msg'].lower():
            strategies[error_pattern] = {
                'strategy': 'indentation_corruption',
                'description': 'Malformed function call with parenthesis on wrong line',
                'line_range': (details['lineno'] - 5, details['lineno'] + 5),
                'fix': 'Move opening parenthesis to function call line'
            }
        elif 'invalid syntax' in details['msg'].lower() and details['lineno'] <= 10:
            strategies[error_pattern] = {
                'strategy': 'missing_import_or_docstring',
                'description': 'Early syntax error - likely import or docstring issue',
                'line_range': (1, 20),
                'fix': 'Check imports and docstrings'
            }
        else:
            strategies[error_pattern] = {
                'strategy': 'unknown',
                'description': f'{details["msg"]} at line {details["lineno"]}',
                'line_range': (details['lineno'] - 10, details['lineno'] + 10),
                'fix': 'Manual inspection required'
            }

    return strategies

def main():
    print("Analyzing Python test files for syntax errors...")
    print("=" * 80)

    errors, error_details = analyze_test_files()

    if not errors:
        print("SUCCESS: No syntax errors found in any test files!")
        return 0

    print(f"\nFound {len(errors)} files with syntax errors\n")

    grouped = group_by_pattern(errors)
    strategies = identify_fix_strategies(grouped, error_details)

    # Print summary by pattern
    print("ERROR PATTERNS (grouped by frequency):")
    print("-" * 80)
    for error_pattern, files in sorted(grouped.items(), key=lambda x: -len(x[1])):
        print(f"\n[{len(files):3d} files] {error_pattern}")
        strategy = strategies.get(error_pattern, {})
        if strategy:
            print(f"  Strategy: {strategy.get('strategy', 'unknown')}")
            print(f"  Fix: {strategy.get('fix', 'unknown')}")

        # Show first 5 affected files
        for filepath in files[:5]:
            print(f"    - {filepath}")
        if len(files) > 5:
            print(f"    ... and {len(files) - 5} more files")

    # Print detailed breakdown by strategy
    print("\n" + "=" * 80)
    print("FIX STRATEGY SUMMARY:")
    print("-" * 80)

    strategy_counts = defaultdict(list)
    for error_pattern, files in grouped.items():
        strategy = strategies[error_pattern]['strategy']
        strategy_counts[strategy].extend(files)

    for strategy, files in sorted(strategy_counts.items(), key=lambda x: -len(x[1])):
        print(f"\n{strategy.upper()}: {len(files)} files")
        details = next((s for s in strategies.values() if s['strategy'] == strategy), {})
        if details:
            print(f"  Description: {details.get('description', 'N/A')}")
            print(f"  Fix: {details.get('fix', 'N/A')}")

    print("\n" + "=" * 80)
    print(f"TOTAL: {len(errors)} files need fixing")
    print("=" * 80)

    return 1

if __name__ == '__main__':
    sys.exit(main())
