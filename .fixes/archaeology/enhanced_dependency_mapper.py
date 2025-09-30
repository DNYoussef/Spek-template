#!/usr/bin/env python3
"""
Enhanced Dependency Mapping with Actual Test Collection
Uses pytest to identify which tests are actually broken
"""

import ast
import json
import subprocess
import sys
from pathlib import Path
from datetime import datetime
from collections import defaultdict
from typing import Dict, List, Set, Tuple

class EnhancedDependencyMapper:
    def __init__(self):
        self.syntax_broken = []
        self.import_broken = []
        self.working_files = []
        self.test_collection_results = {}

    def check_syntax(self, file_path: Path) -> Tuple[bool, str]:
        """Check if file has valid Python syntax"""
        try:
            content = file_path.read_text(encoding='utf-8')
            ast.parse(content)
            return True, "OK"
        except SyntaxError as e:
            return False, f"SyntaxError: {e.msg} at line {e.lineno}"
        except Exception as e:
            return False, f"ParseError: {str(e)}"

    def collect_pytest_tests(self, file_path: Path) -> Dict:
        """Use pytest to check if tests can be collected"""
        try:
            result = subprocess.run(
                ['python', '-m', 'pytest', str(file_path), '--collect-only', '-q'],
                capture_output=True,
                text=True,
                timeout=10
            )

            output = result.stdout + result.stderr

            # Parse output
            if 'ERROR' in output:
                return {'status': 'ERROR', 'error': output.split('\n')[0]}
            elif 'collected' in output:
                # Extract number of collected tests
                for line in output.split('\n'):
                    if 'collected' in line:
                        try:
                            count = int(line.split()[0].replace('collected', '').strip())
                            return {'status': 'OK', 'test_count': count}
                        except:
                            return {'status': 'OK', 'test_count': 0}
                return {'status': 'OK', 'test_count': 0}
            else:
                return {'status': 'UNKNOWN', 'error': 'No collection info'}

        except subprocess.TimeoutExpired:
            return {'status': 'TIMEOUT', 'error': 'Collection timeout'}
        except Exception as e:
            return {'status': 'EXCEPTION', 'error': str(e)}

    def analyze_all_files(self, test_dir: Path) -> Dict:
        """Analyze all test files"""
        all_test_files = []

        # Find all test_*.py files
        for pattern in ['test_*.py', '*_test.py']:
            all_test_files.extend(test_dir.rglob(pattern))

        print(f"Found {len(all_test_files)} test files")

        results = {
            'syntax_ok': [],
            'syntax_error': [],
            'collection_ok': [],
            'collection_error': [],
            'working': [],
            'broken': []
        }

        for i, test_file in enumerate(all_test_files, 1):
            print(f"  [{i}/{len(all_test_files)}] Analyzing {test_file.name}...", end='\r')

            file_str = str(test_file)

            # Check syntax
            syntax_ok, syntax_msg = self.check_syntax(test_file)

            if syntax_ok:
                results['syntax_ok'].append(file_str)

                # Try pytest collection
                collection_result = self.collect_pytest_tests(test_file)
                self.test_collection_results[file_str] = collection_result

                if collection_result['status'] == 'OK':
                    results['collection_ok'].append(file_str)
                    results['working'].append({
                        'file': file_str,
                        'test_count': collection_result.get('test_count', 0),
                        'status': 'WORKING'
                    })
                else:
                    results['collection_error'].append({
                        'file': file_str,
                        'error': collection_result.get('error', 'Unknown error')
                    })
                    results['broken'].append({
                        'file': file_str,
                        'reason': 'Collection failed',
                        'error': collection_result.get('error', 'Unknown error')
                    })
            else:
                results['syntax_error'].append({
                    'file': file_str,
                    'error': syntax_msg
                })
                results['broken'].append({
                    'file': file_str,
                    'reason': 'Syntax error',
                    'error': syntax_msg
                })

        print(f"\n\nAnalysis complete!")
        return results

    def categorize_broken_files(self, results: Dict) -> Dict:
        """Categorize broken files by error type"""
        categories = {
            'syntax_errors': [],
            'import_errors': [],
            'fixture_errors': [],
            'other_errors': []
        }

        for broken in results['broken']:
            error = broken.get('error', '').lower()

            if 'syntax' in error or 'invalid syntax' in error:
                categories['syntax_errors'].append(broken)
            elif 'import' in error or 'modulenotfound' in error:
                categories['import_errors'].append(broken)
            elif 'fixture' in error:
                categories['fixture_errors'].append(broken)
            else:
                categories['other_errors'].append(broken)

        return categories

    def identify_critical_path(self, results: Dict) -> List[Dict]:
        """Identify files that should be fixed first"""
        critical_path = []

        # Priority 1: Root-level test files (affect overall test run)
        root_files = [f for f in results['broken'] if 'tests\\test_' in f['file'] and f['file'].count('\\') == 1]

        for f in root_files[:10]:
            critical_path.append({
                'file': f['file'],
                'priority': 'CRITICAL',
                'reason': 'Root-level test file',
                'error': f['error'][:100],
                'action': 'Fix syntax errors first'
            })

        # Priority 2: Files in working directories (breaks directory)
        working_dirs = set()
        for w in results['working']:
            working_dirs.add(str(Path(w['file']).parent))

        for broken in results['broken']:
            if str(Path(broken['file']).parent) in working_dirs:
                if len(critical_path) < 20:
                    critical_path.append({
                        'file': broken['file'],
                        'priority': 'HIGH',
                        'reason': 'In partially working directory',
                        'error': broken['error'][:100],
                        'action': 'Fix to complete directory'
                    })

        return critical_path

    def create_fix_priority_queue(self, results: Dict, categories: Dict) -> Dict:
        """Create prioritized queue for fixing"""
        queue = {
            'tier_1_critical': [],
            'tier_2_high_impact': [],
            'tier_3_isolated': []
        }

        # Tier 1: Root-level files and files with simple syntax errors
        for broken in results['broken']:
            file_path = Path(broken['file'])
            error = broken.get('error', '')

            is_root = file_path.parent == Path('tests')
            is_syntax = 'syntax' in error.lower()

            if is_root or is_syntax:
                queue['tier_1_critical'].append({
                    'file': broken['file'],
                    'reason': broken['reason'],
                    'error': error[:150],
                    'fix_difficulty': 'EASY' if is_syntax else 'MEDIUM'
                })

        # Tier 2: Import errors and fixture errors
        for broken in categories['import_errors'] + categories['fixture_errors']:
            if len(queue['tier_2_high_impact']) < 30:
                queue['tier_2_high_impact'].append({
                    'file': broken['file'],
                    'reason': broken['reason'],
                    'error': broken['error'][:150],
                    'fix_difficulty': 'MEDIUM'
                })

        # Tier 3: Everything else
        for broken in categories['other_errors']:
            if len(queue['tier_3_isolated']) < 50:
                queue['tier_3_isolated'].append({
                    'file': broken['file'],
                    'reason': broken['reason'],
                    'error': broken['error'][:150],
                    'fix_difficulty': 'HARD'
                })

        return queue

    def generate_report(self, results: Dict) -> Dict:
        """Generate comprehensive report"""
        categories = self.categorize_broken_files(results)
        critical_path = self.identify_critical_path(results)
        priority_queue = self.create_fix_priority_queue(results, categories)

        total_working_tests = sum(w['test_count'] for w in results['working'])
        total_broken_tests = len(results['broken'])

        return {
            'phase': 'archaeological',
            'agent': 'enhanced-dependency-mapper',
            'status': 'complete',
            'critical_path': critical_path,
            'tier_1_critical': priority_queue['tier_1_critical'],
            'tier_2_high_impact': priority_queue['tier_2_high_impact'],
            'tier_3_isolated': priority_queue['tier_3_isolated'],
            'working_files': results['working'][:20],
            'broken_by_category': {
                'syntax_errors': len(categories['syntax_errors']),
                'import_errors': len(categories['import_errors']),
                'fixture_errors': len(categories['fixture_errors']),
                'other_errors': len(categories['other_errors'])
            },
            'statistics': {
                'total_test_files': len(results['syntax_ok']) + len(results['syntax_error']),
                'working_files': len(results['working']),
                'broken_files': len(results['broken']),
                'working_tests': total_working_tests,
                'blocked_tests': total_broken_tests,
                'syntax_ok': len(results['syntax_ok']),
                'syntax_error': len(results['syntax_error']),
                'collection_ok': len(results['collection_ok']),
                'collection_error': len(results['collection_error'])
            },
            'timestamp': datetime.now().isoformat()
        }

def main():
    mapper = EnhancedDependencyMapper()

    print("=== Enhanced Dependency Analysis ===\n")
    print("Analyzing all test files...")

    results = mapper.analyze_all_files(Path('tests'))

    print("\nGenerating comprehensive report...")
    report = mapper.generate_report(results)

    # Write report
    output_file = Path('.fixes/archaeology/enhanced-dependency-map.json')
    output_file.write_text(json.dumps(report, indent=2))

    print(f"\n=== Analysis Complete ===")
    print(f"Total test files: {report['statistics']['total_test_files']}")
    print(f"Working files: {report['statistics']['working_files']}")
    print(f"Broken files: {report['statistics']['broken_files']}")
    print(f"Working tests: {report['statistics']['working_tests']}")
    print(f"\nBroken by category:")
    print(f"  Syntax errors: {report['broken_by_category']['syntax_errors']}")
    print(f"  Import errors: {report['broken_by_category']['import_errors']}")
    print(f"  Fixture errors: {report['broken_by_category']['fixture_errors']}")
    print(f"  Other errors: {report['broken_by_category']['other_errors']}")
    print(f"\nPriority queue:")
    print(f"  Tier 1 (critical): {len(report['tier_1_critical'])}")
    print(f"  Tier 2 (high impact): {len(report['tier_2_high_impact'])}")
    print(f"  Tier 3 (isolated): {len(report['tier_3_isolated'])}")
    print(f"\nCritical path items: {len(report['critical_path'])}")
    print(f"\nReport written to: {output_file}")

    # Print top critical path
    print("\n=== TOP 5 CRITICAL PATH ===")
    for item in report['critical_path'][:5]:
        print(f"\n{item['file']}")
        print(f"  Priority: {item['priority']}")
        print(f"  Reason: {item['reason']}")
        print(f"  Error: {item['error']}")
        print(f"  Action: {item['action']}")

    return 0

if __name__ == '__main__':
    sys.exit(main())
