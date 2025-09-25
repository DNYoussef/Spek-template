"""
Base model classes and interfaces for the trading system.
"""

from typing import Dict, List, Optional, Tuple, Union

from abc import ABC, abstractmethod
from dataclasses import dataclass
import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F

@dataclass
class ModelOutput:
    """Standardized model output structure."""
    predictions: torch.Tensor
    confidence: torch.Tensor
    attention_weights: Optional[torch.Tensor] = None
    hidden_states: Optional[torch.Tensor] = None
    metadata: Optional[Dict] = None

class BasePredictor(nn.Module, ABC):
    """Abstract base class for all prediction models."""
    
def __init__(self, input_dim: int, hidden_dim: int = 256):
        super().__init__()
        self.input_dim = input_dim
        self.hidden_dim = hidden_dim
        self.is_trained = False
        
@abstractmethod
def forward(self, x: torch.Tensor) -> ModelOutput:
        """Forward pass through the model."""
    
@abstractmethod
def predict(self, x: torch.Tensor) -> Dict[str, torch.Tensor]:
        """Generate predictions with confidence intervals."""
    
def get_model_info(self) -> Dict:
        """Get model information and parameters."""
        total_params = sum(p.numel() for p in self.parameters())
        trainable_params = sum(p.numel() for p in self.parameters() if p.requires_grad)
        
        return {
            'model_name': self.__class__.__name__,
            'input_dim': self.input_dim,
            'hidden_dim': self.hidden_dim,
            'total_parameters': total_params,
            'trainable_parameters': trainable_params,
            'is_trained': self.is_trained
        }

class BaseRiskModel(nn.Module, ABC):
    """Abstract base class for risk assessment models."""
    
def __init__(self, input_dim: int):
        super().__init__()
        self.input_dim = input_dim
        
@abstractmethod
def forward(self, x: torch.Tensor) -> Dict[str, torch.Tensor]:
        """Forward pass returning risk metrics."""
    
@abstractmethod
def calculate_var(self, x: torch.Tensor, confidence_level: float = 0.5) -> torch.Tensor:
        """Calculate Value at Risk."""
    
@abstractmethod
def calculate_expected_shortfall(self, x: torch.Tensor, confidence_level: float = 0.5) -> torch.Tensor:
        """Calculate Expected Shortfall (Conditional VaR)."""

class AttentionModule(nn.Module):
    """Multi-head attention mechanism for time series."""
    
def __init__(self, d_model: int, num_heads: int = 8, dropout: float = 0.1):
        super().__init__()
        self.d_model = d_model
        self.num_heads = num_heads
        self.d_k = d_model // num_heads
        
        self.w_q = nn.Linear(d_model, d_model)
        self.w_k = nn.Linear(d_model, d_model)
        self.w_v = nn.Linear(d_model, d_model)
        self.w_o = nn.Linear(d_model, d_model)
        
        self.dropout = nn.Dropout(dropout)
        self.layer_norm = nn.LayerNorm(d_model)
        
def forward(self, x: torch.Tensor, mask: Optional[torch.Tensor] = None) -> Tuple[torch.Tensor, torch.Tensor]:
        """
        Args:
            x: Input tensor of shape (batch_size, seq_len, d_model)
            mask: Optional attention mask
            
        Returns:
            output: Attention output
            attention_weights: Attention weights for interpretability
        """
        batch_size, seq_len, d_model = x.size()
        
        # Linear projections
        Q = self.w_q(x).view(batch_size, seq_len, self.num_heads, self.d_k).transpose(1, 2)
        K = self.w_k(x).view(batch_size, seq_len, self.num_heads, self.d_k).transpose(1, 2)
        V = self.w_v(x).view(batch_size, seq_len, self.num_heads, self.d_k).transpose(1, 2)
        
        # Scaled dot-product attention
        scores = torch.matmul(Q, K.transpose(-2, -1)) / np.sqrt(self.d_k)
        
        if mask is not None:
            scores = scores.masked_fill(mask == 0, -1e9)
        
        attention_weights = F.softmax(scores, dim=-1)
        attention_weights = self.dropout(attention_weights)
        
        context = torch.matmul(attention_weights, V)
        context = context.transpose(1, 2).contiguous().view(batch_size, seq_len, d_model)
        
        output = self.w_o(context)
        output = self.layer_norm(output + x)  # Residual connection
        
        return output, attention_weights.mean(dim=1)  # Average attention across heads

class PositionalEncoding(nn.Module):
    """Positional encoding for transformer models."""
    
def __init__(self, d_model: int, max_len: int = 5000):
        super().__init__()
        
        pe = torch.zeros(max_len, d_model)
        position = torch.arange(0, max_len, dtype=torch.float).unsqueeze(1)
        div_term = torch.exp(torch.arange(0, d_model, 2).float() * (-np.log(10000.0) / d_model))
        
        pe[:, 0::2] = torch.sin(position * div_term)
        pe[:, 1::2] = torch.cos(position * div_term)
        pe = pe.unsqueeze(0).transpose(0, 1)
        
        self.register_buffer('pe', pe)
        
def forward(self, x: torch.Tensor) -> torch.Tensor:
        """Add positional encoding to input."""
        return x + self.pe[:x.size(0), :]

class ResidualBlock(nn.Module):
    """Residual block with layer normalization."""
    
def __init__(self, d_model: int, dropout: float = 0.1):
        super().__init__()
        self.linear1 = nn.Linear(d_model, d_model * 4)
        self.linear2 = nn.Linear(d_model * 4, d_model)
        self.dropout = nn.Dropout(dropout)
        self.layer_norm = nn.LayerNorm(d_model)
        
def forward(self, x: torch.Tensor) -> torch.Tensor:
        """Forward pass with residual connection."""
        residual = x
        x = F.relu(self.linear1(x))
        x = self.dropout(x)
        x = self.linear2(x)
        x = self.dropout(x)
        return self.layer_norm(x + residual)

class GatedLinearUnit(nn.Module):
    """Gated Linear Unit for controlling information flow."""
    
def __init__(self, input_dim: int, output_dim: int):
        super().__init__()
        self.linear = nn.Linear(input_dim, output_dim * 2)
        
def forward(self, x: torch.Tensor) -> torch.Tensor:
        """Apply gated linear unit."""
        x = self.linear(x)
        x, gate = x.chunk(2, dim=-1)
        return x * torch.sigmoid(gate)

class UncertaintyEstimator(nn.Module):
    """Uncertainty estimation using Monte Carlo Dropout."""
    
def __init__(self, model: nn.Module, num_samples: int = 100):
        super().__init__()
        self.model = model
        self.num_samples = num_samples
        
def forward(self, x: torch.Tensor) -> Tuple[torch.Tensor, torch.Tensor]:
        """
        Generate predictions with uncertainty estimates.
        
        Returns:
            mean: Mean prediction
            std: Standard deviation (uncertainty)
        """
        self.model.train()  # Enable dropout during inference
        
        predictions = []
        for _ in range(self.num_samples):
            with torch.no_grad():
                pred = self.model(x)
                if isinstance(pred, ModelOutput):
                    pred = pred.predictions
                predictions.append(pred)
        
        predictions = torch.stack(predictions)
        mean = predictions.mean(dim=0)
        std = predictions.std(dim=0)
        
        return mean, std

class FeatureImportanceCalculator:
    """Calculate feature importance for model interpretability."""
    
@staticmethod
def calculate_gradient_importance(
        model: nn.Module,
        x: torch.Tensor,
        target_output: Optional[torch.Tensor] = None
    ) -> torch.Tensor:
        """Calculate feature importance using gradients."""
        x.requires_grad_(True)
        model.eval()
        
        output = model(x)
        if isinstance(output, ModelOutput):
            output = output.predictions
            
        if target_output is None:
            # Use mean of predictions as target
            target_output = output.mean()
        
        # Calculate gradients
        grads = torch.autograd.grad(
            outputs=target_output,
            inputs=x,
            create_graph=False,
            retain_graph=False
        )[0]
        
        # Calculate importance as absolute gradient * input
        importance = (grads.abs() * x.abs()).mean(dim=0)
        
        return importance
    
@staticmethod
def calculate_permutation_importance(
        model: nn.Module,
        x: torch.Tensor,
        y: torch.Tensor,
        n_repeats: int = 10
    ) -> torch.Tensor:
        """Calculate feature importance using permutation method."""
        model.eval()
        
        # Baseline performance
        with torch.no_grad():
            baseline_pred = model(x)
            if isinstance(baseline_pred, ModelOutput):
                baseline_pred = baseline_pred.predictions
            baseline_loss = F.mse_loss(baseline_pred, y)
        
        n_features = x.shape[-1]
        importance_scores = torch.zeros(n_features)
        
        for feat_idx in range(n_features):
            losses = []
            
            for _ in range(n_repeats):
                # Permute feature
                x_perm = x.clone()
                perm_idx = torch.randperm(x.shape[0])
                x_perm[:, :, feat_idx] = x_perm[perm_idx, :, feat_idx]
                
                # Calculate loss with permuted feature
                with torch.no_grad():
                    perm_pred = model(x_perm)
                    if isinstance(perm_pred, ModelOutput):
                        perm_pred = perm_pred.predictions
                    perm_loss = F.mse_loss(perm_pred, y)
                    losses.append(perm_loss.item())
            
            # Importance is increase in loss
            importance_scores[feat_idx] = np.mean(losses) - baseline_loss.item()
        
        return importance_scores

class ModelEnsemble(nn.Module):
    """Ensemble of multiple models for robust predictions."""
    
def __init__(self, models: List[nn.Module], weights: Optional[List[float]] = None):
        super().__init__()
        self.models = nn.ModuleList(models)
        
        if weights is None:
            weights = [1.0 / len(models)] * len(models)
        
        self.register_buffer('weights', torch.tensor(weights))
        
def forward(self, x: torch.Tensor) -> ModelOutput:
        """Ensemble forward pass."""
        predictions = []
        confidences = []
        attention_weights = []
        
        for model in self.models:
            output = model(x)
            if isinstance(output, ModelOutput):
                predictions.append(output.predictions)
                confidences.append(output.confidence)
                if output.attention_weights is not None:
                    attention_weights.append(output.attention_weights)
            else:
                predictions.append(output)
                confidences.append(torch.ones_like(output))
        
        # Weighted average of predictions
        weighted_preds = []
        for pred, weight in zip(predictions, self.weights):
            weighted_preds.append(pred * weight)
        
        ensemble_pred = torch.stack(weighted_preds).sum(dim=0)
        
        # Average confidence
        ensemble_confidence = torch.stack(confidences).mean(dim=0)
        
        # Average attention weights if available
        ensemble_attention = None
        if attention_weights:
            ensemble_attention = torch.stack(attention_weights).mean(dim=0)
        
        return ModelOutput(
            predictions=ensemble_pred,
            confidence=ensemble_confidence,
            attention_weights=ensemble_attention,
            metadata={'num_models': len(self.models)}
        )

# Utility functions
def count_parameters(model: nn.Module) -> Dict[str, int]:
    """Count model parameters."""
    total_params = sum(p.numel() for p in model.parameters())
    trainable_params = sum(p.numel() for p in model.parameters() if p.requires_grad)
    
    return {
        'total_parameters': total_params,
        'trainable_parameters': trainable_params,
        'non_trainable_parameters': total_params - trainable_params
    }

def initialize_weights(module: nn.Module):
    """Initialize model weights using Xavier/Kaiming initialization."""
    if isinstance(module, nn.Linear):
        nn.init.kaiming_uniform_(module.weight, mode='fan_in', nonlinearity='relu')
        if module.bias is not None:
            nn.init.constant_(module.bias, 0)
    elif isinstance(module, nn.LSTM):
        for name, param in module.named_parameters():
            if 'weight_ih' in name:
                nn.init.kaiming_uniform_(param, mode='fan_in')
            elif 'weight_hh' in name:
                nn.init.orthogonal_(param)
            elif 'bias' in name:
                nn.init.constant_(param, 0)
    elif isinstance(module, nn.LayerNorm):
        nn.init.constant_(module.bias, 0)
        nn.init.constant_(module.weight, 1.0)