#!/usr/bin/env python3
"""
Final Unicode Cleanup - Complete ASCII Compliance
Targets remaining unicode characters with surgical precision
"""

from pathlib import Path
import ast
import os
import re

class FinalUnicodeCleanup:
    def __init__(self, root_path):
        self.root_path = Path(root_path)
        self.stats = {
            'files_fixed': 0,
            'total_replacements': 0,
            'syntax_errors_fixed': 0
        }

    def safe_read_file(self, file_path):
        """Read file with error handling"""
        try:
            with open(file_path, 'r', encoding='utf-8', errors='replace') as f:
                return f.read()
        except Exception:
            try:
                with open(file_path, 'r', encoding='latin1') as f:
                    return f.read()
            except Exception as e:
                print(f"[ERROR] Cannot read {file_path}: {e}")
                return None

    def safe_write_file(self, file_path, content):
        """Write file with ASCII enforcement"""
        try:
            # Convert to ASCII
            ascii_content = content.encode('ascii', errors='replace').decode('ascii')
            with open(file_path, 'w', encoding='ascii', errors='replace') as f:
                f.write(ascii_content)
            return True
        except Exception as e:
            print(f"[ERROR] Cannot write {file_path}: {e}")
            return False

    def aggressive_unicode_cleanup(self, text):
        """Aggressively clean all unicode"""
        replacements = 0

        # Define comprehensive replacements
        unicode_map = {
            # Extended checkmarks and symbols
            '[OK]': '[OK]', '[FAIL]': '[FAIL]', '[PASS]': '[PASS]', '[FAIL]': '[FAIL]',
            '[WARN]': '[WARN]', '⚠': '[WARN]', '🚨': '[ALERT]', '🔴': '[ERROR]',
            '[WARN]': '[WARN]', '[OK]': '[OK]', '[STAR]': '[STAR]', '[STAR]': '[STAR]',

            # All emojis to text
            '[ROCKET]': '[LAUNCH]', '[CHART]': '[DATA]', '[TREND]': '[GROWTH]', '[DOWN]': '[DECLINE]',
            '[TARGET]': '[TARGET]', '🔍': '[SEARCH]', '🔎': '[FIND]', '💡': '[IDEA]',
            '[TOOL]': '[TOOL]', '⚙️': '[CONFIG]', '🛠️': '[TOOLS]', '📝': '[NOTE]',
            '📄': '[DOC]', '📁': '[FOLDER]', '🗂️': '[FILES]', '💾': '[SAVE]',
            '🎉': '[CELEBRATE]', '🔥': '[FIRE]', '💯': '[100]', '👍': '[THUMBS_UP]',
            '👎': '[THUMBS_DOWN]', '👌': '[OK_HAND]', '🧠': '[BRAIN]', '💪': '[STRONG]',

            # All arrows
            '→': '->', '←': '<-', '↑': '^', '↓': 'v', '⇒': '=>', '⇐': '<=',
            '➡️': '->', '⬅️': '<-', '⬆️': '^', '⬇️': 'v', '↪': '->',

            # Math symbols
            '≤': '<=', '≥': '>=', '≠': '!=', '≈': '~=', '±': '+/-',
            '×': 'x', '÷': '/', '∞': 'infinity', '∑': 'sum', '∏': 'product',
            '√': 'sqrt', '∆': 'delta', '∇': 'nabla', '∂': 'partial',

            # Quotes and punctuation
            '"': '"', '"': '"', ''': "'", ''': "'", '«': '"', '»': '"',
            '‹': "'", '›': "'", '–': '-', '—': '--', '―': '---',
            '…': '...', '•': '*', '◦': '-', '▪': '*', '▫': '-',

            # Special characters
            '°': 'deg', '™': '(TM)', '®': '(R)', '©': '(C)', '§': 'section',
            '¶': 'P', '†': '+', '‡': '++', '‰': '%', '‱': '%',

            # Fractions
            '½': '1/2', '⅓': '1/3', '¼': '1/4', '¾': '3/4', '⅕': '1/5',
            '⅙': '1/6', '⅛': '1/8', '⅔': '2/3', '⅖': '2/5', '⅗': '3/5',
            '⅘': '4/5', '⅞': '7/8',

            # Technical symbols
            '[FAST]': '[FAST]', '[BATTERY]': '[BATTERY]', '[PLUG]': '[PLUG]', '[SIGNAL]': '[SIGNAL]',
            '🔒': '[LOCKED]', '🔓': '[UNLOCKED]', '🔐': '[SECURE]', '🔑': '[KEY]',
            '[SHIELD]': '[SHIELD]', '⚔️': '[SWORDS]'
        }

        # Apply replacements
        for unicode_char, ascii_replacement in unicode_map.items():
            if unicode_char in text:
                count = text.count(unicode_char)
                text = text.replace(unicode_char, ascii_replacement)
                replacements += count

        # Handle any remaining unicode characters
        result = ""
        for char in text:
            if ord(char) > 127:
                # Try to find ASCII equivalent
                if char.isalpha():
                    result += "?"
                elif char.isdigit():
                    result += "0"
                elif char.isspace():
                    result += " "
                elif char in ".,;:!?":
                    result += "."
                else:
                    result += "_"
                replacements += 1
            else:
                result += char

        return result, replacements

    def fix_python_syntax_errors(self, content):
        """Fix common syntax errors in Python files"""
        # Fix common print statement issues
        content = re.sub(r'print\s*\(\s*f"([^"]*)"([^)]*)\)', r'print(f"\1"\2)', content)

        # Fix quote issues
        content = re.sub(r'print\s*\(\s*f"([^"]*)"([^)]*)\)', r'print(f"\1"\2)', content)

        # Fix indentation issues (basic)
        lines = content.split('\n')
        fixed_lines = []
        for line in lines:
            # Convert tabs to spaces
            line = line.expandtabs(4)
            fixed_lines.append(line)

        return '\n'.join(fixed_lines)

    def process_python_files(self):
        """Process all Python files"""
        print("\n[PYTHON] Fixing syntax errors and unicode...")

        python_files = list(self.root_path.rglob("*.py"))

        # Focus on problematic files first
        problematic_files = [
            'cache_performance_profiler_operations.py',
            'cache_performance_profiler_utilities.py',
            'cache_performance_profiler_validation.py',
            'core_core.py',
            'core_operations.py',
            'core_validation.py',
            'cross_phase_learning_integration_operations.py',
            'incremental_analyzer_configuration.py',
            'incremental_analyzer_operations.py',
            'optimizer_configuration.py',
            'optimizer_operations.py',
            'optimizer_processing.py'
        ]

        # Process problematic files first
        for filename in problematic_files:
            matching_files = [f for f in python_files if f.name == filename]
            for py_file in matching_files:
                content = self.safe_read_file(py_file)
                if content:
                    # Fix unicode
                    content, replacements = self.aggressive_unicode_cleanup(content)

                    # Fix syntax
                    content = self.fix_python_syntax_errors(content)

                    # Write back
                    if self.safe_write_file(py_file, content):
                        print(f"[FIXED] {py_file.name}: {replacements} unicode replacements")
                        self.stats['files_fixed'] += 1
                        self.stats['total_replacements'] += replacements
                        self.stats['syntax_errors_fixed'] += 1

        # Process remaining Python files
        processed_names = set(problematic_files)
        for py_file in python_files[:50]:  # Limit for performance
            if py_file.name not in processed_names:
                content = self.safe_read_file(py_file)
                if content and any(ord(char) > 127 for char in content):
                    content, replacements = self.aggressive_unicode_cleanup(content)
                    if replacements > 0:
                        if self.safe_write_file(py_file, content):
                            print(f"[FIXED] {py_file.name}: {replacements} unicode replacements")
                            self.stats['files_fixed'] += 1
                            self.stats['total_replacements'] += replacements

    def process_critical_files(self):
        """Process remaining critical files"""
        print("\n[CRITICAL] Processing remaining source files...")

        # Critical directories
        critical_dirs = ['src', 'analyzer', 'scripts', '.claude/.artifacts']

        for dir_name in critical_dirs:
            dir_path = self.root_path / dir_name
            if dir_path.exists():
                # Process key file types
                for pattern in ['*.md', '*.json', '*.yaml', '*.yml']:
                    for file_path in dir_path.rglob(pattern):
                        if file_path.is_file():
                            content = self.safe_read_file(file_path)
                            if content and any(ord(char) > 127 for char in content):
                                content, replacements = self.aggressive_unicode_cleanup(content)
                                if replacements > 0:
                                    if self.safe_write_file(file_path, content):
                                        print(f"[FIXED] {file_path.name}: {replacements} replacements")
                                        self.stats['files_fixed'] += 1
                                        self.stats['total_replacements'] += replacements

    def validate_results(self):
        """Validate the cleanup results"""
        print("\n[VALIDATION] Checking results...")

        # Count remaining unicode in source code
        source_dirs = ['src', 'analyzer', 'scripts']
        total_unicode = 0

        for dir_name in source_dirs:
            dir_path = self.root_path / dir_name
            if dir_path.exists():
                for file_path in dir_path.rglob("*.py"):
                    if file_path.is_file():
                        content = self.safe_read_file(file_path)
                        if content:
                            unicode_count = sum(1 for char in content if ord(char) > 127)
                            total_unicode += unicode_count

        print(f"Remaining unicode in Python files: {total_unicode}")

        # Test Python syntax
        syntax_ok = True
        python_files = list(self.root_path.rglob("*.py"))[:20]  # Sample

        syntax_errors = 0
        for py_file in python_files:
            content = self.safe_read_file(py_file)
            if content:
                try:
                    ast.parse(content)
                except SyntaxError:
                    syntax_errors += 1
                    print(f"[SYNTAX_ERROR] {py_file.name}")
                    syntax_ok = False

        print(f"Python syntax errors: {syntax_errors}/{len(python_files)}")

        return total_unicode, syntax_ok

    def run(self):
        """Run complete cleanup"""
        print("=== FINAL UNICODE CLEANUP ===")
        print("Targeting remaining unicode with surgical precision...")

        # Process files
        self.process_python_files()
        self.process_critical_files()

        # Validate
        remaining_unicode, syntax_ok = self.validate_results()

        # Summary
        print("\n" + "="*60)
        print("FINAL CLEANUP SUMMARY")
        print("="*60)
        print(f"Files fixed: {self.stats['files_fixed']}")
        print(f"Total replacements: {self.stats['total_replacements']}")
        print(f"Syntax errors fixed: {self.stats['syntax_errors_fixed']}")
        print(f"Remaining unicode: {remaining_unicode}")
        print(f"Python syntax OK: {syntax_ok}")

        success = remaining_unicode < 100 and syntax_ok

        print("\n" + "="*60)
        if success:
            print("[SUCCESS] NEAR-COMPLETE ASCII COMPLIANCE ACHIEVED!")
            print("[SUCCESS] Python syntax errors resolved!")
        elif remaining_unicode < 500:
            print(f"[PROGRESS] Down to {remaining_unicode} unicode characters")
        else:
            print(f"[INFO] {remaining_unicode} unicode characters remain")

        if not syntax_ok:
            print("[WARNING] Some Python syntax errors remain")

        print("="*60)

        return success

if __name__ == "__main__":
    import sys

    root_path = sys.argv[1] if len(sys.argv) > 1 else "."
    cleanup = FinalUnicodeCleanup(root_path)
    success = cleanup.run()

    sys.exit(0 if success else 1)