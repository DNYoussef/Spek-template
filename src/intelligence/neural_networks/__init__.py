"""Neural Network Package for GaryTaleb Trading System

Core neural architectures for financial market prediction and strategy optimization.
Optimized for <100ms inference with ensemble voting system.

Architectures:
- LSTM: Time series prediction with attention mechanism
- Transformer: Financial sentiment analysis (BERT-based)
- CNN: Chart pattern recognition (ResNet-based)
- RL: Strategy optimization (PPO/A3C)
- Ensemble: Model combination framework
"""

from .cnn.pattern_recognizer import ChartPatternCNN
from .ensemble.ensemble_framework import NeuralEnsemble
from .lstm.lstm_predictor import LSTMPredictor
from .rl.strategy_optimizer import StrategyOptimizerRL
from .transformer.sentiment_analyzer import FinancialSentimentAnalyzer

__all__ = [
    'LSTMPredictor',
    'FinancialSentimentAnalyzer', 
    'ChartPatternCNN',
    'StrategyOptimizerRL',
    'NeuralEnsemble'
]

# Version and compatibility info
__version__ = "1.0.0"
__framework__ = "PyTorch 2.0+"
__inference_target__ = "<100ms"
__capital_requirement__ = "$200 seed"