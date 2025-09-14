/**
 * WebSocket Client for Real-time Feature Flag Updates
 * Provides real-time synchronization of feature flag changes
 */

const WebSocket = require('ws');
const EventEmitter = require('events');

class FeatureFlagWebSocketClient extends EventEmitter {
    constructor(options = {}) {
        super();

        this.options = {
            url: options.url || 'ws://localhost:3001',
            reconnectInterval: options.reconnectInterval || 5000,
            maxReconnectAttempts: options.maxReconnectAttempts || 10,
            heartbeatInterval: options.heartbeatInterval || 30000,
            connectionTimeout: options.connectionTimeout || 10000,
            ...options
        };

        this.ws = null;
        this.reconnectAttempts = 0;
        this.isConnected = false;
        this.heartbeatTimer = null;
        this.reconnectTimer = null;

        // Local flag cache for offline support
        this.flagCache = new Map();
        this.lastUpdateTimestamp = null;

        this.setupEventHandlers();
    }

    /**
     * Connect to the WebSocket server
     */
    async connect() {
        return new Promise((resolve, reject) => {
            try {
                console.log(`Connecting to Feature Flag WebSocket server: ${this.options.url}`);

                this.ws = new WebSocket(this.options.url);

                const connectionTimeout = setTimeout(() => {
                    this.ws.close();
                    reject(new Error('Connection timeout'));
                }, this.options.connectionTimeout);

                this.ws.on('open', () => {
                    clearTimeout(connectionTimeout);
                    this.isConnected = true;
                    this.reconnectAttempts = 0;

                    console.log('Connected to Feature Flag WebSocket server');
                    this.startHeartbeat();
                    this.emit('connected');
                    resolve();
                });

                this.ws.on('message', (data) => {
                    try {
                        const message = JSON.parse(data.toString());
                        this.handleMessage(message);
                    } catch (error) {
                        console.error('Error parsing WebSocket message:', error);
                    }
                });

                this.ws.on('close', (code, reason) => {
                    this.handleDisconnection(code, reason);
                });

                this.ws.on('error', (error) => {
                    console.error('WebSocket error:', error);
                    this.emit('error', error);

                    if (!this.isConnected) {
                        clearTimeout(connectionTimeout);
                        reject(error);
                    }
                });

                this.ws.on('ping', () => {
                    this.ws.pong();
                });

            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Disconnect from the WebSocket server
     */
    disconnect() {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }

        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }

        if (this.ws) {
            this.ws.close(1000, 'Client disconnect');
        }

        this.isConnected = false;
        console.log('Disconnected from Feature Flag WebSocket server');
    }

    /**
     * Handle incoming WebSocket messages
     */
    handleMessage(message) {
        const { type, data, timestamp } = message;

        switch (type) {
            case 'initial_state':
                this.handleInitialState(data);
                break;

            case 'flag_updated':
                this.handleFlagUpdate(data);
                break;

            case 'flag_created':
                this.handleFlagCreated(data);
                break;

            case 'flag_toggled':
                this.handleFlagToggled(data);
                break;

            case 'flag_rolled_back':
                this.handleFlagRollback(data);
                break;

            case 'performance_metrics':
                this.handlePerformanceMetrics(data);
                break;

            case 'audit_event':
                this.handleAuditEvent(data);
                break;

            default:
                console.warn(`Unknown message type: ${type}`);
        }

        this.lastUpdateTimestamp = timestamp;
        this.emit('message', message);
    }

    /**
     * Handle initial state from server
     */
    handleInitialState(flags) {
        console.log(`Received initial state with ${flags.length} flags`);

        // Update local cache
        this.flagCache.clear();
        flags.forEach(flag => {
            this.flagCache.set(flag.key, flag);
        });

        this.emit('initialState', flags);
        this.emit('flagsUpdated', flags);
    }

    /**
     * Handle flag update
     */
    handleFlagUpdate(data) {
        const { key, flag } = data;
        const previousFlag = this.flagCache.get(key);

        this.flagCache.set(key, flag);

        console.log(`Flag updated: ${key}`);
        this.emit('flagUpdated', { key, flag, previousFlag });
        this.emit('flagsChanged');
    }

    /**
     * Handle new flag creation
     */
    handleFlagCreated(data) {
        const { key, flag } = data;

        this.flagCache.set(key, flag);

        console.log(`Flag created: ${key}`);
        this.emit('flagCreated', { key, flag });
        this.emit('flagsChanged');
    }

    /**
     * Handle flag toggle
     */
    handleFlagToggled(data) {
        const { key, flag, previousState, newState } = data;

        this.flagCache.set(key, flag);

        console.log(`Flag toggled: ${key} (${previousState} -> ${newState})`);
        this.emit('flagToggled', { key, flag, previousState, newState });
        this.emit('flagsChanged');
    }

    /**
     * Handle flag rollback
     */
    handleFlagRollback(data) {
        const { key, flag } = data;

        this.flagCache.set(key, flag);

        console.log(`Flag rolled back: ${key}`);
        this.emit('flagRolledBack', { key, flag });
        this.emit('flagsChanged');
    }

    /**
     * Handle performance metrics
     */
    handlePerformanceMetrics(metrics) {
        this.emit('performanceMetrics', metrics);
    }

    /**
     * Handle audit events
     */
    handleAuditEvent(auditEntry) {
        this.emit('auditEvent', auditEntry);
    }

    /**
     * Handle disconnection and attempt reconnection
     */
    handleDisconnection(code, reason) {
        this.isConnected = false;
        this.stopHeartbeat();

        console.log(`WebSocket connection closed: ${code} - ${reason}`);
        this.emit('disconnected', { code, reason });

        // Attempt reconnection if not a clean close
        if (code !== 1000 && this.reconnectAttempts < this.options.maxReconnectAttempts) {
            this.scheduleReconnection();
        }
    }

    /**
     * Schedule reconnection attempt
     */
    scheduleReconnection() {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
        }

        const delay = Math.min(
            this.options.reconnectInterval * Math.pow(2, this.reconnectAttempts),
            30000 // Max 30 seconds
        );

        this.reconnectAttempts++;

        console.log(`Scheduling reconnection attempt ${this.reconnectAttempts} in ${delay}ms`);

        this.reconnectTimer = setTimeout(() => {
            this.connect().catch(error => {
                console.error('Reconnection failed:', error);
                if (this.reconnectAttempts < this.options.maxReconnectAttempts) {
                    this.scheduleReconnection();
                } else {
                    console.error('Max reconnection attempts reached');
                    this.emit('reconnectionFailed');
                }
            });
        }, delay);
    }

    /**
     * Start heartbeat to keep connection alive
     */
    startHeartbeat() {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
        }

        this.heartbeatTimer = setInterval(() => {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.ws.ping();
            }
        }, this.options.heartbeatInterval);
    }

    /**
     * Stop heartbeat
     */
    stopHeartbeat() {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
    }

    /**
     * Get flag from local cache
     */
    getFlag(key) {
        return this.flagCache.get(key);
    }

    /**
     * Get all flags from local cache
     */
    getAllFlags() {
        return Array.from(this.flagCache.entries()).map(([key, flag]) => ({
            key,
            ...flag
        }));
    }

    /**
     * Check if flag exists in cache
     */
    hasFlag(key) {
        return this.flagCache.has(key);
    }

    /**
     * Evaluate flag locally (offline support)
     */
    evaluateFlag(key, context = {}) {
        const flag = this.flagCache.get(key);
        if (!flag) {
            return false;
        }

        // Basic local evaluation (simplified version)
        const environment = context.environment || process.env.NODE_ENV || 'development';

        // Environment-specific override
        if (flag.environments && flag.environments[environment] !== undefined) {
            return flag.environments[environment];
        }

        return flag.enabled;
    }

    /**
     * Get connection status
     */
    getConnectionStatus() {
        return {
            connected: this.isConnected,
            reconnectAttempts: this.reconnectAttempts,
            lastUpdateTimestamp: this.lastUpdateTimestamp,
            cachedFlagCount: this.flagCache.size
        };
    }

    /**
     * Setup default event handlers
     */
    setupEventHandlers() {
        this.on('error', (error) => {
            console.error('Feature Flag WebSocket Client Error:', error);
        });

        this.on('reconnectionFailed', () => {
            console.error('Failed to reconnect to Feature Flag WebSocket server after maximum attempts');
        });
    }
}

/**
 * Auto-reconnecting Feature Flag Client
 * Wrapper that automatically handles connection management
 */
class AutoReconnectingFeatureFlagClient extends FeatureFlagWebSocketClient {
    constructor(options = {}) {
        super(options);

        this.autoConnect = options.autoConnect !== false;
        this.retryOnFailure = options.retryOnFailure !== false;

        if (this.autoConnect) {
            this.connect().catch(error => {
                console.error('Initial connection failed:', error);
                if (this.retryOnFailure) {
                    this.scheduleReconnection();
                }
            });
        }
    }

    /**
     * Ensure connection is available
     */
    async ensureConnected() {
        if (this.isConnected) {
            return;
        }

        if (!this.reconnectTimer) {
            await this.connect();
        } else {
            // Wait for ongoing reconnection
            return new Promise((resolve) => {
                const checkConnection = () => {
                    if (this.isConnected) {
                        resolve();
                    } else {
                        setTimeout(checkConnection, 100);
                    }
                };
                checkConnection();
            });
        }
    }

    /**
     * Evaluate flag with fallback to cache
     */
    async evaluateFlagWithFallback(key, context = {}) {
        try {
            await this.ensureConnected();
            // If connected, could make API call for fresh evaluation
            return this.evaluateFlag(key, context);
        } catch (error) {
            console.warn('Using cached flag evaluation due to connection issue:', error.message);
            return this.evaluateFlag(key, context);
        }
    }
}

module.exports = {
    FeatureFlagWebSocketClient,
    AutoReconnectingFeatureFlagClient
};