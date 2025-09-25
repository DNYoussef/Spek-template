"""
Enhanced DFARS Audit Trail Manager - Compatibility Wrapper

This module maintains backward compatibility while using the refactored
audit components that eliminate the God Object anti-pattern.

Original: 34 methods in single class
Refactored: 4 focused components with single responsibilities
"""

# Import refactored components
from .audit_components import (

# Alias for backward compatibility
EnhancedDFARSAuditTrailManager = RefactoredDFARSAuditManager

# Factory function for compatibility
def create_enhanced_audit_manager(storage_path: str = ".claude/.artifacts/enhanced_audit"):
    """Create enhanced DFARS audit trail manager using refactored components."""
    return create_refactored_audit_manager(storage_path)

# Re-export common types
__all__ = [
    'EnhancedDFARSAuditTrailManager',
    'create_enhanced_audit_manager',
    'AuditEventType',
    'SeverityLevel',
    'IntegrityStatus'
]