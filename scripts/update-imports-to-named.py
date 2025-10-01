#!/usr/bin/env python3
"""
Update Default Imports to Named Imports
Updates import statements to use named imports for converted files
"""

import os
import re
from pathlib import Path
import sys

def get_export_name(file_path):
    """Extract the exported name from a file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Look for: export class Name
        match = re.search(r'export\s+class\s+(\w+)', content)
        if match:
            return match.group(1)

        # Look for: export function name
        match = re.search(r'export\s+function\s+(\w+)', content)
        if match:
            return match.group(1)

        # Look for: export interface Name
        match = re.search(r'export\s+interface\s+(\w+)', content)
        if match:
            return match.group(1)

        # Look for: export const name
        match = re.search(r'export\s+const\s+(\w+)', content)
        if match:
            return match.group(1)

        return None
    except Exception:
        return None

def update_imports_in_file(file_path, export_map):
    """Update imports in a single file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        original = content
        changes = []

        # Find all import statements
        # Pattern: import Name from './path/to/File';
        import_pattern = r"import\s+(\w+)\s+from\s+['\"]([^'\"]+)['\"]"

        def replace_import(match):
            import_name = match.group(1)
            import_path = match.group(2)

            # Resolve the import path to actual file
            if import_path.startswith('.'):
                # Relative import
                current_dir = file_path.parent
                target_path = (current_dir / import_path).resolve()

                # Try with .ts extension
                if not target_path.exists() or target_path.is_dir():
                    if target_path.is_dir():
                        target_path = target_path / 'index.ts'
                    else:
                        target_path = Path(str(target_path) + '.ts')

                # Check if this file was converted and has named export
                if target_path.exists() and str(target_path) in export_map:
                    export_name = export_map[str(target_path)]

                    # Only update if import name matches export name
                    if import_name == export_name:
                        changes.append(f"{import_path} -> {export_name}")
                        return f"import {{ {export_name} }} from '{import_path}'"

            # No change needed
            return match.group(0)

        content = re.sub(import_pattern, replace_import, content)

        if content != original:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)

            return {
                'status': 'updated',
                'file': str(file_path),
                'changes': changes
            }
        else:
            return {
                'status': 'no_change',
                'file': str(file_path)
            }

    except Exception as e:
        return {
            'status': 'error',
            'file': str(file_path),
            'error': str(e)
        }

def build_export_map():
    """Build a map of file paths to their exported names"""
    src_dir = Path('src')
    export_map = {}

    print("Building export map...")

    for file_path in src_dir.rglob('*.ts'):
        if 'node_modules' in str(file_path):
            continue

        export_name = get_export_name(file_path)
        if export_name:
            export_map[str(file_path.resolve())] = export_name

    print(f"Found {len(export_map)} files with named exports")
    print()
    return export_map

def update_all_imports():
    """Update imports in all TypeScript files"""
    src_dir = Path('src')

    # Build map of files to their export names
    export_map = build_export_map()

    results = {
        'updated': [],
        'no_change': [],
        'errors': []
    }

    print("Updating imports...")
    print()

    file_count = 0
    for file_path in src_dir.rglob('*.ts'):
        if 'node_modules' in str(file_path):
            continue

        file_count += 1
        result = update_imports_in_file(file_path, export_map)

        if result['status'] == 'updated':
            results['updated'].append(result)
            print(f"[OK] {result['file']}")
            for change in result['changes']:
                print(f"     {change}")
        elif result['status'] == 'error':
            results['errors'].append(result)
            print(f"[ERROR] {result['file']}: {result['error']}")

    print()
    print("=" * 80)
    print("IMPORT UPDATE SUMMARY")
    print("=" * 80)
    print(f"Total files scanned: {file_count}")
    print(f"Files updated: {len(results['updated'])}")
    print(f"No changes: {file_count - len(results['updated']) - len(results['errors'])}")
    print(f"Errors: {len(results['errors'])}")

    return results

def main():
    results = update_all_imports()
    return 0 if len(results['errors']) == 0 else 1

if __name__ == '__main__':
    sys.exit(main())
