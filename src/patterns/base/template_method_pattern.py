"""Template Method Pattern Base Classes.

Provides base classes for implementing template method patterns with factory
integration for neural network and intelligence system implementations.
"""

from typing import Any, Dict, List, Optional, TypeVar, Generic, Type
import logging
import time

from abc import ABC, abstractmethod
from dataclasses import dataclass
from enum import Enum

logger = logging.getLogger(__name__)

T = TypeVar('T')
R = TypeVar('R')

class ProcessingStage(Enum):
    """Processing stages for template method."""
    INITIALIZE = "initialize"
    PREPROCESS = "preprocess"
    PROCESS = "process"
    POSTPROCESS = "postprocess"
    FINALIZE = "finalize"

@dataclass
class ProcessingContext:
    """Context for template method processing."""
    input_data: Any
    intermediate_results: Dict[str, Any]
    metadata: Dict[str, Any]
    errors: List[str]
    current_stage: ProcessingStage

    def __post_init__(self):
        if self.intermediate_results is None:
            self.intermediate_results = {}
        if self.metadata is None:
            self.metadata = {}
        if self.errors is None:
            self.errors = []

class AbstractAlgorithm(ABC, Generic[T, R]):
    """Abstract template method algorithm."""

    def __init__(self, name: str):
        self.name = name
        self.execution_history: List[Dict[str, Any]] = []

    def execute(self, input_data: T) -> R:
        """Template method that defines the algorithm structure."""
        start_time = time.perf_counter()
        context = ProcessingContext(
            input_data=input_data,
            intermediate_results={},
            metadata={},
            errors=[],
            current_stage=ProcessingStage.INITIALIZE
        )

        try:
            # Template method steps
            context.current_stage = ProcessingStage.INITIALIZE
            self.initialize(context)

            context.current_stage = ProcessingStage.PREPROCESS
            self.preprocess(context)

            context.current_stage = ProcessingStage.PROCESS
            result = self.process_main(context)

            context.current_stage = ProcessingStage.POSTPROCESS
            result = self.postprocess(context, result)

            context.current_stage = ProcessingStage.FINALIZE
            final_result = self.finalize(context, result)

            # Record execution
            execution_time = (time.perf_counter() - start_time) * 1000
            self._record_execution(context, final_result, execution_time, True)

            return final_result

        except Exception as e:
            execution_time = (time.perf_counter() - start_time) * 1000
            logger.error(f"Algorithm {self.name} failed at {context.current_stage}: {e}")
            context.errors.append(str(e))
            self._record_execution(context, None, execution_time, False)
            raise

    def initialize(self, context: ProcessingContext) -> None:
        """Initialize processing - can be overridden."""
        logger.debug(f"Initializing {self.name}")

    @abstractmethod
    def preprocess(self, context: ProcessingContext) -> None:
        """Preprocess input data - must be implemented."""

    @abstractmethod
    def process_main(self, context: ProcessingContext) -> R:
        """Main processing logic - must be implemented."""

    def postprocess(self, context: ProcessingContext, result: R) -> R:
        """Postprocess result - can be overridden."""
        logger.debug(f"Postprocessing {self.name}")
        return result

    def finalize(self, context: ProcessingContext, result: R) -> R:
        """Finalize processing - can be overridden."""
        logger.debug(f"Finalizing {self.name}")
        return result

    def _record_execution(self, context: ProcessingContext, result: Any,
                        execution_time: float, success: bool) -> None:
        """Record execution history."""
        self.execution_history.append({
            'timestamp': time.time(),
            'success': success,
            'execution_time_ms': execution_time,
            'stage': context.current_stage.value,
            'errors': context.errors.copy(),
            'metadata': context.metadata.copy()
        })

        # Keep only last 100 executions
        if len(self.execution_history) > 100:
            self.execution_history.pop(0)

    def get_performance_metrics(self) -> Dict[str, Any]:
        """Get performance metrics."""
        if not self.execution_history:
            return {"message": "No executions recorded"}

        successful_runs = [e for e in self.execution_history if e['success']]
        total_runs = len(self.execution_history)

        if successful_runs:
            avg_time = sum(e['execution_time_ms'] for e in successful_runs) / len(successful_runs)
        else:
            avg_time = 0

        return {
            'algorithm_name': self.name,
            'total_executions': total_runs,
            'successful_executions': len(successful_runs),
            'success_rate': len(successful_runs) / total_runs if total_runs > 0 else 0,
            'average_execution_time_ms': avg_time,
            'recent_errors': [e['errors'] for e in self.execution_history[-10:] if e['errors']]
        }

class MachineLearningAlgorithm(AbstractAlgorithm[Dict[str, Any], Dict[str, Any]]):
    """Template for machine learning algorithms."""

    def __init__(self, name: str, model_type: str):
        super().__init__(name)
        self.model_type = model_type
        self.model = None
        self.is_trained = False

    def preprocess(self, context: ProcessingContext) -> None:
        """Preprocess ML data."""
        data = context.input_data

        # Store original data
        context.intermediate_results['original_data'] = data

        # Basic preprocessing steps
        processed_data = self._normalize_data(data)
        processed_data = self._handle_missing_values(processed_data)
        processed_data = self._feature_engineering(processed_data)

        context.intermediate_results['preprocessed_data'] = processed_data

    def process_main(self, context: ProcessingContext) -> Dict[str, Any]:
        """Main ML processing."""
        data = context.intermediate_results['preprocessed_data']

        if not self.is_trained:
            # Training phase
            self.model = self._create_model(context)
            self._train_model(self.model, data, context)
            self.is_trained = True
            return {'phase': 'training', 'model': self.model}
        else:
            # Inference phase
            predictions = self._predict(self.model, data, context)
            return {'phase': 'inference', 'predictions': predictions}

    def postprocess(self, context: ProcessingContext, result: Dict[str, Any]) -> Dict[str, Any]:
        """Postprocess ML results."""
        if result['phase'] == 'inference':
            # Post-process predictions
            predictions = result['predictions']
            processed_predictions = self._postprocess_predictions(predictions, context)
            result['processed_predictions'] = processed_predictions

        # Add model metadata
        result['model_metadata'] = self._get_model_metadata()
        return result

    @abstractmethod
    def _create_model(self, context: ProcessingContext) -> Any:
        """Create ML model - must be implemented."""

    @abstractmethod
    def _train_model(self, model: Any, data: Any, context: ProcessingContext) -> None:
        """Train ML model - must be implemented."""

    @abstractmethod
    def _predict(self, model: Any, data: Any, context: ProcessingContext) -> Any:
        """Make predictions - must be implemented."""

    def _normalize_data(self, data: Any) -> Any:
        """Normalize data - can be overridden."""
        return data

    def _handle_missing_values(self, data: Any) -> Any:
        """Handle missing values - can be overridden."""
        return data

    def _feature_engineering(self, data: Any) -> Any:
        """Feature engineering - can be overridden."""
        return data

    def _postprocess_predictions(self, predictions: Any, context: ProcessingContext) -> Any:
        """Postprocess predictions - can be overridden."""
        return predictions

    def _get_model_metadata(self) -> Dict[str, Any]:
        """Get model metadata - can be overridden."""
        return {
            'model_type': self.model_type,
            'is_trained': self.is_trained,
            'algorithm_name': self.name
        }

class NeuralNetworkAlgorithm(MachineLearningAlgorithm):
    """Template for neural network algorithms."""

    def __init__(self, name: str, architecture: str, layers: List[int]):
        super().__init__(name, 'neural_network')
        self.architecture = architecture
        self.layers = layers
        self.training_history = []

    def _create_model(self, context: ProcessingContext) -> Any:
        """Create neural network model."""
        # Simplified model creation
        model_config = {
            'architecture': self.architecture,
            'layers': self.layers,
            'input_shape': self._infer_input_shape(context),
            'output_shape': self._infer_output_shape(context)
        }

        context.metadata['model_config'] = model_config
        logger.info(f"Created neural network: {model_config}")

        # Return mock model object
        return {'config': model_config, 'weights': None, 'trained': False}

    def _train_model(self, model: Any, data: Any, context: ProcessingContext) -> None:
        """Train neural network."""
        # Simplified training simulation
        epochs = context.metadata.get('epochs', 10)

        for epoch in range(epochs):
            # Simulate training step
            loss = 1.0 / (epoch + 1)  # Decreasing loss
            accuracy = min(0.9, 0.1 + (epoch * 0.8))  # Increasing accuracy

            self.training_history.append({
                'epoch': epoch,
                'loss': loss,
                'accuracy': accuracy
            })

        model['trained'] = True
        model['training_history'] = self.training_history
        context.metadata['training_completed'] = True

    def _predict(self, model: Any, data: Any, context: ProcessingContext) -> Any:
        """Make neural network predictions."""
        # Simplified prediction
        if not model['trained']:
            raise ValueError("Model not trained")

        # Mock predictions
        predictions = {
            'predicted_values': [0.8, 0.6, 0.9],  # Mock predictions
            'confidence_scores': [0.85, 0.72, 0.91],
            'prediction_count': 3
        }

        return predictions

    def _infer_input_shape(self, context: ProcessingContext) -> tuple:
        """Infer input shape from data."""
        # Simplified shape inference
        return (None, 10)  # Mock shape

    def _infer_output_shape(self, context: ProcessingContext) -> tuple:
        """Infer output shape."""
        # Simplified output shape
        return (None, 1)  # Mock shape

class AlgorithmFactory:
    """Factory for creating template method algorithms."""

    def __init__(self):
        self._algorithm_types: Dict[str, Type[AbstractAlgorithm]] = {}

    def register_algorithm(self, name: str, algorithm_class: Type[AbstractAlgorithm]) -> None:
        """Register algorithm type."""
        self._algorithm_types[name] = algorithm_class
        logger.info(f"Registered algorithm type: {name}")

    def create_algorithm(self, algorithm_type: str, name: str, **kwargs) -> Optional[AbstractAlgorithm]:
        """Create algorithm instance."""
        if algorithm_type not in self._algorithm_types:
            logger.error(f"Unknown algorithm type: {algorithm_type}")
            return None

        try:
            algorithm_class = self._algorithm_types[algorithm_type]
            return algorithm_class(name, **kwargs)
        except Exception as e:
            logger.error(f"Failed to create algorithm {algorithm_type}: {e}")
            return None

    def get_available_types(self) -> List[str]:
        """Get available algorithm types."""
        return list(self._algorithm_types.keys())

class ConcreteNeuralNetworkAlgorithm(NeuralNetworkAlgorithm):
    """Concrete neural network implementation."""

    def __init__(self, name: str):
        super().__init__(name, "feedforward", [64, 32, 16])

class IntelligenceSystemTemplate(AbstractAlgorithm[Dict[str, Any], Dict[str, Any]]):
    """Template for intelligence systems."""

    def __init__(self, name: str):
        super().__init__(name)
        self.knowledge_base = {}
        self.reasoning_engine = None

    def preprocess(self, context: ProcessingContext) -> None:
        """Preprocess intelligence data."""
        input_data = context.input_data

        # Extract features
        features = self._extract_features(input_data)
        context.intermediate_results['features'] = features

        # Update knowledge base
        self._update_knowledge_base(features)

    def process_main(self, context: ProcessingContext) -> Dict[str, Any]:
        """Main intelligence processing."""
        features = context.intermediate_results['features']

        # Reasoning
        reasoning_result = self._apply_reasoning(features, context)

        # Decision making
        decisions = self._make_decisions(reasoning_result, context)

        return {
            'reasoning_result': reasoning_result,
            'decisions': decisions,
            'knowledge_base_size': len(self.knowledge_base)
        }

    @abstractmethod
    def _extract_features(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Extract features - must be implemented."""

    @abstractmethod
    def _apply_reasoning(self, features: Dict[str, Any], context: ProcessingContext) -> Dict[str, Any]:
        """Apply reasoning - must be implemented."""

    @abstractmethod
    def _make_decisions(self, reasoning_result: Dict[str, Any], context: ProcessingContext) -> List[str]:
        """Make decisions - must be implemented."""

    def _update_knowledge_base(self, features: Dict[str, Any]) -> None:
        """Update knowledge base - can be overridden."""
        for key, value in features.items():
            self.knowledge_base[key] = value

# Example concrete implementation
class ConcreteIntelligenceSystem(IntelligenceSystemTemplate):
    """Concrete intelligence system implementation."""

    def _extract_features(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Extract features from input data."""
        return {
            'sentiment': data.get('sentiment', 0.0),
            'complexity': len(str(data)),
            'timestamp': time.time()
        }

    def _apply_reasoning(self, features: Dict[str, Any], context: ProcessingContext) -> Dict[str, Any]:
        """Apply reasoning logic."""
        sentiment = features['sentiment']
        complexity = features['complexity']

        confidence = min(1.0, abs(sentiment) + (complexity / 1000))

        return {
            'confidence': confidence,
            'reasoning_path': ['feature_analysis', 'confidence_calculation'],
            'sentiment_analysis': sentiment > 0.5
        }

    def _make_decisions(self, reasoning_result: Dict[str, Any], context: ProcessingContext) -> List[str]:
        """Make decisions based on reasoning."""
        confidence = reasoning_result['confidence']

        if confidence > 0.8:
            return ['high_confidence_action', 'proceed']
        elif confidence > 0.5:
            return ['moderate_confidence_action', 'investigate']
        else:
            return ['low_confidence_action', 'wait']