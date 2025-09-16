#!/usr/bin/env python3
"""
Batch cleaner for corrupted GitHub workflow files
Removes null bytes and fixes encoding issues
"""

import os
import sys
import glob
import yaml
from pathlib import Path

def clean_workflow_file(filepath):
    """Clean a single workflow file by removing null bytes"""
    try:
        # Read file with null bytes
        with open(filepath, 'rb') as f:
            content = f.read()

        # Check if file has null bytes
        if b'\x00' in content:
            print(f"Cleaning: {filepath}")

            # Remove null bytes (every other byte in the corrupted files)
            # The pattern is: char, null, char, null...
            cleaned = b''
            for i in range(0, len(content), 2):
                if i < len(content):
                    cleaned += bytes([content[i]])

            # Decode to string
            cleaned_text = cleaned.decode('utf-8', errors='ignore')

            # Validate YAML syntax
            try:
                yaml.safe_load(cleaned_text)

                # Write cleaned content
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(cleaned_text)

                return True, "Cleaned and validated"
            except yaml.YAMLError as e:
                return False, f"YAML validation failed: {e}"
        else:
            # File is already clean, validate YAML
            with open(filepath, 'r', encoding='utf-8') as f:
                content_text = f.read()

            try:
                yaml.safe_load(content_text)
                return True, "Already clean"
            except yaml.YAMLError as e:
                return False, f"YAML validation failed: {e}"

    except Exception as e:
        return False, f"Error: {e}"

def main():
    """Clean all workflow files in .github/workflows"""
    workflows_dir = Path('.github/workflows')

    if not workflows_dir.exists():
        print("Error: .github/workflows directory not found")
        sys.exit(1)

    # Find all YAML files
    workflow_files = list(workflows_dir.glob('*.yml')) + list(workflows_dir.glob('*.yaml'))

    print(f"Found {len(workflow_files)} workflow files")
    print("-" * 50)

    results = {
        'cleaned': [],
        'already_clean': [],
        'failed': []
    }

    for filepath in workflow_files:
        success, message = clean_workflow_file(filepath)

        if success:
            if "Cleaned" in message:
                results['cleaned'].append(filepath.name)
                print(f"[OK] {filepath.name}: Cleaned successfully")
            else:
                results['already_clean'].append(filepath.name)
                print(f"[OK] {filepath.name}: Already clean")
        else:
            results['failed'].append((filepath.name, message))
            print(f"[FAIL] {filepath.name}: {message}")

    # Print summary
    print("\n" + "=" * 50)
    print("SUMMARY")
    print("=" * 50)
    print(f"Total files: {len(workflow_files)}")
    print(f"Cleaned: {len(results['cleaned'])}")
    print(f"Already clean: {len(results['already_clean'])}")
    print(f"Failed: {len(results['failed'])}")

    if results['cleaned']:
        print(f"\nCleaned files ({len(results['cleaned'])}):")
        for name in results['cleaned'][:10]:
            print(f"  - {name}")
        if len(results['cleaned']) > 10:
            print(f"  ... and {len(results['cleaned']) - 10} more")

    if results['failed']:
        print(f"\nFailed files ({len(results['failed'])}):")
        for name, error in results['failed']:
            print(f"  - {name}: {error}")

    # Return exit code
    return 0 if len(results['failed']) == 0 else 1

if __name__ == "__main__":
    sys.exit(main())