"""
Audit Event Manager - Handles event creation and validation
Part of the refactored Enhanced DFARS Audit Trail Manager
"""

from datetime import datetime
from typing import Dict, Any, Optional
import hashlib
import time

from dataclasses import dataclass
from enum import Enum
import uuid

class AuditEventType(Enum):
    """DFARS audit event types."""
    AUTHENTICATION = "authentication"
    AUTHORIZATION = "authorization"
    DATA_ACCESS = "data_access"
    DATA_MODIFICATION = "data_modification"
    SECURITY_VIOLATION = "security_violation"
    CONFIGURATION_CHANGE = "configuration_change"
    COMPLIANCE_CHECK = "compliance_check"
    INTEGRITY_CHECK = "integrity_check"
    SYSTEM_ALERT = "system_alert"

class SeverityLevel(Enum):
    """Event severity levels."""
    DEBUG = "debug"
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"

@dataclass
class AuditEvent:
    """Standardized audit event structure."""
    event_id: str
    timestamp: float
    event_type: AuditEventType
    severity: SeverityLevel
    user_id: str
    source_ip: str
    component: str
    action: str
    outcome: str
    details: Dict[str, Any]
    metadata: Dict[str, Any]
    content_hash: str
    chain_hash: Optional[str] = None
    signature: Optional[str] = None

class AuditEventManager:
    """Manages audit event creation and basic validation."""

def __init__(self):
        """Initialize audit event manager."""
        self.event_counter = 0

def create_event(self,
                    event_type: AuditEventType,
                    severity: SeverityLevel,
                    user_id: str,
                    source_ip: str,
                    component: str,
                    action: str,
                    outcome: str,
                    details: Optional[Dict[str, Any]] = None,
                    metadata: Optional[Dict[str, Any]] = None) -> AuditEvent:
        """Create a new audit event with proper structure."""

        event_id = self._generate_event_id()
        timestamp = time.time()

        event = AuditEvent(
            event_id=event_id,
            timestamp=timestamp,
            event_type=event_type,
            severity=severity,
            user_id=user_id,
            source_ip=source_ip,
            component=component,
            action=action,
            outcome=outcome,
            details=details or {},
            metadata=metadata or {},
            content_hash=""
        )

        # Calculate content hash
        event.content_hash = self._calculate_content_hash(event)

        self.event_counter += 1
        return event

def _generate_event_id(self) -> str:
        """Generate unique event ID."""
        return f"evt_{uuid.uuid4().hex[:16]}_{int(time.time() * 1000)}"

def _calculate_content_hash(self, event: AuditEvent) -> str:
        """Calculate hash of event content for integrity."""
        content_parts = [
            event.event_id,
            str(event.timestamp),
            event.event_type.value,
            event.severity.value,
            event.user_id,
            event.source_ip,
            event.component,
            event.action,
            event.outcome,
            str(sorted(event.details.items())),
            str(sorted(event.metadata.items()))
        ]

        content_string = "|".join(content_parts)
        return hashlib.sha256(content_string.encode()).hexdigest()

def log_user_authentication(self, user_id: str, success: bool, source_ip: str,
                                method: str = "password", details: Optional[Dict] = None) -> AuditEvent:
        """Log user authentication event."""
        return self.create_event(
            event_type=AuditEventType.AUTHENTICATION,
            severity=SeverityLevel.INFO if success else SeverityLevel.WARNING,
            user_id=user_id,
            source_ip=source_ip,
            component="authentication",
            action=f"login_{method}",
            outcome="success" if success else "failed",
            details=details or {},
            metadata={"authentication_method": method}
        )

def log_data_access(self, user_id: str, resource: str, action: str,
                        source_ip: str, outcome: str = "success") -> AuditEvent:
        """Log data access event."""
        return self.create_event(
            event_type=AuditEventType.DATA_ACCESS,
            severity=SeverityLevel.INFO,
            user_id=user_id,
            source_ip=source_ip,
            component="data_access",
            action=action,
            outcome=outcome,
            details={"resource": resource}
        )

def log_security_event(self, event_type: AuditEventType, severity: SeverityLevel,
                            description: str, user_id: str = "system", source_ip: str = "0.0.0.0",
                            details: Optional[Dict] = None) -> AuditEvent:
        """Log security-related event."""
        return self.create_event(
            event_type=event_type,
            severity=severity,
            user_id=user_id,
            source_ip=source_ip,
            component="security",
            action="security_event",
            outcome="logged",
            details=details or {},
            metadata={"description": description}
        )

def log_compliance_check(self, check_type: str, result: str,
                            details: Optional[Dict] = None) -> AuditEvent:
        """Log compliance check event."""
        return self.create_event(
            event_type=AuditEventType.COMPLIANCE_CHECK,
            severity=SeverityLevel.INFO,
            user_id="system",
            source_ip="0.0.0.0",
            component="compliance",
            action=f"check_{check_type}",
            outcome=result,
            details=details or {}
        )

def log_configuration_change(self, change_type: str, component: str,
                                user_id: str, old_value: Any, new_value: Any) -> AuditEvent:
        """Log configuration change event."""
        return self.create_event(
            event_type=AuditEventType.CONFIGURATION_CHANGE,
            severity=SeverityLevel.WARNING,
            user_id=user_id,
            source_ip="0.0.0.0",
            component=component,
            action=f"config_{change_type}",
            outcome="applied",
            details={
                "change_type": change_type,
                "old_value": str(old_value),
                "new_value": str(new_value)
            }
        )