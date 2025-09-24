/**
 * Test Environment Setup
 * Shared utilities for test cleanup and configuration
 */

// Global test configuration
global.TEST_TIMEOUT = 10000;
global.spawnedProcesses = [];
global.activeConnections = [];
global.eventEmitters = [];

/**
 * Async cleanup utility for all test resources
 */
async function cleanupTestResources() {
  // Clear all mocks
  jest.clearAllMocks();
  jest.clearAllTimers();

  // Remove event listeners
  if (global.eventEmitter) {
    global.eventEmitter.removeAllListeners();
  }

  global.eventEmitters.forEach(emitter => {
    if (emitter && emitter.removeAllListeners) {
      emitter.removeAllListeners();
    }
  });
  global.eventEmitters = [];

  // Close database connections
  if (global.dbConnection) {
    try {
      await global.dbConnection.close();
      global.dbConnection = null;
    } catch (error) {
      console.warn('Error closing database connection:', error.message);
    }
  }

  // Close active connections
  await Promise.all(
    global.activeConnections.map(async (conn) => {
      try {
        if (conn && conn.close) {
          await conn.close();
        } else if (conn && conn.destroy) {
          conn.destroy();
        }
      } catch (error) {
        console.warn('Error closing connection:', error.message);
      }
    })
  );
  global.activeConnections = [];

  // Kill spawned processes
  await Promise.all(
    global.spawnedProcesses.map(async (process) => {
      try {
        if (process && process.kill) {
          process.kill('SIGTERM');
          // Wait for graceful shutdown
          await new Promise(resolve => setTimeout(resolve, 100));
          if (!process.killed) {
            process.kill('SIGKILL');
          }
        }
      } catch (error) {
        console.warn('Error killing process:', error.message);
      }
    })
  );
  global.spawnedProcesses = [];

  // Clear intervals and timeouts
  if (global.testIntervals) {
    global.testIntervals.forEach(id => clearInterval(id));
    global.testIntervals = [];
  }

  if (global.testTimeouts) {
    global.testTimeouts.forEach(id => clearTimeout(id));
    global.testTimeouts = [];
  }

  // Reset module cache for fresh imports
  jest.resetModules();
}

/**
 * Register a process for cleanup
 */
function registerProcess(process) {
  global.spawnedProcesses.push(process);
}

/**
 * Register a connection for cleanup
 */
function registerConnection(connection) {
  global.activeConnections.push(connection);
}

/**
 * Register an event emitter for cleanup
 */
function registerEventEmitter(emitter) {
  global.eventEmitters.push(emitter);
}

/**
 * Create a safe timeout that gets cleaned up
 */
function createSafeTimeout(callback, delay) {
  if (!global.testTimeouts) {
    global.testTimeouts = [];
  }
  const id = setTimeout(callback, delay);
  global.testTimeouts.push(id);
  return id;
}

/**
 * Create a safe interval that gets cleaned up
 */
function createSafeInterval(callback, delay) {
  if (!global.testIntervals) {
    global.testIntervals = [];
  }
  const id = setInterval(callback, delay);
  global.testIntervals.push(id);
  return id;
}

/**
 * Wait for a condition with timeout
 */
async function waitForCondition(condition, timeout = 5000, interval = 100) {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }

  return false;
}

/**
 * Create a mock promise that can be controlled
 */
function createControlledPromise() {
  let resolve, reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

/**
 * Suppress console output in tests
 */
function suppressConsole() {
  const originalConsole = { ...console };

  global.console = {
    ...console,
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    debug: jest.fn()
  };

  return () => {
    global.console = originalConsole;
  };
}

/**
 * Setup common test environment
 */
function setupTestEnvironment() {
  // Set test timeout
  jest.setTimeout(global.TEST_TIMEOUT);

  // Suppress warnings in tests (optional)
  const originalWarn = console.warn;
  console.warn = (...args) => {
    // Filter out known warnings
    const message = args[0] || '';
    if (message.includes('Direct HivePrincess instantiation is deprecated')) {
      return;
    }
    originalWarn.apply(console, args);
  };

  // Initialize tracking arrays
  global.spawnedProcesses = [];
  global.activeConnections = [];
  global.eventEmitters = [];
  global.testTimeouts = [];
  global.testIntervals = [];
}

/**
 * Teardown test environment
 */
async function teardownTestEnvironment() {
  await cleanupTestResources();
}

module.exports = {
  cleanupTestResources,
  registerProcess,
  registerConnection,
  registerEventEmitter,
  createSafeTimeout,
  createSafeInterval,
  waitForCondition,
  createControlledPromise,
  suppressConsole,
  setupTestEnvironment,
  teardownTestEnvironment
};