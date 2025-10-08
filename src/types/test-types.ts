/**
 * test-types - Test framework type definitions
 * NASA Rule 10 Compliant
 */
// Global test framework types
declare global {
  /**
   * Jest/Vitest expect function
   */
  function expect(value: any): {
        toBe(expected: any): void;
    toEqual(expected: any): void;
    toBeDefined(): void;
    toBeUndefined(): void;
    toBeNull(): void;
    toBeTruthy(): void;
    toBeFalsy(): void;
    toContain(item: any): void;
    toThrow(error?: string | RegExp | Error): void;
    toHaveBeenCalled(): void;
    toHaveBeenCalledWith(...args: any[]): void;
    toHaveBeenCalledTimes(times: number): void;
    toHaveProperty(property: string, value?: any): void;
    toMatch(pattern: string | RegExp): void;
    toMatchObject(object: any): void;
    toMatchSnapshot(): void;
    not: {
      toBe(expected: any): void;
      toEqual(expected: any): void;
      toBeDefined(): void;
      toBeUndefined(): void;
      toBeNull(): void;
      toBeTruthy(): void;
      toBeFalsy(): void;
      toContain(item: any): void;
      toThrow(error?: string | RegExp | Error): void;
    };
  };
  function describe(name: string, fn: () => void): void;
  function it(name: string, fn: () => void | Promise<void>): void;
  function test(name: string, fn: () => void | Promise<void>): void;
  function beforeEach(fn: () => void | Promise<void>): void;
  function afterEach(fn: () => void | Promise<void>): void;
  function beforeAll(fn: () => void | Promise<void>): void;
  function afterAll(fn: () => void | Promise<void>): void;
}
export {};
export interface TestResult {
  passed: boolean;
  tests: number;
  failures: number;
  errors: number;
  skipped: number;
  duration: number;
}