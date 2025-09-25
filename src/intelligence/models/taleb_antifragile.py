from src.constants.base import MAXIMUM_RETRY_ATTEMPTS

import torch
import torch.nn as nn
import torch.nn.functional as F
from typing import Dict, List, Optional, Tuple
import numpy as np
from scipy import stats

from .base_models import BaseRiskModel, ModelOutput, AttentionModule, ResidualBlock
from ..config import config

class TailRiskModule(nn.Module):
    """Module for extreme value theory and tail risk modeling."""
    
def __init__(self, input_dim: int, tail_dim: int = 32):
        super().__init__()
        self.tail_dim = tail_dim
        
        # Extreme value encoder
        self.extreme_encoder = nn.Sequential(
            nn.Linear(input_dim, tail_dim * 2),
            nn.ReLU(),
            nn.Dropout(0.1),
            nn.Linear(tail_dim * 2, tail_dim)
        )
        
        # Generalized Pareto Distribution parameters
        self.gpd_shape = nn.Sequential(
            nn.Linear(tail_dim, 16),
            nn.ReLU(),
            nn.Linear(16, 1),
            nn.Tanh()  # Shape parameter should be bounded
        )
        
        self.gpd_scale = nn.Sequential(
            nn.Linear(tail_dim, 16),
            nn.ReLU(), 
            nn.Linear(16, 1),
            nn.Softplus()  # Scale must be positive
        )
        
        # Tail index estimator
        self.tail_index = nn.Sequential(
            nn.Linear(tail_dim, 16),
            nn.ReLU(),
            nn.Linear(16, 1)
        )
        
        # Extreme event probability
        self.extreme_prob = nn.Sequential(
            nn.Linear(tail_dim, 16),
            nn.ReLU(),
            nn.Linear(16, 1),
            nn.Sigmoid()
        )
    
def forward(self, x: torch.Tensor) -> Dict[str, torch.Tensor]:
        """
        Model tail risk characteristics.
        
        Args:
            x: Input features (batch_size, seq_len, input_dim)
            
        Returns:
            Dictionary with tail risk parameters
        """
        # Encode extreme value features
        extreme_features = self.extreme_encoder(x.mean(dim=1))  # Average over time
        
        # Estimate GPD parameters
        shape = self.gpd_shape(extreme_features)
        scale = self.gpd_scale(extreme_features)
        
        # Estimate tail index (Hill estimator approximation)
        tail_idx = self.tail_index(extreme_features)
        
        # Probability of extreme events
        extreme_probability = self.extreme_prob(extreme_features)
        
        return {
            'tail_features': extreme_features,
            'gpd_shape': shape,
            'gpd_scale': scale,
            'tail_index': tail_idx,
            'extreme_probability': extreme_probability
        }

class VolatilitySmileModule(nn.Module):
    """Module for modeling volatility smile and skew effects."""
    
def __init__(self, input_dim: int, smile_dim: int = 24):
        super().__init__()
        self.smile_dim = smile_dim
        
        # Volatility surface encoder
        self.vol_encoder = nn.Sequential(
            nn.Linear(input_dim, 64),
            nn.ReLU(),
            nn.Dropout(0.1),
            nn.Linear(64, smile_dim)
        )
        
        # ATM volatility predictor
        self.atm_vol = nn.Sequential(
            nn.Linear(smile_dim, 16),
            nn.ReLU(),
            nn.Linear(16, 1),
            nn.Softplus()
        )
        
        # Skew predictor (25-delta risk reversal)
        self.skew = nn.Sequential(
            nn.Linear(smile_dim, 16),
            nn.ReLU(),
            nn.Linear(16, 1),
            nn.Tanh()
        )
        
        # Smile curvature (25-delta butterfly)
        self.curvature = nn.Sequential(
            nn.Linear(smile_dim, 16),
            nn.ReLU(),
            nn.Linear(16, 1),
            nn.Softplus()
        )
        
        # Term structure slope
        self.term_slope = nn.Sequential(
            nn.Linear(smile_dim, 16),
            nn.ReLU(),
            nn.Linear(16, 1)
        )
    
def forward(self, x: torch.Tensor) -> Dict[str, torch.Tensor]:
        """
        Model volatility smile characteristics.
        
        Args:
            x: Input features (batch_size, seq_len, input_dim)
            
        Returns:
            Dictionary with volatility smile parameters
        """
        # Encode volatility features
        vol_features = self.vol_encoder(x.mean(dim=1))
        
        # Predict smile parameters
        atm_volatility = self.atm_vol(vol_features)
        volatility_skew = self.skew(vol_features)
        smile_curvature = self.curvature(vol_features)
        term_structure_slope = self.term_slope(vol_features)
        
        return {
            'vol_features': vol_features,
            'atm_volatility': atm_volatility,
            'volatility_skew': volatility_skew,
            'smile_curvature': smile_curvature,
            'term_slope': term_structure_slope
        }

class AntifragilityModule(nn.Module):
    """Core antifragility detection and scoring module."""
    
def __init__(self, input_dim: int, antifragile_dim: int = 48):
        super().__init__()
        self.antifragile_dim = antifragile_dim
        
        # Antifragility feature extractor
        self.antifragile_encoder = nn.Sequential(
            nn.Linear(input_dim, antifragile_dim * 2),
            nn.ReLU(),
            nn.Dropout(0.15),
            ResidualBlock(antifragile_dim * 2),
            nn.Linear(antifragile_dim * 2, antifragile_dim)
        )
        
        # Convexity detector (benefits from volatility)
        self.convexity_detector = nn.Sequential(
            nn.Linear(antifragile_dim, 32),
            nn.ReLU(),
            nn.Linear(32, 1),
            nn.Tanh()
        )
        
        # Stress test performance predictor
        self.stress_performance = nn.Sequential(
            nn.Linear(antifragile_dim, 32),
            nn.ReLU(),
            nn.Linear(32, 1)
        )
        
        # Barbell strategy indicator
        self.barbell_indicator = nn.Sequential(
            nn.Linear(antifragile_dim, 16),
            nn.ReLU(),
            nn.Linear(16, 1),
            nn.Sigmoid()
        )
        
        # Option-like payoff detector
        self.option_payoff = nn.Sequential(
            nn.Linear(antifragile_dim, 24),
            nn.ReLU(),
            nn.Linear(24, 3),  # Call-like, Put-like, Straddle-like
            nn.Softmax(dim=-1)
        )
        
        # Black swan protection score
        self.black_swan_protection = nn.Sequential(
            nn.Linear(antifragile_dim, 16),
            nn.ReLU(),
            nn.Linear(16, 1),
            nn.Sigmoid()
        )
    
def forward(self, x: torch.Tensor, volatility: Optional[torch.Tensor] = None) -> Dict[str, torch.Tensor]:
        """
        Assess antifragility characteristics.
        
        Args:
            x: Input features (batch_size, seq_len, input_dim)
            volatility: Optional volatility tensor
            
        Returns:
            Dictionary with antifragility metrics
        """
        # Extract antifragility features
        antifragile_features = self.antifragile_encoder(x.mean(dim=1))
        
        # Detect convexity (positive response to volatility)
        convexity_score = self.convexity_detector(antifragile_features)
        
        # Predict performance under stress
        stress_perf = self.stress_performance(antifragile_features)
        
        # Barbell strategy detection
        barbell_score = self.barbell_indicator(antifragile_features)
        
        # Option-like payoff classification
        option_classification = self.option_payoff(antifragile_features)
        
        # Black swan protection
        protection_score = self.black_swan_protection(antifragile_features)
        
        # Composite antifragility score
        antifragility_score = (
            convexity_score * 0.3 +
            (stress_perf > 0).float() * 0.2 +
            barbell_score * 0.2 +
            option_classification[:, 0:1] * 0.15 +  # Call-like payoff
            protection_score * 0.15
        )
        
        return {
            'antifragile_features': antifragile_features,
            'convexity_score': convexity_score,
            'stress_performance': stress_perf,
            'barbell_score': barbell_score,
            'option_classification': option_classification,
            'black_swan_protection': protection_score,
            'antifragility_score': antifragility_score
        }

class AntifragileRiskModel(BaseRiskModel):
    """Comprehensive antifragile risk assessment model."""
    
def __init__(self, input_dim: int, hidden_dim: int = 256):
        super().__init__(input_dim)
        self.hidden_dim = hidden_dim
        
        # Core modules
        self.tail_risk = TailRiskModule(input_dim)
        self.vol_smile = VolatilitySmileModule(input_dim)
        self.antifragile = AntifragilityModule(input_dim)
        
        # Risk integration network
        self.risk_integrator = nn.Sequential(
            nn.Linear(32 + 24 + 48, hidden_dim),  # tail_dim + smile_dim + antifragile_dim
            nn.ReLU(),
            nn.Dropout(0.1),
            ResidualBlock(hidden_dim),
            ResidualBlock(hidden_dim)
        )
        
        # VaR predictors for different confidence levels
        self.var_predictors = nn.ModuleDict({
            'var_95': nn.Linear(hidden_dim, 1),
            'var_99': nn.Linear(hidden_dim, 1),
            'var_995': nn.Linear(hidden_dim, 1)
        })
        
        # Expected Shortfall predictors
        self.es_predictors = nn.ModuleDict({
            'es_95': nn.Linear(hidden_dim, 1),
            'es_99': nn.Linear(hidden_dim, 1),
            'es_995': nn.Linear(hidden_dim, 1)
        })
        
        # Maximum Drawdown predictor
        self.max_drawdown = nn.Sequential(
            nn.Linear(hidden_dim, 32),
            nn.ReLU(),
            nn.Linear(32, 1),
            nn.Sigmoid()
        )
        
        # Sharpe ratio predictor (risk-adjusted return)
        self.sharpe_predictor = nn.Sequential(
            nn.Linear(hidden_dim, 32),
            nn.ReLU(),
            nn.Linear(32, 1)
        )
        
def forward(self, x: torch.Tensor) -> Dict[str, torch.Tensor]:
        """
        Comprehensive risk assessment.
        
        Args:
            x: Input features (batch_size, seq_len, input_dim)
            
        Returns:
            Dictionary with comprehensive risk metrics
        """
        # Extract risk features from all modules
        tail_info = self.tail_risk(x)
        vol_info = self.vol_smile(x)
        antifragile_info = self.antifragile(x)
        
        # Combine all risk features
        combined_features = torch.cat([
            tail_info['tail_features'],
            vol_info['vol_features'],
            antifragile_info['antifragile_features']
        ], dim=-1)
        
        # Integrate risk features
        risk_features = self.risk_integrator(combined_features)
        
        # Predict various risk metrics
        risk_metrics = {}
        
        # VaR predictions
        for level, predictor in self.var_predictors.items():
            risk_metrics[level] = predictor(risk_features)
        
        # Expected Shortfall predictions
        for level, predictor in self.es_predictors.items():
            risk_metrics[level] = predictor(risk_features)
        
        # Additional risk metrics
        risk_metrics['max_drawdown'] = self.max_drawdown(risk_features)
        risk_metrics['sharpe_ratio'] = self.sharpe_predictor(risk_features)
        
        # Add module-specific outputs
        risk_metrics.update({
            'tail_index': tail_info['tail_index'],
            'extreme_probability': tail_info['extreme_probability'],
            'atm_volatility': vol_info['atm_volatility'],
            'volatility_skew': vol_info['volatility_skew'],
            'antifragility_score': antifragile_info['antifragility_score'],
            'black_swan_protection': antifragile_info['black_swan_protection']
        })
        
        return risk_metrics
    
def calculate_var(self, x: torch.Tensor, confidence_level: float = 0.5) -> torch.Tensor:
        """Calculate Value at Risk."""
        risk_metrics = self.forward(x)
        
        # Map confidence level to available VaR predictions
        if confidence_level <= 0.5:
            return risk_metrics['var_995']
        elif confidence_level <= 0.1:
            return risk_metrics['var_99']
        else:
            return risk_metrics['var_95']
    
def calculate_expected_shortfall(self, x: torch.Tensor, confidence_level: float = 0.5) -> torch.Tensor:
        """Calculate Expected Shortfall (Conditional VaR)."""
        risk_metrics = self.forward(x)
        
        # Map confidence level to available ES predictions
        if confidence_level <= 0.5:
            return risk_metrics['es_995']
        elif confidence_level <= 0.1:
            return risk_metrics['es_99']
        else:
            return risk_metrics['es_95']

class TailRiskPredictor(nn.Module):
    """Specialized model for extreme event prediction."""
    
def __init__(self, input_dim: int, sequence_length: int = 60):
        super().__init__()
        self.input_dim = input_dim
        self.sequence_length = sequence_length
        
        # Temporal feature extraction
        self.temporal_encoder = nn.LSTM(
            input_size=input_dim,
            hidden_size=128,
            num_layers=3,
            batch_first=True,
            dropout=0.2
        )
        
        # Attention for extreme event patterns
        self.extreme_attention = AttentionModule(128, num_heads=8)
        
        # Extreme event classifiers
        self.crash_predictor = nn.Sequential(
            nn.Linear(128, 64),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(64, 1),
            nn.Sigmoid()
        )
        
        self.spike_predictor = nn.Sequential(
            nn.Linear(128, 64),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(64, 1),
            nn.Sigmoid()
        )
        
        # Time to extreme event
        self.time_to_extreme = nn.Sequential(
            nn.Linear(128, 32),
            nn.ReLU(),
            nn.Linear(32, 1),
            nn.Softplus()  # Positive time values
        )
        
        # Magnitude predictor
        self.magnitude_predictor = nn.Sequential(
            nn.Linear(128, 32),
            nn.ReLU(),
            nn.Linear(32, 1)
        )
    
def forward(self, x: torch.Tensor) -> Dict[str, torch.Tensor]:
        """
        Predict tail events and their characteristics.
        
        Args:
            x: Input features (batch_size, seq_len, input_dim)
            
        Returns:
            Dictionary with tail event predictions
        """
        # Extract temporal features
        lstm_out, _ = self.temporal_encoder(x)
        
        # Apply attention to focus on extreme event patterns
        attended_features, attention_weights = self.extreme_attention(lstm_out)
        
        # Use final time step features
        final_features = attended_features[:, -1, :]
        
        # Predict extreme events
        crash_prob = self.crash_predictor(final_features)
        spike_prob = self.spike_predictor(final_features)
        time_to_event = self.time_to_extreme(final_features)
        event_magnitude = self.magnitude_predictor(final_features)
        
        return {
            'crash_probability': crash_prob,
            'spike_probability': spike_prob,
            'time_to_extreme': time_to_event,
            'event_magnitude': event_magnitude,
            'extreme_attention': attention_weights,
            'temporal_features': attended_features
        }

class BlackSwanDetector(nn.Module):
    """Detector for black swan events using Taleb's criteria."""
    
def __init__(self, input_dim: int):
        super().__init__()
        
        # Feature encoder for black swan characteristics
        self.feature_encoder = nn.Sequential(
            nn.Linear(input_dim, 128),
            nn.ReLU(),
            nn.Dropout(0.1),
            nn.Linear(128, 64)
        )
        
        # Outlier detection (statistical surprise)
        self.outlier_detector = nn.Sequential(
            nn.Linear(64, 32),
            nn.ReLU(),
            nn.Linear(32, 1),
            nn.Sigmoid()
        )
        
        # Impact magnitude
        self.impact_predictor = nn.Sequential(
            nn.Linear(64, 32),
            nn.ReLU(),
            nn.Linear(32, 1),
            nn.Softplus()
        )
        
        # Narrative construction potential
        self.narrative_score = nn.Sequential(
            nn.Linear(64, 16),
            nn.ReLU(),
            nn.Linear(16, 1),
            nn.Sigmoid()
        )
    
def forward(self, x: torch.Tensor) -> Dict[str, torch.Tensor]:
        """Detect potential black swan characteristics."""
        features = self.feature_encoder(x.mean(dim=1))
        
        # Three pillars of black swan events
        outlier_score = self.outlier_detector(features)  # Outlier
        impact_score = self.impact_predictor(features)   # Extreme impact
        narrative_score = self.narrative_score(features) # Retrospective predictability
        
        # Composite black swan score
        black_swan_score = (outlier_score * impact_score * narrative_score) ** (1/MAXIMUM_RETRY_ATTEMPTS)
        
        return {
            'black_swan_score': black_swan_score,
            'outlier_score': outlier_score,
            'impact_score': impact_score,
            'narrative_score': narrative_score
        }

# Example usage and testing
def test_antifragile_models():
    """Test antifragile risk models."""
    # Create sample data
    batch_size, seq_len, input_dim = 32, 60, 50
    x = torch.randn(batch_size, seq_len, input_dim)
    
    # Test Antifragile Risk Model
    risk_model = AntifragileRiskModel(input_dim=input_dim)
    risk_output = risk_model(x)
    
    print(f"Antifragile Risk Model Output:")
    for key, value in risk_output.items():
        print(f"{key}: {value.shape}")
    
    # Test VaR and ES calculations
    var_95 = risk_model.calculate_var(x, confidence_level=0.5)
    es_95 = risk_model.calculate_expected_shortfall(x, confidence_level=0.5)
    
    print(f"\nVaR 95%: {var_95.shape}")
    print(f"ES 95%: {es_95.shape}")
    
    # Test Tail Risk Predictor
    tail_predictor = TailRiskPredictor(input_dim=input_dim)
    tail_output = tail_predictor(x)
    
    print(f"\nTail Risk Predictor Output:")
    for key, value in tail_output.items():
        print(f"{key}: {value.shape}")
    
    # Test Black Swan Detector
    black_swan = BlackSwanDetector(input_dim=input_dim)
    bs_output = black_swan(x)
    
    print(f"\nBlack Swan Detector Output:")
    for key, value in bs_output.items():
        print(f"{key}: {value.shape}")

if __name__ == "__main__":
    test_antifragile_models()