import { Router } from 'express';
import InfrastructureController from './InfrastructureController';
import InfrastructurePrincess from '../../princesses/infrastructure/InfrastructurePrincess';

/**
 * Infrastructure Princess API Routes
 * Complete REST API routing for Infrastructure Princess operations
 * with comprehensive endpoint coverage and middleware integration.
 */

/**
 * Create Infrastructure API router
 */
export function createInfrastructureRoutes(princess: InfrastructurePrincess): Router {
  const router = Router();

  // Initialize controller with princess components
  const controller = new InfrastructureController(
    princess.getMemoryBackend(),
    princess.getMemoryBackend()['memoryMetrics'], // Access metrics from memory backend
    princess.getTaskManager()
  );

  // Middleware for request logging
  router.use((req, res, next) => {
    console.log(`[Infrastructure API] ${req.method} ${req.path} - ${new Date().toISOString()}`);
    next();
  });

  // Middleware for error handling
  const errorHandler = (err: any, req: any, res: any, next: any) => {
    console.error(`[Infrastructure API Error] ${req.method} ${req.path}:`, err);

    res.status(err.status || 500).json({
      error: {
        message: err.message || 'Internal server error',
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method
      }
    });
  };

  // ========================================
  // TASK MANAGEMENT ENDPOINTS
  // ========================================

  /**
   * @route POST /infrastructure/tasks
   * @desc Submit infrastructure task
   */
  router.post('/tasks', controller.submitTask);

  /**
   * @route GET /infrastructure/tasks/:id
   * @desc Get task status
   */
  router.get('/tasks/:id', controller.getTaskStatus);

  /**
   * @route GET /infrastructure/tasks
   * @desc List tasks with filtering
   */
  router.get('/tasks', controller.listTasks);

  /**
   * @route DELETE /infrastructure/tasks/:id
   * @desc Cancel task
   */
  router.delete('/tasks/:id', controller.cancelTask);

  // ========================================
  // SYSTEM STATUS ENDPOINTS
  // ========================================

  /**
   * @route GET /infrastructure/status
   * @desc Get overall system status
   */
  router.get('/status', controller.getSystemStatus);

  /**
   * @route GET /infrastructure/health
   * @desc Comprehensive health check
   */
  router.get('/health', async (req, res, next) => {
    try {
      const healthCheck = await princess.healthCheck();
      res.json({
        timestamp: Date.now(),
        status: healthCheck.overall,
        components: healthCheck.components,
        details: healthCheck.details,
        uptime: princess.getStatus().uptime
      });
    } catch (error) {
      next(error);
    }
  });

  // ========================================
  // MEMORY MANAGEMENT ENDPOINTS
  // ========================================

  /**
   * @route PUT /infrastructure/memory
   * @desc Memory management operations
   */
  router.put('/memory', controller.memoryOperation);

  /**
   * @route POST /infrastructure/memory/query
   * @desc Query memory entries
   */
  router.post('/memory/query', controller.queryMemory);

  /**
   * @route GET /infrastructure/memory/stats
   * @desc Get memory statistics
   */
  router.get('/memory/stats', async (req, res, next) => {
    try {
      const memoryBackend = princess.getMemoryBackend();
      const stats = memoryBackend.getStats();

      res.json({
        timestamp: Date.now(),
        memory: stats,
        metrics: princess.getMemoryBackend()['memoryMetrics']?.getCurrentMetrics() || null
      });
    } catch (error) {
      next(error);
    }
  });

  // ========================================
  // RESOURCE ALLOCATION ENDPOINTS
  // ========================================

  /**
   * @route POST /infrastructure/resources/allocate
   * @desc Request resource allocation
   */
  router.post('/resources/allocate', async (req, res, next) => {
    try {
      const resourceAllocation = princess.getResourceAllocation();
      const request = req.body;

      const result = await resourceAllocation.requestAllocation(request);

      res.status(result.success ? 201 : 409).json({
        timestamp: Date.now(),
        ...result
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * @route DELETE /infrastructure/resources/:allocationId
   * @desc Release resource allocation
   */
  router.delete('/resources/:allocationId', async (req, res, next) => {
    try {
      const { allocationId } = req.params;
      const resourceAllocation = princess.getResourceAllocation();

      const success = await resourceAllocation.releaseAllocation(allocationId);

      res.status(success ? 200 : 404).json({
        timestamp: Date.now(),
        success,
        allocationId,
        message: success ? 'Resource released successfully' : 'Allocation not found'
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * @route GET /infrastructure/resources/utilization
   * @desc Get current resource utilization
   */
  router.get('/resources/utilization', async (req, res, next) => {
    try {
      const resourceAllocation = princess.getResourceAllocation();
      const utilization = resourceAllocation.getResourceUtilization();
      const stats = resourceAllocation.getResourceStats();

      res.json({
        timestamp: Date.now(),
        utilization: Object.fromEntries(utilization),
        stats,
        activeAllocations: resourceAllocation.getActiveAllocations().length
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * @route GET /infrastructure/resources/forecast/:resourceType
   * @desc Generate resource forecast
   */
  router.get('/resources/forecast/:resourceType', async (req, res, next) => {
    try {
      const { resourceType } = req.params;
      const { timeHorizon } = req.query;

      const resourceAllocation = princess.getResourceAllocation();
      const forecast = resourceAllocation.generateForecast(
        resourceType as any,
        timeHorizon ? parseInt(timeHorizon as string) : undefined
      );

      res.json({
        timestamp: Date.now(),
        forecast
      });
    } catch (error) {
      next(error);
    }
  });

  // ========================================
  // PRIORITY MANAGEMENT ENDPOINTS
  // ========================================

  /**
   * @route GET /infrastructure/priorities/queue-status
   * @desc Get priority queue status
   */
  router.get('/priorities/queue-status', async (req, res, next) => {
    try {
      const priorityManager = princess.getPriorityManager();
      const queueStatus = priorityManager.getQueueStatus();
      const stats = priorityManager.getStats();

      res.json({
        timestamp: Date.now(),
        queueStatus: Object.fromEntries(queueStatus),
        stats
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * @route POST /infrastructure/priorities/update
   * @desc Force priority update for all tasks
   */
  router.post('/priorities/update', async (req, res, next) => {
    try {
      const priorityManager = princess.getPriorityManager();
      priorityManager.updateAllPriorities();

      res.json({
        timestamp: Date.now(),
        message: 'Priorities updated successfully'
      });
    } catch (error) {
      next(error);
    }
  });

  // ========================================
  // REPORTING ENDPOINTS
  // ========================================

  /**
   * @route POST /infrastructure/reports/generate
   * @desc Generate comprehensive status report
   */
  router.post('/reports/generate', async (req, res, next) => {
    try {
      const { type = 'system_status' } = req.body;
      const report = await princess.generateStatusReport();

      res.json({
        timestamp: Date.now(),
        report
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * @route GET /infrastructure/reports/history
   * @desc Get report history
   */
  router.get('/reports/history', async (req, res, next) => {
    try {
      const { limit = '10' } = req.query;
      const reporting = princess.getReporting();
      const history = reporting.getReportHistory(parseInt(limit as string));

      res.json({
        timestamp: Date.now(),
        reports: history,
        count: history.length
      });
    } catch (error) {
      next(error);
    }
  });

  // ========================================
  // PERFORMANCE METRICS ENDPOINTS
  // ========================================

  /**
   * @route GET /infrastructure/metrics
   * @desc Get performance metrics
   */
  router.get('/metrics', controller.getMetrics);

  /**
   * @route GET /infrastructure/metrics/alerts
   * @desc Get active alerts
   */
  router.get('/metrics/alerts', async (req, res, next) => {
    try {
      const memoryMetrics = princess.getMemoryBackend()['memoryMetrics'];
      const alerts = memoryMetrics?.getActiveAlerts() || [];

      res.json({
        timestamp: Date.now(),
        alerts,
        count: alerts.length
      });
    } catch (error) {
      next(error);
    }
  });

  // ========================================
  // OPTIMIZATION ENDPOINTS
  // ========================================

  /**
   * @route POST /infrastructure/optimize
   * @desc Trigger system optimization
   */
  router.post('/optimize', async (req, res, next) => {
    try {
      await princess.optimize();

      res.json({
        timestamp: Date.now(),
        message: 'System optimization completed successfully'
      });
    } catch (error) {
      next(error);
    }
  });

  // ========================================
  // CLEANUP ENDPOINTS
  // ========================================

  /**
   * @route DELETE /infrastructure/cleanup
   * @desc Resource cleanup
   */
  router.delete('/cleanup', controller.cleanup);

  // ========================================
  // CONFIGURATION ENDPOINTS
  // ========================================

  /**
   * @route GET /infrastructure/config
   * @desc Get current configuration
   */
  router.get('/config', async (req, res, next) => {
    try {
      const status = princess.getStatus();

      res.json({
        timestamp: Date.now(),
        status,
        uptime: status.uptime,
        configuration: {
          // Return sanitized configuration (no sensitive data)
          version: '1.0.0',
          features: {
            memoryManagement: true,
            taskPriority: true,
            resourceAllocation: true,
            reporting: true,
            optimization: true
          }
        }
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * @route PUT /infrastructure/config
   * @desc Update configuration
   */
  router.put('/config', async (req, res, next) => {
    try {
      const newConfig = req.body;
      princess.updateConfig(newConfig);

      res.json({
        timestamp: Date.now(),
        message: 'Configuration updated successfully'
      });
    } catch (error) {
      next(error);
    }
  });

  // ========================================
  // QUEEN INTEGRATION ENDPOINTS
  // ========================================

  /**
   * @route POST /infrastructure/queen/command
   * @desc Process Queen command
   */
  router.post('/queen/command', async (req, res, next) => {
    try {
      const command = req.body;
      const result = await princess.processQueenCommand(command);

      res.status(201).json({
        timestamp: Date.now(),
        commandId: command.id,
        result
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * @route GET /infrastructure/queen/commands/:commandId
   * @desc Get Queen command status
   */
  router.get('/queen/commands/:commandId', async (req, res, next) => {
    try {
      const { commandId } = req.params;
      const adapter = princess.getAdapter();
      const status = adapter.getCommandStatus(commandId);

      if (!status) {
        return res.status(404).json({
          timestamp: Date.now(),
          error: 'Command not found'
        });
      }

      res.json({
        timestamp: Date.now(),
        command: status
      });
    } catch (error) {
      next(error);
    }
  });

  // ========================================
  // WEBSOCKET EVENTS (if needed)
  // ========================================

  /**
   * @route GET /infrastructure/events/stream
   * @desc Server-sent events for real-time updates
   */
  router.get('/events/stream', (req, res) => {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    // Send initial connection event
    res.write(`data: ${JSON.stringify({
      type: 'connection',
      timestamp: Date.now(),
      message: 'Connected to Infrastructure Princess events'
    })}\n\n`);

    // Set up event listeners
    const eventHandler = (data: any) => {
      res.write(`data: ${JSON.stringify({
        type: 'status-update',
        timestamp: Date.now(),
        data
      })}\n\n`);
    };

    princess.on('status-changed', eventHandler);
    princess.on('report-generated', eventHandler);
    princess.on('command-completed', eventHandler);

    // Handle client disconnect
    req.on('close', () => {
      princess.removeListener('status-changed', eventHandler);
      princess.removeListener('report-generated', eventHandler);
      princess.removeListener('command-completed', eventHandler);
    });
  });

  // Apply error handling middleware
  router.use(errorHandler);

  return router;
}

export default createInfrastructureRoutes;