/**
 * SPEK API Gateway
 * Unified entry point for all SPEK system components
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const commandSystem = require('../commands');
const path = require('path');
const { spawn } = require('child_process');

class SPEKGateway {
  constructor(config = {}) {
    this.app = express();
    this.config = {
      port: config.port || process.env.PORT || 3000,
      corsOrigins: config.corsOrigins || ['http://localhost:*'],
      rateLimitWindow: config.rateLimitWindow || 15 * 60 * 1000, // 15 minutes
      rateLimitMax: config.rateLimitMax || 100,
      ...config
    };

    this.services = new Map();
    this.setupMiddleware();
    this.setupRoutes();
  }

  /**
   * Setup Express middleware
   */
  setupMiddleware() {
    // Security headers
    this.app.use(helmet());

    // CORS configuration
    this.app.use(cors({
      origin: this.config.corsOrigins,
      credentials: true
    }));

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: this.config.rateLimitWindow,
      max: this.config.rateLimitMax,
      message: 'Too many requests, please try again later'
    });
    this.app.use('/api/', limiter);

    // Request logging
    this.app.use((req, res, next) => {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
      next();
    });
  }

  /**
   * Setup API routes
   */
  setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: Array.from(this.services.keys()),
        uptime: process.uptime()
      });
    });

    // Command execution endpoint
    this.app.post('/api/commands/execute', async (req, res) => {
      try {
        const { command, args, context } = req.body;

        if (!command) {
          return res.status(400).json({
            error: 'Command name is required'
          });
        }

        const result = await commandSystem.execute(command, args || {}, context || {});

        res.json({
          success: true,
          command,
          result,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    });

    // Batch command execution
    this.app.post('/api/commands/batch', async (req, res) => {
      try {
        const { commands, mode = 'parallel' } = req.body;

        if (!Array.isArray(commands)) {
          return res.status(400).json({
            error: 'Commands must be an array'
          });
        }

        const results = await commandSystem.executeBatch(commands, mode);

        res.json({
          success: true,
          mode,
          results,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    });

    // List available commands
    this.app.get('/api/commands', (req, res) => {
      const commands = commandSystem.listCommands();
      res.json({
        total: commands.length,
        commands: commands.map(cmd => ({
          name: cmd.name,
          description: cmd.description,
          category: cmd.category,
          examples: cmd.examples
        }))
      });
    });

    // Search commands
    this.app.get('/api/commands/search', (req, res) => {
      const { q } = req.query;

      if (!q) {
        return res.status(400).json({
          error: 'Query parameter "q" is required'
        });
      }

      const results = commandSystem.searchCommands(q);
      res.json({
        query: q,
        results: results.map(cmd => ({
          name: cmd.name,
          description: cmd.description,
          category: cmd.category
        }))
      });
    });

    // Python analyzer bridge
    this.app.post('/api/analyzer/:module', async (req, res) => {
      try {
        const { module } = req.params;
        const args = req.body;

        const result = await this.executePythonModule(module, args);
        res.json({
          success: true,
          module,
          result,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    });

    // GitHub integration proxy
    this.app.post('/api/github/:action', async (req, res) => {
      try {
        const { action } = req.params;
        const data = req.body;

        const result = await this.handleGitHubAction(action, data);
        res.json({
          success: true,
          action,
          result,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    });

    // SPEK workflow endpoint
    this.app.post('/api/spek/workflow', async (req, res) => {
      try {
        const { phase, task, options } = req.body;

        const result = await this.executeSPEKPhase(phase, task, options);
        res.json({
          success: true,
          phase,
          result,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    });

    // System statistics
    this.app.get('/api/stats', (req, res) => {
      res.json({
        gateway: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          services: Array.from(this.services.keys())
        },
        commands: commandSystem.getStats(),
        timestamp: new Date().toISOString()
      });
    });

    // 404 handler
    this.app.use((req, res) => {
      res.status(404).json({
        error: 'Endpoint not found',
        path: req.path,
        timestamp: new Date().toISOString()
      });
    });

    // Error handler
    this.app.use((err, req, res, next) => {
      console.error('Error:', err);
      res.status(500).json({
        error: 'Internal server error',
        message: err.message,
        timestamp: new Date().toISOString()
      });
    });
  }

  /**
   * Execute Python analyzer module
   */
  async executePythonModule(module, args) {
    return new Promise((resolve, reject) => {
      const pythonArgs = Object.entries(args)
        .map(([key, value]) => `--${key}=${JSON.stringify(value)}`)
        .join(' ');

      const command = `python -m analyzer.${module} ${pythonArgs}`;

      const child = spawn('python', ['-m', `analyzer.${module}`, ...pythonArgs.split(' ')], {
        cwd: process.cwd()
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('error', (error) => {
        reject(new Error(`Failed to execute Python module: ${error.message}`));
      });

      child.on('close', (code) => {
        if (code === 0) {
          try {
            const result = JSON.parse(stdout);
            resolve(result);
          } catch {
            resolve({ output: stdout, stderr });
          }
        } else {
          reject(new Error(`Python module failed with code ${code}: ${stderr}`));
        }
      });
    });
  }

  /**
   * Handle GitHub actions
   */
  async handleGitHubAction(action, data) {
    const actionHandlers = {
      'create-pr': async (data) => {
        return await commandSystem.execute('pr-open', data);
      },
      'analyze-repo': async (data) => {
        return await commandSystem.execute('research-github', {
          query: data.repo,
          ...data
        });
      },
      'run-workflow': async (data) => {
        // Trigger GitHub workflow via API
        return { message: 'Workflow triggered', ...data };
      }
    };

    const handler = actionHandlers[action];
    if (!handler) {
      throw new Error(`Unknown GitHub action: ${action}`);
    }

    return await handler(data);
  }

  /**
   * Execute SPEK workflow phase
   */
  async executeSPEKPhase(phase, task, options = {}) {
    const phases = {
      'specification': ['specify', 'spec-plan'],
      'research': ['research-web', 'research-github', 'research-models'],
      'planning': ['plan', 'tasks', 'pre-mortem-loop'],
      'execution': ['codex-micro', 'fix-planned'],
      'knowledge': ['qa-run', 'qa-gate', 'theater-scan', 'reality-check']
    };

    const phaseCommands = phases[phase];
    if (!phaseCommands) {
      throw new Error(`Unknown SPEK phase: ${phase}`);
    }

    // Execute relevant commands for the phase
    const results = [];
    for (const command of phaseCommands) {
      if (!options.skipCommands || !options.skipCommands.includes(command)) {
        try {
          const result = await commandSystem.execute(command, { task, ...options });
          results.push({ command, result });
        } catch (error) {
          results.push({ command, error: error.message });
        }
      }
    }

    return {
      phase,
      task,
      results,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Register a service
   */
  registerService(name, service) {
    this.services.set(name, service);
    console.log(`[GATEWAY] Registered service: ${name}`);
  }

  /**
   * Start the gateway server
   */
  async start() {
    // Initialize command system
    await commandSystem.initialize();

    // Start Express server
    return new Promise((resolve) => {
      this.server = this.app.listen(this.config.port, () => {
        console.log(`[GATEWAY] SPEK API Gateway running on port ${this.config.port}`);
        console.log(`[GATEWAY] Health check: http://localhost:${this.config.port}/health`);
        console.log(`[GATEWAY] API docs: http://localhost:${this.config.port}/api/docs`);
        resolve(this.server);
      });
    });
  }

  /**
   * Stop the gateway server
   */
  async stop() {
    if (this.server) {
      return new Promise((resolve) => {
        this.server.close(() => {
          console.log('[GATEWAY] SPEK API Gateway stopped');
          resolve();
        });
      });
    }
  }
}

// Export the gateway class
module.exports = SPEKGateway;

// If run directly, start the server
if (require.main === module) {
  const gateway = new SPEKGateway();

  gateway.start().catch(console.error);

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('[GATEWAY] SIGTERM received, shutting down gracefully');
    await gateway.stop();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    console.log('[GATEWAY] SIGINT received, shutting down gracefully');
    await gateway.stop();
    process.exit(0);
  });
}