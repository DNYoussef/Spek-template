"""
Security incident response data models and enums.
Extracted from enhanced_incident_response_system.py for modularity.
"""

from enum import Enum
from dataclasses import dataclass
from typing import List, Dict, Any, Optional


class IncidentType(Enum):
    """Types of security incidents."""
    UNAUTHORIZED_ACCESS = "unauthorized_access"
    DATA_BREACH = "data_breach"
    MALWARE_DETECTION = "malware_detection"
    INTRUSION_ATTEMPT = "intrusion_attempt"
    AUDIT_INTEGRITY_FAILURE = "audit_integrity_failure"
    COMPLIANCE_VIOLATION = "compliance_violation"
    SYSTEM_COMPROMISE = "system_compromise"
    INSIDER_THREAT = "insider_threat"
    DENIAL_OF_SERVICE = "denial_of_service"
    CRYPTOGRAPHIC_FAILURE = "cryptographic_failure"
    SUPPLY_CHAIN_COMPROMISE = "supply_chain_compromise"
    CONFIGURATION_TAMPERING = "configuration_tampering"


class IncidentSeverity(Enum):
    """Incident severity levels."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"
    EMERGENCY = "emergency"


class IncidentStatus(Enum):
    """Incident handling status."""
    DETECTED = "detected"
    ANALYZING = "analyzing"
    CONTAINED = "contained"
    ERADICATING = "eradicating"
    RECOVERING = "recovering"
    RESOLVED = "resolved"
    CLOSED = "closed"


class ResponseAction(Enum):
    """Automated response actions."""
    ALERT_ONLY = "alert_only"
    ISOLATE_SYSTEM = "isolate_system"
    BLOCK_IP = "block_ip"
    DISABLE_ACCOUNT = "disable_account"
    BACKUP_EVIDENCE = "backup_evidence"
    ESCALATE_TO_HUMAN = "escalate_to_human"
    EMERGENCY_SHUTDOWN = "emergency_shutdown"
    QUARANTINE_FILES = "quarantine_files"
    RESET_CREDENTIALS = "reset_credentials"
    ACTIVATE_BACKUP_SYSTEMS = "activate_backup_systems"


class ThreatLevel(Enum):
    """Threat assessment levels."""
    INFORMATIONAL = "informational"
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


@dataclass
class SecurityIncident:
    """Enhanced security incident record."""
    incident_id: str
    incident_type: IncidentType
    severity: IncidentSeverity
    status: IncidentStatus
    detected_timestamp: float
    source_system: str
    affected_resources: List[str]
    indicators: Dict[str, Any]
    description: str
    initial_analysis: str
    evidence: List[str]
    response_actions: List[ResponseAction]
    assigned_responder: Optional[str]
    containment_timestamp: Optional[float]
    resolution_timestamp: Optional[float]
    lessons_learned: Optional[str]
    metadata: Dict[str, Any]
    threat_level: ThreatLevel
    attack_vector: Optional[str]
    potential_impact: Optional[str]
    remediation_steps: List[str]
    timeline: List[Dict[str, Any]]


@dataclass
class ThreatIndicator:
    """Threat indicator for detection."""
    indicator_id: str
    indicator_type: str
    pattern: str
    severity: IncidentSeverity
    description: str
    confidence_level: float
    ttl: int  # Time to live in seconds
    created_timestamp: float
    last_seen: Optional[float]
    hit_count: int
    false_positive_rate: float
    mitigation_actions: List[ResponseAction]


@dataclass
class ResponsePlaybook:
    """Enhanced incident response playbook."""
    playbook_id: str
    incident_type: IncidentType
    severity_threshold: IncidentSeverity
    automated_actions: List[ResponseAction]
    escalation_criteria: Dict[str, Any]
    containment_procedures: List[str]
    eradication_procedures: List[str]
    recovery_procedures: List[str]
    notification_requirements: Dict[str, Any]
    estimated_time_to_contain: int
    estimated_time_to_resolve: int
    required_evidence: List[str]
    compliance_requirements: List[str]


@dataclass
class ForensicEvidence:
    """Forensic evidence package."""
    evidence_id: str
    incident_id: str
    collection_timestamp: float
    collector: str
    evidence_type: str
    source_system: str
    evidence_data: Dict[str, Any]
    chain_of_custody: List[Dict[str, Any]]
    integrity_hash: str
    encryption_status: bool
    preservation_method: str
    legal_hold: bool