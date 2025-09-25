#!/usr/bin/env python3
"""
Magic Number Replacement Script
Systematically replaces magic numbers with named constants to eliminate
Connascence of Meaning violations.
"""

from pathlib import Path
from typing import Dict, List, Tuple
import os
import re
import sys

# Magic number mappings based on intelligent analysis
MAGIC_NUMBER_REPLACEMENTS = {
    # NASA/DFARS Compliance Thresholds
    'NASA_POT10_MINIMUM_COMPLIANCE_THRESHOLD': 'NASA_POT10_MINIMUM_COMPLIANCE_THRESHOLD',
    'NASA_POT10_TARGET_COMPLIANCE_THRESHOLD': 'NASA_POT10_TARGET_COMPLIANCE_THRESHOLD',
    '0.90': 'REGULATORY_FACTUALITY_REQUIREMENT',
    '0.85': 'QUALITY_GATE_MINIMUM_PASS_RATE',
    '0.88': 'CONNASCENCE_ANALYSIS_THRESHOLD',
    '0.75': 'THEATER_DETECTION_WARNING_THRESHOLD',
    'THEATER_DETECTION_FAILURE_THRESHOLD': 'THEATER_DETECTION_FAILURE_THRESHOLD',

    # Quality Gate Constants (when used as percentages)
    '80': 'MINIMUM_TEST_COVERAGE_PERCENTAGE',
    '25': 'MAXIMUM_GOD_OBJECTS_ALLOWED',
    '100': 'MAXIMUM_FUNCTION_LENGTH_LINES',
    '500': 'MAXIMUM_FILE_LENGTH_LINES',
    '10': 'MAXIMUM_FUNCTION_PARAMETERS',
    '5': 'MAXIMUM_NESTED_DEPTH',

    # Business Rules
    '3': 'MAXIMUM_RETRY_ATTEMPTS',
    '7': 'DAYS_RETENTION_PERIOD',
    '30': 'API_TIMEOUT_SECONDS',
    'SESSION_TIMEOUT_SECONDS': 'SESSION_TIMEOUT_SECONDS',

    # Financial Constants
    '0.02': 'KELLY_CRITERION_FRACTION',
    '0.25': 'MAXIMUM_POSITION_SIZE_RATIO',
    '0.10': 'STOP_LOSS_PERCENTAGE',
    'TAKE_PROFIT_PERCENTAGE': 'TAKE_PROFIT_PERCENTAGE',
    '0.05': 'MINIMUM_TRADE_THRESHOLD',
}

IMPORT_STATEMENT = "from src.constants.base import "

def should_replace_i, NASA_POT10_MINIMUM_COMPLIANCE_THRESHOLD, NASA_POT10_TARGET_COMPLIANCE_THRESHOLD, SESSION_TIMEOUT_SECONDS, TAKE_PROFIT_PERCENTAGE, THEATER_DETECTION_FAILURE_THRESHOLDn_context(file_content: str, match_pos: int, magic_number: str, constant_name: str) -> bool:
    """
    Determine if a magic number should be replaced based on context.
    Only replace numbers that appear to be business logic constants.
    """
    # Get surrounding context (50 chars before and after)
    start = max(0, match_pos - 50)
    end = min(len(file_content), match_pos + len(magic_number) + 50)
    context = file_content[start:end].lower()

    # Business logic indicators
    business_indicators = [
        'compliance', 'threshold', 'nasa', 'dfars', 'quality', 'gate',
        'coverage', 'test', 'timeout', 'retry', 'retention', 'kelly',
        'position', 'stop_loss', 'take_profit', 'minimum', 'maximum',
        'score', 'requirement', 'theater', 'detection'
    ]

    # Skip if it's clearly not business logic
    skip_indicators = [
        'range(', 'len(', 'sleep(', 'time.', 'index', '[', ']',
        'version', 'port', 'id', 'rgb', 'color', 'width', 'height',
        'x', 'y', 'coordinate', 'pixel', 'buffer', 'size_mb'
    ]

    # Check for business logic context
    has_business_context = any(indicator in context for indicator in business_indicators)
    has_skip_context = any(indicator in context for indicator in skip_indicators)

    return has_business_context and not has_skip_context

def replace_magic_numbers_in_file(file_path: Path) -> Tuple[bool, List[str]]:
    """Replace magic numbers in a single file."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        original_content = content
        replaced_constants = set()

        # Track all constants used in this file
        constants_to_import = set()

        # Process each magic number
        for magic_num, constant_name in MAGIC_NUMBER_REPLACEMENTS.items():
            # Create regex pattern for the magic number
            if '.' in magic_num:
                # Decimal number - be more specific to avoid partial matches
                pattern = r'\b' + re.escape(magic_num) + r'\b'
            else:
                # Integer - be careful about context
                pattern = r'\b' + magic_num + r'\b'

            matches = list(re.finditer(pattern, content))

            for match in reversed(matches):  # Process in reverse to preserve positions
                if should_replace_in_context(content, match.start(), magic_num, constant_name):
                    # Replace the magic number
                    start, end = match.span()
                    content = content[:start] + constant_name + content[end:]
                    constants_to_import.add(constant_name)
                    replaced_constants.add(f"{magic_num} -> {constant_name}")

        # Add import statement if we made replacements
        if constants_to_import and content != original_content:
            # Check if constants import already exists
            if 'from src.constants import' not in content:
                # Add import at the top after other imports
                lines = content.split('\n')
                import_line = IMPORT_STATEMENT + ', '.join(sorted(constants_to_import))

                # Find the right place to insert the import
                insert_idx = 0
                for i, line in enumerate(lines):
                    if line.strip().startswith('import ') or line.strip().startswith('from '):
                        insert_idx = i + 1
                    elif line.strip() and not line.strip().startswith('#'):
                        break

                lines.insert(insert_idx, import_line)
                content = '\n'.join(lines)
            else:
                # Update existing import
                import_pattern = r'from src\.constants import ([^\\n]+)'
                match = re.search(import_pattern, content)
                if match:
                    existing_imports = set(imp.strip() for imp in match.group(1).split(','))
                    all_imports = existing_imports | constants_to_import
                    new_import = IMPORT_STATEMENT + ', '.join(sorted(all_imports))
                    content = re.sub(import_pattern, new_import.replace('from src.constants.base import "'

def should_replace_i, NASA_POT10_MINIMUM_COMPLIANCE_THRESHOLD, NASA_POT10_TARGET_COMPLIANCE_THRESHOLD, SESSION_TIMEOUT_SECONDS, TAKE_PROFIT_PERCENTAGE, THEATER_DETECTION_FAILURE_THRESHOLDnstants import '), content)

        # Write back if changes were made
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            return True, list(replaced_constants)

        return False, []

    except Exception as e:
        print(f"Error processing {file_path}: {e}")
        return False, []

def main():
    """Replace magic numbers across the codebase."""
    root_path = Path('C:/Users/17175/Desktop/spek template')

    # Target directories
    target_dirs = [
        'src', 'analyzer', 'scripts', 'tests', 'config',
        '.github/scripts', '.claude/.artifacts'
    ]

    total_files_processed = 0
    total_files_modified = 0
    total_replacements = 0

    print("Starting magic number replacement...")
    print(f"Target constants: {len(MAGIC_NUMBER_REPLACEMENTS)}")
    print("-" * 60)

    for target_dir in target_dirs:
        dir_path = root_path / target_dir
        if not dir_path.exists():
            continue

        print(f"\nProcessing directory: {target_dir}")

        # Find all Python files
        python_files = list(dir_path.rglob('*.py'))

        for file_path in python_files:
            # Skip __pycache__ and other generated directories
            if '__pycache__' in str(file_path) or '.git' in str(file_path):
                continue

            total_files_processed += 1
            modified, replacements = replace_magic_numbers_in_file(file_path)

            if modified:
                total_files_modified += 1
                total_replacements += len(replacements)
                print(f"  Modified: {file_path.relative_to(root_path)}")
                for replacement in replacements[:3]:  # Show first 3 replacements
                    print(f"    - {replacement}")
                if len(replacements) > 3:
                    print(f"    - ... and {len(replacements) - 3} more")

    print("\n" + "=" * 60)
    print("MAGIC NUMBER REPLACEMENT COMPLETE")
    print("=" * 60)
    print(f"Files processed: {total_files_processed}")
    print(f"Files modified: {total_files_modified}")
    print(f"Total replacements: {total_replacements}")
    print(f"Estimated CoM violations eliminated: {total_replacements}")

if __name__ == '__main__':
    main()