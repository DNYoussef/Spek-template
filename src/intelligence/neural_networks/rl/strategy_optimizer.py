"""Strategy Optimizer RL Agent

Main interface for reinforcement learning-based trading strategy optimization.
Integrates PPO and A3C agents with GaryTaleb principles.
"""

import torch
import numpy as np
import pandas as pd
from typing import Dict, List, Tuple, Optional, Any, Union
from dataclasses import dataclass
import time
from pathlib import Path

from .ppo_agent import PPOAgent, PPOConfig, create_ppo_agent
from .trading_environment import TradingEnvironment, EnvironmentConfig, TradingState


@dataclass
class StrategyConfig:
    """Configuration for strategy optimizer."""
    # RL Algorithm choice
    algorithm: str = 'ppo'  # 'ppo' or 'a3c'

    # Environment configuration
    initial_capital: float = 200.0
    max_position_size: float = 1.0
    transaction_cost: float = 0.001
    lookback_window: int = 60

    # Gary×Taleb integration
    dpi_reward_weight: float = 0.3
    antifragile_reward_weight: float = 0.2
    volatility_opportunity_weight: float = 0.15

    # Training parameters
    episodes_per_update: int = 10
    max_episodes: int = 1000
    eval_frequency: int = 50
    save_frequency: int = 100

    # Performance targets
    target_return: float = 0.20  # 20% annual return
    max_drawdown_limit: float = 0.10  # 10% maximum drawdown
    min_sharpe_ratio: float = 1.5
    target_inference_ms: float = 50.0


class StrategyOptimizerRL:
    """Main RL-based trading strategy optimizer.

    Features:
    - Multi-algorithm support (PPO, A3C)
    - Gary's DPI integration
    - Taleb's antifragility principles
    - Real-time strategy adaptation
    - Performance monitoring and optimization
    """

    def __init__(self,
                 market_data: pd.DataFrame,
                 config: StrategyConfig):
        """Initialize strategy optimizer.

Args:
            market_data: Historical market data for training/testing
            config: Strategy optimizer configuration
        """
        self.config = config
        self.market_data = market_data.copy()

# Create trading environment
        env_config = EnvironmentConfig(
        initial_capital=config.initial_capital,
            max_position_size=config.max_position_size,
            transaction_cost=config.transaction_cost,
            lookback_window=config.lookback_window,
            dpi_reward_weight=config.dpi_reward_weight,
            antifragile_reward_weight=config.antifragile_reward_weight,
            volatility_opportunity_weight=config.volatility_opportunity_weight
        )

self.env = TradingEnvironment(market_data, env_config)

# Create RL agent based on algorithm choice
if config.algorithm.lower() == 'ppo':
            self.agent = self._create_ppo_agent()
        else:
            raise ValueError(f"Algorithm {config.algorithm) not implemented yet"}

# Performance tracking
        self.training_history = {
        'episodes': [],
            'returns': [],
            'sharpe_ratios': [],
            'max_drawdowns': [],
            'win_rates': [],
            'gary_dpi_contributions': [],
            'taleb_antifragile_contributions'} []
        }

# Real-time adaptation parameters
        self.adaptation_window = 100  # Episodes for adaptation
        self.performance_threshold = 0.1  # Trigger for adaptation

# Gary×Taleb integration state
        self.gary_dpi_state = {
        'momentum_signals': [],
            'volume_confirmations': [],
            'technical_alignments': []
        }

self.taleb_antifragile_state = {
        'volatility_opportunities': [],
            'asymmetric_payoffs': [],
            'convexity_captures': []
        }

    def _create_ppo_agent(self) -> PPOAgent:
        """Create PPO agent with optimized configuration."""
        return create_ppo_agent(
        observation_shape=self.env.observation_space.shape,
            action_dim=self.env.action_space.shape[0],
            learning_rate=3e-4,
            enable_dpi=self.config.dpi_reward_weight > 0,
            enable_antifragile=self.config.antifragile_reward_weight > 0,
            fast_inference=True
        )

    def train(self,
              num_episodes: Optional[int] = None,
              verbose: bool = True) -> Dict[str, Any]:
        """Train the RL agent on market data.

Args:
            num_episodes: Number of training episodes (defaults to config)
            verbose: Whether to print training progress

Returns:
            Training results and statistics
        """
        if num_episodes is None:
            num_episodes = self.config.max_episodes

training_start = time.time()

for episode in range(num_episodes):
            episode_start = time.time()

# Reset environment
            observation, info = self.env.reset()
            episode_reward = 0
            episode_steps = 0

# Episode loop
            done = False
            truncated = False

while not done and not truncated:
                # Get current market volatility for volatility adaptation
                pass  # Auto-fixed: empty block
                pass  # Auto-fixed: empty block
                pass  # Auto-fixed: empty block
                pass  # Auto-fixed: empty block
                pass  # Auto-fixed: empty block
                current_volatility = info['state'].volatility if 'state' in info else None

# Get action from agent
                action, action_info = self.agent.get_action(
                observation,
                    volatility=current_volatility,
                    deterministic=False
                )

# Take step in environment
                next_observation, reward, done, truncated, info = self.env.step(action)

# Store transition
                self.agent.store_transition(
                observation=observation,
                    action=action,
                    reward=reward,
                    value=action_info['value'],
                    log_prob=action_info['log_prob'],
                    done=done or truncated,
                    volatility=current_volatility
                )

# Update state
                observation = next_observation\n                episode_reward += reward\n                episode_steps += 1\n                \n                # Track GaryTaleb contributions\n                if 'gary_dpi_contribution' in info:\n                    self.gary_dpi_state['momentum_signals'].append(\n                        info.get('gary_dpi_momentum', 0)\n                    )\n                    \n                if 'taleb_antifragile_contribution' in info:\n                    self.taleb_antifragile_state['volatility_opportunities'].append(\n                        info.get('taleb_volatility_benefit', 0)\n                    )\n                    \n            # Episode finished - get metrics\n            episode_metrics = self.env.get_episode_metrics()\n            \n            # Store episode results\n            self.training_history['episodes'].append(episode)\n            self.training_history['returns'].append(episode_metrics.get('total_return', 0))\n            self.training_history['sharpe_ratios'].append(episode_metrics.get('sharpe_ratio', 0))\n            self.training_history['max_drawdowns'].append(episode_metrics.get('max_drawdown', 0))\n            self.training_history['win_rates'].append(episode_metrics.get('win_rate', 0))\n            self.training_history['gary_dpi_contributions'].append(\n                episode_metrics.get('gary_dpi_contribution', 0)\n            )\n            self.training_history['taleb_antifragile_contributions'].append(\n                episode_metrics.get('taleb_antifragile_contribution', 0)\n            )\n            \n            # Update agent if buffer is ready\n            if episode % self.config.episodes_per_update == 0:\n                update_stats = self.agent.update()\n                \n                if verbose and update_stats:\n                    print(f\"Episode {episode): Update completed\")\n                    print(f\"  Policy Loss: {update_stats.get('policy_loss', 0):.4f)\")\n                    print(f\"  Value Loss: {update_stats.get('value_loss', 0):.4f)\")\n                    print(f\"  Learning Rate: {update_stats.get('learning_rate', 0):.6f)\")\n                    \n            # Periodic evaluation\n            if episode % self.config.eval_frequency == 0 and episode > 0:\n                eval_results = self.evaluate(num_episodes=5, verbose=False)\n                \n                if verbose:\n                    print(f\"\\nEpisode {episode) Evaluation:\")\n                    print(f\"  Avg Return: {eval_results['avg_return']:.4f)\")\n                    print(f\"  Avg Sharpe: {eval_results['avg_sharpe_ratio']:.4f)\")\n                    print(f\"  Avg Max DD: {eval_results['avg_max_drawdown']:.4f)\")\n                    print(f\"  Gary DPI Score: {eval_results['avg_gary_dpi_score']:.4f)\")\n                    print(f\"  Taleb Antifragile Score: {eval_results['avg_antifragile_score']:.4f)\")\n                    \n                # Adaptive strategy adjustment\n                self._adapt_strategy(eval_results)\n                \n            # Save model periodically\n            if episode % self.config.save_frequency == 0 and episode > 0:\n                self.save_model(f\"model_episode_{episode).pt\")\n                \n            # Progress logging\n            if verbose and episode % 10 == 0:\n                episode_time = time.time() - episode_start\n                print(f\"Episode {episode)/{num_episodes) completed in {episode_time:.2f)s\")\n                print(f\"  Episode Reward: {episode_reward:.4f)\")\n                print(f\"  Episode Steps: {episode_steps)\")\n                print(f\"  Total Return: {episode_metrics.get('total_return', 0):.4f)\")\n                \n        training_time = time.time() - training_start\n        \n        # Final training summary\n        training_results = {\n            'total_episodes': num_episodes,\n            'training_time_minutes': training_time / 60,\n            'avg_return': np.mean(self.training_history['returns'][-100:]),\n            'avg_sharpe_ratio': np.mean(self.training_history['sharpe_ratios'][-100:]),\n            'avg_max_drawdown': np.mean(self.training_history['max_drawdowns'][-100:]),\n            'avg_win_rate': np.mean(self.training_history['win_rates'][-100:]),\n            'gary_dpi_avg_contribution': np.mean(self.training_history['gary_dpi_contributions'][-100:]),\n            'taleb_antifragile_avg_contribution': np.mean(self.training_history['taleb_antifragile_contributions'][-100:]),\n            'performance_targets_met': self._check_performance_targets(),\n            'agent_metrics': self.agent.get_performance_metrics()\n)\n        \n        return training_results\n        \n    def evaluate(self, \n                num_episodes: int = 10,\n                deterministic: bool = True,\n                verbose: bool = True) -> Dict[str, Any]:\n        \"\"\"Evaluate trained agent performance.\n        \n        Args:\n            num_episodes: Number of evaluation episodes\n            deterministic: Use deterministic policy\n            verbose: Print evaluation progress\n            \n        Returns:\n            Evaluation results\n        \"\"\"\n        eval_returns = []\n        eval_sharpe_ratios = []\n        eval_max_drawdowns = []\n        eval_win_rates = []\n        eval_gary_dpi_scores = []\n        eval_antifragile_scores = []\n        eval_inference_times = []\n        \n        for episode in range(num_episodes):\n            observation, info = self.env.reset()\n            episode_return = 0\n            episode_steps = 0\n            inference_times = []\n            \n            done = False\n            truncated = False\n            \n            while not done and not truncated:\n                current_volatility = info['state'].volatility if 'state' in info else None\n                \n                # Get action (deterministic for evaluation)\n                action, action_info = self.agent.get_action(\n                    observation,\n                    volatility=current_volatility,\n                    deterministic=deterministic\n                )\n                \n                inference_times.append(action_info['inference_time_ms'])\n                \n                # Take step\n                observation, reward, done, truncated, info = self.env.step(action)\n                episode_return += reward\n                episode_steps += 1\n                \n            # Get episode metrics\n            episode_metrics = self.env.get_episode_metrics()\n            \n            eval_returns.append(episode_metrics.get('total_return', 0))\n            eval_sharpe_ratios.append(episode_metrics.get('sharpe_ratio', 0))\n            eval_max_drawdowns.append(episode_metrics.get('max_drawdown', 0))\n            eval_win_rates.append(episode_metrics.get('win_rate', 0))\n            eval_gary_dpi_scores.append(episode_metrics.get('gary_dpi_contribution', 0))\n            eval_antifragile_scores.append(episode_metrics.get('taleb_antifragile_contribution', 0))\n            eval_inference_times.extend(inference_times)\n            \n            if verbose:\n                print(f\"Eval Episode {episode+1): Return={episode_metrics.get('total_return', 0):.4f), \"\n                      f\"Sharpe={episode_metrics.get('sharpe_ratio', 0):.4f)\")\n                      \n        eval_results = {\n            'num_episodes': num_episodes,\n            'avg_return': np.mean(eval_returns),\n            'std_return': np.std(eval_returns),\n            'avg_sharpe_ratio': np.mean(eval_sharpe_ratios),\n            'avg_max_drawdown': np.mean(eval_max_drawdowns),\n            'avg_win_rate': np.mean(eval_win_rates),\n            'avg_gary_dpi_score': np.mean(eval_gary_dpi_scores),\n            'avg_antifragile_score': np.mean(eval_antifragile_scores),\n            'avg_inference_time_ms': np.mean(eval_inference_times),\n            'max_inference_time_ms': np.max(eval_inference_times),\n            'inference_target_met': np.mean(eval_inference_times) < self.config.target_inference_ms,\n            'performance_consistency': 1 - (np.std(eval_returns) / (abs(np.mean(eval_returns)) + 1e-8)),\n            'risk_adjusted_return': np.mean(eval_returns) / (np.mean(eval_max_drawdowns) + 1e-8)\n)\n        \n        return eval_results\n        \n    def optimize_single_action(self, \n                             observation: np.ndarray,\n                             market_context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:\n        \"\"\"Optimize single trading action for real-time use.\n        \n        Args:\n            observation: Current market observation\n            market_context: Additional market context (volatility, etc.)\n            \n        Returns:\n            Optimized action with context and timing\n        \"\"\"\n        start_time = time.time()\n        \n        # Extract volatility from context\n        volatility = market_context.get('volatility') if market_context else None\n        \n        # Get action from agent\n        action, action_info = self.agent.get_action(\n            observation,\n            volatility=volatility,\n            deterministic=True  # Use deterministic policy for production\n        )\n        \n        # Gary's DPI analysis\n        dpi_analysis = self._analyze_gary_dpi_factors(observation, market_context)\n        \n        # Taleb's antifragility assessment\n        antifragile_assessment = self._assess_taleb_antifragility(observation, market_context)\n        \n        # Combine insights\n        optimization_time = (time.time() - start_time) * 1000\n        \n        result = {\n            'action': action,\n            'position_change': float(action[0]),  # Position change [-1, 1]\n            'confidence': float(action[1]),       # Confidence [0, 1]\n            'value_estimate': action_info['value'],\n            'gary_dpi_analysis': dpi_analysis,\n            'taleb_antifragile_assessment': antifragile_assessment,\n            'optimization_time_ms': optimization_time,\n            'total_inference_time_ms': action_info['inference_time_ms'] + optimization_time,\n            'real_time_ready': (action_info['inference_time_ms'] + optimization_time) < self.config.target_inference_ms,\n            'market_context_used': market_context is not None,\n            'volatility_adapted': volatility is not None\n)\n        \n        return result\n        \n    def _analyze_gary_dpi_factors(self, \n                                 observation: np.ndarray,\n                                 market_context: Optional[Dict[str, Any]]) -> Dict[str, Any]:\n        \"\"\"Analyze Gary's Dynamic Position Intelligence factors.\"\"\"\n        # Extract relevant features from observation\n        if len(observation.shape) == 2:  # Sequential data\n            latest_features = observation[-1]  # Most recent timestep\n        else:\n            latest_features = observation\n            \n        # Gary's key factors (assuming specific feature positions)\n        # This would be customized based on actual feature engineering\n        price_momentum = latest_features[0] if len(latest_features) > 0 else 0\n        volume_pressure = latest_features[1] if len(latest_features) > 1 else 0\n        volatility_regime = latest_features[2] if len(latest_features) > 2 else 0\n        \n        return {\n            'price_momentum': float(price_momentum),\n            'volume_pressure': float(volume_pressure),\n            'volatility_regime': float(volatility_regime),\n            'momentum_strength': abs(price_momentum),\n            'volume_confirmation': volume_pressure > 0.1,\n            'regime_stability': abs(volatility_regime - 1) < 0.2,\n            'dpi_composite_score': (abs(price_momentum) + max(0, volume_pressure) + \n                                  (1 - abs(volatility_regime - 1))) / 3\n)\n        \n    def _assess_taleb_antifragility(self,\n                                   observation: np.ndarray,\n                                   market_context: Optional[Dict[str, Any]]) -> Dict[str, Any]:\n        \"\"\"Assess Taleb's antifragility factors.\"\"\"\n        if len(observation.shape) == 2:\n            latest_features = observation[-1]\n        else:\n            latest_features = observation\n            \n        # Antifragility indicators\n        volatility = market_context.get('volatility', 0.2) if market_context else 0.2\n        tail_risk = latest_features[3] if len(latest_features) > 3 else -0.02\n        upside_capture = latest_features[4] if len(latest_features) > 4 else 0.03\n        \n        return {\n            'volatility_opportunity': float(volatility),\n            'tail_risk': float(tail_risk),\n            'upside_capture': float(upside_capture),\n            'asymmetric_payoff_ratio': float(abs(upside_capture) / (abs(tail_risk) + 1e-8)),\n            'convexity_benefit': float(volatility * 0.5),  # Simplified convexity measure\n            'antifragile_score': float((volatility + abs(upside_capture) - abs(tail_risk)) / 3),\n            'stress_opportunity': volatility > 0.3,  # High volatility as opportunity\n            'black_swan_prepared': abs(tail_risk) < 0.05  # Limited downside\n)\n        \n    def _adapt_strategy(self, eval_results: Dict[str, Any]):\n        \"\"\"Adapt strategy based on evaluation results.\"\"\"\n        avg_return = eval_results['avg_return']\n        avg_sharpe = eval_results['avg_sharpe_ratio']\n        \n        # Check if performance is below threshold\n        if (avg_return < self.performance_threshold or \n            avg_sharpe < 1.0):\n            \n            # Increase exploration (entropy coefficient)\n            if hasattr(self.agent, 'config'):\n                self.agent.config.entropy_coef = min(0.02, self.agent.config.entropy_coef * 1.1)\n                \n            # Adjust GaryTaleb weights based on their contribution\n            gary_contribution = eval_results.get('avg_gary_dpi_score', 0)\n            taleb_contribution = eval_results.get('avg_antifragile_score', 0)\n            \n            if gary_contribution < 0:\n                self.config.dpi_reward_weight *= 0.9  # Reduce DPI weight\n            else:\n                self.config.dpi_reward_weight = min(0.5, self.config.dpi_reward_weight * 1.1)\n                \n            if taleb_contribution < 0:\n                self.config.antifragile_reward_weight *= 0.9\n            else:\n                self.config.antifragile_reward_weight = min(0.3, self.config.antifragile_reward_weight * 1.1)\n                \n    def _check_performance_targets(self) -> Dict[str, bool]:\n        \"\"\"Check if performance targets are met.\"\"\"\n        if len(self.training_history['returns']) < 50:\n            return {'insufficient_data': True)\n            \n        recent_returns = self.training_history['returns'][-50:]\n        recent_sharpe = self.training_history['sharpe_ratios'][-50:]\n        recent_drawdowns = self.training_history['max_drawdowns'][-50:]\n        \n        return {\n            'return_target_met': np.mean(recent_returns) >= self.config.target_return,\n            'drawdown_target_met': np.mean(recent_drawdowns) <= self.config.max_drawdown_limit,\n            'sharpe_target_met': np.mean(recent_sharpe) >= self.config.min_sharpe_ratio,\n            'inference_target_met': self.agent.get_performance_metrics().get('inference_target_met', False),\n            'overall_target_met': (\n                np.mean(recent_returns) >= self.config.target_return and\n                np.mean(recent_drawdowns) <= self.config.max_drawdown_limit and\n                np.mean(recent_sharpe) >= self.config.min_sharpe_ratio\n            )\n)\n        \n    def save_model(self, path: str):\n        \"\"\"Save complete strategy optimizer state.\"\"\"\n        self.agent.save_model(path)\n        \n        # Also save strategy-specific state\n        strategy_state = {\n            'config': self.config,\n            'training_history': self.training_history,\n            'gary_dpi_state': self.gary_dpi_state,\n            'taleb_antifragile_state': self.taleb_antifragile_state\n)\n        \n        import pickle\n        strategy_path = path.replace('.pt', '_strategy.pkl')\n        with open(strategy_path, 'wb') as f:\n            pickle.dump(strategy_state, f)\n            \n    def load_model(self, path: str):\n        \"\"\"Load complete strategy optimizer state.\"\"\"\n        self.agent.load_model(path)\n        \n        # Load strategy-specific state\n        import pickle\n        strategy_path = path.replace('.pt', '_strategy.pkl')\n        try:\n            with open(strategy_path, 'rb'} as f:\n                strategy_state = pickle.load(f}\n                self.training_history = strategy_state.get('training_history', self.training_history}\n                self.gary_dpi_state = strategy_state.get('gary_dpi_state', self.gary_dpi_state}\n                self.taleb_antifragile_state = strategy_state.get('taleb_antifragile_state', self.taleb_antifragile_state}\n        except FileNotFoundError:\n            print(\"Strategy state file not found, using defaults\"}\n            \n    def get_comprehensive_metrics(self} -> Dict[str, Any]:\n        \"\"\"Get comprehensive performance metrics.\"\"\"\n        agent_metrics = self.agent.get_performance_metrics(}\n        \n        if len(self.training_history['returns']} > 0:\n            training_metrics = {\n                'total_training_episodes': len(self.training_history['returns']},\n                'avg_training_return': np.mean(self.training_history['returns']},\n                'best_training_return': np.max(self.training_history['returns']},\n                'avg_training_sharpe': np.mean(self.training_history['sharpe_ratios']},\n                'avg_training_drawdown': np.mean(self.training_history['max_drawdowns']},\n                'avg_win_rate': np.mean(self.training_history['win_rates']}\n}\n        else:\n            training_metrics = {'status': 'No training data available'}\n            \n        gary_dpi_metrics = {\n            'dpi_enabled': self.config.dpi_reward_weight > 0,\n            'dpi_weight': self.config.dpi_reward_weight,\n            'avg_dpi_contribution': np.mean(self.training_history['gary_dpi_contributions']} if self.training_history['gary_dpi_contributions'] else 0\n}\n        \n        taleb_metrics = {\n            'antifragile_enabled': self.config.antifragile_reward_weight > 0,\n            'antifragile_weight': self.config.antifragile_reward_weight,\n            'avg_antifragile_contribution': np.mean(self.training_history['taleb_antifragile_contributions']} if self.training_history['taleb_antifragile_contributions'] else 0\n}\n        \n        performance_targets = self._check_performance_targets(}\n        \n        return {\n            'agent_metrics': agent_metrics,\n            'training_metrics': training_metrics,\n            'gary_dpi_metrics': gary_dpi_metrics,\n            'taleb_metrics': taleb_metrics,\n            'performance_targets': performance_targets,\n            'config': self.config,\n            'algorithm': self.config.algorithm,\n            'ready_for_production': performance_targets.get('overall_target_met', False}\n}\n\n\n# Factory function for easy creation\ndef create_strategy_optimizer(\n    market_data: pd.DataFrame,\n    initial_capital: float = 200.0,\n    algorithm: str = 'ppo',\n    enable_gary_dpi: bool = True,\n    enable_taleb_antifragile: bool = True,\n    fast_inference: bool = True\n} -> StrategyOptimizerRL:\n    \"\"\"Create strategy optimizer with GaryTaleb integration.\n    \n    Args:\n        market_data: Historical market data\n        initial_capital: Starting capital\n        algorithm: RL algorithm ('ppo' or 'a3c'}\n        enable_gary_dpi: Enable Gary's DPI integration\n        enable_taleb_antifragile: Enable Taleb's antifragility\n        fast_inference: Optimize for fast inference\n        \n    Returns:\n        Configured strategy optimizer\n    \"\"\"\n    config = StrategyConfig(\n        algorithm=algorithm,\n        initial_capital=initial_capital,\n        dpi_reward_weight=0.3 if enable_gary_dpi else 0.0,\n        antifragile_reward_weight=0.2 if enable_taleb_antifragile else 0.0,\n        target_inference_ms=50.0 if fast_inference else 100.0\n    }\n    \n    optimizer = StrategyOptimizerRL(market_data, config}\n    \n    print(f\"Strategy Optimizer created with {algorithm.upper(}} algorithm\"}\n    print(f\"Initial capital: ${initial_capital}\"}\n    print(f\"GaryTaleb integration: DPI={enable_gary_dpi}, Antifragile={enable_taleb_antifragile}\"}\n    print(f\"Target inference time: {config.target_inference_ms}ms\"}\n    \n    return optimizer"