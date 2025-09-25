#!/usr/bin/env python3
"""
Fix literal \n characters in Python files that are causing syntax errors.

This script addresses the issue where an automated fixer incorrectly replaced
actual newlines with literal string "\n" characters outside of string contexts.
"""

from pathlib import Path
import os
import re

import py_compile

# Files identified as having literal \n issues
PROBLEMATIC_FILES = [
    "analyzer/performance/ci_cd_accelerator.py",
    "scripts/performance_monitor.py",
    "analyzer/integrations/tool_coordinator.py",
    "src/intelligence/neural_networks/rl/strategy_optimizer.py",
    "src/intelligence/neural_networks/rl/trading_environment.py"
]

def is_inside_string(line, pos):
    """Check if position is inside a string literal."""
    # Simple heuristic: count quotes before position
    before = line[:pos]

    # Check for single quotes
    single_quotes = before.count("'") - before.count("\\'")
    # Check for double quotes
    double_quotes = before.count('"') - before.count('\\"')

    # If odd number of quotes, we're inside a string
    return (single_quotes % 2 == 1) or (double_quotes % 2 == 1)

def fix_literal_newlines(content):
    """Fix literal \\n characters that should be actual newlines."""
    lines = content.split('\n')
    fixed_lines = []

    i = 0
    while i < len(lines):
        line = lines[i]

        # Look for literal \n not inside strings
        if '\\n' in line:
            # Find all occurrences
            parts = []
            last_pos = 0

            for match in re.finditer(r'\\n', line):
                pos = match.start()

                # Check if this \n is inside a string
                if not is_inside_string(line, pos):
                    # This is a literal \n that should be a newline
                    parts.append(line[last_pos:pos])

                    # Determine indentation for next line
                    remaining = line[pos+2:]  # Skip \n

                    # Add current part
                    if parts:
                        fixed_lines.append(''.join(parts))
                        parts = []
                    else:
                        fixed_lines.append(line[last_pos:pos])

                    # Start new line with remaining text
                    line = remaining
                    last_pos = 0
                else:
                    # Keep this \n as is (it's inside a string)
                    last_pos = pos + 2

            # Add remaining part
            if last_pos < len(line):
                fixed_lines.append(line[last_pos:])
            elif not parts:
                # No replacements made
                fixed_lines.append(line)
        else:
            fixed_lines.append(line)

        i += 1

    return '\n'.join(fixed_lines)

def validate_python_file(filepath):
    """Validate Python file syntax."""
    try:
        py_compile.compile(filepath, doraise=True)
        return True, "OK"
    except py_compile.PyCompileError as e:
        return False, str(e)

def process_file(filepath):
    """Process a single file to fix literal newlines."""
    print(f"\nProcessing: {filepath}")

    if not os.path.exists(filepath):
        print(f"  [SKIP] File not found")
        return False

    # Read original content
    with open(filepath, 'r', encoding='utf-8') as f:
        original_content = f.read()

    # Check if file has literal \n issues
    if '\\n' not in original_content:
        print(f"  [SKIP] No literal \\n found")
        return True

    # Count occurrences outside strings (rough estimate)
    lines = original_content.split('\n')
    suspicious_lines = []
    for i, line in enumerate(lines, 1):
        if '\\n' in line:
            # Quick check: if \n appears outside quotes
            in_string = False
            for j, char in enumerate(line):
                if char in ['"', "'"]:
                    in_string = not in_string
                elif char == '\\' and j+1 < len(line) and line[j+1] == 'n' and not in_string:
                    suspicious_lines.append(i)
                    break

    if suspicious_lines:
        print(f"  [FOUND] Literal \\n on lines: {suspicious_lines[:5]}{'...' if len(suspicious_lines) > 5 else ''}")

    # Fix the content
    fixed_content = fix_literal_newlines(original_content)

    # Create backup
    backup_path = filepath + '.backup'
    with open(backup_path, 'w', encoding='utf-8') as f:
        f.write(original_content)
    print(f"  [BACKUP] Created: {backup_path}")

    # Write fixed content
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(fixed_content)

    # Validate
    is_valid, msg = validate_python_file(filepath)
    if is_valid:
        print(f"  [SUCCESS] File fixed and validated")
        # Remove backup
        os.remove(backup_path)
        return True
    else:
        print(f"  [ERROR] Validation failed: {msg}")
        # Restore from backup
        with open(backup_path, 'r', encoding='utf-8') as f:
            original = f.read()
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(original)
        print(f"  [RESTORED] Original content restored")
        return False

def main():
    """Main execution function."""
    print("=" * 70)
    print("LITERAL NEWLINE FIXER")
    print("=" * 70)
    print("\nFixing literal \\n characters that should be actual newlines...")

    # Get base directory
    base_dir = Path(__file__).parent.parent

    results = {
        'fixed': [],
        'skipped': [],
        'failed': []
    }

    for file_path in PROBLEMATIC_FILES:
        full_path = base_dir / file_path
        success = process_file(str(full_path))

        if success:
            results['fixed'].append(file_path)
        else:
            results['failed'].append(file_path)

    # Summary
    print("\n" + "=" * 70)
    print("SUMMARY")
    print("=" * 70)
    print(f"\nFixed: {len(results['fixed'])}")
    for f in results['fixed']:
        print(f"  [PASS] {f}")

    if results['failed']:
        print(f"\nFailed: {len(results['failed'])}")
        for f in results['failed']:
            print(f"  [FAIL] {f}")

    print(f"\nTotal processed: {len(PROBLEMATIC_FILES)}")

    return len(results['failed']) == 0

if __name__ == "__main__":
    import sys
    success = main()
    sys.exit(0 if success else 1)