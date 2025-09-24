#!/usr/bin/env python3
"""
Comprehensive Theater Detection System
Analyzes codebase for fake implementations, tests, and quality gates
"""
import os
import re
import json
from pathlib import Path
from collections import defaultdict
from typing import Dict, List

class ComprehensiveTheaterDetector:
    def __init__(self, root_path: str):
        self.root = Path(root_path)
        self.violations = []
        self.metrics = {
            'code_theater': 0,
            'test_theater': 0,
            'doc_theater': 0,
            'quality_gate_theater': 0,
            'mock_theater': 0
        }

    def analyze_test_quality(self):
        """Analyze test suite for theater patterns"""
        print("Analyzing test quality...")

        # Count test files
        test_files = list(self.root.rglob('*.test.js')) + list(self.root.rglob('*.test.ts'))
        test_files = [f for f in test_files if 'node_modules' not in str(f)]

        tautology_count = 0
        empty_tests = 0
        mock_heavy = 0

        for test_file in test_files:
            try:
                content = test_file.read_text()

                # Tautology tests
                if 'expect(true).toBe(true)' in content:
                    tautology_count += 1
                    self.violations.append({
                        'type': 'test_theater',
                        'severity': 'CRITICAL',
                        'file': str(test_file.relative_to(self.root)),
                        'issue': 'Tautology test - always passes without validation',
                        'score': 10
                    })

                # Empty tests
                empty_pattern = re.findall(r'it\([^,]+,\s*\(\)\s*=>\s*{\s*}\)', content)
                if empty_pattern:
                    empty_tests += len(empty_pattern)
                    self.violations.append({
                        'type': 'test_theater',
                        'severity': 'CRITICAL',
                        'file': str(test_file.relative_to(self.root)),
                        'issue': f'{len(empty_pattern)} empty test(s) - no validation logic',
                        'score': 8 * len(empty_pattern)
                    })

                # Mock-heavy tests
                mock_count = content.count('jest.fn()') + content.count('mockResolvedValue')
                assertion_count = content.count('expect(')
                if mock_count > 5 and assertion_count < mock_count:
                    mock_heavy += 1
                    self.violations.append({
                        'type': 'mock_theater',
                        'severity': 'HIGH',
                        'file': str(test_file.relative_to(self.root)),
                        'issue': f'Mock-heavy test: {mock_count} mocks vs {assertion_count} assertions',
                        'score': 5
                    })

            except Exception as e:
                pass

        self.metrics['test_theater'] = (tautology_count * 10) + (empty_tests * 8) + (mock_heavy * 5)

    def analyze_code_theater(self):
        """Detect fake implementations"""
        print("Analyzing code implementations...")

        js_files = list(self.root.rglob('*.js')) + list(self.root.rglob('*.ts'))
        js_files = [f for f in js_files if 'node_modules' not in str(f) and 'dist' not in str(f)]

        for js_file in js_files:
            try:
                content = js_file.read_text()

                # Success printing without validation
                success_prints = re.findall(r'console\.log\(["\'].*?(success|PASS|OK)', content, re.IGNORECASE)
                if success_prints and 'test' not in str(js_file):
                    self.violations.append({
                        'type': 'code_theater',
                        'severity': 'MEDIUM',
                        'file': str(js_file.relative_to(self.root)),
                        'issue': f'Success printing without validation: {len(success_prints)} occurrences',
                        'score': 3 * len(success_prints)
                    })
                    self.metrics['code_theater'] += 3 * len(success_prints)

                # TODO/FIXME claiming done
                todo_done = re.findall(r'//.*TODO.*done|//.*FIXME.*fixed', content, re.IGNORECASE)
                if todo_done:
                    self.violations.append({
                        'type': 'code_theater',
                        'severity': 'LOW',
                        'file': str(test_file.relative_to(self.root)),
                        'issue': f'TODO/FIXME claiming completion: {len(todo_done)} occurrences',
                        'score': 2 * len(todo_done)
                    })
                    self.metrics['code_theater'] += 2 * len(todo_done)

            except Exception:
                pass

    def analyze_documentation_theater(self):
        """Detect fake documentation"""
        print("Analyzing documentation...")

        md_files = [f for f in self.root.rglob('*.md') if 'node_modules' not in str(f)]

        for md_file in md_files:
            try:
                content = md_file.read_text()

                # Placeholder sections
                placeholders = re.findall(r'\[PLACEHOLDER\]|\[TBD\]|\[COMING SOON\]', content, re.IGNORECASE)
                if placeholders:
                    self.violations.append({
                        'type': 'doc_theater',
                        'severity': 'LOW',
                        'file': str(md_file.relative_to(self.root)),
                        'issue': f'Placeholder sections: {len(placeholders)} occurrences',
                        'score': 2 * len(placeholders)
                    })
                    self.metrics['doc_theater'] += 2 * len(placeholders)

            except Exception:
                pass

    def calculate_theater_score(self) -> int:
        """Calculate overall theater score (0-100, lower is better)"""
        total = sum(self.metrics.values())
        # Normalize to 0-100 scale (100 = max theater)
        return min(100, total)

    def generate_report(self) -> Dict:
        """Generate comprehensive report"""
        theater_score = self.calculate_theater_score()

        # Categorize violations
        critical = [v for v in self.violations if v['severity'] == 'CRITICAL']
        high = [v for v in self.violations if v['severity'] == 'HIGH']
        medium = [v for v in self.violations if v['severity'] == 'MEDIUM']

        return {
            'timestamp': '2024-09-23T21:30:00Z',
            'theater_score': theater_score,
            'target_score': 40,
            'status': 'PASS' if theater_score <= 40 else 'FAIL',
            'total_violations': len(self.violations),
            'breakdown': {
                'critical': len(critical),
                'high': len(high),
                'medium': len(medium),
                'low': len(self.violations) - len(critical) - len(high) - len(medium)
            },
            'metrics': self.metrics,
            'top_violations': sorted(self.violations, key=lambda x: x['score'], reverse=True)[:10],
            'recommendations': self._generate_recommendations(theater_score)
        }

    def _generate_recommendations(self, score: int) -> List[str]:
        """Generate actionable recommendations"""
        recs = []

        if self.metrics['test_theater'] > 20:
            recs.append("Remove tautology tests and replace with real validation logic")
        if self.metrics['mock_theater'] > 15:
            recs.append("Reduce mock usage in tests - add integration tests with real dependencies")
        if self.metrics['code_theater'] > 10:
            recs.append("Replace success-printing code with actual error handling")
        if score <= 40:
            recs.append("Current theater score is acceptable - maintain quality standards")
        else:
            recs.append(f"Theater score ({score}) exceeds target (40) - prioritize theater elimination")

        return recs

if __name__ == '__main__':
    detector = ComprehensiveTheaterDetector('/c/Users/17175/Desktop/spek template')

    print("=" * 60)
    print("COMPREHENSIVE THEATER DETECTION SCAN")
    print("=" * 60)

    detector.analyze_code_theater()
    detector.analyze_test_quality()
    detector.analyze_documentation_theater()

    report = detector.generate_report()

    print(f"\nTheater Score: {report['theater_score']}/100 (target: <=40)")
    print(f"Status: {report['status']}")
    print(f"Total Violations: {report['total_violations']}")
    print(f"\nBreakdown:")
    print(f"  Critical: {report['breakdown']['critical']}")
    print(f"  High: {report['breakdown']['high']}")
    print(f"  Medium: {report['breakdown']['medium']}")
    print(f"  Low: {report['breakdown']['low']}")

    print(f"\nMetrics:")
    for key, value in report['metrics'].items():
        print(f"  {key}: {value}")

    print(f"\nTop 5 Violations:")
    for i, v in enumerate(report['top_violations'][:5], 1):
        print(f"  {i}. [{v['severity']}] {v['file']}")
        print(f"      {v['issue']} (score: {v['score']})")

    # Save JSON report
    json_file = Path('/c/Users/17175/Desktop/spek template/.claude/.artifacts/theater-scan-results.json')
    with open(json_file, 'w') as f:
        json.dump(report, f, indent=2)

    print(f"\nJSON results saved to: {json_file}")