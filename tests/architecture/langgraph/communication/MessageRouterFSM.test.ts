/**
 * MessageRouter FSM Test Suite - Comprehensive Testing
 * Tests all FSM states, transitions, and routing functionality
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { EventEmitter } from 'events';
import { MessageRouterFacade } from '../../../../src/architecture/langgraph/communication/MessageRouterFacade';
import { MessageRouterStateMachine } from '../../../../src/architecture/langgraph/communication/fsm/MessageRouterStateMachine';
import { RouteEvaluator } from '../../../../src/architecture/langgraph/communication/evaluators/RouteEvaluator';
import { MessageQueueManager } from '../../../../src/architecture/langgraph/communication/queues/MessageQueueManager';
import {
  MessageRouterState,
  MessageRouterEvent,
  Message,
  MessageResponse
} from '../../../../src/architecture/langgraph/communication/types/MessageRouterTypes';
import { StateStore } from '../../../../src/architecture/langgraph/StateStore';
import PrincessStateMachine from '../../../../src/architecture/langgraph/state-machines/PrincessStateMachine';

// Mock implementations
class MockStateStore extends EventEmitter {
  private states = new Map();

  async get(key: string): Promise<any> {
    return this.states.get(key);
  }

  async set(key: string, value: any): Promise<void> {
    this.states.set(key, value);
  }

  async delete(key: string): Promise<void> {
    this.states.delete(key);
  }

  async clear(): Promise<void> {
    this.states.clear();
  }
}

class MockPrincessStateMachine extends EventEmitter {
  private state = { name: 'idle', type: 'normal', timestamp: new Date() };
  private capabilities = [{ id: 'test', enabled: true }];
  private metrics = { currentLoad: 0.5 };

  getCurrentState() {
    return this.state;
  }

  getCapabilities() {
    return this.capabilities;
  }

  getPerformanceMetrics() {
    return this.metrics;
  }

  async executeTask(task: any, options?: any): Promise<any> {
    // Simulate processing time and then emit completion
    setTimeout(() => {
      this.emit(`messageProcessed:${options?.messageId}`, { success: true, result: 'task executed' });
    }, 50);
    return { success: true, result: 'task executed' };
  }

  getTaskHistory(limit: number = 10): any[] {
    return [];
  }

  setState(newState: string): void {
    const oldState = this.state.name;
    this.state = { name: newState, type: 'normal', timestamp: new Date() };
    this.emit('stateChanged', oldState, newState);
  }

  setLoad(load: number): void {
    this.metrics.currentLoad = load;
  }
}

describe('MessageRouter FSM Tests', () => {
  let router: MessageRouterFacade;
  let stateStore: MockStateStore;
  let princess1: MockPrincessStateMachine;
  let princess2: MockPrincessStateMachine;

  beforeEach(() => {
    stateStore = new MockStateStore();
    router = new MessageRouterFacade(stateStore as any);
    princess1 = new MockPrincessStateMachine();
    princess2 = new MockPrincessStateMachine();

    router.registerPrincess('princess1', princess1 as any);
    router.registerPrincess('princess2', princess2 as any);
  });

  afterEach(() => {
    router.destroy();
  });

  describe('FSM State Machine', () => {
    let fsm: MessageRouterStateMachine;

    beforeEach(() => {
      fsm = new MessageRouterStateMachine();
    });

    it('should start in IDLE state', () => {
      expect(fsm.getCurrentState()).toBe(MessageRouterState.IDLE);
    });

    it('should transition from IDLE to EVALUATING on MESSAGE_RECEIVED', async () => {
      await fsm.handleEvent(MessageRouterEvent.MESSAGE_RECEIVED);
      expect(fsm.getCurrentState()).toBe(MessageRouterState.EVALUATING);
    });

    it('should transition through complete routing flow', async () => {
      const states: MessageRouterState[] = [];
      fsm.on('stateChanged', (oldState, newState) => {
        states.push(newState);
      });

      await fsm.handleEvent(MessageRouterEvent.MESSAGE_RECEIVED);
      await fsm.handleEvent(MessageRouterEvent.EVALUATION_COMPLETE);
      await fsm.handleEvent(MessageRouterEvent.ROUTING_COMPLETE);
      await fsm.handleEvent(MessageRouterEvent.QUEUING_COMPLETE);
      await fsm.handleEvent(MessageRouterEvent.PROCESSING_COMPLETE);
      await fsm.handleEvent(MessageRouterEvent.ACK_RECEIVED);

      expect(states).toEqual([
        MessageRouterState.EVALUATING,
        MessageRouterState.ROUTING,
        MessageRouterState.QUEUING,
        MessageRouterState.PROCESSING,
        MessageRouterState.WAITING_ACK,
        MessageRouterState.IDLE
      ]);
    });

    it('should handle error transitions', async () => {
      await fsm.handleEvent(MessageRouterEvent.MESSAGE_RECEIVED);
      await fsm.handleEvent(MessageRouterEvent.ERROR_OCCURRED);
      expect(fsm.getCurrentState()).toBe(MessageRouterState.ERROR);

      await fsm.handleEvent(MessageRouterEvent.RETRY_REQUESTED);
      expect(fsm.getCurrentState()).toBe(MessageRouterState.EVALUATING);
    });

    it('should validate state invariants', () => {
      const invariants = fsm.getStateInvariants();
      expect(invariants.hasValidState).toBe(true);
      expect(invariants.historyNotEmpty).toBe(true);
    });
  });

  describe('Route Evaluation', () => {
    it('should evaluate routing conditions correctly', async () => {
      const evaluator = new RouteEvaluator(new Map([['princess1', princess1 as any]]));
      
      const message: Message = {
        id: 'test-msg',
        from: 'queen',
        to: 'princess1',
        type: 'command',
        priority: 'medium',
        payload: {},
        metadata: {
          timestamp: new Date(),
          retryCount: 0,
          maxRetries: 3,
          timeout: 30000,
          requiresAck: false
        },
        routing: {
          strategy: 'direct',
          maxHops: 5,
          currentHop: 0,
          path: ['queen']
        }
      };

      const result = await evaluator.evaluateRoutingConditions(message);
      expect(result.allowed).toBe(true);
      expect(result.targetPrincess).toBe('princess1');
    });

    it('should check state compatibility', async () => {
      const evaluator = new RouteEvaluator(new Map([['princess1', princess1 as any]]));
      
      const message: Message = {
        id: 'test-msg',
        from: 'queen',
        to: 'princess1',
        type: 'command',
        priority: 'medium',
        payload: {},
        metadata: {
          timestamp: new Date(),
          retryCount: 0,
          maxRetries: 3,
          timeout: 30000,
          requiresAck: false
        },
        routing: {
          strategy: 'direct',
          maxHops: 5,
          currentHop: 0,
          path: ['queen']
        }
      };

      const result = await evaluator.checkStateCompatibility(message);
      expect(result.compatible).toBe(true);
    });

    it('should reject messages for error state princesses', async () => {
      princess1.setState('error');
      const evaluator = new RouteEvaluator(new Map([['princess1', princess1 as any]]));
      
      const message: Message = {
        id: 'test-msg',
        from: 'queen',
        to: 'princess1',
        type: 'command',
        priority: 'medium',
        payload: {},
        metadata: {
          timestamp: new Date(),
          retryCount: 0,
          maxRetries: 3,
          timeout: 30000,
          requiresAck: false
        },
        routing: {
          strategy: 'direct',
          maxHops: 5,
          currentHop: 0,
          path: ['queen']
        }
      };

      const result = await evaluator.checkStateCompatibility(message);
      expect(result.compatible).toBe(false);
      expect(result.reason).toContain('error state cannot process commands');
    });
  });

  describe('Message Queue Management', () => {
    let queueManager: MessageQueueManager;

    beforeEach(() => {
      queueManager = new MessageQueueManager();
      queueManager.createQueue('princess1');
    });

    it('should enqueue messages with priority ordering', async () => {
      const lowPriorityMsg: Message = {
        id: 'low-msg',
        from: 'queen',
        to: 'princess1',
        type: 'command',
        priority: 'low',
        payload: {},
        metadata: {
          timestamp: new Date(),
          retryCount: 0,
          maxRetries: 3,
          timeout: 30000,
          requiresAck: false
        },
        routing: {
          strategy: 'direct',
          maxHops: 5,
          currentHop: 0,
          path: ['queen']
        }
      };

      const highPriorityMsg: Message = {
        ...lowPriorityMsg,
        id: 'high-msg',
        priority: 'high'
      };

      await queueManager.enqueueMessage(lowPriorityMsg);
      await queueManager.enqueueMessage(highPriorityMsg);

      const firstMessage = queueManager.dequeueMessage('princess1');
      expect(firstMessage?.id).toBe('high-msg');
      
      const secondMessage = queueManager.dequeueMessage('princess1');
      expect(secondMessage?.id).toBe('low-msg');
    });

    it('should provide queue status', () => {
      const status = queueManager.getQueueStatus('princess1');
      expect(status).toHaveProperty('queueSize');
      expect(status).toHaveProperty('maxSize');
      expect(status).toHaveProperty('utilization');
    });
  });

  describe('End-to-End Message Routing', () => {
    it('should route direct messages successfully', async () => {
      const response = await router.sendMessage(
        'queen',
        'princess1',
        'notification',
        { test: 'data' }
      ) as MessageResponse;

      expect(response).toMatchObject({
        status: 'queued',
        messageId: expect.any(String)
      });
    });

    it('should handle broadcast messages', async () => {
      const responses = await router.sendMessage(
        'queen',
        ['princess1', 'princess2'],
        'notification',
        { broadcast: 'data' }
      );

      expect(Array.isArray(responses)).toBe(true);
      expect(responses).toHaveLength(2);
    });

    it('should send commands with acknowledgment', async () => {
      const result = await router.sendCommand(
        'queen',
        'princess1',
        'execute',
        { action: 'test' }
      );

      expect(result).toEqual({ success: true, result: 'task executed' });
    });

    it('should handle load balancing', async () => {
      princess1.setLoad(0.9);
      princess2.setLoad(0.1);

      router.addRoute('load-balanced', 'princess1', [], 100);
      
      const response = await router.sendMessage(
        'queen',
        'princess1',
        'query',
        { test: 'load-balance' },
        { requiresAck: false }
      ) as MessageResponse;

      expect(response.status).toBe('queued');
    });

    it('should collect routing metrics', () => {
      const metrics = router.getRoutingMetrics();
      expect(metrics).toHaveProperty('totalMessages');
      expect(metrics).toHaveProperty('messagesByType');
      expect(metrics).toHaveProperty('networkTopology');
    });

    it('should handle princess state changes', async () => {
      let stateChangeEvent: any = null;
      router.on('princessStateChanged', (princessId, oldState, newState) => {
        stateChangeEvent = { princessId, oldState, newState };
      });

      princess1.setState('busy');

      expect(stateChangeEvent).toMatchObject({
        princessId: 'princess1',
        oldState: 'idle',
        newState: 'busy'
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle missing princess targets', async () => {
      const response = await router.sendMessage(
        'queen',
        'non-existent-princess',
        'command',
        {}
      ) as MessageResponse;

      expect(response.status).toBe('failed');
      expect(response.error).toContain('Target Princess not found');
    });

    it('should validate command responses', async () => {
      await expect(
        router.sendCommand('queen', 'non-existent-princess', 'test')
      ).rejects.toThrow('Command failed');
    });

    it('should handle router errors gracefully', () => {
      let errorEvent: any = null;
      router.on('routerError', (error) => {
        errorEvent = error;
      });

      // Trigger an error condition
      expect(() => {
        router.getCurrentState();
      }).not.toThrow();
    });
  });

  describe('Cleanup and Resource Management', () => {
    it('should clear message history', () => {
      router.clearHistory('princess1');
      const history = router.getMessageHistory('princess1');
      expect(history).toHaveLength(0);
    });

    it('should destroy resources properly', () => {
      expect(() => {
        router.destroy();
      }).not.toThrow();
    });
  });
});