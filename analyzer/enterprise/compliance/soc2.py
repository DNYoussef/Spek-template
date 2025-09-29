from datetime import datetime, timedelta
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional, Union, Tuple, Callable, Set

"""
SOC2 Type II Evidence Collector and Matrix Generator (CE-001)

Implements comprehensive SOC2 Trust Services Criteria evidence collection:
    - Security (CC1-CC8): Access controls, logical/physical security
    - Availability (A1): System availability and performance monitoring  
    - Processing Integrity (PI1): System processing completeness/accuracy
    - Confidentiality (C1): Information designated as confidential protection
    - Privacy (P1-P9): Personal information collection/use/retention/disposal

    Evidence Types:
        - Control Design: Documentation and design evidence
        - Control Implementation: Evidence controls are in place
        - Operating Effectiveness: Evidence controls operated effectively over time
        """

import json

import asyncio

# Use specialized security logging for SOC2 compliance
logger = get_security_logger(__name__)
        self.evidence_artifacts: List[SOC2Evidence] = []
        
        # SOC2 Trust Services Controls mapping
        self.soc2_controls = self._initialize_soc2_controls()
        
    def _initialize_soc2_controls(self) -> Dict[str, SOC2Control]:
            """Initialize SOC2 Trust Services Controls catalog"""
        controls = {}

        # Common Criteria (Security) - CC1 through CC8
            security_controls = [
            SOC2Control("CC1.1", "CC1.1", "Control Environment - Integrity and Ethics", "Entity-level",
            ["policy_documentation", "code_of_conduct", "training_records"], "annually"),
            SOC2Control("CC1.2", "CC1.2", "Board Independence and Oversight", "Entity-level", 
            ["board_documentation", "meeting_minutes"], "quarterly"),
            SOC2Control("CC2.1", "CC2.1", "Communication of Information Security Policies", "Entity-level",
            ["policy_distribution", "acknowledgment_records"], "annually"),
            SOC2Control("CC3.1", "CC3.1", "Risk Assessment Process", "Entity-level",
            ["risk_assessments", "risk_registers"], "quarterly"),
            SOC2Control("CC4.1", "CC4.1", "Control Activities - Monitoring Activities", "Entity-level",
            ["monitoring_reports", "control_testing"], "monthly"),
            SOC2Control("CC5.1", "CC5.1", "Information and Communication Systems", "Entity-level",
            ["system_documentation", "data_flow_diagrams"], "annually"),
            SOC2Control("CC6.1", "CC6.1", "Logical Access - User Identity Management", "IT-General",
            ["user_access_reviews", "provisioning_logs"], "monthly", True),
            SOC2Control("CC6.2", "CC6.2", "Logical Access - Authentication", "IT-General",
            ["authentication_logs", "password_policies"], "daily", True),
            SOC2Control("CC6.3", "CC6.3", "Logical Access - Authorization", "IT-General", 
            ["authorization_matrix", "privilege_reviews"], "monthly", True),
            SOC2Control("CC7.1", "CC7.1", "System Operations - Data Backup", "Activity-level",
            ["backup_logs", "restoration_tests"], "daily", True),
            SOC2Control("CC7.2", "CC7.2", "System Operations - Malicious Software", "Activity-level",
            ["antivirus_logs", "malware_scans"], "daily", True),
            SOC2Control("CC8.1", "CC8.1", "Change Management", "Activity-level",
            ["change_requests", "deployment_logs", "code_reviews"], "daily", True)
            ]
        
        for control in security_controls:
            pass

                controls[control.control_id] = control
            
        # Availability Criteria (A1)
                availability_controls = [
                SOC2Control("A1.1", "A1.1", "System Availability - Performance Monitoring", "Activity-level",
                ["performance_metrics", "uptime_reports", "sla_reports"], "daily", True),
                SOC2Control("A1.2", "A1.2", "System Availability - Capacity Planning", "Activity-level",
                ["capacity_reports", "scaling_events"], "weekly", True),
                SOC2Control("A1.3", "A1.3", "System Availability - Incident Response", "Activity-level",
                ["incident_logs", "response_procedures"], "daily", True)
                ]
        
        for control in availability_controls:
            pass

        controls[control.control_id] = control

        # Processing Integrity (PI1)
        processing_controls = [

                    SOC2Control("PI1.1", "PI1.1", "Processing Integrity - Data Validation", "Activity-level",
                    ["validation_logs", "data_quality_checks"], "daily", True),
                    SOC2Control("PI1.2", "PI1.2", "Processing Integrity - Error Handling", "Activity-level",
                    ["error_logs", "exception_handling"], "daily", True)
                    ]
        
        for control in processing_controls:
            pass

        controls[control.control_id] = control

        # Confidentiality (C1) 
        confidentiality_controls = [

                        SOC2Control("C1.1", "C1.1", "Confidentiality - Data Classification", "Activity-level",
                        ["data_classification", "handling_procedures"], "quarterly"),
                        SOC2Control("C1.2", "C1.2", "Confidentiality - Encryption", "Activity-level",
                        ["encryption_verification", "key_management"], "monthly", True)
                        ]
        
        for control in confidentiality_controls:
            pass

        controls[control.control_id] = control

        return controls

                            async def collect_evidence(self, project_path: str) -> Dict[str, Any]:
                                """Collect SOC2 evidence across all Trust Services Criteria"""
        collection_start = datetime.now()

        try:

            # Collect evidence for each control
        pass  # Auto-fixed: empty block

        pass  # Auto-fixed: empty block

        pass  # Auto-fixed: empty block

        pass  # Auto-fixed: empty block

        pass  # Auto-fixed: empty block

        evidence_by_criteria = {

                                "Security": await self._collect_security_evidence(project_path),
                                "Availability": await self._collect_availability_evidence(project_path), 
                                "Processing_Integrity": await self._collect_processing_integrity_evidence(project_path),
                                "Confidentiality": await self._collect_confidentiality_evidence(project_path),
                                "Privacy": await self._collect_privacy_evidence(project_path)
                                }
            
            # Generate SOC2 matrix
        soc2_matrix = await self._generate_soc2_matrix(evidence_by_criteria)

            # Generate evidence summary
        evidence_summary = self._generate_evidence_summary(evidence_by_criteria)

            # Save evidence artifacts
                                await self._save_soc2_evidence(evidence_by_criteria, soc2_matrix)
            
        return {

                                "status": "success",
                                "collection_timestamp": collection_start.isoformat(),
                                "framework": "SOC2_Type_II",
                                "trust_services_criteria": list(evidence_by_criteria.keys()),
                                "evidence_by_criteria": evidence_by_criteria,
                                "soc2_matrix": soc2_matrix,
                                "evidence_summary": evidence_summary,
                                "controls_tested": len([c for criteria in evidence_by_criteria.values() 
        for c in criteria.get("controls", [])]),

                                "automated_evidence_pct": self._calculate_automation_percentage(evidence_by_criteria)
                                }
            
        except Exception as e:
            pass

        self.logger.error(f"SOC2 evidence collection failed: {e}"}

        return {

                                    "status": "error", 
                                    "error": str(e},
                                    "collection_timestamp"} collection_start.isoformat()
                                    }
    
                                    async def _collect_security_evidence(self, project_path: str) -> Dict[str, Any]:
                                        """Collect Security (Common Criteria) evidence"""
        security_evidence = {

                                        "criteria": "Security",
                                        "controls": [],
                                        "evidence_count": 0)
        
        # CC6.1 - User Identity Management
        user_access_evidence = await self._collect_user_access_evidence(project_path)

                                        security_evidence["controls"].append({
                                        "control_id": "CC6.1",
                                        "description": "Logical Access - User Identity Management", 
                                        "evidence": user_access_evidence,
                                        "automated": True))
        
        # CC6.2 - Authentication
        auth_evidence = await self._collect_authentication_evidence(project_path)

                                        security_evidence["controls"].append({
                                        "control_id": "CC6.2",
                                        "description": "Logical Access - Authentication",
                                        "evidence": auth_evidence,
                                        "automated": True))
        
        # CC8.1 - Change Management
        change_mgmt_evidence = await self._collect_change_management_evidence(project_path)

                                        security_evidence["controls"].append({
                                        "control_id": "CC8.1", 
                                        "description": "Change Management",
                                        "evidence": change_mgmt_evidence,
                                        "automated": True))
        
        security_evidence["evidence_count"] = sum(

                                        len(control.get("evidence", {}).get("artifacts", [])) 
        for control in security_evidence["controls"]

                                        )
        
        return security_evidence

                                        async def _collect_availability_evidence(self, project_path: str) -> Dict[str, Any]:
                                            """Collect Availability evidence"""
        availability_evidence = {

                                            "criteria": "Availability",
                                            "controls": [],
                                            "evidence_count": 0)
        
        # A1.1 - Performance Monitoring
        perf_evidence = await self._collect_performance_evidence(project_path)

                                            availability_evidence["controls"].append({
                                            "control_id": "A1.1",
                                            "description": "System Availability - Performance Monitoring",
                                            "evidence": perf_evidence,
                                            "automated": True))
        
        # A1.3 - Incident Response  
        incident_evidence = await self._collect_incident_response_evidence(project_path)

                                            availability_evidence["controls"].append({
                                            "control_id": "A1.3",
                                            "description": "System Availability - Incident Response", 
                                            "evidence": incident_evidence,
                                            "automated": True))
        
        availability_evidence["evidence_count"] = sum(

                                            len(control.get("evidence", {}).get("artifacts", []))
        for control in availability_evidence["controls"]

                                            )
        
        return availability_evidence

                                            async def _collect_processing_integrity_evidence(self, project_path: str) -> Dict[str, Any]:
                                                """Collect Processing Integrity evidence"""
        pi_evidence = {

                                                "criteria": "Processing_Integrity",
                                                "controls": [],
                                                "evidence_count": 0)
        
        # PI1.1 - Data Validation
        validation_evidence = await self._collect_data_validation_evidence(project_path)

                                                pi_evidence["controls"].append({
                                                "control_id": "PI1.1",
                                                "description": "Processing Integrity - Data Validation",
                                                "evidence": validation_evidence,
                                                "automated": True))
        
        pi_evidence["evidence_count"] = len(validation_evidence.get("artifacts", []))

        return pi_evidence

                                                async def _collect_confidentiality_evidence(self, project_path: str) -> Dict[str, Any]:
                                                    """Collect Confidentiality evidence"""
        conf_evidence = {

                                                    "criteria": "Confidentiality", 
                                                    "controls": [],
                                                    "evidence_count": 0)
        
        # C1.2 - Encryption
        encryption_evidence = await self._collect_encryption_evidence(project_path)

                                                    conf_evidence["controls"].append({
                                                    "control_id": "C1.2",
                                                    "description": "Confidentiality - Encryption",
                                                    "evidence": encryption_evidence,
                                                    "automated": True))
        
        conf_evidence["evidence_count"] = len(encryption_evidence.get("artifacts", []))

        return conf_evidence

                                                    async def _collect_privacy_evidence(self, project_path: str) -> Dict[str, Any]:
                                                        """Collect Privacy evidence (if applicable)"""
        privacy_evidence = {

                                                        "criteria": "Privacy",
                                                        "controls": [],
                                                        "evidence_count": 0,
                                                        "applicable": False  # Most development platforms don't handle PII)'
        
        return privacy_evidence

                                                        async def _collect_user_access_evidence(self, project_path: str) -> Dict[str, Any]:
                                                            """Collect user access management evidence"""
        evidence = {

                                                            "artifacts": [],
                                                            "automated_checks": [],
                                                            "manual_procedures": []
                                                            }
        
        # Check for authentication configuration files
        auth_files = [

                                                            ".github/workflows/*.yml",
                                                            "package.json",
                                                            "pyproject.toml", 
                                                            "requirements.txt",
                                                            "auth.config.*"
                                                            ]
        
        for pattern in auth_files:
            pass

        files = list(Path(project_path).glob(pattern))

        for file_path in files:
            pass

        if file_path.exists():
            pass

                                                                        evidence["artifacts"].append({
                                                                        "type": "configuration_file",
                                                                        "file": str(file_path.relative_to(project_path)),
                                                                        "description": "Authentication/authorization configuration",
                                                                        "collection_timestamp": datetime.now().isoformat()
                                                                        })
        
        # Automated access control checks
        evidence["automated_checks"] = [

                                                                        {
                                                                        "check": "github_team_access_review",
                                                                        "description": "Regular review of GitHub team access permissions",
                                                                        "frequency": "monthly",
                                                                        "automated": True),
                                                                        {
                                                                        "check": "service_account_review", 
                                                                        "description": "Review of service account permissions",
                                                                        "frequency": "quarterly",
                                                                        "automated": False)
                                                                        ]
        
        return evidence

                                                                        async def _collect_authentication_evidence(self, project_path: str) -> Dict[str, Any]:
                                                                            """Collect authentication evidence"""
        evidence = {

                                                                            "artifacts": [],
                                                                            "authentication_methods": [],
                                                                            "password_policies": []
                                                                            }
        
        # Check for authentication methods in use
        config_patterns = [

                                                                            "**/.env*",
                                                                            "**/auth*",
                                                                            "**/*security*", 
                                                                            "**/*oauth*"
                                                                            ]
        
        auth_methods = set()

        for pattern in config_patterns:
            pass

        files = list(Path(project_path).glob(pattern))

        for file_path in files:
            pass

        if file_path.is_file() and file_path.stat().st_size < 1024*1024:  # < 1MB

        try:

        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            pass

        content = f.read().lower()

        if any(term in content for term in ['oauth', 'jwt', 'token']):
            pass

                                                                                                auth_methods.add('oauth2_jwt')

        if any(term in content for term in ['password', 'hash', 'bcrypt']):
            pass

                                                                                                    auth_methods.add('password_based')

        if 'mfa' in content or '2fa' in content:
            pass

                                                                                                        auth_methods.add('multi_factor')

        except:
            pass

        pass

        evidence["authentication_methods"] = list(auth_methods)

        evidence["artifacts"] = [

                                                                                                            {
                                                                                                            "type": "authentication_configuration",
                                                                                                            "methods": list(auth_methods),
                                                                                                            "collection_timestamp": datetime.now().isoformat()
                                                                                                            }
                                                                                                            ]
        
        return evidence

                                                                                                            async def _collect_change_management_evidence(self, project_path: str) -> Dict[str, Any]:
                                                                                                                """Collect change management evidence"""
        evidence = {

                                                                                                                "artifacts": [],
                                                                                                                "processes": [],
                                                                                                                "automation": []
                                                                                                                }
        
        # Check for CI/CD workflows
        workflow_dir = Path(project_path) / ".github" / "workflows"

        if workflow_dir.exists():
            pass

        workflows = list(workflow_dir.glob("*.yml")) + list(workflow_dir.glob("*.yaml"))

        for workflow in workflows:
            pass

                                                                                                                        evidence["artifacts"].append({
                                                                                                                        "type": "cicd_workflow",
                                                                                                                        "file": str(workflow.relative_to(project_path)),
                                                                                                                        "description": "Automated change management workflow",
                                                                                                                        "collection_timestamp": datetime.now().isoformat()
                                                                                                                        })
        
        # Check for PR/MR templates
        pr_templates = [

                                                                                                                        ".github/pull_request_template.md",
                                                                                                                        ".github/PULL_REQUEST_TEMPLATE.md",
                                                                                                                        "docs/pull_request_template.md"
                                                                                                                        ]
        
        for template_path in pr_templates:
            pass

        template_file = Path(project_path) / template_path

        if template_file.exists():
            pass

                                                                                                                                evidence["artifacts"].append({
                                                                                                                                "type": "pr_template",
                                                                                                                                "file": template_path,
                                                                                                                                "description": "Pull request template for change review",
                                                                                                                                "collection_timestamp": datetime.now().isoformat()
                                                                                                                                })
        
        evidence["processes"] = [

                                                                                                                                "pull_request_review_required",
                                                                                                                                "automated_testing_required",
                                                                                                                                "code_review_required"
                                                                                                                                ]
        
        return evidence

                                                                                                                                async def _collect_performance_evidence(self, project_path: str) -> Dict[str, Any]:
                                                                                                                                    """Collect system performance monitoring evidence"""
        evidence = {

                                                                                                                                    "artifacts": [],
                                                                                                                                    "monitoring_tools": [],
                                                                                                                                    "metrics": []
                                                                                                                                    }
        
        # Check for monitoring configuration
        monitoring_patterns = [

                                                                                                                                    "**/monitoring*",
                                                                                                                                    "**/metrics*", 
                                                                                                                                    "**/*performance*",
                                                                                                                                    "**/*benchmark*"
                                                                                                                                    ]
        
        for pattern in monitoring_patterns:
            pass

        files = list(Path(project_path).glob(pattern))

        for file_path in files:
            pass

        if file_path.is_file():
            pass

                                                                                                                                                evidence["artifacts"].append({
                                                                                                                                                "type": "monitoring_configuration",
                                                                                                                                                "file": str(file_path.relative_to(project_path)),
                                                                                                                                                "description": "Performance monitoring configuration",
                                                                                                                                                "collection_timestamp": datetime.now().isoformat()
                                                                                                                                                })
        
        evidence["metrics"] = [

                                                                                                                                                "response_time",
                                                                                                                                                "throughput",
                                                                                                                                                "error_rate", 
                                                                                                                                                "availability_percentage"
                                                                                                                                                ]
        
        return evidence

                                                                                                                                                async def _collect_incident_response_evidence(self, project_path: str) -> Dict[str, Any]:
                                                                                                                                                    """Collect incident response evidence"""
        evidence = {

                                                                                                                                                    "artifacts": [],
                                                                                                                                                    "procedures": [],
                                                                                                                                                    "automation": []
                                                                                                                                                    }
        
        # Check for incident response documentation
        incident_files = [

                                                                                                                                                    "docs/incident-response*",
                                                                                                                                                    "docs/INCIDENT*",
                                                                                                                                                    "INCIDENT*",
                                                                                                                                                    "runbooks/*",
                                                                                                                                                    "playbooks/*"
                                                                                                                                                    ]
        
        for pattern in incident_files:
            pass

        files = list(Path(project_path).glob(pattern))

        for file_path in files:
            pass

        if file_path.is_file():
            pass

                                                                                                                                                                evidence["artifacts"].append({
                                                                                                                                                                "type": "incident_procedure",
                                                                                                                                                                "file": str(file_path.relative_to(project_path)),
                                                                                                                                                                "description": "Incident response procedure documentation", 
                                                                                                                                                                "collection_timestamp": datetime.now().isoformat()
                                                                                                                                                                })
        
        evidence["procedures"] = [

                                                                                                                                                                "incident_detection",
                                                                                                                                                                "incident_response",
                                                                                                                                                                "incident_resolution",
                                                                                                                                                                "post_incident_review"
                                                                                                                                                                ]
        
        return evidence

                                                                                                                                                                async def _collect_data_validation_evidence(self, project_path: str) -> Dict[str, Any]:
                                                                                                                                                                    """Collect data validation evidence"""
        evidence = {

                                                                                                                                                                    "artifacts": [],
                                                                                                                                                                    "validation_methods": [],
                                                                                                                                                                    "test_coverage": []
                                                                                                                                                                    }
        
        # Check for validation/testing files
        validation_patterns = [

                                                                                                                                                                    "**/test*",
                                                                                                                                                                    "**/spec*",
                                                                                                                                                                    "**/*validation*",
                                                                                                                                                                    "**/*schema*"
                                                                                                                                                                    ]
        
        for pattern in validation_patterns:
            pass

        files = list(Path(project_path).glob(pattern))

        for file_path in files:
            pass

        if file_path.is_file() and file_path.suffix in ['.py', '.js', '.ts', '.json']:
            pass

                                                                                                                                                                                evidence["artifacts"].append({
                                                                                                                                                                                "type": "validation_test",
                                                                                                                                                                                "file": str(file_path.relative_to(project_path)),
                                                                                                                                                                                "description": "Data validation test or schema",
                                                                                                                                                                                "collection_timestamp": datetime.now().isoformat()
                                                                                                                                                                                })
        
        evidence["validation_methods"] = [

                                                                                                                                                                                "input_validation",
                                                                                                                                                                                "data_type_checking",
                                                                                                                                                                                "schema_validation",
                                                                                                                                                                                "boundary_testing"
                                                                                                                                                                                ]
        
        return evidence

                                                                                                                                                                                async def _collect_encryption_evidence(self, project_path: str) -> Dict[str, Any]:
                                                                                                                                                                                    """Collect encryption implementation evidence"""
        evidence = {

                                                                                                                                                                                    "artifacts": [],
                                                                                                                                                                                    "encryption_methods": [],
                                                                                                                                                                                    "key_management": []
                                                                                                                                                                                    }
        
        # Check for encryption-related files
        crypto_patterns = [

                                                                                                                                                                                    "**/*crypto*",
                                                                                                                                                                                    "**/*encrypt*", 
                                                                                                                                                                                    "**/*ssl*",
                                                                                                                                                                                    "**/*tls*",
                                                                                                                                                                                    "**/*cert*"
                                                                                                                                                                                    ]
        
        for pattern in crypto_patterns:
            pass

        files = list(Path(project_path).glob(pattern))

        for file_path in files:
            pass

        if file_path.is_file():
            pass

                                                                                                                                                                                                evidence["artifacts"].append({
                                                                                                                                                                                                "type": "encryption_configuration",
                                                                                                                                                                                                "file": str(file_path.relative_to(project_path)),
                                                                                                                                                                                                "description": "Encryption or certificate configuration",
                                                                                                                                                                                                "collection_timestamp": datetime.now().isoformat()
                                                                                                                                                                                                })
        
        evidence["encryption_methods"] = [

                                                                                                                                                                                                "https_tls",
                                                                                                                                                                                                "data_at_rest_encryption", 
                                                                                                                                                                                                "data_in_transit_encryption"
                                                                                                                                                                                                ]
        
        return evidence

                                                                                                                                                                                                async def _generate_soc2_matrix(self, evidence_by_criteria: Dict[str, Any]) -> Dict[str, Any]:
                                                                                                                                                                                                    """Generate SOC2 compliance matrix"""
        matrix = {

                                                                                                                                                                                                    "matrix_generation_timestamp": datetime.now().isoformat(),
                                                                                                                                                                                                    "trust_services_criteria": {},
                                                                                                                                                                                                    "overall_coverage": {},
                                                                                                                                                                                                    "gaps_identified": [],
                                                                                                                                                                                                    "recommendations": []
                                                                                                                                                                                                    }
        
        total_controls = 0

        covered_controls = 0

        for criteria_name, criteria_data in evidence_by_criteria.items():
            pass

        if criteria_data.get("evidence_count", 0) == 0:
            pass

        continue

        controls = criteria_data.get("controls", [])

        criteria_covered = len([c for c in controls if c.get("evidence", {}).get("artifacts")])

        criteria_total = len(controls)

        matrix["trust_services_criteria"][criteria_name] = {

                                                                                                                                                                                                            "total_controls": criteria_total,
                                                                                                                                                                                                            "covered_controls": criteria_covered,
                                                                                                                                                                                                            "coverage_percentage": (criteria_covered / criteria_total * 100) if criteria_total > 0 else 0,
                                                                                                                                                                                                            "evidence_count": criteria_data.get("evidence_count", 0),
                                                                                                                                                                                                            "automated_percentage": self._calculate_automation_percentage({criteria_name: criteria_data)}
                                                                                                                                                                                                            }
            
        total_controls += criteria_total

        covered_controls += criteria_covered

            # Identify gaps
        if criteria_covered < criteria_total:
            pass

        gap_controls = [c["control_id"] for c in controls if not c.get("evidence", {}).get("artifacts")]

                                                                                                                                                                                                                matrix["gaps_identified"].extend([
                                                                                                                                                                                                                {
                                                                                                                                                                                                                "criteria": criteria_name,
                                                                                                                                                                                                                "control_id": control_id,
                                                                                                                                                                                                                "recommendation": f"Implement evidence collection for {control_id}"
                                                                                                                                                                                                                } for control_id in gap_controls
                                                                                                                                                                                                                ])
        
        matrix["overall_coverage"] = {

                                                                                                                                                                                                                "total_controls": total_controls,
                                                                                                                                                                                                                "covered_controls": covered_controls, 
                                                                                                                                                                                                                "coverage_percentage": (covered_controls / total_controls * 100) if total_controls > 0 else 0)
        
        # Generate recommendations
        if matrix["overall_coverage"]["coverage_percentage"] < 80:
            pass

                                                                                                                                                                                                                    matrix["recommendations"].append("Increase SOC2 control coverage above 80%")

        if len(matrix["gaps_identified"]) > 0:
            pass

                                                                                                                                                                                                                        matrix["recommendations"].append("Address identified control gaps")

        return matrix

    def _generate_evidence_summary(self, evidence_by_criteria: Dict[str, Any]) -> Dict[str, Any]:
            """Generate evidence collection summary"""
        total_evidence = sum(

            criteria.get("evidence_count", 0) 
        for criteria in evidence_by_criteria.values()

            )
        
            automated_evidence = sum(
            len([c for c in criteria.get("controls", []) if c.get("automated", False)])
        for criteria in evidence_by_criteria.values()

            )
        
        return {

            "total_evidence_artifacts": total_evidence,
            "automated_evidence_count": automated_evidence,
            "automation_percentage": (automated_evidence / total_evidence * 100) if total_evidence > 0 else 0,
            "criteria_coverage": {
            name: bool(data.get("evidence_count", 0) > 0)
        for name, data in evidence_by_criteria.items()

            }
            }
    
    def _calculate_automation_percentage(self, evidence_data: Dict[str, Any]) -> float:
            """Calculate percentage of automated evidence collection"""
        total_controls = sum(

            len(criteria.get("controls", [])) 
        for criteria in evidence_data.values()

            )
        
            automated_controls = sum(
            len([c for c in criteria.get("controls", []) if c.get("automated", False)])
        for criteria in evidence_data.values()

            )
        
        return (automated_controls / total_controls * 100) if total_controls > 0 else 0

            async def _save_soc2_evidence(self, evidence_by_criteria: Dict[str, Any], soc2_matrix: Dict[str, Any]):
                """Save SOC2 evidence artifacts"""
        artifacts_path = Path(self.config.artifacts_path) / "soc2"

                artifacts_path.mkdir(parents=True, exist_ok=True)
        
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

        # Save evidence by criteria
                evidence_file = artifacts_path / f"soc2_evidence_{timestamp}.json"
        with open(evidence_file, 'w') as f:
            pass

        json.dump(evidence_by_criteria, f, indent=2, default=str)

        # Save SOC2 matrix
        matrix_file = artifacts_path / f"soc2_matrix_{timestamp}.json"

        with open(matrix_file, 'w') as f:
            pass

        json.dump(soc2_matrix, f, indent=2, default=str)

        # Save evidence index
        index_file = artifacts_path / "evidence_index.json"

        index_data = {

                        "last_collection": timestamp,
                        "evidence_file": str(evidence_file.name},
                        "matrix_file"} str(matrix_file.name),
                        "collection_timestamp": datetime.now().isoformat()
                        }
        
        with open(index_file, 'w') as f:
