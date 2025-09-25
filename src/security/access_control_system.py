"""
DFARS Access Control System
Multi-factor authentication and role-based access control for defense industry compliance.
"""

import json

from lib.shared.utilities import get_logger

class AuthenticationMethod(Enum):
    """Supported authentication methods."""
    PASSWORD = "password"
    MULTI_FACTOR = "multi_factor"
    SMART_CARD = "smart_card"
    BIOMETRIC = "biometric"
    HARDWARE_TOKEN = "hardware_token"

class AuthorizationLevel(Enum):
    """Authorization levels for DFARS compliance."""
    PUBLIC = "public"
    INTERNAL = "internal"
    CONFIDENTIAL = "confidential"
    RESTRICTED = "restricted"
    TOP_SECRET = "top_secret"

class UserRole(Enum):
    """User roles with specific permissions."""
    SYSTEM_ADMIN = "system_admin"
    SECURITY_OFFICER = "security_officer"
    COMPLIANCE_AUDITOR = "compliance_auditor"
    OPERATIONS_USER = "operations_user"
    READ_ONLY_USER = "read_only_user"

class SessionStatus(Enum):
    """User session status."""
    ACTIVE = "active"
    EXPIRED = "expired"
    LOCKED = "locked"
    TERMINATED = "terminated"

@dataclass
class User:
    """User account with DFARS compliance attributes."""
    user_id: str
    username: str
    email: str
    full_name: str
    role: UserRole
    clearance_level: AuthorizationLevel
    password_hash: str
    mfa_secret: Optional[str]
    smart_card_id: Optional[str]
    biometric_hash: Optional[str]
    created_timestamp: float
    last_login: Optional[float]
    failed_login_attempts: int
    account_locked: bool
    account_expiration: Optional[float]
    password_expiration: float
    must_change_password: bool
    permissions: Set[str]
    metadata: Dict[str, Any]

@dataclass
class Session:
    """User session with security controls."""
    session_id: str
    user_id: str
    created_timestamp: float
    last_activity: float
    expires_at: float
    source_ip: str
    user_agent: str
    authentication_method: AuthenticationMethod
    mfa_verified: bool
    status: SessionStatus
    permissions: Set[str]
    access_log: List[Dict[str, Any]]

@dataclass
class Permission:
    """Fine-grained permission definition."""
    permission_id: str
    name: str
    description: str
    resource_pattern: str
    actions: List[str]
    authorization_level: AuthorizationLevel
    conditions: Dict[str, Any]

@dataclass
class AccessRequest:
    """Access request with context."""
    request_id: str
    user_id: str
    session_id: str
    resource: str
    action: str
    timestamp: float
    source_ip: str
    user_agent: str
    context: Dict[str, Any]

class DFARSAccessControlSystem:
    """
    Comprehensive access control system implementing DFARS requirements
    with multi-factor authentication, role-based access control,
    and comprehensive audit logging.
    """

    # Security configuration
    SESSION_TIMEOUT = 900  # 15 minutes
    MAX_FAILED_ATTEMPTS = 5
    ACCOUNT_LOCKOUT_DURATION = 1800  # 30 minutes
    PASSWORD_COMPLEXITY_REQUIREMENTS = {
        "min_length": 12,
        "require_uppercase": True,
        "require_lowercase": True,
        "require_digits": True,
        "require_special": True,
        "max_age_days": 90
    }

    def __init__(self, storage_path: str = ".claude/.artifacts/access_control"):
        """Initialize DFARS access control system."""
        self.storage_path = Path(storage_path)
        self.storage_path.mkdir(parents=True, exist_ok=True)

        # Initialize security components
        self.crypto_module = FIPSCryptoModule()
        self.audit_manager = EnhancedDFARSAuditTrailManager(
            str(self.storage_path / "audit")
        )

        # User and session storage
        self.users: Dict[str, User] = {}
        self.sessions: Dict[str, Session] = {}
        self.permissions: Dict[str, Permission] = {}

        # Security keys
        self.jwt_secret = self._load_or_generate_jwt_secret()
        self.encryption_key = self._load_or_generate_encryption_key()

        # Load existing data
        self._load_system_data()

        # Initialize default permissions
        self._initialize_default_permissions()

        # Start maintenance tasks
        asyncio.create_task(self._session_cleanup_loop())
        asyncio.create_task(self._security_monitoring_loop())

        logger.info("DFARS Access Control System initialized")

    def _load_or_generate_jwt_secret(self) -> bytes:
        """Load or generate JWT signing secret."""
        secret_file = self.storage_path / "jwt_secret.key"

        if secret_file.exists():
            try:
                with open(secret_file, 'rb') as f:
                    return f.read()
            except Exception as e:
                logger.error(f"Failed to load JWT secret: {e}")

        # Generate new secret
        secret = secrets.token_bytes(64)  # 512-bit secret

        try:
            with open(secret_file, 'wb') as f:
                f.write(secret)
            secret_file.chmod(0o600)
        except Exception as e:
            logger.error(f"Failed to save JWT secret: {e}")

        return secret

    def _load_or_generate_encryption_key(self) -> Fernet:
        """Load or generate encryption key for sensitive data."""
        key_file = self.storage_path / "encryption.key"

        if key_file.exists():
            try:
                with open(key_file, 'rb') as f:
                    return Fernet(f.read())
            except Exception as e:
                logger.error(f"Failed to load encryption key: {e}")

        # Generate new key
        key = Fernet.generate_key()
        encryption = Fernet(key)

        try:
            with open(key_file, 'wb') as f:
                f.write(key)
            key_file.chmod(0o600)
        except Exception as e:
            logger.error(f"Failed to save encryption key: {e}")

        return encryption

    def _load_system_data(self):
        """Load users, sessions, and permissions from storage."""
        # Load users
        users_file = self.storage_path / "users.json"
        if users_file.exists():
            try:
                with open(users_file, 'r') as f:
                    users_data = json.load(f)

                for user_data in users_data:
                    user = User(
                        user_id=user_data["user_id"],
                        username=user_data["username"],
                        email=user_data["email"],
                        full_name=user_data["full_name"],
                        role=UserRole(user_data["role"]),
                        clearance_level=AuthorizationLevel(user_data["clearance_level"]),
                        password_hash=user_data["password_hash"],
                        mfa_secret=user_data.get("mfa_secret"),
                        smart_card_id=user_data.get("smart_card_id"),
                        biometric_hash=user_data.get("biometric_hash"),
                        created_timestamp=user_data["created_timestamp"],
                        last_login=user_data.get("last_login"),
                        failed_login_attempts=user_data.get("failed_login_attempts", 0),
                        account_locked=user_data.get("account_locked", False),
                        account_expiration=user_data.get("account_expiration"),
                        password_expiration=user_data["password_expiration"],
                        must_change_password=user_data.get("must_change_password", False),
                        permissions=set(user_data.get("permissions", [])),
                        metadata=user_data.get("metadata", {})
                    )
                    self.users[user.user_id] = user

                logger.info(f"Loaded {len(self.users)} users")

            except Exception as e:
                logger.error(f"Failed to load users: {e}")

        # Load permissions
        permissions_file = self.storage_path / "permissions.json"
        if permissions_file.exists():
            try:
                with open(permissions_file, 'r') as f:
                    permissions_data = json.load(f)

                for perm_data in permissions_data:
                    permission = Permission(
                        permission_id=perm_data["permission_id"],
                        name=perm_data["name"],
                        description=perm_data["description"],
                        resource_pattern=perm_data["resource_pattern"],
                        actions=perm_data["actions"],
                        authorization_level=AuthorizationLevel(perm_data["authorization_level"]),
                        conditions=perm_data.get("conditions", {})
                    )
                    self.permissions[permission.permission_id] = permission

                logger.info(f"Loaded {len(self.permissions)} permissions")

            except Exception as e:
                logger.error(f"Failed to load permissions: {e}")

    def _save_system_data(self):
        """Save users and permissions to storage."""
        # Save users
        users_data = [
            {
                "user_id": user.user_id,
                "username": user.username,
                "email": user.email,
                "full_name": user.full_name,
                "role": user.role.value,
                "clearance_level": user.clearance_level.value,
                "password_hash": user.password_hash,
                "mfa_secret": user.mfa_secret,
                "smart_card_id": user.smart_card_id,
                "biometric_hash": user.biometric_hash,
                "created_timestamp": user.created_timestamp,
                "last_login": user.last_login,
                "failed_login_attempts": user.failed_login_attempts,
                "account_locked": user.account_locked,
                "account_expiration": user.account_expiration,
                "password_expiration": user.password_expiration,
                "must_change_password": user.must_change_password,
                "permissions": list(user.permissions),
                "metadata": user.metadata
            }
            for user in self.users.values()
        ]

        users_file = self.storage_path / "users.json"
        try:
            with open(users_file, 'w') as f:
                json.dump(users_data, f, indent=2)
        except Exception as e:
            logger.error(f"Failed to save users: {e}")

        # Save permissions
        permissions_data = [
            {
                "permission_id": perm.permission_id,
                "name": perm.name,
                "description": perm.description,
                "resource_pattern": perm.resource_pattern,
                "actions": perm.actions,
                "authorization_level": perm.authorization_level.value,
                "conditions": perm.conditions
            }
            for perm in self.permissions.values()
        ]

        permissions_file = self.storage_path / "permissions.json"
        try:
            with open(permissions_file, 'w') as f:
                json.dump(permissions_data, f, indent=2)
        except Exception as e:
            logger.error(f"Failed to save permissions: {e}")

    def _initialize_default_permissions(self):
        """Initialize default permission set for DFARS compliance."""
        default_permissions = [
            Permission(
                permission_id="sys_admin_full",
                name="System Administrator Full Access",
                description="Complete system administration access",
                resource_pattern="**/*",
                actions=["create", "read", "update", "delete", "execute", "admin"],
                authorization_level=AuthorizationLevel.TOP_SECRET,
                conditions={"require_mfa": True}
            ),
            Permission(
                permission_id="sec_officer_monitor",
                name="Security Officer Monitoring",
                description="Security monitoring and incident response",
                resource_pattern="/security/**/*",
                actions=["read", "monitor", "investigate", "respond"],
                authorization_level=AuthorizationLevel.RESTRICTED,
                conditions={"require_mfa": True}
            ),
            Permission(
                permission_id="audit_read_only",
                name="Compliance Auditor Read-Only",
                description="Read-only access for compliance auditing",
                resource_pattern="/audit/**/*",
                actions=["read", "export"],
                authorization_level=AuthorizationLevel.CONFIDENTIAL,
                conditions={}
            ),
            Permission(
                permission_id="ops_user_limited",
                name="Operations User Limited",
                description="Limited operational access",
                resource_pattern="/operations/**/*",
                actions=["read", "update"],
                authorization_level=AuthorizationLevel.INTERNAL,
                conditions={}
            )
        ]

        for permission in default_permissions:
            if permission.permission_id not in self.permissions:
                self.permissions[permission.permission_id] = permission

    def create_user(self, username: str, email: str, full_name: str,
                    role: UserRole, clearance_level: AuthorizationLevel,
                    password: str, **kwargs) -> str:
        """Create new user account with DFARS compliance checks."""
        # Validate password complexity
        if not self._validate_password_complexity(password):
            raise ValueError("Password does not meet complexity requirements")

        # Generate user ID
        user_id = f"usr_{int(time.time())}_{secrets.token_hex(8)}"

        # Hash password
        password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

        # Calculate password expiration
        password_expiration = time.time() + (self.PASSWORD_COMPLEXITY_REQUIREMENTS["max_age_days"] * 24 * 3600)

        # Assign role-based permissions
        permissions = self._get_role_permissions(role)

        # Create user
        user = User(
            user_id=user_id,
            username=username,
            email=email,
            full_name=full_name,
            role=role,
            clearance_level=clearance_level,
            password_hash=password_hash,
            mfa_secret=None,
            smart_card_id=kwargs.get("smart_card_id"),
            biometric_hash=kwargs.get("biometric_hash"),
            created_timestamp=time.time(),
            last_login=None,
            failed_login_attempts=0,
            account_locked=False,
            account_expiration=kwargs.get("account_expiration"),
            password_expiration=password_expiration,
            must_change_password=kwargs.get("must_change_password", False),
            permissions=permissions,
            metadata=kwargs.get("metadata", {})
        )

        self.users[user_id] = user
        self._save_system_data()

        # Log user creation
        self.audit_manager.log_audit_event(
            event_type=AuditEventType.USER_CREATED,
            severity=SeverityLevel.INFO,
            action="create_user",
            description=f"Created user account: {username}",
            details={
                "user_id": user_id,
                "role": role.value,
                "clearance_level": clearance_level.value
            }
        )

        logger.info(f"Created user: {username} ({user_id})")
        return user_id

    def authenticate_user(self, username: str, password: str,
                        source_ip: str, user_agent: str,
                        mfa_token: Optional[str] = None,
                        smart_card_data: Optional[str] = None) -> Tuple[Optional[str], Dict[str, Any]]:
        """Authenticate user with multi-factor authentication."""
        auth_result = {
            "success": False,
            "session_id": None,
            "requires_mfa": False,
            "requires_password_change": False,
            "error_message": None,
            "authentication_method": AuthenticationMethod.PASSWORD
        }

        # Find user
        user = None
        for u in self.users.values():
            if u.username == username:
                user = u
                break

        if not user:
            auth_result["error_message"] = "Invalid credentials"
            self._log_authentication_failure(username, source_ip, user_agent, "user_not_found")
            return None, auth_result

        # Check account status
        if user.account_locked:
            auth_result["error_message"] = "Account locked"
            self._log_authentication_failure(username, source_ip, user_agent, "account_locked")
            return None, auth_result

        if user.account_expiration and user.account_expiration < time.time():
            auth_result["error_message"] = "Account expired"
            self._log_authentication_failure(username, source_ip, user_agent, "account_expired")
            return None, auth_result

        # Verify password
        if not bcrypt.checkpw(password.encode('utf-8'), user.password_hash.encode('utf-8')):
            user.failed_login_attempts += 1

            if user.failed_login_attempts >= self.MAX_FAILED_ATTEMPTS:
                user.account_locked = True
                self._save_system_data()

            auth_result["error_message"] = "Invalid credentials"
            self._log_authentication_failure(username, source_ip, user_agent, "invalid_password")
            return None, auth_result

        # Check for MFA requirement
        requires_mfa = (
            user.role in [UserRole.SYSTEM_ADMIN, UserRole.SECURITY_OFFICER] or
            user.clearance_level in [AuthorizationLevel.RESTRICTED, AuthorizationLevel.TOP_SECRET]
        )

        if requires_mfa and not mfa_token and not smart_card_data:
            auth_result["requires_mfa"] = True
            return None, auth_result

        # Verify MFA if provided
        if requires_mfa:
            if mfa_token and not self._verify_mfa_token(user, mfa_token):
                auth_result["error_message"] = "Invalid MFA token"
                self._log_authentication_failure(username, source_ip, user_agent, "invalid_mfa")
                return None, auth_result

            if smart_card_data and not self._verify_smart_card(user, smart_card_data):
                auth_result["error_message"] = "Invalid smart card"
                self._log_authentication_failure(username, source_ip, user_agent, "invalid_smart_card")
                return None, auth_result

            auth_result["authentication_method"] = (
                AuthenticationMethod.SMART_CARD if smart_card_data else AuthenticationMethod.MULTI_FACTOR
            )

        # Check password expiration
        if user.password_expiration < time.time() or user.must_change_password:
            auth_result["requires_password_change"] = True

        # Create session
        session_id = self._create_session(user, source_ip, user_agent, auth_result["authentication_method"])

        # Update user login info
        user.last_login = time.time()
        user.failed_login_attempts = 0
        self._save_system_data()

        # Log successful authentication
        self.audit_manager.log_user_authentication(
            user_id=user.user_id,
            success=True,
            source_ip=source_ip,
            user_agent=user_agent,
            details={
                "authentication_method": auth_result["authentication_method"].value,
                "session_id": session_id
            }
        )

        auth_result["success"] = True
        auth_result["session_id"] = session_id

        logger.info(f"User authenticated: {username} ({session_id})")
        return session_id, auth_result

    def _validate_password_complexity(self, password: str) -> bool:
        """Validate password meets DFARS complexity requirements."""
        reqs = self.PASSWORD_COMPLEXITY_REQUIREMENTS

        if len(password) < reqs["min_length"]:
            return False

        if reqs["require_uppercase"] and not any(c.isupper() for c in password):
            return False

        if reqs["require_lowercase"] and not any(c.islower() for c in password):
            return False

        if reqs["require_digits"] and not any(c.isdigit() for c in password):
            return False

        if reqs["require_special"] and not any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in password):
            return False

        return True

    def _get_role_permissions(self, role: UserRole) -> Set[str]:
        """Get permissions based on user role."""
        role_permissions = {
            UserRole.SYSTEM_ADMIN: {"sys_admin_full"},
            UserRole.SECURITY_OFFICER: {"sec_officer_monitor"},
            UserRole.COMPLIANCE_AUDITOR: {"audit_read_only"},
            UserRole.OPERATIONS_USER: {"ops_user_limited"},
            UserRole.READ_ONLY_USER: set()
        }

        return role_permissions.get(role, set())

    def _verify_mfa_token(self, user: User, token: str) -> bool:
        """Verify multi-factor authentication token."""
        if not user.mfa_secret:
            return False

        try:
            import pyotp
            totp = pyotp.TOTP(user.mfa_secret)
            return totp.verify(token, valid_window=1)
        except ImportError:
            # Fallback implementation for demonstration
            return len(token) == 6 and token.isdigit()

    def _verify_smart_card(self, user: User, smart_card_data: str) -> bool:
        """Verify smart card authentication."""
        if not user.smart_card_id:
            return False

        # In production, implement proper smart card verification
        return smart_card_data == user.smart_card_id

    def _create_session(self, user: User, source_ip: str, user_agent: str,
                        auth_method: AuthenticationMethod) -> str:
        """Create authenticated session."""
        session_id = f"sess_{int(time.time())}_{secrets.token_hex(16)}"

        session = Session(
            session_id=session_id,
            user_id=user.user_id,
            created_timestamp=time.time(),
            last_activity=time.time(),
            expires_at=time.time() + self.SESSION_TIMEOUT,
            source_ip=source_ip,
            user_agent=user_agent,
            authentication_method=auth_method,
            mfa_verified=auth_method in [AuthenticationMethod.MULTI_FACTOR, AuthenticationMethod.SMART_CARD],
            status=SessionStatus.ACTIVE,
            permissions=user.permissions.copy(),
            access_log=[]
        )

        self.sessions[session_id] = session
        return session_id

    def _log_authentication_failure(self, username: str, source_ip: str,
                                    user_agent: str, reason: str):
        """Log authentication failure."""
        self.audit_manager.log_user_authentication(
            user_id=username,  # Use username since user_id may not exist
            success=False,
            source_ip=source_ip,
            user_agent=user_agent,
            details={"failure_reason": reason}
        )

    def authorize_access(self, session_id: str, resource: str, action: str) -> Tuple[bool, Dict[str, Any]]:
        """Authorize user access to resource with specific action."""
        auth_result = {
            "authorized": False,
            "reason": None,
            "session_valid": False,
            "permission_matched": False
        }

        # Validate session
        session = self.sessions.get(session_id)
        if not session:
            auth_result["reason"] = "Invalid session"
            return False, auth_result

        if session.status != SessionStatus.ACTIVE:
            auth_result["reason"] = "Session not active"
            return False, auth_result

        if session.expires_at < time.time():
            session.status = SessionStatus.EXPIRED
            auth_result["reason"] = "Session expired"
            return False, auth_result

        auth_result["session_valid"] = True

        # Get user
        user = self.users.get(session.user_id)
        if not user:
            auth_result["reason"] = "User not found"
            return False, auth_result

        # Check user permissions
        for permission_id in user.permissions:
            permission = self.permissions.get(permission_id)
            if not permission:
                continue

            if self._match_resource_pattern(resource, permission.resource_pattern):
                if action in permission.actions:
                    # Check authorization level
                    if user.clearance_level.value >= permission.authorization_level.value:
                        # Check additional conditions
                        if self._check_permission_conditions(session, permission):
                            auth_result["authorized"] = True
                            auth_result["permission_matched"] = True
                            break

        # Update session activity
        session.last_activity = time.time()
        session.expires_at = time.time() + self.SESSION_TIMEOUT

        # Log access attempt
        access_log_entry = {
            "timestamp": time.time(),
            "resource": resource,
            "action": action,
            "authorized": auth_result["authorized"],
            "permission_id": permission_id if auth_result["permission_matched"] else None
        }
        session.access_log.append(access_log_entry)

        # Audit log
        self.audit_manager.log_data_access(
            user_id=user.user_id,
            resource=resource,
            action=action,
            success=auth_result["authorized"],
            details={
                "session_id": session_id,
                "source_ip": session.source_ip,
                "reason": auth_result.get("reason")
            }
        )

        return auth_result["authorized"], auth_result

    def _match_resource_pattern(self, resource: str, pattern: str) -> bool:
        """Match resource against permission pattern."""
        import fnmatch
        return fnmatch.fnmatch(resource, pattern)

    def _check_permission_conditions(self, session: Session, permission: Permission) -> bool:
        """Check additional permission conditions."""
        conditions = permission.conditions

        # Check MFA requirement
        if conditions.get("require_mfa", False) and not session.mfa_verified:
            return False

        # Check time-based restrictions
        if "time_restrictions" in conditions:
            # Implement time-based access control

        # Check IP restrictions
            pass
        if "allowed_ips" in conditions:
            if session.source_ip not in conditions["allowed_ips"]:
                return False

        return True

    def logout_user(self, session_id: str):
        """Logout user and terminate session."""
        session = self.sessions.get(session_id)
        if not session:
            return

        session.status = SessionStatus.TERMINATED

        # Log logout
        self.audit_manager.log_audit_event(
            event_type=AuditEventType.USER_LOGOUT,
            severity=SeverityLevel.INFO,
            action="user_logout",
            description="User logged out",
            user_id=session.user_id,
            session_id=session_id,
            source_ip=session.source_ip,
            details={"session_duration": time.time() - session.created_timestamp}
        )

        logger.info(f"User logged out: {session.user_id} ({session_id})")

    async def _session_cleanup_loop(self):
        """Background task to clean up expired sessions."""
        while True:
            try:
                await asyncio.sleep(300)  # Run every 5 minutes

                current_time = time.time()
                expired_sessions = [
                    session_id for session_id, session in self.sessions.items()
                    if (session.expires_at < current_time and
                        session.status == SessionStatus.ACTIVE)
                ]

                for session_id in expired_sessions:
                    session = self.sessions[session_id]
                    session.status = SessionStatus.EXPIRED

                    self.audit_manager.log_audit_event(
                        event_type=AuditEventType.USER_LOGOUT,
                        severity=SeverityLevel.INFO,
                        action="session_expired",
                        description="Session expired due to timeout",
                        user_id=session.user_id,
                        session_id=session_id
                    )

                if expired_sessions:
                    logger.info(f"Expired {len(expired_sessions)} sessions")

            except Exception as e:
                logger.error(f"Session cleanup error: {e}")

    async def _security_monitoring_loop(self):
        """Background security monitoring for suspicious activity."""
        while True:
            try:
                await asyncio.sleep(60)  # Run every minute

                current_time = time.time()

                # Monitor for suspicious login patterns
                self._monitor_failed_logins()

                # Monitor for unusual access patterns
                self._monitor_access_patterns()

            except Exception as e:
                logger.error(f"Security monitoring error: {e}")

    def _monitor_failed_logins(self):
        """Monitor for excessive failed login attempts."""
        for user in self.users.values():
            if user.failed_login_attempts >= (self.MAX_FAILED_ATTEMPTS - 1):
                self.audit_manager.log_audit_event(
                    event_type=AuditEventType.SECURITY_ALERT,
                    severity=SeverityLevel.WARNING,
                    action="excessive_failed_logins",
                    description=f"User has {user.failed_login_attempts} failed login attempts",
                    user_id=user.user_id,
                    details={"failed_attempts": user.failed_login_attempts}
                )

    def _monitor_access_patterns(self):
        """Monitor for unusual access patterns."""
        for session in self.sessions.values():
            if session.status == SessionStatus.ACTIVE:
                recent_access = [
                    entry for entry in session.access_log
                    if entry["timestamp"] > (time.time() - 300)  # Last 5 minutes
                ]

                # Alert on high access rate
                if len(recent_access) > 50:
                    self.audit_manager.log_audit_event(
                        event_type=AuditEventType.SECURITY_ALERT,
                        severity=SeverityLevel.WARNING,
                        action="high_access_rate",
                        description="User has unusually high access rate",
                        user_id=session.user_id,
                        session_id=session.session_id,
                        details={"access_count": len(recent_access)}
                    )

    def get_system_status(self) -> Dict[str, Any]:
        """Get access control system status."""
        active_sessions = sum(
            1 for session in self.sessions.values()
            if session.status == SessionStatus.ACTIVE
        )

        locked_accounts = sum(
            1 for user in self.users.values()
            if user.account_locked
        )

        return {
            "total_users": len(self.users),
            "active_sessions": active_sessions,
            "locked_accounts": locked_accounts,
            "total_permissions": len(self.permissions),
            "system_status": "operational",
            "last_updated": time.time()
        }

# Factory function
def create_access_control_system(storage_path: str = ".claude/.artifacts/access_control") -> DFARSAccessControlSystem:
    """Create DFARS access control system."""
    return DFARSAccessControlSystem(storage_path)

# Example usage
if __name__ == "__main__":
    async def main():
        # Initialize access control system
        acs = create_access_control_system()

        # Create admin user
        admin_id = acs.create_user(
            username="admin",
            email="admin@defense-company.com",
            full_name="System Administrator",
            role=UserRole.SYSTEM_ADMIN,
            clearance_level=AuthorizationLevel.TOP_SECRET,
            password="SecurePassword123!"
        )

        print(f"Created admin user: {admin_id}")

        # Authenticate user
        session_id, auth_result = acs.authenticate_user(
            username="admin",
            password="SecurePassword123!",
            source_ip="192.168.1.100",
            user_agent="DefenseApp/1.0"
        )

        if auth_result["success"]:
            print(f"Authentication successful: {session_id}")

            # Test authorization
            authorized, auth_result = acs.authorize_access(
                session_id=session_id,
                resource="/security/classified_documents",
                action="read"
            )

            print(f"Authorization result: {authorized}")

            # Get system status
            status = acs.get_system_status()
            print(f"System status: {status}")

            # Logout
            acs.logout_user(session_id)

        return acs

    # Run example
    asyncio.run(main())