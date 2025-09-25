"""
Risk Management Module
Advanced risk management systems with Kelly Criterion and dynamic position sizing.
"""

from .kelly_criterion import (
    KellyCriterionCalculator,
    KellyInputs,
    KellyResult,
    RiskMetrics
)
from .dynamic_position_sizing import (
    DynamicPositionSizer,
    PositionSizingConfig,
    PositionRecommendation,
    PortfolioRiskMetrics,
    RiskLevel,
    MarketRegime,
    create_position_sizer,
    create_conservative_sizer,
    create_aggressive_sizer
)

__all__ = [
    # Kelly Criterion
    'KellyCriterionCalculator',
    'KellyInputs',
    'KellyResult',
    'RiskMetrics',
    'create_kelly_calculator',
    'calculate_position_from_returns',
    'benchmark_kelly_performance',

    # Dynamic Position Sizing
    'DynamicPositionSizer',
    'PositionSizingConfig',
    'PositionRecommendation',
    'PortfolioRiskMetrics',
    'RiskLevel',
    'MarketRegime',
    'create_position_sizer',
    'create_conservative_sizer',
    'create_aggressive_sizer'
]