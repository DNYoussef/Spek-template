/**
 * PrincessCommandHandler - Shared Command Processing for Princess FSMs
 * NASA Rule 10 Compliant: Centralized command validation and execution
 * Eliminates duplicate command handling across Princess implementations
 */

import { FSMContext, PrincessEvent, PrincessState } from '../../types/FSMTypes';
import { PrincessLogger } from './PrincessLogger';
import { PrincessStateValidator } from './PrincessStateValidator';

export interface PrincessCommand {
  type: string;
  payload?: any;
  metadata?: {
    priority?: 'low' | 'medium' | 'high' | 'critical';
    timeout?: number;
    retries?: number;
  };
}

export interface CommandResult {
  success: boolean;
  data?: any;
  error?: string;
  duration: number;
  nextState?: any;
}

export class PrincessCommandHandler {
  constructor(
    private logger: PrincessLogger,
    private validator: PrincessStateValidator
  ) {}

  /**
   * Execute command with validation and error handling
   */
  async executeCommand(
    command: PrincessCommand,
    context: FSMContext,
    executor: (cmd: PrincessCommand, ctx: FSMContext) => Promise<any>
  ): Promise<CommandResult> {
    const startTime = Date.now();

    try {
      // Validate command
      const validation = this.validateCommand(command, context);
      if (!validation.valid) {
        throw new Error(`Command validation failed: ${validation.errors.join(', ')}`);
      }

      // Log command execution start
      this.logger.log(`Executing command: ${command.type}`, {
        priority: command.metadata?.priority || 'medium'
      });

      // Execute command with timeout
      const result = await this.executeWithTimeout(
        executor,
        command,
        context,
        command.metadata?.timeout || 30000
      );

      const duration = Date.now() - startTime;

      // Log successful execution
      this.logger.performance(command.type, duration, { success: true });

      return {
        success: true,
        data: result,
        duration
      };

    } catch (error) {
      const duration = Date.now() - startTime;

      // Log failed execution
      this.logger.error(`Command failed: ${command.type}`, {
        error: error instanceof Error ? error.message : error,
        duration
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        duration
      };
    }
  }

  /**
   * Execute command with timeout protection
   */
  private async executeWithTimeout(
    executor: (cmd: PrincessCommand, ctx: FSMContext) => Promise<any>,
    command: PrincessCommand,
    context: FSMContext,
    timeout: number
  ): Promise<any> {
    return Promise.race([
      executor(command, context),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`Command timeout: ${command.type}`)), timeout)
      )
    ]);
  }

  /**
   * Validate command before execution
   */
  private validateCommand(command: PrincessCommand, context: FSMContext): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Check command structure
    if (!command.type) {
      errors.push('Command type is required');
    }

    if (typeof command.type !== 'string') {
      errors.push('Command type must be string');
    }

    // Check context health
    if (!this.validator.isHealthy(context)) {
      errors.push('Context is not in healthy state');
    }

    // Check if command is allowed in current state
    if (!this.isCommandAllowedInState(command.type, context.currentState)) {
      errors.push(`Command ${command.type} not allowed in state ${context.currentState}`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Check if command is allowed in current state
   */
  private isCommandAllowedInState(commandType: string, currentState: any): boolean {
    // Prevent commands in terminal states
    if (currentState === PrincessState.COMPLETE || currentState === PrincessState.FAILED) {
      return commandType === 'ROLLBACK' || commandType === 'RESET';
    }

    // Allow all other commands in non-terminal states
    return true;
  }

  /**
   * Batch execute multiple commands
   */
  async executeBatch(
    commands: PrincessCommand[],
    context: FSMContext,
    executor: (cmd: PrincessCommand, ctx: FSMContext) => Promise<any>
  ): Promise<CommandResult[]> {
    this.logger.log(`Executing batch of ${commands.length} commands`);

    const results: CommandResult[] = [];

    for (const command of commands) {
      const result = await this.executeCommand(command, context, executor);
      results.push(result);

      // Stop on first failure unless command is marked as non-critical
      if (!result.success && command.metadata?.priority !== 'low') {
        this.logger.error('Batch execution stopped due to command failure', {
          failedCommand: command.type,
          completedCommands: results.length
        });
        break;
      }
    }

    return results;
  }

  /**
   * Execute commands in parallel
   */
  async executeParallel(
    commands: PrincessCommand[],
    context: FSMContext,
    executor: (cmd: PrincessCommand, ctx: FSMContext) => Promise<any>
  ): Promise<CommandResult[]> {
    this.logger.log(`Executing ${commands.length} commands in parallel`);

    const promises = commands.map(command =>
      this.executeCommand(command, context, executor)
    );

    return Promise.all(promises);
  }

  /**
   * Retry failed command with exponential backoff
   */
  async retryCommand(
    command: PrincessCommand,
    context: FSMContext,
    executor: (cmd: PrincessCommand, ctx: FSMContext) => Promise<any>,
    maxRetries: number = 3
  ): Promise<CommandResult> {
    let lastResult: CommandResult;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      this.logger.log(`Command retry attempt ${attempt}/${maxRetries}: ${command.type}`);

      lastResult = await this.executeCommand(command, context, executor);

      if (lastResult.success) {
        this.logger.log(`Command succeeded on attempt ${attempt}: ${command.type}`);
        return lastResult;
      }

      // Wait before retry (exponential backoff)
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s, ...
        await this.delay(delay);
      }
    }

    this.logger.error(`Command failed after ${maxRetries} attempts: ${command.type}`);
    return lastResult!;
  }

  /**
   * Create command with metadata
   */
  createCommand(
    type: string,
    payload?: any,
    options?: {
      priority?: 'low' | 'medium' | 'high' | 'critical';
      timeout?: number;
      retries?: number;
    }
  ): PrincessCommand {
    return {
      type,
      payload,
      metadata: options
    };
  }

  /**
   * Delay utility for retries
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get command execution metrics
   */
  getMetrics(): {
    commandsExecuted: number;
    successRate: number;
    averageDuration: number;
  } {
    // This would be implemented with actual metrics collection
    // For now, return placeholder values
    return {
      commandsExecuted: 0,
      successRate: 1.0,
      averageDuration: 0
    };
  }
}