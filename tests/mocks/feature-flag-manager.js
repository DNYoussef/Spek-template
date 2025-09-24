/**
 * Feature Flag Manager Mock
 * Mock implementation for testing feature flag functionality
 */

class FeatureFlagManager {

  async initialize(flagConfig) {
    for (const [key, config] of Object.entries(flagConfig)) {
      await this.registerFlag(key, config);
    }
  }

  async registerFlag(key, config) {
    const flag = {
      key,
      enabled: config.enabled || false,
      rolloutStrategy: config.rolloutStrategy || 'boolean',
      rolloutPercentage: config.rolloutPercentage || 0,
      environments: config.environments || {},
      conditions: config.conditions || [],
      variants: config.variants || null,
      metadata: config.metadata || {},
      version: 1
    };
    this.flags.set(key, flag);

    // Log registration
    this.auditLog.push({
      action: 'FLAG_REGISTERED',
      category: 'REGISTRATION',
      timestamp: new Date().toISOString(),
      data: { flagKey: key }
    });

    return flag;
  }

  async evaluate(key, context = {}) {
    const flag = this.flags.get(key);
    if (!flag) return false;

    this.evaluationCount++;

    // For variant strategy, return variant result directly
    if (flag.rolloutStrategy === 'variant') {
      const result = await this.evaluateVariant(key, context);
      this.logEvaluation(key, context, result);
      return result;
    }

    // Environment check
    if (flag.environments[context.environment] !== undefined) {
      const result = flag.environments[context.environment];
      this.logEvaluation(key, context, result);
      return result;
    }

    // Conditional check with error handling
    if (flag.conditions.length > 0) {
      for (const condition of flag.conditions) {
        // Check for invalid operators to trigger circuit breaker
        if (condition.operator && !['equals', 'not_equals', 'contains'].includes(condition.operator)) {
          if (!flag.errorCount) flag.errorCount = 0;
          flag.errorCount++;
          this.logEvaluation(key, context, undefined);
          throw new Error(`Invalid operator: ${condition.operator}`);
        }

        if (context[condition.field] !== condition.value) {
          this.logEvaluation(key, context, false);
          return false;
        }
      }
    }

    // Percentage rollout
    if (flag.rolloutStrategy === 'percentage') {
      const hash = this.hashContext(context);
      const result = (hash % 100) < flag.rolloutPercentage;
      this.logEvaluation(key, context, result);
      return result;
    }

    this.logEvaluation(key, context, flag.enabled);
    return flag.enabled;
  }

  logEvaluation(key, context, result) {
    this.auditLog.push({
      action: 'FLAG_EVALUATED',
      category: 'EVALUATION',
      timestamp: new Date().toISOString(),
      data: { flagKey: key, context, result }
    });

    // Track errors for circuit breaker
    const flag = this.flags.get(key);
    if (flag && result === undefined) {
      if (!flag.errorCount) flag.errorCount = 0;
      flag.errorCount++;
      if (flag.errorCount >= 10) {
        flag.circuitBreakerOpen = true;
      }
    }
  }

  hashContext(context) {
    const str = JSON.stringify(context);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }

  async updateFlag(key, updates) {
    const flag = this.flags.get(key);
    if (!flag) throw new Error(`Flag ${key} not found`);

    Object.assign(flag, updates);
    flag.version++;
    flag.updatedAt = new Date().toISOString();

    // Clear cache for this flag
    this.cache.delete(key);

    // Emit update event
    this.emit('flagUpdated', { key, flag });

    return flag;
  }

  async rollback(key) {
    const flag = this.flags.get(key);
    if (!flag) throw new Error(`Flag ${key} not found`);
    if (flag.version <= 1) throw new Error('No previous version found');

    // Store previous state for rollback (simple mock: just toggle enabled)
    flag.enabled = !flag.enabled;
    flag.version--;
    return flag;
  }

  async evaluateVariant(key, context = {}) {
    const flag = this.flags.get(key);
    if (!flag) return { enabled: false, variant: 'control' };

    // For variant strategy, directly return variant result
    if (flag.rolloutStrategy === 'variant') {
      const enabled = flag.enabled;
      const variantIndex = this.hashContext(context) % (flag.variants?.length || 1);
      const variant = enabled && flag.variants && flag.variants[variantIndex]
        ? (flag.variants[variantIndex].key || flag.variants[variantIndex])
        : 'control';

      return { enabled, variant };
    }

    // For non-variant strategies, evaluate normally
    const enabled = await this.evaluate(key, context);
    const variant = enabled && flag.variants
      ? flag.variants[this.hashContext(context) % flag.variants.length]
      : 'control';

    return { enabled, variant };
  }

  // Performance monitoring methods
  isCircuitBreakerOpen(key) {
    const flag = this.flags.get(key);
    if (!flag) return false;

    // Check if circuit breaker should be open based on error count
    if (!flag.errorCount) flag.errorCount = 0;
    return flag.errorCount >= 10; // Open after 10 errors
  }

  // Audit logging methods
  getAuditLog(criteria = {}) {
    if (!this.auditLog) this.auditLog = [];

    if (Object.keys(criteria).length === 0) {
      return this.auditLog;
    }

    return this.auditLog.filter(entry => {
      if (criteria.category && entry.category !== criteria.category) return false;
      if (criteria.flagKey && entry.data?.flagKey !== criteria.flagKey) return false;
      return true;
    });
  }

  on(event, callback) {
    if (!this.eventListeners) this.eventListeners = new Map();
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }

  emit(event, data) {
    if (!this.eventListeners) return;
    const listeners = this.eventListeners.get(event) || [];
    listeners.forEach(callback => callback(data));
  }

  // Statistics and health check
  getStatistics() {
    return {
      flagCount: this.flags.size,
      evaluationCount: this.evaluationCount || 0,
      uptime: Date.now() - (this.startTime || Date.now()),
      availability: 100
    };
  }

  healthCheck() {
    return {
      healthy: true,
      stats: this.getStatistics(),
      checks: {
        availability: { status: 'PASS' },
        performance: { status: 'PASS' }
      }
    };
  }

  // Import/Export methods
  exportFlags() {
    const flagsObj = {};
    this.flags.forEach((value, key) => {
      flagsObj[key] = value;
    });
    return {
      flags: flagsObj,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };
  }

  async importFlags(importData) {
    if (!importData || !importData.flags) {
      throw new Error('Invalid import data');
    }
    for (const [key, config] of Object.entries(importData.flags)) {
      await this.registerFlag(key, config);
    }
  }

  async shutdown() {
    this.flags.clear();
    this.cache.clear();
    if (this.eventListeners) this.eventListeners.clear();
    if (this.auditLog) this.auditLog = [];
  }

  // Track initialization time for stats
  constructor(config = {}) {
    this.config = {
      environment: config.environment || 'development',
      cacheTimeout: config.cacheTimeout || 5000,
      maxAuditEntries: config.maxAuditEntries || 1000
    };
    this.flags = new Map();
    this.cache = new Map();
    this.startTime = Date.now();
    this.evaluationCount = 0;
    this.auditLog = [];
  }
}

module.exports = FeatureFlagManager;