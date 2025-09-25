"""
Data validation and quality checking for market data.
Ensures data integrity and identifies potential issues before model training.
"""

from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Union

from dataclasses import dataclass
from lib.shared.utilities import get_logger
import numpy as np
import pandas as pd

class ValidationLevel(Enum):
    """Data validation severity levels."""
    INFO = "info"
    WARNING = "warning" 
    ERROR = "error"
    CRITICAL = "critical"

@dataclass
class ValidationResult:
    """Result of data validation check."""
    check_name: str
    level: ValidationLevel
    message: str
    details: Dict = None
    passed: bool = True

class DataValidator:
    """Comprehensive data validator for market data."""
    
    def __init__(self):
        self.validation_rules = self._init_validation_rules()
    
    def _init_validation_rules(self) -> Dict:
        """Initialize validation rules."""
        return {
            'completeness': {
                'missing_data_threshold': 0.5,  # Max 5% missing data
                'gap_threshold_minutes': 60,  # Max 60 min gap
            },
            'consistency': {
                'ohlc_relationship': True,  # O, H, L, C relationships
                'volume_positive': True,  # Volume must be >= 0
                'price_positive': True,  # Prices must be > 0
            },
            'anomalies': {
                'price_spike_threshold': 5.0,  # 5x standard deviation
                'volume_spike_threshold': 10.0,  # 10x standard deviation
                'zero_volume_threshold': 0.1,  # Max 10% zero volume
            },
            'temporal': {
                'chronological_order': True,  # Timestamps in order
                'future_dates': False,  # No future dates
                'reasonable_timeframe': True,  # Within reasonable bounds
            }
        }
    
    def validate_data(self, data: List[MarketData]) -> List[ValidationResult]:
        """Run comprehensive validation on market data."""
        if not data:
            return [ValidationResult(
                check_name="empty_data",
                level=ValidationLevel.CRITICAL,
                message="No data provided for validation",
                passed=False
            )]
        
        df = self._to_dataframe(data)
        results = []
        
        # Run all validation checks
        results.extend(self._check_completeness(df))
        results.extend(self._check_consistency(df))
        results.extend(self._check_anomalies(df))
        results.extend(self._check_temporal_properties(df))
        results.extend(self._check_statistical_properties(df))
        
        return results
    
    def _to_dataframe(self, data: List[MarketData]) -> pd.DataFrame:
        """Convert MarketData to DataFrame for analysis."""
        return pd.DataFrame([
            {
                'timestamp': d.timestamp,
                'open': d.open,
                'high': d.high,
                'low': d.low,
                'close': d.close,
                'volume': d.volume,
                'source': d.source,
                'symbol': d.symbol
            } for d in data
        ]).set_index('timestamp').sort_index()
    
    def _check_completeness(self, df: pd.DataFrame) -> List[ValidationResult]:
        """Check data completeness."""
        results = []
        
        # Missing data check
        missing_ratio = df.isnull().sum().sum() / (len(df) * len(df.columns))
        if missing_ratio > self.validation_rules['completeness']['missing_data_threshold']:
            results.append(ValidationResult(
                check_name="missing_data",
                level=ValidationLevel.WARNING,
                message=f"High missing data ratio: {missing_ratio:.3f}",
                details={'missing_ratio': missing_ratio},
                passed=False
            ))
        
        # Time gaps check
        if len(df) > 1:
            time_diffs = df.index.to_series().diff()[1:]
            max_gap = time_diffs.max().total_seconds() / 60  # Convert to minutes
            
            if max_gap > self.validation_rules['completeness']['gap_threshold_minutes']:
                results.append(ValidationResult(
                    check_name="time_gaps",
                    level=ValidationLevel.WARNING,
                    message=f"Large time gap detected: {max_gap:.1f} minutes",
                    details={'max_gap_minutes': max_gap},
                    passed=False
                ))
        
        # Required columns check
        required_cols = ['open', 'high', 'low', 'close', 'volume']
        missing_cols = [col for col in required_cols if col not in df.columns]
        if missing_cols:
            results.append(ValidationResult(
                check_name="missing_columns",
                level=ValidationLevel.CRITICAL,
                message=f"Missing required columns: {missing_cols}",
                details={'missing_columns': missing_cols},
                passed=False
            ))
        
        return results
    
    def _check_consistency(self, df: pd.DataFrame) -> List[ValidationResult]:
        """Check data consistency."""
        results = []
        
        # OHLC relationship check
        if all(col in df.columns for col in ['open', 'high', 'low', 'close']):
            # High should be >= Open, Low, Close
            high_violations = (
                (df['high'] < df['open']) |
                (df['high'] < df['low']) |
                (df['high'] < df['close'])
            ).sum()
            
            # Low should be <= Open, High, Close
            low_violations = (
                (df['low'] > df['open']) |
                (df['low'] > df['high']) |
                (df['low'] > df['close'])
            ).sum()
            
            total_violations = high_violations + low_violations
            if total_violations > 0:
                results.append(ValidationResult(
                    check_name="ohlc_consistency",
                    level=ValidationLevel.ERROR,
                    message=f"OHLC relationship violations: {total_violations}",
                    details={
                        'high_violations': int(high_violations),
                        'low_violations': int(low_violations)
                    },
                    passed=False
                ))
        
        # Positive price check
        price_cols = ['open', 'high', 'low', 'close']
        for col in price_cols:
            if col in df.columns:
                negative_prices = (df[col] <= 0).sum()
                if negative_prices > 0:
                    results.append(ValidationResult(
                        check_name=f"positive_prices_{col}",
                        level=ValidationLevel.ERROR,
                        message=f"Non-positive {col} prices: {negative_prices}",
                        details={'negative_count': int(negative_prices)},
                        passed=False
                    ))
        
        # Volume check
        if 'volume' in df.columns:
            negative_volume = (df['volume'] < 0).sum()
            if negative_volume > 0:
                results.append(ValidationResult(
                    check_name="positive_volume",
                    level=ValidationLevel.ERROR,
                    message=f"Negative volume entries: {negative_volume}",
                    details={'negative_volume_count': int(negative_volume)},
                    passed=False
                ))
        
        return results
    
    def _check_anomalies(self, df: pd.DataFrame) -> List[ValidationResult]:
        """Check for data anomalies."""
        results = []
        
        # Price spike detection
        if 'close' in df.columns and len(df) > 10:
            returns = df['close'].pct_change().dropna()
            return_std = returns.std()
            spike_threshold = self.validation_rules['anomalies']['price_spike_threshold']
            
            spikes = (np.abs(returns) > spike_threshold * return_std).sum()
            if spikes > 0:
                results.append(ValidationResult(
                    check_name="price_spikes",
                    level=ValidationLevel.WARNING,
                    message=f"Price spikes detected: {spikes}",
                    details={
                        'spike_count': int(spikes),
                        'threshold': spike_threshold * return_std
                    },
                    passed=spikes == 0
                ))
        
        # Volume spike detection
        if 'volume' in df.columns and len(df) > 10:
            volume_mean = df['volume'].mean()
            volume_std = df['volume'].std()
            spike_threshold = self.validation_rules['anomalies']['volume_spike_threshold']
            
            if volume_std > 0:
                volume_spikes = (
                    df['volume'] > volume_mean + spike_threshold * volume_std
                ).sum()
                
                if volume_spikes > 0:
                    results.append(ValidationResult(
                        check_name="volume_spikes",
                        level=ValidationLevel.INFO,
                        message=f"Volume spikes detected: {volume_spikes}",
                        details={
                            'spike_count': int(volume_spikes),
                            'threshold': volume_mean + spike_threshold * volume_std
                        },
                        passed=True  # Volume spikes are often normal
                    ))
        
        # Zero volume check
        if 'volume' in df.columns:
            zero_volume_ratio = (df['volume'] == 0).sum() / len(df)
            threshold = self.validation_rules['anomalies']['zero_volume_threshold']
            
            if zero_volume_ratio > threshold:
                results.append(ValidationResult(
                    check_name="zero_volume",
                    level=ValidationLevel.WARNING,
                    message=f"High zero volume ratio: {zero_volume_ratio:.3f}",
                    details={'zero_volume_ratio': zero_volume_ratio},
                    passed=False
                ))
        
        return results
    
    def _check_temporal_properties(self, df: pd.DataFrame) -> List[ValidationResult]:
        """Check temporal data properties."""
        results = []
        
        # Chronological order check
        if len(df) > 1:
            unsorted_count = (df.index[1:] <= df.index[:-1]).sum()
            if unsorted_count > 0:
                results.append(ValidationResult(
                    check_name="chronological_order",
                    level=ValidationLevel.ERROR,
                    message=f"Non-chronological timestamps: {unsorted_count}",
                    details={'unsorted_count': int(unsorted_count)},
                    passed=False
                ))
        
        # Future dates check
        future_dates = (df.index > datetime.now()).sum()
        if future_dates > 0:
            results.append(ValidationResult(
                check_name="future_dates",
                level=ValidationLevel.WARNING,
                message=f"Future timestamps detected: {future_dates}",
                details={'future_count': int(future_dates)},
                passed=False
            ))
        
        # Reasonable timeframe check
        if len(df) > 0:
            earliest = df.index.min()
            latest = df.index.max()
            span_days = (latest - earliest).days
            
            # Check if data spans reasonable time (not too old, not too short)
            if span_days > 3650:  # > 10 years
                results.append(ValidationResult(
                    check_name="timeframe_too_long",
                    level=ValidationLevel.INFO,
                    message=f"Data spans very long period: {span_days} days",
                    details={'span_days': span_days},
                    passed=True
                ))
            elif span_days < 1:  # < 1 day
                results.append(ValidationResult(
                    check_name="timeframe_too_short",
                    level=ValidationLevel.WARNING,
                    message=f"Data spans very short period: {span_days} days",
                    details={'span_days': span_days},
                    passed=False
                ))
        
        return results
    
    def _check_statistical_properties(self, df: pd.DataFrame) -> List[ValidationResult]:
        """Check statistical properties of the data."""
        results = []
        
        if 'close' in df.columns and len(df) > 30:
            returns = df['close'].pct_change().dropna()
            
            # Check for unrealistic volatility
            volatility = returns.std() * np.sqrt(252)  # Annualized volatility
            if volatility > 5.0:  # 500% annual volatility
                results.append(ValidationResult(
                    check_name="extreme_volatility",
                    level=ValidationLevel.WARNING,
                    message=f"Extremely high volatility: {volatility:.2f}",
                    details={'annual_volatility': volatility},
                    passed=False
                ))
            
            # Check for constant prices
            price_changes = (returns != 0).sum()
            change_ratio = price_changes / len(returns)
            if change_ratio < 0.1:  # Less than 10% of prices change
                results.append(ValidationResult(
                    check_name="constant_prices",
                    level=ValidationLevel.WARNING,
                    message=f"Low price variation: {change_ratio:.3f}",
                    details={'change_ratio': change_ratio},
                    passed=False
                ))
        
        return results

class QualityChecker:
    """Data quality assessment and scoring."""
    
    def __init__(self):
        self.validator = DataValidator()
    
    def assess_quality(self, data: List[MarketData]) -> Dict:
        """Assess overall data quality."""
        validation_results = self.validator.validate_data(data)
        
        # Count issues by severity
        issue_counts = {
            'critical': sum(1 for r in validation_results if r.level == ValidationLevel.CRITICAL and not r.passed),
            'error': sum(1 for r in validation_results if r.level == ValidationLevel.ERROR and not r.passed),
            'warning': sum(1 for r in validation_results if r.level == ValidationLevel.WARNING and not r.passed),
            'info': sum(1 for r in validation_results if r.level == ValidationLevel.INFO and not r.passed)
        }
        
        # Calculate quality score (0-100)
        total_issues = sum(issue_counts.values())
        total_checks = len(validation_results)
        
        if total_checks == 0:
            quality_score = 0
        else:
            # Weight different severity levels
            weighted_issues = (
                issue_counts['critical'] * 4 +
                issue_counts['error'] * 2 +
                issue_counts['warning'] * 1 +
                issue_counts['info'] * 0.5
            )
            quality_score = max(0, 100 - (weighted_issues / total_checks) * 25)
        
        # Determine quality grade
        if quality_score >= 90:
            grade = 'A'
        elif quality_score >= 80:
            grade = 'B'
        elif quality_score >= 70:
            grade = 'C'
        elif quality_score >= 60:
            grade = 'D'
        else:
            grade = 'F'
        
        return {
            'quality_score': quality_score,
            'quality_grade': grade,
            'issue_counts': issue_counts,
            'validation_results': validation_results,
            'data_summary': self._get_data_summary(data),
            'recommendations': self._get_recommendations(validation_results)
        }
    
    def _get_data_summary(self, data: List[MarketData]) -> Dict:
        """Get summary statistics of the data."""
        if not data:
            return {}
        
        df = pd.DataFrame([
            {
                'timestamp': d.timestamp,
                'close': d.close,
                'volume': d.volume
            } for d in data
        ])
        
        return {
            'total_records': len(data),
            'date_range': {
                'start': data[0].timestamp.isoformat() if data else None,
                'end': data[-1].timestamp.isoformat() if data else None
            },
            'symbols': list(set(d.symbol for d in data)),
            'sources': list(set(d.source for d in data)),
            'price_stats': {
                'mean': float(df['close'].mean()),
                'std': float(df['close'].std()),
                'min': float(df['close'].min()),
                'max': float(df['close'].max())
            } if 'close' in df.columns else {},
            'volume_stats': {
                'mean': float(df['volume'].mean()),
                'std': float(df['volume'].std()),
                'min': float(df['volume'].min()),
                'max': float(df['volume'].max())
            } if 'volume' in df.columns else {}
        }
    
    def _get_recommendations(self, results: List[ValidationResult]) -> List[str]:
        """Generate recommendations based on validation results."""
        recommendations = []
        
        # Group results by type
        critical_issues = [r for r in results if r.level == ValidationLevel.CRITICAL and not r.passed]
        error_issues = [r for r in results if r.level == ValidationLevel.ERROR and not r.passed]
        warning_issues = [r for r in results if r.level == ValidationLevel.WARNING and not r.passed]
        
        if critical_issues:
            recommendations.append(
                "CRITICAL: Resolve critical data issues before proceeding with model training"
            )
        
        if error_issues:
            recommendations.append(
                "ERROR: Fix data consistency errors to ensure model reliability"
            )
        
        if warning_issues:
            recommendations.append(
                "WARNING: Address data quality warnings to improve model performance"
            )
        
        # Specific recommendations
        issue_types = [r.check_name for r in results if not r.passed]
        
        if 'missing_data' in issue_types:
            recommendations.append(
                "Consider data imputation or filtering for missing values"
            )
        
        if 'price_spikes' in issue_types:
            recommendations.append(
                "Apply outlier detection and removal for price anomalies"
            )
        
        if 'ohlc_consistency' in issue_types:
            recommendations.append(
                "Validate and correct OHLC data relationships"
            )
        
        if not recommendations:
            recommendations.append("Data quality is acceptable for model training")
        
        return recommendations

# Example usage and testing
async def test_data_validation():
    """Test data validation functionality."""
    from .loaders import MarketDataLoader
    
    async with MarketDataLoader() as loader:
        # Fetch test data
        data = await loader.fetch_data(
            symbol='BTC/USDT',
            source='binance',
            timeframe='1h', 
            limit=500
        )
        
        if data:
            # Run quality assessment
            checker = QualityChecker()
            quality_report = checker.assess_quality(data)
            
            print(f"Data Quality Score: {quality_report['quality_score']:.1f} ({quality_report['quality_grade']})")
            print(f"Issues: {quality_report['issue_counts']}")
            
            # Show validation results
            for result in quality_report['validation_results']:
                if not result.passed:
                    print(f"{result.level.value.upper()}: {result.message}")
            
            # Show recommendations
            print("\nRecommendations:")
            for rec in quality_report['recommendations']:
                print(f"- {rec}")

if __name__ == "__main__":
    import asyncio
    asyncio.run(test_data_validation())