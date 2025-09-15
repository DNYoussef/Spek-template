"""
Compliance Integration for Theater Detection
Integrates with compliance frameworks and generates audit reports.
"""

import json
import os
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, asdict
from pathlib import Path
import logging

@dataclass
class ComplianceRequirement:
    """Individual compliance requirement."""
    requirement_id: str
    standard: str  # 'NASA-POT10', 'ISO-27001', 'NIST-800-53'
    section: str
    title: str
    description: str
    severity: str  # 'mandatory', 'recommended', 'optional'
    validation_criteria: List[str]
    evidence_requirements: List[str]

@dataclass
class ComplianceAssessment:
    """Assessment of compliance status."""
    requirement_id: str
    status: str  # 'compliant', 'non_compliant', 'partial', 'not_assessed'
    score: float  # 0.0 to 1.0
    evidence_provided: List[str]
    evidence_missing: List[str]
    findings: List[str]
    recommendations: List[str]
    assessor: str
    assessment_date: datetime

@dataclass
class ComplianceReport:
    """Comprehensive compliance report."""
    report_id: str
    organization: str
    project: str
    report_type: str  # 'pre_deployment', 'periodic', 'audit'
    assessment_period: Tuple[datetime, datetime]
    standards_covered: List[str]
    overall_score: float
    compliance_status: str  # 'fully_compliant', 'mostly_compliant', 'non_compliant'
    assessments: List[ComplianceAssessment]
    theater_analysis: Dict[str, Any]
    risk_assessment: Dict[str, Any]
    recommendations: List[str]
    certification_status: str
    next_review_date: datetime
    generated_by: str
    generation_date: datetime

class ComplianceIntegration:
    """
    Integrates theater detection with compliance frameworks.
    Generates compliance reports and tracks adherence to standards.
    """

    def __init__(self, config: Optional[Dict] = None):
        self.config = config or self._get_default_config()
        self.logger = self._setup_logging()
        self.requirements_db = self._load_compliance_requirements()

    def _get_default_config(self) -> Dict:
        """Default configuration for compliance integration."""
        return {
            'organization': 'Defense Contractor Inc.',
            'standards': {
                'NASA-POT10': {
                    'enabled': True,
                    'version': '2.1',
                    'certification_level': 'Level 2',
                    'review_frequency_days': 90
                },
                'ISO-27001': {
                    'enabled': True,
                    'version': '2013',
                    'certification_level': 'Certified',
                    'review_frequency_days': 365
                },
                'NIST-800-53': {
                    'enabled': True,
                    'version': 'Rev 5',
                    'certification_level': 'Moderate',
                    'review_frequency_days': 180
                }
            },
            'thresholds': {
                'minimum_compliance_score': 0.85,
                'theater_tolerance_threshold': 0.1,
                'evidence_completeness_threshold': 0.9,
                'mandatory_requirement_threshold': 1.0
            },
            'reporting': {
                'auto_generate_reports': True,
                'report_retention_days': 2555,  # 7 years
                'executive_summary_enabled': True,
                'technical_details_enabled': True
            },
            'integration': {
                'evidence_collector_enabled': True,
                'theater_detection_enabled': True,
                'risk_assessment_enabled': True,
                'certification_tracking_enabled': True
            }
        }

    def _setup_logging(self) -> logging.Logger:
        """Setup logging for compliance integration."""
        logger = logging.getLogger('ComplianceIntegration')
        logger.setLevel(logging.INFO)

        if not logger.handlers:
            handler = logging.StreamHandler()
            formatter = logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - [COMPLIANCE] %(message)s'
            )
            handler.setFormatter(formatter)
            logger.addHandler(handler)

        return logger

    def _load_compliance_requirements(self) -> Dict[str, List[ComplianceRequirement]]:
        """Load compliance requirements for enabled standards."""

        requirements = {}

        # NASA POT10 Requirements
        if self.config['standards']['NASA-POT10']['enabled']:
            requirements['NASA-POT10'] = self._load_nasa_pot10_requirements()

        # ISO 27001 Requirements
        if self.config['standards']['ISO-27001']['enabled']:
            requirements['ISO-27001'] = self._load_iso27001_requirements()

        # NIST 800-53 Requirements
        if self.config['standards']['NIST-800-53']['enabled']:
            requirements['NIST-800-53'] = self._load_nist80053_requirements()

        return requirements

    def _load_nasa_pot10_requirements(self) -> List[ComplianceRequirement]:
        """Load NASA POT10 requirements."""

        return [
            ComplianceRequirement(
                requirement_id='NASA-POT10-3.2',
                standard='NASA-POT10',
                section='3.2',
                title='Code Quality Standards',
                description='Software shall meet established code quality standards including complexity, maintainability, and documentation requirements.',
                severity='mandatory',
                validation_criteria=[
                    'Cyclomatic complexity <= 15 per function',
                    'Maintainability index >= 60',
                    'Code coverage >= 80%',
                    'All functions documented'
                ],
                evidence_requirements=[
                    'Code quality metrics report',
                    'Static analysis results',
                    'Code review documentation',
                    'Test coverage report'
                ]
            ),
            ComplianceRequirement(
                requirement_id='NASA-POT10-4.1',
                standard='NASA-POT10',
                section='4.1',
                title='Testing Requirements',
                description='Software shall be thoroughly tested using appropriate testing methodologies.',
                severity='mandatory',
                validation_criteria=[
                    'Unit test coverage >= 90%',
                    'Integration tests implemented',
                    'Test cases documented',
                    'Test results recorded'
                ],
                evidence_requirements=[
                    'Test execution reports',
                    'Test case documentation',
                    'Coverage analysis',
                    'Defect tracking records'
                ]
            ),
            ComplianceRequirement(
                requirement_id='NASA-POT10-5.3',
                standard='NASA-POT10',
                section='5.3',
                title='Security Standards',
                description='Software shall implement appropriate security measures and undergo security testing.',
                severity='mandatory',
                validation_criteria=[
                    'Security scan performed',
                    'Vulnerabilities addressed',
                    'Security controls implemented',
                    'Access controls verified'
                ],
                evidence_requirements=[
                    'Security scan reports',
                    'Vulnerability assessment',
                    'Security test results',
                    'Access control documentation'
                ]
            ),
            ComplianceRequirement(
                requirement_id='NASA-POT10-6.2',
                standard='NASA-POT10',
                section='6.2',
                title='Performance Standards',
                description='Software shall meet specified performance requirements.',
                severity='recommended',
                validation_criteria=[
                    'Performance requirements defined',
                    'Performance testing conducted',
                    'Performance benchmarks met',
                    'Performance monitoring implemented'
                ],
                evidence_requirements=[
                    'Performance test results',
                    'Benchmark comparisons',
                    'Performance monitoring data',
                    'Requirements traceability'
                ]
            )
        ]

    def _load_iso27001_requirements(self) -> List[ComplianceRequirement]:
        """Load ISO 27001 requirements."""

        return [
            ComplianceRequirement(
                requirement_id='ISO-27001-A.12.6.1',
                standard='ISO-27001',
                section='A.12.6.1',
                title='Management of technical vulnerabilities',
                description='Information about technical vulnerabilities of information systems being used shall be obtained in a timely fashion.',
                severity='mandatory',
                validation_criteria=[
                    'Vulnerability scanning implemented',
                    'Vulnerability management process defined',
                    'Timely patching procedures',
                    'Risk assessment conducted'
                ],
                evidence_requirements=[
                    'Vulnerability scan reports',
                    'Patch management records',
                    'Risk assessment documentation',
                    'Incident response logs'
                ]
            ),
            ComplianceRequirement(
                requirement_id='ISO-27001-A.14.2.1',
                standard='ISO-27001',
                section='A.14.2.1',
                title='Secure development policy',
                description='Rules for the development of software and systems shall be established and applied.',
                severity='mandatory',
                validation_criteria=[
                    'Secure development policy exists',
                    'Security requirements defined',
                    'Security testing performed',
                    'Security controls implemented'
                ],
                evidence_requirements=[
                    'Development policy document',
                    'Security requirements specification',
                    'Security test results',
                    'Code review records'
                ]
            )
        ]

    def _load_nist80053_requirements(self) -> List[ComplianceRequirement]:
        """Load NIST 800-53 requirements."""

        return [
            ComplianceRequirement(
                requirement_id='NIST-800-53-SA-11',
                standard='NIST-800-53',
                section='SA-11',
                title='Developer Security Testing',
                description='The organization requires the developer of the information system to conduct security testing.',
                severity='mandatory',
                validation_criteria=[
                    'Security testing plan developed',
                    'Security tests executed',
                    'Test results documented',
                    'Security issues resolved'
                ],
                evidence_requirements=[
                    'Security test plan',
                    'Test execution reports',
                    'Issue tracking records',
                    'Resolution documentation'
                ]
            ),
            ComplianceRequirement(
                requirement_id='NIST-800-53-SI-10',
                standard='NIST-800-53',
                section='SI-10',
                title='Information Input Validation',
                description='The information system checks the validity of information inputs.',
                severity='mandatory',
                validation_criteria=[
                    'Input validation implemented',
                    'Validation rules defined',
                    'Error handling implemented',
                    'Testing performed'
                ],
                evidence_requirements=[
                    'Input validation code',
                    'Validation rules documentation',
                    'Error handling tests',
                    'Security test results'
                ]
            )
        ]

    def assess_compliance(self,
                         evidence_package_id: str,
                         project: str,
                         assessment_scope: List[str] = None) -> ComplianceReport:
        """
        Assess compliance based on evidence package and theater detection results.

        Args:
            evidence_package_id: ID of evidence package to assess
            project: Project identifier
            assessment_scope: List of standards to assess (default: all enabled)

        Returns:
            ComplianceReport with assessment results
        """

        self.logger.info(f"Starting compliance assessment for evidence package {evidence_package_id}")

        try:
            # Determine assessment scope
            if assessment_scope is None:
                assessment_scope = [std for std, config in self.config['standards'].items() if config['enabled']]

            # Load evidence package
            evidence_data = self._load_evidence_package(evidence_package_id)

            # Perform assessments for each standard
            all_assessments = []
            theater_analysis = {}

            for standard in assessment_scope:
                if standard in self.requirements_db:
                    standard_assessments = self._assess_standard_compliance(
                        standard,
                        self.requirements_db[standard],
                        evidence_data
                    )
                    all_assessments.extend(standard_assessments)

                    # Analyze theater detection impact on compliance
                    theater_impact = self._analyze_theater_impact_on_compliance(
                        standard,
                        evidence_data.get('theater_analysis', {}),
                        standard_assessments
                    )
                    theater_analysis[standard] = theater_impact

            # Calculate overall compliance score
            overall_score = self._calculate_overall_compliance_score(all_assessments)

            # Determine compliance status
            compliance_status = self._determine_compliance_status(overall_score, all_assessments)

            # Perform risk assessment
            risk_assessment = self._perform_compliance_risk_assessment(
                all_assessments,
                theater_analysis,
                evidence_data
            )

            # Generate recommendations
            recommendations = self._generate_compliance_recommendations(
                all_assessments,
                theater_analysis,
                risk_assessment
            )

            # Determine certification status
            certification_status = self._determine_certification_status(
                overall_score,
                compliance_status,
                risk_assessment
            )

            # Calculate next review date
            next_review_date = self._calculate_next_review_date(assessment_scope)

            # Create compliance report
            report = ComplianceReport(
                report_id=f"COMP_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
                organization=self.config['organization'],
                project=project,
                report_type='pre_deployment',
                assessment_period=(datetime.now() - timedelta(days=30), datetime.now()),
                standards_covered=assessment_scope,
                overall_score=overall_score,
                compliance_status=compliance_status,
                assessments=all_assessments,
                theater_analysis=theater_analysis,
                risk_assessment=risk_assessment,
                recommendations=recommendations,
                certification_status=certification_status,
                next_review_date=next_review_date,
                generated_by='ComplianceIntegration',
                generation_date=datetime.now(timezone.utc)
            )

            self.logger.info(f"Compliance assessment completed: {compliance_status} ({overall_score:.1%})")

            return report

        except Exception as e:
            self.logger.error(f"Compliance assessment failed: {e}")
            raise

    def _load_evidence_package(self, evidence_package_id: str) -> Dict[str, Any]:
        """Load evidence package for compliance assessment."""

        # This would typically load from evidence collector database
        # For now, return mock data structure

        return {
            'package_id': evidence_package_id,
            'evidence_items': [
                {
                    'type': 'code_change',
                    'content': {'files_changed': 5, 'lines_changed': 100},
                    'metadata': {'quality_improvement': True}
                },
                {
                    'type': 'test_result',
                    'content': {'coverage': 0.85, 'tests_passed': 95, 'tests_total': 100},
                    'metadata': {'framework': 'pytest'}
                },
                {
                    'type': 'security_scan',
                    'content': {'vulnerabilities': [], 'security_score': 90},
                    'metadata': {'scanner': 'bandit'}
                }
            ],
            'quality_metrics': {
                'cyclomatic_complexity': 12.0,
                'maintainability_index': 75.0,
                'test_coverage': 0.85,
                'security_score': 90.0
            },
            'theater_analysis': {
                'theater_detected': False,
                'confidence': 0.9,
                'patterns': []
            },
            'validation_results': {
                'is_genuine': True,
                'confidence': 0.85
            }
        }

    def _assess_standard_compliance(self,
                                  standard: str,
                                  requirements: List[ComplianceRequirement],
                                  evidence_data: Dict[str, Any]) -> List[ComplianceAssessment]:
        """Assess compliance with specific standard."""

        assessments = []

        for requirement in requirements:
            assessment = self._assess_individual_requirement(requirement, evidence_data)
            assessments.append(assessment)

        return assessments

    def _assess_individual_requirement(self,
                                     requirement: ComplianceRequirement,
                                     evidence_data: Dict[str, Any]) -> ComplianceAssessment:
        """Assess compliance with individual requirement."""

        evidence_provided = []
        evidence_missing = []
        findings = []
        score = 0.0

        # Check evidence against requirement
        quality_metrics = evidence_data.get('quality_metrics', {})
        evidence_items = evidence_data.get('evidence_items', [])

        if requirement.requirement_id == 'NASA-POT10-3.2':
            # Code Quality Standards
            complexity = quality_metrics.get('cyclomatic_complexity', 20.0)
            maintainability = quality_metrics.get('maintainability_index', 50.0)
            coverage = quality_metrics.get('test_coverage', 0.5)

            criteria_met = 0
            total_criteria = 4

            if complexity <= 15:
                criteria_met += 1
                evidence_provided.append('Cyclomatic complexity within limits')
            else:
                evidence_missing.append('Cyclomatic complexity exceeds limit')

            if maintainability >= 60:
                criteria_met += 1
                evidence_provided.append('Maintainability index meets requirement')
            else:
                evidence_missing.append('Maintainability index below requirement')

            if coverage >= 0.8:
                criteria_met += 1
                evidence_provided.append('Code coverage meets requirement')
            else:
                evidence_missing.append('Code coverage below requirement')

            # Check for code review evidence
            code_change_evidence = any(item['type'] == 'code_change' for item in evidence_items)
            if code_change_evidence:
                criteria_met += 1
                evidence_provided.append('Code change evidence available')
            else:
                evidence_missing.append('Code change evidence missing')

            score = criteria_met / total_criteria

        elif requirement.requirement_id == 'NASA-POT10-4.1':
            # Testing Requirements
            test_evidence = any(item['type'] == 'test_result' for item in evidence_items)
            coverage = quality_metrics.get('test_coverage', 0.5)

            criteria_met = 0
            total_criteria = 2

            if coverage >= 0.9:
                criteria_met += 1
                evidence_provided.append('Unit test coverage meets requirement')
            else:
                evidence_missing.append('Unit test coverage below requirement')

            if test_evidence:
                criteria_met += 1
                evidence_provided.append('Test execution evidence available')
            else:
                evidence_missing.append('Test execution evidence missing')

            score = criteria_met / total_criteria

        elif requirement.requirement_id == 'NASA-POT10-5.3':
            # Security Standards
            security_score = quality_metrics.get('security_score', 0.0)
            security_evidence = any(item['type'] == 'security_scan' for item in evidence_items)

            criteria_met = 0
            total_criteria = 2

            if security_score >= 85:
                criteria_met += 1
                evidence_provided.append('Security score meets requirement')
            else:
                evidence_missing.append('Security score below requirement')

            if security_evidence:
                criteria_met += 1
                evidence_provided.append('Security scan evidence available')
            else:
                evidence_missing.append('Security scan evidence missing')

            score = criteria_met / total_criteria

        else:
            # Default assessment for other requirements
            score = 0.8  # Assume partially compliant
            evidence_provided.append('Partial evidence available')

        # Determine status
        if score >= 1.0:
            status = 'compliant'
        elif score >= 0.7:
            status = 'partial'
        else:
            status = 'non_compliant'

        # Generate findings
        if score < 1.0:
            findings.append(f"Requirement partially met: {score:.1%} compliance")

        # Generate recommendations
        recommendations = []
        for missing in evidence_missing:
            recommendations.append(f"Address: {missing}")

        return ComplianceAssessment(
            requirement_id=requirement.requirement_id,
            status=status,
            score=score,
            evidence_provided=evidence_provided,
            evidence_missing=evidence_missing,
            findings=findings,
            recommendations=recommendations,
            assessor='ComplianceIntegration',
            assessment_date=datetime.now(timezone.utc)
        )

    def _analyze_theater_impact_on_compliance(self,
                                            standard: str,
                                            theater_analysis: Dict[str, Any],
                                            assessments: List[ComplianceAssessment]) -> Dict[str, Any]:
        """Analyze impact of theater detection on compliance."""

        theater_detected = theater_analysis.get('theater_detected', False)
        theater_confidence = theater_analysis.get('confidence', 0.0)

        impact_analysis = {
            'theater_detected': theater_detected,
            'confidence': theater_confidence,
            'compliance_impact': 'none',
            'affected_requirements': [],
            'risk_level': 'low',
            'mitigation_required': False
        }

        if theater_detected:
            # Analyze which requirements are affected by theater
            affected_requirements = []

            for assessment in assessments:
                # Theater affects quality-related requirements more
                if any(keyword in assessment.requirement_id.lower() for keyword in ['quality', 'testing', 'performance']):
                    affected_requirements.append(assessment.requirement_id)

            impact_analysis['affected_requirements'] = affected_requirements

            # Determine impact level
            if theater_confidence > 0.8:
                impact_analysis['compliance_impact'] = 'high'
                impact_analysis['risk_level'] = 'high'
                impact_analysis['mitigation_required'] = True
            elif theater_confidence > 0.5:
                impact_analysis['compliance_impact'] = 'medium'
                impact_analysis['risk_level'] = 'medium'
                impact_analysis['mitigation_required'] = True
            else:
                impact_analysis['compliance_impact'] = 'low'
                impact_analysis['risk_level'] = 'medium'

        return impact_analysis

    def _calculate_overall_compliance_score(self, assessments: List[ComplianceAssessment]) -> float:
        """Calculate overall compliance score."""

        if not assessments:
            return 0.0

        # Weight mandatory requirements higher
        total_weighted_score = 0.0
        total_weight = 0.0

        for assessment in assessments:
            # Find the requirement to get severity
            requirement = self._find_requirement_by_id(assessment.requirement_id)

            if requirement:
                weight = 1.0 if requirement.severity == 'mandatory' else 0.5
                total_weighted_score += assessment.score * weight
                total_weight += weight
            else:
                total_weighted_score += assessment.score
                total_weight += 1.0

        return total_weighted_score / total_weight if total_weight > 0 else 0.0

    def _find_requirement_by_id(self, requirement_id: str) -> Optional[ComplianceRequirement]:
        """Find requirement by ID."""

        for standard_requirements in self.requirements_db.values():
            for requirement in standard_requirements:
                if requirement.requirement_id == requirement_id:
                    return requirement
        return None

    def _determine_compliance_status(self, overall_score: float, assessments: List[ComplianceAssessment]) -> str:
        """Determine overall compliance status."""

        # Check for any non-compliant mandatory requirements
        mandatory_non_compliant = 0
        total_mandatory = 0

        for assessment in assessments:
            requirement = self._find_requirement_by_id(assessment.requirement_id)
            if requirement and requirement.severity == 'mandatory':
                total_mandatory += 1
                if assessment.status == 'non_compliant':
                    mandatory_non_compliant += 1

        # Compliance status determination
        if mandatory_non_compliant > 0:
            return 'non_compliant'
        elif overall_score >= self.config['thresholds']['minimum_compliance_score']:
            return 'fully_compliant'
        elif overall_score >= 0.7:
            return 'mostly_compliant'
        else:
            return 'non_compliant'

    def _perform_compliance_risk_assessment(self,
                                          assessments: List[ComplianceAssessment],
                                          theater_analysis: Dict[str, Any],
                                          evidence_data: Dict[str, Any]) -> Dict[str, Any]:
        """Perform risk assessment for compliance."""

        risk_factors = []
        risk_score = 0.0

        # Theater detection risk
        theater_impact = any(
            analysis.get('theater_detected', False)
            for analysis in theater_analysis.values()
        )

        if theater_impact:
            risk_factors.append('Theater patterns detected affecting compliance')
            risk_score += 0.3

        # Non-compliant mandatory requirements
        mandatory_failures = [
            a for a in assessments
            if a.status == 'non_compliant' and
            self._find_requirement_by_id(a.requirement_id) and
            self._find_requirement_by_id(a.requirement_id).severity == 'mandatory'
        ]

        if mandatory_failures:
            risk_factors.append(f'{len(mandatory_failures)} mandatory requirements not met')
            risk_score += len(mandatory_failures) * 0.2

        # Evidence completeness
        evidence_items = evidence_data.get('evidence_items', [])
        if len(evidence_items) < 3:
            risk_factors.append('Insufficient evidence provided')
            risk_score += 0.2

        # Validation failures
        validation_results = evidence_data.get('validation_results', {})
        if not validation_results.get('is_genuine', True):
            risk_factors.append('Reality validation failed')
            risk_score += 0.3

        # Overall risk level
        if risk_score >= 0.7:
            risk_level = 'critical'
        elif risk_score >= 0.5:
            risk_level = 'high'
        elif risk_score >= 0.3:
            risk_level = 'medium'
        else:
            risk_level = 'low'

        return {
            'risk_score': min(risk_score, 1.0),
            'risk_level': risk_level,
            'risk_factors': risk_factors,
            'mitigation_required': risk_score >= 0.3,
            'deployment_risk': 'high' if risk_score >= 0.5 else 'medium' if risk_score >= 0.3 else 'low'
        }

    def _generate_compliance_recommendations(self,
                                           assessments: List[ComplianceAssessment],
                                           theater_analysis: Dict[str, Any],
                                           risk_assessment: Dict[str, Any]) -> List[str]:
        """Generate compliance recommendations."""

        recommendations = []

        # Theater-related recommendations
        theater_detected = any(
            analysis.get('theater_detected', False)
            for analysis in theater_analysis.values()
        )

        if theater_detected:
            recommendations.append('Address performance theater patterns before deployment')
            recommendations.append('Implement additional validation measures to ensure genuine improvements')

        # Requirement-specific recommendations
        non_compliant = [a for a in assessments if a.status == 'non_compliant']
        for assessment in non_compliant:
            recommendations.extend(assessment.recommendations)

        # Risk-based recommendations
        if risk_assessment['risk_level'] in ['high', 'critical']:
            recommendations.append('Conduct comprehensive review before deployment')
            recommendations.append('Implement additional quality controls')

        # Evidence recommendations
        partial_assessments = [a for a in assessments if a.status == 'partial']
        if partial_assessments:
            recommendations.append('Provide additional evidence for partial compliance items')

        # General recommendations
        recommendations.append('Schedule regular compliance reviews')
        recommendations.append('Maintain continuous monitoring of compliance metrics')

        return list(set(recommendations))  # Remove duplicates

    def _determine_certification_status(self,
                                      overall_score: float,
                                      compliance_status: str,
                                      risk_assessment: Dict[str, Any]) -> str:
        """Determine certification status."""

        if compliance_status == 'fully_compliant' and risk_assessment['risk_level'] == 'low':
            return 'certified'
        elif compliance_status == 'mostly_compliant' and risk_assessment['risk_level'] in ['low', 'medium']:
            return 'provisional'
        elif compliance_status == 'non_compliant' or risk_assessment['risk_level'] in ['high', 'critical']:
            return 'not_certified'
        else:
            return 'under_review'

    def _calculate_next_review_date(self, standards: List[str]) -> datetime:
        """Calculate next review date based on standards requirements."""

        min_frequency = min(
            self.config['standards'][std]['review_frequency_days']
            for std in standards
            if std in self.config['standards']
        )

        return datetime.now() + timedelta(days=min_frequency)

    def generate_executive_summary(self, report: ComplianceReport) -> Dict[str, Any]:
        """Generate executive summary of compliance report."""

        # Count assessments by status
        compliant = len([a for a in report.assessments if a.status == 'compliant'])
        partial = len([a for a in report.assessments if a.status == 'partial'])
        non_compliant = len([a for a in report.assessments if a.status == 'non_compliant'])
        total = len(report.assessments)

        # Theater impact summary
        theater_standards_affected = len([
            std for std, analysis in report.theater_analysis.items()
            if analysis.get('theater_detected', False)
        ])

        # Risk summary
        risk_level = report.risk_assessment.get('risk_level', 'unknown')
        deployment_risk = report.risk_assessment.get('deployment_risk', 'unknown')

        return {
            'report_id': report.report_id,
            'organization': report.organization,
            'project': report.project,
            'assessment_date': report.generation_date.strftime('%Y-%m-%d'),
            'overall_status': report.compliance_status,
            'overall_score': f"{report.overall_score:.1%}",
            'certification_status': report.certification_status,
            'standards_assessed': len(report.standards_covered),
            'requirements_summary': {
                'total': total,
                'compliant': compliant,
                'partial': partial,
                'non_compliant': non_compliant,
                'compliance_rate': f"{(compliant / total * 100):.1f}%" if total > 0 else "0%"
            },
            'theater_analysis_summary': {
                'standards_affected': theater_standards_affected,
                'theater_detected': theater_standards_affected > 0,
                'impact_level': 'high' if theater_standards_affected >= 2 else 'medium' if theater_standards_affected == 1 else 'none'
            },
            'risk_summary': {
                'risk_level': risk_level,
                'deployment_risk': deployment_risk,
                'mitigation_required': report.risk_assessment.get('mitigation_required', False)
            },
            'key_recommendations': report.recommendations[:5],  # Top 5 recommendations
            'next_review_date': report.next_review_date.strftime('%Y-%m-%d'),
            'deployment_recommendation': self._get_deployment_recommendation(report)
        }

    def _get_deployment_recommendation(self, report: ComplianceReport) -> str:
        """Get deployment recommendation based on report."""

        if report.compliance_status == 'non_compliant':
            return 'BLOCK - Address compliance issues before deployment'
        elif report.risk_assessment.get('risk_level') in ['high', 'critical']:
            return 'CONDITIONAL - Mitigate risks before deployment'
        elif report.compliance_status == 'fully_compliant':
            return 'APPROVE - Ready for deployment'
        else:
            return 'CONDITIONAL - Review partial compliance items'

    def export_compliance_report(self, report: ComplianceReport, export_path: str) -> str:
        """Export compliance report to file."""

        try:
            # Create export directory if it doesn't exist
            os.makedirs(os.path.dirname(export_path), exist_ok=True)

            # Generate comprehensive report data
            export_data = {
                'metadata': {
                    'report_id': report.report_id,
                    'generated_date': report.generation_date.isoformat(),
                    'organization': report.organization,
                    'project': report.project,
                    'report_type': report.report_type
                },
                'executive_summary': self.generate_executive_summary(report),
                'detailed_assessment': {
                    'overall_score': report.overall_score,
                    'compliance_status': report.compliance_status,
                    'standards_covered': report.standards_covered,
                    'assessment_period': [
                        report.assessment_period[0].isoformat(),
                        report.assessment_period[1].isoformat()
                    ]
                },
                'requirement_assessments': [asdict(assessment) for assessment in report.assessments],
                'theater_analysis': report.theater_analysis,
                'risk_assessment': report.risk_assessment,
                'recommendations': report.recommendations,
                'certification_status': report.certification_status,
                'next_review_date': report.next_review_date.isoformat()
            }

            # Write to file
            with open(export_path, 'w') as f:
                json.dump(export_data, f, indent=2, default=str)

            self.logger.info(f"Compliance report exported to {export_path}")

            return export_path

        except Exception as e:
            self.logger.error(f"Failed to export compliance report: {e}")
            raise

    def get_compliance_dashboard_data(self, project: str = None) -> Dict[str, Any]:
        """Get compliance data for dashboard display."""

        # This would typically query a database of recent reports
        # For now, return mock dashboard data

        return {
            'project': project or 'All Projects',
            'last_assessment_date': datetime.now().strftime('%Y-%m-%d'),
            'overall_compliance_score': 0.89,
            'compliance_status': 'mostly_compliant',
            'certification_status': 'provisional',
            'standards_status': {
                'NASA-POT10': {'score': 0.92, 'status': 'compliant'},
                'ISO-27001': {'score': 0.85, 'status': 'mostly_compliant'},
                'NIST-800-53': {'score': 0.90, 'status': 'compliant'}
            },
            'theater_detection_summary': {
                'recent_detections': 2,
                'risk_level': 'medium',
                'last_detection_date': (datetime.now() - timedelta(days=5)).strftime('%Y-%m-%d')
            },
            'upcoming_reviews': [
                {
                    'standard': 'NASA-POT10',
                    'due_date': (datetime.now() + timedelta(days=30)).strftime('%Y-%m-%d')
                },
                {
                    'standard': 'ISO-27001',
                    'due_date': (datetime.now() + timedelta(days=90)).strftime('%Y-%m-%d')
                }
            ],
            'trending_metrics': {
                'compliance_score_trend': [0.85, 0.87, 0.89],  # Last 3 months
                'theater_detection_trend': [3, 2, 1],  # Last 3 months
                'risk_score_trend': [0.3, 0.25, 0.2]  # Last 3 months
            }
        }