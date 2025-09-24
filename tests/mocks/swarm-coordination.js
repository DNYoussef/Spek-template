/**
 * Swarm Coordination Mocks
 * Mock implementations for swarm hierarchy components
 */

const mockSwarms = new Map();
const mockPrincesses = new Map();

const swarmCoordinationMocks = {
  // SwarmQueen mocks
  queen: {
    initialize: jest.fn().mockResolvedValue({
      success: true,
      principessCount: 6,
      agentCount: 0
    }),

    executeTask: jest.fn().mockResolvedValue({
      id: 'task-1',
      status: 'completed',
      assignedPrincesses: ['development', 'quality'],
      result: 'Task completed successfully'
    }),

    getMetrics: jest.fn().mockReturnValue({
      totalPrincesses: 6,
      activePrincesses: 6,
      totalAgents: 85,
      byzantineNodes: new Set(),
      crossHiveMessages: 0
    }),

    shutdown: jest.fn().mockResolvedValue({ success: true })
  },

  // PrincessManager mocks
  princessManager: {
    initialize: jest.fn().mockResolvedValue({
      success: true,
      princesses: ['development', 'quality', 'security', 'research', 'infrastructure', 'coordination']
    }),

    getPrincesses: jest.fn().mockReturnValue(
      new Map([
        ['development', { domain: 'development', model: 'gpt-5-codex', status: 'healthy' }],
        ['quality', { domain: 'quality', model: 'claude-opus-4.1', status: 'healthy' }],
        ['security', { domain: 'security', model: 'claude-opus-4.1', status: 'healthy' }],
        ['research', { domain: 'research', model: 'gemini-2.5-pro', status: 'healthy' }],
        ['infrastructure', { domain: 'infrastructure', model: 'claude-sonnet-4', status: 'healthy' }],
        ['coordination', { domain: 'coordination', model: 'claude-sonnet-4', status: 'healthy' }]
      ])
    ),

    getPrincess: jest.fn().mockImplementation((domain) => {
      const princesses = swarmCoordinationMocks.princessManager.getPrincesses();
      return princesses.get(domain);
    }),

    monitorHealth: jest.fn().mockResolvedValue({
      checks: 6,
      allHealthy: true,
      timestamp: Date.now()
    }),

    healPrincess: jest.fn().mockResolvedValue({
      success: true,
      domain: 'development',
      status: 'healthy'
    }),

    shutdownAll: jest.fn().mockResolvedValue({ success: true })
  },

  // ConsensusCoordinator mocks
  consensus: {
    initialize: jest.fn().mockResolvedValue({
      success: true,
      nodeCount: 6
    }),

    propose: jest.fn().mockImplementation(async (proposer, type, data) => ({
      id: `proposal-${Date.now()}`,
      type,
      proposer,
      data,
      votes: 0,
      status: 'pending'
    })),

    vote: jest.fn().mockResolvedValue({
      success: true,
      voteId: `vote-${Date.now()}`
    }),

    getMetrics: jest.fn().mockReturnValue({
      totalProposals: 0,
      byzantineNodes: new Set(),
      quorumSize: 5
    }),

    getByzantineNodes: jest.fn().mockReturnValue(new Set()),

    calculateQuorum: jest.fn().mockImplementation((nodeCount) => {
      return Math.floor((2 * nodeCount) / 3) + 1;
    })
  },

  // SwarmMetrics mocks
  metrics: {
    updateQueenMetrics: jest.fn(),

    recordTaskExecution: jest.fn(),

    addAuditEntry: jest.fn(),

    getMetrics: jest.fn().mockReturnValue({
      totalPrincesses: 6,
      activePrincesses: 6,
      totalAgents: 85
    }),

    getPerformanceMetrics: jest.fn().mockReturnValue({
      taskExecutionTime: [1500, 2000],
      averageExecutionTime: 1750
    }),

    getAuditTrail: jest.fn().mockReturnValue([
      {
        event: 'test_event',
        data: { test: true },
        timestamp: Date.now()
      }
    ]),

    generateReport: jest.fn().mockReturnValue({
      queen: { totalPrincesses: 6 },
      performance: { averageExecutionTime: 1750 },
      resources: { memoryUsage: 100 },
      recentAudit: []
    })
  }
};

// Cleanup helper
const resetSwarmMocks = () => {
  mockSwarms.clear();
  mockPrincesses.clear();
  Object.values(swarmCoordinationMocks).forEach(mock => {
    Object.values(mock).forEach(fn => {
      if (fn.mockClear) fn.mockClear();
    });
  });
};

module.exports = {
  swarmCoordinationMocks,
  mockSwarms,
  mockPrincesses,
  resetSwarmMocks
};