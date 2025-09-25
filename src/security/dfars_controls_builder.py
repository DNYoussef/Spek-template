"""
DFARS Controls Builder - Thread-safe builder for DFARS 252.204-7012 controls.

This module provides a thread-safe builder pattern for DFARS security controls
with proper validation and immutability.
"""

from typing import List, Dict, Any

from dataclasses import dataclass, field
from threading import Lock

@dataclass(frozen=True)
class DFARSControl:
    """Immutable DFARS control configuration."""
    control_id: str
    title: str
    requirement_text: str
    implementation_guidance: str
    validation_procedures: List[str]
    evidence_requirements: List[str]

class DFARSControlsBuilder:
    """Thread-safe builder for DFARS controls with validation."""

    def __init__(self):
        self._controls: Dict[str, DFARSControl] = {}
        self._built = False
        self._lock = Lock()

    def add_control(self, control: DFARSControl) -> 'DFARSControlsBuilder':
        """Add DFARS control with validation."""
        with self._lock:
            if self._built:
                raise RuntimeError("Builder already used")
            if not control.control_id:
                raise ValueError("Control ID required")
            if not control.title:
                raise ValueError("Control title required")
            if not isinstance(control, DFARSControl):
                raise TypeError("Control must be DFARSControl instance")
            self._controls[control.control_id] = control
            return self

    def build(self) -> Dict[str, DFARSControl]:
        """Build and validate DFARS controls database."""
        with self._lock:
            if self._built:
                raise RuntimeError("Builder already used")
            if not self._controls:
                raise ValueError("No controls configured")

            # Validate all controls
            for control_id, control in self._controls.items():
                if not control.requirement_text:
                    raise ValueError(f"Control {control_id} missing requirement text")
                if not control.validation_procedures:
                    raise ValueError(f"Control {control_id} missing validation procedures")

            self._built = True
            return self._controls.copy()

def _initialize_dfars_controls() -> Dict[str, DFARSControl]:
    """Initialize DFARS 252.204-7012 controls."""
    builder = DFARSControlsBuilder()

    builder.add_control(DFARSControl(
        control_id="AC-1",
        title="Access Control Policy and Procedures",
        requirement_text="The contractor shall implement access control policies and procedures to limit information system access to authorized users",
        implementation_guidance="Establish formal access control policies that address purpose, scope, roles, responsibilities, and compliance requirements",
        validation_procedures=[
            "Review access control policy documentation",
            "Verify policy dissemination to appropriate personnel",
            "Validate policy review and update procedures"
        ],
        evidence_requirements=[
            "Signed access control policy",
            "Policy distribution records",
            "Annual review documentation"
        ]
    ))

    builder.add_control(DFARSControl(
        control_id="AC-2",
        title="Account Management",
        requirement_text="The contractor shall manage information system accounts to ensure appropriate access",
        implementation_guidance="Implement account management procedures for user identification, authentication, and authorization",
        validation_procedures=[
            "Review account provisioning procedures",
            "Validate account deprovisioning controls",
            "Verify periodic account reviews"
        ],
        evidence_requirements=[
            "Account management procedures",
            "Account review logs",
            "Privileged account documentation"
        ]
    ))

    builder.add_control(DFARSControl(
        control_id="IA-2",
        title="Identification and Authentication (Organizational Users)",
        requirement_text="The contractor shall uniquely identify and authenticate organizational users",
        implementation_guidance="Implement multi-factor authentication for all organizational users",
        validation_procedures=[
            "Test authentication mechanisms",
            "Verify multi-factor authentication implementation",
            "Validate user identification processes"
        ],
        evidence_requirements=[
            "Authentication policy",
            "MFA implementation documentation",
            "User access logs"
        ]
    ))

    builder.add_control(DFARSControl(
        control_id="SC-7",
        title="Boundary Protection",
        requirement_text="The contractor shall monitor, control, and protect communications at the external boundary of the system",
        implementation_guidance="Implement boundary protection devices such as firewalls, network segmentation, and intrusion detection",
        validation_procedures=[
            "Test firewall configurations",
            "Verify network segmentation",
            "Validate boundary monitoring"
        ],
        evidence_requirements=[
            "Firewall configuration documentation",
            "Network diagrams",
            "Monitoring logs"
        ]
    ))

    return builder.build()