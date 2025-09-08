# Enhanced /qa:run Command

## Overview
Comprehensive quality assurance suite with Sequential Thinking MCP and Memory integration for intelligent, learning-based quality analysis.

## Command Syntax
```bash
/qa:run [--architecture] [--performance-monitor] [--sequential-thinking] [--memory-update] [--enhanced-artifacts]
```

## Enhanced Features

### Core QA Suite (Already Integrated)
- **Tests**: 100% pass rate requirement
- **TypeCheck**: Zero compilation errors
- **Lint**: Code style and security enforcement
- **Coverage**: Differential coverage analysis
- **Security**: Semgrep OWASP scanning
- **Connascence**: All 9 detector modules

### NEW: Architecture & Performance Integration
- **Architecture Analysis**: Cross-component analysis with detector pools
- **Performance Monitoring**: Real-time resource tracking and metrics
- **Hotspot Detection**: Quality and performance hotspot identification
- **Cache Analytics**: IncrementalCache performance and optimization

### NEW: MCP Integration
- **Sequential Thinking**: Structured QA reasoning for systematic analysis
- **Memory Integration**: Quality pattern learning and historical context

## Benefits

### Sequential Thinking Benefits
- **Systematic QA Analysis**: Step-by-step quality reasoning
- **Comprehensive Coverage**: Ensures all QA dimensions are analyzed
- **Clear Quality Trail**: Traceable quality assessment decision-making
- **Consistent Methodology**: Standardized QA analysis approach

### Memory Integration Benefits
- **Quality Learning**: QA patterns and insights improve over time
- **Pattern Recognition**: Memory-driven quality pattern identification
- **Fix Strategy Optimization**: Based on historically successful approaches
- **Trend Awareness**: Long-term quality evolution and regression prevention

### Architecture & Performance Benefits
- **Holistic Quality Assessment**: Combines code quality with architectural quality
- **Performance-Aware QA**: Real-time resource tracking during analysis
- **Optimization Insights**: Performance optimization opportunities identified
- **Cache Intelligence**: IncrementalCache optimization for faster CI/CD

## Usage Examples

### Basic Enhanced QA
```bash
claude /qa:run --architecture --sequential-thinking
```

### Full QA Suite with All Enhancements
```bash
claude /qa:run \
  --architecture \
  --performance-monitor \
  --sequential-thinking \
  --memory-update \
  --enhanced-artifacts
```

### Memory-Driven QA Analysis
```bash
# Leverages historical quality patterns for smarter analysis
claude /qa:run --memory-context --smart-recommendations
```

This enhanced `/qa:run` command transforms quality assurance into intelligent, learning-based quality guidance with systematic reasoning, persistent memory, and comprehensive architectural awareness.

## Enhanced Output Structure

### Quality Analysis JSON with Architecture
```json
{
  "timestamp": "2024-09-08T12:15:00Z",
  "qa_version": "2.0.0-architectural",
  
  "core_quality_gates": {
    "tests": {"status": "pass", "coverage": "94.3%"},
    "typecheck": {"status": "pass", "errors": 0},
    "lint": {"status": "warn", "errors": 2, "warnings": 7},
    "security": {"status": "pass", "critical": 0, "high": 1}
  },
  
  "architectural_quality": {
    "architecture_score": 0.83,
    "component_coupling": {
      "average": 0.34,
      "hotspots": [
        {"component": "auth", "coupling": 0.76},
        {"component": "database", "coupling": 0.68}
      ]
    },
    "cross_component_violations": 12,
    "detector_pool_performance": "41% improvement",
    "cache_optimization": "enabled"
  },
  
  "sequential_thinking_analysis": {
    "reasoning_steps": [
      "Core quality assessment: All critical gates passing",
      "Architecture analysis: Moderate coupling in auth module",
      "Performance monitoring: Cache hit rate at 89%", 
      "Smart recommendations: 3 high-priority refactoring opportunities"
    ],
    "final_assessment": "Pass with architectural improvement recommendations"
  },
  
  "memory_integration": {
    "patterns_learned": 5,
    "historical_context": "Quality trending upward over 30 days",
    "predictive_insights": "Architecture refactoring will improve score to 0.89"
  },
  
  "smart_recommendations": [
    {
      "priority": "high",
      "category": "architecture",
      "issue": "Auth module coupling above threshold",
      "solution": "Extract interfaces, apply dependency injection",
      "impact": "Reduce coupling by 23%, improve maintainability"
    }
  ]
}
```

## Workflow Integration

### Enhanced CI/CD Pipeline with Unified Memory
```yaml
- name: Comprehensive QA with Architecture and Unified Memory
  run: |
    # Initialize unified memory bridge
    source scripts/memory_bridge.sh
    initialize_memory_router
    
    # Run enhanced QA with unified memory coordination
    /qa:run \
      --architecture \
      --performance-monitor \
      --sequential-thinking \
      --memory-update \
      --enhanced-artifacts
    
    # Store QA results in unified memory for agent coordination
    if [ -f .claude/.artifacts/qa_enhanced.json ]; then
      scripts/memory_bridge.sh store "analysis/qa" "latest_run" "$(cat .claude/.artifacts/qa_enhanced.json)" '{"ci": true, "branch": "'$GITHUB_REF_NAME'"}'
    fi
    
    # Architecture-aware failure analysis with unified memory context
    if [ -f .claude/.artifacts/qa_failures.json ]; then
      # Retrieve historical failure patterns
      historical_failures=$(scripts/memory_bridge.sh retrieve "intelligence/patterns" "qa_failures" 2>/dev/null || echo '{}')
      
      /qa:analyze "$(cat .claude/.artifacts/qa_failures.json)" \
        --architecture-context \
        --smart-routing \
        --historical-context "$historical_failures"
      
      # Store failure analysis for learning
      if [ -f .claude/.artifacts/triage.json ]; then
        scripts/memory_bridge.sh store "intelligence/patterns" "qa_failures" "$(cat .claude/.artifacts/triage.json)" '{"learning": true}'
      fi
    fi
    
    # Synchronize memory for next pipeline run
    scripts/memory_bridge.sh sync
```