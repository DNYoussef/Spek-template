"""Data Transformation Utilities

Consolidates data transformation, format conversion, and normalization functions.
Extracted from: analyzer/reporting/coordinator.py, analyzer/core.py
"""

from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, Optional, Union
import base64
import hashlib
import json

class DataNormalizer:
    """Normalize data to standard formats."""

@staticmethod
def normalize_dict(
        data: Dict[str, Any],
        lowercase_keys: bool = False,
        remove_none: bool = True
    ) -> Dict[str, Any]:
        """Normalize dictionary structure.
        
        Args:
            data: Input dictionary
            lowercase_keys: Convert all keys to lowercase
            remove_none: Remove None values
        """
        result = {}
        
        for key, value in data.items():
            # Normalize key
            normalized_key = key.lower() if lowercase_keys else key
            
            # Skip None values if requested
            if remove_none and value is None:
                continue
            
            # Recursively normalize nested dicts
            if isinstance(value, dict):
                result[normalized_key] = DataNormalizer.normalize_dict(
                    value, lowercase_keys, remove_none
                )
            elif isinstance(value, list):
                result[normalized_key] = [
                    DataNormalizer.normalize_dict(item, lowercase_keys, remove_none)
                    if isinstance(item, dict) else item
                    for item in value
                ]
            else:
                result[normalized_key] = value
        
        return result

@staticmethod
def normalize_numeric(
        value: Union[int, float],
        decimals: int = 2,
        scale: Optional[float] = None
    ) -> float:
        """Normalize numeric value.
        
        Args:
            value: Input value
            decimals: Decimal places to round to
            scale: Optional scaling factor (e.g., 100 for percentage)
        """
        result = float(value)
        if scale:
            result *= scale
        return round(result, decimals)

class FormatConverter:
    """Convert between data formats."""

@staticmethod
def dict_to_json(
        data: Dict[str, Any],
        pretty: bool = True
    ) -> str:
        """Convert dictionary to JSON string."""
        if pretty:
            return json.dumps(data, indent=2, sort_keys=True)
        return json.dumps(data)

@staticmethod
def json_to_dict(json_str: str) -> Dict[str, Any]:
        """Convert JSON string to dictionary."""
        return json.loads(json_str)

@staticmethod
def list_to_csv(
        data: List[Dict[str, Any]],
        headers: Optional[List[str]] = None
    ) -> str:
        """Convert list of dicts to CSV format.
        
        Args:
            data: List of dictionaries
            headers: Optional column headers (uses first dict keys if None)
        """
        if not data:
            return ""
        
        # Get headers
        if headers is None:
            headers = list(data[0].keys())
        
        # Build CSV
        lines = [','.join(headers)]
        
        for row in data:
            values = [str(row.get(h, '')) for h in headers]
            lines.append(','.join(values))
        
        return '\n'.join(lines)

@staticmethod
def encode_base64(data: Union[str, bytes]) -> str:
        """Encode data as base64."""
        if isinstance(data, str):
            data = data.encode()
        return base64.b64encode(data).decode()

@staticmethod
def decode_base64(encoded: str) -> bytes:
        """Decode base64 data."""
        return base64.b64decode(encoded)

class DataValidator:
    """Validate data structures."""

@staticmethod
def validate_schema(
        data: Dict[str, Any],
        required_fields: List[str],
        optional_fields: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """Validate data against schema.
        
        Returns:
            Validation result with status and missing fields
        """
        result = {
            'valid': True,
            'missing_required': [],
            'unexpected_fields': []
        }
        
        # Check required fields
        for field in required_fields:
            if field not in data:
                result['missing_required'].append(field)
                result['valid'] = False
        
        # Check for unexpected fields
        allowed_fields = set(required_fields)
        if optional_fields:
            allowed_fields.update(optional_fields)
        
        for field in data.keys():
            if field not in allowed_fields:
                result['unexpected_fields'].append(field)
        
        return result

@staticmethod
def validate_types(
        data: Dict[str, Any],
        type_spec: Dict[str, type]
    ) -> Dict[str, Any]:
        """Validate data types.
        
        Args:
            data: Data to validate
            type_spec: Dictionary mapping field names to expected types
        
        Returns:
            Validation result with type errors
        """
        result = {
            'valid': True,
            'type_errors': []
        }
        
        for field, expected_type in type_spec.items():
            if field in data:
                value = data[field]
                if not isinstance(value, expected_type):
                    result['type_errors'].append({
                        'field': field,
                        'expected': expected_type.__name__,
                        'actual': type(value).__name__
                    })
                    result['valid'] = False
        
        return result

class DataMerger:
    """Merge data structures."""

@staticmethod
def merge_dicts(
        *dicts: Dict[str, Any],
        strategy: str = 'override'
    ) -> Dict[str, Any]:
        """Merge multiple dictionaries.
        
        Args:
            *dicts: Dictionaries to merge
            strategy: Merge strategy ('override', 'merge', 'keep_first')
        """
        result = {}
        
        for d in dicts:
            for key, value in d.items():
                if key not in result:
                    result[key] = value
                elif strategy == 'override':
                    result[key] = value
                elif strategy == 'merge':
                    if isinstance(result[key], dict) and isinstance(value, dict):
                        result[key] = DataMerger.merge_dicts(
                            result[key], value, strategy=strategy
                        )
                    elif isinstance(result[key], list) and isinstance(value, list):
                        result[key] = result[key] + value
                    else:
                        result[key] = value
                # 'keep_first' - do nothing, keep existing value
        
        return result

@staticmethod
def deduplicate_list(
        items: List[Any],
        key_func: Optional[callable] = None
    ) -> List[Any]:
        """Remove duplicates from list.
        
        Args:
            items: List to deduplicate
            key_func: Optional function to extract comparison key
        """
        if key_func:
            seen = set()
            result = []
            for item in items:
                key = key_func(item)
                if key not in seen:
                    seen.add(key)
                    result.append(item)
            return result
        else:
            # For hashable items
            return list(dict.fromkeys(items))

class TimestampHandler:
    """Handle timestamps and datetime conversions."""

@staticmethod
def to_iso_format(dt: datetime) -> str:
        """Convert datetime to ISO format string."""
        return dt.isoformat()

@staticmethod
def from_iso_format(iso_str: str) -> datetime:
        """Parse ISO format string to datetime."""
        return datetime.fromisoformat(iso_str)

@staticmethod
def add_timestamps(
        data: Dict[str, Any],
        fields: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """Add timestamp fields to data.
        
        Args:
            data: Data dictionary
            fields: Timestamp fields to add (default: ['timestamp', 'created_at'])
        """
        result = data.copy()
        timestamp = datetime.now().isoformat()
        
        for field in fields or ['timestamp', 'created_at']:
            if field not in result:
                result[field] = timestamp
        
        return result
