"""
Incident detection service.
Extracted from enhanced_incident_response_system.py for focused responsibility.
"""

import time
import secrets
from typing import Dict, Any, Optional, List
from lib.shared.utilities import get_logger

from ..models import (
    SecurityIncident, ThreatIndicator, IncidentType, IncidentStatus,
    IncidentSeverity, ThreatLevel, ResponseAction
)

logger = get_logger(__name__)


class IncidentDetectionService:
    """
    Focused service for detecting security incidents from event data.
    Handles threat indicator evaluation and incident creation.
    """

    def __init__(self):
        """Initialize the incident detection service."""
        self.threat_indicators: Dict[str, ThreatIndicator] = {}
        self._initialize_default_indicators()

    def detect_incident(self, event_data: Dict[str, Any]) -> Optional[str]:
        """Detect security incident from event data."""
        detection_time = time.time()

        # Analyze event against threat indicators
        triggered_indicators = []

        for indicator in self.threat_indicators.values():
            if self._evaluate_threat_indicator(indicator, event_data):
                triggered_indicators.append(indicator)

        if not triggered_indicators:
            return None

        # Create incident based on highest severity indicator
        primary_indicator = max(triggered_indicators,
                                key=lambda i: self._get_severity_score(i.severity))

        incident_id = self._create_incident_from_indicator(primary_indicator, event_data, detection_time)

        # Update indicator statistics
        for indicator in triggered_indicators:
            indicator.hit_count += 1
            indicator.last_seen = detection_time

        logger.warning(f"Security incident detected: {incident_id}")
        return incident_id

    def _evaluate_threat_indicator(self, indicator: ThreatIndicator, event_data: Dict[str, Any]) -> bool:
        """Evaluate if event data matches threat indicator pattern."""
        pattern = indicator.pattern

        # Simple pattern matching logic
        if "failed_login_attempts" in pattern:
            attempts = event_data.get("failed_attempts", 0)
            threshold = int(pattern.split(">=")[1].split()[0])
            return attempts >= threshold

        elif "large_data_transfer" in pattern:
            transfer_size = event_data.get("transfer_size_mb", 0)
            is_external = event_data.get("external_destination", False)
            is_off_hours = event_data.get("off_hours", False)
            return transfer_size > 100 and is_external and is_off_hours

        elif "privilege_change" in pattern:
            privilege_change = event_data.get("privilege_escalation", False)
            unauthorized = event_data.get("unauthorized", False)
            return privilege_change and unauthorized

        elif "crypto_operation_integrity_check" in pattern:
            integrity_failed = event_data.get("integrity_check_failed", False)
            return integrity_failed

        elif "unusual_internal_network_scanning" in pattern:
            network_scan = event_data.get("internal_scan_detected", False)
            remote_exec = event_data.get("remote_execution", False)
            return network_scan or remote_exec

        return False

    def _get_severity_score(self, severity: IncidentSeverity) -> int:
        """Get numeric score for severity level."""
        scores = {
            IncidentSeverity.LOW: 1,
            IncidentSeverity.MEDIUM: 2,
            IncidentSeverity.HIGH: 3,
            IncidentSeverity.CRITICAL: 4,
            IncidentSeverity.EMERGENCY: 5
        }
        return scores.get(severity, 1)

    def _create_incident_from_indicator(self, indicator: ThreatIndicator,
                                        event_data: Dict[str, Any], detection_time: float) -> str:
        """Create security incident from triggered indicator."""
        incident_id = f"inc_{int(detection_time)}_{secrets.token_hex(8)}"

        # Map indicator type to incident type
        incident_type_map = {
            "authentication": IncidentType.UNAUTHORIZED_ACCESS,
            "data_transfer": IncidentType.DATA_BREACH,
            "authorization": IncidentType.UNAUTHORIZED_ACCESS,
            "cryptographic": IncidentType.CRYPTOGRAPHIC_FAILURE,
            "network": IncidentType.INTRUSION_ATTEMPT
        }

        incident_type = incident_type_map.get(indicator.indicator_type, IncidentType.SYSTEM_COMPROMISE)

        # Determine threat level
        threat_level = ThreatLevel.CRITICAL if indicator.severity == IncidentSeverity.CRITICAL else ThreatLevel.HIGH

        # Extract affected resources
        affected_resources = self._extract_affected_resources(event_data)

        # Generate initial analysis
        initial_analysis = self._generate_initial_analysis(indicator, event_data)

        # Determine attack vector
        attack_vector = self._determine_attack_vector(incident_type, event_data)

        # Assess potential impact
        potential_impact = self._assess_potential_impact(incident_type, affected_resources)

        incident = SecurityIncident(
            incident_id=incident_id,
            incident_type=incident_type,
            severity=indicator.severity,
            status=IncidentStatus.DETECTED,
            detected_timestamp=detection_time,
            source_system="enhanced_monitoring",
            affected_resources=affected_resources,
            indicators={
                "indicator_id": indicator.indicator_id,
                "pattern": indicator.pattern,
                "confidence": indicator.confidence_level,
                "event_data": event_data
            },
            description=f"Security incident detected: {indicator.description}",
            initial_analysis=initial_analysis,
            evidence=[],
            response_actions=[],
            assigned_responder=None,
            containment_timestamp=None,
            resolution_timestamp=None,
            lessons_learned=None,
            metadata={
                "auto_detected": True,
                "detection_system": "enhanced_monitoring",
                "indicator_triggered": indicator.indicator_id
            },
            threat_level=threat_level,
            attack_vector=attack_vector,
            potential_impact=potential_impact,
            remediation_steps=[],
            timeline=[{
                "timestamp": detection_time,
                "event": "incident_detected",
                "description": f"Incident automatically detected by indicator: {indicator.indicator_id}",
                "actor": "system",
                "details": event_data
            }]
        )

        return incident_id

    def _extract_affected_resources(self, event_data: Dict[str, Any]) -> List[str]:
        """Extract affected resources from event data."""
        resources = []

        # Extract common resource identifiers
        resource_fields = [
            "source_ip", "destination_ip", "hostname", "username",
            "file_path", "service_name", "database_name", "application"
        ]

        for field in resource_fields:
            if field in event_data:
                value = event_data[field]
                if isinstance(value, str):
                    resources.append(f"{field}:{value}")
                elif isinstance(value, list):
                    resources.extend([f"{field}:{v}" for v in value])

        return resources

    def _generate_initial_analysis(self, indicator: ThreatIndicator, event_data: Dict[str, Any]) -> str:
        """Generate initial automated analysis."""
        analysis_points = [
            f"Threat indicator '{indicator.indicator_id}' triggered with {indicator.confidence_level:.1%} confidence",
            f"Pattern matched: {indicator.pattern}",
            f"Severity assessed as: {indicator.severity.value.upper()}"
        ]

        # Add context-specific analysis
        if indicator.indicator_type == "authentication":
            if "failed_attempts" in event_data:
                analysis_points.append(f"Failed login attempts: {event_data['failed_attempts']}")
            if "source_ip" in event_data:
                analysis_points.append(f"Attack source: {event_data['source_ip']}")

        elif indicator.indicator_type == "data_transfer":
            if "transfer_size_mb" in event_data:
                analysis_points.append(f"Data transfer size: {event_data['transfer_size_mb']} MB")
            if "external_destination" in event_data:
                analysis_points.append("External data transfer detected")

        # Add threat intelligence context
        if indicator.severity in [IncidentSeverity.CRITICAL, IncidentSeverity.HIGH]:
            analysis_points.append("HIGH PRIORITY: Immediate containment and investigation required")

        return "; ".join(analysis_points)

    def _determine_attack_vector(self, incident_type: IncidentType, event_data: Dict[str, Any]) -> Optional[str]:
        """Determine the attack vector used."""
        vector_mapping = {
            IncidentType.UNAUTHORIZED_ACCESS: "credential_based",
            IncidentType.DATA_BREACH: "data_exfiltration",
            IncidentType.MALWARE_DETECTION: "malware_execution",
            IncidentType.INTRUSION_ATTEMPT: "network_intrusion",
            IncidentType.CRYPTOGRAPHIC_FAILURE: "cryptographic_attack"
        }

        base_vector = vector_mapping.get(incident_type, "unknown")

        # Enhance with event-specific details
        if "source_ip" in event_data:
            base_vector += f"_from_{event_data['source_ip']}"

        if "attack_method" in event_data:
            base_vector += f"_via_{event_data['attack_method']}"

        return base_vector

    def _assess_potential_impact(self, incident_type: IncidentType, affected_resources: List[str]) -> Optional[str]:
        """Assess potential impact of the incident."""
        impact_base = {
            IncidentType.DATA_BREACH: "Potential data loss or exposure",
            IncidentType.UNAUTHORIZED_ACCESS: "Unauthorized system access",
            IncidentType.MALWARE_DETECTION: "System compromise and potential spread",
            IncidentType.CRYPTOGRAPHIC_FAILURE: "Cryptographic integrity compromise",
            IncidentType.INTRUSION_ATTEMPT: "Network security breach"
        }

        base_impact = impact_base.get(incident_type, "System security compromise")

        # Enhance based on affected resources
        critical_resources = [r for r in affected_resources if any(
            critical in r.lower() for critical in ["admin", "root", "database", "domain"]
        )]

        if critical_resources:
            base_impact += f"; Critical resources affected: {len(critical_resources)} systems"

        if len(affected_resources) > 5:
            base_impact += f"; Widespread impact: {len(affected_resources)} resources affected"

        return base_impact

    def _initialize_default_indicators(self):
        """Initialize comprehensive threat detection indicators."""
        default_indicators = [
            ThreatIndicator(
                indicator_id="brute_force_login",
                indicator_type="authentication",
                pattern="failed_login_attempts >= 10 within 5_minutes",
                severity=IncidentSeverity.HIGH,
                description="Brute force login attack detected",
                confidence_level=0.9,
                ttl=3600,  # 1 hour
                created_timestamp=time.time(),
                last_seen=None,
                hit_count=0,
                false_positive_rate=0.5,
                mitigation_actions=[
                    ResponseAction.BLOCK_IP,
                    ResponseAction.DISABLE_ACCOUNT,
                    ResponseAction.ALERT_ONLY
                ]
            ),
            ThreatIndicator(
                indicator_id="data_exfiltration_pattern",
                indicator_type="data_transfer",
                pattern="large_data_transfer to external_destination during off_hours",
                severity=IncidentSeverity.CRITICAL,
                description="Potential data exfiltration detected",
                confidence_level=0.85,
                ttl=7200,  # 2 hours
                created_timestamp=time.time(),
                last_seen=None,
                hit_count=0,
                false_positive_rate=0.10,
                mitigation_actions=[
                    ResponseAction.ISOLATE_SYSTEM,
                    ResponseAction.BACKUP_EVIDENCE,
                    ResponseAction.ESCALATE_TO_HUMAN
                ]
            ),
            ThreatIndicator(
                indicator_id="privilege_escalation",
                indicator_type="authorization",
                pattern="user_privilege_change to admin_level without approval",
                severity=IncidentSeverity.HIGH,
                description="Unauthorized privilege escalation detected",
                confidence_level=0.95,
                ttl=14400,  # 4 hours
                created_timestamp=time.time(),
                last_seen=None,
                hit_count=0,
                false_positive_rate=0.2,
                mitigation_actions=[
                    ResponseAction.DISABLE_ACCOUNT,
                    ResponseAction.BACKUP_EVIDENCE,
                    ResponseAction.ESCALATE_TO_HUMAN
                ]
            ),
            ThreatIndicator(
                indicator_id="crypto_integrity_failure",
                indicator_type="cryptographic",
                pattern="crypto_operation_integrity_check == failed",
                severity=IncidentSeverity.CRITICAL,
                description="Cryptographic integrity failure detected",
                confidence_level=1.0,
                ttl=86400,  # 24 hours
                created_timestamp=time.time(),
                last_seen=None,
                hit_count=0,
                false_positive_rate=0.00,
                mitigation_actions=[
                    ResponseAction.EMERGENCY_SHUTDOWN,
                    ResponseAction.BACKUP_EVIDENCE,
                    ResponseAction.ESCALATE_TO_HUMAN
                ]
            ),
            ThreatIndicator(
                indicator_id="lateral_movement",
                indicator_type="network",
                pattern="unusual_internal_network_scanning or remote_execution",
                severity=IncidentSeverity.HIGH,
                description="Lateral movement activities detected",
                confidence_level=0.8,
                ttl=3600,  # 1 hour
                created_timestamp=time.time(),
                last_seen=None,
                hit_count=0,
                false_positive_rate=0.15,
                mitigation_actions=[
                    ResponseAction.ISOLATE_SYSTEM,
                    ResponseAction.BACKUP_EVIDENCE,
                    ResponseAction.BLOCK_IP
                ]
            )
        ]

        for indicator in default_indicators:
            if indicator.indicator_id not in self.threat_indicators:
                self.threat_indicators[indicator.indicator_id] = indicator

    def add_threat_indicator(self, indicator: ThreatIndicator):
        """Add a new threat indicator to the detection system."""
        self.threat_indicators[indicator.indicator_id] = indicator

    def remove_threat_indicator(self, indicator_id: str):
        """Remove a threat indicator from the detection system."""
        self.threat_indicators.pop(indicator_id, None)

    def get_threat_indicators(self) -> Dict[str, ThreatIndicator]:
        """Get all threat indicators."""
        return self.threat_indicators.copy()

    def cleanup_expired_indicators(self):
        """Remove expired threat indicators."""
        current_time = time.time()
        expired_indicators = []

        for indicator_id, indicator in self.threat_indicators.items():
            if indicator.created_timestamp + indicator.ttl < current_time:
                expired_indicators.append(indicator_id)

        for indicator_id in expired_indicators:
            self.threat_indicators.pop(indicator_id, None)

        if expired_indicators:
            logger.info(f"Removed {len(expired_indicators)} expired threat indicators")

    def calculate_false_positive_rate(self) -> float:
        """Calculate overall false positive rate across all indicators."""
        if not self.threat_indicators:
            return 0.0

        total_hits = sum(indicator.hit_count for indicator in self.threat_indicators.values())
        if total_hits == 0:
            return 0.0

        weighted_fp_rate = sum(
            indicator.false_positive_rate * indicator.hit_count
            for indicator in self.threat_indicators.values()
        )

        return weighted_fp_rate / total_hits