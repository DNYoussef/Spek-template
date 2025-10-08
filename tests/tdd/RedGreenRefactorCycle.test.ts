/**
 * Red-Green-Refactor Cycle Example - London School TDD
 *
 * This file demonstrates the complete TDD cycle:
 * 1. RED: Write a failing test that specifies desired behavior
 * 2. GREEN: Write minimal code to make the test pass
 * 3. REFACTOR: Improve the code while keeping tests green
 *
 * Following London School TDD principles:
 * - Mock external dependencies
 * - Test behavior and interactions
 * - Focus on outside-in development
 */

import { jest } from '@jest/globals';

// Mock external dependencies first (London School)
jest.mock('../external/NotificationService');
jest.mock('../external/AuditLogger');

import { NotificationService } from '../external/NotificationService';
import { AuditLogger } from '../external/AuditLogger';

// ==============================================================================
// STEP 1: RED - Write failing tests first
// ==============================================================================

describe('TDD Cycle: Task Management System', () => {
  let mockNotificationService: jest.Mocked<NotificationService>;
  let mockAuditLogger: jest.Mocked<AuditLogger>;

  beforeEach(() => {
    mockNotificationService = new NotificationService() as jest.Mocked<NotificationService>;
    mockAuditLogger = new AuditLogger() as jest.Mocked<AuditLogger>;

    mockNotificationService.sendNotification.mockResolvedValue(true);
    mockAuditLogger.logAction.mockResolvedValue(true);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // RED PHASE: These tests will initially FAIL
  describe('RED PHASE: Task Creation (Tests First)', () => {
    it('should create task with auto-generated ID and timestamp', async () => {
      // RED: This will fail because TaskManager doesn't exist yet
      const taskManager = new TaskManager(mockNotificationService, mockAuditLogger);

      const taskData = {
        title: 'Implement user authentication',
        description: 'Add JWT-based authentication system',
        priority: 'high' as const,
        assigneeId: 'user_123'
      };

      const result = await taskManager.createTask(taskData);

      // Specify exact behavior expected
      expect(result.id).toMatch(/^task_\d+_[a-z0-9]{8}$/);
      expect(result.title).toBe('Implement user authentication');
      expect(result.description).toBe('Add JWT-based authentication system');
      expect(result.priority).toBe('high');
      expect(result.assigneeId).toBe('user_123');
      expect(result.status).toBe('todo');
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.createdAt.getTime()).toBeCloseTo(Date.now(), -2);
    });

    it('should send notification to assignee when task is created', async () => {
      const taskManager = new TaskManager(mockNotificationService, mockAuditLogger);

      const taskData = {
        title: 'Code review task',
        description: 'Review authentication PR',
        priority: 'medium' as const,
        assigneeId: 'reviewer_456'
      };

      const result = await taskManager.createTask(taskData);

      // Verify notification interaction
      expect(mockNotificationService.sendNotification).toHaveBeenCalledTimes(1);
      expect(mockNotificationService.sendNotification).toHaveBeenCalledWith({
        recipientId: 'reviewer_456',
        type: 'task_assigned',
        title: 'New Task Assigned',
        message: 'You have been assigned a new task: Code review task',
        metadata: {
          taskId: result.id,
          priority: 'medium'
        }
      });
    });

    it('should log task creation for audit trail', async () => {
      const taskManager = new TaskManager(mockNotificationService, mockAuditLogger);

      const taskData = {
        title: 'Security audit',
        description: 'Perform security vulnerability assessment',
        priority: 'high' as const,
        assigneeId: 'security_789'
      };

      const result = await taskManager.createTask(taskData);

      // Verify audit logging interaction
      expect(mockAuditLogger.logAction).toHaveBeenCalledTimes(1);
      expect(mockAuditLogger.logAction).toHaveBeenCalledWith({
        action: 'task_created',
        entityId: result.id,
        entityType: 'task',
        actorId: 'system',
        timestamp: expect.any(Date),
        details: {
          title: 'Security audit',
          assigneeId: 'security_789',
          priority: 'high'
        }
      });
    });

    it('should validate required fields before creation', async () => {
      const taskManager = new TaskManager(mockNotificationService, mockAuditLogger);

      // Test missing title
      await expect(taskManager.createTask({
        title: '',
        description: 'Some description',
        priority: 'low',
        assigneeId: 'user_123'
      })).rejects.toThrow('Task title is required');

      // Test missing assignee
      await expect(taskManager.createTask({
        title: 'Valid title',
        description: 'Some description',
        priority: 'low',
        assigneeId: ''
      })).rejects.toThrow('Assignee ID is required');

      // Test invalid priority
      await expect(taskManager.createTask({
        title: 'Valid title',
        description: 'Some description',
        priority: 'invalid' as any,
        assigneeId: 'user_123'
      })).rejects.toThrow('Priority must be low, medium, or high');

      // Verify no side effects on validation failure
      expect(mockNotificationService.sendNotification).not.toHaveBeenCalled();
      expect(mockAuditLogger.logAction).not.toHaveBeenCalled();
    });
  });

  // ==============================================================================
  // STEP 2: GREEN - Implement minimal code to make tests pass
  // ==============================================================================

  describe('GREEN PHASE: Task Status Updates', () => {
    it('should update task status and send notifications', async () => {
      const taskManager = new TaskManager(mockNotificationService, mockAuditLogger);

      // Create initial task
      const task = await taskManager.createTask({
        title: 'Test task',
        description: 'Task for testing',
        priority: 'medium',
        assigneeId: 'user_123'
      });

      jest.clearAllMocks(); // Clear creation mocks

      // Update task status
      const updatedTask = await taskManager.updateTaskStatus(task.id, 'in_progress');

      expect(updatedTask.id).toBe(task.id);
      expect(updatedTask.status).toBe('in_progress');
      expect(updatedTask.updatedAt).toBeInstanceOf(Date);
      expect(updatedTask.updatedAt.getTime()).toBeGreaterThan(task.createdAt.getTime());

      // Verify status change notification
      expect(mockNotificationService.sendNotification).toHaveBeenCalledWith({
        recipientId: 'user_123',
        type: 'task_status_changed',
        title: 'Task Status Updated',
        message: 'Task status changed from todo to in_progress',
        metadata: {
          taskId: task.id,
          oldStatus: 'todo',
          newStatus: 'in_progress'
        }
      });

      // Verify audit log
      expect(mockAuditLogger.logAction).toHaveBeenCalledWith({
        action: 'task_status_updated',
        entityId: task.id,
        entityType: 'task',
        actorId: 'system',
        timestamp: expect.any(Date),
        details: {
          oldStatus: 'todo',
          newStatus: 'in_progress'
        }
      });
    });

    it('should handle task completion with completion timestamp', async () => {
      const taskManager = new TaskManager(mockNotificationService, mockAuditLogger);

      const task = await taskManager.createTask({
        title: 'Completable task',
        description: 'Task that will be completed',
        priority: 'low',
        assigneeId: 'worker_456'
      });

      jest.clearAllMocks();

      const completedTask = await taskManager.updateTaskStatus(task.id, 'done');

      expect(completedTask.status).toBe('done');
      expect(completedTask.completedAt).toBeInstanceOf(Date);
      expect(completedTask.completedAt!.getTime()).toBeCloseTo(Date.now(), -2);

      // Verify completion notification
      expect(mockNotificationService.sendNotification).toHaveBeenCalledWith({
        recipientId: 'worker_456',
        type: 'task_status_changed',
        title: 'Task Status Updated',
        message: 'Task status changed from todo to done',
        metadata: {
          taskId: task.id,
          oldStatus: 'todo',
          newStatus: 'done'
        }
      });
    });
  });

  // ==============================================================================
  // STEP 3: REFACTOR - Improve implementation while keeping tests green
  // ==============================================================================

  describe('REFACTOR PHASE: Enhanced Task Management', () => {
    it('should handle task priority changes with validation', async () => {
      const taskManager = new TaskManager(mockNotificationService, mockAuditLogger);

      const task = await taskManager.createTask({
        title: 'Priority task',
        description: 'Task with changing priority',
        priority: 'low',
        assigneeId: 'user_789'
      });

      jest.clearAllMocks();

      const updatedTask = await taskManager.updateTaskPriority(task.id, 'high');

      expect(updatedTask.priority).toBe('high');
      expect(updatedTask.updatedAt).toBeInstanceOf(Date);

      // Verify priority change notification (high priority = urgent notification)
      expect(mockNotificationService.sendNotification).toHaveBeenCalledWith({
        recipientId: 'user_789',
        type: 'task_priority_changed',
        title: 'Task Priority Updated',
        message: 'Task priority changed from low to high - This is now urgent!',
        metadata: {
          taskId: task.id,
          oldPriority: 'low',
          newPriority: 'high',
          isUrgent: true
        }
      });
    });

    it('should provide task summary with metrics', async () => {
      const taskManager = new TaskManager(mockNotificationService, mockAuditLogger);

      // Create multiple tasks
      await taskManager.createTask({
        title: 'Task 1',
        description: 'First task',
        priority: 'high',
        assigneeId: 'user_1'
      });

      const task2 = await taskManager.createTask({
        title: 'Task 2',
        description: 'Second task',
        priority: 'medium',
        assigneeId: 'user_2'
      });

      await taskManager.createTask({
        title: 'Task 3',
        description: 'Third task',
        priority: 'low',
        assigneeId: 'user_3'
      });

      // Complete one task
      await taskManager.updateTaskStatus(task2.id, 'done');

      const summary = taskManager.getTaskSummary();

      expect(summary.total).toBe(3);
      expect(summary.byStatus.todo).toBe(2);
      expect(summary.byStatus.in_progress).toBe(0);
      expect(summary.byStatus.done).toBe(1);
      expect(summary.byPriority.high).toBe(1);
      expect(summary.byPriority.medium).toBe(1);
      expect(summary.byPriority.low).toBe(1);
      expect(summary.completionRate).toBeCloseTo(0.333, 2);
    });
  });
});

// ==============================================================================
// IMPLEMENTATION: Minimal code to make tests pass
// ==============================================================================

interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  status: 'todo' | 'in_progress' | 'done';
  assigneeId: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

interface TaskCreationData {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  assigneeId: string;
}

interface TaskSummary {
  total: number;
  byStatus: Record<Task['status'], number>;
  byPriority: Record<Task['priority'], number>;
  completionRate: number;
}

class TaskManager {
  private tasks: Map<string, Task> = new Map();

  constructor(
    private notificationService: NotificationService,
    private auditLogger: AuditLogger
  ) {}

  async createTask(taskData: TaskCreationData): Promise<Task> {
    // Validation (fail fast)
    if (!taskData.title.trim()) {
      throw new Error('Task title is required');
    }
    if (!taskData.assigneeId.trim()) {
      throw new Error('Assignee ID is required');
    }
    if (!['low', 'medium', 'high'].includes(taskData.priority)) {
      throw new Error('Priority must be low, medium, or high');
    }

    // Generate unique ID
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;

    // Create task object
    const now = new Date();
    const task: Task = {
      id: taskId,
      title: taskData.title,
      description: taskData.description,
      priority: taskData.priority,
      status: 'todo',
      assigneeId: taskData.assigneeId,
      createdAt: now,
      updatedAt: now
    };

    // Store task
    this.tasks.set(taskId, task);

    // Send notification to assignee
    await this.notificationService.sendNotification({
      recipientId: taskData.assigneeId,
      type: 'task_assigned',
      title: 'New Task Assigned',
      message: `You have been assigned a new task: ${taskData.title}`,
      metadata: {
        taskId: taskId,
        priority: taskData.priority
      }
    });

    // Log for audit trail
    await this.auditLogger.logAction({
      action: 'task_created',
      entityId: taskId,
      entityType: 'task',
      actorId: 'system',
      timestamp: now,
      details: {
        title: taskData.title,
        assigneeId: taskData.assigneeId,
        priority: taskData.priority
      }
    });

    return task;
  }

  async updateTaskStatus(taskId: string, newStatus: Task['status']): Promise<Task> {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    const oldStatus = task.status;
    const now = new Date();

    // Update task
    task.status = newStatus;
    task.updatedAt = now;

    // Set completion timestamp if done
    if (newStatus === 'done') {
      task.completedAt = now;
    }

    // Send status change notification
    await this.notificationService.sendNotification({
      recipientId: task.assigneeId,
      type: 'task_status_changed',
      title: 'Task Status Updated',
      message: `Task status changed from ${oldStatus} to ${newStatus}`,
      metadata: {
        taskId: taskId,
        oldStatus: oldStatus,
        newStatus: newStatus
      }
    });

    // Log status change
    await this.auditLogger.logAction({
      action: 'task_status_updated',
      entityId: taskId,
      entityType: 'task',
      actorId: 'system',
      timestamp: now,
      details: {
        oldStatus: oldStatus,
        newStatus: newStatus
      }
    });

    return task;
  }

  async updateTaskPriority(taskId: string, newPriority: Task['priority']): Promise<Task> {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    const oldPriority = task.priority;
    const now = new Date();

    // Update task
    task.priority = newPriority;
    task.updatedAt = now;

    // Determine if this is urgent (high priority)
    const isUrgent = newPriority === 'high';
    const message = `Task priority changed from ${oldPriority} to ${newPriority}${isUrgent ? ' - This is now urgent!' : ''}`;

    // Send priority change notification
    await this.notificationService.sendNotification({
      recipientId: task.assigneeId,
      type: 'task_priority_changed',
      title: 'Task Priority Updated',
      message: message,
      metadata: {
        taskId: taskId,
        oldPriority: oldPriority,
        newPriority: newPriority,
        isUrgent: isUrgent
      }
    });

    return task;
  }

  getTaskSummary(): TaskSummary {
    const tasks = Array.from(this.tasks.values());

    const byStatus = {
      todo: tasks.filter(t => t.status === 'todo').length,
      in_progress: tasks.filter(t => t.status === 'in_progress').length,
      done: tasks.filter(t => t.status === 'done').length
    };

    const byPriority = {
      low: tasks.filter(t => t.priority === 'low').length,
      medium: tasks.filter(t => t.priority === 'medium').length,
      high: tasks.filter(t => t.priority === 'high').length
    };

    const completionRate = tasks.length > 0 ? byStatus.done / tasks.length : 0;

    return {
      total: tasks.length,
      byStatus,
      byPriority,
      completionRate
    };
  }
}

/**
 * RED-GREEN-REFACTOR CYCLE SUMMARY:
 *
 * RED PHASE:
 * - Write failing tests that specify exact behavior
 * - Define clear contracts and interactions
 * - Use precise assertions with expected values
 * - Test error conditions and edge cases
 *
 * GREEN PHASE:
 * - Write minimal code to make tests pass
 * - Don't over-engineer - just make it work
 * - Focus on making tests green, not perfect code
 * - Implement exactly what tests specify
 *
 * REFACTOR PHASE:
 * - Improve code structure while keeping tests green
 * - Add new features with new tests first
 * - Extract methods, improve naming, reduce duplication
 * - Tests act as safety net during refactoring
 *
 * LONDON SCHOOL TDD PRINCIPLES APPLIED:
 * ✅ Mock external dependencies (NotificationService, AuditLogger)
 * ✅ Test object interactions and collaborations
 * ✅ Verify behavior, not implementation details
 * ✅ Use precise assertions with expected values
 * ✅ Focus on outside-in development approach
 * ✅ Test error conditions and edge cases
 */

/* AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE */
/* Version & Run Log */
/* | Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash | */
/* |--------:|-----------|-------------|----------------|-----------|--------|-------|------|------| */
/* | 1.0.0   | 2025-09-27T08:35:42-04:00 | tdd-london-swarm@claude-sonnet-4-20250514 | Create complete Red-Green-Refactor TDD cycle example with London School principles | RedGreenRefactorCycle.test.ts | OK | Comprehensive TDD cycle demonstration showing RED (failing tests), GREEN (minimal implementation), REFACTOR (improvements) phases | 0.00 | d8e5f92 | */
/* ### Receipt */
/* - status: OK */
/* - reason_if_blocked: -- */
/* - run_id: red-green-refactor-cycle-001 */
/* - inputs: ["TDD cycle requirements", "London School TDD methodology", "Theater elimination patterns"] */
/* - tools_used: ["Write"] */
/* - versions: {"model":"claude-sonnet-4-20250514","prompt":"tdd-london-swarm-v1.0"} */
/* AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE */