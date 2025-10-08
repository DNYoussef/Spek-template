#!/usr/bin/env python3
"""
Fix Missing Exports - Phase 3A
Automatically adds export statements for missing types, classes, and interfaces
Analyzes TypeScript compilation errors and fixes them systematically
"""

import os
import re
import subprocess
from pathlib import Path
from typing import Dict, List, Set, Tuple
import sys

# ============================================================================
# ERROR ANALYSIS
# ============================================================================

def get_missing_exports() -> Dict[str, Set[str]]:
    """
    Run TypeScript compiler and extract TS2305 errors
    Returns: {file_path: {missing_export_names}}
    """
    print("Analyzing TypeScript compilation errors...")

    try:
        # Use shell=True for Windows compatibility
        result = subprocess.run(
            'npx tsc --noEmit',
            capture_output=True,
            text=True,
            timeout=180,
            shell=True
        )

        missing_exports: Dict[str, Set[str]] = {}

        # Parse TS2305 errors
        # Format: file.ts(line,col): error TS2305: Module '"./path"' has no exported member 'Name'.
        pattern = r"error TS2305: Module '\"([^\"]+)\"' has no exported member '([^']+)'"

        output = result.stdout + result.stderr

        for line in output.split('\n'):
            match = re.search(pattern, line)
            if match:
                module_path = match.group(1)
                missing_name = match.group(2)

                # Resolve module path to actual file
                # Handle relative imports
                if module_path.startswith('./') or module_path.startswith('../'):
                    # Get file from error line
                    file_match = re.match(r'^([^(]+)\(', line)
                    if file_match:
                        error_file = Path(file_match.group(1))
                        target_file = (error_file.parent / module_path).resolve()

                        # Try .ts extension
                        if not target_file.exists():
                            target_file = Path(str(target_file) + '.ts')

                        if target_file.exists():
                            file_key = str(target_file)
                            if file_key not in missing_exports:
                                missing_exports[file_key] = set()
                            missing_exports[file_key].add(missing_name)

        print(f"Found {len(missing_exports)} files with missing exports")
        total_missing = sum(len(names) for names in missing_exports.values())
        print(f"Total missing exports: {total_missing}")

        return missing_exports

    except subprocess.TimeoutExpired:
        print("[ERROR] TypeScript compilation timed out")
        return {}
    except Exception as e:
        print(f"[ERROR] Failed to analyze errors: {e}")
        return {}

# ============================================================================
# CODE ANALYSIS
# ============================================================================

def find_declarations_in_file(file_path: Path) -> Dict[str, str]:
    """
    Find all class, interface, type, enum, const declarations in file
    Returns: {name: declaration_type}
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        declarations = {}

        # Find class declarations
        for match in re.finditer(r'(?:^|\n)\s*(?:export\s+)?class\s+(\w+)', content):
            declarations[match.group(1)] = 'class'

        # Find interface declarations
        for match in re.finditer(r'(?:^|\n)\s*(?:export\s+)?interface\s+(\w+)', content):
            declarations[match.group(1)] = 'interface'

        # Find type declarations
        for match in re.finditer(r'(?:^|\n)\s*(?:export\s+)?type\s+(\w+)\s*=', content):
            declarations[match.group(1)] = 'type'

        # Find enum declarations
        for match in re.finditer(r'(?:^|\n)\s*(?:export\s+)?enum\s+(\w+)', content):
            declarations[match.group(1)] = 'enum'

        # Find const declarations (top-level only)
        for match in re.finditer(r'(?:^|\n)(?:export\s+)?const\s+(\w+)\s*[:=]', content):
            declarations[match.group(1)] = 'const'

        return declarations

    except Exception as e:
        print(f"[ERROR] Failed to analyze {file_path}: {e}")
        return {}

def is_already_exported(file_path: Path, name: str) -> bool:
    """Check if name is already exported in file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Check for direct export in declaration
        patterns = [
            rf'export\s+class\s+{name}\b',
            rf'export\s+interface\s+{name}\b',
            rf'export\s+type\s+{name}\b',
            rf'export\s+enum\s+{name}\b',
            rf'export\s+const\s+{name}\b',
            rf'export\s+\{{\s*{name}\s*\}}',
            rf'export\s+\{{\s*\w+\s+as\s+{name}\s*\}}',
        ]

        for pattern in patterns:
            if re.search(pattern, content):
                return True

        return False

    except Exception:
        return False

# ============================================================================
# EXPORT FIXING
# ============================================================================

def add_export_to_file(file_path: Path, names: Set[str]) -> Tuple[int, List[str]]:
    """
    Add export statements for missing names
    Returns: (count_added, [export_statements])
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        original = content
        declarations = find_declarations_in_file(file_path)
        added = []
        exports_to_add = []

        for name in names:
            # Skip if already exported
            if is_already_exported(file_path, name):
                continue

            # Check if declaration exists
            if name not in declarations:
                print(f"  [SKIP] {name} - not found in file")
                continue

            decl_type = declarations[name]

            # Add export keyword to declaration
            if decl_type in ['class', 'interface', 'type', 'enum']:
                # Pattern: class Name -> export class Name
                pattern = rf'(\n\s*)({decl_type}\s+{name}\b)'
                replacement = rf'\1export \2'

                new_content = re.sub(pattern, replacement, content, count=1)
                if new_content != content:
                    content = new_content
                    added.append(name)
                    exports_to_add.append(f"export {decl_type} {name}")

            elif decl_type == 'const':
                # Pattern: const name = -> export const name =
                pattern = rf'(\n)const\s+{name}\s*([:=])'
                replacement = rf'\1export const {name}\2'

                new_content = re.sub(pattern, replacement, content, count=1)
                if new_content != content:
                    content = new_content
                    added.append(name)
                    exports_to_add.append(f"export const {name}")

        # Write back if changed
        if content != original:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            return len(added), exports_to_add

        return 0, []

    except Exception as e:
        print(f"  [ERROR] Failed to fix {file_path}: {e}")
        return 0, []

# ============================================================================
# RE-EXPORT HUB FIXING
# ============================================================================

def fix_reexport_hub(file_path: Path) -> bool:
    """
    Fix re-export hub files that are missing default export
    Returns: True if fixed
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        original = content

        # Check if it's a re-export hub (has export * from)
        if 'export * from' not in content:
            return False

        # Check if it already has default export
        if re.search(r'export\s+\{\s*default\s*\}', content):
            return False
        if 'export default' in content:
            return False

        # Find the re-export statement
        match = re.search(r"export \* from\s+['\"]([^'\"]+)['\"]", content)
        if not match:
            return False

        target = match.group(1)

        # Add default re-export after the * export
        insert_line = f"export {{ default }} from '{target}';"

        # Insert after the export * line
        content = re.sub(
            r"(export \* from\s+['\"][^'\"]+['\"];?)",
            rf"\1\n{insert_line}",
            content,
            count=1
        )

        if content != original:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            return True

        return False

    except Exception as e:
        print(f"  [ERROR] Failed to fix re-export hub {file_path}: {e}")
        return False

# ============================================================================
# MAIN EXECUTION
# ============================================================================

def main():
    print("=" * 80)
    print("PHASE 3A: EXPORT FIXER")
    print("=" * 80)
    print()

    # Step 1: Analyze missing exports
    missing_exports = get_missing_exports()

    if not missing_exports:
        print("No missing exports found or analysis failed")
        return 1

    print()
    print("=" * 80)
    print("FIXING MISSING EXPORTS")
    print("=" * 80)
    print()

    total_added = 0
    files_modified = 0

    # Step 2: Fix each file
    for file_path_str, names in sorted(missing_exports.items()):
        file_path = Path(file_path_str)

        if not file_path.exists():
            print(f"[SKIP] {file_path} - file not found")
            continue

        print(f"Processing {file_path.name}...")

        count_added, exports = add_export_to_file(file_path, names)

        if count_added > 0:
            print(f"  [OK] Added {count_added} exports")
            for export in exports:
                print(f"       - {export}")
            total_added += count_added
            files_modified += 1
        else:
            print(f"  [SKIP] No changes needed")

    print()
    print("=" * 80)
    print("FIXING RE-EXPORT HUBS")
    print("=" * 80)
    print()

    # Step 3: Fix re-export hubs
    src_dir = Path('src')
    hub_files = []

    for file_path in src_dir.rglob('*.ts'):
        if 'node_modules' in str(file_path):
            continue

        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()

            # Check if it's a re-export hub
            if 'export * from' in content and len(content) < 500:
                hub_files.append(file_path)
        except Exception:
            continue

    print(f"Found {len(hub_files)} potential re-export hub files")
    print()

    hubs_fixed = 0
    for hub_file in hub_files:
        if fix_reexport_hub(hub_file):
            print(f"[OK] Fixed {hub_file}")
            hubs_fixed += 1

    print()
    print("=" * 80)
    print("SUMMARY")
    print("=" * 80)
    print(f"Files modified: {files_modified}")
    print(f"Exports added: {total_added}")
    print(f"Re-export hubs fixed: {hubs_fixed}")
    print()

    return 0

if __name__ == '__main__':
    sys.exit(main())
