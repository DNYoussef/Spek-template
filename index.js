/**
 * SPEK Enhanced Development Platform
 * Main entry point for the integrated system
 */

const SPEKGateway = require('./src/api-gateway');
const commandSystem = require('./src/commands');
const path = require('path');
const fs = require('fs');

class SPEKPlatform {
  constructor() {
    this.gateway = null;
    this.config = this.loadConfig();
    this.version = '1.0.0';
  }

  /**
   * Load configuration
   */
  loadConfig() {
    const configPath = path.join(__dirname, 'config', 'spek.config.json');

    // Default configuration
    const defaultConfig = {
      port: 3000,
      corsOrigins: ['http://localhost:*'],
      features: {
        analyzer: true,
        github: true,
        commands: true,
        api: true
      },
      paths: {
        commands: '.claude/commands',
        analyzer: 'analyzer',
        docs: 'docs'
      }
    };

    try {
      if (fs.existsSync(configPath)) {
        const userConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        return { ...defaultConfig, ...userConfig };
      }
    } catch (error) {
      console.warn('Failed to load config file, using defaults:', error.message);
    }

    return defaultConfig;
  }

  /**
   * Initialize the platform
   */
  async initialize() {
    console.log(`
╔════════════════════════════════════════════════╗
║     SPEK Enhanced Development Platform         ║
║              Version ${this.version}                      ║
║                                                ║
║  Specification -> Research -> Planning ->      ║
║      Execution -> Knowledge                    ║
╚════════════════════════════════════════════════╝
    `);

    console.log('[SPEK] Initializing platform...');

    // Initialize command system
    if (this.config.features.commands) {
      console.log('[SPEK] Initializing command system...');
      await commandSystem.initialize();
      console.log('[SPEK] Command system ready');
    }

    // Initialize API gateway
    if (this.config.features.api) {
      console.log('[SPEK] Initializing API gateway...');
      this.gateway = new SPEKGateway(this.config);
      console.log('[SPEK] API gateway ready');
    }

    // Verify analyzer system
    if (this.config.features.analyzer) {
      console.log('[SPEK] Verifying analyzer system...');
      const analyzerReady = await this.verifyAnalyzer();
      console.log(`[SPEK] Analyzer system: ${analyzerReady ? 'READY' : 'NOT AVAILABLE'}`);
    }

    // Verify GitHub integration
    if (this.config.features.github) {
      console.log('[SPEK] Verifying GitHub integration...');
      const githubReady = await this.verifyGitHub();
      console.log(`[SPEK] GitHub integration: ${githubReady ? 'READY' : 'NOT AVAILABLE'}`);
    }

    console.log('[SPEK] Platform initialization complete');
  }

  /**
   * Verify analyzer system
   */
  async verifyAnalyzer() {
    try {
      // Check if Python analyzer modules exist
      const analyzerPath = path.join(__dirname, this.config.paths.analyzer);
      if (!fs.existsSync(analyzerPath)) {
        return false;
      }

      // Check for __init__.py
      const initPath = path.join(analyzerPath, '__init__.py');
      return fs.existsSync(initPath);
    } catch (error) {
      console.error('[SPEK] Analyzer verification failed:', error.message);
      return false;
    }
  }

  /**
   * Verify GitHub integration
   */
  async verifyGitHub() {
    try {
      // Check for GitHub workflow files
      const workflowsPath = path.join(__dirname, '.github', 'workflows');
      if (!fs.existsSync(workflowsPath)) {
        return false;
      }

      // Check if CodeQL workflow is fixed
      const codeqlPath = path.join(workflowsPath, 'codeql-analysis.yml');
      if (!fs.existsSync(codeqlPath)) {
        return false;
      }

      // Read first few bytes to check if it's not corrupted
      const content = fs.readFileSync(codeqlPath, 'utf8', { encoding: 'utf8', flag: 'r' });
      return content.startsWith('name:');
    } catch (error) {
      console.error('[SPEK] GitHub verification failed:', error.message);
      return false;
    }
  }

  /**
   * Start the platform
   */
  async start() {
    await this.initialize();

    if (this.gateway) {
      await this.gateway.start();
      console.log(`
[SPEK] Platform is running!

Available endpoints:
  - Health: http://localhost:${this.config.port}/health
  - Commands: http://localhost:${this.config.port}/api/commands
  - Execute: http://localhost:${this.config.port}/api/commands/execute
  - Stats: http://localhost:${this.config.port}/api/stats

Command CLI:
  node src/commands/index.js

API Gateway:
  node src/api-gateway/index.js

For documentation, see: docs/README.md
      `);
    }
  }

  /**
   * Stop the platform
   */
  async stop() {
    console.log('[SPEK] Shutting down platform...');

    if (this.gateway) {
      await this.gateway.stop();
    }

    console.log('[SPEK] Platform stopped');
  }

  /**
   * Get platform status
   */
  getStatus() {
    return {
      version: this.version,
      config: this.config,
      services: {
        commands: commandSystem.getStats(),
        gateway: this.gateway ? 'running' : 'stopped'
      },
      timestamp: new Date().toISOString()
    };
  }
}

// Export the platform
module.exports = SPEKPlatform;

// If run directly, start the platform
if (require.main === module) {
  const platform = new SPEKPlatform();

  platform.start().catch(console.error);

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    await platform.stop();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    await platform.stop();
    process.exit(0);
  });
}