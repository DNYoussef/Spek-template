# SPDX-License-Identifier: MIT
"""
Base Factory Pattern Implementation
===================================

Core factory pattern classes providing standardized object creation
across the system. Supports different factory types for various use cases.

Used by:
- Report generation (Batch 6)
- Security analysis (Batch 8)
- Enterprise integration (Batch 9)
"""

from typing import Any, Dict, List, Optional, Type, TypeVar, Generic, Callable
import logging

from abc import ABC, abstractmethod
from dataclasses import dataclass
from enum import Enum

logger = logging.getLogger(__name__)

T = TypeVar('T')

class FactoryError(Exception):
    """Base exception for factory-related errors."""

class ProductNotFoundError(FactoryError):
    """Raised when factory cannot create requested product."""

class FactoryConfigurationError(FactoryError):
    """Raised when factory is not properly configured."""

@dataclass
class ProductSpec:
    """Specification for factory product creation."""
    product_type: str
    parameters: Dict[str, Any]
    metadata: Dict[str, Any]

class Factory(ABC, Generic[T]):
    """
    Abstract base factory following Factory Method pattern.

    Provides common interface for all factories with product registration,
    validation, and lifecycle management.
    """

    def __init__(self, factory_name: str):
        self.factory_name = factory_name
        self.products: Dict[str, Type[T]] = {}
        self.product_configs: Dict[str, Dict[str, Any]] = {}
        self.creation_hooks: Dict[str, List[Callable[[T], None]]] = {}

    def register_product(self, product_type: str, product_class: Type[T],
                        config: Optional[Dict[str, Any]] = None):
        """Register a product type with this factory."""
        if not issubclass(product_class, self._get_base_product_type()):
            raise FactoryConfigurationError(
                f"Product class {product_class.__name__} does not inherit from base type"
            )

        self.products[product_type] = product_class
        self.product_configs[product_type] = config or {}

        logger.debug(f"Registered product '{product_type}' in factory '{self.factory_name}'")

    def unregister_product(self, product_type: str):
        """Unregister a product type from this factory."""
        self.products.pop(product_type, None)
        self.product_configs.pop(product_type, None)
        self.creation_hooks.pop(product_type, None)

        logger.debug(f"Unregistered product '{product_type}' from factory '{self.factory_name}'")

    def get_available_products(self) -> List[str]:
        """Get list of available product types."""
        return list(self.products.keys())

    def is_product_available(self, product_type: str) -> bool:
        """Check if product type is available."""
        return product_type in self.products

    def create_product(self, product_type: str, **kwargs) -> T:
        """
        Create product of specified type.

        Args:
            product_type: Type of product to create
            **kwargs: Parameters for product creation

        Returns:
            Created product instance

        Raises:
            ProductNotFoundError: If product type not registered
        """
        if product_type not in self.products:
            available = ', '.join(self.get_available_products())
            raise ProductNotFoundError(
                f"Product type '{product_type}' not found in factory '{self.factory_name}'. "
                f"Available types: {available}"
            )

        try:
            # Get product class and configuration
            product_class = self.products[product_type]
            default_config = self.product_configs[product_type].copy()

            # Merge configurations
            creation_params = {**default_config, **kwargs}

            # Validate parameters
            validation_result = self._validate_creation_parameters(product_type, creation_params)
            if not validation_result:
                raise FactoryConfigurationError(
                    f"Invalid parameters for product '{product_type}'"
                )

            # Create product
            product = self._create_product_instance(product_class, creation_params)

            # Apply post-creation hooks
            self._apply_creation_hooks(product_type, product)

            logger.info(f"Created product '{product_type}' from factory '{self.factory_name}'")
            return product

        except Exception as e:
            logger.error(f"Failed to create product '{product_type}': {e}")
            raise

    def add_creation_hook(self, product_type: str, hook: Callable[[T], None]):
        """Add post-creation hook for product type."""
        if product_type not in self.creation_hooks:
            self.creation_hooks[product_type] = []

        self.creation_hooks[product_type].append(hook)

    @abstractmethod
    def _get_base_product_type(self) -> Type:
        """Get base type that all products must inherit from."""

    def _create_product_instance(self, product_class: Type[T], params: Dict[str, Any]) -> T:
        """Create product instance. Override for custom creation logic."""
        try:
            return product_class(**params)
        except TypeError as e:
            # Try without parameters if constructor doesn't accept them
            try:
                instance = product_class()
                # Set attributes if instance supports it
                for key, value in params.items():
                    if hasattr(instance, key):
                        setattr(instance, key, value)
                return instance
            except Exception:
                raise FactoryConfigurationError(
                    f"Cannot create instance of {product_class.__name__}: {e}"
                )

    def _validate_creation_parameters(self, product_type: str, params: Dict[str, Any]) -> bool:
        """Validate creation parameters. Override for custom validation."""
        return True

    def _apply_creation_hooks(self, product_type: str, product: T):
        """Apply post-creation hooks."""
        hooks = self.creation_hooks.get(product_type, [])
        for hook in hooks:
            try:
                hook(product)
            except Exception as e:
                logger.warning(f"Creation hook failed for {product_type}: {e}")

class AbstractFactory(ABC):
    """
    Abstract Factory pattern implementation for creating families of related objects.

    Provides interface for creating multiple related products without specifying
    their concrete classes.
    """

    def __init__(self, factory_family: str):
        self.factory_family = factory_family

    @abstractmethod
    def get_supported_families(self) -> List[str]:
        """Get list of supported product families."""

    @abstractmethod
    def create_factory_for_family(self, family: str) -> Factory:
        """Create concrete factory for specified family."""

    def create_product(self, family: str, product_type: str, **kwargs) -> Any:
        """Create product using appropriate family factory."""
        if family not in self.get_supported_families():
            raise ProductNotFoundError(
                f"Family '{family}' not supported. Available: {self.get_supported_families()}"
            )

        factory = self.create_factory_for_family(family)
        return factory.create_product(product_type, **kwargs)

class SingletonFactory(Factory[T]):
    """
    Factory that ensures only one instance of each product type exists.

    Useful for expensive-to-create objects that should be reused.
    """

    def __init__(self, factory_name: str):
        super().__init__(factory_name)
        self.instances: Dict[str, T] = {}

    def create_product(self, product_type: str, **kwargs) -> T:
        """Create or return existing singleton instance."""
        instance_key = self._get_instance_key(product_type, kwargs)

        if instance_key not in self.instances:
            self.instances[instance_key] = super().create_product(product_type, **kwargs)
            logger.debug(f"Created singleton instance: {instance_key}")
        else:
            logger.debug(f"Returning existing singleton instance: {instance_key}")

        return self.instances[instance_key]

    def clear_instances(self):
        """Clear all singleton instances."""
        count = len(self.instances)
        self.instances.clear()
        logger.info(f"Cleared {count} singleton instances from factory '{self.factory_name}'")

    def _get_instance_key(self, product_type: str, params: Dict[str, Any]) -> str:
        """Generate key for instance caching."""
        # Simple key generation - override for more sophisticated caching
        param_str = '_'.join(f"{k}={v}" for k, v in sorted(params.items()))
        return f"{product_type}_{param_str}"

class ConfigurableFactory(Factory[T]):
    """
    Factory that supports configuration-driven product creation.

    Allows product creation based on configuration files or dictionaries,
    making it easy to change product behavior without code changes.
    """

    def __init__(self, factory_name: str, config: Dict[str, Any]):
        super().__init__(factory_name)
        self.config = config
        self._load_products_from_config()

    def _load_products_from_config(self):
        """Load product registrations from configuration."""
        products_config = self.config.get('products', {})

        for product_type, product_config in products_config.items():
            class_path = product_config.get('class')
            if class_path:
                try:
                    product_class = self._import_class(class_path)
                    default_params = product_config.get('default_params', {})
                    self.register_product(product_type, product_class, default_params)
                except Exception as e:
                    logger.error(f"Failed to load product '{product_type}': {e}")

    def _import_class(self, class_path: str) -> Type:
        """Import class from module path."""
        module_path, class_name = class_path.rsplit('.', 1)
        module = __import__(module_path, fromlist=[class_name])
        return getattr(module, class_name)

    def update_config(self, new_config: Dict[str, Any]):
        """Update factory configuration and reload products."""
        self.config.update(new_config)
        self.products.clear()
        self.product_configs.clear()
        self._load_products_from_config()

class FactoryRegistry:
    """
    Registry for managing multiple factories.

    Provides centralized access to all factories in the system and
    supports factory discovery and lifecycle management.
    """

    def __init__(self):
        self.factories: Dict[str, Factory] = {}
        self.default_factory_type: Optional[str] = None

    def register_factory(self, factory_name: str, factory: Factory,
                        is_default: bool = False):
        """Register a factory in the registry."""
        self.factories[factory_name] = factory

        if is_default or self.default_factory_type is None:
            self.default_factory_type = factory_name

        logger.info(f"Registered factory '{factory_name}'")

    def get_factory(self, factory_name: Optional[str] = None) -> Factory:
        """Get factory by name or return default factory."""
        if factory_name is None:
            factory_name = self.default_factory_type

        if factory_name is None:
            raise FactoryConfigurationError("No factories registered")

        if factory_name not in self.factories:
            available = ', '.join(self.factories.keys())
            raise FactoryConfigurationError(
                f"Factory '{factory_name}' not found. Available: {available}"
            )

        return self.factories[factory_name]

    def get_available_factories(self) -> List[str]:
        """Get list of available factory names."""
        return list(self.factories.keys())

    def create_product(self, product_type: str, factory_name: Optional[str] = None,
                        **kwargs) -> Any:
        """Create product using specified or default factory."""
        factory = self.get_factory(factory_name)
        return factory.create_product(product_type, **kwargs)

    def clear_registry(self):
        """Clear all registered factories."""
        count = len(self.factories)
        self.factories.clear()
        self.default_factory_type = None
        logger.info(f"Cleared {count} factories from registry")

# Global factory registry
_global_registry: Optional[FactoryRegistry] = None

def get_factory_registry() -> FactoryRegistry:
    """Get global factory registry."""
    global _global_registry
    if _global_registry is None:
        _global_registry = FactoryRegistry()
    return _global_registry

# Example implementations for testing
class ExampleProduct:
    """Example product for testing factory patterns."""

    def __init__(self, name: str = "default", value: int = 0):
        self.name = name
        self.value = value

    def __str__(self):
        return f"ExampleProduct(name='{self.name}', value={self.value})"

class ExampleFactory(Factory[ExampleProduct]):
    """Example factory for testing."""

    def _get_base_product_type(self) -> Type:
        return ExampleProduct

if __name__ == "__main__":
    # Demonstrate factory pattern usage
    factory = ExampleFactory("example_factory")

    # Register product types
    factory.register_product("basic", ExampleProduct, {"name": "basic_product"})

    # Create products
    product1 = factory.create_product("basic", value=42)
    product2 = factory.create_product("basic", name="custom", value=100)

    print(f"Product 1: {product1}")
    print(f"Product 2: {product2}")

    # Test singleton factory
    singleton_factory = SingletonFactory[ExampleProduct]("singleton_example")
    singleton_factory.register_product("singleton", ExampleProduct)

    instance1 = singleton_factory.create_product("singleton", name="test")
    instance2 = singleton_factory.create_product("singleton", name="test")

    # Test factory registry
    registry = get_factory_registry()
    registry.register_factory("example", factory)

    product_from_registry = registry.create_product("basic", "example", value=200)
    print(f"Product from registry: {product_from_registry}")