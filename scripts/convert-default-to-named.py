#!/usr/bin/env python3
"""
Convert Default Exports to Named Exports
Converts default exports while maintaining backward compatibility
"""

import os
import re
from pathlib import Path
import sys

def convert_file(file_path, dry_run=False):
    """Convert default export to named export in a single file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        original = content
        converted = False
        export_name = None

        # Pattern 1: export default class ClassName
        match = re.search(r'export\s+default\s+class\s+(\w+)', content)
        if match:
            export_name = match.group(1)
            content = re.sub(
                r'export\s+default\s+class\s+(\w+)',
                r'export class \1',
                content
            )
            converted = True

        # Pattern 2: export default function functionName
        if not converted:
            match = re.search(r'export\s+default\s+function\s+(\w+)', content)
            if match:
                export_name = match.group(1)
                content = re.sub(
                    r'export\s+default\s+function\s+(\w+)',
                    r'export function \1',
                    content
                )
                converted = True

        # Pattern 3: export default interface InterfaceName
        if not converted:
            match = re.search(r'export\s+default\s+interface\s+(\w+)', content)
            if match:
                export_name = match.group(1)
                content = re.sub(
                    r'export\s+default\s+interface\s+(\w+)',
                    r'export interface \1',
                    content
                )
                converted = True

        # Pattern 4: export default IdentifierName; (at end of file)
        if not converted:
            match = re.search(r'export\s+default\s+(\w+)\s*;?\s*(?:\n|$)', content)
            if match:
                export_name = match.group(1)
                # Find the class/const/interface definition
                class_match = re.search(rf'class\s+{export_name}\s+', content)
                const_match = re.search(rf'const\s+{export_name}\s*=', content)
                interface_match = re.search(rf'interface\s+{export_name}\s+', content)

                if class_match:
                    # Change 'class Name' to 'export class Name'
                    content = re.sub(
                        rf'class\s+{export_name}\s+',
                        f'export class {export_name} ',
                        content,
                        count=1
                    )
                    converted = True
                elif const_match:
                    # Change 'const Name' to 'export const Name'
                    content = re.sub(
                        rf'const\s+{export_name}\s*=',
                        f'export const {export_name} =',
                        content,
                        count=1
                    )
                    converted = True
                elif interface_match:
                    # Change 'interface Name' to 'export interface Name'
                    content = re.sub(
                        rf'interface\s+{export_name}\s+',
                        f'export interface {export_name} ',
                        content,
                        count=1
                    )
                    converted = True

        if converted and export_name:
            # Remove the old 'export default Name;' line
            content = re.sub(
                rf'export\s+default\s+{export_name}\s*;?\s*\n?',
                '',
                content
            )

            # Add backward compatibility export at the end (before footer if exists)
            footer_match = re.search(r'/\*\*\s*\n\s*\*\s*AGENT FOOTER', content)
            if footer_match:
                # Insert before footer
                insert_pos = footer_match.start()
                content = (
                    content[:insert_pos] +
                    f'\n// Backward compatibility\nexport default {export_name};\n\n' +
                    content[insert_pos:]
                )
            else:
                # Append at end
                content = content.rstrip() + f'\n\n// Backward compatibility\nexport default {export_name};\n'

        if content != original:
            if not dry_run:
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(content)

            return {
                'status': 'converted',
                'export_name': export_name,
                'file': str(file_path)
            }
        else:
            return {
                'status': 'no_change',
                'file': str(file_path)
            }

    except Exception as e:
        return {
            'status': 'error',
            'error': str(e),
            'file': str(file_path)
        }

def convert_batch(pattern, dry_run=False):
    """Convert a batch of files matching pattern"""
    src_dir = Path('src')
    results = {
        'converted': [],
        'no_change': [],
        'errors': []
    }

    print(f"Searching for files matching: {pattern}")
    print()

    files = list(src_dir.rglob(pattern))
    print(f"Found {len(files)} files")
    print()

    for file_path in files:
        result = convert_file(file_path, dry_run)

        if result['status'] == 'converted':
            results['converted'].append(result)
            print(f"[OK] {result['file']}")
            print(f"     Exported: {result['export_name']}")
        elif result['status'] == 'no_change':
            results['no_change'].append(result)
            print(f"[SKIP] {result['file']}")
        elif result['status'] == 'error':
            results['errors'].append(result)
            print(f"[ERROR] {result['file']}: {result['error']}")

    print()
    print("=" * 80)
    print("BATCH CONVERSION SUMMARY")
    print("=" * 80)
    print(f"Total files: {len(files)}")
    print(f"Converted: {len(results['converted'])}")
    print(f"No change: {len(results['no_change'])}")
    print(f"Errors: {len(results['errors'])}")

    return results

def main():
    import argparse

    parser = argparse.ArgumentParser(description='Convert default exports to named exports')
    parser.add_argument('pattern', help='File pattern to match (e.g., *Facade.ts)')
    parser.add_argument('--dry-run', action='store_true', help='Dry run mode')
    args = parser.parse_args()

    results = convert_batch(args.pattern, args.dry_run)

    if args.dry_run:
        print()
        print("DRY RUN MODE - No files modified")

    return 0 if len(results['errors']) == 0 else 1

if __name__ == '__main__':
    sys.exit(main())
