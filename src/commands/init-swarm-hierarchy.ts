#!/usr/bin/env node

/**
 * Initialize Swarm Hierarchy Command
 * Sets up the complete hierarchical swarm architecture with anti-degradation
 */

import { SwarmQueen } from '../swarm/hierarchy/SwarmQueen';
import { spawn } from 'child_process';
import * as readline from 'readline';

interface InitOptions {
  verbose: boolean;
  testMode: boolean;
  skipMCP: boolean;
}

class SwarmHierarchyInitializer {
  private queen: SwarmQueen;
  private options: InitOptions;
  private rl: readline.Interface;

  constructor(options: InitOptions) {
    this.options = options;
    this.queen = new SwarmQueen();
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  /**
   * Main initialization flow
   */
  async initialize(): Promise<void> {
    console.log(`

                 UNIFIED HIERARCHICAL SWARM SYSTEM                
                   Anti-Degradation Architecture                  


 INITIALIZING 6 PRINCESS DOMAINS WITH 85+ AGENTS
`);

    try {
      // Step 1: Check prerequisites
      await this.checkPrerequisites();

      // Step 2: Initialize MCP servers if needed
      if (!this.options.skipMCP) {
        await this.initializeMCPServers();
      }

      // Step 3: Initialize Swarm Queen
      await this.initializeSwarmQueen();

      // Step 4: Verify system
      await this.verifySystem();

      // Step 5: Run test task if requested
      if (this.options.testMode) {
        await this.runTestTask();
      }

      console.log(`

                    INITIALIZATION COMPLETE                       


 Swarm Queen initialized with:
   - 6 Princess Domains (Development, Quality, Security, Research, Infrastructure, Coordination)
   - 85+ specialized agents
   - Triple-layer truth system (GitHub Project Manager, Memory, Context DNA)
   - Byzantine fault tolerance
   - <15% degradation threshold
   - Cross-hive communication protocol

 Ready to execute tasks with anti-degradation guarantees!

Usage:
  await queen.executeTask("Your task description", context, { priority: 'high' });
`);

    } catch (error) {
      console.error('\n Initialization failed:', error);
      process.exit(1);
    } finally {
      this.rl.close();
    }
  }

  /**
   * Check system prerequisites
   */
  private async checkPrerequisites(): Promise<void> {
    console.log('\n Checking prerequisites...');

    const checks = [
      { name: 'Node.js version', cmd: 'node --version', min: 'v18' },
      { name: 'NPM version', cmd: 'npm --version', min: '9' },
      { name: 'Claude Flow', cmd: 'npx claude-flow@alpha --version', min: null }
    ];

    for (const check of checks) {
      try {
        const result = await this.execCommand(check.cmd);
        const version = result.trim();

        if (check.min && version < check.min) {
          throw new Error(`${check.name} ${version} is below minimum ${check.min}`);
        }

        console.log(`   ${check.name}: ${version}`);
      } catch (error) {
        console.log(`    ${check.name}: Not found or version check failed`);
      }
    }
  }

  /**
   * Initialize MCP servers
   */
  private async initializeMCPServers(): Promise<void> {
    console.log('\n Initializing MCP servers...');

    const mcpServers = [
      { name: 'claude-flow', cmd: 'npx claude-flow@alpha mcp start' },
      { name: 'memory', cmd: 'npx @modelcontextprotocol/server-memory' },
      { name: 'filesystem', cmd: 'npx @modelcontextprotocol/server-filesystem --allowed-directories .' }
    ];

    if (!this.options.skipMCP) {
      console.log('\n  MCP servers need to be configured in your Claude Code settings.');
      console.log('Add these to your MCP configuration:\n');

      for (const server of mcpServers) {
        console.log(`  ${server.name}:`);
        console.log(`    command: ${server.cmd}`);
        console.log('');
      }

      const answer = await this.prompt('\nHave you configured the MCP servers? (y/n): ');
      if (answer.toLowerCase() !== 'y') {
        console.log('\nPlease configure MCP servers and run again.');
        process.exit(0);
      }
    }

    console.log('   MCP servers configured');
  }

  /**
   * Initialize the Swarm Queen
   */
  private async initializeSwarmQueen(): Promise<void> {
    console.log('\n Initializing Swarm Queen...');

    // Set up event listeners
    this.setupQueenEventListeners();

    // Initialize the queen
    await this.queen.initialize();

    console.log('   Swarm Queen initialized');
  }

  /**
   * Setup event listeners for the queen
   */
  private setupQueenEventListeners(): void {
    if (!this.options.verbose) return;

    this.queen.on('queen:initialized', (metrics) => {
      console.log('\n Initial metrics:', metrics);
    });

    this.queen.on('task:created', (task) => {
      console.log(`\n Task created: ${task.id}`);
    });

    this.queen.on('task:completed', (task) => {
      console.log(`\n Task completed: ${task.id}`);
    });

    this.queen.on('princess:quarantined', ({ princess }) => {
      console.log(`\n  Princess quarantined: ${princess}`);
    });

    this.queen.on('health:checked', (results: any[]) => {
      const healthy = results.filter((r: any) => r.healthy).length;
      console.log(`\n Health check: ${healthy}/${results.length} healthy`);
    });
  }

  /**
   * Verify the system is working
   */
  private async verifySystem(): Promise<void> {
    console.log('\n Verifying system...');

    const metrics = this.queen.getMetrics();

    console.log(`  - Total Princesses: ${metrics.totalPrincesses}`);
    console.log(`  - Active Princesses: ${metrics.activePrincesses}`);
    console.log(`  - Total Agents: ${metrics.totalAgents}`);
    console.log(`  - Context Integrity: ${(metrics.contextIntegrity * 100).toFixed(1)}%`);
    console.log(`  - Consensus Success: ${(metrics.consensusSuccess * 100).toFixed(1)}%`);

    if (metrics.activePrincesses < metrics.totalPrincesses) {
      console.warn('\n  Some princesses are not active');
    }

    if (metrics.contextIntegrity < 0.85) {
      console.warn('\n  Context integrity below threshold');
    }

    console.log('\n   System verification complete');
  }

  /**
   * Run a test task
   */
  private async runTestTask(): Promise<void> {
    console.log('\n Running test task...');

    const testContext = {
      test: true,
      timestamp: Date.now(),
      description: 'Test task for swarm hierarchy verification'
    };

    try {
      const result = await this.queen.executeTask(
        'Analyze this test context and verify all princess domains are functioning',
        testContext,
        {
          priority: 'medium',
          requiredDomains: ['development', 'quality', 'coordination'],
          consensusRequired: true
        }
      );

      console.log('\n   Test task completed successfully');

      if (this.options.verbose) {
        console.log('\n Test results:', JSON.stringify(result, null, 2));
      }

    } catch (error) {
      console.error('\n   Test task failed:', error);
    }
  }

  /**
   * Execute a command and return output
   */
  private execCommand(cmd: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const parts = cmd.split(' ');
      const child = spawn(parts[0], parts.slice(1));

      let output = '';
      child.stdout.on('data', (data) => output += data.toString());
      child.stderr.on('data', (data) => output += data.toString());

      child.on('close', (code) => {
        if (code === 0) {
          resolve(output);
        } else {
          reject(new Error(`Command failed: ${cmd}`));
        }
      });
    });
  }

  /**
   * Prompt user for input
   */
  private prompt(question: string): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question(question, (answer) => {
        resolve(answer);
      });
    });
  }

  /**
   * Cleanup and shutdown
   */
  async shutdown(): Promise<void> {
    console.log('\n Shutting down swarm hierarchy...');
    await this.queen.shutdown();
    this.rl.close();
  }
}

/**
 * CLI entry point
 */
async function main() {
  const args = process.argv.slice(2);

  const options: InitOptions = {
    verbose: args.includes('--verbose') || args.includes('-v'),
    testMode: args.includes('--test') || args.includes('-t'),
    skipMCP: args.includes('--skip-mcp')
  };

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage: npx init-swarm-hierarchy [options]

Options:
  -v, --verbose     Show detailed output
  -t, --test        Run test task after initialization
  --skip-mcp        Skip MCP server configuration
  -h, --help        Show this help message

Examples:
  npx init-swarm-hierarchy              # Basic initialization
  npx init-swarm-hierarchy --test       # Initialize and run test
  npx init-swarm-hierarchy --verbose    # Show detailed output
`);
    process.exit(0);
  }

  const initializer = new SwarmHierarchyInitializer(options);

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n\nReceived SIGINT, shutting down gracefully...');
    await initializer.shutdown();
    process.exit(0);
  });

  await initializer.initialize();
}

// Run if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { SwarmHierarchyInitializer };