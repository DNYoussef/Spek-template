"""NASA POT10 and DFARS compliance thresholds.

This module defines critical compliance thresholds required for defense industry
readiness and NASA Procedural Operations Training (POT10) certification.

All thresholds are based on:
- NASA-STD-8739.8 Software Assurance Standard
- DFARS 252.239-7010 Cloud Computing Services
- Federal compliance requirements for defense contractors
"""

# NASA POT10 Compliance Thresholds
NASA_POT10_MINIMUM_COMPLIANCE_THRESHOLD = 0.92
"""Minimum NASA POT10 compliance score required for defense industry certification.

This threshold ensures compliance with NASA-STD-8739.8 requirements for
software assurance in defense systems. Systems scoring below this threshold
are not eligible for defense contractor certification.
"""

NASA_POT10_TARGET_COMPLIANCE_THRESHOLD = 0.95
"""Target NASA POT10 compliance score for optimal defense industry standing.

This represents the gold standard for NASA compliance, ensuring systems
meet all requirements with margin for operational variations.
"""

# Quality Gate Compliance
QUALITY_GATE_MINIMUM_PASS_RATE = 0.85
"""Minimum pass rate for quality gates in compliance validation.

Based on federal requirements for software quality assurance in
defense systems. Gates failing below this threshold trigger
mandatory remediation procedures.
"""

REGULATORY_FACTUALITY_REQUIREMENT = 0.90
"""Required factual accuracy for regulatory compliance reporting.

Ensures all compliance reports and audit documentation meet
federal standards for accuracy and completeness in defense
contractor environments.
"""

CONNASCENCE_ANALYSIS_THRESHOLD = 0.88
"""Threshold for connascence analysis in compliance validation.

Systems with connascence scores below this threshold require
architectural review and refactoring to meet NASA POT10
structural requirements.
"""

# Theater Detection Thresholds
THEATER_DETECTION_WARNING_THRESHOLD = 0.75
"""Warning threshold for performance theater detection.

Systems exhibiting theater behavior above this threshold receive
warning notifications and monitoring oversight.
"""

THEATER_DETECTION_FAILURE_THRESHOLD = 0.60
"""Failure threshold for performance theater detection.

Systems exhibiting theater behavior above this threshold fail
compliance validation and require immediate remediation.
"""

# Audit and Validation Requirements
AUDIT_TRAIL_COMPLETENESS_THRESHOLD = 0.95
"""Required completeness for audit trail documentation.

Ensures full traceability of all system changes and decisions
for regulatory compliance and defense contractor requirements.
"""

SECURITY_SCAN_PASS_THRESHOLD = 0.95
"""Required security scan pass rate for compliance validation.

Based on DFARS cybersecurity requirements for defense contractors.
Systems failing below this threshold are not deployment eligible.
"""
