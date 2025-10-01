"""
AST-Based Syntax Fixer
Production-ready automated syntax repair with safeguards
"""

import ast
import re
from pathlib import Path
from typing import Optional, Dict, Any, List
from dataclasses import dataclass
from enum import Enum


class FixStrategy(Enum):
    """Available fix strategies in priority order"""
    SKIP_IF_VALID = "skip_if_valid"  # Pre-validation check
    RESTORE_IMPORTS = "restore_imports"  # Fix split parentheses
    ADD_DOCSTRING_OPENER = "add_docstring_opener"  # Fix unterminated strings
    FIX_BRACKET_MISMATCH = "fix_bracket_mismatch"  # Fix )]} mismatches
    FIX_INDENTATION = "fix_indentation"  # Fix unexpected indent
    FIX_MISSING_COLON = "fix_missing_colon"  # Add missing colons


@dataclass
class FixResult:
    """Result from applying a fix"""
    success: bool
    strategy: FixStrategy
    original_error: Optional[str] = None
    fixed: bool = False
    skipped: bool = False
    error: Optional[str] = None

    def __str__(self):
        if self.skipped:
            return f"[SKIP] {self.strategy.value}: File already valid"
        elif self.success:
            return f"[SUCCESS] {self.strategy.value}: Fixed"
        else:
            return f"[FAILED] {self.strategy.value}: {self.error}"


class ASTSyntaxFixer:
    """
    AST-based syntax fixer with safeguards

    SAFEGUARDS:
    1. Pre-validation: Skip files that already parse
    2. Backup: Store original content before modification
    3. Post-validation: Verify fix improves syntax
    4. Rollback: Restore original if fix fails
    """

    def __init__(self, protected_files: List[str] = None):
        self.protected_files = set(protected_files or [])
        self.fixes_applied = 0
        self.files_skipped = 0
        self.files_failed = 0

    def fix_file(self, filepath: Path) -> List[FixResult]:
        """
        Apply automated fixes to file with full safeguards

        Returns list of FixResult, one per strategy attempted
        """
        results = []

        # Check if file is protected
        if str(filepath) in self.protected_files:
            results.append(FixResult(
                success=True,
                strategy=FixStrategy.SKIP_IF_VALID,
                skipped=True,
                error="File is in .fixignore - protected"
            ))
            self.files_skipped += 1
            return results

        # SAFEGUARD 1: Pre-validation
        original = self._read_file(filepath)

        if self._is_valid_syntax(original):
            results.append(FixResult(
                success=True,
                strategy=FixStrategy.SKIP_IF_VALID,
                skipped=True
            ))
            self.files_skipped += 1
            return results

        # Get original error for reporting
        original_error = self._get_syntax_error(original)

        # SAFEGUARD 2: Backup
        backup = original

        # Try fix strategies in order
        strategies = [
            self._fix_split_imports,
            self._fix_unterminated_docstring,
            self._fix_bracket_mismatch,
            self._fix_indentation,
            self._fix_missing_colon
        ]

        current_content = original

        # Map strategy functions to enum values
        strategy_map = {
            self._fix_split_imports: FixStrategy.RESTORE_IMPORTS,
            self._fix_unterminated_docstring: FixStrategy.ADD_DOCSTRING_OPENER,
            self._fix_bracket_mismatch: FixStrategy.FIX_BRACKET_MISMATCH,
            self._fix_indentation: FixStrategy.FIX_INDENTATION,
            self._fix_missing_colon: FixStrategy.FIX_MISSING_COLON
        }

        for strategy_func in strategies:
            strategy_enum = strategy_map[strategy_func]

            # Apply fix
            fixed_content, applied = strategy_func(current_content, original_error)

            if not applied:
                continue

            # SAFEGUARD 3: Post-validation
            if self._is_valid_syntax(fixed_content):
                # Success! Write fixed content
                self._write_file(filepath, fixed_content)

                results.append(FixResult(
                    success=True,
                    strategy=strategy_enum,
                    original_error=original_error,
                    fixed=True
                ))

                self.fixes_applied += 1
                return results  # Stop on first successful fix

            # Fix didn't work, try next strategy
            results.append(FixResult(
                success=False,
                strategy=strategy_enum,
                original_error=original_error,
                error="Fix did not resolve syntax error"
            ))

        # SAFEGUARD 4: Rollback (all strategies failed)
        self._write_file(filepath, backup)
        self.files_failed += 1

        results.append(FixResult(
            success=False,
            strategy=FixStrategy.SKIP_IF_VALID,
            original_error=original_error,
            error="All fix strategies failed - file restored"
        ))

        return results

    def _is_valid_syntax(self, content: str) -> bool:
        """Check if content has valid Python syntax"""
        try:
            ast.parse(content)
            return True
        except SyntaxError:
            return False

    def _get_syntax_error(self, content: str) -> Optional[str]:
        """Get syntax error message if any"""
        try:
            ast.parse(content)
            return None
        except SyntaxError as e:
            return f"{e.msg} (line {e.lineno})"

    def _read_file(self, filepath: Path) -> str:
        """Read file content"""
        with open(filepath, 'r', encoding='utf-8') as f:
            return f.read()

    def _write_file(self, filepath: Path, content: str):
        """Write file content"""
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)

    def _fix_split_imports(self, content: str, error: Optional[str]) -> tuple[str, bool]:
        """
        Fix split import parentheses

        Pattern: import ()\n  items\n() → import (\n  items\n)

        This was the primary corruption from MECE Bracket Harmonizer
        """
        # Pattern validated from Wave 10 successes
        pattern = r'import \(\)\s+([^\)]+?)\s+\(\s*\)'

        if not re.search(pattern, content):
            return content, False

        # Fix: Restore parenthesis structure
        fixed = re.sub(
            pattern,
            r'import (\n    \1\n)',
            content
        )

        return fixed, True

    def _fix_unterminated_docstring(self, content: str, error: Optional[str]) -> tuple[str, bool]:
        """
        Fix unterminated docstrings

        Pattern: Missing opening triple-quotes
        """
        if not error or 'triple-quoted' not in error.lower():
            return content, False

        lines = content.split('\n')

        # Find lines with only closing triple-quotes
        for i, line in enumerate(lines):
            stripped = line.strip()
            if stripped == '"""' or stripped == "'''":
                # Check if previous line looks like start of docstring
                if i > 0:
                    prev = lines[i-1].strip()
                    if prev and not prev.startswith(('"""', "'''")):
                        # Add opening triple-quotes before docstring text
                        quote = stripped
                        lines.insert(i, ' ' * (len(line) - len(line.lstrip())) + quote)
                        break

        fixed = '\n'.join(lines)
        return fixed, fixed != content

    def _fix_bracket_mismatch(self, content: str, error: Optional[str]) -> tuple[str, bool]:
        """
        Fix bracket mismatches

        Pattern: )] doesn't match opening [{
        """
        if not error or 'does not match' not in error.lower():
            return content, False

        # Extract line number from error
        match = re.search(r'line (\d+)', error)
        if not match:
            return content, False

        line_no = int(match.group(1))
        lines = content.split('\n')

        if line_no <= 0 or line_no > len(lines):
            return content, False

        # Get the problematic line
        line = lines[line_no - 1]

        # Simple heuristic: Replace first closing bracket with correct match
        # This is conservative - only fixes obvious cases

        if ')}' in line or ')]' in line or '}]' in line:
            # Replace with matching brackets
            line = line.replace(')}', '))')
            line = line.replace(')]', '))')
            line = line.replace('}]', '})')

            lines[line_no - 1] = line
            fixed = '\n'.join(lines)
            return fixed, True

        return content, False

    def _fix_indentation(self, content: str, error: Optional[str]) -> tuple[str, bool]:
        """
        Fix unexpected indentation

        Pattern: unexpected indent
        """
        if not error or 'indent' not in error.lower():
            return content, False

        # Extract line number
        match = re.search(r'line (\d+)', error)
        if not match:
            return content, False

        line_no = int(match.group(1))
        lines = content.split('\n')

        if line_no <= 0 or line_no > len(lines):
            return content, False

        # Remove leading whitespace from problematic line
        # This is conservative - only dedents, never indents more
        line = lines[line_no - 1]
        stripped = line.lstrip()

        if stripped:
            # Dedent by 4 spaces (or to column 0)
            current_indent = len(line) - len(stripped)
            new_indent = max(0, current_indent - 4)
            lines[line_no - 1] = ' ' * new_indent + stripped

            fixed = '\n'.join(lines)
            return fixed, True

        return content, False

    def _fix_missing_colon(self, content: str, error: Optional[str]) -> tuple[str, bool]:
        """
        Fix missing colons

        Pattern: expected ':'
        """
        if not error or ':' not in error:
            return content, False

        # Extract line number
        match = re.search(r'line (\d+)', error)
        if not match:
            return content, False

        line_no = int(match.group(1))
        lines = content.split('\n')

        if line_no <= 0 or line_no > len(lines):
            return content, False

        line = lines[line_no - 1].rstrip()

        # Check if line should end with colon
        keywords = ['def ', 'class ', 'if ', 'elif ', 'else', 'for ', 'while ', 'try', 'except', 'finally', 'with ']

        for keyword in keywords:
            if keyword in line and not line.endswith(':'):
                lines[line_no - 1] = line + ':'
                fixed = '\n'.join(lines)
                return fixed, True

        return content, False

    def get_summary(self) -> Dict[str, Any]:
        """Get summary of fixes applied"""
        return {
            "fixes_applied": self.fixes_applied,
            "files_skipped": self.files_skipped,
            "files_failed": self.files_failed,
            "total_processed": self.fixes_applied + self.files_skipped + self.files_failed
        }


def main():
    """CLI for AST syntax fixer"""
    import argparse
    import sys

    parser = argparse.ArgumentParser(description="AST-Based Syntax Fixer")
    parser.add_argument("filepath", help="File to fix")
    parser.add_argument("--protected", default=".fixes/archaeology/.fixignore",
                       help="Path to .fixignore file")
    parser.add_argument("--verbose", action="store_true",
                       help="Verbose output")

    args = parser.parse_args()

    # Load protected files
    protected = []
    if Path(args.protected).exists():
        with open(args.protected) as f:
            protected = [line.strip() for line in f if line.strip() and not line.startswith('#')]

    # Create fixer
    fixer = ASTSyntaxFixer(protected)

    # Fix file
    filepath = Path(args.filepath)
    results = fixer.fix_file(filepath)

    # Print results
    if args.verbose:
        print(f"\nFix Results: {filepath}")
        print("=" * 60)
        for result in results:
            print(result)
        print("=" * 60)

    # Exit with status
    success = any(r.success and r.fixed for r in results)
    skipped = any(r.skipped for r in results)

    if success:
        print(f"[FIXED] {filepath}")
        sys.exit(0)
    elif skipped:
        print(f"[SKIP] {filepath} (already valid or protected)")
        sys.exit(0)
    else:
        print(f"[FAIL] {filepath}")
        sys.exit(1)


if __name__ == "__main__":
    main()
