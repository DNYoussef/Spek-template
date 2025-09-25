#!/usr/bin/env python3
"""
Workflow Cascade Dependency Analyzer
Maps all GitHub workflows and their interdependencies to create a cascade tree
"""

from collections import defaultdict
from pathlib import Path
import json
import os
import re

import yaml

class WorkflowCascadeAnalyzer:
    def __init__(self):
        self.workflows = {}
        self.dependencies = defaultdict(list)
        self.triggers = defaultdict(list)
        self.missing_workflows = []
        self.workflow_dir = Path('.github/workflows')

        # Known workflows that should exist (51 total)
        self.expected_workflows = [
            # Core Quality Gates (10)
            'quality-gates.yml',
            'quality-gate-validation.yml',
            'quality-gate-enforcer.yml',
            'quality-orchestrator.yml',
            'quality-orchestrator-parallel.yml',
            'enhanced-quality-gates.yml',
            'production-gate.yml',
            'validate-artifacts.yml',
            'integration-validation.yml',
            'workflow-dependencies.yml',

            # NASA/Defense Compliance (10)
            'nasa-pot10-compliance.yml',
            'nasa-pot10-validation.yml',
            'nasa-pot10-fix.yml',
            'nasa-compliance-check.yml',
            'defense-industry-certification.yml',
            'defense-integration-orchestrator.yml',
            'compliance-automation.yml',
            'dfars-compliance.yml',  # MISSING
            'cmmc-validation.yml',  # MISSING
            'itar-compliance.yml',  # MISSING

            # Security & Analysis (10)
            'security-orchestrator.yml',
            'security-pipeline.yml',
            'codeql-analysis.yml',
            'connascence-analysis.yml',
            'connascence-core-analysis.yml',
            'connascence-quality-gates.yml',
            'architecture-analysis.yml',
            'mece-duplication-analysis.yml',
            'god-object-detection.yml',  # MISSING
            'cyclomatic-complexity.yml',  # MISSING

            # Monitoring & Performance (8)
            'monitoring-dashboard.yml',
            'performance-monitoring.yml',
            'six-sigma-metrics.yml',
            'cache-optimization.yml',
            'performance-benchmarks.yml',  # MISSING
            'load-testing.yml',  # MISSING
            'stress-testing.yml',  # MISSING
            'resource-monitoring.yml',  # MISSING

            # Automation & Recovery (8)
            'closed-loop-automation.yml',
            'auto-repair.yml',
            'rollback-automation.yml',
            'self-dogfooding.yml',
            'audit-reporting-system.yml',
            'failure-recovery.yml',  # MISSING
            'cascade-prevention.yml',  # MISSING
            'intelligent-retry.yml',  # MISSING

            # Development & Testing (5)
            'vscode-extension-ci.yml',
            'setup-branch-protection.yml',
            'unit-tests.yml',  # MISSING
            'integration-tests.yml',  # MISSING
            'e2e-tests.yml',  # MISSING

            # Config (2 - in subfolder)
            'config/performance-optimization.yml',
            'config/security-hardening.yml'
        ]

    def load_workflow(self, filepath):
        """Load and parse a workflow file"""
        try:
            # Try UTF-8 first, then fallback to latin-1
            encodings = ['utf-8', 'latin-1', 'cp1252']
            content = None

            for encoding in encodings:
                try:
                    with open(filepath, 'r', encoding=encoding, errors='ignore') as f:
                        content = f.read()
                        break
                except:
                    continue

            if content:
                # Clean common issues
                content = content.replace('\x00', '')  # Remove null bytes
                content = content.replace('\r\n', '\n')  # Normalize line endings

                data = yaml.safe_load(content)
                return data, content
            else:
                print(f"Could not read {filepath} with any encoding")
                return None, None
        except Exception as e:
            print(f"Error loading {filepath}: {e}")
            return None, None

    def extract_dependencies(self, workflow_data, workflow_name):
        """Extract workflow dependencies from needs statements"""
        deps = []

        if workflow_data and 'jobs' in workflow_data:
            for job_name, job_data in workflow_data['jobs'].items():
                if isinstance(job_data, dict):
                    # Check for job dependencies
                    if 'needs' in job_data:
                        needs = job_data['needs']
                        if isinstance(needs, list):
                            deps.extend(needs)
                        elif isinstance(needs, str):
                            deps.append(needs)

                    # Check for workflow_call triggers
                    if 'uses' in job_data:
                        uses = job_data['uses']
                        if '.github/workflows/' in uses:
                            workflow_ref = uses.split('/')[-1].split('@')[0]
                            self.triggers[workflow_ref].append(workflow_name)

        return deps

    def extract_triggers(self, workflow_data, workflow_name):
        """Extract what triggers this workflow"""
        triggers = []

        if workflow_data and 'on' in workflow_data:
            on_config = workflow_data['on']

            if isinstance(on_config, dict):
                # Check for workflow_run triggers
                if 'workflow_run' in on_config:
                    run_config = on_config['workflow_run']
                    if 'workflows' in run_config:
                        workflows = run_config['workflows']
                        if isinstance(workflows, list):
                            triggers.extend(workflows)

                # Check for workflow_call (reusable)
                if 'workflow_call' in on_config:
                    self.triggers['reusable'].append(workflow_name)

                # Check for workflow_dispatch (manual)
                if 'workflow_dispatch' in on_config:
                    self.triggers['manual'].append(workflow_name)

        return triggers

    def analyze_all_workflows(self):
        """Analyze all workflows and build dependency tree"""
        # Find all existing workflows
        existing_files = []
        for ext in ['*.yml', '*.yaml']:
            existing_files.extend(self.workflow_dir.glob(ext))
            existing_files.extend(self.workflow_dir.glob(f'**/{ext}'))

        # Load and analyze each workflow
        for filepath in existing_files:
            relative_path = filepath.relative_to(self.workflow_dir)
            workflow_name = str(relative_path)

            data, content = self.load_workflow(filepath)
            if data:
                self.workflows[workflow_name] = {
                    'path': str(filepath),
                    'name': data.get('name', workflow_name),
                    'data': data,
                    'size': len(content)
                }

                # Extract dependencies
                deps = self.extract_dependencies(data, workflow_name)
                if deps:
                    self.dependencies[workflow_name] = deps

                # Extract triggers
                triggers = self.extract_triggers(data, workflow_name)
                if triggers:
                    self.triggers[workflow_name] = triggers

        # Find missing workflows
        existing_names = set(self.workflows.keys())
        expected_set = set(self.expected_workflows)
        self.missing_workflows = list(expected_set - existing_names)

        print(f"Found {len(self.workflows)} workflows")
        print(f"Missing {len(self.missing_workflows)} workflows")

    def generate_cascade_tree(self):
        """Generate the cascade dependency tree"""
        tree = {
            'summary': {
                'total_expected': len(self.expected_workflows),
                'total_found': len(self.workflows),
                'total_missing': len(self.missing_workflows),
                'workflows_with_dependencies': len(self.dependencies),
                'reusable_workflows': len(self.triggers.get('reusable', [])),
                'manual_workflows': len(self.triggers.get('manual', []))
            },
            'existing_workflows': {},
            'missing_workflows': self.missing_workflows,
            'dependency_chains': {},
            'trigger_relationships': dict(self.triggers),
            'cascade_points': []
        }

        # Map existing workflows
        for name, info in self.workflows.items():
            tree['existing_workflows'][name] = {
                'display_name': info['name'],
                'dependencies': self.dependencies.get(name, []),
                'triggered_by': self.triggers.get(name, []),
                'triggers': self.get_workflows_triggered_by(name)
            }

        # Identify cascade points (workflows that many depend on)
        cascade_analysis = defaultdict(int)
        for deps in self.dependencies.values():
            for dep in deps:
                cascade_analysis[dep] += 1

        # Sort by most dependencies
        cascade_points = sorted(cascade_analysis.items(), key=lambda x: x[1], reverse=True)
        tree['cascade_points'] = [
            {'workflow': wp[0], 'dependent_count': wp[1]}
            for wp in cascade_points[:10]
        ]

        # Build dependency chains
        for workflow in self.workflows:
            chain = self.build_dependency_chain(workflow)
            if len(chain) > 1:
                tree['dependency_chains'][workflow] = chain

        return tree

    def get_workflows_triggered_by(self, workflow_name):
        """Get workflows that this workflow triggers"""
        triggered = []
        for trigger_type, workflows in self.triggers.items():
            if workflow_name in workflows:
                triggered.append(trigger_type)
        return triggered

    def build_dependency_chain(self, workflow, visited=None):
        """Build the full dependency chain for a workflow"""
        if visited is None:
            visited = set()

        if workflow in visited:
            return []

        visited.add(workflow)
        chain = [workflow]

        if workflow in self.dependencies:
            for dep in self.dependencies[workflow]:
                sub_chain = self.build_dependency_chain(dep, visited.copy())
                if sub_chain:
                    chain.extend(sub_chain)

        return chain

    def generate_mermaid_diagram(self):
        """Generate a Mermaid diagram of the cascade tree"""
        lines = ["graph TD"]

        # Add existing workflows
        for name in self.workflows:
            safe_name = name.replace('.yml', '').replace('.yaml', '').replace('/', '_').replace('-', '_')
            display_name = self.workflows[name]['name']
            lines.append(f"    {safe_name}[\"{display_name}\"]")

        # Add missing workflows with different style
        for name in self.missing_workflows:
            safe_name = name.replace('.yml', '').replace('.yaml', '').replace('/', '_').replace('-', '_')
            lines.append(f"    {safe_name}[[\"{name} (MISSING)\"]]")
            lines.append(f"    style {safe_name} fill:#ff6666, stroke:#333, stroke-width:2px")

        # Add dependencies
        for workflow, deps in self.dependencies.items():
            safe_workflow = workflow.replace('.yml', '').replace('.yaml', '').replace('/', '_').replace('-', '_')
            for dep in deps:
                safe_dep = dep.replace('.yml', '').replace('.yaml', '').replace('/', '_').replace('-', '_')
                lines.append(f"    {safe_dep} --> {safe_workflow}")

        # Add trigger relationships
        for triggered_by, workflows in self.triggers.items():
            if triggered_by not in ['reusable', 'manual']:
                safe_trigger = triggered_by.replace('.yml', '').replace('.yaml', '').replace('/', '_').replace('-', '_')
                for workflow in workflows:
                    safe_workflow = workflow.replace('.yml', '').replace('.yaml', '').replace('/', '_').replace('-', '_')
                    lines.append(f"    {safe_trigger} -.-> {safe_workflow}")

        return '\n'.join(lines)

    def save_results(self):
        """Save analysis results"""
        os.makedirs('.claude/.artifacts/cascade', exist_ok=True)

        # Generate cascade tree
        tree = self.generate_cascade_tree()

        # Save JSON tree
        with open('.claude/.artifacts/cascade/workflow_cascade_tree.json', 'w') as f:
            json.dump(tree, f, indent=2, default=str)

        # Save Mermaid diagram
        mermaid = self.generate_mermaid_diagram()
        with open('.claude/.artifacts/cascade/workflow_cascade_diagram.md', 'w') as f:
            f.write("# Workflow Cascade Dependency Diagram\n\n")
            f.write("```mermaid\n")
            f.write(mermaid)
            f.write("\n```\n")

        # Save missing workflows report
        with open('.claude/.artifacts/cascade/missing_workflows.txt', 'w') as f:
            f.write("MISSING WORKFLOWS REPORT\n")
            f.write("=" * 50 + "\n\n")
            f.write(f"Total Expected: {len(self.expected_workflows)}\n")
            f.write(f"Total Found: {len(self.workflows)}\n")
            f.write(f"Total Missing: {len(self.missing_workflows)}\n\n")
            f.write("Missing Workflows:\n")
            for workflow in self.missing_workflows:
                f.write(f"  - {workflow}\n")

        # Print summary
        print("\n" + "=" * 60)
        print("WORKFLOW CASCADE ANALYSIS COMPLETE")
        print("=" * 60)
        print(f"Total workflows found: {len(self.workflows)}")
        print(f"Missing workflows: {len(self.missing_workflows)}")
        print(f"Cascade points identified: {len(tree['cascade_points'])}")
        print("\nTop cascade points (most dependencies):")
        for point in tree['cascade_points'][:5]:
            print(f"  - {point['workflow']}: {point['dependent_count']} dependencies")
        print("\nMissing workflows:")
        for workflow in self.missing_workflows[:10]:
            print(f"  - {workflow}")
        print("\nResults saved to .claude/.artifacts/cascade/")

        return tree

if __name__ == "__main__":
    analyzer = WorkflowCascadeAnalyzer()
    analyzer.analyze_all_workflows()
    tree = analyzer.save_results()