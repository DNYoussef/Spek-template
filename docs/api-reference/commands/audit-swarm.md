# /audit:swarm Command - Post-Deployment Swarm Auditing

## Purpose
Orchestrate comprehensive post-swarm deployment auditing to eliminate completion theater and validate agent work quality using the theater-killer agent suite within the SPEK quality framework.

## Usage
```bash
/audit:swarm [--agents <agent-list>] [--phase <spek-phase>] [--evidence-level <level>] [--quality-integration] [--memory-update]
```

## Implementation Strategy

### 1. Swarm Audit Orchestration
Coordinate the three theater-killer agents in sequence:

```yaml
audit_sequence:
  1. reality_checker: Validate end-user functionality and deployment reality
  2. theater_killer: Eliminate completion theater within quality infrastructure  
  3. completion_auditor: Audit agent claims against quality evidence
  4. contextual_loops: Execute remediation cycles for detected issues
  5. evidence_compilation: Generate comprehensive audit report
```

### 2. SPEK Quality Framework Integration
Leverage existing quality infrastructure for audit validation:

```yaml
quality_integration:
  existing_gates:
    - qa_run: "/qa:run --architecture --performance-monitor"
    - conn_scan: "/conn:scan --architecture --detector-pools --enhanced-metrics"
    - sec_scan: "/sec:scan --comprehensive --owasp-top-10" 
    - performance: "/conn:monitor --memory --resources --benchmark"
  
  artifact_analysis:
    - qa_json: Core quality gate results validation
    - connascence_reports: Architectural theater detection
    - security_sarif: Security theater identification
    - coverage_reports: Test theater analysis
    - performance_metrics: Performance claim validation
```

### 3. Agent Coordination Protocol
```javascript
async function orchestrateSwarmAudit(swarmResults, options = {}) {
  const auditConfig = {
    agents: options.agents || ['reality-checker', 'theater-killer', 'completion-auditor'],
    phase: options.phase || 'implement',
    evidenceLevel: options.evidenceLevel || 'comprehensive',
    qualityIntegration: options.qualityIntegration !== false,
    memoryUpdate: options.memoryUpdate !== false
  };
  
  // 1. Initialize unified memory and quality context
  await initializeAuditContext(auditConfig);
  
  // 2. Run comprehensive quality gates first  
  if (auditConfig.qualityIntegration) {
    await executeQualityGates();
  }
  
  // 3. Execute theater-killer agent suite in parallel
  const auditResults = await Promise.all([
    deployAgent('reality-checker', swarmResults, auditConfig),
    deployAgent('theater-killer', swarmResults, auditConfig), 
    deployAgent('completion-auditor', swarmResults, auditConfig)
  ]);
  
  // 4. Execute contextual understanding loops for detected issues
  const remediationResults = await executeContextualLoops(auditResults);
  
  // 5. Generate comprehensive audit evidence package
  const auditReport = await compileAuditEvidence(auditResults, remediationResults);
  
  // 6. Update memory bridge with audit patterns
  if (auditConfig.memoryUpdate) {
    await updateMemoryBridge(auditReport);
  }
  
  return auditReport;
}
```

### 4. Quality Gate Integration Logic
```python
def integrate_with_quality_gates():
    """Execute quality gates before theater detection"""
    quality_results = {}
    
    # Run parallel quality analysis
    quality_tasks = [
        execute_qa_run(),
        execute_conn_scan(), 
        execute_sec_scan(),
        execute_performance_monitoring()
    ]
    
    quality_results = await asyncio.gather(*quality_tasks)
    
    # Prepare quality context for theater detection
    quality_context = {
        'qa_artifacts': load_artifacts('.claude/.artifacts/qa.json'),
        'connascence_data': load_artifacts('.claude/.artifacts/connascence_full.json'),
        'security_findings': load_artifacts('.claude/.artifacts/semgrep.sarif'),
        'performance_metrics': load_artifacts('.claude/.artifacts/performance_monitor.json')
    }
    
    return quality_context
```

## Command Implementation

### Core Execution Flow
```yaml
execution_phases:
  pre_audit:
    - Initialize Claude Flow swarm coordination
    - Load memory bridge for historical patterns
    - Execute comprehensive quality gates
    - Prepare audit context with quality results
  
  audit_execution:
    - Deploy reality-checker agent with end-user validation
    - Deploy theater-killer agent with quality infrastructure analysis
    - Deploy completion-auditor with claims validation
    - Execute contextual understanding loops for detected issues
  
  post_audit:
    - Compile comprehensive evidence package
    - Update memory bridge with new patterns
    - Generate audit report with recommendations
    - Trigger remediation workflows if issues detected
```

### Memory Integration Pattern
```bash
# Initialize unified memory coordination
source scripts/memory_bridge.sh
initialize_memory_router

# Store audit initiation context
audit_context=$(jq -n \
  --arg phase "$SPEK_PHASE" \
  --argjson agents "$AGENT_LIST" \
  --arg timestamp "$(date -Iseconds)" \
  '{
    phase: $phase,
    agents: $agents, 
    timestamp: $timestamp,
    audit_type: "post_swarm_deployment"
  }')

scripts/memory_bridge.sh store "coordination/audit" "session_$(date +%s)" "$audit_context" '{"type": "audit_initiation"}'
```

### Agent Deployment Coordination
```python
def deploy_theater_killer_agents(swarm_results, quality_context):
    """Deploy the three-agent theater detection suite"""
    
    # Prepare shared context for all agents
    shared_context = {
        'swarm_results': swarm_results,
        'quality_context': quality_context,
        'spek_phase': get_current_spek_phase(),
        'memory_bridge': get_memory_bridge_instance()
    }
    
    # Deploy agents with Claude Flow task orchestration
    agent_tasks = {
        'reality_checker': {
            'agent': 'reality-checker',
            'context': {**shared_context, 'focus': 'end_user_validation'},
            'priority': 'high'
        },
        'theater_killer': {
            'agent': 'theater-killer', 
            'context': {**shared_context, 'focus': 'quality_infrastructure_theater'},
            'priority': 'critical'
        },
        'completion_auditor': {
            'agent': 'completion-auditor',
            'context': {**shared_context, 'focus': 'completion_claims_validation'}, 
            'priority': 'high'
        }
    }
    
    return orchestrate_parallel_agents(agent_tasks)
```

## Output Specifications

### Comprehensive Audit Report
```json
{
  "timestamp": "2024-09-08T12:15:00Z",
  "command": "audit-swarm",
  "spek_phase": "implement",
  "audit_session": "swarm-audit-20240908-121500",
  
  "swarm_audit_results": {
    "agents_audited": ["backend-dev", "frontend-dev", "tester"],
    "completion_claims": 12,
    "validated_claims": 8,
    "theater_patterns_detected": 4,
    "quality_violations": 2
  },
  
  "theater_killer_results": {
    "reality_checker": {
      "end_user_validation": "partial_success",
      "deployment_reality": "validated", 
      "functionality_gaps": 2,
      "user_journey_success_rate": 0.75
    },
    "theater_killer": {
      "quality_theater_detected": 3,
      "infrastructure_abuse": 1,
      "theater_patterns_eliminated": 4,
      "quality_gates_strengthened": 2
    },
    "completion_auditor": {
      "completion_claims_validated": 8,
      "evidence_backed_claims": 6,
      "unsupported_claims": 2,
      "completion_confidence": 0.78
    }
  },
  
  "quality_integration": {
    "qa_gates_status": "8/10 passing",
    "connascence_analysis": "architecture_improved",
    "security_findings": "2_medium_resolved",
    "performance_metrics": "baseline_maintained"
  },
  
  "contextual_loops_executed": [
    {
      "issue": "Password reset functionality claimed but not working",
      "remediation": "Fixed endpoint and added integration test",
      "validation": "End-to-end test now passing"
    },
    {
      "issue": "Test coverage theater detected in auth module", 
      "remediation": "Replaced mock tests with real integration tests",
      "validation": "Actual functionality now tested"
    }
  ],
  
  "audit_recommendations": [
    "Block PR until password reset functionality verified",
    "Require integration test evidence for completion claims", 
    "Strengthen quality gates to detect test theater",
    "Add end-user validation to CI/CD pipeline"
  ],
  
  "next_actions": {
    "immediate": [
      "Execute remediation for 2 remaining theater patterns",
      "Validate fixes with reality checker re-audit",
      "Update completion criteria to require evidence"
    ],
    "commit_readiness": "blocked_pending_remediation",
    "estimated_remediation_time": "45 minutes"
  }
}
```

## Integration Points

### SPEK Workflow Integration
```yaml
spek_phase_integration:
  implement:
    - Audit coding agent deployments
    - Validate implementation claims  
    - Verify functional completeness
  
  verify:
    - Audit testing agent results
    - Validate quality gate claims
    - Verify coverage reality
  
  review:
    - Audit review agent findings
    - Validate architectural claims
    - Verify refactoring reality
  
  deliver:
    - Audit delivery preparation
    - Validate production readiness
    - Verify deployment claims
```

### Hooks Integration
```json
{
  "hooks": {
    "postSwarmDeploy": [
      {
        "match": "swarm deploy complete", 
        "cmd": "/audit:swarm --phase $SPEK_PHASE --quality-integration --memory-update",
        "description": "Comprehensive post-swarm audit with theater detection"
      }
    ]
  }
}
```

### Memory Bridge Integration  
```bash
# Store audit results for future pattern recognition
scripts/memory_bridge.sh store "intelligence/audit" "swarm_audit_$(date +%s)" "$audit_results" '{"type": "post_swarm_audit"}'

# Retrieve historical theater patterns for improved detection
historical_patterns=$(scripts/memory_bridge.sh retrieve "intelligence/patterns" "theater_detection" 2>/dev/null || echo '{}')
```

## Success Metrics

### Audit Effectiveness KPIs
- **Theater Detection Rate**: % of completion theater patterns identified and eliminated
- **Reality Validation Success**: % of claims that match actual working functionality  
- **Quality Integration Score**: % of audits leveraging existing quality infrastructure
- **Remediation Success Rate**: % of detected issues successfully resolved

### SPEK Integration Success
- **Workflow Enhancement**: Improved SPEK phase completion reliability
- **Quality Gate Strengthening**: Reduced false positive quality gate passes
- **Agent Accountability**: Improved agent completion claim accuracy
- **Development Velocity**: Faster iteration with reliable completion detection

This audit-swarm command provides the orchestration layer for your comprehensive theater detection system, ensuring that every swarm deployment is thoroughly audited for reality and completeness within your robust SPEK quality framework.