"""
Automated response service.
Extracted from enhanced_incident_response_system.py for focused responsibility.
"""

import time
from typing import Dict, List, Optional
from lib.shared.utilities import get_logger

from ..models import SecurityIncident, ResponsePlaybook, ResponseAction, IncidentType, IncidentSeverity

logger = get_logger(__name__)


class AutomatedResponseService:
    """
    Focused service for executing automated incident response actions.
    Handles playbook execution, automated containment, and response orchestration.
    """

    def __init__(self):
        """Initialize the automated response service."""
        self.response_playbooks: Dict[str, ResponsePlaybook] = {}
        self._initialize_default_playbooks()
        self.metrics = {
            "automated_responses_executed": 0,
            "containment_success_rate": 0.0,
            "response_actions_by_type": {}
        }

    def process_incident_response(self, incident: SecurityIncident) -> bool:
        """Process automated response for a specific incident."""
        logger.info(f"Processing incident response for: {incident.incident_id}")

        try:
            # Update incident status
            incident.status = incident.status.ANALYZING if hasattr(incident.status, 'ANALYZING') else incident.status

            # Find appropriate response playbook
            playbook = self._find_response_playbook(incident)

            if playbook:
                # Execute automated response actions
                success = self._execute_automated_response(incident, playbook)

                if success:
                    # Update incident status to contained
                    incident.containment_timestamp = time.time()

                    # Update timeline
                    incident.timeline.append({
                        "timestamp": incident.containment_timestamp,
                        "event": "incident_contained",
                        "description": "Automated containment actions completed",
                        "actor": "system"
                    })

                    # Calculate and update metrics
                    response_time = incident.containment_timestamp - incident.detected_timestamp
                    self._update_response_metrics(incident, response_time)

                    logger.info(f"Incident response completed for: {incident.incident_id} (response time: {response_time:.1f}s)")
                    return True

            return False

        except Exception as e:
            logger.error(f"Incident response failed for {incident.incident_id}: {e}")
            return False

    def _find_response_playbook(self, incident: SecurityIncident) -> Optional[ResponsePlaybook]:
        """Find the most appropriate response playbook for the incident."""
        matching_playbooks = []

        for playbook in self.response_playbooks.values():
            if (playbook.incident_type == incident.incident_type and
                self._severity_meets_threshold(incident.severity, playbook.severity_threshold)):
                matching_playbooks.append(playbook)

        if not matching_playbooks:
            return None

        # Return the playbook with the highest severity threshold (most specific)
        return max(matching_playbooks,
                  key=lambda p: self._get_severity_score(p.severity_threshold))

    def _severity_meets_threshold(self, incident_severity: IncidentSeverity,
                                  threshold: IncidentSeverity) -> bool:
        """Check if incident severity meets playbook threshold."""
        return self._get_severity_score(incident_severity) >= self._get_severity_score(threshold)

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

    def _execute_automated_response(self, incident: SecurityIncident, playbook: ResponsePlaybook) -> bool:
        """Execute automated response actions based on playbook."""
        executed_actions = []
        successful_actions = 0

        for action in playbook.automated_actions:
            try:
                success = self._execute_response_action(incident, action)
                if success:
                    incident.response_actions.append(action)
                    executed_actions.append(action.value)
                    successful_actions += 1

                # Update action metrics
                if action.value not in self.metrics["response_actions_by_type"]:
                    self.metrics["response_actions_by_type"][action.value] = {"attempted": 0, "successful": 0}

                self.metrics["response_actions_by_type"][action.value]["attempted"] += 1
                if success:
                    self.metrics["response_actions_by_type"][action.value]["successful"] += 1

            except Exception as e:
                logger.error(f"Failed to execute response action {action.value}: {e}")

        self.metrics["automated_responses_executed"] += len(executed_actions)

        # Update incident timeline
        if executed_actions:
            incident.timeline.append({
                "timestamp": time.time(),
                "event": "automated_response_executed",
                "description": f"Executed automated actions: {', '.join(executed_actions)}",
                "actor": "system",
                "details": {"actions": executed_actions}
            })

        # Return True if at least half of the actions succeeded
        return successful_actions >= (len(playbook.automated_actions) / 2)

    def _execute_response_action(self, incident: SecurityIncident, action: ResponseAction) -> bool:
        """Execute a specific response action."""
        logger.info(f"Executing response action: {action.value} for incident {incident.incident_id}")

        if action == ResponseAction.ISOLATE_SYSTEM:
            return self._isolate_affected_systems(incident)
        elif action == ResponseAction.BLOCK_IP:
            return self._block_suspicious_ips(incident)
        elif action == ResponseAction.DISABLE_ACCOUNT:
            return self._disable_suspicious_accounts(incident)
        elif action == ResponseAction.BACKUP_EVIDENCE:
            return self._backup_incident_evidence(incident)
        elif action == ResponseAction.QUARANTINE_FILES:
            return self._quarantine_suspicious_files(incident)
        elif action == ResponseAction.RESET_CREDENTIALS:
            return self._reset_compromised_credentials(incident)
        elif action == ResponseAction.EMERGENCY_SHUTDOWN:
            return self._emergency_shutdown_systems(incident)
        elif action == ResponseAction.ESCALATE_TO_HUMAN:
            return self._escalate_to_human_responder(incident)
        else:
            # ALERT_ONLY or unknown action
            return True

    def _isolate_affected_systems(self, incident: SecurityIncident) -> bool:
        """Isolate affected systems from the network."""
        try:
            isolated_systems = []

            for resource in incident.affected_resources:
                if "hostname:" in resource or "ip:" in resource:
                    system_id = resource.split(":", 1)[1]

                    # Mock system isolation - in production this would integrate with network infrastructure
                    logger.info(f"Isolating system: {system_id}")

                    # Simulate isolation success
                    isolated_systems.append(system_id)

            # Update incident metadata
            if "isolation" not in incident.metadata:
                incident.metadata["isolation"] = {}

            incident.metadata["isolation"]["isolated_systems"] = isolated_systems
            incident.metadata["isolation"]["isolation_timestamp"] = time.time()

            logger.info(f"Successfully isolated {len(isolated_systems)} systems")
            return len(isolated_systems) > 0

        except Exception as e:
            logger.error(f"Failed to isolate systems for incident {incident.incident_id}: {e}")
            return False

    def _block_suspicious_ips(self, incident: SecurityIncident) -> bool:
        """Block suspicious IP addresses."""
        try:
            blocked_ips = []

            # Extract IPs from incident data
            event_data = incident.indicators.get("event_data", {})
            if "source_ip" in event_data:
                ip = event_data["source_ip"]
                logger.info(f"Blocking suspicious IP: {ip}")
                blocked_ips.append(ip)

            # Extract IPs from affected resources
            for resource in incident.affected_resources:
                if "source_ip:" in resource:
                    ip = resource.split(":", 1)[1]
                    logger.info(f"Blocking suspicious IP: {ip}")
                    blocked_ips.append(ip)

            # Update incident metadata
            if "blocking" not in incident.metadata:
                incident.metadata["blocking"] = {}

            incident.metadata["blocking"]["blocked_ips"] = blocked_ips
            incident.metadata["blocking"]["blocking_timestamp"] = time.time()

            logger.info(f"Successfully blocked {len(blocked_ips)} IP addresses")
            return len(blocked_ips) > 0

        except Exception as e:
            logger.error(f"Failed to block IPs for incident {incident.incident_id}: {e}")
            return False

    def _disable_suspicious_accounts(self, incident: SecurityIncident) -> bool:
        """Disable suspicious user accounts."""
        try:
            disabled_accounts = []

            # Extract usernames from incident data
            event_data = incident.indicators.get("event_data", {})
            if "username" in event_data:
                username = event_data["username"]
                logger.info(f"Disabling suspicious account: {username}")
                disabled_accounts.append(username)

            # Extract usernames from affected resources
            for resource in incident.affected_resources:
                if "username:" in resource:
                    username = resource.split(":", 1)[1]
                    logger.info(f"Disabling suspicious account: {username}")
                    disabled_accounts.append(username)

            # Update incident metadata
            if "account_actions" not in incident.metadata:
                incident.metadata["account_actions"] = {}

            incident.metadata["account_actions"]["disabled_accounts"] = disabled_accounts
            incident.metadata["account_actions"]["disable_timestamp"] = time.time()

            logger.info(f"Successfully disabled {len(disabled_accounts)} user accounts")
            return len(disabled_accounts) > 0

        except Exception as e:
            logger.error(f"Failed to disable accounts for incident {incident.incident_id}: {e}")
            return False

    def _backup_incident_evidence(self, incident: SecurityIncident) -> bool:
        """Backup critical evidence for the incident."""
        try:
            # Mock evidence backup - in production this would integrate with forensic tools
            backup_items = [
                "system_logs",
                "network_traffic",
                "file_system_snapshots",
                "memory_dumps"
            ]

            logger.info(f"Backing up evidence for incident {incident.incident_id}")

            # Update incident metadata
            if "evidence_backup" not in incident.metadata:
                incident.metadata["evidence_backup"] = {}

            incident.metadata["evidence_backup"]["backup_items"] = backup_items
            incident.metadata["evidence_backup"]["backup_timestamp"] = time.time()
            incident.metadata["evidence_backup"]["backup_location"] = f"/evidence/backup/{incident.incident_id}"

            logger.info(f"Successfully backed up {len(backup_items)} evidence types")
            return True

        except Exception as e:
            logger.error(f"Failed to backup evidence for incident {incident.incident_id}: {e}")
            return False

    def _quarantine_suspicious_files(self, incident: SecurityIncident) -> bool:
        """Quarantine suspicious files identified in the incident."""
        try:
            quarantined_files = []

            # Extract file paths from incident data
            event_data = incident.indicators.get("event_data", {})
            if "file_path" in event_data:
                file_path = event_data["file_path"]
                logger.info(f"Quarantining suspicious file: {file_path}")
                quarantined_files.append(file_path)

            # Extract file paths from affected resources
            for resource in incident.affected_resources:
                if "file_path:" in resource:
                    file_path = resource.split(":", 1)[1]
                    logger.info(f"Quarantining suspicious file: {file_path}")
                    quarantined_files.append(file_path)

            # Update incident metadata
            if "file_actions" not in incident.metadata:
                incident.metadata["file_actions"] = {}

            incident.metadata["file_actions"]["quarantined_files"] = quarantined_files
            incident.metadata["file_actions"]["quarantine_timestamp"] = time.time()

            logger.info(f"Successfully quarantined {len(quarantined_files)} files")
            return len(quarantined_files) > 0

        except Exception as e:
            logger.error(f"Failed to quarantine files for incident {incident.incident_id}: {e}")
            return False

    def _reset_compromised_credentials(self, incident: SecurityIncident) -> bool:
        """Reset potentially compromised credentials."""
        try:
            reset_accounts = []

            # Extract usernames from incident data
            event_data = incident.indicators.get("event_data", {})
            if "username" in event_data:
                username = event_data["username"]
                logger.info(f"Resetting credentials for: {username}")
                reset_accounts.append(username)

            # Mock credential reset - in production this would integrate with identity management
            for username in reset_accounts:
                # Generate temporary password, force password change on next login
                logger.info(f"Generated temporary credentials for {username}")

            # Update incident metadata
            if "credential_actions" not in incident.metadata:
                incident.metadata["credential_actions"] = {}

            incident.metadata["credential_actions"]["reset_accounts"] = reset_accounts
            incident.metadata["credential_actions"]["reset_timestamp"] = time.time()

            logger.info(f"Successfully reset credentials for {len(reset_accounts)} accounts")
            return len(reset_accounts) > 0

        except Exception as e:
            logger.error(f"Failed to reset credentials for incident {incident.incident_id}: {e}")
            return False

    def _emergency_shutdown_systems(self, incident: SecurityIncident) -> bool:
        """Perform emergency shutdown of critical systems."""
        try:
            shutdown_systems = []

            # Identify critical systems from affected resources
            for resource in incident.affected_resources:
                if any(critical in resource.lower() for critical in ["database", "domain", "critical"]):
                    system_id = resource.split(":", 1)[-1] if ":" in resource else resource
                    logger.warning(f"Emergency shutdown initiated for: {system_id}")
                    shutdown_systems.append(system_id)

            # Mock emergency shutdown - in production this would integrate with infrastructure management
            if shutdown_systems:
                logger.warning(f"EMERGENCY SHUTDOWN: {len(shutdown_systems)} critical systems")

            # Update incident metadata
            if "emergency_actions" not in incident.metadata:
                incident.metadata["emergency_actions"] = {}

            incident.metadata["emergency_actions"]["shutdown_systems"] = shutdown_systems
            incident.metadata["emergency_actions"]["shutdown_timestamp"] = time.time()

            return len(shutdown_systems) > 0

        except Exception as e:
            logger.error(f"Failed to perform emergency shutdown for incident {incident.incident_id}: {e}")
            return False

    def _escalate_to_human_responder(self, incident: SecurityIncident) -> bool:
        """Escalate incident to human responder."""
        try:
            # Mock human escalation - in production this would integrate with ticketing/paging systems
            logger.info(f"Escalating incident {incident.incident_id} to human responder")

            # Assign to security team
            incident.assigned_responder = "security_team"

            # Update incident metadata
            if "escalation" not in incident.metadata:
                incident.metadata["escalation"] = {}

            incident.metadata["escalation"]["escalated_to"] = "security_team"
            incident.metadata["escalation"]["escalation_timestamp"] = time.time()
            incident.metadata["escalation"]["escalation_reason"] = "automated_response_action"

            # Add to incident timeline
            incident.timeline.append({
                "timestamp": time.time(),
                "event": "escalated_to_human",
                "description": "Incident escalated to security team for manual intervention",
                "actor": "system",
                "details": {"assigned_to": "security_team"}
            })

            logger.info(f"Successfully escalated incident {incident.incident_id} to security team")
            return True

        except Exception as e:
            logger.error(f"Failed to escalate incident {incident.incident_id}: {e}")
            return False

    def _update_response_metrics(self, incident: SecurityIncident, response_time: float):
        """Update response performance metrics."""
        # Update containment success rate
        if hasattr(incident, 'containment_timestamp') and incident.containment_timestamp:
            # Simple success rate calculation - in production this would be more sophisticated
            self.metrics["containment_success_rate"] = min(1.0, self.metrics["containment_success_rate"] + 0.1)

    def _initialize_default_playbooks(self):
        """Initialize comprehensive response playbooks."""
        default_playbooks = [
            ResponsePlaybook(
                playbook_id="data_breach_response",
                incident_type=IncidentType.DATA_BREACH,
                severity_threshold=IncidentSeverity.HIGH,
                automated_actions=[
                    ResponseAction.ISOLATE_SYSTEM,
                    ResponseAction.BACKUP_EVIDENCE,
                    ResponseAction.ESCALATE_TO_HUMAN
                ],
                escalation_criteria={
                    "sensitive_data_exposure": True,
                    "external_data_transfer": True,
                    "customer_data_involved": True
                },
                containment_procedures=[
                    "Immediately isolate affected systems",
                    "Prevent further data exfiltration",
                    "Preserve all relevant logs and evidence",
                    "Notify legal and compliance teams"
                ],
                eradication_procedures=[
                    "Remove unauthorized access methods",
                    "Patch security vulnerabilities",
                    "Update access controls and permissions",
                    "Remove malicious software or artifacts"
                ],
                recovery_procedures=[
                    "Restore systems from verified clean backups",
                    "Implement additional monitoring",
                    "Conduct thorough security assessment",
                    "Update security policies and procedures"
                ],
                notification_requirements={
                    "immediate": ["ciso", "legal", "privacy_officer"],
                    "within_24h": ["executive_team", "board"],
                    "within_72h": ["customers", "regulators", "law_enforcement"]
                },
                estimated_time_to_contain=3600,  # 1 hour
                estimated_time_to_resolve=172800,  # 48 hours
                required_evidence=[
                    "system_logs", "network_traffic", "user_activity", "file_access_logs"
                ],
                compliance_requirements=[
                    "DFARS 252.204-7012", "GDPR", "HIPAA", "SOX"
                ]
            ),
            ResponsePlaybook(
                playbook_id="malware_detection_response",
                incident_type=IncidentType.MALWARE_DETECTION,
                severity_threshold=IncidentSeverity.MEDIUM,
                automated_actions=[
                    ResponseAction.QUARANTINE_FILES,
                    ResponseAction.ISOLATE_SYSTEM,
                    ResponseAction.BACKUP_EVIDENCE
                ],
                escalation_criteria={
                    "ransomware_detected": True,
                    "lateral_movement": True,
                    "data_encryption": True
                },
                containment_procedures=[
                    "Quarantine infected files and systems",
                    "Block network communication to C&C servers",
                    "Disable affected user accounts",
                    "Preserve malware samples for analysis"
                ],
                eradication_procedures=[
                    "Remove malware from infected systems",
                    "Clean or rebuild compromised systems",
                    "Update antivirus signatures",
                    "Patch vulnerabilities exploited by malware"
                ],
                recovery_procedures=[
                    "Restore systems from clean backups",
                    "Verify system integrity",
                    "Implement enhanced monitoring",
                    "Update security controls"
                ],
                notification_requirements={
                    "immediate": ["security_team"],
                    "within_4h": ["it_operations", "management"]
                },
                estimated_time_to_contain=1800,  # 30 minutes
                estimated_time_to_resolve=43200,  # 12 hours
                required_evidence=[
                    "malware_samples", "system_memory_dumps", "network_pcaps", "registry_snapshots"
                ],
                compliance_requirements=["DFARS 252.204-7012"]
            ),
            ResponsePlaybook(
                playbook_id="insider_threat_response",
                incident_type=IncidentType.INSIDER_THREAT,
                severity_threshold=IncidentSeverity.HIGH,
                automated_actions=[
                    ResponseAction.DISABLE_ACCOUNT,
                    ResponseAction.BACKUP_EVIDENCE,
                    ResponseAction.ESCALATE_TO_HUMAN
                ],
                escalation_criteria={
                    "privileged_user": True,
                    "classified_data_access": True,
                    "after_hours_activity": True
                },
                containment_procedures=[
                    "Immediately disable user accounts",
                    "Revoke all access credentials",
                    "Preserve user activity logs",
                    "Notify human resources and legal"
                ],
                eradication_procedures=[
                    "Remove unauthorized access methods",
                    "Change shared passwords",
                    "Review and update access controls",
                    "Conduct security clearance review"
                ],
                recovery_procedures=[
                    "Implement enhanced user monitoring",
                    "Update insider threat policies",
                    "Conduct security awareness training",
                    "Review data classification and handling"
                ],
                notification_requirements={
                    "immediate": ["security_manager", "hr_director", "legal_counsel"],
                    "within_24h": ["executive_leadership"],
                    "as_required": ["security_clearance_office", "counterintelligence"]
                },
                estimated_time_to_contain=900,  # 15 minutes
                estimated_time_to_resolve=604800,  # 7 days
                required_evidence=[
                    "user_activity_logs", "data_access_logs", "email_communications", "file_transfers"
                ],
                compliance_requirements=[
                    "DFARS 252.204-7012", "NISPOM", "Executive Order 12968"
                ]
            )
        ]

        for playbook in default_playbooks:
            self.response_playbooks[playbook.playbook_id] = playbook

    def add_response_playbook(self, playbook: ResponsePlaybook):
        """Add a new response playbook."""
        self.response_playbooks[playbook.playbook_id] = playbook
        logger.info(f"Added response playbook: {playbook.playbook_id}")

    def get_response_playbooks(self) -> Dict[str, ResponsePlaybook]:
        """Get all response playbooks."""
        return self.response_playbooks.copy()

    def get_response_metrics(self) -> Dict[str, any]:
        """Get response performance metrics."""
        return self.metrics.copy()

    def generate_response_recommendations(self, incident: SecurityIncident) -> List[str]:
        """Generate recommendations based on incident analysis."""
        recommendations = []

        # Security control recommendations
        if incident.incident_type == IncidentType.UNAUTHORIZED_ACCESS:
            recommendations.extend([
                "Implement additional authentication factors",
                "Review and strengthen access control policies",
                "Enhance user activity monitoring"
            ])

        elif incident.incident_type == IncidentType.DATA_BREACH:
            recommendations.extend([
                "Implement data loss prevention controls",
                "Enhance data classification and handling procedures",
                "Review data encryption requirements"
            ])

        elif incident.incident_type == IncidentType.MALWARE_DETECTION:
            recommendations.extend([
                "Update endpoint protection signatures",
                "Implement application whitelisting",
                "Enhance email security controls"
            ])

        # Add severity-based recommendations
        if incident.severity in [IncidentSeverity.CRITICAL, IncidentSeverity.HIGH]:
            recommendations.extend([
                "Conduct comprehensive security assessment",
                "Review and test incident response procedures",
                "Implement additional monitoring controls"
            ])

        return recommendations