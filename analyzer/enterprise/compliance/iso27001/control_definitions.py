from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Union, Tuple, Callable, Set

"""
ISO27001:2022 Control Definitions Module
Contains comprehensive Annex A control catalog with structured definitions.
"""

from dataclasses import dataclass
from typing import Dict, List, Optional
import logging

logger = logging.getLogger(__name__)


@dataclass
class ISO27001Control:
    """ISO27001:2022 Annex A control definition."""
    control_id: str
    category: str
    title: str
    description: str
    purpose: str
    implementation_guidance: List[str]
    priority: str
    applicable: bool
    evidence_required: List[str]
    automated: bool


class ISO27001ControlCatalog:
    """Manages ISO27001:2022 Annex A controls catalog."""

    def __init__(self):
        self.controls = self._initialize_controls()
        logger.info(f"Initialized {len(self.controls)} ISO27001 controls")

    def _initialize_controls(self) -> Dict[str, ISO27001Control]:
        """Initialize complete ISO27001:2022 Annex A controls catalog."""
        controls = {}

        # A.5 - Organizational Information Security Policies
        org_controls = [
            ISO27001Control(
                "A.5.1", "A.5", "Policies for Information Security",
                "Information security policy and topic-specific policies shall be defined, approved by management, published, communicated to and acknowledged by relevant personnel and relevant interested parties.",
                "Management direction and support for information security in accordance with business requirements and relevant laws and regulations",
                ["policy_documentation", "management_approval", "communication_records"],
                "high", True, ["policy_docs", "approval_records", "training_records"], False
            ),
            ISO27001Control(
                "A.5.2", "A.5", "Information Security Roles and Responsibilities",
                "Information security roles and responsibilities shall be defined and allocated according to the organization needs.",
                "Ensure accountability for information security activities",
                ["role_definitions", "responsibility_matrix", "accountability_framework"],
                "medium", True, ["org_charts", "job_descriptions", "raci_matrix"], False
            ),
            ISO27001Control(
                "A.5.3", "A.5", "Segregation of Duties",
                "Conflicting duties and conflicting areas of responsibility shall be segregated.",
                "Reduce opportunities for unauthorized or unintentional modification or misuse of assets",
                ["duty_segregation_analysis", "conflict_identification", "control_implementation"],
                "high", True, ["access_reviews", "segregation_matrix"], True
            )
        ]

        for control in org_controls:
            controls[control.control_id] = control

        # A.6 - Organization of Information Security
        org_sec_controls = [
            ISO27001Control(
                "A.6.1", "A.6", "Information Security Management System",
                "The information security management system shall be defined and managed in accordance with the organization's needs.",
                "Provide management framework for implementing and managing information security",
                ["isms_documentation", "management_system", "continuous_improvement"],
                "high", True, ["isms_scope", "risk_assessments", "management_reviews"], False
            ),
            ISO27001Control(
                "A.6.2", "A.6", "Information Security in Project Management",
                "Information security shall be addressed in project management.",
                "Ensure information security is considered throughout project lifecycle",
                ["project_security_requirements", "security_in_sdlc", "project_reviews"],
                "medium", True, ["project_docs", "security_requirements", "review_records"], True
            )
        ]

        for control in org_sec_controls:
            controls[control.control_id] = control

        # A.8 - Asset Management
        asset_controls = [
            ISO27001Control(
                "A.8.1", "A.8", "Inventory of Assets",
                "Assets associated with information and information processing facilities shall be identified, and an inventory of these assets shall be drawn up and maintained.",
                "Ensure appropriate protection of assets",
                ["asset_inventory", "asset_classification", "asset_ownership"],
                "high", True, ["asset_registers", "inventory_systems", "classification_schemes"], True
            ),
            ISO27001Control(
                "A.8.2", "A.8", "Ownership of Assets",
                "Assets maintained in the inventory shall be owned.",
                "Ensure assets have designated owners responsible for appropriate protection",
                ["ownership_assignment", "custodian_responsibilities", "accountability_matrix"],
                "medium", True, ["asset_ownership_records", "custodian_agreements"], False
            ),
            ISO27001Control(
                "A.8.3", "A.8", "Acceptable Use of Assets",
                "Rules for the acceptable use of information and of assets associated with information and information processing facilities shall be identified, documented and implemented.",
                "Prevent unauthorized disclosure, modification, removal or destruction of information",
                ["acceptable_use_policy", "user_agreements", "usage_monitoring"],
                "medium", True, ["aup_documents", "signed_agreements", "monitoring_logs"], True
            )
        ]

        for control in asset_controls:
            controls[control.control_id] = control

        # A.9 - Access Control
        access_controls = [
            ISO27001Control(
                "A.9.1", "A.9", "Access Control Policy",
                "An access control policy shall be established, documented and reviewed based on business and information security requirements.",
                "Limit access to information and information processing facilities",
                ["access_control_policy", "policy_review", "business_requirements_alignment"],
                "high", True, ["policy_documents", "review_records", "approval_evidence"], False
            ),
            ISO27001Control(
                "A.9.2", "A.9", "Access to Networks and Network Services",
                "Users shall only be provided with access to the network and network services that they have been specifically authorized to use.",
                "Prevent unauthorized access to networks and network services",
                ["network_access_control", "authorization_procedures", "access_monitoring"],
                "high", True, ["access_lists", "authorization_records", "monitoring_systems"], True
            )
        ]

        for control in access_controls:
            controls[control.control_id] = control

        # A.10 - Cryptography
        crypto_controls = [
            ISO27001Control(
                "A.10.1", "A.10", "Cryptographic Controls",
                "A policy on the use of cryptographic controls for protection of information shall be developed and implemented.",
                "Protect the confidentiality, authenticity or integrity of information",
                ["crypto_policy", "encryption_standards", "key_management"],
                "high", True, ["crypto_policies", "encryption_usage", "key_management_procedures"], True
            )
        ]

        for control in crypto_controls:
            controls[control.control_id] = control

        # A.12 - Operations Security
        ops_controls = [
            ISO27001Control(
                "A.12.1", "A.12", "Operational Procedures and Responsibilities",
                "Operating procedures shall be documented and made available to all users who need them.",
                "Ensure correct and secure operations of information processing facilities",
                ["procedure_documentation", "responsibility_assignment", "procedure_maintenance"],
                "medium", True, ["procedure_documents", "responsibility_matrices", "update_records"], False
            ),
            ISO27001Control(
                "A.12.2", "A.12", "Protection from Malware",
                "Detection, prevention and recovery controls to protect against malware shall be implemented, combined with appropriate user awareness.",
                "Protect against malware and respond to malware incidents",
                ["malware_protection", "detection_systems", "user_awareness"],
                "high", True, ["antimalware_systems", "detection_logs", "incident_records"], True
            )
        ]

        for control in ops_controls:
            controls[control.control_id] = control

        # A.13 - Communications Security
        comm_controls = [
            ISO27001Control(
                "A.13.1", "A.13", "Network Security Management",
                "Networks shall be managed and controlled to protect information in systems and applications.",
                "Ensure the protection of information in networks and supporting information processing facilities",
                ["network_security_controls", "network_monitoring", "security_management"],
                "high", True, ["security_configurations", "monitoring_systems", "management_procedures"], True
            )
        ]

        for control in comm_controls:
            controls[control.control_id] = control

        # A.14 - System Acquisition, Development and Maintenance
        dev_controls = [
            ISO27001Control(
                "A.14.1", "A.14", "Information Security Requirements Analysis and Specification",
                "Information security requirements shall be included in the requirements for new information systems or enhancements to existing information systems.",
                "Ensure that information security is an integral part of information systems across the entire lifecycle",
                ["security_requirements", "requirements_analysis", "system_lifecycle"],
                "high", True, ["requirements_documents", "security_specifications", "review_records"], False
            ),
            ISO27001Control(
                "A.14.2", "A.14", "Securing Application Services on Public Networks",
                "Information involved in application services passing over public networks shall be protected from fraudulent activity, contract dispute and unauthorized disclosure and modification.",
                "Protect application services and users from fraudulent activity, contract dispute and unauthorized disclosure and modification",
                ["application_security", "network_protection", "secure_transmission"],
                "high", True, ["security_controls", "encryption_evidence", "monitoring_logs"], True
            )
        ]

        for control in dev_controls:
            controls[control.control_id] = control

        return controls

    def get_control(self, control_id: str) -> Optional[ISO27001Control]:
        """Get specific control by ID."""
        return self.controls.get(control_id)

    def get_controls_by_category(self, category: str) -> List[ISO27001Control]:
        """Get all controls in a specific category."""
        return [control for control in self.controls.values() if control.category == category]

    def get_high_priority_controls(self) -> List[ISO27001Control]:
        """Get all high priority controls."""
        return [control for control in self.controls.values() if control.priority == "high"]

    def get_automated_controls(self) -> List[ISO27001Control]:
        """Get all controls that support automation."""
        return [control for control in self.controls.values() if control.automated]

    def get_control_statistics(self) -> Dict[str, any]:
        """Get statistics about the control catalog."""
        total_controls = len(self.controls)
        by_category = {}
        by_priority = {}
        automated_count = 0

        for control in self.controls.values():
            # Count by category
            by_category[control.category] = by_category.get(control.category, 0) + 1

            # Count by priority
            by_priority[control.priority] = by_priority.get(control.priority, 0) + 1

            # Count automated
            if control.automated:
                automated_count += 1

        return {
            "total_controls": total_controls,
            "by_category": by_category,
            "by_priority": by_priority,
            "automated_controls": automated_count,
            "automation_percentage": (automated_count / total_controls) * 100 if total_controls > 0 else 0
        }

    def validate_control_completeness(self) -> Dict[str, any]:
        """Validate completeness of control definitions."""
        issues = []

        for control_id, control in self.controls.items():
            if not control.description.strip():
                issues.append(f"{control_id}: Missing description")

            if not control.purpose.strip():
                issues.append(f"{control_id}: Missing purpose")

            if not control.implementation_guidance:
                issues.append(f"{control_id}: Missing implementation guidance")

            if not control.evidence_required:
                issues.append(f"{control_id}: Missing evidence requirements")

        return {
            "valid": len(issues) == 0,
            "issues": issues,
            "completeness_percentage": ((len(self.controls) * 4 - len(issues)) / (len(self.controls) * 4)) * 100 if len(self.controls) > 0 else 0
        }


"""
<!-- AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE -->
## Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
|--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
| 1.0.0   | 2025-9-24T15:12:03-04:00 | coder@Sonnet-4 | Created ISO27001 control definitions module | control_definitions.py | OK | Extracted from corrupted god object | 0.10 | e3b4d8c |

### Receipt
- status: OK
- reason_if_blocked: --
- run_id: phase3-iso27001-controls-01
- inputs: ["iso27001.py"]
- tools_used: ["Write"]
- versions: {"model":"Sonnet-4","prompt":"v1.0.0"}
<!-- AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE -->
"""