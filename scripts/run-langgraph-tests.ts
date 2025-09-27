#!/usr/bin/env ts-node

/**
 * LangGraph Test Execution Script
 * Comprehensive test runner for the LangGraph state machine system
 * Usage:
 *   npm run test:langgraph                    # Run all tests
 *   npm run test:langgraph -- --benchmarks   # Run only benchmarks
 *   npm run test:langgraph -- --validation   # Run only validation
 *   npm run test:langgraph -- --ci           # Run in CI mode
 *   npm run test:langgraph -- --continuous   # Run continuously
 */

import { join } from 'path';
import { performance } from 'perf_hooks';
import TestRunner, { TestRunConfig } from '../src/architecture/langgraph/testing/TestRunner';

interface CommandLineArgs {
  benchmarks?: boolean;
  validation?: boolean;
  ci?: boolean;
  continuous?: boolean;
  failFast?: boolean;
  output?: string;
  format?: 'text' | 'json' | 'html' | 'all';
  timeout?: number;
  help?: boolean;
}

class LangGraphTestExecutor {
  private args: CommandLineArgs;
  private testRunner?: TestRunner;

  constructor() {
    this.args = this.parseCommandLineArgs();
  }

  /**
   * Parse command line arguments
   */
  private parseCommandLineArgs(): CommandLineArgs {
    const args: CommandLineArgs = {};
    const argv = process.argv.slice(2);

    for (let i = 0; i < argv.length; i++) {
      const arg = argv[i];

      switch (arg) {
        case '--benchmarks':
          args.benchmarks = true;
          break;
        case '--validation':
          args.validation = true;
          break;
        case '--ci':
          args.ci = true;
          break;
        case '--continuous':
          args.continuous = true;
          break;
        case '--fail-fast':
          args.failFast = true;
          break;
        case '--output':
          args.output = argv[++i];
          break;
        case '--format':
          args.format = argv[++i] as any;
          break;
        case '--timeout':
          args.timeout = parseInt(argv[++i], 10);
          break;
        case '--help':
        case '-h':
          args.help = true;
          break;
        default:
          if (arg.startsWith('--')) {
            console.warn(`Unknown argument: ${arg}`);
          }
          break;
      }
    }

    return args;
  }

  /**
   * Display help information
   */
  private displayHelp(): void {
    console.log(`
LangGraph Test Runner

Usage:
  npm run test:langgraph [options]

Options:
  --benchmarks      Run only performance benchmarks
  --validation      Run only validation tests
  --ci              Run in CI mode (faster, exit on failure)
  --continuous      Run tests continuously
  --fail-fast       Stop on first failure
  --output <dir>    Output directory for reports (default: ./test-results)
  --format <type>   Report format: text, json, html, all (default: all)
  --timeout <sec>   Maximum execution time in seconds (default: 1800)
  --help, -h        Display this help message

Examples:
  npm run test:langgraph                    # Run all tests
  npm run test:langgraph -- --benchmarks   # Run only benchmarks
  npm run test:langgraph -- --ci           # Run in CI mode
  npm run test:langgraph -- --continuous   # Run continuously

Environment Variables:
  NODE_ENV          Set to 'test' for optimal test performance
  CI                Set to 'true' for CI environment detection
  LANGGRAPH_LOG     Set to 'debug' for detailed logging
`);
  }

  /**
   * Create test runner configuration
   */
  private createTestConfig(): TestRunConfig {
    const isCiEnvironment = this.args.ci || process.env.CI === 'true';

    // If specific test types are requested, use only those
    const runBenchmarks = this.args.benchmarks !== undefined ? this.args.benchmarks :
                         this.args.validation !== undefined ? false : true;
    const runValidation = this.args.validation !== undefined ? this.args.validation :
                         this.args.benchmarks !== undefined ? false : true;

    const config: TestRunConfig = {
      runBenchmarks,
      runValidation,
      outputDirectory: this.args.output || './test-results',
      reportFormat: this.args.format || 'all',
      includeDetailedResults: !isCiEnvironment,
      maxExecutionTime: this.args.timeout || (isCiEnvironment ? 900 : 1800), // 15 min CI, 30 min dev
      enableContinuousMode: this.args.continuous || false,
      continuousInterval: 3600, // 1 hour
      ciMode: isCiEnvironment,
      failFast: this.args.failFast || isCiEnvironment,
      retryFailedTests: isCiEnvironment ? 0 : 1
    };

    return config;
  }

  /**
   * Setup test environment
   */
  private setupTestEnvironment(): void {
    // Set NODE_ENV for testing
    if (!process.env.NODE_ENV) {
      process.env.NODE_ENV = 'test';
    }

    // Configure logging
    if (process.env.LANGGRAPH_LOG === 'debug') {
      console.log('Debug logging enabled');
    }

    // Memory optimization for tests
    if (global.gc) {
      console.log('Garbage collection available - will be used for memory tests');
    } else {
      console.log('Garbage collection not available - run with --expose-gc for memory tests');
    }

    // Setup error handling
    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
      if (this.args.ci) {
        process.exit(1);
      }
    });

    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      if (this.args.ci) {
        process.exit(1);
      }
    });
  }

  /**
   * Execute tests
   */
  async executeTests(): Promise<void> {
    const config = this.createTestConfig();

    console.log('=== LangGraph Test Execution ===');
    console.log(`Configuration: ${JSON.stringify(config, null, 2)}`);

    this.testRunner = new TestRunner(config);

    // Setup event listeners
    this.testRunner.on('testComplete', (summary) => {
      console.log('\n=== Test Execution Summary ===');
      console.log(`Total Tests: ${summary.totalTests}`);
      console.log(`Passed: ${summary.passedTests}`);
      console.log(`Failed: ${summary.failedTests}`);
      console.log(`Duration: ${(summary.duration / 1000).toFixed(2)}s`);
      console.log(`Success: ${summary.success ? 'YES' : 'NO'}`);

      if (summary.reports.text) {
        console.log('\n--- Text Report Preview ---');
        console.log(summary.reports.text.split('\n').slice(0, 20).join('\n'));
        console.log('... (see full report in output directory)');
      }
    });

    this.testRunner.on('testError', (error) => {
      console.error('Test execution failed:', error);
    });

    try {
      const startTime = performance.now();

      if (config.enableContinuousMode) {
        console.log('Starting continuous test mode...');
        this.testRunner.startContinuousMode();

        // Keep process alive for continuous mode
        process.on('SIGINT', async () => {
          console.log('\nReceived SIGINT, stopping continuous mode...');
          this.testRunner?.stopContinuousMode();
          await this.cleanup();
          process.exit(0);
        });

        // Run initial test
        await this.testRunner.runTests();

        // Keep process alive
        console.log('Continuous mode started. Press Ctrl+C to stop.');
        await new Promise(() => {}); // Wait indefinitely

      } else {
        // Single test run
        const summary = await this.testRunner.runTests();
        const endTime = performance.now();

        console.log(`\nTotal execution time: ${((endTime - startTime) / 1000).toFixed(2)}s`);

        // Exit with appropriate code
        process.exit(summary.success ? 0 : 1);
      }

    } catch (error) {
      console.error('Test execution failed:', error);
      await this.cleanup();
      process.exit(1);
    }
  }

  /**
   * Validate system requirements
   */
  private async validateSystemRequirements(): Promise<boolean> {
    console.log('Validating system requirements...');

    // Check Node.js version
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

    if (majorVersion < 16) {
      console.error(`Node.js 16+ required, found ${nodeVersion}`);
      return false;
    }

    // Check available memory
    const memoryUsage = process.memoryUsage();
    const availableMemory = memoryUsage.heapTotal;
    const requiredMemory = 256 * 1024 * 1024; // 256MB

    if (availableMemory < requiredMemory) {
      console.warn(`Low memory detected: ${(availableMemory / 1024 / 1024).toFixed(0)}MB available`);
    }

    // Check TypeScript availability
    try {
      require('typescript');
      console.log('TypeScript available');
    } catch (error) {
      console.warn('TypeScript not available - some features may be limited');
    }

    console.log('System requirements validated');
    return true;
  }

  /**
   * Cleanup resources
   */
  private async cleanup(): Promise<void> {
    if (this.testRunner) {
      await this.testRunner.cleanup();
    }
  }

  /**
   * Main execution flow
   */
  async run(): Promise<void> {
    if (this.args.help) {
      this.displayHelp();
      return;
    }

    try {
      // Setup environment
      this.setupTestEnvironment();

      // Validate system requirements
      const systemValid = await this.validateSystemRequirements();
      if (!systemValid && this.args.ci) {
        console.error('System requirements not met');
        process.exit(1);
      }

      // Execute tests
      await this.executeTests();

    } catch (error) {
      console.error('Execution failed:', error);
      await this.cleanup();
      process.exit(1);
    }
  }
}

// Execute if run directly
if (require.main === module) {
  const executor = new LangGraphTestExecutor();
  executor.run().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export default LangGraphTestExecutor;