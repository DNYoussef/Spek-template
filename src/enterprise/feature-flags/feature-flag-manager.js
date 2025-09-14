/**
 * Enterprise Feature Flag Manager
 * Provides zero-downtime feature toggles with real-time updates,
 * environment-specific configurations, and comprehensive audit logging.
 */

const EventEmitter = require('events');
const crypto = require('crypto');

class FeatureFlagManager extends EventEmitter {
    constructor(options = {}) {
        super();

        this.flags = new Map();
        this.cache = new Map();
        this.auditLog = [];
        this.circuitBreakers = new Map();
        this.rolloutStrategies = new Map();
        this.performanceMetrics = new Map();

        this.config = {
            environment: options.environment || process.env.NODE_ENV || 'development',
            cacheTimeout: options.cacheTimeout || 5000, // 5 seconds
            maxAuditEntries: options.maxAuditEntries || 10000,
            circuitBreakerThreshold: options.circuitBreakerThreshold || 0.95,
            evaluationTimeout: options.evaluationTimeout || 100, // 100ms target
            ...options
        };

        this.startTime = Date.now();
        this.evaluationCount = 0;
        this.setupPerformanceTracking();
    }

    /**
     * Initialize feature flags from configuration
     * @param {Object} flagConfig - Flag configuration object
     */
    async initialize(flagConfig) {
        try {
            const startTime = Date.now();

            for (const [flagKey, config] of Object.entries(flagConfig)) {
                await this.registerFlag(flagKey, config);
            }

            const initTime = Date.now() - startTime;
            this.logAudit('SYSTEM', 'FLAGS_INITIALIZED', {
                count: Object.keys(flagConfig).length,
                initTime,
                environment: this.config.environment
            });

            this.emit('initialized', { flagCount: this.flags.size, initTime });

        } catch (error) {
            this.logAudit('SYSTEM', 'INITIALIZATION_FAILED', { error: error.message });
            throw new Error(`Feature flag initialization failed: ${error.message}`);
        }
    }

    /**
     * Register a new feature flag
     * @param {string} flagKey - Unique flag identifier
     * @param {Object} config - Flag configuration
     */
    async registerFlag(flagKey, config) {
        const flagId = this.generateFlagId(flagKey);

        const flag = {
            id: flagId,
            key: flagKey,
            enabled: config.enabled || false,
            environments: config.environments || {},
            rolloutStrategy: config.rolloutStrategy || 'boolean',
            rolloutPercentage: config.rolloutPercentage || 0,
            conditions: config.conditions || [],
            variants: config.variants || [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            version: 1,
            metadata: config.metadata || {}
        };

        this.flags.set(flagKey, flag);
        this.setupCircuitBreaker(flagKey);
        this.logAudit('SYSTEM', 'FLAG_REGISTERED', { flagKey, config });

        return flag;
    }

    /**
     * Evaluate feature flag with high performance (<100ms)
     * @param {string} flagKey - Flag key to evaluate
     * @param {Object} context - Evaluation context (user, environment, etc.)
     * @returns {Promise<boolean|Object>} Flag evaluation result
     */
    async evaluate(flagKey, context = {}) {
        const startTime = process.hrtime.bigint();
        this.evaluationCount++;

        try {
            // Check cache first
            const cacheKey = this.getCacheKey(flagKey, context);
            if (this.cache.has(cacheKey)) {
                const cached = this.cache.get(cacheKey);
                if (Date.now() - cached.timestamp < this.config.cacheTimeout) {
                    this.recordEvaluationTime(startTime);
                    return cached.result;
                }
            }

            const flag = this.flags.get(flagKey);
            if (!flag) {
                this.recordEvaluationTime(startTime);
                return false;
            }

            // Check circuit breaker
            if (this.isCircuitBreakerOpen(flagKey)) {
                this.recordEvaluationTime(startTime);
                return false;
            }

            const result = await this.performEvaluation(flag, context);

            // Cache result
            this.cache.set(cacheKey, {
                result,
                timestamp: Date.now()
            });

            this.recordEvaluationTime(startTime);
            this.logAudit('EVALUATION', 'FLAG_EVALUATED', {
                flagKey,
                result,
                context: this.sanitizeContext(context)
            });

            return result;

        } catch (error) {
            this.recordCircuitBreakerFailure(flagKey);
            this.recordEvaluationTime(startTime);
            this.logAudit('ERROR', 'EVALUATION_FAILED', {
                flagKey,
                error: error.message,
                context: this.sanitizeContext(context)
            });

            // Return safe default
            return false;
        }
    }

    /**
     * Perform the actual flag evaluation logic
     * @private
     */
    async performEvaluation(flag, context) {
        const environment = context.environment || this.config.environment;

        // Environment-specific override
        if (flag.environments[environment] !== undefined) {
            flag.enabled = flag.environments[environment];
        }

        if (!flag.enabled) {
            return false;
        }

        // Apply conditions
        for (const condition of flag.conditions) {
            if (!this.evaluateCondition(condition, context)) {
                return false;
            }
        }

        // Apply rollout strategy
        switch (flag.rolloutStrategy) {
            case 'boolean':
                return flag.enabled;

            case 'percentage':
                return this.evaluatePercentageRollout(flag, context);

            case 'user':
                return this.evaluateUserRollout(flag, context);

            case 'variant':
                return this.evaluateVariantRollout(flag, context);

            default:
                return flag.enabled;
        }
    }

    /**
     * Update flag configuration with zero downtime
     * @param {string} flagKey - Flag to update
     * @param {Object} updates - Updates to apply
     */
    async updateFlag(flagKey, updates) {
        const flag = this.flags.get(flagKey);
        if (!flag) {
            throw new Error(`Flag ${flagKey} not found`);
        }

        const oldConfig = { ...flag };

        // Apply updates
        Object.assign(flag, updates, {
            updatedAt: new Date().toISOString(),
            version: flag.version + 1
        });

        // Clear cache for this flag
        this.clearFlagCache(flagKey);

        this.logAudit('UPDATE', 'FLAG_UPDATED', {
            flagKey,
            oldConfig: this.sanitizeConfig(oldConfig),
            newConfig: this.sanitizeConfig(flag),
            updates
        });

        this.emit('flagUpdated', { flagKey, oldConfig, newConfig: flag });

        return flag;
    }

    /**
     * Implement gradual rollout with percentage-based targeting
     * @private
     */
    evaluatePercentageRollout(flag, context) {
        const userId = context.userId || context.sessionId || 'anonymous';
        const hash = crypto.createHash('sha256')
            .update(`${flag.key}-${userId}`)
            .digest('hex');

        const percentage = parseInt(hash.substring(0, 8), 16) % 100;
        return percentage < flag.rolloutPercentage;
    }

    /**
     * Implement user-based rollout
     * @private
     */
    evaluateUserRollout(flag, context) {
        const userList = flag.metadata.userList || [];
        const userId = context.userId;

        if (!userId) return false;
        return userList.includes(userId);
    }

    /**
     * Implement variant-based A/B testing
     * @private
     */
    evaluateVariantRollout(flag, context) {
        if (!flag.variants || flag.variants.length === 0) {
            return flag.enabled;
        }

        const userId = context.userId || context.sessionId || 'anonymous';
        const hash = crypto.createHash('sha256')
            .update(`${flag.key}-variant-${userId}`)
            .digest('hex');

        const variantIndex = parseInt(hash.substring(0, 8), 16) % flag.variants.length;
        const selectedVariant = flag.variants[variantIndex];

        return {
            enabled: true,
            variant: selectedVariant.key,
            value: selectedVariant.value
        };
    }

    /**
     * Evaluate condition against context
     * @private
     */
    evaluateCondition(condition, context) {
        const { field, operator, value } = condition;
        const contextValue = context[field];

        switch (operator) {
            case 'equals':
                return contextValue === value;
            case 'not_equals':
                return contextValue !== value;
            case 'in':
                return Array.isArray(value) && value.includes(contextValue);
            case 'not_in':
                return Array.isArray(value) && !value.includes(contextValue);
            case 'greater_than':
                return contextValue > value;
            case 'less_than':
                return contextValue < value;
            case 'regex':
                return new RegExp(value).test(contextValue);
            default:
                return true;
        }
    }

    /**
     * Circuit breaker implementation
     * @private
     */
    setupCircuitBreaker(flagKey) {
        this.circuitBreakers.set(flagKey, {
            failures: 0,
            successCount: 0,
            lastFailureTime: null,
            isOpen: false,
            halfOpenAt: null
        });
    }

    /**
     * Check if circuit breaker is open
     * @private
     */
    isCircuitBreakerOpen(flagKey) {
        const breaker = this.circuitBreakers.get(flagKey);
        if (!breaker || !breaker.isOpen) return false;

        // Check if we should try half-open
        if (breaker.halfOpenAt && Date.now() > breaker.halfOpenAt) {
            breaker.isOpen = false;
            breaker.halfOpenAt = null;
            return false;
        }

        return breaker.isOpen;
    }

    /**
     * Record circuit breaker failure
     * @private
     */
    recordCircuitBreakerFailure(flagKey) {
        const breaker = this.circuitBreakers.get(flagKey);
        if (!breaker) return;

        breaker.failures++;
        breaker.lastFailureTime = Date.now();

        const totalRequests = breaker.failures + breaker.successCount;
        const failureRate = breaker.failures / totalRequests;

        if (failureRate > this.config.circuitBreakerThreshold && totalRequests > 10) {
            breaker.isOpen = true;
            breaker.halfOpenAt = Date.now() + 30000; // Try again in 30 seconds

            this.logAudit('CIRCUIT_BREAKER', 'OPENED', {
                flagKey,
                failureRate,
                totalRequests
            });
        }
    }

    /**
     * Performance tracking and metrics
     * @private
     */
    setupPerformanceTracking() {
        this.performanceMetrics.set('evaluations', []);
        this.performanceMetrics.set('cacheHits', 0);
        this.performanceMetrics.set('cacheMisses', 0);

        // Performance monitoring interval
        setInterval(() => {
            this.reportPerformanceMetrics();
        }, 60000); // Every minute
    }

    /**
     * Record evaluation time
     * @private
     */
    recordEvaluationTime(startTime) {
        const endTime = process.hrtime.bigint();
        const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds

        const evaluations = this.performanceMetrics.get('evaluations');
        evaluations.push({ timestamp: Date.now(), duration });

        // Keep only last 1000 evaluations
        if (evaluations.length > 1000) {
            evaluations.shift();
        }
    }

    /**
     * Report performance metrics
     * @private
     */
    reportPerformanceMetrics() {
        const evaluations = this.performanceMetrics.get('evaluations');
        if (evaluations.length === 0) return;

        const durations = evaluations.map(e => e.duration);
        const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
        const maxDuration = Math.max(...durations);
        const p95Duration = durations.sort((a, b) => a - b)[Math.floor(durations.length * 0.95)];

        const uptime = Date.now() - this.startTime;
        const availability = this.evaluationCount > 0 ?
            ((this.evaluationCount - this.getFailureCount()) / this.evaluationCount) * 100 : 100;

        const metrics = {
            timestamp: new Date().toISOString(),
            uptime,
            evaluationCount: this.evaluationCount,
            averageEvaluationTime: avgDuration,
            maxEvaluationTime: maxDuration,
            p95EvaluationTime: p95Duration,
            availability,
            flagCount: this.flags.size,
            cacheSize: this.cache.size,
            auditLogSize: this.auditLog.length
        };

        this.emit('performanceMetrics', metrics);
        this.logAudit('METRICS', 'PERFORMANCE_REPORT', metrics);
    }

    /**
     * Rollback flag to previous version
     * @param {string} flagKey - Flag to rollback
     */
    async rollback(flagKey) {
        const flag = this.flags.get(flagKey);
        if (!flag) {
            throw new Error(`Flag ${flagKey} not found`);
        }

        // Find previous version in audit log
        const previousVersionEntry = this.auditLog
            .filter(entry => entry.data.flagKey === flagKey && entry.action === 'FLAG_UPDATED')
            .reverse()
            .find(entry => entry.data.oldConfig);

        if (!previousVersionEntry) {
            throw new Error(`No previous version found for flag ${flagKey}`);
        }

        const rollbackConfig = previousVersionEntry.data.oldConfig;
        await this.updateFlag(flagKey, rollbackConfig);

        this.logAudit('ROLLBACK', 'FLAG_ROLLED_BACK', {
            flagKey,
            rolledBackFrom: flag.version,
            rolledBackTo: rollbackConfig.version
        });

        return flag;
    }

    /**
     * Get feature flag statistics
     */
    getStatistics() {
        const evaluations = this.performanceMetrics.get('evaluations');
        const recentEvaluations = evaluations.filter(e =>
            Date.now() - e.timestamp < 300000 // Last 5 minutes
        );

        return {
            flagCount: this.flags.size,
            evaluationCount: this.evaluationCount,
            recentEvaluationCount: recentEvaluations.length,
            averageEvaluationTime: recentEvaluations.length > 0 ?
                recentEvaluations.reduce((sum, e) => sum + e.duration, 0) / recentEvaluations.length : 0,
            cacheSize: this.cache.size,
            auditLogSize: this.auditLog.length,
            uptime: Date.now() - this.startTime,
            availability: this.evaluationCount > 0 ?
                ((this.evaluationCount - this.getFailureCount()) / this.evaluationCount) * 100 : 100
        };
    }

    /**
     * Generate cache key
     * @private
     */
    getCacheKey(flagKey, context) {
        const contextHash = crypto.createHash('sha256')
            .update(JSON.stringify(context))
            .digest('hex')
            .substring(0, 16);
        return `${flagKey}-${contextHash}`;
    }

    /**
     * Clear cache for specific flag
     * @private
     */
    clearFlagCache(flagKey) {
        for (const key of this.cache.keys()) {
            if (key.startsWith(`${flagKey}-`)) {
                this.cache.delete(key);
            }
        }
    }

    /**
     * Generate unique flag ID
     * @private
     */
    generateFlagId(flagKey) {
        return crypto.createHash('sha256')
            .update(`${flagKey}-${Date.now()}`)
            .digest('hex')
            .substring(0, 16);
    }

    /**
     * Log audit event
     * @private
     */
    logAudit(category, action, data) {
        const entry = {
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            category,
            action,
            data,
            environment: this.config.environment
        };

        this.auditLog.push(entry);

        // Trim audit log if too large
        if (this.auditLog.length > this.config.maxAuditEntries) {
            this.auditLog.splice(0, this.auditLog.length - this.config.maxAuditEntries);
        }

        this.emit('audit', entry);
    }

    /**
     * Get failure count for availability calculation
     * @private
     */
    getFailureCount() {
        return this.auditLog.filter(entry =>
            entry.category === 'ERROR' || entry.category === 'CIRCUIT_BREAKER'
        ).length;
    }

    /**
     * Sanitize context for logging
     * @private
     */
    sanitizeContext(context) {
        const sanitized = { ...context };
        delete sanitized.password;
        delete sanitized.token;
        delete sanitized.secret;
        return sanitized;
    }

    /**
     * Sanitize config for logging
     * @private
     */
    sanitizeConfig(config) {
        const sanitized = { ...config };
        if (sanitized.metadata) {
            delete sanitized.metadata.secrets;
            delete sanitized.metadata.tokens;
        }
        return sanitized;
    }

    /**
     * Get audit log entries
     */
    getAuditLog(filters = {}) {
        let filtered = [...this.auditLog];

        if (filters.category) {
            filtered = filtered.filter(entry => entry.category === filters.category);
        }

        if (filters.flagKey) {
            filtered = filtered.filter(entry =>
                entry.data && entry.data.flagKey === filters.flagKey
            );
        }

        if (filters.since) {
            filtered = filtered.filter(entry =>
                new Date(entry.timestamp) >= new Date(filters.since)
            );
        }

        return filtered.slice(-filters.limit || filtered.length);
    }

    /**
     * Export all flags for backup/migration
     */
    exportFlags() {
        const flagsObj = {};
        for (const [key, flag] of this.flags) {
            flagsObj[key] = { ...flag };
        }

        return {
            flags: flagsObj,
            exportedAt: new Date().toISOString(),
            version: '1.0',
            environment: this.config.environment
        };
    }

    /**
     * Import flags from backup
     */
    async importFlags(exportData) {
        const { flags } = exportData;

        for (const [flagKey, flagConfig] of Object.entries(flags)) {
            await this.registerFlag(flagKey, flagConfig);
        }

        this.logAudit('SYSTEM', 'FLAGS_IMPORTED', {
            count: Object.keys(flags).length,
            source: exportData.environment || 'unknown'
        });
    }

    /**
     * Health check
     */
    healthCheck() {
        const stats = this.getStatistics();
        const isHealthy =
            stats.availability >= 99.0 &&
            stats.averageEvaluationTime <= this.config.evaluationTimeout;

        return {
            healthy: isHealthy,
            timestamp: new Date().toISOString(),
            stats,
            checks: {
                availability: {
                    status: stats.availability >= 99.0 ? 'PASS' : 'FAIL',
                    value: stats.availability,
                    threshold: 99.0
                },
                performance: {
                    status: stats.averageEvaluationTime <= this.config.evaluationTimeout ? 'PASS' : 'FAIL',
                    value: stats.averageEvaluationTime,
                    threshold: this.config.evaluationTimeout
                }
            }
        };
    }
}

module.exports = FeatureFlagManager;