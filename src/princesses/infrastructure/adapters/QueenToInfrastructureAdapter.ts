import { EventEmitter } from 'events';
import { LangroidMemoryBackend, MemoryPriority } from '../memory/LangroidMemoryBackend';
import { InfrastructureTaskManager, InfrastructureTask, TaskStatus } from '../../../api/infrastructure/InfrastructureTaskManager';

/**
 * Queen-to-Infrastructure Adapter
 * Translates Queen commands into Infrastructure Princess operations,
 * managing command validation, transformation, and execution coordination.
 */
export interface QueenCommand {
  id: string;
  type: 'infrastructure' | 'deployment' | 'monitoring' | 'scaling' | 'maintenance';
  subType?: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  payload: any;
  metadata?: Record<string, any>;
  requiresConfirmation?: boolean;
  timeout?: number;
  retryPolicy?: RetryPolicy;
}

export interface RetryPolicy {
  maxRetries: number;
  retryDelay: number;
  backoffMultiplier: number;
  maxRetryDelay: number;
}

export interface CommandTranslationResult {
  originalCommand: QueenCommand;
  translatedTasks: InfrastructureTask[];
  estimatedExecutionTime: number;
  resourceRequirements: ResourceRequirements;
  dependencies: string[];
  warnings: string[];
}

export interface ResourceRequirements {
  memory: number;
  cpu: number;
  disk: number;
  network: number;
  estimatedDuration: number;
}

export interface CommandExecutionStatus {
  commandId: string;
  status: 'pending' | 'validating' | 'translating' | 'executing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  startTime: number;
  tasks: TaskExecutionStatus[];
  result?: any;
  error?: string;
  warnings: string[];
}

export interface TaskExecutionStatus {
  taskId: string;
  status: TaskStatus;
  progress: number;
  startTime?: number;
  endTime?: number;
  result?: any;
  error?: string;
}

export class QueenToInfrastructureAdapter extends EventEmitter {
  private static readonly DEFAULT_TIMEOUT = 5 * 60 * 1000; // 5 minutes
  private static readonly DEFAULT_RETRY_POLICY: RetryPolicy = {
    maxRetries: 3,
    retryDelay: 1000,
    backoffMultiplier: 2,
    maxRetryDelay: 30000
  };

  private memoryBackend: LangroidMemoryBackend;
  private taskManager: InfrastructureTaskManager;

  private activeCommands: Map<string, CommandExecutionStatus> = new Map();
  private commandTranslators: Map<string, CommandTranslator> = new Map();
  private validationRules: Map<string, ValidationRule[]> = new Map();

  constructor(
    memoryBackend: LangroidMemoryBackend,
    taskManager: InfrastructureTaskManager
  ) {
    super();

    this.memoryBackend = memoryBackend;
    this.taskManager = taskManager;

    this.initializeTranslators();
    this.initializeValidationRules();
    this.setupEventListeners();
  }

  /**
   * Process Queen command and translate to infrastructure operations
   */
  public async processCommand(command: QueenCommand): Promise<CommandExecutionStatus> {
    try {
      // Generate execution status
      const executionStatus: CommandExecutionStatus = {
        commandId: command.id,
        status: 'pending',
        progress: 0,
        startTime: Date.now(),
        tasks: [],
        warnings: []
      };

      // Store in active commands
      this.activeCommands.set(command.id, executionStatus);

      // Store command in memory for tracking
      await this.memoryBackend.store(command.id, command, {
        priority: this.convertPriority(command.priority),
        tags: ['queen-command', command.type, command.subType || ''].filter(Boolean),
        ttl: command.timeout || QueenToInfrastructureAdapter.DEFAULT_TIMEOUT,
        metadata: {
          submittedAt: Date.now(),
          requiresConfirmation: command.requiresConfirmation || false,
          ...command.metadata
        }
      });

      // Start async processing
      this.processCommandAsync(command, executionStatus);

      this.emit('command-received', { command, executionStatus });

      return executionStatus;

    } catch (error) {
      this.emit('command-processing-error', { command, error });
      throw error;
    }
  }

  /**
   * Get command execution status
   */
  public getCommandStatus(commandId: string): CommandExecutionStatus | null {
    return this.activeCommands.get(commandId) || null;
  }

  /**
   * Cancel command execution
   */
  public async cancelCommand(commandId: string, reason?: string): Promise<boolean> {
    try {
      const executionStatus = this.activeCommands.get(commandId);
      if (!executionStatus) return false;

      if (executionStatus.status === 'completed' || executionStatus.status === 'failed') {
        return false; // Cannot cancel completed commands
      }

      // Cancel all associated tasks
      for (const taskStatus of executionStatus.tasks) {
        if (taskStatus.status === TaskStatus.RUNNING || taskStatus.status === TaskStatus.QUEUED) {
          await this.taskManager.cancelTask(taskStatus.taskId);
        }
      }

      // Update status
      executionStatus.status = 'cancelled';
      executionStatus.error = reason || 'Cancelled by user';

      this.emit('command-cancelled', { commandId, reason });

      return true;

    } catch (error) {
      this.emit('error', { operation: 'cancelCommand', commandId, error });
      return false;
    }
  }

  /**
   * List active commands
   */
  public getActiveCommands(): CommandExecutionStatus[] {
    return Array.from(this.activeCommands.values()).filter(
      status => status.status !== 'completed' && status.status !== 'failed' && status.status !== 'cancelled'
    );
  }

  /**
   * Get command history
   */
  public async getCommandHistory(limit: number = 100): Promise<CommandExecutionStatus[]> {
    try {
      const commands = await this.memoryBackend.query({
        tags: ['queen-command'],
        limit
      });

      return commands.map(entry => {
        const status = this.activeCommands.get(entry.id);
        return status || {
          commandId: entry.id,
          status: 'completed' as const,
          progress: 100,
          startTime: entry.timestamp,
          tasks: [],
          warnings: []
        };
      });

    } catch (error) {
      this.emit('error', { operation: 'getCommandHistory', error });
      return [];
    }
  }

  /**
   * Register custom command translator
   */
  public registerTranslator(commandType: string, translator: CommandTranslator): void {
    this.commandTranslators.set(commandType, translator);
    this.emit('translator-registered', { commandType });
  }

  /**
   * Register validation rules for command type
   */
  public registerValidationRules(commandType: string, rules: ValidationRule[]): void {
    this.validationRules.set(commandType, rules);
    this.emit('validation-rules-registered', { commandType, ruleCount: rules.length });
  }

  /**
   * Shutdown adapter
   */
  public async shutdown(): Promise<void> {
    try {
      // Cancel all active commands
      for (const commandId of this.activeCommands.keys()) {
        await this.cancelCommand(commandId, 'System shutdown');
      }

      this.removeAllListeners();
      this.emit('shutdown');

    } catch (error) {
      this.emit('error', { operation: 'shutdown', error });
    }
  }

  // Private methods

  private async processCommandAsync(command: QueenCommand, executionStatus: CommandExecutionStatus): Promise<void> {
    try {
      // Validation phase
      executionStatus.status = 'validating';
      executionStatus.progress = 10;
      this.emit('command-status-changed', executionStatus);

      const validationResult = await this.validateCommand(command);
      if (!validationResult.isValid) {
        executionStatus.status = 'failed';
        executionStatus.error = `Validation failed: ${validationResult.errors.join(', ')}`;
        this.emit('command-failed', executionStatus);
        return;
      }

      if (validationResult.warnings.length > 0) {
        executionStatus.warnings.push(...validationResult.warnings);
      }

      // Translation phase
      executionStatus.status = 'translating';
      executionStatus.progress = 30;
      this.emit('command-status-changed', executionStatus);

      const translationResult = await this.translateCommand(command);
      if (translationResult.warnings.length > 0) {
        executionStatus.warnings.push(...translationResult.warnings);
      }

      // Confirmation check
      if (command.requiresConfirmation && !await this.getConfirmation(command, translationResult)) {
        executionStatus.status = 'cancelled';
        executionStatus.error = 'User confirmation not received';
        this.emit('command-cancelled', executionStatus);
        return;
      }

      // Execution phase
      executionStatus.status = 'executing';
      executionStatus.progress = 50;
      this.emit('command-status-changed', executionStatus);

      await this.executeTranslatedTasks(translationResult, executionStatus);

    } catch (error) {
      executionStatus.status = 'failed';
      executionStatus.error = error instanceof Error ? error.message : String(error);
      this.emit('command-failed', executionStatus);
    }
  }

  private async validateCommand(command: QueenCommand): Promise<ValidationResult> {
    try {
      const result: ValidationResult = {
        isValid: true,
        errors: [],
        warnings: []
      };

      // Basic validation
      if (!command.id || !command.type || !command.payload) {
        result.isValid = false;
        result.errors.push('Command must have id, type, and payload');
      }

      // Check if translator exists
      if (!this.commandTranslators.has(command.type)) {
        result.isValid = false;
        result.errors.push(`No translator available for command type: ${command.type}`);
      }

      // Apply custom validation rules
      const rules = this.validationRules.get(command.type) || [];
      for (const rule of rules) {
        const ruleResult = await rule.validate(command);
        if (!ruleResult.isValid) {
          result.isValid = false;
          result.errors.push(...ruleResult.errors);
        }
        result.warnings.push(...ruleResult.warnings);
      }

      return result;

    } catch (error) {
      return {
        isValid: false,
        errors: [`Validation error: ${error}`],
        warnings: []
      };
    }
  }

  private async translateCommand(command: QueenCommand): Promise<CommandTranslationResult> {
    const translator = this.commandTranslators.get(command.type);
    if (!translator) {
      throw new Error(`No translator found for command type: ${command.type}`);
    }

    return await translator.translate(command);
  }

  private async getConfirmation(command: QueenCommand, translationResult: CommandTranslationResult): Promise<boolean> {
    // In a real implementation, this would interact with the Queen
    // to get user confirmation for the planned operations
    return new Promise((resolve) => {
      this.emit('confirmation-required', {
        command,
        translationResult,
        respond: (confirmed: boolean) => resolve(confirmed)
      });

      // Auto-approve after 30 seconds if no response
      setTimeout(() => resolve(true), 30000);
    });
  }

  private async executeTranslatedTasks(
    translationResult: CommandTranslationResult,
    executionStatus: CommandExecutionStatus
  ): Promise<void> {
    try {
      const tasks = translationResult.translatedTasks;
      const totalTasks = tasks.length;

      // Submit all tasks
      for (let i = 0; i < tasks.length; i++) {
        const task = tasks[i];
        const submittedTask = await this.taskManager.submitTask(task);

        const taskStatus: TaskExecutionStatus = {
          taskId: submittedTask.id,
          status: submittedTask.status,
          progress: submittedTask.progress,
          startTime: submittedTask.startTime,
          endTime: submittedTask.endTime,
          result: submittedTask.result,
          error: submittedTask.error
        };

        executionStatus.tasks.push(taskStatus);
      }

      // Monitor task execution
      await this.monitorTaskExecution(executionStatus, totalTasks);

    } catch (error) {
      throw new Error(`Task execution failed: ${error}`);
    }
  }

  private async monitorTaskExecution(
    executionStatus: CommandExecutionStatus,
    totalTasks: number
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(async () => {
        try {
          let completedTasks = 0;
          let failedTasks = 0;
          let totalProgress = 0;

          // Update task statuses
          for (const taskStatus of executionStatus.tasks) {
            const currentTask = await this.taskManager.getTaskStatus(taskStatus.taskId);
            if (currentTask) {
              taskStatus.status = currentTask.status;
              taskStatus.progress = currentTask.progress;
              taskStatus.startTime = currentTask.startTime;
              taskStatus.endTime = currentTask.endTime;
              taskStatus.result = currentTask.result;
              taskStatus.error = currentTask.error;

              totalProgress += currentTask.progress;

              if (currentTask.status === TaskStatus.COMPLETED) {
                completedTasks++;
              } else if (currentTask.status === TaskStatus.FAILED) {
                failedTasks++;
              }
            }
          }

          // Update overall progress
          executionStatus.progress = 50 + (totalProgress / totalTasks) * 0.5;

          // Check completion
          if (completedTasks + failedTasks === totalTasks) {
            clearInterval(checkInterval);

            if (failedTasks > 0) {
              executionStatus.status = 'failed';
              executionStatus.error = `${failedTasks} out of ${totalTasks} tasks failed`;
              this.emit('command-failed', executionStatus);
              reject(new Error(executionStatus.error));
            } else {
              executionStatus.status = 'completed';
              executionStatus.progress = 100;
              executionStatus.result = {
                completedTasks,
                totalExecutionTime: Date.now() - executionStatus.startTime,
                taskResults: executionStatus.tasks.map(t => t.result)
              };
              this.emit('command-completed', executionStatus);
              resolve();
            }
          } else {
            this.emit('command-status-changed', executionStatus);
          }

        } catch (error) {
          clearInterval(checkInterval);
          reject(error);
        }
      }, 1000); // Check every second
    });
  }

  private convertPriority(priority: string): MemoryPriority {
    switch (priority.toLowerCase()) {
      case 'critical': return MemoryPriority.CRITICAL;
      case 'high': return MemoryPriority.HIGH;
      case 'medium': return MemoryPriority.MEDIUM;
      case 'low': return MemoryPriority.LOW;
      default: return MemoryPriority.MEDIUM;
    }
  }

  private initializeTranslators(): void {
    // Register default translators
    this.registerTranslator('infrastructure', new InfrastructureCommandTranslator());
    this.registerTranslator('deployment', new DeploymentCommandTranslator());
    this.registerTranslator('monitoring', new MonitoringCommandTranslator());
    this.registerTranslator('scaling', new ScalingCommandTranslator());
    this.registerTranslator('maintenance', new MaintenanceCommandTranslator());
  }

  private initializeValidationRules(): void {
    // Register default validation rules
    this.registerValidationRules('deployment', [
      new DeploymentValidationRule(),
      new ResourceAvailabilityRule()
    ]);

    this.registerValidationRules('scaling', [
      new ScalingValidationRule(),
      new ResourceAvailabilityRule()
    ]);
  }

  private setupEventListeners(): void {
    // Listen to task manager events
    this.taskManager.on('task-completed', (task) => {
      this.emit('task-update', { taskId: task.id, status: 'completed' });
    });

    this.taskManager.on('task-failed', (task) => {
      this.emit('task-update', { taskId: task.id, status: 'failed', error: task.error });
    });
  }
}

// Supporting interfaces and classes

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ValidationRule {
  validate(command: QueenCommand): Promise<ValidationResult>;
}

export interface CommandTranslator {
  translate(command: QueenCommand): Promise<CommandTranslationResult>;
}

// Default translator implementations

class InfrastructureCommandTranslator implements CommandTranslator {
  async translate(command: QueenCommand): Promise<CommandTranslationResult> {
    const task: InfrastructureTask = {
      id: `${command.id}-inf`,
      type: 'maintenance',
      priority: this.convertPriority(command.priority),
      payload: command.payload,
      metadata: command.metadata || {},
      tags: ['infrastructure', command.subType || ''].filter(Boolean),
      submittedAt: Date.now(),
      status: TaskStatus.PENDING,
      progress: 0,
      retryCount: 0,
      maxRetries: command.retryPolicy?.maxRetries || 3
    };

    return {
      originalCommand: command,
      translatedTasks: [task],
      estimatedExecutionTime: 60000, // 1 minute
      resourceRequirements: {
        memory: 10,
        cpu: 15,
        disk: 5,
        network: 5,
        estimatedDuration: 60000
      },
      dependencies: [],
      warnings: []
    };
  }

  private convertPriority(priority: string): MemoryPriority {
    switch (priority.toLowerCase()) {
      case 'critical': return MemoryPriority.CRITICAL;
      case 'high': return MemoryPriority.HIGH;
      case 'medium': return MemoryPriority.MEDIUM;
      case 'low': return MemoryPriority.LOW;
      default: return MemoryPriority.MEDIUM;
    }
  }
}

// Additional translator implementations would follow similar patterns
class DeploymentCommandTranslator extends InfrastructureCommandTranslator {}
class MonitoringCommandTranslator extends InfrastructureCommandTranslator {}
class ScalingCommandTranslator extends InfrastructureCommandTranslator {}
class MaintenanceCommandTranslator extends InfrastructureCommandTranslator {}

// Default validation rule implementations
class DeploymentValidationRule implements ValidationRule {
  async validate(command: QueenCommand): Promise<ValidationResult> {
    return {
      isValid: true,
      errors: [],
      warnings: []
    };
  }
}

class ScalingValidationRule implements ValidationRule {
  async validate(command: QueenCommand): Promise<ValidationResult> {
    return {
      isValid: true,
      errors: [],
      warnings: []
    };
  }
}

class ResourceAvailabilityRule implements ValidationRule {
  async validate(command: QueenCommand): Promise<ValidationResult> {
    return {
      isValid: true,
      errors: [],
      warnings: []
    };
  }
}

export default QueenToInfrastructureAdapter;