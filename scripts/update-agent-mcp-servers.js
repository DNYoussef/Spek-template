#!/usr/bin/env node

/**
 * Agent MCP Server Configuration Updater
 * Updates all 85 agents with proper MCP server assignments
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// MCP Server assignments by agent name
const MCP_ASSIGNMENTS = {
  // Universal servers for ALL agents
  universal: ['claude-flow', 'memory', 'sequential-thinking'],

  // Available specialized servers
  available_servers: [
    'deepwiki', 'firecrawl', 'context7', 'playwright', 'eva', 'ref',
    'markitdown', 'github', 'plane', 'filesystem', 'everything',
    'ref-tools', 'figma', 'puppeteer'
  ],

  // Specific assignments per agent (max 4 additional servers)
  assignments: {
    // Specification Phase
    'specification': ['ref', 'ref-tools'],
    'trend-researcher': ['deepwiki', 'firecrawl', 'context7', 'ref'],
    'ux-researcher': ['playwright', 'figma'],
    'brand-guardian': ['ref', 'figma', 'filesystem'],
    'legal-compliance-checker': ['ref', 'ref-tools'],

    // Research Phase
    'researcher': ['deepwiki', 'firecrawl', 'ref-tools', 'context7'],
    'researcher-gemini': ['context7', 'deepwiki', 'firecrawl', 'ref-tools'],
    'code-analyzer': ['eva', 'filesystem'],
    'security-manager': ['ref', 'filesystem'],
    'tool-evaluator': ['eva', 'ref-tools'],
    'experiment-tracker': ['eva', 'filesystem'],

    // Planning Phase
    'planner': ['plane', 'filesystem'],
    'sparc-coord': ['plane', 'filesystem'],
    'task-orchestrator': ['plane', 'filesystem'],
    'architecture': ['context7', 'filesystem'],
    'pseudocode': ['markitdown', 'filesystem'],
    'ui-designer': ['playwright', 'figma', 'ref-tools'],
    'rapid-prototyper': ['github', 'playwright', 'figma'],
    'sprint-prioritizer': ['plane', 'github'],
    'studio-producer': ['plane', 'filesystem'],

    // Execution Phase - Development
    'coder': ['github', 'filesystem'],
    'coder-codex': ['github', 'filesystem'],
    'frontend-developer': ['github', 'playwright', 'figma'],
    'backend-dev': ['github', 'ref-tools'],
    'mobile-dev': ['github', 'playwright', 'puppeteer'],
    'ai-engineer': ['github', 'filesystem'],
    'devops-automator': ['github', 'filesystem'],
    'cicd-engineer': ['github', 'filesystem'],
    'ml-developer': ['github', 'filesystem'],

    // Execution Phase - Testing
    'tester': ['playwright', 'puppeteer'],
    'api-tester': ['playwright', 'ref-tools', 'filesystem'],
    'tdd-london-swarm': ['github', 'filesystem'],
    'production-validator': ['playwright', 'eva', 'puppeteer'],
    'workflow-optimizer': ['eva', 'github', 'filesystem'],

    // Execution Phase - Creative
    'visual-storyteller': ['markitdown', 'figma', 'filesystem'],
    'whimsy-injector': ['playwright', 'figma', 'puppeteer'],
    'base-template-generator': ['github', 'filesystem'],
    'infrastructure-maintainer': ['github', 'filesystem'],
    'project-shipper': ['github', 'plane'],

    // Knowledge Phase - Analysis
    'reviewer': ['github', 'filesystem'],
    'fresh-eyes-codex': ['eva', 'filesystem'],
    'fresh-eyes-gemini': ['context7', 'filesystem'],
    'feedback-synthesizer': ['eva', 'filesystem'],
    'analytics-reporter': ['eva', 'figma', 'filesystem'],
    'test-results-analyzer': ['eva', 'filesystem'],
    'finance-tracker': ['eva', 'figma', 'filesystem'],

    // Knowledge Phase - Documentation
    'api-docs': ['markitdown', 'ref-tools'],
    'memory-coordinator': ['github', 'filesystem'],
    'content-creator': ['markitdown', 'figma', 'filesystem'],

    // Knowledge Phase - Marketing
    'tiktok-strategist': ['eva', 'figma'],
    'instagram-curator': ['firecrawl', 'figma'],
    'twitter-engager': ['firecrawl', 'figma'],
    'reddit-community-builder': ['firecrawl', 'filesystem'],
    'app-store-optimizer': ['eva', 'figma'],
    'growth-hacker': ['eva', 'figma'],

    // Knowledge Phase - Support
    'support-responder': ['github', 'ref-tools'],
    'refinement': ['eva', 'filesystem'],

    // Swarm Coordination
    'swarm-init': ['eva'],
    'hierarchical-coordinator': ['plane'],
    'mesh-coordinator': ['eva'],
    'adaptive-coordinator': ['eva'],
    'smart-agent': ['eva'],

    // GitHub Integration
    'pr-manager': ['github'],
    'github-modes': ['github'],
    'workflow-automation': ['github'],
    'code-review-swarm': ['github', 'eva'],
    'issue-tracker': ['github', 'plane'],
    'release-manager': ['github', 'eva'],
    'repo-architect': ['github'],
    'release-swarm': ['github', 'eva'],
    'project-board-sync': ['github', 'plane'],
    'multi-repo-swarm': ['github'],
    'sync-coordinator': ['github'],
    'swarm-pr': ['github'],
    'swarm-issue': ['github', 'plane'],

    // Performance and Consensus
    'perf-analyzer': ['eva'],
    'performance-benchmarker': ['eva'],
    'byzantine-coordinator': ['github'],
    'raft-manager': ['github'],
    'gossip-coordinator': ['eva'],
    'crdt-synchronizer': ['github'],
    'quorum-manager': ['eva'],

    // Migration and Development Support
    'migration-planner': ['github'],
    'system-architect': ['context7']
  }
};

/**
 * Get MCP servers for an agent
 */
function getMcpServers(agentName) {
  const universal = MCP_ASSIGNMENTS.universal;
  const specific = MCP_ASSIGNMENTS.assignments[agentName] || [];

  // Combine universal + specific (max 7 total: 3 universal + 4 specific)
  return [...universal, ...specific.slice(0, 4)];
}

/**
 * Update agent file with MCP server configuration
 */
function updateAgentFile(filePath, agentName) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const mcpServers = getMcpServers(agentName);

    // Check if file has YAML frontmatter
    const yamlMatch = content.match(/^---\n([\s\S]*?)\n---/);

    if (yamlMatch) {
      // Update YAML frontmatter
      let yamlContent = yaml.load(yamlMatch[1]);
      yamlContent.mcp_servers = mcpServers;

      // Add universal hooks if not present
      if (!yamlContent.hooks) {
        yamlContent.hooks = {};
      }

      yamlContent.hooks.pre = yamlContent.hooks.pre || `echo "[PHASE] ${yamlContent.phase || 'unknown'} agent ${agentName} initiated"
npx claude-flow@alpha hooks pre-task --description "$TASK"
npx claude-flow@alpha hooks session-restore --session-id "swarm-$(date +%s)"
memory_store "${yamlContent.phase || 'unknown'}_start_$(date +%s)" "Task: $TASK"`;

      yamlContent.hooks.post = yamlContent.hooks.post || `echo "[OK] ${yamlContent.phase || 'unknown'} complete"
npx claude-flow@alpha hooks post-task --task-id "$(date +%s)"
npx claude-flow@alpha hooks session-end --export-metrics true
memory_store "${yamlContent.phase || 'unknown'}_complete_$(date +%s)" "Task completed"`;

      // Reconstruct file
      const newYaml = yaml.dump(yamlContent);
      const markdownContent = content.substring(yamlMatch[0].length);
      const updatedContent = `---\n${newYaml}---${markdownContent}`;

      fs.writeFileSync(filePath, updatedContent, 'utf8');
      console.log(`[OK] Updated ${agentName} with MCP servers: ${mcpServers.join(', ')}`);
      return true;

    } else {
      // Add YAML frontmatter to files without it
      const phase = detectPhase(agentName);
      const yamlData = {
        name: agentName,
        type: detectType(agentName),
        phase: phase,
        category: detectCategory(agentName),
        description: `${agentName} agent for SPEK pipeline`,
        capabilities: extractCapabilities(content),
        priority: 'medium',
        tools_required: extractTools(content),
        mcp_servers: mcpServers,
        hooks: {
          pre: `echo "[PHASE] ${phase} agent ${agentName} initiated"
npx claude-flow@alpha hooks pre-task --description "$TASK"
memory_store "${phase}_start_$(date +%s)" "Task: $TASK"`,
          post: `echo "[OK] ${phase} complete"
npx claude-flow@alpha hooks post-task --task-id "$(date +%s)"
memory_store "${phase}_complete_$(date +%s)" "Task completed"`
        },
        quality_gates: getQualityGates(phase),
        artifact_contracts: {
          input: `${phase}_input.json`,
          output: `${agentName}_output.json`
        }
      };

      const newYaml = yaml.dump(yamlData);
      const updatedContent = `---\n${newYaml}---\n\n${content}`;

      fs.writeFileSync(filePath, updatedContent, 'utf8');
      console.log(`[OK] Added YAML frontmatter to ${agentName} with MCP servers: ${mcpServers.join(', ')}`);
      return true;
    }

  } catch (error) {
    console.error(`[FAIL] Error updating ${agentName}: ${error.message}`);
    return false;
  }
}

/**
 * Helper functions
 */
function detectPhase(agentName) {
  const phases = {
    specification: ['specification', 'trend-researcher', 'ux-researcher', 'brand-guardian', 'legal-compliance-checker'],
    research: ['researcher', 'researcher-gemini', 'code-analyzer', 'security-manager', 'tool-evaluator', 'experiment-tracker'],
    planning: ['planner', 'sparc-coord', 'task-orchestrator', 'architecture', 'pseudocode', 'ui-designer', 'rapid-prototyper', 'sprint-prioritizer', 'studio-producer'],
    execution: ['coder', 'coder-codex', 'frontend-developer', 'backend-dev', 'mobile-dev', 'ai-engineer', 'devops-automator', 'cicd-engineer', 'ml-developer', 'tester', 'api-tester', 'tdd-london-swarm', 'production-validator', 'workflow-optimizer', 'visual-storyteller', 'whimsy-injector', 'base-template-generator', 'infrastructure-maintainer', 'project-shipper'],
    knowledge: ['reviewer', 'fresh-eyes-codex', 'fresh-eyes-gemini', 'feedback-synthesizer', 'analytics-reporter', 'test-results-analyzer', 'finance-tracker', 'api-docs', 'memory-coordinator', 'content-creator', 'tiktok-strategist', 'instagram-curator', 'twitter-engager', 'reddit-community-builder', 'app-store-optimizer', 'growth-hacker', 'support-responder', 'refinement']
  };

  for (const [phase, agents] of Object.entries(phases)) {
    if (agents.includes(agentName)) return phase;
  }
  return 'execution'; // default
}

function detectType(agentName) {
  const types = {
    analyst: ['trend-researcher', 'researcher', 'researcher-gemini', 'code-analyzer', 'experiment-tracker', 'feedback-synthesizer', 'analytics-reporter', 'test-results-analyzer', 'tool-evaluator'],
    developer: ['coder', 'coder-codex', 'frontend-developer', 'backend-dev', 'mobile-dev', 'ai-engineer', 'ml-developer', 'rapid-prototyper'],
    coordinator: ['planner', 'sparc-coord', 'task-orchestrator', 'studio-producer', 'project-shipper', 'memory-coordinator'],
    tester: ['tester', 'api-tester', 'production-validator'],
    designer: ['ui-designer', 'brand-guardian', 'visual-storyteller', 'whimsy-injector'],
    researcher: ['ux-researcher'],
    devops: ['devops-automator', 'cicd-engineer'],
    marketing: ['tiktok-strategist', 'instagram-curator', 'twitter-engager', 'reddit-community-builder', 'app-store-optimizer', 'content-creator', 'growth-hacker']
  };

  for (const [type, agents] of Object.entries(types)) {
    if (agents.includes(agentName)) return type;
  }
  return 'general';
}

function detectCategory(agentName) {
  return agentName.replace(/-/g, '_');
}

function extractCapabilities(content) {
  // Basic capability extraction from content
  const capabilities = [];
  const lines = content.split('\n');

  for (const line of lines) {
    if (line.includes('capabilit') && line.includes(':')) {
      const match = line.match(/:\s*(.+)/);
      if (match) {
        capabilities.push(match[1].trim());
      }
    }
  }

  return capabilities.length > 0 ? capabilities : ['general_purpose'];
}

function extractTools(content) {
  const commonTools = ['Read', 'Write', 'Bash'];
  if (content.includes('MultiEdit')) commonTools.push('MultiEdit');
  if (content.includes('TodoWrite')) commonTools.push('TodoWrite');
  if (content.includes('WebSearch')) commonTools.push('WebSearch');
  if (content.includes('NotebookEdit')) commonTools.push('NotebookEdit');

  return commonTools;
}

function getQualityGates(phase) {
  const gates = {
    specification: ['requirements_complete', 'acceptance_criteria_defined'],
    research: ['research_comprehensive', 'findings_validated'],
    planning: ['plan_complete', 'resources_allocated'],
    execution: ['tests_passing', 'quality_gates_met'],
    knowledge: ['documentation_complete', 'lessons_captured']
  };

  return gates[phase] || gates.execution;
}

/**
 * Main execution
 */
function updateAllAgents() {
  const agentDirs = ['.claude/agents'];
  let updated = 0;
  let errors = 0;

  console.log('[ROCKET] Starting MCP server configuration update for all agents...\n');

  for (const dir of agentDirs) {
    if (!fs.existsSync(dir)) {
      console.log(`[WARN]  Directory ${dir} not found, skipping...`);
      continue;
    }

    // Recursively find all .md files
    function findAgentFiles(dirPath) {
      const files = [];
      const items = fs.readdirSync(dirPath);

      for (const item of items) {
        const itemPath = path.join(dirPath, item);
        const stat = fs.statSync(itemPath);

        if (stat.isDirectory() && !item.startsWith('.')) {
          files.push(...findAgentFiles(itemPath));
        } else if (stat.isFile() && item.endsWith('.md') && item !== 'README.md') {
          files.push(itemPath);
        }
      }
      return files;
    }

    const agentFiles = findAgentFiles(dir);

    for (const filePath of agentFiles) {
      const agentName = path.basename(filePath, '.md');

      if (updateAgentFile(filePath, agentName)) {
        updated++;
      } else {
        errors++;
      }
    }
  }

  console.log('\n[TARGET] MCP Server Configuration Update Complete!');
  console.log(`[OK] Updated: ${updated} agents`);
  console.log(`[FAIL] Errors: ${errors} agents`);
  console.log(`[CHART] Universal servers applied to all agents: ${MCP_ASSIGNMENTS.universal.join(', ')}`);
  console.log(` Total unique MCP servers used: ${new Set(Object.values(MCP_ASSIGNMENTS.assignments).flat().concat(MCP_ASSIGNMENTS.universal)).size}`);
}

// Run if executed directly
if (require.main === module) {
  updateAllAgents();
}

module.exports = {
  updateAgentFile,
  getMcpServers,
  MCP_ASSIGNMENTS
};