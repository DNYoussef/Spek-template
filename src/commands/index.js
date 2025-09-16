/**
 * Command System Bridge
 * Main entry point for the SPEK command system
 */

const CommandRegistry = require('./registry');
const CommandExecutor = require('./executor');
const CommandValidator = require('./validator');

class CommandSystem {
  constructor() {
    this.registry = CommandRegistry;
    this.validator = new CommandValidator();
    this.executor = new CommandExecutor(this.registry, this.validator);
    this.initialized = false;
  }

  /**
   * Initialize the command system
   */
  async initialize() {
    if (this.initialized) return;

    console.log('Initializing SPEK Command System...');

    // Initialize registry
    await this.registry.initialize();

    // Setup command-specific validators
    this.setupValidators();

    // Setup event listeners
    this.setupEventListeners();

    this.initialized = true;
    console.log('SPEK Command System initialized successfully');
  }

  /**
   * Setup custom validators for specific commands
   */
  setupValidators() {
    // Add custom validator for PR commands
    this.validator.addCustomValidator('pr-open', async (args) => {
      if (!args.title || args.title.length < 10) {
        return {
          valid: false,
          errors: ['PR title must be at least 10 characters']
        };
      }
      return { valid: true, errors: [] };
    });

    // Add custom validator for QA commands
    this.validator.addCustomValidator('qa-gate', async (args) => {
      if (args.threshold && (args.threshold < 0 || args.threshold > 100)) {
        return {
          valid: false,
          errors: ['Threshold must be between 0 and 100']
        };
      }
      return { valid: true, errors: [] };
    });
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Listen for execution events
    this.executor.on('execution:start', (execution) => {
      console.log(`[COMMAND] Starting: ${execution.command}`);
    });

    this.executor.on('execution:complete', (execution) => {
      console.log(`[COMMAND] Completed: ${execution.command} (${execution.duration}ms)`);
    });

    this.executor.on('execution:error', (execution) => {
      console.error(`[COMMAND] Failed: ${execution.command}`, execution.error.message);
    });

    // Listen for registry events
    this.registry.on('command:registered', (command) => {
      console.log(`[REGISTRY] Registered: ${command.name}`);
    });
  }

  /**
   * Execute a command
   */
  async execute(commandName, args = {}, context = {}) {
    if (!this.initialized) {
      await this.initialize();
    }

    // Parse command name (handle slash prefix)
    const cleanName = commandName.startsWith('/') ? commandName.slice(1) : commandName;

    // Replace colons with dashes for consistency
    const normalizedName = cleanName.replace(/:/g, '-');

    return await this.executor.execute(normalizedName, args, context);
  }

  /**
   * Execute multiple commands
   */
  async executeBatch(commands, mode = 'parallel') {
    if (!this.initialized) {
      await this.initialize();
    }

    const normalizedCommands = commands.map(cmd => ({
      ...cmd,
      name: cmd.name.replace(/^\//, '').replace(/:/g, '-')
    }));

    if (mode === 'parallel') {
      return await this.executor.executeParallel(normalizedCommands);
    } else {
      return await this.executor.executeSequence(normalizedCommands);
    }
  }

  /**
   * List all available commands
   */
  listCommands() {
    return this.registry.list();
  }

  /**
   * Get command by name
   */
  getCommand(name) {
    const cleanName = name.replace(/^\//, '').replace(/:/g, '-');
    return this.registry.get(cleanName);
  }

  /**
   * Search commands
   */
  searchCommands(query) {
    return this.registry.search(query);
  }

  /**
   * Get system statistics
   */
  getStats() {
    return {
      registry: this.registry.getStats(),
      executor: this.executor.getStats(),
      initialized: this.initialized
    };
  }

  /**
   * Handle slash command from CLI
   */
  async handleSlashCommand(input) {
    // Parse command and arguments
    const parts = input.split(' ');
    const commandName = parts[0];

    // Parse arguments (simple key=value pairs)
    const args = {};
    for (let i = 1; i < parts.length; i++) {
      const arg = parts[i];
      if (arg.includes('=')) {
        const [key, value] = arg.split('=');
        args[key] = value;
      }
    }

    // Execute command
    try {
      const result = await this.execute(commandName, args);
      return {
        success: true,
        command: commandName,
        result
      };
    } catch (error) {
      return {
        success: false,
        command: commandName,
        error: error.message
      };
    }
  }
}

// Export singleton instance
const commandSystem = new CommandSystem();

// Also export for CLI usage
module.exports = commandSystem;

// If run directly, provide CLI interface
if (require.main === module) {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  async function main() {
    await commandSystem.initialize();

    console.log('SPEK Command System CLI');
    console.log('Type "/help" for available commands or "exit" to quit\n');

    const prompt = () => {
      rl.question('> ', async (input) => {
        input = input.trim();

        if (input === 'exit') {
          console.log('Goodbye!');
          rl.close();
          return;
        }

        if (input === '/help') {
          const commands = commandSystem.listCommands();
          console.log('\nAvailable Commands:');
          commands.forEach(cmd => {
            console.log(`  /${cmd.name} - ${cmd.description}`);
          });
          console.log('');
        } else if (input.startsWith('/')) {
          const result = await commandSystem.handleSlashCommand(input);
          if (result.success) {
            console.log('Result:', JSON.stringify(result.result, null, 2));
          } else {
            console.error('Error:', result.error);
          }
        } else {
          console.log('Unknown command. Type "/help" for available commands.');
        }

        prompt();
      });
    };

    prompt();
  }

  main().catch(console.error);
}