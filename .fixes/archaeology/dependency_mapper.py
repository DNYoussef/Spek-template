#!/usr/bin/env python3
"""
Dependency Mapping and Critical Path Analysis
Analyzes test file imports to identify high-impact blockers
"""

import ast
import json
import sys
from pathlib import Path
from datetime import datetime
from collections import defaultdict
from typing import Dict, List, Set, Tuple

class DependencyMapper:
    def __init__(self):
        self.dependency_graph = defaultdict(set)
        self.reverse_graph = defaultdict(set)
        self.broken_files = []
        self.working_files = []
        self.syntax_errors = {}
        self.import_errors = {}

    def analyze_file(self, file_path: Path) -> Tuple[bool, List[str]]:
        """Analyze a single file and extract imports"""
        imports = []

        try:
            content = file_path.read_text(encoding='utf-8')
            tree = ast.parse(content)

            for node in ast.walk(tree):
                if isinstance(node, ast.Import):
                    for alias in node.names:
                        imports.append(alias.name)
                elif isinstance(node, ast.ImportFrom):
                    if node.module:
                        imports.append(node.module)

            return True, imports

        except SyntaxError as e:
            self.syntax_errors[str(file_path)] = str(e)
            return False, []
        except Exception as e:
            self.import_errors[str(file_path)] = str(e)
            return False, []

    def build_graph(self, test_dir: Path):
        """Build complete dependency graph"""
        all_files = list(test_dir.rglob("*.py"))

        print(f"Analyzing {len(all_files)} Python files...")

        for file_path in all_files:
            file_str = str(file_path)
            success, imports = self.analyze_file(file_path)

            if success:
                self.working_files.append(file_str)
                # Add edges for each import
                for imp in imports:
                    self.dependency_graph[file_str].add(imp)
                    self.reverse_graph[imp].add(file_str)
            else:
                self.broken_files.append(file_str)

    def calculate_impact_scores(self) -> Dict[str, Dict]:
        """Calculate impact scores for each file"""
        scores = {}

        # Calculate how many files each module blocks
        for module, importers in self.reverse_graph.items():
            if module.startswith('tests'):
                impact = len(importers)
                scores[module] = {
                    'blocks_tests': impact,
                    'importers': list(importers)
                }

        return scores

    def find_critical_init_files(self) -> List[Dict]:
        """Find __init__.py files and their impact"""
        init_files = []

        for file_path in Path('tests').rglob('__init__.py'):
            file_str = str(file_path)

            # Calculate direct impact
            directory = file_path.parent
            related_files = list(directory.rglob('*.py'))

            # Check if file is broken
            is_working = file_str in self.working_files

            init_files.append({
                'file': file_str,
                'directory': str(directory),
                'related_files': len(related_files),
                'status': 'WORKING' if is_working else 'BROKEN',
                'blocks_tests': len(related_files) if not is_working else 0
            })

        return sorted(init_files, key=lambda x: -x['blocks_tests'])

    def find_conftest_files(self) -> List[Dict]:
        """Find conftest.py files and their impact"""
        conftest_files = []

        for file_path in Path('tests').rglob('conftest.py'):
            file_str = str(file_path)

            # conftest.py affects entire directory and subdirectories
            directory = file_path.parent
            affected = list(directory.rglob('test_*.py'))

            is_working = file_str in self.working_files

            conftest_files.append({
                'file': file_str,
                'directory': str(directory),
                'affects_tests': len(affected),
                'status': 'WORKING' if is_working else 'BROKEN',
                'blocks_tests': len(affected) if not is_working else 0
            })

        return sorted(conftest_files, key=lambda x: -x['blocks_tests'])

    def categorize_by_tier(self, impact_scores: Dict) -> Dict:
        """Categorize files into priority tiers"""
        tier1 = []  # Blocks >=20 tests
        tier2 = []  # Blocks 3-19 tests
        tier3 = []  # Blocks 1-2 tests

        for file, data in impact_scores.items():
            impact = data['blocks_tests']

            entry = {
                'file': file,
                'blocks_tests': impact,
                'status': 'WORKING' if file in self.working_files else 'BROKEN'
            }

            if impact >= 20:
                tier1.append(entry)
            elif impact >= 3:
                tier2.append(entry)
            else:
                tier3.append(entry)

        return {
            'tier_1_critical': sorted(tier1, key=lambda x: -x['blocks_tests']),
            'tier_2_high_impact': sorted(tier2, key=lambda x: -x['blocks_tests']),
            'tier_3_isolated': sorted(tier3, key=lambda x: -x['blocks_tests'])
        }

    def find_dependency_clusters(self) -> List[Dict]:
        """Find groups of files with shared dependencies"""
        clusters = defaultdict(set)

        for file, deps in self.dependency_graph.items():
            # Create cluster key from sorted dependencies
            if deps:
                cluster_key = tuple(sorted(deps))
                clusters[cluster_key].add(file)

        result = []
        for deps, files in clusters.items():
            if len(files) > 1:  # Only clusters with multiple files
                result.append({
                    'shared_dependencies': list(deps),
                    'files': list(files),
                    'size': len(files)
                })

        return sorted(result, key=lambda x: -x['size'])

    def generate_report(self) -> Dict:
        """Generate complete dependency map report"""
        print("Calculating impact scores...")
        impact_scores = self.calculate_impact_scores()

        print("Finding critical __init__.py files...")
        init_files = self.find_critical_init_files()

        print("Finding conftest.py files...")
        conftest_files = self.find_conftest_files()

        print("Categorizing by tier...")
        tiers = self.categorize_by_tier(impact_scores)

        print("Finding dependency clusters...")
        clusters = self.find_dependency_clusters()

        # Build critical path (top impacting files)
        critical_path = []

        # Add root conftest first
        root_conftest = next((f for f in conftest_files if f['file'] == 'tests/conftest.py'), None)
        if root_conftest:
            critical_path.append({
                'file': root_conftest['file'],
                'centrality': 1.0,
                'blocks_tests': root_conftest['blocks_tests'],
                'status': root_conftest['status'],
                'action': 'ANALYZE first - affects ALL tests'
            })

        # Add phase7_adas __init__ (known working)
        phase7_init = next((f for f in init_files if 'phase7_adas' in f['file']), None)
        if phase7_init:
            critical_path.append({
                'file': phase7_init['file'],
                'centrality': 0.95,
                'blocks_tests': phase7_init['blocks_tests'],
                'status': phase7_init['status'],
                'action': 'PROTECT - add to .fixignore'
            })

        # Add other high-impact files
        for init_file in init_files[:10]:
            if init_file['blocks_tests'] > 0:
                critical_path.append({
                    'file': init_file['file'],
                    'centrality': init_file['blocks_tests'] / len(self.broken_files) if self.broken_files else 0,
                    'blocks_tests': init_file['blocks_tests'],
                    'status': init_file['status'],
                    'action': 'FIX URGENTLY' if init_file['blocks_tests'] >= 20 else 'FIX SOON'
                })

        total_files = len(self.working_files) + len(self.broken_files)

        return {
            'phase': 'archaeological',
            'agent': 'dependency-mapper',
            'status': 'complete',
            'critical_path': critical_path[:15],
            'tier_1_critical': tiers['tier_1_critical'][:20],
            'tier_2_high_impact': tiers['tier_2_high_impact'][:30],
            'tier_3_isolated': tiers['tier_3_isolated'][:50],
            'init_files': init_files,
            'conftest_files': conftest_files,
            'dependency_clusters': clusters[:20],
            'statistics': {
                'total_files': total_files,
                'broken_files': len(self.broken_files),
                'working_files': len(self.working_files),
                'syntax_errors': len(self.syntax_errors),
                'import_errors': len(self.import_errors),
                'init_files_broken': sum(1 for f in init_files if f['status'] == 'BROKEN'),
                'conftest_files_broken': sum(1 for f in conftest_files if f['status'] == 'BROKEN')
            },
            'timestamp': datetime.now().isoformat()
        }

def main():
    mapper = DependencyMapper()

    print("Building dependency graph...")
    mapper.build_graph(Path('tests'))

    print("\nGenerating report...")
    report = mapper.generate_report()

    # Write report
    output_file = Path('.fixes/archaeology/dependency-map.json')
    output_file.write_text(json.dumps(report, indent=2))

    print(f"\n=== Dependency Mapping Complete ===")
    print(f"Total files analyzed: {report['statistics']['total_files']}")
    print(f"Working files: {report['statistics']['working_files']}")
    print(f"Broken files: {report['statistics']['broken_files']}")
    print(f"Critical path items: {len(report['critical_path'])}")
    print(f"Tier 1 (critical): {len(report['tier_1_critical'])}")
    print(f"Tier 2 (high impact): {len(report['tier_2_high_impact'])}")
    print(f"Tier 3 (isolated): {len(report['tier_3_isolated'])}")
    print(f"\nReport written to: {output_file}")

    # Print top critical path items
    print("\n=== TOP CRITICAL PATH ===")
    for item in report['critical_path'][:5]:
        print(f"  {item['file']}")
        print(f"    Blocks: {item['blocks_tests']} tests")
        print(f"    Status: {item['status']}")
        print(f"    Action: {item['action']}")

    return 0

if __name__ == '__main__':
    sys.exit(main())
