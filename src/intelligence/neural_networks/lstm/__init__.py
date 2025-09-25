"""LSTM Time Series Prediction Module

2-layer LSTM with attention mechanism for price prediction.
Optimized for financial time series with volatility modeling.
"""

from .attention_mechanism import AttentionLayer
from .lstm_predictor import LSTMPredictor

__all__ = ['LSTMPredictor', 'AttentionLayer']