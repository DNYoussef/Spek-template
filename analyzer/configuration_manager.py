# SPDX-License-Identifier: MIT
# SPDX-FileCopyrightText: 2024 Connascence Safety Analyzer Contributors

"""
Analysis Configuration Manager - Extracted from UnifiedConnascenceAnalyzer
=========================================================================

Manages configuration loading, component initialization, and policy management.
NASA Rule 2 Compliant: All methods under 60 lines.
NASA Rule 4 Compliant: Single responsibility pattern.
"""

import logging
from pathlib import Path
from typing import Any, Dict, Optional

logger = logging.getLogger(__name__)


class AnalysisConfigurationManager:
    """
    Manages configuration and component initialization for analysis.
    
    Single Responsibility: Configuration and initialization management.
    NASA Rule 4 Compliant: Focused, bounded operations.
    """
    
    def __init__(self, config_path: Optional[str] = None):
        """Initialize configuration manager (NASA Rule 2: ≤60 LOC)."""
        self.config_path = config_path
        self.config = self._load_config(config_path)
        self._component_registry = {}
        
    def _load_config(self, config_path: Optional[str]) -> Dict[str, Any]:
        """Load configuration from file or use defaults (NASA Rule 2: ≤60 LOC)."""
        default_config = {
            "analysis_timeout": 300,
            "max_memory_mb": 100,
            "cache_enabled": True,
            "parallel_analysis": True,
            "nasa_compliance_threshold": 0.95,
            "mece_quality_threshold": 0.80
        }
        
        if not config_path:
            logger.info("Using default configuration")
            return default_config
            
        try:
            config_file = Path(config_path)
            if config_file.exists():
                import json
                with open(config_file, 'r') as f:
                    loaded_config = json.load(f)
                # Merge with defaults
                default_config.update(loaded_config)
                logger.info(f"Configuration loaded from {config_path}")
            else:
                logger.warning(f"Config file not found: {config_path}, using defaults")
        except Exception as e:
            logger.error(f"Failed to load config from {config_path}: {e}")
            
        return default_config
    
    def get_config_value(self, key: str, default: Any = None) -> Any:
        """Get configuration value (NASA Rule 2: ≤60 LOC)."""
        return self.config.get(key, default)
    
    def register_component(self, name: str, component: Any) -> None:
        """Register a component in the registry (NASA Rule 2: ≤60 LOC)."""
        assert name is not None, "Component name cannot be None"
        assert component is not None, "Component cannot be None"
        
        self._component_registry[name] = component
        logger.debug(f"Registered component: {name}")
    
    def get_component(self, name: str) -> Optional[Any]:
        """Get registered component (NASA Rule 2: ≤60 LOC)."""
        return self._component_registry.get(name)
    
    def get_all_components(self) -> Dict[str, Any]:
        """Get all registered components (NASA Rule 2: ≤60 LOC)."""
        return self._component_registry.copy()
    
    def validate_configuration(self) -> Dict[str, Any]:
        """Validate current configuration (NASA Rule 2: ≤60 LOC)."""
        validation_result = {
            "valid": True,
            "warnings": [],
            "errors": []
        }
        
        # Check required values
        timeout = self.config.get("analysis_timeout", 0)
        if timeout <= 0:
            validation_result["errors"].append("analysis_timeout must be > 0")
            validation_result["valid"] = False
            
        memory_limit = self.config.get("max_memory_mb", 0)
        if memory_limit <= 0:
            validation_result["warnings"].append("max_memory_mb should be > 0")
        
        return validation_result