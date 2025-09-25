"""Data Processing Pipeline Implementation.

Implements Pipeline + Chain of Responsibility patterns for data processing.
Provides pluggable processors for flexible data transformation workflows.
"""

from typing import Dict, List, Any, Optional
import logging

from dataclasses import dataclass
import numpy as np
import pandas as pd

from src.patterns.base.pipeline_pattern import (
    Pipeline, Processor, ProcessingContext, ProcessingResult,
    PipelineBuilder, ChainOfResponsibilityHandler
)

logger = logging.getLogger(__name__)

@dataclass
class MarketData:
    """Market data structure."""
    symbol: str
    timestamp: float
    price: float
    volume: int
    features: Dict[str, float]

class SentimentProcessor(Processor[Dict[str, Any], Dict[str, Any]]):
    """Processes sentiment data."""

    def __init__(self):
        super().__init__("sentiment_processor")

    def _process_stage(self, context: ProcessingContext) -> ProcessingResult:
        """Process sentiment analysis."""
        try:
            data = context.data
            if 'sentiment_score' not in data:
                data['sentiment_score'] = np.random.uniform(-1, 1)
                data['sentiment_confidence'] = np.random.uniform(0.5, 1.0)
            
            context.metadata['sentiment_processed'] = True
            return ProcessingResult.SUCCESS

        except Exception as e:
            logger.error(f"Sentiment processing failed: {e}")
            return ProcessingResult.FAILURE

    def can_handle(self, context: ProcessingContext) -> bool:
        """Check if can handle sentiment processing."""
        return isinstance(context.data, dict)

class NewsProcessor(Processor[Dict[str, Any], Dict[str, Any]]):
    """Processes news data."""

    def __init__(self):
        super().__init__("news_processor")

    def _process_stage(self, context: ProcessingContext) -> ProcessingResult:
        """Process news data."""
        try:
            data = context.data
            if 'news_impact' not in data:
                data['news_impact'] = np.random.uniform(0, 1)
                data['news_count'] = np.random.randint(1, 10)
            
            context.metadata['news_processed'] = True
            return ProcessingResult.SUCCESS

        except Exception as e:
            logger.error(f"News processing failed: {e}")
            return ProcessingResult.FAILURE

    def can_handle(self, context: ProcessingContext) -> bool:
        """Check if can handle news processing."""
        return isinstance(context.data, dict)

class OptionsFlowProcessor(Processor[Dict[str, Any], Dict[str, Any]]):
    """Processes options flow data."""

    def __init__(self):
        super().__init__("options_flow_processor")

    def _process_stage(self, context: ProcessingContext) -> ProcessingResult:
        """Process options flow data."""
        try:
            data = context.data
            if 'options_flow' not in data:
                data['options_flow'] = {
                    'call_volume': np.random.randint(1000, 10000),
                    'put_volume': np.random.randint(1000, 10000),
                    'put_call_ratio': np.random.uniform(0.5, 2.0)
                }
            
            context.metadata['options_flow_processed'] = True
            return ProcessingResult.SUCCESS

        except Exception as e:
            logger.error(f"Options flow processing failed: {e}")
            return ProcessingResult.FAILURE

    def can_handle(self, context: ProcessingContext) -> bool:
        """Check if can handle options flow processing."""
        return isinstance(context.data, dict)

class AlternativeDataProcessor(Processor[Dict[str, Any], Dict[str, Any]]):
    """Processes alternative data sources."""

    def __init__(self):
        super().__init__("alternative_data_processor")

    def _process_stage(self, context: ProcessingContext) -> ProcessingResult:
        """Process alternative data."""
        try:
            data = context.data
            if 'alternative_signals' not in data:
                data['alternative_signals'] = {
                    'social_media_buzz': np.random.uniform(0, 1),
                    'satellite_data': np.random.uniform(-1, 1),
                    'web_traffic': np.random.uniform(0, 2)
                }
            
            context.metadata['alternative_data_processed'] = True
            return ProcessingResult.SUCCESS

        except Exception as e:
            logger.error(f"Alternative data processing failed: {e}")
            return ProcessingResult.FAILURE

    def can_handle(self, context: ProcessingContext) -> bool:
        """Check if can handle alternative data processing."""
        return isinstance(context.data, dict)

class DataProcessingHandler(ChainOfResponsibilityHandler):
    """Base handler for data processing chain."""

    def __init__(self, name: str, data_type: str):
        super().__init__(name)
        self.data_type = data_type

    def can_handle(self, request: Any) -> bool:
        """Check if can handle request based on data type."""
        if isinstance(request, dict):
            return request.get('data_type') == self.data_type
        return False

class SentimentDataHandler(DataProcessingHandler):
    """Handler for sentiment data processing."""

    def __init__(self):
        super().__init__("sentiment_handler", "sentiment")

    def _handle_request(self, request: Any) -> Any:
        """Handle sentiment data request."""
        processor = SentimentProcessor()
        context = ProcessingContext(
            data=request['data'],
            metadata={},
            errors=[],
            warnings=[],
            processing_history=[]
        )
        
        result_context = processor.process(context)
        return {
            'processed_data': result_context.data,
            'metadata': result_context.metadata,
            'success': len(result_context.errors) == 0
        }

class NewsDataHandler(DataProcessingHandler):
    """Handler for news data processing."""

    def __init__(self):
        super().__init__("news_handler", "news")

    def _handle_request(self, request: Any) -> Any:
        """Handle news data request."""
        processor = NewsProcessor()
        context = ProcessingContext(
            data=request['data'],
            metadata={},
            errors=[],
            warnings=[],
            processing_history=[]
        )
        
        result_context = processor.process(context)
        return {
            'processed_data': result_context.data,
            'metadata': result_context.metadata,
            'success': len(result_context.errors) == 0
        }

class DataProcessingPipeline:
    """Main data processing pipeline using patterns."""

    def __init__(self):
        self.pipeline = self._build_pipeline()
        self.chain_handler = self._build_chain()

    def _build_pipeline(self) -> Pipeline:
        """Build the processing pipeline."""
        builder = PipelineBuilder("market_data_pipeline")
        
        # Add processors in order
        builder.add_transform(
            "sentiment_transform",
            lambda data: self._ensure_sentiment_features(data)
        )
        
        builder.add_transform(
            "news_transform", 
            lambda data: self._ensure_news_features(data)
        )
        
        builder.add_transform(
            "options_transform",
            lambda data: self._ensure_options_features(data)
        )
        
        builder.add_transform(
            "alternative_transform",
            lambda data: self._ensure_alternative_features(data)
        )
        
        # Add error handler
        builder.add_error_handler(self._handle_pipeline_errors)
        
        return builder.build()

    def _build_chain(self) -> ChainOfResponsibilityHandler:
        """Build the chain of responsibility."""
        sentiment_handler = SentimentDataHandler()
        news_handler = NewsDataHandler()
        
        # Chain handlers
        sentiment_handler.set_next(news_handler)
        
        return sentiment_handler

    def _ensure_sentiment_features(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Ensure sentiment features are present."""
        if 'sentiment_score' not in data:
            data['sentiment_score'] = 0.0
            data['sentiment_confidence'] = 0.5
        return data

    def _ensure_news_features(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Ensure news features are present."""
        if 'news_impact' not in data:
            data['news_impact'] = 0.0
            data['news_count'] = 0
        return data

    def _ensure_options_features(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Ensure options features are present."""
        if 'options_flow' not in data:
            data['options_flow'] = {
                'call_volume': 0,
                'put_volume': 0,
                'put_call_ratio': 1.0
            }
        return data

    def _ensure_alternative_features(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Ensure alternative data features are present."""
        if 'alternative_signals' not in data:
            data['alternative_signals'] = {
                'social_media_buzz': 0.0,
                'satellite_data': 0.0,
                'web_traffic': 0.0
            }
        return data

    def _handle_pipeline_errors(self, context: ProcessingContext) -> None:
        """Handle pipeline errors."""
        logger.error(f"Pipeline errors: {context.errors}")
        for error in context.errors:
            logger.error(f"Error details: {error}")

    def process_market_data(self, market_data: Dict[str, Any]) -> ProcessingContext:
        """Process market data through pipeline."""
        return self.pipeline.execute(market_data)

    def process_data_request(self, request: Dict[str, Any]) -> Any:
        """Process data request through chain of responsibility."""
        return self.chain_handler.handle(request)

    def get_pipeline_info(self) -> Dict[str, Any]:
        """Get pipeline information."""
        return {
            'name': self.pipeline.name,
            'processors': self.pipeline.get_processor_chain(),
            'error_handlers_count': len(self.pipeline.error_handlers)
        }

# Factory function for creating the pipeline
def create_data_processing_pipeline() -> DataProcessingPipeline:
    """Create configured data processing pipeline."""
    return DataProcessingPipeline()
