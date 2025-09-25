from src.constants.base import MAXIMUM_FUNCTION_LENGTH_LINES, MAXIMUM_FUNCTION_PARAMETERS

Chain of Responsibility pattern for security incident handling and analysis.
Each handler specializes in a specific security domain and can escalate or
pass incidents to the next handler in the chain.

Used for:
- Incident response automation (Batch 8)
- Security analysis pipeline
- Threat detection and classification
"""

from abc import ABC, abstractmethod
from enum import Enum
from typing import Any, Dict, List, Optional, Union
import logging
from dataclasses import dataclass
import time
import hashlib
import json

from ..enhanced_incident_response_system import (
    SecurityIncident, IncidentType, IncidentSeverity, IncidentStatus,
    ResponseAction, ThreatLevel, ThreatIndicator
)
from ...patterns.command_base import Command, CommandResult
"""

logger = logging.getLogger(__name__)

class HandlerResult(Enum):
    """Results from security handler processing."""
    HANDLED = "handled"
    ESCALATED = "escalated"
    PASSED = "passed"
    FAILED = "failed"

@dataclass
class SecurityContext:
    """Security processing context passed through handler chain."""
    incident: SecurityIncident
    event_data: Dict[str, Any]
    analysis_results: Dict[str, Any]
    escalation_reasons: List[str]
    processing_metadata: Dict[str, Any]

class SecurityHandler(ABC):
    """
    Abstract base class for security handlers in Chain of Responsibility.

    Each handler can process security incidents, perform analysis,
    and decide whether to handle, escalate, or pass to next handler.
    """

    def __init__(self, handler_name: str):
        self.handler_name = handler_name
        self.next_handler: Optional['SecurityHandler'] = None
        self.metrics = {
            "incidents_handled": 0,
            "incidents_escalated": 0,
            "incidents_passed": 0,
            "processing_time_total": 0.0,
            "start_time": time.time()
        }

    def set_next_handler(self, handler: 'SecurityHandler') -> 'SecurityHandler':
        """Set next handler in the chain."""
        self.next_handler = handler
        return handler

    def handle_incident(self, context: SecurityContext) -> HandlerResult:
        """
        Main handler method that implements Chain of Responsibility pattern.

        Args:
            context: Security context containing incident and analysis data

        Returns:
            HandlerResult indicating processing outcome
        """
        start_time = time.time()

        try:
            # Check if this handler should process the incident
            if not self._should_handle(context):
                return self._pass_to_next(context)

            # Process the incident
            result = self._process_incident(context)

            # Update metrics
            processing_time = time.time() - start_time
            self.metrics["processing_time_total"] += processing_time

            if result == HandlerResult.HANDLED:
                self.metrics["incidents_handled"] += 1
                logger.info(f"{self.handler_name} handled incident {context.incident.incident_id}")

            elif result == HandlerResult.ESCALATED:
                self.metrics["incidents_escalated"] += 1
                logger.warning(f"{self.handler_name} escalated incident {context.incident.incident_id}")

            elif result == HandlerResult.PASSED:
                self.metrics["incidents_passed"] += 1
                return self._pass_to_next(context)

            return result

        except Exception as e:
            logger.error(f"{self.handler_name} failed processing incident {context.incident.incident_id}: {e}")
            context.escalation_reasons.append(f"Handler {self.handler_name} failed: {str(e)}")
            return HandlerResult.FAILED

    def _pass_to_next(self, context: SecurityContext) -> HandlerResult:
        """Pass incident to next handler in chain."""
        if self.next_handler:
            return self.next_handler.handle_incident(context)
        else:
            # End of chain - escalate if no handler processed the incident
            context.escalation_reasons.append("End of handler chain reached")
            return HandlerResult.ESCALATED

    @abstractmethod
    def _should_handle(self, context: SecurityContext) -> bool:
        """Determine if this handler should process the incident."""

    @abstractmethod
    def _process_incident(self, context: SecurityContext) -> HandlerResult:
        """Process the security incident."""

    def get_metrics(self) -> Dict[str, Any]:
        """Get handler performance metrics."""
        current_time = time.time()
        uptime = current_time - self.metrics["start_time"]

        total_processed = (
            self.metrics["incidents_handled"] +
            self.metrics["incidents_escalated"] +
            self.metrics["incidents_passed"]
        )

        avg_processing_time = (
            self.metrics["processing_time_total"] / max(1, total_processed)
        )

        return {
            "handler_name": self.handler_name,
            "uptime_seconds": uptime,
            "incidents_handled": self.metrics["incidents_handled"],
            "incidents_escalated": self.metrics["incidents_escalated"],
            "incidents_passed": self.metrics["incidents_passed"],
            "total_processed": total_processed,
            "average_processing_time": avg_processing_time,
            "success_rate": self.metrics["incidents_handled"] / max(1, total_processed)
        }

class AuthenticationHandler(SecurityHandler):
    """Handler for authentication-related security incidents."""

    def __init__(self):
        super().__init__("AuthenticationHandler")
        self.failed_attempt_threshold = MAXIMUM_FUNCTION_PARAMETERS
        self.lockout_duration = 300  # 5 minutes
        self.blocked_ips = set()
        self.account_lockouts = {}

    def _should_handle(self, context: SecurityContext) -> bool:
        """Handle authentication-related incidents."""
        return (
            context.incident.incident_type == IncidentType.UNAUTHORIZED_ACCESS or
            "authentication" in context.event_data.get("event_type", "") or
            "login" in context.event_data.get("event_type", "") or
            context.incident.attack_vector and "credential" in context.incident.attack_vector
        )

    def _process_incident(self, context: SecurityContext) -> HandlerResult:
        """Process authentication security incident."""
        event_data = context.event_data
        incident = context.incident

        # Analyze failed login attempts
        failed_attempts = event_data.get("failed_attempts", 0)
        source_ip = event_data.get("source_ip")
        username = event_data.get("username")

        if failed_attempts >= self.failed_attempt_threshold:
            # Immediate response required
            response_actions = []

            if source_ip and source_ip not in self.blocked_ips:
                response_actions.append(ResponseAction.BLOCK_IP)
                self.blocked_ips.add(source_ip)
                logger.info(f"Blocked IP {source_ip} due to excessive failed attempts")

            if username and username not in self.account_lockouts:
                response_actions.append(ResponseAction.DISABLE_ACCOUNT)
                self.account_lockouts[username] = time.time() + self.lockout_duration
                logger.info(f"Locked account {username} for {self.lockout_duration} seconds")

            # Update incident with response actions
            incident.response_actions.extend(response_actions)
            incident.status = IncidentStatus.CONTAINED
            incident.containment_timestamp = time.time()

            # Add analysis results
            context.analysis_results["authentication_analysis"] = {
                "failed_attempts": failed_attempts,
                "threshold_exceeded": True,
                "response_actions": [action.value for action in response_actions],
                "blocked_ip": source_ip in self.blocked_ips if source_ip else False,
                "account_locked": username in self.account_lockouts if username else False
            }

            return HandlerResult.HANDLED

        elif failed_attempts > 5:  # Warning level
            context.analysis_results["authentication_analysis"] = {
                "failed_attempts": failed_attempts,
                "threshold_exceeded": False,
                "warning_level": True,
                "recommendation": "Monitor for continued attempts"
            }
            return HandlerResult.HANDLED

        # Low severity - pass to next handler
        return HandlerResult.PASSED

class DataProtectionHandler(SecurityHandler):
    """Handler for data breach and exfiltration incidents."""

    def __init__(self):
        super().__init__("DataProtectionHandler")
        self.large_transfer_threshold_mb = 100
        self.sensitive_data_patterns = [
            "ssn", "social_security", "credit_card", "passport", "driver_license"
        ]
        self.blocked_transfers = set()

    def _should_handle(self, context: SecurityContext) -> bool:
        """Handle data protection incidents."""
        return (
            context.incident.incident_type == IncidentType.DATA_BREACH or
            "data_transfer" in context.event_data.get("event_type", "") or
            "exfiltration" in context.event_data.get("event_type", "") or
            context.event_data.get("transfer_size_mb", 0) > self.large_transfer_threshold_mb
        )

    def _process_incident(self, context: SecurityContext) -> HandlerResult:
        """Process data protection incident."""
        event_data = context.event_data
        incident = context.incident

        transfer_size = event_data.get("transfer_size_mb", 0)
        external_destination = event_data.get("external_destination", False)
        off_hours = event_data.get("off_hours", False)
        sensitive_data = event_data.get("sensitive_data_detected", False)

        # Calculate risk score
        risk_score = 0
        if transfer_size > self.large_transfer_threshold_mb:
            risk_score += 30
        if external_destination:
            risk_score += 40
        if off_hours:
            risk_score += 20
        if sensitive_data:
            risk_score += 50

        context.analysis_results["data_protection_analysis"] = {
            "transfer_size_mb": transfer_size,
            "external_destination": external_destination,
            "off_hours_transfer": off_hours,
            "sensitive_data_detected": sensitive_data,
            "risk_score": risk_score
        }

        if risk_score >= 70:  # High risk
            # Immediate containment required
            response_actions = [
                ResponseAction.ISOLATE_SYSTEM,
                ResponseAction.BACKUP_EVIDENCE,
                ResponseAction.ESCALATE_TO_HUMAN
            ]

            # Block the transfer
            transfer_id = event_data.get("transfer_id")
            if transfer_id:
                self.blocked_transfers.add(transfer_id)

            incident.response_actions.extend(response_actions)
            incident.status = IncidentStatus.CONTAINED
            incident.containment_timestamp = time.time()
            incident.severity = IncidentSeverity.CRITICAL

            logger.critical(f"High-risk data transfer blocked: {incident.incident_id}")
            return HandlerResult.HANDLED

        elif risk_score >= 40:  # Medium risk
            # Enhanced monitoring
            incident.response_actions.append(ResponseAction.ALERT_ONLY)
            context.analysis_results["data_protection_analysis"]["action"] = "enhanced_monitoring"
            return HandlerResult.HANDLED

        # Low risk - pass to next handler
        return HandlerResult.PASSED

class MalwareHandler(SecurityHandler):
    """Handler for malware detection and response."""

    def __init__(self):
        super().__init__("MalwareHandler")
        self.quarantine_paths = []
        self.malware_signatures = {}
        self.suspicious_processes = set()

    def _should_handle(self, context: SecurityContext) -> bool:
        """Handle malware-related incidents."""
        return (
            context.incident.incident_type == IncidentType.MALWARE_DETECTION or
            "malware" in context.event_data.get("event_type", "") or
            "virus" in context.event_data.get("event_type", "") or
            "suspicious_process" in context.event_data.get("indicators", {})
        )

    def _process_incident(self, context: SecurityContext) -> HandlerResult:
        """Process malware incident."""
        event_data = context.event_data
        incident = context.incident

        malware_type = event_data.get("malware_type", "unknown")
        file_path = event_data.get("file_path")
        process_name = event_data.get("process_name")
        hash_value = event_data.get("file_hash")

        # Determine severity based on malware type
        severity_mapping = {
            "ransomware": IncidentSeverity.CRITICAL,
            "trojan": IncidentSeverity.HIGH,
            "virus": IncidentSeverity.HIGH,
            "adware": IncidentSeverity.MEDIUM,
            "pup": IncidentSeverity.LOW  # Potentially Unwanted Program
        }

        calculated_severity = severity_mapping.get(malware_type.lower(), IncidentSeverity.MEDIUM)

        # Update incident severity if higher than current
        if self._severity_score(calculated_severity) > self._severity_score(incident.severity):
            incident.severity = calculated_severity

        response_actions = []

        # Quarantine file if path provided
        if file_path:
            response_actions.append(ResponseAction.QUARANTINE_FILES)
            self.quarantine_paths.append(file_path)

        # Stop suspicious process
        if process_name:
            self.suspicious_processes.add(process_name)

        # Isolate system for critical malware
        if calculated_severity == IncidentSeverity.CRITICAL:
            response_actions.extend([
                ResponseAction.ISOLATE_SYSTEM,
                ResponseAction.EMERGENCY_SHUTDOWN
            ])

        # Standard malware response
        response_actions.extend([
            ResponseAction.BACKUP_EVIDENCE,
            ResponseAction.ESCALATE_TO_HUMAN if calculated_severity in [IncidentSeverity.CRITICAL, IncidentSeverity.HIGH] else ResponseAction.ALERT_ONLY
        ])

        incident.response_actions.extend(response_actions)
        incident.status = IncidentStatus.CONTAINED
        incident.containment_timestamp = time.time()

        context.analysis_results["malware_analysis"] = {
            "malware_type": malware_type,
            "calculated_severity": calculated_severity.value,
            "file_path": file_path,
            "file_hash": hash_value,
            "process_name": process_name,
            "quarantined": file_path is not None,
            "response_actions": [action.value for action in response_actions]
        }

        logger.warning(f"Malware incident handled: {malware_type} - {incident.incident_id}")
        return HandlerResult.HANDLED

    def _severity_score(self, severity: IncidentSeverity) -> int:
        """Convert severity to numeric score for comparison."""
        scores = {
            IncidentSeverity.LOW: 1,
            IncidentSeverity.MEDIUM: 2,
            IncidentSeverity.HIGH: 3,
            IncidentSeverity.CRITICAL: 4,
            IncidentSeverity.EMERGENCY: 5
        }
        return scores.get(severity, 1)

class NetworkSecurityHandler(SecurityHandler):
    """Handler for network security incidents."""

    def __init__(self):
        super().__init__("NetworkSecurityHandler")
        self.blocked_ips = set()
        self.port_scan_thresholds = {
            "low": 10,
            "medium": 50,
            "high": MAXIMUM_FUNCTION_LENGTH_LINES
        }
        self.ddos_threshold_requests = 1000

    def _should_handle(self, context: SecurityContext) -> bool:
        """Handle network security incidents."""
        return (
            context.incident.incident_type == IncidentType.INTRUSION_ATTEMPT or
            context.incident.incident_type == IncidentType.DENIAL_OF_SERVICE or
            "network" in context.event_data.get("event_type", "") or
            "scan" in context.event_data.get("event_type", "") or
            "ddos" in context.event_data.get("event_type", "")
        )

    def _process_incident(self, context: SecurityContext) -> HandlerResult:
        """Process network security incident."""
        event_data = context.event_data
        incident = context.incident

        source_ip = event_data.get("source_ip")
        scan_type = event_data.get("scan_type", "unknown")
        ports_scanned = event_data.get("ports_scanned", [])
        request_rate = event_data.get("requests_per_second", 0)

        # Analyze threat type and severity
        threat_indicators = []

        # Port scan analysis
        if len(ports_scanned) > self.port_scan_thresholds["high"]:
            threat_indicators.append(("extensive_port_scan", IncidentSeverity.HIGH))
        elif len(ports_scanned) > self.port_scan_thresholds["medium"]:
            threat_indicators.append(("moderate_port_scan", IncidentSeverity.MEDIUM))
        elif len(ports_scanned) > self.port_scan_thresholds["low"]:
            threat_indicators.append(("limited_port_scan", IncidentSeverity.LOW))

        # DDoS analysis
        if request_rate > self.ddos_threshold_requests:
            threat_indicators.append(("ddos_attack", IncidentSeverity.CRITICAL))

        # Determine response based on threats
        response_actions = []
        max_severity = IncidentSeverity.LOW

        for threat_type, severity in threat_indicators:
            if self._severity_score(severity) > self._severity_score(max_severity):
                max_severity = severity

        # Block IP for significant threats
        if max_severity in [IncidentSeverity.HIGH, IncidentSeverity.CRITICAL] and source_ip:
            if source_ip not in self.blocked_ips:
                response_actions.append(ResponseAction.BLOCK_IP)
                self.blocked_ips.add(source_ip)

        # Response actions based on severity
        if max_severity == IncidentSeverity.CRITICAL:
            response_actions.extend([
                ResponseAction.ISOLATE_SYSTEM,
                ResponseAction.BACKUP_EVIDENCE,
                ResponseAction.ESCALATE_TO_HUMAN
            ])
        elif max_severity == IncidentSeverity.HIGH:
            response_actions.extend([
                ResponseAction.BACKUP_EVIDENCE,
                ResponseAction.ESCALATE_TO_HUMAN
            ])
        else:
            response_actions.append(ResponseAction.ALERT_ONLY)

        # Update incident
        if self._severity_score(max_severity) > self._severity_score(incident.severity):
            incident.severity = max_severity

        incident.response_actions.extend(response_actions)
        incident.status = IncidentStatus.CONTAINED if max_severity >= IncidentSeverity.HIGH else IncidentStatus.ANALYZING

        if incident.status == IncidentStatus.CONTAINED:
            incident.containment_timestamp = time.time()

        context.analysis_results["network_security_analysis"] = {
            "source_ip": source_ip,
            "scan_type": scan_type,
            "ports_scanned": len(ports_scanned),
            "request_rate": request_rate,
            "threat_indicators": [(t[0], t[1].value) for t in threat_indicators],
            "calculated_severity": max_severity.value,
            "ip_blocked": source_ip in self.blocked_ips if source_ip else False,
            "response_actions": [action.value for action in response_actions]
        }

        logger.info(f"Network security incident handled: {scan_type} from {source_ip} - {incident.incident_id}")
        return HandlerResult.HANDLED

    def _severity_score(self, severity: IncidentSeverity) -> int:
        """Convert severity to numeric score for comparison."""
        scores = {
            IncidentSeverity.LOW: 1,
            IncidentSeverity.MEDIUM: 2,
            IncidentSeverity.HIGH: 3,
            IncidentSeverity.CRITICAL: 4,
            IncidentSeverity.EMERGENCY: 5
        }
        return scores.get(severity, 1)

class CryptographicHandler(SecurityHandler):
    """Handler for cryptographic security incidents."""

    def __init__(self):
        super().__init__("CryptographicHandler")
        self.key_rotation_schedule = {}
        self.compromised_keys = set()
        self.crypto_failures = []

    def _should_handle(self, context: SecurityContext) -> bool:
        """Handle cryptographic security incidents."""
        return (
            context.incident.incident_type == IncidentType.CRYPTOGRAPHIC_FAILURE or
            "crypto" in context.event_data.get("event_type", "") or
            "encryption" in context.event_data.get("event_type", "") or
            "certificate" in context.event_data.get("event_type", "")
        )

    def _process_incident(self, context: SecurityContext) -> HandlerResult:
        """Process cryptographic security incident."""
        event_data = context.event_data
        incident = context.incident

        failure_type = event_data.get("failure_type", "unknown")
        affected_keys = event_data.get("affected_keys", [])
        integrity_check_failed = event_data.get("integrity_check_failed", False)
        certificate_expired = event_data.get("certificate_expired", False)

        # Cryptographic failures are always serious
        incident.severity = IncidentSeverity.CRITICAL
        incident.threat_level = ThreatLevel.CRITICAL

        response_actions = []

        # Immediate emergency shutdown for integrity failures
        if integrity_check_failed:
            response_actions.extend([
                ResponseAction.EMERGENCY_SHUTDOWN,
                ResponseAction.ISOLATE_SYSTEM
            ])

            # Record compromised keys
            for key in affected_keys:
                self.compromised_keys.add(key)

        # Certificate issues require immediate attention
        if certificate_expired:
            response_actions.append(ResponseAction.RESET_CREDENTIALS)

        # Standard crypto incident response
        response_actions.extend([
            ResponseAction.BACKUP_EVIDENCE,
            ResponseAction.ESCALATE_TO_HUMAN
        ])

        # Force key rotation for affected keys
        for key in affected_keys:
            self.key_rotation_schedule[key] = time.time() + 3600  # Rotate within 1 hour

        incident.response_actions.extend(response_actions)
        incident.status = IncidentStatus.CONTAINED
        incident.containment_timestamp = time.time()

        # Record failure for analysis
        failure_record = {
            "timestamp": time.time(),
            "failure_type": failure_type,
            "affected_keys": affected_keys,
            "integrity_failed": integrity_check_failed,
            "certificate_expired": certificate_expired
        }
        self.crypto_failures.append(failure_record)

        context.analysis_results["cryptographic_analysis"] = {
            "failure_type": failure_type,
            "affected_keys_count": len(affected_keys),
            "integrity_check_failed": integrity_check_failed,
            "certificate_expired": certificate_expired,
            "emergency_shutdown_required": integrity_check_failed,
            "keys_marked_for_rotation": len(affected_keys),
            "response_actions": [action.value for action in response_actions]
        }

        logger.critical(f"Cryptographic incident handled: {failure_type} - {incident.incident_id}")
        return HandlerResult.HANDLED

class SecurityHandlerChain:
    """
    Coordinator for the security handler chain.

    Manages the chain of handlers and provides metrics and configuration.
    """

    def __init__(self):
        self.handlers: List[SecurityHandler] = []
        self.chain_head: Optional[SecurityHandler] = None
        self.total_incidents_processed = 0
        self.start_time = time.time()

    def build_default_chain(self) -> 'SecurityHandlerChain':
        """Build the default security handler chain."""
        # Create handlers in order of specialization
        auth_handler = AuthenticationHandler()
        crypto_handler = CryptographicHandler()  # Highest priority
        malware_handler = MalwareHandler()
        data_handler = DataProtectionHandler()
        network_handler = NetworkSecurityHandler()

        # Chain handlers: crypto -> auth -> malware -> data -> network
        crypto_handler.set_next_handler(auth_handler)
        auth_handler.set_next_handler(malware_handler)
        malware_handler.set_next_handler(data_handler)
        data_handler.set_next_handler(network_handler)

        self.handlers = [crypto_handler, auth_handler, malware_handler, data_handler, network_handler]
        self.chain_head = crypto_handler

        return self

    def add_handler(self, handler: SecurityHandler, position: Optional[int] = None) -> 'SecurityHandlerChain':
        """Add a handler to the chain at specified position."""
        if position is None:
            # Add to end of chain
            if self.handlers:
                self.handlers[-1].set_next_handler(handler)
            else:
                self.chain_head = handler
            self.handlers.append(handler)
        else:
            # Insert at position and rebuild chain links
            self.handlers.insert(position, handler)
            self._rebuild_chain()

        return self

    def process_incident(self, incident: SecurityIncident, event_data: Dict[str, Any]) -> SecurityContext:
        """Process incident through the handler chain."""
        if not self.chain_head:
            raise ValueError("No handlers configured in chain")

        context = SecurityContext(
            incident=incident,
            event_data=event_data,
            analysis_results={},
            escalation_reasons=[],
            processing_metadata={
                "start_time": time.time(),
                "chain_id": id(self)
            }
        )

        result = self.chain_head.handle_incident(context)

        context.processing_metadata.update({
            "end_time": time.time(),
            "processing_time": time.time() - context.processing_metadata["start_time"],
            "final_result": result.value
        })

        self.total_incidents_processed += 1

        logger.info(f"Handler chain processed incident {incident.incident_id}: {result.value}")
        return context

    def _rebuild_chain(self):
        """Rebuild handler chain links after modification."""
        if not self.handlers:
            self.chain_head = None
            return

        self.chain_head = self.handlers[0]

        for i in range(len(self.handlers) - 1):
            self.handlers[i].set_next_handler(self.handlers[i + 1])

        # Last handler has no next handler
        if self.handlers:
            self.handlers[-1].next_handler = None

    def get_chain_metrics(self) -> Dict[str, Any]:
        """Get comprehensive metrics for the handler chain."""
        current_time = time.time()
        uptime = current_time - self.start_time

        handler_metrics = [handler.get_metrics() for handler in self.handlers]

        total_handled = sum(m["incidents_handled"] for m in handler_metrics)
        total_escalated = sum(m["incidents_escalated"] for m in handler_metrics)
        total_passed = sum(m["incidents_passed"] for m in handler_metrics)

        return {
            "chain_summary": {
                "uptime_seconds": uptime,
                "total_incidents_processed": self.total_incidents_processed,
                "handlers_in_chain": len(self.handlers),
                "total_handled": total_handled,
                "total_escalated": total_escalated,
                "total_passed": total_passed,
                "success_rate": total_handled / max(1, self.total_incidents_processed)
            },
            "handler_metrics": handler_metrics,
            "chain_configuration": [
                {
                    "position": i,
                    "handler_name": handler.handler_name,
                    "next_handler": handler.next_handler.handler_name if handler.next_handler else None
                }
                for i, handler in enumerate(self.handlers)
            ]
        }

# Command integration for security handler operations
class SecurityHandlerCommand(Command):
    """Command for executing security handler operations."""

    def __init__(self, handler_chain: SecurityHandlerChain, incident: SecurityIncident, event_data: Dict[str, Any]):
        self.handler_chain = handler_chain
        self.incident = incident
        self.event_data = event_data
        self.result_context: Optional[SecurityContext] = None

    def execute(self) -> CommandResult:
        """Execute security handler chain processing."""
        try:
            self.result_context = self.handler_chain.process_incident(self.incident, self.event_data)

            return CommandResult(
                success=True,
                data={
                    "incident_id": self.incident.incident_id,
                    "final_status": self.incident.status.value,
                    "response_actions": [action.value for action in self.incident.response_actions],
                    "analysis_results": self.result_context.analysis_results,
                    "processing_time": self.result_context.processing_metadata.get("processing_time"),
                    "escalation_reasons": self.result_context.escalation_reasons
                },
                metadata={
                    "handler_chain_metrics": self.handler_chain.get_chain_metrics(),
                    "incident_severity": self.incident.severity.value,
                    "threat_level": self.incident.threat_level.value
                }
            )

        except Exception as e:
            return CommandResult(
                success=False,
                error=f"Security handler chain failed: {str(e)}",
                data={"incident_id": self.incident.incident_id}
            )

    def undo(self) -> CommandResult:
        """Undo security handler operations (limited rollback)."""
        if not self.result_context:
            return CommandResult(success=False, error="No execution context to undo")

        try:
            # Reset incident status (limited undo capability)
            self.incident.status = IncidentStatus.DETECTED
            self.incident.response_actions = []
            self.incident.containment_timestamp = None

            return CommandResult(
                success=True,
                data={
                    "incident_id": self.incident.incident_id,
                    "status": "reverted_to_detected"
                }
            )

        except Exception as e:
            return CommandResult(
                success=False,
                error=f"Security handler undo failed: {str(e)}"
            )

    def validate(self) -> CommandResult:
        """Validate security handler command parameters."""
        errors = []

        if not self.handler_chain or not self.handler_chain.chain_head:
            errors.append("Handler chain not configured")

        if not self.incident:
            errors.append("Security incident required")

        if not self.event_data:
            errors.append("Event data required")

        if errors:
            return CommandResult(success=False, error="; ".join(errors))

        return CommandResult(success=True, data={"validation": "passed"})