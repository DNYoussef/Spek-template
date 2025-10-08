from typing import Any, Dict, List, Optional, Union, Tuple, Callable, Set

"""
ConfigurationManager - Extracted from UnifiedConnascenceAnalyzer
Handles configuration loading, validation, and monitoring setup
Part of god object decomposition (Day 5)
"""

from pathlib import Path
from typing import Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)

# Import architecture components if available
try:
    from ..architecture.config_manager import AnalysisConfigurationManager
    from ..architecture.cache_manager import AnalysisCacheManager
    ARCHITECTURE_COMPONENTS_AVAILABLE = True
except ImportError:
    ARCHITECTURE_COMPONENTS_AVAILABLE = False

# Import monitoring components if available
try:
    from ..advanced_monitoring import get_global_memory_monitor, get_global_resource_manager
    ADVANCED_MONITORING_AVAILABLE = True
except ImportError:
    ADVANCED_MONITORING_AVAILABLE = False

class ConfigurationManager:
    """
    Manages analysis configuration, validation, and monitoring setup.

    Extracted from UnifiedConnascenceAnalyzer (1, 860 LOC -> ~150 LOC component).
    Handles:
    - Configuration loading and validation
    - Monitoring system initialization
    - Policy preset management
    - Cache manager setup
    """

    def __init__(self, config_path: Optional[str] = None):
        """
        Initialize configuration manager.

        Args:
            config_path: Optional path to configuration file
        """
        # Validate config_path parameter
        if config_path is not None:
            assert isinstance(config_path, str), "config_path must be string when provided"
            assert len(config_path.strip()) > 0, "config_path cannot be empty string"

        self.config_path = config_path
        self.config: Dict[str, Any] = {}

        # Initialize architecture components
        self.config_manager = None
        self.cache_manager = None

        if ARCHITECTURE_COMPONENTS_AVAILABLE:
            self.config_manager = AnalysisConfigurationManager(config_path)
            self.cache_manager = AnalysisCacheManager(100)

            if self.config_manager:
                self.config = self.config_manager.config

        # Initialize monitoring components
        self.memory_monitor = None
        self.resource_manager = None

        if ADVANCED_MONITORING_AVAILABLE:
            self.memory_monitor = get_global_memory_monitor()
            self.resource_manager = get_global_resource_manager()

    def validate_policy_preset(self, policy_preset: str) -> bool:
        """Validate policy preset is valid."""
        valid_presets = ["service-defaults", "strict-core", "experimental", "balanced", "lenient"]
        return policy_preset in valid_presets

    def get_valid_presets(self) -> list:
        """Get list of valid policy presets."""
        return ["service-defaults", "strict-core", "experimental", "balanced", "lenient"]

    def validate_project_path(self, project_path: Path) -> tuple:
        """
        Validate project path exists and is directory.

        Returns:
            (is_valid: bool, error_message: Optional[str])
        """
        if not project_path.exists():
            return False, f"Project path does not exist: {project_path}"

        if not project_path.is_dir():
            return False, f"Project path is not a directory: {project_path}"

        return True, None

    def get_config(self) -> Dict[str, Any]:
        """Get current configuration."""
        return self.config

    def update_config(self, updates: Dict[str, Any]) -> None:
        """Update configuration with new values."""
        self.config.update(updates)

        if self.config_manager:
            for key, value in updates.items():
                setattr(self.config_manager.config, key, value)

    def get_cache_manager(self):
        """Get cache manager instance."""
        return self.cache_manager

    def get_memory_monitor(self):
        """Get memory monitor instance."""
        return self.memory_monitor

    def get_resource_manager(self):
        """Get resource manager instance."""
        return self.resource_manager

    def has_architecture_components(self) -> bool:
        """Check if architecture components are available."""
        return ARCHITECTURE_COMPONENTS_AVAILABLE

    def has_monitoring_components(self) -> bool:
        """Check if monitoring components are available."""
        return ADVANCED_MONITORING_AVAILABLE

    def get_default_metrics(self) -> Dict[str, Any]:
        """Provide default metrics when calculation fails."""
        return {
            "total_violations": 0,
            "critical_count": 0,
            "high_count": 0,
            "medium_count": 0,
            "low_count": 0,
            "connascence_index": 0.0,
            "nasa_compliance_score": 1.0,
            "duplication_score": 1.0,
            "overall_quality_score": 0.8,
        }

    def warm_cache_intelligently(self, project_path: Path) -> None:
        """Warm cache intelligently based on project structure."""
        if self.cache_manager:
            self.cache_manager.warm_cache_intelligently(project_path)
            logger.info(f"Intelligently warmed cache for {project_path}")