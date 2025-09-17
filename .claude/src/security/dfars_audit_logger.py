from lib.shared.utilities import get_logger
"""
DFARS-Compliant Audit Logger
Implements DFARS 252.204-7012 audit and accountability requirements
"""

import logging
import os
import json
from datetime import datetime
from pathlib import Path

class DFARSAuditLogger:
    """DFARS-compliant audit logging system"""

    def __init__(self, log_dir: str = ".dfars_logs"):
        self.log_dir = Path(log_dir)
        self.log_dir.mkdir(exist_ok=True)

        # Configure DFARS audit logger
        self.logger = get_logger("\1")
        self.logger.setLevel(logging.INFO)

        # Create file handler with rotation
        log_file = self.log_dir / f"dfars_audit_{datetime.now().strftime('%Y%m')}.log"
        handler = logging.FileHandler(log_file)

        # DFARS-compliant format: timestamp, user, action, resource, result
        formatter = logging.Formatter(
            '%(asctime)s|%(levelname)s|%(name)s|%(message)s'
        )
        handler.setFormatter(formatter)
        self.logger.addHandler(handler)

    def log_security_event(self, event_type: str, user_id: str = "system",
                          resource: str = "", result: str = "success",
                          details: dict = None):
        """Log security events for DFARS compliance"""

        audit_record = {
            'event_type': event_type,
            'user_id': user_id,
            'resource': resource,
            'result': result,
            'details': details or {},
            'timestamp': datetime.now().isoformat(),
            'source_ip': os.environ.get('REMOTE_ADDR', 'localhost')
        }

        # Log as JSON for structured parsing
        self.logger.info(json.dumps(audit_record))

    def log_access_attempt(self, user_id: str, resource: str, success: bool):
        """Log access attempts"""
        self.log_security_event(
            'access_attempt',
            user_id=user_id,
            resource=resource,
            result='success' if success else 'failure'
        )

    def log_privilege_escalation(self, user_id: str, from_role: str, to_role: str):
        """Log privilege changes"""
        self.log_security_event(
            'privilege_escalation',
            user_id=user_id,
            details={'from_role': from_role, 'to_role': to_role}
        )

    def log_data_access(self, user_id: str, data_type: str, operation: str):
        """Log CUI data access"""
        self.log_security_event(
            'cui_data_access',
            user_id=user_id,
            resource=data_type,
            details={'operation': operation}
        )

# Global audit logger instance
dfars_audit = DFARSAuditLogger()
