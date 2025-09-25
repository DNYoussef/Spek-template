#!/usr/bin/env python3
"""
Pre-commit hook for validating Version & Run Log footers
Ensures all modified files have valid footers with correct content hashes
"""

from pathlib import Path
import json
import subprocess
import sys

# Add src directory to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from src.version_log import VersionLogManager, ContentHasher, FooterRenderer

def get_staged_files():
    """Get list of staged files from git"""
    try:
        result = subprocess.run(
            ['git', 'diff', '--cached', '--name-only'],
            capture_output=True,
            text=True,
            check=True
        )
        return [f.strip() for f in result.stdout.splitlines() if f.strip()]
    except subprocess.CalledProcessError as e:
        print(f"Error getting staged files: {e}")
        return []

def should_check_file(file_path):
    """Determine if file should be checked for footer"""
    path = Path(file_path)

    # Skip binary files
    binary_extensions = {'.png', '.jpg', '.jpeg', '.gif', '.ico', '.pdf', '.zip', '.tar', '.gz', '.exe', '.dll', '.so'}
    if path.suffix.lower() in binary_extensions:
        return False

    # Skip node_modules, .git, and other vendor directories
    skip_dirs = {'node_modules', '.git', 'vendor', 'dist', 'build', '__pycache__'}
    for parent in path.parents:
        if parent.name in skip_dirs:
            return False

    # Check these file types
    check_extensions = {
        '.py', '.js', '.ts', '.jsx', '.tsx', '.java', '.c', '.cpp', '.h', '.hpp',
        '.go', '.rs', '.sh', '.bash', '.md', '.html', '.yaml', '.yml', '.toml',
        '.sql', '.rb', '.php', '.cs', '.swift', '.kt'
    }

    return path.suffix.lower() in check_extensions

def check_file(file_path, manager, hasher):
    """
    Check a single file for valid footer

    Args:
        file_path: Path to file
        manager: VersionLogManager instance
        hasher: ContentHasher instance

    Returns:
        Tuple of (is_valid, error_message)
    """
    try:
        # Read file content
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Check for footer existence
        renderer = FooterRenderer()
        footer_data = renderer.parse_existing_footer(content, file_path)

        if not footer_data:
            return False, "Missing footer"

        # Validate content hash
        body = hasher.strip_footer(content)
        actual_hash = hasher.compute_hash(body)

        rows = footer_data.get('rows', [])
        if not rows:
            return False, "Footer has no version rows"

        last_row = rows[-1]
        expected_hash = last_row.get('content_hash', '')

        if actual_hash != expected_hash:
            return False, f"Hash mismatch (expected: {expected_hash}, actual: {actual_hash})"

        # Check row count
        if len(rows) > renderer.max_rows:
            return False, f"Too many rows ({len(rows)} > {renderer.max_rows})"

        # Check version format
        version = last_row.get('version', '')
        if not version or not all(c.isdigit() or c in '.+-' for c in version):
            return False, f"Invalid version format: {version}"

        # Check required fields
        required_fields = ['timestamp', 'agent_model', 'change_summary', 'status', 'content_hash']
        for field in required_fields:
            if field not in last_row or not last_row[field]:
                return False, f"Missing required field: {field}"

        # Validate status
        valid_statuses = {'OK', 'PARTIAL', 'BLOCKED'}
        if last_row.get('status') not in valid_statuses:
            return False, f"Invalid status: {last_row.get('status')}"

        return True, None

    except UnicodeDecodeError:
        # Binary file or encoding issue - skip
        return True, None
    except Exception as e:
        return False, f"Error checking file: {e}"

def main():
    """Main pre-commit hook logic"""
    print("Checking Version & Run Log footers...")

    # Get staged files
    staged_files = get_staged_files()
    if not staged_files:
        print("No staged files to check")
        return 0

    # Initialize managers
    manager = VersionLogManager()
    hasher = ContentHasher()

    # Check each file
    failed_files = []
    checked_count = 0

    for file_path in staged_files:
        if not should_check_file(file_path):
            continue

        checked_count += 1
        is_valid, error = check_file(file_path, manager, hasher)

        if not is_valid:
            failed_files.append((file_path, error))
            print(f"  [FAIL] {file_path}: {error}")
        else:
            print(f"  [OK] {file_path}")

    # Summary
    print(f"\nChecked {checked_count} files")

    if failed_files:
        print(f"\n{len(failed_files)} files have invalid footers:")
        for file_path, error in failed_files:
            print(f"  - {file_path}: {error}")

        print("\nTo fix:")
        print("1. Run: python scripts/hooks/repair-footers.py")
        print("2. Or manually update the footers")
        print("3. Stage the changes and commit again")

        return 1

    print("All footers valid!")
    return 0

if __name__ == "__main__":
    sys.exit(main())