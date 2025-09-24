#!/usr/bin/env python3
"""
Comprehensive syntax error fixer for the entire codebase.
Fixes f-string errors, indentation issues, and parenthesis mismatches.
"""

import re
import sys
from pathlib import Path
import ast

def fix_fstring_errors(content):
    """Fix f-string parenthesis mismatches."""
    fixes = 0

    # Pattern 1: f"{var)" -> f"{var}"
    pattern1 = r'f"([^"]*\{[^}]+):([^"]*)"'
    if re.search(pattern1, content):
        content = re.sub(pattern1, r'f"\1}\2"', content)
        fixes += 1

    # Pattern 2: f"{var)}" -> f"{var}"
    pattern2 = r'f"([^"]*\{[^}]+)\)([^"]*)"'
    if re.search(pattern2, content):
        content = re.sub(pattern2, r'f"\1}\2"', content)
        fixes += 1

    # Pattern 3: Unmatched ) in f-strings
    lines = content.split('\n')
    for i, line in enumerate(lines):
        if 'f"' in line or "f'" in line:
            # Count braces and parens in f-string
            if line.count('{') != line.count('}'):
                # Try to fix by replacing ) with }
                if '):' in line and line.count(')') > line.count('('):
                    lines[i] = line.replace('):', '}:')
                    fixes += 1

    return '\n'.join(lines), fixes

def fix_indentation_errors(content):
    """Fix unexpected indentation errors."""
    fixes = 0
    lines = content.split('\n')
    fixed_lines = []

    for i, line in enumerate(lines):
        # Check if line has unexpected indent
        if line.strip() and i > 0:
            prev_line = lines[i-1].strip()

            # If previous line doesn't end with : and current line is indented more than expected
            if not prev_line.endswith(':') and not prev_line.endswith('\\'):
                # Check indentation
                current_indent = len(line) - len(line.lstrip())
                if i > 0:
                    prev_indent = len(lines[i-1]) - len(lines[i-1].lstrip())

                    # If indent jumped more than 4 spaces without a colon, reduce it
                    if current_indent > prev_indent + 4 and not prev_line.endswith((',', '(')):
                        # Reduce indent to match previous + 4
                        fixed_line = ' ' * (prev_indent) + line.lstrip()
                        fixed_lines.append(fixed_line)
                        fixes += 1
                        continue

        fixed_lines.append(line)

    return '\n'.join(fixed_lines), fixes

def fix_parenthesis_mismatch(content):
    """Fix parenthesis/brace mismatches."""
    fixes = 0
    lines = content.split('\n')

    for i, line in enumerate(lines):
        # Check for {  with closing )
        if '{' in line and ')' in line:
            open_brace = line.count('{')
            close_paren = line.count(')')
            open_paren = line.count('(')
            close_brace = line.count('}')

            # If we have { but closing with )
            if open_brace > close_brace and close_paren > open_paren:
                # Replace the mismatched ) with }
                # Find the last ) that should be }
                lines[i] = line[::-1].replace(')', '}', open_brace - close_brace)[::-1]
                fixes += 1

    return '\n'.join(lines), fixes

def can_parse(content):
    """Check if Python code can be parsed."""
    try:
        ast.parse(content)
        return True, None
    except SyntaxError as e:
        return False, str(e)

def fix_file(filepath):
    """Fix syntax errors in a single file."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            original_content = f.read()

        content = original_content
        total_fixes = 0

        # Apply fixes
        content, fixes1 = fix_fstring_errors(content)
        total_fixes += fixes1

        content, fixes2 = fix_indentation_errors(content)
        total_fixes += fixes2

        content, fixes3 = fix_parenthesis_mismatch(content)
        total_fixes += fixes3

        # Only write if we made changes
        if content != original_content:
            # Verify it parses before writing
            can_parse_result, error = can_parse(content)

            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)

            return total_fixes, can_parse_result

        return 0, True

    except Exception as e:
        print(f"Error processing {filepath}: {e}")
        return 0, False

def main():
    """Fix all Python files with syntax errors."""

    # Files known to have syntax errors (from analyzer output)
    error_files = [
        "scripts/performance_monitor.py",
        "src/intelligence/neural_networks/rl/strategy_optimizer.py",
        "src/intelligence/neural_networks/rl/trading_environment.py",
        "tests/workflow-validation/comprehensive_validation_report.py",
        "analyzer/integrations/tool_coordinator.py",
        ".claude/performance/baselines/baseline_collector.py",
        "src/intelligence/neural_networks/lstm/lstm_predictor.py",
        "src/intelligence/neural_networks/transformer/financial_bert.py",
        "src/intelligence/neural_networks/transformer/sentiment_analyzer.py",
        ".claude/.artifacts/dfars_compliance_framework.py",
        "analyzer/enterprise/compliance/core.py",
        "analyzer/enterprise/compliance/integration.py",
        "analyzer/enterprise/compliance/iso27001.py",
        "analyzer/enterprise/compliance/nist_ssdf.py",
        "analyzer/enterprise/compliance/reporting.py",
        "analyzer/enterprise/compliance/soc2.py",
        "analyzer/enterprise/compliance/validate_retention.py",
        "analyzer/enterprise/performance/MLCacheOptimizer.py",
        "src/cycles/profit_calculator.py",
        "src/cycles/scheduler.py",
        "src/cycles/weekly_cycle.py",
        "src/cycles/weekly_siphon_automator.py"
    ]

    print("Comprehensive Syntax Error Fixer")
    print("=" * 60)

    fixed_files = []
    parse_errors = []

    for filepath in error_files:
        path = Path(filepath)
        if not path.exists():
            print(f"SKIP: {filepath} (not found)")
            continue

        fixes, can_parse_result = fix_file(path)

        if fixes > 0:
            status = "FIXED" if can_parse_result else "FIXED (parse check failed)"
            print(f"{status}: {filepath} ({fixes} fixes)")
            fixed_files.append((filepath, fixes))

            if not can_parse_result:
                parse_errors.append(filepath)

    print("\n" + "=" * 60)
    print(f"Total files fixed: {len(fixed_files)}")
    print(f"Total fixes applied: {sum(f[1] for f in fixed_files)}")

    if parse_errors:
        print(f"\nWARNING: Files with parse errors after fix: {len(parse_errors)}")
        for f in parse_errors:
            print(f"  - {f}")

    return 0 if not parse_errors else 1

if __name__ == '__main__':
    sys.exit(main())