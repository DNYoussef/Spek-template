#!/usr/bin/env python3
"""
NASA Rule 10 Validation Script
Validates that all functions are ≤60 lines in TypeScript files
"""

import re
import sys
from pathlib import Path

def count_function_lines(file_path):
    """Count lines in each function in a TypeScript file."""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Pattern to match function declarations
    function_pattern = r'(private|public|protected|async)?\s*(static)?\s*(async)?\s*(private|public|protected)?\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\([^)]*\)(?:\s*:\s*[^{]*)?(?:\s*=>)??\s*{'

    functions = []
    lines = content.split('\n')

    for i, line in enumerate(lines):
        match = re.search(function_pattern, line.strip())
        if match:
            function_name = match.group(5) if match.group(5) else 'anonymous'
            start_line = i + 1

            # Find matching closing brace
            brace_count = 0
            end_line = start_line

            for j in range(i, len(lines)):
                line_content = lines[j]
                brace_count += line_content.count('{')
                brace_count -= line_content.count('}')

                if j > i and brace_count == 0:
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
            print(f"❌ VIOLATION: {func['name']} ({func['length']} lines) at lines {func['start']}-{func['end']}")
        else:
            print(f"✅ OK: {func['name']} ({func['length']} lines)")

    if not violations:
        print(f"🎉 All {len(functions)} functions comply with NASA Rule 10!")
        return True
    else:
        print(f"⚠️  {len(violations)} violations found out of {len(functions)} functions")
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