/**
 * SPEK Desktop Automation Service
 * Manages Bytebot container lifecycle and desktop automation operations
 * 
 * Features:
 * - Container lifecycle management
 * - Health monitoring and connection management
 * - Operation queue management
 * - Security validation and sandbox isolation
 * - Integration with SPEK quality gate system
 */

const axios = require('axios');
const EventEmitter = require('events');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class DesktopAutomationService extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      bytebotDesktopUrl: config.bytebotDesktopUrl || process.env.BYTEBOT_DESKTOP_URL || 'http://localhost:9990',
      bytebotAgentUrl: config.bytebotAgentUrl || process.env.BYTEBOT_AGENT_URL || 'http://localhost:9991',
      mcpServerPort: config.mcpServerPort || process.env.MCP_SERVER_PORT || 9995,
      evidenceDir: config.evidenceDir || process.env.EVIDENCE_DIR || '.claude/.artifacts/desktop',
      maxRetries: config.maxRetries || 3,
      timeout: config.timeout || 30000,
      healthCheckInterval: config.healthCheckInterval || 30000,
      queueProcessingInterval: config.queueProcessingInterval || 1000,
      maxQueueSize: config.maxQueueSize || 100,
      ...config
    };

    // Security configuration
    this.security = {
      allowedApplications: this.parseAllowedApps(config.allowedApplications),
      maxCoordinateValue: config.maxCoordinateValue || 4096,
      requireConfirmation: config.requireConfirmation !== false,
      auditTrail: config.auditTrail !== false,
      sandboxMode: config.sandboxMode !== false
    };

    // Service state
    this.state = {
      isInitialized: false,
      isHealthy: false,
      lastHealthCheck: null,
      connectionAttempts: 0,
      maxConnectionAttempts: 5,
      activeOperations: new Map(),
      sessionId: this.generateSessionId()
    };

    // Operation queue
    this.operationQueue = [];
    this.isProcessingQueue = false;
    this.queueStats = {
      processed: 0,
      failed: 0,
      avgProcessingTime: 0
    };

    // Container management
    this.containers = {
      desktop: {
        url: this.config.bytebotDesktopUrl,
        status: 'unknown',
        lastPing: null,
        version: null
      },
      agent: {
        url: this.config.bytebotAgentUrl,
        status: 'unknown',
        lastPing: null,
        version: null
      }
    };

    this.setupEventHandlers();
  }

  /**
   * Initialize the desktop automation service
   */
  async initialize() {
    try {
      console.log('Initializing Desktop Automation Service...');
      
      // Create evidence directory
      await this.ensureEvidenceDirectory();
      
      // Check container health
      await this.performHealthCheck();
      
      // Start monitoring
      this.startHealthMonitoring();
      this.startQueueProcessing();
      
      this.state.isInitialized = true;
      this.emit('initialized', { sessionId: this.state.sessionId });
      
      console.log(`Desktop Automation Service initialized with session ID: ${this.state.sessionId}`);
      return true;
      
    } catch (error) {
      console.error('Failed to initialize Desktop Automation Service:', error);
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Queue desktop operation for processing
   */
  async queueOperation(operation) {
    if (this.operationQueue.length >= this.config.maxQueueSize) {
      throw new Error(`Operation queue full (max: ${this.config.maxQueueSize})`);
    }

    const queuedOperation = {
      id: crypto.randomUUID(),
      ...operation,
      queuedAt: new Date(),
      attempts: 0,
      maxAttempts: operation.maxAttempts || 3
    };

    this.operationQueue.push(queuedOperation);
    this.emit('operationQueued', queuedOperation);
    
    return queuedOperation.id;
  }

  /**
   * Execute desktop operation directly
   */
  async executeOperation(operation) {
    const startTime = Date.now();
    const operationId = crypto.randomUUID();
    
    try {
      // Validate operation
      await this.validateOperation(operation);
      
      // Mark as active
      this.state.activeOperations.set(operationId, {
        ...operation,
        startTime,
        status: 'executing'
      });
      
      // Execute operation
      const result = await this.performOperation(operation);
      
      // Record success
      const duration = Date.now() - startTime;
      this.updateQueueStats(true, duration);
      
      // Store evidence
      await this.storeOperationEvidence(operation, result, duration);
      
      this.state.activeOperations.delete(operationId);
      this.emit('operationCompleted', { operationId, operation, result, duration });
      
      return result;
      
    } catch (error) {
      const duration = Date.now() - startTime;
      this.updateQueueStats(false, duration);
      
      await this.logOperationError(operation, error, duration);
      
      this.state.activeOperations.delete(operationId);
      this.emit('operationFailed', { operationId, operation, error, duration });
      
      throw error;
    }
  }

  /**
   * Validate operation against security policies
   */
  async validateOperation(operation) {
    const { type, params } = operation;
    
    // Coordinate bounds checking
    if (params.x !== undefined) {
      if (params.x < 0 || params.x > this.security.maxCoordinateValue) {
        throw new Error(`X coordinate ${params.x} exceeds bounds [0, ${this.security.maxCoordinateValue}]`);
      }
    }
    
    if (params.y !== undefined) {
      if (params.y < 0 || params.y > this.security.maxCoordinateValue) {
        throw new Error(`Y coordinate ${params.y} exceeds bounds [0, ${this.security.maxCoordinateValue}]`);
      }
    }
    
    // Application allowlist checking
    if (params.application) {
      const isAllowed = this.security.allowedApplications.includes('*') ||
        this.security.allowedApplications.some(app => 
          params.application.toLowerCase().includes(app.toLowerCase())
        );
      
      if (!isAllowed) {
        throw new Error(`Application '${params.application}' not in allowlist`);
      }
    }
    
    // Dangerous operation confirmation
    if (this.isDangerousOperation(type, params) && this.security.requireConfirmation) {
      if (!params.confirm) {
        throw new Error(`Operation '${type}' requires explicit confirmation`);
      }
    }
    
    return true;
  }

  /**
   * Perform actual desktop operation
   */
  async performOperation(operation) {
    const { type, params } = operation;
    
    switch (type) {
      case 'screenshot':
        return await this.takeScreenshot(params);
      case 'click':
        return await this.clickAt(params);
      case 'type':
        return await this.typeText(params);
      case 'move_mouse':
        return await this.moveMouse(params);
      case 'scroll':
        return await this.scroll(params);
      case 'launch_app':
        return await this.launchApplication(params);
      case 'file_operation':
        return await this.performFileOperation(params);
      default:
        throw new Error(`Unknown operation type: ${type}`);
    }
  }

  /**
   * Take screenshot via Bytebot
   */
  async takeScreenshot(params) {
    const response = await this.callBytebotAPI('/screenshot', {
      area: params.area || 'full',
      coordinates: params.coordinates,
      application: params.application,
      quality: params.quality || 'medium'
    });
    
    // Save screenshot for evidence
    if (response.imageData) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `screenshot-${timestamp}.png`;
      const filepath = path.join(this.config.evidenceDir, filename);
      
      await fs.writeFile(filepath, Buffer.from(response.imageData, 'base64'));
      response.savedPath = filepath;
    }
    
    return response;
  }

  /**
   * Click at coordinates
   */
  async clickAt(params) {
    return await this.callBytebotAPI('/click', {
      x: params.x,
      y: params.y,
      button: params.button || 'left',
      doubleClick: params.doubleClick || false,
      delay: params.delay || 100
    });
  }

  /**
   * Type text
   */
  async typeText(params) {
    return await this.callBytebotAPI('/type', {
      text: params.text,
      delay: params.delay || 50,
      clearFirst: params.clearFirst || false
    });
  }

  /**
   * Move mouse
   */
  async moveMouse(params) {
    return await this.callBytebotAPI('/move_mouse', {
      x: params.x,
      y: params.y,
      duration: params.duration || 500
    });
  }

  /**
   * Scroll
   */
  async scroll(params) {
    return await this.callBytebotAPI('/scroll', {
      direction: params.direction,
      amount: params.amount || 3,
      target: params.x !== undefined && params.y !== undefined ? 
        { x: params.x, y: params.y } : undefined
    });
  }

  /**
   * Launch application
   */
  async launchApplication(params) {
    return await this.callBytebotAPI('/launch_app', {
      application: params.application,
      args: params.args || [],
      waitForLaunch: params.waitForLaunch !== false
    });
  }

  /**
   * Perform file operation
   */
  async performFileOperation(params) {
    return await this.callBytebotAPI('/file_operation', {
      operation: params.operation,
      path: params.path,
      newPath: params.newPath,
      confirm: params.confirm !== false
    });
  }

  /**
   * Call Bytebot API
   */
  async callBytebotAPI(endpoint, payload) {
    const url = `${this.config.bytebotDesktopUrl}${endpoint}`;
    
    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        const response = await axios.post(url, payload, {
          timeout: this.config.timeout,
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'SPEK-Desktop-Service/1.0.0',
            'X-Session-ID': this.state.sessionId
          }
        });
        
        this.state.connectionAttempts = 0;
        return response.data;
        
      } catch (error) {
        this.state.connectionAttempts++;
        
        if (attempt === this.config.maxRetries) {
          throw new Error(`Bytebot API call failed after ${attempt} attempts: ${error.message}`);
        }
        
        await this.delay(1000 * attempt);
      }
    }
  }

  /**
   * Perform health check
   */
  async performHealthCheck() {
    const results = {
      timestamp: new Date().toISOString(),
      overall: true,
      containers: {}
    };
    
    for (const [name, container] of Object.entries(this.containers)) {
      try {
        const healthUrl = `${container.url}/health`;
        const response = await axios.get(healthUrl, { timeout: 5000 });
        
        results.containers[name] = {
          status: 'healthy',
          url: container.url,
          responseTime: response.headers['x-response-time'] || 'unknown',
          version: response.data.version || 'unknown'
        };
        
        container.status = 'healthy';
        container.lastPing = new Date();
        container.version = response.data.version;
        
      } catch (error) {
        results.containers[name] = {
          status: 'unhealthy',
          url: container.url,
          error: error.message
        };
        
        container.status = 'unhealthy';
        container.lastPing = new Date();
        results.overall = false;
      }
    }
    
    this.state.isHealthy = results.overall;
    this.state.lastHealthCheck = new Date();
    
    this.emit('healthCheck', results);
    
    return results;
  }

  /**
   * Start health monitoring
   */
  startHealthMonitoring() {
    setInterval(async () => {
      try {
        await this.performHealthCheck();
      } catch (error) {
        console.error('Health check failed:', error);
        this.emit('healthCheckFailed', error);
      }
    }, this.config.healthCheckInterval);
  }

  /**
   * Start queue processing
   */
  startQueueProcessing() {
    setInterval(async () => {
      if (!this.isProcessingQueue && this.operationQueue.length > 0) {
        await this.processQueue();
      }
    }, this.config.queueProcessingInterval);
  }

  /**
   * Process operation queue
   */
  async processQueue() {
    if (this.isProcessingQueue) return;
    
    this.isProcessingQueue = true;
    
    try {
      while (this.operationQueue.length > 0) {
        const operation = this.operationQueue.shift();
        
        try {
          const result = await this.executeOperation(operation);
          this.emit('queueOperationCompleted', { operation, result });
        } catch (error) {
          operation.attempts++;
          
          if (operation.attempts < operation.maxAttempts) {
            this.operationQueue.unshift(operation);
          } else {
            this.emit('queueOperationFailed', { operation, error });
          }
        }
      }
    } finally {
      this.isProcessingQueue = false;
    }
  }

  /**
   * Setup event handlers
   */
  setupEventHandlers() {
    this.on('error', (error) => {
      console.error('Desktop Automation Service Error:', error);
    });
    
    this.on('healthCheckFailed', () => {
      if (this.state.connectionAttempts > this.state.maxConnectionAttempts) {
        console.warn('Max connection attempts exceeded, may need manual intervention');
      }
    });
  }

  /**
   * Utility functions
   */
  parseAllowedApps(allowedApps) {
    if (!allowedApps) return ['*'];
    if (typeof allowedApps === 'string') return allowedApps.split(',');
    if (Array.isArray(allowedApps)) return allowedApps;
    return ['*'];
  }

  isDangerousOperation(type, params) {
    const dangerousOps = ['file_operation'];
    if (!dangerousOps.includes(type)) return false;
    
    if (type === 'file_operation') {
      return ['delete', 'move', 'rename'].includes(params.operation);
    }
    
    return false;
  }

  generateSessionId() {
    return process.env.SPEK_SESSION_ID || `desktop-${crypto.randomUUID()}`;
  }

  async ensureEvidenceDirectory() {
    await fs.mkdir(this.config.evidenceDir, { recursive: true });
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  updateQueueStats(success, duration) {
    if (success) {
      this.queueStats.processed++;
    } else {
      this.queueStats.failed++;
    }
    
    const totalOps = this.queueStats.processed + this.queueStats.failed;
    this.queueStats.avgProcessingTime = 
      (this.queueStats.avgProcessingTime * (totalOps - 1) + duration) / totalOps;
  }

  async storeOperationEvidence(operation, result, duration) {
    const evidence = {
      timestamp: new Date().toISOString(),
      sessionId: this.state.sessionId,
      operation: {
        type: operation.type,
        params: operation.params
      },
      result,
      duration,
      success: true
    };
    
    const evidencePath = path.join(this.config.evidenceDir, 'operations.jsonl');
    await fs.appendFile(evidencePath, JSON.stringify(evidence) + '\n');
  }

  async logOperationError(operation, error, duration) {
    const errorLog = {
      timestamp: new Date().toISOString(),
      sessionId: this.state.sessionId,
      operation: {
        type: operation.type,
        params: operation.params
      },
      error: error.message,
      stack: error.stack,
      duration,
      success: false
    };
    
    const errorPath = path.join(this.config.evidenceDir, 'errors.jsonl');
    await fs.appendFile(errorPath, JSON.stringify(errorLog) + '\n');
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      initialized: this.state.isInitialized,
      healthy: this.state.isHealthy,
      sessionId: this.state.sessionId,
      lastHealthCheck: this.state.lastHealthCheck,
      activeOperations: this.state.activeOperations.size,
      queueSize: this.operationQueue.length,
      queueStats: this.queueStats,
      containers: Object.fromEntries(
        Object.entries(this.containers).map(([name, container]) => [
          name,
          {
            status: container.status,
            lastPing: container.lastPing,
            version: container.version
          }
        ])
      )
    };
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    console.log('Shutting down Desktop Automation Service...');
    
    // Wait for active operations to complete
    while (this.state.activeOperations.size > 0) {
      await this.delay(100);
    }
    
    // Process remaining queue
    if (this.operationQueue.length > 0) {
      console.log(`Processing ${this.operationQueue.length} remaining operations...`);
      await this.processQueue();
    }
    
    this.emit('shutdown');
    console.log('Desktop Automation Service shutdown complete');
  }
}

module.exports = DesktopAutomationService;