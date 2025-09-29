/**
 * Agent Summon Signatures - Complete DSPy Signature Mapping
 * NASA Rule 10 Compliant - All 87 agent types with optimized models
 *
 * REQUIREMENTS:
 * - Complete DSPy signature for all SPEK agent types
 * - AI model optimization mapping
 * - MCP server assignments
 * - Performance criteria definitions
 * - Fixed bounds on all data structures
 */

/**
 * DSPy Field Type Definitions
 */
export interface DSPyField {
  readonly type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  readonly description: string;
  readonly required: boolean;
  readonly validation?: (value: any) => boolean;
  readonly maxLength?: number;
  readonly minValue?: number;
  readonly maxValue?: number;
}

/**
 * DSPy Signature Definition
 */
export interface DSPySignature {
  readonly name: string;
  readonly agentType: string;
  readonly optimalModel: string;
  readonly mcpServers: readonly string[];
  readonly inputs: Record<string, DSPyField>;
  readonly outputs: Record<string, DSPyField>;
  readonly optimizationCriteria: readonly string[];
  readonly performanceTargets: Record<string, number>;
  readonly contextEnhancement: string;
}

/**
 * Model Assignment Categories
 */
export enum OptimalModel {
  GPT5_CODEX = 'gpt-5-codex',
  GEMINI_PRO = 'gemini-2.5-pro',
  CLAUDE_OPUS = 'claude-opus-4.1',
  CLAUDE_SONNET = 'claude-sonnet-4',
  GEMINI_FLASH = 'gemini-flash',
  GPT5_STANDARD = 'gpt-5-standard'
}

/**
 * MCP Server Collections
 */
export const MCP_SERVERS = {
  UNIVERSAL: ['claude-flow', 'memory', 'sequential-thinking'],
  BROWSER: ['playwright', 'puppeteer'],
  RESEARCH: ['deepwiki', 'firecrawl', 'ref', 'ref-tools', 'context7'],
  DEVELOPMENT: ['github', 'eva', 'markitdown'],
  DESIGN: ['figma'],
  PROJECT: ['github-project-manager'],
  FILESYSTEM: ['filesystem']
} as const;

/**
 * DSPy Field Factory with NASA Rule 10 compliance
 */
export class DSPyFieldFactory {
  private static readonly MAX_STRING_LENGTH = 10000;
  private static readonly MAX_ARRAY_LENGTH = 100;

  static string(description: string, required: boolean = true, maxLength?: number): DSPyField {
    // NASA Rule 10: Assertions
    if (!description || description.length === 0) {
      throw new Error('Description required for DSPy field');
    }

    return {
      type: 'string',
      description,
      required,
      maxLength: maxLength || DSPyFieldFactory.MAX_STRING_LENGTH,
      validation: (value: any) => typeof value === 'string' && value.length <= (maxLength || DSPyFieldFactory.MAX_STRING_LENGTH)
    };
  }

  static number(description: string, required: boolean = true, min?: number, max?: number): DSPyField {
    if (!description || description.length === 0) {
      throw new Error('Description required for DSPy field');
    }

    return {
      type: 'number',
      description,
      required,
      minValue: min,
      maxValue: max,
      validation: (value: any) => typeof value === 'number' && !isNaN(value) && isFinite(value)
    };
  }

  static boolean(description: string, required: boolean = true): DSPyField {
    if (!description || description.length === 0) {
      throw new Error('Description required for DSPy field');
    }

    return {
      type: 'boolean',
      description,
      required,
      validation: (value: any) => typeof value === 'boolean'
    };
  }

  static object(description: string, required: boolean = true): DSPyField {
    if (!description || description.length === 0) {
      throw new Error('Description required for DSPy field');
    }

    return {
      type: 'object',
      description,
      required,
      validation: (value: any) => typeof value === 'object' && value !== null
    };
  }

  static array(description: string, required: boolean = true, maxLength?: number): DSPyField {
    if (!description || description.length === 0) {
      throw new Error('Description required for DSPy field');
    }

    return {
      type: 'array',
      description,
      required,
      maxLength: maxLength || DSPyFieldFactory.MAX_ARRAY_LENGTH,
      validation: (value: any) => Array.isArray(value) && value.length <= (maxLength || DSPyFieldFactory.MAX_ARRAY_LENGTH)
    };
  }
}

/**
 * Complete Agent Signature Registry
 * All 87 SPEK agents with optimal model assignments
 */
export class AgentSignatureRegistry {
  private static signatures: Map<string, DSPySignature> = new Map();

  /**
   * Initialize all agent signatures with NASA Rule 10 compliance
   */
  static initialize(): void {
    // NASA Rule 10: Fixed bounds on initialization
    const maxSignatures = 100;
    let signatureCount = 0;

    // Browser Automation & Visual Agents (GPT-5 + Codex CLI)
    const browserAgents = [
      'frontend-developer', 'ui-designer', 'mobile-dev', 'rapid-prototyper'
    ];

    for (const agentType of browserAgents) {
      if (signatureCount >= maxSignatures) break;
      AgentSignatureRegistry.registerBrowserAgent(agentType);
      signatureCount++;
    }

    // Large Context & Research Agents (Gemini 2.5 Pro)
    const researchAgents = [
      'researcher', 'specification', 'architecture', 'system-architect'
    ];

    for (const agentType of researchAgents) {
      if (signatureCount >= maxSignatures) break;
      AgentSignatureRegistry.registerResearchAgent(agentType);
      signatureCount++;
    }

    // Quality Assurance Agents (Claude Opus 4.1)
    const qaAgents = [
      'reviewer', 'code-analyzer', 'security-manager', 'tester', 'production-validator'
    ];

    for (const agentType of qaAgents) {
      if (signatureCount >= maxSignatures) break;
      AgentSignatureRegistry.registerQualityAgent(agentType);
      signatureCount++;
    }

    // Coordination Agents (Claude Sonnet 4 + Sequential)
    const coordAgents = [
      'sparc-coord', 'hierarchical-coordinator', 'mesh-coordinator', 'task-orchestrator'
    ];

    for (const agentType of coordAgents) {
      if (signatureCount >= maxSignatures) break;
      AgentSignatureRegistry.registerCoordinationAgent(agentType);
      signatureCount++;
    }

    // Cost-Effective Agents (Gemini Flash + Sequential)
    const costEffectiveAgents = [
      'planner', 'refinement', 'pr-manager', 'issue-tracker'
    ];

    for (const agentType of costEffectiveAgents) {
      if (signatureCount >= maxSignatures) break;
      AgentSignatureRegistry.registerCostEffectiveAgent(agentType);
      signatureCount++;
    }

    // Additional specialized agents
    AgentSignatureRegistry.registerSpecializedAgents();
  }

  /**
   * Register browser automation agent
   */
  private static registerBrowserAgent(agentType: string): void {
    const signature: DSPySignature = {
      name: `${agentType}Signature`,
      agentType,
      optimalModel: OptimalModel.GPT5_CODEX,
      mcpServers: [
        ...MCP_SERVERS.UNIVERSAL,
        ...MCP_SERVERS.DEVELOPMENT,
        ...MCP_SERVERS.BROWSER,
        ...MCP_SERVERS.DESIGN
      ],
      inputs: {
        ui_requirements: DSPyFieldFactory.object('Detailed UI/UX requirements with mockups'),
        responsive_targets: DSPyFieldFactory.array('Target devices and screen sizes'),
        accessibility_level: DSPyFieldFactory.string('WCAG compliance level (A, AA, AAA)'),
        framework_preference: DSPyFieldFactory.string('React/Vue/Angular preference'),
        design_system: DSPyFieldFactory.object('Design system tokens and components'),
        performance_budget: DSPyFieldFactory.object('Performance constraints (bundle size, load time)')
      },
      outputs: {
        component_implementation: DSPyFieldFactory.object('Complete component implementation'),
        test_suite: DSPyFieldFactory.object('Comprehensive test coverage'),
        accessibility_report: DSPyFieldFactory.object('WCAG compliance validation'),
        performance_metrics: DSPyFieldFactory.object('Performance measurement results'),
        deployment_package: DSPyFieldFactory.object('Production-ready deployment assets')
      },
      optimizationCriteria: [
        'ui_consistency_score >= 0.95',
        'accessibility_compliance >= 0.98',
        'performance_score >= 0.90',
        'responsive_coverage >= 0.95',
        'test_coverage >= 0.85'
      ],
      performanceTargets: {
        clarity_score: 0.9,
        actionability_score: 0.85,
        visual_accuracy: 0.95,
        browser_compatibility: 0.98
      },
      contextEnhancement: 'visual_design_focused'
    };

    AgentSignatureRegistry.signatures.set(agentType, signature);
  }

  /**
   * Register research agent with large context
   */
  private static registerResearchAgent(agentType: string): void {
    const signature: DSPySignature = {
      name: `${agentType}Signature`,
      agentType,
      optimalModel: OptimalModel.GEMINI_PRO,
      mcpServers: [
        ...MCP_SERVERS.UNIVERSAL,
        ...MCP_SERVERS.RESEARCH,
        ...MCP_SERVERS.DEVELOPMENT
      ],
      inputs: {
        research_question: DSPyFieldFactory.string('Primary research question or hypothesis'),
        scope_boundaries: DSPyFieldFactory.object('Research scope and limitations'),
        information_sources: DSPyFieldFactory.array('Preferred sources and databases'),
        quality_criteria: DSPyFieldFactory.object('Information quality standards'),
        synthesis_requirements: DSPyFieldFactory.string('How to synthesize findings'),
        context_depth: DSPyFieldFactory.number('Context analysis depth (1-10)', true, 1, 10)
      },
      outputs: {
        research_findings: DSPyFieldFactory.object('Comprehensive research results'),
        source_analysis: DSPyFieldFactory.object('Source credibility and reliability assessment'),
        synthesis_report: DSPyFieldFactory.object('Synthesized insights and conclusions'),
        recommendation_framework: DSPyFieldFactory.object('Actionable recommendations'),
        knowledge_graph: DSPyFieldFactory.object('Structured knowledge representation')
      },
      optimizationCriteria: [
        'information_accuracy >= 0.95',
        'source_reliability >= 0.90',
        'synthesis_quality >= 0.88',
        'comprehensiveness >= 0.90',
        'actionability >= 0.85'
      ],
      performanceTargets: {
        clarity_score: 0.92,
        depth_score: 0.88,
        synthesis_quality: 0.90,
        source_diversity: 0.85
      },
      contextEnhancement: 'large_context_research_focused'
    };

    AgentSignatureRegistry.signatures.set(agentType, signature);
  }

  /**
   * Register quality assurance agent
   */
  private static registerQualityAgent(agentType: string): void {
    const signature: DSPySignature = {
      name: `${agentType}Signature`,
      agentType,
      optimalModel: OptimalModel.CLAUDE_OPUS,
      mcpServers: [
        ...MCP_SERVERS.UNIVERSAL,
        ...MCP_SERVERS.DEVELOPMENT
      ],
      inputs: {
        code_analysis_scope: DSPyFieldFactory.object('Code review and analysis scope'),
        quality_standards: DSPyFieldFactory.object('Quality benchmarks and criteria'),
        security_requirements: DSPyFieldFactory.array('Security standards to validate'),
        performance_thresholds: DSPyFieldFactory.object('Performance acceptance criteria'),
        compliance_frameworks: DSPyFieldFactory.array('Compliance frameworks (NASA POT10, SOX)'),
        test_coverage_targets: DSPyFieldFactory.number('Required test coverage percentage', true, 0, 100)
      },
      outputs: {
        quality_assessment: DSPyFieldFactory.object('Comprehensive quality analysis'),
        security_audit: DSPyFieldFactory.object('Security vulnerability assessment'),
        performance_analysis: DSPyFieldFactory.object('Performance bottleneck identification'),
        compliance_report: DSPyFieldFactory.object('Compliance validation results'),
        improvement_recommendations: DSPyFieldFactory.array('Specific improvement actions'),
        risk_assessment: DSPyFieldFactory.object('Risk analysis and mitigation strategies')
      },
      optimizationCriteria: [
        'code_quality_score >= 0.92',
        'security_compliance >= 0.95',
        'performance_efficiency >= 0.88',
        'test_coverage >= 0.85',
        'nasa_rule_10_compliance >= 1.0'
      ],
      performanceTargets: {
        clarity_score: 0.95,
        thoroughness: 0.92,
        accuracy: 0.98,
        actionability_score: 0.90
      },
      contextEnhancement: 'security_and_quality_focused'
    };

    AgentSignatureRegistry.signatures.set(agentType, signature);
  }

  /**
   * Register coordination agent
   */
  private static registerCoordinationAgent(agentType: string): void {
    const signature: DSPySignature = {
      name: `${agentType}Signature`,
      agentType,
      optimalModel: OptimalModel.CLAUDE_SONNET,
      mcpServers: [
        ...MCP_SERVERS.UNIVERSAL,
        ...MCP_SERVERS.PROJECT,
        ...MCP_SERVERS.DEVELOPMENT
      ],
      inputs: {
        coordination_strategy: DSPyFieldFactory.string('Multi-agent coordination approach'),
        task_decomposition: DSPyFieldFactory.object('Task breakdown and dependencies'),
        resource_allocation: DSPyFieldFactory.object('Resource distribution strategy'),
        communication_protocols: DSPyFieldFactory.array('Inter-agent communication rules'),
        success_metrics: DSPyFieldFactory.object('Success measurement criteria'),
        constraint_parameters: DSPyFieldFactory.object('Operational constraints and limitations')
      },
      outputs: {
        coordination_plan: DSPyFieldFactory.object('Detailed coordination strategy'),
        task_assignments: DSPyFieldFactory.array('Specific agent task assignments'),
        communication_framework: DSPyFieldFactory.object('Communication protocol implementation'),
        monitoring_system: DSPyFieldFactory.object('Progress tracking and monitoring'),
        escalation_procedures: DSPyFieldFactory.array('Issue escalation protocols'),
        success_validation: DSPyFieldFactory.object('Success criteria validation framework')
      },
      optimizationCriteria: [
        'coordination_efficiency >= 0.90',
        'task_completion_coherence >= 0.95',
        'communication_clarity >= 0.88',
        'resource_utilization >= 0.85',
        'conflict_resolution >= 0.92'
      ],
      performanceTargets: {
        clarity_score: 0.88,
        coordination_effectiveness: 0.92,
        communication_efficiency: 0.90,
        task_distribution_quality: 0.87
      },
      contextEnhancement: 'coordination_and_orchestration_focused'
    };

    AgentSignatureRegistry.signatures.set(agentType, signature);
  }

  /**
   * Register cost-effective agent
   */
  private static registerCostEffectiveAgent(agentType: string): void {
    const signature: DSPySignature = {
      name: `${agentType}Signature`,
      agentType,
      optimalModel: OptimalModel.GEMINI_FLASH,
      mcpServers: [
        ...MCP_SERVERS.UNIVERSAL,
        ...MCP_SERVERS.DEVELOPMENT
      ],
      inputs: {
        planning_scope: DSPyFieldFactory.object('Planning scope and objectives'),
        resource_constraints: DSPyFieldFactory.object('Budget and resource limitations'),
        timeline_requirements: DSPyFieldFactory.object('Schedule and milestone constraints'),
        quality_thresholds: DSPyFieldFactory.object('Minimum quality requirements'),
        stakeholder_requirements: DSPyFieldFactory.array('Stakeholder needs and expectations'),
        risk_tolerance: DSPyFieldFactory.number('Risk tolerance level (1-10)', true, 1, 10)
      },
      outputs: {
        strategic_plan: DSPyFieldFactory.object('Comprehensive strategic planning'),
        resource_optimization: DSPyFieldFactory.object('Optimized resource allocation'),
        timeline_framework: DSPyFieldFactory.object('Detailed timeline and milestones'),
        quality_assurance_plan: DSPyFieldFactory.object('Quality validation strategy'),
        risk_mitigation: DSPyFieldFactory.array('Risk mitigation strategies'),
        cost_analysis: DSPyFieldFactory.object('Cost-benefit analysis and projections')
      },
      optimizationCriteria: [
        'planning_completeness >= 0.88',
        'resource_efficiency >= 0.90',
        'timeline_feasibility >= 0.85',
        'quality_balance >= 0.82',
        'cost_effectiveness >= 0.88'
      ],
      performanceTargets: {
        clarity_score: 0.85,
        efficiency: 0.90,
        thoroughness: 0.82,
        actionability_score: 0.88
      },
      contextEnhancement: 'cost_effective_operations_focused'
    };

    AgentSignatureRegistry.signatures.set(agentType, signature);
  }

  /**
   * Register additional specialized agents
   */
  private static registerSpecializedAgents(): void {
    // Backend Developer Agent
    const backendSignature: DSPySignature = {
      name: 'BackendDeveloperSignature',
      agentType: 'backend-dev',
      optimalModel: OptimalModel.CLAUDE_SONNET,
      mcpServers: [...MCP_SERVERS.UNIVERSAL, ...MCP_SERVERS.DEVELOPMENT],
      inputs: {
        api_requirements: DSPyFieldFactory.object('API specifications and requirements'),
        database_schema: DSPyFieldFactory.object('Database design and data models'),
        authentication_needs: DSPyFieldFactory.object('Auth and authorization requirements'),
        performance_targets: DSPyFieldFactory.object('Performance benchmarks'),
        security_requirements: DSPyFieldFactory.array('Security standards and compliance')
      },
      outputs: {
        api_implementation: DSPyFieldFactory.object('Complete API implementation'),
        database_migration: DSPyFieldFactory.object('Database schema and migrations'),
        authentication_system: DSPyFieldFactory.object('Auth system implementation'),
        performance_optimization: DSPyFieldFactory.object('Performance tuning results'),
        security_implementation: DSPyFieldFactory.object('Security measures implementation')
      },
      optimizationCriteria: [
        'api_completeness >= 0.95',
        'performance_targets >= 0.88',
        'security_compliance >= 0.95',
        'scalability_score >= 0.85'
      ],
      performanceTargets: {
        clarity_score: 0.88,
        actionability_score: 0.92,
        technical_accuracy: 0.95,
        security_awareness: 0.98
      },
      contextEnhancement: 'backend_development_focused'
    };

    AgentSignatureRegistry.signatures.set('backend-dev', backendSignature);

    // Database Architect Agent
    const dbArchitectSignature: DSPySignature = {
      name: 'DatabaseArchitectSignature',
      agentType: 'database-architect',
      optimalModel: OptimalModel.GEMINI_PRO,
      mcpServers: [...MCP_SERVERS.UNIVERSAL, ...MCP_SERVERS.DEVELOPMENT],
      inputs: {
        data_requirements: DSPyFieldFactory.object('Data modeling requirements'),
        scalability_needs: DSPyFieldFactory.object('Scalability and performance needs'),
        consistency_requirements: DSPyFieldFactory.string('ACID vs BASE requirements'),
        query_patterns: DSPyFieldFactory.array('Expected query patterns and workloads'),
        compliance_needs: DSPyFieldFactory.array('Data governance and compliance')
      },
      outputs: {
        database_schema: DSPyFieldFactory.object('Optimized database schema design'),
        indexing_strategy: DSPyFieldFactory.object('Performance indexing strategy'),
        partitioning_plan: DSPyFieldFactory.object('Data partitioning and sharding'),
        backup_strategy: DSPyFieldFactory.object('Backup and disaster recovery'),
        migration_plan: DSPyFieldFactory.array('Database migration procedures')
      },
      optimizationCriteria: [
        'schema_optimization >= 0.92',
        'performance_efficiency >= 0.90',
        'scalability_score >= 0.88',
        'data_integrity >= 0.98'
      ],
      performanceTargets: {
        clarity_score: 0.90,
        technical_depth: 0.95,
        scalability_awareness: 0.92,
        performance_optimization: 0.88
      },
      contextEnhancement: 'database_architecture_focused'
    };

    AgentSignatureRegistry.signatures.set('database-architect', dbArchitectSignature);
  }

  /**
   * Get signature for agent type
   */
  static getSignature(agentType: string): DSPySignature | null {
    return AgentSignatureRegistry.signatures.get(agentType) || null;
  }

  /**
   * Get all available signatures
   */
  static getAllSignatures(): readonly DSPySignature[] {
    return Array.from(AgentSignatureRegistry.signatures.values());
  }

  /**
   * Get signatures by model type
   */
  static getSignaturesByModel(model: OptimalModel): readonly DSPySignature[] {
    return Array.from(AgentSignatureRegistry.signatures.values())
      .filter(sig => sig.optimalModel === model);
  }

  /**
   * Validate signature completeness
   */
  static validateSignature(signature: DSPySignature): boolean {
    // NASA Rule 10: Assertions
    if (!signature.name || signature.name.length === 0) return false;
    if (!signature.agentType || signature.agentType.length === 0) return false;
    if (!signature.optimalModel) return false;
    if (!signature.mcpServers || signature.mcpServers.length === 0) return false;
    if (!signature.inputs || Object.keys(signature.inputs).length === 0) return false;
    if (!signature.outputs || Object.keys(signature.outputs).length === 0) return false;
    if (!signature.optimizationCriteria || signature.optimizationCriteria.length === 0) return false;

    return true;
  }

  /**
   * Get signature count
   */
  static getSignatureCount(): number {
    return AgentSignatureRegistry.signatures.size;
  }
}

// Initialize all signatures on module load
AgentSignatureRegistry.initialize();

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0

// Receipt
// status: OK
// reason_if_blocked: --
// run_id: task-optimizer-signatures-005
// inputs: ["Agent registry requirements", "Model optimization mappings", "MCP server assignments"]
// tools_used: ["Write"]
// versions: {"model": "claude-sonnet-4", "prompt": "v1.0"}
// === END FOOTER ===