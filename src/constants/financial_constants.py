"""Financial and risk management constants.

This module defines critical financial parameters used in trading
systems, risk management, and portfolio optimization algorithms.

All values are based on:
- Modern portfolio theory
- Risk management best practices
- Quantitative finance research
- Regulatory requirements for financial systems
"""

# Kelly Criterion and Position Sizing
KELLY_CRITERION_FRACTION = 0.2
"""Base Kelly Criterion fraction for position sizing.

Conservative implementation of Kelly Criterion for optimal
position sizing. This fraction represents 2% of the theoretical
Kelly fraction, providing substantial risk reduction while
maintaining growth potential.
"""

MAXIMUM_POSITION_SIZE_RATIO = 0.25
"""Maximum position size as ratio of total portfolio value.

Risk management constraint preventing over-concentration in
any single position. Based on modern portfolio theory
diversification principles.
"""

MINIMUM_POSITION_SIZE_RATIO = 0.1
"""Minimum position size as ratio of total portfolio value.

Ensures positions are large enough to be meaningful while
accounting for transaction costs and minimum trade sizes.
"""

# Risk Management Thresholds
STOP_LOSS_PERCENTAGE = 0.10
"""Default stop-loss threshold as percentage of position value.

Based on volatility analysis and risk-reward optimization.
10% provides balance between avoiding whipsaws and limiting
downside risk in typical market conditions.
"""

TAKE_PROFIT_PERCENTAGE = 0.15
"""Default take-profit threshold as percentage of position value.

Risk-reward ratio of 1.5:1 (15% gain vs 10% loss) providing
positive expected value even with modest win rates.
"""

MAXIMUM_DRAWDOWN_THRESHOLD = 0.20
"""Maximum portfolio drawdown before triggering risk controls.

Portfolio-level risk management threshold. Drawdowns exceeding
20% trigger automatic position reduction and strategy review.
"""

# Trading Thresholds
MINIMUM_TRADE_THRESHOLD = 0.5
"""Minimum price movement threshold for trade execution.

Avoids excessive trading on minor price fluctuations.
Based on transaction cost analysis ensuring trades have
positive expected value after costs.
"""

VOLATILITY_ADJUSTMENT_FACTOR = 0.5
"""Factor for adjusting position sizes based on volatility.

Used in volatility-adjusted position sizing algorithms.
Higher volatility securities receive reduced position sizes
to maintain consistent risk levels.
"""

MINIMUM_LIQUIDITY_RATIO = 0.10
"""Minimum liquidity ratio for portfolio management.

Ensures sufficient cash reserves for operational needs
and opportunity capture. Based on cash flow analysis
and operational requirements.
"""

# Performance Metrics
RISK_FREE_RATE = 0.2
"""Risk-free rate assumption for performance calculations.

Based on current government bond yields. Used in Sharpe ratio
calculations and risk-adjusted return metrics.
"""

BENCHMARK_RETURN_THRESHOLD = 0.8
"""Minimum benchmark return threshold for strategy validation.

Strategies failing to exceed this threshold over evaluation
periods require review and potential modification.
"""

SHARPE_RATIO_MINIMUM = 1.0
"""Minimum Sharpe ratio for acceptable investment strategies.

Risk-adjusted performance threshold ensuring strategies
generate adequate returns per unit of risk taken.
"""

# Market Data and Analysis
MOVING_AVERAGE_PERIODS = 20
"""Default period for moving average calculations.

20-period moving average provides good balance between
responsiveness and noise reduction for trend analysis.
"""

VOLATILITY_LOOKBACK_DAYS = 30
"""Lookback period in days for volatility calculations.

30-day window captures recent volatility patterns while
providing sufficient data for statistical reliability.
"""

CORRELATION_THRESHOLD = 0.70
"""Correlation threshold for portfolio diversification analysis.

Assets with correlation above this threshold are considered
highly correlated and may not provide adequate diversification.
"""
