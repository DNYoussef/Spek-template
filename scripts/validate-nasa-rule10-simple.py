#!/usr/bin/env python3
"""
NASA Rule 10 Validation Script - Simple version
Validates that all functions are ≤60 lines in TypeScript files
"""

import re
import sys
from pathlib import Path

def count_function_lines(file_path):
    """Count lines in each function in a TypeScript file."""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Simple pattern to find functions
    lines = content.split('\n')
    functions = []

    for i, line in enumerate(lines):
        stripped = line.strip()

        # Look for function-like patterns
        if (('private ' in stripped or 'public ' in stripped or 'async ' in stripped) and
            ('(' in stripped and ')' in stripped and '{' in stripped) and
            not stripped.startswith('//') and not stripped.startswith('*')):

            # Extract function name
            parts = stripped.split('(')[0].split()
            function_name = parts[-1] if parts else 'unknown'
            start_line = i + 1

            # Find matching closing brace
            brace_count = line.count('{') - line.count('}')
            end_line = start_line

            for j in range(i + 1, len(lines)):
                line_content = lines[j]
                brace_count += line_content.count('{') - line_content.count('}')

                if brace_count <= 0:
                    end_line = j + 1
                    break

            function_length = end_line - start_line + 1
            functions.append({
                'name': function_name,
                'start': start_line,
                'end': end_line,
                'length': function_length,
                'compliant': function_length <= 60
            })

    return functions

def validate_file(file_path):
    """Validate a single file against NASA Rule 10."""
    print(f"\n=== Validating {file_path} ===")

    functions = count_function_lines(file_path)
    violations = []

    for func in functions:
        if not func['compliant']:
            violations.append(func)
            print(f"[VIOLATION] {func['name']} ({func['length']} lines) at lines {func['start']}-{func['end']}")
        else:
            print(f"[OK] {func['name']} ({func['length']} lines)")

    if not violations:
        print(f"SUCCESS: All {len(functions)} functions comply with NASA Rule 10!")
        return True
    else:
        print(f"WARNING: {len(violations)} violations found out of {len(functions)} functions")
        return False

def main():
    """Main validation function."""
    if len(sys.argv) > 1:
        file_path = Path(sys.argv[1])
    else:
        file_path = Path('src/princesses/research/PrincessQueenIntegration.ts')

    if not file_path.exists():
        print(f"Error: File {file_path} not found")
        return False

    return validate_file(file_path)

if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)