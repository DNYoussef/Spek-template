"""
GaryTaleb Data Pipeline - Basic Usage Examples
Demonstrates core functionality of the data pipeline system
"""

from datetime import datetime, timedelta
from typing import List, Dict, Any
import logging

import asyncio

# Import pipeline components
from ..pipeline_orchestrator import PipelineOrchestrator
from ..sources import HistoricalDataLoader, DataSourceManager
from ..streaming import RealTimeStreamer
from ..processing import NewsProcessor, SentimentProcessor, OptionsFlowAnalyzer
from ..validation import QualityMonitor
from ..monitoring import MetricsCollector

async def basic_pipeline_example():
    """
    Basic example showing how to start and use the complete pipeline
    """
    print("=== GaryTaleb Data Pipeline - Basic Usage Example ===")

    # Initialize pipeline orchestrator
    pipeline = PipelineOrchestrator()

    try:
        # Start the complete pipeline
        print("Starting pipeline...")
        await pipeline.start()

        # Define symbols for trading
        symbols = ["AAPL", "MSFT", "GOOGL", "TSLA", "AMZN", "NVDA"]

        # Load historical data (last 30 days)
        print(f"\nLoading historical data for {len(symbols)} symbols...")
        end_date = datetime.now()
        start_date = end_date - timedelta(days=30)

        historical_data = await pipeline.load_historical_data(
            symbols=symbols,
            start_date=start_date,
            end_date=end_date,
            timeframe="1D"
        )

        print(f"Loaded historical data for {len(historical_data)} symbols")
        for symbol, data in historical_data.items():
            print(f"  {symbol}: {len(data)} trading days")

        # Subscribe to real-time data
        print(f"\nSubscribing to real-time data...")
        await pipeline.subscribe_real_time(
            symbols=symbols,
            data_types=["quotes", "trades"]
        )

        # Get pipeline status
        status = pipeline.get_pipeline_status()
        print(f"\nPipeline Status:")
        print(f"  Status: {status.status}")
        print(f"  Components Running: {status.components_running}/{status.components_total}")
        print(f"  Uptime: {status.uptime_seconds:.1f} seconds")

        # Get performance metrics
        metrics = pipeline.get_performance_metrics()
        if 'system_metrics' in metrics:
            sys_metrics = metrics['system_metrics']
            print(f"\nSystem Performance:")
            print(f"  CPU Usage: {sys_metrics.get('current_cpu_percent', 0):.1f}%")
            print(f"  Memory Usage: {sys_metrics.get('current_memory_percent', 0):.1f}%")

        # Run for a short time to demonstrate
        print(f"\nPipeline running - will demonstrate for 30 seconds...")
        await asyncio.sleep(30)

    except Exception as e:
        print(f"Pipeline error: {e}")
        logging.exception("Pipeline execution error")
    finally:
        # Graceful shutdown
        print(f"\nShutting down pipeline...")
        await pipeline.shutdown()
        print("Pipeline shutdown complete")

async def historical_data_example():
    """
    Example focused on historical data loading from multiple sources
    """
    print("\n=== Historical Data Loading Example ===")

    loader = HistoricalDataLoader()
    await loader.start()

    try:
        symbols = ["AAPL", "MSFT", "TSLA"]

        # Load 1 year of daily data
        print(f"Loading 1 year of daily data for {len(symbols)} symbols...")

        end_date = datetime.now()
        start_date = end_date - timedelta(days=365)

        data = await loader.load_historical_data(
            symbols=symbols,
            start_date=start_date,
            end_date=end_date,
            timeframe="1D",
            source="yahoo"  # Primary source
        )

        # Analyze loaded data
        for symbol, df in data.items():
            if not df.empty:
                print(f"\n{symbol} Data Summary:")
                print(f"  Records: {len(df)}")
                print(f"  Date Range: {df.index.min().date()} to {df.index.max().date()}")
                print(f"  Price Range: ${df['low'].min():.2f} - ${df['high'].max():.2f}")
                print(f"  Avg Volume: {df['volume'].mean():,.0f}")

                # Basic statistics
                returns = df['close'].pct_change().dropna()
                print(f"  Volatility (daily): {returns.std():.3f}")
                print(f"  Max Drawdown: {(df['close'] / df['close'].cummax() - 1).min():.2%}")

        # Test data coverage
        coverage = loader.get_data_coverage(symbols, start_date, end_date)
        print(f"\nData Coverage Analysis:")
        for symbol, info in coverage.items():
            if info.get('available'):
                print(f"  {symbol}: Available from {info['source']}")
            else:
                print(f"  {symbol}: Not available - {info.get('error', 'Unknown error')}")

    except Exception as e:
        print(f"Historical data loading error: {e}")
        logging.exception("Historical data error")
    finally:
        await loader.stop() if hasattr(loader, 'stop') else None

async def real_time_streaming_example():
    """
    Example demonstrating real-time data streaming
    """
    print("\n=== Real-Time Streaming Example ===")

    streamer = RealTimeStreamer()

    # Data callback function
    def handle_streaming_data(stream_data):
        print(f"[{stream_data.timestamp.strftime('%H:%M:%S')}] "
                f"{stream_data.symbol} {stream_data.data_type}: "
                f"{stream_data.data} (latency: {stream_data.latency_ms:.1f}ms)")

    try:
        await streamer.start()

        # Subscribe to real-time data
        symbols = ["AAPL", "MSFT", "GOOGL"]
        print(f"Subscribing to real-time data for {symbols}...")

        # Add our data handler
        streamer.add_subscriber(handle_streaming_data, symbols)

        # Subscribe to quotes and trades
        await streamer.subscribe_symbols(symbols, ["quotes", "trades"])

        # Monitor streaming metrics
        print(f"Streaming for 60 seconds...")
        start_time = datetime.now()

        while (datetime.now() - start_time).seconds < 60:
            await asyncio.sleep(10)

            # Get streaming metrics
            metrics = streamer.get_metrics()
            buffer_status = streamer.get_buffer_status()

            print(f"\nStreaming Metrics:")
            print(f"  Messages/sec: {metrics.messages_per_second:.1f}")
            print(f"  Avg Latency: {metrics.average_latency_ms:.1f}ms")
            print(f"  Buffer Usage: {buffer_status['utilization_percent']:.1f}%")
            print(f"  Active Connections: {metrics.connection_count}")

    except Exception as e:
        print(f"Streaming error: {e}")
        logging.exception("Streaming error")
    finally:
        await streamer.stop()

async def news_sentiment_example():
    """
    Example demonstrating news processing and sentiment analysis
    """
    print("\n=== News Sentiment Analysis Example ===")

    news_processor = NewsProcessor()
    sentiment_processor = SentimentProcessor()

    try:
        await news_processor.start()
        await sentiment_processor.start()

        symbols = ["AAPL", "TSLA", "NVDA"]

        # Let the news processor run for a while to collect articles
        print("Collecting news articles for 2 minutes...")
        await asyncio.sleep(120)

        # Get processing stats
        stats = news_processor.get_stats()
        print(f"\nNews Processing Stats:")
        print(f"  Articles processed: {stats.total_processed}")
        print(f"  Articles filtered: {stats.total_filtered}")
        print(f"  Processing rate: {stats.articles_per_minute:.1f}/min")

        # Get sentiment analysis for symbols
        print(f"\nSentiment Analysis Results:")
        for symbol in symbols:
            sentiment = sentiment_processor.get_symbol_sentiment(symbol, timeframe="4h")
            if sentiment:
                print(f"  {symbol}:")
                print(f"    Overall Sentiment: {sentiment['weighted_sentiment']:.2f}")
                print(f"    Total Messages: {sentiment['total_messages']}")
                print(f"    Positive Ratio: {sentiment['positive_ratio']:.1%}")
                print(f"    Negative Ratio: {sentiment['negative_ratio']:.1%}")
            else:
                print(f"  {symbol}: No sentiment data available")

        # Get trending sentiment
        trending = sentiment_processor.get_trending_sentiment(timeframe="1h", limit=10)
        if trending:
            print(f"\nTrending Sentiment (last hour):")
            for sent in trending[:5]:
                direction = "" if sent.direction == "bullish" else ""
                print(f"  {direction} {sent.symbol}: {sent.weighted_score:.2f} "
                        f"({sent.total_articles} articles)")

    except Exception as e:
        print(f"News/sentiment error: {e}")
        logging.exception("News sentiment error")
    finally:
        await news_processor.stop()
        await sentiment_processor.stop()

async def options_flow_example():
    """
    Example demonstrating options flow analysis
    """
    print("\n=== Options Flow Analysis Example ===")

    analyzer = OptionsFlowAnalyzer()

    try:
        await analyzer.start()

        # Simulate some options data processing
        print("Analyzing options flow for 60 seconds...")
        await asyncio.sleep(60)

        # Get recent unusual activities
        recent_alerts = analyzer.get_recent_alerts(hours=24)
        print(f"\nUnusual Options Activities (last 24h): {len(recent_alerts)}")

        for alert in recent_alerts[:5]:  # Show top 5
            print(f"  {alert.underlying_symbol} - {alert.activity_type.upper()}")
            print(f"    Severity: {alert.severity}")
            print(f"    Description: {alert.description}")
            print(f"    Time: {alert.detected_at.strftime('%H:%M:%S')}")

        # Get top flow symbols
        top_flow = analyzer.get_top_flow_symbols(limit=10)
        if top_flow:
            print(f"\nTop Options Flow Symbols:")
            for item in top_flow:
                print(f"  {item['symbol']}: ${item['total_premium']:,.0f} "
                        f"(C/P: {item['call_put_ratio']:.1f})")

        # Get analytics summary
        summary = analyzer.get_analytics_summary()
        print(f"\nOptions Analytics Summary:")
        print(f"  Contracts Processed: {summary['total_contracts_processed']:,}")
        print(f"  Alerts Generated: {summary['total_alerts_generated']}")
        print(f"  Symbols Tracked: {summary['symbols_tracked']}")

    except Exception as e:
        print(f"Options flow error: {e}")
        logging.exception("Options flow error")
    finally:
        await analyzer.stop()

async def data_quality_example():
    """
    Example demonstrating data quality monitoring
    """
    print("\n=== Data Quality Monitoring Example ===")

    monitor = QualityMonitor()

    try:
        await monitor.start()

        # Let monitor run for a while
        print("Monitoring data quality for 60 seconds...")
        await asyncio.sleep(60)

        # Get quality summary
        summary = monitor.get_quality_summary(hours=1)
        print(f"\nData Quality Summary (last hour):")
        print(f"  Average Quality Score: {summary.get('average_quality_score', 0):.2f}")
        print(f"  Datasets Monitored: {summary.get('total_datasets_monitored', 0)}")
        print(f"  SLA Compliance: {summary.get('sla_compliance', 0):.1%}")
        print(f"  Total Alerts: {summary.get('total_alerts', 0)}")
        print(f"  Critical Alerts: {summary.get('critical_alerts', 0)}")

        # Get recent alerts
        alerts = monitor.get_active_alerts(severity="critical")
        if alerts:
            print(f"\nCritical Quality Alerts:")
            for alert in alerts[:3]:
                print(f"  {alert.component}: {alert.message}")

        # Check source-specific quality
        sources = ["yahoo", "alpaca", "polygon"]
        print(f"\nSource-Specific Quality:")
        for source in sources:
            source_quality = monitor.get_source_quality(source)
            if 'latest_quality_score' in source_quality:
                        f"({source_quality['trend']})")

    except Exception as e:
        print(f"Quality monitoring error: {e}")
        logging.exception("Quality monitoring error")
    finally:
        await monitor.stop()

async def performance_monitoring_example():
    """
    Example demonstrating performance monitoring and metrics
    """
    print("\n=== Performance Monitoring Example ===")

    collector = MetricsCollector()

    try:
        await collector.start()

        # Record some sample metrics
        print("Recording sample metrics...")

        # Simulate processing metrics
        for i in range(100):
            collector.increment_counter("sample_operations", 1, {"component": "test"})
            collector.record_processing_time("test_comp", "sample_op", 50.0 + i, True)
            await asyncio.sleep(0.1)

        # Get metrics summary
        summary = collector.get_metrics_summary(component="test_comp", minutes=5)
        print(f"\nMetrics Summary:")
        print(f"  Counters: {summary.get('counters', {})}")
        print(f"  Gauges: {summary.get('gauges', {})}")
        print(f"  Histograms: {list(summary.get('histograms', {}).keys())}")

        # Get collection stats
        stats = collector.get_collection_stats()
        print(f"\nCollection Statistics:")
        print(f"  Metrics Collected: {stats['metrics_collected']}")
        print(f"  Aggregations Performed: {stats['aggregations_performed']}")
        print(f"  Collection Errors: {stats['collection_errors']}")

        # Export Prometheus format
        prometheus_data = collector.export_prometheus_format()
        print(f"\nPrometheus Export (first 500 chars):")
        print(prometheus_data[:500] + "..." if len(prometheus_data) > 500 else prometheus_data)

    except Exception as e:
        print(f"Performance monitoring error: {e}")
        logging.exception("Performance monitoring error")
    finally:
        await collector.stop()

async def main():
    """
    Main function running all examples
    """
    # Setup logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )

    print("GaryTaleb Data Pipeline - Usage Examples")
    print("=" * 50)

    try:
        # Run examples (comment out ones you don't want to run)
        await basic_pipeline_example()
        await historical_data_example()
        # await real_time_streaming_example()  # Requires API keys
        await data_quality_example()
        await performance_monitoring_example()

    except KeyboardInterrupt:
        print("\nExamples interrupted by user")
    except Exception as e:
        print(f"\nExample execution error: {e}")
        logging.exception("Example execution error")

    print("\n=== All examples completed ===")

if __name__ == "__main__":
    asyncio.run(main())