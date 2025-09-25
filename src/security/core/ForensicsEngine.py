"""
ForensicsEngine - Extracted from EnhancedIncidentResponseSystem
Handles forensic analysis and evidence collection
Part of god object decomposition (Day 3-5)
"""

from collections import defaultdict
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Any, Set
import hashlib
import json
import logging

from dataclasses import dataclass, field

logger = logging.getLogger(__name__)

@dataclass
class ForensicEvidence:
    """Represents collected forensic evidence."""
    evidence_id: str
    incident_id: str
    evidence_type: str
    source: str
    timestamp: datetime
    hash_value: str
    data: Any
    chain_of_custody: List[Dict[str, str]] = field(default_factory=list)
    integrity_verified: bool = True

@dataclass
class AuditTrail:
    """Represents an audit trail entry."""
    trail_id: str
    action: str
    actor: str
    target: str
    timestamp: datetime
    result: str
    metadata: Dict[str, Any] = field(default_factory=dict)

class ForensicsEngine:
    """
    Handles forensic analysis and evidence collection.

    Extracted from EnhancedIncidentResponseSystem (1, 226 LOC -> ~200 LOC component).
    Handles:
    - Evidence collection and preservation
    - Audit trail generation
    - Forensic timeline reconstruction
    - Chain of custody management
    - Evidence integrity verification
    """

    def __init__(self):
        """Initialize the forensics engine."""
        self.evidence_store: Dict[str, ForensicEvidence] = {}
        self.audit_trails: List[AuditTrail] = []
        self.forensic_timelines: Dict[str, List[Dict[str, Any]]] = {}
        self.evidence_index: Dict[str, List[str]] = defaultdict(list)

        # Forensics configuration
        self.hash_algorithm = "sha256"
        self.evidence_retention_days = 365
        self.max_evidence_size_mb = 100

    def collect_evidence(self,
                        incident_id: str,
                        evidence_type: str,
                        source: str,
                        data: Any) -> ForensicEvidence:
        """Collect and preserve forensic evidence."""
        # Generate evidence ID
        evidence_id = self._generate_evidence_id()

        # Calculate hash for integrity
        hash_value = self._calculate_hash(data)

        # Create evidence record
        evidence = ForensicEvidence(
            evidence_id=evidence_id,
            incident_id=incident_id,
            evidence_type=evidence_type,
            source=source,
            timestamp=datetime.now(),
            hash_value=hash_value,
            data=data
        )

        # Add initial custody entry
        evidence.chain_of_custody.append({
            "action": "collected",
            "actor": "system",
            "timestamp": datetime.now().isoformat(),
            "location": source
        })

        # Store evidence
        self.evidence_store[evidence_id] = evidence

        # Update index
        self.evidence_index[incident_id].append(evidence_id)

        # Log collection in audit trail
        self._log_audit_trail(
            action="evidence_collected",
            actor="forensics_engine",
            target=evidence_id,
            result="success",
            metadata={"type": evidence_type, "source": source}
        )

        return evidence

    def _generate_evidence_id(self) -> str:
        """Generate unique evidence ID."""
        import uuid
        return f"EVD-{datetime.now().strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:8]}"

    def _calculate_hash(self, data: Any) -> str:
        """Calculate hash of evidence data."""
        if isinstance(data, str):
            data_bytes = data.encode('utf-8')
        elif isinstance(data, bytes):
            data_bytes = data
        else:
            data_bytes = json.dumps(data, sort_keys=True).encode('utf-8')

        # Always use secure SHA-256 hash for security purposes
        return hashlib.sha256(data_bytes).hexdigest()

    def _log_audit_trail(self,
                        action: str,
                        actor: str,
                        target: str,
                        result: str,
                        metadata: Optional[Dict[str, Any]] = None) -> None:
        """Log action to audit trail."""
        trail = AuditTrail(
            trail_id=f"AUDIT-{len(self.audit_trails)+1:06d}",
            action=action,
            actor=actor,
            target=target,
            timestamp=datetime.now(),
            result=result,
            metadata=metadata or {}
        )
        self.audit_trails.append(trail)

    def build_forensic_timeline(self,
                                incident_id: str) -> List[Dict[str, Any]]:
        """Build forensic timeline for incident."""
        timeline = []

        # Collect evidence entries
        evidence_ids = self.evidence_index.get(incident_id, [])
        for evidence_id in evidence_ids:
            evidence = self.evidence_store.get(evidence_id)
            if evidence:
                timeline.append({
                    "timestamp": evidence.timestamp.isoformat(),
                    "event_type": "evidence",
                    "description": f"{evidence.evidence_type} from {evidence.source}",
                    "evidence_id": evidence_id
                })

        # Add audit trail entries
        for trail in self.audit_trails:
            if incident_id in trail.target or incident_id in str(trail.metadata):
                timeline.append({
                    "timestamp": trail.timestamp.isoformat(),
                    "event_type": "audit",
                    "description": f"{trail.action} by {trail.actor}",
                    "trail_id": trail.trail_id
                })

        # Sort timeline chronologically
        timeline.sort(key=lambda x: x["timestamp"])

        # Store timeline
        self.forensic_timelines[incident_id] = timeline

        return timeline

    def verify_evidence_integrity(self,
                                evidence_id: str) -> Tuple[bool, str]:
        """Verify integrity of stored evidence."""
        evidence = self.evidence_store.get(evidence_id)
        if not evidence:
            return False, "Evidence not found"

        # Recalculate hash
        current_hash = self._calculate_hash(evidence.data)

        # Compare with stored hash
        if current_hash == evidence.hash_value:
            evidence.integrity_verified = True
            return True, "Integrity verified"
        else:
            evidence.integrity_verified = False
            self._log_audit_trail(
                action="integrity_check_failed",
                actor="forensics_engine",
                target=evidence_id,
                result="failed",
                metadata={"expected": evidence.hash_value, "actual": current_hash}
            )
            return False, "Integrity check failed - evidence may be tampered"

    def update_chain_of_custody(self,
                                evidence_id: str,
                                action: str,
                                actor: str) -> None:
        """Update chain of custody for evidence."""
        evidence = self.evidence_store.get(evidence_id)
        if evidence:
            custody_entry = {
                "action": action,
                "actor": actor,
                "timestamp": datetime.now().isoformat(),
                "previous_hash": evidence.hash_value
            }
            evidence.chain_of_custody.append(custody_entry)

            # Log to audit trail
            self._log_audit_trail(
                action=f"custody_update_{action}",
                actor=actor,
                target=evidence_id,
                result="success",
                metadata=custody_entry
            )

    def export_evidence_package(self,
                                incident_id: str) -> Dict[str, Any]:
        """Export complete evidence package for incident."""
        evidence_ids = self.evidence_index.get(incident_id, [])

        evidence_package = {
            "incident_id": incident_id,
            "export_timestamp": datetime.now().isoformat(),
            "evidence_count": len(evidence_ids),
            "evidence_items": [],
            "timeline": self.forensic_timelines.get(incident_id, []),
            "audit_trails": []
        }

        # Include all evidence
        for evidence_id in evidence_ids:
            evidence = self.evidence_store.get(evidence_id)
            if evidence:
                # Verify integrity before export
                integrity_ok, _ = self.verify_evidence_integrity(evidence_id)

                evidence_package["evidence_items"].append({
                    "evidence_id": evidence_id,
                    "type": evidence.evidence_type,
                    "source": evidence.source,
                    "timestamp": evidence.timestamp.isoformat(),
                    "hash": evidence.hash_value,
                    "integrity_verified": integrity_ok,
                    "chain_of_custody": evidence.chain_of_custody
                })

        # Include relevant audit trails
        for trail in self.audit_trails:
            if incident_id in trail.target or incident_id in str(trail.metadata):
                evidence_package["audit_trails"].append({
                    "trail_id": trail.trail_id,
                    "action": trail.action,
                    "actor": trail.actor,
                    "timestamp": trail.timestamp.isoformat(),
                    "result": trail.result
                })

        return evidence_package

    def get_forensics_metrics(self) -> Dict[str, Any]:
        """Get forensics engine metrics."""
        total_evidence = len(self.evidence_store)
        verified_evidence = sum(
            1 for e in self.evidence_store.values()
            if e.integrity_verified
        )

        return {
            "total_evidence_collected": total_evidence,
            "evidence_integrity_verified": verified_evidence,
            "audit_trail_entries": len(self.audit_trails),
            "forensic_timelines": len(self.forensic_timelines),
            "active_incidents": len(self.evidence_index),
            "hash_algorithm": self.hash_algorithm,
            "retention_days": self.evidence_retention_days
        }