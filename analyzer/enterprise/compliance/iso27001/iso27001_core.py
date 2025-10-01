from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Union, Tuple, Callable, Set

"""
ISO27001 Core Module - Refactored using Delegation Pattern
Coordinates control definitions, assessments, and reporting for ISO27001 compliance.
"""

import json
import logging
import asyncio
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, Optional

from .control_definitions import ISO27001ControlCatalog
from .compliance_assessor import ISO27001ComplianceAssessor, ComplianceAssessmentConfig

logger = logging.getLogger(__name__)


class ISO27001Config:
    """Configuration for ISO27001 compliance system."""

    def __init__(self):
        self.artifacts_path = ".claude/.artifacts"
        self.assessment_scope = None  # All controls by default
        self.evidence_sources = ["documents", "systems", "processes"]
        self.output_formats = ["json", "html", "pdf"]
        self.auto_save = True
        self.risk_tolerance = "medium"


class ISO27001ComplianceSystem:
    """
    Refactored ISO27001 compliance system using delegation pattern.

    This core class coordinates specialized components:
    - ISO27001ControlCatalog: Manages control definitions
    - ISO27001ComplianceAssessor: Handles assessments and gap analysis
    """

    def __init__(self, config: ISO27001Config = None):
        self.config = config or ISO27001Config()

        # Initialize delegated components
        self.control_catalog = ISO27001ControlCatalog()

        assessment_config = ComplianceAssessmentConfig(
            assessment_scope=self.config.assessment_scope,
            evidence_path=f"{self.config.artifacts_path}/evidence",
            output_path=f"{self.config.artifacts_path}/iso27001",
            risk_tolerance=self.config.risk_tolerance
        )
        self.compliance_assessor = ISO27001ComplianceAssessor(
            self.control_catalog,
            assessment_config
        )

        logger.info("ISO27001 compliance system initialized with delegated components")

    async def perform_comprehensive_assessment(self, evidence_data: Dict[str, Any] = None) -> Dict[str, Any]:
        """Perform comprehensive ISO27001 compliance assessment."""
        logger.info("Starting comprehensive ISO27001 assessment...")

        try:
            # Load evidence if not provided
            if evidence_data is None:
                evidence_data = await self._load_evidence_data()

            # Delegate assessment to specialized component
            assessment_results = self.compliance_assessor.perform_full_assessment(evidence_data)

            # Save results if auto-save is enabled
            if self.config.auto_save:
                await self._save_assessment_results(assessment_results)

            logger.info("Comprehensive assessment completed successfully")
            return assessment_results

        except Exception as e:
            logger.error(f"Error during comprehensive assessment: {e}")
            return {
                "error": str(e),
                "timestamp": datetime.now().isoformat(),
                "status": "failed"
            }

    async def assess_control_category(self, category: str, evidence_data: Dict[str, Any] = None) -> Dict[str, Any]:
        """Assess specific control category."""
        logger.info(f"Assessing ISO27001 category: {category}")

        # Get controls in category
        category_controls = self.control_catalog.get_controls_by_category(category)
        if not category_controls:
            return {"error": f"No controls found in category {category}"}

        # Filter evidence for category
        category_evidence = {}
        if evidence_data:
            for control in category_controls:
                if control.control_id in evidence_data:
                    category_evidence[control.control_id] = evidence_data[control.control_id]

        # Create temporary assessor with category scope
        category_config = ComplianceAssessmentConfig(
            assessment_scope=[category],
            risk_tolerance=self.config.risk_tolerance
        )
        category_assessor = ISO27001ComplianceAssessor(self.control_catalog, category_config)

        return category_assessor.perform_full_assessment(category_evidence)

    def get_high_priority_controls(self) -> List[Dict[str, Any]]:
        """Get high priority controls with implementation guidance."""
        high_priority_controls = self.control_catalog.get_high_priority_controls()

        return [
            {
                "control_id": control.control_id,
                "category": control.category,
                "title": control.title,
                "description": control.description,
                "implementation_guidance": control.implementation_guidance,
                "evidence_required": control.evidence_required,
                "automated": control.automated
            }
            for control in high_priority_controls
        ]

    def get_automation_opportunities(self) -> List[Dict[str, Any]]:
        """Identify controls with automation opportunities."""
        automated_controls = self.control_catalog.get_automated_controls()

        return [
            {
                "control_id": control.control_id,
                "title": control.title,
                "category": control.category,
                "implementation_guidance": control.implementation_guidance,
                "automation_potential": "high" if "automat" in control.description.lower() else "medium"
            }
            for control in automated_controls
        ]

    def generate_implementation_roadmap(self, assessment_results: Dict[str, Any] = None) -> Dict[str, Any]:
        """Generate implementation roadmap based on assessment results."""
        if not assessment_results:
            # Perform quick assessment if none provided
            assessment_results = self.compliance_assessor.perform_full_assessment()

        roadmap_phases = []

        # Phase 1: Critical and High Priority Controls
        phase1_controls = []
        phase2_controls = []
        phase3_controls = []

        for control_id, assessment in assessment_results.get("control_assessments", {}).items():
            control = self.control_catalog.get_control(control_id)
            if not control:
                continue

            roadmap_item = {
                "control_id": control_id,
                "title": control.title,
                "current_status": assessment["implementation_status"],
                "risk_level": assessment["risk_level"],
                "effort_days": assessment["estimated_effort_days"],
                "priority": assessment["remediation_priority"]
            }

            if assessment["remediation_priority"] <= 2 and assessment["risk_level"] in ["critical", "high"]:
                phase1_controls.append(roadmap_item)
            elif assessment["remediation_priority"] <= 3:
                phase2_controls.append(roadmap_item)
            else:
                phase3_controls.append(roadmap_item)

        # Calculate phase timelines
        phase1_effort = sum(item["effort_days"] for item in phase1_controls)
        phase2_effort = sum(item["effort_days"] for item in phase2_controls)
        phase3_effort = sum(item["effort_days"] for item in phase3_controls)

        return {
            "roadmap_generated": datetime.now().isoformat(),
            "phases": [
                {
                    "phase": 1,
                    "name": "Critical Risk Mitigation",
                    "description": "Address critical and high-risk controls immediately",
                    "controls": sorted(phase1_controls, key=lambda x: x["priority"]),
                    "estimated_duration_days": phase1_effort,
                    "estimated_duration_weeks": round(phase1_effort / 5, 1)
                },
                {
                    "phase": 2,
                    "name": "Core Implementation",
                    "description": "Implement medium priority controls and strengthen foundations",
                    "controls": sorted(phase2_controls, key=lambda x: x["priority"]),
                    "estimated_duration_days": phase2_effort,
                    "estimated_duration_weeks": round(phase2_effort / 5, 1)
                },
                {
                    "phase": 3,
                    "name": "Optimization and Enhancement",
                    "description": "Complete implementation and optimize control effectiveness",
                    "controls": sorted(phase3_controls, key=lambda x: x["priority"]),
                    "estimated_duration_days": phase3_effort,
                    "estimated_duration_weeks": round(phase3_effort / 5, 1)
                }
            ],
            "total_timeline": {
                "total_days": phase1_effort + phase2_effort + phase3_effort,
                "total_weeks": round((phase1_effort + phase2_effort + phase3_effort) / 5, 1),
                "total_months": round((phase1_effort + phase2_effort + phase3_effort) / 22, 1)
            }
        }

    def get_compliance_dashboard(self) -> Dict[str, Any]:
        """Generate compliance dashboard data."""
        catalog_stats = self.control_catalog.get_control_statistics()

        # Get current assessments if available
        current_assessments = {}
        if hasattr(self.compliance_assessor, 'assessments') and self.compliance_assessor.assessments:
            current_assessments = {
                "total_assessed": len(self.compliance_assessor.assessments),
                "implementation_summary": {
                    "fully_implemented": sum(1 for a in self.compliance_assessor.assessments.values()
                                           if a.implementation_status == "fully_implemented"),
                    "partially_implemented": sum(1 for a in self.compliance_assessor.assessments.values()
                                                if a.implementation_status == "partially_implemented"),
                    "not_implemented": sum(1 for a in self.compliance_assessor.assessments.values()
                                         if a.implementation_status == "not_implemented")
                }
            }

        return {
            "dashboard_generated": datetime.now().isoformat(),
            "control_catalog": catalog_stats,
            "current_assessments": current_assessments,
            "system_health": self._get_system_health(),
            "quick_metrics": {
                "total_controls": catalog_stats["total_controls"],
                "high_priority_controls": len(self.control_catalog.get_high_priority_controls()),
                "automated_controls": catalog_stats["automated_controls"],
                "automation_percentage": round(catalog_stats["automation_percentage"], 1)
            }
        }

    async def _load_evidence_data(self) -> Dict[str, Any]:
        """Load evidence data from configured sources."""
        evidence_data = {}
        evidence_path = Path(self.config.artifacts_path) / "evidence"

        if evidence_path.exists():
            for evidence_file in evidence_path.glob("*.json"):
                try:
                    with open(evidence_file, 'r') as f:
                        file_evidence = json.load(f)
                        evidence_data.update(file_evidence)
                except Exception as e:
                    logger.warning(f"Could not load evidence from {evidence_file}: {e}")

        return evidence_data

    async def _save_assessment_results(self, results: Dict[str, Any]):
        """Save assessment results to configured output path."""
        output_path = Path(self.config.artifacts_path) / "iso27001"
        output_path.mkdir(parents=True, exist_ok=True)

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

        # Save comprehensive results
        results_file = output_path / f"iso27001_assessment_{timestamp}.json"
        with open(results_file, 'w') as f:
            json.dump(results, f, indent=2, default=str)

        # Save assessment index
        index_file = output_path / "assessment_index.json"
        index_data = {
            "last_assessment": timestamp,
            "assessment_file": str(results_file.name),
            "assessment_timestamp": datetime.now().isoformat(),
            "scope": self.config.assessment_scope,
            "total_controls": len(results.get("control_assessments", {}))
        }

        with open(index_file, 'w') as f:
            json.dump(index_data, f, indent=2)

        logger.info(f"Assessment results saved to {results_file}")

    def _get_system_health(self) -> Dict[str, str]:
        """Check health of all system components."""
        health = {}

        try:
            stats = self.control_catalog.get_control_statistics()
            health["control_catalog"] = "healthy" if stats["total_controls"] > 0 else "warning"
        except Exception:
            health["control_catalog"] = "error"

        try:
            # Check assessor functionality
            self.compliance_assessor._determine_implementation_status
            health["compliance_assessor"] = "healthy"
        except Exception:
            health["compliance_assessor"] = "error"

        try:
            # Check configuration
            assert self.config.artifacts_path
            health["configuration"] = "healthy"
        except Exception:
            health["configuration"] = "error"

        return health

    def validate_system_integrity(self) -> Dict[str, Any]:
        """Validate system integrity and completeness."""
        validation_results = {
            "timestamp": datetime.now().isoformat(),
            "overall_status": "unknown",
            "component_validations": {}
        }

        # Validate control catalog
        catalog_validation = self.control_catalog.validate_control_completeness()
        validation_results["component_validations"]["control_catalog"] = catalog_validation

        # Check system health
        health_check = self._get_system_health()
        validation_results["component_validations"]["system_health"] = health_check

        # Determine overall status
        all_healthy = all(status == "healthy" for status in health_check.values())
        catalog_valid = catalog_validation.get("valid", False)

        if all_healthy and catalog_valid:
            validation_results["overall_status"] = "valid"
        elif all_healthy:
            validation_results["overall_status"] = "warning"
        else:
            validation_results["overall_status"] = "error"

        return validation_results


def create_iso27001_system(config: ISO27001Config = None) -> ISO27001ComplianceSystem:
    """Factory function to create a properly configured ISO27001 system."""
    return ISO27001ComplianceSystem(config)


"""
<!-- AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE -->
## Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
|--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
| 1.0.0   | 2025-9-24T15:12:03-04:00 | coder@Sonnet-4 | Created ISO27001 core coordination module using delegation pattern | iso27001_core.py | OK | God object decomposition complete | 0.00 | a9c7f5e |

### Receipt
- status: OK
- reason_if_blocked: --
- run_id: phase3-iso27001-core-03
- inputs: ["iso27001.py"]
- tools_used: ["Write"]
- versions: {"model":"Sonnet-4","prompt":"v1.0.0"}
<!-- AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE -->
"""