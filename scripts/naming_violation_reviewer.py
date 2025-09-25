#!/usr/bin/env python3
"""
Naming Violation Reviewer for Phase 5 Day 9
Reviews and filters naming violations to focus on genuine issues
"""

from pathlib import Path
from typing import Dict, List, Set
import json
import re

from dataclasses import dataclass

@dataclass
class ViolationFilter:
    """Configuration for filtering violations"""
    exclude_type_aliases: bool = True
    exclude_compatibility_aliases: bool = True
    exclude_short_names: bool = True
    exclude_api_constants: bool = True
    exclude_special_cases: bool = True

class NamingViolationReviewer:
    """Reviews naming violations and creates filtered, actionable list"""

    def __init__(self, report_path: str):
        self.report_path = report_path
        self.report = self._load_report()
        self.special_terms = {
            'nasa_terms': {'NASA', 'POT', 'DFARS', 'NIST', 'FIPS', 'SLSA', 'SBOM'},
            'api_terms': {'API', 'HTTP', 'JSON', 'XML', 'URL', 'URI', 'REST', 'GraphQL'},
            'frameworks': {'React', 'Angular', 'Vue', 'Django', 'Flask'},
            'abbreviations': {'DB', 'UI', 'UX', 'CI', 'CD', 'PR', 'QA', 'SWE'},
            'type_aliases': {'Result', 'Error', 'Config', 'Data', 'Info'}
        }

    def _load_report(self) -> Dict:
        """Load naming standardization report"""
        with open(self.report_path, 'r') as f:
            return json.load(f)

    def review_violations(self, filter_config: ViolationFilter = None) -> Dict:
        """Review violations and create filtered, actionable list"""
        if filter_config is None:
            filter_config = ViolationFilter()

        print("Reviewing naming violations for actionability...")

        original_violations = self.report['violations']
        filtered_violations = []
        excluded_violations = []

        for violation in original_violations:
            if self._should_exclude_violation(violation, filter_config):
                excluded_violations.append(violation)
            else:
                # Enhance violation with additional context
                enhanced_violation = self._enhance_violation(violation)
                filtered_violations.append(enhanced_violation)

        # Create priority groups
        priority_groups = self._create_priority_groups(filtered_violations)

        return {
            'summary': {
                'original_count': len(original_violations),
                'filtered_count': len(filtered_violations),
                'excluded_count': len(excluded_violations),
                'reduction_percentage': round((len(excluded_violations) / len(original_violations)) * 100, 1)
            },
            'priority_groups': priority_groups,
            'actionable_violations': filtered_violations,
            'excluded_violations': excluded_violations,
            'filter_config': filter_config.__dict__
        }

    def _should_exclude_violation(self, violation: Dict, filter_config: ViolationFilter) -> bool:
        """Determine if violation should be excluded from actionable list"""
        current_name = violation['current_name']
        context = violation.get('context', '')
        file_path = violation['file_path']

        # Exclude type aliases (e.g., "AnalysisResult = UnifiedAnalysisResult")
        if filter_config.exclude_type_aliases:
            if '=' in context and any(term in context for term in ['Result', 'Error', 'Type']):
                return True

        # Exclude compatibility aliases
        if filter_config.exclude_compatibility_aliases:
            if 'compatibility' in context.lower() or 'alias' in context.lower():
                return True

        # Exclude very short names (likely intentional)
        if filter_config.exclude_short_names:
            if len(current_name) <= 2:
                return True

        # Exclude API-related constants
        if filter_config.exclude_api_constants:
            if any(term in current_name.upper() for term in self.special_terms['api_terms']):
                return True

        # Exclude special domain terms
        if filter_config.exclude_special_cases:
            if any(term in current_name for term in self.special_terms['nasa_terms']):
                return True
            if any(term in current_name for term in self.special_terms['frameworks']):
                return True

        # Exclude test files with intentionally weird names
        if 'test' in file_path.lower():
            return True

        return False

    def _enhance_violation(self, violation: Dict) -> Dict:
        """Enhance violation with additional context and metadata"""
        enhanced = violation.copy()

        # Add impact assessment
        enhanced['impact_assessment'] = self._assess_impact(violation)

        # Add refactoring difficulty
        enhanced['refactoring_difficulty'] = self._assess_difficulty(violation)

        # Add suggested approach
        enhanced['suggested_approach'] = self._suggest_approach(violation)

        return enhanced

    def _assess_impact(self, violation: Dict) -> str:
        """Assess the impact of fixing this naming violation"""
        file_path = violation['file_path']
        current_name = violation['current_name']

        # Check if it's in a core module
        if any(core in file_path for core in ['core', 'main', 'base', 'engine']):
            return 'high'

        # Check if it's likely used across many files
        if violation['violation_type'] == 'class':
            return 'medium'

        # Functions and constants are usually lower impact
        return 'low'

    def _assess_difficulty(self, violation: Dict) -> str:
        """Assess difficulty of refactoring this violation"""
        violation_type = violation['violation_type']
        current_name = violation['current_name']

        # Classes are harder to rename (more references)
        if violation_type == 'class':
            return 'medium'

        # Constants used across files
        if violation_type == 'constant' and current_name.isupper():
            return 'easy'

        # Functions are usually easy
        if violation_type == 'function':
            return 'easy'

        return 'medium'

    def _suggest_approach(self, violation: Dict) -> str:
        """Suggest approach for fixing this violation"""
        difficulty = self._assess_difficulty(violation)
        impact = self._assess_impact(violation)

        if difficulty == 'easy' and impact == 'low':
            return 'direct_rename'
        elif impact == 'high':
            return 'gradual_migration'
        else:
            return 'batch_rename'

    def _create_priority_groups(self, violations: List[Dict]) -> Dict:
        """Create priority groups for violations"""
        groups = {
            'critical': [],      # High impact, easy to fix
            'important': [],     # Medium impact or difficulty
            'nice_to_have': []   # Low impact, cosmetic improvements
        }

        for violation in violations:
            impact = violation['impact_assessment']
            difficulty = violation['refactoring_difficulty']

            if impact == 'high' and difficulty == 'easy':
                groups['critical'].append(violation)
            elif impact == 'high' or difficulty == 'medium':
                groups['important'].append(violation)
            else:
                groups['nice_to_have'].append(violation)

        return groups

    def generate_action_plan(self, reviewed_violations: Dict) -> Dict:
        """Generate step-by-step action plan for fixing violations"""
        action_plan = {
            'phases': [],
            'total_violations': reviewed_violations['summary']['filtered_count'],
            'estimated_effort': 'TBD'
        }

        # Phase 1: Critical violations (high impact, easy fixes)
        critical = reviewed_violations['priority_groups']['critical']
        if critical:
            action_plan['phases'].append({
                'phase': 1,
                'name': 'Critical Naming Standardization',
                'violations': critical,
                'approach': 'Direct rename with immediate testing',
                'estimated_time': f"{len(critical) * 15} minutes",
                'risk': 'low'
            })

        # Phase 2: Important violations
        important = reviewed_violations['priority_groups']['important']
        if important:
            action_plan['phases'].append({
                'phase': 2,
                'name': 'Important Naming Improvements',
                'violations': important,
                'approach': 'Batch rename with compatibility layers',
                'estimated_time': f"{len(important) * 30} minutes",
                'risk': 'medium'
            })

        # Phase 3: Nice-to-have violations
        nice_to_have = reviewed_violations['priority_groups']['nice_to_have']
        if nice_to_have:
            action_plan['phases'].append({
                'phase': 3,
                'name': 'Cosmetic Naming Polish',
                'violations': nice_to_have,
                'approach': 'Gradual improvement as files are touched',
                'estimated_time': f"{len(nice_to_have) * 10} minutes",
                'risk': 'low'
            })

        return action_plan

    def save_review_report(self, output_path: str) -> Dict:
        """Save comprehensive review report"""
        reviewed_violations = self.review_violations()
        action_plan = self.generate_action_plan(reviewed_violations)

        report = {
            'review_summary': reviewed_violations['summary'],
            'priority_groups': reviewed_violations['priority_groups'],
            'action_plan': action_plan,
            'actionable_violations': reviewed_violations['actionable_violations'],
            'excluded_violations': reviewed_violations['excluded_violations']
        }

        with open(output_path, 'w') as f:
            json.dump(report, f, indent=2)

        print(f"Review report saved to: {output_path}")
        return report

def main():
    """Main execution function"""
    reviewer = NamingViolationReviewer('docs/naming_standardization_report.json')
    report = reviewer.save_review_report('docs/naming_violation_review.json')

    print("\n=== NAMING VIOLATION REVIEW SUMMARY ===")
    print(f"Original violations: {report['review_summary']['original_count']}")
    print(f"Actionable violations: {report['review_summary']['filtered_count']}")
    print(f"Excluded violations: {report['review_summary']['excluded_count']}")
    print(f"Reduction: {report['review_summary']['reduction_percentage']}%")

    print("\nPriority Groups:")
    for group, violations in report['priority_groups'].items():
        print(f"  {group}: {len(violations)} violations")

    print("\nAction Plan:")
    for phase in report['action_plan']['phases']:
        print(f"  Phase {phase['phase']}: {phase['name']} - {len(phase['violations'])} items ({phase['estimated_time']})")

if __name__ == "__main__":
    main()