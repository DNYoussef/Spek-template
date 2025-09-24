#!/usr/bin/env python3
"""Fix dict syntax errors where ) is used instead of }"""
import re

def fix_dict_errors(content):
    """Replace ), with }, for dict literals"""
    # Pattern: finds dicts with ) instead of } before comma
    pattern = r'(\{[^}]+)\),'
    replacement = r'\1},'
    fixed = re.sub(pattern, replacement, content)
    return fixed

def main():
    filepath = "src/theater-detection/theater-detector.py"

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    fixed_content = fix_dict_errors(content)

    if content != fixed_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(fixed_content)
        print(f"Fixed dict errors in {filepath}")
    else:
        print(f"No dict errors found in {filepath}")

if __name__ == "__main__":
    main()