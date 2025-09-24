/**
 * Monitoring System Mock
 * Mock implementation for defense monitoring and system polling
 */

class MonitoringSystemMock {
  constructor() {
    this.intervals = [];
    this.timeouts = [];
    this.metrics = new Map();
    this.isShutdown = false;
  }

  // Polling interval management
  createPollingInterval(callback, interval) {
    const id = setInterval(() => {
      if (!this.isShutdown) {
        callback();
      }
    }, interval);
    this.intervals.push(id);
    return id;
  }

  createTimeout(callback, delay) {
    const id = setTimeout(() => {
      if (!this.isShutdown) {
        callback();
      }
    }, delay);
    this.timeouts.push(id);
    return id;
  }

  // System shutdown methods
  async shutdown() {
    this.isShutdown = true;

    // Clear all intervals
    this.intervals.forEach(id => clearInterval(id));
    this.intervals = [];

    // Clear all timeouts
    this.timeouts.forEach(id => clearTimeout(id));
    this.timeouts = [];

    // Clear metrics
    this.metrics.clear();
  }

  // Metric collection stubs
  recordMetric(key, value) {
    if (!this.metrics.has(key)) {
      this.metrics.set(key, []);
    }
    this.metrics.get(key).push({
      value,
      timestamp: Date.now()
    });
  }

  getMetrics(key) {
    return this.metrics.get(key) || [];
  }

  getAllMetrics() {
    const result = {};
    this.metrics.forEach((values, key) => {
      result[key] = values;
    });
    return result;
  }

  clearMetrics() {
    this.metrics.clear();
  }

  // Health check
  isHealthy() {
    return !this.isShutdown && this.intervals.length >= 0;
  }

  getStatus() {
    return {
      isShutdown: this.isShutdown,
      activeIntervals: this.intervals.length,
      activeTimeouts: this.timeouts.length,
      metricsCount: this.metrics.size
    };
  }

  // Reset for testing
  reset() {
    this.shutdown();
    this.isShutdown = false;
  }
}

// Helper function to create safe intervals in tests
function createSafeMonitoring() {
  const mock = new MonitoringSystemMock();

  // Register for cleanup
  if (!global.testMonitoringSystems) {
    global.testMonitoringSystems = [];
  }
  global.testMonitoringSystems.push(mock);

  return mock;
}

// Cleanup function for afterEach
async function cleanupMonitoringSystems() {
  if (global.testMonitoringSystems) {
    await Promise.all(
      global.testMonitoringSystems.map(system => system.shutdown())
    );
    global.testMonitoringSystems = [];
  }
}

module.exports = {
  MonitoringSystemMock,
  createSafeMonitoring,
  cleanupMonitoringSystems
};