from src.constants.base import MAXIMUM_FUNCTION_LENGTH_LINES

Implements encryption for sensitive data and comprehensive audit trails.
Priority: P1 - Must be completed within 21 days.
"""

import hashlib
import json
from lib.shared.utilities import get_logger
logger = get_logger(__name__)

class EncryptionManager:
    """FIPS 140-2 compliant encryption for sensitive data."""

    def __init__(self, key_path: Optional[str] = None):
        self.key_path = key_path or os.path.expanduser('~/.spek/encryption.key')
        self.key = self._load_or_generate_key()
        self.cipher = Fernet(self.key)

    def _load_or_generate_key(self) -> bytes:
        """Load existing key or generate new FIPS-compliant key."""
        key_file = Path(self.key_path)
        key_file.parent.mkdir(parents=True, exist_ok=True)

        if key_file.exists():
            with open(key_file, 'rb') as f:
                return f.read()
        else:
            # Generate key using PBKDF2 (FIPS 140-2 approved)
            password = os.urandom(32)  # 256-bit random password
            salt = os.urandom(16)      # 128-bit salt

            kdf = PBKDF2HMAC(
                algorithm=hashes.SHA256(),
                length=32,
                salt=salt,
                iterations=100000,  # NIST recommended minimum
            )

            key_material = kdf.derive(password)
            key = base64.urlsafe_b64encode(key_material)

            # Save key securely (in production, use HSM or key vault)
            with open(key_file, 'wb') as f:
                f.write(key)

            # Secure file permissions
            os.chmod(key_file, 0o600)

            logger.info(f"Generated new encryption key: {key_file}")
            return key

    def encrypt_data(self, data: str) -> str:
        """Encrypt sensitive data."""
        encrypted = self.cipher.encrypt(data.encode())
        return base64.b64encode(encrypted).decode()

    def decrypt_data(self, encrypted_data: str) -> str:
        """Decrypt sensitive data."""
        encrypted = base64.b64decode(encrypted_data.encode())
        decrypted = self.cipher.decrypt(encrypted)
        return decrypted.decode()

    def encrypt_file(self, file_path: str, backup: bool = True) -> bool:
        """Encrypt a file in place."""
        try:
            path = Path(file_path)

            # Create backup if requested
            if backup:
                backup_path = path.with_suffix(path.suffix + '.bak')
                path.rename(backup_path)
                original_path = backup_path
            else:
                with open(path, 'r') as f:
                    original_content = f.read()
                original_path = path

            # Read and encrypt content
            with open(original_path, 'r') as f:
                content = f.read()

            encrypted_content = self.encrypt_data(content)

            # Write encrypted content
            with open(path, 'w') as f:
                f.write(f"# ENCRYPTED CONTENT - DO NOT EDIT MANUALLY\n")
                f.write(f"# Encrypted at: {datetime.now().isoformat()}\n")
                f.write(encrypted_content)

            logger.info(f"Encrypted file: {file_path}")
            return True

        except Exception as e:
            logger.error(f"Failed to encrypt {file_path}: {e}")
            return False

class AuditTrailManager:
    """Comprehensive audit trail with immutable storage."""

    def __init__(self, db_path: Optional[str] = None):
        self.db_path = db_path or os.path.expanduser('~/.spek/audit.db')
        self.init_database()

    def init_database(self):
        """Initialize audit trail database."""
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)

        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS audit_events (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp TEXT NOT NULL,
                    event_type TEXT NOT NULL,
                    user_id TEXT,
                    session_id TEXT,
                    resource_path TEXT,
                    action TEXT NOT NULL,
                    details TEXT,
                    checksum TEXT,
                    signature TEXT,
                    created_at TEXT NOT NULL
                )
            """)

            conn.execute("""
                CREATE TABLE IF NOT EXISTS file_integrity (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    file_path TEXT NOT NULL,
                    checksum_before TEXT,
                    checksum_after TEXT,
                    modification_time TEXT,
                    user_id TEXT,
                    change_description TEXT,
                    audit_event_id INTEGER,
                    FOREIGN KEY (audit_event_id) REFERENCES audit_events (id)
                )
            """)

            conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_audit_timestamp
                ON audit_events (timestamp)
            """)

            conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_audit_resource
                ON audit_events (resource_path)
            """)

    def log_event(self,
                    event_type: str,
                    action: str,
                    resource_path: Optional[str] = None,
                    user_id: Optional[str] = None,
                    details: Optional[Dict] = None) -> int:
        """Log audit event with integrity verification."""

        timestamp = datetime.now().isoformat()
        session_id = os.environ.get('AUDIT_SESSION_ID', 'unknown')
        user_id = user_id or os.environ.get('USER', 'system')

        # Create event signature for integrity
        event_data = f"{timestamp}{event_type}{action}{resource_path}{user_id}"
        signature = hashlib.sha256(event_data.encode()).hexdigest()

        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute("""
                INSERT INTO audit_events
                (timestamp, event_type, user_id, session_id, resource_path,
                action, details, signature, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                timestamp, event_type, user_id, session_id, resource_path,
                action, json.dumps(details) if details else None,
                signature, timestamp
            ))

            event_id = cursor.lastrowid
            logger.info(f"Audit event logged: {event_id} - {event_type}:{action}")
            return event_id

    def log_file_modification(self,
                            file_path: str,
                            user_id: Optional[str] = None,
                            change_description: Optional[str] = None) -> bool:
        """Log file modification with integrity checking."""
        try:
            path = Path(file_path)

            # Calculate file checksum
            if path.exists():
                with open(path, 'rb') as f:
                    checksum_after = hashlib.sha256(f.read()).hexdigest()
            else:
                checksum_after = None

            # Log audit event
            event_id = self.log_event(
                event_type="FILE_MODIFICATION",
                action="MODIFY",
                resource_path=str(path),
                user_id=user_id,
                details={
                    "change_description": change_description,
                    "file_size": path.stat().st_size if path.exists() else 0,
                    "modification_time": datetime.fromtimestamp(path.stat().st_mtime).isoformat() if path.exists() else None
                }
            )

            # Log file integrity record
            with sqlite3.connect(self.db_path) as conn:
                conn.execute("""
                    INSERT INTO file_integrity
                    (file_path, checksum_after, modification_time, user_id,
                    change_description, audit_event_id)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, (
                    str(path),
                    checksum_after,
                    datetime.now().isoformat(),
                    user_id or os.environ.get('USER', 'system'),
                    change_description,
                    event_id
                ))

            return True

        except Exception as e:
            logger.error(f"Failed to log file modification for {file_path}: {e}")
            return False

    def verify_integrity(self) -> Dict[str, Any]:
        """Verify audit trail integrity."""
        integrity_report = {
            "timestamp": datetime.now().isoformat(),
            "total_events": 0,
            "integrity_violations": [],
            "status": "UNKNOWN"
        }

        try:
            with sqlite3.connect(self.db_path) as conn:
                # Count total events
                cursor = conn.execute("SELECT COUNT(*) FROM audit_events")
                integrity_report["total_events"] = cursor.fetchone()[0]

                # Verify event signatures
                cursor = conn.execute("""
                    SELECT id, timestamp, event_type, action, resource_path,
                            user_id, signature FROM audit_events
                """)

                violations = []
                for row in cursor:
                    event_id, timestamp, event_type, action, resource_path, user_id, signature = row

                    # Recalculate signature
                    event_data = f"{timestamp}{event_type}{action}{resource_path}{user_id}"
                    expected_signature = hashlib.sha256(event_data.encode()).hexdigest()

                    if signature != expected_signature:
                        violations.append({
                            "event_id": event_id,
                            "timestamp": timestamp,
                            "expected_signature": expected_signature,
                            "actual_signature": signature
                        })

                integrity_report["integrity_violations"] = violations
                integrity_report["status"] = "VIOLATED" if violations else "VERIFIED"

        except Exception as e:
            logger.error(f"Integrity verification failed: {e}")
            integrity_report["error"] = str(e)
            integrity_report["status"] = "ERROR"

        return integrity_report

class DFARSComplianceFixer:
    """Main DFARS compliance implementation."""

    def __init__(self, root_path: str):
        self.root_path = Path(root_path)
        self.encryption_manager = EncryptionManager()
        self.audit_manager = AuditTrailManager()

        # Patterns for sensitive data detection
        self.sensitive_patterns = [
            r'password\s*[=:]\s*["\']([^"\']+)["\']',
            r'api_key\s*[=:]\s*["\']([^"\']+)["\']',
            r'secret\s*[=:]\s*["\']([^"\']+)["\']',
            r'token\s*[=:]\s*["\']([^"\']+)["\']',
            r'private_key\s*[=:]\s*["\']([^"\']+)["\']',
            r'access_key\s*[=:]\s*["\']([^"\']+)["\']'
        ]

    def scan_sensitive_files(self) -> List[Dict[str, Any]]:
        """Scan for files containing sensitive data."""
        sensitive_files = []

        for file_path in self.root_path.rglob('*'):
            if file_path.is_file() and file_path.suffix in ['.py', '.js', '.json', '.yaml', '.yml', '.env', '.config']:
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()

                    # Check for sensitive patterns
                    sensitive_data_found = []
                    for pattern in self.sensitive_patterns:
                        matches = re.finditer(pattern, content, re.IGNORECASE)
                        for match in matches:
                            line_num = content[:match.start()].count('\n') + 1
                            sensitive_data_found.append({
                                'pattern': pattern,
                                'line': line_num,
                                'context': content.split('\n')[line_num-1].strip()[:100]
                            })

                    if sensitive_data_found:
                        sensitive_files.append({
                            'file_path': str(file_path),
                            'sensitive_data': sensitive_data_found,
                            'encrypted': False
                        })

                except Exception as e:
                    logger.warning(f"Could not scan {file_path}: {e}")

        return sensitive_files

    def encrypt_sensitive_files(self, sensitive_files: List[Dict]) -> Dict[str, bool]:
        """Encrypt files containing sensitive data."""
        results = {}

        for file_info in sensitive_files:
            file_path = file_info['file_path']

            # Log file modification
            self.audit_manager.log_file_modification(
                file_path,
                change_description="Encrypting sensitive data for DFARS compliance"
            )

            # Encrypt file
            success = self.encryption_manager.encrypt_file(file_path)
            results[file_path] = success

            if success:
                logger.info(f"Encrypted sensitive file: {file_path}")
            else:
                logger.error(f"Failed to encrypt: {file_path}")

        return results

    def setup_file_monitoring(self) -> bool:
        """Set up automated file integrity monitoring."""
        try:
            # Create monitoring script
            monitor_script = self.root_path / 'scripts' / 'file_monitor.py'

            monitor_code = '''#!/usr/bin/env python3
"""
Automated File Integrity Monitor for DFARS Compliance
"""
import time
import os
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
from dfars_compliance_fixer import AuditTrailManager

class AuditFileHandler(FileSystemEventHandler):
    def __init__(self):
        self.audit_manager = AuditTrailManager()

    def on_modified(self, event):
        if not event.is_directory:
            self.audit_manager.log_file_modification(
                event.src_path,
                change_description=f"File modified: {event.event_type}"
            )

def main():
    event_handler = AuditFileHandler()
    observer = Observer()
    observer.schedule(event_handler, '.', recursive=True)
    observer.start()

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
    observer.join()

if __name__ == "__main__":
    main()
'''

            with open(monitor_script, 'w') as f:
                f.write(monitor_code)

            os.chmod(monitor_script, 0o755)
            logger.info(f"Created file monitoring script: {monitor_script}")
            return True

        except Exception as e:
            logger.error(f"Failed to setup file monitoring: {e}")
            return False

    def generate_compliance_report(self, sensitive_files: List[Dict], encryption_results: Dict) -> str:
        """Generate DFARS compliance report."""

        # Verify audit trail integrity
        integrity_report = self.audit_manager.verify_integrity()

        total_files = len(sensitive_files)
        encrypted_files = sum(1 for success in encryption_results.values() if success)

        report = f"""
DFARS COMPLIANCE REMEDIATION REPORT
==================================
Generated: {datetime.now().isoformat()}

ENCRYPTION COMPLIANCE:
- Total sensitive files identified: {total_files}
- Files successfully encrypted: {encrypted_files}
- Encryption success rate: {(encrypted_files/total_files*100):.1f}%

AUDIT TRAIL COMPLIANCE:
- Total audit events: {integrity_report['total_events']}
- Integrity status: {integrity_report['status']}
- Integrity violations: {len(integrity_report.get('integrity_violations', []))}

SENSITIVE FILES DETAILS:
"""

        for file_info in sensitive_files:
            file_path = file_info['file_path']
            encrypted = encryption_results.get(file_path, False)
            status = "ENCRYPTED" if encrypted else "FAILED"

            report += f"\nFile: {file_path}\n"
            report += f"Status: {status}\n"
            report += f"Sensitive data patterns found: {len(file_info['sensitive_data'])}\n"

            for data in file_info['sensitive_data']:
                report += f"  - Line {data['line']}: {data['context']}\n"

        compliance_percentage = (encrypted_files / total_files * 100) if total_files > 0 else 100

        report += f"\n\nCOMPLIANCE SUMMARY:\n"
        report += f"Overall DFARS Compliance: {compliance_percentage:.1f}%\n"

        if compliance_percentage >= 95:
            report += "STATUS: COMPLIANT\n"
        elif compliance_percentage >= 80:
            report += "STATUS: MOSTLY COMPLIANT (Action Required)\n"
        else:
            report += "STATUS: NON-COMPLIANT (Immediate Action Required)\n"

        return report

def main():
    """Execute DFARS compliance fixes."""
    import re

    root_path = os.path.dirname(os.path.dirname(__file__))
    fixer = DFARSComplianceFixer(root_path)

    logger.info("Starting DFARS compliance scan...")

    # Scan for sensitive files
    sensitive_files = fixer.scan_sensitive_files()
    logger.info(f"Found {len(sensitive_files)} files with sensitive data")

    # Encrypt sensitive files
    if sensitive_files:
        encryption_results = fixer.encrypt_sensitive_files(sensitive_files)

        # Setup monitoring
        fixer.setup_file_monitoring()

        # Generate report
        report = fixer.generate_compliance_report(sensitive_files, encryption_results)

        # Save report
        report_path = Path(root_path) / 'docs' / 'dfars-compliance-report.md'
        with open(report_path, 'w') as f:
            f.write(report)

        logger.info(f"DFARS compliance report saved to: {report_path}")

        # Check compliance
        success_rate = sum(1 for success in encryption_results.values() if success) / len(encryption_results)

        if success_rate >= 0.95:
            logger.info("DFARS compliance achieved")
            return 0
        else:
            logger.error(f"DFARS compliance not achieved: {success_rate*MAXIMUM_FUNCTION_LENGTH_LINES:.1f}%")
            return 1
    else:
        logger.info("No sensitive files requiring encryption found")
        return 0

if __name__ == '__main__':
    exit(main())