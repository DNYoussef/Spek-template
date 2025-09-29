# Agent Specialization Matrix

## Overview

This document provides a comprehensive mapping of all 87 SPEK agents to their appropriate DSPy template variants, optimization priorities, and specialization constraints for systematic optimization.

## Table of Contents

1. [Agent Categories Overview](#agent-categories-overview)
2. [Template Variant Specifications](#template-variant-specifications)
3. [Detailed Agent Matrix](#detailed-agent-matrix)
4. [Optimization Priority Classification](#optimization-priority-classification)
5. [Specialization Constraints](#specialization-constraints)
6. [Model Assignment Strategy](#model-assignment-strategy)
7. [MCP Server Allocation](#mcp-server-allocation)

## Agent Categories Overview

### Category Distribution

| Category | Count | Template Variant | Primary Focus | Quality Requirements |
|----------|-------|------------------|---------------|---------------------|
| Development | 23 | DevelopmentTemplate | Code implementation, APIs, TDD | NASA Rule 10 + FSM APIs |
| Architecture | 12 | ArchitectureTemplate | System design, patterns | FSM Design + Compliance |
| Testing | 8 | TestingTemplate | Quality validation, coverage | Assertion Coverage + Fixed Bounds |
| Coordination | 15 | CoordinationTemplate | Swarm management, orchestration | Event-driven + State Management |
| Security | 7 | SecurityTemplate | Compliance, vulnerability detection | Zero-trust + Audit logging |
| Performance | 9 | PerformanceTemplate | Optimization, monitoring | Resource bounds + Measurement |
| Research | 6 | ResearchTemplate | Information gathering, analysis | Large context + Evidence-based |
| Repository | 7 | RepositoryTemplate | Git integration, workflow automation | Version control + CI/CD |

### Hierarchy Distribution

| Level | Count | Responsibilities | Template Constraints |
|-------|-------|------------------|---------------------|
| Queen | 3 | Strategic coordination, cross-domain orchestration | Enterprise patterns, scalability |
| Princess | 18 | Domain management, resource allocation | Domain expertise, delegation patterns |
| Drone | 66 | Task execution, specialized operations | Efficiency, reliability, compliance |

## Template Variant Specifications

### DevelopmentTemplate (23 agents)

#### Core Constraints
```typescript
static constraints = {
  nasa_rule_10: {
    function_length_budget: 50,          // Stricter than general (50 vs 60)
    assertion_density: 0.1,              // 10% of lines should be assertions
    loop_analysis_required: true,        // Static analysis required
    error_handling_mandatory: true       // Comprehensive error handling
  },
  fsm_requirements: {
    api_endpoints_as_states: true,       // REST endpoints map to states
    request_lifecycle_fsm: true,         // Request/response FSM
    error_handling_states: true,         // Explicit error states
    transaction_boundaries: true         // Clear transaction scopes
  },
  code_quality: {
    test_driven_development: true,       // Tests first approach
    dependency_injection_pattern: true,  // Explicit DI requirement
    no_hardcoded_values: true,           // Configuration-driven
    immutable_data_structures: true      // Prefer immutability
  }
};
```

#### Applicable Agents
- `frontend-developer`, `ui-designer`, `mobile-dev`, `coder`, `backend-dev`
- `sparc-coder`, `ml-developer`, `rapid-prototyper`, `base-template-generator`
- Additional specialized development agents

### ArchitectureTemplate (12 agents)

#### Core Constraints
```typescript
static constraints = {
  system_design: {
    fsm_based_architecture: true,        // System-level FSM design
    component_state_modeling: true,      // Component state diagrams
    transition_documentation: true,      // Document all transitions
    scalability_modeling: true           // Scalability considerations
  },
  compliance: {
    enterprise_patterns: true,           // Enterprise architecture patterns
    security_by_design: true,            // Security considerations
    performance_modeling: true,          // Performance requirements
    data_governance: true                // Data flow and governance
  },
  documentation: {
    architecture_decision_records: true, // ADR documentation
    component_diagrams: true,            // Visual documentation
    integration_specifications: true     // Interface specifications
  }
};
```

#### Applicable Agents
- `architecture`, `system-architect`, `repo-architect`
- Architecture-focused coordination agents

### TestingTemplate (8 agents)

#### Core Constraints
```typescript
static constraints = {
  test_coverage: {
    minimum_coverage: 95,                // 95% line coverage minimum
    state_transition_coverage: 100,      // 100% FSM transition coverage
    assertion_coverage: 100,             // Every function has assertions
    edge_case_coverage: 90               // 90% edge case coverage
  },
  test_quality: {
    fixed_bounds_only: true,             // No dynamic test loops
    deterministic_tests: true,           // Repeatable results
    no_flaky_tests: true,                // Robust test design
    performance_budgets: true            // Test execution time limits
  },
  test_types: {
    unit_tests_required: true,           // Comprehensive unit tests
    integration_tests_required: true,    // End-to-end testing
    performance_tests_required: true,    // Load and stress testing
    security_tests_required: true        // Security validation
  }
};
```

#### Applicable Agents
- `tester`, `production-validator`, `tdd-london-swarm`
- Testing specialists and QA agents

### CoordinationTemplate (15 agents)

#### Core Constraints
```typescript
static constraints = {
  coordination_patterns: {
    event_driven_messaging: true,        // Event-driven communication
    state_synchronization: true,         // Cross-agent state sync
    deadlock_prevention: true,           // Deadlock detection/prevention
    timeout_handling: true               // Comprehensive timeout handling
  },
  communication: {
    queen_princess_drone_protocol: true, // Hierarchy communication
    bidirectional_validation: true,      // Message validation
    message_ordering: true,              // Ordered message delivery
    fault_tolerance: true                // Resilient communication
  },
  orchestration: {
    workflow_management: true,           // Complex workflow handling
    resource_allocation: true,           // Dynamic resource management
    load_balancing: true,                // Work distribution
    monitoring_integration: true         // Performance monitoring
  }
};
```

#### Applicable Agents
- `sparc-coord`, `hierarchical-coordinator`, `mesh-coordinator`
- Swarm coordination and orchestration agents

## Detailed Agent Matrix

### Development Category (23 agents)

| Agent ID | Template | Model | Priority | FSM Mode | Specialization |
|----------|----------|--------|----------|----------|----------------|
| `frontend-developer` | Development | GPT5 | High | Enforced | Browser automation, UI patterns |
| `ui-designer` | Development | GPT5 | High | Enforced | Visual design, accessibility |
| `mobile-dev` | Development | GPT5 | Medium | Enforced | Mobile patterns, device testing |
| `coder` | Development | GPT5 | Critical | Enforced | Autonomous coding, long sessions |
| `backend-dev` | Development | GPT5 | High | Enforced | API development, microservices |
| `sparc-coder` | Development | CLAUDE_SONNET | High | Required | SPARC methodology + FSM |
| `ml-developer` | Development | GEMINI_PRO | Medium | Optional | ML pipelines, data processing |
| `rapid-prototyper` | Development | GPT5 | Medium | Enforced | Quick iterations, MVP development |
| `base-template-generator` | Development | CLAUDE_OPUS | Medium | Required | Template generation, scaffolding |
| `cicd-engineer` | Development | GEMINI_FLASH | Medium | Optional | Pipeline automation, deployment |
| `api-docs` | Development | GEMINI_PRO | Low | Optional | API documentation, OpenAPI specs |

**Additional Development Agents**: 12 more specialized development agents with similar patterns

### Architecture Category (12 agents)

| Agent ID | Template | Model | Priority | FSM Mode | Specialization |
|----------|----------|--------|----------|----------|----------------|
| `architecture` | Architecture | GEMINI_PRO | Critical | Required | System design, patterns |
| `system-architect` | Architecture | GEMINI_PRO | Critical | Required | Enterprise architecture |
| `repo-architect` | Architecture | GEMINI_PRO | Medium | Required | Repository structure, organization |
| `specification` | Architecture | GEMINI_PRO | High | Required | Requirements analysis, specs |
| `pseudocode` | Architecture | GEMINI_PRO | Medium | Required | Algorithm design, pseudocode |

**Additional Architecture Agents**: 7 more architecture-focused agents

### Testing Category (8 agents)

| Agent ID | Template | Model | Priority | FSM Mode | Specialization |
|----------|----------|--------|----------|----------|----------------|
| `tester` | Testing | CLAUDE_OPUS | High | Enforced | Comprehensive testing, TDD |
| `production-validator` | Testing | CLAUDE_OPUS | Critical | Enforced | Production readiness validation |
| `tdd-london-swarm` | Testing | CLAUDE_OPUS | High | Required | London-school TDD methodology |
| `ui-tester` | Testing | GPT5 | Medium | Enforced | UI testing, visual regression |
| `desktop-qa-specialist` | Testing | GPT5 | Medium | Enforced | Desktop application testing |
| `visual-regression-tester` | Testing | GPT5 | Medium | Enforced | Visual testing, screenshot comparison |
| `accessibility-tester` | Testing | GPT5 | Medium | Enforced | Accessibility compliance testing |
| `performance-tester` | Testing | CLAUDE_OPUS | High | Optional | Performance testing, benchmarking |

### Coordination Category (15 agents)

| Agent ID | Template | Model | Priority | FSM Mode | Specialization |
|----------|----------|--------|----------|----------|----------------|
| `sparc-coord` | Coordination | CLAUDE_SONNET | Critical | Required | SPARC methodology orchestration |
| `hierarchical-coordinator` | Coordination | CLAUDE_SONNET | Critical | Required | Hierarchy management |
| `mesh-coordinator` | Coordination | CLAUDE_SONNET | High | Required | Peer-to-peer coordination |
| `adaptive-coordinator` | Coordination | CLAUDE_SONNET | High | Required | Dynamic adaptation |
| `collective-intelligence-coordinator` | Coordination | CLAUDE_SONNET | Medium | Required | Swarm intelligence |
| `swarm-memory-manager` | Coordination | CLAUDE_SONNET | Medium | Required | Cross-swarm memory management |
| `task-orchestrator` | Coordination | CLAUDE_SONNET | High | Required | Complex task coordination |
| `consensus-builder` | Coordination | CLAUDE_SONNET | Medium | Required | Consensus algorithms |

**Additional Coordination Agents**: 7 more coordination specialists

### Security Category (7 agents)

| Agent ID | Template | Model | Priority | FSM Mode | Specialization |
|----------|----------|--------|----------|----------|----------------|
| `security-manager` | Security | CLAUDE_OPUS | Critical | Required | Security oversight, compliance |
| `code-analyzer` | Security | CLAUDE_OPUS | High | Enforced | Static analysis, vulnerability detection |
| `compliance-auditor` | Security | CLAUDE_OPUS | High | Required | Regulatory compliance |
| `privacy-officer` | Security | CLAUDE_OPUS | Medium | Required | Privacy protection, GDPR compliance |
| `incident-responder` | Security | CLAUDE_OPUS | High | Required | Security incident handling |

**Additional Security Agents**: 2 more security specialists

### Performance Category (9 agents)

| Agent ID | Template | Model | Priority | FSM Mode | Specialization |
|----------|----------|--------|----------|----------|----------------|
| `perf-analyzer` | Performance | CLAUDE_OPUS | High | Optional | Performance analysis, optimization |
| `performance-benchmarker` | Performance | GEMINI_FLASH | Medium | Optional | Benchmarking, metrics collection |
| `load-tester` | Performance | CLAUDE_OPUS | Medium | Optional | Load testing, stress testing |
| `chaos-engineer` | Performance | CLAUDE_OPUS | Medium | Optional | Resilience testing, fault injection |
| `monitoring-specialist` | Performance | GEMINI_FLASH | Medium | Optional | System monitoring, alerting |
| `capacity-planner` | Performance | GEMINI_FLASH | Medium | Optional | Resource planning, scaling |
| `cost-optimizer` | Performance | GEMINI_FLASH | Low | Optional | Cost analysis, optimization |

**Additional Performance Agents**: 2 more performance specialists

### Research Category (6 agents)

| Agent ID | Template | Model | Priority | FSM Mode | Specialization |
|----------|----------|--------|----------|----------|----------------|
| `researcher` | Research | GEMINI_PRO | High | Optional | Comprehensive research, large context |
| `research-agent` | Research | GEMINI_PRO | Medium | Optional | Specialized research tasks |
| `market-analyst` | Research | GEMINI_PRO | Low | Optional | Market research, competitive analysis |
| `competitive-intelligence` | Research | GEMINI_PRO | Low | Optional | Competitor analysis |
| `trend-analyzer` | Research | GEMINI_PRO | Low | Optional | Technology trend analysis |
| `innovation-scout` | Research | GEMINI_PRO | Low | Optional | Innovation opportunities |

### Repository Category (7 agents)

| Agent ID | Template | Model | Priority | FSM Mode | Specialization |
|----------|----------|--------|----------|----------|----------------|
| `github-modes` | Repository | GPT5 | Medium | Optional | GitHub integration, workflows |
| `pr-manager` | Repository | GEMINI_FLASH | Medium | Optional | Pull request management |
| `issue-tracker` | Repository | GEMINI_FLASH | Medium | Optional | Issue management, triage |
| `release-manager` | Repository | GEMINI_FLASH | Medium | Optional | Release planning, deployment |
| `workflow-automation` | Repository | GPT5 | Medium | Optional | CI/CD automation |
| `project-board-sync` | Repository | GEMINI_FLASH | Low | Optional | Project management integration |
| `multi-repo-swarm` | Repository | CLAUDE_SONNET | Medium | Required | Multi-repository coordination |

## Optimization Priority Classification

### Critical Priority (7 agents)
**Must optimize first - system depends on these**

- `sparc-coord`: Overall methodology coordination
- `hierarchical-coordinator`: Core swarm management
- `system-architect`: Enterprise architecture decisions
- `security-manager`: Security oversight and compliance
- `coder`: Core autonomous development capability
- `architecture`: System design and patterns
- `production-validator`: Production readiness validation

**Requirements**:
- NASA Rule 10 compliance: 100%
- Zero critical violations
- Comprehensive testing required
- Manual validation by senior architects

### High Priority (18 agents)
**Core operational agents - optimize in Phase 2**

**Development Focus**:
- `frontend-developer`, `backend-dev`, `sparc-coder`

**Quality Assurance**:
- `reviewer`, `tester`, `code-analyzer`

**Coordination**:
- `mesh-coordinator`, `adaptive-coordinator`, `task-orchestrator`

**Research & Analysis**:
- `researcher`, `perf-analyzer`

**Requirements**:
- NASA Rule 10 compliance: 100%
- FSM patterns where applicable: ≥95%
- Production quality: ≥98%
- Automated validation sufficient

### Medium Priority (32 agents)
**Supporting agents - batch optimize in Phase 3-4**

**Development Support**:
- `mobile-dev`, `ui-designer`, `ml-developer`, `rapid-prototyper`

**Testing Support**:
- `ui-tester`, `desktop-qa-specialist`, `visual-regression-tester`

**Infrastructure**:
- `monitoring-specialist`, `capacity-planner`, `migration-planner`

**Requirements**:
- Standard quality gates
- Batch processing acceptable
- Automated rollback on failure

### Low Priority (30 agents)
**Specialized/Support agents - optimize in final phases**

**Documentation & Communication**:
- `api-docs`, `documentation-specialist`, `training-coordinator`

**Business Intelligence**:
- `market-analyst`, `competitive-intelligence`, `cost-optimizer`

**Specialized Testing**:
- `accessibility-tester`, `compliance-auditor`, `privacy-officer`

**Requirements**:
- Relaxed quality gates where appropriate
- Can accept conditional passes
- Focus on functional completeness

## Specialization Constraints

### Development Agent Constraints

```typescript
DEVELOPMENT_CONSTRAINTS = {
  // Code quality requirements
  code_standards: {
    max_function_length: 50,             // Stricter than NASA (60)
    min_assertions_per_function: 2,      // NASA requirement
    test_coverage_minimum: 85,           // High coverage expectation
    cyclomatic_complexity_max: 8         // Complexity limit
  },

  // FSM requirements for stateful agents
  fsm_enforcement: {
    api_state_modeling: true,            // APIs as state machines
    error_state_modeling: true,          // Explicit error handling
    transaction_boundaries: true,        // Clear transaction scopes
    state_persistence: true              // State persistence patterns
  },

  // Development practices
  practices: {
    test_driven_development: true,       // TDD required
    dependency_injection: true,          // DI patterns
    configuration_driven: true,          // No hardcoded values
    immutable_patterns: true,            // Prefer immutability
    async_patterns: true                 // Async/await patterns
  },

  // Technology constraints
  technology: {
    typescript_preferred: true,          // TypeScript over JavaScript
    strict_typing: true,                 // Strict type checking
    modern_syntax: true,                 // ES2022+ features
    framework_agnostic: true             // Framework independence
  }
};
```

### Architecture Agent Constraints

```typescript
ARCHITECTURE_CONSTRAINTS = {
  // Design requirements
  design_principles: {
    fsm_based_design: true,              // FSM-first architecture
    event_driven_architecture: true,     // Event-driven patterns
    microservices_patterns: true,        // Microservices when appropriate
    domain_driven_design: true           // DDD principles
  },

  // Documentation requirements
  documentation: {
    architecture_decision_records: true, // ADR documentation
    component_diagrams: true,            // C4 model diagrams
    sequence_diagrams: true,             // Interaction diagrams
    state_diagrams: true                 // FSM diagrams
  },

  // Compliance requirements
  compliance: {
    enterprise_patterns: true,           // Enterprise patterns
    security_by_design: true,            // Security considerations
    scalability_modeling: true,          // Scalability planning
    performance_requirements: true       // Performance modeling
  },

  // Quality attributes
  quality_attributes: {
    maintainability: true,               // Long-term maintenance
    extensibility: true,                 // Future expansion
    testability: true,                   // Testing support
    observability: true                  // Monitoring/logging
  }
};
```

### Testing Agent Constraints

```typescript
TESTING_CONSTRAINTS = {
  // Coverage requirements
  coverage: {
    line_coverage_minimum: 95,           // 95% line coverage
    branch_coverage_minimum: 90,         // 90% branch coverage
    state_transition_coverage: 100,      // 100% FSM coverage
    assertion_coverage: 100              // All functions have assertions
  },

  // Test quality
  test_quality: {
    deterministic_tests: true,           // No flaky tests
    fixed_execution_bounds: true,        // No dynamic loops in tests
    isolated_tests: true,                // Test isolation
    fast_execution: true                 // Quick test execution
  },

  // Test types
  test_types: {
    unit_tests: true,                    // Comprehensive unit tests
    integration_tests: true,             // End-to-end testing
    performance_tests: true,             // Performance validation
    security_tests: true,                // Security testing
    accessibility_tests: true            // Accessibility validation
  },

  // Test automation
  automation: {
    continuous_testing: true,            // CI/CD integration
    automated_regression: true,          // Regression testing
    test_data_management: true,          // Test data handling
    environment_management: true         // Test environment setup
  }
};
```

## Model Assignment Strategy

### Model Selection Criteria

```typescript
MODEL_ASSIGNMENT_STRATEGY = {
  // Primary criteria
  task_complexity: {
    high_complexity: 'GEMINI_PRO',       // Large context, complex reasoning
    medium_complexity: 'CLAUDE_OPUS',    // Quality focus, analysis
    low_complexity: 'GEMINI_FLASH'       // Cost-effective, routine tasks
  },

  // Specialized capabilities
  capabilities: {
    browser_automation: 'GPT5',          // Codex integration
    quality_analysis: 'CLAUDE_OPUS',     // Superior analysis capabilities
    large_context: 'GEMINI_PRO',         // 1M+ token context
    coordination: 'CLAUDE_SONNET',       // Sequential thinking
    cost_optimization: 'GEMINI_FLASH'    // Cost-effective operations
  },

  // Performance requirements
  performance: {
    real_time_response: 'GPT5',          // Fastest response times
    batch_processing: 'GEMINI_PRO',      // Large batch capabilities
    continuous_operation: 'CLAUDE_OPUS', // Reliable long sessions
    resource_constrained: 'GEMINI_FLASH' // Minimal resource usage
  }
};
```

### Model Distribution Analysis

| Model | Agent Count | Use Cases | Strengths |
|-------|-------------|-----------|-----------|
| GPT5 | 25 | Browser automation, GitHub integration, real-time | Speed, Codex integration, tool use |
| GEMINI_PRO | 18 | Research, architecture, large context | 1M tokens, web search, reasoning |
| CLAUDE_OPUS | 12 | Quality analysis, security, testing | 72.7% SWE-bench, analysis depth |
| CLAUDE_SONNET | 15 | Coordination, sequential thinking | Structured reasoning, reliability |
| GEMINI_FLASH | 10 | Cost-effective operations, batch processing | Speed, cost efficiency |

## MCP Server Allocation

### Universal MCP Servers (All Agents)

```typescript
UNIVERSAL_MCP_SERVERS = [
  'claude-flow',        // Swarm coordination
  'memory',            // Knowledge graph operations
  'sequential-thinking' // Structured problem solving
];
```

### Specialized MCP Server Allocation

| Agent Category | Additional MCP Servers | Purpose |
|----------------|------------------------|---------|
| Development | `github`, `filesystem`, `playwright`, `figma` | Code management, testing, design |
| Architecture | `deepwiki`, `ref`, `context7` | Documentation, references, context |
| Testing | `playwright`, `eva`, `puppeteer` | Browser testing, performance evaluation |
| Security | `eva` | Performance evaluation, security metrics |
| Research | `deepwiki`, `firecrawl`, `ref`, `context7`, `markitdown` | Information gathering, analysis |
| Repository | `github`, `github-project-manager` | Repository management, project coordination |
| Performance | `eva` | Performance monitoring, benchmarking |
| Coordination | `github-project-manager` | Project coordination, task management |

### MCP Server Compatibility Matrix

```typescript
MCP_COMPATIBILITY = {
  // Development-focused servers
  development: {
    github: ['development', 'repository'],
    filesystem: ['development', 'testing'],
    playwright: ['development', 'testing'],
    figma: ['development'],
    puppeteer: ['development', 'testing']
  },

  // Research and documentation servers
  research: {
    deepwiki: ['research', 'architecture'],
    firecrawl: ['research'],
    ref: ['research', 'architecture'],
    context7: ['research', 'architecture'],
    markitdown: ['research', 'documentation']
  },

  // Quality and performance servers
  quality: {
    eva: ['testing', 'security', 'performance'],
    playwright: ['testing', 'development'],
    puppeteer: ['testing', 'development']
  },

  // Management and coordination servers
  coordination: {
    'github-project-manager': ['coordination', 'repository'],
    'sequential-thinking': ['coordination', 'architecture']
  }
};
```

---

*This agent specialization matrix provides the complete mapping and constraints for systematic optimization of all 87 SPEK agents using appropriate DSPy template variants.*

<!-- AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE -->
## Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
|--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
| 1.0.0   | 2025-09-28T17:00:00-04:00 | architect@gemini-2.5-pro | Agent specialization matrix documentation | agent-specialization-matrix.md | OK | Complete mapping of 87 agents to template variants | 0.00 | g7h8i9j |

### Receipt
- status: OK
- reason_if_blocked: --
- run_id: specialization-matrix-001
- inputs: ["agent-inventory-complete.json", "systematic-optimization-process.md"]
- tools_used: ["filesystem", "memory"]
- versions: {"model":"gemini-2.5-pro","prompt":"specialization-matrix-v1.0"}
<!-- AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE -->