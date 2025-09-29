/**
 * Agent Template Generator
 * Instantiates the Master DSPy Template for specific agents
 */

import { MasterAgentTemplate, MasterAgentSignature, OPTIMIZATION_CRITERIA } from './MasterAgentTemplate';

interface AgentConfig {
  agent_id: string;
  agent_type: string;
  category: string;
  model_assignment: string;
  mcp_servers: string[];
  capabilities: string[];
  hierarchy_level: string;
  parent_princess?: string;
  optimization_priority: string;
  fsm_mode?: string;
  prompt_location: string;
  prompt_length: number;
}

interface TemplateGenerationConfig {
  agentConfig: AgentConfig;
  customConstraints?: Record<string, any>;
  exampleBank?: Array<{
    input: string;
    expected_output: string;
    quality_score: number;
  }>;
  optimizationFocus?: string[];
}

interface GeneratedTemplate {
  signature: string;
  exampleBank: string;
  optimizationMetrics: string;
  validationRules: string;
  complianceChecks: string;
  specializationConstraints: string;
}

export class AgentTemplateGenerator {
  private masterTemplate: MasterAgentTemplate;
  private agentInventory: Map<string, AgentConfig>;

  constructor() {
    this.masterTemplate = new MasterAgentTemplate();
    this.agentInventory = new Map();
  }

  async loadAgentInventory(inventoryPath: string): Promise<void> {
    try {
      const fs = await import('fs/promises');
      const inventoryData = JSON.parse(await fs.readFile(inventoryPath, 'utf-8'));

      for (const [agentId, config] of Object.entries(inventoryData.agents)) {
        this.agentInventory.set(agentId, config as AgentConfig);
      }

      console.log(`Loaded ${this.agentInventory.size} agents into inventory`);
    } catch (error) {
      throw new Error(`Failed to load agent inventory: ${error.message}`);
    }
  }

  generateTemplateForAgent(agentId: string, config?: TemplateGenerationConfig): GeneratedTemplate {
    const agentConfig = config?.agentConfig || this.agentInventory.get(agentId);
    if (!agentConfig) {
      throw new Error(`Agent ${agentId} not found in inventory`);
    }

    // Determine template variant based on agent category
    const templateVariant = this.determineTemplateVariant(agentConfig);

    // Generate specialized signature
    const signature = this.generateSignature(agentConfig, templateVariant);

    // Create example bank
    const exampleBank = this.generateExampleBank(agentConfig, config?.exampleBank);

    // Set optimization metrics
    const optimizationMetrics = this.generateOptimizationMetrics(agentConfig, config?.optimizationFocus);

    // Create validation rules
    const validationRules = this.generateValidationRules(agentConfig);

    // Generate compliance checks
    const complianceChecks = this.generateComplianceChecks(agentConfig);

    // Add specialization constraints
    const specializationConstraints = this.generateSpecializationConstraints(agentConfig, config?.customConstraints);

    return {
      signature,
      exampleBank,
      optimizationMetrics,
      validationRules,
      complianceChecks,
      specializationConstraints
    };
  }

  private determineTemplateVariant(agentConfig: AgentConfig): string {
    const categoryMapping: Record<string, string> = {
      'development': 'development',
      'architecture': 'architecture',
      'testing': 'testing',
      'quality': 'testing',
      'coordination': 'coordination',
      'security': 'security',
      'research': 'research',
      'automation': 'performance',
      'integration': 'repository',
      'planning': 'coordination'
    };

    return categoryMapping[agentConfig.category] || 'development';
  }

  private generateSignature(agentConfig: AgentConfig, variant: string): string {
    const baseInputs = [
      'task_description: str',
      'context: AgentContext',
      'requirements: ComplianceRequirements'
    ];

    const categorySpecificInputs = this.getCategorySpecificInputs(agentConfig.category);
    const allInputs = [...baseInputs, ...categorySpecificInputs];

    const baseOutputs = [
      'implementation: str',
      'compliance_report: ComplianceReport',
      'quality_metrics: QualityMetrics'
    ];

    const categorySpecificOutputs = this.getCategorySpecificOutputs(agentConfig.category);
    const allOutputs = [...baseOutputs, ...categorySpecificOutputs];

    return `
class ${this.toPascalCase(agentConfig.agent_id)}Signature(dspy.Signature):
    """${agentConfig.agent_type} - ${agentConfig.capabilities.join(', ')}"""

    # Input fields
    ${allInputs.map(input => `${input} = dspy.InputField()`).join('\n    ')}

    # Output fields
    ${allOutputs.map(output => `${output} = dspy.OutputField()`).join('\n    ')}

    # Agent-specific constraints
    CATEGORY = "${agentConfig.category}"
    MODEL = "${agentConfig.model_assignment}"
    MCP_SERVERS = ${JSON.stringify(agentConfig.mcp_servers)}
    CAPABILITIES = ${JSON.stringify(agentConfig.capabilities)}
    HIERARCHY_LEVEL = "${agentConfig.hierarchy_level}"
    FSM_MODE = "${agentConfig.fsm_mode || 'optional'}"

    # Quality gates
    NASA_COMPLIANCE_REQUIRED = ${agentConfig.fsm_mode ? 'True' : 'True'}
    FSM_PATTERNS_REQUIRED = ${agentConfig.fsm_mode === 'required' || agentConfig.fsm_mode === 'enforced'}
    PRODUCTION_QUALITY_REQUIRED = True
    THEATER_DETECTION_ENABLED = True
`;
  }

  private getCategorySpecificInputs(category: string): string[] {
    const categoryInputs: Record<string, string[]> = {
      'development': [
        'code_context: str',
        'test_requirements: TestRequirements',
        'api_specifications: ApiSpecs'
      ],
      'architecture': [
        'system_requirements: SystemRequirements',
        'existing_architecture: ArchitectureContext',
        'scalability_constraints: ScalabilityRequirements'
      ],
      'testing': [
        'test_scenarios: TestScenarios',
        'coverage_requirements: CoverageRequirements',
        'performance_budgets: PerformanceBudgets'
      ],
      'coordination': [
        'agent_hierarchy: AgentHierarchy',
        'communication_protocols: CommunicationProtocols',
        'coordination_constraints: CoordinationConstraints'
      ],
      'security': [
        'security_requirements: SecurityRequirements',
        'threat_model: ThreatModel',
        'compliance_standards: ComplianceStandards'
      ],
      'research': [
        'research_scope: ResearchScope',
        'information_sources: InformationSources',
        'analysis_depth: AnalysisDepth'
      ]
    };

    return categoryInputs[category] || [];
  }

  private getCategorySpecificOutputs(category: string): string[] {
    const categoryOutputs: Record<string, string[]> = {
      'development': [
        'implementation_details: ImplementationDetails',
        'test_coverage_report: TestCoverageReport',
        'api_documentation: ApiDocumentation'
      ],
      'architecture': [
        'architecture_design: ArchitectureDesign',
        'component_specifications: ComponentSpecs',
        'integration_plan: IntegrationPlan'
      ],
      'testing': [
        'test_suite: TestSuite',
        'coverage_analysis: CoverageAnalysis',
        'performance_metrics: PerformanceMetrics'
      ],
      'coordination': [
        'coordination_plan: CoordinationPlan',
        'agent_assignments: AgentAssignments',
        'communication_flows: CommunicationFlows'
      ],
      'security': [
        'security_analysis: SecurityAnalysis',
        'vulnerability_assessment: VulnerabilityAssessment',
        'mitigation_strategies: MitigationStrategies'
      ],
      'research': [
        'research_findings: ResearchFindings',
        'analysis_report: AnalysisReport',
        'recommendations: Recommendations'
      ]
    };

    return categoryOutputs[category] || [];
  }

  private generateExampleBank(agentConfig: AgentConfig, customExamples?: any[]): string {
    const examples = customExamples || this.getDefaultExamples(agentConfig);

    return `
# Example bank for ${agentConfig.agent_id}
examples = [
${examples.map((example, index) => `    dspy.Example(
        task_description="${example.input}",
        expected_implementation="${example.expected_output}",
        quality_score=${example.quality_score || 0.9}
    ).with_inputs("task_description")`).join(',\n')}
]

# Example categories
EXAMPLE_CATEGORIES = {
    "nasa_compliant": [ex for ex in examples if ex.quality_score >= 0.95],
    "fsm_patterns": [ex for ex in examples if "StateContract" in ex.expected_implementation],
    "production_ready": [ex for ex in examples if "TODO" not in ex.expected_implementation]
}
`;
  }

  private getDefaultExamples(agentConfig: AgentConfig): any[] {
    const categoryExamples: Record<string, any[]> = {
      'development': [
        {
          input: "Implement user authentication with FSM patterns",
          expected_output: "class AuthenticationState implements StateContract { init() { /* setup */ } update(ctx, event) { /* handle login/logout */ } }",
          quality_score: 0.95
        },
        {
          input: "Create API endpoint with error handling",
          expected_output: "function handleRequest(req: Request): Response { assert(req.body); assert(req.headers); /* implementation */ }",
          quality_score: 0.92
        }
      ],
      'architecture': [
        {
          input: "Design microservices architecture with state management",
          expected_output: "SystemArchitecture with FSM-based service coordination, event-driven communication",
          quality_score: 0.94
        }
      ],
      'testing': [
        {
          input: "Create comprehensive test suite with 95% coverage",
          expected_output: "TestSuite with state transition testing, assertion coverage, performance bounds",
          quality_score: 0.96
        }
      ]
    };

    return categoryExamples[agentConfig.category] || [
      {
        input: "Generic task for " + agentConfig.agent_type,
        expected_output: "Implementation following NASA Rule 10 and production standards",
        quality_score: 0.90
      }
    ];
  }

  private generateOptimizationMetrics(agentConfig: AgentConfig, focusAreas?: string[]): string {
    const baseCriteria = OPTIMIZATION_CRITERIA;
    const categorySpecificCriteria = this.getCategorySpecificCriteria(agentConfig.category);
    const allCriteria = [...baseCriteria, ...categorySpecificCriteria];

    const focusedCriteria = focusAreas ?
      allCriteria.filter(criterion => focusAreas.some(focus => criterion.includes(focus))) :
      allCriteria;

    return `
# Optimization metrics for ${agentConfig.agent_id}
OPTIMIZATION_CRITERIA = [
${focusedCriteria.map(criterion => `    "${criterion}"`).join(',\n')}
]

# Priority weights based on agent role
METRIC_WEIGHTS = {
    "nasa_compliance": ${agentConfig.optimization_priority === 'critical' ? '1.0' : '0.9'},
    "fsm_patterns": ${agentConfig.fsm_mode === 'required' ? '1.0' : '0.8'},
    "production_quality": ${agentConfig.hierarchy_level === 'queen' ? '1.0' : '0.9'},
    "theater_detection": 1.0,  # Always critical
    "type_safety": ${agentConfig.model_assignment === 'CLAUDE_OPUS' ? '1.0' : '0.9'},
    "test_coverage": ${agentConfig.category === 'testing' ? '1.0' : '0.8'}
}

# Success thresholds
SUCCESS_THRESHOLDS = {
    "overall_score": ${agentConfig.optimization_priority === 'critical' ? '0.98' : '0.95'},
    "nasa_compliance": 1.0,  # Must be perfect
    "theater_score_max": 60  # Lower is better
}
`;
  }

  private getCategorySpecificCriteria(category: string): string[] {
    const categoryCriteria: Record<string, string[]> = {
      'development': [
        'code_maintainability >= 90%',
        'api_consistency >= 95%',
        'error_handling_completeness >= 100%'
      ],
      'architecture': [
        'system_scalability >= 95%',
        'component_decoupling >= 90%',
        'architectural_consistency >= 98%'
      ],
      'testing': [
        'test_reliability >= 99%',
        'assertion_density >= 10%',
        'test_execution_time <= 30s'
      ],
      'coordination': [
        'message_ordering_correctness >= 100%',
        'deadlock_freedom >= 100%',
        'agent_coordination_efficiency >= 90%'
      ],
      'security': [
        'vulnerability_detection >= 99%',
        'access_control_completeness >= 100%',
        'audit_trail_completeness >= 100%'
      ]
    };

    return categoryCriteria[category] || [];
  }

  private generateValidationRules(agentConfig: AgentConfig): string {
    return `
# Validation rules for ${agentConfig.agent_id}
def validate_${agentConfig.agent_id.replace('-', '_')}_output(prediction):
    errors = []

    # NASA Rule 10 validation
    nasa_violations = validate_nasa_rule_10(prediction.implementation)
    errors.extend(nasa_violations)

    # FSM pattern validation (if required)
    if "${agentConfig.fsm_mode}" in ["required", "enforced"]:
        fsm_violations = validate_fsm_patterns(prediction.implementation)
        errors.extend(fsm_violations)

    # Category-specific validation
    category_violations = validate_${agentConfig.category}_requirements(prediction)
    errors.extend(category_violations)

    # Model-specific validation
    model_violations = validate_${agentConfig.model_assignment.toLowerCase()}_output(prediction)
    errors.extend(model_violations)

    # Capability validation
    for capability in ${JSON.stringify(agentConfig.capabilities)}:
        capability_violations = validate_capability(prediction, capability)
        errors.extend(capability_violations)

    return {
        "is_valid": len(errors) == 0,
        "errors": errors,
        "agent_id": "${agentConfig.agent_id}",
        "validation_timestamp": datetime.now().isoformat()
    }

# Agent-specific quality gates
QUALITY_GATES = {
    "nasa_compliance": lambda x: x >= 100,
    "fsm_patterns": lambda x: x >= ${agentConfig.fsm_mode === 'required' ? '100' : '95'},
    "production_quality": lambda x: x >= 98,
    "theater_score": lambda x: x < 60,
    "model_consistency": lambda x: x >= 90
}
`;
  }

  private generateComplianceChecks(agentConfig: AgentConfig): string {
    return `
# Compliance checks for ${agentConfig.agent_id}
class ${this.toPascalCase(agentConfig.agent_id)}ComplianceChecker:

    @staticmethod
    def check_nasa_rule_10(implementation: str) -> Dict[str, Any]:
        """NASA Rule 10 compliance check"""
        violations = []

        # Function length check (max 60 lines)
        functions = extract_functions(implementation)
        for func in functions:
            if func.line_count > 60:
                violations.append(f"Function {func.name} exceeds 60 lines")

        # Assertion check (min 2 per function)
        for func in functions:
            if func.assertion_count < 2:
                violations.append(f"Function {func.name} has insufficient assertions")

        # Recursion check
        if has_recursion(implementation):
            violations.append("Recursion detected")

        # Dynamic loop check
        dynamic_loops = find_dynamic_loops(implementation)
        if dynamic_loops:
            violations.append(f"Dynamic loops found: {dynamic_loops}")

        return {
            "compliant": len(violations) == 0,
            "violations": violations,
            "score": max(0, 100 - len(violations) * 25)
        }

    @staticmethod
    def check_fsm_patterns(implementation: str) -> Dict[str, Any]:
        """FSM pattern compliance check"""
        violations = []

        # State isolation check
        if not has_state_isolation(implementation):
            violations.append("States not isolated in separate files")

        # Centralized transitions check
        if not has_centralized_transitions(implementation):
            violations.append("Transitions not centralized")

        # String literal check
        if has_string_literals_for_events(implementation):
            violations.append("String literals used instead of enums")

        # Contract implementation check
        if not implements_state_contract(implementation):
            violations.append("StateContract not fully implemented")

        return {
            "compliant": len(violations) == 0,
            "violations": violations,
            "score": max(0, 100 - len(violations) * 20)
        }

    @staticmethod
    def check_production_quality(implementation: str) -> Dict[str, Any]:
        """Production quality compliance check"""
        violations = []

        # TODO/placeholder check
        if has_placeholders(implementation):
            violations.append("TODO/placeholder implementations found")

        # Unicode check
        if has_unicode(implementation):
            violations.append("Unicode characters detected")

        # Single responsibility check
        if not follows_srp(implementation):
            violations.append("Single Responsibility Principle violation")

        # Dependency injection check
        if not uses_dependency_injection(implementation):
            violations.append("Dependency injection not used")

        return {
            "compliant": len(violations) == 0,
            "violations": violations,
            "score": max(0, 100 - len(violations) * 15)
        }

    @staticmethod
    def check_theater_detection(implementation: str) -> Dict[str, Any]:
        """Theater detection (fake work identification)"""
        indicators = []
        score = 0

        # Placeholder detection
        placeholder_count = count_placeholders(implementation)
        if placeholder_count > 0:
            score += placeholder_count * 20
            indicators.append(f"{placeholder_count} placeholders")

        # Empty function detection
        empty_functions = count_empty_functions(implementation)
        if empty_functions > 0:
            score += empty_functions * 15
            indicators.append(f"{empty_functions} empty functions")

        # Complexity analysis
        if is_suspiciously_simple(implementation):
            score += 25
            indicators.append("Suspiciously simple for complex task")

        return {
            "theater_score": min(score, 100),
            "indicators": indicators,
            "is_genuine": score < 60
        }

# Compliance orchestrator
def run_full_compliance_check(implementation: str) -> Dict[str, Any]:
    checker = ${this.toPascalCase(agentConfig.agent_id)}ComplianceChecker()

    nasa_result = checker.check_nasa_rule_10(implementation)
    fsm_result = checker.check_fsm_patterns(implementation)
    quality_result = checker.check_production_quality(implementation)
    theater_result = checker.check_theater_detection(implementation)

    overall_score = (
        nasa_result["score"] * 0.3 +
        fsm_result["score"] * 0.25 +
        quality_result["score"] * 0.25 +
        (100 - theater_result["theater_score"]) * 0.2
    )

    return {
        "overall_score": overall_score,
        "overall_compliant": overall_score >= 95,
        "nasa_compliance": nasa_result,
        "fsm_patterns": fsm_result,
        "production_quality": quality_result,
        "theater_detection": theater_result,
        "agent_id": "${agentConfig.agent_id}",
        "timestamp": datetime.now().isoformat()
    }
`;
  }

  private generateSpecializationConstraints(agentConfig: AgentConfig, customConstraints?: Record<string, any>): string {
    const constraints = customConstraints || this.getDefaultConstraints(agentConfig);

    return `
# Specialization constraints for ${agentConfig.agent_id}
SPECIALIZATION_CONSTRAINTS = {
    "category": "${agentConfig.category}",
    "hierarchy_level": "${agentConfig.hierarchy_level}",
    "model_assignment": "${agentConfig.model_assignment}",
    "mcp_servers": ${JSON.stringify(agentConfig.mcp_servers)},
    "capabilities": ${JSON.stringify(agentConfig.capabilities)},
    "fsm_mode": "${agentConfig.fsm_mode || 'optional'}",

    # Domain-specific constraints
    ${Object.entries(constraints).map(([key, value]) =>
      `"${key}": ${JSON.stringify(value)}`
    ).join(',\n    ')},

    # Performance constraints
    "max_response_time": ${this.getResponseTimeLimit(agentConfig)},
    "max_memory_usage": ${this.getMemoryLimit(agentConfig)},
    "max_token_count": ${this.getTokenLimit(agentConfig)},

    # Quality constraints
    "min_test_coverage": ${agentConfig.category === 'testing' ? '95' : '80'},
    "max_function_length": 60,
    "min_assertions_per_function": 2,
    "max_theater_score": 60
}

# Enforcement rules
ENFORCEMENT_RULES = {
    "strict_nasa_compliance": True,
    "require_fsm_for_stateful_operations": ${agentConfig.fsm_mode === 'required'},
    "enforce_production_standards": True,
    "enable_theater_detection": True,
    "validate_model_consistency": True,
    "check_mcp_server_compatibility": True
}
`;
  }

  private getDefaultConstraints(agentConfig: AgentConfig): Record<string, any> {
    const categoryConstraints: Record<string, Record<string, any>> = {
      'development': {
        'code_style': 'enterprise',
        'test_driven': true,
        'api_first': true,
        'error_handling': 'comprehensive'
      },
      'architecture': {
        'scalability_first': true,
        'component_isolation': true,
        'event_driven_design': true,
        'documentation_required': true
      },
      'testing': {
        'coverage_minimum': 95,
        'performance_testing': true,
        'security_testing': true,
        'automated_testing': true
      },
      'coordination': {
        'message_ordering': true,
        'deadlock_prevention': true,
        'state_synchronization': true,
        'timeout_handling': true
      },
      'security': {
        'zero_trust': true,
        'input_validation': true,
        'output_sanitization': true,
        'audit_logging': true
      }
    };

    return categoryConstraints[agentConfig.category] || {};
  }

  private getResponseTimeLimit(agentConfig: AgentConfig): number {
    const limits: Record<string, number> = {
      'critical': 5000,  // 5 seconds
      'high': 10000,     // 10 seconds
      'medium': 30000,   // 30 seconds
      'low': 60000       // 60 seconds
    };

    return limits[agentConfig.optimization_priority] || 30000;
  }

  private getMemoryLimit(agentConfig: AgentConfig): number {
    const limits: Record<string, number> = {
      'queen': 2048,     // 2GB
      'princess': 1024,  // 1GB
      'drone': 512       // 512MB
    };

    return limits[agentConfig.hierarchy_level] || 512;
  }

  private getTokenLimit(agentConfig: AgentConfig): number {
    const limits: Record<string, number> = {
      'GPT5': 128000,
      'GEMINI_PRO': 1000000,
      'CLAUDE_OPUS': 200000,
      'CLAUDE_SONNET': 200000,
      'GEMINI_FLASH': 1000000
    };

    return limits[agentConfig.model_assignment] || 128000;
  }

  private toPascalCase(str: string): string {
    return str.split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
  }

  // Generate template for specific agent
  async generateAndSaveTemplate(agentId: string, outputPath: string, config?: TemplateGenerationConfig): Promise<void> {
    const template = this.generateTemplateForAgent(agentId, config);

    const fullTemplate = `# DSPy Template for ${agentId}
# Generated by AgentTemplateGenerator
# Date: ${new Date().toISOString()}

import dspy
from datetime import datetime
from typing import Dict, Any, List

${template.signature}

${template.exampleBank}

${template.optimizationMetrics}

${template.validationRules}

${template.complianceChecks}

${template.specializationConstraints}

# Export the optimized agent class
class Optimized${this.toPascalCase(agentId)}(dspy.Module):
    def __init__(self):
        super().__init__()
        self.signature = ${this.toPascalCase(agentId)}Signature()
        self.chain_of_thought = dspy.ChainOfThought(self.signature)

    def forward(self, **kwargs):
        # Pre-processing validation
        validation_result = validate_${agentId.replace('-', '_')}_output(kwargs)
        if not validation_result["is_valid"]:
            raise ValueError(f"Input validation failed: {validation_result['errors']}")

        # Execute the signature
        prediction = self.chain_of_thought(**kwargs)

        # Post-processing compliance check
        compliance_result = run_full_compliance_check(prediction.implementation)
        if not compliance_result["overall_compliant"]:
            raise ValueError(f"Compliance check failed: {compliance_result}")

        return prediction

# Template metadata
TEMPLATE_METADATA = {
    "agent_id": "${agentId}",
    "template_version": "1.0.0",
    "generated_at": "${new Date().toISOString()}",
    "optimization_criteria": OPTIMIZATION_CRITERIA,
    "specialization_constraints": SPECIALIZATION_CONSTRAINTS,
    "quality_gates": QUALITY_GATES
}
`;

    try {
      const fs = await import('fs/promises');
      await fs.writeFile(outputPath, fullTemplate, 'utf-8');
      console.log(`Template generated for ${agentId} at ${outputPath}`);
    } catch (error) {
      throw new Error(`Failed to save template: ${error.message}`);
    }
  }
}

export { AgentTemplateGenerator, TemplateGenerationConfig, GeneratedTemplate };

/* AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE */
// Version & Run Log
// Version History

// Version: 1.0.0

// Receipt
// status: OK
// reason_if_blocked: --
// run_id: template-generator-001
// inputs: ["MasterAgentTemplate.ts"]
// tools_used: ["filesystem", "memory"]
// versions: {"model":"gemini-2.5-pro","prompt":"agent-template-generator-v1.0"}
// === END FOOTER ===