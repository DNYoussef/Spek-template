"""
Hardware Authentication Manager for Kill Switch System

Supports YubiKey, TouchID, biometrics, and master key authentication
with fail-safe fallback mechanisms.
"""

import asyncio
import hashlib
import hmac
import logging
import os
import platform
import time
from dataclasses import dataclass
from enum import Enum
from typing import Any, Dict, List, Optional, Set


class AuthMethod(Enum):
    """Supported authentication methods."""
    YUBIKEY = "yubikey"
    TOUCH_ID = "touch_id"
    BIOMETRIC = "biometric"
    MASTER_KEY = "master_key"
    PIN_CODE = "pin_code"
    HARDWARE_TOKEN = "hardware_token"


@dataclass
class AuthResult:
    """Authentication attempt result."""
    success: bool
    method: AuthMethod
    user_id: Optional[str] = None
    timestamp: float = 0.0
    error_message: Optional[str] = None
    challenge_token: Optional[str] = None

    def __post_init__(self):
        if self.timestamp == 0.0:
            self.timestamp = time.time()


class HardwareAuthManager:
    """
    Hardware authentication manager with multi-factor support.

    Provides secure authentication for kill switch operations with
    hardware token integration and fallback mechanisms.
    """

    def __init__(self, config: Dict[str, Any]):
        """
        Initialize hardware authentication manager.

        Args:
            config: Authentication configuration
        """
        self.config = config
        self.logger = logging.getLogger(__name__)

        # Supported methods from config
        self.allowed_methods = set(
            AuthMethod(method) for method in config.get('allowed_methods', ['master_key'])
        )

        # Master keys for fallback
        self.master_keys = config.get('master_keys', {})

        # Authentication state
        self._authenticated_sessions: Set[str] = set()
        self._failed_attempts: Dict[str, int] = {}
        self._lockout_until: Dict[str, float] = {}

        # Hardware detection
        self._hardware_capabilities = self._detect_hardware_capabilities()

        self.logger.info(f"Hardware auth initialized with methods: {[m.value for m in self.allowed_methods]}")
        self.logger.info(f"Hardware capabilities detected: {list(self._hardware_capabilities.keys())}")

    def _detect_hardware_capabilities(self) -> Dict[str, bool]:
        """Detect available hardware authentication capabilities."""
        capabilities = {}

        # Check for YubiKey support
        capabilities['yubikey'] = self._check_yubikey_available()

        # Check for TouchID (macOS)
        capabilities['touch_id'] = self._check_touch_id_available()

        # Check for Windows Hello / biometrics
        capabilities['biometric'] = self._check_biometric_available()

        # Master key is always available
        capabilities['master_key'] = True

        return capabilities

    def _check_yubikey_available(self) -> bool:
        """Check if YubiKey is available."""
        try:
            # Try to import YubiKey libraries
            import ykman.device
            devices = list(ykman.device.list_all_devices())
            return len(devices) > 0
        except ImportError:
            self.logger.debug("YubiKey libraries not available")
            return False
        except Exception as e:
            self.logger.debug(f"YubiKey detection failed: {e}")
            return False

    def _check_touch_id_available(self) -> bool:
        """Check if TouchID is available (macOS only)."""
        if platform.system() != 'Darwin':
            return False

        try:
            # Check for TouchID availability on macOS
            import subprocess
            result = subprocess.run(
                ['bioutil', '-c'],
                capture_output=True,
                text=True,
                timeout=2
            )
            return result.returncode == 0
        except Exception as e:
            self.logger.debug(f"TouchID detection failed: {e}")
            return False

    def _check_biometric_available(self) -> bool:
        """Check if biometric authentication is available."""
        system = platform.system()

        if system == 'Windows':
            try:
                # Check Windows Hello availability
                import winreg
                key = winreg.OpenKey(
                    winreg.HKEY_LOCAL_MACHINE,
                    r"SOFTWARE\Microsoft\Windows\CurrentVersion\WinBio"
                )
                winreg.CloseKey(key)
                return True
            except Exception:
                return False

        elif system == 'Linux':
            # Check for fprintd (Linux fingerprint daemon)
            try:
                import subprocess
                result = subprocess.run(
                    ['which', 'fprintd-verify'],
                    capture_output=True,
                    timeout=2
                )
                return result.returncode == 0
            except Exception:
                return False

        return False

    def get_available_methods(self) -> List[AuthMethod]:
        """Get list of available authentication methods."""
        available = []

        for method in self.allowed_methods:
            method_name = method.value
            if self._hardware_capabilities.get(method_name, False):
                available.append(method)

        # Always include master key as fallback
        if AuthMethod.MASTER_KEY not in available and AuthMethod.MASTER_KEY in self.allowed_methods:
            available.append(AuthMethod.MASTER_KEY)

        return available

    async def authenticate(self, auth_request: Dict[str, Any]) -> AuthResult:
        """
        Perform authentication with specified method.

        Args:
            auth_request: Authentication request containing method and credentials

        Returns:
            AuthResult with authentication outcome
        """
        method_str = auth_request.get('method', 'master_key')
        try:
            method = AuthMethod(method_str)
        except ValueError:
            return AuthResult(
                success=False,
                method=AuthMethod.MASTER_KEY,
                error_message=f"Unsupported authentication method: {method_str}"
            )

        # Check if method is allowed
        if method not in self.allowed_methods:
            return AuthResult(
                success=False,
                method=method,
                error_message=f"Authentication method not allowed: {method.value}"
            )

        # Check for lockout
        user_id = auth_request.get('user_id', 'default')
        if self._is_locked_out(user_id):
            return AuthResult(
                success=False,
                method=method,
                error_message="Account temporarily locked due to failed attempts"
            )

        # Route to appropriate authentication handler
        try:
            if method == AuthMethod.YUBIKEY:
                result = await self._authenticate_yubikey(auth_request)
            elif method == AuthMethod.TOUCH_ID:
                result = await self._authenticate_touch_id(auth_request)
            elif method == AuthMethod.BIOMETRIC:
                result = await self._authenticate_biometric(auth_request)
            elif method == AuthMethod.MASTER_KEY:
                result = await self._authenticate_master_key(auth_request)
            elif method == AuthMethod.PIN_CODE:
                result = await self._authenticate_pin_code(auth_request)
            else:
                result = AuthResult(
                    success=False,
                    method=method,
                    error_message=f"Authentication method not implemented: {method.value}"
                )

            # Handle authentication result
            if result.success:
                self._record_successful_auth(user_id)
            else:
                self._record_failed_auth(user_id)

            return result

        except Exception as e:
            self.logger.error(f"Authentication error for {method.value}: {e}")
            return AuthResult(
                success=False,
                method=method,
                error_message=f"Authentication system error: {str(e)}"
            )

    async def _authenticate_yubikey(self, auth_request: Dict[str, Any]) -> AuthResult:
        """Authenticate using YubiKey."""
        if not self._hardware_capabilities.get('yubikey', False):
            return AuthResult(
                success=False,
                method=AuthMethod.YUBIKEY,
                error_message="YubiKey not available"
            )

        try:
            # Mock YubiKey authentication for now
            # In real implementation, would use ykman or similar
            otp = auth_request.get('otp', '')
            expected_prefix = self.config.get('yubikey_id', 'cccccccccccc')

            if len(otp) == 44 and otp.startswith(expected_prefix):
                return AuthResult(
                    success=True,
                    method=AuthMethod.YUBIKEY,
                    user_id=auth_request.get('user_id', 'yubikey_user')
                )
            else:
                return AuthResult(
                    success=False,
                    method=AuthMethod.YUBIKEY,
                    error_message="Invalid YubiKey OTP"
                )

        except Exception as e:
            return AuthResult(
                success=False,
                method=AuthMethod.YUBIKEY,
                error_message=f"YubiKey authentication failed: {str(e)}"
            )

    async def _authenticate_touch_id(self, auth_request: Dict[str, Any]) -> AuthResult:
        """Authenticate using TouchID."""
        if not self._hardware_capabilities.get('touch_id', False):
            return AuthResult(
                success=False,
                method=AuthMethod.TOUCH_ID,
                error_message="TouchID not available"
            )

        try:
            # Mock TouchID authentication
            # In real implementation, would use macOS LocalAuthentication
            prompt = auth_request.get('prompt', 'Authenticate for kill switch')

            # Simulate TouchID prompt (would be actual biometric in real implementation)
            await asyncio.sleep(0.5)  # Simulate TouchID delay

            # For demonstration, assume success if prompt is provided
            if prompt:
                return AuthResult(
                    success=True,
                    method=AuthMethod.TOUCH_ID,
                    user_id=auth_request.get('user_id', 'touchid_user')
                )
            else:
                return AuthResult(
                    success=False,
                    method=AuthMethod.TOUCH_ID,
                    error_message="TouchID authentication cancelled"
                )

        except Exception as e:
            return AuthResult(
                success=False,
                method=AuthMethod.TOUCH_ID,
                error_message=f"TouchID authentication failed: {str(e)}"
            )

    async def _authenticate_biometric(self, auth_request: Dict[str, Any]) -> AuthResult:
        """Authenticate using biometric methods."""
        if not self._hardware_capabilities.get('biometric', False):
            return AuthResult(
                success=False,
                method=AuthMethod.BIOMETRIC,
                error_message="Biometric authentication not available"
            )

        try:
            # Mock biometric authentication
            # Real implementation would use platform-specific APIs
            biometric_type = auth_request.get('biometric_type', 'fingerprint')

            await asyncio.sleep(1.0)  # Simulate biometric scan time

            # For demonstration, assume success
            return AuthResult(
                success=True,
                method=AuthMethod.BIOMETRIC,
                user_id=auth_request.get('user_id', 'biometric_user')
            )

        except Exception as e:
            return AuthResult(
                success=False,
                method=AuthMethod.BIOMETRIC,
                error_message=f"Biometric authentication failed: {str(e)}"
            )

    async def _authenticate_master_key(self, auth_request: Dict[str, Any]) -> AuthResult:
        """Authenticate using master key."""
        try:
            provided_key = auth_request.get('key', '')
            key_id = auth_request.get('key_id', 'default')

            expected_key = self.master_keys.get(key_id, '')

            if not expected_key:
                return AuthResult(
                    success=False,
                    method=AuthMethod.MASTER_KEY,
                    error_message=f"Master key '{key_id}' not configured"
                )

            # Secure key comparison using HMAC to prevent timing attacks
            if self._secure_compare(provided_key, expected_key):
                return AuthResult(
                    success=True,
                    method=AuthMethod.MASTER_KEY,
                    user_id=auth_request.get('user_id', f'master_key_{key_id}')
                )
            else:
                return AuthResult(
                    success=False,
                    method=AuthMethod.MASTER_KEY,
                    error_message="Invalid master key"
                )

        except Exception as e:
            return AuthResult(
                success=False,
                method=AuthMethod.MASTER_KEY,
                error_message=f"Master key authentication failed: {str(e)}"
            )

    async def _authenticate_pin_code(self, auth_request: Dict[str, Any]) -> AuthResult:
        """Authenticate using PIN code."""
        try:
            provided_pin = auth_request.get('pin', '')
            expected_pin = self.config.get('pin_code', '')

            if not expected_pin:
                return AuthResult(
                    success=False,
                    method=AuthMethod.PIN_CODE,
                    error_message="PIN code not configured"
                )

            if self._secure_compare(provided_pin, expected_pin):
                return AuthResult(
                    success=True,
                    method=AuthMethod.PIN_CODE,
                    user_id=auth_request.get('user_id', 'pin_user')
                )
            else:
                return AuthResult(
                    success=False,
                    method=AuthMethod.PIN_CODE,
                    error_message="Invalid PIN code"
                )

        except Exception as e:
            return AuthResult(
                success=False,
                method=AuthMethod.PIN_CODE,
                error_message=f"PIN authentication failed: {str(e)}"
            )

    def _secure_compare(self, provided: str, expected: str) -> bool:
        """Secure string comparison to prevent timing attacks."""
        try:
            # Use HMAC for constant-time comparison
            key = os.urandom(32)
            provided_hash = hmac.new(key, provided.encode(), hashlib.sha256).digest()
            expected_hash = hmac.new(key, expected.encode(), hashlib.sha256).digest()
            return hmac.compare_digest(provided_hash, expected_hash)
        except Exception:
            return False

    def _is_locked_out(self, user_id: str) -> bool:
        """Check if user is locked out due to failed attempts."""
        if user_id not in self._lockout_until:
            return False

        return time.time() < self._lockout_until[user_id]

    def _record_successful_auth(self, user_id: str):
        """Record successful authentication."""
        # Clear failed attempts on success
        if user_id in self._failed_attempts:
            del self._failed_attempts[user_id]
        if user_id in self._lockout_until:
            del self._lockout_until[user_id]

        # Add to authenticated sessions
        self._authenticated_sessions.add(user_id)

    def _record_failed_auth(self, user_id: str):
        """Record failed authentication attempt."""
        self._failed_attempts[user_id] = self._failed_attempts.get(user_id, 0) + 1

        # Lock out after 3 failed attempts
        max_attempts = self.config.get('max_auth_attempts', 3)
        lockout_duration = self.config.get('lockout_duration', 300)  # 5 minutes

        if self._failed_attempts[user_id] >= max_attempts:
            self._lockout_until[user_id] = time.time() + lockout_duration
            self.logger.warning(f"User {user_id} locked out for {lockout_duration} seconds")

    def is_authenticated(self, user_id: str) -> bool:
        """Check if user is currently authenticated."""
        return user_id in self._authenticated_sessions

    def logout(self, user_id: str) -> bool:
        """Log out user session."""
        if user_id in self._authenticated_sessions:
            self._authenticated_sessions.remove(user_id)
            return True
        return False

    def get_system_status(self) -> Dict[str, Any]:
        """Get authentication system status."""
        return {
            'available_methods': [m.value for m in self.get_available_methods()],
            'hardware_capabilities': self._hardware_capabilities,
            'active_sessions': len(self._authenticated_sessions),
            'locked_accounts': len(self._lockout_until),
            'system_platform': platform.system()
        }


# Convenience functions
def create_hardware_auth_manager(config: Dict[str, Any]) -> HardwareAuthManager:
    """Factory function to create hardware auth manager."""
    return HardwareAuthManager(config)


def validate_auth_config(config: Dict[str, Any]) -> bool:
    """Validate authentication configuration."""
    required_fields = ['allowed_methods']

    for field in required_fields:
        if field not in config:
            return False

    # Validate that at least one method is configured
    allowed_methods = config.get('allowed_methods', [])
    if not allowed_methods:
        return False

    # If master key is allowed, ensure keys are configured
    if 'master_key' in allowed_methods and not config.get('master_keys'):
        return False

    return True