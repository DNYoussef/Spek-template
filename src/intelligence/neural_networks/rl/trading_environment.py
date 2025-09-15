"""Trading Environment for Reinforcement Learning

Gymnasium-compatible trading environment for RL agent training.
Includes Gary×Taleb integration and realistic trading constraints.
"""

import gymnasium as gym
import numpy as np
from typing import Dict, List, Tuple, Optional, Any, Union
from dataclasses import dataclass
from enum import Enum
import pandas as pd


class ActionType(Enum):
    """Trading action types."""
    HOLD = 0
    BUY = 1
    SELL = 2
    BUY_STRONG = 3
    SELL_STRONG = 4


@dataclass
class TradingState:
    """Current trading state."""
    price: float
    position: float  # -1 to 1 (short to long)
    cash: float
    portfolio_value: float
    unrealized_pnl: float
    realized_pnl: float
    timestamp: int
    market_features: np.ndarray
    volatility: float
    volume_pressure: float


@dataclass
class EnvironmentConfig:
    """Trading environment configuration."""
    initial_capital: float = 200.0  # $200 seed capital
    max_position_size: float = 1.0  # Maximum position as fraction of capital
    transaction_cost: float = 0.001  # 0.1% transaction cost
    slippage: float = 0.0005  # 0.05% slippage
    leverage: float = 1.0  # No leverage initially

    # Risk management
    max_drawdown: float = 0.20  # 20% max drawdown
    stop_loss: float = 0.05  # 5% stop loss
    take_profit: float = 0.10  # 10% take profit

    # Gary×Taleb parameters
    dpi_reward_weight: float = 0.3
    antifragile_reward_weight: float = 0.2
    volatility_opportunity_weight: float = 0.15

    # Environment parameters
    lookback_window: int = 60
    max_episode_steps: int = 1000
    reward_scaling: float = 100.0


class TradingEnvironment(gym.Env):
    """Reinforcement learning trading environment.

    Features:
    - Realistic trading mechanics with costs and slippage
    - Gary's DPI reward integration
    - Taleb's antifragility principles
    - Risk management constraints
    - Continuous position sizing
    """

    def __init__(self,
                 market_data: pd.DataFrame,
                 config: EnvironmentConfig):
        """Initialize trading environment.

        Args:
            market_data: OHLCV market data with additional features
            config: Environment configuration
        """
        super(TradingEnvironment, self).__init__()

        self.config = config
        self.market_data = market_data.copy()

        # Validate market data
        required_columns = ['open', 'high', 'low', 'close', 'volume']
        if not all(col in market_data.columns for col in required_columns):
            raise ValueError(f\"Market data must contain columns: {required_columns}\")

        # Add technical indicators if not present
        self._add_technical_indicators()

        # Define action and observation spaces
        self.action_space = gym.spaces.Box(
            low=np.array([-1.0, 0.0]),  # [position_change, confidence]
            high=np.array([1.0, 1.0]),
            dtype=np.float32
        )

        # Observation space: OHLCV + technical indicators + portfolio state
        n_features = len(self.market_data.columns) - len(required_columns) + 10  # Base features + portfolio state
        self.observation_space = gym.spaces.Box(
            low=-np.inf,
            high=np.inf,
            shape=(config.lookback_window, n_features),
            dtype=np.float32
        )

        # Initialize state
        self.reset()

    def _add_technical_indicators(self):
        """Add technical indicators to market data."""
        df = self.market_data

        # Price-based indicators
        df['returns'] = df['close'].pct_change()
        df['log_returns'] = np.log(df['close'] / df['close'].shift(1))

        # Moving averages
        for window in [5, 10, 20, 50]:
            df[f'sma_{window}'] = df['close'].rolling(window).mean()
            df[f'ema_{window}'] = df['close'].ewm(span=window).mean()

        # Volatility measures
        df['volatility_20'] = df['returns'].rolling(20).std() * np.sqrt(252)
        df['volatility_5'] = df['returns'].rolling(5).std() * np.sqrt(252)

        # Volume indicators
        df['volume_sma_20'] = df['volume'].rolling(20).mean()
        df['volume_ratio'] = df['volume'] / df['volume_sma_20']
        df['price_volume'] = df['close'] * df['volume']

        # Momentum indicators
        df['rsi_14'] = self._calculate_rsi(df['close'], 14)
        df['macd'], df['macd_signal'] = self._calculate_macd(df['close'])
        df['bb_upper'], df['bb_lower'] = self._calculate_bollinger_bands(df['close'])

        # Gary's DPI indicators
        df['price_momentum'] = df['close'].pct_change(5)  # 5-period momentum
        df['volume_pressure'] = (df['volume'] - df['volume_sma_20']) / df['volume_sma_20']
        df['volatility_regime'] = df['volatility_20'] / df['volatility_20'].rolling(60).mean()

        # Taleb's antifragility indicators
        df['tail_risk'] = df['returns'].rolling(20).quantile(0.05)  # 5% VaR
        df['upside_capture'] = df['returns'].rolling(20).quantile(0.95)  # 95% upside
        df['volatility_skew'] = df['returns'].rolling(20).skew()
        df['kurtosis'] = df['returns'].rolling(20).kurt()

        # Drop NaN values
        self.market_data = df.dropna()

    def _calculate_rsi(self, prices: pd.Series, window: int = 14) -> pd.Series:
        \"\"\"Calculate RSI indicator.\"\"\"
        delta = prices.diff()
        gain = (delta.where(delta > 0, 0)).rolling(window).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window).mean()
        rs = gain / loss\n        return 100 - (100 / (1 + rs))\n        \n    def _calculate_macd(self, prices: pd.Series) -> Tuple[pd.Series, pd.Series]:\n        \"\"\"Calculate MACD indicator.\"\"\"\n        ema_12 = prices.ewm(span=12).mean()\n        ema_26 = prices.ewm(span=26).mean()\n        macd = ema_12 - ema_26\n        signal = macd.ewm(span=9).mean()\n        return macd, signal\n        \n    def _calculate_bollinger_bands(self, prices: pd.Series, window: int = 20) -> Tuple[pd.Series, pd.Series]:\n        \"\"\"Calculate Bollinger Bands.\"\"\"\n        sma = prices.rolling(window).mean()\n        std = prices.rolling(window).std()\n        upper = sma + (std * 2)\n        lower = sma - (std * 2)\n        return upper, lower\n        \n    def reset(self, seed: Optional[int] = None) -> Tuple[np.ndarray, Dict[str, Any]]:\n        \"\"\"Reset environment to initial state.\n        \n        Returns:\n            Initial observation and info dict\n        \"\"\"\n        if seed is not None:\n            np.random.seed(seed)\n            \n        # Reset to random starting point\n        max_start = len(self.market_data) - self.config.max_episode_steps - self.config.lookback_window\n        self.current_step = np.random.randint(self.config.lookback_window, max_start)\n        \n        # Initialize trading state\n        self.state = TradingState(\n            price=self.market_data.iloc[self.current_step]['close'],\n            position=0.0,\n            cash=self.config.initial_capital,\n            portfolio_value=self.config.initial_capital,\n            unrealized_pnl=0.0,\n            realized_pnl=0.0,\n            timestamp=self.current_step,\n            market_features=np.array([]),  # Will be set in _get_observation\n            volatility=self.market_data.iloc[self.current_step]['volatility_20'],\n            volume_pressure=self.market_data.iloc[self.current_step]['volume_pressure']\n        )\n        \n        # Track episode statistics\n        self.episode_stats = {\n            'total_return': 0.0,\n            'max_drawdown': 0.0,\n            'sharpe_ratio': 0.0,\n            'trades': 0,\n            'winning_trades': 0,\n            'gary_dpi_rewards': 0.0,\n            'taleb_antifragile_rewards': 0.0,\n            'transaction_costs': 0.0,\n            'max_portfolio_value': self.config.initial_capital\n        }\n        \n        # Portfolio value history for metrics\n        self.portfolio_history = [self.config.initial_capital]\n        self.position_history = [0.0]\n        self.action_history = []\n        \n        observation = self._get_observation()\n        info = {'state': self.state, 'stats': self.episode_stats}\n        \n        return observation, info\n        \n    def step(self, action: np.ndarray) -> Tuple[np.ndarray, float, bool, bool, Dict[str, Any]]:\n        \"\"\"Execute trading action.\n        \n        Args:\n            action: [position_change, confidence] both in [-1, 1]\n            \n        Returns:\n            observation, reward, terminated, truncated, info\n        \"\"\"\n        # Clip action to valid range\n        action = np.clip(action, self.action_space.low, self.action_space.high)\n        position_change, confidence = action\n        \n        # Store action for analysis\n        self.action_history.append(action.copy())\n        \n        # Get current market data\n        current_data = self.market_data.iloc[self.current_step]\n        next_data = self.market_data.iloc[self.current_step + 1] if self.current_step + 1 < len(self.market_data) else current_data\n        \n        # Calculate proposed new position\n        old_position = self.state.position\n        proposed_position = old_position + position_change\n        \n        # Apply position limits\n        max_pos = self.config.max_position_size\n        new_position = np.clip(proposed_position, -max_pos, max_pos)\n        actual_position_change = new_position - old_position\n        \n        # Execute trade if position changes\n        trade_cost = 0.0\n        if abs(actual_position_change) > 0.001:  # Minimum trade threshold\n            trade_cost = self._execute_trade(\n                actual_position_change, \n                current_data['close'], \n                confidence\n            )\n            \n        # Update to next time step\n        self.current_step += 1\n        if self.current_step >= len(self.market_data) - 1:\n            self.current_step = len(self.market_data) - 1\n            \n        # Calculate PnL\n        price_change = next_data['close'] - current_data['close']\n        unrealized_pnl_change = self.state.position * price_change * self.config.initial_capital\n        \n        # Update state\n        self.state.price = next_data['close']\n        self.state.unrealized_pnl += unrealized_pnl_change\n        self.state.portfolio_value = self.state.cash + self.state.unrealized_pnl\n        self.state.timestamp = self.current_step\n        self.state.volatility = next_data['volatility_20']\n        self.state.volume_pressure = next_data['volume_pressure']\n        \n        # Update history\n        self.portfolio_history.append(self.state.portfolio_value)\n        self.position_history.append(self.state.position)\n        \n        # Update episode statistics\n        self.episode_stats['max_portfolio_value'] = max(\n            self.episode_stats['max_portfolio_value'],\n            self.state.portfolio_value\n        )\n        \n        # Calculate drawdown\n        current_dd = (self.episode_stats['max_portfolio_value'] - self.state.portfolio_value) / self.episode_stats['max_portfolio_value']\n        self.episode_stats['max_drawdown'] = max(self.episode_stats['max_drawdown'], current_dd)\n        \n        # Calculate reward\n        reward = self._calculate_reward(current_data, next_data, actual_position_change, confidence, trade_cost)\n        \n        # Check termination conditions\n        terminated = (\n            self.state.portfolio_value <= self.config.initial_capital * (1 - self.config.max_drawdown) or\n            self.episode_stats['max_drawdown'] >= self.config.max_drawdown\n        )\n        \n        # Check truncation (max episode length)\n        truncated = (self.current_step - self.config.lookback_window) >= self.config.max_episode_steps\n        \n        # Get observation\n        observation = self._get_observation()\n        \n        # Prepare info dict\n        info = {\n            'state': self.state,\n            'stats': self.episode_stats,\n            'action_taken': action,\n            'position_change': actual_position_change,\n            'trade_cost': trade_cost,\n            'price_change': price_change,\n            'pnl_change': unrealized_pnl_change\n        }\n        \n        return observation, reward, terminated, truncated, info\n        \n    def _execute_trade(self, position_change: float, price: float, confidence: float) -> float:\n        \"\"\"Execute trade with realistic costs.\n        \n        Args:\n            position_change: Change in position\n            price: Current price\n            confidence: Trade confidence\n            \n        Returns:\n            Total trade cost\n        \"\"\"\n        trade_value = abs(position_change) * self.config.initial_capital\n        \n        # Base transaction cost\n        transaction_cost = trade_value * self.config.transaction_cost\n        \n        # Slippage (higher for larger trades and lower confidence)\n        slippage_factor = self.config.slippage * (1 + abs(position_change)) * (2 - confidence)\n        slippage_cost = trade_value * slippage_factor\n        \n        total_cost = transaction_cost + slippage_cost\n        \n        # Update cash\n        self.state.cash -= total_cost\n        \n        # Update position\n        self.state.position += position_change\n        \n        # Update statistics\n        self.episode_stats['trades'] += 1\n        self.episode_stats['transaction_costs'] += total_cost\n        \n        return total_cost\n        \n    def _calculate_reward(self, \n                         current_data: pd.Series,\n                         next_data: pd.Series, \n                         position_change: float,\n                         confidence: float,\n                         trade_cost: float) -> float:\n        \"\"\"Calculate reward using Gary×Taleb principles.\n        \n        Args:\n            current_data: Current market data\n            next_data: Next period market data\n            position_change: Position change taken\n            confidence: Action confidence\n            trade_cost: Cost of trade\n            \n        Returns:\n            Calculated reward\n        \"\"\"\n        # Base PnL reward\n        price_return = (next_data['close'] - current_data['close']) / current_data['close']\n        position_return = self.state.position * price_return\n        base_reward = position_return * self.config.reward_scaling\n        \n        # Gary's DPI reward component\n        dpi_reward = self._calculate_gary_dpi_reward(current_data, next_data, position_change, confidence)\n        \n        # Taleb's antifragility reward component\n        antifragile_reward = self._calculate_taleb_antifragile_reward(current_data, next_data, position_change)\n        \n        # Risk management penalty\n        risk_penalty = self._calculate_risk_penalty()\n        \n        # Transaction cost penalty\n        cost_penalty = -trade_cost * self.config.reward_scaling\n        \n        # Combine all reward components\n        total_reward = (\n            base_reward +\n            dpi_reward * self.config.dpi_reward_weight +\n            antifragile_reward * self.config.antifragile_reward_weight +\n            risk_penalty +\n            cost_penalty\n        )\n        \n        # Update episode statistics\n        self.episode_stats['gary_dpi_rewards'] += dpi_reward\n        self.episode_stats['taleb_antifragile_rewards'] += antifragile_reward\n        \n        return total_reward\n        \n    def _calculate_gary_dpi_reward(self, \n                                  current_data: pd.Series,\n                                  next_data: pd.Series,\n                                  position_change: float,\n                                  confidence: float) -> float:\n        \"\"\"Calculate Gary's Dynamic Position Intelligence reward.\n        \n        Rewards actions that align with momentum, volume, and technical patterns.\n        \"\"\"\n        # Momentum alignment reward\n        price_momentum = current_data['price_momentum']\n        momentum_alignment = position_change * np.sign(price_momentum) * abs(price_momentum)\n        \n        # Volume confirmation reward\n        volume_pressure = current_data['volume_pressure']\n        volume_reward = confidence * volume_pressure if volume_pressure > 0 else 0\n        \n        # Technical indicator alignment\n        rsi = current_data['rsi_14']\n        rsi_signal = 1 if rsi < 30 else (-1 if rsi > 70 else 0)  # Oversold/Overbought\n        rsi_reward = position_change * rsi_signal * 0.5\n        \n        # Volatility regime reward (Gary likes controlled volatility)\n        vol_regime = current_data['volatility_regime']\n        vol_reward = confidence * (1 - abs(vol_regime - 1)) if vol_regime > 0 else 0\n        \n        total_dpi_reward = momentum_alignment + volume_reward + rsi_reward + vol_reward\n        \n        return total_dpi_reward * 10  # Scale factor\n        \n    def _calculate_taleb_antifragile_reward(self,\n                                          current_data: pd.Series,\n                                          next_data: pd.Series,\n                                          position_change: float) -> float:\n        \"\"\"Calculate Taleb's antifragility reward.\n        \n        Rewards strategies that benefit from volatility and have asymmetric payoffs.\n        \"\"\"\n        # Volatility benefit reward (antifragile systems benefit from volatility)\n        volatility = current_data['volatility_20']\n        vol_benefit = abs(position_change) * volatility * self.config.volatility_opportunity_weight\n        \n        # Asymmetric payoff reward (limited downside, unlimited upside)\n        tail_risk = current_data['tail_risk']  # 5% VaR (negative)\n        upside_capture = current_data['upside_capture']  # 95% upside\n        \n        # Reward positions that capture upside while limiting downside\n        if position_change > 0:  # Long position\n            asymmetry_reward = upside_capture + abs(tail_risk)  # Both positive contribution\n        elif position_change < 0:  # Short position\n            asymmetry_reward = abs(tail_risk) - upside_capture  # Inverted for short\n        else:\n            asymmetry_reward = 0\n        \n        # Convexity reward (benefits from extreme moves)\n        kurtosis = current_data.get('kurtosis', 0)\n        convexity_reward = abs(position_change) * max(0, kurtosis) * 0.1\n        \n        # Black swan preparation (reward diversification and optionality)\n        position_flexibility = 1 - abs(self.state.position)  # Reward keeping some powder dry\n        flexibility_reward = position_flexibility * 0.5\n        \n        total_antifragile_reward = vol_benefit + asymmetry_reward + convexity_reward + flexibility_reward\n        \n        return total_antifragile_reward * 5  # Scale factor\n        \n    def _calculate_risk_penalty(self) -> float:\n        \"\"\"Calculate risk management penalties.\"\"\"\n        penalty = 0.0\n        \n        # Drawdown penalty\n        if self.episode_stats['max_drawdown'] > 0.1:  # 10% drawdown threshold\n            penalty -= (self.episode_stats['max_drawdown'] - 0.1) * 50\n            \n        # Excessive position penalty\n        if abs(self.state.position) > 0.8:  # 80% position threshold\n            penalty -= (abs(self.state.position) - 0.8) * 20\n            \n        # Leverage penalty (if using leverage)\n        if self.config.leverage > 1:\n            penalty -= (self.config.leverage - 1) * abs(self.state.position) * 10\n            \n        return penalty\n        \n    def _get_observation(self) -> np.ndarray:\n        \"\"\"Get current observation.\n        \n        Returns:\n            Observation array [lookback_window, features]\n        \"\"\"\n        # Get lookback window of market data\n        start_idx = max(0, self.current_step - self.config.lookback_window + 1)\n        end_idx = self.current_step + 1\n        \n        market_window = self.market_data.iloc[start_idx:end_idx].copy()\n        \n        # Select relevant features (excluding OHLCV base columns)\n        feature_columns = [col for col in market_window.columns \n                          if col not in ['open', 'high', 'low', 'close', 'volume']]\n        \n        market_features = market_window[feature_columns].values\n        \n        # Add portfolio state features\n        portfolio_features = np.array([\n            self.state.position,\n            self.state.cash / self.config.initial_capital,\n            self.state.unrealized_pnl / self.config.initial_capital,\n            self.state.portfolio_value / self.config.initial_capital,\n            self.episode_stats['max_drawdown'],\n            len(self.action_history) / self.config.max_episode_steps,  # Episode progress\n            self.state.volatility,\n            self.state.volume_pressure,\n            self.episode_stats['trades'] / 100,  # Normalized trade count\n            (self.episode_stats['transaction_costs'] / \n             max(self.state.portfolio_value, 1))  # Cost ratio\n        ])\n        \n        # Ensure we have the right window size\n        if len(market_features) < self.config.lookback_window:\n            # Pad with first available values if we don't have enough history\n            padding_needed = self.config.lookback_window - len(market_features)\n            if len(market_features) > 0:\n                padding = np.tile(market_features[0], (padding_needed, 1))\n                market_features = np.vstack([padding, market_features])\n            else:\n                # Fallback: zeros\n                n_features = len(feature_columns)\n                market_features = np.zeros((self.config.lookback_window, n_features))\n        \n        # Add portfolio features to each timestep\n        portfolio_features_expanded = np.tile(portfolio_features, \n                                            (market_features.shape[0], 1))\n        \n        # Combine market and portfolio features\n        observation = np.hstack([market_features, portfolio_features_expanded])\n        \n        # Normalize observation (simple standardization)\n        observation = np.nan_to_num(observation, nan=0.0, posinf=1.0, neginf=-1.0)\n        \n        # Update state with current features\n        if len(observation) > 0:\n            self.state.market_features = observation[-1]  # Latest features\n        \n        return observation.astype(np.float32)\n        \n    def get_episode_metrics(self) -> Dict[str, float]:\n        \"\"\"Get comprehensive episode performance metrics.\"\"\"\n        if len(self.portfolio_history) < 2:\n            return {}\n            \n        portfolio_values = np.array(self.portfolio_history)\n        returns = np.diff(portfolio_values) / portfolio_values[:-1]\n        \n        total_return = (portfolio_values[-1] - portfolio_values[0]) / portfolio_values[0]\n        \n        # Sharpe ratio (assuming daily data)\n        if len(returns) > 1 and np.std(returns) > 0:\n            sharpe_ratio = np.mean(returns) / np.std(returns) * np.sqrt(252)\n        else:\n            sharpe_ratio = 0.0\n            \n        # Win rate\n        if self.episode_stats['trades'] > 0:\n            win_rate = self.episode_stats['winning_trades'] / self.episode_stats['trades']\n        else:\n            win_rate = 0.0\n            \n        # Maximum consecutive losses\n        consecutive_losses = 0\n        max_consecutive_losses = 0\n        for ret in returns:\n            if ret < 0:\n                consecutive_losses += 1\n                max_consecutive_losses = max(max_consecutive_losses, consecutive_losses)\n            else:\n                consecutive_losses = 0\n                \n        return {\n            'total_return': total_return,\n            'sharpe_ratio': sharpe_ratio,\n            'max_drawdown': self.episode_stats['max_drawdown'],\n            'win_rate': win_rate,\n            'total_trades': self.episode_stats['trades'],\n            'transaction_costs': self.episode_stats['transaction_costs'],\n            'final_portfolio_value': portfolio_values[-1],\n            'max_consecutive_losses': max_consecutive_losses,\n            'gary_dpi_contribution': self.episode_stats['gary_dpi_rewards'],\n            'taleb_antifragile_contribution': self.episode_stats['taleb_antifragile_rewards'],\n            'avg_position': np.mean(self.position_history),\n            'position_volatility': np.std(self.position_history)\n        }"