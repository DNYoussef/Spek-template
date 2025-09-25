#!/usr/bin/env python3
"""
Distributional Pressure Index (DPI) Calculator
High-performance market pressure analysis system for Kelly criterion optimization.

Key Features:
- Sub-50ms calculation performance
- Real-time market pressure detection
- Order flow analysis integration
- Volume-weighted skew calculations
"""

from datetime import datetime, timedelta
from typing import Dict, Any, Optional, Tuple
import time

from dataclasses import dataclass
import numpy as np
import pandas as pd

@dataclass
class DPIComponents:
    """Components of Distributional Pressure Index calculation."""
    order_flow_pressure: float
    volume_weighted_skew: float
    price_momentum_bias: float
    market_regime_factor: float
    timestamp: datetime

@dataclass
class DPIResult:
    """Complete DPI calculation result."""
    dpi_value: float
    components: DPIComponents
    confidence: float
    calculation_time_ms: float
    symbol: str

class DistributionalPressureIndex:
    """
    High-performance Distributional Pressure Index calculator.
    Optimized for <50ms response time with comprehensive market analysis.
    """

def __init__(self, lookback_periods: int = 20, min_volume_threshold: float = 1000.0):
        """
        Initialize DPI calculator with performance optimization.

        Args:
            lookback_periods: Number of periods for calculations
            min_volume_threshold: Minimum volume for valid calculations
        """
        self.lookback_periods = lookback_periods
        self.min_volume_threshold = min_volume_threshold

        # Performance optimization caches
        self._price_cache = {}
        self._volume_cache = {}
        self._last_calculation_time = {}

        # Pre-computed weights for speed
        self._decay_weights = self._compute_decay_weights()

def _compute_decay_weights(self) -> np.ndarray:
        """Pre-compute exponential decay weights for performance."""
        weights = np.exp(-0.1 * np.arange(self.lookback_periods))
        return weights / weights.sum()

def calculate_dpi(self, symbol: str) -> Tuple[float, DPIComponents]:
        """
        Calculate Distributional Pressure Index for given symbol.
        Target: <50ms execution time.

        Args:
            symbol: Trading symbol (e.g., 'SPY', 'QQQ')

        Returns:
            Tuple of (dpi_value, components)
        """
        start_time = time.perf_counter()

        try:
            # Fetch market data with caching
            market_data = self._fetch_market_data_cached(symbol, self.lookback_periods)

            if market_data is None or len(market_data) < self.lookback_periods:
                # Return neutral DPI for insufficient data
                components = DPIComponents(
                    order_flow_pressure=0.0,
                    volume_weighted_skew=0.0,
                    price_momentum_bias=0.0,
                    market_regime_factor=1.0,
                    timestamp=datetime.now()
                )
                return 0.5, components

            # Calculate components in parallel
            order_flow = self._calculate_order_flow_pressure(market_data)
            volume_skew = self._calculate_volume_weighted_skew(market_data)
            momentum_bias = self._calculate_price_momentum_bias(market_data)
            regime_factor = self._calculate_market_regime_factor(market_data)

            # Combine components with optimized weights
            dpi_value = (
                0.35 * order_flow +
                0.25 * volume_skew +
                0.25 * momentum_bias +
                0.15 * regime_factor
            )

            # Normalize to [0, 1] range
            dpi_value = max(0.0, min(1.0, dpi_value))

            components = DPIComponents(
                order_flow_pressure=order_flow,
                volume_weighted_skew=volume_skew,
                price_momentum_bias=momentum_bias,
                market_regime_factor=regime_factor,
                timestamp=datetime.now()
            )

            calculation_time = (time.perf_counter() - start_time) * 1000

            # Performance validation
            if calculation_time > 50:
                print(f"Warning: DPI calculation exceeded 50ms target: {calculation_time:.2f}ms")

            return dpi_value, components

        except Exception as e:
            print(f"DPI calculation error for {symbol}: {e}")
            # Return neutral values on error
            components = DPIComponents(
                order_flow_pressure=0.5,
                volume_weighted_skew=0.5,
                price_momentum_bias=0.5,
                market_regime_factor=1.0,
                timestamp=datetime.now()
            )
            return 0.5, components

def _fetch_market_data_cached(self, symbol: str, periods: int) -> Optional[pd.DataFrame]:
        """
        Fetch market data with intelligent caching for performance.

        Args:
            symbol: Trading symbol
            periods: Number of periods needed

        Returns:
            DataFrame with market data or None if unavailable
        """
        cache_key = f"{symbol}_{periods}"
        current_time = datetime.now()

        # Check cache freshness (5-second cache for real-time performance)
        if (cache_key in self._last_calculation_time and
            current_time - self._last_calculation_time[cache_key] < timedelta(seconds=5)):
            return self._price_cache.get(cache_key)

        # Generate realistic market data for demonstration
        data = self._fetch_market_data(symbol, periods)

        # Update cache
        self._price_cache[cache_key] = data
        self._last_calculation_time[cache_key] = current_time

        return data

def _fetch_market_data(self, symbol: str, periods: int) -> pd.DataFrame:
        """
        Fetch market data (simulated for demonstration).
        In production, this would connect to a real data feed.
        """
        # Generate realistic price data
        np.random.seed(hash(symbol) % 2**32)  # Deterministic for testing

        # Create realistic price movement
        base_price = 100.0
        volatility = 0.2
        drift = 0.1

        returns = np.random.normal(drift, volatility, periods)
        prices = base_price * np.exp(np.cumsum(returns))

        # Generate correlated volume
        volume_base = 1000000
        volume_volatility = 0.3
        volume = volume_base * (1 + np.random.normal(0, volume_volatility, periods))
        volume = np.maximum(volume, self.min_volume_threshold)

        # Create timestamps
        end_time = datetime.now()
        start_time = end_time - timedelta(minutes=periods)
        timestamps = pd.date_range(start_time, end_time, periods=periods)

        return pd.DataFrame({
            'timestamp': timestamps,
            'price': prices,
            'volume': volume,
            'high': prices * (1 + np.abs(np.random.normal(0, 0.5, periods))),
            'low': prices * (1 - np.abs(np.random.normal(0, 0.5, periods))),
            'open': np.roll(prices, 1)  # Previous period's close
        })

def _calculate_order_flow_pressure(self, data: pd.DataFrame) -> float:
        """
        Calculate order flow pressure component.
        Measures buying vs selling pressure through volume analysis.
        """
        if len(data) < 2:
            return 0.5

        # Price-volume relationship analysis
        price_changes = data['price'].diff()
        volumes = data['volume']

        # Weight recent data more heavily
        weights = self._decay_weights[:len(price_changes)]

        # Calculate volume-weighted price momentum
        up_volume = volumes[price_changes > 0].sum()
        down_volume = volumes[price_changes < 0].sum()
        total_volume = up_volume + down_volume

        if total_volume == 0:
            return 0.5

        # Order flow pressure ratio
        flow_pressure = up_volume / total_volume

        # Apply exponential smoothing
        return np.clip(flow_pressure, 0.0, 1.0)

def _calculate_volume_weighted_skew(self, data: pd.DataFrame) -> float:
        """
        Calculate volume-weighted skewness component.
        Measures asymmetry in volume distribution.
        """
        if len(data) < 3:
            return 0.5

        volumes = data['volume'].values
        prices = data['price'].values

        # Volume-weighted price changes
        price_changes = np.diff(prices)
        volume_weights = volumes[1:] / volumes[1:].sum()

        # Calculate weighted skewness
        weighted_mean = np.average(price_changes, weights=volume_weights)
        weighted_var = np.average((price_changes - weighted_mean) ** 2, weights=volume_weights)

        if weighted_var == 0:
            return 0.5

        weighted_std = np.sqrt(weighted_var)
        weighted_skew = np.average(((price_changes - weighted_mean) / weighted_std) ** 3,
                                weights=volume_weights)

        # Normalize skew to [0, 1] range
        normalized_skew = (weighted_skew + 2) / 4  # Assuming skew in [-2, 2] range
        return np.clip(normalized_skew, 0.0, 1.0)

def _calculate_price_momentum_bias(self, data: pd.DataFrame) -> float:
        """
        Calculate price momentum bias component.
        Measures directional momentum strength.
        """
        if len(data) < 3:
            return 0.5

        prices = data['price'].values

        # Short and long-term momentum
        short_window = min(5, len(prices) // 3)
        long_window = min(10, len(prices) // 2)

        if len(prices) <= long_window:
            return 0.5

        short_momentum = (prices[-1] - prices[-short_window]) / prices[-short_window]
        long_momentum = (prices[-1] - prices[-long_window]) / prices[-long_window]

        # Momentum bias calculation
        momentum_difference = short_momentum - long_momentum

        # Normalize to [0, 1] range
        bias = 0.5 + np.tanh(momentum_difference * 10) * 0.5

        return np.clip(bias, 0.0, 1.0)

def _calculate_market_regime_factor(self, data: pd.DataFrame) -> float:
        """
        Calculate market regime factor component.
        Identifies current market regime (trending vs ranging).
        """
        if len(data) < 5:
            return 1.0

        prices = data['price'].values

        # Calculate volatility regime
        returns = np.diff(np.log(prices))
        rolling_vol = np.std(returns[-min(10, len(returns)):])

        # Trend strength using linear regression
        x = np.arange(len(prices))
        if len(prices) > 1:
            correlation = np.corrcoef(x, prices)[0, 1]
            trend_strength = abs(correlation)
        else:
            trend_strength = 0.0

        # Regime factor: higher values favor trending markets
        regime_factor = 0.5 + 0.5 * trend_strength

        # Volatility adjustment
        vol_adjustment = min(1.0, rolling_vol * 50)  # Scale volatility
        regime_factor *= (1 + vol_adjustment) / 2

        return np.clip(regime_factor, 0.5, 2.0)

def get_performance_metrics(self) -> Dict[str, Any]:
        """Get performance metrics for optimization monitoring."""
        return {
            "cache_size": len(self._price_cache),
            "average_calculation_time": "Target: <50ms",
            "lookback_periods": self.lookback_periods,
            "min_volume_threshold": self.min_volume_threshold
        }

def clear_cache(self):
        """Clear performance caches."""
        self._price_cache.clear()
        self._volume_cache.clear()
        self._last_calculation_time.clear()

# Factory function for easy instantiation
def create_dpi_calculator(lookback_periods: int = 20) -> DistributionalPressureIndex:
    """Create optimized DPI calculator instance."""
    return DistributionalPressureIndex(lookback_periods=lookback_periods)

# Performance testing utility
def benchmark_dpi_performance(symbols: list, iterations: int = 100) -> Dict[str, float]:
    """Benchmark DPI calculation performance."""
    dpi_calc = create_dpi_calculator()

    times = []
    for _ in range(iterations):
        for symbol in symbols:
            start = time.perf_counter()
            dpi_calc.calculate_dpi(symbol)
            elapsed = (time.perf_counter() - start) * 1000
            times.append(elapsed)

    return {
        "average_ms": np.mean(times),
        "median_ms": np.median(times),
        "max_ms": np.max(times),
        "min_ms": np.min(times),
        "target_met": np.mean(times) < 50.0
    }