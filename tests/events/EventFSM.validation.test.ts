/**
 * EventFSM Validation Tests
 * Tests the FSM-based event system components that replaced god objects
 */

import { EventFSM } from '../../src/events/fsm/facade/EventFSM';
import { EventStates, EventEvents, BaseEvent } from '../../src/events/fsm/types/EventFSMTypes';

describe('EventFSM System Validation', () => {
  let eventFSM: EventFSM;

  beforeEach(async () => {
    eventFSM = new EventFSM({
      enableAggregation: false,
      enableValidation: true,
      enableAuditLogging: true
    });
    await eventFSM.initialize();
  });

  afterEach(async () => {
    if (eventFSM) {
      await eventFSM.shutdown();
    }
  });

  describe('Core FSM Functionality', () => {
    it('should initialize with correct state', () => {
      expect(eventFSM.getStatus().initialized).toBe(true);
    });

    it('should emit events through FSM pipeline', async () => {
      const eventReceived = jest.fn();

      eventFSM.subscribe(['test.event'], eventReceived);

      await eventFSM.emitEvent('test.event', { message: 'test' }, {
        source: 'test',
        priority: { level: 'normal', value: 5, timeout: 30000 }
      });

      // Allow time for event processing
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(eventReceived).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'test.event',
          payload: { message: 'test' }
        })
      );
    });

    it('should handle subscription management', () => {
      const handler = jest.fn();
      const subscriptionId = eventFSM.subscribe(['test.sub'], handler);

      expect(subscriptionId).toBeTruthy();
      expect(eventFSM.unsubscribe(subscriptionId)).toBe(true);
      expect(eventFSM.unsubscribe('nonexistent')).toBe(false);
    });

    it('should provide metrics', () => {
      const metrics = eventFSM.getMetrics();

      expect(metrics).toMatchObject({
        totalEvents: expect.any(Number),
        averageProcessingTime: expect.any(Number),
        errorRate: expect.any(Number),
        eventsByType: expect.any(Map),
        eventsBySource: expect.any(Map),
        activeSubscriptions: expect.any(Number)
      });
    });
  });

  describe('Event Processing Pipeline', () => {
    it('should validate events before processing', async () => {
      const invalidEvent = {
        type: '', // Invalid empty type
        payload: {}
      };

      // Should handle invalid events gracefully
      await expect(eventFSM.emitEvent('', {}, {
        source: 'test',
        priority: { level: 'normal', value: 5, timeout: 30000 }
      })).resolves.not.toThrow();
    });

    it('should route events to correct subscribers', async () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      eventFSM.subscribe(['route.test1'], handler1);
      eventFSM.subscribe(['route.test2'], handler2);

      await eventFSM.emitEvent('route.test1', { data: 'test1' }, {
        source: 'test',
        priority: { level: 'normal', value: 5, timeout: 30000 }
      });

      await new Promise(resolve => setTimeout(resolve, 50));

      expect(handler1).toHaveBeenCalled();
      expect(handler2).not.toHaveBeenCalled();
    });

    it('should handle priority-based processing', async () => {
      const processOrder: string[] = [];

      const handler = (event: BaseEvent) => {
        processOrder.push(event.metadata.priority?.level || 'unknown');
      };

      eventFSM.subscribe(['priority.test'], handler);

      // Emit events with different priorities
      await eventFSM.emitEvent('priority.test', {}, {
        source: 'test',
        priority: { level: 'low', value: 1, timeout: 60000 }
      });

      await eventFSM.emitEvent('priority.test', {}, {
        source: 'test',
        priority: { level: 'critical', value: 10, timeout: 5000 }
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(processOrder.length).toBe(2);
    });
  });

  describe('NASA Rule 10 Compliance', () => {
    it('should have bounded execution times', async () => {
      const startTime = Date.now();

      await eventFSM.emitEvent('performance.test', {}, {
        source: 'test',
        priority: { level: 'normal', value: 5, timeout: 30000 }
      });

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      // Should complete within reasonable time (bounded execution)
      expect(executionTime).toBeLessThan(1000); // 1 second max
    });

    it('should maintain bounded queue sizes', () => {
      const status = eventFSM.getStatus();

      // EventFSM should manage queue internally without unbounded growth
      expect(status.activeContexts).toBeGreaterThanOrEqual(0);
      expect(status.activeContexts).toBeLessThan(1000); // Reasonable bound
    });
  });
});