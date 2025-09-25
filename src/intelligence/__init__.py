"""
GaryTaleb Trading System - Machine Learning Intelligence Module

This module implements the complete ML infrastructure for the trading system,
combining Gary's DPI (Dynamic Portfolio Intelligence) with Taleb's antifragility
principles for robust financial prediction and risk management.

Core Components:
- Data pipeline for real-time market data processing
- Deep learning models for price prediction and risk assessment  
- Model registry and versioning system using MLflow
- High-performance inference engine with <100ms latency
- A/B testing framework for model comparison
- Comprehensive monitoring and alerting system

Author: GaryTaleb Trading System
Version: 3.0.0
License: Proprietary
"""

from .data import MarketDataLoader, FeatureEngineering
from .inference import RealTimeInferenceEngine
from .models import GaryTalebPredictor, AntifragileRiskModel
from .monitoring import MLMonitor, PerformanceTracker
from .registry import ModelRegistry, VersionManager
from .testing import ABTestFramework, ModelComparator
from .training import TrainingPipeline, ValidationFramework

__version__ = "3.0.0"
__author__ = "GaryTaleb Trading System"

__all__ = [
    # Data Components
    "MarketDataLoader",
    "FeatureEngineering",
    
    # Models
    "GaryTalebPredictor", 
    "AntifragileRiskModel",
    
    # Training
    "TrainingPipeline",
    "ValidationFramework",
    
    # Inference  
    "RealTimeInferenceEngine",
    
    # Registry
    "ModelRegistry",
    "VersionManager",
    
    # Testing
    "ABTestFramework",
    "ModelComparator",
    
    # Monitoring
    "MLMonitor",
    "PerformanceTracker"
]