from typing import Any, Dict, List, Optional, Union, Tuple, Callable, Set

"""
ComponentFactory - Extracted from UnifiedAnalyzer
Handles component initialization and dependency injection
Part of god object decomposition (Day 3)
"""

from pathlib import Path
from typing import Dict, Any, Optional, Type, TypeVar
import logging

from importlib import import_module

logger = logging.getLogger(__name__)

T = TypeVar('T')

class ComponentRegistry:
    """Registry for analyzer components."""

    def __init__(self):
        self.components: Dict[str, Any] = {}
        self.component_types: Dict[str, Type] = {}
        self.dependencies: Dict[str, List[str]] = {}

    def register(self,
                name: str,
                component_type: Type,
                dependencies: Optional[List[str]] = None) -> None:
        """Register a component type."""
        self.component_types[name] = component_type
        self.dependencies[name] = dependencies or []

    def get(self, name: str) -> Optional[Any]:
        """Get a component instance."""
        return self.components.get(name)

    def create(self, name: str, **kwargs) -> Any:
        """Create a new component instance."""
        if name not in self.component_types:
            raise ValueError(f"Unknown component type: {name}")

        component_type = self.component_types[name]
        instance = component_type(**kwargs)
        self.components[name] = instance
        return instance

class ComponentFactory:
    """
    Factory for creating and managing analyzer components.

    Extracted from UnifiedAnalyzer god object (1, 634 LOC -> ~250 LOC component).
    Handles:
    - Component initialization
    - Dependency injection
    - Lazy loading
    - Component lifecycle management
    """

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """Initialize the component factory."""
        self.config = config or {}
        self.registry = ComponentRegistry()
        self._initialized_components: Dict[str, Any] = {}
        self._setup_default_components()

    def _setup_default_components(self) -> None:
        """Setup default component registrations."""
        # Register core components
        self.registry.register("detector", type(None))  # Placeholder
        self.registry.register("classifier", type(None))  # Placeholder
        self.registry.register("metrics_calculator", type(None))  # Placeholder
        self.registry.register("reporter", type(None))  # Placeholder
        self.registry.register("cache_manager", type(None))  # Placeholder

    def create_component(self,
                        component_name: str,
                        component_class: Optional[Type[T]] = None,
                        **kwargs) -> T:
        """
        Create or retrieve a component instance.

        Uses lazy initialization and caching for performance.
        """
        # Check if already initialized
        if component_name in self._initialized_components:
            return self._initialized_components[component_name]

        try:
            # Try to create from registry
            if component_class is None and component_name in self.registry.component_types:
                component_class = self.registry.component_types[component_name]

            if component_class is None:
                # Try dynamic import
                component_class = self._dynamic_import(component_name)

            if component_class is None:
                raise ValueError(f"Cannot create component: {component_name}")

            # Resolve dependencies
            dependencies = self._resolve_dependencies(component_name)

            # Merge config with kwargs
            component_config = {
                **self.config.get(component_name, {}),
                **kwargs,
                **dependencies
            }

            # Create instance
            instance = component_class(**component_config)

            # Cache the instance
            self._initialized_components[component_name] = instance
            self.registry.components[component_name] = instance

            logger.info(f"Created component: {component_name}")
            return instance

        except Exception as e:
            logger.error(f"Failed to create component {component_name}: {e}")
            raise

    def _dynamic_import(self, component_name: str) -> Optional[Type]:
        """Dynamically import a component class."""
        try:
            # Convert component name to module path
            module_map = {
                "detector": "analyzer.detectors.ConnascenceDetector",
                "classifier": "analyzer.classifiers.ConnascenceClassifier",
                "metrics_calculator": "analyzer.metrics.MetricsCalculator",
                "reporter": "analyzer.reporting.Reporter",
                "cache_manager": "analyzer.caching.CacheManager",
                "orchestrator": "analyzer.orchestration.AnalysisOrchestrator"
            }

            if component_name not in module_map:
                return None

            module_path, class_name = module_map[component_name].rsplit(".", 1)
            module = import_module(module_path)
            return getattr(module, class_name)

        except (ImportError, AttributeError) as e:
            logger.warning(f"Cannot dynamically import {component_name}: {e}")
            return None

    def _resolve_dependencies(self, component_name: str) -> Dict[str, Any]:
        """Resolve component dependencies."""
        dependencies = {}

        if component_name in self.registry.dependencies:
            for dep_name in self.registry.dependencies[component_name]:
                if dep_name not in self._initialized_components:
                    # Recursively create dependency
                    self.create_component(dep_name)
                dependencies[dep_name] = self._initialized_components[dep_name]

        return dependencies

    def get_component(self, component_name: str) -> Optional[Any]:
        """Get an initialized component."""
        return self._initialized_components.get(component_name)

    def has_component(self, component_name: str) -> bool:
        """Check if a component is initialized."""
        return component_name in self._initialized_components

    def shutdown_component(self, component_name: str) -> None:
        """Shutdown and cleanup a component."""
        if component_name in self._initialized_components:
            component = self._initialized_components[component_name]

            # Call cleanup method if available
            if hasattr(component, 'shutdown'):
                component.shutdown()
            elif hasattr(component, 'close'):
                component.close()
            elif hasattr(component, 'cleanup'):
                component.cleanup()

            # Remove from cache
            del self._initialized_components[component_name]
            if component_name in self.registry.components:
                del self.registry.components[component_name]

            logger.info(f"Shutdown component: {component_name}")

    def shutdown_all(self) -> None:
        """Shutdown all components."""
        components = list(self._initialized_components.keys())
        for component_name in components:
            self.shutdown_component(component_name)

    def get_initialization_order(self) -> List[str]:
        """Get the order in which components were initialized."""
        return list(self._initialized_components.keys())

    def get_component_stats(self) -> Dict[str, Any]:
        """Get statistics about initialized components."""
        return {
            "total_components": len(self._initialized_components),
            "initialized": list(self._initialized_components.keys()),
            "registered_types": list(self.registry.component_types.keys()),
            "memory_usage": sum(
                getattr(comp, 'memory_usage', 0)
                for comp in self._initialized_components.values()
            )
        }