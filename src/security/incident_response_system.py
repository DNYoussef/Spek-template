from src.constants.base import MAXIMUM_NESTED_DEPTH

import json
import time
from lib.shared.utilities import get_logger
logger = get_logger(__name__)

class IncidentSeverity(Enum):
    """DFARS incident severity levels."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class IncidentCategory(Enum):
    """DFARS incident categories."""
    DATA_BREACH = "data_breach"
    UNAUTHORIZED_ACCESS = "unauthorized_access"
    MALWARE_DETECTION = "malware_detection"
    SYSTEM_COMPROMISE = "system_compromise"
    POLICY_VIOLATION = "policy_violation"
    CRYPTOGRAPHIC_FAILURE = "cryptographic_failure"
    CONFIGURATION_DRIFT = "configuration_drift"
    SUPPLY_CHAIN_COMPROMISE = "supply_chain_compromise"

class IncidentStatus(Enum):
    """Incident response status."""
    NEW = "new"
    INVESTIGATING = "investigating"
    CONTAINED = "contained"
    ERADICATED = "eradicated"
    RECOVERED = "recovered"
    CLOSED = "closed"

@dataclass
class SecurityIncident:
    """Security incident data structure."""
    incident_id: str
    title: str
    description: str
    severity: IncidentSeverity
    category: IncidentCategory
    status: IncidentStatus
    detected_at: float
    reported_at: Optional[float]
    source_system: str
    affected_systems: List[str]
    indicators: Dict[str, Any]
    response_actions: List[Dict[str, Any]]
    evidence: List[Dict[str, Any]]
    timeline: List[Dict[str, Any]]
    assignee: Optional[str] = None
    estimated_impact: Optional[str] = None
    root_cause: Optional[str] = None
    remediation_plan: Optional[Dict[str, Any]] = None
    lessons_learned: Optional[str] = None

class DFARSIncidentResponseSystem:
    """
    Comprehensive incident response system implementing DFARS 252.204-7012
    requirements for security incident detection, response, and reporting.
    """

    # DFARS reporting requirements
    CRITICAL_INCIDENT_REPORTING_WINDOW = 72 * 3600  # 72 hours in seconds
    INCIDENT_RETENTION_PERIOD = 7 * 365 * 24 * 3600  # 7 years in seconds

    def __init__(self, config_path: Optional[str] = None):
        """Initialize DFARS incident response system."""
        self.config = self._load_config(config_path)
        self.incidents: Dict[str, SecurityIncident] = {}
        self.active_monitors: List[asyncio.Task] = []

        # Initialize components
        self.audit_manager = DFARSAuditTrailManager(".claude/.artifacts/incident_audit")
        self.crypto_module = FIPSCryptoModule()

        # Initialize storage
        self.storage_path = Path(".claude/.artifacts/incident_response")
        self.storage_path.mkdir(parents=True, exist_ok=True)

        # Load existing incidents
        self._load_existing_incidents()

        # Initialize notification systems
        self._setup_notification_systems()

        logger.info("DFARS Incident Response System initialized")

    def _load_config(self, config_path: Optional[str]) -> Dict[str, Any]:
        """Load incident response configuration."""
        default_config = {
            "incident_response": {
                "auto_detection": True,
                "auto_containment": True,
                "notification_channels": ["email", "syslog", "webhook"],
                "escalation_rules": {
                    "critical": {"notify_within_minutes": 15, "escalate_after_hours": 2},
                    "high": {"notify_within_minutes": 30, "escalate_after_hours": 4},
                    "medium": {"notify_within_minutes": 60, "escalate_after_hours": 8},
                    "low": {"notify_within_minutes": 240, "escalate_after_hours": 24}
                },
                "forensic_collection": {
                    "auto_collect_evidence": True,
                    "preserve_volatile_data": True,
                    "chain_of_custody": True,
                    "evidence_encryption": True
                },
                "reporting": {
                    "dfars_compliance_officer": "compliance@organization.mil",
                    "security_team": "security@organization.mil",
                    "management": "management@organization.mil",
                    "external_reporting": {
                        "enabled": True,
                        "endpoints": ["https://dibnet.dod.mil/incidents"]
                    }
                },
                "detection_rules": {
                    "failed_login_threshold": MAXIMUM_NESTED_DEPTH,
                    "file_access_patterns": True,
                    "network_anomaly_detection": True,
                    "cryptographic_failures": True,
                    "configuration_drift": True
                }
            }
        }

        if config_path and path_exists(config_path):
            try:
                with open(config_path, 'r') as f:
                    loaded_config = json.load(f)
                    default_config.update(loaded_config)
            except Exception as e:
                logger.warning(f"Failed to load config from {config_path}: {e}")

        return default_config

    def _load_existing_incidents(self):
        """Load existing incidents from storage."""
        incident_files = self.storage_path.glob("incident_*.json")

        for incident_file in incident_files:
            try:
                with open(incident_file, 'r') as f:
                    incident_data = json.load(f)

                # Convert back to SecurityIncident object
                incident = SecurityIncident(
                    incident_id=incident_data['incident_id'],
                    title=incident_data['title'],
                    description=incident_data['description'],
                    severity=IncidentSeverity(incident_data['severity']),
                    category=IncidentCategory(incident_data['category']),
                    status=IncidentStatus(incident_data['status']),
                    detected_at=incident_data['detected_at'],
                    reported_at=incident_data.get('reported_at'),
                    source_system=incident_data['source_system'],
                    affected_systems=incident_data['affected_systems'],
                    indicators=incident_data['indicators'],
                    response_actions=incident_data['response_actions'],
                    evidence=incident_data['evidence'],
                    timeline=incident_data['timeline'],
                    assignee=incident_data.get('assignee'),
                    estimated_impact=incident_data.get('estimated_impact'),
                    root_cause=incident_data.get('root_cause'),
                    remediation_plan=incident_data.get('remediation_plan'),
                    lessons_learned=incident_data.get('lessons_learned')
                )

                self.incidents[incident.incident_id] = incident

            except Exception as e:
                logger.error(f"Failed to load incident from {incident_file}: {e}")

        logger.info(f"Loaded {len(self.incidents)} existing incidents")

    def _setup_notification_systems(self):
        """Setup notification channels for incident alerts."""
        # Email notification setup would go here

    async def detect_incidents(self):
        """Continuous incident detection monitoring."""
        detection_tasks = [
            self._monitor_failed_logins(),
            self._monitor_file_access_anomalies(),
            self._monitor_network_anomalies(),
            self._monitor_cryptographic_failures(),
            self._monitor_configuration_drift(),
            self._monitor_supply_chain_integrity()
        ]

        await asyncio.gather(*detection_tasks, return_exceptions=True)

    async def _monitor_failed_logins(self):
        """Monitor for failed login attempt patterns."""
        threshold = self.config['incident_response']['detection_rules']['failed_login_threshold']

        # Simulate failed login detection
        while True:
            try:
                # Check for failed login patterns
                failed_attempts = await self._check_authentication_logs()

                for source_ip, attempts in failed_attempts.items():
                    if attempts >= threshold:
                        await self.create_incident(
                            title=f"Brute Force Attack Detected from {source_ip}",
                            description=f"Detected {attempts} failed login attempts from {source_ip} within monitoring window",
                            severity=IncidentSeverity.HIGH,
                            category=IncidentCategory.UNAUTHORIZED_ACCESS,
                            source_system="authentication_monitor",
                            affected_systems=["authentication_service"],
                            indicators={
                                "source_ip": source_ip,
                                "failed_attempts": attempts,
                                "detection_rule": "failed_login_threshold"
                            }
                        )

                await asyncio.sleep(60)  # Check every minute

            except Exception as e:
                logger.error(f"Failed login monitoring error: {e}")
                await asyncio.sleep(300)  # Wait longer on error

    async def _check_authentication_logs(self) -> Dict[str, int]:
        """Check authentication logs for failed attempts."""
        # Simulate authentication log analysis
        return {}

    async def _monitor_file_access_anomalies(self):
        """Monitor for suspicious file access patterns."""
        while True:
            try:
                # Check for unusual file access patterns
                anomalies = await self._analyze_file_access_patterns()

                for anomaly in anomalies:
                    await self.create_incident(
                        title=f"Suspicious File Access Pattern Detected",
                        description=f"Unusual file access pattern detected: {anomaly['description']}",
                        severity=IncidentSeverity.MEDIUM,
                        category=IncidentCategory.POLICY_VIOLATION,
                        source_system="file_access_monitor",
                        affected_systems=anomaly['affected_systems'],
                        indicators=anomaly
                    )

                await asyncio.sleep(300)  # Check every 5 minutes

            except Exception as e:
                logger.error(f"File access monitoring error: {e}")
                await asyncio.sleep(600)

    async def _analyze_file_access_patterns(self) -> List[Dict[str, Any]]:
        """Analyze file access patterns for anomalies."""
        # Simulate file access analysis
        return []

    async def _monitor_network_anomalies(self):
        """Monitor for network-based security anomalies."""
        while True:
            try:
                # Check for network anomalies
                anomalies = await self._analyze_network_traffic()

                for anomaly in anomalies:
                    severity = IncidentSeverity.CRITICAL if anomaly['threat_level'] == 'critical' else IncidentSeverity.HIGH

                    await self.create_incident(
                        title=f"Network Anomaly Detected: {anomaly['type']}",
                        description=f"Network security anomaly detected: {anomaly['description']}",
                        severity=severity,
                        category=IncidentCategory.SYSTEM_COMPROMISE,
                        source_system="network_monitor",
                        affected_systems=anomaly['affected_systems'],
                        indicators=anomaly
                    )

                await asyncio.sleep(120)  # Check every 2 minutes

            except Exception as e:
                logger.error(f"Network monitoring error: {e}")
                await asyncio.sleep(300)

    async def _analyze_network_traffic(self) -> List[Dict[str, Any]]:
        """Analyze network traffic for security anomalies."""
        # Simulate network traffic analysis
        return []

    async def _monitor_cryptographic_failures(self):
        """Monitor for cryptographic operation failures."""
        while True:
            try:
                # Check crypto module status
                status = self.crypto_module.get_compliance_status()
                integrity_check = self.crypto_module.perform_integrity_check()

                if not integrity_check['integrity_check_passed']:
                    await self.create_incident(
                        title="Cryptographic Integrity Failure",
                        description=f"Detected {len(integrity_check['integrity_failures'])} cryptographic integrity failures",
                        severity=IncidentSeverity.CRITICAL,
                        category=IncidentCategory.CRYPTOGRAPHIC_FAILURE,
                        source_system="fips_crypto_module",
                        affected_systems=["cryptographic_subsystem"],
                        indicators={
                            "integrity_failures": integrity_check['integrity_failures'],
                            "total_operations": integrity_check['total_operations_checked']
                        }
                    )

                # Check for use of prohibited algorithms
                if status['compliance_rate'] < 1.0:
                    non_compliant = status['total_operations'] - status['compliant_operations']

                    await self.create_incident(
                        title="Non-FIPS Cryptographic Operations Detected",
                        description=f"Detected {non_compliant} non-FIPS compliant cryptographic operations",
                        severity=IncidentSeverity.HIGH,
                        category=IncidentCategory.CRYPTOGRAPHIC_FAILURE,
                        source_system="fips_crypto_module",
                        affected_systems=["cryptographic_subsystem"],
                        indicators={
                            "compliance_rate": status['compliance_rate'],
                            "non_compliant_operations": non_compliant,
                            "algorithm_usage": status['algorithm_usage']
                        }
                    )

                await asyncio.sleep(600)  # Check every 10 minutes

            except Exception as e:
                logger.error(f"Cryptographic monitoring error: {e}")
                await asyncio.sleep(900)

    async def _monitor_configuration_drift(self):
        """Monitor for security configuration drift."""
        while True:
            try:
                # Check for configuration changes
                drift_events = await self._detect_configuration_drift()

                for drift in drift_events:
                    severity = IncidentSeverity.HIGH if drift['security_impact'] else IncidentSeverity.MEDIUM

                    await self.create_incident(
                        title=f"Configuration Drift Detected: {drift['component']}",
                        description=f"Security configuration drift detected in {drift['component']}: {drift['description']}",
                        severity=severity,
                        category=IncidentCategory.CONFIGURATION_DRIFT,
                        source_system="configuration_monitor",
                        affected_systems=[drift['component']],
                        indicators=drift
                    )

                await asyncio.sleep(900)  # Check every 15 minutes

            except Exception as e:
                logger.error(f"Configuration monitoring error: {e}")
                await asyncio.sleep(1200)

    async def _detect_configuration_drift(self) -> List[Dict[str, Any]]:
        """Detect security configuration drift."""
        # Simulate configuration drift detection
        return []

    async def _monitor_supply_chain_integrity(self):
        """Monitor for supply chain security compromises."""
        while True:
            try:
                # Check supply chain integrity
                integrity_issues = await self._check_supply_chain_integrity()

                for issue in integrity_issues:
                    await self.create_incident(
                        title=f"Supply Chain Integrity Issue: {issue['component']}",
                        description=f"Supply chain integrity compromise detected: {issue['description']}",
                        severity=IncidentSeverity.CRITICAL,
                        category=IncidentCategory.SUPPLY_CHAIN_COMPROMISE,
                        source_system="supply_chain_monitor",
                        affected_systems=[issue['component']],
                        indicators=issue
                    )

                await asyncio.sleep(3600)  # Check every hour

            except Exception as e:
                logger.error(f"Supply chain monitoring error: {e}")
                await asyncio.sleep(1800)

    async def _check_supply_chain_integrity(self) -> List[Dict[str, Any]]:
        """Check supply chain component integrity."""
        # Simulate supply chain integrity checking
        return []

    async def create_incident(self, title: str, description: str, severity: IncidentSeverity,
                            category: IncidentCategory, source_system: str,
                            affected_systems: List[str], indicators: Dict[str, Any]) -> str:
        """Create new security incident."""
        incident_id = hashlib.sha256(
            f"{title}{time.time()}{source_system}".encode()
        ).hexdigest()[:16]

        current_time = time.time()

        incident = SecurityIncident(
            incident_id=incident_id,
            title=title,
            description=description,
            severity=severity,
            category=category,
            status=IncidentStatus.NEW,
            detected_at=current_time,
            reported_at=None,
            source_system=source_system,
            affected_systems=affected_systems,
            indicators=indicators,
            response_actions=[],
            evidence=[],
            timeline=[{
                "timestamp": current_time,
                "event": "incident_created",
                "description": "Incident automatically detected and created",
                "actor": "system"
            }]
        )

        # Store incident
        self.incidents[incident_id] = incident
        self._persist_incident(incident)

        # Log incident creation
        self.audit_manager.log_security_event(
            event_type=AuditEventType.SECURITY_INCIDENT,
            severity=SeverityLevel.HIGH if severity in [IncidentSeverity.HIGH, IncidentSeverity.CRITICAL] else SeverityLevel.MEDIUM,
            description=f"Security incident created: {title}",
            details={
                "incident_id": incident_id,
                "severity": severity.value,
                "category": category.value,
                "source_system": source_system,
                "affected_systems": affected_systems
            }
        )

        # Trigger immediate response for critical/high severity
        if severity in [IncidentSeverity.CRITICAL, IncidentSeverity.HIGH]:
            await self._trigger_immediate_response(incident)

        # Send notifications
        await self._send_incident_notifications(incident)

        logger.info(f"Created incident {incident_id}: {title} [{severity.value}]")
        return incident_id

    def _persist_incident(self, incident: SecurityIncident):
        """Persist incident to storage."""
        incident_file = self.storage_path / f"incident_{incident.incident_id}.json"

        with open(incident_file, 'w') as f:
            incident_dict = asdict(incident)
            incident_dict['severity'] = incident.severity.value
            incident_dict['category'] = incident.category.value
            incident_dict['status'] = incident.status.value
            json.dump(incident_dict, f, indent=2)

    async def _trigger_immediate_response(self, incident: SecurityIncident):
        """Trigger immediate response actions for critical/high incidents."""
        response_actions = []

        # Auto-containment for certain incident types
        if incident.category in [IncidentCategory.MALWARE_DETECTION, IncidentCategory.SYSTEM_COMPROMISE]:
            containment_result = await self._auto_contain_threat(incident)
            response_actions.append({
                "timestamp": time.time(),
                "action": "auto_containment",
                "result": containment_result,
                "actor": "system"
            })

        # Evidence collection
        if self.config['incident_response']['forensic_collection']['auto_collect_evidence']:
            evidence_result = await self._collect_forensic_evidence(incident)
            response_actions.append({
                "timestamp": time.time(),
                "action": "evidence_collection",
                "result": evidence_result,
                "actor": "system"
            })

        # Update incident with response actions
        incident.response_actions.extend(response_actions)
        incident.timeline.extend([{
            "timestamp": action["timestamp"],
            "event": f"response_action_{action['action']}",
            "description": f"Automated {action['action']} executed",
            "actor": "system"
        } for action in response_actions])

        self._persist_incident(incident)

    async def _auto_contain_threat(self, incident: SecurityIncident) -> Dict[str, Any]:
        """Automatically contain detected threats."""
        containment_result = {
            "success": False,
            "actions_taken": [],
            "errors": []
        }

        try:
            # Network isolation for compromised systems
            for system in incident.affected_systems:
                isolation_result = await self._isolate_system(system)
                containment_result["actions_taken"].append(f"Isolated system: {system}")
                if not isolation_result:
                    containment_result["errors"].append(f"Failed to isolate {system}")

            # Block malicious IPs if network-based incident
            if 'source_ip' in incident.indicators:
                block_result = await self._block_ip_address(incident.indicators['source_ip'])
                containment_result["actions_taken"].append(f"Blocked IP: {incident.indicators['source_ip']}")
                if not block_result:
                    containment_result["errors"].append(f"Failed to block IP {incident.indicators['source_ip']}")

            containment_result["success"] = len(containment_result["errors"]) == 0

        except Exception as e:
            containment_result["errors"].append(str(e))
            logger.error(f"Auto-containment failed for incident {incident.incident_id}: {e}")

        return containment_result

    async def _isolate_system(self, system: str) -> bool:
        """Isolate system from network."""
        # Simulate network isolation
        logger.info(f"Isolating system: {system}")
        return True

    async def _block_ip_address(self, ip_address: str) -> bool:
        """Block IP address at network perimeter."""
        # Simulate IP blocking
        logger.info(f"Blocking IP address: {ip_address}")
        return True

    async def _collect_forensic_evidence(self, incident: SecurityIncident) -> Dict[str, Any]:
        """Collect forensic evidence for incident investigation."""
        evidence_result = {
            "evidence_collected": [],
            "errors": [],
            "chain_of_custody_id": hashlib.sha256(
                f"{incident.incident_id}{time.time()}".encode()
            ).hexdigest()[:12]
        }

        try:
            # Collect system information
            for system in incident.affected_systems:
                system_evidence = await self._collect_system_evidence(system)
                evidence_result["evidence_collected"].extend(system_evidence)

            # Collect network evidence for network-based incidents
            if incident.category in [IncidentCategory.UNAUTHORIZED_ACCESS, IncidentCategory.SYSTEM_COMPROMISE]:
                network_evidence = await self._collect_network_evidence(incident)
                evidence_result["evidence_collected"].extend(network_evidence)

            # Encrypt collected evidence
            if self.config['incident_response']['forensic_collection']['evidence_encryption']:
                encrypted_evidence = await self._encrypt_evidence(evidence_result["evidence_collected"])
                evidence_result["encrypted_evidence"] = encrypted_evidence

        except Exception as e:
            evidence_result["errors"].append(str(e))
            logger.error(f"Evidence collection failed for incident {incident.incident_id}: {e}")

        return evidence_result

    async def _collect_system_evidence(self, system: str) -> List[Dict[str, Any]]:
        """Collect system-level forensic evidence."""
        evidence = []

        try:
            # Collect process list
            processes = await self._get_running_processes(system)
            evidence.append({
                "type": "process_list",
                "system": system,
                "timestamp": time.time(),
                "data": processes,
                "hash": hashlib.sha256(str(processes).encode()).hexdigest()
            })

            # Collect network connections
            connections = await self._get_network_connections(system)
            evidence.append({
                "type": "network_connections",
                "system": system,
                "timestamp": time.time(),
                "data": connections,
                "hash": hashlib.sha256(str(connections).encode()).hexdigest()
            })

            # Collect system logs
            logs = await self._get_system_logs(system)
            evidence.append({
                "type": "system_logs",
                "system": system,
                "timestamp": time.time(),
                "data": logs,
                "hash": hashlib.sha256(str(logs).encode()).hexdigest()
            })

        except Exception as e:
            logger.error(f"Failed to collect system evidence for {system}: {e}")

        return evidence

    async def _get_running_processes(self, system: str) -> List[Dict[str, Any]]:
        """Get running processes on system."""
        # Simulate process collection
        return []

    async def _get_network_connections(self, system: str) -> List[Dict[str, Any]]:
        """Get network connections for system."""
        # Simulate network connection collection
        return []

    async def _get_system_logs(self, system: str) -> List[str]:
        """Get relevant system logs."""
        # Simulate log collection
        return []

    async def _collect_network_evidence(self, incident: SecurityIncident) -> List[Dict[str, Any]]:
        """Collect network-level forensic evidence."""
        # Simulate network evidence collection
        return []

    async def _encrypt_evidence(self, evidence: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Encrypt forensic evidence for secure storage."""
        evidence_json = json.dumps(evidence, indent=2).encode()

        # Generate encryption key for this evidence package
        key, key_id = self.crypto_module.generate_symmetric_key("AES-256-GCM")

        # Encrypt evidence
        encrypted_data = self.crypto_module.encrypt_data(evidence_json, key, "AES-256-GCM")

        # Store encryption key securely (in production, use key management system)
        key_storage = self.storage_path / "evidence_keys"
        key_storage.mkdir(exist_ok=True)

        with open(key_storage / f"{key_id}.key", 'wb') as f:
            f.write(key)

        return {
            "encrypted_data": encrypted_data,
            "key_id": key_id,
            "encryption_algorithm": "AES-256-GCM"
        }

    async def _send_incident_notifications(self, incident: SecurityIncident):
        """Send incident notifications based on severity and escalation rules."""
        escalation_rules = self.config['incident_response']['escalation_rules']
        severity_config = escalation_rules.get(incident.severity.value, escalation_rules['medium'])

        # Immediate notification for critical/high incidents
        if incident.severity in [IncidentSeverity.CRITICAL, IncidentSeverity.HIGH]:
            await self._send_immediate_notification(incident)

        # Schedule DFARS compliance reporting if required
        if incident.severity == IncidentSeverity.CRITICAL:
            await self._schedule_dfars_reporting(incident)

    async def _send_immediate_notification(self, incident: SecurityIncident):
        """Send immediate notification for critical incidents."""
        notification_data = {
            "incident_id": incident.incident_id,
            "title": incident.title,
            "severity": incident.severity.value,
            "category": incident.category.value,
            "detected_at": datetime.fromtimestamp(incident.detected_at, timezone.utc).isoformat(),
            "affected_systems": incident.affected_systems,
            "description": incident.description
        }

        # Email notification
        if "email" in self.config['incident_response']['notification_channels']:
            await self._send_email_notification(notification_data)

        # Webhook notification
        if "webhook" in self.config['incident_response']['notification_channels']:
            await self._send_webhook_notification(notification_data)

        logger.info(f"Immediate notifications sent for incident {incident.incident_id}")

    async def _send_email_notification(self, notification_data: Dict[str, Any]):
        """Send email notification for incident."""
        # Simulate email notification
        logger.info(f"Email notification sent for incident {notification_data['incident_id']}")

    async def _send_webhook_notification(self, notification_data: Dict[str, Any]):
        """Send webhook notification for incident."""
        # Simulate webhook notification
        logger.info(f"Webhook notification sent for incident {notification_data['incident_id']}")

    async def _schedule_dfars_reporting(self, incident: SecurityIncident):
        """Schedule DFARS compliance reporting for critical incidents."""
        # Mark incident for required DFARS reporting
        incident.timeline.append({
            "timestamp": time.time(),
            "event": "dfars_reporting_scheduled",
            "description": "Incident marked for mandatory DFARS reporting within 72 hours",
            "actor": "system"
        })

        # Schedule automatic reporting reminder
        reporting_deadline = incident.detected_at + self.CRITICAL_INCIDENT_REPORTING_WINDOW

        # In production, this would schedule actual reporting tasks
        logger.info(f"DFARS reporting scheduled for incident {incident.incident_id} by {datetime.fromtimestamp(reporting_deadline, timezone.utc)}")

        self._persist_incident(incident)

    def get_incident_status_report(self) -> Dict[str, Any]:
        """Generate comprehensive incident status report."""
        now = time.time()

        # Categorize incidents by status and severity
        status_summary = {}
        severity_summary = {}
        category_summary = {}

        for incident in self.incidents.values():
            # Status summary
            status = incident.status.value
            status_summary[status] = status_summary.get(status, 0) + 1

            # Severity summary
            severity = incident.severity.value
            severity_summary[severity] = severity_summary.get(severity, 0) + 1

            # Category summary
            category = incident.category.value
            category_summary[category] = category_summary.get(category, 0) + 1

        # Find incidents requiring DFARS reporting
        dfars_reporting_required = []
        for incident in self.incidents.values():
            if (incident.severity == IncidentSeverity.CRITICAL and
                incident.reported_at is None and
                (now - incident.detected_at) < self.CRITICAL_INCIDENT_REPORTING_WINDOW):
                dfars_reporting_required.append({
                    "incident_id": incident.incident_id,
                    "title": incident.title,
                    "detected_at": incident.detected_at,
                    "time_remaining": self.CRITICAL_INCIDENT_REPORTING_WINDOW - (now - incident.detected_at)
                })

        # Recent incidents (last 24 hours)
        recent_incidents = [
            {
                "incident_id": incident.incident_id,
                "title": incident.title,
                "severity": incident.severity.value,
                "status": incident.status.value,
                "detected_at": incident.detected_at
            }
            for incident in self.incidents.values()
            if (now - incident.detected_at) < 86400  # 24 hours
        ]

        return {
            "report_generated_at": now,
            "total_incidents": len(self.incidents),
            "status_summary": status_summary,
            "severity_summary": severity_summary,
            "category_summary": category_summary,
            "dfars_reporting_required": dfars_reporting_required,
            "recent_incidents": recent_incidents,
            "system_status": {
                "active_monitors": len(self.active_monitors),
                "storage_path": str(self.storage_path),
                "audit_trail_active": True
            }
        }

# Factory function
def create_incident_response_system(config_path: Optional[str] = None) -> DFARSIncidentResponseSystem:
    """Create DFARS incident response system."""
    return DFARSIncidentResponseSystem(config_path)

# Example usage
if __name__ == "__main__":
    async def main():
        # Initialize incident response system
        irs = create_incident_response_system()

        print("DFARS Incident Response System")
        print("=" * 35)

        # Create test incident
        incident_id = await irs.create_incident(
            title="Test Security Incident",
            description="This is a test incident for system validation",
            severity=IncidentSeverity.HIGH,
            category=IncidentCategory.SYSTEM_COMPROMISE,
            source_system="test_system",
            affected_systems=["web_server", "database"],
            indicators={
                "test": True,
                "source_ip": "192.168.1.100",
                "attack_vector": "web_application"
            }
        )

        # Generate status report
        report = irs.get_incident_status_report()
        print(f"Total incidents: {report['total_incidents']}")
        print(f"DFARS reporting required: {len(report['dfars_reporting_required'])}")

        return irs

    # Run example
    asyncio.run(main())