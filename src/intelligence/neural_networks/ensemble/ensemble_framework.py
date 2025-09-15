"""Neural Ensemble Framework

Main ensemble framework combining all neural models for comprehensive
trading signal generation with Gary×Taleb integration.
"""

import torch
import torch.nn as nn
import numpy as np
import pandas as pd
from typing import Dict, List, Tuple, Optional, Any, Union, Callable
from dataclasses import dataclass
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
import threading
from collections import deque

# Import individual models
from ..lstm.lstm_predictor import LSTMPredictor, create_lstm_predictor
from ..transformer.sentiment_analyzer import FinancialSentimentAnalyzer, create_sentiment_analyzer
from ..cnn.pattern_recognizer import ChartPatternCNN, create_pattern_recognizer
from ..rl.strategy_optimizer import StrategyOptimizerRL, create_strategy_optimizer


@dataclass
class EnsembleConfig:
    """Configuration for neural ensemble."""
    # Model weights
    lstm_weight: float = 0.30
    transformer_weight: float = 0.25
    cnn_weight: float = 0.25
    rl_weight: float = 0.20

    # Ensemble strategy
    strategy: str = 'weighted_voting'  # 'voting', 'weighted_voting', 'blending', 'stacking'

    # Gary×Taleb integration
    gary_dpi_ensemble_weight: float = 0.35
    taleb_antifragile_ensemble_weight: float = 0.25
    volatility_adaptive_weighting: bool = True

    # Performance optimization
    parallel_inference: bool = True
    max_workers: int = 4
    cache_predictions: bool = True
    cache_size: int = 1000

    # Target performance
    target_ensemble_inference_ms: float = 90.0
    confidence_threshold: float = 0.65
    signal_aggregation_method: str = 'weighted_average'  # 'average', 'weighted_average', 'majority_vote'

    # Real-time adaptation
    adaptive_weights: bool = True
    performance_window: int = 100
    weight_adaptation_rate: float = 0.05


class ModelPrediction:
    """Container for individual model predictions."""

    def __init__(self,
                 model_name: str,
                 prediction: Union[np.ndarray, Dict[str, Any]],
                 confidence: float,
                 inference_time_ms: float,
                 model_specific_data: Optional[Dict[str, Any]] = None):
        """Initialize model prediction.

        Args:
            model_name: Name of the model
            prediction: Model prediction (format varies by model)
            confidence: Prediction confidence [0, 1]
            inference_time_ms: Inference time in milliseconds
            model_specific_data: Additional model-specific data
        """
        self.model_name = model_name
        self.prediction = prediction
        self.confidence = confidence
        self.inference_time_ms = inference_time_ms
        self.model_specific_data = model_specific_data or {}
        self.timestamp = time.time()

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary representation."""
        return {
            'model_name': self.model_name,
            'prediction': self.prediction,
            'confidence': self.confidence,
            'inference_time_ms': self.inference_time_ms,
            'model_specific_data': self.model_specific_data,
            'timestamp': self.timestamp
        }


class NeuralEnsemble:
    """Neural ensemble for comprehensive trading signal generation.

    Combines:
    - LSTM: Price prediction with attention
    - Transformer: Sentiment analysis
    - CNN: Chart pattern recognition
    - RL: Strategy optimization

    Features:
    - Gary×Taleb integration across all models
    - Parallel inference for speed
    - Adaptive model weighting
    - Multiple ensemble strategies
    - Real-time performance optimization
    """

    def __init__(self, config: EnsembleConfig):
        """Initialize neural ensemble.

        Args:
            config: Ensemble configuration
        """
        self.config = config
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

        # Initialize individual models
        self.models = {}
        self.model_weights = {}
        self.model_performance_history = {}

        # Performance tracking
        self.ensemble_inference_times = deque(maxlen=1000)
        self.prediction_cache = {} if config.cache_predictions else None
        self.cache_lock = threading.Lock() if config.cache_predictions else None

        # Adaptive weighting system
        self.adaptive_weights = {
            'lstm': config.lstm_weight,
            'transformer': config.transformer_weight,
            'cnn': config.cnn_weight,
            'rl': config.rl_weight
        }

        # Performance tracking for adaptation
        self.model_performance_scores = {
            'lstm': deque(maxlen=config.performance_window),
            'transformer': deque(maxlen=config.performance_window),
            'cnn': deque(maxlen=config.performance_window),
            'rl': deque(maxlen=config.performance_window)
        }

        # Gary×Taleb ensemble state
        self.gary_dpi_ensemble_factors = {
            'momentum_consensus': 0.0,
            'volume_confirmation': 0.0,
            'technical_alignment': 0.0,
            'pattern_confirmation': 0.0
        }

        self.taleb_antifragile_ensemble_factors = {
            'volatility_opportunity': 0.0,
            'asymmetric_payoff': 0.0,
            'model_consensus_uncertainty': 0.0,
            'tail_risk_assessment': 0.0
        }

        # Thread pool for parallel inference
        if config.parallel_inference:
            self.executor = ThreadPoolExecutor(max_workers=config.max_workers)
        else:
            self.executor = None

    def initialize_models(self,
                         market_data: Optional[pd.DataFrame] = None,
                         model_configs: Optional[Dict[str, Any]] = None) -> Dict[str, bool]:
        """Initialize all individual models.

        Args:
            market_data: Market data for RL training
            model_configs: Custom configurations for each model

        Returns:
            Dictionary indicating successful initialization of each model
        """
        model_configs = model_configs or {}
        initialization_results = {}

        try:
            # Initialize LSTM predictor
            lstm_config = model_configs.get('lstm', {})
            self.models['lstm'] = create_lstm_predictor(
                sequence_length=lstm_config.get('sequence_length', 60),
                hidden_size=lstm_config.get('hidden_size', 128),
                enable_dpi=True,
                antifragility_weight=0.15
            )
            initialization_results['lstm'] = True

        except Exception as e:
            print(f\"Failed to initialize LSTM: {e}\")
            initialization_results['lstm'] = False

        try:
            # Initialize Sentiment Analyzer
            sentiment_config = model_configs.get('sentiment', {})
            self.models['transformer'] = create_sentiment_analyzer(
                max_length=sentiment_config.get('max_length', 256),
                enable_caching=True,
                dpi_integration=True,
                antifragile_enhancement=True
            )
            initialization_results['transformer'] = True

        except Exception as e:
            print(f\"Failed to initialize Sentiment Analyzer: {e}\")
            initialization_results['transformer'] = False

        try:
            # Initialize Chart Pattern CNN
            cnn_config = model_configs.get('cnn', {})
            self.models['cnn'] = create_pattern_recognizer(
                image_size=cnn_config.get('image_size', (224, 224)),
                confidence_threshold=0.7,
                enable_dpi=True,
                enable_antifragile=True,
                fast_mode=True
            )
            initialization_results['cnn'] = True

        except Exception as e:
            print(f\"Failed to initialize Chart Pattern CNN: {e}\")
            initialization_results['cnn'] = False

        try:
            # Initialize RL Strategy Optimizer
            if market_data is not None:
                rl_config = model_configs.get('rl', {})
                self.models['rl'] = create_strategy_optimizer(
                    market_data=market_data,
                    initial_capital=rl_config.get('initial_capital', 200.0),
                    algorithm='ppo',
                    enable_gary_dpi=True,
                    enable_taleb_antifragile=True,
                    fast_inference=True
                )
                initialization_results['rl'] = True
            else:
                print(\"Market data required for RL initialization\")
                initialization_results['rl'] = False

        except Exception as e:
            print(f\"Failed to initialize RL Strategy Optimizer: {e}\")
            initialization_results['rl'] = False

        # Update model weights based on successful initialization
        active_models = [k for k, v in initialization_results.items() if v]
        if active_models:
            self._rebalance_weights(active_models)

        print(f\"Ensemble initialized with {len(active_models)} models: {active_models}\")
        return initialization_results

    def predict(self,
                ohlcv_data: np.ndarray,
                text_data: Optional[List[str]] = None,
                market_context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Generate comprehensive trading signal from ensemble.

        Args:
            ohlcv_data: OHLCV market data [seq_len, 5]
            text_data: Optional text data for sentiment analysis
            market_context: Additional market context

        Returns:
            Comprehensive ensemble prediction with all model outputs
        """
        start_time = time.time()

        # Check prediction cache
        cache_key = None
        if self.prediction_cache is not None:
            cache_key = self._generate_cache_key(ohlcv_data, text_data, market_context)
            with self.cache_lock:
                if cache_key in self.prediction_cache:
                    cached_result = self.prediction_cache[cache_key].copy()
                    cached_result['from_cache'] = True
                    cached_result['total_inference_time_ms'] = (time.time() - start_time) * 1000
                    return cached_result

        # Prepare model inputs
        model_inputs = self._prepare_model_inputs(ohlcv_data, text_data, market_context)

        # Get predictions from all models
        if self.config.parallel_inference and self.executor:
            model_predictions = self._get_parallel_predictions(model_inputs)
        else:
            model_predictions = self._get_sequential_predictions(model_inputs)

        # Apply ensemble strategy
        ensemble_prediction = self._apply_ensemble_strategy(model_predictions)

        # Gary's DPI ensemble analysis
        gary_dpi_analysis = self._analyze_gary_dpi_ensemble(model_predictions, ensemble_prediction)

        # Taleb's antifragility ensemble assessment
        taleb_analysis = self._analyze_taleb_antifragile_ensemble(model_predictions, ensemble_prediction)

        # Generate final trading signal
        final_signal = self._generate_ensemble_trading_signal(
            ensemble_prediction, gary_dpi_analysis, taleb_analysis
        )

        # Track performance for adaptive weighting
        self._update_model_performance(model_predictions)

        # Calculate total inference time
        total_inference_time = (time.time() - start_time) * 1000
        self.ensemble_inference_times.append(total_inference_time)

        # Compile final result
        result = {
            'ensemble_prediction': ensemble_prediction,
            'individual_predictions': {k: v.to_dict() for k, v in model_predictions.items()},
            'gary_dpi_ensemble_analysis': gary_dpi_analysis,
            'taleb_antifragile_ensemble_analysis': taleb_analysis,
            'final_trading_signal': final_signal,
            'model_weights_used': self.adaptive_weights.copy(),
            'total_inference_time_ms': total_inference_time,
            'target_met': total_inference_time < self.config.target_ensemble_inference_ms,
            'active_models': list(model_predictions.keys()),
            'ensemble_confidence': self._calculate_ensemble_confidence(model_predictions),
            'consensus_strength': self._calculate_consensus_strength(model_predictions),
            'from_cache': False
        }

        # Update cache
        if self.prediction_cache is not None and len(self.prediction_cache) < self.config.cache_size:
            with self.cache_lock:
                self.prediction_cache[cache_key] = result.copy()

        # Adaptive weight updates
        if self.config.adaptive_weights:
            self._update_adaptive_weights()

        return result

    def _prepare_model_inputs(self,
                            ohlcv_data: np.ndarray,
                            text_data: Optional[List[str]],
                            market_context: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        \"\"\"Prepare inputs for each model type.\"\"\"\n        return {\n            'lstm': {\n                'sequence': ohlcv_data,\n                'market_context': market_context\n            },\n            'transformer': {\n                'texts': text_data or [\"Market update\"],  # Default text if none provided\n                'source_types': ['news'] * len(text_data) if text_data else ['news']\n            },\n            'cnn': {\n                'ohlcv_data': ohlcv_data,\n                'multi_timeframe_data': market_context.get('multi_timeframe_data') if market_context else None\n            },\n            'rl': {\n                'observation': self._create_rl_observation(ohlcv_data, market_context)\n            }\n        }\n        \n    def _create_rl_observation(self, \n                              ohlcv_data: np.ndarray, \n                              market_context: Optional[Dict[str, Any]]) -> np.ndarray:\n        \"\"\"Create observation for RL model.\"\"\"\n        # For simplicity, use flattened OHLCV data\n        # In production, this would be the properly formatted observation\n        # matching the RL environment's observation space\n        return ohlcv_data.flatten()[-60:] if len(ohlcv_data.flatten()) > 60 else ohlcv_data.flatten()\n        \n    def _get_parallel_predictions(self, model_inputs: Dict[str, Any]) -> Dict[str, ModelPrediction]:\n        \"\"\"Get predictions from all models in parallel.\"\"\"\n        futures = {}\n        results = {}\n        \n        # Submit prediction tasks\n        for model_name, model in self.models.items():\n            if model_name in model_inputs:\n                future = self.executor.submit(\n                    self._get_single_model_prediction,\n                    model_name, model, model_inputs[model_name]\n                )\n                futures[future] = model_name\n                \n        # Collect results\n        for future in as_completed(futures):\n            model_name = futures[future]\n            try:\n                prediction = future.result(timeout=1.0)  # 1 second timeout per model\n                results[model_name] = prediction\n            except Exception as e:\n                print(f\"Model {model_name} failed: {e}\")\n                # Create dummy prediction for failed model\n                results[model_name] = ModelPrediction(\n                    model_name=model_name,\n                    prediction={},\n                    confidence=0.0,\n                    inference_time_ms=1000.0,  # Penalty for failure\n                    model_specific_data={'error': str(e)}\n                )\n                \n        return results\n        \n    def _get_sequential_predictions(self, model_inputs: Dict[str, Any]) -> Dict[str, ModelPrediction]:\n        \"\"\"Get predictions from all models sequentially.\"\"\"\n        results = {}\n        \n        for model_name, model in self.models.items():\n            if model_name in model_inputs:\n                try:\n                    prediction = self._get_single_model_prediction(\n                        model_name, model, model_inputs[model_name]\n                    )\n                    results[model_name] = prediction\n                except Exception as e:\n                    print(f\"Model {model_name} failed: {e}\")\n                    results[model_name] = ModelPrediction(\n                        model_name=model_name,\n                        prediction={},\n                        confidence=0.0,\n                        inference_time_ms=1000.0,\n                        model_specific_data={'error': str(e)}\n                    )\n                    \n        return results\n        \n    def _get_single_model_prediction(self, \n                                    model_name: str, \n                                    model: Any, \n                                    inputs: Dict[str, Any]) -> ModelPrediction:\n        \"\"\"Get prediction from a single model.\"\"\"\n        start_time = time.time()\n        \n        try:\n            if model_name == 'lstm':\n                result = model.predict_single(\n                    inputs['sequence'],\n                    inputs.get('market_context')\n                )\n                prediction = {\n                    'price_prediction': result['price_prediction'],\n                    'volatility_prediction': result['volatility_prediction'],\n                    'confidence_scores': result['confidence_scores'],\n                    'dpi_score': result['dpi_score']\n                }\n                confidence = result['model_confidence']\n                \n            elif model_name == 'transformer':\n                # Analyze first text or use empty string\n                text = inputs['texts'][0] if inputs['texts'] else \"\"\n                source_type = inputs['source_types'][0] if inputs['source_types'] else 'news'\n                \n                result = model.analyze_sentiment(text, source_type)\n                prediction = {\n                    'sentiment': result['final_sentiment'],\n                    'confidence': result['confidence'],\n                    'trading_signal': result['trading_signal'],\n                    'market_impact': result['market_impact']\n                }\n                confidence = result['confidence']\n                \n            elif model_name == 'cnn':\n                result = model.detect_patterns(\n                    inputs['ohlcv_data'],\n                    inputs.get('multi_timeframe_data')\n                )\n                prediction = {\n                    'detected_patterns': result['detected_patterns'],\n                    'model_confidence': result['model_confidence'],\n                    'dpi_analysis': result['dpi_analysis'],\n                    'antifragile_assessment': result['antifragile_assessment']\n                }\n                confidence = result['model_confidence']\n                \n            elif model_name == 'rl':\n                result = model.optimize_single_action(\n                    inputs['observation'],\n                    inputs.get('market_context')\n                )\n                prediction = {\n                    'position_change': result['position_change'],\n                    'confidence': result['confidence'],\n                    'value_estimate': result['value_estimate'],\n                    'gary_dpi_analysis': result['gary_dpi_analysis']\n                }\n                confidence = result['confidence']\n                \n            else:\n                raise ValueError(f\"Unknown model type: {model_name}\")\n                \n        except Exception as e:\n            print(f\"Error in {model_name} prediction: {e}\")\n            prediction = {}\n            confidence = 0.0\n            \n        inference_time = (time.time() - start_time) * 1000\n        \n        return ModelPrediction(\n            model_name=model_name,\n            prediction=prediction,\n            confidence=confidence,\n            inference_time_ms=inference_time\n        )\n        \n    def _apply_ensemble_strategy(self, \n                               model_predictions: Dict[str, ModelPrediction]) -> Dict[str, Any]:\n        \"\"\"Apply ensemble strategy to combine model predictions.\"\"\"\n        if self.config.strategy == 'weighted_voting':\n            return self._weighted_voting_ensemble(model_predictions)\n        elif self.config.strategy == 'voting':\n            return self._simple_voting_ensemble(model_predictions)\n        elif self.config.strategy == 'blending':\n            return self._blending_ensemble(model_predictions)\n        elif self.config.strategy == 'stacking':\n            return self._stacking_ensemble(model_predictions)\n        else:\n            return self._weighted_voting_ensemble(model_predictions)  # Default\n            \n    def _weighted_voting_ensemble(self, \n                                 model_predictions: Dict[str, ModelPrediction]) -> Dict[str, Any]:\n        \"\"\"Combine predictions using weighted voting.\"\"\"\n        # Extract relevant signals from each model\n        signals = {}\n        confidences = {}\n        weights = {}\n        \n        for model_name, pred in model_predictions.items():\n            weight = self.adaptive_weights.get(model_name, 0.0)\n            if weight > 0 and pred.confidence > 0:\n                \n                if model_name == 'lstm':\n                    # Convert price prediction to signal\n                    price_pred = pred.prediction.get('price_prediction', [0])\n                    signal = np.mean(price_pred) if len(price_pred) > 0 else 0\n                    \n                elif model_name == 'transformer':\n                    signal = pred.prediction.get('sentiment', 0.0)\n                    \n                elif model_name == 'cnn':\n                    # Convert pattern detection to signal\n                    patterns = pred.prediction.get('detected_patterns', [])\n                    if patterns:\n                        # Average probability of bullish vs bearish patterns\n                        bullish_prob = sum(p['probability'] for p in patterns \n                                         if 'bullish' in p['characteristics']['bullish_implications'].lower())\n                        bearish_prob = sum(p['probability'] for p in patterns \n                                         if 'bearish' in p['characteristics']['bearish_implications'].lower())\n                        signal = (bullish_prob - bearish_prob) / len(patterns)\n                    else:\n                        signal = 0.0\n                        \n                elif model_name == 'rl':\n                    signal = pred.prediction.get('position_change', 0.0)\n                    \n                signals[model_name] = signal\n                confidences[model_name] = pred.confidence\n                weights[model_name] = weight\n                \n        # Weighted average of signals\n        if signals:\n            total_weight = sum(weights[name] * confidences[name] for name in signals.keys())\n            if total_weight > 0:\n                ensemble_signal = sum(\n                    signals[name] * weights[name] * confidences[name] \n                    for name in signals.keys()\n                ) / total_weight\n            else:\n                ensemble_signal = 0.0\n                \n            ensemble_confidence = sum(\n                confidences[name] * weights[name] \n                for name in signals.keys()\n            ) / sum(weights.values()) if weights else 0.0\n            \n        else:\n            ensemble_signal = 0.0\n            ensemble_confidence = 0.0\n            \n        return {\n            'signal': float(ensemble_signal),\n            'confidence': float(ensemble_confidence),\n            'individual_signals': signals,\n            'individual_confidences': confidences,\n            'weights_applied': weights,\n            'strategy': 'weighted_voting'\n        }\n        \n    def _simple_voting_ensemble(self, \n                               model_predictions: Dict[str, ModelPrediction]) -> Dict[str, Any]:\n        \"\"\"Simple majority voting ensemble.\"\"\"\n        votes = {'buy': 0, 'sell': 0, 'hold': 0}\n        \n        for model_name, pred in model_predictions.items():\n            if pred.confidence > self.config.confidence_threshold:\n                # Convert prediction to vote\n                if model_name == 'lstm':\n                    price_pred = pred.prediction.get('price_prediction', [0])\n                    avg_pred = np.mean(price_pred) if len(price_pred) > 0 else 0\n                    vote = 'buy' if avg_pred > 0.02 else ('sell' if avg_pred < -0.02 else 'hold')\n                    \n                elif model_name == 'transformer':\n                    sentiment = pred.prediction.get('sentiment', 0.0)\n                    vote = 'buy' if sentiment > 0.3 else ('sell' if sentiment < -0.3 else 'hold')\n                    \n                elif model_name == 'rl':\n                    pos_change = pred.prediction.get('position_change', 0.0)\n                    vote = 'buy' if pos_change > 0.2 else ('sell' if pos_change < -0.2 else 'hold')\n                    \n                else:\n                    vote = 'hold'\n                    \n                votes[vote] += 1\n                \n        # Determine majority vote\n        majority_vote = max(votes, key=votes.get)\n        confidence = votes[majority_vote] / sum(votes.values()) if sum(votes.values()) > 0 else 0\n        \n        return {\n            'signal': 1.0 if majority_vote == 'buy' else (-1.0 if majority_vote == 'sell' else 0.0),\n            'confidence': confidence,\n            'votes': votes,\n            'majority_vote': majority_vote,\n            'strategy': 'simple_voting'\n        }\n        \n    def _blending_ensemble(self, \n                          model_predictions: Dict[str, ModelPrediction]) -> Dict[str, Any]:\n        \"\"\"Linear blending of model outputs.\"\"\"\n        # Placeholder for more sophisticated blending\n        # For now, use weighted voting\n        return self._weighted_voting_ensemble(model_predictions)\n        \n    def _stacking_ensemble(self, \n                          model_predictions: Dict[str, ModelPrediction]) -> Dict[str, Any]:\n        \"\"\"Stacking ensemble with meta-learner.\"\"\"\n        # Placeholder for stacking implementation\n        # For now, use weighted voting\n        return self._weighted_voting_ensemble(model_predictions)\n        \n    def _analyze_gary_dpi_ensemble(self, \n                                  model_predictions: Dict[str, ModelPrediction],\n                                  ensemble_prediction: Dict[str, Any]) -> Dict[str, Any]:\n        \"\"\"Analyze Gary's DPI factors across the ensemble.\"\"\"\n        dpi_factors = {\n            'lstm_dpi': 0.0,\n            'cnn_dpi': 0.0,\n            'rl_dpi': 0.0,\n            'ensemble_momentum': 0.0,\n            'volume_consensus': 0.0,\n            'pattern_confirmation': 0.0\n        }\n        \n        # Extract DPI information from individual models\n        if 'lstm' in model_predictions:\n            lstm_pred = model_predictions['lstm'].prediction\n            dpi_factors['lstm_dpi'] = float(lstm_pred.get('dpi_score', 0))\n            \n        if 'cnn' in model_predictions:\n            cnn_pred = model_predictions['cnn'].prediction\n            dpi_analysis = cnn_pred.get('dpi_analysis', {})\n            dpi_factors['cnn_dpi'] = float(dpi_analysis.get('dpi_composite_score', 0))\n            dpi_factors['pattern_confirmation'] = float(dpi_analysis.get('momentum_alignment', 0))\n            \n        if 'rl' in model_predictions:\n            rl_pred = model_predictions['rl'].prediction\n            rl_dpi = rl_pred.get('gary_dpi_analysis', {})\n            dpi_factors['rl_dpi'] = float(rl_dpi.get('dpi_composite_score', 0))\n            \n        # Calculate ensemble DPI score\n        ensemble_dpi_score = np.mean([v for v in dpi_factors.values() if v != 0])\n        \n        # Gary's ensemble momentum\n        ensemble_signal = ensemble_prediction.get('signal', 0)\n        momentum_strength = abs(ensemble_signal) * ensemble_prediction.get('confidence', 0)\n        \n        return {\n            'individual_dpi_scores': dpi_factors,\n            'ensemble_dpi_score': float(ensemble_dpi_score),\n            'momentum_strength': float(momentum_strength),\n            'gary_dpi_confidence': float(min(1.0, ensemble_dpi_score + momentum_strength)),\n            'dpi_signal_alignment': ensemble_signal * ensemble_dpi_score > 0\n        }\n        \n    def _analyze_taleb_antifragile_ensemble(self,\n                                           model_predictions: Dict[str, ModelPrediction],\n                                           ensemble_prediction: Dict[str, Any]) -> Dict[str, Any]:\n        \"\"\"Analyze Taleb's antifragility across the ensemble.\"\"\"\n        antifragile_factors = {\n            'model_disagreement': 0.0,\n            'volatility_opportunity': 0.0,\n            'asymmetric_payoff_potential': 0.0,\n            'tail_risk_protection': 0.0\n        }\n        \n        # Calculate model disagreement (good for antifragility)\n        individual_signals = ensemble_prediction.get('individual_signals', {})\n        if len(individual_signals) > 1:\n            signal_std = np.std(list(individual_signals.values()))\n            antifragile_factors['model_disagreement'] = float(signal_std)\n            \n        # Extract antifragility information from models\n        if 'cnn' in model_predictions:\n            cnn_pred = model_predictions['cnn'].prediction\n            af_assessment = cnn_pred.get('antifragile_assessment', {})\n            antifragile_factors['volatility_opportunity'] = float(\n                af_assessment.get('antifragile_composite_score', 0)\n            )\n            \n        # Ensemble antifragility score\n        ensemble_confidence = ensemble_prediction.get('confidence', 0)\n        uncertainty_benefit = (1 - ensemble_confidence) * 0.5  # Benefit from uncertainty\n        \n        ensemble_antifragile_score = np.mean([\n            antifragile_factors['model_disagreement'],\n            antifragile_factors['volatility_opportunity'],\n            uncertainty_benefit\n        ])\n        \n        return {\n            'individual_antifragile_factors': antifragile_factors,\n            'ensemble_antifragile_score': float(ensemble_antifragile_score),\n            'uncertainty_benefit': float(uncertainty_benefit),\n            'model_consensus_strength': float(1 - antifragile_factors['model_disagreement']),\n            'antifragile_opportunity': ensemble_antifragile_score > 0.6\n        }\n        \n    def _generate_ensemble_trading_signal(self,\n                                        ensemble_prediction: Dict[str, Any],\n                                        gary_dpi_analysis: Dict[str, Any],\n                                        taleb_analysis: Dict[str, Any]) -> Dict[str, Any]:\n        \"\"\"Generate final trading signal with Gary×Taleb integration.\"\"\"\n        base_signal = ensemble_prediction.get('signal', 0.0)\n        base_confidence = ensemble_prediction.get('confidence', 0.0)\n        \n        # Gary's DPI enhancement\n        dpi_enhancement = gary_dpi_analysis.get('gary_dpi_confidence', 0.0) * self.config.gary_dpi_ensemble_weight\n        \n        # Taleb's antifragility adjustment\n        antifragile_adjustment = taleb_analysis.get('ensemble_antifragile_score', 0.0) * self.config.taleb_antifragile_ensemble_weight\n        \n        # Final signal calculation\n        enhanced_signal = base_signal * (1 + dpi_enhancement + antifragile_adjustment)\n        enhanced_confidence = min(1.0, base_confidence + dpi_enhancement * 0.5)\n        \n        # Signal classification\n        if enhanced_signal > 0.3:\n            signal_class = 'STRONG_BUY'\n            direction = 1.0\n        elif enhanced_signal > 0.1:\n            signal_class = 'BUY'\n            direction = 0.5\n        elif enhanced_signal < -0.3:\n            signal_class = 'STRONG_SELL'\n            direction = -1.0\n        elif enhanced_signal < -0.1:\n            signal_class = 'SELL'\n            direction = -0.5\n        else:\n            signal_class = 'HOLD'\n            direction = 0.0\n            \n        return {\n            'signal': float(enhanced_signal),\n            'direction': float(direction),\n            'confidence': float(enhanced_confidence),\n            'signal_class': signal_class,\n            'base_signal': float(base_signal),\n            'gary_dpi_enhancement': float(dpi_enhancement),\n            'taleb_antifragile_adjustment': float(antifragile_adjustment),\n            'ensemble_ready': enhanced_confidence > self.config.confidence_threshold,\n            'gary_dpi_aligned': gary_dpi_analysis.get('dpi_signal_alignment', False),\n            'antifragile_opportunity': taleb_analysis.get('antifragile_opportunity', False)\n        }\n        \n    def _update_model_performance(self, model_predictions: Dict[str, ModelPrediction]):\n        \"\"\"Update model performance tracking for adaptive weighting.\"\"\"\n        for model_name, pred in model_predictions.items():\n            # Simple performance score based on confidence and inference time\n            performance_score = pred.confidence - (pred.inference_time_ms / 1000)  # Penalize slow inference\n            \n            if model_name in self.model_performance_scores:\n                self.model_performance_scores[model_name].append(performance_score)\n                \n    def _update_adaptive_weights(self):\n        \"\"\"Update adaptive weights based on recent performance.\"\"\"\n        for model_name in self.adaptive_weights:\n            if (model_name in self.model_performance_scores and \n                len(self.model_performance_scores[model_name]) > 10):\n                \n                recent_performance = np.mean(list(self.model_performance_scores[model_name])[-20:])\n                current_weight = self.adaptive_weights[model_name]\n                \n                # Adjust weight based on performance\n                if recent_performance > 0.5:  # Good performance\n                    new_weight = current_weight * (1 + self.config.weight_adaptation_rate)\n                elif recent_performance < 0.2:  # Poor performance\n                    new_weight = current_weight * (1 - self.config.weight_adaptation_rate)\n                else:\n                    new_weight = current_weight\n                    \n                self.adaptive_weights[model_name] = max(0.05, min(0.6, new_weight))  # Bound weights\n                \n        # Normalize weights\n        total_weight = sum(self.adaptive_weights.values())\n        if total_weight > 0:\n            for model_name in self.adaptive_weights:\n                self.adaptive_weights[model_name] /= total_weight\n                \n    def _calculate_ensemble_confidence(self, model_predictions: Dict[str, ModelPrediction]) -> float:\n        \"\"\"Calculate overall ensemble confidence.\"\"\"\n        if not model_predictions:\n            return 0.0\n            \n        confidences = [pred.confidence for pred in model_predictions.values()]\n        weights = [self.adaptive_weights.get(name, 0.0) for name in model_predictions.keys()]\n        \n        if sum(weights) > 0:\n            weighted_confidence = sum(c * w for c, w in zip(confidences, weights)) / sum(weights)\n        else:\n            weighted_confidence = np.mean(confidences)\n            \n        return float(weighted_confidence)\n        \n    def _calculate_consensus_strength(self, model_predictions: Dict[str, ModelPrediction]) -> float:\n        \"\"\"Calculate strength of consensus among models.\"\"\"\n        if len(model_predictions) < 2:\n            return 1.0\n            \n        # Extract signals for consensus calculation\n        signals = []\n        for model_name, pred in model_predictions.items():\n            if model_name == 'lstm':\n                price_pred = pred.prediction.get('price_prediction', [0])\n                signal = np.mean(price_pred) if len(price_pred) > 0 else 0\n            elif model_name == 'transformer':\n                signal = pred.prediction.get('sentiment', 0.0)\n            elif model_name == 'rl':\n                signal = pred.prediction.get('position_change', 0.0)\n            else:\n                signal = 0.0\n                \n            signals.append(signal)\n            \n        # Calculate consensus as inverse of standard deviation\n        if len(signals) > 1:\n            signal_std = np.std(signals)\n            consensus_strength = 1.0 / (1.0 + signal_std)  # Higher consensus = lower std\n        else:\n            consensus_strength = 1.0\n            \n        return float(consensus_strength)\n        \n    def _generate_cache_key(self,\n                          ohlcv_data: np.ndarray,\n                          text_data: Optional[List[str]],\n                          market_context: Optional[Dict[str, Any]]) -> str:\n        \"\"\"Generate cache key for prediction caching.\"\"\"\n        import hashlib\n        \n        # Create hash from inputs\n        data_hash = hashlib.md5(ohlcv_data.tobytes()).hexdigest()[:8]\n        text_hash = hashlib.md5(str(text_data).encode()).hexdigest()[:8] if text_data else \"none\"\n        context_hash = hashlib.md5(str(market_context).encode()).hexdigest()[:8] if market_context else \"none\"\n        \n        return f\"{data_hash}_{text_hash}_{context_hash}\"\n        \n    def _rebalance_weights(self, active_models: List[str]):\n        \"\"\"Rebalance weights when models are unavailable.\"\"\"\n        if not active_models:\n            return\n            \n        # Reset all weights to zero\n        for model_name in self.adaptive_weights:\n            self.adaptive_weights[model_name] = 0.0\n            \n        # Redistribute weights among active models\n        weight_per_model = 1.0 / len(active_models)\n        for model_name in active_models:\n            self.adaptive_weights[model_name] = weight_per_model\n            \n    def get_performance_metrics(self) -> Dict[str, Any]:\n        \"\"\"Get comprehensive ensemble performance metrics.\"\"\"\n        if not self.ensemble_inference_times:\n            return {'status': 'No inference data available'}\n            \n        recent_times = list(self.ensemble_inference_times)[-100:]\n        \n        # Individual model metrics\n        model_metrics = {}\n        for model_name, model in self.models.items():\n            if hasattr(model, 'get_performance_metrics'):\n                model_metrics[model_name] = model.get_performance_metrics()\n            else:\n                model_metrics[model_name] = {'status': 'Metrics not available'}\n                \n        return {\n            'ensemble_avg_inference_time_ms': np.mean(recent_times),\n            'ensemble_max_inference_time_ms': np.max(recent_times),\n            'ensemble_min_inference_time_ms': np.min(recent_times),\n            'ensemble_target_met': np.mean(recent_times) < self.config.target_ensemble_inference_ms,\n            'active_models': list(self.models.keys()),\n            'current_weights': self.adaptive_weights.copy(),\n            'individual_model_metrics': model_metrics,\n            'ensemble_strategy': self.config.strategy,\n            'gary_dpi_ensemble_weight': self.config.gary_dpi_ensemble_weight,\n            'taleb_antifragile_ensemble_weight': self.config.taleb_antifragile_ensemble_weight,\n            'adaptive_weighting_enabled': self.config.adaptive_weights,\n            'parallel_inference_enabled': self.config.parallel_inference,\n            'cache_size': len(self.prediction_cache) if self.prediction_cache else 0,\n            'total_predictions': len(self.ensemble_inference_times)\n        }\n        \n    def save_ensemble(self, path: str):\n        \"\"\"Save ensemble state and all models.\"\"\"\n        import pickle\n        from pathlib import Path\n        \n        ensemble_dir = Path(path)\n        ensemble_dir.mkdir(exist_ok=True)\n        \n        # Save individual models\n        for model_name, model in self.models.items():\n            model_path = ensemble_dir / f\"{model_name}_model.pt\"\n            if hasattr(model, 'save_model'):\n                model.save_model(str(model_path))\n            elif hasattr(model, 'export_model'):\n                model.export_model(str(model_path))\n                \n        # Save ensemble state\n        ensemble_state = {\n            'config': self.config,\n            'adaptive_weights': self.adaptive_weights,\n            'model_performance_scores': dict(self.model_performance_scores),\n            'gary_dpi_ensemble_factors': self.gary_dpi_ensemble_factors,\n            'taleb_antifragile_ensemble_factors': self.taleb_antifragile_ensemble_factors\n        }\n        \n        with open(ensemble_dir / 'ensemble_state.pkl', 'wb') as f:\n            pickle.dump(ensemble_state, f)\n            \n        print(f\"Ensemble saved to {path}\")\n        \n    def __del__(self):\n        \"\"\"Cleanup thread pool executor.\"\"\"\n        if self.executor:\n            self.executor.shutdown(wait=True)\n\n\n# Factory function for easy creation\ndef create_neural_ensemble(\n    market_data: pd.DataFrame,\n    strategy: str = 'weighted_voting',\n    enable_gary_dpi: bool = True,\n    enable_taleb_antifragile: bool = True,\n    fast_inference: bool = True,\n    model_configs: Optional[Dict[str, Any]] = None\n) -> NeuralEnsemble:\n    \"\"\"Create neural ensemble with Gary×Taleb integration.\n    \n    Args:\n        market_data: Market data for model initialization\n        strategy: Ensemble strategy ('weighted_voting', 'voting', 'blending', 'stacking')\n        enable_gary_dpi: Enable Gary's DPI integration\n        enable_taleb_antifragile: Enable Taleb's antifragility\n        fast_inference: Optimize for fast inference\n        model_configs: Custom configurations for individual models\n        \n    Returns:\n        Configured neural ensemble\n    \"\"\"\n    config = EnsembleConfig(\n        strategy=strategy,\n        gary_dpi_ensemble_weight=0.35 if enable_gary_dpi else 0.0,\n        taleb_antifragile_ensemble_weight=0.25 if enable_taleb_antifragile else 0.0,\n        parallel_inference=fast_inference,\n        target_ensemble_inference_ms=90.0 if fast_inference else 150.0,\n        adaptive_weights=True\n    )\n    \n    ensemble = NeuralEnsemble(config)\n    \n    # Initialize models\n    init_results = ensemble.initialize_models(market_data, model_configs)\n    active_models = [k for k, v in init_results.items() if v]\n    \n    print(f\"Neural Ensemble created with {len(active_models)} models: {active_models}\")\n    print(f\"Ensemble strategy: {strategy}\")\n    print(f\"Gary×Taleb integration: DPI={enable_gary_dpi}, Antifragile={enable_taleb_antifragile}\")\n    print(f\"Target ensemble inference time: {config.target_ensemble_inference_ms}ms\")\n    \n    return ensemble"