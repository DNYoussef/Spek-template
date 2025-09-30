#!/usr/bin/env python3
"""
Linter Integration Test Fixer - Systematic Syntax Error Resolution
Applies 4 specialists: Docstring -> Bracket -> Indent -> Validate
"""

import re
import ast
from pathlib import Path
from typing import List, Dict, Any
import json
from datetime import datetime

class DocstringSurgeon:
    """Fix unterminated triple-quoted strings"""

    def fix_file(self, content: str, file_path: str) -> tuple[str, bool]:
        """Fix docstring issues"""
        lines = content.split('\n')
        fixed_lines = []
        fixed = False

        # Check for missing opening triple quotes
        for i, line in enumerate(lines):
            stripped = line.strip()

            # Pattern: Line ends with """ but no opening (in first 20 lines)
            if i < 20 and stripped.endswith('"""') and not stripped.startswith('"""'):
                if '"""' not in stripped[:-3]:
                    # Add opening triple quotes at start
                    indent = len(line) - len(line.lstrip())
                    fixed_lines.append(' ' * indent + '"""')
                    fixed_lines.append(line)
                    fixed = True
                    continue

            fixed_lines.append(line)

        return '\n'.join(fixed_lines), fixed

class BracketHarmonizer:
    """Fix mismatched brackets and parentheses"""

    def fix_file(self, content: str, file_path: str) -> tuple[str, bool]:
        """Fix bracket issues"""
        fixed = False

        # Pattern 1: {) instead of {}
        if '{)' in content:
            content = content.replace('{)', '{}')
            fixed = True

        # Pattern 2: () split across lines in specific contexts
        # Example: return LinterConfig() \n args \n ( )
        pattern = r'(\w+\([^)]*)\(\s*\)'
        matches = re.finditer(pattern, content, re.MULTILINE)
        for match in matches:
            # Replace trailing () with proper closing
            content = content.replace(match.group(0), match.group(1) + ')')
            fixed = True

        # Pattern 3: Fix specific broken imports
        # from models.linter_models import () \n items \n ()
        if 'from models.linter_models import ()' in content:
            # Find the complete import block
            pattern = r'from models\.linter_models import \(\)(.*?)\(\)'
            match = re.search(pattern, content, re.DOTALL)
            if match:
                import_items = match.group(1).strip()
                # Clean up items
                items = [item.strip() for item in import_items.split(',') if item.strip()]
                fixed_import = f"from models.linter_models import (\n    {',\n    '.join(items)}\n)"
                content = content.replace(match.group(0), fixed_import)
                fixed = True

        return content, fixed

class IndentationReconstructor:
    """Fix indentation issues after bracket fixes"""

    def fix_file(self, content: str, file_path: str) -> tuple[str, bool]:
        """Fix indentation issues"""
        lines = content.split('\n')
        fixed_lines = []
        fixed = False
        indent_stack = [0]

        for i, line in enumerate(lines):
            stripped = line.strip()
            if not stripped:
                fixed_lines.append('')
                continue

            # Calculate expected indent based on context
            current_indent = len(line) - len(line.lstrip())

            # Check for unexpected indent/unindent
            if stripped.startswith(('def ', 'class ', 'async def ')):
                # Function/class should align with previous indent level
                expected_indent = indent_stack[-1]
                if current_indent != expected_indent:
                    line = ' ' * expected_indent + stripped
                    fixed = True
                indent_stack.append(expected_indent + 4)
            elif stripped.endswith(':'):
                # Block start
                if len(indent_stack) > 0:
                    expected_indent = indent_stack[-1]
                    if current_indent != expected_indent:
                        line = ' ' * expected_indent + stripped
                        fixed = True
                    indent_stack.append(expected_indent + 4)
            elif i > 0 and lines[i-1].strip().endswith(':'):
                # After block start, indent by 4
                expected_indent = indent_stack[-1]
                if current_indent < expected_indent:
                    line = ' ' * expected_indent + stripped
                    fixed = True

            fixed_lines.append(line)

        return '\n'.join(fixed_lines), fixed

class SyntaxValidator:
    """Validate Python syntax using ast.parse()"""

    def validate_file(self, content: str, file_path: str) -> Dict[str, Any]:
        """Validate and fix remaining syntax errors"""
        try:
            ast.parse(content)
            return {"valid": True, "file": file_path}
        except SyntaxError as e:
            return {
                "valid": False,
                "file": file_path,
                "error": str(e),
                "line": e.lineno,
                "offset": e.offset,
                "text": e.text
            }

class LinterTestFixer:
    """Main orchestrator for systematic fixing"""

    def __init__(self, test_dir: Path):
        self.test_dir = test_dir
        self.fixes_dir = Path('.fixes/linter')
        self.fixes_dir.mkdir(parents=True, exist_ok=True)

        self.docstring_surgeon = DocstringSurgeon()
        self.bracket_harmonizer = BracketHarmonizer()
        self.indent_reconstructor = IndentationReconstructor()
        self.syntax_validator = SyntaxValidator()

    def apply_specialist(self, specialist_name: str, specialist_func, files: List[Path]) -> Dict[str, Any]:
        """Apply specialist systematically"""
        results = {
            "stage": specialist_name,
            "files_fixed": 0,
            "files_remaining": 0,
            "timestamp": datetime.utcnow().isoformat(),
            "fixes": []
        }

        for file_path in files:
            content = file_path.read_text(encoding='utf-8', errors='ignore')
            fixed_content, was_fixed = specialist_func(content, str(file_path))

            if was_fixed:
                file_path.write_text(fixed_content, encoding='utf-8')
                results["files_fixed"] += 1
                results["fixes"].append(str(file_path))

        # Validate remaining errors
        for file_path in files:
            content = file_path.read_text(encoding='utf-8', errors='ignore')
            validation = self.syntax_validator.validate_file(content, str(file_path))
            if not validation["valid"]:
                results["files_remaining"] += 1

        return results

    def run_sequential_specialists(self) -> None:
        """Run all 4 specialists sequentially"""
        test_files = list(self.test_dir.glob('*.py'))
        print(f"Found {len(test_files)} Python test files")

        # Specialist 1: Docstring Surgeon
        print("\n[1/4] Running Docstring Surgeon...")
        docstring_result = self.apply_specialist(
            "docstring",
            self.docstring_surgeon.fix_file,
            test_files
        )
        completion_file = self.fixes_dir / 'docstring-complete.json'
        completion_file.write_text(json.dumps(docstring_result, indent=2))
        print(f"  Fixed: {docstring_result['files_fixed']}, Remaining: {docstring_result['files_remaining']}")

        # Specialist 2: Bracket Harmonizer
        print("\n[2/4] Running Bracket Harmonizer...")
        bracket_result = self.apply_specialist(
            "bracket",
            self.bracket_harmonizer.fix_file,
            test_files
        )
        completion_file = self.fixes_dir / 'bracket-complete.json'
        completion_file.write_text(json.dumps(bracket_result, indent=2))
        print(f"  Fixed: {bracket_result['files_fixed']}, Remaining: {bracket_result['files_remaining']}")

        # Specialist 3: Indentation Reconstructor
        print("\n[3/4] Running Indentation Reconstructor...")
        indent_result = self.apply_specialist(
            "indent",
            self.indent_reconstructor.fix_file,
            test_files
        )
        completion_file = self.fixes_dir / 'indent-complete.json'
        completion_file.write_text(json.dumps(indent_result, indent=2))
        print(f"  Fixed: {indent_result['files_fixed']}, Remaining: {indent_result['files_remaining']}")

        # Specialist 4: Syntax Validator
        print("\n[4/4] Running Syntax Validator...")
        validation_results = []
        success_count = 0

        for file_path in test_files:
            content = file_path.read_text(encoding='utf-8', errors='ignore')
            validation = self.syntax_validator.validate_file(content, str(file_path))
            validation_results.append(validation)
            if validation["valid"]:
                success_count += 1

        validate_result = {
            "stage": "validate",
            "files_fixed": success_count,
            "files_remaining": len(test_files) - success_count,
            "timestamp": datetime.utcnow().isoformat(),
            "validations": validation_results
        }

        completion_file = self.fixes_dir / 'validate-complete.json'
        completion_file.write_text(json.dumps(validate_result, indent=2))
        print(f"  Success: {success_count}/{len(test_files)}")
        print(f"  Failures: {len(test_files) - success_count}")

        # Summary report
        print("\n" + "="*60)
        print("SYSTEMATIC FIXING COMPLETE")
        print("="*60)
        print(f"Docstring fixes: {docstring_result['files_fixed']}")
        print(f"Bracket fixes: {bracket_result['files_fixed']}")
        print(f"Indentation fixes: {indent_result['files_fixed']}")
        print(f"Final success rate: {success_count}/{len(test_files)} ({success_count/len(test_files)*100:.1f}%)")
        print(f"\nCompletion files written to: {self.fixes_dir}")

if __name__ == '__main__':
    import sys
    test_dir = Path(__file__).parent.parent / 'tests' / 'linter_integration'
    fixer = LinterTestFixer(test_dir)
    fixer.run_sequential_specialists()
