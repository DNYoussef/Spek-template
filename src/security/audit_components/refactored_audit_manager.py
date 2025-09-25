from src.constants.base import MAXIMUM_NESTED_DEPTH

import time
import threading
from queue import Queue
from typing import Dict, Any, Optional, List
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor

from .audit_event_manager import AuditEventManager, AuditEvent, AuditEventType, SeverityLevel
from .audit_storage_manager import AuditStorageManager
from .audit_integrity_manager import AuditIntegrityManager, AuditChain

class RefactoredDFARSAuditManager:
    """
    Refactored DFARS audit trail manager using composition pattern.
    Replaces 34-method God Object with focused components.
    """

    BACKUP_INTERVAL = 86400  # 24 hours
    INTEGRITY_CHECK_INTERVAL = 3600  # 1 hour

def __init__(self, storage_path: str = ".claude/.artifacts/enhanced_audit"):
        """Initialize refactored audit manager with specialized components."""

        # Specialized component managers
        self.event_manager = AuditEventManager()
        self.storage_manager = AuditStorageManager(storage_path)
        self.integrity_manager = AuditIntegrityManager()

        # Processing infrastructure
        self.audit_buffer = Queue(maxsize=10000)
        self.current_chain: Optional[AuditChain] = None
        self.chain_history: List[AuditChain] = []

        # Background processing
        self.processor_active = False
        self.processor_thread: Optional[threading.Thread] = None
        self.executor = ThreadPoolExecutor(max_workers=2)

        # Performance metrics
        self.metrics = {
            "events_logged": 0,
            "events_processed": 0,
            "chains_created": 0,
            "integrity_checks": 0,
            "backups_created": 0
        }

        # Initialize first chain
        self._start_new_chain()

        # Start background processor
        self.start_processor()

def log_audit_event(self,
                        event_type: AuditEventType,
                        severity: SeverityLevel,
                        user_id: str,
                        source_ip: str,
                        component: str,
                        action: str,
                        outcome: str,
                        details: Optional[Dict[str, Any]] = None,
                        metadata: Optional[Dict[str, Any]] = None) -> str:
        """Log an audit event - main public interface."""

        # Create event using event manager
        event = self.event_manager.create_event(
            event_type=event_type,
            severity=severity,
            user_id=user_id,
            source_ip=source_ip,
            component=component,
            action=action,
            outcome=outcome,
            details=details,
            metadata=metadata
        )

        # Queue for processing
        try:
            self.audit_buffer.put(event, timeout=1.0)
            self.metrics["events_logged"] += 1
            return event.event_id
        except:
            # Emergency direct write if queue is full
            self._process_single_event(event)
            return event.event_id

def start_processor(self):
        """Start background audit processor."""
        if not self.processor_active:
            self.processor_active = True
            self.processor_thread = threading.Thread(
                target=self._processor_loop,
                daemon=True
            )
            self.processor_thread.start()

def stop_processor(self):
        """Stop background processor gracefully."""
        self.processor_active = False
        if self.processor_thread:
            self.processor_thread.join(timeout=MAXIMUM_NESTED_DEPTH)

        # Process remaining events
        self._process_remaining_events()

        # Finalize current chain
        if self.current_chain:
            self.current_chain = self.integrity_manager.finalize_chain(self.current_chain)
            self.chain_history.append(self.current_chain)

def _processor_loop(self):
        """Background processor loop."""
        last_maintenance = time.time()

        while self.processor_active:
            try:
                # Batch process events
                events = []
                deadline = time.time() + 0.1  # 100ms batch window

                while time.time() < deadline and len(events) < 100:
                    try:
                        event = self.audit_buffer.get(timeout=0.1)
                        events.append(event)
                    except:
                        break

                if events:
                    self._process_events_batch(events)

                # Periodic maintenance
                if time.time() - last_maintenance > self.INTEGRITY_CHECK_INTERVAL:
                    self._perform_maintenance()
                    last_maintenance = time.time()

            except Exception as e:
                # Log error but continue
                print(f"Processor error: {e}")

def _process_events_batch(self, events: List[AuditEvent]):
        """Process a batch of events."""
        for event in events:
            self._process_single_event(event)

def _process_single_event(self, event: AuditEvent):
        """Process single event through the pipeline."""

        # Apply integrity protection
        event = self.integrity_manager.process_event_integrity(event, self.current_chain)

        # Write to storage
        self.storage_manager.write_event(event, self.current_chain.chain_id)

        self.metrics["events_processed"] += 1

        # Check if chain rotation needed
        if self.current_chain.event_count >= 10000:
            self._rotate_chain()

def _start_new_chain(self):
        """Start a new audit chain."""
        self.current_chain = self.integrity_manager.start_new_chain()
        self.metrics["chains_created"] += 1

def _rotate_chain(self):
        """Rotate to a new chain."""
        if self.current_chain:
            # Finalize current chain
            self.current_chain = self.integrity_manager.finalize_chain(self.current_chain)
            self.chain_history.append(self.current_chain)

        # Start new chain
        self._start_new_chain()

def _perform_maintenance(self):
        """Perform periodic maintenance tasks."""
        # Cleanup old files
        self.storage_manager.cleanup_old_files()

        # Check if backup needed
        if self._should_backup():
            self._backup_audit_logs()

        self.metrics["integrity_checks"] += 1

def _should_backup(self) -> bool:
        """Check if backup is needed."""
        return (time.time() - self.storage_manager.last_backup_time) > self.BACKUP_INTERVAL

def _backup_audit_logs(self):
        """Create backup of audit logs."""
        backup_path = str(Path(self.storage_manager.storage_path) / "backups")
        self.storage_manager.backup_audit_logs(backup_path)
        self.metrics["backups_created"] += 1

def _process_remaining_events(self):
        """Process any remaining events in buffer."""
        remaining = []
        while not self.audit_buffer.empty():
            try:
                remaining.append(self.audit_buffer.get_nowait())
            except:
                break

        if remaining:
            self._process_events_batch(remaining)

    # Convenience methods delegating to specialized components

def log_user_authentication(self, user_id: str, success: bool,
                                source_ip: str, method: str = "password",
                                details: Optional[Dict] = None) -> str:
        """Log user authentication event."""
        event = self.event_manager.log_user_authentication(
            user_id, success, source_ip, method, details
        )
        self.audit_buffer.put(event)
        return event.event_id

def log_data_access(self, user_id: str, resource: str, action: str,
                        source_ip: str, outcome: str = "success") -> str:
        """Log data access event."""
        event = self.event_manager.log_data_access(
            user_id, resource, action, source_ip, outcome
        )
        self.audit_buffer.put(event)
        return event.event_id

def log_configuration_change(self, change_type: str, component: str,
                                user_id: str, old_value: Any, new_value: Any) -> str:
        """Log configuration change."""
        event = self.event_manager.log_configuration_change(
            change_type, component, user_id, old_value, new_value
        )
        self.audit_buffer.put(event)
        return event.event_id

def get_audit_statistics(self) -> Dict[str, Any]:
        """Get comprehensive audit statistics."""
        storage_stats = self.storage_manager.get_storage_statistics()
        integrity_report = self.integrity_manager.get_integrity_report(self.chain_history)

        return {
            "processing": self.metrics,
            "storage": storage_stats,
            "integrity": integrity_report,
            "current_chain": {
                "chain_id": self.current_chain.chain_id if self.current_chain else None,
                "events": self.current_chain.event_count if self.current_chain else 0
            },
            "buffer_size": self.audit_buffer.qsize()
        }

def search_audit_events(self, start_time: Optional[float] = None,
                            end_time: Optional[float] = None,
                            limit: int = 1000) -> List[Dict[str, Any]]:
        """Search audit events within time range."""
        return self.storage_manager.read_events(start_time, end_time, limit)

def verify_audit_trail_integrity(self, start_time: Optional[float] = None,
                                    end_time: Optional[float] = None) -> Dict[str, Any]:
        """Verify integrity of audit trail."""
        events_data = self.storage_manager.read_events(start_time, end_time, limit=100000)

        # Convert to event objects for verification
        events = []
        for event_data in events_data:
            event = AuditEvent(
                event_id=event_data['event_id'],
                timestamp=event_data['timestamp'],
                event_type=AuditEventType(event_data['event_type']),
                severity=SeverityLevel(event_data['severity']),
                user_id=event_data['user_id'],
                source_ip=event_data['source_ip'],
                component=event_data['component'],
                action=event_data['action'],
                outcome=event_data['outcome'],
                details=event_data['details'],
                metadata=event_data['metadata'],
                content_hash=event_data['content_hash'],
                chain_hash=event_data.get('chain_hash'),
                signature=event_data.get('signature')
            )
            events.append(event)

        return self.integrity_manager.verify_chain_integrity(events)

# Factory function for compatibility
def create_refactored_audit_manager(storage_path: str = ".claude/.artifacts/enhanced_audit") -> RefactoredDFARSAuditManager:
    """Create a refactored audit manager instance."""
    return RefactoredDFARSAuditManager(storage_path)