"""Ensemble Framework Module

Neural ensemble for combining LSTM, Transformer, CNN, and RL models.
Implements voting, blending, and stacking strategies with GaryTaleb integration.
"""

from .ensemble_framework import NeuralEnsemble
from .voting_strategies import VotingEnsemble, WeightedVotingEnsemble
from .blending_strategies import BlendingEnsemble, MetaLearnerEnsemble
from .stacking_strategies import StackingEnsemble

__all__ = [
    'NeuralEnsemble',
    'VotingEnsemble',
    'WeightedVotingEnsemble',
    'BlendingEnsemble',
    'MetaLearnerEnsemble',
    'StackingEnsemble'
]