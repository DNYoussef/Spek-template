/**
 * Jest Test Setup
 * Global test configuration and utilities
 */

// Increase timeout for integration tests
if (process.env.TEST_TIMEOUT) {
  jest.setTimeout(parseInt(process.env.TEST_TIMEOUT, 10));
}

// Suppress console warnings during tests unless debugging
if (!process.env.DEBUG_TESTS) {
  global.console.warn = jest.fn();
  global.console.error = jest.fn((message) => {
    // Still show actual errors, just not warnings
    if (message && message.includes('Error')) {
      console.log(message);
    }
  });
}

// Global test helpers
global.testHelpers = {
  // Wait for async operations
  wait: (ms) => new Promise(resolve => setTimeout(resolve, ms)),

  // Mock file system operations
  mockFs: () => ({
    readFile: jest.fn().mockResolvedValue('mock content'),
    writeFile: jest.fn().mockResolvedValue(undefined),
    readdir: jest.fn().mockResolvedValue(['file1.js', 'file2.js']),
    stat: jest.fn().mockResolvedValue({ isFile: () => true, isDirectory: () => false })
  }),

  // Mock command execution
  mockExec: () => ({
    stdout: 'mock output',
    stderr: '',
    code: 0
  }),

  // Create mock request/response for Express tests
  mockReq: (overrides = {}) => ({
    body: {},
    params: {},
    query: {},
    headers: {},
    ...overrides
  }),

  mockRes: () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    res.end = jest.fn().mockReturnValue(res);
    return res;
  }
};

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Global error handler for unhandled rejections
process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection in test:', error);
  // Don't exit the process during tests
});