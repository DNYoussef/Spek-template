/**
 * BaseValidator.ts - Base class for category validators
 * 
 * Provides common validation logic and utilities for all category validators,
 * ensuring consistent check execution and evidence collection.
 */

import { execSync } from 'child_process';
import {
  ReadinessCheck,
  CheckConfig,
  Evidence,
  ValidationOptions,
  ReadinessValidationError
} from '../types/ReadinessTypes';

/**
 * Base validator class providing common validation functionality
 * All category validators extend this class
 */
export abstract class BaseValidator {
  protected projectRoot: string;
  protected timeout: number = 60000; // 60 seconds default

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }

  /**
   * Run a validation check with command execution
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  protected async runCheck(
    config: CheckConfig,
    options: ValidationOptions
  ): Promise<ReadinessCheck> {
    console.assert(config !== undefined, 'Check config must be provided');
    console.assert(config.checkId && config.checkId.length > 0, 'CheckId must be provided');
    console.assert(config.command && config.command.length > 0, 'Command must be provided');
    
    const check: ReadinessCheck = {
      checkId: config.checkId,
      name: config.name,
      description: config.description,
      category: config.category,
      status: 'skipped',
      score: 0,
      required: config.required,
      evidence: [],
      lastRun: Date.now(),
      recommendations: []
    };

    // Skip check if category is excluded
    if (options.skipCategories?.includes(config.category)) {
      check.status = 'skipped';
      check.score = 100; // Don't penalize skipped categories
      return check;
    }

    try {
      const output = await this.executeCommand(config.command, config.timeout);
      
      check.status = 'passed';
      check.score = 100;
      
      if (options.generateEvidence !== false) {
        check.evidence.push({
          type: 'command_output',
          source: config.command,
          content: output,
          timestamp: Date.now(),
          valid: true
        });
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      check.status = 'failed';
      check.score = 0;
      
      if (options.generateEvidence !== false) {
        check.evidence.push({
          type: 'command_output',
          source: config.command,
          content: errorMessage,
          timestamp: Date.now(),
          valid: false
        });
      }

      this.addRecommendations(check, config, error.message);
    }

    console.assert(check.status !== 'skipped' || options.skipCategories?.includes(config.category), 
                   'Check should only be skipped if category is excluded');
    
    return check;
  }

  /**
   * Execute command with timeout and error handling
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  private async executeCommand(command: string, timeout?: number): Promise<string> {
    console.assert(command && command.length > 0, 'Command must be provided');
    console.assert(this.projectRoot && this.projectRoot.length > 0, 'Project root must be set');
    
    const commandTimeout = timeout || this.timeout;
    
    try {
      const output = execSync(command, {
        cwd: this.projectRoot,
        encoding: 'utf-8',
        timeout: commandTimeout,
        stdio: ['ignore', 'pipe', 'pipe']
      });
      
      return output.toString().trim();
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      // Re-throw with more context
      throw new ReadinessValidationError(
        `Command failed: ${command}\nError: ${errorMessage}`,
        undefined,
        undefined,
        'major'
      );
    }
  }

  /**
   * Add recommendations based on check failure
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  private addRecommendations(
    check: ReadinessCheck, 
    config: CheckConfig, 
    errorMessage: string
  ): void {
    console.assert(check !== undefined, 'Check must be provided');
    console.assert(config !== undefined, 'Config must be provided');
    
    if (config.required) {
      check.recommendations.push(`CRITICAL: Fix required check '${config.name}'`);
    } else {
      check.recommendations.push(`Consider fixing: '${config.name}'`);
    }
    
    // Add specific recommendations based on error patterns
    if (errorMessage.includes('command not found')) {
      check.recommendations.push('Install required tooling or dependencies');
    } else if (errorMessage.includes('timeout')) {
      check.recommendations.push('Optimize check or increase timeout');
    } else if (errorMessage.includes('permission denied')) {
      check.recommendations.push('Check file permissions and access rights');
    }
  }

  /**
   * Create manual check (for checks that require human verification)
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  protected createManualCheck(
    config: CheckConfig,
    defaultScore: number = 100
  ): ReadinessCheck {
    console.assert(config !== undefined, 'Check config must be provided');
    console.assert(defaultScore >= 0 && defaultScore <= 100, 'Score must be between 0-100');
    
    return {
      checkId: config.checkId,
      name: config.name,
      description: config.description,
      category: config.category,
      status: 'skipped', // Manual checks start as skipped
      score: defaultScore,
      required: config.required,
      evidence: [],
      lastRun: Date.now(),
      recommendations: [`Manual verification required: ${config.description}`]
    };
  }

  /**
   * Add file evidence to check
   * NASA Rule 10: ≤60 lines, 2+ assertions
   */
  protected addFileEvidence(
    check: ReadinessCheck,
    filePath: string,
    description: string
  ): void {
    console.assert(check !== undefined, 'Check must be provided');
    console.assert(filePath && filePath.length > 0, 'File path must be provided');
    
    const fs = require('fs');
    const path = require('path');
    
    const fullPath = path.resolve(this.projectRoot, filePath);
    
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      
      check.evidence.push({
        type: 'file',
        source: filePath,
        content: content.length > 1000 ? content.substring(0, 1000) + '...' : content,
        timestamp: Date.now(),
        valid: true
      });
    } else {
      check.evidence.push({
        type: 'file',
        source: filePath,
        content: `File not found: ${fullPath}`,
        timestamp: Date.now(),
        valid: false
      });
    }
  }

  /**
   * Set timeout for command execution
   * NASA Rule 10: Simple setter with assertion
   */
  setTimeout(timeout: number): void {
    console.assert(timeout > 0, 'Timeout must be positive');
    this.timeout = timeout;
  }
}

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0

// Receipt
// status: OK
// reason_if_blocked: --
// run_id: readiness-base-006
// inputs: ["InitializingState.ts"]
// tools_used: ["MultiEdit"]
// tools_used: ["MultiEdit"]
// versions: {"model":"claude-sonnet-4","prompt":"fsm-refactor-v2"}
// === END FOOTER ===