# Enhanced /conn:scan Command

## Overview
Advanced connascence analysis with Sequential Thinking MCP and Memory integration for persistent learning and systematic analysis.

## Command Syntax
```bash
/conn:scan [--architecture] [--detector-pools] [--enhanced-metrics] [--hotspots] [--cache-stats] [--sequential-thinking] [--memory-update]
```

## Enhanced Features

### Core Analysis (Already Integrated)
- **9 Detector Modules**: CoM, CoP, CoA, CoT, CoV, CoE, CoI, CoN, CoC
- **God Object Detection**: Context-aware with configurable thresholds
- **MECE Duplication Analysis**: Comprehensive duplication detection
- **NASA POT10 Compliance**: Defense industry standards

### NEW: Extended Capabilities
- **`--architecture`**: Enable architecture module analysis (6 files, 1,800 LOC)
- **`--detector-pools`**: Use performance-optimized detector instances  
- **`--enhanced-metrics`**: Comprehensive quality scoring (10 files, 2,400 LOC)
- **`--hotspots`**: Cross-component hotspot analysis
- **`--cache-stats`**: IncrementalCache performance metrics

### NEW: MCP Integration
- **`--sequential-thinking`**: Structured analysis using Sequential Thinking MCP
- **`--memory-update`**: Update Memory MCP with analysis patterns and insights

## Implementation Pattern

### Phase 1: Analysis with Sequential Thinking
```bash
# 1. Initialize Sequential Thinking for structured analysis
mcp_sequential_thinking.start_analysis()

# 2. Structured reasoning through analysis phases
mcp_sequential_thinking.analyze_step("Core Connascence Detection")
mcp_sequential_thinking.analyze_step("Architecture Analysis") 
mcp_sequential_thinking.analyze_step("Performance Metrics")
mcp_sequential_thinking.analyze_step("Integration Recommendations")

# 3. Synthesize findings
mcp_sequential_thinking.synthesize_results()
```

### Phase 2: Analysis Execution
```python
# Enhanced analyzer execution with structured thinking
python -m analyzer.core \
  --path . \
  --types CoM,CoP,CoA,CoT,CoV,CoE,CoI,CoN,CoC \
  --architecture-analysis \
  --detector-pools \
  --enhanced-metrics \
  --hotspots \
  --performance-monitor \
  --sequential-thinking-integration \
  --output .claude/.artifacts/connascence_enhanced.json
```

### Phase 3: Unified Memory Integration
```bash
# Update unified memory system with analysis insights using memory bridge
source "${SCRIPT_DIR}/memory_bridge.sh"

# Store analysis patterns with intelligent routing
unified_memory_store "analysis/connascence" "patterns" "$analysis_results" '{"type": "connascence_analysis"}'

# Store architectural insights for cross-system sharing
unified_memory_store "intelligence/architecture" "hotspots" "$hotspot_data" '{"type": "architecture_hotspots"}'

# Store performance baselines in unified intelligence
unified_memory_store "intelligence/performance" "detector_pools" "$performance_metrics" '{"type": "performance_baselines"}'

# Store smart recommendations for cross-agent sharing
unified_memory_store "intelligence/recommendations" "refactoring" "$smart_recommendations" '{"type": "smart_recommendations", "priority": "high"}'

# Trigger memory synchronization for immediate availability
sync_memory_systems
```

## Output Format

### Enhanced JSON Output Structure
```json
{
  "timestamp": "2024-09-08T12:15:00Z",
  "analysis_version": "2.0.0-enhanced",
  "configuration": {
    "architecture_enabled": true,
    "detector_pools_enabled": true,
    "enhanced_metrics": true,
    "hotspots_enabled": true
  },
  
  "core_analysis": {
    "connascence_violations": [...],
    "god_objects": [...],
    "mece_analysis": {...},
    "nasa_compliance": {...}
  },
  
  "architecture_analysis": {
    "hotspots": [
      {
        "component": "auth.module",
        "coupling_score": 0.85,
        "cross_dependencies": 12,
        "refactor_priority": "high",
        "recommendation": "Extract interface to reduce coupling"
      }
    ],
    "detector_pool_stats": {
      "performance_improvement": "34%",
      "cache_hit_rate": 0.87,
      "detector_instances": 9
    },
    "cross_component_correlations": [
      {
        "components": ["auth", "database"],
        "correlation_score": 0.73,
        "correlation_type": "CoE"
      }
    ]
  },
  
  "enhanced_metrics": {
    "quality_score": 0.82,
    "architectural_health": 0.78,
    "technical_debt_index": 0.23,
    "maintainability_index": 87.5
  },
  
  "performance_monitoring": {
    "analysis_duration_ms": 2340,
    "memory_peak_mb": 145,
    "cache_utilization": 0.67,
    "incremental_speedup": "47%"
  },
  
  "smart_recommendations": [
    {
      "priority": "critical",
      "type": "architectural",
      "component": "auth.service",
      "issue": "High coupling detected",
      "solution": "Apply dependency inversion pattern",
      "estimated_effort": "4-6 hours"
    }
  ]
}
```

## CI/CD Integration

### GitHub Actions Enhancement
Add to existing quality-gates.yml:
```yaml
- name: Enhanced Connascence Analysis
  run: |
    /conn:scan \
      --architecture \
      --detector-pools \
      --enhanced-metrics \
      --hotspots \
      --sequential-thinking \
      --memory-update \
      --output .claude/.artifacts/connascence_enhanced.json
```

### Slack/Teams Integration
Automated architecture alerts:
```bash
# High-priority architectural issues trigger notifications
if [ "$ARCHITECTURE_SCORE" -lt "0.75" ]; then
  curl -X POST $SLACK_WEBHOOK \
    -d "Architecture quality below threshold: $ARCHITECTURE_SCORE"
fi
```

