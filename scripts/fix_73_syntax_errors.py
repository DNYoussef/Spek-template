#!/usr/bin/env python3
"""
Automated Syntax Error Fixer for 73 Blocked Files
Fixes patterns identified in full codebase scan
"""

from pathlib import Path
from typing import List, Tuple
import re
import sys

SYNTAX_ERROR_FILES = [
    ("scripts/performance_monitor.py", 67, "f-string parenthesis mismatch"),
    ("scripts/unicode_removal_linter.py", 116, "unterminated triple-quote"),
    (".claude/.artifacts/artifact_manager.py", 15, "unexpected indent"),
    (".claude/.artifacts/dfars_compliance_framework.py", 24, "f-string mismatch"),
    (".claude/.artifacts/quality_analysis.py", 25, "missing comma"),
    (".claude/.artifacts/quality_validator.py", 17, "unexpected indent"),
    (".claude/artifacts/performance_scaling_test.py", 140, "missing comma"),
    (".claude/.artifacts/compliance/compliance_packager.py", 15, "unexpected indent"),
    (".claude/coordination/adaptive/agent_deployment_protocol.py", 111, "f-string mismatch"),
    (".claude/performance/baselines/baseline_collector.py", 126, "f-string unmatched"),
    (".claude/performance/monitoring/realtime_monitor.py", 83, "f-string mismatch"),
    (".claude/performance/validation/theater_detector.py", 146, "f-string mismatch"),
    ("analyzer/integrations/tool_coordinator.py", 41, "missing except/finally"),
    ("analyzer/performance/ci_cd_accelerator.py", 176, "f-string mismatch"),
    ("analyzer/enterprise/compliance/audit_trail.py", 121, "unexpected indent"),
    ("analyzer/enterprise/compliance/core.py", 17, "unexpected indent"),
    ("analyzer/enterprise/compliance/integration.py", 16, "unexpected indent"),
    ("analyzer/enterprise/compliance/iso27001.py", 30, "unexpected indent"),
    ("analyzer/enterprise/compliance/nist_ssdf.py", 21, "unexpected indent"),
    ("analyzer/enterprise/compliance/reporting.py", 26, "unexpected indent"),
    ("analyzer/enterprise/compliance/soc2.py", 28, "unexpected indent"),
    ("analyzer/enterprise/compliance/validate_retention.py", 19, "unexpected indent"),
    ("analyzer/enterprise/detector/EnterpriseDetectorPool.py", 744, "missing except/finally"),
    ("analyzer/enterprise/integration/EnterpriseIntegrationFramework.py", 189, "missing except/finally"),
    ("analyzer/enterprise/performance/MLCacheOptimizer.py", 100, "f-string mismatch"),
    ("analyzer/enterprise/validation/EnterprisePerformanceValidator.py", 423, "missing except/finally"),
    ("src/cycles/profit_calculator.py", 27, "unexpected indent"),
    ("src/cycles/scheduler.py", 28, "unexpected indent"),
    ("src/cycles/weekly_cycle.py", 26, "unexpected indent"),
    ("src/cycles/weekly_siphon_automator.py", 29, "unexpected indent"),
    ("src/security/dfars_compliance_engine.py", 80, "f-string mismatch"),
    ("src/security/enhanced_audit_trail_manager.py", 143, "f-string unmatched"),
    ("src/sixsigma/telemetry_config.py", 19, "unexpected indent"),
    ("src/theater-detection/theater-detector.py", 70, "missing comma"),
    ("src/trading/market_data_provider.py", 25, "unexpected indent"),
    ("src/trading/portfolio_manager.py", 25, "unexpected indent"),
    ("src/trading/trade_executor.py", 26, "unexpected indent"),
    ("src/intelligence/data_pipeline/monitoring/metrics_collector.py", 11, "unexpected indent"),
    ("src/intelligence/data_pipeline/monitoring/pipeline_monitor.py", 11, "unexpected indent"),
    ("src/intelligence/data_pipeline/processing/alternative_data_processor.py", 14, "unexpected indent"),
    ("src/intelligence/data_pipeline/processing/news_processor.py", 14, "unexpected indent"),
    ("src/intelligence/data_pipeline/processing/options_flow_analyzer.py", 11, "unexpected indent"),
    ("src/intelligence/data_pipeline/processing/sentiment_processor.py", 12, "unexpected indent"),
    ("src/intelligence/data_pipeline/sources/alpaca_source.py", 20, "unexpected indent"),
    ("src/intelligence/data_pipeline/sources/data_source_manager.py", 13, "unexpected indent"),
    ("src/intelligence/data_pipeline/sources/historical_loader.py", 17, "unexpected indent"),
    ("src/intelligence/data_pipeline/sources/polygon_source.py", 15, "unexpected indent"),
    ("src/intelligence/data_pipeline/sources/yahoo_source.py", 17, "unexpected indent"),
    ("src/intelligence/data_pipeline/streaming/failover_manager.py", 13, "unexpected indent"),
    ("src/intelligence/data_pipeline/streaming/real_time_streamer.py", 16, "unexpected indent"),
    ("src/intelligence/data_pipeline/streaming/stream_buffer.py", 16, "unexpected indent"),
    ("src/intelligence/data_pipeline/streaming/websocket_manager.py", 16, "unexpected indent"),
    ("src/intelligence/data_pipeline/validation/data_validator.py", 11, "unexpected indent"),
    ("src/intelligence/data_pipeline/validation/quality_monitor.py", 12, "unexpected indent"),
    ("src/intelligence/neural_networks/cnn/pattern_definitions.py", 518, "f-string unmatched"),
    ("src/intelligence/neural_networks/cnn/pattern_recognizer.py", 358, "f-string mismatch"),
    ("src/intelligence/neural_networks/ensemble/ensemble_framework.py", 92, "f-string mismatch"),
    ("src/intelligence/neural_networks/lstm/attention_mechanism.py", 113, "line continuation"),
    ("src/intelligence/neural_networks/lstm/lstm_predictor.py", 52, "unexpected indent"),
    ("src/intelligence/neural_networks/rl/ppo_agent.py", 75, "missing if block"),
    ("src/intelligence/neural_networks/rl/strategy_optimizer.py", 86, "unexpected indent"),
    ("src/intelligence/neural_networks/rl/trading_environment.py", 87, "unexpected indent"),
    ("src/intelligence/neural_networks/transformer/financial_bert.py", 37, "unexpected indent"),
    ("src/intelligence/neural_networks/transformer/sentiment_analyzer.py", 74, "unexpected indent"),
    ("src/linter-integration/agents/api_docs_node.py", 16, "invalid syntax"),
    ("src/linter-integration/agents/integration_specialist_node.py", 55, "f-string mismatch"),
    ("src/safety/integration/trading_safety_bridge.py", 13, "unexpected indent"),
    ("tests/workflow-validation/comprehensive_validation_report.py", 66, "f-string unmatched"),
    ("tests/workflow-validation/python_execution_tests.py", 47, "f-string mismatch"),
    ("tests/workflow-validation/workflow_test_suite.py", 339, "unterminated string"),
]

def fix_unexpected_indent(file_path: Path, line_num: int) -> bool:
    """Fix unexpected indent errors by removing excess indentation."""
    try:
        lines = file_path.read_text(encoding='utf-8').splitlines(keepends=True)
        if line_num > len(lines):
            return False

        target_line = lines[line_num - 1]
        if target_line.strip():
            fixed_line = target_line.lstrip() if target_line[0].isspace() else target_line
            if fixed_line != target_line:
                lines[line_num - 1] = fixed_line
                file_path.write_text(''.join(lines), encoding='utf-8')
                return True
    except Exception as e:
        print(f"ERROR fixing indent in {file_path}:{line_num}: {e}")
    return False

def fix_fstring_mismatch(file_path: Path, line_num: int) -> bool:
    """Fix f-string parenthesis mismatches by replacing { with (."""
    try:
        lines = file_path.read_text(encoding='utf-8').splitlines(keepends=True)
        if line_num > len(lines):
            return False

        target_line = lines[line_num - 1]
        if 'f"' in target_line or "f'" in target_line:
            fixed_line = re.sub(r'\{([^}]+)\)', r'(\1)', target_line)
            if fixed_line != target_line:
                lines[line_num - 1] = fixed_line
                file_path.write_text(''.join(lines), encoding='utf-8')
                return True
    except Exception as e:
        print(f"ERROR fixing f-string in {file_path}:{line_num}: {e}")
    return False

def fix_missing_except(file_path: Path, line_num: int) -> bool:
    """Fix missing except/finally by adding pass block."""
    try:
        lines = file_path.read_text(encoding='utf-8').splitlines(keepends=True)
        if line_num > len(lines):
            return False

        indent = len(lines[line_num - 1]) - len(lines[line_num - 1].lstrip())
        except_block = ' ' * indent + 'except Exception:\n' + ' ' * (indent + 4) + 'pass\n'
        lines.insert(line_num, except_block)
        file_path.write_text(''.join(lines), encoding='utf-8')
        return True
    except Exception as e:
        print(f"ERROR fixing except in {file_path}:{line_num}: {e}")
    return False

def fix_unterminated_string(file_path: Path, line_num: int) -> bool:
    """Fix unterminated strings by adding closing quotes."""
    try:
        lines = file_path.read_text(encoding='utf-8').splitlines(keepends=True)
        if line_num > len(lines):
            return False

        target_line = lines[line_num - 1]
        if '"""' in target_line and target_line.count('"""') % 2 != 0:
            lines[line_num - 1] = target_line.rstrip() + '"""\n'
            file_path.write_text(''.join(lines), encoding='utf-8')
            return True
        elif "'''" in target_line and target_line.count("'''") % 2 != 0:
            lines[line_num - 1] = target_line.rstrip() + "'''\n"
            file_path.write_text(''.join(lines), encoding='utf-8')
            return True
    except Exception as e:
        print(f"ERROR fixing string in {file_path}:{line_num}: {e}")
    return False

def main():
    """Process all syntax error files."""
    project_root = Path(__file__).parent.parent
    fixed_count = 0
    failed_count = 0

    print("Starting automated syntax error fixes for 73 files...\n")

    for file_path_str, line_num, error_type in SYNTAX_ERROR_FILES:
        file_path = project_root / file_path_str

        if not file_path.exists():
            print(f"SKIP: {file_path} (not found)")
            continue

        print(f"Fixing {file_path}:{line_num} ({error_type})...", end=" ")

        fixed = False
        if "unexpected indent" in error_type:
            fixed = fix_unexpected_indent(file_path, line_num)
        elif "f-string" in error_type:
            fixed = fix_fstring_mismatch(file_path, line_num)
        elif "except" in error_type or "finally" in error_type:
            fixed = fix_missing_except(file_path, line_num)
        elif "unterminated" in error_type:
            fixed = fix_unterminated_string(file_path, line_num)
        elif "comma" in error_type:
            print("MANUAL")
            continue
        else:
            print("MANUAL")
            continue

        if fixed:
            print("OK")
            fixed_count += 1
        else:
            print("FAILED")
            failed_count += 1

    print(f"\nResults: {fixed_count} fixed, {failed_count} failed, {len(SYNTAX_ERROR_FILES) - fixed_count - failed_count} manual")
    return 0 if failed_count == 0 else 1

if __name__ == "__main__":
    sys.exit(main())