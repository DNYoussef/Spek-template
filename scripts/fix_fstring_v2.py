#!/usr/bin/env python3
"""Fix f-string syntax errors - replace } inside braces that became )"""
import re

def fix_fstring_parens(content):
    """Replace {var) with {var} in f-strings"""
    # This pattern finds {variable_name) and replaces with {variable_name}
    pattern = r'\{([^}]+?)\)(["\'])'
    replacement = r'{\1}\2'
    fixed = re.sub(pattern, replacement, content)
    return fixed

files = [
    ".claude/.artifacts/quality_analysis.py",
    "src/linter-integration/agents/api_docs_node.py"
]

for filepath in files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    fixed = fix_fstring_parens(content)

    if content != fixed:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(fixed)
        print(f"Fixed: {filepath}")
    else:
        print(f"No changes: {filepath}")