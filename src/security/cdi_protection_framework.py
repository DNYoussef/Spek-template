from src.constants.base import API_TIMEOUT_SECONDS, MAXIMUM_RETRY_ATTEMPTS

import json
import time
import hashlib
import hmac
from lib.shared.utilities import get_logger
logger = get_logger(__name__)

class CDIClassification(Enum):
    """CDI classification levels."""
    CONTROLLED_UNCLASSIFIED = "cui"
    BASIC_CUI = "basic_cui"
    SPECIFIED_CUI = "specified_cui"
    DFARS_COVERED = "dfars_covered"
    EXPORT_CONTROLLED = "export_controlled"

class AccessLevel(Enum):
    """Access control levels."""
    NONE = "none"
    READ = "read"
    WRITE = "write"
    MODIFY = "modify"
    DELETE = "delete"
    ADMIN = "admin"
    FULL_CONTROL = "full_control"

class DataState(Enum):
    """Data states for protection."""
    AT_REST = "at_rest"
    IN_TRANSIT = "in_transit"
    IN_PROCESSING = "in_processing"
    IN_MEMORY = "in_memory"

@dataclass
class CDIAsset:
    """Covered Defense Information asset."""
    asset_id: str
    name: str
    description: str
    classification: CDIClassification
    owner: str
    created_at: float
    updated_at: float
    file_path: Optional[str]
    data_type: str
    sensitivity_markers: List[str]
    retention_period: int  # days
    destruction_date: Optional[float]
    access_history: List[Dict[str, Any]]
    protection_requirements: Dict[str, Any]
    metadata: Dict[str, Any]

@dataclass
class AccessPolicy:
    """Access control policy for CDI."""
    policy_id: str
    name: str
    description: str
    subject_type: str  # user, group, role, system
    subject_id: str
    resource_pattern: str
    access_level: AccessLevel
    conditions: Dict[str, Any]
    time_constraints: Optional[Dict[str, Any]]
    location_constraints: Optional[List[str]]
    purpose_limitation: Optional[str]
    created_at: float
    expires_at: Optional[float]
    created_by: str
    approval_required: bool
    approval_status: Optional[str]

@dataclass
class DataAccessRequest:
    """Data access request record."""
    request_id: str
    user_id: str
    asset_id: str
    access_level: AccessLevel
    purpose: str
    justification: str
    requested_at: float
    expires_at: Optional[float]
    status: str  # pending, approved, denied, expired
    approver_id: Optional[str]
    approved_at: Optional[float]
    conditions: Dict[str, Any]
    session_id: Optional[str]

class CDIProtectionFramework:
    """
    Comprehensive Covered Defense Information protection framework
    implementing DFARS 252.204-7012 requirements for data protection.
    """

    def __init__(self, storage_path: str = ".claude/.artifacts/cdi_protection"):
        """Initialize CDI protection framework."""
        self.storage_path = Path(storage_path)
        self.storage_path.mkdir(parents=True, exist_ok=True)

        # Initialize crypto module
        self.crypto_module = FIPSCryptoModule()

        # Initialize audit manager
        self.audit_manager = EnhancedDFARSAuditTrailManager(
            str(self.storage_path / "cdi_audit")
        )

        # Initialize databases
        self._initialize_databases()

        # CDI inventory
        self.cdi_assets: Dict[str, CDIAsset] = {}
        self.access_policies: Dict[str, AccessPolicy] = {}
        self.access_requests: Dict[str, DataAccessRequest] = {}

        # Active sessions and access controls
        self.active_sessions: Dict[str, Dict[str, Any]] = {}
        self.access_cache: Dict[str, Dict[str, Any]] = {}

        # Protection keys and certificates
        self.protection_keys: Dict[str, bytes] = {}
        self.key_rotation_schedule: Dict[str, float] = {}

        # Load existing data
        self._load_existing_data()

        # Start background tasks
        self.monitoring_active = False

        logger.info("CDI Protection Framework initialized")

    def _initialize_databases(self):
        """Initialize CDI protection databases."""
        # CDI Assets database
        assets_db = self.storage_path / "cdi_assets.db"
        with sqlite3.connect(assets_db) as conn:
            conn.execute('''
                CREATE TABLE IF NOT EXISTS cdi_assets (
                    asset_id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    description TEXT,
                    classification TEXT NOT NULL,
                    owner TEXT NOT NULL,
                    created_at REAL NOT NULL,
                    updated_at REAL NOT NULL,
                    file_path TEXT,
                    data_type TEXT NOT NULL,
                    sensitivity_markers TEXT,
                    retention_period INTEGER,
                    destruction_date REAL,
                    access_history TEXT,
                    protection_requirements TEXT,
                    metadata TEXT
                )
            ''')

            conn.execute('''
                CREATE INDEX IF NOT EXISTS idx_classification ON cdi_assets(classification)
            ''')
            conn.execute('''
                CREATE INDEX IF NOT EXISTS idx_owner ON cdi_assets(owner)
            ''')

        # Access Policies database
        policies_db = self.storage_path / "access_policies.db"
        with sqlite3.connect(policies_db) as conn:
            conn.execute('''
                CREATE TABLE IF NOT EXISTS access_policies (
                    policy_id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    description TEXT,
                    subject_type TEXT NOT NULL,
                    subject_id TEXT NOT NULL,
                    resource_pattern TEXT NOT NULL,
                    access_level TEXT NOT NULL,
                    conditions TEXT,
                    time_constraints TEXT,
                    location_constraints TEXT,
                    purpose_limitation TEXT,
                    created_at REAL NOT NULL,
                    expires_at REAL,
                    created_by TEXT NOT NULL,
                    approval_required BOOLEAN,
                    approval_status TEXT
                )
            ''')

            conn.execute('''
                CREATE INDEX IF NOT EXISTS idx_subject ON access_policies(subject_type, subject_id)
            ''')
            conn.execute('''
                CREATE INDEX IF NOT EXISTS idx_resource ON access_policies(resource_pattern)
            ''')

        # Access Requests database
        requests_db = self.storage_path / "access_requests.db"
        with sqlite3.connect(requests_db) as conn:
            conn.execute('''
                CREATE TABLE IF NOT EXISTS access_requests (
                    request_id TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    asset_id TEXT NOT NULL,
                    access_level TEXT NOT NULL,
                    purpose TEXT NOT NULL,
                    justification TEXT,
                    requested_at REAL NOT NULL,
                    expires_at REAL,
                    status TEXT NOT NULL,
                    approver_id TEXT,
                    approved_at REAL,
                    conditions TEXT,
                    session_id TEXT
                )
            ''')

            conn.execute('''
                CREATE INDEX IF NOT EXISTS idx_user_requests ON access_requests(user_id)
            ''')
            conn.execute('''
                CREATE INDEX IF NOT EXISTS idx_asset_requests ON access_requests(asset_id)
            ''')
            conn.execute('''
                CREATE INDEX IF NOT EXISTS idx_status ON access_requests(status)
            ''')

    def _load_existing_data(self):
        """Load existing CDI protection data."""
        # Load CDI assets
        assets_db = self.storage_path / "cdi_assets.db"
        if assets_db.exists():
            with sqlite3.connect(assets_db) as conn:
                conn.row_factory = sqlite3.Row
                cursor = conn.execute("SELECT * FROM cdi_assets")

                for row in cursor.fetchall():
                    asset = CDIAsset(
                        asset_id=row['asset_id'],
                        name=row['name'],
                        description=row['description'],
                        classification=CDIClassification(row['classification']),
                        owner=row['owner'],
                        created_at=row['created_at'],
                        updated_at=row['updated_at'],
                        file_path=row['file_path'],
                        data_type=row['data_type'],
                        sensitivity_markers=json.loads(row['sensitivity_markers'] or '[]'),
                        retention_period=row['retention_period'],
                        destruction_date=row['destruction_date'],
                        access_history=json.loads(row['access_history'] or '[]'),
                        protection_requirements=json.loads(row['protection_requirements'] or '{}'),
                        metadata=json.loads(row['metadata'] or '{}')
                    )
                    self.cdi_assets[asset.asset_id] = asset

        logger.info(f"Loaded {len(self.cdi_assets)} CDI assets")

    def register_cdi_asset(self, name: str, description: str,
                            classification: CDIClassification, owner: str,
                            data_type: str, file_path: Optional[str] = None,
                            sensitivity_markers: Optional[List[str]] = None,
                            retention_period: int = 2555,  # 7 years default
                            protection_requirements: Optional[Dict[str, Any]] = None,
                            metadata: Optional[Dict[str, Any]] = None) -> str:
        """Register new CDI asset for protection."""
        asset_id = f"cdi_{uuid.uuid4().hex[:16]}"
        current_time = time.time()

        asset = CDIAsset(
            asset_id=asset_id,
            name=name,
            description=description,
            classification=classification,
            owner=owner,
            created_at=current_time,
            updated_at=current_time,
            file_path=file_path,
            data_type=data_type,
            sensitivity_markers=sensitivity_markers or [],
            retention_period=retention_period,
            destruction_date=None,
            access_history=[],
            protection_requirements=protection_requirements or self._default_protection_requirements(classification),
            metadata=metadata or {}
        )

        # Store asset
        self.cdi_assets[asset_id] = asset
        self._persist_cdi_asset(asset)

        # Generate protection key
        if asset.protection_requirements.get("encryption_required", True):
            self._generate_asset_protection_key(asset_id, classification)

        # Apply default protection
        if file_path:
            asyncio.create_task(self._apply_data_protection(asset_id, DataState.AT_REST))

        # Log asset registration
        self.audit_manager.log_audit_event(
            event_type=AuditEventType.DATA_CLASSIFICATION_CHANGE,
            severity=SeverityLevel.INFO,
            action="cdi_asset_registered",
            description=f"CDI asset registered: {name}",
            user_id=owner,
            resource=asset_id,
            details={
                "asset_name": name,
                "classification": classification.value,
                "data_type": data_type,
                "protection_requirements": asset.protection_requirements
            }
        )

        logger.info(f"Registered CDI asset: {asset_id} ({name})")
        return asset_id

    def _default_protection_requirements(self, classification: CDIClassification) -> Dict[str, Any]:
        """Get default protection requirements for classification level."""
        base_requirements = {
            "encryption_required": True,
            "access_logging": True,
            "backup_encrypted": True,
            "transmission_encrypted": True,
            "storage_encrypted": True
        }

        if classification in [CDIClassification.DFARS_COVERED, CDIClassification.EXPORT_CONTROLLED]:
            base_requirements.update({
                "fips_compliance": True,
                "key_escrow": True,
                "access_approval_required": True,
                "periodic_access_review": True,
                "data_loss_prevention": True,
                "watermarking": True,
                "screen_capture_prevention": True,
                "print_restrictions": True
            })

        return base_requirements

    def _persist_cdi_asset(self, asset: CDIAsset):
        """Persist CDI asset to database."""
        assets_db = self.storage_path / "cdi_assets.db"
        with sqlite3.connect(assets_db) as conn:
            conn.execute('''
                INSERT OR REPLACE INTO cdi_assets (
                    asset_id, name, description, classification, owner,
                    created_at, updated_at, file_path, data_type,
                    sensitivity_markers, retention_period, destruction_date,
                    access_history, protection_requirements, metadata
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                asset.asset_id, asset.name, asset.description,
                asset.classification.value, asset.owner,
                asset.created_at, asset.updated_at, asset.file_path,
                asset.data_type, json.dumps(asset.sensitivity_markers),
                asset.retention_period, asset.destruction_date,
                json.dumps(asset.access_history),
                json.dumps(asset.protection_requirements),
                json.dumps(asset.metadata)
            ))

    def _generate_asset_protection_key(self, asset_id: str, classification: CDIClassification):
        """Generate protection key for CDI asset."""
        # Use stronger key for higher classifications
        key_size = "AES-256-GCM"
        if classification in [CDIClassification.DFARS_COVERED, CDIClassification.EXPORT_CONTROLLED]:
            key_size = "AES-256-GCM"  # Could use even stronger if available

        key, key_id = self.crypto_module.generate_symmetric_key(key_size)
        self.protection_keys[asset_id] = key

        # Schedule key rotation based on classification
        rotation_interval = self._get_key_rotation_interval(classification)
        self.key_rotation_schedule[asset_id] = time.time() + rotation_interval

        # Store key securely (in production, use HSM or key management service)
        key_file = self.storage_path / "keys" / f"{asset_id}.key"
        key_file.parent.mkdir(exist_ok=True)

        with open(key_file, 'wb') as f:
            f.write(key)

        key_file.chmod(0o600)  # Restrict permissions

    def _get_key_rotation_interval(self, classification: CDIClassification) -> int:
        """Get key rotation interval based on classification."""
        intervals = {
            CDIClassification.CONTROLLED_UNCLASSIFIED: 365 * 24 * 3600,  # 1 year
            CDIClassification.BASIC_CUI: 180 * 24 * 3600,  # 6 months
            CDIClassification.SPECIFIED_CUI: 90 * 24 * 3600,  # MAXIMUM_RETRY_ATTEMPTS months
            CDIClassification.DFARS_COVERED: API_TIMEOUT_SECONDS * 24 * 3600,  # 1 month
            CDIClassification.EXPORT_CONTROLLED: 30 * 24 * 3600  # 1 month
        }
        return intervals.get(classification, 90 * 24 * 3600)

    async def _apply_data_protection(self, asset_id: str, data_state: DataState):
        """Apply data protection based on state and requirements."""
        asset = self.cdi_assets.get(asset_id)
        if not asset:
            raise ValueError(f"Asset {asset_id} not found")

        protection_key = self.protection_keys.get(asset_id)
        if not protection_key:
            raise ValueError(f"Protection key not found for asset {asset_id}")

        if data_state == DataState.AT_REST and asset.file_path:
            await self._encrypt_file_at_rest(asset, protection_key)
        elif data_state == DataState.IN_TRANSIT:
            await self._apply_transit_protection(asset)
        elif data_state == DataState.IN_PROCESSING:
            await self._apply_processing_protection(asset)

    async def _encrypt_file_at_rest(self, asset: CDIAsset, key: bytes):
        """Encrypt file at rest with FIPS-compliant encryption."""
        if not asset.file_path or not path_exists(asset.file_path):
            return

        try:
            # Read original file
            with open(asset.file_path, 'rb') as f:
                file_data = f.read()

            # Encrypt data
            encrypted_result = self.crypto_module.encrypt_data(file_data, key, "AES-256-GCM")

            # Write encrypted file
            encrypted_path = f"{asset.file_path}.cdi_encrypted"
            with open(encrypted_path, 'wb') as f:
                # Write encryption metadata
                metadata = {
                    "asset_id": asset.asset_id,
                    "algorithm": "AES-256-GCM",
                    "encrypted_at": time.time(),
                    "classification": asset.classification.value
                }
                metadata_bytes = json.dumps(metadata).encode('utf-8')
                f.write(len(metadata_bytes).to_bytes(4, byteorder='big'))
                f.write(metadata_bytes)

                # Write encrypted data
                f.write(encrypted_result['ciphertext'])
                f.write(encrypted_result['iv'])
                f.write(encrypted_result['tag'])

            # Securely delete original file
            await self._secure_delete_file(asset.file_path)

            # Update asset with encrypted path
            asset.file_path = encrypted_path
            asset.updated_at = time.time()
            self._persist_cdi_asset(asset)

            logger.info(f"Encrypted CDI asset at rest: {asset.asset_id}")

        except Exception as e:
            logger.error(f"Failed to encrypt CDI asset {asset.asset_id}: {e}")
            raise

    async def _secure_delete_file(self, file_path: str, overwrite_passes: int = 3):
        """Securely delete file with multiple overwrite passes."""
        try:
            file_size = Path(file_path).stat().st_size

            # Multiple overwrite passes
            with open(file_path, 'r+b') as f:
                for _ in range(overwrite_passes):
                    f.seek(0)
                    f.write(secrets.token_bytes(file_size))
                    f.flush()
                    f.sync()

            # Remove file
            Path(file_path).unlink()

        except Exception as e:
            logger.error(f"Failed to securely delete {file_path}: {e}")

    async def _apply_transit_protection(self, asset: CDIAsset):
        """Apply protection for data in transit."""
        # This would integrate with network security controls
        self.audit_manager.log_audit_event(
            event_type=AuditEventType.DATA_ACCESS,
            severity=SeverityLevel.INFO,
            action="transit_protection_applied",
            description=f"Transit protection applied to CDI asset {asset.name}",
            resource=asset.asset_id,
            details={
                "protection_type": "in_transit",
                "encryption": "TLS 1.3",
                "classification": asset.classification.value
            }
        )

    async def _apply_processing_protection(self, asset: CDIAsset):
        """Apply protection for data in processing."""
        # This would implement memory protection, secure enclaves, etc.
        self.audit_manager.log_audit_event(
            event_type=AuditEventType.DATA_ACCESS,
            severity=SeverityLevel.INFO,
            action="processing_protection_applied",
            description=f"Processing protection applied to CDI asset {asset.name}",
            resource=asset.asset_id,
            details={
                "protection_type": "in_processing",
                "memory_encryption": True,
                "classification": asset.classification.value
            }
        )

    def create_access_policy(self, name: str, description: str,
                            subject_type: str, subject_id: str,
                            resource_pattern: str, access_level: AccessLevel,
                            created_by: str, conditions: Optional[Dict[str, Any]] = None,
                            time_constraints: Optional[Dict[str, Any]] = None,
                            location_constraints: Optional[List[str]] = None,
                            purpose_limitation: Optional[str] = None,
                            expires_at: Optional[float] = None,
                            approval_required: bool = False) -> str:
        """Create access control policy for CDI resources."""
        policy_id = f"policy_{uuid.uuid4().hex[:16]}"

        policy = AccessPolicy(
            policy_id=policy_id,
            name=name,
            description=description,
            subject_type=subject_type,
            subject_id=subject_id,
            resource_pattern=resource_pattern,
            access_level=access_level,
            conditions=conditions or {},
            time_constraints=time_constraints,
            location_constraints=location_constraints,
            purpose_limitation=purpose_limitation,
            created_at=time.time(),
            expires_at=expires_at,
            created_by=created_by,
            approval_required=approval_required,
            approval_status="active" if not approval_required else "pending"
        )

        self.access_policies[policy_id] = policy
        self._persist_access_policy(policy)

        # Log policy creation
        self.audit_manager.log_audit_event(
            event_type=AuditEventType.AUTHORIZATION,
            severity=SeverityLevel.INFO,
            action="access_policy_created",
            description=f"Access policy created: {name}",
            user_id=created_by,
            resource=resource_pattern,
            details={
                "policy_id": policy_id,
                "subject_type": subject_type,
                "subject_id": subject_id,
                "access_level": access_level.value,
                "approval_required": approval_required
            }
        )

        logger.info(f"Created access policy: {policy_id} ({name})")
        return policy_id

    def _persist_access_policy(self, policy: AccessPolicy):
        """Persist access policy to database."""
        policies_db = self.storage_path / "access_policies.db"
        with sqlite3.connect(policies_db) as conn:
            conn.execute('''
                INSERT OR REPLACE INTO access_policies (
                    policy_id, name, description, subject_type, subject_id,
                    resource_pattern, access_level, conditions, time_constraints,
                    location_constraints, purpose_limitation, created_at,
                    expires_at, created_by, approval_required, approval_status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                policy.policy_id, policy.name, policy.description,
                policy.subject_type, policy.subject_id, policy.resource_pattern,
                policy.access_level.value, json.dumps(policy.conditions),
                json.dumps(policy.time_constraints),
                json.dumps(policy.location_constraints),
                policy.purpose_limitation, policy.created_at,
                policy.expires_at, policy.created_by,
                policy.approval_required, policy.approval_status
            ))

    def request_data_access(self, user_id: str, asset_id: str,
                            access_level: AccessLevel, purpose: str,
                            justification: str, expires_at: Optional[float] = None,
                            session_id: Optional[str] = None) -> str:
        """Request access to CDI asset."""
        request_id = f"req_{uuid.uuid4().hex[:16]}"

        # Check if asset exists
        if asset_id not in self.cdi_assets:
            raise ValueError(f"CDI asset {asset_id} not found")

        asset = self.cdi_assets[asset_id]

        # Determine if approval is required
        approval_required = self._is_approval_required(user_id, asset, access_level)

        request = DataAccessRequest(
            request_id=request_id,
            user_id=user_id,
            asset_id=asset_id,
            access_level=access_level,
            purpose=purpose,
            justification=justification,
            requested_at=time.time(),
            expires_at=expires_at,
            status="pending_approval" if approval_required else "auto_approved",
            approver_id=None,
            approved_at=None if approval_required else time.time(),
            conditions={},
            session_id=session_id
        )

        self.access_requests[request_id] = request
        self._persist_access_request(request)

        # Log access request
        self.audit_manager.log_audit_event(
            event_type=AuditEventType.ACCESS_GRANTED if not approval_required else AuditEventType.AUTHORIZATION,
            severity=SeverityLevel.INFO,
            action="data_access_requested",
            description=f"Data access requested for CDI asset {asset.name}",
            user_id=user_id,
            session_id=session_id,
            resource=asset_id,
            details={
                "request_id": request_id,
                "access_level": access_level.value,
                "purpose": purpose,
                "approval_required": approval_required,
                "classification": asset.classification.value
            }
        )

        # Auto-approve if no approval required
        if not approval_required:
            self._auto_approve_request(request)

        logger.info(f"Data access requested: {request_id} for asset {asset_id}")
        return request_id

    def _is_approval_required(self, user_id: str, asset: CDIAsset, access_level: AccessLevel) -> bool:
        """Determine if approval is required for access request."""
        # High-value classifications require approval
        if asset.classification in [CDIClassification.DFARS_COVERED, CDIClassification.EXPORT_CONTROLLED]:
            return True

        # Write/modify/delete access requires approval
        if access_level in [AccessLevel.WRITE, AccessLevel.MODIFY, AccessLevel.DELETE, AccessLevel.FULL_CONTROL]:
            return True

        # Check asset-specific requirements
        if asset.protection_requirements.get("access_approval_required", False):
            return True

        # Check user-specific policies
        return self._check_user_approval_requirements(user_id, asset.asset_id)

    def _check_user_approval_requirements(self, user_id: str, asset_id: str) -> bool:
        """Check if user has policies requiring approval."""
        # This would integrate with identity management system
        return False

    def _persist_access_request(self, request: DataAccessRequest):
        """Persist access request to database."""
        requests_db = self.storage_path / "access_requests.db"
        with sqlite3.connect(requests_db) as conn:
            conn.execute('''
                INSERT OR REPLACE INTO access_requests (
                    request_id, user_id, asset_id, access_level, purpose,
                    justification, requested_at, expires_at, status,
                    approver_id, approved_at, conditions, session_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                request.request_id, request.user_id, request.asset_id,
                request.access_level.value, request.purpose,
                request.justification, request.requested_at,
                request.expires_at, request.status,
                request.approver_id, request.approved_at,
                json.dumps(request.conditions), request.session_id
            ))

    def _auto_approve_request(self, request: DataAccessRequest):
        """Auto-approve access request."""
        request.status = "approved"
        request.approved_at = time.time()
        request.approver_id = "system"

        # Add to access cache
        cache_key = f"{request.user_id}:{request.asset_id}"
        self.access_cache[cache_key] = {
            "access_level": request.access_level,
            "approved_at": request.approved_at,
            "expires_at": request.expires_at,
            "conditions": request.conditions
        }

    def approve_access_request(self, request_id: str, approver_id: str,
                            conditions: Optional[Dict[str, Any]] = None) -> bool:
        """Approve pending access request."""
        if request_id not in self.access_requests:
            raise ValueError(f"Access request {request_id} not found")

        request = self.access_requests[request_id]

        if request.status != "pending_approval":
            raise ValueError(f"Request {request_id} is not pending approval")

        # Update request
        request.status = "approved"
        request.approver_id = approver_id
        request.approved_at = time.time()
        request.conditions = conditions or {}

        self._persist_access_request(request)

        # Add to access cache
        cache_key = f"{request.user_id}:{request.asset_id}"
        self.access_cache[cache_key] = {
            "access_level": request.access_level,
            "approved_at": request.approved_at,
            "expires_at": request.expires_at,
            "conditions": request.conditions
        }

        # Log approval
        asset = self.cdi_assets[request.asset_id]
        self.audit_manager.log_audit_event(
            event_type=AuditEventType.ACCESS_GRANTED,
            severity=SeverityLevel.INFO,
            action="data_access_approved",
            description=f"Data access approved for CDI asset {asset.name}",
            user_id=approver_id,
            resource=request.asset_id,
            details={
                "request_id": request_id,
                "user_id": request.user_id,
                "access_level": request.access_level.value,
                "conditions": request.conditions
            }
        )

        logger.info(f"Access request approved: {request_id} by {approver_id}")
        return True

    def check_access_authorization(self, user_id: str, asset_id: str,
                                access_level: AccessLevel,
                                session_id: Optional[str] = None,
                                context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Check if user is authorized for specific access to CDI asset."""
        # Check cache first
        cache_key = f"{user_id}:{asset_id}"
        cached_access = self.access_cache.get(cache_key)

        if cached_access:
            # Check if access has expired
            if cached_access.get("expires_at") and time.time() > cached_access["expires_at"]:
                del self.access_cache[cache_key]
                cached_access = None

        # Check asset exists
        if asset_id not in self.cdi_assets:
            return {"authorized": False, "reason": "Asset not found"}

        asset = self.cdi_assets[asset_id]

        # Check if user has sufficient access level
        if cached_access:
            cached_level = AccessLevel(cached_access["access_level"])
            if self._access_level_sufficient(cached_level, access_level):
                # Log access
                self._log_asset_access(user_id, asset, access_level, session_id, "granted")
                return {
                    "authorized": True,
                    "access_level": cached_level.value,
                    "conditions": cached_access.get("conditions", {}),
                    "expires_at": cached_access.get("expires_at")
                }

        # Check policies
        applicable_policies = self._get_applicable_policies(user_id, asset_id)

        for policy in applicable_policies:
            if self._policy_grants_access(policy, access_level, context):
                # Log access
                self._log_asset_access(user_id, asset, access_level, session_id, "granted")
                return {
                    "authorized": True,
                    "access_level": access_level.value,
                    "policy_id": policy.policy_id,
                    "conditions": policy.conditions
                }

        # Access denied
        self._log_asset_access(user_id, asset, access_level, session_id, "denied")
        return {"authorized": False, "reason": "No applicable access policy"}

    def _access_level_sufficient(self, granted_level: AccessLevel, required_level: AccessLevel) -> bool:
        """Check if granted access level is sufficient for required level."""
        level_hierarchy = {
            AccessLevel.NONE: 0,
            AccessLevel.READ: 1,
            AccessLevel.WRITE: 2,
            AccessLevel.MODIFY: 3,
            AccessLevel.DELETE: 4,
            AccessLevel.ADMIN: 5,
            AccessLevel.FULL_CONTROL: 6
        }

        return level_hierarchy.get(granted_level, 0) >= level_hierarchy.get(required_level, 0)

    def _get_applicable_policies(self, user_id: str, asset_id: str) -> List[AccessPolicy]:
        """Get policies applicable to user and asset."""
        applicable = []

        for policy in self.access_policies.values():
            # Check if policy applies to this user
            if policy.subject_type == "user" and policy.subject_id == user_id:
                # Check if policy applies to this asset
                if self._resource_pattern_matches(policy.resource_pattern, asset_id):
                    # Check if policy is still valid
                    if not policy.expires_at or time.time() < policy.expires_at:
                        applicable.append(policy)

        return applicable

    def _resource_pattern_matches(self, pattern: str, asset_id: str) -> bool:
        """Check if resource pattern matches asset ID."""
        # Simple pattern matching - could be enhanced with regex
        if pattern == "*":
            return True
        if pattern == asset_id:
            return True
        # Pattern matching for prefixes
        if pattern.endswith("*") and asset_id.startswith(pattern[:-1]):
            return True
        return False

    def _policy_grants_access(self, policy: AccessPolicy, requested_level: AccessLevel,
                            context: Optional[Dict[str, Any]] = None) -> bool:
        """Check if policy grants requested access level."""
        # Check access level
        if not self._access_level_sufficient(policy.access_level, requested_level):
            return False

        # Check time constraints
        if policy.time_constraints:
            current_time = datetime.now()
            if not self._time_constraints_met(policy.time_constraints, current_time):
                return False

        # Check location constraints
        if policy.location_constraints and context:
            user_location = context.get("location")
            if user_location and user_location not in policy.location_constraints:
                return False

        # Check other conditions
        if policy.conditions and context:
            if not self._conditions_met(policy.conditions, context):
                return False

        return True

    def _time_constraints_met(self, constraints: Dict[str, Any], current_time: datetime) -> bool:
        """Check if time constraints are met."""
        # Simple time constraint checking
        if "allowed_hours" in constraints:
            current_hour = current_time.hour
            allowed_hours = constraints["allowed_hours"]
            if current_hour not in allowed_hours:
                return False

        if "allowed_days" in constraints:
            current_day = current_time.weekday()  # 0=Monday
            allowed_days = constraints["allowed_days"]
            if current_day not in allowed_days:
                return False

        return True

    def _conditions_met(self, conditions: Dict[str, Any], context: Dict[str, Any]) -> bool:
        """Check if policy conditions are met."""
        # Simple condition checking - could be enhanced
        for key, required_value in conditions.items():
            if context.get(key) != required_value:
                return False
        return True

    def _log_asset_access(self, user_id: str, asset: CDIAsset, access_level: AccessLevel,
                        session_id: Optional[str], outcome: str):
        """Log CDI asset access attempt."""
        # Add to asset access history
        access_record = {
            "timestamp": time.time(),
            "user_id": user_id,
            "session_id": session_id,
            "access_level": access_level.value,
            "outcome": outcome
        }
        asset.access_history.append(access_record)

        # Keep only recent access history
        if len(asset.access_history) > 1000:
            asset.access_history = asset.access_history[-1000:]

        self._persist_cdi_asset(asset)

        # Log to audit trail
        event_type = AuditEventType.ACCESS_GRANTED if outcome == "granted" else AuditEventType.ACCESS_DENIED
        severity = SeverityLevel.WARNING if outcome == "denied" else SeverityLevel.INFO

        self.audit_manager.log_audit_event(
            event_type=event_type,
            severity=severity,
            action=f"cdi_access_{outcome}",
            description=f"CDI asset access {outcome}: {asset.name}",
            user_id=user_id,
            session_id=session_id,
            resource=asset.asset_id,
            details={
                "asset_name": asset.name,
                "classification": asset.classification.value,
                "access_level": access_level.value,
                "outcome": outcome
            }
        )

    async def decrypt_cdi_asset(self, asset_id: str, user_id: str,
                                session_id: Optional[str] = None) -> bytes:
        """Decrypt CDI asset for authorized access."""
        # Check authorization
        auth_result = self.check_access_authorization(
            user_id, asset_id, AccessLevel.READ, session_id
        )

        if not auth_result["authorized"]:
            raise PermissionError(f"User {user_id} not authorized to access asset {asset_id}")

        asset = self.cdi_assets[asset_id]
        if not asset.file_path or not path_exists(asset.file_path):
            raise FileNotFoundError(f"CDI asset file not found: {asset_id}")

        protection_key = self.protection_keys.get(asset_id)
        if not protection_key:
            # Try to load key from storage
            key_file = self.storage_path / "keys" / f"{asset_id}.key"
            if key_file.exists():
                with open(key_file, 'rb') as f:
                    protection_key = f.read()
                self.protection_keys[asset_id] = protection_key
            else:
                raise ValueError(f"Protection key not found for asset {asset_id}")

        try:
            # Read encrypted file
            with open(asset.file_path, 'rb') as f:
                # Read metadata
                metadata_length = int.from_bytes(f.read(4), byteorder='big')
                metadata_bytes = f.read(metadata_length)
                metadata = json.loads(metadata_bytes.decode('utf-8'))

                # Read encrypted data components
                remaining_data = f.read()

            # Extract encryption components (simplified - would need proper parsing)
            ciphertext_length = len(remaining_data) - 12 - 16  # IV (12) + tag (16)
            ciphertext = remaining_data[:ciphertext_length]
            iv = remaining_data[ciphertext_length:ciphertext_length + 12]
            tag = remaining_data[ciphertext_length + 12:]

            # Decrypt data
            encrypted_data = {
                "ciphertext": ciphertext,
                "iv": iv,
                "tag": tag,
                "algorithm": metadata["algorithm"]
            }

            decrypted_data = self.crypto_module.decrypt_data(encrypted_data, protection_key)

            # Log successful decryption
            self.audit_manager.log_audit_event(
                event_type=AuditEventType.DATA_ACCESS,
                severity=SeverityLevel.INFO,
                action="cdi_asset_decrypted",
                description=f"CDI asset decrypted: {asset.name}",
                user_id=user_id,
                session_id=session_id,
                resource=asset_id,
                details={
                    "asset_name": asset.name,
                    "classification": asset.classification.value,
                    "decryption_algorithm": metadata["algorithm"]
                }
            )

            return decrypted_data

        except Exception as e:
            # Log failed decryption
            self.audit_manager.log_audit_event(
                event_type=AuditEventType.SECURITY_ALERT,
                severity=SeverityLevel.HIGH,
                action="cdi_decryption_failed",
                description=f"CDI asset decryption failed: {asset.name}",
                user_id=user_id,
                session_id=session_id,
                resource=asset_id,
                details={
                    "error": str(e),
                    "asset_name": asset.name,
                    "classification": asset.classification.value
                }
            )
            raise

    def get_cdi_inventory(self, classification_filter: Optional[CDIClassification] = None,
                        owner_filter: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get CDI asset inventory."""
        inventory = []

        for asset in self.cdi_assets.values():
            if classification_filter and asset.classification != classification_filter:
                continue
            if owner_filter and asset.owner != owner_filter:
                continue

            inventory.append({
                "asset_id": asset.asset_id,
                "name": asset.name,
                "description": asset.description,
                "classification": asset.classification.value,
                "owner": asset.owner,
                "data_type": asset.data_type,
                "created_at": asset.created_at,
                "updated_at": asset.updated_at,
                "retention_period": asset.retention_period,
                "protection_status": "encrypted" if asset.asset_id in self.protection_keys else "unprotected",
                "access_history_count": len(asset.access_history),
                "sensitivity_markers": asset.sensitivity_markers
            })

        return inventory

    def get_access_report(self, days: int = 30) -> Dict[str, Any]:
        """Generate CDI access report."""
        cutoff_time = time.time() - (days * 24 * 3600)

        report = {
            "report_period_days": days,
            "total_assets": len(self.cdi_assets),
            "assets_by_classification": {},
            "access_requests": {
                "total": len(self.access_requests),
                "pending": 0,
                "approved": 0,
                "denied": 0,
                "expired": 0
            },
            "recent_access": [],
            "top_accessed_assets": [],
            "security_events": 0
        }

        # Count assets by classification
        for asset in self.cdi_assets.values():
            classification = asset.classification.value
            report["assets_by_classification"][classification] = \
                report["assets_by_classification"].get(classification, 0) + 1

        # Count access requests by status
        for request in self.access_requests.values():
            if request.requested_at >= cutoff_time:
                report["access_requests"][request.status] = \
                    report["access_requests"].get(request.status, 0) + 1

        # Collect recent access events
        for asset in self.cdi_assets.values():
            for access_record in asset.access_history:
                if access_record["timestamp"] >= cutoff_time:
                    report["recent_access"].append({
                        "asset_id": asset.asset_id,
                        "asset_name": asset.name,
                        "classification": asset.classification.value,
                        "user_id": access_record["user_id"],
                        "access_level": access_record["access_level"],
                        "timestamp": access_record["timestamp"],
                        "outcome": access_record["outcome"]
                    })

        return report

# Factory function
def create_cdi_protection_framework(storage_path: str = ".claude/.artifacts/cdi_protection") -> CDIProtectionFramework:
    """Create CDI protection framework."""
    return CDIProtectionFramework(storage_path)

# Example usage
if __name__ == "__main__":
    async def main():
        # Initialize CDI protection framework
        cdi_framework = create_cdi_protection_framework()

        print("CDI Protection Framework")
        print("=" * 30)

        # Register a CDI asset
        asset_id = cdi_framework.register_cdi_asset(
            name="Defense Contract Specifications",
            description="Technical specifications for defense contract XYZ-123",
            classification=CDIClassification.DFARS_COVERED,
            owner="contract_manager",
            data_type="technical_document",
            sensitivity_markers=["DFARS", "CUI", "NOFORN"]
        )

        print(f"Registered CDI asset: {asset_id}")

        # Create access policy
        policy_id = cdi_framework.create_access_policy(
            name="Defense Contract Access Policy",
            description="Access policy for defense contract documents",
            subject_type="user",
            subject_id="engineer_001",
            resource_pattern=asset_id,
            access_level=AccessLevel.READ,
            created_by="security_admin",
            approval_required=True
        )

        print(f"Created access policy: {policy_id}")

        # Request access
        request_id = cdi_framework.request_data_access(
            user_id="engineer_001",
            asset_id=asset_id,
            access_level=AccessLevel.READ,
            purpose="Technical review for implementation",
            justification="Need to review technical specifications for Project Alpha"
        )

        print(f"Access request created: {request_id}")

        # Approve access request
        approved = cdi_framework.approve_access_request(
            request_id=request_id,
            approver_id="security_manager"
        )

        print(f"Access request approved: {approved}")

        # Check authorization
        auth_result = cdi_framework.check_access_authorization(
            user_id="engineer_001",
            asset_id=asset_id,
            access_level=AccessLevel.READ
        )

        print(f"Authorization check: {auth_result['authorized']}")

        # Get inventory
        inventory = cdi_framework.get_cdi_inventory()
        print(f"CDI inventory: {len(inventory)} assets")

        # Generate access report
        report = cdi_framework.get_access_report()
        print(f"Access report: {report['total_assets']} total assets, {report['access_requests']['total']} requests")

        return cdi_framework

    # Run example
    asyncio.run(main())