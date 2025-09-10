#!/usr/bin/env python3
"""
Quality Gate Decision Script for Quality Orchestrator
Makes final quality gate decisions based on consolidated analysis
"""

import json
import sys

def quality_gate_decision():
    """Make quality gate decision based on consolidated analysis results"""
    try:
        with open('.claude/.artifacts/quality_gates_report.json', 'r') as f:
            data = json.load(f)
    except FileNotFoundError:
        print('ERROR: Quality gates report not found')
        sys.exit(1)
    except json.JSONDecodeError:
        print('ERROR: Invalid quality gates report format')
        sys.exit(1)
    
    overall_quality = data.get('overall_scores', {}).get('average_quality', 0)
    critical_issues = data.get('critical_issues', [])
    
    print(f'Overall Quality Score: {overall_quality:.2%}')
    print(f'Critical Issues: {len(critical_issues)}')
    
    # Quality gate thresholds
    min_overall_quality = 0.75
    max_critical_issues = 5
    failed = False
    
    # Check overall quality threshold
    if overall_quality < min_overall_quality:
        print(f'ERROR: Overall quality: {overall_quality:.2%} < {min_overall_quality:.2%}')
        failed = True
    else:
        print(f'SUCCESS: Overall quality: {overall_quality:.2%} >= {min_overall_quality:.2%}')
    
    # Check critical issues threshold
    if len(critical_issues) > max_critical_issues:
        print(f'ERROR: Critical issues: {len(critical_issues)} > {max_critical_issues}')
        failed = True
    else:
        print(f'SUCCESS: Critical issues: {len(critical_issues)} <= {max_critical_issues}')
    
    # Display critical issues if any
    if critical_issues:
        print('\nCritical Issues:')
        for i, issue in enumerate(critical_issues[:5], 1):
            print(f'{i}. {issue}')
    
    # Final decision
    if failed:
        print('\nERROR: OVERALL QUALITY GATE FAILED')
        sys.exit(1)
    else:
        print('\nSUCCESS: OVERALL QUALITY GATE PASSED')

if __name__ == '__main__':
    quality_gate_decision()