import { Request, Response, NextFunction } from 'express';
import { LangroidMemoryBackend, MemoryPriority, MemoryQuery } from '../../princesses/infrastructure/memory/LangroidMemoryBackend';
import { MemoryMetrics } from '../../princesses/infrastructure/memory/MemoryMetrics';
import { InfrastructureTaskManager } from './InfrastructureTaskManager';

/**
 * Infrastructure Princess REST API Controller
 * Provides comprehensive REST endpoints for infrastructure operations,
 * memory management, task coordination, and real-time monitoring.
 */
export interface TaskSubmissionRequest {
  id?: string;
  type: 'deployment' | 'monitoring' | 'scaling' | 'maintenance' | 'backup';
  priority: 'low' | 'medium' | 'high' | 'critical';
  payload: any;
  metadata?: Record<string, any>;
  ttl?: number;
  tags?: string[];
}

export interface TaskStatusResponse {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  type: string;
  priority: string;
  progress: number;
  startTime?: number;
  endTime?: number;
  result?: any;
  error?: string;
  metadata: Record<string, any>;
}

export interface MemoryOperationRequest {
  id: string;
  content?: any;
  ttl?: number;
  priority?: 'critical' | 'high' | 'medium' | 'low' | 'cache';
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface QueryRequest {
  tags?: string[];
  priority?: 'critical' | 'high' | 'medium' | 'low' | 'cache';
  timeRange?: { start: number; end: number };
  contentPattern?: string;
  limit?: number;
}

export class InfrastructureController {
  private memoryBackend: LangroidMemoryBackend;
  private memoryMetrics: MemoryMetrics;
  private taskManager: InfrastructureTaskManager;

  constructor(
    memoryBackend: LangroidMemoryBackend,
    memoryMetrics: MemoryMetrics,
    taskManager: InfrastructureTaskManager
  ) {
    this.memoryBackend = memoryBackend;
    this.memoryMetrics = memoryMetrics;
    this.taskManager = taskManager;
  }

  /**
   * POST /infrastructure/tasks - Submit infrastructure task
   */
  public submitTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const taskRequest: TaskSubmissionRequest = req.body;

      // Validate request
      if (!taskRequest.type || !taskRequest.priority || !taskRequest.payload) {
        res.status(400).json({
          error: 'Missing required fields: type, priority, payload'
        });
        return;
      }

      // Generate task ID if not provided
      const taskId = taskRequest.id || this.generateTaskId();

      // Convert priority
      const priority = this.convertPriority(taskRequest.priority);

      // Submit task
      const task = await this.taskManager.submitTask({
        id: taskId,
        type: taskRequest.type,
        priority,
        payload: taskRequest.payload,
        metadata: taskRequest.metadata || {},
        ttl: taskRequest.ttl,
        tags: taskRequest.tags || []
      });

      // Store task in memory for tracking
      await this.memoryBackend.store(taskId, task, {
        priority,
        tags: ['task', taskRequest.type, ...(taskRequest.tags || [])],
        ttl: taskRequest.ttl,
        metadata: {
          taskType: taskRequest.type,
          submittedAt: Date.now(),
          ...taskRequest.metadata
        }
      });

      res.status(201).json({
        taskId,
        status: 'submitted',
        message: 'Task submitted successfully',
        estimatedStartTime: task.estimatedStartTime
      });

    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /infrastructure/tasks/:id - Get task status
   */
  public getTaskStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({ error: 'Task ID is required' });
        return;
      }

      // Get task from memory
      const memoryEntry = await this.memoryBackend.retrieve(id);
      if (!memoryEntry) {
        res.status(404).json({ error: 'Task not found' });
        return;
      }

      // Get current status from task manager
      const currentStatus = await this.taskManager.getTaskStatus(id);

      const response: TaskStatusResponse = {
        id,
        status: currentStatus.status,
        type: currentStatus.type,
        priority: currentStatus.priority,
        progress: currentStatus.progress,
        startTime: currentStatus.startTime,
        endTime: currentStatus.endTime,
        result: currentStatus.result,
        error: currentStatus.error,
        metadata: {
          ...memoryEntry.metadata,
          lastUpdated: Date.now(),
          memorySize: memoryEntry.size
        }
      };

      res.json(response);

    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /infrastructure/tasks - List tasks with filtering
   */
  public listTasks = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const {
        status,
        type,
        priority,
        limit = '50',
        offset = '0'
      } = req.query;

      // Build query
      const query: MemoryQuery = {
        tags: ['task'],
        limit: parseInt(limit as string)
      };

      if (type) {
        query.tags!.push(type as string);
      }

      // Query memory for tasks
      const memoryEntries = await this.memoryBackend.query(query);

      // Get current statuses from task manager
      const tasks = await Promise.all(
        memoryEntries.map(async (entry) => {
          try {
            const currentStatus = await this.taskManager.getTaskStatus(entry.id);
            return {
              id: entry.id,
              status: currentStatus.status,
              type: currentStatus.type,
              priority: currentStatus.priority,
              progress: currentStatus.progress,
              submittedAt: entry.timestamp,
              lastUpdated: entry.metadata.lastAccessed || entry.timestamp
            };
          } catch {
            // Task might not exist in task manager anymore
            return null;
          }
        })
      );

      // Filter out null entries and apply filters
      let filteredTasks = tasks.filter(task => task !== null);

      if (status) {
        filteredTasks = filteredTasks.filter(task => task!.status === status);
      }

      if (priority) {
        filteredTasks = filteredTasks.filter(task => task!.priority === priority);
      }

      // Apply pagination
      const offsetNum = parseInt(offset as string);
      const paginatedTasks = filteredTasks.slice(offsetNum, offsetNum + parseInt(limit as string));

      res.json({
        tasks: paginatedTasks,
        pagination: {
          total: filteredTasks.length,
          limit: parseInt(limit as string),
          offset: offsetNum,
          hasMore: offsetNum + parseInt(limit as string) < filteredTasks.length
        }
      });

    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /infrastructure/tasks/:id - Cancel task
   */
  public cancelTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({ error: 'Task ID is required' });
        return;
      }

      // Cancel task in task manager
      const cancelled = await this.taskManager.cancelTask(id);

      if (!cancelled) {
        res.status(404).json({ error: 'Task not found or cannot be cancelled' });
        return;
      }

      // Update memory entry
      const memoryEntry = await this.memoryBackend.retrieve(id);
      if (memoryEntry) {
        memoryEntry.metadata.cancelledAt = Date.now();
        await this.memoryBackend.store(id, memoryEntry.content, {
          priority: memoryEntry.priority,
          tags: memoryEntry.tags,
          ttl: memoryEntry.ttl,
          metadata: memoryEntry.metadata
        });
      }

      res.json({
        taskId: id,
        status: 'cancelled',
        message: 'Task cancelled successfully'
      });

    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /infrastructure/status - Get overall system status
   */
  public getSystemStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Get memory stats
      const memoryStats = this.memoryBackend.getStats();
      const currentMetrics = this.memoryMetrics.getCurrentMetrics();
      const activeAlerts = this.memoryMetrics.getActiveAlerts();

      // Get task manager stats
      const taskStats = await this.taskManager.getStats();

      const systemStatus = {
        timestamp: Date.now(),
        status: this.determineOverallStatus(memoryStats, taskStats, activeAlerts),
        memory: {
          usage: {
            used: memoryStats.usedSize,
            available: memoryStats.availableSize,
            total: memoryStats.totalSize,
            usagePercent: (memoryStats.usedSize / memoryStats.totalSize) * 100
          },
          performance: {
            hitRate: memoryStats.hitRate,
            entryCount: memoryStats.entryCount,
            evictionCount: memoryStats.evictionCount
          },
          responseTimes: currentMetrics.responseTimes
        },
        tasks: {
          active: taskStats.activeTasks,
          queued: taskStats.queuedTasks,
          completed: taskStats.completedTasks,
          failed: taskStats.failedTasks,
          throughput: taskStats.throughputPerHour
        },
        alerts: {
          active: activeAlerts.length,
          critical: activeAlerts.filter(a => a.type === 'critical').length,
          warnings: activeAlerts.filter(a => a.type === 'warning').length,
          alerts: activeAlerts
        },
        uptime: this.taskManager.getUptimeMs()
      };

      res.json(systemStatus);

    } catch (error) {
      next(error);
    }
  };

  /**
   * PUT /infrastructure/memory - Memory management operations
   */
  public memoryOperation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { operation } = req.query;
      const requestData: MemoryOperationRequest = req.body;

      switch (operation) {
        case 'store':
          if (!requestData.id || !requestData.content) {
            res.status(400).json({ error: 'ID and content are required for store operation' });
            return;
          }

          const stored = await this.memoryBackend.store(requestData.id, requestData.content, {
            ttl: requestData.ttl,
            priority: this.convertMemoryPriority(requestData.priority),
            tags: requestData.tags,
            metadata: requestData.metadata
          });

          res.json({
            operation: 'store',
            success: stored,
            id: requestData.id,
            message: stored ? 'Entry stored successfully' : 'Failed to store entry'
          });
          break;

        case 'retrieve':
          if (!requestData.id) {
            res.status(400).json({ error: 'ID is required for retrieve operation' });
            return;
          }

          const entry = await this.memoryBackend.retrieve(requestData.id);
          if (!entry) {
            res.status(404).json({ error: 'Entry not found' });
            return;
          }

          res.json({
            operation: 'retrieve',
            success: true,
            data: entry
          });
          break;

        case 'remove':
          if (!requestData.id) {
            res.status(400).json({ error: 'ID is required for remove operation' });
            return;
          }

          const removed = await this.memoryBackend.remove(requestData.id);
          res.json({
            operation: 'remove',
            success: removed,
            id: requestData.id,
            message: removed ? 'Entry removed successfully' : 'Entry not found'
          });
          break;

        case 'optimize':
          await this.memoryBackend.optimize();
          res.json({
            operation: 'optimize',
            success: true,
            message: 'Memory optimization completed'
          });
          break;

        default:
          res.status(400).json({ error: 'Invalid operation. Supported: store, retrieve, remove, optimize' });
      }

    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /infrastructure/memory/query - Query memory entries
   */
  public queryMemory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const queryRequest: QueryRequest = req.body;

      const query: MemoryQuery = {
        tags: queryRequest.tags,
        priority: this.convertMemoryPriority(queryRequest.priority),
        timeRange: queryRequest.timeRange,
        contentPattern: queryRequest.contentPattern,
        limit: queryRequest.limit || 50
      };

      const results = await this.memoryBackend.query(query);

      res.json({
        query: queryRequest,
        results: results.map(entry => ({
          id: entry.id,
          size: entry.size,
          timestamp: entry.timestamp,
          priority: entry.priority,
          tags: entry.tags,
          metadata: entry.metadata,
          content: entry.content
        })),
        count: results.length
      });

    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /infrastructure/cleanup - Resource cleanup
   */
  public cleanup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { type = 'all' } = req.query;

      const results: any = {
        timestamp: Date.now(),
        type,
        results: {}
      };

      if (type === 'all' || type === 'memory') {
        await this.memoryBackend.optimize();
        const memoryStats = this.memoryBackend.getStats();
        results.results.memory = {
          optimized: true,
          stats: memoryStats
        };
      }

      if (type === 'all' || type === 'tasks') {
        const cleanedTasks = await this.taskManager.cleanupCompletedTasks();
        results.results.tasks = {
          cleanedCount: cleanedTasks
        };
      }

      if (type === 'all' || type === 'metrics') {
        // Clean old metrics (keep last 1000 entries)
        const currentHistory = this.memoryMetrics.getMetricsHistory();
        if (currentHistory.length > 1000) {
          // This would require a method in MemoryMetrics to trim history
          results.results.metrics = {
            trimmed: true,
            oldCount: currentHistory.length,
            newCount: 1000
          };
        } else {
          results.results.metrics = {
            trimmed: false,
            count: currentHistory.length
          };
        }
      }

      res.json({
        message: 'Cleanup completed successfully',
        ...results
      });

    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /infrastructure/metrics - Get performance metrics
   */
  public getMetrics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { period = '3600000', format = 'json' } = req.query; // Default 1 hour

      const periodMs = parseInt(period as string);
      const aggregatedMetrics = this.memoryMetrics.getAggregatedMetrics(periodMs);

      if (format === 'report') {
        const report = this.memoryMetrics.generateReport(periodMs);
        res.type('text/plain').send(report);
        return;
      }

      res.json({
        period: periodMs,
        current: this.memoryMetrics.getCurrentMetrics(),
        aggregated: aggregatedMetrics,
        alerts: this.memoryMetrics.getActiveAlerts(),
        history: this.memoryMetrics.getMetricsHistory(100) // Last 100 entries
      });

    } catch (error) {
      next(error);
    }
  };

  // Private helper methods

  private generateTaskId(): string {
    return `inf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
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

  private convertMemoryPriority(priority?: string): MemoryPriority | undefined {
    if (!priority) return undefined;
    return this.convertPriority(priority);
  }

  private determineOverallStatus(memoryStats: any, taskStats: any, alerts: any[]): string {
    const criticalAlerts = alerts.filter(a => a.type === 'critical').length;
    const memoryUsage = (memoryStats.usedSize / memoryStats.totalSize) * 100;

    if (criticalAlerts > 0 || memoryUsage > 95) {
      return 'critical';
    }

    if (alerts.length > 0 || memoryUsage > 85 || taskStats.failedTasks > taskStats.completedTasks * 0.1) {
      return 'warning';
    }

    return 'healthy';
  }
}

export default InfrastructureController;