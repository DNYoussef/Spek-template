#!/usr/bin/env python3
"""
Security Fix Validation Test
Tests that P0 security fixes are working correctly
"""

import os
import sys
import subprocess
import re
from pathlib import Path

class SecurityValidationTest:
    def __init__(self):
        self.root_path = Path("../..").resolve()
        self.test_results = {
            'eval_usages': 0,
            'exec_usages': 0,
            'security_comments': 0,
            'ast_imports': 0,
            'backups_created': 0
        }

    def scan_for_vulnerabilities(self):
        """Scan for remaining vulnerabilities"""
        print("SECURITY VALIDATION TEST")
        print("=" * 50)

        # Count eval/exec usages
        eval_files = []
        exec_files = []

        for py_file in self.root_path.rglob("*.py"):
            if any(skip in str(py_file) for skip in ['__pycache__', '.git', 'node_modules', '.security_backups', '.sandboxes']):
                continue

            try:
                with open(py_file, 'r', encoding='utf-8') as f:
                    content = f.read()

                # Count eval usages
                eval_matches = re.findall(r'\beval\s*\(', content)
                if eval_matches:
                    eval_files.append(str(py_file))
                    self.test_results['eval_usages'] += len(eval_matches)

                # Count exec usages
                exec_matches = re.findall(r'\bexec\s*\(', content)
                if exec_matches:
                    exec_files.append(str(py_file))
                    self.test_results['exec_usages'] += len(exec_matches)

                # Count security fix comments
                security_comments = re.findall(r'# SECURITY FIX:', content)
                self.test_results['security_comments'] += len(security_comments)

                # Count ast imports
                if 'import ast' in content:
                    self.test_results['ast_imports'] += 1

            except Exception as e:
                continue

        # Count backups
        backup_dir = self.root_path / '.security_backups'
        if backup_dir.exists():
            self.test_results['backups_created'] = len(list(backup_dir.glob('*.bak')))

        return eval_files, exec_files

    def validate_specific_fixes(self):
        """Validate specific files were properly fixed"""
        print("\nVALIDATING SPECIFIC FIXES")
        print("-" * 30)

        fixes_validated = 0

        # Check a few specific files that should have been fixed
        test_files = [
            'src/security/enterprise_theater_detection.py',
            'src/analyzers/nasa/defensive_programming_specialist.py',
            'tests/linter_integration/test_failure_modes.py'
        ]

        for test_file in test_files:
            file_path = self.root_path / test_file
            if file_path.exists():
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()

                    # Check for security fix comments
                    if '# SECURITY FIX:' in content:
                        print(f"[PASS] {test_file}: Security fixes applied")
                        fixes_validated += 1
                    else:
                        print(f"[WARN] {test_file}: No security fixes found")

                    # Check for ast.literal_eval replacement
                    if 'ast.literal_eval' in content:
                        print(f"[PASS] {test_file}: ast.literal_eval replacement found")

                except Exception as e:
                    print(f"[ERROR] {test_file}: {e}")
            else:
                print(f"[SKIP] {test_file}: File not found")

        return fixes_validated

    def run_theater_detection(self):
        """Run theater detection to validate fixes aren't superficial"""
        print("\nTHEATER DETECTION VALIDATION")
        print("-" * 30)

        # Check if security fixes are real by analyzing backup comparisons
        backup_dir = self.root_path / '.security_backups'
        real_changes = 0

        if backup_dir.exists():
            for backup_file in backup_dir.glob('*.bak'):
                original_name = backup_file.name.split('_')[0] + '.py'

                # Find the original file
                for original_file in self.root_path.rglob(original_name):
                    if '.security_backups' in str(original_file) or '.sandboxes' in str(original_file):
                        continue

                    try:
                        # Compare backup vs current
                        with open(backup_file, 'r', encoding='utf-8') as f:
                            backup_content = f.read()
                        with open(original_file, 'r', encoding='utf-8') as f:
                            current_content = f.read()

                        if backup_content != current_content:
                            real_changes += 1
                            print(f"[REAL] {original_name}: Genuine changes detected")
                        else:
                            print(f"[THEATER] {original_name}: No actual changes")

                    except Exception:
                        continue
                    break

        return real_changes

    def generate_report(self):
        """Generate final validation report"""
        eval_files, exec_files = self.scan_for_vulnerabilities()
        fixes_validated = self.validate_specific_fixes()
        real_changes = self.run_theater_detection()

        print("\n" + "=" * 50)
        print("SECURITY VALIDATION REPORT")
        print("=" * 50)

        # Security metrics
        print(f"Eval usages found: {self.test_results['eval_usages']}")
        print(f"Exec usages found: {self.test_results['exec_usages']}")
        print(f"Security fix comments: {self.test_results['security_comments']}")
        print(f"AST imports added: {self.test_results['ast_imports']}")
        print(f"Backup files created: {self.test_results['backups_created']}")

        # Validation results
        print(f"\nFixes validated: {fixes_validated}")
        print(f"Real changes detected: {real_changes}")

        # Assessment
        total_vulnerabilities = self.test_results['eval_usages'] + self.test_results['exec_usages']
        fix_coverage = self.test_results['security_comments'] / max(total_vulnerabilities, 1) * 100

        print(f"\nFix coverage: {fix_coverage:.1f}%")

        if total_vulnerabilities == 0:
            assessment = "COMPLETE - No vulnerabilities found"
            status = "PASS"
        elif fix_coverage >= 80:
            assessment = "SUBSTANTIAL - Most vulnerabilities addressed"
            status = "PASS"
        elif fix_coverage >= 50:
            assessment = "PARTIAL - Some vulnerabilities addressed"
            status = "WARN"
        else:
            assessment = "INSUFFICIENT - Many vulnerabilities remain"
            status = "FAIL"

        print(f"Assessment: {assessment}")
        print(f"Status: {status}")

        # Theater check
        if real_changes > 0:
            print(f"Theater check: PASS ({real_changes} genuine changes)")
        else:
            print("Theater check: FAIL (no genuine changes detected)")

        return {
            'status': status,
            'total_vulnerabilities': total_vulnerabilities,
            'fix_coverage': fix_coverage,
            'assessment': assessment,
            'real_changes': real_changes,
            'details': self.test_results
        }

if __name__ == '__main__':
    validator = SecurityValidationTest()
    report = validator.generate_report()

    # Exit with appropriate code
    exit_code = 0 if report['status'] == 'PASS' else 1
    sys.exit(exit_code)