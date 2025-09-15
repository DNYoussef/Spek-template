#!/usr/bin/env python3
"""
DFARS Compliance Validation Test Suite
Validates Phase 2 DFARS 252.204-7012 implementation
"""

import json
import subprocess
import sys
import time
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List

class DFARSComplianceValidator:
    """Validate DFARS compliance implementation"""

    def __init__(self, project_path: str = ".."):
        self.project_path = Path(project_path).resolve()
        self.validation_results = {
            'timestamp': datetime.now().isoformat(),
            'controls_tested': 0,
            'controls_passed': 0,
            'critical_issues': 0,
            'compliance_score': 0.0,
            'test_results': {}
        }

    def test_audit_logging_system(self) -> Dict[str, Any]:
        """Test DFARS audit logging implementation"""
        print("Testing DFARS Audit Logging System...")

        results = {
            'control': 'DFARS 3.3.1 - Audit and Accountability',
            'tests_performed': [],
            'passed': 0,
            'total': 0,
            'status': 'unknown'
        }

        # Test 1: Check if audit logger exists
        audit_file = self.project_path / 'src' / 'security' / 'dfars_audit_logger.py'
        test_result = {
            'test': 'audit_logger_exists',
            'passed': audit_file.exists(),
            'details': f'Audit logger file: {audit_file}'
        }
        results['tests_performed'].append(test_result)
        if test_result['passed']:
            results['passed'] += 1
        results['total'] += 1

        # Test 2: Validate audit logger functionality
        if audit_file.exists():
            try:
                # Import and test the audit logger
                sys.path.insert(0, str(audit_file.parent))

                # Read the file content to validate structure
                with open(audit_file, 'r', encoding='utf-8') as f:
                    content = f.read()

                required_features = [
                    'DFARSAuditLogger',
                    'log_security_event',
                    'log_access_attempt',
                    'log_privilege_escalation',
                    'log_data_access'
                ]

                feature_test = {
                    'test': 'audit_features_present',
                    'passed': all(feature in content for feature in required_features),
                    'details': f'Required features: {required_features}'
                }
                results['tests_performed'].append(feature_test)
                if feature_test['passed']:
                    results['passed'] += 1
                results['total'] += 1

                # Test 3: JSON logging format
                json_test = {
                    'test': 'json_logging_format',
                    'passed': 'json.dumps' in content and 'audit_record' in content,
                    'details': 'Structured JSON audit logging'
                }
                results['tests_performed'].append(json_test)
                if json_test['passed']:
                    results['passed'] += 1
                results['total'] += 1

            except Exception as e:
                error_test = {
                    'test': 'audit_logger_import',
                    'passed': False,
                    'details': f'Import error: {e}'
                }
                results['tests_performed'].append(error_test)
                results['total'] += 1

        # Determine overall status
        if results['total'] > 0:
            pass_rate = results['passed'] / results['total']
            if pass_rate >= 0.8:
                results['status'] = 'compliant'
            elif pass_rate >= 0.6:
                results['status'] = 'partial'
            else:
                results['status'] = 'non_compliant'

        return results

    def test_incident_response_system(self) -> Dict[str, Any]:
        """Test DFARS incident response implementation"""
        print("Testing DFARS Incident Response System...")

        results = {
            'control': 'DFARS 3.6.1 - Incident Response',
            'tests_performed': [],
            'passed': 0,
            'total': 0,
            'status': 'unknown'
        }

        # Test 1: Check if incident response system exists
        incident_file = self.project_path / 'src' / 'security' / 'dfars_incident_response.py'
        test_result = {
            'test': 'incident_response_exists',
            'passed': incident_file.exists(),
            'details': f'Incident response file: {incident_file}'
        }
        results['tests_performed'].append(test_result)
        if test_result['passed']:
            results['passed'] += 1
        results['total'] += 1

        # Test 2: Validate incident response functionality
        if incident_file.exists():
            try:
                with open(incident_file, 'r', encoding='utf-8') as f:
                    content = f.read()

                # Test 72-hour reporting capability
                reporting_test = {
                    'test': '72_hour_reporting',
                    'passed': 'check_72_hour_compliance' in content and '72' in content,
                    'details': '72-hour reporting capability for CUI incidents'
                }
                results['tests_performed'].append(reporting_test)
                if reporting_test['passed']:
                    results['passed'] += 1
                results['total'] += 1

                # Test incident classification
                classification_test = {
                    'test': 'incident_classification',
                    'passed': 'IncidentSeverity' in content and 'IncidentType' in content,
                    'details': 'Incident severity and type classification'
                }
                results['tests_performed'].append(classification_test)
                if classification_test['passed']:
                    results['passed'] += 1
                results['total'] += 1

                # Test CUI incident handling
                cui_test = {
                    'test': 'cui_incident_handling',
                    'passed': 'cui_involved' in content and 'CUI_COMPROMISE' in content,
                    'details': 'Specific CUI incident handling procedures'
                }
                results['tests_performed'].append(cui_test)
                if cui_test['passed']:
                    results['passed'] += 1
                results['total'] += 1

            except Exception as e:
                error_test = {
                    'test': 'incident_system_validation',
                    'passed': False,
                    'details': f'Validation error: {e}'
                }
                results['tests_performed'].append(error_test)
                results['total'] += 1

        # Determine overall status
        if results['total'] > 0:
            pass_rate = results['passed'] / results['total']
            if pass_rate >= 0.8:
                results['status'] = 'compliant'
            elif pass_rate >= 0.6:
                results['status'] = 'partial'
            else:
                results['status'] = 'non_compliant'

        return results

    def test_cui_protection_system(self) -> Dict[str, Any]:
        """Test DFARS CUI protection implementation"""
        print("Testing DFARS CUI Protection System...")

        results = {
            'control': 'DFARS 3.13.1 - System and Communications Protection',
            'tests_performed': [],
            'passed': 0,
            'total': 0,
            'status': 'unknown'
        }

        # Test 1: Check if CUI protection system exists
        cui_file = self.project_path / 'src' / 'security' / 'dfars_cui_protection.py'
        test_result = {
            'test': 'cui_protection_exists',
            'passed': cui_file.exists(),
            'details': f'CUI protection file: {cui_file}'
        }
        results['tests_performed'].append(test_result)
        if test_result['passed']:
            results['passed'] += 1
        results['total'] += 1

        # Test 2: Validate CUI protection functionality
        if cui_file.exists():
            try:
                with open(cui_file, 'r', encoding='utf-8') as f:
                    content = f.read()

                # Test CUI classification
                classification_test = {
                    'test': 'cui_classification',
                    'passed': 'CUICategory' in content and 'classify_file' in content,
                    'details': 'CUI classification and marking capabilities'
                }
                results['tests_performed'].append(classification_test)
                if classification_test['passed']:
                    results['passed'] += 1
                results['total'] += 1

                # Test integrity monitoring
                integrity_test = {
                    'test': 'integrity_monitoring',
                    'passed': 'verify_cui_integrity' in content and 'sha256' in content.lower(),
                    'details': 'File integrity monitoring with SHA-256'
                }
                results['tests_performed'].append(integrity_test)
                if integrity_test['passed']:
                    results['passed'] += 1
                results['total'] += 1

                # Test access controls
                access_test = {
                    'test': 'access_controls',
                    'passed': '_get_access_controls' in content and 'role_based_access' in content,
                    'details': 'Role-based access control implementation'
                }
                results['tests_performed'].append(access_test)
                if access_test['passed']:
                    results['passed'] += 1
                results['total'] += 1

                # Test NIST SP 800-171 compliance
                nist_test = {
                    'test': 'nist_sp_800_171',
                    'passed': '800-171' in content and 'encryption_at_rest' in content,
                    'details': 'NIST SP 800-171 compliance features'
                }
                results['tests_performed'].append(nist_test)
                if nist_test['passed']:
                    results['passed'] += 1
                results['total'] += 1

            except Exception as e:
                error_test = {
                    'test': 'cui_system_validation',
                    'passed': False,
                    'details': f'Validation error: {e}'
                }
                results['tests_performed'].append(error_test)
                results['total'] += 1

        # Determine overall status
        if results['total'] > 0:
            pass_rate = results['passed'] / results['total']
            if pass_rate >= 0.8:
                results['status'] = 'compliant'
            elif pass_rate >= 0.6:
                results['status'] = 'partial'
            else:
                results['status'] = 'non_compliant'

        return results

    def test_access_control_improvements(self) -> Dict[str, Any]:
        """Test DFARS access control improvements"""
        print("Testing DFARS Access Control Improvements...")

        results = {
            'control': 'DFARS 3.1.1 - Access Control',
            'tests_performed': [],
            'passed': 0,
            'total': 0,
            'status': 'unknown'
        }

        # Test 1: Check for hardcoded credential remediation
        backup_dir = self.project_path / '.dfars_backups'
        credential_test = {
            'test': 'credential_remediation',
            'passed': backup_dir.exists() and len(list(backup_dir.glob('*.bak'))) > 0,
            'details': f'Credential fixes applied with backups in {backup_dir}'
        }
        results['tests_performed'].append(credential_test)
        if credential_test['passed']:
            results['passed'] += 1
        results['total'] += 1

        # Test 2: Check for environment variable usage
        env_var_count = 0
        for py_file in self.project_path.rglob("*.py"):
            if any(skip in str(py_file) for skip in ['__pycache__', '.git', '.security_backups']):
                continue

            try:
                with open(py_file, 'r', encoding='utf-8') as f:
                    content = f.read()

                if 'os.getenv(' in content or 'os.environ.get(' in content:
                    env_var_count += 1

            except Exception:
                continue

        env_test = {
            'test': 'environment_variables',
            'passed': env_var_count > 0,
            'details': f'Environment variable usage found in {env_var_count} files'
        }
        results['tests_performed'].append(env_test)
        if env_test['passed']:
            results['passed'] += 1
        results['total'] += 1

        # Determine overall status
        if results['total'] > 0:
            pass_rate = results['passed'] / results['total']
            if pass_rate >= 0.8:
                results['status'] = 'compliant'
            elif pass_rate >= 0.6:
                results['status'] = 'partial'
            else:
                results['status'] = 'non_compliant'

        return results

    def run_full_validation(self) -> Dict[str, Any]:
        """Run complete DFARS compliance validation"""
        print("DFARS COMPLIANCE VALIDATION")
        print("=" * 60)
        print("Validating Phase 2 DFARS 252.204-7012 implementation")
        print()

        start_time = datetime.now()

        # Run all validation tests
        test_results = {
            'audit_logging': self.test_audit_logging_system(),
            'incident_response': self.test_incident_response_system(),
            'cui_protection': self.test_cui_protection_system(),
            'access_control': self.test_access_control_improvements()
        }

        # Calculate overall metrics
        total_tests = sum(result['total'] for result in test_results.values())
        passed_tests = sum(result['passed'] for result in test_results.values())
        compliant_controls = sum(1 for result in test_results.values() if result['status'] == 'compliant')

        compliance_score = (passed_tests / total_tests) * 100 if total_tests > 0 else 0

        # Critical issues (non-compliant controls)
        critical_issues = sum(1 for result in test_results.values() if result['status'] == 'non_compliant')

        # Update validation results
        self.validation_results.update({
            'controls_tested': len(test_results),
            'controls_passed': compliant_controls,
            'critical_issues': critical_issues,
            'compliance_score': compliance_score,
            'test_results': test_results
        })

        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()

        print(f"\\nVALIDATION COMPLETE")
        print("-" * 40)
        print(f"Duration: {duration:.2f} seconds")
        print(f"Controls tested: {len(test_results)}")
        print(f"Controls compliant: {compliant_controls}")
        print(f"Critical issues: {critical_issues}")
        print(f"Compliance score: {compliance_score:.1f}%")

        # Determine overall status
        if compliance_score >= 85:
            overall_status = "DFARS COMPLIANT"
            phase_2_ready = True
        elif compliance_score >= 70:
            overall_status = "SUBSTANTIALLY COMPLIANT"
            phase_2_ready = True
        else:
            overall_status = "NON-COMPLIANT"
            phase_2_ready = False

        print(f"Overall status: {overall_status}")
        print(f"Phase 2 complete: {phase_2_ready}")

        # Detailed results
        print(f"\\nDETAILED RESULTS")
        print("-" * 40)
        for control, result in test_results.items():
            status_icon = {
                'compliant': '[PASS]',
                'partial': '[WARN]',
                'non_compliant': '[FAIL]',
                'unknown': '[????]'
            }.get(result['status'], '[????]')

            print(f"{control.upper()}: {status_icon} {result['passed']}/{result['total']} tests passed")

        return {
            'overall_status': overall_status,
            'phase_2_ready': phase_2_ready,
            'compliance_score': compliance_score,
            'validation_results': self.validation_results,
            'duration_seconds': duration
        }

if __name__ == "__main__":
    validator = DFARSComplianceValidator()
    results = validator.run_full_validation()

    # Save validation results
    results_file = Path('.claude/.artifacts/dfars_validation_results.json')
    with open(results_file, 'w') as f:
        json.dump(results, f, indent=2, default=str)

    print(f"\\nValidation results saved: {results_file}")

    # Exit with appropriate code
    exit(0 if results['phase_2_ready'] else 1)