"""
Audit Integrity Manager - Handles hash chains, signatures, and integrity verification
Part of the refactored Enhanced DFARS Audit Trail Manager
"""

from typing import List, Dict, Any, Optional
import hashlib
import time

from dataclasses import dataclass
from enum import Enum
import hmac

from .audit_event_manager import AuditEvent

class IntegrityStatus(Enum):
    """Chain integrity status."""
    VALID = "valid"
    INVALID = "invalid"
    UNVERIFIED = "unverified"
    CORRUPTED = "corrupted"

@dataclass
class AuditChain:
    """Audit event chain for integrity protection."""
    chain_id: str
    sequence_number: int
    start_time: float
    end_time: Optional[float]
    event_count: int
    first_event_hash: str
    last_event_hash: str
    chain_hash: str
    integrity_key_id: str
    signature: Optional[str]
    status: IntegrityStatus

class AuditIntegrityManager:
    """Manages audit trail integrity through hash chains and signatures."""

    def __init__(self, integrity_key: Optional[bytes] = None):
        """Initialize integrity manager."""
        self.integrity_key = integrity_key or self._generate_integrity_key()
        self.current_chain_hash = None
        self.chain_sequence = 0

    def _generate_integrity_key(self) -> bytes:
        """Generate a new integrity key."""
        import os
        return os.urandom(32)

    def start_new_chain(self) -> AuditChain:
        """Start a new audit chain."""
        import uuid

        self.chain_sequence += 1
        chain_id = f"chain_{uuid.uuid4().hex[:12]}_{self.chain_sequence:06d}"

        chain = AuditChain(
            chain_id=chain_id,
            sequence_number=self.chain_sequence,
            start_time=time.time(),
            end_time=None,
            event_count=0,
            first_event_hash="",
            last_event_hash="",
            chain_hash="",
            integrity_key_id=hashlib.sha256(self.integrity_key).hexdigest()[:16],
            signature=None,
            status=IntegrityStatus.UNVERIFIED
        )

        self.current_chain_hash = self._calculate_initial_chain_hash(chain)
        chain.chain_hash = self.current_chain_hash

        return chain

    def process_event_integrity(self, event: AuditEvent, chain: AuditChain) -> AuditEvent:
        """Process event through integrity system."""

        # Link to previous event in chain
        if chain.event_count == 0:
            event.chain_hash = chain.chain_hash
            chain.first_event_hash = event.content_hash
        else:
            event.chain_hash = self._update_chain_hash(
                self.current_chain_hash,
                event.content_hash
            )
            self.current_chain_hash = event.chain_hash

        # Sign the event
        event.signature = self._calculate_event_signature(event)

        # Update chain
        chain.event_count += 1
        chain.last_event_hash = event.content_hash
        chain.chain_hash = event.chain_hash

        return event

    def finalize_chain(self, chain: AuditChain) -> AuditChain:
        """Finalize a chain when rotating."""
        chain.end_time = time.time()
        chain.signature = self._calculate_chain_signature(chain)
        chain.status = IntegrityStatus.VALID
        return chain

    def verify_event_integrity(self, event: AuditEvent) -> bool:
        """Verify integrity of a single event."""
        # Verify signature
        expected_signature = self._calculate_event_signature(event)
        return event.signature == expected_signature

    def verify_chain_integrity(self, events: List[AuditEvent]) -> Dict[str, Any]:
        """Verify integrity of an entire chain of events."""
        if not events:
            return {
                "valid": False,
                "reason": "No events in chain",
                "events_verified": 0
            }

        valid_count = 0
        invalid_events = []
        chain_valid = True
        previous_chain_hash = None

        for i, event in enumerate(events):
            # Verify individual event
            if not self.verify_event_integrity(event):
                invalid_events.append(event.event_id)
                chain_valid = False
            else:
                valid_count += 1

            # Verify chain continuity
            if i > 0 and previous_chain_hash:
                expected_hash = self._update_chain_hash(
                    previous_chain_hash,
                    event.content_hash
                )
                if event.chain_hash != expected_hash:
                    chain_valid = False
                    invalid_events.append(f"chain_break_at_{event.event_id}")

            previous_chain_hash = event.chain_hash

        return {
            "valid": chain_valid,
            "events_verified": len(events),
            "valid_events": valid_count,
            "invalid_events": invalid_events,
            "chain_continuity": len(invalid_events) == 0
        }

    def _calculate_initial_chain_hash(self, chain: AuditChain) -> str:
        """Calculate initial hash for a new chain."""
        content = f"{chain.chain_id}|{chain.sequence_number}|{chain.start_time}"
        return hashlib.sha256(content.encode()).hexdigest()

    def _update_chain_hash(self, previous_hash: str, event_hash: str) -> str:
        """Update chain hash with new event."""
        combined = f"{previous_hash}|{event_hash}"
        return hashlib.sha256(combined.encode()).hexdigest()

    def _calculate_event_signature(self, event: AuditEvent) -> str:
        """Calculate HMAC signature for an event."""
        signature_content = f"{event.event_id}|{event.content_hash}|{event.chain_hash or ''}"
        return hmac.new(
            self.integrity_key,
            signature_content.encode(),
            hashlib.sha256
        ).hexdigest()

    def _calculate_chain_signature(self, chain: AuditChain) -> str:
        """Calculate signature for entire chain."""
        chain_content = (
            f"{chain.chain_id}|{chain.sequence_number}|"
            f"{chain.start_time}|{chain.end_time}|{chain.event_count}|"
            f"{chain.first_event_hash}|{chain.last_event_hash}|{chain.chain_hash}"
        )
        return hmac.new(
            self.integrity_key,
            chain_content.encode(),
            hashlib.sha256
        ).hexdigest()

    def detect_tampering(self, events: List[AuditEvent]) -> List[str]:
        """Detect potential tampering in event sequence."""
        tampering_indicators = []

        # Check for time anomalies
        for i in range(1, len(events)):
            if events[i].timestamp < events[i-1].timestamp:
                tampering_indicators.append(
                    f"time_reversal_{events[i].event_id}"
                )

        # Check for hash chain breaks
        verification = self.verify_chain_integrity(events)
        if not verification['chain_continuity']:
            tampering_indicators.extend(verification['invalid_events'])

        # Check for duplicate event IDs
        event_ids = [e.event_id for e in events]
        if len(event_ids) != len(set(event_ids)):
            tampering_indicators.append("duplicate_event_ids")

        return tampering_indicators

    def get_integrity_report(self, chains: List[AuditChain]) -> Dict[str, Any]:
        """Generate integrity report for multiple chains."""
        valid_chains = sum(1 for c in chains if c.status == IntegrityStatus.VALID)
        total_events = sum(c.event_count for c in chains)

        return {
            "total_chains": len(chains),
            "valid_chains": valid_chains,
            "invalid_chains": len(chains) - valid_chains,
            "total_events": total_events,
            "integrity_key_id": hashlib.sha256(self.integrity_key).hexdigest()[:16],
            "oldest_chain": min((c.start_time for c in chains), default=None),
            "newest_chain": max((c.end_time or c.start_time for c in chains), default=None)
        }