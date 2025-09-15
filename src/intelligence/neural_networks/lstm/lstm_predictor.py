"""LSTM Predictor for Financial Time Series

2-layer LSTM with attention mechanism for price prediction.
Integrates with Gary's DPI calculations and supports <100ms inference.
"""

import torch
import torch.nn as nn
import numpy as np
from typing import Dict, List, Tuple, Optional, Any
import time
from dataclasses import dataclass
from .attention_mechanism import AttentionLayer, TemporalAttention, FinancialAttention


@dataclass
class LSTMConfig:
    """Configuration for LSTM predictor."""
    input_size: int = 5  # OHLCV features
    hidden_size: int = 128
    num_layers: int = 2
    dropout: float = 0.2
    sequence_length: int = 60  # 1 hour of minute data
    prediction_horizon: int = 5  # Predict 5 minutes ahead
    attention_heads: int = 8
    batch_size: int = 32
    learning_rate: float = 0.001
    weight_decay: float = 1e-4

    # Gary×Taleb integration
    antifragility_weight: float = 0.15  # Taleb's antifragility factor
    dpi_integration: bool = True  # Gary's DPI calculations
    volatility_scaling: bool = True  # Dynamic volatility adjustment


class LSTMPredictor(nn.Module):
    """2-Layer LSTM with attention for financial time series prediction.

    Optimized for <100ms inference with Gary×Taleb integration.
    Supports antifragility principles and DPI calculations.
    """

    def __init__(self, config: LSTMConfig):
        """Initialize LSTM predictor.

        Args:
            config: LSTM configuration parameters
        """
        super(LSTMPredictor, self).__init__()

        self.config = config
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

        # Input normalization
        self.input_norm = nn.BatchNorm1d(config.input_size)

        # Feature engineering layer
        self.feature_projection = nn.Linear(config.input_size, config.hidden_size)

        # 2-layer LSTM
        self.lstm = nn.LSTM(
            input_size=config.hidden_size,
            hidden_size=config.hidden_size,
            num_layers=config.num_layers,
            dropout=config.dropout if config.num_layers > 1 else 0,
            batch_first=True,
            bidirectional=False  # Causal for real-time prediction
        )

        # Attention mechanisms
        self.attention_layer = AttentionLayer(
            config.hidden_size,
            num_heads=config.attention_heads,
            dropout=config.dropout
        )

        self.temporal_attention = TemporalAttention(
            config.hidden_size,
            temporal_window=20
        )

        self.financial_attention = FinancialAttention(
            config.hidden_size,
            market_features=config.input_size
        )

        # Prediction heads
        self.price_head = nn.Sequential(
            nn.Linear(config.hidden_size, config.hidden_size // 2),
            nn.ReLU(),
            nn.Dropout(config.dropout),
            nn.Linear(config.hidden_size // 2, config.prediction_horizon),
            nn.Tanh()  # Normalized price changes
        )

        self.volatility_head = nn.Sequential(
            nn.Linear(config.hidden_size, config.hidden_size // 4),
            nn.ReLU(),
            nn.Dropout(config.dropout),
            nn.Linear(config.hidden_size // 4, config.prediction_horizon),
            nn.Softplus()  # Positive volatility
        )

        self.confidence_head = nn.Sequential(
            nn.Linear(config.hidden_size, config.hidden_size // 4),
            nn.ReLU(),
            nn.Linear(config.hidden_size // 4, config.prediction_horizon),
            nn.Sigmoid()  # Confidence scores [0, 1]
        )

        # Gary's DPI integration layer
        self.dpi_projection = nn.Linear(config.hidden_size, 1)

        # Antifragility enhancement
        self.antifragile_gate = nn.Sequential(
            nn.Linear(config.hidden_size, config.hidden_size // 2),
            nn.Tanh(),
            nn.Linear(config.hidden_size // 2, config.hidden_size),
            nn.Sigmoid()
        )

        # Initialize weights
        self._init_weights()

        # Performance tracking
        self.inference_times = []
        self.prediction_accuracy = []

    def _init_weights(self):
        """Initialize model weights using Xavier/He initialization."""
        for name, param in self.named_parameters():
            if 'weight' in name:
                if len(param.shape) >= 2:
                    nn.init.xavier_uniform_(param)
                else:
                    nn.init.uniform_(param, -0.1, 0.1)
            elif 'bias' in name:
                nn.init.zeros_(param)

    def forward(self,
                x: torch.Tensor,
                market_context: Optional[torch.Tensor] = None) -> Dict[str, torch.Tensor]:
        """Forward pass through LSTM predictor.

        Args:
            x: Input time series [batch_size, seq_len, input_size]
            market_context: Optional market context features

        Returns:
            Dictionary containing predictions and intermediate outputs
        """
        start_time = time.time()

        batch_size, seq_len, input_size = x.shape

        # Input normalization and feature engineering
        x_norm = self.input_norm(x.view(-1, input_size)).view(batch_size, seq_len, input_size)
        features = torch.relu(self.feature_projection(x_norm))

        # LSTM forward pass
        lstm_out, (hidden, cell) = self.lstm(features)

        # Apply attention mechanisms
        attended_out, attention_weights = self.attention_layer(lstm_out)

        # Temporal attention for final representation
        temporal_context = self.temporal_attention(attended_out)

        # Financial market-aware attention if market context provided
        if market_context is not None:
            financial_context, financial_weights = self.financial_attention(
                attended_out, market_context
            )
            # Combine temporal and financial contexts
            final_context = (temporal_context + financial_context.mean(dim=1)) / 2
        else:
            final_context = temporal_context
            financial_weights = None

        # Antifragility enhancement (Taleb's principle)
        if self.config.antifragility_weight > 0:
            antifragile_boost = self.antifragile_gate(final_context)
            final_context = final_context * (1 + self.config.antifragility_weight * antifragile_boost)

        # Generate predictions
        price_pred = self.price_head(final_context)
        volatility_pred = self.volatility_head(final_context)
        confidence_pred = self.confidence_head(final_context)

        # Gary's DPI calculation
        dpi_score = torch.sigmoid(self.dpi_projection(final_context))

        # Track inference time
        inference_time = (time.time() - start_time) * 1000  # ms
        self.inference_times.append(inference_time)

        return {
            'price_prediction': price_pred,
            'volatility_prediction': volatility_pred,
            'confidence_scores': confidence_pred,
            'dpi_score': dpi_score,
            'attention_weights': attention_weights,
            'financial_weights': financial_weights,
            'final_context': final_context,
            'inference_time_ms': inference_time,
            'lstm_hidden': hidden,
            'lstm_cell': cell
        }

    def predict_single(self,
                      sequence: np.ndarray,
                      market_context: Optional[np.ndarray] = None) -> Dict[str, Any]:
        """Single sequence prediction for real-time trading.

        Optimized for <100ms inference time.

        Args:
            sequence: Time series data [seq_len, input_size]
            market_context: Optional market context [seq_len, input_size]

        Returns:
            Prediction dictionary with timing metrics
        """
        self.eval()

        with torch.no_grad():
            # Convert to tensor and add batch dimension
            x = torch.FloatTensor(sequence).unsqueeze(0).to(self.device)

            if market_context is not None:
                market_context = torch.FloatTensor(market_context).unsqueeze(0).to(self.device)

            # Forward pass
            output = self.forward(x, market_context)

            # Convert to numpy for compatibility
            result = {
                'price_prediction': output['price_prediction'][0].cpu().numpy(),
                'volatility_prediction': output['volatility_prediction'][0].cpu().numpy(),
                'confidence_scores': output['confidence_scores'][0].cpu().numpy(),
                'dpi_score': output['dpi_score'][0].cpu().numpy(),
                'inference_time_ms': output['inference_time_ms'],
                'antifragile_enhanced': self.config.antifragility_weight > 0,
                'model_confidence': float(output['confidence_scores'][0].mean().cpu())
            }

            return result

    def get_gary_dpi_factors(self, sequence: np.ndarray) -> Dict[str, float]:
        """Calculate Gary's DPI (Dynamic Position Intelligence) factors.

        Args:
            sequence: Time series data [seq_len, input_size]

        Returns:
            Dictionary of DPI factors
        """
        if not self.config.dpi_integration:
            return {}

        with torch.no_grad():
            # Basic DPI calculations
            prices = sequence[:, 3]  # Close prices
            volumes = sequence[:, 4]  # Volumes

            # Price momentum (Gary's velocity factor)
            price_momentum = np.mean(np.diff(prices[-10:]))  # Last 10 periods

            # Volume-weighted momentum
            volume_weight = volumes[-10:] / np.mean(volumes[-20:])
            weighted_momentum = price_momentum * np.mean(volume_weight)

            # Volatility factor
            volatility = np.std(prices[-20:])

            # DPI composite score
            dpi_composite = (weighted_momentum * 0.4 +
                           price_momentum * 0.3 +
                           (1 / (volatility + 1e-8)) * 0.3)

            return {
                'price_momentum': float(price_momentum),
                'weighted_momentum': float(weighted_momentum),
                'volatility_factor': float(volatility),
                'dpi_composite': float(dpi_composite),
                'volume_pressure': float(np.mean(volume_weight)),
                'trend_strength': float(abs(price_momentum) / (volatility + 1e-8))
            }

    def apply_taleb_antifragility(self,
                                 predictions: Dict[str, np.ndarray],
                                 market_stress: float = 0.0) -> Dict[str, np.ndarray]:
        \"\"\"Apply Taleb's antifragility principles to predictions.

        Enhances predictions during market stress periods.

        Args:
            predictions: Model predictions
            market_stress: Market stress indicator [0, 1]

        Returns:
            Antifragility-enhanced predictions
        \"\"\"
        if not self.config.antifragility_weight or market_stress == 0:
            return predictions

        enhanced_predictions = predictions.copy()

        # Antifragile enhancement during stress
        stress_multiplier = 1 + (market_stress * self.config.antifragility_weight)

        # Increase volatility predictions during stress (opportunity detection)
        enhanced_predictions['volatility_prediction'] *= stress_multiplier

        # Adjust confidence based on antifragile principles
        # Higher confidence in predictions during stress (contrarian approach)
        enhanced_predictions['confidence_scores'] = np.minimum(\n            enhanced_predictions['confidence_scores'] * stress_multiplier,\n            1.0\n        )\n        \n        # Add antifragility score\n        enhanced_predictions['antifragility_score'] = market_stress * stress_multiplier\n        \n        return enhanced_predictions\n    \n    def optimize_for_inference(self):\n        \"\"\"Optimize model for <100ms inference.\n        \n        Applies various optimization techniques for production deployment.\n        \"\"\"\n        # Compile model for faster inference\n        if torch.__version__ >= \"2.0.0\":\n            self = torch.compile(self, mode='max-autotune')\n        \n        # Enable optimized attention\n        if hasattr(torch.backends, 'cuda'):\n            torch.backends.cuda.enable_flash_sdp(True)\n        \n        # Set to eval mode and disable gradients\n        self.eval()\n        for param in self.parameters():\n            param.requires_grad = False\n        \n        print(f\"Model optimized for inference. Target: <100ms\")\n        \n    def get_performance_metrics(self) -> Dict[str, float]:\n        \"\"\"Get model performance metrics.\n        \n        Returns:\n            Performance statistics\n        \"\"\"\n        if not self.inference_times:\n            return {\"status\": \"No inference data available\"}\n        \n        return {\n            'avg_inference_time_ms': np.mean(self.inference_times[-100:]),  # Last 100\n            'max_inference_time_ms': np.max(self.inference_times[-100:]),\n            'min_inference_time_ms': np.min(self.inference_times[-100:]),\n            'inference_target_met': np.mean(self.inference_times[-100:]) < 100,\n            'total_predictions': len(self.inference_times),\n            'model_parameters': sum(p.numel() for p in self.parameters()),\n            'memory_usage_mb': torch.cuda.memory_allocated() / 1024 / 1024 if torch.cuda.is_available() else 0\n        }\n\n\nclass LSTMTrainer:\n    \"\"\"Training utilities for LSTM predictor.\"\"\"\n    \n    def __init__(self, model: LSTMPredictor, config: LSTMConfig):\n        self.model = model\n        self.config = config\n        self.optimizer = torch.optim.AdamW(\n            model.parameters(),\n            lr=config.learning_rate,\n            weight_decay=config.weight_decay\n        )\n        self.scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(\n            self.optimizer, mode='min', patience=5, factor=0.7\n        )\n        \n    def compute_loss(self, predictions: Dict[str, torch.Tensor], targets: Dict[str, torch.Tensor]) -> torch.Tensor:\n        \"\"\"Compute multi-component loss function.\"\"\"\n        # Price prediction loss (MSE)\n        price_loss = nn.MSELoss()(predictions['price_prediction'], targets['price'])\n        \n        # Volatility prediction loss\n        vol_loss = nn.MSELoss()(predictions['volatility_prediction'], targets['volatility'])\n        \n        # DPI integration loss (if available)\n        dpi_loss = 0\n        if 'dpi_target' in targets:\n            dpi_loss = nn.MSELoss()(predictions['dpi_score'], targets['dpi_target'])\n        \n        # Combined loss\n        total_loss = price_loss + 0.3 * vol_loss + 0.2 * dpi_loss\n        \n        return total_loss\n    \n    def train_epoch(self, dataloader) -> float:\n        \"\"\"Train model for one epoch.\"\"\"\n        self.model.train()\n        total_loss = 0\n        \n        for batch in dataloader:\n            self.optimizer.zero_grad()\n            \n            # Forward pass\n            outputs = self.model(batch['sequences'], batch.get('market_context'))\n            \n            # Compute loss\n            loss = self.compute_loss(outputs, batch['targets'])\n            \n            # Backward pass\n            loss.backward()\n            \n            # Gradient clipping\n            torch.nn.utils.clip_grad_norm_(self.model.parameters(), max_norm=1.0)\n            \n            self.optimizer.step()\n            total_loss += loss.item()\n        \n        return total_loss / len(dataloader)\n\n\n# Factory function for easy model creation\ndef create_lstm_predictor(\n    sequence_length: int = 60,\n    hidden_size: int = 128,\n    enable_dpi: bool = True,\n    antifragility_weight: float = 0.15\n) -> LSTMPredictor:\n    \"\"\"Create LSTM predictor with Gary×Taleb integration.\n    \n    Args:\n        sequence_length: Input sequence length\n        hidden_size: LSTM hidden size\n        enable_dpi: Enable Gary's DPI calculations\n        antifragility_weight: Taleb's antifragility factor\n        \n    Returns:\n        Configured LSTM predictor\n    \"\"\"\n    config = LSTMConfig(\n        sequence_length=sequence_length,\n        hidden_size=hidden_size,\n        dpi_integration=enable_dpi,\n        antifragility_weight=antifragility_weight\n    )\n    \n    model = LSTMPredictor(config)\n    model.optimize_for_inference()\n    \n    return model"