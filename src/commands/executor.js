/**
 * Command Executor Engine
 * Executes registered SPEK commands with proper context and error handling
 */

const { spawn, exec } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const fs = require('fs').promises;
const EventEmitter = require('events');

const execAsync = promisify(exec);

class CommandExecutor extends EventEmitter {
  constructor(registry, validator) {
    super();
    this.registry = registry;
    this.validator = validator;
    this.activeExecutions = new Map();
    this.executionHistory = [];
    this.maxConcurrent = 5;
  }

  /**
   * Execute a command by name with arguments
   */
  async execute(commandName, args = {}, context = {}) {
    // Validate command exists
    const command = this.registry.get(commandName);
    if (!command) {
      throw new Error(`Command not found: ${commandName}`);
    }

    // Validate arguments
    const validation = await this.validator.validate(command, args);
    if (!validation.valid) {
      throw new Error(`Invalid arguments: ${validation.errors.join(', ')}`);
    }

    // Check concurrent execution limit
    if (this.activeExecutions.size >= this.maxConcurrent) {
      throw new Error(`Maximum concurrent executions (${this.maxConcurrent}) reached`);
    }

    // Create execution context
    const executionId = this.generateExecutionId();
    const execution = {
      id: executionId,
      command: commandName,
      args,
      context,
      startTime: Date.now(),
      status: 'running',
      result: null,
      error: null
    };

    this.activeExecutions.set(executionId, execution);
    this.emit('execution:start', execution);

    try {
      // Execute based on command type
      const result = await this.executeCommand(command, args, context);

      execution.result = result;
      execution.status = 'completed';
      execution.endTime = Date.now();
      execution.duration = execution.endTime - execution.startTime;

      this.emit('execution:complete', execution);
      return result;

    } catch (error) {
      execution.error = error;
      execution.status = 'failed';
      execution.endTime = Date.now();
      execution.duration = execution.endTime - execution.startTime;

      this.emit('execution:error', execution);
      throw error;

    } finally {
      this.activeExecutions.delete(executionId);
      this.executionHistory.push(execution);

      // Keep only last 100 executions in history
      if (this.executionHistory.length > 100) {
        this.executionHistory.shift();
      }
    }
  }

  /**
   * Execute the actual command
   */
  async executeCommand(command, args, context) {
    // Determine execution method based on executor type
    if (command.executorModule) {
      return await this.executeModule(command, args, context);
    } else if (command.executor) {
      return await this.executeExternal(command, args, context);
    } else {
      throw new Error(`No executor defined for command: ${command.name}`);
    }
  }

  /**
   * Execute JavaScript module
   */
  async executeModule(command, args, context) {
    const modulePath = path.join(__dirname, 'executors', command.executorModule + '.js');

    try {
      // Check if module exists
      await fs.access(modulePath);

      // Load and execute module
      const executor = require(modulePath);

      if (typeof executor.execute === 'function') {
        return await executor.execute(args, context);
      } else if (typeof executor === 'function') {
        return await executor(args, context);
      } else {
        throw new Error(`Invalid executor module: ${command.executorModule}`);
      }
    } catch (error) {
      // Fallback to Python executor for analyzer commands
      if (command.name.startsWith('conn-') || command.name.startsWith('sec-')) {
        return await this.executePythonAnalyzer(command, args, context);
      }
      throw error;
    }
  }

  /**
   * Execute Python analyzer commands
   */
  async executePythonAnalyzer(command, args, context) {
    const analyzerMap = {
      'conn-scan': 'analyzer.core.connascence_scanner',
      'conn-arch': 'analyzer.core.architecture_analyzer',
      'conn-monitor': 'analyzer.monitoring.real_time_monitor',
      'conn-cache': 'analyzer.optimization.cache_manager',
      'sec-scan': 'analyzer.security.semgrep_scanner'
    };

    const pythonModule = analyzerMap[command.name];
    if (!pythonModule) {
      throw new Error(`No Python module mapped for: ${command.name}`);
    }

    // Build Python command
    const pythonArgs = Object.entries(args)
      .map(([key, value]) => `--${key}="${value}"`)
      .join(' ');

    const pythonCommand = `python -m ${pythonModule} ${pythonArgs}`;

    try {
      const { stdout, stderr } = await execAsync(pythonCommand, {
        cwd: process.cwd(),
        maxBuffer: 10 * 1024 * 1024 // 10MB buffer
      });

      if (stderr && !stderr.includes('WARNING')) {
        console.warn('Python stderr:', stderr);
      }

      // Parse JSON output if possible
      try {
        return JSON.parse(stdout);
      } catch {
        return { output: stdout, error: stderr };
      }
    } catch (error) {
      throw new Error(`Python execution failed: ${error.message}`);
    }
  }

  /**
   * Execute external command
   */
  async executeExternal(command, args, context) {
    const cmdParts = command.executor.split(' ');
    const executable = cmdParts[0];
    const cmdArgs = cmdParts.slice(1);

    // Add command arguments
    for (const [key, value] of Object.entries(args)) {
      if (value !== undefined && value !== null) {
        cmdArgs.push(`--${key}`, String(value));
      }
    }

    return new Promise((resolve, reject) => {
      const child = spawn(executable, cmdArgs, {
        cwd: context.cwd || process.cwd(),
        env: { ...process.env, ...context.env }
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
        this.emit('execution:output', { type: 'stdout', data: data.toString() });
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
        this.emit('execution:output', { type: 'stderr', data: data.toString() });
      });

      child.on('error', (error) => {
        reject(new Error(`Failed to start command: ${error.message}`));
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve({ stdout, stderr, code });
        } else {
          reject(new Error(`Command failed with code ${code}: ${stderr}`));
        }
      });
    });
  }

  /**
   * Execute multiple commands in parallel
   */
  async executeParallel(commands) {
    const promises = commands.map(({ name, args, context }) =>
      this.execute(name, args, context).catch(error => ({
        command: name,
        error: error.message
      }))
    );

    return await Promise.all(promises);
  }

  /**
   * Execute commands in sequence
   */
  async executeSequence(commands) {
    const results = [];

    for (const { name, args, context } of commands) {
      try {
        const result = await this.execute(name, args, context);
        results.push({ command: name, result });
      } catch (error) {
        results.push({ command: name, error: error.message });
        // Continue with next command
      }
    }

    return results;
  }

  /**
   * Cancel an active execution
   */
  async cancel(executionId) {
    const execution = this.activeExecutions.get(executionId);
    if (!execution) {
      throw new Error(`Execution not found: ${executionId}`);
    }

    // TODO: Implement actual cancellation logic
    execution.status = 'cancelled';
    this.activeExecutions.delete(executionId);
    this.emit('execution:cancelled', execution);
  }

  /**
   * Get execution status
   */
  getStatus(executionId) {
    const active = this.activeExecutions.get(executionId);
    if (active) return active;

    const historical = this.executionHistory.find(e => e.id === executionId);
    return historical || null;
  }

  /**
   * Get all active executions
   */
  getActiveExecutions() {
    return Array.from(this.activeExecutions.values());
  }

  /**
   * Generate unique execution ID
   */
  generateExecutionId() {
    return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get execution statistics
   */
  getStats() {
    const completed = this.executionHistory.filter(e => e.status === 'completed').length;
    const failed = this.executionHistory.filter(e => e.status === 'failed').length;
    const avgDuration = this.executionHistory
      .filter(e => e.duration)
      .reduce((sum, e) => sum + e.duration, 0) / (completed || 1);

    return {
      active: this.activeExecutions.size,
      completed,
      failed,
      total: this.executionHistory.length,
      avgDuration: Math.round(avgDuration),
      successRate: completed / (completed + failed) || 0
    };
  }
}

module.exports = CommandExecutor;