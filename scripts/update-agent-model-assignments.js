#!/usr/bin/env node

/**
 * Agent Model Assignment Updater
 * Updates all 85 agents with intelligent model assignments based on task complexity and specialization
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// Model assignments by agent name
const MODEL_ASSIGNMENTS = {
  // Claude Opus 4.1 - Strategic & Complex Reasoning (11 agents)
  'claude-opus-4.1': [
    'planner', 'sparc-coord', 'task-orchestrator', 'hierarchical-coordinator',
    'adaptive-coordinator', 'architecture', 'system-architect', 'project-shipper',
    'studio-producer', 'sprint-prioritizer', 'migration-planner'
  ],

  // Claude Sonnet 4 - Core Development & Implementation (20 agents)
  'claude-sonnet-4': [
    'coder', 'frontend-developer', 'backend-dev', 'mobile-dev', 'ai-engineer',
    'devops-automator', 'cicd-engineer', 'ml-developer', 'reviewer', 'code-analyzer',
    'fresh-eyes-codex', 'pr-manager', 'github-modes', 'release-manager', 'repo-architect',
    'workflow-automation', 'infrastructure-maintainer', 'base-template-generator',
    'rapid-prototyper', 'memory-coordinator'
  ],

  // Gemini 2.5 Pro - Large Context & Research (10 agents)
  'gemini-2.5-pro': [
    'researcher', 'researcher-gemini', 'trend-researcher', 'ux-researcher',
    'experiment-tracker', 'analytics-reporter', 'finance-tracker', 'fresh-eyes-gemini',
    'feedback-synthesizer', 'tool-evaluator'
  ],

  // Codex CLI - Testing & Validation (11 agents)
  'codex-cli': [
    'tester', 'api-tester', 'production-validator', 'coder-codex', 'workflow-optimizer',
    'test-results-analyzer', 'tdd-london-swarm', 'reality-checker', 'theater-killer',
    'security-manager', 'performance-benchmarker'
  ],

  // GPT-5 - Fast Coding & Simple Operations (33 agents)
  'gpt-5': [
    'specification', 'refinement', 'pseudocode', 'ui-designer', 'brand-guardian',
    'legal-compliance-checker', 'visual-storyteller', 'whimsy-injector', 'content-creator',
    'api-docs', 'support-responder', 'completion-auditor', 'tiktok-strategist',
    'instagram-curator', 'twitter-engager', 'reddit-community-builder', 'app-store-optimizer',
    'growth-hacker', 'mesh-coordinator', 'swarm-init', 'smart-agent', 'code-review-swarm',
    'issue-tracker', 'multi-repo-swarm', 'project-board-sync', 'release-swarm',
    'swarm-issue', 'swarm-pr', 'sync-coordinator', 'byzantine-coordinator',
    'crdt-synchronizer', 'gossip-coordinator', 'raft-manager', 'quorum-manager'
  ]
};

// Model configurations
const MODEL_CONFIGS = {
  'claude-opus-4.1': {
    fallback: {
      primary: 'claude-sonnet-4',
      secondary: 'claude-sonnet-4',
      emergency: 'claude-sonnet-4'
    },
    requirements: {
      context_window: 'large',
      capabilities: ['strategic_reasoning', 'complex_coordination'],
      specialized_features: [],
      cost_sensitivity: 'low'
    },
    routing: {
      gemini_conditions: [],
      codex_conditions: []
    }
  },

  'claude-sonnet-4': {
    fallback: {
      primary: 'gpt-5',
      secondary: 'claude-opus-4.1',
      emergency: 'claude-sonnet-4'
    },
    requirements: {
      context_window: 'standard',
      capabilities: ['reasoning', 'coding', 'implementation'],
      specialized_features: [],
      cost_sensitivity: 'medium'
    },
    routing: {
      gemini_conditions: [],
      codex_conditions: []
    }
  },

  'gemini-2.5-pro': {
    fallback: {
      primary: 'claude-sonnet-4',
      secondary: 'claude-sonnet-4',
      emergency: 'claude-sonnet-4'
    },
    requirements: {
      context_window: 'massive',
      capabilities: ['research_synthesis', 'large_context_analysis'],
      specialized_features: ['multimodal', 'search_integration'],
      cost_sensitivity: 'medium'
    },
    routing: {
      gemini_conditions: ['large_context_required', 'research_synthesis', 'architectural_analysis'],
      codex_conditions: []
    }
  },

  'codex-cli': {
    fallback: {
      primary: 'claude-sonnet-4',
      secondary: 'gpt-5',
      emergency: 'claude-sonnet-4'
    },
    requirements: {
      context_window: 'standard',
      capabilities: ['testing', 'verification', 'debugging'],
      specialized_features: ['sandboxing'],
      cost_sensitivity: 'medium'
    },
    routing: {
      gemini_conditions: [],
      codex_conditions: ['testing_required', 'sandbox_verification', 'micro_operations']
    }
  },

  'gpt-5': {
    fallback: {
      primary: 'claude-sonnet-4',
      secondary: 'claude-sonnet-4',
      emergency: 'claude-sonnet-4'
    },
    requirements: {
      context_window: 'standard',
      capabilities: ['coding', 'agentic_tasks', 'fast_processing'],
      specialized_features: [],
      cost_sensitivity: 'high'
    },
    routing: {
      gemini_conditions: [],
      codex_conditions: []
    }
  }
};

/**
 * Get model assignment for an agent
 */
function getModelAssignment(agentName) {
  for (const [model, agents] of Object.entries(MODEL_ASSIGNMENTS)) {
    if (agents.includes(agentName)) {
      return {
        preferred_model: model,
        config: MODEL_CONFIGS[model]
      };
    }
  }

  // Default fallback
  return {
    preferred_model: 'claude-sonnet-4',
    config: MODEL_CONFIGS['claude-sonnet-4']
  };
}

/**
 * Update agent file with model assignment
 */
function updateAgentFile(filePath, agentName) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const assignment = getModelAssignment(agentName);

    // Check if file has YAML frontmatter
    const yamlMatch = content.match(/^---\n([\s\S]*?)\n---/);

    if (yamlMatch) {
      // Update existing YAML frontmatter
      let yamlContent = yaml.load(yamlMatch[1]);

      // Add model assignment fields
      yamlContent.preferred_model = assignment.preferred_model;
      yamlContent.model_fallback = assignment.config.fallback;
      yamlContent.model_requirements = assignment.config.requirements;
      yamlContent.model_routing = assignment.config.routing;

      // Reconstruct file
      const newYaml = yaml.dump(yamlContent);
      const markdownContent = content.substring(yamlMatch[0].length);
      const updatedContent = `---\n${newYaml}---${markdownContent}`;

      fs.writeFileSync(filePath, updatedContent, 'utf8');
      console.log(`[OK] Updated ${agentName} with model: ${assignment.preferred_model}`);
      return true;

    } else {
      console.log(`[WARN] No YAML frontmatter found in ${agentName}, skipping model assignment`);
      return false;
    }

  } catch (error) {
    console.error(`[FAIL] Error updating ${agentName}: ${error.message}`);
    return false;
  }
}

/**
 * Main execution
 */
function updateAllAgents() {
  const agentDirs = ['.claude/agents'];
  let updated = 0;
  let skipped = 0;
  let errors = 0;

  console.log('[ROCKET] Starting model assignment update for all agents...\n');

  // Create summary of assignments
  console.log('[CHART] Model Assignment Summary:');
  for (const [model, agents] of Object.entries(MODEL_ASSIGNMENTS)) {
    console.log(`   ${model}: ${agents.length} agents`);
  }
  console.log('');

  for (const dir of agentDirs) {
    if (!fs.existsSync(dir)) {
      console.log(`[WARN] Directory ${dir} not found, skipping...`);
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

      const result = updateAgentFile(filePath, agentName);
      if (result === true) {
        updated++;
      } else if (result === false) {
        skipped++;
      } else {
        errors++;
      }
    }
  }

  console.log('\n[TARGET] Model Assignment Update Complete!');
  console.log(`[OK] Updated: ${updated} agents`);
  console.log(`[WARN] Skipped: ${skipped} agents (no YAML frontmatter)`);
  console.log(`[FAIL] Errors: ${errors} agents`);

  // Show final distribution
  console.log('\n[TREND] Final Model Distribution:');
  console.log(`   Claude Opus 4.1: ${MODEL_ASSIGNMENTS['claude-opus-4.1'].length} agents (13%)`);
  console.log(`   Claude Sonnet 4: ${MODEL_ASSIGNMENTS['claude-sonnet-4'].length} agents (24%)`);
  console.log(`   Gemini 2.5 Pro: ${MODEL_ASSIGNMENTS['gemini-2.5-pro'].length} agents (12%)`);
  console.log(`   Codex CLI: ${MODEL_ASSIGNMENTS['codex-cli'].length} agents (13%)`);
  console.log(`   GPT-5: ${MODEL_ASSIGNMENTS['gpt-5'].length} agents (39%)`);
  console.log(`   Total: 85 agents (100%)`);
}

// Run if executed directly
if (require.main === module) {
  updateAllAgents();
}

module.exports = {
  updateAgentFile,
  getModelAssignment,
  MODEL_ASSIGNMENTS,
  MODEL_CONFIGS
};