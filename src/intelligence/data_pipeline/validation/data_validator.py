"""
Data Validator
Comprehensive data quality validation and cleansing
"""

import logging
import pandas as pd
import numpy as np
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, timedelta
from dataclasses import dataclass, field
import json
from enum import Enum

from ..config.pipeline_config import config


class ValidationSeverity(Enum):
    """Validation issue severity levels"""
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"


@dataclass
class ValidationResult:
    """Result of data validation"""
    passed: bool
    score: float  # 0.0 to 1.0
    issues: List[Dict[str, Any]] = field(default_factory=list)
    metrics: Dict[str, Any] = field(default_factory=dict)
    timestamp: datetime = field(default_factory=datetime.now)


@dataclass
class ValidationIssue:
    """Individual validation issue"""
    severity: ValidationSeverity
    category: str
    description: str
    affected_rows: Optional[int] = None
    suggested_action: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)


class DataValidator:
    """
    Comprehensive data validation system

    Features:
    - OHLCV data integrity checks
    - Statistical anomaly detection
    - Completeness validation
    - Temporal consistency checks
    - Cross-source validation
    - Business rule enforcement
    - Data quality scoring
    """

    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.validation_rules = self._load_validation_rules()
        self.quality_thresholds = config.validation

    def validate_ohlcv_data(self, data: pd.DataFrame, symbol: str) -> ValidationResult:
        """
        Validate OHLCV data quality

        Args:
            data: DataFrame with OHLCV data
            symbol: Stock symbol for context

        Returns:
            ValidationResult with score and issues
        """
        issues = []
        metrics = {}

        try:
            # Basic structure validation
            structure_issues = self._validate_structure(data, symbol)
            issues.extend(structure_issues)

            # OHLCV integrity validation
            ohlcv_issues = self._validate_ohlcv_integrity(data, symbol)
            issues.extend(ohlcv_issues)

            # Completeness validation
            completeness_issues = self._validate_completeness(data, symbol)
            issues.extend(completeness_issues)

            # Temporal validation
            temporal_issues = self._validate_temporal_consistency(data, symbol)
            issues.extend(temporal_issues)

            # Statistical validation
            statistical_issues = self._validate_statistical_properties(data, symbol)
            issues.extend(statistical_issues)

            # Business rules validation
            business_issues = self._validate_business_rules(data, symbol)
            issues.extend(business_issues)

            # Calculate metrics
            metrics = self._calculate_validation_metrics(data, issues)

            # Calculate overall score
            score = self._calculate_quality_score(issues, metrics)

            # Determine if validation passed
            passed = score >= self.quality_thresholds.quality_threshold

            return ValidationResult(
                passed=passed,
                score=score,
                issues=[asdict(issue) if isinstance(issue, ValidationIssue) else issue for issue in issues],
                metrics=metrics
            )

        except Exception as e:
            self.logger.error(f"Validation error for {symbol}: {e}")
            return ValidationResult(
                passed=False,
                score=0.0,
                issues=[{
                    "severity": "critical",
                    "category": "validation_error",
                    "description": f"Validation process failed: {str(e)}"
                }]
            )

    def _validate_structure(self, data: pd.DataFrame, symbol: str) -> List[ValidationIssue]:
        """Validate basic data structure"""
        issues = []

        # Check if DataFrame is empty
        if data.empty:
            issues.append(ValidationIssue(
                severity=ValidationSeverity.CRITICAL,
                category="structure",
                description=f"No data provided for {symbol}",
                suggested_action="Check data source availability"
            ))
            return issues

        # Check required columns
        required_columns = ['open', 'high', 'low', 'close', 'volume']
        missing_columns = [col for col in required_columns if col not in data.columns]

        if missing_columns:
            issues.append(ValidationIssue(
                severity=ValidationSeverity.CRITICAL,
                category="structure",
                description=f"Missing required columns: {missing_columns}",
                suggested_action="Verify data source schema",
                metadata={"missing_columns": missing_columns}
            ))

        # Check data types
        numeric_columns = ['open', 'high', 'low', 'close', 'volume']
        for col in numeric_columns:
            if col in data.columns and not pd.api.types.is_numeric_dtype(data[col]):
                issues.append(ValidationIssue(
                    severity=ValidationSeverity.ERROR,
                    category="structure",
                    description=f"Column '{col}' should be numeric",
                    suggested_action=f"Convert {col} to numeric type",
                    metadata={"column": col, "current_dtype": str(data[col].dtype)}
                ))

        # Check index (should be datetime)
        if not isinstance(data.index, pd.DatetimeIndex):
            issues.append(ValidationIssue(
                severity=ValidationSeverity.WARNING,
                category="structure",
                description="Index should be datetime for time series data",
                suggested_action="Convert index to datetime"
            ))

        return issues

    def _validate_ohlcv_integrity(self, data: pd.DataFrame, symbol: str) -> List[ValidationIssue]:
        """Validate OHLCV data integrity"""
        issues = []

        if data.empty:
            return issues

        # Check for required columns
        required_cols = ['open', 'high', 'low', 'close', 'volume']
        available_cols = [col for col in required_cols if col in data.columns]

        if len(available_cols) < len(required_cols):
            return issues  # Skip integrity checks if columns missing

        # Check high >= low
        invalid_high_low = data['high'] < data['low']
        if invalid_high_low.any():
            invalid_count = invalid_high_low.sum()
            issues.append(ValidationIssue(
                severity=ValidationSeverity.ERROR,
                category="ohlcv_integrity",
                description=f"Found {invalid_count} rows where high < low",
                affected_rows=invalid_count,
                suggested_action="Remove or correct invalid OHLC data",
                metadata={"invalid_rows": invalid_count, "total_rows": len(data)}
            ))

        # Check high >= max(open, close) and low <= min(open, close)
        invalid_high = (data['high'] < data[['open', 'close']].max(axis=1))
        if invalid_high.any():
            invalid_count = invalid_high.sum()
            issues.append(ValidationIssue(
                severity=ValidationSeverity.ERROR,
                category="ohlcv_integrity",
                description=f"Found {invalid_count} rows where high < max(open, close)",
                affected_rows=invalid_count,
                suggested_action="Verify OHLC data accuracy"
            ))

        invalid_low = (data['low'] > data[['open', 'close']].min(axis=1))
        if invalid_low.any():
            invalid_count = invalid_low.sum()
            issues.append(ValidationIssue(
                severity=ValidationSeverity.ERROR,
                category="ohlcv_integrity",
                description=f"Found {invalid_count} rows where low > min(open, close)",
                affected_rows=invalid_count,
                suggested_action="Verify OHLC data accuracy"
            ))

        # Check for zero or negative prices
        price_columns = ['open', 'high', 'low', 'close']
        for col in price_columns:
            if col in data.columns:
                invalid_prices = data[col] <= 0
                if invalid_prices.any():
                    invalid_count = invalid_prices.sum()
                    issues.append(ValidationIssue(
                        severity=ValidationSeverity.ERROR,
                        category="ohlcv_integrity",
                        description=f"Found {invalid_count} rows with zero or negative {col} prices",
                        affected_rows=invalid_count,
                        suggested_action=f"Remove or correct invalid {col} values"
                    ))

        # Check for negative volume
        if 'volume' in data.columns:
            negative_volume = data['volume'] < 0
            if negative_volume.any():
                invalid_count = negative_volume.sum()
                issues.append(ValidationIssue(
                    severity=ValidationSeverity.ERROR,
                    category="ohlcv_integrity",
                    description=f"Found {invalid_count} rows with negative volume",
                    affected_rows=invalid_count,
                    suggested_action="Remove or correct negative volume values"
                ))

        return issues

    def _validate_completeness(self, data: pd.DataFrame, symbol: str) -> List[ValidationIssue]:
        """Validate data completeness"""
        issues = []

        if data.empty:
            return issues

        # Check for missing values
        missing_data = data.isnull().sum()
        total_cells = len(data) * len(data.columns)
        missing_percentage = (missing_data.sum() / total_cells) * 100

        if missing_percentage > (100 - self.quality_thresholds.completeness_threshold * 100):
            issues.append(ValidationIssue(
                severity=ValidationSeverity.WARNING,
                category="completeness",
                description=f"Data is {missing_percentage:.1f}% incomplete (threshold: {self.quality_thresholds.completeness_threshold*100}%)",
                suggested_action="Investigate data source reliability",
                metadata={"missing_percentage": missing_percentage}
            ))

        # Check for missing values in critical columns
        critical_columns = ['open', 'high', 'low', 'close']
        for col in critical_columns:
            if col in data.columns:
                missing_count = data[col].isnull().sum()
                if missing_count > 0:
                    missing_percentage = (missing_count / len(data)) * 100
                    severity = ValidationSeverity.ERROR if missing_percentage > 5 else ValidationSeverity.WARNING

                    issues.append(ValidationIssue(
                        severity=severity,
                        category="completeness",
                        description=f"Column '{col}' has {missing_count} missing values ({missing_percentage:.1f}%)",
                        affected_rows=missing_count,
                        suggested_action=f"Impute or remove rows with missing {col} values"
                    ))

        return issues

    def _validate_temporal_consistency(self, data: pd.DataFrame, symbol: str) -> List[ValidationIssue]:
        """Validate temporal consistency"""
        issues = []

        if data.empty or not isinstance(data.index, pd.DatetimeIndex):
            return issues

        # Check for duplicate timestamps
        duplicate_timestamps = data.index.duplicated()
        if duplicate_timestamps.any():
            duplicate_count = duplicate_timestamps.sum()
            issues.append(ValidationIssue(
                severity=ValidationSeverity.ERROR,
                category="temporal",
                description=f"Found {duplicate_count} duplicate timestamps",
                affected_rows=duplicate_count,
                suggested_action="Remove duplicate timestamps or aggregate data"
            ))

        # Check for proper sorting
        if not data.index.is_monotonic_increasing:
            issues.append(ValidationIssue(
                severity=ValidationSeverity.WARNING,
                category="temporal",
                description="Data is not sorted by timestamp",
                suggested_action="Sort data by timestamp"
            ))

        # Check for reasonable time gaps
        if len(data) > 1:
            time_diffs = data.index.to_series().diff().dropna()
            median_gap = time_diffs.median()

            # Look for gaps that are significantly larger than median
            large_gaps = time_diffs > median_gap * 10
            if large_gaps.any():
                gap_count = large_gaps.sum()
                max_gap = time_diffs.max()

                issues.append(ValidationIssue(
                    severity=ValidationSeverity.INFO,
                    category="temporal",
                    description=f"Found {gap_count} unusually large time gaps (max: {max_gap})",
                    suggested_action="Verify data continuity",
                    metadata={"max_gap": str(max_gap), "median_gap": str(median_gap)}
                ))

        return issues

    def _validate_statistical_properties(self, data: pd.DataFrame, symbol: str) -> List[ValidationIssue]:
        """Validate statistical properties of the data"""
        issues = []

        if data.empty:
            return issues

        numeric_columns = data.select_dtypes(include=[np.number]).columns

        for col in numeric_columns:
            if col == 'volume':
                continue  # Skip volume for price-based statistical tests

            series = data[col].dropna()
            if len(series) < 10:  # Need minimum data for statistical tests
                continue

            # Check for extreme outliers (beyond 5 standard deviations)
            mean_val = series.mean()
            std_val = series.std()

            if std_val > 0:
                z_scores = np.abs((series - mean_val) / std_val)
                extreme_outliers = z_scores > 5

                if extreme_outliers.any():
                    outlier_count = extreme_outliers.sum()
                    max_z_score = z_scores.max()

                    issues.append(ValidationIssue(
                        severity=ValidationSeverity.WARNING,
                        category="statistical",
                        description=f"Column '{col}' has {outlier_count} extreme outliers (max Z-score: {max_z_score:.1f})",
                        affected_rows=outlier_count,
                        suggested_action="Investigate extreme values for accuracy",
                        metadata={"column": col, "max_z_score": float(max_z_score)}
                    ))

            # Check for constant values (no variation)
            if std_val == 0:
                issues.append(ValidationIssue(
                    severity=ValidationSeverity.ERROR,
                    category="statistical",
                    description=f"Column '{col}' has no variation (constant value: {mean_val})",
                    suggested_action="Verify data source is providing real-time data",
                    metadata={"column": col, "constant_value": float(mean_val)}
                ))

        return issues

    def _validate_business_rules(self, data: pd.DataFrame, symbol: str) -> List[ValidationIssue]:
        """Validate business-specific rules"""
        issues = []

        if data.empty:
            return issues

        # Rule: Stock prices should be within reasonable ranges
        price_columns = ['open', 'high', 'low', 'close']
        for col in price_columns:
            if col in data.columns:
                # Check for unreasonably high prices (likely data error)
                high_prices = data[col] > 10000  # $10,000 per share is very high
                if high_prices.any():
                    high_count = high_prices.sum()
                    max_price = data[col].max()

                    issues.append(ValidationIssue(
                        severity=ValidationSeverity.WARNING,
                        category="business_rules",
                        description=f"Found {high_count} unusually high {col} prices (max: ${max_price:.2f})",
                        affected_rows=high_count,
                        suggested_action="Verify price data accuracy",
                        metadata={"column": col, "max_price": float(max_price)}
                    ))

        # Rule: Daily price changes should not exceed reasonable limits (e.g., 50%)
        if 'close' in data.columns and len(data) > 1:
            price_changes = data['close'].pct_change().dropna()
            extreme_changes = np.abs(price_changes) > 0.5  # 50% daily change

            if extreme_changes.any():
                extreme_count = extreme_changes.sum()
                max_change = np.abs(price_changes).max()

                issues.append(ValidationIssue(
                    severity=ValidationSeverity.WARNING,
                    category="business_rules",
                    description=f"Found {extreme_count} extreme daily price changes (max: {max_change*100:.1f}%)",
                    affected_rows=extreme_count,
                    suggested_action="Verify price change data for stock splits or errors",
                    metadata={"max_change_percent": float(max_change * 100)}
                ))

        # Rule: Volume should not be zero for extended periods
        if 'volume' in data.columns:
            zero_volume = data['volume'] == 0
            if zero_volume.any():
                zero_count = zero_volume.sum()
                zero_percentage = (zero_count / len(data)) * 100

                if zero_percentage > 10:  # More than 10% zero volume days
                    issues.append(ValidationIssue(
                        severity=ValidationSeverity.WARNING,
                        category="business_rules",
                        description=f"Found {zero_count} days with zero volume ({zero_percentage:.1f}%)",
                        affected_rows=zero_count,
                        suggested_action="Verify trading data availability",
                        metadata={"zero_volume_percentage": float(zero_percentage)}
                    ))

        return issues

    def _calculate_validation_metrics(self, data: pd.DataFrame, issues: List[ValidationIssue]) -> Dict[str, Any]:
        """Calculate validation metrics"""
        metrics = {}

        if not data.empty:
            # Basic metrics
            metrics["row_count"] = len(data)
            metrics["column_count"] = len(data.columns)
            metrics["data_range"] = {
                "start": data.index.min().isoformat() if isinstance(data.index, pd.DatetimeIndex) else None,
                "end": data.index.max().isoformat() if isinstance(data.index, pd.DatetimeIndex) else None
            }

            # Completeness metrics
            total_cells = len(data) * len(data.columns)
            missing_cells = data.isnull().sum().sum()
            metrics["completeness_ratio"] = (total_cells - missing_cells) / total_cells if total_cells > 0 else 0

            # Issue counts by severity
            metrics["issues_by_severity"] = {}
            for severity in ValidationSeverity:
                count = sum(1 for issue in issues if isinstance(issue, ValidationIssue) and issue.severity == severity)
                metrics["issues_by_severity"][severity.value] = count

            # Issue counts by category
            metrics["issues_by_category"] = {}
            categories = set()
            for issue in issues:
                if isinstance(issue, ValidationIssue):
                    categories.add(issue.category)
                elif isinstance(issue, dict) and "category" in issue:
                    categories.add(issue["category"])

            for category in categories:
                count = 0
                for issue in issues:
                    if isinstance(issue, ValidationIssue) and issue.category == category:
                        count += 1
                    elif isinstance(issue, dict) and issue.get("category") == category:
                        count += 1
                metrics["issues_by_category"][category] = count

        return metrics

    def _calculate_quality_score(self, issues: List[ValidationIssue], metrics: Dict[str, Any]) -> float:
        """Calculate overall data quality score (0.0 to 1.0)"""
        base_score = 1.0

        # Deduct points for each issue based on severity
        severity_penalties = {
            ValidationSeverity.INFO: 0.01,
            ValidationSeverity.WARNING: 0.05,
            ValidationSeverity.ERROR: 0.15,
            ValidationSeverity.CRITICAL: 0.40
        }

        for issue in issues:
            if isinstance(issue, ValidationIssue):
                penalty = severity_penalties.get(issue.severity, 0.10)
            elif isinstance(issue, dict):
                severity_str = issue.get("severity", "warning")
                severity = ValidationSeverity(severity_str) if severity_str in [s.value for s in ValidationSeverity] else ValidationSeverity.WARNING
                penalty = severity_penalties.get(severity, 0.10)
            else:
                penalty = 0.10

            base_score -= penalty

        # Factor in completeness ratio
        completeness_ratio = metrics.get("completeness_ratio", 1.0)
        base_score *= completeness_ratio

        # Ensure score is between 0 and 1
        return max(0.0, min(1.0, base_score))

    def _load_validation_rules(self) -> Dict[str, Any]:
        """Load validation rules configuration"""
        # This would typically load from a config file
        return {
            "ohlcv_integrity": {
                "high_low_check": True,
                "price_range_check": True,
                "negative_price_check": True,
                "negative_volume_check": True
            },
            "statistical_checks": {
                "outlier_detection": True,
                "outlier_threshold": 5.0,  # Z-score threshold
                "constant_value_check": True
            },
            "business_rules": {
                "max_daily_change": 0.50,  # 50%
                "max_reasonable_price": 10000,  # $10,000
                "min_volume_days": 0.90  # 90% of days should have volume > 0
            }
        }

    def validate_news_data(self, articles: List[Dict[str, Any]]) -> ValidationResult:
        """Validate news data quality"""
        issues = []
        metrics = {}

        try:
            if not articles:
                return ValidationResult(
                    passed=False,
                    score=0.0,
                    issues=[{
                        "severity": "error",
                        "category": "completeness",
                        "description": "No news articles provided"
                    }]
                )

            # Check required fields
            required_fields = ['title', 'content', 'published_at', 'source']
            missing_fields_count = 0

            for i, article in enumerate(articles):
                missing_fields = [field for field in required_fields if field not in article or not article[field]]
                if missing_fields:
                    missing_fields_count += 1

            if missing_fields_count > 0:
                issues.append({
                    "severity": "warning",
                    "category": "structure",
                    "description": f"{missing_fields_count} articles missing required fields",
                    "affected_rows": missing_fields_count
                })

            # Check content quality
            short_content_count = sum(1 for article in articles
                                    if len(article.get('content', '')) < 100)

            if short_content_count > len(articles) * 0.5:
                issues.append({
                    "severity": "warning",
                    "category": "content_quality",
                    "description": f"{short_content_count} articles have very short content",
                    "affected_rows": short_content_count
                })

            # Calculate metrics
            metrics = {
                "article_count": len(articles),
                "missing_fields_ratio": missing_fields_count / len(articles),
                "short_content_ratio": short_content_count / len(articles),
                "unique_sources": len(set(article.get('source', '') for article in articles))
            }

            # Calculate score
            score = 1.0 - (len(issues) * 0.1)  # Simple scoring
            score = max(0.0, min(1.0, score))

            return ValidationResult(
                passed=score >= 0.7,
                score=score,
                issues=issues,
                metrics=metrics
            )

        except Exception as e:
            self.logger.error(f"News data validation error: {e}")
            return ValidationResult(
                passed=False,
                score=0.0,
                issues=[{
                    "severity": "critical",
                    "category": "validation_error",
                    "description": f"Validation failed: {str(e)}"
                }]
            )

    def clean_data(self, data: pd.DataFrame, validation_result: ValidationResult) -> pd.DataFrame:
        """Clean data based on validation results"""
        if data.empty:
            return data

        cleaned_data = data.copy()

        try:
            # Remove rows with invalid OHLC relationships
            if all(col in cleaned_data.columns for col in ['open', 'high', 'low', 'close']):
                # Remove rows where high < low
                invalid_high_low = cleaned_data['high'] < cleaned_data['low']
                cleaned_data = cleaned_data[~invalid_high_low]

                # Remove rows with zero or negative prices
                price_columns = ['open', 'high', 'low', 'close']
                for col in price_columns:
                    cleaned_data = cleaned_data[cleaned_data[col] > 0]

            # Remove rows with negative volume
            if 'volume' in cleaned_data.columns:
                cleaned_data = cleaned_data[cleaned_data['volume'] >= 0]

            # Remove duplicate timestamps
            if isinstance(cleaned_data.index, pd.DatetimeIndex):
                cleaned_data = cleaned_data[~cleaned_data.index.duplicated(keep='last')]

            # Sort by timestamp
            if isinstance(cleaned_data.index, pd.DatetimeIndex):
                cleaned_data = cleaned_data.sort_index()

            # Log cleaning results
            rows_removed = len(data) - len(cleaned_data)
            if rows_removed > 0:
                self.logger.info(f"Data cleaning removed {rows_removed} invalid rows ({rows_removed/len(data)*100:.1f}%)")

            return cleaned_data

        except Exception as e:
            self.logger.error(f"Data cleaning error: {e}")
            return data  # Return original data if cleaning fails