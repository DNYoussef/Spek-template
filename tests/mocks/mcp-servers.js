/**
 * MCP Server Mocks
 * Complete mock implementations for all MCP servers
 */

const mcpServerMocks = {
  filesystem: {
    readFile: jest.fn().mockResolvedValue('mock file content'),
    writeFile: jest.fn().mockResolvedValue(true),
    listDirectory: jest.fn().mockResolvedValue([
      { name: 'file1.js', type: 'file' },
      { name: 'file2.ts', type: 'file' }
    ]),
    createDirectory: jest.fn().mockResolvedValue(true),
    deleteFile: jest.fn().mockResolvedValue(true)
  },

  memory: {
    createEntities: jest.fn().mockResolvedValue({
      success: true,
      entityIds: ['entity-1', 'entity-2']
    }),
    createRelations: jest.fn().mockResolvedValue({
      success: true,
      relationIds: ['rel-1', 'rel-2']
    }),
    readGraph: jest.fn().mockResolvedValue({
      nodes: [
        { id: 'node-1', type: 'agent', data: {} },
        { id: 'node-2', type: 'task', data: {} }
      ],
      edges: [
        { from: 'node-1', to: 'node-2', type: 'executes' }
      ]
    }),
    searchNodes: jest.fn().mockResolvedValue([
      { id: 'node-1', score: 0.95 }
    ])
  },

  github: {
    createPR: jest.fn().mockResolvedValue({
      number: 123,
      url: 'https://github.com/test/repo/pull/123',
      title: 'Mock PR',
      state: 'open'
    }),
    listIssues: jest.fn().mockResolvedValue([
      { number: 1, title: 'Issue 1', state: 'open' }
    ]),
    getRepoInfo: jest.fn().mockResolvedValue({
      name: 'test-repo',
      stars: 100,
      forks: 10
    })
  },

  playwright: {
    launchBrowser: jest.fn().mockResolvedValue({
      id: 'browser-1',
      type: 'chromium'
    }),
    navigate: jest.fn().mockResolvedValue({ success: true }),
    screenshot: jest.fn().mockResolvedValue({
      path: '/tmp/screenshot.png',
      data: 'base64data'
    }),
    closeBrowser: jest.fn().mockResolvedValue({ success: true })
  },

  'sequential-thinking': {
    startReasoning: jest.fn().mockResolvedValue({
      sessionId: 'reasoning-1',
      initialized: true
    }),
    addStep: jest.fn().mockResolvedValue({ stepId: 'step-1' }),
    getChain: jest.fn().mockResolvedValue({
      steps: [
        { id: 'step-1', content: 'First step', timestamp: Date.now() }
      ]
    })
  },

  eva: {
    runBenchmark: jest.fn().mockResolvedValue({
      performance: 95,
      latency: 120,
      throughput: 1000
    }),
    analyzeQuality: jest.fn().mockResolvedValue({
      score: 88,
      metrics: {
        coverage: 85,
        complexity: 'low'
      }
    })
  },

  deepwiki: {
    fetchDocumentation: jest.fn().mockResolvedValue({
      content: 'Mock documentation',
      source: 'github.com/test/repo'
    })
  },

  firecrawl: {
    scrape: jest.fn().mockResolvedValue({
      content: 'Mock scraped content',
      links: ['https://example.com/page1']
    })
  },

  ref: {
    getReference: jest.fn().mockResolvedValue({
      title: 'Mock Reference',
      content: 'Reference documentation'
    })
  },

  context7: {
    getLiveContext: jest.fn().mockResolvedValue({
      examples: ['example1', 'example2'],
      updated: Date.now()
    })
  },

  figma: {
    getDesign: jest.fn().mockResolvedValue({
      id: 'design-1',
      components: []
    })
  },

  puppeteer: {
    launch: jest.fn().mockResolvedValue({
      browserId: 'pup-1'
    }),
    evaluate: jest.fn().mockResolvedValue({ result: 'evaluated' })
  }
};

// Helper to reset all mocks
const resetAllMocks = () => {
  Object.values(mcpServerMocks).forEach(server => {
    Object.values(server).forEach(fn => {
      if (fn.mockClear) fn.mockClear();
    });
  });
};

module.exports = {
  mcpServerMocks,
  resetAllMocks
};