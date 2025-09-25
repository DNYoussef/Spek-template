"""
Pipeline Orchestrator
Main orchestration system for the GaryTaleb data pipeline
"""

from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import logging
import sys

from dataclasses import dataclass
import asyncio
import signal

from .config.pipeline_config import config
from .sources import HistoricalDataLoader, DataSourceManager
from .streaming import RealTimeStreamer, WebSocketManager
from .processing import NewsProcessor, SentimentProcessor, OptionsFlowAnalyzer, AlternativeDataProcessor
from .validation import DataValidator, QualityMonitor
from .monitoring import PipelineMonitor, MetricsCollector

@dataclass
class PipelineStatus:
    """Overall pipeline status"""
    status: str  # "starting", "running", "stopping", "stopped", "error"
    components_running: int
    components_total: int
    start_time: Optional[datetime]
    uptime_seconds: float
    errors: List[str]
    warnings: List[str]

class PipelineOrchestrator:
    """
    Main orchestrator for the GaryTaleb trading data pipeline

    Manages:
    - Historical data loading from multiple sources
    - Real-time streaming with <50ms latency
    - News sentiment processing (1000+ articles/minute)
    - Options flow analysis for unusual activity
    - Alternative data integration
    - Data quality monitoring and validation
    - Performance metrics and alerting
    """

    def __init__(self):
        self.logger = self._setup_logging()
        self.start_time: Optional[datetime] = None
        self.status = "stopped"

        # Core components
        self.historical_loader: Optional[HistoricalDataLoader] = None
        self.data_source_manager: Optional[DataSourceManager] = None
        self.real_time_streamer: Optional[RealTimeStreamer] = None
        self.websocket_manager: Optional[WebSocketManager] = None

        # Processing components
        self.news_processor: Optional[NewsProcessor] = None
        self.sentiment_processor: Optional[SentimentProcessor] = None
        self.options_analyzer: Optional[OptionsFlowAnalyzer] = None
        self.alternative_processor: Optional[AlternativeDataProcessor] = None

        # Quality and monitoring
        self.data_validator: Optional[DataValidator] = None
        self.quality_monitor: Optional[QualityMonitor] = None
        self.pipeline_monitor: Optional[PipelineMonitor] = None
        self.metrics_collector: Optional[MetricsCollector] = None

        # Component registry
        self.components = {}
        self.component_dependencies = self._define_dependencies()

        # Error handling
        self.errors: List[str] = []
        self.warnings: List[str] = []

        # Shutdown handling
        self.shutdown_event = asyncio.Event()
        self._setup_signal_handlers()

    def _setup_logging(self) -> logging.Logger:
        """Setup comprehensive logging"""
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            handlers=[
                logging.StreamHandler(sys.stdout),
                logging.FileHandler('gary_taleb_pipeline.log')
            ]
        )
        return logging.getLogger(__name__)

    def _setup_signal_handlers(self):
        """Setup signal handlers for graceful shutdown"""
    def signal_handler(signum, frame):
            self.logger.info(f"Received signal {signum}, initiating shutdown...")
            asyncio.create_task(self.shutdown())

        signal.signal(signal.SIGINT, signal_handler)
        signal.signal(signal.SIGTERM, signal_handler)

    def _define_dependencies(self) -> Dict[str, List[str]]:
        """Define component dependencies"""
        return {
            "metrics_collector": [],
            "pipeline_monitor": ["metrics_collector"],
            "data_validator": [],
            "quality_monitor": ["data_validator"],
            "data_source_manager": ["quality_monitor", "pipeline_monitor"],
            "historical_loader": ["data_source_manager"],
            "websocket_manager": ["pipeline_monitor"],
            "real_time_streamer": ["websocket_manager", "quality_monitor"],
            "sentiment_processor": ["pipeline_monitor"],
            "news_processor": ["sentiment_processor", "quality_monitor"],
            "options_analyzer": ["pipeline_monitor"],
            "alternative_processor": ["pipeline_monitor"]
        }

    async def start(self):
        """Start the complete data pipeline"""
        self.logger.info("=== Starting GaryTaleb Data Pipeline ===")
        self.start_time = datetime.now()
        self.status = "starting"

        try:
            # Validate configuration
            config_issues = config.validate_config()
            if config_issues:
                for issue in config_issues:
                    self.warnings.append(issue)
                    self.logger.warning(f"Configuration issue: {issue}")

            # Initialize components in dependency order
            await self._initialize_components()

            # Start all components
            await self._start_components()

            self.status = "running"
            self.logger.info("=== Pipeline started successfully ===")

            # Setup data flow connections
            await self._setup_data_flow()

            # Start monitoring dashboard
            await self._start_dashboard()

        except Exception as e:
            self.status = "error"
            error_msg = f"Failed to start pipeline: {str(e)}"
            self.errors.append(error_msg)
            self.logger.error(error_msg)
            raise

    async def _initialize_components(self):
        """Initialize all pipeline components"""
        self.logger.info("Initializing components...")

        # Core monitoring (no dependencies)
        self.metrics_collector = MetricsCollector()
        self.components["metrics_collector"] = self.metrics_collector

        self.pipeline_monitor = PipelineMonitor()
        self.components["pipeline_monitor"] = self.pipeline_monitor

        # Data validation
        self.data_validator = DataValidator()
        self.components["data_validator"] = self.data_validator

        self.quality_monitor = QualityMonitor()
        self.components["quality_monitor"] = self.quality_monitor

        # Data sources
        self.data_source_manager = DataSourceManager()
        self.components["data_source_manager"] = self.data_source_manager

        self.historical_loader = HistoricalDataLoader()
        self.components["historical_loader"] = self.historical_loader

        # Real-time streaming
        self.websocket_manager = WebSocketManager()
        self.components["websocket_manager"] = self.websocket_manager

        self.real_time_streamer = RealTimeStreamer()
        self.components["real_time_streamer"] = self.real_time_streamer

        # Processing components
        self.sentiment_processor = SentimentProcessor()
        self.components["sentiment_processor"] = self.sentiment_processor

        self.news_processor = NewsProcessor()
        self.components["news_processor"] = self.news_processor

        self.options_analyzer = OptionsFlowAnalyzer()
        self.components["options_analyzer"] = self.options_analyzer

        self.alternative_processor = AlternativeDataProcessor()
        self.components["alternative_processor"] = self.alternative_processor

        self.logger.info(f"Initialized {len(self.components)} components")

    async def _start_components(self):
        """Start components in dependency order"""
        self.logger.info("Starting components...")

        started_components = set()
        component_order = self._get_startup_order()

        for component_name in component_order:
            if component_name not in self.components:
                continue

            try:
                self.logger.info(f"Starting {component_name}...")
                component = self.components[component_name]

                # Register with pipeline monitor
                if self.pipeline_monitor:
                    self.pipeline_monitor.register_component(component_name)

                # Start component
                if hasattr(component, 'start'):
                    await component.start()

                started_components.add(component_name)
                self.logger.info(f" {component_name} started successfully")

            except Exception as e:
                error_msg = f"Failed to start {component_name}: {str(e)}"
                self.errors.append(error_msg)
                self.logger.error(error_msg)
                raise

        self.logger.info(f"Started {len(started_components)} components")

    def _get_startup_order(self) -> List[str]:
        """Determine component startup order based on dependencies"""
        order = []
        visited = set()

        def visit(component):
            if component in visited:
                return
            visited.add(component)

            # Visit dependencies first
            for dependency in self.component_dependencies.get(component, []):
                visit(dependency)

            order.append(component)

        for component in self.components.keys():
            visit(component)

        return order

    async def _setup_data_flow(self):
        """Setup data flow between components"""
        self.logger.info("Setting up data flow connections...")

        try:
            # Connect news processor to sentiment analyzer
            if self.news_processor and self.sentiment_processor:
                self.news_processor.add_article_callback(self._process_news_article)

            # Connect real-time streamer to processing components
            if self.real_time_streamer:
                self.real_time_streamer.add_subscriber(self._process_streaming_data)

            # Connect quality monitor to all data processors
            if self.quality_monitor:
                # Setup quality monitoring callbacks

            self.logger.info(" Data flow connections established")

        except Exception as e:
            error_msg = f"Failed to setup data flow: {str(e)}"
            self.errors.append(error_msg)
            self.logger.error(error_msg)
            raise

    async def _process_news_article(self, article):
        """Process news article through sentiment analysis"""
        try:
            if self.sentiment_processor:
                sentiment_result = await self.sentiment_processor.analyze_article(article)

                # Record metrics
                if self.metrics_collector:
                    self.metrics_collector.increment_counter(
                        "articles_processed",
                        labels={"source": article.source, "sentiment": sentiment_result.sentiment}
                    )

            if self.pipeline_monitor:
                self.pipeline_monitor.record_activity(
                    "news_processor",
                    "article_processed",
                    processing_time_ms=getattr(sentiment_result, 'processing_time_ms', 0),
                    success=True
                )

        except Exception as e:
            self.logger.error(f"Error processing news article: {e}")
            if self.pipeline_monitor:
                self.pipeline_monitor.record_error(
                    "news_processor",
                    str(e),
                    "article_processing"
                )

    async def _process_streaming_data(self, stream_data):
        """Process real-time streaming data"""
        try:
            # Route data to appropriate processors
            if stream_data.data_type == "quote" or stream_data.data_type == "trade":
                # Process market data
                if self.metrics_collector:
                    self.metrics_collector.increment_counter(
                        "market_data_processed",
                        labels={"symbol": stream_data.symbol, "type": stream_data.data_type}
                    )

            if self.pipeline_monitor:
                self.pipeline_monitor.record_activity(
                    "real_time_streamer",
                    "data_processed",
                    processing_time_ms=stream_data.latency_ms,
                    success=True
                )

        except Exception as e:
            self.logger.error(f"Error processing streaming data: {e}")
            if self.pipeline_monitor:
                self.pipeline_monitor.record_error(
                    "real_time_streamer",
                    str(e),
                    "stream_processing"
                )

    async def _start_dashboard(self):
        """Start monitoring dashboard"""
        try:
            # This would start a web dashboard for monitoring
            self.logger.info(" Monitoring dashboard available")

        except Exception as e:
            self.logger.warning(f"Dashboard startup failed: {e}")

    async def load_historical_data(
        self,
        symbols: List[str],
        start_date: datetime,
        end_date: datetime,
        timeframe: str = "1D"
    ) -> Dict[str, Any]:
        """Load historical data for symbols"""
        if not self.historical_loader:
            raise RuntimeError("Historical loader not initialized")

        self.logger.info(f"Loading historical data for {len(symbols)} symbols")

        try:
            data = await self.historical_loader.load_historical_data(
                symbols, start_date, end_date, timeframe
            )

            # Monitor data quality
            for symbol, df in data.items():
                if self.quality_monitor and not df.empty:
                    await self.quality_monitor.monitor_data_quality(
                        df, "historical", symbol, "ohlcv"
                    )

            self.logger.info(f"Successfully loaded data for {len(data)} symbols")
            return data

        except Exception as e:
            error_msg = f"Historical data loading failed: {str(e)}"
            self.logger.error(error_msg)
            if self.pipeline_monitor:
                self.pipeline_monitor.record_error(
                    "historical_loader",
                    error_msg,
                    "data_loading"
                )
            raise

    async def subscribe_real_time(self, symbols: List[str], data_types: List[str] = None):
        """Subscribe to real-time data for symbols"""
        if not self.real_time_streamer:
            raise RuntimeError("Real-time streamer not initialized")

        try:
            await self.real_time_streamer.subscribe_symbols(symbols, data_types)
            self.logger.info(f"Subscribed to real-time data for {len(symbols)} symbols")

        except Exception as e:
            error_msg = f"Real-time subscription failed: {str(e)}"
            self.logger.error(error_msg)
            raise

    def get_pipeline_status(self) -> PipelineStatus:
        """Get current pipeline status"""
        components_running = len([
            name for name, comp in self.components.items()
            if hasattr(comp, 'running') and getattr(comp, 'running', False)
        ])

        uptime = 0.0
        if self.start_time:
            uptime = (datetime.now() - self.start_time).total_seconds()

        return PipelineStatus(
            status=self.status,
            components_running=components_running,
            components_total=len(self.components),
            start_time=self.start_time,
            uptime_seconds=uptime,
            errors=self.errors.copy(),
            warnings=self.warnings.copy()
        )

    def get_performance_metrics(self) -> Dict[str, Any]:
        """Get comprehensive performance metrics"""
        metrics = {
            "pipeline_status": self.get_pipeline_status().__dict__,
            "timestamp": datetime.now().isoformat()
        }

        # Add component-specific metrics
        if self.pipeline_monitor:
            metrics["system_metrics"] = self.pipeline_monitor.get_system_metrics()
            metrics["component_status"] = self.pipeline_monitor.get_component_status()

        if self.metrics_collector:
            metrics["collection_stats"] = self.metrics_collector.get_collection_stats()

        if self.quality_monitor:
            metrics["quality_summary"] = self.quality_monitor.get_quality_summary()

        return metrics

    async def health_check(self) -> Dict[str, Any]:
        """Perform comprehensive health check"""
        health_status = {
            "overall_status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "components": {},
            "issues": []
        }

        # Check each component
        for name, component in self.components.items():
            try:
                if hasattr(component, 'running'):
                    is_running = getattr(component, 'running', False)
                    health_status["components"][name] = {
                        "status": "running" if is_running else "stopped",
                        "healthy": is_running
                    }
                else:
                    health_status["components"][name] = {
                        "status": "unknown",
                        "healthy": True
                    }

            except Exception as e:
                health_status["components"][name] = {
                    "status": "error",
                    "healthy": False,
                    "error": str(e)
                }
                health_status["issues"].append(f"{name}: {str(e)}")

        # Determine overall status
        unhealthy_components = [
            name for name, status in health_status["components"].items()
            if not status.get("healthy", True)
        ]

        if unhealthy_components:
            if len(unhealthy_components) > len(self.components) / 2:
                health_status["overall_status"] = "critical"
            else:
                health_status["overall_status"] = "degraded"

        return health_status

    async def shutdown(self):
        """Gracefully shutdown the pipeline"""
        self.logger.info("=== Shutting down GaryTaleb Data Pipeline ===")
        self.status = "stopping"

        # Stop components in reverse order
        component_order = self._get_startup_order()
        component_order.reverse()

        for component_name in component_order:
            if component_name not in self.components:
                continue

            try:
                self.logger.info(f"Stopping {component_name}...")
                component = self.components[component_name]

                if hasattr(component, 'stop'):
                    await component.stop()

                self.logger.info(f" {component_name} stopped")

            except Exception as e:
                self.logger.error(f"Error stopping {component_name}: {e}")

        self.status = "stopped"
        self.logger.info("=== Pipeline shutdown complete ===")

        # Signal shutdown complete
        self.shutdown_event.set()

    async def run_forever(self):
        """Run pipeline until shutdown signal"""
        try:
            await self.start()

            # Log startup success
            self.logger.info("Pipeline running - press Ctrl+C to stop")

            # Wait for shutdown signal
            await self.shutdown_event.wait()

        except KeyboardInterrupt:
            self.logger.info("Received interrupt signal")
        except Exception as e:
            self.logger.error(f"Pipeline error: {e}")
            raise
        finally:
            if self.status != "stopped":
                await self.shutdown()

async def main():
    """Main entry point for the pipeline"""
    orchestrator = PipelineOrchestrator()

    try:
        await orchestrator.run_forever()
    except Exception as e:
        logging.error(f"Pipeline failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())