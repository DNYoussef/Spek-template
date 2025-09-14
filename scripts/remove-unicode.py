#!/usr/bin/env python3
"""
Unicode Cleanup Script for SPEK Production Deployment
Removes unicode characters while preserving critical documentation
"""

import re
import os
import sys
from pathlib import Path

def remove_unicode_from_file(file_path):
    """Remove unicode characters from a file while preserving ASCII"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Replace common unicode characters with ASCII equivalents
        replacements = {
            '[OK]': '[OK]',
            '[FAIL]': '[FAIL]',
            '[WARN]': '[WARN]',
            '[ROCKET]': '[ROCKET]',
            '[TARGET]': '[TARGET]',
            '[CHART]': '[CHART]',
            '[LIGHTNING]': '[LIGHTNING]',
            '[SHIELD]': '[SHIELD]',
            '[SEARCH]': '[SEARCH]',
            '[CLIPBOARD]': '[CLIPBOARD]',
            '[BRAIN]': '[BRAIN]',
            '[GEAR]': '[GEAR]',
            '[MEDAL]': '[MEDAL]',
            '[TROPHY]': '[TROPHY]',
            '[ALERT]': '[ALERT]',
            '[SPARKLE]': '[SPARKLE]',
            '[BULB]': '[BULB]',
            '[WRENCH]': '[WRENCH]',
            '[FOLDER]': '[FOLDER]',
            '[DOCUMENT]': '[DOCUMENT]',
            '[THEATER]': '[THEATER]',
            '[STAR]': '[STAR]',
            '[COMPUTER]': '[COMPUTER]',
            '[BOOKS]': '[BOOKS]',
            '[LOCK]': '[LOCK]',
            '[TREND]': '[TREND]',
            '[CYCLE]': '[CYCLE]',
            '[STAR]': '[STAR]',
            '[ART]': '[ART]',
            '[BUILD]': '[BUILD]',
            '[SCIENCE]': '[SCIENCE]',
            '[BOOK]': '[BOOK]',
            '[CIRCUS]': '[CIRCUS]',
            '[GAME]': '[GAME]',
            '[TAB]': '[TAB]',
            '[PACKAGE]': '[PACKAGE]',
            '[SECURE]': '[SECURE]',
            '[DISK]': '[DISK]',
            '[CHART]': '[CHART]'
        }

        # Apply replacements
        original_content = content
        for unicode_char, replacement in replacements.items():
            content = content.replace(unicode_char, replacement)

        # Remove any remaining non-ASCII characters from code files
        if file_path.suffix in ['.py', '.js', '.ts', '.json']:
            # Only remove non-ASCII from non-comment lines
            lines = content.split('\n')
            cleaned_lines = []
            for line in lines:
                if not line.strip().startswith('#') and not line.strip().startswith('//'):
                    # Remove non-ASCII from code
                    line = re.sub(r'[^\x00-\x7F]', '', line)
                cleaned_lines.append(line)
            content = '\n'.join(cleaned_lines)

        # Write back if changed
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
        return False

    except Exception as e:
        print(f"Error processing {file_path}: {e}")
        return False

def main():
    """Main unicode cleanup function"""
    root_dir = Path('.')
    files_processed = 0
    files_changed = 0

    # File patterns to process
    patterns = ['*.py', '*.js', '*.ts', '*.md', '*.json', '*.yaml', '*.yml']

    for pattern in patterns:
        for file_path in root_dir.rglob(pattern):
            # Skip node_modules and .git
            if any(part in file_path.parts for part in ['node_modules', '.git', '__pycache__']):
                continue

            files_processed += 1
            if remove_unicode_from_file(file_path):
                files_changed += 1
                print(f"Cleaned: {file_path}")

    print(f"\nUnicode cleanup complete:")
    print(f"Files processed: {files_processed}")
    print(f"Files modified: {files_changed}")

if __name__ == "__main__":
    main()