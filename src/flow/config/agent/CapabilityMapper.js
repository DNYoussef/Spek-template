/**
 * Capability Mapper
 * Agent capability inference and mapping logic
 */

const { ReasoningComplexity } = require('../constants/AIModelDefinitions');

class CapabilityMapper {
  /**
   * Get agent capabilities from configuration or infer from type
   * @param {string} agentType - Agent type name
   * @param {object} config - Agent configuration (optional)
   * @returns {string[]} Array of capability identifiers
   */
  getCapabilities(agentType, config = {}) {
    // If config already has capabilities, return them
    if (config.capabilities && config.capabilities.length > 0) {
      return config.capabilities;
    }

    // Infer capabilities from agent type
    return this.inferFromAgentType(agentType);
  }

  /**
   * Infer capabilities from agent type name
   * @param {string} agentType - Agent type name
   * @returns {string[]} Inferred capabilities
   */
  inferFromAgentType(agentType) {
    const typeMap = {
      // Browser & Visual Agents
      'frontend-developer': ['browser_automation', 'screenshot_capture', 'ui_testing', 'visual_validation'],
      'ui-designer': ['browser_automation', 'visual_design', 'browser_testing', 'screenshot_validation'],
      'mobile-dev': ['mobile_testing', 'device_simulation', 'gesture_control', 'multimodal_input'],
      'rapid-prototyper': ['rapid_iteration', 'visual_testing', 'browser_automation'],

      // Research Agents
      'researcher': ['large_context_analysis', 'web_search', 'comprehensive_research'],
      'research-agent': ['deep_research', 'pattern_analysis', 'large_file_processing'],
      'specification': ['requirements_analysis', 'large_spec_processing', 'context_synthesis'],
      'architecture': ['system_design', 'architectural_analysis', 'pattern_recognition'],
      'system-architect': ['enterprise_architecture', 'system_integration', 'large_scale_design'],

      // Coding Agents
      'coder': ['autonomous_coding', 'long_sessions', 'test_execution', 'iterative_development'],
      'sparc-coder': ['sparc_methodology', 'tdd_implementation', 'autonomous_development'],
      'backend-dev': ['api_development', 'database_integration', 'autonomous_testing'],
      'ml-developer': ['ml_implementation', 'data_processing', 'model_training'],
      'cicd-engineer': ['pipeline_automation', 'github_integration', 'testing_automation'],

      // Quality Agents
      'reviewer': ['code_review', 'quality_analysis', 'security_review', 'architectural_validation'],
      'code-analyzer': ['static_analysis', 'pattern_detection', 'code_quality_assessment'],
      'security-manager': ['security_analysis', 'vulnerability_detection', 'compliance_checking'],
      'tester': ['test_design', 'quality_validation', 'tdd_implementation'],
      'production-validator': ['production_readiness', 'quality_gates', 'compliance_validation'],
      'reality-checker': ['validation', 'evidence_analysis', 'theater_detection'],

      // Coordination Agents
      'sparc-coord': ['methodology_coordination', 'phase_orchestration', 'agent_coordination'],
      'hierarchical-coordinator': ['multi_agent_coordination', 'hierarchical_management', 'task_delegation'],
      'mesh-coordinator': ['peer_coordination', 'distributed_management', 'consensus_building'],
      'adaptive-coordinator': ['adaptive_management', 'dynamic_coordination', 'optimization'],
      'task-orchestrator': ['task_management', 'workflow_orchestration', 'resource_allocation'],
      'memory-coordinator': ['memory_management', 'knowledge_coordination', 'state_management'],

      // Fast Operation Agents
      'planner': ['project_planning', 'resource_allocation', 'timeline_management'],
      'refinement': ['iterative_improvement', 'optimization', 'enhancement'],
      'pr-manager': ['pull_request_management', 'github_integration', 'review_coordination'],
      'issue-tracker': ['issue_management', 'bug_tracking', 'project_coordination'],
      'performance-benchmarker': ['performance_testing', 'benchmark_analysis', 'optimization'],

      // GitHub Agents
      'github-modes': ['github_integration', 'repository_management', 'workflow_automation'],
      'workflow-automation': ['github_actions', 'automation', 'ci_cd_integration'],
      'code-review-swarm': ['collaborative_review', 'github_integration', 'automated_feedback'],

      // General Purpose
      'swarm-init': ['swarm_initialization', 'topology_setup', 'agent_spawning'],
      'smart-agent': ['intelligent_routing', 'dynamic_selection', 'optimization'],

      // Specialized Agents
      'api-docs': ['api_documentation', 'openapi_specs', 'technical_writing'],
      'perf-analyzer': ['performance_analysis', 'bottleneck_detection', 'optimization'],
      'migration-planner': ['migration_planning', 'legacy_analysis', 'risk_assessment'],
      'release-manager': ['release_management', 'version_control', 'deployment_automation'],
      'project-board-sync': ['project_management', 'board_sync', 'task_coordination'],
      'repo-architect': ['repository_structure', 'codebase_organization', 'architecture_design'],
      'multi-repo-swarm': ['multi_repository', 'cross_repo_coordination', 'distributed_development'],
      'tdd-london-swarm': ['tdd_methodology', 'london_school', 'mock_driven_development'],
      'base-template-generator': ['template_generation', 'boilerplate_creation', 'project_scaffolding'],

      // Desktop Automation Agents
      'desktop-automator': ['desktop_automation', 'screenshot_capture', 'ui_interaction', 'application_control'],
      'ui-tester': ['ui_testing', 'desktop_automation', 'screenshot_validation', 'user_flow_testing'],
      'app-integration-tester': ['application_testing', 'desktop_automation', 'integration_testing', 'file_operations'],
      'desktop-qa-specialist': ['quality_assurance', 'desktop_validation', 'evidence_collection', 'compliance_testing'],
      'desktop-workflow-automator': ['workflow_automation', 'desktop_scripting', 'task_orchestration', 'multi_app_coordination'],

      // Additional Strategic Agents
      'consensus-builder': ['consensus_building', 'coordination', 'orchestration'],
      'swarm-memory-manager': ['memory_management', 'knowledge_coordination', 'state_management'],
      'byzantine-coordinator': ['byzantine_fault_tolerance', 'coordination', 'consensus_building'],
      'raft-manager': ['raft_consensus', 'leader_election', 'coordination'],
      'gossip-coordinator': ['gossip_protocol', 'peer_coordination', 'distributed_management'],
      'collective-intelligence-coordinator': ['collective_intelligence', 'swarm_coordination', 'emergent_behavior'],
      'crdt-synchronizer': ['crdt_synchronization', 'conflict_resolution', 'distributed_state'],
      'quorum-manager': ['quorum_management', 'consensus_building', 'coordination'],
      'pseudocode': ['algorithm_design', 'pseudocode_generation', 'requirements_analysis']
    };

    return typeMap[agentType] || ['general_purpose'];
  }

  /**
   * Get reasoning complexity for agent
   * @param {string} agentType - Agent type name
   * @param {object} config - Agent configuration (optional)
   * @returns {string} Reasoning complexity level
   */
  getReasoningComplexity(agentType, config = {}) {
    if (config.reasoningComplexity) {
      return config.reasoningComplexity;
    }

    // Infer from agent type
    const highComplexityAgents = [
      'architecture', 'system-architect', 'reviewer', 'code-analyzer',
      'security-manager', 'production-validator', 'sparc-coord',
      'hierarchical-coordinator', 'mesh-coordinator', 'migration-planner',
      'tdd-london-swarm', 'perf-analyzer', 'mobile-dev', 'ml-developer'
    ];

    const lowComplexityAgents = [
      'pr-manager', 'issue-tracker'
    ];

    if (highComplexityAgents.includes(agentType)) {
      return ReasoningComplexity.HIGH;
    }

    if (lowComplexityAgents.includes(agentType)) {
      return ReasoningComplexity.LOW;
    }

    return ReasoningComplexity.MEDIUM;
  }

  /**
   * Get context threshold for agent
   * @param {string} agentType - Agent type name
   * @param {object} config - Agent configuration (optional)
   * @returns {number} Context size threshold in characters
   */
  getContextThreshold(agentType, config = {}) {
    if (config.contextThreshold) {
      return config.contextThreshold;
    }

    // Large context agents
    const largeContextAgents = {
      'researcher': 500000,
      'research-agent': 800000,
      'specification': 300000,
      'architecture': 400000,
      'system-architect': 600000,
      'api-docs': 200000,
      'migration-planner': 300000,
      'repo-architect': 400000
    };

    if (largeContextAgents[agentType]) {
      return largeContextAgents[agentType];
    }

    // Default threshold
    return 50000;
  }

  /**
   * Check if agent should use sequential thinking
   * @param {string} agentType - Agent type name
   * @param {object} config - Agent configuration (optional)
   * @returns {boolean} True if sequential thinking should be enabled
   */
  shouldUseSequentialThinking(agentType, config = {}) {
    if (config.hasOwnProperty('sequentialThinking')) {
      return config.sequentialThinking;
    }

    // Agents that benefit from sequential thinking
    const sequentialThinkingAgents = [
      'sparc-coord', 'hierarchical-coordinator', 'mesh-coordinator',
      'adaptive-coordinator', 'task-orchestrator', 'memory-coordinator',
      'planner', 'refinement', 'pr-manager', 'issue-tracker',
      'performance-benchmarker', 'migration-planner', 'project-board-sync',
      'desktop-workflow-automator', 'consensus-builder', 'swarm-memory-manager',
      'byzantine-coordinator', 'raft-manager', 'gossip-coordinator',
      'collective-intelligence-coordinator', 'quorum-manager'
    ];

    return sequentialThinkingAgents.includes(agentType);
  }

  /**
   * Find agents with specific capability
   * @param {string} capability - Capability to search for
   * @param {object} allConfigs - All agent configurations
   * @returns {string[]} Agent types with this capability
   */
  findAgentsWithCapability(capability, allConfigs) {
    const agents = [];

    for (const [agentType, config] of Object.entries(allConfigs)) {
      const capabilities = this.getCapabilities(agentType, config);
      if (capabilities.includes(capability)) {
        agents.push(agentType);
      }
    }

    return agents;
  }

  /**
   * Get capability categories
   * @returns {object} Capability categories with descriptions
   */
  getCapabilityCategories() {
    return {
      browser: {
        name: 'Browser & Visual',
        capabilities: ['browser_automation', 'screenshot_capture', 'ui_testing', 'visual_validation'],
        description: 'Browser automation and visual testing capabilities'
      },
      research: {
        name: 'Research & Analysis',
        capabilities: ['research', 'analysis', 'large_context', 'pattern_recognition'],
        description: 'Research and analytical capabilities'
      },
      coding: {
        name: 'Development & Coding',
        capabilities: ['coding', 'implementation', 'autonomous_development', 'tdd'],
        description: 'Software development and coding capabilities'
      },
      quality: {
        name: 'Quality & Testing',
        capabilities: ['testing', 'quality_analysis', 'validation', 'security_analysis'],
        description: 'Quality assurance and testing capabilities'
      },
      coordination: {
        name: 'Coordination & Management',
        capabilities: ['coordination', 'orchestration', 'management', 'delegation'],
        description: 'Agent coordination and task management'
      },
      desktop: {
        name: 'Desktop Automation',
        capabilities: ['desktop_automation', 'ui_interaction', 'desktop_testing'],
        description: 'Desktop application automation and control'
      }
    };
  }
}

module.exports = CapabilityMapper;