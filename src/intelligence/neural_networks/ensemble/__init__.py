"""Ensemble Framework Module

Neural ensemble for combining LSTM, Transformer, CNN, and RL models.
Implements voting, blending, and stacking strategies with GaryTaleb integration.
"""

from .blending_strategies import BlendingEnsemble, MetaLearnerEnsemble
from .ensemble_framework import NeuralEnsemble
from .stacking_strategies import StackingEnsemble
from .voting_strategies import VotingEnsemble, WeightedVotingEnsemble

__all__ = [
    'NeuralEnsemble',
    'VotingEnsemble',
    'WeightedVotingEnsemble',
    'BlendingEnsemble',
    'MetaLearnerEnsemble',
    'StackingEnsemble'
]