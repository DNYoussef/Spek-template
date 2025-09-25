"""Risk Calculator Factory Implementation.

Implements Strategy + Calculator Factory patterns for risk management.
Provides flexible risk calculation strategies with factory creation.
"""

from typing import Dict, List, Any, Optional, Union
import logging

from dataclasses import dataclass
from decimal import Decimal
import numpy as np

from src.patterns.base.strategy_pattern import (
    Strategy, StrategyFactory, Calculator, CalculatorFactory,
    CalculationResult, StrategyManager, StrategyExecutionResult
)

logger = logging.getLogger(__name__)

@dataclass
class RiskInput:
    """Input data for risk calculations."""
    portfolio_value: Decimal
    positions: Dict[str, Decimal]
    historical_returns: np.ndarray
    volatilities: Dict[str, float]
    correlations: Optional[np.ndarray] = None
    confidence_level: float = 0.95

@dataclass
class RiskResult:
    """Risk calculation result."""
    var: float  # Value at Risk
    cvar: float  # Conditional Value at Risk
    max_drawdown: float
    sharpe_ratio: float
    volatility: float
    beta: Optional[float] = None
    risk_contribution: Optional[Dict[str, float]] = None

class VaRCalculator(Calculator[RiskInput, RiskResult]):
    """Value at Risk calculator."""

    def __init__(self, name: str = "var_calculator"):
        super().__init__(name)
        self.method = "historical"  # historical, parametric, monte_carlo

    def calculate(self, input_data: RiskInput) -> CalculationResult[RiskResult]:
        """Calculate Value at Risk."""
        try:
            # Validate input
            errors = self.validate_input(input_data)
            if errors:
                return CalculationResult(
                    value=None,
                    errors=errors
                )

            # Calculate historical VaR
            returns = input_data.historical_returns
            var_percentile = 1 - input_data.confidence_level
            var = np.percentile(returns, var_percentile * 100)
            
            # Calculate CVaR (Expected Shortfall)
            cvar = np.mean(returns[returns <= var])
            
            # Calculate other risk metrics
            volatility = np.std(returns)
            max_drawdown = self._calculate_max_drawdown(returns)
            sharpe_ratio = np.mean(returns) / volatility if volatility > 0 else 0
            
            # Portfolio value adjustment
            portfolio_val = float(input_data.portfolio_value)
            var_dollar = var * portfolio_val
            cvar_dollar = cvar * portfolio_val
            
            result = RiskResult(
                var=var_dollar,
                cvar=cvar_dollar,
                max_drawdown=max_drawdown,
                sharpe_ratio=sharpe_ratio,
                volatility=volatility
            )
            
            return CalculationResult(
                value=result,
                metadata={
                    'method': self.method,
                    'confidence_level': input_data.confidence_level,
                    'returns_count': len(returns)
                }
            )

        except Exception as e:
            logger.error(f"VaR calculation failed: {e}")
            return CalculationResult(
                value=None,
                errors=[str(e)]
            )

    def validate_input(self, input_data: RiskInput) -> List[str]:
        """Validate VaR input data."""
        errors = []
        
        if input_data.portfolio_value <= 0:
            errors.append("Portfolio value must be positive")
        
        if len(input_data.historical_returns) < 30:
            errors.append("Need at least 30 historical returns for VaR")
        
        if not (0.8 <= input_data.confidence_level <= 0.99):
            errors.append("Confidence level should be between 0.8 and 0.99")
        
        return errors

    def _calculate_max_drawdown(self, returns: np.ndarray) -> float:
        """Calculate maximum drawdown."""
        cumulative = np.cumprod(1 + returns)
        rolling_max = np.maximum.accumulate(cumulative)
        drawdowns = (cumulative - rolling_max) / rolling_max
        return float(np.min(drawdowns))

class VolatilityCalculator(Calculator[RiskInput, Dict[str, float]]):
    """Portfolio volatility calculator."""

    def __init__(self, name: str = "volatility_calculator"):
        super().__init__(name)

    def calculate(self, input_data: RiskInput) -> CalculationResult[Dict[str, float]]:
        """Calculate portfolio volatility metrics."""
        try:
            errors = self.validate_input(input_data)
            if errors:
                return CalculationResult(
                    value=None,
                    errors=errors
                )

            returns = input_data.historical_returns
            
            # Calculate various volatility measures
            historical_vol = np.std(returns) * np.sqrt(252)  # Annualized
            garch_vol = self._calculate_garch_volatility(returns)
            ewma_vol = self._calculate_ewma_volatility(returns)
            
            result = {
                'historical_volatility': float(historical_vol),
                'garch_volatility': float(garch_vol),
                'ewma_volatility': float(ewma_vol),
                'volatility_of_volatility': float(np.std(np.diff(returns))),
            }
            
            return CalculationResult(
                value=result,
                metadata={
                    'calculation_method': 'multiple_estimators',
                    'annualization_factor': 252
                }
            )

        except Exception as e:
            logger.error(f"Volatility calculation failed: {e}")
            return CalculationResult(
                value=None,
                errors=[str(e)]
            )

    def validate_input(self, input_data: RiskInput) -> List[str]:
        """Validate volatility input data."""
        errors = []
        
        if len(input_data.historical_returns) < 20:
            errors.append("Need at least 20 returns for volatility calculation")
        
        return errors

    def _calculate_garch_volatility(self, returns: np.ndarray) -> float:
        """Simple GARCH(1, 1) volatility estimate."""
        # Simplified GARCH implementation
        alpha = 0.1
        beta = 0.85
        omega = 0.5
        
        variance = np.var(returns)
        for i in range(1, len(returns)):
            variance = omega + alpha * returns[i-1]**2 + beta * variance
        
        return np.sqrt(variance * 252)

    def _calculate_ewma_volatility(self, returns: np.ndarray, lambda_param: float = 0.94) -> float:
        """Exponentially Weighted Moving Average volatility."""
        weights = np.array([lambda_param**(len(returns)-i-1) for i in range(len(returns))])
        weights = weights / weights.sum()
        
        weighted_variance = np.sum(weights * returns**2)
        return np.sqrt(weighted_variance * 252)

class ConservativeRiskStrategy(Strategy[RiskInput, RiskResult]):
    """Conservative risk calculation strategy."""

    def __init__(self):
        super().__init__("conservative_risk")
        self.var_calculator = VaRCalculator("conservative_var")

    def execute(self, data: RiskInput) -> RiskResult:
        """Execute conservative risk calculation."""
        # Use higher confidence level for conservative approach
        conservative_input = RiskInput(
            portfolio_value=data.portfolio_value,
            positions=data.positions,
            historical_returns=data.historical_returns,
            volatilities=data.volatilities,
            correlations=data.correlations,
            confidence_level=0.99  # More conservative
        )
        
        result = self.var_calculator.calculate(conservative_input)
        if result.success:
            # Apply conservative adjustments
            risk_result = result.value
            risk_result.var *= 1.2  # 20% buffer
            risk_result.cvar *= 1.2
            return risk_result
        else:
            raise ValueError(f"Conservative risk calculation failed: {result.errors}")

    def can_handle(self, data: RiskInput) -> bool:
        """Check if can handle conservative risk calculation."""
        return len(data.historical_returns) >= 30

class AggressiveRiskStrategy(Strategy[RiskInput, RiskResult]):
    """Aggressive risk calculation strategy."""

    def __init__(self):
        super().__init__("aggressive_risk")
        self.var_calculator = VaRCalculator("aggressive_var")

    def execute(self, data: RiskInput) -> RiskResult:
        """Execute aggressive risk calculation."""
        # Use lower confidence level for aggressive approach
        aggressive_input = RiskInput(
            portfolio_value=data.portfolio_value,
            positions=data.positions,
            historical_returns=data.historical_returns,
            volatilities=data.volatilities,
            correlations=data.correlations,
            confidence_level=0.95  # Standard confidence level
        )
        
        result = self.var_calculator.calculate(aggressive_input)
        if result.success:
            return result.value
        else:
            raise ValueError(f"Aggressive risk calculation failed: {result.errors}")

    def can_handle(self, data: RiskInput) -> bool:
        """Check if can handle aggressive risk calculation."""
        return len(data.historical_returns) >= 20

class RiskCalculatorFactory(CalculatorFactory[RiskInput, Union[RiskResult, Dict[str, float]]]):
    """Factory for creating risk calculators."""

    def __init__(self):
        super().__init__()
        self._register_calculators()

    def _register_calculators(self):
        """Register available risk calculators."""
        self.register_calculator("var", VaRCalculator)
        self.register_calculator("volatility", VolatilityCalculator)

class RiskStrategyManager(StrategyManager[RiskInput, RiskResult]):
    """Manager for risk calculation strategies."""

    def __init__(self):
        super().__init__()
        self._register_strategies()

    def _register_strategies(self):
        """Register available risk strategies."""
        self.register_strategy("conservative", ConservativeRiskStrategy)
        self.register_strategy("aggressive", AggressiveRiskStrategy)

class RiskManagementSystem:
    """Main risk management system using factory patterns."""

    def __init__(self):
        self.calculator_factory = RiskCalculatorFactory()
        self.strategy_manager = RiskStrategyManager()
        self._default_strategy = "conservative"

    def calculate_risk(self, input_data: RiskInput, 
                        calculation_type: str = "var") -> CalculationResult:
        """Calculate risk using specified calculator."""
        try:
            calculator = self.calculator_factory.create_calculator(calculation_type)
            return calculator.calculate(input_data)
        except Exception as e:
            logger.error(f"Risk calculation failed: {e}")
            return CalculationResult(
                value=None,
                errors=[str(e)]
            )

    def execute_risk_strategy(self, input_data: RiskInput,
                            strategy_name: str = None) -> StrategyExecutionResult:
        """Execute risk strategy."""
        strategy_name = strategy_name or self._default_strategy
        return self.strategy_manager.execute_strategy(strategy_name, input_data)

    def get_risk_assessment(self, input_data: RiskInput) -> Dict[str, Any]:
        """Get comprehensive risk assessment."""
        assessment = {}
        
        # Calculate VaR
        var_result = self.calculate_risk(input_data, "var")
        if var_result.success:
            assessment['var_analysis'] = var_result.value
        
        # Calculate volatility metrics
        vol_result = self.calculate_risk(input_data, "volatility")
        if vol_result.success:
            assessment['volatility_analysis'] = vol_result.value
        
        # Execute strategy
        strategy_result = self.execute_risk_strategy(input_data)
        if strategy_result.success:
            assessment['strategic_analysis'] = strategy_result.result
        
        return assessment

    def set_default_strategy(self, strategy_name: str) -> None:
        """Set default risk strategy."""
        available_strategies = self.strategy_manager.factory.get_available_strategies()
        if strategy_name in available_strategies:
            self._default_strategy = strategy_name
        else:
            raise ValueError(f"Unknown strategy: {strategy_name}")

    def get_available_calculators(self) -> List[str]:
        """Get available risk calculators."""
        return self.calculator_factory.get_available_calculators()

    def get_available_strategies(self) -> List[str]:
        """Get available risk strategies."""
        return self.strategy_manager.factory.get_available_strategies()

# Factory function
def create_risk_management_system() -> RiskManagementSystem:
    """Create configured risk management system."""
    return RiskManagementSystem()
