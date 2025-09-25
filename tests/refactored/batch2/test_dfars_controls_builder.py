"""Tests for DFARS Controls Builder"""

from src.security.dfars_controls_builder import (
import pytest

class TestSecurityControlBuilder:
    """Test SecurityControlBuilder class."""

    def test_builder_creates_valid_control(self):
        """Test builder creates valid security control."""
        control = (
            SecurityControlBuilder()
            .with_id("AC-01")
            .with_title("Access Control")
            .with_description("Control access to systems")
            .in_category(ValidationCategory.ACCESS_CONTROL)
            .with_requirement("Must control access")
            .with_guidance("Follow best practices")
            .add_procedures("Review policy", "Test implementation")
            .add_evidence("Policy document", "Test results")
            .add_testing("Manual review", "Automated scan")
            .with_priority(1)
            .with_nist_mapping("NIST SP 800-53 AC-1")
            .with_dfars_reference("DFARS 252.204-7012(b)(1)")
            .build()
        )

        assert control.control_id == "AC-01"
        assert control.title == "Access Control"
        assert control.category == ValidationCategory.ACCESS_CONTROL
        assert len(control.validation_procedures) == 2

    def test_builder_validates_required_fields(self):
        """Test builder validates required fields."""
        with pytest.raises(ValueError, match="Control ID is required"):
            SecurityControlBuilder().build()

        builder = SecurityControlBuilder().with_id("ID")
        with pytest.raises(ValueError, match="Control title is required"):
            builder.build()

    def test_builder_adds_multiple_procedures(self):
        """Test builder adds multiple validation procedures."""
        control = (
            SecurityControlBuilder()
            .with_id("TEST")
            .with_title("Test")
            .with_description("Test control")
            .in_category(ValidationCategory.ACCESS_CONTROL)
            .with_dfars_reference("TEST")
            .add_procedures("Proc1", "Proc2", "Proc3")
            .build()
        )

        assert len(control.validation_procedures) == 3

    def test_initialize_dfars_controls(self):
        """Test _initialize_dfars_controls returns valid list."""
        controls = _initialize_dfars_controls()

        assert isinstance(controls, list)
        assert len(controls) >= 2
        assert all(isinstance(c, SecurityControl) for c in controls)

    def test_controls_have_required_fields(self):
        """Test all controls have required fields."""
        controls = _initialize_dfars_controls()

        for control in controls:
            assert control.control_id
            assert control.title
            assert control.category
            assert control.dfars_reference
            assert len(control.validation_procedures) > 0

    def test_controls_have_priority_levels(self):
        """Test controls have priority levels."""
        controls = _initialize_dfars_controls()
        priorities = {c.priority for c in controls}

        assert 1 in priorities  # At least priority 1 controls exist

    def test_ac_01_control_structure(self):
        """Test AC-01 control has correct structure."""
        controls = _initialize_dfars_controls()
        ac_01 = next((c for c in controls if c.control_id == "AC-01"), None)

        assert ac_01 is not None
        assert ac_01.category == ValidationCategory.ACCESS_CONTROL
        assert "policy" in ac_01.title.lower()
        assert ac_01.priority == 1

    def test_au_01_control_structure(self):
        """Test AU-01 control has correct structure."""
        controls = _initialize_dfars_controls()
        au_01 = next((c for c in controls if c.control_id == "AU-01"), None)

        assert au_01 is not None
        assert au_01.category == ValidationCategory.AUDIT_ACCOUNTABILITY
        assert "audit" in au_01.title.lower()

class TestControlCategories:
    """Test control category logic."""

    def test_all_categories_have_controls(self):
        """Test all validation categories have controls."""
        controls = _initialize_dfars_controls()
        categories = {c.category for c in controls}

        assert ValidationCategory.ACCESS_CONTROL in categories
        assert ValidationCategory.AUDIT_ACCOUNTABILITY in categories

    def test_nist_mappings_are_present(self):
        """Test NIST mappings are present."""
        controls = _initialize_dfars_controls()

        for control in controls:
            if control.nist_mapping:
                assert "NIST" in control.nist_mapping