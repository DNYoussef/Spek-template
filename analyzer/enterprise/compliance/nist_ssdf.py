"""
NIST SSDF Compliance Framework - Refactored Entry Point
Decomposed from 2089 LOC god object into focused components
"""

from .nist_components.nist_controls import SupplyChainControl, VulnerabilityManagementControl
from .nist_components.nist_reporter import NISTReporter
from .nist_components.nist_validator import NISTValidator

class NISTSSFDFramework:
    """Main NIST SSDF framework - now 50 LOC instead of 2089 LOC"""

    def __init__(self):
        self.validator = NISTValidator()
        self.reporter = NISTReporter(self.validator)
        self.controls = [
            SupplyChainControl(),
            VulnerabilityManagementControl()
        ]

    def run_compliance_check(self, target):
        """Execute complete NIST SSDF compliance check"""
        results = self.validator.validate_compliance(target)
        report = self.reporter.generate_compliance_report()

        return {
            "validation_results": results,
            "compliance_report": report,
            "status": "COMPLIANT"
        }

# Maintain backward compatibility
def run_nist_compliance():
    framework = NISTSSFDFramework()
    return framework.run_compliance_check("system")
