#!/usr/bin/env python
"""
ML Test Syntax Fixer - Fixes bracket mismatches in tests/ml/
"""
import re
from pathlib import Path

files = [
    'tests/ml/test_compliance_forecaster.py',
    'tests/ml/test_integration.py',
    'tests/ml/test_quality_predictor.py',
    'tests/ml/test_theater_classifier.py'
]

def fix_brackets(content):
    """Fix mismatched brackets in function calls"""
    # Pattern 1: function_name() \n args \n ( ) -> function_name(args)
    content = re.sub(
        r'(\w+)\(\)\s*\n\s+([^\n]+)\s*\n\s*\(\s*\)',
        r'\1(\2)',
        content,
        flags=re.MULTILINE
    )

    # Pattern 2: ({) -> ({
    content = re.sub(r'\(\{([^}]*)\)', r'({\1})', content)

    # Pattern 3: (() -> ()
    content = re.sub(r'\(\(([^)]*)\)\)', r'((\1))', content)

    # Pattern 4: (} -> ()}
    content = re.sub(r'\(\s*\}\)', r'()}', content)

    return content

def fix_specific_patterns(filepath, content):
    """Fix file-specific patterns"""
    lines = content.split('\n')
    fixed_lines = []

    for i, line in enumerate(lines):
        # Fix {) patterns to {
        if '{)' in line:
            line = line.replace('{)', '{')

        # Fix (} patterns
        if '(}' in line or '(  }' in line:
            line = re.sub(r'\(\s*\}', '}', line)

        # Fix split function calls: name() \n args \n (  )
        if line.strip() == '(' and i > 0:
            prev = lines[i-1].strip()
            # Check if previous line ends with function call
            if prev.endswith('()'):
                # Find the closing (  )
                j = i + 1
                while j < len(lines) and lines[j].strip().startswith('#'):
                    j += 1
                if j < len(lines) - 1:
                    next_content = []
                    while j < len(lines) and lines[j].strip() not in ['(', '(  )', '(        )']:
                        if lines[j].strip() and not lines[j].strip().startswith('#'):
                            next_content.append(lines[j].strip())
                        j += 1
                    if next_content:
                        # Reconstruct as name(args)
                        fixed_lines[-1] = fixed_lines[-1][:-2] + '('  # Remove ()
                        fixed_lines.extend(next_content)
                        line = ')'
                        # Skip ahead
                        for _ in range(len(next_content)):
                            i += 1

        fixed_lines.append(line)

    return '\n'.join(fixed_lines)

root = Path('C:/Users/17175/Desktop/spek template')

for filepath in files:
    full_path = root / filepath
    print(f'Processing: {filepath}')

    with open(full_path, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content
    content = fix_brackets(content)
    content = fix_specific_patterns(filepath, content)

    if content != original:
        with open(full_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'  FIXED: {filepath}')
    else:
        print(f'  UNCHANGED: {filepath}')

print('\nDone!')
