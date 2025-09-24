#!/usr/bin/env python3
"""
Unicode Removal Linter
======================

Comprehensive script to remove all unicode characters from Python, Markdown, and JSON files.
Ensures Windows CLI compatibility by converting all unicode to ASCII equivalents.
"""

import os
import re
import sys
from pathlib import Path
from typing import Dict, List, Tuple
import json
import argparse


class UnicodeRemovalLinter:
    """Comprehensive unicode character removal and replacement system."""
    
    def __init__(self):
        """Initialize unicode removal patterns and replacements."""
        # Common unicode to ASCII replacements
        self.unicode_replacements = {
        # Arrows and symbols
        '->': '->',
            '<-': '<-', 
            '^': '^',
            'v': 'v',
            '=>': '=>',
            '<=': '<=',
            '<=>': '<=>',
            
            # Checkmarks and X marks
            '[OK]': '[OK]',
            '[FAIL]': '[FAIL]',
            '[CHECK]': '[CHECK]',
            '[X]': '[X]',
            '[CHECKED]': '[CHECKED]',
            '[ ]': '[ ]',
            
            # Stars and shapes
            '[STAR]': '[STAR]',
            '[STAR]': '[STAR]',
            '*': '*',
            '*': '*',
            '*': '*',
            'o': 'o',
            'o': 'o',
            '-': '-',
            '[SQUARE]': '[SQUARE]',
            '[BOX]': '[BOX]',
            '*': '*',
            'o': 'o',
            
            # Emojis - replace with text descriptions
            '[ROCKET]': '[ROCKET]',
            '[TARGET]': '[TARGET]',
            '[SEARCH]': '[SEARCH]',
            '[SHIELD]': '[SHIELD]',
            '[LIGHTNING]': '[LIGHTNING]',
            '[TOOL]': '[TOOL]',
            '[CHART]': '[CHART]',
            '[TREND]': '[TREND]',
            '[CELEBRATION]': '[CELEBRATION]',
            '[TROPHY]': '[TROPHY]',
            '[FIRE]': '[FIRE]',
            '[BULB]': '[BULB]',
            '[WARNING]': '[WARNING]',
            '[ALERT]': '[ALERT]',
            '[NOTE]': '[NOTE]',
            '[CLIPBOARD]': '[CLIPBOARD]',
            '[FOLDER]': '[FOLDER]',
            '[LOCK]': '[LOCK]',
            '[GLOBE]': '[GLOBE]',
            '[GEAR]': '[GEAR]',
            '[BRAIN]': '[BRAIN]',
            '[DISK]': '[DISK]',
            '[PACKAGE]': '[PACKAGE]',
            '[LINK]': '[LINK]',
            '[SATELLITE]': '[SATELLITE]',
            '*': '*',
            '*': '*',
            '*': '*',
            
            # Mathematical and scientific symbols
            'infinity': 'infinity',
            '>=': '>=',
            '<=': '<=',
            '!=': '!=',
            '~=': '~=',
            '+/-': '+/-',
            'x': 'x',
            '/': '/',
            'SUM': 'SUM',
            'PROD': 'PROD',
            'INTEGRAL': 'INTEGRAL',
            'SQRT': 'SQRT',
            'DELTA': 'DELTA',
            'PI': 'PI',
            
            # Currency and misc symbols
            'EUR': 'EUR',
            'GBP': 'GBP',
            'YEN': 'YEN',
            '(C)': '(C)',
            '(R)': '(R)',
            '(TM)': '(TM)',
            'deg': 'deg',
            'micro': 'micro',
            
            # Punctuation and typography
            '"': '"',
            '"': '"',
            '''''''''...': '...','''
            '-': '-',
            '--': '--',
            '*': '*',
            ',': ',',
            '"': '"',
            '<': '<',
            '>': '>',
            '<<': '<<',
            '>>': '>>',
            
            # Box drawing characters
            '+': '+',
            '+': '+',
            '+': '+',
            '+': '+',
            '+': '+',
            '+': '+',
            '+': '+',
            '+': '+',
            '+': '+',
            '|': '|',
            '-': '-',
            '||': '||',
            '==': '==',
            '++': '++',
            '++': '++',
            '++': '++',
            '++': '++',
            '++': '++',
            '++': '++',
            '++': '++',
            '++': '++',
            '++': '++',
            
            # Additional common unicode characters
            'alpha': 'alpha',
            'beta': 'beta',
            'gamma': 'gamma',
            'delta': 'delta',
            'epsilon': 'epsilon',
            'lambda': 'lambda',
            'mu': 'mu',
            'nu': 'nu',
            'rho': 'rho',
            'sigma': 'sigma',
            'tau': 'tau',
            'phi': 'phi',
            'chi': 'chi',
            'psi': 'psi',
            'omega': 'omega',
        }
        
        # File extensions to process
        self.target_extensions = {'.py', '.md', '.json', '.txt', '.yml', '.yaml', '.cfg', '.ini'}
        
        # Directories to skip
        self.skip_directories = {
        '__pycache__', '.git', '.pytest_cache', '.mypy_cache',
            'node_modules', '.venv', 'venv', '.env', 'dist', 'build'
        }
        
        # Statistics tracking
        self.files_processed = 0
        self.files_modified = 0
        self.total_replacements = 0
        self.replacement_stats = {}
        
    def is_ascii_printable(self, char: str) -> bool:
        """Check if character is ASCII printable."""
        return 32 <= ord(char) <= 126 or char in '\n\r\t'
        
    def detect_unicode_chars(self, content: str) -> List[Tuple[str, int]]:
        """Detect all non-ASCII characters in content."""
        unicode_chars = []
        for i, char in enumerate(content):
            if not self.is_ascii_printable(char):
                unicode_chars.append((char, i))
        return unicode_chars
        
    def replace_unicode_chars(self, content: str) -> Tuple[str, int]:
        """Replace unicode characters with ASCII equivalents."""
        replacements_made = 0
        modified_content = content
        
        # Apply known replacements
        for unicode_char, ascii_replacement in self.unicode_replacements.items():
            if unicode_char in modified_content:
                count = modified_content.count(unicode_char)
                if count > 0:
                    modified_content = modified_content.replace(unicode_char, ascii_replacement)
                    replacements_made += count
                    
                    # Track replacement statistics
                    if unicode_char not in self.replacement_stats:
                        self.replacement_stats[unicode_char] = 0
                    self.replacement_stats[unicode_char] += count
        
        # Handle remaining unicode characters
        remaining_unicode = self.detect_unicode_chars(modified_content)
        for char, pos in remaining_unicode:
            # Try to find a reasonable ASCII replacement
            pass  # Auto-fixed: empty block
            pass  # Auto-fixed: empty block
            pass  # Auto-fixed: empty block
            pass  # Auto-fixed: empty block
            pass  # Auto-fixed: empty block
            pass  # Auto-fixed: empty block
            if char.isspace():
                replacement = ' '  # Replace any unicode whitespace with regular space
            elif ord(char) > 127:
                # For unhandled unicode, use a placeholder or remove
                pass  # Auto-fixed: empty block
                pass  # Auto-fixed: empty block
                pass  # Auto-fixed: empty block
                pass  # Auto-fixed: empty block
                pass  # Auto-fixed: empty block
                pass  # Auto-fixed: empty block
                replacement = '?'  # or '' to remove entirely
            else:
                continue
                
            modified_content = modified_content.replace(char, replacement)
            replacements_made += 1
            
            if char not in self.replacement_stats:
                self.replacement_stats[char] = 0
            self.replacement_stats[char] += 1
        
        return modified_content, replacements_made
    
    def process_file(self, file_path: Path) -> bool:
        """Process a single file for unicode removal."""
        try:
            # Read file content
            pass  # Auto-fixed: empty block
            pass  # Auto-fixed: empty block
            pass  # Auto-fixed: empty block
            pass  # Auto-fixed: empty block
            pass  # Auto-fixed: empty block
            pass  # Auto-fixed: empty block
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                original_content = f.read()
            
            # Skip if file is already ASCII-only
            if all(self.is_ascii_printable(char) for char in original_content):
                return False
                
            # Replace unicode characters
            modified_content, replacements_made = self.replace_unicode_chars(original_content)
            
            if replacements_made > 0:
                # Write modified content back
                pass  # Auto-fixed: empty block
                pass  # Auto-fixed: empty block
                pass  # Auto-fixed: empty block
                pass  # Auto-fixed: empty block
                pass  # Auto-fixed: empty block
                pass  # Auto-fixed: empty block
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(modified_content)
                    
                print(f"[OK] {file_path.relative_to(Path.cwd())}: {replacements_made) unicode chars replaced")
                self.total_replacements += replacements_made
                return True
            
            return False
            
        except Exception as e:
            print(f"[ERR] Error processing {file_path): {e)")
            return False
    
    def should_skip_file(self, file_path: Path) -> bool:
        """Check if file should be skipped."""
        # Skip if in excluded directory
        for part in file_path.parts:
            if part in self.skip_directories:
                return True
                
        # Skip if not target extension
        if file_path.suffix not in self.target_extensions:
            return True
            
        # Skip binary files
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                f.read(100)  # Try to read first 100 chars
        except UnicodeDecodeError:
            return True
            
        return False
    
    def lint_directory(self, directory: Path) -> None:
        """Recursively lint all files in directory."""
        print(f"[SCAN] Scanning directory: {directory)")
        
        for file_path in directory.rglob('*'):
            if not file_path.is_file():
                continue
                
            if self.should_skip_file(file_path):
                continue
                
            self.files_processed += 1
            
            if self.process_file(file_path):
                self.files_modified += 1
    
    def print_summary(self) -> None:
        """Print summary of unicode removal operation."""
        print("\n" + "="*80)
        print("[SUMMARY] UNICODE REMOVAL SUMMARY")
        print("="*80)
        print(f"Files processed: {self.files_processed)")
        print(f"Files modified: {self.files_modified)")
        print(f"Total replacements: {self.total_replacements)")
        
        if self.replacement_stats:
            print("\n[STATS] Replacement Statistics:")
            # Sort by frequency
            sorted_stats = sorted(self.replacement_stats.items(), 
                                key=lambda x: x[1], reverse=True)
            
            for char, count in sorted_stats[:20]:  # Top 20
            char_repr = repr(char) if len(char) == 1 else char
            replacement = self.unicode_replacements.get(char, '?')
            print(f"  {char_repr:>6) -> {replacement:<10) ({count:>3)x)")
        
        print("="*80)
        
        if self.files_modified > 0:
            print("[SUCCESS] Unicode removal completed successfully!")
        else:
            print("[SUCCESS] No unicode characters found - all files are ASCII-clean!")


def main():
    """Main execution function."""
    parser = argparse.ArgumentParser(description="Remove unicode characters from code files")
    parser.add_argument("path", nargs='?', default=".", 
                       help="Directory path to process (default: current directory)")
    parser.add_argument("--dry-run", action='store_true',
                       help="Show what would be changed without making changes")
    
    args = parser.parse_args()
    
    target_path = Path(args.path).resolve()
    
    if not target_path.exists():
        print(f"[ERROR] Error: Path '{target_path)' does not exist")
        sys.exit(1)
    
    if not target_path.is_dir():
        print(f"[ERROR] Error: Path '{target_path)' is not a directory") 
        sys.exit(1)
    
    print("[CLEAN] Unicode Removal Linter")
    print(f"[DIR] Target directory: {target_path)")
    
    if args.dry_run:
        print("[DRY-RUN] DRY RUN MODE - No files will be modified")
    
    # Create and run linter
    linter = UnicodeRemovalLinter()
    
    if args.dry_run:
        # For dry run, just detect unicode without replacing
        pass  # Auto-fixed: empty block
        pass  # Auto-fixed: empty block
        pass  # Auto-fixed: empty block
        pass  # Auto-fixed: empty block
        pass  # Auto-fixed: empty block
        pass  # Auto-fixed: empty block
        original_replace = linter.replace_unicode_chars
        def dry_run_replace(content):
            _, count = original_replace(content)
            return content, count  # Return original content
        linter.replace_unicode_chars = dry_run_replace
    
    linter.lint_directory(target_path)
    linter.print_summary()
    
    return 0 if linter.total_replacements == 0 else 1


if __name__ == "__main__":
    sys.exit(main())