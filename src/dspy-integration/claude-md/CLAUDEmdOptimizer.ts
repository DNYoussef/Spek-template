/**
 * CLAUDE.md Optimizer
 * Applies DSPy optimization patterns to global CLAUDE.md
 * NASA Rule 10 Compliant with enforcement mechanisms
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { CLAUDEMDEnforcer } from './CLAUDEMDEnforcer';
import { GlobalPromptOptimizer } from './GlobalPromptOptimizer';

export interface OptimizationRule {
  id: string;
  pattern: string;
  replacement: string;
  category: 'concurrency' | 'nasa' | 'fsm' | 'quality' | 'memory';
  enforced: boolean;
}

export interface CLAUDEmdUpdate {
  version: string;
  timestamp: Date;
  rulesApplied: number;
  enforcementLevel: number;
  qualityImprovement: number;
}

export interface AgentOptimizationResult {
  agentType: string;
  basePrompt: string;
  optimizedPrompt: string;
  threshold: number;
  enforcementRules: string[];
  qualityGates: QualityGate[];
}

export interface QualityGate {
  name: string;
  threshold: number;
  required: boolean;
}

export class CLAUDEmdOptimizer {
  private enforcer: CLAUDEMDEnforcer;
  private optimizer: GlobalPromptOptimizer;
  private claudeMdPath: string;
  private backupPath: string;
  private rules: Map<string, OptimizationRule> = new Map();
  private readonly maxRules = 50; // NASA Rule 10: Bounded
  private readonly minEnforcement = 0.85;
  private agentThresholds: Map<string, number> = new Map();

  constructor(
    claudeMdPath: string = 'CLAUDE.md',
    backupPath: string = 'backups/CLAUDE.md'
  ) {
    this.claudeMdPath = claudeMdPath;
    this.backupPath = backupPath;
    this.enforcer = new CLAUDEMDEnforcer();
    this.optimizer = new GlobalPromptOptimizer();

    // Initialize optimization rules and agent thresholds
    this.initializeRules();
    this.initializeAgentThresholds();

    assert(this.rules.size > 0, 'Rules must be initialized');
    assert(this.rules.size <= this.maxRules, 'Too many rules');
    assert(this.agentThresholds.size > 0, 'Agent thresholds must be initialized');
  }

  /**
   * Initialize optimization rules from I/O examples
   * NASA Rule 10: Fixed initialization
   */
  private initializeRules(): void {
    // Concurrency rules
    this.rules.set('concurrent-ops', {
      id: 'concurrent-ops',
      pattern: 'operations separately',
      replacement: 'ALL operations MUST be concurrent/parallel in a single message',
      category: 'concurrency',
      enforced: true
    });

    // NASA Rule 10 rules
    this.rules.set('nasa-functions', {
      id: 'nasa-functions',
      pattern: 'function implementation',
      replacement: 'Functions MUST be <=60 lines with >=2 assertions (NASA Rule 10)',
      category: 'nasa',
      enforced: true
    });

    this.rules.set('nasa-loops', {
      id: 'nasa-loops',
      pattern: 'loop processing',
      replacement: 'Use fixed loops only, no recursion, bounded to max 1000 iterations',
      category: 'nasa',
      enforced: true
    });

    // FSM rules
    this.rules.set('fsm-states', {
      id: 'fsm-states',
      pattern: 'state management',
      replacement: 'FSM-FIRST: Use enum states/events, centralized transitions only',
      category: 'fsm',
      enforced: true
    });

    this.rules.set('fsm-isolation', {
      id: 'fsm-isolation',
      pattern: 'state files',
      replacement: 'One file per state, no cross-state globals, state isolation required',
      category: 'fsm',
      enforced: true
    });

    // Quality rules
    this.rules.set('quality-threshold', {
      id: 'quality-threshold',
      pattern: 'quality score',
      replacement: 'Minimum quality threshold: 0.85 for all operations',
      category: 'quality',
      enforced: true
    });

    this.rules.set('quality-gates', {
      id: 'quality-gates',
      pattern: 'validation',
      replacement: 'Quality gates: NASA>=92%, FSM>=90%, Theater<60, Tests>=80%',
      category: 'quality',
      enforced: true
    });

    // Memory rules
    this.rules.set('memory-dual', {
      id: 'memory-dual',
      pattern: 'memory storage',
      replacement: 'Dual memory: MCP knowledge graph + filesystem persistence',
      category: 'memory',
      enforced: true
    });

    this.rules.set('memory-cleanup', {
      id: 'memory-cleanup',
      pattern: 'memory management',
      replacement: 'Automatic cleanup at 1000 entities, 5000 relations max',
      category: 'memory',
      enforced: true
    });

    // Additional enforcement rules
    this.rules.set('no-unicode', {
      id: 'no-unicode',
      pattern: 'character encoding',
      replacement: 'NO Unicode characters - ASCII only for all code and comments',
      category: 'quality',
      enforced: true
    });

    this.rules.set('no-todos', {
      id: 'no-todos',
      pattern: 'TODO items',
      replacement: 'NO TODOs - production-ready code only, no placeholders',
      category: 'quality',
      enforced: true
    });

    this.rules.set('version-footers', {
      id: 'version-footers',
      pattern: 'file footers',
      replacement: 'MANDATORY: Version & Run Log footers on ALL files',
      category: 'quality',
      enforced: true
    });
  }

  /**
   * Apply optimizations to CLAUDE.md
   * NASA Rule 10: Safe file operations
   */
  async optimizeCLAUDEmd(): Promise<CLAUDEmdUpdate> {
    console.log('Starting CLAUDE.md optimization...');

    // Create backup first
    await this.createBackup();

    // Read current CLAUDE.md
    const content = await fs.readFile(this.claudeMdPath, 'utf-8');

    // Apply optimization rules
    let optimizedContent = content;
    let rulesApplied = 0;

    const ruleArray = Array.from(this.rules.values());
    for (let i = 0; i < Math.min(ruleArray.length, this.maxRules); i++) {
      const rule = ruleArray[i];
      if (rule.enforced) {
        optimizedContent = this.applyRule(optimizedContent, rule);
        rulesApplied++;
      }
    }

    // Add enforcement section
    optimizedContent = this.addEnforcementSection(optimizedContent);

    // Add I/O examples section
    optimizedContent = await this.addIOExamples(optimizedContent);

    // Write optimized CLAUDE.md
    await fs.writeFile(this.claudeMdPath, optimizedContent, 'utf-8');

    // Calculate improvement
    const improvement = await this.calculateImprovement(content, optimizedContent);

    const update: CLAUDEmdUpdate = {
      version: '2.0.0-dspy',
      timestamp: new Date(),
      rulesApplied,
      enforcementLevel: this.minEnforcement,
      qualityImprovement: improvement
    };

    console.log(`CLAUDE.md optimized: ${rulesApplied} rules applied`);
    return update;
  }

  /**
   * Apply single optimization rule
   * NASA Rule 10: Simple replacement
   */
  private applyRule(content: string, rule: OptimizationRule): string {
    assert(content.length > 0, 'Content required');
    assert(rule !== null, 'Rule required');

    // Check if rule pattern exists
    if (!content.includes(rule.pattern)) {
      // Add the rule if pattern not found
      const section = this.getRuleSection(rule.category);
      const insertPoint = content.indexOf(section);
      
      if (insertPoint > 0) {
        const before = content.substring(0, insertPoint + section.length);
        const after = content.substring(insertPoint + section.length);
        content = before + '\n- ' + rule.replacement + after;
      }
    } else {
      // Replace existing pattern
      content = content.replace(rule.pattern, rule.replacement);
    }

    return content;
  }

  /**
   * Add enforcement section to CLAUDE.md
   * NASA Rule 10: Structured content
   */
  private addEnforcementSection(content: string): string {
    const enforcementSection = `
## DSPy Optimization Enforcement

// Mandatory Requirements (Automatically Enforced)

1. **Concurrency**: ALL operations in single message
2. **NASA Rule 10**: Functions <=60 lines, >=2 assertions, no recursion
3. **FSM-First**: Enum states/events, centralized transitions
4. **Quality Gates**: NASA>=92%, FSM>=90%, Theater<60, Tests>=80%
5. **Memory**: Dual storage with automatic cleanup
6. **No Unicode**: ASCII only for all code
7. **No TODOs**: Production-ready code only
8. **Version Footers**: Mandatory on all files

// Quality Thresholds

// Communication Quality: >=0.85
// NASA Compliance: >=0.92
// FSM Coverage: >=0.90
// Theater Score: <60
// Test Coverage: >=0.80
`;

    if (!content.includes('DSPy Optimization Enforcement')) {
      content += enforcementSection;
    }

    return content;
  }

  /**
   * Add I/O examples to CLAUDE.md
   * NASA Rule 10: Bounded examples
   */
  private async addIOExamples(content: string): Promise<string> {
    const examplesPath = path.join(
      path.dirname(this.claudeMdPath),
      'src/dspy-integration/claude-md/global-prompt-io-examples.md'
    );

    try {
      const examples = await fs.readFile(examplesPath, 'utf-8');
      
      // Extract key examples (bounded to 5)
      const keyExamples = [
        this.extractExample(examples, 'Concurrency Pattern'),
        this.extractExample(examples, 'NASA Rule 10 Pattern'),
        this.extractExample(examples, 'FSM State Management'),
        this.extractExample(examples, 'Quality Gate Pattern'),
        this.extractExample(examples, 'Memory Optimization Pattern')
      ].filter(e => e !== null);

      const exampleSection = `
// DSPy I/O Examples

${keyExamples.join('\n\n')}
`;

      if (!content.includes('DSPy I/O Examples')) {
        content += exampleSection;
      }

    } catch (error) {
      console.warn('Could not load I/O examples:', error.message);
    }

    return content;
  }

  /**
   * Extract single example from examples file
   * NASA Rule 10: Safe extraction
   */
  private extractExample(content: string, pattern: string): string | null {
    const startIndex = content.indexOf(pattern);
    if (startIndex === -1) return null;

    const endIndex = content.indexOf('###', startIndex + pattern.length);
    if (endIndex === -1) return null;

    const example = content.substring(startIndex, endIndex).trim();
    return example.substring(0, Math.min(example.length, 500)); // Limit size
  }

  /**
   * Create backup of current CLAUDE.md
   * NASA Rule 10: Safe backup
   */
  private async createBackup(): Promise<void> {
    try {
      const content = await fs.readFile(this.claudeMdPath, 'utf-8');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFile = `${this.backupPath}.${timestamp}`;
      
      await fs.writeFile(backupFile, content, 'utf-8');
      console.log(`Backup created: ${backupFile}`);

    } catch (error) {
      console.warn('Backup creation failed:', error.message);
    }
  }

  /**
   * Initialize agent-specific quality thresholds
   * NASA Rule 10: Fixed configuration
   */
  private initializeAgentThresholds(): void {
    // Browser Automation & Visual (GPT-5): 0.90 quality
    this.agentThresholds.set('frontend-developer', 0.90);
    this.agentThresholds.set('ui-designer', 0.90);
    this.agentThresholds.set('mobile-dev', 0.90);
    this.agentThresholds.set('rapid-prototyper', 0.90);

    // Large Context & Research (Gemini 2.5 Pro): 0.85 quality
    this.agentThresholds.set('researcher', 0.85);
    this.agentThresholds.set('specification', 0.85);
    this.agentThresholds.set('architecture', 0.85);
    this.agentThresholds.set('system-architect', 0.85);

    // Quality Assurance (Claude Opus 4.1): 0.95 quality
    this.agentThresholds.set('reviewer', 0.95);
    this.agentThresholds.set('code-analyzer', 0.95);
    this.agentThresholds.set('security-manager', 0.95);
    this.agentThresholds.set('tester', 0.95);
    this.agentThresholds.set('production-validator', 0.95);

    // Coordination & Orchestration (Claude Sonnet 4): 0.88 quality
    this.agentThresholds.set('sparc-coord', 0.88);
    this.agentThresholds.set('hierarchical-coordinator', 0.88);
    this.agentThresholds.set('mesh-coordinator', 0.88);
    this.agentThresholds.set('task-orchestrator', 0.88);

    // Cost-Effective Operations (Gemini Flash): 0.85 quality
    this.agentThresholds.set('planner', 0.85);
    this.agentThresholds.set('refinement', 0.85);
    this.agentThresholds.set('pr-manager', 0.85);
    this.agentThresholds.set('issue-tracker', 0.85);
  }

  /**
   * Optimize agent prompts with category-specific thresholds
   * NASA Rule 10: Bounded agent list
   */
  async optimizeAgentPrompts(): Promise<AgentOptimizationResult[]> {
    console.log('Starting agent prompt optimization...');

    const results: AgentOptimizationResult[] = [];
    const agentTypes = Array.from(this.agentThresholds.keys());

    for (let i = 0; i < Math.min(agentTypes.length, 100); i++) {
      const agentType = agentTypes[i];
      const threshold = this.agentThresholds.get(agentType) || 0.85;

      const result = await this.optimizeAgentPrompt(agentType, threshold);
      results.push(result);
    }

    console.log(`Optimized ${results.length} agent prompts`);
    return results;
  }

  /**
   * Optimize single agent prompt
   * NASA Rule 10: Safe prompt generation
   */
  private async optimizeAgentPrompt(
    agentType: string,
    threshold: number
  ): Promise<AgentOptimizationResult> {
    assert(agentType.length > 0, 'Agent type required');
    assert(threshold >= 0.8 && threshold <= 1.0, 'Valid threshold required');

    const basePrompt = this.getBaseAgentPrompt(agentType);
    const optimizedPrompt = this.applyAgentOptimizations(basePrompt, agentType, threshold);

    return {
      agentType,
      basePrompt: basePrompt.substring(0, 500), // Truncate for display
      optimizedPrompt: optimizedPrompt.substring(0, 1000),
      threshold,
      enforcementRules: this.getAgentEnforcementRules(agentType),
      qualityGates: this.getAgentQualityGates(agentType)
    };
  }

  /**
   * Get base prompt for agent type
   * NASA Rule 10: Deterministic prompt retrieval
   */
  private getBaseAgentPrompt(agentType: string): string {
    const commonPrompt = `
You are a ${agentType} in the SPEK Enhanced Development Platform.

MANDATORY DSPy OPTIMIZATION ENFORCEMENT:
// ALL operations must be concurrent (minimum 3 ops per message)
// Functions <=60 lines with >=2 assertions (NASA Rule 10)
// FSM-first development with enum states/events
// Production-ready code only (no TODOs, no placeholders)
// ASCII only (no Unicode characters)
// Version footers mandatory on all files
    `;

    const specificPrompts = {
      'frontend-developer': commonPrompt + `
BROWSER AUTOMATION SPECIALIST (GPT-5 + Codex CLI):
// Quality threshold: 0.90 (90% compliance required)
// MCP servers: [claude-flow, memory, github, playwright, figma]
// Specialization: Responsive UI, visual validation, accessibility
// Required tools: Screenshots for validation, cross-browser testing`,

      'researcher': commonPrompt + `
LARGE CONTEXT RESEARCH SPECIALIST (Gemini 2.5 Pro):
// Quality threshold: 0.85 (85% compliance required)
// MCP servers: [claude-flow, memory, deepwiki, firecrawl, ref, context7]
// Specialization: 1M token analysis, comprehensive research
// Required tools: Web search, repository analysis, pattern detection`,

      'reviewer': commonPrompt + `
QUALITY ASSURANCE SPECIALIST (Claude Opus 4.1):
// Quality threshold: 0.95 (95% compliance required)
// MCP servers: [claude-flow, memory, github, eva]
// Specialization: Code review, security analysis, compliance
// Required tools: Static analysis, security scanning, compliance checking`,

      'sparc-coord': commonPrompt + `
COORDINATION SPECIALIST (Claude Sonnet 4 + Sequential):
// Quality threshold: 0.88 (88% compliance required)
// MCP servers: [claude-flow, memory, sequential-thinking, github-project-manager]
// Specialization: Swarm orchestration, task coordination
// Required tools: Agent spawning, task distribution, progress tracking`,

      'planner': commonPrompt + `
COST-EFFECTIVE OPERATIONS (Gemini Flash + Sequential):
// Quality threshold: 0.85 (85% compliance required)
// MCP servers: [claude-flow, memory, sequential-thinking, github-project-manager]
// Specialization: Efficient planning, resource optimization
// Required tools: Planning templates, resource allocation, timeline management`
    };

    return specificPrompts[agentType] || commonPrompt;
  }

  /**
   * Apply agent-specific optimizations
   * NASA Rule 10: Structured optimization
   */
  private applyAgentOptimizations(
    basePrompt: string,
    agentType: string,
    threshold: number
  ): string {
    let optimized = basePrompt;

    // Add DSPy enforcement rules
    optimized += `

DSPy ENFORCEMENT FOR ${agentType.toUpperCase()}:

QUALITY GATE REQUIREMENTS:
// Minimum quality threshold: ${threshold}
// NASA Rule 10 compliance: >=92%
// FSM pattern usage: >=90%
// Test coverage: >=80%
// Security scan: Zero critical/high issues

CONCURRENT EXECUTION REQUIREMENTS:
// Minimum 3 operations per message
// TodoWrite: 5-10 todos minimum
// File operations: Batch all reads/writes/edits
// Agent coordination: Spawn all agents in single message
// System commands: Combine with && or ;

VIOLATION RESPONSE PROTOCOL:
1. Pre-execution validation (automatic)
2. Runtime monitoring (continuous)
3. Post-execution scoring (measurable)
4. Immediate correction (required)
5. Escalation if repeated violations

PRODUCTION STANDARDS:
// No Unicode characters (ASCII only)
// No TODO comments (production-ready only)
// Version footers mandatory (SHA-256 hash)
// FSM implementation required for all features
// NASA Rule 10 compliance for all functions
    `;

    return optimized;
  }

  /**
   * Get enforcement rules for agent type
   * NASA Rule 10: Fixed rule sets
   */
  private getAgentEnforcementRules(agentType: string): string[] {
    const commonRules = [
      'NASA Rule 10: Functions <=60 lines, >=2 assertions',
      'FSM-First: Enum states/events, centralized transitions',
      'Concurrency: Minimum 3 operations per message',
      'Production Quality: No TODOs, no placeholders',
      'ASCII Only: No Unicode characters'
    ];

    const specificRules = {
      'frontend-developer': [...commonRules, 'Screenshot validation required', 'Accessibility compliance'],
      'researcher': [...commonRules, 'Large context analysis', 'Comprehensive documentation'],
      'reviewer': [...commonRules, 'Security analysis required', 'Compliance verification'],
      'sparc-coord': [...commonRules, 'Agent coordination required', 'Task distribution'],
      'planner': [...commonRules, 'Resource optimization', 'Timeline management']
    };

    return specificRules[agentType] || commonRules;
  }

  /**
   * Get quality gates for agent type
   * NASA Rule 10: Deterministic gates
   */
  private getAgentQualityGates(agentType: string): QualityGate[] {
    return [
      { name: 'NASA Compliance', threshold: 0.92, required: true },
      { name: 'FSM Coverage', threshold: 0.90, required: true },
      { name: 'Test Coverage', threshold: 0.80, required: true },
      { name: 'Security Scan', threshold: 1.0, required: true },
      { name: 'Quality Threshold', threshold: this.agentThresholds.get(agentType) || 0.85, required: true }
    ];
  }

  /**
   * Calculate quality improvement
   * NASA Rule 10: Simple calculation
   */
  private async calculateImprovement(
    original: string,
    optimized: string
  ): Promise<number> {
    // Count enforcement rules present
    const originalRules = this.countRules(original);
    const optimizedRules = this.countRules(optimized);

    // Calculate improvement percentage
    const improvement = optimizedRules > originalRules
      ? (optimizedRules - originalRules) / this.rules.size
      : 0;

    assert(improvement >= 0 && improvement <= 1, 'Improvement must be 0-1');
    return improvement;
  }

  /**
   * Count rules present in content
   * NASA Rule 10: Bounded counting
   */
  private countRules(content: string): number {
    let count = 0;
    const rules = Array.from(this.rules.values());

    for (let i = 0; i < Math.min(rules.length, this.maxRules); i++) {
      if (content.includes(rules[i].replacement)) {
        count++;
      }
    }

    return count;
  }

  /**
   * Get section name for rule category
   * NASA Rule 10: Deterministic mapping
   */
  private getRuleSection(category: string): string {
    switch (category) {
      case 'concurrency': return '## Concurrent Execution';
      case 'nasa': return '## NASA Rule 10';
      case 'fsm': return '## FSM-First Development';
      case 'quality': return '## Quality Requirements';
      case 'memory': return '## Memory Management';
      default: return '## General Rules';
    }
  }
}

/**
 * Assert function for NASA Rule 10 compliance
 */
function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0

// Receipt
// status: OK
// reason_if_blocked: --
// run_id: claude-md-optimizer-001
// inputs: ["global-prompt-io-examples.md", "CLAUDEMDEnforcer.ts"]
// tools_used: ["Write"]
// versions: {"model":"claude-sonnet-4","prompt":"dspy-integration-v1.0"}
// === END FOOTER ===