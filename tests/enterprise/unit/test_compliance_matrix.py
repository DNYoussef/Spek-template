"""
Comprehensive Unit Tests for Compliance Matrix System

Tests all functionality of the compliance matrix generator including:
- Control creation and management across multiple frameworks
- SOC2, ISO27001, NIST CSF, and GDPR compliance frameworks
- Evidence collection and validation
- Status tracking and automated reporting
- Gap analysis and remediation planning
- Performance and scalability
"""

from datetime import datetime, date, timedelta
from pathlib import Path
from unittest.mock import Mock, patch, MagicMock
import json
import tempfile

import pytest

# Import the modules under test
import sys
sys.path.append(str(Path(__file__).parent.parent.parent.parent / 'src'))

from enterprise.compliance.matrix import (
    ComplianceMatrix, Control, ComplianceReport, 
    ComplianceFramework, ComplianceStatus
)

class TestComplianceFramework:
    """Test ComplianceFramework enum"""
    
    def test_framework_values(self):
        """Test framework enum values"""
        assert ComplianceFramework.SOC2_TYPE1.value == "soc2-type1"
        assert ComplianceFramework.SOC2_TYPE2.value == "soc2-type2"
        assert ComplianceFramework.ISO27001.value == "iso27001"
        assert ComplianceFramework.NIST_CSF.value == "nist-csf"
        assert ComplianceFramework.GDPR.value == "gdpr"
        assert ComplianceFramework.HIPAA.value == "hipaa"
        assert ComplianceFramework.PCI_DSS.value == "pci-dss"
        assert ComplianceFramework.CUSTOM.value == "custom"

class TestComplianceStatus:
    """Test ComplianceStatus enum"""
    
    def test_status_values(self):
        """Test status enum values"""
        assert ComplianceStatus.NOT_STARTED.value == "not_started"
        assert ComplianceStatus.IN_PROGRESS.value == "in_progress"
        assert ComplianceStatus.IMPLEMENTED.value == "implemented"
        assert ComplianceStatus.TESTED.value == "tested"
        assert ComplianceStatus.COMPLIANT.value == "compliant"
        assert ComplianceStatus.NON_COMPLIANT.value == "non_compliant"
        assert ComplianceStatus.NEEDS_REVIEW.value == "needs_review"

class TestControl:
    """Test Control dataclass"""
    
    def test_control_creation(self):
        """Test basic control creation"""
        control = Control(
            id="CC6.1",
            title="Access Controls",
            description="Implement access controls",
            framework=ComplianceFramework.SOC2_TYPE2,
            category="Security"
        )
        
        assert control.id == "CC6.1"
        assert control.title == "Access Controls"
        assert control.description == "Implement access controls"
        assert control.framework == ComplianceFramework.SOC2_TYPE2
        assert control.category == "Security"
        assert control.status == ComplianceStatus.NOT_STARTED
        assert control.subcategory is None
        assert control.implementation_date is None
        assert control.last_tested is None
        assert control.next_review is None
        assert control.owner is None
        assert control.evidence_files == []
        assert control.test_results == []
        assert control.notes == []
        assert control.risk_rating == "medium"
        assert control.automation_level == "manual"
        assert control.dependencies == []
    
    def test_control_with_all_fields(self):
        """Test control creation with all fields"""
        today = date.today()
        control = Control(
            id="A.5.1.1",
            title="Information Security Policy",
            description="Establish security policy",
            framework=ComplianceFramework.ISO27001,
            category="Policy",
            subcategory="Management",
            status=ComplianceStatus.IMPLEMENTED,
            implementation_date=today,
            last_tested=today,
            next_review=today,
            owner="Security Team",
            evidence_files=["policy.pdf"],
            test_results=[{"result": "pass"}],
            notes=["Initial implementation"],
            risk_rating="high",
            automation_level="automated",
            dependencies=["A.5.1.2"]
        )
        
        assert control.subcategory == "Management"
        assert control.status == ComplianceStatus.IMPLEMENTED
        assert control.implementation_date == today
        assert control.last_tested == today
        assert control.next_review == today
        assert control.owner == "Security Team"
        assert control.evidence_files == ["policy.pdf"]
        assert control.test_results == [{"result": "pass"}]
        assert control.notes == ["Initial implementation"]
        assert control.risk_rating == "high"
        assert control.automation_level == "automated"
        assert control.dependencies == ["A.5.1.2"]

class TestComplianceReport:
    """Test ComplianceReport dataclass"""
    
    def test_report_creation(self):
        """Test compliance report creation"""
        report = ComplianceReport(framework=ComplianceFramework.SOC2_TYPE2)
        
        assert report.framework == ComplianceFramework.SOC2_TYPE2
        assert isinstance(report.report_date, datetime)
        assert report.overall_status == 0.0
        assert report.total_controls == 0
        assert report.compliant_controls == 0
        assert report.in_progress_controls == 0
        assert report.non_compliant_controls == 0
        assert report.risk_summary == {}
        assert report.category_breakdown == {}
        assert report.recommendations == []
        assert report.evidence_gaps == []
        assert report.next_actions == []

class TestComplianceMatrix:
    """Test ComplianceMatrix main class"""
    
    def setup_method(self):
        """Setup test fixture"""
        self.temp_dir = Path(tempfile.mkdtemp())
        self.matrix = ComplianceMatrix(self.temp_dir)
    
    def teardown_method(self):
        """Cleanup test fixture"""
        import shutil
        shutil.rmtree(self.temp_dir)
    
    def test_matrix_initialization(self):
        """Test matrix initialization"""
        assert self.matrix.project_root == self.temp_dir
        assert isinstance(self.matrix.controls, dict)
        assert isinstance(self.matrix.frameworks, set)
        assert self.matrix.evidence_directory.exists()
        assert self.matrix.evidence_directory.name == "evidence"
    
    def test_add_framework_soc2(self):
        """Test adding SOC2 framework"""
        self.matrix.add_framework(ComplianceFramework.SOC2_TYPE2)
        
        assert ComplianceFramework.SOC2_TYPE2 in self.matrix.frameworks
        assert len(self.matrix.controls) > 0
        
        # Check for specific SOC2 controls
        assert "CC6.1" in self.matrix.controls
        assert "CC6.2" in self.matrix.controls
        assert "A1.1" in self.matrix.controls
        
        # Verify control properties
        control = self.matrix.controls["CC6.1"]
        assert control.framework == ComplianceFramework.SOC2_TYPE2
        assert control.category == "Security"
        assert "Access Controls" in control.title
    
    def test_add_framework_iso27001(self):
        """Test adding ISO27001 framework"""
        self.matrix.add_framework(ComplianceFramework.ISO27001)
        
        assert ComplianceFramework.ISO27001 in self.matrix.frameworks
        
        # Check for specific ISO27001 controls
        assert "A.5.1.1" in self.matrix.controls
        assert "A.8.1.1" in self.matrix.controls
        assert "A.9.1.1" in self.matrix.controls
        
        # Verify control properties
        control = self.matrix.controls["A.5.1.1"]
        assert control.framework == ComplianceFramework.ISO27001
        assert "Information Security Policy" in control.title
    
    def test_add_framework_nist(self):
        """Test adding NIST CSF framework"""
        self.matrix.add_framework(ComplianceFramework.NIST_CSF)
        
        assert ComplianceFramework.NIST_CSF in self.matrix.frameworks
        
        # Check for specific NIST controls
        assert "ID.AM-1" in self.matrix.controls
        assert "PR.AC-1" in self.matrix.controls
        assert "DE.CM-1" in self.matrix.controls
        assert "RS.RP-1" in self.matrix.controls
        assert "RC.RP-1" in self.matrix.controls
        
        # Verify control categories
        control = self.matrix.controls["ID.AM-1"]
        assert control.category == "Identify"
        assert control.subcategory == "Asset Management"
    
    def test_add_framework_gdpr(self):
        """Test adding GDPR framework"""
        self.matrix.add_framework(ComplianceFramework.GDPR)
        
        assert ComplianceFramework.GDPR in self.matrix.frameworks
        
        # Check for specific GDPR controls
        assert "Art.5" in self.matrix.controls
        assert "Art.6" in self.matrix.controls
        assert "Art.25" in self.matrix.controls
        assert "Art.32" in self.matrix.controls
        assert "Art.33" in self.matrix.controls
        
        # Verify critical controls
        control = self.matrix.controls["Art.6"]
        assert control.risk_rating == "critical"
        assert "lawful" in control.description.lower()

class TestControlManagement:
    """Test control management functionality"""
    
    def setup_method(self):
        self.temp_dir = Path(tempfile.mkdtemp())
        self.matrix = ComplianceMatrix(self.temp_dir)
        self.matrix.add_framework(ComplianceFramework.SOC2_TYPE2)
    
    def teardown_method(self):
        import shutil
        shutil.rmtree(self.temp_dir)
    
    def test_update_control_status(self):
        """Test updating control status"""
        control_id = "CC6.1"
        
        # Update to implemented
        self.matrix.update_control_status(
            control_id, 
            ComplianceStatus.IMPLEMENTED,
            evidence_files=["access_policy.pdf"],
            notes="Implemented new access controls"
        )
        
        control = self.matrix.controls[control_id]
        assert control.status == ComplianceStatus.IMPLEMENTED
        assert control.implementation_date == date.today()
        assert "access_policy.pdf" in control.evidence_files
        assert len(control.notes) == 1
        assert "Implemented new access controls" in control.notes[0]
    
    def test_update_control_status_tested(self):
        """Test updating control status to tested"""
        control_id = "CC6.2"
        
        self.matrix.update_control_status(control_id, ComplianceStatus.TESTED)
        
        control = self.matrix.controls[control_id]
        assert control.status == ComplianceStatus.TESTED
        assert control.last_tested == date.today()
    
    def test_update_control_status_compliant(self):
        """Test updating control status to compliant"""
        control_id = "A1.1"
        
        self.matrix.update_control_status(control_id, ComplianceStatus.COMPLIANT)
        
        control = self.matrix.controls[control_id]
        assert control.status == ComplianceStatus.COMPLIANT
        assert control.last_tested == date.today()
    
    def test_update_nonexistent_control(self):
        """Test updating nonexistent control raises error"""
        with pytest.raises(ValueError, match="Control INVALID not found"):
            self.matrix.update_control_status("INVALID", ComplianceStatus.IMPLEMENTED)
    
    def test_add_evidence(self):
        """Test adding evidence to control"""
        control_id = "CC6.1"
        
        # Create temporary evidence file
        evidence_file = self.temp_dir / "test_evidence.pdf"
        evidence_file.write_text("Test evidence content")
        
        self.matrix.add_evidence(
            control_id,
            evidence_file,
            "Test evidence for access controls"
        )
        
        control = self.matrix.controls[control_id]
        assert len(control.evidence_files) == 1
        
        # Verify evidence was copied to compliance directory
        evidence_dest = self.matrix.evidence_directory / control_id / "test_evidence.pdf"
        assert evidence_dest.exists()
        assert evidence_dest.read_text() == "Test evidence content"
        
        # Verify note was added
        assert len(control.notes) == 1
        assert "Test evidence for access controls" in control.notes[0]
    
    def test_add_evidence_nonexistent_control(self):
        """Test adding evidence to nonexistent control"""
        evidence_file = self.temp_dir / "test.pdf"
        evidence_file.write_text("test")
        
        with pytest.raises(ValueError, match="Control INVALID not found"):
            self.matrix.add_evidence("INVALID", evidence_file)

class TestComplianceReporting:
    """Test compliance reporting functionality"""
    
    def setup_method(self):
        self.temp_dir = Path(tempfile.mkdtemp())
        self.matrix = ComplianceMatrix(self.temp_dir)
        self.matrix.add_framework(ComplianceFramework.SOC2_TYPE2)
    
    def teardown_method(self):
        import shutil
        shutil.rmtree(self.temp_dir)
    
    def test_generate_empty_report(self):
        """Test generating report with no framework controls"""
        empty_matrix = ComplianceMatrix(self.temp_dir)
        
        with pytest.raises(ValueError, match="No controls found for framework"):
            empty_matrix.generate_compliance_report(ComplianceFramework.ISO27001)
    
    def test_generate_basic_report(self):
        """Test generating basic compliance report"""
        report = self.matrix.generate_compliance_report(ComplianceFramework.SOC2_TYPE2)
        
        assert isinstance(report, ComplianceReport)
        assert report.framework == ComplianceFramework.SOC2_TYPE2
        assert report.total_controls > 0
        assert report.compliant_controls == 0  # All start as NOT_STARTED
        assert report.overall_status == 0.0
        assert isinstance(report.risk_summary, dict)
        assert isinstance(report.category_breakdown, dict)
        assert isinstance(report.recommendations, list)
        assert isinstance(report.evidence_gaps, list)
        assert isinstance(report.next_actions, list)
    
    def test_generate_report_with_compliant_controls(self):
        """Test report generation with some compliant controls"""
        # Mark some controls as compliant
        self.matrix.update_control_status("CC6.1", ComplianceStatus.COMPLIANT)
        self.matrix.update_control_status("CC6.2", ComplianceStatus.IMPLEMENTED)
        self.matrix.update_control_status("A1.1", ComplianceStatus.NON_COMPLIANT)
        
        report = self.matrix.generate_compliance_report(ComplianceFramework.SOC2_TYPE2)
        
        assert report.compliant_controls == 1
        assert report.in_progress_controls == 1  # IMPLEMENTED counts as in-progress
        assert report.non_compliant_controls == 1
        assert report.overall_status == (1 / report.total_controls) * 100
    
    def test_report_recommendations(self):
        """Test report recommendations generation"""
        # Set up various control states
        self.matrix.update_control_status("CC6.1", ComplianceStatus.NON_COMPLIANT)
        self.matrix.controls["CC6.1"].risk_rating = "high"
        
        self.matrix.update_control_status("CC6.2", ComplianceStatus.IMPLEMENTED)
        # Don't add evidence to create evidence gap
        
        report = self.matrix.generate_compliance_report(ComplianceFramework.SOC2_TYPE2)
        
        # Should have recommendations for high-risk non-compliant controls
        recommendations = report.recommendations
        assert len(recommendations) > 0
        
        # Check for specific recommendation types
        rec_text = " ".join(recommendations)
        assert "high" in rec_text.lower() or "critical" in rec_text.lower()
    
    def test_evidence_gaps_identification(self):
        """Test identification of evidence gaps"""
        # Mark control as implemented but don't add evidence
        self.matrix.update_control_status("CC6.1", ComplianceStatus.IMPLEMENTED)
        
        report = self.matrix.generate_compliance_report(ComplianceFramework.SOC2_TYPE2)
        
        # Should identify evidence gap
        assert len(report.evidence_gaps) > 0
        assert "CC6.1" in report.evidence_gaps[0]
    
    def test_next_actions_generation(self):
        """Test next actions generation"""
        # Set up various control states for action prioritization
        self.matrix.update_control_status("CC6.1", ComplianceStatus.NON_COMPLIANT)
        self.matrix.controls["CC6.1"].risk_rating = "critical"
        
        self.matrix.update_control_status("CC6.2", ComplianceStatus.IN_PROGRESS)
        self.matrix.controls["CC6.2"].risk_rating = "high"
        
        report = self.matrix.generate_compliance_report(ComplianceFramework.SOC2_TYPE2)
        
        # Should have prioritized next actions
        assert len(report.next_actions) > 0
        
        # First action should be highest priority (critical non-compliant)
        first_action = report.next_actions[0]
        assert first_action["control_id"] == "CC6.1"
        assert first_action["priority"] == "critical-non_compliant"
    
    def test_risk_summary_calculation(self):
        """Test risk summary calculation"""
        # Set different risk ratings
        self.matrix.controls["CC6.1"].risk_rating = "critical"
        self.matrix.controls["CC6.2"].risk_rating = "high"
        self.matrix.controls["A1.1"].risk_rating = "medium"
        
        report = self.matrix.generate_compliance_report(ComplianceFramework.SOC2_TYPE2)
        
        risk_summary = report.risk_summary
        assert "critical" in risk_summary
        assert "high" in risk_summary
        assert "medium" in risk_summary
        assert "low" in risk_summary
        
        assert risk_summary["critical"] >= 1
        assert risk_summary["high"] >= 1
        assert risk_summary["medium"] >= 1
    
    def test_category_breakdown(self):
        """Test category breakdown calculation"""
        # Update some controls with different statuses
        self.matrix.update_control_status("CC6.1", ComplianceStatus.COMPLIANT)
        self.matrix.update_control_status("CC6.2", ComplianceStatus.IMPLEMENTED)
        
        report = self.matrix.generate_compliance_report(ComplianceFramework.SOC2_TYPE2)
        
        category_breakdown = report.category_breakdown
        
        # Should have categories like "Security", "Availability", etc.
        assert "Security" in category_breakdown
        
        # Security category should have status breakdown
        security_breakdown = category_breakdown["Security"]
        assert "compliant" in security_breakdown
        assert security_breakdown["compliant"] >= 1

class TestMatrixExportImport:
    """Test matrix export and import functionality"""
    
    def setup_method(self):
        self.temp_dir = Path(tempfile.mkdtemp())
        self.matrix = ComplianceMatrix(self.temp_dir)
        self.matrix.add_framework(ComplianceFramework.SOC2_TYPE2)
    
    def teardown_method(self):
        import shutil
        shutil.rmtree(self.temp_dir)
    
    def test_export_compliance_matrix(self):
        """Test exporting compliance matrix to JSON"""
        # Update some controls
        self.matrix.update_control_status("CC6.1", ComplianceStatus.IMPLEMENTED)
        self.matrix.update_control_status("CC6.2", ComplianceStatus.COMPLIANT)
        
        # Export matrix
        output_file = self.temp_dir / "compliance_export.json"
        self.matrix.export_compliance_matrix(output_file)
        
        # Verify export file exists and contains data
        assert output_file.exists()
        
        with open(output_file, 'r') as f:
            export_data = json.load(f)
        
        assert "export_date" in export_data
        assert "frameworks" in export_data
        assert "controls" in export_data
        
        assert ComplianceFramework.SOC2_TYPE2.value in export_data["frameworks"]
        
        # Verify control data
        controls = export_data["controls"]
        assert "CC6.1" in controls
        assert "CC6.2" in controls
        
        # Check control details
        control_data = controls["CC6.1"]
        assert control_data["status"] == "implemented"
        assert control_data["framework"] == "soc2-type2"
        assert control_data["implementation_date"] == date.today().isoformat()
    
    def test_export_with_evidence_and_notes(self):
        """Test export with evidence files and notes"""
        # Add evidence and notes
        evidence_file = self.temp_dir / "policy.pdf"
        evidence_file.write_text("Policy content")
        
        self.matrix.update_control_status(
            "CC6.1", 
            ComplianceStatus.IMPLEMENTED,
            notes="Implemented access policy"
        )
        self.matrix.add_evidence("CC6.1", evidence_file, "Policy document")
        
        # Export and verify
        output_file = self.temp_dir / "export_with_evidence.json"
        self.matrix.export_compliance_matrix(output_file)
        
        with open(output_file, 'r') as f:
            export_data = json.load(f)
        
        control_data = export_data["controls"]["CC6.1"]
        assert len(control_data["evidence_files"]) == 1
        assert len(control_data["notes"]) == 2  # One from update_status, one from add_evidence
        assert "Implemented access policy" in control_data["notes"][0]
        assert "Policy document" in control_data["notes"][1]

class TestFrameworkCoverage:
    """Test framework coverage analysis"""
    
    def setup_method(self):
        self.temp_dir = Path(tempfile.mkdtemp())
        self.matrix = ComplianceMatrix(self.temp_dir)
        self.matrix.add_framework(ComplianceFramework.SOC2_TYPE2)
        self.matrix.add_framework(ComplianceFramework.ISO27001)
    
    def teardown_method(self):
        import shutil
        shutil.rmtree(self.temp_dir)
    
    def test_framework_coverage_empty(self):
        """Test framework coverage with no compliant controls"""
        coverage = self.matrix.get_framework_coverage()
        
        assert ComplianceFramework.SOC2_TYPE2.value in coverage
        assert ComplianceFramework.ISO27001.value in coverage
        
        # Check SOC2 coverage
        soc2_coverage = coverage[ComplianceFramework.SOC2_TYPE2.value]
        assert soc2_coverage["total_controls"] > 0
        assert soc2_coverage["compliant_controls"] == 0
        assert soc2_coverage["compliance_percentage"] == 0.0
        assert "status_breakdown" in soc2_coverage
    
    def test_framework_coverage_with_compliance(self):
        """Test framework coverage with some compliant controls"""
        # Mark some SOC2 controls as compliant
        soc2_controls = [c for c in self.matrix.controls.keys() 
                        if self.matrix.controls[c].framework == ComplianceFramework.SOC2_TYPE2]
        
        compliant_count = 2
        for i, control_id in enumerate(soc2_controls[:compliant_count]):
            self.matrix.update_control_status(control_id, ComplianceStatus.COMPLIANT)
        
        coverage = self.matrix.get_framework_coverage()
        soc2_coverage = coverage[ComplianceFramework.SOC2_TYPE2.value]
        
        assert soc2_coverage["compliant_controls"] == compliant_count
        expected_percentage = (compliant_count / soc2_coverage["total_controls"]) * 100
        assert soc2_coverage["compliance_percentage"] == expected_percentage
        
        # Check status breakdown
        status_breakdown = soc2_coverage["status_breakdown"]
        assert status_breakdown["compliant"] == compliant_count
    
    def test_mixed_framework_compliance(self):
        """Test coverage with different compliance levels per framework"""
        # SOC2: Mark 1 control as compliant
        soc2_controls = [c for c in self.matrix.controls.keys() 
                        if self.matrix.controls[c].framework == ComplianceFramework.SOC2_TYPE2]
        self.matrix.update_control_status(soc2_controls[0], ComplianceStatus.COMPLIANT)
        
        # ISO27001: Mark 2 controls as compliant
        iso_controls = [c for c in self.matrix.controls.keys() 
                        if self.matrix.controls[c].framework == ComplianceFramework.ISO27001]
        for control_id in iso_controls[:2]:
            self.matrix.update_control_status(control_id, ComplianceStatus.COMPLIANT)
        
        coverage = self.matrix.get_framework_coverage()
        
        # SOC2 should have lower compliance percentage than ISO27001
        soc2_percentage = coverage[ComplianceFramework.SOC2_TYPE2.value]["compliance_percentage"]
        iso_percentage = coverage[ComplianceFramework.ISO27001.value]["compliance_percentage"]
        
        assert soc2_percentage > 0
        assert iso_percentage > 0
        # ISO should have higher percentage (2 compliant vs fewer total controls)
        assert iso_percentage >= soc2_percentage

class TestPerformanceAndScalability:
    """Test performance and scalability"""
    
    def setup_method(self):
        self.temp_dir = Path(tempfile.mkdtemp())
        self.matrix = ComplianceMatrix(self.temp_dir)
    
    def teardown_method(self):
        import shutil
        shutil.rmtree(self.temp_dir)
    
    def test_multiple_frameworks_performance(self):
        """Test performance with multiple frameworks loaded"""
        start_time = datetime.now()
        
        # Load all major frameworks
        frameworks = [
            ComplianceFramework.SOC2_TYPE2,
            ComplianceFramework.ISO27001,
            ComplianceFramework.NIST_CSF,
            ComplianceFramework.GDPR
        ]
        
        for framework in frameworks:
            self.matrix.add_framework(framework)
        
        duration = datetime.now() - start_time
        
        # Should load quickly (< 1 second)
        assert duration.total_seconds() < 1.0
        assert len(self.matrix.controls) > 20  # Should have many controls loaded
        assert len(self.matrix.frameworks) == 4
    
    def test_large_scale_status_updates(self):
        """Test performance of bulk status updates"""
        self.matrix.add_framework(ComplianceFramework.SOC2_TYPE2)
        self.matrix.add_framework(ComplianceFramework.ISO27001)
        
        start_time = datetime.now()
        
        # Update status for all controls
        for control_id in self.matrix.controls.keys():
            self.matrix.update_control_status(control_id, ComplianceStatus.IMPLEMENTED)
        
        duration = datetime.now() - start_time
        
        # Should complete quickly
        assert duration.total_seconds() < 2.0
        
        # Verify all controls were updated
        for control in self.matrix.controls.values():
            assert control.status == ComplianceStatus.IMPLEMENTED
    
    def test_report_generation_performance(self):
        """Test report generation performance with large dataset"""
        # Load multiple frameworks
        self.matrix.add_framework(ComplianceFramework.SOC2_TYPE2)
        self.matrix.add_framework(ComplianceFramework.ISO27001)
        self.matrix.add_framework(ComplianceFramework.NIST_CSF)
        
        # Set various statuses
        import random
        statuses = list(ComplianceStatus)
        for control_id in self.matrix.controls.keys():
            status = random.choice(statuses)
            self.matrix.update_control_status(control_id, status)
        
        start_time = datetime.now()
        
        # Generate reports for all frameworks
        reports = {}
        for framework in self.matrix.frameworks:
            reports[framework] = self.matrix.generate_compliance_report(framework)
        
        duration = datetime.now() - start_time
        
        # Should generate all reports quickly
        assert duration.total_seconds() < 1.0
        assert len(reports) == 3
        
        # Verify reports are complete
        for report in reports.values():
            assert report.total_controls > 0
            assert isinstance(report.overall_status, float)

class TestErrorHandlingAndEdgeCases:
    """Test error handling and edge cases"""
    
    def setup_method(self):
        self.temp_dir = Path(tempfile.mkdtemp())
        self.matrix = ComplianceMatrix(self.temp_dir)
    
    def teardown_method(self):
        import shutil
        shutil.rmtree(self.temp_dir)
    
    def test_invalid_control_operations(self):
        """Test operations on invalid controls"""
        self.matrix.add_framework(ComplianceFramework.SOC2_TYPE2)
        
        # Test invalid control ID
        with pytest.raises(ValueError):
            self.matrix.update_control_status("INVALID", ComplianceStatus.IMPLEMENTED)
        
        with pytest.raises(ValueError):
            fake_file = self.temp_dir / "fake.pdf"
            fake_file.write_text("fake")
            self.matrix.add_evidence("INVALID", fake_file)
    
    def test_empty_framework_report(self):
        """Test generating report for framework with no controls"""
        # Try to generate report without adding framework
        with pytest.raises(ValueError, match="No controls found"):
            self.matrix.generate_compliance_report(ComplianceFramework.SOC2_TYPE2)
    
    def test_file_system_permissions(self):
        """Test handling of file system permission issues"""
        # Create a read-only directory scenario
        evidence_dir = self.matrix.evidence_directory
        
        # This test would require platform-specific permission manipulation
        assert evidence_dir.exists()
        assert evidence_dir.is_dir()
    
    def test_malformed_evidence_files(self):
        """Test handling of malformed evidence files"""
        self.matrix.add_framework(ComplianceFramework.SOC2_TYPE2)
        
        # Test with non-existent file
        fake_file = self.temp_dir / "nonexistent.pdf"
        
        with pytest.raises(FileNotFoundError):
            self.matrix.add_evidence("CC6.1", fake_file)
    
    def test_framework_coverage_empty_matrix(self):
        """Test framework coverage with no frameworks"""
        coverage = self.matrix.get_framework_coverage()
        assert coverage == {}
    
    def test_export_empty_matrix(self):
        """Test exporting empty matrix"""
        output_file = self.temp_dir / "empty_export.json"
        self.matrix.export_compliance_matrix(output_file)
        
        assert output_file.exists()
        
        with open(output_file, 'r') as f:
            export_data = json.load(f)
        
        assert export_data["frameworks"] == []
        assert export_data["controls"] == {}
        assert "export_date" in export_data
    
    def test_date_handling_edge_cases(self):
        """Test date handling edge cases"""
        self.matrix.add_framework(ComplianceFramework.SOC2_TYPE2)
        
        # Test with dates in different formats
        control_id = "CC6.1"
        
        # Update status multiple times to test date tracking
        self.matrix.update_control_status(control_id, ComplianceStatus.IMPLEMENTED)
        impl_date = self.matrix.controls[control_id].implementation_date
        
        self.matrix.update_control_status(control_id, ComplianceStatus.TESTED)
        test_date = self.matrix.controls[control_id].last_tested
        
        self.matrix.update_control_status(control_id, ComplianceStatus.COMPLIANT)
        compliant_date = self.matrix.controls[control_id].last_tested
        
        # All dates should be today
        today = date.today()
        assert impl_date == today
        assert test_date == today
        assert compliant_date == today
        
        # Test date should be updated when status changes to TESTED or COMPLIANT
        assert compliant_date >= test_date