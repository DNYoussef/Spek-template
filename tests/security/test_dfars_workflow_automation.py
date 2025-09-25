#!/usr/bin/env python3
"""
Unit Tests for DFARS Workflow Automation System
Comprehensive test suite for defense industry compliance validation
"""

from datetime import datetime, timedelta
from pathlib import Path
from unittest.mock import Mock, patch, AsyncMock
import json
import tempfile
import unittest

import asyncio
import pytest

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', 'src'))

from security.dfars_workflow_automation import (
    DFARSWorkflowAutomation,
    CryptographicManager,
    AccessControlManager,
    CUIProtectionManager,
    IncidentResponseManager,
    AuditTrailManager,
    ComplianceMonitor,
    DFARSControl,
    CUIClassification,
    IncidentSeverity,
    ComplianceStatus,
    SecurityIncident,
    CUIAsset,
    AuditRecord
)

class TestCryptographicManager(unittest.TestCase):
    """Test cryptographic operations for audit integrity"""

    def setUp(self):
        self.crypto_manager = CryptographicManager()

    def test_digital_signature_creation_and_verification(self):
        """Test digital signature creation and verification"""
        test_data = "Test audit record data"

        # Create signature
        signature = self.crypto_manager.sign_data(test_data)
        self.assertIsInstance(signature, str)
        self.assertGreater(len(signature), 0)

        # Verify signature
        is_valid = self.crypto_manager.verify_signature(test_data, signature)
        self.assertTrue(is_valid)

        # Test invalid signature
        is_invalid = self.crypto_manager.verify_signature("Modified data", signature)
        self.assertFalse(is_invalid)

    def test_cui_data_encryption_decryption(self):
        """Test CUI data encryption and decryption"""
        cui_data = "Sensitive CUI information that needs protection"

        # Encrypt data
        encrypted_data = self.crypto_manager.encrypt_cui_data(cui_data)
        self.assertNotEqual(encrypted_data, cui_data)
        self.assertIsInstance(encrypted_data, str)

        # Decrypt data
        decrypted_data = self.crypto_manager.decrypt_cui_data(encrypted_data)
        self.assertEqual(decrypted_data, cui_data)

    def test_hash_chain_generation(self):
        """Test hash chain generation for audit trail"""
        previous_hash = "0" * 64
        current_data = "First audit record"

        hash1 = self.crypto_manager.generate_hash_chain(previous_hash, current_data)
        self.assertIsInstance(hash1, str)
        self.assertEqual(len(hash1), 64)  # SHA256 hex length

        # Generate next hash in chain
        next_data = "Second audit record"
        hash2 = self.crypto_manager.generate_hash_chain(hash1, next_data)

        # Verify chain integrity
        self.assertNotEqual(hash1, hash2)
        self.assertEqual(len(hash2), 64)

class TestAccessControlManager(unittest.TestCase):
    """Test access control and authentication"""

    def setUp(self):
        self.access_manager = AccessControlManager()

    def test_successful_authentication(self):
        """Test successful user authentication with MFA"""
        username = "admin_test"
        password = "ComplexPassword123!"
        mfa_token = "123456"

        success, token = self.access_manager.authenticate_user(username, password, mfa_token)

        self.assertTrue(success)
        self.assertIsInstance(token, str)
        self.assertGreater(len(token), 20)

    def test_failed_authentication_invalid_password(self):
        """Test failed authentication with invalid password"""
        username = "admin_test"
        password = "weak"  # Doesn't meet complexity requirements
        mfa_token = "123456"

        success, message = self.access_manager.authenticate_user(username, password, mfa_token)

        self.assertFalse(success)
        self.assertEqual(message, "Invalid credentials")

    def test_failed_authentication_no_mfa(self):
        """Test failed authentication without MFA"""
        username = "admin_test"
        password = "ComplexPassword123!"
        mfa_token = None

        success, message = self.access_manager.authenticate_user(username, password, mfa_token)

        self.assertFalse(success)
        self.assertEqual(message, "Multi-factor authentication required")

    def test_account_lockout_after_failed_attempts(self):
        """Test account lockout after multiple failed attempts"""
        username = "test_user"
        password = "wrongpassword"
        mfa_token = "123456"

        # Attempt login multiple times with wrong password
        for _ in range(3):
            success, _ = self.access_manager.authenticate_user(username, password, mfa_token)
            self.assertFalse(success)

        # Fourth attempt should result in lockout
        success, message = self.access_manager.authenticate_user(username, password, mfa_token)
        self.assertFalse(success)
        self.assertIn("locked", message.lower())

    def test_access_validation(self):
        """Test resource access validation"""
        # First authenticate
        username = "cui_user"
        password = "ComplexPassword123!"
        mfa_token = "123456"

        success, token = self.access_manager.authenticate_user(username, password, mfa_token)
        self.assertTrue(success)

        # Test valid access
        has_access = self.access_manager.validate_access(token, "cui", "read")
        self.assertTrue(has_access)

        # Test invalid access (user doesn't have admin rights)
        has_admin_access = self.access_manager.validate_access(token, "system", "admin")
        self.assertFalse(has_admin_access)

    def test_session_timeout(self):
        """Test session timeout functionality"""
        username = "test_user"
        password = "ComplexPassword123!"
        mfa_token = "123456"

        success, token = self.access_manager.authenticate_user(username, password, mfa_token)
        self.assertTrue(success)

        # Manually expire session by setting old last_activity
        session = self.access_manager.authenticated_users[token]
        session['last_activity'] = datetime.now() - timedelta(hours=2)

        # Access should now fail due to timeout
        has_access = self.access_manager.validate_access(token, "public", "read")
        self.assertFalse(has_access)

class TestCUIProtectionManager(unittest.TestCase):
    """Test Controlled Unclassified Information protection"""

    def setUp(self):
        self.crypto_manager = CryptographicManager()
        self.cui_manager = CUIProtectionManager(self.crypto_manager)

    @patch('builtins.open', unittest.mock.mock_open(read_data='SSN: 123-45-6789'))
    async def test_cui_privacy_detection(self):
        """Test detection of privacy CUI (SSN pattern)"""
        cui_asset = await self.cui_manager.scan_for_cui("test_file.txt")

        self.assertIsNotNone(cui_asset)
        self.assertEqual(cui_asset.classification, CUIClassification.PRIVACY)
        self.assertTrue(cui_asset.encryption_status)
        self.assertTrue(cui_asset.data_loss_prevention)

    @patch('builtins.open', unittest.mock.mock_open(read_data='This is CONFIDENTIAL information'))
    async def test_cui_proprietary_detection(self):
        """Test detection of proprietary CUI"""
        cui_asset = await self.cui_manager.scan_for_cui("confidential_file.txt")

        self.assertIsNotNone(cui_asset)
        self.assertEqual(cui_asset.classification, CUIClassification.PROPRIETARY)

    @patch('builtins.open', unittest.mock.mock_open(read_data='ITAR controlled technical data'))
    async def test_cui_export_controlled_detection(self):
        """Test detection of export controlled CUI"""
        cui_asset = await self.cui_manager.scan_for_cui("export_file.txt")

        self.assertIsNotNone(cui_asset)
        self.assertEqual(cui_asset.classification, CUIClassification.EXPORT_CONTROLLED)

    @patch('builtins.open', unittest.mock.mock_open(read_data='Regular public information'))
    async def test_no_cui_detection(self):
        """Test that regular content is not classified as CUI"""
        cui_asset = await self.cui_manager.scan_for_cui("public_file.txt")

        self.assertIsNone(cui_asset)

    def test_handling_instructions(self):
        """Test CUI handling instructions"""
        privacy_instructions = self.cui_manager._get_handling_instructions(CUIClassification.PRIVACY)
        self.assertIn("Privacy", privacy_instructions)
        self.assertIn("GDPR", privacy_instructions)

        export_instructions = self.cui_manager._get_handling_instructions(CUIClassification.EXPORT_CONTROLLED)
        self.assertIn("Export Controlled", export_instructions)
        self.assertIn("ITAR", export_instructions)

class TestIncidentResponseManager(unittest.TestCase):
    """Test incident response automation"""

    def setUp(self):
        self.crypto_manager = CryptographicManager()
        self.incident_manager = IncidentResponseManager(self.crypto_manager)

    def test_incident_creation(self):
        """Test security incident creation"""
        incident_id = self.incident_manager.create_incident(
            IncidentSeverity.HIGH,
            DFARSControl.ACCESS_CONTROL,
            "Unauthorized access attempt",
            ["authentication_system"]
        )

        self.assertIsInstance(incident_id, str)
        self.assertIn("DFARS-", incident_id)

        # Verify incident is stored
        incident = self.incident_manager.incidents[incident_id]
        self.assertEqual(incident.severity, IncidentSeverity.HIGH)
        self.assertEqual(incident.control_violated, DFARSControl.ACCESS_CONTROL)
        self.assertEqual(incident.status, "OPEN")

    def test_critical_incident_response_workflow(self):
        """Test critical incident response workflow"""
        incident_id = self.incident_manager.create_incident(
            IncidentSeverity.CRITICAL,
            DFARSControl.SYSTEM_INFO_INTEGRITY,
            "Data integrity violation detected",
            ["database_system"]
        )

        incident = self.incident_manager.incidents[incident_id]

        # Verify critical incident has appropriate response actions
        self.assertIn("Immediate containment", incident.response_actions)
        self.assertIn("Notify DoD CIO within 72 hours", incident.response_actions)
        self.assertIn("Preserve forensic evidence", incident.response_actions)

    def test_incident_severity_workflows(self):
        """Test different incident severity workflows"""
        # Test HIGH severity
        high_incident_id = self.incident_manager.create_incident(
            IncidentSeverity.HIGH,
            DFARSControl.AUDIT_ACCOUNTABILITY,
            "Audit log tampering detected",
            ["audit_system"]
        )
        high_incident = self.incident_manager.incidents[high_incident_id]
        self.assertIn("Containment within 4 hours", high_incident.response_actions)

        # Test MEDIUM severity
        medium_incident_id = self.incident_manager.create_incident(
            IncidentSeverity.MEDIUM,
            DFARSControl.CONFIGURATION_MGMT,
            "Configuration drift detected",
            ["config_system"]
        )
        medium_incident = self.incident_manager.incidents[medium_incident_id]
        self.assertIn("Assessment within 24 hours", medium_incident.response_actions)

    @patch('logging.critical')
    def test_dod_notification_preparation(self, mock_log):
        """Test DoD notification preparation for critical incidents"""
        incident_id = self.incident_manager.create_incident(
            IncidentSeverity.CRITICAL,
            DFARSControl.INCIDENT_RESPONSE,
            "Critical security breach",
            ["network_infrastructure"]
        )

        # Verify DoD notification is prepared
        mock_log.assert_called()
        log_message = mock_log.call_args[0][0]
        self.assertIn("DoD notification prepared", log_message)
        self.assertIn(incident_id, log_message)

class TestAuditTrailManager(unittest.TestCase):
    """Test audit trail management with cryptographic integrity"""

    def setUp(self):
        self.crypto_manager = CryptographicManager()
        self.audit_manager = AuditTrailManager(self.crypto_manager)

    def test_audit_record_creation(self):
        """Test creation of tamper-proof audit records"""
        record_id = self.audit_manager.create_audit_record(
            user_id="test_user",
            action="FILE_ACCESS",
            resource="/sensitive/file.txt",
            result="SUCCESS",
            ip_address="192.168.1.100"
        )

        self.assertIsInstance(record_id, str)
        self.assertIn("AUDIT-", record_id)

        # Verify record is stored
        self.assertEqual(len(self.audit_manager.audit_records), 1)

        record = self.audit_manager.audit_records[0]
        self.assertEqual(record.user_id, "test_user")
        self.assertEqual(record.action, "FILE_ACCESS")
        self.assertIsNotNone(record.digital_signature)
        self.assertIsNotNone(record.hash_chain)

    def test_audit_integrity_verification(self):
        """Test audit trail integrity verification"""
        # Create multiple audit records
        for i in range(3):
            self.audit_manager.create_audit_record(
                user_id=f"user_{i}",
                action="TEST_ACTION",
                resource=f"resource_{i}",
                result="SUCCESS"
            )

        # Verify integrity
        is_valid, errors = self.audit_manager.verify_audit_integrity()
        self.assertTrue(is_valid)
        self.assertEqual(len(errors), 0)

    def test_audit_integrity_detection_of_tampering(self):
        """Test detection of audit trail tampering"""
        # Create audit record
        self.audit_manager.create_audit_record(
            user_id="test_user",
            action="TEST_ACTION",
            resource="test_resource",
            result="SUCCESS"
        )

        # Tamper with the record
        record = self.audit_manager.audit_records[0]
        record.action = "TAMPERED_ACTION"

        # Verify integrity should now fail
        is_valid, errors = self.audit_manager.verify_audit_integrity()
        self.assertFalse(is_valid)
        self.assertGreater(len(errors), 0)
        self.assertIn("Invalid signature", errors[0])

    def test_hash_chain_integrity(self):
        """Test hash chain integrity across multiple records"""
        # Create multiple records
        record_ids = []
        for i in range(5):
            record_id = self.audit_manager.create_audit_record(
                user_id=f"user_{i}",
                action=f"ACTION_{i}",
                resource=f"resource_{i}",
                result="SUCCESS"
            )
            record_ids.append(record_id)

        # Verify each record has proper hash chain
        previous_hash = "0" * 64
        for record in self.audit_manager.audit_records:
            # Reconstruct record data
            record_data = f"{record.record_id}|{record.timestamp.isoformat()}|{record.user_id}|{record.action}|{record.resource}|{record.result}|{record.ip_address}|{record.user_agent}"

            # Verify hash chain
            expected_hash = self.crypto_manager.generate_hash_chain(previous_hash, record_data)
            self.assertEqual(record.hash_chain, expected_hash)

            previous_hash = record.hash_chain

class TestComplianceMonitor(unittest.TestCase):
    """Test real-time compliance monitoring"""

    def setUp(self):
        self.crypto_manager = CryptographicManager()
        self.access_manager = AccessControlManager()
        self.cui_manager = CUIProtectionManager(self.crypto_manager)
        self.incident_manager = IncidentResponseManager(self.crypto_manager)
        self.audit_manager = AuditTrailManager(self.crypto_manager)

        self.compliance_monitor = ComplianceMonitor({
            'access': self.access_manager,
            'cui': self.cui_manager,
            'incident': self.incident_manager,
            'audit': self.audit_manager
        })

    async def test_access_control_compliance_check(self):
        """Test access control compliance checking"""
        check_result = await self.compliance_monitor._check_control_compliance(DFARSControl.ACCESS_CONTROL)

        self.assertEqual(check_result.control_id, DFARSControl.ACCESS_CONTROL)
        self.assertIsInstance(check_result.status, ComplianceStatus)
        self.assertIsInstance(check_result.findings, list)
        self.assertIsInstance(check_result.evidence, dict)

    async def test_audit_accountability_compliance_check(self):
        """Test audit and accountability compliance checking"""
        # Create some audit records first
        self.audit_manager.create_audit_record("user1", "TEST", "resource1", "SUCCESS")
        self.audit_manager.create_audit_record("user2", "TEST", "resource2", "SUCCESS")

        check_result = await self.compliance_monitor._check_control_compliance(DFARSControl.AUDIT_ACCOUNTABILITY)

        self.assertEqual(check_result.control_id, DFARSControl.AUDIT_ACCOUNTABILITY)
        self.assertEqual(check_result.status, ComplianceStatus.COMPLIANT)
        self.assertTrue(check_result.evidence['audit_integrity'])

    async def test_incident_response_compliance_check(self):
        """Test incident response compliance checking"""
        # Create a critical incident
        incident_id = self.incident_manager.create_incident(
            IncidentSeverity.CRITICAL,
            DFARSControl.INCIDENT_RESPONSE,
            "Test critical incident",
            ["test_system"]
        )

        check_result = await self.compliance_monitor._check_control_compliance(DFARSControl.INCIDENT_RESPONSE)

        self.assertEqual(check_result.control_id, DFARSControl.INCIDENT_RESPONSE)
        self.assertIn('open_incidents', check_result.evidence)

    async def test_72_hour_reporting_compliance(self):
        """Test 72-hour reporting requirement compliance"""
        # Create a critical incident and manually set old timestamp
        incident_id = self.incident_manager.create_incident(
            IncidentSeverity.CRITICAL,
            DFARSControl.INCIDENT_RESPONSE,
            "Old critical incident",
            ["test_system"]
        )

        # Manually age the incident beyond 72 hours
        incident = self.incident_manager.incidents[incident_id]
        incident.timestamp = datetime.now() - timedelta(hours=80)

        check_result = await self.compliance_monitor._check_control_compliance(DFARSControl.INCIDENT_RESPONSE)

        # Should detect non-compliance due to exceeded reporting window
        self.assertEqual(check_result.status, ComplianceStatus.NON_COMPLIANT)
        self.assertTrue(any("72-hour reporting requirement" in finding for finding in check_result.findings))

class TestDFARSWorkflowAutomation(unittest.TestCase):
    """Test main DFARS workflow automation system"""

    def setUp(self):
        # Use temporary directory for testing
        self.test_dir = tempfile.mkdtemp()
        self.original_cwd = os.getcwd()
        os.chdir(self.test_dir)

        self.dfars_system = DFARSWorkflowAutomation()

    def tearDown(self):
        os.chdir(self.original_cwd)

    def test_system_initialization(self):
        """Test system initialization"""
        self.assertIsNotNone(self.dfars_system.crypto_manager)
        self.assertIsNotNone(self.dfars_system.access_manager)
        self.assertIsNotNone(self.dfars_system.cui_manager)
        self.assertIsNotNone(self.dfars_system.incident_manager)
        self.assertIsNotNone(self.dfars_system.audit_manager)
        self.assertIsNotNone(self.dfars_system.compliance_monitor)
        self.assertTrue(self.dfars_system.system_active)

    def test_user_authentication_with_audit(self):
        """Test user authentication with audit logging"""
        # Test successful authentication
        success, token = self.dfars_system.authenticate_user("admin_test", "ComplexPassword123!", "123456")
        self.assertTrue(success)

        # Verify audit record was created
        self.assertGreater(len(self.dfars_system.audit_manager.audit_records), 0)

        audit_record = self.dfars_system.audit_manager.audit_records[-1]
        self.assertEqual(audit_record.action, "USER_LOGIN")
        self.assertEqual(audit_record.result, "SUCCESS")

    def test_failed_authentication_incident_creation(self):
        """Test that failed authentication creates security incident"""
        initial_incidents = len(self.dfars_system.incident_manager.incidents)

        # Attempt failed authentication
        success, message = self.dfars_system.authenticate_user("test_user", "wrong", "123456")
        self.assertFalse(success)

        # Verify incident was created
        self.assertGreater(len(self.dfars_system.incident_manager.incidents), initial_incidents)

    def test_compliance_dashboard_generation(self):
        """Test compliance dashboard generation"""
        dashboard = self.dfars_system.get_compliance_dashboard()

        self.assertIn('system_status', dashboard)
        self.assertIn('uptime', dashboard)
        self.assertIn('compliance_summary', dashboard)
        self.assertIn('cui_assets', dashboard)
        self.assertIn('active_incidents', dashboard)
        self.assertIn('audit_records', dashboard)
        self.assertIn('controls_status', dashboard)

        self.assertEqual(dashboard['system_status'], 'ACTIVE')
        self.assertIsInstance(dashboard['cui_assets'], int)

    def test_compliance_report_generation(self):
        """Test comprehensive compliance report generation"""
        # Create some test data
        self.dfars_system.audit_manager.create_audit_record("user1", "TEST", "resource1", "SUCCESS")
        self.dfars_system.incident_manager.create_incident(
            IncidentSeverity.MEDIUM,
            DFARSControl.ACCESS_CONTROL,
            "Test incident",
            ["test_system"]
        )

        report = self.dfars_system.generate_compliance_report()

        self.assertIn('report_timestamp', report)
        self.assertIn('system_info', report)
        self.assertIn('compliance_status', report)
        self.assertIn('cui_protection', report)
        self.assertIn('incident_summary', report)
        self.assertIn('audit_summary', report)

        # Verify report structure
        self.assertGreater(report['incident_summary']['total_incidents'], 0)
        self.assertGreater(report['audit_summary']['total_records'], 0)

    def test_system_shutdown(self):
        """Test graceful system shutdown"""
        initial_audit_count = len(self.dfars_system.audit_manager.audit_records)

        self.dfars_system.shutdown_system()

        # Verify shutdown audit record was created
        self.assertGreater(len(self.dfars_system.audit_manager.audit_records), initial_audit_count)

        shutdown_record = self.dfars_system.audit_manager.audit_records[-1]
        self.assertEqual(shutdown_record.action, "SYSTEM_SHUTDOWN")
        self.assertEqual(shutdown_record.result, "SUCCESS")

        # Verify system is marked as inactive
        self.assertFalse(self.dfars_system.system_active)

class TestIntegrationScenarios(unittest.TestCase):
    """Integration tests for complete DFARS workflow scenarios"""

    def setUp(self):
        self.test_dir = tempfile.mkdtemp()
        self.original_cwd = os.getcwd()
        os.chdir(self.test_dir)

        self.dfars_system = DFARSWorkflowAutomation()

    def tearDown(self):
        os.chdir(self.original_cwd)

    def test_end_to_end_security_incident_workflow(self):
        """Test complete security incident workflow"""
        # 1. User authentication failure triggers incident
        success, _ = self.dfars_system.authenticate_user("attacker", "badpassword", "000000")
        self.assertFalse(success)

        # 2. Verify incident was created
        incidents = list(self.dfars_system.incident_manager.incidents.values())
        auth_incidents = [i for i in incidents if i.control_violated == DFARSControl.ACCESS_CONTROL]
        self.assertGreater(len(auth_incidents), 0)

        # 3. Verify audit record was created
        audit_records = self.dfars_system.audit_manager.audit_records
        login_records = [r for r in audit_records if r.action == "USER_LOGIN" and r.result == "FAILURE"]
        self.assertGreater(len(login_records), 0)

        # 4. Generate compliance report
        report = self.dfars_system.generate_compliance_report()
        self.assertGreater(report['incident_summary']['total_incidents'], 0)

    async def test_cui_detection_and_protection_workflow(self):
        """Test CUI detection and protection workflow"""
        # 1. Create test file with CUI content
        test_file = Path("sensitive_data.txt")
        test_file.write_text("SSN: 123-45-6789\nConfidential company information")

        # 2. Scan for CUI
        cui_asset = await self.dfars_system.cui_manager.scan_for_cui(str(test_file))
        self.assertIsNotNone(cui_asset)

        # 3. Verify CUI asset is tracked
        self.assertIn(str(test_file), self.dfars_system.cui_manager.cui_assets)

        # 4. Verify audit record for CUI identification
        audit_records = self.dfars_system.audit_manager.audit_records
        cui_records = [r for r in audit_records if r.action == "CUI_IDENTIFIED"]
        self.assertGreater(len(cui_records), 0)

        # 5. Check compliance dashboard reflects CUI assets
        dashboard = self.dfars_system.get_compliance_dashboard()
        self.assertGreater(dashboard['cui_assets'], 0)

    def test_compliance_monitoring_and_reporting_cycle(self):
        """Test complete compliance monitoring and reporting cycle"""
        # 1. Perform various system activities
        self.dfars_system.authenticate_user("admin", "ComplexPassword123!", "123456")
        self.dfars_system.incident_manager.create_incident(
            IncidentSeverity.LOW,
            DFARSControl.CONFIGURATION_MGMT,
            "Configuration change detected",
            ["config_system"]
        )

        # 2. Generate compliance dashboard
        dashboard = self.dfars_system.get_compliance_dashboard()
        self.assertEqual(dashboard['system_status'], 'ACTIVE')

        # 3. Generate detailed compliance report
        report = self.dfars_system.generate_compliance_report()

        # 4. Verify all DFARS controls are addressed
        self.assertEqual(len(report['compliance_status']), len(DFARSControl))

        # 5. Verify audit integrity
        self.assertTrue(report['audit_summary']['integrity_verified'])

        # 6. Verify incident tracking
        self.assertGreater(report['incident_summary']['total_incidents'], 0)

# Test runner for async tests
class AsyncTestRunner:
    """Helper class to run async tests"""

    @staticmethod
    def run_async_test(test_func):
        """Run async test function"""
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            return loop.run_until_complete(test_func())
        finally:
            loop.close()

if __name__ == '__main__':
    # Create test suite
    test_suite = unittest.TestSuite()

    # Add test classes
    test_classes = [
        TestCryptographicManager,
        TestAccessControlManager,
        TestCUIProtectionManager,
        TestIncidentResponseManager,
        TestAuditTrailManager,
        TestComplianceMonitor,
        TestDFARSWorkflowAutomation,
        TestIntegrationScenarios
    ]

    for test_class in test_classes:
        tests = unittest.TestLoader().loadTestsFromTestCase(test_class)
        test_suite.addTests(tests)

    # Run tests
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(test_suite)

    # Print summary
    print(f"\n{'='*60}")
    print(f"{'='*60}")
    print(f"Failures: {len(result.failures)}")
    print(f"Errors: {len(result.errors)}")

    if result.failures:
        print(f"\nFailures:")
        for test, traceback in result.failures:
            pass

    if result.errors:
        print(f"\nErrors:")
        for test, traceback in result.errors:
            pass

    # Exit with appropriate code
    exit_code = 0 if result.wasSuccessful() else 1
    exit(exit_code)