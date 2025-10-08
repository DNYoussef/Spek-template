# DSPy Communication Examples: Queen → Princess Strategic Directives

## Task Definition
Convert high-level strategic objectives into actionable Princess domain assignments with clear resource allocation, quality gates, and success metrics. Optimize for strategic clarity, domain expertise routing, and measurable outcomes.

## I/O Example 1 - Development Domain: Authentication System

### INPUT
```json
{
  "strategic_objective": "Implement user authentication system with enterprise-grade security",
  "business_context": "Customer security audit required for enterprise contracts",
  "priority": "critical",
  "timeline": "2 weeks",
  "resource_constraints": {
    "developers": 3,
    "tech_stack": "existing (Node.js, PostgreSQL)",
    "budget": "existing_resources_only"
  },
  "quality_requirements": [
    "NASA POT10 compliance",
    "zero critical security vulnerabilities",
    "enterprise audit readiness"
  ],
  "success_criteria": {
    "authentication_success_rate": ">=99.5%",
    "response_time": "<=200ms",
    "concurrent_users": ">=1000"
  }
}
```

### OUTPUT
```json
{
  "domain": "development",
  "princess_assignment": {
    "primary_directive": "Lead implementation of OAuth2 + JWT authentication system with enterprise security controls",
    "domain_expertise": "backend_security_authentication",
    "strategic_priority": "critical"
  },
  "resource_allocation": {
    "assigned_agents": ["backend-dev", "security-manager", "tester"],
    "timeline_breakdown": {
      "week_1": "OAuth2 service + JWT implementation",
      "week_2": "Security hardening + enterprise compliance"
    },
    "infrastructure": ["existing_postgres", "redis_session_store"]
  },
  "quality_gates": [
    {
      "type": "security_scan",
      "tool": "semgrep",
      "threshold": "zero_critical_high",
      "checkpoint": "day_5"
    },
    {
      "type": "nasa_compliance",
      "threshold": ">=92%",
      "checkpoint": "day_10"
    },
    {
      "type": "load_testing",
      "threshold": "1000_concurrent_users",
      "checkpoint": "day_12"
    }
  ],
  "deliverables": [
    {
      "name": "auth_service",
      "type": "microservice",
      "evidence": ["deployed_endpoint", "api_documentation", "test_coverage_>=80%"]
    },
    {
      "name": "security_audit_report",
      "type": "compliance_documentation",
      "evidence": ["vulnerability_scan_results", "nasa_compliance_scorecard"]
    },
    {
      "name": "integration_tests",
      "type": "validation_suite",
      "evidence": ["e2e_test_results", "performance_benchmarks"]
    }
  ],
  "success_metrics": {
    "authentication_success_rate": ">=99.5%",
    "response_time_p95": "<=200ms",
    "concurrent_user_capacity": ">=1000",
    "security_score": ">=95%"
  },
  "escalation_triggers": [
    "security_scan_failure",
    "performance_threshold_miss",
    "timeline_deviation_>20%"
  ]
}
```

## I/O Example 2 - Quality Domain: CI/CD Pipeline Enhancement

### INPUT
```json
{
  "strategic_objective": "Establish automated quality gates for 99.9% deployment reliability",
  "business_context": "Production incidents cost $50k per hour, need zero-downtime deployments",
  "priority": "high",
  "timeline": "3 weeks",
  "resource_constraints": {
    "infrastructure_budget": "$2000/month",
    "existing_tools": ["GitHub Actions", "Docker", "AWS"],
    "compliance_requirements": ["SOC2", "NASA POT10"]
  },
  "quality_requirements": [
    "zero deployment failures",
    "automated rollback capability",
    "comprehensive monitoring"
  ],
  "success_criteria": {
    "deployment_success_rate": ">=99.9%",
    "rollback_time": "<=60_seconds",
    "false_positive_rate": "<=1%"
  }
}
```

### OUTPUT
```json
{
  "domain": "quality",
  "princess_assignment": {
    "primary_directive": "Design and implement comprehensive CI/CD quality gate system with automated rollback",
    "domain_expertise": "cicd_quality_automation",
    "strategic_priority": "high"
  },
  "resource_allocation": {
    "assigned_agents": ["cicd-engineer", "production-validator", "security-manager"],
    "infrastructure_allocation": {
      "github_actions_runners": "4_concurrent",
      "aws_resources": ["ECS", "RDS", "CloudWatch"],
      "monitoring_stack": ["DataDog", "GitHub_Insights"]
    },
    "timeline_breakdown": {
      "week_1": "Quality gate design + basic pipeline",
      "week_2": "Advanced testing + monitoring integration",
      "week_3": "Automated rollback + compliance validation"
    }
  },
  "quality_gates": [
    {
      "type": "pre_deployment",
      "gates": ["unit_tests_>=90%", "integration_tests_pass", "security_scan_clean"],
      "blocking": true
    },
    {
      "type": "canary_deployment",
      "metrics": ["error_rate_<0.1%", "response_time_<200ms", "throughput_maintained"],
      "duration": "10_minutes"
    },
    {
      "type": "full_deployment",
      "monitors": ["health_checks", "business_metrics", "user_satisfaction"],
      "rollback_triggers": ["error_rate_>0.5%", "latency_>500ms"]
    }
  ],
  "deliverables": [
    {
      "name": "cicd_pipeline",
      "type": "automation_system",
      "evidence": ["github_workflows", "deployment_metrics", "rollback_tests"]
    },
    {
      "name": "monitoring_dashboard",
      "type": "observability_system",
      "evidence": ["real_time_metrics", "alert_configurations", "sla_tracking"]
    },
    {
      "name": "compliance_framework",
      "type": "governance_system",
      "evidence": ["audit_logs", "approval_workflows", "policy_enforcement"]
    }
  ],
  "success_metrics": {
    "deployment_success_rate": ">=99.9%",
    "mean_time_to_rollback": "<=60_seconds",
    "false_positive_alert_rate": "<=1%",
    "compliance_score": ">=95%"
  },
  "escalation_triggers": [
    "deployment_failure",
    "rollback_mechanism_failure",
    "compliance_violation",
    "sla_breach"
  ]
}
```

## I/O Example 3 - Memory Domain: Knowledge Graph Optimization

### INPUT
```json
{
  "strategic_objective": "Optimize cross-agent knowledge sharing for 40% faster problem resolution",
  "business_context": "Agents repeatedly rediscover solutions, wasting compute resources",
  "priority": "medium",
  "timeline": "4 weeks",
  "resource_constraints": {
    "memory_budget": "16GB_persistent_storage",
    "compute_allocation": "moderate",
    "integration_complexity": "high"
  },
  "quality_requirements": [
    "knowledge_freshness_validation",
    "context_relevance_scoring",
    "memory_degradation_prevention"
  ],
  "success_criteria": {
    "knowledge_retrieval_time": "<=100ms",
    "context_relevance_score": ">=85%",
    "memory_utilization_efficiency": ">=80%"
  }
}
```

### OUTPUT
```json
{
  "domain": "memory",
  "princess_assignment": {
    "primary_directive": "Architect intelligent knowledge graph system with context-aware retrieval and automatic knowledge decay management",
    "domain_expertise": "knowledge_graphs_context_dna",
    "strategic_priority": "medium"
  },
  "resource_allocation": {
    "assigned_agents": ["swarm-memory-manager", "context-analyzer", "performance-optimizer"],
    "memory_architecture": {
      "persistent_store": "16GB_knowledge_graph",
      "cache_layers": ["L1_agent_local", "L2_domain_shared", "L3_global"],
      "indexing_strategy": "vector_embeddings_semantic_search"
    },
    "timeline_breakdown": {
      "week_1": "Knowledge graph schema + basic storage",
      "week_2": "Context DNA implementation + relevance scoring",
      "week_3": "Cross-agent integration + performance optimization",
      "week_4": "Memory decay algorithms + quality validation"
    }
  },
  "quality_gates": [
    {
      "type": "knowledge_quality",
      "metrics": ["freshness_score_>=90%", "accuracy_validation", "duplicate_detection"],
      "checkpoint": "week_2"
    },
    {
      "type": "retrieval_performance",
      "metrics": ["query_latency_<=100ms", "relevance_score_>=85%", "recall_rate_>=95%"],
      "checkpoint": "week_3"
    },
    {
      "type": "integration_validation",
      "metrics": ["cross_agent_consistency", "memory_efficiency_>=80%", "degradation_prevention"],
      "checkpoint": "week_4"
    }
  ],
  "deliverables": [
    {
      "name": "knowledge_graph_system",
      "type": "memory_infrastructure",
      "evidence": ["graph_schema", "crud_operations", "performance_benchmarks"]
    },
    {
      "name": "context_dna_engine",
      "type": "intelligence_system",
      "evidence": ["relevance_algorithms", "context_scoring", "decay_management"]
    },
    {
      "name": "agent_integration_layer",
      "type": "coordination_system",
      "evidence": ["api_endpoints", "cross_agent_protocols", "consistency_guarantees"]
    }
  ],
  "success_metrics": {
    "average_query_latency": "<=100ms",
    "context_relevance_score": ">=85%",
    "memory_utilization_efficiency": ">=80%",
    "knowledge_freshness": ">=90%"
  },
  "escalation_triggers": [
    "memory_corruption_detected",
    "performance_degradation_>20%",
    "cross_agent_inconsistency",
    "knowledge_decay_rate_>10%_per_week"
  ]
}
```

## Scoring Rubric Framework

### Primary Scoring Criteria

| Criterion | Weight | Measurement Method | Target Score | Quality Gate |
|-----------|---------|-------------------|--------------|--------------|
| **Strategic Clarity** | 25% | Objective comprehensibility (1-10) | ≥9 | CRITICAL |
| **Actionability** | 30% | Specific tasks identifiable + measurable (1-10) | ≥8 | CRITICAL |
| **Resource Alignment** | 15% | Resources match constraints + timeline realistic (1-10) | ≥8 | HIGH |
| **Quality Integration** | 20% | Quality gates properly defined + measurable (1-10) | ≥9 | CRITICAL |
| **Success Metrics** | 10% | Quantifiable success criteria defined (1-10) | ≥9 | HIGH |

**Overall Target Score**: ≥8.5/10

### Detailed Scoring Guidelines

#### Strategic Clarity (25% weight)
- **9-10**: Objective is crystal clear, domain alignment obvious, strategic context well-defined
- **7-8**: Objective clear with minor ambiguities, good domain fit
- **5-6**: Objective somewhat clear but missing context or domain alignment unclear
- **1-4**: Objective vague, poor domain alignment, strategic context missing

#### Actionability (30% weight)
- **9-10**: All tasks specific, measurable, with clear deliverables and timelines
- **7-8**: Most tasks specific with good deliverables, minor timeline issues
- **5-6**: Some tasks specific but deliverables or timelines unclear
- **1-4**: Tasks vague, deliverables poorly defined, timelines unrealistic

#### Resource Alignment (15% weight)
- **9-10**: Perfect resource allocation matching constraints and timeline
- **7-8**: Good resource allocation with minor optimization opportunities
- **5-6**: Adequate resource allocation but some misalignment
- **1-4**: Poor resource allocation, ignores constraints or unrealistic

#### Quality Integration (20% weight)
- **9-10**: Complete quality gates with measurable thresholds and checkpoints
- **7-8**: Good quality gates with mostly measurable criteria
- **5-6**: Basic quality gates but some thresholds unclear
- **1-4**: Poor or missing quality gates, unmeasurable criteria

#### Success Metrics (10% weight)
- **9-10**: All success criteria quantifiable with clear measurement methods
- **7-8**: Most success criteria quantifiable with good measurement
- **5-6**: Some success criteria quantifiable but others vague
- **1-4**: Success criteria poorly defined or unmeasurable

### DSPy Optimization Targets

1. **Consistency**: All outputs follow identical JSON schema structure
2. **Completeness**: Every required field populated with realistic values
3. **Measurability**: All thresholds and criteria numerically defined
4. **Realism**: Examples reflect genuine enterprise scenarios
5. **Integration**: Quality gates align with existing SPEK theater detection

### Theater Detection Integration

Queen→Princess directives must include theater detection markers:
- **Evidence Requirements**: All deliverables specify concrete evidence
- **Measurement Precision**: Numeric thresholds for all quality criteria
- **Validation Checkpoints**: Specific dates/milestones for verification
- **Escalation Triggers**: Clear conditions requiring Queen intervention

This ensures all strategic directives produce measurable, evidence-based outcomes resistant to performance theater.

## Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
|--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
| 1.0.0   | 2025-09-28T15:42:01-04:00 | dspy-specialist@sonnet-4 | Initial DSPy Queen→Princess examples with 3 production scenarios | queen-princess-examples.md | OK | Enterprise-realistic examples with comprehensive scoring rubric | 0.00 | a7b3c4d |

### Receipt
- status: OK
- reason_if_blocked: --
- run_id: queen-princess-dspy-examples-001
- inputs: ["strategic_objectives", "spek_methodology", "dspy_framework"]
- tools_used: ["filesystem", "sequential-thinking"]
- versions: {"model":"sonnet-4","prompt":"dspy-communication-optimization-v1"}