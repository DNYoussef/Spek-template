# /conn:arch - Advanced Architectural Analysis Command

## Overview
Advanced architectural analysis leveraging the full analyzer engine with MCP integration for comprehensive system design assessment, detector pool optimization, and AI-powered architectural guidance.

## Command Syntax
```bash
/conn:arch [--hotspots] [--detector-pool] [--cross-component] [--recommendations] [--memory-update] [--gemini-context] [--sequential-thinking]
```

## Core Features

### Architectural Analysis Engine
- **Detector Pool**: Reusable detector instances for performance optimization
- **Enhanced Metrics**: Comprehensive quality scoring with 35+ NASA compliance files  
- **Smart Recommendations**: AI-powered architectural guidance and refactoring priorities
- **Cross-Component Analysis**: Multi-file dependency analysis and coupling detection
- **Integration Points**: Architecture violation hotspot identification

### MCP Integration
- **Sequential Thinking**: Structured architectural reasoning using Sequential Thinking MCP
- **Memory Integration**: Persistent architectural patterns and learning with Memory MCP
- **Gemini Integration**: Large-context architectural analysis with systematic thinking

## Command Flags

### Core Analysis Flags
- **`--hotspots`**: Identify architectural hotspots and coupling concentration points
- **`--detector-pool`**: Use performance-optimized detector instances for faster analysis
- **`--cross-component`**: Enable cross-component dependency analysis and coupling detection
- **`--recommendations`**: Generate AI-powered architectural refactoring recommendations

### MCP Integration Flags  
- **`--memory-update`**: Update Memory MCP with architectural patterns and insights
- **`--gemini-context`**: Use Gemini's large context window for comprehensive architectural analysis
- **`--sequential-thinking`**: Apply structured architectural reasoning through Sequential Thinking MCP

## Implementation Pattern

### Phase 1: Initialize Analysis with Sequential Thinking
```bash
# 1. Start structured architectural analysis
mcp_sequential_thinking.start_analysis("architectural_assessment")

# 2. Structured reasoning through architectural phases
mcp_sequential_thinking.analyze_step("Component Coupling Analysis")
mcp_sequential_thinking.analyze_step("Hotspot Identification") 
mcp_sequential_thinking.analyze_step("Cross-Component Dependencies")
mcp_sequential_thinking.analyze_step("Performance Optimization Opportunities")
mcp_sequential_thinking.analyze_step("Architectural Recommendations")

# 3. Synthesize architectural findings
mcp_sequential_thinking.synthesize_results()
```

### Phase 2: Execute Architecture Analysis
```python
# Enhanced architectural analysis execution
python -m analyzer.architecture \
  --path . \
  --detector-pool-optimization \
  --hotspot-detection \
  --cross-component-analysis \
  --enhanced-metrics \
  --smart-recommendations \
  --performance-monitoring \
  --sequential-thinking-integration \
  --gemini-context-analysis \
  --output .claude/.artifacts/architecture_analysis.json
```

### Phase 3: Unified Memory and Gemini Integration
```bash
# Load unified memory bridge for intelligent routing
source "${SCRIPT_DIR}/memory_bridge.sh"

# Store architectural patterns with cross-system availability
unified_memory_store "intelligence/architecture" "system_design" "$analysis_results" '{"type": "architectural_patterns", "scope": "system_wide"}'

# Store coupling insights for agent coordination
unified_memory_store "intelligence/architecture" "coupling_hotspots" "$hotspot_data" '{"type": "coupling_analysis", "priority": "high"}'

# Store performance patterns with optimization context
unified_memory_store "intelligence/performance" "detector_optimization" "$optimization_metrics" '{"type": "detector_pools", "optimization": true}'

# Store architectural recommendations for cross-agent sharing
unified_memory_store "intelligence/recommendations" "architectural" "$smart_recommendations" '{"type": "architectural_guidance", "impact": "high"}'

# Retrieve historical architectural patterns for Gemini context
historical_patterns=$(unified_memory_retrieve "intelligence/architecture" "historical_patterns" 2>/dev/null || echo '{}')

# Gemini large-context analysis with unified memory context
gemini_cli.analyze_architecture \
  --full-context \
  --architectural-patterns \
  --dependency-mapping \
  --optimization-recommendations \
  --historical-context "$historical_patterns"

# Store Gemini insights back to unified memory
unified_memory_store "intelligence/gemini" "architectural_analysis" "$gemini_results" '{"type": "gemini_insights", "context_size": "large"}'

# Synchronize for immediate agent availability
sync_memory_systems
```

## Output Format

### Comprehensive Architectural Analysis JSON
```json
{
  "timestamp": "2024-09-08T12:15:00Z",
  "analysis_version": "2.0.0-architecture",
  "sequential_thinking_enabled": true,
  "gemini_context_enabled": true,
  
  "system_overview": {
    "total_components": 42,
    "coupling_score": 0.34,
    "architectural_health": 0.78,
    "technical_debt_index": 0.23,
    "maintainability_score": 87.2
  },
  
  "detector_pool_performance": {
    "optimization_level": "high",
    "performance_improvement": "43%",
    "cache_hit_rate": 0.91,
    "detector_instances": 12,
    "analysis_speedup": "2.1x"
  },
  
  "architectural_hotspots": [
    {
      "component": "auth.service",
      "coupling_score": 0.87,
      "dependencies_in": 15,
      "dependencies_out": 8,
      "hotspot_type": "coupling_concentration",
      "severity": "high",
      "refactor_priority": "critical",
      "estimated_effort": "8-12 hours"
    },
    {
      "component": "database.connection",
      "coupling_score": 0.72,
      "dependencies_in": 12,
      "dependencies_out": 3,
      "hotspot_type": "dependency_magnet",
      "severity": "medium",
      "refactor_priority": "high",
      "estimated_effort": "4-6 hours"
    }
  ],
  
  "cross_component_analysis": {
    "high_coupling_pairs": [
      {
        "components": ["auth.service", "user.repository"],
        "coupling_type": "CoE",
        "coupling_strength": 0.89,
        "recommendation": "Extract interface to reduce execution coupling"
      }
    ],
    "dependency_cycles": [
      {
        "cycle": ["auth -> user -> profile -> auth"],
        "impact": "high",
        "recommendation": "Break cycle using dependency inversion"
      }
    ],
    "integration_points": [
      {
        "interface": "IAuthService",
        "implementations": 3,
        "coupling_reduction": "23%",
        "recommendation": "Consolidate implementations"
      }
    ]
  },
  
  "smart_recommendations": [
    {
      "priority": "critical",
      "category": "coupling_reduction",
      "target": "auth.service",
      "issue": "High coupling concentration detected",
      "solution": "Extract IAuthService interface, apply dependency injection pattern",
      "architectural_benefit": "Reduces coupling by 23%, improves testability",
      "implementation_steps": [
        "Define IAuthService interface",
        "Refactor AuthService to implement interface", 
        "Update dependent components to use interface",
        "Add dependency injection configuration"
      ],
      "estimated_effort": "8-12 hours",
      "success_probability": 0.92,
      "maintenance_benefit": "High"
    }
  ],
  
  "sequential_thinking_analysis": {
    "reasoning_steps": [
      "Component Analysis: 42 components identified with varied coupling levels",
      "Hotspot Detection: 3 critical hotspots requiring immediate attention",
      "Cross-Component Review: 2 dependency cycles and 5 high-coupling pairs found",
      "Performance Assessment: Detector pools providing 43% performance improvement",
      "Recommendation Generation: 8 architectural improvements with high success probability"
    ],
    "final_assessment": "Architecture shows good overall health with specific hotspots requiring refactoring"
  },
  
  "gemini_context_analysis": {
    "full_context_processed": true,
    "context_size": "2.3M tokens",
    "architectural_patterns_identified": [
      "Repository Pattern (well implemented)",
      "Dependency Injection (partial implementation)",
      "Service Layer (needs refactoring)"
    ],
    "large_scale_insights": "System follows good separation of concerns but requires interface extraction for better testability"
  },
  
  "memory_integration": {
    "patterns_learned": 7,
    "architectural_insights_stored": 12,
    "historical_context": "Architecture quality improving over 60 days",
    "predictive_modeling": "Implementing recommendations will improve health score to 0.89"
  },
  
  "performance_metrics": {
    "analysis_duration_ms": 3240,
    "memory_peak_mb": 189,
    "detector_pool_efficiency": 0.87,
    "cache_optimization": "enabled",
    "gemini_processing_time_ms": 1850
  }
}
```

## Usage Examples

### Basic Architectural Analysis
```bash
/conn:arch --hotspots --detector-pool
```

### Comprehensive Analysis with MCP Integration
```bash
/conn:arch \
  --hotspots \
  --detector-pool \
  --cross-component \
  --recommendations \
  --sequential-thinking \
  --memory-update \
  --gemini-context
```

### Targeted Hotspot Analysis
```bash
/conn:arch --hotspots --recommendations --cross-component
```

## CI/CD Integration

### GitHub Actions Workflow
```yaml
- name: Architectural Analysis
  run: |
    /conn:arch \
      --hotspots \
      --detector-pool \
      --cross-component \
      --recommendations \
      --sequential-thinking
    
    # Check architectural thresholds
    ARCH_SCORE=$(jq -r '.system_overview.architectural_health' .claude/.artifacts/architecture_analysis.json)
    if (( $(echo "$ARCH_SCORE < 0.75" | bc -l) )); then
      echo "::error::Architectural health below threshold: $ARCH_SCORE"
      exit 1
    fi
```

### Quality Gates Integration
```bash
# Architecture quality gates
COUPLING_SCORE=$(jq -r '.system_overview.coupling_score' architecture_analysis.json)
HOTSPOT_COUNT=$(jq -r '.architectural_hotspots | length' architecture_analysis.json)

if (( $(echo "$COUPLING_SCORE > 0.5" | bc -l) )); then
  echo "::warning::High coupling detected: $COUPLING_SCORE"
fi

if [ "$HOTSPOT_COUNT" -gt 5 ]; then
  echo "::warning::Too many architectural hotspots: $HOTSPOT_COUNT"
fi
```

## Benefits

### Performance Benefits
- **Detector Pool Optimization**: 40-50% faster analysis through reusable detector instances
- **Cache Intelligence**: Smart caching reduces repeated analysis overhead
- **Parallel Processing**: Multi-threaded analysis for large codebases

### Architectural Insights
- **Hotspot Identification**: Pinpoint coupling concentration areas requiring refactoring
- **Cross-Component Analysis**: Understand system-wide dependencies and integration points
- **Smart Recommendations**: AI-powered guidance for architectural improvements

### MCP Integration Benefits
- **Sequential Thinking**: Systematic architectural reasoning ensures comprehensive analysis
- **Memory Learning**: Architectural patterns improve over time with persistent learning
- **Gemini Context**: Large-context analysis for complex architectural assessment

## Integration with Existing Commands

### Enhanced Quality Pipeline
```bash
# Combined quality and architectural analysis
/qa:run --architecture && /conn:arch --recommendations --memory-update
```

### Failure Analysis Integration  
```bash
# Architecture-aware failure routing
/qa:analyze "$(cat failures.json)" --architecture-context
/conn:arch --hotspots --cross-component # Deep architectural analysis
```

This command provides comprehensive architectural analysis capabilities, making the sophisticated 6-file architecture module accessible through familiar CLI patterns while integrating with MCP services for enhanced intelligence and learning.