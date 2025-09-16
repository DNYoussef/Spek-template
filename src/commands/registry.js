/**
 * Command Registry System
 * Central registry for all SPEK slash commands
 */

const fs = require('fs').promises;
const path = require('path');
const { EventEmitter } = require('events');

class CommandRegistry extends EventEmitter {
  constructor() {
    super();
    this.commands = new Map();
    this.aliases = new Map();
    this.categories = new Map();
    this.initialized = false;
  }

  /**
   * Initialize the command registry
   */
  async initialize() {
    if (this.initialized) return;

    console.log('Initializing Command Registry...');
    await this.loadCommandDefinitions();
    await this.setupCategories();
    this.initialized = true;
    this.emit('initialized');
    console.log(`Command Registry initialized with ${this.commands.size} commands`);
  }

  /**
   * Load command definitions from .claude/commands directory
   */
  async loadCommandDefinitions() {
    const commandsDir = path.join(process.cwd(), '.claude', 'commands');

    try {
      const files = await fs.readdir(commandsDir);
      const mdFiles = files.filter(f => f.endsWith('.md'));

      for (const file of mdFiles) {
        const commandName = file.replace('.md', '');
        const filePath = path.join(commandsDir, file);
        const content = await fs.readFile(filePath, 'utf8');

        const command = this.parseCommandFile(commandName, content);
        this.register(command);
      }
    } catch (error) {
      console.error('Error loading command definitions:', error);
      throw new Error(`Failed to load commands: ${error.message}`);
    }
  }

  /**
   * Parse command markdown file
   */
  parseCommandFile(name, content) {
    const lines = content.split('\n');
    const command = {
      name,
      description: '',
      category: 'general',
      executor: null,
      validator: null,
      options: {},
      examples: [],
      metadata: {}
    };

    // Parse markdown for command details
    let section = '';
    for (const line of lines) {
      if (line.startsWith('# ')) {
        command.description = line.substring(2).trim();
      } else if (line.startsWith('## ')) {
        section = line.substring(3).trim().toLowerCase();
      } else if (section === 'category' && line.trim()) {
        command.category = line.trim();
      } else if (section === 'executor' && line.includes('`')) {
        const match = line.match(/`([^`]+)`/);
        if (match) command.executor = match[1];
      } else if (section === 'examples' && line.startsWith('- ')) {
        command.examples.push(line.substring(2).trim());
      }
    }

    // Map to actual executor functions
    command.executorModule = this.mapExecutor(command.name, command.executor);

    return command;
  }

  /**
   * Map command to executor module
   */
  mapExecutor(commandName, executorPath) {
    const executorMap = {
      // Research commands
      'research-web': 'research/webSearch',
      'research-github': 'research/githubSearch',
      'research-models': 'research/modelSearch',
      'research-deep': 'research/deepSearch',
      'research-analyze': 'research/analyzer',

      // Planning commands
      'spec-plan': 'planning/specPlan',
      'specify': 'planning/specify',
      'plan': 'planning/plan',
      'tasks': 'planning/tasks',
      'gemini-impact': 'planning/geminiImpact',
      'pre-mortem-loop': 'planning/preMortem',

      // Implementation commands
      'codex-micro': 'implementation/codexMicro',
      'codex-micro-fix': 'implementation/codexMicroFix',
      'fix-planned': 'implementation/fixPlanned',

      // QA commands
      'qa-run': 'qa/run',
      'qa-analyze': 'qa/analyze',
      'qa-gate': 'qa/gate',
      'theater-scan': 'qa/theaterScan',
      'reality-check': 'qa/realityCheck',

      // Analysis commands
      'conn-scan': 'analysis/connascenceScan',
      'conn-arch': 'analysis/connascenceArch',
      'conn-monitor': 'analysis/connascenceMonitor',
      'conn-cache': 'analysis/connascenceCache',
      'sec-scan': 'analysis/securityScan',
      'audit-swarm': 'analysis/auditSwarm',

      // Project management
      'pm-sync': 'project/pmSync',
      'pr-open': 'project/prOpen',

      // Memory & System
      'memory-unified': 'system/memoryUnified',
      'cleanup-post-completion': 'system/cleanupPostCompletion'
    };

    return executorMap[commandName] || null;
  }

  /**
   * Register a command
   */
  register(command) {
    if (!command.name) {
      throw new Error('Command must have a name');
    }

    this.commands.set(command.name, command);

    // Register in category
    if (!this.categories.has(command.category)) {
      this.categories.set(command.category, []);
    }
    this.categories.get(command.category).push(command.name);

    this.emit('command:registered', command);
  }

  /**
   * Get a command by name
   */
  get(name) {
    return this.commands.get(name) || this.aliases.get(name);
  }

  /**
   * List all commands
   */
  list() {
    return Array.from(this.commands.values());
  }

  /**
   * List commands by category
   */
  listByCategory(category) {
    const commandNames = this.categories.get(category) || [];
    return commandNames.map(name => this.commands.get(name));
  }

  /**
   * Setup command categories
   */
  async setupCategories() {
    const defaultCategories = {
      'research': 'Research & Discovery',
      'planning': 'Planning & Architecture',
      'implementation': 'Code Implementation',
      'qa': 'Quality Assurance',
      'analysis': 'Code Analysis',
      'project': 'Project Management',
      'system': 'System & Memory'
    };

    for (const [key, description] of Object.entries(defaultCategories)) {
      if (!this.categories.has(key)) {
        this.categories.set(key, []);
      }
    }
  }

  /**
   * Search commands
   */
  search(query) {
    const results = [];
    const lowerQuery = query.toLowerCase();

    for (const command of this.commands.values()) {
      if (command.name.includes(lowerQuery) ||
          command.description.toLowerCase().includes(lowerQuery) ||
          command.category.includes(lowerQuery)) {
        results.push(command);
      }
    }

    return results;
  }

  /**
   * Validate command exists
   */
  exists(name) {
    return this.commands.has(name) || this.aliases.has(name);
  }

  /**
   * Get command statistics
   */
  getStats() {
    return {
      totalCommands: this.commands.size,
      totalAliases: this.aliases.size,
      categories: Array.from(this.categories.keys()),
      commandsByCategory: Object.fromEntries(
        Array.from(this.categories.entries()).map(([cat, cmds]) => [cat, cmds.length])
      )
    };
  }
}

// Export singleton instance
module.exports = new CommandRegistry();