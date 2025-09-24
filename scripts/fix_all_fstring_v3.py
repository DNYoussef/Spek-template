#!/usr/bin/env python3
"""Comprehensive f-string fix - handle all cases of {var) -> {var}"""
import re

def fix_fstrings_comprehensive(content):
    """Fix ALL f-string errors where ) is used instead of } inside interpolations"""
    # Pattern to find {variable) and replace with {variable}
    # This handles ANY case where { is followed by content and then )
    pattern = r'\{([^{}]+?)\)'

    lines = content.split('\n')
    fixed_lines = []

    for line in lines:
        # Only process lines that look like they have f-strings
        if 'f"' in line or "f'" in line:
            # Replace {content) with {content} when inside f-strings
            # This is a simpler, more comprehensive approach
            fixed_line = re.sub(pattern, r'{\1}', line)
            fixed_lines.append(fixed_line)
        else:
            fixed_lines.append(line)

    return '\n'.join(fixed_lines)

files = [
    ".claude/.artifacts/quality_analysis.py",
    "src/theater-detection/theater-detector.py",
    "src/linter-integration/agents/api_docs_node.py"
]

for filepath in files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    fixed = fix_fstrings_comprehensive(content)

    if content != fixed:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(fixed)
        print(f"Fixed: {filepath}")
    else:
        print(f"No changes: {filepath}")