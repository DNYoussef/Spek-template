#!/usr/bin/env python3
"""
Connascence Analysis and Prioritization Script
Analyzes the large connascence_analysis.json and creates actionable refactoring plans
"""

import json
import sys
from collections import defaultdict, Counter
from pathlib import Path

def analyze_connascence_data(json_file_path):
    """Load and analyze connascence violations data"""
    print(f"Loading connascence data from {json_file_path}...")

    # Statistics tracking
    violation_counts = Counter()
    file_violations = defaultdict(lambda: defaultdict(int))
    total_violations = 0

    # Process the JSON file in chunks to handle large size
    try:
        with open(json_file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        violations = data.get('connascence_violations', [])
        total_violations = len(violations)

        print(f"Total violations found: {total_violations}")

        # Group violations by type and file
        for violation in violations:
            v_type = violation.get('type', 'unknown')
            v_file = violation.get('file', 'unknown')

            violation_counts[v_type] += 1
            file_violations[v_file][v_type] += 1

        return violation_counts, file_violations, total_violations

    except Exception as e:
        print(f"Error processing file: {e}")
        return {}, {}, 0

def prioritize_files(file_violations, top_n=100):
    """Prioritize files by total violation count"""
    file_priorities = []

    for file_path, violations in file_violations.items():
        total_file_violations = sum(violations.values())
        file_priorities.append((file_path, total_file_violations, violations))

    # Sort by total violations (descending)
    file_priorities.sort(key=lambda x: x[1], reverse=True)

    return file_priorities[:top_n]

def generate_refactoring_strategy(violation_counts, file_priorities):
    """Generate specific refactoring strategies for each violation type"""

    strategies = {
        'name': {
            'count': violation_counts.get('name', 0),
            'agent': 'NameDecoupler',
            'techniques': [
                'Introduce dependency injection interfaces',
                'Extract configuration objects',
                'Use factory patterns for object creation',
                'Implement service locator pattern',
                'Create abstract base classes'
            ]
        },
        'algorithm': {
            'count': violation_counts.get('algorithm', 0),
            'agent': 'AlgorithmRefactorer',
            'techniques': [
                'Extract shared algorithms to utility modules',
                'Create strategy pattern implementations',
                'Implement template method pattern',
                'Use command pattern for complex operations',
                'Create algorithm registry/factory'
            ]
        },
        'type': {
            'count': violation_counts.get('type', 0),
            'agent': 'TypeStandardizer',
            'techniques': [
                'Standardize type definitions across modules',
                'Create shared type definition files',
                'Implement duck typing with protocols',
                'Use generic types for flexibility',
                'Create type unions for compatibility'
            ]
        },
        'execution': {
            'count': violation_counts.get('execution', 0),
            'agent': 'ExecutionOrderResolver',
            'techniques': [
                'Remove order dependencies in imports',
                'Use lazy loading patterns',
                'Implement event-driven architecture',
                'Create initialization ordering system',
                'Use dependency injection containers'
            ]
        },
        'position': {
            'count': violation_counts.get('position', 0),
            'agent': 'PositionEliminator',
            'techniques': [
                'Convert positional args to named parameters',
                'Use dataclasses for parameter objects',
                'Implement builder pattern',
                'Create configuration dictionaries',
                'Use keyword-only arguments'
            ]
        }
    }

    return strategies

def create_action_plan(strategies, file_priorities, target_reduction=0.8):
    """Create specific action plan for achieving 80% reduction"""

    total_violations = sum(s['count'] for s in strategies.values())
    target_fixes = int(total_violations * target_reduction)

    print(f"\n=== CONNASCENCE REFACTORING ACTION PLAN ===")
    print(f"Total violations: {total_violations}")
    print(f"Target reduction: {target_reduction*100}%")
    print(f"Violations to fix: {target_fixes}")

    print(f"\n=== VIOLATION TYPE BREAKDOWN ===")
    for v_type, strategy in strategies.items():
        count = strategy['count']
        percentage = (count / total_violations * 100) if total_violations > 0 else 0
        print(f"{v_type.upper()}: {count:,} violations ({percentage:.1f}%)")

    print(f"\n=== TOP 20 FILES BY VIOLATION COUNT ===")
    for i, (file_path, total_viols, viols_by_type) in enumerate(file_priorities[:20]):
        print(f"{i+1:2d}. {file_path}: {total_viols} violations")
        for v_type, count in viols_by_type.items():
            if count > 0:
                print(f"     {v_type}: {count}")

    return {
        'total_violations': total_violations,
        'target_fixes': target_fixes,
        'strategies': strategies,
        'top_files': file_priorities[:100]
    }

def main():
    # Path to the connascence analysis file
    analysis_file = Path('.claude/.artifacts/connascence_analysis.json')

    if not analysis_file.exists():
        print(f"Error: Analysis file not found at {analysis_file}")
        sys.exit(1)

    # Analyze the data
    violation_counts, file_violations, total_violations = analyze_connascence_data(analysis_file)

    if total_violations == 0:
        print("No violations found or error processing file")
        sys.exit(1)

    # Prioritize files
    file_priorities = prioritize_files(file_violations, top_n=100)

    # Generate strategies
    strategies = generate_refactoring_strategy(violation_counts, file_priorities)

    # Create action plan
    action_plan = create_action_plan(strategies, file_priorities)

    # Save the action plan
    output_file = Path('.claude/.artifacts/connascence_action_plan.json')
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(action_plan, f, indent=2, default=str)

    print(f"\nAction plan saved to: {output_file}")

if __name__ == "__main__":
    main()