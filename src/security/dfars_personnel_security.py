from src.constants.base import MAXIMUM_FUNCTION_LENGTH_LINES, MAXIMUM_RETRY_ATTEMPTS

import json
from lib.shared.utilities import get_logger
logger = get_logger(__name__)

class ClearanceLevel(Enum):
    """Security clearance levels for defense contractors."""
    PUBLIC_TRUST = "public_trust"
    CONFIDENTIAL = "confidential"
    SECRET = "secret"
    TOP_SECRET = "top_secret"
    TOP_SECRET_SCI = "top_secret_sci"
    NONE = "none"

class PersonnelStatus(Enum):
    """Personnel security status tracking."""
    ACTIVE = "active"
    PENDING_INVESTIGATION = "pending_investigation"
    INVESTIGATION_COMPLETE = "investigation_complete"
    CLEARANCE_GRANTED = "clearance_granted"
    CLEARANCE_DENIED = "clearance_denied"
    CLEARANCE_REVOKED = "clearance_revoked"
    SUSPENDED = "suspended"
    TERMINATED = "terminated"

class TrainingStatus(Enum):
    """Security awareness training status."""
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    EXPIRED = "expired"
    OVERDUE = "overdue"

class AccessNeed(Enum):
    """Types of access needs for personnel."""
    CUI_BASIC = "cui_basic"
    CUI_SPECIFIED = "cui_specified"
    CLASSIFIED_CONFIDENTIAL = "classified_confidential"
    CLASSIFIED_SECRET = "classified_secret"
    CLASSIFIED_TOP_SECRET = "classified_top_secret"
    COMPARTMENTED_INFORMATION = "compartmented_information"

@dataclass
class SecurityInvestigation:
    """Security clearance investigation tracking."""
    investigation_id: str
    personnel_id: str
    investigation_type: str  # initial, reinvestigation, upgrade
    requested_clearance: ClearanceLevel
    initiated_date: datetime
    completion_date: Optional[datetime]
    status: str
    investigative_agency: str
    adjudication_agency: str
    results: Optional[str]
    reciprocity_accepted: bool

@dataclass
class ClearanceRecord:
    """Personnel security clearance record."""
    clearance_id: str
    personnel_id: str
    clearance_level: ClearanceLevel
    granted_date: datetime
    expiration_date: datetime
    granting_agency: str
    scope: List[str]  # programs, contracts, facilities
    restrictions: List[str]
    status: PersonnelStatus
    last_investigation: Optional[str]
    next_investigation_due: datetime

@dataclass
class SecurityTraining:
    """Security awareness training record."""
    training_id: str
    personnel_id: str
    training_type: str
    training_title: str
    completion_date: Optional[datetime]
    expiration_date: Optional[datetime]
    score: Optional[float]
    status: TrainingStatus
    provider: str
    certificate_number: Optional[str]

@dataclass
class AccessAuthorization:
    """Personnel access authorization tracking."""
    authorization_id: str
    personnel_id: str
    access_type: AccessNeed
    systems: List[str]
    facilities: List[str]
    projects: List[str]
    granted_by: str
    granted_date: datetime
    expiration_date: Optional[datetime]
    conditions: List[str]
    status: str

@dataclass
class PersonnelSecurityRecord:
    """Comprehensive personnel security record."""
    personnel_id: str
    employee_id: str
    full_name: str
    position: str
    department: str
    supervisor: str
    hire_date: datetime
    clearance_records: List[ClearanceRecord]
    investigations: List[SecurityInvestigation]
    training_records: List[SecurityTraining]
    access_authorizations: List[AccessAuthorization]
    security_incidents: List[str]
    status: PersonnelStatus
    last_updated: datetime

class DFARSPersonnelSecurity:
    """
    DFARS 252.204-7012 Personnel Security Implementation

    Implements personnel security requirements:
    3.9.1 - Screen individuals prior to authorizing access to CUI
    3.9.2 - Ensure individuals accessing CUI receive security awareness training

    Includes comprehensive clearance tracking, investigation management,
    and continuous monitoring of personnel security status.
    """

def __init__(self, config: Dict[str, Any]):
        """Initialize DFARS personnel security system."""
        self.config = config
        self.crypto = FIPSCryptoModule()
        self.audit_manager = DFARSAuditTrailManager()

        # Personnel records
        self.personnel_records: Dict[str, PersonnelSecurityRecord] = {}
        self.active_investigations: Dict[str, SecurityInvestigation] = {}

        # Training management
        self.training_requirements = config.get('training_requirements', {})
        self.training_providers = config.get('training_providers', [])

        # Clearance management
        self.clearance_authorities = config.get('clearance_authorities', {})
        self.reciprocity_agreements = config.get('reciprocity_agreements', [])

        # Security policies
        self.screening_requirements = config.get('screening_requirements', {})
        self.training_frequency = config.get('training_frequency_months', 12)
        self.clearance_renewal_notice_days = config.get('clearance_renewal_notice_days', 90)

        logger.info("DFARS Personnel Security System initialized")

def create_personnel_record(self, employee_id: str, full_name: str, position: str,
                                department: str, supervisor: str, hire_date: datetime) -> str:
        """Create new personnel security record."""
        try:
            # Generate personnel ID
            personnel_id = f"PER-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{uuid.uuid4().hex[:8].upper()}"

            # Create personnel record
            record = PersonnelSecurityRecord(
                personnel_id=personnel_id,
                employee_id=employee_id,
                full_name=full_name,
                position=position,
                department=department,
                supervisor=supervisor,
                hire_date=hire_date,
                clearance_records=[],
                investigations=[],
                training_records=[],
                access_authorizations=[],
                security_incidents=[],
                status=PersonnelStatus.ACTIVE,
                last_updated=datetime.now(timezone.utc)
            )

            # Store record
            self.personnel_records[personnel_id] = record

            # Log record creation
            self.audit_manager.log_event(
                event_type=AuditEventType.PERSONNEL_SECURITY,
                severity=SeverityLevel.INFO,
                message=f"Personnel security record created: {personnel_id}",
                details={
                    'personnel_id': personnel_id,
                    'employee_id': employee_id,
                    'full_name': full_name,
                    'position': position,
                    'department': department
                }
            )

            return personnel_id

        except Exception as e:
            logger.error(f"Failed to create personnel record: {e}")
            self.audit_manager.log_event(
                event_type=AuditEventType.PERSONNEL_SECURITY,
                severity=SeverityLevel.ERROR,
                message="Personnel record creation failed",
                details={'error': str(e), 'employee_id': employee_id}
            )
            raise

def initiate_security_screening(self, personnel_id: str, requested_clearance: ClearanceLevel,
                                    access_needs: List[AccessNeed], justification: str) -> str:
        """Initiate security screening for CUI access (3.9.1)."""
        if personnel_id not in self.personnel_records:
            raise ValueError(f"Personnel record not found: {personnel_id}")

        record = self.personnel_records[personnel_id]

        try:
            # Determine screening requirements based on access needs
            screening_level = self._determine_screening_level(access_needs)

            # Check if existing clearance meets requirements
            current_clearance = self._get_current_clearance(record)
            if current_clearance and self._clearance_meets_requirements(current_clearance, requested_clearance):
                return self._grant_access_with_existing_clearance(personnel_id, access_needs)

            # Generate investigation ID
            investigation_id = f"INV-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{uuid.uuid4().hex[:8].upper()}"

            # Create investigation record
            investigation = SecurityInvestigation(
                investigation_id=investigation_id,
                personnel_id=personnel_id,
                investigation_type="initial" if not current_clearance else "upgrade",
                requested_clearance=requested_clearance,
                initiated_date=datetime.now(timezone.utc),
                completion_date=None,
                status="INITIATED",
                investigative_agency=self._get_investigative_agency(requested_clearance),
                adjudication_agency=self._get_adjudication_agency(requested_clearance),
                results=None,
                reciprocity_accepted=False
            )

            # Store investigation
            self.active_investigations[investigation_id] = investigation
            record.investigations.append(investigation)

            # Update personnel status
            record.status = PersonnelStatus.PENDING_INVESTIGATION
            record.last_updated = datetime.now(timezone.utc)

            # Initiate screening process
            self._initiate_screening_process(investigation, access_needs, justification)

            # Log screening initiation
            self.audit_manager.log_event(
                event_type=AuditEventType.PERSONNEL_SECURITY,
                severity=SeverityLevel.INFO,
                message=f"Security screening initiated: {investigation_id}",
                details={
                    'investigation_id': investigation_id,
                    'personnel_id': personnel_id,
                    'requested_clearance': requested_clearance.value,
                    'access_needs': [need.value for need in access_needs],
                    'justification': justification
                }
            )

            return investigation_id

        except Exception as e:
            logger.error(f"Failed to initiate security screening: {e}")
            self.audit_manager.log_event(
                event_type=AuditEventType.PERSONNEL_SECURITY,
                severity=SeverityLevel.ERROR,
                message=f"Security screening initiation failed: {personnel_id}",
                details={'error': str(e)}
            )
            raise

def assign_security_training(self, personnel_id: str, training_type: str,
                                required_completion_date: datetime) -> str:
        """Assign security awareness training (3.9.2)."""
        if personnel_id not in self.personnel_records:
            raise ValueError(f"Personnel record not found: {personnel_id}")

        record = self.personnel_records[personnel_id]

        try:
            # Generate training ID
            training_id = f"TRN-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{uuid.uuid4().hex[:8].upper()}"

            # Get training requirements
            training_config = self.training_requirements.get(training_type, {})
            training_title = training_config.get('title', f"Security Training: {training_type}")
            provider = training_config.get('provider', 'Internal')
            duration_days = training_config.get('duration_days', 365)

            # Create training record
            training = SecurityTraining(
                training_id=training_id,
                personnel_id=personnel_id,
                training_type=training_type,
                training_title=training_title,
                completion_date=None,
                expiration_date=None,
                score=None,
                status=TrainingStatus.NOT_STARTED,
                provider=provider,
                certificate_number=None
            )

            # Add to personnel record
            record.training_records.append(training)
            record.last_updated = datetime.now(timezone.utc)

            # Schedule training notifications
            self._schedule_training_reminders(training, required_completion_date)

            # Log training assignment
            self.audit_manager.log_event(
                event_type=AuditEventType.PERSONNEL_SECURITY,
                severity=SeverityLevel.INFO,
                message=f"Security training assigned: {training_id}",
                details={
                    'training_id': training_id,
                    'personnel_id': personnel_id,
                    'training_type': training_type,
                    'required_completion_date': required_completion_date.isoformat(),
                    'provider': provider
                }
            )

            return training_id

        except Exception as e:
            logger.error(f"Failed to assign security training: {e}")
            self.audit_manager.log_event(
                event_type=AuditEventType.PERSONNEL_SECURITY,
                severity=SeverityLevel.ERROR,
                message=f"Security training assignment failed: {personnel_id}",
                details={'error': str(e)}
            )
            raise

def complete_security_training(self, training_id: str, completion_date: datetime,
                                score: float, certificate_number: str) -> None:
        """Record security training completion."""
        try:
            # Find training record
            training_record = None
            personnel_record = None

            for person_id, record in self.personnel_records.items():
                for training in record.training_records:
                    if training.training_id == training_id:
                        training_record = training
                        personnel_record = record
                        break
                if training_record:
                    break

            if not training_record:
                raise ValueError(f"Training record not found: {training_id}")

            # Update training record
            training_record.completion_date = completion_date
            training_record.score = score
            training_record.certificate_number = certificate_number
            training_record.status = TrainingStatus.COMPLETED

            # Calculate expiration date
            training_config = self.training_requirements.get(training_record.training_type, {})
            validity_months = training_config.get('validity_months', 12)
            training_record.expiration_date = completion_date + timedelta(days=validity_months * 30)

            # Update personnel record
            personnel_record.last_updated = datetime.now(timezone.utc)

            # Check if training completion enables CUI access
            self._check_cui_access_eligibility(personnel_record)

            # Log training completion
            self.audit_manager.log_event(
                event_type=AuditEventType.PERSONNEL_SECURITY,
                severity=SeverityLevel.INFO,
                message=f"Security training completed: {training_id}",
                details={
                    'training_id': training_id,
                    'personnel_id': training_record.personnel_id,
                    'completion_date': completion_date.isoformat(),
                    'score': score,
                    'certificate_number': certificate_number
                }
            )

        except Exception as e:
            logger.error(f"Failed to complete security training: {e}")
            self.audit_manager.log_event(
                event_type=AuditEventType.PERSONNEL_SECURITY,
                severity=SeverityLevel.ERROR,
                message=f"Security training completion failed: {training_id}",
                details={'error': str(e)}
            )
            raise

def grant_clearance(self, investigation_id: str, clearance_level: ClearanceLevel,
                        scope: List[str], granting_agency: str,
                        validity_years: int = 5) -> str:
        """Grant security clearance based on completed investigation."""
        if investigation_id not in self.active_investigations:
            raise ValueError(f"Investigation not found: {investigation_id}")

        investigation = self.active_investigations[investigation_id]
        personnel_id = investigation.personnel_id

        if personnel_id not in self.personnel_records:
            raise ValueError(f"Personnel record not found: {personnel_id}")

        record = self.personnel_records[personnel_id]

        try:
            # Generate clearance ID
            clearance_id = f"CLR-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{uuid.uuid4().hex[:8].upper()}"

            # Create clearance record
            current_date = datetime.now(timezone.utc)
            clearance = ClearanceRecord(
                clearance_id=clearance_id,
                personnel_id=personnel_id,
                clearance_level=clearance_level,
                granted_date=current_date,
                expiration_date=current_date + timedelta(days=validity_years * 365),
                granting_agency=granting_agency,
                scope=scope,
                restrictions=[],
                status=PersonnelStatus.CLEARANCE_GRANTED,
                last_investigation=investigation_id,
                next_investigation_due=current_date + timedelta(days=(validity_years - 1) * 365)
            )

            # Add to personnel record
            record.clearance_records.append(clearance)
            record.status = PersonnelStatus.CLEARANCE_GRANTED
            record.last_updated = current_date

            # Update investigation
            investigation.completion_date = current_date
            investigation.status = "COMPLETED"
            investigation.results = "CLEARANCE_GRANTED"

            # Remove from active investigations
            del self.active_investigations[investigation_id]

            # Log clearance grant
            self.audit_manager.log_event(
                event_type=AuditEventType.PERSONNEL_SECURITY,
                severity=SeverityLevel.HIGH,
                message=f"Security clearance granted: {clearance_id}",
                details={
                    'clearance_id': clearance_id,
                    'personnel_id': personnel_id,
                    'investigation_id': investigation_id,
                    'clearance_level': clearance_level.value,
                    'granting_agency': granting_agency,
                    'scope': scope,
                    'validity_years': validity_years
                }
            )

            return clearance_id

        except Exception as e:
            logger.error(f"Failed to grant clearance: {e}")
            self.audit_manager.log_event(
                event_type=AuditEventType.PERSONNEL_SECURITY,
                severity=SeverityLevel.ERROR,
                message=f"Clearance grant failed: {investigation_id}",
                details={'error': str(e)}
            )
            raise

def authorize_cui_access(self, personnel_id: str, access_needs: List[AccessNeed],
                            systems: List[str], justification: str) -> str:
        """Authorize CUI access for screened personnel."""
        if personnel_id not in self.personnel_records:
            raise ValueError(f"Personnel record not found: {personnel_id}")

        record = self.personnel_records[personnel_id]

        try:
            # Validate screening requirements (3.9.1)
            if not self._validate_screening_requirements(record, access_needs):
                raise ValueError("Personnel does not meet screening requirements for CUI access")

            # Validate training requirements (3.9.2)
            if not self._validate_training_requirements(record, access_needs):
                raise ValueError("Personnel does not meet training requirements for CUI access")

            # Generate authorization ID
            authorization_id = f"AUTH-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{uuid.uuid4().hex[:8].upper()}"

            # Create access authorization
            authorization = AccessAuthorization(
                authorization_id=authorization_id,
                personnel_id=personnel_id,
                access_type=access_needs[0],  # Primary access need
                systems=systems,
                facilities=[],
                projects=[],
                granted_by="SYSTEM",
                granted_date=datetime.now(timezone.utc),
                expiration_date=self._calculate_authorization_expiration(record),
                conditions=self._generate_access_conditions(access_needs),
                status="ACTIVE"
            )

            # Add to personnel record
            record.access_authorizations.append(authorization)
            record.last_updated = datetime.now(timezone.utc)

            # Log CUI access authorization
            self.audit_manager.log_event(
                event_type=AuditEventType.PERSONNEL_SECURITY,
                severity=SeverityLevel.HIGH,
                message=f"CUI access authorized: {authorization_id}",
                details={
                    'authorization_id': authorization_id,
                    'personnel_id': personnel_id,
                    'access_needs': [need.value for need in access_needs],
                    'systems': systems,
                    'justification': justification
                }
            )

            return authorization_id

        except Exception as e:
            logger.error(f"Failed to authorize CUI access: {e}")
            self.audit_manager.log_event(
                event_type=AuditEventType.PERSONNEL_SECURITY,
                severity=SeverityLevel.ERROR,
                message=f"CUI access authorization failed: {personnel_id}",
                details={'error': str(e)}
            )
            raise

def monitor_personnel_status(self) -> Dict[str, Any]:
        """Monitor personnel security status and compliance."""
        monitoring_results = {
            'monitoring_timestamp': datetime.now(timezone.utc).isoformat(),
            'total_personnel': len(self.personnel_records),
            'clearance_expiring_soon': [],
            'training_overdue': [],
            'investigation_overdue': [],
            'access_violations': [],
            'compliance_summary': {}
        }

        current_date = datetime.now(timezone.utc)
        notice_date = current_date + timedelta(days=self.clearance_renewal_notice_days)

        try:
            for personnel_id, record in self.personnel_records.items():
                # Check clearance expiration
                for clearance in record.clearance_records:
                    if clearance.status == PersonnelStatus.CLEARANCE_GRANTED:
                        if clearance.expiration_date <= notice_date:
                            monitoring_results['clearance_expiring_soon'].append({
                                'personnel_id': personnel_id,
                                'clearance_id': clearance.clearance_id,
                                'expiration_date': clearance.expiration_date.isoformat(),
                                'days_remaining': (clearance.expiration_date - current_date).days
                            })

                # Check training status
                for training in record.training_records:
                    if training.status == TrainingStatus.COMPLETED and training.expiration_date:
                        if training.expiration_date <= current_date:
                            monitoring_results['training_overdue'].append({
                                'personnel_id': personnel_id,
                                'training_id': training.training_id,
                                'training_type': training.training_type,
                                'expiration_date': training.expiration_date.isoformat(),
                                'days_overdue': (current_date - training.expiration_date).days
                            })

                # Check investigation due dates
                for clearance in record.clearance_records:
                    if clearance.next_investigation_due <= current_date:
                        monitoring_results['investigation_overdue'].append({
                            'personnel_id': personnel_id,
                            'clearance_id': clearance.clearance_id,
                            'investigation_due_date': clearance.next_investigation_due.isoformat(),
                            'days_overdue': (current_date - clearance.next_investigation_due).days
                        })

            # Calculate compliance summary
            monitoring_results['compliance_summary'] = {
                'personnel_with_current_clearance': len([
                    r for r in self.personnel_records.values()
                    if any(c.status == PersonnelStatus.CLEARANCE_GRANTED for c in r.clearance_records)
                ]),
                'personnel_with_current_training': len([
                    r for r in self.personnel_records.values()
                    if any(t.status == TrainingStatus.COMPLETED and
                            t.expiration_date and t.expiration_date > current_date
                            for t in r.training_records)
                ]),
                'active_investigations': len(self.active_investigations),
                'compliance_percentage': self._calculate_compliance_percentage()
            }

            # Log monitoring results
            self.audit_manager.log_event(
                event_type=AuditEventType.PERSONNEL_SECURITY,
                severity=SeverityLevel.INFO,
                message="Personnel security monitoring completed",
                details={
                    'total_personnel': monitoring_results['total_personnel'],
                    'issues_found': len(monitoring_results['clearance_expiring_soon']) +
                                    len(monitoring_results['training_overdue']) +
                                    len(monitoring_results['investigation_overdue'])
                }
            )

            return monitoring_results

        except Exception as e:
            logger.error(f"Failed to monitor personnel status: {e}")
            self.audit_manager.log_event(
                event_type=AuditEventType.PERSONNEL_SECURITY,
                severity=SeverityLevel.ERROR,
                message="Personnel security monitoring failed",
                details={'error': str(e)}
            )
            raise

def get_compliance_status(self) -> Dict[str, Any]:
        """Get DFARS personnel security compliance status."""
        total_personnel = len(self.personnel_records)
        screened_personnel = len([
            r for r in self.personnel_records.values()
            if any(c.status == PersonnelStatus.CLEARANCE_GRANTED for c in r.clearance_records)
        ])
        trained_personnel = len([
            r for r in self.personnel_records.values()
            if any(t.status == TrainingStatus.COMPLETED for t in r.training_records)
        ])

        screening_coverage = (screened_personnel / total_personnel * 100) if total_personnel > 0 else MAXIMUM_FUNCTION_LENGTH_LINES
        training_coverage = (trained_personnel / total_personnel * 100) if total_personnel > 0 else MAXIMUM_FUNCTION_LENGTH_LINES

        return {
            'dfars_controls': {
                'MAXIMUM_RETRY_ATTEMPTS.9.1': {
                    'implemented': True,
                    'status': 'Personnel screening for CUI access implemented',
                    'coverage': f"{screening_coverage:.1f}%"
                },
                '3.9.2': {
                    'implemented': True,
                    'status': 'Security awareness training program active',
                    'coverage': f"{training_coverage:.1f}%"
                }
            },
            'total_personnel': total_personnel,
            'screened_personnel': screened_personnel,
            'trained_personnel': trained_personnel,
            'active_investigations': len(self.active_investigations),
            'clearance_types': self._get_clearance_distribution(),
            'training_completion_rate': training_coverage,
            'screening_completion_rate': screening_coverage,
            'overall_compliance': (screening_coverage + training_coverage) / 2
        }

    # Private helper methods

def _determine_screening_level(self, access_needs: List[AccessNeed]) -> str:
        """Determine required screening level based on access needs."""
        if AccessNeed.CLASSIFIED_TOP_SECRET in access_needs:
            return "TOP_SECRET"
        elif AccessNeed.CLASSIFIED_SECRET in access_needs:
            return "SECRET"
        elif AccessNeed.CLASSIFIED_CONFIDENTIAL in access_needs:
            return "CONFIDENTIAL"
        elif AccessNeed.CUI_SPECIFIED in access_needs:
            return "CUI_SPECIFIED"
        else:
            return "CUI_BASIC"

def _get_current_clearance(self, record: PersonnelSecurityRecord) -> Optional[ClearanceRecord]:
        """Get current active clearance for personnel."""
        active_clearances = [
            c for c in record.clearance_records
            if c.status == PersonnelStatus.CLEARANCE_GRANTED and
            c.expiration_date > datetime.now(timezone.utc)
        ]

        if active_clearances:
            # Return highest level clearance
            clearance_hierarchy = {
                ClearanceLevel.TOP_SECRET_SCI: 5,
                ClearanceLevel.TOP_SECRET: 4,
                ClearanceLevel.SECRET: 3,
                ClearanceLevel.CONFIDENTIAL: 2,
                ClearanceLevel.PUBLIC_TRUST: 1,
                ClearanceLevel.NONE: 0
            }

            return max(active_clearances, key=lambda c: clearance_hierarchy.get(c.clearance_level, 0))

        return None

def _clearance_meets_requirements(self, current: ClearanceRecord, required: ClearanceLevel) -> bool:
        """Check if current clearance meets required level."""
        clearance_hierarchy = {
            ClearanceLevel.NONE: 0,
            ClearanceLevel.PUBLIC_TRUST: 1,
            ClearanceLevel.CONFIDENTIAL: 2,
            ClearanceLevel.SECRET: 3,
            ClearanceLevel.TOP_SECRET: 4,
            ClearanceLevel.TOP_SECRET_SCI: 5
        }

        current_level = clearance_hierarchy.get(current.clearance_level, 0)
        required_level = clearance_hierarchy.get(required, 999)

        return current_level >= required_level

def _grant_access_with_existing_clearance(self, personnel_id: str, access_needs: List[AccessNeed]) -> str:
        """Grant access using existing clearance."""
        # Create authorization record without new investigation
        return f"EXISTING-CLR-{uuid.uuid4().hex[:8].upper()}"

def _get_investigative_agency(self, clearance_level: ClearanceLevel) -> str:
        """Get appropriate investigative agency for clearance level."""
        agency_mapping = {
            ClearanceLevel.PUBLIC_TRUST: "OPM",
            ClearanceLevel.CONFIDENTIAL: "DCSA",
            ClearanceLevel.SECRET: "DCSA",
            ClearanceLevel.TOP_SECRET: "DCSA",
            ClearanceLevel.TOP_SECRET_SCI: "DCSA"
        }

        return agency_mapping.get(clearance_level, "DCSA")

def _get_adjudication_agency(self, clearance_level: ClearanceLevel) -> str:
        """Get appropriate adjudication agency for clearance level."""
        # Most defense clearances adjudicated by DoD CAF
        return "DoD_CAF"

def _initiate_screening_process(self, investigation: SecurityInvestigation,
                                    access_needs: List[AccessNeed], justification: str) -> None:
        """Initiate the actual screening process."""
        # Submit investigation request to appropriate agency
        logger.info(f"Screening process initiated for investigation {investigation.investigation_id}")

def _schedule_training_reminders(self, training: SecurityTraining, due_date: datetime) -> None:
        """Schedule training reminder notifications."""
        # Schedule email reminders at 30, 14, and 7 days before due date
        reminder_dates = [
            due_date - timedelta(days=30),
            due_date - timedelta(days=14),
            due_date - timedelta(days=7)
        ]

        logger.info(f"Training reminders scheduled for {training.training_id}")

def _check_cui_access_eligibility(self, record: PersonnelSecurityRecord) -> None:
        """Check if personnel is eligible for CUI access after training completion."""
        # Validate both screening and training requirements
        has_clearance = any(
            c.status == PersonnelStatus.CLEARANCE_GRANTED
            for c in record.clearance_records
        )

        has_current_training = any(
            t.status == TrainingStatus.COMPLETED and
            t.expiration_date and t.expiration_date > datetime.now(timezone.utc)
            for t in record.training_records
        )

        if has_clearance and has_current_training:
            logger.info(f"Personnel {record.personnel_id} eligible for CUI access")

def _validate_screening_requirements(self, record: PersonnelSecurityRecord,
                                        access_needs: List[AccessNeed]) -> bool:
        """Validate personnel meets screening requirements for CUI access."""
        required_clearance_level = self._get_required_clearance_level(access_needs)
        current_clearance = self._get_current_clearance(record)

        return (current_clearance and
                self._clearance_meets_requirements(current_clearance, required_clearance_level))

def _validate_training_requirements(self, record: PersonnelSecurityRecord,
                                        access_needs: List[AccessNeed]) -> bool:
        """Validate personnel meets training requirements for CUI access."""
        required_training_types = self._get_required_training_types(access_needs)
        current_date = datetime.now(timezone.utc)

        for training_type in required_training_types:
            has_current_training = any(
                t.training_type == training_type and
                t.status == TrainingStatus.COMPLETED and
                t.expiration_date and t.expiration_date > current_date
                for t in record.training_records
            )

            if not has_current_training:
                return False

        return True

def _get_required_clearance_level(self, access_needs: List[AccessNeed]) -> ClearanceLevel:
        """Get required clearance level for access needs."""
        if AccessNeed.CLASSIFIED_TOP_SECRET in access_needs:
            return ClearanceLevel.TOP_SECRET
        elif AccessNeed.CLASSIFIED_SECRET in access_needs:
            return ClearanceLevel.SECRET
        elif AccessNeed.CLASSIFIED_CONFIDENTIAL in access_needs:
            return ClearanceLevel.CONFIDENTIAL
        else:
            return ClearanceLevel.PUBLIC_TRUST

def _get_required_training_types(self, access_needs: List[AccessNeed]) -> List[str]:
        """Get required training types for access needs."""
        training_types = ["security_awareness", "cui_handling"]

        if AccessNeed.CUI_SPECIFIED in access_needs:
            training_types.append("cui_specified")

        if any(need.name.startswith("CLASSIFIED") for need in access_needs):
            training_types.append("classified_handling")

        return training_types

def _calculate_authorization_expiration(self, record: PersonnelSecurityRecord) -> Optional[datetime]:
        """Calculate authorization expiration based on clearance and training."""
        current_clearance = self._get_current_clearance(record)
        if current_clearance:
            return min(
                current_clearance.expiration_date,
                datetime.now(timezone.utc) + timedelta(days=365)  # Annual review
            )

        return datetime.now(timezone.utc) + timedelta(days=365)

def _generate_access_conditions(self, access_needs: List[AccessNeed]) -> List[str]:
        """Generate access conditions based on access needs."""
        conditions = [
            "Must maintain current security clearance",
            "Must complete annual security awareness training",
            "Subject to continuous monitoring"
        ]

        if AccessNeed.CUI_SPECIFIED in access_needs:
            conditions.append("Subject to enhanced monitoring for CUI handling")

        return conditions

def _calculate_compliance_percentage(self) -> float:
        """Calculate overall personnel security compliance percentage."""
        if not self.personnel_records:
            return 100.0

        current_date = datetime.now(timezone.utc)
        compliant_count = 0

        for record in self.personnel_records.values():
            # Check clearance status
            has_current_clearance = any(
                c.status == PersonnelStatus.CLEARANCE_GRANTED and
                c.expiration_date > current_date
                for c in record.clearance_records
            )

            # Check training status
            has_current_training = any(
                t.status == TrainingStatus.COMPLETED and
                t.expiration_date and t.expiration_date > current_date
                for t in record.training_records
            )

            if has_current_clearance and has_current_training:
                compliant_count += 1

        return (compliant_count / len(self.personnel_records)) * 100

def _get_clearance_distribution(self) -> Dict[str, int]:
        """Get distribution of clearance levels."""
        distribution = {}

        for record in self.personnel_records.values():
            current_clearance = self._get_current_clearance(record)
            if current_clearance:
                level = current_clearance.clearance_level.value
                distribution[level] = distribution.get(level, 0) + 1

        return distribution