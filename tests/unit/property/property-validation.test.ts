/**
 * Property-Based Validation Tests
 * Real property-based testing using fast-check to validate invariants,
 * round-trip properties, associativity, and state transitions
 */

import fc from 'fast-check';
const { cleanupTestResources } = require('../../setup/test-environment');

// Real utility functions to test
function sortArray<T>(arr: T[], compareFn?: (a: T, b: T) => number): T[] {
  return [...arr].sort(compareFn);
}

function encodeDecodeJson(obj: any): any {
  return JSON.parse(JSON.stringify(obj));
}

function mergeObjects(obj1: Record<string, any>, obj2: Record<string, any>): Record<string, any> {
  return { ...obj1, ...obj2 };
}

function normalizeString(str: string): string {
  return str.trim().toLowerCase().replace(/\s+/g, ' ');
}

function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}

// State machine for order processing
class OrderStateMachine {
  private state: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled' = 'pending';

  canTransition(to: string): boolean {
    const validTransitions: Record<string, string[]> = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['shipped', 'cancelled'],
      shipped: ['delivered'],
      delivered: [],
      cancelled: []
    };

    return validTransitions[this.state]?.includes(to) ?? false;
  }

  transition(to: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'): boolean {
    if (this.canTransition(to)) {
      this.state = to;
      return true;
    }
    return false;
  }

  getState(): string {
    return this.state;
  }

  reset(): void {
    this.state = 'pending';
  }
}

describe('Property-Based Validation', () => {
  afterEach(async () => {
    await cleanupTestResources();
  });

  describe('Invariant Properties', () => {
    it('sorting preserves array length', () => {
      fc.assert(fc.property(
        fc.array(fc.integer()),
        (input) => {
          const sorted = sortArray(input);
          expect(sorted.length).toBe(input.length);
        }
      ), { numRuns: 100 });
    });

    it('sorting produces ordered output', () => {
      fc.assert(fc.property(
        fc.array(fc.integer()),
        (input) => {
          const sorted = sortArray(input);

          for (let i = 1; i < sorted.length; i++) {
            expect(sorted[i - 1]!).toBeLessThanOrEqual(sorted[i]!);
          }
        }
      ), { numRuns: 100 });
    });

    it('sorting maintains all elements', () => {
      fc.assert(fc.property(
        fc.array(fc.integer()),
        (input) => {
          const sorted = sortArray(input);
          const sortedInput = [...input].sort((a, b) => a - b);

          expect(sorted).toEqual(sortedInput);
        }
      ), { numRuns: 100 });
    });

    it('percentage calculation stays within bounds', () => {
      fc.assert(fc.property(
        fc.integer({ min: 0, max: 1000 }),
        fc.integer({ min: 1, max: 1000 }),
        (value, total) => {
          const percentage = calculatePercentage(value, total);

          expect(percentage).toBeGreaterThanOrEqual(0);
          expect(percentage).toBeLessThanOrEqual(100);
        }
      ), { numRuns: 100 });
    });
  });

  describe('Round-Trip Properties', () => {
    it('JSON encode-decode preserves simple objects', () => {
      fc.assert(fc.property(
        fc.record({
          name: fc.string(),
          age: fc.integer({ min: 0, max: 150 }),
          active: fc.boolean()
        }),
        (obj) => {
          const decoded = encodeDecodeJson(obj);
          expect(decoded).toEqual(obj);
        }
      ), { numRuns: 100 });
    });

    it('JSON encode-decode preserves nested structures', () => {
      fc.assert(fc.property(
        fc.record({
          user: fc.record({
            id: fc.integer(),
            name: fc.string()
          }),
          settings: fc.record({
            theme: fc.constantFrom('light', 'dark'),
            notifications: fc.boolean()
          })
        }),
        (obj) => {
          const decoded = encodeDecodeJson(obj);
          expect(decoded).toEqual(obj);
        }
      ), { numRuns: 100 });
    });

    it('JSON encode-decode preserves arrays', () => {
      fc.assert(fc.property(
        fc.array(fc.record({
          id: fc.integer(),
          value: fc.string()
        })),
        (arr) => {
          const decoded = encodeDecodeJson(arr);
          expect(decoded).toEqual(arr);
        }
      ), { numRuns: 100 });
    });
  });

  describe('Associativity and Commutativity', () => {
    it('string normalization is idempotent', () => {
      fc.assert(fc.property(
        fc.string(),
        (str) => {
          const normalized1 = normalizeString(str);
          const normalized2 = normalizeString(normalized1);

          expect(normalized1).toBe(normalized2);
        }
      ), { numRuns: 100 });
    });

    it('object merge is associative', () => {
      fc.assert(fc.property(
        fc.record({ a: fc.integer() }),
        fc.record({ b: fc.integer() }),
        fc.record({ c: fc.integer() }),
        (obj1, obj2, obj3) => {
          const result1 = mergeObjects(mergeObjects(obj1, obj2), obj3);
          const result2 = mergeObjects(obj1, mergeObjects(obj2, obj3));

          expect(result1).toEqual(result2);
        }
      ), { numRuns: 100 });
    });

    it('sorting is idempotent', () => {
      fc.assert(fc.property(
        fc.array(fc.integer()),
        (arr) => {
          const sorted1 = sortArray(arr);
          const sorted2 = sortArray(sorted1);

          expect(sorted1).toEqual(sorted2);
        }
      ), { numRuns: 100 });
    });
  });

  describe('Boundary Conditions', () => {
    it('handles empty arrays correctly', () => {
      fc.assert(fc.property(
        fc.constant([]),
        (emptyArray) => {
          const sorted = sortArray(emptyArray);
          expect(sorted).toEqual([]);
          expect(sorted.length).toBe(0);
        }
      ), { numRuns: 50 });
    });

    it('handles single-element arrays correctly', () => {
      fc.assert(fc.property(
        fc.integer(),
        (value) => {
          const arr = [value];
          const sorted = sortArray(arr);

          expect(sorted).toEqual([value]);
          expect(sorted.length).toBe(1);
        }
      ), { numRuns: 100 });
    });

    it('handles zero total in percentage calculation', () => {
      fc.assert(fc.property(
        fc.integer({ min: 0, max: 1000 }),
        (value) => {
          const percentage = calculatePercentage(value, 0);
          expect(percentage).toBe(0);
        }
      ), { numRuns: 50 });
    });

    it('handles equal value and total', () => {
      fc.assert(fc.property(
        fc.integer({ min: 1, max: 1000 }),
        (value) => {
          const percentage = calculatePercentage(value, value);
          expect(percentage).toBe(100);
        }
      ), { numRuns: 100 });
    });
  });

  describe('State Transition Properties', () => {
    it('state machine only allows valid transitions', () => {
      fc.assert(fc.property(
        fc.array(fc.constantFrom('pending', 'confirmed', 'shipped', 'delivered', 'cancelled'), { maxLength: 10 }),
        (transitions) => {
          const machine = new OrderStateMachine();

          transitions.forEach(targetState => {
            const currentState = machine.getState();
            const canTransition = machine.canTransition(targetState);
            const transitionResult = machine.transition(targetState as any);

            expect(canTransition).toBe(transitionResult);

            if (transitionResult) {
              expect(machine.getState()).toBe(targetState);
            } else {
              expect(machine.getState()).toBe(currentState);
            }
          });
        }
      ), { numRuns: 100 });
    });

    it('state machine terminal states cannot transition', () => {
      fc.assert(fc.property(
        fc.constantFrom('delivered', 'cancelled'),
        fc.constantFrom('pending', 'confirmed', 'shipped', 'delivered', 'cancelled'),
        (terminalState, targetState) => {
          const machine = new OrderStateMachine();

          // Force machine to terminal state
          machine.reset();
          if (terminalState === 'delivered') {
            machine.transition('confirmed');
            machine.transition('shipped');
            machine.transition('delivered');
          } else {
            machine.transition('cancelled');
          }

          const canTransition = machine.canTransition(targetState);
          const result = machine.transition(targetState as any);

          expect(canTransition).toBe(false);
          expect(result).toBe(false);
          expect(machine.getState()).toBe(terminalState);
        }
      ), { numRuns: 50 });
    });

    it('state machine maintains valid state after any sequence', () => {
      fc.assert(fc.property(
        fc.array(fc.constantFrom('pending', 'confirmed', 'shipped', 'delivered', 'cancelled'), { maxLength: 20 }),
        (transitions) => {
          const machine = new OrderStateMachine();
          const validStates = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

          transitions.forEach(state => {
            machine.transition(state as any);
          });

          expect(validStates).toContain(machine.getState());
        }
      ), { numRuns: 100 });
    });
  });

  describe('Complex Property Combinations', () => {
    it('validates configuration transformation properties', () => {
      fc.assert(fc.property(
        fc.record({
          features: fc.array(fc.string({ minLength: 1, maxLength: 20 })),
          settings: fc.record({
            enabled: fc.boolean(),
            threshold: fc.integer({ min: 0, max: 100 })
          })
        }),
        (config) => {
          // Property: Serialization preserves structure
          const serialized = encodeDecodeJson(config);
          expect(serialized).toEqual(config);

          // Property: Feature list sorting is consistent
          const sorted1 = sortArray(config.features);
          const sorted2 = sortArray(sorted1);
          expect(sorted1).toEqual(sorted2);

          // Property: Threshold stays in valid range
          expect(config.settings.threshold).toBeGreaterThanOrEqual(0);
          expect(config.settings.threshold).toBeLessThanOrEqual(100);
        }
      ), { numRuns: 100 });
    });
  });
});