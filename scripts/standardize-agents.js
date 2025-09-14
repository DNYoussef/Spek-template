#!/usr/bin/env node

/**
 * Agent Standardization Script
 * Migrates existing agent definitions to the standardized template format
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// Standard agent template
const STANDARD_TEMPLATE = {
  metadata: {
    name: '',
    type: '',
    phase: '',
    category: '',
    description: '',
    capabilities: [],
    priority: 'medium',
    tools_required: [],
    mcp_servers: [],
    hooks: {
      pre: '',
      post: ''
    },
    quality_gates: [],
    artifact_contracts: {
      input: '',
      output: ''
    }
  },
  prompt: {
    identity: '',
    mission: '',
    spek_integration: {
      phase: '',
      upstream_dependencies: [],
      downstream_deliverables: []
    },
    core_responsibilities: [],
    quality_policy: {
      nasa_pot: true,
      security: 'Zero HIGH/CRITICAL',
      testing: 'Coverage >= baseline',
      size_limits: {
        loc: 25,
        files: 2
      }
    },
    tool_routing: {},
    operating_rules: [],
    communication_protocol: []
  }
};

// SPEK phase mapping
const SPEK_PHASES = {
  specification: ['specification', 'researcher', 'researcher-gemini'],
  research: ['code-analyzer', 'security-manager', 'performance-benchmarker', 'system-architect'],
  planning: ['planner', 'sparc-coord', 'task-orchestrator', 'architecture', 'pseudocode'],
  execution: ['coder', 'coder-codex', 'backend-dev', 'mobile-dev', 'ml-developer', 'tester',
              'tdd-london-swarm', 'production-validator', 'cicd-engineer'],
  knowledge: ['reviewer', 'memory-coordinator', 'api-docs', 'refinement', 'fresh-eyes-codex',
              'fresh-eyes-gemini']
};

// Agent type mapping
const AGENT_TYPES = {
  analyst: ['researcher', 'code-analyzer', 'specification'],
  developer: ['coder', 'backend-dev', 'mobile-dev', 'ml-developer'],
  coordinator: ['planner', 'task-orchestrator', 'sparc-coord'],
  quality: ['tester', 'reviewer', 'production-validator'],
  architect: ['system-architect', 'architecture'],
  security: ['security-manager'],
  documentation: ['api-docs'],
  swarm: ['hierarchical-coordinator', 'mesh-coordinator', 'adaptive-coordinator'],
  github: ['pr-manager', 'issue-tracker', 'workflow-automation'],
  consensus: ['byzantine-coordinator', 'raft-manager', 'gossip-coordinator'],
  optimization: ['perf-analyzer', 'performance-benchmarker'],
  infrastructure: ['swarm-init', 'smart-agent', 'memory-coordinator']
};

/**
 * Detect SPEK phase for an agent
 */
function detectPhase(agentName) {
  for (const [phase, agents] of Object.entries(SPEK_PHASES)) {
    if (agents.includes(agentName)) {
      return phase;
    }
  }
  return 'execution'; // default phase
}

/**
 * Detect agent type
 */
function detectType(agentName) {
  for (const [type, agents] of Object.entries(AGENT_TYPES)) {
    if (agents.includes(agentName)) {
      return type;
    }
  }
  return 'general'; // default type
}

/**
 * Parse existing agent file
 */
function parseAgentFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const agent = {
    raw: content,
    metadata: {},
    prompt: ''
  };

  // Try to extract YAML front matter
  const yamlMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (yamlMatch) {
    try {
      agent.metadata = yaml.load(yamlMatch[1]);
    } catch (e) {
      console.warn(`Failed to parse YAML in ${filePath}:`, e.message);
    }
  }

  // Extract markdown content
  const markdownStart = yamlMatch ? yamlMatch[0].length : 0;
  agent.prompt = content.substring(markdownStart).trim();

  return agent;
}

/**
 * Extract capabilities from prompt content
 */
function extractCapabilities(prompt) {
  const capabilities = [];
  const capabilityPatterns = [
    /capabilities?:\s*\n((?:[-*]\s*.+\n?)+)/gi,
    /core\s+responsibilities?:\s*\n((?:[-*\d.]\s*.+\n?)+)/gi,
    /## (?:Core )?(?:Capabilities|Responsibilities)\s*\n((?:[-*\d.]\s*.+\n?)+)/gi
  ];

  for (const pattern of capabilityPatterns) {
    const matches = prompt.matchAll(pattern);
    for (const match of matches) {
      const items = match[1].split('\n')
        .filter(line => line.trim())
        .map(line => line.replace(/^[-*\d.]\s*/, '').trim())
        .filter(item => item.length > 0);
      capabilities.push(...items);
    }
  }

  return [...new Set(capabilities)].slice(0, 5); // Return top 5 unique capabilities
}

/**
 * Standardize agent definition
 */
function standardizeAgent(agentName, agentData) {
  const standardized = JSON.parse(JSON.stringify(STANDARD_TEMPLATE));

  // Set metadata
  standardized.metadata.name = agentName;
  standardized.metadata.type = agentData.metadata.type || detectType(agentName);
  standardized.metadata.phase = agentData.metadata.sparc_phase ||
                                agentData.metadata.phase ||
                                detectPhase(agentName);
  standardized.metadata.category = agentData.metadata.category ||
                                   agentData.metadata.type ||
                                   'general';
  standardized.metadata.description = agentData.metadata.description ||
                                      `${agentName} agent for SPEK pipeline`;

  // Extract capabilities
  standardized.metadata.capabilities = agentData.metadata.capabilities ||
                                       extractCapabilities(agentData.prompt);

  standardized.metadata.priority = agentData.metadata.priority || 'medium';

  // Set hooks
  if (agentData.metadata.hooks) {
    standardized.metadata.hooks = agentData.metadata.hooks;
  } else {
    standardized.metadata.hooks.pre = `echo "[PHASE] ${standardized.metadata.phase} agent ${agentName} initiated"\nmemory_store "${standardized.metadata.phase}_start_$(date +%s)" "Task: $TASK"`;
    standardized.metadata.hooks.post = `echo "[OK] ${standardized.metadata.phase} complete"\nmemory_store "${standardized.metadata.phase}_complete_$(date +%s)" "Results stored"`;
  }

  // Set quality gates based on phase
  standardized.metadata.quality_gates = getQualityGates(standardized.metadata.phase);

  // Set artifact contracts
  standardized.metadata.artifact_contracts.input = `${standardized.metadata.phase}_input.json`;
  standardized.metadata.artifact_contracts.output = `${agentName}_output.json`;

  // Process prompt
  standardized.prompt = processPrompt(agentName, agentData.prompt, standardized.metadata);

  return standardized;
}

/**
 * Get quality gates for a phase
 */
function getQualityGates(phase) {
  const gates = {
    specification: ['requirements_complete', 'acceptance_criteria_defined', 'edge_cases_documented'],
    research: ['alternatives_evaluated', 'feasibility_confirmed', 'risks_assessed'],
    planning: ['task_breakdown_complete', 'dependencies_mapped', 'resources_allocated'],
    execution: ['tests_passing', 'coverage_maintained', 'security_clean', 'lint_clean'],
    knowledge: ['documentation_complete', 'lessons_captured', 'knowledge_transferred']
  };

  return gates[phase] || gates.execution;
}

/**
 * Process and standardize prompt content
 */
function processPrompt(agentName, originalPrompt, metadata) {
  const sections = [];

  // Identity section
  sections.push(`## Identity\nYou are the ${agentName} agent in the SPEK pipeline, specializing in ${metadata.category}.`);

  // Mission section
  sections.push(`## Mission\n${metadata.description}`);

  // SPEK Phase Integration
  sections.push(`## SPEK Phase Integration
- **Phase**: ${metadata.phase}
- **Upstream Dependencies**: [Specify dependencies]
- **Downstream Deliverables**: ${metadata.artifact_contracts.output}`);

  // Core Responsibilities
  const responsibilities = metadata.capabilities.map((cap, i) => `${i + 1}. ${cap}`).join('\n');
  sections.push(`## Core Responsibilities\n${responsibilities}`);

  // Quality Policy
  sections.push(`## Quality Policy (CTQs)
- NASA PoT structural safety compliance
- Security: Zero HIGH/CRITICAL findings
- Testing: Coverage >= baseline on changed lines
- Size: Micro edits <= 25 LOC, <= 2 files`);

  // Tool Routing
  sections.push(`## Tool Routing
- Read/Write/Edit: File operations
- Bash: Command execution
- TodoWrite: Task management
- MCP Tools: As configured`);

  // Operating Rules
  sections.push(`## Operating Rules
- Validate tollgates before proceeding
- Emit STRICT JSON artifacts only
- Escalate if budgets exceeded
- No secret leakage`);

  // Communication Protocol
  sections.push(`## Communication Protocol
1. Announce INTENT, INPUTS, TOOLS
2. Validate DoR/tollgates
3. Produce declared artifacts (JSON only)
4. Notify downstream partners
5. Escalate if needed`);

  // Add original content if it contains unique information
  if (originalPrompt && !originalPrompt.includes('SPEK-AUGMENT')) {
    sections.push(`## Additional Context\n${originalPrompt}`);
  }

  return sections.join('\n\n');
}

/**
 * Write standardized agent file
 */
function writeStandardizedAgent(agentName, standardized, outputDir) {
  const outputPath = path.join(outputDir, `${agentName}.md`);

  // Create YAML front matter
  const yamlContent = yaml.dump(standardized.metadata);

  // Combine YAML and prompt
  const fullContent = `---\n${yamlContent}---\n\n${standardized.prompt}`;

  // Ensure directory exists
  fs.mkdirSync(outputDir, { recursive: true });

  // Write file
  fs.writeFileSync(outputPath, fullContent, 'utf8');

  return outputPath;
}

/**
 * Main standardization process
 */
function standardizeAllAgents() {
  const agentDirs = [
    '.claude/agents',
    'flow/agents'
  ];

  const outputDir = '.claude/agents/standardized';
  const report = {
    processed: [],
    skipped: [],
    errors: []
  };

  console.log('Starting agent standardization...\n');

  for (const dir of agentDirs) {
    const fullPath = path.join(process.cwd(), dir);

    if (!fs.existsSync(fullPath)) {
      console.log(`Skipping ${dir} (not found)`);
      continue;
    }

    console.log(`Processing agents in ${dir}...`);

    // Recursively find all .md files
    const findAgentFiles = (dirPath) => {
      const files = [];
      const items = fs.readdirSync(dirPath);

      for (const item of items) {
        const itemPath = path.join(dirPath, item);
        const stat = fs.statSync(itemPath);

        if (stat.isDirectory() && !item.startsWith('.') && item !== 'standardized') {
          files.push(...findAgentFiles(itemPath));
        } else if (stat.isFile() && item.endsWith('.md')) {
          files.push(itemPath);
        }
      }

      return files;
    };

    const agentFiles = findAgentFiles(fullPath);

    for (const filePath of agentFiles) {
      const agentName = path.basename(filePath, '.md');

      try {
        console.log(`  Processing ${agentName}...`);

        // Parse existing agent
        const agentData = parseAgentFile(filePath);

        // Skip if already standardized
        if (agentData.raw.includes('STANDARD_TEMPLATE_V1')) {
          console.log(`    Skipped (already standardized)`);
          report.skipped.push(agentName);
          continue;
        }

        // Standardize agent
        const standardized = standardizeAgent(agentName, agentData);

        // Write standardized version
        const outputPath = writeStandardizedAgent(agentName, standardized, outputDir);

        console.log(`    Standardized -> ${outputPath}`);
        report.processed.push(agentName);

      } catch (error) {
        console.error(`    Error: ${error.message}`);
        report.errors.push({ agent: agentName, error: error.message });
      }
    }
  }

  // Write report
  const reportPath = path.join(outputDir, 'standardization-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');

  console.log('\nStandardization complete!');
  console.log(`  Processed: ${report.processed.length} agents`);
  console.log(`  Skipped: ${report.skipped.length} agents`);
  console.log(`  Errors: ${report.errors.length} agents`);
  console.log(`  Report: ${reportPath}`);
  console.log(`  Output: ${outputDir}/`);

  return report;
}

// Run if executed directly
if (require.main === module) {
  standardizeAllAgents();
}

module.exports = {
  standardizeAgent,
  detectPhase,
  detectType,
  extractCapabilities,
  standardizeAllAgents
};