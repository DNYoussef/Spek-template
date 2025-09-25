"""
Enterprise Compliance Evidence Generation Module

Provides comprehensive regulatory compliance support for:
- SOC2 Type II Trust Services Criteria
- ISO27001:2022 Information Security Management
- NIST Secure Software Development Framework (SSDF) v1.1
- Automated audit trail generation
- Multi-framework evidence packaging

Domain: CE (Compliance Evidence)
Tasks: CE-1 through CE-5
Performance Target: <1.5% overhead
Evidence Retention: 90 days
"""

from .audit_trail import AuditTrailGenerator
from .core import ComplianceOrchestrator
from .iso27001 import ISO27001ControlMapper
from .nist_ssdf import NISTSSDFPracticeValidator
from .reporting import ComplianceReportGenerator
from .soc2 import SOC2EvidenceCollector

__all__ = [
    'ComplianceOrchestrator',
    'SOC2EvidenceCollector', 
    'ISO27001ControlMapper',
    'NISTSSDFPracticeValidator',
    'AuditTrailGenerator',
    'ComplianceReportGenerator'
]

__version__ = "1.0.0"
__domain__ = "CE"