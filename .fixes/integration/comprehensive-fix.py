#!/usr/bin/env python3
"""Comprehensive Python syntax fixer for integration tests."""
import ast
import json
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Tuple


def fix_docstring_issues(content: str) -> str:
    """Fix unterminated docstrings and misplaced quotes."""
    lines = content.split('\n')
    fixed = []
    i = 0

    while i < len(lines):
        line = lines[i]

        # Fix missing opening triple quotes before docstring
        if i < 2 and line.strip() and not line.strip().startswith(('"""', "'''", '#', 'import', 'from')):
            if i + 1 < len(lines) and '"""' in lines[i + 1]:
                fixed.append('"""')
                fixed.append(line)
                i += 1
                continue

        fixed.append(line)
        i += 1

    return '\n'.join(fixed)


def fix_bracket_mismatches(content: str) -> str:
    """Fix bracket and parenthesis mismatches."""
    # Fix common patterns
    content = re.sub(r'\{\s*\)', '{}', content)
    content = re.sub(r'\(\s*\}', '()', content)
    content = re.sub(r'\[\s*\)', '[]', content)
    content = re.sub(r'\(\s*\]', '()', content)

    # Fix split brackets on separate lines
    lines = content.split('\n')
    fixed = []
    i = 0

    while i < len(lines):
        line = lines[i]

        # Check for orphan closing bracket
        stripped = line.strip()
        if stripped in (')', ']', '}') and i > 0:
            # Try to merge with previous line
            prev_line = fixed[-1] if fixed else ''
            if prev_line.rstrip().endswith((',', '(')):
                fixed[-1] = prev_line.rstrip()
                i += 1
                continue

        fixed.append(line)
        i += 1

    return '\n'.join(fixed)


def fix_indentation_errors(content: str) -> str:
    """Fix indentation issues."""
    lines = content.split('\n')
    fixed = []
    indent_stack = [0]

    for line in lines:
        if not line.strip() or line.strip().startswith('#'):
            fixed.append(line)
            continue

        stripped = line.lstrip()
        current_indent = len(line) - len(stripped)

        # Handle block starters
        if stripped.rstrip().endswith(':'):
            expected = indent_stack[-1]
            fixed.append(' ' * expected + stripped)
            indent_stack.append(expected + 4)
        # Handle dedent keywords
        elif stripped.startswith(('else:', 'elif ', 'except', 'except:', 'finally:')):
            if len(indent_stack) > 1:
                indent_stack.pop()
            expected = indent_stack[-1]
            fixed.append(' ' * expected + stripped)
            indent_stack.append(expected + 4)
        # Handle return/break/continue/pass
        elif stripped.startswith(('return', 'break', 'continue', 'pass')):
            expected = indent_stack[-1]
            fixed.append(' ' * expected + stripped)
        # Regular line
        else:
            # Detect if we need to dedent
            if current_indent < indent_stack[-1]:
                while len(indent_stack) > 1 and current_indent < indent_stack[-1]:
                    indent_stack.pop()
            expected = indent_stack[-1]
            fixed.append(' ' * expected + stripped)

    return '\n'.join(fixed)


def fix_empty_except_blocks(content: str) -> str:
    """Fix except blocks without body."""
    lines = content.split('\n')
    fixed = []
    i = 0

    while i < len(lines):
        line = lines[i]
        fixed.append(line)

        # Check for except block
        if line.strip().startswith(('except', 'except:')):
            # Look ahead for next line
            if i + 1 < len(lines):
                next_line = lines[i + 1]
                next_stripped = next_line.strip()

                # If next line is not indented or is a keyword, add pass
                if not next_stripped or next_stripped.startswith(('def ', 'class ', 'if ')):
                    indent = len(line) - len(line.lstrip()) + 4
                    fixed.append(' ' * indent + 'pass')

        i += 1

    return '\n'.join(fixed)


def fix_empty_if_blocks(content: str) -> str:
    """Fix if blocks without body."""
    lines = content.split('\n')
    fixed = []
    i = 0

    while i < len(lines):
        line = lines[i]
        fixed.append(line)

        # Check for if block
        if line.strip().startswith('if ') and line.rstrip().endswith(':'):
            # Look ahead for next line
            if i + 1 < len(lines):
                next_line = lines[i + 1]
                next_stripped = next_line.strip()

                # Check if next line is properly indented
                current_indent = len(line) - len(line.lstrip())
                next_indent = len(next_line) - len(next_line.lstrip()) if next_stripped else 0

                # If not indented more than if, add pass
                if next_indent <= current_indent:
                    fixed.append(' ' * (current_indent + 4) + 'pass')

        i += 1

    return '\n'.join(fixed)


def fix_file(filepath: Path) -> Tuple[bool, str]:
    """Apply all fixes to a file."""
    assert filepath.exists(), f"File not found: {filepath}"
    assert filepath.suffix == '.py', f"Not a Python file: {filepath}"

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content

    # Apply fixes in sequence
    content = fix_docstring_issues(content)
    content = fix_bracket_mismatches(content)
    content = fix_empty_except_blocks(content)
    content = fix_empty_if_blocks(content)
    content = fix_indentation_errors(content)

    # Validate syntax
    try:
        ast.parse(content)
        # Only write if changed
        if content != original:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
        return True, "Valid"
    except SyntaxError as e:
        return False, f"{e.msg} (line {e.lineno})"


def main():
    """Fix all integration test files."""
    integration_dir = Path('tests/integration')
    assert integration_dir.exists(), "Integration directory not found"

    py_files = sorted(integration_dir.glob('*.py'))
    assert len(py_files) > 0, "No Python files found"

    results = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "total_files": len(py_files),
        "valid_files": 0,
        "error_files": 0,
        "errors": []
    }

    print(f"Processing {len(py_files)} files...")

    for filepath in py_files:
        success, message = fix_file(filepath)
        if success:
            results["valid_files"] += 1
            print(f"  OK: {filepath.name}")
        else:
            results["error_files"] += 1
            results["errors"].append({
                "file": str(filepath),
                "error": message
            })
            print(f"  FAIL: {filepath.name}: {message}")

    # Write results
    with open('.fixes/integration/validate-complete.json', 'w') as f:
        json.dump(results, f, indent=2)

    print(f"\nResults: {results['valid_files']}/{results['total_files']} valid")

    return results["error_files"] == 0


if __name__ == '__main__':
    success = main()
    exit(0 if success else 1)
