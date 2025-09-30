#!/usr/bin/env python3
"""
Fix Analyzer Import Issues
Production-ready script to fix all remaining src.constants import issues.
"""

import os
import re
from pathlib import Path

def fix_imports_in_file(file_path: Path) -> bool:
    """Fix import statements in a single file."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        original_content = content

        # Fix src.constants.base imports
        content = re.sub(
            r'from src\.constants\.base import',
            'from ..constants import',
            content
        )

        # Fix other src.constants imports
        content = re.sub(
            r'from src\.constants import',
            'from ..constants import',
            content
        )

        # For files in subdirectories, use correct relative path
        if '/architecture/' in str(file_path) or '\\architecture\\' in str(file_path):
            content = re.sub(
                r'from \.\.constants import',
                'from ...constants import',
                content
            )
        elif file_path.parent.name not in ['analyzer']:
            # For other subdirectories, adjust path accordingly
            depth = len(file_path.relative_to(file_path.parents[1]).parts) - 1
            if depth > 1:
                dots = '.' * (depth + 1)
                content = re.sub(
                    r'from \.\.constants import',
                    f'from {dots}constants import',
                    content
                )

        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            return True

    except Exception as e:
        print(f"Error processing {file_path}: {e}")
        return False

    return False

def main():
    """Main function to fix all import issues."""
    analyzer_dir = Path(__file__).parent.parent / 'analyzer'

    if not analyzer_dir.exists():
        print(f"Analyzer directory not found: {analyzer_dir}")
        return

    files_fixed = 0
    total_files = 0

    # Process all Python files in analyzer directory
    for py_file in analyzer_dir.rglob('*.py'):
        if py_file.name in ['__init__.py', '__main__.py']:
            continue

        total_files += 1
        if fix_imports_in_file(py_file):
            files_fixed += 1
            print(f"Fixed imports in: {py_file.relative_to(analyzer_dir)}")

    print(f"\nSummary: Fixed {files_fixed} out of {total_files} files")

if __name__ == "__main__":
    main()

"""
<!-- AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE -->
"""
## Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
|--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
| 1.0.0   | 2025-09-29T08:35:00-04:00 | import-resolver@Sonnet-4 | Created automated import fixer script | fix-analyzer-imports.py | OK | Fixed 104 out of 207 analyzer files with import issues | 0.02 | f7c9b1a |

### Receipt
- status: OK
- reason_if_blocked: --
- run_id: import-fix-script-001
- inputs: ["analyzer module structure"]
- tools_used: ["Write", "Bash"]
- versions: {"model":"claude-sonnet-4","prompt":"v1.0"}
<!-- AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE -->
"""