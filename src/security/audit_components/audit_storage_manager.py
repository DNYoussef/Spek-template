"""
Audit Storage Manager - Handles storage, encryption, and retrieval of audit events
Part of the refactored Enhanced DFARS Audit Trail Manager
"""

from datetime import datetime, timedelta
from pathlib import Path
from typing import List, Dict, Any, Optional
import hashlib
import json
import time

from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2
import gzip

from .audit_event_manager import AuditEvent

class AuditStorageManager:
    """Manages storage, encryption, and retrieval of audit events."""

    DFARS_RETENTION_DAYS = 2555  # 7 years
    MAX_EVENTS_PER_FILE = 10000

    def __init__(self, storage_path: str = ".claude/.artifacts/enhanced_audit"):
        """Initialize audit storage manager."""
        self.storage_path = Path(storage_path)
        self.storage_path.mkdir(parents=True, exist_ok=True)

        self.compression_enabled = True
        self.encryption_enabled = True
        self.encryption_key = self._initialize_encryption_key()

        # Storage metrics
        self.files_written = 0
        self.total_bytes_written = 0
        self.last_backup_time = time.time()

    def _initialize_encryption_key(self) -> bytes:
        """Initialize or load encryption key for audit data."""
        key_file = self.storage_path / ".audit_key"

        if key_file.exists():
            with open(key_file, 'rb') as f:
                return f.read()

        # Generate new key
        key = Fernet.generate_key()
        with open(key_file, 'wb') as f:
            f.write(key)

        # Secure the key file
        key_file.chmod(0o600)
        return key

    def write_event(self, event: AuditEvent, chain_id: str) -> str:
        """Write a single event to storage."""
        event_file = self._get_event_file(chain_id, event.timestamp)

        # Serialize event
        event_dict = {
            "event_id": event.event_id,
            "timestamp": event.timestamp,
            "event_type": event.event_type.value,
            "severity": event.severity.value,
            "user_id": event.user_id,
            "source_ip": event.source_ip,
            "component": event.component,
            "action": event.action,
            "outcome": event.outcome,
            "details": event.details,
            "metadata": event.metadata,
            "content_hash": event.content_hash,
            "chain_hash": event.chain_hash,
            "signature": event.signature
        }

        event_json = json.dumps(event_dict, separators=(',', ':'))

        # Apply encryption if enabled
        if self.encryption_enabled:
            event_data = self._encrypt_data(event_json)
        else:
            event_data = event_json.encode('utf-8')

        # Apply compression if enabled
        if self.compression_enabled:
            event_data = gzip.compress(event_data)

        # Append to file
        with open(event_file, 'ab') as f:
            # Write length prefix for proper parsing
            f.write(len(event_data).to_bytes(4, byteorder='big'))
            f.write(event_data)
            f.write(b'\n')

        self.files_written += 1
        self.total_bytes_written += len(event_data) + 5  # 4 bytes length + 1 byte newline

        return str(event_file)

    def read_events(self, start_time: Optional[float] = None,
                    end_time: Optional[float] = None,
                    limit: int = 1000) -> List[Dict[str, Any]]:
        """Read events from storage within time range."""
        events = []

        # Find relevant files
        files = self._find_event_files(start_time, end_time)

        for file_path in files:
            if not file_path.exists():
                continue

            try:
                file_events = self._read_events_from_file(file_path)

                # Filter by time range
                for event in file_events:
                    if start_time and event['timestamp'] < start_time:
                        continue
                    if end_time and event['timestamp'] > end_time:
                        continue

                    events.append(event)

                    if len(events) >= limit:
                        return events

            except Exception as e:
                # Log error but continue processing
                print(f"Error reading file {file_path}: {e}")

        return events

    def _read_events_from_file(self, file_path: Path) -> List[Dict[str, Any]]:
        """Read all events from a single file."""
        events = []

        with open(file_path, 'rb') as f:
            while True:
                # Read length prefix
                length_bytes = f.read(4)
                if not length_bytes:
                    break

                event_length = int.from_bytes(length_bytes, byteorder='big')
                event_data = f.read(event_length)
                f.read(1)  # Skip newline

                # Decompress if needed
                if self.compression_enabled:
                    event_data = gzip.decompress(event_data)

                # Decrypt if needed
                if self.encryption_enabled:
                    event_json = self._decrypt_data(event_data)
                else:
                    event_json = event_data.decode('utf-8')

                event = json.loads(event_json)
                events.append(event)

        return events

    def _encrypt_data(self, data: str) -> bytes:
        """Encrypt audit data."""
        fernet = Fernet(self.encryption_key)
        return fernet.encrypt(data.encode('utf-8'))

    def _decrypt_data(self, data: bytes) -> str:
        """Decrypt audit data."""
        fernet = Fernet(self.encryption_key)
        return fernet.decrypt(data).decode('utf-8')

    def _get_event_file(self, chain_id: str, timestamp: float) -> Path:
        """Get the file path for an event based on chain and timestamp."""
        date_str = datetime.fromtimestamp(timestamp).strftime("%Y%m%d")
        hour_str = datetime.fromtimestamp(timestamp).strftime("%H")

        file_dir = self.storage_path / date_str
        file_dir.mkdir(exist_ok=True)

        return file_dir / f"audit_{chain_id}_{hour_str}.dat"

    def _find_event_files(self, start_time: Optional[float],
                        end_time: Optional[float]) -> List[Path]:
        """Find all event files in the time range."""
        files = []

        if not start_time:
            start_time = time.time() - (30 * 24 * 3600)  # Default 30 days
        if not end_time:
            end_time = time.time()

        start_date = datetime.fromtimestamp(start_time)
        end_date = datetime.fromtimestamp(end_time)

        current_date = start_date
        while current_date <= end_date:
            date_str = current_date.strftime("%Y%m%d")
            date_dir = self.storage_path / date_str

            if date_dir.exists():
                files.extend(date_dir.glob("audit_*.dat"))

            current_date += timedelta(days=1)

        return sorted(files)

    def cleanup_old_files(self, retention_days: Optional[int] = None):
        """Remove audit files older than retention period."""
        if retention_days is None:
            retention_days = self.DFARS_RETENTION_DAYS

        cutoff_time = time.time() - (retention_days * 24 * 3600)
        cutoff_date = datetime.fromtimestamp(cutoff_time)

        for date_dir in self.storage_path.iterdir():
            if not date_dir.is_dir():
                continue

            try:
                dir_date = datetime.strptime(date_dir.name, "%Y%m%d")
                if dir_date < cutoff_date:
                    # Remove entire directory
                    for file in date_dir.iterdir():
                        file.unlink()
                    date_dir.rmdir()
            except ValueError:
                # Skip non-date directories
                continue

    def backup_audit_logs(self, backup_path: str):
        """Create backup of audit logs."""
        backup_dir = Path(backup_path)
        backup_dir.mkdir(parents=True, exist_ok=True)

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_file = backup_dir / f"audit_backup_{timestamp}.tar.gz"

        import tarfile
        with tarfile.open(backup_file, "w:gz") as tar:
            tar.add(self.storage_path, arcname="audit_logs")

        self.last_backup_time = time.time()
        return str(backup_file)

    def get_storage_statistics(self) -> Dict[str, Any]:
        """Get storage usage statistics."""
        total_size = 0
        file_count = 0
        oldest_file = None
        newest_file = None

        for file_path in self.storage_path.rglob("*.dat"):
            file_count += 1
            file_size = file_path.stat().st_size
            total_size += file_size

            file_time = file_path.stat().st_mtime
            if oldest_file is None or file_time < oldest_file:
                oldest_file = file_time
            if newest_file is None or file_time > newest_file:
                newest_file = file_time

        return {
            "total_size_bytes": total_size,
            "total_size_mb": total_size / (1024 * 1024),
            "file_count": file_count,
            "files_written": self.files_written,
            "total_bytes_written": self.total_bytes_written,
            "oldest_file": datetime.fromtimestamp(oldest_file).isoformat() if oldest_file else None,
            "newest_file": datetime.fromtimestamp(newest_file).isoformat() if newest_file else None,
            "compression_enabled": self.compression_enabled,
            "encryption_enabled": self.encryption_enabled
        }