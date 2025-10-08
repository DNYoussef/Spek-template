#!/usr/bin/env python3
"""
Verify Re-Export Paths
Checks that all re-export files in src/types/ point to existing source files
"""

import os
import re
from pathlib import Path

def extract_export_path(file_content):
    """Extract the export path from re-export file"""
    patterns = [
        r"export \* from ['\"]([^'\"]+)['\"]",
        r"export type \{[^}]+\} from ['\"]([^'\"]+)['\"]"
    ]

    for pattern in patterns:
        match = re.search(pattern, file_content)
        if match:
            return match.group(1)

    return None

def resolve_path(base_file, relative_path):
    """Resolve relative import path to absolute file path"""
    base_dir = Path(base_file).parent
    resolved = (base_dir / relative_path).resolve()

    # Try with .ts extension
    if not resolved.exists() and not str(resolved).endswith('.ts'):
        resolved = Path(str(resolved) + '.ts')

    return resolved

def verify_re_exports():
    """Verify all re-export files"""
    src_types = Path('src/types')
    results = []

    # Find all re-export candidates
    re_export_files = [
        'AnalysisTypes.ts',
        'MessageRouterTypes.ts',
        'QueenTypes.ts',
        'QueenFSMTypes.ts',
        'FSMTypes.ts',
        'BroadcasterTypes.ts',
        'ValidationFSMTypes.ts',
        'MigrationFSMTypes.ts',
        'CacheFSMTypes.ts',
        'ReadinessTypes.ts',
        'DashboardTypes.ts',
        'TestingTypes.ts',
        'IntegrationFSMTypes.ts',
        'DSPyTypes.ts'
    ]

    print("=" * 80)
    print("RE-EXPORT PATH VERIFICATION")
    print("=" * 80)
    print()

    for filename in re_export_files:
        file_path = src_types / filename

        if not file_path.exists():
            results.append({
                'file': filename,
                'status': 'NOT_FOUND',
                'message': 'Re-export file does not exist'
            })
            print(f"[X] {filename}: NOT FOUND")
            continue

        # Read the file
        content = file_path.read_text(encoding='utf-8')

        # Extract export path
        export_path = extract_export_path(content)

        if not export_path:
            results.append({
                'file': filename,
                'status': 'NO_EXPORT',
                'message': 'No export statement found'
            })
            print(f"[!] {filename}: NO EXPORT STATEMENT")
            continue

        # Resolve the path
        source_path = resolve_path(file_path, export_path)

        if source_path.exists():
            results.append({
                'file': filename,
                'status': 'OK',
                'export_path': export_path,
                'resolved_path': str(source_path)
            })
            print(f"[OK] {filename}")
            print(f"   -> {export_path}")
            print(f"   [+] Resolves to: {source_path.relative_to(Path.cwd())}")
        else:
            results.append({
                'file': filename,
                'status': 'BROKEN',
                'export_path': export_path,
                'resolved_path': str(source_path),
                'message': 'Source file does not exist'
            })
            print(f"[X] {filename}")
            print(f"   -> {export_path}")
            print(f"   [-] MISSING: {source_path.relative_to(Path.cwd())}")

        print()

    # Summary
    print("=" * 80)
    print("SUMMARY")
    print("=" * 80)

    ok_count = sum(1 for r in results if r['status'] == 'OK')
    broken_count = sum(1 for r in results if r['status'] == 'BROKEN')
    not_found_count = sum(1 for r in results if r['status'] == 'NOT_FOUND')
    no_export_count = sum(1 for r in results if r['status'] == 'NO_EXPORT')

    print(f"Total Files: {len(re_export_files)}")
    print(f"[OK] OK: {ok_count}")
    print(f"[X] Broken: {broken_count}")
    print(f"[X] Not Found: {not_found_count}")
    print(f"[!] No Export: {no_export_count}")
    print()

    if broken_count > 0 or not_found_count > 0 or no_export_count > 0:
        print("NEEDS FIXES:")
        for result in results:
            if result['status'] != 'OK':
                print(f"  - {result['file']}: {result['status']}")
                if 'export_path' in result:
                    print(f"    Path: {result['export_path']}")
        return 1
    else:
        print("SUCCESS: ALL RE-EXPORTS VERIFIED!")
        return 0

if __name__ == '__main__':
    exit(verify_re_exports())
