#!/usr/bin/env python3
"""
Unicode Eliminator - Complete ASCII Compliance Tool
Systematically removes all unicode characters for Windows compatibility
"""

from pathlib import Path
import os
import re
import shutil

import glob

# Comprehensive Unicode Replacement Mapping
UNICODE_REPLACEMENTS = {
    # Checkmarks and status symbols
    '[OK]': '[OK]',
    '[FAIL]': '[FAIL]',
    '[PASS]': '[PASS]',
    '[FAIL]': '[FAIL]',
    '[WARN]': '[WARN]',
    '[WARN]': '[WARN]',
    '[ALERT]': '[ALERT]',
    '[ERROR]': '[ERROR]',
    '[WARN]': '[WARN]',
    '[OK]': '[OK]',

    # Arrows and directional symbols
    '->': '->',
    '<-': '<-',
    '^': '^',
    'v': 'v',
    '=>': '=>',
    '<=': '<=',
    '->': '->',
    '<-': '<-',
    '->': '->',
    '<-': '<-',
    '^': '^',
    'v': 'v',

    # Business and project symbols
    '[LAUNCH]': '[LAUNCH]',
    '[DATA]': '[DATA]',
    '[GROWTH]': '[GROWTH]',
    '[DECLINE]': '[DECLINE]',
    '[TARGET]': '[TARGET]',
    '[SEARCH]': '[SEARCH]',
    '[FIND]': '[FIND]',
    '[STAR]': '[STAR]',
    '[STAR]': '[STAR]',
    '[IDEA]': '[IDEA]',
    '[TOOL]': '[TOOL]',
    '[CONFIG]': '[CONFIG]',
    '[TOOLS]': '[TOOLS]',
    '[NOTE]': '[NOTE]',
    '[DOC]': '[DOC]',
    '[FOLDER]': '[FOLDER]',
    '[FILES]': '[FILES]',
    '[SAVE]': '[SAVE]',
    '[DISK]': '[DISK]',
    '[CD]': '[CD]',
    '[DISK]': '[DISK]',
    '[DESKTOP]': '[DESKTOP]',
    '[LAPTOP]': '[LAPTOP]',
    '[MOBILE]': '[MOBILE]',
    '[WATCH]': '[WATCH]',
    '[PHONE]': '[PHONE]',
    '[PHONE]': '[PHONE]',

    # Technical symbols
    '[FAST]': '[FAST]',
    '[BATTERY]': '[BATTERY]',
    '[PLUG]': '[PLUG]',
    '[SIGNAL]': '[SIGNAL]',
    '[BARS]': '[BARS]',
    '[VIBRATE]': '[VIBRATE]',
    '[OFF]': '[OFF]',
    '[SLEEP]': '[SLEEP]',
    '[LOCKED]': '[LOCKED]',
    '[UNLOCKED]': '[UNLOCKED]',
    '[SECURE]': '[SECURE]',
    '[KEY]': '[KEY]',
    '[KEY]': '[KEY]',
    '[SHIELD]': '[SHIELD]',
    '[SWORDS]': '[SWORDS]',
    '[ARROW]': '[ARROW]',
    '[TENT]': '[TENT]',
    '[HOME]': '[HOME]',
    '[OFFICE]': '[OFFICE]',
    '[FACTORY]': '[FACTORY]',
    '[CONSTRUCTION]': '[CONSTRUCTION]',
    '[CASTLE]': '[CASTLE]',

    # Math and science symbols
    'infinity': 'infinity',
    '<=': '<=',
    '>=': '>=',
    '!=': '!=',
    '~=': '~=',
    '+/-': '+/-',
    'x': 'x',
    '/': '/',
    'sqrt': 'sqrt',
    'sum': 'sum',
    'product': 'product',
    'integral': 'integral',
    'delta': 'delta',
    'nabla': 'nabla',
    'partial': 'partial',

    # Bullet points and lists
    '*': '*',
    '-': '-',
    '*': '*',
    '-': '-',
    '*': '*',
    '-': '-',
    '*': '*',
    '*': '*',
    '-': '-',
    '>': '>',
    '>': '>',

    # Quotation marks
    '"': '"',
    '"': '"',
    '''''''''"': '"',
    '"': '"',
    ''''''': "'",

    # Dashes
    '-': '-',
    '--': '--',
    '---': '---',
    '-': '-',
    '-': '-',

    # Special characters
    '...': '...',
    '%': '%',
    '%': '%',
    'deg': 'deg',
    '(TM)': '(TM)',
    '(R)': '(R)',
    '(C)': '(C)',
    'section': 'section',
    'P': 'P',
    '+': '+',
    '++': '++',

    # Numbers and fractions
    '1/2': '1/2',
    '1/3': '1/3',
    '1/4': '1/4',
    '3/4': '3/4',
    '1/5': '1/5',
    '1/6': '1/6',
    '1/8': '1/8',
    '2/3': '2/3',
    '2/5': '2/5',
    '3/5': '3/5',
    '4/5': '4/5',
    '7/8': '7/8',

    # Emoji patterns (comprehensive)
    '[CELEBRATE]': '[CELEBRATE]',
    '[FIRE]': '[FIRE]',
    '[100]': '[100]',
    '[THUMBS_UP]': '[THUMBS_UP]',
    '[THUMBS_DOWN]': '[THUMBS_DOWN]',
    '[OK_HAND]': '[OK_HAND]',
    '[HAND]': '[HAND]',
    '[WAVE]': '[WAVE]',
    '[HANDSHAKE]': '[HANDSHAKE]',
    '[CLAP]': '[CLAP]',
    '[PRAY]': '[PRAY]',
    '[STRONG]': '[STRONG]',
    '[BRAIN]': '[BRAIN]',
    '[EYE]': '[EYE]',
    '[EYES]': '[EYES]',
    '[EAR]': '[EAR]',
    '[NOSE]': '[NOSE]',
    '[MOUTH]': '[MOUTH]',
    '[BROKEN_HEART]': '[BROKEN_HEART]',
    '[HEART]': '[HEART]',
    '[BLUE_HEART]': '[BLUE_HEART]',
    '[GREEN_HEART]': '[GREEN_HEART]',
    '[YELLOW_HEART]': '[YELLOW_HEART]',
    '[ORANGE_HEART]': '[ORANGE_HEART]',
    '[PURPLE_HEART]': '[PURPLE_HEART]',
    '[BLACK_HEART]': '[BLACK_HEART]',
    '[WHITE_HEART]': '[WHITE_HEART]',
    '[BROWN_HEART]': '[BROWN_HEART]',
}

class UnicodeEliminator:
    def __init__(self, root_path):
        self.root_path = Path(root_path)
        self.backup_dir = self.root_path / "unicode_backup"
        self.stats = {
            'files_processed': 0,
            'replacements_made': 0,
            'files_with_unicode': 0,
            'errors': []
        }

    def create_backup(self):
        """Create backup before processing"""
        if self.backup_dir.exists():
            shutil.rmtree(self.backup_dir)
        self.backup_dir.mkdir()
        print(f"[BACKUP] Created backup directory: {self.backup_dir}")

    def detect_unicode(self, text):
        """Detect unicode characters in text"""
        unicode_chars = []
        for i, char in enumerate(text):
            if ord(char) > 127:
                unicode_chars.append((i, char, hex(ord(char))))
        return unicode_chars

    def replace_unicode(self, text):
        """Replace unicode characters with ASCII equivalents"""
        original_text = text
        replacements_count = 0

        # Apply known replacements first
        for unicode_char, replacement in UNICODE_REPLACEMENTS.items():
            if unicode_char in text:
                count = text.count(unicode_char)
                text = text.replace(unicode_char, replacement)
                replacements_count += count

        # Handle any remaining unicode with generic replacement
        remaining_unicode = self.detect_unicode(text)
        if remaining_unicode:
            print(f"[WARN] Found {len(remaining_unicode)} unmapped unicode characters")
            for pos, char, hex_val in remaining_unicode[:10]:  # Show first 10
                print(f"  Position {pos}: '{char}' ({hex_val})")

            # Generic replacement for unmapped characters
            new_text = ""
            for char in text:
                if ord(char) > 127:
                    # Try to find a reasonable ASCII replacement
                    if char.isalpha():
                        new_text += "?"  # Replace with question mark
                    elif char.isdigit():
                        new_text += "0"  # Replace with zero
                    elif char.isspace():
                        new_text += " "  # Replace with regular space
                    else:
                        new_text += "_"  # Replace with underscore
                    replacements_count += 1
                else:
                    new_text += char
            text = new_text

        return text, replacements_count

    def process_file(self, file_path, backup=True):
        """Process a single file"""
        try:
            # Read file
            with open(file_path, 'r', encoding='utf-8', errors='replace') as f:
                content = f.read()

            # Check for unicode
            unicode_chars = self.detect_unicode(content)
            if not unicode_chars:
                return 0  # No unicode found

            # Create backup if requested
            if backup:
                backup_path = self.backup_dir / file_path.name
                with open(backup_path, 'w', encoding='utf-8') as f:
                    f.write(content)

            # Replace unicode
            new_content, replacements = self.replace_unicode(content)

            # Write back
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(new_content)

            print(f"[PROCESSED] {file_path}: {replacements} replacements")
            self.stats['files_with_unicode'] += 1
            return replacements

        except Exception as e:
            error_msg = f"Error processing {file_path}: {e}"
            print(f"[ERROR] {error_msg}")
            self.stats['errors'].append(error_msg)
            return 0

    def process_python_files(self):
        """Process all Python files - CRITICAL priority"""
        print("\n=== PROCESSING PYTHON FILES (CRITICAL) ===")
        python_files = list(self.root_path.rglob("*.py"))
        total_replacements = 0

        for py_file in python_files:
            self.stats['files_processed'] += 1
            replacements = self.process_file(py_file)
            total_replacements += replacements
            self.stats['replacements_made'] += replacements

        print(f"[PYTHON] Processed {len(python_files)} files, {total_replacements} replacements")
        return total_replacements

    def process_markdown_files(self):
        """Process all Markdown files - HIGH priority"""
        print("\n=== PROCESSING MARKDOWN FILES (HIGH) ===")
        md_files = list(self.root_path.rglob("*.md"))
        total_replacements = 0

        for md_file in md_files:
            self.stats['files_processed'] += 1
            replacements = self.process_file(md_file)
            total_replacements += replacements
            self.stats['replacements_made'] += replacements

        print(f"[MARKDOWN] Processed {len(md_files)} files, {total_replacements} replacements")
        return total_replacements

    def process_json_files(self):
        """Process all JSON files - MEDIUM priority"""
        print("\n=== PROCESSING JSON FILES (MEDIUM) ===")
        json_files = list(self.root_path.rglob("*.json"))
        total_replacements = 0

        for json_file in json_files:
            self.stats['files_processed'] += 1
            replacements = self.process_file(json_file)
            total_replacements += replacements
            self.stats['replacements_made'] += replacements

        print(f"[JSON] Processed {len(json_files)} files, {total_replacements} replacements")
        return total_replacements

    def process_yaml_files(self):
        """Process all YAML files - MEDIUM priority"""
        print("\n=== PROCESSING YAML FILES (MEDIUM) ===")
        yaml_files = list(self.root_path.rglob("*.yaml")) + list(self.root_path.rglob("*.yml"))
        total_replacements = 0

        for yaml_file in yaml_files:
            self.stats['files_processed'] += 1
            replacements = self.process_file(yaml_file)
            total_replacements += replacements
            self.stats['replacements_made'] += replacements

        print(f"[YAML] Processed {len(yaml_files)} files, {total_replacements} replacements")
        return total_replacements

    def process_script_files(self):
        """Process all script files - LOW priority"""
        print("\n=== PROCESSING SCRIPT FILES (LOW) ===")
        script_files = list(self.root_path.rglob("*.sh")) + list(self.root_path.rglob("*.js"))
        total_replacements = 0

        for script_file in script_files:
            self.stats['files_processed'] += 1
            replacements = self.process_file(script_file)
            total_replacements += replacements
            self.stats['replacements_made'] += replacements

        print(f"[SCRIPTS] Processed {len(script_files)} files, {total_replacements} replacements")
        return total_replacements

    def validate_python_compilation(self):
        """Validate all Python files compile successfully"""
        print("\n=== VALIDATING PYTHON COMPILATION ===")
        python_files = list(self.root_path.rglob("*.py"))
        compilation_errors = []

        for py_file in python_files:
            try:
                with open(py_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                compile(content, str(py_file), 'exec')
            except SyntaxError as e:
                error_msg = f"Syntax error in {py_file}: {e}"
                compilation_errors.append(error_msg)
                print(f"[COMPILE_ERROR] {error_msg}")
            except Exception as e:
                error_msg = f"Compilation error in {py_file}: {e}"
                compilation_errors.append(error_msg)
                print(f"[COMPILE_ERROR] {error_msg}")

        if compilation_errors:
            print(f"[COMPILATION] {len(compilation_errors)} files have compilation errors")
            return False
        else:
            print(f"[COMPILATION] All {len(python_files)} Python files compile successfully")
            return True

    def final_unicode_scan(self):
        """Final scan to verify 0 unicode characters remain"""
        print("\n=== FINAL UNICODE VALIDATION ===")

        file_types = [
            ("*.py", "Python"),
            ("*.md", "Markdown"),
            ("*.json", "JSON"),
            ("*.yaml", "YAML"),
            ("*.yml", "YAML"),
            ("*.sh", "Shell"),
            ("*.js", "JavaScript")
        ]

        total_unicode = 0
        for pattern, file_type in file_types:
            files = list(self.root_path.rglob(pattern))
            type_unicode = 0

            for file_path in files:
                try:
                    with open(file_path, 'r', encoding='utf-8', errors='replace') as f:
                        content = f.read()

                    unicode_chars = self.detect_unicode(content)
                    if unicode_chars:
                        type_unicode += len(unicode_chars)
                        print(f"[UNICODE_REMAINING] {file_path}: {len(unicode_chars)} characters")

                except Exception as e:
                    print(f"[ERROR] Could not scan {file_path}: {e}")

            total_unicode += type_unicode
            print(f"[{file_type}] {type_unicode} unicode characters remaining")

        print(f"\n[TOTAL] {total_unicode} unicode characters remaining")
        return total_unicode

    def print_stats(self):
        """Print processing statistics"""
        print("\n" + "="*60)
        print("UNICODE ELIMINATION STATISTICS")
        print("="*60)
        print(f"Files processed: {self.stats['files_processed']}")
        print(f"Files with unicode: {self.stats['files_with_unicode']}")
        print(f"Total replacements: {self.stats['replacements_made']}")
        print(f"Errors encountered: {len(self.stats['errors'])}")

        if self.stats['errors']:
            print("\nErrors:")
            for error in self.stats['errors'][:10]:  # Show first 10 errors
                print(f"  - {error}")

    def run_full_elimination(self):
        """Run complete unicode elimination process"""
        print("UNICODE ELIMINATOR - ACHIEVING 100% ASCII COMPLIANCE")
        print("="*60)

        # Create backup
        self.create_backup()

        # Process by priority
        self.process_python_files()      # CRITICAL
        self.process_markdown_files()    # HIGH
        self.process_json_files()        # MEDIUM
        self.process_yaml_files()        # MEDIUM
        self.process_script_files()      # LOW

        # Validate compilation
        compilation_success = self.validate_python_compilation()

        # Final scan
        remaining_unicode = self.final_unicode_scan()

        # Print statistics
        self.print_stats()

        # Final result
        print("\n" + "="*60)
        if remaining_unicode == 0 and compilation_success:
            print("[SUCCESS] 100% ASCII COMPLIANCE ACHIEVED!")
            print("[SUCCESS] All Python files compile successfully!")
            print("[SUCCESS] Windows compatibility ensured!")
        else:
            print(f"[WARNING] {remaining_unicode} unicode characters still remain")
            if not compilation_success:
                print("[ERROR] Some Python files have compilation errors")
        print("="*60)

        return remaining_unicode == 0 and compilation_success

if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1:
        root_path = sys.argv[1]
    else:
        root_path = "."

    eliminator = UnicodeEliminator(root_path)
    success = eliminator.run_full_elimination()

    sys.exit(0 if success else 1)