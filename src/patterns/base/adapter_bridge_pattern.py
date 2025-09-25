"""Adapter and Bridge Pattern Base Classes.

Provides base classes for implementing adapter and bridge patterns for
enterprise integration and system interoperability.
"""

from typing import Any, Dict, List, Optional, TypeVar, Generic, Union
import logging

from abc import ABC, abstractmethod
from dataclasses import dataclass

logger = logging.getLogger(__name__)

T = TypeVar('T')
R = TypeVar('R')

class Target(ABC, Generic[T]):
    """Target interface that clients expect."""

    @abstractmethod
    def request(self, data: T) -> Any:
        """Target request method."""

class Adaptee(Generic[T]):
    """Existing interface that needs to be adapted."""

    def specific_request(self, data: T) -> Any:
        """Specific request method of adaptee."""
        return f"Adaptee processing: {data}"

class Adapter(Target[T], Generic[T]):
    """Adapter that adapts Adaptee to Target interface."""

    def __init__(self, adaptee: Adaptee[T]):
        self.adaptee = adaptee

    def request(self, data: T) -> Any:
        """Adapt request to adaptee's interface."""
        return self.adaptee.specific_request(data)

class ObjectAdapter(Target[T], Generic[T]):
    """Object adapter using composition."""

    def __init__(self, adaptee: Adaptee[T]):
        self._adaptee = adaptee

    def request(self, data: T) -> Any:
        """Adapt request using composition."""
        # Transform data if needed
        adapted_data = self._transform_data(data)
        result = self._adaptee.specific_request(adapted_data)
        return self._transform_result(result)

    def _transform_data(self, data: T) -> T:
        """Transform input data for adaptee."""
        return data

    def _transform_result(self, result: Any) -> Any:
        """Transform result from adaptee."""
        return result

# Bridge Pattern Implementation

class Implementor(ABC):
    """Abstract implementor for bridge pattern."""

    @abstractmethod
    def operation_impl(self, data: Any) -> Any:
        """Implementation-specific operation."""

class Abstraction(Generic[T]):
    """Bridge abstraction class."""

    def __init__(self, implementor: Implementor):
        self._implementor = implementor

    def operation(self, data: T) -> Any:
        """High-level operation using implementor."""
        return self._implementor.operation_impl(data)

    def set_implementor(self, implementor: Implementor) -> None:
        """Change implementor."""
        self._implementor = implementor

class RefinedAbstraction(Abstraction[T], Generic[T]):
    """Refined abstraction with extended functionality."""

    def __init__(self, implementor: Implementor):
        super().__init__(implementor)
        self._cache: Dict[str, Any] = {}

    def operation(self, data: T) -> Any:
        """Enhanced operation with caching."""
        cache_key = str(hash(str(data)))

        if cache_key in self._cache:
            logger.debug(f"Cache hit for key: {cache_key}")
            return self._cache[cache_key]

        result = super().operation(data)
        self._cache[cache_key] = result
        return result

    def clear_cache(self) -> None:
        """Clear operation cache."""
        self._cache.clear()

# Concrete Implementors

class ConcreteImplementorA(Implementor):
    """Concrete implementor A."""

    def operation_impl(self, data: Any) -> Any:
        """Implementation A operation."""
        return f"ConcreteImplementorA: {data}"

class ConcreteImplementorB(Implementor):
    """Concrete implementor B."""

    def operation_impl(self, data: Any) -> Any:
        """Implementation B operation."""
        return f"ConcreteImplementorB: {data}"

# Enterprise-specific Adapters

@dataclass
class SystemConfig:
    """Configuration for external systems."""
    name: str
    endpoint: str
    auth_type: str
    timeout: int = 30
    retry_count: int = 3

class ExternalSystemInterface(ABC):
    """Interface for external systems."""

    @abstractmethod
    def connect(self, config: SystemConfig) -> bool:
        """Connect to external system."""

    @abstractmethod
    def send_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Send data to external system."""

    @abstractmethod
    def receive_data(self) -> Dict[str, Any]:
        """Receive data from external system."""

    @abstractmethod
    def disconnect(self) -> bool:
        """Disconnect from external system."""

class LegacySystemAdapter(ExternalSystemInterface):
    """Adapter for legacy systems."""

    def __init__(self, legacy_system: Any):
        self.legacy_system = legacy_system
        self.is_connected = False

    def connect(self, config: SystemConfig) -> bool:
        """Connect to legacy system."""
        try:
            # Adapt modern config to legacy format
            legacy_config = self._adapt_config_to_legacy(config)
            result = self.legacy_system.old_connect_method(legacy_config)
            self.is_connected = result
            return result
        except Exception as e:
            logger.error(f"Legacy system connection failed: {e}")
            return False

    def send_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Send data to legacy system."""
        if not self.is_connected:
            raise ConnectionError("Not connected to legacy system")

        try:
            # Transform data to legacy format
            legacy_data = self._transform_to_legacy_format(data)
            legacy_result = self.legacy_system.old_send_method(legacy_data)
            return self._transform_from_legacy_format(legacy_result)
        except Exception as e:
            logger.error(f"Legacy system send failed: {e}")
            return {"error": str(e)}

    def receive_data(self) -> Dict[str, Any]:
        """Receive data from legacy system."""
        if not self.is_connected:
            raise ConnectionError("Not connected to legacy system")

        try:
            legacy_data = self.legacy_system.old_receive_method()
            return self._transform_from_legacy_format(legacy_data)
        except Exception as e:
            logger.error(f"Legacy system receive failed: {e}")
            return {"error": str(e)}

    def disconnect(self) -> bool:
        """Disconnect from legacy system."""
        try:
            result = self.legacy_system.old_disconnect_method()
            self.is_connected = False
            return result
        except Exception as e:
            logger.error(f"Legacy system disconnect failed: {e}")
            return False

    def _adapt_config_to_legacy(self, config: SystemConfig) -> Dict[str, Any]:
        """Adapt modern config to legacy format."""
        return {
            "system_name": config.name,
            "connection_string": config.endpoint,
            "auth_method": config.auth_type,
            "timeout_seconds": config.timeout
        }

    def _transform_to_legacy_format(self, data: Dict[str, Any]) -> Any:
        """Transform data to legacy format."""
        # Example transformation
        return {
            "legacy_data": data,
            "format_version": "1.0"
        }

    def _transform_from_legacy_format(self, legacy_data: Any) -> Dict[str, Any]:
        """Transform data from legacy format."""
        if isinstance(legacy_data, dict) and "legacy_data" in legacy_data:
            return legacy_data["legacy_data"]
        return {"data": legacy_data}

class ModernSystemAdapter(ExternalSystemInterface):
    """Adapter for modern REST/HTTP systems."""

    def __init__(self, http_client: Any):
        self.http_client = http_client
        self.base_url = ""
        self.headers = {}

    def connect(self, config: SystemConfig) -> bool:
        """Connect to modern system."""
        try:
            self.base_url = config.endpoint
            self.headers = self._build_auth_headers(config)

            # Test connection
            response = self.http_client.get(f"{self.base_url}/health",
                                            headers=self.headers,
                                            timeout=config.timeout)
            return response.status_code == 200
        except Exception as e:
            logger.error(f"Modern system connection failed: {e}")
            return False

    def send_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Send data to modern system."""
        try:
            response = self.http_client.post(
                f"{self.base_url}/api/data",
                json=data,
                headers=self.headers
            )
            return response.json()
        except Exception as e:
            logger.error(f"Modern system send failed: {e}")
            return {"error": str(e)}

    def receive_data(self) -> Dict[str, Any]:
        """Receive data from modern system."""
        try:
            response = self.http_client.get(
                f"{self.base_url}/api/data",
                headers=self.headers
            )
            return response.json()
        except Exception as e:
            logger.error(f"Modern system receive failed: {e}")
            return {"error": str(e)}

    def disconnect(self) -> bool:
        """Disconnect from modern system."""
        # Modern HTTP systems typically don't need explicit disconnect
        self.base_url = ""
        self.headers = {}
        return True

    def _build_auth_headers(self, config: SystemConfig) -> Dict[str, str]:
        """Build authentication headers."""
        if config.auth_type == "bearer":
            return {"Authorization": "Bearer token"}
        elif config.auth_type == "api_key":
            return {"X-API-Key": "api_key"}
        return {}

class SystemBridge(Abstraction[Dict[str, Any]]):
    """Bridge for different system implementations."""

    def __init__(self, implementor: Implementor):
        super().__init__(implementor)
        self.connection_pool = {}

    def process_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Process data through bridge."""
        try:
            return self.operation(data)
        except Exception as e:
            logger.error(f"Bridge processing failed: {e}")
            return {"error": str(e), "original_data": data}

    def add_connection(self, name: str, connection: ExternalSystemInterface) -> None:
        """Add connection to pool."""
        self.connection_pool[name] = connection

    def get_connection(self, name: str) -> Optional[ExternalSystemInterface]:
        """Get connection from pool."""
        return self.connection_pool.get(name)

    def remove_connection(self, name: str) -> bool:
        """Remove connection from pool."""
        if name in self.connection_pool:
            del self.connection_pool[name]
            return True
        return False

class EnterpriseIntegrationBridge(SystemBridge):
    """Enterprise integration bridge with enhanced features."""

    def __init__(self, implementor: Implementor):
        super().__init__(implementor)
        self.message_transformers: Dict[str, Callable] = {}
        self.error_handlers: Dict[str, Callable] = {}

    def add_message_transformer(self, system_name: str,
                                transformer: Callable[[Dict], Dict]) -> None:
        """Add message transformer for specific system."""
        self.message_transformers[system_name] = transformer

    def add_error_handler(self, system_name: str,
                        handler: Callable[[Exception], Dict]) -> None:
        """Add error handler for specific system."""
        self.error_handlers[system_name] = handler

    def send_to_system(self, system_name: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Send data to specific system with transformation."""
        try:
            connection = self.get_connection(system_name)
            if not connection:
                return {"error": f"System {system_name} not found"}

            # Apply transformation if available
            if system_name in self.message_transformers:
                data = self.message_transformers[system_name](data)

            return connection.send_data(data)

        except Exception as e:
            # Apply error handler if available
            if system_name in self.error_handlers:
                return self.error_handlers[system_name](e)

            logger.error(f"Send to {system_name} failed: {e}")
            return {"error": str(e)}

    def broadcast_to_all(self, data: Dict[str, Any]) -> Dict[str, List[Dict]]:
        """Broadcast data to all connected systems."""
        results = {}

        for system_name, connection in self.connection_pool.items():
            try:
                result = self.send_to_system(system_name, data)
                results[system_name] = result
            except Exception as e:
                results[system_name] = {"error": str(e)}

        return {"broadcast_results": results}

# Factory for creating adapters

class AdapterFactory:
    """Factory for creating system adapters."""

    @staticmethod
    def create_legacy_adapter(legacy_system: Any) -> LegacySystemAdapter:
        """Create legacy system adapter."""
        return LegacySystemAdapter(legacy_system)

    @staticmethod
    def create_modern_adapter(http_client: Any) -> ModernSystemAdapter:
        """Create modern system adapter."""
        return ModernSystemAdapter(http_client)

    @staticmethod
    def create_enterprise_bridge(implementor: Implementor) -> EnterpriseIntegrationBridge:
        """Create enterprise integration bridge."""
        return EnterpriseIntegrationBridge(implementor)