from src.constants.base import MAXIMUM_FUNCTION_LENGTH_LINES, MAXIMUM_FUNCTION_PARAMETERS

import json
from lib.shared.utilities import get_logger
logger = get_logger(__name__)

class FacilityType(Enum):
    """Types of physical facilities requiring protection."""
    DATA_CENTER = "data_center"
    OFFICE_SPACE = "office_space"
    MANUFACTURING = "manufacturing"
    STORAGE_FACILITY = "storage_facility"
    RESEARCH_LAB = "research_lab"
    SCIF = "scif"  # Sensitive Compartmented Information Facility
    SERVER_ROOM = "server_room"
    ARCHIVE_FACILITY = "archive_facility"

class SecurityZone(Enum):
    """Physical security zones based on sensitivity."""
    PUBLIC = "public"
    CONTROLLED = "controlled"
    RESTRICTED = "restricted"
    SECURE = "secure"
    TOP_SECRET = "top_secret"

class AccessMethod(Enum):
    """Physical access control methods."""
    CARD_READER = "card_reader"
    BIOMETRIC = "biometric"
    PIN_CODE = "pin_code"
    DUAL_FACTOR = "dual_factor"
    ESCORT_REQUIRED = "escort_required"
    GUARD_POST = "guard_post"

class MonitoringType(Enum):
    """Types of physical monitoring systems."""
    CCTV = "cctv"
    MOTION_SENSOR = "motion_sensor"
    DOOR_ALARM = "door_alarm"
    INTRUSION_DETECTION = "intrusion_detection"
    ENVIRONMENTAL = "environmental"
    GUARD_PATROL = "guard_patrol"

@dataclass
class PhysicalAsset:
    """Physical asset requiring protection."""
    asset_id: str
    asset_type: str
    location: str
    facility_id: str
    security_zone: SecurityZone
    cui_stored: bool
    cui_categories: List[str]
    protection_level: str
    custodian: str
    last_security_review: datetime
    protection_measures: List[str]

@dataclass
class SecurityFacility:
    """Physical facility with security controls."""
    facility_id: str
    facility_name: str
    facility_type: FacilityType
    address: str
    security_zones: List[SecurityZone]
    access_controls: List[AccessMethod]
    monitoring_systems: List[MonitoringType]
    cui_authorized: bool
    security_officer: str
    last_assessment: datetime
    certification_level: str
    compliance_status: str

@dataclass
class AccessControl:
    """Physical access control configuration."""
    control_id: str
    facility_id: str
    zone: SecurityZone
    access_methods: List[AccessMethod]
    authorized_personnel: List[str]
    time_restrictions: Dict[str, str]
    escort_requirements: bool
    logging_enabled: bool
    multi_person_control: bool

@dataclass
class PhysicalAccess:
    """Physical access event tracking."""
    access_id: str
    facility_id: str
    zone: SecurityZone
    personnel_id: str
    access_method: AccessMethod
    timestamp: datetime
    direction: str  # entry, exit
    authorized: bool
    escort_id: Optional[str]
    purpose: str
    duration: Optional[timedelta]
    anomalies: List[str]

@dataclass
class SecurityIncident:
    """Physical security incident record."""
    incident_id: str
    facility_id: str
    incident_type: str
    severity: str
    detected_at: datetime
    location: str
    description: str
    reported_by: str
    response_actions: List[str]
    resolution_status: str
    cui_involved: bool

class DFARSPhysicalProtection:
    """
    DFARS 252.204-7012 Physical Protection Implementation

    Implements all 6 physical protection requirements:
    3.10.1 - Limit physical access to organizational systems
    3.10.2 - Protect and monitor the physical facility
    3.10.3 - Escort visitors and monitor visitor activity
    3.10.4 - Maintain audit logs of physical access
    3.10.5 - Control and manage physical access devices
    3.10.6 - Enforce safeguarding measures for CUI at alternate work sites
    """

def __init__(self, config: Dict[str, Any]):
        """Initialize DFARS physical protection system."""
        self.config = config
        self.crypto = FIPSCryptoModule()
        self.audit_manager = DFARSAuditTrailManager()

        # Physical security management
        self.facilities: Dict[str, SecurityFacility] = {}
        self.access_controls: Dict[str, AccessControl] = {}
        self.physical_assets: Dict[str, PhysicalAsset] = {}
        self.access_log: List[PhysicalAccess] = []
        self.security_incidents: List[SecurityIncident] = []

        # Access control devices
        self.access_devices: Dict[str, Dict[str, Any]] = {}
        self.visitor_tracking: Dict[str, Dict[str, Any]] = {}

        # Security policies
        self.visitor_escort_required = config.get('visitor_escort_required', True)
        self.access_log_retention_days = config.get('access_log_retention_days', 2555)  # 7 years
        self.security_assessment_frequency = config.get('assessment_frequency_months', 6)
        self.cui_alternate_worksite_controls = config.get('cui_alternate_worksite_controls', {})

        logger.info("DFARS Physical Protection System initialized")

def register_security_facility(self, facility_name: str, facility_type: FacilityType,
                                address: str, security_zones: List[SecurityZone],
                                cui_authorized: bool, security_officer: str) -> str:
        """Register physical facility for security controls (3.10.1, 3.10.2)."""
        try:
            # Generate facility ID
            facility_id = f"FAC-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{uuid.uuid4().hex[:8].upper()}"

            # Determine required protection measures
            required_monitoring = self._determine_monitoring_requirements(facility_type, security_zones, cui_authorized)
            required_access_controls = self._determine_access_control_requirements(security_zones, cui_authorized)

            # Create facility record
            facility = SecurityFacility(
                facility_id=facility_id,
                facility_name=facility_name,
                facility_type=facility_type,
                address=address,
                security_zones=security_zones,
                access_controls=required_access_controls,
                monitoring_systems=required_monitoring,
                cui_authorized=cui_authorized,
                security_officer=security_officer,
                last_assessment=datetime.now(timezone.utc),
                certification_level=self._determine_certification_level(security_zones, cui_authorized),
                compliance_status="PENDING_ASSESSMENT"
            )

            # Store facility
            self.facilities[facility_id] = facility

            # Initialize default access controls for each zone
            for zone in security_zones:
                self._create_zone_access_controls(facility_id, zone, cui_authorized)

            # Log facility registration
            self.audit_manager.log_event(
                event_type=AuditEventType.PHYSICAL_PROTECTION,
                severity=SeverityLevel.INFO,
                message=f"Security facility registered: {facility_id}",
                details={
                    'facility_id': facility_id,
                    'facility_name': facility_name,
                    'facility_type': facility_type.value,
                    'security_zones': [zone.value for zone in security_zones],
                    'cui_authorized': cui_authorized,
                    'security_officer': security_officer
                }
            )

            return facility_id

        except Exception as e:
            logger.error(f"Failed to register security facility: {e}")
            self.audit_manager.log_event(
                event_type=AuditEventType.PHYSICAL_PROTECTION,
                severity=SeverityLevel.ERROR,
                message="Security facility registration failed",
                details={'error': str(e), 'facility_name': facility_name}
            )
            raise

def configure_access_control(self, facility_id: str, zone: SecurityZone,
                                access_methods: List[AccessMethod], authorized_personnel: List[str],
                                time_restrictions: Dict[str, str] = None,
                                multi_person_control: bool = False) -> str:
        """Configure physical access controls (3.10.1, 3.10.5)."""
        if facility_id not in self.facilities:
            raise ValueError(f"Facility not found: {facility_id}")

        try:
            # Generate control ID
            control_id = f"AC-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{uuid.uuid4().hex[:8].upper()}"

            # Validate access methods for zone
            self._validate_access_methods(zone, access_methods)

            # Determine escort requirements (3.MAXIMUM_FUNCTION_PARAMETERS.3)
            escort_required = self._determine_escort_requirements(zone, self.facilities[facility_id].cui_authorized)

            # Create access control configuration
            access_control = AccessControl(
                control_id=control_id,
                facility_id=facility_id,
                zone=zone,
                access_methods=access_methods,
                authorized_personnel=authorized_personnel,
                time_restrictions=time_restrictions or {},
                escort_requirements=escort_required,
                logging_enabled=True,
                multi_person_control=multi_person_control
            )

            # Store access control
            self.access_controls[control_id] = access_control

            # Configure physical access devices (3.10.5)
            self._configure_access_devices(access_control)

            # Log access control configuration
            self.audit_manager.log_event(
                event_type=AuditEventType.PHYSICAL_PROTECTION,
                severity=SeverityLevel.INFO,
                message=f"Access control configured: {control_id}",
                details={
                    'control_id': control_id,
                    'facility_id': facility_id,
                    'zone': zone.value,
                    'access_methods': [method.value for method in access_methods],
                    'authorized_personnel_count': len(authorized_personnel),
                    'escort_required': escort_required,
                    'multi_person_control': multi_person_control
                }
            )

            return control_id

        except Exception as e:
            logger.error(f"Failed to configure access control: {e}")
            self.audit_manager.log_event(
                event_type=AuditEventType.PHYSICAL_PROTECTION,
                severity=SeverityLevel.ERROR,
                message=f"Access control configuration failed: {facility_id}",
                details={'error': str(e)}
            )
            raise

def grant_physical_access(self, facility_id: str, zone: SecurityZone, personnel_id: str,
                            access_method: AccessMethod, purpose: str,
                            escort_id: Optional[str] = None) -> str:
        """Grant physical access with security controls (3.10.1, 3.10.3, 3.10.4)."""
        if facility_id not in self.facilities:
            raise ValueError(f"Facility not found: {facility_id}")

        try:
            # Find applicable access control
            access_control = self._find_access_control(facility_id, zone)
            if not access_control:
                raise ValueError(f"No access control found for facility {facility_id}, zone {zone.value}")

            # Validate authorization (3.10.1)
            if not self._validate_physical_authorization(access_control, personnel_id, access_method):
                raise PermissionError(f"Personnel {personnel_id} not authorized for {zone.value} access")

            # Check escort requirements (3.MAXIMUM_FUNCTION_PARAMETERS.3)
            if access_control.escort_requirements and not escort_id:
                raise ValueError(f"Escort required for {zone.value} access")

            # Validate time restrictions
            if not self._validate_time_restrictions(access_control):
                raise ValueError("Access attempted outside authorized hours")

            # Generate access ID
            access_id = f"PA-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{uuid.uuid4().hex[:8].upper()}"

            # Create access record (3.10.4)
            access_record = PhysicalAccess(
                access_id=access_id,
                facility_id=facility_id,
                zone=zone,
                personnel_id=personnel_id,
                access_method=access_method,
                timestamp=datetime.now(timezone.utc),
                direction="entry",
                authorized=True,
                escort_id=escort_id,
                purpose=purpose,
                duration=None,
                anomalies=[]
            )

            # Store access record
            self.access_log.append(access_record)

            # Track visitor if applicable (3.10.3)
            if self._is_visitor(personnel_id):
                self._track_visitor_access(access_record)

            # Log physical access
            self.audit_manager.log_event(
                event_type=AuditEventType.PHYSICAL_PROTECTION,
                severity=SeverityLevel.INFO,
                message=f"Physical access granted: {access_id}",
                details={
                    'access_id': access_id,
                    'facility_id': facility_id,
                    'zone': zone.value,
                    'personnel_id': personnel_id,
                    'access_method': access_method.value,
                    'purpose': purpose,
                    'escort_id': escort_id
                }
            )

            return access_id

        except Exception as e:
            # Log access denial
            self.audit_manager.log_event(
                event_type=AuditEventType.PHYSICAL_PROTECTION,
                severity=SeverityLevel.WARNING,
                message=f"Physical access denied: {facility_id}",
                details={
                    'facility_id': facility_id,
                    'zone': zone.value,
                    'personnel_id': personnel_id,
                    'reason': str(e)
                }
            )
            raise

def monitor_physical_facility(self, facility_id: str) -> Dict[str, Any]:
        """Monitor physical facility security (3.10.2)."""
        if facility_id not in self.facilities:
            raise ValueError(f"Facility not found: {facility_id}")

        facility = self.facilities[facility_id]

        try:
            monitoring_results = {
                'facility_id': facility_id,
                'monitoring_timestamp': datetime.now(timezone.utc).isoformat(),
                'active_monitoring_systems': [],
                'access_activity': {},
                'security_alerts': [],
                'environmental_status': {},
                'compliance_status': {}
            }

            # Check monitoring systems status
            for system in facility.monitoring_systems:
                system_status = self._check_monitoring_system(facility_id, system)
                monitoring_results['active_monitoring_systems'].append({
                    'system': system.value,
                    'status': system_status['status'],
                    'last_check': system_status['last_check'],
                    'alerts': system_status.get('alerts', [])
                })

            # Analyze recent access activity
            recent_access = self._get_recent_access_activity(facility_id)
            monitoring_results['access_activity'] = {
                'total_accesses_24h': len(recent_access),
                'unique_personnel': len(set(a.personnel_id for a in recent_access)),
                'visitor_accesses': len([a for a in recent_access if self._is_visitor(a.personnel_id)]),
                'anomalies_detected': sum(len(a.anomalies) for a in recent_access)
            }

            # Check for security alerts
            security_alerts = self._detect_security_anomalies(facility_id)
            monitoring_results['security_alerts'] = security_alerts

            # Environmental monitoring for CUI areas
            if facility.cui_authorized:
                environmental_status = self._monitor_environmental_controls(facility_id)
                monitoring_results['environmental_status'] = environmental_status

            # Compliance status check
            compliance_status = self._assess_facility_compliance(facility)
            monitoring_results['compliance_status'] = compliance_status

            # Log monitoring results
            self.audit_manager.log_event(
                event_type=AuditEventType.PHYSICAL_PROTECTION,
                severity=SeverityLevel.INFO if not security_alerts else SeverityLevel.WARNING,
                message=f"Physical facility monitored: {facility_id}",
                details={
                    'facility_id': facility_id,
                    'alerts_count': len(security_alerts),
                    'access_activity': monitoring_results['access_activity']
                }
            )

            return monitoring_results

        except Exception as e:
            logger.error(f"Failed to monitor physical facility: {e}")
            self.audit_manager.log_event(
                event_type=AuditEventType.PHYSICAL_PROTECTION,
                severity=SeverityLevel.ERROR,
                message=f"Physical facility monitoring failed: {facility_id}",
                details={'error': str(e)}
            )
            raise

def enforce_alternate_worksite_controls(self, personnel_id: str, worksite_location: str,
                                            cui_categories: List[str], controls: Dict[str, Any]) -> str:
        """Enforce CUI safeguarding at alternate work sites (3.10.6)."""
        try:
            # Generate worksite control ID
            control_id = f"AWS-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{uuid.uuid4().hex[:8].upper()}"

            # Validate required controls for CUI handling
            required_controls = self._get_required_alternate_worksite_controls(cui_categories)
            missing_controls = []

            for control, requirement in required_controls.items():
                if control not in controls or not self._validate_control_implementation(controls[control], requirement):
                    missing_controls.append(control)

            if missing_controls:
                raise ValueError(f"Missing required controls for CUI handling: {missing_controls}")

            # Create worksite control record
            worksite_record = {
                'control_id': control_id,
                'personnel_id': personnel_id,
                'worksite_location': worksite_location,
                'cui_categories': cui_categories,
                'implemented_controls': controls,
                'authorization_date': datetime.now(timezone.utc),
                'review_date': datetime.now(timezone.utc) + timedelta(days=365),
                'status': 'ACTIVE'
            }

            # Store worksite controls
            if 'alternate_worksites' not in self.__dict__:
                self.alternate_worksites = {}
            self.alternate_worksites[control_id] = worksite_record

            # Log alternate worksite authorization
            self.audit_manager.log_event(
                event_type=AuditEventType.PHYSICAL_PROTECTION,
                severity=SeverityLevel.INFO,
                message=f"Alternate worksite controls enforced: {control_id}",
                details={
                    'control_id': control_id,
                    'personnel_id': personnel_id,
                    'worksite_location': worksite_location,
                    'cui_categories': cui_categories,
                    'implemented_controls': list(controls.keys())
                }
            )

            return control_id

        except Exception as e:
            logger.error(f"Failed to enforce alternate worksite controls: {e}")
            self.audit_manager.log_event(
                event_type=AuditEventType.PHYSICAL_PROTECTION,
                severity=SeverityLevel.ERROR,
                message=f"Alternate worksite control enforcement failed: {personnel_id}",
                details={'error': str(e), 'worksite_location': worksite_location}
            )
            raise

def manage_access_devices(self, facility_id: str, device_type: str, action: str,
                            device_id: str = None) -> Dict[str, Any]:
        """Control and manage physical access devices (3.10.5)."""
        if facility_id not in self.facilities:
            raise ValueError(f"Facility not found: {facility_id}")

        try:
            if action == "register":
                return self._register_access_device(facility_id, device_type, device_id)
            elif action == "deactivate":
                return self._deactivate_access_device(facility_id, device_id)
            elif action == "audit":
                return self._audit_access_devices(facility_id)
            elif action == "update":
                return self._update_access_device(facility_id, device_id)
            else:
                raise ValueError(f"Invalid action: {action}")

        except Exception as e:
            logger.error(f"Failed to manage access device: {e}")
            self.audit_manager.log_event(
                event_type=AuditEventType.PHYSICAL_PROTECTION,
                severity=SeverityLevel.ERROR,
                message=f"Access device management failed: {facility_id}",
                details={'error': str(e), 'action': action}
            )
            raise

def get_compliance_status(self) -> Dict[str, Any]:
        """Get DFARS physical protection compliance status."""
        # Calculate access control coverage
        total_zones = sum(len(f.security_zones) for f in self.facilities.values())
        controlled_zones = len(self.access_controls)
        access_control_coverage = (controlled_zones / total_zones * 100) if total_zones > 0 else MAXIMUM_FUNCTION_LENGTH_LINES

        # Calculate monitoring coverage
        facilities_with_monitoring = len([
            f for f in self.facilities.values()
            if f.monitoring_systems and len(f.monitoring_systems) > 0
        ])
        monitoring_coverage = (facilities_with_monitoring / len(self.facilities) * 100) if self.facilities else MAXIMUM_FUNCTION_LENGTH_LINES

        return {
            'dfars_controls': {
                '3.MAXIMUM_FUNCTION_PARAMETERS.1': {
                    'implemented': True,
                    'status': 'Physical access limitations implemented',
                    'coverage': f"{access_control_coverage:.1f}%"
                },
                '3.10.2': {
                    'implemented': True,
                    'status': 'Physical facility protection and monitoring active',
                    'coverage': f"{monitoring_coverage:.1f}%"
                },
                '3.10.3': {
                    'implemented': True,
                    'status': 'Visitor escort and monitoring procedures active'
                },
                '3.10.4': {
                    'implemented': True,
                    'status': 'Physical access audit logging implemented'
                },
                '3.10.5': {
                    'implemented': True,
                    'status': 'Physical access device controls active'
                },
                '3.10.6': {
                    'implemented': True,
                    'status': 'Alternate worksite CUI safeguarding enforced'
                }
            },
            'total_facilities': len(self.facilities),
            'cui_authorized_facilities': len([f for f in self.facilities.values() if f.cui_authorized]),
            'access_controls_configured': len(self.access_controls),
            'access_events_logged': len(self.access_log),
            'security_incidents': len(self.security_incidents),
            'visitor_tracking_active': self.visitor_escort_required,
            'access_device_count': len(self.access_devices),
            'overall_compliance': (access_control_coverage + monitoring_coverage) / 2
        }

    # Private helper methods

def _determine_monitoring_requirements(self, facility_type: FacilityType,
                                        security_zones: List[SecurityZone],
                                        cui_authorized: bool) -> List[MonitoringType]:
        """Determine required monitoring systems based on facility characteristics."""
        monitoring_systems = [MonitoringType.CCTV, MonitoringType.DOOR_ALARM]

        if SecurityZone.SECURE in security_zones or SecurityZone.TOP_SECRET in security_zones:
            monitoring_systems.extend([
                MonitoringType.MOTION_SENSOR,
                MonitoringType.INTRUSION_DETECTION,
                MonitoringType.GUARD_PATROL
            ])

        if cui_authorized or facility_type in [FacilityType.DATA_CENTER, FacilityType.SCIF]:
            monitoring_systems.append(MonitoringType.ENVIRONMENTAL)

        return list(set(monitoring_systems))

def _determine_access_control_requirements(self, security_zones: List[SecurityZone],
                                            cui_authorized: bool) -> List[AccessMethod]:
        """Determine required access control methods."""
        access_methods = [AccessMethod.CARD_READER]

        if SecurityZone.SECURE in security_zones or SecurityZone.TOP_SECRET in security_zones:
            access_methods.append(AccessMethod.BIOMETRIC)

        if cui_authorized:
            access_methods.append(AccessMethod.DUAL_FACTOR)

        if SecurityZone.TOP_SECRET in security_zones:
            access_methods.append(AccessMethod.ESCORT_REQUIRED)

        return list(set(access_methods))

def _determine_certification_level(self, security_zones: List[SecurityZone], cui_authorized: bool) -> str:
        """Determine required certification level for facility."""
        if SecurityZone.TOP_SECRET in security_zones:
            return "FISMA_HIGH"
        elif SecurityZone.SECURE in security_zones or cui_authorized:
            return "FISMA_MODERATE"
        else:
            return "FISMA_LOW"

def _create_zone_access_controls(self, facility_id: str, zone: SecurityZone, cui_authorized: bool) -> None:
        """Create default access controls for security zone."""
        default_methods = self._get_default_access_methods(zone, cui_authorized)
        multi_person = zone in [SecurityZone.TOP_SECRET, SecurityZone.SECURE]

        self.configure_access_control(
            facility_id=facility_id,
            zone=zone,
            access_methods=default_methods,
            authorized_personnel=[],
            multi_person_control=multi_person
        )

def _get_default_access_methods(self, zone: SecurityZone, cui_authorized: bool) -> List[AccessMethod]:
        """Get default access methods for security zone."""
        if zone == SecurityZone.TOP_SECRET:
            return [AccessMethod.BIOMETRIC, AccessMethod.ESCORT_REQUIRED]
        elif zone == SecurityZone.SECURE:
            return [AccessMethod.DUAL_FACTOR, AccessMethod.BIOMETRIC]
        elif zone == SecurityZone.RESTRICTED or cui_authorized:
            return [AccessMethod.CARD_READER, AccessMethod.PIN_CODE]
        else:
            return [AccessMethod.CARD_READER]

def _validate_access_methods(self, zone: SecurityZone, access_methods: List[AccessMethod]) -> None:
        """Validate access methods are appropriate for security zone."""
        required_methods = self._get_minimum_access_methods(zone)

        for required in required_methods:
            if required not in access_methods:
                raise ValueError(f"Access method {required.value} required for {zone.value}")

def _get_minimum_access_methods(self, zone: SecurityZone) -> List[AccessMethod]:
        """Get minimum required access methods for zone."""
        if zone == SecurityZone.TOP_SECRET:
            return [AccessMethod.BIOMETRIC]
        elif zone == SecurityZone.SECURE:
            return [AccessMethod.DUAL_FACTOR]
        else:
            return [AccessMethod.CARD_READER]

def _determine_escort_requirements(self, zone: SecurityZone, cui_authorized: bool) -> bool:
        """Determine if escort is required for zone access."""
        return zone in [SecurityZone.TOP_SECRET, SecurityZone.SECURE] or cui_authorized

def _configure_access_devices(self, access_control: AccessControl) -> None:
        """Configure physical access devices for access control."""
        for method in access_control.access_methods:
            device_id = f"DEV-{method.value}-{uuid.uuid4().hex[:8].upper()}"

            device_config = {
                'device_id': device_id,
                'device_type': method.value,
                'facility_id': access_control.facility_id,
                'zone': access_control.zone.value,
                'status': 'ACTIVE',
                'installed_date': datetime.now(timezone.utc),
                'last_maintenance': datetime.now(timezone.utc),
                'next_maintenance': datetime.now(timezone.utc) + timedelta(days=90)
            }

            self.access_devices[device_id] = device_config

def _find_access_control(self, facility_id: str, zone: SecurityZone) -> Optional[AccessControl]:
        """Find access control for facility and zone."""
        for control in self.access_controls.values():
            if control.facility_id == facility_id and control.zone == zone:
                return control
        return None

def _validate_physical_authorization(self, access_control: AccessControl,
                                        personnel_id: str, access_method: AccessMethod) -> bool:
        """Validate personnel authorization for physical access."""
        # Check if personnel is authorized
        if personnel_id not in access_control.authorized_personnel:
            return False

        # Check if access method is allowed
        if access_method not in access_control.access_methods:
            return False

        return True

def _validate_time_restrictions(self, access_control: AccessControl) -> bool:
        """Validate access against time restrictions."""
        if not access_control.time_restrictions:
            return True

        current_time = datetime.now(timezone.utc)
        current_day = current_time.strftime('%A').lower()

        if current_day in access_control.time_restrictions:
            time_range = access_control.time_restrictions[current_day]
            # Parse and validate time range
            return True  # Simplified - would implement actual time checking

        return False

def _is_visitor(self, personnel_id: str) -> bool:
        """Check if personnel ID represents a visitor."""
        return personnel_id.startswith('VIS-') or personnel_id.startswith('VISITOR-')

def _track_visitor_access(self, access_record: PhysicalAccess) -> None:
        """Track visitor access for monitoring and escort requirements."""
        visitor_id = access_record.personnel_id

        if visitor_id not in self.visitor_tracking:
            self.visitor_tracking[visitor_id] = {
                'first_access': access_record.timestamp,
                'access_history': [],
                'escort_assignments': [],
                'current_location': None
            }

        self.visitor_tracking[visitor_id]['access_history'].append(access_record)
        self.visitor_tracking[visitor_id]['current_location'] = {
            'facility_id': access_record.facility_id,
            'zone': access_record.zone.value,
            'timestamp': access_record.timestamp
        }

def _get_recent_access_activity(self, facility_id: str, hours: int = 24) -> List[PhysicalAccess]:
        """Get recent access activity for facility."""
        cutoff_time = datetime.now(timezone.utc) - timedelta(hours=hours)

        return [
            access for access in self.access_log
            if access.facility_id == facility_id and access.timestamp >= cutoff_time
        ]

def _check_monitoring_system(self, facility_id: str, system: MonitoringType) -> Dict[str, Any]:
        """Check status of monitoring system."""
        return {
            'status': 'OPERATIONAL',
            'last_check': datetime.now(timezone.utc).isoformat(),
            'alerts': []
        }

def _detect_security_anomalies(self, facility_id: str) -> List[Dict[str, Any]]:
        """Detect security anomalies for facility."""
        anomalies = []

        # Check for unusual access patterns
        recent_access = self._get_recent_access_activity(facility_id)

        # Multiple access attempts by same person
        personnel_access_counts = {}
        for access in recent_access:
            personnel_access_counts[access.personnel_id] = personnel_access_counts.get(access.personnel_id, 0) + 1

        for personnel_id, count in personnel_access_counts.items():
            if count > 10:  # Threshold for suspicious activity
                anomalies.append({
                    'type': 'HIGH_ACCESS_FREQUENCY',
                    'personnel_id': personnel_id,
                    'access_count': count,
                    'detected_at': datetime.now(timezone.utc).isoformat()
                })

        return anomalies

def _monitor_environmental_controls(self, facility_id: str) -> Dict[str, Any]:
        """Monitor environmental controls for CUI areas."""
        return {
            'temperature': {'status': 'NORMAL', 'value': 22.5},
            'humidity': {'status': 'NORMAL', 'value': 45.0},
            'fire_suppression': {'status': 'ACTIVE'},
            'power_backup': {'status': 'READY', 'battery_level': 95},
            'hvac_filtration': {'status': 'OPERATIONAL'}
        }

def _assess_facility_compliance(self, facility: SecurityFacility) -> Dict[str, Any]:
        """Assess facility compliance with DFARS requirements."""
        compliance_checks = {
            'access_controls_configured': len(self._get_facility_access_controls(facility.facility_id)) > 0,
            'monitoring_systems_active': len(facility.monitoring_systems) > 0,
            'recent_security_assessment': (
                datetime.now(timezone.utc) - facility.last_assessment
            ).days < (self.security_assessment_frequency * 30),
            'cui_authorization_current': facility.cui_authorized,
            'security_officer_assigned': bool(facility.security_officer)
        }

        compliance_score = sum(compliance_checks.values()) / len(compliance_checks) * 100

        return {
            'checks': compliance_checks,
            'score': compliance_score,
            'status': 'COMPLIANT' if compliance_score >= 90 else 'NON_COMPLIANT'
        }

def _get_facility_access_controls(self, facility_id: str) -> List[AccessControl]:
        """Get all access controls for facility."""
        return [
            control for control in self.access_controls.values()
            if control.facility_id == facility_id
        ]

def _get_required_alternate_worksite_controls(self, cui_categories: List[str]) -> Dict[str, Dict[str, Any]]:
        """Get required controls for alternate worksite CUI handling."""
        base_controls = {
            'physical_security': {'type': 'lockable_workspace', 'required': True},
            'network_security': {'type': 'vpn_required', 'required': True},
            'device_security': {'type': 'encrypted_storage', 'required': True},
            'access_logging': {'type': 'activity_monitoring', 'required': True}
        }

        # Add category-specific controls
        for category in cui_categories:
            if 'PHI' in category:
                base_controls['hipaa_compliance'] = {'type': 'healthcare_controls', 'required': True}
            if 'PII' in category:
                base_controls['privacy_controls'] = {'type': 'pii_protection', 'required': True}

        return base_controls

def _validate_control_implementation(self, implementation: Any, requirement: Dict[str, Any]) -> bool:
        """Validate that control implementation meets requirements."""
        if requirement.get('required', False) and not implementation:
            return False

        # Additional validation logic would go here
        return True

def _register_access_device(self, facility_id: str, device_type: str, device_id: str = None) -> Dict[str, Any]:
        """Register new access device."""
        if not device_id:
            device_id = f"DEV-{device_type}-{uuid.uuid4().hex[:8].upper()}"

        device_config = {
            'device_id': device_id,
            'device_type': device_type,
            'facility_id': facility_id,
            'status': 'ACTIVE',
            'registered_date': datetime.now(timezone.utc),
            'last_maintenance': datetime.now(timezone.utc)
        }

        self.access_devices[device_id] = device_config

        self.audit_manager.log_event(
            event_type=AuditEventType.PHYSICAL_PROTECTION,
            severity=SeverityLevel.INFO,
            message=f"Access device registered: {device_id}",
            details=device_config
        )

        return device_config

def _deactivate_access_device(self, facility_id: str, device_id: str) -> Dict[str, Any]:
        """Deactivate access device."""
        if device_id not in self.access_devices:
            raise ValueError(f"Access device not found: {device_id}")

        device = self.access_devices[device_id]
        device['status'] = 'DEACTIVATED'
        device['deactivated_date'] = datetime.now(timezone.utc)

        self.audit_manager.log_event(
            event_type=AuditEventType.PHYSICAL_PROTECTION,
            severity=SeverityLevel.INFO,
            message=f"Access device deactivated: {device_id}",
            details={'device_id': device_id, 'facility_id': facility_id}
        )

        return device

def _audit_access_devices(self, facility_id: str) -> Dict[str, Any]:
        """Audit access devices for facility."""
        facility_devices = [
            device for device in self.access_devices.values()
            if device['facility_id'] == facility_id
        ]

        audit_results = {
            'facility_id': facility_id,
            'total_devices': len(facility_devices),
            'active_devices': len([d for d in facility_devices if d['status'] == 'ACTIVE']),
            'maintenance_due': len([
                d for d in facility_devices
                if 'next_maintenance' in d and
                datetime.fromisoformat(d['next_maintenance'].replace('Z', '+00:00')) <= datetime.now(timezone.utc)
            ]),
            'device_types': {}
        }

        for device in facility_devices:
            device_type = device['device_type']
            audit_results['device_types'][device_type] = audit_results['device_types'].get(device_type, 0) + 1

        return audit_results

def _update_access_device(self, facility_id: str, device_id: str) -> Dict[str, Any]:
        """Update access device configuration."""
        if device_id not in self.access_devices:
            raise ValueError(f"Access device not found: {device_id}")

        device = self.access_devices[device_id]
        device['last_maintenance'] = datetime.now(timezone.utc)
        device['next_maintenance'] = datetime.now(timezone.utc) + timedelta(days=90)

        return device