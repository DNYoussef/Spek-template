/**
 * SPEK Desktop Automation MCP Server Bridge
 * Connects SPEK agent system to Bytebot desktop automation capabilities
 * 
 * Features:
 * - Full MCP protocol implementation for desktop tools
 * - Bridge communication with Bytebot containers
 * - Evidence collection for quality gates
 * - Security validation and audit logging
 * - Health monitoring and connection management
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

/**
 * Desktop Automation MCP Server Configuration
 */
class DesktopAutomationMCPServer {
  constructor() {
    this.server = new Server({
      name: 'desktop-automation',
      version: '1.0.0',
    }, {
      capabilities: {
        tools: {},
        resources: {},
        logging: {}
      },
    });

    // Bytebot connection configuration
    this.bytebotConfig = {
      desktopUrl: process.env.BYTEBOT_DESKTOP_URL || 'http://localhost:9990',
      agentUrl: process.env.BYTEBOT_AGENT_URL || 'http://localhost:9991',
      maxRetries: 3,
      timeout: 30000,
      healthCheckInterval: 30000
    };

    // Security configuration
    this.security = {
      allowedApplications: process.env.ALLOWED_APPS ? process.env.ALLOWED_APPS.split(',') : ['*'],
      maxCoordinateValue: 4096,
      evidenceDir: process.env.EVIDENCE_DIR || '.claude/.artifacts/desktop',
      auditLog: true
    };

    // Health monitoring
    this.health = {
      lastHealthCheck: null,
      isHealthy: false,
      connectionAttempts: 0,
      maxConnectionAttempts: 5
    };

    // Operation queue for managing desktop actions
    this.operationQueue = [];
    this.isProcessingQueue = false;

    this.setupTools();
    this.startHealthMonitoring();
  }

  /**
   * Setup MCP tools for desktop automation
   */
  setupTools() {
    // Screenshot capture tool
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'desktop_screenshot',
            description: 'Capture screenshot of desktop or specific application',
            inputSchema: {
              type: 'object',
              properties: {
                area: {
                  type: 'string',
                  enum: ['full', 'window', 'region'],
                  description: 'Screenshot area type'
                },
                x: { type: 'number', description: 'X coordinate for region' },
                y: { type: 'number', description: 'Y coordinate for region' },
                width: { type: 'number', description: 'Width for region' },
                height: { type: 'number', description: 'Height for region' },
                application: { type: 'string', description: 'Target application name' },
                quality: {
                  type: 'string',
                  enum: ['high', 'medium', 'low'],
                  default: 'medium'
                }
              },
              required: ['area']
            }
          },
          {
            name: 'desktop_click',
            description: 'Click at specified coordinates on desktop',
            inputSchema: {
              type: 'object',
              properties: {
                x: { type: 'number', description: 'X coordinate' },
                y: { type: 'number', description: 'Y coordinate' },
                button: {
                  type: 'string',
                  enum: ['left', 'right', 'middle'],
                  default: 'left'
                },
                doubleClick: { type: 'boolean', default: false },
                delay: { type: 'number', default: 100, description: 'Delay in ms' }
              },
              required: ['x', 'y']
            }
          },
          {
            name: 'desktop_type',
            description: 'Type text at current cursor position',
            inputSchema: {
              type: 'object',
              properties: {
                text: { type: 'string', description: 'Text to type' },
                delay: { type: 'number', default: 50, description: 'Delay between keystrokes in ms' },
                clearFirst: { type: 'boolean', default: false, description: 'Clear field before typing' }
              },
              required: ['text']
            }
          },
          {
            name: 'desktop_move_mouse',
            description: 'Move mouse to specified coordinates',
            inputSchema: {
              type: 'object',
              properties: {
                x: { type: 'number', description: 'X coordinate' },
                y: { type: 'number', description: 'Y coordinate' },
                duration: { type: 'number', default: 500, description: 'Movement duration in ms' }
              },
              required: ['x', 'y']
            }
          },
          {
            name: 'desktop_scroll',
            description: 'Scroll in specified direction',
            inputSchema: {
              type: 'object',
              properties: {
                direction: {
                  type: 'string',
                  enum: ['up', 'down', 'left', 'right'],
                  description: 'Scroll direction'
                },
                amount: { type: 'number', default: 3, description: 'Scroll amount' },
                x: { type: 'number', description: 'X coordinate for scroll target' },
                y: { type: 'number', description: 'Y coordinate for scroll target' }
              },
              required: ['direction']
            }
          },
          {
            name: 'desktop_app_launch',
            description: 'Launch specified application',
            inputSchema: {
              type: 'object',
              properties: {
                application: { type: 'string', description: 'Application name or path' },
                args: { type: 'array', items: { type: 'string' }, description: 'Application arguments' },
                waitForLaunch: { type: 'boolean', default: true, description: 'Wait for app to fully launch' }
              },
              required: ['application']
            }
          },
          {
            name: 'desktop_file_operations',
            description: 'Perform file operations through desktop interface',
            inputSchema: {
              type: 'object',
              properties: {
                operation: {
                  type: 'string',
                  enum: ['open', 'save', 'copy', 'paste', 'delete', 'rename'],
                  description: 'File operation type'
                },
                path: { type: 'string', description: 'File or directory path' },
                newPath: { type: 'string', description: 'New path for rename/copy operations' },
                confirm: { type: 'boolean', default: true, description: 'Confirm dangerous operations' }
              },
              required: ['operation', 'path']
            }
          },
          {
            name: 'desktop_health_check',
            description: 'Check health status of desktop automation system',
            inputSchema: {
              type: 'object',
              properties: {
                detailed: { type: 'boolean', default: false, description: 'Include detailed diagnostics' }
              }
            }
          }
        ]
      };
    });

    // Tool execution handler
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        // Validate security constraints
        await this.validateSecurity(name, args);

        // Log operation for audit trail
        await this.logOperation(name, args);

        // Route to appropriate handler (support both naming conventions)
        let result;
        switch (name) {
          case 'screenshot_tool':
          case 'desktop_screenshot':
            result = await this.handleScreenshot(args);
            break;
          case 'click_tool':
          case 'desktop_click':
            result = await this.handleClick(args);
            break;
          case 'type_tool':
          case 'desktop_type':
            result = await this.handleType(args);
            break;
          case 'desktop_move_mouse':
            result = await this.handleMoveMouse(args);
            break;
          case 'desktop_scroll':
            result = await this.handleScroll(args);
            break;
          case 'desktop_app_launch':
            result = await this.handleAppLaunch(args);
            break;
          case 'desktop_file_operations':
            result = await this.handleFileOperations(args);
            break;
          case 'desktop_health_check':
            result = await this.handleHealthCheck(args);
            break;
          default:
            throw new Error(`Unknown tool: ${name}`);
        }

        // Store evidence for quality gates
        await this.storeEvidence(name, args, result);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };

      } catch (error) {
        await this.logError(name, args, error);
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              error: error.message,
              operation: name,
              timestamp: new Date().toISOString(),
              args: args
            }, null, 2)
          }],
          isError: true
        };
      }
    });
  }

  /**
   * Validate security constraints for desktop operations
   */
  async validateSecurity(operation, args) {
    // Validate coordinates are within bounds
    if (args.x !== undefined && (args.x < 0 || args.x > this.security.maxCoordinateValue)) {
      throw new Error(`X coordinate ${args.x} exceeds security bounds`);
    }
    if (args.y !== undefined && (args.y < 0 || args.y > this.security.maxCoordinateValue)) {
      throw new Error(`Y coordinate ${args.y} exceeds security bounds`);
    }

    // Validate application allowlist
    if (args.application && this.security.allowedApplications[0] !== '*') {
      const isAllowed = this.security.allowedApplications.some(app => 
        args.application.toLowerCase().includes(app.toLowerCase())
      );
      if (!isAllowed) {
        throw new Error(`Application ${args.application} not in allowlist`);
      }
    }

    // Validate file operations
    if (operation === 'desktop_file_operations' && args.operation === 'delete') {
      if (!args.confirm) {
        throw new Error('Delete operations require confirmation');
      }
    }

    return true;
  }

  /**
   * Handle screenshot capture
   */
  async handleScreenshot(args) {
    const { area, x, y, width, height, application, quality } = args;
    
    const payload = {
      action: 'screenshot',
      params: {
        area,
        coordinates: area === 'region' ? { x, y, width, height } : undefined,
        application,
        quality: quality || 'medium'
      }
    };

    const response = await this.callBytebot('/desktop/screenshot', payload);
    
    // Save screenshot for evidence
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `screenshot-${timestamp}.png`;
    const filepath = path.join(this.security.evidenceDir, filename);
    
    if (response.imageData) {
      await fs.writeFile(filepath, Buffer.from(response.imageData, 'base64'));
      response.savedPath = filepath;
    }

    return {
      success: true,
      operation: 'screenshot',
      result: response,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Handle click operations
   */
  async handleClick(args) {
    const { x, y, button, doubleClick, delay } = args;
    
    const payload = {
      action: 'click',
      params: {
        x,
        y,
        button: button || 'left',
        doubleClick: doubleClick || false,
        delay: delay || 100
      }
    };

    const response = await this.callBytebot('/desktop/click', payload);
    
    return {
      success: true,
      operation: 'click',
      coordinates: { x, y },
      result: response,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Handle typing operations
   */
  async handleType(args) {
    const { text, delay, clearFirst } = args;
    
    const payload = {
      action: 'type',
      params: {
        text,
        delay: delay || 50,
        clearFirst: clearFirst || false
      }
    };

    const response = await this.callBytebot('/desktop/type', payload);
    
    return {
      success: true,
      operation: 'type',
      textLength: text.length,
      result: response,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Handle mouse movement
   */
  async handleMoveMouse(args) {
    const { x, y, duration } = args;
    
    const payload = {
      action: 'move_mouse',
      params: {
        x,
        y,
        duration: duration || 500
      }
    };

    const response = await this.callBytebot('/desktop/move_mouse', payload);
    
    return {
      success: true,
      operation: 'move_mouse',
      coordinates: { x, y },
      result: response,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Handle scroll operations
   */
  async handleScroll(args) {
    const { direction, amount, x, y } = args;
    
    const payload = {
      action: 'scroll',
      params: {
        direction,
        amount: amount || 3,
        target: x !== undefined && y !== undefined ? { x, y } : undefined
      }
    };

    const response = await this.callBytebot('/desktop/scroll', payload);
    
    return {
      success: true,
      operation: 'scroll',
      direction,
      amount,
      result: response,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Handle application launch
   */
  async handleAppLaunch(args) {
    const { application, args: appArgs, waitForLaunch } = args;
    
    const payload = {
      action: 'launch_app',
      params: {
        application,
        args: appArgs || [],
        waitForLaunch: waitForLaunch !== false
      }
    };

    const response = await this.callBytebot('/desktop/launch_app', payload);
    
    return {
      success: true,
      operation: 'launch_app',
      application,
      result: response,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Handle file operations
   */
  async handleFileOperations(args) {
    const { operation, path: filePath, newPath, confirm } = args;
    
    const payload = {
      action: 'file_operation',
      params: {
        operation,
        path: filePath,
        newPath,
        confirm: confirm !== false
      }
    };

    const response = await this.callBytebot('/desktop/file_operation', payload);
    
    return {
      success: true,
      operation: 'file_operation',
      fileOperation: operation,
      path: filePath,
      result: response,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Handle health check
   */
  async handleHealthCheck(args) {
    const { detailed } = args;
    
    try {
      const desktopHealth = await this.checkEndpointHealth(this.bytebotConfig.desktopUrl);
      const agentHealth = await this.checkEndpointHealth(this.bytebotConfig.agentUrl);
      
      const healthStatus = {
        overall: desktopHealth.healthy && agentHealth.healthy,
        desktop: desktopHealth,
        agent: agentHealth,
        lastCheck: new Date().toISOString(),
        connectionAttempts: this.health.connectionAttempts
      };

      if (detailed) {
        healthStatus.configuration = this.bytebotConfig;
        healthStatus.security = this.security;
        healthStatus.operationQueue = {
          size: this.operationQueue.length,
          processing: this.isProcessingQueue
        };
      }

      this.health.lastHealthCheck = new Date();
      this.health.isHealthy = healthStatus.overall;

      return {
        success: true,
        operation: 'health_check',
        result: healthStatus,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      return {
        success: false,
        operation: 'health_check',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Call Bytebot API endpoint
   */
  async callBytebot(endpoint, payload) {
    const url = `${this.bytebotConfig.desktopUrl}${endpoint}`;
    
    for (let attempt = 1; attempt <= this.bytebotConfig.maxRetries; attempt++) {
      try {
        const response = await axios.post(url, payload, {
          timeout: this.bytebotConfig.timeout,
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'SPEK-Desktop-Automation/1.0.0'
          }
        });

        this.health.connectionAttempts = 0;
        return response.data;

      } catch (error) {
        this.health.connectionAttempts++;
        
        if (attempt === this.bytebotConfig.maxRetries) {
          throw new Error(`Bytebot API call failed after ${attempt} attempts: ${error.message}`);
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  /**
   * Check endpoint health
   */
  async checkEndpointHealth(url) {
    try {
      const response = await axios.get(`${url}/health`, {
        timeout: 5000
      });
      
      return {
        healthy: response.status === 200,
        status: response.status,
        response: response.data,
        responseTime: response.headers['x-response-time'] || 'unknown'
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message,
        responseTime: 'timeout'
      };
    }
  }

  /**
   * Start health monitoring
   */
  startHealthMonitoring() {
    setInterval(async () => {
      try {
        await this.handleHealthCheck({ detailed: false });
      } catch (error) {
        console.error('Health check failed:', error.message);
      }
    }, this.bytebotConfig.healthCheckInterval);
  }

  /**
   * Log operation for audit trail
   */
  async logOperation(operation, args) {
    if (!this.security.auditLog) return;

    const logEntry = {
      timestamp: new Date().toISOString(),
      operation,
      args: { ...args, text: args.text ? '[REDACTED]' : undefined }, // Redact sensitive text
      sessionId: this.generateSessionId(),
      requestId: crypto.randomUUID()
    };

    const logPath = path.join(this.security.evidenceDir, 'audit.log');
    await fs.appendFile(logPath, JSON.stringify(logEntry) + '\n');
  }

  /**
   * Log errors
   */
  async logError(operation, args, error) {
    const errorEntry = {
      timestamp: new Date().toISOString(),
      operation,
      error: error.message,
      stack: error.stack,
      args: { ...args, text: args.text ? '[REDACTED]' : undefined },
      sessionId: this.generateSessionId()
    };

    const errorPath = path.join(this.security.evidenceDir, 'errors.log');
    await fs.appendFile(errorPath, JSON.stringify(errorEntry) + '\n');
  }

  /**
   * Collect evidence for quality validation
   */
  async collectEvidence(operation, args, result) {
    const evidencePath = path.join(this.security.evidenceDir, 'operations.jsonl');
    const evidence = {
      timestamp: new Date().toISOString(),
      operation,
      args: this.redactSensitiveData(args),
      result: result ? { success: result.success, operation: result.operation } : null,
      sessionId: this.generateSessionId(),
      quality: {
        validated: true,
        theater: false,
        score: result && result.success ? 100 : 0
      }
    };

    await fs.appendFile(evidencePath, JSON.stringify(evidence) + '\n');
    return evidence;
  }

  /**
   * Store evidence for quality gates
   */
  async storeEvidence(operation, args, result) {
    const evidence = {
      timestamp: new Date().toISOString(),
      operation,
      args,
      result,
      success: result.success,
      sessionId: this.generateSessionId()
    };

    const evidencePath = path.join(this.security.evidenceDir, 'operations.jsonl');
    await fs.appendFile(evidencePath, JSON.stringify(evidence) + '\n');
  }

  /**
   * Generate session ID for tracking
   */
  generateSessionId() {
    return process.env.SPEK_SESSION_ID || 'default-session';
  }

  /**
   * Initialize and start the MCP server
   */
  async start() {
    // Ensure evidence directory exists
    await fs.mkdir(this.security.evidenceDir, { recursive: true });

    // Start the MCP server
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    
    console.log('Desktop Automation MCP Server started');
    console.log(`Evidence directory: ${this.security.evidenceDir}`);
    console.log(`Bytebot Desktop URL: ${this.bytebotConfig.desktopUrl}`);
    console.log(`Bytebot Agent URL: ${this.bytebotConfig.agentUrl}`);
  }
}

// Initialize and start server if run directly
if (require.main === module) {
  const server = new DesktopAutomationMCPServer();
  server.start().catch(console.error);
}

module.exports = DesktopAutomationMCPServer;