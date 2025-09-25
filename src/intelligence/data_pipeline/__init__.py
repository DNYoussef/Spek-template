"""
GaryTaleb Data Pipeline System
Phase 3: High-Performance Data Ingestion and Processing

This module provides comprehensive data pipeline capabilities including:
- Historical data ingestion from multiple sources
- Real-time streaming with <50ms latency
- News sentiment analysis pipeline
- Options flow analysis
- Alternative data integration
- Data quality validation and monitoring

Author: GaryTaleb Trading System
License: Proprietary
"""

from .config import PipelineConfig
from .monitoring import PipelineMonitor, MetricsCollector
from .processing import NewsProcessor, OptionsFlowAnalyzer, SentimentProcessor
from .sources import HistoricalDataLoader, DataSourceManager
from .streaming import RealTimeStreamer, WebSocketManager
from .validation import DataValidator, QualityMonitor

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