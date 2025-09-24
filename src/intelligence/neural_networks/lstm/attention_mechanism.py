"""Attention Mechanism for LSTM

Implements scaled dot-product attention for time series prediction.
Focuses on relevant temporal patterns for price forecasting.
"""

import torch
import torch.nn as nn
import torch.nn.functional as F
import math
from typing import Tuple, Optional


class AttentionLayer(nn.Module):
    """Scaled dot-product attention mechanism for LSTM outputs."""

    def __init__(self, hidden_size: int, num_heads: int = 8, dropout: float = 0.1):
        """Initialize attention layer.

        Args:
            hidden_size: Size of hidden state (must be divisible by num_heads)
            num_heads: Number of attention heads
            dropout: Dropout rate
        """
        super(AttentionLayer, self).__init__()

        assert hidden_size % num_heads == 0, "hidden_size must be divisible by num_heads"

        self.hidden_size = hidden_size
        self.num_heads = num_heads
        self.head_dim = hidden_size // num_heads

        # Linear projections for Q, K, V
        self.query_projection = nn.Linear(hidden_size, hidden_size)
        self.key_projection = nn.Linear(hidden_size, hidden_size)
        self.value_projection = nn.Linear(hidden_size, hidden_size)

        # Output projection
        self.output_projection = nn.Linear(hidden_size, hidden_size)

        # Dropout and layer norm
        self.dropout = nn.Dropout(dropout)
        self.layer_norm = nn.LayerNorm(hidden_size)

        # Initialize weights
        self._init_weights()

    def _init_weights(self):
        """Initialize weights using Xavier uniform."""
        for module in [self.query_projection, self.key_projection,
                      self.value_projection, self.output_projection]:
            nn.init.xavier_uniform_(module.weight)
            nn.init.zeros_(module.bias)

    def forward(self,
                lstm_output: torch.Tensor,
                mask: Optional[torch.Tensor] = None) -> Tuple[torch.Tensor, torch.Tensor]:
        """Forward pass through attention mechanism.

        Args:
            lstm_output: LSTM outputs [batch_size, seq_len, hidden_size]
            mask: Optional padding mask [batch_size, seq_len]

        Returns:
            attended_output: Attention-weighted output [batch_size, seq_len, hidden_size]
            attention_weights: Attention scores [batch_size, num_heads, seq_len, seq_len]
        """
        batch_size, seq_len, _ = lstm_output.shape

        # Compute Q, K, V projections
        queries = self.query_projection(lstm_output)
        keys = self.key_projection(lstm_output)
        values = self.value_projection(lstm_output)

        # Reshape for multi-head attention
        # [batch_size, seq_len, hidden_size] -> [batch_size, num_heads, seq_len, head_dim]
        queries = queries.view(batch_size, seq_len, self.num_heads, self.head_dim).transpose(1, 2)
        keys = keys.view(batch_size, seq_len, self.num_heads, self.head_dim).transpose(1, 2)
        values = values.view(batch_size, seq_len, self.num_heads, self.head_dim).transpose(1, 2)

        # Compute attention scores
        attention_scores = torch.matmul(queries, keys.transpose(-2, -1)) / math.sqrt(self.head_dim)

        # Apply mask if provided
        if mask is not None:
            # Expand mask for multi-head attention
            pass  # Auto-fixed: empty block
            pass  # Auto-fixed: empty block
            pass  # Auto-fixed: empty block
            pass  # Auto-fixed: empty block
            pass  # Auto-fixed: empty block
            mask = mask.unsqueeze(1).unsqueeze(2)  # [batch_size, 1, 1, seq_len]
            attention_scores.masked_fill_(mask == 0, float('-inf'))

        # Apply softmax to get attention weights
        attention_weights = F.softmax(attention_scores, dim=-1)
        attention_weights = self.dropout(attention_weights)

        # Apply attention to values
        attended_values = torch.matmul(attention_weights, values)

        # Reshape back to [batch_size, seq_len, hidden_size]
        attended_values = attended_values.transpose(1, 2).contiguous().view(
        batch_size, seq_len, self.hidden_size
        )

        # Apply output projection
        output = self.output_projection(attended_values)

        # Residual connection and layer norm
        output = self.layer_norm(output + lstm_output)

        return output, attention_weights\n\n\nclass TemporalAttention(nn.Module):\n    \"\"\"Temporal-focused attention for financial time series.\n    \n    Emphasizes recent patterns while maintaining long-term context.\n    \"\"\"\n    \n    def __init__(self, hidden_size: int, temporal_window: int = 20):\n        \"\"\"Initialize temporal attention.\n        \n        Args:\n            hidden_size: Size of hidden state\n            temporal_window: Window for temporal decay\n        \"\"\"\n        super(TemporalAttention, self).__init__()\n        \n        self.hidden_size = hidden_size\n        self.temporal_window = temporal_window\n        \n        # Temporal decay weights\n        self.temporal_weights = nn.Parameter(\n            torch.exp(-torch.arange(temporal_window, dtype=torch.float) / temporal_window)\n        )\n        \n        # Context vector for temporal attention\n        self.context_vector = nn.Parameter(torch.randn(hidden_size))\n        \n        # Projection layers\n        self.attention_projection = nn.Linear(hidden_size, hidden_size)\n        self.output_projection = nn.Linear(hidden_size, hidden_size)\n        \n    def forward(self, lstm_output: torch.Tensor) -> torch.Tensor:\n        \"\"\"Apply temporal attention to LSTM output.\n        \n        Args:\n            lstm_output: LSTM outputs [batch_size, seq_len, hidden_size]\n            \n        Returns:\n            attended_output: Temporally weighted output [batch_size, hidden_size]\n        \"\"\"\n        batch_size, seq_len, _ = lstm_output.shape\n        \n        # Compute attention scores using context vector\n        attention_input = torch.tanh(self.attention_projection(lstm_output))\n        attention_scores = torch.matmul(attention_input, self.context_vector)\n        \n        # Apply temporal decay weights (focus on recent data)\n        if seq_len <= self.temporal_window:\n            temporal_weights = self.temporal_weights[-seq_len:]\n        else:\n            # Pad with small weights for older data\n            old_weights = torch.full((seq_len - self.temporal_window,), 0.01, \n                                   device=self.temporal_weights.device)\n            temporal_weights = torch.cat([old_weights, self.temporal_weights])\n        \n        # Combine attention scores with temporal weights\n        combined_scores = attention_scores * temporal_weights.unsqueeze(0)\n        attention_weights = F.softmax(combined_scores, dim=1)\n        \n        # Apply attention to get weighted representation\n        attended_output = torch.sum(lstm_output * attention_weights.unsqueeze(-1), dim=1)\n        \n        # Final projection\n        output = self.output_projection(attended_output)\n        \n        return output\n\n\nclass FinancialAttention(nn.Module):\n    \"\"\"Financial market-specific attention mechanism.\n    \n    Incorporates volatility and volume weighting for market-aware attention.\n    \"\"\"\n    \n    def __init__(self, hidden_size: int, market_features: int = 5):\n        \"\"\"Initialize financial attention.\n        \n        Args:\n            hidden_size: Size of hidden state\n            market_features: Number of market features (OHLCV)\n        \"\"\"\n        super(FinancialAttention, self).__init__()\n        \n        self.hidden_size = hidden_size\n        self.market_features = market_features\n        \n        # Market-aware attention weights\n        self.volatility_weight = nn.Linear(1, hidden_size)\n        self.volume_weight = nn.Linear(1, hidden_size)\n        \n        # Attention mechanism\n        self.attention_layer = AttentionLayer(hidden_size, num_heads=4)\n        \n        # Market feature projection\n        self.market_projection = nn.Linear(market_features, hidden_size)\n        \n    def forward(self, \n                lstm_output: torch.Tensor, \n                market_data: torch.Tensor) -> Tuple[torch.Tensor, torch.Tensor]:\n        \"\"\"Apply financial market-aware attention.\n        \n        Args:\n            lstm_output: LSTM outputs [batch_size, seq_len, hidden_size]\n            market_data: Market features [batch_size, seq_len, market_features]\n            \n        Returns:\n            attended_output: Market-weighted attention output\n            attention_weights: Attention scores\n        \"\"\"\n        batch_size, seq_len, _ = lstm_output.shape\n        \n        # Extract volatility and volume from market data\n        # Assuming market_data contains [open, high, low, close, volume]\n        high_prices = market_data[:, :, 1:2]  # High prices\n        low_prices = market_data[:, :, 2:3]   # Low prices\n        volumes = market_data[:, :, 4:5]      # Volumes\n        \n        # Calculate volatility (high-low range)\n        volatility = (high_prices - low_prices) / ((high_prices + low_prices) / 2 + 1e-8)\n        \n        # Normalize volume (log transformation)\n        normalized_volume = torch.log(volumes + 1e-8)\n        \n        # Generate market-aware weights\n        vol_weights = torch.sigmoid(self.volatility_weight(volatility))\n        volume_weights = torch.sigmoid(self.volume_weight(normalized_volume))\n        \n        # Combine with LSTM output\n        market_weighted_output = lstm_output * (vol_weights + volume_weights) / 2\n        \n        # Apply standard attention\n        attended_output, attention_weights = self.attention_layer(market_weighted_output)\n        \n        return attended_output, attention_weights"