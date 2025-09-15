"""PPO Agent for Trading Strategy Optimization

Proximal Policy Optimization agent optimized for financial trading.
Includes GaryTaleb integration and fast inference capabilities.
"""

import torch
import torch.nn as nn
import torch.nn.functional as F
import torch.optim as optim
from torch.distributions import Normal
import numpy as np
from typing import Dict, List, Tuple, Optional, Any
from dataclasses import dataclass
import time
from collections import deque
import random


@dataclass
class PPOConfig:
    """PPO agent configuration."""
    # Network architecture
    hidden_size: int = 256
    num_layers: int = 3
    activation: str = 'relu'

    # PPO hyperparameters
    learning_rate: float = 3e-4
    gamma: float = 0.99  # Discount factor
    gae_lambda: float = 0.95  # GAE parameter
    clip_ratio: float = 0.2  # PPO clipping parameter
    value_loss_coef: float = 0.5
    entropy_coef: float = 0.01
    max_grad_norm: float = 1.0

    # Training parameters
    batch_size: int = 256
    mini_batch_size: int = 64
    ppo_epochs: int = 4
    buffer_size: int = 10000
    update_frequency: int = 2048

    # Gary×Taleb integration
    dpi_feature_weight: float = 0.3
    antifragile_exploration_weight: float = 0.2
    volatility_adaptation: bool = True

    # Performance optimization
    use_lstm: bool = True
    compile_model: bool = True
    target_inference_ms: float = 50.0


class ActorCritic(nn.Module):
    """Actor-Critic network for PPO with financial enhancements."""

    def __init__(self,
                 observation_shape: Tuple[int, ...],
                 action_dim: int,
                 config: PPOConfig):
        """Initialize Actor-Critic network.

        Args:
            observation_shape: Shape of observation space
            action_dim: Dimension of action space
            config: PPO configuration
        """
        super(ActorCritic, self).__init__()

        self.config = config

        # Calculate input size
        if len(observation_shape) == 2:  # Sequential data
            self.sequence_length, self.feature_dim = observation_shape
            self.use_sequential = True
        else:
            self.feature_dim = np.prod(observation_shape)
            self.sequence_length = 1
            self.use_sequential = False

        # Feature extraction layers
        if self.use_sequential and config.use_lstm:
            self.feature_extractor = nn.LSTM(
                input_size=self.feature_dim,
                hidden_size=config.hidden_size,
                num_layers=2,
                batch_first=True,
                dropout=0.1
            )
            feature_output_size = config.hidden_size
        else:
            # Dense feature extraction
            layers = []
            input_size = self.feature_dim if not self.use_sequential else self.sequence_length * self.feature_dim

            for i in range(config.num_layers):
                output_size = config.hidden_size // (2 ** i) if i > 0 else config.hidden_size
                layers.extend([
                    nn.Linear(input_size, output_size),
                    self._get_activation(config.activation),
                    nn.Dropout(0.1)
                ])
                input_size = output_size

            self.feature_extractor = nn.Sequential(*layers)
            feature_output_size = input_size

        # Gary's DPI integration layer
        self.dpi_processor = nn.Sequential(
            nn.Linear(feature_output_size, feature_output_size // 2),
            nn.ReLU(),
            nn.Linear(feature_output_size // 2, feature_output_size),
            nn.Sigmoid()
        )

        # Taleb's antifragility enhancement
        self.antifragile_gate = nn.Sequential(
            nn.Linear(feature_output_size, feature_output_size // 4),
            nn.Tanh(),
            nn.Linear(feature_output_size // 4, feature_output_size),
            nn.Sigmoid()
        )

        # Policy head (actor)
        self.actor_mean = nn.Sequential(
            nn.Linear(feature_output_size, config.hidden_size // 2),
            nn.ReLU(),
            nn.Linear(config.hidden_size // 2, action_dim),
            nn.Tanh()  # Actions in [-1, 1]
        )

        # Policy standard deviation (learnable)
        self.actor_std = nn.Parameter(torch.ones(action_dim) * 0.5)

        # Value head (critic)
        self.critic = nn.Sequential(
            nn.Linear(feature_output_size, config.hidden_size // 2),
            nn.ReLU(),
            nn.Linear(config.hidden_size // 2, config.hidden_size // 4),
            nn.ReLU(),
            nn.Linear(config.hidden_size // 4, 1)
        )

        # Volatility adaptation network
        if config.volatility_adaptation:
            self.volatility_adapter = nn.Sequential(
                nn.Linear(1, config.hidden_size // 8),  # Single volatility input
                nn.ReLU(),
                nn.Linear(config.hidden_size // 8, feature_output_size),
                nn.Sigmoid()
            )
        else:
            self.volatility_adapter = None

        # Initialize weights
        self._init_weights()

    def _get_activation(self, activation: str) -> nn.Module:
        \"\"\"Get activation function.\"\"\"\n        if activation == 'relu':\n            return nn.ReLU()\n        elif activation == 'tanh':\n            return nn.Tanh()\n        elif activation == 'elu':\n            return nn.ELU()\n        else:\n            return nn.ReLU()\n            \n    def _init_weights(self):\n        \"\"\"Initialize network weights.\"\"\"\n        for module in self.modules():\n            if isinstance(module, nn.Linear):\n                nn.init.orthogonal_(module.weight, gain=np.sqrt(2))\n                nn.init.zeros_(module.bias)\n            elif isinstance(module, nn.LSTM):\n                for name, param in module.named_parameters():\n                    if 'weight' in name:\n                        nn.init.orthogonal_(param)\n                    elif 'bias' in name:\n                        nn.init.zeros_(param)\n                        \n    def forward(self, \n                observations: torch.Tensor,\n                volatility: Optional[torch.Tensor] = None) -> Tuple[torch.Tensor, torch.Tensor, torch.Tensor]:\n        \"\"\"Forward pass through Actor-Critic network.\n        \n        Args:\n            observations: Input observations\n            volatility: Optional volatility information\n            \n        Returns:\n            action_mean, action_std, value\n        \"\"\"\n        batch_size = observations.shape[0]\n        \n        # Feature extraction\n        if self.use_sequential and self.config.use_lstm:\n            if len(observations.shape) == 3:  # [batch, seq, features]\n                features, _ = self.feature_extractor(observations)\n                features = features[:, -1, :]  # Take last output\n            else:\n                observations_reshaped = observations.view(batch_size, self.sequence_length, -1)\n                features, _ = self.feature_extractor(observations_reshaped)\n                features = features[:, -1, :]\n        else:\n            if len(observations.shape) > 2:\n                observations = observations.view(batch_size, -1)\n            features = self.feature_extractor(observations)\n            \n        # Gary's DPI enhancement\n        if self.config.dpi_feature_weight > 0:\n            dpi_weights = self.dpi_processor(features)\n            features = features * (1 + self.config.dpi_feature_weight * dpi_weights)\n            \n        # Taleb's antifragility enhancement\n        if self.config.antifragile_exploration_weight > 0:\n            antifragile_boost = self.antifragile_gate(features)\n            features = features * (1 + self.config.antifragile_exploration_weight * antifragile_boost)\n            \n        # Volatility adaptation\n        if self.volatility_adapter is not None and volatility is not None:\n            if len(volatility.shape) == 1:\n                volatility = volatility.unsqueeze(-1)\n            vol_weights = self.volatility_adapter(volatility)\n            features = features * vol_weights\n            \n        # Policy (actor) output\n        action_mean = self.actor_mean(features)\n        action_std = F.softplus(self.actor_std).expand_as(action_mean)\n        \n        # Value (critic) output\n        value = self.critic(features)\n        \n        return action_mean, action_std, value\n        \n    def get_action_and_value(self, \n                           observations: torch.Tensor,\n                           actions: Optional[torch.Tensor] = None,\n                           volatility: Optional[torch.Tensor] = None) -> Dict[str, torch.Tensor]:\n        \"\"\"Get action and value with log probabilities.\n        \n        Args:\n            observations: Input observations\n            actions: Optional actions for evaluation\n            volatility: Optional volatility information\n            \n        Returns:\n            Dictionary with actions, log_probs, values, and entropy\n        \"\"\"\n        action_mean, action_std, values = self.forward(observations, volatility)\n        \n        # Create normal distribution\n        dist = Normal(action_mean, action_std)\n        \n        if actions is None:\n            # Sample new actions\n            actions = dist.sample()\n            \n        log_probs = dist.log_prob(actions).sum(-1)\n        entropy = dist.entropy().sum(-1)\n        \n        return {\n            'actions': actions,\n            'log_probs': log_probs,\n            'values': values.squeeze(-1),\n            'entropy': entropy,\n            'action_mean': action_mean,\n            'action_std': action_std\n        }\n\n\nclass PPOAgent:\n    \"\"\"PPO Agent for trading strategy optimization.\n    \n    Features:\n    - Gary's DPI integration\n    - Taleb's antifragility principles\n    - Volatility-adaptive exploration\n    - Fast inference optimization\n    \"\"\"\n    \n    def __init__(self,\n                 observation_shape: Tuple[int, ...],\n                 action_dim: int,\n                 config: PPOConfig):\n        \"\"\"Initialize PPO agent.\n        \n        Args:\n            observation_shape: Shape of observation space\n            action_dim: Dimension of action space\n            config: PPO configuration\n        \"\"\"\n        self.config = config\n        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')\n        \n        # Create network\n        self.actor_critic = ActorCritic(observation_shape, action_dim, config).to(self.device)\n        \n        # Optimizer\n        self.optimizer = optim.Adam(\n            self.actor_critic.parameters(),\n            lr=config.learning_rate,\n            eps=1e-5\n        )\n        \n        # Learning rate scheduler\n        self.scheduler = optim.lr_scheduler.ReduceLROnPlateau(\n            self.optimizer, mode='max', patience=10, factor=0.8\n        )\n        \n        # Experience buffer\n        self.buffer = PPOBuffer(\n            observation_shape,\n            action_dim,\n            config.buffer_size,\n            config.gamma,\n            config.gae_lambda\n        )\n        \n        # Performance tracking\n        self.inference_times = deque(maxlen=1000)\n        self.training_stats = {\n            'total_updates': 0,\n            'policy_losses': [],\n            'value_losses': [],\n            'entropy_losses': [],\n            'returns': []\n        }\n        \n        # Compile model for faster inference\n        if config.compile_model and torch.__version__ >= \"2.0.0\":\n            self.actor_critic = torch.compile(self.actor_critic, mode='max-autotune')\n            \n    def get_action(self, \n                   observation: np.ndarray,\n                   volatility: Optional[float] = None,\n                   deterministic: bool = False) -> Tuple[np.ndarray, Dict[str, Any]]:\n        \"\"\"Get action for given observation.\n        \n        Args:\n            observation: Current observation\n            volatility: Current market volatility\n            deterministic: Whether to use deterministic policy\n            \n        Returns:\n            action, info_dict\n        \"\"\"\n        start_time = time.time()\n        \n        with torch.no_grad():\n            obs_tensor = torch.FloatTensor(observation).unsqueeze(0).to(self.device)\n            \n            vol_tensor = None\n            if volatility is not None:\n                vol_tensor = torch.FloatTensor([volatility]).to(self.device)\n                \n            if deterministic:\n                # Use mean action for deterministic policy\n                action_mean, _, value = self.actor_critic(obs_tensor, vol_tensor)\n                action = action_mean\n                log_prob = torch.zeros(1)\n                entropy = torch.zeros(1)\n            else:\n                # Sample action stochastically\n                output = self.actor_critic.get_action_and_value(obs_tensor, volatility=vol_tensor)\n                action = output['actions']\n                log_prob = output['log_probs']\n                entropy = output['entropy']\n                value = output['values']\n                \n        # Track inference time\n        inference_time = (time.time() - start_time) * 1000  # ms\n        self.inference_times.append(inference_time)\n        \n        action_np = action.cpu().numpy()[0]\n        \n        info = {\n            'value': float(value.cpu().numpy()[0]) if not deterministic else 0.0,\n            'log_prob': float(log_prob.cpu().numpy()[0]) if not deterministic else 0.0,\n            'entropy': float(entropy.cpu().numpy()[0]) if not deterministic else 0.0,\n            'inference_time_ms': inference_time,\n            'deterministic': deterministic,\n            'volatility_adapted': volatility is not None\n        }\n        \n        return action_np, info\n        \n    def store_transition(self,\n                       observation: np.ndarray,\n                       action: np.ndarray,\n                       reward: float,\n                       value: float,\n                       log_prob: float,\n                       done: bool,\n                       volatility: Optional[float] = None):\n        \"\"\"Store transition in buffer.\n        \n        Args:\n            observation: Current observation\n            action: Action taken\n            reward: Reward received\n            value: Value estimate\n            log_prob: Log probability of action\n            done: Whether episode is done\n            volatility: Optional volatility information\n        \"\"\"\n        self.buffer.store(\n            observation=observation,\n            action=action,\n            reward=reward,\n            value=value,\n            log_prob=log_prob,\n            done=done,\n            volatility=volatility\n        )\n        \n    def update(self) -> Dict[str, float]:\n        \"\"\"Update policy using PPO.\n        \n        Returns:\n            Training statistics\n        \"\"\"\n        if len(self.buffer) < self.config.batch_size:\n            return {}\n            \n        # Get batch data\n        batch = self.buffer.get_batch()\n        \n        # Convert to tensors\n        observations = torch.FloatTensor(batch['observations']).to(self.device)\n        actions = torch.FloatTensor(batch['actions']).to(self.device)\n        old_log_probs = torch.FloatTensor(batch['log_probs']).to(self.device)\n        advantages = torch.FloatTensor(batch['advantages']).to(self.device)\n        returns = torch.FloatTensor(batch['returns']).to(self.device)\n        volatility = None\n        if batch['volatility'] is not None:\n            volatility = torch.FloatTensor(batch['volatility']).to(self.device)\n            \n        # Normalize advantages\n        advantages = (advantages - advantages.mean()) / (advantages.std() + 1e-8)\n        \n        # PPO updates\n        policy_losses = []\n        value_losses = []\n        entropy_losses = []\n        \n        # Create mini-batches\n        batch_size = len(observations)\n        indices = np.arange(batch_size)\n        \n        for epoch in range(self.config.ppo_epochs):\n            np.random.shuffle(indices)\n            \n            for start in range(0, batch_size, self.config.mini_batch_size):\n                end = start + self.config.mini_batch_size\n                mb_indices = indices[start:end]\n                \n                # Mini-batch data\n                mb_obs = observations[mb_indices]\n                mb_actions = actions[mb_indices]\n                mb_old_log_probs = old_log_probs[mb_indices]\n                mb_advantages = advantages[mb_indices]\n                mb_returns = returns[mb_indices]\n                mb_volatility = volatility[mb_indices] if volatility is not None else None\n                \n                # Forward pass\n                output = self.actor_critic.get_action_and_value(\n                    mb_obs, mb_actions, mb_volatility\n                )\n                \n                new_log_probs = output['log_probs']\n                values = output['values']\n                entropy = output['entropy']\n                \n                # Policy loss (PPO clipped objective)\n                ratio = torch.exp(new_log_probs - mb_old_log_probs)\n                surr1 = ratio * mb_advantages\n                surr2 = torch.clamp(\n                    ratio, \n                    1 - self.config.clip_ratio,\n                    1 + self.config.clip_ratio\n                ) * mb_advantages\n                \n                policy_loss = -torch.min(surr1, surr2).mean()\n                \n                # Value loss\n                value_loss = F.mse_loss(values, mb_returns)\n                \n                # Entropy loss (for exploration)\n                entropy_loss = -entropy.mean()\n                \n                # Total loss\n                total_loss = (\n                    policy_loss + \n                    self.config.value_loss_coef * value_loss +\n                    self.config.entropy_coef * entropy_loss\n                )\n                \n                # Backward pass\n                self.optimizer.zero_grad()\n                total_loss.backward()\n                \n                # Gradient clipping\n                torch.nn.utils.clip_grad_norm_(\n                    self.actor_critic.parameters(),\n                    self.config.max_grad_norm\n                )\n                \n                self.optimizer.step()\n                \n                # Store losses\n                policy_losses.append(policy_loss.item())\n                value_losses.append(value_loss.item())\n                entropy_losses.append(entropy_loss.item())\n                \n        # Update statistics\n        self.training_stats['total_updates'] += 1\n        self.training_stats['policy_losses'].extend(policy_losses)\n        self.training_stats['value_losses'].extend(value_losses)\n        self.training_stats['entropy_losses'].extend(entropy_losses)\n        self.training_stats['returns'].extend(returns.cpu().numpy().tolist())\n        \n        # Learning rate scheduling\n        avg_return = np.mean(returns.cpu().numpy())\n        self.scheduler.step(avg_return)\n        \n        # Clear buffer\n        self.buffer.clear()\n        \n        return {\n            'policy_loss': np.mean(policy_losses),\n            'value_loss': np.mean(value_losses),\n            'entropy_loss': np.mean(entropy_losses),\n            'avg_return': avg_return,\n            'learning_rate': self.optimizer.param_groups[0]['lr']\n        }\n        \n    def save_model(self, path: str):\n        \"\"\"Save model checkpoint.\n        \n        Args:\n            path: Save path\n        \"\"\"\n        torch.save({\n            'actor_critic_state_dict': self.actor_critic.state_dict(),\n            'optimizer_state_dict': self.optimizer.state_dict(),\n            'config': self.config,\n            'training_stats': self.training_stats\n        }, path)\n        \n    def load_model(self, path: str):\n        \"\"\"Load model checkpoint.\n        \n        Args:\n            path: Load path\n        \"\"\"\n        checkpoint = torch.load(path, map_location=self.device)\n        self.actor_critic.load_state_dict(checkpoint['actor_critic_state_dict'])\n        self.optimizer.load_state_dict(checkpoint['optimizer_state_dict'])\n        self.training_stats = checkpoint.get('training_stats', self.training_stats)\n        \n    def get_performance_metrics(self) -> Dict[str, Any]:\n        \"\"\"Get agent performance metrics.\"\"\"\n        if not self.inference_times:\n            return {'status': 'No inference data available'}\n            \n        recent_times = list(self.inference_times)[-100:]\n        \n        metrics = {\n            'avg_inference_time_ms': np.mean(recent_times),\n            'max_inference_time_ms': np.max(recent_times),\n            'min_inference_time_ms': np.min(recent_times),\n            'inference_target_met': np.mean(recent_times) < self.config.target_inference_ms,\n            'total_updates': self.training_stats['total_updates'],\n            'avg_policy_loss': np.mean(self.training_stats['policy_losses'][-100:]) if self.training_stats['policy_losses'] else 0,\n            'avg_value_loss': np.mean(self.training_stats['value_losses'][-100:]) if self.training_stats['value_losses'] else 0,\n            'avg_return': np.mean(self.training_stats['returns'][-100:]) if self.training_stats['returns'] else 0,\n            'current_lr': self.optimizer.param_groups[0]['lr'],\n            'model_parameters': sum(p.numel() for p in self.actor_critic.parameters()),\n            'gary_dpi_enabled': self.config.dpi_feature_weight > 0,\n            'taleb_antifragile_enabled': self.config.antifragile_exploration_weight > 0,\n            'volatility_adaptation': self.config.volatility_adaptation\n        }\n        \n        return metrics\n\n\nclass PPOBuffer:\n    \"\"\"Experience buffer for PPO.\"\"\"\n    \n    def __init__(self,\n                 observation_shape: Tuple[int, ...],\n                 action_dim: int,\n                 buffer_size: int,\n                 gamma: float,\n                 gae_lambda: float):\n        \"\"\"Initialize buffer.\n        \n        Args:\n            observation_shape: Shape of observations\n            action_dim: Dimension of actions\n            buffer_size: Maximum buffer size\n            gamma: Discount factor\n            gae_lambda: GAE parameter\n        \"\"\"\n        self.observation_shape = observation_shape\n        self.action_dim = action_dim\n        self.buffer_size = buffer_size\n        self.gamma = gamma\n        self.gae_lambda = gae_lambda\n        \n        # Storage arrays\n        self.observations = np.zeros((buffer_size,) + observation_shape, dtype=np.float32)\n        self.actions = np.zeros((buffer_size, action_dim), dtype=np.float32)\n        self.rewards = np.zeros(buffer_size, dtype=np.float32)\n        self.values = np.zeros(buffer_size, dtype=np.float32)\n        self.log_probs = np.zeros(buffer_size, dtype=np.float32)\n        self.dones = np.zeros(buffer_size, dtype=np.bool_)\n        self.volatility = np.zeros(buffer_size, dtype=np.float32)\n        \n        self.ptr = 0\n        self.size = 0\n        \n    def store(self,\n             observation: np.ndarray,\n             action: np.ndarray,\n             reward: float,\n             value: float,\n             log_prob: float,\n             done: bool,\n             volatility: Optional[float] = None):\n        \"\"\"Store transition.\"\"\"\n        idx = self.ptr % self.buffer_size\n        \n        self.observations[idx] = observation\n        self.actions[idx] = action\n        self.rewards[idx] = reward\n        self.values[idx] = value\n        self.log_probs[idx] = log_prob\n        self.dones[idx] = done\n        self.volatility[idx] = volatility if volatility is not None else 0.0\n        \n        self.ptr += 1\n        self.size = min(self.size + 1, self.buffer_size)\n        \n    def get_batch(self) -> Dict[str, np.ndarray]:\n        \"\"\"Get batch with advantages and returns calculated.\"\"\"\n        assert self.size >= self.buffer_size, \"Buffer not full\"\n        \n        # Calculate advantages and returns using GAE\n        advantages = np.zeros_like(self.rewards)\n        returns = np.zeros_like(self.rewards)\n        \n        gae = 0\n        for t in reversed(range(self.buffer_size)):\n            if t == self.buffer_size - 1:\n                next_value = 0  # Assuming episode ends\n            else:\n                next_value = self.values[t + 1]\n                \n            delta = self.rewards[t] + self.gamma * next_value - self.values[t]\n            gae = delta + self.gamma * self.gae_lambda * gae\n            advantages[t] = gae\n            returns[t] = gae + self.values[t]\n            \n        return {\n            'observations': self.observations[:self.size].copy(),\n            'actions': self.actions[:self.size].copy(),\n            'log_probs': self.log_probs[:self.size].copy(),\n            'advantages': advantages[:self.size].copy(),\n            'returns': returns[:self.size].copy(),\n            'volatility': self.volatility[:self.size].copy() if np.any(self.volatility) else None\n        }\n        \n    def clear(self):\n        \"\"\"Clear buffer.\"\"\"\n        self.ptr = 0\n        self.size = 0\n        \n    def __len__(self) -> int:\n        return self.size\n\n\n# Factory function for easy creation\ndef create_ppo_agent(\n    observation_shape: Tuple[int, ...],\n    action_dim: int = 2,  # [position_change, confidence]\n    learning_rate: float = 3e-4,\n    enable_dpi: bool = True,\n    enable_antifragile: bool = True,\n    fast_inference: bool = True\n) -> PPOAgent:\n    \"\"\"Create PPO agent with GaryTaleb integration.\n    \n    Args:\n        observation_shape: Shape of observation space\n        action_dim: Dimension of action space\n        learning_rate: Learning rate\n        enable_dpi: Enable Gary's DPI features\n        enable_antifragile: Enable Taleb's antifragility\n        fast_inference: Optimize for fast inference\n        \n    Returns:\n        Configured PPO agent\n    \"\"\"\n    config = PPOConfig(\n        learning_rate=learning_rate,\n        dpi_feature_weight=0.3 if enable_dpi else 0.0,\n        antifragile_exploration_weight=0.2 if enable_antifragile else 0.0,\n        volatility_adaptation=True,\n        compile_model=fast_inference,\n        target_inference_ms=50.0 if fast_inference else 100.0\n    )\n    \n    agent = PPOAgent(observation_shape, action_dim, config)\n    \n    print(f\"PPO Agent created for trading strategy optimization\")\n    print(f\"GaryTaleb integration: DPI={enable_dpi}, Antifragile={enable_antifragile}\")\n    print(f\"Target inference time: {config.target_inference_ms}ms\")\n    \n    return agent"