"""Reinforcement Learning Module for Trading Strategy Optimization

PPO and A3C agents for dynamic strategy optimization with Gary×Taleb integration.
Optimized for real-time trading decisions with continuous learning.
"""

from .strategy_optimizer import StrategyOptimizerRL
from .ppo_agent import PPOAgent
from .a3c_agent import A3CAgent
from .trading_environment import TradingEnvironment

__all__ = ['StrategyOptimizerRL', 'PPOAgent', 'A3CAgent', 'TradingEnvironment']