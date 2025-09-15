#!/usr/bin/env python3
"""
Fix Unicode and encoding issues in workflow files
"""

import os
import re
from pathlib import Path

def clean_unicode(content):
    """Remove Unicode characters and fix common issues"""

    # Unicode replacements
    replacements = {
        '\U0001f916': '',  # Robot emoji
        '\U0001f680': '',  # Rocket
        '\U0001f4da': '',  # Books
        '\U0001f6a8': '',  # Police light
        '\U0001f4cb': '',  # Clipboard
        '\U0001f4d1': '',  # Bookmark
        '\U0001f528': '',  # Hammer
        '\U0001f50d': '',  # Magnifying glass
        '\U0001f3af': '',  # Target
        '\U0001f6e1': '',  # Shield
        '\U0001f4ca': '',  # Chart
        '\U0001f525': '',  # Fire
        '\u2728': '',  # Sparkles
        '\u26a1': '',  # Lightning
        '\u2705': '',  # Check
        '\u274c': '',  # X
        '\u2139': '',  # Info
        '\u26a0': '',  # Warning
        '\u203c': '',  # Double exclamation
        '\u2049': '',  # Exclamation question
        '': '-',  # En dash
        '': '-',  # Em dash
        ''': "'",  # Smart quotes
        ''': "'",
        '"': '"',
        '"': '"',
        '': '...',
        '\xa0': ' ',  # Non-breaking space
        '\u200b': '',  # Zero-width space
    }

    for old, new in replacements.items():
        content = content.replace(old, new)

    # Remove any remaining non-ASCII characters in step names
    lines = content.split('\n')
    fixed_lines = []

    for line in lines:
        # Fix step names with brackets
        if '- name:' in line:
            # Remove brackets notation like [SHIELD], [TARGET], etc.
            line = re.sub(r'\[[\w\s]+\]\s*', '', line)
            # Remove any remaining non-ASCII
            line = ''.join(char if ord(char) < 128 else '' for char in line)
            # Clean up extra spaces
            line = re.sub(r'\s+', ' ', line)

        # Fix Unicode in echo statements
        if 'echo' in line:
            # Remove Unicode characters from echo statements
            line = ''.join(char if ord(char) < 128 else '' for char in line)

        fixed_lines.append(line)

    return '\n'.join(fixed_lines)

def fix_yaml_syntax(content):
    """Fix common YAML syntax issues"""

    lines = content.split('\n')
    fixed_lines = []
    in_run_block = False

    for i, line in enumerate(lines):
        # Fix malformed pip install (specific issue we found)
        if 'pip install --upgrade pip ||' in line and line.count('||') > 2:
            line = '          pip install --upgrade pip'

        # Fix Python code in run blocks
        if 'run: |' in line:
            in_run_block = True
        elif in_run_block and line and not line.startswith(' '):
            in_run_block = False

        # Fix step names with special characters
        if '- name: ?' in line:
            line = line.replace('- name: ?', '- name:')

        # Fix markdown in YAML
        if '**' in line and 'echo' not in line and '#' not in line:
            line = line.replace('**', '')

        fixed_lines.append(line)

    return '\n'.join(fixed_lines)

def process_workflow(filepath):
    """Process a single workflow file"""
    try:
        # Read with error handling
        content = None
        for encoding in ['utf-8', 'latin-1', 'cp1252']:
            try:
                with open(filepath, 'r', encoding=encoding) as f:
                    content = f.read()
                    break
            except:
                continue

        if not content:
            print(f"  ERROR: Could not read {filepath}")
            return False

        original_content = content

        # Clean Unicode
        content = clean_unicode(content)

        # Fix YAML syntax
        content = fix_yaml_syntax(content)

        # Only write if changed
        if content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"  FIXED: {filepath.name}")
            return True
        else:
            print(f"  OK: {filepath.name}")
            return False

    except Exception as e:
        print(f"  ERROR processing {filepath}: {e}")
        return False

def main():
    """Fix all workflow files"""
    workflow_dir = Path('.github/workflows')

    workflows = list(workflow_dir.glob('*.yml'))
    workflows.extend(workflow_dir.glob('*.yaml'))
    workflows.extend(workflow_dir.glob('**/*.yml'))
    workflows.extend(workflow_dir.glob('**/*.yaml'))

    print(f"Processing {len(workflows)} workflow files...")
    print("=" * 60)

    fixed_count = 0
    error_count = 0

    for wf in workflows:
        result = process_workflow(wf)
        if result:
            fixed_count += 1
        elif result is False and 'ERROR' in str(result):
            error_count += 1

    print("=" * 60)
    print(f"Fixed: {fixed_count} files")
    print(f"Unchanged: {len(workflows) - fixed_count - error_count} files")
    print(f"Errors: {error_count} files")

if __name__ == "__main__":
    main()