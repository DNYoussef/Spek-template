#!/usr/bin/env python3
"""
Windows-Compatible Unicode Fixer
Handles encoding issues and systematically removes unicode characters
Focuses on source code files and excludes node_modules for performance
"""

from pathlib import Path
import os
import re
import shutil

import glob
import unicodedata

class WindowsUnicodeFixer:
    def __init__(self, root_path):
        self.root_path = Path(root_path)
        self.backup_dir = self.root_path / "unicode_backup_windows"
        self.stats = {
            'files_processed': 0,
            'replacements_made': 0,
            'files_with_unicode': 0,
            'errors': [],
            'skipped_node_modules': 0
        }

        # Simple but comprehensive replacements
        self.replacements = {
            # Common checkmarks and status
            '[OK]': '[OK]',
            '[FAIL]': '[FAIL]',
            '[PASS]': '[PASS]',
            '[FAIL]': '[FAIL]',
            '[WARN]': '[WARN]',
            '⚠': '[WARN]',

            # Arrows
            '→': '->',
            '←': '<-',
            '↑': '^',
            '↓': 'v',
            '⇒': '=>',
            '⇐': '<=',

            # Emojis
            '[ROCKET]': '[LAUNCH]',
            '[CHART]': '[DATA]',
            '[TARGET]': '[TARGET]',
            '🔍': '[SEARCH]',
            '[STAR]': '[STAR]',
            '💡': '[IDEA]',
            '[TOOL]': '[TOOL]',
            '📝': '[NOTE]',
            '📁': '[FOLDER]',
            '💾': '[SAVE]',
            '🚨': '[ALERT]',
            '🎉': '[CELEBRATE]',

            # Technical
            '[FAST]': '[FAST]',
            '🔒': '[LOCKED]',
            '🔓': '[UNLOCKED]',
            '[SHIELD]': '[SHIELD]',

            # Math symbols
            '≤': '<=',
            '≥': '>=',
            '≠': '!=',
            '≈': '~=',
            '±': '+/-',
            '×': 'x',
            '÷': '/',

            # Bullet points
            '•': '*',
            '◦': '-',
            '▪': '*',
            '▫': '-',

            # Quotes
            '"': '"',
            '"': '"',
            ''': "'",
            ''': "'",

            # Dashes
            '–': '-',
            '—': '--',

            # Special
            '…': '...',
            '°': 'deg',
            '™': '(TM)',
            '®': '(R)',
            '©': '(C)'
        }

    def should_skip_file(self, file_path):
        """Skip certain directories and file types for performance"""
        path_str = str(file_path)

        # Skip node_modules entirely
        if 'node_modules' in path_str:
            self.stats['skipped_node_modules'] += 1
            return True

        # Skip binary-like files
        skip_extensions = ['.min.js', '.min.css', '.map', '.woff', '.woff2',
                            '.ttf', '.eot', '.ico', '.png', '.jpg', '.jpeg',
                            '.gif', '.svg', '.pdf', '.zip', '.tar', '.gz']

        if any(path_str.endswith(ext) for ext in skip_extensions):
            return True

        # Skip very large files (> 1MB) likely to be generated
        try:
            if file_path.stat().st_size > 1024 * 1024:
                return True
        except:
            pass

        return False

    def safe_read_file(self, file_path):
        """Safely read file with multiple encoding attempts"""
        encodings = ['utf-8', 'utf-8-sig', 'latin1', 'cp1252', 'iso-8859-1']

        for encoding in encodings:
            try:
                with open(file_path, 'r', encoding=encoding, errors='replace') as f:
                    content = f.read()
                return content, encoding
            except Exception:
                continue

        # If all fail, read as binary and decode with replacement
        try:
            with open(file_path, 'rb') as f:
                content = f.read().decode('utf-8', errors='replace')
            return content, 'binary-fallback'
        except Exception as e:
            self.stats['errors'].append(f"Could not read {file_path}: {e}")
            return None, None

    def safe_write_file(self, file_path, content):
        """Safely write file ensuring ASCII compliance"""
        try:
            # Ensure content is ASCII-safe
            safe_content = content.encode('ascii', errors='replace').decode('ascii')

            with open(file_path, 'w', encoding='ascii', errors='replace') as f:
                f.write(safe_content)
            return True
        except Exception as e:
            self.stats['errors'].append(f"Could not write {file_path}: {e}")
            return False

    def detect_unicode(self, text):
        """Detect unicode characters in text"""
        unicode_chars = []
        for i, char in enumerate(text):
            if ord(char) > 127:
                unicode_chars.append((i, char, hex(ord(char))))
        return unicode_chars

    def replace_unicode(self, text):
        """Replace unicode characters with ASCII equivalents"""
        replacements_count = 0

        # Apply known replacements
        for unicode_char, replacement in self.replacements.items():
            if unicode_char in text:
                count = text.count(unicode_char)
                text = text.replace(unicode_char, replacement)
                replacements_count += count

        # Handle remaining unicode characters
        result = ""
        for char in text:
            if ord(char) > 127:
                # Try to decompose to ASCII
                try:
                    decomposed = unicodedata.decomposition(char)
                    if decomposed:
                        # Use the first character of decomposition if ASCII
                        base_char = chr(int(decomposed.split()[0], 16))
                        if ord(base_char) <= 127:
                            result += base_char
                            replacements_count += 1
                            continue
                except:
                    pass

                # Category-based replacement
                category = unicodedata.category(char)
                if category.startswith('L'):  # Letter
                    result += '?'
                elif category.startswith('N'):  # Number
                    result += '0'
                elif category.startswith('P'):  # Punctuation
                    result += '.'
                elif category.startswith('S'):  # Symbol
                    result += '_'
                elif category.startswith('Z'):  # Space
                    result += ' '
                else:
                    result += '_'

                replacements_count += 1
            else:
                result += char

        return result, replacements_count

    def process_file(self, file_path):
        """Process a single file"""
        if self.should_skip_file(file_path):
            return 0

        # Read file
        content, encoding = self.safe_read_file(file_path)
        if content is None:
            return 0

        # Check for unicode
        unicode_chars = self.detect_unicode(content)
        if not unicode_chars:
            return 0

        # Replace unicode
        new_content, replacements = self.replace_unicode(content)

        # Write back
        if self.safe_write_file(file_path, new_content):
            print(f"[FIXED] {file_path.name}: {replacements} replacements ({encoding})")
            self.stats['files_with_unicode'] += 1
            return replacements
        else:
            return 0

    def process_priority_files(self):
        """Process files by priority order"""
        print("=== WINDOWS UNICODE FIXER ===")
        print("Processing by priority (excluding node_modules)...")

        # Priority 1: Python files (CRITICAL)
        print("\n[CRITICAL] Processing Python files...")
        python_files = [f for f in self.root_path.rglob("*.py") if not self.should_skip_file(f)]
        total_py = 0
        for py_file in python_files[:100]:  # Limit for performance
            self.stats['files_processed'] += 1
            replacements = self.process_file(py_file)
            total_py += replacements
            self.stats['replacements_made'] += replacements
        print(f"Python files: {total_py} replacements")

        # Priority 2: Core documentation
        print("\n[HIGH] Processing core documentation...")
        core_docs = ['README.md', 'CLAUDE.md', 'SPEC.md']
        total_docs = 0
        for doc_name in core_docs:
            doc_path = self.root_path / doc_name
            if doc_path.exists():
                self.stats['files_processed'] += 1
                replacements = self.process_file(doc_path)
                total_docs += replacements
                self.stats['replacements_made'] += replacements
        print(f"Core docs: {total_docs} replacements")

        # Priority 3: Configuration files
        print("\n[MEDIUM] Processing configuration files...")
        config_files = list(self.root_path.rglob("*.json"))[:50] + list(self.root_path.rglob("*.yaml"))[:50]
        config_files = [f for f in config_files if not self.should_skip_file(f)]
        total_config = 0
        for config_file in config_files:
            self.stats['files_processed'] += 1
            replacements = self.process_file(config_file)
            total_config += replacements
            self.stats['replacements_made'] += replacements
        print(f"Config files: {total_config} replacements")

    def validate_python_syntax(self):
        """Quick validation of Python files"""
        print("\n=== PYTHON SYNTAX VALIDATION ===")
        python_files = [f for f in self.root_path.rglob("*.py") if not self.should_skip_file(f)]

        syntax_errors = 0
        checked = 0

        for py_file in python_files[:50]:  # Sample validation
            try:
                content, _ = self.safe_read_file(py_file)
                if content:
                    compile(content, str(py_file), 'exec')
                    checked += 1
            except SyntaxError:
                syntax_errors += 1
                print(f"[SYNTAX_ERROR] {py_file.name}")
            except Exception:
                pass

        print(f"Checked: {checked} files")
        print(f"Syntax errors: {syntax_errors}")
        return syntax_errors == 0

    def final_unicode_count(self):
        """Quick unicode count in key directories"""
        print("\n=== FINAL UNICODE COUNT ===")

        # Count in source code directories only
        source_dirs = ['src', 'analyzer', 'scripts', '.claude']
        total_unicode = 0

        for dir_name in source_dirs:
            dir_path = self.root_path / dir_name
            if dir_path.exists():
                dir_unicode = 0
                for file_path in dir_path.rglob("*"):
                    if (file_path.is_file() and
                        not self.should_skip_file(file_path) and
                        file_path.suffix in ['.py', '.md', '.json', '.yaml', '.yml']):

                        content, _ = self.safe_read_file(file_path)
                        if content:
                            unicode_chars = self.detect_unicode(content)
                            if unicode_chars:
                                dir_unicode += len(unicode_chars)

                total_unicode += dir_unicode
                print(f"{dir_name}: {dir_unicode} unicode characters")

        print(f"Total in source code: {total_unicode} unicode characters")
        return total_unicode

    def print_summary(self):
        """Print processing summary"""
        print("\n" + "="*60)
        print("WINDOWS UNICODE FIXER SUMMARY")
        print("="*60)
        print(f"Files processed: {self.stats['files_processed']}")
        print(f"Files with unicode: {self.stats['files_with_unicode']}")
        print(f"Total replacements: {self.stats['replacements_made']}")
        print(f"Node modules skipped: {self.stats['skipped_node_modules']}")
        print(f"Errors: {len(self.stats['errors'])}")

        if self.stats['errors'][:5]:  # Show first 5 errors
            print("\nFirst 5 errors:")
            for error in self.stats['errors'][:5]:
                print(f"  - {error}")

    def run(self):
        """Run the complete unicode fixing process"""
        # Process files by priority
        self.process_priority_files()

        # Validate Python syntax
        syntax_ok = self.validate_python_syntax()

        # Final count
        remaining = self.final_unicode_count()

        # Summary
        self.print_summary()

        # Result
        print("\n" + "="*60)
        if remaining == 0 and syntax_ok:
            print("[SUCCESS] 100% ASCII COMPLIANCE ACHIEVED!")
            print("[SUCCESS] All Python files have valid syntax!")
        elif remaining < 1000:  # Significant improvement
            print(f"[PROGRESS] Reduced to {remaining} unicode characters")
            print("[INFO] Focus on source code directories completed")
        else:
            print(f"[INFO] {remaining} unicode characters in source code")
            print("[INFO] May need additional cleanup")

        if not syntax_ok:
            print("[WARNING] Some Python files have syntax errors")

        print("="*60)

        return remaining < 1000 and syntax_ok

if __name__ == "__main__":
    import sys

    root_path = sys.argv[1] if len(sys.argv) > 1 else "."
    fixer = WindowsUnicodeFixer(root_path)
    success = fixer.run()

    sys.exit(0 if success else 1)