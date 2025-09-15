/**
 * Jest test setup file
 * Configures global test environment and handles cleanup
 */

// Set test environment variables
process.env.NODE_ENV = 'test';

// Increase timeout for async operations
jest.setTimeout(30000);

// Global test utilities
global.testTimeout = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Mock console methods to reduce test noise
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

beforeAll(() => {
  // Suppress expected warnings during tests
  console.warn = jest.fn((message) => {
    if (typeof message === 'string' && (
      message.includes('Theater remediation validation failed') ||
      message.includes('Flag initialization failed')
    )) {
      return; // Suppress expected warnings
    }
    originalConsoleWarn(message);
  });

  console.error = jest.fn((message) => {
    // Only suppress known test-related errors
    if (typeof message === 'string' && message.includes('ENOENT')) {
      return;
    }
    originalConsoleError(message);
  });
});

afterAll(() => {
  // Restore console methods
  console.warn = originalConsoleWarn;
  console.error = originalConsoleError;
});

// Global cleanup for hanging processes
afterEach(async () => {
  // Clean up any hanging timers
  jest.clearAllTimers();

  // Force garbage collection if available
  if (global.gc) {
    global.gc();
  }
});