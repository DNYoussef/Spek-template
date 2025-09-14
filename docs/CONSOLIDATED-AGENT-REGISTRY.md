# Consolidated Agent Registry - SPEK Pipeline Organization

## Standardized Agent Template

All agents follow this unified template structure:

```yaml
---
name: <agent_name>
type: <agent_type>
phase: <spek_phase>
category: <functional_category>
description: <brief_description>
capabilities:
  - <capability_1>
  - <capability_2>
priority: <high|medium|low>
tools_required:
  - <tool_1>
  - <tool_2>
mcp_servers:
  - <mcp_server_1>
  - <mcp_server_2>
hooks:
  pre: |
    echo "[PHASE] <phase> agent <name> initiated"
    memory_store "<phase>_start_$(date +%s)" "Task: $TASK"
  post: |
    echo "[OK] <phase> complete"
    memory_store "<phase>_complete_$(date +%s)" "Results stored"
quality_gates:
  - <gate_1>
  - <gate_2>
artifact_contracts:
  input: <input_format>
  output: <output_format>
---

# Agent Prompt Template

## Identity
You are the <agent_name> agent in the SPEK pipeline, specializing in <specialization>.

## Mission
<primary_mission_statement>

## SPEK Phase Integration
- **Phase**: <phase_name>
- **Upstream Dependencies**: <dependencies>
- **Downstream Deliverables**: <deliverables>

## Core Responsibilities
1. <responsibility_1>
2. <responsibility_2>
3. <responsibility_3>

## Quality Policy (CTQs)
- NASA PoT structural safety compliance
- Security: Zero HIGH/CRITICAL findings
- Testing: Coverage >= baseline on changed lines
- Size: Micro edits <= 25 LOC, <= 2 files

## Tool Routing
- <tool_1>: <usage>
- <tool_2>: <usage>

## Operating Rules
- Validate tollgates before proceeding
- Emit STRICT JSON artifacts only
- Escalate if budgets exceeded
- No secret leakage

## Communication Protocol
1. Announce INTENT, INPUTS, TOOLS
2. Validate DoR/tollgates
3. Produce declared artifacts (JSON only)
4. Notify downstream partners
5. Escalate if needed
```

## Agent Registry by SPEK Phase

### Phase 1: SPECIFICATION

#### 1. specification
- **Type**: analyst
- **Category**: requirements
- **Capabilities**: requirements_gathering, constraint_analysis, acceptance_criteria
- **Tools**: Read, Write, TodoWrite
- **MCP**: memory, sequential-thinking
- **Output**: spec.json

#### 2. researcher
- **Type**: analyst
- **Category**: discovery
- **Capabilities**: technical_research, pattern_analysis, solution_discovery
- **Tools**: WebSearch, WebFetch, Read
- **MCP**: deepwiki, ref, firecrawl
- **Output**: research_findings.json

#### 3. researcher-gemini
- **Type**: analyst
- **Category**: deep_research
- **Capabilities**: large_context_analysis, cross_repository_research
- **Tools**: Read, Grep, Glob
- **MCP**: context7, sequential-thinking
- **Output**: deep_research.json

### Phase 2: RESEARCH

#### 4. system-architect
- **Type**: architect
- **Category**: design
- **Capabilities**: system_design, pattern_selection, architecture_decisions
- **Tools**: Read, Write, MultiEdit
- **MCP**: memory, context7
- **Output**: architecture.json

#### 5. code-analyzer
- **Type**: analyst
- **Category**: quality
- **Capabilities**: code_quality_analysis, connascence_detection, smell_detection
- **Tools**: Read, Grep, Bash
- **MCP**: eva, memory
- **Output**: analysis_report.json

#### 6. security-manager
- **Type**: security
- **Category**: compliance
- **Capabilities**: security_scanning, vulnerability_assessment, compliance_check
- **Tools**: Bash, Read, Write
- **MCP**: github, memory
- **Output**: security_report.json

### Phase 3: PLANNING

#### 7. planner
- **Type**: coordinator
- **Category**: orchestration
- **Capabilities**: task_breakdown, dependency_mapping, resource_allocation
- **Tools**: TodoWrite, Write, Read
- **MCP**: memory, plane
- **Output**: plan.json

#### 8. sparc-coord
- **Type**: coordinator
- **Category**: methodology
- **Capabilities**: phase_coordination, quality_gates, workflow_management
- **Tools**: TodoWrite, Bash, Write
- **MCP**: memory, sequential-thinking
- **Output**: coordination.json

#### 9. task-orchestrator
- **Type**: coordinator
- **Category**: execution
- **Capabilities**: task_distribution, parallel_execution, progress_tracking
- **Tools**: Task, TodoWrite, Bash
- **MCP**: memory, github
- **Output**: orchestration.json

### Phase 4: EXECUTION

#### 10. coder
- **Type**: developer
- **Category**: implementation
- **Capabilities**: code_writing, refactoring, optimization
- **Tools**: Write, Edit, MultiEdit
- **MCP**: github, markitdown
- **Output**: implementation.json

#### 11. coder-codex
- **Type**: developer
- **Category**: micro_edits
- **Capabilities**: bounded_edits, sandbox_testing, micro_operations
- **Tools**: Edit, Bash, Read
- **MCP**: codex, memory
- **Output**: codex_summary.json

#### 12. backend-dev
- **Type**: developer
- **Category**: backend
- **Capabilities**: api_development, database_design, service_implementation
- **Tools**: Write, MultiEdit, Bash
- **MCP**: github, postgres
- **Output**: backend_impl.json

#### 13. mobile-dev
- **Type**: developer
- **Category**: mobile
- **Capabilities**: react_native, ios_android, mobile_optimization
- **Tools**: Write, MultiEdit, Bash
- **MCP**: github, memory
- **Output**: mobile_impl.json

#### 14. ml-developer
- **Type**: developer
- **Category**: machine_learning
- **Capabilities**: model_development, training, deployment
- **Tools**: Write, NotebookEdit, Bash
- **MCP**: memory, github
- **Output**: ml_model.json

#### 15. tester
- **Type**: quality
- **Category**: testing
- **Capabilities**: test_writing, test_execution, coverage_analysis
- **Tools**: Write, Bash, Read
- **MCP**: playwright, eva
- **Output**: test_results.json

#### 16. tdd-london-swarm
- **Type**: quality
- **Category**: tdd
- **Capabilities**: mock_driven_development, test_first, london_school_tdd
- **Tools**: Write, MultiEdit, Bash
- **MCP**: memory, github
- **Output**: tdd_results.json

#### 17. production-validator
- **Type**: quality
- **Category**: validation
- **Capabilities**: production_readiness, deployment_validation, smoke_testing
- **Tools**: Bash, Read, Write
- **MCP**: playwright, eva, github
- **Output**: validation_report.json

### Phase 5: KNOWLEDGE

#### 18. reviewer
- **Type**: quality
- **Category**: review
- **Capabilities**: code_review, quality_assessment, improvement_suggestions
- **Tools**: Read, Edit, Write
- **MCP**: github, memory
- **Output**: review_report.json

#### 19. fresh-eyes-codex
- **Type**: quality
- **Category**: pre_mortem
- **Capabilities**: risk_analysis, implementation_risks, pre_mortem_analysis
- **Tools**: Read, Write, TodoWrite
- **MCP**: sequential-thinking, memory
- **Output**: premortem.json

#### 20. fresh-eyes-gemini
- **Type**: quality
- **Category**: pre_mortem
- **Capabilities**: large_context_premortem, cross_cutting_risks
- **Tools**: Read, Grep, Write
- **MCP**: context7, sequential-thinking
- **Output**: premortem_gemini.json

#### 21. memory-coordinator
- **Type**: infrastructure
- **Category**: persistence
- **Capabilities**: memory_management, cross_session_state, knowledge_retention
- **Tools**: Read, Write, Bash
- **MCP**: memory, github
- **Output**: memory_state.json

#### 22. api-docs
- **Type**: documentation
- **Category**: api
- **Capabilities**: openapi_spec, swagger_docs, api_documentation
- **Tools**: Write, Read, MultiEdit
- **MCP**: markitdown, github
- **Output**: api_docs.json

## Swarm Coordination Agents

### Topology Coordinators

#### 23. hierarchical-coordinator
- **Type**: swarm
- **Category**: topology
- **Capabilities**: queen_led_coordination, worker_delegation, hierarchical_management
- **Tools**: Task, TodoWrite, Bash
- **MCP**: memory, github
- **Output**: hierarchy.json

#### 24. mesh-coordinator
- **Type**: swarm
- **Category**: topology
- **Capabilities**: peer_to_peer, distributed_decision, fault_tolerance
- **Tools**: Task, TodoWrite, Bash
- **MCP**: memory, github
- **Output**: mesh_state.json

#### 25. adaptive-coordinator
- **Type**: swarm
- **Category**: topology
- **Capabilities**: dynamic_topology, self_organizing, real_time_optimization
- **Tools**: Task, TodoWrite, Bash
- **MCP**: memory, eva
- **Output**: adaptive_state.json

## GitHub Integration Agents

#### 26. pr-manager
- **Type**: github
- **Category**: pull_request
- **Capabilities**: pr_creation, review_coordination, merge_management
- **Tools**: Bash, Write, Read
- **MCP**: github, memory
- **Output**: pr_summary.json

#### 27. github-modes
- **Type**: github
- **Category**: workflow
- **Capabilities**: workflow_orchestration, batch_optimization, repo_coordination
- **Tools**: Bash, TodoWrite, Write
- **MCP**: github, memory
- **Output**: github_ops.json

#### 28. workflow-automation
- **Type**: github
- **Category**: cicd
- **Capabilities**: github_actions, pipeline_creation, ci_cd_automation
- **Tools**: Write, Bash, MultiEdit
- **MCP**: github, memory
- **Output**: workflow.json

#### 29. code-review-swarm
- **Type**: github
- **Category**: review
- **Capabilities**: comprehensive_review, static_analysis, quality_checks
- **Tools**: Read, Write, Bash
- **MCP**: github, eva
- **Output**: review_swarm.json

#### 30. issue-tracker
- **Type**: github
- **Category**: project
- **Capabilities**: issue_management, progress_tracking, team_coordination
- **Tools**: Bash, TodoWrite, Write
- **MCP**: github, plane
- **Output**: issues.json

## Performance & Optimization Agents

#### 31. perf-analyzer
- **Type**: optimization
- **Category**: performance
- **Capabilities**: bottleneck_analysis, performance_profiling, optimization_recommendations
- **Tools**: Bash, Read, Write
- **MCP**: eva, memory
- **Output**: perf_analysis.json

#### 32. performance-benchmarker
- **Type**: optimization
- **Category**: benchmarking
- **Capabilities**: benchmark_execution, metrics_collection, comparative_analysis
- **Tools**: Bash, Write, Read
- **MCP**: eva, memory
- **Output**: benchmark.json

## Consensus & Distributed Agents

#### 33. byzantine-coordinator
- **Type**: consensus
- **Category**: byzantine
- **Capabilities**: byzantine_fault_tolerance, malicious_detection, consensus_protocol
- **Tools**: Bash, Write, Read
- **MCP**: memory, github
- **Output**: byzantine.json

#### 34. raft-manager
- **Type**: consensus
- **Category**: raft
- **Capabilities**: leader_election, log_replication, raft_consensus
- **Tools**: Bash, Write, Read
- **MCP**: memory, github
- **Output**: raft_state.json

#### 35. gossip-coordinator
- **Type**: consensus
- **Category**: gossip
- **Capabilities**: gossip_protocol, eventual_consistency, epidemic_algorithms
- **Tools**: Bash, Write, Read
- **MCP**: memory, github
- **Output**: gossip_state.json

#### 36. crdt-synchronizer
- **Type**: consensus
- **Category**: crdt
- **Capabilities**: conflict_free_replication, state_synchronization, crdt_operations
- **Tools**: Bash, Write, Read
- **MCP**: memory, github
- **Output**: crdt_state.json

#### 37. quorum-manager
- **Type**: consensus
- **Category**: quorum
- **Capabilities**: quorum_adjustment, membership_management, voting_protocols
- **Tools**: Bash, Write, Read
- **MCP**: memory, github
- **Output**: quorum.json

## Specialized Development Agents

#### 38. cicd-engineer
- **Type**: devops
- **Category**: pipeline
- **Capabilities**: pipeline_creation, deployment_automation, infrastructure_as_code
- **Tools**: Write, Bash, MultiEdit
- **MCP**: github, memory
- **Output**: cicd_config.json

#### 39. base-template-generator
- **Type**: development
- **Category**: templates
- **Capabilities**: boilerplate_generation, starter_templates, project_scaffolding
- **Tools**: Write, MultiEdit, Bash
- **MCP**: memory, github
- **Output**: template.json

## SPARC Methodology Agents

#### 40. pseudocode
- **Type**: sparc
- **Category**: design
- **Capabilities**: algorithm_design, pseudocode_generation, logic_flow
- **Tools**: Write, Read, TodoWrite
- **MCP**: memory, sequential-thinking
- **Output**: pseudocode.json

#### 41. architecture
- **Type**: sparc
- **Category**: design
- **Capabilities**: architecture_design, component_diagram, system_structure
- **Tools**: Write, Read, MultiEdit
- **MCP**: memory, markitdown
- **Output**: architecture.json

#### 42. refinement
- **Type**: sparc
- **Category**: improvement
- **Capabilities**: iterative_refinement, quality_improvement, optimization
- **Tools**: Edit, MultiEdit, Read
- **MCP**: memory, eva
- **Output**: refinement.json

#### 43. sparc-coder
- **Type**: sparc
- **Category**: implementation
- **Capabilities**: spec_to_code, tdd_practices, sparc_implementation
- **Tools**: Write, MultiEdit, Bash
- **MCP**: github, memory
- **Output**: sparc_impl.json

## Repository & Release Management

#### 44. repo-architect
- **Type**: repository
- **Category**: structure
- **Capabilities**: repo_optimization, multi_repo_management, project_architecture
- **Tools**: Bash, Write, MultiEdit
- **MCP**: github, memory
- **Output**: repo_arch.json

#### 45. release-manager
- **Type**: release
- **Category**: deployment
- **Capabilities**: release_coordination, version_management, deployment_orchestration
- **Tools**: Bash, Write, TodoWrite
- **MCP**: github, memory
- **Output**: release.json

#### 46. release-swarm
- **Type**: release
- **Category**: automation
- **Capabilities**: changelog_generation, multi_platform_deployment, release_orchestration
- **Tools**: Bash, Write, Task
- **MCP**: github, memory
- **Output**: release_swarm.json

## Project Management Integration

#### 47. project-board-sync
- **Type**: project
- **Category**: tracking
- **Capabilities**: board_synchronization, visual_management, progress_tracking
- **Tools**: Bash, TodoWrite, Write
- **MCP**: github, plane
- **Output**: project_sync.json

#### 48. multi-repo-swarm
- **Type**: repository
- **Category**: cross_repo
- **Capabilities**: cross_repository_orchestration, organization_automation, multi_repo_coordination
- **Tools**: Bash, Task, TodoWrite
- **MCP**: github, memory
- **Output**: multi_repo.json

## Synchronization & Integration

#### 49. sync-coordinator
- **Type**: integration
- **Category**: synchronization
- **Capabilities**: version_alignment, dependency_sync, cross_package_integration
- **Tools**: Bash, Write, MultiEdit
- **MCP**: github, memory
- **Output**: sync_state.json

#### 50. swarm-pr
- **Type**: github
- **Category**: pull_request
- **Capabilities**: multi_agent_review, validation_workflows, pr_lifecycle
- **Tools**: Bash, Task, TodoWrite
- **MCP**: github, memory
- **Output**: swarm_pr.json

#### 51. swarm-issue
- **Type**: github
- **Category**: issue
- **Capabilities**: issue_decomposition, task_creation, progress_tracking
- **Tools**: Bash, TodoWrite, Task
- **MCP**: github, plane
- **Output**: swarm_issue.json

## Infrastructure & Initialization

#### 52. swarm-init
- **Type**: infrastructure
- **Category**: initialization
- **Capabilities**: swarm_initialization, topology_optimization, agent_spawning
- **Tools**: Bash, Task, TodoWrite
- **MCP**: memory, github
- **Output**: swarm_init.json

#### 53. smart-agent
- **Type**: infrastructure
- **Category**: automation
- **Capabilities**: intelligent_coordination, dynamic_spawning, adaptive_behavior
- **Tools**: Task, TodoWrite, Bash
- **MCP**: memory, eva
- **Output**: smart_agent.json

#### 54. migration-planner
- **Type**: infrastructure
- **Category**: migration
- **Capabilities**: migration_planning, command_conversion, system_migration
- **Tools**: Read, Write, TodoWrite
- **MCP**: memory, github
- **Output**: migration.json

## NEW: Extended Agent Registry (31 Additional Agents)

### Engineering Category (4 agents)

#### 55. frontend-developer
- **Type**: developer
- **Category**: frontend
- **Phase**: execution
- **Capabilities**: react_development, vue_angular_frameworks, responsive_design, component_libraries, frontend_performance
- **Tools**: Write, MultiEdit, Bash, Read
- **MCP**: github, memory, playwright
- **Output**: frontend-developer_output.json

#### 56. ai-engineer
- **Type**: developer
- **Category**: artificial_intelligence
- **Phase**: execution
- **Capabilities**: machine_learning_models, neural_network_architecture, model_deployment, ai_pipeline_optimization, llm_integration
- **Tools**: Write, NotebookEdit, Bash, Read
- **MCP**: memory, github, sequential-thinking
- **Output**: ai-engineer_output.json

#### 57. devops-automator
- **Type**: devops
- **Category**: automation
- **Phase**: execution
- **Capabilities**: pipeline_automation, infrastructure_as_code, deployment_orchestration, monitoring_setup, security_automation
- **Tools**: Write, Bash, MultiEdit, Read
- **MCP**: github, memory, claude-flow
- **Output**: devops-automator_output.json

#### 58. rapid-prototyper
- **Type**: developer
- **Category**: prototyping
- **Phase**: planning
- **Capabilities**: rapid_prototyping, proof_of_concept, mvp_development, prototype_validation, technology_evaluation
- **Tools**: Write, MultiEdit, Bash, NotebookEdit
- **MCP**: github, memory, claude-flow, playwright
- **Output**: rapid-prototyper_output.json

### Product Category (3 agents)

#### 59. trend-researcher
- **Type**: analyst
- **Category**: product_research
- **Phase**: specification
- **Capabilities**: market_trend_analysis, competitive_intelligence, user_behavior_research, opportunity_identification, technology_trend_mapping
- **Tools**: WebSearch, WebFetch, Read, Write
- **MCP**: deepwiki, ref, firecrawl, claude-flow
- **Output**: trend-researcher_output.json

#### 60. feedback-synthesizer
- **Type**: analyst
- **Category**: product_feedback
- **Phase**: knowledge
- **Capabilities**: feedback_aggregation, sentiment_analysis, user_journey_mapping, improvement_prioritization, feedback_loop_optimization
- **Tools**: Read, Write, Bash, MultiEdit
- **MCP**: memory, claude-flow, eva
- **Output**: feedback-synthesizer_output.json

#### 61. sprint-prioritizer
- **Type**: coordinator
- **Category**: product_planning
- **Phase**: planning
- **Capabilities**: sprint_planning, task_prioritization, resource_allocation, velocity_tracking, stakeholder_alignment
- **Tools**: TodoWrite, Write, Read, Bash
- **MCP**: plane, memory, claude-flow, github
- **Output**: sprint-prioritizer_output.json

### Marketing Category (7 agents)

#### 62. tiktok-strategist
- **Type**: marketing
- **Category**: social_media
- **Phase**: knowledge
- **Capabilities**: tiktok_algorithm_optimization, viral_content_strategy, influencer_collaboration, trend_identification, performance_analytics
- **Tools**: Write, Read, WebSearch, Bash
- **MCP**: claude-flow, memory, eva
- **Output**: tiktok-strategist_output.json

#### 63. instagram-curator
- **Type**: marketing
- **Category**: social_media
- **Phase**: knowledge
- **Capabilities**: visual_storytelling, hashtag_optimization, story_strategy, reels_creation, community_building
- **Tools**: Write, Read, WebSearch
- **MCP**: claude-flow, memory
- **Output**: instagram-curator_output.json

#### 64. twitter-engager
- **Type**: marketing
- **Category**: social_media
- **Phase**: knowledge
- **Capabilities**: real_time_engagement, thread_creation, community_management, trend_participation, crisis_communication
- **Tools**: Write, Read, WebSearch, Bash
- **MCP**: claude-flow, memory
- **Output**: twitter-engager_output.json

#### 65. reddit-community-builder
- **Type**: marketing
- **Category**: social_media
- **Phase**: knowledge
- **Capabilities**: subreddit_strategy, authentic_engagement, community_guidelines_compliance, ama_coordination, organic_growth
- **Tools**: Write, Read, WebSearch
- **MCP**: claude-flow, memory
- **Output**: reddit-community-builder_output.json

#### 66. app-store-optimizer
- **Type**: marketing
- **Category**: app_store_optimization
- **Phase**: knowledge
- **Capabilities**: aso_keyword_optimization, app_store_listing_optimization, review_management, conversion_optimization, competitive_analysis
- **Tools**: Write, Read, WebSearch, Bash
- **MCP**: claude-flow, memory, eva
- **Output**: app-store-optimizer_output.json

#### 67. content-creator
- **Type**: marketing
- **Category**: content_creation
- **Phase**: knowledge
- **Capabilities**: multimedia_content_creation, brand_storytelling, content_adaptation, editorial_calendar, performance_optimization
- **Tools**: Write, MultiEdit, Read, NotebookEdit
- **MCP**: claude-flow, memory, markitdown
- **Output**: content-creator_output.json

#### 68. growth-hacker
- **Type**: marketing
- **Category**: growth_marketing
- **Phase**: knowledge
- **Capabilities**: growth_experimentation, viral_mechanism_design, funnel_optimization, user_acquisition, retention_strategies
- **Tools**: Write, Bash, NotebookEdit, Read
- **MCP**: claude-flow, memory, eva
- **Output**: growth-hacker_output.json

### Design Category (5 agents)

#### 69. ui-designer
- **Type**: designer
- **Category**: user_interface
- **Phase**: planning
- **Capabilities**: interface_design, design_systems, prototyping, accessibility_design, responsive_design
- **Tools**: Write, Read, MultiEdit
- **MCP**: claude-flow, memory, playwright
- **Output**: ui-designer_output.json

#### 70. ux-researcher
- **Type**: researcher
- **Category**: user_experience
- **Phase**: specification
- **Capabilities**: user_research, usability_testing, journey_mapping, persona_development, behavioral_analysis
- **Tools**: Read, Write, WebSearch
- **MCP**: claude-flow, memory, playwright
- **Output**: ux-researcher_output.json

#### 71. brand-guardian
- **Type**: designer
- **Category**: brand_management
- **Phase**: specification
- **Capabilities**: brand_guidelines, visual_identity, brand_consistency, trademark_protection, brand_voice
- **Tools**: Read, Write, MultiEdit
- **MCP**: claude-flow, memory
- **Output**: brand-guardian_output.json

#### 72. visual-storyteller
- **Type**: designer
- **Category**: visual_communication
- **Phase**: execution
- **Capabilities**: visual_narratives, infographic_design, data_visualization, motion_graphics, storytelling
- **Tools**: Write, Read, MultiEdit
- **MCP**: claude-flow, memory
- **Output**: visual-storyteller_output.json

#### 73. whimsy-injector
- **Type**: designer
- **Category**: creative_enhancement
- **Phase**: execution
- **Capabilities**: personality_injection, micro_interactions, easter_eggs, creative_enhancement, user_delight
- **Tools**: Write, Read, MultiEdit
- **MCP**: claude-flow, memory
- **Output**: whimsy-injector_output.json

### Project Management Category (3 agents)

#### 74. experiment-tracker
- **Type**: coordinator
- **Category**: experimentation
- **Phase**: research
- **Capabilities**: experiment_design, hypothesis_testing, data_collection, statistical_analysis, result_synthesis
- **Tools**: NotebookEdit, Write, Read, Bash
- **MCP**: claude-flow, memory, eva
- **Output**: experiment-tracker_output.json

#### 75. project-shipper
- **Type**: coordinator
- **Category**: delivery_management
- **Phase**: execution
- **Capabilities**: delivery_coordination, release_management, stakeholder_communication, timeline_optimization, risk_mitigation
- **Tools**: TodoWrite, Bash, Write, Read
- **MCP**: claude-flow, memory, github, plane
- **Output**: project-shipper_output.json

#### 76. studio-producer
- **Type**: coordinator
- **Category**: production_management
- **Phase**: planning
- **Capabilities**: production_planning, resource_allocation, creative_workflow, team_coordination, output_optimization
- **Tools**: TodoWrite, Write, Read, Bash
- **MCP**: claude-flow, memory, plane
- **Output**: studio-producer_output.json

### Studio Operations Category (5 agents)

#### 77. support-responder
- **Type**: support
- **Category**: customer_support
- **Phase**: knowledge
- **Capabilities**: ticket_management, issue_resolution, customer_communication, knowledge_base, escalation_management
- **Tools**: Read, Write, WebSearch
- **MCP**: claude-flow, memory
- **Output**: support-responder_output.json

#### 78. analytics-reporter
- **Type**: analyst
- **Category**: data_analysis
- **Phase**: knowledge
- **Capabilities**: data_analysis, report_generation, dashboard_creation, trend_identification, kpi_tracking
- **Tools**: NotebookEdit, Read, Write, Bash
- **MCP**: claude-flow, memory, eva
- **Output**: analytics-reporter_output.json

#### 79. infrastructure-maintainer
- **Type**: infrastructure
- **Category**: system_maintenance
- **Phase**: execution
- **Capabilities**: system_monitoring, maintenance_automation, performance_optimization, incident_response, capacity_planning
- **Tools**: Bash, Read, Write, MultiEdit
- **MCP**: claude-flow, memory
- **Output**: infrastructure-maintainer_output.json

#### 80. legal-compliance-checker
- **Type**: compliance
- **Category**: legal_compliance
- **Phase**: specification
- **Capabilities**: compliance_auditing, regulatory_analysis, risk_assessment, policy_development, documentation_review
- **Tools**: Read, Write, WebSearch
- **MCP**: claude-flow, memory, ref
- **Output**: legal-compliance-checker_output.json

#### 81. finance-tracker
- **Type**: finance
- **Category**: financial_management
- **Phase**: knowledge
- **Capabilities**: budget_tracking, expense_analysis, financial_reporting, cost_optimization, roi_analysis
- **Tools**: NotebookEdit, Read, Write, Bash
- **MCP**: claude-flow, memory, eva
- **Output**: finance-tracker_output.json

### Testing Category (4 agents)

#### 82. tool-evaluator
- **Type**: analyst
- **Category**: tool_assessment
- **Phase**: research
- **Capabilities**: tool_assessment, comparative_analysis, integration_testing, performance_evaluation, recommendation_generation
- **Tools**: Read, Write, Bash, WebSearch
- **MCP**: claude-flow, memory, eva
- **Output**: tool-evaluator_output.json

#### 83. api-tester
- **Type**: tester
- **Category**: api_testing
- **Phase**: execution
- **Capabilities**: api_testing, endpoint_validation, performance_testing, security_testing, integration_testing
- **Tools**: Bash, Read, Write, NotebookEdit
- **MCP**: claude-flow, memory, playwright
- **Output**: api-tester_output.json

#### 84. workflow-optimizer
- **Type**: optimizer
- **Category**: workflow_optimization
- **Phase**: execution
- **Capabilities**: workflow_analysis, process_optimization, automation_implementation, efficiency_measurement, bottleneck_identification
- **Tools**: Read, Write, Bash, TodoWrite
- **MCP**: claude-flow, memory, eva, github
- **Output**: workflow-optimizer_output.json

#### 85. test-results-analyzer
- **Type**: analyst
- **Category**: test_analysis
- **Phase**: knowledge
- **Capabilities**: test_result_analysis, quality_metrics, trend_identification, failure_analysis, reporting
- **Tools**: NotebookEdit, Read, Write, Bash
- **MCP**: claude-flow, memory, eva
- **Output**: test-results-analyzer_output.json

## Agent Selection Guidelines

### By SPEK Phase

#### Specification Phase
- Primary: specification, researcher, researcher-gemini
- Support: planner, system-architect

#### Research Phase
- Primary: researcher, code-analyzer, security-manager
- Support: fresh-eyes-gemini, performance-benchmarker

#### Planning Phase
- Primary: planner, sparc-coord, task-orchestrator
- Support: architecture, pseudocode

#### Execution Phase
- Primary: coder, coder-codex, backend-dev, tester
- Support: tdd-london-swarm, production-validator

#### Knowledge Phase
- Primary: reviewer, memory-coordinator, api-docs
- Support: fresh-eyes-codex, refinement

### By Task Type

#### New Feature Development
- Agents: specification -> planner -> coder -> tester -> reviewer
- Swarm: hierarchical-coordinator

#### Bug Fixing
- Agents: code-analyzer -> coder-codex -> tester -> production-validator
- Swarm: mesh-coordinator

#### Architecture Changes
- Agents: system-architect -> architecture -> fresh-eyes-gemini -> reviewer
- Swarm: adaptive-coordinator

#### Performance Optimization
- Agents: perf-analyzer -> performance-benchmarker -> coder -> tester
- Swarm: mesh-coordinator

#### Security Audit
- Agents: security-manager -> code-analyzer -> fresh-eyes-codex
- Swarm: hierarchical-coordinator

## Quality Gates by Phase

### Specification
- Requirements completeness >= 95%
- Acceptance criteria defined: 100%
- Edge cases documented: Yes

### Research
- Solution alternatives evaluated >= 3
- Technical feasibility confirmed: Yes
- Risk assessment complete: Yes

### Planning
- Task breakdown complete: 100%
- Dependencies mapped: Yes
- Resource allocation: Optimized

### Execution
- Tests passing: 100%
- Coverage >= baseline
- Security: 0 HIGH/CRITICAL
- Lint: Clean

### Knowledge
- Documentation complete: Yes
- Lessons learned captured: Yes
- Knowledge transferred: Yes

## Communication Protocols

### Inter-Agent Communication
```json
{
  "sender": "agent_name",
  "receiver": "agent_name",
  "message_type": "request|response|escalation",
  "payload": {},
  "timestamp": "ISO8601"
}
```

### Escalation Protocol
```json
{
  "escalate": "planner|architecture|security",
  "reason": "budget_exceeded|security_risk|unclear_requirements",
  "current_state": {},
  "recommended_action": ""
}
```

### Artifact Handoff
```json
{
  "from_agent": "agent_name",
  "to_agent": "agent_name",
  "artifact": "artifact_name.json",
  "location": ".claude/artifacts/",
  "validation": "checksum"
}
```

## Memory Integration

All agents integrate with the unified memory system:

### Memory Store Operations
```bash
memory_store "<namespace>/<key>" "<value>" '{"metadata": {}}'
```

### Memory Retrieve Operations
```bash
memory_retrieve "<namespace>/<key>"
```

### Cross-Session Memory
- Persistent across sessions
- Searchable by tags
- Version controlled
- Audit trail maintained

## MCP Server Integration

### Required MCP Servers by Phase

#### Specification
- memory: State management
- sequential-thinking: Enhanced reasoning
- deepwiki: Domain knowledge

#### Research
- ref: Technical references
- firecrawl: Web research
- context7: Large context analysis

#### Planning
- plane: Project management
- memory: Task tracking
- sequential-thinking: Planning logic

#### Execution
- github: Version control
- codex: Sandboxed edits
- markitdown: Documentation

#### Knowledge
- memory: Knowledge retention
- eva: Quality metrics
- playwright: E2E validation

## Performance Metrics

### Agent Performance Targets
- Response time: < 5 seconds
- Success rate: > 95%
- Quality gate pass rate: > 90%
- Escalation rate: < 10%

### Swarm Performance Targets
- Coordination overhead: < 20%
- Parallel efficiency: > 70%
- Fault recovery: < 30 seconds
- Memory efficiency: < 100MB per agent

## Maintenance & Updates

### Agent Lifecycle
1. **Creation**: Define in registry
2. **Testing**: Validate capabilities
3. **Deployment**: Add to swarm
4. **Monitoring**: Track performance
5. **Optimization**: Refine prompts
6. **Deprecation**: Phase out legacy

### Version Control
- Agents versioned independently
- Backward compatibility maintained
- Migration paths documented
- Rollback procedures defined

## Best Practices

### Agent Design
1. Single responsibility principle
2. Clear input/output contracts
3. Deterministic behavior
4. Error handling robust
5. Logging comprehensive

### Swarm Coordination
1. Minimize inter-agent dependencies
2. Use async communication
3. Implement circuit breakers
4. Monitor resource usage
5. Regular health checks

### Quality Assurance
1. Validate all outputs
2. Maintain audit trails
3. Regular performance reviews
4. Continuous improvement
5. User feedback integration

---

This consolidated registry provides a single source of truth for all agent definitions, ensuring consistency across the SPEK pipeline and enabling efficient swarm coordination.