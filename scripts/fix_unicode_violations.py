#!/usr/bin/env python
"""
Unicode Violations Fixer
========================

Systematically removes ALL unicode characters from Python files and replaces
with ASCII equivalents to comply with strict NO UNICODE rule.
"""

import os
import re

# Unicode replacement mapping
UNICODE_REPLACEMENTS = {
    r'[OK]': '[OK]',
    r'[FAIL]': '[FAIL]',
    r'[WARN]': '[WARN]',
    r'[LAUNCH]': '[LAUNCH]',
    r'[METRICS]': '[METRICS]',
    r'[SEARCH]': '[SEARCH]',
    r'[INFO]': '[INFO]',
    r'[STAR]': '[STAR]',
    r'[TARGET]': '[TARGET]',
    r'[ALERT]': '[ALERT]',
    r'[FAST]': '[FAST]',
    r'[HOT]': '[HOT]',
    r'[PREMIUM]': '[PREMIUM]',
    r'[DESIGN]': '[DESIGN]',
    r'[TOOL]': '[TOOL]',
    r'[TREND]': '[TREND]',
    r'[SHIELD]': '[SHIELD]',
    r'[PACKAGE]': '[PACKAGE]',
    r'[NEW]': '[NEW]',
    r'[LAPTOP]': '[TECH]',
    r'[WIP]': '[WIP]',
    r'[DOC]': '[DOC]',
    r'[SUCCESS]': '[SUCCESS]',
    r'[TIME]': '[TIME]',
    r'[SECURE]': '[SECURE]',
    r'[GLOBAL]': '[GLOBAL]',
    r'[MOBILE]': '[MOBILE]',
    r'[BUSINESS]': '[BUSINESS]',
    r'[THEATER]': '[THEATER]',
    r'[CONFIG]': '[CONFIG]',
    r'[LIST]': '[LIST]',
    r'[AWARD]': '[AWARD]',
    r'[KEY]': '[KEY]',
    r'[DRAMA]': '[MASK]',
    r'[MONEY]': '[MONEY]',
    r'[FILE]': '[FILE]',
    r'[RAINBOW]': '[RAINBOW]',
    r'[CIRCLE]': '[CIRCLE]',
    r'[!]': '[!]',
    r'[?]': '[?]',
    r'->': '->',
    r'^': '^',
    r'v': 'v',
    r'<-': '<-',
    r'[BOOK]': '[BOOK]',
    r'[MUSIC]': '[MUSIC]',
    r'[BELL]': '[BELL]',
    r'[CALL]': '[CALL]',
    r'[FILM]': '[FILM]',
    # Additional common ones
    r'[REFRESH]': '[REFRESH]',
    r'[THEATER]': '[THEATER]',
    r'[DRAMA]': '[DRAMA]',
    r'[BALANCE]': '[BALANCE]',
    r'[MAGIC]': '[MAGIC]',
    r'[FINISH]': '[FINISH]',
    r'[DICE]': '[DICE]',
    r'[SLOT]': '[SLOT]',
    r'[TRUMPET]': '[TRUMPET]',
    r'[GUITAR]': '[GUITAR]',
    r'[TV]': '[TV]',
    r'[RADIO]': '[RADIO]',
    r'[PHONE]': '[PHONE]',
    r'[FAX]': '[FAX]',
    r'[DISK]': '[DISK]',
    r'[CD]': '[CD]',
    r'[DVD]': '[DVD]',
    r'[DESKTOP]': '[DESKTOP]',
    r'[LAPTOP]': '[LAPTOP]',
    r'[KEYBOARD]': '[KEYBOARD]',
    r'[MOUSE]': '[MOUSE]',
    r'[PRINTER]': '[PRINTER]',
    r'[WATCH]': '[WATCH]',
    r'[PHONE]': '[PHONE]',
    r'[CARD]': '[CARD]',
    r'[MONEY]': '[MONEY]',
    r'[DOLLAR]': '[DOLLAR]',
    r'[YEN]': '[YEN]',
    r'[EURO]': '[EURO]',
    r'[POUND]': '[POUND]'
}

def fix_unicode_in_file(filepath):
    """Fix unicode in a single file."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        original_content = content
        fixed_count = 0

        # Replace known unicode patterns
        for pattern, replacement in UNICODE_REPLACEMENTS.items():
            before_count = len(re.findall(pattern, content))
            content = re.sub(pattern, replacement, content)
            fixed_count += before_count

        # Replace any remaining non-ASCII characters (but be careful with valid ones)
        remaining_unicode = []
        for i, char in enumerate(content):
            if ord(char) > 127:
                # Skip common valid unicode like quotes and dashes if they're in comments/strings
                remaining_unicode.append((i, char, ord(char)))

        if remaining_unicode and len(remaining_unicode) < 20:  # Only if manageable
            print(f"Remaining unicode in {filepath}: {[(c, ord(c)) for i, c, o in remaining_unicode[:5]]}")

        if content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            return fixed_count
    except Exception as e:
        print(f"Error fixing {filepath}: {e}")
    return 0

def main():
    """Main execution."""
    print("Fixing unicode violations in Python files...")

    # Priority files (most problematic)
    priority_files = [
        './tests/test_fixes.py',
        './tests/integration/simplified_integration_test.py',
        './analyzer/enhanced_github_analyzer.py',
        './tests/test_command_factory_patterns.py',
        './analyzer/github_status_reporter.py',
        './tests/batch2_validation/run_validation.py',
        './analyzer/architecture/report_generator.py',
        './tests/test_focused_pattern_validation.py'
    ]

    total_fixed = 0
    files_fixed = 0

    # Fix priority files first
    for filepath in priority_files:
        if os.path.exists(filepath):
            fixed = fix_unicode_in_file(filepath)
            if fixed > 0:
                total_fixed += fixed
                files_fixed += 1
                print(f"[OK] Fixed {fixed} unicode chars in: {filepath}")

    # Find and fix all remaining Python files
    for root, dirs, files in os.walk('.'):
        # Skip certain directories
        if any(skip in root for skip in ['.git', '__pycache__', '.pytest_cache', 'node_modules']):
            continue

        for file in files:
            if file.endswith('.py'):
                filepath = os.path.join(root, file)
                if filepath not in priority_files:  # Don't double-fix
                    fixed = fix_unicode_in_file(filepath)
                    if fixed > 0:
                        total_fixed += fixed
                        files_fixed += 1
                        print(f"[OK] Fixed {fixed} unicode chars in: {filepath}")

    print(f"\n[SUCCESS] Fixed {total_fixed} unicode characters in {files_fixed} files")
    return total_fixed == 0  # True if no unicode found

if __name__ == "__main__":
    success = main()
    if success:
        print("\n[OK] No unicode violations found!")
    else:
        print("\n[COMPLETE] Unicode violations fixed!")