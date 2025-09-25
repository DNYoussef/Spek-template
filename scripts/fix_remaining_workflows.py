#!/usr/bin/env python3
"""Fix remaining workflow issues: silent failures, missing PYTHONPATH, missing requirements.txt"""

import os
import re

def fix_deployment_rollback():
    """Add Python setup to deployment-rollback.yml"""
    workflow_path = ".github/workflows/deployment-rollback.yml"

    with open(workflow_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find the line before "Verify rollback success"
    pattern = r'(\s+- name: Verify rollback success)'

    python_setup = """    - name: Setup Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.11'
        cache: 'pip'

    - name: Install Python dependencies
      run: |
        python -m pip install --upgrade pip
        if [ -f requirements.txt ]; then
          pip install -r requirements.txt
        fi
        pip install pytest

"""

    # Add Python setup before the verification step if not already present
    if "Setup Python" not in content:
        content = re.sub(pattern, python_setup + r'\1', content)

        with open(workflow_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"[OK] Fixed {workflow_path} - added Python setup")
    else:
        print(f"[SKIP] Skipping {workflow_path} - Python setup already exists")

def remove_silent_failures_and_add_pythonpath():
    """Remove silent failure patterns and add PYTHONPATH"""
    workflows_to_fix = [
        "comprehensive-test-integration.yml",
        "connascence-analysis.yml",
        "monitoring-dashboard.yml",
        "nasa-pot10-compliance.yml",
        "pr-quality-gate.yml",
        "production-cicd-pipeline.yml",
        "quality-gates.yml",
        "security-orchestrator.yml",
        "test-analyzer-visibility.yml",
        "phase6-cicd-accelerator.yml"
    ]

    for workflow in workflows_to_fix:
        workflow_path = f".github/workflows/{workflow}"
        if not os.path.exists(workflow_path):
            print(f"[WARNING] Skipping {workflow} - file not found")
            continue

        with open(workflow_path, 'r', encoding='utf-8') as f:
            content = f.read()

        original_content = content

        # Remove silent failure patterns
        # Pattern 1: || echo "message"
        content = re.sub(
            r'pip install -r requirements\.txt \|\| echo "[^"]*"',
            'pip install -r requirements.txt',
            content
        )

        # Pattern 2: || echo with single quotes
        content = re.sub(
            r"pip install -r requirements\.txt \|\| echo '[^']*'",
            'pip install -r requirements.txt',
            content
        )

        # Add PYTHONPATH if missing and workflow has Python steps
        if "setup-python" in content and "PYTHONPATH" not in content:
            # Find pytest or python execution steps and add PYTHONPATH
            pattern = r'(run: \|[^\n]*\n(?:\s+.*\n)*?)(\s+)(python|pytest)'

            def add_pythonpath(match):
                return match.group(1) + match.group(2) + "export PYTHONPATH=${{ github.workspace }}\n" + match.group(2) + match.group(3)

            content = re.sub(pattern, add_pythonpath, content, count=1)

            # Also add to env section if it exists in test steps
            pattern2 = r'(- name: [^R][^\n]*test[^\n]*\n(?:\s+[^\n]*\n)*?)(\s+run:)'

            def add_env_pythonpath(match):
                if 'env:' in match.group(1):
                    # Add to existing env
                    return re.sub(r'(env:\n)', r'\1        PYTHONPATH: ${{ github.workspace }}\n', match.group(0))
                else:
                    # Add new env section
                    return match.group(1) + match.group(2).replace('run:', 'env:\n        PYTHONPATH: ${{ github.workspace }}\n      run:')

            content = re.sub(pattern2, add_env_pythonpath, content)

        # Add pip cache if missing
        if "setup-python" in content and "cache: 'pip'" not in content:
            content = re.sub(
                r"(python-version: ['\"]3\.\d+['\"])",
                r"\1\n        cache: 'pip'",
                content
            )

        if content != original_content:
            with open(workflow_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"[OK] Fixed {workflow}")
        else:
            print(f"[SKIP] No changes needed for {workflow}")

def main():
    print("=== Fixing Remaining Workflow Issues ===\n")

    print("1. Fixing deployment-rollback.yml (missing Python setup)...")
    fix_deployment_rollback()

    print("\n2. Removing silent failures and adding PYTHONPATH...")
    remove_silent_failures_and_add_pythonpath()

    print("\n[SUCCESS] All workflow fixes completed!")

if __name__ == "__main__":
    main()