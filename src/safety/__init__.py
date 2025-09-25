"""
Comprehensive safety, failover, and recovery system ensuring 99.9% availability
with <60 second recovery times and proven redundancy validation.

Components:
- SafetyManager: Central safety orchestration
- FailoverManager: Automated failover with validation
- RecoverySystem: <60s recovery time guarantee
- AvailabilityMonitor: 99.9% SLA monitoring
- RedundancyValidator: Multi-level redundancy verification
"""

from src.constants.base import NASA_POT10_TARGET_COMPLIANCE_THRESHOLD

# Import core components with error handling
try:
    from .core.safety_manager import SafetyManager
except ImportError as e:
    print(f"Warning: Could not import SafetyManager: {e}")
    SafetyManager = None

try:
    from .core.failover_manager import FailoverManager
except ImportError as e:
    print(f"Warning: Could not import FailoverManager: {e}")
    FailoverManager = None

try:
    from .recovery.recovery_system import RecoverySystem
except ImportError as e:
    print(f"Warning: Could not import RecoverySystem: {e}")
    RecoverySystem = None

try:
    from .monitoring.availability_monitor import AvailabilityMonitor
except ImportError as e:
    print(f"Warning: Could not import AvailabilityMonitor: {e}")
    AvailabilityMonitor = None

try:
    from .monitoring.redundancy_validator import RedundancyValidator
except ImportError as e:
    print(f"Warning: Could not import RedundancyValidator: {e}")
    RedundancyValidator = None

# Version and metadata
__version__ = "1.0.0"
__author__ = "SPEK Safety Architecture Team"

# Export main classes (only if successfully imported)
__all__ = []
if SafetyManager:
    __all__.append('SafetyManager')
if FailoverManager:
    __all__.append('FailoverManager')
if RecoverySystem:
    __all__.append('RecoverySystem')
if AvailabilityMonitor:
    __all__.append('AvailabilityMonitor')
if RedundancyValidator:
    __all__.append('RedundancyValidator')

# Add factory function to exports
__all__.append('create_safety_system')

# Default safety configuration
DEFAULT_CONFIG = {
    'availability_target': 0.999,  # 99.9% uptime
    'max_recovery_time_seconds': 60,  # <60s recovery
    'redundancy_levels': 3,  # Triple redundancy
    'health_check_interval_seconds': 5,
    'failover_trigger_threshold': NASA_POT10_TARGET_COMPLIANCE_THRESHOLD,
    'monitoring_enabled': True
}

def create_safety_system(config=None):
    """
    Factory function to create a complete safety system.

    Args:
        config (dict, optional): Safety system configuration

    Returns:
        SafetyManager: Configured safety system instance
    """
    if SafetyManager is None:
        raise ImportError("SafetyManager could not be imported. Check import dependencies.")

    if config is None:
        config = DEFAULT_CONFIG.copy()

    return SafetyManager(config)

# Legacy imports for backward compatibility
try:
    from .kill_switch_system import KillSwitchSystem, TriggerType, KillSwitchEvent
    from .hardware_auth_manager import HardwareAuthManager, AuthMethod, AuthResult

    # Add legacy exports
    __all__.extend([
        'KillSwitchSystem',
        'TriggerType',
        'KillSwitchEvent',
        'HardwareAuthManager',
        'AuthMethod',
        'AuthResult'
    ])

except ImportError:
    # Legacy components not available
    pass