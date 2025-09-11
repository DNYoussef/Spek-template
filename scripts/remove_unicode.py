#!/usr/bin/env python3
"""
SPEK Unicode Removal Script - Claude Code Compliance Tool
Systematically removes Unicode characters to fix invalid settings files
"""

import os
import json
import re
import sys
import argparse
from pathlib import Path
import unicodedata

# Unicode to ASCII replacement mapping
UNICODE_REPLACEMENTS = {
    # Emojis - Common ones found in SPEK template
    '[TARGET]': '[TARGET]',
    '[ROCKET]': '[ROCKET]',
    '[OK]': '[OK]',
    '[FAIL]': '[FAIL]',
    '[WARN]': '[WARN]',
    '[TOOL]': '[TOOL]',
    '[CHART]': '[CHART]',
    '[SEARCH]': '[SEARCH]',
    '[INFO]': '[INFO]',
    '[NOTE]': '[NOTE]',
    '[SHIELD]': '[SHIELD]',
    '[CYCLE]': '[REFRESH]',
    '[TREND]': '[TREND]',
    '[BRAIN]': '[BRAIN]',
    '[PARTY]': '[PARTY]',
    '[LIGHTNING]': '[LIGHTNING]',
    '[BUILD]': '[BUILD]',
    '[SCIENCE]': '[SCIENCE]',
    '[CLIPBOARD]': '[CLIPBOARD]',
    '[LOCK]': '[LOCK]',
    '[GLOBE]': '[GLOBE]',
    '[COMPUTER]': '[COMPUTER]',
    '[FOLDER]': '[FOLDER]',
    '[CYCLE]': '[CYCLE]',
    
    # Symbols and special characters
    '->': '->',
    '<-': '<-',
    '^': '^',
    'v': 'v',
    '<->': '<->',
    '=>': '=>',
    '<=': '<=',
    '<=>': '<=>',
    '=>': '=>',
    '<=': '<=',
    '<=>': '<=>',
    'for all': 'for all',
    'exists': 'exists',
    'in': 'in',
    'not in': 'not in',
    'intersection': 'intersection',
    'union': 'union',
    'subset': 'subset',
    'superset': 'superset',
    'subset or equal': 'subset or equal',
    'superset or equal': 'superset or equal',
    '<=': '<=',
    '>=': '>=',
    '!=': '!=',
    '~=': '~=',
    'infinity': 'infinity',
    '+/-': '+/-',
    '*': '*',
    '/': '/',
    'sqrt': 'sqrt',
    'sum': 'sum',
    'product': 'product',
    'integral': 'integral',
    'delta': 'delta',
    'nabla': 'nabla',
    'partial': 'partial',
    'empty set': 'empty set',
    
    # Smart quotes and typography
    '"': '"',
    '"': '"',
    '''''''''...': '...',
    '-': '-',
    '--': '--',
    ',': ',',
    '"': '"',
    '<': '<',
    '>': '>',
    '<<': '<<',
    '>>': '>>',
    
    # Currency and other symbols
    'EUR': 'EUR',
    'GBP': 'GBP', 
    'JPY': 'JPY',
    '(c)': '(c)',
    '(r)': '(r)',
    '(tm)': '(tm)',
    'section': 'section',
    'paragraph': 'paragraph',
    'degrees': 'degrees',
    '^2': '^2',
    '^3': '^3',
    '1/4': '1/4',
    '1/2': '1/2',
    '3/4': '3/4',
    
    # Additional problematic Unicode found in codebase
    '\u2013': '-',  # en dash
    '\u2014': '--', # em dash
    '\u2018': "'",  # left single quotation mark
    '\u2019': "'",  # right single quotation mark
    '\u201c': '"',  # left double quotation mark
    '\u201d': '"',  # right double quotation mark
    '\u2026': '...',# horizontal ellipsis
    '\u00a0': ' ',  # non-breaking space
}

def is_ascii_only(text):
    """Check if text contains only ASCII characters"""
    try:
        text.encode('ascii')
        return True
    except UnicodeEncodeError:
        return False

def find_unicode_chars(text):
    """Find all non-ASCII characters in text"""
    unicode_chars = []
    for i, char in enumerate(text):
        if ord(char) > 127:
            unicode_chars.append({
                'char': char,
                'position': i,
                'unicode_name': unicodedata.name(char, 'UNKNOWN'),
                'code_point': f'U+{ord(char):04X}'
            })
    return unicode_chars

def replace_unicode_chars(text):
    """Replace Unicode characters with ASCII equivalents"""
    original_text = text
    
    # Apply known replacements
    for unicode_char, replacement in UNICODE_REPLACEMENTS.items():
        text = text.replace(unicode_char, replacement)
    
    # Handle remaining Unicode characters
    remaining_unicode = find_unicode_chars(text)
    
    for unicode_info in remaining_unicode:
        char = unicode_info['char']
        # Try to find ASCII equivalent using unicodedata
        try:
            normalized = unicodedata.normalize('NFKD', char)
            ascii_equivalent = ''.join(c for c in normalized if ord(c) < 128)
            if ascii_equivalent and ascii_equivalent != char:
                text = text.replace(char, ascii_equivalent)
            else:
                # Fallback: replace with placeholder
                text = text.replace(char, f'[U+{ord(char):04X}]')
        except:
            text = text.replace(char, f'[U+{ord(char):04X}]')
    
    return text, original_text != text

def process_file(file_path, fix_mode=False, report_data=None):
    """Process a single file for Unicode violations"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except UnicodeDecodeError:
        try:
            with open(file_path, 'r', encoding='latin-1') as f:
                content = f.read()
        except:
            print(f"ERROR: Could not read {file_path}")
            return False
    except Exception as e:
        print(f"ERROR: Could not read {file_path}: {e}")
        return False
    
    # Check for Unicode violations
    unicode_chars = find_unicode_chars(content)
    
    if not unicode_chars:
        return True  # No violations
    
    # Record violations
    if report_data is not None:
        report_data['files'].append({
            'file': str(file_path),
            'violations': len(unicode_chars),
            'unicode_chars': [
                {
                    'char': uc['char'],
                    'position': uc['position'],
                    'name': uc['unicode_name'],
                    'code_point': uc['code_point']
                }
                for uc in unicode_chars[:10]  # Limit to first 10 for report
            ]
        })
        report_data['total_violations'] += len(unicode_chars)
        report_data['total_files_with_violations'] += 1
    
    print(f"UNICODE VIOLATIONS in {file_path}: {len(unicode_chars)} characters")
    for uc in unicode_chars[:5]:  # Show first 5
        try:
            print(f"  - '{uc['char']}' ({uc['unicode_name']}) at position {uc['position']}")
        except UnicodeEncodeError:
            print(f"  - [U+{ord(uc['char']):04X}] ({uc['unicode_name']}) at position {uc['position']}")
    
    # Fix if requested
    if fix_mode:
        fixed_content, changed = replace_unicode_chars(content)
        if changed:
            try:
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(fixed_content)
                print(f"FIXED: {file_path}")
                return True
            except Exception as e:
                print(f"ERROR: Could not write {file_path}: {e}")
                return False
        else:
            print(f"NO CHANGES NEEDED: {file_path}")
            return True
    
    return False

def main():
    parser = argparse.ArgumentParser(description='Remove Unicode characters for Claude Code compliance')
    parser.add_argument('path', help='Directory or file to process')
    parser.add_argument('--fix', action='store_true', help='Fix Unicode violations (default: check only)')
    parser.add_argument('--check', action='store_true', help='Check for violations only')
    parser.add_argument('--report-json', help='Save detailed report to JSON file')
    parser.add_argument('--include-node-modules', action='store_true', help='Include node_modules (default: skip)')
    
    args = parser.parse_args()
    
    # Default to check mode
    fix_mode = args.fix
    check_mode = args.check or not args.fix
    
    # Report data structure
    report_data = {
        'total_files_processed': 0,
        'total_files_with_violations': 0,
        'total_violations': 0,
        'files': []
    } if args.report_json else None
    
    path = Path(args.path)
    
    if path.is_file():
        # Single file
        files_to_process = [path]
    else:
        # Directory - find all text files
        patterns = [
            '**/*.json',
            '**/*.md',
            '**/*.js',
            '**/*.ts',
            '**/*.py',
            '**/*.sh',
            '**/*.ps1',
            '**/*.yml',
            '**/*.yaml',
            '**/*.txt',
            '**/*.log'
        ]
        
        files_to_process = []
        for pattern in patterns:
            files_to_process.extend(path.glob(pattern))
        
        # Filter out unwanted directories
        if not args.include_node_modules:
            files_to_process = [f for f in files_to_process if 'node_modules' not in str(f)]
        
        # Filter out other unwanted paths
        unwanted_paths = ['.git', '__pycache__', '.pytest_cache', 'dist', 'build']
        files_to_process = [f for f in files_to_process 
                           if not any(unwanted in str(f) for unwanted in unwanted_paths)]
    
    print(f"Processing {len(files_to_process)} files...")
    
    success_count = 0
    failure_count = 0
    
    for file_path in files_to_process:
        if report_data:
            report_data['total_files_processed'] += 1
        
        if process_file(file_path, fix_mode, report_data):
            success_count += 1
        else:
            failure_count += 1
    
    # Print summary
    print("\n" + "="*50)
    print(f"SUMMARY:")
    print(f"Files processed: {len(files_to_process)}")
    print(f"Files with violations: {failure_count}")
    print(f"Files clean/fixed: {success_count}")
    
    if report_data:
        print(f"Total violations found: {report_data['total_violations']}")
        
        # Save report
        with open(args.report_json, 'w') as f:
            json.dump(report_data, f, indent=2)
        print(f"Detailed report saved to: {args.report_json}")
    
    # Exit with appropriate code
    if check_mode and failure_count > 0:
        print("\nUnicode violations detected! Run with --fix to repair.")
        sys.exit(1)
    elif fix_mode and failure_count == 0:
        print("\nAll Unicode violations have been fixed!")
        sys.exit(0)
    else:
        sys.exit(0)

if __name__ == '__main__':
    main()