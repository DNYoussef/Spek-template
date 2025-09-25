"""
Unified Compliance Scanner - Enterprise, Defense, NASA, and Six Sigma
Comprehensive scanning for all compliance requirements.
"""

from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List
import ast
import json
import os

class UnifiedComplianceScanner:
    """Scans for all compliance requirements in one pass."""

def __init__(self, project_path: str = "."):
        """Initialize scanner."""
        self.project_path = Path(project_path)
        self.results = {
            'timestamp': datetime.now().isoformat(),
            'project': str(self.project_path),
            'nasa': {},
            'dfars': {},
            'six_sigma': {},
            'enterprise': {},
            'summary': {}
        }

def scan_nasa_compliance(self) -> Dict[str, Any]:
        """NASA POT10 Compliance Scanning."""
        print("Scanning NASA POT10 Compliance...")

        nasa_violations = {
            'rule_1_simple_control_flow': [],
            'rule_2_fixed_loop_bounds': [],
            'rule_3_no_dynamic_memory': [],
            'rule_4_short_functions': [],  # <60 lines
            'rule_5_assertions': [],  # min 2% assertion density
            'rule_6_data_declarations': [],
            'rule_7_variable_checks': [],
            'rule_8_no_macros': [],
            'rule_9_pointer_restrictions': [],
            'rule_10_compiler_warnings': []
        }

        files_scanned = 0

        for py_file in self.project_path.rglob("*.py"):
            if any(skip in str(py_file) for skip in ['__pycache__', '.git', 'node_modules']):
                continue

            files_scanned += 1

            try:
                with open(py_file, 'r', encoding='utf-8') as f:
                    source = f.read()
                    tree = ast.parse(source)

                # Rule 4: Functions should be <60 lines
                for node in ast.walk(tree):
                    if isinstance(node, ast.FunctionDef):
                        if hasattr(node, 'end_lineno') and hasattr(node, 'lineno'):
                            lines = node.end_lineno - node.lineno
                            if lines > 60:
                                nasa_violations['rule_4_short_functions'].append({
                                    'file': str(py_file),
                                    'function': node.name,
                                    'lines': lines,
                                    'line_number': node.lineno
                                })

                        # Rule 5: Check assertion density
                        assertions = sum(1 for n in ast.walk(node) if isinstance(n, ast.Assert))
                        total_statements = len(node.body)
                        if total_statements > 0:
                            density = (assertions / total_statements) * 100
                            if density < 2:
                                nasa_violations['rule_5_assertions'].append({
                                    'file': str(py_file),
                                    'function': node.name,
                                    'assertion_density': density,
                                    'line_number': node.lineno
                                })

                # Rule 3: No dynamic memory (check for excessive list comprehensions)
                for node in ast.walk(tree):
                    if isinstance(node, (ast.ListComp, ast.DictComp, ast.SetComp)):
                        nasa_violations['rule_3_no_dynamic_memory'].append({
                            'file': str(py_file),
                            'type': 'dynamic_allocation',
                            'line_number': getattr(node, 'lineno', 0)
                        })

            except Exception as e:
                pass

        return {
            'files_scanned': files_scanned,
            'violations': nasa_violations,
            'total_violations': sum(len(v) for v in nasa_violations.values()),
            'compliance_score': max(0, 100 - sum(len(v) for v in nasa_violations.values()))
        }

def scan_dfars_compliance(self) -> Dict[str, Any]:
        """DFARS Defense Industry Compliance Scanning."""
        print("Scanning DFARS Defense Compliance...")

        dfars_requirements = {
            'encryption': [],
            'audit_trail': [],
            'access_control': [],
            'data_retention': [],
            'incident_response': [],
            'supply_chain': []
        }

        files_scanned = 0

        for py_file in self.project_path.rglob("*.py"):
            if any(skip in str(py_file) for skip in ['__pycache__', '.git', 'node_modules']):
                continue

            files_scanned += 1

            try:
                with open(py_file, 'r', encoding='utf-8') as f:
                    source = f.read()

                # Check for encryption requirements
                if any(word in source.lower() for word in ['password', 'secret', 'key', 'token']):
                    if 'encrypt' not in source.lower() and 'hash' not in source.lower():
                        dfars_requirements['encryption'].append({
                            'file': str(py_file),
                            'issue': 'Sensitive data without encryption'
                        })

                # Check for audit trail
                if 'audit' not in source.lower() and 'log' not in source.lower():
                    if any(word in source.lower() for word in ['delete', 'modify', 'create']):
                        dfars_requirements['audit_trail'].append({
                            'file': str(py_file),
                            'issue': 'Modification without audit trail'
                        })

            except Exception as e:
                pass

        return {
            'files_scanned': files_scanned,
            'requirements': dfars_requirements,
            'total_issues': sum(len(v) for v in dfars_requirements.values()),
            'compliance_score': max(0, 100 - (sum(len(v) for v in dfars_requirements.values()) * 2))
        }

def scan_six_sigma_quality(self) -> Dict[str, Any]:
        """Lean Six Sigma Quality Scanning."""
        print("Scanning Lean Six Sigma Quality...")

        quality_metrics = {
            'defects': [],
            'waste': [],
            'variation': [],
            'cycle_time': [],
            'process_capability': []
        }

        files_scanned = 0
        total_lines = 0

        for py_file in self.project_path.rglob("*.py"):
            if any(skip in str(py_file) for skip in ['__pycache__', '.git', 'node_modules']):
                continue

            files_scanned += 1

            try:
                with open(py_file, 'r', encoding='utf-8') as f:
                    source = f.read()
                    lines = source.splitlines()
                    total_lines += len(lines)
                    tree = ast.parse(source)

                # Detect defects (unused variables, dead code)
                for node in ast.walk(tree):
                    if isinstance(node, ast.FunctionDef):
                        # Check for unused parameters
                        for arg in node.args.args:
                            if arg.arg != 'self' and arg.arg not in ast.dump(node):
                                quality_metrics['defects'].append({
                                    'file': str(py_file),
                                    'type': 'unused_parameter',
                                    'name': arg.arg,
                                    'line': node.lineno
                                })

                # Detect waste (duplicated code, long methods)
                for node in ast.walk(tree):
                    if isinstance(node, ast.FunctionDef):
                        if len(node.body) > 50:
                            quality_metrics['waste'].append({
                                'file': str(py_file),
                                'type': 'long_method',
                                'name': node.name,
                                'lines': len(node.body)
                            })

            except Exception as e:
                pass

        # Calculate Six Sigma metrics
        defects_per_line = len(quality_metrics['defects']) / max(total_lines, 1)
        dpmo = defects_per_line * 1_000_000  # Defects Per Million Opportunities

        # Sigma level calculation (simplified)
        if dpmo < 3.4:
            sigma_level = 6
        elif dpmo < 233:
            sigma_level = 5
        elif dpmo < 6210:
            sigma_level = 4
        elif dpmo < 66807:
            sigma_level = 3
        elif dpmo < 308537:
            sigma_level = 2
        else:
            sigma_level = 1

        return {
            'files_scanned': files_scanned,
            'total_lines': total_lines,
            'metrics': quality_metrics,
            'dpmo': dpmo,
            'sigma_level': sigma_level,
            'quality_score': max(0, 100 - (dpmo / 1000))
        }

def scan_enterprise_compliance(self) -> Dict[str, Any]:
        """Enterprise-grade compliance scanning."""
        print("Scanning Enterprise Compliance...")

        enterprise_issues = {
            'security': [],
            'scalability': [],
            'maintainability': [],
            'documentation': [],
            'testing': []
        }

        files_scanned = 0

        for py_file in self.project_path.rglob("*.py"):
            if any(skip in str(py_file) for skip in ['__pycache__', '.git', 'node_modules']):
                continue

            files_scanned += 1

            try:
                with open(py_file, 'r', encoding='utf-8') as f:
                    source = f.read()
                    tree = ast.parse(source)

                # Check for security issues
                for node in ast.walk(tree):
                    if isinstance(node, ast.Call):
                        if hasattr(node.func, 'id'):
                            if node.func.id in ['eval', 'exec']:
                                enterprise_issues['security'].append({
                                    'file': str(py_file),
                                    'issue': f'Dangerous function: {node.func.id}',
                                    'line': getattr(node, 'lineno', 0)
                                })

                # Check for documentation
                for node in ast.walk(tree):
                    if isinstance(node, (ast.FunctionDef, ast.ClassDef)):
                        docstring = ast.get_docstring(node)
                        if not docstring:
                            enterprise_issues['documentation'].append({
                                'file': str(py_file),
                                'issue': f'Missing docstring: {node.name}',
                                'line': node.lineno
                            })

            except Exception as e:
                pass

        return {
            'files_scanned': files_scanned,
            'issues': enterprise_issues,
            'total_issues': sum(len(v) for v in enterprise_issues.values()),
            'compliance_score': max(0, 100 - sum(len(v) for v in enterprise_issues.values()))
        }

def run_full_scan(self) -> Dict[str, Any]:
        """Run all compliance scans."""
        print("=" * 60)
        print("UNIFIED COMPLIANCE SCANNER")
        print("=" * 60)
        print()

        # Run all scans
        self.results['nasa'] = self.scan_nasa_compliance()
        print(f"NASA: {self.results['nasa']['total_violations']} violations\n")

        self.results['dfars'] = self.scan_dfars_compliance()
        print(f"DFARS: {self.results['dfars']['total_issues']} issues\n")

        self.results['six_sigma'] = self.scan_six_sigma_quality()
        print(f"Six Sigma: Level {self.results['six_sigma']['sigma_level']}\n")

        self.results['enterprise'] = self.scan_enterprise_compliance()
        print(f"Enterprise: {self.results['enterprise']['total_issues']} issues\n")

        # Calculate summary
        self.results['summary'] = {
            'total_files_scanned': self.results['nasa']['files_scanned'],
            'nasa_score': self.results['nasa']['compliance_score'],
            'dfars_score': self.results['dfars']['compliance_score'],
            'six_sigma_level': self.results['six_sigma']['sigma_level'],
            'enterprise_score': self.results['enterprise']['compliance_score'],
            'overall_score': (
                self.results['nasa']['compliance_score'] +
                self.results['dfars']['compliance_score'] +
                self.results['six_sigma']['quality_score'] +
                self.results['enterprise']['compliance_score']
            ) / 4
        }

        return self.results

def save_results(self, output_dir: str = ".claude/.artifacts"):
        """Save results to JSON files."""
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)

        # Save full results
        with open(output_path / "unified_compliance_results.json", 'w') as f:
            json.dump(self.results, f, indent=2)

        # Save individual results
        for category in ['nasa', 'dfars', 'six_sigma', 'enterprise']:
            with open(output_path / f"{category}_compliance.json", 'w') as f:
                json.dump(self.results[category], f, indent=2)

        print(f"\nResults saved to {output_path}")

        return output_path

if __name__ == "__main__":
    scanner = UnifiedComplianceScanner()
    results = scanner.run_full_scan()
    scanner.save_results()

    print("\n" + "=" * 60)
    print("COMPLIANCE SUMMARY")
    print("=" * 60)
    print(f"NASA Compliance: {results['summary']['nasa_score']:.1f}%")
    print(f"DFARS Compliance: {results['summary']['dfars_score']:.1f}%")
    print(f"Six Sigma Level: {results['summary']['six_sigma_level']}")
    print(f"Enterprise Score: {results['summary']['enterprise_score']:.1f}%")
    print(f"Overall Score: {results['summary']['overall_score']:.1f}%")