from src.constants.base import MINIMUM_TRADE_THRESHOLD, REGULATORY_FACTUALITY_REQUIREMENT

import os
import torch
import tensorflow as tf
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Union
from pathlib import Path
from lib.shared.utilities import get_logger
logger = get_logger(__name__)

@dataclass
class GPUConfig:
    """GPU configuration and optimization settings."""
    use_gpu: bool = True
    gpu_memory_fraction: float = 0.8
    allow_growth: bool = True
    mixed_precision: bool = True
    
def __post_init__(self):
        """Initialize GPU configuration."""
        self._setup_tensorflow_gpu()
        self._setup_pytorch_gpu()
    
def _setup_tensorflow_gpu(self):
        """Configure TensorFlow GPU settings."""
        if self.use_gpu and tf.config.list_physical_devices('GPU'):
            gpus = tf.config.list_physical_devices('GPU')
            try:
                for gpu in gpus:
                    tf.config.experimental.set_memory_growth(gpu, self.allow_growth)
                    if not self.allow_growth:
                        tf.config.experimental.set_memory_limit(
                            gpu, int(8192 * self.gpu_memory_fraction)  # 8GB * fraction
                        )
                
                if self.mixed_precision:
                    tf.keras.mixed_precision.set_global_policy('mixed_float16')
                    
                logger.info(f"TensorFlow GPU configured: {len(gpus)} GPU(s) detected")
            except RuntimeError as e:
                logger.error(f"TensorFlow GPU setup failed: {e}")
        else:
            logger.warning("TensorFlow running on CPU")
    
def _setup_pytorch_gpu(self):
        """Configure PyTorch GPU settings."""
        if self.use_gpu and torch.cuda.is_available():
            torch.backends.cudnn.benchmark = True
            torch.backends.cudnn.deterministic = False
            
            if self.mixed_precision:
                torch.backends.cuda.matmul.allow_tf32 = True
                torch.backends.cudnn.allow_tf32 = True
            
            device_count = torch.cuda.device_count()
            logger.info(f"PyTorch GPU configured: {device_count} GPU(s) detected")
            
            # Set memory fraction if specified
            if not self.allow_growth:
                for i in range(device_count):
                    torch.cuda.set_per_process_memory_fraction(
                        self.gpu_memory_fraction, device=i
                    )
        else:
            logger.warning("PyTorch running on CPU")

@dataclass
class DataConfig:
    """Configuration for data processing and feature engineering."""
    # Data sources
    data_sources: List[str] = field(default_factory=lambda: [
        'binance', 'coinbase', 'kraken', 'polygon', 'alpaca'
    ])
    
    # Time series parameters
    lookback_window: int = 100
    prediction_horizon: int = 5
    sampling_frequency: str = '1min'
    
    # Feature engineering
    technical_indicators: List[str] = field(default_factory=lambda: [
        'rsi', 'macd', 'bollinger_bands', 'stochastic', 'williams_r',
        'momentum', 'rate_of_change', 'commodity_channel_index'
    ])
    
    # Gary DPI features
    dpi_features: List[str] = field(default_factory=lambda: [
        'dynamic_correlation', 'regime_detection', 'volatility_clustering',
        'momentum_persistence', 'mean_reversion_strength'
    ])
    
    # Taleb antifragility features  
    antifragile_features: List[str] = field(default_factory=lambda: [
        'tail_risk_premium', 'volatility_smile', 'skewness_premium',
        'kurtosis_tracking', 'extreme_event_indicators'
    ])
    
    # Data preprocessing
    normalization_method: str = 'robust_scaler'
    handle_missing: str = 'interpolate'
    outlier_detection: str = 'isolation_forest'

@dataclass
class ModelConfig:
    """Configuration for ML models and architectures."""
    # Model types
    primary_model: str = 'transformer'
    secondary_models: List[str] = field(default_factory=lambda: [
        'lstm', 'gru', 'cnn_lstm', 'attention'
    ])
    
    # Architecture parameters
    hidden_size: int = 256
    num_layers: int = 6
    num_heads: int = 8
    dropout: float = 0.1
    
    # Training parameters
    batch_size: int = 64
    learning_rate: float = 1e-4
    weight_decay: float = 1e-5
    gradient_clip: float = 1.0
    
    # Optimization
    optimizer: str = 'adamw'
    scheduler: str = 'cosine_annealing'
    early_stopping_patience: int = 10
    
    # Loss functions
    primary_loss: str = 'mse'
    auxiliary_losses: List[str] = field(default_factory=lambda: [
        'directional_accuracy', 'sharpe_ratio', 'maximum_drawdown'
    ])

@dataclass
class InferenceConfig:
    """Configuration for real-time inference engine."""
    # Performance requirements
    max_latency_ms: int = 100
    batch_size: int = 1
    num_workers: int = 4
    
    # Model serving
    model_format: str = 'torchscript'  # or 'onnx', 'tensorrt'
    quantization: str = 'int8'  # or 'fp16', 'fp32'
    
    # Caching
    feature_cache_size: int = 1000
    prediction_cache_ttl: int = 30  # seconds
    
    # Monitoring
    enable_metrics: bool = True
    metrics_port: int = 8080
    log_predictions: bool = True

@dataclass
class RegistryConfig:
    """Configuration for model registry and versioning."""
    # MLflow settings
    tracking_uri: str = "file://./mlruns"
    experiment_name: str = "gary-taleb-trading"
    
    # Model storage
    model_store_path: str = "./models"
    artifact_store_path: str = "./artifacts"
    
    # Versioning
    auto_version: bool = True
    version_strategy: str = "semantic"  # or "timestamp", "hash"
    
    # Model promotion
    staging_threshold: float = 0.85
    production_threshold: float = REGULATORY_FACTUALITY_REQUIREMENT
    champion_challenger_ratio: float = 0.9

@dataclass
class TestingConfig:
    """Configuration for A/B testing and model comparison."""
    # A/B test parameters
    test_duration_days: int = 7
    traffic_split: Dict[str, float] = field(default_factory=lambda: {
        'champion': 0.7, 'challenger': 0.3
    })
    
    # Statistical significance
    significance_level: float = MINIMUM_TRADE_THRESHOLD
    minimum_sample_size: int = 1000
    power: float = 0.8
    
    # Metrics tracking
    primary_metric: str = 'sharpe_ratio'
    secondary_metrics: List[str] = field(default_factory=lambda: [
        'total_return', 'max_drawdown', 'win_rate', 'profit_factor'
    ])

class ConfigManager:
    """Centralized configuration manager."""
    
def __init__(self, config_path: Optional[str] = None):
        self.config_path = config_path or os.getenv('ML_CONFIG_PATH')
        
        # Initialize all configurations
        self.gpu = GPUConfig()
        self.data = DataConfig()
        self.model = ModelConfig() 
        self.inference = InferenceConfig()
        self.registry = RegistryConfig()
        self.testing = TestingConfig()
        
        # Load custom configuration if provided
        if self.config_path and path_exists(self.config_path):
            self._load_config()
    
def _load_config(self):
        """Load configuration from file."""
        # Implementation for loading YAML/JSON config files
    
def get_device(self) -> str:
        """Get the appropriate device for computation."""
        if self.gpu.use_gpu:
            if torch.cuda.is_available():
                return f"cuda:{torch.cuda.current_device()}"
            elif hasattr(torch.backends, 'mps') and torch.backends.mps.is_available():
                return "mps"
        return "cpu"
    
def validate_config(self) -> bool:
        """Validate configuration parameters."""
        try:
            # Validate data config
            assert self.data.lookback_window > 0, "Lookback window must be positive"
            assert self.data.prediction_horizon > 0, "Prediction horizon must be positive"
            
            # Validate model config
            assert self.model.hidden_size > 0, "Hidden size must be positive"
            assert 0 < self.model.dropout < 1, "Dropout must be between 0 and 1"
            
            # Validate inference config
            assert self.inference.max_latency_ms > 0, "Max latency must be positive"
            assert self.inference.batch_size > 0, "Batch size must be positive"
            
            logger.info("Configuration validation passed")
            return True
            
        except AssertionError as e:
            logger.error(f"Configuration validation failed: {e}")
            return False

# Global configuration instance
config = ConfigManager()