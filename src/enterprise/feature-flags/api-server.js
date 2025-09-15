/**
 * Feature Flag API Server
 * RESTful API for feature flag management with real-time WebSocket updates
 */

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');

const FeatureFlagManager = require('./feature-flag-manager');

class FeatureFlagAPIServer {
    constructor(options = {}) {
        this.options = {
            port: options.port || 3000,
            wsPort: options.wsPort || 3001,
            configPath: options.configPath || path.join(__dirname, '../../../config/feature-flags.yaml'),
            enableRateLimit: options.enableRateLimit !== false,
            enableCors: options.enableCors !== false,
            enableSecurity: options.enableSecurity !== false,
            ...options
        };

        this.app = express();
        this.server = http.createServer(this.app);
        this.wss = new WebSocket.Server({ port: this.options.wsPort });
        this.clients = new Set();

        this.flagManager = new FeatureFlagManager(options.flagManager);

        this.setupMiddleware();
        this.setupRoutes();
        this.setupWebSocket();
        this.setupEventHandlers();
    }

    /**
     * Setup Express middleware
     */
    setupMiddleware() {
        // Security headers
        if (this.options.enableSecurity) {
            this.app.use(helmet());
        }

        // CORS
        if (this.options.enableCors) {
            this.app.use(cors({
                origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
                credentials: true
            }));
        }

        // Rate limiting
        if (this.options.enableRateLimit) {
            const limiter = rateLimit({
                windowMs: 15 * 60 * 1000, // 15 minutes
                max: 1000, // Limit each IP to 1000 requests per windowMs
                message: 'Too many requests from this IP'
            });
            this.app.use('/api/flags', limiter);
        }

        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true }));

        // Request logging
        this.app.use((req, res, next) => {
            const startTime = Date.now();
            res.on('finish', () => {
                const duration = Date.now() - startTime;
                console.log(`${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
            });
            next();
        });
    }

    /**
     * Setup API routes
     */
    setupRoutes() {
        const router = express.Router();

        // Health check
        router.get('/health', (req, res) => {
            const health = this.flagManager.healthCheck();
            res.status(health.healthy ? 200 : 503).json(health);
        });

        // Get all flags
        router.get('/flags', async (req, res) => {
            try {
                const flags = Array.from(this.flagManager.flags.entries()).map(([key, flag]) => ({
                    key,
                    ...flag
                }));
                res.json({
                    success: true,
                    data: flags,
                    count: flags.length
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // Get specific flag
        router.get('/flags/:key', async (req, res) => {
            try {
                const flag = this.flagManager.flags.get(req.params.key);
                if (!flag) {
                    return res.status(404).json({
                        success: false,
                        error: 'Flag not found'
                    });
                }

                res.json({
                    success: true,
                    data: { key: req.params.key, ...flag }
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // Evaluate flag
        router.post('/flags/:key/evaluate', async (req, res) => {
            try {
                const { context = {} } = req.body;
                const result = await this.flagManager.evaluate(req.params.key, context);

                res.json({
                    success: true,
                    data: {
                        flagKey: req.params.key,
                        result,
                        timestamp: new Date().toISOString()
                    }
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // Batch evaluate flags
        router.post('/flags/evaluate', async (req, res) => {
            try {
                const { flags, context = {} } = req.body;

                if (!Array.isArray(flags)) {
                    return res.status(400).json({
                        success: false,
                        error: 'flags must be an array'
                    });
                }

                const results = {};
                await Promise.all(flags.map(async (flagKey) => {
                    results[flagKey] = await this.flagManager.evaluate(flagKey, context);
                }));

                res.json({
                    success: true,
                    data: results,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // Create flag
        router.post('/flags', async (req, res) => {
            try {
                const { key, config } = req.body;

                if (!key || !config) {
                    return res.status(400).json({
                        success: false,
                        error: 'key and config are required'
                    });
                }

                const flag = await this.flagManager.registerFlag(key, config);
                this.broadcastFlagChange('flag_created', { key, flag });

                res.status(201).json({
                    success: true,
                    data: { key, ...flag }
                });
            } catch (error) {
                res.status(400).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // Update flag
        router.put('/flags/:key', async (req, res) => {
            try {
                const flag = await this.flagManager.updateFlag(req.params.key, req.body);
                this.broadcastFlagChange('flag_updated', { key: req.params.key, flag });

                res.json({
                    success: true,
                    data: { key: req.params.key, ...flag }
                });
            } catch (error) {
                res.status(error.message.includes('not found') ? 404 : 400).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // Toggle flag
        router.patch('/flags/:key/toggle', async (req, res) => {
            try {
                const flag = this.flagManager.flags.get(req.params.key);
                if (!flag) {
                    return res.status(404).json({
                        success: false,
                        error: 'Flag not found'
                    });
                }

                const updatedFlag = await this.flagManager.updateFlag(req.params.key, {
                    enabled: !flag.enabled
                });

                this.broadcastFlagChange('flag_toggled', {
                    key: req.params.key,
                    flag: updatedFlag,
                    previousState: flag.enabled,
                    newState: updatedFlag.enabled
                });

                res.json({
                    success: true,
                    data: { key: req.params.key, ...updatedFlag }
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // Rollback flag
        router.post('/flags/:key/rollback', async (req, res) => {
            try {
                const flag = await this.flagManager.rollback(req.params.key);
                this.broadcastFlagChange('flag_rolled_back', { key: req.params.key, flag });

                res.json({
                    success: true,
                    data: { key: req.params.key, ...flag }
                });
            } catch (error) {
                res.status(error.message.includes('not found') ? 404 : 400).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // Get statistics
        router.get('/statistics', (req, res) => {
            try {
                const stats = this.flagManager.getStatistics();
                res.json({
                    success: true,
                    data: stats
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // Get audit log
        router.get('/audit', (req, res) => {
            try {
                const filters = {
                    category: req.query.category,
                    flagKey: req.query.flagKey,
                    since: req.query.since,
                    limit: parseInt(req.query.limit) || 100
                };

                const auditLog = this.flagManager.getAuditLog(filters);
                res.json({
                    success: true,
                    data: auditLog,
                    count: auditLog.length
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // Export flags
        router.get('/export', (req, res) => {
            try {
                const exportData = this.flagManager.exportFlags();
                res.json({
                    success: true,
                    data: exportData
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // Import flags
        router.post('/import', async (req, res) => {
            try {
                await this.flagManager.importFlags(req.body);
                res.json({
                    success: true,
                    message: 'Flags imported successfully'
                });
            } catch (error) {
                res.status(400).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // Reload configuration
        router.post('/reload', async (req, res) => {
            try {
                await this.loadConfiguration();
                res.json({
                    success: true,
                    message: 'Configuration reloaded successfully'
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        this.app.use('/api', router);
    }

    /**
     * Setup WebSocket server for real-time updates
     */
    setupWebSocket() {
        this.wss.on('connection', (ws, req) => {
            console.log(`WebSocket client connected from ${req.socket.remoteAddress}`);
            this.clients.add(ws);

            // Send initial flag state
            const flags = Array.from(this.flagManager.flags.entries()).map(([key, flag]) => ({
                key,
                ...flag
            }));

            ws.send(JSON.stringify({
                type: 'initial_state',
                data: flags,
                timestamp: new Date().toISOString()
            }));

            ws.on('close', () => {
                this.clients.delete(ws);
                console.log('WebSocket client disconnected');
            });

            ws.on('error', (error) => {
                console.error('WebSocket error:', error);
                this.clients.delete(ws);
            });

            // Handle ping/pong for connection health
            ws.on('ping', () => {
                ws.pong();
            });

            // Send periodic heartbeat
            const heartbeat = setInterval(() => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.ping();
                } else {
                    clearInterval(heartbeat);
                }
            }, 30000);
        });

        console.log(`WebSocket server listening on port ${this.options.wsPort}`);
    }

    /**
     * Setup event handlers for flag manager
     */
    setupEventHandlers() {
        this.flagManager.on('flagUpdated', (event) => {
            this.broadcastFlagChange('flag_updated', event);
        });

        this.flagManager.on('performanceMetrics', (metrics) => {
            this.broadcastMessage('performance_metrics', metrics);
        });

        this.flagManager.on('audit', (auditEntry) => {
            this.broadcastMessage('audit_event', auditEntry);
        });
    }

    /**
     * Broadcast flag changes to all WebSocket clients
     */
    broadcastFlagChange(type, data) {
        const message = JSON.stringify({
            type,
            data,
            timestamp: new Date().toISOString()
        });

        this.clients.forEach(ws => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(message);
            }
        });
    }

    /**
     * Broadcast general message to all WebSocket clients
     */
    broadcastMessage(type, data) {
        const message = JSON.stringify({
            type,
            data,
            timestamp: new Date().toISOString()
        });

        this.clients.forEach(ws => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(message);
            }
        });
    }

    /**
     * Load configuration from YAML file
     */
    async loadConfiguration() {
        try {
            if (!fs.existsSync(this.options.configPath)) {
                console.warn(`Configuration file not found: ${this.options.configPath}`);
                return;
            }

            const configContent = fs.readFileSync(this.options.configPath, 'utf8');
            const config = yaml.load(configContent);

            // Flatten configuration by environment
            const environment = process.env.NODE_ENV || 'development';
            const flagConfig = {};

            // Merge global config with environment-specific flags
            Object.keys(config).forEach(section => {
                if (section === 'global') return;

                Object.keys(config[section]).forEach(flagKey => {
                    const flag = config[section][flagKey];
                    flagConfig[`${section}_${flagKey}`] = flag;
                });
            });

            await this.flagManager.initialize(flagConfig);
            console.log(`Loaded ${Object.keys(flagConfig).length} feature flags for environment: ${environment}`);

        } catch (error) {
            console.error('Failed to load configuration:', error);
            throw error;
        }
    }

    /**
     * Start the API server
     */
    async start() {
        try {
            // Load initial configuration
            await this.loadConfiguration();

            // Start HTTP server
            this.server.listen(this.options.port, () => {
                console.log(`Feature Flag API server listening on port ${this.options.port}`);
            });

            // Setup graceful shutdown
            process.on('SIGTERM', () => {
                console.log('Received SIGTERM, shutting down gracefully');
                this.shutdown();
            });

            process.on('SIGINT', () => {
                console.log('Received SIGINT, shutting down gracefully');
                this.shutdown();
            });

        } catch (error) {
            console.error('Failed to start server:', error);
            throw error;
        }
    }

    /**
     * Graceful shutdown
     */
    shutdown() {
        console.log('Shutting down Feature Flag API server...');

        // Close WebSocket connections
        this.clients.forEach(ws => {
            ws.close();
        });
        this.wss.close();

        // Close HTTP server
        this.server.close(() => {
            console.log('Server shut down complete');
            // Don't call process.exit in tests
            if (process.env.NODE_ENV !== 'test') {
                process.exit(0);
            }
        });

        // Force shutdown after 10 seconds (only in production)
        if (process.env.NODE_ENV !== 'test') {
            setTimeout(() => {
                console.error('Forced shutdown after timeout');
                process.exit(1);
            }, 10000);
        }
    }
}

module.exports = FeatureFlagAPIServer;