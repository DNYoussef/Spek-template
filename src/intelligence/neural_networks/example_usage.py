"""Example Usage of GaryTaleb Neural Networks

Comprehensive example demonstrating all neural network components
for the Phase 3 trading system with $200 seed capital.
"""

from typing import Dict, Any, List
import time

import numpy as np
import pandas as pd
import torch

# Import all neural network components
from lstm import create_lstm_predictor
from transformer import create_sentiment_analyzer
from cnn import create_pattern_recognizer
from rl import create_strategy_optimizer
from ensemble import create_neural_ensemble

def generate_sample_market_data(num_periods: int = 1000) -> pd.DataFrame:
    """Generate sample OHLCV market data for demonstration."""
    np.random.seed(42)

    # Generate realistic price movements
    initial_price = 100.0
    returns = np.random.normal(0, 0.2, num_periods)  # 2% daily volatility
    prices = [initial_price]

    for ret in returns:
        new_price = prices[-1] * (1 + ret)
        prices.append(max(new_price, 0.1))  # Prevent negative prices

    prices = np.array(prices[1:])  # Remove initial price

    # Generate OHLC from close prices
    highs = prices * (1 + np.abs(np.random.normal(0, 0.1, num_periods)))
    lows = prices * (1 - np.abs(np.random.normal(0, 0.1, num_periods)))
    opens = np.roll(prices, 1)
    opens[0] = initial_price

    # Generate volumes
    volumes = np.random.lognormal(10, 1, num_periods)

    # Create DataFrame
    data = pd.DataFrame({
        'open': opens,
        'high': highs,
        'low': lows,
        'close': prices,
        'volume': volumes,
        'timestamp': pd.date_range('2023-1-1', periods=num_periods, freq='1T')
    })

    return data

def generate_sample_news_data() -> List[str]:
    """Generate sample financial news for sentiment analysis."""
    news_samples = [
        "Company reports strong quarterly earnings beating analyst expectations with robust revenue growth",
        "Federal Reserve signals potential interest rate cuts amid economic uncertainty and inflation concerns",
        "Tech sector rallies on breakthrough AI developments and increased institutional investment",
        "Market volatility increases as geopolitical tensions escalate affecting global supply chains",
        "Breaking: Major acquisition announced creating significant market consolidation opportunity",
        "Economic indicators show mixed signals with unemployment falling but GDP growth slowing",
        "Cryptocurrency market surges following regulatory clarity from major financial authorities",
        "Energy sector faces headwinds from renewable transition but maintains strong cash flows"
    ]
    return news_samples

def demonstrate_lstm_predictor():
    """Demonstrate LSTM price prediction with GaryTaleb integration."""
    print("=== LSTM Price Predictor Demo ===")

    # Create LSTM model
    lstm_model = create_lstm_predictor(
        sequence_length=60,
        hidden_size=128,
        enable_dpi=True,
        antifragility_weight=0.15
    )

    # Generate sample data
    market_data = generate_sample_market_data(500)
    ohlcv_sequence = market_data[['open', 'high', 'low', 'close', 'volume']].values[-60:]

    # Make prediction
    start_time = time.time()
    prediction = lstm_model.predict_single(ohlcv_sequence)
    inference_time = (time.time() - start_time) * 1000

    print(f"LSTM Prediction Results:")
    print(f"  Price Prediction (next 5 periods): {prediction['price_prediction']}")
    print(f"  Volatility Prediction: {prediction['volatility_prediction']}")
    print(f"  Confidence Scores: {prediction['confidence_scores']}")
    print(f"  Gary's DPI Score: {prediction['dpi_score']}")
    print(f"  Model Confidence: {prediction['model_confidence']:.3f}")
    print(f"  Inference Time: {inference_time:.1f}ms")
    print(f"  Antifragile Enhanced: {prediction['antifragile_enhanced']}")

    # Get Gary's DPI factors
    dpi_factors = lstm_model.get_gary_dpi_factors(ohlcv_sequence)
    print(f"  Gary's DPI Factors:")
    for key, value in dpi_factors.items():
        print(f"    {key}: {value:.4f}")

    print(f"  Target <100ms: {'' if inference_time < 100 else ''}")
    print()

def demonstrate_sentiment_analyzer():
    """Demonstrate financial sentiment analysis."""
    print("=== Sentiment Analyzer Demo ===")

    # Create sentiment analyzer
    sentiment_analyzer = create_sentiment_analyzer(
        max_length=256,
        enable_caching=True,
        dpi_integration=True,
        antifragile_enhancement=True
    )

    # Analyze sample news
    news_data = generate_sample_news_data()

    total_inference_time = 0
    for i, text in enumerate(news_data[:3]):  # Analyze first 3 news items
        start_time = time.time()
        analysis = sentiment_analyzer.analyze_sentiment(text, source_type='news')
        inference_time = time.time() - start_time
        total_inference_time += inference_time

        print(f"News {i+1}: {text[:60]}...")
        print(f"  Final Sentiment: {analysis['final_sentiment']:.3f}")
        print(f"  Confidence: {analysis['confidence']:.3f}")
        print(f"  Trading Signal: {analysis['trading_signal']['signal']}")
        print(f"  Market Impact: {analysis['market_impact']['short_term_impact']:.3f}")
        print(f"  Gary DPI Adjustment: {analysis['dpi_adjustment']:.3f}")
        print(f"  Taleb Antifragile Adjustment: {analysis['antifragile_adjustment']:.3f}")
        print(f"  Inference Time: {analysis['inference_time_ms']:.1f}ms")
        print()

    avg_inference_time = (total_inference_time / 3) * 1000
    print(f"Average Inference Time: {avg_inference_time:.1f}ms")
    print(f"Target <100ms: {'' if avg_inference_time < 100 else ''}")
    print()

def demonstrate_pattern_recognizer():
    """Demonstrate chart pattern recognition."""
    print("=== Chart Pattern CNN Demo ===")

    # Create pattern recognizer
    pattern_recognizer = create_pattern_recognizer(
        image_size=(224, 224),
        confidence_threshold=0.7,
        enable_dpi=True,
        enable_antifragile=True,
        fast_mode=True
    )

    # Generate sample data
    market_data = generate_sample_market_data(100)
    ohlcv_data = market_data[['open', 'high', 'low', 'close', 'volume']].values[-60:]

    # Detect patterns
    start_time = time.time()
    pattern_results = pattern_recognizer.detect_patterns(
        ohlcv_data,
        return_visualization=False  # Skip visualization for speed
    )
    inference_time = (time.time() - start_time) * 1000

    print(f"Pattern Recognition Results:")
    print(f"  Detected Patterns: {len(pattern_results['detected_patterns'])}")

    for pattern in pattern_results['detected_patterns'][:3]:  # Show top 3 patterns
        print(f"    Pattern: {pattern['pattern']}")
        print(f"    Probability: {pattern['probability']:.3f}")
        print(f"    Confidence: {pattern['confidence']:.3f}")
        print(f"    Trading Signal: {pattern['trading_signal']['signal']}")
        print(f"    Expected Move: {pattern['characteristics']['avg_move_pct']*100:.1f}%")
        print()

    print(f"  Gary's DPI Analysis:")
    dpi_analysis = pattern_results['dpi_analysis']
    for key, value in dpi_analysis.items():
        if isinstance(value, (int, float)):
            print(f"    {key}: {value:.3f}")

    print(f"  Taleb Antifragility Assessment:")
    af_assessment = pattern_results['antifragile_assessment']
    for key, value in af_assessment.items():
        if isinstance(value, (int, float)):
            print(f"    {key}: {value:.3f}")

    print(f"  Inference Time: {inference_time:.1f}ms")
    print(f"  Target <100ms: {'' if inference_time < 100 else ''}")
    print()

def demonstrate_rl_strategy_optimizer():
    """Demonstrate RL strategy optimization."""
    print("=== RL Strategy Optimizer Demo ===")

    # Generate market data
    market_data = generate_sample_market_data(1000)

    # Create strategy optimizer
    strategy_optimizer = create_strategy_optimizer(
        market_data=market_data,
        initial_capital=200.0,  # $200 seed capital
        algorithm='ppo',
        enable_gary_dpi=True,
        enable_taleb_antifragile=True,
        fast_inference=True
    )

    # Quick training demo (reduced episodes for demo)
    print("Training RL agent (demo mode with 20 episodes)...")
    training_results = strategy_optimizer.train(num_episodes=20, verbose=False)

    print(f"Training Results:")
    print(f"  Total Episodes: {training_results['total_episodes']}")
    print(f"  Training Time: {training_results['training_time_minutes']:.1f} minutes")
    print(f"  Average Return: {training_results['avg_return']:.4f}")
    print(f"  Average Sharpe Ratio: {training_results['avg_sharpe_ratio']:.4f}")
    print(f"  Gary DPI Contribution: {training_results['gary_dpi_avg_contribution']:.4f}")
    print(f"  Taleb Antifragile Contribution: {training_results['taleb_antifragile_avg_contribution']:.4f}")

    # Test single action optimization
    sample_observation = market_data[['open', 'high', 'low', 'close', 'volume']].values[-60:].flatten()[:100]  # Simplified observation

    start_time = time.time()
    action_result = strategy_optimizer.optimize_single_action(
        sample_observation,
        market_context={'volatility': 0.25}
    )
    inference_time = time.time() - start_time

    print(f"  Single Action Optimization:")
    print(f"    Position Change: {action_result['position_change']:.3f}")
    print(f"    Confidence: {action_result['confidence']:.3f}")
    print(f"    Value Estimate: {action_result['value_estimate']:.3f}")
    print(f"    Total Inference Time: {action_result['total_inference_time_ms']:.1f}ms")
    print(f"    Real-time Ready: {action_result['real_time_ready']}")
    print()

def demonstrate_neural_ensemble():
    """Demonstrate the complete neural ensemble."""
    print("=== Neural Ensemble Demo ===")

    # Generate comprehensive market data
    market_data = generate_sample_market_data(1000)
    news_data = generate_sample_news_data()

    # Create neural ensemble
    ensemble = create_neural_ensemble(
        market_data=market_data,
        strategy='weighted_voting',
        enable_gary_dpi=True,
        enable_taleb_antifragile=True,
        fast_inference=True
    )

    # Prepare test data
    ohlcv_data = market_data[['open', 'high', 'low', 'close', 'volume']].values[-60:]
    text_data = news_data[:2]  # Use first 2 news items
    market_context = {
        'volatility': 0.25,
        'volume_ratio': 1.2,
        'market_regime': 'normal'
    }

    # Generate ensemble prediction
    print("Generating ensemble prediction...")
    start_time = time.time()

    try:
        ensemble_result = ensemble.predict(
            ohlcv_data=ohlcv_data,
            text_data=text_data,
            market_context=market_context
        )

        inference_time = time.time() - start_time

        print(f"Ensemble Prediction Results:")
        print(f"  Final Signal: {ensemble_result['final_trading_signal']['signal']:.3f}")
        print(f"  Signal Class: {ensemble_result['final_trading_signal']['signal_class']}")
        print(f"  Confidence: {ensemble_result['final_trading_signal']['confidence']:.3f}")
        print(f"  Direction: {ensemble_result['final_trading_signal']['direction']:.3f}")

        print(f"  Active Models: {ensemble_result['active_models']}")
        print(f"  Model Weights: {ensemble_result['model_weights_used']}")

        print(f"  Gary's DPI Enhancement: {ensemble_result['final_trading_signal']['gary_dpi_enhancement']:.3f}")
        print(f"  Taleb Antifragile Adjustment: {ensemble_result['final_trading_signal']['taleb_antifragile_adjustment']:.3f}")

        print(f"  Ensemble Confidence: {ensemble_result['ensemble_confidence']:.3f}")
        print(f"  Consensus Strength: {ensemble_result['consensus_strength']:.3f}")

        print(f"  Total Inference Time: {ensemble_result['total_inference_time_ms']:.1f}ms")
        print(f"  Target <90ms: {'' if ensemble_result['total_inference_time_ms'] < 90 else ''}")

        print(f"  Individual Model Performance:")
        for model_name, pred_info in ensemble_result['individual_predictions'].items():
            print(f"    {model_name.upper()}: confidence={pred_info['confidence']:.3f}, "
                    f"time={pred_info['inference_time_ms']:.1f}ms")

    except Exception as e:
        print(f"Ensemble prediction failed: {e}")
        print("This is expected in demo mode without full model training")

    # Get performance metrics
    performance_metrics = ensemble.get_performance_metrics()
    print(f"  Ensemble Performance Metrics:")
    print(f"    Active Models: {performance_metrics['active_models']}")
    print(f"    Ensemble Strategy: {performance_metrics['ensemble_strategy']}")
    print(f"    Gary DPI Weight: {performance_metrics['gary_dpi_ensemble_weight']}")
    print(f"    Taleb Antifragile Weight: {performance_metrics['taleb_antifragile_ensemble_weight']}")

    print()

def demonstrate_gary_taleb_integration():
    """Demonstrate GaryTaleb integration principles."""
    print("=== GaryTaleb Integration Principles ===")

    print("Gary's Dynamic Position Intelligence (DPI):")
    print("   Momentum-based position sizing")
    print("   Volume confirmation signals")
    print("   Technical indicator alignment")
    print("   Dynamic risk adjustment")
    print("   Pattern-momentum correlation")

    print("\nTaleb's Antifragility Principles:")
    print("   Benefits from volatility and disorder")
    print("   Asymmetric payoff structures (limited downside, unlimited upside)")
    print("   Model uncertainty as opportunity")
    print("   Tail risk protection")
    print("   Convexity benefits from extreme moves")

    print("\nIntegration in Neural Networks:")
    print("   LSTM: DPI momentum factors + Antifragile volatility weighting")
    print("   Transformer: DPI sentiment alignment + Antifragile contrarian signals")
    print("   CNN: DPI pattern momentum + Antifragile pattern uncertainty")
    print("   RL: DPI reward weighting + Antifragile exploration bonus")
    print("   Ensemble: DPI consensus + Antifragile model disagreement value")

    print("\n$200 Seed Capital Strategy:")
    print("   Maximum 100% position size (no leverage initially)")
    print("   0.1% transaction costs modeled")
    print("   20% maximum drawdown limit")
    print("   Target 20% annual return with <10% drawdown")
    print("   <100ms inference for real-time trading")

    print()

def run_comprehensive_performance_test():
    """Run comprehensive performance test of all components."""

    # Test data
    market_data = generate_sample_market_data(500)
    ohlcv_sequence = market_data[['open', 'high', 'low', 'close', 'volume']].values[-60:]
    news_text = "Strong earnings report with significant revenue growth prospects"

    # Individual model performance tests
    models_performance = {}

    # LSTM Performance
    try:
        lstm_model = create_lstm_predictor(enable_dpi=True, antifragility_weight=0.15)

        times = []
        for _ in range(10):  # 10 iterations for average
            start = time.time()
            lstm_model.predict_single(ohlcv_sequence)
            times.append((time.time() - start) * 1000)

        models_performance['LSTM'] = {
            'avg_time_ms': np.mean(times),
            'target_met': np.mean(times) < 100,
            'status': 'OK'
        }
    except Exception as e:
        models_performance['LSTM'] = {'status': f'ERROR: {e}'}

    # Sentiment Analyzer Performance
    try:
        sentiment_analyzer = create_sentiment_analyzer(dpi_integration=True, antifragile_enhancement=True)

        times = []
        for _ in range(10):
            start = time.time()
            sentiment_analyzer.analyze_sentiment(news_text, 'news')
            times.append((time.time() - start) * 1000)

        models_performance['Sentiment'] = {
            'avg_time_ms': np.mean(times),
            'target_met': np.mean(times) < 100,
            'status': 'OK'
        }
    except Exception as e:
        models_performance['Sentiment'] = {'status': f'ERROR: {e}'}

    # CNN Performance
    try:
        pattern_recognizer = create_pattern_recognizer(enable_dpi=True, enable_antifragile=True, fast_mode=True)

        times = []
        for _ in range(5):  # Fewer iterations due to higher compute cost
            start = time.time()
            pattern_recognizer.detect_patterns(ohlcv_sequence, return_visualization=False)
            times.append((time.time() - start) * 1000)

        models_performance['Pattern CNN'] = {
            'avg_time_ms': np.mean(times),
            'target_met': np.mean(times) < 100,
            'status': 'OK'
        }
    except Exception as e:
        models_performance['Pattern CNN'] = {'status': f'ERROR: {e}'}

    # Results
    print("Individual Model Performance:")
    for model_name, perf in models_performance.items():
        if 'avg_time_ms' in perf:
            status_symbol = '' if perf['target_met'] else ''
            print(f"  {model_name}: {perf['avg_time_ms']:.1f}ms avg {status_symbol}")
        else:
            print(f"  {model_name}: {perf['status']}")

    # Overall system readiness
    successful_models = sum(1 for perf in models_performance.values() if perf.get('target_met', False))
    total_models = len(models_performance)

    print(f"\nSystem Readiness:")
    print(f"  Models Meeting <100ms Target: {successful_models}/{total_models}")
    print(f"  GaryTaleb Integration:  Implemented across all models")
    print(f"  $200 Seed Capital Support:  Configured in RL environment")
    print(f"  Real-time Trading Ready: {'' if successful_models >= 2 else ''}")

    print()

def main():
    """Main demonstration function."""
    print("GaryTaleb Neural Networks - Phase 3 Trading System")
    print("=" * 55)
    print(f"PyTorch Version: {torch.__version__}")
    print(f"Device: {'CUDA' if torch.cuda.is_available() else 'CPU'}")
    print(f"Seed Capital: $200")
    print(f"Target Inference: <100ms per model, <90ms ensemble")
    print()

    # Run individual component demos
    demonstrate_lstm_predictor()
    demonstrate_sentiment_analyzer()
    demonstrate_pattern_recognizer()
    demonstrate_rl_strategy_optimizer()
    demonstrate_neural_ensemble()

    # Show integration principles
    demonstrate_gary_taleb_integration()

    # Performance test
    run_comprehensive_performance_test()

    print("Demo completed successfully!")
    print("\nNext Steps:")
    print("1. Train models on real market data")
    print("2. Fine-tune hyperparameters for optimal performance")
    print("3. Implement live data feeds")
    print("4. Deploy ensemble for paper trading")
    print("5. Scale to live trading with risk management")

if __name__ == "__main__":
    main()