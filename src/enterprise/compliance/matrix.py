from src.constants.base import MAXIMUM_FUNCTION_LENGTH_LINES, MAXIMUM_NESTED_DEPTH, MAXIMUM_RETRY_ATTEMPTS
"""

Generates comprehensive compliance matrices for multiple regulatory frameworks
and provides evidence mapping for audit purposes.
"""

from lib.shared.utilities import get_logger
logger = get_logger(__name__)

class ComplianceFramework(Enum):
    """Supported compliance frameworks"""
    SOC2_TYPE1 = "soc2-type1"
    SOC2_TYPE2 = "soc2-type2" 
    ISO27001 = "iso27001"
    NIST_CSF = "nist-csf"
    GDPR = "gdpr"
    HIPAA = "hipaa"
    PCI_DSS = "pci-dss"
    CUSTOM = "custom"

class ComplianceStatus(Enum):
    """Compliance status levels"""
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    IMPLEMENTED = "implemented"  
    TESTED = "tested"
    COMPLIANT = "compliant"
    NON_COMPLIANT = "non_compliant"
    NEEDS_REVIEW = "needs_review"

@dataclass
class Control:
    """Individual compliance control"""
    id: str
    title: str
    description: str
    framework: ComplianceFramework
    category: str
    subcategory: Optional[str] = None
    status: ComplianceStatus = ComplianceStatus.NOT_STARTED
    implementation_date: Optional[date] = None
    last_tested: Optional[date] = None
    next_review: Optional[date] = None
    owner: Optional[str] = None
    evidence_files: List[str] = field(default_factory=list)
    test_results: List[Dict[str, Any]] = field(default_factory=list)
    notes: List[str] = field(default_factory=list)
    risk_rating: str = "medium"  # low, medium, high, critical
    automation_level: str = "manual"  # manual, semi-automated, automated
    dependencies: List[str] = field(default_factory=list)

@dataclass
class ComplianceReport:
    """Comprehensive compliance report"""
    framework: ComplianceFramework
    report_date: datetime = field(default_factory=datetime.now)
    overall_status: float = 0.0  # Percentage compliance
    total_controls: int = 0
    compliant_controls: int = 0
    in_progress_controls: int = 0
    non_compliant_controls: int = 0
    risk_summary: Dict[str, int] = field(default_factory=dict)
    category_breakdown: Dict[str, Dict[str, int]] = field(default_factory=dict)
    recommendations: List[str] = field(default_factory=list)
    evidence_gaps: List[str] = field(default_factory=list)
    next_actions: List[Dict[str, Any]] = field(default_factory=list)

class ComplianceMatrix:
    """
    Comprehensive compliance matrix generator and manager
    
    Manages compliance across multiple frameworks with:
    - Control mapping and status tracking
    - Evidence collection and validation
    - Automated compliance reporting
    - Gap analysis and remediation planning
    """
    
    def __init__(self, project_root: Path):
        self.project_root = Path(project_root)
        self.controls: Dict[str, Control] = {}
        self.frameworks: Set[ComplianceFramework] = set()
        self.evidence_directory = project_root / ".compliance" / "evidence"
        self.evidence_directory.mkdir(parents=True, exist_ok=True)
        
    def add_framework(self, framework: ComplianceFramework):
        """Add compliance framework and load controls"""
        self.frameworks.add(framework)
        self._load_framework_controls(framework)
        
    def _load_framework_controls(self, framework: ComplianceFramework):
        """Load predefined controls for framework"""
        if framework == ComplianceFramework.SOC2_TYPE2:
            self._load_soc2_controls()
        elif framework == ComplianceFramework.ISO27001:
            self._load_iso27001_controls()
        elif framework == ComplianceFramework.NIST_CSF:
            self._load_nist_controls()
        elif framework == ComplianceFramework.GDPR:
            self._load_gdpr_controls()
            
    def _load_soc2_controls(self):
        """Load SOC 2 Type II controls"""
        soc2_controls = [
            # Security Controls
            Control(
                id="CC6.1",
                title="Logical and Physical Access Controls",
                description="The entity implements logical and physical access controls to protect against threats from sources outside its system boundaries.",
                framework=ComplianceFramework.SOC2_TYPE2,
                category="Security",
                subcategory="Access Controls",
                risk_rating="high"
            ),
            Control(
                id="CC6.2", 
                title="User Access Management",
                description="Prior to issuing system credentials, the entity registers and authorizes new internal and external users.",
                framework=ComplianceFramework.SOC2_TYPE2,
                category="Security",
                subcategory="User Management",
                risk_rating="high"
            ),
            Control(
                id="CC6.3",
                title="User Access Removal",
                description="The entity authorizes, modifies, or removes access to data, software, functions, and other protected information assets.",
                framework=ComplianceFramework.SOC2_TYPE2,
                category="Security",
                subcategory="User Management",
                risk_rating="high"
            ),
            # Availability Controls
            Control(
                id="A1.1",
                title="System Availability Management",
                description="The entity maintains, monitors, and evaluates current processing capacity and use of system components.",
                framework=ComplianceFramework.SOC2_TYPE2,
                category="Availability",
                subcategory="Capacity Management",
                risk_rating="medium"
            ),
            Control(
                id="A1.2",
                title="Backup and Recovery",
                description="The entity authorizes, designs, develops, implements, operates, approves, maintains, and monitors environmental protections.",
                framework=ComplianceFramework.SOC2_TYPE2,
                category="Availability",
                subcategory="Business Continuity",
                risk_rating="high"
            ),
            # Processing Integrity Controls
            Control(
                id="PI1.1", 
                title="Data Processing Integrity",
                description="The entity implements controls over data processing to meet the entity's objectives.",
                framework=ComplianceFramework.SOC2_TYPE2,
                category="Processing Integrity",
                risk_rating="medium"
            ),
            # Confidentiality Controls
            Control(
                id="C1.1",
                title="Confidential Information Protection", 
                description="The entity identifies and maintains confidential information to meet the entity's objectives.",
                framework=ComplianceFramework.SOC2_TYPE2,
                category="Confidentiality",
                risk_rating="high"
            ),
            # Privacy Controls  
            Control(
                id="P1.1",
                title="Privacy Notice Management",
                description="The entity provides notice to data subjects about privacy practices.",
                framework=ComplianceFramework.SOC2_TYPE2,
                category="Privacy",
                risk_rating="medium"
            )
        ]
        
        for control in soc2_controls:
            self.controls[control.id] = control
            
    def _load_iso27001_controls(self):
        """Load ISO 27001 controls"""
        iso27001_controls = [
            Control(
                id="A.5.1.1",
                title="Information Security Policy",
                description="An information security policy shall be defined, approved by management, published and communicated to employees.",
                framework=ComplianceFramework.ISO27001,
                category="Information Security Policies",
                risk_rating="high"
            ),
            Control(
                id="A.8.1.1",
                title="Inventory of Assets", 
                description="Assets associated with information and information processing facilities shall be identified.",
                framework=ComplianceFramework.ISO27001,
                category="Asset Management",
                risk_rating="medium"
            ),
            Control(
                id="A.9.1.1",
                title="Access Control Policy",
                description="An access control policy shall be established, documented and reviewed based on business and information security requirements.",
                framework=ComplianceFramework.ISO27001,
                category="Access Control",
                risk_rating="high"
            ),
            Control(
                id="A.12.1.1",
                title="Operational Procedures",
                description="Operating procedures shall be documented and made available to all users who need them.",
                framework=ComplianceFramework.ISO27001,
                category="Operations Security",
                risk_rating="medium"
            ),
            Control(
                id="A.14.1.1",
                title="Security Requirements Analysis",
                description="Information security requirements shall be included in the requirements for new information systems.",
                framework=ComplianceFramework.ISO27001,
                category="System Acquisition", 
                risk_rating="high"
            )
        ]
        
        for control in iso27001_controls:
            self.controls[control.id] = control
            
    def _load_nist_controls(self):
        """Load NIST Cybersecurity Framework controls"""
        nist_controls = [
            Control(
                id="ID.AM-1",
                title="Physical devices and systems within the organization are inventoried",
                description="Maintain an inventory of physical devices and systems within the organization.",
                framework=ComplianceFramework.NIST_CSF,
                category="Identify",
                subcategory="Asset Management",
                risk_rating="medium"
            ),
            Control(
                id="PR.AC-1",
                title="Identities and credentials are issued, managed, verified, revoked, and audited",
                description="Manage identities and credentials for authorized devices, users and processes.",
                framework=ComplianceFramework.NIST_CSF,
                category="Protect", 
                subcategory="Access Control",
                risk_rating="high"
            ),
            Control(
                id="DE.CM-1",
                title="The network is monitored to detect potential cybersecurity events",
                description="Establish and maintain network monitoring capabilities.",
                framework=ComplianceFramework.NIST_CSF,
                category="Detect",
                subcategory="Continuous Monitoring",
                risk_rating="high"
            ),
            Control(
                id="RS.RP-1", 
                title="Response plan is executed during or after an incident",
                description="Execute response plans during or after a cybersecurity incident.",
                framework=ComplianceFramework.NIST_CSF,
                category="Respond",
                subcategory="Response Planning", 
                risk_rating="high"
            ),
            Control(
                id="RC.RP-1",
                title="Recovery plan is executed during or after a cybersecurity incident",
                description="Execute recovery plans during or after a cybersecurity incident.",
                framework=ComplianceFramework.NIST_CSF,
                category="Recover",
                subcategory="Recovery Planning",
                risk_rating="high"
            )
        ]
        
        for control in nist_controls:
            self.controls[control.id] = control
            
    def _load_gdpr_controls(self):
        """Load GDPR compliance controls"""
        gdpr_controls = [
            Control(
                id="Art.5",
                title="Principles relating to processing of personal data",
                description="Personal data shall be processed lawfully, fairly and in a transparent manner.",
                framework=ComplianceFramework.GDPR,
                category="Data Processing Principles",
                risk_rating="high"
            ),
            Control(
                id="Art.6",
                title="Lawfulness of processing", 
                description="Processing shall be lawful only if and to the extent that at least one legal basis applies.",
                framework=ComplianceFramework.GDPR,
                category="Legal Basis",
                risk_rating="critical"
            ),
            Control(
                id="Art.25",
                title="Data protection by design and by default",
                description="Implement appropriate technical and organisational measures to ensure data protection principles.",
                framework=ComplianceFramework.GDPR,
                category="Data Protection",
                risk_rating="high"
            ),
            Control(
                id="Art.32",
                title="Security of processing",
                description="Implement appropriate technical and organisational measures to ensure security of processing.",
                framework=ComplianceFramework.GDPR,
                category="Security Measures",
                risk_rating="high"
            ),
            Control(
                id="Art.33",
                title="Notification of a personal data breach to the supervisory authority",
                description="Notify personal data breach to supervisory authority within 72 hours.",
                framework=ComplianceFramework.GDPR,
                category="Breach Notification",
                risk_rating="critical"
            )
        ]
        
        for control in gdpr_controls:
            self.controls[control.id] = control
            
    def update_control_status(self, control_id: str, status: ComplianceStatus,
                            evidence_files: Optional[List[str]] = None,
                            notes: Optional[str] = None):
        """Update control implementation status"""
        if control_id not in self.controls:
            raise ValueError(f"Control {control_id} not found")
            
        control = self.controls[control_id]
        control.status = status
        
        if status == ComplianceStatus.IMPLEMENTED:
            control.implementation_date = date.today()
        elif status == ComplianceStatus.TESTED:
            control.last_tested = date.today()
        elif status == ComplianceStatus.COMPLIANT:
            control.last_tested = date.today()
            
        if evidence_files:
            control.evidence_files.extend(evidence_files)
            
        if notes:
            control.notes.append(f"{datetime.now().isoformat()}: {notes}")
            
        logger.info(f"Updated control {control_id} to status {status.value}")
        
    def add_evidence(self, control_id: str, evidence_file: Path, 
                    description: Optional[str] = None):
        """Add evidence file for control"""
        if control_id not in self.controls:
            raise ValueError(f"Control {control_id} not found")
            
        # Copy evidence to compliance directory
        evidence_dest = self.evidence_directory / control_id / evidence_file.name
        evidence_dest.parent.mkdir(parents=True, exist_ok=True)
        evidence_dest.write_bytes(evidence_file.read_bytes())
        
        # Update control
        control = self.controls[control_id]
        control.evidence_files.append(str(evidence_dest))
        
        if description:
            control.notes.append(f"{datetime.now().isoformat()}: Evidence added: {description}")
            
        logger.info(f"Added evidence for control {control_id}: {evidence_file.name}")
        
    def generate_compliance_report(self, framework: ComplianceFramework) -> ComplianceReport:
        """Generate comprehensive compliance report for framework"""
        framework_controls = [
            control for control in self.controls.values()
            if control.framework == framework
        ]
        
        if not framework_controls:
            raise ValueError(f"No controls found for framework {framework.value}")
            
        report = ComplianceReport(framework=framework)
        report.total_controls = len(framework_controls)
        
        # Calculate status breakdown
        status_counts = {}
        risk_counts = {"low": 0, "medium": 0, "high": 0, "critical": 0}
        category_counts = {}
        
        for control in framework_controls:
            # Status counting
            status = control.status.value
            status_counts[status] = status_counts.get(status, 0) + 1
            
            # Risk counting
            risk_counts[control.risk_rating] += 1
            
            # Category counting
            if control.category not in category_counts:
                category_counts[control.category] = {}
            cat_status = category_counts[control.category]
            cat_status[status] = cat_status.get(status, 0) + 1
            
        report.compliant_controls = status_counts.get("compliant", 0)
        report.in_progress_controls = (
            status_counts.get("in_progress", 0) + 
            status_counts.get("implemented", 0) +
            status_counts.get("tested", 0)
        )
        report.non_compliant_controls = status_counts.get("non_compliant", 0)
        report.overall_status = (report.compliant_controls / report.total_controls) * 100
        report.risk_summary = risk_counts
        report.category_breakdown = category_counts
        
        # Generate recommendations
        report.recommendations = self._generate_recommendations(framework_controls)
        
        # Identify evidence gaps
        report.evidence_gaps = self._identify_evidence_gaps(framework_controls)
        
        # Generate next actions
        report.next_actions = self._generate_next_actions(framework_controls)
        
        return report
        
    def _generate_recommendations(self, controls: List[Control]) -> List[str]:
        """Generate compliance recommendations"""
        recommendations = []
        
        # High-risk non-compliant controls
        high_risk_non_compliant = [
            c for c in controls 
            if c.status == ComplianceStatus.NON_COMPLIANT and c.risk_rating in ["high", "critical"]
        ]
        
        if high_risk_non_compliant:
            recommendations.append(
                f"Prioritize {len(high_risk_non_compliant)} high/critical risk non-compliant controls"
            )
            
        # Controls without evidence
        no_evidence = [c for c in controls if not c.evidence_files]
        if no_evidence:
            recommendations.append(f"Collect evidence for {len(no_evidence)} controls")
            
        # Controls needing testing
        need_testing = [
            c for c in controls 
            if c.status == ComplianceStatus.IMPLEMENTED and not c.last_tested
        ]
        if need_testing:
            recommendations.append(f"Test {len(need_testing)} implemented controls")
            
        # Overdue reviews
        from datetime import timedelta
        overdue = [
            c for c in controls 
            if c.next_review and c.next_review < date.today()
        ]
        if overdue:
            recommendations.append(f"Review {len(overdue)} overdue controls")
            
        return recommendations
        
    def _identify_evidence_gaps(self, controls: List[Control]) -> List[str]:
        """Identify evidence collection gaps"""
        gaps = []
        
        for control in controls:
            if control.status in [ComplianceStatus.IMPLEMENTED, ComplianceStatus.COMPLIANT]:
                if not control.evidence_files:
                    gaps.append(f"{control.id}: {control.title}")
                    
        return gaps
        
    def _generate_next_actions(self, controls: List[Control]) -> List[Dict[str, Any]]:
        """Generate prioritized next actions"""
        actions = []
        
        # Sort by risk and status
        priority_order = {
            ComplianceStatus.NON_COMPLIANT: 1,
            ComplianceStatus.NOT_STARTED: 2,
            ComplianceStatus.IN_PROGRESS: MAXIMUM_RETRY_ATTEMPTS,
            ComplianceStatus.IMPLEMENTED: 4,
            ComplianceStatus.TESTED: MAXIMUM_NESTED_DEPTH,
            ComplianceStatus.NEEDS_REVIEW: MAXIMUM_RETRY_ATTEMPTS
        }
        
        risk_order = {"critical": 1, "high": 2, "medium": 3, "low": 4}
        
        sorted_controls = sorted(
            controls,
            key=lambda c: (priority_order.get(c.status, 6), risk_order.get(c.risk_rating, 5))
        )
        
        for control in sorted_controls[:10]:  # Top 10 priorities
            if control.status != ComplianceStatus.COMPLIANT:
                action = {
                    "control_id": control.id,
                    "title": control.title,
                    "priority": f"{control.risk_rating}-{control.status.value}",
                    "action": self._get_next_action_for_control(control),
                    "owner": control.owner or "Unassigned"
                }
                actions.append(action)
                
        return actions
        
    def _get_next_action_for_control(self, control: Control) -> str:
        """Get next action recommendation for control"""
        if control.status == ComplianceStatus.NOT_STARTED:
            return "Begin implementation planning"
        elif control.status == ComplianceStatus.IN_PROGRESS:
            return "Complete implementation"
        elif control.status == ComplianceStatus.IMPLEMENTED:
            return "Collect evidence and test"
        elif control.status == ComplianceStatus.TESTED:
            return "Review test results and validate compliance"
        elif control.status == ComplianceStatus.NON_COMPLIANT:
            return "Remediate non-compliant areas"
        elif control.status == ComplianceStatus.NEEDS_REVIEW:
            return "Conduct compliance review"
        else:
            return "Monitor and maintain"
            
    def export_compliance_matrix(self, output_file: Path):
        """Export compliance matrix to JSON"""
        matrix_data = {
            "export_date": datetime.now().isoformat(),
            "frameworks": [f.value for f in self.frameworks],
            "controls": {}
        }
        
        for control_id, control in self.controls.items():
            matrix_data["controls"][control_id] = {
                "id": control.id,
                "title": control.title,
                "description": control.description,
                "framework": control.framework.value,
                "category": control.category,
                "subcategory": control.subcategory,
                "status": control.status.value,
                "implementation_date": control.implementation_date.isoformat() if control.implementation_date else None,
                "last_tested": control.last_tested.isoformat() if control.last_tested else None,
                "next_review": control.next_review.isoformat() if control.next_review else None,
                "owner": control.owner,
                "evidence_files": control.evidence_files,
                "notes": control.notes,
                "risk_rating": control.risk_rating,
                "automation_level": control.automation_level,
                "dependencies": control.dependencies
            }
            
        with open(output_file, 'w') as f:
            json.dump(matrix_data, f, indent=2)
            
        logger.info(f"Compliance matrix exported to {output_file}")
        
    def get_framework_coverage(self) -> Dict[str, Dict[str, Any]]:
        """Get coverage summary for all frameworks"""
        coverage = {}
        
        for framework in self.frameworks:
            framework_controls = [
                c for c in self.controls.values() 
                if c.framework == framework
            ]
            
            total = len(framework_controls)
            compliant = len([c for c in framework_controls if c.status == ComplianceStatus.COMPLIANT])
            
            coverage[framework.value] = {
                "total_controls": total,
                "compliant_controls": compliant,
                "compliance_percentage": (compliant / total * MAXIMUM_FUNCTION_LENGTH_LINES) if total > 0 else 0,
                "status_breakdown": {
                    status.value: len([c for c in framework_controls if c.status == status])
                    for status in ComplianceStatus
                }
            }
            
        return coverage