/**
 * Tool Management System
 * Manages linter tool lifecycle, configuration, and resource allocation
 * MESH NODE AGENT: Integration Specialist for Linter Integration Architecture Swarm
 */

import { EventEmitter } from 'events';
import { spawn, ChildProcess } from 'child_process';
import { promises as fs } from 'fs';
import { join, resolve } from 'path';
import { performance } from 'perf_hooks';

// Import types from the main engine
import { LinterTool, CircuitBreakerState } from './real-time-ingestion-engine';

interface ToolEnvironment {
  nodeVersion?: string;
  pythonVersion?: string;
  environmentVariables: Record<string, string>;
  workingDirectory: string;
  pathExtensions: string[];
}

interface ToolConfiguration {
  configFile?: string;
  rules?: Record<string, any>;
  ignore?: string[];
  include?: string[];
  customArgs?: string[];
  environment?: ToolEnvironment;
}

interface ResourceAllocation {
  cpuLimit?: number;
  memoryLimit?: number;
  concurrencyLimit: number;
  priorityWeight: number;
  executionQuota: number;
  throttleInterval: number;
}

interface ToolHealth {
  isHealthy: boolean;
  lastHealthCheck: number;
  healthScore: number;
  failureRate: number;
  averageExecutionTime: number;
  successfulExecutions: number;
  failedExecutions: number;
  lastError?: string;
}

interface ToolMetrics {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageExecutionTime: number;
  minExecutionTime: number;
  maxExecutionTime: number;
  totalViolationsFound: number;
  uniqueRulesTriggered: Set<string>;
  resourceUsage: {
    peakMemory: number;
    totalCpuTime: number;
    diskUsage: number;
  };
}

interface ToolRecoveryProcedure {
  resetConfiguration: boolean;
  reinstallTool: boolean;
  clearCache: boolean;
  restartEnvironment: boolean;
  escalateToAdmin: boolean;
  customRecoverySteps: string[];
}

/**
 * Tool Management System
 * Comprehensive lifecycle management for linter tools
 */
export class ToolManagementSystem extends EventEmitter {
  private readonly tools: Map<string, LinterTool> = new Map();
  private readonly configurations: Map<string, ToolConfiguration> = new Map();
  private readonly environments: Map<string, ToolEnvironment> = new Map();
  private readonly resourceAllocations: Map<string, ResourceAllocation> = new Map();
  private readonly healthStatus: Map<string, ToolHealth> = new Map();
  private readonly metrics: Map<string, ToolMetrics> = new Map();
  private readonly circuitBreakers: Map<string, CircuitBreakerState> = new Map();
  private readonly recoveryProcedures: Map<string, ToolRecoveryProcedure> = new Map();
  
  private readonly runningProcesses: Map<string, ChildProcess> = new Map();
  private readonly executionQueue: Map<string, Array<() => Promise<void>>> = new Map();
  
  private readonly maxGlobalConcurrency: number = 10;
  private readonly healthCheckInterval: number = 30000;
  private readonly metricsRetentionPeriod: number = 86400000; // 24 hours
  
  constructor(private readonly workspaceRoot: string) {
    super();
    this.initializeDefaultEnvironments();
    this.initializeDefaultResourceAllocations();
    this.setupPeriodicTasks();
  }

  /**
   * Initialize default tool environments
   */
  private initializeDefaultEnvironments(): void {
    // Node.js environment for TypeScript/JavaScript tools
    this.environments.set('nodejs', {
      nodeVersion: '18.0.0',
      environmentVariables: {
        NODE_ENV: 'production',
        NODE_OPTIONS: '--max-old-space-size=4096'
      },
      workingDirectory: this.workspaceRoot,
      pathExtensions: ['node_modules/.bin']
    });

    // Python environment for Python tools
    this.environments.set('python', {
      pythonVersion: '3.8.0',
      environmentVariables: {
        PYTHONPATH: this.workspaceRoot,
        PYTHONUNBUFFERED: '1',
        PYTHONDONTWRITEBYTECODE: '1'
      },
      workingDirectory: this.workspaceRoot,
      pathExtensions: ['.venv/bin', 'venv/Scripts']
    });

    // Generic system environment
    this.environments.set('system', {
      environmentVariables: {},
      workingDirectory: this.workspaceRoot,
      pathExtensions: []
    });
  }

  /**
   * Initialize default resource allocations
   */
  private initializeDefaultResourceAllocations(): void {
    const defaultAllocations: Record<string, ResourceAllocation> = {
      eslint: {
        concurrencyLimit: 3,
        priorityWeight: 0.8,
        executionQuota: 100,
        throttleInterval: 1000
      },
      tsc: {
        concurrencyLimit: 1, // TypeScript compiler is resource-intensive
        priorityWeight: 0.9,
        executionQuota: 50,
        throttleInterval: 2000
      },
      flake8: {
        concurrencyLimit: 2,
        priorityWeight: 0.7,
        executionQuota: 80,
        throttleInterval: 1500
      },
      pylint: {
        concurrencyLimit: 1, // Pylint is slow
        priorityWeight: 0.6,
        executionQuota: 30,
        throttleInterval: 3000
      },
      ruff: {
        concurrencyLimit: 4, // Ruff is very fast
        priorityWeight: 0.8,
        executionQuota: 150,
        throttleInterval: 500
      },
      mypy: {
        concurrencyLimit: 2,
        priorityWeight: 0.7,
        executionQuota: 60,
        throttleInterval: 2000
      },
      bandit: {
        concurrencyLimit: 2,
        priorityWeight: 0.9, // Security is high priority
        executionQuota: 70,
        throttleInterval: 1500
      }
    };

    Object.entries(defaultAllocations).forEach(([toolId, allocation]) => {
      this.resourceAllocations.set(toolId, allocation);
    });
  }

  /**
   * Setup periodic health checks and maintenance tasks
   */
  private setupPeriodicTasks(): void {
    // Health check interval
    setInterval(() => {
      this.performHealthChecks();
    }, this.healthCheckInterval);

    // Metrics cleanup interval
    setInterval(() => {
      this.cleanupOldMetrics();
    }, this.metricsRetentionPeriod / 24); // Check every hour

    // Resource usage monitoring
    setInterval(() => {
      this.monitorResourceUsage();
    }, 5000); // Every 5 seconds
  }

  /**
   * Register a new linter tool
   */
  public async registerTool(
    tool: LinterTool, 
    configuration?: ToolConfiguration
  ): Promise<void> {
    try {
      // Validate tool installation
      await this.validateToolInstallation(tool);
      
      // Store tool and configuration
      this.tools.set(tool.id, tool);
      if (configuration) {
        this.configurations.set(tool.id, configuration);
      }
      
      // Initialize health status and metrics
      this.initializeToolHealth(tool.id);
      this.initializeToolMetrics(tool.id);
      
      // Setup circuit breaker
      this.circuitBreakers.set(tool.id, {
        isOpen: false,
        failureCount: 0,
        lastFailureTime: 0,
        successCount: 0,
        nextAttemptTime: 0
      });
      
      // Setup recovery procedures
      this.setupRecoveryProcedures(tool);
      
      this.emit('tool_registered', { toolId: tool.id, name: tool.name });
      
    } catch (error) {
      this.emit('tool_registration_failed', { 
        toolId: tool.id, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Validate that a tool is properly installed and accessible
   */
  private async validateToolInstallation(tool: LinterTool): Promise<void> {
    return new Promise((resolve, reject) => {
      const testCommand = tool.healthCheckCommand || `${tool.command} --version`;
      const [command, ...args] = testCommand.split(' ');
      
      const process = spawn(command, args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 10000
      });
      
      let stdout = '';
      let stderr = '';
      
      process.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      process.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Tool validation failed for ${tool.name}: ${stderr || stdout}`));
        }
      });
      
      process.on('error', (error) => {
        reject(new Error(`Failed to execute ${tool.name}: ${error.message}`));
      });
    });
  }

  /**
   * Initialize health status for a tool
   */
  private initializeToolHealth(toolId: string): void {
    this.healthStatus.set(toolId, {
      isHealthy: true,
      lastHealthCheck: Date.now(),
      healthScore: 100,
      failureRate: 0,
      averageExecutionTime: 0,
      successfulExecutions: 0,
      failedExecutions: 0
    });
  }

  /**
   * Initialize metrics for a tool
   */
  private initializeToolMetrics(toolId: string): void {
    this.metrics.set(toolId, {
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      averageExecutionTime: 0,
      minExecutionTime: Infinity,
      maxExecutionTime: 0,
      totalViolationsFound: 0,
      uniqueRulesTriggered: new Set(),
      resourceUsage: {
        peakMemory: 0,
        totalCpuTime: 0,
        diskUsage: 0
      }
    });
  }

  /**
   * Setup recovery procedures for a tool
   */
  private setupRecoveryProcedures(tool: LinterTool): void {
    const procedures: ToolRecoveryProcedure = {
      resetConfiguration: true,
      reinstallTool: false,
      clearCache: true,
      restartEnvironment: false,
      escalateToAdmin: false,
      customRecoverySteps: []
    };

    // Tool-specific recovery procedures
    switch (tool.id) {
      case 'eslint':
        procedures.customRecoverySteps = [
          'npm install eslint --save-dev',
          'rm -rf node_modules/.cache/eslint'
        ];
        break;
      case 'tsc':
        procedures.customRecoverySteps = [
          'npm install typescript --save-dev',
          'rm -rf node_modules/.cache/tsc'
        ];
        break;
      case 'flake8':
      case 'pylint':
      case 'mypy':
      case 'bandit':
        procedures.customRecoverySteps = [
          `pip install --upgrade ${tool.id}`,
          'rm -rf __pycache__',
          'rm -rf .mypy_cache'
        ];
        break;
    }

    this.recoveryProcedures.set(tool.id, procedures);
  }

  /**
   * Execute a tool with full lifecycle management
   */
  public async executeTool(
    toolId: string, 
    filePaths: string[], 
    options: ToolExecutionOptions = {}
  ): Promise<ToolExecutionResult> {
    const tool = this.tools.get(toolId);
    if (!tool) {
      throw new Error(`Tool not found: ${toolId}`);
    }

    const allocation = this.resourceAllocations.get(toolId)!;
    const health = this.healthStatus.get(toolId)!;
    const circuitBreaker = this.circuitBreakers.get(toolId)!;

    // Check circuit breaker
    if (circuitBreaker.isOpen) {
      if (Date.now() < circuitBreaker.nextAttemptTime) {
        throw new Error(`Circuit breaker open for tool ${toolId}`);
      }
    }

    // Check health status
    if (!health.isHealthy && !options.forceExecution) {
      throw new Error(`Tool ${toolId} is unhealthy. Use forceExecution to override.`);
    }

    // Wait for resource availability
    await this.waitForResourceAvailability(toolId);

    const startTime = performance.now();
    let executionResult: ToolExecutionResult;

    try {
      // Execute with resource monitoring
      executionResult = await this.executeWithMonitoring(tool, filePaths, options);
      
      // Update success metrics
      this.updateSuccessMetrics(toolId, performance.now() - startTime, executionResult);
      
      // Reset circuit breaker on success
      circuitBreaker.failureCount = 0;
      circuitBreaker.successCount++;
      circuitBreaker.isOpen = false;
      
      return executionResult;
      
    } catch (error) {
      // Update failure metrics
      this.updateFailureMetrics(toolId, performance.now() - startTime, error);
      
      // Update circuit breaker
      circuitBreaker.failureCount++;
      circuitBreaker.lastFailureTime = Date.now();
      
      if (circuitBreaker.failureCount >= 5) {
        circuitBreaker.isOpen = true;
        circuitBreaker.nextAttemptTime = Date.now() + 60000; // 1 minute
        
        // Attempt recovery
        await this.attemptToolRecovery(toolId);
      }
      
      throw error;
    }
  }

  /**
   * Wait for resource availability based on allocation limits
   */
  private async waitForResourceAvailability(toolId: string): Promise<void> {
    const allocation = this.resourceAllocations.get(toolId)!;
    const runningCount = this.getRunningProcessCount(toolId);
    
    if (runningCount >= allocation.concurrencyLimit) {
      return new Promise((resolve) => {
        const queue = this.executionQueue.get(toolId) || [];
        queue.push(resolve);
        this.executionQueue.set(toolId, queue);
      });
    }
  }

  /**
   * Execute tool with comprehensive monitoring
   */
  private async executeWithMonitoring(
    tool: LinterTool, 
    filePaths: string[], 
    options: ToolExecutionOptions
  ): Promise<ToolExecutionResult> {
    const environment = this.getToolEnvironment(tool);
    const configuration = this.configurations.get(tool.id);
    
    // Prepare execution arguments
    const args = this.prepareExecutionArgs(tool, filePaths, configuration, options);
    
    return new Promise((resolve, reject) => {
      const startTime = performance.now();
      const startMemory = process.memoryUsage();
      
      const childProcess = spawn(tool.command, args, {
        env: { ...process.env, ...environment.environmentVariables },
        cwd: environment.workingDirectory,
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      this.runningProcesses.set(`${tool.id}_${Date.now()}`, childProcess);
      
      let stdout = '';
      let stderr = '';
      
      childProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      childProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      childProcess.on('close', (code) => {
        const executionTime = performance.now() - startTime;
        const endMemory = process.memoryUsage();
        const memoryUsed = endMemory.heapUsed - startMemory.heapUsed;
        
        if (code === 0 || (code === 1 && stdout)) {
          resolve({
            success: true,
            output: stdout,
            stderr,
            executionTime,
            memoryUsed,
            exitCode: code,
            violationsFound: this.countViolationsInOutput(tool, stdout)
          });
        } else {
          reject(new Error(`Tool execution failed with code ${code}: ${stderr}`));
        }
        
        // Clean up process reference
        this.runningProcesses.delete(`${tool.id}_${Date.now()}`);
        
        // Process next in queue
        this.processExecutionQueue(tool.id);
      });
      
      childProcess.on('error', (error) => {
        reject(error);
        this.runningProcesses.delete(`${tool.id}_${Date.now()}`);
        this.processExecutionQueue(tool.id);
      });
      
      // Set timeout
      setTimeout(() => {
        if (!childProcess.killed) {
          childProcess.kill('SIGTERM');
          reject(new Error(`Tool execution timed out after ${tool.timeout}ms`));
        }
      }, tool.timeout);
    });
  }

  /**
   * Perform health checks on all registered tools
   */
  private async performHealthChecks(): Promise<void> {
    const healthPromises = Array.from(this.tools.keys()).map(toolId => 
      this.performToolHealthCheck(toolId)
    );
    
    await Promise.allSettled(healthPromises);
  }

  /**
   * Perform health check on a specific tool
   */
  private async performToolHealthCheck(toolId: string): Promise<void> {
    const tool = this.tools.get(toolId)!;
    const health = this.healthStatus.get(toolId)!;
    
    try {
      await this.validateToolInstallation(tool);
      
      health.isHealthy = true;
      health.lastHealthCheck = Date.now();
      health.healthScore = Math.min(100, health.healthScore + 10);
      
      this.emit('tool_health_ok', { toolId, healthScore: health.healthScore });
      
    } catch (error) {
      health.isHealthy = false;
      health.lastHealthCheck = Date.now();
      health.healthScore = Math.max(0, health.healthScore - 20);
      health.lastError = error.message;
      
      this.emit('tool_health_degraded', { 
        toolId, 
        error: error.message, 
        healthScore: health.healthScore 
      });
      
      // Attempt recovery if health is critically low
      if (health.healthScore <= 20) {
        await this.attemptToolRecovery(toolId);
      }
    }
  }

  /**
   * Attempt to recover a failed tool
   */
  private async attemptToolRecovery(toolId: string): Promise<void> {
    const procedures = this.recoveryProcedures.get(toolId);
    if (!procedures) return;
    
    this.emit('tool_recovery_started', { toolId });
    
    try {
      if (procedures.resetConfiguration) {
        await this.resetToolConfiguration(toolId);
      }
      
      if (procedures.clearCache) {
        await this.clearToolCache(toolId);
      }
      
      // Execute custom recovery steps
      for (const step of procedures.customRecoverySteps) {
        await this.executeRecoveryStep(step);
      }
      
      // Reinitialize tool health
      this.initializeToolHealth(toolId);
      
      this.emit('tool_recovery_completed', { toolId });
      
    } catch (error) {
      this.emit('tool_recovery_failed', { toolId, error: error.message });
      
      if (procedures.escalateToAdmin) {
        this.emit('tool_recovery_escalation', { toolId, error: error.message });
      }
    }
  }

  /**
   * Get comprehensive tool status
   */
  public getToolStatus(toolId: string): ToolStatus {
    const tool = this.tools.get(toolId);
    const health = this.healthStatus.get(toolId);
    const metrics = this.metrics.get(toolId);
    const circuitBreaker = this.circuitBreakers.get(toolId);
    const allocation = this.resourceAllocations.get(toolId);
    
    if (!tool || !health || !metrics || !circuitBreaker || !allocation) {
      throw new Error(`Tool not found: ${toolId}`);
    }
    
    return {
      tool,
      health,
      metrics,
      circuitBreaker,
      allocation,
      isRunning: this.getRunningProcessCount(toolId) > 0,
      queueLength: (this.executionQueue.get(toolId) || []).length
    };
  }

  /**
   * Get status of all tools
   */
  public getAllToolStatus(): Record<string, ToolStatus> {
    const status: Record<string, ToolStatus> = {};
    
    this.tools.forEach((_, toolId) => {
      status[toolId] = this.getToolStatus(toolId);
    });
    
    return status;
  }

  // Helper methods
  private getToolEnvironment(tool: LinterTool): ToolEnvironment {
    // Determine environment based on tool type
    if (['eslint', 'tsc'].includes(tool.id)) {
      return this.environments.get('nodejs')!;
    } else if (['flake8', 'pylint', 'mypy', 'bandit', 'ruff'].includes(tool.id)) {
      return this.environments.get('python')!;
    } else {
      return this.environments.get('system')!;
    }
  }

  private prepareExecutionArgs(
    tool: LinterTool, 
    filePaths: string[], 
    configuration?: ToolConfiguration, 
    options?: ToolExecutionOptions
  ): string[] {
    let args = [...tool.args];
    
    if (configuration?.customArgs) {
      args = [...args, ...configuration.customArgs];
    }
    
    if (options?.additionalArgs) {
      args = [...args, ...options.additionalArgs];
    }
    
    args = [...args, ...filePaths];
    
    return args;
  }

  private getRunningProcessCount(toolId: string): number {
    return Array.from(this.runningProcesses.keys())
      .filter(key => key.startsWith(`${toolId}_`))
      .length;
  }

  private processExecutionQueue(toolId: string): void {
    const queue = this.executionQueue.get(toolId) || [];
    if (queue.length > 0) {
      const nextExecution = queue.shift()!;
      nextExecution();
      this.executionQueue.set(toolId, queue);
    }
  }

  private countViolationsInOutput(tool: LinterTool, output: string): number {
    // Basic violation counting logic - would be enhanced per tool
    try {
      if (tool.outputFormat === 'json') {
        const data = JSON.parse(output);
        if (Array.isArray(data)) {
          return data.reduce((count, file) => count + (file.messages?.length || 0), 0);
        }
      }
    } catch (error) {
      // Fallback to line counting for text output
      return output.split('\n').filter(line => line.trim()).length;
    }
    return 0;
  }

  private updateSuccessMetrics(toolId: string, executionTime: number, result: ToolExecutionResult): void {
    const metrics = this.metrics.get(toolId)!;
    const health = this.healthStatus.get(toolId)!;
    
    metrics.totalExecutions++;
    metrics.successfulExecutions++;
    metrics.totalViolationsFound += result.violationsFound;
    
    // Update execution time statistics
    const currentAvg = metrics.averageExecutionTime;
    metrics.averageExecutionTime = (currentAvg * (metrics.totalExecutions - 1) + executionTime) / metrics.totalExecutions;
    metrics.minExecutionTime = Math.min(metrics.minExecutionTime, executionTime);
    metrics.maxExecutionTime = Math.max(metrics.maxExecutionTime, executionTime);
    
    // Update health
    health.successfulExecutions++;
    health.averageExecutionTime = metrics.averageExecutionTime;
    health.failureRate = metrics.failedExecutions / metrics.totalExecutions;
  }

  private updateFailureMetrics(toolId: string, executionTime: number, error: Error): void {
    const metrics = this.metrics.get(toolId)!;
    const health = this.healthStatus.get(toolId)!;
    
    metrics.totalExecutions++;
    metrics.failedExecutions++;
    
    health.failedExecutions++;
    health.failureRate = metrics.failedExecutions / metrics.totalExecutions;
    health.lastError = error.message;
  }

  private async resetToolConfiguration(toolId: string): Promise<void> {
    // Implementation for resetting tool configuration
  }

  private async clearToolCache(toolId: string): Promise<void> {
    // Implementation for clearing tool cache
  }

  private async executeRecoveryStep(step: string): Promise<void> {
    // Implementation for executing recovery commands
  }

  private cleanupOldMetrics(): void {
    // Implementation for cleaning up old metrics data
  }

  private monitorResourceUsage(): void {
    // Implementation for monitoring resource usage
  }
}

// Additional interfaces
interface ToolExecutionOptions {
  forceExecution?: boolean;
  additionalArgs?: string[];
  timeout?: number;
  priority?: 'low' | 'medium' | 'high' | 'critical';
}

interface ToolExecutionResult {
  success: boolean;
  output: string;
  stderr: string;
  executionTime: number;
  memoryUsed: number;
  exitCode: number;
  violationsFound: number;
}

interface ToolStatus {
  tool: LinterTool;
  health: ToolHealth;
  metrics: ToolMetrics;
  circuitBreaker: CircuitBreakerState;
  allocation: ResourceAllocation;
  isRunning: boolean;
  queueLength: number;
}

export {
  ToolManagementSystem,
  ToolConfiguration,
  ToolEnvironment,
  ResourceAllocation,
  ToolHealth,
  ToolMetrics,
  ToolExecutionOptions,
  ToolExecutionResult,
  ToolStatus
};
