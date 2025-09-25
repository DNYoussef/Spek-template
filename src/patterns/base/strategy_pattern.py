"""Strategy Pattern Base Classes.

Provides base classes for implementing strategy patterns with calculator
factories for flexible algorithm selection and execution.
"""

from typing import Any, Dict, List, Optional, TypeVar, Generic, Type, Callable
import logging

from abc import ABC, abstractmethod
from dataclasses import dataclass
from enum import Enum

logger = logging.getLogger(__name__)

T = TypeVar('T')
R = TypeVar('R')

class StrategyContext(ABC, Generic[T, R]):
    """Base context class for strategy pattern implementations."""

    def __init__(self, strategy: Optional['Strategy[T, R]'] = None):
        self._strategy = strategy

    def set_strategy(self, strategy: 'Strategy[T, R]') -> None:
        """Set the strategy to use."""
        self._strategy = strategy

    def execute_strategy(self, data: T) -> R:
        """Execute the current strategy."""
        if not self._strategy:
            raise ValueError("No strategy set")
        return self._strategy.execute(data)

    @abstractmethod
    def get_default_strategy(self) -> 'Strategy[T, R]':
        """Get default strategy if none set."""

class Strategy(ABC, Generic[T, R]):
    """Base strategy interface."""

    def __init__(self, name: str):
        self.name = name

    @abstractmethod
    def execute(self, data: T) -> R:
        """Execute the strategy."""

    @abstractmethod
    def can_handle(self, data: T) -> bool:
        """Check if strategy can handle the data."""

    def get_name(self) -> str:
        """Get strategy name."""
        return self.name

class CalculationResult(Generic[R]):
    """Result of calculation operation."""

    def __init__(self, value: R, metadata: Optional[Dict[str, Any]] = None,
                errors: Optional[List[str]] = None):
        self.value = value
        self.metadata = metadata or {}
        self.errors = errors or []
        self.success = len(self.errors) == 0

class Calculator(ABC, Generic[T, R]):
    """Base calculator interface."""

    def __init__(self, name: str):
        self.name = name

    @abstractmethod
    def calculate(self, input_data: T) -> CalculationResult[R]:
        """Perform calculation."""

    @abstractmethod
    def validate_input(self, input_data: T) -> List[str]:
        """Validate input data and return errors."""

    def get_name(self) -> str:
        """Get calculator name."""
        return self.name

class CalculatorFactory(Generic[T, R]):
    """Factory for creating calculators."""

    def __init__(self):
        self._calculators: Dict[str, Type[Calculator[T, R]]] = {}
        self._instances: Dict[str, Calculator[T, R]] = {}

    def register_calculator(self, name: str, calculator_class: Type[Calculator[T, R]]) -> None:
        """Register a calculator class."""
        self._calculators[name] = calculator_class
        logger.info(f"Registered calculator: {name}")

    def create_calculator(self, name: str) -> Calculator[T, R]:
        """Create calculator instance."""
        if name not in self._calculators:
            raise ValueError(f"Unknown calculator: {name}")

        # Return cached instance or create new one
        if name not in self._instances:
            calculator_class = self._calculators[name]
            self._instances[name] = calculator_class(name)

        return self._instances[name]

    def get_available_calculators(self) -> List[str]:
        """Get list of available calculator names."""
        return list(self._calculators.keys())

    def create_best_calculator(self, input_data: T) -> Calculator[T, R]:
        """Create the best calculator for given input data."""
        for name, calculator_class in self._calculators.items():
            calculator = self.create_calculator(name)
            validation_errors = calculator.validate_input(input_data)
            if not validation_errors:
                return calculator

        # If no perfect match, return first available
        if self._calculators:
            first_name = list(self._calculators.keys())[0]
            return self.create_calculator(first_name)

        raise ValueError("No calculators available")

class StrategyFactory(Generic[T, R]):
    """Factory for creating strategies."""

    def __init__(self):
        self._strategies: Dict[str, Type[Strategy[T, R]]] = {}
        self._instances: Dict[str, Strategy[T, R]] = {}

    def register_strategy(self, name: str, strategy_class: Type[Strategy[T, R]]) -> None:
        """Register a strategy class."""
        self._strategies[name] = strategy_class
        logger.info(f"Registered strategy: {name}")

    def create_strategy(self, name: str) -> Strategy[T, R]:
        """Create strategy instance."""
        if name not in self._strategies:
            raise ValueError(f"Unknown strategy: {name}")

        if name not in self._instances:
            strategy_class = self._strategies[name]
            self._instances[name] = strategy_class(name)

        return self._instances[name]

    def get_available_strategies(self) -> List[str]:
        """Get list of available strategy names."""
        return list(self._strategies.keys())

    def select_best_strategy(self, data: T) -> Strategy[T, R]:
        """Select best strategy for given data."""
        for name, strategy_class in self._strategies.items():
            strategy = self.create_strategy(name)
            if strategy.can_handle(data):
                return strategy

        raise ValueError(f"No strategy can handle data type: {type(data)}")

class CompositeStrategy(Strategy[T, R]):
    """Strategy that combines multiple strategies."""

    def __init__(self, name: str, strategies: List[Strategy[T, R]],
                combination_func: Callable[[List[R]], R]):
        super().__init__(name)
        self.strategies = strategies
        self.combination_func = combination_func

    def execute(self, data: T) -> R:
        """Execute all strategies and combine results."""
        results = []
        for strategy in self.strategies:
            if strategy.can_handle(data):
                result = strategy.execute(data)
                results.append(result)

        if not results:
            raise ValueError("No strategy could handle the data")

        return self.combination_func(results)

    def can_handle(self, data: T) -> bool:
        """Can handle if any strategy can handle."""
        return any(strategy.can_handle(data) for strategy in self.strategies)

class ConditionalStrategy(Strategy[T, R]):
    """Strategy that executes based on condition."""

    def __init__(self, name: str, condition: Callable[[T], bool],
                true_strategy: Strategy[T, R], false_strategy: Strategy[T, R]):
        super().__init__(name)
        self.condition = condition
        self.true_strategy = true_strategy
        self.false_strategy = false_strategy

    def execute(self, data: T) -> R:
        """Execute strategy based on condition."""
        if self.condition(data):
            return self.true_strategy.execute(data)
        else:
            return self.false_strategy.execute(data)

    def can_handle(self, data: T) -> bool:
        """Can handle if both strategies can handle."""
        return (self.true_strategy.can_handle(data) and
                self.false_strategy.can_handle(data))

@dataclass
class StrategyExecutionResult(Generic[R]):
    """Result of strategy execution."""
    result: R
    strategy_name: str
    execution_time_ms: float
    success: bool
    errors: List[str]

    def __post_init__(self):
        if self.errors is None:
            self.errors = []

class StrategyManager(Generic[T, R]):
    """Manager for strategy execution and lifecycle."""

    def __init__(self):
        self.factory = StrategyFactory[T, R]()
        self.default_strategy: Optional[Strategy[T, R]] = None
        self.execution_history: List[StrategyExecutionResult[R]] = []

    def register_strategy(self, name: str, strategy_class: Type[Strategy[T, R]]) -> None:
        """Register strategy with factory."""
        self.factory.register_strategy(name, strategy_class)

    def set_default_strategy(self, strategy: Strategy[T, R]) -> None:
        """Set default strategy."""
        self.default_strategy = strategy

    def execute_strategy(self, strategy_name: str, data: T) -> StrategyExecutionResult[R]:
        """Execute named strategy."""
        import time

        start_time = time.perf_counter()
        errors = []

        try:
            strategy = self.factory.create_strategy(strategy_name)
            result = strategy.execute(data)
            success = True
        except Exception as e:
            logger.error(f"Strategy execution failed: {e}")
            errors.append(str(e))
            result = None
            success = False

        execution_time = (time.perf_counter() - start_time) * 1000

        execution_result = StrategyExecutionResult(
            result=result,
            strategy_name=strategy_name,
            execution_time_ms=execution_time,
            success=success,
            errors=errors
        )

        self.execution_history.append(execution_result)
        return execution_result

    def execute_best_strategy(self, data: T) -> StrategyExecutionResult[R]:
        """Execute best available strategy for data."""
        try:
            strategy = self.factory.select_best_strategy(data)
            return self.execute_strategy(strategy.get_name(), data)
        except ValueError:
            if self.default_strategy:
                return self.execute_strategy(self.default_strategy.get_name(), data)
            raise

    def get_execution_history(self) -> List[StrategyExecutionResult[R]]:
        """Get strategy execution history."""
        return self.execution_history.copy()

    def get_performance_metrics(self) -> Dict[str, Any]:
        """Get performance metrics for strategies."""
        if not self.execution_history:
            return {"message": "No executions recorded"}

        total_executions = len(self.execution_history)
        successful_executions = sum(1 for r in self.execution_history if r.success)
        average_time = sum(r.execution_time_ms for r in self.execution_history) / total_executions

        strategy_stats = {}
        for result in self.execution_history:
            name = result.strategy_name
            if name not in strategy_stats:
                strategy_stats[name] = {"count": 0, "success_rate": 0.0, "avg_time": 0.0}

            strategy_stats[name]["count"] += 1

        return {
            "total_executions": total_executions,
            "success_rate": successful_executions / total_executions,
            "average_execution_time_ms": average_time,
            "strategy_statistics": strategy_stats
        }