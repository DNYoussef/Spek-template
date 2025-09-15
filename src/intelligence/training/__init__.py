"""
Training pipeline for the Gary×Taleb trading system models.
"""

from .trainer import TrainingPipeline, ModelTrainer
from .validation import ValidationFramework, CrossValidator
from .losses import CompositeLoss, SharpeRatioLoss, MaxDrawdownLoss
from .optimizers import AdaptiveOptimizer, SchedulerManager
from .callbacks import EarlyStopping, ModelCheckpoint, LearningRateMonitor

__all__ = [
    'TrainingPipeline',
    'ModelTrainer',
    'ValidationFramework', 
    'CrossValidator',
    'CompositeLoss',
    'SharpeRatioLoss',
    'MaxDrawdownLoss',
    'AdaptiveOptimizer',
    'SchedulerManager',
    'EarlyStopping',
    'ModelCheckpoint',
    'LearningRateMonitor'
]