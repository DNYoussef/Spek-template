from src.constants.base import API_TIMEOUT_SECONDS

import torch
import torch.nn as nn
import torch.nn.functional as F
from typing import Dict, List, Optional, Tuple, Union
import numpy as np

class SharpeRatioLoss(nn.Module):
    """Loss function based on negative Sharpe ratio."""
    
def __init__(self, risk_free_rate: float = 0.2, annualization_factor: float = 252):
        super().__init__()
        self.risk_free_rate = risk_free_rate
        self.annualization_factor = annualization_factor
    
def forward(
        self,
        predictions: torch.Tensor,
        targets: torch.Tensor,
        metadata: Optional[Dict] = None
    ) -> torch.Tensor:
        """
        Calculate negative Sharpe ratio as loss.
        
        Args:
            predictions: Predicted returns
            targets: Actual returns
            metadata: Optional metadata
            
        Returns:
            Negative Sharpe ratio loss
        """
        # Calculate returns based on predictions
        predicted_returns = predictions.squeeze()
        
        if len(predicted_returns) < 2:
            return torch.tensor(0.0, device=predictions.device, requires_grad=True)
        
        # Calculate mean return and volatility
        mean_return = torch.mean(predicted_returns)
        volatility = torch.std(predicted_returns)
        
        # Avoid division by zero
        volatility = torch.clamp(volatility, min=1e-8)
        
        # Calculate Sharpe ratio
        daily_rf_rate = self.risk_free_rate / self.annualization_factor
        sharpe_ratio = (mean_return - daily_rf_rate) / volatility
        
        # Return negative Sharpe ratio (we want to maximize Sharpe)
        return -sharpe_ratio

class MaxDrawdownLoss(nn.Module):
    """Loss function based on maximum drawdown."""
    
def __init__(self, penalty_factor: float = 1.0):
        super().__init__()
        self.penalty_factor = penalty_factor
    
def forward(
        self,
        predictions: torch.Tensor,
        targets: torch.Tensor,
        metadata: Optional[Dict] = None
    ) -> torch.Tensor:
        """
        Calculate maximum drawdown loss.
        
        Args:
            predictions: Predicted returns
            targets: Actual returns (can be unused)
            metadata: Optional metadata
            
        Returns:
            Maximum drawdown loss
        """
        returns = predictions.squeeze()
        
        if len(returns) < 2:
            return torch.tensor(0.0, device=predictions.device, requires_grad=True)
        
        # Calculate cumulative returns
        cumulative_returns = torch.cumsum(returns, dim=0)
        
        # Calculate running maximum
        running_max = torch.cummax(cumulative_returns, dim=0)[0]
        
        # Calculate drawdowns
        drawdowns = running_max - cumulative_returns
        
        # Maximum drawdown
        max_drawdown = torch.max(drawdowns)
        
        return self.penalty_factor * max_drawdown

class DirectionalAccuracyLoss(nn.Module):
    """Loss function for directional accuracy."""
    
def __init__(self, weight: float = 1.0):
        super().__init__()
        self.weight = weight
    
def forward(
        self,
        predictions: torch.Tensor,
        targets: torch.Tensor,
        metadata: Optional[Dict] = None
    ) -> torch.Tensor:
        """
        Calculate directional accuracy loss.
        
        Args:
            predictions: Predicted values
            targets: Actual values
            metadata: Optional metadata
            
        Returns:
            Directional accuracy loss
        """
        pred_direction = torch.sign(predictions)
        target_direction = torch.sign(targets)
        
        # Calculate directional accuracy
        correct_directions = (pred_direction == target_direction).float()
        directional_accuracy = torch.mean(correct_directions)
        
        # Return negative accuracy (we want to maximize accuracy)
        return self.weight * (1.0 - directional_accuracy)

class VolatilityPenaltyLoss(nn.Module):
    """Penalize excessive volatility in predictions."""
    
def __init__(self, penalty_factor: float = 0.1):
        super().__init__()
        self.penalty_factor = penalty_factor
    
def forward(
        self,
        predictions: torch.Tensor,
        targets: torch.Tensor,
        metadata: Optional[Dict] = None
    ) -> torch.Tensor:
        """Calculate volatility penalty."""
        if len(predictions) < 2:
            return torch.tensor(0.0, device=predictions.device, requires_grad=True)
        
        # Calculate volatility of predictions
        pred_volatility = torch.std(predictions)
        
        return self.penalty_factor * pred_volatility

class InformationRatioLoss(nn.Module):
    """Loss based on negative information ratio."""
    
def __init__(self, benchmark_return: float = 0.0):
        super().__init__()
        self.benchmark_return = benchmark_return
    
def forward(
        self,
        predictions: torch.Tensor,
        targets: torch.Tensor,
        metadata: Optional[Dict] = None
    ) -> torch.Tensor:
        """Calculate negative information ratio."""
        if len(predictions) < 2:
            return torch.tensor(0.0, device=predictions.device, requires_grad=True)
        
        # Active returns (predictions vs benchmark)
        active_returns = predictions.squeeze() - self.benchmark_return
        
        # Information ratio
        mean_active = torch.mean(active_returns)
        tracking_error = torch.std(active_returns)
        tracking_error = torch.clamp(tracking_error, min=1e-8)
        
        information_ratio = mean_active / tracking_error
        
        return -information_ratio

class TailRiskLoss(nn.Module):
    """Loss function for tail risk optimization."""
    
def __init__(self, quantile: float = 0.5, penalty_factor: float = 1.0):
        super().__init__()
        self.quantile = quantile
        self.penalty_factor = penalty_factor
    
def forward(
        self,
        predictions: torch.Tensor,
        targets: torch.Tensor,
        metadata: Optional[Dict] = None
    ) -> torch.Tensor:
        """Calculate tail risk loss using Value at Risk."""
        returns = predictions.squeeze()
        
        if len(returns) < 10:  # Need sufficient data for quantile
            return torch.tensor(0.0, device=predictions.device, requires_grad=True)
        
        # Calculate VaR using quantile
        var = torch.quantile(returns, self.quantile)
        
        # We want to minimize negative tail risk (maximize positive tail events)
        return self.penalty_factor * torch.abs(var)

class AntifragileRewardLoss(nn.Module):
    """Reward antifragile behavior (benefits from volatility)."""
    
def __init__(self, volatility_threshold: float = 0.2):
        super().__init__()
        self.volatility_threshold = volatility_threshold
    
def forward(
        self,
        predictions: torch.Tensor,
        targets: torch.Tensor,
        metadata: Optional[Dict] = None
    ) -> torch.Tensor:
        """Reward positive correlation between volatility and returns."""
        if len(predictions) < 10:
            return torch.tensor(0.0, device=predictions.device, requires_grad=True)
        
        returns = predictions.squeeze()
        
        # Calculate rolling volatility (simple proxy)
        if len(returns) >= 5:
            volatility_proxy = torch.abs(returns[1:] - returns[:-1])
            return_proxy = returns[1:]
            
            # Reward positive correlation between volatility and returns
            if len(volatility_proxy) > 1:
                correlation = torch.corrcoef(torch.stack([volatility_proxy, return_proxy]))[0, 1]
                if not torch.isnan(correlation):
                    return -correlation  # Negative because we want to maximize
        
        return torch.tensor(0.0, device=predictions.device, requires_grad=True)

class CompositeLoss(nn.Module):
    """Composite loss combining multiple financial objectives."""
    
def __init__(
        self,
        primary_loss: str = 'mse',
        weights: Optional[Dict[str, float]] = None,
        **kwargs
    ):
        super().__init__()
        
        # Default weights
        if weights is None:
            weights = {
                'prediction': 1.0,
                'sharpe': 0.3,
                'drawdown': 0.2,
                'directional': 0.1,
                'information_ratio': 0.1
            }
        
        self.weights = weights
        
        # Primary prediction loss
        self.primary_loss = self._get_primary_loss(primary_loss)
        
        # Financial losses
        self.sharpe_loss = SharpeRatioLoss()
        self.drawdown_loss = MaxDrawdownLoss()
        self.directional_loss = DirectionalAccuracyLoss()
        self.volatility_penalty = VolatilityPenaltyLoss()
        self.information_ratio_loss = InformationRatioLoss()
        self.tail_risk_loss = TailRiskLoss()
        self.antifragile_reward = AntifragileRewardLoss()
        
def _get_primary_loss(self, loss_name: str) -> nn.Module:
        """Get primary loss function."""
        loss_map = {
            'mse': nn.MSELoss(),
            'mae': nn.L1Loss(),
            'huber': nn.HuberLoss(),
            'smooth_l1': nn.SmoothL1Loss()
        }
        return loss_map.get(loss_name, nn.MSELoss())
    
def forward(
        self,
        predictions: torch.Tensor,
        targets: torch.Tensor,
        metadata: Optional[Dict] = None
    ) -> torch.Tensor:
        """Calculate composite loss."""
        total_loss = torch.tensor(0.0, device=predictions.device, requires_grad=True)
        
        # Primary prediction loss
        if 'prediction' in self.weights and self.weights['prediction'] > 0:
            pred_loss = self.primary_loss(predictions, targets)
            total_loss = total_loss + self.weights['prediction'] * pred_loss
        
        # Financial losses (only if we have enough data)
        batch_size = predictions.shape[0]
        
        if batch_size >= 10:  # Need sufficient data for financial metrics
            
            # Sharpe ratio loss
            if 'sharpe' in self.weights and self.weights['sharpe'] > 0:
                sharpe_loss = self.sharpe_loss(predictions, targets, metadata)
                total_loss = total_loss + self.weights['sharpe'] * sharpe_loss
            
            # Maximum drawdown loss
            if 'drawdown' in self.weights and self.weights['drawdown'] > 0:
                dd_loss = self.drawdown_loss(predictions, targets, metadata)
                total_loss = total_loss + self.weights['drawdown'] * dd_loss
            
            # Directional accuracy loss
            if 'directional' in self.weights and self.weights['directional'] > 0:
                dir_loss = self.directional_loss(predictions, targets, metadata)
                total_loss = total_loss + self.weights['directional'] * dir_loss
            
            # Information ratio loss
            if 'information_ratio' in self.weights and self.weights['information_ratio'] > 0:
                ir_loss = self.information_ratio_loss(predictions, targets, metadata)
                total_loss = total_loss + self.weights['information_ratio'] * ir_loss
            
            # Optional losses based on weights
            if 'volatility_penalty' in self.weights and self.weights['volatility_penalty'] > 0:
                vol_loss = self.volatility_penalty(predictions, targets, metadata)
                total_loss = total_loss + self.weights['volatility_penalty'] * vol_loss
            
            if 'tail_risk' in self.weights and self.weights['tail_risk'] > 0:
                tail_loss = self.tail_risk_loss(predictions, targets, metadata)
                total_loss = total_loss + self.weights['tail_risk'] * tail_loss
            
            if 'antifragile' in self.weights and self.weights['antifragile'] > 0:
                af_loss = self.antifragile_reward(predictions, targets, metadata)
                total_loss = total_loss + self.weights['antifragile'] * af_loss
        
        return total_loss

class QuantileLoss(nn.Module):
    """Quantile regression loss for uncertainty estimation."""
    
def __init__(self, quantiles: List[float] = [0.1, 0.5, 0.9]):
        super().__init__()
        self.quantiles = quantiles
    
def forward(
        self,
        predictions: torch.Tensor,
        targets: torch.Tensor,
        metadata: Optional[Dict] = None
    ) -> torch.Tensor:
        """
        Calculate quantile loss.
        
        Args:
            predictions: Tensor of shape (batch_size, num_quantiles)
            targets: Target values (batch_size,)
            
        Returns:
            Quantile loss
        """
        if predictions.shape[-1] != len(self.quantiles):
            raise ValueError(f"Expected {len(self.quantiles)} quantiles, got {predictions.shape[-1]}")
        
        targets = targets.unsqueeze(-1)  # (batch_size, 1)
        
        total_loss = torch.tensor(0.0, device=predictions.device)
        
        for i, q in enumerate(self.quantiles):
            pred_quantile = predictions[:, i:i+1]
            errors = targets - pred_quantile
            
            # Quantile loss
            loss = torch.max(q * errors, (q - 1) * errors)
            total_loss = total_loss + torch.mean(loss)
        
        return total_loss / len(self.quantiles)

class ContrastiveLoss(nn.Module):
    """Contrastive loss for regime-aware learning."""
    
def __init__(self, margin: float = 1.0, temperature: float = 0.1):
        super().__init__()
        self.margin = margin
        self.temperature = temperature
    
def forward(
        self,
        features: torch.Tensor,
        labels: torch.Tensor,
        metadata: Optional[Dict] = None
    ) -> torch.Tensor:
        """Calculate contrastive loss for similar/dissimilar regime pairs."""
        
        # Normalize features
        features = F.normalize(features, p=2, dim=1)
        
        # Calculate pairwise similarities
        similarity_matrix = torch.matmul(features, features.T) / self.temperature
        
        # Create positive and negative pairs based on labels
        labels = labels.unsqueeze(0)
        positive_mask = torch.eq(labels, labels.T).float()
        negative_mask = 1 - positive_mask
        
        # Remove diagonal (self-similarity)
        mask = torch.eye(labels.shape[1], device=labels.device)
        positive_mask = positive_mask * (1 - mask)
        negative_mask = negative_mask * (1 - mask)
        
        # Calculate loss
        positive_loss = -torch.log(torch.exp(similarity_matrix) * positive_mask + 1e-8)
        negative_loss = torch.log(torch.exp(similarity_matrix) * negative_mask + 1e-8)
        
        total_positive = torch.sum(positive_mask)
        total_negative = torch.sum(negative_mask)
        
        if total_positive > 0:
            positive_loss = torch.sum(positive_loss) / total_positive
        else:
            positive_loss = torch.tensor(0.0, device=features.device)
            
        if total_negative > 0:
            negative_loss = torch.sum(negative_loss) / total_negative
        else:
            negative_loss = torch.tensor(0.0, device=features.device)
        
        return positive_loss + negative_loss

# Example usage and testing
def test_loss_functions():
    """Test various loss functions."""
    
    # Generate sample data
    batch_size = 100
    predictions = torch.randn(batch_size, 1, requires_grad=True)
    targets = torch.randn(batch_size, 1)
    
    print("=" * 50)
    
    # Test individual losses
    losses = {
        'MSE': nn.MSELoss(),
        'Sharpe': SharpeRatioLoss(),
        'MaxDrawdown': MaxDrawdownLoss(),
        'Directional': DirectionalAccuracyLoss(),
        'InformationRatio': InformationRatioLoss(),
        'TailRisk': TailRiskLoss(),
        'AntifragileReward': AntifragileRewardLoss()
    }
    
    for name, loss_fn in losses.items():
        try:
            loss_value = loss_fn(predictions, targets)
            print(f"{name:<20}: {loss_value.item():.6f}")
        except Exception as e:
            print(f"{name:<20}: Error - {e}")
    
    print("-" * API_TIMEOUT_SECONDS)
    
    # Test composite loss
    composite_loss = CompositeLoss(
        primary_loss='mse',
        weights={
            'prediction': 1.0,
            'sharpe': 0.3,
            'drawdown': 0.2,
            'directional': 0.1
        }
    )
    
    comp_loss = composite_loss(predictions, targets)
    print(f"Composite Loss: {comp_loss.item():.6f}")
    
    # Test backward pass
    comp_loss.backward()
    print(f"Gradient computed successfully: {predictions.grad is not None}")
    
    # Test quantile loss
    print("-" * 20)
    
    quantile_predictions = torch.randn(batch_size, 3, requires_grad=True)  # 3 quantiles
    quantile_targets = torch.randn(batch_size)
    
    quantile_loss = QuantileLoss([0.1, 0.5, 0.9])
    q_loss = quantile_loss(quantile_predictions, quantile_targets)
    print(f"Quantile Loss: {q_loss.item():.6f}")

if __name__ == "__main__":
    test_loss_functions()