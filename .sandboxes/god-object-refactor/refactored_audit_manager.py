from lib.shared.utilities import path_exists
"""
Refactored DFARS Audit Trail Manager - Breaking God Object
Original: 34 methods in 1 class, 872 lines
Refactored: Multiple focused classes with Single Responsibility
"""

import hashlib
import json
import time
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List, Optional
from dataclasses import dataclass, asdict
import threading
from queue import Queue


# ============================================================================
# 1. AUDIT ENTRY - Data structure for audit records
# ============================================================================

@dataclass
class AuditEntry:
    """Represents a single audit entry."""
    timestamp: str
    event_type: str
    user: str
    action: str
    resource: str
    result: str
    metadata: Dict[str, Any]
    hash: Optional[str] = None

    def calculate_hash(self) -> str:
        """Calculate cryptographic hash of entry."""
        data = f"{self.timestamp}{self.event_type}{self.user}{self.action}{self.resource}{self.result}"
        return hashlib.sha256(data.encode()).hexdigest()

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return asdict(self)

    def to_json(self) -> str:
        """Convert to JSON string."""
        return json.dumps(self.to_dict())


# ============================================================================
# 2. INTEGRITY MANAGER - Handles cryptographic integrity
# ============================================================================

class IntegrityManager:
    """Manages cryptographic integrity - Single Responsibility: Integrity"""

    def __init__(self, key_path: Optional[str] = None):
        """Initialize integrity manager."""
        self.key_path = key_path
        self.integrity_key = self._initialize_key()
        self.hash_chain = []

    def _initialize_key(self) -> str:
        """Initialize or load integrity key."""
        if self.key_path and path_exists(self.key_path):
            with open(self.key_path, 'r') as f:
                return f.read().strip()
        else:
            # Generate new key
            return hashlib.sha256(str(time.time()).encode()).hexdigest()

    def calculate_entry_hash(self, entry: AuditEntry) -> str:
        """Calculate hash for audit entry."""
        return entry.calculate_hash()

    def calculate_chain_hash(self, entries: List[AuditEntry]) -> str:
        """Calculate hash for entire chain."""
        chain_data = "".join([e.hash or e.calculate_hash() for e in entries])
        return hashlib.sha256(chain_data.encode()).hexdigest()

    def verify_entry(self, entry: AuditEntry) -> bool:
        """Verify entry integrity."""
        if not entry.hash:
            return False
        calculated = entry.calculate_hash()
        return calculated == entry.hash

    def verify_chain(self, entries: List[AuditEntry]) -> bool:
        """Verify chain integrity."""
        for entry in entries:
            if not self.verify_entry(entry):
                return False
        return True

    def sign_entry(self, entry: AuditEntry) -> str:
        """Sign an entry with integrity key."""
        data = entry.to_json() + self.integrity_key
        return hashlib.sha256(data.encode()).hexdigest()


# ============================================================================
# 3. STORAGE MANAGER - Handles persistence
# ============================================================================

class AuditStorageManager:
    """Manages audit storage - Single Responsibility: Storage"""

    def __init__(self, storage_path: str = ".audit"):
        """Initialize storage manager."""
        self.storage_path = Path(storage_path)
        self.storage_path.mkdir(exist_ok=True)
        self.current_file = None
        self.rotation_size = 10_000_000  # 10MB

    def save_entry(self, entry: AuditEntry):
        """Save single audit entry."""
        file_path = self._get_current_file()
        with open(file_path, 'a') as f:
            f.write(entry.to_json() + '\n')

        # Check for rotation
        if file_path.stat().st_size > self.rotation_size:
            self._rotate_file()

    def save_batch(self, entries: List[AuditEntry]):
        """Save batch of entries."""
        for entry in entries:
            self.save_entry(entry)

    def load_entries(self, start_date: Optional[str] = None,
                    end_date: Optional[str] = None) -> List[AuditEntry]:
        """Load entries within date range."""
        entries = []

        for file_path in self.storage_path.glob("audit_*.json"):
            with open(file_path, 'r') as f:
                for line in f:
                    try:
                        data = json.loads(line.strip())
                        entry = AuditEntry(**data)

                        # Filter by date if specified
                        if start_date and entry.timestamp < start_date:
                            continue
                        if end_date and entry.timestamp > end_date:
                            continue

                        entries.append(entry)
                    except:
                        continue

        return entries

    def _get_current_file(self) -> Path:
        """Get current audit file."""
        if not self.current_file:
            date_str = datetime.now().strftime("%Y%m%d")
            self.current_file = self.storage_path / f"audit_{date_str}.json"
        return self.current_file

    def _rotate_file(self):
        """Rotate to new file."""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        new_name = self.storage_path / f"audit_{timestamp}.json"
        if self.current_file and self.current_file.exists():
            self.current_file.rename(new_name)
        self.current_file = None

    def get_storage_size(self) -> int:
        """Get total storage size."""
        total = 0
        for file_path in self.storage_path.glob("audit_*.json"):
            total += file_path.stat().st_size
        return total

    def cleanup_old_files(self, days: int = 2555):  # DFARS 7 years
        """Remove files older than specified days."""
        cutoff = time.time() - (days * 86400)
        for file_path in self.storage_path.glob("audit_*.json"):
            if file_path.stat().st_mtime < cutoff:
                file_path.unlink()


# ============================================================================
# 4. PROCESSOR - Handles audit event processing
# ============================================================================

class AuditEventProcessor:
    """Processes audit events - Single Responsibility: Event Processing"""

    def __init__(self):
        """Initialize processor."""
        self.queue = Queue()
        self.processors = {}
        self.filters = []
        self.running = False
        self.thread = None

    def register_processor(self, event_type: str, processor_func):
        """Register event processor."""
        self.processors[event_type] = processor_func

    def add_filter(self, filter_func):
        """Add event filter."""
        self.filters.append(filter_func)

    def process_event(self, entry: AuditEntry) -> AuditEntry:
        """Process single event."""
        # Apply filters
        for filter_func in self.filters:
            if not filter_func(entry):
                return None

        # Apply processor
        if entry.event_type in self.processors:
            processor = self.processors[entry.event_type]
            entry = processor(entry)

        return entry

    def queue_event(self, entry: AuditEntry):
        """Queue event for processing."""
        self.queue.put(entry)

    def start(self):
        """Start processor thread."""
        if not self.running:
            self.running = True
            self.thread = threading.Thread(target=self._process_loop)
            self.thread.daemon = True
            self.thread.start()

    def stop(self):
        """Stop processor thread."""
        self.running = False
        if self.thread:
            self.thread.join(timeout=5)

    def _process_loop(self):
        """Main processing loop."""
        while self.running:
            try:
                entry = self.queue.get(timeout=1)
                self.process_event(entry)
            except:
                continue


# ============================================================================
# 5. COMPLIANCE VALIDATOR - Validates DFARS compliance
# ============================================================================

class DFARSComplianceValidator:
    """Validates DFARS compliance - Single Responsibility: Compliance"""

    def __init__(self):
        """Initialize validator."""
        self.requirements = self._load_requirements()
        self.validation_results = {}

    def _load_requirements(self) -> Dict[str, Any]:
        """Load DFARS requirements."""
        return {
            'retention_days': 2555,  # 7 years
            'encryption_required': True,
            'integrity_verification': True,
            'access_control': True,
            'audit_fields': [
                'timestamp', 'user', 'action',
                'resource', 'result', 'hash'
            ]
        }

    def validate_entry(self, entry: AuditEntry) -> bool:
        """Validate single entry."""
        # Check required fields
        for field in self.requirements['audit_fields']:
            if not hasattr(entry, field) or getattr(entry, field) is None:
                return False

        # Check hash integrity
        if self.requirements['integrity_verification']:
            if not entry.hash or entry.hash != entry.calculate_hash():
                return False

        return True

    def validate_storage(self, storage_manager: AuditStorageManager) -> Dict[str, Any]:
        """Validate storage compliance."""
        results = {
            'compliant': True,
            'issues': []
        }

        # Check retention
        entries = storage_manager.load_entries()
        if entries:
            oldest = min(entries, key=lambda e: e.timestamp)
            age_days = (time.time() - datetime.fromisoformat(oldest.timestamp).timestamp()) / 86400

            if age_days > self.requirements['retention_days']:
                results['compliant'] = False
                results['issues'].append('Retention period exceeded')

        return results

    def generate_compliance_report(self) -> Dict[str, Any]:
        """Generate compliance report."""
        return {
            'timestamp': datetime.now().isoformat(),
            'requirements': self.requirements,
            'validation_results': self.validation_results,
            'compliant': all(r.get('compliant', False)
                           for r in self.validation_results.values())
        }


# ============================================================================
# 6. AUDIT MANAGER - Main orchestrator
# ============================================================================

class RefactoredAuditManager:
    """Main audit manager - Single Responsibility: Orchestration"""

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """Initialize with component managers."""
        config = config or {}

        # Initialize components
        self.integrity = IntegrityManager(config.get('key_path'))
        self.storage = AuditStorageManager(config.get('storage_path', '.audit'))
        self.processor = AuditEventProcessor()
        self.validator = DFARSComplianceValidator()

        # Start processor
        self.processor.start()

    def log_event(self, event_type: str, user: str, action: str,
                  resource: str, result: str, metadata: Optional[Dict] = None):
        """Log an audit event."""
        entry = AuditEntry(
            timestamp=datetime.now().isoformat(),
            event_type=event_type,
            user=user,
            action=action,
            resource=resource,
            result=result,
            metadata=metadata or {}
        )

        # Calculate hash
        entry.hash = entry.calculate_hash()

        # Validate
        if not self.validator.validate_entry(entry):
            raise ValueError("Entry validation failed")

        # Process
        entry = self.processor.process_event(entry)

        # Store
        if entry:
            self.storage.save_entry(entry)

        return entry

    def query_events(self, start_date: Optional[str] = None,
                    end_date: Optional[str] = None) -> List[AuditEntry]:
        """Query audit events."""
        return self.storage.load_entries(start_date, end_date)

    def verify_integrity(self) -> bool:
        """Verify audit trail integrity."""
        entries = self.storage.load_entries()
        return self.integrity.verify_chain(entries)

    def get_compliance_status(self) -> Dict[str, Any]:
        """Get compliance status."""
        return self.validator.generate_compliance_report()

    def shutdown(self):
        """Shutdown manager."""
        self.processor.stop()


# ============================================================================
# USAGE EXAMPLE
# ============================================================================

def create_audit_manager(config: Optional[Dict[str, Any]] = None) -> RefactoredAuditManager:
    """Factory function to create audit manager."""
    return RefactoredAuditManager(config)