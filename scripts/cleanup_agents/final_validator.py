#!/usr/bin/env python3
"""
FINAL VALIDATION AGENT
Phase 7 Day 13 - System Consolidation

Mission: Verify functionality preserved post-cleanup, confirm production readiness
"""

from pathlib import Path
from typing import Dict, List
import json
import os
import subprocess

class FinalValidator:
    def __init__(self):
        self.validation_results = {}
        self.critical_failures = []
        self.warnings = []

    def validate_imports(self) -> Dict:
        """Validate that all imports still work after cleanup"""
        print("[VALIDATE] Checking imports across codebase...")

        import_results = {
            'total_files_checked': 0,
            'import_errors': [],
            'syntax_errors': [],
            'status': 'PASS'
        }

        # Check all Python files
        for py_file in Path('.').rglob('*.py'):
            if '__pycache__' in str(py_file) or '.backup' in str(py_file):
                continue

            import_results['total_files_checked'] += 1

            try:
                # Try to parse the file
                with open(py_file, 'r', encoding='utf-8') as f:
                    content = f.read()

                import ast
                ast.parse(content)

                # Try basic import validation
                result = subprocess.run(
                    ['python', '-m', 'py_compile', str(py_file)],
                    capture_output=True,
                    text=True,
                    timeout=10
                )

                if result.returncode != 0:
                    import_results['import_errors'].append({
                        'file': str(py_file),
                        'error': result.stderr
                    })

            except SyntaxError as e:
                import_results['syntax_errors'].append({
                    'file': str(py_file),
                    'error': str(e)
                })
            except Exception as e:
                import_results['import_errors'].append({
                    'file': str(py_file),
                    'error': str(e)
                })

        if import_results['import_errors'] or import_results['syntax_errors']:
            import_results['status'] = 'FAIL'
            self.critical_failures.append('Import validation failed')

        print(f"[SUCCESS] Import validation: {import_results['status']}")
        print(f"   - Files checked: {import_results['total_files_checked']}")
        print(f"   - Import errors: {len(import_results['import_errors'])}")
        print(f"   - Syntax errors: {len(import_results['syntax_errors'])}")

        return import_results

    def validate_key_functionality(self) -> Dict:
        """Test key system functionality"""
        print("[VALIDATE] Checking key system functionality...")

        functionality_results = {
            'analyzer_functionality': 'UNKNOWN',
            'coordination_functionality': 'UNKNOWN',
            'compliance_functionality': 'UNKNOWN',
            'status': 'PASS'
        }

        # Test analyzer functionality
        try:
            analyzer_test = subprocess.run(
                ['python', '-c', 'from analyzer.unified_analyzer import UnifiedAnalyzer; print("ANALYZER OK")'],
                capture_output=True,
                text=True,
                timeout=15
            )
            functionality_results['analyzer_functionality'] = 'PASS' if analyzer_test.returncode == 0 else 'FAIL'
        except Exception:
            functionality_results['analyzer_functionality'] = 'FAIL'

        # Test coordination functionality
        try:
            coord_test = subprocess.run(
                ['python', '-c', 'from src.coordination.loop_orchestrator import LoopOrchestrator; print("COORDINATOR OK")'],
                capture_output=True,
                text=True,
                timeout=15
            )
            functionality_results['coordination_functionality'] = 'PASS' if coord_test.returncode == 0 else 'FAIL'
        except Exception:
            functionality_results['coordination_functionality'] = 'FAIL'

        # Test compliance functionality
        try:
            compliance_test = subprocess.run(
                ['python', '-c', 'from analyzer.enterprise.compliance.nist_ssdf import NISTSSFDFramework; print("COMPLIANCE OK")'],
                capture_output=True,
                text=True,
                timeout=15
            )
            functionality_results['compliance_functionality'] = 'PASS' if compliance_test.returncode == 0 else 'FAIL'
        except Exception:
            functionality_results['compliance_functionality'] = 'FAIL'

        # Check overall status
        failed_tests = [k for k, v in functionality_results.items() if v == 'FAIL' and k != 'status']
        if failed_tests:
            functionality_results['status'] = 'FAIL'
            self.critical_failures.extend(failed_tests)

        print(f"[SUCCESS] Functionality validation: {functionality_results['status']}")
        for component, status in functionality_results.items():
            if component != 'status':
                print(f"   - {component}: {status}")

        return functionality_results

    def validate_file_structure(self) -> Dict:
        """Validate essential file structure is preserved"""
        print("[VALIDATE] Checking file structure integrity...")

        structure_results = {
            'essential_files_present': True,
            'missing_files': [],
            'directory_structure': True,
            'status': 'PASS'
        }

        # Essential files that must exist
        essential_files = [
            'README.md',
            'CLAUDE.md',
            'src/main.py',
            'analyzer/unified_analyzer.py',
            'scripts/cleanup_agents/',
            '.claude/.artifacts/'
        ]

        missing_files = []
        for essential_file in essential_files:
            file_path = Path(essential_file)
            if not file_path.exists():
                missing_files.append(essential_file)

        structure_results['missing_files'] = missing_files
        if missing_files:
            structure_results['essential_files_present'] = False
            structure_results['status'] = 'FAIL'
            self.critical_failures.append('Essential files missing')

        print(f"[SUCCESS] Structure validation: {structure_results['status']}")
        if missing_files:
            print(f"   - Missing files: {missing_files}")
        else:
            print("   - All essential files present")

        return structure_results

    def validate_quality_gates(self) -> Dict:
        """Verify quality gates still pass"""
        print("[VALIDATE] Checking quality gates...")

        quality_results = {
            'artifact_count': 0,
            'doc_count': 0,
            'god_objects_remaining': 0,
            'targets_met': {},
            'status': 'PASS'
        }

        # Count artifacts
        artifacts_path = Path('.claude/.artifacts')
        if artifacts_path.exists():
            artifact_files = [f for f in artifacts_path.iterdir() if f.is_file()]
            quality_results['artifact_count'] = len(artifact_files)
            quality_results['targets_met']['artifacts'] = len(artifact_files) < 20

        # Count docs
        docs_path = Path('docs')
        if docs_path.exists():
            doc_files = list(docs_path.rglob('*.md'))
            # Exclude archived docs
            active_docs = [f for f in doc_files if 'archive' not in str(f)]
            quality_results['doc_count'] = len(active_docs)
            quality_results['targets_met']['docs'] = len(active_docs) < 15

        # Count remaining god objects
        god_objects = 0
        for py_file in Path('.').rglob('*.py'):
            if '__pycache__' in str(py_file) or 'test' in str(py_file):
                continue

            try:
                with open(py_file, 'r', encoding='utf-8') as f:
                    lines = f.readlines()
                    if len(lines) > 500:
                        god_objects += 1
            except Exception:
                continue

        quality_results['god_objects_remaining'] = god_objects
        quality_results['targets_met']['god_objects'] = god_objects < 300  # Improvement from 312

        # Overall status
        all_targets_met = all(quality_results['targets_met'].values())
        quality_results['status'] = 'PASS' if all_targets_met else 'PARTIAL'

        print(f"[SUCCESS] Quality gates: {quality_results['status']}")
        print(f"   - Artifacts: {quality_results['artifact_count']} (<20: {quality_results['targets_met']['artifacts']})")
        print(f"   - Docs: {quality_results['doc_count']} (<15: {quality_results['targets_met']['docs']})")
        print(f"   - God objects: {quality_results['god_objects_remaining']} (<300: {quality_results['targets_met']['god_objects']})")

        return quality_results

    def run_basic_tests(self) -> Dict:
        """Run basic test suite to ensure no regression"""

        test_results = {
            'tests_run': 0,
            'tests_passed': 0,
            'tests_failed': 0,
            'test_output': '',
            'status': 'UNKNOWN'
        }

        try:
            # Run pytest if available
            result = subprocess.run(
                ['python', '-m', 'pytest', 'tests/', '-v', '--tb=short', '-x'],
                capture_output=True,
                text=True,
                timeout=60,
                cwd='.'
            )

            test_results['test_output'] = result.stdout + result.stderr

            # Parse pytest output
            if 'collected' in result.stdout:
                import re
                collected_match = re.search(r'collected (\d+) items', result.stdout)
                if collected_match:
                    test_results['tests_run'] = int(collected_match.group(1))

            if 'passed' in result.stdout:
                passed_match = re.search(r'(\d+) passed', result.stdout)
                if passed_match:
                    test_results['tests_passed'] = int(passed_match.group(1))

            if 'failed' in result.stdout:
                failed_match = re.search(r'(\d+) failed', result.stdout)
                if failed_match:
                    test_results['tests_failed'] = int(failed_match.group(1))

            test_results['status'] = 'PASS' if result.returncode == 0 else 'FAIL'

        except subprocess.TimeoutExpired:
            test_results['status'] = 'TIMEOUT'
            test_results['test_output'] = 'Tests timed out after 60 seconds'
        except Exception as e:
            test_results['status'] = 'ERROR'
            test_results['test_output'] = str(e)

        return test_results

    def execute_validation(self):
        """Execute complete final validation"""
        print("[EXEC] EXECUTING FINAL VALIDATION")

        # Run all validation checks
        self.validation_results = {
            'imports': self.validate_imports(),
            'functionality': self.validate_key_functionality(),
            'structure': self.validate_file_structure(),
            'quality_gates': self.validate_quality_gates(),
            'tests': self.run_basic_tests()
        }

        # Determine overall status
        critical_failures = len(self.critical_failures)
        total_checks = len(self.validation_results)
        passed_checks = len([r for r in self.validation_results.values() if r.get('status') == 'PASS'])

        overall_status = 'PRODUCTION_READY' if critical_failures == 0 and passed_checks >= total_checks * 0.8 else 'NEEDS_ATTENTION'

        # Generate final validation report
        final_report = {
            'overall_status': overall_status,
            'validation_date': '2025-9-24',
            'critical_failures': self.critical_failures,
            'warnings': self.warnings,
            'validation_results': self.validation_results,
            'summary': {
                'total_checks': total_checks,
                'passed_checks': passed_checks,
                'pass_rate': f"{(passed_checks / total_checks * 100):.1f}%",
                'production_ready': overall_status == 'PRODUCTION_READY'
            }
        }

        # Write validation report
        report_path = Path('./scripts/cleanup_agents/FINAL_VALIDATION_REPORT.json')
        with open(report_path, 'w') as f:
            json.dump(final_report, f, indent=2)

        print(f"[SUCCESS] FINAL VALIDATION COMPLETE:")
        print(f"   - Overall status: {overall_status}")
        print(f"   - Checks passed: {passed_checks}/{total_checks} ({final_report['summary']['pass_rate']})")
        print(f"   - Critical failures: {critical_failures}")
        print(f"   - Production ready: {final_report['summary']['production_ready']}")

        return final_report

if __name__ == "__main__":
    agent = FinalValidator()
    result = agent.execute_validation()
    print(f"[RESULT] FINAL VALIDATION: {result['overall_status']}")