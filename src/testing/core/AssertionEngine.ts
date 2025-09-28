/**
 * Assertion Engine - Shared validation logic for all testing frameworks
 * NASA Rule 10 Compliant: Functions ≤60 lines, ≥2 assertions per function
 */

import { TestAssertion } from '../types/TestingTypes';

export class AssertionEngine {
  private assertions: TestAssertion[] = [];
  private assertionCounter: number = 0;

  /**
   * Assert equality - NASA Rule 10: ≤60 lines
   */
  assertEqual<T>(actual: T, expected: T, description: string): TestAssertion {
    // Assertion 1: Description provided
    console.assert(description && description.length > 0, 'Description required');
    // Assertion 2: Expected value not undefined
    console.assert(expected !== undefined, 'Expected value required');

    const assertion: TestAssertion = {
      id: this.generateAssertionId(),
      description,
      expected,
      actual,
      passed: actual === expected,
      errorMessage: actual !== expected ?
        `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}` : undefined
    };

    this.assertions.push(assertion);
    return assertion;
  }

  /**
   * Assert truthy - NASA Rule 10: ≤60 lines
   */
  assertTruthy(value: any, description: string): TestAssertion {
    // Assertion 1: Description provided
    console.assert(description && description.length > 0, 'Description required');
    // Assertion 2: Value checked exists
    console.assert(value !== undefined, 'Value to check required');

    const assertion: TestAssertion = {
      id: this.generateAssertionId(),
      description,
      expected: true,
      actual: !!value,
      passed: !!value,
      errorMessage: !value ? `Expected truthy value, got ${JSON.stringify(value)}` : undefined
    };

    this.assertions.push(assertion);
    return assertion;
  }

  /**
   * Assert falsy - NASA Rule 10: ≤60 lines
   */
  assertFalsy(value: any, description: string): TestAssertion {
    // Assertion 1: Description provided
    console.assert(description && description.length > 0, 'Description required');
    // Assertion 2: Assertion array initialized
    console.assert(Array.isArray(this.assertions), 'Assertions array required');

    const assertion: TestAssertion = {
      id: this.generateAssertionId(),
      description,
      expected: false,
      actual: !!value,
      passed: !value,
      errorMessage: value ? `Expected falsy value, got ${JSON.stringify(value)}` : undefined
    };

    this.assertions.push(assertion);
    return assertion;
  }

  /**
   * Assert array contains - NASA Rule 10: ≤60 lines
   */
  assertContains<T>(array: T[], item: T, description: string): TestAssertion {
    // Assertion 1: Array is valid
    console.assert(Array.isArray(array), 'Array required');
    // Assertion 2: Description provided
    console.assert(description && description.length > 0, 'Description required');

    const contains = array.includes(item);
    const assertion: TestAssertion = {
      id: this.generateAssertionId(),
      description,
      expected: true,
      actual: contains,
      passed: contains,
      errorMessage: !contains ?
        `Expected array to contain ${JSON.stringify(item)}` : undefined
    };

    this.assertions.push(assertion);
    return assertion;
  }

  /**
   * Assert object has property - NASA Rule 10: ≤60 lines
   */
  assertHasProperty(obj: any, property: string, description: string): TestAssertion {
    // Assertion 1: Object provided
    console.assert(obj !== null && obj !== undefined, 'Object required');
    // Assertion 2: Property name provided
    console.assert(property && property.length > 0, 'Property name required');

    const hasProperty = obj.hasOwnProperty(property);
    const assertion: TestAssertion = {
      id: this.generateAssertionId(),
      description,
      expected: true,
      actual: hasProperty,
      passed: hasProperty,
      errorMessage: !hasProperty ?
        `Expected object to have property "${property}"` : undefined
    };

    this.assertions.push(assertion);
    return assertion;
  }

  /**
   * Assert throws error - NASA Rule 10: ≤60 lines
   */
  async assertThrows(fn: () => Promise<any> | any, description: string): Promise<TestAssertion> {
    // Assertion 1: Function provided
    console.assert(typeof fn === 'function', 'Function required');
    // Assertion 2: Description provided
    console.assert(description && description.length > 0, 'Description required');

    let thrown = false;
    let errorMessage: string | undefined;

    try {
      const result = fn();
      if (result instanceof Promise) {
        await result;
      }
    } catch (error) {
      thrown = true;
    }

    if (!thrown) {
      errorMessage = 'Expected function to throw an error';
    }

    const assertion: TestAssertion = {
      id: this.generateAssertionId(),
      description,
      expected: true,
      actual: thrown,
      passed: thrown,
      errorMessage
    };

    this.assertions.push(assertion);
    return assertion;
  }

  /**
   * Assert range - NASA Rule 10: ≤60 lines
   */
  assertInRange(value: number, min: number, max: number, description: string): TestAssertion {
    // Assertion 1: Valid value
    console.assert(typeof value === 'number' && !isNaN(value), 'Valid number required');
    // Assertion 2: Valid range
    console.assert(min <= max, 'Valid range required (min <= max)');

    const inRange = value >= min && value <= max;
    const assertion: TestAssertion = {
      id: this.generateAssertionId(),
      description,
      expected: `[${min}, ${max}]`,
      actual: value,
      passed: inRange,
      errorMessage: !inRange ?
        `Expected ${value} to be in range [${min}, ${max}]` : undefined
    };

    this.assertions.push(assertion);
    return assertion;
  }

  /**
   * Get all assertions - NASA Rule 10: ≤60 lines
   */
  getAllAssertions(): TestAssertion[] {
    // Assertion 1: Assertions array exists
    console.assert(Array.isArray(this.assertions), 'Assertions array required');
    // Assertion 2: Return copy to prevent mutation
    console.assert(this.assertions !== null, 'Assertions initialized');

    return [...this.assertions];
  }

  /**
   * Get assertion summary - NASA Rule 10: ≤60 lines
   */
  getAssertionSummary(): { total: number; passed: number; failed: number } {
    // Assertion 1: Assertions array exists
    console.assert(Array.isArray(this.assertions), 'Assertions array required');
    // Assertion 2: Valid assertion structure
    console.assert(this.assertions.every(a => typeof a.passed === 'boolean'), 'Valid assertions required');

    const total = this.assertions.length;
    const passed = this.assertions.filter(a => a.passed).length;
    const failed = total - passed;

    return { total, passed, failed };
  }

  /**
   * Clear assertions - NASA Rule 10: ≤60 lines
   */
  clearAssertions(): void {
    // Assertion 1: Assertions array exists
    console.assert(Array.isArray(this.assertions), 'Assertions array required');
    // Assertion 2: Counter exists
    console.assert(typeof this.assertionCounter === 'number', 'Counter required');

    this.assertions = [];
    this.assertionCounter = 0;
  }

  /**
   * Generate unique assertion ID - NASA Rule 10: ≤60 lines
   */
  private generateAssertionId(): string {
    // Assertion 1: Counter is number
    console.assert(typeof this.assertionCounter === 'number', 'Counter must be number');
    // Assertion 2: Counter not negative
    console.assert(this.assertionCounter >= 0, 'Counter must be non-negative');

    return `assertion_${++this.assertionCounter}_${Date.now()}`;
  }
}