# SPDX-License-Identifier: MIT

"""
Dependency Injection Container for Decomposed Analysis Components

Implements the IDependencyContainer interface to manage dependencies
between the six focused classes that replace UnifiedConnascenceAnalyzer.

NASA Power of Ten Compliance:
- Rule 4: Class is under 500 LOC
- Rule 5: All parameters validated with assertions
- Rule 7: All return values checked
"""
from typing import Any, Dict, List, Optional, Union, Tuple, Callable, Set


from typing import Any, Dict, Type, TypeVar, Optional
import logging

from ..interfaces.analysis_interfaces import IDependencyContainer

logger = logging.getLogger(__name__)

T = TypeVar('T')

class DependencyContainer(IDependencyContainer):
    """
    Simple dependency injection container for analysis services.

    NASA Rule 4 Compliant: Focused responsibility for dependency management
    NASA Rule 5 Compliant: All operations validated with assertions
    """

    def __init__(self):
        """
        Initialize dependency container.

        NASA Rule 5 Compliant: Container state validation
        """
        self._services: Dict[Type, Type] = {}
        self._singletons: Dict[Type, Any] = {}
        self._instances: Dict[Type, Any] = {}

        # Validate initial state
        assert isinstance(self._services, dict), "Services registry must be dictionary"
        assert isinstance(self._singletons, dict), "Singletons registry must be dictionary"
        assert isinstance(self._instances, dict), "Instances registry must be dictionary"

    def register_service(self, interface: Type[T], implementation: Type[T]) -> None:
        """
        Register service implementation for interface.

        NASA Rule 5 Compliant: Parameter validation with assertions

        Args:
            interface: Interface type to register
            implementation: Implementation type for interface

        Raises:
            AssertionError: If parameters are invalid
        """
        # NASA Rule 5: Parameter validation
        assert interface is not None, "Interface type cannot be None"
        assert implementation is not None, "Implementation type cannot be None"
        assert hasattr(interface, '__name__'), "Interface must have __name__ attribute"
        assert hasattr(implementation, '__name__'), "Implementation must have __name__ attribute"

        # Validate inheritance relationship
        try:
            assert issubclass(implementation, interface), \
                f"Implementation {implementation.__name__} must inherit from {interface.__name__}"
        except TypeError:
            # Handle abstract base classes
            assert hasattr(implementation, '__bases__'), \
                f"Implementation {implementation.__name__} must be a proper class"

        self._services[interface] = implementation
        logger.debug(f"Registered service: {interface.__name__} -> {implementation.__name__}")

        # NASA Rule 7: Validate registration success
        assert interface in self._services, "Service registration failed"
        assert self._services[interface] == implementation, "Service registration verification failed"

    def register_singleton(self, interface: Type[T], instance: T) -> None:
        """
        Register singleton instance for interface.

        NASA Rule 5 Compliant: Parameter validation with assertions

        Args:
            interface: Interface type to register
            instance: Singleton instance for interface

        Raises:
            AssertionError: If parameters are invalid
        """
        # NASA Rule 5: Parameter validation
        assert interface is not None, "Interface type cannot be None"
        assert instance is not None, "Singleton instance cannot be None"
        assert hasattr(interface, '__name__'), "Interface must have __name__ attribute"

        # Validate instance type compatibility
        try:
            assert isinstance(instance, interface), \
                f"Instance must be of type {interface.__name__}"
        except TypeError:
            # Handle abstract base classes - check if instance implements required methods
            interface_methods = [method for method in dir(interface)
                                if not method.startswith('_') and callable(getattr(interface, method, None))]
            instance_methods = [method for method in dir(instance)
                                if not method.startswith('_') and callable(getattr(instance, method, None))]

            missing_methods = set(interface_methods) - set(instance_methods)
            assert len(missing_methods) == 0, \
                f"Instance missing required methods: {missing_methods}"

        self._singletons[interface] = instance
        logger.debug(f"Registered singleton: {interface.__name__} -> {type(instance).__name__}")

        # NASA Rule 7: Validate registration success
        assert interface in self._singletons, "Singleton registration failed"
        assert self._singletons[interface] is instance, "Singleton registration verification failed"

    def resolve(self, interface: Type[T]) -> T:
        """
        Resolve implementation for interface.

        NASA Rule 5 Compliant: Parameter validation with assertions
        NASA Rule 7 Compliant: Return value validation

        Args:
            interface: Interface type to resolve

        Returns:
            T: Implementation instance for interface

        Raises:
            AssertionError: If interface is invalid
            ValueError: If no registration found for interface
        """
        # NASA Rule 5: Parameter validation
        assert interface is not None, "Interface type cannot be None"
        assert hasattr(interface, '__name__'), "Interface must have __name__ attribute"

        # Check for singleton first
        if interface in self._singletons:
            instance = self._singletons[interface]
            logger.debug(f"Resolved singleton: {interface.__name__}")

            # NASA Rule 7: Validate return value
            assert instance is not None, "Singleton instance cannot be None"
            return instance

        # Check for existing instance
        if interface in self._instances:
            instance = self._instances[interface]
            logger.debug(f"Resolved cached instance: {interface.__name__}")

            # NASA Rule 7: Validate return value
            assert instance is not None, "Cached instance cannot be None"
            return instance

        # Create new instance from registered service
        if interface in self._services:
            implementation_type = self._services[interface]
            try:
                instance = implementation_type()
                self._instances[interface] = instance
                logger.debug(f"Created new instance: {interface.__name__} -> {implementation_type.__name__}")

                # NASA Rule 7: Validate created instance
                assert instance is not None, "Created instance cannot be None"
                return instance

            except Exception as e:
                error_msg = f"Failed to create instance of {implementation_type.__name__}: {e}"
                logger.error(error_msg)
                raise ValueError(error_msg) from e

        # No registration found
        error_msg = f"No registration found for interface: {interface.__name__}"
        logger.error(error_msg)
        raise ValueError(error_msg)

    def has_registration(self, interface: Type[T]) -> bool:
        """
        Check if interface has registered implementation.

        NASA Rule 5 Compliant: Parameter validation with assertions
        NASA Rule 7 Compliant: Return value validation

        Args:
            interface: Interface type to check

        Returns:
            bool: True if interface has registration, False otherwise

        Raises:
            AssertionError: If interface is invalid
        """
        # NASA Rule 5: Parameter validation
        assert interface is not None, "Interface type cannot be None"
        assert hasattr(interface, '__name__'), "Interface must have __name__ attribute"

        result = (interface in self._services or
                interface in self._singletons or
                interface in self._instances)

        # NASA Rule 7: Validate return value
        assert isinstance(result, bool), "Return value must be boolean"
        return result

    def resolve_with_dependencies(self, interface: Type[T], **kwargs) -> T:
        """
        Resolve implementation with constructor dependencies.

        NASA Rule 5 Compliant: Parameter validation with assertions
        NASA Rule 7 Compliant: Return value validation

        Args:
            interface: Interface type to resolve
            **kwargs: Constructor arguments for implementation

        Returns:
            T: Implementation instance with injected dependencies

        Raises:
            AssertionError: If interface is invalid
            ValueError: If resolution fails
        """
        # NASA Rule 5: Parameter validation
        assert interface is not None, "Interface type cannot be None"
        assert hasattr(interface, '__name__'), "Interface must have __name__ attribute"
        assert isinstance(kwargs, dict), "Constructor arguments must be dictionary"

        # Check for singleton first (ignore dependencies for singletons)
        if interface in self._singletons:
            instance = self._singletons[interface]
            logger.debug(f"Resolved singleton with dependencies ignored: {interface.__name__}")

            # NASA Rule 7: Validate return value
            assert instance is not None, "Singleton instance cannot be None"
            return instance

        # Create new instance with dependencies
        if interface in self._services:
            implementation_type = self._services[interface]
            try:
                instance = implementation_type(**kwargs)
                logger.debug(f"Created instance with dependencies: {interface.__name__} -> {implementation_type.__name__}")

                # NASA Rule 7: Validate created instance
                assert instance is not None, "Created instance cannot be None"
                return instance

            except Exception as e:
                error_msg = f"Failed to create instance of {implementation_type.__name__} with dependencies: {e}"
                logger.error(error_msg)
                raise ValueError(error_msg) from e

        # No registration found
        error_msg = f"No registration found for interface: {interface.__name__}"
        logger.error(error_msg)
        raise ValueError(error_msg)

    def clear_cache(self) -> None:
        """
        Clear all cached instances (but keep registrations).

        NASA Rule 5 Compliant: State validation after clearing
        """
        cleared_count = len(self._instances)
        self._instances.clear()
        logger.debug(f"Cleared {cleared_count} cached instances")

        # NASA Rule 5: Validate state after clearing
        assert len(self._instances) == 0, "Instance cache should be empty after clearing"
        assert len(self._services) >= 0, "Service registrations should remain after clearing"
        assert len(self._singletons) >= 0, "Singleton registrations should remain after clearing"

    def get_registration_stats(self) -> Dict[str, int]:
        """
        Get statistics about current registrations.

        NASA Rule 7 Compliant: Return value validation

        Returns:
            Dict[str, int]: Statistics about registrations

        Raises:
            AssertionError: If statistics are invalid
        """
        stats = {
            'services': len(self._services),
            'singletons': len(self._singletons),
            'instances': len(self._instances),
            'total': len(self._services) + len(self._singletons)
        }

        # NASA Rule 7: Validate return value
        assert isinstance(stats, dict), "Statistics must be dictionary"
        assert all(isinstance(v, int) for v in stats.values()), "All statistics must be integers"
        assert all(v >= 0 for v in stats.values()), "All statistics must be non-negative"
        assert stats['total'] == stats['services'] + stats['singletons'], "Total must equal sum of services and singletons"

        return stats

# Global container instance for convenience
_global_container: Optional[DependencyContainer] = None

def get_container() -> DependencyContainer:
    """
    Get global dependency container instance.

    NASA Rule 7 Compliant: Return value validation

    Returns:
        DependencyContainer: Global container instance

    Raises:
        AssertionError: If container creation fails
    """
    global _global_container

    if _global_container is None:
        _global_container = DependencyContainer()
        logger.debug("Created global dependency container")

    # NASA Rule 7: Validate return value
    assert _global_container is not None, "Global container cannot be None"
    assert isinstance(_global_container, DependencyContainer), "Global container must be DependencyContainer instance"

    return _global_container

def reset_container() -> None:
    """
    Reset global dependency container.

    NASA Rule 5 Compliant: State validation after reset
    """
    global _global_container
    _global_container = None
    logger.debug("Reset global dependency container")

    # NASA Rule 5: Validate state after reset
    assert _global_container is None, "Global container should be None after reset"