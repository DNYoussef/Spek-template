"""
Refactored DFARS Audit Trail Components

This module contains the refactored audit trail management system,
split from the original 34-method God Object into focused components:

- AuditEventManager: Handles event creation and validation
- AuditStorageManager: Manages storage, encryption, and retrieval
- AuditIntegrityManager: Handles hash chains and integrity verification
- RefactoredDFARSAuditManager: Main coordinator using composition

This refactoring addresses God Object violations while maintaining
full DFARS compliance and audit trail functionality.
"""

from .audit_event_manager import (
    AuditEventManager,
    AuditEvent,
    AuditEventType,
    SeverityLevel
)

from .audit_storage_manager import AuditStorageManager

from .audit_integrity_manager import (
    AuditIntegrityManager,
    AuditChain,
    IntegrityStatus
)

from .refactored_audit_manager import (
    RefactoredDFARSAuditManager,
    create_refactored_audit_manager
)

__all__ = [
    # Event Management
    'AuditEventManager',
    'AuditEvent',
    'AuditEventType',
    'SeverityLevel',

    # Storage Management
    'AuditStorageManager',

    # Integrity Management
    'AuditIntegrityManager',
    'AuditChain',
    'IntegrityStatus',

    # Main Manager
    'RefactoredDFARSAuditManager',
    'create_refactored_audit_manager'
]