/**
 * Agent Spawner Mocks
 * Mock implementation for agent spawning and management
 */

const mockAgents = new Map();
let agentIdCounter = 1;

const agentSpawnerMock = {
  spawnAgent: jest.fn().mockImplementation(async (type, description, config = {}) => {
    const agentId = `agent-${agentIdCounter++}`;
    const agent = {
      id: agentId,
      type,
      description,
      status: 'ready',
      model: config.model || 'gpt-5',
      mcpServers: config.mcpServers || ['claude-flow', 'memory'],
      createdAt: Date.now()
    };

    mockAgents.set(agentId, agent);

    return agent;
  }),

  killAgent: jest.fn().mockImplementation(async (agentId) => {
    if (mockAgents.has(agentId)) {
      mockAgents.delete(agentId);
      return { success: true, agentId };
    }
    return { success: false, error: 'Agent not found' };
  }),

  getAgent: jest.fn().mockImplementation(async (agentId) => {
    return mockAgents.get(agentId) || null;
  }),

  listAgents: jest.fn().mockImplementation(async () => {
    return Array.from(mockAgents.values());
  }),

  executeTask: jest.fn().mockImplementation(async (agentId, task) => {
    const agent = mockAgents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    return {
      taskId: `task-${Date.now()}`,
      agentId,
      result: `Task executed by ${agent.type}`,
      status: 'completed',
      duration: 150
    };
  }),

  updateAgentStatus: jest.fn().mockImplementation(async (agentId, status) => {
    const agent = mockAgents.get(agentId);
    if (agent) {
      agent.status = status;
      return { success: true, agent };
    }
    return { success: false, error: 'Agent not found' };
  }),

  // Cleanup helper
  cleanup: () => {
    mockAgents.clear();
    agentIdCounter = 1;
  }
};

module.exports = {
  agentSpawnerMock,
  mockAgents
};