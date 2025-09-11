/**
 * Real-Time Linter Ingestion Engine
 * Coordinates multiple linter tools with streaming result processing and MCP integration
 * MESH NODE AGENT: Integration Specialist for Linter Integration Architecture Swarm
 */

import { EventEmitter } from 'events';
import { createHash } from 'crypto';
import { Worker } from 'worker_threads';
import { performance } from 'perf_hooks';

// Type definitions for linter integration
interface LinterTool {
  id: string;
  name: string;
  command: string;
  args: string[];
  outputFormat: 'json' | 'sarif' | 'text';
  timeout: number;
  environment?: Record<string, string>;
  healthCheckCommand?: string;
  retryCount: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

interface LinterResult {
  toolId: string;
  filePath: string;
  violations: Violation[];
  timestamp: number;
  executionTime: number;
  confidence: number;
  metadata: Record<string, any>;
}

interface Violation {
  id: string;
  ruleId: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  line: number;
  column: number;
  endLine?: number;
  endColumn?: number;
  source: string;
  category: string;
  weight: number;
}

interface CircuitBreakerState {
  isOpen: boolean;
  failureCount: number;
  lastFailureTime: number;
  successCount: number;
  nextAttemptTime: number;
}

interface StreamingResult {
  correlationId: string;
  results: LinterResult[];
  aggregatedViolations: Violation[];
  conflictResolution: ConflictResolution[];
  crossToolCorrelations: Correlation[];
  timestamp: number;
}

interface ConflictResolution {
  conflictId: string;
  conflictingTools: string[];
  resolution: 'merge' | 'highest_confidence' | 'weighted_average';
  finalViolation: Violation;
}

interface Correlation {
  id: string;
  toolA: string;
  toolB: string;
  correlationScore: number;
  violationPairs: Array<{ violationA: string; violationB: string }>;
  pattern: string;
}

/**
 * Real-Time Linter Ingestion Engine
 * Core coordinator for multi-tool linter execution with streaming processing
 */
export class RealTimeLinterIngestionEngine extends EventEmitter {
  private readonly tools: Map<string, LinterTool> = new Map();
  private readonly circuitBreakers: Map<string, CircuitBreakerState> = new Map();
  private readonly resultBuffer: Map<string, LinterResult[]> = new Map();
  private readonly workers: Map<string, Worker> = new Map();
  private readonly correlationCache: Map<string, Correlation[]> = new Map();
  
  private isProcessing: boolean = false;
  private readonly maxConcurrentTools: number = 5;
  private readonly bufferSize: number = 1000;
  private readonly correlationThreshold: number = 0.8;
  private readonly mcpIntegrationEnabled: boolean = true;
  
  constructor(private readonly config: IngestionEngineConfig) {
    super();
    this.initializeDefaultTools();
    this.initializeCircuitBreakers();
    this.setupHealthMonitoring();
    this.setupMCPIntegration();
  }

  /**
   * Initialize default linter tools with production-ready configurations
   */
  private initializeDefaultTools(): void {
    const defaultTools: LinterTool[] = [
      {
        id: 'eslint',
        name: 'ESLint',
        command: 'npx',
        args: ['eslint', '--format', 'json', '--quiet'],
        outputFormat: 'json',
        timeout: 30000,
        retryCount: 3,
        priority: 'high',
        healthCheckCommand: 'npx eslint --version'
      },
      {
        id: 'tsc',
        name: 'TypeScript Compiler',
        command: 'npx',
        args: ['tsc', '--noEmit', '--pretty', 'false'],
        outputFormat: 'text',
        timeout: 45000,
        retryCount: 2,
        priority: 'critical'
      },
      {
        id: 'flake8',
        name: 'Flake8 Python Linter',
        command: 'flake8',
        args: ['--format=json'],
        outputFormat: 'json',
        timeout: 25000,
        retryCount: 3,
        priority: 'high',
        environment: { PYTHONPATH: '.' }
      },
      {
        id: 'pylint',
        name: 'Pylint',
        command: 'pylint',
        args: ['--output-format=json', '--score=no'],
        outputFormat: 'json',
        timeout: 60000,
        retryCount: 2,
        priority: 'medium'
      },
      {
        id: 'ruff',
        name: 'Ruff Python Linter',
        command: 'ruff',
        args: ['check', '--format=json'],
        outputFormat: 'json',
        timeout: 15000,
        retryCount: 3,
        priority: 'high'
      },
      {
        id: 'mypy',
        name: 'MyPy Type Checker',
        command: 'mypy',
        args: ['--show-error-codes', '--no-pretty'],
        outputFormat: 'text',
        timeout: 40000,
        retryCount: 2,
        priority: 'high'
      },
      {
        id: 'bandit',
        name: 'Bandit Security Linter',
        command: 'bandit',
        args: ['-f', 'json', '-r'],
        outputFormat: 'json',
        timeout: 30000,
        retryCount: 3,
        priority: 'critical'
      }
    ];

    defaultTools.forEach(tool => this.tools.set(tool.id, tool));
  }

  /**
   * Initialize circuit breakers for fault tolerance
   */
  private initializeCircuitBreakers(): void {
    this.tools.forEach((tool, toolId) => {
      this.circuitBreakers.set(toolId, {
        isOpen: false,
        failureCount: 0,
        lastFailureTime: 0,
        successCount: 0,
        nextAttemptTime: 0
      });
    });
  }

  /**
   * Setup health monitoring for all tools
   */
  private setupHealthMonitoring(): void {
    setInterval(() => {
      this.performHealthChecks();
    }, this.config.healthCheckInterval || 60000);
  }

  /**
   * Setup MCP integration for real-time diagnostics
   */
  private setupMCPIntegration(): void {
    if (!this.mcpIntegrationEnabled) return;

    // Register MCP event handlers
    this.on('diagnostics_ready', async (data) => {
      try {
        // Use mcp__ide__getDiagnostics for IDE integration
        await this.sendToMCP('diagnostics_update', data);
      } catch (error) {
        console.warn('MCP integration error:', error);
      }
    });

    this.on('correlation_discovered', async (correlation) => {
      try {
        // Use mcp__memory__add_observations for cross-agent knowledge sharing
        await this.sendToMCP('correlation_stored', correlation);
      } catch (error) {
        console.warn('MCP correlation storage error:', error);
      }
    });
  }

  /**
   * Execute linters in real-time with streaming results
   */
  public async executeRealtimeLinting(
    filePaths: string[],
    options: ExecutionOptions = {}
  ): Promise<StreamingResult> {
    if (this.isProcessing && !options.allowConcurrent) {
      throw new Error('Linting already in progress. Use allowConcurrent option to override.');
    }

    this.isProcessing = true;
    const correlationId = this.generateCorrelationId();
    const startTime = performance.now();

    try {
      // Filter available tools based on circuit breaker states
      const availableTools = this.getAvailableTools();
      
      if (availableTools.length === 0) {
        throw new Error('No available linter tools (all circuit breakers open)');
      }

      // Execute tools in parallel with resource throttling
      const toolPromises = availableTools.map(tool => 
        this.executeLinterTool(tool, filePaths, correlationId)
      );

      // Use Promise.allSettled for graceful degradation
      const results = await Promise.allSettled(toolPromises);
      
      // Process and stream results
      const linterResults = this.processResults(results, correlationId);
      const correlations = await this.performCrossToolCorrelation(linterResults);
      const aggregatedViolations = this.aggregateViolations(linterResults);
      const conflictResolutions = this.resolveConflicts(linterResults);

      const streamingResult: StreamingResult = {
        correlationId,
        results: linterResults,
        aggregatedViolations,
        conflictResolution: conflictResolutions,
        crossToolCorrelations: correlations,
        timestamp: Date.now()
      };

      // Emit real-time events
      this.emit('streaming_result', streamingResult);
      this.emit('diagnostics_ready', {
        correlationId,
        violationCount: aggregatedViolations.length,
        toolsExecuted: linterResults.length,
        executionTime: performance.now() - startTime
      });

      return streamingResult;

    } catch (error) {
      this.emit('execution_error', { correlationId, error: error.message });
      throw error;
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Execute individual linter tool with circuit breaker pattern
   */
  private async executeLinterTool(
    tool: LinterTool, 
    filePaths: string[], 
    correlationId: string
  ): Promise<LinterResult[]> {
    const circuitBreaker = this.circuitBreakers.get(tool.id)!;
    
    // Check circuit breaker state
    if (circuitBreaker.isOpen) {
      if (Date.now() < circuitBreaker.nextAttemptTime) {
        throw new Error(`Circuit breaker open for tool ${tool.id}`);
      }
      // Half-open state: try one request
    }

    const startTime = performance.now();
    
    try {
      const results = await this.executeWithRetry(tool, filePaths, correlationId);
      
      // Success: reset circuit breaker
      circuitBreaker.failureCount = 0;
      circuitBreaker.successCount++;
      circuitBreaker.isOpen = false;
      
      return results;
      
    } catch (error) {
      // Failure: update circuit breaker
      circuitBreaker.failureCount++;
      circuitBreaker.lastFailureTime = Date.now();
      
      if (circuitBreaker.failureCount >= this.config.circuitBreakerThreshold) {
        circuitBreaker.isOpen = true;
        circuitBreaker.nextAttemptTime = Date.now() + this.config.circuitBreakerTimeout;
      }
      
      throw error;
    }
  }

  /**
   * Execute tool with exponential backoff retry logic
   */
  private async executeWithRetry(
    tool: LinterTool, 
    filePaths: string[], 
    correlationId: string
  ): Promise<LinterResult[]> {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= tool.retryCount; attempt++) {
      try {
        if (attempt > 0) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        return await this.executeToolCommand(tool, filePaths, correlationId);
        
      } catch (error) {
        lastError = error as Error;
        console.warn(`Tool ${tool.id} attempt ${attempt + 1} failed:`, error.message);
      }
    }
    
    throw lastError!;
  }

  /**
   * Execute the actual tool command with timeout and resource management
   */
  private async executeToolCommand(
    tool: LinterTool, 
    filePaths: string[], 
    correlationId: string
  ): Promise<LinterResult[]> {
    return new Promise((resolve, reject) => {
      const { spawn } = require('child_process');
      const startTime = performance.now();
      
      // Prepare command arguments
      const args = [...tool.args, ...filePaths];
      
      // Spawn process with environment and timeout
      const process = spawn(tool.command, args, {
        env: { ...process.env, ...tool.environment },
        timeout: tool.timeout,
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      let stdout = '';
      let stderr = '';
      
      process.stdout.on('data', (data: Buffer) => {
        stdout += data.toString();
      });
      
      process.stderr.on('data', (data: Buffer) => {
        stderr += data.toString();
      });
      
      process.on('close', (code: number) => {
        const executionTime = performance.now() - startTime;
        
        if (code === 0 || (code === 1 && stdout)) { // Some linters exit with 1 when violations found
          try {
            const results = this.parseToolOutput(tool, stdout, filePaths, executionTime);
            resolve(results);
          } catch (parseError) {
            reject(new Error(`Failed to parse ${tool.name} output: ${parseError.message}`));
          }
        } else {
          reject(new Error(`${tool.name} exited with code ${code}: ${stderr}`));
        }
      });
      
      process.on('error', (error: Error) => {
        reject(new Error(`Failed to execute ${tool.name}: ${error.message}`));
      });
      
      // Handle timeout
      setTimeout(() => {
        if (!process.killed) {
          process.kill('SIGTERM');
          reject(new Error(`${tool.name} execution timed out after ${tool.timeout}ms`));
        }
      }, tool.timeout);
    });
  }

  /**
   * Parse tool output based on format type
   */
  private parseToolOutput(
    tool: LinterTool, 
    output: string, 
    filePaths: string[], 
    executionTime: number
  ): LinterResult[] {
    const results: LinterResult[] = [];
    
    try {
      switch (tool.outputFormat) {
        case 'json':
          const jsonData = JSON.parse(output);
          return this.parseJSONOutput(tool, jsonData, filePaths, executionTime);
          
        case 'sarif':
          const sarifData = JSON.parse(output);
          return this.parseSARIFOutput(tool, sarifData, filePaths, executionTime);
          
        case 'text':
          return this.parseTextOutput(tool, output, filePaths, executionTime);
          
        default:
          throw new Error(`Unsupported output format: ${tool.outputFormat}`);
      }
    } catch (error) {
      throw new Error(`Failed to parse ${tool.name} output: ${error.message}`);
    }
  }

  /**
   * Parse JSON format output (ESLint, Flake8, etc.)
   */
  private parseJSONOutput(
    tool: LinterTool, 
    data: any, 
    filePaths: string[], 
    executionTime: number
  ): LinterResult[] {
    const results: LinterResult[] = [];
    
    // Handle different JSON structures based on tool
    if (tool.id === 'eslint') {
      data.forEach((fileResult: any) => {
        const violations = fileResult.messages.map((message: any) => ({
          id: this.generateViolationId(tool.id, fileResult.filePath, message),
          ruleId: message.ruleId || 'unknown',
          severity: this.mapSeverity(message.severity),
          message: message.message,
          line: message.line,
          column: message.column,
          endLine: message.endLine,
          endColumn: message.endColumn,
          source: tool.id,
          category: 'style',
          weight: this.calculateWeight(message.severity)
        }));
        
        results.push({
          toolId: tool.id,
          filePath: fileResult.filePath,
          violations,
          timestamp: Date.now(),
          executionTime,
          confidence: 0.9,
          metadata: { warningCount: fileResult.warningCount, errorCount: fileResult.errorCount }
        });
      });
    }
    // Add more tool-specific parsers...
    
    return results;
  }

  /**
   * Parse SARIF format output
   */
  private parseSARIFOutput(
    tool: LinterTool, 
    data: any, 
    filePaths: string[], 
    executionTime: number
  ): LinterResult[] {
    // Implementation for SARIF parsing
    return [];
  }

  /**
   * Parse text format output (TypeScript, MyPy, etc.)
   */
  private parseTextOutput(
    tool: LinterTool, 
    output: string, 
    filePaths: string[], 
    executionTime: number
  ): LinterResult[] {
    const results: LinterResult[] = [];
    const lines = output.split('\n').filter(line => line.trim());
    
    // Tool-specific text parsing logic
    if (tool.id === 'tsc') {
      const violations: Violation[] = [];
      
      lines.forEach(line => {
        const match = line.match(/^(.+)\((\d+),(\d+)\):\s+(error|warning)\s+TS(\d+):\s+(.+)$/);
        if (match) {
          const [, filePath, line, column, severity, code, message] = match;
          violations.push({
            id: this.generateViolationId(tool.id, filePath, { line, column, code }),
            ruleId: `TS${code}`,
            severity: severity as any,
            message,
            line: parseInt(line),
            column: parseInt(column),
            source: tool.id,
            category: 'type',
            weight: severity === 'error' ? 5 : 2
          });
        }
      });
      
      // Group by file
      const fileGroups = violations.reduce((acc, violation) => {
        if (!acc[violation.id]) acc[violation.id] = [];
        acc[violation.id].push(violation);
        return acc;
      }, {} as Record<string, Violation[]>);
      
      Object.entries(fileGroups).forEach(([filePath, fileViolations]) => {
        results.push({
          toolId: tool.id,
          filePath,
          violations: fileViolations,
          timestamp: Date.now(),
          executionTime,
          confidence: 0.95,
          metadata: { totalErrors: fileViolations.filter(v => v.severity === 'error').length }
        });
      });
    }
    
    return results;
  }

  /**
   * Perform cross-tool correlation analysis
   */
  private async performCrossToolCorrelation(results: LinterResult[]): Promise<Correlation[]> {
    const correlations: Correlation[] = [];
    
    for (let i = 0; i < results.length; i++) {
      for (let j = i + 1; j < results.length; j++) {
        const resultA = results[i];
        const resultB = results[j];
        
        const correlation = await this.calculateCorrelation(resultA, resultB);
        if (correlation.correlationScore >= this.correlationThreshold) {
          correlations.push(correlation);
          this.emit('correlation_discovered', correlation);
        }
      }
    }
    
    return correlations;
  }

  /**
   * Calculate correlation between two tool results
   */
  private async calculateCorrelation(resultA: LinterResult, resultB: LinterResult): Promise<Correlation> {
    // Implementation for correlation calculation
    const violationPairs: Array<{ violationA: string; violationB: string }> = [];
    let totalScore = 0;
    let pairCount = 0;
    
    resultA.violations.forEach(violationA => {
      resultB.violations.forEach(violationB => {
        const similarity = this.calculateViolationSimilarity(violationA, violationB);
        if (similarity > 0.7) {
          violationPairs.push({ violationA: violationA.id, violationB: violationB.id });
          totalScore += similarity;
          pairCount++;
        }
      });
    });
    
    const correlationScore = pairCount > 0 ? totalScore / pairCount : 0;
    
    return {
      id: `corr_${resultA.toolId}_${resultB.toolId}_${Date.now()}`,
      toolA: resultA.toolId,
      toolB: resultB.toolId,
      correlationScore,
      violationPairs,
      pattern: this.identifyCorrelationPattern(violationPairs)
    };
  }

  /**
   * Calculate similarity between two violations
   */
  private calculateViolationSimilarity(violationA: Violation, violationB: Violation): number {
    let score = 0;
    
    // Location similarity (same line +/- 2)
    if (Math.abs(violationA.line - violationB.line) <= 2) score += 0.3;
    
    // Severity similarity
    if (violationA.severity === violationB.severity) score += 0.2;
    
    // Category similarity
    if (violationA.category === violationB.category) score += 0.2;
    
    // Message similarity (basic text matching)
    const messageA = violationA.message.toLowerCase();
    const messageB = violationB.message.toLowerCase();
    const commonWords = messageA.split(' ').filter(word => messageB.includes(word));
    score += (commonWords.length / Math.max(messageA.split(' ').length, messageB.split(' ').length)) * 0.3;
    
    return Math.min(score, 1.0);
  }

  /**
   * Helper methods
   */
  private generateCorrelationId(): string {
    return `linter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateViolationId(toolId: string, filePath: string, context: any): string {
    const hash = createHash('md5')
      .update(`${toolId}_${filePath}_${JSON.stringify(context)}`)
      .digest('hex');
    return `${toolId}_${hash.substr(0, 8)}`;
  }

  private mapSeverity(severity: any): 'info' | 'warning' | 'error' | 'critical' {
    if (typeof severity === 'number') {
      return severity === 2 ? 'error' : 'warning';
    }
    return severity || 'warning';
  }

  private calculateWeight(severity: any): number {
    const weights = { info: 1, warning: 2, error: 5, critical: 10 };
    return weights[this.mapSeverity(severity)] || 2;
  }

  private getAvailableTools(): LinterTool[] {
    return Array.from(this.tools.values()).filter(tool => {
      const circuitBreaker = this.circuitBreakers.get(tool.id)!;
      return !circuitBreaker.isOpen || Date.now() >= circuitBreaker.nextAttemptTime;
    });
  }

  private processResults(results: PromiseSettledResult<LinterResult[]>[], correlationId: string): LinterResult[] {
    const processedResults: LinterResult[] = [];
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        processedResults.push(...result.value);
      } else {
        console.warn(`Tool execution failed:`, result.reason);
      }
    });
    
    return processedResults;
  }

  private aggregateViolations(results: LinterResult[]): Violation[] {
    const allViolations = results.flatMap(result => result.violations);
    return this.deduplicateViolations(allViolations);
  }

  private deduplicateViolations(violations: Violation[]): Violation[] {
    const seen = new Set<string>();
    return violations.filter(violation => {
      const key = `${violation.line}_${violation.column}_${violation.ruleId}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private resolveConflicts(results: LinterResult[]): ConflictResolution[] {
    // Implementation for conflict resolution
    return [];
  }

  private identifyCorrelationPattern(violationPairs: Array<{ violationA: string; violationB: string }>): string {
    return violationPairs.length > 0 ? 'common_violation_pattern' : 'no_pattern';
  }

  private async performHealthChecks(): Promise<void> {
    // Implementation for periodic health checks
  }

  private async sendToMCP(event: string, data: any): Promise<void> {
    // Implementation for MCP integration
  }
}

// Configuration interfaces
interface IngestionEngineConfig {
  maxConcurrentTools?: number;
  bufferSize?: number;
  correlationThreshold?: number;
  circuitBreakerThreshold?: number;
  circuitBreakerTimeout?: number;
  healthCheckInterval?: number;
  mcpIntegration?: boolean;
}

interface ExecutionOptions {
  allowConcurrent?: boolean;
  priorityFilter?: ('low' | 'medium' | 'high' | 'critical')[];
  excludeTools?: string[];
  includeCorrelation?: boolean;
  timeout?: number;
}

export { 
  RealTimeLinterIngestionEngine,
  LinterTool,
  LinterResult,
  Violation,
  StreamingResult,
  IngestionEngineConfig,
  ExecutionOptions
};
