#!/usr/bin/env python3
"""Check which workflows are missing proper requirements.txt installation."""

import os
import glob

# Find all workflow files
workflow_dir = ".github/workflows"
workflow_files = glob.glob(f"{workflow_dir}/*.yml")

print("=== Workflows Analysis ===\n")

# Categories
missing_requirements = []
has_silent_failure = []
missing_pythonpath = []
missing_pip_cache = []

for workflow_file in workflow_files:
    workflow_name = os.path.basename(workflow_file)
    with open(workflow_file, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()

    # Check for pytest but no requirements.txt
    if 'pytest' in content and 'requirements.txt' not in content:
        missing_requirements.append(workflow_name)

    # Check for silent failure pattern
    if 'requirements.txt || echo' in content or 'requirements.txt|| echo' in content:
        has_silent_failure.append(workflow_name)

    # Check if Python workflow without PYTHONPATH
    if 'setup-python' in content and 'PYTHONPATH' not in content:
        missing_pythonpath.append(workflow_name)

    # Check if Python workflow without pip cache
    if 'setup-python' in content and "cache: 'pip'" not in content:
        missing_pip_cache.append(workflow_name)

print("1. Workflows with pytest but NO requirements.txt installation:")
print("=" * 60)
for wf in missing_requirements:
    print(f"  - {wf}")
print(f"Total: {len(missing_requirements)}")

print("\n2. Workflows with silent failure patterns (|| echo):")
print("=" * 60)
for wf in has_silent_failure:
    print(f"  - {wf}")
print(f"Total: {len(has_silent_failure)}")

print("\n3. Python workflows missing PYTHONPATH:")
print("=" * 60)
for wf in missing_pythonpath:
    print(f"  - {wf}")
print(f"Total: {len(missing_pythonpath)}")

print("\n4. Python workflows missing pip cache:")
print("=" * 60)
for wf in missing_pip_cache:
    print(f"  - {wf}")
print(f"Total: {len(missing_pip_cache)}")

print("\n=== Priority Fixes ===")
print("Critical (causing failures):", missing_requirements)
print("High (masking issues):", has_silent_failure[:3])