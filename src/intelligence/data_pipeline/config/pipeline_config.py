from lib.shared.utilities import path_exists

import os
import json
from dataclasses import dataclass, asdict
from typing import Dict, List, Optional, Any
from pathlib import Path

@dataclass
class DataSourceConfig:
    """Configuration for data sources"""
    name: str
    api_key: str
    base_url: str
    rate_limit: int
    timeout: float
    retry_attempts: int
    enabled: bool = True

@dataclass
class StreamingConfig:
    """Configuration for real-time streaming"""
    buffer_size: int = 10000
    flush_interval: float = 0.1  # 100ms
    max_latency: float = 0.5   # 50ms target
    failover_enabled: bool = True
    heartbeat_interval: float = 30.0
    reconnect_attempts: int = 5

@dataclass
class ProcessingConfig:
    """Configuration for data processing"""
    batch_size: int = 1000
    processing_threads: int = 4
    sentiment_model: str = "distilbert-base-uncased-finetuned-sst-2-english"
    news_filters: List[str] = None
    options_flow_threshold: float = 1000000  # $1M unusual activity

def __post_init__(self):
        if self.news_filters is None:
            self.news_filters = ["earnings", "merger", "acquisition", "bankruptcy"]

@dataclass
class ValidationConfig:
    """Configuration for data validation"""
    quality_threshold: float = 0.95
    completeness_threshold: float = 0.99
    latency_threshold: float = 0.1  # 100ms
    error_rate_threshold: float = 0.1  # 1%

@dataclass
class MonitoringConfig:
    """Configuration for monitoring and metrics"""
    metrics_interval: float = 60.0  # 1 minute
    log_level: str = "INFO"
    alert_threshold: float = 0.95
    dashboard_port: int = 8080

class PipelineConfig:
    """Main pipeline configuration manager"""

def __init__(self, config_file: Optional[str] = None):
        self.config_file = config_file or "config/pipeline.json"
        self.config_dir = Path(__file__).parent

        # Default configurations
        self.data_sources = self._load_data_sources()
        self.streaming = StreamingConfig()
        self.processing = ProcessingConfig()
        self.validation = ValidationConfig()
        self.monitoring = MonitoringConfig()

        # Load from file if exists
        if path_exists(self.config_file):
            self.load_config()

def _load_data_sources(self) -> Dict[str, DataSourceConfig]:
        """Load data source configurations"""
        return {
            "alpaca": DataSourceConfig(
                name="alpaca",
                api_key=os.getenv("ALPACA_API_KEY", ""),
                base_url="https://paper-api.alpaca.markets",
                rate_limit=200,  # requests per minute
                timeout=30.0,
                retry_attempts=3
            ),
            "polygon": DataSourceConfig(
                name="polygon",
                api_key=os.getenv("POLYGON_API_KEY", ""),
                base_url="https://api.polygon.io",
                rate_limit=5,  # requests per minute for free tier
                timeout=30.0,
                retry_attempts=3
            ),
            "yahoo": DataSourceConfig(
                name="yahoo",
                api_key="",  # No API key required
                base_url="https://query1.finance.yahoo.com",
                rate_limit=2000,  # Conservative limit
                timeout=30.0,
                retry_attempts=3
            ),
            "newsapi": DataSourceConfig(
                name="newsapi",
                api_key=os.getenv("NEWS_API_KEY", ""),
                base_url="https://newsapi.org/v2",
                rate_limit=1000,  # requests per day
                timeout=30.0,
                retry_attempts=3
            ),
            "fred": DataSourceConfig(
                name="fred",
                api_key=os.getenv("FRED_API_KEY", ""),
                base_url="https://api.stlouisfed.org/fred",
                rate_limit=120,  # requests per minute
                timeout=30.0,
                retry_attempts=3
            )
        }

def load_config(self):
        """Load configuration from JSON file"""
        try:
            with open(self.config_file, 'r') as f:
                config_data = json.load(f)

            # Update configurations
            if "streaming" in config_data:
                self.streaming = StreamingConfig(**config_data["streaming"])
            if "processing" in config_data:
                self.processing = ProcessingConfig(**config_data["processing"])
            if "validation" in config_data:
                self.validation = ValidationConfig(**config_data["validation"])
            if "monitoring" in config_data:
                self.monitoring = MonitoringConfig(**config_data["monitoring"])

        except Exception as e:
            print(f"Warning: Could not load config file {self.config_file}: {e}")

def save_config(self):
        """Save current configuration to JSON file"""
        config_data = {
            "streaming": asdict(self.streaming),
            "processing": asdict(self.processing),
            "validation": asdict(self.validation),
            "monitoring": asdict(self.monitoring)
        }

        os.makedirs(os.path.dirname(self.config_file), exist_ok=True)
        with open(self.config_file, 'w') as f:
            json.dump(config_data, f, indent=2)

def get_source_config(self, source_name: str) -> Optional[DataSourceConfig]:
        """Get configuration for specific data source"""
        return self.data_sources.get(source_name)

def validate_config(self) -> List[str]:
        """Validate configuration and return list of issues"""
        issues = []

        # Check API keys
        for name, config in self.data_sources.items():
            if config.enabled and config.api_key and not config.api_key:
                issues.append(f"Missing API key for {name}")

        # Check streaming config
        if self.streaming.max_latency > 0.1:
            issues.append("Max latency exceeds 100ms requirement")

        # Check processing config
        if self.processing.batch_size < 100:
            issues.append("Batch size may be too small for efficiency")

        return issues

# Global configuration instance
config = PipelineConfig()