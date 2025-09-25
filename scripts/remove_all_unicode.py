#!/usr/bin/env python3
"""
Remove ALL Unicode characters from project files
Replaces with ASCII equivalents where possible
"""

import os
import re
from pathlib import Path
import shutil
from datetime import datetime

class UnicodeRemover:
    def __init__(self):
        self.files_processed = 0
        self.files_modified = 0
        self.unicode_removed = 0
        self.backup_dir = f"unicode_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

        # Common Unicode replacements
        self.replacements = {
            '\u2019': "'",  # Right single quote
            '\u2018': "'",  # Left single quote
            '\u201C': '"',  # Left double quote
            '\u201D': '"',  # Right double quote
            '\u2013': '-',  # En dash
            '\u2014': '--', # Em dash
            '\u2026': '...', # Ellipsis
            '\u2022': '*',  # Bullet
            '\u2192': '->',  # Right arrow
            '\u2190': '<-',  # Left arrow
            '\u2194': '<->',  # Left-right arrow
            '\u2713': '[OK]',  # Checkmark
            '\u2717': '[X]',  # Cross mark
            '\u2714': '[OK]',  # Heavy checkmark
            '\u274C': '[FAIL]',  # Red X
            '\u26A0': '[WARNING]',  # Warning sign
            '\u231A': '[TIME]',  # Watch
            '\u1F512': '[LOCK]',  # Lock
            '\u1F4DA': '[BOOK]',  # Books
            '\u1F6A8': '[ALERT]',  # Alert
            '\u1F4CB': '[CLIPBOARD]',  # Clipboard
            '\u1F50D': '[SEARCH]',  # Magnifier
            '\u1F4C8': '[CHART]',  # Chart
            '\u1F4D1': '[BOOKMARK]',  # Bookmark
            '\u1F680': '[ROCKET]',  # Rocket
            '\u1F3AF': '[TARGET]',  # Target
            '\u26A1': '[LIGHTNING]',  # Lightning
            '\u1F4C1': '[FOLDER]',  # Folder
            '\u1F6E0': '[TOOL]',  # Tool
            '\u1F528': '[HAMMER]',  # Hammer
            '\u1F9E0': '[BRAIN]',  # Brain
            '\u267E': '[CYCLE]',  # Recycle
            '\u1F527': '[WRENCH]',  # Wrench
            '\u1F4D6': '[BOOK]',  # Open book
            '\u1F3C1': '[FLAG]',  # Checkered flag
            '\u1F6E1': '[SHIELD]',  # Shield
            '\u1F4CA': '[CHART]',  # Bar chart
            '\u1F52C': '[SCIENCE]',  # Microscope
            '\u1F4DD': '[MEMO]',  # Memo
            '\u1F4C4': '[PAGE]',  # Page facing up
            '\u1F4BB': '[COMPUTER]',  # Computer
            '\u2705': '[OK]',  # White heavy check
            '\u274E': '[FAIL]',  # Cross mark button
            '\u00A0': ' ',  # Non-breaking space
            '\u00B7': '*',  # Middle dot
            '\u00D7': 'x',  # Multiplication sign
            '\u221A': 'sqrt',  # Square root
            '\u221E': 'inf',  # Infinity
            '\u03B1': 'alpha',  # Greek alpha
            '\u03B2': 'beta',  # Greek beta
            '\u03C0': 'pi',  # Greek pi
            '\u0394': 'delta',  # Greek delta
            '\u03A3': 'sigma',  # Greek sigma
            '\u00B0': 'deg',  # Degree sign
            '\u00B1': '+/-',  # Plus-minus
            '\u2248': '~=',  # Almost equal
            '\u2260': '!=',  # Not equal
            '\u2264': '<=',  # Less than or equal
            '\u2265': '>=',  # Greater than or equal
            '\u00BD': '1/2',  # One half
            '\u00BC': '1/4',  # One quarter
            '\u00BE': '3/4',  # Three quarters
            '\u00A9': '(c)',  # Copyright
            '\u00AE': '(R)',  # Registered
            '\u2122': '(TM)',  # Trademark
        }

    def backup_file(self, filepath: Path):
        """Create backup before modification"""
        backup_path = Path(self.backup_dir) / filepath
        backup_path.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(filepath, backup_path)

    def remove_unicode(self, content: str) -> str:
        """Remove or replace Unicode characters"""
        # First, apply known replacements
        for unicode_char, ascii_replacement in self.replacements.items():
            if unicode_char in content:
                content = content.replace(unicode_char, ascii_replacement)
                self.unicode_removed += content.count(unicode_char)

        # Then remove any remaining Unicode (replace with ?)
        def replace_unicode(match):
            self.unicode_removed += 1
            return '?'

        # Remove any remaining Unicode characters
        content = re.sub(r'[^\x00-\x7F]+', replace_unicode, content)

        return content

    def process_file(self, filepath: Path) -> bool:
        """Process a single file to remove Unicode"""
        try:
            # Read file
            with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                original_content = f.read()

            # Check if file has Unicode
            if not re.search(r'[^\x00-\x7F]+', original_content):
                return False

            # Backup file
            self.backup_file(filepath)

            # Remove Unicode
            new_content = self.remove_unicode(original_content)

            # Write back
            with open(filepath, 'w', encoding='ascii', errors='ignore') as f:
                f.write(new_content)

            self.files_modified += 1
            return True

        except Exception as e:
            print(f"Error processing {filepath}: {e}")
            return False

    def run(self):
        """Process all files in the project"""
        print("=" * 60)
        print("UNICODE REMOVAL SCRIPT")
        print("=" * 60)

        # Create backup directory
        os.makedirs(self.backup_dir, exist_ok=True)
        print(f"Backup directory: {self.backup_dir}")

        # Process files
        for root, dirs, files in os.walk('.'):
            # Skip certain directories
            if any(skip in root for skip in ['.git', '__pycache__', 'node_modules', '.venv', 'venv', self.backup_dir]):
                continue

            for file in files:
                # Process text files
                if file.endswith(('.py', '.md', '.txt', '.json', '.yaml', '.yml', '.js', '.ts', '.jsx', '.tsx', '.css', '.html')):
                    filepath = Path(root) / file
                    self.files_processed += 1

                    if self.process_file(filepath):
                        print(f"  Modified: {filepath}")

        # Print summary
        print("\n" + "=" * 60)
        print("SUMMARY")
        print("=" * 60)
        print(f"Files processed: {self.files_processed}")
        print(f"Files modified: {self.files_modified}")
        print(f"Unicode characters removed/replaced: {self.unicode_removed}")
        print(f"Backup directory: {self.backup_dir}")
        print("\nTo restore: copy files back from backup directory")

if __name__ == "__main__":
    remover = UnicodeRemover()
    remover.run()