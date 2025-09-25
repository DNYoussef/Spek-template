"""Pipeline and Chain of Responsibility Pattern Base Classes.

Provides base classes for implementing data processing pipelines with
chain of responsibility patterns for flexible, extensible data processing.
"""

from typing import Any, Dict, List, Optional, TypeVar, Generic, Callable
import logging

from abc import ABC, abstractmethod
from dataclasses import dataclass
from enum import Enum

logger = logging.getLogger(__name__)

T = TypeVar('T')
R = TypeVar('R')

class ProcessingResult(Enum):
    """Result of processing operation."""
    SUCCESS = "success"
    FAILURE = "failure"
    SKIP = "skip"
    RETRY = "retry"

@dataclass
class ProcessingContext:
    """Context passed through processing pipeline."""
    data: Any
    metadata: Dict[str, Any]
    errors: List[str]
    warnings: List[str]
    processing_history: List[str]

    def __post_init__(self):
        if self.metadata is None:
            self.metadata = {}
        if self.errors is None:
            self.errors = []
        if self.warnings is None:
            self.warnings = []
        if self.processing_history is None:
            self.processing_history = []

class Processor(ABC, Generic[T, R]):
    """Abstract base processor in the pipeline."""

    def __init__(self, name: str):
        self.name = name
        self.next_processor: Optional['Processor'] = None

    def set_next(self, processor: 'Processor') -> 'Processor':
        """Set next processor in chain."""
        self.next_processor = processor
        return processor

    def process(self, context: ProcessingContext) -> ProcessingContext:
        """Process data and pass to next processor."""
        try:
            context.processing_history.append(f"Started: {self.name}")

            # Process current stage
            result = self._process_stage(context)

            if result == ProcessingResult.SUCCESS:
                context.processing_history.append(f"Completed: {self.name}")

                # Continue to next processor
                if self.next_processor:
                    return self.next_processor.process(context)

            elif result == ProcessingResult.SKIP:
                context.processing_history.append(f"Skipped: {self.name}")
                # Skip to next processor
                if self.next_processor:
                    return self.next_processor.process(context)

            elif result == ProcessingResult.FAILURE:
                context.errors.append(f"Processing failed at: {self.name}")

            # For RETRY or FAILURE, return context as-is
            return context

        except Exception as e:
            logger.error(f"Error in processor {self.name}: {e}")
            context.errors.append(f"Exception in {self.name}: {str(e)}")
            return context

    @abstractmethod
    def _process_stage(self, context: ProcessingContext) -> ProcessingResult:
        """Process single stage - implemented by subclasses."""

    @abstractmethod
    def can_handle(self, context: ProcessingContext) -> bool:
        """Check if processor can handle the context."""

class ConditionalProcessor(Processor[T, R]):
    """Processor that only executes based on condition."""

    def __init__(self, name: str, condition: Callable[[ProcessingContext], bool]):
        super().__init__(name)
        self.condition = condition

    def can_handle(self, context: ProcessingContext) -> bool:
        """Check condition to determine if should handle."""
        try:
            return self.condition(context)
        except Exception as e:
            logger.error(f"Condition evaluation failed in {self.name}: {e}")
            return False

class Pipeline(Generic[T, R]):
    """Processing pipeline coordinator."""

    def __init__(self, name: str):
        self.name = name
        self.processors: List[Processor] = []
        self.error_handlers: List[Callable[[ProcessingContext], None]] = []

    def add_processor(self, processor: Processor) -> 'Pipeline':
        """Add processor to pipeline."""
        if self.processors:
            self.processors[-1].set_next(processor)
        self.processors.append(processor)
        return self

    def add_error_handler(self, handler: Callable[[ProcessingContext], None]) -> 'Pipeline':
        """Add error handler."""
        self.error_handlers.append(handler)
        return self

    def execute(self, data: T, metadata: Optional[Dict[str, Any]] = None) -> ProcessingContext:
        """Execute pipeline processing."""
        context = ProcessingContext(
            data=data,
            metadata=metadata or {},
            errors=[],
            warnings=[],
            processing_history=[]
        )

        try:
            if not self.processors:
                context.warnings.append("No processors configured in pipeline")
                return context

            # Start processing with first processor
            context = self.processors[0].process(context)

            # Handle any errors
            if context.errors and self.error_handlers:
                for handler in self.error_handlers:
                    try:
                        handler(context)
                    except Exception as e:
                        logger.error(f"Error handler failed: {e}")

            return context

        except Exception as e:
            logger.error(f"Pipeline execution failed: {e}")
            context.errors.append(f"Pipeline execution failed: {str(e)}")
            return context

    def get_processor_chain(self) -> List[str]:
        """Get list of processor names in order."""
        return [p.name for p in self.processors]

class FilterProcessor(Processor[T, T]):
    """Processor that filters data based on criteria."""

    def __init__(self, name: str, filter_func: Callable[[Any], bool]):
        super().__init__(name)
        self.filter_func = filter_func

    def _process_stage(self, context: ProcessingContext) -> ProcessingResult:
        """Apply filter to context data."""
        try:
            if self.filter_func(context.data):
                return ProcessingResult.SUCCESS
            else:
                return ProcessingResult.SKIP
        except Exception as e:
            logger.error(f"Filter failed: {e}")
            return ProcessingResult.FAILURE

    def can_handle(self, context: ProcessingContext) -> bool:
        """Filter can handle any context."""
        return True

class TransformProcessor(Processor[T, R]):
    """Processor that transforms data."""

    def __init__(self, name: str, transform_func: Callable[[Any], Any]):
        super().__init__(name)
        self.transform_func = transform_func

    def _process_stage(self, context: ProcessingContext) -> ProcessingResult:
        """Transform context data."""
        try:
            context.data = self.transform_func(context.data)
            return ProcessingResult.SUCCESS
        except Exception as e:
            logger.error(f"Transform failed: {e}")
            return ProcessingResult.FAILURE

    def can_handle(self, context: ProcessingContext) -> bool:
        """Transform can handle any context."""
        return True

class PipelineBuilder:
    """Builder for constructing processing pipelines."""

    def __init__(self, name: str):
        self.pipeline = Pipeline(name)

    def add_filter(self, name: str, filter_func: Callable[[Any], bool]) -> 'PipelineBuilder':
        """Add filter processor."""
        self.pipeline.add_processor(FilterProcessor(name, filter_func))
        return self

    def add_transform(self, name: str, transform_func: Callable[[Any], Any]) -> 'PipelineBuilder':
        """Add transform processor."""
        self.pipeline.add_processor(TransformProcessor(name, transform_func))
        return self

    def add_conditional(self, name: str, condition: Callable[[ProcessingContext], bool],
                        process_func: Callable[[ProcessingContext], ProcessingResult]) -> 'PipelineBuilder':
        """Add conditional processor."""
        class CustomConditionalProcessor(ConditionalProcessor):
            def _process_stage(self, context: ProcessingContext) -> ProcessingResult:
                return process_func(context)

        self.pipeline.add_processor(CustomConditionalProcessor(name, condition))
        return self

    def add_error_handler(self, handler: Callable[[ProcessingContext], None]) -> 'PipelineBuilder':
        """Add error handler."""
        self.pipeline.add_error_handler(handler)
        return self

    def build(self) -> Pipeline:
        """Build the pipeline."""
        return self.pipeline

class ChainOfResponsibilityHandler(ABC):
    """Base handler for chain of responsibility pattern."""

    def __init__(self, name: str):
        self.name = name
        self._next_handler: Optional['ChainOfResponsibilityHandler'] = None

    def set_next(self, handler: 'ChainOfResponsibilityHandler') -> 'ChainOfResponsibilityHandler':
        """Set next handler in chain."""
        self._next_handler = handler
        return handler

    def handle(self, request: Any) -> Any:
        """Handle request or pass to next handler."""
        if self.can_handle(request):
            return self._handle_request(request)
        elif self._next_handler:
            return self._next_handler.handle(request)
        else:
            raise ValueError(f"No handler found for request type: {type(request)}")

    @abstractmethod
    def can_handle(self, request: Any) -> bool:
        """Check if this handler can process the request."""

    @abstractmethod
    def _handle_request(self, request: Any) -> Any:
        """Handle the request - implemented by subclasses."""