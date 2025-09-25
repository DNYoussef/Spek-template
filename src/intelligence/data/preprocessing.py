from src.constants.base import API_TIMEOUT_SECONDS, MAXIMUM_FUNCTION_PARAMETERS

import numpy as np
import pandas as pd
import polars as pl
from typing import Dict, List, Optional, Tuple, Union
from dataclasses import dataclass
import talib
import pandas_ta as ta
from sklearn.preprocessing import RobustScaler, StandardScaler, MinMaxScaler
from sklearn.ensemble import IsolationForest
from lib.shared.utilities import get_logger
logger = get_logger(__name__)

@dataclass
class FeatureSet:
    """Container for processed features."""
    features: pd.DataFrame
    target: pd.Series
    feature_names: List[str]
    metadata: Dict

class FeatureTransformer(ABC):
    """Abstract base class for feature transformers."""
    
    @abstractmethod
    def transform(self, data: pd.DataFrame) -> pd.DataFrame:
        """Transform input data to features."""
    
    @property
    @abstractmethod
    def feature_names(self) -> List[str]:
        """Get feature names produced by this transformer."""

class TechnicalIndicatorTransformer(FeatureTransformer):
    """Technical indicator feature transformer."""
    
    def __init__(self, indicators: List[str] = None):
        self.indicators = indicators or config.data.technical_indicators
        self._feature_names = []
    
    def transform(self, data: pd.DataFrame) -> pd.DataFrame:
        """Generate technical indicators."""
        features = pd.DataFrame(index=data.index)
        
        # Price-based features
        if 'rsi' in self.indicators:
            features['rsi_14'] = talib.RSI(data['close'], timeperiod=14)
            features['rsi_21'] = talib.RSI(data['close'], timeperiod=21)
        
        if 'macd' in self.indicators:
            macd, macd_signal, macd_hist = talib.MACD(data['close'])
            features['macd'] = macd
            features['macd_signal'] = macd_signal
            features['macd_histogram'] = macd_hist
        
        if 'bollinger_bands' in self.indicators:
            bb_upper, bb_middle, bb_lower = talib.BBANDS(data['close'])
            features['bb_upper'] = bb_upper
            features['bb_middle'] = bb_middle
            features['bb_lower'] = bb_lower
            features['bb_width'] = (bb_upper - bb_lower) / bb_middle
            features['bb_position'] = (data['close'] - bb_lower) / (bb_upper - bb_lower)
        
        if 'stochastic' in self.indicators:
            stoch_k, stoch_d = talib.STOCH(data['high'], data['low'], data['close'])
            features['stoch_k'] = stoch_k
            features['stoch_d'] = stoch_d
        
        if 'williams_r' in self.indicators:
            features['williams_r'] = talib.WILLR(data['high'], data['low'], data['close'])
        
        if 'momentum' in self.indicators:
            features['momentum_10'] = talib.MOM(data['close'], timeperiod=10)
            features['momentum_20'] = talib.MOM(data['close'], timeperiod=20)
        
        if 'rate_of_change' in self.indicators:
            features['roc_10'] = talib.ROC(data['close'], timeperiod=10)
            features['roc_20'] = talib.ROC(data['close'], timeperiod=20)
        
        if 'commodity_channel_index' in self.indicators:
            features['cci'] = talib.CCI(data['high'], data['low'], data['close'])
        
        # Volume-based indicators
        if 'volume' in data.columns:
            features['obv'] = talib.OBV(data['close'], data['volume'])
            features['ad_line'] = talib.AD(data['high'], data['low'], data['close'], data['volume'])
        
        # Store feature names
        self._feature_names = list(features.columns)
        
        return features
    
    @property
    def feature_names(self) -> List[str]:
        """Get technical indicator feature names."""
        return self._feature_names

class GaryDPITransformer(FeatureTransformer):
    """Gary's Dynamic Portfolio Intelligence feature transformer."""
    
    def __init__(self):
        self._feature_names = []
    
    def transform(self, data: pd.DataFrame) -> pd.DataFrame:
        """Generate DPI features."""
        features = pd.DataFrame(index=data.index)
        
        # Dynamic correlation features
        features['price_volume_corr'] = self._rolling_correlation(
            data['close'], data['volume'], window=20
        )
        
        # Regime detection using volatility clustering
        returns = data['close'].pct_change()
        features['volatility_regime'] = self._detect_volatility_regime(returns)
        
        # Momentum persistence
        features['momentum_persistence'] = self._momentum_persistence(returns)
        
        # Mean reversion strength
        features['mean_reversion_strength'] = self._mean_reversion_strength(data['close'])
        
        # Dynamic beta (market sensitivity)
        if len(data) > 60:  # Need enough data for beta calculation
            features['dynamic_beta'] = self._calculate_dynamic_beta(returns)
        
        # Regime-adjusted momentum
        features['regime_momentum'] = (
            features['momentum_persistence'] * features['volatility_regime']
        )
        
        # Adaptive volatility
        features['adaptive_volatility'] = self._adaptive_volatility(returns)
        
        # Dynamic correlation with market
        features['market_correlation'] = self._market_correlation(returns)
        
        self._feature_names = list(features.columns)
        return features
    
    def _rolling_correlation(self, x: pd.Series, y: pd.Series, window: int) -> pd.Series:
        """Calculate rolling correlation between two series."""
        return x.rolling(window).corr(y)
    
    def _detect_volatility_regime(self, returns: pd.Series, window: int = 20) -> pd.Series:
        """Detect volatility regime using GARCH-like approach."""
        vol = returns.rolling(window).std()
        vol_ma = vol.rolling(window).mean()
        return (vol / vol_ma).fillna(1.0)
    
    def _momentum_persistence(self, returns: pd.Series, window: int = 10) -> pd.Series:
        """Calculate momentum persistence."""
        momentum = returns.rolling(window).mean()
        persistence = momentum.rolling(window).apply(
            lambda x: (x > 0).sum() / len(x), raw=False
        )
        return persistence
    
    def _mean_reversion_strength(self, prices: pd.Series, window: int = 20) -> pd.Series:
        """Calculate mean reversion strength."""
        ma = prices.rolling(window).mean()
        deviation = (prices - ma) / ma
        reversion = -deviation.rolling(window).apply(
            lambda x: np.corrcoef(x, range(len(x)))[0, 1], raw=False
        )
        return reversion
    
    def _calculate_dynamic_beta(self, returns: pd.Series, window: int = 60) -> pd.Series:
        """Calculate rolling beta against market."""
        # For now, use SPY as market proxy (in real implementation, fetch market data)
        market_returns = returns.copy()  # Placeholder
        
        def rolling_beta(window_returns):
            if len(window_returns) < 2:
                return 1.0
            return np.cov(window_returns, market_returns[-len(window_returns):])[0, 1] / np.var(market_returns[-len(window_returns):])
        
        return returns.rolling(window).apply(rolling_beta, raw=False)
    
    def _adaptive_volatility(self, returns: pd.Series, alpha: float = 0.94) -> pd.Series:
        """Calculate adaptive volatility using EWMA."""
        var = returns.var()
        adaptive_var = returns.ewm(alpha=alpha).var()
        return np.sqrt(adaptive_var)
    
    def _market_correlation(self, returns: pd.Series, window: int = 30) -> pd.Series:
        """Calculate rolling correlation with market."""
        market_returns = returns.copy()  # Placeholder
        return returns.rolling(window).corr(market_returns)
    
    @property
    def feature_names(self) -> List[str]:
        """Get DPI feature names."""
        return self._feature_names

class TalebAntifragileTransformer(FeatureTransformer):
    """Taleb's antifragility feature transformer."""
    
    def __init__(self):
        self._feature_names = []
    
    def transform(self, data: pd.DataFrame) -> pd.DataFrame:
        """Generate antifragility features."""
        features = pd.DataFrame(index=data.index)
        returns = data['close'].pct_change().dropna()
        
        # Tail risk premium
        features['tail_risk_premium'] = self._tail_risk_premium(returns)
        
        # Volatility smile approximation
        features['volatility_smile'] = self._volatility_smile(returns)
        
        # Skewness premium (preference for positive skew)
        features['skewness_premium'] = self._skewness_premium(returns)
        
        # Kurtosis tracking (extreme event detection)
        features['kurtosis_tracking'] = self._kurtosis_tracking(returns)
        
        # Extreme event indicators
        features['extreme_event_indicator'] = self._extreme_event_indicator(returns)
        
        # Antifragility score
        features['antifragility_score'] = self._antifragility_score(returns)
        
        # Barbell strategy indicator
        features['barbell_indicator'] = self._barbell_indicator(returns)
        
        # Black swan protection
        features['black_swan_protection'] = self._black_swan_protection(returns)
        
        self._feature_names = list(features.columns)
        return features
    
    def _tail_risk_premium(self, returns: pd.Series, window: int = 60) -> pd.Series:
        """Calculate tail risk premium."""
        def tail_premium(window_returns):
            if len(window_returns) < 10:
                return 0.0
            var_95 = np.percentile(window_returns, 5)  # 5% VaR
            expected_shortfall = window_returns[window_returns <= var_95].mean()
            return expected_shortfall - var_95
        
        return returns.rolling(window).apply(tail_premium, raw=False)
    
    def _volatility_smile(self, returns: pd.Series, window: int = 30) -> pd.Series:
        """Approximate volatility smile using skewness."""
        rolling_skew = returns.rolling(window).skew()
        rolling_vol = returns.rolling(window).std()
        return rolling_skew * rolling_vol
    
    def _skewness_premium(self, returns: pd.Series, window: int = 30) -> pd.Series:
        """Calculate skewness premium."""
        rolling_skew = returns.rolling(window).skew()
        # Prefer positive skewness (right tail)
        return np.maximum(rolling_skew, 0)
    
    def _kurtosis_tracking(self, returns: pd.Series, window: int = 60) -> pd.Series:
        """Track excess kurtosis for extreme event detection."""
        rolling_kurtosis = returns.rolling(window).kurt()
        # Excess kurtosis (subtract 3 for normal distribution)
        return rolling_kurtosis - 3
    
    def _extreme_event_indicator(self, returns: pd.Series, threshold: float = 2.5) -> pd.Series:
        """Detect extreme events using z-score."""
        rolling_mean = returns.rolling(API_TIMEOUT_SECONDS).mean()
        rolling_std = returns.rolling(API_TIMEOUT_SECONDS).std()
        z_scores = (returns - rolling_mean) / rolling_std
        return (np.abs(z_scores) > threshold).astype(int)
    
    def _antifragility_score(self, returns: pd.Series, window: int = 60) -> pd.Series:
        """Calculate composite antifragility score."""
        def antifragile_score(window_returns):
            if len(window_returns) < 10:
                return 0.0
            
            # Benefits from volatility
            vol_benefit = window_returns.std() * window_returns.mean()
            
            # Convex payoff detection
            sorted_returns = np.sort(window_returns)
            convexity = np.mean(sorted_returns[-5:]) - np.mean(sorted_returns[:5])
            
            # Combine metrics
            return vol_benefit + convexity
        
        return returns.rolling(window).apply(antifragile_score, raw=False)
    
    def _barbell_indicator(self, returns: pd.Series, window: int = 30) -> pd.Series:
        """Detect barbell-like return distribution."""
        def barbell_score(window_returns):
            if len(window_returns) < 10:
                return 0.0
            
            # Calculate percentiles
            p10 = np.percentile(window_returns, 10)
            p90 = np.percentile(window_returns, 90)
            median = np.percentile(window_returns, 50)
            
            # Barbell score: high probability of extreme outcomes
            tail_mass = np.sum((window_returns <= p10) | (window_returns >= p90)) / len(window_returns)
            center_distance = abs(median - np.mean(window_returns))
            
            return tail_mass + center_distance
        
        return returns.rolling(window).apply(barbell_score, raw=False)
    
    def _black_swan_protection(self, returns: pd.Series, window: int = 90) -> pd.Series:
        """Calculate black swan protection score."""
        def protection_score(window_returns):
            if len(window_returns) < 10:
                return 0.0
            
            # Probability of extreme gains during market stress
            stress_threshold = np.percentile(window_returns, MAXIMUM_FUNCTION_PARAMETERS)
            stress_periods = window_returns <= stress_threshold
            
            if stress_periods.sum() == 0:
                return 0.0
            
            protection = window_returns[stress_periods].mean()
            return max(protection, 0)  # Only positive protection matters
        
        return returns.rolling(window).apply(protection_score, raw=False)
    
    @property
    def feature_names(self) -> List[str]:
        """Get antifragility feature names."""
        return self._feature_names

class DataPreprocessor:
    """Main data preprocessing pipeline."""
    
    def __init__(self, transformers: List[FeatureTransformer] = None):
        self.transformers = transformers or [
            TechnicalIndicatorTransformer(),
            GaryDPITransformer(), 
            TalebAntifragileTransformer()
        ]
        self.scaler = None
        self.outlier_detector = None
        self._fitted = False
    
    def fit_transform(self, data: List[MarketData]) -> FeatureSet:
        """Fit and transform market data to features."""
        df = self._market_data_to_df(data)
        return self._process_dataframe(df, fit=True)
    
    def transform(self, data: List[MarketData]) -> FeatureSet:
        """Transform market data using fitted preprocessor."""
        if not self._fitted:
            raise ValueError("Preprocessor must be fitted before transform")
        
        df = self._market_data_to_df(data)
        return self._process_dataframe(df, fit=False)
    
    def _market_data_to_df(self, data: List[MarketData]) -> pd.DataFrame:
        """Convert market data to DataFrame."""
        return pd.DataFrame([
            {
                'timestamp': d.timestamp,
                'open': d.open,
                'high': d.high,
                'low': d.low,
                'close': d.close,
                'volume': d.volume
            } for d in data
        ]).set_index('timestamp').sort_index()
    
    def _process_dataframe(self, df: pd.DataFrame, fit: bool = False) -> FeatureSet:
        """Process DataFrame through the full pipeline."""
        
        # Apply feature transformers
        all_features = []
        feature_names = []
        
        for transformer in self.transformers:
            features = transformer.transform(df)
            all_features.append(features)
            feature_names.extend(transformer.feature_names)
        
        # Combine all features
        combined_features = pd.concat(all_features, axis=1)
        
        # Handle missing values
        combined_features = self._handle_missing_values(combined_features)
        
        # Detect and handle outliers
        if fit:
            self.outlier_detector = IsolationForest(contamination=0.1, random_state=42)
            outliers = self.outlier_detector.fit_predict(combined_features.fillna(0))
        else:
            outliers = self.outlier_detector.predict(combined_features.fillna(0))
        
        # Remove outliers
        clean_features = combined_features[outliers == 1].copy()
        
        # Scale features
        if fit:
            self.scaler = RobustScaler()
            scaled_features = pd.DataFrame(
                self.scaler.fit_transform(clean_features.fillna(0)),
                index=clean_features.index,
                columns=clean_features.columns
            )
        else:
            scaled_features = pd.DataFrame(
                self.scaler.transform(clean_features.fillna(0)),
                index=clean_features.index,
                columns=clean_features.columns
            )
        
        # Create target variable (next period return)
        target = df['close'].pct_change().shift(-config.data.prediction_horizon)
        
        # Align features and target
        common_index = scaled_features.index.intersection(target.index)
        final_features = scaled_features.loc[common_index]
        final_target = target.loc[common_index].dropna()
        
        # Final alignment
        common_index = final_features.index.intersection(final_target.index)
        final_features = final_features.loc[common_index]
        final_target = final_target.loc[common_index]
        
        self._fitted = True
        
        return FeatureSet(
            features=final_features,
            target=final_target,
            feature_names=feature_names,
            metadata={
                'n_samples': len(final_features),
                'n_features': len(feature_names),
                'outliers_removed': (outliers == -1).sum(),
                'target_name': 'future_return'
            }
        )
    
    def _handle_missing_values(self, df: pd.DataFrame) -> pd.DataFrame:
        """Handle missing values based on configuration."""
        method = config.data.handle_missing
        
        if method == 'interpolate':
            return df.interpolate(method='linear')
        elif method == 'forward_fill':
            return df.fillna(method='ffill')
        elif method == 'drop':
            return df.dropna()
        else:
            return df.fillna(0)

class FeatureEngineering:
    """High-level feature engineering interface."""
    
    def __init__(self):
        self.preprocessor = DataPreprocessor()
        self.feature_importance = {}
    
    def create_features(
        self,
        data: List[MarketData],
        validation_split: float = 0.2
    ) -> Tuple[FeatureSet, FeatureSet]:
        """Create training and validation feature sets."""
        
        # Split data
        split_idx = int(len(data) * (1 - validation_split))
        train_data = data[:split_idx]
        val_data = data[split_idx:]
        
        # Process training data
        train_features = self.preprocessor.fit_transform(train_data)
        
        # Process validation data
        val_features = self.preprocessor.transform(val_data)
        
        logger.info(f"Created features - Train: {train_features.metadata}, Val: {val_features.metadata}")
        
        return train_features, val_features
    
    def get_feature_importance(self) -> Dict[str, float]:
        """Get feature importance scores."""
        return self.feature_importance.copy()

# Example usage
async def test_feature_engineering():
    """Test feature engineering pipeline."""
    from .loaders import MarketDataLoader
    
    async with MarketDataLoader() as loader:
        # Fetch sample data
        data = await loader.fetch_data(
            symbol='BTC/USDT',
            source='binance', 
            timeframe='1h',
            limit=1000
        )
        
        if data:
            # Create feature engineering pipeline
            fe = FeatureEngineering()
            
            # Generate features
            train_features, val_features = fe.create_features(data)
            
            print(f"Training features shape: {train_features.features.shape}")
            print(f"Validation features shape: {val_features.features.shape}")
            print(f"Feature names: {train_features.feature_names[:10]}...")  # First 10 features
            
            # Display sample features
            print("\nSample features:")
            print(train_features.features.head())

if __name__ == "__main__":
    import asyncio
    asyncio.run(test_feature_engineering())