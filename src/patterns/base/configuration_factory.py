"""Configuration Factory Pattern Base Classes.

Provides base classes for implementing configuration management with factory
patterns and validation chains for standardized config handling.
"""

from typing import Dict, Any, Optional, List, TypeVar, Generic
import logging

from abc import ABC, abstractmethod
from dataclasses import dataclass

logger = logging.getLogger(__name__)

T = TypeVar('T')

class ConfigValidator(ABC):
    """Base class for configuration validators."""
    
    @abstractmethod
    def validate(self, config: Dict[str, Any]) -> List[str]:
        """Validate configuration and return list of errors."""
    
    @abstractmethod
    def get_validator_name(self) -> str:
        """Get validator name for logging."""

class ConfigFactory(ABC, Generic[T]):
    """Abstract factory for creating configurations."""
    
    def __init__(self):
        self.validators: List[ConfigValidator] = []
    
    def add_validator(self, validator: ConfigValidator) -> None:
        """Add a validator to the chain."""
        self.validators.append(validator)
    
    def validate_config(self, config: Dict[str, Any]) -> List[str]:
        """Validate configuration using all validators."""
        errors = []
        for validator in self.validators:
            errors.extend(validator.validate(config))
        return errors
    
    @abstractmethod
    def create_config(self, config_data: Dict[str, Any]) -> T:
        """Create configuration object from data."""
    
    def build_with_validation(self, config_data: Dict[str, Any]) -> T:
        """Build configuration with full validation."""
        errors = self.validate_config(config_data)
        if errors:
            raise ValueError(f"Configuration validation failed: {', '.join(errors)}")
        return self.create_config(config_data)

@dataclass
class ConfigurationResult:
    """Result of configuration operation."""
    success: bool
    config: Optional[Any] = None
    errors: List[str] = None
    warnings: List[str] = None
    
    def __post_init__(self):
        if self.errors is None:
            self.errors = []
        if self.warnings is None:
            self.warnings = []

class ConfigurationManager:
    """Central configuration management coordinator."""
    
    def __init__(self):
        self.factories: Dict[str, ConfigFactory] = {}
        self.cached_configs: Dict[str, Any] = {}
    
    def register_factory(self, config_type: str, factory: ConfigFactory) -> None:
        """Register a configuration factory."""
        self.factories[config_type] = factory
        logger.info(f"Registered factory for {config_type}")
    
    def create_configuration(self, config_type: str, 
                            config_data: Dict[str, Any]) -> ConfigurationResult:
        """Create configuration using registered factory."""
        if config_type not in self.factories:
            return ConfigurationResult(
                success=False,
                errors=[f"No factory registered for {config_type}"]
            )
        
        try:
            factory = self.factories[config_type]
            config = factory.build_with_validation(config_data)
            self.cached_configs[config_type] = config
            
            return ConfigurationResult(
                success=True,
                config=config
            )
        except Exception as e:
            return ConfigurationResult(
                success=False,
                errors=[str(e)]
            )
    
    def get_cached_config(self, config_type: str) -> Optional[Any]:
        """Get cached configuration."""
        return self.cached_configs.get(config_type)
