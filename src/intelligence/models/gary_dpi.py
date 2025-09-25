from src.constants.base import MAXIMUM_NESTED_DEPTH, MAXIMUM_RETRY_ATTEMPTS

import torch
import torch.nn as nn
import torch.nn.functional as F
from typing import Dict, List, Optional, Tuple
import numpy as np

from .base_models import BasePredictor, ModelOutput, AttentionModule, ResidualBlock, GatedLinearUnit
from ..config import config

class DynamicCorrelationModule(nn.Module):
    """Module for learning dynamic correlations between assets and features."""
    
    def __init__(self, input_dim: int, correlation_dim: int = 64):
        super().__init__()
        self.input_dim = input_dim
        self.correlation_dim = correlation_dim
        
        # Correlation learning networks
        self.correlation_encoder = nn.Sequential(
            nn.Linear(input_dim, correlation_dim * 2),
            nn.ReLU(),
            nn.Dropout(0.1),
            nn.Linear(correlation_dim * 2, correlation_dim),
            nn.Tanh()
        )
        
        # Dynamic correlation matrix generator
        self.correlation_generator = nn.Sequential(
            nn.Linear(correlation_dim, correlation_dim * correlation_dim),
            nn.Tanh()
        )
        
    def forward(self, x: torch.Tensor) -> Tuple[torch.Tensor, torch.Tensor]:
        """
        Learn dynamic correlations.
        
        Args:
            x: Input features (batch_size, seq_len, input_dim)
            
        Returns:
            correlation_features: Enhanced features with correlation info
            correlation_matrix: Dynamic correlation matrix
        """
        batch_size, seq_len, _ = x.shape
        
        # Encode correlations
        corr_encoding = self.correlation_encoder(x)  # (batch, seq_len, corr_dim)
        
        # Generate dynamic correlation matrix
        corr_flat = self.correlation_generator(corr_encoding.mean(dim=1))  # Average over time
        correlation_matrix = corr_flat.view(batch_size, self.correlation_dim, self.correlation_dim)
        
        # Make correlation matrix symmetric and bounded
        correlation_matrix = (correlation_matrix + correlation_matrix.transpose(-2, -1)) / 2
        correlation_matrix = torch.tanh(correlation_matrix)
        
        # Apply correlation to features
        correlation_features = torch.matmul(corr_encoding, correlation_matrix)
        
        return correlation_features, correlation_matrix

class RegimeDetectionModule(nn.Module):
    """Module for detecting market regimes and regime transitions."""
    
    def __init__(self, input_dim: int, num_regimes: int = 4):
        super().__init__()
        self.num_regimes = num_regimes
        
        # Regime detection network
        self.regime_detector = nn.Sequential(
            nn.Linear(input_dim, 128),
            nn.ReLU(),
            nn.Dropout(0.15),
            nn.Linear(128, 64),
            nn.ReLU(),
            nn.Linear(64, num_regimes),
            nn.Softmax(dim=-1)
        )
        
        # Regime-specific feature extractors
        self.regime_experts = nn.ModuleList([
            nn.Sequential(
                nn.Linear(input_dim, 64),
                nn.ReLU(),
                nn.Linear(64, 64),
                nn.ReLU()
            ) for _ in range(num_regimes)
        ])
        
        # Regime transition predictor
        self.transition_predictor = nn.GRU(
            input_size=num_regimes,
            hidden_size=32,
            batch_first=True
        )
        
    def forward(self, x: torch.Tensor) -> Dict[str, torch.Tensor]:
        """
        Detect regimes and generate regime-aware features.
        
        Args:
            x: Input features (batch_size, seq_len, input_dim)
            
        Returns:
            Dictionary with regime probabilities, features, and transitions
        """
        batch_size, seq_len, input_dim = x.shape
        
        # Detect regimes for each time step
        regime_probs = self.regime_detector(x)  # (batch, seq_len, num_regimes)
        
        # Generate regime-specific features
        regime_features = []
        for i, expert in enumerate(self.regime_experts):
            expert_features = expert(x)  # (batch, seq_len, 64)
            regime_features.append(expert_features)
        
        regime_features = torch.stack(regime_features, dim=-2)  # (batch, seq_len, num_regimes, 64)
        
        # Weight features by regime probabilities
        regime_probs_expanded = regime_probs.unsqueeze(-1)  # (batch, seq_len, num_regimes, 1)
        weighted_features = (regime_features * regime_probs_expanded).sum(dim=-2)  # (batch, seq_len, 64)
        
        # Predict regime transitions
        transition_output, _ = self.transition_predictor(regime_probs)
        
        return {
            'regime_probabilities': regime_probs,
            'regime_features': weighted_features,
            'transition_predictions': transition_output,
            'regime_uncertainty': torch.std(regime_probs, dim=-1)
        }

class MomentumPersistenceModule(nn.Module):
    """Module for learning momentum persistence patterns."""
    
    def __init__(self, input_dim: int, momentum_dim: int = 32):
        super().__init__()
        self.momentum_dim = momentum_dim
        
        # Momentum feature extractor
        self.momentum_encoder = nn.Sequential(
            nn.Linear(input_dim, momentum_dim * 2),
            nn.ReLU(),
            nn.Linear(momentum_dim * 2, momentum_dim)
        )
        
        # Persistence predictor
        self.persistence_predictor = nn.LSTM(
            input_size=momentum_dim,
            hidden_size=momentum_dim,
            num_layers=2,
            batch_first=True,
            dropout=0.1
        )
        
        # Momentum strength calculator
        self.momentum_strength = nn.Sequential(
            nn.Linear(momentum_dim, 16),
            nn.ReLU(),
            nn.Linear(16, 1),
            nn.Sigmoid()
        )
        
    def forward(self, x: torch.Tensor, returns: Optional[torch.Tensor] = None) -> Dict[str, torch.Tensor]:
        """
        Learn momentum persistence.
        
        Args:
            x: Input features (batch_size, seq_len, input_dim)
            returns: Optional returns for momentum calculation
            
        Returns:
            Dictionary with momentum features and persistence scores
        """
        # Extract momentum features
        momentum_features = self.momentum_encoder(x)
        
        # Learn persistence patterns
        persistence_output, _ = self.persistence_predictor(momentum_features)
        
        # Calculate momentum strength
        momentum_strength = self.momentum_strength(persistence_output)
        
        # Calculate directional momentum if returns provided
        directional_momentum = None
        if returns is not None:
            # Simple momentum calculation
            momentum_window = min(10, returns.shape[1])
            if returns.shape[1] >= momentum_window:
                directional_momentum = returns[:, -momentum_window:].mean(dim=1, keepdim=True)
                directional_momentum = directional_momentum.expand(-1, x.shape[1])
        
        return {
            'momentum_features': momentum_features,
            'persistence_scores': momentum_strength,
            'persistence_patterns': persistence_output,
            'directional_momentum': directional_momentum
        }

class WealthFlowTracker:
    """
    Simple wealth flow tracking for Follow the Flow principle.
    Tracks who benefits from price changes and wealth concentration patterns.
    """

    @staticmethod
    def track_wealth_flow(income_data: Dict, asset_prices: Dict) -> float:
        """
        [SECURITY WARNING] Simple wealth flow tracking - NOT FOR PRODUCTION

        This is a simplified demonstration implementation. Real wealth flow analysis
        requires comprehensive economic data, regulatory compliance, and careful validation.

        WARNING: Not suitable for actual financial decision making.

        Args:
            income_data: Dict with income distribution percentages (demo data only)
            asset_prices: Dict with asset price changes (demo/simulation data)

        Returns:
            flow_score: 0-1 concentration score (demonstration purposes only)
        """
        try:
            # Calculate wealth concentration ratio
            high_income_share = income_data.get('high_income', 0.1)  # Top 10% default
            total_asset_gains = sum(max(0, change) for change in asset_prices.values())

            if total_asset_gains == 0:
                return 0.0

            # Simple wealth flow calculation
            asset_benefit_concentration = 0.0

            for symbol, price_change in asset_prices.items():
                if price_change > 0:
                    # Assume assets like stocks benefit higher income groups more
                    if symbol.upper() in ['SPY', 'QQQ', 'VTI', 'AMDY', 'ULTY']:
                        asset_benefit_concentration += price_change * high_income_share
                    else:
                        # Other assets benefit more evenly
                        asset_benefit_concentration += price_change * 0.5

            # Normalize concentration score
            concentration_ratio = asset_benefit_concentration / total_asset_gains

            # Flow score: higher when wealth flows to fewer people
            flow_score = min(1.0, concentration_ratio * 2.0)

            return flow_score

        except Exception:
            return 0.0

class DynamicPortfolioModel(BasePredictor):
    """Gary's Dynamic Portfolio Intelligence model."""

    def __init__(
        self,
        input_dim: int,
        hidden_dim: int = 256,
        num_regimes: int = 4,
        correlation_dim: int = 64,
        num_heads: int = 8
    ):
        super().__init__(input_dim, hidden_dim)
        
        self.num_regimes = num_regimes
        self.correlation_dim = correlation_dim
        
        # Core DPI modules
        self.correlation_module = DynamicCorrelationModule(input_dim, correlation_dim)
        self.regime_module = RegimeDetectionModule(input_dim, num_regimes)
        self.momentum_module = MomentumPersistenceModule(input_dim)
        
        # Attention mechanism for temporal dependencies
        self.temporal_attention = AttentionModule(hidden_dim, num_heads)
        
        # Feature fusion network
        total_feature_dim = input_dim + correlation_dim + 64 + 32  # Original + correlation + regime + momentum
        self.feature_fusion = nn.Sequential(
            nn.Linear(total_feature_dim, hidden_dim * 2),
            nn.ReLU(),
            nn.Dropout(0.1),
            ResidualBlock(hidden_dim * 2),
            ResidualBlock(hidden_dim * 2),
            nn.Linear(hidden_dim * 2, hidden_dim)
        )
        
        # DPI-specific layers
        self.dpi_processor = nn.ModuleList([
            GatedLinearUnit(hidden_dim, hidden_dim),
            GatedLinearUnit(hidden_dim, hidden_dim)
        ])
        
        # Output layers
        self.price_predictor = nn.Sequential(
            nn.Linear(hidden_dim, hidden_dim // 2),
            nn.ReLU(),
            nn.Dropout(0.1),
            nn.Linear(hidden_dim // 2, 1)
        )
        
        self.confidence_predictor = nn.Sequential(
            nn.Linear(hidden_dim, hidden_dim // 4),
            nn.ReLU(),
            nn.Linear(hidden_dim // 4, 1),
            nn.Sigmoid()
        )
        
        # Risk assessment
        self.risk_predictor = nn.Sequential(
            nn.Linear(hidden_dim, 32),
            nn.ReLU(),
            nn.Linear(32, 1),
            nn.Softplus()  # Ensures positive risk values
        )
        
        # Initialize weights
        self.apply(self._init_weights)
        
    def _init_weights(self, module):
        """Initialize model weights."""
        if isinstance(module, nn.Linear):
            nn.init.kaiming_uniform_(module.weight, mode='fan_in', nonlinearity='relu')
            if module.bias is not None:
                nn.init.constant_(module.bias, 0)
    
    def forward(self, x: torch.Tensor) -> ModelOutput:
        """
        Forward pass through DPI model.
        
        Args:
            x: Input features (batch_size, seq_len, input_dim)
            
        Returns:
            ModelOutput with predictions, confidence, and attention weights
        """
        batch_size, seq_len, input_dim = x.shape
        
        # Extract DPI features
        correlation_features, correlation_matrix = self.correlation_module(x)
        regime_info = self.regime_module(x)
        momentum_info = self.momentum_module(x)
        
        # Concatenate all features
        all_features = torch.cat([
            x,
            correlation_features,
            regime_info['regime_features'],
            momentum_info['momentum_features']
        ], dim=-1)
        
        # Fuse features
        fused_features = self.feature_fusion(all_features)
        
        # Apply temporal attention
        attended_features, attention_weights = self.temporal_attention(fused_features)
        
        # Process through DPI-specific layers
        dpi_features = attended_features
        for layer in self.dpi_processor:
            dpi_features = layer(dpi_features)
        
        # Generate predictions (use last time step)
        final_features = dpi_features[:, -1, :]  # (batch_size, hidden_dim)
        
        predictions = self.price_predictor(final_features)
        confidence = self.confidence_predictor(final_features)
        risk_estimate = self.risk_predictor(final_features)
        
        return ModelOutput(
            predictions=predictions,
            confidence=confidence,
            attention_weights=attention_weights,
            hidden_states=dpi_features,
            metadata={
                'correlation_matrix': correlation_matrix,
                'regime_probabilities': regime_info['regime_probabilities'],
                'momentum_strength': momentum_info['persistence_scores'],
                'risk_estimate': risk_estimate,
                'regime_uncertainty': regime_info['regime_uncertainty']
            }
        )
    
    def calculate_enhanced_dpi(self, x: torch.Tensor, income_data: Dict = None, related_assets: List[str] = None) -> Dict[str, torch.Tensor]:
        """
        Calculate DPI enhanced with wealth flow tracking
        
        Args:
            x: Input features (batch_size, seq_len, input_dim)
            income_data: Income distribution data (optional)
            related_assets: Related assets for flow analysis (optional)
            
        Returns:
            Dict with base_dpi, enhanced_dpi, flow_score, and other metrics
        """
        self.eval()
        with torch.no_grad():
            # Get base DPI prediction
            base_output = self.forward(x)
            base_dpi = base_output.predictions
            
            # Default income data if not provided
            if income_data is None:
                income_data = {
                    'high_income': 0.1,    # Top 10%
                    'middle_income': 0.4,  # Middle 40%
                    'low_income': 0.5      # Bottom 50%
                }
            
            # Simulate asset price changes for flow analysis
            if related_assets is None:
                related_assets = ['SPY', 'QQQ', 'ULTY', 'AMDY']
            
            # [SECURITY WARNING] Previous implementation used hardcoded random values
            import warnings
            warnings.warn("Asset price simulation uses fixed seed - NOT for production use. "
                        "This is demonstration code only.", UserWarning)

            # Honest implementation - clearly marked as simulation
            import random
            random.seed(42)  # Reproducible for demo ONLY - change for production
            asset_prices = {}
            for asset in related_assets:
                # SIMULATION ONLY: Not real price data
                base_change = float(base_dpi.mean().item()) * 0.1
                noise = random.uniform(-0.2, 0.2)
                asset_prices[asset] = base_change + noise
            
            # Calculate wealth flow score
            flow_score = WealthFlowTracker.track_wealth_flow(income_data, asset_prices)
            
            # Enhance DPI with flow score
            flow_tensor = torch.tensor(flow_score, device=base_dpi.device, dtype=base_dpi.dtype)
            enhanced_dpi = base_dpi * (1 + flow_tensor)
            
            return {
                'base_dpi': base_dpi,
                'enhanced_dpi': enhanced_dpi,
                'flow_score': flow_tensor,
                'asset_prices': asset_prices,
                'income_data': income_data,
                'confidence': base_output.confidence,
                'risk_estimate': base_output.metadata['risk_estimate'],
                'regime_probabilities': base_output.metadata['regime_probabilities'][:, -1, :]
            }

    def predict(self, x: torch.Tensor) -> Dict[str, torch.Tensor]:
        """Generate comprehensive predictions."""
        self.eval()
        with torch.no_grad():
            output = self.forward(x)
            
            # Calculate prediction intervals
            risk = output.metadata['risk_estimate']
            predictions = output.predictions
            confidence = output.confidence
            
            # 95% prediction intervals
            lower_bound = predictions - 1.96 * risk * (1 - confidence)
            upper_bound = predictions + 1.96 * risk * (1 - confidence)
            
            return {
                'predictions': predictions,
                'confidence': confidence,
                'lower_bound': lower_bound,
                'upper_bound': upper_bound,
                'risk_estimate': risk,
                'regime_probabilities': output.metadata['regime_probabilities'][:, -1, :],  # Last time step
                'momentum_strength': output.metadata['momentum_strength'][:, -1, :],
                'attention_weights': output.attention_weights
            }

class GaryTalebPredictor(BasePredictor):
    """Combined Gary DPI and Taleb principles predictor."""
    
    def __init__(
        self,
        input_dim: int,
        hidden_dim: int = 256,
        num_regimes: int = 4,
        tail_quantiles: List[float] = [0.5, 0.95]
    ):
        super().__init__(input_dim, hidden_dim)
        
        self.tail_quantiles = tail_quantiles
        
        # Gary DPI component
        self.dpi_model = DynamicPortfolioModel(
            input_dim=input_dim,
            hidden_dim=hidden_dim,
            num_regimes=num_regimes
        )
        
        # Taleb antifragility enhancement
        self.antifragile_enhancer = nn.Sequential(
            nn.Linear(hidden_dim, hidden_dim // 2),
            nn.ReLU(),
            nn.Linear(hidden_dim // 2, hidden_dim // 2),
            nn.Tanh()  # Bounded activation for stability
        )
        
        # Tail risk predictors
        self.tail_predictors = nn.ModuleDict({
            f'tail_{int(q*100)}': nn.Sequential(
                nn.Linear(hidden_dim + hidden_dim // 2, 32),
                nn.ReLU(),
                nn.Linear(32, 1)
            ) for q in tail_quantiles
        })
        
        # Antifragility score predictor
        self.antifragility_score = nn.Sequential(
            nn.Linear(hidden_dim + hidden_dim // 2, 64),
            nn.ReLU(),
            nn.Dropout(0.1),
            nn.Linear(64, 1),
            nn.Tanh()  # Score between -1 and 1
        )
        
    def forward(self, x: torch.Tensor) -> ModelOutput:
        """Forward pass combining Gary DPI with Taleb principles."""
        # Get DPI predictions
        dpi_output = self.dpi_model(x)
        
        # Extract features for antifragility enhancement
        dpi_features = dpi_output.hidden_states[:, -1, :]  # Last time step
        
        # Apply antifragility enhancement
        antifragile_features = self.antifragile_enhancer(dpi_features)
        
        # Combine features
        combined_features = torch.cat([dpi_features, antifragile_features], dim=-1)
        
        # Predict tail risks
        tail_predictions = {}
        for q in self.tail_quantiles:
            key = f'tail_{int(q*100)}'
            tail_predictions[key] = self.tail_predictors[key](combined_features)
        
        # Calculate antifragility score
        antifragility = self.antifragility_score(combined_features)
        
        # Adjust main prediction based on antifragility
        adjusted_predictions = dpi_output.predictions * (1 + 0.1 * antifragility)
        
        # Enhanced metadata
        enhanced_metadata = dpi_output.metadata.copy()
        enhanced_metadata.update({
            'tail_predictions': tail_predictions,
            'antifragility_score': antifragility,
            'dpi_predictions': dpi_output.predictions
        })
        
        return ModelOutput(
            predictions=adjusted_predictions,
            confidence=dpi_output.confidence,
            attention_weights=dpi_output.attention_weights,
            hidden_states=combined_features.unsqueeze(1),
            metadata=enhanced_metadata
        )
    
    def predict(self, x: torch.Tensor) -> Dict[str, torch.Tensor]:
        """Generate comprehensive GaryTaleb predictions."""
        self.eval()
        with torch.no_grad():
            output = self.forward(x)
            
            predictions = {
                'main_prediction': output.predictions,
                'confidence': output.confidence,
                'antifragility_score': output.metadata['antifragility_score'],
                'dpi_prediction': output.metadata['dpi_predictions'],
                'regime_probabilities': output.metadata['regime_probabilities'][:, -1, :],
                'risk_estimate': output.metadata['risk_estimate']
            }
            
            # Add tail predictions
            for key, value in output.metadata['tail_predictions'].items():
                predictions[key] = value
            
            # Calculate prediction intervals using tail predictions
            if 'tail_5' in output.metadata['tail_predictions']:
                predictions['lower_bound'] = output.metadata['tail_predictions']['tail_5']
            if 'tail_95' in output.metadata['tail_predictions']:
                predictions['upper_bound'] = output.metadata['tail_predictions']['tail_95']
            
            return predictions

# Example usage and testing
def test_wealth_flow_tracking():
    """Test wealth flow tracking functionality."""
    
    # Test case 1: High concentration scenario
    income_data_high_concentration = {
        'high_income': 0.2,   # Top 20% have more income
        'middle_income': 0.3, # Middle 30%
        'low_income': 0.5     # Bottom 50%
    }
    
    asset_prices_bullish = {
        'SPY': 0.5,   # Stock market up 5%
        'QQQ': 0.8,   # Tech stocks up 8%
        'ULTY': 0.3,  # Real estate up 3%
        'BONDS': 0.1  # Bonds up 1%
    }
    
    flow_score_high = WealthFlowTracker.track_wealth_flow(income_data_high_concentration, asset_prices_bullish)
    print(f"High concentration scenario flow score: {flow_score_high:.4f}")
    
    # Test case 2: Low concentration scenario
    income_data_low_concentration = {
        'high_income': 0.5,  # Top 5% have less income
        'middle_income': 0.45, # Middle 45%
        'low_income': 0.5     # Bottom 50%
    }
    
    flow_score_low = WealthFlowTracker.track_wealth_flow(income_data_low_concentration, asset_prices_bullish)
    print(f"Low concentration scenario flow score: {flow_score_low:.4f}")
    
    # Test case MAXIMUM_RETRY_ATTEMPTS: No gains scenario
    asset_prices_flat = {
        'SPY': 0.0,
        'QQQ': 0.0,
        'ULTY': 0.0,
        'BONDS': 0.0
    }
    
    flow_score_flat = WealthFlowTracker.track_wealth_flow(income_data_high_concentration, asset_prices_flat)
    print(f"No gains scenario flow score: {flow_score_flat:.4f}")
    
    # Verify expected behavior
    assert flow_score_high > flow_score_low, "High concentration should have higher flow score"
    assert flow_score_flat == 0.0, "No gains should result in zero flow score"
    assert 0.0 <= flow_score_high <= 1.0, "Flow score should be between 0 and 1"
    
    return True

def test_enhanced_dpi():
    """Test enhanced DPI calculation with wealth flow."""
    
    # Create sample data
    batch_size, seq_len, input_dim = 2, 10, 50  # Smaller for testing
    x = torch.randn(batch_size, seq_len, input_dim)
    
    # Test Enhanced DPI
    dpi_model = DynamicPortfolioModel(input_dim=input_dim, hidden_dim=64)  # Smaller for testing
    enhanced_results = dpi_model.calculate_enhanced_dpi(x)
    
    print(f"Enhanced DPI results keys: {list(enhanced_results.keys())}")
    print(f"Base DPI shape: {enhanced_results['base_dpi'].shape}")
    print(f"Enhanced DPI shape: {enhanced_results['enhanced_dpi'].shape}")
    print(f"Flow score: {enhanced_results['flow_score'].item():.4f}")
    print(f"Asset prices: {enhanced_results['asset_prices']}")
    
    # Verify enhanced DPI formula: enhanced_dpi = base_dpi * (1 + flow_score)
    base_dpi = enhanced_results['base_dpi']
    enhanced_dpi = enhanced_results['enhanced_dpi']
    flow_score = enhanced_results['flow_score']
    
    expected_enhanced = base_dpi * (1 + flow_score)
    
    # Check if calculation is correct (within floating point tolerance)
    diff = torch.abs(enhanced_dpi - expected_enhanced).max().item()
    assert diff < 1e-6, f"Enhanced DPI calculation incorrect, diff: {diff}"
    
    print(f" Enhanced DPI formula verified: enhanced_dpi = base_dpi * (1 + flow_score)")
    print(f"  Base DPI mean: {base_dpi.mean().item():.4f}")
    print(f"  Enhanced DPI mean: {enhanced_dpi.mean().item():.4f}")
    print(f"  Enhancement factor: {(1 + flow_score).item():.4f}")
    
    return True

def test_gary_dpi_model():
    """Test the Gary DPI model."""
    # Create sample data
    batch_size, seq_len, input_dim = 32, 60, 50
    x = torch.randn(batch_size, seq_len, input_dim)
    
    # Test Dynamic Portfolio Model
    dpi_model = DynamicPortfolioModel(input_dim=input_dim)
    dpi_output = dpi_model(x)
    
    print(f"\nDPI Model Output:")
    print(f"Predictions shape: {dpi_output.predictions.shape}")
    print(f"Confidence shape: {dpi_output.confidence.shape}")
    print(f"Attention weights shape: {dpi_output.attention_weights.shape}")
    
    # Test combined model
    gary_taleb = GaryTalebPredictor(input_dim=input_dim)
    combined_output = gary_taleb(x)
    
    print(f"\nGaryTaleb Model Output:")
    print(f"Predictions shape: {combined_output.predictions.shape}")
    print(f"Antifragility score shape: {combined_output.metadata['antifragility_score'].shape}")
    
    # Test prediction method
    predictions = gary_taleb.predict(x)
    print(f"\nPrediction keys: {list(predictions.keys())}")
    
    # Test wealth flow functionality
    test_wealth_flow_tracking()
    test_enhanced_dpi()

if __name__ == "__main__":
    test_gary_dpi_model()