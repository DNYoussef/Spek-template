"""
Gary×Taleb Data Pipeline System
Phase 3: High-Performance Data Ingestion and Processing

This module provides comprehensive data pipeline capabilities including:
- Historical data ingestion from multiple sources
- Real-time streaming with <50ms latency
- News sentiment analysis pipeline
- Options flow analysis
- Alternative data integration
- Data quality validation and monitoring

Author: Gary×Taleb Trading System
License: Proprietary
"""

from .sources import HistoricalDataLoader, DataSourceManager
from .streaming import RealTimeStreamer, WebSocketManager
from .processing import NewsProcessor, OptionsFlowAnalyzer, SentimentProcessor
from .validation import DataValidator, QualityMonitor
from .monitoring import PipelineMonitor, MetricsCollector
from .config import PipelineConfig

__version__ = "1.0.0"
__all__ = [
    "HistoricalDataLoader",
    "DataSourceManager",
    "RealTimeStreamer",
    "WebSocketManager",
    "NewsProcessor",
    "OptionsFlowAnalyzer",
    "SentimentProcessor",
    "DataValidator",
    "QualityMonitor",
    "PipelineMonitor",
    "MetricsCollector",
    "PipelineConfig"
]