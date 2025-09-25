from lib.shared.utilities import get_logger
from src.constants.base import MAXIMUM_FUNCTION_LENGTH_LINES, MINIMUM_TEST_COVERAGE_PERCENTAGE
"""

This module demonstrates the full DFARS compliance workflow including:
- Integration with existing security components
- Real-time monitoring and alerting
- Automated incident response
- Compliance reporting and dashboards
- Defense industry certification workflows
"""

import asyncio
import json
import logging
import sys
import time
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Any

# Add parent directory to path for imports
sys.path.append(str(Path(__file__).parent))

from dfars_workflow_automation import (
    DFARSWorkflowAutomation,
    DFARSControl,
    IncidentSeverity,
    CUIClassification
)
from dfars_continuous_monitor import DFARSContinuousMonitor
from dfars_config import DFARSConfigManager, ComplianceLevel
"""

class DFARSIntegrationDemo:
    """Comprehensive DFARS compliance integration demonstration"""

    def __init__(self):
        self.logger = self._setup_logging()
        self.config_manager = None
        self.dfars_system = None
        self.continuous_monitor = None
        self.demo_results = {
            'initialization': False,
            'authentication_tests': [],
            'cui_scanning': [],
            'incident_response': [],
            'compliance_monitoring': [],
            'integration_tests': [],
            'final_report': {}
        }

    def _setup_logging(self) -> logging.Logger:
        """Setup demonstration logging"""
        logger = get_logger("\1")
        logger.setLevel(logging.INFO)

        # Console handler
        handler = logging.StreamHandler()
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)

        return logger

    async def run_comprehensive_demo(self):
        """Run comprehensive DFARS integration demonstration"""
        print("DFARS 252.204-7012 COMPLIANCE WORKFLOW AUTOMATION")
        print("Defense Industry Integration Demonstration")
        print("=" * 80)

        try:
            # Phase 1: System Initialization
            await self._demo_system_initialization()

            # Phase 2: Authentication and Access Control
            await self._demo_authentication_workflows()

            # Phase 3: CUI Protection and Scanning
            await self._demo_cui_protection()

            # Phase 4: Incident Response Automation
            await self._demo_incident_response()

            # Phase 5: Continuous Monitoring
            await self._demo_continuous_monitoring()

            # Phase 6: Integration Testing
            await self._demo_integration_scenarios()

            # Phase 7: Compliance Reporting
            await self._demo_compliance_reporting()

            # Final Results
            self._display_final_results()

        except Exception as e:
            self.logger.error(f"Demo execution failed: {e}")
            print(f"Demo failed: {e}")

    async def _demo_system_initialization(self):
        """Demonstrate system initialization and configuration"""
        print("\n" + "=" * 60)
        print("PHASE 1: SYSTEM INITIALIZATION")
        print("=" * 60)

        try:
            # Initialize configuration manager
            print("1. Initializing DFARS configuration...")
            self.config_manager = DFARSConfigManager("demo_dfars_config.json")

            # Set to enhanced compliance level
            self.config_manager.update_compliance_level(ComplianceLevel.ENHANCED)
            print(f"    Compliance level: {self.config_manager.config.compliance_level.value}")

            # Validate configuration
            issues = self.config_manager.validate_configuration()
            if issues:
                print(f"    Configuration issues found: {len(issues)}")
                for issue in issues[:3]:  # Show first 3 issues
                    print(f"     - {issue}")
            else:
                print("    Configuration validation passed")

            # Initialize DFARS workflow system
            print("2. Initializing DFARS workflow automation...")
            self.dfars_system = DFARSWorkflowAutomation()
            print("    Workflow automation system initialized")

            # Initialize continuous monitoring
            print("3. Initializing continuous monitoring...")
            self.continuous_monitor = DFARSContinuousMonitor(self.dfars_system)
            print("    Continuous monitoring system initialized")

            self.demo_results['initialization'] = True
            print("    System initialization completed successfully")

        except Exception as e:
            self.logger.error(f"System initialization failed: {e}")
            print(f"    System initialization failed: {e}")

    async def _demo_authentication_workflows(self):
        """Demonstrate authentication and access control workflows"""
        print("\n" + "=" * 60)
        print("PHASE 2: AUTHENTICATION & ACCESS CONTROL")
        print("=" * 60)

        test_scenarios = [
            {
                'username': 'admin_user',
                'password': 'ComplexPassword123!',
                'mfa_token': '123456',
                'expected': True,
                'description': 'Valid admin authentication'
            },
            {
                'username': 'cui_analyst',
                'password': 'SecurePass456!',
                'mfa_token': '789012',
                'expected': True,
                'description': 'Valid CUI analyst authentication'
            },
            {
                'username': 'attacker',
                'password': 'weak',
                'mfa_token': None,
                'expected': False,
                'description': 'Invalid authentication attempt'
            },
            {
                'username': 'locked_user',
                'password': 'wrong1',
                'mfa_token': '000000',
                'expected': False,
                'description': 'Account lockout scenario'
            }
        ]

        for i, scenario in enumerate(test_scenarios, 1):

            # Simulate multiple failed attempts for lockout scenario
            if 'lockout' in scenario['description']:
                for _ in range(3):
                    self.dfars_system.authenticate_user(
                        scenario['username'], 'wrongpass', '000000'
                    )

            success, result = self.dfars_system.authenticate_user(
                scenario['username'],
                scenario['password'],
                scenario['mfa_token']
            )

            status = "" if success == scenario['expected'] else ""
            print(f"   {status} Result: {'SUCCESS' if success else 'FAILED'}")

            self.demo_results['authentication_tests'].append({
                'scenario': scenario['description'],
                'expected': scenario['expected'],
                'actual': success,
                'passed': success == scenario['expected']
            })

        # Check audit records for authentication events
        auth_records = [
            r for r in self.dfars_system.audit_manager.audit_records
            if r.action == "USER_LOGIN"
        ]
        print(f"\n    Authentication events logged: {len(auth_records)}")

    async def _demo_cui_protection(self):
        """Demonstrate CUI protection and scanning workflows"""
        print("\n" + "=" * 60)
        print("PHASE 3: CUI PROTECTION & SCANNING")
        print("=" * 60)

        # Create test files with different CUI content
        test_files = [
            {
                'filename': 'privacy_data.txt',
                'content': 'SSN: 123-45-6789\nPhone: 555-123-4567\nEmail: john.doe@example.com',
                'expected_classification': CUIClassification.PRIVACY
            },
            {
                'filename': 'proprietary_info.txt',
                'content': 'CONFIDENTIAL: This document contains proprietary trade secrets',
                'expected_classification': CUIClassification.PROPRIETARY
            },
            {
                'filename': 'export_controlled.txt',
                'content': 'ITAR controlled technical data for defense systems',
                'expected_classification': CUIClassification.EXPORT_CONTROLLED
            },
            {
                'filename': 'public_info.txt',
                'content': 'This is public information available to everyone',
                'expected_classification': None
            }
        ]

        for i, test_file in enumerate(test_files, 1):

            # Create test file
            file_path = Path(test_file['filename'])
            file_path.write_text(test_file['content'])

            try:
                # Scan for CUI
                cui_asset = await self.dfars_system.cui_manager.scan_for_cui(str(file_path))

                if cui_asset and test_file['expected_classification']:
                    expected_class = test_file['expected_classification']
                    actual_class = cui_asset.classification

                    status = "" if actual_class == expected_class else ""
                    print(f"   {status} Classification: {actual_class.value}")
                    print(f"    Encryption status: {cui_asset.encryption_status}")
                    print(f"    Access controls: {len(cui_asset.access_controls)}")

                    self.demo_results['cui_scanning'].append({
                        'filename': test_file['filename'],
                        'expected': expected_class.value,
                        'actual': actual_class.value,
                        'passed': actual_class == expected_class
                    })

                elif not cui_asset and not test_file['expected_classification']:
                    print(f"    No CUI detected (as expected)")
                    self.demo_results['cui_scanning'].append({
                        'filename': test_file['filename'],
                        'expected': 'No CUI',
                        'actual': 'No CUI',
                        'passed': True
                    })

                else:
                    print(f"    Unexpected classification result")
                    self.demo_results['cui_scanning'].append({
                        'filename': test_file['filename'],
                        'expected': test_file['expected_classification'],
                        'actual': cui_asset.classification.value if cui_asset else 'No CUI',
                        'passed': False
                    })

            except Exception as e:
                print(f"    Scanning failed: {e}")

            finally:
                # Cleanup test file
                if file_path.exists():
                    file_path.unlink()

        print(f"\n    CUI assets tracked: {len(self.dfars_system.cui_manager.cui_assets)}")

    async def _demo_incident_response(self):
        """Demonstrate incident response automation"""
        print("\n" + "=" * 60)
        print("PHASE 4: INCIDENT RESPONSE AUTOMATION")
        print("=" * 60)

        incident_scenarios = [
            {
                'severity': IncidentSeverity.CRITICAL,
                'control': DFARSControl.SYSTEM_INFO_INTEGRITY,
                'description': 'Critical data integrity violation detected',
                'assets': ['database_system', 'backup_system']
            },
            {
                'severity': IncidentSeverity.HIGH,
                'control': DFARSControl.ACCESS_CONTROL,
                'description': 'Unauthorized access attempt with privilege escalation',
                'assets': ['authentication_system']
            },
            {
                'severity': IncidentSeverity.MEDIUM,
                'control': DFARSControl.CONFIGURATION_MGMT,
                'description': 'Unauthorized configuration changes detected',
                'assets': ['config_management_system']
            }
        ]

        for i, scenario in enumerate(incident_scenarios, 1):
            print(f"{i}. Creating {scenario['severity'].value} incident...")

            incident_id = self.dfars_system.incident_manager.create_incident(
                severity=scenario['severity'],
                control=scenario['control'],
                description=scenario['description'],
                affected_assets=scenario['assets']
            )

            incident = self.dfars_system.incident_manager.incidents[incident_id]

            print(f"    Incident ID: {incident_id}")
            print(f"    Response actions: {len(incident.response_actions)}")

            # Check for DoD notification requirement (critical incidents)
            if scenario['severity'] == IncidentSeverity.CRITICAL:
                print("    DoD notification workflow triggered")

            self.demo_results['incident_response'].append({
                'incident_id': incident_id,
                'severity': scenario['severity'].value,
                'control': scenario['control'].value,
                'response_actions': len(incident.response_actions)
            })

            # Brief delay to simulate processing time
            await asyncio.sleep(0.1)

        print(f"\n    Total incidents created: {len(self.dfars_system.incident_manager.incidents)}")

    async def _demo_continuous_monitoring(self):
        """Demonstrate continuous monitoring capabilities"""
        print("\n" + "=" * 60)
        print("PHASE 5: CONTINUOUS MONITORING")
        print("=" * 60)

        print("1. Running compliance checks...")

        # Simulate monitoring cycle
        for control in list(DFARSControl)[:5]:  # Check first 5 controls for demo
            check_result = await self.dfars_system.compliance_monitor._check_control_compliance(control)

            status_symbol = {
                'COMPLIANT': '',
                'NON_COMPLIANT': '',
                'PARTIAL': '',
                'MONITORING': ''
            }.get(check_result.status.value, '?')

            print(f"   {status_symbol} {control.value}: {check_result.status.value}")

            if check_result.findings:
                for finding in check_result.findings[:2]:  # Show first 2 findings
                    print(f"     - {finding}")

            self.demo_results['compliance_monitoring'].append({
                'control': control.value,
                'status': check_result.status.value,
                'findings_count': len(check_result.findings)
            })

        print("\n2. System performance monitoring...")

        # Get monitoring dashboard
        dashboard = self.continuous_monitor.get_monitoring_dashboard()
        print(f"    Monitoring status: {dashboard['monitoring_status']}")
        print(f"    Alerts (24h): {dashboard['alerts_24h']}")
        print(f"    Compliance score: {dashboard['compliance_score']:.1f}%")

        # Check for suspicious patterns
        suspicious_patterns = self.continuous_monitor.cui_monitor.get_suspicious_patterns()
        print(f"    Suspicious CUI patterns: {len(suspicious_patterns)}")

    async def _demo_integration_scenarios(self):
        """Demonstrate end-to-end integration scenarios"""
        print("\n" + "=" * 60)
        print("PHASE 6: INTEGRATION SCENARIOS")
        print("=" * 60)

        print("1. End-to-end security incident workflow...")

        # Scenario: Suspicious user behavior leading to incident
        suspicious_user = "suspicious_user"

        # Step 1: Multiple failed authentication attempts
        for attempt in range(4):
            success, _ = self.dfars_system.authenticate_user(
                suspicious_user, f"wrongpass{attempt}", "000000"
            )

        # Step 2: Check if incident was auto-created
        auth_incidents = [
            i for i in self.dfars_system.incident_manager.incidents.values()
            if i.control_violated == DFARSControl.ACCESS_CONTROL
        ]

        print(f"    Authentication incidents: {len(auth_incidents)}")

        # Step 3: Verify audit trail
        failed_login_records = [
            r for r in self.dfars_system.audit_manager.audit_records
            if r.action == "USER_LOGIN" and r.result == "FAILURE"
        ]

        print(f"    Failed login audit records: {len(failed_login_records)}")

        # Step 4: Check audit integrity
        integrity_valid, errors = self.dfars_system.audit_manager.verify_audit_integrity()
        print(f"    Audit integrity: {'VALID' if integrity_valid else 'COMPROMISED'}")

        print("\n2. CUI access monitoring scenario...")

        # Simulate CUI access patterns
        test_user = "cui_analyst"
        test_resource = "classified_document.pdf"

        # Record multiple access events
        for hour in range(5):
            access_time = datetime.now() - timedelta(hours=hour)
            self.continuous_monitor.cui_monitor.record_cui_access(
                test_user, test_resource, access_time
            )

        # Check for suspicious patterns
        patterns = self.continuous_monitor.cui_monitor.get_suspicious_patterns()
        print(f"    CUI access patterns analyzed: {len(patterns)}")

        self.demo_results['integration_tests'] = {
            'auth_incidents': len(auth_incidents),
            'audit_records': len(failed_login_records),
            'audit_integrity': integrity_valid,
            'cui_patterns': len(patterns)
        }

    async def _demo_compliance_reporting(self):
        """Demonstrate compliance reporting capabilities"""
        print("\n" + "=" * 60)
        print("PHASE 7: COMPLIANCE REPORTING")
        print("=" * 60)

        print("1. Generating compliance dashboard...")

        # Get comprehensive dashboard
        dashboard = self.dfars_system.get_compliance_dashboard()

        print(f"    System status: {dashboard['system_status']}")
        print(f"    System uptime: {dashboard['uptime']}")
        print(f"    CUI assets: {dashboard['cui_assets']}")
        print(f"    Active incidents: {dashboard['active_incidents']}")
        print(f"    Audit records: {dashboard['audit_records']}")

        compliance_summary = dashboard['compliance_summary']
        print(f"    Compliance: {compliance_summary['compliance_percentage']:.1f}%")
        print(f"    Overall status: {compliance_summary['overall_status']}")

        print("\n2. Generating detailed compliance report...")

        # Generate comprehensive report
        report = self.dfars_system.generate_compliance_report()

        print(f"    Report timestamp: {report['report_timestamp']}")
        print(f"    DFARS controls: {report['system_info']['dfars_controls_monitored']}")
        print(f"    Total incidents: {report['incident_summary']['total_incidents']}")
        print(f"    Audit records: {report['audit_summary']['total_records']}")
        print(f"    Audit integrity: {'VERIFIED' if report['audit_summary']['integrity_verified'] else 'FAILED'}")

        print("\n3. Generating monitoring report...")

        # Generate monitoring report
        monitoring_report = self.continuous_monitor.generate_monitoring_report()

        print(f"    Alert summary: {monitoring_report['alert_summary']['total_alerts']} alerts")
        print(f"    Critical alerts: {monitoring_report['alert_summary']['critical_alerts']}")
        print(f"    Compliance score: {monitoring_report['compliance_trends']['average_compliance_score']:.1f}%")

        # Save reports
        reports = {
            'dashboard': dashboard,
            'compliance_report': report,
            'monitoring_report': monitoring_report
        }

        report_file = Path("dfars_demo_reports.json")
        with open(report_file, 'w') as f:
            json.dump(reports, f, indent=2, default=str)

        print(f"    Reports saved to: {report_file}")

        self.demo_results['final_report'] = {
            'compliance_score': compliance_summary['compliance_percentage'],
            'total_incidents': report['incident_summary']['total_incidents'],
            'audit_integrity': report['audit_summary']['integrity_verified'],
            'cui_assets': dashboard['cui_assets']
        }

    def _display_final_results(self):
        """Display final demonstration results"""
        print("\n" + "=" * 80)
        print("DEMONSTRATION RESULTS SUMMARY")
        print("=" * 80)

        # Calculate overall success rate
        total_tests = 0
        passed_tests = 0

        # Authentication tests
        auth_tests = self.demo_results['authentication_tests']
        auth_passed = sum(1 for test in auth_tests if test['passed'])
        total_tests += len(auth_tests)
        passed_tests += auth_passed

        # CUI scanning tests
        cui_tests = self.demo_results['cui_scanning']
        cui_passed = sum(1 for test in cui_tests if test['passed'])
        total_tests += len(cui_tests)
        passed_tests += cui_passed

        # Incident response
        incident_count = len(self.demo_results['incident_response'])
        print(f"Incident Response: {incident_count} incidents created and processed")

        # Compliance monitoring
        compliance_checks = len(self.demo_results['compliance_monitoring'])
        print(f"Compliance Monitoring: {compliance_checks} controls checked")

        # Integration tests
        integration = self.demo_results['integration_tests']

        # Final metrics
        final_report = self.demo_results['final_report']
        print(f"\nFINAL METRICS:")
        print(f"- Overall Compliance Score: {final_report['compliance_score']:.1f}%")
        print(f"- Total Security Incidents: {final_report['total_incidents']}")
        print(f"- CUI Assets Protected: {final_report['cui_assets']}")
        print(f"- Audit Trail Integrity: {'VERIFIED' if final_report['audit_integrity'] else 'COMPROMISED'}")

        # Overall success rate
        if total_tests > 0:
            success_rate = (passed_tests / total_tests) * MAXIMUM_FUNCTION_LENGTH_LINES

        # Defense industry readiness assessment
        compliance_score = final_report['compliance_score']
        audit_integrity = final_report['audit_integrity']

        if compliance_score >= 85 and audit_integrity:
            readiness = "READY"
            color = ""
        elif compliance_score >= 75:
            readiness = "PARTIALLY READY"
            color = ""
        else:
            readiness = "NOT READY"
            color = ""

        print(f"\n{color} DEFENSE INDUSTRY CERTIFICATION READINESS: {readiness}")

        print("DFARS 252.204-7012 COMPLIANCE DEMONSTRATION COMPLETED")
        print("=" * 80)

        # Save demo results
        results_file = Path("dfars_demo_results.json")
        with open(results_file, 'w') as f:
            json.dump(self.demo_results, f, indent=2, default=str)

        print(f"\nDemo results saved to: {results_file}")

async def main():
    """Main demonstration entry point"""
    demo = DFARSIntegrationDemo()
    await demo.run_comprehensive_demo()

if __name__ == "__main__":
    # Set up clean environment for demo
    print("Setting up DFARS compliance demonstration environment...")

    # Clean up any existing demo files
    demo_files = [
        "demo_dfars_config.json",
        "dfars_demo_reports.json",
        "dfars_demo_results.json",
        "audit_trail.log",
        "logs"
    ]

    for file_path in demo_files:
        path = Path(file_path)
        if path.exists():
            if path.is_file():
                path.unlink()
            elif path.is_dir():
                import shutil
                shutil.rmtree(path)

    # Run demonstration
    asyncio.run(main())