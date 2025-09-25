#!/usr/bin/env python3
"""
Dynamic Position Sizing System
Advanced position management with Kelly Criterion and DPI integration.

Key Features:
- Real-time position sizing adjustments
- Kelly Criterion optimization
- DPI-enhanced market awareness
- Risk-adjusted portfolio management
- Multi-timeframe analysis
"""

from datetime import datetime
from typing import Dict, Any, Optional, List, Tuple
import time

from dataclasses import dataclass
from decimal import Decimal
from enum import Enum
import numpy as np

# Import dependencies with fixed paths
import sys
from pathlib import Path

# Add src to path for proper imports
src_path = Path(__file__).parent.parent
if str(src_path) not in sys.path:
    sys.path.insert(0, str(src_path))

from strategies.dpi_calculator import DistributionalPressureIndex, DPIComponents
from risk.kelly_criterion import KellyCriterionCalculator, KellyInputs, KellyResult

class RiskLevel(Enum):
    """Risk level classifications for position sizing."""
    CONSERVATIVE = "conservative"
    MODERATE = "moderate"
    AGGRESSIVE = "aggressive"
    MAXIMUM = "maximum"

class MarketRegime(Enum):
    """Market regime classifications."""
    TRENDING_UP = "trending_up"
    TRENDING_DOWN = "trending_down"
    RANGING = "ranging"
    VOLATILE = "volatile"
    CRISIS = "crisis"

@dataclass
class PositionSizingConfig:
    """Configuration for dynamic position sizing."""
    base_risk_level: RiskLevel
    max_portfolio_risk: float
    max_single_position: float
    correlation_limit: float
    drawdown_threshold: float
    volatility_lookback: int = 20
    rebalance_frequency: int = 5  # minutes

@dataclass
class PositionRecommendation:
    """Position sizing recommendation."""
    symbol: str
    recommended_size: Decimal
    current_size: Decimal
    adjustment_needed: Decimal
    confidence: float
    risk_contribution: float
    kelly_fraction: float
    dpi_adjustment: float
    market_regime: MarketRegime
    timestamp: datetime

@dataclass
class PortfolioRiskMetrics:
    """Portfolio-level risk metrics."""
    total_exposure: Decimal
    risk_utilization: float
    expected_volatility: float
    max_drawdown_estimate: float
    sharpe_estimate: float
    correlation_risk: float

class DynamicPositionSizer:
    """
    Advanced dynamic position sizing system.
    Integrates Kelly Criterion with DPI for optimal portfolio allocation.
    """

def __init__(self, config: PositionSizingConfig,
                kelly_calculator: Optional[KellyCriterionCalculator] = None,
                dpi_calculator: Optional[DistributionalPressureIndex] = None):
        """
        Initialize dynamic position sizer.

        Args:
            config: Position sizing configuration
            kelly_calculator: Optional Kelly criterion calculator
            dpi_calculator: Optional DPI calculator
        """
        self.config = config
        self.kelly_calculator = kelly_calculator or KellyCriterionCalculator()
        self.dpi_calculator = dpi_calculator or DistributionalPressureIndex()

        # Risk management state
        self.current_positions: Dict[str, Decimal] = {}
        self.position_history: List[PositionRecommendation] = []
        self.portfolio_capital = Decimal('0')

        # Performance tracking
        self._last_rebalance_time = None
        self._calculation_times: List[float] = []

def calculate_position_sizes(self, symbols: List[str], market_data: Dict[str, Any],
                                portfolio_capital: Decimal) -> List[PositionRecommendation]:
        """
        Calculate optimal position sizes for all symbols.

        Args:
            symbols: List of trading symbols
            market_data: Market data for all symbols
            portfolio_capital: Total portfolio capital

        Returns:
            List of position recommendations
        """
        start_time = time.perf_counter()

        self.portfolio_capital = portfolio_capital
        recommendations = []

        try:
            # Determine market regime
            market_regime = self._analyze_market_regime(market_data)

            # Calculate individual position recommendations
            for symbol in symbols:
                if symbol in market_data:
                    recommendation = self._calculate_individual_position(
                        symbol, market_data[symbol], market_regime
                    )
                    recommendations.append(recommendation)

            # Apply portfolio-level constraints
            recommendations = self._apply_portfolio_constraints(recommendations)

            # Update position history
            self.position_history.extend(recommendations)

            calculation_time = (time.perf_counter() - start_time) * 1000
            self._calculation_times.append(calculation_time)

            # Performance validation
            if calculation_time > 100:  # Allow more time for portfolio calculation
                print(f"Warning: Portfolio sizing exceeded 100ms target: {calculation_time:.2f}ms")

            return recommendations

        except Exception as e:
            print(f"Dynamic position sizing error: {e}")
            return self._create_conservative_recommendations(symbols)

def _calculate_individual_position(self, symbol: str, symbol_data: Dict[str, Any],
                                    market_regime: MarketRegime) -> PositionRecommendation:
        """Calculate position size for individual symbol."""
        try:
            # Extract market data
            returns = symbol_data.get('returns', np.array([]))
            current_price = symbol_data.get('price', 100.0)

            # Calculate Kelly inputs from returns
            if len(returns) > 10:
                positive_returns = returns[returns > 0]
                negative_returns = returns[returns < 0]

                if len(positive_returns) > 0 and len(negative_returns) > 0:
                    win_rate = len(positive_returns) / len(returns)
                    avg_win = float(np.mean(positive_returns))
                    avg_loss = float(np.abs(np.mean(negative_returns)))
                else:
                    # Insufficient data - use conservative defaults
                    win_rate, avg_win, avg_loss = 0.5, 0.1, 0.1
            else:
                # Very limited data
                win_rate, avg_win, avg_loss = 0.5, 0.5, 0.5

            # Create Kelly inputs
            kelly_inputs = KellyInputs(
                symbol=symbol,
                win_rate=win_rate,
                average_win=avg_win,
                average_loss=avg_loss,
                current_capital=self.portfolio_capital,
                max_position_size=self.config.max_single_position
            )

            # Calculate Kelly position
            kelly_result = self.kelly_calculator.calculate_kelly_position(kelly_inputs)

            # Get DPI data
            dpi_value, dpi_components = self.dpi_calculator.calculate_dpi(symbol)

            # Apply market regime adjustments
            regime_adjusted_fraction = self._apply_regime_adjustment(
                kelly_result.dpi_adjusted_fraction, market_regime, dpi_value
            )

            # Calculate recommended position size
            recommended_size = self.portfolio_capital * Decimal(str(regime_adjusted_fraction))
            current_size = self.current_positions.get(symbol, Decimal('0'))
            adjustment_needed = recommended_size - current_size

            # Risk contribution calculation
            risk_contribution = self._calculate_risk_contribution(
                regime_adjusted_fraction, symbol_data
            )

            return PositionRecommendation(
                symbol=symbol,
                recommended_size=recommended_size,
                current_size=current_size,
                adjustment_needed=adjustment_needed,
                confidence=kelly_result.confidence_level,
                risk_contribution=risk_contribution,
                kelly_fraction=kelly_result.kelly_fraction,
                dpi_adjustment=dpi_value,
                market_regime=market_regime,
                timestamp=datetime.now()
            )

        except Exception as e:
            print(f"Individual position calculation error for {symbol}: {e}")
            return self._create_conservative_recommendation(symbol, market_regime)

def _analyze_market_regime(self, market_data: Dict[str, Any]) -> MarketRegime:
        """Analyze overall market regime from aggregate data."""
        try:
            # Aggregate market indicators
            all_returns = []
            volatilities = []

            for symbol_data in market_data.values():
                returns = symbol_data.get('returns', np.array([]))
                if len(returns) > 5:
                    all_returns.extend(returns)
                    volatilities.append(np.std(returns))

            if not all_returns:
                return MarketRegime.RANGING

            # Market trend analysis
            overall_returns = np.array(all_returns)
            mean_return = np.mean(overall_returns)
            volatility = np.std(overall_returns)
            avg_volatility = np.mean(volatilities) if volatilities else 0.2

            # Regime classification
            if avg_volatility > 0.5:  # High volatility threshold
                if abs(mean_return) > 0.2:
                    return MarketRegime.CRISIS
                else:
                    return MarketRegime.VOLATILE
            elif mean_return > 0.1:
                return MarketRegime.TRENDING_UP
            elif mean_return < -0.1:
                return MarketRegime.TRENDING_DOWN
            else:
                return MarketRegime.RANGING

        except Exception as e:
            print(f"Market regime analysis error: {e}")
            return MarketRegime.RANGING

def _apply_regime_adjustment(self, base_fraction: float, regime: MarketRegime,
                                dpi_value: float) -> float:
        """Apply market regime adjustments to position size."""
        # Base regime adjustments
        regime_multipliers = {
            MarketRegime.TRENDING_UP: 1.2,
            MarketRegime.TRENDING_DOWN: 0.8,
            MarketRegime.RANGING: 1.0,
            MarketRegime.VOLATILE: 0.7,
            MarketRegime.CRISIS: 0.5
        }

        regime_multiplier = regime_multipliers.get(regime, 1.0)

        # Risk level adjustments
        risk_multipliers = {
            RiskLevel.CONSERVATIVE: 0.5,
            RiskLevel.MODERATE: 0.75,
            RiskLevel.AGGRESSIVE: 1.0,
            RiskLevel.MAXIMUM: 1.25
        }

        risk_multiplier = risk_multipliers.get(self.config.base_risk_level, 0.75)

        # DPI confidence adjustment
        dpi_multiplier = 0.8 + (dpi_value * 0.4)  # Scale 0-1 to 0.8-1.2

        # Combined adjustment
        adjusted_fraction = base_fraction * regime_multiplier * risk_multiplier * dpi_multiplier

        # Apply final bounds
        return max(0.5, min(adjusted_fraction, self.config.max_single_position))

def _calculate_risk_contribution(self, position_fraction: float,
                                    symbol_data: Dict[str, Any]) -> float:
        """Calculate position's contribution to portfolio risk."""
        returns = symbol_data.get('returns', np.array([0.1]))
        volatility = np.std(returns) if len(returns) > 1 else 0.2

        # Risk contribution as fraction of portfolio volatility
        risk_contribution = position_fraction * volatility

        return risk_contribution

def _apply_portfolio_constraints(self, recommendations: List[PositionRecommendation]
                                    ) -> List[PositionRecommendation]:
        """Apply portfolio-level risk constraints."""
        # Calculate total exposure
        total_recommended = sum(rec.recommended_size for rec in recommendations)
        max_portfolio_exposure = self.portfolio_capital * Decimal(str(self.config.max_portfolio_risk))

        # Scale down if over-allocated
        if total_recommended > max_portfolio_exposure:
            scale_factor = float(max_portfolio_exposure / total_recommended)

            for rec in recommendations:
                rec.recommended_size *= Decimal(str(scale_factor))
                rec.adjustment_needed = rec.recommended_size - rec.current_size

        # Apply correlation limits (simplified implementation)
        recommendations = self._apply_correlation_limits(recommendations)

        return recommendations

def _apply_correlation_limits(self, recommendations: List[PositionRecommendation]
                                ) -> List[PositionRecommendation]:
        """Apply correlation-based position limits."""
        # Simplified correlation management

        # Limit sector concentration (basic implementation)
        total_exposure = sum(rec.recommended_size for rec in recommendations)

        if total_exposure > 0:
            for rec in recommendations:
                weight = float(rec.recommended_size / total_exposure)

                # Limit any single position to correlation limit
                if weight > self.config.correlation_limit:
                    new_size = total_exposure * Decimal(str(self.config.correlation_limit))
                    rec.recommended_size = new_size
                    rec.adjustment_needed = rec.recommended_size - rec.current_size

        return recommendations

def _create_conservative_recommendation(self, symbol: str,
                                            market_regime: MarketRegime) -> PositionRecommendation:
        """Create conservative recommendation for error cases."""
        return PositionRecommendation(
            symbol=symbol,
            recommended_size=Decimal('0'),
            current_size=self.current_positions.get(symbol, Decimal('0')),
            adjustment_needed=Decimal('0'),
            confidence=0.1,
            risk_contribution=0.0,
            kelly_fraction=0.0,
            dpi_adjustment=0.5,
            market_regime=market_regime,
            timestamp=datetime.now()
        )

def _create_conservative_recommendations(self, symbols: List[str]
                                            ) -> List[PositionRecommendation]:
        """Create conservative recommendations for error cases."""
        return [
            self._create_conservative_recommendation(symbol, MarketRegime.RANGING)
            for symbol in symbols
        ]

def update_current_positions(self, positions: Dict[str, Decimal]):
        """Update current position sizes."""
        self.current_positions = positions.copy()

def should_rebalance(self) -> bool:
        """Determine if portfolio should be rebalanced."""
        if self._last_rebalance_time is None:
            return True

        time_since_rebalance = (datetime.now() - self._last_rebalance_time).total_seconds() / 60
        return time_since_rebalance >= self.config.rebalance_frequency

def calculate_portfolio_metrics(self, recommendations: List[PositionRecommendation]
                                    ) -> PortfolioRiskMetrics:
        """Calculate portfolio-level risk metrics."""
        total_exposure = sum(rec.recommended_size for rec in recommendations)
        risk_utilization = float(total_exposure / self.portfolio_capital) if self.portfolio_capital > 0 else 0

        # Risk calculations
        total_risk_contribution = sum(rec.risk_contribution for rec in recommendations)
        expected_volatility = total_risk_contribution

        # Simplified portfolio metrics
        max_drawdown_estimate = max((rec.risk_contribution for rec in recommendations), default=0.1)
        sharpe_estimate = 0.1 / (expected_volatility + 1e-6)  # Rough estimate
        correlation_risk = risk_utilization * 0.2  # Simplified

        return PortfolioRiskMetrics(
            total_exposure=total_exposure,
            risk_utilization=risk_utilization,
            expected_volatility=expected_volatility,
            max_drawdown_estimate=max_drawdown_estimate,
            sharpe_estimate=sharpe_estimate,
            correlation_risk=correlation_risk
        )

def get_performance_metrics(self) -> Dict[str, Any]:
        """Get performance metrics for the position sizer."""
        if not self._calculation_times:
            return {"message": "No calculations performed yet"}

        return {
            "average_calculation_time_ms": np.mean(self._calculation_times),
            "total_calculations": len(self.position_history),
            "rebalance_frequency_minutes": self.config.rebalance_frequency,
            "max_portfolio_risk": self.config.max_portfolio_risk,
            "max_single_position": self.config.max_single_position,
            "current_positions_count": len(self.current_positions)
        }

# Factory functions

def create_position_sizer(risk_level: RiskLevel = RiskLevel.MODERATE,
                        max_portfolio_risk: float = 0.8,
                        max_single_position: float = 0.1) -> DynamicPositionSizer:
    """Create configured dynamic position sizer."""
    config = PositionSizingConfig(
        base_risk_level=risk_level,
        max_portfolio_risk=max_portfolio_risk,
        max_single_position=max_single_position,
        correlation_limit=0.15,
        drawdown_threshold=0.5,
        volatility_lookback=20,
        rebalance_frequency=5
    )

    return DynamicPositionSizer(config)

def create_conservative_sizer() -> DynamicPositionSizer:
    """Create conservative position sizer for defensive strategies."""
    return create_position_sizer(
        risk_level=RiskLevel.CONSERVATIVE,
        max_portfolio_risk=0.5,
        max_single_position=0.5
    )

def create_aggressive_sizer() -> DynamicPositionSizer:
    """Create aggressive position sizer for growth strategies."""
    return create_position_sizer(
        risk_level=RiskLevel.AGGRESSIVE,
        max_portfolio_risk=1.0,
        max_single_position=0.2
    )