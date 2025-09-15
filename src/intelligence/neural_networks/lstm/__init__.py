"""LSTM Time Series Prediction Module

2-layer LSTM with attention mechanism for price prediction.
Optimized for financial time series with volatility modeling.
"""

from .lstm_predictor import LSTMPredictor
from .attention_mechanism import AttentionLayer

__all__ = ['LSTMPredictor', 'AttentionLayer']