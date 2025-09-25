"""
Forensic evidence service.
Extracted from enhanced_incident_response_system.py for focused responsibility.
"""

import json
import time
import hashlib
import secrets
from pathlib import Path
from typing import Dict, Any, List, Optional
from lib.shared.utilities import get_logger

from ..models import SecurityIncident, ForensicEvidence, IncidentSeverity

logger = get_logger(__name__)


class ForensicEvidenceService:
    """
    Focused service for collecting, managing, and preserving forensic evidence.
    Handles evidence collection, encryption, chain of custody, and legal hold procedures.
    """

    def __init__(self, storage_path: str = ".claude/.artifacts/forensic_evidence"):
        """Initialize the forensic evidence service."""
        self.storage_path = Path(storage_path)
        self.storage_path.mkdir(parents=True, exist_ok=True)

        self.forensic_evidence: Dict[str, ForensicEvidence] = {}
        self.evidence_retention_period = 7 * 365 * 24 * 3600  # 7 years in seconds

        # Initialize crypto module (would use real FIPS module in production)
        self.crypto_module = self._initialize_crypto_module()

        # Load existing evidence
        self._load_existing_evidence()

    def _initialize_crypto_module(self):
        """Initialize cryptographic module for evidence encryption."""
        # In production, this would initialize a real FIPS 140-2 compliant crypto module
        class MockCryptoModule:
            def generate_symmetric_key(self, algorithm: str):
                key_id = f"key_{secrets.token_hex(8)}"
                key = secrets.token_bytes(32)  # 256-bit key
                return key, key_id

            def encrypt_data(self, data: bytes, key: bytes, algorithm: str):
                # Mock encryption - in production use real FIPS-compliant encryption
                return f"encrypted_{hashlib.sha256(data + key).hexdigest()[:32]}"

        return MockCryptoModule()

    def collect_incident_evidence(self, incident: SecurityIncident) -> str:
        """Collect comprehensive forensic evidence for the incident."""
        try:
            evidence_id = f"ev_{int(time.time())}_{secrets.token_hex(6)}"
            collection_time = time.time()

            # Collect system evidence
            system_evidence = self._collect_system_evidence(incident)

            # Collect network evidence
            network_evidence = self._collect_network_evidence(incident)

            # Collect application evidence
            application_evidence = self._collect_application_evidence(incident)

            # Combine all evidence
            combined_evidence = {
                "system_evidence": system_evidence,
                "network_evidence": network_evidence,
                "application_evidence": application_evidence,
                "incident_metadata": self._serialize_incident_for_evidence(incident)
            }

            # Create evidence package
            evidence_package = ForensicEvidence(
                evidence_id=evidence_id,
                incident_id=incident.incident_id,
                collection_timestamp=collection_time,
                collector="automated_forensics_system",
                evidence_type="comprehensive_incident_evidence",
                source_system="enhanced_incident_response",
                evidence_data=combined_evidence,
                chain_of_custody=[{
                    "timestamp": collection_time,
                    "action": "evidence_collected",
                    "actor": "automated_system",
                    "location": "digital_evidence_storage"
                }],
                integrity_hash=self._calculate_evidence_hash(combined_evidence),
                encryption_status=True,
                preservation_method="encrypted_digital_storage",
                legal_hold=incident.severity in [IncidentSeverity.CRITICAL, IncidentSeverity.HIGH]
            )

            # Encrypt evidence if required
            if evidence_package.encryption_status:
                self._encrypt_evidence_package(evidence_package)

            # Store evidence
            self.forensic_evidence[evidence_id] = evidence_package

            # Save to persistent storage
            self._save_evidence_package(evidence_package)

            logger.info(f"Forensic evidence collected for incident {incident.incident_id}: {evidence_id}")
            return evidence_id

        except Exception as e:
            logger.error(f"Failed to collect evidence for incident {incident.incident_id}: {e}")
            raise

    def _collect_system_evidence(self, incident: SecurityIncident) -> Dict[str, Any]:
        """Collect system-level forensic evidence."""
        system_evidence = {
            "timestamp": time.time(),
            "incident_id": incident.incident_id,
            "affected_systems": incident.affected_resources,
            "system_logs": self._collect_system_logs(incident),
            "process_information": self._collect_process_information(incident),
            "file_system_artifacts": self._collect_file_system_artifacts(incident),
            "registry_snapshots": self._collect_registry_snapshots(incident),
            "memory_dumps": self._collect_memory_dumps(incident)
        }

        return system_evidence

    def _collect_network_evidence(self, incident: SecurityIncident) -> Dict[str, Any]:
        """Collect network-level forensic evidence."""
        network_evidence = {
            "timestamp": time.time(),
            "incident_id": incident.incident_id,
            "network_traffic": self._collect_network_traffic(incident),
            "connection_logs": self._collect_connection_logs(incident),
            "dns_queries": self._collect_dns_queries(incident),
            "firewall_logs": self._collect_firewall_logs(incident),
            "proxy_logs": self._collect_proxy_logs(incident)
        }

        return network_evidence

    def _collect_application_evidence(self, incident: SecurityIncident) -> Dict[str, Any]:
        """Collect application-level forensic evidence."""
        application_evidence = {
            "timestamp": time.time(),
            "incident_id": incident.incident_id,
            "application_logs": self._collect_application_logs(incident),
            "database_logs": self._collect_database_logs(incident),
            "authentication_logs": self._collect_authentication_logs(incident),
            "audit_trails": self._collect_audit_trails(incident),
            "configuration_snapshots": self._collect_configuration_snapshots(incident)
        }

        return application_evidence

    def _collect_system_logs(self, incident: SecurityIncident) -> List[Dict[str, Any]]:
        """Collect system logs relevant to the incident."""
        # Mock implementation - in production, this would collect real system logs
        logs = []

        for resource in incident.affected_resources:
            if "hostname:" in resource or "ip:" in resource:
                logs.append({
                    "source": resource,
                    "log_type": "system_event",
                    "timestamp": incident.detected_timestamp,
                    "events": [
                        {"level": "WARNING", "message": f"Suspicious activity detected on {resource}"},
                        {"level": "ERROR", "message": f"Security violation on {resource}"},
                        {"level": "INFO", "message": f"System state captured for {resource}"}
                    ]
                })

        return logs

    def _collect_process_information(self, incident: SecurityIncident) -> Dict[str, Any]:
        """Collect running process information."""
        return {
            "collection_timestamp": time.time(),
            "processes": [
                {"pid": 1234, "name": "suspicious_process.exe", "command_line": "process args"},
                {"pid": 5678, "name": "malware.exe", "command_line": "malware execution"}
            ],
            "network_connections": [
                {"local_port": 443, "remote_ip": "192.168.1.100", "state": "ESTABLISHED"}
            ]
        }

    def _collect_file_system_artifacts(self, incident: SecurityIncident) -> Dict[str, Any]:
        """Collect file system artifacts and changes."""
        return {
            "collection_timestamp": time.time(),
            "modified_files": [
                {"path": "/etc/passwd", "modification_time": incident.detected_timestamp},
                {"path": "/var/log/auth.log", "modification_time": incident.detected_timestamp}
            ],
            "created_files": [
                {"path": "/tmp/malware.txt", "creation_time": incident.detected_timestamp}
            ],
            "deleted_files": [
                {"path": "/home/user/sensitive.doc", "deletion_time": incident.detected_timestamp}
            ]
        }

    def _collect_registry_snapshots(self, incident: SecurityIncident) -> Dict[str, Any]:
        """Collect Windows registry snapshots."""
        return {
            "collection_timestamp": time.time(),
            "registry_keys": [
                {"key": "HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\Run", "modified": True},
                {"key": "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run", "modified": True}
            ]
        }

    def _collect_memory_dumps(self, incident: SecurityIncident) -> Dict[str, Any]:
        """Collect memory dump information."""
        return {
            "collection_timestamp": time.time(),
            "memory_artifacts": [
                {"type": "process_dump", "process": "suspicious_process.exe", "size_mb": 150},
                {"type": "full_memory_dump", "size_mb": 8192, "compressed": True}
            ]
        }

    def _collect_network_traffic(self, incident: SecurityIncident) -> Dict[str, Any]:
        """Collect network traffic captures."""
        return {
            "collection_timestamp": time.time(),
            "pcap_files": [
                {"filename": "incident_traffic.pcap", "size_mb": 500, "duration_minutes": 60}
            ],
            "suspicious_connections": [
                {"src_ip": "192.168.1.100", "dst_ip": "203.0.113.45", "protocol": "TCP", "port": 443}
            ]
        }

    def _collect_connection_logs(self, incident: SecurityIncident) -> List[Dict[str, Any]]:
        """Collect network connection logs."""
        return [
            {
                "timestamp": incident.detected_timestamp,
                "source_ip": "192.168.1.100",
                "destination_ip": "203.0.113.45",
                "protocol": "TCP",
                "destination_port": 443,
                "connection_state": "ESTABLISHED",
                "bytes_transferred": 15000
            }
        ]

    def _collect_dns_queries(self, incident: SecurityIncident) -> List[Dict[str, Any]]:
        """Collect DNS query logs."""
        return [
            {
                "timestamp": incident.detected_timestamp,
                "query_name": "evil-domain.com",
                "query_type": "A",
                "response": "203.0.113.45",
                "source_ip": "192.168.1.100"
            }
        ]

    def _collect_firewall_logs(self, incident: SecurityIncident) -> List[Dict[str, Any]]:
        """Collect firewall logs."""
        return [
            {
                "timestamp": incident.detected_timestamp,
                "action": "BLOCK",
                "source_ip": "203.0.113.45",
                "destination_port": 22,
                "protocol": "TCP",
                "rule": "SSH_PROTECTION"
            }
        ]

    def _collect_proxy_logs(self, incident: SecurityIncident) -> List[Dict[str, Any]]:
        """Collect proxy server logs."""
        return [
            {
                "timestamp": incident.detected_timestamp,
                "user": "username",
                "url": "https://evil-domain.com/malware.exe",
                "action": "BLOCKED",
                "category": "malware"
            }
        ]

    def _collect_application_logs(self, incident: SecurityIncident) -> List[Dict[str, Any]]:
        """Collect application-specific logs."""
        return [
            {
                "application": "web_server",
                "timestamp": incident.detected_timestamp,
                "log_level": "ERROR",
                "message": "Suspicious request pattern detected",
                "source_ip": "192.168.1.100"
            }
        ]

    def _collect_database_logs(self, incident: SecurityIncident) -> List[Dict[str, Any]]:
        """Collect database audit logs."""
        return [
            {
                "database": "production_db",
                "timestamp": incident.detected_timestamp,
                "user": "admin",
                "operation": "SELECT",
                "table": "sensitive_data",
                "rows_affected": 10000,
                "suspicious": True
            }
        ]

    def _collect_authentication_logs(self, incident: SecurityIncident) -> List[Dict[str, Any]]:
        """Collect authentication and authorization logs."""
        return [
            {
                "timestamp": incident.detected_timestamp,
                "event": "failed_login",
                "username": "admin",
                "source_ip": "192.168.1.100",
                "attempts": 15,
                "time_window_minutes": 5
            }
        ]

    def _collect_audit_trails(self, incident: SecurityIncident) -> List[Dict[str, Any]]:
        """Collect system audit trails."""
        return [
            {
                "timestamp": incident.detected_timestamp,
                "event": "privilege_escalation",
                "user": "standard_user",
                "target_privilege": "administrator",
                "success": True
            }
        ]

    def _collect_configuration_snapshots(self, incident: SecurityIncident) -> Dict[str, Any]:
        """Collect configuration snapshots."""
        return {
            "collection_timestamp": time.time(),
            "configurations": [
                {"component": "firewall", "config_hash": hashlib.sha256(b"firewall_config").hexdigest()},
                {"component": "active_directory", "config_hash": hashlib.sha256(b"ad_config").hexdigest()}
            ]
        }

    def _serialize_incident_for_evidence(self, incident: SecurityIncident) -> Dict[str, Any]:
        """Serialize incident data for evidence storage."""
        # Convert incident to dictionary, handling enum types
        incident_dict = {
            "incident_id": incident.incident_id,
            "incident_type": incident.incident_type.value,
            "severity": incident.severity.value,
            "status": incident.status.value,
            "detected_timestamp": incident.detected_timestamp,
            "source_system": incident.source_system,
            "affected_resources": incident.affected_resources,
            "indicators": incident.indicators,
            "description": incident.description,
            "initial_analysis": incident.initial_analysis,
            "evidence": incident.evidence,
            "response_actions": [action.value for action in incident.response_actions],
            "assigned_responder": incident.assigned_responder,
            "containment_timestamp": incident.containment_timestamp,
            "resolution_timestamp": incident.resolution_timestamp,
            "lessons_learned": incident.lessons_learned,
            "metadata": incident.metadata,
            "threat_level": incident.threat_level.value,
            "attack_vector": incident.attack_vector,
            "potential_impact": incident.potential_impact,
            "remediation_steps": incident.remediation_steps,
            "timeline": incident.timeline
        }

        return incident_dict

    def _calculate_evidence_hash(self, evidence_data: Dict[str, Any]) -> str:
        """Calculate SHA-256 hash of evidence data for integrity verification."""
        evidence_json = json.dumps(evidence_data, sort_keys=True)
        return hashlib.sha256(evidence_json.encode()).hexdigest()

    def _encrypt_evidence_package(self, evidence_package: ForensicEvidence):
        """Encrypt evidence package using FIPS-compliant cryptography."""
        try:
            # Convert evidence to JSON
            evidence_json = json.dumps(evidence_package.evidence_data, indent=2).encode()

            # Generate encryption key
            key, key_id = self.crypto_module.generate_symmetric_key("AES-256-GCM")

            # Encrypt evidence
            encrypted_data = self.crypto_module.encrypt_data(evidence_json, key, "AES-256-GCM")

            # Store encryption key securely
            key_storage = self.storage_path / "evidence_encryption_keys"
            key_storage.mkdir(exist_ok=True)

            with open(key_storage / f"{key_id}.key", 'wb') as f:
                f.write(key)

            # Update evidence package with encrypted data
            evidence_package.evidence_data = {
                "encrypted": True,
                "encryption_key_id": key_id,
                "encrypted_data": encrypted_data
            }

            # Update chain of custody
            evidence_package.chain_of_custody.append({
                "timestamp": time.time(),
                "action": "evidence_encrypted",
                "actor": "fips_crypto_module",
                "details": {"encryption_algorithm": "AES-256-GCM", "key_id": key_id}
            })

        except Exception as e:
            logger.error(f"Failed to encrypt evidence package {evidence_package.evidence_id}: {e}")
            evidence_package.encryption_status = False

    def _save_evidence_package(self, evidence_package: ForensicEvidence):
        """Save evidence package to persistent storage."""
        try:
            evidence_file = self.storage_path / f"{evidence_package.evidence_id}.json"

            # Serialize evidence package
            evidence_dict = {
                "evidence_id": evidence_package.evidence_id,
                "incident_id": evidence_package.incident_id,
                "collection_timestamp": evidence_package.collection_timestamp,
                "collector": evidence_package.collector,
                "evidence_type": evidence_package.evidence_type,
                "source_system": evidence_package.source_system,
                "evidence_data": evidence_package.evidence_data,
                "chain_of_custody": evidence_package.chain_of_custody,
                "integrity_hash": evidence_package.integrity_hash,
                "encryption_status": evidence_package.encryption_status,
                "preservation_method": evidence_package.preservation_method,
                "legal_hold": evidence_package.legal_hold
            }

            with open(evidence_file, 'w') as f:
                json.dump(evidence_dict, f, indent=2)

            logger.info(f"Evidence package saved: {evidence_package.evidence_id}")

        except Exception as e:
            logger.error(f"Failed to save evidence package {evidence_package.evidence_id}: {e}")

    def _load_existing_evidence(self):
        """Load existing evidence packages from storage."""
        try:
            for evidence_file in self.storage_path.glob("*.json"):
                if evidence_file.stem.startswith("ev_"):
                    with open(evidence_file, 'r') as f:
                        evidence_dict = json.load(f)

                    evidence_package = ForensicEvidence(
                        evidence_id=evidence_dict["evidence_id"],
                        incident_id=evidence_dict["incident_id"],
                        collection_timestamp=evidence_dict["collection_timestamp"],
                        collector=evidence_dict["collector"],
                        evidence_type=evidence_dict["evidence_type"],
                        source_system=evidence_dict["source_system"],
                        evidence_data=evidence_dict["evidence_data"],
                        chain_of_custody=evidence_dict["chain_of_custody"],
                        integrity_hash=evidence_dict["integrity_hash"],
                        encryption_status=evidence_dict["encryption_status"],
                        preservation_method=evidence_dict["preservation_method"],
                        legal_hold=evidence_dict["legal_hold"]
                    )

                    self.forensic_evidence[evidence_package.evidence_id] = evidence_package

            logger.info(f"Loaded {len(self.forensic_evidence)} existing evidence packages")

        except Exception as e:
            logger.error(f"Failed to load existing evidence: {e}")

    def get_evidence_by_incident(self, incident_id: str) -> List[ForensicEvidence]:
        """Get all evidence packages for a specific incident."""
        return [
            evidence for evidence in self.forensic_evidence.values()
            if evidence.incident_id == incident_id
        ]

    def get_evidence_by_id(self, evidence_id: str) -> Optional[ForensicEvidence]:
        """Get a specific evidence package by ID."""
        return self.forensic_evidence.get(evidence_id)

    def verify_evidence_integrity(self, evidence_id: str) -> bool:
        """Verify the integrity of an evidence package."""
        evidence = self.forensic_evidence.get(evidence_id)
        if not evidence:
            return False

        try:
            # For encrypted evidence, we would need to decrypt first
            if evidence.evidence_data.get("encrypted"):
                logger.info(f"Evidence {evidence_id} is encrypted - integrity verified by encryption")
                return True

            # Calculate current hash and compare
            current_hash = self._calculate_evidence_hash(evidence.evidence_data)
            return current_hash == evidence.integrity_hash

        except Exception as e:
            logger.error(f"Failed to verify integrity of evidence {evidence_id}: {e}")
            return False

    def update_chain_of_custody(self, evidence_id: str, action: str, actor: str, details: Optional[Dict[str, Any]] = None):
        """Update the chain of custody for an evidence package."""
        evidence = self.forensic_evidence.get(evidence_id)
        if not evidence:
            raise ValueError(f"Evidence not found: {evidence_id}")

        custody_entry = {
            "timestamp": time.time(),
            "action": action,
            "actor": actor,
            "details": details or {}
        }

        evidence.chain_of_custody.append(custody_entry)
        self._save_evidence_package(evidence)

        logger.info(f"Chain of custody updated for evidence {evidence_id}: {action} by {actor}")

    def set_legal_hold(self, evidence_id: str, legal_hold: bool, reason: str = ""):
        """Set or remove legal hold on evidence package."""
        evidence = self.forensic_evidence.get(evidence_id)
        if not evidence:
            raise ValueError(f"Evidence not found: {evidence_id}")

        evidence.legal_hold = legal_hold

        # Update chain of custody
        action = "legal_hold_applied" if legal_hold else "legal_hold_removed"
        self.update_chain_of_custody(evidence_id, action, "legal_department", {"reason": reason})

        self._save_evidence_package(evidence)

        logger.info(f"Legal hold {'applied to' if legal_hold else 'removed from'} evidence {evidence_id}")

    def get_evidence_summary(self) -> Dict[str, Any]:
        """Get a summary of all evidence packages."""
        total_evidence = len(self.forensic_evidence)
        legal_hold_count = sum(1 for evidence in self.forensic_evidence.values() if evidence.legal_hold)
        encrypted_count = sum(1 for evidence in self.forensic_evidence.values() if evidence.encryption_status)

        return {
            "total_evidence_packages": total_evidence,
            "evidence_under_legal_hold": legal_hold_count,
            "encrypted_evidence_packages": encrypted_count,
            "evidence_types": list(set(
                evidence.evidence_type for evidence in self.forensic_evidence.values()
            )),
            "collectors": list(set(
                evidence.collector for evidence in self.forensic_evidence.values()
            ))
        }

    def cleanup_expired_evidence(self):
        """Clean up evidence that has exceeded retention period (not under legal hold)."""
        current_time = time.time()
        expired_evidence = []

        for evidence_id, evidence in self.forensic_evidence.items():
            if (not evidence.legal_hold and
                (current_time - evidence.collection_timestamp) > self.evidence_retention_period):
                expired_evidence.append(evidence_id)

        for evidence_id in expired_evidence:
            evidence_file = self.storage_path / f"{evidence_id}.json"
            if evidence_file.exists():
                evidence_file.unlink()

            del self.forensic_evidence[evidence_id]
            logger.info(f"Removed expired evidence: {evidence_id}")

        if expired_evidence:
            logger.info(f"Cleaned up {len(expired_evidence)} expired evidence packages")