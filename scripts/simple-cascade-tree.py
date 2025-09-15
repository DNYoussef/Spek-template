#!/usr/bin/env python3
"""
Simple Workflow Cascade Tree Builder
Creates a dependency tree of all workflows without parsing YAML
"""

import os
import re
import json
from pathlib import Path
from collections import defaultdict

def find_all_workflows():
    """Find all workflow files"""
    workflow_dir = Path('.github/workflows')
    workflows = []

    for ext in ['*.yml', '*.yaml']:
        workflows.extend(workflow_dir.glob(ext))
        workflows.extend(workflow_dir.glob(f'**/{ext}'))

    return workflows

def extract_workflow_name(filepath):
    """Extract workflow name from file"""
    try:
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
            # Find name: field
            match = re.search(r'^name:\s*["\']?([^"\'\n]+)', content, re.MULTILINE)
            if match:
                return match.group(1).strip()
    except:
        pass
    return filepath.name

def extract_dependencies(filepath):
    """Extract dependencies from workflow file"""
    deps = {
        'needs': [],
        'workflow_run': [],
        'workflow_call': False,
        'workflow_dispatch': False,
        'triggers': []
    }

    try:
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()

            # Find needs: declarations
            needs_matches = re.findall(r'needs:\s*\[([^\]]+)\]', content)
            for match in needs_matches:
                jobs = [j.strip() for j in match.split(',')]
                deps['needs'].extend(jobs)

            # Find workflow_run triggers
            if 'workflow_run:' in content:
                run_section = re.search(r'workflow_run:.*?workflows:\s*\[(.*?)\]', content, re.DOTALL)
                if run_section:
                    workflows = [w.strip().strip('"\'') for w in run_section.group(1).split(',')]
                    deps['workflow_run'].extend(workflows)

            # Check for workflow_call
            if 'workflow_call:' in content:
                deps['workflow_call'] = True

            # Check for workflow_dispatch
            if 'workflow_dispatch:' in content:
                deps['workflow_dispatch'] = True

            # Find push/pull_request triggers
            if re.search(r'^\s*push:', content, re.MULTILINE):
                deps['triggers'].append('push')
            if re.search(r'^\s*pull_request:', content, re.MULTILINE):
                deps['triggers'].append('pull_request')

    except Exception as e:
        print(f"Error reading {filepath}: {e}")

    return deps

def build_cascade_tree():
    """Build the complete cascade tree"""
    workflows = find_all_workflows()

    # Expected workflows (51 total)
    expected = [
        # Core Quality Gates (10)
        'quality-gates', 'quality-gate-validation', 'quality-gate-enforcer',
        'quality-orchestrator', 'quality-orchestrator-parallel', 'enhanced-quality-gates',
        'production-gate', 'validate-artifacts', 'integration-validation', 'workflow-dependencies',

        # NASA/Defense (10)
        'nasa-pot10-compliance', 'nasa-pot10-validation', 'nasa-pot10-fix',
        'nasa-compliance-check', 'defense-industry-certification',
        'defense-integration-orchestrator', 'compliance-automation',
        'dfars-compliance', 'cmmc-validation', 'itar-compliance',

        # Security & Analysis (10)
        'security-orchestrator', 'security-pipeline', 'codeql-analysis',
        'connascence-analysis', 'connascence-core-analysis', 'connascence-quality-gates',
        'architecture-analysis', 'mece-duplication-analysis',
        'god-object-detection', 'cyclomatic-complexity',

        # Monitoring & Performance (8)
        'monitoring-dashboard', 'performance-monitoring', 'six-sigma-metrics',
        'cache-optimization', 'performance-benchmarks', 'load-testing',
        'stress-testing', 'resource-monitoring',

        # Automation & Recovery (8)
        'closed-loop-automation', 'auto-repair', 'rollback-automation',
        'self-dogfooding', 'audit-reporting-system', 'failure-recovery',
        'cascade-prevention', 'intelligent-retry',

        # Development & Testing (5)
        'vscode-extension-ci', 'setup-branch-protection',
        'unit-tests', 'integration-tests', 'e2e-tests'
    ]

    tree = {
        'summary': {
            'total_expected': len(expected),
            'total_found': len(workflows),
            'workflows': []
        },
        'existing': {},
        'missing': [],
        'cascade_analysis': {},
        'trigger_chains': defaultdict(list)
    }

    # Process found workflows
    found_names = []
    for wf_path in workflows:
        rel_path = wf_path.relative_to(Path('.github/workflows'))
        name = extract_workflow_name(wf_path)
        deps = extract_dependencies(wf_path)

        base_name = wf_path.stem
        found_names.append(base_name)

        tree['existing'][base_name] = {
            'file': str(rel_path),
            'display_name': name,
            'needs': deps['needs'],
            'triggered_by': deps['workflow_run'],
            'is_reusable': deps['workflow_call'],
            'is_manual': deps['workflow_dispatch'],
            'triggers': deps['triggers']
        }

        tree['summary']['workflows'].append({
            'name': base_name,
            'display': name,
            'file': str(rel_path)
        })

    # Find missing workflows
    for exp in expected:
        if exp not in found_names and f'config/{exp}' not in [str(p) for p in workflows]:
            tree['missing'].append(exp)

    # Analyze cascade points
    job_deps = defaultdict(int)
    for wf_data in tree['existing'].values():
        for dep in wf_data['needs']:
            job_deps[dep] += 1

    tree['cascade_analysis'] = {
        'critical_jobs': sorted([(k, v) for k, v in job_deps.items()],
                               key=lambda x: x[1], reverse=True)[:10]
    }

    return tree

def save_cascade_tree(tree):
    """Save the cascade tree"""
    os.makedirs('.claude/.artifacts/cascade', exist_ok=True)

    # Save JSON
    with open('.claude/.artifacts/cascade/simple_cascade_tree.json', 'w') as f:
        json.dump(tree, f, indent=2, default=str)

    # Create text report
    with open('.claude/.artifacts/cascade/cascade_report.txt', 'w') as f:
        f.write("WORKFLOW CASCADE DEPENDENCY TREE\n")
        f.write("=" * 60 + "\n\n")

        f.write(f"Total Expected: {tree['summary']['total_expected']}\n")
        f.write(f"Total Found: {tree['summary']['total_found']}\n")
        f.write(f"Total Missing: {len(tree['missing'])}\n\n")

        f.write("EXISTING WORKFLOWS:\n")
        f.write("-" * 40 + "\n")
        for wf in tree['summary']['workflows']:
            f.write(f"  {wf['name']:<30} -> {wf['display']}\n")

        f.write("\nMISSING WORKFLOWS:\n")
        f.write("-" * 40 + "\n")
        for wf in tree['missing']:
            f.write(f"  - {wf}\n")

        f.write("\nCRITICAL CASCADE POINTS:\n")
        f.write("-" * 40 + "\n")
        for job, count in tree['cascade_analysis']['critical_jobs']:
            f.write(f"  {job:<30} <- {count} dependencies\n")

        f.write("\nWORKFLOW TRIGGER CHAINS:\n")
        f.write("-" * 40 + "\n")
        for wf_name, wf_data in tree['existing'].items():
            if wf_data['triggered_by']:
                f.write(f"  {wf_name} <- triggered by: {', '.join(wf_data['triggered_by'])}\n")

    print("=" * 60)
    print("CASCADE TREE ANALYSIS COMPLETE")
    print("=" * 60)
    print(f"Found: {tree['summary']['total_found']} workflows")
    print(f"Missing: {len(tree['missing'])} workflows")
    print(f"Critical cascade points: {len(tree['cascade_analysis']['critical_jobs'])}")
    print("\nResults saved to .claude/.artifacts/cascade/")

    return tree

if __name__ == "__main__":
    tree = build_cascade_tree()
    save_cascade_tree(tree)

    # Print missing workflows
    print("\nMISSING WORKFLOWS TO RESTORE:")
    for wf in tree['missing'][:15]:
        print(f"  - {wf}.yml")