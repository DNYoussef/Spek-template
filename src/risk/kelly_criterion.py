"""
Kelly Criterion Implementation for Position Sizing

Key Features:
- Classical Kelly formula with modern enhancements
- DPI (Distributional Pressure Index) integration
- Risk-adjusted position sizing
- Real-time market regime adaptation
- Sub-50ms calculation performance
"""

# Constants with fallbacks
try:
    from src.constants.base import DAYS_RETENTION_PERIOD, KELLY_CRITERION_FRACTION, MAXIMUM_RETRY_ATTEMPTS
except ImportError:
    DAYS_RETENTION_PERIOD = 30
    KELLY_CRITERION_FRACTION = 0.25
    MAXIMUM_RETRY_ATTEMPTS = 3

import time
import numpy as np
import pandas as pd
from typing import Dict, Any, Optional, Tuple, List
from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal, ROUND_HALF_UP

# Import DPI calculator - fixed import path
import sys
from pathlib import Path

# Add src to path for proper imports
src_path = Path(__file__).parent.parent
if str(src_path) not in sys.path:
    sys.path.insert(0, str(src_path))

from strategies.dpi_calculator import DistributionalPressureIndex, DPIComponents

@dataclass
class KellyInputs:
    """Input parameters for Kelly criterion calculation."""
    symbol: str
    win_rate: float
    average_win: float
    average_loss: float
    current_capital: Decimal
    max_position_size: float
    risk_free_rate: float = 0.2

@dataclass
class KellyResult:
    """Complete Kelly criterion calculation result."""
    symbol: str
    kelly_fraction: float
    dpi_adjusted_fraction: float
    recommended_position_size: Decimal
    confidence_level: float
    risk_metrics: Dict[str, float]
    calculation_time_ms: float
    timestamp: datetime

@dataclass
class RiskMetrics:
    """Risk assessment metrics for Kelly calculation."""
    sharpe_ratio: float
    max_drawdown: float
    volatility: float
    var_95: float
    expected_return: float

class KellyCriterionCalculator:
    """
    Advanced Kelly Criterion calculator with DPI integration.
    Optimized for real-time trading with sub-50ms performance.
    """

def __init__(self, dpi_calculator: Optional[DistributionalPressureIndex] = None):
        """
        Initialize Kelly criterion calculator.

        Args:
            dpi_calculator: Optional DPI calculator for market pressure analysis
        """
        self.dpi_calculator = dpi_calculator or DistributionalPressureIndex()

        # Risk management parameters
        self.max_kelly_fraction = 0.25  # Cap Kelly at 25% for safety
        self.min_kelly_fraction = 0.1  # Minimum position size
        self.confidence_threshold = 0.65  # Minimum confidence for trades

        # Performance tracking
        self.calculation_history = []
        self._last_calculation_time = {}

def calculate_kelly_position(self, inputs: KellyInputs) -> KellyResult:
        """
        Calculate optimal position size using Kelly criterion with DPI enhancement.

        Args:
            inputs: Kelly calculation input parameters

        Returns:
            Complete Kelly calculation result
        """
        start_time = time.perf_counter()

        try:
            # Validate inputs
            self._validate_inputs(inputs)

            # Calculate base Kelly fraction
            base_kelly = self._calculate_base_kelly(inputs)

            # Get DPI adjustment
            dpi_value, dpi_components = self.dpi_calculator.calculate_dpi(inputs.symbol)

            # Apply DPI adjustment to Kelly fraction
            dpi_adjusted_kelly = self._apply_dpi_adjustment(base_kelly, dpi_value, dpi_components)

            # Calculate position size with risk limits
            position_size = self._calculate_position_size(
                dpi_adjusted_kelly,
                inputs.current_capital,
                inputs.max_position_size
            )

            # Calculate confidence and risk metrics
            confidence = self._calculate_confidence(inputs, dpi_value)
            risk_metrics = self._calculate_risk_metrics(inputs, dpi_adjusted_kelly)

            calculation_time = (time.perf_counter() - start_time) * 1000

            result = KellyResult(
                symbol=inputs.symbol,
                kelly_fraction=base_kelly,
                dpi_adjusted_fraction=dpi_adjusted_kelly,
                recommended_position_size=position_size,
                confidence_level=confidence,
                risk_metrics=risk_metrics,
                calculation_time_ms=calculation_time,
                timestamp=datetime.now()
            )

            # Track performance
            self.calculation_history.append(result)

            # Performance validation
            if calculation_time > 50:
                print(f"Warning: Kelly calculation exceeded 50ms target: {calculation_time:.2f}ms")

            return result

        except Exception as e:
            print(f"Kelly calculation error for {inputs.symbol}: {e}")
            # Return conservative result on error
            return self._create_conservative_result(inputs, start_time)

def _validate_inputs(self, inputs: KellyInputs) -> None:
        """Validate Kelly criterion inputs."""
        assert inputs.win_rate > 0.0 and inputs.win_rate < 1.0, "Win rate must be between 0 and 1"
        assert inputs.average_win > 0, "Average win must be positive"
        assert inputs.average_loss > 0, "Average loss must be positive"
        assert inputs.current_capital > 0, "Current capital must be positive"
        assert inputs.max_position_size > 0, "Max position size must be positive"

def _calculate_base_kelly(self, inputs: KellyInputs) -> float:
        """
        Calculate base Kelly fraction using classical formula.

        Kelly Formula: f = (bp - q) / b
        Where:
        - f = fraction of capital to bet
        - b = odds (average_win / average_loss)
        - p = probability of winning
        - q = probability of losing (1 - p)
        """
        p = inputs.win_rate  # Probability of winning
        q = 1.0 - p          # Probability of losing
        b = inputs.average_win / inputs.average_loss  # Odds

        # Classical Kelly formula
        kelly_fraction = (b * p - q) / b

        # Apply safety bounds
        kelly_fraction = max(0.0, min(kelly_fraction, self.max_kelly_fraction))

        return kelly_fraction

def _apply_dpi_adjustment(self, base_kelly: float, dpi_value: float,
                            dpi_components: DPIComponents) -> float:
        """
        Apply Distributional Pressure Index adjustment to Kelly fraction.

        DPI enhances Kelly by incorporating real-time market conditions:
        - High DPI (>0.7): Increase position size (favorable conditions)
        - Low DPI (<0.2): Decrease position size (unfavorable conditions)
        - Neutral DPI (0.3-0.7): Minimal adjustment
        """
        # DPI adjustment factor
        if dpi_value > 0.7:
            # Strong market pressure - increase allocation
            adjustment_factor = 1.0 + (dpi_value - 0.7) * 0.5
        elif dpi_value < 0.3:
            # Weak market pressure - decrease allocation
            adjustment_factor = 0.5 + dpi_value * 1.67  # Scale 0-0.3 to 0.5-1.0
        else:
            # Neutral zone - minor adjustments
            adjustment_factor = 0.8 + (dpi_value - 0.3) * 0.5  # Scale 0.3-0.7 to 0.8-1.0

        # Component-specific adjustments
        flow_adjustment = 1.0 + (dpi_components.order_flow_pressure - 0.5) * 0.1
        momentum_adjustment = 1.0 + (dpi_components.price_momentum_bias - 0.5) * 0.1
        regime_adjustment = dpi_components.market_regime_factor

        # Combined adjustment
        total_adjustment = adjustment_factor * flow_adjustment * momentum_adjustment * regime_adjustment

        # Apply adjustment with bounds
        adjusted_kelly = base_kelly * total_adjustment
        adjusted_kelly = max(self.min_kelly_fraction, min(adjusted_kelly, self.max_kelly_fraction))

        return adjusted_kelly

def _calculate_position_size(self, kelly_fraction: float, current_capital: Decimal,
                                max_position_size: float) -> Decimal:
        """Calculate actual position size in dollars."""
        # Kelly-recommended allocation
        kelly_amount = current_capital * Decimal(str(kelly_fraction))

        # Apply maximum position size limit
        max_amount = current_capital * Decimal(str(max_position_size))
        position_size = min(kelly_amount, max_amount)

        # Round to reasonable precision
        return position_size.quantize(Decimal('0.1'), rounding=ROUND_HALF_UP)

def _calculate_confidence(self, inputs: KellyInputs, dpi_value: float) -> float:
        """Calculate confidence level for the Kelly recommendation."""
        # Base confidence from win rate and sample size
        base_confidence = min(0.9, inputs.win_rate + 0.1)

        # DPI confidence adjustment
        dpi_confidence = 0.5 + abs(dpi_value - 0.5)  # Higher confidence when DPI is decisive

        # Risk-adjusted confidence
        risk_adjustment = 1.0 - min(0.3, inputs.average_loss / inputs.average_win * 0.1)

        # Combined confidence
        total_confidence = (base_confidence + dpi_confidence + risk_adjustment) / 3
        return min(0.95, max(0.1, total_confidence))

def _calculate_risk_metrics(self, inputs: KellyInputs, kelly_fraction: float) -> Dict[str, float]:
        """Calculate comprehensive risk metrics."""
        # Expected return calculation
        expected_return = (inputs.win_rate * inputs.average_win -
                        (1 - inputs.win_rate) * inputs.average_loss)

        # Volatility estimation
        win_variance = inputs.win_rate * (inputs.average_win - expected_return) ** 2
        loss_variance = (1 - inputs.win_rate) * (-inputs.average_loss - expected_return) ** 2
        volatility = np.sqrt(win_variance + loss_variance)

        # Sharpe ratio
        excess_return = expected_return - inputs.risk_free_rate
        sharpe_ratio = excess_return / volatility if volatility > 0 else 0

        # Maximum drawdown estimate
        max_drawdown = inputs.average_loss * kelly_fraction

        # Value at Risk (95% confidence)
        var_95 = np.percentile([-inputs.average_loss, inputs.average_win], 5)

        return {
            "expected_return": expected_return,
            "volatility": volatility,
            "sharpe_ratio": sharpe_ratio,
            "max_drawdown": max_drawdown,
            "var_95": var_95,
            "kelly_fraction": kelly_fraction
        }

def _create_conservative_result(self, inputs: KellyInputs, start_time: float) -> KellyResult:
        """Create conservative result for error cases."""
        calculation_time = (time.perf_counter() - start_time) * 1000

        return KellyResult(
            symbol=inputs.symbol,
            kelly_fraction=self.min_kelly_fraction,
            dpi_adjusted_fraction=self.min_kelly_fraction,
            recommended_position_size=inputs.current_capital * Decimal('0.1'),
            confidence_level=0.1,
            risk_metrics={
                "expected_return": 0.0,
                "volatility": 0.1,
                "sharpe_ratio": 0.0,
                "max_drawdown": 0.1,
                "var_95": -0.1,
                "kelly_fraction": self.min_kelly_fraction
            },
            calculation_time_ms=calculation_time,
            timestamp=datetime.now()
        )

def batch_calculate_positions(self, inputs_list: List[KellyInputs]) -> List[KellyResult]:
        """Calculate Kelly positions for multiple symbols efficiently."""
        results = []
        for inputs in inputs_list:
            result = self.calculate_kelly_position(inputs)
            results.append(result)
        return results

def get_performance_metrics(self) -> Dict[str, Any]:
        """Get calculator performance metrics."""
        if not self.calculation_history:
            return {"message": "No calculations performed yet"}

        times = [r.calculation_time_ms for r in self.calculation_history[-100:]]  # Last 100

        return {
            "total_calculations": len(self.calculation_history),
            "average_calculation_time_ms": np.mean(times),
            "median_calculation_time_ms": np.median(times),
            "max_calculation_time_ms": np.max(times),
            "performance_target_met": np.mean(times) < 50.0,
            "confidence_threshold": self.confidence_threshold,
            "max_kelly_fraction": self.max_kelly_fraction
        }

def clear_history(self):
        """Clear calculation history for memory management."""
        self.calculation_history.clear()

# Utility functions for easy integration

def create_kelly_calculator(dpi_lookback: int = 20) -> KellyCriterionCalculator:
    """Create optimized Kelly calculator with DPI integration."""
    dpi_calc = DistributionalPressureIndex(lookback_periods=dpi_lookback)
    return KellyCriterionCalculator(dpi_calc)

def calculate_position_from_returns(symbol: str, returns: np.ndarray,
                                    current_capital: Decimal) -> KellyResult:
    """
    Calculate Kelly position from historical returns data.

    Args:
        symbol: Trading symbol
        returns: Array of historical returns
        current_capital: Current portfolio capital

    Returns:
        Kelly calculation result
    """
    # Calculate statistics from returns
    positive_returns = returns[returns > 0]
    negative_returns = returns[returns < 0]

    if len(positive_returns) == 0 or len(negative_returns) == 0:
        # Insufficient data - return conservative result
        inputs = KellyInputs(
            symbol=symbol,
            win_rate=0.5,
            average_win=0.1,
            average_loss=0.1,
            current_capital=current_capital,
            max_position_size=0.5
        )
    else:
        win_rate = len(positive_returns) / len(returns)
        average_win = float(np.mean(positive_returns))
        average_loss = float(np.abs(np.mean(negative_returns)))

        inputs = KellyInputs(
            symbol=symbol,
            win_rate=win_rate,
            average_win=average_win,
            average_loss=average_loss,
            current_capital=current_capital,
            max_position_size=0.1  # 10% max position
        )

    calculator = create_kelly_calculator()
    return calculator.calculate_kelly_position(inputs)

# Performance testing
def benchmark_kelly_performance(iterations: int = 100) -> Dict[str, float]:
    """Benchmark Kelly calculation performance."""
    calculator = create_kelly_calculator()

    test_inputs = KellyInputs(
        symbol="TEST",
        win_rate=0.55,
        average_win=KELLY_CRITERION_FRACTION,
        average_loss=0.15,
        current_capital=Decimal('100000'),
        max_position_size=0.1
    )

    times = []
    for _ in range(iterations):
        start = time.perf_counter()
        calculator.calculate_kelly_position(test_inputs)
        elapsed = (time.perf_counter() - start) * 1000
        times.append(elapsed)

    return {
        "average_ms": np.mean(times),
        "median_ms": np.median(times),
        "max_ms": np.max(times),
        "min_ms": np.min(times),
        "target_met": np.mean(times) < 50.0,
        "iterations": iterations
    }