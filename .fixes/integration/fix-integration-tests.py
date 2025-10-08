#!/usr/bin/env python3
"""
Integration Test Syntax Fixer - Sequential Specialist System
Fixes Python syntax errors in tests/integration/ using 4 specialists.
"""
import ast
import json
import re
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Tuple


class DocstringSurgeon:
    """Fix unterminated triple-quoted strings."""

    def fix_file(self, filepath: Path) -> Tuple[bool, str]:
        """Fix docstring issues in a single file."""
        assert filepath.exists(), f"File not found: {filepath}"
        assert filepath.suffix == '.py', f"Not a Python file: {filepath}"

        with open(filepath, 'r', encoding='utf-8') as f:
            lines = f.readlines()

        fixed_lines = []
        in_docstring = False
        docstring_quote = None

        for i, line in enumerate(lines):
            stripped = line.strip()

            # Detect docstring start
            if '"""' in line or "'''" in line:
                quote_type = '"""' if '"""' in line else "'''"
                count = line.count(quote_type)

                if count == 1:
                    if not in_docstring:
                        in_docstring = True
                        docstring_quote = quote_type
                    else:
                        in_docstring = False
                        docstring_quote = None
                elif count == 2:
                    # Single line docstring
                    pass

            fixed_lines.append(line)

        # Check for unterminated docstring at EOF
        if in_docstring and docstring_quote:
            fixed_lines.append(f"{docstring_quote}\n")

        content = ''.join(fixed_lines)

        try:
            ast.parse(content)
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            return True, "Fixed"
        except SyntaxError as e:
            if 'unterminated' in str(e).lower():
                return False, str(e)
            return False, str(e)


class BracketHarmonizer:
    """Fix mismatched brackets and parentheses."""

    def fix_file(self, filepath: Path) -> Tuple[bool, str]:
        """Fix bracket issues in a single file."""
        assert filepath.exists(), f"File not found: {filepath}"

        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        # Fix common bracket mismatches
        patterns = [
            (r'\{[ \t]*\)', '{}'),  # {) -> {}
            (r'\([ \t]*\}', '()'),  # (} -> ()
            (r'\[[ \t]*\)', '[]'),  # [) -> []
            (r'\([ \t]*\]', '()'),  # (] -> ()
        ]

        for pattern, replacement in patterns:
            content = re.sub(pattern, replacement, content)

        try:
            ast.parse(content)
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            return True, "Fixed"
        except SyntaxError as e:
            return False, str(e)


class IndentationReconstructor:
    """Fix indentation issues."""

    def fix_file(self, filepath: Path) -> Tuple[bool, str]:
        """Fix indentation in a single file."""
        assert filepath.exists(), f"File not found: {filepath}"

        with open(filepath, 'r', encoding='utf-8') as f:
            lines = f.readlines()

        fixed_lines = []
        expected_indent = 0

        for line in lines:
            stripped = line.lstrip()

            if not stripped or stripped.startswith('#'):
                fixed_lines.append(line)
                continue

            # Calculate indent based on context
            current_indent = len(line) - len(stripped)

            # Adjust for block statements
            if stripped.rstrip().endswith(':'):
                fixed_lines.append(' ' * expected_indent + stripped)
                expected_indent += 4
            elif stripped.startswith(('return', 'break', 'continue', 'pass')):
                fixed_lines.append(' ' * expected_indent + stripped)
            elif stripped.startswith(('else:', 'elif ', 'except', 'finally')):
                expected_indent = max(0, expected_indent - 4)
                fixed_lines.append(' ' * expected_indent + stripped)
                expected_indent += 4
            else:
                fixed_lines.append(' ' * expected_indent + stripped)

        content = ''.join(fixed_lines)

        try:
            ast.parse(content)
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            return True, "Fixed"
        except SyntaxError as e:
            return False, str(e)


class SyntaxValidator:
    """Validate and report final syntax status."""

    def validate_file(self, filepath: Path) -> Tuple[bool, str]:
        """Validate file syntax."""
        assert filepath.exists(), f"File not found: {filepath}"

        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        try:
            ast.parse(content)
            return True, "Valid"
        except SyntaxError as e:
            return False, f"{e.msg} (line {e.lineno})"


def run_specialist(
    specialist_name: str,
    specialist_class,
    input_files: List[Path],
    completion_file: Path
) -> Dict:
    """Run a specialist and track results."""
    assert len(input_files) > 0, "No input files provided"

    specialist = specialist_class()
    fixed_count = 0
    remaining_errors = []

    for filepath in input_files:
        if specialist_name == "Validator":
            success, message = specialist.validate_file(filepath)
        else:
            success, message = specialist.fix_file(filepath)

        if success:
            fixed_count += 1
        else:
            remaining_errors.append({
                "file": str(filepath),
                "error": message
            })

    result = {
        "stage": specialist_name,
        "files_processed": len(input_files),
        "files_fixed": fixed_count,
        "files_remaining": len(remaining_errors),
        "errors": remaining_errors[:5],
        "timestamp": datetime.utcnow().isoformat()
    }

    with open(completion_file, 'w') as f:
        json.dump(result, f, indent=2)

    return result


def main():
    """Execute sequential specialist pipeline."""
    integration_dir = Path('tests/integration')
    assert integration_dir.exists(), "Integration directory not found"

    py_files = sorted(integration_dir.glob('*.py'))
    assert len(py_files) > 0, "No Python files found"

    print(f"Processing {len(py_files)} files in {integration_dir}")

    # Stage 1: Docstring Surgeon
    print("\n[1/4] Docstring Surgeon...")
    result1 = run_specialist(
        "Docstring",
        DocstringSurgeon,
        py_files,
        Path('.fixes/integration/docstring-complete.json')
    )
    print(f"  Fixed: {result1['files_fixed']}/{result1['files_processed']}")

    # Stage 2: Bracket Harmonizer
    print("\n[2/4] Bracket Harmonizer...")
    result2 = run_specialist(
        "Bracket",
        BracketHarmonizer,
        py_files,
        Path('.fixes/integration/bracket-complete.json')
    )
    print(f"  Fixed: {result2['files_fixed']}/{result2['files_processed']}")

    # Stage 3: Indentation Reconstructor
    print("\n[3/4] Indentation Reconstructor...")
    result3 = run_specialist(
        "Indent",
        IndentationReconstructor,
        py_files,
        Path('.fixes/integration/indent-complete.json')
    )
    print(f"  Fixed: {result3['files_fixed']}/{result3['files_processed']}")

    # Stage 4: Syntax Validator
    print("\n[4/4] Syntax Validator...")
    result4 = run_specialist(
        "Validator",
        SyntaxValidator,
        py_files,
        Path('.fixes/integration/validate-complete.json')
    )
    print(f"  Valid: {result4['files_fixed']}/{result4['files_processed']}")

    # Final report
    print("\n" + "="*60)
    print("FINAL RESULTS")
    print("="*60)
    print(f"Total files: {len(py_files)}")
    print(f"Valid files: {result4['files_fixed']}")
    print(f"Files with errors: {result4['files_remaining']}")

    if result4['files_remaining'] > 0:
        print("\nRemaining errors:")
        for error in result4['errors']:
            print(f"  - {error['file']}: {error['error']}")

    return result4['files_remaining'] == 0


if __name__ == '__main__':
    success = main()
    exit(0 if success else 1)
