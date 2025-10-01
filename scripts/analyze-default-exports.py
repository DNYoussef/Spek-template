#!/usr/bin/env python3
"""
Analyze Default Exports
Identifies all default exports and their usage patterns
"""

import os
import re
from pathlib import Path
from collections import defaultdict

def extract_default_export(file_path, content):
    """Extract default export information from file"""
    patterns = [
        # export default class ClassName
        (r'export\s+default\s+class\s+(\w+)', 'class'),
        # export default function functionName
        (r'export\s+default\s+function\s+(\w+)', 'function'),
        # export default interface InterfaceName
        (r'export\s+default\s+interface\s+(\w+)', 'interface'),
        # export default const varName
        (r'export\s+default\s+const\s+(\w+)', 'const'),
        # export default varName (at end)
        (r'export\s+default\s+(\w+)\s*;?\s*$', 'identifier'),
        # export { something as default }
        (r'export\s*\{[^}]*as\s+default\s*\}', 'named_as_default'),
    ]

    for pattern, export_type in patterns:
        matches = re.finditer(pattern, content, re.MULTILINE)
        for match in matches:
            if export_type == 'named_as_default':
                return {
                    'type': export_type,
                    'name': 'unknown',
                    'line': content[:match.start()].count('\n') + 1
                }
            else:
                return {
                    'type': export_type,
                    'name': match.group(1),
                    'line': content[:match.start()].count('\n') + 1
                }

    # Fallback for any other default export
    if 'export default' in content:
        return {
            'type': 'anonymous',
            'name': 'default',
            'line': content.find('export default')
        }

    return None

def find_imports_of_default(file_path, default_name):
    """Find files that import this default export"""
    importers = []
    module_path = str(file_path.relative_to('src')).replace('\\', '/').replace('.ts', '')

    for ts_file in Path('src').rglob('*.ts'):
        try:
            content = ts_file.read_text(encoding='utf-8')

            # Patterns for importing default
            patterns = [
                rf'import\s+(\w+)\s+from\s+[\'"][^\'"]*{re.escape(module_path)}[\'"]',
                rf'import\s+(\w+)\s+from\s+[\'"][^\'"]*{re.escape(Path(file_path).stem)}[\'"]',
            ]

            for pattern in patterns:
                matches = re.finditer(pattern, content)
                for match in matches:
                    importers.append({
                        'file': str(ts_file),
                        'imported_as': match.group(1),
                        'line': content[:match.start()].count('\n') + 1
                    })

        except Exception as e:
            continue

    return importers

def analyze_default_exports():
    """Analyze all default exports in the codebase"""
    src_dir = Path('src')
    results = {
        'files_with_defaults': [],
        'summary': defaultdict(int),
        'by_type': defaultdict(list)
    }

    print("=" * 80)
    print("DEFAULT EXPORT ANALYSIS")
    print("=" * 80)
    print()

    for ts_file in src_dir.rglob('*.ts'):
        try:
            content = ts_file.read_text(encoding='utf-8')

            if 'export default' not in content:
                continue

            export_info = extract_default_export(ts_file, content)

            if export_info:
                file_info = {
                    'file': str(ts_file.relative_to(src_dir)),
                    'export_type': export_info['type'],
                    'export_name': export_info['name'],
                    'line': export_info['line']
                }

                results['files_with_defaults'].append(file_info)
                results['summary'][export_info['type']] += 1
                results['by_type'][export_info['type']].append(file_info)

                print(f"[{export_info['type'].upper()}] {file_info['file']}")
                print(f"  Name: {export_info['name']}")
                print(f"  Line: {export_info['line']}")
                print()

        except Exception as e:
            print(f"[ERROR] {ts_file}: {e}")

    # Summary
    print("=" * 80)
    print("SUMMARY")
    print("=" * 80)
    print(f"Total files with default exports: {len(results['files_with_defaults'])}")
    print()
    print("By Type:")
    for export_type, count in sorted(results['summary'].items(), key=lambda x: -x[1]):
        print(f"  {export_type}: {count}")

    # High-priority conversions (facades, engines, managers)
    print()
    print("=" * 80)
    print("HIGH PRIORITY CONVERSIONS")
    print("=" * 80)

    priority_patterns = ['Facade', 'Engine', 'Manager', 'Orchestrator', 'Coordinator']
    high_priority = []

    for file_info in results['files_with_defaults']:
        for pattern in priority_patterns:
            if pattern in file_info['file'] or pattern in file_info['export_name']:
                high_priority.append(file_info)
                break

    print(f"Found {len(high_priority)} high-priority files:")
    for info in high_priority[:20]:  # Show first 20
        print(f"  - {info['file']} ({info['export_name']})")

    # Generate conversion report
    report_path = Path('.claude/.artifacts/default-export-analysis.json')
    report_path.parent.mkdir(parents=True, exist_ok=True)

    import json
    with open(report_path, 'w') as f:
        json.dump({
            'total_files': len(results['files_with_defaults']),
            'by_type': dict(results['summary']),
            'files': results['files_with_defaults'][:50],  # First 50
            'high_priority': high_priority
        }, f, indent=2)

    print()
    print(f"Full analysis saved to: {report_path}")

    return len(results['files_with_defaults'])

if __name__ == '__main__':
    count = analyze_default_exports()
    exit(0 if count > 0 else 1)
