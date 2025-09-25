#!/usr/bin/env python3
"""
Remove literal newlines and fix indentation in Python files.
This script fixes the common pattern where docstrings have quadruple quotes
and everything after is incorrectly indented.
"""

from pathlib import Path
import os
import re
import sys

import py_compile

def fix_quadruple_quotes(content):
    """Fix quadruple quotes to triple quotes."""
    content = content.replace('""""', '"""')
    content = content.replace("''''", "'''")
    return content

def fix_indentation(content):
    """Fix indentation issues after docstrings."""
    lines = content.split('\n')
    fixed_lines = []
    
    for i, line in enumerate(lines):
        stripped = line.strip()
        
        # Fix imports at wrong indentation level
        if stripped.startswith(('import ', 'from ')) and line.startswith('    '):
            fixed_lines.append(stripped)  # Move to module level
        # Fix classes at wrong indentation
        elif stripped.startswith('class ') and line.startswith('    ') and i > 0:
            # Check if this should be at module level
            prev_line = lines[i-1].strip() if i > 0 else ''
            if prev_line.endswith(('"""', "'''")) or not prev_line:
                fixed_lines.append(stripped)  # Move to module level
            else:
                fixed_lines.append(line)
        else:
            fixed_lines.append(line)
    
    return '\n'.join(fixed_lines)

def fix_file(filepath):
    """Fix a single file."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Apply fixes
        fixed = fix_quadruple_quotes(content)
        fixed = fix_indentation(fixed)
        
        # Only write if changes made
        if fixed != content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(fixed)
            print(f"[FIXED] {filepath}")
            return True
        return False
    except Exception as e:
        print(f"[ERROR] {filepath}: {e}")
        return False

def main():
    """Process all files with syntax errors."""
    error_files = [
        "analyzer/integrations/tool_coordinator.py",
        "analyzer/performance/ci_cd_accelerator.py",
        "analyzer/enterprise/compliance/audit_trail.py",
        "analyzer/enterprise/compliance/core.py",
        "analyzer/enterprise/compliance/integration.py",
        "analyzer/enterprise/compliance/iso27001.py",
        "analyzer/enterprise/compliance/nist_ssdf.py",
        "analyzer/enterprise/compliance/reporting.py",
        "analyzer/enterprise/compliance/soc2.py",
        "analyzer/enterprise/compliance/validate_retention.py",
        "scripts/performance_monitor.py",
        "scripts/unicode_removal_linter.py"
    ]
    
    fixed_count = 0
    for filepath in error_files:
        if os.path.exists(filepath):
            if fix_file(filepath):
                fixed_count += 1
    
    print(f"\nFixed {fixed_count} files")
    return 0

if __name__ == "__main__":
    sys.exit(main())
