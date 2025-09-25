"""
IncidentDetector - Extracted from EnhancedIncidentResponseSystem
Handles security incident detection and classification
Part of god object decomposition (Day 3-5)
"""

from collections import defaultdict
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Any, Set
import json
import logging

from dataclasses import dataclass, field
from enum import Enum

logger = logging.getLogger(__name__)

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

class IncidentSeverity(Enum):
    """Incident severity levels."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"
    EMERGENCY = "emergency"

@dataclass
class SecurityIncident:
    """Represents a detected security incident."""
    incident_id: str
    incident_type: IncidentType
    severity: IncidentSeverity
    timestamp: datetime
    source: str
    target: str
    description: str
    indicators: List[str] = field(default_factory=list)
    affected_systems: List[str] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)

class IncidentDetector:
    """
    Handles security incident detection and classification.

    Extracted from EnhancedIncidentResponseSystem (1, 226 LOC -> ~300 LOC component).
    Handles:
    - Real-time incident detection
    - Incident classification and severity assessment
    - Pattern-based detection
    - Anomaly detection
    - Threat indicator correlation
    """

    def __init__(self, sensitivity: float = 0.7):
        """Initialize the incident detector."""
        self.sensitivity = sensitivity
        self.detected_incidents: List[SecurityIncident] = []
        self.detection_rules: Dict[str, Dict[str, Any]] = {}
        self.threat_indicators: Dict[str, List[str]] = defaultdict(list)
        self.baseline_metrics: Dict[str, Any] = {}

        # Initialize detection rules
        self._load_detection_rules()

    def _load_detection_rules(self) -> None:
        """Load incident detection rules."""
        self.detection_rules = {
            "unauthorized_access": {
                "patterns": ["401", "403", "unauthorized", "denied", "forbidden"],
                "threshold": 5,
                "window_minutes": 10,
                "severity_escalation": {"count": 10, "severity": IncidentSeverity.HIGH}
            },
            "data_breach": {
                "patterns": ["data leak", "exfiltration", "unauthorized download", "bulk export"],
                "threshold": 1,
                "window_minutes": 60,
                "severity_escalation": {"count": 1, "severity": IncidentSeverity.EMERGENCY}
            },
            "malware": {
                "patterns": ["virus", "trojan", "malware", "ransomware", "suspicious executable"],
                "threshold": 1,
                "window_minutes": 5,
                "severity_escalation": {"count": 1, "severity": IncidentSeverity.CRITICAL}
            },
            "intrusion": {
                "patterns": ["port scan", "brute force", "sql injection", "xss", "exploit"],
                "threshold": 3,
                "window_minutes": 15,
                "severity_escalation": {"count": 5, "severity": IncidentSeverity.HIGH}
            },
            "dos_attack": {
                "patterns": ["rate limit", "flood", "ddos", "excessive requests", "connection overflow"],
                "threshold": 100,
                "window_minutes": 5,
                "severity_escalation": {"count": 500, "severity": IncidentSeverity.CRITICAL}
            },
            "compliance": {
                "patterns": ["policy violation", "compliance failure", "audit failure", "regulatory breach"],
                "threshold": 1,
                "window_minutes": 1440,  # 24 hours
                "severity_escalation": {"count": 3, "severity": IncidentSeverity.HIGH}
            }
        }

    def detect_incident(self,
                        event_data: Dict[str, Any]) -> Optional[SecurityIncident]:
        """Detect security incident from event data."""
        # Extract event information
        event_type = event_data.get("type", "unknown")
        event_message = event_data.get("message", "")
        event_source = event_data.get("source", "unknown")
        event_target = event_data.get("target", "unknown")
        event_timestamp = event_data.get("timestamp", datetime.now())

        # Check against detection rules
        for incident_type, rule in self.detection_rules.items():
            if self._matches_rule(event_message, rule):
                # Determine severity
                severity = self._assess_severity(incident_type, event_data, rule)

                # Create incident
                incident = SecurityIncident(
                    incident_id=self._generate_incident_id(),
                    incident_type=self._map_incident_type(incident_type),
                    severity=severity,
                    timestamp=event_timestamp,
                    source=event_source,
                    target=event_target,
                    description=self._generate_description(incident_type, event_message),
                    indicators=self._extract_indicators(event_data),
                    affected_systems=self._identify_affected_systems(event_data),
                    metadata=event_data
                )

                # Store incident
                self.detected_incidents.append(incident)

                # Update threat indicators
                self._update_threat_indicators(incident)

                return incident

        # Check for anomalies even if no rule matches
        if self._is_anomalous(event_data):
            return self._create_anomaly_incident(event_data)

        return None

    def _matches_rule(self, message: str, rule: Dict[str, Any]) -> bool:
        """Check if message matches detection rule."""
        message_lower = message.lower()
        patterns = rule.get("patterns", [])

        for pattern in patterns:
            if pattern.lower() in message_lower:
                return True

        return False

    def _assess_severity(self,
                        incident_type: str,
                        event_data: Dict[str, Any],
                        rule: Dict[str, Any]) -> IncidentSeverity:
        """Assess incident severity."""
        # Base severity based on incident type
        base_severity = {
            "unauthorized_access": IncidentSeverity.MEDIUM,
            "data_breach": IncidentSeverity.CRITICAL,
            "malware": IncidentSeverity.HIGH,
            "intrusion": IncidentSeverity.HIGH,
            "dos_attack": IncidentSeverity.HIGH,
            "compliance": IncidentSeverity.MEDIUM
        }

        severity = base_severity.get(incident_type, IncidentSeverity.MEDIUM)

        # Check for escalation conditions
        escalation = rule.get("severity_escalation", {})
        if "frequency" in event_data:
            if event_data["frequency"] >= escalation.get("count", float('inf')):
                severity = escalation.get("severity", severity)

        # Check for critical indicators
        if self._has_critical_indicators(event_data):
            severity = IncidentSeverity.CRITICAL

        return severity

    def _has_critical_indicators(self, event_data: Dict[str, Any]) -> bool:
        """Check for critical security indicators."""
        critical_patterns = [
            "root access",
            "admin compromise",
            "data exfiltration",
            "ransomware",
            "zero-day",
            "backdoor",
            "privilege escalation"
        ]

        message = str(event_data.get("message", "")).lower()
        return any(pattern in message for pattern in critical_patterns)

    def _map_incident_type(self, type_str: str) -> IncidentType:
        """Map string to IncidentType enum."""
        mapping = {
            "unauthorized_access": IncidentType.UNAUTHORIZED_ACCESS,
            "data_breach": IncidentType.DATA_BREACH,
            "malware": IncidentType.MALWARE_DETECTION,
            "intrusion": IncidentType.INTRUSION_ATTEMPT,
            "dos_attack": IncidentType.DENIAL_OF_SERVICE,
            "compliance": IncidentType.COMPLIANCE_VIOLATION
        }
        return mapping.get(type_str, IncidentType.INTRUSION_ATTEMPT)

    def _generate_incident_id(self) -> str:
        """Generate unique incident ID."""
        import uuid
        return f"INC-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:8]}"

    def _generate_description(self, incident_type: str, message: str) -> str:
        """Generate incident description."""
        descriptions = {
            "unauthorized_access": f"Unauthorized access attempt detected: {message[:100]}",
            "data_breach": f"Potential data breach identified: {message[:100]}",
            "malware": f"Malware activity detected: {message[:100]}",
            "intrusion": f"Intrusion attempt detected: {message[:100]}",
            "dos_attack": f"Denial of service attack detected: {message[:100]}",
            "compliance": f"Compliance violation detected: {message[:100]}"
        }
        return descriptions.get(incident_type, f"Security incident: {message[:100]}")

    def _extract_indicators(self, event_data: Dict[str, Any]) -> List[str]:
        """Extract threat indicators from event."""
        indicators = []

        # Extract IPs
        if "source_ip" in event_data:
            indicators.append(f"IP:{event_data['source_ip']}")

        # Extract user
        if "user" in event_data:
            indicators.append(f"User:{event_data['user']}")

        # Extract file hashes
        if "file_hash" in event_data:
            indicators.append(f"Hash:{event_data['file_hash']}")

        # Extract URLs
        if "url" in event_data:
            indicators.append(f"URL:{event_data['url']}")

        return indicators

    def _identify_affected_systems(self, event_data: Dict[str, Any]) -> List[str]:
        """Identify systems affected by incident."""
        systems = []

        # Extract from event data
        if "target" in event_data:
            systems.append(event_data["target"])

        if "affected_hosts" in event_data:
            systems.extend(event_data["affected_hosts"])

        if "service" in event_data:
            systems.append(event_data["service"])

        return list(set(systems))  # Remove duplicates

    def _update_threat_indicators(self, incident: SecurityIncident) -> None:
        """Update threat indicator database."""
        for indicator in incident.indicators:
            self.threat_indicators[incident.incident_type.value].append(indicator)

    def _is_anomalous(self, event_data: Dict[str, Any]) -> bool:
        """Detect anomalous behavior."""
        # Simple anomaly detection based on baseline
        if not self.baseline_metrics:
            return False

        # Check for unusual patterns
        metrics = self._extract_metrics(event_data)

        for metric, value in metrics.items():
            baseline = self.baseline_metrics.get(metric, {})
            mean = baseline.get("mean", 0)
            stddev = baseline.get("stddev", 1)

            # Check if value is outside normal range
            if abs(value - mean) > (3 * stddev * self.sensitivity):
                return True

        return False

    def _create_anomaly_incident(self, event_data: Dict[str, Any]) -> SecurityIncident:
        """Create incident for detected anomaly."""
        return SecurityIncident(
            incident_id=self._generate_incident_id(),
            incident_type=IncidentType.INTRUSION_ATTEMPT,
            severity=IncidentSeverity.MEDIUM,
            timestamp=datetime.now(),
            source=event_data.get("source", "unknown"),
            target=event_data.get("target", "unknown"),
            description="Anomalous behavior detected",
            indicators=self._extract_indicators(event_data),
            affected_systems=self._identify_affected_systems(event_data),
            metadata=event_data
        )

    def _extract_metrics(self, event_data: Dict[str, Any]) -> Dict[str, float]:
        """Extract metrics for anomaly detection."""
        metrics = {}

        # Extract numeric values
        for key, value in event_data.items():
            if isinstance(value, (int, float)):
                metrics[key] = float(value)

        return metrics

    def update_baseline(self, metrics: Dict[str, Dict[str, float]]) -> None:
        """Update baseline metrics for anomaly detection."""
        self.baseline_metrics = metrics

    def get_incident_statistics(self) -> Dict[str, Any]:
        """Get statistics about detected incidents."""
        from collections import Counter

        type_counts = Counter(i.incident_type.value for i in self.detected_incidents)
        severity_counts = Counter(i.severity.value for i in self.detected_incidents)

        return {
            "total_incidents": len(self.detected_incidents),
            "incidents_by_type": dict(type_counts),
            "incidents_by_severity": dict(severity_counts),
            "threat_indicators": sum(len(v) for v in self.threat_indicators.values()),
            "detection_rules": len(self.detection_rules)
        }