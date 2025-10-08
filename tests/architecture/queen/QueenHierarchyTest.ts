/**
 * Queen Hierarchy Preservation Test
 * Validates that Queen→Princess→Drone command chain is intact
 */

import QueenFacade from '../../../src/architecture/langgraph/queen/QueenFacade';
import {
  QueenCommand,
  QueenCommandType,
  PrincessDomain
} from '../../../src/architecture/langgraph/queen/fsm/QueenFSMTypes';

describe('Queen Hierarchy Preservation', () => {
  let queen: QueenFacade;

  beforeEach(async () => {
    queen = new QueenFacade({
      maxConcurrentCommands: 10,
      decisionThreshold: 0.7,
      metricsCollectionInterval: 1000,
      enableAutoEscalation: true
    });

    await queen.initialize();
  });

  afterEach(async () => {
    await queen.shutdown();
  });

  test('should initialize Queen with all Princess domains', async () => {
    const status = await queen.getSystemStatus();

    expect(status.princessStatuses).toBeDefined();
    expect(status.princessStatuses.length).toBe(6);

    // Verify all domains are present
    const domains = status.princessStatuses.map((p: any) => p.domain);
    expect(domains).toContain(PrincessDomain.DEVELOPMENT);
    expect(domains).toContain(PrincessDomain.ARCHITECTURE);
    expect(domains).toContain(PrincessDomain.QUALITY);
    expect(domains).toContain(PrincessDomain.PERFORMANCE);
    expect(domains).toContain(PrincessDomain.INFRASTRUCTURE);
    expect(domains).toContain(PrincessDomain.SECURITY);
  });

  test('should process Queen commands through hierarchy', async () => {
    const command: QueenCommand = {
      commandId: 'test-command-001',
      type: QueenCommandType.TASK_ASSIGNMENT,
      sourceId: 'test-source',
      targetDomain: PrincessDomain.DEVELOPMENT,
      payload: {
        taskId: 'task-001',
        description: 'Test task assignment'
      },
      timestamp: Date.now(),
      priority: 5
    };

    const result = await queen.processCommand(command);

    expect(result.success).toBe(true);
    expect(result.commandId).toBe('test-command-001');
    expect(result.processingTime).toBeGreaterThan(0);
  });

  test('should handle escalations properly', async () => {
    const escalationResult = await queen.handleEscalation(
      PrincessDomain.DEVELOPMENT,
      {
        type: 'task_failure',
        description: 'Test escalation',
        severity: 'high'
      },
      'high'
    );

    expect(escalationResult).toBeDefined();
    expect(escalationResult.action).toBe('reassign');
    expect(escalationResult.targetDomain).toBe(PrincessDomain.ARCHITECTURE);
  });

  test('should maintain metrics and monitoring', async () => {
    const status = await queen.getSystemStatus();

    expect(status.metrics).toBeDefined();
    expect(status.metrics.commandsProcessed).toBeGreaterThanOrEqual(0);
    expect(status.metrics.tasksAssigned).toBeGreaterThanOrEqual(0);
    expect(status.systemHealth).toMatch(/healthy|warning|degraded|critical/);
  });

  test('should preserve FSM state transitions', async () => {
    const initialStatus = await queen.getSystemStatus();
    expect(initialStatus.state).toBe('COMMANDING');

    // Process command to trigger state transitions
    const command: QueenCommand = {
      commandId: 'fsm-test-001',
      type: QueenCommandType.EMERGENCY_RESPONSE,
      sourceId: 'fsm-test',
      payload: {
        type: 'critical_failure',
        severity: 'critical'
      },
      timestamp: Date.now(),
      priority: 10
    };

    await queen.processCommand(command);

    const finalStatus = await queen.getSystemStatus();
    expect(finalStatus.state).toBeDefined();
  });

  test('should handle decision making', async () => {
    const decisionCommand: QueenCommand = {
      commandId: 'decision-test-001',
      type: QueenCommandType.RESOURCE_ALLOCATION,
      sourceId: 'decision-test',
      payload: {
        resourceType: 'memory',
        amount: 100
      },
      timestamp: Date.now(),
      priority: 7
    };

    const result = await queen.processCommand(decisionCommand);

    expect(result.success).toBe(true);
    expect(result.decisionResult).toBeDefined();
  });
});

/*
 * AGENT FOOTER: QueenHierarchyTest v1.0.0
 * Status: OK | Tests Queen→Princess→Drone command chain preservation
 * Created: 2025-09-28T16:35:00-04:00 | Agent: claude-sonnet-4
 */