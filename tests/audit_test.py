#!/usr/bin/env python3
"""Audit test to validate workflow analyzer integration"""

import json
import sys
import re
from pathlib import Path

def audit_workflow(workflow_path):
    """Audit a workflow file for analyzer integration."""
    
    issues = []
    warnings = []
    successes = []
    
    with open(workflow_path, 'r') as f:
        content = f.read()
    
    # Check 1: Unified analyzer command
    if 'python -m analyzer' in content and '--comprehensive' in content:
        successes.append("Uses unified analyzer API")
    else:
        issues.append("Not using unified analyzer API")
    
    # Check 2: Output file handling
    if '--output' in content and '.json' in content:
        successes.append("Outputs to JSON file")
    else:
        warnings.append("May not save JSON output")
    
    # Check 3: Fallback handling
    if '2>/dev/null' in content or '|| true' in content:
        successes.append("Has error fallback")
    else:
        warnings.append("No explicit error handling")
    
    # Check 4: JSON field extraction
    json_fields = re.findall(r"\.get\(['\"](\w+)['\"]", content)
    if json_fields:
        successes.append(f"Extracts fields: {', '.join(set(json_fields)[:5])}")
    
    # Check 5: Threshold validation
    thresholds = re.findall(r"THRESHOLD['\"]?\s*[:=]\s*(\d+)", content)
    if thresholds:
        successes.append(f"Has thresholds: {', '.join(thresholds[:3])}")
    
    return {
        "file": workflow_path.name,
        "issues": issues,
        "warnings": warnings,
        "successes": successes
    }

# Audit all workflows
workflows = Path('.github/workflows').glob('*.yml')
results = []

for workflow in workflows:
    if workflow.name in ['production-cicd-pipeline.yml', 'pr-quality-gate.yml', 
                         'quality-gates.yml', 'nasa-pot10-compliance.yml', 
                         'connascence-analysis.yml']:
        result = audit_workflow(workflow)
        results.append(result)

# Generate report
print("=" * 50)
print("WORKFLOW ANALYZER INTEGRATION AUDIT RESULTS")
print("=" * 50)
print()

for result in results:
    print(f"\n[{result['file']}]")
    
    if result['successes']:
        for success in result['successes']:
            print(f"  [OK] {success}")
    
    if result['warnings']:
        for warning in result['warnings']:
            print(f"  [WARN] {warning}")
    
    if result['issues']:
        for issue in result['issues']:
            print(f"  [FAIL] {issue}")
    
    # Overall status
    if not result['issues']:
        if not result['warnings']:
            print(f"  STATUS: FULLY COMPLIANT")
        else:
            print(f"  STATUS: FUNCTIONAL WITH WARNINGS")
    else:
        print(f"  STATUS: NEEDS FIXES")

print("\n" + "=" * 50)
print("SUMMARY")
print("=" * 50)

total_workflows = len(results)
compliant = sum(1 for r in results if not r['issues'])
with_warnings = sum(1 for r in results if r['warnings'] and not r['issues'])
needs_fixes = sum(1 for r in results if r['issues'])

print(f"Total workflows audited: {total_workflows}")
print(f"Fully compliant: {compliant}")
print(f"Functional with warnings: {with_warnings}")
print(f"Needs fixes: {needs_fixes}")

if needs_fixes == 0:
    print("\n[SUCCESS] All workflows properly integrated with analyzer!")
else:
    print(f"\n[ATTENTION] {needs_fixes} workflows need attention")
