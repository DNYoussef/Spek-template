#!/usr/bin/env python3
"""
Automated Python Syntax Error Fixer
Fixes common syntax errors found by connascence analyzer
"""

from pathlib import Path
from typing import List, Tuple
import os
import re
import sys

# Error patterns and their fixes
FIXES = {
    # Pattern 1: Empty if/else/try blocks with only comments
    'empty_block': {
        'pattern': r'((?:if|else|elif|try|except|finally|for|while|with|def|class)[^:]*:)\s*\n(\s*)(#[^\n]*\n)(?=\s*(?:except|elif|else|finally|\S))',
        'replacement': r'\1\n\2\3\2pass  # Auto-fixed: empty block\n'
    },

    # Pattern 2: Unexpected indent (usually extra spaces at line start)
    'unexpected_indent': {
        'line_check': lambda line, prev_line: line.strip() and line[0] == ' ' and (not prev_line.strip() or not prev_line.rstrip().endswith(':')),
        'fix': lambda line: line.lstrip()
    },

    # Pattern 3: Unterminated string literals (triple quotes)
    'unterminated_triple_quote': {
        'pattern': r'("""[^"]*$)',
        'check': lambda content: content.count('"""') % 2 != 0,
        'fix': lambda content: content + '\n"""'
    },

    # Pattern 4: Line continuation character issues (backslash at end)
    'bad_line_continuation': {
        'pattern': r'\\\s*\n\s*\n',  # Backslash followed by blank line
        'replacement': r'\n'
    },

    # Pattern 5: Mismatched parentheses
    'mismatched_parens': {
        'pattern': r'\}\s*\)',
        'replacement': r')'
    }
}

def fix_empty_blocks(content: str) -> str:
    """Fix if/else/try blocks that only have comments"""
    pattern = FIXES['empty_block']['pattern']
    replacement = FIXES['empty_block']['replacement']
    return re.sub(pattern, replacement, content, flags=re.MULTILINE)

def fix_unexpected_indents(content: str) -> str:
    """Fix unexpected indentation errors"""
    lines = content.split('\n')
    fixed_lines = []

    for i, line in enumerate(lines):
        prev_line = lines[i-1] if i > 0 else ''

        # Check if line has unexpected indent
        if line.strip() and line[0] == ' ':
            # If previous line doesn't end with colon and isn't indented, this is likely wrong
            if prev_line.strip() and not prev_line.rstrip().endswith(':'):
                # Check if this line's indent matches previous
                prev_indent = len(prev_line) - len(prev_line.lstrip())
                curr_indent = len(line) - len(line.lstrip())

                if curr_indent > prev_indent and not prev_line.rstrip().endswith((':', '\\', ',')):
                    # Unexpected indent - reduce to match previous
                    fixed_lines.append(' ' * prev_indent + line.lstrip())
                    continue

        fixed_lines.append(line)

    return '\n'.join(fixed_lines)

def fix_unterminated_strings(content: str) -> str:
    """Fix unterminated triple-quoted strings"""
    # Count triple quotes
    if content.count('"""') % 2 != 0:
        # Find last triple quote
        last_triple = content.rfind('"""')
        if last_triple != -1:
            # Add closing triple quote at end
            content += '\n"""  # Auto-fixed: unterminated string'

    return content

def fix_line_continuations(content: str) -> str:
    """Fix bad line continuation characters"""
    pattern = FIXES['bad_line_continuation']['pattern']
    replacement = FIXES['bad_line_continuation']['replacement']
    return re.sub(pattern, replacement, content, flags=re.MULTILINE)

def fix_mismatched_parens(content: str) -> str:
    """Fix mismatched parentheses/brackets"""
    # Replace '}' with ')' if it's closing a Python expression
    content = re.sub(r'(\w+)\s*\}', r'\1)', content)
    return content

def fix_file(filepath: Path) -> Tuple[bool, str]:
    """Fix syntax errors in a single file"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        original = content

        # Apply fixes in order
        content = fix_empty_blocks(content)
        content = fix_unexpected_indents(content)
        content = fix_unterminated_strings(content)
        content = fix_line_continuations(content)
        content = fix_mismatched_parens(content)

        # Only write if changed
        if content != original:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            return True, "Fixed"

        return False, "No changes needed"

    except Exception as e:
        return False, f"Error: {str(e)}"

def main():
    """Main execution"""
    # ALL Files with syntax errors (from connascence output)
    error_files = [
        # Already fixed batch 1
        "scripts/fix_all_nasa_syntax.py",
        "scripts/performance_monitor.py",
        "scripts/remove_unicode.py",
        "scripts/unicode_removal_linter.py",
        ".claude/.artifacts/artifact_manager.py",
        ".claude/.artifacts/dfars_compliance_framework.py",
        ".claude/.artifacts/quality_analysis.py",
        ".claude/.artifacts/quality_validator.py",
        ".claude/.artifacts/compliance/compliance_packager.py",
        ".claude/coordination/adaptive/agent_deployment_protocol.py",
        ".claude/performance/baselines/baseline_collector.py",
        ".claude/performance/monitoring/realtime_monitor.py",
        ".claude/performance/validation/theater_detector.py",

        # Enterprise compliance
        "analyzer/enterprise/compliance/reporting.py",
        "analyzer/enterprise/compliance/soc2.py",
        "analyzer/enterprise/compliance/validate_retention.py",
        "analyzer/enterprise/compliance/core.py",
        "analyzer/enterprise/compliance/integration.py",
        "analyzer/enterprise/compliance/iso27001.py",
        "analyzer/enterprise/performance/MLCacheOptimizer.py",
        "analyzer/integrations/tool_coordinator.py",
        "analyzer/performance/ci_cd_accelerator.py",

        # Cycles/Trading
        "src/cycles/profit_calculator.py",
        "src/cycles/scheduler.py",
        "src/cycles/weekly_cycle.py",
        "src/cycles/weekly_siphon_automator.py",
        "src/trading/market_data_provider.py",
        "src/trading/portfolio_manager.py",
        "src/trading/trade_executor.py",

        # Security
        "src/security/dfars_compliance_engine.py",
        "src/security/enhanced_audit_trail_manager.py",

        # Six Sigma
        "src/sixsigma/telemetry_config.py",

        # Theater detection
        "src/theater-detection/theater-detector.py",

        # Intelligence data pipeline
        "src/intelligence/data_pipeline/monitoring/metrics_collector.py",
        "src/intelligence/data_pipeline/monitoring/pipeline_monitor.py",
        "src/intelligence/data_pipeline/processing/alternative_data_processor.py",
        "src/intelligence/data_pipeline/processing/news_processor.py",
        "src/intelligence/data_pipeline/processing/options_flow_analyzer.py",
        "src/intelligence/data_pipeline/processing/sentiment_processor.py",
        "src/intelligence/data_pipeline/sources/alpaca_source.py",
        "src/intelligence/data_pipeline/sources/data_source_manager.py",
        "src/intelligence/data_pipeline/sources/historical_loader.py",
        "src/intelligence/data_pipeline/sources/polygon_source.py",
        "src/intelligence/data_pipeline/sources/yahoo_source.py",
        "src/intelligence/data_pipeline/streaming/failover_manager.py",
        "src/intelligence/data_pipeline/streaming/real_time_streamer.py",
        "src/intelligence/data_pipeline/streaming/stream_buffer.py",
        "src/intelligence/data_pipeline/streaming/websocket_manager.py",
        "src/intelligence/data_pipeline/validation/data_validator.py",
        "src/intelligence/data_pipeline/validation/quality_monitor.py",

        # Neural networks
        "src/intelligence/neural_networks/cnn/pattern_definitions.py",
        "src/intelligence/neural_networks/cnn/pattern_recognizer.py",
        "src/intelligence/neural_networks/cnn/resnet_backbone.py",
        "src/intelligence/neural_networks/ensemble/ensemble_framework.py",
        "src/intelligence/neural_networks/lstm/attention_mechanism.py",
        "src/intelligence/neural_networks/lstm/lstm_predictor.py",
        "src/intelligence/neural_networks/rl/ppo_agent.py",
        "src/intelligence/neural_networks/rl/strategy_optimizer.py",
        "src/intelligence/neural_networks/rl/trading_environment.py",
        "src/intelligence/neural_networks/transformer/financial_bert.py",
        "src/intelligence/neural_networks/transformer/sentiment_analyzer.py",

        # Linter integration
        "src/linter-integration/agents/api_docs_node.py",
        "src/linter-integration/agents/integration_specialist_node.py",

        # Safety
        "src/safety/integration/trading_safety_bridge.py",

        # Tests
        "tests/workflow-validation/comprehensive_validation_report.py",
        "tests/workflow-validation/python_execution_tests.py",
    ]

    base_dir = Path(__file__).parent.parent

    print("Automated Python Syntax Error Fixer")
    print("=" * 50)

    fixed_count = 0
    failed_count = 0

    for rel_path in error_files:
        filepath = base_dir / rel_path

        if not filepath.exists():
            print(f"[SKIP] {rel_path}: File not found")
            continue

        success, message = fix_file(filepath)

        if success:
            print(f"[OK] {rel_path}: {message}")
            fixed_count += 1
        else:
            print(f"[FAIL] {rel_path}: {message}")
            if "Error" in message:
                failed_count += 1

    print("=" * 50)
    print(f"Fixed: {fixed_count}")
    print(f"Failed: {failed_count}")
    print(f"Total: {len(error_files)}")

    return 0 if failed_count == 0 else 1

if __name__ == "__main__":
    sys.exit(main())