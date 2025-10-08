#!/usr/bin/env python3
"""
Master Python test fixer - Systematic fix for all test syntax errors
Handles 2 primary patterns:
1. Missing docstring opener (triple-quote at line 3)
2. Indentation corruption (function with args on wrong line)
"""
import os
import re
import ast
from pathlib import Path

def fix_missing_docstring_opener(content, filepath):
    """Fix missing opening triple-quote for module docstring"""
    lines = content.split('\n')

    # Pattern: First non-import line starts text without """
    # Check first 20 lines for pattern
    for i in range(min(20, len(lines))):
        line = lines[i].strip()

        # Skip empty lines, imports, and comments
        if not line or line.startswith('import ') or line.startswith('from ') or line.startswith('#'):
            continue

        # If we hit a line that looks like docstring text without """
        if not line.startswith('"""') and not line.startswith("'''"):
            # Check if next few lines end with """
            for j in range(i + 1, min(i + 15, len(lines))):
                if lines[j].strip() == '"""':
                    # Found closing """, need to add opening
                    lines[i] = '"""\n' + lines[i]
                    print(f"  Fixed missing docstring opener at line {i+1}: {filepath}")
                    return '\n'.join(lines), True

    return content, False

def fix_indentation_corruption(content, filepath):
    """Fix function() \\n args \\n ( ) pattern"""
    # This is the same corruption pattern we've been fixing
    # Pattern matches:
    # - function()
    # -     arg1,
    # -     arg2
    # - (    )

    fixes_made = 0

    # Pattern 1: await function() \n args \n ( )
    content_before = content
    content = re.sub(
        r'([\w.]+)\(\)\s+([^)]+?)\s+\(\s+\)',
        r'\1(\n            \2\n        )',
        content,
        flags=re.MULTILINE
    )
    if content != content_before:
        fixes_made += 1
        content_before = content

    # Pattern 2: dict.append({) \n items \n ( })
    content = re.sub(
        r'\.append\(\{\)\s+([^}]+?)\s+\(\s+\}\)',
        r'.append({\n            \1\n        })',
        content,
        flags=re.MULTILINE
    )
    if content != content_before:
        fixes_made += 1
        content_before = content

    # Pattern 3: result = function() \n args \n ( )
    content = re.sub(
        r'= ([\w.]+)\(\)\s+([^)]+?)\s+\(\s+\)',
        r'= \1(\n            \2\n        )',
        content,
        flags=re.MULTILINE
    )
    if content != content_before:
        fixes_made += 1

    if fixes_made > 0:
        print(f"  Fixed {fixes_made} indentation corruption(s): {filepath}")
        return content, True

    return content, False

def validate_syntax(content):
    """Check if content has valid Python syntax"""
    try:
        ast.parse(content)
        return True, None
    except SyntaxError as e:
        return False, f"{e.msg} (line {e.lineno})"
    except Exception as e:
        return False, f"{type(e).__name__}: {str(e)}"

def fix_file(filepath):
    """Attempt to fix a single file"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            original_content = f.read()

        # Check if already valid
        is_valid, error = validate_syntax(original_content)
        if is_valid:
            return 'already_valid', None

        content = original_content
        fixes_applied = []

        # Try fix 1: Missing docstring opener
        content, fixed = fix_missing_docstring_opener(content, filepath)
        if fixed:
            fixes_applied.append('missing_docstring_opener')

        # Try fix 2: Indentation corruption
        content, fixed = fix_indentation_corruption(content, filepath)
        if fixed:
            fixes_applied.append('indentation_corruption')

        # Validate result
        if fixes_applied:
            is_valid, error = validate_syntax(content)
            if is_valid:
                # Write fixed content
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)
                return 'fixed', fixes_applied
            else:
                # Fixes didn't work, restore original
                return 'fix_failed', error

        return 'no_fix_attempted', error

    except Exception as e:
        return 'error', str(e)

def main():
    """Fix all test files with systematic patterns"""
    print("Master Python Test Fixer")
    print("=" * 80)

    test_dir = Path('tests')
    stats = {
        'already_valid': [],
        'fixed': [],
        'fix_failed': [],
        'no_fix_attempted': [],
        'error': []
    }

    # Find all Python test files
    test_files = []
    for root, dirs, files in os.walk(test_dir):
        # Skip __pycache__
        dirs[:] = [d for d in dirs if d != '__pycache__']

        for file in files:
            if file.endswith('.py'):
                filepath = os.path.join(root, file)
                test_files.append(filepath)

    print(f"Found {len(test_files)} Python files in tests/\n")
    print("Processing files...")
    print("-" * 80)

    for filepath in sorted(test_files):
        result, details = fix_file(filepath)
        stats[result].append((filepath, details))

        if result == 'fixed':
            print(f"FIXED: {filepath}")
            for fix in details:
                print(f"  Applied: {fix}")
        elif result == 'fix_failed':
            print(f"FAILED: {filepath} - {details}")

    # Print summary
    print("\n" + "=" * 80)
    print("SUMMARY")
    print("-" * 80)
    print(f"Already valid: {len(stats['already_valid'])} files")
    print(f"Successfully fixed: {len(stats['fixed'])} files")
    print(f"Fix failed: {len(stats['fix_failed'])} files")
    print(f"No fix attempted: {len(stats['no_fix_attempted'])} files")
    print(f"Errors: {len(stats['error'])} files")

    if stats['fix_failed']:
        print("\nFILES THAT FAILED TO FIX:")
        for filepath, error in stats['fix_failed'][:20]:
            print(f"  {filepath}: {error}")
        if len(stats['fix_failed']) > 20:
            print(f"  ... and {len(stats['fix_failed']) - 20} more")

    if stats['no_fix_attempted']:
        print(f"\nFILES NEEDING MANUAL FIX: {len(stats['no_fix_attempted'])}")
        print("(Patterns not recognized by automatic fixer)")

    print("\n" + "=" * 80)
    total_fixed = len(stats['fixed'])
    total_remaining = len(stats['fix_failed']) + len(stats['no_fix_attempted'])
    print(f"RESULT: {total_fixed} files fixed automatically")
    print(f"        {total_remaining} files need manual attention")
    print("=" * 80)

    return 0 if total_remaining == 0 else 1

if __name__ == '__main__':
    import sys
    sys.exit(main())
