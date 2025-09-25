#!/usr/bin/env python3
"""Fix f-string syntax errors where ) is used instead of }"""
import re
import sys

def fix_fstring_errors(content):
    """Replace ) with } before closing quote in f-strings"""
    # Pattern: finds f-strings with ) before closing quote
    pattern = r'(f"[^"]*\{[^}]+)\)"'
    replacement = r'\1}"'
    fixed = re.sub(pattern, replacement, content)
    return fixed

def main():
    files = [
        ".claude/.artifacts/quality_analysis.py",
        "src/theater-detection/theater-detector.py",
        "src/linter-integration/agents/api_docs_node.py"
    ]

    for filepath in files:
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()

            fixed_content = fix_fstring_errors(content)

            if content != fixed_content:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(fixed_content)
                print(f"Fixed f-string errors in {filepath}")
            else:
                print(f"No f-string errors found in {filepath}")
        except Exception as e:
            print(f"Error processing {filepath}: {e}")

if __name__ == "__main__":
    main()